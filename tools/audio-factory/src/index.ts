/**
 * =====================================================
 * SOFTALE AUDIO FACTORY V6.0 - Unified Phased Engine
 * =====================================================
 * 
 * Market-Leading Architecture:
 * - Unified "Phased" Pipeline for ALL stories (Linear & Complex)
 * - 3-Stem Delivery (Voice, Music, Ambience)
 * - High-Fidelity Asset Generation
 * - Client-Side Mixing Ready
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import ffmpegPath from 'ffmpeg-static';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
import { createClient } from '@supabase/supabase-js';
import { ConceptEngine, StoryConcept } from './ConceptEngine.js';
import { voiceService } from './VoiceService.js';
import { AutoTagger } from './AutoTagger.js';
import { isQwenAvailable, generateWithVoice, getVoiceForCategory, AVAILABLE_VOICES } from './LocalTTSService.js';
import {
    CATEGORY_PROMPTS,
    CATEGORY_WPM,
    RECIPE_MATRIX,
    PHASE_TEMPLATES,
    PhaseTemplate,
    ASSET_MODIFIERS
} from './prompts.js';

// =====================================================
// Environment Setup
// =====================================================

// Load environment files in order of priority (later files override earlier ones)
// 1. First load root project .env.local (contains API keys)
// 2. Then load local .env (contains overrides like USE_LOCAL_TTS)

const envFilesToLoad = [
    path.resolve(process.cwd(), '../../.env.local'),  // Root .env.local (API keys)
    path.resolve(process.cwd(), '../../.env'),        // Root .env fallback
    path.resolve(process.cwd(), '.env.local'),        // Local .env.local
    path.resolve(process.cwd(), '.env')               // Local .env (overrides)
];

let envLoadedCount = 0;
for (const p of envFilesToLoad) {
    if (fs.existsSync(p)) {
        console.log(`🔧 Loading environment from: ${p}`);
        dotenv.config({ path: p, override: true });
        envLoadedCount++;
    }
}

if (envLoadedCount === 0) console.warn('⚠️  No .env file found!');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const OUTPUT_DIR = path.join(process.cwd(), 'output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// =====================================================
// Type Definitions
// =====================================================

export interface StoryBrief {
    title?: string;
    category: string;
    duration: number; // minutes
    theme?: string;
    description?: string;
    mood?: string;
    voiceStyle?: 'soft_female' | 'soft_male' | 'neutral';
    voiceId?: string;
    musicFile?: string;
    pacingMode?: 'continuous' | 'immersive' | 'breathwork';
    warmupDuration?: number;
    mixSettings?: {
        voice: number;
        music: number;
        ambience: number;
    };
    layers?: {
        voice: boolean;
        music: boolean;
        ambience: boolean;
    };
    ambiencePrompt?: string;
    generationMode?: 'auto' | 'continuous' | 'phased';
    tags?: string[]; // Auto-generated or passed through
}

export interface NarrationPhase {
    id: number;
    type: 'narration' | 'silence' | 'ambience_only' | 'breathing_guide';
    durationSeconds: number;
    content?: string;
    breathPattern?: string;
    transitionNote?: string;
}

export interface GeneratedScript {
    id?: string;
    slug?: string;
    title: string;
    category: string;
    duration: number;
    script: string; // Concatenated text for backward compatibility
    musicCues: string[];
    ambientCues: string[];
    signatureMotif?: string;
    coverPrompt: string;
    musicPrompt: string;
    ambiencePrompt?: string;
    voiceIdOverride?: string;
    mixSettings?: { voice: number; music: number; ambience: number; };
    voiceStyle?: string;
    musicFile?: string;
    backingCategory?: string;
    backingTitle?: string;
    backingCoverPrompt?: string;
    createdAt: string;
    pacingMode?: string;
    warmupDuration?: number;
    tags?: string[];
    generationMode: 'phased'; // Always phased in V6
    phases: NarrationPhase[];
    usageStats?: {
        claudeInput: number;
        claudeOutput: number;
        elevenLabsChars: number;
        dalleImages: number;
        stableAudioCount: number;
    };
}

interface AssetDesign {
    coverPrompt: string;
    musicPrompt: string;
    backingCategory?: string;
    backingTitle?: string;
    backingCoverPrompt?: string;
    ambiencePrompt?: string;
}

interface LoopAsset {
    id: string;
    title: string;
    description: string;
    category: string;
    audio_url: string;
}

// =====================================================
// Claude API Helper
// =====================================================

export interface ClaudeResponse {
    text: string;
    usage: { input_tokens: number; output_tokens: number; };
}

export async function callClaude(systemPrompt: string, userPrompt: string, maxTokens: number = 4096): Promise<ClaudeResponse> {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not set');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: 'claude-opus-4-5-20251101',
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
        }),
    });

    if (!response.ok) {
        throw new Error(`Claude API error: ${await response.text()}`);
    }

    const data = await response.json();
    return {
        text: data.content[0].text,
        usage: { input_tokens: data.usage?.input_tokens || 0, output_tokens: data.usage?.output_tokens || 0 }
    };
}

// =====================================================
// Stock Loop Logic
// =====================================================

let cachedLoops: LoopAsset[] | null = null;

async function fetchStockLoops(): Promise<LoopAsset[]> {
    if (cachedLoops) return cachedLoops;
    const { data } = await supabase.from('stories').select('id, title, description, category, audio_url').eq('is_loop', true).not('audio_url', 'is', null);
    cachedLoops = data || [];
    return cachedLoops;
}

function formatLoopsForPrompt(loops: LoopAsset[]): string {
    if (loops.length === 0) return 'No stock loops available.';
    let output = '**AVAILABLE STOCK LOOPS:**\n';
    loops.forEach(l => output += `- ID: ${l.id} | "${l.title}" - ${l.description}\n`);
    return output;
}

/**
 * Download an existing loop from Supabase by ID (Harvesting)
 */
