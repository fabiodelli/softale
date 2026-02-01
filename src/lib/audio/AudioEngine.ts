import { Story } from '@/lib/supabase/types';

interface AudioState {
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    isBuffering: boolean;
    volumes: {
        voice: number;
        music: number;
        ambience: number;
    };
}

type AudioEventType = 'timeupdate' | 'ended' | 'statechange' | 'error';
type AudioEventHandler = (state: AudioState) => void;

class AudioEngine {
    private static instance: AudioEngine;

    // Audio Elements
    private voice: HTMLAudioElement | null = null;
    private music: HTMLAudioElement | null = null;
    private ambienceA: HTMLAudioElement | null = null;
    private ambienceB: HTMLAudioElement | null = null;
    private activeAmbience: 'A' | 'B' = 'A';

    // Crossfade State
    private crossfadeInterval: NodeJS.Timeout | null = null;
    private readonly CROSSFADE_DURATION = 2000;


    // State
    private state: AudioState = {
        currentTime: 0,
        duration: 0,
        isPlaying: false,
        isBuffering: false,
        volumes: {
            voice: 1.0,
            music: 0.5,
            ambience: 0.3
        }
    };

    private listeners: Map<AudioEventType, Set<AudioEventHandler>> = new Map();
    private rafId: number | null = null;

    private constructor() {
        if (typeof window !== 'undefined') {
            this.initAudioElements();
        }
    }

    public static getInstance(): AudioEngine {
        if (!AudioEngine.instance) {
            AudioEngine.instance = new AudioEngine();
        }
        return AudioEngine.instance;
    }

    private initAudioElements() {
        this.voice = new Audio();
        this.music = new Audio();
        this.ambienceA = new Audio();
        this.ambienceB = new Audio();

        // Configure loops
        if (this.music) this.music.loop = true;
        if (this.ambienceA) this.ambienceA.loop = true;
        if (this.ambienceB) this.ambienceB.loop = true;

        // Attach base listeners only to voice (master timekeeper)
        this.voice.addEventListener('timeupdate', this.handleTimeUpdate);
        this.voice.addEventListener('ended', this.handleEnded);
        this.voice.addEventListener('waiting', () => this.setBuffering(true));
        this.voice.addEventListener('playing', () => this.setBuffering(false));

        // Error handling
        [this.voice, this.music, this.ambienceA, this.ambienceB].forEach(audio => {
            audio?.addEventListener('error', (e) => {
                console.error('Audio Error', e);
                this.emit('error', this.state);
            });
        });
    }

    public async loadStory(story: Story) {
        if (!this.voice || !this.music || !this.ambienceA) return;

        this.pause();
        this.state.currentTime = 0;
        this.state.duration = story.duration || 0;

        // Load sources
        this.voice.src = story.voice_url || story.audio_url || '';

        if (story.music_url) this.music.src = story.music_url;
        else this.music.removeAttribute('src');

        if (story.ambient_url) this.ambienceA.src = story.ambient_url;
        else this.ambienceA.removeAttribute('src');

        this.ambienceB!.removeAttribute('src');
        this.activeAmbience = 'A';

        // Apply volumes
        this.voice.volume = this.state.volumes.voice;
        this.music.volume = this.state.volumes.music;
        this.ambienceA.volume = this.state.volumes.ambience;

        // Preload
        try {
            await Promise.all([
                this.voice.load(),
                story.music_url && this.music.load(),
                story.ambient_url && this.ambienceA.load()
            ]);
            this.emit('statechange', this.state);
        } catch (e) {
            console.error("Failed to load audio", e);
        }
    }

    public play() {
        if (this.state.isPlaying) return;

        // Optimistic update to prevent state flickering during buffering/loading
        this.state.isPlaying = true;
        this.emit('statechange', this.state);

        const playPromise = Promise.all([
            this.voice?.play(),
            this.music?.src && this.music?.play(),
            this.activeAmbience === 'A' ? this.ambienceA?.src && this.ambienceA?.play() : this.ambienceB?.src && this.ambienceB?.play()
        ]);

        playPromise.then(() => {
            this.state.isPlaying = true;
            this.startLoop();
            this.emit('statechange', this.state);
        }).catch(e => {
            console.error("Play failed", e);
            // Revert state on failure
            this.state.isPlaying = false;
            this.emit('statechange', this.state);
            this.emit('error', this.state);
        });
    }

