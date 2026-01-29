/**
 * LocalTTSService v2.0
 * ====================
 * TypeScript client for the Qwen TTS API with Voice Library support.
 * 
 * Features:
 * - Voice Library: Use pre-defined voice embeddings for consistent output
 * - Voice Design: Fall back to generating new voices from prompts
 */

import * as fs from 'fs';
import * as path from 'path';

const QWEN_API_URL = process.env.QWEN_API_URL || 'http://localhost:8000';

// ============= VOICE LIBRARY MAPPING =============
// Map categories to the best voice from our library
const CATEGORY_TO_VOICE: Record<string, string> = {
    // Sleep stories
    'sleep': 'soft_female_en',

    // Meditation & Relaxation
    'meditation': 'meditation_female_en',
    'breathwork': 'meditation_male_en',

    // Kids stories
    'kids': 'narrator_female_en',

    // Fantasy & Adventure
    'fantasy': 'narrator_male_en',
    'adventure': 'narrator_male_en',

    // Nature & Soundscapes (usually no voice, but if needed)
    'nature': 'soft_male_en',

    // Default
    'default': 'soft_female_en',
};

// Voice descriptions for prompts to Claude
export const AVAILABLE_VOICES = [
    { id: 'soft_female_en', description: 'Soft, warm female. Perfect for sleep stories.' },
    { id: 'soft_male_en', description: 'Deep, calm male. Ideal for relaxation.' },
    { id: 'narrator_en', description: 'Professional narrator. Engaging storytelling.' },
    { id: 'narrator_female_en', description: 'Professional female narrator for fantasy and kids.' },
    { id: 'narrator_male_en', description: 'Deep, dramatic narrator for adventure tales.' },
    { id: 'meditation_female_en', description: 'Ultra-calm female for meditation.' },
    { id: 'meditation_male_en', description: 'Deep, zen-like male for breathwork.' },
    { id: 'whisper_female_en', description: 'Soft whisper for ASMR and deep sleep.' },
];

export function getVoiceForCategory(category: string): string {
    return CATEGORY_TO_VOICE[category.toLowerCase()] || CATEGORY_TO_VOICE['default'];
}

export function resolveVoiceId(id: string): string {
    // Map legacy/short codes to full IDs
    const map: Record<string, string> = {
        'soft_female': 'soft_female_en',
        'soft_male': 'soft_male_en',
        'narrator': 'narrator_en',
        'narrator_female': 'narrator_female_en',
        'narrator_male': 'narrator_male_en',
        'meditation': 'meditation_female_en',
        'kids': 'narrator_female_en'
    };
    return map[id] || id;
}

export interface GenerateOptions {
    text: string;
    voiceId?: string;         // Use specific voice from library
    category?: string;        // Auto-select voice based on category
    language?: string;
    outputPath: string;
}

export interface GenerateResult {
    success: boolean;
    path?: string;
    error?: string;
    duration?: number;
    voiceUsed?: string;
}

interface VoiceListItem {
    id: string;
    description: string;
    language: string;
}

/**
 * Check if the local Qwen API is available and get loaded voices
 */
export async function isQwenAvailable(): Promise<boolean> {
    try {
        const response = await fetch(`${QWEN_API_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });
        const data = await response.json();
        return data.status === 'ok' && data.clone_model === 'loaded';
    } catch {
        return false;
    }
}

/**
 * Get list of available voices from the server
 */
export async function getAvailableVoices(): Promise<VoiceListItem[]> {
    try {
        const response = await fetch(`${QWEN_API_URL}/voices`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });
        const data = await response.json();
        return data.voices || [];
    } catch {
        return [];
    }
}

/**
 * Generate audio using a voice from the library (RECOMMENDED)
 * This ensures consistent voice across all segments.
 */
export async function generateWithVoice(options: GenerateOptions): Promise<GenerateResult> {
    const {
        text,
        voiceId,
        category,
        language = 'English',
        outputPath
    } = options;

    // Determine which voice to use
    const rawVoice = voiceId || getVoiceForCategory(category || 'default');
    const voice = resolveVoiceId(rawVoice);
    const startTime = Date.now();

    try {
        console.log(`   [TTS] Voice: ${voice} | Text: "${text.substring(0, 40)}..."`);

        const response = await fetch(`${QWEN_API_URL}/generate_with_voice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                voice_id: voice,
                language,
                output_format: 'base64'
            }),
            signal: AbortSignal.timeout(300000) // 5 minutes for CPU
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Qwen API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.success || !data.audio_base64) {
            throw new Error(data.message || 'No audio generated');
        }

        // Decode and save
        const audioBuffer = Buffer.from(data.audio_base64, 'base64');
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, audioBuffer);

        const duration = (Date.now() - startTime) / 1000;
        console.log(`   [OK] ${outputPath} (${duration.toFixed(1)}s)`);

        return {
            success: true,
            path: outputPath,
            duration,
            voiceUsed: voice
        };

    } catch (error: any) {
        console.error(`   [ERROR] ${error.message}`);
        return {
            success: false,
            error: error.message,
            voiceUsed: voice
        };
    }
}

