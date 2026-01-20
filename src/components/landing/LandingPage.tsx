'use client';

import { motion, AnimatePresence, useScroll, useSpring, useMotionValueEvent } from 'framer-motion';
import { Play, Heart, Wind, Sparkles, Moon, Leaf, Brain, Waves, Star, Headphones, BookOpen, CloudMoon, Zap, Quote } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { getStories, type Story } from '@/lib/supabase';
import { formatDuration } from '@/lib/formatters';

interface LandingPageProps {
    onEnterApp: () => void;
    showNav?: boolean;
}

// --- MOODS - Colors matched with MoodSelector ---
const MOODS = [
    {
        id: 'sleep',
        name: 'Relaxed',
        category: 'sleep',
        colors: ['#e0e7ff', '#eef2ff', '#c7d2fe'],
        colorClass: 'bg-indigo-100',
        accent: 'from-indigo-400 to-indigo-600',
        desc: 'Drift into Calm',
        icon: Moon,
    },
    {
        id: 'nature',
        name: 'Peaceful',
        category: 'nature',
        colors: ['#d1fae5', '#ecfdf5', '#a7f3d0'],
        colorClass: 'bg-emerald-100',
        accent: 'from-emerald-400 to-emerald-600',
        desc: 'Find Your Peace',
        icon: Leaf,
    },
    {
        id: 'fantasy',
        name: 'Dreamy',
        category: 'fantasy',
        colors: ['#ffe4e6', '#fff1f2', '#fecdd3'],
        colorClass: 'bg-rose-100',
        accent: 'from-rose-400 to-rose-600',
        desc: 'Explore Worlds',
        icon: Sparkles,
    },
    {
        id: 'meditation',
        name: 'Focused',
        category: 'meditation',
        colors: ['#e0f2fe', '#f0f9ff', '#bae6fd'],
        colorClass: 'bg-sky-100',
        accent: 'from-sky-400 to-sky-600',
        desc: 'Deep Flow',
        icon: Brain,
    },
    {
        id: 'energized',
        name: 'Energized',
        category: 'motivation',
        colors: ['#fef3c7', '#fffbeb', '#fde68a'],
        colorClass: 'bg-amber-100',
        accent: 'from-amber-400 to-amber-600',
        desc: 'Rise & Shine',
        icon: Waves,
    }
];

