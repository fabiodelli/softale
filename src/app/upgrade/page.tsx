'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Shield, Zap, Headphones } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';

// Initialize Stripe Client
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);

export default function UpgradePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const handleSubscribe = async () => {
        if (!user) {
            router.push('/login?redirect=/upgrade');
            return;
        }

        setLoading(true);

        try {
            // Call API to create session
            // Replace with your actual Price IDs from Stripe Dashboard
            const priceId = billingCycle === 'monthly'
                ? 'price_MONTHLY_ID_HERE'
                : 'price_YEARLY_ID_HERE';

            const res = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId }),
            });

            if (!res.ok) throw new Error('Failed to create checkout session');

            const { url } = await res.json();

            if (url) {
                window.location.href = url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (error) {
            console.error(error);
            alert('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 md:px-8">
            <div className="max-w-4xl mx-auto text-center">

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
                                {billingCycle === 'monthly' ? '$6.99' : '$59.99'}
                            </span>

                            {/* Actual Price */}
                            <span className="text-5xl font-black text-slate-900">
                                {billingCycle === 'monthly' ? '$4.99' : '$39.99'}
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
                            Regular price: $6.99/mo.<br />
                            <strong>Today: $4.99/mo (Save 30%)</strong>
                        </p>

                        <div className="space-y-4 text-left">
                            <li className="flex items-center gap-3 text-slate-700">
                                <span className="bg-emerald-100 text-emerald-600 p-1 rounded-full"><Check className="w-4 h-4" /></span>
                                <span className="font-medium">Unlimited Access to All Content</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-700">
                                <span className="bg-emerald-100 text-emerald-600 p-1 rounded-full"><Check className="w-4 h-4" /></span>
                                <span className="font-medium">Exclusive Premium-Only Stories</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-700">
                                <span className="bg-emerald-100 text-emerald-600 p-1 rounded-full"><Check className="w-4 h-4" /></span>
                                <span className="font-medium">High-Fidelity Audio Quality</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-700">
                                <span className="bg-emerald-100 text-emerald-600 p-1 rounded-full"><Check className="w-4 h-4" /></span>
                                <span className="font-medium">Support Independent Creators</span>
                            </li>
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
    );
}
