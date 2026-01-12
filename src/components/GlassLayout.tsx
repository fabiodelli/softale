'use client';

import { useMood } from '@/context/MoodContext';
import { useAmbience } from '@/context/AmbienceContext';
import { motion } from 'framer-motion';
import MoodToggleButton from './MoodToggleButton';
import { MOOD_IMAGES, ANIMATION, Z_INDEX } from '@/lib/constants';
import type { Mood } from '@/types';

interface GlassLayoutProps {
    children: React.ReactNode;
}

export default function GlassLayout({ children }: GlassLayoutProps) {
    const { activeMood, setActiveMood } = useMood();
    const { isPlaying } = useAmbience();
    const currentImages = MOOD_IMAGES[activeMood];

    return (
        <div className="min-h-screen selection:bg-indigo-100 selection:text-indigo-900">
            {/* FIXED BACKGROUND LAYER - Mood image */}
            <div className="fixed inset-0" style={{ zIndex: Z_INDEX.background }}>
                <motion.div
                    key={activeMood}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: ANIMATION.moodTransition }}
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
            <div className="fixed top-4 left-4 md:hidden" style={{ zIndex: Z_INDEX.moodToggle }}>
                <MoodToggleButton
                    activeMood={activeMood}
                    onMoodSelect={setActiveMood}
                    variant="mobile"
                />
            </div>

            {/* SCROLLING GLASS CONTENT */}
            <div className="relative min-h-screen" style={{ zIndex: Z_INDEX.content }}>
                <div className="bg-slate-50/80 backdrop-blur-2xl min-h-screen pt-20 md:pt-24 pb-24 md:pb-16">
                    {children}
                </div>
            </div>
        </div>
    );
}
