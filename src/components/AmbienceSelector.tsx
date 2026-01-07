'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, Volume2 } from 'lucide-react';
import { useAmbience } from '@/context/AmbienceContext';

export default function AmbienceSelector() {
    const { currentTrack, isPlaying, volume, setVolume, togglePlay } = useAmbience();
    const [showVolume, setShowVolume] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowVolume(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Only show if there's a track selected
    if (!currentTrack) return null;

    return (
        <div
            ref={containerRef}
            className="relative flex items-center gap-1"
        >
            {/* Toggle Switch - Click = Play/Pause */}
            <button
                onClick={togglePlay}
                onContextMenu={(e) => {
                    e.preventDefault();
                    setShowVolume(!showVolume);
                }}
                className={`
                    relative w-10 h-5 rounded-full flex items-center
                    transition-all duration-300
                    ${isPlaying
                        ? 'bg-indigo-500'
                        : 'bg-slate-300'
                    }
                `}
                title={isPlaying ? 'Click to Pause' : 'Click to Play'}
            >
                {/* Toggle knob */}
                <motion.span
                    className="absolute w-4 h-4 bg-white rounded-full shadow-md"
                    animate={{
                        x: isPlaying ? 22 : 2
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            </button>

            {/* Track name - minimal */}
            <button
                onClick={() => setShowVolume(!showVolume)}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors hidden md:block"
            >
                {currentTrack.name}
            </button>

            {/* Volume Slider - Appears on hover/click */}
            <AnimatePresence>
                {showVolume && (
                    <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 100 }}
                        exit={{ opacity: 0, width: 0 }}
                        className="overflow-hidden flex items-center"
                    >
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
