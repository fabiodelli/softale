import { create } from 'zustand';
import { audio } from '@/lib/audio/AudioEngine';
import { Story } from '@/lib/supabase/types';

export type PlaybackStatus = 'IDLE' | 'LOADING' | 'PLAYING' | 'PAUSED' | 'ERROR';

interface PlayerState {
    // State
    status: PlaybackStatus;
    isPlaying: boolean;
    isBuffering: boolean;
    currentTime: number;
    duration: number;
    currentStory: Story | null;
    queue: Story[];
    queueIndex: number;
    error: string | null;

    // Collection / Loop State
    collectionSlug: string | null;
    isLoopable: boolean;

    // Audio Config State (Synced with AudioEngine)
    volumes: {
        voice: number;
        music: number;
        ambience: number;
    };

    // Actions
    play: (story?: Story) => Promise<void>;
    pause: () => void;
    toggle: () => void;
    seek: (time: number) => void;
    next: () => void;
    previous: () => void;
    playQueue: (stories: Story[], startIndex?: number, collectionInfo?: { slug: string; isLoopable: boolean }) => Promise<void>;

    setVolume: (type: 'voice' | 'music' | 'ambience', value: number) => void;
    setQueue: (stories: Story[]) => void;
    setStatus: (status: PlaybackStatus) => void;
    setError: (error: string | null) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    // Initial State
    status: 'IDLE',
    isPlaying: false,
    isBuffering: false,
    currentTime: 0,
    duration: 0,
    currentStory: null,
    queue: [],
    queueIndex: -1,
    error: null,
    collectionSlug: null,
    isLoopable: false,
    volumes: {
        voice: 1.0,
        music: 0.5,
        ambience: 0.3
    },

    // Actions
    play: async (story?: Story) => {
        const state = get();

        // Resume current if no story provided
        if (!story) {
            if (state.currentStory) {
                audio.play();
                set({ status: 'PLAYING', isPlaying: true });
            }
            return;
        }

        // If same story and paused, resume
        if (state.currentStory?.id === story.id && state.status === 'PAUSED') {
            audio.play();
            set({ status: 'PLAYING', isPlaying: true });
            return;
        }

        // New Story Setup
        // Check if story is in queue, if not, reset queue to just this story
        // This is a simplification to ensure predictable behavior
        let newQueue = state.queue;
        let newIndex = state.queueIndex;

        const existingIndex = state.queue.findIndex(s => s.id === story.id);
        if (existingIndex !== -1) {
            newIndex = existingIndex;
        } else {
            newQueue = [story];
            newIndex = 0;
        }

        // Detect loopable content based on category (Soundscapes, etc.)
        const loopableCategories = ['soundscape', 'nature', 'binaural', 'instrumental'];
        const shouldLoop = loopableCategories.includes(story.category?.toLowerCase() || '');

        set({
            currentStory: story,
            status: 'LOADING',
            error: null,
            queue: newQueue,
            queueIndex: newIndex,
            isLoopable: shouldLoop // Auto-set loop state
        });

        try {
            await audio.loadStory(story);
            audio.play();
            // Status update handled by event listener
        } catch (e) {
            console.error("Playback Error:", e);
            set({ status: 'ERROR', error: "Failed to load story" });
        }
    },

    pause: () => {
        audio.pause();
        set({ status: 'PAUSED', isPlaying: false });
    },

    toggle: () => {
        const { status } = get();
        if (status === 'PLAYING') get().pause();
        else get().play(); // Resume or play current
    },

    seek: (time: number) => {
        audio.seek(time);
        set({ currentTime: time });
    },

    next: () => {
        const { queue, queueIndex } = get();
        if (queueIndex < queue.length - 1) {
            const nextIndex = queueIndex + 1;
            const nextStory = queue[nextIndex];
            set({ queueIndex: nextIndex });
            get().play(nextStory);
        }
    },

    previous: () => {
        const { queue, queueIndex, currentTime } = get();

        // If more than 3 sec in, restart current
        if (currentTime > 3) {
            get().seek(0);
            return;
        }

        if (queueIndex > 0) {
            const prevIndex = queueIndex - 1;
            const prevStory = queue[prevIndex];
            set({ queueIndex: prevIndex });
            get().play(prevStory);
        }
    },

    playQueue: async (stories, startIndex = 0, collectionInfo) => {
        if (stories.length === 0) return;

        set({
            queue: stories,
            queueIndex: startIndex,
            collectionSlug: collectionInfo?.slug || null,
            isLoopable: collectionInfo?.isLoopable || false
        });

        const targetStory = stories[startIndex];
        // We call play() but we ensure it uses the queue we just set
        // Since play() checks logic, we might need to be careful.
        // Direct load might be safer here to avoid logic conflicts.

        set({
            currentStory: targetStory,
            status: 'LOADING',
            error: null
        });

        try {
            await audio.loadStory(targetStory);
            audio.play();
            // Status update handled by event listener
        } catch (e) {
            console.error("Playback Error:", e);
            set({ status: 'ERROR', error: "Failed to load story" });
        }
    },

    setVolume: (type, value) => {
        audio.setVolume(type, value);
        set((state) => ({
            volumes: { ...state.volumes, [type]: value }
        }));
    },

    setQueue: (stories) => set({ queue: stories }),
    setStatus: (status) => set({ status }),
    setError: (error) => set({ error })
}));

// --- Audio Engine Listeners Setup ---
// We attach these once. Since audio is a singleton, this is safe.

if (typeof window !== 'undefined') {
    // Debounce state updates if needed, but Zustand is fast.

    audio.on('statechange', (state) => {
        usePlayerStore.setState({
            isPlaying: state.isPlaying,
            isBuffering: state.isBuffering,
            duration: state.duration,
            volumes: state.volumes
        });

        // Infer Status
        const currentStatus = usePlayerStore.getState().status;
        if (state.isPlaying && currentStatus !== 'PLAYING') {
            usePlayerStore.setState({ status: 'PLAYING' });
        } else if (!state.isPlaying && currentStatus === 'PLAYING') {
            usePlayerStore.setState({ status: 'PAUSED' });
        }
    });

    audio.on('timeupdate', (state) => {
        usePlayerStore.setState({ currentTime: state.currentTime });
    });

    audio.on('ended', () => {
        const { queue, queueIndex, isLoopable, collectionSlug } = usePlayerStore.getState();
        const { next, seek, play, playQueue } = usePlayerStore.getState(); // Actions

        if (queueIndex < queue.length - 1) {
            next();
        } else if (isLoopable) {
            if (queue.length === 1) {
                seek(0);
                play();
            } else {
                // Restart queue logic
                // Pass existing queue to playQueue to restart from 0
                playQueue(queue, 0, { slug: collectionSlug || '', isLoopable: true });
            }
        } else {
            usePlayerStore.setState({ status: 'IDLE', isPlaying: false, currentTime: 0 });
        }
    });

    audio.on('error', (err) => {
        console.error("Audio Error:", err);
        usePlayerStore.setState({ status: 'ERROR', error: "Playback Error" });
    });
}
