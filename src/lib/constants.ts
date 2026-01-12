// Mood type definition
export type Mood = 'sleep' | 'meditation' | 'fantasy' | 'nature' | 'energized';

// Mood background images
export const MOOD_IMAGES: Record<Mood, { desktop: string; mobile: string }> = {
    sleep: {
        desktop: '/images/moods/starry_night.png',
        mobile: '/images/moods/mobile/starry_night.jpg'
    },
    nature: {
        desktop: '/images/moods/forest.png',
        mobile: '/images/moods/mobile/forest.jpg'
    },
    fantasy: {
        desktop: '/images/moods/sunset.png',
        mobile: '/images/moods/mobile/sunset.jpg'
    },
    meditation: {
        desktop: '/images/moods/zen_stones.png',
        mobile: '/images/moods/mobile/zen_stones.jpg'
    },
    energized: {
        desktop: '/images/moods/ocean-vibrant.jpg',
        mobile: '/images/moods/mobile/ocean-vibrant.jpg'
    },
};

// Mood metadata (for MoodSelector)
export const MOODS = [
    {
        id: 'sleep' as const,
        label: 'Relaxed',
        colorClass: 'bg-indigo-100 text-slate-800',
        activeClass: 'ring-[3px] ring-indigo-300 scale-105 bg-indigo-200',
    },
    {
        id: 'nature' as const,
        label: 'Peaceful',
        colorClass: 'bg-emerald-100 text-slate-800',
        activeClass: 'ring-[3px] ring-emerald-300 scale-105 bg-emerald-200',
    },
    {
        id: 'fantasy' as const,
        label: 'Dreamy',
        colorClass: 'bg-rose-100 text-slate-800',
        activeClass: 'ring-[3px] ring-rose-300 scale-105 bg-rose-200',
    },
    {
        id: 'meditation' as const,
        label: 'Focused',
        colorClass: 'bg-sky-100 text-slate-800',
        activeClass: 'ring-[3px] ring-sky-300 scale-105 bg-sky-200',
    },
    {
        id: 'energized' as const,
        label: 'Energized',
        colorClass: 'bg-amber-100 text-slate-800',
        activeClass: 'ring-[3px] ring-amber-300 scale-105 bg-amber-200',
    }
];

// Story categories
export const CATEGORIES = [
    { id: 'sleep', label: 'Sleep', emoji: '🌙' },
    { id: 'meditation', label: 'Meditation', emoji: '🧘' },
    { id: 'fantasy', label: 'Fantasy', emoji: '🌟' },
    { id: 'nature', label: 'Nature', emoji: '🌿' },
    { id: 'soundscape', label: 'Soundscapes', emoji: '🌊' },
    { id: 'binaural', label: 'Binaural', emoji: '🔮' },
    { id: 'music_instrumental', label: 'Instrumental', emoji: '🎵' },
    { id: 'motivation', label: 'Focus', emoji: '⚡' },
    { id: 'work_break', label: 'Work Break', emoji: '☕' },
    { id: 'kids', label: 'Kids', emoji: '🧸' },
] as const;

// Z-index layers for consistent stacking
export const Z_INDEX = {
    background: 0,
    content: 10,
    navbar: 40,
    moodToggle: 50,
    modal: 100,
} as const;

// Animation timing constants
export const ANIMATION = {
    staggerDelay: 0.03,
    modalDuration: 0.4,
    moodTransition: 1,
    cardHover: 0.5,
} as const;
