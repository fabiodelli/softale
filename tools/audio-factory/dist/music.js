import fs from 'fs/promises';
import 'dotenv/config';
export async function generateStableAudio(params) {
    const stabilityKey = process.env.STABILITY_API_KEY;
    if (!stabilityKey) {
        console.warn('⚠️ STABILITY_API_KEY not set. [DRY RUN MODE]');
        console.log(`   [SIMULATION] Would call Stable Audio with:`);
        console.log(`     - Prompt: "${params.prompt}"`);
        console.log(`     - Duration: ${params.durationSeconds}s`);
        // Return a dummy path so the pipeline continues as if music was made
        try {
            await fs.writeFile(params.outputPath, 'dummy mp3 content (dry run)');
        }
        catch (e) { }
        return params.outputPath;
    }
    console.log(`🎵 Generating Music (Stable Audio): "${params.prompt}" (${params.durationSeconds}s)...`);
    // Stable Audio 2.0 API Endpoint
    // Docs: https://platform.stability.ai/docs/api-reference#tag/Stable-Audio
    const url = 'https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio';
    try {
        const formData = new FormData();
        formData.append('prompt', params.prompt);
        formData.append('duration', params.durationSeconds.toString()); // Changed from seconds_total
        formData.append('model', 'stable-audio-2.5'); // Use latest 2.5 model
        // Negative prompt to ensure clean instrumental AND seamless loops
        formData.append('negative_prompt', 'vocals, speech, singing, low quality, distortion, noise, sudden changes, abrupt endings, transients at start or end');
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${stabilityKey}`,
                Accept: 'audio/*', // Validation requires generic audio/*
            },
            body: formData,
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Stable Audio API Error (${response.status}): ${errorText}`);
        }
        const buffer = await response.arrayBuffer();
        await fs.writeFile(params.outputPath, Buffer.from(buffer));
        console.log(`✅ Music saved to: ${params.outputPath}`);
        return params.outputPath;
    }
    catch (error) {
        console.error('❌ Music Generation Failed:', error.message);
        // Fallback or rethrow? For now, we return empty string to allow pipeline to continue without music
        return '';
    }
}
// =====================================================
// Prompt Logic & Mappings
// =====================================================
export function getMusicPrompt(category, mood) {
    const basePrompts = {
        work_break: 'Lo-fi hip hop beat, dust and scratches, 80bpm, chill study beats, repetitive, no vocals, soft piano jazz samples',
        motivation: 'Cinematic orchestral build, inspiring strings, epic drums, heroic theme, Hans Zimmer style, uplifting, dynamic',
        kids: 'Playful orchestral, pizzicato strings, celeste, magical, Disney style background music, light and happy',
        sleep: '432Hz meditative drone, deep ambient pads, warm analog synth, slow attack, very reverb, sleep inducing, theta waves',
        meditation: 'Singing bowls, soft wind chimes, silence between notes, minimal ambient texture, healing frequency',
        fantasy: 'Ethereal harp, flute, mystical atmosphere, reverb, dungeon synth style but high quality, magical forest ambience',
        nature: 'Gentle acoustic guitar, slow picking, nature background blended, organic, wooden textures'
    };
    // Use the category prompt + the specific mood
    const base = basePrompts[category] || basePrompts.sleep;
    return `${base}, mood: ${mood}, high quality, stereo`;
}
