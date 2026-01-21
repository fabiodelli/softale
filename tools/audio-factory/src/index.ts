/**
 * =====================================================
 * SOFTALE AUDIO FACTORY V4.0 - Multi-Phase Architecture
 * =====================================================
 * 
 * Complete audio story generation pipeline with:
 * - 4-phase Claude AI generation (Story Design → Script → Assets → Audio Direction)
 * - ElevenLabs v3 voice synthesis
 * - Stable Audio music generation
 * - Harvest Engine for loop reuse
 * - DALL-E cover art generation
 * - Supabase storage & database
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import ffmpegPath from 'ffmpeg-static';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
import { createClient } from '@supabase/supabase-js';
import { CATALOG_ITEMS } from './catalog-config.js';
import { ConceptEngine, StoryConcept } from './ConceptEngine.js';
import { voiceService } from './VoiceService.js';
import { AutoTagger } from './AutoTagger.js';

// ENIVORNMENT CONFIGURATION - CENTRALIZED
const rootEnvLocal = path.resolve(process.cwd(), '.env.local');
const rootEnv = path.resolve(process.cwd(), '.env');

// Prioritize .env.local, fallback to .env
if (fs.existsSync(rootEnvLocal)) {
    console.log(`🔧 Loading environment from: .env.local`);
    dotenv.config({ path: rootEnvLocal });
} else if (fs.existsSync(rootEnv)) {
    console.log(`🔧 Loading environment from: .env`);
    dotenv.config({ path: rootEnv });
} else {
    console.warn('⚠️  No .env.local or .env found in project root!');
}

// =====================================================
// Environment & Initialization
// =====================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const OUTPUT_DIR = path.join(process.cwd(), 'output');
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// =====================================================
// Type Definitions
// =====================================================

export interface StoryBrief {
    title?: string;
    category: string;
    duration: number; // minutes
    theme?: string;
    description?: string; // For batch scripts
    mood?: string; // For batch scripts
    voiceStyle?: 'soft_female' | 'soft_male' | 'neutral';
    voiceId?: string;
    musicFile?: string;
    // V5 Fields
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
    // V6 Phased Narration
    generationMode?: 'auto' | 'continuous' | 'phased';
}

export interface GeneratedScript {
    id?: string; // For batch scripts
    slug?: string;
    title: string;
    category: string;
    duration: number;
    script: string;
    musicCues: string[];
    ambientCues: string[];
    signatureMotif?: string;
    coverPrompt: string;
    musicPrompt: string;
    audioPhases?: AudioPhase[];
    voiceIdOverride?: string;
    mixLevel?: string;
    mixSettings?: {
        voice: number;
        music: number;
        ambience: number;
    };
    voiceStyle?: string;
    musicFile?: string;
    backingCategory?: string;
    backingTitle?: string;
    backingCoverPrompt?: string;
    createdAt: string;
    // V5 Fields
    ambiencePrompt?: string;
    pacingMode?: 'continuous' | 'immersive' | 'breathwork';
    warmupDuration?: number;
    tags?: string[]; // V5
    layers?: {
        voice: boolean;
        music: boolean;
        ambience: boolean;
    };
    usageStats?: {
        claudeInput: number;
        claudeOutput: number;
        elevenLabsChars: number;
        dalleImages: number;
        stableAudioCount: number;
        veoVideoCount: number;
    };
    // V6 Phased Narration
    generationMode?: 'continuous' | 'phased';
    phases?: NarrationPhase[];
}

// V6: Phased Narration Support
export interface NarrationPhase {
    id: number;
    type: 'narration' | 'silence' | 'ambience_only' | 'breathing_guide';
    durationSeconds: number;
    content?: string;           // Script text (only for 'narration')
    breathPattern?: string;     // e.g., "4-7-8" for breathing_guide
    transitionNote?: string;    // Internal note for AI continuity
}

export interface AudioPhase {
    atPercent: number;
    soundId: string;
    intensity: number;
    narrativeReason: string;
}

export interface LoopAsset {
    id: string;
    title: string;
    description: string;
    category: string;
    audio_url: string;
}

// Multi-Phase Types
interface StoryDesign {
    title: string;
    narrativeArc: string;
    keyScenes: Array<{
        name: string;
        percent: number;
        mood: string;
        soundscape?: string;
    }>;
    signatureMotif: string;
    targetWordCount: number;
    perspective: 'second_person' | 'first_person' | 'observer';
    sensoryFocus: string;
}

interface ScriptResult {
    script: string;
    actualWordCount: number;
    pauseMarkersUsed: number;
}

interface AssetDesign {
    coverPrompt: string;
    musicPrompt: string;
    backingCategory?: string;
    backingTitle?: string;
    backingCoverPrompt?: string;
    ambiencePrompt?: string; // New V5 Auto-Ambience
}

interface AudioDirection {
    audioPhases: AudioPhase[];
}

// =====================================================
// Constants: Categories & WPM
// =====================================================

export const RECIPE_MATRIX: Record<string, { voice: boolean; backing: 'soundscape' | 'music' | 'frequency' }> = {
    sleep: { voice: true, backing: 'soundscape' },
    meditation: { voice: true, backing: 'frequency' },
    nature: { voice: true, backing: 'soundscape' },
    fantasy: { voice: true, backing: 'music' },
    kids: { voice: true, backing: 'music' },
    motivation: { voice: true, backing: 'music' },
    work_break: { voice: true, backing: 'music' },
    soundscape: { voice: false, backing: 'soundscape' },
    binaural: { voice: false, backing: 'frequency' },
    music_instrumental: { voice: false, backing: 'music' },
};

// Single Source of Truth for WPM
// Single Source of Truth for WPM
// ElevenLabs v3 speaks at approx 130-140 WPM naturally
export const CATEGORY_WPM: Record<string, number> = {
    sleep: 130,       // Previously 70
    meditation: 135,  // Previously 75
    nature: 140,      // Previously 80
    kids: 145,        // Previously 85
    fantasy: 145,     // Previously 90
    work_break: 155,  // Previously 100
    motivation: 165,  // Previously 110
};

export const getTargetWordCount = (category: string, durationMinutes: number): number => {
    return Math.round(durationMinutes * (CATEGORY_WPM[category] || 90));
};

const PURE_AUDIO_CATEGORIES = ['soundscape', 'binaural', 'music_instrumental'];

// =====================================================
// Stock Loop Caching
// =====================================================

let cachedLoops: LoopAsset[] | null = null;

async function fetchStockLoops(): Promise<LoopAsset[]> {
    if (cachedLoops) return cachedLoops;

    const { data, error } = await supabase
        .from('stories')
        .select('id, title, description, category, audio_url')
        .eq('is_loop', true)
        .not('audio_url', 'is', null);

    if (error) {
        console.error('Failed to fetch stock loops:', error);
        return [];
    }

    cachedLoops = data || [];
    return cachedLoops;
}

function formatLoopsForPrompt(loops: LoopAsset[]): string {
    if (loops.length === 0) return 'No stock loops available.';

    const grouped: Record<string, LoopAsset[]> = {};
    for (const loop of loops) {
        const cat = loop.category || 'uncategorized';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(loop);
    }

    let output = '**AVAILABLE STOCK LOOPS (from Harvest Engine):**\n';
    for (const [category, items] of Object.entries(grouped)) {
        output += `\n### ${category.toUpperCase()}\n`;
        for (const item of items) {
            output += `- ID: ${item.id} | "${item.title}" - ${item.description || 'No description'}\n`;
        }
    }
    return output;
}

// =====================================================
// Claude API Helper
// =====================================================

export interface ClaudeResponse {
    text: string;
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
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
            model: 'claude-opus-4-5-20251101', // UPDATED TO 4.5 (2026)
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();
    const usage = {
        input_tokens: data.usage?.input_tokens || 0,
        output_tokens: data.usage?.output_tokens || 0
    };

    console.log(`   ✅ Model: ${data.model} | 📊 Tokens: ${usage.input_tokens} in / ${usage.output_tokens} out`);

    return {
        text: data.content[0].text,
        usage
    };
}

// =====================================================
// Global Guard (Shared Rules)
// =====================================================

const GLOBAL_GUARD = `
**GLOBAL CONSTRAINTS FOR SOFTALE FACTORY:**

**HARVEST ENGINE RULES:**
- If you find a suitable loop in the AVAILABLE STOCK LOOPS, set musicPrompt to "ID: [uuid]"
- If no suitable loop exists, set musicPrompt to "NEW: [Your detailed prompt for Stable Audio]"
- For NEW prompts: be specific about tempo, instruments, mood, and style

**PAUSE & EXPRESSION MARKERS (USE LIBERALLY):**
- [pause] = 1.5 second pause
- [breathe in] / [breathe out] = breath cues (ElevenLabs v3 renders these realistically)
- [whisper] = for intimate, secret, or very quiet moments
- [softly] = for gentle, soothing delivery
- [sigh] = for release of tension or transition
- Use 6-15 markers per story depending on length

**ANTI-CLICHÉ RULES:**
- NEVER use: "let go of tension", "release what no longer serves", "allow yourself"
- NEVER use: "take a moment", "simply breathe", "journey inward"
- PREFER: specific sensations, concrete imagery, functional descriptions

**WORD COUNT IS CRITICAL:**
- You must hit the target word count within 10% tolerance
- Undershoot is worse than overshoot for relaxation content
`;

// =====================================================
// Category-Specific Prompts
// =====================================================

const CATEGORY_PROMPTS: Record<string, string> = {
    sleep: GLOBAL_GUARD + `
You are a SLEEP STORY narrator for 'Softale', a premium audio platform.

**STRUCTURE**:
1. **Arrival (15%)**: Set the scene with sensory details
2. **Journey (50%)**: Slow, meandering narrative
3. **Settling (25%)**: Find a place of rest
4. **Fade (10%)**: Gentle dissolution into sleep

**RULES**:
- Ultra-slow pacing (70 WPM)
- Heavy use of [pause] markers
- Repetitive, hypnotic sentence structures
- NO sudden events or tension

**TONE**: Warm, embracing, like a favorite blanket`,

    meditation: GLOBAL_GUARD + `
You are a MEDITATION GUIDE for 'Softale', a premium audio platform.

**STRUCTURE**:
1. **Grounding (15%)**: Physical awareness
2. **Breath Focus (25%)**: Attention to breathing
3. **Visualization/Presence (40%)**: Imagery or pure awareness
4. **Integration (20%)**: Return to present

**RULES**:
- Simple, direct language
- Varied breath cues: "[breathe in]... [breathe out]..."
- Present-focused, not narrative-based
- Include 8-12 [pause] markers

**TONE**: Warm companion, steady and reassuring`,

    fantasy: GLOBAL_GUARD + `
You are a FANTASY NARRATOR for 'Softale', a premium audio platform.

**STRUCTURE**:
1. **Portal (10%)**: Transition from reality
2. **Discovery (60%)**: Explore environment
3. **Rest (20%)**: Find comfort
4. **Embrace (10%)**: Soft conclusion

**RULES**:
- Create ORIGINAL imagery (no elves, dragons)
- NO danger, conflict, or antagonists
- Poetic but accessible vocabulary
- Include 5-7 [pause] markers

**TONE**: Wonder-struck storyteller`,

    nature: GLOBAL_GUARD + `
You are a NATURE SOUNDSCAPE NARRATOR for 'Softale'.

**STRUCTURE**:
1. **Arrival (15%)**: Where, when, weather
2. **Observation (55%)**: Pan through environment
3. **Stillness (20%)**: Simply be present
4. **Gratitude (10%)**: Gentle appreciation

**RULES**:
- Base on REAL locations
- Prioritize auditory descriptions
- Use specific species names
- Include 6-10 [pause] markers

**TONE**: David Attenborough meets mindfulness`,

    kids: GLOBAL_GUARD + `
You are a MAGICAL STORYTELLER for 'Softale Kids'.

**STRUCTURE**:
1. **Hello (10%)**: Warm welcome
2. **Journey (50%)**: Clear plot, friendly characters
3. **Lesson (20%)**: Gentle emotional learning
4. **Goodnight (20%)**: Soft goodbye

**RULES**:
- Simple vocabulary (Age 4-8)
- Characters must be benevolent
- NO scary elements

**TONE**: Playful, warm`,

    work_break: GLOBAL_GUARD + `
You are a MICRO-RESET GUIDE for 'Softale'.

**STRUCTURE**:
1. **The Stop (10%)**: Halt momentum
2. **The Shift (40%)**: Physical or mental pivot
3. **The Center (30%)**: Find the quiet core
4. **The Return (20%)**: Re-enter with clarity

**RULES**:
- Brief, efficient sentences
- Respect the user's time

**TONE**: Professional but warm`,

    motivation: GLOBAL_GUARD + `
You are a MOTIVATIONAL MENTOR for 'Softale'.

**STRUCTURE**:
1. **Validation (15%)**: Acknowledge the struggle
2. **Reframing (35%)**: Shift the view
3. **Strengthening (35%)**: Build internal resource
4. **Action (15%)**: Gentle push forward

**RULES**:
- Strong, declarative verbs
- Avoid toxic positivity

**TONE**: Strong, grounded, unwavering belief`,

    soundscape: `
You are an AUDIO TEXTURE DESIGNER for 'Softale'.
This is PURE AUDIO - NO script needed.
Design seamless, loopable ambient audio.

Return JSON with empty script field.`,

    binaural: `
You are a FREQUENCY ENGINEER for 'Softale'.
This is PURE AUDIO - NO script needed.
Design binaural beats with ambient backing.

Return JSON with empty script field.`,

    music_instrumental: `
You are an AUDIO COMPOSER for 'Softale'.
This is PURE AUDIO - NO script needed.
Design instrumental music.

Return JSON with empty script field.`
};

// =====================================================
// Phase 1: Story Design
// =====================================================

async function generatePhase1_StoryDesign(brief: StoryBrief): Promise<{ design: StoryDesign, usage: any }> {
    console.log('📝 Phase 1: Generating Story Design...');

    const targetWords = getTargetWordCount(brief.category, brief.duration);

    const systemPrompt = `You are a story architect for Softale, a premium relaxation audio platform.
Design a high-level story structure. Be creative but stay within the category's purpose.`;

    const userPrompt = `Design a ${brief.duration}-minute ${brief.category} story.
${brief.title ? `Title Idea: "${brief.title}"` : ''}
${brief.description ? `Premise/Context: ${brief.description}` : ''}
${brief.theme ? `Theme: ${brief.theme}` : ''}
Target word count: ${targetWords} words

Return JSON only:
{
    "title": "2-5 word title",
    "narrativeArc": "e.g., arrival→exploration→settling→fade",
    "keyScenes": [
        { "name": "Scene name", "percent": 0-100, "mood": "calm/wonder/etc", "soundscape": "optional audio hint" }
    ],
    "signatureMotif": "a recurring sensory element",
    "targetWordCount": ${targetWords},
    "perspective": "second_person" | "first_person" | "observer",
    "sensoryFocus": "primary sense to emphasize"
}`;

    const response = await callClaude(systemPrompt, userPrompt, 1000);
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse Phase 1 response');

    return { design: JSON.parse(jsonMatch[0]), usage: response.usage };
}

// =====================================================
// Phase 2: Script Generation
// =====================================================

async function generatePhase2_Script(design: StoryDesign, category: string): Promise<ScriptResult & { usage: any }> {
    console.log('📜 Phase 2: Generating Script...');

    const categoryPrompt = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS['fantasy'];

    const systemPrompt = categoryPrompt + `

**STORY DESIGN TO FOLLOW:**
Title: ${design.title}
Arc: ${design.narrativeArc}
Key Scenes: ${JSON.stringify(design.keyScenes)}
Signature Motif: ${design.signatureMotif}
Perspective: ${design.perspective}
Sensory Focus: ${design.sensoryFocus}

**CRITICAL**: Write EXACTLY ${design.targetWordCount} words (±10%).`;

    const userPrompt = `Write the complete narration script now.
Target: ${design.targetWordCount} words.

Return JSON only:
{
    "script": "The full narration text with [pause] markers",
    "actualWordCount": number,
    "pauseMarkersUsed": number
}`;

    const response = await callClaude(systemPrompt, userPrompt, 8000);
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse Phase 2 response');

    const result = JSON.parse(jsonMatch[0]);

    // Validate word count
    const actualWords = result.script.split(/\s+/).length;
    result.actualWordCount = actualWords;

    console.log(`   📊 Word count: ${actualWords} / ${design.targetWordCount} target`);

    return { ...result, usage: response.usage };
}

// =====================================================
// Phase 2.5: Script Expansion (if needed)
// =====================================================

async function expandScript(scriptResult: ScriptResult, targetWords: number, category: string): Promise<ScriptResult & { usage: any }> {
    console.log('📜 Phase 2.5: Expanding Script...');

    const shortfall = targetWords - scriptResult.actualWordCount;
    const categoryPrompt = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS['fantasy'];

    const systemPrompt = categoryPrompt + `

**CURRENT SCRIPT IS TOO SHORT.**
Current word count: ${scriptResult.actualWordCount}
Target word count: ${targetWords}
Shortfall: ${shortfall} words

You MUST expand the script significantly. Add more sensory details, slow down pacing, add more [pause] markers.`;

    const userPrompt = `Here is the current script that needs expansion:

${scriptResult.script}

EXPAND this script to reach ${targetWords} words. Maintain the same narrative arc but add more depth, description, and breathing room.

Return JSON only:
{
    "script": "The expanded full narration text",
    "actualWordCount": number,
    "pauseMarkersUsed": number
}`;

    const response = await callClaude(systemPrompt, userPrompt, 10000);
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse expansion response');

    const result = JSON.parse(jsonMatch[0]);
    const actualWords = result.script.split(/\s+/).length;
    result.actualWordCount = actualWords;

    console.log(`   📊 Expanded word count: ${actualWords} / ${targetWords} target`);

    return { ...result, usage: response.usage };
}

// =====================================================
// Phase 3: Asset Design
// =====================================================

async function generatePhase3_Assets(design: StoryDesign, stockLoops: LoopAsset[], category: string): Promise<{ design: AssetDesign, usage: any }> {
    console.log('🎨 Phase 3: Generating Asset Design...');

    const isPureAudio = PURE_AUDIO_CATEGORIES.includes(category);
    // For Pure Audio, we MUST NOT reuse existing loops (to avoid rebranding old products).
    // So we pass an empty list to Claude, forcing it to generate NEW prompts.
    const loopsToExpose = isPureAudio ? [] : stockLoops;

    const loopsPrompt = formatLoopsForPrompt(loopsToExpose);
    const recipe = RECIPE_MATRIX[category] || RECIPE_MATRIX['fantasy'];

    const systemPrompt = `You are an asset designer for Softale audio experiences.
Design the visual and audio assets to complement this story.

${loopsPrompt}

**BACKING TYPE NEEDED**: ${recipe.backing}`;

    const userPrompt = `Design assets for: "${design.title}"
Story arc: ${design.narrativeArc}
Key scenes: ${JSON.stringify(design.keyScenes)}
Signature motif: ${design.signatureMotif}

Return JSON only:
{
    "coverPrompt": "Detailed DALL-E prompt for cover art (dreamy, professional)",
    "musicPrompt": "ID: [uuid]" if reusing stock OR "NEW: [Stable Audio prompt]",
    "backingCategory": "soundscape|binaural|music_instrumental" (only if NEW),
    "backingTitle": "Descriptive name for the asset" (only if NEW),
    "backingCoverPrompt": "DALL-E prompt for the backing audio artwork" (only if NEW),
    "ambiencePrompt": "Detailed prompt for Stable Audio background ambience (e.g. 'Nature sounds, rain on tent')"
}`;

    const response = await callClaude(systemPrompt, userPrompt, 1000);
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse Phase 3 response');

    return { design: JSON.parse(jsonMatch[0]), usage: response.usage };
}

// =====================================================
// Phase 4: Audio Direction (REMOVED for optimization)
// ===================================================== 


// =====================================================
// Main Script Generation (Multi-Phase Orchestrator)
// =====================================================

export async function generateScript(brief: StoryBrief, conceptOverride?: StoryConcept): Promise<GeneratedScript> {
    console.log('\n🏭 AUDIO FACTORY V4.0 - Multi-Phase Generation');
    console.log(`   Category: ${brief.category}`);
    console.log(`   Duration: ${brief.duration} minutes`);

    const isPureAudio = PURE_AUDIO_CATEGORIES.includes(brief.category);
    const stockLoops = await fetchStockLoops();

    // Phase 1: Story Design (OR Concept Injection)
    let storyDesign: StoryDesign;

    if (conceptOverride) {
        console.log('   🧠 Injecting Concept Engine Data...');
        // Map Concept to Design (SAFE ACCESS)
        const arcString = conceptOverride.narrativeArc
            ? Object.values(conceptOverride.narrativeArc).filter(Boolean).join(' -> ')
            : 'Beginning -> Middle -> End';

        const sound1 = conceptOverride.audioIdentity?.keySoundEffects?.[0] || 'Ambient Texture';
        const sound2 = conceptOverride.audioIdentity?.keySoundEffects?.[1] || 'Soft Drone';

        storyDesign = {
            title: conceptOverride.title,
            narrativeArc: arcString,
            keyScenes: [
                { name: "Opening", percent: 0, mood: conceptOverride.mood || 'Calm', soundscape: sound1 },
                { name: "Climax", percent: 70, mood: "Peak", soundscape: sound2 }
            ],
            signatureMotif: sound1,
            targetWordCount: getTargetWordCount(brief.category, brief.duration),
            perspective: 'second_person',
            sensoryFocus: conceptOverride.setting?.sensoryDetails?.[0] || 'visual'
        };
        // Augment brief with concept data for later phases
        brief.theme = conceptOverride.theme;
        brief.mood = conceptOverride.mood;
        brief.voiceStyle = conceptOverride.audioIdentity?.voiceStyle;
    } else {
        const p1 = await generatePhase1_StoryDesign(brief);
        storyDesign = p1.design;
        console.log(`   ✅ Phase 1 complete: "${storyDesign.title}"`);
    }

    let script = '';
    let actualWordCount = 0;
    let pauseMarkersUsed = 0;

    // Track cumulative usage
    let tokenUsage = { input_tokens: 0, output_tokens: 0 };

    // Phase 2: Script Generation (skip for pure audio)
    if (!isPureAudio) {
        let scriptResult = await generatePhase2_Script(storyDesign, brief.category);

        // Track P2 Usage
        if (scriptResult.usage) {
            tokenUsage.input_tokens += scriptResult.usage.input_tokens;
            tokenUsage.output_tokens += scriptResult.usage.output_tokens;
        }

        // Validation loop: expand if too short
        let attempts = 0;
        while (scriptResult.actualWordCount < storyDesign.targetWordCount * 0.85 && attempts < 2) {
            console.log(`   ⚠️ Script too short, expanding (attempt ${attempts + 1}/2)...`);
            const expansion = await expandScript(scriptResult, storyDesign.targetWordCount, brief.category);
            // Track Expansion Usage
            if (expansion.usage) {
                tokenUsage.input_tokens += expansion.usage.input_tokens;
                tokenUsage.output_tokens += expansion.usage.output_tokens;
            }
            scriptResult = expansion;
            attempts++;
        }

        script = scriptResult.script;
        actualWordCount = scriptResult.actualWordCount;
        pauseMarkersUsed = scriptResult.pauseMarkersUsed;
        console.log(`   ✅ Phase 2 complete: ${actualWordCount} words`);
    } else {
        console.log(`   ⏭️ Phase 2 skipped (pure audio category)`);
    }

    // Phase 3: Asset Design
    const p3 = await generatePhase3_Assets(storyDesign, stockLoops, brief.category);
    const assetDesign = p3.design;

    // Track P3 Usage
    if (p3.usage) {
        tokenUsage.input_tokens += p3.usage.input_tokens;
        tokenUsage.output_tokens += p3.usage.output_tokens;
    }

    console.log(`   ✅ Phase 3 complete: Assets designed`);

    // Voice selection
    const voiceId = brief.voiceId; // REMOVED HARDCODED MAP to allow dynamic lookup in generateVoice


    // Assemble final GeneratedScript
    return {
        title: storyDesign.title,
        category: brief.category,
        duration: brief.duration,
        script: script,
        musicCues: [],
        ambientCues: [],
        signatureMotif: storyDesign.signatureMotif,
        coverPrompt: assetDesign.coverPrompt,
        musicPrompt: assetDesign.musicPrompt,
        // audioPhases: [], // REMOVED (Optimized out)
        voiceIdOverride: voiceId,
        musicFile: brief.musicFile,
        backingCategory: assetDesign.backingCategory,
        backingTitle: assetDesign.backingTitle,
        backingCoverPrompt: assetDesign.backingCoverPrompt,
        createdAt: new Date().toISOString(),
        // V5 Fields
        ambiencePrompt: conceptOverride?.audioIdentity?.ambienceLayer || assetDesign.ambiencePrompt,
        pacingMode: conceptOverride?.pacingMode,
        warmupDuration: conceptOverride?.warmupDuration,
        tags: conceptOverride?.tags,
    };
}

// =====================================================
// V6: Phased Script Generation (Cost-Optimized)
// =====================================================

const PHASED_CATEGORIES = ['meditation', 'sleep', 'breathwork'];

interface PhaseTemplate {
    type: NarrationPhase['type'];
    durationPercent: number;
    description: string;
}

const PHASE_TEMPLATES: Record<string, PhaseTemplate[]> = {
    meditation: [
        { type: 'narration', durationPercent: 15, description: 'Opening grounding' },
        { type: 'silence', durationPercent: 10, description: 'Settle into presence' },
        { type: 'narration', durationPercent: 20, description: 'Breath awareness guidance' },
        { type: 'breathing_guide', durationPercent: 15, description: 'Guided breathing' },
        { type: 'narration', durationPercent: 15, description: 'Visualization or body scan' },
        { type: 'ambience_only', durationPercent: 15, description: 'Deep integration' },
        { type: 'narration', durationPercent: 10, description: 'Gentle return' },
    ],
    sleep: [
        { type: 'narration', durationPercent: 20, description: 'Scene setting and arrival' },
        { type: 'narration', durationPercent: 25, description: 'Gentle exploration' },
        { type: 'ambience_only', durationPercent: 10, description: 'Peaceful pause' },
        { type: 'narration', durationPercent: 20, description: 'Finding rest' },
        { type: 'ambience_only', durationPercent: 15, description: 'Drift into sleep' },
        { type: 'narration', durationPercent: 10, description: 'Soft dissolution' },
    ],
    breathwork: [
        { type: 'narration', durationPercent: 10, description: 'Introduction' },
        { type: 'breathing_guide', durationPercent: 25, description: 'First breathing cycle' },
        { type: 'silence', durationPercent: 10, description: 'Integration' },
        { type: 'breathing_guide', durationPercent: 25, description: 'Second breathing cycle' },
        { type: 'silence', durationPercent: 10, description: 'Deep rest' },
        { type: 'narration', durationPercent: 10, description: 'Closing' },
        { type: 'ambience_only', durationPercent: 10, description: 'Final integration' },
    ],
};

export async function generatePhasedScript(brief: StoryBrief, conceptOverride?: StoryConcept): Promise<GeneratedScript> {
    console.log('\n🏭 AUDIO FACTORY V6 - PHASED NARRATION MODE');
    console.log(`   Category: ${brief.category}`);
    console.log(`   Duration: ${brief.duration} minutes`);

    const totalSeconds = brief.duration * 60;
    const template = PHASE_TEMPLATES[brief.category] || PHASE_TEMPLATES['sleep'];

    // Build phase structure from template
    const phases: NarrationPhase[] = template.map((t, idx) => ({
        id: idx + 1,
        type: t.type,
        durationSeconds: Math.round(totalSeconds * (t.durationPercent / 100)),
        transitionNote: t.description,
    }));

    console.log(`   📊 Phase structure: ${phases.length} phases`);
    phases.forEach(p => console.log(`      Phase ${p.id}: ${p.type} (${p.durationSeconds}s) - ${p.transitionNote}`));

    // Generate content ONLY for narration phases
    const narrationPhases = phases.filter(p => p.type === 'narration');
    console.log(`   🎙️ Generating content for ${narrationPhases.length} narration phases...`);

    for (const phase of narrationPhases) {
        const targetWords = Math.round((phase.durationSeconds / 60) * (CATEGORY_WPM[brief.category] || 130));

        const phasePrompt = CATEGORY_PROMPTS[brief.category] || CATEGORY_PROMPTS['meditation'];
        const systemPrompt = phasePrompt + `

**PHASE CONTEXT:**
This is Phase ${phase.id} of a ${phases.length}-phase ${brief.category} experience.
Phase purpose: ${phase.transitionNote}
Duration: ${phase.durationSeconds} seconds
Target words: ${targetWords} words
${brief.description ? `\n**STORY CONTEXT/IDEA**:\n${brief.description}\nIncorporate this thematic idea into the narration.\n` : ''}
**CRITICAL**: Write EXACTLY ${targetWords} words for this phase only.
Do NOT include opening/closing if this is a middle phase.
Maintain continuity with previous phases.`;

        const userPrompt = `Write the narration for Phase ${phase.id}: "${phase.transitionNote}"
Target: ${targetWords} words.

Return JSON only:
{
    "content": "The narration text with [pause] markers",
    "wordCount": number
}`;

        const response = await callClaude(systemPrompt, userPrompt, 2000);
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            phase.content = result.content;
            console.log(`      ✅ Phase ${phase.id}: ${result.wordCount || 'N/A'} words`);
        }
    }

    // Set breathing patterns for breathing_guide phases
    const breathingPhases = phases.filter(p => p.type === 'breathing_guide');
    for (const phase of breathingPhases) {
        phase.breathPattern = brief.category === 'breathwork' ? '4-7-8' : '4-4-4-4';
    }

    // Build combined script for backward compatibility
    const combinedScript = phases
        .filter(p => p.type === 'narration')
        .map(p => p.content)
        .join('\n\n[pause]\n\n');

    // Fetch stock loops and generate assets
    const stockLoops = await fetchStockLoops();
    const storyDesign: StoryDesign = {
        title: brief.title || `${brief.category} Experience`,
        narrativeArc: phases.map(p => p.transitionNote).join(' → '),
        keyScenes: phases.filter(p => p.type === 'narration').map((p, i) => ({
            name: p.transitionNote || `Phase ${p.id}`,
            percent: Math.round((i / narrationPhases.length) * 100),
            mood: brief.mood || 'Calm',
        })),
        signatureMotif: 'Gentle transitions',
        targetWordCount: combinedScript.split(/\s+/).length,
        perspective: 'second_person',
        sensoryFocus: 'breath',
    };

    const p3 = await generatePhase3_Assets(storyDesign, stockLoops, brief.category);

    return {
        title: storyDesign.title,
        category: brief.category,
        duration: brief.duration,
        script: combinedScript,
        musicCues: [],
        ambientCues: [],
        signatureMotif: storyDesign.signatureMotif,
        coverPrompt: p3.design.coverPrompt,
        musicPrompt: p3.design.musicPrompt,
        voiceIdOverride: brief.voiceId,
        musicFile: brief.musicFile,
        backingCategory: p3.design.backingCategory,
        backingTitle: p3.design.backingTitle,
        backingCoverPrompt: p3.design.backingCoverPrompt,
        createdAt: new Date().toISOString(),
        ambiencePrompt: p3.design.ambiencePrompt,
        pacingMode: brief.pacingMode,
        warmupDuration: brief.warmupDuration,
        // V6 Phased fields
        generationMode: 'phased',
        phases: phases,
    };
}

// =====================================================
// Voice Generation (ElevenLabs v3)
// =====================================================

const PREMIUM_VOICES: Record<string, string> = {
    'Milo': 'GUDYcgRAONiI1nXDcNQQ',
    'Spuds': 'NOpBlnGInO9m6vDvFkFC',
    'Charlotte': 'XB0fDUnXU5powFXDhCwa',
    'Delilah': 'mZ3kbJNnKRWI4YzJXA9j',
    'Luna': 'kBxqBYnZjH7G9mDYPVU4',
    'Rachel': '21m00Tcm4TlvDq8ikWAM',
    'Aria': '9BWtsMINqrJLrRacOk9x',
};

export async function generateVoice(script: GeneratedScript): Promise<{ path: string, characterCount: number }> {
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenLabsKey) {
        console.log('⚠️ ELEVENLABS_API_KEY not set - skipping voice generation');
        return { path: '', characterCount: 0 };
    }

    console.log('🎙️ Generating voice with ElevenLabs v3...');

    if (!script.script || script.script.trim().length === 0) {
        console.log('   ⏭️ Empty script (pure audio mode). Skipping voice.');
        return { path: '', characterCount: 0 };
    }

    let voiceId = script.voiceIdOverride;

    if (!voiceId) {
        // Map 'soft_female' or 'neutral' -> female, 'soft_male' -> male
        let targetGender: 'male' | 'female' = 'female';

        if (script.voiceStyle && script.voiceStyle.includes('male')) {
            targetGender = 'male';
        }

        console.log(`   🔍 Looking for ${targetGender} voice (Style: ${script.voiceStyle || 'default'})...`);

        // Use VoiceService to pick from available account voices
        const voice = await voiceService.pickVoice({ gender: targetGender });

        // Fallbacks: Spuds (Male) or Delilah (Female) if auto-pick fails
        const fallbackId = targetGender === 'male' ? 'NOpBlnGInO9m6vDvFkFC' : 'mZ3kbJNnKRWI4YzJXA9j';

        voiceId = voice?.voice_id || fallbackId;
        console.log(`   🗣️ Selected Voice: ${voice?.name || 'Fallback'} (${voiceId})`);
    }
    const outputPath = path.join(OUTPUT_DIR, `${script.title.replace(/\s+/g, '_')}_voice.mp3`);

    // Helper: Clean text for pure narration
    // 1. Remove [breathe] markers if requested or if they cause noise (User feedback: "Clean narration")
    // 2. Remove any (parentheticals) or *asterisks* acting as stage directions
    const cleanScript = script.script
        .replace(/\[breathe.*?\]/gi, " ... ") // Replace breaths with simple pauses
        .replace(/\[.*?\]/g, (match) => match.toLowerCase().includes('pause') ? " ... " : "") // Keep pause as ellipsis, remove others
        .replace(/\(.*?\)/g, "") // Remove (notes)
        .replace(/\*.*?\*/g, "") // Remove *actions*
        .replace(/\s+/g, " ")
        .trim();

    // Helper: Split text into chunks < 4000 chars
    const chunks: string[] = [];
    const maxChunkSize = 4000;

    // Initial text with silent leader
    const fullText = "... " + cleanScript;

    if (fullText.length <= maxChunkSize) {
        chunks.push(fullText);
    } else {
        console.log(`   ✂️ Script length (${fullText.length}) exceeds limits. Splitting...`);
        // Split by paragraphs first
        const paragraphs = fullText.split(/(?:\r\n|\r|\n)/);
        let currentChunk = '';

        for (const p of paragraphs) {
            if ((currentChunk.length + p.length) < maxChunkSize) {
                currentChunk += (currentChunk ? '\n\n' : '') + p;
            } else {
                if (currentChunk) chunks.push(currentChunk);
                currentChunk = p;
            }
        }
        if (currentChunk) chunks.push(currentChunk);
        console.log(`   🔢 Split into ${chunks.length} chunks.`);
    }

    const audioBuffers: Buffer[] = [];

    // Process Chunks Sequentially
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`      🔊 Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)...`);

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': elevenLabsKey,
            },
            body: JSON.stringify({
                text: chunk,
                model_id: 'eleven_turbo_v2_5', // Fallback to Turbo 2.5 for stability/speed if V3 is hallucinating
                voice_settings: {
                    stability: 0.65, // Higher stability = less emotion/noise
                    similarity_boost: 0.8, // High fidelity to voice
                    style: 0.1, // VERY LOW style to prevent "acting" out the environment (hallucinated background noise)
                    use_speaker_boost: true,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`ElevenLabs error (Chunk ${i}): ${error}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        audioBuffers.push(buffer);
    }

    // Concatenate all buffers
    const finalBuffer = Buffer.concat(audioBuffers);
    fs.writeFileSync(outputPath, finalBuffer);
    console.log(`   ✅ Voice saved: ${outputPath} (${(finalBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

    return { path: outputPath, characterCount: cleanScript.length };
}

// =====================================================
// V6: Phased Voice Generation
// =====================================================

interface PhasedVoiceResult {
    phasePaths: Map<number, string>; // phase.id -> audio path
    totalCharacters: number;
}

export async function generatePhasedVoice(script: GeneratedScript): Promise<PhasedVoiceResult> {
    console.log('🎙️ Generating phased voice (V6)...');

    if (!script.phases || script.generationMode !== 'phased') {
        throw new Error('generatePhasedVoice requires a phased script');
    }

    const narrationPhases = script.phases.filter(p => p.type === 'narration' && p.content);
    console.log(`   📊 ${narrationPhases.length} narration phases to generate`);

    // Get voice configuration (reuse existing logic)
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsKey) throw new Error('Missing ELEVENLABS_API_KEY');

    // Select voice - default to female for meditation/sleep
    let voiceId = script.voiceIdOverride;
    if (!voiceId) {
        // For meditation/sleep, default to female voice unless explicitly male
        const isSoftCategory = ['meditation', 'sleep', 'breathwork'].includes(script.category);
        const explicitlyMale = script.voiceStyle?.includes('male') && !script.voiceStyle?.includes('female');
        const targetGender = explicitlyMale ? 'male' : (isSoftCategory ? 'female' : (script.voiceStyle?.includes('female') ? 'female' : 'male'));
        console.log(`   🎯 Voice style: ${script.voiceStyle || 'undefined'} → Target: ${targetGender}`);
        const voice = await voiceService.pickVoice({ gender: targetGender });
        voiceId = voice?.voice_id || (targetGender === 'male' ? 'NOpBlnGInO9m6vDvFkFC' : 'mZ3kbJNnKRWI4YzJXA9j');
        console.log(`   🗣️ Selected Voice: ${voice?.name || 'Fallback'} (${voiceId})`);
    }

    const phasePaths = new Map<number, string>();
    let totalCharacters = 0;

    for (const phase of narrationPhases) {
        const cleanContent = phase.content!
            .replace(/\[breathe.*?\]/gi, " ... ")
            .replace(/\[.*?\]/g, (match) => match.toLowerCase().includes('pause') ? " ... " : "")
            .replace(/\(.*?\)/g, "")
            .replace(/\*.*?\*/g, "")
            .replace(/\s+/g, " ")
            .trim();

        if (!cleanContent) continue;

        const outputPath = path.join(
            OUTPUT_DIR,
            `${script.title.replace(/\s+/g, '_')}_voice_phase_${phase.id}.mp3`
        );

        console.log(`      Phase ${phase.id}: Generating ${cleanContent.length} chars...`);

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': elevenLabsKey,
            },
            body: JSON.stringify({
                text: cleanContent,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.65,
                    similarity_boost: 0.70,
                    use_speaker_boost: false,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`ElevenLabs error for phase ${phase.id}: ${response.statusText}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(outputPath, buffer);

        phasePaths.set(phase.id, outputPath);
        totalCharacters += cleanContent.length;

        console.log(`      ✅ Phase ${phase.id} saved: ${(buffer.length / 1024).toFixed(0)} KB`);
    }

    console.log(`   ✅ Phased voice complete: ${phasePaths.size} files, ${totalCharacters} total chars`);
    return { phasePaths, totalCharacters };
}

// =====================================================
// Music/Loop Generation (Harvest Engine)
// =====================================================

export async function generateOrFetchLoop(script: GeneratedScript): Promise<string> {
    // V5: Skip if disabled by layers
    if (script.layers && !script.layers.music) {
        console.log('   🚫 Skipping Music/Loop (Disabled in layers)');
        return '';
    }

    console.log('🎵 Processing music/loop...');

    const musicPrompt = script.musicPrompt || '';
    const isPureAudio = PURE_AUDIO_CATEGORIES.includes(script.category);

    // Check if reusing existing loop
    const idMatch = musicPrompt.match(/ID:\s*([a-f0-9-]+)/i);
    if (idMatch && !isPureAudio) {
        const loopId = idMatch[1];
        console.log(`   🔄 Reusing existing loop: ${loopId}`);

        const { data, error } = await supabase
            .from('stories')
            .select('audio_url')
            .eq('id', loopId)
            .single();

        if (data?.audio_url) {
            // Download the loop
            const outputPath = path.join(OUTPUT_DIR, `${script.title.replace(/\s+/g, '_')}_loop.mp3`);
            const loopResponse = await fetch(data.audio_url);
            const buffer = Buffer.from(await loopResponse.arrayBuffer());
            fs.writeFileSync(outputPath, buffer);
            console.log(`   ✅ Loop downloaded: ${outputPath}`);
            return outputPath;
        }
    }

    // Generate new loop with Stable Audio
    console.log('   🆕 Generating new loop with Stable Audio...');
    const newPrompt = musicPrompt.replace(/^NEW:\s*/i, '').trim() || `Ambient ${script.category} background music`;

    const stableAudioKey = process.env.STABILITY_API_KEY || process.env.STABLE_AUDIO_API_KEY;
    if (!stableAudioKey) {
        console.log('   ⚠️ STABILITY_API_KEY not set - skipping loop generation');
        return '';
    }

    // Call Stable Audio API (v2beta - Stable Audio 2.5)
    // Proven endpoint from src/music.ts
    const url = 'https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio';

    // Construct Multipart Form Data
    const formData = new FormData();
    formData.append('prompt', newPrompt);
    const loopDuration = Math.min((script.duration || 3) * 60, 180); // Cap at 180s (Stable Audio Limit)
    formData.append('duration', loopDuration.toString());
    formData.append('model', 'stable-audio-2.5');
    formData.append('negative_prompt', 'Drums, percussion, vocals, speech, noisy, distorted, low quality, glitch, rhythmic beats');

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${stableAudioKey}`,
            'Accept': 'audio/*',
            // Note: fetch automatically sets Content-Type to multipart/form-data with boundary when body is FormData
        },
        body: formData,
    });

    if (!response.ok) {
        console.log(`   ⚠️ Stable Audio failed: ${response.statusText}`);
        return '';
    }

    const outputPath = path.join(OUTPUT_DIR, `${script.title.replace(/\s+/g, '_')}_loop.mp3`);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);
    console.log(`   ✅ New loop generated: ${outputPath}`);

    // Harvest: Save to database for future reuse (SKIP FOR PURE AUDIO)
    // For pure audio (soundscape, binaural), the story ITSELF is the asset.
    // We don't want to create a duplicate "asset" entry.
    if (script.backingCategory && script.backingTitle && !isPureAudio) {
        console.log('   📦 Harvesting loop for future use...');
        try {
            // 1. Generate Full Asset Pack for the Loop
            let loopAssets: AssetPack = { cover_url: '', cover_landscape_url: '', cover_portrait_url: '' };

            if (script.backingCoverPrompt) {
                console.log('      🖼️ Generating backing artwork (All Formats)...');
                const loopBrief = {
                    ...script,
                    title: script.backingTitle,
                    coverPrompt: script.backingCoverPrompt
                } as GeneratedScript;

                loopAssets = await generateAssetPack(loopBrief).catch(e => {
                    console.log('      ⚠️ Backing cover failed:', e.message);
                    return { cover_url: '', cover_landscape_url: '', cover_portrait_url: '' };
                });
            }

            // 2. Upload as a standalone Story asset
            const loopAssetScript = {
                ...script,
                title: script.backingTitle,
                category: script.backingCategory,
                duration: 3, // Standard loop duration
                script: "Instrumental Loop generated by Softale Factory",
                // Ensure unique slug for the asset
                slug: script.backingTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-asset-' + Date.now().toString().slice(-4),
            } as GeneratedScript;

            const loopId = await uploadStory(loopAssetScript, outputPath, loopAssets);
            console.log(`   ✅ Harvested Loop Saved! ID: ${loopId}`);
            console.log(`   📝 To reuse: Add ID ${loopId} to your catalog or stock prompts.`);

        } catch (e: any) {
            console.log(`   ⚠️ Harvest failed: ${e.message}`);
        }
    }

    return outputPath;
}

// =====================================================
// Ambience Generation (V5 Layer)
// =====================================================

export async function generateOrFetchAmbience(script: GeneratedScript): Promise<string> {
    const prompt = script.ambiencePrompt;
    if (!prompt) return '';

    console.log(`🌧️ Processing ambience layer...`);
    console.log(`      Prompt: "${prompt}"`);

    // Reuse Logic (Simplified)
    const idMatch = prompt.match(/ID:\s*([a-f0-9-]+)/i);
    if (idMatch) {
        // ...implement reuse if needed, for now skip to generation
    }

    // Generate
    const stableAudioKey = process.env.STABILITY_API_KEY || process.env.STABLE_AUDIO_API_KEY;
    if (!stableAudioKey) return '';

    const url = 'https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio';
    const formData = new FormData();
    formData.append('prompt', prompt.replace(/^NEW:\s*/i, '').trim());
    formData.append('duration', '180');
    formData.append('model', 'stable-audio-2.5');
    // FIX: Add negative_prompt for safety and API consistency
    formData.append('negative_prompt', 'Music, melody, rhythm, drums, percussion, vocals, speech, glitch, low quality');

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${stableAudioKey}`,
                'Accept': 'audio/*'
            },
            body: formData,
        });

        if (!response.ok) {
            console.log(`   ⚠️ Ambience gen failed: ${response.status} ${response.statusText}`);
            const errText = await response.text();
            console.log(`      Details: ${errText.substring(0, 200)}`);
            return '';
        }

        const outputPath = path.join(OUTPUT_DIR, `${script.title.replace(/\s+/g, '_')}_ambience.mp3`);
        fs.writeFileSync(outputPath, Buffer.from(await response.arrayBuffer()));
        console.log(`   ✅ Ambience layer generated: ${outputPath}`);
        return outputPath;
    } catch (e: any) {
        console.error('Ambience error:', e.message);
        return '';
    }
}


// =====================================================
// Legacy Wrapper for Backwards Compatibility
// =====================================================

export async function generateCover(script: GeneratedScript): Promise<string> {
    // Use new generator but just return one
    const pack = await generateAssetPack(script);
    return pack.cover_url;
}


// =====================================================
// Asset Generation (GPT Image 1.5 / DALL-E 3)
// =====================================================

interface AssetPack {
    cover_url: string;           // Square (1:1)
    cover_landscape_url: string; // Wide (16:9)
    cover_portrait_url: string;  // Tall (9:16)
    backing_cover_url?: string;
    backing_cover_landscape_url?: string;
    backing_cover_portrait_url?: string;
}

export async function generateAssetPack(script: GeneratedScript): Promise<AssetPack & { imageCount: number }> {
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
        console.log('⚠️ OPENAI_API_KEY not set - skipping asset generation');
        return { cover_url: '', cover_landscape_url: '', cover_portrait_url: '', imageCount: 0 };
    }

    console.log('🖼️ Generating Asset Pack with GPT Image 1.5...');
    const basePrompt = script.coverPrompt || `Dreamy, ethereal artwork for "${script.title}" - ${script.category} audio experience`;

    // Helper to generate one variant
    const generateVariant = async (prompt: string, aspect: string, size: string, suffix: string): Promise<string> => {
        const safeTitle = script.title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        const outputPath = path.join(OUTPUT_DIR, `${safeTitle}_${suffix}.png`);

        if (fs.existsSync(outputPath)) {
            console.log(`      ⏩ Exists, skipping generation: ${outputPath}`);
            return outputPath;
        }

        console.log(`   🎨 Generating ${suffix} (${aspect})...`); // prompt: ${prompt.substring(0, 20)}...
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

            // Download
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

    // 2. Backing Track Assets (If explicit prompt exists)
    let backingAssets = {};
    if (script.backingCoverPrompt) {
        console.log('   🎹 Detected Backing Cover Prompt - Generating assets for Soundscape extraction...');
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
        imageCount: 3 + (script.backingCoverPrompt ? 3 : 0) // Track actual generations
    };
}


// =====================================================
// Audio Mixing Engine (V5)
// =====================================================

export async function mixAudio(voicePath: string, loopPath: string, script: GeneratedScript, ambiencePath?: string): Promise<string> {
    console.log('🎛️ Mixing Audio Layers (Smart V5)...');

    const outputFilename = `mixed_${Date.now()}.mp3`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    /* 
       V5 Dynamic Mixing Logic:
       - Inputs can be: [Voice, Loop, Ambience] OR [Loop, Ambience] OR [Voice, Loop] etc.
       - "Warmup" logic uses adelay on Voice.
       - Smart Pacing (Intro/Outro) should handle volume automation.
    */

    // Check for ffmpeg (Static)
    const ffmpegCmd = ffmpegPath;
    if (!ffmpegCmd) {
        console.warn('⚠️ FFmpeg static binary not found. Skipping mix.');
        return voicePath;
    }

    // const { exec } = require('child_process');
    // const util = require('util');
    // const execPromise = util.promisify(exec);
    // Use global execPromise imported/defined at top

    const inputs: string[] = [];
    let filterComplex = '';
    let inputStreamCount = 0;

    // 1. Voice Layer (Input 0 if present)
    const hasVoice = voicePath && fs.existsSync(voicePath);
    if (hasVoice) {
        inputs.push('-i', voicePath);
        inputStreamCount++;
    }

    // 2. Music Layer (Input 0/1)
    const hasLoop = loopPath && fs.existsSync(loopPath);
    if (hasLoop) {
        // Note: standard ffmpeg usage calls for -stream_loop BEFORE -i if looping is needed.
        // But our `generateOrFetchLoop` often returns a pre-looped file or long file.
        // If not, we should loop it. Let's assume pre-looped for now or use -stream_loop -1
        inputs.push('-stream_loop', '-1', '-i', loopPath);
        inputStreamCount++;
    }

    // 3. Ambience Layer (Input 1/2)
    const hasAmbience = ambiencePath && fs.existsSync(ambiencePath);
    if (hasAmbience) {
        inputs.push('-stream_loop', '-1', '-i', ambiencePath);
        inputStreamCount++;
    }

    if (inputStreamCount === 0) {
        throw new Error("No audio inputs available for mixing!");
    }

    const duration = script.duration * 60; // seconds
    const fadeOutDuration = 10;
    const warmupMs = (script.warmupDuration || 0) * 1000;

    const voiceDelay = warmupMs;

    // Build Filtergraph
    // Goals:
    // - Voice: Delay by warmupMs, limit duration
    // - Music: Loop (if needed), Trim to duration, Fade Out
    // - Ambience: Loop (if needed), Trim to duration, Lower volume, Fade Out
    // - Mix: Amix inputs

    const filters: string[] = [];
    let mixInputs = 0;

    // --- Voice Processing ---
    // Mix Profiles
    let voiceVol = 3.2;
    let musicVol = 0.12;
    let ambVol = 0.12;

    if (script.mixSettings) {
        console.log(`   🎚️  Using Custom Mix Settings: Voice=${script.mixSettings.voice}, Music=${script.mixSettings.music}, Amb=${script.mixSettings.ambience}`);
        voiceVol = script.mixSettings.voice;
        musicVol = script.mixSettings.music;
        ambVol = script.mixSettings.ambience;
    } else {
        const mixLevel = script.mixLevel || 'balanced';
        switch (mixLevel) {
            case 'voice_focus':
                voiceVol = 3.5;
                musicVol = 0.05;
                ambVol = 0.1;
                break;
            case 'high_immersion':
                voiceVol = 2.5;
                musicVol = 0.25;
                ambVol = 0.25;
                break;
            case 'background_only':
                voiceVol = 0;
                musicVol = 1.0;
                ambVol = 1.0;
                break;
            case 'balanced':
            default:
                voiceVol = 3.2;
                musicVol = 0.12;
                ambVol = 0.12;
                break;
        }
        console.log(`   🎚️  Using Mix Profile: ${mixLevel} (Voice:${voiceVol}, Music:${musicVol}, Amb:${ambVol})`);
    }

    const effectiveMixLevel = script.mixSettings ? (script.mixSettings.voice === 0 ? 'background_only' : 'custom') : (script.mixLevel || 'balanced');
    const actualHasVoice = hasVoice && effectiveMixLevel !== 'background_only';

    if (actualHasVoice) {
        // [0:a] -> adelay -> volume -> [voice_proc]
        filters.push(`[0:a]adelay=${voiceDelay}|${voiceDelay},volume=${voiceVol}[voice_proc]`);
        mixInputs++;
    }

    // --- Music Processing ---
    const musicIdx = hasVoice ? 1 : 0;
    if (hasLoop) {
        filters.push(`[${musicIdx}:a]volume=${musicVol},afade=t=out:st=${duration - fadeOutDuration}:d=${fadeOutDuration}[music_proc]`);
        mixInputs++;
    }

    // --- Ambience Processing ---
    const ambIdx = (hasVoice ? 1 : 0) + (hasLoop ? 1 : 0);
    if (hasAmbience) {
        filters.push(`[${ambIdx}:a]volume=${ambVol},afade=t=out:st=${duration - fadeOutDuration}:d=${fadeOutDuration}[amb_proc]`);
        mixInputs++;
    }

    // --- Mixing ---
    let cmd = `"${ffmpegCmd}" -y `;
    cmd += inputs.join(' ') + ' ';

    if (mixInputs > 1) {
        // Inputs to amix:
        let amixInputs = '';
        if (actualHasVoice) amixInputs += '[voice_proc]';
        if (hasLoop) amixInputs += '[music_proc]';
        if (hasAmbience) amixInputs += '[amb_proc]';

        const filterComplex = `${filters.join(';')};${amixInputs}amix=inputs=${mixInputs}:duration=longest[out]`;
        cmd += `-filter_complex "${filterComplex}" -map "[out]" `;
    } else if (mixInputs === 1) {
        // Single input processing... logic below
        // But wait, if mixInputs is 1, identifiers might vary. 
        // If only music: [music_proc] needs to be mapped to out?
        // The original code handled mixInputs=1 separately via simple afade. 
        // BUT here I pushed named filters like [music_proc].
        // I need to ensure map matches.

        let singleInputLabel = '';
        if (actualHasVoice) singleInputLabel = '[voice_proc]';
        else if (hasLoop) singleInputLabel = '[music_proc]';
        else if (hasAmbience) singleInputLabel = '[amb_proc]';

        // Construct simple chain that terminates in [out]
        // Actually, the previous 'mixInputs === 1' block reused `cmd += -filter_complex`.
        // Let's standardise on using the named filters I just instituted.

        const filterComplex = `${filters.join(';')};${singleInputLabel}anull[out]`;
        cmd += `-filter_complex "${filterComplex}" -map "[out]" `;
    }

    // Duration Limit
    cmd += `-t ${duration + 2} `;
    cmd += `"${outputPath}"`;

    console.log('   ffmpeg cmd:', cmd);

    try {
        const { stdout, stderr } = await execPromise(cmd);
        // Validation
        if (fs.existsSync(outputPath)) {
            const stats = fs.statSync(outputPath);
            console.log(`   ✅ Mixed Audio Created: ${outputFilename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
            return outputPath;
        } else {
            throw new Error('Mixing failed, output not found');
        }
    } catch (e: any) {
        console.error(`   ❌ Mixing Error: ${e.message}`);
        // Fallback: return voice if available, else loop
        return voicePath || loopPath;
    }
}

// =====================================================
// V6: Phased Audio Mixing
// =====================================================

export async function mixPhasedAudio(
    script: GeneratedScript,
    voicePaths: Map<number, string>,
    ambiencePath: string
): Promise<string> {
    console.log('🎛️ Mixing Phased Audio (V6)...');

    if (!script.phases || script.generationMode !== 'phased') {
        throw new Error('mixPhasedAudio requires a phased script');
    }

    const ffmpegCmd = ffmpegPath;
    if (!ffmpegCmd) {
        throw new Error('FFmpeg not found');
    }

    // Calculate total duration and voice positions
    const totalDuration = script.phases.reduce((sum, p) => sum + p.durationSeconds, 0);
    const voiceOverlays: Array<{ path: string, startTime: number, duration: number }> = [];

    let currentTime = 0;
    for (const phase of script.phases) {
        if (phase.type === 'narration' && voicePaths.has(phase.id)) {
            voiceOverlays.push({
                path: voicePaths.get(phase.id)!,
                startTime: currentTime,
                duration: phase.durationSeconds
            });
        }
        currentTime += phase.durationSeconds;
    }

    console.log(`   📊 Total duration: ${totalDuration}s, ${voiceOverlays.length} voice overlays`);
    voiceOverlays.forEach((v, i) => console.log(`      Voice ${i + 1}: starts at ${v.startTime}s`));

    const outputPath = path.join(OUTPUT_DIR, `mixed_phased_${Date.now()}.mp3`);

    // Build FFmpeg command with continuous ambience + voice overlays
    // Strategy: Loop ambience for full duration, then overlay each voice segment at its timestamp

    let inputArgs = `-stream_loop -1 -i "${ambiencePath}" `; // Input 0: Ambience (looped)
    let inputIndex = 1;
    const inputMap: Map<string, number> = new Map();

    // Add each unique voice file as input
    for (const overlay of voiceOverlays) {
        if (!inputMap.has(overlay.path)) {
            inputArgs += `-i "${overlay.path}" `;
            inputMap.set(overlay.path, inputIndex);
            inputIndex++;
        }
    }

    // Build filter complex
    let filterComplex = `[0:a]volume=0.20,afade=t=out:st=${totalDuration - 3}:d=3[ambience];`;

    if (voiceOverlays.length === 0) {
        // No voice, just ambience
        filterComplex += `[ambience]anull[out]`;
    } else {
        // Overlay voices on ambience
        let currentStream = 'ambience';

        for (let i = 0; i < voiceOverlays.length; i++) {
            const overlay = voiceOverlays[i];
            const voiceInputIdx = inputMap.get(overlay.path)!;
            const nextStream = i === voiceOverlays.length - 1 ? 'out' : `mix${i}`;

            // Delay voice to correct position, apply volume, then overlay
            const delayMs = overlay.startTime * 1000;
            filterComplex += `[${voiceInputIdx}:a]adelay=${delayMs}|${delayMs},volume=3.0[voice${i}];`;
            filterComplex += `[${currentStream}][voice${i}]amix=inputs=2:duration=first:normalize=0[${nextStream}];`;

            currentStream = nextStream;
        }

        // Remove trailing semicolon from last filter
        filterComplex = filterComplex.replace(/;\[out\];$/, '[out]').replace(/;$/, '');
    }

    const cmd = `"${ffmpegCmd}" -y ${inputArgs}-filter_complex "${filterComplex}" -map "[out]" -t ${totalDuration} -c:a libmp3lame -q:a 2 "${outputPath}"`;

    console.log(`   🔊 Mixing with continuous ambience...`);
    // console.log('   CMD:', cmd); // Debug

    try {
        await execPromise(cmd);

        if (fs.existsSync(outputPath)) {
            const stats = fs.statSync(outputPath);
            console.log(`   ✅ Phased Mix Complete: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
            return outputPath;
        } else {
            throw new Error('Phased mix output not found');
        }
    } catch (e: any) {
        console.error(`   ❌ Mix Error: ${e.message}`);
        // Fallback: return ambience
        return ambiencePath;
        return ambiencePath;
    }
}

// =====================================================
// V6: Backing Audio Harvesting
// =====================================================

async function harvestBackingAudio(parentStoryId: string, script: GeneratedScript, ambiencePath: string): Promise<void> {
    if (!fs.existsSync(ambiencePath)) {
        console.log('      ⚠️ Ambience file not found, skipping harvest');
        return;
    }

    const backingSlug = (script.backingTitle || script.title).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const dateFolder = new Date().toISOString().split('T')[0];
    const storagePath = `${dateFolder}/${backingSlug}-backing`;

    // Upload backing audio
    const audioBuffer = fs.readFileSync(ambiencePath);
    const audioFileName = `${storagePath}/audio.mp3`;

    console.log(`      📤 Uploading backing audio: ${audioFileName}`);
    const { error: audioError } = await supabase.storage.from('audio').upload(audioFileName, audioBuffer, { contentType: 'audio/mpeg', upsert: true });

    if (audioError) {
        console.log(`      ⚠️ Backing audio upload failed: ${audioError.message}`);
        return;
    }

    const { data: urlData } = supabase.storage.from('audio').getPublicUrl(audioFileName);
    const backingAudioUrl = urlData.publicUrl;
    console.log(`      ✅ Backing audio harvested: ${backingAudioUrl}`);

    // Create a separate story entry for the backing track (as a soundscape)
    const backingStoryData = {
        title: script.backingTitle || `${script.title} (Soundscape)`,
        slug: `${backingSlug}-soundscape`,
        description: script.ambiencePrompt || `Ambient soundscape extracted from ${script.title}`,
        category: script.backingCategory || 'soundscape',
        duration: script.duration * 60,
        audio_url: backingAudioUrl,
        is_premium: false,
        is_published: false // Draft until reviewed
    };

    const { error: insertError } = await supabase
        .from('stories')
        .upsert(backingStoryData, { onConflict: 'slug' });

    if (insertError) {
        console.log(`      ⚠️ Backing story creation failed: ${insertError.message}`);
    } else {
        console.log(`      ✅ Backing track saved as separate soundscape`);
    }
}

// =====================================================
// Supabase Upload
// =====================================================

export async function uploadStory(
    scriptOrId: GeneratedScript | string,
    audioPath?: string,
    assets?: AssetPack,
    voicePath?: string
): Promise<string> {
    console.log('☁️ Uploading to Supabase...');

    if (typeof scriptOrId === 'string') {
        console.log(`   📦 Upload by ID: ${scriptOrId}`);
        return scriptOrId;
    }

    const script = scriptOrId;
    const slug = script.slug || script.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const dateFolder = new Date().toISOString().split('T')[0];
    const safeSlug = slug.replace(/[^a-z0-9-]/g, '');
    const storagePath = `${dateFolder}/${safeSlug}`;

    // 1. Fetch Existing Record (for Safe Merge)
    let existingStory: any = null;
    const { data: existingData } = await supabase
        .from('stories')
        .select('*')
        .eq('slug', slug)
        .single();

    if (existingData) {
        existingStory = existingData;
        console.log(`      🔄 Merging with existing story ID: ${existingStory.id}`);
    }

    // Upload audio (Master Mix)
    let audioUrl = existingStory?.audio_url || '';
    if (audioPath && fs.existsSync(audioPath)) {
        const audioBuffer = fs.readFileSync(audioPath);
        const audioFileName = `${storagePath}/audio.mp3`;
        console.log(`      📤 Uploading audio: ${audioFileName} (${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
        const { error: audioError } = await supabase.storage.from('audio').upload(audioFileName, audioBuffer, { contentType: 'audio/mpeg', upsert: true });
        if (!audioError) {
            const { data: urlData } = supabase.storage.from('audio').getPublicUrl(audioFileName);
            audioUrl = urlData.publicUrl;
            console.log(`      ✅ Audio uploaded: ${audioUrl}`);
        } else {
            console.error(`      ❌ Audio upload failed: ${audioError.message}`);
        }
    } else {
        console.warn(`      ⚠️ No audio file to upload (path: ${audioPath})`);
    }

    // Upload Voice Source (Stems) - Silent Backup
    if (voicePath && fs.existsSync(voicePath)) {
        console.log('      🎙️ Archiving voice source...');
        const voiceBuffer = fs.readFileSync(voicePath);
        const voiceFileName = `${storagePath}/voice_source.mp3`;
        await supabase.storage.from('audio').upload(voiceFileName, voiceBuffer, { contentType: 'audio/mpeg', upsert: true });
    }

    // Upload Assets Helper
    const uploadImage = async (localPath: string, suffix: string, currentUrl?: string): Promise<string> => {
        if (!localPath || !fs.existsSync(localPath)) return currentUrl || '';
        const fileName = `${storagePath}/cover${suffix}.png`;
        const buffer = fs.readFileSync(localPath);
        const { error } = await supabase.storage.from('covers').upload(fileName, buffer, { contentType: 'image/png', upsert: true });
        if (error) {
            console.log(`      ⚠️ Upload failed (${suffix}): ${error.message}`);
            return currentUrl || '';
        }
        const { data } = supabase.storage.from('covers').getPublicUrl(fileName);
        return data.publicUrl;
    };

    const coverUrl = await uploadImage(assets?.cover_url || '', '', existingStory?.cover_url);
    const landscapeUrl = await uploadImage(assets?.cover_landscape_url || '', '_wide', existingStory?.cover_landscape_url);
    const portraitUrl = await uploadImage(assets?.cover_portrait_url || '', '_tall', existingStory?.cover_portrait_url);

    if (coverUrl) console.log(`      ✅ Main Cover: ${coverUrl}`);

    // Upload Backing Assets (Archival for Harvesting)
    if (assets?.backing_cover_url) {
        console.log('      🎹 Archiving Backing Track Assets...');
        await uploadImage(assets.backing_cover_url, '_backing');
        await uploadImage(assets.backing_cover_landscape_url || '', '_backing_wide');
        await uploadImage(assets.backing_cover_portrait_url || '', '_backing_tall');
    }

    // Upsert database record (Merge)
    const storyData = {
        title: script.title,
        slug: slug,
        description: `A ${script.duration}-minute ${script.category} experience`,
        category: script.category,
        duration: script.duration * 60,
        audio_url: audioUrl,
        cover_url: coverUrl,
        cover_landscape_url: landscapeUrl,
        cover_portrait_url: portraitUrl,
        is_premium: existingStory?.is_premium || false,
        is_published: false, // Default to Draft for admin approval
        voice_id: script.voiceIdOverride || existingStory?.voice_id || null,
        audio_phases: script.audioPhases || existingStory?.audio_phases || null,
        script_text: script.script || existingStory?.script_text || null,
        // Preserve social fields
        social_reel_url: existingStory?.social_reel_url || null,
        social_status: existingStory?.social_status || 'generated',
        tags: script.tags || existingStory?.tags || [],
        cost_metadata: script.usageStats || existingStory?.cost_metadata || null
    };

    const { data, error } = await supabase
        .from('stories')
        .upsert(storyData, { onConflict: 'slug' })
        .select('id')
        .single();

    if (error) {
        console.log(`   ⚠️ Database error: ${error.message}`);
        return '';
    }

    console.log(`   ✅ Story uploaded/updated: ${data.id}`);
    return data.id;
}


// =====================================================
// Helpers
// =====================================================

export async function generateStory(brief: any, conceptOverride?: StoryConcept): Promise<string> {
    console.log(`🎬 Generating Story: ${brief.title || brief.category} (${brief.duration}min)`);
    // console.log('DEBUG: brief V5 fields:', { amb: brief.ambiencePrompt, mix: brief.mixSettings, layers: brief.layers });

    // V6: Check if this category should use phased generation
    const usePhasedMode = brief.generationMode === 'phased' ||
        (PHASED_CATEGORIES.includes(brief.category) && brief.generationMode !== 'continuous');

    if (usePhasedMode) {
        console.log('   🔀 PHASED GENERATION MODE (V6)');

        // Generate phased script
        const script = await generatePhasedScript(brief);
        if (!script) throw new Error("Phased script generation failed");

        const safeTitle = script.title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        const scriptPath = path.join(OUTPUT_DIR, `${safeTitle}.json`);
        fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));
        console.log(`   📄 Phased Script saved: ${scriptPath}`);

        // Generate voice for each narration phase
        const voiceResult = await generatePhasedVoice(script);

        // Generate ambience (single track for the whole story)
        const ambiencePath = await generateOrFetchAmbience(script);

        // Generate asset pack
        const assetResult = await generateAssetPack(script);

        // Mix all phases together
        const mixedPath = await mixPhasedAudio(script, voiceResult.phasePaths, ambiencePath);

        // Upload to Supabase
        const storyId = await uploadStory(script, mixedPath, assetResult);

        // V6: Auto-tag the story after upload
        if (storyId) {
            console.log('🏷️ Auto-tagging story...');
            const { AutoTagger } = await import('./AutoTagger.js');
            await AutoTagger.tagStory({ id: storyId, title: script.title, category: script.category, description: `A ${script.duration}-minute ${script.category} experience` });
        }

        // V6: Harvest backing audio as reusable asset
        if (ambiencePath && script.backingTitle && storyId) {
            console.log('🎹 Harvesting backing audio...');
            await harvestBackingAudio(storyId, script, ambiencePath);
        }

        console.log(`   ✅ Story Complete! ID: ${storyId}`);
        return storyId;
    }

    // CONTINUOUS MODE (Original V5 flow)
    const script = await generateScript(brief);
    if (!script) throw new Error("Script generation failed");

    const safeTitle = script.title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const scriptPath = path.join(OUTPUT_DIR, `${safeTitle}.json`);
    fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));
    console.log(`   📄 Script saved: ${scriptPath}`);

    // V5: Inject Brief Options (e.g. from Tests or UI)
    if (brief.ambiencePrompt) {
        script.ambiencePrompt = brief.ambiencePrompt;
        console.log(`   🌧️ Injected Ambience Prompt: "${script.ambiencePrompt}"`);
    }

    if (brief.mixSettings) script.mixSettings = brief.mixSettings;
    if (brief.layers) script.layers = brief.layers;
    if (brief.warmupDuration !== undefined) script.warmupDuration = brief.warmupDuration;
    if (brief.pacingMode) script.pacingMode = brief.pacingMode;

    // V5.1: Auto-detect layers from RECIPE_MATRIX if not provided
    if (!script.layers) {
        const recipe = RECIPE_MATRIX[script.category];
        if (recipe) {
            script.layers = {
                voice: recipe.voice,
                music: recipe.backing === 'music',
                ambience: recipe.backing === 'soundscape' || recipe.backing === 'frequency'
            };
            console.log(`   🧩 Auto-layers from RECIPE_MATRIX: ${JSON.stringify(script.layers)}`);
        }
    }

    // V5.1: Fallback ambiencePrompt from musicPrompt for Pure Audio categories
    const isPureAudio = PURE_AUDIO_CATEGORIES.includes(script.category);
    if (!script.ambiencePrompt && isPureAudio && script.musicPrompt) {
        script.ambiencePrompt = script.musicPrompt.replace(/^NEW:\s*/i, '').trim();
        console.log(`   🌧️ Derived ambiencePrompt from musicPrompt: "${script.ambiencePrompt}"`);
    }

    // Determine if voice is needed (uses layers or category fallback)
    const NO_VOICE_CATEGORIES = ['music_instrumental', 'soundscape', 'binaural'];
    const isInstrumental = NO_VOICE_CATEGORIES.includes(script.category.toLowerCase()) || script.category.toLowerCase().includes('instrumental');

    let voicePath = '';
    let voiceChars = 0;
    if (!isInstrumental) {
        const vResult = await generateVoice(script);
        voicePath = vResult.path;
        voiceChars = vResult.characterCount;
    } else {
        console.log(`   🚫 Skipping Voice Generation for category: ${script.category} (Instrumental/Ambient)`);
    }

    const loopPath = await generateOrFetchLoop(script);
    const ambiencePath = await generateOrFetchAmbience(script);
    const assetResult = await generateAssetPack(script);

    // Update Usage Stats
    if (script.usageStats) {
        script.usageStats.elevenLabsChars = voiceChars;
        script.usageStats.dalleImages = assetResult.imageCount;
    }

    const mixedPath = await mixAudio(voicePath, loopPath, script, ambiencePath);

    const storyId = await uploadStory(script, mixedPath, assetResult, voicePath);
    console.log(`   ✅ Story Complete! ID: ${storyId}`);

    return storyId;
}

async function backfillAssets(storyIdOrScriptFile: string) {
    console.log(`🎨 Backfilling assets for: ${storyIdOrScriptFile}`);

    let script: GeneratedScript;
    let scriptPath = storyIdOrScriptFile;

    if (!scriptPath.endsWith('.json')) {
        scriptPath = path.join(OUTPUT_DIR, storyIdOrScriptFile);
        if (!scriptPath.endsWith('.json')) scriptPath += '.json';
    }

    if (!fs.existsSync(scriptPath)) {
        throw new Error(`Script file not found: ${scriptPath}`);
    }

    script = JSON.parse(fs.readFileSync(scriptPath, 'utf-8'));
    console.log(`   📖 Read script: "${script.title}"`);
    console.log(`      Prompt: ${script.coverPrompt?.substring(0, 50)}...`);

    const assets = await generateAssetPack(script);

    // Upload (Safely merge)
    await uploadStory(script, '', assets);
}


// =====================================================
// CLI Main Function
// =====================================================

// =====================================================
// Build Logic (Reusable)
// =====================================================

export async function buildStoryFromConcept(rawConcept: any): Promise<string> {
    console.log(`🏗️ Building from Concept: "${rawConcept.title}"`);

    const newBrief: StoryBrief = {
        title: rawConcept.title,
        category: rawConcept.category || 'sleep',
        duration: rawConcept.intendedDuration || 10,
        theme: rawConcept.theme || 'Relaxation',
        mood: rawConcept.mood || 'Calm',
        description: rawConcept.logline || rawConcept.title,
        voiceStyle: rawConcept.audioIdentity?.voiceStyle as any || 'soft_female',
        generationMode: rawConcept.generationMode || 'auto',
        pacingMode: rawConcept.pacingMode,
        warmupDuration: rawConcept.warmupDuration,
        ambiencePrompt: rawConcept.audioIdentity?.ambienceLayer,
        mixSettings: rawConcept.mixSettings,
        layers: rawConcept.layers,
    };

    return await generateStory(newBrief, rawConcept);

    /* LEGACY EXECUTION SKIPPED */
    // ----------------------------------------
    // SAFETY ADAPTER: Normalize Concept Data
    // ----------------------------------------
    const concept: StoryConcept = {
        ...rawConcept,
        audioIdentity: {
            matchStyle: 'neutral',
            voiceStyle: 'soft_female',
            // ...defaults
            ...rawConcept.audioIdentity
        }
    };

    // Fallback for missing voice style, explicit check
    if (!concept.audioIdentity?.voiceStyle) {
        console.warn('⚠️ Missing voiceStyle in concept, defaulting to soft_female');
        concept.audioIdentity = { ...concept.audioIdentity, voiceStyle: 'soft_female' };
    }

    const brief: StoryBrief = {
        category: concept.category || 'sleep',
        duration: concept.intendedDuration || 10,
        theme: concept.theme || 'Relaxation',
        mood: concept.mood || 'Calm',
        voiceStyle: concept.audioIdentity?.voiceStyle as any
    };

    // Generate with Override
    const script = await generateScript(brief, concept);
    script.mixLevel = concept.mixLevel || 'balanced';
    script.voiceStyle = brief.voiceStyle;
    script.layers = concept.layers; // Pass V5 Layers Config

    // Continue standard pipeline
    const safeTitle = script.title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const scriptPath = path.join(OUTPUT_DIR, `${safeTitle}.json`);
    fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));

    // Determine if voice is needed
    const NO_VOICE_CATEGORIES = ['music_instrumental', 'soundscape', 'binaural'];
    const isInstrumental = NO_VOICE_CATEGORIES.includes(script.category.toLowerCase()) || script.category.toLowerCase().includes('instrumental');

    let voicePath = '';
    let voiceChars = 0;
    if (!isInstrumental) {
        const vResult = await generateVoice(script);
        voicePath = vResult.path;
        voiceChars = vResult.characterCount;
    } else {
        console.log(`   🚫 Skipping Voice Generation for category: ${script.category} (Instrumental/Ambient)`);
    }

    const loopPath = await generateOrFetchLoop(script);
    const ambiencePath = await generateOrFetchAmbience(script);
    const assetResult = await generateAssetPack(script);

    // Update Usage Stats
    if (script.usageStats) {
        script.usageStats.elevenLabsChars = voiceChars;
        script.usageStats.dalleImages = assetResult.imageCount;
    }

    const mixedPath = await mixAudio(voicePath, loopPath, script, ambiencePath);
    const storyId = await uploadStory(script, mixedPath, assetResult, voicePath);
    console.log(`✅ Build Complete! ID: ${storyId}`);

    return storyId;
}