async function downloadLoopById(id: string, filename: string): Promise<string> {
    console.log(`   📥 Harvesting existing loop: ${id}`);
    const { data } = await supabase
        .from('stories')
        .select('audio_url')
        .eq('id', id)
        .single();

    if (!data?.audio_url) {
        console.warn(`   ⚠️ Loop ${id} not found`);
        return '';
    }

    try {
        const response = await fetch(data.audio_url);
        const buffer = Buffer.from(await response.arrayBuffer());
        const outPath = path.join(OUTPUT_DIR, filename);
        fs.writeFileSync(outPath, buffer);
        console.log(`   ✅ Downloaded: ${outPath}`);
        return outPath;
    } catch (e: any) {
        console.error(`   ❌ Download failed: ${e.message}`);
        return '';
    }
}


// =====================================================
// Unified Script Generation (Phase Engine)
// =====================================================

export async function generateScript(brief: StoryBrief): Promise<GeneratedScript> {
    console.log(`\n🏭 AUDIO FACTORY V6.0 - Generating Story: ${brief.title}`);
    console.log(`   Category: ${brief.category} | Duration: ${brief.duration}m`);

    const totalSeconds = brief.duration * 60;

    // 1. Select Template (Default to Linear if category not found)
    let templateName = brief.category;
    if (!PHASE_TEMPLATES[templateName]) {
        console.log(`   ℹ️ No specific phase template for '${templateName}', using 'linear'.`);
        templateName = 'linear';
    }

    // Allow override for "Continuous" requests -> Linear
    if (brief.generationMode === 'continuous') {
        templateName = 'linear';
    }

    const template = PHASE_TEMPLATES[templateName];

    // 2. Build Phases
    const phases: NarrationPhase[] = template.map((t, idx) => ({
        id: idx + 1,
        type: t.type,
        durationSeconds: Math.round(totalSeconds * (t.durationPercent / 100)),
        transitionNote: t.description,
    }));

    console.log(`   📊 Phase structure: ${phases.length} phases (${templateName})`);

    // 3. Generate Content for Narration Phases
    const narrationPhases = phases.filter(p => p.type === 'narration');
    let totalWordCount = 0;

    for (const phase of narrationPhases) {
        const targetWords = Math.round((phase.durationSeconds / 60) * (CATEGORY_WPM[brief.category] || 130));

        // Contextual Prompting
        const catPrompt = CATEGORY_PROMPTS[brief.category] || CATEGORY_PROMPTS['fantasy'];
        const systemPrompt = catPrompt + `
        
**PHASE CONTEXT:**
Phase ${phase.id}/${phases.length}: "${phase.transitionNote}"
Duration: ${phase.durationSeconds}s
Target: ${targetWords} words
${brief.description ? `\n**IDEA**: ${brief.description}\n` : ''}
${brief.title ? `Title: ${brief.title}` : ''}

**CRITICAL**: Write EXACTLY ${targetWords} words.
Maintain flow from previous phases.`;

        const userPrompt = `Write Phase ${phase.id}. Return JSON: { "content": "text with [pause] markers", "wordCount": number }`;

        try {
            const res = await callClaude(systemPrompt, userPrompt, 2000);
            const json = JSON.parse(res.text.match(/\{[\s\S]*\}/)?.[0] || '{}');
            phase.content = json.content;
            totalWordCount += (json.wordCount || 0);
            console.log(`      ✅ Phase ${phase.id}: ${json.wordCount} words`);
        } catch (e: any) {
            console.error(`      ❌ Phase ${phase.id} failed: ${e.message}`);
            phase.content = "Relax and breathe... [pause]"; // Emergency fallback
        }
    }

    // 4. Asset Design
    const stockLoops = await fetchStockLoops();
    const assetDesign = await generateAssetDesign(brief, phases, stockLoops);

    // 5. Breathing Patterns
    phases.filter(p => p.type === 'breathing_guide').forEach(p => {
        p.breathPattern = brief.category === 'breathwork' ? '4-7-8' : '4-4-4-4';
    });

    // 6. Auto-generate title if not provided
    let finalTitle = brief.title;
    if (!finalTitle || finalTitle === 'Untitled Story' || finalTitle.trim() === '') {
        console.log('   [TITLE] Generating creative title...');
        try {
            const titlePrompt = `Based on this story content, generate a creative, evocative title.
Category: ${brief.category}
First phase: "${phases[0]?.content?.substring(0, 200) || brief.description || 'relaxation story'}"

Return ONLY a JSON object: { "title": "The Title" }
Keep it SHORT (2-5 words), poetic, and memorable.`;

            const titleRes = await callClaude(titlePrompt, 'Generate title', 200);
            const titleJson = JSON.parse(titleRes.text.match(/\{[\s\S]*\}/)?.[0] || '{}');
            finalTitle = titleJson.title || `${brief.category.charAt(0).toUpperCase() + brief.category.slice(1)} Journey`;
            console.log(`   [OK] Generated title: "${finalTitle}"`);
        } catch (e: any) {
            // Fallback: generate based on category and timestamp
            const timestamp = Date.now().toString(36);
            finalTitle = `${brief.category.charAt(0).toUpperCase() + brief.category.slice(1)} Story ${timestamp}`;
            console.log(`   [WARN] Title fallback: "${finalTitle}"`);
        }
    }

    // 7. Generate unique slug
    const safeTitle = finalTitle || 'Untitled';
    const baseSlug = safeTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    return {
        id: uniqueSlug,
        slug: uniqueSlug,
        title: safeTitle,
        category: brief.category,
        duration: brief.duration,
        script: phases.map(p => p.content || '').join('\n\n'),
        musicCues: [],
        ambientCues: [],
        signatureMotif: 'V6 Unified',
        coverPrompt: assetDesign.coverPrompt,
        musicPrompt: assetDesign.musicPrompt,
        ambiencePrompt: assetDesign.ambiencePrompt,
        backingTopts: assetDesign,
        voiceIdOverride: brief.voiceId,
        createdAt: new Date().toISOString(),
        generationMode: 'phased',
        phases: phases,
        voiceStyle: brief.voiceStyle,
        mixSettings: brief.mixSettings || { voice: 5.0, music: 0.08, ambience: 0.08 },
        tags: brief.tags || []
    } as any;
}

