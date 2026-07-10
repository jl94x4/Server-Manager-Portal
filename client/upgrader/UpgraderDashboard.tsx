import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpCircle, RefreshCw, Search, Settings as SettingsIcon, ArrowUpFromLine, Layers, Clock, History, Ban } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { portalUrl } from '../shared/basePath';
import { CustomSelect, OverlayCheckbox } from '../shared/ui';
import { Loader, ToastContainer, pushToast } from '../shared/toast';
import { normalizeUpgraderGridSize, UPGRADER_GRID_SIZE_OPTIONS, UPGRADER_GRID_SIZE_STORAGE_KEY, upgraderPosterGridClass, upgraderPosterGridStyle, type UpgraderGridSize } from '../shared/portalLayout';
import { DiscoverPosterCard } from '../screens';
import type { ToastMessage } from '../shared/types';
import { UpgraderUpgradeModal } from './UpgraderUpgradeModal';
import { UpgraderShowDrawer } from './UpgraderShowDrawer';
import { UpgraderHistoryPanel } from './UpgraderHistoryPanel';
import { UpgraderExclusionsPanel } from './UpgraderExclusionsPanel';
import type {
    UpgraderItem,
    UpgraderPreset,
    UpgraderQueueSummary,
    UpgraderStatus,
    UpgraderSummary,
} from './types';

import { UPGRADER_PRESET_OPTIONS } from './presets';

const SORT_OPTIONS = [
    { value: 'sizeGB', label: 'Largest first' },
    { value: 'watchCount', label: 'Most watched' },
    { value: 'addedAt', label: 'Recently added' },
    { value: 'daysSinceAdded', label: 'Oldest added' },
    { value: 'staleAdded', label: 'Stale (old + unwatched)' },
    { value: 'title', label: 'Title A–Z' },
];

const isUpgradableItem = (item: UpgraderItem) => {
    if (item.mediaType === 'show') {
        if ((item.totalEpisodeCount ?? 0) > 0) return (item.nonHevcEpisodeCount ?? 0) > 0;
        return !item.isHevc;
    }
    return !item.isHevc;
};

type UpgraderTab = 'browse' | 'history' | 'exclusions';

