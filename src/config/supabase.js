const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

// Initialize Supabase client
const supabase = createClient(
    config.supabase.url,
    config.supabase.anonKey
);

module.exports = supabase; 