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
                <div className="h-[64px] bg-white/80 backdrop-blur-xl border-t border-white/20 shadow-lg flex items-center px-4 relative z-30">
                    <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">

                        {/* Track Info (Clickable for Loops) */}
                        <div
                            className={`flex items-center gap-3 flex-1 min-w-0 group ${isLoopable ? 'cursor-pointer' : 'cursor-default'}`}
                            onClick={handleTrackClick}
                        >
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 group-hover:ring-2 ring-indigo-500/50 transition shadow-sm">
                                {currentStory.cover_url ? (
                                    <img
                                        src={currentStory.cover_url}
                                        alt={currentStory.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-400">
                                        <span className="text-xl">🎧</span>
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-sm text-slate-800 truncate group-hover:text-indigo-600 transition">
                                    {currentStory.title}
                                </p>
                                <p className="text-xs text-slate-500 truncate font-medium">
                                    {isLoopable ? (
                                        <span className="flex items-center gap-1 text-indigo-500">
                                            <span className="animate-pulse">∞</span> Infinite Loop
                                        </span>
                                    ) : (
                                        `${formatTime(currentTime)} / ${formatTime(duration)}`
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2 md:gap-4">
                            <button
                                onClick={(e) => { e.stopPropagation(); previous(); }}
                                disabled={queueIndex <= 0}
                                className={`w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center transition hidden sm:flex ${queueIndex > 0 ? 'hover:bg-slate-200 text-slate-600 hover:text-slate-900' : 'opacity-50 cursor-not-allowed text-slate-300'}`}
                            >
                                <span className="text-lg">⏮</span>
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); toggle(); }}
                                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-800 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-slate-900/10"
                            >
                                <span className={`text-xl md:text-2xl text-white ${isPlaying ? '' : 'ml-1'}`}>
                                    {isPlaying ? '⏸' : '▶'}
                                </span>
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); next(); }}
                                disabled={queueIndex >= queue.length - 1}
                                className={`w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center transition hidden sm:flex ${queueIndex < queue.length - 1 ? 'hover:bg-slate-200 text-slate-600 hover:text-slate-900' : 'opacity-50 cursor-not-allowed text-slate-300'}`}
                            >
                                <span className="text-lg">⏭</span>
                            </button>
                        </div>

                        {/* Right Side Controls & Config */}
                        <div className="hidden md:flex items-center gap-3 flex-1 justify-end relative">

                            {/* Mixer Toggle (Only V6) */}
                            {hasStems && (
                                <div className="relative">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowMixer(!showMixer); }}
                                        className={`flex items-center justify-center w-10 h-10 rounded-full transition ${showMixer ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                        title="Audio Mixer"
                                    >
                                        <span className="text-lg">🎚️</span>
                                    </button>
                                    {/* Desktop Popover */}
                                    {showMixer && (
                                        <div
                                            className="absolute bottom-full right-0 mb-4 z-[60]"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MixerControl onClose={() => setShowMixer(false)} />
                                        </div>
                                    )}
                                </div>
                            )}


                            {/* Desktop Duration Button */}
                            {isLoopable && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowDurationDropdown(!showDurationDropdown); }}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium transition"
                                >
                                    <span className="text-base">🔁</span>
                                    <span>{currentDurationLabel}</span>
                                    {loopDuration > 0 && (
                                        <span className="text-indigo-500 text-xs">
                                            ({formatLoopTime(totalLoopTime)} / {formatLoopTime(loopDuration * 60)})
                                        </span>
                                    )}
                                    <svg className={`w-4 h-4 transition-transform ${showDurationDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            )}

                            {/* Collection/Home Button */}
                            {collectionSlug && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleContextNavigation(); }}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition"
                                >
                                    <span>{isOnCollectionPage ? 'Home' : 'Collection'}</span>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Mixer Modal (Separate from layout to ensure z-index) */}
                {showMixer && hasStems && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] md:hidden flex items-end justify-center pb-8 p-4"
                        onClick={() => setShowMixer(false)}
                    >
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full"
                        >
                            <MixerControl onClose={() => setShowMixer(false)} className="mx-auto" />
                        </motion.div>
                    </div>
                )}

                {/* Mobile Header Mixer Button (Absolute Positioned for Mobile Layout) */}
                {hasStems && (
                    <div className="md:hidden absolute top-[-50px] right-4 z-40">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowMixer(!showMixer); }}
                            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center text-xl border border-white/20"
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