async function generateAssetDesign(brief: StoryBrief, phases: NarrationPhase[], loops: LoopAsset[]): Promise<AssetDesign> {
    console.log('🎨 Designing Assets (High Fidelity)...');

    // For pure audio categories, don't expose stock loops (force fresh generation)
    const isPure = ['soundscape', 'binaural', 'music_instrumental'].includes(brief.category);
    const loopsPrompt = isPure ? '' : formatLoopsForPrompt(loops);

    const systemPrompt = `You are an Audio Director. Design assets for this story.
${loopsPrompt}
**Use High Fidelity keywords**: ${ASSET_MODIFIERS.ambience}
`;

    const userPrompt = `Story: "${brief.title}" (${brief.category})
Phases: ${phases.map(p => p.transitionNote).join(' -> ')}

Return JSON:
{
    "coverPrompt": "DALL-E prompt",
    "musicPrompt": "ID: [uuid]" or "NEW: [Stable Audio prompt]",
    "ambiencePrompt": "Stable Audio prompt for background texture",
    "backingCategory": "soundscape" (if generating new music),
    "backingTitle": "Title for backing track"
}`;

    const res = await callClaude(systemPrompt, userPrompt);
    return JSON.parse(res.text.match(/\{[\s\S]*\}/)?.[0] || '{}');
}

// =====================================================
// Audio Generators
// =====================================================

