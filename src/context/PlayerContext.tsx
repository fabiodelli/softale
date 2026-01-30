'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';
import type { Story } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';
import { incrementStoriesCompleted } from '@/lib/supabase';
import { useAmbience } from '@/context/AmbienceContext';

// Hooks
import { useAudioConfig, AudioConfig } from '@/hooks/audio/useAudioConfig';
import { useAudioStems } from '@/hooks/audio/useAudioStems';
import { useAmbientEngine } from '@/hooks/audio/useAmbientEngine';
import { useProgressTracker } from '@/hooks/audio/useProgressTracker';

// Audio Engine V2 Types
export type PlaybackStatus = 'IDLE' | 'LOADING' | 'PLAYING' | 'PAUSED' | 'ERROR';

// Loop duration options in minutes (0 = infinite)
export type LoopDuration = 15 | 30 | 60 | 120 | 0;

interface PlayerContextType extends AudioConfig {
    currentStory: Story | null;
    status: PlaybackStatus;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    queue: Story[];
    queueIndex: number;
    error: string | null;

    // Collection context
    collectionSlug: string | null;
    isLoopable: boolean;
    hasStems: boolean;
    totalLoopTime: number;

    // Mobile UI State
    isMobilePlayerOpen: boolean;
    toggleMobilePlayer: () => void;
    setMobilePlayerOpen: (open: boolean) => void;

    // Actions
    play: (story: Story) => void;
    playQueue: (stories: Story[], startIndex?: number, collectionInfo?: { slug: string; isLoopable: boolean }) => void;
    pause: () => void;
    toggle: () => void;
    next: () => void;
    previous: () => void;
    seek: (time: number) => void;

    // Refs
    audioRef: React.RefObject<HTMLAudioElement>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const ambience = useAmbience();
    const { trackProgress, markComplete, checkStreak } = useProgressTracker();

    // --- Hooks Composition ---
    const audioConfig = useAudioConfig(); // all volumes, rates, setters
    const { musicRef, ambientRefA, ambientRefB, activeAmbientRef, pauseAllStems, updateStemVolumes } = useAudioStems();

    // --- State Machine ---
    const [status, setStatus] = useState<PlaybackStatus>('IDLE');
    const [currentStory, setCurrentStory] = useState<Story | null>(null);
    const [queue, setQueue] = useState<Story[]>([]);
    const [queueIndex, setQueueIndex] = useState<number>(-1);
    const [error, setError] = useState<string | null>(null);

    // --- Collection & Loop State ---
    const [collectionSlug, setCollectionSlug] = useState<string | null>(null);
    const [isLoopable, setIsLoopable] = useState(false);
    const [totalLoopTime, setTotalLoopTime] = useState(0);

    // --- Mobile UI State ---
    const [isMobilePlayerOpen, setIsMobilePlayerOpen] = useState(false);
    const toggleMobilePlayer = useCallback(() => setIsMobilePlayerOpen(prev => !prev), []);

    // --- Audio Properties ---
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // --- Refs ---
    const audioRef = useRef<HTMLAudioElement>(null); // Voice/Master

    // --- Ambient Engine ---
    const { getAmbientUrl, getCurrentAudioIntent, crossfadeTo, fadeTo, currentPhaseRef } = useAmbientEngine(
        currentStory,
        duration,
        currentTime,
        ambientRefA,
        ambientRefB,
        activeAmbientRef,
        audioConfig.ambientVolume
    );

    // Derived State
    const isPlaying = status === 'PLAYING';

