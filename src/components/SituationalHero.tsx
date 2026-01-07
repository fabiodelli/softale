'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Story, toggleFavorite, checkIsFavorite } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';
import { useState, useEffect } from 'react';

interface SituationalHeroProps {
    story: Story;
    onPlay?: () => void;
}

import { usePlayer } from '@/lib/PlayerContext';

export default function SituationalHero({ story, onPlay }: SituationalHeroProps) {
    const router = useRouter();
    const { user, profile } = useAuth();
    const { play } = usePlayer();
    const [isFavorite, setIsFavorite] = useState(false);
    const [greeting, setGreeting] = useState('');
    const [timeIcon, setTimeIcon] = useState('');

    // Determine Greeting based on time
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
            setGreeting('Good Morning');
            setTimeIcon('wm_sunny'); // Material symbol name or emoji
        } else if (hour >= 12 && hour < 18) {
            setGreeting('Good Afternoon');
            setTimeIcon('wb_sunny');
        } else {
            setGreeting('Good Evening');
            setTimeIcon('bedtime');
        }
    }, []);

    // Check favorite status on mount
    useEffect(() => {
        if (user && story) {
            checkIsFavorite(user.id, story.id).then(setIsFavorite);
        }
    }, [user, story]);

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            router.push('/login');
            return;
        }

        // Optimistic update
        setIsFavorite(!isFavorite);
        await toggleFavorite(user.id, story.id);
    };

    if (!story) return null;

    const handlePlay = () => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (onPlay) {
            onPlay();
        } else {
            play(story);
        }
    };

    const userName = profile?.username || user?.email?.split('@')[0] || '';
    const displayName = userName ? `, ${userName.charAt(0).toUpperCase() + userName.slice(1)}` : '';

    return (
        <div className="relative w-full h-[85vh] md:h-[75vh] min-h-[500px] flex items-end pb-12 overflow-hidden">
            {/* Background Image - Cinematic Layer */}
            <div className="absolute inset-0 z-0">
                <img
                    src={story.cover_landscape_url || story.cover_url || ''}
                    alt={story.title}
                    className="w-full h-full object-cover"
                />
                {/* Gradient Overlay: Top-down dark tint, Bottom-up blend to background */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-black/30" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/30 to-transparent" />
            </div>

            {/* Favorite Button (Top Right) */}
            <div className="absolute top-24 right-6 md:top-32 md:right-10 z-50">
                <button
                    onClick={handleFavoriteClick}
                    className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition group text-white shadow-lg"
                    title="Toggle Favorite"
                >
                    <span className={`text-xl transform transition-transform group-hover:scale-110 block ${isFavorite ? 'scale-110' : ''}`}>
                        {isFavorite ? '❤️' : '🤍'}
                    </span>
                </button>
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full px-6 md:px-12 flex flex-col items-start gap-3 md:gap-5">

                {/* Greeting Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="flex items-center gap-2 mb-2"
                >
                    <span className="text-2xl md:text-3xl font-light text-indigo-200">
                        {greeting}{displayName}
                    </span>
                </motion.div>

                {/* Title - Huge, Cinematic */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-none tracking-tight max-w-4xl drop-shadow-2xl"
                >
                    {story.title}
                </motion.h1>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="text-lg md:text-xl text-slate-200/90 max-w-xl md:max-w-2xl line-clamp-3 md:line-clamp-none font-light leading-relaxed drop-shadow-md"
                >
                    {story.description}
                </motion.p>

                {/* Tags / Duration */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.25 }}
                    className="flex flex-wrap gap-3 text-sm font-medium text-slate-300"
                >
                    <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        {Math.floor(story.duration / 60)} min
                    </span>
                    <span className="bg-indigo-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-indigo-500/30 text-indigo-300">
                        {story.category}
                    </span>
                    {story.is_premium && (
                        <span className="bg-amber-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/30 text-amber-300">
                            ⭐ Premium
                        </span>
                    )}
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    className="flex items-center gap-4 mt-6"
                >
                    {/* Play Button - Primary Action */}
                    <button
                        onClick={handlePlay}
                        className="flex items-center gap-3 bg-white text-slate-900 hover:bg-slate-200 px-8 py-4 rounded-xl font-bold text-lg md:text-xl transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
                    >
                        <span className="text-2xl">▶</span> Play Now
                    </button>

                    {/* Secondary Action - Could be Queue or Favorite text? Removed Info button as per request */}
                </motion.div>
            </div>
        </div>
    );
}
