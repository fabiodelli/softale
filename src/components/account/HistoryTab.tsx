'use client';

import { useEffect, useState } from 'react';
import { getInProgressStories, StoryWithProgress } from '@/lib/supabase';
import StoryCard from '@/components/StoryCard';
import { useAuth } from '@/lib/AuthProvider';
import { History } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HistoryTab() {
    const { user } = useAuth();
    const [history, setHistory] = useState<StoryWithProgress[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            if (user) {
                const data = await getInProgressStories(user.id);
                setHistory(data);
            }
            setLoading(false);
        }
        load();
    }, [user]);

    if (loading) return <div className="py-20 text-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>;

    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in slide-in-from-bottom-2">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <History className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No recent history</h3>
                <p className="text-slate-500 text-sm max-w-xs mt-2">
                    Stories you listen to will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Continue Listening</h3>
            <div className="grid grid-cols-2 gap-4">
                {history.map((story, i) => (
                    <motion.div
                        key={story.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <StoryCard
                            story={story}
                            aspectRatio="square"
                            progress={story.progress_percent}
                        />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