    // --- Volume Effects ---
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = audioConfig.voiceVolume;
    }, [audioConfig.voiceVolume]);

    useEffect(() => {
        updateStemVolumes(audioConfig.musicVolume, audioConfig.ambientVolume);
    }, [audioConfig.musicVolume, audioConfig.ambientVolume, updateStemVolumes]);

    // --- Ambient Sync Loop ---
    useEffect(() => {
        if (!currentStory || status !== 'PLAYING') {
            if (status === 'PAUSED' || status === 'IDLE') {
                pauseAllStems();
            }
            return;
        }

        // V6 STEM LOGIC
        if (currentStory.voice_url && currentStory.music_url) {
            // Ensure Music is Playing
            if (musicRef.current && musicRef.current.paused) {
                musicRef.current.src = currentStory.music_url;
                musicRef.current.volume = audioConfig.musicVolume;
                musicRef.current.play().catch(e => console.warn("Music play failed", e));
            }

            // Ensure Ambience is Playing
            if (currentStory.ambient_url) {
                const active = activeAmbientRef.current === 'A' ? ambientRefA.current : ambientRefB.current;
                if (active && (active.paused || active.src !== currentStory.ambient_url)) {
                    active.src = currentStory.ambient_url;
                    active.volume = audioConfig.ambientVolume;
                    active.play().catch(e => console.warn("Stem Ambience play failed", e));
                }
            }
            return;
        }

        // LEGACY INTENT LOGIC
        const currentAudio = getCurrentAudioIntent();
        const phaseKey = `${currentAudio.phase}-${currentAudio.intent}`;

        const activeRef = activeAmbientRef.current === 'A' ? ambientRefA.current : ambientRefB.current;
        if (activeRef && activeRef.paused && activeRef.src) {
            activeRef.play().catch(e => console.warn("Resume ambient failed", e));
        }

        if (phaseKey !== currentPhaseRef.current) {
            currentPhaseRef.current = phaseKey;
            const newUrl = getAmbientUrl(currentAudio.intent);
            const targetVolume = audioConfig.ambientVolume * currentAudio.intensity;

            if (newUrl) {
                const active = activeAmbientRef.current === 'A' ? ambientRefA.current : ambientRefB.current;
                if (!active?.src || active.paused) {
                    if (active) {
                        active.src = newUrl;
                        active.volume = 0;
                        active.play().catch(e => console.error("Start ambient failed", e));
                        fadeTo(active, targetVolume, 2000);
                    }
                } else {
                    crossfadeTo(newUrl, targetVolume);
                }
            }
        } else {
            const targetVolume = audioConfig.ambientVolume * currentAudio.intensity;
            const active = activeAmbientRef.current === 'A' ? ambientRefA.current : ambientRefB.current;
            if (active && !active.paused) {
                fadeTo(active, targetVolume, 1000);
            }
        }
    }, [
        currentStory, status, currentTime, getCurrentAudioIntent, getAmbientUrl, crossfadeTo,
        audioConfig.ambientVolume, audioConfig.musicVolume, fadeTo, activeAmbientRef, ambientRefA,
        ambientRefB, musicRef, pauseAllStems, updateStemVolumes, currentPhaseRef
    ]);

    // --- Core Actions ---

    const play = useCallback((story: Story) => {
        if (!user) return;

        trackEvent('story_play', { story_id: story.id, story_title: story.title, category: story.category });
        checkStreak();
        ambience.pause();
        setError(null);

        if (currentStory?.id === story.id && status === 'PAUSED') {
            setStatus('PLAYING');
            audioRef.current?.play().catch(e => {
                console.error("Resume failed", e);
                setStatus('ERROR');
            });
            return;
        }

        setQueue(prev => {
            if (!prev.find(s => s.id === story.id)) {
                return [story];
            }
            return prev;
        });

        if (currentStory?.id !== story.id) {
            setQueueIndex(0); // Simplified
            setCurrentStory(story);
            currentPhaseRef.current = '';
            setCollectionSlug(null);

            const loopableCategories = ['soundscape', 'binaural', 'music_instrumental'];
            setIsLoopable(loopableCategories.includes(story.category));
            audioConfig.setLoopDuration(0);
            setTotalLoopTime(0);
            setStatus('LOADING');
        } else {
            // Replay same story from start
            const hasStems = !!(story.voice_url && story.music_url); // Basic check
            setStatus('PLAYING');
            audioRef.current?.play();
            if (hasStems) {
                musicRef.current?.play();
                const active = activeAmbientRef.current === 'A' ? ambientRefA.current : ambientRefB.current;
                active?.play();
            }
        }
    }, [currentStory, status, user, checkStreak, ambience, currentPhaseRef, musicRef, activeAmbientRef, ambientRefA, ambientRefB, audioConfig]);

    const playQueue = useCallback((stories: Story[], startIndex = 0, collectionInfo?: { slug: string; isLoopable: boolean }) => {
        if (!user || stories.length === 0) return;
        ambience.pause();
        setQueue(stories);
        setQueueIndex(startIndex);
        const targetStory = stories[startIndex];
        setCurrentStory(targetStory);
        currentPhaseRef.current = '';
        setStatus('LOADING');
        if (collectionInfo) {
            setCollectionSlug(collectionInfo.slug);
            setIsLoopable(collectionInfo.isLoopable);
            setTotalLoopTime(0);
        } else {
            setCollectionSlug(null);
            setIsLoopable(false);
        }
    }, [user, ambience, currentPhaseRef]);

    const pause = useCallback(() => {
        setStatus('PAUSED');
        audioRef.current?.pause();
        ambience.resumeIfWasPlaying();
        pauseAllStems();
    }, [ambience, pauseAllStems]);

    const toggle = useCallback(() => {
        if (status === 'PLAYING') pause();
        else if (status === 'PAUSED') {
            ambience.pause();
            setStatus('PLAYING');
            audioRef.current?.play();
        }
        else if (status === 'IDLE' && currentStory) {
            play(currentStory);
        }
    }, [status, currentStory, play, pause, ambience]);

    const next = useCallback(() => {
        if (queueIndex < queue.length - 1) {
            const nextIndex = queueIndex + 1;
            setQueueIndex(nextIndex);
            const nextStory = queue[nextIndex];
            setCurrentStory(nextStory);
            currentPhaseRef.current = '';
            setStatus('LOADING');
        }
    }, [queue, queueIndex, currentPhaseRef]);

    const previous = useCallback(() => {
        if (queueIndex > 0) {
            const prevIndex = queueIndex - 1;
            setQueueIndex(prevIndex);
            const prevStory = queue[prevIndex];
            setCurrentStory(prevStory);
            currentPhaseRef.current = '';
            setStatus('LOADING');
        } else {
            if (audioRef.current) audioRef.current.currentTime = 0;
        }
    }, [queue, queueIndex, currentPhaseRef]);

    const seek = useCallback((time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    // --- Audio Event Handlers ---

    // Autoplay effect
    useEffect(() => {
        const hasAudio = currentStory?.audio_url || currentStory?.voice_url;
        if (status === 'LOADING' && hasAudio && audioRef.current) {
            audioRef.current.play().then(() => {
                setStatus('PLAYING');
                // Sync Stems
                if (currentStory?.music_url && musicRef.current) {
                    musicRef.current.src = currentStory.music_url;
                    musicRef.current.volume = audioConfig.musicVolume;
                    musicRef.current.play().catch(e => console.warn("Music autoplay failed", e));
                }
                if (currentStory?.ambient_url && ambientRefA.current) {
                    ambientRefA.current.src = currentStory.ambient_url;
                    ambientRefA.current.volume = audioConfig.ambientVolume;
                    ambientRefA.current.play().catch(e => console.warn("Ambient autoplay failed", e));
                }
            }).catch(e => console.error("Autoplay failed", e));
        }
    }, [currentStory, status, audioConfig.musicVolume, audioConfig.ambientVolume, musicRef, ambientRefA]);

    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
        const time = e.currentTarget.currentTime;
        const prevTime = currentTime;
        setCurrentTime(time);

        // Loop Logic
        if (isLoopable && status === 'PLAYING') {
            const timeDelta = time - prevTime;
            if (timeDelta > 0 && timeDelta < 2) {
                setTotalLoopTime(prev => {
                    const newTotal = prev + timeDelta;
                    if (audioConfig.loopDuration > 0 && newTotal >= audioConfig.loopDuration * 60) {
                        setTimeout(() => {
                            pause();
                            setTotalLoopTime(0);
                        }, 0);
                    }
                    return newTotal;
                });
            }
        }

        // Progress Tracking (delegated to hook)
        if (currentStory && !isLoopable) {
            trackProgress(currentStory, time, prevTime, isLoopable);
        }
    };

    const handleEnded = () => {
        if (currentStory) {
            trackEvent('story_complete', { story_id: currentStory.id, story_title: currentStory.title, duration_listened: duration });
            markComplete(currentStory, duration);
            incrementStoriesCompleted(user!.id).catch(e => console.error("Completion tracking failed", e));
        }

        if (queueIndex < queue.length - 1) {
            next();
        } else if (isLoopable) {
            setQueueIndex(0);
            const firstStory = queue[0];
            if (firstStory) {
                setCurrentStory(firstStory);
                currentPhaseRef.current = '';
                setStatus('LOADING');
            }
        } else {
            setStatus('IDLE');
            ambience.resumeIfWasPlaying();
            seek(0);
        }
    };

    return (
        <PlayerContext.Provider value={{
            ...audioConfig,
            currentStory, status, isPlaying, error,
            currentTime, duration,
            queue, queueIndex,
            collectionSlug, isLoopable, loopDuration: audioConfig.loopDuration, totalLoopTime,
            hasStems: !!(currentStory?.voice_url),
            isMobilePlayerOpen, toggleMobilePlayer, setMobilePlayerOpen: setIsMobilePlayerOpen,
            play, playQueue, next, previous, pause, toggle, seek,
            audioRef: audioRef as React.RefObject<HTMLAudioElement>
        }}>
            {children}
            {(currentStory?.audio_url || currentStory?.voice_url) && (
                <audio
                    ref={audioRef}
                    src={currentStory?.voice_url || currentStory?.audio_url}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleEnded}
                    onError={(e) => {
                        console.error("Audio Error", e);
                        setError("Playback failed.");
                        setStatus('ERROR');
                    }}
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                />
            )}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
}
