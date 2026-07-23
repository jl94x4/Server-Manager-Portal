import { normalizeRawDiscoveryItem } from './discoverItemUtils';
import { resolveMediaAvailabilityState } from './discoverAvailability';
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
    const availability = resolveMediaAvailabilityState(item);
    if (availability.kind === 'none') return null;
    if (availability.kind === 'available') return availability.label || 'Available';
    if (availability.kind === 'partial') return availability.label || 'Partially available';
    if (availability.kind === 'processing') return 'Processing';
    if (availability.kind === 'requested') return 'Requested';
    if (availability.kind === 'pending') return 'Pending';
    if (availability.kind === 'failed') return 'Failed';
    if (availability.kind === 'declined') return 'Declined';
    if (availability.kind === 'blacklisted') return 'Blacklisted';
    return availability.label || null;
};

/** Quick client-side check — modal/backend still enforce rules. */
export const isWatchlistItemRequestable = (item: any): boolean => {
    const ref = resolveWatchlistMediaRef(item);
    if (!ref) return false;
    const availability = resolveMediaAvailabilityState(item);
    // Already on the server (full or partial) — hide Request on the watchlist row.
    if (
        availability.kind === 'blacklisted'
        || availability.kind === 'failed'
        || availability.kind === 'declined'
        || availability.kind === 'available'
        || availability.kind === 'partial'
        || availability.kind === 'requested'
        || availability.kind === 'pending'
        || availability.kind === 'processing'
    ) {
        return false;
    }

    const mediaStatus = Number(item?.mediaInfo?.status ?? item?.media?.status);
    if (
        mediaStatus === MEDIA_STATUS.AVAILABLE
        || mediaStatus === MEDIA_STATUS.PARTIAL
        || mediaStatus === MEDIA_STATUS.PROCESSING
        || mediaStatus === MEDIA_STATUS.PENDING
    ) {
        return false;
    }

    if (ref.mediaType === 'movie') {
        if (isMovieFullyAvailable(mediaStatus)) return false;
        if (isMovieRequestPending(mediaStatus)) return false;
        return true;
    }

    const seasons = buildSeasonStatusFromDetails(item);
    if (seasons.length > 0) return seasons.some((s) => s.requestable);
    return true;
};

export const countRequestableWatchlistItems = (items: any[]) => (
    (items || []).filter(isWatchlistItemRequestable).length
);
