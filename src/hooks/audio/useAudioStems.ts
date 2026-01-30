import { useRef, useEffect } from 'react';

export function useAudioStems() {
    const musicRef = useRef<HTMLAudioElement | null>(null);
    const ambientRefA = useRef<HTMLAudioElement | null>(null);
    const ambientRefB = useRef<HTMLAudioElement | null>(null);
    const activeAmbientRef = useRef<'A' | 'B'>('A');

    // Initialize Audio elements
    useEffect(() => {
        if (typeof window !== 'undefined') {
            musicRef.current = new Audio();
            musicRef.current.loop = true;
            ambientRefA.current = new Audio();
            ambientRefB.current = new Audio();
            ambientRefA.current.loop = true;
            ambientRefB.current.loop = true;
        }

        return () => {
            musicRef.current?.pause();
            ambientRefA.current?.pause();
            ambientRefB.current?.pause();
        };
    }, []);

    const pauseAllStems = () => {
        musicRef.current?.pause();
        ambientRefA.current?.pause();
        ambientRefB.current?.pause();
    };

    const updateStemVolumes = (musicVolume: number, ambientVolume: number) => {
        if (musicRef.current) musicRef.current.volume = musicVolume;

        // Only update active ambient or handle mixing logic if needed
        // For simple sync, we update the active one mostly
        const active = activeAmbientRef.current === 'A' ? ambientRefA.current : ambientRefB.current;
        if (active) active.volume = active.paused ? 0 : ambientVolume;
    };

    return {
        musicRef,
        ambientRefA,
        ambientRefB,
        activeAmbientRef,
        pauseAllStems,
        updateStemVolumes
    };
}
