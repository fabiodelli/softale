'use client';

import { motion } from 'framer-motion';
import { Crown, Check, Sparkles, Zap, Shield, Heart, ArrowRight, Settings } from 'lucide-react';
import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import GlassLayout from '@/components/GlassLayout';
import SettingsDrawer from '@/components/account/SettingsDrawer';

export default function UpgradePage() {
    const { user, isPremium, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [portalLoading, setPortalLoading] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [joinSuccess, setJoinSuccess] = useState(false);

    const handleSubscribe = async () => {
        if (!user) {
            router.push('/login?redirect=/upgrade');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/waitlist/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });

            if (res.ok) {
                setJoinSuccess(true);
            } else {
                alert('Failed to join waitlist. Please try again.');
            }
        } catch (error) {
            console.error('Waitlist error:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        if (!user) return;
        setPortalLoading(true);
        try {
            const res = await fetch('/api/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });
            const { url, error } = await res.json();
            if (url) window.location.href = url;
            else if (error) alert(`Error: ${error}`);
        } catch (e) {
            console.error(e);
        } finally {
            setPortalLoading(false);
        }
    };

    // Loading state
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Premium User View - Thank You
    if (isPremium) {
        return (
            <GlassLayout variant="functional">
                <div className="pt-4 pb-12 px-4 md:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Mobile Logo - Fixed Top Center */}
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

                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8 mt-12 md:mt-0"
                        >
                            {/* Crown Removed */}
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                                Thank you for being Premium! ✨
                            </h1>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                You have full access to all exclusive Softale content.
                            </p>
                        </motion.div>

                        {/* Premium Status Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -5 }}
                            className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 relative"
                        >
                            {/* Gradient Border/Glow */}
                            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                            <div className="p-8">
                                <div className="mb-6 flex items-center justify-center gap-3">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                                            <Crown className="w-8 h-8 text-white" />
                                        </div>
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-md"
                                        >
                                            <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                        </motion.div>
                                    </div>
                                    <div className="text-left">
                                        <h2 className="text-2xl font-bold text-slate-900">Softale Premium</h2>
                                        <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold tracking-wide uppercase">
                                            Active Subscription
                                        </span>
                                    </div>
                                </div>

                                <p className="text-center text-sm text-slate-500 mb-6 border-b border-slate-100 pb-6">
                                    You're enjoying all the exclusive benefits.<br />
                                    <strong>Thank you for your support!</strong>
                                </p>

                                <div className="space-y-4 text-left mb-6">
                                    <div className="flex items-center gap-3 text-slate-700">
                                        <span className="bg-emerald-100 text-emerald-600 p-1 rounded-full"><Check className="w-4 h-4" /></span>
                                        <span className="font-medium">Unlimited Access to All Content</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-700">
                                        <span className="bg-emerald-100 text-emerald-600 p-1 rounded-full"><Check className="w-4 h-4" /></span>
                                        <span className="font-medium">Exclusive Premium-Only Stories</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-700">
                                        <span className="bg-emerald-100 text-emerald-600 p-1 rounded-full"><Check className="w-4 h-4" /></span>
                                        <span className="font-medium">High-Fidelity Audio Quality</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-700">
                                        <span className="bg-emerald-100 text-emerald-600 p-1 rounded-full"><Check className="w-4 h-4" /></span>
                                        <span className="font-medium">Support Independent Creators</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Link
                                        href="/"
                                        className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold text-lg shadow-lg hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        Explore Content
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>

                                    <button
                                        onClick={handleManageSubscription}
                                        disabled={portalLoading}
                                        className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-all flex items-center justify-center gap-2"
                                    >
                                        {portalLoading ? (
                                            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Settings className="w-5 h-5" />
                                                Manage Subscription
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Trust Badges */}
                        <div className="mt-12 flex justify-center gap-8 text-slate-400 grayscale opacity-60">
                            <div className="flex items-center gap-2">
                                <Heart className="w-5 h-5" />
                                <span className="text-sm font-semibold">Thank You</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="w-5 h-5" />
                                <span className="text-sm font-semibold">Cancel Anytime</span>
                            </div>
                        </div>
                    </div>
                </div>
                <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            </GlassLayout>
        );
    }

    // Free User View - Upgrade Prompt (Original Style)
    return (
        <GlassLayout>
            <div className="pt-4 pb-12 px-4 md:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Mobile Logo - Fixed Top Center (Free View) */}
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

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 mt-12"
                    >
                        <span className="inline-block p-3 rounded-2xl bg-indigo-100 text-indigo-600 mb-4">
                            <Sparkles className="w-8 h-8" />
                        </span>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                            Unlock the Full Experience
                        </h1>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Get unlimited access to our entire library of sleep stories, meditations, and soundscapes. No limits, pure relaxation.
                        </p>
                    </motion.div>

                    {/* Waitlist Badge */}
                    <div className="flex items-center justify-center gap-4 mb-12">
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold">
                            🚀 Early Access Opening Soon
                        </span>
                    </div>

                    {/* Pricing Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -5 }}
                        className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 relative"
                    >
                        {/* Gradient Border/Glow */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                        <div className="p-8">
                            <div className="mb-4">
                                <h2 className="text-2xl font-bold text-slate-900">Softale Premium</h2>
                                <span className="inline-block px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-bold tracking-wide uppercase mt-1">
                                    Limited Spots
                                </span>
                            </div>

                            <p className="text-center text-slate-500 mb-8 leading-relaxed">
                                We are strictly limiting access to ensure the highest quality experience for our founding members.
                            </p>

                            <button
                                onClick={handleSubscribe}
                                disabled={loading || joinSuccess}
                                className={`w-full py-4 rounded-xl text-lg font-bold mb-6 transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2
                                ${joinSuccess
                                        ? 'bg-emerald-500 text-white cursor-default hover:scale-100 shadow-emerald-500/20'
                                        : loading
                                            ? 'bg-slate-100 text-slate-400 cursor-wait'
                                            : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-slate-500/20'
                                    }`}
                            >
                                {joinSuccess ? (
                                    <>
                                        <Check className="w-5 h-5" />
                                        You're on the list!
                                    </>
                                ) : loading ? (
                                    'Joining...'
                                ) : (
                                    'Join the Waitlist'
                                )}
                            </button>

                            <p className="text-xs text-slate-400 mb-8 border-t border-slate-100 pt-4 mt-4">
                                You'll receive an email invitation as soon as a spot opens up.<br />
                                <strong>No payment required to join.</strong>
                            </p>

                            <div className="space-y-4 text-left">
                                <div className="flex items-center gap-3 text-slate-700">
                                    <span className="bg-emerald-100 text-emerald-600 p-1 rounded-full"><Check className="w-4 h-4" /></span>
                                    <span className="font-medium">Unlimited Access to All Content</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700">
                                    <span className="bg-emerald-100 text-emerald-600 p-1 rounded-full"><Check className="w-4 h-4" /></span>
                                    <span className="font-medium">Exclusive Premium-Only Stories</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700">
                                    <span className="bg-emerald-100 text-emerald-600 p-1 rounded-full"><Check className="w-4 h-4" /></span>
                                    <span className="font-medium">High-Fidelity Audio Quality</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700">
                                    <span className="bg-emerald-100 text-emerald-600 p-1 rounded-full"><Check className="w-4 h-4" /></span>
                                    <span className="font-medium">Support Independent Creators</span>
                                </div>
                            </div>

                            {/* Geo-Blocking Notice (Footer) */}
                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <p className="text-xs text-slate-400 leading-relaxed text-center">
                                    <span className="block font-semibold text-slate-500 mb-1">🌍 Regional Availability</span>
                                    Premium is currently available for residents of <strong>US, UK, Canada, Australia</strong> and other non-EU regions only.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Trust Badges */}
                    <div className="mt-12 flex justify-center gap-8 text-slate-400 grayscale opacity-60">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            <span className="text-sm font-semibold">Secure Payment</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            <span className="text-sm font-semibold">Cancel Anytime</span>
                        </div>
                    </div>

                </div>
            </div>
        </GlassLayout>
    );
}

