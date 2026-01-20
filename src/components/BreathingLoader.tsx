'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface BreathingLoaderProps {
    onComplete: () => void;
    minDuration?: number; // Minimum time to show (ms)
}

export default function BreathingLoader({ onComplete, minDuration = 3000 }: BreathingLoaderProps) {
    const [phase, setPhase] = useState<'breathe' | 'logo' | 'exit'>('breathe');

    useEffect(() => {
        // Phase 1: Breathing animation
        const breatheTimer = setTimeout(() => {
            setPhase('logo');
        }, minDuration * 0.6);

        // Phase 2: Logo reveal
        const logoTimer = setTimeout(() => {
            setPhase('exit');
        }, minDuration * 0.9);

        // Phase 3: Exit
        const exitTimer = setTimeout(() => {
            onComplete();
        }, minDuration);

        return () => {
            clearTimeout(breatheTimer);
            clearTimeout(logoTimer);
            clearTimeout(exitTimer);
        };
    }, [minDuration, onComplete]);

    return (
        <AnimatePresence>
            {phase !== 'exit' && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-[100] bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50 flex flex-col items-center justify-center"
                >
                    {/* Breathing Circle */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{
                            scale: [0.8, 1.2, 0.8],
                            opacity: phase === 'breathe' ? 1 : 0
                        }}
                        transition={{
                            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                            opacity: { duration: 0.5 }
                        }}
                        className="absolute w-64 h-64 rounded-full bg-gradient-to-br from-indigo-200/50 to-violet-200/50 blur-3xl"
                    />

                    {/* Content */}
                    <div className="relative z-10 text-center">
                        {/* Breathing Text */}
                        <AnimatePresence mode="wait">
                            {phase === 'breathe' && (
                                <motion.div
                                    key="breathe"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.5 }}
                                    className="flex flex-col items-center gap-6"
                                >
                                    {/* Animated breathing ring */}
                                    <motion.div
                                        animate={{ scale: [1, 1.3, 1] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        className="w-20 h-20 rounded-full border-2 border-indigo-300/50 flex items-center justify-center"
                                    >
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                                            className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400"
                                        />
                                    </motion.div>

                                    <motion.p
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        className="text-xl text-slate-600 font-light tracking-wide"
                                    >
                                        Take a breath...
                                    </motion.p>
                                </motion.div>
                            )}

                            {phase === 'logo' && (
                                <motion.div
                                    key="logo"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                    className="flex flex-col items-center gap-4"
                                >
                                    <Image
                                        src="/assets/softale-icon.png"
                                        alt="Softale"
                                        width={80}
                                        height={80}
                                        className="drop-shadow-lg"
                                    />
                                    <span
                                        className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent"
                                        style={{ fontFamily: 'Outfit, var(--font-inter), system-ui, sans-serif' }}
                                    >
                                        Softale
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Subtle noise overlay */}
                    <div
                        className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
