'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminGuard from '@/components/admin/AdminGuard';
import { AdminLayout, AdminButton } from '@/components/admin/AdminLayout'; // Import unified layout
import Link from 'next/link';
import { Download } from 'lucide-react';
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
                <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        <div>Loading editor...</div>
                    </div>
                </div>
            </AdminGuard>
        );
    }

    return (
        <AdminGuard>
            <AdminLayout
                title={isEditMode ? 'Edit Story' : 'Create New Story'}
                subtitle={isEditMode ? 'Modify existing story details and assets' : 'Configure a new sleep story from scratch'}
                backLink={{ href: '/admin/stories', label: 'Back to Stories' }}
            >
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

                {/* Preview Audio Moved to Audio Manager */}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* LEFT COLUMN (Main Content) */}
                    <div className="lg:col-span-7 space-y-10">

                        {/* Explicit Back Button (Redundant for better visibility) */}
                        <div className="lg:hidden">
                            <Link href="/admin/stories">
                                <button type="button" className="flex items-center gap-2 text-zinc-400 hover:text-white transition group py-2">
                                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center group-hover:border-zinc-500">
                                        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </div>
                                    <span className="font-medium">Back to Stories</span>
                                </button>
                            </Link>
                        </div>

                        {/* Script Editor */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 shadow-sm">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-zinc-50 border-b border-zinc-800 pb-4">
                                <span className="text-2xl">📜</span> Script & Narrative
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-4 text-white focus:ring-2 focus:ring-violet-500 font-bold text-xl placeholder-zinc-600 transition"
                                        placeholder="Story Title"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-4 text-white focus:ring-2 focus:ring-violet-500 resize-none text-base placeholder-zinc-600 transition"
                                        placeholder="Short description..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Full Script Text</label>
                                    <textarea
                                        value={scriptText}
                                        onChange={(e) => setScriptText(e.target.value)}
                                        rows={16}
                                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-5 py-5 text-zinc-300 font-mono text-sm focus:ring-2 focus:ring-violet-500 leading-relaxed placeholder-zinc-700 transition"
                                        placeholder="Paste the full narration script here..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Audio Manager */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 shadow-sm">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-zinc-50 border-b border-zinc-800 pb-4">
                                <span className="text-2xl">🎙️</span> Master Audio Source
                            </h2>
                            <div className="mb-6 bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 flex gap-3">
                                <div className="text-2xl">ℹ️</div>
                                <div>
                                    <h4 className="font-bold text-violet-300 text-sm">Factory Mix Strategy</h4>
                                    <p className="text-xs text-violet-200/70 mt-1 leading-relaxed">
                                        This file contains the final mix (Voice + Background Music). The background track is baked into this MP3 during the build process.
                                    </p>
                                </div>
                            </div>

                            {/* Preview Player */}
                            {existingAudioUrl && (
                                <div className="mb-8 bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                            <span>🔊</span> Current Audio Track
                                        </span>
                                        <span className="text-xs text-zinc-600 font-mono select-all">{existingAudioUrl.split('/').pop()}</span>
                                    </div>
                                    <audio ref={audioPlayerRef} controls src={existingAudioUrl} className="w-full h-10 rounded-lg" />
                                </div>
                            )}
                            <div className="grid grid-cols-1 gap-8">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Access & Voice</label>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs text-zinc-500 block mb-1.5 uppercase font-bold tracking-wider">Duration (Sec)</label>
                                            <input
                                                type="number"
                                                value={duration}
                                                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 block mb-1.5 uppercase font-bold tracking-wider">Voice ID</label>
                                            <input
                                                type="text"
                                                value={voiceId}
                                                onChange={(e) => setVoiceId(e.target.value)}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
                                                placeholder="ElevenLabs ID"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Upload New Audio (MP3)</label>
                                    <input
                                        ref={audioInputRef}
                                        type="file"
                                        accept="audio/*"
                                        onChange={handleAudioChange}
                                        className="hidden"
                                    />
                                    <div
                                        onClick={() => audioInputRef.current?.click()}
                                        className="group border-2 border-dashed border-zinc-800 rounded-2xl p-10 text-center cursor-pointer hover:border-violet-500/50 hover:bg-zinc-800/30 transition bg-zinc-900/20"
                                    >
                                        {audioFile ? (
                                            <div className="text-violet-400">
                                                <span className="text-4xl block mb-3">🎵</span>
                                                <p className="font-bold text-lg text-white">{audioFile.name}</p>
                                                <p className="text-sm text-zinc-500 mt-1">Ready to upload</p>
                                            </div>
                                        ) : (
                                            <div className="text-zinc-500 group-hover:text-zinc-400 transition">
                                                <span className="text-4xl block mb-3 opacity-30 group-hover:opacity-60 transition">☁️</span>
                                                <p className="font-medium text-lg">Click to upload new MP3</p>
                                                <p className="text-sm opacity-50 mt-1">Supports .mp3, .wav</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (Assets & Config) */}
                    <div className="lg:col-span-5 space-y-10">

                        {/* Image Assets */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 shadow-sm">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-zinc-50 border-b border-zinc-800 pb-4">
                                <span className="text-2xl">🖼️</span> Visual Assets
                            </h2>
                            <div className="space-y-8">
                                {/* Square */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">
                                        <span>Square (1:1)</span>
                                        <span className="text-violet-400">Main Cover</span>
                                    </div>
                                    <div
                                        onClick={() => coverInputRef.current?.click()}
                                        className="relative aspect-square bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden cursor-pointer hover:border-zinc-600 transition group shadow-lg"
                                    >
                                        <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                                        <img
                                            src={coverFile ? URL.createObjectURL(coverFile) : existingCoverUrl || 'https://via.placeholder.com/400?text=No+Cover'}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition backdrop-blur-sm gap-2">
                                            <span className="text-white text-xs font-bold uppercase tracking-widest border border-white/50 px-4 py-2 rounded-full hover:bg-white hover:text-black transition">Change</span>
                                            {existingCoverUrl && (
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <a
                                                        href={existingCoverUrl}
                                                        download={`cover_square_${storyId || 'new'}.png`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black hover:bg-violet-400 border border-white/50"
                                                        title="Download"
                                                    >
                                                        <Download size={14} />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Wide & Tall Grid */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <div className="flex justify-between text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">
                                            <span>Wide (16:9)</span>
                                        </div>
                                        <div
                                            onClick={() => wideInputRef.current?.click()}
                                            className="relative aspect-video bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden cursor-pointer hover:border-zinc-600 transition group shadow-md"
                                        >
                                            <input ref={wideInputRef} type="file" accept="image/*" onChange={handleWideChange} className="hidden" />
                                            <img
                                                src={wideFile ? URL.createObjectURL(wideFile) : existingWideUrl || 'https://via.placeholder.com/400x225?text=No+Wide'}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition backdrop-blur-sm gap-2">
                                                <span className="text-xs text-white font-bold border border-white/30 px-2 py-1 rounded">Edit</span>
                                                {existingWideUrl && (
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <a
                                                            href={existingWideUrl}
                                                            download={`cover_wide_${storyId || 'new'}.png`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black hover:bg-violet-400 border border-white/50"
                                                            title="Download"
                                                        >
                                                            <Download size={12} />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">
                                            <span>Tall (9:16)</span>
                                        </div>
                                        <div
                                            onClick={() => tallInputRef.current?.click()}
                                            className="relative aspect-[9/16] bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden cursor-pointer hover:border-zinc-600 transition group shadow-md"
                                        >
                                            <input ref={tallInputRef} type="file" accept="image/*" onChange={handleTallChange} className="hidden" />
                                            <img
                                                src={tallFile ? URL.createObjectURL(tallFile) : existingTallUrl || 'https://via.placeholder.com/225x400?text=No+Tall'}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition backdrop-blur-sm gap-2">
                                                <span className="text-xs text-white font-bold border border-white/30 px-2 py-1 rounded">Edit</span>
                                                {existingTallUrl && (
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <a
                                                            href={existingTallUrl}
                                                            download={`cover_tall_${storyId || 'new'}.png`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black hover:bg-violet-400 border border-white/50"
                                                            title="Download"
                                                        >
                                                            <Download size={12} />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Settings & Config */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 shadow-sm">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-zinc-100 border-b border-zinc-800 pb-4">
                                <span className="text-2xl">⚙️</span> Configuration
                            </h2>

                            <div className="space-y-6 mb-8">
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 font-medium"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <label className="flex items-center gap-4 cursor-pointer p-3 rounded-xl hover:bg-zinc-800/50 transition border border-transparent hover:border-zinc-800">
                                        <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="w-6 h-6 rounded bg-zinc-900 text-emerald-500 border-zinc-700 focus:ring-offset-0 focus:ring-emerald-500/20" />
                                        <div>
                                            <span className="text-white block text-base font-bold">Published</span>
                                            <span className="text-xs text-zinc-500">Visible in app</span>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-4 cursor-pointer p-3 rounded-xl hover:bg-zinc-800/50 transition border border-transparent hover:border-zinc-800">
                                        <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} className="w-6 h-6 rounded bg-zinc-900 text-amber-500 border-zinc-700 focus:ring-offset-0 focus:ring-amber-500/20" />
                                        <div>
                                            <span className="text-white block text-base font-bold">Premium Content</span>
                                            <span className="text-xs text-zinc-500">Subscribers only</span>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-4 cursor-pointer p-3 rounded-xl hover:bg-zinc-800/50 transition border border-transparent hover:border-zinc-800">
                                        <input type="checkbox" checked={isLoop} onChange={(e) => setIsLoop(e.target.checked)} className="w-6 h-6 rounded bg-zinc-900 text-indigo-500 border-zinc-700 focus:ring-offset-0 focus:ring-indigo-500/20" />
                                        <div>
                                            <span className="text-white block text-base font-bold">Loop / Backing</span>
                                            <span className="text-xs text-zinc-500">Reusable audio asset</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-zinc-500 mb-2 uppercase tracking-wider font-mono">Audio Phases (JSON)</label>
                                <textarea
                                    value={audioPhasesJSON}
                                    onChange={(e) => setAudioPhasesJSON(e.target.value)}
                                    rows={8}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-xs font-mono text-green-400 focus:ring-1 focus:ring-green-500 leading-normal"
                                    placeholder='[{"phase": "arrival", "intensity": 0.5, "intent": "calm"}]'
                                />
                            </div>
                        </div>



                    </div>

                    {/* Footer Actions - Full Width */}
                    <div className="lg:col-span-12 pt-8 border-t border-zinc-800">
                        <div className="flex flex-col items-center gap-6">
                            <AdminButton
                                onClick={handleSubmit}
                                disabled={saving}
                                className="w-full max-w-md py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-violet-900/20 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 transform hover:scale-[1.02] transition-all"
                            >
                                {saving ? 'Saving Changes...' : '💾 Save All Changes'}
                            </AdminButton>

                            <Link href="/admin/stories" className="text-zinc-500 hover:text-white text-sm transition font-medium underline decoration-zinc-700 underline-offset-4 hover:decoration-white">
                                Cancel & Return to List
                            </Link>
                        </div>
                    </div>
                </form>
            </AdminLayout>
        </AdminGuard>
    );
}
