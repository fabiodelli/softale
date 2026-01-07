'use client';

import { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// Helper to get formatted prompts
const getPrompt = (category: string) => {
    // We'll keep the full text here for reference, but in V3 the backend also has them.
    // This allows the admin to override/tweak before sending.
    return ''; // We will rely on backend defaults unless manually set, or we can duplicate the long strings here.
    // For now, let's keep the detailed strings so the Admin sees what's happening.
};

const PROMPTS: Record<string, string> = {
    sleep: `[v2.0 - Global Guard active, Signature Motif enabled]

You are a SLEEP STORYTELLER for 'Softale'.

**SUBTYPE** (choose silently): comfort/safety, slow travel, cozy domestic, abstract sensory

**STRUCTURE**:
1. Arrival (10%): Start with sensation, NOT "imagine yourself"
2. Exploration (50%): Textures, temperatures, micro-sounds
3. Settling (30%): Stillness, comfort, weight
4. Fade (10%): Fragmented sentences... sensory echoes... silence...

**RULES**:
- NO "suddenly", surprises, questions, dialogue
- Present tense, second person
- 5-8 [pause] markers
- Use Signature Motif rule

**BANNED**: "you find yourself", "gentle warmth", "peaceful calm"
**TONE**: Protective presence, whispering`,

    meditation: `[v2.0 - Global Guard active, Signature Motif enabled]

You are a MEDITATION GUIDE for 'Softale'.

**MODE** (choose silently): MINDFULNESS or VISUALIZATION
**APPROACH** (choose silently): somatic, breath-centered, emotional regulation, grounding, open awareness

**STRUCTURE**:
1. Grounding (15%): Physical awareness
2. Breath Focus (25%): Varied breathing cues
3. Visualization/Presence (40%): Imagery OR pure awareness
4. Integration (20%): Return gently

**RULES**:
- Simple, direct language
- Varied breath cues (not always "take a deep breath")
- 8-12 [pause] markers
- Never say "let go of tension" — describe the release

**BANNED**: "take a moment", "allow yourself", "simply breathe"
**TONE**: Warm companion, steady`,

    fantasy: `[v2.0 - Global Guard active, Anti-Cliché Filter, Signature Motif enabled]

You are a FANTASY NARRATOR for 'Softale'.

**MODE** (choose silently): PASSIVE or EXPLORATIVE

**STRUCTURE**:
1. Portal (10%): Start with sensation, NOT "you find yourself"
2. Discovery (60%): Explore, encounter benevolent elements
3. Rest (20%): Find comfort
4. Embrace (10%): Soft conclusion, safe and held

**ANTI-CLICHÉ FILTER**:
BANNED: glowing, ancient, mystical, magical, ethereal, crystal clear
REPLACE WITH: function-based descriptions
❌ "mystical forest" → ✅ "trees whose leaves fold inward when the air cools"

**RULES**:
- ORIGINAL imagery only, no borrowed fantasy
- NO danger, conflict, antagonists
- 5-7 [pause] markers
- Use Signature Motif rule

**TONE**: Wonder-struck, sharing secrets`,

    nature: `[v2.0 - Global Guard active, Signature Motif enabled]

You are a NATURE SOUNDSCAPE NARRATOR for 'Softale'.

**REALISM MODE** (choose silently): DOCUMENTARY or POETIC-NATURALISM

**STRUCTURE**:
1. Arrival (15%): Where, when, weather, soundscape
2. Observation (55%): Slowly pan, layered sounds
3. Stillness (20%): Simply be present
4. Gratitude (10%): Gentle appreciation, fade

**RULES**:
- REAL locations/ecosystems
- Prioritize auditory (birds, water, wind, insects)
- Specific species: "a cardinal calls", "oak leaves rustle"
- 6-10 [pause] markers
- Time passes naturally

**DIFFERENTIATION**: You are a presence noticing, not Wikipedia.
**TONE**: David Attenborough meets mindfulness`,

    work_break: `[v2.0 - Global Guard active]

You are a FOCUS & RESET COACH for 'Softale'.

**MODE** (choose silently): RESET or FOCUS

**STRUCTURE**:
1. The Stop (10%): Halt momentum.
2. The Shift (40%): Physical or mental pivot.
3. The Center (30%): Find the quiet core.
4. The Return (20%): Re-enter with clarity.

**RULES**:
- Brief, efficient sentences.
- 3-5 [pause] markers.
- NO "flowery" language.

**TONE**: Crisp, clear, refreshing.`,

    motivation: `[v2.0 - Global Guard active]

You are a MOTIVATIONAL MENTOR for 'Softale'.

**MODE** (choose silently): RESILIENCE, POTENTIAL, or CLARITY

**STRUCTURE**:
1. Validation (15%): Acknowledge struggle.
2. Reframing (35%): Shift the view.
3. Strengthening (35%): Build internal resource.
4. Action (15%): Gentle push forward.

**RULES**:
- Strong, declarative verbs.
- "You are", "You can".
- 4-6 [pause] markers.
- NO toxic positivity.

**TONE**: Strong, grounded, unwavering belief.`,
};

// VOICES V3.3 - Updated Selection
const VOICES: Record<string, string> = {
    // Male voices
    'Milo': 'GUDYcgRAONiI1nXDcNQQ',         // Calm, Soothing, Meditative
    'Spuds': 'NOpBlnGInO9m6vDvFkFC',        // Grandpa storyteller
    'Callum': 'N2lVS1w4EtoT3dr4eOWO',       // American, hoarse
    'Christopher': 'G17SuINrv2H9FC6nvetn',  // Multilingual
    'James': 'ZQe5CZNOzWyzPSCn5a3c',        // Meditation guide
    // Female voices
    'Rachel': '21m00Tcm4TlvDq8ikWAM',       // Soft American
    'Bella': 'EXAVITQu4vr4xnSDxMaL',        // British, warm
    'Brittney': 'pjcYQlDFKMbcOUp6F5GD',     // Warm, inviting
    'Delilah': 'mZ3kbJNnKRWI4YzJXA9j',      // Relaxing, soothing
    'Hope': 'iCrDUkL56s3C8sCRl7wb',         // Soothing narrator
    'AImee': 'zA6D7RyKdc2EClouEMkP',        // ASMR, meditation
    // Category defaults
    sleep: 'GUDYcgRAONiI1nXDcNQQ',          // Milo
    meditation: 'mZ3kbJNnKRWI4YzJXA9j',     // Delilah
    fantasy: 'NOpBlnGInO9m6vDvFkFC',        // Spuds (storyteller)
    nature: '21m00Tcm4TlvDq8ikWAM',         // Rachel
    default: 'GUDYcgRAONiI1nXDcNQQ',        // Milo
    work_break: 'N2lVS1w4EtoT3dr4eOWO',     // Callum
    motivation: 'N2lVS1w4EtoT3dr4eOWO',     // Callum
    kids: 'iCrDUkL56s3C8sCRl7wb',           // Hope
};

// Mood presets per category
const MOOD_OPTIONS = ['peaceful', 'calm', 'dreamy', 'mystical', 'cozy', 'grounding', 'uplifting'];
const TIME_OPTIONS = ['dawn', 'morning', 'afternoon', 'dusk', 'night', 'timeless'];
const SENSORY_OPTIONS = ['neutral', 'visual', 'auditory', 'tactile', 'olfactory', 'mixed'];
const PERSPECTIVE_OPTIONS = ['second_person', 'first_person', 'observer'];
const LANGUAGE_OPTIONS = ['English', 'Italian', 'Spanish', 'French', 'German', 'Portuguese'];

// Random story ideas for inspiration
const RANDOM_IDEAS = [
    'A quiet night in a Japanese ryokan listening to rain',
    'Floating through the northern lights',
    'Walking through an ancient library at midnight',
    'A warm cabin by a frozen lake',
    'Drifting on a boat through a bioluminescent bay',
    'Exploring a hidden garden behind an old mansion',
    'A peaceful meadow as the sun sets',
    'Inside a cozy treehouse during a thunderstorm',
    'A slow train ride through snowy mountains',
    'Wandering through a night market in a distant city',
    'Resting by a campfire under the stars',
    'A misty morning walk through bamboo forest',
];

export default function FactoryController() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>('');
    const [error, setError] = useState<any>(null);

    // Form State - Core
    const [theme, setTheme] = useState('');
    const [category, setCategory] = useState('fantasy');
    const [duration, setDuration] = useState(2);
    const [voiceId, setVoiceId] = useState('');
    const [systemPrompt, setSystemPrompt] = useState(PROMPTS.fantasy);
    const [musicFile, setMusicFile] = useState('auto');
    const [availableAmbients, setAvailableAmbients] = useState<string[]>([]);

    // Dynamic Voices from ElevenLabs
    interface Voice {
        id: string;
        name: string;
        previewUrl: string | null;
        gender: 'male' | 'female' | 'unknown';
        style: string;
    }
    const [voices, setVoices] = useState<Voice[]>([]);
    const [voicesLoading, setVoicesLoading] = useState(true);
    const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
    const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

    // Fetch voices from ElevenLabs
    useEffect(() => {
        async function fetchVoices() {
            try {
                const res = await fetch('/api/voices');
                if (res.ok) {
                    const data = await res.json();
                    setVoices(data.voices || []);
                    // Set default voice to first available
                    if (data.voices?.length > 0 && !voiceId) {
                        setVoiceId(data.voices[0].id);
                    }
                }
            } catch (e) {
                console.error('Failed to fetch voices:', e);
            } finally {
                setVoicesLoading(false);
            }
        }
        fetchVoices();
    }, []);

    // Preview voice audio
    const playPreview = (voice: Voice) => {
        if (!voice.previewUrl) return;

        // Stop current if playing
        if (previewAudio) {
            previewAudio.pause();
            previewAudio.currentTime = 0;
        }

        if (playingVoiceId === voice.id) {
            setPlayingVoiceId(null);
            return;
        }

        const audio = new Audio(voice.previewUrl);
        audio.play();
        audio.onended = () => setPlayingVoiceId(null);
        setPreviewAudio(audio);
        setPlayingVoiceId(voice.id);
    };

    // Fetch available Stock Loops from Supabase (Harvest Engine)
    useEffect(() => {
        async function fetchLoops() {
            if (!supabase) return;
            const { data, error } = await supabase
                .from('stories')
                .select('title')
                .eq('is_loop', true);

            if (!error && data) {
                setAvailableAmbients(data.map(d => d.title));
            }
        }
        fetchLoops();
    }, []);

    // Form State - NEW Parameters
    const [language, setLanguage] = useState('English');
    // Deprecated parameters removed for "Intent-Based" V3 Simplification
    // const [mood, setMood] = useState('dreamy');
    // const [setting, setSetting] = useState('');
    // ... all handled by AI now

    const [lastPrompts, setLastPrompts] = useState<{ system: string; user: string } | null>(null);
    const [lastUsage, setLastUsage] = useState<{ input: number; output: number; model: string } | null>(null);

    const handleCategoryChange = (newCategory: string) => {
        setCategory(newCategory);
        // Auto-update prompt if a template exists (Visual Reference Only now)
        if (PROMPTS[newCategory]) {
            setSystemPrompt(PROMPTS[newCategory]);
        }
        // Auto-update voice (type-safe check)
        const newVoice = (VOICES as any)[newCategory] || VOICES.default;
        setVoiceId(newVoice);
    };

    const handleGenerate = async () => {
        setLoading(true);
        setStatus('Initializing Factory...');
        setError('');
        setLastPrompts(null); // Reset prompts
        setLastUsage(null); // Reset usage

        try {
            const res = await fetch('/api/factory/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `Generated: ${theme.slice(0, 20)}...`,
                    category,
                    duration,
                    description: theme,
                    // mood: 'auto', // Handled by AI
                    // setting: 'auto',
                    language,
                    voiceId,
                    systemPrompt, // Still sending for legacy overriding support if needed
                    musicFile
                })
            });

            const data = await res.json();

            if (!res.ok) {
                const combinedError: any = new Error(`${data.error}\n${data.details || ''}`);
                combinedError.debugEnv = data.debugEnv;
                throw combinedError;
            }

            // Capture Metadata
            if (data.prompts) setLastPrompts(data.prompts);
            if (data.usage) setLastUsage(data.usage);

            setStatus('✅ Success! Story generated and uploaded.');
        } catch (err: any) {
            setError(err);
            setStatus('❌ Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminGuard>
            <div className="min-h-screen bg-slate-950 pb-20 text-white">
                <header className="bg-slate-900 border-b border-white/5 sticky top-0 z-40">
                    <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link href="/admin" className="text-gray-400 hover:text-white">← Back</Link>
                            <h1 className="text-xl font-bold ml-4">Audio Factory Controller</h1>
                        </div>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-4 py-8">
                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-8">
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold mb-2">Story Configuration</h2>
                            <p className="text-gray-400 text-sm">Configure the parameters for the AI generation pipeline.</p>
                        </div>

                        {/* Theme */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-300">Story Concept</label>
                                <button
                                    type="button"
                                    onClick={() => setTheme(RANDOM_IDEAS[Math.floor(Math.random() * RANDOM_IDEAS.length)])}
                                    className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition flex items-center gap-1"
                                >
                                    🎲 Random
                                </button>
                            </div>
                            <textarea
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                                rows={2}
                                className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 resize-none"
                                placeholder="Describe your story, simple or detailed"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => handleCategoryChange(e.target.value)}
                                    className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="expectation">Select Category...</option>
                                    <option value="sleep">🌙 Sleep Story</option>
                                    <option value="meditation">🧘 Meditation</option>
                                    <option value="fantasy">🌟 Fantasy Escape</option>
                                    <option value="nature">🌿 Nature (Narrated)</option>
                                    <option value="soundscape">🌊 Soundscape (Loopable)</option>
                                    <option value="binaural">🔮 Binaural (Loopable)</option>
                                    <option value="work_break">☕ Work Break (Focus/Reset)</option>
                                    <option value="motivation">🔥 Motivation (Music Cost)</option>
                                    <option value="kids">🧸 Kids (Bedtime/Adventure)</option>
                                    <option value="music_instrumental">🎵 Instrumental Only (Music Cost)</option>
                                </select>
                                {(category === 'motivation' || category === 'kids' || category === 'work_break' || category === 'music_instrumental') && (
                                    <div className="mt-2 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                                        ⚠️ Uses Stable Audio (Credits Required)
                                    </div>
                                )}
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">Duration (Minutes)</label>
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                    className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                                >
                                    <option value={2}>2 Minutes (Test)</option>
                                    <option value={5}>5 Minutes</option>
                                    <option value={10}>10 Minutes</option>
                                    <option value={20}>20 Minutes</option>
                                    <option value={30}>30 Minutes (Standard Sleep)</option>
                                    <option value={45}>45 Minutes (Long Sleep)</option>
                                    <option value={60}>60 Minutes (Deep Dive)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Language */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">Language</label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 text-sm"
                                >
                                    {LANGUAGE_OPTIONS.map(l => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Voice Selection - Dynamic from ElevenLabs */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">Narrator Voice</label>
                                {voicesLoading ? (
                                    <div className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-gray-500">
                                        Loading voices from ElevenLabs...
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <select
                                            value={voiceId}
                                            onChange={(e) => setVoiceId(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                                        >
                                            <optgroup label="👩 Female Voices">
                                                {voices.filter(v => v.gender === 'female').map(v => (
                                                    <option key={v.id} value={v.id}>
                                                        {v.name} ({v.style})
                                                    </option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="👨 Male Voices">
                                                {voices.filter(v => v.gender === 'male').map(v => (
                                                    <option key={v.id} value={v.id}>
                                                        {v.name} ({v.style})
                                                    </option>
                                                ))}
                                            </optgroup>
                                            {voices.filter(v => v.gender === 'unknown').length > 0 && (
                                                <optgroup label="🌐 Other">
                                                    {voices.filter(v => v.gender === 'unknown').map(v => (
                                                        <option key={v.id} value={v.id}>
                                                            {v.name} ({v.style})
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            )}
                                        </select>

                                        {/* Preview Button */}
                                        {voiceId && (() => {
                                            const selectedVoice = voices.find(v => v.id === voiceId);
                                            return selectedVoice?.previewUrl ? (
                                                <button
                                                    type="button"
                                                    onClick={() => playPreview(selectedVoice)}
                                                    className={`text-xs px-3 py-1.5 rounded-full transition flex items-center gap-1 ${playingVoiceId === voiceId
                                                            ? 'bg-indigo-500 text-white'
                                                            : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                                        }`}
                                                >
                                                    {playingVoiceId === voiceId ? '⏹ Stop' : '▶️ Preview'}
                                                </button>
                                            ) : null;
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ambient - Controlled by AI */}
                        <div className="mb-6 bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-4 flex items-center gap-3">
                            <span className="text-2xl">🤖</span>
                            <div className="flex-1">
                                <h4 className="text-sm font-medium text-indigo-300">V3 Harvest Engine Active</h4>
                                <p className="text-xs text-indigo-400/70">
                                    The AI Director will prioritize reusing {availableAmbients.length} stock loops. New assets are harvested automatically.
                                </p>
                            </div>
                        </div>

                        {/* Live Prompt Analysis (ReadOnly) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <h3 className="text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                                    🧐 Pipeline Trace
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-gray-400">Live View</span>
                                </h3>

                                {lastPrompts ? (
                                    <div className="space-y-4">
                                        <div className="bg-slate-950 border border-emerald-500/30 rounded-lg p-4 overflow-hidden">
                                            <div className="text-xs font-mono text-emerald-500 mb-2 uppercase tracking-wide">Step 1: System Persona (Resolved)</div>
                                            <div className="text-xs text-gray-400 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                                                {lastPrompts.system}
                                            </div>
                                        </div>
                                        <div className="bg-slate-950 border border-blue-500/30 rounded-lg p-4 overflow-hidden">
                                            <div className="text-xs font-mono text-blue-500 mb-2 uppercase tracking-wide">Step 2: User Brief (Injected)</div>
                                            <div className="text-xs text-gray-400 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                                                {lastPrompts.user}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-950/50 border border-dashed border-white/10 rounded-lg p-8 text-center text-gray-600 text-sm h-full flex flex-col justify-center items-center">
                                        <p>Run a generation to see the exact prompts constructed by the pipeline.</p>
                                    </div>
                                )}
                            </div>

                            {/* COST REPORT */}
                            <div>
                                <h3 className="text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                                    💰 Production Cost Report
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-gray-400">Est.</span>
                                </h3>

                                {lastUsage ? (
                                    <div className="bg-slate-950 border border-amber-500/30 rounded-lg p-6">
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Script Gen (Claude Opus 4.5)</div>
                                                <div className="text-2xl font-mono text-white">
                                                    ${((lastUsage.input * 15 / 1000000) + (lastUsage.output * 75 / 1000000)).toFixed(4)}
                                                </div>
                                                <div className="text-xs text-gray-600 font-mono">
                                                    {lastUsage.input} in / {lastUsage.output} out
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Voice (ElevenLabs)</div>
                                                <div className="text-2xl font-mono text-white">
                                                    ${(duration * 130 * 5 * 0.30 / 1000).toFixed(4)}
                                                </div>
                                                <div className="text-xs text-gray-600 font-mono">
                                                    ~{duration * 130 * 5} chars (Est)
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Visuals (DALL-E 3)</div>
                                                <div className="text-lg font-mono text-gray-300">$0.0800</div>
                                                <div className="text-xs text-gray-600 font-mono">2 images (Land/Port)</div>
                                            </div>
                                            {(category === 'motivation' || category === 'kids' || category === 'work_break' || category === 'music_instrumental' || category === 'fantasy') && (
                                                <div>
                                                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Music (Stable Audio)</div>
                                                    <div className="text-lg font-mono text-gray-300">$0.1000</div>
                                                    <div className="text-xs text-gray-600 font-mono">High Quality (or $0.00 if Reused)</div>
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-xs text-emerald-500 uppercase tracking-wide mb-1">Total Cost</div>
                                                <div className="text-lg font-bold font-mono text-emerald-400">
                                                    ${(
                                                        ((lastUsage.input * 15 / 1000000) + (lastUsage.output * 75 / 1000000)) +
                                                        (duration * 130 * 5 * 0.30 / 1000) +
                                                        0.08 +
                                                        ((category === 'motivation' || category === 'kids' || category === 'work_break' || category === 'music_instrumental' || category === 'fantasy') ? 0.10 : 0)
                                                    ).toFixed(4)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-950/50 border border-dashed border-white/10 rounded-lg p-8 text-center text-gray-600 text-sm h-full flex flex-col justify-center items-center">
                                        <p>Usage data will appear here after generation.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Error Viewer */}
                        {error && (
                            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs font-mono whitespace-pre-wrap">
                                <strong>Error Log:</strong><br />
                                {error.message || JSON.stringify(error)}
                                {error.debugEnv && (
                                    <div className="mt-2 pt-2 border-t border-rose-500/20">
                                        <pre>{JSON.stringify(error.debugEnv, null, 2)}</pre>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${loading
                                ? 'bg-slate-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <span>✨ Generate Story</span>
                                </>
                            )}
                        </button>
                    </div>
                </main>
            </div>
        </AdminGuard>
    );
}
