import React, { useEffect, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { apiFetch } from './api';

export type LibraryDeepLinkParams = {
    mediaType: 'movie' | 'tv';
    tmdbId?: number | null;
    ratingKey?: string | null;
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
    if (direct != null && String(direct).trim()) return String(direct).trim();

    // Recover rating key from a Seerr plexUrl if present
    for (const candidate of [mediaInfo.plexUrl, mediaInfo.plexUrl4k, mediaInfo.iOSPlexUrl, mediaInfo.iOSPlexUrl4k]) {
        const raw = String(candidate || '');
        const match = raw.match(/library%2Fmetadata%2F(\d+)/i)
            || raw.match(/library\/metadata\/(\d+)/i)
            || raw.match(/metadataKey=.*?(\d+)/i);
        if (match?.[1]) return match[1];
    }
    return null;
};

export const fetchLibraryDeepLink = async (params: LibraryDeepLinkParams): Promise<{ url: string; label: string }> => {
    const qs = new URLSearchParams();
    qs.set('mediaType', params.mediaType);
    if (params.tmdbId != null && Number(params.tmdbId) > 0) qs.set('tmdbId', String(params.tmdbId));
    if (params.ratingKey) qs.set('ratingKey', String(params.ratingKey));

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
    mediaInfo?: any;
    mediaServerType?: string;
    className?: string;
    onError?: (message: string) => void;
}> = ({ mediaType, tmdbId, mediaInfo, mediaServerType = 'plex', className = '' }) => {
    const serverType = String(mediaServerType || 'plex').toLowerCase();
    const preferredUrl = resolveLibraryLinkFromMediaInfo(mediaInfo, serverType);
    const ratingKey = resolveLibraryRatingKey(mediaInfo);
    const defaultLabel = `Open in ${providerLabelFor(serverType)}`;
    const [href, setHref] = useState<string | null>(preferredUrl);
    const [label, setLabel] = useState(defaultLabel);
    const [loading, setLoading] = useState(!preferredUrl);
    const canResolve = !!preferredUrl || !!ratingKey || (tmdbId != null && Number(tmdbId) > 0);

    useEffect(() => {
        setLabel(defaultLabel);

        // Always resolve through the portal for Plex so we use this server's machine id
        // (Seerr plexUrl can point at the wrong machine or use plex://).
        const shouldForcePortalResolve = serverType === 'plex' || !preferredUrl;
        if (!shouldForcePortalResolve && preferredUrl) {
            setHref(preferredUrl);
            setLoading(false);
            return;
        }
        if (!canResolve) {
            setHref(null);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        fetchLibraryDeepLink({ mediaType, tmdbId, ratingKey, mediaServerType: serverType })
            .then((link) => {
                if (cancelled) return;
                setHref(link.url);
                setLabel(link.label);
            })
            .catch(() => {
                if (cancelled) return;
                // Fall back to Seerr http(s) URL only if portal lookup failed
                if (preferredUrl) {
                    setHref(preferredUrl);
                } else {
                    setHref(null);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [canResolve, defaultLabel, mediaType, preferredUrl, ratingKey, serverType, tmdbId]);

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
