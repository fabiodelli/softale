'use client';

import { useEffect, useState } from 'react';
import { getFavorites, Story } from '@/lib/supabase';
import StoryCard from '@/components/StoryCard';
import { useAuth } from '@/lib/AuthProvider';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function LibraryTab() {
    const { user } = useAuth();
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

    if (loading) return <div className="py-20 text-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>;

    if (favorites.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in slide-in-from-bottom-2">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                    <Heart className="w-8 h-8 text-rose-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Your collection is empty</h3>
                <p className="text-slate-500 text-sm max-w-xs mt-2 mb-6">
                    Save your favorite stories to find them easily here.
                </p>
                <Link href="/library" className="px-6 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition">
                    Browse Library
                </Link>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Favorites ({favorites.length})</h3>
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
        </div>
    );
}
