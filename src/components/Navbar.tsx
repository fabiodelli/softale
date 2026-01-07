'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthProvider';
import { Search, User, Headphones, Library } from 'lucide-react';
import AmbienceSelector from './AmbienceSelector';

export default function Navbar() {
    const { user, profile } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [showSearch, setShowSearch] = useState(false);
    const [searchText, setSearchText] = useState('');

    const isActive = (path: string) => pathname === path;

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

    // Live Search Logic: Debounce update to URL when on home page
    useEffect(() => {
        // Only trigger live update if we are already on the home page
        if (pathname === '/') {
            const timer = setTimeout(() => {
                const currentQ = searchParams?.get('q') || '';
                // Only update if changed prevents loops, though router.replace usually safe
                if (searchText !== currentQ) {
                    if (searchText) {
                        router.replace(`/?q=${encodeURIComponent(searchText)}`, { scroll: false });
                    } else {
                        // If empty, remove param
                        router.replace('/', { scroll: false });
                    }
                }
            }, 300); // 300ms delay

            return () => clearTimeout(timer);
        }
    }, [searchText, pathname, router, searchParams]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Force navigation/update immediately on Enter
        router.push(`/?q=${encodeURIComponent(searchText)}`);
    };

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
            <div className="w-full px-4 md:px-8 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group text-slate-900">
                    <Headphones className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent hidden sm:block tracking-tight">
                        Softale
                    </h1>
                </Link>

                <nav className="flex items-center gap-2 md:gap-4">
                    {/* Search Component */}
                    <div className="flex items-center">
                        <form onSubmit={handleSearchSubmit} className={`flex items-center overflow-hidden transition-all duration-300 ${showSearch ? 'w-48 md:w-64 opacity-100 mr-2' : 'w-0 opacity-0'}`}>
                            <input
                                type="text"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="Search stories..."
                                className="w-full bg-slate-100 border border-slate-200 rounded-full py-2 px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                            />
                        </form>
                        <button
                            onClick={() => {
                                if (showSearch && searchText) {
                                    // If open and has text, submit
                                    router.push(`/?q=${encodeURIComponent(searchText)}`);
                                } else {
                                    // Toggle open/close
                                    setShowSearch(!showSearch);
                                }
                            }}
                            className="p-2 text-slate-500 hover:text-indigo-600 transition rounded-full hover:bg-slate-100"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Ambience Mixer */}
                    <AmbienceSelector />

                    <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block"></div>

                    {/* Library Link */}
                    <Link
                        href="/library"
                        className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${isActive('/library')
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
                            }`}
                        title="Library"
                    >
                        <Library className="w-5 h-5" />
                        <span className="text-sm font-medium hidden md:inline">Library</span>
                    </Link>



                    {user ? (
                        <Link
                            href="/account"
                            className={`flex items-center gap-2 px-1 pr-3 py-1 rounded-full transition border ${isActive('/account')
                                ? 'bg-white border-indigo-200 shadow-sm'
                                : 'bg-transparent border-transparent hover:bg-slate-50'
                                }`}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center overflow-hidden border border-white shadow-sm">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-4 h-4 text-indigo-600" />
                                )}
                            </div>
                            <span className="text-sm font-semibold text-slate-700 hidden md:inline">
                                {profile?.username || 'Account'}
                            </span>
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className="text-sm px-5 py-2.5 bg-slate-900 hover:bg-slate-800 rounded-full transition text-white font-semibold shadow-lg shadow-slate-900/10"
                        >
                            Sign In
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
}
