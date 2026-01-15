import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * FACTORY MATRIX TEST SUITE (PHASE 1)
 * 
 * Verifies that the Concept Engine correctly interprets all V5 UI parameters.
 * Does NOT generate audio (Cost: Text Only).
 */

const FACTORY_DIR = path.join(__dirname, '..', 'tools', 'audio-factory');
const OUTPUT_DIR = path.join(__dirname, '..', 'output', 'matrix-tests');

// --- Test Definitions ---

interface TestCase {
    name: string;
    description: string;
    inputs: {
        category: string;
        idea: string;
        options: {
            duration?: number;
            mixLevel?: string;
            title?: string;
            pacingMode?: 'standard' | 'immersive' | 'breathwork';
            warmupDuration?: number;
            ambiencePrompt?: string;
        }
    };
    // Validation function: returns error string or null if pass
    validate: (output: any) => string | null;
}

const TEST_MATRIX: TestCase[] = [
    // 1. Defaults & Basic Parsing
    {
        name: 'Basic Sleep',
        description: 'Verifies default sleep story generation',
        inputs: {
            category: 'sleep',
            idea: 'A walk through a quiet moonlit garden',
            options: { duration: 15 } // Defaults
        },
        validate: (o) => {
            if (o.category !== 'sleep') return `Category mismatch: ${o.category}`;
            if (!o.narrativeArc) return 'Missing narrativeArc';
            if (!o.audioIdentity) return 'Missing audioIdentity';
            return null;
        }
    },

    // 2. Explicit Overrides
    {
        name: 'Override Check',
        description: 'Verifies Title, Pacing, and Warmup forces',
        inputs: {
            category: 'meditation',
            idea: 'Focus on breath',
            options: {
                title: 'FORCE_TITLE_TEST',
                pacingMode: 'breathwork',
                warmupDuration: 45
            }
        },
        validate: (o) => {
            if (o.title !== 'FORCE_TITLE_TEST') return `Title override failed: ${o.title}`;
            if (o.pacingMode !== 'breathwork') return `Pacing override failed: ${o.pacingMode}`;
            if (o.warmupDuration !== 45) return `Warmup override failed: ${o.warmupDuration}`;
            return null;
        }
    },

    // 3. Ambience Layer
    {
        name: 'Ambience Injection',
        description: 'Verifies custom ambience prompt injection',
        inputs: {
            category: 'nature',
            idea: 'Rainforest',
            options: {
                ambiencePrompt: 'Heavy tropical rain on tin roof'
            }
        },
        validate: (o) => {
            // The prompt requests the engine to USE this, so we check if it made it into the audioIdentity
            if (!o.audioIdentity?.ambienceLayer?.toLowerCase().includes('rain')) {
                return `Ambience layer missing 'rain': ${o.audioIdentity?.ambienceLayer}`;
            }
            return null;
        }
    },

    // 4. Mix Levels (Metadata check)
    {
        name: 'Mix Level: Background Only',
        description: 'Verifies background_only mix settings',
        inputs: {
            category: 'soundscape',
            idea: 'White noise fan',
            options: {
                mixLevel: 'background_only'
            }
        },
        validate: (o) => {
            if (o.mixLevel !== 'background_only') return `MixLevel failed: ${o.mixLevel}`;
            return null;
        }
    },

    // 5. Category Logic: Kids
    {
        name: 'Category: Kids',
        description: 'Verifies Kids category produces appropriate tone',
        inputs: {
            category: 'kids',
            idea: 'A magic dragon learning to fly',
            options: {}
        },
        validate: (o) => {
            if (o.category !== 'kids') return 'Category mismatch';
            // Simple heuristic check on tone/targetAudience
            const audience = o.targetAudience?.toLowerCase() || '';
            const isKids = audience.includes('child') || audience.includes('kid') || audience.includes('fam');
            if (!isKids) return `Target audience seems wrong for Kids category: ${o.targetAudience}`;
            return null;
        }
    }
];

// --- Execution Engine ---

function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function runTests() {
    console.log(`\n🧪 FACTORY MATRIX TEST SUITE\n===========================`);
    ensureDir(OUTPUT_DIR);

    let passed = 0;

    for (const test of TEST_MATRIX) {
        console.log(`\n▶️  TEST: [${test.name}]`);
        console.log(`    Goal: ${test.description}`);

        try {
            // Encode options like the API does
            const optionsBase64 = Buffer.from(JSON.stringify(test.inputs.options)).toString('base64');
            const cleanIdea = test.inputs.idea.replace(/"/g, '\\"');

            // CLI Command
            const cmd = `npx tsx src/index.ts concept ${test.inputs.category} "${cleanIdea}" "${optionsBase64}"`;

            // Execute
            const output = execSync(cmd, {
                cwd: FACTORY_DIR,
                encoding: 'utf-8',
                env: { ...process.env, FORCE_COLOR: '0' }
            });

            // Find JSON Path
            const match = output.match(/Concept Saved:\s*(.*\.json)/);
            if (!match || !match[1]) {
                throw new Error('Failed to capture JSON path from CLI output');
            }

            const filePath = match[1].trim();
            const jsonContent = fs.readFileSync(filePath, 'utf-8');
            const resultObj = JSON.parse(jsonContent);

            // Validate
            const error = test.validate(resultObj);

            if (error) {
                console.log(`    ❌ FAILED: ${error}`);
            } else {
                console.log(`    ✅ PASSED`);
                passed++;
            }

            // Save clean artifact
            fs.copyFileSync(filePath, path.join(OUTPUT_DIR, `${test.name.replace(/\s+/g, '_')}.json`));

        } catch (e: any) {
            console.log(`    ❌ ERROR: ${e.message.split('\n')[0]}`);
        }
    }

    console.log(`\n===========================`);
    console.log(`🏁 RESULT: ${passed}/${TEST_MATRIX.length} Tests Passed`);
    console.log(`📂 Evidence saved to: ${OUTPUT_DIR}\n`);
}

runTests();
