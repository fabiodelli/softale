'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminGuard from '@/components/admin/AdminGuard';
import { AdminLayout, AdminButton } from '@/components/admin/AdminLayout'; // Import unified layout
import Link from 'next/link';
import { Download, Sparkles, X, Loader2 } from 'lucide-react';
import { supabase, type Story } from '@/lib/supabase';
import { TagSelector } from '@/components/admin/TagSelector';
import { estimateStoryCost, calculateFinalCost, type CostBreakdown } from '@/lib/cost-engine';

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

const SUGGESTED_TAGS = [
    'Morning', 'Sunrise', 'Energy', 'Focus', // Morning
    'Work', 'Deep Work', 'Background', 'Study', // Day
    'Relax', 'Unwind', 'Sunset', 'Calm', // Evening
    'Sleep', 'Dream', 'Night', 'Rain', 'Binaural' // Night
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
    const [tags, setTags] = useState<string[]>([]);
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
    // V6 Stems (Read Only for now)
    const [voiceUrl, setVoiceUrl] = useState('');
    const [musicUrl, setMusicUrl] = useState('');
    const [ambientUrl, setAmbientUrl] = useState('');
    const [existingCoverUrl, setExistingCoverUrl] = useState('');
    const [existingWideUrl, setExistingWideUrl] = useState('');
    const [existingTallUrl, setExistingTallUrl] = useState('');

    // Cost State
    const [estimatedCost, setEstimatedCost] = useState<CostBreakdown | null>(null);
    const [actualCost, setActualCost] = useState<CostBreakdown | null>(null);

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

    // Generation State
    const [genModalOpen, setGenModalOpen] = useState(false);
    const [genType, setGenType] = useState<'square' | 'wide' | 'tall' | null>(null);
    const [genPrompt, setGenPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleOpenGen = (type: 'square' | 'wide' | 'tall') => {
        setGenType(type);
        // Pre-fill prompt logic only if empty, to allow reuse of successful prompts
        if (!genPrompt) {
            const basePrompt = `Dreamy, ethereal artwork for "${title || 'Story'}" - ${category || 'relaxation'} theme`;
            setGenPrompt(basePrompt);
        }
        setGenModalOpen(true);
    };

    const handleGenerate = async () => {
        if (!genType || !genPrompt) return;
        setIsGenerating(true);
        setStatus('✨ Generating artwork with AI...');

        try {
            const response = await fetch('/api/admin/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: genPrompt, aspect_ratio: genType })
            });

            if (!response.ok) throw new Error('Generation failed');

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            // Convert Base64 to Blob
            const byteCharacters = atob(data.b64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/png' });

            const file = new File([blob], `generated_${genType}.png`, { type: 'image/png' });

            // Set state
            if (genType === 'square') setCoverFile(file);
            if (genType === 'wide') setWideFile(file);
            if (genType === 'tall') setTallFile(file);

            setGenModalOpen(false);
            setStatus('✅ Artwork generated!');

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Generation failed');
            setStatus('');
        } finally {
            setIsGenerating(false);
        }
    };

    // Load existing story if editing
    useEffect(() => {
        if (isEditMode && storyId) {
            loadStory(storyId);
        }
    }, [storyId, isEditMode]);

    // Live Cost Estimation Effect
    useEffect(() => {
        // Calculate estimated assets based on current state
        // 1 Square cover is mandatory usually. Wide/Tall are optional/extra.
        // We assume Factory defaults: 1 square, 1 wide, 1 tall for new stories.
        // If files are uploaded manually, cost is 0 for those. If generated, cost applies.
        // For simple estimation, we assume full generation suite if no files present.

        const est = estimateStoryCost(
            duration / 60,
            category,
            {
                includeVoice: !['soundscape', 'binaural', 'music_instrumental'].includes(category),
                includeImages: true
            }
        );
        setEstimatedCost(est);
    }, [duration, category]);

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
            setTags(data.tags || []);
            setDuration(data.duration || 120);
            setScriptText(data.script_text || '');
            setVoiceId(data.voice_id || '');
            setAudioPhasesJSON(JSON.stringify(data.audio_phases || [], null, 2));

            setIsPremium(data.is_premium || false);
            setIsPublished(data.is_published || false);
            setIsLoop(data.is_loop || false);

            setExistingAudioUrl(data.audio_url || '');
            setVoiceUrl(data.voice_url || '');
            setMusicUrl(data.music_url || '');
            setAmbientUrl(data.ambient_url || '');
            setExistingCoverUrl(data.cover_url || '');
            setExistingWideUrl(data.cover_landscape_url || '');
            setExistingTallUrl(data.cover_portrait_url || '');

            if (data.cost_metadata) {
                const final = calculateFinalCost(data.cost_metadata);
                setActualCost(final);
            }

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

            let finalAudioUrl = existingAudioUrl;
            let finalCoverUrl = existingCoverUrl;
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
                finalAudioUrl = await uploadFile('audio', `stories/${newId}/audio.mp3`, audioFile, 'audio/mpeg');
            }

            // Upload Images
            if (coverFile) {
                setStatus('Uploading square cover...');
                finalCoverUrl = await uploadFile('audio', `stories/${newId}/cover.png`, coverFile, 'image/png');
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
                tags,
                duration,
                is_premium: isPremium,
                is_published: isPublished,
                is_loop: isLoop,
                audio_url: finalAudioUrl,
                voice_url: voiceUrl,
                music_url: musicUrl,
                ambient_url: ambientUrl,
                audio_phases: audioPhases,
                cover_url: finalCoverUrl,
                cover_landscape_url: wideUrl,
                cover_portrait_url: tallUrl,
                script_text: scriptText,
                voice_id: voiceId || null,
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

    const handleDownload = async (e: React.MouseEvent, url: string, filename: string) => {
        e.stopPropagation();
        e.preventDefault();
        try {
            setStatus('Downloading asset...');
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            setStatus('');
        } catch (error) {
            console.error('Download failed:', error);
            setStatus('Download failed. Opening in new tab...');
            // Fallback
            window.open(url, '_blank');
        }
    };

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

                            {/* V6 Stems (Read Only) */}
                            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-zinc-950/30 p-4 rounded-xl border border-zinc-700/50">
                                <div className="md:col-span-3">
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">V6 Audio Stems (Generated)</h3>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">Voice Stem</label>
                                    {voiceUrl ? (
                                        <audio controls src={voiceUrl} className="w-full h-8 rounded-md" />
                                    ) : (
                                        <div className="text-xs text-zinc-600 italic px-2 py-1">Not available</div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">Music Stem</label>
                                    {musicUrl ? (
                                        <audio controls src={musicUrl} className="w-full h-8 rounded-md" />
                                    ) : (
                                        <div className="text-xs text-zinc-600 italic px-2 py-1">Not available</div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">Ambient Stem</label>
                                    {ambientUrl ? (
                                        <audio controls src={ambientUrl} className="w-full h-8 rounded-md" />
                                    ) : (
                                        <div className="text-xs text-zinc-600 italic px-2 py-1">Not available</div>
                                    )}
                                </div>
                            </div>

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
                                            <div onClick={(e) => { e.stopPropagation(); handleOpenGen('square'); }}>
                                                <button type="button" className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-400 transition-colors shadow-lg" title="AI Generate">
                                                    <Sparkles size={14} />
                                                </button>
                                            </div>
                                            <span className="text-white text-xs font-bold uppercase tracking-widest border border-white/50 px-4 py-2 rounded-full hover:bg-white hover:text-black transition">Change</span>
                                            {existingCoverUrl && (
                                                <div onClick={(e) => handleDownload(e, existingCoverUrl, `cover_square_${storyId || 'new'}.png`)}>
                                                    <button
                                                        type="button"
                                                        className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black hover:bg-violet-400 border border-white/50 transition-colors"
                                                        title="Download"
                                                    >
                                                        <Download size={14} />
                                                    </button>
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
                                                <div onClick={(e) => { e.stopPropagation(); handleOpenGen('wide'); }}>
                                                    <button type="button" className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-400 transition-colors shadow-lg" title="AI Generate">
                                                        <Sparkles size={12} />
                                                    </button>
                                                </div>
                                                <span className="text-xs text-white font-bold border border-white/30 px-2 py-1 rounded">Edit</span>
                                                {existingWideUrl && (
                                                    <div onClick={(e) => handleDownload(e, existingWideUrl, `cover_wide_${storyId || 'new'}.png`)}>
                                                        <button
                                                            type="button"
                                                            className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black hover:bg-violet-400 border border-white/50 transition-colors"
                                                            title="Download"
                                                        >
                                                            <Download size={12} />
                                                        </button>
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
                                                <div onClick={(e) => { e.stopPropagation(); handleOpenGen('tall'); }}>
                                                    <button type="button" className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-400 transition-colors shadow-lg" title="AI Generate">
                                                        <Sparkles size={12} />
                                                    </button>
                                                </div>
                                                <span className="text-xs text-white font-bold border border-white/30 px-2 py-1 rounded">Edit</span>
                                                {existingTallUrl && (
                                                    <div onClick={(e) => handleDownload(e, existingTallUrl, `cover_tall_${storyId || 'new'}.png`)}>
                                                        <button
                                                            type="button"
                                                            className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black hover:bg-violet-400 border border-white/50 transition-colors"
                                                            title="Download"
                                                        >
                                                            <Download size={12} />
                                                        </button>
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

                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                                        Tags <span className="text-zinc-500 text-xs font-normal ml-2">(Auto-suggests existing)</span>
                                    </label>
                                    <TagSelector
                                        value={tags}
                                        onChange={setTags}
                                        placeholder="Rain, Piano, Slow, Male Voice..."
                                    />
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {SUGGESTED_TAGS.map(tag => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => {
                                                    if (!tags.includes(tag)) {
                                                        setTags([...tags, tag]);
                                                    }
                                                }}
                                                className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:bg-violet-500 hover:text-white transition border border-zinc-700 hover:border-violet-400"
                                            >
                                                + {tag}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-2">Use these "System Tags" to boost visibility at specific times of day.</p>
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

                            {/* Cost Display */}
                            <div className="mt-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800 w-full max-w-md">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                        {actualCost ? 'ACTUAL COST' : 'ESTIMATED COST'}
                                    </span>
                                    <span className={`text-xl font-mono font-bold ${actualCost ? 'text-emerald-400' : 'text-zinc-400'}`}>
                                        ${(actualCost?.total || estimatedCost?.total || 0).toFixed(4)}
                                    </span>
                                </div>
                                <div className="space-y-1 text-xs text-zinc-600 font-mono">
                                    <div className="flex justify-between">
                                        <span>Voice Generation</span>
                                        <span>${(actualCost?.details.voice || estimatedCost?.details.voice || 0).toFixed(4)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>LLM (Script)</span>
                                        <span>${(actualCost?.details.script || estimatedCost?.details.script || 0).toFixed(4)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Assets (Images)</span>
                                        <span>${(actualCost?.details.images || estimatedCost?.details.images || 0).toFixed(4)}</span>
                                    </div>
                                    <div className="flex justify-between text-zinc-700 pt-1 border-t border-zinc-800 mt-1">
                                        <span>Storage/Bandwidth</span>
                                        <span>(Included in Pro)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </AdminLayout>

            {/* Generation Modal */}
            {
                genModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
                            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Sparkles className="text-indigo-400" size={20} />
                                    Generate Artwork
                                </h3>
                                <button onClick={() => setGenModalOpen(false)} className="text-zinc-500 hover:text-white transition">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Prompt</label>
                                    <textarea
                                        value={genPrompt}
                                        onChange={(e) => setGenPrompt(e.target.value)}
                                        rows={4}
                                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 resize-none placeholder-zinc-700"
                                        placeholder="Describe the image you want..."
                                        autoFocus
                                    />
                                    <p className="text-xs text-zinc-500 mt-2">Target Aspect Ratio: <span className="text-indigo-400 font-bold uppercase">{genType}</span></p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating || !genPrompt.trim()}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={18} />
                                                Generate
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setGenModalOpen(false)}
                                        disabled={isGenerating}
                                        className="px-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded-xl font-bold transition disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </AdminGuard >
    );
}
