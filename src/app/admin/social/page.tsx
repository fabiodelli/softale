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
            <div className="min-h-screen bg-slate-950 pb-20 text-white">
                <header className="bg-slate-900 border-b border-white/5 sticky top-0 z-40">
                    <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link href="/admin" className="text-gray-400 hover:text-white">← Back</Link>
                            <h1 className="text-xl font-bold ml-4">Social Media Approval</h1>
                        </div>
                        <div className="text-sm text-gray-400">
                            {stories.length} Reels Ready
                        </div>
                    </div>
                </header>

                <main className="max-w-6xl mx-auto px-4 py-8">
                    {loading ? (
                        <div className="text-center py-20 animate-pulse text-gray-500">Loading Reels...</div>
                    ) : stories.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                            <p className="text-xl text-gray-400">No generated reels found.</p>
                            <p className="text-sm text-gray-500 mt-2">Run the Social Bot to generate content.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {stories.map(story => (
                                <div key={story.id} className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-xl">
                                    {/* Video Player */}
                                    <div className="aspect-[9/16] bg-black relative group">
                                        <video
                                            src={story.social_reel_url}
                                            controls
                                            className="w-full h-full object-contain"
                                            poster={story.cover_portrait_url}
                                        />
                                        <div className="absolute top-2 right-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
                                                ${story.social_status === 'approved' ? 'bg-green-500 text-black' :
                                                    story.social_status === 'posted' ? 'bg-blue-500 text-white' :
                                                        'bg-amber-500 text-black'}`}>
                                                {story.social_status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info & Actions */}
                                    <div className="p-4">
                                        <h3 className="font-bold text-lg truncate mb-1">{story.title}</h3>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-4">{story.description}</p>

                                        <div className="flex items-center gap-2">
                                            {story.social_status !== 'approved' && story.social_status !== 'posted' ? (
                                                <button
                                                    onClick={() => handleApprove(story.id, story.title)}
                                                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-medium transition"
                                                >
                                                    ✅ Approve
                                                </button>
                                            ) : (
                                                <button disabled className="flex-1 bg-slate-800 text-green-500 py-2 rounded-lg font-medium cursor-default border border-green-500/20">
                                                    Authorised
                                                </button>
                                            )}

                                            <a
                                                href={story.social_reel_url}
                                                download
                                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-white/10 transition flex items-center justify-center"
                                                title="Download MP4"
                                            >
                                                ⬇️
                                            </a>

                                            <button
                                                onClick={() => handleDelete(story.id, story.title)}
                                                className="px-3 py-2 bg-slate-800 hover:bg-red-900/30 text-gray-400 hover:text-red-500 rounded-lg border border-white/10 transition flex items-center justify-center"
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
