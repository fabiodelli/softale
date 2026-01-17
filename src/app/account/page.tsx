'use client';

import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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
        <GlassLayout variant="functional">
            <div className="pt-4 pb-4 px-6 max-w-xl mx-auto">
                {/* Mobile Logo - Fixed Top Center (Aligned with Mood and Gear) */}
                <Link href="/" className="fixed top-4 left-1/2 -translate-x-1/2 md:hidden flex items-center gap-2 group drop-shadow-lg z-50">
                    <Image
                        src="/assets/softale-icon.png"
                        alt="Softale"
                        width={200}
                        height={200}
                        className="h-12 w-auto drop-shadow-lg group-hover:scale-105 transition-transform"
                    />
                    <span
                        className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent drop-shadow-lg"
                        style={{ fontFamily: 'Outfit, var(--font-inter), system-ui, sans-serif' }}
                    >
                        Softale
                    </span>
                </Link>

                {/* Settings Gear - Fixed Top Right */}
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="fixed top-4 right-4 md:hidden p-2.5 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-white/40 text-slate-600 hover:text-indigo-600 z-50"
                >
                    <Settings className="w-5 h-5" />
                </button>

                {/* Gear Icon - Moved to fixed top-4 right-4 below */
                }

                {/* Desktop Gear - Restored */}
                <div className="flex justify-end mb-6 mt-12 md:mt-0">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="hidden md:block p-2 bg-white rounded-full shadow-sm border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition"
                    >
                        <Settings className="w-6 h-6" />
                    </button>
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
                                    ${activeTab === tab.id ? 'text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'}
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

