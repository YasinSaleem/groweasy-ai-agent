const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and Key must be defined in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    }
});

// Test connection
(async () => {
    try {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .limit(1);
        
        if (error) throw error;
        console.log('Supabase connected successfully');
    } catch (error) {
        console.error('Supabase connection error:', error.message);
    }
})();

module.exports = { supabase };