'use client';

import { motion, useScroll, useSpring, useTransform, useInView } from 'framer-motion';
import { ArrowRight, Play, Heart, Wind, Star, Headphones, Sparkles, Zap, Moon, Cloud, Sun } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';

interface LandingPageProps {
    onEnterApp: () => void;
    showNav?: boolean;
}

// --- CONFIGURATION ---

const MOODS = [
    {
        id: 'intro',
        name: 'Softale',
        colors: ['#f8fafc', '#f1f5f9', '#e2e8f0'], // Slate White
        accent: 'from-slate-400 to-slate-600',
        desc: 'The Sound of Your Serenity',
        icon: null,
        asset: null
    },
    {
        id: 'peaceful',
        name: 'Peaceful',
        colors: ['#e0f2fe', '#f0f9ff', '#e0e7ff'], // Light Blue/White
        accent: 'from-sky-400 to-indigo-400',
        desc: 'Clear your mind',
        icon: Cloud,
        asset: '/assets/moods_3d/nature.png'
    },
    {
        id: 'relax',
        name: 'Relax',
        colors: ['#fff7ed', '#ffedd5', '#fed7aa'], // Warm Orange/Amber
        accent: 'from-orange-400 to-rose-400',
        desc: 'Warmth & Comfort',
        icon: Sun,
        asset: '/assets/moods_3d/sleep.png'
    },
    {
        id: 'energize',
        name: 'Energize',
        colors: ['#ecfeff', '#cffafe', '#a5f3fc'], // Cyan/Electric
        accent: 'from-cyan-400 to-teal-400',
        desc: 'Rise & Shine',
        icon: Zap,
        asset: '/assets/moods_3d/energy.png'
    },
    {
        id: 'dreamy',
        name: 'Dreamy',
        colors: ['#f5f3ff', '#ede9fe', '#ddd6fe'], // Deep Purple/Indigo
        accent: 'from-violet-500 to-fuchsia-500',
        desc: 'Explore worlds',
        icon: Moon,
        asset: '/assets/moods_3d/fantasy.png'
    },
    {
        id: 'focus',
        name: 'Focus',
        colors: ['#f0fdf4', '#dcfce7', '#bbf7d0'], // Emerald/Teal
        accent: 'from-emerald-400 to-teal-500',
        desc: 'Deep Flow',
        icon: Sparkles,
        asset: '/assets/moods_3d/meditation.png'
    }
];

export default function LandingPage({ onEnterApp, showNav = true }: LandingPageProps) {
    // Current Active Mood Index (0 to MOODS.length)
    const [activeIndex, setActiveIndex] = useState(0);
    const activeMood = MOODS[activeIndex];

    // Scroll Progress
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    return (
        <div className="font-sans text-slate-900 relative bg-slate-50 overscroll-none">
            {/* --- FIXED BACKGROUND LAYER --- */}
            <div className="fixed inset-0 z-0 transition-colors duration-1000 ease-in-out"
                style={{
                    background: `linear-gradient(180deg, ${activeMood.colors[0]} 0%, ${activeMood.colors[1]} 50%, ${activeMood.colors[2]} 100%)`
                }}
            >
                {/* Dynamic Gradient Orbs logic could go here */}
                {/* Noise */}
                <div className="absolute inset-0 opacity-[0.04] mix-blend-multiply pointer-events-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                />
            </div>

            {/* --- FIXED NAVIGATION --- */}
            {showNav && (
                <nav className="fixed top-0 left-0 right-0 z-50 p-6 flex items-center justify-between max-w-7xl mx-auto w-full mix-blend-darken">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg">
                            <span className="font-serif font-black italic text-slate-900 text-lg">S</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900/80">Softale</span>
                    </div>
                    <button onClick={onEnterApp} className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest bg-white/40 hover:bg-white/60 backdrop-blur-md border border-white/50 rounded-full transition text-slate-900 shadow-sm hover:shadow-md active:scale-95">
                        Start Listening
                    </button>
                    {/* Progress Bar */}
                    <motion.div className="absolute bottom-0 left-0 h-[2px] bg-slate-900/10 origin-left" style={{ scaleX, right: 0 }} />
                </nav>
            )}

            {/* --- SCROLL CONTENT --- */}
            <main className="relative z-10 w-full">

                {/* 1. INTRO HERO */}
                <MoodSection
                    mood={MOODS[0]}
                    index={0}
                    setActiveIndex={setActiveIndex}
                    onEnterApp={onEnterApp}
                    isHero={true}
                />

                {/* 2. MOOD JOURNEY */}
                {MOODS.slice(1).map((mood, idx) => (
                    <MoodSection
                        key={mood.id}
                        mood={mood}
                        index={idx + 1}
                        setActiveIndex={setActiveIndex}
                        onEnterApp={onEnterApp}
                        isHero={false}
                    />
                ))}

                {/* 3. FINAL VALUES/CTA */}
                <FinalSection onEnterApp={onEnterApp} />

            </main>
        </div>
    );
}

