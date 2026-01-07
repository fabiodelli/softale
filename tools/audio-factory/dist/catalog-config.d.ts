/**
 * Softale Content Catalog - Batch Generation Config
 * Run after successful test: npx tsx tools/audio-factory/batch-generate.ts
 */
interface ContentItem {
    title: string;
    description: string;
    category: string;
    duration: number;
    language: string;
    voiceStyle?: string;
}
export declare const CATALOG_ITEMS: ContentItem[];
export {};
