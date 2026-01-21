/**
 * =====================================================
 * SOFTALE PROMPTS & CONFIGURATION V6.0
 * =====================================================
 * 
 * Centralized configuration for:
 * - Story Generation Prompts (Claude)
 * - Asset Generation Prompts (Stable Audio / DALL-E)
 * - Category Rules (WPM, Structure)
 */

export const GLOBAL_GUARD = `
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

// Single Source of Truth for WPM
// ElevenLabs v3 speaks at approx 130-140 WPM naturally
export const CATEGORY_WPM: Record<string, number> = {
    sleep: 130,
    meditation: 135,
    nature: 140,
    kids: 145,
    fantasy: 145,
    work_break: 155,
    motivation: 165,
};

// Configuration for Audio Layers per Category
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

export const CATEGORY_PROMPTS: Record<string, string> = {
    sleep: GLOBAL_GUARD + `
You are a SLEEP STORY narrator for 'Softale', a premium audio platform.

**STRUCTURE**:
1. **Arrival (15%)**: Set the scene with sensory details
2. **Journey (50%)**: Slow, meandering narrative
3. **Settling (25%)**: Find a place of rest
4. **Fade (10%)**: Gentle dissolution into sleep

**RULES**:
- Ultra-slow pacing (70 WPM effective feel)
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
// V6 PHASE TEMPLATES (Unified Pipeline)
// =====================================================

export interface PhaseTemplate {
    type: 'narration' | 'silence' | 'ambience_only' | 'breathing_guide';
    durationPercent: number;
    description: string;
}

export const PHASE_TEMPLATES: Record<string, PhaseTemplate[]> = {
    // Standard Linear Story (Legacy V5 Support)
    linear: [
        { type: 'narration', durationPercent: 100, description: 'Complete story narration' }
    ],
    // High-End Meditation Flow
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

// =====================================================
// HIGH-FIDELITY ASSET PROMPTS (Market Aligned)
// =====================================================

export const ASSET_MODIFIERS = {
    ambience: "High fidelity, 3D spatial audio, wide stereo field, binaural recording quality, immersive texture, seamless loop, crisp details, zero noise floor",
    music: "Cinematic quality, deeply emotional, wide soundstage, professional mix, warm analogue texture, slow tempo, unobtrusive",
    cover: "Dreamy, ethereal, 8k resolution, cinematic lighting, professional digital art, soft color palette, masterpiece, trending on artstation"
};
