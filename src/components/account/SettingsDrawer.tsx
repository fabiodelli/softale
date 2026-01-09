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

    const handleResetPassword = async () => {
        if (!user?.email || !supabase) return;
        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/account/reset-password`,
        });
        if (!error) setMessage({ type: 'success', text: 'Reset email sent!' });
        else setMessage({ type: 'error', text: 'Error sending email.' });
    };

    const handleLogout = async () => {
        await signOut();
        window.location.href = '/';
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        setLoading(true);
        const success = await deleteProfile(user.id);
        if (success) {
            await signOut();
            window.location.href = '/';
        } else {
            setMessage({ type: 'error', text: 'Failed to delete account. Contact support.' });
            setLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
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
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed top-0 left-0 bottom-0 w-full max-w-sm bg-white z-[70] shadow-2xl flex flex-col"
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
                                    <button onClick={handleResetPassword} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-slate-600">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Lock className="w-5 h-5" /></div>
                                        <span className="flex-1 text-left font-medium">Reset Password</span>
                                    </button>
                                    <Link href="mailto:support@softale.com" onClick={onClose} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-slate-600">
                                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Mail className="w-5 h-5" /></div>
                                        <span className="flex-1 text-left font-medium">Contact Support</span>
                                    </Link>
                                </div>
                            </section>

                            <div className="flex-1" />

                            {/* Danger Zone */}
                            <section className="bg-red-50 p-4 rounded-2xl border border-red-100">
                                <h3 className="text-xs font-bold text-red-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Shield className="w-3 h-3" /> Danger Zone
                                </h3>

                                {isPremium ? (
                                    <div className="text-sm text-red-700 space-y-3">
                                        <p>You have an active Premium subscription.</p>
                                        <p className="font-medium">To delete your account, you must first cancel your subscription to prevent further billing.</p>
                                        <button
                                            onClick={async () => {
                                                const res = await fetch('/api/portal', { method: 'POST', body: JSON.stringify({ userId: user?.id }) });
                                                const { url } = await res.json();
                                                if (url) window.location.href = url;
                                            }}
                                            className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-bold transition flex items-center justify-center gap-2"
                                        >
                                            <CreditCard className="w-4 h-4" />
                                            Manage Subscription
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-xs text-red-600/80">Once you delete your account, there is no going back. Please be certain.</p>
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="w-full py-2 bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-sm font-medium transition"
                                        >
                                            Delete Account
                                        </button>
                                    </div>
                                )}
                            </section>

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold transition border border-slate-200 hover:border-slate-300"
                            >
                                <LogOut className="w-5 h-5" />
                                Sign Out
                            </button>

                            <p className="text-center text-xs text-slate-300">
                                Softale v1.2.0 • Build 2026
                            </p>
                        </div>
                    </motion.div>
                </>
            )}

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
        </AnimatePresence>
    );
}
