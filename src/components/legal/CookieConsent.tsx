'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Cookie as CookieIcon, X } from 'lucide-react';
import { useCookie } from '@/context/CookieContext';

export default function CookieConsent() {
    const { isBannerOpen, acceptAll, declineAll, closeBanner } = useCookie();

    return (
        <AnimatePresence>
            {isBannerOpen && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed bottom-28 left-2 right-2 md:left-auto md:right-8 md:bottom-8 z-[200] max-w-md w-auto"
                >
                    <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-3 md:p-6 rounded-xl md:rounded-2xl shadow-2xl shadow-slate-200/50">
                        <div className="flex items-start gap-2 md:gap-4">
                            <div className="p-2 md:p-3 bg-indigo-100 rounded-lg md:rounded-xl flex-shrink-0">
                                <CookieIcon className="w-4 h-4 md:w-6 md:h-6 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 text-sm md:text-base mb-0.5 md:mb-1">Cookies & Data</h3>
                                <p className="text-xs md:text-sm text-slate-600 mb-2 md:mb-4 leading-snug md:leading-relaxed">
                                    We use cookies to personalize your experience.
                                    <Link href="/cookie" className="text-indigo-600 hover:underline ml-1 text-xs font-medium">
                                        Learn more
                                    </Link>
                                </p>
                                <div className="flex gap-2 md:gap-3">
                                    <button
                                        onClick={acceptAll}
                                        className="flex-1 px-3 md:px-4 py-1.5 md:py-2 bg-slate-900 text-white text-xs md:text-sm font-medium rounded-lg hover:bg-slate-800 transition shadow-lg shadow-slate-900/10"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={declineAll}
                                        className="px-3 md:px-4 py-1.5 md:py-2 bg-slate-100 text-slate-600 text-xs md:text-sm font-medium rounded-lg hover:bg-slate-200 transition"
                                    >
                                        Essential
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={closeBanner}
                                className="text-slate-400 hover:text-slate-600 transition p-1"
                            >
                                <X className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
