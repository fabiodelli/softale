import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

// Usage: node mixer.js <outputFile> <voicePath> <musicPath> <ambiencePath> <voiceVol> <musicVol> <ambienceVol>
const args = process.argv.slice(2);
const [outputFile, voicePath, musicPath, ambiencePath, voiceVol, musicVol, ambienceVol] = args;

if (!outputFile) {
    console.error('Usage: node mixer.js <outputFile> <voicePath> <musicPath> <ambiencePath> <voiceVol> <musicVol> <ambienceVol>');
    process.exit(1);
}

const vVol = parseFloat(voiceVol) || 3.0;
const mVol = parseFloat(musicVol) || 0.1;
const aVol = parseFloat(ambienceVol) || 0.1;

console.log('🎛️ Mixing Audio...');
console.log(`   Voice: ${voicePath} (${vVol})`);
console.log(`   Music: ${musicPath} (${mVol})`);
console.log(`   Ambience: ${ambiencePath} (${aVol})`);

// Ensure output dir exists
const outDir = path.dirname(outputFile);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const cmd = ffmpeg();

// 1. Voice (Input 0)
if (voicePath && fs.existsSync(voicePath)) {
    cmd.input(voicePath);
} else {
    // Silent fallback if no voice
    cmd.input('anullsrc=channel_layout=stereo:sample_rate=44100').inputFormat('lavfi').duration(10);
}

// 2. Music (Input 1)
if (musicPath && fs.existsSync(musicPath)) {
    cmd.input(musicPath).inputOptions(['-stream_loop -1']); // Loop music
} else {
    cmd.input('anullsrc=channel_layout=stereo:sample_rate=44100').inputFormat('lavfi').duration(10);
}

// 3. Ambience (Input 2)
if (ambiencePath && fs.existsSync(ambiencePath)) {
    cmd.input(ambiencePath).inputOptions(['-stream_loop -1']); // Loop ambience
} else {
    cmd.input('anullsrc=channel_layout=stereo:sample_rate=44100').inputFormat('lavfi').duration(10);
}

// Complex Filter
// [0] = Voice, [1] = Music, [2] = Ambience
const filter = [
    `[1:a]volume=${mVol}[m]`,
    `[2:a]volume=${aVol}[a]`,
    `[0:a]volume=${vVol}[v]`,
    `[m][a]amix=inputs=2:duration=first:dropout_transition=2[backing]`, // Mix music+ambience
    `[backing][v]amix=inputs=2:duration=first:weights=1 1:dropout_transition=0[out]` // Add voice on top
];

cmd.complexFilter(filter)
    .map('[out]')
    .output(outputFile)
    .on('end', () => {
        console.log('✅ Mix Complete:', outputFile);
        process.exit(0);
    })
    .on('error', (err) => {
        console.error('❌ Mix Error:', err.message);
        process.exit(1);
    })
    .run();
