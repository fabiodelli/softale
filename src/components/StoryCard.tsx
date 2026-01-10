import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Story, toggleFavorite, checkIsFavorite } from '@/lib/supabase';
import { cleanDescription, formatDuration, isLoopable } from '@/lib/formatters';
import Link from 'next/link';
import { Play, Pause, Heart, Infinity } from 'lucide-react';

interface StoryCardProps {
    story: Story;
    onClick?: () => void;
    className?: string;
    aspectRatio?: 'video' | 'portrait' | 'square' | 'horizontal';
    progress?: number; // 0 to 100 for progress bar
    rank?: number; // 1, 2, 3... for Top Charts
}

import { usePlayer } from '@/lib/PlayerContext';
import { useAuth } from '@/lib/AuthProvider';
import { usePremiumModal } from '@/lib/usePremiumModal';
import { useRouter } from 'next/navigation';

export default function StoryCard({ story, onClick, className = '', aspectRatio = 'square', progress, rank }: StoryCardProps) {
    const { play, pause, currentStory, isPlaying } = usePlayer();
    const { user, profile } = useAuth();
    const router = useRouter();
    const { open: openPremiumModal } = usePremiumModal();

    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);

    // Active state
    const isCurrent = currentStory?.id === story.id;
    const isActive = isCurrent && isPlaying;

    // Locked logic: If premium story AND user is NOT premium
    // Note: If profile is loading/null, we might default to locked for safety, or check loading state. 
    // Assuming profile is null if not logged in or just loaded.
    const isLocked = story.is_premium && !profile?.is_premium;

    // Check if story is favorited on mount
    useEffect(() => {
        if (user) {
            checkIsFavorite(user.id, story.id).then(setIsFavorite);
        }
    }, [user, story.id]);

    // Aspect ratio classes
    const aspectClasses = {
        video: 'aspect-video',
        portrait: 'aspect-[2/3]',
        square: 'aspect-square'
    };

    const handlePlay = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent Link if wrapped (though we remove Link)

        if (onClick) {
            onClick();
            return;
        }

        if (isActive) {
            e.stopPropagation();
            pause();
            return;
        }

        if (!user) {
            router.push('/login');
            return;
        }

        if (isLocked) {
            e.stopPropagation();
            router.push('/upgrade');
            return;
        }

        play(story);
    };

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click

        if (!user) {
            router.push('/login');
            return;
        }

        setFavoriteLoading(true);
        const newState = await toggleFavorite(user.id, story.id);
        setIsFavorite(newState);
        setFavoriteLoading(false);
    };

    // Determine Main Image (Prioritize Landscape for Video aspect, Portrait for Portrait aspect)
    let imageUrl = story.cover_url;
    if (aspectRatio === 'video' && story.cover_landscape_url) imageUrl = story.cover_landscape_url;
    if (aspectRatio === 'portrait' && story.cover_portrait_url) imageUrl = story.cover_portrait_url;

    // Remaining time for progress
    const remainingTime = progress ? formatDuration(story.duration - (story.duration * (progress / 100))) : null;
    const formattedDuration = formatDuration(story.duration);
    const showLoop = isLoopable(story.category, story.duration);

    if (aspectRatio === 'horizontal') {
        const categoryColor = (() => {
            const colors: Record<string, string> = {
                sleep: 'bg-indigo-100 text-indigo-700',
                meditation: 'bg-teal-100 text-teal-700',
                fantasy: 'bg-fuchsia-100 text-fuchsia-700',
                nature: 'bg-emerald-100 text-emerald-700',
                soundscape: 'bg-cyan-100 text-cyan-700',
                frequencies: 'bg-purple-100 text-purple-700',
                music_instrumental: 'bg-sky-100 text-sky-700',
                motivation: 'bg-amber-100 text-amber-700',
                work_break: 'bg-orange-100 text-orange-700',
                kids: 'bg-pink-100 text-pink-700'
            };
            return colors[story.category] || 'bg-slate-100 text-slate-700';
        })();

        return (
            <div
                className={`group flex items-center gap-4 p-3 pr-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer ${className}`}
                onClick={handlePlay}
            >
                {/* Image (Left) */}
                <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100">
                    {imageUrl ? (
                        <img src={imageUrl} alt={story.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🎧</div>
                    )}

                    {/* Play Overlay */}
                    <div className={`absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                            {isActive ? <Pause className="w-3.5 h-3.5 fill-slate-900 text-slate-900" /> : <Play className="w-3.5 h-3.5 fill-slate-900 text-slate-900 ml-0.5" />}
                        </div>
                    </div>
                </div>

                {/* Info (Right) */}
                <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md ${categoryColor}`}>
                            {story.category?.replace(/_/g, ' ') || 'Story'}
                        </span>
                        {story.is_premium && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                                PREMIUM
                            </span>
                        )}
                    </div>

                    <h3 className={`font-bold text-base md:text-lg leading-tight truncate mb-1 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-800 group-hover:text-indigo-600'}`}>
                        {story.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                        <span>{formattedDuration}</span>
                        {isFavorite && <Heart className="w-3 h-3 fill-red-500 text-red-500" />}
                    </div>
                </div>

                {/* Desktop Action (Optional, e.g. Heart) */}
                <button
                    onClick={handleFavoriteClick}
                    disabled={favoriteLoading}
                    className={`hidden md:flex p-2 rounded-full hover:bg-slate-50 transition ${isFavorite ? 'text-red-500' : 'text-slate-300 hover:text-red-500'}`}
                >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
            </div>
        );
    }

    const Content = (
        <div
            className={`relative group rounded-xl overflow-hidden cursor-pointer bg-white border border-slate-200/60 shadow-sm hover:shadow-xl transition-all ${aspectClasses[aspectRatio]} ${className}`}
            onClick={handlePlay}
        >
            {/* Image Layer */}
            <div className="absolute inset-0">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={story.title}
                        className={`w-full h-full object-cover transition-transform duration-700 ${isActive ? 'scale-105' : 'group-hover:scale-110'}`}
                    />
                ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <span className="text-3xl opacity-20">🎧</span>
                    </div>
                )}
            </div>

            {/* Gradient Overlay - Always visible but darker at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-70 transition-opacity duration-300" />

            {/* Favorite Heart Button - Top Right */}
            <button
                onClick={handleFavoriteClick}
                disabled={favoriteLoading}
                className={`absolute top-2.5 right-2.5 z-30 p-1.5 rounded-full transition-all duration-200
                    ${isFavorite
                        ? 'bg-red-500/90 text-white shadow-lg'
                        : 'bg-black/30 text-white/80 hover:bg-black/50 hover:text-white backdrop-blur-sm'
                    }
                    ${favoriteLoading ? 'opacity-50' : 'opacity-0 group-hover:opacity-100'}
                    ${isFavorite ? '!opacity-100' : ''}
                `}
            >
                <Heart
                    className={`w-3.5 h-3.5 transition-transform ${favoriteLoading ? 'animate-pulse' : ''}`}
                    fill={isFavorite ? 'currentColor' : 'none'}
                    strokeWidth={2}
                />
            </button>

            {/* Progress Bar (if provided) */}
            {progress !== undefined && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
                    <div
                        className="h-full bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                </div>
            )}

            {/* Rank Number (if provided) - Huge & Stylized */}
            {rank && (
                <div className="absolute -top-4 -left-2 z-20 font-black text-6xl md:text-7xl text-white/10 drop-shadow-sm select-none pointer-events-none">
                    <span className="stroke-text" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.3)', color: 'transparent' }}>{rank}</span>
                </div>
            )}

            {/* Play Overlay (Centered) */}
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none z-30 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <div className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-lg transform transition-transform ${isActive ? 'bg-indigo-600/90 scale-100' : 'bg-white/20 scale-75 group-hover:scale-100'}`}>
                    {isActive ? (
                        <Pause className="w-5 h-5 fill-current" />
                    ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                </div>
            </div>

            {/* Text Content - Positioned Bottom */}
            <div className={`absolute bottom-0 left-0 right-0 p-4 transform transition-transform duration-300 z-20 ${progress ? 'pb-5' : ''}`}> {/* Add padding if progress bar exists */}
                <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-sm backdrop-blur-sm shadow-sm ${(() => {
                        const colors: Record<string, string> = {
                            sleep: 'bg-indigo-500/80 text-white',
                            meditation: 'bg-teal-500/80 text-white',
                            fantasy: 'bg-fuchsia-600/80 text-white',
                            nature: 'bg-emerald-600/80 text-white',
                            soundscape: 'bg-cyan-600/80 text-white',
                            frequencies: 'bg-purple-600/80 text-white',
                            music_instrumental: 'bg-sky-600/80 text-white',
                            motivation: 'bg-amber-500/80 text-white',
                            work_break: 'bg-orange-500/80 text-white',
                            kids: 'bg-pink-500/80 text-white'
                        };
                        return colors[story.category] || 'bg-slate-700/80 text-white';
                    })()
                        }`}>
                        {story.category?.replace(/_/g, ' ') || 'Story'}
                    </span>
                    {story.is_premium && (
                        <span className="ml-1 text-[10px] bg-black/40 text-amber-300 px-1.5 py-0.5 rounded-sm font-bold backdrop-blur-sm shadow-sm flex items-center gap-1 border border-amber-500/30">
                            {/* Logic: If user is premium -> Show nothing or Key? If locked -> Show Lock */}
                            {/* We show Lock if story is premium, visual indicator. Logic handles access. */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            PREMIUM
                        </span>
                    )}
                </div>

                <h3 className="text-white font-bold text-base leading-tight drop-shadow-md line-clamp-2 group-hover:text-white transition-colors">
                    {story.title}
                </h3>

                <div className="flex items-center justify-between mt-2 text-xs text-white/80 font-medium opacity-90 group-hover:opacity-100 transition-opacity">
                    {!['music_instrumental', 'frequencies', 'meditation', 'sleep', 'soundscape'].includes(story.category) && (
                        <span>{remainingTime ? `${remainingTime} left` : formattedDuration}</span>
                    )}
                    {/* For ambient categories, show duration or loop */}
                    {['music_instrumental', 'frequencies', 'meditation', 'sleep', 'soundscape'].includes(story.category) && (
                        <div className="flex items-center gap-1">
                            {showLoop && <Infinity className="w-3 h-3 text-white/70" />}
                            <span>{formattedDuration}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Always return content, click handles play
    return Content;
}

