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
import { createClient } from '@supabase/supabase-js';
import { CATALOG_ITEMS } from './catalog-config.js';
dotenv.config();
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
// Constants: Categories & WPM
// =====================================================
export const RECIPE_MATRIX = {
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
export const CATEGORY_WPM = {
    sleep: 130, // Previously 70
    meditation: 135, // Previously 75
    nature: 140, // Previously 80
    kids: 145, // Previously 85
    fantasy: 145, // Previously 90
    work_break: 155, // Previously 100
    motivation: 165, // Previously 110
};
export const getTargetWordCount = (category, durationMinutes) => {
    return Math.round(durationMinutes * (CATEGORY_WPM[category] || 90));
};
const PURE_AUDIO_CATEGORIES = ['soundscape', 'binaural', 'music_instrumental'];
// =====================================================
// Stock Loop Caching
// =====================================================
let cachedLoops = null;
async function fetchStockLoops() {
    if (cachedLoops)
        return cachedLoops;
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
function formatLoopsForPrompt(loops) {
    if (loops.length === 0)
        return 'No stock loops available.';
    const grouped = {};
    for (const loop of loops) {
        const cat = loop.category || 'uncategorized';
        if (!grouped[cat])
            grouped[cat] = [];
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
async function callClaude(systemPrompt, userPrompt, maxTokens = 4096) {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey)
        throw new Error('ANTHROPIC_API_KEY not set');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: 'claude-opus-4-20250514',
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
    console.log(`   ✅ Model used: ${data.model}`);
    console.log(`   📊 Tokens: ${data.usage?.input_tokens || 'N/A'} in / ${data.usage?.output_tokens || 'N/A'} out`);
    return data.content[0].text;
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
const CATEGORY_PROMPTS = {
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
async function generatePhase1_StoryDesign(brief) {
    console.log('📝 Phase 1: Generating Story Design...');
    const targetWords = getTargetWordCount(brief.category, brief.duration);
    const systemPrompt = `You are a story architect for Softale, a premium relaxation audio platform.
Design a high-level story structure. Be creative but stay within the category's purpose.`;
    const userPrompt = `Design a ${brief.duration}-minute ${brief.category} story.
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
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch)
        throw new Error('Failed to parse Phase 1 response');
    return JSON.parse(jsonMatch[0]);
}
// =====================================================
// Phase 2: Script Generation
// =====================================================
async function generatePhase2_Script(design, category) {
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
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch)
        throw new Error('Failed to parse Phase 2 response');
    const result = JSON.parse(jsonMatch[0]);
    // Validate word count
    const actualWords = result.script.split(/\s+/).length;
    result.actualWordCount = actualWords;
    console.log(`   📊 Word count: ${actualWords} / ${design.targetWordCount} target`);
    return result;
}
// =====================================================
// Phase 2.5: Script Expansion (if needed)
// =====================================================
async function expandScript(scriptResult, targetWords, category) {
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
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch)
        throw new Error('Failed to parse expansion response');
    const result = JSON.parse(jsonMatch[0]);
    const actualWords = result.script.split(/\s+/).length;
    result.actualWordCount = actualWords;
    console.log(`   📊 Expanded word count: ${actualWords} / ${targetWords} target`);
    return result;
}
// =====================================================
// Phase 3: Asset Design
// =====================================================
async function generatePhase3_Assets(design, stockLoops, category) {
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
    "backingCoverPrompt": "DALL-E prompt for the backing audio artwork" (only if NEW)
}`;
    const response = await callClaude(systemPrompt, userPrompt, 1000);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch)
        throw new Error('Failed to parse Phase 3 response');
    return JSON.parse(jsonMatch[0]);
}
// =====================================================
// Phase 4: Audio Direction (Optional)
// =====================================================
async function generatePhase4_AudioDir(design) {
    console.log('🎬 Phase 4: Generating Audio Direction...');
    // Check if multiple soundscapes are needed
    const uniqueSoundscapes = new Set(design.keyScenes.map(s => s.soundscape).filter(Boolean));
    if (uniqueSoundscapes.size <= 1) {
        console.log('   ⏭️ Single environment detected, skipping audio phases');
        return { audioPhases: [] };
    }
    const systemPrompt = `You are an audio director for Softale.
Design smooth transitions between audio environments.`;
    const userPrompt = `Story: "${design.title}"
Key scenes with soundscapes: ${JSON.stringify(design.keyScenes)}

Return JSON only:
{
    "audioPhases": [
        { "atPercent": 0-100, "soundId": "environment name", "intensity": 0-1, "narrativeReason": "why this transition" }
    ]
}`;
    const response = await callClaude(systemPrompt, userPrompt, 800);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch)
        return { audioPhases: [] };
    return JSON.parse(jsonMatch[0]);
}
// =====================================================
// Main Script Generation (Multi-Phase Orchestrator)
// =====================================================
export async function generateScript(brief) {
    console.log('\n🏭 AUDIO FACTORY V4.0 - Multi-Phase Generation');
    console.log(`   Category: ${brief.category}`);
    console.log(`   Duration: ${brief.duration} minutes`);
    const isPureAudio = PURE_AUDIO_CATEGORIES.includes(brief.category);
    const stockLoops = await fetchStockLoops();
    // Phase 1: Story Design
    const storyDesign = await generatePhase1_StoryDesign(brief);
    console.log(`   ✅ Phase 1 complete: "${storyDesign.title}"`);
    let script = '';
    let actualWordCount = 0;
    let pauseMarkersUsed = 0;
    // Phase 2: Script Generation (skip for pure audio)
    if (!isPureAudio) {
        let scriptResult = await generatePhase2_Script(storyDesign, brief.category);
        // Validation loop: expand if too short
        let attempts = 0;
        while (scriptResult.actualWordCount < storyDesign.targetWordCount * 0.85 && attempts < 2) {
            console.log(`   ⚠️ Script too short, expanding (attempt ${attempts + 1}/2)...`);
            scriptResult = await expandScript(scriptResult, storyDesign.targetWordCount, brief.category);
            attempts++;
        }
        script = scriptResult.script;
        actualWordCount = scriptResult.actualWordCount;
        pauseMarkersUsed = scriptResult.pauseMarkersUsed;
        console.log(`   ✅ Phase 2 complete: ${actualWordCount} words`);
    }
    else {
        console.log(`   ⏭️ Phase 2 skipped (pure audio category)`);
    }
    // Phase 3: Asset Design
    const assetDesign = await generatePhase3_Assets(storyDesign, stockLoops, brief.category);
    console.log(`   ✅ Phase 3 complete: Assets designed`);
    // Phase 4: Audio Direction
    const audioDirection = await generatePhase4_AudioDir(storyDesign);
    console.log(`   ✅ Phase 4 complete: ${audioDirection.audioPhases.length} audio phases`);
    // Voice selection
    const VOICE_MAP = {
        'soft_female': 'mZ3kbJNnKRWI4YzJXA9j', // Delilah
        'soft_male': 'GUDYcgRAONiI1nXDcNQQ', // Milo
        'neutral': '21m00Tcm4TlvDq8ikWAM', // Rachel
    };
    const voiceId = brief.voiceId || VOICE_MAP[brief.voiceStyle || 'soft_female'];
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
        audioPhases: audioDirection.audioPhases,
        voiceIdOverride: voiceId,
        musicFile: brief.musicFile,
        backingCategory: assetDesign.backingCategory,
        backingTitle: assetDesign.backingTitle,
        backingCoverPrompt: assetDesign.backingCoverPrompt,
        createdAt: new Date().toISOString(),
    };
}
// =====================================================
// Voice Generation (ElevenLabs v3)
// =====================================================
const PREMIUM_VOICES = {
    'Milo': 'GUDYcgRAONiI1nXDcNQQ',
    'Spuds': 'NOpBlnGInO9m6vDvFkFC',
    'Charlotte': 'XB0fDUnXU5powFXDhCwa',
    'Delilah': 'mZ3kbJNnKRWI4YzJXA9j',
    'Luna': 'kBxqBYnZjH7G9mDYPVU4',
    'Rachel': '21m00Tcm4TlvDq8ikWAM',
    'Aria': '9BWtsMINqrJLrRacOk9x',
};
export async function generateVoice(script) {
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsKey) {
        console.log('⚠️ ELEVENLABS_API_KEY not set - skipping voice generation');
        return '';
    }
    console.log('🎙️ Generating voice with ElevenLabs v3...');
    if (!script.script || script.script.trim().length === 0) {
        console.log('   ⏭️ Empty script (pure audio mode). Skipping voice.');
        return '';
    }
    const voiceId = script.voiceIdOverride || PREMIUM_VOICES['Delilah'];
    const outputPath = path.join(OUTPUT_DIR, `${script.title.replace(/\s+/g, '_')}_voice.mp3`);
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': elevenLabsKey,
        },
        body: JSON.stringify({
            text: script.script,
            model_id: 'eleven_v3',
            voice_settings: {
                stability: 0.5, // ElevenLabs v3: 0.0=Creative, 0.5=Natural, 1.0=Robust
                similarity_boost: 0.75,
                style: 0.5, // ElevenLabs v3: balanced style
                use_speaker_boost: true,
            },
        }),
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs error: ${error}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);
    console.log(`   ✅ Voice saved: ${outputPath}`);
    return outputPath;
}
// =====================================================
// Music/Loop Generation (Harvest Engine)
// =====================================================
export async function generateOrFetchLoop(script) {
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
    formData.append('duration', '180'); // 3 minutes
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
            // 1. Generate Cover for the Loop (if prompt exists)
            let loopCoverPath = '';
            if (script.backingCoverPrompt) {
                console.log('      🖼️ Generating backing artwork...');
                // Create a mini-script object for the cover generator to use correct title/prompt
                const loopBrief = {
                    ...script,
                    title: script.backingTitle,
                    coverPrompt: script.backingCoverPrompt
                };
                loopCoverPath = await generateCover(loopBrief).catch(e => {
                    console.log('      ⚠️ Backing cover failed:', e.message);
                    return '';
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
            };
            const loopId = await uploadStory(loopAssetScript, outputPath, loopCoverPath);
            console.log(`   ✅ Harvested Loop Saved! ID: ${loopId}`);
            console.log(`   📝 To reuse: Add ID ${loopId} to your catalog or stock prompts.`);
        }
        catch (e) {
            console.log(`   ⚠️ Harvest failed: ${e.message}`);
        }
    }
    return outputPath;
}
// =====================================================
// Cover Art Generation (DALL-E)
// =====================================================
export async function generateCover(script) {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
        console.log('⚠️ OPENAI_API_KEY not set - skipping cover generation');
        return '';
    }
    console.log('🖼️ Generating cover art with DALL-E...');
    const coverPrompt = script.coverPrompt || `Dreamy, ethereal artwork for "${script.title}" - ${script.category} audio experience`;
    const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
            model: 'dall-e-3',
            prompt: coverPrompt,
            n: 1,
            size: '1024x1024',
            quality: 'hd',
        }),
    });
    if (!response.ok) {
        const error = await response.text();
        console.log(`   ⚠️ DALL-E error: ${error}`);
        return '';
    }
    const data = await response.json();
    const imageUrl = data.data[0]?.url;
    if (!imageUrl) {
        console.log('   ⚠️ No image URL returned');
        return '';
    }
    // Download and save
    const outputPath = path.join(OUTPUT_DIR, `${script.title.replace(/\s+/g, '_')}_cover.png`);
    const imageResponse = await fetch(imageUrl);
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);
    console.log(`   ✅ Cover saved: ${outputPath}`);
    return outputPath;
}
// =====================================================
// Audio Mixing (FFmpeg placeholder)
// =====================================================
export async function mixAudio(voicePath, loopPath, script) {
    console.log('🎛️ Mixing audio...');
    // For now, just return the voice file
    // Full implementation would use FFmpeg to:
    // 1. Loop the background audio to match voice duration
    // 2. Adjust levels (voice louder than background)
    // 3. Apply audio phases for dynamic mixing
    // 4. Export final mix
    if (!voicePath && loopPath) {
        console.log('   📎 Pure audio mode - returning loop only');
        return loopPath;
    }
    if (voicePath && !loopPath) {
        console.log('   📎 No loop - returning voice only');
        return voicePath;
    }
    // TODO: Implement FFmpeg mixing
    console.log('   ⚠️ Full mixing not implemented - returning voice');
    return voicePath || loopPath || '';
}
// =====================================================
// Supabase Upload
// =====================================================
export async function uploadStory(scriptOrId, audioPath, coverPath) {
    console.log('☁️ Uploading to Supabase...');
    // Support calling with just an ID (for batch scripts)
    if (typeof scriptOrId === 'string') {
        console.log(`   📦 Upload by ID: ${scriptOrId}`);
        // For ID-based upload, the files should already exist in the output folder
        return scriptOrId;
    }
    const script = scriptOrId;
    const slug = script.slug || script.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    // Folder Structure Strategy: YYYY-MM-DD/slug/
    const dateFolder = new Date().toISOString().split('T')[0];
    const safeSlug = slug.replace(/[^a-z0-9-]/g, '');
    const storagePath = `${dateFolder}/${safeSlug}`;
    // Upload audio
    let audioUrl = '';
    if (audioPath && fs.existsSync(audioPath)) {
        const audioBuffer = fs.readFileSync(audioPath);
        // Standardize filename inside the folder
        const audioFileName = `${storagePath}/audio.mp3`;
        const { error: audioError } = await supabase.storage
            .from('audio')
            .upload(audioFileName, audioBuffer, { contentType: 'audio/mpeg', upsert: true });
        if (!audioError) {
            const { data: urlData } = supabase.storage.from('audio').getPublicUrl(audioFileName);
            audioUrl = urlData.publicUrl;
        }
        else {
            console.log(`      ⚠️ Audio upload failed: ${audioError.message}`);
        }
    }
    // Upload cover
    let coverUrl = '';
    if (coverPath && fs.existsSync(coverPath)) {
        console.log(`      Found cover file: ${coverPath}`);
        const coverBuffer = fs.readFileSync(coverPath);
        const coverFileName = `${storagePath}/cover.png`;
        const { data: uploadData, error: coverError } = await supabase.storage
            .from('covers')
            .upload(coverFileName, coverBuffer, { contentType: 'image/png', upsert: true });
        if (coverError) {
            console.log(`      ⚠️ Cover upload failed: ${coverError.message}`);
        }
        else {
            const { data: urlData } = supabase.storage.from('covers').getPublicUrl(coverFileName);
            coverUrl = urlData.publicUrl;
            console.log(`      ✅ Cover uploaded: ${coverUrl}`);
        }
    }
    else {
        console.log(`      ⚠️ Cover file not found at path: ${coverPath}`);
    }
    // Upsert database record
    const storyData = {
        title: script.title,
        slug: slug,
        description: `A ${script.duration}-minute ${script.category} experience`,
        category: script.category,
        duration: script.duration * 60, // convert to seconds
        audio_url: audioUrl,
        cover_url: coverUrl,
        is_premium: false,
        voice_id: script.voiceIdOverride || null,
        audio_phases: script.audioPhases || null,
        script_text: script.script || null,
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
    console.log(`   ✅ Story uploaded: ${data.id}`);
    return data.id;
}
// =====================================================
// CLI Main Function
// =====================================================
// =====================================================
// Helpers
// =====================================================
async function generateStory(brief) {
    console.log(`🎬 Generating Story: ${brief.title || brief.category} (${brief.duration}min)`);
    // 1. Generate Script
    // If running in batch, we might have description in brief.
    const script = await generateScript(brief);
    if (!script)
        throw new Error("Script generation failed");
    // Save Script
    const safeTitle = script.title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const scriptPath = path.join(OUTPUT_DIR, `${safeTitle}.json`);
    fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));
    console.log(`   📄 Script saved: ${scriptPath}`);
    // 2. Generate Assets
    const voicePath = await generateVoice(script);
    const loopPath = await generateOrFetchLoop(script);
    const coverPath = await generateCover(script);
    // 3. Mix (Placeholder/Future)
    const mixedPath = await mixAudio(voicePath, loopPath, script);
    // 4. Upload
    const storyId = await uploadStory(script, mixedPath, coverPath);
    console.log(`   ✅ Story Complete! ID: ${storyId}`);
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
🏭 SOFTALE AUDIO FACTORY V4.0

