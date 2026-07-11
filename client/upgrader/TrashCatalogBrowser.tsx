import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, ExternalLink, RefreshCw, Search, Download } from 'lucide-react';
import { apiFetch } from '../shared/api';

export type TrashCatalogItem = {
    slug: string;
    name: string;
    trashId: string;
    category: string;
    defaultScore: number | null;
    specCount: number;
};

export type TrashCatalogCategory = {
    name: string;
    items: TrashCatalogItem[];
};

type Props = {
    onImport: (format: { name: string; includeCustomFormatWhenRenaming: boolean; specifications: any[]; trashId?: string; defaultScore?: number | null }) => void;
};

export const TrashCatalogBrowser: React.FC<Props> = ({ onImport }) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [categories, setCategories] = useState<TrashCatalogCategory[]>([]);
    const [sourceUrl, setSourceUrl] = useState('https://trash-guides.info/Sonarr/sonarr-collection-of-custom-formats/');
    const [itemCount, setItemCount] = useState(0);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);
    const [preview, setPreview] = useState<any | null>(null);

    const loadCatalog = useCallback(async (refresh = false) => {
        if (refresh) setRefreshing(true);
        else setLoading(true);
        setError('');
        try {
            const res = await apiFetch(`/api/upgrader/trash/sonarr/catalog${refresh ? '?refresh=1' : ''}`);
            setCategories(res?.categories || []);
            setItemCount(res?.itemCount || 0);
            if (res?.source) setSourceUrl(res.source);
        } catch (e: any) {
            setError(e.message || 'Failed to load TRaSH catalog');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadCatalog(false);
    }, [loadCatalog]);

    const filteredCategories = useMemo(() => {
        const q = search.trim().toLowerCase();
        return categories
            .filter((cat) => !categoryFilter || cat.name === categoryFilter)
            .map((cat) => ({
                ...cat,
                items: cat.items.filter((item) => {
                    if (!q) return true;
                    return item.name.toLowerCase().includes(q)
                        || item.slug.toLowerCase().includes(q)
                        || item.category.toLowerCase().includes(q);
                }),
            }))
            .filter((cat) => cat.items.length > 0);
    }, [categories, search, categoryFilter]);

    const visibleCount = filteredCategories.reduce((n, c) => n + c.items.length, 0);

    const loadPreview = async (slug: string) => {
        setSelectedSlug(slug);
        setPreview(null);
        try {
            const res = await apiFetch(`/api/upgrader/trash/sonarr/catalog/${encodeURIComponent(slug)}`);
            setPreview(res?.format || null);
        } catch (e: any) {
            setError(e.message || 'Failed to load format');
        }
    };

    const handleImport = async (slug: string) => {
        setImporting(true);
        setError('');
        try {
            const res = await apiFetch(`/api/upgrader/trash/sonarr/catalog/${encodeURIComponent(slug)}`);
            const format = res?.format;
            if (!format) throw new Error('Format not found');
            onImport({
                name: format.name,
                includeCustomFormatWhenRenaming: !!format.includeCustomFormatWhenRenaming,
                specifications: format.specifications || [],
                trashId: format.trash_id,
                defaultScore: format.trash_scores?.default ?? null,
            });
        } catch (e: any) {
            setError(e.message || 'Import failed');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-3 p-4 rounded-xl border border-plex/30 bg-plex/5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-text">
                        <BookOpen className="w-4 h-4 text-plex" />
                        TRaSH Guides Catalog
                    </div>
                    <p className="text-xs text-muted mt-1">
                        Browse the full{' '}
                        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-plex hover:underline inline-flex items-center gap-0.5">
                            Sonarr collection
                            <ExternalLink className="w-3 h-3" />
                        </a>
                        {' '}— audio, HDR, streaming, tiers, language, anime, and more ({itemCount} formats).
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => loadCatalog(true)}
                    disabled={refreshing || loading}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted hover:text-text disabled:opacity-50"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>
            )}

            <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[12rem]">
                    <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search formats…"
                        className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-text"
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-text max-w-[14rem]"
                >
                    <option value="">All categories</option>
                    {categories.map((c) => (
                        <option key={c.name} value={c.name}>{c.name} ({c.items.length})</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="text-xs text-muted py-6 text-center">Loading TRaSH catalog…</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-72 overflow-hidden">
                    <div className="overflow-y-auto custom-scrollbar border border-border rounded-lg bg-background/40 divide-y divide-border/60">
                        <div className="sticky top-0 bg-card/95 backdrop-blur px-3 py-1.5 text-[10px] text-muted border-b border-border">
                            {visibleCount} shown
                        </div>
                        {filteredCategories.map((cat) => (
                            <div key={cat.name}>
                                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-plex/80 bg-plex/5">
                                    {cat.name}
                                </div>
                                {cat.items.map((item) => (
                                    <button
                                        key={item.slug}
                                        type="button"
                                        onClick={() => loadPreview(item.slug)}
                                        className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors ${
                                            selectedSlug === item.slug ? 'bg-plex/10 text-plex' : 'text-text'
                                        }`}
                                    >
                                        <div className="font-medium truncate">{item.name}</div>
                                        <div className="text-[10px] text-muted">
                                            {item.specCount} spec{item.specCount === 1 ? '' : 's'}
                                            {item.defaultScore != null ? ` · score ${item.defaultScore}` : ''}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ))}
                        {!visibleCount && (
                            <div className="px-3 py-6 text-xs text-muted text-center">No formats match your search.</div>
                        )}
                    </div>

                    <div className="overflow-y-auto custom-scrollbar border border-border rounded-lg bg-background/40 p-3 space-y-3">
                        {!selectedSlug ? (
                            <div className="text-xs text-muted py-8 text-center">Select a format to preview and import.</div>
                        ) : !preview ? (
                            <div className="text-xs text-muted py-8 text-center">Loading preview…</div>
                        ) : (
                            <>
                                <div>
                                    <div className="text-sm font-bold text-text">{preview.name}</div>
                                    <div className="text-[10px] text-muted mt-1 font-mono truncate">{preview.trash_id}</div>
                                    {preview.trash_scores?.default != null && (
                                        <div className="text-xs text-muted mt-1">Default profile score: {preview.trash_scores.default}</div>
                                    )}
                                </div>
                                <div className="text-xs text-muted">
                                    {Array.isArray(preview.specifications) ? preview.specifications.length : 0} conditions
                                </div>
                                <ul className="text-[11px] text-muted space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                    {(preview.specifications || []).slice(0, 12).map((spec: any, i: number) => (
                                        <li key={`${spec.name}-${i}`} className="truncate">
                                            {spec.negate ? '¬ ' : ''}{spec.name} ({spec.implementationName || spec.implementation})
                                        </li>
                                    ))}
                                    {(preview.specifications || []).length > 12 && (
                                        <li className="text-muted">…and {(preview.specifications || []).length - 12} more</li>
                                    )}
                                </ul>
                                <button
                                    type="button"
                                    disabled={importing}
                                    onClick={() => handleImport(selectedSlug)}
                                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-plex text-background text-xs font-bold hover:bg-plex/90 disabled:opacity-50"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    {importing ? 'Importing…' : 'Import into editor'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
