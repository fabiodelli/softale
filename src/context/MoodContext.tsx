'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { Mood } from '@/types';

interface MoodContextType {
    activeMood: Mood;
    setActiveMood: (mood: Mood) => void;
}

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export function MoodProvider({ children }: { children: ReactNode }) {
    const [activeMood, setActiveMood] = useState<Mood>('sleep');

    return (
        <MoodContext.Provider value={{ activeMood, setActiveMood }}>
            {children}
        </MoodContext.Provider>
    );
}

export function useMood() {
    const context = useContext(MoodContext);
    if (!context) {
        throw new Error('useMood must be used within a MoodProvider');
    }
    return context;
}
