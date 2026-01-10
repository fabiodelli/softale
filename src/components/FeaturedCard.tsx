
'use client';

import { Story } from '@/lib/supabase';
import { usePlayer } from '@/lib/PlayerContext';
import { cleanDescription, formatDuration } from '@/lib/formatters';
import { Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface FeaturedCardProps {
    story: Story;
}

export default function FeaturedCard({ story }: FeaturedCardProps) {
    const { currentStory, isPlaying, play, pause } = usePlayer();
    const isCurrent = currentStory?.id === story.id;
    const active = isCurrent && isPlaying;

    // Image Fallback Logic
    const [imgSrc, setImgSrc] = useState(story.cover_landscape_url || story.cover_url || '/placeholder-cover.jpg');

    useEffect(() => {
        setImgSrc(story.cover_landscape_url || story.cover_url || '/placeholder-cover.jpg');
    }, [story]);

    const handleImageError = () => {
        // If landscape fails, try standard cover. If that fails (or was already active), placeholder.
        if (imgSrc === story.cover_landscape_url && story.cover_url) {
            setImgSrc(story.cover_url);
        } else {
            setImgSrc('/placeholder-cover.jpg');
        }
    };

    const handlePlayToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (active) {
            pause();
        } else {
            play(story);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl group cursor-pointer mb-12"
            onClick={() => play(story)}
        >
            {/* Background Image */}
            <img
                src={imgSrc}
                onError={handleImageError}
                alt={story.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full md:w-2/3">
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium text-white uppercase tracking-wider border border-white/10">
                        Featured • {story.category.replace('_', ' ')}
                    </span>
                    <span className="text-white/70 text-xs font-medium">
                        {formatDuration(story.duration)}
                    </span>
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">
                    {story.title}
                </h2>

                <p className="text-white/80 line-clamp-2 mb-6 text-sm md:text-base max-w-lg">
                    {cleanDescription(story.description)}
                </p>

                <button
                    onClick={handlePlayToggle}
                    className="flex items-center gap-3 px-6 py-3 bg-white text-slate-900 rounded-full font-bold hover:bg-indigo-50 transition-colors shadow-lg hover:shadow-indigo-500/20 active:scale-95 transform duration-100"
                >
                    {active ? (
                        <>
                            <Pause className="w-5 h-5 fill-current" />
                            Pause
                        </>
                    ) : (
                        <>
                            <Play className="w-5 h-5 fill-current" />
                            Play Now
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
}
