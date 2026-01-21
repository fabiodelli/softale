
import * as dotenv from 'dotenv';
import * as path from 'path';
import { generateStory, StoryBrief } from './index.js';

// Load environment variables
const rootEnvLocal = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: rootEnvLocal });

const TEST_DURATION = 1; // 1 Minute

// V5.1 Test: NO manual layers or ambiencePrompt - Factory should auto-detect!
const TEST_CASES: StoryBrief[] = [
    {
        title: "V5.1 Test: Auto Soundscape",
        category: "soundscape",
        duration: TEST_DURATION,
        description: "Pure nature soundscape. Factory should auto-detect: voice=false, music=false, ambience=true.",
        // NO ambiencePrompt - should be derived from musicPrompt
        // NO layers - should be auto-detected from RECIPE_MATRIX
    },
    {
        title: "V5.1 Test: Auto Sleep Story",
        category: "sleep",
        duration: TEST_DURATION,
        description: "Sleep story with voice and ambient background. Factory should auto-detect all layers.",
        voiceStyle: "soft_female",
        // NO layers - should auto-detect: voice=true, music=false, ambience=true
    }
];

async function runTests() {
    console.log("🚀 STARTING V5.1 AUTO-DETECTION TEST");
    console.log(`⏱️  Duration per story: ${TEST_DURATION} minute(s)`);
    console.log("------------------------------------------------");

    for (const testCase of TEST_CASES) {
        console.log(`\n🧪 Testing: ${testCase.title}`);
        console.log(`   📁 Category: ${testCase.category}`);
        console.log(`   🤖 Expecting auto-detection of layers...`);

        try {
            const storyId = await generateStory(testCase);
            console.log(`✅ SUCCESS: Story ID ${storyId}`);
        } catch (error: any) {
            console.error(`❌ FAILED:`, error.message);
        }
        console.log("------------------------------------------------");
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log("\n🏁 V5.1 AUTO-DETECTION TEST COMPLETE");
}

runTests();
