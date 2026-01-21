'use client';

import { useState } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function FactoryStudio() {
    const [activeTab, setActiveTab] = useState<'concept' | 'production'>('concept');
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const isProduction = process.env.NODE_ENV === 'production';

    // Concept State (V5)
    const [title, setTitle] = useState('');
    const [idea, setIdea] = useState('');
    const [category, setCategory] = useState('sleep');
    const [duration, setDuration] = useState(10);
    const [mixSettings, setMixSettings] = useState({
        voice: 80,
        music: 12,
        ambience: 12
    });

    // V6 Generation Mode
    const [generationMode, setGenerationMode] = useState<'auto' | 'continuous' | 'phased'>('auto');
    const [showAdvanced, setShowAdvanced] = useState(false);

    // V5 Feature Controls
    const [pacingMode, setPacingMode] = useState('immersive');
    const [warmupDuration, setWarmupDuration] = useState(0);
    const [ambiencePrompt, setAmbiencePrompt] = useState('');

    const [generatedConcept, setGeneratedConcept] = useState<any>(null);
    const [conceptPath, setConceptPath] = useState('');

    // Production State
    const [productionLogs, setProductionLogs] = useState('');
    const [builtStoryId, setBuiltStoryId] = useState('');

    // Quick Presets
    const QUICK_PRESETS = [
        { label: '🧘 Meditation', category: 'meditation', mode: 'phased' as const, duration: 5, voice: 80, music: 0, ambience: 20 },
        { label: '😴 Sleep Story', category: 'sleep', mode: 'phased' as const, duration: 20, voice: 70, music: 15, ambience: 15 },
        { label: '🎵 Instrumental', category: 'music_instrumental', mode: 'continuous' as const, duration: 30, voice: 0, music: 100, ambience: 0 },
        { label: '🌧️ Soundscape', category: 'soundscape', mode: 'continuous' as const, duration: 60, voice: 0, music: 0, ambience: 100 },
    ];

    const applyPreset = (preset: typeof QUICK_PRESETS[0]) => {
        setCategory(preset.category);
        setGenerationMode(preset.mode);
        setDuration(preset.duration);
        setMixSettings({ voice: preset.voice, music: preset.music, ambience: preset.ambience });
    };

    const handleGenerateConcept = async () => {
        if (!idea) return;
        setIsLoading(true);
        setStatus('🧠 Dreaming up concept... (this takes ~30s)');
        setGeneratedConcept(null);

        try {
            const res = await fetch('/api/factory/concept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    idea,
                    category,
                    duration,
                    generationMode, // V6
                    pacingMode,
                    warmupDuration,
                    ambiencePrompt,
                    mixSettings: {
                        voice: mixSettings.voice / 25.0,
                        music: mixSettings.music / 100.0,
                        ambience: mixSettings.ambience / 100.0
                    },
                    layers: {
                        voice: mixSettings.voice > 0,
                        music: mixSettings.music > 0,
                        ambience: mixSettings.ambience > 0
                    }
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setGeneratedConcept(data.concept);
            setConceptPath(data.filePath);
            setStatus('✨ Concept Created! Review it below.');
            // Switch intention to next step
        } catch (e: any) {
            setStatus(`❌ Error: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBuildStory = async () => {
        if (!conceptPath) return;
        setIsLoading(true);
        setStatus('🏗️ Building Story... (this takes 2-4 mins)');
        setProductionLogs('Initializing Factory Build...\n');

        try {
            const res = await fetch('/api/factory/build', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conceptPath })
            });

            const data = await res.json();
            if (!res.ok) {
                if (data.logs) setProductionLogs(data.logs);
                throw new Error(data.error);
            }

            setBuiltStoryId(data.storyId);
            setProductionLogs(data.logs); // Full logs
            setStatus('✅ Build Complete!');
        } catch (e: any) {
            setStatus(`❌ Build Failed: ${e.message}`);
            // Logs usually streamed or returned on error too
            if (e.logs) setProductionLogs(e.logs);
        } finally {
            setIsLoading(false);
        }
    };

    const CATEGORIES = ['sleep', 'meditation', 'nature', 'fantasy', 'soundscape', 'binaural', 'music_instrumental', 'motivation', 'work_break', 'kids'];

    return (
        <AdminGuard>
            <AdminLayout
                title={
                    <div className="flex items-center gap-3">
                        Factory Studio
                        <span className="text-emerald-400 text-xs px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 font-mono">V6</span>
                    </div>
                }
                subtitle="Generate AI-powered audio with phased narration support"
                backLink={{ href: '/admin', label: 'Dashboard' }}
            >
                {/* Status Bar */}
                {isProduction && (
                    <div className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-amber-900/20 border border-amber-500/30 text-amber-200">
                        <span className="text-xl">⚠️</span>
                        <div>
                            <span className="font-bold">Production Mode Detected:</span> Generation features are disabled to prevent timeouts.
                            Please run the app locally (<code className="bg-black/30 px-1 rounded">npm run dev</code>) to generate content.
                        </div>
                    </div>
                )}
                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-6 p-4 rounded-xl flex justify-between items-center bg-slate-900 border ${status.startsWith('❌') ? 'border-red-500/20 text-red-400' : 'border-indigo-500/20 text-indigo-300'}`}
                    >
                        <span className="font-medium animate-pulse flex items-center gap-3">
                            {status.startsWith('❌') ? '🛑' : '⚡'} {status}
                        </span>
                        <button onClick={() => setStatus('')} className="opacity-50 hover:opacity-100">×</button>
                    </motion.div>
                )}

                <div className="grid grid-cols-12 gap-8 items-start">
                    {/* LEFT COLUMN: CONTROL CENTER (Sticky) */}
                    <div className="col-span-12 lg:col-span-4 lg:sticky lg:top-8 space-y-6">

                        {/* 1. INPUT CARD */}
                        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-2xl space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span className="w-2 h-8 bg-indigo-500 rounded-full" />
                                    1. The Spark
                                </h2>
                                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Input</div>
                            </div>

                            {/* Quick Presets */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Quick Start</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {QUICK_PRESETS.map(preset => (
                                        <button
                                            key={preset.label}
                                            onClick={() => applyPreset(preset)}
                                            className="px-3 py-2 rounded-lg text-xs font-medium transition border bg-slate-950 border-white/5 text-gray-400 hover:border-indigo-500/50 hover:text-indigo-300 hover:bg-indigo-500/5 text-left"
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Generation Mode Toggle */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Generation Mode</label>
                                <div className="flex gap-1 p-1 bg-slate-950 rounded-lg border border-white/5">
                                    {(['auto', 'continuous', 'phased'] as const).map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => setGenerationMode(mode)}
                                            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition ${generationMode === mode
                                                ? mode === 'phased' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                                                : 'text-gray-500 hover:text-white'
                                                }`}
                                        >
                                            {mode === 'auto' ? '🔄 Auto' : mode === 'continuous' ? '📜 Full' : '🔀 Phased'}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-gray-600 mt-1 ml-1">
                                    {generationMode === 'auto' && 'Phased for meditation/sleep, continuous for others'}
                                    {generationMode === 'continuous' && 'Full narration throughout (V5)'}
                                    {generationMode === 'phased' && 'Breaks into silence phases (V6) - 40% cost savings'}
                                </p>
                            </div>

                            {/* Title Input */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Title (Optional)</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="E.g. Nordic Piano"
                                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            {/* Core Concept */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Core Concept / Premise</label>
                                <textarea
                                    value={idea}
                                    onChange={(e) => setIdea(e.target.value)}
                                    placeholder="Describe the mood, story, or feeling..."
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white h-24 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition text-sm"
                                />
                            </div>

                            {/* Ambience Prompt (Optional) */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Ambience Layer (Optional)</label>
                                <input
                                    type="text"
                                    value={ambiencePrompt}
                                    onChange={(e) => setAmbiencePrompt(e.target.value)}
                                    placeholder="E.g. Distant rain, crackling fire..."
                                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            {/* Genre Selector */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Genre</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategory(cat)}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium transition border text-left ${category === cat
                                                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                                                : 'bg-slate-950 border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-400'}`}
                                        >
                                            {cat === 'music_instrumental' ? '🎵 Instrumental' :
                                                cat === 'work_break' ? '☕ Work Break' :
                                                    cat === 'kids' ? '🧒 Kids' :
                                                        cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* V5 Controls: Duration, Mix, Warmup */}
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Duration</label>
                                    <div className="bg-slate-950 p-3 rounded-lg border border-white/5">
                                        <div className="flex justify-between text-indigo-400 font-bold text-sm mb-2">{duration} min</div>
                                        <input
                                            type="range" min="3" max="60" step="1"
                                            value={duration} onChange={(e) => setDuration(parseInt(e.target.value))}
                                            className="w-full h-1 bg-slate-800 rounded-full appearance-none accent-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Mix Levels (%)</label>
                                    <div className="bg-slate-950 p-3 rounded-lg border border-white/5 space-y-3">
                                        {/* Voice Slider */}
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-400">🎤 Voice</span>
                                                <span className="text-indigo-400 font-mono">{Math.round(mixSettings.voice)}%</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="100" step="5"
                                                value={mixSettings.voice}
                                                onChange={(e) => setMixSettings({ ...mixSettings, voice: parseInt(e.target.value) })}
                                                className="w-full h-1 bg-slate-800 rounded-full appearance-none accent-indigo-500"
                                            />
                                        </div>
                                        {/* Music Slider */}
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-400">🎹 Music</span>
                                                <span className="text-indigo-400 font-mono">{Math.round(mixSettings.music)}%</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="100" step="5"
                                                value={mixSettings.music}
                                                onChange={(e) => setMixSettings({ ...mixSettings, music: parseInt(e.target.value) })}
                                                className="w-full h-1 bg-slate-800 rounded-full appearance-none accent-purple-500"
                                            />
                                        </div>
                                        {/* Ambience Slider */}
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-400">🌧️ Ambience</span>
                                                <span className="text-indigo-400 font-mono">{Math.round(mixSettings.ambience)}%</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="100" step="5"
                                                value={mixSettings.ambience}
                                                onChange={(e) => setMixSettings({ ...mixSettings, ambience: parseInt(e.target.value) })}
                                                className="w-full h-1 bg-slate-800 rounded-full appearance-none accent-cyan-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Warm-up</label>
                                    <div className="bg-slate-950 p-3 rounded-lg border border-white/5">
                                        <div className="flex justify-between text-amber-400 font-bold text-sm mb-2">{warmupDuration}s</div>
                                        <input
                                            type="range" min="0" max="60" step="5"
                                            value={warmupDuration} onChange={(e) => setWarmupDuration(parseInt(e.target.value))}
                                            className="w-full h-1 bg-slate-800 rounded-full appearance-none accent-amber-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Pacing</label>
                                    <select
                                        value={pacingMode}
                                        onChange={(e) => setPacingMode(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white text-xs h-[52px] focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="standard">Standard</option>
                                        <option value="immersive">Immersive (V5)</option>
                                        <option value="breathwork">Breathwork</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* ACTION BUTTON */}
                        <button
                            onClick={handleGenerateConcept}
                            disabled={isLoading || !idea || isProduction}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:grayscale rounded-xl font-bold text-white shadow-xl shadow-indigo-900/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <span className="animate-pulse">Processing...</span>
                            ) : (
                                <><span>✨</span> Generate V5 Concept</>
                            )}
                        </button>
                    </div>

                    {/* RIGHT COLUMN: WORKBENCH */}
                    <div className="col-span-12 lg:col-span-8 space-y-6">

                        {/* TABS (Visual only now, handled by state) */}
                        <div className="flex items-center gap-1 p-1 bg-slate-900/50 rounded-xl w-fit border border-white/5">
                            <button
                                onClick={() => setActiveTab('concept')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'concept' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                Concept Lab
                            </button>
                            <button
                                onClick={() => setActiveTab('production')}
                                disabled={!generatedConcept}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'production' ? 'bg-emerald-600/90 text-white shadow-lg' : 'text-gray-500'}`}
                            >
                                Production Floor
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            {activeTab === 'concept' ? (
                                <motion.div
                                    key="concept-panel"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    {!generatedConcept ? (
                                        <div className="h-[500px] border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-gray-600">
                                            <div className="text-6xl mb-4 opacity-20">🧪</div>
                                            <p>Waiting for V5 input...</p>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                                            <div className="h-32 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 relative">
                                                <div className="absolute bottom-6 left-8">
                                                    <div className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2">Generated Concept</div>
                                                    <h1 className="text-3xl font-black text-white">{generatedConcept.title}</h1>
                                                </div>
                                            </div>

                                            <div className="p-8 grid grid-cols-2 gap-12">
                                                <div className="space-y-6">
                                                    <div>
                                                        <h3 className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-2">Logline</h3>
                                                        <p className="text-lg text-gray-200 leading-relaxed font-light">"{generatedConcept.logline}"</p>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-2">Narrative Core</h3>
                                                        <div className="bg-slate-950 p-4 rounded-xl border border-white/5 space-y-2">
                                                            <div className="flex justify-between border-b border-white/5 pb-2">
                                                                <span className="text-gray-500 text-sm">Protagonist</span>
                                                                <span className="text-white text-sm font-medium">{generatedConcept.protagonist?.name || 'N/A'}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-white/5 pb-2">
                                                                <span className="text-gray-500 text-sm">Theme</span>
                                                                <span className="text-white text-sm font-medium">{generatedConcept.theme}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500 text-sm">Mood</span>
                                                                <span className="text-white text-sm font-medium">{generatedConcept.mood}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-2">AI Tags</h3>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(generatedConcept.tags || []).map((tag: any) => (
                                                                <span key={tag} className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase rounded border border-indigo-500/30">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div>
                                                        <h3 className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-2">Audio Engineering</h3>
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                                                <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-lg">🎵</span>
                                                                <div>
                                                                    <div className="font-bold text-white">Music Style</div>
                                                                    <div className="text-xs text-gray-500">{generatedConcept.audioIdentity?.musicStyle || 'Ambient'}</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                                                <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-lg">🎙️</span>
                                                                <div>
                                                                    <div className="font-bold text-white">Voice Direction</div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {generatedConcept.audioIdentity?.voiceStyle || 'None'} • {pacingMode}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => setActiveTab('production')}
                                                        className="w-full py-4 mt-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition flex items-center justify-center gap-2 group"
                                                    >
                                                        Proceed to Production <span className="group-hover:translate-x-1 transition">→</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="production-panel"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                    className="bg-slate-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[600px]"
                                >
                                    <div className="bg-slate-900 p-4 border-b border-white/5 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-red-500" />
                                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                            <div className="w-3 h-3 rounded-full bg-green-500" />
                                            <span className="ml-2 font-mono text-xs text-gray-500">FACTORY_TERMINAL_V5</span>
                                        </div>
                                        {!builtStoryId && (
                                            <button
                                                onClick={handleBuildStory}
                                                disabled={isLoading || isProduction}
                                                className="px-4 py-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 rounded text-xs font-mono uppercase tracking-widest transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isLoading ? 'EXECUTING...' : 'RUN_BUILD_SEQUENCE'}
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex-1 bg-black/50 p-6 font-mono text-xs text-green-500/80 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                                        {productionLogs || "// SYSTEM READY..."}
                                        {isLoading && <span className="animate-pulse">_</span>}
                                    </div>

                                    {builtStoryId && (
                                        <div className="p-6 bg-emerald-900/10 border-t border-emerald-500/20">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="text-emerald-400 font-bold text-lg mb-1">Build Successful</div>
                                                    <div className="text-emerald-500/50 text-xs">{builtStoryId}</div>
                                                </div>
                                                <Link href={`/admin/stories/editor?id=${builtStoryId}`} className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:scale-105 transition shadow-xl">
                                                    Open Editor →
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </AdminLayout>
        </AdminGuard>
    );
}
