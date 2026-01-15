
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load Environment Variables from local .env
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env.local');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("❌ Missing .env.local variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false }
});

async function listAllFiles(bucket: string, path = ''): Promise<string[]> {
    const { data, error } = await supabase.storage.from(bucket).list(path, { limit: 1000 });
    if (error) {
        console.error(`Error listing ${bucket}/${path}:`, error.message);
        return [];
    }

    let files: string[] = [];

    for (const item of data) {
        // If it has no 'id' but has 'name', it might be a folder (Supabase structure quirk)
        // Or check metadata. If it has 'id', it is a file.
        // Actually, supabase list returns folders with id=null usually.

        const fullPath = path ? `${path}/${item.name}` : item.name;

        if (!item.id) {
            // It's a folder, recurse
            const subFiles = await listAllFiles(bucket, fullPath);
            files = files.concat(subFiles);
        } else {
            files.push(fullPath);
        }
    }
    return files;
}

async function runAudit() {
    console.log("🔍 STARTING STORAGE AUDIT...");
    console.log("=========================================");

    // 1. Fetch ALL DB Stories to get active URLs
    const { data: stories, error } = await supabase.from('stories').select('audio_url, cover_url, cover_landscape_url, cover_portrait_url');

    if (error) {
        console.error("❌ Database Error:", error.message);
        return;
    }

    // Extract paths from URLs
    const activePaths = new Set<string>();
    let activeCount = 0;

    const extractPath = (url: string | null) => {
        if (!url) return;
        try {
            // URL format: https://.../storage/v1/object/public/bucket_name/path/to/file
            // We need 'bucket_name/path/to/file' or just 'path/to/file' depending on how we compare
            const parts = url.split('/storage/v1/object/public/');
            if (parts.length > 1) {
                // Returns: bucket_name/path/to/file
                return parts[1];
            }
        } catch (e) { return null; }
        return null;
    };

    stories.forEach(s => {
        [s.audio_url, s.cover_url, s.cover_landscape_url, s.cover_portrait_url].forEach(u => {
            const p = extractPath(u as string);
            if (p) {
                activePaths.add(p); // Format: bucket/folder/file
                activeCount++;
            }
        });
    });

    console.log(`✅ Found ${stories.length} stories with ${activeCount} active file references.`);

    // 2. Audit Buckets
    const buckets = ['audio', 'covers'];

    for (const bucket of buckets) {
        console.log(`\n📂 Scanning Bucket: '${bucket}'...`);
        const files = await listAllFiles(bucket);

        let keepCount = 0;
        let trashCount = 0;

        console.log(`   Found ${files.length} total files.`);

        for (const file of files) {
            const fullRef = `${bucket}/${file}`;
            const isDateFormatted = /^\d{4}-\d{2}-\d{2}\//.test(file);

            if (activePaths.has(fullRef)) {
                // In use by DB
                keepCount++;
                // console.log(`   ✅ KEEP (In DB): ${file}`);
            } else if (isDateFormatted) {
                // Not in DB, but is a recent artifact (date folder)
                // Maybe partial upload or draft
                console.log(`   ⚠️  ORPHAN (Date Structured): ${file}`);
                trashCount++; // Technically orphan, but maybe valuable? Mark as warning.
            } else {
                // Total garbage (no date folder, not in DB)
                console.log(`   🗑️  DELETE (Legacy/Junk): ${file}`);
                trashCount++;
            }
        }
        console.log(`   Summary for ${bucket}: ${keepCount} Active, ${trashCount} Orphans/Legacy`);
    }

    console.log("\n=========================================");
    console.log("🏁 AUDIT COMPLETE");
}

runAudit();
