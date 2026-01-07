'use client';

import { useState, useEffect } from 'react';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check local storage on mount
        const consent = localStorage.getItem('cookie_consent');
        if (consent === null) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'true');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookie_consent', 'false');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-white/10 p-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-300 max-w-2xl">
                    <p className="font-semibold text-white mb-1">🍪 We use cookies</p>
                    <p>
                        We use cookies to handle user authentication, payments, and to ensure you get the best experience on our website.
                        By looking around, you agree to our use of cookies.
                    </p>
                </div>
                <div className="flex items-center gap-3 whitespace-nowrap">
                    <button
                        onClick={handleDecline}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        Decline
                    </button>
                    <button
                        onClick={handleAccept}
                        className="px-6 py-2 text-sm bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-colors"
                    >
                        Accept Cookies
                    </button>
                </div>
            </div>
        </div>
    );
}
