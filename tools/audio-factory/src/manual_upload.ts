
import 'dotenv/config';
import { uploadStory } from './index.js';

async function run() {
    const ids = [
        'story_1767203524565', // Instrumental (Coding Flow)
        'story_1767203579161'  // Narrative (Rise2)
    ];

    console.log('🚀 Starting manual upload recovery...');

    for (const id of ids) {
        try {
            console.log(`\n📂 Processing: ${id}`);
            await uploadStory(id);
        } catch (e: any) {
            console.error(`❌ Failed to upload ${id}:`, e.message);
        }
    }
}

run();