Usage:
  npx ts-node src/index.ts <command> [options]

Commands:
  full <category> <duration>    Generate complete story
  batch [--start N] [--count N] Process catalog items
  script <category> <duration>  Generate script only
  voice <script.json>           Generate voice from script
  music <script.json>           Generate music from script
  cover <script.json>           Generate cover from script
  upload <script.json> <audio> <cover>  Upload to Supabase
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
            case 'batch': {
                const startIdx = args.indexOf('--start') > -1 ? parseInt(args[args.indexOf('--start') + 1]) : 0;
                const countStr = args.indexOf('--count') > -1 ? parseInt(args[args.indexOf('--count') + 1]) : CATALOG_ITEMS.length;
                const dryRun = args.includes('--dry-run');
                const batchItems = CATALOG_ITEMS.slice(startIdx, startIdx + countStr);
                console.log(`🏭 BATCH V4: Processing ${batchItems.length} items (Start: ${startIdx})...`);
                for (let i = 0; i < batchItems.length; i++) {
                    const item = batchItems[i];
                    console.log(`\n📦 [${startIdx + i + 1}/${CATALOG_ITEMS.length}] ${item.title}`);
                    if (dryRun) {
                        console.log(`   (Dry Run) Skipping generation for: ${item.title}`);
                        continue;
                    }
                    try {
                        await generateStory(item);
                    }
                    catch (e) {
                        console.error(`   ❌ Failed: ${item.title}`, e.message);
                    }
                }
                break;
            }
            case 'script': {
                const category = args[1] || 'sleep';
                const duration = parseInt(args[2]) || 10;
                const brief = { category, duration };
                const script = await generateScript(brief);
                const scriptPath = path.join(OUTPUT_DIR, `${script.title.replace(/\s+/g, '_')}.json`);
                fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));
                console.log(`📄 Script saved: ${scriptPath}`);
                break;
            }
            case 'voice': {
                const scriptFile = args[1];
                if (!scriptFile)
                    throw new Error('Usage: voice <script.json>');
                const script = JSON.parse(fs.readFileSync(scriptFile, 'utf-8'));
                await generateVoice(script);
                break;
            }
            case 'music': {
                const scriptFile = args[1];
                if (!scriptFile)
                    throw new Error('Usage: music <script.json>');
                const script = JSON.parse(fs.readFileSync(scriptFile, 'utf-8'));
                await generateOrFetchLoop(script);
                break;
            }
            case 'cover': {
                const scriptFile = args[1];
                if (!scriptFile)
                    throw new Error('Usage: cover <script.json>');
                const script = JSON.parse(fs.readFileSync(scriptFile, 'utf-8'));
                await generateCover(script);
                break;
            }
            case 'upload': {
                const scriptFile = args[1];
                const audioFile = args[2];
                const coverFile = args[3];
                if (!scriptFile || !audioFile)
                    throw new Error('Usage: upload <script.json> <audio.mp3> [cover.png]');
                const script = JSON.parse(fs.readFileSync(scriptFile, 'utf-8'));
                await uploadStory(script, audioFile, coverFile || '');
                break;
            }
            default:
                console.error(`Unknown command: ${command}`);
        }
    }
    catch (e) {
        console.error('❌ FATAL ERROR:', e.message);
    }
}
main().catch(console.error);
