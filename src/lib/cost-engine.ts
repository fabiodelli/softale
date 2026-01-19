
/**
 * SOFTALE COST ENGINE (2026)
 * Calculates estimated and actual costs for AI generation.
 */

export interface CostUsageReport {
    durationMinutes: number;
    wordCount: number;
    tokenUsage?: {
        claudeInput: number;
        claudeOutput: number;
    };
    imageCount?: number;
    audioGenCount?: number; // Stable Audio / Ambience loops
    videoGenCount?: number; // Veo
}

export interface CostBreakdown {
    total: number;
    currency: 'USD';
    details: {
        voice: number;
        script: number;
        images: number;
        audio_backing: number;
        video: number;
    };
    rates: typeof PRICING_RATES;
}

// 2026 PRICING REGISTRY (Hardcoded based on Audit)
export const PRICING_RATES = {
    // Anthropic Claude Opus 4.5
    CLAUDE_INPUT_PER_1M: 10.00,
    CLAUDE_OUTPUT_PER_1M: 40.00,

    // ElevenLabs Turbo v2.5 (50% of standard rate of ~$0.18/1k)
    // Standard: $0.18 per 1000 characters
    // Turbo Multiplier: 0.5
    // Effective: $0.09 per 1000 characters
    VOICE_TURBO_PER_1K_CHARS: 0.09,

    // OpenAI DALL-E 3 (HD Quality)
    IMAGE_DALLE_3_HD: 0.08, // Per image

    // Stable Audio 2.0
    AUDIO_GENERATION: 0.05, // Per track generation

    // Google Veo 2.0 (Estimated)
    VIDEO_GENERATION_60S: 2.50, // Per 60s video (Premium)
};

/**
 * Estimates cost BEFORE generation based on duration/inputs
 */
export function estimateStoryCost(
    durationMinutes: number,
    category: string,
    options: {
        includeVideo?: boolean;
        includeVoice?: boolean;
        includeImages?: boolean; // Cover + Backing
    } = {}
): CostBreakdown {
    // 1. Scripting (Approx 1500 tokens input, 2000 output for a standard story)
    // Scale slightly with duration
    const estInput = 2000 + (durationMinutes * 200);
    const estOutput = 1500 + (durationMinutes * 500);

    const scriptCost = (estInput / 1_000_000 * PRICING_RATES.CLAUDE_INPUT_PER_1M) +
        (estOutput / 1_000_000 * PRICING_RATES.CLAUDE_OUTPUT_PER_1M);

    // 2. Voice (Words to Chars)
    // Avg 140 WPM * 5 chars/word + 20% buffer
    const wpm = 140;
    const estWords = durationMinutes * wpm;
    const estChars = estWords * 6; // Safety buffer

    const isVoiceCategory = !['soundscape', 'binaural', 'music_instrumental'].includes(category);
    const useVoice = options.includeVoice !== false && isVoiceCategory;

    const voiceCost = useVoice
        ? (estChars / 1000 * PRICING_RATES.VOICE_TURBO_PER_1K_CHARS)
        : 0;

    // 3. Images (Cover + Landscape + Portrait = 3 images normally, but let's assume 3 for main + 3 for backing if new)
    // Standard flow: 3 variants for main story
    const imageCount = options.includeImages !== false ? 3 : 0;
    const imageCost = imageCount * PRICING_RATES.IMAGE_DALLE_3_HD;

    // 4. Audio Backing (Loop + Ambience)
    // Usually 1 loop + 1 ambience = 2 generations
    const audioGenCost = 2 * PRICING_RATES.AUDIO_GENERATION;

    // 5. Video
    const videoCost = options.includeVideo ? PRICING_RATES.VIDEO_GENERATION_60S : 0;

    return {
        total: Number((scriptCost + voiceCost + imageCost + audioGenCost + videoCost).toFixed(4)),
        currency: 'USD',
        details: {
            voice: Number(voiceCost.toFixed(4)),
            script: Number(scriptCost.toFixed(4)),
            images: Number(imageCost.toFixed(4)),
            audio_backing: Number(audioGenCost.toFixed(4)),
            video: Number(videoCost.toFixed(4)),
        },
        rates: PRICING_RATES
    };
}

/**
 * Calculates EXACT cost after generation using Usage Report
 */
export function calculateFinalCost(usage: CostUsageReport): CostBreakdown {
    // 1. Script
    const scriptCost = ((usage.tokenUsage?.claudeInput || 0) / 1_000_000 * PRICING_RATES.CLAUDE_INPUT_PER_1M) +
        ((usage.tokenUsage?.claudeOutput || 0) / 1_000_000 * PRICING_RATES.CLAUDE_OUTPUT_PER_1M);

    // 2. Voice
    // If exact char count known (we usually track words in usage.wordCount)
    const estChars = usage.wordCount * 5.5; // Avg 
    const voiceCost = (estChars / 1000 * PRICING_RATES.VOICE_TURBO_PER_1K_CHARS);

    // 3. Images
    const imageCost = (usage.imageCount || 3) * PRICING_RATES.IMAGE_DALLE_3_HD;

    // 4. Audio
    const audioCost = (usage.audioGenCount || 2) * PRICING_RATES.AUDIO_GENERATION;

    // 5. Video
    const videoCost = (usage.videoGenCount || 0) * PRICING_RATES.VIDEO_GENERATION_60S;

    return {
        total: Number((scriptCost + voiceCost + imageCost + audioCost + videoCost).toFixed(4)),
        currency: 'USD',
        details: {
            voice: Number(voiceCost.toFixed(4)),
            script: Number(scriptCost.toFixed(4)),
            images: Number(imageCost.toFixed(4)),
            audio_backing: Number(audioCost.toFixed(4)),
            video: Number(videoCost.toFixed(4)),
        },
        rates: PRICING_RATES
    };
}
