import { useRef, useCallback, useEffect } from 'react';
import type { Story } from '@/lib/supabase';

const CROSSFADE_DURATION = 2000;

export function useAmbientEngine(
    currentStory: Story | null,
    duration: number,
    currentTime: number,
    ambientRefA: React.MutableRefObject<HTMLAudioElement | null>,
    ambientRefB: React.MutableRefObject<HTMLAudioElement | null>,
    activeAmbientRef: React.MutableRefObject<'A' | 'B'>,
    ambientVolume: number
) {
    const currentPhaseRef = useRef<string>('');
    const crossfadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        const rawPhases = Array.isArray(currentStory?.audio_phases) ? currentStory.audio_phases : [];
        if (rawPhases.length === 0) {
            return { intent: 'SILENCE', intensity: 0.3, phase: 'none' };
        }

        // Define shape and cast
        interface AudioPhase {
            intent: string;
            intensity: number;
            phase: string;
        }
        const phases = rawPhases as unknown as AudioPhase[];

        const progress = duration > 0 ? currentTime / duration : 0;
        const phaseMap: Record<string, [number, number]> = {
            arrival: [0, 0.35],
            exploration: [0.35, 0.6],
            deepening: [0.35, 0.8],
            fadeout: [0.8, 1.0]
        };
        for (const phase of phases) {
            // @ts-ignore
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
                if (crossfadeIntervalRef.current) clearInterval(crossfadeIntervalRef.current);
                outgoing.pause();
                outgoing.src = '';
                incoming.volume = targetVolume;
                activeAmbientRef.current = activeAmbientRef.current === 'A' ? 'B' : 'A';
            }
        }, stepDuration);
    }, [activeAmbientRef, ambientRefA, ambientRefB]);

    const fadeTo = useCallback((audio: HTMLAudioElement, targetVol: number, duration: number = 1000) => {
        const startVol = audio.volume;
        const diff = targetVol - startVol;
        if (Math.abs(diff) < 0.01) {
            audio.volume = targetVol;
            return;
        }

        const steps = 20;
        const stepTime = duration / steps;

        let step = 0;
        const interval = setInterval(() => {
            step++;
            const progress = step / steps;
            const factor = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            const newVol = startVol + diff * factor;
            audio.volume = Math.max(0, Math.min(1, newVol));

            if (step >= steps) {
                clearInterval(interval);
                audio.volume = targetVol;
            }
        }, stepTime);
    }, []);

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (crossfadeIntervalRef.current) clearInterval(crossfadeIntervalRef.current);
        };
    }, []);

    return {
        currentPhaseRef,
        getCurrentAudioIntent,
        getAmbientUrl,
        crossfadeTo,
        fadeTo
    };
}
