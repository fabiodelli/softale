'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ConsentStatus = 'accepted' | 'declined' | null;

interface CookieContextType {
    consent: ConsentStatus;
    isBannerOpen: boolean;
    acceptAll: () => void;
    declineAll: () => void;
    openBanner: () => void;
    closeBanner: () => void;
}

const CookieContext = createContext<CookieContextType | undefined>(undefined);

export function CookieProvider({ children }: { children: ReactNode }) {
    const [consent, setConsent] = useState<ConsentStatus>(null);
    const [isBannerOpen, setIsBannerOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Check local storage on mount
        const storedConsent = localStorage.getItem('softale-cookie-consent') as ConsentStatus;
        if (storedConsent) {
            setConsent(storedConsent);
        } else {
            // Show banner after delay if no choice made
            const timer = setTimeout(() => setIsBannerOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const acceptAll = () => {
        localStorage.setItem('softale-cookie-consent', 'accepted');
        setConsent('accepted');
        setIsBannerOpen(false);
        // Initialize analytics here if needed
    };

    const declineAll = () => {
        localStorage.setItem('softale-cookie-consent', 'declined');
        setConsent('declined');
        setIsBannerOpen(false);
    };

    const openBanner = () => setIsBannerOpen(true);
    const closeBanner = () => setIsBannerOpen(false);

    return (
        <CookieContext.Provider value={{ consent, isBannerOpen, acceptAll, declineAll, openBanner, closeBanner }}>
            {children}
        </CookieContext.Provider>
    );
}

export function useCookie() {
    const context = useContext(CookieContext);
    if (context === undefined) {
        throw new Error('useCookie must be used within a CookieProvider');
    }
    return context;
}
