'use client';

import { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import { AdminLayout, AdminButton, AdminBadge } from '@/components/admin/AdminLayout';
import Link from 'next/link';
import { getAllCollections, deleteCollection, type Collection } from '@/lib/supabase';
import { motion } from 'framer-motion';
import CollectionEditor from './components/CollectionEditor';
import { FolderPlus, Trash2, Edit2, Star } from 'lucide-react';

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
            <AdminLayout
                title="Collections Manager"
                subtitle="Organize stories into curated playlists"
                backLink={{ href: '/admin', label: 'Dashboard' }}
                actions={
                    <AdminButton onClick={handleCreate}>
                        <FolderPlus className="w-4 h-4" />
                        New Collection
                    </AdminButton>
                }
            >
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
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wider font-medium">
                            <tr>
                                <th className="p-4 pl-6">Collection</th>
                                <th className="p-4">Slug</th>
                                <th className="p-4 text-center">Featured</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-zinc-500">
                                        <div className="flex flex-col items-center">
                                            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-2" />
                                            Loading collections...
                                        </div>
                                    </td>
                                </tr>
                            ) : collections.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center text-zinc-500">No collections found. Create one!</td></tr>
                            ) : (
                                collections.map((collection) => (
                                    <tr key={collection.id} className="hover:bg-zinc-800/50 transition group">
                                        <td className="p-4 pl-6 font-medium text-zinc-200 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg shadow-sm">
                                                📁
                                            </div>
                                            <div>
                                                <div className="font-semibold">{collection.title}</div>
                                                <div className="text-xs text-zinc-500 mt-0.5 max-w-[200px] truncate">{collection.description}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-zinc-500 font-mono text-xs">{collection.slug}</td>
                                        <td className="p-4 text-center">
                                            {collection.is_featured ? (
                                                <AdminBadge variant="warning">
                                                    <Star className="w-3 h-3 mr-1" fill="currentColor" /> Featured
                                                </AdminBadge>
                                            ) : (
                                                <span className="text-zinc-700 text-xs">•</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {collection.is_published ? (
                                                <AdminBadge variant="success">Published</AdminBadge>
                                            ) : (
                                                <AdminBadge variant="default">Draft</AdminBadge>
                                            )}
                                        </td>
                                        <td className="p-4 text-right pr-6 space-x-2">
                                            <button
                                                onClick={() => handleEdit(collection)}
                                                className="p-2 text-zinc-400 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(collection.id, collection.title)}
                                                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Editor Modal */}
                {isEditorOpen && (
                    <CollectionEditor
                        collection={editingCollection}
                        onClose={() => setIsEditorOpen(false)}
                        onSave={handleSaveComplete}
                    />
                )}
            </AdminLayout>
        </AdminGuard>
    );
}
