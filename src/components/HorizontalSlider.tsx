'use client';

import { ReactNode, useRef } from 'react';

interface HorizontalSliderProps {
    title: string;
    emoji?: string;
    children: ReactNode;
    className?: string;
}

/**
 * Horizontal scrollable slider component for displaying content in rows
 * Used in Library page for category sections
 */
export default function HorizontalSlider({
    title,
    emoji,
    children,
    className = ''
}: HorizontalSliderProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const startXRef = useRef(0);
    const scrollLeftStartRef = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollRef.current || e.button !== 0) return;
        e.preventDefault(); // Prevent browser's default image drag behavior
        isDraggingRef.current = true;
        startXRef.current = e.pageX - scrollRef.current.offsetLeft;
        scrollLeftStartRef.current = scrollRef.current.scrollLeft;
        scrollRef.current.style.cursor = 'grabbing';
        scrollRef.current.style.userSelect = 'none';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingRef.current || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startXRef.current) * 1.5;
        scrollRef.current.scrollLeft = scrollLeftStartRef.current - walk;
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
        if (scrollRef.current) {
            scrollRef.current.style.cursor = 'grab';
            scrollRef.current.style.userSelect = '';
        }
    };

    const handleMouseLeave = () => {
        isDraggingRef.current = false;
        if (scrollRef.current) {
            scrollRef.current.style.cursor = 'grab';
            scrollRef.current.style.userSelect = '';
        }
    };

    return (
        <section className={`mb-8 ${className}`}>
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg font-bold text-white [text-shadow:_0_1px_3px_rgb(0_0_0_/_90%)] flex items-center gap-2">
                    {emoji && <span className="text-base">{emoji}</span>}
                    {title}
                </h2>
            </div>
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 md:-mx-12 px-6 md:px-12 cursor-grab"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
            >
                {children}
            </div>
        </section>
    );
}

