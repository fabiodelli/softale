'use client';

import { AuthProvider } from '@/lib/AuthProvider';
import { PlayerProvider } from '@/lib/PlayerContext';
import { AmbienceProvider } from '@/context/AmbienceContext';
import { CookieProvider } from '@/context/CookieContext';
import { MoodProvider } from '@/context/MoodContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <MoodProvider>
                <AmbienceProvider>
                    <PlayerProvider>
                        <CookieProvider>
                            {children}
                        </CookieProvider>
                    </PlayerProvider>
                </AmbienceProvider>
            </MoodProvider>
        </AuthProvider>
    );
}
