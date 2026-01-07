'use client';

import { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import Link from 'next/link';
import { getAllProfiles, updateUserStatus, type UserProfile } from '@/lib/supabase';

export default function UsersManager() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const data = await getAllProfiles();
        setUsers(data);
        setLoading(false);
    };

    const togglePremium = async (user: UserProfile) => {
        try {
            const newValue = !user.is_premium;
            const success = await updateUserStatus(user.id, { is_premium: newValue });

            if (!success) throw new Error('Update failed');

            // Optimistic update
            setUsers(users.map(u => u.id === user.id ? { ...u, is_premium: newValue } : u));
            setStatus(`Updated status for ${user.email || 'user'}`);
        } catch (error: any) {
            console.error('Failed to toggle premium:', error);
            setStatus('Error updating user status');
        }
    };

    const makeAdmin = async (user: UserProfile) => {
        if (!confirm(`Are you sure you want to make ${user.email} an Admin?`)) return;

        try {
            const success = await updateUserStatus(user.id, { role: 'admin' });
            if (!success) throw new Error('Update failed');

            setUsers(users.map(u => u.id === user.id ? { ...u, role: 'admin' } : u));
            setStatus(`Promoted ${user.email} to Admin`);
        } catch (error) {
            setStatus('Error promoting user');
        }
    };

    return (
        <AdminGuard>
            <div className="min-h-screen bg-slate-950 pb-20 text-white">
                <header className="bg-slate-900 border-b border-white/5 sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link href="/admin" className="text-gray-400 hover:text-white">← Back</Link>
                            <h1 className="text-xl font-bold ml-4">User Management</h1>
                        </div>
                        <div className="text-sm text-gray-500">
                            Total Users: {users.length}
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 py-8">
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
                                                <span className={`px-2 py-1 rounded text-xs capitalize ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-gray-400'
                                                    }`}>
                                                    {user.role || 'user'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${user.is_premium ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-gray-500'
                                                    }`}>
                                                    {user.is_premium ? 'Premium' : 'Free'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-400">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => togglePremium(user)}
                                                        className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-white transition border border-white/5"
                                                    >
                                                        {user.is_premium ? 'Revoke Premium' : 'Grant Premium'}
                                                    </button>

                                                    {user.role !== 'admin' && (
                                                        <button
                                                            onClick={() => makeAdmin(user)}
                                                            className="px-3 py-1 rounded bg-slate-800 hover:bg-purple-900/30 text-xs text-purple-300 transition border border-white/5"
                                                        >
                                                            Make Admin
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>
        </AdminGuard>
    );
}
