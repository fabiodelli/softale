import { useState } from 'react';
import { Story } from '@/lib/supabase';
import { formatDuration } from '@/lib/formatters';
import Image from 'next/image';
import { Play, Pause, Lock, MoreVertical } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';
import { usePremiumModal } from '@/lib/usePremiumModal';
import StoryOptionsModal from '../modals/StoryOptionsModal';

interface StoryCardDefaultProps {
    story: Story;
    onClick?: () => void;
    className?: string;
    aspectRatio?: 'video' | 'portrait' | 'square';
    progress?: number;
    rank?: number;
}

export default function StoryCardDefault({ story, onClick, className = '', aspectRatio = 'square', progress, rank }: StoryCardDefaultProps) {
    // Optimized: Use selectors to avoid re-renders on every progress update
    const play = usePlayerStore(state => state.play);
    const pause = usePlayerStore(state => state.pause);
    const currentStory = usePlayerStore(state => state.currentStory);
    const isPlaying = usePlayerStore(state => state.isPlaying);
    const status = usePlayerStore(state => state.status);

    // We don't subscribe to currentTime here, so this component won't re-render on ticking!

    const { user, profile } = useAuth();
    const router = useRouter();
    const { open: openPremiumModal } = usePremiumModal();
    const [showOptions, setShowOptions] = useState(false);

    // Active state: Also active while LOADING to prevent flicker
    const isCurrent = currentStory?.id === story.id;
    const isActive = isCurrent && (isPlaying || status === 'LOADING');
    const isLocked = story.is_premium && !profile?.is_premium;

    const handlePlay = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!user) {
            router.push('/login');
            return;
        }

        if (isLocked) {
            openPremiumModal();
            return;
        }

        if (isActive && isPlaying) {
            pause();
        } else if (isActive && !isPlaying) {
            // Resume
            await play();
        } else {
            // New Play
            await play(story);
        }
    };

    const handleOptionsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            router.push('/login');
            return;
        }
        setShowOptions(true);
    };

    // Aspect ratio classes
    const aspectClasses = {
        video: 'aspect-video',
        portrait: 'aspect-[2/3]',
        square: 'aspect-square'
    };

    // Determine Main Image
    let imageUrl = story.cover_url;
    if (aspectRatio === 'video' && story.cover_landscape_url) imageUrl = story.cover_landscape_url;
    if (aspectRatio === 'portrait' && story.cover_portrait_url) imageUrl = story.cover_portrait_url;

    return (
        <>
            <div className={`group relative flex flex-col gap-3 ${className}`}>
                {/* Main Action Button (Accessible Overlay for the whole card area) */}
                <button
                    onClick={handlePlay}
                    className="absolute inset-0 z-10 w-full h-full cursor-pointer opacity-0 focus:opacity-100 focus:ring-2 focus:ring-indigo-500 rounded-xl outline-none"
                    aria-label={`Play ${story.title}`}
                />

                {/* Image Container */}
                <div className={`relative rounded-xl overflow-hidden transition-all duration-500 
                    ${aspectClasses[aspectRatio]}
                    ${isActive
                        ? 'border-2 border-indigo-500 shadow-lg'
                        : 'border border-slate-100 shadow-md hover:shadow-xl hover:-translate-y-0.5'
                    }
                `}>
                    {/* Image Layer */}
                    <div className="absolute inset-0">
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={story.title}
                                fill
                                className={`object-cover transition-transform duration-1000 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                <span className="text-3xl opacity-20">🎧</span>
                            </div>
                        )}
                    </div>

                    {/* Subtle Gradient */}
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Premium Badge - Top Left */}
                    {story.is_premium && (
                        <div className="absolute top-2.5 left-2.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openPremiumModal();
                                }}
                                className="p-1.5 rounded-full bg-black/40 text-amber-400 backdrop-blur-md border border-amber-500/30 shadow-sm flex items-center justify-center hover:bg-black/60 transition-colors relative z-30"
                                title="Premium Story"
                                aria-label="Unlock premium story"
                            >
                                <Lock className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {/* Actions - Top Right (Unified) */}
                    <div className={`absolute top-2.5 right-2.5 z-30 transition-all duration-200
                        ${isActive ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100 pointer-events-none md:group-hover:pointer-events-auto'}
                    `}>
                        <button
                            onClick={handleOptionsClick}
                            className="p-1.5 rounded-full bg-black/30 text-white/80 hover:bg-black/50 hover:text-white backdrop-blur-sm transition-all relative z-40"
                            aria-label="Story options"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Rank Number */}
                    {rank && (
                        <div className="absolute -top-4 -left-2 z-20 font-black text-6xl md:text-7xl text-white/10 drop-shadow-sm select-none pointer-events-none">
                            <span className="stroke-text" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.3)', color: 'transparent' }}>{rank}</span>
                        </div>
                    )}

                    {/* Progress Bar (Only shows if explicitly passed via props, DOES NOT rely on store timer) */}
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
                    <h3 className="font-bold text-base leading-tight mb-1.5 line-clamp-2 transition-colors text-slate-900">
                        {story.title}
                    </h3>

                    <div className="flex items-center gap-2">
                        {/* Author Avatar */}
                        <div className="relative w-5 h-5 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-100">
                            <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-[8px] text-indigo-600 font-bold">
                                {(story.narrator?.[0] || 'S').toUpperCase()}
                            </div>
                        </div>
                        {/* Author Name */}
                        <span className="text-xs font-medium text-slate-600 truncate">
                            {story.narrator || 'Softale'}
                        </span>
                    </div>
                </div>
            </div>
            <StoryOptionsModal
                isOpen={showOptions}
                onClose={() => setShowOptions(false)}
                storyId={story.id}
                storyTitle={story.title}
            />
        </>
    );
}
