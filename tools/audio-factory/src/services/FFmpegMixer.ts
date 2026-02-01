import ffmpegPath from 'ffmpeg-static';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execPromise = promisify(exec);

export interface MixOptions {
    outputPath: string;
    duration: number; // Total duration in seconds
    warmupDuration: number;
    fadeDuration?: number; // Fade in/out for backing
}

export interface VoiceSegment {
    path: string;
    startTime: number; // Seconds from start (0 = start of story, usually after warmup)
    duration?: number;
}

export interface MixResult {
    success: boolean;
    mixedPath: string;
    voiceStemPath?: string; // The full-length voice track (for separate upload)
    error?: string;
}

export class FFmpegMixer {
    private workingDir: string;

    constructor(outputDir: string) {
        this.workingDir = outputDir;
    }

    /**
     * The Master Studio Mix function.
     * Creates a broadcast-quality mix with Sidechain Ducking and Loudness Normalization.
     */
    async createStudioMix(
        voiceSegments: VoiceSegment[],
        musicLoopPath: string | null,
        ambienceLoopPath: string | null,
        options: MixOptions
    ): Promise<MixResult> {
        console.log(`🎛️ FFmpegMixer: Creating Studio Mix (${options.duration}s)...`);

        const timestamp = Date.now();
        const mixedPath = path.join(this.workingDir, `studio_mix_${timestamp}.mp3`);
        const voiceStemPath = path.join(this.workingDir, `stem_voice_${timestamp}.mp3`);

        // 1. Prepare Inputs
        const inputs: string[] = [];
        let filterComplex = '';
        let inputIdx = 0;

        // --- INPUT 0: Voice Segments (We implicitly build this via complex filter "adelay") ---
        // Actually, for complex mixing, it is SAFER and CLEANER to first render the Voice Stem
        // physically. This ensures the "Voice Stem" we upload is IDENTICAL to what drives the sidechain.

        try {
            console.log('   🎤 Rendering Voice Stem (Concat)...');
            await this.renderVoiceTrack(voiceSegments, options.duration, voiceStemPath);

            if (fs.existsSync(voiceStemPath)) {
                const stats = fs.statSync(voiceStemPath);
                console.log(`      ✅ Voice Stem Created: ${stats.size} bytes`);
                if (stats.size < 1000) console.warn("      ⚠️ Voice stem is surprisingly small!");
            } else {
                console.error("      ❌ Voice Stem File NOT FOUND after render!");
                throw new Error("Voice Stem generation failed silently.");
            }

            // Now use this rendered voice stem as Input 0
            inputs.push(`-i "${voiceStemPath}"`); // [0:a]
            inputIdx++;

        } catch (e: any) {
            return { success: false, mixedPath: '', error: `Voice Render Failed: ${e.message}` };
        }

        // --- INPUT 1: Music (Loop) ---
        if (musicLoopPath && fs.existsSync(musicLoopPath)) {
            inputs.push(`-stream_loop -1 -i "${musicLoopPath}"`); // [1:a]
            inputIdx++;
        } else {
            inputs.push(`-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100`); // Silent placeholder
            inputIdx++;
        }

        // --- INPUT 2: Ambience (Loop) ---
        if (ambienceLoopPath && fs.existsSync(ambienceLoopPath)) {
            inputs.push(`-stream_loop -1 -i "${ambienceLoopPath}"`); // [2:a]
            inputIdx++;
        } else {
            inputs.push(`-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100`);
            inputIdx++;
        }

        // 2. Build Filter Graph
        // [0:a] = Voice Stem (Already aligned)
        // [1:a] = Music Loop
        // [2:a] = Ambience Loop

        // A. Process Voice (Master Control)
        // Ensure it's stereo for mixing, normalized to -14 LUFS
        // We MUST split the voice stream because it's used twice: 
        // 1. As the sidechain trigger
        // 2. In the final mix
        filterComplex += `[0:a]loudnorm=I=-14:TP=-1.5:LRA=11,asplit[voice_sc][voice_mix];`;

        // B. Process Backing (Music + Ambience)
        // Mix them together first
        filterComplex += `[1:a][2:a]amix=inputs=2:duration=first:weights=0.8 0.6[backing_raw];`;

        // Normalize Backing to -24 LUFS (Background level)
        // We trim it to exact duration here to avoid infinite loops
        filterComplex += `[backing_raw]atrim=0:${options.duration},loudnorm=I=-22:TP=-1.5:LRA=7[backing_norm];`;

        // C. SIDECHAIN DUCKING 🦆
        // Use [voice_sc] to duck the Backing [backing_norm]
        // Threshold: 0.125 (-18dB) -> duck when voice is present
        // Ratio: 4 (heavy compression)
        // Attack: 200ms (slow fade out)
        // Release: 1500ms (very slow fade back in for swell effect)
        filterComplex += `[backing_norm][voice_sc]sidechaincompress=threshold=0.1:ratio=5:attack=200:release=2000[backing_ducked];`;

        // D. Final Mix
        // Combine Voice [voice_mix] and Ducked Backing
        // We use volume=2 for voice to ensure it cuts through, relying on loudnorm to keep it in check first
        filterComplex += `[backing_ducked][voice_mix]amix=inputs=2:duration=first:weights=1 1[out_master]`;

        // 3. Execute
        // Ensure inputs are mapped correctly. 
        // [0:a] is the FIRST input file (Voice Stem)
        // [1:a] is Music
        // [2:a] is Ambience

        // Debug inputs
        console.log('   🛠️ FFmpeg Inputs:', inputs);
        console.log('   🛠️ Filter Graph:', filterComplex);

        const cmd = `"${ffmpegPath}" -y ${inputs.join(' ')} -filter_complex "${filterComplex}" -map "[out_master]" -t ${options.duration} -ac 2 "${mixedPath}"`;

        try {
            await execPromise(cmd);
            console.log('   ✅ Studio Mix Complete');
            return {
                success: true,
                mixedPath,
                voiceStemPath
            };
        } catch (e: any) {
            console.error('   ❌ Mixer Error:', e.stderr || e.message);
            return { success: false, mixedPath: '', error: e.message };
        }
    }

