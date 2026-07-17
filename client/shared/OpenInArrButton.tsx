import React, { useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { apiFetch } from './api';

export type ArrDeepLinkParams = {
    mediaType: 'movie' | 'tv';
    tmdbId?: number | null;
    title?: string | null;
    year?: string | number | null;
    is4k?: boolean;
};

export type ArrDeepLinkResult = {
    url: string;
    label: string;
    arrType: 'radarr' | 'sonarr';
    instanceName?: string;
};

export const fetchArrDeepLink = async (params: ArrDeepLinkParams): Promise<ArrDeepLinkResult | null> => {
    const qs = new URLSearchParams();
    qs.set('mediaType', params.mediaType);
    if (params.tmdbId != null && Number.isFinite(Number(params.tmdbId)) && Number(params.tmdbId) > 0) {
        qs.set('tmdbId', String(params.tmdbId));
    }
    if (params.title) qs.set('title', String(params.title));
    if (params.year != null && String(params.year).trim()) qs.set('year', String(params.year).trim().slice(0, 4));
    if (params.is4k) qs.set('is4k', '1');

    const res = await apiFetch(`/api/arr/deep-link?${qs.toString()}`);
    if (!res || res.error || !res.url) return null;
    return {
        url: String(res.url),
        label: String(res.label || (params.mediaType === 'movie' ? 'Open in Radarr' : 'Open in Sonarr')),
        arrType: res.arrType === 'sonarr' ? 'sonarr' : 'radarr',
        instanceName: res.instanceName ? String(res.instanceName) : undefined,
    };
};

export const OpenInArrButton: React.FC<{
    mediaType: 'movie' | 'tv';
    tmdbId?: number | null;
    title?: string | null;
    year?: string | number | null;
    is4k?: boolean;
    className?: string;
    onError?: (message: string) => void;
}> = ({ mediaType, tmdbId, title, year, is4k = false, className = '', onError }) => {
    const [busy, setBusy] = useState(false);
    const label = mediaType === 'movie' ? 'Open in Radarr' : 'Open in Sonarr';
    const canResolve = (tmdbId != null && Number(tmdbId) > 0) || !!String(title || '').trim();
    if (!canResolve) return null;

    const handleClick = async () => {
        if (busy) return;
        setBusy(true);
        try {
            const link = await fetchArrDeepLink({ mediaType, tmdbId, title, year, is4k });
            if (!link?.url) {
                onError?.(mediaType === 'movie' ? 'Could not open Radarr for this title.' : 'Could not open Sonarr for this title.');
                return;
            }
            window.open(link.url, '_blank', 'noopener,noreferrer');
        } catch {
            onError?.(mediaType === 'movie' ? 'Could not open Radarr for this title.' : 'Could not open Sonarr for this title.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <button
            type="button"
            disabled={busy}
            onClick={handleClick}
            className={className}
            title={label}
        >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
            {label}
        </button>
    );
};
