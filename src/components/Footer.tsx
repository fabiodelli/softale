'use client';

import Link from 'next/link';
import { Headphones } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-white/80 backdrop-blur-md border-t border-slate-200/60 py-12 pb-32 md:pb-12 text-slate-600">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-5 gap-8">

                <div className="col-span-1 md:col-span-2">
                    <Link href="/" className="inline-flex items-center gap-2 group mb-4">
                        <Headphones className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight">
                            Softale
                        </span>
                    </Link>
                    <p className="text-slate-500 max-w-sm">
                        Mindful audio stories for relaxation, sleep, and focus.
                        Your daily escape into calmness.
                    </p>
                </div>

                <div>
                    <h3 className="font-bold text-slate-900 mb-4">Discover</h3>
                    <ul className="space-y-2 text-sm">
                        <li><Link href="/?mood=sleep" className="hover:text-indigo-600 transition">Sleep Stories</Link></li>
                        <li><Link href="/?mood=meditation" className="hover:text-indigo-600 transition">Meditation</Link></li>
                        <li><Link href="/?mood=fantasy" className="hover:text-indigo-600 transition">Fantasy</Link></li>
                        <li><Link href="/?mood=nature" className="hover:text-indigo-600 transition">Nature</Link></li>
                        <li><Link href="/?mood=energized" className="hover:text-indigo-600 transition">Focus & Energy</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="font-bold text-slate-900 mb-4">Legal</h3>
                    <ul className="space-y-2 text-sm">
                        <li><Link href="/privacy" className="hover:text-indigo-600 transition">Privacy Policy</Link></li>
                        <li><Link href="/terms" className="hover:text-indigo-600 transition">Terms of Service</Link></li>
                        <li><Link href="/cookie" className="hover:text-indigo-600 transition">Cookie Policy</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="font-bold text-slate-900 mb-4">Company</h3>
                    <ul className="space-y-2 text-sm">
                        <li><Link href="/vision" className="hover:text-indigo-600 transition">Our Vision</Link></li>
                        <li><Link href="/upgrade" className="hover:text-indigo-600 transition">Premium</Link></li>
                    </ul>
                </div>

            </div>

            <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-100 text-xs text-center text-slate-400">
                &copy; {new Date().getFullYear()} Softale Inc. All rights reserved.
            </div>
        </footer>
    );
}
