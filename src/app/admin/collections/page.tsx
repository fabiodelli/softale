'use client';

import { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import Link from 'next/link';
import { getAllCollections, deleteCollection, type Collection } from '@/lib/supabase';
import { motion } from 'framer-motion';
import CollectionEditor from './components/CollectionEditor'; // Component we will build next

export default function CollectionsManager() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

    useEffect(() => {
        fetchCollections();
    }, []);

    const fetchCollections = async () => {
        setLoading(true);
        const data = await getAllCollections();
        setCollections(data);
        setLoading(false);
    };

    const handleCreate = () => {
        setEditingCollection(null);
        setIsEditorOpen(true);
    };

    const handleEdit = (collection: Collection) => {
        setEditingCollection(collection);
        setIsEditorOpen(true);
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
        const success = await deleteCollection(id);
        if (success) {
            setCollections(collections.filter(c => c.id !== id));
            setStatus(`Deleted "${title}"`);
        } else {
            setStatus('Failed to delete collection.');
        }
    };

    const handleSaveComplete = () => {
        setIsEditorOpen(false);
        fetchCollections(); // Refresh list
        setStatus('Collection saved successfully.');
    };

    return (
        <AdminGuard>
            <div className="min-h-screen bg-slate-950 pb-20 text-white font-sans">
                {/* Header */}
                <header className="bg-slate-900 border-b border-white/5 sticky top-0 z-40 shadow-sm">
                    <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link href="/admin" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-sm font-medium">
                                <span>←</span> Back
                            </Link>
                            <div className="h-6 w-px bg-white/10 mx-4" />
                            <h1 className="text-xl font-bold tracking-tight">Collections Manager</h1>
                        </div>
                        <button
                            onClick={handleCreate}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20 transition transform active:scale-95"
                        >
                            + New Collection
                        </button>
                    </div>
                </header>

                <main className="max-w-[1600px] mx-auto px-6 py-8">
                    {/* Status Bar */}
                    {status && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-emerald-500/10 text-emerald-400 px-4 py-3 rounded-lg mb-6 border border-emerald-500/20 flex items-center gap-2"
                        >
                            <span>✓</span> {status}
                        </motion.div>
                    )}

                    {/* List */}
                    <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-800/50 border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider font-medium">
                                <tr>
                                    <th className="p-4 pl-6">Collection</th>
                                    <th className="p-4">Slug</th>
                                    <th className="p-4 text-center">Featured</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-right pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-12 text-center text-gray-500">Loading collections...</td></tr>
                                ) : collections.length === 0 ? (
                                    <tr><td colSpan={5} className="p-12 text-center text-gray-500">No collections found. Create one!</td></tr>
                                ) : (
                                    collections.map((collection) => (
                                        <tr key={collection.id} className="hover:bg-slate-800/30 transition group">
                                            <td className="p-4 pl-6 font-medium text-white flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-white/5 flex items-center justify-center text-xs">📂</div>
                                                {collection.title}
                                            </td>
                                            <td className="p-4 text-gray-500 font-mono text-xs">{collection.slug}</td>
                                            <td className="p-4 text-center">
                                                {collection.is_featured ? (
                                                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">Featured</span>
                                                ) : (
                                                    <span className="text-gray-700 text-xs">•</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                {collection.is_published ? (
                                                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">Published</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-slate-700/50 text-gray-400 border border-white/5 rounded-full text-[10px] font-bold uppercase tracking-wider">Draft</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right pr-6 space-x-2 opacity-60 group-hover:opacity-100 transition">
                                                <button
                                                    onClick={() => handleEdit(collection)}
                                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs font-medium transition text-indigo-300 hover:text-white"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(collection.id, collection.title)}
                                                    className="p-1.5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded transition"
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </main>

                {/* Editor Modal */}
                {isEditorOpen && (
                    <CollectionEditor
                        collection={editingCollection}
                        onClose={() => setIsEditorOpen(false)}
                        onSave={handleSaveComplete}
                    />
                )}
            </div>
        </AdminGuard>
    );
}
