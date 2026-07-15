import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
    children: React.ReactNode;
}

export const Carousel: React.FC<CarouselProps> = ({ children }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(true);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeft(scrollLeft > 20);
        setShowRight(scrollLeft < scrollWidth - clientWidth - 20);
    };

    useEffect(() => {
        handleScroll();
        window.addEventListener('resize', handleScroll);
        return () => window.removeEventListener('resize', handleScroll);
    }, [children]);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;
        const { clientWidth } = scrollContainerRef.current;
        const scrollAmount = direction === 'left' ? -clientWidth + 100 : clientWidth - 100;
        
        scrollContainerRef.current.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    };

    return (
        <div className="relative group/carousel w-full">
            {/* Left Button */}
            {showLeft && (
                <button 
                    onClick={() => scroll('left')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-card/90 backdrop-blur-md border border-border opacity-0 group-hover/carousel:opacity-100 transition-all hover:scale-110 hover:bg-card shadow-xl"
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="w-6 h-6 text-text" />
                </button>
            )}

            {/* Scroll Container */}
            <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide py-2 px-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {children}
            </div>

            {/* Right Button */}
            {showRight && (
                <button 
                    onClick={() => scroll('right')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-card/90 backdrop-blur-md border border-border opacity-0 group-hover/carousel:opacity-100 transition-all hover:scale-110 hover:bg-card shadow-xl"
                    aria-label="Scroll right"
                >
                    <ChevronRight className="w-6 h-6 text-text" />
                </button>
            )}
        </div>
    );
};
