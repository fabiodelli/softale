'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

type AmbienceTrack = {
    id: string;
    name: string;
    icon: string; // Emoji for now, icon component later
    src: string;
};

// Define our Foundation Assets (to be generated)
export const AMBIENCE_TRACKS: AmbienceTrack[] = [
    { id: 'rain', name: 'Light Rain', icon: '🌧️', src: '/assets/ambience/rain.mp3' },
    { id: 'night', name: 'Night Nature', icon: '🦗', src: '/assets/ambience/night.mp3' },
    { id: 'forest', name: 'Forest', icon: '🌲', src: '/assets/ambience/forest.mp3' },
    { id: 'thunder', name: 'Storm', icon: '⛈️', src: '/assets/ambience/thunder.mp3' },
    { id: 'wind', name: 'Wind', icon: '💨', src: '/assets/ambience/wind.mp3' },
    { id: 'river', name: 'River', icon: '🌊', src: '/assets/ambience/river.mp3' },
    { id: 'ocean', name: 'Ocean', icon: '🌊', src: '/assets/ambience/ocean.mp3' },
    { id: 'fire', name: 'Fireplace', icon: '🔥', src: '/assets/ambience/fire.mp3' },
    { id: 'white_noise', name: 'White Noise', icon: '🌫️', src: '/assets/ambience/whitenoise.mp3' },
    { id: 'brown_noise', name: 'Brown Noise', icon: '🟤', src: '/assets/ambience/brownnoise.mp3' },
];

interface AmbienceContextType {
    currentTrack: AmbienceTrack | null;
    isPlaying: boolean;
    volume: number; // 0 to 1
    togglePlay: () => void;
    setTrack: (trackId: string) => void;
    setVolume: (val: number) => void;
    // Coordination with PlayerContext
    pause: () => void;                  // Pause and remember state (for story playback)
    resumeIfWasPlaying: () => void;     // Resume only if was playing before interruption
}

const AmbienceContext = createContext<AmbienceContextType | undefined>(undefined);

export function AmbienceProvider({ children }: { children: React.ReactNode }) {
    const [currentTrack, setCurrentTrack] = useState<AmbienceTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Track if ambience was playing before being interrupted by story playback
    const wasPlayingBeforeInterrupt = useRef(false);

    // Initial setup or hydration could go here (load saved preference)

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying && currentTrack) {
                audioRef.current.play().catch(e => console.log("Autoplay prevented:", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, currentTrack]);

    const togglePlay = () => {
        if (!currentTrack) {
            setTrack(AMBIENCE_TRACKS[0].id);
        } else {
            const newState = !isPlaying;
            setIsPlaying(newState);
            // CRITICAL FIX: If user manually toggles, update the 'restore' intention.
            // This ensures that if they turn it OFF while a story is playing,
            // it won't auto-resume when the story ends.
            wasPlayingBeforeInterrupt.current = newState;
        }
    };

    const setTrack = (trackId: string) => {
        const track = AMBIENCE_TRACKS.find(t => t.id === trackId);
        if (track) {
            if (currentTrack?.id === track.id) {
                togglePlay();
            } else {
                setCurrentTrack(track);
                setIsPlaying(true);
                // User manually started a track, so we should restore to this if interrupted
                wasPlayingBeforeInterrupt.current = true;
            }
        }
    };

    // Coordination methods for PlayerContext integration
    const pause = useCallback(() => {
        // Remember if we were playing before being interrupted
        wasPlayingBeforeInterrupt.current = isPlaying;
        if (isPlaying && audioRef.current) {
            // Directly pause the audio element and update state
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, [isPlaying]);

    const resumeIfWasPlaying = useCallback(() => {
        // Only resume if we were playing before the interruption
        if (wasPlayingBeforeInterrupt.current && currentTrack && audioRef.current) {
            audioRef.current.play().catch(e => console.log("Resume prevented:", e));
            setIsPlaying(true);
        }
        // Reset the flag
        wasPlayingBeforeInterrupt.current = false;
    }, [currentTrack]);

    return (
        <AmbienceContext.Provider value={{
            currentTrack,
            isPlaying,
            volume,
            togglePlay,
            setTrack,
            setVolume,
            pause,
            resumeIfWasPlaying
        }}>
            {children}
            {/* Hidden Player */}
            <audio
                ref={audioRef}
                src={currentTrack?.src}
                loop
                onError={(e) => console.log("Audio load error (File missing?):", e)}
            />
        </AmbienceContext.Provider>
    );
}

export const useAmbience = () => {
    const context = useContext(AmbienceContext);
    if (!context) throw new Error('useAmbience must be used within AmbienceProvider');
    return context;
};
