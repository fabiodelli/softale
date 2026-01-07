'use client';

import { motion } from 'framer-motion';
import { Moon, Brain, Sparkles, Leaf, Waves } from 'lucide-react';

export type Mood = 'sleep' | 'meditation' | 'fantasy' | 'nature' | 'energized' | null;

interface MoodSelectorProps {
    onSelect: (mood: Mood) => void;
    activeMood: Mood;
    greeting?: string;
}

const moods = [
    {
        id: 'sleep',
        label: 'Relaxed',
        icon: Moon,
        colorClass: 'bg-indigo-100 text-slate-800',
        activeClass: 'ring-[3px] ring-indigo-300 scale-105 bg-indigo-200',
        image: '/images/moods/starry_night.png'
    },
    {
        id: 'meditation',
        label: 'Focused',
        icon: Brain,
        colorClass: 'bg-amber-100 text-slate-800', // Swapped to Amber (Focus Lamp warmth)
        activeClass: 'ring-[3px] ring-amber-300 scale-105 bg-amber-200',
        image: '/images/moods/zen_stones.png'
    },
    {
        id: 'fantasy',
        label: 'Dreamy',
        icon: Sparkles,
        colorClass: 'bg-rose-100 text-slate-800',
        activeClass: 'ring-[3px] ring-rose-300 scale-105 bg-rose-200',
        image: '/images/moods/sunset.png'
    },
    {
        id: 'nature',
        label: 'Peaceful',
        icon: Leaf,
        colorClass: 'bg-emerald-100 text-slate-800',
        activeClass: 'ring-[3px] ring-emerald-300 scale-105 bg-emerald-200',
        image: '/images/moods/forest.png'
    },
    {
        id: 'energized',
        label: 'Energized',
        icon: Waves, // Reverted to Waves (Ocean)
        colorClass: 'bg-sky-100 text-slate-800',
        activeClass: 'ring-[3px] ring-sky-300 scale-105 bg-sky-200',
        image: '/images/moods/sunset.png'
    }
];

// Default Image (Foggy Lake / Pines) as requested
const DEFAULT_IMAGE = '/images/moods/foggy_lake.png';

export default function MoodSelector({ onSelect, activeMood, greeting }: MoodSelectorProps) {

    // Determine current background image
    const currentImage = activeMood
        ? moods.find(m => m.id === activeMood)?.image
        : DEFAULT_IMAGE;

    return (
        <div className="relative w-full h-[85vh] flex items-center justify-center overflow-hidden transition-all duration-1000">

            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    key={currentImage} // Key change triggers animation
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0"
                >
                    <img
                        src={currentImage}
                        className="w-full h-full object-cover"
                        alt="Background"
                    />
                    {/* Overlay to ensure text readability */}
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
                    {/* Gradient Fade to Bottom Content */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent" />
                </motion.div>
            </div>

            {/* Glass Panel Content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center md:items-end justify-between gap-8 md:gap-16">

                {/* Text Section (Left) - On top relative to container */}
                <div className="flex-1 text-center md:text-left drop-shadow-sm">
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl md:text-2xl font-medium text-slate-800/80 mb-2 mix-blend-hard-light"
                    >
                        {greeting || 'Good Morning'}
                    </motion.h2>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight leading-none mix-blend-color-burn"
                    >
                        What are you<br />looking for?
                    </motion.h1>
                </div>

                {/* Mood Selector (Right - Pastel Circles in Glass Card) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex-shrink-0 bg-white/30 backdrop-blur-xl border border-white/40 p-6 md:p-8 rounded-3xl shadow-2xl"
                >
                    <div className="flex gap-4 md:gap-6">
                        {moods.map((m, i) => {
                            const isActive = activeMood === m.id;
                            const Icon = m.icon;
                            return (
                                <div key={m.id} className="flex flex-col items-center gap-3 group">
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onSelect(isActive ? null : m.id as Mood)}
                                        className={`
                                            w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300
                                            ${m.colorClass}
                                            ${isActive ? m.activeClass : 'bg-white/90 hover:bg-white border-2 border-transparent'} 
                                            /* Apply color class default opacity if not active? No, user wants colored by default. */
                                        `}
                                        style={!isActive ? { backgroundColor: 'var(--mood-color-light)' } : {}} // Dynamic inline styles complex here. 
                                    // Let's rely on class logic:
                                    // User want buttons colored by default.
                                    >
                                        {/* We need to apply the specific color background even when inactive, just lighter? 
                                           Or always the same color, but active adds a ring? 
                                           User: "tasti devono essere colorati da subito"
                                       */}
                                        <div className={`
                                            w-full h-full rounded-full flex items-center justify-center
                                            ${isActive ? '' : m.colorClass.replace('text-slate-800', 'text-slate-600').replace('bg-', 'bg-opacity-50 bg-')}
                                            /* Just use the color class always, and active adds ring */
                                            ${m.colorClass}
                                            ${isActive ? m.activeClass : 'opacity-90 hover:opacity-100 scale-95 hover:scale-100'}
                                        `}>
                                            <Icon className="w-6 h-6 md:w-8 md:h-8" />
                                        </div>
                                    </motion.button>
                                    <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${isActive ? 'text-slate-900 underline decoration-2 underline-offset-4' : 'text-slate-600'}`}>
                                        {m.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
