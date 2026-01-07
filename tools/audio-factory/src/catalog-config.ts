/**
 * Softale Content Catalog - Batch Generation Config
 * Run after successful test: npx tsx tools/audio-factory/batch-generate.ts
 */

interface ContentItem {
    title: string;
    description: string;
    category: string;
    duration: number; // minutes
    language: string;
    voiceStyle?: string;
}

export const CATALOG_ITEMS: ContentItem[] = [
    // ============================================
    // PHASE 1: SOUNDSCAPES (5 new unique ones)
    // ============================================
    {
        title: "Monsoon Glass",
        description: "Rain falling on greenhouse conservatory. Intimate drops on glass panels, distant thunder rumble, tropical humidity. Cozy shelter feeling.",
        category: "soundscape",
        duration: 3,
        language: "English"
    },
    {
        title: "The Café at 3AM",
        description: "Late night jazz café ambience. Soft piano in background, distant espresso machine, muffled conversation, rain on windows. Urban cozy isolation.",
        category: "soundscape",
        duration: 3,
        language: "English"
    },
    {
        title: "Antarctic Dawn",
        description: "Sub-zero wind with crystalline sparkle. Ice cracking, distant penguin calls, vast emptiness. Cold, crisp, otherworldly silence.",
        category: "soundscape",
        duration: 3,
        language: "English"
    },
    {
        title: "Bamboo Cathedral",
        description: "Wind through giant bamboo grove. Musical hollow tones, creaking stalks, zen garden atmosphere. Japanese forest serenity.",
        category: "soundscape",
        duration: 3,
        language: "English"
    },
    {
        title: "The Engine Room",
        description: "Deep mechanical hum, submarine-like. Industrial ambient, distant metal echoes, rhythmic machinery pulse. Warm, protected, powerful.",
        category: "soundscape",
        duration: 3,
        language: "English"
    },

    // ============================================
    // PHASE 2: BINAURAL FREQUENCIES (4)
    // ============================================
    {
        title: "Gamma State",
        description: "40Hz gamma wave binaural beats. Deep focus, ADHD support, heightened concentration. Layered with subtle ambient pad.",
        category: "binaural",
        duration: 5,
        language: "English"
    },
    {
        title: "The Schumann",
        description: "7.83Hz Earth resonance frequency. Grounding, stabilizing, connecting to planetary rhythm. Deep meditation foundation.",
        category: "binaural",
        duration: 5,
        language: "English"
    },
    {
        title: "Golden Ratio",
        description: "432Hz healing frequency. Harmonic, soothing, DNA repair associations. Warm ambient tones with sacred geometry.",
        category: "binaural",
        duration: 5,
        language: "English"
    },
    {
        title: "Theta Drift",
        description: "4-7Hz theta wave binaural. Creativity, light meditation, lucid dreaming threshold. Floating, boundary-dissolving.",
        category: "binaural",
        duration: 5,
        language: "English"
    },
    {
        title: "Alpha Flow",
        description: "10Hz alpha wave binaural. Relaxed alertness, post-work decompression, creative flow state. Calm but present.",
        category: "binaural",
        duration: 5,
        language: "English"
    },

    // ============================================
    // PHASE 3: INSTRUMENTAL (5)
    // ============================================
    {
        title: "Nordic Piano",
        description: "Minimalist felt piano with subtle room noise. Melancholic, reflective, wintry atmosphere. Slow tempo, plenty of space between notes.",
        category: "music_instrumental",
        duration: 5,
        language: "English"
    },
    {
        title: "Ambient Cello",
        description: "Deep, resonant cello drones and slow melodic phrases. Somber but comforting. Wood creaks, rosin texture. Emotional grounding.",
        category: "music_instrumental",
        duration: 5,
        language: "English"
    },
    {
        title: "Lo-Fi Study Beats",
        description: "Soft vinyl crackle, mellow rhodes keys, slow downtempo beat (60bpm). Cozy nostalgic vibe. Perfect for focus and reading.",
        category: "music_instrumental",
        duration: 5,
        language: "English"
    },
    {
        title: "Deep Space Drone",
        description: "Ethereal synthesizer pads, shimmering high frequencies, deep bass rumble. Drift in zero gravity. Sci-fi isolation.",
        category: "music_instrumental",
        duration: 5,
        language: "English"
    },
    {
        title: "Acoustic Morning",
        description: "Bright fingerstyle acoustic guitar. Birds chirping in background. Sunrise feeling, optimistic, gentle awakening.",
        category: "music_instrumental",
        duration: 5,
        language: "English"
    },

    // ============================================
    // PHASE 4: SLEEP STORIES (7)
    // ============================================
    {
        title: "The Velvet Locomotive",
        description: "1920s Orient Express through snowy Alps. Luxurious cabin, rhythmic wheels on rails, passing through tunnels. Art deco elegance, safe journey.",
        category: "sleep",
        duration: 20,
        language: "English",
        voiceStyle: "soft_male"
    },
    {
        title: "Letters from the Lighthouse",
        description: "Solitary lighthouse keeper on remote island. Writing letters by lamplight, distant ships, fog horn. Melancholic beauty, absolute safety.",
        category: "sleep",
        duration: 20,
        language: "English",
        voiceStyle: "soft_male"
    },
    {
        title: "The Cartographer's Dream",
        description: "Mapping imaginary lands with quill and ink. Fantastical coastlines emerge, mythical creatures annotated. Whimsical, wandering mind.",
        category: "sleep",
        duration: 20,
        language: "English",
        voiceStyle: "soft_female"
    },
    {
        title: "Where Flowers Sleep",
        description: "Night garden where blooms close for rest. Walking among sleepy petals, fireflies as guides. Gentle botanical wonder.",
        category: "sleep",
        duration: 20,
        language: "English",
        voiceStyle: "soft_female"
    },
    {
        title: "The Last Bookshop",
        description: "Infinite bookshop at world's edge. Paper whispers, leather bindings, stories dreaming on shelves. Cozy intellectual sanctuary.",
        category: "sleep",
        duration: 20,
        language: "English",
        voiceStyle: "soft_male"
    },
    {
        title: "Dust of the Canyon",
        description: "Desert night under vast sky. Red stones cooling, distant coyote, stars emerging. Vast stillness, primal peace.",
        category: "sleep",
        duration: 20,
        language: "English",
        voiceStyle: "soft_male"
    },
    {
        title: "The Herbalist's Cottage",
        description: "Small cottage in misty forest. Drying herbs on rafters, bubbling pot of tea, cat asleep by fire. Gentle rain outside. Grandmother wisdom.",
        category: "sleep",
        duration: 20,
        language: "English",
        voiceStyle: "soft_female"
    },

    // ============================================
    // PHASE 5: MEDITATION (8)
    // ============================================
    {
        title: "Four Corners",
        description: "Box breathing technique (4-4-4-4). Navy SEAL method. Clear voice counting, ambient pad backing. Focus reset.",
        category: "meditation",
        duration: 5,
        language: "English",
        voiceStyle: "neutral"
    },
    {
        title: "The Body Map",
        description: "Progressive Muscle Relaxation. Systematic tension release from toes to crown. Deep physical unwinding.",
        category: "meditation",
        duration: 10,
        language: "English",
        voiceStyle: "soft_female"
    },
    {
        title: "The Plunge",
        description: "NSDR - Non-Sleep Deep Rest. Yoga Nidra inspired. Body scanning, intention setting, consciousness exploration.",
        category: "meditation",
        duration: 20,
        language: "English",
        voiceStyle: "soft_female"
    },
    {
        title: "Five Senses Reset",
        description: "5-4-3-2-1 grounding technique. Anxiety relief. Sensory anchoring to present moment.",
        category: "meditation",
        duration: 5,
        language: "English",
        voiceStyle: "soft_female"
    },
    {
        title: "The Sigh",
        description: "Physiological sigh technique. Double inhale, long exhale. Parasympathetic activation. Instant calm.",
        category: "meditation",
        duration: 5,
        language: "English",
        voiceStyle: "neutral"
    },
    {
        title: "Sharp Focus",
        description: "Attention trigger meditation. Alertness boosting. Eye focus, breath sharpening, cognitive priming.",
        category: "meditation",
        duration: 5,
        language: "English",
        voiceStyle: "neutral"
    },
    {
        title: "First Light",
        description: "Morning intention setting. Gratitude, goals, energy cultivation. Starting day with clarity.",
        category: "meditation",
        duration: 5,
        language: "English",
        voiceStyle: "soft_male"
    },
    {
        title: "Day's End",
        description: "Evening review meditation. Processing day, releasing tension, gratitude practice. Transition to rest.",
        category: "meditation",
        duration: 5,
        language: "English",
        voiceStyle: "soft_male"
    },

    // ============================================
    // PHASE 6: FANTASY (5)
    // ============================================
    {
        title: "The Midnight Apiary",
        description: "Tending bees that fly only under moonlight. Their honey captures dreams. Silver hives hum with sleeping stories. Gentle, purposeful work in starlight.",
        category: "fantasy",
        duration: 15,
        language: "English",
        voiceStyle: "soft_male"
    },
    {
        title: "Bioluminescent Depths",
        description: "Underwater forest of glowing plants. Swimming without need to breathe, luminous fish companions. Safe, surreal beauty.",
        category: "fantasy",
        duration: 15,
        language: "English",
        voiceStyle: "soft_female"
    },
    {
        title: "The Clockwork Observatory",
        description: "Steampunk tower reaching to stars. Brass telescopes, clicking gears, infinite cosmos revealed. Curiosity and discovery.",
        category: "fantasy",
        duration: 15,
        language: "English",
        voiceStyle: "soft_male"
    },
    {
        title: "Whispers of the Ancients",
        description: "Moss-covered temple in forgotten jungle. Stone guardians who protect dreamers, sacred pools reflecting starlight. Mystery and safety.",
        category: "fantasy",
        duration: 15,
        language: "English",
        voiceStyle: "soft_female"
    },
    {
        title: "The Glass Desert",
        description: "Crystal dunes refracting rainbow light. Each step creates musical tones, horizon of possibility. Surreal tranquility.",
        category: "fantasy",
        duration: 15,
        language: "English",
        voiceStyle: "soft_male"
    },

    // ============================================
    // PHASE 7: SPECIAL AMBIENT (From Batch 2)
    // ============================================
    {
        title: "528Hz DNA Repair",
        description: "528Hz Solfeggio frequency, miracle tone, soft ambient drone, bright and airy, meditative state, continuous loop, no transients.",
        category: "music_instrumental",
        duration: 3,
        language: "English"
    },
    {
        title: "Deep Theta Waves",
        description: "Binaural beats in Theta range (6Hz), deep sleep induction, low rumble, dark ambient atmosphere, minimal texture.",
        category: "sleep",
        duration: 3,
        language: "English"
    },
    {
        title: "Satie Minimal Piano",
        description: "Solo piano, slow bpm, Erik Satie style, minimal notes, heavy reverb, emotional, melancholic, cinematic, relaxing.",
        category: "music_instrumental",
        duration: 3,
        language: "English"
    },
    {
        title: "Eno Space Pads",
        description: "Ambient space drone, Brian Eno style, evolving texture, airy pads, slow attack, long release, drift, sleep music.",
        category: "music_instrumental",
        duration: 3,
        language: "English"
    },
    {
        title: "Tibetan Singing Bowls",
        description: "Tibetan singing bowls, resonant bells, temple atmosphere, meditative, spiritual, rich harmonics, wide stereo image.",
        category: "meditation",
        duration: 3,
        language: "English"
    }
];

// Quick stats
console.log(`
📊 CATALOG SUMMARY
==================
Total Items: ${CATALOG_ITEMS.length}
- Soundscapes: ${CATALOG_ITEMS.filter(i => i.category === 'soundscape').length}
- Binaural: ${CATALOG_ITEMS.filter(i => i.category === 'binaural').length}
- Sleep Stories: ${CATALOG_ITEMS.filter(i => i.category === 'sleep').length}
- Meditation: ${CATALOG_ITEMS.filter(i => i.category === 'meditation').length}
- Fantasy: ${CATALOG_ITEMS.filter(i => i.category === 'fantasy').length}

Total Duration: ${CATALOG_ITEMS.reduce((sum, i) => sum + i.duration, 0)} minutes
`);
