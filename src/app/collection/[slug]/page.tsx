'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCollectionBySlug, getCollectionById, type Collection, type Story } from '@/lib/supabase';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Pause, ArrowLeft, Clock, Layers, Shuffle } from 'lucide-react';

import { usePlayer } from '@/lib/PlayerContext';
import GlassLayout from '@/components/GlassLayout';

// Loopable categories
const LOOPABLE_CATEGORIES = ['soundscape', 'binaural', 'music_instrumental'];

export default function CollectionPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const { playQueue, currentStory, isPlaying, toggle } = usePlayer();

    const [collection, setCollection] = useState<Collection | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) loadCollection();
    }, [slug]);

    const loadCollection = async () => {
        if (!slug) return;
        const data = await getCollectionBySlug(slug);
        setCollection(data);
        setLoading(false);
    };

    const formatDuration = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        return `${min} min`;
    };

    const getTotalDuration = () => {
        if (!collection?.stories) return 0;
        return collection.stories.reduce((acc, s) => acc + s.duration, 0);
    };

    const isLoopable = collection ? LOOPABLE_CATEGORIES.includes(collection.category || '') : false;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!collection) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900">
                <h1 className="text-2xl font-bold mb-4">Collection Not Found</h1>
                <p className="text-slate-500 mb-8 font-mono bg-slate-100 px-4 py-2 rounded">Debug ID: {slug}</p>
                <Link href="/" className="text-indigo-600 hover:text-indigo-700">← Back Home</Link>
            </div>
        );
    }

    const startPlaying = (index: number = 0) => {
        if (collection.stories && collection.stories.length > 0) {
            playQueue(collection.stories, index, {
                slug: collection.slug,
                isLoopable
            });
        }
    };

    const isStoryPlaying = (storyId: string) => currentStory?.id === storyId;

    return (
        <GlassLayout>
            {/* Hero Section - Side by Side Layout */}
            <div className="pt-8 pb-8 px-6 md:px-12">
                <div className="max-w-4xl mx-auto">
                    {/* Mobile Logo */}
                    <Link href="/" className="flex md:hidden items-center justify-center gap-2 mb-6 group">
                        <Image
                            src="/assets/softale-icon.png"
                            alt="Softale"
                            width={200}
                            height={200}
                            className="h-12 w-auto drop-shadow-lg group-hover:scale-105 transition-transform"
                        />
                        <span
                            className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent drop-shadow-lg"
                            style={{ fontFamily: 'Outfit, var(--font-inter), system-ui, sans-serif' }}
                        >
                            Softale
                        </span>
                    </Link>

                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Back</span>
                    </button>

                    <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center justify-center">

                        {/* Album Cover */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-shrink-0"
                        >
                            <div className="w-full md:w-72 aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/20 bg-slate-200">
                                {collection.stories?.[0]?.cover_url ? (
                                    <img
                                        src={collection.stories[0].cover_url}
                                        alt={collection.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                        <Layers className="w-20 h-20 text-white/50" />
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Collection Info */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="max-w-md flex flex-col justify-center md:text-left text-center"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs uppercase tracking-widest text-indigo-600 font-bold">
                                    Collection
                                </span>
                                {isLoopable && (
                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs font-medium rounded-full">
                                        ∞ Loopable
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900 leading-tight">
                                {collection.title}
                            </h1>

                            {collection.description && (
                                <p className="text-slate-600 mb-6 max-w-xl leading-relaxed">
                                    {collection.description}
                                </p>
                            )}

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                                <div className="flex items-center gap-1.5">
                                    <Layers className="w-4 h-4" />
                                    <span>{collection.stories?.length || 0} tracks</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    <span>{formatDuration(getTotalDuration())}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => startPlaying(0)}
                                    className="px-8 py-3.5 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 flex items-center gap-2"
                                >
                                    <Play className="w-5 h-5" fill="currentColor" />
                                    Play All
                                </button>
                                <button
                                    onClick={() => {
                                        if (collection.stories && collection.stories.length > 0) {
                                            const randomIndex = Math.floor(Math.random() * collection.stories.length);
                                            startPlaying(randomIndex);
                                        }
                                    }}
                                    className="px-6 py-3.5 bg-white text-slate-700 border border-slate-200 rounded-full font-bold hover:bg-slate-50 transition flex items-center gap-2"
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
                <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                    {collection.stories?.map((story, i) => {
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
                                <div className="text-slate-400 text-sm font-mono flex-shrink-0">
                                    {formatDuration(story.duration)}
                                </div>
                            </motion.div>
                        );
                    })}

                    {(!collection.stories || collection.stories.length === 0) && (
                        <div className="text-center py-20 text-slate-400 italic">
                            No stories in this collection yet.
                        </div>
                    )}
                </div>
            </div>
        </GlassLayout>
    );
}
