'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePlayer } from '@/context/PlayerContext';
import { Home, Library, User, Music, Star } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();
    const { toggleMobilePlayer, setMobilePlayerOpen, isMobilePlayerOpen, currentStory } = usePlayer();
    const [isPulsing, setIsPulsing] = useState(false);
    const prevStoryIdRef = useRef<string | null>(null);

    const isActive = (path: string) => pathname === path;

    // Track Change Effect: Pulse & Auto-Show Player
    useEffect(() => {
        if (currentStory?.id && prevStoryIdRef.current !== currentStory.id) {
            prevStoryIdRef.current = currentStory.id;

            // Start Pulse
            setIsPulsing(true);
            // Open Player
            setMobilePlayerOpen(true);

            // Auto-Close after 3s (Notification style)
            const timer = setTimeout(() => {
                setIsPulsing(false);
                setMobilePlayerOpen(false);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [currentStory, setMobilePlayerOpen]);

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[60] md:hidden pb-safe bg-white/80 backdrop-blur-xl border-t border-white/20 shadow-lg">
            <div className="h-[70px] px-6 flex items-center justify-center">
                <nav className="flex items-center justify-between max-w-sm mx-auto">
                    <Link
                        href="/"
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${isActive('/')
                            ? 'text-indigo-600 scale-105'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <Home className={`w-6 h-6 ${isActive('/') ? 'fill-indigo-600/20' : ''}`} strokeWidth={isActive('/') ? 2.5 : 2} />
                        <span className="text-[10px] font-bold">Home</span>
                    </Link>

                    <Link
                        href="/library"
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${isActive('/library')
                            ? 'text-indigo-600 scale-105'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <Library className={`w-6 h-6 ${isActive('/library') ? 'fill-indigo-600/20' : ''}`} strokeWidth={isActive('/library') ? 2.5 : 2} />
                        <span className="text-[10px] font-bold">Library</span>
                    </Link>

                    {/* Player Toggle */}
                    <button
                        onClick={toggleMobilePlayer}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${isMobilePlayerOpen || isPulsing
                            ? 'text-indigo-600 scale-105'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <Music
                            className={`w-6 h-6 ${isMobilePlayerOpen ? 'fill-indigo-600/20' : ''} ${isPulsing ? 'animate-pulse' : ''}`}
                            strokeWidth={isMobilePlayerOpen ? 2.5 : 2}
                        />
                        <span className="text-[10px] font-bold">Player</span>
                    </button>

                    {/* Premium Link */}
                    <Link
                        href="/upgrade"
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${isActive('/upgrade')
                            ? 'text-indigo-600 scale-105'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <Star className={`w-6 h-6 ${isActive('/upgrade') ? 'fill-indigo-600/20' : ''}`} strokeWidth={isActive('/upgrade') ? 2.5 : 2} />
                        <span className="text-[10px] font-bold">Premium</span>
                    </Link>

                    <Link
                        href="/account"
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${isActive('/account')
                            ? 'text-indigo-600 scale-105'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <User className={`w-6 h-6 ${isActive('/account') ? 'fill-indigo-600/20' : ''}`} strokeWidth={isActive('/account') ? 2.5 : 2} />
                        <span className="text-[10px] font-bold">Account</span>
                    </Link>
                </nav>
            </div>
        </div>
    );
}