const formatIndexAge = (generatedAt: string | null) => {
    if (!generatedAt) return 'never built';
    const ageMs = Date.now() - Date.parse(generatedAt);
    if (!Number.isFinite(ageMs) || ageMs < 0) return 'just now';
    const hours = Math.floor(ageMs / (60 * 60 * 1000));
    if (hours < 1) return 'under 1h ago';
    if (hours < 48) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

const isUpgraderDisabledError = (error: unknown) => {
    const msg = String((error as Error)?.message || error || '').toLowerCase();
    return msg.includes('library upgrader is disabled') || msg.includes('plex-only');
};

export const UpgraderDashboard: React.FC = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [rebuilding, setRebuilding] = useState(false);
    const [featureEnabled, setFeatureEnabled] = useState(false);
    const [status, setStatus] = useState<UpgraderStatus | null>(null);
    const [summary, setSummary] = useState<UpgraderSummary | null>(null);
    const [queue, setQueue] = useState<UpgraderQueueSummary | null>(null);
    const [items, setItems] = useState<UpgraderItem[]>([]);
    const [total, setTotal] = useState(0);
    const [libraries, setLibraries] = useState<Array<{ id: string; title: string; count: number }>>([]);
    const [preset, setPreset] = useState<UpgraderPreset>('non_hevc');
    const [presetReady, setPresetReady] = useState(false);
    const [sort, setSort] = useState('sizeGB');
    const [libraryId, setLibraryId] = useState('all');
    const [mediaType, setMediaType] = useState('all');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [showQualityBadges, setShowQualityBadges] = useState(true);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [upgradeItems, setUpgradeItems] = useState<UpgraderItem[]>([]);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<UpgraderTab>('browse');
    const [showDrawerItem, setShowDrawerItem] = useState<UpgraderItem | null>(null);
    const [gridSize, setGridSize] = useState<UpgraderGridSize>(() => {
        if (typeof window === 'undefined') return 'medium';
        return normalizeUpgraderGridSize(window.localStorage.getItem(UPGRADER_GRID_SIZE_STORAGE_KEY));
    });

    useEffect(() => {
        window.localStorage.setItem(UPGRADER_GRID_SIZE_STORAGE_KEY, gridSize);
    }, [gridSize]);

    const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToasts((prev) => pushToast(prev, message, type));
    }, []);

    useEffect(() => {
        apiFetch('/api/config')
            .then((configData) => {
                const defaultPreset = configData?.settings?.upgraderDefaultPreset;
                const defaultSort = configData?.settings?.upgraderDefaultSort;
                if (defaultPreset) setPreset(defaultPreset);
                if (defaultSort) setSort(defaultSort);
            })
            .catch(() => {})
            .finally(() => setPresetReady(true));
    }, []);

    const loadData = useCallback(async (silent = false) => {
        if (!presetReady) return;
        if (!silent) setLoading(true);
        try {
            const configData = await apiFetch('/api/config');
            const enabled = !!configData?.settings?.upgraderEnabled;
            setFeatureEnabled(enabled);
            if (!enabled) return;

            const [statusData, summaryData, itemsData, queueData, publicConfig] = await Promise.all([
                apiFetch('/api/upgrader/status'),
                apiFetch('/api/upgrader/summary'),
                apiFetch(`/api/upgrader/items?preset=${encodeURIComponent(preset)}&libraryId=${encodeURIComponent(libraryId)}&mediaType=${encodeURIComponent(mediaType)}&search=${encodeURIComponent(search)}&sort=${encodeURIComponent(sort)}&page=${page}&limit=48`),
                apiFetch('/api/upgrader/queue').catch(() => null),
                apiFetch('/api/config/public').catch(() => ({})),
            ]);

            setStatus(statusData || null);
            setSummary(summaryData || null);
            setQueue(queueData || null);
            setItems(Array.isArray(itemsData?.items) ? itemsData.items : []);
            setTotal(Number(itemsData?.total || 0));
            setLibraries(Array.isArray(itemsData?.libraries) ? itemsData.libraries : []);
            setShowQualityBadges(publicConfig?.showPosterQualityBadges !== false);
        } catch (e: any) {
            if (isUpgraderDisabledError(e)) {
                setFeatureEnabled(false);
                return;
            }
            addToast(e.message || 'Failed to load upgrader data', 'error');
        } finally {
            if (!silent) setLoading(false);
        }
    }, [addToast, libraryId, mediaType, page, preset, presetReady, search, sort]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 300);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        setSelectedKeys(new Set());
    }, [preset, libraryId, mediaType, search, page, sort]);

    const handleRebuild = async () => {
        setRebuilding(true);
        try {
            await apiFetch('/api/upgrader/rebuild', { method: 'POST' });
            addToast('Library index rebuild started.', 'success');
            await loadData(true);
        } catch (e: any) {
            addToast(e.message || 'Failed to rebuild index', 'error');
        } finally {
            setRebuilding(false);
        }
    };

    const openUpgradeModal = (targets: UpgraderItem[]) => {
        if (!status?.automationEnabled) {
            addToast('Enable Upgrader automation in Settings first.', 'error');
            return;
        }
        if (!status?.profileMapConfigured) {
            addToast('Configure HEVC quality profiles per ARR instance in Settings.', 'error');
            return;
        }
        const mapped = targets.filter((item) => item.arrMapped && isUpgradableItem(item));
        if (!mapped.length) {
            addToast('No ARR-mapped non-HEVC titles selected.', 'error');
            return;
        }
        setUpgradeItems(mapped);
        setUpgradeModalOpen(true);
    };

    const toggleSelected = (ratingKey: string) => {
        setSelectedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(ratingKey)) next.delete(ratingKey);
            else next.add(ratingKey);
            return next;
        });
    };

    const handleSnooze = async (item: UpgraderItem, days = 30) => {
        try {
            await apiFetch('/api/upgrader/snooze', {
                method: 'POST',
                body: JSON.stringify({ ratingKey: item.ratingKey, days }),
            });
            addToast(`Snoozed “${item.title}” for ${days} days.`, 'success');
            await loadData(true);
        } catch (e: any) {
            addToast(e.message || 'Failed to snooze title', 'error');
        }
    };

    const mediaServerLabel = status?.mediaServerType === 'jellyfin' ? 'Jellyfin' : 'Plex';

    const selectedItems = useMemo(
        () => items.filter((item) => selectedKeys.has(item.ratingKey)),
        [items, selectedKeys],
    );

    const summaryChips = useMemo(() => {
        if (!summary) return [];
        const chips = [
            `${summary.nonHevcCount} non-HEVC`,
            `${summary.arrMappedCount} mapped to ARR`,
            `index ${formatIndexAge(summary.generatedAt)}`,
        ];
        if (status?.automationEnabled) {
            chips.push(`${status.recentUpgradeCount}/${status.maxActionsPerHour} upgrades this hour`);
        }
        return chips;
    }, [summary, status]);

    const totalPages = Math.max(1, Math.ceil(total / 48));
    const automationReady = !!status?.automationEnabled && !!status?.profileMapConfigured;

    const tabButtonClass = (tab: UpgraderTab) =>
        `inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
            activeTab === tab ? 'bg-plex text-background border-plex' : 'bg-white/5 text-muted border-white/10 hover:text-text'
        }`;

    return (
        <div className="w-full max-w-[1400px] mx-auto pt-20 md:pt-8 pb-8">
            <ToastContainer toasts={toasts} setToasts={setToasts} />
            <UpgraderUpgradeModal
                isOpen={upgradeModalOpen}
                items={upgradeItems}
                onClose={() => setUpgradeModalOpen(false)}
                onCompleted={() => loadData(true)}
                addToast={addToast}
            />
            <UpgraderShowDrawer
                show={showDrawerItem}
                preset={preset}
                onClose={() => setShowDrawerItem(null)}
                onUpgrade={(item) => openUpgradeModal([item])}
                addToast={addToast}
                automationReady={automationReady}
            />
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <ArrowUpCircle className="w-8 h-8 text-plex" />
                            <h1 className="page-title">Upgrader</h1>
                        </div>
                        <p className="text-sm text-muted max-w-2xl">
                            Browse non-HEVC titles from {mediaServerLabel}, open your media server or Sonarr/Radarr, drill into show episodes, or optionally switch ARR profiles and trigger a search.
                        </p>
                    </div>
                    {featureEnabled && (
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-plex text-background font-bold hover:bg-plex-hover transition-colors disabled:opacity-50"
                            onClick={handleRebuild}
                            disabled={rebuilding || !!status?.rebuildInProgress}
                        >
                            <RefreshCw className={`w-4 h-4 ${rebuilding || status?.rebuildInProgress ? 'animate-spin' : ''}`} />
                            {rebuilding || status?.rebuildInProgress ? 'Rebuilding…' : 'Rebuild Index'}
                        </button>
                    )}
                </div>

                {!featureEnabled && (
                    <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
                        <h3 className="text-xl font-bold text-plex mb-2">Upgrader Disabled</h3>
                        <p className="text-sm text-muted mb-3">Library Upgrader is currently OFF.</p>
                        <p className="text-xs text-muted mb-4">Enable it in Settings → Library Upgrader, then click Save Settings.</p>
                        <a
                            href={portalUrl('/settings#upgrader')}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-plex text-background font-bold no-underline hover:bg-plex-hover transition-colors"
                        >
                            <SettingsIcon className="w-4 h-4" />
                            Open Settings
                        </a>
                    </div>
                )}

                {featureEnabled && (
                    <>
                        {summaryChips.length > 0 && activeTab === 'browse' && (
                            <div className="flex flex-wrap gap-2">
                                {summaryChips.map((chip) => (
                                    <span key={chip} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-text">
                                        {chip}
                                    </span>
                                ))}
                                {!status?.arrConfigured && (
                                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-200">
                                        No ARR instances configured — {mediaServerLabel} links still work
                                    </span>
                                )}
                                {status?.arrConfigured && !status.automationEnabled && (
                                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-muted">
                                        Automation off — browse only
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                            <button type="button" className={tabButtonClass('browse')} onClick={() => setActiveTab('browse')}>
                                Browse
                            </button>
                            <button type="button" className={tabButtonClass('history')} onClick={() => setActiveTab('history')}>
                                <History className="w-4 h-4" />
                                History
                            </button>
                            <button type="button" className={tabButtonClass('exclusions')} onClick={() => setActiveTab('exclusions')}>
                                <Ban className="w-4 h-4" />
                                Exclusions
                            </button>
                        </div>

                        {activeTab === 'history' && <UpgraderHistoryPanel />}

                        {activeTab === 'exclusions' && (
                            <UpgraderExclusionsPanel addToast={addToast} onChanged={() => loadData(true)} />
                        )}

                        {activeTab === 'browse' && (
                            <>
                        {queue && queue.totalQueued > 0 && (
                            <div className="rounded-xl border border-border/60 bg-card/40 px-4 py-3 flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-text">
                                    <Layers className="w-4 h-4 text-plex" />
                                    ARR queue: {queue.totalQueued} active
                                </div>
                                {queue.instances.filter((entry) => entry.total > 0).map((entry) => (
                                    <span key={entry.instanceId} className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-muted">
                                        {entry.instanceName}: {entry.total}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col lg:flex-row lg:items-end gap-3 p-4 rounded-2xl border border-border/60 bg-card/40">
                            <div className="flex flex-wrap gap-2">
                                {UPGRADER_PRESET_OPTIONS.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => { setPreset(option.id); setPage(1); }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${preset === option.id ? 'bg-plex text-background border-plex' : 'bg-white/5 text-muted border-white/10 hover:text-text'}`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:ml-auto">
                                <CustomSelect
                                    value={gridSize}
                                    onChange={(value) => setGridSize(normalizeUpgraderGridSize(value))}
                                    options={UPGRADER_GRID_SIZE_OPTIONS}
                                    className="min-w-[130px]"
                                />
                                <CustomSelect
                                    value={sort}
                                    onChange={(value) => { setSort(value); setPage(1); }}
                                    options={SORT_OPTIONS}
                                    className="min-w-[150px]"
                                />
                                <CustomSelect
                                    value={libraryId}
                                    onChange={(value) => { setLibraryId(value); setPage(1); }}
                                    options={[{ value: 'all', label: 'All libraries' }, ...libraries.map((lib) => ({ value: lib.id, label: `${lib.title} (${lib.count})` }))]}
                                    className="min-w-[180px]"
                                />
                                <CustomSelect
                                    value={mediaType}
                                    onChange={(value) => { setMediaType(value); setPage(1); }}
                                    options={[
                                        { value: 'all', label: 'Movies & shows' },
                                        { value: 'movie', label: 'Movies only' },
                                        { value: 'show', label: 'Shows only' },
                                    ]}
                                    className="min-w-[150px]"
                                />
                                <div className="relative min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                    <input
                                        type="search"
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        placeholder="Search titles…"
                                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-text text-sm outline-none focus:border-plex"
                                    />
                                </div>
                            </div>
                        </div>

                        {automationReady && selectedItems.length > 0 && (
                            <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-plex/30 bg-plex/10 px-4 py-3 backdrop-blur-md">
                                <span className="text-sm font-semibold text-text">{selectedItems.length} selected</span>
                                <div className="flex gap-2">
                                    <button type="button" className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold" onClick={() => setSelectedKeys(new Set())}>
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-plex text-background text-xs font-bold"
                                        onClick={() => openUpgradeModal(selectedItems)}
                                    >
                                        <ArrowUpFromLine className="w-3.5 h-3.5" />
                                        Upgrade selected
                                    </button>
                                </div>
                            </div>
                        )}

                        {loading ? (
                            <Loader isLoading />
                        ) : items.length === 0 ? (
                            <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-8 text-center">
                                <h3 className="text-xl font-bold text-green-200 mb-2">
                                    {summary?.nonHevcCount === 0 ? 'All HEVC — nice work!' : 'No matches for this filter'}
                                </h3>
                                <p className="text-sm text-muted">
                                    {summary?.nonHevcCount === 0
                                        ? 'Every indexed movie and show is already HEVC (or the index needs a rebuild).'
                                        : 'Try another preset, library, or search term.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <p className="text-xs text-muted">{total} title{total === 1 ? '' : 's'} · page {page} of {totalPages}</p>
                                <div className={upgraderPosterGridClass(gridSize)} style={upgraderPosterGridStyle(gridSize)}>
                                    {items.map((item) => {
                                        const canUpgrade = automationReady && item.arrMapped && isUpgradableItem(item);
                                        const isSelected = selectedKeys.has(item.ratingKey);
                                        const showEpisodeBadge = item.mediaType === 'show' && (item.nonHevcEpisodeCount ?? 0) > 0;
                                        const isShow = item.mediaType === 'show';
                                        const checkboxSize = gridSize === 'small' || gridSize === 'medium' ? 'sm' : 'md';
                                        return (
                                            <div key={item.ratingKey} className="relative min-w-0">
                                                {automationReady && (
                                                    <div className="absolute top-1.5 left-1.5 z-20 upgrader-card-select">
                                                        <OverlayCheckbox
                                                            checked={isSelected}
                                                            onChange={() => toggleSelected(item.ratingKey)}
                                                            size={checkboxSize}
                                                            title={isSelected ? 'Deselect' : 'Select for upgrade'}
                                                        />
                                                    </div>
                                                )}
                                                {showEpisodeBadge && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowDrawerItem(item)}
                                                        className="absolute top-2 right-2 z-20 upgrader-card-badge text-[10px] font-bold px-2 py-1 rounded-full bg-black/75 border border-white/20 text-amber-200 hover:border-plex/50"
                                                    >
                                                        {item.nonHevcEpisodeCount} non-HEVC ep{item.nonHevcEpisodeCount === 1 ? '' : 's'}
                                                    </button>
                                                )}
                                                <DiscoverPosterCard
                                                    variant="home"
                                                    posterOnlyLink
                                                    showQualityBadges={showQualityBadges}
                                                    posterWidth={600}
                                                    posterHeight={900}
                                                    item={{
                                                        title: item.title,
                                                        thumb: item.thumb,
                                                        thumbUrl: item.thumbUrl || undefined,
                                                        plexUrl: item.plexUrl || '#',
                                                        tags: item.displayTags,
                                                        year: item.year ?? undefined,
                                                    }}
                                                    footer={(
                                                        <div className="px-1 space-y-1">
                                                            <div className="upgrader-card-title text-xs font-medium text-text line-clamp-2 leading-tight">
                                                                {item.title}{item.year ? ` (${item.year})` : ''}
                                                            </div>
                                                            <div className="upgrader-card-meta text-[10px] text-muted line-clamp-2">
                                                                {item.libraryTitle}
                                                                {item.mediaType === 'show' && (item.nonHevcEpisodeSizeGB ?? 0) > 0
                                                                    ? ` · ${item.nonHevcEpisodeSizeGB} GB (non-HEVC eps)`
                                                                    : item.sizeGB > 0 ? ` · ${item.sizeGB} GB` : ''}
                                                                {item.arrMapped && item.arrInstanceName ? ` · ${item.arrInstanceName}` : ''}
                                                            </div>
                                                            <div className="upgrader-card-actions flex flex-wrap gap-x-2 gap-y-1">
                                                                {isShow && (
                                                                    <button
                                                                        type="button"
                                                                        className="text-[10px] font-bold text-amber-200 hover:underline"
                                                                        onClick={() => setShowDrawerItem(item)}
                                                                    >
                                                                        View show
                                                                    </button>
                                                                )}
                                                                {showEpisodeBadge && (
                                                                    <button
                                                                        type="button"
                                                                        className="text-[10px] font-bold text-muted hover:underline"
                                                                        onClick={() => setShowDrawerItem(item)}
                                                                    >
                                                                        {item.nonHevcEpisodeCount} non-HEVC ep{item.nonHevcEpisodeCount === 1 ? '' : 's'}
                                                                    </button>
                                                                )}
                                                                {item.arrDeepUrl && (
                                                                    <a
                                                                        href={item.arrDeepUrl}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="inline-block text-[10px] font-bold text-plex hover:underline"
                                                                    >
                                                                        Open in {item.arrType === 'radarr' ? 'Radarr' : 'Sonarr'}
                                                                    </a>
                                                                )}
                                                                {canUpgrade && (
                                                                    <button
                                                                        type="button"
                                                                        className="text-[10px] font-bold text-green-300 hover:underline"
                                                                        onClick={() => openUpgradeModal([item])}
                                                                    >
                                                                        Upgrade to HEVC
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-muted hover:text-text"
                                                                    onClick={() => handleSnooze(item)}
                                                                    title="Hide from Upgrader for 30 days"
                                                                >
                                                                    <Clock className="w-3 h-3" />
                                                                    Snooze
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-3">
                                        <button
                                            type="button"
                                            className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40"
                                            disabled={page <= 1}
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        >
                                            Previous
                                        </button>
                                        <span className="text-sm text-muted">{page} / {totalPages}</span>
                                        <button
                                            type="button"
                                            className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40"
                                            disabled={page >= totalPages}
                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
