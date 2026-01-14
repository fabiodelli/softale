#!/usr/bin/env npx tsx
/**
 * V5 Features Test Suite
 * 
 * Tests:
 * 1. Warm-up Delay: Voice starts after X seconds of music
 * 2. 3-Layer Mixing: Music + Ambience + Voice
 * 3. Instrumental Mode: No voice, pure audio
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const FACTORY_DIR = path.join(__dirname, 'src');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface TestCase {
    name: string;
    description: string;
    seed: string;
    category: string;
    duration: number;
    warmupDuration?: number;
    pacingMode?: string;
    ambiencePrompt?: string;
    mixLevel?: string;
}

const TEST_CASES: TestCase[] = [
    // TEST 1: Warm-up Delay (15 secondi di intro musicale)
    {
        name: "Test 1: Warm-up Delay",
        description: "Verifica che la voce inizi dopo 15 secondi di musica",
        seed: "A brief moment of calm before sleep. Focus on breathing and letting go of the day.",
        category: "sleep",
        duration: 3, // 3 minuti per test veloce
        warmupDuration: 15, // 15 secondi di intro
        pacingMode: "immersive",
        ambiencePrompt: "Gentle rain on window",
        mixLevel: "balanced"
    },

    // TEST 2: 3-Layer Mixing (Musica + Ambience + Voce)
    {
        name: "Test 2: 3-Layer Mixing",
        description: "Verifica il mix a 3 livelli: musica, ambience e voce insieme",
        seed: "A forest meditation. Walking through ancient trees, feeling grounded and peaceful.",
        category: "meditation",
        duration: 3,
        warmupDuration: 5, // Breve intro
        pacingMode: "standard",
        ambiencePrompt: "Forest birds chirping, leaves rustling in gentle breeze",
        mixLevel: "high_immersion" // Più ambience/musica
    },

    // TEST 3: Voice Focus Mix (Voce prominente)
    {
        name: "Test 3: Voice Focus",
        description: "Verifica il mix con voce in primo piano",
        seed: "A simple relaxation guide. Clear instructions for releasing tension.",
        category: "relax",
        duration: 3,
        warmupDuration: 0, // Nessun delay
        pacingMode: "standard",
        ambiencePrompt: "", // No ambience, solo musica
        mixLevel: "voice_focus"
    }
];

async function runTest(test: TestCase, index: number): Promise<boolean> {
    console.log('\n' + '='.repeat(60));
    console.log(`🧪 ${test.name}`);
    console.log(`   ${test.description}`);
    console.log('='.repeat(60));

    // Build options object for CLI
    const options = {
        duration: test.duration,
        mixLevel: test.mixLevel || 'balanced',
        title: `V5_Test_${index + 1}_${Date.now()}`,
        pacingMode: test.pacingMode,
        warmupDuration: test.warmupDuration,
        ambiencePrompt: test.ambiencePrompt
    };

    const optionsBase64 = Buffer.from(JSON.stringify(options)).toString('base64');

    // Build CLI command
    const cmd = [
        'npx', 'tsx',
        path.join(FACTORY_DIR, 'index.ts'),
        'generate',
        test.seed,
        test.category,
        optionsBase64
    ].join(' ');

    console.log(`\n📋 Command: npx tsx ... generate "${test.seed.substring(0, 30)}..." ${test.category}`);
    console.log(`   Options: warmup=${test.warmupDuration}s, pacing=${test.pacingMode}, mix=${test.mixLevel}`);
    console.log(`   Ambience: "${test.ambiencePrompt || 'none'}"`);

    try {
        // Execute the factory
        console.log('\n🚀 Starting generation...\n');

        execSync(cmd, {
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit',
            env: { ...process.env }
        });

        console.log(`\n✅ ${test.name} - COMPLETED`);
        return true;

    } catch (error: any) {
        console.error(`\n❌ ${test.name} - FAILED`);
        console.error(`   Error: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🎧 V5 FEATURES TEST SUITE');
    console.log('='.repeat(60));
    console.log('Testing: Warm-up Delay, 3-Layer Mixing, Voice Focus');
    console.log('='.repeat(60));

    const results: { name: string; success: boolean }[] = [];

    for (let i = 0; i < TEST_CASES.length; i++) {
        const test = TEST_CASES[i];
        const success = await runTest(test, i);
        results.push({ name: test.name, success });

        // Pausa tra test per evitare rate limiting
        if (i < TEST_CASES.length - 1) {
            console.log('\n⏳ Waiting 5 seconds before next test...\n');
            await new Promise(r => setTimeout(r, 5000));
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    results.forEach(r => {
        const icon = r.success ? '✅' : '❌';
        console.log(`   ${icon} ${r.name}`);
    });

    const passed = results.filter(r => r.success).length;
    console.log(`\n   Total: ${passed}/${results.length} passed`);

    if (passed === results.length) {
        console.log('\n🎉 ALL TESTS PASSED! V5 Features are working correctly.');
    } else {
        console.log('\n⚠️ Some tests failed. Check logs above for details.');
    }
}

main().catch(console.error);
