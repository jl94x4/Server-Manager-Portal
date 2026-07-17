import React, { useEffect, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { apiFetch } from './api';

export type LibraryDeepLinkParams = {
    mediaType: 'movie' | 'tv';
    tmdbId?: number | null;
    ratingKey?: string | null;
    title?: string | null;
    year?: string | number | null;
    mediaServerType?: string;
};

const providerLabelFor = (mediaServerType?: string) => {
    const type = String(mediaServerType || 'plex').toLowerCase();
    if (type === 'jellyfin') return 'Jellyfin';
    if (type === 'emby') return 'Emby';
    return 'Plex';
};

const isHttpUrl = (value: unknown): value is string => {
    const href = String(value || '').trim();
    return href.startsWith('http://') || href.startsWith('https://');
};

/** Prefer Seerr http(s) play links; ignore plex:// scheme (causes desktop flicker / no-op). */
export const resolveLibraryLinkFromMediaInfo = (mediaInfo: any, mediaServerType?: string): string | null => {
    if (!mediaInfo || typeof mediaInfo !== 'object') return null;
    const type = String(mediaServerType || 'plex').toLowerCase();
    const candidates = type === 'jellyfin' || type === 'emby'
        ? [mediaInfo.mediaUrl, mediaInfo.jellyfinUrl, mediaInfo.plexUrl, mediaInfo.plexUrl4k]
        : [mediaInfo.plexUrl, mediaInfo.plexUrl4k, mediaInfo.mediaUrl];
    for (const candidate of candidates) {
        if (isHttpUrl(candidate)) return String(candidate).trim();
    }
    return null;
};

export const resolveLibraryRatingKey = (mediaInfo: any): string | null => {
    if (!mediaInfo || typeof mediaInfo !== 'object') return null;
    const direct = mediaInfo.ratingKey || mediaInfo.ratingKey4k || mediaInfo.jellyfinMediaId || mediaInfo.jellyfinMediaId4k;
    if (direct != null && String(direct).trim() && String(direct).trim() !== '0') {
        return String(direct).trim().replace(/^\/library\/metadata\//, '');
    }

    for (const candidate of [mediaInfo.plexUrl, mediaInfo.plexUrl4k, mediaInfo.iOSPlexUrl, mediaInfo.iOSPlexUrl4k]) {
        const raw = String(candidate || '');
        const match = raw.match(/library%2Fmetadata%2F(\d+)/i)
            || raw.match(/library\/metadata\/(\d+)/i)
            || raw.match(/metadataKey=[^&]*?(\d+)/i);
        if (match?.[1]) return match[1];
    }
    return null;
};

export const fetchLibraryDeepLink = async (params: LibraryDeepLinkParams): Promise<{ url: string; label: string }> => {
    const qs = new URLSearchParams();
    qs.set('mediaType', params.mediaType);
    if (params.tmdbId != null && Number(params.tmdbId) > 0) qs.set('tmdbId', String(params.tmdbId));
    if (params.ratingKey) qs.set('ratingKey', String(params.ratingKey));
    if (params.title) qs.set('title', String(params.title));
    if (params.year != null && String(params.year).trim()) qs.set('year', String(params.year).trim().slice(0, 4));

    const res = await apiFetch(`/api/discovery/library-link?${qs.toString()}`);
    if (!res?.url || !isHttpUrl(res.url)) {
        throw new Error(res?.error || `Could not open in ${providerLabelFor(params.mediaServerType)}.`);
    }
    return {
        url: String(res.url).trim(),
        label: String(res.label || `Open in ${providerLabelFor(params.mediaServerType)}`),
    };
};

export const OpenInLibraryButton: React.FC<{
    mediaType: 'movie' | 'tv';
    tmdbId?: number | null;
    title?: string | null;
    year?: string | number | null;
    mediaInfo?: any;
    mediaServerType?: string;
    className?: string;
    onError?: (message: string) => void;
}> = ({ mediaType, tmdbId, title, year, mediaInfo, mediaServerType = 'plex', className = '' }) => {
    const serverType = String(mediaServerType || 'plex').toLowerCase();
    const preferredUrl = resolveLibraryLinkFromMediaInfo(mediaInfo, serverType);
    const ratingKey = resolveLibraryRatingKey(mediaInfo);
    const defaultLabel = `Open in ${providerLabelFor(serverType)}`;
    const [href, setHref] = useState<string | null>(null);
    const [label, setLabel] = useState(defaultLabel);
    const [loading, setLoading] = useState(true);
    const canResolve = !!preferredUrl || !!ratingKey || (tmdbId != null && Number(tmdbId) > 0) || !!String(title || '').trim();

    useEffect(() => {
        setLabel(defaultLabel);
        if (!canResolve) {
            setHref(null);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        fetchLibraryDeepLink({
            mediaType,
            tmdbId,
            ratingKey,
            title,
            year,
            mediaServerType: serverType,
        })
            .then((link) => {
                if (cancelled) return;
                setHref(link.url);
                setLabel(link.label);
            })
            .catch(() => {
                if (cancelled) return;
                setHref(preferredUrl || null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [canResolve, defaultLabel, mediaType, preferredUrl, ratingKey, serverType, title, tmdbId, year]);

    if (!canResolve) return null;

    if (loading) {
        return (
            <button
                type="button"
                disabled
                className={`${className} opacity-70 cursor-wait`}
                title={defaultLabel}
            >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {defaultLabel}
            </button>
        );
    }

    if (!href) return null;

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
            title={label}
        >
            <ExternalLink className="w-3.5 h-3.5" />
            {label}
        </a>
    );
};
