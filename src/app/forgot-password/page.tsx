'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import GlassLayout from '@/components/GlassLayout';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;
        setLoading(true);
        setStatus(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/update-password`,
            });

            if (error) throw error;

            setStatus({
                type: 'success',
                message: 'Check your email for the password reset link.'
            });
        } catch (err: any) {
            setStatus({
                type: 'error',
                message: err.message || 'Failed to send reset email.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <GlassLayout variant="functional">
            <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md bg-white/80 backdrop-blur-sm border border-white/50 rounded-3xl p-8 shadow-xl">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h1>
                        <p className="text-slate-500 text-sm">
                            Enter your email to receive a reset link.
                        </p>
                    </div>

                    {status && (
                        <div className={`p-4 rounded-xl mb-6 text-sm ${status.type === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-700'
                            : 'bg-red-50 border border-red-200 text-red-700'
                            }`}>
                            {status.message}
                        </div>
                    )}

                    <form onSubmit={handleReset} className="space-y-4">
                        <div>
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/login" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                            ← Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </GlassLayout>
    );
}
