'use client';

import { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import { AdminLayout, AdminButton, AdminBadge } from '@/components/admin/AdminLayout';
import { getAllProfiles, updateUserStatus, deleteProfile, type UserProfile } from '@/lib/supabase';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { Trash2, Shield, Crown } from 'lucide-react';

export default function UsersManager() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');

    // Modal State
    const [modal, setModal] = useState({
        isOpen: false,
        type: '' as 'premium' | 'admin' | 'delete',
        targetUser: null as UserProfile | null,
        title: '',
        message: '',
        isDestructive: false
    });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const data = await getAllProfiles();
        setUsers(data);
        setLoading(false);
    };

    const promptAction = (type: 'premium' | 'admin' | 'delete', user: UserProfile, title: string, message: string, isDestructive: boolean) => {
        setModal({
            isOpen: true,
            type,
            targetUser: user,
            title,
            message,
            isDestructive
        });
    };

    const handleConfirmAction = async () => {
        if (!modal.targetUser) return;
        setProcessing(true);
        const user = modal.targetUser;

        try {
            if (modal.type === 'premium') {
                const newValue = !user.is_premium;
                const res = await fetch('/api/admin/update-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, updates: { is_premium: newValue } }),
                });

                if (res.ok) {
                    setUsers(users.map(u => u.id === user.id ? { ...u, is_premium: newValue } : u));
                    setStatus(`Updated status for ${user.email}`);
                } else {
                    throw new Error('Update failed');
                }
            } else if (modal.type === 'admin') {
                const success = await updateUserStatus(user.id, { role: 'admin' });
                if (success) {
                    setUsers(users.map(u => u.id === user.id ? { ...u, role: 'admin' } : u));
                    setStatus(`Promoted ${user.email} to Admin`);
                }
            } else if (modal.type === 'delete') {
                const res = await fetch('/api/admin/delete-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id }),
                });

                if (res.ok) {
                    setUsers(users.filter(u => u.id !== user.id));
                    setStatus(`Deleted user ${user.email}`);
                } else {
                    const err = await res.json();
                    throw new Error(err.error || 'Delete failed');
                }
            }
        } catch (error) {
            console.error('Action failed:', error);
            setStatus('Action failed. Check console.');
        } finally {
            setProcessing(false);
            setModal(prev => ({ ...prev, isOpen: false }));
        }
    };

    return (
        <AdminGuard>
            <AdminLayout
                title="User Management"
                subtitle="Manage user accounts, roles, and premium status"
                backLink={{ href: '/admin', label: 'Dashboard' }}
                actions={
                    <div className="text-sm font-medium px-3 py-1 bg-white/5 rounded-full border border-white/5 text-gray-300">
                        Total Users: {users.length}
                    </div>
                }
            >
                {status && (
                    <div className="mb-6 p-4 rounded-lg bg-slate-900 border border-white/10 text-emerald-400 flex justify-between items-center">
                        <span>{status}</span>
                        <button onClick={() => setStatus('')} className="text-gray-500 hover:text-white">✕</button>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading users...</div>
                ) : (
                    <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-slate-800/50">
                                    <th className="p-4 font-medium text-gray-400">User</th>
                                    <th className="p-4 font-medium text-gray-400">Role</th>
                                    <th className="p-4 font-medium text-gray-400">Status</th>
                                    <th className="p-4 font-medium text-gray-400">Joined</th>
                                    <th className="p-4 font-medium text-gray-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                                                    {user.email?.[0].toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{user.email || 'No Email'}</div>
                                                    <div className="text-xs text-gray-500">{user.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <AdminBadge variant={user.role === 'admin' ? 'info' : 'default'}>
                                                {user.role || 'user'}
                                            </AdminBadge>
                                        </td>
                                        <td className="p-4">
                                            <AdminBadge variant={user.is_premium ? 'warning' : 'default'}>
                                                {user.is_premium ? 'Premium' : 'Free'}
                                            </AdminBadge>
                                        </td>
                                        <td className="p-4 text-sm text-gray-400">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <AdminButton
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => promptAction(
                                                        'premium',
                                                        user,
                                                        user.is_premium ? 'Revoke Premium Status' : 'Grant Premium Status',
                                                        `Are you sure you want to ${user.is_premium ? 'remove' : 'grant'} Premium status for ${user.email}?`,
                                                        false
                                                    )}
                                                >
                                                    {user.is_premium ? 'Revoke Premium' : 'Grant Premium'}
                                                </AdminButton>

                                                {user.role !== 'admin' && (
                                                    <>
                                                        <button
                                                            onClick={() => promptAction(
                                                                'delete',
                                                                user,
                                                                'Delete User',
                                                                `PERMANENTLY delete ${user.email}? This cannot be undone.`,
                                                                true
                                                            )}
                                                            className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <ConfirmModal
                    isOpen={modal.isOpen}
                    onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
                    onConfirm={handleConfirmAction}
                    title={modal.title}
                    message={modal.message}
                    isDestructive={modal.isDestructive}
                    loading={processing}
                />
            </AdminLayout>
        </AdminGuard>
    );
}
