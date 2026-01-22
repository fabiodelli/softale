'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface LandingContextType {
    isShowingLanding: boolean;
    setIsShowingLanding: (value: boolean) => void;
}

const LandingContext = createContext<LandingContextType>({
    isShowingLanding: false,
    setIsShowingLanding: () => { },
});

export function LandingProvider({ children }: { children: ReactNode }) {
    const [isShowingLanding, setIsShowingLanding] = useState(false);

    return (
        <LandingContext.Provider value={{ isShowingLanding, setIsShowingLanding }}>
            {children}
        </LandingContext.Provider>
    );
}

export function useLanding() {
    return useContext(LandingContext);
}
