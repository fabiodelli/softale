'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function UpdatePassword() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Verify session exists (The email link logs the user in)
    useEffect(() => {
        const checkSession = async () => {
            if (!supabase) return;
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setStatus({
                    type: 'error',
                    message: 'Invalid or expired reset link. Please try again.'
                });
            }
        };
        checkSession();
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;
        setLoading(true);
        setStatus(null);

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;

            setStatus({
                type: 'success',
                message: 'Password updated successfully! Redirecting...'
            });

            setTimeout(() => {
                router.push('/');
            }, 2000);

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to update password';
            setStatus({
                type: 'error',
                message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Set New Password</h1>
                    <p className="text-slate-500 text-sm">
                        Create a secure password to access your account.
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

                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            placeholder="New Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || status?.type === 'error'}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
