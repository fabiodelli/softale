import { create } from 'zustand';
import { audio } from '@/lib/audio/AudioEngine';
import { Story } from '@/lib/supabase/types';

interface PlayerState {
    // State
    isPlaying: boolean;
    isBuffering: boolean;
    currentTime: number;
    duration: number;
    currentStory: Story | null;
    volumes: {
        voice: number;
        music: number;
        ambience: number;
    };

    // Actions
    play: () => void;
    pause: () => void;
    toggle: () => void;
    seek: (time: number) => void;
    loadStory: (story: Story) => Promise<void>;
    setVolume: (type: 'voice' | 'music' | 'ambience', value: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
    // Sync with Audio Engine
    audio.on('statechange', (state) => {
        set({
            isPlaying: state.isPlaying,
            isBuffering: state.isBuffering,
            duration: state.duration,
            volumes: state.volumes
        });
    });

    audio.on('timeupdate', (state) => {
        set({ currentTime: state.currentTime });
    });

    audio.on('ended', () => {
        set({ isPlaying: false, currentTime: 0 });
    });

    return {
        isPlaying: false,
        isBuffering: false,
        currentTime: 0,
        duration: 0,
        currentStory: null,
        volumes: {
            voice: 1.0,
            music: 0.5,
            ambience: 0.3
        },

        play: () => audio.play(),
        pause: () => audio.pause(),

        toggle: () => {
            const { isPlaying } = get();
            if (isPlaying) audio.pause();
            else audio.play();
        },

        seek: (time: number) => audio.seek(time),

        loadStory: async (story: Story) => {
            set({ currentStory: story });
            await audio.loadStory(story);
            audio.play();
        },

        setVolume: (type, value) => {
            audio.setVolume(type, value);
            // Optimistic update
            set((state) => ({
                volumes: { ...state.volumes, [type]: value }
            }));
        }
    };
});
