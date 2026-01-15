
console.log("🏁 STARTING SCRIPT...");
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

console.log("📁 Loading Env...");
// Force load from .env.local in current directory (Project Root)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
console.log("✅ Env Loaded. Google Key Present?", !!process.env.GOOGLE_API_KEY);

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
console.log("📦 Modules Loaded.");

/**
 * SOCIAL VIDEO TEST SCRIPT (GOOGLE VEO 3.1)
 * Usage: npx tsx scripts/test-veo.ts <image_path> <prompt>
 * Env: GOOGLE_API_KEY required in .env.local
 */

const API_KEY = process.env.GOOGLE_API_KEY;

async function main() {
    console.log("🎬 Setting up Google Veo 3.1 Video Test...");

    if (!API_KEY) {
        console.error("❌ Error: GOOGLE_API_KEY is missing in .env.local");
        console.log("👉 Get one here: https://aistudio.google.com/app/apikey");
        process.exit(1);
    }

    const args = process.argv.slice(2);
    const imagePath = args[0];
    const prompt = args[1];

    if (!imagePath || !prompt) {
        console.error("❌ Usage: npx tsx scripts/test-veo.ts <absolute_image_path> \"Your prompt here\"");
        process.exit(1);
    }

    if (!fs.existsSync(imagePath)) {
        console.error(`❌ Image not found: ${imagePath}`);
        process.exit(1);
    }

    const fileManager = new GoogleAIFileManager(API_KEY);
    const genAI = new GoogleGenerativeAI(API_KEY);

    // 0. Debug: List Available Models
    console.log("🔍 Checking available models for this API Key...");
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();
        if (data.models) {
            console.log("   Found Models (filtering for 'video' or 'veo'):");
            const relevant = data.models.filter((m: any) =>
                m.name.includes('veo') || m.name.includes('video') || m.name.includes('gemini')
            );
            relevant.forEach((m: any) => console.log(`   - ${m.name.replace('models/', '')} (${m.supportedGenerationMethods?.join(', ')})`));
        } else {
            console.log("   Could not list models. Response:", JSON.stringify(data).substring(0, 200));
        }
    } catch (e) {
        console.error("   Failed to list models:", e);
    }

    // 1. Upload Image to Gemini
    console.log(`\n📤 Uploading image to Google AI Studio...`);
    const uploadResult = await fileManager.uploadFile(imagePath, {
        mimeType: "image/png",
        displayName: "Veo Test Input",
    });

    console.log(`   File Uploaded: ${uploadResult.file.uri}`);
    console.log(`   State: ${uploadResult.file.state}`);

    // Wait for processing if needed
    let file = await fileManager.getFile(uploadResult.file.name);
    while (file.state === "PROCESSING") {
        console.log("   Processing...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        file = await fileManager.getFile(uploadResult.file.name);
    }

    if (file.state === "FAILED") {
        console.error("❌ File processing failed.");
        process.exit(1);
    }

    // 2. Generate Video via REST API (predictLongRunning)
    // User requested Veo 2.0 explicitly
    const modelName = 'veo-2.0-generate-001';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predictLongRunning?key=${API_KEY}`;

    // Sanitize prompt (remove accidentally captured quotes from CLI)
    const cleanPrompt = prompt.replace(/^"|"$/g, '').trim();

    console.log(`🚀 Generating Video via REST [predictLongRunning]...`);
    console.log(`   Model: ${modelName}`);
    console.log(`   Prompt: "${cleanPrompt}"`);

    // Payload construction for Veo on Gemini API
    const payload = {
        instances: [
            {
                prompt: cleanPrompt,
                image: {
                    fileUri: uploadResult.file.uri,
                    mimeType: uploadResult.file.mimeType
                }
            }
        ]
    };

    try {
        const req = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const initialRes = await req.json();

        if (!req.ok) {
            console.error("❌ Request Failed:", JSON.stringify(initialRes, null, 2));

            // Fallback: Try Text-to-Video if Image fails?
            if (initialRes.error?.message?.includes("fileUri")) {
                console.log("\n⚠️ Image input failed. Trying TEXT-ONLY generation as a fallback...");
                const textPayload = {
                    instances: [{ prompt: cleanPrompt }]
                };
                const textReq = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(textPayload)
                });
                const textRes = await textReq.json();
                if (!textReq.ok) {
                    console.error("❌ Text-Only Fallback Failed too:", JSON.stringify(textRes, null, 2));
                    process.exit(1);
                }
                // If text only works, proceed with that operation
                console.log("✅ Text-Only Operation Initiated!");
                handlePolling(textRes.name);
                return;
            }

            process.exit(1);
        }

        console.log("   Operation Initiated!");
        handlePolling(initialRes.name);

    } catch (error: any) {
        console.error("❌ REST Request Error:", error);
    }
}

async function handlePolling(operationName: string) {
    if (!operationName) return;
    const API_KEY = process.env.GOOGLE_API_KEY;

    console.log(`   Operation Name: ${operationName}`);
    console.log("⏳ Polling for completion (this may take a minute)...");

    let completed = false;

    while (!completed) {
        await new Promise(r => setTimeout(r, 5000)); // Poll every 5s

        const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${API_KEY}`;
        const pollReq = await fetch(pollUrl);
        const pollRes = await pollReq.json();

        if (pollRes.done) {
            completed = true;
            console.log("✅ Operation Complete!");

            if (pollRes.error) {
                console.error("❌ Generation Error:", pollRes.error);
            } else if (pollRes.response) {
                console.log("   Result Response:", JSON.stringify(pollRes.response).substring(0, 200) + "...");
                fs.writeFileSync('veo_result_final.json', JSON.stringify(pollRes, null, 2));
                console.log("   💾 Saved full result to 'veo_result_final.json'");
            } else {
                console.log("   Unknown completion state. Check 'veo_result_final.json'.");
                fs.writeFileSync('veo_result_final.json', JSON.stringify(pollRes, null, 2));
            }
        } else {
            process.stdout.write("."); // heartbeat
        }
    }
}

main();
