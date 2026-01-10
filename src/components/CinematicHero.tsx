'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Story, toggleFavorite, checkIsFavorite } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';
import { cleanDescription } from '@/lib/formatters';
import { useState, useEffect } from 'react';

interface CinematicHeroProps {
    story: Story;
    onPlay?: () => void;
    showMoreInfo?: boolean;
}

export default function CinematicHero({ story, onPlay, showMoreInfo = true }: CinematicHeroProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [isFavorite, setIsFavorite] = useState(false);

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
        if (onPlay) {
            onPlay();
        } else {
            router.push(`/story/${story.id}`);
        }
    };

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
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />
            </div>

            {/* Favorite Button (Top Right) */}
            {/* Favorite Button (Top Right) */}
            <div className="absolute top-6 right-6 md:top-10 md:right-10 z-50">
                <button
                    onClick={handleFavoriteClick}
                    className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition group text-white shadow-lg"
                    title="Toggle Favorite"
                >
                    <span className={`text-xl transform transition-transform group-hover:scale-110 block ${isFavorite ? 'scale-110' : ''}`}>
                        {isFavorite ? '❤️' : '🤍'}
                    </span>
                </button>
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full px-6 md:px-12 flex flex-col items-start gap-4 md:gap-6">

                {/* "Series" Badge or Metadata */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="flex items-center gap-2 text-indigo-400 font-medium tracking-widest text-sm uppercase"
                >
                    <span className="bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                        Featured {story.category}
                    </span>
                    {story.is_premium && <span>⭐ Premium</span>}
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
                    {cleanDescription(story.description) || "Immerse yourself in this audio journey. Let the soundscape carry you away to a place of focus and relaxation."}
                </motion.p>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    className="flex items-center gap-4 mt-4"
                >
                    {/* Play Button - Primary Action */}
                    <button
                        onClick={handlePlay}
                        className="flex items-center gap-3 bg-white text-slate-900 hover:bg-slate-200 px-8 py-3 rounded-lg font-bold text-lg md:text-xl transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
                    >
                        <span className="text-2xl">▶</span> Play Now
                    </button>

                    {/* More Info - Secondary Action */}
                    {showMoreInfo && (
                        <button
                            onClick={() => router.push(`/story/${story.id}`)}
                            className="flex items-center gap-3 bg-slate-500/40 backdrop-blur-md text-white hover:bg-slate-500/50 px-8 py-3 rounded-lg font-semibold text-lg md:text-xl transition-all active:scale-95 border border-white/10"
                        >
                            ℹ️ More Info
                        </button>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
