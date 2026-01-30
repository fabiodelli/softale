'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/lib/AuthProvider';

interface SubtitleOverlayProps {
    text: string;
    isPremium: boolean;
}

export default function SubtitleOverlay({ text, isPremium }: SubtitleOverlayProps) {
    const { isPlaying, currentTime, duration } = usePlayer();
    const { profile } = useAuth();

    // Check if locked: Story is Premium AND User is NOT Premium
    const isLocked = isPremium && !profile?.is_premium;

    // Split text into paragraphs or sentences for "Karaoke" simulation
    // Ideally, we'd have timestamps. For now, we simulate based on progress.
    const sentences = text.split(/(?<=[.!?])\s+/);

    // Determine active sentence index based on progress
    // This is a naive simulation: evenly distributes sentences across duration.
    // In V7+ we would use actual VTT/SRT timings.
    const progress = duration > 0 ? currentTime / duration : 0;
    const activeIndex = Math.floor(progress * sentences.length);

    // Visible window: Show active + 1 upcoming, or just active?
    // Let's show a "Rolling" window of 3 sentences (Prev, Active, Next) or just Active focused.
    // User requested "sottotitoli", implying focus on current text.

    const visibleSentences = sentences.slice(Math.max(0, activeIndex - 1), activeIndex + 2);

    if (!text) return null;

    return (
        <div className="absolute inset-x-0 bottom-32 md:bottom-40 p-6 md:p-12 z-30 pointer-events-none text-center flex flex-col items-center justify-end min-h-[30vh]">
            <AnimatePresence mode="popLayout">
                {visibleSentences.map((sentence, i) => {
                    // Map back to global index to identify "Active"
                    const globalIndex = Math.max(0, activeIndex - 1) + i;
                    const isActive = globalIndex === activeIndex;

                    return (
                        <motion.p
                            key={`sub-${globalIndex}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{
                                opacity: isActive ? 1 : 0.4,
                                y: 0,
                                scale: isActive ? 1.05 : 0.95,
                                filter: isActive ? 'blur(0px)' : 'blur(1px)'
                            }}
                            exit={{ opacity: 0, y: -20, filter: 'blur(5px)' }}
                            transition={{ duration: 0.5 }}
                            className={`
                                max-w-4xl mx-auto font-medium leading-relaxed tracking-wide mb-4 text-shadow-lg
                                ${isActive
                                    ? 'text-white text-xl md:text-3xl font-serif'
                                    : 'text-slate-300/80 text-lg md:text-xl'
                                }
                            `}
                        >
                            {sentence}
                        </motion.p>
                    );
                })}
            </AnimatePresence>

            {isLocked && (
                <div className="mt-4 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-xs text-amber-400 border border-amber-500/30">
                    🔒 Upgrade for full text script
                </div>
            )}
        </div>
    );
}
