import React, { useEffect, useState } from 'react';
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

export const fetchArrDeepLink = async (params: ArrDeepLinkParams): Promise<ArrDeepLinkResult> => {
    const qs = new URLSearchParams();
    qs.set('mediaType', params.mediaType);
    if (params.tmdbId != null && Number.isFinite(Number(params.tmdbId)) && Number(params.tmdbId) > 0) {
        qs.set('tmdbId', String(params.tmdbId));
    }
    if (params.title) qs.set('title', String(params.title));
    if (params.year != null && String(params.year).trim()) qs.set('year', String(params.year).trim().slice(0, 4));
    if (params.is4k) qs.set('is4k', '1');

    const res = await apiFetch(`/api/arr/deep-link?${qs.toString()}`);
    if (!res?.url) {
        throw new Error(res?.error || (params.mediaType === 'movie' ? 'Could not open Radarr for this title.' : 'Could not open Sonarr for this title.'));
    }
    return {
        url: String(res.url),
        label: String(res.label || (params.mediaType === 'movie' ? 'Open in Radarr' : 'Open in Sonarr')),
        arrType: res.arrType === 'sonarr' ? 'sonarr' : 'radarr',
        instanceName: res.instanceName ? String(res.instanceName) : undefined,
    };
};

const openResolvedUrl = (url: string, preopened: Window | null) => {
    if (preopened && !preopened.closed) {
        try {
            preopened.opener = null;
        } catch {
            // ignore cross-window access restrictions
        }
        preopened.location.href = url;
        return;
    }
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
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
    const [href, setHref] = useState<string | null>(null);
    const [label, setLabel] = useState(mediaType === 'movie' ? 'Open in Radarr' : 'Open in Sonarr');
    const canResolve = (tmdbId != null && Number(tmdbId) > 0) || !!String(title || '').trim();

    useEffect(() => {
        if (!canResolve) {
            setHref(null);
            return;
        }
        let cancelled = false;
        setHref(null);
        setLabel(mediaType === 'movie' ? 'Open in Radarr' : 'Open in Sonarr');
        fetchArrDeepLink({ mediaType, tmdbId, title, year, is4k })
            .then((link) => {
                if (cancelled) return;
                setHref(link.url);
                setLabel(link.label);
            })
            .catch(() => {
                if (!cancelled) setHref(null);
            });
        return () => {
            cancelled = true;
        };
    }, [canResolve, mediaType, tmdbId, title, year, is4k]);

    if (!canResolve) return null;

    const reportError = (message: string) => {
        onError?.(message);
    };

    const handleClick = async () => {
        if (busy) return;
        setBusy(true);
        // Open synchronously so popup blockers don't kill the tab after the await.
        const popup = window.open('about:blank', '_blank');
        try {
            const link = await fetchArrDeepLink({ mediaType, tmdbId, title, year, is4k });
            setHref(link.url);
            setLabel(link.label);
            openResolvedUrl(link.url, popup);
        } catch (error) {
            try { popup?.close(); } catch { /* ignore */ }
            reportError(error instanceof Error ? error.message : (mediaType === 'movie' ? 'Could not open Radarr for this title.' : 'Could not open Sonarr for this title.'));
        } finally {
            setBusy(false);
        }
    };

    const content = (
        <>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
            {label}
        </>
    );

    if (href) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
                title={label}
            >
                {content}
            </a>
        );
    }

    return (
        <button
            type="button"
            disabled={busy}
            onClick={handleClick}
            className={className}
            title={label}
        >
            {content}
        </button>
    );
};
