'use client';

import AdminGuard from '@/components/admin/AdminGuard';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
    const stats = [
        { title: 'Total Stories', value: '7', change: '+2', color: 'bg-indigo-500' },
        { title: 'Total Plays', value: '142', change: '+12%', color: 'bg-purple-500' },
        { title: 'Premium Users', value: '3', change: '+1', color: 'bg-amber-500' },
        { title: 'Storage Used', value: '124 MB', change: '2% limit', color: 'bg-emerald-500' },
    ];

    const actions = [
        {
            title: 'Factory Controller',
            description: 'Generate new stories via AI Pipeline',
            icon: '🏭',
            href: '/admin/factory',
            color: 'from-pink-500 to-rose-500'
        },
        {
            title: 'Story Manager',
            description: 'Edit metadata, covers, and status',
            icon: '📚',
            href: '/admin/stories',
            color: 'from-indigo-500 to-blue-500'
        },
        {
            title: 'User Management',
            description: 'View users and grant premium access',
            icon: '👥',
            href: '/admin/users',
            color: 'from-slate-600 to-slate-700'
        },
        {
            title: 'Upload Manual',
            description: 'Upload MP3 files directly',
            icon: '📤',
            href: '/admin/upload',
            color: 'from-emerald-500 to-teal-500'
        },
        {
            title: 'Refine Collections',
            description: 'Curate playlists and categories',
            icon: '📂',
            href: '/admin/collections',
            color: 'from-cyan-500 to-blue-500'
        },
        {
            title: 'Social Studio',
            description: 'Review and download Reels',
            icon: '🎬',
            href: '/admin/social',
            color: 'from-purple-500 to-pink-500'
        }
    ];

    return (
        <AdminGuard>
            <div className="min-h-screen bg-slate-950 pb-20">
                {/* Header */}
                <header className="bg-slate-900 border-b border-white/5 sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🛡️</span>
                            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                        </div>
                        <Link href="/" className="text-sm text-gray-400 hover:text-white">
                            Exit to App →
                        </Link>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 py-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.title}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-slate-900 border border-white/5 p-6 rounded-2xl"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <h3 className="text-gray-400 text-sm font-medium">{stat.title}</h3>
                                    <div className={`w-2 h-2 rounded-full ${stat.color}`} />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-white">{stat.value}</span>
                                    <span className="text-xs text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                                        {stat.change}
                                    </span>
                                </div>
                            </motion.div>
                        ))}


                    </div>

                    <h2 className="text-lg font-medium mb-6">Quick Actions</h2>

                    {/* Actions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {actions.map((action, i) => (
                            <Link href={action.href} key={action.title}>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + (i * 0.1) }}
                                    className="group relative p-6 rounded-2xl bg-slate-900 border border-white/5 hover:border-white/10 transition-colors overflow-hidden h-full"
                                >
                                    <div className={`absolute top-0 right-0 p-20 opacity-5 bg-gradient-to-br ${action.color} blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:opacity-10 transition-opacity`} />

                                    <div className="relative z-10 flex items-start gap-4">
                                        <span className="text-4xl p-3 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                            {action.icon}
                                        </span>
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">
                                                {action.title}
                                            </h3>
                                            <p className="text-gray-400 text-sm">
                                                {action.description}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </main>
            </div>
        </AdminGuard>
    );
}
