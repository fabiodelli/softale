'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, ListMusic, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getUserPlaylists, addStoryToPlaylist, type Playlist } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';
import CreatePlaylistModal from './CreatePlaylistModal';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    storyId: string;
}

export default function AddToPlaylistModal({ isOpen, onClose, storyId }: Props) {
    const { user } = useAuth();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingToId, setAddingToId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            fetchPlaylists();
        }
    }, [isOpen, user]);

    const fetchPlaylists = async () => {
        if (!user) return;
        setLoading(true);
        const data = await getUserPlaylists(user.id);
        setPlaylists(data);
        setLoading(false);
    };

    const router = useRouter();

    const handleAdd = async (playlistId: string) => {
        setAddingToId(playlistId);
        const success = await addStoryToPlaylist(playlistId, storyId);
        if (success) {
            router.refresh(); // Refresh data
            // Show checkmark briefly or just close?
            // Let's assume generic close for now, or Toast
            setTimeout(() => {
                setAddingToId(null);
                onClose();
            }, 500);
        } else {
            setAddingToId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <AnimatePresence>
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4" onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                    >
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <ListMusic className="w-5 h-5 text-indigo-600" />
                                Add to Playlist
                            </h3>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-2 scrollbar-thin">
                            {loading ? (
                                <div className="py-8 flex justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                </div>
                            ) : playlists.length === 0 ? (
                                <div className="py-8 text-center px-4">
                                    <p className="text-slate-500 mb-4">No playlists yet.</p>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-100 transition flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Create New Playlist
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 rounded-xl transition text-left group border-b border-dashed border-slate-100 mb-2"
                                    >
                                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition">
                                            <Plus className="w-6 h-6 text-slate-400 group-hover:text-slate-600" />
                                        </div>
                                        <span className="font-semibold text-slate-600">New Playlist</span>
                                    </button>

                                    {playlists.map(playlist => (
                                        <button
                                            key={playlist.id}
                                            onClick={() => handleAdd(playlist.id)}
                                            className="w-full p-2 flex items-center gap-3 hover:bg-indigo-50 rounded-xl transition text-left group"
                                        >
                                            {playlist.cover_url ? (
                                                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                                                    <img src={playlist.cover_url} alt={playlist.title} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center shrink-0">
                                                    <ListMusic className="w-6 h-6 text-indigo-300" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-slate-900 truncate">{playlist.title}</h4>
                                                <p className="text-xs text-slate-500">{playlist.item_count} tracks</p>
                                            </div>
                                            {addingToId === playlist.id && (
                                                <div className="text-green-500 p-2">
                                                    <Check className="w-5 h-5" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>

            <CreatePlaylistModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreated={() => {
                    fetchPlaylists();
                    // Optionally auto-add to the new playlist? User might expect that.
                    // But for simplicity just refresh list.
                }}
            />
        </>
    );
}
