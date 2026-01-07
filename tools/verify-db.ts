
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('🔍 Testing Supabase Connection...');
    console.log('URL:', supabaseUrl);

    try {
        const { data, error } = await supabase.from('stories').select('*').order('created_at', { ascending: false }).limit(5);

        if (error) {
            console.error('❌ Error fetching stories:', error.message);
        } else {
            console.log(`✅ Success! Found ${data.length} stories.`);
            console.log(data);
        }
    } catch (e) {
        console.error('❌ Unexpected error:', e);
    }
}

verify();
