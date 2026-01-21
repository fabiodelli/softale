
import { callClaude } from './index.js';

export interface StoryConcept {
    title: string;
    logline: string;
    category: string;
    tags?: string[]; // V5: AI Generated Tags
    theme?: string;
    mood?: string;
    targetAudience?: string;
    pacingMode?: 'continuous' | 'immersive' | 'breathwork'; // V5: Controls pause density
    generationMode?: 'auto' | 'continuous' | 'phased'; // V6: Controls generation pipeline (Single vs Phased)
    warmupDuration?: number; // V5: Seconds of intro music before voice
    intendedDuration?: number; // User preference for build length (minutes)
    mixLevel?: string; // balanced, voice_focus, high_immersion, background_only
    mixSettings?: {
        voice: number;
        music: number;
        ambience: number;
    };

    protagonist?: {
        name?: string;
        role?: string;
        character?: string;
        desire?: string;
        flaw?: string;
    };
    setting?: {
        location?: string;
        atmosphere?: string;
        sensoryDetails?: string[];
    };
    narrativeArc?: {
        hook?: string;
        incident?: string;
        risingAction?: string;
        climax?: string;
        resolution?: string;
    };
    layers?: {
        voice: boolean;
        music: boolean;
        ambience: boolean;
    };
    audioIdentity?: {
        voiceStyle?: 'soft_female' | 'soft_male' | 'neutral';
        voicePacing?: string;
        musicStyle?: string;
        ambienceLayer?: string; // V5: Dedicated background texture (Rain, Wind, Drone)
        keySoundEffects?: string[];
        tempo?: string;
    };
    visualStyle?: {
        artStyle?: string;
        colorPalette?: string[];
        coverConcept?: string;
    };
}

export interface ConceptOptions {
    duration?: number;
    mixLevel?: string;
    title?: string;
    generationMode?: 'auto' | 'continuous' | 'phased';
    pacingMode?: string;
    warmupDuration?: number;
    ambiencePrompt?: string;
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
}

export class ConceptEngine {

