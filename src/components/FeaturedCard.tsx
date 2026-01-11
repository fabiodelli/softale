
'use client';

import { Story } from '@/lib/supabase';
import { usePlayer } from '@/lib/PlayerContext';
import { useAuth } from '@/lib/AuthProvider'; // Added
import { usePremiumModal } from '@/lib/usePremiumModal'; // Added
import { useRouter } from 'next/navigation'; // Added
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

    const { user, profile } = useAuth();
    const router = useRouter();
    const { open: openPremiumModal } = usePremiumModal();
    const isLocked = story.is_premium && !profile?.is_premium;

    const handlePlayToggle = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!user) {
            router.push('/login');
            return;
        }

        if (isLocked) {
            // router.push('/upgrade'); // Or open modal
            openPremiumModal();
            return;
        }

        if (active) {
            pause();
        } else {
            play(story);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full relative mb-6 group"
        >
            {/* 
              Responsive Container:
              - Mobile: Transparent stack.
              - Desktop: Glassmorphic Box, Compact Height (to match standard cards).
            */}
            <div className={`relative flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 transition-all duration-500
                md:rounded-2xl md:border md:p-4
                ${active
                    ? 'md:bg-white/80 md:backdrop-blur-2xl md:border-indigo-100 md:shadow-[0_10px_30px_-10px_rgba(99,102,241,0.2)]'
                    : 'md:bg-white/60 md:backdrop-blur-xl md:border-slate-100 md:shadow-lg md:hover:shadow-xl md:hover:bg-white/70'
                }`}
            >
                {/* Image Container - Fixed Height on Desktop (Visual Alignment) */}
                <div
                    className={`relative w-full md:w-auto md:h-48 lg:h-56 aspect-video rounded-xl overflow-hidden cursor-pointer transition-all duration-700
                    ${active
                            ? 'animate-pulse scale-[0.98] shadow-inner'
                            : 'shadow-md hover:shadow-lg hover:-translate-y-0.5'
                        }`}
                    onClick={handlePlayToggle}
                >
                    {/* Background Image */}
                    <img
                        src={imgSrc}
                        onError={handleImageError}
                        alt={story.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />

                    {/* Gradient for Depth */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 md:h-1/3 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
                </div>

                {/* Info Container */}
                <div className="flex-1 flex flex-col justify-center items-start gap-1 md:gap-2 px-1 md:px-0 w-full">
                    {/* Title */}
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-[1.1] tracking-tight line-clamp-2">
                        {story.title}
                    </h2>

                    {/* Author Info */}
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-5 h-5 md:w-6 md:h-6 rounded-full overflow-hidden bg-slate-200 border border-slate-100 shadow-sm">
                            {story.author_image_url ? (
                                <img src={story.author_image_url} alt={story.author} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-[9px] text-indigo-600 font-bold">S</div>
                            )}
                        </div>
                        <span className="text-sm font-semibold text-slate-500">{story.author || 'Softale Production'}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
