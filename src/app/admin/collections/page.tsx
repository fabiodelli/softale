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
            <div className="min-h-screen bg-slate-900 text-white p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                                Collections Manager
                            </h1>
                            <p className="text-slate-400 mt-1">Curate playlists and emotional phases</p>
                        </div>
                        <div className="flex gap-4">
                            <Link href="/admin" className="px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition">
                                Back to Dashboard
                            </Link>
                            <button
                                onClick={handleCreate}
                                className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20"
                            >
                                + New Collection
                            </button>
                        </div>
                    </div>

                    {/* Status Bar */}
                    {status && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-emerald-500/10 text-emerald-400 p-4 rounded-lg mb-6 border border-emerald-500/20"
                        >
                            {status}
                        </motion.div>
                    )}

                    {/* List */}
                    <div className="bg-slate-800/50 rounded-xl border border-white/5 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-slate-400 uppercase text-xs">
                                <tr>
                                    <th className="p-4">Title</th>
                                    <th className="p-4">Slug</th>
                                    <th className="p-4 text-center">Featured</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading collections...</td></tr>
                                ) : collections.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">No collections found. Create one!</td></tr>
                                ) : (
                                    collections.map((collection) => (
                                        <tr key={collection.id} className="hover:bg-white/5 transition">
                                            <td className="p-4 font-medium text-white">{collection.title}</td>
                                            <td className="p-4 text-slate-400 font-mono text-sm">{collection.slug}</td>
                                            <td className="p-4 text-center">
                                                {collection.is_featured ? (
                                                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">Featured</span>
                                                ) : (
                                                    <span className="text-slate-600 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                {collection.is_published ? (
                                                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">Published</span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-slate-700 text-slate-400 rounded-full text-xs">Draft</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleEdit(collection)}
                                                    className="text-indigo-400 hover:text-white transition text-sm"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(collection.id, collection.title)}
                                                    className="text-rose-400 hover:text-white transition text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

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