// --- SUB-COMPONENT: MOOD SECTION ---
function MoodSection({ mood, index, setActiveIndex, onEnterApp, isHero }: any) {
    const ref = useRef(null);
    const isInView = useInView(ref, { margin: "-50% 0px -50% 0px" }); // Trigger when center of section hits center of screen

    useEffect(() => {
        if (isInView) setActiveIndex(index);
    }, [isInView, index, setActiveIndex]);

    return (
        <section ref={ref} className="min-h-screen relative flex items-center justify-center p-6 perspective-1000">
            {/* The 3D Image (Fixed/Sticky feel via Layout) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 md:opacity-100">
                {mood.asset && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="w-[300px] h-[300px] md:w-[600px] md:h-[600px] relative"
                    >
                        <Image
                            src={mood.asset}
                            alt={mood.name}
                            fill
                            className="object-contain drop-shadow-2xl mix-blend-multiply filter blur-[1px]"
                        />
                    </motion.div>
                )}
            </div>

            {/* Glass Card Content */}
            <div className="max-w-5xl w-full grid md:grid-cols-2 gap-12 items-center relative z-10">

                {/* Text Side */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={`text-left ${isHero ? 'md:col-span-2 md:text-center' : ''}`}
                >
                    {isHero ? (
                        <>
                            {/* Hero Specific Layout */}
                            <motion.h1
                                className="text-6xl md:text-9xl font-black tracking-tighter text-slate-900 mb-6 leading-tight"
                                style={{ fontFamily: 'var(--font-serif)' }}
                            >
                                The Sound of <br />
                                <span className="italic text-transparent bg-clip-text bg-gradient-to-br from-slate-500 to-slate-800">Serenity.</span>
                            </motion.h1>
                            <p className="text-xl md:text-2xl text-slate-600 font-light max-w-2xl mx-auto leading-relaxed mb-10">
                                A bubble of digital wellness. Stories, sounds, and frequencies designed to make you feel, finally, okay.
                            </p>
                            <div className="flex justify-center flex-col md:flex-row gap-4 items-center mb-24">
                                <div className="animate-bounce text-slate-400 text-sm tracking-widest uppercase">Scroll to explore</div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Mood Specific Layout */}
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/30 border border-white/40 backdrop-blur-sm text-xs font-bold uppercase tracking-widest text-slate-600 mb-6 shadow-sm">
                                {mood.icon && <mood.icon className="w-4 h-4" />}
                                {mood.name}
                            </div>
                            <h2 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'var(--font-serif)' }}>{mood.desc}</h2>
                            <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-md">
                                Immerse yourself in a soundscape curated for this precise state of mind.
                                Balanced frequencies and narrations that gently guide you.
                            </p>
                            <button onClick={onEnterApp} className="group flex items-center gap-2 text-slate-900 font-bold border-b border-slate-900 pb-0.5 hover:text-indigo-600 hover:border-indigo-600 transition-colors">
                                Listen to preview <Play className="w-4 h-4 fill-current" />
                            </button>
                        </>
                    )}
                </motion.div>

                {/* Example Card Side (Only for Moods) */}
                {!isHero && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ margin: "-20%" }}
                        transition={{ duration: 0.8 }}
                        className="relative mt-8 md:mt-0"
                    >
                        {/* The Glass Card Showcase */}
                        <div className="relative aspect-[4/5] md:aspect-square bg-white/20 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col p-8 group cursor-pointer hover:bg-white/30 transition-colors">
                            {/* Inner Glow */}
                            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${mood.accent} opacity-20 blur-[80px] rounded-full`} />

                            <div className="mt-auto">
                                <div className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform">
                                    <Play className="w-5 h-5 text-slate-900 fill-slate-900 ml-1" />
                                </div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-2 leading-tight">{mood.name} Session</h3>
                                <p className="text-slate-600 text-sm font-medium opacity-80">Duration: 15 min • Voice Guide</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    )
}

function FinalSection({ onEnterApp }: { onEnterApp: () => void }) {
    return (
        <section className="py-40 px-6 text-center relative overflow-hidden bg-white/50 backdrop-blur-xl">
            <div className="max-w-4xl mx-auto relative z-10">
                <h2 className="text-4xl md:text-6xl font-medium mb-12 text-slate-900" style={{ fontFamily: 'var(--font-serif)' }}>
                    Your mind deserves <br /> <span className="italic text-indigo-500">space.</span>
                </h2>

                <div className="grid md:grid-cols-3 gap-8 mb-20">
                    {[
                        { title: "Presence", desc: "Spatial audio.", icon: Wind },
                        { title: "Kindness", desc: "Warm stories.", icon: Heart },
                        { title: "Harmony", desc: "Human curation.", icon: Sparkles }
                    ].map((item, i) => (
                        <div key={i} className="p-6 rounded-2xl bg-white/40 border border-white/50 text-center">
                            <item.icon className="w-8 h-8 mx-auto mb-4 text-slate-700" />
                            <h3 className="font-bold text-slate-900">{item.title}</h3>
                            <p className="text-sm text-slate-500">{item.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="p-12 md:p-24 rounded-[3rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900" />
                    <div className="relative z-10">
                        <h3 className="text-3xl md:text-5xl font-bold mb-8">Start now.</h3>
                        <button
                            onClick={onEnterApp}
                            className="px-16 py-6 bg-white text-slate-950 rounded-full font-bold text-xl hover:bg-indigo-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                        >
                            Enter Softale
                        </button>
                        <p className="mt-6 text-white/40 text-xs tracking-widest uppercase">Founder price locked forever</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Footer() {
    return (
        <footer className="py-12 px-6 border-t border-slate-200 text-slate-500 text-sm bg-slate-50">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2 opacity-50">
                    <span className="font-serif font-black italic">S</span>
                    <span>&copy; {new Date().getFullYear()} Softale Inc.</span>
                </div>
                <div className="flex gap-8">
                    <Link href="/privacy" className="hover:text-slate-900 transition">Privacy</Link>
                    <Link href="/terms" className="hover:text-slate-900 transition">Terms</Link>
                </div>
            </div>
        </footer>
    );
}
