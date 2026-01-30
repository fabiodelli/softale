'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';
import type { Story } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';
import { useAmbience } from '@/context/AmbienceContext';
import { incrementStoriesCompleted } from '@/lib/supabase';

// Audio Engine V2
import { audio } from '@/lib/audio/AudioEngine'; // The singleton
import { useAudioConfig } from '@/hooks/audio/useAudioConfig';
import { useProgressTracker } from '@/hooks/audio/useProgressTracker';

export type PlaybackStatus = 'IDLE' | 'LOADING' | 'PLAYING' | 'PAUSED' | 'ERROR';
export type LoopDuration = 15 | 30 | 60 | 120 | 0;

interface PlayerContextType {
    currentStory: Story | null;
    status: PlaybackStatus;
    isPlaying: boolean;
    isBuffering: boolean;
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

    // Config (from useAudioConfig)
    voiceVolume: number;
    musicVolume: number;
    ambientVolume: number;
    loopDuration: number;
    setVoiceVolume: (v: number) => void;
    setMusicVolume: (v: number) => void;
    setAmbientVolume: (v: number) => void;
    setLoopDuration: (v: number) => void;

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

    // Legacy Ref (compat only, implementation detail hidden)
    audioRef: React.RefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const ambience = useAmbience();
    const { trackProgress, markComplete, checkStreak } = useProgressTracker();
    const audioConfig = useAudioConfig(); // Manages local storage preference

    // --- State ---
    const [status, setStatus] = useState<PlaybackStatus>('IDLE');
    const [currentStory, setCurrentStory] = useState<Story | null>(null);
    const [queue, setQueue] = useState<Story[]>([]);
    const [queueIndex, setQueueIndex] = useState<number>(-1);
    const [error, setError] = useState<string | null>(null);

