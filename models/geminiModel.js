const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const METADATA_DELIMITER = '%%';

class GeminiModel {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: {
                maxOutputTokens: 300,
                temperature: 0.2
            }
        });
    }

    async generateGreeting(isReturning, name) {
        const prompt = `Generate a ${isReturning ? 'welcome back' : 'welcome'} message for ${name}:
        - ${isReturning ? 'Welcome them back' : 'Thank them for reaching out'}
        - Mention you're the GrowEasy real estate assistant
        - Single sentence only
        Example: "Thank you for contacting GrowEasy, ${name}! How can I assist you today?"`;
        
        const result = await this.model.generateContent(prompt);
        return await result.response.text();
    }

    async generateResponse(message, context = {}) {
        try {
            const prompt = `Analyze this real estate inquiry carefully:
User Message: "${message}"

Current Known Details:
${JSON.stringify(context.metadata || {}, null, 2)}

STRICT RULES:
1. FIRST acknowledge the user's message briefly
2. THEN extract ANY new field values you find
3. FINALLY ask for ONLY THE NEXT MISSING FIELD in this order:
   location → propertyType → budget → timeline → purpose
4. Format extracted fields like this: %%key:value%%
5. NEVER show metadata or JSON to user
6. If all fields are complete, confirm details

EXAMPLE 1:
User: "I want a villa"
Response: "Got it, you're looking for a villa. What's your preferred location?"

EXAMPLE 2:
User: "Around 50L budget"
Response: "Understood, your budget is ~50L. What's your timeline for purchase?"

EXAMPLE 3 (all fields complete):
Response: "Great! I'll find villa options matching your requirements."`;

            const result = await this.model.generateContent({
                contents: [{
                    role: "user",
                    parts: [{ text: prompt }]
                }]
            });
            
            const response = await result.response.text();
            return this._parseAugmentedResponse(response);

        } catch (error) {
            console.error('Gemini Error:', error);
            return {
                text: "Let me check my options. Could you clarify your needs?",
                metadata: {}
            };
        }
    }

    async isGibberish(message) {
        const prompt = `Analyze if this real estate message is gibberish/test content:
Message: "${message}"

Rules:
1. Gibberish includes: random letters, numbers, repeated patterns
2. Even number sequences can be gibberish if they don't relate to real estate
3. Very short messages (<3 chars) are gibberish

Respond STRICTLY with this JSON format:
{
  "isGibberish": boolean,
  "reason": string
}`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response.text();
            const jsonStart = response.indexOf('{');
            const jsonEnd = response.lastIndexOf('}') + 1;
            const parsed = JSON.parse(response.slice(jsonStart, jsonEnd));
            
            if (/^\d{5,}$/.test(message.trim())) {
                return {
                    isGibberish: true,
                    reason: 'Random number sequence'
                };
            }
            
            return parsed;
        } catch (error) {
            console.error('Gibberish detection error:', error);
            return {
                isGibberish: this._basicGibberishCheck(message),
                reason: 'Failed to analyze - basic check'
            };
        }
    }

    async classifyConversation(history) {
        try {
            const lastThree = history.slice(-3).map(m => `${m.role}: ${m.content}`);
            const prompt = `Analyze ONLY these recent messages:
${lastThree.join('\n')}

CLASSIFICATION RULES:
1. HOT: Must have ALL - specific location, exact budget, property type, timeline <6mo
2. COLD: Missing 2+ requirements
3. INVALID: Gibberish/test/spam

Respond ONLY with this JSON format:
{
  "classification": "HOT|COLD|INVALID",
  "reasons": ["specific", "reasons"],
  "confidence": 0-100
}`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response.text();
            return this._parseClassification(response);
        } catch (error) {
            console.error('Classification Error:', error);
            return {
                classification: 'cold',
                reasons: ['Classification failed'],
                confidence: 50
            };
        }
    }

    _basicGibberishCheck(message) {
        const trimmed = message.trim();
        if (trimmed.length < 3) return true;
        if (/^(.)\1+$/.test(trimmed)) return true;
        if (/^\d{5,}$/.test(trimmed)) return true;
        if (/^[asdfghjkl]+$/i.test(trimmed)) return true;
        return false;
    }

    _parseAugmentedResponse(text) {
        const metadata = {};
        // First remove any accidental JSON strings
        let cleanText = text.replace(/\{.*?\}/gs, '');
        
        const metaRegex = new RegExp(`${METADATA_DELIMITER}(.+?):(.+?)${METADATA_DELIMITER}`, 'g');
        cleanText = cleanText.replace(metaRegex, (match, key, value) => {
            metadata[key.trim().toLowerCase()] = value.trim();
            return '';
        }).trim();

        // Final cleanup of any remaining artifacts
        cleanText = cleanText
            .replace(/\s+/g, ' ')
            .replace(/%%/g, '')
            .trim();

        return { 
            text: cleanText || "What else should I know about your property needs?",
            metadata: this._normalizeMetadata(metadata)
        };
    }

    _parseClassification(text) {
        try {
            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}') + 1;
            const parsed = JSON.parse(text.slice(jsonStart, jsonEnd));
            
            return {
                classification: ['HOT','COLD','INVALID'].includes(parsed.classification) 
                    ? parsed.classification.toLowerCase() 
                    : 'cold',
                reasons: Array.isArray(parsed.reasons) 
                    ? parsed.reasons 
                    : [parsed.reasons || 'Unknown'],
                confidence: Math.min(100, Math.max(0, 
                    parseInt(parsed.confidence) || 50))
            };
        } catch {
            return {
                classification: 'cold',
                reasons: ['Invalid classification response'],
                confidence: 50
            };
        }
    }

    _normalizeMetadata(rawMetadata) {
        const normalized = {};
        
        if (rawMetadata.propertytype) {
            const propType = rawMetadata.propertytype.toLowerCase();
            if (/villa|house|bungalow/i.test(propType)) normalized.propertyType = 'villa';
            else if (/flat|apartment|residential|^\d+bhk/i.test(propType)) normalized.propertyType = 'apartment';
            else if (/plot|land|empty/i.test(propType)) normalized.propertyType = 'plot';
        }

        if (rawMetadata.location) {
            normalized.location = rawMetadata.location
                .split(/,|;|\./)[0]
                .replace(/\b(area|near|in)\b/gi, '')
                .trim();
        }

        if (rawMetadata.budget) {
            const budgetStr = rawMetadata.budget.toLowerCase().replace(/,/g, '');
            
            if (budgetStr.includes('l') || budgetStr.includes('lac') || budgetStr.includes('lakh')) {
                const numMatch = budgetStr.match(/(\d+\.?\d*)/);
                if (numMatch) normalized.budget = `${numMatch[1]}L`;
            }
            else if (budgetStr.includes('cr') || budgetStr.includes('crore')) {
                const numMatch = budgetStr.match(/(\d+\.?\d*)/);
                if (numMatch) normalized.budget = `${numMatch[1]}Cr`;
            }
            else {
                const numMatch = budgetStr.match(/(\d+\.?\d*)/);
                if (numMatch) normalized.budget = numMatch[1];
            }
        }

        if (rawMetadata.timeline) {
            const timeline = rawMetadata.timeline.toLowerCase();
            if (/immediate|asap|urgent/i.test(timeline)) {
                normalized.timeline = '1M';
            } 
            else if (/(\d+)\s*(day|d)/i.test(timeline)) {
                normalized.timeline = timeline.match(/(\d+)\s*(day|d)/i)[1] + 'D';
            }
            else if (/(\d+)\s*(month|mth|m)/i.test(timeline)) {
                normalized.timeline = timeline.match(/(\d+)\s*(month|mth|m)/i)[1] + 'M';
            }
            else if (/(\d+)\s*(year|yr|y)/i.test(timeline)) {
                normalized.timeline = timeline.match(/(\d+)\s*(year|yr|y)/i)[1] + 'Y';
            }
            else {
                const numMatch = timeline.match(/(\d+)/);
                if (numMatch) normalized.timeline = numMatch[1] + 'M';
            }
        }

        if (rawMetadata.purpose) {
            normalized.purpose = /invest|rent|ROI/i.test(rawMetadata.purpose) 
                ? 'investment' 
                : 'personal';
        }

        return normalized;
    }
}

module.exports = new GeminiModel();