import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { prompt, aspect_ratio } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
        }

        // Map aspect ratio to DALL-E 3 sizes
        let size = '1024x1024';
        switch (aspect_ratio) {
            case 'wide': // 16:9
                size = '1792x1024';
                break;
            case 'tall': // 9:16
                size = '1024x1792';
                break;
            case 'square':
            default:
                size = '1024x1024';
                break;
        }

        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt: prompt,
                n: 1,
                size: size,
                quality: 'hd',
                response_format: 'b64_json', // Request Base64 directly
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI API Error:', errorText);
            return NextResponse.json({ error: `OpenAI Error: ${response.statusText}`, details: errorText }, { status: response.status });
        }

        const data = await response.json();
        const b64 = data.data[0]?.b64_json;

        if (!b64) {
            return NextResponse.json({ error: 'No image data returned from OpenAI' }, { status: 500 });
        }

        return NextResponse.json({ b64 });

    } catch (error: unknown) {
        console.error('Generate Image API Error:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
