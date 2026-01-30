import { useRef } from 'react';
import { updateListeningProgress, incrementListeningTime, checkAndIncrementStreak } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';
import type { Story } from '@/lib/supabase';

const PROGRESS_SYNC_INTERVAL = 10000; // 10 seconds

export function useProgressTracker() {
    const { user } = useAuth();
    const progressSyncRef = useRef<number>(0);
    const accumulatedTimeRef = useRef<number>(0);

    const checkStreak = async () => {
        if (!user) return;
        try {
            await checkAndIncrementStreak(user.id);
        } catch (e) {
            console.error("Streak check failed", e);
        }
    };

    const trackProgress = (story: Story, currentTime: number, prevTime: number, isLoopable: boolean) => {
        if (!user || isLoopable) return;

        const now = Date.now();

        // 1. Sync Playback Position
        if (now - progressSyncRef.current > PROGRESS_SYNC_INTERVAL) {
            updateListeningProgress(user.id, story.id, Math.floor(currentTime), false);
            progressSyncRef.current = now;
        }

        // 2. Track Minutes Listened
        const delta = Math.max(0, currentTime - prevTime);
        if (delta < 5) { // Avoid seeking jumps
            accumulatedTimeRef.current += delta;
            if (accumulatedTimeRef.current >= 60) {
                incrementListeningTime(user.id, 1).catch(e => console.error("Time tracking failed", e));
                accumulatedTimeRef.current -= 60;
            }
        }
    };

    const markComplete = (story: Story, duration: number) => {
        if (!user) return;
        updateListeningProgress(user.id, story.id, Math.floor(duration), true);
    };

    return {
        trackProgress,
        markComplete,
        checkStreak
    };
}
