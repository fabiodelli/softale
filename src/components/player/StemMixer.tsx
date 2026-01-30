'use client';

import React, { useEffect, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Volume2, Mic, Music, Wind, Settings2, Lock } from 'lucide-react';
import { useAuth } from '@/lib/AuthProvider';
import { usePremiumModal } from '@/lib/usePremiumModal';

export default function StemMixer() {
    const {
        voiceVolume, setVoiceVolume,
        musicVolume, setMusicVolume,
        ambientVolume, setAmbientVolume,
        hasStems
    } = usePlayer();

    // Premium Lock Logic
    const { profile } = useAuth();
    const { open: openPremiumModal } = usePremiumModal();
    const isLocked = !profile?.is_premium;

    if (!hasStems) return null;

    const resetMixer = () => {
        setVoiceVolume(1);
        setMusicVolume(0.5); // Default balance
        setAmbientVolume(0.5);
    };

    const handleVolumeChange = (stem: 'voice' | 'music' | 'ambient', val: number) => {
        if (isLocked) return; // Prevent change if locked
        switch (stem) {
            case 'voice': setVoiceVolume(val); break;
            case 'music': setMusicVolume(val); break;
            case 'ambient': setAmbientVolume(val); break;
        }
    };

    const volumes = { voice: voiceVolume, music: musicVolume, ambient: ambientVolume };

    return (
        <div className="space-y-6 relative">
            {/* Header / Reset */}
            <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-widest">Live Mix</div>
                <button
                    onClick={resetMixer}
                    disabled={isLocked}
                    className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    Reset
                </button>
            </div>

            {/* Sliders Container */}
            <div className={`space-y-6 transition-opacity duration-300 ${isLocked ? 'opacity-40 pointer-events-none' : ''}`}>
                {/* Voice */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-700">
                        <div className="flex items-center gap-2">
                            <Mic className="w-4 h-4 text-indigo-500" />
                            <span className="font-medium">Voce</span>
                        </div>
                        <span className="text-xs font-mono opacity-70">{Math.round(volumes.voice * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volumes.voice}
                        onChange={(e) => handleVolumeChange('voice', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                </div>

                {/* Music */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-700">
                        <div className="flex items-center gap-2">
                            <Music className="w-4 h-4 text-fuchsia-500" />
                            <span className="font-medium">Musica</span>
                        </div>
                        <span className="text-xs font-mono opacity-70">{Math.round(volumes.music * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volumes.music}
                        onChange={(e) => handleVolumeChange('music', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                    />
                </div>

                {/* Ambient */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-700">
                        <div className="flex items-center gap-2">
                            <Wind className="w-4 h-4 text-teal-500" />
                            <span className="font-medium">Ambienza</span>
                        </div>
                        <span className="text-xs font-mono opacity-70">{Math.round(volumes.ambient * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volumes.ambient}
                        onChange={(e) => handleVolumeChange('ambient', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                    />
                </div>
            </div>
            {/* Overlay Removed */}
        </div>
    );
}
