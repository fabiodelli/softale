const fs = require('fs');
const path = require('path');

// CONFIG
const API_KEY = process.env.LEONARDO_API_KEY;
const BASE_URL = 'https://cloud.leonardo.ai/api/rest/v1';

if (!API_KEY) {
    console.error('❌ Error: LEONARDO_API_KEY not found in environment variables.');
    console.log('👉 Add LEONARDO_API_KEY=your_key_here to your .env.local file.');
    process.exit(1);
}

const IMAGE_PATH = process.argv[2];

if (!IMAGE_PATH) {
    console.error('❌ Error: Please provide an image path.');
    console.log('Usage: node scripts/generate-hero-video.js <path/to/image.png> [motion_strength 1-10]');
    process.exit(1);
}

const MOTION_STRENGTH = parseInt(process.argv[3]) || 4;

async function main() {
    try {
        console.log(`\n🎬 Starting Video Generation for: ${path.basename(IMAGE_PATH)}`);
        console.log(`   Motion Strength: ${MOTION_STRENGTH}`);

        // 1. Get Presigned URL for Upload
        console.log('1️⃣  Initiating Upload...');
        const ext = path.extname(IMAGE_PATH).substring(1); // png, jpg
        const initRes = await fetch(`${BASE_URL}/init-image`, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({ extension: ext })
        });

        if (!initRes.ok) throw new Error(`Init Upload Failed: ${initRes.statusText}`);
        const initData = await initRes.json();
        const { uploadInitImage } = initData; // access id, fields, url, key

        if (!uploadInitImage) throw new Error('No upload data received.');

        // 2. Upload File to S3
        console.log('2️⃣  Uploading Image data...');
        const fileBuffer = fs.readFileSync(IMAGE_PATH);
        const formData = JSON.parse(uploadInitImage.fields);

        // Construct form data for S3 upload
        // Note: Using standard fetch with manual form construction is tricky for file uploads without 'form-data' package.
        // We will assume 'form-data' might not be installed, but it's cleaner to use it.
        // If this fails, we might need 'npm install form-data'.
        // Let's try to do it without external deps if possible, but S3 usually needs multipart.
        // For robustness, I'll advise installing dependencies if this fails, or I can use a simpler approach if possible.
        // Actually, let's just use the 'form-data' package pattern if available, or just fetch with FormData if Node 18+.

        // Node's native fetch supports FormData since v18.
        const form = new FormData();
        for (const key in formData) {
            form.append(key, formData[key]);
        }
        form.append('file', new Blob([fileBuffer]));

        const uploadRes = await fetch(uploadInitImage.url, {
            method: 'POST',
            body: form
        });

        if (!uploadRes.ok) throw new Error(`S3 Upload Failed: ${uploadRes.statusText}`);

        const imageId = uploadInitImage.id;
        console.log(`✅ Image Uploaded! ID: ${imageId}`);

        // 3. Trigger Video Gen
        console.log('3️⃣  Triggering Video Generation...');
        const genRes = await fetch(`${BASE_URL}/generations-image-to-video`, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                imageId: imageId,
                motionStrength: MOTION_STRENGTH,
                isInitImage: true // Important flag
            })
        });

        if (!genRes.ok) {
            const err = await genRes.text();
            throw new Error(`Generation Trigger Failed: ${err}`);
        }
        const genData = await genRes.json();
        const generationId = genData.sdGenerationJob?.generationId;

        if (!generationId) throw new Error('No Generation ID returned.');
        console.log(`⏳ Generation ID: ${generationId}. Waiting...`);

        // 4. Poll for Result
        let videoUrl = null;
        let attempts = 0;
        while (!videoUrl && attempts < 30) {
            attempts++;
            await new Promise(r => setTimeout(r, 4000)); // Wait 4s
            process.stdout.write('.');

            const pollRes = await fetch(`${BASE_URL}/generations/${generationId}`, {
                headers: {
                    'accept': 'application/json',
                    'authorization': `Bearer ${API_KEY}`
                }
            });

            if (pollRes.ok) {
                const pollData = await pollRes.json();
                const status = pollData.generations_by_pk?.status;

                if (status === 'COMPLETE') {
                    const generatedImages = pollData.generations_by_pk.generated_images;
                    if (generatedImages && generatedImages.length > 0) {
                        videoUrl = generatedImages[0].motionMP4URL;
                    }
                } else if (status === 'FAILED') {
                    throw new Error('Generation FAILED on server.');
                }
            }
        }
        console.log('\n');

        if (!videoUrl) throw new Error('Timed out waiting for video.');

        // 5. Download Video
        console.log('4️⃣  Downloading Video...');
        const videoRes = await fetch(videoUrl);
        const videoBuffer = await videoRes.arrayBuffer();

        const outputName = path.basename(IMAGE_PATH, path.extname(IMAGE_PATH)) + '_motion.mp4';
        const outputPath = path.join(path.dirname(IMAGE_PATH), outputName);

        fs.writeFileSync(outputPath, Buffer.from(videoBuffer));
        console.log(`✅ SUCCESS! Video saved to: \n   ${outputPath}`);

    } catch (err) {
        console.error('\n❌ ERROR:', err.message);
    }
}

main();
