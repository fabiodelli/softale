
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function safeCleanup() {
    console.log("🧹 STARTING SMART CLEANUP...");
    console.log("=========================================");

    // 1. Get Whitelist from DB
    const { data: stories } = await supabase.from('stories').select('audio_url, cover_url');
    const activeFiles = new Set<string>();

    stories?.forEach(s => {
        if (s.audio_url) activeFiles.add(extractPath(s.audio_url));
        if (s.cover_url) activeFiles.add(extractPath(s.cover_url));
    });

    console.log(`✅ Loaded ${activeFiles.size} active file references from DB.`);

    // 2. Scan Legacy Folder
    const { data: legacyItems } = await supabase.storage.from('audio').list('legacy', { limit: 100 });
    const toDelete: string[] = [];
    const kept: string[] = [];

    if (!legacyItems) {
        console.log("No legacy items found.");
        return;
    }

    for (const item of legacyItems) {
        const fullPath = `legacy/${item.name}`;

        // RULE 1: KEEP 'ambient' folder
        if (item.name === 'ambient') {
            console.log(`   🛡️  PRESERVED: ${fullPath} (Ambient Folder)`);
            kept.push(fullPath);
            continue;
        }

        // RULE 2: DELETE 'loops' folder (recursive contents)
        if (item.name === 'loops') {
            // We need to list inside to delete files, or delete folder if Supabase supports it (usually requires empty)
            // Let's list deep
            const loopFiles = await listDeep('audio', 'legacy/loops');
            if (loopFiles.length > 0) {
                console.log(`   🗑️  TARGETED: 'legacy/loops' (${loopFiles.length} files)`);
                toDelete.push(...loopFiles);
            }
            continue;
        }

        // RULE 3: CHECK Root Files against DB
        if (item.id) { // It is a file
            // Check if full path (bucket/path) is in active set?
            // My activeFiles set is 'legacy/...' (from extractPath)? 
            // Let's normalize. extractPath returns 'audio/legacy/file.mp3' or 'legacy/file.mp3'?

            // Supabase URLs usually: .../audio/legacy/file.mp3
            // My extract helper earlier returned the relative path inside bucket ideally.
            // Let's verify matches carefully.

            // DB URL: .../object/public/audio/legacy/file.mp3
            // Bucket: audio
            // File Path: legacy/file.mp3

            const matchesDB = CheckIfInUsage(activeFiles, 'audio', fullPath);

            if (matchesDB) {
                console.log(`   🛡️  PRESERVED: ${fullPath} (Used in DB)`);
                kept.push(fullPath);
            } else {
                console.log(`   🗑️  TARGETED: ${fullPath} (Orphan)`);
                toDelete.push(fullPath);
            }
        }
    }

    // 3. EXECUTE DELETE
    if (toDelete.length > 0) {
        console.log(`\n⚠️  DELETING ${toDelete.length} FILES IN 5 SECONDS... (CTRL+C to cancel)`);
        await new Promise(r => setTimeout(r, 5000));

        // Delete in chunks of 50
        for (let i = 0; i < toDelete.length; i += 50) {
            const chunk = toDelete.slice(i, i + 50);
            const { error } = await supabase.storage.from('audio').remove(chunk);
            if (error) console.error("Error deleting chunk:", error.message);
            else console.log(`   💥 Deleted ${chunk.length} files.`);
        }
    } else {
        console.log("\n✨ No files to delete.");
    }

    console.log("=========================================");
    console.log("🏁 CLEANUP COMPLETE");
}

// Helpers
function extractPath(url: string | null): string {
    if (!url) return '';
    const parts = url.split('/object/public/audio/');
    // If it was in 'audio' bucket.
    if (parts.length > 1) return parts[1]; // returns 'legacy/file.mp3'
    return '';
}

function CheckIfInUsage(activeSet: Set<string>, bucket: string, path: string): boolean {
    // Exact match
    return activeSet.has(path);
}

async function listDeep(bucket: string, prefix: string): Promise<string[]> {
    const { data } = await supabase.storage.from(bucket).list(prefix, { limit: 100 });
    let paths: string[] = [];
    if (!data) return [];

    for (const item of data) {
        const full = `${prefix}/${item.name}`;
        if (item.id) paths.push(full);
        else {
            paths.push(...(await listDeep(bucket, full)));
        }
    }
    return paths;
}

safeCleanup();
