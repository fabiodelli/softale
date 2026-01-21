'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';
import type { Story } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';
import { updateListeningProgress, incrementListeningTime, checkAndIncrementStreak, incrementStoriesCompleted } from '@/lib/supabase';
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
    musicVolume: number; // New V6 Stem
    ambientVolume: number;
    playbackRate: number;
    queue: Story[];
    queueIndex: number;
    error: string | null;

    // Collection context
    collectionSlug: string | null;
    isLoopable: boolean;
    // V6: Flag to know if we are in stem mode
    hasStems: boolean;
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
    setMusicVolume: (val: number) => void; // New V6
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
    const [musicVolume, setMusicVolume] = useState(0.5); // New V6
    const [ambientVolume, setAmbientVolume] = useState(0.5);
    const [playbackRate, setPlaybackRate] = useState(1.0);

    // --- Refs ---
    const audioRef = useRef<HTMLAudioElement>(null); // Voice (or Master Legacy)
    const musicRef = useRef<HTMLAudioElement | null>(null); // Music Stem
    const ambientRefA = useRef<HTMLAudioElement | null>(null); // Ambience A
    const ambientRefB = useRef<HTMLAudioElement | null>(null);
    const activeAmbientRef = useRef<'A' | 'B'>('A');
    const currentPhaseRef = useRef<string>('');
    const crossfadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const progressSyncRef = useRef<number>(0);
    const accumulatedTimeRef = useRef<number>(0);

    // Derived State
    const isPlaying = status === 'PLAYING';

    // --- Initialization ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            musicRef.current = new Audio();
            musicRef.current.loop = true; // Music always loops in stem mode
            ambientRefA.current = new Audio();
            ambientRefB.current = new Audio();
            ambientRefA.current.loop = true;
            ambientRefB.current.loop = true;
        }

        return () => {
            musicRef.current?.pause();
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
            const savedMusic = localStorage.getItem(`softale_music_vol_${user.id}`);
            if (savedVoice) setVoiceVolume(parseFloat(savedVoice));
            if (savedAmbient) setAmbientVolume(parseFloat(savedAmbient));
            if (savedMusic) setMusicVolume(parseFloat(savedMusic));
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
            localStorage.setItem(`softale_music_vol_${user.id}`, musicVolume.toString());
        }
        if (musicRef.current) musicRef.current.volume = musicVolume;
    }, [musicVolume, user]);

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
                musicRef.current?.pause();
                ambientRefA.current?.pause();
                ambientRefB.current?.pause();
            }
            return;
        }

        // V6 STEM LOGIC
        if (currentStory.voice_url && currentStory.music_url) {
            // Ensure Music is Playing
            if (musicRef.current && musicRef.current.paused) {
                musicRef.current.src = currentStory.music_url;
                musicRef.current.volume = musicVolume;
                musicRef.current.play().catch(e => console.warn("Music play failed", e));
            }

            // Ensure Ambience is Playing (Simple Loop Mode for Stems)
            if (currentStory.ambient_url) {
                const active = activeAmbientRef.current === 'A' ? ambientRefA.current : ambientRefB.current;
                if (active && (active.paused || active.src !== currentStory.ambient_url)) {
                    active.src = currentStory.ambient_url;
                    active.volume = ambientVolume;
                    active.play().catch(e => console.warn("Stem Ambience play failed", e));
                }
            }
            return; // Skip Legacy Logic
        }

        // LEGACY INTENT LOGIC (For V5 stories without stems)
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
    }, [currentStory, status, currentTime, getCurrentAudioIntent, getAmbientUrl, crossfadeTo, ambientVolume, musicVolume]);

    // --- Core Actions ---

    const play = useCallback((story: Story) => {
        if (!user) return;

        trackEvent('story_play', { story_id: story.id, story_title: story.title, category: story.category });

        // Check Streak on Play
        checkAndIncrementStreak(user.id).catch(e => console.error("Streak check failed", e));

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
            // V6: Determine which source to use
            const hasStems = !!(story.voice_url && story.music_url); // Basic check

            setStatus('PLAYING');
            audioRef.current?.play();
            if (hasStems) {
                musicRef.current?.play();
                const active = activeAmbientRef.current === 'A' ? ambientRefA.current : ambientRefB.current;
                active?.play();
            }
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

        // Pause Stems
        musicRef.current?.pause();
        const active = activeAmbientRef.current === 'A' ? ambientRefA.current : ambientRefB.current;
        active?.pause();

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
            // No need to seek loops (Music/Ambient), they just loop
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
                    // Sync Stems if needed
                    if (currentStory?.voice_url && currentStory.music_url) {
                        if (musicRef.current) {
                            musicRef.current.src = currentStory.music_url;
                            musicRef.current.volume = musicVolume;
                            musicRef.current.play().catch(e => console.warn("Music autoplay failed", e));
                        }
                    }
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
        if (user && currentStory && !isLoopable) {
            // 1. Sync Playback Position
            if (now - progressSyncRef.current > PROGRESS_SYNC_INTERVAL) {
                updateListeningProgress(user.id, currentStory.id, Math.floor(time), false);
                progressSyncRef.current = now;
            }

            // 2. Track Minutes Listened
            const delta = Math.max(0, time - prevTime);
            if (delta < 5) { // Avoid seeking jumps
                accumulatedTimeRef.current += delta;
                if (accumulatedTimeRef.current >= 60) {
                    incrementListeningTime(user.id, 1).catch(e => console.error("Time tracking failed", e));
                    accumulatedTimeRef.current -= 60;
                }
            }
        }
    };

    const handleEnded = () => {
        if (user && currentStory) {
            trackEvent('story_complete', { story_id: currentStory.id, story_title: currentStory.title, duration_listened: duration });
            updateListeningProgress(user.id, currentStory.id, Math.floor(duration), true);
            incrementStoriesCompleted(user.id).catch(e => console.error("Completion tracking failed", e));
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
            currentTime, duration,
            voiceVolume, musicVolume, ambientVolume,
            playbackRate,
            queue, queueIndex,
            collectionSlug, isLoopable, loopDuration, totalLoopTime,
            hasStems: !!(currentStory?.voice_url), // Expose flag
            isMobilePlayerOpen, toggleMobilePlayer, setMobilePlayerOpen: setIsMobilePlayerOpen,
            play, playQueue, next, previous, pause, toggle, seek,
            setVoiceVolume, setMusicVolume, setAmbientVolume, setPlaybackRate, setLoopDuration,
            audioRef: audioRef as React.RefObject<HTMLAudioElement>
        }}>
            {children}
            {(currentStory?.audio_url || currentStory?.voice_url) && (
                <audio
                    ref={audioRef}
                    // V6: Prefer voice_url, fall back to mixed audio_url
                    src={currentStory?.voice_url || currentStory?.audio_url}
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
