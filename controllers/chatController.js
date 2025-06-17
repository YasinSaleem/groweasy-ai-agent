const { supabase } = require('../db/supabase');
const geminiModel = require('../models/geminiModel');

class ChatController {
    constructor() {
        this.requiredFields = [
            'location',
            'propertyType',
            'budget',
            'timeline',
            'purpose'
        ];
        this.MAX_GIBBERISH_ATTEMPTS = 3; // Increased threshold
        this.propertyTypeSynonyms = {
            'villa': ['villa', 'house', 'bungalow', 'independent house'],
            'flat': ['flat', 'apartment', 'condo', 'condominium'],
            'plot': ['plot', 'land', 'empty land', 'vacant land']
        };
    }

    async startChat(req, res) {
        try {
            const { name, phone, source } = req.body;
            
            if (!name || !phone) {
                return res.status(400).json({ error: "Name and phone are required" });
            }

            // Check existing lead
            const { data: existingLead } = await supabase
                .from('leads')
                .select('id, metadata, gibberish_count')
                .eq('phone', phone)
                .single();

            let leadId, response, metadata;
            if (existingLead) {
                leadId = existingLead.id;
                response = await geminiModel.generateGreeting(true, name);
                metadata = existingLead.metadata || { completedFields: [] };
            } else {
                // Create new lead
                const { data: newLead } = await supabase
                    .from('leads')
                    .insert([{
                        phone, 
                        name, 
                        source,
                        status: 'new',
                        metadata: { completedFields: [] },
                        gibberish_count: 0,
                        last_contact: new Date().toISOString()
                    }])
                    .select('id')
                    .single();

                leadId = newLead.id;
                response = await geminiModel.generateGreeting(false, name);
                metadata = { completedFields: [] };
            }

            const firstQuestion = this._getNextQuestion(metadata);
            response = `${response} ${firstQuestion}`;

            await this._saveConversation(leadId, 'agent', response);

            res.json({
                leadId,
                response,
                metadata,
                meta: this._getProgressMeta(metadata)
            });

        } catch (error) {
            console.error("Start Error:", error);
            res.status(500).json({ 
                error: "Chat initialization failed",
                details: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }

    async continueChat(req, res) {
        try {
            const { leadId, message } = req.body;
            
            if (!leadId || !message?.trim()) {
                return res.status(400).json({ error: "Valid leadId and message required" });
            }

            // Get lead and history
            const [{ data: lead }, { data: history }] = await Promise.all([
                supabase.from('leads').select('*').eq('id', leadId).single(),
                supabase.from('conversations')
                    .select('role, content')
                    .eq('lead_id', leadId)
                    .order('created_at', { ascending: true })
            ]);

            if (!lead) return res.status(404).json({ error: "Lead not found" });

            // Enhanced gibberish check with more tolerance
            const { isGibberish, reason } = await geminiModel.isGibberish(message, history);
            let gibberishCount = lead.gibberish_count || 0;
            
            if (isGibberish) {
                gibberishCount += 1;
                
                await supabase
                    .from('leads')
                    .update({ gibberish_count: gibberishCount })
                    .eq('id', leadId);

                if (gibberishCount >= this.MAX_GIBBERISH_ATTEMPTS) {
                    const classification = {
                        classification: 'invalid',
                        reasons: [`Multiple unclear responses: ${reason}`],
                        confidence: 80 // Reduced confidence
                    };

                    await Promise.all([
                        this._saveConversation(leadId, 'user', message),
                        this._saveConversation(leadId, 'agent', 'Please contact our support team if you need further assistance!'),
                        supabase.from('leads').update({
                            status: 'invalid',
                            classification_reasons: classification.reasons,
                            last_classified_at: new Date().toISOString(),
                            last_contact: new Date().toISOString()
                        }).eq('id', leadId)
                    ]);

                    return res.json({
                        leadId,
                        response: 'Please contact our support team if you need further assistance!',
                        metadata: lead.metadata || {},
                        classification
                    });
                }

                const response = 'Could you please rephrase or provide more details about your requirements?';
                await this._saveConversation(leadId, 'agent', response);
                return res.json({
                    leadId,
                    response,
                    metadata: lead.metadata || {},
                    classification: {
                        classification: 'warm',
                        reasons: ['Needs clarification'],
                        confidence: 60
                    }
                });
            }

            // Save user message
            await this._saveConversation(leadId, 'user', message);

            // Enhanced information extraction
            const confirmedInfo = this._extractConfirmedInfo(message, history, lead.metadata || {});

            // Get AI response with better context handling
            const { text: aiResponse, metadata: newMetadata } = await geminiModel.generateResponse(
                message,
                { 
                    metadata: { ...lead.metadata, ...confirmedInfo },
                    history: history,
                    confirmedInfo: confirmedInfo,
                    lastQuestion: history.slice().reverse().find(m => m.role === 'agent')?.content
                }
            );

            // Improved response cleaning
            let cleanResponse = this._cleanResponse(aiResponse, history);
            
            // Merge metadata
            const updatedMetadata = this._mergeMetadata(
                lead.metadata || {},
                this._validateMetadata({ ...newMetadata, ...confirmedInfo })
            );

            // Enhanced duplicate question prevention
            const nextQuestion = this._getNextQuestion(updatedMetadata);
            const isRedundant = this._isRedundantQuestion(cleanResponse, updatedMetadata, history);
            
            let finalResponse = isRedundant ? nextQuestion : cleanResponse;

            // Check if we have complete info
            const isComplete = this.requiredFields.every(f => 
                updatedMetadata.completedFields.includes(f)
            );

            if (isComplete) {
                finalResponse = `Great! I'll find ${this._formatSummary(updatedMetadata)} options. ` +
                               `Would you like me to send similar properties?`;
            }

            // More accurate classification
            let classification = await geminiModel.classifyConversation(
                [...history.slice(-3), { role: 'user', content: message }],
                updatedMetadata
            );

            // Save and respond
            await Promise.all([
                this._saveConversation(leadId, 'agent', finalResponse),
                supabase.from('leads').update({
                    metadata: updatedMetadata,
                    status: isComplete ? 'hot' : classification.classification,
                    classification_reasons: isComplete 
                        ? ['Completed all required fields'] 
                        : classification.reasons,
                    gibberish_count: 0, // Reset on valid message
                    last_classified_at: new Date().toISOString(),
                    last_contact: new Date().toISOString()
                }).eq('id', leadId)
            ]);

            res.json({
                leadId,
                response: finalResponse,
                metadata: updatedMetadata,
                meta: this._getProgressMeta(updatedMetadata),
                classification: {
                    ...classification,
                    classification: isComplete ? 'hot' : classification.classification
                }
            });

        } catch (error) {
            console.error("Continue Error:", error);
            res.status(500).json({ 
                error: "Conversation error",
                details: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }

    _extractConfirmedInfo(message, history, existingMetadata) {
        const info = {};
        const lowerMessage = message.toLowerCase();
        
        // Enhanced location extraction
        if (!existingMetadata.location) {
            const locationPatterns = [
                /(?:in|at|near|around|interested in|looking at)\s+([a-zA-Z\s]+nagar|[\w\s]+)/i,
                /(?:location|area|neighborhood)\s*(?:is|:)?\s*([a-zA-Z\s]+)/i
            ];
            
            for (const pattern of locationPatterns) {
                const match = lowerMessage.match(pattern);
                if (match && match[1].trim().length > 3) {
                    info.location = match[1].trim();
                    break;
                }
            }
        }

        // Enhanced property type extraction
        if (!existingMetadata.propertyType) {
            for (const [type, synonyms] of Object.entries(this.propertyTypeSynonyms)) {
                if (synonyms.some(syn => 
                    lowerMessage.includes(syn) || 
                    history.some(h => h.role === 'user' && h.content.toLowerCase().includes(syn)))
                ) {
                    info.propertyType = type;
                    break;
                }
            }
        }

        // Extract budget
        if (!existingMetadata.budget) {
            const budgetMatch = message.match(/(\d+\s*(lakh|lac|l|cr|crore|c))/i);
            if (budgetMatch) {
                info.budget = budgetMatch[1].toUpperCase();
            }
        }

        // Extract timeline
        if (!existingMetadata.timeline) {
            const timelineMatch = message.match(/(\d+\s*(months|month|m|days|day|d|years|year|y))/i);
            if (timelineMatch) {
                const num = timelineMatch[1];
                const unit = timelineMatch[2][0].toLowerCase();
                info.timeline = `${num}${unit}`;
            }
        }

        return info;
    }

    _cleanResponse(response, history) {
        // Remove any technical artifacts
        let clean = response.replace(/\{.*?\}/g, '')
                          .replace(/%%/g, '')
                          .replace(/\[.*?\]/g, '')
                          .trim();
        
        // If response seems incomplete or technical
        if (clean.length < 5 || /[{}%%\[\]]/.test(clean)) {
            const lastQuestion = history.slice().reverse().find(m => m.role === 'agent')?.content;
            if (lastQuestion) {
                return "Could you provide more details about that?";
            }
            return "What else should I know about your property needs?";
        }
        
        return clean;
    }

    _isRedundantQuestion(response, metadata, history) {
        const lowerResponse = response.toLowerCase();
        const lastAgentMessages = history
            .filter(m => m.role === 'agent')
            .slice(-2)
            .map(m => m.content.toLowerCase());
        
        // Check for recently asked questions
        const recentlyAsked = lastAgentMessages.some(msg => 
            msg.includes(lowerResponse) || 
            this._questionsAreSimilar(msg, lowerResponse)
        );
        
        // Check for already answered questions
        const alreadyAnswered = (
            (metadata.location && lowerResponse.includes('neighborhood')) ||
            (metadata.propertyType && lowerResponse.includes('type of property')) ||
            (metadata.budget && lowerResponse.includes('budget')) ||
            (metadata.timeline && lowerResponse.includes('timeline'))
        );
        
        return recentlyAsked || alreadyAnswered;
    }

    _questionsAreSimilar(q1, q2) {
        const keywords = ['location', 'property', 'budget', 'timeline', 'purpose'];
        return keywords.some(kw => q1.includes(kw) && q2.includes(kw));
    }

    _generateCompleteClassificationReason(metadata) {
        const parts = [];
        if (metadata.location) parts.push(`location (${metadata.location})`);
        if (metadata.propertyType) parts.push(`property type (${metadata.propertyType})`);
        if (metadata.budget) parts.push(`budget (~${metadata.budget})`);
        if (metadata.timeline) {
            const timelineText = metadata.timeline.endsWith('M') 
                ? `${metadata.timeline.replace('M', '')} months`
                : metadata.timeline;
            parts.push(`timeline (${timelineText})`);
        }
        return `Complete details: ${parts.join(', ')}`;
    }

    _validateMetadata(newMetadata) {
        const valid = {};
        for (const [key, value] of Object.entries(newMetadata)) {
            if (this.requiredFields.includes(key) && value) {
                valid[key] = value;
            }
        }
        return valid;
    }

    _mergeMetadata(existingMetadata, validatedNewMetadata) {
        return {
            ...existingMetadata,
            ...validatedNewMetadata,
            completedFields: [
                ...new Set([
                    ...(existingMetadata.completedFields || []),
                    ...Object.keys(validatedNewMetadata)
                ])
            ]
        };
    }

    _getNextQuestion(metadata = {}) {
        const missingFields = this.requiredFields.filter(f => 
            !metadata.completedFields?.includes(f)
        );

        const questionMap = {
            location: "Which neighborhood are you interested in?",
            propertyType: "What type of property are you looking for? (flat/villa/plot)",
            budget: "What's your budget range? (e.g., 50L-80L or 2Cr)",
            timeline: "What's your preferred timeline? (e.g., 3M for 3 months)",
            purpose: "Is this for investment or personal use?"
        };

        return missingFields.length > 0 
            ? questionMap[missingFields[0]]
            : "Is there anything else I should know?";
    }

    _getProgressMeta(metadata = {}) {
        return this.requiredFields.map(field => ({
            field,
            completed: metadata.completedFields?.includes(field) || false,
            value: metadata[field] || null
        }));
    }

    _formatSummary(metadata) {
        const parts = [];
        if (metadata.propertyType) parts.push(metadata.propertyType);
        if (metadata.location) parts.push(`in ${metadata.location}`);
        if (metadata.budget) {
            if (metadata.budget.includes('L')) parts.push(`(~₹${metadata.budget.replace('L', '')} Lakh)`);
            else if (metadata.budget.includes('Cr')) parts.push(`(~₹${metadata.budget.replace('Cr', '')} Crore)`);
            else parts.push(`(~₹${metadata.budget})`);
        }
        if (metadata.timeline) {
            if (metadata.timeline.endsWith('D')) parts.push(`within ${metadata.timeline.replace('D', '')} days`);
            else if (metadata.timeline.endsWith('M')) parts.push(`within ${metadata.timeline.replace('M', '')} months`);
            else if (metadata.timeline.endsWith('Y')) parts.push(`within ${metadata.timeline.replace('Y', '')} years`);
        }
        return parts.join(' ');
    }

    async _saveConversation(leadId, role, content) {
        const { error } = await supabase
            .from('conversations')
            .insert([{
                lead_id: leadId,
                role,
                content: content.substring(0, 1000),
                created_at: new Date().toISOString()
            }]);

        if (error) throw new Error(`Failed to save message: ${error.message}`);
    }
}

module.exports = new ChatController();