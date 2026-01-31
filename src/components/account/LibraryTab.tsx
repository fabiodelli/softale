'use client';

import { useEffect, useState } from 'react';
import { getFavorites, getUserPlaylists, deletePlaylist, type Story, type Playlist } from '@/lib/supabase';
import StoryCard from '@/components/StoryCard';
import { useAuth } from '@/lib/AuthProvider';
import { Heart, ListMusic, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LibraryTab() {
    const { user } = useAuth();
    const router = useRouter();
    const [favorites, setFavorites] = useState<Story[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            if (user) {
                const [favs, pls] = await Promise.all([
                    getFavorites(user.id),
                    getUserPlaylists(user.id)
                ]);
                setFavorites(favs);
                setPlaylists(pls);
            }
            setLoading(false);
        }
        load();
    }, [user]);

    const handleDeletePlaylist = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;

        // Optimistic update
        setPlaylists(prev => prev.filter(p => p.id !== id));

        const success = await deletePlaylist(id);
        if (success) {
            router.refresh();
        } else {
            // Revert if failed (optional, but good UX)
            // ensure load calls again? 
            // simpler to just reload
            const pls = await getUserPlaylists(user?.id || '');
            setPlaylists(pls);
        }
    };

    if (loading) return <div className="py-20 text-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>;

    if (favorites.length === 0 && playlists.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in slide-in-from-bottom-2">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                    <Heart className="w-8 h-8 text-rose-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Your collection is empty</h3>
                <p className="text-slate-500 text-sm max-w-xs mt-2 mb-6">
                    Save stories and create playlists to see them here.
                </p>
                <Link href="/library" className="px-6 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition">
                    Browse Library
                </Link>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">

            {/* Playlists Section */}
            {playlists.length > 0 && (
                <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <ListMusic className="w-4 h-4" />
                        Created Playlists ({playlists.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        {playlists.map((playlist, i) => (
                            <motion.div
                                key={playlist.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="group flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 transition shadow-sm"
                            >
                                {/* Icon/Color */}
                                <Link href={`/playlist/${playlist.id}`} className="flex-shrink-0">
                                    {playlist.cover_url ? (
                                        <div className="w-14 h-14 rounded-xl overflow-hidden shadow-sm group-hover:scale-105 transition">
                                            <img src={playlist.cover_url || ''} alt={playlist.title} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-indigo-400 group-hover:scale-105 group-hover:bg-indigo-100 transition">
                                            <ListMusic className="w-7 h-7" />
                                        </div>
                                    )}
                                </Link>

                                {/* Info */}
                                <Link href={`/playlist/${playlist.id}`} className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition">{playlist.title}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span>{playlist.item_count} items</span>
                                    </div>
                                </Link>

                                {/* Delete Action */}
                                <button
                                    onClick={() => handleDeletePlaylist(playlist.id, playlist.title)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                    title="Delete Playlist"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* Favorites Section */}
            {favorites.length > 0 && (
                <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        Favorites ({favorites.length})
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {favorites.map((story, i) => (
                            <motion.div
                                key={story.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <StoryCard story={story} aspectRatio="square" />
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
