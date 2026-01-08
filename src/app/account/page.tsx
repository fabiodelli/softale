'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthProvider';
import { useState, useEffect } from 'react';
import { supabase, updateUserStatus } from '@/lib/supabase';

export default function AccountPage() {
    const router = useRouter();
    const { user, profile, loading, signOut, isPremium } = useAuth();

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editUsername, setEditUsername] = useState('');
    const [editAvatar, setEditAvatar] = useState('');
    const [saveLoading, setSaveLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Initialize edit state when profile loads
    useEffect(() => {
        if (profile) {
            setEditUsername(profile.username || '');
            setEditAvatar(profile.avatar_url || '');
        }
    }, [profile]);

    // Redirect unauthenticated users
    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [user, loading, router]);

    const handleSignOut = async () => {
        await signOut();
        router.replace('/');
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setSaveLoading(true);
        setMessage(null);

        const success = await updateUserStatus(user.id, {
            username: editUsername,
            avatar_url: editAvatar
        });

        if (success) {
            setMessage({ text: 'Profile updated successfully!', type: 'success' });
            setIsEditing(false);
            window.location.reload();
        } else {
            setMessage({ text: 'Failed to update profile.', type: 'error' });
        }
        setSaveLoading(false);
    };

    const handleResetPassword = async () => {
        if (!user?.email || !supabase) return;
        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/account/reset-password`,
        });
        if (error) {
            setMessage({ text: 'Error sending reset email.', type: 'error' });
        } else {
            setMessage({ text: 'Reset password email sent!', type: 'success' });
        }
    };

    // Show loading spinner while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Don't render if not authenticated (redirect will happen via useEffect)
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20 pt-24 px-4 bg-slate-50">
            <div className="max-w-xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-900 mb-8">Account</h1>

                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}
                    >
                        {message.text}
                    </motion.div>
                )}

                {/* Profile Card */}
                <section className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-full transition"
                            >
                                ✏️ Edit
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setIsEditing(false); setMessage(null); }}
                                    className="px-4 py-2 bg-transparent hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-full transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={saveLoading}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-full transition disabled:opacity-50"
                                >
                                    {saveLoading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 mt-2">
                        {/* Avatar */}
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-4xl overflow-hidden shadow-md border-2 border-white">
                                {(isEditing ? editAvatar : profile?.avatar_url) ? (
                                    <img
                                        src={isEditing ? editAvatar : profile?.avatar_url!}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                ) : (
                                    '👤'
                                )}
                            </div>
                        </div>

                        {/* Info / Inputs */}
                        <div className="flex-1 w-full text-center sm:text-left pt-2">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wider">Username</label>
                                        <input
                                            type="text"
                                            value={editUsername}
                                            onChange={(e) => setEditUsername(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                                            placeholder="Enter username"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wider">Avatar URL</label>
                                        <input
                                            type="text"
                                            value={editAvatar}
                                            onChange={(e) => setEditAvatar(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-1">
                                        {profile?.username || 'User'}
                                    </h2>
                                    <p className="text-slate-500 text-sm mb-4">{user?.email}</p>
                                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                        {isPremium ? (
                                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                                                ✨ Premium Plan
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-medium border border-slate-200">
                                                Free Plan
                                            </span>
                                        )}
                                        {profile?.role === 'admin' && (
                                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200">
                                                🛡️ Admin
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {/* Main Actions */}
                <div className="grid gap-4">
                    {/* Upgrade to Premium (Only if not premium) */}
                    {!isPremium && (
                        <Link href="/upgrade" className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-2xl border border-amber-200 shadow-sm hover:shadow-md transition group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <span className="text-xl group-hover:scale-110 transition">👑</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-amber-900">Upgrade to Premium</h3>
                                    <p className="text-xs text-amber-700/80">Unlock all stories & features</p>
                                </div>
                            </div>
                            <span className="text-amber-500 group-hover:translate-x-1 transition">→</span>
                        </Link>
                    )}

                    {/* Premium Management (Only if premium) */}
                    {isPremium && (
                        <button
                            onClick={async () => {
                                const button = document.getElementById('manage-sub-btn');
                                if (button) button.innerText = 'Loading...';
                                try {
                                    const res = await fetch('/api/portal', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ userId: user?.id })
                                    });
                                    const { url, error } = await res.json();
                                    if (url) window.location.href = url;
                                    else if (error) console.error('Portal error:', error);
                                } catch (e) { console.error(e); }
                            }}
                            id="manage-sub-btn"
                            className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 rounded-2xl border border-indigo-200 shadow-sm hover:shadow-md transition group w-full text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <span className="text-xl group-hover:scale-110 transition">💳</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-indigo-900">Manage Subscription</h3>
                                    <p className="text-xs text-indigo-700/80">Update payment method, invoices</p>
                                </div>
                            </div>
                            <span className="text-indigo-500 group-hover:translate-x-1 transition">→</span>
                        </button>
                    )}

                    {/* Favorites Link */}
                    <Link href="/favorites" className="flex items-center justify-between p-5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition group">
                        <div className="flex items-center gap-4">
                            <span className="text-2xl group-hover:scale-110 transition">❤️</span>
                            <div>
                                <h3 className="font-bold text-slate-800">Your Favorites</h3>
                                <p className="text-xs text-slate-500">Manage your saved stories</p>
                            </div>
                        </div>
                        <span className="text-slate-400 group-hover:translate-x-1 transition">→</span>
                    </Link>

                    {/* Admin Dashboard */}
                    {profile?.role === 'admin' && (
                        <Link href="/admin" className="flex items-center justify-between p-5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition group">
                            <div className="flex items-center gap-4">
                                <span className="text-2xl group-hover:scale-110 transition">🛡️</span>
                                <div>
                                    <h3 className="font-bold text-slate-800">Admin Dashboard</h3>
                                    <p className="text-xs text-slate-500">Manage content and users</p>
                                </div>
                            </div>
                            <span className="text-slate-400 group-hover:translate-x-1 transition">→</span>
                        </Link>
                    )}
                </div>

                <hr className="border-slate-200 my-8" />

                {/* Security & Settings */}
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Security</h3>
                <div className="space-y-3">
                    <button
                        onClick={handleResetPassword}
                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition text-left"
                    >
                        <span className="text-slate-700 font-medium">Reset Password</span>
                        <span className="text-xs text-indigo-600 font-medium">Send Email</span>
                    </button>

                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-xl border border-red-100 transition text-left group"
                    >
                        <span className="text-red-600 font-medium group-hover:text-red-700">Sign Out</span>
                        <span className="text-xl">🚪</span>
                    </button>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-400 mt-12">
                    Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '...'}
                </p>
            </div>
        </div>
    );
}
