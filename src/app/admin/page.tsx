'use client';

import Link from 'next/link';
import { AdminLayout, AdminButton } from '@/components/admin';
import { AdminCard } from '@/components/admin';

const navItems = [
    {
        title: 'Factory Studio',
        description: 'Generate AI audio content with the V5 engine',
        href: '/admin/factory',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        color: 'from-violet-600 to-purple-600',
        glow: 'violet'
    },
    {
        title: 'Stories Manager',
        description: 'Manage all published audio stories and tracks',
        href: '/admin/stories',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
        ),
        color: 'from-emerald-600 to-teal-600',
        glow: 'emerald'
    },
    {
        title: 'Collections',
        description: 'Organize stories into curated collections',
        href: '/admin/collections',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        ),
        color: 'from-amber-600 to-orange-600',
        glow: 'amber'
    },
    {
        title: 'Users',
        description: 'Manage user accounts and permissions',
        href: '/admin/users',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
        color: 'from-sky-600 to-cyan-600',
        glow: 'sky'
    },
    {
        title: 'Social Studio',
        description: 'Generate social media content and campaigns',
        href: '/admin/social',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
        ),
        color: 'from-pink-600 to-rose-600',
        glow: 'pink'
    },
    {
        title: 'Tag Manager',
        description: 'Organize, merge, and clean up content tags',
        href: '/admin/tags',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
        ),
        color: 'from-blue-600 to-indigo-600',
        glow: 'blue'
    }
];

import AdminGuard from '@/components/admin/AdminGuard';

export default function AdminDashboard() {
    return (
        <AdminGuard>
            <AdminLayout
                title="Reverie Admin"
                subtitle="Content Management System"
                actions={
                    <Link href="/" target="_blank">
                        <AdminButton variant="ghost" size="sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View Site
                        </AdminButton>
                    </Link>
                }
            >
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Stories', value: '—', icon: '📚' },
                        { label: 'Active Users', value: '—', icon: '👥' },
                        { label: 'Collections', value: '—', icon: '📁' },
                        { label: 'Generations', value: '—', icon: '🎧' }
                    ].map((stat) => (
                        <AdminCard key={stat.label} padding="md" className="text-center">
                            <div className="text-2xl mb-1">{stat.icon}</div>
                            <div className="text-2xl font-bold text-zinc-50">{stat.value}</div>
                            <div className="text-sm text-zinc-400">{stat.label}</div>
                        </AdminCard>
                    ))}
                </div>

                {/* Navigation Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <AdminCard
                                hover
                                gradient
                                padding="lg"
                                className="group h-full"
                            >
                                <div className={`
                inline-flex p-3 rounded-xl mb-4
                bg-gradient-to-br ${item.color}
                shadow-lg shadow-${item.glow}-500/25
                group-hover:shadow-xl group-hover:shadow-${item.glow}-500/30
                transition-all duration-300
              `}>
                                    {item.icon}
                                </div>
                                <h3 className="text-lg font-semibold text-zinc-50 mb-2 group-hover:text-white transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                                    {item.description}
                                </p>
                                <div className="mt-4 flex items-center text-sm text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span>Open</span>
                                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </AdminCard>
                        </Link>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="mt-8 pt-8 border-t border-zinc-800">
                    <h2 className="text-lg font-semibold text-zinc-50 mb-4">Quick Actions</h2>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/admin/factory">
                            <AdminButton variant="primary">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Generate New Story
                            </AdminButton>
                        </Link>
                        <Link href="/admin/stories/editor">
                            <AdminButton variant="secondary">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Create Story Manually
                            </AdminButton>
                        </Link>
                        <Link href="/admin/collections">
                            <AdminButton variant="secondary">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                New Collection
                            </AdminButton>
                        </Link>
                    </div>
                </div>
            </AdminLayout>
        </AdminGuard>
    );
}
