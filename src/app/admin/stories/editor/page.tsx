'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminGuard from '@/components/admin/AdminGuard';
import Link from 'next/link';
import { supabase, type Story } from '@/lib/supabase';

// Categories available for stories
// Categories synced with Factory RECIPE_MATRIX
const CATEGORIES = [
    'sleep',
    'meditation',
    'fantasy',
    'kids',
    'motivation',
    'work_break',
    'nature',
    'soundscape',
    'music_instrumental',
    'binaural'
];

export default function StoryEditor() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const storyId = searchParams.get('id');
    const isEditMode = !!storyId;

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('sleep');
    const [duration, setDuration] = useState(120); // seconds
    const [isPremium, setIsPremium] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [isLoop, setIsLoop] = useState(false);

    // File State
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [existingAudioUrl, setExistingAudioUrl] = useState('');
    const [existingCoverUrl, setExistingCoverUrl] = useState('');

    // UI State
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    // Refs for file inputs
    const audioInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    // Load existing story if editing
    useEffect(() => {
        if (isEditMode && storyId) {
            loadStory(storyId);
        }
    }, [storyId, isEditMode]);

    const loadStory = async (id: string) => {
        setLoading(true);
        try {
            if (!supabase) throw new Error('Supabase not configured');
            const { data, error } = await supabase
                .from('stories')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) throw new Error('Story not found');

            // Populate form
            setTitle(data.title || '');
            setDescription(data.description || '');
            setCategory(data.category || 'sleep');
            setDuration(data.duration || 120);
            setIsPremium(data.is_premium || false);
            setIsPublished(data.is_published || false);
            setIsLoop(data.is_loop || false);
            setExistingAudioUrl(data.audio_url || '');
            setExistingCoverUrl(data.cover_url || '');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setStatus('');

        try {
            if (!supabase) throw new Error('Supabase not configured');
            if (!title.trim()) throw new Error('Title is required');

            let audioUrl = existingAudioUrl;
            let coverUrl = existingCoverUrl;

            // Generate a unique ID for new stories
            const newId = isEditMode ? storyId : crypto.randomUUID();

            // Upload Audio if new file selected
            if (audioFile) {
                setStatus('Uploading audio...');
                const audioFileName = `stories/${newId}/audio.mp3`;
                const { error: uploadError } = await supabase.storage
                    .from('audio')
                    .upload(audioFileName, audioFile, { upsert: true, contentType: 'audio/mpeg' });

                if (uploadError) throw new Error(`Audio upload failed: ${uploadError.message}`);

                const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(audioFileName);
                audioUrl = publicUrl;
            }

            // Upload Cover if new file selected
            if (coverFile) {
                setStatus('Uploading cover...');
                const coverFileName = `stories/${newId}/cover.png`;
                const { error: uploadError } = await supabase.storage
                    .from('audio')
                    .upload(coverFileName, coverFile, { upsert: true, contentType: 'image/png' });

                if (uploadError) throw new Error(`Cover upload failed: ${uploadError.message}`);

                const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(coverFileName);
                // Add cache buster to force browser to fetch new image
                coverUrl = `${publicUrl}?t=${Date.now()}`;
            }

            // Prepare story data
            const storyData = {
                title: title.trim(),
                description: description.trim(),
                category,
                duration,
                is_premium: isPremium,
                is_published: isPublished,
                is_loop: isLoop,
                audio_url: audioUrl,
                cover_url: coverUrl,
                updated_at: new Date().toISOString()
            };

            setStatus('Saving to database...');

            if (isEditMode) {
                // Update existing
                const { error: updateError } = await supabase
                    .from('stories')
                    .update(storyData)
                    .eq('id', storyId);

                if (updateError) throw updateError;
                setStatus('✅ Story updated successfully!');
            } else {
                // Insert new
                const { error: insertError } = await supabase
                    .from('stories')
                    .insert({ id: newId, ...storyData, created_at: new Date().toISOString() });

                if (insertError) throw insertError;
                setStatus('✅ Story created successfully!');
            }

            // Redirect after short delay
            setTimeout(() => {
                router.push('/admin/stories');
            }, 1500);

        } catch (err: any) {
            console.error('Save failed:', err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAudioFile(file);
            // Auto-detect duration
            const audio = new Audio();
            audio.src = URL.createObjectURL(file);
            audio.onloadedmetadata = () => {
                setDuration(Math.round(audio.duration));
            };
        }
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverFile(file);
        }
    };

    if (loading) {
        return (
            <AdminGuard>
                <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                    Loading story...
                </div>
            </AdminGuard>
        );
    }

    return (
        <AdminGuard>
            <div className="min-h-screen bg-slate-950 pb-20 text-white">
                <header className="bg-slate-900 border-b border-white/5 sticky top-0 z-40">
                    <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link href="/admin/stories" className="text-gray-400 hover:text-white">← Back</Link>
                            <h1 className="text-xl font-bold ml-4">
                                {isEditMode ? 'Edit Story' : 'Create New Story'}
                            </h1>
                        </div>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-4 py-8">
                    {/* Status Messages */}
                    {status && (
                        <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            {status}
                        </div>
                    )}
                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Info */}
                        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Title *</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Enter story title..."
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                        placeholder="Brief description of the story..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Duration (seconds)</label>
                                        <input
                                            type="number"
                                            value={duration}
                                            onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            min={1}
                                        />
                                        <span className="text-xs text-gray-500 mt-1">{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* File Uploads */}
                        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold mb-4">Media Files</h2>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Audio Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Audio File (MP3)</label>
                                    <input
                                        ref={audioInputRef}
                                        type="file"
                                        accept="audio/*"
                                        onChange={handleAudioChange}
                                        className="hidden"
                                    />
                                    <div
                                        onClick={() => audioInputRef.current?.click()}
                                        className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500/50 transition"
                                    >
                                        {audioFile ? (
                                            <div className="text-indigo-400">
                                                <span className="text-2xl">🎵</span>
                                                <p className="mt-2 text-sm">{audioFile.name}</p>
                                            </div>
                                        ) : existingAudioUrl ? (
                                            <div className="text-emerald-400">
                                                <span className="text-2xl">✓</span>
                                                <p className="mt-2 text-sm">Audio uploaded</p>
                                                <p className="text-xs text-gray-500 mt-1">Click to replace</p>
                                            </div>
                                        ) : (
                                            <div className="text-gray-500">
                                                <span className="text-2xl">📁</span>
                                                <p className="mt-2 text-sm">Click to upload audio</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Cover Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Cover Image</label>
                                    <input
                                        ref={coverInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleCoverChange}
                                        className="hidden"
                                    />
                                    <div
                                        onClick={() => coverInputRef.current?.click()}
                                        className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500/50 transition relative overflow-hidden"
                                    >
                                        {coverFile ? (
                                            <img
                                                src={URL.createObjectURL(coverFile)}
                                                alt="Preview"
                                                className="absolute inset-0 w-full h-full object-cover opacity-50"
                                            />
                                        ) : existingCoverUrl ? (
                                            <img
                                                src={existingCoverUrl}
                                                alt="Existing cover"
                                                className="absolute inset-0 w-full h-full object-cover opacity-50"
                                            />
                                        ) : null}
                                        <div className="relative z-10">
                                            {coverFile ? (
                                                <div className="text-indigo-400">
                                                    <span className="text-2xl">🖼️</span>
                                                    <p className="mt-2 text-sm">{coverFile.name}</p>
                                                </div>
                                            ) : existingCoverUrl ? (
                                                <div className="text-emerald-400">
                                                    <span className="text-2xl">✓</span>
                                                    <p className="mt-2 text-sm">Cover uploaded</p>
                                                    <p className="text-xs text-gray-500 mt-1">Click to replace</p>
                                                </div>
                                            ) : (
                                                <div className="text-gray-500">
                                                    <span className="text-2xl">🖼️</span>
                                                    <p className="mt-2 text-sm">Click to upload cover</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Settings */}
                        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold mb-4">Settings</h2>

                            <div className="space-y-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isLoop}
                                        onChange={(e) => setIsLoop(e.target.checked)}
                                        className="w-5 h-5 rounded bg-slate-800 border-white/10 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <span className="text-white">Mark as Loop (Component)</span>
                                        <p className="text-xs text-gray-500">Enable if this is a reusable backing track, not a finished story.</p>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isPremium}
                                        onChange={(e) => setIsPremium(e.target.checked)}
                                        className="w-5 h-5 rounded bg-slate-800 border-white/10 text-amber-600 focus:ring-amber-500"
                                    />
                                    <div>
                                        <span className="text-white">Premium Content ⭐</span>
                                        <p className="text-xs text-gray-500">Only accessible to subscribers.</p>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isPublished}
                                        onChange={(e) => setIsPublished(e.target.checked)}
                                        className="w-5 h-5 rounded bg-slate-800 border-white/10 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <div>
                                        <span className="text-white">Published</span>
                                        <p className="text-xs text-gray-500">Make visible to users on the app.</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-4">
                            <Link
                                href="/admin/stories"
                                className="px-6 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : isEditMode ? 'Update Story' : 'Create Story'}
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        </AdminGuard>
    );
}
