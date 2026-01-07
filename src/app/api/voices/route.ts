import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Your Softale collection ID on ElevenLabs
const SOFTALE_COLLECTION_ID = 'KOY2TTbaG3QdbqebUrzI';

interface ElevenLabsVoice {
    voice_id: string;
    name: string;
    preview_url?: string | null;
    labels?: Record<string, string>;
    category?: string;
    sharing?: {
        status?: string;
        history_item_sample_id?: string;
    };
}

interface VoiceResponse {
    id: string;
    name: string;
    previewUrl: string | null;
    gender: 'male' | 'female' | 'unknown';
    style: string;
}

/**
 * GET /api/voices
 * Fetches voices from ElevenLabs and filters by Softale collection
 */
export async function GET() {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
        return NextResponse.json({
            error: 'ElevenLabs API key not configured',
            voices: [],
        });
    }

    try {
        // First try v2 API with collection filter
        let voices: ElevenLabsVoice[] = [];
        let source = 'unknown';

        // Method 1: Try v2 API with collection_id
        const v2Response = await fetch(
            `https://api.elevenlabs.io/v2/voices?collection_id=${SOFTALE_COLLECTION_ID}`,
            {
                headers: { 'xi-api-key': apiKey },
            }
        );

        if (v2Response.ok) {
            const data = await v2Response.json();
            voices = data.voices || [];
            source = 'v2_collection';
            console.log(`[Voices API] v2 collection: ${voices.length} voices`);
        }

        // Method 2: If v2 didn't work or returned empty, try v1 and filter
        if (voices.length === 0) {
            console.log('[Voices API] v2 empty, trying v1...');
            const v1Response = await fetch('https://api.elevenlabs.io/v1/voices', {
                headers: { 'xi-api-key': apiKey },
            });

            if (v1Response.ok) {
                const data = await v1Response.json();
                const allVoices: ElevenLabsVoice[] = data.voices || [];

                // Filter to only voices that are "cloned" or from library (not default)
                // This helps reduce the list to user's saved voices
                voices = allVoices.filter(v =>
                    v.category === 'cloned' ||
                    v.category === 'professional' ||
                    v.sharing?.status === 'enabled'
                );

                source = 'v1_filtered';
                console.log(`[Voices API] v1 filtered: ${voices.length} of ${allVoices.length} total`);

                // If still too many, just use all
                if (voices.length === 0) {
                    voices = allVoices;
                    source = 'v1_all';
                }
            }
        }

        // Transform to our format
        const formattedVoices: VoiceResponse[] = voices.map((voice) => {
            const labels = voice.labels || {};
            let gender: 'male' | 'female' | 'unknown' = 'unknown';

            const genderLabel = (labels.gender || '').toLowerCase();
            if (genderLabel === 'male') gender = 'male';
            else if (genderLabel === 'female') gender = 'female';

            return {
                id: voice.voice_id,
                name: voice.name,
                previewUrl: voice.preview_url || null,
                gender,
                style: labels.description || labels.accent || 'General',
            };
        });

        // Sort by gender then name
        formattedVoices.sort((a, b) => {
            const order: Record<string, number> = { female: 0, male: 1, unknown: 2 };
            if (order[a.gender] !== order[b.gender]) {
                return order[a.gender] - order[b.gender];
            }
            return a.name.localeCompare(b.name);
        });

        return NextResponse.json({
            voices: formattedVoices,
            count: formattedVoices.length,
            source,
            collectionId: SOFTALE_COLLECTION_ID,
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Voices API] Error:', message);
        return NextResponse.json({
            error: message,
            voices: []
        });
    }
}
