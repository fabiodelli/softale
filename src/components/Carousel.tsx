'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CarouselProps {
    children: React.ReactNode;
    className?: string;
}

export default function Carousel({ children, className = '' }: CarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            // specific tolerance for rounding errors
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [children]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { clientWidth } = scrollRef.current;
            const scrollAmount = clientWidth * 0.8; // Scroll 80% of width
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
            // Check scroll after animation rough timing
            setTimeout(checkScroll, 500);
        }
    };

    return (
        <div className={`relative group/carousel ${className}`}>
            {/* Scroll Container */}
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x scroll-smooth -mx-4 px-4 md:mx-0 md:px-0"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {children}
            </div>

            {/* Left Arrow */}
            <AnimatePresence>
                {canScrollLeft && (
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-[40%] -translate-y-1/2 z-30 p-3 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full text-white border border-white/10 shadow-xl opacity-0 group-hover/carousel:opacity-100 transition-opacity hidden md:flex items-center justify-center"
                    >
                        <span className="text-xl">❮</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Right Arrow */}
            <AnimatePresence>
                {canScrollRight && (
                    <motion.button
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-[40%] -translate-y-1/2 z-30 p-3 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full text-white border border-white/10 shadow-xl opacity-0 group-hover/carousel:opacity-100 transition-opacity hidden md:flex items-center justify-center"
                    >
                        <span className="text-xl">❯</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Mobile Gradient Hints (Optional) */}
            <div className={`absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-950 to-transparent pointer-events-none transition-opacity duration-300 md:hidden ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`} />
            <div className={`absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none transition-opacity duration-300 md:hidden ${canScrollRight ? 'opacity-100' : 'opacity-0'}`} />

        </div>
    );
}
