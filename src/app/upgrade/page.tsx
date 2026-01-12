'use client';

import { motion } from 'framer-motion';
import { Crown, Check, Sparkles, Zap, Shield, Heart, ArrowRight, Settings, Headphones } from 'lucide-react';
import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import GlassLayout from '@/components/GlassLayout';

export default function UpgradePage() {
    const { user, isPremium, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [portalLoading, setPortalLoading] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const handleSubscribe = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        setLoading(true);
        try {
            const priceId = billingCycle === 'monthly'
                ? process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY
                : process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY;

            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.email,
                    priceId,
                }),
            });

            const { url, error } = await response.json();

            if (url) {
                window.location.href = url;
            } else {
                alert(`Errore: ${error || 'Impossibile creare la sessione di checkout'}`);
            }
        } catch (error) {
            console.error('Upgrade error:', error);
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
            else if (error) alert(`Errore: ${error}`);
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
            <GlassLayout>
                <div className="pt-8 pb-12 px-4 md:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Mobile Logo */}
                        <Link href="/" className="flex md:hidden items-center justify-center gap-2 mb-6 group">
                            <Headphones className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight">
                                Softale
                            </h1>
                        </Link>

                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-12"
                        >
                            <span className="inline-block p-3 rounded-2xl bg-indigo-100 text-indigo-600 mb-4">
                                <Crown className="w-8 h-8" />
                            </span>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                                Grazie per essere Premium! ✨
                            </h1>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                Hai accesso completo a tutti i contenuti esclusivi di Softale.
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
                                            Abbonamento Attivo
                                        </span>
                                    </div>
                                </div>

                                <p className="text-center text-sm text-slate-500 mb-6 border-b border-slate-100 pb-6">
                                    Stai godendo di tutti i vantaggi esclusivi.<br />
                                    <strong>Grazie per il tuo supporto!</strong>
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
            </GlassLayout>
        );
    }

    // Free User View - Upgrade Prompt (Original Style)
    return (
        <GlassLayout>
            <div className="pt-8 pb-12 px-4 md:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Mobile Logo */}
                    <Link href="/" className="flex md:hidden items-center justify-center gap-2 mb-6 group">
                        <Headphones className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight">
                            Softale
                        </h1>
                    </Link>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12"
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

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-12">
                        <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>Monthly</span>
                        <button
                            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                            className="w-14 h-8 bg-indigo-600 rounded-full p-1 relative transition-colors"
                        >
                            <motion.div
                                className="w-6 h-6 bg-white rounded-full shadow-md"
                                animate={{ x: billingCycle === 'monthly' ? 0 : 24 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        </button>
                        <span className={`text-sm font-bold ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-500'}`}>
                            Yearly <span className="text-emerald-500 text-xs ml-1 font-black uppercase tracking-wide">Save 20%</span>
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
                                <span className="inline-block px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-[10px] font-bold tracking-wide uppercase mt-1">
                                    Launch Price Locked Forever
                                </span>
                            </div>

                            <div className="flex items-baseline justify-center gap-1 mb-2">
                                {/* Strikethrough Anchor Price */}
                                <span className="text-2xl text-slate-400 line-through decoration-slate-400/50 decoration-2 mr-2">
                                    {billingCycle === 'monthly' ? '€6.99' : '€59.99'}
                                </span>

                                {/* Actual Price */}
                                <span className="text-5xl font-black text-slate-900">
                                    {billingCycle === 'monthly' ? '€4.99' : '€39.99'}
                                </span>
                                <span className="text-slate-500 font-medium">
                                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                                </span>
                            </div>

                            <p className="text-center text-sm text-slate-500 mb-6">
                                Global Launch Offer. <br />
                                <strong>Price locked</strong> as long as you stay subscribed.
                            </p>

                            <button
                                onClick={handleSubscribe}
                                disabled={loading}
                                className={`w-full py-4 rounded-xl text-lg font-bold mb-6 transition-all transform active:scale-95 shadow-lg shadow-amber-500/20
                                ${loading
                                        ? 'bg-slate-100 text-slate-400 cursor-wait'
                                        : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:shadow-indigo-500/40'
                                    }`}
                            >
                                {loading ? 'Processing...' : 'Claim Founder Price'}
                            </button>

                            <p className="text-xs text-slate-400 mb-8 border-t border-slate-100 pt-4 mt-4">
                                Regular price: €6.99/mo.<br />
                                <strong>Today: €4.99/mo (Save 30%)</strong>
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
