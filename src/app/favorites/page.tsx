'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthProvider';
import { usePlayer } from '@/lib/PlayerContext';
import { getFavorites, toggleFavorite, type Story } from '@/lib/supabase';


export default function FavoritesPage() {
    const { user, loading: authLoading } = useAuth();
    const { play } = usePlayer();
    const router = useRouter();
    const [favorites, setFavorites] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
            return;
        }

        async function load() {
            if (user) {
                const data = await getFavorites(user.id);
                setFavorites(data);
            }
            setLoading(false);
        }

        if (user) load();
    }, [user, authLoading, router]);

    const handleRemove = async (e: React.MouseEvent, storyId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) return;

        setFavorites(prev => prev.filter(s => s.id !== storyId));
        await toggleFavorite(user.id, storyId);
    };

    const handlePlay = (story: Story) => {
        play(story);
    };

    if (authLoading || (loading && !favorites.length)) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-20">
            <div className="max-w-2xl mx-auto px-4">
                <div className="mb-8 flex items-center gap-4">
                    <Link href="/account" className="text-slate-500 hover:text-slate-900 transition">← Back</Link>
                    <h1 className="text-3xl font-bold text-slate-900">Your Favorites</h1>
                </div>

                {favorites.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
                        <span className="text-4xl block mb-4">💔</span>
                        <h3 className="text-xl font-medium text-slate-900 mb-2">No favorites yet</h3>
                        <p className="text-slate-500 mb-6">Start exploring stories and tap the heart icon!</p>
                        <Link href="/" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition font-medium inline-block">
                            Browse Library
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {favorites.map((story) => (
                            <motion.div
                                key={story.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group flex items-center gap-4 p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition cursor-pointer"
                                onClick={() => handlePlay(story)}
                            >
                                {/* Thumbnail */}
                                <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100">
                                    {story.cover_landscape_url || story.cover_url ? (
                                        <img
                                            src={story.cover_landscape_url || story.cover_url}
                                            alt={story.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-indigo-100 to-purple-100">🎧</div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition">{story.title}</h3>
                                    <p className="text-sm text-slate-500 truncate">{story.author || 'Softale'}</p>
                                </div>

                                {/* Remove Button */}
                                <button
                                    onClick={(e) => handleRemove(e, story.id)}
                                    className="p-3 text-red-500 hover:bg-red-50 rounded-full transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Remove from favorites"
                                >
                                    ❤️
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
