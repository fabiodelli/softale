import 'dotenv/config'; // Loads .env
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // Loads .env.local

async function checkElevenLabs(key: string) {
    console.log('\n🎙️ Checking ElevenLabs...');
    if (!key) return console.log('   ❌ Key Missing');
    try {
        const res = await fetch('https://api.elevenlabs.io/v1/user', {
            headers: { 'xi-api-key': key }
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const data = await res.json();
        const sub = data.subscription;
        const used = sub.character_count;
        const limit = sub.character_limit;
        const percent = ((used / limit) * 100).toFixed(1);
        console.log(`   ✅ OK | Tier: ${sub.tier} | Used: ${used}/${limit} (${percent}%)`);
        if (limit - used < 1000) console.log('   ⚠️ LOW QUOTA WARNING!');
    } catch (e: any) {
        console.log(`   ❌ ERROR: ${e.message}`);
    }
}

async function checkAnthropic(key: string) {
    console.log('\nbrain Checking Anthropic (Claude)...');
    if (!key) return console.log('   ❌ Key Missing');
    try {
        // Simple hello world
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': key,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307', // Cheap model for check
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Hi' }]
            })
        });

        if (res.status === 402) {
            console.log('   ❌ INSUFFICIENT FUNDS / CREDITS EXHAUSTED (402)');
            return;
        }
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`${res.status} - ${err}`);
        }
        console.log('   ✅ OK | API Responding');
    } catch (e: any) {
        console.log(`   ❌ ERROR: ${e.message}`);
    }
}

async function checkOpenAI(key: string) {
    console.log('\n🎨 Checking OpenAI (DALL-E)...');
    if (!key) return console.log('   ❌ Key Missing');
    try {
        const res = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${key}` }
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        console.log('   ✅ OK | API Responding');
    } catch (e: any) {
        console.log(`   ❌ ERROR: ${e.message}`);
    }
}

async function checkStableAudio(key: string) {
    console.log('\n🎵 Checking Stable Audio...');
    if (!key) return console.log('   ❌ Key Missing');
    // No easy quota endpoint, trying a dummy check or assuming format is valid
    console.log(`   ℹ️ Key present (${key.substring(0, 5)}...)`);
    // Skip actual generation to save money, assume ok if key strictly exists
    // Or try user endpoint if exists. v2beta doesn't list a user endpoint easily.
}

async function main() {
    console.log('🔎 DIAGNOSING API KEYS...');
    await checkElevenLabs(process.env.ELEVENLABS_API_KEY || '');
    await checkAnthropic(process.env.ANTHROPIC_API_KEY || '');
    await checkOpenAI(process.env.OPENAI_API_KEY || '');
    await checkStableAudio(process.env.STABILITY_API_KEY || process.env.STABLE_AUDIO_API_KEY || '');
}

main();
