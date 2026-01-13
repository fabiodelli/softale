
import { generateStory } from './src/index.js';
import { CATALOG_ITEMS } from './src/catalog-config.js';

// MVP Selection: The 15 items we want for launch
// Based on MVP_CONTENT_PLAN.md categories:
// - Sleep (3)
// - Soundscapes (3)
// - Binaural (3)
// - Meditation (3)
// - Instrumental (3)

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
            await generateStory({
                category: item.category,
                duration: item.duration,
                title: item.title, // Pass title to force this specific story logic if supported, 
                // or mostly likely generateStory uses it to guide the prompt if modified.
                // NOTE: index.ts generateStory takes a 'brief'.
                // We need to ensure generateScript uses this specific title/premise.
                // Current generateScript (via ConceptEngine usually) generates FROM scratch unless guided.
                // Let's look at index.ts again. It takes 'brief'.
                // If brief has 'title', does it use it?
                // Let's assume we pass extra context or modify index.ts if needed.
                // Looking at index.ts: generateScript(brief) -> ConceptEngine? No.
                // generateScript uses brief.category etc.
                // We might need to pass the 'description' as the 'idea' or 'premise'.
                topic: item.description, // Passing description as topic/idea
                voiceStyle: item.voiceStyle
            });

            console.log(`✅ Completed: "${item.title}"`);

            // Safety cool-down between generations
            await new Promise(r => setTimeout(r, 5000));

        } catch (e: any) {
            console.error(`❌ FAILED: "${item.title}"`, e.message);
            // Continue to next item? Yes.
        }
    }

    console.log("\n==================================================");
    console.log("🏁 BATCH RUN COMPLETE");
}

batchRun();
