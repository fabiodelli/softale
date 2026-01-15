
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Force load from .env.local in current directory (Project Root)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';

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

    // 1. Upload Image to Gemini
    console.log(`📤 Uploading image to Google AI Studio...`);
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

    // 2. Generate Video
    // Verified Model ID from documentation: 'veo-3.1-generate-preview'
    // Note: Some docs say 'veo-3.1-generate-preview-001' or just 'veo-3.1-generate-preview'
    // We will try the most common preview tag.
    const modelName = 'veo-3.1-generate-preview';

    console.log(`🚀 Generating Video with ${modelName}...`);
    console.log(`   Prompt: "${prompt}"`);

    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
            prompt,
            { fileData: { fileUri: uploadResult.file.uri, mimeType: uploadResult.file.mimeType } }
        ]);

        console.log("   Request Sent. Waiting for response...");
        const response = await result.response;

        console.log("✅ Response received!");

        // Check for candidates
        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
            console.log("   Candidates found:", candidates.length);
            // In video models, the content parts usually contain the video URI or checking inline data
            // We'll dump it to inspect the structure since SDKs vary on video output storage
            fs.writeFileSync('veo_result.json', JSON.stringify(response, null, 2));
            console.log("   Saved full response to veo_result.json - Check this for the video URL!");
        } else {
            console.log("   No candidates returned. Check quotas?");
            console.log(response);
        }

    } catch (error: any) {
        console.error("❌ Generation Failed:");
        console.error(error.message);
        console.log("\nPossible Causes:");
        console.log("1. Model Name mismatch (try 'veo-2.0-generate-preview'?)");
        console.log("2. API Key does not have checking for Vertex AI permissions (if enterprise)");
        console.log("3. Quota exceeded");
    }
}

main();
