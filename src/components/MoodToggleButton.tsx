'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Brain, Sparkles, Leaf, Waves, Headphones, ChevronDown } from 'lucide-react';
import { useAmbience } from '@/context/AmbienceContext';

export type Mood = 'sleep' | 'meditation' | 'fantasy' | 'nature' | 'energized';

interface MoodToggleButtonProps {
    activeMood: Mood;
    onMoodSelect: (mood: Mood) => void;
    variant?: 'desktop' | 'mobile';
}

const moods = [
    { id: 'sleep', label: 'Relaxed', icon: Moon, color: 'bg-indigo-500' },
    { id: 'nature', label: 'Peaceful', icon: Leaf, color: 'bg-emerald-500' },
    { id: 'fantasy', label: 'Dreamy', icon: Sparkles, color: 'bg-rose-500' },
    { id: 'meditation', label: 'Focused', icon: Brain, color: 'bg-sky-500' },
    { id: 'energized', label: 'Energized', icon: Waves, color: 'bg-amber-500' }
];

export default function MoodToggleButton({ activeMood, onMoodSelect, variant = 'desktop' }: MoodToggleButtonProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const { isPlaying, togglePlay, currentTrack, setTrack } = useAmbience();

    const currentMood = moods.find(m => m.id === activeMood) || moods[0];
    const CurrentIcon = currentMood.icon;

    // Mood to Ambient Sound mapping
    const moodToAmbience: Record<string, string> = {
        'sleep': 'night',
        'meditation': 'river',
        'fantasy': 'wind',
        'nature': 'forest',
        'energized': 'ocean'
    };

    const handleMoodClick = (moodId: Mood) => {
        onMoodSelect(moodId);
        // Persist to sessionStorage for cross-page sync
        sessionStorage.setItem('reverie_active_mood', moodId);
        // Also trigger ambient audio change
        const trackId = moodToAmbience[moodId];
        if (trackId) setTrack(trackId);
        setIsExpanded(false);
    };

    return (
        <div className="relative">
            {/* Main Toggle Button */}
            <motion.button
                onClick={() => setIsExpanded(!isExpanded)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                    flex items-center justify-center rounded-full
                    bg-white/20 backdrop-blur-xl border border-white/30
                    hover:bg-white/30 transition-all duration-300
                    shadow-lg w-10 h-10
                `}
            >
                {/* Current Mood Icon */}
                <div className={`w-6 h-6 rounded-full ${currentMood.color} flex items-center justify-center`}>
                    <CurrentIcon className="w-3.5 h-3.5 text-white" />
                </div>

                {/* Ambient Playing Indicator */}
                {isPlaying && currentTrack && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-pulse ring-2 ring-white/50" />
                )}
            </motion.button>

            {/* Expanded Mood Selector Popover */}
            <AnimatePresence>
                {isExpanded && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsExpanded(false)}
                            className="fixed inset-0 z-40"
                        />

                        {/* Popover */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={`
                                absolute z-50 mt-2 p-3
                                bg-white/90 backdrop-blur-2xl border border-white/50
                                rounded-2xl shadow-2xl
                                ${variant === 'mobile' ? 'left-0 top-full' : 'right-0 top-full'}
                            `}
                        >
                            {/* Mood Options */}
                            <div className="flex flex-col gap-2 min-w-[160px]">
                                {moods.map((mood) => {
                                    const Icon = mood.icon;
                                    const isActive = activeMood === mood.id;
                                    return (
                                        <button
                                            key={mood.id}
                                            onClick={() => handleMoodClick(mood.id as Mood)}
                                            className={`
                                                flex items-center gap-3 px-3 py-2 rounded-xl
                                                transition-all duration-200
                                                ${isActive
                                                    ? `${mood.color} text-white shadow-md`
                                                    : 'hover:bg-slate-100 text-slate-700'
                                                }
                                            `}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-white/20' : mood.color}`}>
                                                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white'}`} />
                                            </div>
                                            <span className="text-sm font-medium">{mood.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Ambient Toggle Section - Always visible */}
                            <div className="mt-3 pt-3 border-t border-slate-200">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        togglePlay();
                                    }}
                                    className={`
                                        w-full flex items-center justify-between px-3 py-2 rounded-xl
                                        transition-all duration-200
                                        ${isPlaying
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'hover:bg-slate-100 text-slate-600'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-2">
                                        <Headphones className="w-4 h-4" />
                                        <span className="text-sm font-medium">Ambient Sound</span>
                                    </div>
                                    <div className={`w-10 h-6 rounded-full relative transition-colors ${isPlaying ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                                        <motion.div
                                            animate={{ x: isPlaying ? 16 : 2 }}
                                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                        />
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
