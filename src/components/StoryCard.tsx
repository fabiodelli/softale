import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Story, toggleFavorite, checkIsFavorite } from '@/lib/supabase';
import { cleanDescription, formatDuration, isLoopable } from '@/lib/formatters';
import Link from 'next/link';
import { Play, Pause, Heart, Infinity, Clock } from 'lucide-react';

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
                className={`group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${className}`}
                onClick={handlePlay}
            >
                {/* Background Image - Full Width */}
                <div className="absolute inset-0">
                    {imageUrl ? (
                        <img src={imageUrl} alt={story.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-6xl">🎧</div>
                    )}
                    {/* Gradient Overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
                </div>

                {/* Content Container */}
                <div className="relative flex items-center gap-4 md:gap-6 p-4 md:p-6 min-h-[120px] md:min-h-[160px] lg:min-h-[200px]">
                    {/* Thumbnail (Optional - for visual balance) */}
                    <div className="relative w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 flex-shrink-0 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
                        {imageUrl ? (
                            <img src={imageUrl} alt={story.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">🎧</div>
                        )}

                        {/* Play Overlay */}
                        <div className={`absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                                {isActive ? <Pause className="w-5 h-5 md:w-6 md:h-6 fill-slate-900 text-slate-900" /> : <Play className="w-5 h-5 md:w-6 md:h-6 fill-slate-900 text-slate-900 ml-0.5" />}
                            </div>
                        </div>
                    </div>

                    {/* Info (Right) */}
                    <div className="flex-1 min-w-0 py-2">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] md:text-xs uppercase tracking-wider font-bold px-2 py-1 rounded-lg ${categoryColor} shadow-sm`}>
                                {story.category?.replace(/_/g, ' ') || 'Story'}
                            </span>
                            {story.is_premium && (
                                <span className="text-[10px] md:text-xs bg-amber-400/90 text-amber-900 px-2 py-1 rounded-lg font-bold flex items-center gap-1 shadow-sm">
                                    ✨ PREMIUM
                                </span>
                            )}
                        </div>

                        <h3 className={`font-black text-xl md:text-3xl lg:text-4xl leading-tight mb-2 md:mb-3 transition-all text-white drop-shadow-lg ${isActive ? 'text-indigo-300' : 'group-hover:text-indigo-200'}`}>
                            {story.title}
                        </h3>

                        <div className="flex items-center gap-4 text-sm md:text-base font-semibold text-white/80">
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {formattedDuration}
                            </span>
                            {isFavorite && (
                                <span className="flex items-center gap-1.5">
                                    <Heart className="w-4 h-4 fill-red-400 text-red-400" />
                                    Favorite
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Desktop Action (Heart) */}
                    <button
                        onClick={handleFavoriteClick}
                        disabled={favoriteLoading}
                        className={`hidden md:flex p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition shadow-lg ${isFavorite ? 'text-red-400' : 'text-white/60 hover:text-red-400'}`}
                    >
                        <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                </div>
            </div>
        );
    }

    const Content = (
        <div className={`group cursor-pointer flex flex-col gap-3 ${className}`} onClick={handlePlay}>
            {/* Image Container */}
            <div className={`relative rounded-xl overflow-hidden transition-all duration-500 border border-slate-100 
                ${aspectClasses[aspectRatio]}
                ${isActive
                    ? 'ring-2 ring-indigo-500 ring-offset-2 shadow-lg'
                    : 'shadow-md hover:shadow-xl hover:-translate-y-0.5'
                }
            `}>
                {/* Image Layer */}
                <div className="absolute inset-0">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={story.title}
                            className={`w-full h-full object-cover transition-transform duration-1000 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                            <span className="text-3xl opacity-20">🎧</span>
                        </div>
                    )}
                </div>

                {/* Subtle Gradient for readability of white icons (Heart) */}
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Premium Badge - Top Left (On Image) */}
                {story.is_premium && (
                    <div className="absolute top-2.5 left-2.5 z-20">
                        <span className="text-[10px] bg-black/60 text-amber-300 px-1.5 py-0.5 rounded-md font-bold backdrop-blur-md flex items-center gap-1 border border-amber-500/30 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </span>
                    </div>
                )}

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

                {/* Play Button Overlay - HIDDEN (User Request: "Senza mostrare play e pausa") */}
                {/* We strictly rely on the Pulse/Glow + Scale to indicate state */}

                {/* Rank Number (if provided) */}
                {rank && (
                    <div className="absolute -top-4 -left-2 z-20 font-black text-6xl md:text-7xl text-white/10 drop-shadow-sm select-none pointer-events-none">
                        <span className="stroke-text" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.3)', color: 'transparent' }}>{rank}</span>
                    </div>
                )}

                {/* Progress Bar (if provided) */}
                {progress !== undefined && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
                        <div
                            className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Info Container (Outside) */}
            <div>
                <h3 className={`font-bold text-base leading-tight mb-1.5 line-clamp-2 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-900 group-hover:text-indigo-600'}`}>
                    {story.title}
                </h3>

                <div className="flex items-center gap-2">
                    {/* Author Avatar */}
                    <div className="w-5 h-5 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-100">
                        {story.author_image_url ? (
                            <img src={story.author_image_url} alt={story.author} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-[8px] text-indigo-600 font-bold">
                                {(story.author || 'S').charAt(0)}
                            </div>
                        )}
                    </div>
                    {/* Author Name */}
                    <span className="text-xs font-medium text-slate-500 truncate">
                        {story.author || 'Softale'}
                    </span>
                    {/* Optional: Dot + Duration if space */}
                    {/* <span className="text-[10px] text-slate-300">•</span>
                    <span className="text-xs text-slate-400">{formattedDuration}</span> */}
                </div>
            </div>
        </div>
    );

    // Always return content, click handles play
    return Content;
}

