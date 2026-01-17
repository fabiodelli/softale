'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface UseDragScrollOptions {
    sensitivity?: number;
}

interface UseDragScrollReturn {
    ref: React.RefObject<HTMLDivElement | null>;
    isDragging: boolean;
    handlers: {
        onMouseDown: (e: React.MouseEvent) => void;
        onMouseMove: (e: React.MouseEvent) => void;
        onMouseUp: () => void;
        onMouseLeave: () => void;
    };
}

export function useDragScroll(options: UseDragScrollOptions = {}): UseDragScrollReturn {
    const { sensitivity = 1 } = options;
    const ref = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        if (!ref.current) return;

        // Only left mouse button
        if (e.button !== 0) return;

        setIsDragging(true);
        setStartX(e.pageX - ref.current.offsetLeft);
        setScrollLeft(ref.current.scrollLeft);

        // Change cursor
        ref.current.style.cursor = 'grabbing';
        ref.current.style.userSelect = 'none';
    }, []);

    const onMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !ref.current) return;

        e.preventDefault();
        const x = e.pageX - ref.current.offsetLeft;
        const walk = (x - startX) * sensitivity;
        ref.current.scrollLeft = scrollLeft - walk;
    }, [isDragging, startX, scrollLeft, sensitivity]);

    const onMouseUp = useCallback(() => {
        setIsDragging(false);
        if (ref.current) {
            ref.current.style.cursor = 'grab';
            ref.current.style.userSelect = '';
        }
    }, []);

    const onMouseLeave = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            if (ref.current) {
                ref.current.style.cursor = 'grab';
                ref.current.style.userSelect = '';
            }
        }
    }, [isDragging]);

    // Set initial cursor style
    useEffect(() => {
        if (ref.current) {
            ref.current.style.cursor = 'grab';
        }
    }, []);

    return {
        ref,
        isDragging,
        handlers: {
            onMouseDown,
            onMouseMove,
            onMouseUp,
            onMouseLeave,
        },
    };
}