/**
 * Generate multiple audio segments with CONSISTENT voice
 * This is the main function for phased story generation.
 */
export async function generatePhasedWithVoice(
    phases: Array<{ id: number; text: string }>,
    voiceId: string,
    category: string,
    outputDir: string
): Promise<Map<number, string>> {
    const results = new Map<number, string>();

    // Use explicit voiceId or derive from category
    const rawVoice = voiceId || getVoiceForCategory(category);
    const voice = resolveVoiceId(rawVoice);

    console.log(`[TTS] Generating ${phases.length} phases with voice: "${voice}"`);

    for (const phase of phases) {
        const outputPath = path.join(outputDir, `phase_${phase.id}.wav`);

        const result = await generateWithVoice({
            text: phase.text,
            voiceId: voice,
            category,
            language: 'English',
            outputPath
        });

        if (result.success && result.path) {
            results.set(phase.id, result.path);
        } else {
            console.error(`   [WARN] Phase ${phase.id} failed: ${result.error}`);
        }
    }

    console.log(`[TTS] Completed: ${results.size}/${phases.length} phases`);
    return results;
}

// ============= LEGACY SUPPORT =============
// Keep old functions for backward compatibility

export interface VoiceInstruction {
    style: 'soft_male' | 'soft_female' | 'neutral' | string;
    emotion?: string;
    pace?: string;
}

const VOICE_INSTRUCTION_MAP: Record<string, string> = {
    'soft_male': 'Deep, calm male English voice. Reassuring and steady.',
    'soft_female': 'Soft, warm female English voice. Gentle and soothing.',
    'neutral': 'Professional neutral English voice. Clear and calm.',
    'narrator_male': 'Deep male narrator. Rich storytelling voice.',
    'narrator_female': 'Professional female narrator. Engaging and expressive.',
    'meditation': 'Ultra-calm meditation voice. Very slow with natural pauses.',
    'kids': 'Cheerful, playful voice for children. Enthusiastic but not excessive.',
};

export function getVoiceInstruction(style: string, category?: string): string {
    if (VOICE_INSTRUCTION_MAP[style]) {
        return VOICE_INSTRUCTION_MAP[style];
    }
    if (category) {
        switch (category) {
            case 'sleep':
            case 'meditation':
                return VOICE_INSTRUCTION_MAP['meditation'];
            case 'kids':
                return VOICE_INSTRUCTION_MAP['kids'];
            case 'fantasy':
            case 'nature':
                return VOICE_INSTRUCTION_MAP['narrator_male'];
            default:
                return VOICE_INSTRUCTION_MAP['neutral'];
        }
    }
    return style || VOICE_INSTRUCTION_MAP['neutral'];
}

/**
 * @deprecated Use generateWithVoice for consistent output
 */
export async function generateWithQwen(options: {
    text: string;
    instruction?: string;
    language?: string;
    outputPath: string;
}): Promise<GenerateResult> {
    console.warn('[DEPRECATED] generateWithQwen called - voice will vary. Use generateWithVoice instead.');

    const { text, instruction = VOICE_INSTRUCTION_MAP['neutral'], language = 'English', outputPath } = options;
    const startTime = Date.now();

    try {
        const response = await fetch(`${QWEN_API_URL}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, instruction, language, output_format: 'base64' }),
            signal: AbortSignal.timeout(300000)
        });

        if (!response.ok) {
            throw new Error(`Qwen API Error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success || !data.audio_base64) {
            throw new Error(data.message || 'No audio generated');
        }

        const audioBuffer = Buffer.from(data.audio_base64, 'base64');
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, audioBuffer);

        return { success: true, path: outputPath, duration: (Date.now() - startTime) / 1000 };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * @deprecated Use generatePhasedWithVoice for consistent output
 */
export async function generatePhasedWithQwen(
    phases: Array<{ id: number; text: string }>,
    voiceStyle: string,
    category: string,
    outputDir: string
): Promise<Map<number, string>> {
    console.warn('[DEPRECATED] generatePhasedWithQwen - redirecting to generatePhasedWithVoice');
    return generatePhasedWithVoice(phases, getVoiceForCategory(category), category, outputDir);
}