    static async generate(idea: string, category: string, options: ConceptOptions = {}): Promise<StoryConcept> {
        const { duration = 10, mixLevel = 'balanced' } = options;
        console.log(`🧠 Concept Engine: Dreaming up "${idea}" (${category}, ${duration}min, mix=${mixLevel})...`);

        const systemPrompt = `You are the LEAD SHOWRUNNER for Softale, a premium audio storytelling studio.
Your job is to take a vague idea and expand it into a rich, detailed Creative Brief (Series Concept).

You do not write the script. You write the BIBLE that the scriptwriters will follow.
Focus on:
1. **Character Depth**: Give the protagonist a soul, a desire, and a flaw.
2. **World Building**: Specific sensory details (not generic).
3. **Emotional Arc**: A clear beginning, middle, and end.
4. **Audio Identity (V5)**: Design a 3-layer soundscape: Voice, Music, and Ambience.
   - **Ambience**: Constant texture (rain, wind, hum).
   - **Music**: Emotional underscore.
   - **Pacing**: Decide if the story needs frequent pauses (Immersive) or steady flow (Continuous).
   - **Layering**: DECIDE WHICH LAYERS ARE CRITICAL. Avoid muddy mixes.
     - *Sleep Story*: Voice + Ambience (Music optional).
     - *Meditation*: Voice + Ambience.
     - *Fantasy*: Voice + Music + Ambience.
     - *Soundscape*: Ambience ONLY (No Voice, No Music).

CATEGORY GUIDELINES:
- **Sleep**: Low conflict, hypnotic, cozy. Use 'immersive' pacing with long pauses.
- **Kids**: Wondrous, safe, clear moral. Use 'continuous' pacing.
- **Sci-Fi/Fantasy**: Vivid lore. Use 'continuous' pacing usually.
- **Meditation**: Use 'breathwork' or 'immersive' pacing.

TAGGING RULES:
- Include 2-3 **SYSTEM TAGS** from: [Morning, Sunrise, Energy, Focus, Work, Deep Work, Background, Study, Relax, Unwind, Sunset, Calm, Sleep, Dream, Night, Binaural]
- Include 3-5 **DESCRIPTIVE TAGS** (e.g. Piano, Rain, Forest, Male Voice, Slow, Ethereal, Cinematic).
- Total of ~5-8 tags.`;

        // Build Mandates
        let mandate = '';
        if (options.title) mandate += `MANDATORY TITLE: "${options.title}" (Do not change this).\n`;
        if (options.pacingMode) mandate += `MANDATORY PACING MODE: "${options.pacingMode}" (Force this value).\n`;
        if (options.warmupDuration !== undefined) mandate += `MANDATORY WARMUP DURATION: ${options.warmupDuration} seconds.\n`;
        if (options.ambiencePrompt) mandate += `MANDATORY AMBIENCE LAYER: "${options.ambiencePrompt}" (Use exactly this for the ambience description).\n`;

        const userPrompt = `Develop a "${category}" series concept from this idea: "${idea}"

${mandate ? `STRICT REQUIREMENTS:\n${mandate}\n` : ''}
RETURN JSON OBJECT EXACTLY LIKE THIS:
{
    "title": "Title",
    "logline": "One sentence summary",
    "category": "${category}",
    "tags": ["SystemTag", "DescriptiveTag"],
    "pacingMode": "continuous" OR "immersive" OR "breathwork",
    "warmupDuration": 8,
    "layers": {
        "voice": true/false,
        "music": true/false,
        "ambience": true/false
    },
    "theme": "Core theme",
    "mood": "Emotional atmosphere",
    "targetAudience": "e.g. Kids 5-8",
    "protagonist": {
        "name": "Name",
        "role": "e.g. Guardian of the Forest",
        "character": "Adjectives",
        "desire": "Goal",
        "flaw": "Weakness"
    },
    "setting": {
        "location": "Place name",
        "atmosphere": "Vibe",
        "sensoryDetails": ["Sight", "Sound", "Smell"]
    },
    "narrativeArc": {
        "hook": "Opening",
        "incident": "Inciting Event",
        "risingAction": "Development",
        "climax": "Peak",
        "resolution": "Ending"
    },
    "audioIdentity": {
        "voiceStyle": "soft_female" (OR "soft_male" OR "neutral"),
        "voicePacing": "Adjectives",
        "musicStyle": "Musical Genre/Instruments (Emotional Layer) - Leave empty if layers.music is false",
        "ambienceLayer": "Constant background texture description (e.g. Heavy Rain on Roof, Spaceship Hum, Forest Wind) - Leave empty if layers.ambience is false",
        "keySoundEffects": ["SFX1", "SFX2"],
        "tempo": "e.g. 60 BPM"
    },
    "visualStyle": {
        "artStyle": "Style",
        "colorPalette": ["Color1", "Color2"],
        "coverConcept": "Visual description"
    }
}`;

        const response = await callClaude(systemPrompt, userPrompt, 2000);

        // Extract JSON
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to generate valid JSON concept');
        }

        try {
            const concept = JSON.parse(jsonMatch[0]) as StoryConcept;
            // Inject user preference logic (Safety Override)
            concept.intendedDuration = duration;
            concept.mixLevel = mixLevel;

            if (options.title) concept.title = options.title;
            if (options.generationMode) concept.generationMode = options.generationMode;
            if (options.pacingMode) concept.pacingMode = options.pacingMode as any;
            if (options.warmupDuration !== undefined) concept.warmupDuration = options.warmupDuration;
            if (options.ambiencePrompt) concept.audioIdentity = { ...concept.audioIdentity, ambienceLayer: options.ambiencePrompt };

            console.log(`   ✨ Concept Born: "${concept.title}"`);
            return concept;
        } catch (e) {
            console.error('JSON Parse Error:', e);
            console.error('Raw Output:', response);
            throw new Error('Failed to parse concept JSON');
        }
    }
}
