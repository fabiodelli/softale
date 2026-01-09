'use client';

import { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import Link from 'next/link';
import { getStories, supabase, type Story } from '@/lib/supabase';

export default function StoriesManager() {
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        setLoading(true);
        // Using "all" category, and includeUnpublished=true for admin view
        const data = await getStories(undefined, true);
        setStories(data);
        setLoading(false);
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;

        try {
            if (!supabase) throw new Error('Supabase client not initialized');
            const { error } = await supabase.from('stories').delete().eq('id', id);
            if (error) throw error;
            setStories(stories.filter(s => s.id !== id));
            setStatus(`Deleted "${title}"`);
        } catch (error: any) {
            console.error('Delete failed:', error);
            setStatus(`Error: ${error.message}`);
        }
    };

    const togglePremium = async (story: Story) => {
        try {
            if (!supabase) throw new Error('Supabase client not initialized');
            const newValue = !story.is_premium;
            const { error } = await supabase.from('stories').update({ is_premium: newValue }).eq('id', story.id);
            if (error) throw error;
            setStories(stories.map(s => s.id === story.id ? { ...s, is_premium: newValue } : s));
            setStatus(`Updated "${story.title}" to ${newValue ? 'Premium' : 'Free'}`);
        } catch (error: any) {
            console.error('Update failed:', error);
            setStatus(`Error: ${error.message}`);
        }
    }

    const togglePublished = async (story: Story) => {
        const action = story.is_published ? 'unpublish' : 'publish';
        if (!confirm(`Are you sure you want to ${action} "${story.title}"?`)) return;

        try {
            if (!supabase) throw new Error('Supabase client not initialized');
            const newValue = !story.is_published;
            const { error } = await supabase.from('stories').update({ is_published: newValue }).eq('id', story.id);
            if (error) throw error;
            setStories(stories.map(s => s.id === story.id ? { ...s, is_published: newValue } : s));
            setStatus(`"${story.title}" is now ${newValue ? 'Published' : 'Unpublished'}`);
        } catch (error: any) {
            console.error('Publish toggle failed:', error);
            setStatus(`Error: ${error.message}`);
        }
    }

    const handleGenerateSocial = async (story: Story) => {
        if (!confirm(`Generate a Social Reel for "${story.title}"? This process takes about 1-2 minutes.`)) return;

        setGeneratingIds(prev => new Set(prev).add(story.id));
        setStatus(`🚀 Starting Reel generation for "${story.title}"...`);

        try {
            const res = await fetch('/api/admin/generate-social', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storyId: story.id })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to start generation');
            setStatus(`✅ Generation queued! Check Social Studio in a few minutes.`);
        } catch (error: any) {
            console.error('Social generation failed:', error);
            setStatus(`Error: ${error.message}`);
            setGeneratingIds(prev => {
                const next = new Set(prev);
                next.delete(story.id);
                return next;
            });
        }
    };

    return (
        <AdminGuard>
            <div className="min-h-screen bg-slate-950 pb-20 text-white">
                <header className="bg-slate-900 border-b border-white/5 sticky top-0 z-40 shadow-sm">
                    <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link href="/admin" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-sm font-medium">
                                <span>←</span> Back
                            </Link>
                            <div className="h-6 w-px bg-white/10 mx-4" />
                            <h1 className="text-xl font-bold tracking-tight">Story Manager</h1>
                        </div>
                        <Link href="/admin/stories/editor" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20 transition transform active:scale-95">
                            + New Story
                        </Link>
                    </div>
                </header>

                <main className="max-w-[1600px] mx-auto px-6 py-8">
                    {status && (
                        <div className="mb-6 p-4 rounded-lg bg-slate-900 border border-white/10 text-emerald-400 flex justify-between items-center">
                            <span>{status}</span>
                            <button onClick={() => setStatus('')} className="text-gray-500 hover:text-white">✕</button>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-20 text-gray-500">Loading stories...</div>
                    ) : (
                        <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-slate-800/50">
                                        <th className="p-4 font-medium text-gray-400">Cover</th>
                                        <th className="p-4 font-medium text-gray-400">Title</th>
                                        <th className="p-4 font-medium text-gray-400">Category</th>
                                        <th className="p-4 font-medium text-gray-400">Duration</th>
                                        <th className="p-4 font-medium text-gray-400">Access</th>
                                        <th className="p-4 font-medium text-gray-400">Status</th>
                                        <th className="p-4 font-medium text-gray-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stories.map((story) => (
                                        <tr key={story.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                            <td className="p-4">
                                                <div className="w-12 h-12 rounded bg-slate-800 overflow-hidden relative">
                                                    {story.cover_url ? (
                                                        <img src={story.cover_url} alt="" className="w-full h-full object-cover" />
                                                    ) : <span className="absolute inset-0 flex items-center justify-center text-xs">No Img</span>}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-white">{story.title}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-[200px]">{story.id}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs capitalize ${story.category === 'sleep' ? 'bg-indigo-500/10 text-indigo-400' :
                                                    story.category === 'meditation' ? 'bg-teal-500/10 text-teal-400' :
                                                        story.category === 'fantasy' ? 'bg-purple-500/10 text-purple-400' :
                                                            'bg-green-500/10 text-green-400'
                                                    }`}>
                                                    {story.category}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-400">
                                                {Math.ceil(story.duration / 60)} min
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => togglePremium(story)}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${story.is_premium
                                                        ? 'bg-amber-500 text-black hover:bg-amber-400'
                                                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                                        }`}>
                                                    {story.is_premium ? 'Premium ⭐' : 'Free'}
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => togglePublished(story)}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${story.is_published
                                                        ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                                                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                                                        }`}>
                                                    {story.is_published ? '✓ Published' : '✗ Draft'}
                                                </button>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleGenerateSocial(story)}
                                                        disabled={generatingIds.has(story.id)}
                                                        className={`p-2 rounded transition ${generatingIds.has(story.id)
                                                            ? 'bg-indigo-500/20 text-indigo-300 cursor-wait'
                                                            : story.social_reel_url
                                                                ? 'hover:bg-green-500/10 text-green-500 hover:text-green-400 opacity-80'
                                                                : 'hover:bg-purple-500/10 text-gray-400 hover:text-purple-400'
                                                            }`}
                                                        title={story.social_reel_url ? "Regenerate Reel" : "Generate Social Reel"}
                                                    >
                                                        {generatingIds.has(story.id) ? '⏳' : story.social_reel_url ? '🎬✓' : '🎬'}
                                                    </button>
                                                    <Link
                                                        href={`/admin/stories/editor?id=${story.id}`}
                                                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded transition text-sm font-medium"
                                                    >
                                                        Manage
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(story.id, story.title)}
                                                        className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded transition"
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {stories.length === 0 && (
                                <div className="p-10 text-center text-gray-500">
                                    No stories found. Go generate some!
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </AdminGuard>
    );
}
