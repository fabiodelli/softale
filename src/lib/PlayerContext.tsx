'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import type { Story } from './supabase';
import { useAuth } from './AuthProvider';
import { updateListeningProgress } from './supabase';
import { useAmbience } from '@/context/AmbienceContext';

// Audio Engine V2 Types
export type PlaybackStatus = 'IDLE' | 'LOADING' | 'PLAYING' | 'PAUSED' | 'ERROR';

// Loop duration options in minutes (0 = infinite)
export type LoopDuration = 15 | 30 | 60 | 120 | 0;

interface PlayerContextType {
    currentStory: Story | null;
    status: PlaybackStatus;
    isPlaying: boolean; // Derived for convenience
    currentTime: number;
    duration: number;
    voiceVolume: number;
    ambientVolume: number;
    playbackRate: number;
    queue: Story[];
    queueIndex: number;
    error: string | null;

    // Collection context
    collectionSlug: string | null;
    isLoopable: boolean;
    loopDuration: LoopDuration;
    totalLoopTime: number; // Total time played in loop mode (in seconds)

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
    setVoiceVolume: (val: number) => void;
    setAmbientVolume: (val: number) => void;
    setPlaybackRate: (val: number) => void;
    setLoopDuration: (duration: LoopDuration) => void;

    // Refs (Advanced usage)
    audioRef: React.RefObject<HTMLAudioElement>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const PROGRESS_SYNC_INTERVAL = 10000; // 10 seconds
const CROSSFADE_DURATION = 2000; // 2 seconds crossfade

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const ambience = useAmbience();

    // --- State Machine ---
    const [status, setStatus] = useState<PlaybackStatus>('IDLE');
    const [currentStory, setCurrentStory] = useState<Story | null>(null);
    const [queue, setQueue] = useState<Story[]>([]);
    const [queueIndex, setQueueIndex] = useState<number>(-1);
    const [error, setError] = useState<string | null>(null);

    // --- Collection & Loop State ---
    const [collectionSlug, setCollectionSlug] = useState<string | null>(null);
    const [isLoopable, setIsLoopable] = useState(false);
    const [loopDuration, setLoopDuration] = useState<LoopDuration>(0); // 0 = infinite
    const [totalLoopTime, setTotalLoopTime] = useState(0);

    // --- Mobile UI State ---
    const [isMobilePlayerOpen, setIsMobilePlayerOpen] = useState(false);
    const toggleMobilePlayer = useCallback(() => setIsMobilePlayerOpen(prev => !prev), []);

    // --- Audio Properties ---
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [voiceVolume, setVoiceVolume] = useState(1.0);
    const [ambientVolume, setAmbientVolume] = useState(0.5);
    const [playbackRate, setPlaybackRate] = useState(1.0);

    // --- Refs ---
    const audioRef = useRef<HTMLAudioElement>(null);
    const ambientRefA = useRef<HTMLAudioElement | null>(null);
    const ambientRefB = useRef<HTMLAudioElement | null>(null);
    const activeAmbientRef = useRef<'A' | 'B'>('A');
    const currentPhaseRef = useRef<string>('');
    const crossfadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const progressSyncRef = useRef<number>(0);

    // Derived State
    const isPlaying = status === 'PLAYING';

