
import * as dotenv from 'dotenv';
import * as path from 'path';
import { generateStory, StoryBrief } from './index.js';

// Load environment variables
const rootEnvLocal = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: rootEnvLocal });

const TEST_DURATION = 3; // 3 Minutes - Short but enough to test phases

// V6 Test: Auto-tagging and Harvesting
const TEST_CASES: StoryBrief[] = [
    {
        title: "Morning Clarity",
        category: "meditation",
        duration: TEST_DURATION,
        description: "A grounding meditation with auto-tagging test.",
        voiceStyle: "soft_female",
        generationMode: 'phased',
    },
];

async function runTests() {
    console.log("🚀 STARTING V6 PHASED NARRATION TEST");
    console.log(`⏱️  Duration per story: ${TEST_DURATION} minute(s)`);
    console.log("------------------------------------------------");

    for (const testCase of TEST_CASES) {
        console.log(`\n🧪 Testing: ${testCase.title}`);
        console.log(`   📁 Category: ${testCase.category}`);
        console.log(`   🔀 Mode: ${testCase.generationMode}`);

        try {
            const storyId = await generateStory(testCase);
            console.log(`✅ SUCCESS: Story ID ${storyId}`);
        } catch (error: any) {
            console.error(`❌ FAILED:`, error.message);
            console.error(error.stack);
        }
        console.log("------------------------------------------------");
    }

    console.log("\n🏁 V6 PHASED NARRATION TEST COMPLETE");
}

runTests();
