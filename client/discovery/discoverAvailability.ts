import { normalizeRawDiscoveryItem } from './discoverItemUtils';
import {
    buildSeasonStatusFromDetails,
    MEDIA_STATUS,
    REQUEST_STATUS,
    resolveInProgressDisplay,
    type SeasonStatusInfo,
} from './requestSeasonUtils';

export type MediaAvailabilityKind =
    | 'available'
    | 'partial'
    | 'processing'
    | 'requested'
    | 'pending'
    | 'failed'
    | 'declined'
    | 'blacklisted'
    | 'none';

export type MediaAvailabilityState = {
    kind: MediaAvailabilityKind;
    label: string;
    detail?: string;
    mediaStatus: number | null;
    hasUserRequest: boolean;
    userRequestId?: number | null;
    userRequestStatus?: number | null;
};

const resolveMediaType = (item: any): 'movie' | 'tv' | null => {
    const normalized = normalizeRawDiscoveryItem(item);
    const raw = normalized?.mediaType ?? item?.mediaType ?? item?.type;
    if (raw === 'movie' || raw === 1 || raw === '1') return 'movie';
    if (raw === 'tv' || raw === 2 || raw === '2') return 'tv';
    if (normalized?.firstAirDate && !normalized?.releaseDate) return 'tv';
    if (normalized?.releaseDate && !normalized?.firstAirDate) return 'movie';
    return null;
};

const getActiveUserRequest = (mediaInfo: any) => {
    const requests = Array.isArray(mediaInfo?.requests) ? mediaInfo.requests : [];
    if (!requests.length) return null;

    const priority = [REQUEST_STATUS.FAILED, REQUEST_STATUS.DECLINED, REQUEST_STATUS.PENDING, REQUEST_STATUS.APPROVED];
    for (const status of priority) {
        const match = requests.find((req: any) => Number(req?.status) === status);
        if (match) return match;
    }
    return requests[0];
};

const formatSeasonSummary = (seasonRows: SeasonStatusInfo[]) => {
    const available = seasonRows.filter((s) => s.statusLabel === 'Available').map((s) => s.seasonNumber);
    if (!available.length) return null;
    if (available.length <= 4) return `Seasons ${available.join(', ')} in library`;
    return `${available.length} seasons in library`;
};

