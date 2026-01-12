'use client';

import { motion } from 'framer-motion';
import { Settings, Headphones } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthProvider';
import { useState, useEffect } from 'react';

// Components
import SettingsDrawer from '@/components/account/SettingsDrawer';
import DashboardTab from '@/components/account/DashboardTab';
import LibraryTab from '@/components/account/LibraryTab';
import HistoryTab from '@/components/account/HistoryTab';
import ReflectionsTab from '@/components/account/ReflectionsTab';
import GlassLayout from '@/components/GlassLayout';

type Tab = 'dashboard' | 'library' | 'history' | 'reflections';

export default function AccountPage() {
    const router = useRouter();
    const { user, profile, loading } = useAuth();

    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Redirect unauthenticated users
    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const tabs: { id: Tab; label: string }[] = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'library', label: 'My Library' },
        { id: 'history', label: 'History' },
        { id: 'reflections', label: 'Reflections' },
    ];

    return (
        <GlassLayout>
            <div className="pt-8 pb-4 px-6 max-w-xl mx-auto">
                {/* Mobile Logo - Scrolls with page */}
                <Link href="/" className="flex md:hidden items-center justify-center gap-2 mb-6 group">
                    <Headphones className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight">
                        Softale
                    </h1>
                </Link>

                <div className="flex items-center justify-between mb-6">
                    {/* Gear Icon - Top Left */}
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 bg-white rounded-full shadow-sm border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition"
                    >
                        <Settings className="w-6 h-6" />
                    </button>
                    <div />
                </div>

                {/* Tab Navigation - Centered */}
                <div className="flex justify-center w-full">
                    <div className="bg-white/50 p-1 rounded-2xl border border-slate-200/50 inline-flex max-w-full overflow-x-auto scrollbar-hide">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex-1 sm:flex-none whitespace-nowrap flex justify-center items-center
                                    ${activeTab === tab.id ? 'text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
                                `}
                            >
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50"
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="px-6 max-w-xl mx-auto mt-4">
                {activeTab === 'dashboard' && <DashboardTab username={profile?.username || user.email?.split('@')[0]} />}
                {activeTab === 'library' && <LibraryTab />}
                {activeTab === 'history' && <HistoryTab />}
                {activeTab === 'reflections' && <ReflectionsTab />}
            </main>

            {/* Settings Overlay */}
            <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </GlassLayout>
    );
}
