/**
 * =====================================================
 * QWEN TTS TEST SCRIPT
 * =====================================================
 * 
 * Simple test to verify Qwen integration works end-to-end.
 * This generates a short story using only the local Qwen API.
 * 
 * Usage:
 *   cd tools/audio-factory
 *   npx tsx src/test-qwen-story.ts
 * 
 * Prerequisites:
 *   - Qwen API server running: cd ../qwen-api && uvicorn server:app
 *   - .env file with USE_LOCAL_TTS=true
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

// Force local TTS
process.env.USE_LOCAL_TTS = 'true';

import { isQwenAvailable, generateWithQwen, getVoiceInstruction } from './LocalTTSService.js';

const OUTPUT_DIR = path.join(process.cwd(), 'output', 'qwen-test');

async function runTest() {
    console.log('='.repeat(60));
    console.log('   QWEN TTS STORY GENERATION TEST');
    console.log('='.repeat(60));

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Step 1: Check Qwen availability
    console.log('\n1️⃣ Checking Qwen API availability...');
    const available = await isQwenAvailable();
    if (!available) {
        console.error('   ❌ Qwen API is not running!');
        console.error('   Start it with: cd ../qwen-api && uvicorn server:app --reload');
        process.exit(1);
    }
    console.log('   ✅ Qwen API is online!');

    // Step 2: Test different voice styles
    console.log('\n2️⃣ Testing voice styles...\n');

    const testCases = [
        {
            name: 'sleep_story_intro',
            text: `Chiudi dolcemente gli occhi... e lasciati cullare da questa storia.
                   Immagina di trovarti in un antico giardino giapponese, 
                   dove l'acqua di un ruscello scorre piano tra le pietre.`,
            style: 'soft_male',
            category: 'sleep'
        },
        {
            name: 'meditation_guide',
            text: `Fai un respiro profondo... inspira... ed espira lentamente.
                   Senti il tuo corpo che si rilassa, ogni tensione che si scioglie.
                   Sei al sicuro. Sei in pace.`,
            style: 'meditation',
            category: 'meditation'
        },
        {
            name: 'kids_story',
            text: `C'era una volta, in una foresta incantata, 
                   un piccolo coniglietto di nome Nuvola.
                   Aveva le orecchie più morbide del mondo 
                   e un cuore grande grande!`,
            style: 'kids',
            category: 'kids'
        },
        {
            name: 'fantasy_narrative',
            text: `La luna sorgeva sopra le montagne cristalline,
                   illuminando il sentiero che conduceva alla Torre dei Sussurri.
                   Lì, dicevano, viveva l'ultimo dei guardiani stellari.`,
            style: 'narrator_male',
            category: 'fantasy'
        }
    ];

    const results: Array<{ name: string; success: boolean; duration?: number; path?: string }> = [];

    for (const test of testCases) {
        console.log(`   🎙️ Generating: ${test.name}`);

        const instruction = getVoiceInstruction(test.style, test.category);
        const outputPath = path.join(OUTPUT_DIR, `${test.name}.wav`);

        const result = await generateWithQwen({
            text: test.text,
            instruction,
            language: 'Italian',
            outputPath
        });

        results.push({
            name: test.name,
            success: result.success,
            duration: result.duration,
            path: result.path
        });

        if (result.success) {
            console.log(`      ✅ Success (${result.duration?.toFixed(1)}s)`);
        } else {
            console.log(`      ❌ Failed: ${result.error}`);
        }
    }

    // Step 3: Summary
    console.log('\n' + '='.repeat(60));
    console.log('   TEST RESULTS');
    console.log('='.repeat(60));

    const successCount = results.filter(r => r.success).length;
    console.log(`\n   Passed: ${successCount}/${results.length}`);

    if (successCount > 0) {
        console.log(`\n   📁 Output files saved to: ${OUTPUT_DIR}`);
        console.log('\n   Generated files:');
        results.filter(r => r.success).forEach(r => {
            console.log(`      - ${r.name}.wav`);
        });
    }

    console.log('\n' + '='.repeat(60));
    console.log(successCount === results.length ? '   🎉 ALL TESTS PASSED!' : '   ⚠️ SOME TESTS FAILED');
    console.log('='.repeat(60) + '\n');
}

runTest().catch(console.error);
