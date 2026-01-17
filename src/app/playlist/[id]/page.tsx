'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPlaylistDetails, deletePlaylist, removeStoryFromPlaylist, type Playlist } from '@/lib/supabase';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Pause, ArrowLeft, Clock, ListMusic, Shuffle, Trash2 } from 'lucide-react';

import { usePlayer } from '@/lib/PlayerContext';
import GlassLayout from '@/components/GlassLayout';
import { useAuth } from '@/lib/AuthProvider';

export default function PlaylistPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const { playQueue, currentStory, isPlaying, toggle } = usePlayer();
    const { user } = useAuth();

    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) loadPlaylist();
    }, [id]);

    const loadPlaylist = async () => {
        if (!id) return;
        const data = await getPlaylistDetails(id);
        setPlaylist(data);
        setLoading(false);
    };

    const formatDuration = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        return `${min} min`;
    };

    const getTotalDuration = () => {
        if (!playlist?.items) return 0;
        return playlist.items.reduce((acc, s) => acc + s.duration, 0);
    };

    const handleRemoveStory = async (e: React.MouseEvent, storyId: string) => {
        e.stopPropagation();
        if (!confirm('Remove from playlist?')) return;
        const success = await removeStoryFromPlaylist(id, storyId);
        if (success) {
            loadPlaylist(); // Refresh
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!playlist) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900">
                <h1 className="text-2xl font-bold mb-4">Playlist Not Found</h1>
                <Link href="/library" className="text-indigo-600 hover:text-indigo-700">← Back to Library</Link>
            </div>
        );
    }

    const startPlaying = (index: number = 0) => {
        if (playlist.items && playlist.items.length > 0) {
            playQueue(playlist.items, index, {
                // Should we identify as playlist context? Player might support generic context or text.
                // For now pass playlist title in metadata if possible, but PlayerContext interface might be strict.
                // Passing empty slug or generic.
                slug: `playlist-${id}`,
                isLoopable: false
            });
        }
    };

    const isStoryPlaying = (storyId: string) => currentStory?.id === storyId;

    return (
        <GlassLayout>
            {/* Hero Section */}
            <div className="pt-8 pb-8 px-6 md:px-12">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-white/80 hover:text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/_80%)] transition mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Back</span>
                    </button>

                    <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center justify-center">

                        {/* Cover Placeholder or First Story Image */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-shrink-0"
                        >
                            <div className="w-full md:w-72 aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/20 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                {playlist.items?.[0]?.cover_url ? (
                                    <img src={playlist.items[0].cover_url} alt={playlist.title} className="w-full h-full object-cover" />
                                ) : (
                                    <ListMusic className="w-20 h-20 text-white/50" />
                                )}
                            </div>
                        </motion.div>

                        {/* Info */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="max-w-md flex flex-col justify-center md:text-left text-center flex-1"
                        >
                            <div className="flex items-center gap-2 mb-3 justify-center md:justify-start">
                                <span className="text-xs uppercase tracking-widest text-indigo-300 font-bold">
                                    Playlist
                                </span>
                            </div>

                            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-white [text-shadow:_0_1px_4px_rgb(0_0_0_/_90%)] leading-tight">
                                {playlist.title}
                            </h1>

                            {playlist.description && (
                                <p className="text-slate-200 mb-6 max-w-xl leading-relaxed [text-shadow:_0_1px_2px_rgb(0_0_0_/_80%)]">
                                    {playlist.description}
                                </p>
                            )}

                            {/* Stats */}
                            <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-slate-300 mb-6 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <ListMusic className="w-4 h-4" />
                                    <span>{playlist.items?.length || 0} tracks</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    <span>{formatDuration(getTotalDuration())}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                <button
                                    onClick={() => startPlaying(0)}
                                    disabled={!playlist.items || playlist.items.length === 0}
                                    className="px-8 py-3.5 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-100 transition shadow-lg flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Play className="w-5 h-5" fill="currentColor" />
                                    Play All
                                </button>
                                <button
                                    onClick={() => {
                                        if (playlist.items && playlist.items.length > 0) {
                                            const randomIndex = Math.floor(Math.random() * playlist.items.length);
                                            startPlaying(randomIndex);
                                        }
                                    }}
                                    disabled={!playlist.items || playlist.items.length === 0}
                                    className="px-6 py-3.5 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full font-bold hover:bg-white/20 transition flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Shuffle className="w-4 h-4" />
                                    Shuffle
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Tracklist */}
            <div className="max-w-6xl mx-auto px-6 md:px-12 py-8">
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden shadow-xl">
                    {playlist.items?.map((story, i) => {
                        const isCurrentlyPlaying = isStoryPlaying(story.id);

                        return (
                            <motion.div
                                key={story.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                onClick={() => isCurrentlyPlaying ? toggle() : startPlaying(i)}
                                className={`group flex items-center gap-4 p-4 cursor-pointer border-b border-slate-100 last:border-0 transition ${isCurrentlyPlaying
                                    ? 'bg-indigo-50'
                                    : 'hover:bg-slate-50'
                                    }`}
                            >
                                {/* Track Number / Play */}
                                <div className="w-8 flex-shrink-0 flex items-center justify-center">
                                    {isCurrentlyPlaying ? (
                                        <div className="w-8 h-8 flex items-center justify-center">
                                            {isPlaying ? (
                                                <Pause className="w-4 h-4 text-indigo-600" fill="currentColor" />
                                            ) : (
                                                <Play className="w-4 h-4 text-indigo-600" fill="currentColor" />
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-slate-400 font-mono text-sm group-hover:hidden">
                                                {i + 1}
                                            </span>
                                            <Play className="w-4 h-4 text-slate-600 hidden group-hover:block" fill="currentColor" />
                                        </>
                                    )}
                                </div>

                                {/* Cover Image */}
                                <div className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-sm ${isCurrentlyPlaying ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                                    }`}>
                                    {story.cover_url ? (
                                        <img src={story.cover_url} alt={story.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-200" />
                                    )}
                                </div>

                                {/* Track Info */}
                                <div className="flex-1 min-w-0">
                                    <div className={`font-medium truncate transition ${isCurrentlyPlaying ? 'text-indigo-600' : 'text-slate-900 group-hover:text-indigo-600'
                                        }`}>
                                        {story.title}
                                    </div>
                                    <div className="text-xs text-slate-500 capitalize">{story.category}</div>
                                </div>

                                {/* Duration */}
                                <div className="text-slate-400 text-sm font-mono flex-shrink-0 hidden sm:block">
                                    {formatDuration(story.duration)}
                                </div>

                                {/* Remove Button */}
                                {user && user.id === playlist.user_id && (
                                    <button
                                        onClick={(e) => handleRemoveStory(e, story.id)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition opacity-0 group-hover:opacity-100"
                                        title="Remove from playlist"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </motion.div>
                        );
                    })}

                    {(!playlist.items || playlist.items.length === 0) && (
                        <div className="text-center py-20 text-slate-400 italic">
                            No stories in this playlist yet. Go to the Library and add some!
                        </div>
                    )}
                </div>
            </div>
        </GlassLayout>
    );
}
