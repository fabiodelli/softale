'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Loader2 } from 'lucide-react';
import { createPlaylist } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export default function CreatePlaylistModal({ isOpen, onClose, onCreated }: Props) {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleCreate = async () => {
        if (!title.trim() || !user) return;

        setIsCreating(true);
        const newPlaylist = await createPlaylist(user.id, title.trim());
        setIsCreating(false);

        if (newPlaylist) {
            setTitle('');
            onCreated();
            onClose();
        }
    };

    if (!isOpen || !mounted) return null;

    // Use z-[160] to be higher than StoryOptionsModal's z-[150]
    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[160] flex items-center justify-center p-4" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-slate-900">New Playlist</h3>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Playlist Name</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="My Relaxing Mix"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                autoFocus
                            />
                        </div>

                        <button
                            onClick={handleCreate}
                            disabled={!title.trim() || isCreating}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                        >
                            {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                            Create Playlist
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
