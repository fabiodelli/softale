'use client';

import { Suspense, useState, useEffect } from 'react';
import { supabase, signInWithGoogle } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthProvider';
import Image from 'next/image';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading } = useAuth();

    const [isSignUp, setIsSignUp] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const redirectTo = searchParams.get('redirect') || '/';

    useEffect(() => {
        if (!loading && user) {
            router.replace(redirectTo);
        }
    }, [user, loading, router, redirectTo]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                // Password Strength Validation
                const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
                if (!strongPasswordRegex.test(password)) {
                    throw new Error('Password must be at least 8 characters long and include an uppercase letter, a number, and a special character.');
                }

                const { error } = await supabase!.auth.signUp({ email, password });
                if (error) throw error;
                alert('Account Created! Check your email to confirm.');
            } else {
                const { error } = await supabase!.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'An error occurred';
            setError(message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleGoogle = async () => {
        try {
            await signInWithGoogle();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'An error occurred';
            setError(message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Image
                            src="/assets/softale-icon.png"
                            alt="Softale"
                            width={200}
                            height={200}
                            className="h-14 w-auto"
                        />
                        <span
                            className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent"
                            style={{ fontFamily: 'Outfit, var(--font-inter), system-ui, sans-serif' }}
                        >
                            Softale
                        </span>
                    </div>
                    <p className="text-slate-500 mt-2">
                        {isSignUp ? 'Create your sanctuary' : 'Welcome back'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                            required
                        />
                        <div className="flex justify-end mt-2">
                            <a href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors">
                                Forgot Password?
                            </a>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={formLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                    >
                        {formLoading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                <div className="my-6 flex items-center gap-4 text-xs text-slate-400 uppercase tracking-widest font-medium">
                    <div className="h-px bg-slate-200 flex-1" />
                    Or continue with
                    <div className="h-px bg-slate-200 flex-1" />
                </div>

                {/* Apple login removed - not yet configured */}

                <button
                    onClick={handleGoogle}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-3"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    Google
                </button>

                <p className="mt-8 text-center text-sm text-slate-500">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}

