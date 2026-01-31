import { Story } from '@/lib/supabase';
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/lib/AuthProvider';
import { usePremiumModal } from '@/lib/usePremiumModal';
import { useRouter } from 'next/navigation';
import { cleanDescription, formatDuration } from '@/lib/formatters';
import { Play, Pause, Lock, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import StoryOptionsModal from './modals/StoryOptionsModal';

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

    const [showOptions, setShowOptions] = useState(false);

    const handlePlayToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!user) {
            router.push('/login');
            return;
        }

        if (isLocked) {
            openPremiumModal();
            return;
        }

        if (active) {
            pause();
        } else {
            // Simply call play with the story. 
            // The store handles queue reset and loading state.
            await play(story);
        }
    };

    const handlePremiumClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        openPremiumModal();
    };

    const handleOptionsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            router.push('/login');
            return;
        }
        setShowOptions(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full relative mb-6 group"
        >
            {/* MOBILE: Simple transparent layout */}
            <div className="md:hidden flex flex-col gap-3">
                {/* Image */}
                <div
                    className={`relative w-full aspect-video rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-lg transition-all
                        ${active ? 'ring-2 ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-[1.01]' : ''}
                    `}
                    onClick={handlePlayToggle}
                >
                    <Image
                        src={imgSrc}
                        onError={handleImageError}
                        alt={story.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                    />
                    {/* Gradient for text readability */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                    {/* Mobile Badges & Actions */}
                    {story.is_premium && (
                        <div className="absolute top-2 left-2 z-20">
                            <button onClick={handlePremiumClick} className="p-1.5 rounded-full bg-black/40 text-amber-400 backdrop-blur-md border border-amber-500/30 shadow-sm">
                                <Lock className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {/* Mobile Actions: Only Visible on Play/Active */}
                    {active && (
                        <div className="absolute top-2 right-2 z-20">
                            <button
                                onClick={handleOptionsClick}
                                className="p-1.5 rounded-full bg-black/40 text-white border border-white/10 backdrop-blur-md"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="px-1">
                    <h2 className="text-2xl font-extrabold text-slate-900 leading-tight line-clamp-2 mb-2">
                        {story.title}
                    </h2>
                    <div className="flex items-center gap-2">
                        <div className="relative w-5 h-5 rounded-full overflow-hidden bg-slate-200 border border-slate-100 shadow-sm">
                            <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-[9px] text-indigo-600 font-bold">
                                {(story.narrator?.[0] || 'S').toUpperCase()}
                            </div>
                        </div>
                        <span className="text-sm font-semibold text-slate-600">{story.narrator || 'Softale Production'}</span>
                    </div>
                </div>
            </div>

            {/* DESKTOP: Premium gradient overlay design */}
            <div
                className={`hidden md:block relative overflow-hidden rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl cursor-pointer group
                    ${active ? 'ring-4 ring-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.4)] scale-[1.02]' : 'border border-white/5'}
                `}
                onClick={handlePlayToggle}
            >
                {/* Background Image - Full Width */}
                <div className="absolute inset-0">
                    <Image
                        src={imgSrc}
                        onError={handleImageError}
                        alt={story.title}
                        fill
                        className={`object-cover transition-transform duration-700 group-hover:scale-105
                            ${active ? 'scale-105' : ''}
                        `}
                        sizes="100vw"
                        priority
                    />
                    {/* Light Transparent Overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/20 to-black/10"></div>
                </div>

                {/* Actions (Top Right) - Visible on Hover */}
                <div className="absolute top-6 right-6 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={handleOptionsClick}
                        className="p-2.5 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-black/50 transition-colors border border-white/10 shadow-lg"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Container */}
                <div className="relative flex items-center gap-6 p-8 min-h-[240px]">
                    {/* Thumbnail */}
                    <div className={`relative w-40 lg:w-48 h-40 lg:h-48 flex-shrink-0 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border-2 shadow-2xl
                         ${active ? 'border-indigo-500/50' : 'border-white/20'}
                    `}>
                        <Image
                            src={imgSrc}
                            onError={handleImageError}
                            alt={story.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 160px, 192px"
                        />

                        {/* Premium Badge on Thumbnail */}
                        {story.is_premium && (
                            <div className="absolute top-2 left-2 z-20">
                                <button onClick={handlePremiumClick} className="p-1.5 rounded-lg bg-black/60 text-amber-400 backdrop-blur-md border border-amber-500/30 shadow-sm flex items-center justify-center hover:bg-black/80 transition-colors">
                                    <Lock className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Play/Pause Overlay */}
                        <div className={`absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-xl">
                                {active ? (
                                    <Pause className="w-8 h-8 fill-slate-900 text-slate-900" />
                                ) : (
                                    <Play className="w-8 h-8 fill-slate-900 text-slate-900 ml-1" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Info Container */}
                    <div className="flex-1 flex flex-col justify-center items-start gap-3">
                        {/* Category Badge */}
                        {story.category && (
                            <span className="text-sm uppercase tracking-wider font-bold px-3 py-1.5 rounded-lg bg-indigo-500/90 text-white shadow-lg">
                                {story.category.replace(/_/g, ' ')}
                            </span>
                        )}

                        {/* Title */}
                        <h2 className={`text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight line-clamp-2 transition-all drop-shadow-2xl ${active ? 'text-indigo-200' : 'text-white group-hover:text-indigo-100'}`}>
                            {story.title}
                        </h2>

                        {/* Author Info */}
                        <div className="flex items-center gap-3">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm border-2 border-white/30 shadow-lg">
                                <div className="w-full h-full flex items-center justify-center bg-indigo-400 text-xs text-white font-bold">
                                    {(story.narrator?.[0] || 'S').toUpperCase()}
                                </div>
                            </div>
                            <span className="text-base font-semibold text-white/90 drop-shadow-lg">{story.narrator || 'Softale Production'}</span>
                        </div>

                        {/* Premium Label */}
                        {story.is_premium && (
                            <span className="text-sm bg-amber-400/90 text-amber-900 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-lg mt-1">
                                ✨ PREMIUM
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <StoryOptionsModal
                isOpen={showOptions}
                onClose={() => setShowOptions(false)}
                storyId={story.id}
                storyTitle={story.title}
            />
        </motion.div>
    );
}