    // --- Initialization ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            ambientRefA.current = new Audio();
            ambientRefB.current = new Audio();
            ambientRefA.current.loop = true;
            ambientRefB.current.loop = true;
        }

        return () => {
            ambientRefA.current?.pause();
            ambientRefB.current?.pause();
            if (crossfadeIntervalRef.current) {
                clearInterval(crossfadeIntervalRef.current);
            }
        };
    }, []);

    // --- Persistence: Load/Save Volumes ---
    useEffect(() => {
        if (user) {
            const savedVoice = localStorage.getItem(`softale_voice_vol_${user.id}`);
            const savedAmbient = localStorage.getItem(`softale_ambient_vol_${user.id}`);
            if (savedVoice) setVoiceVolume(parseFloat(savedVoice));
            if (savedAmbient) setAmbientVolume(parseFloat(savedAmbient));
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            localStorage.setItem(`softale_voice_vol_${user.id}`, voiceVolume.toString());
        }
        if (audioRef.current) audioRef.current.volume = voiceVolume;
    }, [voiceVolume, user]);

    useEffect(() => {
        if (user) {
            localStorage.setItem(`softale_ambient_vol_${user.id}`, ambientVolume.toString());
        }
        // Update both ambients immediately
        if (ambientRefA.current) ambientRefA.current.volume = ambientRefA.current.paused ? 0 : ambientVolume;
        // Note: Logic above is simplified; real logic assumes volume mixing in crossfade. 
        // For simplicity in this V2, we update master ambient capability but let logic handle specific levels.
    }, [ambientVolume, user]);


    // --- Ambient Audio Management (FSM Oriented) ---
    const getAmbientFile = useCallback((intent: string): string | null => {
        if (intent === 'SILENCE' || !intent) return null;
        return intent.toLowerCase().replace(/_/g, '-') + '.mp3';
    }, []);

    const getAmbientUrl = useCallback((intent: string): string => {
        const file = getAmbientFile(intent);
        if (!file) return '';
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/audio/ambient/${file}`;
    }, [getAmbientFile]);

    const getCurrentAudioIntent = useCallback((): { intent: string; intensity: number; phase: string } => {
        if (!currentStory?.audio_phases || currentStory.audio_phases.length === 0) {
            return { intent: 'SILENCE', intensity: 0.3, phase: 'none' };
        }
        const phases = currentStory.audio_phases;
        const progress = duration > 0 ? currentTime / duration : 0;
        const phaseMap: Record<string, [number, number]> = {
            arrival: [0, 0.35],
            exploration: [0.35, 0.6],
            deepening: [0.35, 0.8],
            fadeout: [0.8, 1.0]
        };
        for (const phase of phases) {
            const range = phaseMap[phase.phase] || [0, 1];
            if (progress >= range[0] && progress < range[1]) {
                return { intent: phase.intent, intensity: phase.intensity, phase: phase.phase };
            }
        }
        const lastPhase = phases[phases.length - 1];
        return { intent: lastPhase.intent, intensity: lastPhase.intensity, phase: lastPhase.phase };
    }, [currentStory, currentTime, duration]);

    const crossfadeTo = useCallback((newUrl: string, targetVolume: number) => {
        const outgoing = activeAmbientRef.current === 'A' ? ambientRefA.current : ambientRefB.current;
        const incoming = activeAmbientRef.current === 'A' ? ambientRefB.current : ambientRefA.current;

        if (!incoming || !outgoing) return;

        incoming.src = newUrl;
        incoming.volume = 0;
        incoming.currentTime = 0;
        incoming.play().catch(e => console.warn('Ambient play warning:', e));

        // Animation
        const steps = 20;
        const stepDuration = CROSSFADE_DURATION / steps;
        let step = 0;
        const outgoingStartVolume = outgoing.volume;

        if (crossfadeIntervalRef.current) clearInterval(crossfadeIntervalRef.current);

        crossfadeIntervalRef.current = setInterval(() => {
            step++;
            const progress = step / steps;
            const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            outgoing.volume = Math.max(0, outgoingStartVolume * (1 - eased));
            incoming.volume = targetVolume * eased;

            if (step >= steps) {
                clearInterval(crossfadeIntervalRef.current!);
                outgoing.pause();
                outgoing.src = '';
                incoming.volume = targetVolume;
                activeAmbientRef.current = activeAmbientRef.current === 'A' ? 'B' : 'A';
            }
        }, stepDuration);
    }, []);

    // Ambient Sync Loop
    useEffect(() => {
        if (!currentStory || status !== 'PLAYING') {
            // If paused or idle, pause ambients
            if (status === 'PAUSED' || status === 'IDLE') {
                ambientRefA.current?.pause();
                ambientRefB.current?.pause();
            }
            return;
        }

        const currentAudio = getCurrentAudioIntent();
        const phaseKey = `${currentAudio.phase}-${currentAudio.intent}`;

        // Ensure current ambient is playing if it should be
        const activeRef = activeAmbientRef.current === 'A' ? ambientRefA.current : ambientRefB.current;
        if (activeRef && activeRef.paused && activeRef.src) {
            activeRef.play().catch(e => console.warn("Resume ambient failed", e));
        }

        if (phaseKey !== currentPhaseRef.current) {
            // Phase Change
            currentPhaseRef.current = phaseKey;
            const newUrl = getAmbientUrl(currentAudio.intent);
            const targetVolume = ambientVolume * currentAudio.intensity;

            if (newUrl) {
                const active = activeAmbientRef.current === 'A' ? ambientRefA.current : ambientRefB.current;
                if (!active?.src || active.paused) {
                    if (active) {
                        active.src = newUrl;
                        active.volume = targetVolume;
                        active.play().catch(e => console.error("Start ambient failed", e));
                    }
                } else {
                    crossfadeTo(newUrl, targetVolume);
                }
            }
        } else {
            // Just Volume Update
            const targetVolume = ambientVolume * currentAudio.intensity;
            const active = activeAmbientRef.current === 'A' ? ambientRefA.current : ambientRefB.current;
            if (active && !active.paused) {
                // Smooth volume adjustment could go here, for now direct set
                active.volume = targetVolume;
            }
        }
    }, [currentStory, status, currentTime, getCurrentAudioIntent, getAmbientUrl, crossfadeTo, ambientVolume]);

    // --- Core Actions ---

    const play = useCallback((story: Story) => {
        if (!user) return;

        // Pause mood background audio when story starts
        ambience.pause();

        setError(null);

        // Case: Resume same story
        if (currentStory?.id === story.id && status === 'PAUSED') {
            setStatus('PLAYING');
            audioRef.current?.play().catch(e => {
                console.error("Resume failed", e);
                setStatus('ERROR');
            });
            return;
        }

        // Case: Play new story (or restart same)
        // Manage Queue
        setQueue(prev => {
            // If playing a story NOT in current queue, reset queue
            if (!prev.find(s => s.id === story.id)) {
                return [story];
            }
            return prev;
        });

        // If it's a new story logic
        if (currentStory?.id !== story.id) {
            setQueueIndex(prev => {
                // If we are playing from queue, ensure index is correct
                // This is tricky b/c we can't read new queue state yet.
                // We rely on 'playQueue' for strict queue start.
                // internal 'play' implies jumping to a track.
                return 0; // Simplified for single track play
            });
            setCurrentStory(story);
            currentPhaseRef.current = '';
            // Reset collection context for single story play
            setCollectionSlug(null);
            // Check if single story is loopable
            const loopableCategories = ['soundscape', 'binaural', 'music_instrumental'];
            setIsLoopable(loopableCategories.includes(story.category));
            setLoopDuration(0);
            setTotalLoopTime(0);
            setStatus('LOADING');
        } else {
            // Same story, from start?
            setStatus('PLAYING');
            audioRef.current?.play();
        }

    }, [currentStory, status, user]);

    const playQueue = useCallback((stories: Story[], startIndex = 0, collectionInfo?: { slug: string; isLoopable: boolean }) => {
        if (!user || stories.length === 0) return;

        // Pause mood background audio when queue starts
        ambience.pause();

        setQueue(stories);
        setQueueIndex(startIndex);
        // Direct state update for immediate reaction
        const targetStory = stories[startIndex];
        setCurrentStory(targetStory);
        currentPhaseRef.current = '';
        setStatus('LOADING');
        // Set collection context
        if (collectionInfo) {
            setCollectionSlug(collectionInfo.slug);
            setIsLoopable(collectionInfo.isLoopable);
            setTotalLoopTime(0); // Reset loop time when starting new collection
        } else {
            setCollectionSlug(null);
            setIsLoopable(false);
        }
        // Audio element will react to 'currentStory' change
    }, [user]);

    const pause = useCallback(() => {
        setStatus('PAUSED');
        audioRef.current?.pause();
        // Resume mood background when story is paused
        ambience.resumeIfWasPlaying();
    }, [ambience]);

    const toggle = useCallback(() => {
        if (status === 'PLAYING') pause();
        else if (status === 'PAUSED') {
            // Pause mood audio when resuming story
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
    }, [queue, queueIndex]);

    const previous = useCallback(() => {
        if (queueIndex > 0) {
            const prevIndex = queueIndex - 1;
            setQueueIndex(prevIndex);
            const prevStory = queue[prevIndex];
            setCurrentStory(prevStory);
            currentPhaseRef.current = '';
            setStatus('LOADING');
        } else {
            // Restart
            if (audioRef.current) audioRef.current.currentTime = 0;
        }
    }, [queue, queueIndex]);

    const seek = useCallback((time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    // --- Audio Event Handlers ---

    // Auto-play when source changes and status is LOADING
    useEffect(() => {
        if (status === 'LOADING' && currentStory?.audio_url && audioRef.current) {
            // Double check we are ready
            // We rely on onCanPlay or similar, but simplified:
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setStatus('PLAYING');
                }).catch(e => {
                    console.error("Autoplay failed", e);
                    // Usually AbortError if replaced quickly
                });
            }
        }
    }, [currentStory, status]);

    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
        const time = e.currentTarget.currentTime;
        const prevTime = currentTime;
        setCurrentTime(time);

        // Update total loop time if in loop mode
        if (isLoopable && status === 'PLAYING') {
            const timeDelta = time - prevTime;
            if (timeDelta > 0 && timeDelta < 2) { // Avoid big jumps from seeking
                setTotalLoopTime(prev => {
                    const newTotal = prev + timeDelta;
                    // Check if we've reached the duration limit
                    if (loopDuration > 0 && newTotal >= loopDuration * 60) {
                        // Stop playback
                        setTimeout(() => {
                            pause();
                            setTotalLoopTime(0);
                        }, 0);
                    }
                    return newTotal;
                });
            }
        }

        // Sync Progress (Skip for loopable content to save DB writes)
        const now = Date.now();
        if (user && currentStory && !isLoopable && (now - progressSyncRef.current > PROGRESS_SYNC_INTERVAL)) {
            updateListeningProgress(user.id, currentStory.id, Math.floor(time), false);
            progressSyncRef.current = now;
        }
    };

    const handleEnded = () => {
        if (user && currentStory) {
            updateListeningProgress(user.id, currentStory.id, Math.floor(duration), true);
        }

        if (queueIndex < queue.length - 1) {
            next();
        } else if (isLoopable) {
            // Loop back to first track in the queue
            setQueueIndex(0);
            const firstStory = queue[0];
            if (firstStory) {
                setCurrentStory(firstStory);
                currentPhaseRef.current = '';
                setStatus('LOADING');
            }
        } else {
            // Story ended naturally (not looped, not queued)
            setStatus('IDLE');
            // Resume mood background if it was playing before
            ambience.resumeIfWasPlaying();
            // Reset to beginning?
            seek(0);
        }
    };

    const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
        console.error("Audio Error", e);
        setError("Playback failed. Please check your connection.");
        setStatus('ERROR');
    };

    return (
        <PlayerContext.Provider value={{
            currentStory, status, isPlaying, error,
            currentTime, duration, voiceVolume, ambientVolume, playbackRate,
            queue, queueIndex,
            collectionSlug, isLoopable, loopDuration, totalLoopTime,
            isMobilePlayerOpen, toggleMobilePlayer, setMobilePlayerOpen: setIsMobilePlayerOpen,
            play, playQueue, next, previous, pause, toggle, seek,
            setVoiceVolume, setAmbientVolume, setPlaybackRate, setLoopDuration,
            audioRef: audioRef as React.RefObject<HTMLAudioElement>
        }}>
            {children}
            {currentStory?.audio_url && (
                <audio
                    ref={audioRef}
                    src={currentStory.audio_url}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleEnded}
                    onError={handleError}
                    onLoadedMetadata={(e) => {
                        setDuration(e.currentTarget.duration);
                        if (status === 'LOADING') {
                            // Ready to play logic handled by effect, but good to ensure
                        }
                    }}
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
