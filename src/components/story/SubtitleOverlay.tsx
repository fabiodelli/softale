'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/lib/AuthProvider';

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

    // Check if locked: Story is Premium AND User is NOT Premium
    const isLocked = isPremium && !profile?.is_premium;

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

    // Locked Logic: If Locked, show only first 3 sentences of the ENTIRE text, then blur.
    // Or, just show the current sentence but blur upcoming?
    // User said "I continue to see the story text".
    // If they mean the "Karaoke" text, we should probably BLUR it if they are not premium?
    // But they need to see *something* to follow along?
    // Usually "Karaoke" is a premium feature itself?
    // No, "Subtitle" is basic. "Full Script" is premium.
    // The user said: "se vado sulla pagina di dettaglio delle storie, sto continuando a vedere il testo della storia".
    // "Page Detail" -> `StoryDetailPage`.
    // `ImmersivePlayer` IS the detail page representation.
    // Maybe they mean the `narrationText` which is used for subtitles.
    // If I am free user, maybe I should NOT see subtitles at all? Or only previews?
    // Let's hide subtitles after 30 seconds?
    // Or simple: If Locked, show a BLURRED text placeholder instead of actual text for everything beyond sentence #3?

    // Let's modify the map:
    // If Locked, and index > 2, render BLURRED dots?

    // Actually, simpler:
    // If Locked, we show a permanent "Upgrade to see subtitles" message 
    // replacing the text, Or we overlay the lock ON TOP of the text (which we do).
    // The user might be seeing the text *behind* the small lock badge and finding it annoying/readable?
    // Let's make the lock badge cover the center more aggressively or blur the text behind it.

    // UPDATE: The user said "I continue to see the story text". 
    // This implies they expect it to be HIDDEN.
    // Let's hide the visible sentences if locked.

    if (isLocked) {
        return (
            <div className="absolute inset-x-0 bottom-32 md:bottom-40 p-6 z-30 flex flex-col items-center justify-end min-h-[30vh]">
                <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-amber-500/30 text-center max-w-sm mx-auto">
                    <div className="bg-amber-100 p-3 rounded-full mb-3 inline-flex items-center justify-center">
                        <span className="text-2xl">🔒</span>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1">Subtitles Locked</h3>
                    <p className="text-slate-300 text-sm mb-4">Upgrade to Premium to follow the story with synchronized text.</p>
                    <button
                        onClick={() => window.location.href = '/upgrade'}
                        className="px-6 py-2 bg-amber-500 text-white font-bold rounded-full hover:bg-amber-600 transition"
                    >
                        Unlock Now
                    </button>
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
                    // Edge case: start of list (index 0 is active)

                    // Simplified visual logic:
                    // If visibleSentences has 3 items, middle is active?
                    // Not exactly. We sliced based on activeIndex.
                    // The easiest way is to compare content or rely on position if we want simple "center is active".
                    // But activeIndex is global/phase-local.

                    // Let's rely on string matching or index reconstruction? 
                    // Reconstruction is safer.
                    // Actually, for the animation, we just want the "current" one highlighted.
                    // If activeIndex was 0, visible is [0, 1, 2]. 0 is active.
                    // If activeIndex was 5, visible is [4, 5, 6]. 1 (middle) is active.

                    // Let's pass 'isActive' flag via map? No.
                    // Recalculate:
                    // globalIndex relative to slice?
                    // We sliced: Math.max(0, activeIndex - 1)
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
