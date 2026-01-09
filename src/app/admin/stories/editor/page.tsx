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
    const [scriptText, setScriptText] = useState('');
    const [voiceId, setVoiceId] = useState('');
    const [audioPhasesJSON, setAudioPhasesJSON] = useState('[]'); // Editable JSON string
    const [isPremium, setIsPremium] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [isLoop, setIsLoop] = useState(false);

    // File State
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [wideFile, setWideFile] = useState<File | null>(null);
    const [tallFile, setTallFile] = useState<File | null>(null);

    const [existingAudioUrl, setExistingAudioUrl] = useState('');
    const [existingCoverUrl, setExistingCoverUrl] = useState('');
    const [existingWideUrl, setExistingWideUrl] = useState('');
    const [existingTallUrl, setExistingTallUrl] = useState('');

    // UI State
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    // Refs for file inputs
    const audioInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const wideInputRef = useRef<HTMLInputElement>(null);
    const tallInputRef = useRef<HTMLInputElement>(null);
    const audioPlayerRef = useRef<HTMLAudioElement>(null);

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
            setScriptText(data.script_text || '');
            setVoiceId(data.voice_id || '');
            setAudioPhasesJSON(JSON.stringify(data.audio_phases || [], null, 2));

            setIsPremium(data.is_premium || false);
            setIsPublished(data.is_published || false);
            setIsLoop(data.is_loop || false);

            setExistingAudioUrl(data.audio_url || '');
            setExistingCoverUrl(data.cover_url || '');
            setExistingWideUrl(data.cover_landscape_url || '');
            setExistingTallUrl(data.cover_portrait_url || '');

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
            let wideUrl = existingWideUrl;
            let tallUrl = existingTallUrl;

            // Generate a unique ID for new stories
            const newId = isEditMode ? storyId : crypto.randomUUID();

            // Helper for uploading
            const uploadFile = async (bucket: string, path: string, file: File, contentType: string) => {
                const { error } = await supabase!.storage
                    .from(bucket)
                    .upload(path, file, { upsert: true, contentType });
                if (error) throw error;
                const { data } = supabase!.storage.from(bucket).getPublicUrl(path);
                return `${data.publicUrl}?t=${Date.now()}`;
            };

            // Upload Audio
            if (audioFile) {
                setStatus('Uploading audio...');
                audioUrl = await uploadFile('audio', `stories/${newId}/audio.mp3`, audioFile, 'audio/mpeg');
            }

            // Upload Images
            if (coverFile) {
                setStatus('Uploading square cover...');
                coverUrl = await uploadFile('audio', `stories/${newId}/cover.png`, coverFile, 'image/png');
            }
            if (wideFile) {
                setStatus('Uploading wide cover...');
                wideUrl = await uploadFile('audio', `stories/${newId}/wide.png`, wideFile, 'image/png');
            }
            if (tallFile) {
                setStatus('Uploading tall cover...');
                tallUrl = await uploadFile('audio', `stories/${newId}/tall.png`, tallFile, 'image/png');
            }

            // Validate JSON
            let audioPhases = null;
            try {
                audioPhases = JSON.parse(audioPhasesJSON);
            } catch (e) {
                throw new Error('Invalid JSON in Audio Phases');
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
                cover_landscape_url: wideUrl,
                cover_portrait_url: tallUrl,
                script_text: scriptText,
                voice_id: voiceId || null,
                audio_phases: audioPhases,
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
            }, 1000);

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
            const audio = new Audio();
            audio.src = URL.createObjectURL(file);
            audio.onloadedmetadata = () => {
                setDuration(Math.round(audio.duration));
            };
        }
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => setCoverFile(e.target.files?.[0] || null);
    const handleWideChange = (e: React.ChangeEvent<HTMLInputElement>) => setWideFile(e.target.files?.[0] || null);
    const handleTallChange = (e: React.ChangeEvent<HTMLInputElement>) => setTallFile(e.target.files?.[0] || null);

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

                    <div className="mb-6 flex justify-end gap-2">
                        {existingAudioUrl && (
                            <div className="bg-slate-900 border border-white/10 rounded-lg p-3 flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Preview Audio</span>
                                <audio ref={audioPlayerRef} controls src={existingAudioUrl} className="h-8 w-64" />
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* LEFT COLUMN (Main Content) */}
                        <div className="lg:col-span-7 space-y-8">

                            {/* Script Editor */}
                            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <span>📜</span> Script & Narrative
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 font-medium text-lg"
                                            placeholder="Story Title"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={2}
                                            className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                                            placeholder="Short description..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Full Script Text</label>
                                        <textarea
                                            value={scriptText}
                                            onChange={(e) => setScriptText(e.target.value)}
                                            rows={12}
                                            className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-4 text-gray-300 font-mono text-sm focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                                            placeholder="Paste the full narration script here..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Audio Manager */}
                            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <span>🎙️</span> Audio Source
                                </h2>
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Access & Voice</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-1">Duration (Sec)</label>
                                                <input
                                                    type="number"
                                                    value={duration}
                                                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                                                    className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-1">Voice ID</label>
                                                <input
                                                    type="text"
                                                    value={voiceId}
                                                    onChange={(e) => setVoiceId(e.target.value)}
                                                    className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white font-mono text-xs"
                                                    placeholder="ElevenLabs ID"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Upload New Audio (MP3)</label>
                                        <input
                                            ref={audioInputRef}
                                            type="file"
                                            accept="audio/*"
                                            onChange={handleAudioChange}
                                            className="hidden"
                                        />
                                        <div
                                            onClick={() => audioInputRef.current?.click()}
                                            className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500/50 transition bg-slate-800/50"
                                        >
                                            {audioFile ? (
                                                <div className="text-indigo-400">
                                                    <span className="text-3xl">🎵</span>
                                                    <p className="mt-2 font-medium">{audioFile.name}</p>
                                                    <p className="text-xs text-gray-500">Ready to upload</p>
                                                </div>
                                            ) : (
                                                <div className="text-gray-500">
                                                    <span className="text-3xl opacity-50">☁️</span>
                                                    <p className="mt-2 text-sm">Click to upload new MP3</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN (Assets & Config) */}
                        <div className="lg:col-span-5 space-y-8">

                            {/* Image Assets */}
                            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <span>🖼️</span> Visual Assets
                                </h2>
                                <div className="space-y-6">
                                    {/* Square */}
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Square (1:1)</span>
                                            <span>Main Cover</span>
                                        </div>
                                        <div
                                            onClick={() => coverInputRef.current?.click()}
                                            className="relative aspect-square bg-slate-950 rounded-lg border border-white/10 overflow-hidden cursor-pointer hover:border-white/30 transition group"
                                        >
                                            <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                                            <img
                                                src={coverFile ? URL.createObjectURL(coverFile) : existingCoverUrl || 'https://via.placeholder.com/400?text=No+Cover'}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                                <span className="text-white text-xs font-bold uppercase tracking-widest border border-white px-3 py-1 rounded">Change</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Wide & Tall Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>Wide (16:9)</span>
                                            </div>
                                            <div
                                                onClick={() => wideInputRef.current?.click()}
                                                className="relative aspect-video bg-slate-950 rounded-lg border border-white/10 overflow-hidden cursor-pointer hover:border-white/30 transition group"
                                            >
                                                <input ref={wideInputRef} type="file" accept="image/*" onChange={handleWideChange} className="hidden" />
                                                <img
                                                    src={wideFile ? URL.createObjectURL(wideFile) : existingWideUrl || 'https://via.placeholder.com/400x225?text=No+Wide'}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                                    <span className="text-xs text-white">Edit</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>Tall (9:16)</span>
                                            </div>
                                            <div
                                                onClick={() => tallInputRef.current?.click()}
                                                className="relative aspect-[9/16] bg-slate-950 rounded-lg border border-white/10 overflow-hidden cursor-pointer hover:border-white/30 transition group"
                                            >
                                                <input ref={tallInputRef} type="file" accept="image/*" onChange={handleTallChange} className="hidden" />
                                                <img
                                                    src={tallFile ? URL.createObjectURL(tallFile) : existingTallUrl || 'https://via.placeholder.com/225x400?text=No+Tall'}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                                    <span className="text-xs text-white">Edit</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Settings & Config */}
                            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                                <h2 className="text-lg font-semibold mb-4">Configuration</h2>

                                <div className="space-y-4 mb-6">
                                    <label className="block text-sm text-gray-400">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                                        ))}
                                    </select>

                                    <div className="space-y-3 pt-2">
                                        <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-white/5">
                                            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="w-5 h-5 rounded bg-slate-800 text-emerald-500" />
                                            <div>
                                                <span className="text-white block text-sm font-medium">Published</span>
                                                <span className="text-xs text-gray-500">Visible in app</span>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-white/5">
                                            <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} className="w-5 h-5 rounded bg-slate-800 text-amber-500" />
                                            <div>
                                                <span className="text-white block text-sm font-medium">Premium Content</span>
                                                <span className="text-xs text-gray-500">Subscribers only</span>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-white/5">
                                            <input type="checkbox" checked={isLoop} onChange={(e) => setIsLoop(e.target.checked)} className="w-5 h-5 rounded bg-slate-800 text-indigo-500" />
                                            <div>
                                                <span className="text-white block text-sm font-medium">Loop / Backing</span>
                                                <span className="text-xs text-gray-500">Reusable audio asset</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2 font-mono">Audio Phases (JSON)</label>
                                    <textarea
                                        value={audioPhasesJSON}
                                        onChange={(e) => setAudioPhasesJSON(e.target.value)}
                                        rows={6}
                                        className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-xs font-mono text-green-400 focus:ring-1 focus:ring-green-500"
                                        placeholder='[{"phase": "arrival", "intensity": 0.5, "intent": "calm"}]'
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="sticky bottom-8">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-900/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {saving ? 'Saving...' : '💾 Save All Changes'}
                                </button>
                                <div className="mt-4 text-center">
                                    <Link href="/admin/stories" className="text-gray-500 hover:text-white text-sm transition">Cancel & Exit</Link>
                                </div>
                            </div>

                        </div>
                    </form>
                </main>
            </div>
        </AdminGuard>
    );
}
