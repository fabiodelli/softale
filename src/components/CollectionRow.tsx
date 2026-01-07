'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Collection } from '@/lib/supabase';
import Carousel from './Carousel';

interface Props {
    collection: Collection;
}

export default function CollectionRow({ collection }: Props) {
    const router = useRouter();
    const stories = collection.stories || [];

    if (stories.length === 0) return null;

    const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)} min`;

    return (
        <section className="py-8 px-4 border-b border-white/5 last:border-0">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-100 to-indigo-300">
                            {collection.title}
                        </h3>
                        {collection.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{collection.description}</p>
                        )}
                    </div>
                    <Link
                        href={`/collection/${collection.slug}`}
                        className="text-xs uppercase font-bold tracking-wider text-indigo-400 hover:text-indigo-300 transition"
                    >
                        View All
                    </Link>
                </div>

                {/* Horizontal Scroll */}
                <Carousel className="pb-6">
                    {stories.map((story) => (
                        <div
                            key={story.id}
                            onClick={() => router.push(`/story/${story.id}`)}
                            className="flex-shrink-0 w-48 cursor-pointer group"
                        >
                            {/* Card Image */}
                            <div className="relative aspect-[3/4] rounded-xl bg-slate-800 overflow-hidden mb-3 shadow-lg shadow-black/20 group-hover:shadow-indigo-900/10 transition duration-500">
                                {story.cover_url ? (
                                    <img
                                        src={story.cover_url}
                                        alt={story.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-900/30 to-slate-900 flex items-center justify-center">
                                        <span className="text-3xl opacity-30">🎧</span>
                                    </div>
                                )}

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                                {/* Duration Badge */}
                                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded text-xs text-white/80 font-mono border border-white/10">
                                    {formatDuration(story.duration)}
                                </div>

                                {/* Play Button on Hover */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                                    <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                                        ▶
                                    </div>
                                </div>
                            </div>

                            {/* Metadata */}
                            <h4 className="text-sm font-medium text-slate-200 truncate group-hover:text-indigo-400 transition">{story.title}</h4>
                            <p className="text-xs text-slate-500 capitalize">{story.category}</p>
                        </div>
                    ))}
                </Carousel>
            </div>
        </section >
    );
}
