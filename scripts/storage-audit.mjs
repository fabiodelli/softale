#!/usr/bin/env node
/**
 * Softale Storage Audit
 *
 * Usage:
 *   node scripts/storage-audit.mjs                  → dry-run (report + orphans.txt)
 *   node scripts/storage-audit.mjs --backup          → backup all files to ~/softale-backup-YYYYMMDD/
 *   node scripts/storage-audit.mjs --delete-orphans  → delete files listed in orphans.txt (Phase 3)
 *
 * NEVER contains hardcoded keys — reads from .env.local at repo root.
 */

import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Load .env.local via dotenv (available in project node_modules)
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
dotenv.config({ path: path.join(ROOT, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY mancanti in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Bucket da auditare
const BUCKETS = ['audio', 'covers'];

// File di sistema nel bucket audio — esclusi dall'audit orfani
const SYSTEM_PREFIXES_AUDIO = ['ambient/'];

// Colonne URL per bucket
const URL_COLUMNS = {
  audio:  ['audio_url', 'voice_url', 'music_url', 'ambient_url'],
  covers: ['cover_url', 'cover_landscape_url', 'cover_portrait_url'],
};

// ─── Utility: lista ricorsiva file in un bucket ───────────────────────────────
async function listBucketFiles(bucket, prefix = '') {
  const files = [];
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw new Error(`Storage list error (${bucket}/${prefix}): ${error.message}`);
  if (!data) return files;

  const fileItems = data.filter(f => f.id !== null);
  const folders   = data.filter(f => f.id === null);

  for (const f of fileItems) {
    const filePath = prefix ? `${prefix}/${f.name}` : f.name;
    files.push({ path: filePath, size: f.metadata?.size || 0 });
  }
  for (const folder of folders) {
    const subPath = prefix ? `${prefix}/${folder.name}` : folder.name;
    files.push(...await listBucketFiles(bucket, subPath));
  }
  return files;
}

// ─── Utility: estrae il path nel bucket da un URL pubblico completo ───────────
function urlToBucketPath(url, bucket) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const doBackup        = args.includes('--backup');
const doDeleteOrphans = args.includes('--delete-orphans');

console.log('\n🔍 Softale Storage Audit');
console.log('========================\n');

// ── 1. Lista tutti i file nei bucket ─────────────────────────────────────────
console.log('📦 Listando file nei bucket...');
const bucketFiles = {};
for (const bucket of BUCKETS) {
  process.stdout.write(`  ${bucket}...`);
  bucketFiles[bucket] = await listBucketFiles(bucket);
  const sizeMB = (bucketFiles[bucket].reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(1);
  console.log(` ${bucketFiles[bucket].length} file, ${sizeMB} MB`);
}

// ── 2. Carica storie dal DB ──────────────────────────────────────────────────
console.log('\n📊 Caricando tabella stories...');
const { data: stories, error: storiesErr } = await supabase
  .from('stories')
  .select('id, title, slug, ' + [...URL_COLUMNS.audio, ...URL_COLUMNS.covers].join(', '));
if (storiesErr) { console.error('❌ DB error:', storiesErr.message); process.exit(1); }
console.log(`  ${stories.length} righe trovate`);

// ── 3. Costruisce set path referenziati per bucket ───────────────────────────
const referenced = { audio: new Set(), covers: new Set() };

for (const story of stories) {
  for (const bucket of BUCKETS) {
    for (const col of URL_COLUMNS[bucket]) {
      const p = urlToBucketPath(story[col], bucket);
      if (p) referenced[bucket].add(p);
    }
  }
}

// ── 4. Calcola ORFANI, IN USO, FILE DI SISTEMA, REFERENZE ROTTE ──────────────
const systemFiles = bucketFiles.audio.filter(f =>
  SYSTEM_PREFIXES_AUDIO.some(prefix => f.path.startsWith(prefix))
);
const systemPaths = new Set(systemFiles.map(f => f.path));

const orphans = { audio: [], covers: [] };
const inUse   = { audio: [], covers: [] };

for (const bucket of BUCKETS) {
  for (const file of bucketFiles[bucket]) {
    if (bucket === 'audio' && systemPaths.has(file.path)) continue; // skip system
    if (referenced[bucket].has(file.path)) {
      inUse[bucket].push(file);
    } else {
      orphans[bucket].push(file);
    }
  }
}

// Referenze rotte (DB punta a path inesistente nel bucket)
const brokenRefs = [];
for (const bucket of BUCKETS) {
  const bucketPathSet = new Set(bucketFiles[bucket].map(f => f.path));
  for (const p of referenced[bucket]) {
    if (!bucketPathSet.has(p)) brokenRefs.push({ bucket, path: p });
  }
}

// ── 5. Stampa report ─────────────────────────────────────────────────────────
const mb = bytes => (bytes / 1024 / 1024).toFixed(1) + ' MB';
const sumMB = files => mb(files.reduce((s, f) => s + f.size, 0));

console.log('\n══════════════════════════════════════════════════════');
console.log('📋  REPORT DRY-RUN');
console.log('══════════════════════════════════════════════════════\n');

for (const bucket of BUCKETS) {
  const total = bucketFiles[bucket];
  console.log(`Bucket "${bucket}":`);
  console.log(`  Totale nel bucket : ${total.length} file  (${sumMB(total)})`);
  if (bucket === 'audio') {
    console.log(`  File di sistema   : ${systemFiles.length} file (audio/ambient/ — esclusi)`);
  }
  console.log(`  In uso            : ${inUse[bucket].length} file`);
  console.log(`  Orfani            : ${orphans[bucket].length} file  (${sumMB(orphans[bucket])})`);
  console.log('');
}

const totalOrphanFiles = orphans.audio.length + orphans.covers.length;
const totalOrphanBytes = [...orphans.audio, ...orphans.covers].reduce((s, f) => s + f.size, 0);
const totalUsedBytes   = [...inUse.audio, ...inUse.covers, ...systemFiles].reduce((s, f) => s + f.size, 0);

console.log(`Spazio attualmente occupato  : ${mb([...bucketFiles.audio, ...bucketFiles.covers].reduce((s, f) => ({ size: s.size + f.size }), { size: 0 }))}`);
console.log(`Spazio in uso (referenziato) : ${mb(totalUsedBytes)}`);
console.log(`Spazio orfani recuperabile   : ${mb(totalOrphanBytes)}  (${totalOrphanFiles} file)`);

if (brokenRefs.length > 0) {
  console.log(`\n⚠️  Referenze rotte nel DB (${brokenRefs.length}):`);
  brokenRefs.forEach(r => console.log(`   [${r.bucket}] ${r.path}`));
}

// ── 6. Salva orphans.txt ─────────────────────────────────────────────────────
const orphanLines = [
  `# Softale Storage Orphans — generato il ${new Date().toISOString()}`,
  `# Formato: <bucket> TAB <path> TAB <size MB>`,
  `# AUDIO (${orphans.audio.length} file, ${sumMB(orphans.audio)})`,
  ...orphans.audio.map(f => `audio\t${f.path}\t${(f.size/1024/1024).toFixed(2)} MB`),
  '',
  `# COVERS (${orphans.covers.length} file, ${sumMB(orphans.covers)})`,
  ...orphans.covers.map(f => `covers\t${f.path}\t${(f.size/1024/1024).toFixed(2)} MB`),
];
const orphansPath = path.join(__dirname, 'orphans.txt');
writeFileSync(orphansPath, orphanLines.join('\n'), 'utf-8');
console.log(`\n✅ Elenco orfani → scripts/orphans.txt`);

// ── 7. BACKUP (--backup) ─────────────────────────────────────────────────────
if (doBackup) {
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const backupDir = path.join(os.homedir(), `softale-backup-${dateStr}`);
  console.log(`\n💾 BACKUP → ${backupDir}`);
  console.log('   (può richiedere diversi minuti per ~952 MB)\n');

  for (const bucket of BUCKETS) {
    let done = 0;
    const total = bucketFiles[bucket].length;
    for (const file of bucketFiles[bucket]) {
      const dest = path.join(backupDir, bucket, file.path);
      const destDir = path.dirname(dest);
      if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
      if (!existsSync(dest)) {
        const { data, error } = await supabase.storage.from(bucket).download(file.path);
        if (error) { console.error(`  ❌ ${file.path}: ${error.message}`); continue; }
        writeFileSync(dest, Buffer.from(await data.arrayBuffer()));
      }
      done++;
      if (done % 25 === 0 || done === total) {
        process.stdout.write(`\r  ${bucket}: ${done}/${total} file`);
      }
    }
    console.log(`\n  ✅ ${bucket}: ${done} file scaricati`);
  }

  // DB dump
  const dbDump = stories.map(s => JSON.stringify(s)).join('\n');
  writeFileSync(path.join(backupDir, 'stories-dump.jsonl'), dbDump, 'utf-8');
  // File list
  const fileList = BUCKETS.flatMap(b => bucketFiles[b].map(f => `${b}\t${f.path}\t${(f.size/1024/1024).toFixed(2)} MB`));
  writeFileSync(path.join(backupDir, 'file-inventory.txt'), fileList.join('\n'), 'utf-8');

  const backupSizeBytes = [...bucketFiles.audio, ...bucketFiles.covers].reduce((s,f) => s + f.size, 0);
  console.log(`\n✅ Backup completo`);
  console.log(`   Percorso : ${backupDir}`);
  console.log(`   Dimensione attesa : ~${mb(backupSizeBytes)}`);
  console.log(`   File scaricati : ${BUCKETS.reduce((s, b) => s + bucketFiles[b].length, 0)}`);
}

// ── 8. DELETE ORPHANS (--delete-orphans) ─────────────────────────────────────
if (doDeleteOrphans) {
  const orphansFilePath = path.join(__dirname, 'orphans.txt');
  if (!existsSync(orphansFilePath)) {
    console.error('❌ scripts/orphans.txt non trovato. Eseguire prima il dry-run.');
    process.exit(1);
  }

  // Rilegge orphans.txt per cancellare esattamente ciò che è stato approvato
  const lines = readFileSync(orphansFilePath, 'utf-8').split('\n')
    .filter(l => !l.startsWith('#') && l.trim() !== '');
  const toDelete = { audio: [], covers: [] };
  for (const line of lines) {
    const [bucket, filePath] = line.split('\t');
    if (bucket && filePath && BUCKETS.includes(bucket)) {
      toDelete[bucket].push(filePath.trim());
    }
  }

  console.log('\n🗑️  CANCELLAZIONE ORFANI');
  console.log(`   audio : ${toDelete.audio.length} file`);
  console.log(`   covers: ${toDelete.covers.length} file\n`);

  const BATCH = 20;
  for (const bucket of BUCKETS) {
    const paths = toDelete[bucket];
    for (let i = 0; i < paths.length; i += BATCH) {
      const batch = paths.slice(i, i + BATCH);
      const { error } = await supabase.storage.from(bucket).remove(batch);
      if (error) {
        console.error(`  ❌ Errore batch ${bucket} [${i}–${i+BATCH}]:`, error.message);
      } else {
        console.log(`  ✅ [${bucket}] eliminati ${batch.length} file (batch ${Math.floor(i/BATCH)+1})`);
        batch.forEach(p => console.log(`      - ${p}`));
      }
    }
  }
  console.log('\n✅ Cancellazione orfani completata. Rieseguire senza flag per verificare lo stato finale.');
}
