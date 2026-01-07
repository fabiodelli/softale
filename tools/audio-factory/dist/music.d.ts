import 'dotenv/config';
interface MusicGenerationParams {
    prompt: string;
    durationSeconds: number;
    outputPath: string;
}
export declare function generateStableAudio(params: MusicGenerationParams): Promise<string>;
export declare function getMusicPrompt(category: string, mood: string): string;
export {};
