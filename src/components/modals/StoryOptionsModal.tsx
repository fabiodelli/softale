'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, ListMusic, Loader2, Heart, MoreVertical, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getUserPlaylists, addStoryToPlaylist, type Playlist, toggleFavorite, checkIsFavorite } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';
import CreatePlaylistModal from './CreatePlaylistModal';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    storyId: string;
    storyTitle?: string;
}

export default function StoryOptionsModal({ isOpen, onClose, storyId, storyTitle }: Props) {
    const { user } = useAuth();
    const router = useRouter();

    // Favorite State
    const [isFavorite, setIsFavorite] = useState(false);
    const [favLoading, setFavLoading] = useState(false);

    // Playlist State
    const [showPlaylists, setShowPlaylists] = useState(false);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [playlistLoading, setPlaylistLoading] = useState(false);
    const [addingToId, setAddingToId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Portal State
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Initial Checks
    useEffect(() => {
        if (isOpen && user) {
            checkIsFavorite(user.id, storyId).then(setIsFavorite);
            // Reset playlist view
            setShowPlaylists(false);
        }
    }, [isOpen, user, storyId]);

    const handleToggleFavorite = async () => {
        if (!user) return;
        setFavLoading(true);
        const newState = await toggleFavorite(user.id, storyId);
        setIsFavorite(newState);
        setFavLoading(false);
    };

    const handleShowPlaylists = async () => {
        if (showPlaylists) {
            setShowPlaylists(false);
            return;
        }

        setShowPlaylists(true);
        if (!user) return;
        if (playlists.length === 0) {
            setPlaylistLoading(true);
            const data = await getUserPlaylists(user.id!);
            setPlaylists(data);
            setPlaylistLoading(false);
        }
    };

    const handleAddToPlaylist = async (playlistId: string) => {
        setAddingToId(playlistId);
        const success = await addStoryToPlaylist(playlistId, storyId);
        if (success) {
            setAddingToId(null);
            router.refresh();
            // Maybe show a small success state?
            setTimeout(() => {
                onClose();
            }, 500);
        } else {
            setAddingToId(null);
        }
    };

    const handleCreatePlaylist = () => {
        setShowCreateModal(true);
    };

    if (!mounted) return null;

    // Content to be portaled
    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4 min-h-screen" onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white/90 backdrop-blur-xl border border-white/40 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative"
                    >
                        {/* Close Button Absolute */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 p-2 bg-slate-100/80 text-slate-500 rounded-full hover:bg-slate-200 hover:text-slate-800 transition z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-6 pb-2">
                            <h3 className="text-xl font-bold text-slate-900 pr-8 line-clamp-2 leading-tight">
                                {storyTitle || 'Story Options'}
                            </h3>
                            <p className="text-sm text-slate-500 font-medium mt-1">Select an action</p>
                        </div>

                        <div className="p-4 space-y-3 overflow-y-auto scrollbar-hide">

                            {/* Go to Details */}
                            <button
                                onClick={() => {
                                    router.push(`/story/${storyId}`);
                                    onClose();
                                }}
                                className="w-full p-4 rounded-2xl flex items-center justify-between transition-all bg-indigo-50/50 border border-indigo-100/50 hover:bg-indigo-50 text-slate-900 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-base">Go to Story Page</span>
                                </div>
                            </button>

                            {/* Favorite Button */}
                            <button
                                onClick={handleToggleFavorite}
                                disabled={favLoading}
                                className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border
                                    ${isFavorite
                                        ? 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100'
                                        : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-100'}
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isFavorite ? 'bg-red-100 text-red-500' : 'bg-white shadow-sm'}`}>
                                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                                    </div>
                                    <span className="font-bold text-base">
                                        {isFavorite ? 'Favorited' : 'Add to Favorites'}
                                    </span>
                                </div>
                                {favLoading && <Loader2 className="w-5 h-5 animate-spin opacity-50" />}
                            </button>

                            {/* Playlist Accordion */}
                            <div className={`overflow-hidden rounded-2xl border transition-all ${showPlaylists ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
                                <button
                                    onClick={handleShowPlaylists}
                                    className="w-full p-4 flex items-center justify-between text-slate-700 hover:bg-slate-100/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-500">
                                            <ListMusic className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <span className="font-bold text-base block">Add to Playlist</span>
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 transition-transform text-slate-400 ${showPlaylists ? 'rotate-90 text-indigo-500' : ''}`} />
                                </button>

                                {/* Playlist Content */}
                                <AnimatePresence>
                                    {showPlaylists && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="px-4 pb-4"
                                        >
                                            {playlistLoading ? (
                                                <div className="py-4 flex justify-center text-indigo-400">
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                </div>
                                            ) : (
                                                <div className="space-y-2 mt-2">
                                                    <button
                                                        onClick={() => setShowCreateModal(true)}
                                                        className="w-full p-3 bg-white/50 border border-dashed border-indigo-200 rounded-xl flex items-center gap-3 text-indigo-500 font-semibold hover:bg-white transition text-sm"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        Create New Playlist
                                                    </button>

                                                    {playlists.length === 0 && !playlistLoading && (
                                                        <p className="text-center text-slate-400 text-xs py-2">No playlists found.</p>
                                                    )}

                                                    {playlists.map(playlist => (
                                                        <button
                                                            key={playlist.id}
                                                            onClick={() => handleAddToPlaylist(playlist.id)}
                                                            className="w-full p-2 flex items-center gap-3 hover:bg-white rounded-xl transition group"
                                                        >
                                                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 overflow-hidden">
                                                                {playlist.cover_url ? (
                                                                    <img src={playlist.cover_url} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <ListMusic className="w-5 h-5 text-indigo-400" />
                                                                )}
                                                            </div>
                                                            <span className="font-medium text-slate-700 truncate flex-1 text-left text-sm">{playlist.title}</span>
                                                            {addingToId === playlist.id && <Check className="w-5 h-5 text-green-500" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            {createPortal(modalContent, document.body)}

            {/* Create Playlist Modal is already a portal (or will be updated to be one) to ensure it sits on top */}
            <CreatePlaylistModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreated={() => {
                    setPlaylistLoading(true);
                    getUserPlaylists(user?.id!).then(data => {
                        setPlaylists(data);
                        setPlaylistLoading(false);
                    });
                }}
            />
        </>
    );
}
