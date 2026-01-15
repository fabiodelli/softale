import dotenv from 'dotenv';
import fs from 'fs';
// We need checking for existsSync (sync) but usage of promises for mkdir/readFile
import { promises as fsPromises } from 'fs';
import { createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}
import { pipeline } from 'stream/promises';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// LOAD CENTRALIZED ENVIRONMENT
// We assume execution from project root or tool root, but we seek the centralized .env.local
const findRootEnv = () => {
    // Try current CWD
    let p = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(p)) return p;
    // Try up 2 levels (if running from tools/social-bot)
    p = path.resolve(__dirname, '../../../.env.local');
    if (fs.existsSync(p)) return p;
    return null;
};

const envPath = findRootEnv();
if (envPath) {
    console.log(`🔧 Social Bot loaded env from: ${envPath}`);
    dotenv.config({ path: envPath });
} else {
    dotenv.config(); // Fallback to default
}

async function main() {
    const args = process.argv.slice(2);
    const storyId = args[0];

    if (!storyId) {
        console.error('Usage: tsx src/index.ts <story_uuid>');
        process.exit(1);
    }

    console.log(`🎬 Social Bot: Generating Reel for ${storyId}...`);

    // 1. Setup Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase Keys");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Fetch Story Data
    const { data: story, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();

    if (error || !story) throw new Error("Story not found");

    console.log(`   Found: "${story.title}"`);
    console.log(`   Portrait: ${story.cover_portrait_url ? '✅' : '❌'}`);

    // 3. Prepare Assets
    const workDir = path.join(OUTPUT_DIR, storyId);
    await fsPromises.mkdir(workDir, { recursive: true });

    const imagePath = path.join(workDir, 'image.png');
    const audioPath = path.join(workDir, 'audio.mp3');
    const videoPath = path.join(workDir, 'reel.mp4');

    // Download Helper
    const download = async (url: string, dest: string) => {
        try {
            await fsPromises.access(dest);
            console.log(`   Skipping download (exists): ${path.basename(dest)}`);
            return;
        } catch {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch ${url}`);
            const stream = createWriteStream(dest);
            await pipeline(res.body as any, stream);
        }
    };

    console.log('   Downloading assets...');
    // Use portrait if available, else standard cover
    const imageUrl = story.cover_portrait_url || story.cover_url;
    if (!imageUrl) throw new Error("No cover image available");

    await Promise.all([
        download(imageUrl, imagePath),
        download(story.audio_url, audioPath)
    ]);

    // 4. Generate Video with FFmpeg (Dynamic Ken Burns Zoom)
    console.log('   Rendering 60s Reel with Ken Burns Effect...');

    // Zoom in slowly from 1.0 to 1.1 over 1800 frames (60s @ 30fps)
    // Scale ensures we stay at 720x1280
    // x/y ensure center zoom
    const zoomFilter = `zoompan=z='min(zoom+0.0005,1.2)':d=1800:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=720x1280`;

    await new Promise<void>((resolve, reject) => {
        ffmpeg()
            .input(imagePath)
            .inputOptions(['-loop 1']) // Loop image input indefinitely
            .input(audioPath)
            .audioCodec('aac')
            .videoCodec('libx264')
            .outputOptions([
                '-t 60',          // Duration 60s
                '-pix_fmt yuv420p', // Compatibility
                '-vf', `${zoomFilter},format=yuv420p`, // Apply Zoom + Format
                '-shortest'       // End if audio is shorter than 60s
            ])
            .save(videoPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(err));
    });

    console.log(`✅ Reel created: ${videoPath}`);

    // 5. Upload Reel to Supabase
    console.log('   Uploading to storage...');
    // 5. Upload Reel to Supabase
    console.log('   Uploading to storage...');
    const videoContent = await fsPromises.readFile(videoPath);

    // Determine Folder Path from Story Data
    // We need slug and created_at to match the Factory structure
    // If slug is missing (legacy), fallback to ID-based path
    let storagePath = storyId;
    if (story.slug && story.created_at) {
        const dateFolder = new Date(story.created_at).toISOString().split('T')[0];
        const safeSlug = story.slug.replace(/[^a-z0-9-]/g, '');
        storagePath = `${dateFolder}/${safeSlug}`;
    }

    const fileName = `${storagePath}/reel.mp4`;

    // Upload to 'social' bucket (Standardized)
    const { error: uploadError } = await supabase.storage
        .from('social') // Changed from social-content
        .upload(fileName, videoContent, {
            contentType: 'video/mp4',
            upsert: true
        });

    if (uploadError) {
        console.error('   ❌ Upload failed:', uploadError.message);
        // Don't exit, we still have the local file
    } else {
        const { data: { publicUrl } } = supabase.storage.from('social').getPublicUrl(fileName);
        console.log(`   🌍 Public URL: ${publicUrl}`);

        // 6. Update DB
        const { error: dbError } = await supabase
            .from('stories')
            .update({
                social_reel_url: publicUrl,
                social_status: 'generated'
            })
            .eq('id', storyId);

        if (dbError) console.error('   ❌ DB Update failed:', dbError.message);
        else console.log('   ✅ DB Updated: Status = generated');
    }
}

main().catch(console.error);
