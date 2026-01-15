// Social Caption & Hashtag Generator for Softale
// Generates optimized captions based on story metadata

interface StoryMetadata {
    id: string;
    title: string;
    description?: string;
    category: string;
    duration: number;
}

interface GeneratedCaption {
    instagram: string;
    tiktok: string;
    youtube: string;
    hashtags: {
        instagram: string[];
        tiktok: string[];
        youtube: string[];
    };
}

// Hashtag sets by category
const HASHTAG_SETS: Record<string, { primary: string[]; secondary: string[]; }> = {
    sleep: {
        primary: ['#sleepstory', '#asmrsleep', '#sleepmeditation', '#bedtimevibes'],
        secondary: ['#relaxingsounds', '#goodnight', '#sleepwell', '#sweetdreams']
    },
    meditation: {
        primary: ['#meditation', '#guidedmeditation', '#mindfulness', '#innerpeace'],
        secondary: ['#breathwork', '#mentalhealth', '#calmness', '#zenmoment']
    },
    fantasy: {
        primary: ['#fantasystory', '#sleepstory', '#dreamscape', '#imagination'],
        secondary: ['#storytime', '#bedtimestory', '#escapereality', '#dreamworld']
    },
    kids: {
        primary: ['#kidsbedtime', '#sleeptraining', '#bedtimestory', '#parentinghacks'],
        secondary: ['#toddlermom', '#momlife', '#kidssleep', '#gentleparenting']
    },
    motivation: {
        primary: ['#motivation', '#mindset', '#positivethinking', '#inspiration'],
        secondary: ['#growthmindset', '#selfcare', '#morningroutine', '#wellness']
    },
    work_break: {
        primary: ['#workbreak', '#officemeditation', '#destress', '#mentalbreak'],
        secondary: ['#productivity', '#burnoutrecovery', '#worklifebalance', '#selfcare']
    },
    nature: {
        primary: ['#naturesounds', '#ambientmusic', '#naturetherapy', '#forestsounds'],
        secondary: ['#rainsounds', '#oceansounds', '#relaxing', '#peacefulvibes']
    },
    soundscape: {
        primary: ['#ambientmusic', '#soundscape', '#atmosphericmusic', '#backgroundmusic'],
        secondary: ['#focusmusic', '#studymusic', '#chillvibes', '#lofi']
    },
    music_instrumental: {
        primary: ['#instrumentalmusic', '#pianomusic', '#relaxingmusic', '#sleepmusic'],
        secondary: ['#acousticmusic', '#softmusic', '#peacefulmusic', '#calmmusic']
    },
    binaural: {
        primary: ['#binauralbeats', '#brainwaves', '#deeprelaxation', '#sleepaid'],
        secondary: ['#alphawaves', '#thetawaves', '#meditation', '#focusaid']
    }
};

// Caption hooks by category
const HOOKS: Record<string, string[]> = {
    sleep: [
        "Can't sleep? Try this...",
        "The story that puts everyone to sleep 💤",
        "Let this take you to dreamland...",
        "Your new bedtime ritual starts here"
    ],
    meditation: [
        "Take a breath. You deserve this moment.",
        "Your escape starts here ✨",
        "Find your peace in 60 seconds",
        "The calm you've been looking for"
    ],
    fantasy: [
        "Enter a world of magic and wonder...",
        "Close your eyes and escape...",
        "Let your imagination run free 🌙",
        "A journey to somewhere magical"
    ],
    kids: [
        "A bedtime story to help little ones drift off...",
        "Sweet dreams guaranteed 🧸",
        "The story that ends every bedtime battle",
        "Watch them fall asleep in minutes"
    ],
    nature: [
        "Nature's lullaby 🌿",
        "Escape to the forest...",
        "The sound of pure tranquility",
        "Let nature calm your mind"
    ],
    default: [
        "Find your moment of peace ✨",
        "Your daily dose of calm",
        "Escape for just a moment...",
        "The relaxation you need"
    ]
};

// CTAs for different platforms
const CTAS = {
    instagram: [
        "💾 Save this for tonight",
        "🔖 Save for when you need peace",
        "📌 Pin this for later"
    ],
    tiktok: [
        "💾 Save for bedtime",
        "🔖 Bookmark this",
        "👆 Follow for more"
    ],
    youtube: [
        "🔔 Subscribe for more",
        "👍 Like if this helped",
        "💬 Comment your favorite"
    ]
};

function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}min` : `${hours}h`;
}

export function generateCaption(story: StoryMetadata): GeneratedCaption {
    const category = story.category || 'sleep';
    const hookSet = HOOKS[category] || HOOKS.default;
    const hashtagSet = HASHTAG_SETS[category] || HASHTAG_SETS.sleep;

    const hook = getRandomItem(hookSet);
    const duration = formatDuration(story.duration);

    // Build hashtag arrays
    const brandTag = '#softale';
    const instagramHashtags = [brandTag, ...hashtagSet.primary.slice(0, 3), ...hashtagSet.secondary.slice(0, 2)];
    const tiktokHashtags = [brandTag, ...hashtagSet.primary.slice(0, 2), '#fyp', '#viral'];
    const youtubeHashtags = [brandTag, '#shorts', ...hashtagSet.primary.slice(0, 2)];

    // Build captions
    const instagram = `${hook}

✨ ${story.title}

${story.description ? story.description.slice(0, 100) + '...' : `A ${duration} journey into tranquility.`}

${getRandomItem(CTAS.instagram)}
📲 Full experience on Softale (link in bio)

${instagramHashtags.join(' ')}`;

    const tiktok = `${hook}

🌙 ${story.title}

${getRandomItem(CTAS.tiktok)}
📲 Link in bio for more

${tiktokHashtags.join(' ')}`;

    const youtube = `${story.title} | Softale

${hook}

${story.description || `A ${duration} relaxation experience.`}

${getRandomItem(CTAS.youtube)}

${youtubeHashtags.join(' ')}`;

    return {
        instagram,
        tiktok,
        youtube,
        hashtags: {
            instagram: instagramHashtags,
            tiktok: tiktokHashtags,
            youtube: youtubeHashtags
        }
    };
}

// Export for use in API routes
export { HASHTAG_SETS, HOOKS, CTAS };
