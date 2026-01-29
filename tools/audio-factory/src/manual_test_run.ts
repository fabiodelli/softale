
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env before imports that might use it
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });

import {
    generatePhasedVoice,
    generateStableAudio,
    mixUnifiedAudio,
    uploadStoryPackage,
    generateAssetPack
} from './index';
import { ConceptEngine } from './ConceptEngine';

async function run() {
    console.log("🚀 Starting Manual Test Run (Bypassing Claude)...");

    try {
        // 1. Create FULL Mock Script (Bypassing ConceptEngine & generateScript)
        const timestamp = Date.now();
        const script = {
            id: `mock-bamboo-${timestamp}`,
            slug: `mock-bamboo-${timestamp}`,
            title: "Bamboo Zen Test (Manual)",
            category: "meditation",
            duration: 3,
            warmupDuration: 15, // TEST TARGET: 15s Warmup
            script: "Full script text...",
            phases: [
                { id: 1, type: "ambience_only", durationSeconds: 15, content: "", transitionNote: "Warmup" },
                { id: 2, type: "narration", durationSeconds: 10, content: "Welcome to the bamboo forest. [pause]" },
                { id: 3, type: "silence", durationSeconds: 5, content: "", transitionNote: "Silence" },
                { id: 4, type: "narration", durationSeconds: 10, content: "Feel the calm wind. [breathe]" }
            ],
            musicCues: [],
            ambientCues: [],
            // Use ID: prefix to harvest/test existing or force new? 
            // Let's force NEW to test Stable Audio (if it fails, we know).
            musicPrompt: "NEW: Soft flute and wind chimes, meditative, 60bpm",
            ambiencePrompt: "NEW: Gentle wind in leaves, distant birds",
            coverPrompt: "Abstract green bamboo forest, zen style, minimal",
            mixSettings: { voice: 5.0, music: 0.08, ambience: 0.08 },
            voiceStyle: "soft_female",
            generationMode: "phased",
            tags: ["test", "meditation"],
            createdAt: new Date().toISOString()
        };

        console.log(`✅ Mock Script Object Created: "${script.title}"`);

        // 2. Voice Generation (Local Qwen)
        // Check local ENV for Qwen first? index.ts handles it.
        // Force USE_LOCAL_TTS in process.env if not set?
        process.env.USE_LOCAL_TTS = 'true';
        const voiceRes = await generatePhasedVoice(script as any);
        console.log(`🎙️ Voice Generated: ${voiceRes.paths.size} segments`);

        // 3. Background Audio (Stable Audio)
        // If Stable Audio fails, we might need to mock this return too.
        console.log("🎵 Generating Backgrounds...");
        const [ambiencePath, musicPath] = await Promise.all([
            generateStableAudio(script.ambiencePrompt, `${script.title}_ambience.mp3`),
            generateStableAudio(script.musicPrompt, `${script.title}_music.mp3`)
        ]);

        // 4. Assets (DALL-E) - Skip if API is tight, but let's try.
        // Mock assets to save time/money if needed.
        const assets = {
            cover_url: '', cover_landscape_url: '', cover_portrait_url: '', imageCount: 0
        };
        // uncomment to test DALL-E: const assets = await generateAssetPack(script as any);

        // 5. Mixing (Crucial Step for Warmup)
        console.log("🎛️ Mixing...");
        const mixPath = await mixUnifiedAudio(script as any, voiceRes.paths, musicPath, ambiencePath);

        // 6. Voice Stem Mix
        const voiceStemPath = await mixUnifiedAudio(script as any, voiceRes.paths, '', '');

        // 7. Upload & Harvest
        console.log("☁️ Uploading & Harvesting...");
        await uploadStoryPackage(
            script as any,
            mixPath,
            { music: musicPath, ambience: ambiencePath, voiceMap: voiceRes.paths, voiceStem: voiceStemPath },
            assets
        );

        console.log("\n🎉 Test Run Complete!");

    } catch (e) {
        console.error("\n❌ Test Failed:", e);
    }
}

run();
