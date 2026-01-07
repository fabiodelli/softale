import { generateStableAudio } from './music.js';
import { uploadStory, generateScript, generateCover } from './index.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '.env') });
const OUTPUT_DIR = path.join(__dirname, '..', 'output');
// DEFINIZIONE CATALOGO LIVELLO 2
const AMBIENT_BATCH = [
    {
        title: "432Hz Healing Tone",
        description: "Pure sine wave at 432Hz, meditative drone, warm pad background, healing frequency, consistent texture, no melody, high fidelity",
        category: "music_instrumental",
        duration: 3,
        musicFile: "432hz", // Custom ID
        mood: "healing"
    },
    {
        title: "528Hz DNA Repair",
        description: "528Hz Solfeggio frequency, miracle tone, soft ambient drone, bright and airy, meditative state, continuous loop, no transients",
        category: "music_instrumental",
        duration: 3,
        musicFile: "528hz",
        mood: "healing"
    },
    {
        title: "Deep Theta Waves",
        description: "Binaural beats in Theta range (6Hz), deep sleep induction, low rumble, sub-bass pulse, dark ambient atmosphere, minimal texture",
        category: "sleep",
        duration: 3,
        musicFile: "theta",
        mood: "deep_sleep"
    },
    {
        title: "Satie Minimal Piano",
        description: "Solo piano, slow bpm, Erik Satie style, minimal notes, heavy reverb, emotional, melancholic but expensive sounding, cinematic, relaxing",
        category: "music_instrumental",
        duration: 3,
        musicFile: "piano",
        mood: "melancholic"
    },
    {
        title: "Eno Space Pads",
        description: "Ambient space drone, Brian Eno style, evolving texture, airy pads, slow attack, long release, drift, sleep music, no percussion",
        category: "music_instrumental",
        duration: 3,
        musicFile: "pads",
        mood: "floating"
    },
    {
        title: "Tibetan Singing Bowls",
        description: "Tibetan singing bowls, resonant bells, temple atmosphere, meditative, spiritual, rich harmonics, wide stereo image",
        category: "meditation",
        duration: 3,
        musicFile: "bowls",
        mood: "spiritual"
    }
];
async function runBatch() {
    console.log("🏭 STARTING BATCH FACTORY: LEVEL 2 AMBIENTS");
    console.log("==================================================");
    for (const item of AMBIENT_BATCH) {
        console.log(`\n🌊 PROCESSING: ${item.title}`);
        try {
            // 1. Generate "Script" (Metadata + Prompts)
            // Note: Since these are instrumental, script content will be empty.
            // But we need the structure for prompts.
            const script = await generateScript(item);
            // Override music prompt with our explicit description for maximum control
            script.musicPrompt = item.description + ", high quality, stereo, no vocals";
            // Generate a slug as fallback ID
            const scriptId = script.id || script.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            // Save Metadata
            const outputDir = path.join(OUTPUT_DIR, scriptId);
            await fs.mkdir(outputDir, { recursive: true });
            await fs.writeFile(path.join(outputDir, 'script.json'), JSON.stringify(script, null, 2));
            // 2. Generate Audio (Music/Frequency)
            // We use the 'music.ts' logic which calls Stable Audio
            // We are NOT doing Voice generation for these.
            const musicPath = path.join(outputDir, 'music.mp3');
            await generateStableAudio({
                prompt: script.musicPrompt,
                durationSeconds: 180, // Always 3 mins
                outputPath: musicPath
            });
            // 3. Generate Cover Art
            await generateCover(script);
            // 4. Upload to DB
            if (scriptId) {
                await uploadStory(scriptId);
            }
            console.log(`✅ COMPLETED: ${item.title}`);
        }
        catch (e) {
            console.error(`❌ FAILED: ${item.title}`, e.message);
        }
    }
    console.log("\n==================================================");
    console.log("🏁 BATCH JOB FINISHED");
}
runBatch().catch(console.error);
