'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Moon, Sparkles, Wind, Headphones, PlayCircle } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-hidden font-sans">

            {/* --- NAVBAR --- */}
            <nav className="absolute top-0 left-0 right-0 z-50 p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">S</div>
                    <span className="text-xl font-bold tracking-tight">Softale</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/login" className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white transition">
                        Log In
                    </Link>
                    <Link href="/login" className="px-5 py-2 text-sm font-medium bg-white text-slate-900 rounded-full hover:bg-slate-200 transition">
                        Start for Free
                    </Link>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <section className="relative min-h-screen flex items-center justify-center pt-20 px-6">

                {/* Background Glows */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px]" />

                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-800 backdrop-blur-sm mb-6">
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                            <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">The Future of Relaxation</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 leading-[1.1]">
                            Sleep Better.<br />
                            Focus Deeper.<br />
                            Dream Bigger.
                        </h1>

                        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                            Softale creates personalized soundscapes and AI-narrated stories tailored to your mood.
                            From deep sleep to laser focus, find your perfect rhythm.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-lg transition flex items-center justify-center gap-2 group shadow-xl shadow-indigo-500/20">
                                Start Your Journey
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                            </Link>
                            <button className="w-full sm:w-auto px-8 py-4 bg-slate-900/50 hover:bg-slate-800 text-white rounded-full font-bold text-lg transition border border-slate-800 backdrop-blur-sm flex items-center justify-center gap-2">
                                <PlayCircle className="w-5 h-5 text-indigo-400" />
                                Listen Preview
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- FEATURES GRID --- */}
            <section className="py-24 px-6 bg-slate-950 relative">
                <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">

                    {/* Feature 1 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/30 transition group"
                    >
                        <div className="w-12 h-12 bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                            <Headphones className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Spatial Audio</h3>
                        <p className="text-slate-400">Immersive 3D soundscapes designed to transport you instantly to a forest, a beach, or deep space.</p>
                    </motion.div>

                    {/* Feature 2 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/30 transition group"
                    >
                        <div className="w-12 h-12 bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                            <Moon className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">AI Sleep Stories</h3>
                        <p className="text-slate-400">Never hear the same story twice. Our AI weaves unique bedtime tales tailored to help you drift off.</p>
                    </motion.div>

                    {/* Feature 3 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 transition group"
                    >
                        <div className="w-12 h-12 bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                            <Wind className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Mood Matching</h3>
                        <p className="text-slate-400">Feeling anxious? Need focus? Softale adapts the ambience and narration to your current state of mind.</p>
                    </motion.div>

                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-12 px-6 border-t border-slate-900 text-center text-slate-500 text-sm">
                <div className="flex justify-center gap-8 mb-8">
                    <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
                    <Link href="/terms" className="hover:text-white transition">Terms</Link>
                    <Link href="mailto:support@softale.app" className="hover:text-white transition">Contact</Link>
                </div>
                <p>&copy; 2026 Softale. All rights reserved.</p>
            </footer>

        </div>
    );
}
