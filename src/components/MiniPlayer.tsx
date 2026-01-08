'use client';

import { usePlayer, LoopDuration } from '@/lib/PlayerContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export default function MiniPlayer() {
    const router = useRouter();
    const pathname = usePathname();
    const {
        currentStory,
        isPlaying,
        toggle,
        currentTime,
        duration,
        seek,
        next,
        previous,
        queue,
        queueIndex,
        collectionSlug,
        isLoopable,
        loopDuration,
        totalLoopTime,
        setLoopDuration,
        isMobilePlayerOpen,
        toggleMobilePlayer
    } = usePlayer();

    const [showDurationDropdown, setShowDurationDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDurationDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!currentStory) return null;

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

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

    const handleTrackClick = () => {
        router.push(`/story/${currentStory.id}`);
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
                // Desktop: fixed bottom-0 (standard)
                // Mobile: controlled by isMobilePlayerOpen. 
                // If Open: bottom-[84px] (above nav). If Closed: translate-y-full (hidden) or just hidden via conditional? 
                // Let's use CSS transform for smoother toggle, or just conditional classes.
                // We'll use 'bottom' classes directly.
                className={`fixed left-0 right-0 z-50 transition-all duration-300
                    md:bottom-0 
                    ${isMobilePlayerOpen ? 'bottom-[84px] opacity-100 translate-y-0' : 'bottom-[84px] opacity-0 translate-y-10 pointer-events-none md:opacity-100 md:translate-y-0 md:pointer-events-auto'}
                `}
            >

                {/* Mini Player Content */}
                <div className="h-[72px] bg-white/90 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex items-center px-4 relative z-30">
                    <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">

                        {/* Track Info (Clickable to open story page) */}
                        <div
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group"
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

                        {/* Right Side Controls - Loop Duration & Collection Back */}
                        <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
                            {/* Loop Duration Dropdown - Only for loopable content */}
                            {isLoopable && (
                                <div className="relative" ref={dropdownRef}>
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

                                    {/* Dropdown Menu */}
                                    <AnimatePresence>
                                        {showDurationDropdown && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute bottom-full mb-2 right-0 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[120px] overflow-hidden z-50"
                                            >
                                                {durationOptions.map((option) => (
                                                    <button
                                                        key={option.value}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setLoopDuration(option.value);
                                                            setShowDurationDropdown(false);
                                                        }}
                                                        className={`w-full px-4 py-2 text-left text-sm hover:bg-indigo-50 transition ${loopDuration === option.value ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-700'}`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Context Navigation Button */}
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

                {/* Progress Bar - Layout Bottom, Softer Colors (Hidden for Loops) */}
                {!isLoopable && (
                    <div
                        className="w-full h-1.5 bg-indigo-50 cursor-pointer group z-40 relative"
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const percent = (e.clientX - rect.left) / rect.width;
                            seek(percent * duration);
                        }}
                    >
                        <input
                            type="range"
                            min={0}
                            max={duration || 100}
                            step="0.1"
                            value={currentTime}
                            onChange={(e) => {
                                e.stopPropagation();
                                seek(Number(e.target.value));
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                            style={{ height: '16px', top: '-8px' }}
                        />
                        {/* Visual Track */}
                        <div className="absolute inset-0 bg-indigo-100/50 pointer-events-none" />
                        {/* Visual Progress */}
                        <div
                            className="absolute left-0 top-0 h-full bg-indigo-500 pointer-events-none transition-all duration-100 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </motion.div>
        </AnimatePresence >
    );
}
