'use client';

import { useState, useEffect, useRef } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import Link from 'next/link';
import { getStories, supabase, type Story } from '@/lib/supabase';
import { motion } from 'framer-motion';

// Voice ID to Name mapping for display
const VOICE_MAP: Record<string, { name: string; gender: 'M' | 'F' }> = {
    // Male voices
    'GUDYcgRAONiI1nXDcNQQ': { name: 'Milo', gender: 'M' },
    'NOpBlnGInO9m6vDvFkFC': { name: 'Spuds', gender: 'M' },
    'N2lVS1w4EtoT3dr4eOWO': { name: 'Callum', gender: 'M' },
    'G17SuINrv2H9FC6nvetn': { name: 'Christopher', gender: 'M' },
    'ZQe5CZNOzWyzPSCn5a3c': { name: 'James', gender: 'M' },
    // Female voices
    '21m00Tcm4TlvDq8ikWAM': { name: 'Rachel', gender: 'F' },
    'EXAVITQu4vr4xnSDxMaL': { name: 'Bella', gender: 'F' },
    'pjcYQlDFKMbcOUp6F5GD': { name: 'Brittney', gender: 'F' },
    'mZ3kbJNnKRWI4YzJXA9j': { name: 'Delilah', gender: 'F' },
    'iCrDUkL56s3C8sCRl7wb': { name: 'Hope', gender: 'F' },
    'zA6D7RyKdc2EClouEMkP': { name: 'AImee', gender: 'F' },
};

const getVoiceName = (voiceId?: string): string => {
    if (!voiceId) return 'Unknown';
    return VOICE_MAP[voiceId]?.name || voiceId.substring(0, 8) + '...';
};


