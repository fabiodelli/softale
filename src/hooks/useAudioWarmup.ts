import { useEffect, useState, useRef } from 'react';

interface UseAudioWarmupProps {
    warmupDuration?: number; // In seconds
    isPlaying: boolean;
    currentTime: number;
}

export function useAudioWarmup({ warmupDuration = 0, isPlaying, currentTime }: UseAudioWarmupProps) {
    const [isWarmingUp, setIsWarmingUp] = useState(false);

    useEffect(() => {
        if (!warmupDuration || warmupDuration <= 0) {
            setIsWarmingUp(false);
            return;
        }

        // Check if we are within the warmup window
        if (currentTime < warmupDuration) {
            setIsWarmingUp(true);
        } else {
            setIsWarmingUp(false);
        }
    }, [currentTime, warmupDuration]);

    return { isWarmingUp };
}
