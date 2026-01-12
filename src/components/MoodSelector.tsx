'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Moon, Brain, Sparkles, Leaf, Waves, Headphones } from 'lucide-react';
import { useAmbience } from '@/context/AmbienceContext';

export type Mood = 'sleep' | 'meditation' | 'fantasy' | 'nature' | 'energized';

interface MoodSelectorProps {
    onSelect: (mood: Mood) => void;
    activeMood: Mood;
    greeting?: string;
    isControllerVisible?: boolean;
}

const moods = [
    {
        id: 'sleep',
        label: 'Relaxed',
        icon: Moon,
        colorClass: 'bg-indigo-100 text-slate-800',
        activeClass: 'ring-[3px] ring-indigo-300 scale-105 bg-indigo-200',
        image: '/images/moods/starry_night.png',
        mobileImage: '/images/moods/mobile/starry_night.jpg'
    },
    {
        id: 'nature',
        label: 'Peaceful',
        icon: Leaf,
        colorClass: 'bg-emerald-100 text-slate-800',
        activeClass: 'ring-[3px] ring-emerald-300 scale-105 bg-emerald-200',
        image: '/images/moods/forest.png',
        mobileImage: '/images/moods/mobile/forest.jpg'
    },
    {
        id: 'fantasy',
        label: 'Dreamy',
        icon: Sparkles,
        colorClass: 'bg-rose-100 text-slate-800',
        activeClass: 'ring-[3px] ring-rose-300 scale-105 bg-rose-200',
        image: '/images/moods/sunset.png',
        mobileImage: '/images/moods/mobile/sunset.jpg'
    },
    {
        id: 'meditation',
        label: 'Focused',
        icon: Brain,
        colorClass: 'bg-sky-100 text-slate-800', // Swapped to Sky (Cool Blue for Focus)
        activeClass: 'ring-[3px] ring-sky-300 scale-105 bg-sky-200',
        image: '/images/moods/zen_stones.png',
        mobileImage: '/images/moods/mobile/zen_stones.jpg'
    },
    {
        id: 'energized',
        label: 'Energized',
        icon: Waves,
        colorClass: 'bg-amber-100 text-slate-800', // Swapped to Amber (Warm Energy)
        activeClass: 'ring-[3px] ring-amber-300 scale-105 bg-amber-200',
        image: '/images/moods/ocean-vibrant.jpg',
        mobileImage: '/images/moods/mobile/ocean-vibrant.jpg'
    }
];

export default function MoodSelector({ onSelect, activeMood, greeting, isControllerVisible = true }: MoodSelectorProps) {
    const { isPlaying, togglePlay, currentTrack } = useAmbience();

    // Determine current mood object
    const currentMood = moods.find(m => m.id === activeMood) || moods[0];

    return (
        <div className="relative w-full h-[100dvh] flex items-center justify-center overflow-hidden">

            {/* Mobile Logo - Fixed in Hero (Footer Gradient Match) */}
            <Link href="/" className="absolute top-8 left-1/2 -translate-x-1/2 z-50 md:hidden flex items-center gap-2 group drop-shadow-lg">
                <Headphones className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 block tracking-tight">
                    Softale
                </h1>
            </Link>





            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    key={currentMood.id} // Key change triggers animation
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0"
                >
                    <picture>
                        <source media="(max-width: 768px)" srcSet={currentMood.mobileImage} />
                        <img
                            src={currentMood.image}
                            className="w-full h-full object-cover"
                            alt={currentMood.label}
                        />
                    </picture>
                </motion.div>
            </div>

            {/* Glass Panel Content - Fades out when scrolled */}
            <AnimatePresence>
                {isControllerVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center md:items-end justify-between gap-8 md:gap-16"
                    >

                        {/* Text Section (Left) - On top relative to container */}
                        <div className="flex-1 text-center md:text-left drop-shadow-sm">
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xl md:text-2xl font-medium text-white mb-2 tracking-wide drop-shadow-md [-webkit-text-stroke:0.5px_rgba(0,0,0,0.4)] [paint-order:stroke_fill]"
                            >
                                {greeting}
                            </motion.h2>
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-none drop-shadow-2xl [-webkit-text-stroke:1.5px_rgba(0,0,0,0.4)] [paint-order:stroke_fill]"
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
                                                onClick={() => onSelect(m.id as Mood)}
                                                className={`
                                                    w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300
                                                    ${m.colorClass}
                                                    ${isActive ? m.activeClass : 'bg-white/90 hover:bg-white border-2 border-transparent'} 
                                                `}
                                            >
                                                <div className={`
                                                    w-full h-full rounded-full flex items-center justify-center
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
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