export async function generatePhasedVoice(script: GeneratedScript): Promise<{ paths: Map<number, string>, chars: number }> {
    console.log('🎙️ Generating Phased Voice...');

    // Check if we should use local Qwen TTS
    const useLocalTTS = process.env.USE_LOCAL_TTS === 'true';

    if (useLocalTTS) {
        // --- QWEN LOCAL PATH WITH VOICE LIBRARY ---
        console.log('   🔍 Checking Qwen API availability...');
        const qwenAvailable = await isQwenAvailable();
        if (!qwenAvailable) {
            console.error('   ❌ [ERROR] Qwen API is NOT available or model not loaded.');
            console.error('   👉 Ensure the API is running: cd tools/qwen-api && uvicorn server:app --host 0.0.0.0 --port 8000');
            console.error('   👉 Check http://localhost:8000/health returns {"status":"ok","clone_model":"loaded"}');
            return { paths: new Map(), chars: 0 };
        }
        console.log('   ✅ [TTS] Qwen API Connected. Using Voice Library.');

        // Determine voice: use explicit voiceId or derive from category
        const voiceId = script.voiceStyle || getVoiceForCategory(script.category);
        console.log(`   [TTS] Voice: "${voiceId}" | Category: ${script.category}`);

        const paths = new Map<number, string>();
        let totalChars = 0;

        for (const phase of script.phases) {
            if (phase.type !== 'narration' || !phase.content) continue;

            const text = phase.content
                .replace(/\[breathe.*?\]/gi, " ... ")
                .replace(/\[.*?\]/g, (m) => m.includes('pause') ? " ... " : "")
                .replace(/\(.*?\)/g, "").trim();

            if (!text) continue;

            // Qwen outputs WAV
            const outPath = path.join(OUTPUT_DIR, `${script.title}_p${phase.id}.wav`.replace(/\s+/g, '_'));

            const result = await generateWithVoice({
                text,
                voiceId,
                category: script.category,
                language: 'English',
                outputPath: outPath
            });

            if (result.success && result.path) {
                paths.set(phase.id, result.path);
                totalChars += text.length;
                console.log(`      [OK] Phase ${phase.id} complete (${result.voiceUsed})`);
            } else {
                console.error(`      [ERROR] Phase ${phase.id} failed: ${result.error}`);
            }
        }

        return { paths, chars: totalChars };
    }

    // --- ELEVENLABS CLOUD PATH (Original Logic) ---
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) {
        console.warn('   ⚠️ No ELEVENLABS_API_KEY found. Set USE_LOCAL_TTS=true to use Qwen.');
        return { paths: new Map(), chars: 0 };
    }

    console.log('   ☁️ Using CLOUD ElevenLabs TTS');

    // Voice Selection
    let voiceId = script.voiceIdOverride;
    if (!voiceId) {
        const isSoft = ['meditation', 'sleep'].includes(script.category);
        const gender = script.voiceStyle?.includes('male') ? 'male' : 'female';
        const v = await voiceService.pickVoice({ gender });
        voiceId = v?.voice_id || (gender === 'male' ? 'NOpBlnGInO9m6vDvFkFC' : 'mZ3kbJNnKRWI4YzJXA9j');
        console.log(`   🗣️ Voice: ${v?.name || 'Default'} (${voiceId})`);
    }

    const paths = new Map<number, string>();
    let totalChars = 0;

    for (const phase of script.phases) {
        if (phase.type !== 'narration' || !phase.content) continue;

        const text = phase.content
            .replace(/\[breathe.*?\]/gi, " ... ")
            .replace(/\[.*?\]/g, (m) => m.includes('pause') ? " ... " : "")
            .replace(/\(.*?\)/g, "").trim();

        if (!text) continue;

        const outPath = path.join(OUTPUT_DIR, `${script.title}_p${phase.id}.mp3`.replace(/\s+/g, '_'));

        try {
            const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: 'POST',
                headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: { stability: 0.65, similarity_boost: 0.75 }
                })
            });

            if (!resp.ok) throw new Error((await resp.text()));
            fs.writeFileSync(outPath, Buffer.from(await resp.arrayBuffer()));
            paths.set(phase.id, outPath);
            totalChars += text.length;
            console.log(`      ✅ Visited Phase ${phase.id}`);
        } catch (e: any) {
            console.error(`      ❌ Voice Error P${phase.id}: ${e.message}`);
        }
    }
    return { paths, chars: totalChars };
}


