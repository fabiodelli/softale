'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Mail, Info, FileText, Shield, CreditCard, Lock, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { updateUserStatus, supabase, deleteProfile } from '@/lib/supabase';
import ConfirmModal from '@/components/admin/ConfirmModal';

interface SettingsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
    const { user, profile, isPremium, signOut } = useAuth();

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editUsername, setEditUsername] = useState(profile?.username || '');
    const [editAvatar, setEditAvatar] = useState(profile?.avatar_url || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false);

    const handleSaveProfile = async () => {
        if (!user) return;
        setLoading(true);
        const success = await updateUserStatus(user.id, {
            username: editUsername,
            avatar_url: editAvatar
        });

        if (success) {
            setMessage({ type: 'success', text: 'Profile updated!' });
            setTimeout(() => setIsEditing(false), 1000);
            window.location.reload(); // Refresh to show changes
        } else {
            setMessage({ type: 'error', text: 'Failed to update.' });
        }
        setLoading(false);
    };

    const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleResetPassword = async () => {
        if (!user?.email || !supabase) return;
        setResetStatus('loading');
        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
        });

        if (!error) {
            setResetStatus('success');
            setTimeout(() => setResetStatus('idle'), 3000); // Reset after 3s
        } else {
            setResetStatus('error');
            setTimeout(() => setResetStatus('idle'), 3000);
        }
    };
    // ...
    // Scroll down to button replacement
    <button
        onClick={handleResetPassword}
        disabled={resetStatus !== 'idle'}
        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-slate-600 disabled:opacity-70 disabled:cursor-not-allowed"
    >
        <div className={`p-2 rounded-lg ${resetStatus === 'success' ? 'bg-green-50 text-green-600' :
            resetStatus === 'error' ? 'bg-red-50 text-red-600' :
                'bg-blue-50 text-blue-600'
            }`}>
            {resetStatus === 'loading' ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : resetStatus === 'success' ? (
                <Shield className="w-5 h-5" />
            ) : (
                <Lock className="w-5 h-5" />
            )}
        </div>
        <span className="flex-1 text-left font-medium">
            {resetStatus === 'loading' ? 'Sending Email...' :
                resetStatus === 'success' ? 'Email Sent! Check Inbox' :
                    resetStatus === 'error' ? 'Error Sending Email' :
                        'Reset Password'}
        </span>
    </button>

    const handleLogout = async () => {
        await signOut();
        window.location.href = '/';
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        setLoading(true);
        // Secure Delete via API
        try {
            const res = await fetch('/api/auth/delete-account', {
                method: 'POST',
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Delete failed');
            }

            await signOut();
            window.location.href = '/';
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to delete account.' });
            setLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {/* Modal outside of drawer motion div to avoid clipping/transform issues if possible, though handling nested AnimatePresence can be tricky.
                Actually ConfirmModal has dynamic Portal-like behavior or fixed positioning.
            */}

                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9998]"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed top-0 left-0 bottom-0 w-full max-w-sm bg-white z-[9999] shadow-2xl flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-800">Settings</h2>
                                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition">
                                    <X className="w-6 h-6 text-slate-500" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8">


                                {/* Profile Section */}
                                <section>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Profile</h3>

                                    {isEditing ? (
                                        <div className="space-y-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                            <div>
                                                <label className="text-xs text-slate-500 font-medium mb-2 block">Username (Max 15 chars)</label>
                                                <input
                                                    value={editUsername}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15);
                                                        setEditUsername(val);
                                                    }}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-100 outline-none"
                                                    placeholder="Username"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs text-slate-500 font-medium mb-2 block">Choose Avatar</label>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {['🦊', '🐼', '🐨', '🦁', '🐯', '🐸', '🐙', '🦄'].map((emoji) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => setEditAvatar(emoji)}
                                                            className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-white border-2 transition shadow-sm
                                                            ${editAvatar === emoji ? 'border-indigo-500 bg-indigo-50 scale-110 ring-2 ring-indigo-200' : 'border-transparent hover:border-slate-200'}
                                                        `}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {message && (
                                                <div className={`text-xs ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {message.text}
                                                </div>
                                            )}
                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={handleSaveProfile}
                                                    disabled={loading}
                                                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                                                >
                                                    {loading ? 'Saving...' : 'Save'}
                                                </button>
                                                <button
                                                    onClick={() => setIsEditing(false)}
                                                    className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div onClick={() => setIsEditing(true)} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-indigo-200 hover:bg-slate-50 transition cursor-pointer group">
                                            <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-2xl border border-slate-100 bg-white">
                                                {profile?.avatar_url && profile.avatar_url.startsWith('http') ? (
                                                    <img src={profile.avatar_url} className="w-full h-full object-cover" alt="User" />
                                                ) : (
                                                    profile?.avatar_url || '👤'
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-800 group-hover:text-indigo-700 transition">{profile?.username || 'User'}</h4>
                                                <p className="text-xs text-slate-500">{user?.email}</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
                                        </div>
                                    )}
                                </section>

                                {/* Subscription Section */}
                                <section>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Subscription</h3>
                                    {isPremium ? (
                                        <button
                                            onClick={async () => {
                                                const res = await fetch('/api/portal', { method: 'POST', body: JSON.stringify({ userId: user?.id }) });
                                                const { url } = await res.json();
                                                if (url) window.location.href = url;
                                            }}
                                            className="w-full flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-200 rounded-lg text-indigo-700"><CreditCard className="w-5 h-5" /></div>
                                                <div className="text-left">
                                                    <div className="font-bold text-indigo-900">Manage Subscription</div>
                                                    <div className="text-xs text-indigo-600">Active Premium Plan ✨</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-indigo-300 group-hover:text-indigo-500" />
                                        </button>
                                    ) : (
                                        <Link href="/upgrade" onClick={onClose} className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100 hover:bg-amber-100 transition group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-amber-200 rounded-lg text-amber-700"><CreditCard className="w-5 h-5" /></div>
                                                <div>
                                                    <div className="font-bold text-amber-900">Upgrade to Premium</div>
                                                    <div className="text-xs text-amber-600">Unlock everything</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-amber-300 group-hover:text-amber-500" />
                                        </Link>
                                    )}
                                </section>

                                {/* Information Section (Hidden Footer Links) */}
                                <section>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Information</h3>
                                    <div className="space-y-2">
                                        <Link href="/vision" onClick={onClose} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-slate-600">
                                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Info className="w-5 h-5" /></div>
                                            <span className="flex-1 text-left font-medium">Our Vision</span>
                                            <ChevronRight className="w-4 h-4 text-slate-300" />
                                        </Link>
                                        <Link href="/privacy" onClick={onClose} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-slate-600">
                                            <div className="p-2 bg-green-50 rounded-lg text-green-600"><Shield className="w-5 h-5" /></div>
                                            <span className="flex-1 text-left font-medium">Privacy Policy</span>
                                            <ChevronRight className="w-4 h-4 text-slate-300" />
                                        </Link>
                                        <Link href="/terms" onClick={onClose} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-slate-600">
                                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><FileText className="w-5 h-5" /></div>
                                            <span className="flex-1 text-left font-medium">Terms of Service</span>
                                            <ChevronRight className="w-4 h-4 text-slate-300" />
                                        </Link>
                                        <Link href="/cookie" onClick={onClose} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-slate-600">
                                            <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><FileText className="w-5 h-5" /></div>
                                            <span className="flex-1 text-left font-medium">Cookie Policy</span>
                                            <ChevronRight className="w-4 h-4 text-slate-300" />
                                        </Link>
                                    </div>
                                </section>

                                {/* Security Section */}
                                <section>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Security</h3>
                                    <div className="space-y-2">
                                        <button
                                            onClick={handleResetPassword}
                                            disabled={resetStatus !== 'idle'}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-slate-600 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            <div className={`p-2 rounded-lg ${resetStatus === 'success' ? 'bg-green-50 text-green-600' :
                                                resetStatus === 'error' ? 'bg-red-50 text-red-600' :
                                                    'bg-blue-50 text-blue-600'
                                                }`}>
                                                {resetStatus === 'loading' ? (
                                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                ) : resetStatus === 'success' ? (
                                                    <Shield className="w-5 h-5" />
                                                ) : (
                                                    <Lock className="w-5 h-5" />
                                                )}
                                            </div>
                                            <span className="flex-1 text-left font-medium">
                                                {resetStatus === 'loading' ? 'Sending Email...' :
                                                    resetStatus === 'success' ? 'Email Sent! Check Inbox' :
                                                        resetStatus === 'error' ? 'Error Sending Email' :
                                                            'Reset Password'}
                                            </span>
                                        </button>
                                        <Link href="mailto:support@softale.app" onClick={onClose} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-slate-600">
                                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Mail className="w-5 h-5" /></div>
                                            <span className="flex-1 text-left font-medium">Contact Support</span>
                                        </Link>
                                        <button onClick={() => {
                                            if (isPremium) {
                                                setShowSubscriptionAlert(true);
                                            } else {
                                                setShowDeleteConfirm(true);
                                            }
                                        }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-slate-500 group">
                                            <div className="p-2 bg-slate-50 group-hover:bg-slate-100 rounded-lg text-slate-400 transition"><LogOut className="w-5 h-5 rotate-180" /></div>
                                            <span className="flex-1 text-left font-medium">Delete Account</span>
                                            <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-slate-400" />
                                        </button>
                                    </div>
                                </section>

                                <div className="flex-1" />

                                {/* Logout */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-bold transition border border-red-100 hover:border-red-200"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Sign Out
                                </button>

                                {/* Social Links */}
                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-center text-xs text-slate-400 mb-3">Follow us</p>
                                    <div className="flex justify-center items-center gap-5">
                                        <a href="https://instagram.com/softale.app" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-pink-500 hover:bg-pink-50 transition-colors" aria-label="Instagram">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                                        </a>
                                        <a href="https://tiktok.com/@softale.app" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors" aria-label="TikTok">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" /></svg>
                                        </a>
                                        <a href="https://twitter.com/softaleapp" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-colors" aria-label="Twitter">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                        </a>
                                        <a href="https://youtube.com/@softaleapp" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" aria-label="YouTube">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                                        </a>
                                    </div>
                                </div>

                                <p className="text-center text-xs text-slate-300">
                                    Softale v1.2.0 • Build 2026
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Delete Confirmation (Free Users) */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteAccount}
                title="Delete Account?"
                message="This will permanently delete your profile and listening history. This action cannot be undone."
                confirmText="Permanently Delete"
                isDestructive={true}
                loading={loading}
            />

            {/* Premium Subscription Alert */}
            <ConfirmModal
                isOpen={showSubscriptionAlert}
                onClose={() => setShowSubscriptionAlert(false)}
                onConfirm={async () => {
                    const res = await fetch('/api/portal', { method: 'POST', body: JSON.stringify({ userId: user?.id }) });
                    const { url } = await res.json();
                    if (url) window.location.href = url;
                }}
                title="Active Subscription"
                message="You have an active Premium plan. Please cancel your subscription before deleting your account to avoid future charges."
                confirmText="Manage Subscription"
                isDestructive={false}
            />
        </>
    );
}
