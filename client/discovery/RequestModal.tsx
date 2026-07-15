import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, Film, Loader2, Tv, X } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { ModalPortal } from '../shared/ModalPortal';
import { NoPosterPlaceholder } from '../shared/NoPosterPlaceholder';
import { CustomSelect, StyledCheckbox } from '../shared/ui';
import type { PortalServiceOptions } from '../requests/types';
import type { RequestOptionsPayload } from './requestSeasonUtils';
import {
    formatQuotaHint,
    seasonStatusBadgeClass,
} from './requestSeasonUtils';

type Props = {
    open: boolean;
    mediaType: 'movie' | 'tv';
    mediaId: number;
    title?: string;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
};

const formatBytes = (bytes?: number | null) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]} free`;
};

export const RequestModal: React.FC<Props> = ({
    open,
    mediaType,
    mediaId,
    title: fallbackTitle,
    onClose,
    onSuccess,
    onError,
}) => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [options, setOptions] = useState<RequestOptionsPayload | null>(null);
    const [is4k, setIs4k] = useState(false);
    const [selectedSeasons, setSelectedSeasons] = useState<number[]>([]);
    const [showAdvanced, setShowAdvanced] = useState(true);
    const [serviceOptions, setServiceOptions] = useState<PortalServiceOptions | null>(null);
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [serverId, setServerId] = useState<number | null>(null);
    const [profileId, setProfileId] = useState<number | null>(null);
    const [rootFolder, setRootFolder] = useState('');
    const [languageProfileId, setLanguageProfileId] = useState<number | null>(null);
    const [selectedTags, setSelectedTags] = useState<number[]>([]);

    const filteredServers = useMemo(() => {
        const list = options?.servers || [];
        return list.filter((server) => server.is4k === is4k);
    }, [options?.servers, is4k]);

    const loadServiceOptions = useCallback(async (
        opts: RequestOptionsPayload,
        nextServerId: number,
        nextIs4k: boolean,
        defaults?: Record<string, unknown> | null,
    ) => {
        setOptionsLoading(true);
        try {
            const segment = opts.mediaType === 'tv' ? 'sonarr' : 'radarr';
            const data = await apiFetch(`/api/discovery/request-services/${segment}/${nextServerId}`);
            setServiceOptions(data as PortalServiceOptions);

            const server = data?.server || {};
            const profiles = Array.isArray(data?.profiles) ? data.profiles : [];
            const folders = Array.isArray(data?.rootFolders) ? data.rootFolders : [];
            const languageProfiles = Array.isArray(data?.languageProfiles) ? data.languageProfiles : [];
            const isAnime = !!opts.isAnime;

            let nextProfileId = defaults?.profileId != null ? Number(defaults.profileId) : null;
            if (!Number.isFinite(nextProfileId)) {
                const activeProfile = isAnime && server.activeAnimeProfileId
                    ? server.activeAnimeProfileId
                    : server.activeProfileId;
                nextProfileId = activeProfile ?? profiles[0]?.id ?? null;
            }

            let nextRootFolder = defaults?.rootFolder ? String(defaults.rootFolder) : '';
            if (!nextRootFolder) {
                const activeFolder = isAnime && server.activeAnimeDirectory
                    ? server.activeAnimeDirectory
                    : server.activeDirectory;
                nextRootFolder = activeFolder || folders[0]?.path || '';
            }

            let nextLanguageProfileId = defaults?.languageProfileId != null
                ? Number(defaults.languageProfileId)
                : null;
            if (opts.mediaType === 'tv' && !Number.isFinite(nextLanguageProfileId)) {
                const activeLang = isAnime && server.activeAnimeLanguageProfileId
                    ? server.activeAnimeLanguageProfileId
                    : server.activeLanguageProfileId;
                nextLanguageProfileId = activeLang ?? languageProfiles[0]?.id ?? null;
            }

            const nextTags = Array.isArray(defaults?.tags)
                ? defaults.tags.map((tag) => Number(tag)).filter((tag) => Number.isFinite(tag))
                : [];

            setServerId(nextServerId);
            setProfileId(Number.isFinite(nextProfileId) ? nextProfileId : null);
            setRootFolder(nextRootFolder);
            setLanguageProfileId(Number.isFinite(nextLanguageProfileId) ? nextLanguageProfileId : null);
            setSelectedTags(nextTags);
        } catch (e: any) {
            onError(e?.message || 'Failed to load request options');
            setServiceOptions(null);
        } finally {
            setOptionsLoading(false);
        }
    }, [onError]);

    const loadAdvancedOptions = useCallback(async (opts: RequestOptionsPayload, nextIs4k: boolean) => {
        if (!opts.canRequestAdvanced) {
            setServiceOptions(null);
            setServerId(null);
            setProfileId(null);
            setRootFolder('');
            setLanguageProfileId(null);
            setSelectedTags([]);
            return;
        }

        const servers = (opts.servers || []).filter((server) => server.is4k === nextIs4k);
        if (!servers.length) {
            setServiceOptions(null);
            return;
        }

        let nextServerId = servers.find((server) => server.isDefault)?.id ?? servers[0]?.id ?? null;
        let defaults: Record<string, unknown> | null = null;

        try {
            defaults = await apiFetch('/api/discovery/request-override-defaults', {
                method: 'POST',
                body: JSON.stringify({
                    mediaType: opts.mediaType,
                    tmdbId: opts.tmdbId,
                    userId: opts.seerrUserId,
                    is4k: nextIs4k,
                }),
            });
            if (defaults?.serverId != null) {
                nextServerId = Number(defaults.serverId);
            }
        } catch {
            defaults = null;
        }

        if (nextServerId != null) {
            await loadServiceOptions(opts, nextServerId, nextIs4k, defaults);
        }
    }, [loadServiceOptions]);

    const loadOptions = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiFetch(
                `/api/discovery/request-options?mediaType=${encodeURIComponent(mediaType)}&mediaId=${mediaId}`,
            );
            if (data?.error) throw new Error(data.error);
            const payload = data as RequestOptionsPayload;
            setOptions(payload);
            setIs4k(false);
            setShowAdvanced(!!payload.canRequestAdvanced);
            if (payload.mediaType === 'tv' && Array.isArray(payload.seasons)) {
                setSelectedSeasons(
                    payload.seasons.filter((s) => s.requestable).map((s) => s.seasonNumber),
                );
            } else {
                setSelectedSeasons([]);
            }
        } catch (e: any) {
            onError(e?.message || 'Failed to load request options');
            setOptions(null);
        } finally {
            setLoading(false);
        }
    }, [mediaId, mediaType, onError, loadAdvancedOptions]);

    useEffect(() => {
        if (!open) return undefined;
        loadOptions();
        return undefined;
    }, [open, loadOptions]);

    useEffect(() => {
        if (!open || !options?.canRequestAdvanced) return undefined;
        loadAdvancedOptions(options, is4k);
        return undefined;
    }, [open, options, is4k, loadAdvancedOptions]);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !submitting) onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose, submitting]);

    const requestableSeasons = useMemo(
        () => (options?.seasons || []).filter((s) => s.requestable),
        [options?.seasons],
    );

    const activeQuota = useMemo(() => {
        if (!options) return null;
        return is4k ? options.quota?.fourK : options.quota?.standard;
    }, [options, is4k]);

    const quotaHint = useMemo(() => {
        const label = mediaType === 'tv' ? 'TV' : 'movie';
        return formatQuotaHint(activeQuota, is4k ? `4K ${label}` : label);
    }, [activeQuota, is4k, mediaType]);

    const toggleSeason = (seasonNumber: number) => {
        setSelectedSeasons((prev) => (
            prev.includes(seasonNumber)
                ? prev.filter((n) => n !== seasonNumber)
                : [...prev, seasonNumber]
        ));
    };

    const selectAllRequestable = () => {
        setSelectedSeasons(requestableSeasons.map((s) => s.seasonNumber));
    };

    const selectMissingOnly = () => {
        setSelectedSeasons(requestableSeasons.map((s) => s.seasonNumber));
    };

    const toggleTag = (tagId: number) => {
        setSelectedTags((prev) => (
            prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
        ));
    };

    const handleSubmit = async () => {
        if (!options?.canRequest) return;
        if (mediaType === 'tv' && selectedSeasons.length === 0) {
            onError('Select at least one season to request.');
            return;
        }
        if (options.canRequestAdvanced && !rootFolder) {
            onError('Select a root folder for this request.');
            return;
        }

        setSubmitting(true);
        try {
            const allRequestableSelected = mediaType === 'tv'
                && requestableSeasons.length > 0
                && selectedSeasons.length === requestableSeasons.length
                && requestableSeasons.every((s) => selectedSeasons.includes(s.seasonNumber));

            const body: Record<string, unknown> = {
                mediaType,
                mediaId,
                is4k: is4k || undefined,
            };
            if (mediaType === 'tv') {
                body.seasons = allRequestableSelected && requestableSeasons.length === (options.seasons?.length || 0)
                    ? 'all'
                    : [...selectedSeasons].sort((a, b) => a - b);
            }
            if (options.canRequestAdvanced) {
                if (serverId != null) body.serverId = serverId;
                if (profileId != null) body.profileId = profileId;
                if (rootFolder) body.rootFolder = rootFolder;
                if (mediaType === 'tv' && languageProfileId != null) body.languageProfileId = languageProfileId;
                if (selectedTags.length) body.tags = selectedTags;
            }

            const res = await apiFetch('/api/discovery/request', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            if (res?.error) throw new Error(res.error);
            onSuccess(mediaType === 'tv' ? 'Series request submitted!' : 'Movie request submitted!');
            onClose();
        } catch (e: any) {
            onError(e?.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    const displayTitle = options?.title || fallbackTitle || 'Request media';
    const posterUrl = options?.posterPath ? `https://image.tmdb.org/t/p/w342${options.posterPath}` : '';
    const showAdvancedSection = !!options?.canRequestAdvanced;

    return (
        <ModalPortal open={open}>
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <button
                type="button"
                aria-label="Close request modal"
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => { if (!submitting) onClose(); }}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="request-modal-title"
                className="relative w-full sm:max-w-lg max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)-0.5rem))] sm:max-h-[85vh] bg-card border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in"
            >
                <div className="flex items-start justify-between gap-4 p-5 border-b border-white/10 bg-black/20 shrink-0">
                    <div className="flex items-start gap-4 min-w-0">
                        <div className="w-14 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-black/40 border border-white/10">
                            {posterUrl ? (
                                <img src={posterUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <NoPosterPlaceholder compact />
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                {mediaType === 'movie' ? (
                                    <Film className="w-4 h-4 text-plex" />
                                ) : (
                                    <Tv className="w-4 h-4 text-plex" />
                                )}
                                <span className="text-[10px] font-bold uppercase tracking-widest text-plex">
                                    Request {mediaType === 'movie' ? 'Movie' : 'Series'}
                                </span>
                            </div>
                            <h2 id="request-modal-title" className="text-lg font-black text-white leading-tight truncate">
                                {displayTitle}
                            </h2>
                            {quotaHint && (
                                <p className="text-xs text-white/50 mt-1">{quotaHint}</p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-5">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-plex animate-spin" />
                        </div>
                    ) : !options ? (
                        <p className="text-sm text-muted text-center py-8">Unable to load request options.</p>
                    ) : (
                        <>
                            {options.blockReason && !options.canRequest && (
                                <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                                    {options.blockReason}
                                </div>
                            )}

                            {options.canRequest4k && (
                                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                    <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Quality</p>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIs4k(false)}
                                            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-bold transition-colors border ${
                                                !is4k
                                                    ? 'bg-plex/15 border-plex/40 text-white'
                                                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                                            }`}
                                        >
                                            HD
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIs4k(true)}
                                            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-bold transition-colors border ${
                                                is4k
                                                    ? 'bg-plex/15 border-plex/40 text-white'
                                                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                                            }`}
                                        >
                                            4K
                                        </button>
                                    </div>
                                </div>
                            )}

                            {mediaType === 'movie' && options.canRequest && !showAdvancedSection && (
                                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
                                    Submit a request for this movie. An admin will review it unless auto-approval is enabled in Seerr.
                                </div>
                            )}

                            {mediaType === 'tv' && options.seasons.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <p className="text-xs font-bold uppercase tracking-wider text-white/40">Seasons</p>
                                        {requestableSeasons.length > 0 && (
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={selectAllRequestable}
                                                    className="text-[11px] font-bold text-plex hover:text-plex-hover transition-colors"
                                                >
                                                    Select all
                                                </button>
                                                <span className="text-white/20">·</span>
                                                <button
                                                    type="button"
                                                    onClick={selectMissingOnly}
                                                    className="text-[11px] font-bold text-plex hover:text-plex-hover transition-colors"
                                                >
                                                    Missing only
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                                        {options.seasons.map((season) => {
                                            const selected = selectedSeasons.includes(season.seasonNumber);
                                            const disabled = !season.requestable;
                                            return (
                                                <label
                                                    key={season.seasonNumber}
                                                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                                                        disabled
                                                            ? 'border-white/5 bg-white/[0.02] opacity-70 cursor-not-allowed'
                                                            : selected
                                                                ? 'border-plex/35 bg-plex/10 cursor-pointer'
                                                                : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        checked={selected}
                                                        disabled={disabled || submitting}
                                                        onChange={() => {
                                                            if (!disabled) toggleSeason(season.seasonNumber);
                                                        }}
                                                    />
                                                    <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${
                                                        selected ? 'border-plex bg-plex/20' : 'border-white/20 bg-black/20'
                                                    }`}>
                                                        {selected && <CheckCircle className="w-3.5 h-3.5 text-plex" />}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-white truncate">
                                                                {season.name}
                                                            </span>
                                                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${seasonStatusBadgeClass(season.statusLabel, season.requestable)}`}>
                                                                {season.statusLabel}
                                                            </span>
                                                        </div>
                                                        {season.episodeCount > 0 && (
                                                            <p className="text-xs text-white/45 mt-0.5">
                                                                {season.episodeCount} episode{season.episodeCount === 1 ? '' : 's'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {showAdvancedSection && (
                                <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setShowAdvanced((prev) => !prev)}
                                        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
                                    >
                                        <span className="text-xs font-bold uppercase tracking-wider text-white/50">Advanced</span>
                                        {showAdvanced
                                            ? <ChevronUp className="w-4 h-4 text-white/40" />
                                            : <ChevronDown className="w-4 h-4 text-white/40" />}
                                    </button>

                                    {showAdvanced && (
                                        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-white/10">
                                            {optionsLoading ? (
                                                <div className="flex items-center gap-2 py-6 justify-center text-white/50 text-sm">
                                                    <Loader2 className="w-4 h-4 animate-spin text-plex" />
                                                    Loading server options…
                                                </div>
                                            ) : (
                                                <>
                                                    {filteredServers.length > 1 && (
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
                                                                Destination Server
                                                            </label>
                                                            <CustomSelect
                                                                value={String(serverId ?? '')}
                                                                onChange={(val) => {
                                                                    const nextId = Number(val);
                                                                    setServerId(nextId);
                                                                    if (options) loadServiceOptions(options, nextId, is4k);
                                                                }}
                                                                options={filteredServers.map((server) => ({
                                                                    value: String(server.id),
                                                                    label: server.isDefault ? `${server.name} (Default)` : server.name,
                                                                }))}
                                                            />
                                                        </div>
                                                    )}

                                                    <div>
                                                        <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
                                                            Quality Profile
                                                        </label>
                                                        <CustomSelect
                                                            value={String(profileId ?? '')}
                                                            onChange={(val) => setProfileId(Number(val))}
                                                            options={(serviceOptions?.profiles || []).map((profile) => ({
                                                                value: String(profile.id),
                                                                label: profile.name,
                                                            }))}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
                                                            Root Folder
                                                        </label>
                                                        <CustomSelect
                                                            value={rootFolder}
                                                            onChange={setRootFolder}
                                                            options={(serviceOptions?.rootFolders || []).map((folder) => ({
                                                                value: folder.path,
                                                                label: folder.freeSpace
                                                                    ? `${folder.path} (${formatBytes(folder.freeSpace)})`
                                                                    : folder.path,
                                                            }))}
                                                        />
                                                    </div>

                                                    {mediaType === 'tv' && (serviceOptions?.languageProfiles?.length ?? 0) > 0 && (
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
                                                                Language Profile
                                                            </label>
                                                            <CustomSelect
                                                                value={String(languageProfileId ?? '')}
                                                                onChange={(val) => setLanguageProfileId(Number(val))}
                                                                options={(serviceOptions?.languageProfiles || []).map((profile) => ({
                                                                    value: String(profile.id),
                                                                    label: profile.name,
                                                                }))}
                                                            />
                                                        </div>
                                                    )}

                                                    {(serviceOptions?.tags?.length ?? 0) > 0 && (
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
                                                                Tags
                                                            </label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {(serviceOptions?.tags || []).map((tag) => (
                                                                    <label
                                                                        key={tag.id}
                                                                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-white/80 cursor-pointer"
                                                                    >
                                                                        <StyledCheckbox
                                                                            checked={selectedTags.includes(tag.id)}
                                                                            onChange={() => toggleTag(tag.id)}
                                                                            label=""
                                                                        />
                                                                        {tag.label}
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="p-4 sm:p-5 pt-4 border-t border-white/10 bg-black/20 flex gap-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-5 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="flex-1 py-3 rounded-xl border border-white/10 text-white/70 font-bold hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || loading || optionsLoading || !options?.canRequest}
                        className="flex-1 py-3 rounded-xl bg-plex text-black font-black hover:bg-plex-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {submitting ? 'Submitting…' : 'Submit Request'}
                    </button>
                </div>
            </div>
        </div>
        </ModalPortal>
    );
};