    public pause() {
        if (!this.state.isPlaying) return;

        this.voice?.pause();
        this.music?.pause();
        this.ambienceA?.pause();
        this.ambienceB?.pause();

        this.state.isPlaying = false;
        this.stopLoop();
        this.emit('statechange', this.state);

        if (this.crossfadeInterval) {
            clearInterval(this.crossfadeInterval);
            this.crossfadeInterval = null;
        }
    }

    public async crossfadeAmbient(newUrl: string) {
        const outgoing = this.activeAmbience === 'A' ? this.ambienceA : this.ambienceB;
        const incoming = this.activeAmbience === 'A' ? this.ambienceB : this.ambienceA;

        if (!incoming || !outgoing) return;

        // Setup incoming
        incoming.src = newUrl;
        incoming.volume = 0;
        incoming.currentTime = 0;

        try {
            await incoming.play();
        } catch (e) {
            console.warn('Ambient play warning:', e);
            return;
        }

        const steps = 20;
        const stepDuration = this.CROSSFADE_DURATION / steps;
        let step = 0;
        const outgoingStartVolume = outgoing.volume;
        const targetVolume = this.state.volumes.ambience;

        if (this.crossfadeInterval) clearInterval(this.crossfadeInterval);

        this.crossfadeInterval = setInterval(() => {
            step++;
            const progress = step / steps;
            // Ease in/out
            const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            outgoing.volume = Math.max(0, outgoingStartVolume * (1 - eased));
            incoming.volume = targetVolume * eased;

            if (step >= steps) {
                if (this.crossfadeInterval) {
                    clearInterval(this.crossfadeInterval);
                    this.crossfadeInterval = null;
                }
                outgoing.pause();
                outgoing.removeAttribute('src'); // Clear source
                incoming.volume = targetVolume;
                this.activeAmbience = this.activeAmbience === 'A' ? 'B' : 'A';

                // Update state that active ambience changed (internal mostly, but good for debug)
            }
        }, stepDuration);
    }


    public seek(time: number) {
        if (this.voice) this.voice.currentTime = time;
        if (this.music) this.music.currentTime = time % (this.music.duration || 1); // Loop logic simplified
        // Ambience typically loops freely, no need to sync precisely unless phased

        this.state.currentTime = time;
        this.emit('timeupdate', this.state);
    }

    public setVolume(type: 'voice' | 'music' | 'ambience', value: number) {
        this.state.volumes[type] = Math.max(0, Math.min(1, value));

        if (type === 'voice' && this.voice) this.voice.volume = this.state.volumes.voice;
        if (type === 'music' && this.music) this.music.volume = this.state.volumes.music;
        if (type === 'ambience') {
            const active = this.activeAmbience === 'A' ? this.ambienceA : this.ambienceB;
            if (active) active.volume = this.state.volumes.ambience;
        }

        this.emit('statechange', this.state);
    }

    private handleTimeUpdate = () => {
        if (this.voice) {
            this.state.currentTime = this.voice.currentTime;
            this.emit('timeupdate', this.state);
        }
    };

    private handleEnded = () => {
        this.state.isPlaying = false;
        this.emit('ended', this.state);
        this.emit('statechange', this.state);
    };

    private setBuffering(isBuffering: boolean) {
        this.state.isBuffering = isBuffering;
        this.emit('statechange', this.state);
    }

    // --- Event System ---

    public on(event: AudioEventType, handler: AudioEventHandler) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(handler);
        return () => this.off(event, handler);
    }

    public off(event: AudioEventType, handler: AudioEventHandler) {
        this.listeners.get(event)?.delete(handler);
    }

    private emit(event: AudioEventType, state: AudioState) {
        this.listeners.get(event)?.forEach(handler => handler(state));
    }

    private startLoop() {
        // Optional: High precision loop for visualizations or complex syncing
        // Currently using 'timeupdate' event which fires every ~250ms
        // If we need 60fps updates for UI, we use requestAnimationFrame here
    }

    private stopLoop() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
}

export const audio = AudioEngine.getInstance();
