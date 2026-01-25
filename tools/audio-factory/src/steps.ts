import { generateScript, generatePhasedVoice, generateAssetPack, mixUnifiedAudio, uploadStoryPackage, StoryBrief, GeneratedScript } from './index.js';
import { generateStableAudio } from './index.js'; // Need to export this from index.ts first or move it
import * as fs from 'fs';
import * as path from 'path';
// Re-importing necessary environment loading if not handled by index.js import side-effects (it is currently)

// Helper to load/save JSON state
const WORKSPACE_DIR = path.join(process.cwd(), 'workspace');
if (!fs.existsSync(WORKSPACE_DIR)) fs.mkdirSync(WORKSPACE_DIR, { recursive: true });

function getWorkspacePath(id: string) {
    return path.join(WORKSPACE_DIR, `${id}.json`);
}

function loadState(id: string): any {
    const p = getWorkspacePath(id);
    if (!fs.existsSync(p)) throw new Error(`Workspace ID ${id} not found at ${p}`);
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function saveState(id: string, data: any) {
    fs.writeFileSync(getWorkspacePath(id), JSON.stringify(data, null, 2));
    console.log(`💾 State saved: ${getWorkspacePath(id)}`);
}

async function runStep() {
    const args = process.argv.slice(2);
    const command = args[0];
    const id = args[1]; // A unique ID for this production run (e.g., timestamp or slug)

    if (!command || !id) {
        console.error('Usage: npx tsx src/steps.ts <command> <id> [params...]');
        process.exit(1);
    }

    try {
        // ==========================================
        // STEP 1: DRAFT (Concept -> Script)
        // ==========================================
        if (command === 'draft') {
            // usage: draft <id> <category> <duration> "Title" "Description"
            const brief: StoryBrief = {
                category: args[2] || 'sleep',
                duration: parseInt(args[3]) || 5,
                title: args[4],
                description: args[5],
                generationMode: 'phased'
            };

            console.log(`📝 Drafting script for "${brief.title}"...`);
            const script = await generateScript(brief);

            // Initialize state
            const state = {
                id,
                status: 'drafted',
                brief,
                script,
                paths: { voice: {}, music: '', ambience: '', mix: '' },
                assets: {}
            };
            saveState(id, state);
        }

        // ==========================================
        // STEP 2: VOICES (Script -> Audio Stems)
        // ==========================================
        else if (command === 'voice') {
            const state = loadState(id);
            if (!state.script) throw new Error('No script found in state');

            console.log('🗣️ Generating Voices...');
            // Need to ensure generatePhasedVoice is exported and returns what we need
            // Assuming index.ts exports it. 
            // We might need to modify index.ts to export generateStableAudio too if it's not.
            const voiceRes = await generatePhasedVoice(state.script); // You need to export this in index.ts

            // Convert Map to Object for JSON serialization
            const voiceMapObj: Record<string, string> = {};
            voiceRes.paths.forEach((val, key) => { voiceMapObj[key] = val; });

            state.paths.voice = voiceMapObj;
            state.status = 'voices_generated';
            saveState(id, state);
        }

        // ==========================================
        // STEP 3: BACKGROUNDS (Music/Ambience)
        // ==========================================
        else if (command === 'backgrounds') {
            const state = loadState(id);
            // We need to access the generation functions. 
            // Note: In strict separate files, we'd import them. 
            // For now, we assume we can import/access them.

            console.log('🎵 Generating Backgrounds...');

            // NOTE: We need to expose generateStableAudio from index.ts or duplicate logic
            // For this snippet, assuming we can access them or implementing a wrapper in index.ts is better.
            // Let's assume we moved the logic or exported it.

            /* 
               Implement logic here invoking generateStableAudio 
               (We will fix imports in the next tool call)
            */

            // Placeholder logic to show intent:
            // const musicPath = await generateStableAudio(state.script.musicPrompt, `${id}_music.mp3`);
            // const ambiencePath = await generateStableAudio(state.script.ambiencePrompt, `${id}_ambience.mp3`);
            // state.paths.music = musicPath;
            // state.paths.ambience = ambiencePath;

            state.status = 'backgrounds_generated';
            saveState(id, state);
        }

        // ==========================================
        // STEP 4: MIX & UPLOAD
        // ==========================================
        else if (command === 'mix') {
            const state = loadState(id);
            console.log('🎛️ Mixing...');

            // Reconstruct Map
            const voiceMap = new Map<number, string>();
            Object.entries(state.paths.voice).forEach(([k, v]) => voiceMap.set(Number(k), v as string));

            const mixPath = await mixUnifiedAudio(state.script, voiceMap, state.paths.music, state.paths.ambience);

            console.log('☁️ Uploading...');
            // We need asset data. If step assets was skipped, we pass empty.
            const assets = state.assets || { cover_url: '', imageCount: 0 };

            // Generate Voice Stem (Silence + Voice)
            const voiceStemPath = await mixUnifiedAudio(state.script, voiceMap, '', '');

            await uploadStoryPackage(
                state.script,
                mixPath,
                {
                    music: state.paths.music,
                    ambience: state.paths.ambience,
                    voiceMap: voiceMap,
                    voiceStem: voiceStemPath
                },
                assets
            );

            state.status = 'completed';
            saveState(id, state);
        }

    } catch (e: any) {
        console.error(`❌ Error in step ${command}:`, e);
        process.exit(1);
    }
}

runStep();
