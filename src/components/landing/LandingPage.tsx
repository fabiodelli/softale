'use client';

import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowRight, Play, Heart, Wind, Star, Headphones } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface LandingPageProps {
    onEnterApp: () => void;
    showNav?: boolean;
}

// Noise Texture Data URI
const NOISE_SVG = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E`;

export default function LandingPage({ onEnterApp, showNav = true }: LandingPageProps) {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <div className="bg-slate-950 min-h-screen font-sans selection:bg-indigo-500/30 text-white overflow-x-hidden relative">

            {/* Scroll Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-amber-300 origin-left z-50 transform-gpu"
                style={{ scaleX }}
            />

            {/* Global Noise Overlay */}
            <div className="fixed inset-0 pointer-events-none z-40 opacity-40 mix-blend-overlay" style={{ backgroundImage: `url("${NOISE_SVG}")` }} />

            {/* --- HERO SECTION --- */}
            <HeroSection onEnterApp={onEnterApp} showNav={showNav} />

            {/* --- MOOD EXPERIENCE SECTION --- */}
            <MoodSection />

            {/* --- FLUIDITY SECTION --- */}
            <FluiditySection onEnterApp={onEnterApp} />

            {/* --- WARMTH SECTION --- */}
            <WarmthSection />

            {/* --- CTA SECTION --- */}
            <CTASection onEnterApp={onEnterApp} />

            {/* --- FOOTER --- */}
            <Footer />
        </div>
    );
}

// --- SUB-COMPONENTS ---

function HeroSection({ onEnterApp, showNav }: { onEnterApp: () => void, showNav: boolean }) {
    const textVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } }
    };

    return (
        <div className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden perspective-1000">
            {/* Dark & Moody Atmospherics */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-[60vh] h-[60vh] bg-indigo-900/40 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[10%] right-[10%] w-[50vh] h-[50vh] bg-amber-900/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
            </div>

            {/* 3D MOOD ICONS FLOATING */}
            <div className="absolute inset-0 pointer-events-none z-0">
                {/* Sleep (Top Right) */}
                <motion.div
                    animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[15%] right-[10%] w-32 h-32 md:w-64 md:h-64 opacity-80 mix-blend-screen"
                >
                    <Image src="/assets/moods_3d/sleep.png" alt="Sleep" width={512} height={512} className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]" />
                </motion.div>

                {/* Nature (Bottom Left) */}
                <motion.div
                    animate={{ y: [0, -30, 0], rotate: [0, -5, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-[20%] left-[5%] w-28 h-28 md:w-56 md:h-56 opacity-80 mix-blend-screen"
                >
                    <Image src="/assets/moods_3d/nature.png" alt="Nature" width={512} height={512} className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]" />
                </motion.div>

                {/* Fantasy (Top Left) */}
                <motion.div
                    animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
                    transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute top-[20%] left-[10%] w-24 h-24 md:w-48 md:h-48 opacity-70 mix-blend-screen"
                >
                    <Image src="/assets/moods_3d/fantasy.png" alt="Fantasy" width={512} height={512} className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(244,63,94,0.5)]" />
                </motion.div>

                {/* Energy (Bottom Right) */}
                <motion.div
                    animate={{ y: [0, -25, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute bottom-[15%] right-[15%] w-20 h-20 md:w-40 md:h-40 opacity-80 mix-blend-screen"
                >
                    <Image src="/assets/moods_3d/energy.png" alt="Energy" width={512} height={512} className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(245,158,11,0.5)]" />
                </motion.div>

                {/* Meditation (Center Back - Faint) */}
                <motion.div
                    animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vh] h-[50vh] opacity-30 mix-blend-screen blur-sm z-[-1]"
                >
                    <Image src="/assets/moods_3d/meditation.png" alt="Meditation" width={512} height={512} className="w-full h-full object-contain" />
                </motion.div>
            </div>


            {/* Nav */}
            {showNav && (
                <nav className="absolute top-0 left-0 right-0 z-50 p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-3">
                        {/* Minimal Logo */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                            <span className="font-serif font-black italic text-white text-sm">S</span>
                        </div>
                        <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>Softale</span>
                    </div>
                    <button onClick={onEnterApp} className="px-6 py-2 text-xs font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full transition text-white/90">
                        Launch
                    </button>
                </nav>
            )}

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/20 flex flex-col items-center gap-4 cursor-pointer hover:text-white/40 transition-colors z-20"
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            >
                <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
            </motion.div>
        </div>
    );
}

function MoodSection() {
    const moods = [
        { name: "Focus", img: "/assets/moods_3d/energy.png", desc: "Sharpen your mind" }, // Using energy asset for Focus if no dedicated one, or nature? Used energy.
        { name: "Sleep", img: "/assets/moods_3d/sleep.png", desc: "Drift into dreams" },
        { name: "Calm", img: "/assets/moods_3d/meditation.png", desc: "Finding balance" }, // Meditation for Calm
        { name: "Energy", img: "/assets/moods_3d/energy.png", desc: "Rise and shine" },
        { name: "Fantasy", img: "/assets/moods_3d/fantasy.png", desc: "Explore new worlds" },
    ];
    // Note: I mapped generated assets to these. I might have duplicates or I should check exactly what I have.
    // I have: sleep, nature, fantasy, meditation, energy.
    // Mapping:
    // Focus -> Meditation (or Nature?)
    // Calm -> Nature?
    // Let's adjust mapping for visual variety.

    const moodMapping = [
        { name: "Focus", asset: "meditation.png", desc: "Deep work & flow" },
        { name: "Sleep", asset: "sleep.png", desc: "Restorative rest" },
        { name: "Nature", asset: "nature.png", desc: "Peaceful escape" }, // Replaced "Calm" with "Nature" to match asset, or keep Calm label with Nature asset.
        { name: "Fantasy", asset: "fantasy.png", desc: "Cinematic journeys" },
        { name: "Energy", asset: "energy.png", desc: "Vibrant awakening" },
    ];


    return (
        <section className="py-32 px-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[500px] bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-transparent rounded-full blur-[100px]" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="mb-24 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="text-indigo-400 font-bold tracking-[0.2em] uppercase text-xs mb-6 block">The Mood Engine</span>
                        <h2 className="text-4xl md:text-6xl font-medium text-white/90 leading-[1.1] mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
                            Selected with <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Precision.</span>
                        </h2>
                        <p className="text-slate-400 max-w-xl mx-auto font-light">
                            Our proprietary engine curates soundscapes based on the frequency of your desired state.
                        </p>
                    </motion.div>
                </div>

                {/* Floating Elements Showcase */}
                <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20">
                    {moodMapping.map((mood, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ scale: 1.1, translateY: -10 }}
                            className="group relative flex flex-col items-center cursor-pointer"
                        >
                            {/* The 3D Asset */}
                            <div className="relative w-32 h-32 md:w-48 md:h-48 mb-6 drop-shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                                <Image
                                    src={`/assets/moods_3d/${mood.asset}`}
                                    alt={mood.name}
                                    width={256}
                                    height={256}
                                    className="w-full h-full object-contain mix-blend-screen opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                                />
                                {/* Halo on Hover */}
                                <div className="absolute inset-0 bg-white/20 blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 rounded-full" />
                            </div>

                            {/* Label */}
                            <div className="text-center">
                                <h3 className="text-xl md:text-2xl font-medium text-white mb-1 group-hover:text-indigo-300 transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>{mood.name}</h3>
                                <p className="text-xs text-white/40 uppercase tracking-widest group-hover:text-white/60">{mood.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function FluiditySection({ onEnterApp }: { onEnterApp: () => void }) {
    return (
        <section className="py-32 relative overflow-hidden">
            {/* Side Glows */}
            <div className="absolute right-0 top-1/4 w-[40vw] h-[60vh] bg-indigo-600/10 rounded-full blur-[120px]" />

            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-24 items-center relative z-10">
                <div className="order-2 md:order-1 flex justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative w-[320px] h-[640px] bg-[#050510] rounded-[3.5rem] border-[6px] border-[#1a1a2e] shadow-2xl shadow-indigo-900/30 overflow-hidden ring-1 ring-white/10"
                    >
                        {/* Phone Glow */}
                        <div className="absolute top-0 inset-x-0 h-32 bg-indigo-500/20 blur-[50px] pointer-events-none" />

                        {/* Screen Content */}
                        <div className="relative h-full w-full flex flex-col">
                            {/* Header */}
                            <div className="p-8 pt-14 flex justify-between items-center text-white/20">
                                <div className="w-8 h-8 rounded-full border border-white/10" />
                                <div className="w-12 h-1.5 rounded-full bg-white/10" />
                            </div>

                            {/* Album Art Area */}
                            <div className="mx-8 aspect-square rounded-[2rem] bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-white/5 mb-10 relative overflow-hidden flex items-center justify-center">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />
                                <div className="w-24 h-24 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10">
                                    <Play className="w-8 h-8 fill-white text-white ml-2 opacity-80" />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="px-8 mb-6">
                                <div className="h-6 bg-white/10 rounded-full w-2/3 mb-3" />
                                <div className="h-4 bg-white/5 rounded-full w-1/3" />
                            </div>

                            {/* Floating Player Controls */}
                            <div className="mt-auto m-6 p-4 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-between">
                                <div className="flex gap-4 items-center">
                                    <div className="w-10 h-10 rounded-full bg-white/10" />
                                    <div className="space-y-1">
                                        <div className="w-24 h-3 bg-white/20 rounded-full" />
                                        <div className="w-16 h-2 bg-white/10 rounded-full" />
                                    </div>
                                </div>
                                <div
                                    onClick={onEnterApp}
                                    className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/40 cursor-pointer hover:scale-110 transition-transform"
                                >
                                    <Play className="w-4 h-4 fill-white" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="order-1 md:order-2">
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-5xl md:text-8xl font-medium mb-8 leading-[0.9] text-white/90" style={{ fontFamily: 'var(--font-serif)' }}>
                            Effortless <br /> <span className="italic text-indigo-400">Flow.</span>
                        </h2>
                        <p className="text-xl md:text-2xl text-slate-400 font-light leading-relaxed mb-12">
                            We obsessed over every pixel to ensure nothing stands between you and your peace.
                            A user interface that feels less like an app, and more like an extension of your mind.
                        </p>

                        <div className="space-y-6">
                            {[
                                { title: "Seamless Playback", desc: "No buffering, just instant calm." },
                                { title: "Immersive Visuals", desc: "Gradients that breathe with you." },
                                { title: "Instant State Shift", desc: "One tap to change your world." }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 + (i * 0.1) }}
                                    className="flex items-start gap-4 group"
                                >
                                    <div className="mt-1 w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                                        <div className="w-2 h-2 rounded-full bg-indigo-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">{item.title}</h4>
                                        <p className="text-slate-500 text-sm">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

function WarmthSection() {
    return (
        <section className="py-32 px-6 relative">
            <div className="max-w-5xl mx-auto text-center relative z-10">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    className="w-24 h-24 mx-auto mb-12 rounded-full bg-gradient-to-tr from-rose-500/20 to-amber-500/20 flex items-center justify-center blur-sm"
                >
                    <Heart className="w-10 h-10 text-rose-300 fill-rose-500/20 animate-pulse" />
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-7xl font-medium text-white/90 mb-10 leading-tight"
                    style={{ fontFamily: 'var(--font-serif)' }}
                >
                    "Warmth, above all."
                </motion.h2>

                <p className="text-xl md:text-3xl text-slate-400 font-light leading-relaxed mb-20 max-w-3xl mx-auto">
                    We believe technology should feel natural. Softale is designed to be a digital fireplace—a place of comfort, where every sound is crafted to wrap around you.
                </p>

                <div className="grid md:grid-cols-3 gap-8 text-left">
                    {[
                        { title: "Immersive Narration", desc: "Voices tuned to the frequency of calm.", icon: Headphones },
                        { title: "Curated Journeys", desc: "Every story is a path to a specific state.", icon: Star },
                        { title: "Cinematic Soundscapes", desc: "Audio that feels like a lucid dream.", icon: Wind },
                    ].map((card, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -5 }}
                            className="p-10 rounded-[2rem] bg-white/5 backdrop-blur-md border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300"
                        >
                            <card.icon className="w-8 h-8 text-indigo-300 mb-6 opacity-80" />
                            <h4 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-serif)' }}>{card.title}</h4>
                            <p className="text-slate-400 leading-relaxed">{card.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function CTASection({ onEnterApp }: { onEnterApp: () => void }) {
    return (
        <section className="py-40 px-6 text-center relative overflow-hidden">
            {/* Gradient Bursts */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-full blur-[120px]" />

            <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-5xl md:text-8xl font-medium mb-12 tracking-tight text-white" style={{ fontFamily: 'var(--font-serif)' }}>
                    Ready to feel <br /> <span className="italic text-indigo-300">better?</span>
                </h2>
                <button
                    onClick={onEnterApp}
                    className="px-16 py-6 bg-white text-slate-950 rounded-full font-bold text-xl hover:bg-indigo-50 transition-colors shadow-[0_0_60px_-15px_rgba(255,255,255,0.3)] transform hover:scale-105"
                >
                    Enter Softale
                </button>
                <p className="mt-8 text-white/30 text-sm tracking-widest uppercase">No account required to start.</p>
            </div>
        </section>
    )
}

function Footer() {
    return (
        <footer className="py-12 px-6 border-t border-white/5 text-white/30 text-sm">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <span className="font-serif font-black italic text-white/50">S</span>
                    <span>&copy; {new Date().getFullYear()} Softale Inc.</span>
                </div>
                <div className="flex gap-8">
                    <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
                    <Link href="/terms" className="hover:text-white transition">Terms</Link>
                </div>
            </div>
        </footer>
    );
}
