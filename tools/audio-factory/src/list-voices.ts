
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function listVoices() {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) {
        console.error("No API Key found");
        return;
    }

    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': key }
    });

    const data = await res.json();
    console.log("Found voices:", data.voices.length);

    data.voices.forEach((v: any) => {
        if (v.category !== 'premade') {
            console.log(`- ${v.name} (${v.voice_id}): ${JSON.stringify(v.labels)}`);
        }
    });
}

listVoices();
