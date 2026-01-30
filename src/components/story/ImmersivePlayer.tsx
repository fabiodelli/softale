'use client';

import React, { useState } from 'react';
import { Story } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Settings2, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import Navbar from '@/components/Navbar';
import SubtitleOverlay from '@/components/story/SubtitleOverlay';
import StemMixerModal from '@/components/story/StemMixerModal';
import { motion } from 'framer-motion';

interface ImmersivePlayerProps {
    story: Story;
}

export default function ImmersivePlayer({ story }: ImmersivePlayerProps) {
    const router = useRouter();
    const { isPlaying, toggle, currentStory, play, next, previous } = usePlayer();
    const [isMixerOpen, setIsMixerOpen] = useState(false);

    // Ensure we are playing *this* story if we land here?
    // Or just show controls for global player?
    // Ideally, if I visit the page, I want to see info about THIS story.
    // If it's playing, show play state.
    const isCurrentStory = currentStory?.id === story.id;
    const isActive = isCurrentStory && isPlaying;

    const handlePlayPause = () => {
        if (isCurrentStory) {
            toggle();
        } else {
            play(story);
        }
    };

    const bgImage = story.cover_landscape_url || story.cover_url;
    // Fallback text if no script
    const narrationText = story.script_text || story.description;

    return (
        <div className="fixed inset-0 bg-slate-900 overflow-hidden text-white">
            {/* Background Image (Ken Burns Effect) */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={bgImage}
                    alt={story.title}
                    fill
                    className="object-cover opacity-60 scale-105 animate-slow-pan"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-transparent" />
            </div>

            {/* Navbar for transparent overlay */}
            <div className="absolute top-0 w-full z-50">
                <Navbar transparent />
            </div>

            {/* Top Bar (Mobile Back + Title) */}
            <div className="absolute top-24 left-0 w-full px-6 flex justify-between items-start z-40 pointer-events-none">
                <button
                    onClick={() => router.back()}
                    className="pointer-events-auto p-2 rounded-full bg-black/20 backdrop-blur-md hover:bg-black/40 transition text-white/80"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
            </div>

            {/* Main Content Area - Centered Subtitles */}
            <SubtitleOverlay text={narrationText} isPremium={story.is_premium} />

            {/* Bottom Controls Area */}
            <div className="absolute bottom-0 w-full z-50 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent pb-8 pt-24 px-6 md:px-12">
                <div className="max-w-4xl mx-auto flex flex-col gap-6">

                    {/* Story Meta */}
                    <div className="text-center">
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-2xl md:text-4xl font-bold font-serif mb-2 drop-shadow-lg"
                        >
                            {story.title}
                        </motion.h1>
                        <p className="text-white/60 text-sm md:text-base font-medium uppercase tracking-wider">
                            {story.author}
                        </p>
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between">
                        {/* Left: Dummy/Spacer or Loop */}
                        <div className="w-12" />

                        {/* Center: Playback */}
                        <div className="flex items-center gap-6">
                            <button onClick={previous} className="text-white/60 hover:text-white transition">
                                <SkipBack className="w-8 h-8" />
                            </button>

                            <button
                                onClick={handlePlayPause}
                                className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 transition shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                            >
                                {isActive ? (
                                    <Pause className="w-8 h-8 md:w-10 md:h-10 fill-current" />
                                ) : (
                                    <Play className="w-8 h-8 md:w-10 md:h-10 fill-current ml-1" />
                                )}
                            </button>

                            <button onClick={next} className="text-white/60 hover:text-white transition">
                                <SkipForward className="w-8 h-8" />
                            </button>
                        </div>

                        {/* Right: Mixer Toggle */}
                        <button
                            onClick={() => setIsMixerOpen(true)}
                            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition border border-white/20"
                            title="Open Mixer"
                        >
                            <Settings2 className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <StemMixerModal isOpen={isMixerOpen} onClose={() => setIsMixerOpen(false)} />
        </div>
    );
}
