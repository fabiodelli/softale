'use client';

import { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import Link from 'next/link';
import { supabase, Story } from '@/lib/supabase';

// Extended Story type with social fields
interface SocialStory extends Story {
    social_reel_url?: string;
    social_status?: 'draft' | 'generated' | 'approved' | 'posted';
}

export default function SocialDashboard() {
    const [stories, setStories] = useState<SocialStory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStories();
    }, []);

    async function loadStories() {
        if (!supabase) return;
        setLoading(true);
        // Fetch stories that have a reel generated
        const { data, error } = await supabase
            .from('stories')
            .select('*')
            .not('social_reel_url', 'is', null) // Only ones with reels
            .order('created_at', { ascending: false });

        if (!error && data) {
            setStories(data as SocialStory[]);
        }
        setLoading(false);
    }

    const handleApprove = async (id: string, title: string) => {
        if (!confirm(`Confirm approval for "${title}"? This marks it as ready for auto-posting (future).`)) return;
        if (!supabase) return;
        const { error } = await supabase
            .from('stories')
            .update({ social_status: 'approved' })
            .eq('id', id);

        if (!error) {
            setStories(prev => prev.map(s => s.id === id ? { ...s, social_status: 'approved' } : s));
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete the social reel for "${title}"? the file will persist in storage but disappear from here.`)) return;
        if (!supabase) return;

        // Remove social fields from DB record
        const { error } = await supabase
            .from('stories')
            .update({
                social_status: null,
                social_reel_url: null
            })
            .eq('id', id);

        if (!error) {
            // Remove from local list
            setStories(prev => prev.filter(s => s.id !== id));
        }
    };

    return (
        <AdminGuard>
            <div className="min-h-screen bg-slate-950 pb-20 text-white font-sans">
                <header className="bg-slate-900 border-b border-white/5 sticky top-0 z-40 shadow-sm">
                    <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link href="/admin" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-sm font-medium">
                                <span>←</span> Back
                            </Link>
                            <div className="h-6 w-px bg-white/10 mx-4" />
                            <h1 className="text-xl font-bold tracking-tight">Social Media Studio</h1>
                        </div>
                        <div className="text-sm font-medium px-3 py-1 bg-white/5 rounded-full border border-white/5 text-gray-300">
                            {stories.length} Reels Ready
                        </div>
                    </div>
                </header>

                <main className="max-w-[1600px] mx-auto px-6 py-8">
                    {loading ? (
                        <div className="text-center py-20 animate-pulse text-gray-500">Loading Reels...</div>
                    ) : stories.length === 0 ? (
                        <div className="text-center py-32 border-2 border-dashed border-white/5 rounded-2xl bg-slate-900/50">
                            <div className="text-4xl mb-4">🎬</div>
                            <p className="text-xl text-gray-400 font-medium">No generated reels found.</p>
                            <p className="text-sm text-gray-500 mt-2">Generate a reel from the Story Manager.</p>
                            <Link href="/admin/stories" className="inline-block mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-bold transition">
                                Go to Stories
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {stories.map(story => (
                                <div key={story.id} className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow group">
                                    {/* Video Player */}
                                    <div className="aspect-[9/16] bg-black relative">
                                        <video
                                            src={story.social_reel_url}
                                            controls
                                            className="w-full h-full object-cover"
                                            poster={story.cover_portrait_url}
                                            preload="metadata"
                                        />
                                        <div className="absolute top-3 right-3">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm
                                                ${story.social_status === 'approved' ? 'bg-green-500 text-black' :
                                                    story.social_status === 'posted' ? 'bg-blue-500 text-white' :
                                                        'bg-amber-500 text-black'}`}>
                                                {story.social_status || 'Draft'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info & Actions */}
                                    <div className="p-5 border-t border-white/5">
                                        <h3 className="font-bold text-lg truncate mb-1 text-white">{story.title}</h3>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-[10px] uppercase font-bold text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">{story.category}</span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-4">
                                            {story.social_status !== 'approved' && story.social_status !== 'posted' ? (
                                                <button
                                                    onClick={() => handleApprove(story.id, story.title)}
                                                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-2 rounded-xl font-bold text-sm transition shadow-lg shadow-emerald-900/20"
                                                >
                                                    Approve
                                                </button>
                                            ) : (
                                                <button disabled className="flex-1 bg-slate-800 text-emerald-500 py-2 rounded-xl font-bold text-sm cursor-default border border-emerald-500/20 flex items-center justify-center gap-2">
                                                    <span>✓</span> Approved
                                                </button>
                                            )}

                                            <a
                                                href={story.social_reel_url}
                                                download
                                                className="p-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl border border-white/5 transition flex items-center justify-center text-gray-400"
                                                title="Download MP4"
                                            >
                                                ⬇️
                                            </a>

                                            <button
                                                onClick={() => handleDelete(story.id, story.title)}
                                                className="p-2.5 bg-slate-800 hover:bg-red-500/10 hover:border-red-500/20 text-gray-400 hover:text-red-400 rounded-xl border border-white/5 transition flex items-center justify-center"
                                                title="Delete Reel"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </AdminGuard>
    );
}
