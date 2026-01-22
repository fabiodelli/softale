'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePremiumModal } from '@/lib/usePremiumModal';
import { useRouter } from 'next/navigation';
import { Sparkles, Lock, X } from 'lucide-react';

export default function PremiumModal() {
    const { isOpen, close } = usePremiumModal();
    const router = useRouter();

    const handleUpgrade = () => {
        close();
        router.push('/upgrade');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={close}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
                        >
                            {/* Close Button */}
                            <button
                                onClick={close}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Header Image/Pattern */}
                            <div className="h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative flex items-center justify-center">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                                    <Lock className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 text-center">
                                <h2 className="text-2xl font-black text-slate-900 mb-2">
                                    Unlock This Story
                                </h2>
                                <p className="text-slate-500 mb-8 leading-relaxed">
                                    This story is exclusive to Premium members. Upgrade today to unlock unlimited access to our entire library.
                                </p>

                                <button
                                    onClick={handleUpgrade}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    Join Waitlist
                                </button>

                                <button
                                    onClick={close}
                                    className="mt-4 text-sm font-medium text-slate-400 hover:text-indigo-600 transition"
                                >
                                    Maybe later
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