// =====================================================
// CLI Main Function
// =====================================================

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command) {
        console.log(`
🏭 SOFTALE AUDIO FACTORY V4.5 (GPT Image 1.5)

Usage:
  npx tsx src/index.ts <command> [options]

Commands:
  full <category> <duration>    Generate complete story
  assets <script_filename>      Regenerate assets for existing story (Backfill)
`);
        return;
    }

    try {
        switch (command) {
            case 'full': {
                const category = args[1] || 'sleep';
                const duration = parseInt(args[2]) || 10;
                await generateStory({ category, duration });
                break;
            }

            case 'assets': {
                const scriptFile = args[1];
                if (!scriptFile) throw new Error('Usage: assets <script_filename.json>');
                await backfillAssets(scriptFile);
                break;
            }

            case 'batch': {
                console.log("Batch not available in CLI yet.");
                break;
            }

            case 'concept': {
                // Usage: concept <category> <idea> <base64Options OR duration> [mixLevel]
                const category = args[1];
                const idea = args[2];
                const arg3 = args[3];

                if (!category || !idea) throw new Error('Usage: concept <category> <"idea string"> [optionsBase64 or duration] [mixLevel]');

                let options: any = {};

                // Attempt to parse arg3 as Base64 JSON
                try {
                    const jsonStr = Buffer.from(arg3 || '', 'base64').toString('utf-8');
                    // Simple check if it looks like JSON
                    if (jsonStr.startsWith('{')) {
                        options = JSON.parse(jsonStr);
                        console.log('   🔧 Using V5 Enhanced Options:', Object.keys(options).join(', '));
                    } else {
                        throw new Error('Not JSON');
                    }
                } catch (e) {
                    // Fallback to positional: duration, mixLevel
                    options.duration = parseInt(arg3) || 10;
                    options.mixLevel = args[4] || 'balanced';
                }

                // Map old signature to new options if needed
                if (!options.duration) options.duration = 10;
                if (!options.mixLevel) options.mixLevel = 'balanced';

                const concept = await ConceptEngine.generate(idea, category, options);
                const safeSlug = concept.title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                const outputPath = path.join(OUTPUT_DIR, `concept_${safeSlug}.json`);
                fs.writeFileSync(outputPath, JSON.stringify(concept, null, 2));
                console.log(`\n💾 Concept Saved: ${outputPath}`);
                break;
            }

            case 'build': {
                const conceptFile = args[1];
                if (!conceptFile) throw new Error('Usage: build <concept_file>');

                // Read Concept
                const conceptPath = path.resolve(process.cwd(), conceptFile);
                if (!fs.existsSync(conceptPath)) throw new Error(`File not found: ${conceptPath}`);

                const rawConcept = JSON.parse(fs.readFileSync(conceptPath, 'utf-8'));
                await buildStoryFromConcept(rawConcept);
                break;
            }

            case 'autotag': {
                await AutoTagger.processAll();
                break;
            }

            default:
                console.error(`Unknown command: ${command}`);
        }
    } catch (e: any) {
        console.error('❌ FATAL ERROR:', e.message);
        process.exit(1);
    }
}

main().catch(console.error);
