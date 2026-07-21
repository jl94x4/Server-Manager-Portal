import React, { useEffect, useState, useMemo } from 'react';
import { api, collexionsImageUrl } from '../api';
import { PlexCollection } from '../types';
import {
    Image as ImageIcon,
    Pin,
    PinOff,
    Search,
    RefreshCw,
    Library,
    CheckCircle2,
    Info,
    ChevronDown,
    Check,
    ExternalLink,
} from 'lucide-react';
import { CustomSelect } from '../../shared/ui';
import {
    normalizeUpgraderGridSize,
    UPGRADER_GRID_SIZE_OPTIONS,
    upgraderPosterGridClass,
    upgraderPosterGridStyle,
    type UpgraderGridSize,
} from '../../shared/portalLayout';

const LEGACY_GRID_MAP: Record<string, UpgraderGridSize> = {
    sm: 'small',
    md: 'medium',
    lg: 'large',
};

const Gallery: React.FC = () => {
    const [collections, setCollections] = useState<PlexCollection[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLibrary, setSelectedLibrary] = useState<string>('All');
    const [showPinnedOnly, setShowPinnedOnly] = useState(false);
    const [gridSize, setGridSize] = useState<UpgraderGridSize>('medium');
    const [pinningId, setPinningId] = useState<string | null>(null);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);

    useEffect(() => {
        const savedState = localStorage.getItem('collexions_gallery_state');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                if (state.searchQuery !== undefined) setSearchQuery(state.searchQuery);
                if (state.selectedLibrary !== undefined) setSelectedLibrary(state.selectedLibrary);
                if (state.showPinnedOnly !== undefined) setShowPinnedOnly(state.showPinnedOnly);
                if (state.gridSize !== undefined) {
                    const raw = String(state.gridSize);
                    setGridSize(normalizeUpgraderGridSize(LEGACY_GRID_MAP[raw] || raw));
                }
            } catch (e) {
                console.error('Failed to parse saved gallery state', e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('collexions_gallery_state', JSON.stringify({
            searchQuery,
            selectedLibrary,
            showPinnedOnly,
            gridSize,
        }));
    }, [searchQuery, selectedLibrary, showPinnedOnly, gridSize]);

    const libraries = useMemo(() => {
        const libs = ['All', ...new Set(collections.map(c => c.library))];
        return libs.sort();
    }, [collections]);

    useEffect(() => {
        fetchCollections();
    }, []);

    const fetchCollections = async (isManual = false) => {
        setLoading(true);
        setLoadError('');
        try {
            const data = await api.getCollections(isManual);
            setCollections(Array.isArray(data) ? data : []);
        } catch (e: any) {
            console.error('Failed to fetch collections', e);
            setLoadError(e?.message || 'Failed to load collections from Plex.');
            setCollections([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePinToggle = async (coll: PlexCollection) => {
        const id = `${coll.library}-${coll.title}`;
        setPinningId(id);

        try {
            if (coll.is_pinned) {
                await api.unpinCollection(coll.title, coll.library);
            } else {
                await api.pinCollection(coll.title, coll.library);
            }
            await fetchCollections();
        } catch (e) {
            alert('Action failed. Check Plex connection.');
        } finally {
            setPinningId(null);
        }
    };

    const filteredCollections = useMemo(() => {
        return collections.filter(c => {
            const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchLib = selectedLibrary === 'All' || c.library === selectedLibrary;
            const matchPinned = !showPinnedOnly || c.is_pinned;
            return matchSearch && matchLib && matchPinned;
        });
    }, [collections, searchQuery, selectedLibrary, showPinnedOnly]);

    const isCompact = gridSize === 'small';
    const isList = gridSize === 'list';
    const imageSize = useMemo(() => {
        switch (gridSize) {
            case 'small': return { width: 160, height: 240 };
            case 'medium': return { width: 240, height: 360 };
            case 'large': return { width: 320, height: 480 };
            case 'xlarge': return { width: 400, height: 600 };
            case 'list': return { width: 96, height: 144 };
            default: return { width: 320, height: 480 };
        }
    }, [gridSize]);

    if (loading && collections.length === 0) {
        return (
            <div className="flex flex-col h-96 items-center justify-center text-muted animate-pulse">
                <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
                <p>Scanning Plex Libraries...</p>
            </div>
        );
    }

    if (loadError && collections.length === 0) {
        return (
            <div className="flex flex-col h-96 items-center justify-center text-muted gap-3">
                <ImageIcon className="w-12 h-12 opacity-40" />
                <p className="text-sm text-red-300">{loadError}</p>
                <button
                    type="button"
                    onClick={() => fetchCollections(true)}
                    className="px-4 py-2 rounded-lg bg-plex text-background text-sm font-bold hover:bg-plex-hover transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-text tracking-tight">Collection Gallery</h2>
                    <p className="text-muted mt-1 flex items-center gap-2 text-sm">
                        <Library className="w-4 h-4" />
                        Explore and manually pin collections to your Home Screen
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => fetchCollections(true)}
                    className="p-2 rounded-lg bg-card border border-border text-muted hover:text-text transition-colors"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                        type="text"
                        placeholder="Search collections..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-card/60 border border-border rounded-xl py-2.5 pl-10 pr-4 text-text focus:outline-none focus:border-plex transition-colors"
                    />
                </div>

                <div className="relative w-full md:w-64">
                    <button
                        type="button"
                        onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                        className="w-full bg-card/60 border border-border rounded-xl py-2.5 pl-4 pr-10 text-text flex items-center justify-between focus:outline-none focus:border-plex transition-all hover:bg-white/5"
                    >
                        <div className="flex items-center gap-2 truncate">
                            <Library className="w-4 h-4 text-muted" />
                            <span className="truncate">{selectedLibrary}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted transition-transform ${isLibraryOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isLibraryOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsLibraryOpen(false)}
                            />
                            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl overflow-hidden shadow-2xl z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="max-h-60 overflow-y-auto scrollbar-thin">
                                    {libraries.map(lib => (
                                        <button
                                            type="button"
                                            key={lib}
                                            onClick={() => {
                                                setSelectedLibrary(lib);
                                                setIsLibraryOpen(false);
                                            }}
                                            className={`w-full px-4 py-2.5 text-sm text-left flex items-center justify-between transition-colors hover:bg-white/5 ${selectedLibrary === lib ? 'text-plex bg-plex/5' : 'text-text'
                                                }`}
                                        >
                                            {lib}
                                            {selectedLibrary === lib && <Check className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <CustomSelect
                    value={gridSize}
                    onChange={(value) => setGridSize(normalizeUpgraderGridSize(value))}
                    options={UPGRADER_GRID_SIZE_OPTIONS}
                    className="w-full md:w-44"
                    compact
                />

                <button
                    type="button"
                    onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all border ${showPinnedOnly
                        ? 'bg-plex text-background border-plex shadow-lg'
                        : 'bg-card/60 border-border text-muted hover:text-text'
                        }`}
                    title="Show Pinned Only"
                >
                    <Pin className={`w-4 h-4 ${showPinnedOnly ? 'fill-current' : ''}`} />
                    <span className="hidden lg:inline text-xs whitespace-nowrap">Pinned Only</span>
                </button>
            </div>

            <div className={upgraderPosterGridClass(gridSize)} style={upgraderPosterGridStyle(gridSize)}>
                {filteredCollections.map((coll, idx) => {
                    const id = `${coll.library}-${coll.title}`;
                    const uniqueKey = `${id}-${idx}`;
                    const isProcessing = pinningId === id;

                    if (isList) {
                        return (
                            <div
                                key={uniqueKey}
                                className="group flex items-center gap-4 bg-card/50 border border-border rounded-xl overflow-hidden hover:border-plex/40 transition-all p-3"
                            >
                                <div className="w-14 h-[84px] shrink-0 rounded-lg overflow-hidden bg-card">
                                    {coll.thumb ? (
                                        <img
                                            src={collexionsImageUrl(coll.thumb, imageSize)}
                                            alt={coll.title}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                            decoding="async"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted">
                                            <ImageIcon className="w-5 h-5 opacity-30" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {coll.plexUrl ? (
                                            <a
                                                href={coll.plexUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-bold text-text truncate hover:text-plex transition-colors"
                                                title="Open in Plex"
                                            >
                                                {coll.title}
                                            </a>
                                        ) : (
                                            <h3 className="font-bold text-text truncate group-hover:text-plex transition-colors">
                                                {coll.title}
                                            </h3>
                                        )}
                                        {coll.is_pinned && (
                                            <span className="text-[10px] font-bold uppercase bg-plex text-background px-1.5 py-0.5 rounded">Pinned</span>
                                        )}
                                        {coll.has_label && !coll.is_pinned && (
                                            <span className="text-[10px] font-bold uppercase bg-white/10 text-muted px-1.5 py-0.5 rounded">Tracked</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted uppercase mt-0.5">{coll.library}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {coll.plexUrl && (
                                        <a
                                            href={coll.plexUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="rounded-lg border border-border bg-card/60 text-muted hover:text-plex hover:border-plex/40 p-2 transition-colors"
                                            title="Open in Plex"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handlePinToggle(coll)}
                                        disabled={isProcessing}
                                        className={`rounded-lg font-bold flex items-center justify-center gap-2 transition-all border px-3 py-2 text-xs ${coll.is_pinned
                                            ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                            } disabled:opacity-50`}
                                    >
                                        {isProcessing ? (
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                        ) : coll.is_pinned ? (
                                            <>
                                                <PinOff className="w-3 h-3" />
                                                Unpin
                                            </>
                                        ) : (
                                            <>
                                                <Pin className="w-3 h-3" />
                                                Pin
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={uniqueKey}
                            className={`group relative flex flex-col bg-card/50 border border-border overflow-hidden hover:border-plex/40 transition-all hover:shadow-2xl hover:shadow-black/50 ${isCompact ? 'rounded-xl' : 'rounded-2xl'}`}
                        >
                            <div className="aspect-[2/3] bg-card relative overflow-hidden">
                                {coll.plexUrl ? (
                                    <a
                                        href={coll.plexUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full h-full"
                                        title="Open in Plex"
                                    >
                                        {coll.thumb ? (
                                            <img
                                                src={collexionsImageUrl(coll.thumb, imageSize)}
                                                alt={coll.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                                decoding="async"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-card text-muted">
                                                <ImageIcon className="w-10 h-10 opacity-30" />
                                            </div>
                                        )}
                                    </a>
                                ) : coll.thumb ? (
                                    <img
                                        src={collexionsImageUrl(coll.thumb, imageSize)}
                                        alt={coll.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                        decoding="async"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-card text-muted">
                                        <ImageIcon className="w-10 h-10 opacity-30" />
                                    </div>
                                )}
                                {coll.plexUrl && (
                                    <a
                                        href={coll.plexUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`absolute top-2 left-2 bg-black/70 hover:bg-plex text-white rounded flex items-center gap-1 shadow-lg ring-1 ring-white/20 transition-colors ${isCompact ? 'px-1 py-0.5 text-[8px]' : 'px-2 py-1 text-[10px] font-bold'}`}
                                        title="Open in Plex"
                                    >
                                        <ExternalLink className={isCompact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                                        {!isCompact && <span>Plex</span>}
                                    </a>
                                )}
                                {coll.is_pinned && (
                                    <div className={`absolute top-2 right-2 bg-plex text-background font-bold rounded flex items-center gap-1 shadow-lg ring-1 ring-white/20 ${isCompact ? 'px-1 py-0.5 text-[8px]' : 'px-2 py-1 text-[10px]'}`}>
                                        <Pin className={`${isCompact ? 'w-2 h-2' : 'w-3 h-3'} fill-current`} /> PINNED
                                    </div>
                                )}
                                {coll.has_label && !coll.is_pinned && (
                                    <div className={`absolute top-2 right-2 bg-plex/90 text-background font-bold rounded flex items-center gap-1 shadow-lg ring-1 ring-white/20 ${isCompact ? 'px-1 py-0.5 text-[8px]' : 'px-2 py-1 text-[10px]'}`}>
                                        <CheckCircle2 className={`${isCompact ? 'w-2 h-2' : 'w-3 h-3'}`} /> TRACKED
                                    </div>
                                )}
                            </div>

                            <div className={`${isCompact ? 'p-2' : 'p-4'} flex-1 flex flex-col justify-between`}>
                                <div className={isCompact ? 'mb-1' : 'mb-3'}>
                                    {coll.plexUrl ? (
                                        <a
                                            href={coll.plexUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`font-bold text-text line-clamp-2 leading-snug hover:text-plex transition-colors block ${isCompact ? 'text-[10px]' : 'text-sm'}`}
                                            title="Open in Plex"
                                        >
                                            {coll.title}
                                        </a>
                                    ) : (
                                        <h3 className={`font-bold text-text line-clamp-2 leading-snug group-hover:text-plex transition-colors ${isCompact ? 'text-[10px]' : 'text-sm'}`}>
                                            {coll.title}
                                        </h3>
                                    )}
                                    {!isCompact && (
                                        <p className="text-[10px] text-muted font-medium uppercase mt-1">
                                            {coll.library}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handlePinToggle(coll)}
                                    disabled={isProcessing}
                                    className={`w-full rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all border whitespace-nowrap ${isCompact ? 'py-1 text-[10px]' : 'py-2 text-xs'} ${coll.is_pinned
                                        ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                        } disabled:opacity-50`}
                                >
                                    {isProcessing ? (
                                        <RefreshCw className={`${isCompact ? 'w-2 h-2' : 'w-3 h-3'} shrink-0 animate-spin`} />
                                    ) : coll.is_pinned ? (
                                        <>
                                            <PinOff className={`${isCompact ? 'w-2 h-2' : 'w-3 h-3'} shrink-0`} />
                                            <span className={isCompact ? 'hidden' : ''}>Unpin</span>
                                            {isCompact && <span>Unpin</span>}
                                        </>
                                    ) : (
                                        <>
                                            <Pin className={`${isCompact ? 'w-2 h-2' : 'w-3 h-3'} shrink-0`} />
                                            <span className={isCompact ? 'hidden' : ''}>Pin to Home</span>
                                            {isCompact && <span>Pin</span>}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredCollections.length === 0 && (
                <div className="h-64 flex flex-col items-center justify-center text-muted border-2 border-dashed border-border rounded-3xl">
                    <Search className="w-12 h-12 mb-2 opacity-10" />
                    <p>No collections match your filters</p>
                </div>
            )}

            <div className="p-4 bg-card/30 border border-border rounded-2xl flex items-start gap-3 text-xs text-muted">
                <Info className="w-4 h-4 text-plex flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p><b className="text-text">Pinned</b>: Visible on your Plex Home Screen and Shared Home Screens.</p>
                    <p><b className="text-text">Tracked</b>: Has the script label but currently hidden from Home.</p>
                    <p><b className="text-text">Manual Pinning</b>: Overrides schedule until the next run unpins it (unless excluded).</p>
                </div>
            </div>
        </div>
    );
};

export default Gallery;
