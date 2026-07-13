import React, { useEffect, useState } from 'react';
import { ArrowLeft, Film, Tv } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { DiscoverPosterGrid } from './DiscoverPosterGrid';
import { DiscoverGridSizeSelect } from './DiscoverGridSizeSelect';
import { useDiscoverGridSize } from './useDiscoverGridSize';
import { filterHiddenAvailableItems, useDiscoveryPreferences } from './useDiscoveryPreferences';
import { findNetwork, findStudio, tmdbDuotoneLogo } from './discoverConstants';

type Props = {
    kind: 'studio' | 'network';
    id: number;
    onBack: () => void;
    onSelect: (item: any) => void;
    formatItem: (item: any) => any;
};

export const DiscoverCategoryPage: React.FC<Props> = ({ kind, id, onBack, onSelect, formatItem }) => {
    const { preferences } = useDiscoveryPreferences();
    const [gridSize, setGridSize] = useDiscoverGridSize();
    const meta = kind === 'studio' ? findStudio(id) : findNetwork(id);
    const [results, setResults] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [entityName, setEntityName] = useState(meta?.name || '');

    useEffect(() => {
        setPage(1);
        setResults([]);
    }, [kind, id]);

    useEffect(() => {
        const fetchPage = async () => {
            if (page === 1) setLoading(true);
            else setLoadingMore(true);
            try {
                const path = kind === 'studio'
                    ? `/api/discovery/proxy/discover/movies/studio/${id}?page=${page}`
                    : `/api/discovery/proxy/discover/tv/network/${id}?page=${page}`;
                const res = await apiFetch(path);
                const studioName = res?.studio?.name;
                const networkName = res?.network?.name;
                if (studioName) setEntityName(studioName);
                if (networkName) setEntityName(networkName);
                const batch = filterHiddenAvailableItems(res?.results || [], preferences.hideAvailableMedia);
                setResults((prev) => (page === 1 ? batch : [...prev, ...batch]));
                setTotalPages(Number(res?.totalPages || 1));
            } catch (e) {
                console.error(e);
                if (page === 1) {
                    const fallback = kind === 'studio'
                        ? `/api/discovery/proxy/discover/movies?page=${page}&studio=${id}`
                        : `/api/discovery/proxy/discover/tv?page=${page}&network=${id}`;
                    const res = await apiFetch(fallback).catch(() => null);
                    const batch = filterHiddenAvailableItems(res?.results || [], preferences.hideAvailableMedia);
                    setResults((prev) => (page === 1 ? batch : [...prev, ...batch]));
                    setTotalPages(Number(res?.totalPages || 1));
                }
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        };
        fetchPage();
    }, [kind, id, page, preferences.hideAvailableMedia]);

    const title = entityName || meta?.name || (kind === 'studio' ? 'Studio' : 'Network');

    return (
        <div className="w-full flex flex-col gap-8 pb-12">
            <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-white transition-colors w-fit"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Discover
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/90 to-black/60 flex-1">
                {meta?.logoPath ? (
                    <div className="w-[200px] h-[112px] rounded-xl border border-white/10 bg-zinc-900/80 flex items-center justify-center flex-shrink-0">
                        <img
                            src={tmdbDuotoneLogo(meta.logoPath)}
                            alt={title}
                            className="max-w-[78%] max-h-[58%] object-contain"
                        />
                    </div>
                ) : (
                    <div className="w-[200px] h-[112px] rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold">
                        {title}
                    </div>
                )}
                <div>
                    <div className="flex items-center gap-2 text-plex text-sm font-bold uppercase tracking-wider mb-2">
                        {kind === 'studio' ? <Film className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
                        {kind === 'studio' ? 'Movie Studio' : 'TV Network'}
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{title}</h1>
                    <p className="text-sm text-muted mt-2">
                        Browse {kind === 'studio' ? 'movies' : 'series'} from this {kind === 'studio' ? 'studio' : 'network'}.
                    </p>
                </div>
                </div>
                <DiscoverGridSizeSelect value={gridSize} onChange={setGridSize} className="min-w-[160px] self-start sm:self-center" />
            </div>

            <div className="px-2">
                <DiscoverPosterGrid
                    items={results}
                    gridSize={gridSize}
                    formatItem={formatItem}
                    onSelect={onSelect}
                    loading={loading}
                />
            </div>

            {!loading && page < totalPages && (
                <div className="flex justify-center mt-4">
                    <button
                        type="button"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={loadingMore}
                        className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white font-bold transition-all disabled:opacity-50"
                    >
                        {loadingMore ? 'Loading…' : 'Load More'}
                    </button>
                </div>
            )}
        </div>
    );
};
