
import { execSync } from 'child_process';
import { CATALOG_ITEMS } from './src/catalog-config.ts';

// MVP Selection: The 15 items we want for launch
const MVP_TITLES = [
    // Sleep
    "The Velvet Locomotive",
    "Where Flowers Sleep",
    "Dust of the Canyon",

    // Soundscapes
    "Monsoon Glass",
    "The Café at 3AM",
    "Antarctic Dawn",

    // Binaural
    "Gamma State",
    "Golden Ratio",
    "Theta Drift",

    // Meditation
    "Four Corners", // Box breathing
    "The Body Map", // PMR
    "Five Senses Reset", // Grounding

    // Instrumental
    "Nordic Piano",
    "Lo-Fi Study Beats",
    "Acoustic Morning"
];

const CLI_PATH = 'tools/audio-factory/src/index.ts';

async function batchRun() {
    console.log(`🚀 STARTING MVP BATCH GENERATION (${MVP_TITLES.length} items)`);
    console.log("==================================================");

    // Filter catalog
    const queue = CATALOG_ITEMS.filter(item => MVP_TITLES.includes(item.title));

    if (queue.length === 0) {
        console.error("❌ No items matched! Check MVP_TITLES vs CATALOG_ITEMS.");
        return;
    }

    console.log(`📋 Queue: ${queue.map(i => i.title).join(", ")}`);
    console.log("==================================================\n");

    for (const [index, item] of queue.entries()) {
        console.log(`\n▶️ [${index + 1}/${queue.length}] Processing: "${item.title}"`);

        try {
            // 1. Prepare Concept Options
            const options = {
                title: item.title,
                duration: item.duration,
                mixLevel: 'balanced', // Default, logic in Factory handles overrides
                voiceStyle: item.voiceStyle
                // Auto-ambience is handled by Factory logic now
            };

            const optionsBase64 = Buffer.from(JSON.stringify(options)).toString('base64');
            const safeIdea = item.description.replace(/"/g, '\\"'); // Escape quotes for shell

            // 2. Run 'concept' command
            console.log(`   🧠 Generating Concept...`);
            // npx tsx src/index.ts concept <category> <idea> <base64Options>
            execSync(`npx tsx ${CLI_PATH} concept "${item.category}" "${safeIdea}" "${optionsBase64}"`, { stdio: 'inherit' });

            // 3. Determine Concept Filename
            // The CLI saves it as `concept_<slug>.json`
            const safeSlug = item.title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            const conceptFile = `output/concept_${safeSlug}.json`;

            // 4. Run 'build' command
            console.log(`   🏗️ Building Story...`);
            // npx tsx src/index.ts build <conceptFile>
            execSync(`npx tsx ${CLI_PATH} build "${conceptFile}"`, { stdio: 'inherit' });

            console.log(`✅ Completed: "${item.title}"`);

            // Safety cool-down between generations (10s)
            console.log("   ⏳ Cooling down (10s)...");
            await new Promise(r => setTimeout(r, 10000));

        } catch (e: any) {
            console.error(`❌ FAILED: "${item.title}"`);
            console.error(e.message);
            // Continue to next item
        }
    }

    console.log("\n==================================================");
    console.log("🏁 BATCH RUN COMPLETE");
}

batchRun();
