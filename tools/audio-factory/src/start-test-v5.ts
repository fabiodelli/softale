
import * as dotenv from 'dotenv';
import * as path from 'path';
import { generateStory, StoryBrief } from './index.js';

// Load environment variables
const rootEnvLocal = path.resolve(process.cwd(), '../../../../.env.local');
dotenv.config({ path: rootEnvLocal });

const TEST_DURATION = 1; // 1 Minute

const TEST_CASES: StoryBrief[] = [
    {
        title: "V5 Test: Sleep (Standard Mix)",
        category: "sleep",
        duration: TEST_DURATION,
        description: "A soothing sleep story about a floating feather, testing standard balanced mix.",
        voiceStyle: "soft_female",
        pacingMode: "immersive",
        warmupDuration: 15,
        mixSettings: {
            voice: 3.2,  // 80%
            music: 0.12, // 12%
            ambience: 0.12 // 12%
        },
        layers: {
            voice: true,
            music: true,
            ambience: true
        }
    },
    {
        title: "V5 Test: Motivation (Voice Heavy)",
        category: "motivation",
        duration: TEST_DURATION,
        description: "High energy morning motivation. Voice should be loud, music very faint, no ambience.",
        voiceStyle: "soft_male",
        pacingMode: "standard",
        warmupDuration: 0,
        mixSettings: {
            voice: 3.6,  // 90%
            music: 0.05, // 5%
            ambience: 0  // 0%
        },
        layers: {
            voice: true,
            music: true,
            ambience: false
        }
    },
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
    console.log("🚀 STARTING V5 GRANULAR MIX TEST SUITE");
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
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log("\n🏁 TEST SUITE COMPLETE");
}

runTests();
