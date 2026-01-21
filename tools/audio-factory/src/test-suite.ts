
import * as dotenv from 'dotenv';
import * as path from 'path';
import { generateStory, StoryBrief } from './index.js';

// Load environment variables
const rootEnvLocal = path.resolve(process.cwd(), '../../../../.env.local');
dotenv.config({ path: rootEnvLocal });

const TEST_DURATION = 1; // 1 Minute to minimize usage

const TEST_CASES: StoryBrief[] = [
    {
        title: "Test Sleep",
        category: "sleep",
        duration: TEST_DURATION,
        description: "A short test sleep story about a floating feather.",
        voiceStyle: "soft_female"
    },
    {
        title: "Test Meditation",
        category: "meditation",
        duration: TEST_DURATION,
        description: "A quick breath focus session.",
        voiceStyle: "neutral"
    },
    {
        title: "Test Fantasy",
        category: "fantasy",
        duration: TEST_DURATION,
        description: "A glimpse of a crystal cave.",
        voiceStyle: "soft_female"
    },
    {
        title: "Test Motivation",
        category: "motivation",
        duration: TEST_DURATION,
        description: "Outputting energy for the day.",
        voiceStyle: "soft_male"
    },
    {
        title: "Test Soundscape",
        category: "soundscape",
        duration: TEST_DURATION,
        description: "Rain on a tin roof.",
    }
];

async function runTests() {
    console.log("🚀 STARTING AUDI FACTORY TEST SUITE");
    console.log(`⏱️  Duration per story: ${TEST_DURATION} minute(s)`);
    console.log("------------------------------------------------");

    for (const testCase of TEST_CASES) {
        console.log(`\n🧪 Testing Category: ${testCase.category.toUpperCase()}`);
        try {
            const storyId = await generateStory(testCase);
            console.log(`✅ SUCCESS [${testCase.category}]: Story ID ${storyId}`);
        } catch (error: any) {
            console.error(`❌ FAILED [${testCase.category}]:`, error.message);
        }
        console.log("------------------------------------------------");
        // efficient wait between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log("\n🏁 TEST SUITE COMPLETE");
}

runTests();
