'use client';

import { motion, AnimatePresence, useScroll, useSpring, useMotionValueEvent } from 'framer-motion';
import { ArrowRight, Play, Heart, Wind, Star, Headphones, Sparkles, Zap, Moon, Cloud, Sun, Leaf, Brain, Waves } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStories, type Story } from '@/lib/supabase';
import { formatDuration } from '@/lib/formatters';

interface LandingPageProps {
    onEnterApp: () => void;
    showNav?: boolean;
}

// --- CONFIGURATION - Colors matched with MoodSelector ---
const MOODS = [
    {
        id: 'sleep',
        name: 'Relaxed',
        category: 'sleep',
        colors: ['#e0e7ff', '#eef2ff', '#c7d2fe'], // Indigo
        colorClass: 'bg-indigo-100',
        accent: 'from-indigo-400 to-indigo-600',
        desc: 'Drift into Calm',
        icon: Moon,
        asset: '/assets/moods_3d/sleep.png',
        image: '/images/moods/starry_night.png'
    },
    {
        id: 'nature',
        name: 'Peaceful',
        category: 'nature',
        colors: ['#d1fae5', '#ecfdf5', '#a7f3d0'], // Emerald
        colorClass: 'bg-emerald-100',
        accent: 'from-emerald-400 to-emerald-600',
        desc: 'Find Your Peace',
        icon: Leaf,
        asset: '/assets/moods_3d/nature.png',
        image: '/images/moods/forest.png'
    },
    {
        id: 'fantasy',
        name: 'Dreamy',
        category: 'fantasy',
        colors: ['#ffe4e6', '#fff1f2', '#fecdd3'], // Rose
        colorClass: 'bg-rose-100',
        accent: 'from-rose-400 to-rose-600',
        desc: 'Explore Worlds',
        icon: Sparkles,
        asset: '/assets/moods_3d/fantasy.png',
        image: '/images/moods/sunset.png'
    },
    {
        id: 'meditation',
        name: 'Focused',
        category: 'meditation',
        colors: ['#e0f2fe', '#f0f9ff', '#bae6fd'], // Sky
        colorClass: 'bg-sky-100',
        accent: 'from-sky-400 to-sky-600',
        desc: 'Deep Flow',
        icon: Brain,
        asset: '/assets/moods_3d/meditation.png',
        image: '/images/moods/zen_stones.png'
    },
    {
        id: 'energized',
        name: 'Energized',
        category: 'motivation',
        colors: ['#fef3c7', '#fffbeb', '#fde68a'], // Amber
        colorClass: 'bg-amber-100',
        accent: 'from-amber-400 to-amber-600',
        desc: 'Rise & Shine',
        icon: Waves,
        asset: '/assets/moods_3d/energy.png',
        image: '/images/moods/ocean-vibrant.jpg'
    }
];

