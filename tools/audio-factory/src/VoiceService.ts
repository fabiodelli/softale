
import * as dotenv from 'dotenv';
dotenv.config();

export interface Voice {
    voice_id: string;
    name: string;
    category: string;
    labels: {
        gender?: string;
        age?: string;
        accent?: string;
        descriptive?: string;
        use_case?: string;
        [key: string]: any;
    };
    preview_url?: string;
}

class VoiceService {
    private cache: Voice[] | null = null;
    private lastFetch: number = 0;
    private CACHE_TTL = 1000 * 60 * 60; // 1 hour

    async getVoices(): Promise<Voice[]> {
        if (this.cache && (Date.now() - this.lastFetch < this.CACHE_TTL)) {
            return this.cache;
        }

        const key = process.env.ELEVENLABS_API_KEY;
        if (!key) {
            console.warn('⚠️ No ElevenLabs API Key found. Returning empty voice list.');
            return [];
        }

        try {
            console.log('☁️ Fetching voices from ElevenLabs API...');
            const res = await fetch('https://api.elevenlabs.io/v1/voices', {
                headers: { 'xi-api-key': key }
            });

            if (!res.ok) throw new Error(`API Error: ${res.statusText}`);

            const data = await res.json();
            // Prioritize: Custom/Professional -> Premade
            // Filter out legacy if needed, or just keep all.
            // We want to prioritize "cloned" or "professional" usually.

            this.cache = data.voices;
            this.lastFetch = Date.now();
            console.log(`✅ Loaded ${this.cache?.length} voices.`);
            return this.cache || [];

        } catch (e: any) {
            console.error('❌ Failed to fetch voices:', e.message);
            return [];
        }
    }

    async getSoftaleCollection(): Promise<Voice[]> {
        const all = await this.getVoices();
        // The user calls their collection "Softale", which usually means the custom/cloned voices
        // or voices they marked. For now, we return all non-premade ones as "The Collection".
        return all.filter(v => v.category !== 'premade');
    }

    async pickVoice(criteria: { gender?: 'male' | 'female', style?: string }): Promise<Voice | null> {
        const collection = await this.getSoftaleCollection();

        // 1. Try to match gender in Collection (Custom voices)
        if (criteria.gender) {
            const matches = collection.filter(v => v.labels?.gender === criteria.gender);
            if (matches.length > 0) return matches[0]; // Return first match
        }

        // 2. If no custom match, fallback to ANY custom voice
        if (collection.length > 0) return collection[0];

        // 3. Last Resort: Use Premade voices (High Quality ones)
        const all = await this.getVoices();
        const premadeMatches = all.filter(v => v.labels?.gender === criteria.gender && v.category === 'premade');
        if (premadeMatches.length > 0) return premadeMatches[0];

        return all[0] || null;
    }
}

export const voiceService = new VoiceService();
