export function cleanDescription(text: string | null | undefined): string {
    if (!text) return '';

    // Common LLM prefixes to strip
    const prefixes = [
        /^Here is a query.*/i,
        /^Here is a story.*/i,
        /^Here is the.*/i,
        /^Sure, here.*/i,
        /^Prompt:.*/i,
        /^System:.*/i,
        /^Request:.*/i,
        /^This story.*/i, // risky?
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

    // Check for "Loop" conditions
    // If it's a "soundscape" type and very short, it's likely a loop.
    // However, if the duration is 0, it might be a stream.
    if (category && ['soundscape', 'white_noise', 'binaural', 'frequencies'].includes(category)) {
        // If it's exactly 180s (3m) or 10m, it's a loop usually. 
        // Let's just append "Loop" if it's NOT a narrative story.
        // But user said "quando sono looppabili scriviamo loop". 
        // For now, let's just format the time, and maybe add an icon in the card logic, 
        // or just return the time. User said "valutare se inserire realmente la durata".
        // Let's stick to mm:ss for precision first.
    }

    const mStr = m.toString().padStart(2, '0');
    const sStr = s.toString().padStart(2, '0');

    return `${mStr}:${sStr}`;
}

// Helper to determine if we should show "Loop" badge
export function isLoopable(category: string, duration: number): boolean {
    // Arbitrary logic: Non-narrative + reasonable length (e.g., < 5 mins or exactly 3/10/60 mins)
    // Factory loop generator makes 3 minute loops (180s).
    const isAudioOnly = [
        'soundscape',
        'binaural',
        'frequencies',
        'music_instrumental',
        'nature',
        'sleep',
        'meditation',
        'work_break', // Maybe? Let's include it for "ambient" feel if user wants
        'focus' // if exists
    ].includes(category);
    // If it's audio only, it's generally loopable or at least "ambient".
    return isAudioOnly;
}
