'use client';

import { AuthProvider } from '@/lib/AuthProvider';
import { PlayerProvider } from '@/lib/PlayerContext';
import { AmbienceProvider } from '@/context/AmbienceContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AmbienceProvider>
                <PlayerProvider>
                    {children}
                </PlayerProvider>
            </AmbienceProvider>
        </AuthProvider>
    );
}
