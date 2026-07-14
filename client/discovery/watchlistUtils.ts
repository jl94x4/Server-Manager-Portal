import { normalizeRawDiscoveryItem } from './discoverItemUtils';
import { buildSeasonStatusFromDetails, isMovieFullyAvailable, isMovieRequestPending, MEDIA_STATUS } from './requestSeasonUtils';

export type WatchlistMediaRef = {
    mediaType: 'movie' | 'tv';
    mediaId: number;
    title: string;
};

export const resolveWatchlistMediaRef = (item: any): WatchlistMediaRef | null => {
    const normalized = normalizeRawDiscoveryItem(item);
    const rawType = normalized?.mediaType ?? item?.mediaType ?? item?.type;
    let mediaType: 'movie' | 'tv' | null = null;
    if (rawType === 'movie' || rawType === 1 || rawType === '1') mediaType = 'movie';
    if (rawType === 'tv' || rawType === 2 || rawType === '2') mediaType = 'tv';
    if (!mediaType && normalized?.firstAirDate) mediaType = 'tv';
    if (!mediaType && (normalized?.title || item?.title) && !normalized?.firstAirDate && normalized?.releaseDate) mediaType = 'movie';

    const mediaId = Number(normalized?.tmdbId ?? normalized?.id ?? item?.id);
    if (!mediaType || !Number.isFinite(mediaId) || mediaId <= 0) return null;

    const title = normalized?.title || normalized?.name || item?.title || item?.name || 'Unknown';
    return { mediaType, mediaId, title };
};

export const watchlistItemStatusLabel = (item: any): string | null => {
    const ref = resolveWatchlistMediaRef(item);
    if (!ref) return null;
    const mediaStatus = Number(item?.mediaInfo?.status ?? item?.media?.status);

    if (mediaStatus === MEDIA_STATUS.BLACKLISTED) return 'Blacklisted';
    if (ref.mediaType === 'movie') {
        if (isMovieFullyAvailable(mediaStatus)) return 'Available';
        if (isMovieRequestPending(mediaStatus)) return mediaStatus === MEDIA_STATUS.PROCESSING ? 'Processing' : 'Pending';
    }
    if (ref.mediaType === 'tv') {
        if (mediaStatus === MEDIA_STATUS.AVAILABLE) return 'Available';
        if (mediaStatus === MEDIA_STATUS.PARTIAL) return 'Partial';
        if (mediaStatus === MEDIA_STATUS.PROCESSING) return 'Processing';
        if (mediaStatus === MEDIA_STATUS.PENDING) return 'Pending';
        const seasons = buildSeasonStatusFromDetails(item);
        if (seasons.length > 0) {
            const requestable = seasons.filter((s) => s.requestable).length;
            if (requestable === 0) return 'Requested';
        }
    }
    return null;
};

/** Quick client-side check — modal/backend still enforce rules. */
export const isWatchlistItemRequestable = (item: any): boolean => {
    const ref = resolveWatchlistMediaRef(item);
    if (!ref) return false;
    const mediaStatus = Number(item?.mediaInfo?.status ?? item?.media?.status);
    if (mediaStatus === MEDIA_STATUS.BLACKLISTED) return false;

    if (ref.mediaType === 'movie') {
        if (isMovieFullyAvailable(mediaStatus)) return false;
        if (isMovieRequestPending(mediaStatus)) return false;
        return true;
    }

    const seasons = buildSeasonStatusFromDetails(item);
    if (seasons.length > 0) return seasons.some((s) => s.requestable);
    if (mediaStatus === MEDIA_STATUS.AVAILABLE) return false;
    if (mediaStatus === MEDIA_STATUS.PROCESSING || mediaStatus === MEDIA_STATUS.PENDING) return false;
    return true;
};

export const countRequestableWatchlistItems = (items: any[]) => (
    (items || []).filter(isWatchlistItemRequestable).length
);
