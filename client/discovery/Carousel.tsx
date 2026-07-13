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
        <div className="relative group w-full">
            {/* Left Button */}
            {showLeft && (
                <button 
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-0 bottom-4 w-12 z-20 flex items-center justify-center bg-gradient-to-r from-card via-card/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="w-8 h-8 text-white drop-shadow-lg transform -translate-x-1" />
                </button>
            )}

            {/* Scroll Container */}
            <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex gap-4 overflow-x-auto pb-4 px-2 custom-scrollbar no-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {children}
            </div>

            {/* Right Button */}
            {showRight && (
                <button 
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-0 bottom-4 w-12 z-20 flex items-center justify-center bg-gradient-to-l from-card via-card/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Scroll right"
                >
                    <ChevronRight className="w-8 h-8 text-white drop-shadow-lg transform translate-x-1" />
                </button>
            )}
        </div>
    );
};
