
import { callClaude } from './index.js';

export interface StoryConcept {
    title: string;
    logline: string;
    category: string;
    theme?: string;
    mood?: string;
    targetAudience?: string;
    intendedDuration?: number; // User preference for build length (minutes)
    mixLevel?: number; // Background music volume (0.1 - 0.5)

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
    audioIdentity?: {
        voiceStyle?: 'soft_female' | 'soft_male' | 'neutral';
        voicePacing?: string;
        musicStyle?: string;
        keySoundEffects?: string[];
        tempo?: string;
    };
    visualStyle?: {
        artStyle?: string;
        colorPalette?: string[];
        coverConcept?: string;
    };
}

export class ConceptEngine {

    static async generate(idea: string, category: string, duration: number = 10, mixLevel: number = 0.25): Promise<StoryConcept> {
        console.log(`🧠 Concept Engine: Dreaming up "${idea}" (${category}, ${duration}min, mix=${mixLevel})...`);

        const systemPrompt = `You are the LEAD SHOWRUNNER for Softale, a premium audio storytelling studio.
Your job is to take a vague idea and expand it into a rich, detailed Creative Brief (Series Concept).

You do not write the script. You write the BIBLE that the scriptwriters will follow.
Focus on:
1. **Character Depth**: Give the protagonist a soul, a desire, and a flaw.
2. **World Building**: Specific sensory details (not generic).
3. **Emotional Arc**: A clear beginning, middle, and end.
4. **Audio Identity**: Specific instructions for sound designers.

CATEGORY GUIDELINES:
- **Sleep**: Low conflict, hypnotic, cozy, safe.
- **Kids**: Wondrous, safe, clear moral or emotional lesson.
- **Sci-Fi/Fantasy**: Vivid, imaginative, coherent lore.`;

        const userPrompt = `Develop a "${category}" series concept from this idea: "${idea}"

RETURN JSON OBJECT EXACTLY LIKE THIS:
{
    "title": "Title",
    "logline": "One sentence summary",
    "category": "${category}",
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
        "musicStyle": "Genre/Instruments",
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
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to generate valid JSON concept');
        }

        try {
            const concept = JSON.parse(jsonMatch[0]) as StoryConcept;
            // Inject user preference
            concept.intendedDuration = duration;
            concept.mixLevel = mixLevel;

            console.log(`   ✨ Concept Born: "${concept.title}"`);
            return concept;
        } catch (e) {
            console.error('JSON Parse Error:', e);
            console.error('Raw Output:', response);
            throw new Error('Failed to parse concept JSON');
        }
    }
}
