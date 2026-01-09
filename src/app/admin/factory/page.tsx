
'use client';

import { useState } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function FactoryStudio() {
    const [activeTab, setActiveTab] = useState<'concept' | 'production'>('concept');
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Concept State
    const [idea, setIdea] = useState('');
    const [category, setCategory] = useState('sleep');
    const [generatedConcept, setGeneratedConcept] = useState<any>(null);
    const [conceptPath, setConceptPath] = useState('');

    // Production State
    const [productionLogs, setProductionLogs] = useState('');
    const [builtStoryId, setBuiltStoryId] = useState('');

    const handleGenerateConcept = async () => {
        if (!idea) return;
        setIsLoading(true);
        setStatus('🧠 Dreaming up concept... (this takes ~30s)');
        setGeneratedConcept(null);

        try {
            const res = await fetch('/api/factory/concept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idea, category })
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
            if (!res.ok) throw new Error(data.error);

            setBuiltStoryId(data.storyId);
            setProductionLogs(data.logs); // Full logs
            setStatus('✅ Build Complete!');
        } catch (e: any) {
            setStatus(`❌ Build Failed: ${e.message}`);
            if (e.logs) setProductionLogs(e.logs);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AdminGuard>
            <div className="min-h-screen bg-slate-950 pb-20 text-white">
                <header className="bg-slate-900 border-b border-white/5 sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link href="/admin" className="text-gray-400 hover:text-white">← Back</Link>
                            <h1 className="text-xl font-bold ml-4">Factory Studio <span className="text-indigo-400 text-xs px-2 py-0.5 bg-indigo-500/10 rounded-full border border-indigo-500/20">V5.0</span></h1>
                        </div>
                    </div>
                </header>

                <main className="max-w-5xl mx-auto px-4 py-8">
                    {/* Status Bar */}
                    {status && (
                        <div className={`mb-6 p-4 rounded-lg flex justify-between items-center ${status.startsWith('❌') ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'}`}>
                            <span className="font-medium animate-pulse">{status}</span>
                            <button onClick={() => setStatus('')} className="opacity-50 hover:opacity-100">×</button>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-white/10 mb-8">
                        <button
                            onClick={() => setActiveTab('concept')}
                            className={`pb-4 px-2 text-sm font-medium transition relative ${activeTab === 'concept' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            1. Concept Lab (Ideation)
                            {activeTab === 'concept' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('production')}
                            disabled={!generatedConcept}
                            className={`pb-4 px-2 text-sm font-medium transition relative ${activeTab === 'production' ? 'text-white' : 'text-gray-500'} ${!generatedConcept && 'opacity-30 cursor-not-allowed'}`}
                        >
                            2. Production (Build)
                            {activeTab === 'production' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500" />}
                        </button>
                    </div>

                    <div className="min-h-[500px]">
                        {activeTab === 'concept' ? (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 md:p-8">
                                    <div className="mb-8">
                                        <h2 className="text-2xl font-bold mb-2">Dream up a Concept</h2>
                                        <p className="text-gray-400">The Factory uses a "Showrunner AI" to flesh out your ideas before writing a script.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Core Idea</label>
                                            <textarea
                                                value={idea}
                                                onChange={(e) => setIdea(e.target.value)}
                                                placeholder="e.g. A young boy finds a map to the stars, but instead of gold, it leads to lost memories."
                                                className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white h-32 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                                <div>
                                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Narrative</div>
                                                    <div className="space-y-1">
                                                        {['sleep', 'kids', 'fantasy', 'meditation', 'nature', 'motivation', 'work_break'].map(cat => (
                                                            <button
                                                                key={cat}
                                                                onClick={() => setCategory(cat)}
                                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition border ${category === cat ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-white/5 text-gray-400 hover:border-white/20'}`}
                                                            >
                                                                {cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 mt-4">Pure Audio</div>
                                                    <div className="space-y-1">
                                                        {['soundscape', 'binaural', 'music_instrumental'].map(cat => (
                                                            <button
                                                                key={cat}
                                                                onClick={() => setCategory(cat)}
                                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition border ${category === cat ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-white/5 text-gray-400 hover:border-white/20'}`}
                                                            >
                                                                {cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-white/5">
                                        <button
                                            onClick={handleGenerateConcept}
                                            disabled={isLoading || !idea}
                                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition flex items-center gap-2"
                                        >
                                            {isLoading ? 'Dreaming...' : '✨ Draft Concept'}
                                        </button>
                                    </div>
                                </div>

                                {/* Concept Result Preview */}
                                {generatedConcept && (
                                    <div className="mt-8 bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                                        <div className="p-4 bg-slate-800/50 border-b border-white/5 flex justify-between items-center">
                                            <h3 className="font-bold text-indigo-400">Concept Draft: "{generatedConcept.title}"</h3>
                                            <button
                                                onClick={() => setActiveTab('production')}
                                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold uppercase tracking-wide transition"
                                            >
                                                Approve & Build →
                                            </button>
                                        </div>
                                        <div className="p-0">
                                            <div className="grid grid-cols-2 text-sm">
                                                <div className="p-6 border-r border-white/5 space-y-4">
                                                    <div>
                                                        <span className="text-gray-500 block text-xs uppercase mb-1">Logline</span>
                                                        <p className="text-gray-300 italic">"{generatedConcept.logline}"</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block text-xs uppercase mb-1">Protagonist</span>
                                                        <div className="text-white font-medium">{generatedConcept.protagonist?.name || 'Unknown'}</div>
                                                        <div className="text-gray-400">{generatedConcept.protagonist?.role} • {generatedConcept.protagonist?.desire}</div>
                                                    </div>
                                                </div>
                                                <div className="p-6 space-y-4">
                                                    <div>
                                                        <span className="text-gray-500 block text-xs uppercase mb-1">Audio Identity</span>
                                                        <ul className="text-gray-400 space-y-1">
                                                            <li>🎵 {generatedConcept.audioIdentity?.musicStyle || 'N/A'}</li>
                                                            <li>🎤 {generatedConcept.audioIdentity?.voiceStyle} ({generatedConcept.audioIdentity?.voicePacing})</li>
                                                            <li>🔊 {generatedConcept.audioIdentity?.keySoundEffects?.join(', ') || 'None'}</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-slate-950 border-t border-white/5">
                                                <details>
                                                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-white transition">View Full JSON Source</summary>
                                                    <pre className="mt-4 text-xs font-mono text-gray-400 overflow-x-auto">
                                                        {JSON.stringify(generatedConcept, null, 2)}
                                                    </pre>
                                                </details>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 md:p-8">
                                    <div className="mb-8 flex items-center justify-between">
                                        <div>
                                            <h2 className="text-2xl font-bold mb-2">Production Floor</h2>
                                            <p className="text-gray-400">Ready to build "{generatedConcept?.title}".</p>
                                        </div>
                                        {!builtStoryId && (
                                            <button
                                                onClick={handleBuildStory}
                                                disabled={isLoading}
                                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
                                            >
                                                {isLoading ? 'Building...' : '🏗️ Start Production'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Terminal / Logs */}
                                    <div className="bg-slate-950 rounded-xl border border-white/10 p-4 font-mono text-xs h-[400px] overflow-y-auto relative">
                                        <div className="absolute top-2 right-2 text-gray-600 text-[10px] uppercase tracking-wider">Factory Logs</div>
                                        {productionLogs ? (
                                            <pre className="text-gray-300 whitespace-pre-wrap leading-relaxed">{productionLogs}</pre>
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-gray-600 italic">
                                                Waiting for production command...
                                            </div>
                                        )}
                                    </div>

                                    {/* Success Action */}
                                    {builtStoryId && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-6 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex justify-between items-center"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-black text-2xl">✓</div>
                                                <div>
                                                    <div className="font-bold text-emerald-400">Story Produced Successfully</div>
                                                    <div className="text-sm text-emerald-500/60">ID: {builtStoryId}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                {/* <Link href={`/admin/stories/preview/${builtStoryId}`} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-white font-medium transition">
                                                    Quick Preview
                                                </Link> */}
                                                <Link href={`/admin/stories/editor?id=${builtStoryId}`} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm text-white font-bold transition shadow-lg shadow-emerald-500/20">
                                                    Open in Super Editor →
                                                </Link>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </main>
            </div>
        </AdminGuard>
    );
}