    // Audio State Sync
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isBuffering, setIsBuffering] = useState(false);

    // Collection & Loop State
    const [collectionSlug, setCollectionSlug] = useState<string | null>(null);
    const [isLoopable, setIsLoopable] = useState(false);
    const [totalLoopTime, setTotalLoopTime] = useState(0);

    // Context UI
    const [isMobilePlayerOpen, setIsMobilePlayerOpen] = useState(false);
    const toggleMobilePlayer = useCallback(() => setIsMobilePlayerOpen(prev => !prev), []);

    // Helper to keep audio engine volumes in sync with React state/local storage
    useEffect(() => {
        audio.setVolume('voice', audioConfig.voiceVolume);
    }, [audioConfig.voiceVolume]);

    useEffect(() => {
        audio.setVolume('music', audioConfig.musicVolume);
    }, [audioConfig.musicVolume]);

    useEffect(() => {
        audio.setVolume('ambience', audioConfig.ambientVolume);
    }, [audioConfig.ambientVolume]);

    // --- Audio Engine Listeners ---
    useEffect(() => {
        const onTimeUpdate = (state: any) => {
            setCurrentTime(state.currentTime);
            setDuration(state.duration);

            // Progress Tracking
            if (currentStory && !isLoopable) {
                // We use a small debounce or direct call? Hook handles logic
                trackProgress(currentStory, state.currentTime, currentTime, isLoopable);
            }
        };

        const onStateChange = (state: any) => {
            setIsBuffering(state.isBuffering);
            if (state.isPlaying) setStatus('PLAYING');
            else if (status !== 'IDLE' && status !== 'ERROR') setStatus('PAUSED');

            setDuration(state.duration);
        };

        const onEnded = () => {
            if (currentStory) {
                trackEvent('story_complete', { story_id: currentStory.id, story_title: currentStory.title });
                markComplete(currentStory, duration);
                if (user) incrementStoriesCompleted(user.id);
            }

            if (queueIndex < queue.length - 1) {
                next();
            } else if (isLoopable) {
                // Loop Queue Logic
                // ... (Simplified for now, just restart current for single loopable)
                if (queue.length === 1) {
                    audio.seek(0);
                    audio.play();
                } else {
                    playQueue(queue, 0, { slug: collectionSlug || '', isLoopable: true });
                }
            } else {
                setStatus('IDLE');
                ambience.resumeIfWasPlaying();
            }
        };

        const onError = () => {
            setError("Playback Error");
            setStatus('ERROR');
        };

        audio.on('timeupdate', onTimeUpdate);
        audio.on('statechange', onStateChange);
        audio.on('ended', onEnded);
        audio.on('error', onError);

        return () => {
            audio.off('timeupdate', onTimeUpdate);
            audio.off('statechange', onStateChange);
            audio.off('ended', onEnded);
            audio.off('error', onError);
        };
    }, [currentStory, isLoopable, queue, queueIndex, collectionSlug, user, status, trackProgress, markComplete, duration, ambience]);

    // --- Actions ---

    const play = useCallback(async (story: Story) => {
        try {
            if (currentStory?.id === story.id && status === 'PAUSED') {
                audio.play();
                return;
            }

            // New Story
            ambience.pause();
            setCurrentStory(story);
            setStatus('LOADING');
            setError(null);

            // Queue logic
            setQueue(prev => {
                const exists = prev.find(s => s.id === story.id);
                return exists ? prev : [story];
            });
            if (currentStory?.id !== story.id) setQueueIndex(0);

            await audio.loadStory(story);
            audio.play();
        } catch (e) {
            console.error(e);
            setError("Failed to load story");
            setStatus('ERROR');
        }
    }, [currentStory, status, ambience]);

    const pause = useCallback(() => {
        audio.pause();
        setStatus('PAUSED');
        ambience.resumeIfWasPlaying();
    }, [ambience]);

    const toggle = useCallback(() => {
        if (status === 'PLAYING') pause();
        else if (status === 'PAUSED') {
            ambience.pause(); // Ensure ambience is paused when resuming
            audio.play();
        }
        else if (status === 'IDLE' && currentStory) play(currentStory);
    }, [status, currentStory, play, pause, ambience]);

    const seek = useCallback((time: number) => {
        audio.seek(time);
        setCurrentTime(time);
    }, []);

    const playQueue = useCallback(async (stories: Story[], startIndex = 0, collectionInfo?: { slug: string; isLoopable: boolean }) => {
        if (stories.length === 0) return;

        ambience.pause();
        setQueue(stories);
        setQueueIndex(startIndex);

        const targetStory = stories[startIndex];
        setCurrentStory(targetStory);

        if (collectionInfo) {
            setCollectionSlug(collectionInfo.slug);
            setIsLoopable(collectionInfo.isLoopable);
        } else {
            setCollectionSlug(null);
            setIsLoopable(false);
        }

        setStatus('LOADING');
        await audio.loadStory(targetStory);
        audio.play();
    }, [ambience]);

    const next = useCallback(() => {
        if (queueIndex < queue.length - 1) {
            const newIndex = queueIndex + 1;
            setQueueIndex(newIndex);
            const story = queue[newIndex];
            setCurrentStory(story);
            // Auto play next
            audio.loadStory(story).then(() => audio.play());
        }
    }, [queue, queueIndex]);

    const previous = useCallback(() => {
        if (currentTime > 3) {
            seek(0);
            return;
        }

        if (queueIndex > 0) {
            const newIndex = queueIndex - 1;
            setQueueIndex(newIndex);
            const story = queue[newIndex];
            setCurrentStory(story);
            audio.loadStory(story).then(() => audio.play());
        }
    }, [queue, queueIndex, currentTime, seek]);

    // Legacy Dummy Ref
    const audioRef = useRef<HTMLAudioElement>(null);

    return (
        <PlayerContext.Provider value={{
            ...audioConfig,
            currentStory, status, isPlaying: status === 'PLAYING', isBuffering, error,
            currentTime, duration,
            queue, queueIndex,
            collectionSlug, isLoopable, totalLoopTime,
            hasStems: !!(currentStory?.voice_url),
            isMobilePlayerOpen, toggleMobilePlayer, setMobilePlayerOpen: setIsMobilePlayerOpen,
            play, playQueue, next, previous, pause, toggle, seek,
            audioRef
        }}>
            {children}
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
