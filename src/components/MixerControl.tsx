'use client';

import React from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { motion } from 'framer-motion';

interface MixerControlProps {
    className?: string;
    onClose?: () => void;
}

export default function MixerControl({ className, onClose }: MixerControlProps) {
    const {
        voiceVolume, setVoiceVolume,
        musicVolume, setMusicVolume,
        ambientVolume, setAmbientVolume
    } = usePlayer();

    // We can access user preferences if we want to save them unique per user, 
    // but PlayerContext already handles that logic.

    return (
        <div className={`bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl shadow-2xl flex flex-col gap-6 w-full max-w-sm ${className}`}>
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <span>🎚️</span> Audio Mixer
                </span>
                {onClose && (
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition">
                        ✕
                    </button>
                )}
            </div>

            <div className="space-y-6">
                {/* Voice Slider */}
                <div className="space-y-2">
                    <div className="flex justify-between text-zinc-400 text-xs font-medium">
                        <span>Voice</span>
                        <span>{Math.round(voiceVolume * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0" max="1" step="0.05"
                        value={voiceVolume}
                        onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                {/* Music Slider */}
                <div className="space-y-2">
                    <div className="flex justify-between text-zinc-400 text-xs font-medium">
                        <span>Music</span>
                        <span>{Math.round(musicVolume * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0" max="1" step="0.05"
                        value={musicVolume}
                        onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                        className="w-full accent-violet-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                {/* Ambience Slider */}
                <div className="space-y-2">
                    <div className="flex justify-between text-zinc-400 text-xs font-medium">
                        <span>Ambience</span>
                        <span>{Math.round(ambientVolume * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0" max="1" step="0.05"
                        value={ambientVolume}
                        onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                        className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>

            <p className="text-[10px] text-zinc-600 text-center pt-2">
                Mix your perfect environment. Settings are saved automatically.
            </p>
        </div>
    );
}
