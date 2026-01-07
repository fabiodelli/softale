'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { Headphones, Wind, Moon, Zap, Shield, Heart } from 'lucide-react';
import { useRef } from 'react';

export default function VisionPage() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.1]);

    return (
        <div ref={containerRef} className="bg-slate-50 min-h-screen font-sans selection:bg-indigo-100">

            {/* HERO SECTION */}
            <div className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* Background Image */}
                <motion.div
                    style={{ opacity: heroOpacity, scale: heroScale }}
                    className="absolute inset-0 z-0"
                >
                    <img
                        src="/assets/vision-hero.png"
                        alt="Ethereal Background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-50" />
                </motion.div>

                {/* Content */}
                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full border border-white/30 text-white/90 text-sm font-medium tracking-wide backdrop-blur-md mb-6 shadow-lg shadow-black/10">
                            The Philosophy
                        </span>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tighter leading-tight drop-shadow-sm">
                            Silence in the <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-orange-100">Signal.</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-200 max-w-2xl mx-auto font-light leading-relaxed mb-10">
                            In a world screaming for your attention, <br />we offer a sanctuary for your mind.
                        </p>

                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Link href="/" className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-full font-bold shadow-2xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all">
                                <Headphones className="w-5 h-5 text-indigo-600" />
                                Start Listening Now
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* GOLDEN CIRCLE: WHY - INTENT */}
            <section className="py-32 px-6 bg-slate-50 relative">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.span
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="text-indigo-600 font-bold tracking-widest uppercase text-sm mb-4 block"
                    >
                        The Why
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-black text-slate-900 mb-8 leading-tight"
                    >
                        Your reality is a <span className="text-indigo-600">choice</span>.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="text-xl text-slate-600 leading-relaxed mb-12 font-light"
                    >
                        We often drift through our days, reacting to the noise around us.
                        But what if you could choose your mental environment as easily as you choose a song?
                        <br /><br />
                        <strong className="text-slate-900 font-medium">We believe in the power of Intent.</strong>
                    </motion.p>
                </div>
            </section>

            {/* GOLDEN CIRCLE: HOW - THE WINDOW */}
            <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="/assets/vision-nature.png"
                        alt="Calm Nature"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-indigo-950/70 mix-blend-multiply" />
                </div>
                <div className="relative z-10 text-center text-white px-6">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-emerald-400 font-bold tracking-widest uppercase text-sm mb-6 block"
                    >
                        The How
                    </motion.span>
                    <Wind className="w-16 h-16 mx-auto mb-6 text-emerald-400 opacity-90" />
                    <h2 className="text-4xl md:text-6xl font-bold mb-6">We Build Windows.</h2>
                    <p className="text-xl md:text-2xl text-slate-200 max-w-2xl mx-auto font-light">
                        Not feeds, not timelines, not lists.
                        <br />
                        Softale is a window into the state you wish to embody.
                        <br />
                        Whether it's Focus, Rest, or Dream... just open the window.
                    </p>
                </div>
            </section>

            {/* GOLDEN CIRCLE: WHAT */}
            {/* Continues into Benefits... */}

            {/* BENEFITS GRID */}
            <section className="py-32 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-3">Our Core Pillars</h3>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900">Designed for State Shift.</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: Moon, title: "Deep Sleep", desc: "Hypnotic tales engineered to lower your heart rate." },
                            { icon: Zap, title: "Flow State", desc: "Binaural rhythms that lock your focus without you trying." },
                            { icon: Wind, title: "Living Atmosphere", desc: "Soundscapes that evolve with your mood. Infinite, seamless loops." },
                            { icon: Heart, title: "Ethical Data", desc: "We use data solely to optimize your experience, never to sell it." }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
                            >
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                    <item.icon className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                                <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-32 text-center bg-slate-950 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(79,70,229,0.1))] opacity-20" />
                <div className="relative z-10 px-6">
                    <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">
                        Reclaim Your Mind.
                    </h2>
                    <p className="text-xl text-slate-400 mb-12 max-w-xl mx-auto">
                        Join the quiet revolution.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/" className="px-8 py-4 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-100 transition transform hover:scale-105 min-w-[200px]">
                            Listen Free
                        </Link>
                        <Link href="/upgrade" className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-500 transition transform hover:scale-105 shadow-lg shadow-indigo-900/50 min-w-[200px]">
                            Go Premium
                        </Link>
                    </div>
                    <p className="mt-12 text-xs text-slate-600 uppercase tracking-widest font-semibold">
                        Softale Inc. &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </section>
        </div>
    );
}
