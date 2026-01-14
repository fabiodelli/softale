#!/usr/bin/env tsx
/**
 * V5 Concept-Only Test Script
 * 
 * Tests V5 parameter passing WITHOUT spending audio credits.
 * Only uses Claude API to generate concepts and verify V5 fields.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const FACTORY_DIR = path.join(__dirname, '..', 'tools', 'audio-factory');
const OUTPUT_DIR = path.join(__dirname, '..', 'output', 'v5-tests');

interface V5TestCase {
    name: string;
    description: string;
    seed: string;
    category: string;
    options: {
        duration?: number;
        mixLevel?: string;
        title?: string;
        pacingMode?: string;
        warmupDuration?: number;
        ambiencePrompt?: string;
    };
    expectedFields: {
        warmupDuration?: number;
        pacingMode?: string;
        ambiencePrompt?: string;
    };
}

const TEST_CASES: V5TestCase[] = [
    {
        name: 'warmup_20s',
        description: 'Test 20-second voice delay (warm-up)',
        seed: 'A peaceful moment of stillness',
        category: 'meditation',
        options: {
            duration: 60,
            warmupDuration: 20,
            title: 'V5 Warmup Test'
        },
        expectedFields: {
            warmupDuration: 20
        }
    },
    {
        name: 'pacing_immersive',
        description: 'Test immersive (slow) pacing mode',
        seed: 'Deep relaxation journey',
        category: 'sleep_story',
        options: {
            duration: 60,
            pacingMode: 'immersive',
            title: 'V5 Immersive Pacing Test'
        },
        expectedFields: {
            pacingMode: 'immersive'
        }
    },
    {
        name: 'pacing_breathwork',
        description: 'Test breathwork counting pacing',
        seed: 'Calming breath exercise',
        category: 'focus',
        options: {
            duration: 60,
            pacingMode: 'breathwork',
            title: 'V5 Breathwork Test'
        },
        expectedFields: {
            pacingMode: 'breathwork'
        }
    },
    {
        name: 'custom_ambience',
        description: 'Test custom ambience prompt',
        seed: 'Forest meditation at dawn',
        category: 'meditation',
        options: {
            duration: 60,
            ambiencePrompt: 'Gentle rain on leaves with distant thunder',
            warmupDuration: 10,
            title: 'V5 Custom Ambience Test'
        },
        expectedFields: {
            ambiencePrompt: 'Gentle rain on leaves with distant thunder',
            warmupDuration: 10
        }
    },
    {
        name: 'full_v5',
        description: 'Test ALL V5 features combined',
        seed: 'Evening relaxation by the ocean',
        category: 'sleep_story',
        options: {
            duration: 90,
            pacingMode: 'immersive',
            warmupDuration: 15,
            ambiencePrompt: 'Ocean waves with seagulls',
            title: 'Complete V5 Integration Test'
        },
        expectedFields: {
            pacingMode: 'immersive',
            warmupDuration: 15,
            ambiencePrompt: 'Ocean waves with seagulls'
        }
    }
];

function ensureOutputDir() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
}

function runConceptTest(test: V5TestCase): { success: boolean; output: any; error?: string } {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 TEST: ${test.name}`);
    console.log(`📝 ${test.description}`);
    console.log(`${'='.repeat(60)}`);

    // Encode options as Base64
    const optionsJson = JSON.stringify(test.options);
    const optionsBase64 = Buffer.from(optionsJson).toString('base64');

    console.log(`\n📦 Options: ${JSON.stringify(test.options, null, 2)}`);
    console.log(`🔐 Base64: ${optionsBase64.substring(0, 50)}...`);

    const outputPath = path.join(OUTPUT_DIR, `${test.name}.json`);

    // Build command
    const cmd = `npx tsx src/index.ts concept "${test.seed}" "${test.category}" "${optionsBase64}"`;

    console.log(`\n🚀 Running: concept command...`);

    try {
        const result = execSync(cmd, {
            cwd: FACTORY_DIR,
            encoding: 'utf-8',
            timeout: 120000, // 2 min timeout for Claude API
            env: { ...process.env }
        });

        // Parse the JSON output (last line should be the JSON)
        const lines = result.trim().split('\n');
        let jsonOutput = null;

        // Find JSON in output
        for (let i = lines.length - 1; i >= 0; i--) {
            try {
                jsonOutput = JSON.parse(lines[i]);
                break;
            } catch {
                // Not JSON, continue
            }
        }

        if (!jsonOutput) {
            // Try to find JSON file in output directory
            const conceptFiles = fs.readdirSync(path.join(__dirname, '..', 'output'))
                .filter(f => f.endsWith('.json') && f.includes('concept'));

            if (conceptFiles.length > 0) {
                const latestFile = conceptFiles.sort().pop();
                jsonOutput = JSON.parse(
                    fs.readFileSync(path.join(__dirname, '..', 'output', latestFile!), 'utf-8')
                );
            }
        }

        // Save output
        fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2));
        console.log(`💾 Saved to: ${outputPath}`);

        return { success: true, output: jsonOutput };

    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        return { success: false, output: null, error: error.message };
    }
}

function validateOutput(test: V5TestCase, output: any): { passed: boolean; details: string[] } {
    const details: string[] = [];
    let allPassed = true;

    if (!output) {
        return { passed: false, details: ['❌ No output to validate'] };
    }

    console.log(`\n🔍 Validating V5 fields...`);

    for (const [field, expectedValue] of Object.entries(test.expectedFields)) {
        const actualValue = output[field];

        if (actualValue === expectedValue) {
            details.push(`✅ ${field}: ${actualValue} (expected: ${expectedValue})`);
        } else if (actualValue !== undefined) {
            details.push(`⚠️ ${field}: ${actualValue} (expected: ${expectedValue})`);
            allPassed = false;
        } else {
            details.push(`❌ ${field}: MISSING (expected: ${expectedValue})`);
            allPassed = false;
        }
    }

    // Also check that basic fields exist
    const requiredFields = ['title', 'musicPrompt', 'category'];
    for (const field of requiredFields) {
        if (output[field]) {
            details.push(`✅ ${field}: present`);
        } else {
            details.push(`⚠️ ${field}: missing`);
        }
    }

    return { passed: allPassed, details };
}

async function main() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║         🧪 V5 CONCEPT-ONLY TEST SUITE (No Audio Credits)     ║
╠═══════════════════════════════════════════════════════════════╣
║  Tests V5 parameter passing through the concept generation   ║
║  pipeline. Uses Claude API only - no Stable Audio/ElevenLabs ║
╚═══════════════════════════════════════════════════════════════╝
`);

    const args = process.argv.slice(2);
    const testArg = args[0];

    ensureOutputDir();

    let testsToRun: V5TestCase[] = [];

    if (!testArg) {
        // Show menu
        console.log('Available tests:\n');
        TEST_CASES.forEach((test, i) => {
            console.log(`  ${i + 1}. ${test.name.padEnd(20)} - ${test.description}`);
        });
        console.log(`\n  all - Run all tests`);
        console.log(`\nUsage: npx tsx scripts/test-v5-concepts.ts <number|all>`);
        console.log(`Example: npx tsx scripts/test-v5-concepts.ts 1`);
        return;
    }

    if (testArg === 'all') {
        testsToRun = TEST_CASES;
    } else {
        const index = parseInt(testArg) - 1;
        if (index >= 0 && index < TEST_CASES.length) {
            testsToRun = [TEST_CASES[index]];
        } else {
            console.error(`Invalid test number: ${testArg}`);
            return;
        }
    }

    const results: { name: string; success: boolean; validated: boolean; details: string[] }[] = [];

    for (const test of testsToRun) {
        const { success, output, error } = runConceptTest(test);

        if (success && output) {
            const validation = validateOutput(test, output);
            validation.details.forEach(d => console.log(`   ${d}`));
            results.push({
                name: test.name,
                success: true,
                validated: validation.passed,
                details: validation.details
            });
        } else {
            results.push({
                name: test.name,
                success: false,
                validated: false,
                details: [error || 'Unknown error']
            });
        }
    }

    // Summary
    console.log(`\n${'═'.repeat(60)}`);
    console.log('📊 TEST SUMMARY');
    console.log(`${'═'.repeat(60)}\n`);

    let passedCount = 0;
    for (const result of results) {
        const status = result.success && result.validated ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${result.name}`);
        if (result.success && result.validated) passedCount++;
    }

    console.log(`\n📈 Results: ${passedCount}/${results.length} tests passed`);
    console.log(`📁 Outputs saved to: ${OUTPUT_DIR}`);
}

main().catch(console.error);
