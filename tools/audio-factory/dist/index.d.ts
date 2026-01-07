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
export interface StoryBrief {
    title?: string;
    category: string;
    duration: number;
    theme?: string;
    description?: string;
    mood?: string;
    voiceStyle?: 'soft_female' | 'soft_male' | 'neutral';
    voiceId?: string;
    musicFile?: string;
}
export interface GeneratedScript {
    id?: string;
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
    musicFile?: string;
    backingCategory?: string;
    backingTitle?: string;
    backingCoverPrompt?: string;
    createdAt: string;
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
export declare const RECIPE_MATRIX: Record<string, {
    voice: boolean;
    backing: 'soundscape' | 'music' | 'frequency';
}>;
export declare const CATEGORY_WPM: Record<string, number>;
export declare const getTargetWordCount: (category: string, durationMinutes: number) => number;
export declare function generateScript(brief: StoryBrief): Promise<GeneratedScript>;
export declare function generateVoice(script: GeneratedScript): Promise<string>;
export declare function generateOrFetchLoop(script: GeneratedScript): Promise<string>;
export declare function generateCover(script: GeneratedScript): Promise<string>;
export declare function mixAudio(voicePath: string, loopPath: string, script: GeneratedScript): Promise<string>;
export declare function uploadStory(scriptOrId: GeneratedScript | string, audioPath?: string, coverPath?: string): Promise<string>;
