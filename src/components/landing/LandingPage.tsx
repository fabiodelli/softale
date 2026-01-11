'use client';

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import { ArrowRight, Play, Pause, Wind, Moon, Zap, Headphones, ChevronRight, Star } from 'lucide-react';
import Link from 'next/link';

interface LandingPageProps {
    onEnterApp: () => void;
}

export default function LandingPage({ onEnterApp }: LandingPageProps) {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.1]);
    const textY = useTransform(scrollYProgress, [0, 0.3], [0, 100]);

    return (
        <div ref={containerRef} className="bg-slate-50 min-h-screen font-sans selection:bg-indigo-100 overflow-x-hidden">

            {/* --- HERO SECTION --- */}
            <div className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* Background (Video Placeholder) */}
                <motion.div
                    style={{ opacity: heroOpacity, scale: heroScale }}
                    className="absolute inset-0 z-0"
                >
                    {/* Using the Vision Hero image for now, but ready for video */}
                    <img
                        src="/assets/vision-hero.png"
                        alt="Ethereal Background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-50" />
                </motion.div>

                {/* Navbar (Absolute) */}
                <nav className="absolute top-0 left-0 right-0 z-50 p-6 flex items-center justify-between max-w-7xl mx-auto w-full text-white">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center text-white font-bold border border-white/20">S</div>
                        <span className="text-xl font-bold tracking-tight">Softale</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="px-5 py-2 text-sm font-medium text-white/80 hover:text-white transition">
                            Log In
                        </Link>
                        <button
                            onClick={onEnterApp}
                            className="px-5 py-2 text-sm font-bold bg-white text-slate-900 rounded-full hover:bg-slate-200 transition shadow-lg shadow-white/10"
                        >
                            Start App
                        </button>
                    </div>
                </nav>

                {/* Content */}
                <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
                    <motion.div style={{ y: textY }}>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <span className="inline-block px-4 py-1.5 rounded-full border border-white/30 text-white/90 text-sm font-medium tracking-wide backdrop-blur-md mb-8 shadow-lg shadow-black/10">
                                The First Adaptive Audio Sanctuary
                            </span>
                            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9] drop-shadow-sm">
                                Silence in the <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-orange-100">Signal.</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-slate-200 max-w-2xl mx-auto font-light leading-relaxed mb-12">
                                In a world screaming for your attention, <br />we offer a sanctuary for your mind.
                            </p>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onEnterApp}
                                className="inline-flex items-center gap-3 px-10 py-5 bg-white text-slate-900 rounded-full font-bold text-lg shadow-2xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all group"
                            >
                                <Play className="w-5 h-5 fill-slate-900" />
                                Start Listening
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-slate-400" />
                            </motion.button>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* --- SECT 2: THE SCIENCE (Why? Frequencies) --- */}
            <section className="py-32 px-6 bg-slate-50 relative overflow-hidden">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <span className="text-indigo-600 font-bold tracking-widest uppercase text-xs mb-4 block">The Science</span>
                        <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">
                            Designed for <br /><span className="text-indigo-600">State Shift.</span>
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed mb-8 font-light">
                            Your brain operates on frequencies. Beta for focus, Theta for dreams, Delta for deep rest.
                            <br /><br />
                            Softale uses <strong>Entrainment Technology</strong> (Binaural Beats & Isochronic Tones) to gently guide your brainwaves into the state you choose. It's not magic, it's physics.
                        </p>
                        <div className="flex gap-4">
                            {['432Hz Healing', '40Hz Gamma Focus', 'Theta REM'].map((tag) => (
                                <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold uppercase tracking-wider border border-indigo-100">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="relative aspect-square md:aspect-[4/3] bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/20 flex items-center justify-center group">
                        {/* Abstract Visualizer Placeholder */}
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614730341194-75c60740a070?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-50 mix-blend-overlay group-hover:scale-110 transition duration-1000" />
                        <div className="w-64 h-64 border border-white/30 rounded-full flex items-center justify-center animate-pulse">
                            <div className="w-48 h-48 border border-white/50 rounded-full flex items-center justify-center">
                                <Play className="w-12 h-12 text-white fill-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SECT 3: THE LIBRARY (Desire) --- */}
            <section className="py-32 bg-slate-900 text-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 mb-16 flex justify-between items-end">
                    <div>
                        <span className="text-emerald-400 font-bold tracking-widest uppercase text-xs mb-4 block">The Library</span>
                        <h2 className="text-4xl md:text-5xl font-bold">Infinite Variety.</h2>
                    </div>
                    <button onClick={onEnterApp} className="hidden md:flex items-center gap-2 text-slate-300 hover:text-white transition group">
                        Explore Full Catalog <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                    </button>
                </div>

                {/* Horizontal Scroll Mockup */}
                <div className="flex gap-6 overflow-x-auto pb-8 -mx-6 px-6 md:px-0 scrollbar-hide">
                    <div className="w-6 md:w-0 flex-shrink-0" /> {/* Spacer */}
                    {[
                        { title: "The Night Train", cat: "Sleep Tale", img: "bg-indigo-800" },
                        { title: "Deep Focus Protocol", cat: "Binaural", img: "bg-amber-700" },
                        { title: "Forest Rain", cat: "Nature", img: "bg-emerald-800" },
                        { title: "Morning Gratitude", cat: "Meditation", img: "bg-teal-700" },
                        { title: "Crystal Cave", cat: "Fantasy", img: "bg-purple-800" },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -10 }}
                            className="flex-shrink-0 w-64 md:w-80 aspect-[3/4] rounded-2xl overflow-hidden relative group cursor-pointer"
                            onClick={onEnterApp}
                        >
                            <div className={`absolute inset-0 ${item.img} transition-transform duration-700 group-hover:scale-110`} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                <span className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2 block">{item.cat}</span>
                                <h3 className="text-2xl font-bold leading-tight">{item.title}</h3>
                            </div>
                            <div className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="w-4 h-4 fill-white text-white" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* --- SECT 4: SOCIAL PROOF --- */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="flex justify-center gap-1 mb-8">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />)}
                    </div>
                    <blockquote className="text-3xl md:text-5xl font-serif text-slate-800 leading-tight italic mb-8 block">
                        "Finally, an app that doesn't feel like a to-do list. It's just... peaceful. Instant calm."
                    </blockquote>
                    <cite className="text-slate-500 font-medium not-italic">— Sarah J., Product Designer</cite>
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="py-32 px-6 bg-slate-50 border-t border-slate-200">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-5xl font-black text-slate-900 mb-8">Ready to reclaim your mind?</h2>
                    <p className="text-xl text-slate-500 mb-12">Join thousands of others finding silence in the signal.</p>
                    <button
                        onClick={onEnterApp}
                        className="px-12 py-5 bg-slate-900 text-white rounded-full font-bold text-lg hover:bg-slate-800 transition shadow-2xl shadow-slate-900/20 transform hover:scale-105"
                    >
                        Start Your Free Trial
                    </button>
                    <p className="mt-6 text-sm text-slate-400">No credit card required for basic access.</p>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-12 px-6 bg-slate-100 text-center text-slate-500 text-sm">
                <div className="flex justify-center gap-8 mb-8">
                    <Link href="/privacy" className="hover:text-slate-900 transition">Privacy Policy</Link>
                    <Link href="/terms" className="hover:text-slate-900 transition">Terms of Service</Link>
                    <Link href="mailto:hello@softale.app" className="hover:text-slate-900 transition">Contact Support</Link>
                </div>
                <p>&copy; {new Date().getFullYear()} Softale Inc. All rights reserved.</p>
            </footer>

        </div>
    );
}
