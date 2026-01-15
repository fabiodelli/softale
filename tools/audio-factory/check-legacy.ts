
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

async function listLegacy() {
    console.log("📂 Scanning 'audio/legacy'...");

    const { data, error } = await supabase.storage.from('audio').list('legacy', { limit: 100 });

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${data.length} items in root of legacy:`);
    for (const item of data) {
        console.log(`- ${item.name} (${item.id ? 'FILE' : 'FOLDER'})`);

        if (!item.id) {
            // List subfolder
            const { data: sub } = await supabase.storage.from('audio').list(`legacy/${item.name}`);
            if (sub) {
                console.log(`  --> Contains ${sub.length} items`);
                sub.forEach(s => console.log(`      - ${s.name}`));
            }
        }
    }
}

listLegacy();
