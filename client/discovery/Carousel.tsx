import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDiscoverI18n } from './i18n';

interface CarouselProps {
    children: React.ReactNode;
}

const SCROLL_EDGE_PX = 8;

const isTvShell = () => {
    try {
        return document.documentElement?.dataset?.tv === '1'
            || window.__PLEX_CLIENT__?.isTv === true;
    } catch {
        return false;
    }
};

export const Carousel: React.FC<CarouselProps> = ({ children }) => {
    const { t } = useDiscoverI18n();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const canScrollRef = useRef(false);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(true);
    const [canScroll, setCanScroll] = useState(false);
    const [tvShell, setTvShell] = useState(false);

    useEffect(() => {
        setTvShell(isTvShell());
    }, []);

    const handleScroll = useCallback(() => {
        const node = scrollContainerRef.current;
        if (!node) return;
        const { scrollLeft, scrollWidth, clientWidth } = node;
        const overflow = scrollWidth > clientWidth + SCROLL_EDGE_PX;
        setCanScroll(overflow);
        canScrollRef.current = overflow;
        if (!overflow) {
            setAtStart(true);
            setAtEnd(true);
            return;
        }
        const maxScroll = Math.max(0, scrollWidth - clientWidth);
        setAtStart(scrollLeft <= SCROLL_EDGE_PX);
        setAtEnd(scrollLeft >= maxScroll - SCROLL_EDGE_PX);
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

        const mutationObserver = typeof MutationObserver !== 'undefined'
            ? new MutationObserver(() => handleScroll())
            : null;
        mutationObserver?.observe(node, { childList: true, subtree: true });

        const onWheel = (event: WheelEvent) => {
            if (!canScrollRef.current) return;
            if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) || event.shiftKey) return;
            const max = node.scrollWidth - node.clientWidth;
            if (max <= SCROLL_EDGE_PX) return;
            const next = node.scrollLeft + event.deltaY;
            if ((event.deltaY > 0 && node.scrollLeft < max - SCROLL_EDGE_PX)
                || (event.deltaY < 0 && node.scrollLeft > SCROLL_EDGE_PX)) {
                event.preventDefault();
                node.scrollLeft = Math.min(max, Math.max(0, next));
            }
        };
        node.addEventListener('wheel', onWheel, { passive: false });

        const onFocusIn = (event: FocusEvent) => {
            if (!isTvShell()) return;
            const target = event.target as HTMLElement | null;
            if (!target || !node.contains(target)) return;
            try {
                target.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' });
            } catch {
                /* ignore */
            }
        };
        node.addEventListener('focusin', onFocusIn);

        const t1 = window.setTimeout(handleScroll, 100);
        const t2 = window.setTimeout(handleScroll, 400);

        return () => {
            resizeObserver?.disconnect();
            mutationObserver?.disconnect();
            window.removeEventListener('resize', handleScroll);
            node.removeEventListener('wheel', onWheel);
            node.removeEventListener('focusin', onFocusIn);
            window.clearTimeout(t1);
            window.clearTimeout(t2);
        };
    }, [children, handleScroll]);

    const scroll = (direction: 'left' | 'right') => {
        const node = scrollContainerRef.current;
        if (!node || !canScroll) return;
        const { clientWidth } = node;
        const page = Math.max(clientWidth - 100, 160);

        if (direction === 'right') {
            if (atEnd) return;
            node.scrollBy({ left: page, behavior: 'smooth' });
            return;
        }
        if (atStart) return;
        node.scrollBy({ left: -page, behavior: 'smooth' });
    };

    return (
        <div className="relative w-full min-w-0">
            <div className="absolute right-1 -top-9 z-10 flex items-center text-muted">
                <button
                    type="button"
                    tabIndex={tvShell ? -1 : undefined}
                    onClick={() => scroll('left')}
                    disabled={!canScroll || atStart}
                    className={`p-0.5 transition-colors ${!canScroll || atStart ? 'text-muted/30 cursor-default' : 'hover:text-text'}`}
                    aria-label={t('common.scrollLeft')}
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    type="button"
                    tabIndex={tvShell ? -1 : undefined}
                    onClick={() => scroll('right')}
                    disabled={!canScroll || atEnd}
                    className={`p-0.5 transition-colors ${!canScroll || atEnd ? 'text-muted/30 cursor-default' : 'text-text/80 hover:text-text'}`}
                    aria-label={t('common.scrollRight')}
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            <div className="relative">
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    data-tv-rail="1"
                    className={`flex gap-4 overflow-x-auto snap-x snap-proximity scrollbar-hide hide-scrollbar w-full ${
                        tvShell ? 'px-4 py-3' : 'px-2 py-2'
                    }`}
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {children}
                </div>
                {canScroll && !atEnd ? (
                    <div
                        className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card to-transparent"
                        aria-hidden
                    />
                ) : null}
            </div>
        </div>
    );
};
