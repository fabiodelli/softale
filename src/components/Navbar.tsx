'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthProvider';
import { Search, User, Headphones, Library } from 'lucide-react';
import AmbienceSelector from './AmbienceSelector';
import MoodToggleButton from './MoodToggleButton';
import { useMood } from '@/context/MoodContext';
import { useAmbience } from '@/context/AmbienceContext';

export default function Navbar() {
    const { user, profile } = useAuth();
    const { activeMood, setActiveMood } = useMood();
    const { isPlaying } = useAmbience();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [showSearch, setShowSearch] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);

    const isActive = (path: string) => pathname === path;

    // Detect Scroll for Glass Effect
    useEffect(() => {
        const handleScroll = () => {
            // On non-home pages, always show scrolled style
            if (pathname !== '/') {
                setIsScrolled(true);
                return;
            }
            // Trigger switch slightly before content hits header
            // content starts at 70vh (desktop) / 85vh (mobile)
            // we want header to appear "one scroll before", around 65% of viewport
            const threshold = window.innerHeight * 0.65;
            setIsScrolled(window.scrollY > threshold);
        };

        // Initial check
        handleScroll();

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, [pathname]);

    // ... (Keep existing search useEffects) ...
    // Sync search text with URL when on home page
    useEffect(() => {
        if (pathname === '/') {
            const q = searchParams?.get('q');
            if (q) {
                setSearchText(q);
                setShowSearch(true);
            }
        }
    }, [pathname, searchParams]);

    // Live Search Logic
    useEffect(() => {
        if (pathname === '/') {
            const timer = setTimeout(() => {
                const currentQ = searchParams?.get('q') || '';
                if (searchText !== currentQ) {
                    if (searchText) {
                        router.replace(`/?q=${encodeURIComponent(searchText)}`, { scroll: false });
                    } else {
                        router.replace('/', { scroll: false });
                    }
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [searchText, pathname, router, searchParams]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/?q=${encodeURIComponent(searchText)}`);
    };

    // Derived Styles based on Scroll State
    const textBase = isScrolled ? 'text-slate-900' : 'text-white drop-shadow-md';
    const textMuted = isScrolled ? 'text-slate-500' : 'text-white drop-shadow-md font-medium';
    const textHover = isScrolled ? 'hover:text-indigo-600' : 'hover:text-indigo-200';
    const glassClass = isScrolled
        ? 'bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm py-3'  // Scrolled: glassmorphic
        : 'bg-transparent border-transparent py-3'; // Hero visible (home only): transparent

    return (
        <header className={`hidden md:block fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out ${glassClass}`}>
            <div className="w-full px-4 md:px-8 flex items-center justify-between relative">

                {/* Mobile logo removed - causes positioning issues */}

                {/* Desktop: Logo Left */}
                <Link href="/" className={`hidden md:flex items-center gap-2 group ${textBase}`}>
                    <Headphones className={`w-6 h-6 transition-colors ${isScrolled ? 'text-indigo-600' : 'text-white group-hover:text-indigo-300'}`} />
                    <h1 className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r block tracking-tight transition-all ${isScrolled ? 'from-indigo-600 to-violet-600' : 'from-white to-white'}`}>
                        Softale
                    </h1>
                </Link>

                {/* Desktop Nav Actions */}
                <nav className="hidden md:flex items-center gap-2 md:gap-4">
                    {/* Search Component */}
                    <div className="flex items-center">
                        <form onSubmit={handleSearchSubmit} className={`flex items-center overflow-hidden transition-all duration-300 ${showSearch ? 'w-48 md:w-64 opacity-100 mr-2' : 'w-0 opacity-0'}`}>
                            <input
                                type="text"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="Search stories..."
                                className={`w-full border rounded-full py-2 px-4 text-sm focus:outline-none focus:ring-2 transition-all font-medium ${isScrolled
                                    ? 'bg-slate-100 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:ring-indigo-100'
                                    : 'bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-white/30'
                                    }`}
                            />
                        </form>
                        <button
                            onClick={() => {
                                if (showSearch && searchText) {
                                    router.push(`/?q=${encodeURIComponent(searchText)}`);
                                } else {
                                    setShowSearch(!showSearch);
                                }
                            }}
                            className={`p-2 transition rounded-full ${isScrolled
                                ? 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
                                : 'text-white/80 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </div>

                    {/* MoodToggleButton - Always visible in desktop */}
                    <div className="hidden md:block">
                        <MoodToggleButton
                            activeMood={activeMood}
                            onMoodSelect={setActiveMood}
                            variant="desktop"
                        />
                    </div>

                    <div className={`w-px h-6 mx-1 hidden md:block transition-colors ${isScrolled ? 'bg-slate-200' : 'bg-white/20'}`}></div>

                    <Link
                        href="/library"
                        className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-full transition-all ${isActive('/library')
                            ? (isScrolled ? 'bg-indigo-50 text-indigo-600' : 'bg-white/20 text-white')
                            : `${textMuted} ${textHover} hover:bg-white/5`
                            }`}
                        title="Library"
                    >
                        <Library className="w-5 h-5" />
                        <span className="text-sm font-medium">Library</span>
                    </Link>

                    {user ? (
                        <Link
                            href="/account"
                            className={`hidden md:flex items-center gap-2 px-1 pr-3 py-1 rounded-full transition border ${isActive('/account')
                                ? (isScrolled ? 'bg-white border-indigo-200 shadow-sm' : 'bg-white/20 border-white/30')
                                : 'bg-transparent border-transparent hover:bg-white/5'
                                }`}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center overflow-hidden border border-white shadow-sm">
                                {profile?.avatar_url ? (
                                    profile.avatar_url.startsWith('http') ? (
                                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-lg leading-none select-none">{profile.avatar_url}</span>
                                    )
                                ) : (
                                    <User className="w-4 h-4 text-indigo-600" />
                                )}
                            </div>
                            <span className={`text-sm font-semibold transition-colors ${textBase}`}>
                                {profile?.username || 'Account'}
                            </span>
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className={`hidden md:block text-sm px-5 py-2.5 rounded-full transition font-semibold shadow-lg ${isScrolled
                                ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10'
                                : 'bg-white text-indigo-900 hover:bg-indigo-50 shadow-white/20'
                                }`}
                        >
                            Sign In
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
}
