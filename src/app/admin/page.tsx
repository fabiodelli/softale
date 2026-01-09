'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalStories: 0,
        published: 0,
        premium: 0,
        drafts: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { count: total, error: err1 } = await supabase.from('stories').select('*', { count: 'exact', head: true });
                const { count: pub, error: err2 } = await supabase.from('stories').select('*', { count: 'exact', head: true }).eq('is_published', true);
                const { count: prem, error: err3 } = await supabase.from('stories').select('*', { count: 'exact', head: true }).eq('is_premium', true);

                if (!err1 && !err2 && !err3) {
                    setStats({
                        totalStories: total || 0,
                        published: pub || 0,
                        premium: prem || 0,
                        drafts: (total || 0) - (pub || 0)
                    });
                }
            } catch (e) {
                console.error("Failed to fetch stats", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const groups = {
        story: {
            title: 'Story Universe',
            items: [
                {
                    title: 'Factory Console',
                    desc: 'AI Content Generation',
                    icon: '🏭',
                    href: '/admin/factory',
                    color: 'bg-indigo-600',
                    large: true
                },
                {
                    title: 'Story Manager',
                    desc: 'Edit & Publish',
                    icon: '📚',
                    href: '/admin/stories',
                    color: 'bg-blue-600',
                    large: true
                },
                {
                    title: 'Collections',
                    desc: 'Playlists & Curation',
                    icon: '📂',
                    href: '/admin/collections',
                    color: 'bg-cyan-600',
                    large: false
                }
            ]
        },
        user: {
            title: 'User Management',
            items: [
                {
                    title: 'User Base',
                    desc: 'Access Control & CRM',
                    icon: '👥',
                    href: '/admin/users',
                    color: 'bg-slate-700',
                    large: true
                }
            ]
        },
        social: {
            title: 'Social Reach',
            items: [
                {
                    title: 'Social Studio',
                    desc: 'Reels & Marketing',
                    icon: '🎬',
                    href: '/admin/social',
                    color: 'bg-purple-600',
                    large: true
                }
            ]
        }
    };

    return (
        <AdminGuard>
            <div className="min-h-screen bg-slate-950 pb-20 text-white font-sans">
                {/* Header */}
                <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
                    <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-lg">🛡️</div>
                            <h1 className="text-xl font-bold tracking-tight">Command Center</h1>
                        </div>
                        <Link href="/" className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition flex items-center gap-2">
                            <span>Open App</span>
                            <span>→</span>
                        </Link>
                    </div>
                </header>

                <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-12">

                    {/* Realtime Stats */}
                    <section>
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Live Metrics</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Total Stories', val: loading ? '-' : stats.totalStories, color: 'text-white' },
                                { label: 'Published', val: loading ? '-' : stats.published, color: 'text-emerald-400' },
                                { label: 'Premium Locked', val: loading ? '-' : stats.premium, color: 'text-amber-400' },
                                { label: 'Drafts Pending', val: loading ? '-' : stats.drafts, color: 'text-indigo-400' },
                            ].map((s, i) => (
                                <div key={i} className="bg-slate-900 border border-white/5 p-6 rounded-2xl">
                                    <div className="text-3xl font-bold mb-1 font-mono">{s.val}</div>
                                    <div className={`text-xs font-medium uppercase tracking-wider opacity-70 ${s.color}`}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Main Actions Grid - 3 Columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* 1. STORY SECTION (Larger share) */}
                        <div className="lg:col-span-6 space-y-6">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-400">
                                <span className="text-xl">📖</span> {groups.story.title}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {groups.story.items.map((item) => (
                                    <Link key={item.title} href={item.href} className={`group ${item.large ? 'md:col-span-1' : 'md:col-span-2'}`}>
                                        <div className={`h-full p-6 rounded-2xl border border-white/10 bg-slate-900 hover:border-white/20 transition relative overflow-hidden ${item.large ? 'aspect-square flex flex-col justify-between' : 'flex items-center gap-4'}`}>
                                            <div className={`absolute top-0 right-0 p-24 opacity-5 bg-gradient-to-br ${item.color} rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:opacity-15 transition`} />

                                            {item.large ? (
                                                <>
                                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform">
                                                        {item.icon}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold mb-1 group-hover:text-indigo-300 transition">{item.title}</h3>
                                                        <p className="text-gray-400 text-sm">{item.desc}</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-lg shadow-lg">
                                                        {item.icon}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-200 group-hover:text-white transition">{item.title}</h3>
                                                        <p className="text-xs text-gray-500">{item.desc}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* 2. USER SECTION */}
                        <div className="lg:col-span-3 space-y-6">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-400">
                                <span className="text-xl">👤</span> {groups.user.title}
                            </h2>
                            <div className="space-y-4">
                                {groups.user.items.map((item) => (
                                    <Link key={item.title} href={item.href} className="group block h-full">
                                        <div className="h-full p-6 rounded-2xl border border-white/10 bg-slate-900 hover:border-white/20 transition relative overflow-hidden flex flex-col justify-between min-h-[200px]">
                                            <div className="absolute top-0 right-0 p-24 opacity-5 bg-slate-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:opacity-10 transition" />
                                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mb-4 shadow-lg">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold mb-1 group-hover:text-slate-300 transition">{item.title}</h3>
                                                <p className="text-gray-400 text-sm">{item.desc}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* 3. SOCIAL SECTION */}
                        <div className="lg:col-span-3 space-y-6">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-purple-400">
                                <span className="text-xl">📢</span> {groups.social.title}
                            </h2>
                            <div className="space-y-4">
                                {groups.social.items.map((item) => (
                                    <Link key={item.title} href={item.href} className="group block h-full">
                                        <div className="h-full p-6 rounded-2xl border border-white/10 bg-slate-900 hover:border-white/20 transition relative overflow-hidden flex flex-col justify-between min-h-[200px]">
                                            <div className="absolute top-0 right-0 p-24 opacity-5 bg-purple-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:opacity-10 transition" />
                                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mb-4 shadow-lg">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold mb-1 group-hover:text-purple-300 transition">{item.title}</h3>
                                                <p className="text-gray-400 text-sm">{item.desc}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </AdminGuard>
    );
}
