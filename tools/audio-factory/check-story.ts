
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkStories() {
    console.log("🔍 Searching for 'Rain' or 'Forest' stories...");

    const { data, error } = await supabase
        .from('stories')
        .select('id, title, audio_url, cover_url')
        .or('title.ilike.%Rain%,title.ilike.%Forest%');

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (data.length === 0) {
        console.log("✅ No stories found matching 'Rain' or 'Forest'.");
    } else {
        console.log(`⚠️ Found ${data.length} potential matches:`);
        data.forEach(s => {
            console.log(`\n- Title: "${s.title}"`);
            console.log(`  Audio: ${s.audio_url}`);
            console.log(`  Cover: ${s.cover_url}`);

            if (s.audio_url && s.audio_url.includes('legacy')) {
                console.log("  🚨 USES LEGACY FOLDER!");
            } else {
                console.log("  ✅ Uses new folder structure.");
            }
        });
    }
}

checkStories();
