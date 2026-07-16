import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Loader2, Sparkles, X } from 'lucide-react';
import { SlideshowBackground } from '../shared/theme';
import { apiFetch } from '../shared/api';
import { discoveryTheme } from './discoveryThemeClasses';

type SearchResultProps = {
    query: string;
    searchOpen: boolean;
    searchLoading: boolean;
    searchResults: any[];
    onClose: () => void;
    onClear: () => void;
    onQueryChange: (value: string) => void;
    onFocus: () => void;
    onSelect: (formatted: any) => void;
    formatItem: (item: any) => any;
};

const SearchDropdown: React.FC<SearchResultProps & { anchorRect: DOMRect | null }> = ({
    query,
    searchOpen,
    searchLoading,
    searchResults,
    anchorRect,
    onSelect,
    formatItem,
}) => {
    if (!searchOpen || query.trim().length < 2 || !anchorRect) return null;

    return createPortal(
        <div
            data-discovery-search-dropdown
            className={discoveryTheme.searchDropdown}
            style={{
                position: 'fixed',
                top: anchorRect.bottom + 8,
                left: anchorRect.left,
                width: anchorRect.width,
                zIndex: 9999,
                // Solid fill — theme token alone can still read translucent over busy posters
                backgroundColor: 'rgb(var(--color-card))',
            }}
        >
            {searchLoading ? (
                <div className="flex items-center justify-center gap-2 p-6 text-muted">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Searching…
                </div>
            ) : searchResults.length === 0 ? (
                <div className="p-6 text-center text-muted text-sm">No results found.</div>
            ) : (
                searchResults.slice(0, 20).map((rawItem, idx) => {
                    const formatted = formatItem(rawItem);
                    const isPerson = formatted.type === 'person';
                    return (
                        <button
                            key={`${formatted.id}-${idx}`}
                            type="button"
                            onClick={() => onSelect(formatted)}
                            className={discoveryTheme.searchResultBtn}
                        >
                            <div className={`${isPerson ? 'w-12 h-12 rounded-full' : 'w-12 h-[72px] rounded-md'} overflow-hidden bg-white/5 flex-shrink-0`}>
                                {formatted.thumbUrl ? (
                                    <img src={formatted.thumbUrl} alt="" className="w-full h-full object-cover" />
                                ) : null}
                            </div>
                            <div className="min-w-0">
                                <div className="font-bold text-text truncate">{formatted.title}</div>
                                <div className="text-xs text-muted">
                                    {isPerson
                                        ? (formatted.tags?.[0] || 'Person')
                                        : [formatted.year, formatted.tags?.[0]].filter(Boolean).join(' · ')}
                                </div>
                            </div>
                        </button>
                    );
                })
            )}
        </div>,
        document.body,
    );
};

export const DiscoverHeroHeader: React.FC<SearchResultProps> = (props) => {
    const { query, onClear, onQueryChange, onFocus } = props;
    const [backgrounds, setBackgrounds] = useState<string[]>([]);
    const [intervalSeconds, setIntervalSeconds] = useState(12);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
    const searchWrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        apiFetch('/api/discovery/hero-backdrops')
            .then((res) => {
                if (Array.isArray(res?.backgrounds) && res.backgrounds.length) {
                    setBackgrounds(res.backgrounds);
                }
                if (res?.interval) setIntervalSeconds(Number(res.interval) || 12);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        const updateRect = () => {
            if (searchWrapRef.current) {
                setAnchorRect(searchWrapRef.current.getBoundingClientRect());
            }
        };
        updateRect();
        if (!props.searchOpen) return undefined;

        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true);
        return () => {
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
        };
    }, [props.searchOpen, query]);

    useEffect(() => {
        if (!props.searchOpen) return undefined;

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (searchWrapRef.current?.contains(target)) return;
            if (target.closest('[data-discovery-search-dropdown]')) return;
            props.onClose();
        };

        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [props.searchOpen, props.onClose]);

    return (
        <>
            <div className={discoveryTheme.heroShell}>
                <div className={discoveryTheme.heroBackdrop}>
                    {backgrounds.length > 0 ? (
                        <SlideshowBackground
                            backgrounds={backgrounds}
                            intervalSeconds={intervalSeconds}
                            opacity={0.55}
                        />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/40 to-transparent pointer-events-none" />
                    <div className="absolute inset-0 bg-background/20 pointer-events-none" />
                </div>

                <div className="relative z-10 p-6 sm:p-10 flex flex-col items-center justify-center text-center gap-5">
                    <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-plex opacity-90 drop-shadow-lg" />
                    <h1 className={discoveryTheme.heroTitle}>
                        Discover & Request
                    </h1>

                    <div ref={searchWrapRef} className="w-full max-w-2xl relative mt-1">
                        <Search className="w-5 h-5 sm:w-6 sm:h-6 text-muted absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                        <input
                            type="text"
                            placeholder="Search for a movie, TV show, or person..."
                            value={query}
                            onChange={(e) => onQueryChange(e.target.value)}
                            onFocus={onFocus}
                            className={discoveryTheme.searchInput}
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={onClear}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <SearchDropdown {...props} anchorRect={anchorRect} />
        </>
    );
};
