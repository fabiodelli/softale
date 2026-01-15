'use client';

import { useState, useEffect, useMemo } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import { AdminLayout, AdminButton } from '@/components/admin/AdminLayout';
import Link from 'next/link';
import { getStories, supabase, type Story } from '@/lib/supabase';
import { Trash2, Globe, CheckSquare, Square, RefreshCw, Play, Pause, Plus, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '@/lib/PlayerContext';

const CATEGORIES = ['all', 'sleep', 'meditation', 'nature', 'fantasy', 'soundscape', 'binaural', 'music_instrumental', 'motivation', 'work_break', 'kids'];

export default function StoriesManager() {
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

    // Playback
    const { play, pause, currentStory, isPlaying } = usePlayer();

    // New State for Filtering & Selection
    const [filterCategory, setFilterCategory] = useState('all');
    const [selectedStoryIds, setSelectedStoryIds] = useState<Set<string>>(new Set());
    const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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

    // Filter Logic
    // Typesafe filter logic
    const filteredStories = useMemo(() => {
        let result = stories;
        // 1. Category Filter
        if (filterCategory !== 'all') {
            result = result.filter(s => s.category === filterCategory);
        }
        // 2. Search Filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.title.toLowerCase().includes(q) ||
                s.id.toLowerCase().includes(q)
            );
        }
        return result;
    }, [stories, filterCategory, searchQuery]);

    // Selection Logic
    const handleSelectAll = () => {
        if (selectedStoryIds.size === filteredStories.length) {
            setSelectedStoryIds(new Set()); // Deselect all
        } else {
            setSelectedStoryIds(new Set(filteredStories.map(s => s.id))); // Select all visible
        }
    };

    const handleSelectOne = (id: string) => {
        const next = new Set(selectedStoryIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedStoryIds(next);
    };

    const handlePlayStory = (e: React.MouseEvent, story: Story) => {
        e.stopPropagation();
        if (currentStory?.id === story.id && isPlaying) {
            pause();
        } else {
            play(story);
        }
    };

    // --- Actions ---

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;

        try {
            if (!supabase) throw new Error('Supabase client not initialized');
            const { error } = await supabase.from('stories').delete().eq('id', id);
            if (error) throw error;
            setStories(stories.filter(s => s.id !== id));
            setSelectedStoryIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
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

    // --- Bulk Actions ---

    const handleBulkAction = async (action: 'publish' | 'unpublish' | 'premium' | 'free' | 'delete') => {
        if (selectedStoryIds.size === 0) return;
        if (!confirm(`Apply "${action}" to ${selectedStoryIds.size} stories?`)) return;

        setIsBulkActionLoading(true);
        try {
            if (!supabase) throw new Error('Supabase client not initialized');
            const ids = Array.from(selectedStoryIds);

            let updates: any = {};
            if (action === 'publish') updates = { is_published: true };
            if (action === 'unpublish') updates = { is_published: false };
            if (action === 'premium') updates = { is_premium: true };
            if (action === 'free') updates = { is_premium: false };

            if (action === 'delete') {
                const { error } = await supabase.from('stories').delete().in('id', ids);
                if (error) throw error;
                setStories(prev => prev.filter(s => !selectedStoryIds.has(s.id)));
                setSelectedStoryIds(new Set());
            } else {
                const { error } = await supabase.from('stories').update(updates).in('id', ids);
                if (error) throw error;
                // Optimistic Update
                setStories(prev => prev.map(s => selectedStoryIds.has(s.id) ? { ...s, ...updates } : s));
            }

            setStatus(`✅ Bulk action "${action}" complete!`);
        } catch (error: any) {
            setStatus(`❌ Bulk Action Failed: ${error.message}`);
        } finally {
            setIsBulkActionLoading(false);
        }
    };

    // --- Render ---

    return (
        <AdminGuard>
            <AdminLayout
                title="Story Manager"
                subtitle="Manage, edit, and publish audio stories"
                backLink={{ href: '/admin', label: 'Dashboard' }}
                actions={
                    <Link href="/admin/stories/editor">
                        <AdminButton variant="primary">
                            <Plus className="w-4 h-4" />
                            New Story
                        </AdminButton>
                    </Link>
                }
            >
                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 rounded-lg bg-zinc-900 border border-zinc-700 text-emerald-400 flex justify-between items-center shadow-lg"
                    >
                        <div className="flex items-center gap-2">
                            <span>ℹ️</span> {status}
                        </div>
                        <button onClick={() => setStatus('')} className="text-zinc-500 hover:text-white">✕</button>
                    </motion.div>
                )}

                {/* Filter Bar */}
                <div className="mb-6 flex flex-col md:flex-row justify-between items-center bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800 gap-4">
                    <div className="flex items-center gap-3 px-3 w-full md:w-auto">
                        <div className="relative group flex-1 md:w-64">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search stories..."
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white focus:ring-2 focus:ring-violet-500 placeholder-zinc-600 transition"
                            />
                        </div>

                        <div className="h-6 w-px bg-zinc-800 mx-1 hidden md:block" />

                        <div className="relative group">
                            <select
                                value={filterCategory}
                                onChange={(e) => {
                                    setFilterCategory(e.target.value);
                                    setSelectedStoryIds(new Set());
                                }}
                                className="appearance-none bg-zinc-800 text-white pl-4 pr-10 py-1.5 rounded-lg border border-zinc-700 text-sm font-medium focus:ring-2 focus:ring-violet-500 hover:bg-zinc-700 transition cursor-pointer"
                            >
                                <option value="all">All Categories</option>
                                {CATEGORIES.filter(c => c !== 'all').map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat === 'music_instrumental' ? 'Instrumental' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="text-xs text-zinc-500 px-3 font-mono">
                        Showing {filteredStories.length} stories
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center py-40 text-zinc-500">
                        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p>Loading stories...</p>
                    </div>
                ) : (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-zinc-800 bg-zinc-900">
                                        <th className="p-4 w-12 pl-6">
                                            <button
                                                onClick={handleSelectAll}
                                                className="flex items-center justify-center text-zinc-500 hover:text-white transition"
                                                title="Select All"
                                            >
                                                {selectedStoryIds.size > 0 && selectedStoryIds.size === filteredStories.length ? (
                                                    <CheckSquare className="w-5 h-5 text-violet-400" />
                                                ) : (
                                                    <Square className="w-5 h-5" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="p-4 w-16 text-center text-zinc-500 font-medium">Play</th>
                                        <th className="p-4 text-zinc-500 font-medium">Story</th>
                                        <th className="p-4 text-zinc-500 font-medium">Category</th>
                                        <th className="p-4 text-zinc-500 font-medium text-center">Duration</th>
                                        <th className="p-4 text-zinc-500 font-medium text-center">Details</th>
                                        <th className="p-4 text-zinc-500 font-medium text-right pr-6">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {filteredStories.map((story) => {
                                        const isSelected = selectedStoryIds.has(story.id);
                                        const isThisPlaying = currentStory?.id === story.id && isPlaying;

                                        return (
                                            <tr key={story.id}
                                                className={`group transition duration-150 ${isSelected ? 'bg-violet-500/5 hover:bg-violet-500/10' : 'hover:bg-zinc-800/30'}`}
                                            >
                                                <td className="p-4 pl-6">
                                                    <button onClick={() => handleSelectOne(story.id)} className={`flex items-center justify-center ${isSelected ? 'text-violet-400' : 'text-zinc-600 hover:text-zinc-400'}`}>
                                                        {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                                    </button>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={(e) => handlePlayStory(e, story)}
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition ${isThisPlaying
                                                            ? 'bg-zinc-100 text-zinc-900 shadow-lg shadow-white/20'
                                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-50'
                                                            }`}
                                                    >
                                                        {isThisPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
                                                    </button>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden relative shadow-sm">
                                                            {story.cover_url ? (
                                                                <img src={story.cover_url} alt="" className="w-full h-full object-cover" />
                                                            ) : <span className="absolute inset-0 flex items-center justify-center text-xs text-zinc-600">No Img</span>}
                                                            {story.is_premium && (
                                                                <div className="absolute top-0 right-0 bg-amber-400 w-3 h-3 rounded-bl-lg shadow-sm" title="Premium" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-zinc-100">{story.title}</div>
                                                            <div className="text-xs text-zinc-500 font-mono mt-0.5 max-w-[120px] truncate">{story.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${story.category === 'sleep' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                        story.category === 'meditation' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                                                            story.category === 'fantasy' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                                'bg-zinc-800 text-zinc-400 border-zinc-700'
                                                        }`}>
                                                        {story.category}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center text-sm text-zinc-400 font-mono">
                                                    {Math.ceil(story.duration / 60)}:00
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex flex-col gap-1.5 items-center">
                                                        <button
                                                            onClick={() => togglePublished(story)}
                                                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-all ${story.is_published
                                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                                                : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-zinc-700'
                                                                }`}
                                                        >
                                                            {story.is_published ? 'Published' : 'Draft'}
                                                        </button>
                                                        <button
                                                            onClick={() => togglePremium(story)}
                                                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-all ${story.is_premium
                                                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                                                                : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-zinc-700'
                                                                }`}
                                                        >
                                                            {story.is_premium ? 'Premium' : 'Free'}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right pr-6">
                                                    <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        {story.cover_url && (
                                                            <a
                                                                href={story.cover_url}
                                                                download={`cover-${story.id}.png`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                                                                title="Download Cover for Veo"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                        <button
                                                            onClick={() => handleGenerateSocial(story)}
                                                            disabled={generatingIds.has(story.id)}
                                                            className={`p-2 rounded-lg transition ${generatingIds.has(story.id)
                                                                ? 'bg-violet-500/20 text-violet-300 cursor-wait'
                                                                : story.social_reel_url
                                                                    ? 'text-green-500 hover:bg-green-500/10'
                                                                    : 'text-zinc-500 hover:text-violet-400 hover:bg-violet-500/10'
                                                                }`}
                                                            title={story.social_reel_url ? "Regenerate Reel (Zoom)" : "Generate Social Reel (Zoom)"}
                                                        >
                                                            {generatingIds.has(story.id) ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                                                        </button>
                                                        <Link
                                                            href={`/admin/stories/editor?id=${story.id}`}
                                                            className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition"
                                                            title="Edit Story"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(story.id, story.title)}
                                                            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {filteredStories.length === 0 && (
                            <div className="p-20 text-center text-zinc-500 flex flex-col items-center">
                                <div className="text-4xl mb-4 opacity-20">📂</div>
                                <p>No stories found in this category.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* BULK ACTION BAR */}
                <AnimatePresence>
                    {selectedStoryIds.size > 0 && (
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="fixed bottom-0 inset-x-0 z-50 p-6 flex justify-center pointer-events-none"
                        >
                            <div className="bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl p-4 flex items-center gap-6 pointer-events-auto max-w-2xl w-full">
                                <div className="flex items-center gap-3 border-r border-zinc-800 pr-6">
                                    <div className="bg-violet-600 text-white text-xs font-bold px-2 py-1 rounded">
                                        {selectedStoryIds.size}
                                    </div>
                                    <span className="text-sm font-medium text-zinc-300">Selected</span>
                                </div>

                                <div className="flex items-center gap-2 flex-1">
                                    <button
                                        onClick={() => handleBulkAction('publish')}
                                        disabled={isBulkActionLoading}
                                        className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-bold transition border border-emerald-500/20"
                                    >
                                        Publish
                                    </button>
                                    <button
                                        onClick={() => handleBulkAction('unpublish')}
                                        disabled={isBulkActionLoading}
                                        className="px-4 py-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg text-sm font-medium transition"
                                    >
                                        Unpublish
                                    </button>
                                    <div className="w-px h-6 bg-zinc-800 mx-2" />
                                    <button
                                        onClick={() => handleBulkAction('premium')}
                                        disabled={isBulkActionLoading}
                                        className="px-4 py-2 hover:bg-amber-500/10 text-zinc-400 hover:text-amber-400 rounded-lg text-sm font-medium transition"
                                    >
                                        Set Premium
                                    </button>
                                    <button
                                        onClick={() => handleBulkAction('free')}
                                        disabled={isBulkActionLoading}
                                        className="px-4 py-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg text-sm font-medium transition"
                                    >
                                        Set Free
                                    </button>
                                </div>

                                <div className="pl-6 border-l border-zinc-800">
                                    <button
                                        onClick={() => handleBulkAction('delete')}
                                        disabled={isBulkActionLoading}
                                        className="p-2 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-lg transition"
                                        title="Delete Selected"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </AdminLayout>
        </AdminGuard>
    );
}
