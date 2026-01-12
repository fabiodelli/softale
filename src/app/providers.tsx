'use client';

import { AuthProvider } from '@/lib/AuthProvider';
import { PlayerProvider } from '@/lib/PlayerContext';
import { AmbienceProvider } from '@/context/AmbienceContext';
import { MoodProvider } from '@/context/MoodContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <MoodProvider>
                <AmbienceProvider>
                    <PlayerProvider>
                        {children}
                    </PlayerProvider>
                </AmbienceProvider>
            </MoodProvider>
        </AuthProvider>
    );
}
