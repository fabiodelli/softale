export function cleanDescription(text: string | null | undefined): string {
    if (!text) return '';

    // Common LLM prefixes to strip
    const prefixes = [
        /^Here is a query\s*[-:]?\s*/i,
        /^Here is a story\s*[-:]?\s*/i,
        /^Here is the\s*[-:]?\s*/i,
        /^Sure, here\s*[-:]?\s*/i,
        /^Prompt\s*[-:]?\s*/i,
        /^System\s*[-:]?\s*/i,
        /^Request\s*[-:]?\s*/i,
        /^This story\s*[-:]?\s*/i,
    ];

    let cleaned = text.trim();

    // Remove prefixes
    prefixes.forEach(prefix => {
        cleaned = cleaned.replace(prefix, '');
    });

    // Remove quotes if the whole thing is quoted
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1);
    }

    return cleaned.trim();
}

export function formatDuration(seconds: number, category?: string): string {
    if (!seconds) return '00:00';

    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);

    const mStr = m.toString().padStart(2, '0');
    const sStr = s.toString().padStart(2, '0');

    return `${mStr}:${sStr}`;
}

// Helper to determine if we should show "Loop" badge
export function isLoopable(category: string, duration: number): boolean {
    const isAudioOnly = [
        'soundscape',
        'white_noise',
        'binaural',
        'frequencies',
        'music_instrumental',
        'nature',
        'sleep',
        'meditation',
        'work_break',
        'focus'
    ].includes(category);
    return isAudioOnly;
}
