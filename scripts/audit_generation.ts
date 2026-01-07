
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix path to .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../tools/audio-factory/.env');
dotenv.config({ path: envPath });

import { generateScript } from '../tools/audio-factory/src/index.js';

async function main() {
    console.log('🔍 STARTING AUDIO FACTORY AUDIT (SCRIPT LEVEL)...');
    console.log('--------------------------------------------------');

    const testBrief = {
        title: "The Night Train",
        description: "A luxury train ride through the snowy Alps at night. The listener is safe in a warm cabin, watching snow fall.",
        category: "sleep",
        duration: 1, // Short test to save tokens
        language: "English",
        voiceStyle: "soft_male",
        systemPrompt: null // Use default to test full logic
    };

    console.log('📋 INPUT BRIEF:');
    console.log(JSON.stringify(testBrief, null, 2));
    console.log('--------------------------------------------------');

    try {
        console.log('🤖 INVOKING CLAUDE OPUS...');
        // The generateScript function inside index.ts already logs [DEBUG-PROMPT-SYSTEM-START], etc.
        // We will just capture the result.

        const result = await generateScript(testBrief as any);

        console.log('\n\n✅ GENERATION COMPLETE');
        console.log('--------------------------------------------------');
        console.log('📦 OUTPUT JSON (What Claude returned):');
        console.log(JSON.stringify(result, null, 2));

        console.log('\n\n🎨 GENERATED ASSET PROMPTS (Extracted from JSON):');
        console.log('--------------------------------------------------');
        console.log(`🎵 MUSIC PROMPT:\n"${result.musicPrompt}"`);
        console.log(`\n🖼️ COVER PROMPT:\n"${result.coverPrompt}"`);
        console.log('--------------------------------------------------');

        console.log('Audit complete. No audio was generated to save credits.');

    } catch (error) {
        console.error('❌ ERROR:', error);
    }
}

main();
