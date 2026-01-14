/**
 * Test V5 Features - Minimal Tests (1 min each)
 * Tests: Warm-up, Pacing Immersive, Pacing Breathwork, Custom Ambience
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const FACTORY_DIR = path.join(process.cwd(), 'tools', 'audio-factory');
const OUTPUT_DIR = path.join(process.cwd(), 'output', 'v5_tests');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface TestCase {
    name: string;
    description: string;
    options: {
        duration: number;
        mixLevel: string;
        title?: string;
        pacingMode?: string;
        warmupDuration?: number;
        ambiencePrompt?: string;
    };
}

// All tests use 1 minute duration to save API credits
const TESTS: TestCase[] = [
    {
        name: 'warmup_20s',
        description: 'Test 20-second voice delay (warm-up intro)',
        options: {
            duration: 1,
            mixLevel: 'balanced',
            title: 'Quick Calm',
            warmupDuration: 20, // 20 sec of music before voice starts
            pacingMode: 'standard',
        }
    },
    {
        name: 'pacing_immersive',
        description: 'Test immersive pacing (slow, atmospheric)',
        options: {
            duration: 1,
            mixLevel: 'balanced',
            title: 'Deep Stillness',
            pacingMode: 'immersive',
            warmupDuration: 5,
        }
    },
    {
        name: 'pacing_breathwork',
        description: 'Test breathwork pacing (rhythmic counting)',
        options: {
            duration: 1,
            mixLevel: 'balanced',
            title: 'One Minute Breath',
            pacingMode: 'breathwork',
            warmupDuration: 5,
        }
    },
    {
        name: 'custom_ambience',
        description: 'Test custom ambience prompt',
        options: {
            duration: 1,
            mixLevel: 'balanced',
            title: 'Fireplace Rest',
            pacingMode: 'standard',
            warmupDuration: 5,
            ambiencePrompt: 'crackling fireplace with gentle rain on window',
        }
    }
];

async function runTest(test: TestCase): Promise<{ success: boolean; conceptPath?: string }> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 TEST: ${test.name}`);
    console.log(`📝 ${test.description}`);
    console.log(`${'='.repeat(60)}\n`);

    // Encode options as Base64 JSON
    const optionsJson = JSON.stringify(test.options);
    const optionsBase64 = Buffer.from(optionsJson).toString('base64');

    console.log('📦 Options:', test.options);
    console.log('🔐 Base64:', optionsBase64.substring(0, 50) + '...');

    return new Promise((resolve) => {
        const proc = spawn('npx', ['tsx', 'src/index.ts', 'concept', 'sleep', optionsBase64], {
            cwd: FACTORY_DIR,
            shell: true,
            env: { ...process.env },
        });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => {
            const text = data.toString();
            stdout += text;
            process.stdout.write(text);
        });

        proc.stderr.on('data', (data) => {
            const text = data.toString();
            stderr += text;
            process.stderr.write(text);
        });

        proc.on('close', (code) => {
            if (code === 0) {
                // Find the generated concept file
                const match = stdout.match(/Concept saved to: (.+\.json)/);
                if (match) {
                    const conceptPath = match[1];
                    // Copy to our test output directory
                    const destPath = path.join(OUTPUT_DIR, `${test.name}_concept.json`);
                    try {
                        fs.copyFileSync(conceptPath, destPath);
                        console.log(`\n✅ Concept copied to: ${destPath}`);
                    } catch (e) {
                        console.log(`\n⚠️ Could not copy concept: ${e}`);
                    }
                    resolve({ success: true, conceptPath: destPath });
                } else {
                    resolve({ success: true });
                }
            } else {
                console.log(`\n❌ Test failed with code ${code}`);
                resolve({ success: false });
            }
        });
    });
}

async function analyzeConceptScript(conceptPath: string): Promise<void> {
    try {
        const content = fs.readFileSync(conceptPath, 'utf-8');
        const concept = JSON.parse(content);

        console.log('\n📊 SCRIPT ANALYSIS:');
        console.log(`   Title: ${concept.title}`);
        console.log(`   Duration: ${concept.intendedDuration} min`);
        console.log(`   Pacing: ${concept.pacingMode || 'standard'}`);
        console.log(`   Warmup: ${concept.warmupDuration || 0}s`);
        console.log(`   Ambience: ${concept.ambiencePrompt || 'auto'}`);

        // Show first 200 chars of script
        const scriptPreview = concept.voiceScript?.substring(0, 200) || 'N/A';
        console.log(`\n📜 Script Preview:\n   "${scriptPreview}..."`);
    } catch (e) {
        console.log(`⚠️ Could not analyze: ${e}`);
    }
}

async function main() {
    const testNum = process.argv[2];

    console.log('\n🎛️  V5 FEATURE TESTS (1 min each)\n');

    if (testNum) {
        // Run specific test
        const idx = parseInt(testNum) - 1;
        if (idx >= 0 && idx < TESTS.length) {
            const result = await runTest(TESTS[idx]);
            if (result.success && result.conceptPath) {
                await analyzeConceptScript(result.conceptPath);
            }
        } else {
            console.log('❌ Invalid test number. Use 1-4.');
        }
    } else {
        // Show menu
        console.log('Available tests:');
        TESTS.forEach((t, i) => {
            console.log(`  ${i + 1}. ${t.name} - ${t.description}`);
        });
        console.log('\nUsage:');
        console.log('  npx tsx scripts/test-v5-features.ts 1    # Run specific test');
        console.log('  npx tsx scripts/test-v5-features.ts all  # Run all tests');
    }

    if (testNum === 'all') {
        console.log('\n🚀 Running ALL tests...\n');
        for (const test of TESTS) {
            const result = await runTest(test);
            if (result.success && result.conceptPath) {
                await analyzeConceptScript(result.conceptPath);
            }
            console.log('\n⏳ Waiting 3 seconds before next test...\n');
            await new Promise(r => setTimeout(r, 3000));
        }
        console.log('\n✅ All tests complete!');
    }
}

main().catch(console.error);
