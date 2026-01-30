'use client';

import { usePlayer, LoopDuration } from '@/context/PlayerContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

import MixerControl from './MixerControl';

export default function MiniPlayer() {
    const router = useRouter();
    const pathname = usePathname();
    const {
        currentStory,
        isPlaying,
        toggle,
        currentTime,
        duration,
        next,
        previous,
        queue,
        queueIndex,
        collectionSlug,
        isLoopable,
        hasStems, // New V6 Check
        loopDuration,
        totalLoopTime,
        setLoopDuration,
        isMobilePlayerOpen,
        toggleMobilePlayer
    } = usePlayer();

    const [showDurationDropdown, setShowDurationDropdown] = useState(false);
    const [showMixer, setShowMixer] = useState(false); // New Mixer State
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDurationDropdown(false);
                // setShowMixer(false); // Optional: if we want click outside to close mixer too
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!currentStory) return null;

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const formatLoopTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const durationOptions: { value: LoopDuration; label: string }[] = [
        { value: 15, label: '15 min' },
        { value: 30, label: '30 min' },
        { value: 60, label: '1 ora' },
        { value: 120, label: '2 ore' },
        { value: 0, label: '∞ Loop' },
    ];

    const currentDurationLabel = durationOptions.find(d => d.value === loopDuration)?.label || '∞ Loop';

    const handleTrackClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isLoopable) {
            // If loopable, toggle the duration dropdown
            setShowDurationDropdown(!showDurationDropdown);
        }
    };

    // Context-aware navigation: if on collection page, go home; otherwise go to collection
    const isOnCollectionPage = pathname?.startsWith('/collection/');
    const handleContextNavigation = () => {
        if (isOnCollectionPage) {
            router.push('/');
        } else if (collectionSlug) {
            router.push(`/collection/${collectionSlug}`);
        }
    };



    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                className={`fixed left-0 right-0 z-[59] transition-all duration-300
                    md:bottom-0 
                    ${isMobilePlayerOpen ? 'bottom-[calc(75px+env(safe-area-inset-bottom))] opacity-100 translate-y-0' : 'bottom-[calc(75px+env(safe-area-inset-bottom))] opacity-0 translate-y-10 pointer-events-none md:opacity-100 md:translate-y-0 md:pointer-events-auto'}
                `}
            >

                {/* Mini Player Content */}
                <div className="h-[80px] md:h-[90px] bg-white/90 backdrop-blur-2xl border-t border-white/40 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] flex items-center px-4 md:px-8 relative z-30">
                    <div className="max-w-7xl mx-auto w-full grid grid-cols-[1fr_auto_1fr] items-center gap-4">

                        {/* LEFT: Track Info */}
                        <div className="flex items-center gap-4 min-w-0 justify-start">
                            <div
                                className="relative w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 group cursor-pointer shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const slug = currentStory.slug || currentStory.id;
                                    router.push(`/story/${slug}`);
                                }}
                            >
                                {currentStory.cover_url ? (
                                    <img
                                        src={currentStory.cover_url}
                                        alt={currentStory.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-300">
                                        <span className="text-xl md:text-2xl">🎧</span>
                                    </div>
                                )}
                                {/* Overlay Icon */}
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white font-medium text-[10px] md:text-xs tracking-wider uppercase">View</span>
                                </div>
                            </div>

                            <div
                                className={`flex flex-col min-w-0 pr-2 ${isLoopable ? 'cursor-pointer group' : ''}`}
                                onClick={(e) => {
                                    if (isLoopable) handleTrackClick(e);
                                    else {
                                        e.stopPropagation();
                                        const slug = currentStory.slug || currentStory.id;
                                        router.push(`/story/${slug}`);
                                    }
                                }}
                            >
                                <p className="font-bold text-sm md:text-base text-slate-900 truncate group-hover:text-indigo-600 transition-colors max-w-[120px] md:max-w-none">
                                    {currentStory.title}
                                </p>
                                <p className="text-[10px] md:text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                                    {currentStory.author && <span className="hidden md:inline">{currentStory.author}</span>}
                                    {isLoopable ? (
                                        <span className="flex items-center gap-1.5 text-indigo-600 px-1.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100">
                                            <span className="animate-pulse text-[10px]">●</span> Loop
                                        </span>
                                    ) : (
                                        <span className="tabular-nums opacity-70">
                                            {formatTime(currentTime)} / {formatTime(duration)}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* CENTER: Playback Controls */}
                        <div className="flex items-center justify-center gap-6">
                            <button
                                onClick={(e) => { e.stopPropagation(); previous(); }}
                                disabled={queueIndex <= 0}
                                className={`hidden md:flex w-10 h-10 rounded-full items-center justify-center transition hover:bg-slate-100 ${queueIndex > 0 ? 'text-slate-500 hover:text-slate-900' : 'text-slate-300 cursor-not-allowed'}`}
                            >
                                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); toggle(); }}
                                className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-900 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/20"
                            >
                                {isPlaying ? (
                                    <svg className="w-6 h-6 md:w-7 md:h-7 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                ) : (
                                    <svg className="w-7 h-7 md:w-8 md:h-8 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                )}
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); next(); }}
                                disabled={queueIndex >= queue.length - 1}
                                className={`hidden md:flex w-10 h-10 rounded-full items-center justify-center transition hover:bg-slate-100 ${queueIndex < queue.length - 1 ? 'text-slate-500 hover:text-slate-900' : 'text-slate-300 cursor-not-allowed'}`}
                            >
                                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                            </button>
                        </div>

                        {/* RIGHT: Extra Controls */}
                        <div className="flex items-center gap-3 justify-end">

                            {/* Go to Detail Button (Replaces Mixer Toggle) - Visible on Mobile too if space permits, or rely on image click */}
                            {hasStems && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const slug = currentStory.slug || currentStory.id;
                                        router.push(`/story/${slug}`);
                                    }}
                                    className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100 hover:bg-white hover:shadow-md border border-slate-200 text-slate-600 hover:text-indigo-600 transition-all group"
                                    title="Open Story & Mixer"
                                >
                                    <span className="text-lg group-hover:scale-110 transition-transform">🎚️</span>
                                    <span className="text-xs font-semibold hidden md:inline">Mixer</span>
                                </button>
                            )}

                            {/* Loop Duration - VISIBLE ON MOBILE */}
                            {isLoopable && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowDurationDropdown(!showDurationDropdown); }}
                                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-md text-slate-600 hover:text-indigo-600 transition-all font-medium text-xs md:text-sm"
                                >
                                    <span>{currentDurationLabel.replace(' Loop', '')}</span>
                                    <svg className={`w-3 h-3 md:w-4 md:h-4 transition-transform ${showDurationDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>



                {/* Mobile Header Mixer Button (Absolute Positioned for Mobile Layout) */}
                {hasStems && (
                    <div className="md:hidden absolute top-[-50px] right-4 z-40">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const slug = currentStory.slug || currentStory.id;
                                router.push(`/story/${slug}`);
                            }}
                            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center text-xl border border-white/20"
                            title="Open Mixer"
                        >
                            🎚️
                        </button>
                    </div>
                )}


                {/* Mobile Loop Duration Dropdown (Portal/Overlay style) */}
                {isLoopable && (
                    <AnimatePresence>
                        {showDurationDropdown && (
                            <>
                                {/* Backdrop for Mobile */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={(e) => { e.stopPropagation(); setShowDurationDropdown(false); }}
                                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] md:hidden"
                                />

                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className={`
                                        fixed bottom-24 left-4 right-4 md:absolute md:bottom-20 md:right-4 md:left-auto md:w-48
                                        bg-white rounded-2xl md:rounded-lg shadow-2xl md:shadow-xl border border-slate-200 
                                        py-2 px-1 z-[60] overflow-hidden
                                    `}
                                >
                                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between md:hidden">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Duration</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowDurationDropdown(false); }}
                                            className="p-1 bg-slate-100 rounded-full text-slate-500"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    {durationOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setLoopDuration(option.value);
                                                setShowDurationDropdown(false);
                                            }}
                                            className={`w-full px-4 py-3 md:py-2 text-left text-sm rounded-xl md:rounded-md transition flex items-center justify-between
                                                ${loopDuration === option.value ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}
                                            `}
                                        >
                                            <span>{option.label}</span>
                                            {loopDuration === option.value && <span className="text-indigo-500">✓</span>}
                                        </button>
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                )}
            </motion.div>
        </AnimatePresence >
    );
}
