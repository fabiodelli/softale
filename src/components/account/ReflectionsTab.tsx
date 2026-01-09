'use client';

import { PenLine, BookHeart, Sparkles } from 'lucide-react';

export default function ReflectionsTab() {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                <BookHeart className="w-10 h-10 text-indigo-400" />
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-2">Reflections Journey</h2>
            <p className="text-slate-500 max-w-xs mb-8">
                Track your moods, gratitude, and thoughts. This personal space is being crafted just for you.
            </p>

            <div className="w-full max-w-sm bg-white p-6 rounded-2xl border border-slate-100 shadow-sm opacity-60 grayscale blur-[1px] select-none relative overflow-hidden">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-slate-200 rounded-full" />
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                </div>
                <div className="space-y-2">
                    <div className="h-3 w-full bg-slate-100 rounded" />
                    <div className="h-3 w-5/6 bg-slate-100 rounded" />
                    <div className="h-3 w-4/6 bg-slate-100 rounded" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
                    <span className="bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> Coming Soon
                    </span>
                </div>
            </div>
        </div>
    );
}
