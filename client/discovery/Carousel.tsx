import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
    children: React.ReactNode;
}

export const Carousel: React.FC<CarouselProps> = ({ children }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);

    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        const canScroll = scrollWidth > clientWidth + 8;
        setShowLeft(canScroll && scrollLeft > 12);
        setShowRight(canScroll && scrollLeft < scrollWidth - clientWidth - 12);
    }, []);

    useEffect(() => {
        handleScroll();
        const node = scrollContainerRef.current;
        if (!node) return undefined;

        const resizeObserver = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(() => handleScroll())
            : null;
        resizeObserver?.observe(node);
        window.addEventListener('resize', handleScroll);

        // Re-measure after images/layout settle
        const t = window.setTimeout(handleScroll, 100);

        return () => {
            resizeObserver?.disconnect();
            window.removeEventListener('resize', handleScroll);
            window.clearTimeout(t);
        };
    }, [children, handleScroll]);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;
        const { clientWidth } = scrollContainerRef.current;
        const scrollAmount = direction === 'left' ? -clientWidth + 100 : clientWidth - 100;

        scrollContainerRef.current.scrollBy({
            left: scrollAmount,
            behavior: 'smooth',
        });
    };

    return (
        <div className="relative group/carousel w-full min-w-0">
            {showLeft && (
                <>
                    <div
                        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-24 bg-gradient-to-r from-background via-background/80 to-transparent"
                        aria-hidden
                    />
                    <button
                        type="button"
                        onClick={() => scroll('left')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-card/95 backdrop-blur-md border border-border shadow-xl opacity-90 sm:opacity-0 sm:group-hover/carousel:opacity-100 transition-all hover:scale-110 hover:bg-card"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="w-6 h-6 text-text" />
                    </button>
                </>
            )}

            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide py-2 px-2 w-full"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {children}
            </div>

            {showRight && (
                <>
                    <div
                        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-28 bg-gradient-to-l from-background via-background/85 to-transparent"
                        aria-hidden
                    />
                    <button
                        type="button"
                        onClick={() => scroll('right')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-card/95 backdrop-blur-md border border-border shadow-xl opacity-90 sm:opacity-0 sm:group-hover/carousel:opacity-100 transition-all hover:scale-110 hover:bg-card"
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="w-6 h-6 text-text" />
                    </button>
                </>
            )}
        </div>
    );
};
