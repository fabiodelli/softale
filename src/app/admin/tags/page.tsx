'use client';

import { useState, useEffect } from 'react';
import { getTagStats, mergeTags, TagStat } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';
import { Loader2, Search, Edit2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TagGardenerPage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [tags, setTags] = useState<TagStat[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Edit State
    const [editingTag, setEditingTag] = useState<TagStat | null>(null);
    const [mergeTarget, setMergeTarget] = useState('');
    const [isMerging, setIsMerging] = useState(false);

    // Filtered Tags
    const filteredTags = tags.filter(t =>
        t.tag.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const fetchTags = async () => {
        setLoading(true);
        const data = await getTagStats();
        setTags(data);
        setLoading(false);
    };

    useEffect(() => {
        if (!user) return; // Wait for auth
        fetchTags();
    }, [user]);

    const handleMerge = async () => {
        if (!editingTag || !mergeTarget) return;

        setIsMerging(true);
        const success = await mergeTags(editingTag.tag, mergeTarget);
        setIsMerging(false);

        if (success) {
            setEditingTag(null);
            setMergeTarget('');
            fetchTags(); // Refresh
        } else {
            alert('Failed to merge tags');
        }
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-1">Tag Gardener 🌱</h1>
                    <p className="text-slate-500">Prune and merge tags to keep the ecosystem healthy.</p>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none w-64"
                    />
                </div>
            </div>

            {/* Tag List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-8">Tag Name</div>
                    <div className="col-span-2 text-right">Usage Count</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                <div className="divide-y divide-slate-100">
                    {filteredTags.map((tag) => (
                        <motion.div
                            key={tag.tag}
                            layoutId={tag.tag}
                            className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors"
                        >
                            <div className="col-span-8 font-medium text-slate-700">
                                {tag.tag}
                            </div>
                            <div className="col-span-2 text-right">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tag.count > 10 ? 'bg-green-100 text-green-800' :
                                        tag.count > 3 ? 'bg-blue-100 text-blue-800' :
                                            'bg-slate-100 text-slate-600'
                                    }`}>
                                    {tag.count}
                                </span>
                            </div>
                            <div className="col-span-2 flex justify-end">
                                <button
                                    onClick={() => {
                                        setEditingTag(tag);
                                        setMergeTarget(tag.tag); // Default to self
                                    }}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    {filteredTags.length === 0 && (
                        <div className="p-8 text-center text-slate-400">
                            No tags found matching "{searchQuery}"
                        </div>
                    )}
                </div>
            </div>

            {/* Merge Modal */}
            {editingTag && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
                    >
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Tag</h2>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600 font-mono text-sm">
                                {editingTag.tag}
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300" />
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Rename / Merge To</label>
                                <input
                                    type="text"
                                    value={mergeTarget}
                                    onChange={(e) => setMergeTarget(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    If you enter an existing tag (e.g. "Relax"), this tag will be merged into it.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setEditingTag(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMerge}
                                disabled={isMerging || !mergeTarget.trim()}
                                className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
                            >
                                {isMerging && <Loader2 className="w-3 h-3 animate-spin" />}
                                {editingTag.tag === mergeTarget ? 'Save (No Change)' : 'Merge & Update'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
