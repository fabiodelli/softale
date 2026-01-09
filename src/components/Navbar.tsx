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

    return (
        <header className="absolute top-0 left-0 w-full z-50 md:sticky md:bg-white/80 md:backdrop-blur-lg border-b-0 md:border-b border-slate-200/60 block bg-transparent">
            <div className="w-full px-4 md:px-8 py-4 flex items-center justify-between relative">

                {/* Mobile: Logo Centers Absolute with Margin */}
                <Link href="/" className="md:hidden absolute left-1/2 top-8 -translate-x-1/2 flex items-center gap-2 group text-slate-900">
                    <Headphones className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent block tracking-tight">
                        Softale
                    </h1>
                </Link>

                {/* Desktop: Logo Left */}
                <Link href="/" className="hidden md:flex items-center gap-2 group text-slate-900">
                    <Headphones className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent block tracking-tight">
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
                                className="w-full bg-slate-100 border border-slate-200 rounded-full py-2 px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
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
                            className="p-2 text-slate-500 hover:text-indigo-600 transition rounded-full hover:bg-slate-100"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="hidden md:block">
                        <AmbienceSelector />
                    </div>

                    <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block"></div>

                    <Link
                        href="/library"
                        className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-full transition-all ${isActive('/library')
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
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
                                ? 'bg-white border-indigo-200 shadow-sm'
                                : 'bg-transparent border-transparent hover:bg-slate-50'
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
                            <span className="text-sm font-semibold text-slate-700">
                                {profile?.username || 'Account'}
                            </span>
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className="hidden md:block text-sm px-5 py-2.5 bg-slate-900 hover:bg-slate-800 rounded-full transition text-white font-semibold shadow-lg shadow-slate-900/10"
                        >
                            Sign In
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
}