export default function LandingPage({ onEnterApp, showNav = true }: LandingPageProps) {
    const router = useRouter();

    // Current Active Mood Index
    const [activeIndex, setActiveIndex] = useState(0);
    const activeMood = MOODS[activeIndex];

    // Stories by category
    const [storiesByCategory, setStoriesByCategory] = useState<Record<string, Story>>({});

    // Scroll tracking for mood sections
    const moodSectionRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: moodSectionRef,
        offset: ["start start", "end end"]
    });

    // Track scroll progress to change active mood
    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        // Divide scroll into equal parts for each mood
        const segmentSize = 1 / MOODS.length;
        const newIndex = Math.min(Math.floor(latest / segmentSize), MOODS.length - 1);
        if (newIndex !== activeIndex && newIndex >= 0) {
            setActiveIndex(newIndex);
        }
    });

    // Fetch stories on mount
    useEffect(() => {
        async function fetchStories() {
            const stories = await getStories();
            const byCategory: Record<string, Story> = {};

            // Get one story per category
            for (const mood of MOODS) {
                if (mood.category) {
                    const categoryStory = stories.find(s => s.category === mood.category);
                    if (categoryStory) {
                        byCategory[mood.category] = categoryStory;
                    }
                }
            }
            setStoriesByCategory(byCategory);
        }
        fetchStories();
    }, []);

    // Scroll Progress for nav bar
    const { scrollYProgress: pageProgress } = useScroll();
    const scaleX = useSpring(pageProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    // Handle card click - navigate to app with autoplay
    const handleCardClick = (story: Story | undefined) => {
        if (story) {
            sessionStorage.setItem('softale_autoplay_story', JSON.stringify(story));
        }
        onEnterApp();
    };

    const currentStory = activeMood.category ? storiesByCategory[activeMood.category] : undefined;

    return (
        <div className="font-sans text-slate-900 relative bg-slate-50 overscroll-none">
            {/* --- FIXED BACKGROUND LAYER --- */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeMood.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="fixed inset-0 z-0"
                    style={{
                        background: `linear-gradient(180deg, ${activeMood.colors[0]} 0%, ${activeMood.colors[1]} 50%, ${activeMood.colors[2]} 100%)`
                    }}
                >
                    {/* Noise */}
                    <div className="absolute inset-0 opacity-[0.04] mix-blend-multiply pointer-events-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                    />
                </motion.div>
            </AnimatePresence>

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

                {/* 1. INTRO HERO SECTION */}
                <section className="min-h-screen flex items-center justify-center p-6 pt-24">
                    <div className="max-w-5xl w-full text-center">
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-6xl md:text-9xl font-black tracking-tighter text-slate-900 mb-6 leading-tight"
                            style={{ fontFamily: 'var(--font-serif)' }}
                        >
                            The Sound of <br />
                            <span className="italic text-transparent bg-clip-text bg-gradient-to-br from-slate-500 to-slate-800">Serenity.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="text-xl md:text-2xl text-slate-600 font-light max-w-2xl mx-auto leading-relaxed mb-10"
                        >
                            A bubble of digital wellness. Stories, sounds, and frequencies designed to make you feel, finally, okay.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            className="animate-bounce text-slate-400 text-sm tracking-widest uppercase"
                        >
                            Scroll to explore
                        </motion.div>
                    </div>
                </section>

                {/* 2. MOOD JOURNEY - Single Sticky Container with Changing Content */}
                <div
                    ref={moodSectionRef}
                    style={{ height: `${MOODS.length * 100}vh` }} // Scroll space for all moods
                    className="relative"
                >
                    {/* Sticky Content Container */}
                    <div className="sticky top-0 h-screen flex items-center justify-center p-6 overflow-hidden">
                        <div className="max-w-5xl w-full grid md:grid-cols-2 gap-12 items-center">

                            {/* Text Side - Animated */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeMood.id + '-text'}
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 30 }}
                                    transition={{ duration: 0.5 }}
                                    className="text-left"
                                >
                                    {/* Mood Badge */}
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${activeMood.colorClass} border border-white/40 backdrop-blur-sm text-xs font-bold uppercase tracking-widest text-slate-700 mb-6 shadow-sm`}>
                                        {activeMood.icon && <activeMood.icon className="w-4 h-4" />}
                                        {activeMood.name}
                                    </div>

                                    <h2 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
                                        {activeMood.desc}
                                    </h2>

                                    <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-md">
                                        Immerse yourself in a soundscape curated for this precise state of mind.
                                        Balanced frequencies and narrations that gently guide you.
                                    </p>

                                    <button onClick={onEnterApp} className="group flex items-center gap-2 text-slate-900 font-bold border-b border-slate-900 pb-0.5 hover:text-indigo-600 hover:border-indigo-600 transition-colors">
                                        Listen to preview <Play className="w-4 h-4 fill-current" />
                                    </button>

                                    {/* Mood Progress Dots */}
                                    <div className="flex gap-2 mt-12">
                                        {MOODS.map((mood, idx) => (
                                            <div
                                                key={mood.id}
                                                className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === activeIndex
                                                        ? 'bg-slate-900 scale-125'
                                                        : 'bg-slate-300'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Card Side - Animated */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeMood.id + '-card'}
                                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -50, scale: 0.9 }}
                                    transition={{ duration: 0.5 }}
                                    className="relative"
                                >
                                    {/* The Glass Card Showcase */}
                                    <div
                                        onClick={() => handleCardClick(currentStory)}
                                        className="relative aspect-[4/5] md:aspect-square bg-white/20 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col group cursor-pointer hover:bg-white/30 transition-colors"
                                    >
                                        {/* Cover Image */}
                                        {currentStory?.cover_url && (
                                            <div className="absolute inset-0">
                                                <Image
                                                    src={currentStory.cover_url}
                                                    alt={currentStory.title}
                                                    fill
                                                    className="object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                            </div>
                                        )}

                                        {/* Inner Glow (fallback if no image) */}
                                        {!currentStory?.cover_url && (
                                            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${activeMood.accent} opacity-20 blur-[80px] rounded-full`} />
                                        )}

                                        <div className="mt-auto p-8 relative z-10">
                                            <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform">
                                                <Play className="w-5 h-5 text-slate-900 fill-slate-900 ml-1" />
                                            </div>
                                            <h3 className={`text-2xl md:text-3xl font-bold mb-2 leading-tight ${currentStory?.cover_url ? 'text-white' : 'text-slate-900'}`}>
                                                {currentStory?.title || `${activeMood.name} Session`}
                                            </h3>
                                            <p className={`text-sm font-medium opacity-80 ${currentStory?.cover_url ? 'text-white/80' : 'text-slate-600'}`}>
                                                {currentStory ? `${formatDuration(currentStory.duration)} • ${currentStory.category?.replace(/_/g, ' ')}` : 'Duration: 15 min • Voice Guide'}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* 3. FINAL VALUES/CTA */}
                <FinalSection onEnterApp={onEnterApp} />

            </main>
        </div>
    );
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
                        { title: "Innovation", desc: "AI-powered.", icon: Sparkles }
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
