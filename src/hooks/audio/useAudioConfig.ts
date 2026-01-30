import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthProvider';

export interface AudioConfig {
    voiceVolume: number;
    musicVolume: number;
    ambientVolume: number;
    playbackRate: number;
    loopDuration: number;
    setVoiceVolume: (val: number) => void;
    setMusicVolume: (val: number) => void;
    setAmbientVolume: (val: number) => void;
    setPlaybackRate: (val: number) => void;
    setLoopDuration: (val: number) => void;
}

export function useAudioConfig(): AudioConfig {
    const { user } = useAuth();

    const [voiceVolume, setVoiceVolume] = useState(1.0);
    const [musicVolume, setMusicVolume] = useState(0.5);
    const [ambientVolume, setAmbientVolume] = useState(0.5);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [loopDuration, setLoopDuration] = useState(0);

    // Load saved volumes
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

    // Save volumes on change
    useEffect(() => {
        if (user) {
            localStorage.setItem(`softale_voice_vol_${user.id}`, voiceVolume.toString());
        }
    }, [voiceVolume, user]);

    useEffect(() => {
        if (user) {
            localStorage.setItem(`softale_music_vol_${user.id}`, musicVolume.toString());
        }
    }, [musicVolume, user]);

    useEffect(() => {
        if (user) {
            localStorage.setItem(`softale_ambient_vol_${user.id}`, ambientVolume.toString());
        }
    }, [ambientVolume, user]);

    return {
        voiceVolume,
        musicVolume,
        ambientVolume,
        playbackRate,
        loopDuration,
        setVoiceVolume,
        setMusicVolume,
        setAmbientVolume,
        setPlaybackRate,
        setLoopDuration
    };
}
