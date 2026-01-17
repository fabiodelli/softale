'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import type { Playlist } from '@/lib/supabase';
import { Play, ListMusic } from 'lucide-react';

interface Props {
    playlist: Playlist;
    className?: string;
}

export default function PlaylistCard({ playlist, className = '' }: Props) {
    const router = useRouter();
    const itemCount = playlist.item_count || 0;

    // Use placeholder or maybe we can fetch first story cover later?
    // For now use a nice gradient or icon

    const handleClick = () => {
        router.push(`/playlist/${playlist.id}`);
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
                {playlist.cover_url ? (
                    <img src={playlist.cover_url} alt={playlist.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <ListMusic className="w-12 h-12 text-white/50" />
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                {/* Badge */}
                <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg text-xs font-bold text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/_90%)]">
                    {itemCount} tracks
                </div>

                {/* Play Button on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                        <Play className="w-6 h-6 text-slate-900 ml-1" fill="currentColor" />
                    </div>
                </div>

                {/* Title on Card */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-bold text-white truncate [text-shadow:_0_1px_3px_rgb(0_0_0_/_90%)]">
                        {playlist.title}
                    </h3>
                    {playlist.description && (
                        <p className="text-sm text-white/80 truncate [text-shadow:_0_1px_2px_rgb(0_0_0_/_80%)]">
                            {playlist.description}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
