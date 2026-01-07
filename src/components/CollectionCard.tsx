'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import type { Collection } from '@/lib/supabase';
import { Play, Layers } from 'lucide-react';

interface Props {
    collection: Collection;
    className?: string;
}

// Loopable categories - show loop indicator
const LOOPABLE_CATEGORIES = ['soundscape', 'binaural', 'music_instrumental'];

export default function CollectionCard({ collection, className = '' }: Props) {
    const router = useRouter();
    const stories = collection.stories || [];
    const coverUrl = collection.cover_url || stories[0]?.cover_url;
    const isLoopable = LOOPABLE_CATEGORIES.includes(collection.category || '');

    const handleClick = () => {
        router.push(`/collection/${collection.slug}`);
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            className={`cursor-pointer group ${className}`}
        >
            {/* Card Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 shadow-md group-hover:shadow-xl transition-shadow duration-300">
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={collection.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                        <Layers className="w-12 h-12 text-indigo-300" />
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                {/* Collection Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-slate-700">
                    <Layers className="w-3 h-3" />
                    {stories.length} tracks
                </div>

                {/* Loopable Badge */}
                {isLoopable && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-indigo-500 text-white rounded-full text-xs font-medium">
                        ∞ Loop
                    </div>
                )}

                {/* Play Button on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                        <Play className="w-6 h-6 text-slate-900 ml-1" fill="currentColor" />
                    </div>
                </div>

                {/* Title on Card */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-bold text-white truncate drop-shadow-md">
                        {collection.title}
                    </h3>
                    {collection.description && (
                        <p className="text-sm text-white/80 truncate drop-shadow-sm">
                            {collection.description}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