export async function generateStableAudio(prompt: string, filename: string, duration: number = 180): Promise<string> {
    // Harvesting: If prompt starts with ID:, download existing asset
    if (prompt && prompt.startsWith('ID:')) {
        const id = prompt.replace('ID:', '').trim();
        return await downloadLoopById(id, filename);
    }

    const key = process.env.STABILITY_API_KEY || process.env.STABLE_AUDIO_API_KEY;
    if (!key || !prompt) return '';

    console.log(`   [AUDIO] Generating: ${prompt.substring(0, 40)}...`);
    const formData = new FormData();
    formData.append('prompt', prompt.replace(/^NEW:\s*/i, ''));
    formData.append('duration', duration.toString());
    formData.append('model', 'stable-audio-2.5');

    // Retry configuration
    const MAX_RETRIES = 3;
    const BACKOFF_MS = [1000, 2000, 4000]; // 1s, 2s, 4s

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const resp = await fetch('https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${key}`, 'Accept': 'audio/*' },
                body: formData,
                signal: AbortSignal.timeout(120000) // 2 minute timeout
            });

            if (!resp.ok) {
                const errorText = await resp.text();
                throw new Error(`HTTP ${resp.status}: ${errorText}`);
            }

            const outPath = path.join(OUTPUT_DIR, filename);
            fs.writeFileSync(outPath, Buffer.from(await resp.arrayBuffer()));
            console.log(`   [OK] Audio saved: ${filename}`);
            return outPath;

        } catch (e: any) {
            console.warn(`   [RETRY ${attempt}/${MAX_RETRIES}] Stable Audio Error: ${e.message}`);

            if (attempt < MAX_RETRIES) {
                const delay = BACKOFF_MS[attempt - 1];
                console.log(`   [WAIT] Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error(`   [SKIP] Stable Audio failed after ${MAX_RETRIES} attempts. Continuing without audio.`);
                return '';
            }
        }
    }

    return '';
}

// =====================================================
// Unified Mixer (3-Stem Support)
// =====================================================

export async function mixUnifiedAudio(
    script: GeneratedScript,
    voicePaths: Map<number, string>,
    musicPath: string,
    ambiencePath: string
): Promise<string> {
    console.log('🎛️ Unified Mixing (Voice + Music + Ambience)...');

    // Calculate total duration
    // Calculate total duration (Total Phases + Warmup)
    const phasesDuration = script.phases.reduce((sum, p) => sum + p.durationSeconds, 0);
    const totalDuration = phasesDuration + (script.warmupDuration || 0);
    const outputPath = path.join(OUTPUT_DIR, `mixed_${Date.now()}.mp3`);

    // Prepare Voice Overlays
    const overlays: { path: string, start: number }[] = [];
    let currentTime = script.warmupDuration || 0; // Start voice after warmup

    for (const p of script.phases) {
        if (voicePaths.has(p.id)) {
            overlays.push({ path: voicePaths.get(p.id)!, start: currentTime });
        }
        currentTime += p.durationSeconds;
    }

    // FFmpeg Command Construction
    let inputs = [];
    let filterComplex = '';
    let idx = 0;

    // Input 0: Ambience (Loop)
    if (ambiencePath && fs.existsSync(ambiencePath)) {
        inputs.push(`-stream_loop -1 -i "${ambiencePath}"`);
        filterComplex += `[${idx}:a]volume=${script.mixSettings?.ambience || 0.12}[amb];`;
        idx++;
    } else {
        filterComplex += `aevalsrc=0:d=${totalDuration}[amb];`; // Silent ambience fallback
    }

    // Input 1: Music (Loop)
    if (musicPath && fs.existsSync(musicPath)) {
        inputs.push(`-stream_loop -1 -i "${musicPath}"`);
        filterComplex += `[${idx}:a]volume=${script.mixSettings?.music || 0.12}[mus];`;
        idx++;
    } else {
        filterComplex += `aevalsrc=0:d=${totalDuration}[mus];`; // Silent music fallback
    }

    // Combine Backing
    filterComplex += `[amb][mus]amix=inputs=2:duration=first:dropout_transition=2[backing];`;

    // Add Voice Inputs
    let voiceMixChain = '[backing]';
    let voiceIdxStart = idx;

    overlays.forEach((o, i) => {
        inputs.push(`-i "${o.path}"`);
        const delay = o.start * 1000;
        const currentIdx = voiceIdxStart + i;
        filterComplex += `[${currentIdx}:a]adelay=${delay}|${delay},volume=${script.mixSettings?.voice || 3.0}[v${i}];`;
    });

    // Iteratively mix voices onto backing
    // Optimization: mix all voices into one overlay layer first? No, adelay is distinct.
    // We mix sequentially or use huge amix. Sequential is safer for alignment.

    let lastMix = 'backing';
    overlays.forEach((o, i) => {
        const nextMix = i === overlays.length - 1 ? 'out' : `mix${i}`;
        filterComplex += `[${lastMix}][v${i}]amix=inputs=2:duration=first:weights=1 1:dropout_transition=0[${nextMix}];`;
        lastMix = nextMix;
    });

    if (overlays.length === 0) {
        filterComplex += `[backing]anull[out]`; // No voice case
    } else {
        // Fix final label if loop ended
    }

    // Clean up filter string logic slightly for robustness
    filterComplex = filterComplex.replace(/\[out\];$/, '[out]');

    const cmd = `"${ffmpegPath}" -y ${inputs.join(' ')} -filter_complex "${filterComplex}" -map "[out]" -t ${totalDuration} "${outputPath}"`;

    try {
        await execPromise(cmd);
        return outputPath;
    } catch (e: any) {
        console.error('Mix failed:', e.message);
        return ambiencePath || musicPath || '';
    }
}

// =====================================================
// Upload & Harvest
// =====================================================

export async function uploadStoryPackage(script: GeneratedScript, mixPath: string, stems: { music: string, ambience: string, voiceMap: Map<number, string>, voiceStem?: string }, assets: AssetPack) {
    console.log('☁️ Uploading Story Package with Stems...');

    const slug = script.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const storageRoot = `${new Date().toISOString().split('T')[0]}/${slug}`;

    const uploadFile = async (filePath: string, name: string) => {
        if (!filePath || !fs.existsSync(filePath)) return null;
        const buffer = fs.readFileSync(filePath);
        const path = `${storageRoot}/${name}`;
        await supabase.storage.from('audio').upload(path, buffer, { upsert: true, contentType: 'audio/mpeg' });
        return supabase.storage.from('audio').getPublicUrl(path).data.publicUrl;
    };

    const mixUrl = await uploadFile(mixPath, 'full_mix.mp3');
    const musicUrl = await uploadFile(stems.music, 'stem_music.mp3');
    const ambienceUrl = await uploadFile(stems.ambience, 'stem_ambience.mp3');
    const voiceUrl = await uploadFile(stems.voiceStem || '', 'stem_voice.mp3');

    // Images
    const uploadImg = async (url: string, suffix: string) => {
        if (!url) return null;
        // Assume url is local path for now if generated, or remote?
        // AssetPack returns local paths in V6? Let's assume local.
        if (fs.existsSync(url)) {
            const b = fs.readFileSync(url);
            const p = `${storageRoot}/cover${suffix}.png`;
            await supabase.storage.from('covers').upload(p, b, { upsert: true, contentType: 'image/png' });
            return supabase.storage.from('covers').getPublicUrl(p).data.publicUrl;
        }
        return null;
    };

    const coverUrl = await uploadImg(assets.cover_url, '');
    const coverLandscapeUrl = await uploadImg(assets.cover_landscape_url, '_wide');
    const coverPortraitUrl = await uploadImg(assets.cover_portrait_url, '_tall');

    // DB Upsert
    const { data: storyData, error: storyError } = await supabase.from('stories').upsert({
        title: script.title,
        slug: slug,
        category: script.category,
        duration: script.duration * 60,
        audio_url: mixUrl,
        voice_url: voiceUrl,
        music_url: musicUrl,
        ambient_url: ambienceUrl,
        cover_url: coverUrl,
        cover_landscape_url: coverLandscapeUrl,
        cover_portrait_url: coverPortraitUrl,
        audio_phases: script.phases,
        script_text: script.script,
        tags: script.tags || [],
        is_published: false
    }, { onConflict: 'slug' }).select().single();

    if (storyError) {
        console.error('❌ Failed to save story:', storyError);
    } else {
        console.log(`   ✅ Story Uploaded: ${slug}`);

        // --- HARVESTING ENGINE ---
        // Automatically save generated assets as reusable loops

        const harvestLoop = async (type: 'music' | 'ambience', url: string | null, prompt: string | undefined) => {
            if (!url || !prompt || prompt.startsWith('ID:')) return;

            const loopTitle = `${script.title} (${type === 'music' ? 'Music' : 'Ambience'})`;
            const loopSlug = `${slug}-${type}-loop`;
            const loopCategory = type === 'music' ? 'music_instrumental' : 'soundscape';

            console.log(`   🌾 Harvesting ${type} loop: ${loopTitle}`);

            await supabase.from('stories').upsert({
                title: loopTitle,
                slug: loopSlug,
                category: loopCategory,
                description: `Harvested ${type} from "${script.title}". Prompt: ${prompt}`,
                duration: script.duration * 60,
                audio_url: url,
                cover_url: coverUrl, // Use main story cover for now
                is_loop: true,
                is_published: true, // Auto-publish loops for reuse? Yes.
                tags: [...(script.tags || []), type, 'harvested']
            }, { onConflict: 'slug' });
        };

        if (stems.music) await harvestLoop('music', musicUrl, script.musicPrompt);
        if (stems.ambience) await harvestLoop('ambience', ambienceUrl, script.ambiencePrompt);
    }
}

// =====================================================
// Asset Generation (DALL-E 3)
// =====================================================

interface AssetPack {
    cover_url: string;           // Square (1:1)
    cover_landscape_url: string; // Wide (16:9)
    cover_portrait_url: string;  // Tall (9:16)
    backing_cover_url?: string;
    backing_cover_landscape_url?: string;
    backing_cover_portrait_url?: string;
    imageCount?: number;
}

export async function generateAssetPack(script: GeneratedScript): Promise<AssetPack & { imageCount: number }> {
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
        console.log('⚠️ OPENAI_API_KEY not set - skipping asset generation');
        return { cover_url: '', cover_landscape_url: '', cover_portrait_url: '', imageCount: 0 };
    }

    console.log('🖼️ Generating Asset Pack with DALL-E 3...');
    const basePrompt = script.coverPrompt || `Dreamy, ethereal artwork for "${script.title}" - ${script.category} audio experience`;

    const generateVariant = async (prompt: string, aspect: string, size: string, suffix: string): Promise<string> => {
        const safeTitle = script.title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        const outputPath = path.join(OUTPUT_DIR, `${safeTitle}_${suffix}.png`);

        if (fs.existsSync(outputPath)) {
            console.log(`      ⏩ Exists: ${outputPath}`);
            return outputPath;
        }

        console.log(`   🎨 Generating ${suffix} (${aspect})...`);
        try {
            const response = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiKey}`,
                },
                body: JSON.stringify({
                    model: 'dall-e-3',
                    prompt: prompt + ` --ar ${aspect}`,
                    n: 1,
                    size: size as "1024x1024" | "1024x1792" | "1792x1024",
                    quality: 'hd',
                }),
            });

            if (!response.ok) throw new Error(await response.text());

            const data = await response.json();
            const imageUrl = data.data[0]?.url;
            if (!imageUrl) throw new Error("No image URL returned");

            const imageResponse = await fetch(imageUrl);
            const buffer = Buffer.from(await imageResponse.arrayBuffer());
            fs.writeFileSync(outputPath, buffer);
            console.log(`      ✅ Saved: ${outputPath}`);
            return outputPath;
        } catch (error: any) {
            console.log(`      ⚠️ Failed ${suffix}: ${error.message || error}`);
            return '';
        }
    };

    // 1. Main Story Assets
    const [squarePath, widePath, tallPath] = await Promise.all([
        generateVariant(basePrompt, '1:1', '1024x1024', 'cover'),
        generateVariant(basePrompt, '16:9', '1792x1024', 'wide'),
        generateVariant(basePrompt, '9:16', '1024x1792', 'tall')
    ]);

    // 2. Backing Assets (if relevant)
    let backingAssets = {};
    if (script.backingCoverPrompt) {
        console.log('   🎹 Generating Backing Assets...');
        const [bSquare, bWide, bTall] = await Promise.all([
            generateVariant(script.backingCoverPrompt, '1:1', '1024x1024', 'backing_cover'),
            generateVariant(script.backingCoverPrompt, '16:9', '1792x1024', 'backing_wide'),
            generateVariant(script.backingCoverPrompt, '9:16', '1024x1792', 'backing_tall')
        ]);
        backingAssets = {
            backing_cover_url: bSquare,
            backing_cover_landscape_url: bWide,
            backing_cover_portrait_url: bTall
        };
    }

    return {
        cover_url: squarePath,
        cover_landscape_url: widePath,
        cover_portrait_url: tallPath,
        ...backingAssets,
        imageCount: 3 + (script.backingCoverPrompt ? 3 : 0)
    };
}

// =====================================================
// Main Orchestrator
// =====================================================

export async function generateStory(brief: StoryBrief) {
    // 1. Script
    const script = await generateScript(brief);

    // Get recipe for conditional generation
    const recipe = RECIPE_MATRIX[brief.category] || { voice: true, backing: 'soundscape' };
    console.log(`   📋 Recipe: voice=${recipe.voice}, backing=${recipe.backing}`);

    // 2. Voice Generation (conditional)
    let voiceRes: { paths: Map<number, string>, chars: number };
    if (recipe.voice) {
        voiceRes = await generatePhasedVoice(script);
    } else {
        console.log('   ⏭️ Skipping voice generation (pure audio category)');
        voiceRes = { paths: new Map(), chars: 0 };
    }

    // 3. Audio Backgrounds (conditional based on backing type)
    let musicPath = '';
    let ambiencePath = '';

    if (recipe.backing === 'soundscape') {
        // Soundscape: ambience primary, music optional
        [ambiencePath, musicPath] = await Promise.all([
            generateStableAudio(script.ambiencePrompt || "", `${script.title}_ambience.mp3`),
            script.musicPrompt ? generateStableAudio(script.musicPrompt, `${script.title}_music.mp3`) : Promise.resolve('')
        ]);
    } else if (recipe.backing === 'music') {
        // Music-based: both music and optional ambience
        [musicPath, ambiencePath] = await Promise.all([
            generateStableAudio(script.musicPrompt, `${script.title}_music.mp3`),
            script.ambiencePrompt ? generateStableAudio(script.ambiencePrompt, `${script.title}_ambience.mp3`) : Promise.resolve('')
        ]);
    } else if (recipe.backing === 'frequency') {
        // Binaural/frequency: only music (the frequency track)
        musicPath = await generateStableAudio(script.musicPrompt, `${script.title}_music.mp3`);
    }

    // 4. Assets
    const assets = await generateAssetPack(script);

    // 5. Mix Full
    const mixPath = await mixUnifiedAudio(script, voiceRes.paths, musicPath, ambiencePath);

    // 6. Mix Voice Stem (only if voice was generated)
    const voiceStemPath = recipe.voice
        ? await mixUnifiedAudio(script, voiceRes.paths, '', '')
        : '';

    // 7. Upload
    await uploadStoryPackage(script, mixPath, { music: musicPath, ambience: ambiencePath, voiceMap: voiceRes.paths, voiceStem: voiceStemPath }, assets);
}

// CLI Entry
const isMainModule = import.meta.url.replace(/^file:\/\/\//, '').replace(/\//g, '\\').toLowerCase() ===
    process.argv[1]?.replace(/\//g, '\\').toLowerCase();

if (isMainModule) {
    const args = process.argv.slice(2);
    console.log(`🚀 CLI Mode: ${args[0] || 'no command'}`);

    // Full generation (for direct CLI use)
    if (args[0] === 'full') {
        const category = args[1] || 'sleep';
        const duration = parseInt(args[2]) || 5;
        const description = process.env.STORY_DESCRIPTION || args[3] || '';
        generateStory({ category, duration, description: description || undefined }).catch(console.error);
    }

    // Concept generation only (for API step 1)
    if (args[0] === 'concept') {
        const category = args[1] || 'sleep';
        const idea = args[2] || 'A peaceful relaxation journey';
        const optionsBase64 = args[3] || '';

        let options: any = {};
        if (optionsBase64) {
            try {
                options = JSON.parse(Buffer.from(optionsBase64, 'base64').toString('utf-8'));
            } catch (e) {
                console.error('Failed to parse options:', e);
            }
        }

        (async () => {
            try {
                const concept = await ConceptEngine.generate(idea, category, options);

                // Save concept to file
                const slug = (concept.title || 'untitled')
                    .toLowerCase()
                    .replace(/[^a-z0-9\s]/g, '')
                    .replace(/\s+/g, '_')
                    .substring(0, 40);
                const filename = `${slug}_${Date.now()}.json`;
                const filepath = path.join(OUTPUT_DIR, filename);

                fs.writeFileSync(filepath, JSON.stringify(concept, null, 2));
                console.log(`Concept Saved: ${filepath}`);
            } catch (e) {
                console.error('Concept generation failed:', e);
                process.exit(1);
            }
        })();
    }

    // Build from existing concept file (for API step 2)
    if (args[0] === 'build') {
        const conceptPath = args[1];
        if (!conceptPath || !fs.existsSync(conceptPath)) {
            console.error(`Concept file not found: ${conceptPath}`);
            process.exit(1);
        }

        (async () => {
            try {
                const concept = JSON.parse(fs.readFileSync(conceptPath, 'utf-8'));

                // Convert concept to StoryBrief format
                const brief: StoryBrief = {
                    category: concept.category || 'sleep',
                    duration: concept.intendedDuration || 10,
                    title: concept.title,
                    description: concept.logline,
                    tags: concept.tags,
                    voiceStyle: concept.audioIdentity?.voiceStyle,
                    mixSettings: concept.mixSettings
                };

                await generateStory(brief);
                console.log(`Story Complete! ID: ${concept.title?.toLowerCase().replace(/\s+/g, '-') || 'generated'}`);
            } catch (e) {
                console.error('Build failed:', e);
                process.exit(1);
            }
        })();
    }

    if (args[0] === 'stitch') {
        const outputFilename = args[1];
        const inputFiles = args.slice(2);
        stitchVoicePhases(inputFiles, outputFilename).then(path => console.log(path)).catch(console.error);
    }
}

export async function stitchVoicePhases(filePaths: string[], outputFilename: string): Promise<string> {
    console.log(`🧵 Stitching ${filePaths.length} voice segments...`);

    // Create a temporary file list for ffmpeg concat demuxer
    const listPath = path.join(OUTPUT_DIR, `concat_list_${Date.now()}.txt`);
    const fileContent = filePaths.map(f => {
        // Fix for Windows paths in ffmpeg concat file
        const safePath = f.replace(/\\/g, '/');
        return `file '${safePath}'`;
    }).join('\n');

    fs.writeFileSync(listPath, fileContent);

    const outputPath = path.join(OUTPUT_DIR, outputFilename);
    const cmd = `"${ffmpegPath}" -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}" -y`;

    try {
        await execPromise(cmd);
        // Clean up list file
        fs.unlinkSync(listPath);
        return outputPath;
    } catch (e: any) {
        console.error('Stitch failed:', e.message);
        throw e;
    }
}
