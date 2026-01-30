'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';

interface AudioPhase {
    id: number;
    type: 'narration' | 'silence' | 'ambience_only' | 'breathing_guide';
    durationSeconds: number;
    content?: string;
    breathPattern?: string;
}

interface SubtitleOverlayProps {
    text: string;
    isPremium: boolean;
    audioPhases?: any[]; // Typed as any[] in DB interface, but we know structure
}

// Utility to clean TTS tags
const cleanText = (text: string) => {
    if (!text) return '';
    return text
        .replace(/\[.*?\]/g, '') // Remove [pause], [breath], etc.
        .replace(/\(.*?\)/g, '') // Remove (instructions)
        .replace(/\s+/g, ' ')    // Collapse whitespace
        .trim();
};

export default function SubtitleOverlay({ text, isPremium, audioPhases }: SubtitleOverlayProps) {
    const { currentTime, duration } = usePlayer();
    const { profile } = useAuth();
    const router = useRouter();

    // Check if locked: Force lock if user is non-premium (Global enforcement requested by user)
    // We ignore story.is_premium status effectively, or treat all text as premium feature.
    const isLocked = !profile?.is_premium;

    // --- PHASE AWARE SYNCHRONIZATION (V1.5) ---

    // 1. Determine active phase based on currentTime
    const activePhaseData = useMemo(() => {
        if (!audioPhases || audioPhases.length === 0) return null;

        let accumulatedTime = 0;
        // Assume warmup is handled or 0 for now. Ideal: pass warmupDuration too.
        // For V6 stories, audioPhases usually start at 0 relative to mix? 
        // Actually mixUnifiedAudio starts voices after warmup. 
        // We might need an offset. Let's assume 0 offset for now or check Story struct.

        for (const phase of audioPhases as AudioPhase[]) {
            const startTime = accumulatedTime;
            const endTime = startTime + phase.durationSeconds;

            if (currentTime >= startTime && currentTime < endTime) {
                return {
                    phase,
                    startTime,
                    endTime,
                    localProgress: (currentTime - startTime) / phase.durationSeconds
                };
            }
            accumulatedTime += phase.durationSeconds;
        }
        return null;
    }, [currentTime, audioPhases]);

    // 2. Prepare Display Content
    let visibleSentences: string[] = [];
    let activeIndex = -1;

    if (activePhaseData) {
        // PHASE MODE
        const { phase, localProgress } = activePhaseData;

        if (phase.type === 'narration' && phase.content) {
            const cleanedContent = cleanText(phase.content);
            const sentences = cleanedContent.split(/(?<=[.!?])\s+/);

            if (sentences.length > 0) {
                // Word-Count Heuristic within Phase
                const totalWords = cleanedContent.split(/\s+/).length;
                let wordAccumulator = 0;
                let found = false;

                // Find which sentence we are in based on weight
                for (let i = 0; i < sentences.length; i++) {
                    const sWords = sentences[i].split(/\s+/).length;
                    const weight = sWords / totalWords;
                    const sStart = wordAccumulator / totalWords;
                    const sEnd = sStart + weight;

                    if (localProgress >= sStart && localProgress < sEnd) {
                        activeIndex = i;
                        found = true;
                        break;
                    }
                    wordAccumulator += sWords;
                }
                if (!found) activeIndex = sentences.length - 1; // Clamp to end

                visibleSentences = sentences.slice(Math.max(0, activeIndex - 1), activeIndex + 2);
            }
        } else if (phase.type === 'breathing_guide') {
            visibleSentences = ['🌬️ Inhale... Exhale...'];
            activeIndex = 0;
        } else {
            // Silence / Ambience Only
            visibleSentences = ['...'];
            activeIndex = 0;
        }

    } else {
        // LEGACY MODE (Fallback if no phases)
        const cleanedContent = cleanText(text);
        const sentences = cleanedContent.split(/(?<=[.!?])\s+/);
        const progress = duration > 0 ? currentTime / duration : 0;

        // Simple word-count heuristic for global text
        const totalWords = cleanedContent.split(/\s+/).length;
        let wordAccumulator = 0;
        let found = false;

        for (let i = 0; i < sentences.length; i++) {
            const sWords = sentences[i].split(/\s+/).length;
            const weight = sWords / totalWords;
            const sStart = wordAccumulator / totalWords;
            // Global fallback assumes linear distribution of words over total duration
            // activeIndex = Math.floor(progress * sentences.length); // OLD LINEAR

            // NEW WEIGHTED GLOBAL FALLBACK
            const sEnd = sStart + weight;
            if (progress >= sStart && progress < sEnd) {
                activeIndex = i;
                found = true;
                break;
            }
            wordAccumulator += sWords;
        }
        if (!found) activeIndex = Math.floor(progress * sentences.length);

        visibleSentences = sentences.slice(Math.max(0, activeIndex - 1), activeIndex + 2);
    }

    if (!text && !audioPhases) return null;

    // Locked Logic: Force lock if user is non-premium
    // MODIFIED: Hide text completely, show specific CTA.
    // UPDATED: moved position higher to bottom-48/56 to clear title

    if (isLocked) {
        return (
            <div className="absolute inset-x-0 bottom-48 md:bottom-56 z-[60] flex justify-center pointer-events-none">
                <div
                    onClick={() => router.push('/upgrade')}
                    className="bg-black/60 backdrop-blur-md border border-white/20 rounded-full px-5 py-2.5 flex items-center gap-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 pointer-events-auto cursor-pointer hover:scale-105 active:scale-95 transition group"
                >
                    <div className="flex items-center gap-2 text-white/90">
                        <span className="text-amber-400 group-hover:animate-pulse">🔒</span>
                        <span className="text-sm font-semibold tracking-wide">Text Locked</span>
                    </div>
                    <span
                        className="px-3 py-1 bg-white/10 group-hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-full transition border border-white/20"
                    >
                        Unlock
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-x-0 bottom-32 md:bottom-40 p-6 md:p-12 z-30 pointer-events-none text-center flex flex-col items-center justify-end min-h-[30vh]">
            <AnimatePresence mode="popLayout">
                {visibleSentences.map((sentence, i) => {
                    // Map back relative to activeIndex because logic differs per mode
                    // We only render a slice around activeIndex, so middle one is active (usually index 1)

                    // Recalculate:
                    const sliceStart = Math.max(0, activeIndex - 1);
                    const isTheActiveSentence = (sliceStart + i) === activeIndex;

                    return (
                        <motion.p
                            key={`sub-${sentence}-${i}`} // Composite key to avoid dupe issues
                            initial={{ opacity: 0, y: 20 }}
                            animate={{
                                opacity: isTheActiveSentence ? 1 : 0.4,
                                y: 0,
                                scale: isTheActiveSentence ? 1.05 : 0.95,
                                filter: isTheActiveSentence ? 'blur(0px)' : 'blur(1px)'
                            }}
                            exit={{ opacity: 0, y: -20, filter: 'blur(5px)' }}
                            transition={{ duration: 0.5 }}
                            className={`
                                max-w-4xl mx-auto font-medium leading-relaxed tracking-wide mb-4 text-shadow-lg
                                ${isTheActiveSentence
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
        </div>
    );
}
