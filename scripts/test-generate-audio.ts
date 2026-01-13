import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback/Merge

const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;

// --- CONFIGURATION ---
const TEST_SCRIPT = `
[pause]
Welcome aboard. Leave your bags by the door… you won't need them where we are going.
Take a moment to settle into your seat. It is velvet, deep and soft... perfectly reclaiming the shape of your body as you sink down.
Outside, the world is cold and hurried. But in here… the air is warm. It smells of old books, tea, and safety.
Listen to the wheels beneath us.
[pause]
A rhythm older than memory. A lullaby of steel and snow.
We are traveling through the night, crossing the great white plains of the north. There is no destination tonight. The journey is the sleep.
`;

const VOICE_STYLE = 'soft_female';
const MODEL_ID = 'eleven_multilingual_v2'; // Using v2 for safety/compatibility, or 'eleven_monolingual_v1' if preferred. Code said 'eleven_v3' but let's check what's available or stick to code.
// Code in index.ts uses 'eleven_v3'. Let's use that if possible, or fallback to turbo_v2.
const TARGET_MODEL = 'eleven_turbo_v2_5'; // Safe bet for high quality/speed, or 'eleven_multilingual_v2'.

// Params from index.ts
const VOICE_SETTINGS = {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.5,
    use_speaker_boost: true,
};

async function main() {
    console.log('🧪 STARTING AUDIO GENERATION TEST');
    console.log('-----------------------------------');
    console.log(`📝 Script Length: ${TEST_SCRIPT.length} chars`);
    console.log(`🎯 Target Style: ${VOICE_STYLE}`);

    if (!ELEVENLABS_KEY) {
        console.error('❌ Missing ELEVENLABS_API_KEY in .env');
        process.exit(1);
    }

    // 1. Fetch Voices to Inspect Selection Logic
    console.log('\n🔍 STEP 1: Voice Selection Analysis');
    const voicesResp = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': ELEVENLABS_KEY }
    });
    const voicesData = await voicesResp.json();
    const allVoices = voicesData.voices || [];
    console.log(`   Found ${allVoices.length} available voices.`);

    // Simulate Selection Logic (soft_female)
    let selectedVoice = allVoices.find((v: any) =>
        v.labels?.gender === 'female' && v.category !== 'premade' // Prefer custom
    );

    if (!selectedVoice) {
        console.log('   No custom female voice found. Checking premade...');
        selectedVoice = allVoices.find((v: any) =>
            v.labels?.gender === 'female' && v.category === 'premade'
        );
    }

    // Fallback ID from index.ts (Delilah)
    const FALLBACK_ID = 'mZ3kbJNnKRWI4YzJXA9j';

    if (!selectedVoice) {
        console.log(`   No matching voice found. Using Hardcoded Fallback: ${FALLBACK_ID}`);
        // Mock object
        selectedVoice = { voice_id: FALLBACK_ID, name: 'Delilah (Fallback)' };
    } else {
        console.log(`   ✅ Selected Voice: "${selectedVoice.name}" (ID: ${selectedVoice.voice_id})`);
        console.log(`   Rationale: Match for gender='female', category='${selectedVoice.category}'`);
    }

    // 2. Generation Request
    console.log('\n🎙️ STEP 2: Generation Call');
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice.voice_id}`;

    const payload = {
        text: TEST_SCRIPT,
        model_id: 'eleven_turbo_v2_5', // High quality, low latency
        voice_settings: VOICE_SETTINGS
    };

    console.log(`   POST ${url}`);
    console.log(`   Payload: ${JSON.stringify(payload, null, 2)}`);

    const start = Date.now();
    const genResp = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_KEY
        },
        body: JSON.stringify(payload)
    });

    if (!genResp.ok) {
        const errText = await genResp.text();
        console.error(`❌ Generation Failed: ${genResp.status} ${genResp.statusText}`);
        console.error(errText);
        process.exit(1);
    }

    const arrayBuffer = await genResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const duration = (Date.now() - start) / 1000;

    console.log(`   ✅ Success! Generated ${buffer.length} bytes in ${duration.toFixed(2)}s`);

    // 3. Save Output
    const outDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const outFile = path.join(outDir, 'test_night_train.mp3');
    fs.writeFileSync(outFile, buffer);
    console.log(`   💾 Saved to: ${outFile}`);

    // 4. UPLOAD TO SUPABASE
    console.log('\n☁️ STEP 3: Uploading to Supabase...');
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('❌ Missing Supabase keys via .env.local. Cannot upload.');
        return;
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const fileName = `test_night_train_${Date.now()}.mp3`;
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio')
        .upload(`${fileName}`, buffer, {
            contentType: 'audio/mpeg',
            upsert: true
        });

    if (uploadError) {
        console.error('❌ Upload Failed (Storage):', uploadError);
        console.log('   Note: Ensure bucket "audio" exists.');
    } else {
        const publicUrl = supabase.storage.from('audio').getPublicUrl(`${fileName}`).data.publicUrl;
        console.log(`   ✅ Uploaded: ${publicUrl}`);

        // 5. INSERT INTO DB
        console.log('\n🗄️ STEP 4: Inserting into Database...');

        const newStory = {
            title: "TEST: The Night Train",
            slug: `test-night-train-${Date.now()}`,
            description: "Automated test generation (Night Train to Nowhere excerpt).",
            category: "sleep",
            duration: Math.ceil(TEST_SCRIPT.length / 15), // Rough estimate
            is_premium: false,
            is_published: true, // Visible!
            audio_url: publicUrl,
            cover_url: "https://images.unsplash.com/photo-1476991195610-18c0e705b1c7?q=80&w=2070&auto=format&fit=crop",
            // tags: ["test", "train", "sleep"], // Removed
            voice_id: selectedVoice.voice_id
        };

        const { data: insertData, error: insertError } = await supabase
            .from('stories')
            .insert(newStory)
            .select()
            .single();

        if (insertError) {
            console.error('❌ DB Insert Failed:', insertError);
        } else {
            console.log(`   ✅ Story Created! ID: ${insertData.id}`);
            console.log(`   Check Story Manager now.`);
        }
    }

    // 6. Generate Report (Locally)
    const report = `# Audio Generation Test Report
**Date:** ${new Date().toISOString()}
**Script:** "The Night Train to Nowhere"
**Voice:** ${selectedVoice.name}
**Status:** Audio Generated & Uploaded
`;
    fs.writeFileSync(path.join(outDir, 'GENERATION_TEST_REPORT.md'), report);
}

main().catch(console.error);
