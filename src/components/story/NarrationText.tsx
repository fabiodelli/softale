'use client';

import React from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '@/lib/AuthProvider';
import { usePremiumModal } from '@/lib/usePremiumModal';
import { motion } from 'framer-motion';

interface NarrationTextProps {
    text?: string;
    isPremiumStory: boolean;
}

export default function NarrationText({ text, isPremiumStory }: NarrationTextProps) {
    const { profile } = useAuth();
    const { open: openPremiumModal } = usePremiumModal();

    // Check access: 
    // If story is premium AND user is NOT premium -> LOCKED
    // If story is free -> OPEN (or if user is premium -> OPEN)
    const isLocked = isPremiumStory && !profile?.is_premium;

    // If no text, don't render
    if (!text) return null;

    return (
        <section className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6 flex items-center gap-3">
                <span>📖</span> Narrazione
            </h2>

            <div className={`prose prose-lg prose-slate max-w-none transition-all duration-500 ${isLocked ? 'blur-sm select-none opacity-50' : ''}`}>
                <p className="text-slate-700 leading-loose font-light tracking-wide whitespace-pre-line">
                    {text}
                </p>
            </div>

            {isLocked && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-white/0 via-white/80 to-white">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-indigo-100 max-w-md"
                    >
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                            <Lock className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Contenuto Premium</h3>
                        <p className="text-slate-600 mb-6">
                            Il testo completo della narrazione è disponibile solo per gli abbonati Premium.
                        </p>
                        <button
                            onClick={() => openPremiumModal()}
                            className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold hover:bg-slate-800 transition shadow-lg w-full"
                        >
                            Sblocca Premium
                        </button>
                    </motion.div>
                </div>
            )}
        </section>
    );
}
