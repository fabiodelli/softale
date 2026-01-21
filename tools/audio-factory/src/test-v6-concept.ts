
import { ConceptEngine } from './ConceptEngine.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load env
const rootEnvLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(rootEnvLocal)) dotenv.config({ path: rootEnvLocal });

async function testConcept() {
    console.log("🧪 Testing V6 Concept Generation...");

    try {
        const concept = await ConceptEngine.generate("A quick test for phased mode", "meditation", {
            generationMode: 'phased',
            duration: 5,
            title: "Phased Mode Check"
        });

        console.log("✅ Concept Generated:", JSON.stringify(concept, null, 2));

        if (concept.generationMode === 'phased') {
            console.log("🎉 SUCCESS: generationMode 'phased' preserved in concept!");
        } else {
            console.error("❌ FAILURE: generationMode missing or incorrect:", concept.generationMode);
            process.exit(1);
        }
    } catch (e) {
        console.error("❌ ERROR:", e);
        process.exit(1);
    }
}

testConcept();
