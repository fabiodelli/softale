import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from root .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// Google Sound Library (Royalty Free)
const SOUNDS = [
    { name: 'rain.mp3', url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg' },
    { name: 'forest.mp3', url: 'https://actions.google.com/sounds/v1/ambiences/forest_morning.ogg' },
    { name: 'fire.mp3', url: 'https://actions.google.com/sounds/v1/ambiences/fireplace.ogg' },
    { name: 'wind.mp3', url: 'https://actions.google.com/sounds/v1/weather/wind_strong_cold.ogg' },
    // Using OGG source but saving as MP3 filename for compatibility with our logic (browser plays both anyway)
    // Ideally we should use correct extension, but for now let's stick to the names expected by the app
];

async function seed() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase Keys in .env of current directory');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🌱 Seeding Ambient Audio...');

    for (const sound of SOUNDS) {
        console.log(`   Downloading ${sound.name}...`);
        try {
            const response = await axios.get(sound.url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            console.log(`   Uploading to Supabase (audio/ambient/${sound.name})...`);

            const { error } = await supabase.storage
                .from('audio')
                .upload(`ambient/${sound.name}`, buffer, {
                    contentType: 'audio/ogg', // Correct mime type for source
                    upsert: true
                });

            if (error) {
                console.error(`   ❌ Failed to upload ${sound.name}:`, error.message);
            } else {
                console.log(`   ✅ Success: ${sound.name}`);
            }

        } catch (e) {
            console.error(`   ❌ Failed to fetch ${sound.url}:`, e);
        }
    }

    console.log('✨ Seeding complete!');
}

seed();