export const resolveMediaAvailabilityState = (item: any): MediaAvailabilityState => {
    const mediaInfo = item?.mediaInfo || item?.media?.mediaInfo || {};
    const mediaStatusRaw = item?.mediaInfo?.status ?? item?.media?.status ?? mediaInfo?.status;
    const mediaStatus = Number.isFinite(Number(mediaStatusRaw)) ? Number(mediaStatusRaw) : null;
    const mediaType = resolveMediaType(item);
    const userRequest = getActiveUserRequest(mediaInfo);
    const userRequestStatus = userRequest ? Number(userRequest.status) : null;
    const hasUserRequest = !!userRequest;
    const userRequestId = userRequest?.id ?? null;

    const base = {
        mediaStatus,
        hasUserRequest,
        userRequestId,
        userRequestStatus,
    };

    if (mediaStatus === MEDIA_STATUS.BLACKLISTED) {
        return {
            ...base,
            kind: 'blacklisted',
            label: 'Blacklisted',
            detail: 'This title cannot be requested.',
        };
    }

    if (userRequestStatus === REQUEST_STATUS.FAILED) {
        return {
            ...base,
            kind: 'failed',
            label: 'Request failed',
            detail: 'Something went wrong fulfilling this request. You can retry from My Requests.',
        };
    }

    if (userRequestStatus === REQUEST_STATUS.DECLINED) {
        return {
            ...base,
            kind: 'declined',
            label: 'Request declined',
            detail: userRequest?.declineReason || 'Your request was declined by an admin.',
        };
    }

    const seasonRows = mediaType === 'tv' ? buildSeasonStatusFromDetails(item) : [];
    const availableSeasons = seasonRows.filter((s) => s.statusLabel === 'Available');
    const pendingSeasons = seasonRows.filter((s) => s.statusLabel === 'Pending' || s.statusLabel === 'Approved');
    const processingSeasons = seasonRows.filter((s) => s.statusLabel === 'Processing');
    const requestedSeasons = seasonRows.filter((s) => s.statusLabel === 'Requested');
    const inProgressDisplay = resolveInProgressDisplay(mediaInfo, mediaStatus);

    if (mediaType === 'tv' && seasonRows.length > 0) {
        const requestable = seasonRows.filter((s) => s.requestable);
        if (requestable.length === 0 && availableSeasons.length > 0) {
            return {
                ...base,
                kind: 'available',
                label: 'Available in library',
                detail: formatSeasonSummary(seasonRows) || 'All requested seasons are available.',
            };
        }
        if (availableSeasons.length > 0 && requestable.length > 0) {
            return {
                ...base,
                kind: 'partial',
                label: 'Partially available',
                detail: `${formatSeasonSummary(seasonRows) || 'Some seasons in library'}. ${requestable.length} season${requestable.length === 1 ? '' : 's'} still requestable.`,
            };
        }
        if (processingSeasons.length > 0) {
            return {
                ...base,
                kind: 'processing',
                label: 'Processing',
                detail: 'Your request is being downloaded or imported.',
            };
        }
        if (inProgressDisplay) {
            return { ...base, ...inProgressDisplay };
        }
        if (requestedSeasons.length > 0) {
            return {
                ...base,
                kind: 'requested',
                label: 'Requested',
                detail: 'Your request was sent to the media server and is waiting to download.',
            };
        }
        if (pendingSeasons.length > 0 || userRequestStatus === REQUEST_STATUS.PENDING || mediaStatus === MEDIA_STATUS.PENDING) {
            return {
                ...base,
                kind: 'pending',
                label: 'Pending approval',
                detail: 'Waiting for an admin to approve your request.',
            };
        }
    }

    if (mediaType === 'movie') {
        if (mediaStatus === MEDIA_STATUS.AVAILABLE) {
            return {
                ...base,
                kind: 'available',
                label: 'Available in library',
                detail: 'This movie is already in your media library.',
            };
        }
        if (inProgressDisplay) {
            return { ...base, ...inProgressDisplay };
        }
        if (mediaStatus === MEDIA_STATUS.PENDING || userRequestStatus === REQUEST_STATUS.PENDING) {
            return {
                ...base,
                kind: 'pending',
                label: 'Pending approval',
                detail: 'Waiting for an admin to approve your request.',
            };
        }
        if (mediaStatus === MEDIA_STATUS.PARTIAL) {
            return {
                ...base,
                kind: 'partial',
                label: 'Partially available',
                detail: 'Part of this title may already be in your library.',
            };
        }
    }

    if (mediaStatus === MEDIA_STATUS.AVAILABLE) {
        return {
            ...base,
            kind: 'available',
            label: 'Available in library',
        };
    }

    if (mediaStatus === MEDIA_STATUS.PARTIAL) {
        return {
            ...base,
            kind: 'partial',
            label: 'Partially available',
            detail: formatSeasonSummary(seasonRows) || undefined,
        };
    }

    if (inProgressDisplay) {
        return { ...base, ...inProgressDisplay };
    }

    if (mediaStatus === MEDIA_STATUS.PENDING) {
        return {
            ...base,
            kind: 'pending',
            label: 'Pending',
            detail: 'Request is awaiting processing.',
        };
    }

    if (userRequestStatus === REQUEST_STATUS.PENDING) {
        return {
            ...base,
            kind: 'pending',
            label: 'Pending approval',
            detail: 'Waiting for an admin to approve your request.',
        };
    }

    if (userRequestStatus === REQUEST_STATUS.APPROVED && mediaStatus !== MEDIA_STATUS.AVAILABLE) {
        return {
            ...base,
            kind: 'requested',
            label: 'Requested',
            detail: 'Approved and sent to your media server.',
        };
    }

    return {
        ...base,
        kind: 'none',
        label: '',
    };
};

/** Whether an item should be hidden when "hide available" is enabled. */
export const shouldHideAvailableItem = (item: any): boolean => {
    const mediaType = resolveMediaType(item);
    const mediaStatus = Number(item?.mediaInfo?.status ?? item?.media?.status);

    if (mediaType === 'movie') {
        return mediaStatus === MEDIA_STATUS.AVAILABLE;
    }

    if (mediaType === 'tv') {
        const seasonRows = buildSeasonStatusFromDetails(item);
        if (seasonRows.length > 0) {
            const requestable = seasonRows.filter((s) => s.requestable);
            return requestable.length === 0 && seasonRows.some((s) => s.statusLabel === 'Available');
        }
        if (mediaStatus === MEDIA_STATUS.PARTIAL) return false;
        return mediaStatus === MEDIA_STATUS.AVAILABLE;
    }

    return mediaStatus === MEDIA_STATUS.AVAILABLE || mediaStatus === MEDIA_STATUS.PARTIAL;
};

export const isMediaAvailableInLibrary = (item: any = {}) => {
    const mediaStatus = Number(item?.mediaInfo?.status ?? item?.media?.status);
    if (mediaStatus === MEDIA_STATUS.AVAILABLE || mediaStatus === MEDIA_STATUS.PARTIAL) return true;

    const mediaInfo = item?.mediaInfo;
    if (mediaInfo && Number(mediaInfo.id) > 0 && !Number.isFinite(mediaStatus)) {
        const downloadStatus = Array.isArray(mediaInfo.downloadStatus) ? mediaInfo.downloadStatus : [];
        if (downloadStatus.some((entry: any) => Number(entry?.status) === 5)) return true;
    }
    return false;
};

export const filterHiddenAvailableItems = <T extends { mediaInfo?: { status?: number }; media?: { status?: number } }>(
    items: T[],
    hideAvailable: boolean,
): T[] => {
    if (!hideAvailable || !Array.isArray(items)) return items;
    return items.filter((item) => !shouldHideAvailableItem(item));
};