    /**
     * Renders just the voice segments into a proper timeline with silence.
     * This is needed for:
     * 1. Driving the sidechain processor
     * 2. Uploading as the "Voice Stem" for client-side mixing
     */
    private async renderVoiceTrack(segments: VoiceSegment[], totalDuration: number, outPath: string): Promise<void> {
        // We use the complex "adelay" filter to place clips in time
        // Input: N voice files
        // Output: 1 Mixed file of length totalDuration

        const inputs: string[] = [];
        let filter = '';

        // Add all segments as inputs
        segments.forEach((seg, i) => {
            inputs.push(`-i "${seg.path}"`);
            // Delay is in milliseconds
            const delay = Math.round(seg.startTime * 1000);
            // [i:a]adelay=X|X[vX]  (Status: Stereo delay)
            filter += `[${i}:a]adelay=${delay}|${delay}[v${i}];`;
        });

        // Mix all delayed segments
        // We use amix with N inputs
        // Note: amix causes volume drop (1/N) by default unless we handle weights, 
        // but since they don't overlap (usually), we can use 'dropout_transition=0'
        // A better approach for non-overlapping clips is using the `concat` filter with generated silence,
        // BUT `adelay` + `amix` is more robust for cross-fading or slight overlaps.
        // To fix volume drop: amix=inputs=N:dropout_transition=0,volume=N 
        // OR better: use `amix` then `loudnorm` in the main chain (which we do).

        // However, standard amix attenuates drastically with many inputs.
        // Hack: Use [v0][v1]amix, then [res][v2]amix... sequential mix is actually SAFER for volume 
        // IF we assume NO overlap. 
        // Actually, with `loudnorm` applied AFTER this render (in the main mix), volume loss here is fine.
        // We just need the relative dynamic range to be preserved.

        // Let's stick to amix=inputs=N but be careful of limits.
        // FFmpeg filter limits are high, but command line length isn't.

        let mixChain = '';
        segments.forEach((_, i) => mixChain += `[v${i}]`);
        filter += `${mixChain}amix=inputs=${segments.length}:dropout_transition=0:normalize=0[mixed_voice]`;

        // Pad to total duration using apad is tricky because amix ends at last sound.
        // We force duration in output command.

        const cmd = `"${ffmpegPath}" -y ${inputs.join(' ')} -filter_complex "${filter}" -map "[mixed_voice]" -t ${totalDuration} "${outPath}"`;

        await execPromise(cmd);
    }
}
