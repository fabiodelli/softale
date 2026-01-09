'use client';

import { motion } from 'framer-motion';
import { Flame, Clock, Calendar, Quote } from 'lucide-react';
import { useMemo } from 'react';

interface DashboardTabProps {
    username?: string;
}

export default function DashboardTab({ username }: DashboardTabProps) {
    // Mock Data (will be real later)
    const stats = {
        streak: 3,
        totalMinutes: 142,
        sessions: 12
    };

    const quote = useMemo(() => {
        const quotes = [
            { text: "Quiet the mind, and the soul will speak.", author: "Ma Jaya Sati Bhagavati" },
            { text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh" },
            { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu" },
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Greeting */}
            <div>
                <h2 className="text-2xl font-bold text-slate-800">
                    Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'},<br />
                    <span className="text-indigo-600">{username || 'Traveler'}</span>
                </h2>
                <p className="text-slate-500 text-sm">Ready to continue your journey?</p>
            </div>

            {/* Streak Card */}
            <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-r from-orange-400 to-rose-500 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 -mt-2 -mr-2 opacity-20">
                    <Flame className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 opacity-90">
                        <Flame className="w-5 h-5" fill="currentColor" />
                        <span className="text-sm font-bold uppercase tracking-wide">Daily Streak</span>
                    </div>
                    <div className="text-4xl font-bold mb-2">{stats.streak} Days</div>
                    <div className="w-full bg-white/30 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-white h-full rounded-full" style={{ width: '40%' }} />
                    </div>
                    <p className="text-xs mt-2 opacity-90">You're on fire! Keep it up.</p>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="p-2 bg-indigo-50 w-fit rounded-xl text-indigo-600 mb-3">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">{stats.totalMinutes}</div>
                        <div className="text-xs text-slate-500 font-medium">Minutes Listened</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div className="p-2 bg-emerald-50 w-fit rounded-xl text-emerald-600 mb-3">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">{stats.sessions}</div>
                        <div className="text-xs text-slate-500 font-medium">Sessions Completed</div>
                    </div>
                </div>
            </div>

            {/* Quote of the Day */}
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 p-6 rounded-3xl border border-indigo-100/50">
                <Quote className="w-8 h-8 text-indigo-200 mb-4" />
                <p className="text-lg font-medium text-slate-700 italic leading-relaxed mb-4">
                    "{quote.text}"
                </p>
                <p className="text-sm text-indigo-500 font-bold uppercase tracking-wider">
                    — {quote.author}
                </p>
            </div>
        </div>
    );
}