// --- PREFERENCE OPTIONS ---
const PREFERENCES = [
    { id: 'sleep', label: 'Sleep better', icon: Moon, color: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-200' },
    { id: 'stress', label: 'Reduce stress', icon: Brain, color: 'bg-sky-100 hover:bg-sky-200 border-sky-200' },
    { id: 'peace', label: 'Find peace', icon: Leaf, color: 'bg-emerald-100 hover:bg-emerald-200 border-emerald-200' },
    { id: 'escape', label: 'Escape reality', icon: Sparkles, color: 'bg-rose-100 hover:bg-rose-200 border-rose-200' },
    { id: 'energy', label: 'Stay motivated', icon: Zap, color: 'bg-amber-100 hover:bg-amber-200 border-amber-200' },
];

// --- BENEFITS ---
const BENEFITS = [
    { icon: Headphones, title: 'Spatial Audio', desc: 'Immersive 3D soundscapes' },
    { icon: CloudMoon, title: 'Sleep Stories', desc: 'Narrated tales to drift off' },
    { icon: Brain, title: 'Reduce Stress', desc: 'Science-backed relaxation' },
    { icon: Sparkles, title: 'AI-Powered', desc: 'Personalized for you' },
    { icon: BookOpen, title: 'Rich Library', desc: '100+ audio experiences' },
    { icon: Heart, title: 'Made with Care', desc: 'Crafted for your wellbeing' },
];

// --- TESTIMONIALS ---
const TESTIMONIALS = [
    { quote: "I've struggled with sleep for years. Softale changed everything. Now I fall asleep in minutes.", author: "Sarah M.", role: "Designer" },
    { quote: "The ambient sounds are incredible. It's like having a personal sanctuary wherever I go.", author: "Marco L.", role: "Developer" },
    { quote: "Finally an app that understands what relaxation really means. Beautiful and effective.", author: "Emma K.", role: "Teacher" },
];

export default function LandingPage({ onEnterApp, showNav = true }: LandingPageProps) {
    // Current Active Mood Index
    const [activeIndex, setActiveIndex] = useState(0);
    const activeMood = MOODS[activeIndex];

    // Stories by category
    const [storiesByCategory, setStoriesByCategory] = useState<Record<string, Story>>({});

    // User Preferences
    const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

    // Testimonial index
    const [testimonialIndex, setTestimonialIndex] = useState(0);

    // Scroll tracking for mood sections
    const moodSectionRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: moodSectionRef,
        offset: ["start start", "end end"]
    });

    // Track scroll progress to change active mood
    useMotionValueEvent(scrollYProgress, "change", (latest) => {
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

    // Auto-rotate testimonials
    useEffect(() => {
        const timer = setInterval(() => {
            setTestimonialIndex(prev => (prev + 1) % TESTIMONIALS.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    // Scroll Progress for nav bar
    const { scrollYProgress: pageProgress } = useScroll();
    const scaleX = useSpring(pageProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    // Handle preference toggle
    const togglePreference = (id: string) => {
        setSelectedPreferences(prev =>
            prev.includes(id)
                ? prev.filter(p => p !== id)
                : [...prev, id]
        );
    };

    // Handle card click - navigate to app with autoplay
    const handleCardClick = (story: Story | undefined) => {
        if (story) {
            sessionStorage.setItem('softale_autoplay_story', JSON.stringify(story));
        }
        handleEnterWithPreferences();
    };

    // Enter app with preferences saved
    const handleEnterWithPreferences = () => {
        if (selectedPreferences.length > 0) {
            sessionStorage.setItem('softale_preferences', JSON.stringify(selectedPreferences));
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
                    <div className="absolute inset-0 opacity-[0.04] mix-blend-multiply pointer-events-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                    />
                </motion.div>
            </AnimatePresence>

            {/* --- FIXED NAVIGATION --- */}
            {showNav && (
                <nav className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-2">
                        <Image
                            src="/assets/softale-icon.png"
                            alt="Softale"
                            width={40}
                            height={40}
                            className="drop-shadow-md"
                        />
                        <span className="text-lg md:text-xl font-bold tracking-tight text-slate-900/80">Softale</span>
                    </div>
                    <button onClick={handleEnterWithPreferences} className="px-4 md:px-6 py-2 md:py-2.5 text-xs font-bold uppercase tracking-widest bg-white/40 hover:bg-white/60 backdrop-blur-md border border-white/50 rounded-full transition text-slate-900 shadow-sm hover:shadow-md active:scale-95">
                        Start Listening
                    </button>
                    <motion.div className="absolute bottom-0 left-0 h-[2px] bg-slate-900/10 origin-left" style={{ scaleX, right: 0 }} />
                </nav>
            )}

            {/* --- SCROLL CONTENT --- */}
            <main className="relative z-10 w-full">

                {/* ===== 1. HERO SECTION ===== */}
                <section className="min-h-screen flex items-center justify-center p-6 pt-24">
                    <div className="max-w-5xl w-full text-center">
                        {/* Logo */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6 }}
                            className="mb-8"
                        >
                            <Image
                                src="/assets/softale-icon.png"
                                alt="Softale"
                                width={80}
                                height={80}
                                className="mx-auto drop-shadow-xl"
                            />
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter text-slate-900 mb-6 leading-tight"
                            style={{ fontFamily: 'var(--font-serif)' }}
                        >
                            The Sound of <br />
                            <span className="italic text-transparent bg-clip-text bg-gradient-to-br from-slate-500 to-slate-800">Serenity.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="text-lg md:text-xl lg:text-2xl text-slate-600 font-light max-w-2xl mx-auto leading-relaxed mb-10"
                        >
                            A bubble of digital wellness. Stories, sounds, and frequencies designed to make you feel, finally, okay.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="animate-bounce text-slate-400 text-sm tracking-widest uppercase"
                        >
                            Scroll to explore
                        </motion.div>
                    </div>
                </section>

                {/* ===== 2. MOOD JOURNEY ===== */}
                <div
                    ref={moodSectionRef}
                    style={{ height: `${MOODS.length * 100}vh` }}
                    className="relative"
                >
                    <div className="sticky top-0 h-screen flex items-center justify-center p-6 overflow-hidden">
                        <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8 md:gap-12 items-center">

                            {/* Text Side */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeMood.id + '-text'}
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 30 }}
                                    transition={{ duration: 0.5 }}
                                    className="text-left"
                                >
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${activeMood.colorClass} border border-white/40 backdrop-blur-sm text-xs font-bold uppercase tracking-widest text-slate-700 mb-6 shadow-sm`}>
                                        {activeMood.icon && <activeMood.icon className="w-4 h-4" />}
                                        {activeMood.name}
                                    </div>

                                    <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
                                        {activeMood.desc}
                                    </h2>

                                    <p className="text-base md:text-lg text-slate-600 leading-relaxed mb-8 max-w-md">
                                        Immerse yourself in a soundscape curated for this precise state of mind.
                                    </p>

                                    <button onClick={handleEnterWithPreferences} className="group flex items-center gap-2 text-slate-900 font-bold border-b border-slate-900 pb-0.5 hover:text-indigo-600 hover:border-indigo-600 transition-colors">
                                        Listen now <Play className="w-4 h-4 fill-current" />
                                    </button>

                                    {/* Progress Dots */}
                                    <div className="flex gap-2 mt-8 md:mt-12">
                                        {MOODS.map((mood, idx) => (
                                            <div
                                                key={mood.id}
                                                className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === activeIndex ? 'bg-slate-900 scale-125' : 'bg-slate-300'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Card Side */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeMood.id + '-card'}
                                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -50, scale: 0.9 }}
                                    transition={{ duration: 0.5 }}
                                    className="relative"
                                >
                                    {/* FIXED: Square aspect ratio on mobile to avoid nav overlap */}
                                    <div
                                        onClick={() => handleCardClick(currentStory)}
                                        className="relative aspect-square bg-white/20 backdrop-blur-2xl border border-white/40 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col group cursor-pointer hover:bg-white/30 transition-colors"
                                    >
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

                                        {!currentStory?.cover_url && (
                                            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${activeMood.accent} opacity-20 blur-[80px] rounded-full`} />
                                        )}

                                        <div className="mt-auto p-6 md:p-8 relative z-10">
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/80 flex items-center justify-center mb-4 md:mb-6 shadow-md group-hover:scale-110 transition-transform">
                                                <Play className="w-4 h-4 md:w-5 md:h-5 text-slate-900 fill-slate-900 ml-0.5" />
                                            </div>
                                            <h3 className={`text-xl md:text-2xl lg:text-3xl font-bold mb-2 leading-tight ${currentStory?.cover_url ? 'text-white' : 'text-slate-900'}`}>
                                                {currentStory?.title || `${activeMood.name} Session`}
                                            </h3>
                                            <p className={`text-sm font-medium opacity-80 ${currentStory?.cover_url ? 'text-white/80' : 'text-slate-600'}`}>
                                                {currentStory ? `${formatDuration(currentStory.duration)} • ${currentStory.category?.replace(/_/g, ' ')}` : '15 min • Voice Guide'}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* ===== 3. PREFERENCE QUIZ ===== */}
                <section className="py-24 md:py-32 px-6 bg-white/60 backdrop-blur-xl relative">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl md:text-5xl font-bold text-slate-900 mb-4"
                            style={{ fontFamily: 'var(--font-serif)' }}
                        >
                            What brings you here?
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-slate-500 mb-10"
                        >
                            Select all that apply. We'll personalize your experience.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-wrap justify-center gap-3 md:gap-4"
                        >
                            {PREFERENCES.map((pref) => {
                                const isSelected = selectedPreferences.includes(pref.id);
                                return (
                                    <button
                                        key={pref.id}
                                        onClick={() => togglePreference(pref.id)}
                                        className={`flex items-center gap-2 px-5 py-3 rounded-full border-2 font-medium transition-all ${isSelected
                                                ? `${pref.color} border-slate-400 ring-2 ring-slate-300 scale-105`
                                                : `${pref.color} border-transparent`
                                            }`}
                                    >
                                        <pref.icon className="w-5 h-5" />
                                        {pref.label}
                                    </button>
                                );
                            })}
                        </motion.div>
                    </div>
                </section>

                {/* ===== 4. BENEFITS GRID ===== */}
                <section className="py-24 md:py-32 px-6 bg-slate-50/80">
                    <div className="max-w-6xl mx-auto">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 text-center"
                            style={{ fontFamily: 'var(--font-serif)' }}
                        >
                            Everything you need to unwind
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-slate-500 mb-12 text-center max-w-2xl mx-auto"
                        >
                            Carefully crafted features designed to help you sleep, relax, and find your peace.
                        </motion.p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                            {BENEFITS.map((benefit, i) => (
                                <motion.div
                                    key={benefit.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-6 md:p-8 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 text-center hover:bg-white/80 transition-colors"
                                >
                                    <benefit.icon className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-4 text-indigo-500" />
                                    <h3 className="font-bold text-slate-900 mb-1">{benefit.title}</h3>
                                    <p className="text-sm text-slate-500">{benefit.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ===== 5. TESTIMONIALS ===== */}
                <section className="py-24 md:py-32 px-6 bg-gradient-to-b from-slate-50/80 to-white/60 backdrop-blur-xl">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-8"
                        >
                            <Quote className="w-12 h-12 mx-auto text-indigo-200 mb-6" />
                        </motion.div>

                        <div className="relative h-48">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={testimonialIndex}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.5 }}
                                    className="absolute inset-0"
                                >
                                    <p className="text-xl md:text-2xl text-slate-700 mb-6 italic leading-relaxed">
                                        "{TESTIMONIALS[testimonialIndex].quote}"
                                    </p>
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="flex text-amber-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-current" />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-slate-500 mt-2">
                                        <span className="font-medium text-slate-700">{TESTIMONIALS[testimonialIndex].author}</span>
                                        <span className="mx-2">•</span>
                                        {TESTIMONIALS[testimonialIndex].role}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Testimonial dots */}
                        <div className="flex justify-center gap-2 mt-8">
                            {TESTIMONIALS.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setTestimonialIndex(idx)}
                                    className={`w-2 h-2 rounded-full transition-all ${idx === testimonialIndex ? 'bg-slate-900 scale-125' : 'bg-slate-300'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* ===== 6. SOCIAL PROOF ===== */}
                <section className="py-16 px-6 bg-white/40 backdrop-blur-xl border-y border-slate-100">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                            <div className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-slate-900">10K+</div>
                                <div className="text-sm text-slate-500">Happy dreamers</div>
                            </div>
                            <div className="w-px h-12 bg-slate-200 hidden md:block" />
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 fill-current" />
                                    ))}
                                </div>
                                <div className="text-sm text-slate-500">4.9 rating</div>
                            </div>
                            <div className="w-px h-12 bg-slate-200 hidden md:block" />
                            <div className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-slate-900">100+</div>
                                <div className="text-sm text-slate-500">Audio experiences</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ===== 7. FINAL CTA ===== */}
                <section className="py-32 md:py-40 px-6 text-center relative overflow-hidden bg-white/50 backdrop-blur-xl">
                    <div className="max-w-4xl mx-auto relative z-10">
                        <h2 className="text-4xl md:text-6xl font-medium mb-8 text-slate-900" style={{ fontFamily: 'var(--font-serif)' }}>
                            Your mind deserves <br /> <span className="italic text-indigo-500">space.</span>
                        </h2>

                        <div className="p-12 md:p-20 rounded-[3rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900" />
                            <div className="relative z-10">
                                <h3 className="text-2xl md:text-4xl font-bold mb-6">Start your journey today.</h3>
                                <button
                                    onClick={handleEnterWithPreferences}
                                    className="px-12 md:px-16 py-5 md:py-6 bg-white text-slate-950 rounded-full font-bold text-lg md:text-xl hover:bg-indigo-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                                >
                                    Enter Softale
                                </button>
                                <p className="mt-6 text-white/40 text-xs tracking-widest uppercase">Free to try • No credit card required</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ===== FOOTER ===== */}
                <footer className="py-12 px-6 border-t border-slate-200 text-slate-500 text-sm bg-slate-50">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2 opacity-50">
                            <Image src="/assets/softale-icon.png" alt="Softale" width={24} height={24} />
                            <span>&copy; {new Date().getFullYear()} Softale Inc.</span>
                        </div>
                        <div className="flex gap-8">
                            <Link href="/privacy" className="hover:text-slate-900 transition">Privacy</Link>
                            <Link href="/terms" className="hover:text-slate-900 transition">Terms</Link>
                        </div>
                    </div>
                </footer>

            </main>
        </div>
    );
}
