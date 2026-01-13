import { ReactNode } from 'react';

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
    return (
        <section className={`mb-8 ${className}`}>
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg font-bold text-white [text-shadow:_0_1px_3px_rgb(0_0_0_/_90%)] flex items-center gap-2">
                    {emoji && <span className="text-base">{emoji}</span>}
                    {title}
                </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 md:-mx-12 px-6 md:px-12">
                {children}
            </div>
        </section>
    );
}
