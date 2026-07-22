import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Film, Loader2, Tv, X } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { formatDateTime } from '../shared/format';
import { CustomSelect, StyledCheckbox } from '../shared/ui';
import type {
    PortalRequestDetail,
    PortalRequestOverrides,
    PortalRequestUser,
    PortalServiceOptions,
    PortalServiceServer,
} from './types';

type Props = {
    requestId: number;
    initialTitle?: string;
    mode?: 'approve' | 'edit';
    onClose: () => void;
    onComplete: (message: string) => void;
    onError: (message: string) => void;
};

const formatBytes = (bytes?: number | null) => {
    const n = Number(bytes);
    if (!Number.isFinite(n) || n <= 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.min(sizes.length - 1, Math.max(0, Math.floor(Math.log(n) / Math.log(k))));
    return `${parseFloat((n / Math.pow(k, i)).toFixed(1))} ${sizes[i]} free`;
};

const seasonStatusLabel = (status: number | null | undefined, selected: boolean) => {
    if (!selected) return 'Not selected';
    if (status === 1) return 'Pending';
    if (status === 2) return 'Approved';
    if (status === 3) return 'Declined';
    return 'Not requested';
};

/** Match Request As dropdown value to the real requester (id / plexId / email / name). */
const resolveRequestAsUserId = (
    users: PortalRequestUser[],
    requestedBy?: PortalRequestDetail['requestedBy'] | null,
): string | null => {
    if (!requestedBy) return null;
    const id = requestedBy.id != null ? String(requestedBy.id) : '';
    const email = String(requestedBy.email || '').trim().toLowerCase();
    const name = String(requestedBy.displayName || '').trim().toLowerCase();
    const plexId = String((requestedBy as any)?.plexId || '').trim();
    const username = String((requestedBy as any)?.username || '').trim().toLowerCase();

    const hit = users.find((user) => {
        const uid = String(user.id);
        const uPlex = String((user as any).plexId || '');
        const uEmail = String(user.email || '').trim().toLowerCase();
        const uName = String(user.displayName || '').trim().toLowerCase();
        const uUser = String((user as any).username || '').trim().toLowerCase();
        if (id && (uid === id || uPlex === id)) return true;
        if (plexId && (uid === plexId || uPlex === plexId)) return true;
        if (email && uEmail && uEmail === email) return true;
        if (username && (uUser === username || uName === username)) return true;
        if (name && (uName === name || uUser === name)) return true;
        return false;
    });
    return hit ? String(hit.id) : (id || null);
};

export const RequestApprovalModal: React.FC<Props> = ({
    requestId,
    initialTitle,
    mode = 'approve',
    onClose,
    onComplete,
    onError,
}) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [detail, setDetail] = useState<PortalRequestDetail | null>(null);
    const [servers, setServers] = useState<PortalServiceServer[]>([]);
    const [serviceOptions, setServiceOptions] = useState<PortalServiceOptions | null>(null);
    const [users, setUsers] = useState<PortalRequestUser[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(false);

    const [serverId, setServerId] = useState<number | null>(null);
    const [profileId, setProfileId] = useState<number | null>(null);
    const [rootFolder, setRootFolder] = useState('');
    const [languageProfileId, setLanguageProfileId] = useState<number | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [selectedSeasons, setSelectedSeasons] = useState<number[]>([]);

    const serviceType = detail?.type === 'tv' ? 'sonarr' : 'radarr';

    const loadServiceOptions = useCallback(async (type: 'movie' | 'tv', nextServerId: number) => {
        setOptionsLoading(true);
        try {
            const segment = type === 'tv' ? 'sonarr' : 'radarr';
            const data = await apiFetch(`/api/requests/services/${segment}/${nextServerId}`);
            setServiceOptions(data);
        } catch (e: any) {
            onError(e?.message || 'Failed to load service options');
            setServiceOptions(null);
        } finally {
            setOptionsLoading(false);
        }
    }, [onError]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const [requestData, usersData] = await Promise.all([
                    apiFetch(`/api/requests/${requestId}`),
                    apiFetch('/api/requests/users').catch(() => ({ users: [] })),
                ]);
                if (cancelled) return;

                const nextDetail = requestData as PortalRequestDetail;
                setDetail(nextDetail);
                const usersList: PortalRequestUser[] = Array.isArray(usersData?.users) ? usersData.users : [];
                setUsers(usersList);

                const segment = nextDetail.type === 'tv' ? 'sonarr' : 'radarr';
                const serversData = await apiFetch(`/api/requests/services/${segment}`);
                if (cancelled) return;

                const allServers: PortalServiceServer[] = Array.isArray(serversData?.servers) ? serversData.servers : [];
                const filtered = allServers.filter((s) => s.is4k === nextDetail.is4k);
                // Portal *arr instances are not HD/4K-split; fall back so approve still works.
                const serversForRequest = filtered.length ? filtered : allServers;
                setServers(serversForRequest);

                const initialServerId = nextDetail.serverId
                    ?? serversForRequest.find((s) => s.isDefault)?.id
                    ?? serversForRequest[0]?.id
                    ?? null;
                let nextServerId = initialServerId;
                let nextProfileId = nextDetail.profileId ?? null;
                let nextRootFolder = nextDetail.rootFolder || '';
                let nextLanguageProfileId = nextDetail.languageProfileId ?? null;
                let nextTags = Array.isArray(nextDetail.tags) ? nextDetail.tags : [];
                const resolvedUserId = resolveRequestAsUserId(usersList, nextDetail.requestedBy);

                if (nextDetail.tmdbId) {
                    try {
                        const defaults = await apiFetch('/api/requests/override-defaults', {
                            method: 'POST',
                            body: JSON.stringify({
                                mediaType: nextDetail.type,
                                tmdbId: nextDetail.tmdbId,
                                userId: resolvedUserId ?? nextDetail.requestedBy?.id,
                                is4k: nextDetail.is4k,
                            }),
                        });
                        if (defaults?.serverId != null && nextDetail.serverId == null) nextServerId = defaults.serverId;
                        if (defaults?.profileId != null && nextDetail.profileId == null) nextProfileId = defaults.profileId;
                        if (defaults?.rootFolder && !nextDetail.rootFolder) nextRootFolder = defaults.rootFolder;
                        if (defaults?.languageProfileId != null && nextDetail.languageProfileId == null) {
                            nextLanguageProfileId = defaults.languageProfileId;
                        }
                        if (Array.isArray(defaults?.tags) && (!nextDetail.tags || nextDetail.tags.length === 0)) {
                            nextTags = defaults.tags;
                        }
                    } catch {
                        // Override rules unavailable on older Seerr builds
                    }
                }

                setServerId(nextServerId);
                setProfileId(nextProfileId);
                setRootFolder(nextRootFolder);
                setLanguageProfileId(nextLanguageProfileId);
                setSelectedTags(nextTags);
                setUserId(resolvedUserId);
                setSelectedSeasons(
                    nextDetail.type === 'tv'
                        ? (nextDetail.seasons || []).map((s) => s.seasonNumber)
                        : []
                );
            } catch (e: any) {
                if (!cancelled) onError(e?.message || 'Failed to load request');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [requestId, loadServiceOptions, onError]);

    useEffect(() => {
        if (!detail || serverId == null) return;
        loadServiceOptions(detail.type, serverId);
    }, [serverId, detail?.id, detail?.type, loadServiceOptions]);

    useEffect(() => {
        if (!serviceOptions || !detail) return;
        if (profileId == null && serviceOptions.profiles.length) {
            const defaultProfile = detail.isAnime && serviceOptions.server.activeAnimeProfileId
                ? serviceOptions.server.activeAnimeProfileId
                : serviceOptions.server.activeProfileId;
            setProfileId(defaultProfile ?? serviceOptions.profiles[0]?.id ?? null);
        }
        if (!rootFolder && serviceOptions.rootFolders.length) {
            const defaultFolder = detail.isAnime && serviceOptions.server.activeAnimeDirectory
                ? serviceOptions.server.activeAnimeDirectory
                : serviceOptions.server.activeDirectory;
            setRootFolder(defaultFolder || serviceOptions.rootFolders[0]?.path || '');
        }
        if (detail.type === 'tv' && languageProfileId == null && serviceOptions.languageProfiles?.length) {
            const defaultLang = detail.isAnime && serviceOptions.server.activeAnimeLanguageProfileId
                ? serviceOptions.server.activeAnimeLanguageProfileId
                : serviceOptions.server.activeLanguageProfileId;
            setLanguageProfileId(defaultLang ?? serviceOptions.languageProfiles[0]?.id ?? null);
        }
    }, [serviceOptions, detail, profileId, rootFolder, languageProfileId]);

    const tvSeasonRows = useMemo(() => {
        if (!detail || detail.type !== 'tv') return [];
        const catalog = detail.tvSeasons?.length
            ? detail.tvSeasons
            : (detail.seasons || []).map((s) => ({
                seasonNumber: s.seasonNumber,
                name: s.seasonNumber === 0 ? 'Specials' : `Season ${s.seasonNumber}`,
                episodeCount: 0,
            }));
        return catalog.map((season) => {
            const requestSeason = detail.seasons?.find((s) => s.seasonNumber === season.seasonNumber);
            return {
                ...season,
                requestStatus: requestSeason?.status ?? null,
                selected: selectedSeasons.includes(season.seasonNumber),
            };
        });
    }, [detail, selectedSeasons]);

    const overrides = useMemo((): PortalRequestOverrides => ({
        serverId: serverId ?? undefined,
        profileId: profileId ?? undefined,
        rootFolder: rootFolder || undefined,
        languageProfileId: detail?.type === 'tv' ? (languageProfileId ?? undefined) : undefined,
        userId: userId ?? undefined,
        tags: selectedTags,
        seasons: detail?.type === 'tv' ? selectedSeasons : undefined,
    }), [serverId, profileId, rootFolder, languageProfileId, userId, selectedTags, selectedSeasons, detail?.type]);

    const requestAsOptions = useMemo(() => {
        const opts = users.map((u) => ({
            value: String(u.id),
            label: u.email ? `${u.displayName} (${u.email})` : u.displayName,
        }));
        if (userId && !opts.some((o) => o.value === String(userId))) {
            const name = detail?.requestedBy?.displayName || `User ${userId}`;
            const email = detail?.requestedBy?.email;
            opts.unshift({
                value: String(userId),
                label: email ? `${name} (${email})` : name,
            });
        }
        return opts;
    }, [users, userId, detail?.requestedBy?.displayName, detail?.requestedBy?.email]);

    const toggleSeason = (seasonNumber: number) => {
        setSelectedSeasons((prev) => (
            prev.includes(seasonNumber)
                ? prev.filter((n) => n !== seasonNumber)
                : [...prev, seasonNumber].sort((a, b) => a - b)
        ));
    };

    const toggleTag = (tagId: number) => {
        setSelectedTags((prev) => (
            prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
        ));
    };

    const handleSave = async (andApprove: boolean) => {
        if (!detail) return;
        if (detail.type === 'tv' && selectedSeasons.length === 0) {
            onError('Select at least one season to approve');
            return;
        }
        setSaving(true);
        try {
            if (andApprove) {
                await apiFetch(`/api/requests/${requestId}/approve`, {
                    method: 'POST',
                    body: JSON.stringify({ title: detail.title, overrides }),
                });
                onComplete(`Approved "${detail.title}"`);
            } else {
                await apiFetch(`/api/requests/${requestId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ title: detail.title, overrides }),
                });
                onComplete(`Updated "${detail.title}"`);
            }
            onClose();
        } catch (e: any) {
            onError(e?.message || (andApprove ? 'Failed to approve request' : 'Failed to update request'));
        } finally {
            setSaving(false);
        }
    };

    const title = detail?.title || initialTitle || 'Request';
    const TypeIcon = detail?.type === 'tv' ? Tv : Film;

    return (
        <div
            className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-6xl max-h-[90vh] overflow-y-auto glass-card p-5 md:p-6 shadow-2xl border border-border custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="min-w-0">
                        <p className="text-muted text-xs uppercase tracking-widest font-semibold">
                            {mode === 'approve' ? 'Review & Approve' : 'Edit Request'}
                        </p>
                        <h3 className="text-xl font-bold text-text truncate">{title}</h3>
                        {detail && (
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                                <span>Status: <span className="text-text font-medium capitalize">{detail.statusLabel}</span></span>
                                <span>Requested by <span className="text-text font-medium">{detail.requestedBy.displayName}</span></span>
                                {detail.createdAt && (
                                    <span>Created {formatDateTime(detail.createdAt)}</span>
                                )}
                                {detail.updatedAt && detail.updatedAt !== detail.createdAt && (
                                    <span>Updated {formatDateTime(detail.updatedAt)}</span>
                                )}
                                {detail.modifiedBy && (
                                    <span>Last action by {detail.modifiedBy.displayName}</span>
                                )}
                                {detail.declineReason && (
                                    <span className="text-red-200">Reason: {detail.declineReason}</span>
                                )}
                            </div>
                        )}
                        {detail?.requestedBy?.displayName && (
                            <p className="text-sm text-muted mt-1">
                                Requested by <span className="text-text font-medium">{detail.requestedBy.displayName}</span>
                                {detail.is4k ? ' · 4K' : ''}
                                {detail.isAnime ? ' · Anime' : ''}
                            </p>
                        )}
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-lg text-muted hover:text-text hover:bg-white/5">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center gap-3 py-16 justify-center text-muted">
                        <Loader2 className="w-5 h-5 animate-spin text-plex" />
                        Loading request details...
                    </div>
                ) : !detail ? (
                    <p className="text-sm text-red-200 py-8 text-center">Could not load this request.</p>
                ) : (
                    <>
                        <div className="flex gap-4 mb-5">
                            <div className="w-24 aspect-[2/3] rounded-lg overflow-hidden bg-card border border-border/50 shrink-0">
                                {detail.posterUrl ? (
                                    <img src={detail.posterUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted">
                                        <TypeIcon className="w-8 h-8 opacity-40" />
                                    </div>
                                )}
                            </div>
                            {detail.overview && (
                                <p className="text-sm text-muted line-clamp-5 leading-relaxed">{detail.overview}</p>
                            )}
                        </div>

                        {detail.type === 'tv' && tvSeasonRows.length > 0 && (
                            <div className="mb-5">
                                <p className="text-sm font-semibold text-text mb-2">Seasons</p>
                                <div className="rounded-xl border border-border/60 overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-background/60 text-muted text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="px-3 py-2 text-left w-12">On</th>
                                                <th className="px-3 py-2 text-left">Season</th>
                                                <th className="px-3 py-2 text-right">Episodes</th>
                                                <th className="px-3 py-2 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tvSeasonRows.map((row) => (
                                                <tr key={row.seasonNumber} className="border-t border-border/40">
                                                    <td className="px-3 py-2">
                                                        <StyledCheckbox
                                                            checked={row.selected}
                                                            onChange={() => toggleSeason(row.seasonNumber)}
                                                            label=""
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-text font-medium">{row.name}</td>
                                                    <td className="px-3 py-2 text-right text-muted">{row.episodeCount || '—'}</td>
                                                    <td className="px-3 py-2 text-right">
                                                        <span className="text-xs font-semibold text-muted">
                                                            {seasonStatusLabel(row.requestStatus, row.selected)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="mb-4">
                            <p className="text-sm font-semibold text-text mb-3">Advanced</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {servers.length > 1 && (
                                    <div>
                                        <label className="block text-xs font-semibold text-muted mb-1.5">Destination Server</label>
                                        <CustomSelect
                                            value={String(serverId ?? '')}
                                            onChange={(val) => {
                                                setServerId(Number(val));
                                                setProfileId(null);
                                                setRootFolder('');
                                                setLanguageProfileId(null);
                                                setSelectedTags([]);
                                            }}
                                            options={servers.map((s) => ({
                                                value: String(s.id),
                                                label: s.isDefault ? `${s.name} (Default)` : s.name,
                                            }))}
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-semibold text-muted mb-1.5">Quality Profile</label>
                                    <CustomSelect
                                        value={String(profileId ?? '')}
                                        onChange={(val) => setProfileId(Number(val))}
                                        options={(serviceOptions?.profiles || []).map((p) => ({
                                            value: String(p.id),
                                            label: p.name,
                                        }))}
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-muted mb-1.5">Root Folder</label>
                                    <CustomSelect
                                        value={rootFolder}
                                        onChange={setRootFolder}
                                        options={(serviceOptions?.rootFolders || []).map((f) => ({
                                            value: f.path,
                                            label: (() => {
                                                const free = formatBytes(f.freeSpace);
                                                return free ? `${f.path} (${free})` : f.path;
                                            })(),
                                        }))}
                                    />
                                </div>
                                {detail.type === 'tv' && (serviceOptions?.languageProfiles?.length ?? 0) > 0 && (
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-semibold text-muted mb-1.5">Language Profile</label>
                                        <CustomSelect
                                            value={String(languageProfileId ?? '')}
                                            onChange={(val) => setLanguageProfileId(Number(val))}
                                            options={(serviceOptions?.languageProfiles || []).map((lp) => ({
                                                value: String(lp.id),
                                                label: lp.name,
                                            }))}
                                        />
                                    </div>
                                )}
                                {requestAsOptions.length > 1 && (
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-semibold text-muted mb-1.5">Request As</label>
                                        <CustomSelect
                                            value={String(userId ?? '')}
                                            onChange={(val) => setUserId(String(val))}
                                            options={requestAsOptions}
                                        />
                                    </div>
                                )}
                            </div>

                            {(serviceOptions?.tags?.length ?? 0) > 0 && (
                                <div className="mt-3">
                                    <label className="block text-xs font-semibold text-muted mb-2">Tags</label>
                                    <div className="flex flex-wrap gap-2">
                                        {serviceOptions!.tags.map((tag) => {
                                            const active = selectedTags.includes(tag.id);
                                            return (
                                                <button
                                                    key={tag.id}
                                                    type="button"
                                                    onClick={() => toggleTag(tag.id)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                                        active
                                                            ? 'bg-plex/15 border-plex/40 text-plex'
                                                            : 'bg-background/50 border-border text-muted hover:text-text'
                                                    }`}
                                                >
                                                    {tag.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {optionsLoading && (
                                <p className="text-xs text-muted mt-2 flex items-center gap-2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading service options...
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border/40">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="px-4 py-2.5 rounded-lg border border-border text-muted hover:text-text transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSave(false)}
                                disabled={saving}
                                className="px-4 py-2.5 rounded-lg border border-white/10 text-text font-semibold hover:bg-white/5 transition-colors disabled:opacity-50"
                            >
                                Save changes
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSave(true)}
                                disabled={saving}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-plex text-background font-bold hover:bg-plex-hover transition-colors disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                {mode === 'approve' ? 'Save & Approve' : 'Save & Approve'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
