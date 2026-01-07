'use client';

import { useState, useEffect } from 'react';
import {
    type Collection, type Story,
    createCollection, updateCollection,
    getStories, getCollectionStoriesForAdmin,
    addStoryToCollection, removeStoryFromCollection
} from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    collection: Collection | null;
    onClose: () => void;
    onSave: () => void;
}

export default function CollectionEditor({ collection, onClose, onSave }: Props) {
    // Form State
    const [title, setTitle] = useState(collection?.title || '');
    const [slug, setSlug] = useState(collection?.slug || '');
    const [description, setDescription] = useState(collection?.description || '');
    const [category, setCategory] = useState(collection?.category || '');
    const [isFeatured, setIsFeatured] = useState(collection?.is_featured || false);
    const [isPublished, setIsPublished] = useState(collection?.is_published || false);

    // Story Management State
    const [allStories, setAllStories] = useState<Story[]>([]);
    const [selectedStories, setSelectedStories] = useState<{ story_id: string, sort_order: number, stories: Story }[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    // Auto-slug
    useEffect(() => {
        if (!collection && title) {
            setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
        }
    }, [title, collection]);

    const loadData = async () => {
        setLoading(true);
        // Load all stories for the picker
        const stories = await getStories(undefined, true); // include unpublished
        setAllStories(stories);

        // If editing, load existing stories in this collection
        if (collection) {
            const existingLinks = await getCollectionStoriesForAdmin(collection.id);
            // existingLinks has structure: { collection_id, story_id, sort_order, stories: {...} }
            setSelectedStories(existingLinks);
        }
        setLoading(false);
    };

    const handleAddStory = (story: Story) => {
        if (selectedStories.find(s => s.story_id === story.id)) return;

        const newLink = {
            story_id: story.id,
            sort_order: selectedStories.length, // Append to end
            stories: story
        };
        setSelectedStories([...selectedStories, newLink]);
    };

    const handleRemoveStory = (storyId: string) => {
        setSelectedStories(selectedStories.filter(s => s.story_id !== storyId));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let collectionId = collection?.id;

            // 1. Save Collection Metadata
            const payload = { title, slug, description, category: category || undefined, is_featured: isFeatured, is_published: isPublished };

            if (collection) {
                const success = await updateCollection(collection.id, payload);
                if (!success) throw new Error('Failed to update collection');
            } else {
                const newCol = await createCollection(payload);
                if (!newCol) throw new Error('Failed to create collection');
                collectionId = newCol.id;
            }

            if (!collectionId) throw new Error('No ID found');

            // 2. Sync Stories (Strategy: Nuke & Re-add is simplest, but expensive. 
            // Better: Diffing. For MVP, we likely just "ADD" missing and "REMOVE" deleted.
            // BUT, Supabase insert upsert?
            // Actually, we must manage the junction table.

            // To respect SORT ORDER, we basically have to update everyone's sort_order.
            // Simplest robust way for MVP: 
            // - Get current DB links.
            // - Compare with needed links.
            // - Delete removed ones.
            // - Insert/Update (upsert) all current ones with new sort_order.

            // NOTE: Since we don't have bulk upsert exposed easily in our lib helpers, 
            // and N is small (<50), we can loop. It's slower but fine for Admin.

            // 2a. Remove deleted
            if (collection) {
                const currentLinks = await getCollectionStoriesForAdmin(collectionId);
                const currentIds = currentLinks.map(l => l.story_id);
                const newIds = selectedStories.map(s => s.story_id);

                const toDelete = currentIds.filter(id => !newIds.includes(id));
                for (const id of toDelete) {
                    await removeStoryFromCollection(collectionId, id);
                }
            }

            // 2b. Upsert all (to update sort_order)
            // We use remove+add or just add? addStoryToCollection does simple insert. 
            // We need a helper for 'upsert' or we rely on 'remove' then 'add'.
            // For now, let's just loop and add (ignoring errors if exists? No, duplicate key error).
            // Better: Remove ALL and re-add ALL? A bit brutal but guarantees order.

            if (collection) {
                // For update, let's be safe. Delete all current relations for this collection?
                // That's tricky if huge. But for <100, fine.
                // Actually, let's allow duplicates? No primary key is (collection, story).

                // Let's use our helper: we assume the user might have changed orders.
                // The cleanest MVP approach without bulk helper:
                // Loop selectedStories. For each, try remove then add? Or just upsert?

                // Let's rely on the fact we already deleted *removed* stories.
                // Now strictly update `sort_order` for existing?
                // Our lib `addStoryToCollection` does INSERT. It will fail if exists.
                // Recommendation: Just recreate the relationships. It's fast enough.

                // First, wipe clean (safest for sorting sync)
                // NOTE: `removeStoryFromCollection` deletes 1 by 1. 
                // We don't have `clearCollection`. 
                // Let's Iterate.

                // To avoid complex diff logic in MVP:
                const currentLinks = await getCollectionStoriesForAdmin(collectionId);
                for (const link of currentLinks) {
                    await removeStoryFromCollection(collectionId, link.story_id);
                }
            }

            // Add all freshly
            for (let i = 0; i < selectedStories.length; i++) {
                await addStoryToCollection(collectionId, selectedStories[i].story_id, i);
            }

            onSave();
        } catch (e) {
            console.error(e);
            alert('Error saving. Check console.');
        }
        setSaving(false);
    };

    const moveStory = (index: number, direction: -1 | 1) => {
        const newStories = [...selectedStories];
        if (index + direction < 0 || index + direction >= newStories.length) return;

        const temp = newStories[index];
        newStories[index] = newStories[index + direction];
        newStories[index + direction] = temp;
        setSelectedStories(newStories);
    };

    const filteredAvailable = allStories.filter(s =>
        !selectedStories.find(sel => sel.story_id === s.id) &&
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">
                        {collection ? 'Edit Collection' : 'New Collection'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left: Metadata */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-slate-500 font-bold tracking-wider">Title</label>
                            <input
                                value={title} onChange={e => setTitle(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:ring-2 ring-indigo-500 outline-none"
                                placeholder="e.g. Morning Rituals"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-slate-500 font-bold tracking-wider">Slug (URL)</label>
                            <input
                                value={slug} onChange={e => setSlug(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-slate-400 font-mono text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-slate-500 font-bold tracking-wider">Description</label>
                            <textarea
                                value={description} onChange={e => setDescription(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white h-32 resize-none"
                                placeholder="What is this collection about?"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-slate-500 font-bold tracking-wider">Category</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:ring-2 ring-indigo-500 outline-none"
                            >
                                <option value="">No category (always visible)</option>
                                <option value="sleep">🌙 Sleep</option>
                                <option value="meditation">🧘 Meditation</option>
                                <option value="fantasy">🌟 Fantasy</option>
                                <option value="nature">🌿 Nature</option>
                                <option value="soundscape">🌊 Soundscape (Loopable)</option>
                                <option value="frequencies">🔮 Frequencies (Loopable)</option>
                                <option value="music_instrumental">🎵 Instrumental (Loopable)</option>
                                <option value="work_break">☕ Work Break</option>
                                <option value="motivation">⚡ Motivation</option>
                                <option value="kids">🧸 Kids</option>
                            </select>
                        </div>
                        <div className="flex gap-4 pt-4 border-t border-white/5">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-600 bg-slate-700 text-indigo-600"
                                />
                                <span className="text-white">Featured on Home</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isPublished} onChange={e => setIsPublished(e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-600 bg-slate-700 text-emerald-600"
                                />
                                <span className="text-white">Published</span>
                            </label>
                        </div>
                    </div>

                    {/* Middle: Selected Stories (Reorderable) */}
                    <div className="bg-slate-800/30 rounded-xl border border-white/5 flex flex-col h-[500px]">
                        <div className="p-4 border-b border-white/5 bg-slate-800 text-xs uppercase font-bold text-indigo-400">
                            Stories in Collection ({selectedStories.length})
                        </div>
                        <div className="flex-1 overflow-auto p-2 space-y-2">
                            {selectedStories.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-slate-600 text-sm italic p-4 text-center">
                                    No stories yet. Add from the right →
                                </div>
                            ) : (
                                selectedStories.map((item, index) => (
                                    <div key={item.story_id} className="bg-slate-700 p-3 rounded flex items-center gap-3 group">
                                        <div className="flex flex-col gap-0.5 text-slate-500">
                                            <button
                                                onClick={() => moveStory(index, -1)}
                                                disabled={index === 0}
                                                className="hover:text-white disabled:opacity-30"
                                            >▲</button>
                                            <button
                                                onClick={() => moveStory(index, 1)}
                                                disabled={index === selectedStories.length - 1}
                                                className="hover:text-white disabled:opacity-30"
                                            >▼</button>
                                        </div>
                                        <div className="w-8 h-8 bg-slate-600 rounded overflow-hidden flex-shrink-0">
                                            {item.stories?.cover_url && <img src={item.stories.cover_url} className="w-full h-full object-cover" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-white truncate">{item.stories?.title || 'Unknown Title'}</div>
                                            <div className="text-xs text-slate-400 capitalize">{item.stories?.category}</div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveStory(item.story_id)}
                                            className="text-slate-500 hover:text-rose-400 px-2"
                                        >✕</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right: Available Stories */}
                    <div className="bg-slate-800/30 rounded-xl border border-white/5 flex flex-col h-[500px]">
                        <div className="p-4 border-b border-white/5 bg-slate-800 text-xs uppercase font-bold text-cyan-400">
                            Available Library
                        </div>
                        <div className="p-2 border-b border-white/5">
                            <input
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search stories..."
                                className="w-full bg-slate-900 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:ring-1 ring-cyan-500 outline-none"
                            />
                        </div>
                        <div className="flex-1 overflow-auto p-2 space-y-2">
                            {loading ? (
                                <div className="text-center p-4 text-slate-500">Loading library...</div>
                            ) : (
                                filteredAvailable.map(story => (
                                    <div key={story.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded transition cursor-pointer" onClick={() => handleAddStory(story)}>
                                        <div className="w-8 h-8 bg-slate-700 rounded overflow-hidden flex-shrink-0">
                                            {story.cover_url ? <img src={story.cover_url} className="w-full h-full object-cover" /> : null}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-slate-200 truncate">{story.title}</div>
                                            <div className="text-xs text-slate-500 capitalize">{story.category}</div>
                                        </div>
                                        <div className="text-cyan-400 text-lg opacity-0 group-hover:opacity-100 hover:opacity-100">+</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-slate-900/50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg text-slate-400 hover:bg-white/5 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !title}
                        className="px-6 py-2 bg-indigo-600 rounded-lg text-white font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : 'Save Collection'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
