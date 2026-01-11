'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already made a choice
        const consent = localStorage.getItem('softale-cookie-consent');
        if (!consent) {
            // Show banner after a short delay for better UX
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('softale-cookie-consent', 'accepted');
        setIsVisible(false);
        // Here you would initialize Analytics (e.g., PostHog/Google)
        // initializeAnalytics(); 
    };

    const handleDecline = () => {
        localStorage.setItem('softale-cookie-consent', 'declined');
        setIsVisible(false);
        // Ensure Analytics strictly adheres to this
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-50 max-w-md w-full"
                >
                    <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-6 rounded-2xl shadow-2xl shadow-slate-200/50">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-indigo-100 rounded-xl flex-shrink-0">
                                <Cookie className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-900 mb-1">Cookies & Data</h3>
                                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                                    We use data to personalize your experience (like remembering your favorite mood) and analyze app usage to improve Softale.
                                    <br />
                                    <Link href="/privacy" className="text-indigo-600 hover:underline mt-1 inline-block text-xs font-medium">
                                        Read Privacy Policy
                                    </Link>
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleAccept}
                                        className="flex-1 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition shadow-lg shadow-slate-900/10"
                                    >
                                        Accept All
                                    </button>
                                    <button
                                        onClick={handleDecline}
                                        className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 transition"
                                    >
                                        Essential Only
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="text-slate-400 hover:text-slate-600 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
