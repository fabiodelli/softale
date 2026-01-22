'use client';

import { AuthProvider } from '@/lib/AuthProvider';
import { PlayerProvider } from '@/context/PlayerContext';
import { AmbienceProvider } from '@/context/AmbienceContext';
import { CookieProvider } from '@/context/CookieContext';
import { MoodProvider } from '@/context/MoodContext';
import { LandingProvider } from '@/context/LandingContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <LandingProvider>
                <MoodProvider>
                    <AmbienceProvider>
                        <PlayerProvider>
                            <CookieProvider>
                                {children}
                            </CookieProvider>
                        </PlayerProvider>
                    </AmbienceProvider>
                </MoodProvider>
            </LandingProvider>
        </AuthProvider>
    );
}
