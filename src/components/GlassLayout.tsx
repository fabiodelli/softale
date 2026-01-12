'use client';

import { useMood, Mood } from '@/context/MoodContext';
import { useAmbience } from '@/context/AmbienceContext';
import { motion } from 'framer-motion';
import MoodToggleButton from './MoodToggleButton';

interface GlassLayoutProps {
    children: React.ReactNode;
}

// Mood background images (same as MoodSelector)
const moodImages: Record<Mood, { desktop: string; mobile: string }> = {
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

export default function GlassLayout({ children }: GlassLayoutProps) {
    const { activeMood, setActiveMood } = useMood();
    const { isPlaying } = useAmbience();
    const currentImages = moodImages[activeMood];

    return (
        <div className="min-h-screen selection:bg-indigo-100 selection:text-indigo-900">
            {/* FIXED BACKGROUND LAYER (z-0) - Mood image */}
            <div className="fixed inset-0 z-0">
                <motion.div
                    key={activeMood}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0"
                >
                    <picture>
                        <source media="(max-width: 768px)" srcSet={currentImages.mobile} />
                        <img
                            src={currentImages.desktop}
                            className="w-full h-full object-cover"
                            alt={activeMood}
                        />
                    </picture>
                </motion.div>
            </div>

            {/* FLOATING MOOD TOGGLE - Mobile */}
            <div className="fixed top-4 left-4 z-50 md:hidden">
                <MoodToggleButton
                    activeMood={activeMood}
                    onMoodSelect={setActiveMood}
                    variant="mobile"
                />
            </div>

            {/* SCROLLING GLASS CONTENT (z-10) - No top margin, just padding */}
            <div className="relative z-10 min-h-screen">
                <div className="bg-slate-50/80 backdrop-blur-2xl min-h-screen pt-20 md:pt-24 pb-24 md:pb-16">
                    {children}
                </div>
            </div>
        </div>
    );
}
