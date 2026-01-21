
import * as dotenv from 'dotenv';
import * as path from 'path';
import { generateStory, StoryBrief } from './index.js';

// Load environment variables
const rootEnvLocal = path.resolve(process.cwd(), '../../../../.env.local');
dotenv.config({ path: rootEnvLocal });

const TEST_DURATION = 1; // 1 Minute

const TEST_CASES: StoryBrief[] = [
    {
        title: "V5 Test: Soundscape (Nature Only)",
        category: "soundscape",
        duration: TEST_DURATION,
        description: "Pure nature sounds. No voice, no music. Just heavy rain and thunder.",
        ambiencePrompt: "Heavy thunderstorm with rolling thunder and rain on a tent",
        mixSettings: {
            voice: 0,    // 0%
            music: 0,    // 0%
            ambience: 1.0 // 100%
        },
        layers: {
            voice: false,
            music: false,
            ambience: true
        }
    }
];

async function runTests() {
    console.log("🚀 STARTING V5 SOUNDSCAPE RETRY");
    console.log(`⏱️  Duration per story: ${TEST_DURATION} minute(s)`);
    console.log("------------------------------------------------");

    for (const testCase of TEST_CASES) {
        console.log(`\n🧪 Testing Scenario: ${testCase.title}`);
        console.log(`   📊 Mix: Voice=${testCase.mixSettings?.voice}, Music=${testCase.mixSettings?.music}, Amb=${testCase.mixSettings?.ambience}`);
        console.log(`   🏗️ Layers: ${JSON.stringify(testCase.layers)}`);

        try {
            const storyId = await generateStory(testCase);
            console.log(`✅ SUCCESS: Story ID ${storyId}`);
        } catch (error: any) {
            console.error(`❌ FAILED:`, error.message);
        }
        console.log("------------------------------------------------");
    }

    console.log("\n🏁 TEST SUITE COMPLETE");
}

runTests();
