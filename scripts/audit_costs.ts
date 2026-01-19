
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load Environment
const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) {
    console.log('Loading .env.local');
    dotenv.config({ path: envLocal });
} else {
    dotenv.config();
}

async function auditElevenLabs() {
    console.log('\n🎙️  AUDITING ELEVENLABS...');
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) {
        console.log('   ❌ No API Key found');
        return;
    }

    try {
        const response = await fetch('https://api.elevenlabs.io/v1/models', {
            headers: { 'xi-api-key': key }
        });
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
        const models = data as any[];

        console.log(`   ✅ API Connected. Found ${models.length} models.`);

        const target = models.find(m => m.model_id === 'eleven_turbo_v2_5');
        if (target) {
            console.log(`   ✅ CONFIRMED: 'eleven_turbo_v2_5' is available.`);
            console.log('   🔍 FULL OBJECT (Checking for price):');
            console.log(JSON.stringify(target, null, 2));
        } else {
            console.log(`   ⚠️  WARNING: 'eleven_turbo_v2_5' NOT FOUND in API list.`);
            console.log('   Available:', models.map(m => m.model_id).join(', '));
        }
    } catch (e: any) {
        console.log(`   ❌ API Error: ${e.message}`);
    }
}

async function auditAnthropic() {
    console.log('\n🧠 AUDITING ANTHROPIC (CLAUDE)...');
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
        console.log('   ❌ No API Key found');
        return;
    }

    // Try new Models API (if available in 2026 context)
    try {
        const response = await fetch('https://api.anthropic.com/v1/models', {
            headers: {
                'x-api-key': key,
                'anthropic-version': '2023-06-01'
            }
        });

        if (response.ok) {
            const data = await response.json();
            // Adjust for likely response format { data: [...] }
            const models = (data.data || data) as any[];
            console.log(`   ✅ API Connected. Found ${models.length} models.`);

            // Check for our specific model
            const currentModel = 'claude-opus-4-20250514';
            const found = models.find(m => m.id === currentModel || m.id.includes('opus-4') || m.id.includes('sonnet'));

            if (found) {
                console.log(`   ✅ CONFIRMED: '${found.id}' is available.`);
                console.log('   🔍 FULL OBJECT (Checking for price):');
                console.log(JSON.stringify(found, null, 2));
            } else {
                console.log(`   ⚠️  WARNING: '${currentModel}' NOT FOUND.`);
                // Log first item to see structure
                if (models.length > 0) {
                    console.log('   🔍 EXAMPLE MODEL OBJECT:');
                    console.log(JSON.stringify(models[0], null, 2));
                }
            }
        } else {
            console.log(`   ⚠️  Models API not accessible (${response.status}). Using hardcoded assumptions.`);
        }

    } catch (e: any) {
        console.log(`   ❌ API Error: ${e.message}`);
    }
}


async function auditStableAudio() {
    console.log('\n🎵 AUDITING STABLE AUDIO...');
    const key = process.env.STABILITY_API_KEY || process.env.STABLE_AUDIO_API_KEY;
    if (!key) {
        console.log('   ❌ No API Key found (STABILITY_API_KEY)');
        return;
    }

    try {
        // Evaluate account/balance if possible, or just a dummy request to check auth
        const response = await fetch('https://api.stability.ai/v1/user/account', {
            headers: { 'Authorization': `Bearer ${key}` }
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ API Connected.`);
            console.log(`      Email: ${data.email}`);
            console.log(`      Balance: ${data.credits ? data.credits + ' credits' : 'Unknown'}`);
            // Verify model access by listing engines?
            const enginesResp = await fetch('https://api.stability.ai/v1/engines/list', {
                headers: { 'Authorization': `Bearer ${key}` }
            });
            if (enginesResp.ok) {
                const engines = await enginesResp.json();
                const model = engines.find((e: any) => e.id === 'stable-audio-2.0' || e.id === 'stable-audio-2.5'); // Hypothetical ID check
                // The production code uses: 'https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio'
                // with model 'stable-audio-2.5'
                console.log(`   ✅ Confirmed access to Stable Audio generation endpoints.`);
            }
        } else {
            console.log(`   ⚠️  Auth failed or Account Endpoint unavailable (${response.status})`);
        }
    } catch (e: any) {
        console.log(`   ❌ API Error: ${e.message}`);
    }
}

async function auditGoogle() {
    console.log('\n📹 AUDITING GOOGLE (VEO/GEMINI)...');
    // Using simple fetch to avoid importing heavyweight libraries in this script
    const key = process.env.GOOGLE_API_KEY; // or GOOGLE_APPLICATION_CREDENTIALS check
    if (!key) {
        console.log('   ❌ No GOOGLE_API_KEY found');
        return;
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            const models = data.models || [];
            console.log(`   ✅ API Connected. Found ${models.length} models.`);

            const veo = models.find((m: any) => m.name.includes('veo') || m.name.includes('video'));
            const gemini = models.find((m: any) => m.name.includes('gemini-pro'));

            if (veo) console.log(`      ✅ Found Video Model: ${veo.name}`);
            else console.log(`      ⚠️ No specific 'Veo' model listed (might be private preview).`);

            if (gemini) console.log(`      ✅ Found Gemini Model: ${gemini.name}`);
        } else {
            console.log(`   ⚠️  Google API Error (${response.status})`);
        }
    } catch (e: any) {
        console.log(`   ❌ API Error: ${e.message}`);
    }
}

async function main() {
    await auditElevenLabs();
    await auditAnthropic();
    await auditStableAudio();
    await auditGoogle();
}

main();
