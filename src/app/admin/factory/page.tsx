'use client';

import { useState } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';

// V6.1 Factory - Simplified 2-Step Flow
export default function FactoryStudio() {
    const [step, setStep] = useState<1 | 2>(1);
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const isProduction = process.env.NODE_ENV === 'production';

    // Step 1: Input
    const [idea, setIdea] = useState('');
    const [category, setCategory] = useState('sleep');
    const [duration, setDuration] = useState(10);
    const [title, setTitle] = useState('');

    // Step 2: Concept Review
    const [concept, setConcept] = useState<any>(null);
    const [conceptPath, setConceptPath] = useState('');

    // Build result
    const [buildResult, setBuildResult] = useState<any>(null);
    const [buildLogs, setBuildLogs] = useState('');

    // Categories
    const CATEGORIES = [
        { id: 'sleep', label: '😴 Sleep Story', desc: 'Bedtime narratives' },
        { id: 'meditation', label: '🧘 Meditation', desc: 'Guided sessions' },
        { id: 'kids', label: '🧒 Kids', desc: 'Child-friendly tales' },
        { id: 'fantasy', label: '🏰 Fantasy', desc: 'Adventure stories' },
        { id: 'soundscape', label: '🌧️ Soundscape', desc: 'Pure ambience' },
        { id: 'music_instrumental', label: '🎵 Instrumental', desc: 'Music only' },
    ];

    // Duration presets
    const DURATIONS = [
        { min: 5, label: '5 min' },
        { min: 10, label: '10 min' },
        { min: 20, label: '20 min' },
        { min: 30, label: '30 min' },
    ];

    // Step 1: Generate Concept
    const handleGenerateConcept = async () => {
        if (!idea.trim()) {
            setStatus('❌ Please enter a concept idea');
            return;
        }

        setIsLoading(true);
        setConcept(null);
        setConceptPath('');
        setStatus('🧠 Generating concept with Claude...');

        try {
            const res = await fetch('/api/factory/concept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idea,
                    category,
                    duration,
                    title: title || undefined,
                    generationMode: 'phased' // V6 default
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Concept generation failed');
            }

            const result = await res.json();

            if (result.success && result.concept) {
                setConcept(result.concept);
                setConceptPath(result.filePath);
                setStep(2);
                setStatus('✅ Concept ready for review!');
            } else {
                throw new Error(result.error || 'Invalid response');
            }

        } catch (e: any) {
            setStatus(`❌ Error: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Build from Concept
    const handleBuild = async () => {
        if (!conceptPath) {
            setStatus('❌ No concept to build from');
            return;
        }

        setIsLoading(true);
        setBuildLogs('');
        setBuildResult(null);
        setStatus('🏗️ Building story (this takes 2-5 minutes)...');

        try {
            const res = await fetch('/api/factory/build', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conceptPath })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Build failed');
            }

            const result = await res.json();

            if (result.success) {
                setBuildResult(result);
                setBuildLogs(result.logs || 'Build complete');
                setStatus('✅ Story generated and uploaded!');
            } else {
                throw new Error(result.error || 'Build failed');
            }

        } catch (e: any) {
            setStatus(`❌ Build error: ${e.message}`);
            setBuildLogs(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Reset to Step 1
    const handleNewStory = () => {
        setStep(1);
        setConcept(null);
        setConceptPath('');
        setBuildResult(null);
        setBuildLogs('');
        setIdea('');
        setTitle('');
        setStatus('');
    };

    return (
        <AdminGuard>
            <AdminLayout
                title={
                    <div className="flex items-center gap-3">
                        Audio Factory
                        <span className="text-emerald-400 text-xs px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 font-mono">V6.1</span>
                    </div>
                }
                subtitle={step === 1 ? "Step 1: Define your story concept" : "Step 2: Review and build"}
                backLink={{ href: '/admin', label: 'Dashboard' }}
            >
                {/* Production Warning */}
                {isProduction && (
                    <div className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-amber-900/20 border border-amber-500/30 text-amber-200">
                        <span className="text-xl">⚠️</span>
                        <div>
                            <span className="font-bold">Production Mode:</span> Run locally (<code className="bg-black/30 px-1 rounded">npm run dev</code>) to generate.
                        </div>
                    </div>
                )}

                {/* Step Indicator */}
                <div className="mb-6 flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-gray-400'}`}>
                        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">1</span>
                        <span>Concept</span>
                    </div>
                    <div className="w-8 h-0.5 bg-slate-700" />
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${step === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-gray-400'}`}>
                        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">2</span>
                        <span>Build</span>
                    </div>
                </div>

                {/* Status */}
                <AnimatePresence>
                    {status && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`mb-6 p-4 rounded-xl flex justify-between items-center ${status.startsWith('✅') ? 'bg-emerald-900/20 border border-emerald-500/30 text-emerald-300' :
                                    status.startsWith('❌') ? 'bg-red-900/20 border border-red-500/30 text-red-300' :
                                        'bg-indigo-900/20 border border-indigo-500/30 text-indigo-300'
                                }`}
                        >
                            <span className="font-medium">{status}</span>
                            <button onClick={() => setStatus('')} className="opacity-50 hover:opacity-100">×</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* STEP 1: Input Form */}
                {step === 1 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            {/* Category */}
                            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                                <h2 className="text-lg font-bold text-white mb-4">Category</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setCategory(cat.id)}
                                            className={`p-4 rounded-xl text-left transition border ${category === cat.id
                                                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                                                    : 'bg-slate-950 border-white/5 text-gray-400 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="text-lg">{cat.label}</div>
                                            <div className="text-xs text-gray-500">{cat.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                                <h2 className="text-lg font-bold text-white mb-4">Duration</h2>
                                <div className="flex gap-3">
                                    {DURATIONS.map(d => (
                                        <button
                                            key={d.min}
                                            onClick={() => setDuration(d.min)}
                                            className={`flex-1 py-4 rounded-xl text-center transition border ${duration === d.min
                                                    ? 'bg-violet-600/20 border-violet-500 text-white'
                                                    : 'bg-slate-950 border-white/5 text-gray-400 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="text-xl font-bold">{d.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Title (Optional) */}
                            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                                <h2 className="text-lg font-bold text-white mb-4">Title <span className="text-gray-500 text-sm font-normal">(optional)</span></h2>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Leave empty for AI-generated title"
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            {/* Concept Idea */}
                            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                                <h2 className="text-lg font-bold text-white mb-4">Story Idea</h2>
                                <textarea
                                    value={idea}
                                    onChange={(e) => setIdea(e.target.value)}
                                    placeholder="A peaceful journey through a moonlit forest, with gentle wind and distant owl calls..."
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white h-40 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Claude will expand this into a full creative brief with characters, setting, and audio design.
                                </p>
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerateConcept}
                                disabled={isLoading || !idea.trim() || isProduction}
                                className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:grayscale rounded-2xl font-bold text-white text-lg shadow-2xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        <span>Generating Concept...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-2xl">🧠</span>
                                        <span>Generate Concept</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: Review & Build */}
                {step === 2 && concept && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Concept Preview */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">{concept.title}</h2>
                                        <p className="text-gray-400 mt-1">{concept.logline}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {concept.tags?.slice(0, 4).map((tag: string) => (
                                            <span key={tag} className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    {/* Setting */}
                                    <div className="bg-slate-950 rounded-xl p-4">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Setting</h3>
                                        <p className="text-white">{concept.setting?.location}</p>
                                        <p className="text-gray-400 text-sm mt-1">{concept.setting?.atmosphere}</p>
                                    </div>

                                    {/* Audio */}
                                    <div className="bg-slate-950 rounded-xl p-4">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Audio Design</h3>
                                        <div className="space-y-1 text-sm">
                                            <p><span className="text-gray-500">Voice:</span> <span className="text-white">{concept.audioIdentity?.voiceStyle}</span></p>
                                            <p><span className="text-gray-500">Music:</span> <span className="text-white">{concept.audioIdentity?.musicStyle || '-'}</span></p>
                                            <p><span className="text-gray-500">Ambience:</span> <span className="text-white">{concept.audioIdentity?.ambienceLayer || '-'}</span></p>
                                        </div>
                                    </div>

                                    {/* Character */}
                                    {concept.protagonist && (
                                        <div className="bg-slate-950 rounded-xl p-4">
                                            <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Protagonist</h3>
                                            <p className="text-white">{concept.protagonist.name || 'The Listener'}</p>
                                            <p className="text-gray-400 text-sm">{concept.protagonist.role}</p>
                                        </div>
                                    )}

                                    {/* Narrative Arc */}
                                    {concept.narrativeArc && (
                                        <div className="bg-slate-950 rounded-xl p-4">
                                            <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Story Arc</h3>
                                            <p className="text-gray-400 text-sm">{concept.narrativeArc.hook}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Visual Style */}
                                {concept.visualStyle?.coverConcept && (
                                    <div className="mt-4 bg-slate-950 rounded-xl p-4">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Cover Concept</h3>
                                        <p className="text-gray-300 text-sm">{concept.visualStyle.coverConcept}</p>
                                    </div>
                                )}
                            </div>

                            {/* Build Logs */}
                            {buildLogs && (
                                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-white mb-4">Build Output</h3>
                                    <pre className="bg-slate-950 p-4 rounded-xl text-xs text-gray-400 overflow-auto max-h-64 font-mono">
                                        {buildLogs}
                                    </pre>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="space-y-4">
                            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-white mb-4">Ready to Build?</h3>
                                <p className="text-gray-400 text-sm mb-6">
                                    This will generate voice narration, background music, ambient sounds, and cover art.
                                </p>

                                {!buildResult ? (
                                    <button
                                        onClick={handleBuild}
                                        disabled={isLoading || isProduction}
                                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:grayscale rounded-xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="animate-spin">⏳</span>
                                                <span>Building...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>🚀</span>
                                                <span>Build Story</span>
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-xl">
                                            <div className="text-emerald-400 font-bold">✅ Story Created!</div>
                                            <p className="text-sm text-gray-300 mt-1">
                                                ID: <code className="bg-black/30 px-2 py-1 rounded">{buildResult.storyId}</code>
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleNewStory}
                                            className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white transition"
                                        >
                                            Create Another Story
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleNewStory}
                                disabled={isLoading}
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-gray-300 transition"
                            >
                                ← Start Over
                            </button>

                            {/* Pipeline Info */}
                            <div className="bg-slate-900/30 border border-white/5 rounded-xl p-4 text-xs text-gray-500">
                                <strong className="text-gray-400">Build includes:</strong>
                                <ul className="mt-2 space-y-1">
                                    <li>🎙️ Voice (Qwen TTS)</li>
                                    <li>🎵 Music (Stable Audio)</li>
                                    <li>🌧️ Ambience (Stable Audio)</li>
                                    <li>🖼️ Cover Art (DALL-E 3)</li>
                                    <li>☁️ Upload to Supabase</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </AdminLayout>
        </AdminGuard>
    );
}
