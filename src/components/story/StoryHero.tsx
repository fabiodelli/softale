'use client';

import React from 'react';
import { Story } from '@/lib/supabase';
import Image from 'next/image';
import { Play, Clock, Tag, Pause } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { motion } from 'framer-motion';

interface StoryHeroProps {
    story: Story;
}

export default function StoryHero({ story }: StoryHeroProps) {
    const { play, currentStory, isPlaying, pause } = usePlayer();

    // Check if this specific story is currently active
    const isActive = currentStory?.id === story.id;
    const isCurrentlyPlaying = isActive && isPlaying;

    const handlePlayClick = () => {
        if (isCurrentlyPlaying) {
            pause();
        } else {
            play(story);
        }
    };

    return (
        <div className="relative w-full aspect-square md:aspect-video lg:aspect-[21/9] rounded-[2rem] overflow-hidden shadow-2xl group border border-white/10">
            {/* Background Image - Full Cover */}
            <Image
                src={story.cover_landscape_url || story.cover_url}
                alt={story.title}
                fill
                className="object-cover transition-transform duration-[2s] group-hover:scale-105"
                priority
            />

            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-transparent to-transparent" />

            {/* Content Container */}
            <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-end">
                <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">

                    {/* Left: Metadata & Title */}
                    <div className="space-y-4 md:space-y-6 flex-1">
                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                                {story.category.replace(/_/g, ' ')}
                            </span>
                            {story.is_premium && (
                                <span className="px-3 py-1 rounded-full bg-amber-500/80 backdrop-blur-md border border-amber-400/30 text-white text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                                    Premium
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white leading-[1.1] drop-shadow-lg"
                        >
                            {story.title}
                        </motion.h1>

                        {/* Description & Meta */}
                        <div className="space-y-4">
                            <p className="text-slate-200 text-lg md:text-xl font-light leading-relaxed max-w-2xl drop-shadow-md">
                                {story.description}
                            </p>

                            <div className="flex items-center gap-6 text-slate-300 text-sm font-medium">
                                <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                    <Clock className="w-4 h-4 text-indigo-400" />
                                    <span>{Math.floor(story.duration / 60)} min</span>
                                </div>
                                {story.author && (
                                    <div className="flex items-center gap-2">
                                        {story.author_image_url && (
                                            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
                                                <Image
                                                    src={story.author_image_url}
                                                    alt={story.author}
                                                    width={24}
                                                    height={24}
                                                    className="object-cover"
                                                />
                                            </div>
                                        )}
                                        <span>Narrato da <span className="text-white">{story.author}</span></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex-shrink-0">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handlePlayClick}
                            className={`
                                flex items-center gap-4 px-8 py-5 rounded-full font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)]
                                ${isCurrentlyPlaying
                                    ? 'bg-slate-900/80 text-white border border-white/20 backdrop-blur-md hover:bg-slate-800' // Pause state
                                    : 'bg-white text-slate-900 hover:bg-indigo-50' // Play state
                                }
                            `}
                        >
                            {isCurrentlyPlaying ? (
                                <>
                                    <Pause className="w-6 h-6 fill-current" />
                                    <span>In Riproduzione</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
                                        <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                                    </div>
                                    <span className="pr-2">Riproduci Storia</span>
                                </>
                            )}
                        </motion.button>
                    </div>

                </div>
            </div>
        </div>
    );
}
