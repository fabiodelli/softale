'use client';

import { useEffect, useState } from 'react';
import { getFavorites, type Story } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';
import Carousel from './Carousel';
import { useRouter } from 'next/navigation';
import StoryCard from './StoryCard';

export default function FavoritesRow() {
    const { user } = useAuth();
    const router = useRouter();
    const [favorites, setFavorites] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            if (user) {
                const data = await getFavorites(user.id);
                setFavorites(data);
            }
            setLoading(false);
        }
        load();
    }, [user]);

    if (!user || (!loading && favorites.length === 0)) return null;

    const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)} min`;

    return (
        <section className="py-8 px-4 md:px-8 w-full">
            <div className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium flex items-center gap-2 text-indigo-300">
                        <span>❤️</span> Your Favorites
                    </h3>
                </div>
                {loading ? (
                    <div className="flex gap-4 overflow-hidden">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-72 h-40 bg-slate-800/50 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <Carousel>
                        {favorites.map((story) => (
                            <div
                                key={story.id}
                                className="flex-shrink-0 w-72 md:w-80"
                            >
                                <StoryCard story={story} aspectRatio="video" />
                            </div>
                        ))}
                    </Carousel>
                )}
            </div>
        </section >
    );
}
