import { useState } from 'react';
import { Story } from '@/lib/supabase';
import { formatDuration } from '@/lib/formatters';
import Image from 'next/image';
import { Play, Pause, MoreVertical } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';
import StoryOptionsModal from '../modals/StoryOptionsModal';
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from '@/config/theme';

interface StoryCardHorizontalProps {
    story: Story;
    onClick?: () => void;
    className?: string;
    // Horizontal specific props only if needed, but keeping interface consistent helps
}

export default function StoryCardHorizontal({ story, onClick, className = '' }: StoryCardHorizontalProps) {
    // Optimized: Use selectors
    const play = usePlayerStore(state => state.play);
    const pause = usePlayerStore(state => state.pause);
    const currentStory = usePlayerStore(state => state.currentStory);
    const isPlaying = usePlayerStore(state => state.isPlaying);
    const status = usePlayerStore(state => state.status);

    const { user } = useAuth();
    const router = useRouter();
    const [showOptions, setShowOptions] = useState(false);

    // Active state: Also active while LOADING to prevent flicker
    const isCurrent = currentStory?.id === story.id;
    const isActive = isCurrent && (isPlaying || status === 'LOADING');

    const handlePlay = (e: React.MouseEvent) => {
        e.preventDefault();

        if (onClick) {
            onClick();
            return;
        }

        if (isActive) {
            e.stopPropagation();
            if (status === 'LOADING') return; // Prevent pause during load
            pause();
            return;
        }

        if (!user) {
            router.push('/login');
            return;
        }

        play(story);
    };

    const handleOptionsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            router.push('/login');
            return;
        }
        setShowOptions(true);
    };

    const categoryColor = CATEGORY_COLORS[story.category] || DEFAULT_CATEGORY_COLOR;
    const formattedDuration = formatDuration(story.duration);

    // Determine Image (Horizontal usually uses main cover, but could fallback)
    const imageUrl = story.cover_url;

    return (
        <>
            <div
                className={`group relative overflow-hidden rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${className}`}
            >
                {/* Main Action Button (Accessible Overlay) */}
                <button
                    onClick={handlePlay}
                    className="absolute inset-0 z-10 w-full h-full cursor-pointer opacity-0 focus:opacity-100 focus:ring-2 focus:ring-indigo-500 rounded-3xl outline-none"
                    aria-label={`Play ${story.title}`}
                />

                {/* Background Image - Full Width */}
                <div className="absolute inset-0">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={story.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-6xl">🎧</div>
                    )}
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
                </div>

                {/* Content Container */}
                <div className="relative flex items-center gap-4 md:gap-6 p-4 md:p-6 min-h-[120px] md:min-h-[160px] lg:min-h-[200px]">
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 flex-shrink-0 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={story.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 80px, 144px"
                            />
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

                        <h3 className="font-black text-xl md:text-3xl lg:text-4xl leading-tight mb-2 md:mb-3 transition-all text-white drop-shadow-lg">
                            {story.title}
                        </h3>

                        <div className="flex items-center gap-2 text-xs font-medium text-white/80 [text-shadow:_0_1px_2px_rgb(0_0_0_/_80%)]">
                            <span>{formattedDuration}</span>
                        </div>
                    </div>

                    {/* Unified Action Button */}
                    <div className={`absolute top-4 right-4 z-20 transition-all
                        ${isActive ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100 pointer-events-none md:group-hover:pointer-events-auto'}
                        `}>
                        <button
                            onClick={handleOptionsClick}
                            className="p-2 md:p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition shadow-lg text-white/80 hover:text-white relative z-30"
                            aria-label="Story options"
                        >
                            <MoreVertical className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
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
