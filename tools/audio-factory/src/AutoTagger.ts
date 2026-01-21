
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { callClaude } from './index.js';

// Load env
const rootEnvLocal = path.resolve(process.cwd(), '.env.local');
const rootEnv = path.resolve(process.cwd(), '.env');
if (fs.existsSync(rootEnvLocal)) dotenv.config({ path: rootEnvLocal });
else if (fs.existsSync(rootEnv)) dotenv.config({ path: rootEnv });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export class AutoTagger {
    static async processAll() {
        console.log("🏷️  Starting Auto-Tagger...");
        console.log("--------------------------------");

        // Fetch all stories to check their tags
        const { data: stories, error } = await supabase
            .from('stories')
            .select('id, title, description, category, tags')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("❌ DB Error:", error.message);
            return;
        }

        console.log(`📚 Found ${stories.length} total stories.`);

        let processed = 0;

        // Fetch existing vocabulary
        console.log("   🧠 Fetching existing tag vocabulary...");
        const vocabulary = await this.fetchTopTags();
        console.log(`   ✅ Loaded ${vocabulary.length} common tags to guide generation.`);

        for (const story of stories) {
            // Check if tags are empty or null
            if (!story.tags || story.tags.length === 0) {
                console.log(`\n[${processed + 1}] Retagging: "${story.title}" (${story.category})`);
                await this.tagStory(story, vocabulary);
                processed++;
            } else {
                // console.log(`   Skipping "${story.title}" (Already has ${story.tags.length} tags)`);
            }
        }

        console.log(`\n✅ Done! Processed ${processed} stories.`);
    }

    static async fetchTopTags(): Promise<string[]> {
        // Fetch stats via RPC if available, or raw query
        // Since we are in tool script, raw query is safer if RPC types aren't synced
        const { data, error } = await supabase.from('stories').select('tags');
        if (error || !data) return [];

        const tagCounts: Record<string, number> = {};
        data.forEach(row => {
            if (Array.isArray(row.tags)) {
                row.tags.forEach((t: string) => {
                    const norm = t.trim();
                    tagCounts[norm] = (tagCounts[norm] || 0) + 1;
                });
            }
        });

        // Sort by count desc
        return Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 100) // Top 100
            .map(([tag]) => tag);
    }

    static async tagStory(story: any, existingVocabulary: string[] = []) {

        const vocabString = existingVocabulary.length > 0
            ? `\nEXISTING TAG VOCABULARY (PRIORITIZE THESE):\n[${existingVocabulary.join(', ')}]\n`
            : '';

        const prompt = `
Story Metadata:
Title: "${story.title}"
Category: "${story.category}"
Description: "${story.description}"

${vocabString}

TASK: Generate 5-8 tags for this audio story.
RULES:
1. **CHECK VOCABULARY FIRST**: If a concept exists in the provided vocabulary (e.g. "Rain"), USE IT. Do not create synonyms (e.g. "Raining", "Rainy") unless the meaning is distinct.
2. Include 2-3 **SYSTEM TAGS** from: [Morning, Sunrise, Energy, Focus, Work, Deep Work, Background, Study, Relax, Unwind, Sunset, Calm, Sleep, Dream, Night, Binaural]
3. Include 3-5 **DESCRIPTIVE TAGS** (e.g. Piano, Rain, Forest, Male Voice, Slow, Ethereal, Cinematic, Lo-Fi, Drone).

OUTPUT FORMAT:
Return ONLY a valid JSON array of strings. Do not write anything else.
Example: ["Sleep", "Night", "Rain", "Piano", "Slow"]
`;

        try {
            const resp = await callClaude("You are a Metadata Expert. Return only JSON array.", prompt, 1500);

            // Extract JSON array
            const jsonMatch = resp.text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const tags = JSON.parse(jsonMatch[0]);
                console.log(`   ✨ Generated: [${tags.join(', ')}]`);

                // Update DB
                const { error } = await supabase
                    .from('stories')
                    .update({ tags })
                    .eq('id', story.id);

                if (error) console.error(`   ❌ Save Failed: ${error.message}`);
                else console.log(`   💾 Saved!`);

            } else {
                console.warn(`   ⚠️ No JSON found in response: ${resp.text.substring(0, 50)}...`);
            }
        } catch (e: any) {
            console.error("   ❌ Error:", e.message);
        }
    }
}
