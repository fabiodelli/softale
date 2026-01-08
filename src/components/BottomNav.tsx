'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Library, User } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
            <div className="bg-white/90 backdrop-blur-xl border-t border-slate-200/60 pb-4 pt-2 px-6">
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