export default function StoriesManager() {
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');

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

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;

        try {
            if (!supabase) throw new Error('Supabase client not initialized');
            // 1. Delete from DB
            const { error } = await supabase
                .from('stories')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // 2. Refresh UI (Note: Storage files are not auto-deleted by RLS, 
            // we'd need a backend function or manual cleanup, but DB record gone removes it from app)
            setStories(stories.filter(s => s.id !== id));
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
            const { error } = await supabase
                .from('stories')
                .update({ is_premium: newValue })
                .eq('id', story.id);

            if (error) throw error;

            // Optimistic update
            setStories(stories.map(s => s.id === story.id ? { ...s, is_premium: newValue } : s));
            setStatus(`Updated "${story.title}" to ${newValue ? 'Premium' : 'Free'}`);
        } catch (error: any) {
            console.error('Update failed:', error);
            setStatus(`Error: ${error.message}`);
        }
    }

    const togglePublished = async (story: Story) => {
        const action = story.is_published ? 'unpublish' : 'publish';
        if (!confirm(`Are you sure you want to ${action} "${story.title}"?`)) return;

        try {
            if (!supabase) throw new Error('Supabase client not initialized');
            const newValue = !story.is_published;
            const { error } = await supabase
                .from('stories')
                .update({ is_published: newValue })
                .eq('id', story.id);

            if (error) throw error;

            setStories(stories.map(s => s.id === story.id ? { ...s, is_published: newValue } : s));
            setStatus(`"${story.title}" is now ${newValue ? 'Published' : 'Unpublished'}`);
        } catch (error: any) {
            console.error('Publish toggle failed:', error);
            setStatus(`Error: ${error.message}`);
        }
    }



    const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());

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

    const [selectedStory, setSelectedStory] = useState<Story | null>(null);

    // Audio preview state
    // Audio preview state & Simulator Engine
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);
    const ambientRefA = useRef<HTMLAudioElement | null>(null);
    const ambientRefB = useRef<HTMLAudioElement | null>(null);
    const activeAmbientRef = useRef<'A' | 'B'>('A');
    const currentPhaseRef = useRef<string>('');
    const crossfadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
    const [previewTime, setPreviewTime] = useState(0);
    const [previewDuration, setPreviewDuration] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    // Mixer State
    const [voiceVolume, setVoiceVolume] = useState(1.0);
    const [ambientVolume, setAmbientVolume] = useState(0.5);

    // Initialize ambient refs
    useEffect(() => {
        ambientRefA.current = new Audio();
        ambientRefB.current = new Audio();
        ambientRefA.current.loop = true;
        ambientRefB.current.loop = true;
        return () => {
            ambientRefA.current?.pause();
            ambientRefB.current?.pause();
            if (crossfadeIntervalRef.current) clearInterval(crossfadeIntervalRef.current);
        };
    }, []);

    // Cleanup on close
    useEffect(() => {
        if (!selectedStory) {
            if (previewAudioRef.current) previewAudioRef.current.pause();
            ambientRefA.current?.pause();
            ambientRefB.current?.pause();
            setIsPreviewPlaying(false);
            setPreviewTime(0);
            setPlaybackSpeed(1);
            currentPhaseRef.current = '';
        }
    }, [selectedStory]);

    // Apply Volumes
    useEffect(() => {
        if (previewAudioRef.current) previewAudioRef.current.volume = voiceVolume;
    }, [voiceVolume]);

    // Apply Speed
    useEffect(() => {
        if (previewAudioRef.current) previewAudioRef.current.playbackRate = playbackSpeed;
        if (ambientRefA.current) ambientRefA.current.playbackRate = playbackSpeed;
        if (ambientRefB.current) ambientRefB.current.playbackRate = playbackSpeed;
    }, [playbackSpeed]);

    // Ambient Logic Helpers
    const getAmbientUrl = (intent: string) => {
        if (!intent || intent === 'SILENCE') return '';
        const file = intent.toLowerCase().replace(/_/g, '-') + '.mp3';
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/audio/ambient/${file}`;
    };

    // Main Audio Loop Logic (run on time update)
    const updateAmbientLogic = (currentTime: number, duration: number) => {
        if (!selectedStory?.audio_phases?.length) return;

        const progress = duration > 0 ? currentTime / duration : 0;

        // Phase Mapping
        const phaseMap: Record<string, [number, number]> = {
            arrival: [0, 0.35],
            exploration: [0.35, 0.6],
            deepening: [0.35, 0.8],
            fadeout: [0.8, 1.0]
        };

        let currentPhase = selectedStory.audio_phases[selectedStory.audio_phases.length - 1];

        for (const phase of selectedStory.audio_phases) {
            const range = phaseMap[phase.phase] || [0, 1];
            if (progress >= range[0] && progress < range[1]) {
                currentPhase = phase;
                break;
            }
        }

        const phaseKey = `${currentPhase.phase}-${currentPhase.intent}`;

        // Update Volume for active ambient based on intensity
        const targetVol = ambientVolume * currentPhase.intensity;
        const active = activeAmbientRef.current === 'A' ? ambientRefA.current : ambientRefB.current;
        if (active && !active.paused) active.volume = targetVol;

        // Phase Change Detection
        if (phaseKey !== currentPhaseRef.current) {
            console.log('Preview Phase:', phaseKey);
            currentPhaseRef.current = phaseKey;

            const newUrl = getAmbientUrl(currentPhase.intent);

            if (newUrl) {
                const incoming = activeAmbientRef.current === 'A' ? ambientRefB.current : ambientRefA.current;
                const outgoing = activeAmbientRef.current === 'A' ? ambientRefA.current : ambientRefB.current;

                if (incoming && outgoing) {
                    incoming.src = newUrl;
                    incoming.volume = 0;
                    incoming.play().catch(console.error);

                    // Simple crossfade for preview
                    let step = 0;
                    const interval = setInterval(() => {
                        step += 0.1;
                        if (step > 1) step = 1;

                        incoming.volume = targetVol * step;
                        outgoing.volume = Math.max(0, outgoing.volume * (1 - step));

                        if (step === 1) {
                            clearInterval(interval);
                            outgoing.pause();
                            activeAmbientRef.current = activeAmbientRef.current === 'A' ? 'B' : 'A';
                        }
                    }, 100); // 1 sec crossfade
                }
            } else {
                // Silence - fade out active
                const active = activeAmbientRef.current === 'A' ? ambientRefA.current : ambientRefB.current;
                if (active && !active.paused) {
                    const fadeOut = setInterval(() => {
                        active.volume = Math.max(0, active.volume - 0.05);
                        if (active.volume <= 0) {
                            active.pause();
                            clearInterval(fadeOut);
                        }
                    }, 100);
                }
            }
        }
    };

    const togglePreviewPlayback = () => {
        if (!previewAudioRef.current) return;
        if (isPreviewPlaying) {
            previewAudioRef.current.pause();
            ambientRefA.current?.pause();
            ambientRefB.current?.pause();
        } else {
            previewAudioRef.current.play();
            // Trigger logic immediately to start ambient
            updateAmbientLogic(previewTime, previewDuration || 1);
        }
        setIsPreviewPlaying(!isPreviewPlaying);
    };

    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
        const t = e.currentTarget.currentTime;
        const d = e.currentTarget.duration;
        setPreviewTime(t);
        setPreviewDuration(d);
        updateAmbientLogic(t, d);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!previewAudioRef.current || !previewDuration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * previewDuration;
        previewAudioRef.current.currentTime = newTime;
        setPreviewTime(newTime);
    };

    const changeSpeed = (speed: number) => {
        setPlaybackSpeed(speed);
        if (previewAudioRef.current) {
            previewAudioRef.current.playbackRate = speed;
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <AdminGuard>
            <div className="min-h-screen bg-slate-950 pb-20 text-white">
                <header className="bg-slate-900 border-b border-white/5 sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link href="/admin" className="text-gray-400 hover:text-white">← Back</Link>
                            <h1 className="text-xl font-bold ml-4">Story Manager</h1>
                        </div>
                        <Link href="/admin/stories/editor" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition">
                            + New Story
                        </Link>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 py-8">
                    {status && (
                        <div className="mb-6 p-4 rounded-lg bg-slate-900 border border-white/10 text-emerald-400 flex justify-between items-center">
                            <span>{status}</span>
                            <button onClick={() => setStatus('')} className="text-gray-500 hover:text-white">✕</button>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-20 text-gray-500">Loading stories...</div>
                    ) : (
                        <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-slate-800/50">
                                        <th className="p-4 font-medium text-gray-400">Cover</th>
                                        <th className="p-4 font-medium text-gray-400">Title</th>
                                        <th className="p-4 font-medium text-gray-400">Category</th>
                                        <th className="p-4 font-medium text-gray-400">Duration</th>
                                        <th className="p-4 font-medium text-gray-400">Access</th>
                                        <th className="p-4 font-medium text-gray-400">Status</th>
                                        <th className="p-4 font-medium text-gray-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stories.map((story) => (
                                        <tr key={story.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                            <td className="p-4">
                                                <div className="w-12 h-12 rounded bg-slate-800 overflow-hidden relative">
                                                    {story.cover_url ? (
                                                        <img src={story.cover_url} alt="" className="w-full h-full object-cover" />
                                                    ) : <span className="absolute inset-0 flex items-center justify-center text-xs">No Img</span>}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-white">{story.title}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-[200px]">{story.id}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs capitalize ${story.category === 'sleep' ? 'bg-indigo-500/10 text-indigo-400' :
                                                    story.category === 'meditation' ? 'bg-teal-500/10 text-teal-400' :
                                                        story.category === 'fantasy' ? 'bg-purple-500/10 text-purple-400' :
                                                            'bg-green-500/10 text-green-400'
                                                    }`}>
                                                    {story.category}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-400">
                                                {Math.ceil(story.duration / 60)} min
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => togglePremium(story)}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${story.is_premium
                                                        ? 'bg-amber-500 text-black hover:bg-amber-400'
                                                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                                        }`}>
                                                    {story.is_premium ? 'Premium ⭐' : 'Free'}
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => togglePublished(story)}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${story.is_published
                                                        ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                                                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                                                        }`}>
                                                    {story.is_published ? '✓ Published' : '✗ Draft'}
                                                </button>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleGenerateSocial(story)}
                                                        disabled={generatingIds.has(story.id)}
                                                        className={`p-2 rounded transition ${generatingIds.has(story.id)
                                                            ? 'bg-indigo-500/20 text-indigo-300 cursor-wait'
                                                            : story.social_reel_url
                                                                ? 'hover:bg-green-500/10 text-green-500 hover:text-green-400 opacity-80' // Already done
                                                                : 'hover:bg-purple-500/10 text-gray-400 hover:text-purple-400'
                                                            }`}
                                                        title={story.social_reel_url ? "Regenerate Reel" : "Generate Social Reel"}
                                                    >
                                                        {generatingIds.has(story.id) ? '⏳' : story.social_reel_url ? '🎬✓' : '🎬'}
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedStory(story)}
                                                        className="p-2 hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-400 rounded transition"
                                                        title="View Text"
                                                    >
                                                        📄
                                                    </button>
                                                    <Link
                                                        href={`/admin/stories/editor?id=${story.id}`}
                                                        className="p-2 hover:bg-amber-500/10 text-gray-400 hover:text-amber-400 rounded transition inline-flex"
                                                        title="Edit Story"
                                                    >
                                                        ✏️
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(story.id, story.title)}
                                                        className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded transition"
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {stories.length === 0 && (
                                <div className="p-10 text-center text-gray-500">
                                    No stories found. Go generate some!
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Story Text Modal */}
            {selectedStory && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-white/5 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-white">{selectedStory.title}</h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    {selectedStory.category} • {Math.ceil(selectedStory.duration / 60)} min
                                    {selectedStory.voice_id && (
                                        <span className="ml-2 text-indigo-400">
                                            • 🎙️ {getVoiceName(selectedStory.voice_id)}
                                            {VOICE_MAP[selectedStory.voice_id]?.gender === 'F' ? ' ♀' : VOICE_MAP[selectedStory.voice_id]?.gender === 'M' ? ' ♂' : ''}
                                        </span>
                                    )}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedStory(null)}
                                className="text-gray-400 hover:text-white text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
                            <p className="text-gray-300 mb-6">{selectedStory.description}</p>

                            <h3 className="text-sm font-medium text-gray-400 mb-2">Script Text</h3>
                            {selectedStory.script_text ? (
                                <div className="bg-slate-950 border border-white/5 rounded-lg p-4 text-gray-300 whitespace-pre-wrap text-sm leading-relaxed max-h-[200px] overflow-y-auto mb-6">
                                    {selectedStory.script_text}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic mb-6">No script text available for this story.</p>
                            )}

                            {/* Director Plan */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                    <span>🎬</span> Audio Director Plan
                                </h3>
                                <div className="bg-slate-950 border border-white/5 rounded-lg overflow-hidden">
                                    <div className="flex text-xs border-b border-white/5 bg-white/5 p-2 font-medium text-gray-300">
                                        <div className="w-1/4">Phase</div>
                                        <div className="w-1/4">Range</div>
                                        <div className="w-1/4">Sound</div>
                                        <div className="w-1/4 text-right">Intensity</div>
                                    </div>
                                    {selectedStory.audio_phases ? selectedStory.audio_phases.map((phase, i) => (
                                        <div key={i} className="flex text-xs p-2 border-b border-white/5 last:border-0 text-gray-400 hover:bg-white/5">
                                            <div className="w-1/4 text-indigo-400 capitalize">{phase.phase}</div>
                                            <div className="w-1/4 text-gray-500">
                                                {phase.phase === 'arrival' ? '0-35%' :
                                                    phase.phase === 'exploration' ? '35-60%' :
                                                        phase.phase === 'deepening' ? '35-80%' : '80-100%'}
                                            </div>
                                            <div className="w-1/4 text-white font-medium">{phase.intent}</div>
                                            <div className="w-1/4 text-right">{(phase.intensity * 100).toFixed(0)}%</div>
                                        </div>
                                    )) : (
                                        <div className="p-4 text-xs text-gray-500 italic text-center">No audio plan verification data found.</div>
                                    )}
                                </div>
                            </div>

                            {/* Audio Preview Player */}
                            <h3 className="text-sm font-medium text-gray-400 mb-2 mt-6">Audio Preview</h3>
                            {selectedStory.audio_url ? (
                                <div className="bg-slate-950 border border-white/5 rounded-lg p-4">
                                    <audio
                                        ref={previewAudioRef}
                                        src={selectedStory.audio_url}
                                        onTimeUpdate={handleTimeUpdate}
                                        onLoadedMetadata={(e) => setPreviewDuration(e.currentTarget.duration)}
                                        onEnded={() => {
                                            setIsPreviewPlaying(false);
                                            ambientRefA.current?.pause();
                                            ambientRefB.current?.pause();
                                        }}
                                    />
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={togglePreviewPlayback}
                                            className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center text-white text-xl transition flex-shrink-0"
                                        >
                                            {isPreviewPlaying ? '⏸' : '▶'}
                                        </button>
                                        <div className="flex-1">
                                            {/* Seekable Progress Bar */}
                                            <div
                                                className="h-3 bg-slate-800 rounded-full overflow-visible cursor-pointer relative group"
                                                onClick={handleSeek}
                                            >
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full transition-all relative"
                                                    style={{ width: `${previewDuration ? (previewTime / previewDuration) * 100 : 0}%` }}
                                                >
                                                    {/* Dot indicator */}
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transform translate-x-1/2 group-hover:scale-125 transition" />
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                <span>{formatTime(previewTime)}</span>
                                                <span>{formatTime(previewDuration)}</span>
                                            </div>
                                        </div>
                                        {/* Speed Control */}
                                        <div className="flex-shrink-0">
                                            <select
                                                value={playbackSpeed}
                                                onChange={(e) => changeSpeed(parseFloat(e.target.value))}
                                                className="bg-slate-800 border border-white/10 rounded px-2 py-1 text-xs text-white cursor-pointer"
                                            >
                                                <option value={0.5}>0.5x</option>
                                                <option value={0.75}>0.75x</option>
                                                <option value={1}>1x</option>
                                                <option value={1.25}>1.25x</option>
                                                <option value={1.5}>1.5x</option>
                                                <option value={2}>2x</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Mixer Controls */}
                                    <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-8">
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-400">Voice Volume</span>
                                                <span className="text-white">{Math.round(voiceVolume * 100)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0" max="1" step="0.05"
                                                value={voiceVolume}
                                                onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
                                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-400">Ambient Mix</span>
                                                <span className="text-white">{Math.round(ambientVolume * 100)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0" max="1" step="0.05"
                                                value={ambientVolume}
                                                onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">No audio available for this story.</p>
                            )}
                        </div>
                        <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    togglePublished(selectedStory);
                                    setSelectedStory(null);
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${selectedStory.is_published
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                                    }`}
                            >
                                {selectedStory.is_published ? 'Unpublish' : 'Publish Story'}
                            </button>
                            <button
                                onClick={() => setSelectedStory(null)}
                                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div >
                </div >
            )
            }
        </AdminGuard >
    );
}
