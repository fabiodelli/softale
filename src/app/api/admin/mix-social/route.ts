
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import stream from 'stream';

const pipeline = promisify(stream.pipeline);

// Configure FFmpeg Paths - Hardcoded to bypass Next.js virtual filesystem
// The ffmpeg-static and ffprobe-static modules return virtual paths like \ROOT\...
// We construct the real filesystem paths manually
const isWindows = process.platform === 'win32';
const ffmpegPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', isWindows ? 'ffmpeg.exe' : 'ffmpeg');
const ffprobePath = path.join(process.cwd(), 'node_modules', 'ffprobe-static', 'bin', isWindows ? 'win32' : process.platform, process.arch, isWindows ? 'ffprobe.exe' : 'ffprobe');

console.log("🔧 FFmpeg Real Path:", ffmpegPath);
console.log("🔧 FFprobe Real Path:", ffprobePath);
console.log("🔧 FFmpeg exists:", fs.existsSync(ffmpegPath));
console.log("🔧 FFprobe exists:", fs.existsSync(ffprobePath));

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);


// Helper to download file


// Helper to download file
async function downloadFile(url: string, destPath: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download: ${url}`);
    if (!res.body) throw new Error('No body');
    const fileStream = fs.createWriteStream(destPath);
    await pipeline(res.body as any, fileStream);
}

export async function POST(req: NextRequest) {
    // Temp paths
    const tempDir = path.join(os.tmpdir(), 'reverie-mixer');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const timestamp = Date.now();
    const videoPath = path.join(tempDir, `input_video_${timestamp}.mp4`);
    const audioPath = path.join(tempDir, `input_audio_${timestamp}.mp3`);
    const outputPath = path.join(tempDir, `output_reel_${timestamp}.mp4`);

    try {
        const { storyId, videoUrl } = await req.json();

        if (!storyId || !videoUrl) {
            return NextResponse.json({ error: 'Missing storyId or videoUrl' }, { status: 400 });
        }

        // Extract raw file path from videoUrl for cleanup later
        // URL format: https://...supabase.../storage/v1/object/public/social/raw/filename.mp4
        const rawFilePath = videoUrl.includes('/social/')
            ? videoUrl.split('/social/')[1]?.split('?')[0]
            : null;

        // 1. Fetch Story to get Audio URL
        const { data: story, error: storyError } = await supabaseAdmin
            .from('stories')
            .select('*')
            .eq('id', storyId)
            .single();

        if (storyError || !story) {
            return NextResponse.json({ error: 'Story not found' }, { status: 404 });
        }

        if (!story.audio_url) {
            return NextResponse.json({ error: 'Story has no audio_url' }, { status: 400 });
        }

        // 2. Download Files
        console.log(`⬇️ Downloading assets for "${story.title}"...`);
        await Promise.all([
            downloadFile(videoUrl, videoPath),
            downloadFile(story.audio_url, audioPath)
        ]);
        console.log('✅ Downloads complete.');

        // 3. Metadata Probe (Get duration)
        const getDuration = (filePath: string): Promise<number> => {
            return new Promise((resolve, reject) => {
                ffmpeg.ffprobe(filePath, (err, metadata) => {
                    if (err) reject(err);
                    else resolve(metadata.format.duration || 0);
                });
            });
        };

        const audioDuration = await getDuration(audioPath);
        console.log(`🎵 Audio Duration: ${audioDuration}s`);

        // 4. Mix with FFmpeg
        // Logic: Loop video to match audio duration (or cap at 60s for Reel?)
        // Usually Reels are short. Let's cap at 60s or audio length, whichever is shorter.
        const targetDuration = Math.min(audioDuration, 60);

        console.log(`🎬 Mixing Reel (Target: ${targetDuration}s)...`);

        // Watermark path - logo file in public assets
        const watermarkPath = path.join(process.cwd(), 'public', 'assets', 'softale-watermark.png');
        const hasWatermark = fs.existsSync(watermarkPath);
        console.log(`🏷️ Watermark available: ${hasWatermark}`);

        await new Promise<void>((resolve, reject) => {
            const command = ffmpeg()
                .input(videoPath)
                .inputOptions(['-stream_loop', '-1']); // Loop video infinitely

            // Add watermark input if available
            if (hasWatermark) {
                command.input(watermarkPath);
            }

            command.input(audioPath);

            // Build output options
            const outputOpts: string[] = [];

            if (hasWatermark) {
                // Complex filter: overlay watermark bottom-left with padding and scaling
                // [0:v] = looped video, [1:v] = watermark, [2:a] = audio
                outputOpts.push('-filter_complex',
                    '[1:v]scale=120:-1,format=rgba,colorchannelmixer=aa=0.85[wm];' +
                    '[0:v][wm]overlay=20:main_h-overlay_h-20[outv]'
                );
                outputOpts.push('-map', '[outv]');
                outputOpts.push('-map', '2:a:0');
            } else {
                outputOpts.push('-map', '0:v:0');
                outputOpts.push('-map', '1:a:0');
            }

            outputOpts.push(
                '-c:v', 'libx264',
                '-pix_fmt', 'yuv420p',
                '-shortest',
                `-t`, `${targetDuration}`,
                '-movflags', '+faststart'
            );

            command
                .outputOptions(outputOpts)
                .output(outputPath)
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run();
        });

        // 5. Upload Result
        console.log('⬆️ Uploading final reel...');
        const fileBuffer = fs.readFileSync(outputPath);
        const fileName = `reels/${story.id}_${Date.now()}.mp4`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from('social')
            .upload(fileName, fileBuffer, {
                contentType: 'video/mp4',
                upsert: true
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl: reelUrl } } = supabaseAdmin.storage
            .from('social')
            .getPublicUrl(fileName);

        // 6. Update Story
        await supabaseAdmin
            .from('stories')
            .update({
                social_reel_url: reelUrl,
                social_status: 'generated'
            })
            .eq('id', storyId);

        // 7. Cleanup - Local temp files
        try {
            fs.unlinkSync(videoPath);
            fs.unlinkSync(audioPath);
            fs.unlinkSync(outputPath);
        } catch (e) { console.error("Local cleanup error", e); }

        // 8. Cleanup - Remote raw file from storage
        if (rawFilePath) {
            console.log(`🧹 Cleaning up raw file: ${rawFilePath}`);
            await supabaseAdmin.storage.from('social').remove([rawFilePath]);
        }

        return NextResponse.json({ success: true, url: reelUrl });

    } catch (error: any) {
        console.error('Mixing failed:', error);

        // Cleanup local temp files on error
        try {
            if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (e) { console.error("Local cleanup error", e); }

        // Try to cleanup raw file on error too (extract from error context if possible)
        // Note: videoUrl might not be in scope here if json parsing failed, so we wrap in try
        try {
            const body = await req.clone().json().catch(() => null);
            if (body?.videoUrl) {
                const rawFilePath = body.videoUrl.includes('/social/')
                    ? body.videoUrl.split('/social/')[1]?.split('?')[0]
                    : null;
                if (rawFilePath) {
                    console.log(`🧹 Cleaning up raw file after error: ${rawFilePath}`);
                    await supabaseAdmin.storage.from('social').remove([rawFilePath]);
                }
            }
        } catch (cleanupErr) { console.error("Raw cleanup error", cleanupErr); }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
