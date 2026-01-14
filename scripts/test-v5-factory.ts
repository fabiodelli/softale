
import { ConceptEngine } from '../tools/audio-factory/src/ConceptEngine.js';
import { buildStoryFromConcept } from '../tools/audio-factory/src/index.js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), 'tools/audio-factory/.env') });

const TEST_PARAMS = {
    category: 'soundscape',
    idea: 'A vibrant emerald forest with wind wrestling through canopies and distant birdsong.',
    options: {
        duration: 1, // Short duration for faster test
        mixLevel: 'high_immersion',
        pacingMode: 'immersive',
        warmupDuration: 0,
        title: 'Emerald Canopy',
        ambiencePrompt: 'Forest wind, leaves rustling, birds chirping, nature ambience'
    }
};

async function runTest() {
    console.log('🧪 STARTING V5 INTEGRATION TEST');
    console.log('================================');
    console.log('Inputs:', JSON.stringify(TEST_PARAMS, null, 2));

    try {
        // 1. Generate Concept
        console.log('\n🧠 [1] Generating Concept from Idea...');
        const concept = await ConceptEngine.generate(
            TEST_PARAMS.idea,
            TEST_PARAMS.category,
            TEST_PARAMS.options as any
        );
        console.log('   ✅ Concept Generated:', concept.title);
        console.log('      Pacing:', concept.pacingMode);
        console.log('      Mix Level:', concept.mixLevel);

        // 2. Build Story (Voice -> Music -> Ambience -> Mix -> Upload)
        console.log('\n🏗️ [2] Building Story & Uploading...');
        const storyId = await buildStoryFromConcept(concept);

        console.log('\n✨ TEST COMPLETE');
        console.log(`   Final Story ID: ${storyId}`);
        console.log('   Check Supabase for the result.');

    } catch (error: any) {
        console.error('❌ TEST FAILED:', error.message);
        if (error.response) {
            console.error('API Error Details:', await error.response.text().catch(() => 'N/A'));
        }
        process.exit(1);
    }
}

runTest();
