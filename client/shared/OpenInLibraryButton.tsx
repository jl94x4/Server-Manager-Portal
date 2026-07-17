import React, { useEffect, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { apiFetch } from './api';

export type LibraryDeepLinkParams = {
    mediaType: 'movie' | 'tv';
    tmdbId?: number | null;
    ratingKey?: string | null;
    preferredUrl?: string | null;
    mediaServerType?: string;
};

const providerLabelFor = (mediaServerType?: string) => {
    const type = String(mediaServerType || 'plex').toLowerCase();
    if (type === 'jellyfin') return 'Jellyfin';
    if (type === 'emby') return 'Emby';
    return 'Plex';
};

export const resolveLibraryLinkFromMediaInfo = (mediaInfo: any, mediaServerType?: string): string | null => {
    if (!mediaInfo || typeof mediaInfo !== 'object') return null;
    const type = String(mediaServerType || 'plex').toLowerCase();
    const candidates = type === 'jellyfin' || type === 'emby'
        ? [mediaInfo.mediaUrl, mediaInfo.jellyfinUrl, mediaInfo.plexUrl, mediaInfo.plexUrl4k]
        : [mediaInfo.plexUrl, mediaInfo.plexUrl4k, mediaInfo.mediaUrl];
    for (const candidate of candidates) {
        const href = String(candidate || '').trim();
        if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('plex://')) return href;
    }
    return null;
};

export const resolveLibraryRatingKey = (mediaInfo: any): string | null => {
    if (!mediaInfo || typeof mediaInfo !== 'object') return null;
    const key = mediaInfo.ratingKey || mediaInfo.ratingKey4k || mediaInfo.jellyfinMediaId || mediaInfo.jellyfinMediaId4k;
    const normalized = String(key || '').trim();
    return normalized || null;
};

export const fetchLibraryDeepLink = async (params: LibraryDeepLinkParams): Promise<{ url: string; label: string }> => {
    if (params.preferredUrl) {
        return {
            url: params.preferredUrl,
            label: `Open in ${providerLabelFor(params.mediaServerType)}`,
        };
    }

    const qs = new URLSearchParams();
    qs.set('mediaType', params.mediaType);
    if (params.tmdbId != null && Number(params.tmdbId) > 0) qs.set('tmdbId', String(params.tmdbId));
    if (params.ratingKey) qs.set('ratingKey', String(params.ratingKey));

    const res = await apiFetch(`/api/discovery/library-link?${qs.toString()}`);
    if (!res?.url) {
        throw new Error(res?.error || `Could not open in ${providerLabelFor(params.mediaServerType)}.`);
    }
    return {
        url: String(res.url),
        label: String(res.label || `Open in ${providerLabelFor(params.mediaServerType)}`),
    };
};

export const OpenInLibraryButton: React.FC<{
    mediaType: 'movie' | 'tv';
    tmdbId?: number | null;
    mediaInfo?: any;
    mediaServerType?: string;
    className?: string;
    onError?: (message: string) => void;
}> = ({ mediaType, tmdbId, mediaInfo, mediaServerType = 'plex', className = '', onError }) => {
    const preferredUrl = resolveLibraryLinkFromMediaInfo(mediaInfo, mediaServerType);
    const ratingKey = resolveLibraryRatingKey(mediaInfo);
    const defaultLabel = `Open in ${providerLabelFor(mediaServerType)}`;
    const [busy, setBusy] = useState(false);
    const [href, setHref] = useState<string | null>(preferredUrl);
    const [label, setLabel] = useState(defaultLabel);
    const canResolve = !!preferredUrl || !!ratingKey || (tmdbId != null && Number(tmdbId) > 0);

    useEffect(() => {
        setLabel(defaultLabel);
        if (preferredUrl) {
            setHref(preferredUrl);
            return;
        }
        if (!canResolve) {
            setHref(null);
            return;
        }
        let cancelled = false;
        setHref(null);
        fetchLibraryDeepLink({ mediaType, tmdbId, ratingKey, mediaServerType })
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
    }, [canResolve, defaultLabel, mediaServerType, mediaType, preferredUrl, ratingKey, tmdbId]);

    if (!canResolve) return null;

    const handleClick = async () => {
        if (busy) return;
        setBusy(true);
        const popup = window.open('about:blank', '_blank');
        try {
            const link = await fetchLibraryDeepLink({
                mediaType,
                tmdbId,
                ratingKey,
                preferredUrl: href || preferredUrl,
                mediaServerType,
            });
            setHref(link.url);
            setLabel(link.label);
            if (popup && !popup.closed) {
                try { popup.opener = null; } catch { /* ignore */ }
                popup.location.href = link.url;
            } else {
                const anchor = document.createElement('a');
                anchor.href = link.url;
                anchor.target = '_blank';
                anchor.rel = 'noopener noreferrer';
                document.body.appendChild(anchor);
                anchor.click();
                anchor.remove();
            }
        } catch (error) {
            try { popup?.close(); } catch { /* ignore */ }
            onError?.(error instanceof Error ? error.message : `Could not open in ${providerLabelFor(mediaServerType)}.`);
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
