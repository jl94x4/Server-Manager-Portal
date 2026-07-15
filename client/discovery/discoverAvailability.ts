import { normalizeRawDiscoveryItem } from './discoverItemUtils';
import {
    buildSeasonStatusFromDetails,
    hasActiveSeerrDownloads,
    isEndedShow,
    isMainSeasonNumber,
    isReturningSeries,
    isSeasonUpToDateLabel,
    isTvShowLibraryComplete,
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

const formatUpToDateSeasonSummary = (seasonRows: SeasonStatusInfo[]) => {
    const upToDate = seasonRows.filter((s) => isSeasonUpToDateLabel(s.statusLabel)).map((s) => s.seasonNumber);
    if (!upToDate.length) return null;
    if (upToDate.length <= 4) return `Season${upToDate.length === 1 ? '' : 's'} ${upToDate.join(', ')} up to date`;
    return `${upToDate.length} seasons up to date`;
};

const formatTvLibraryDetail = (seasonRows: SeasonStatusInfo[], airingDetail?: string) => {
    const parts = [formatSeasonSummary(seasonRows), formatUpToDateSeasonSummary(seasonRows)].filter(Boolean);
    if (parts.length) {
        if (airingDetail) return `${parts.join('. ')}. ${airingDetail}`;
        return parts.join('. ');
    }
    return airingDetail || 'All requested seasons are available.';
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
    const tvLibraryComplete = mediaType === 'tv'
        ? isTvShowLibraryComplete(item, seasonRows, mediaInfo)
        : false;

    if (tvLibraryComplete) {
        return {
            ...base,
            kind: 'available',
            label: isReturningSeries(item) ? 'Up to date' : 'Available in library',
            detail: item?.sonarrLibraryStatus?.showComplete
                ? 'All aired episodes are on disk (verified via Sonarr).'
                : formatTvLibraryDetail(seasonRows) || 'All aired episodes are in your library.',
        };
    }

    const availableSeasons = seasonRows.filter((s) => s.statusLabel === 'Available');
    const upToDateSeasons = seasonRows.filter((s) => isSeasonUpToDateLabel(s.statusLabel));
    const incompleteSeasons = seasonRows.filter((s) => s.statusLabel === 'Partial');
    const pendingSeasons = seasonRows.filter((s) => s.statusLabel === 'Pending' || s.statusLabel === 'Approved');
    const processingSeasons = seasonRows.filter((s) => s.statusLabel === 'Processing');
    const requestedSeasons = seasonRows.filter((s) => s.statusLabel === 'Requested');
    const inProgressDisplay = resolveInProgressDisplay(mediaInfo, mediaStatus);
    const returningSeries = isReturningSeries(item);
    const endedShow = isEndedShow(item);

    if (mediaType === 'tv' && seasonRows.length > 0) {
        const requestable = seasonRows.filter((s) => s.requestable);
        const mainRequestable = requestable.filter((s) => isMainSeasonNumber(s.seasonNumber));
        const mainAvailable = availableSeasons.filter((s) => isMainSeasonNumber(s.seasonNumber));
        const mainUpToDate = upToDateSeasons.filter((s) => isMainSeasonNumber(s.seasonNumber));
        const mainIncomplete = incompleteSeasons.filter((s) => isMainSeasonNumber(s.seasonNumber));
        const handledSeasons = seasonRows.filter(
            (s) => !s.requestable && s.statusLabel !== 'Not requested' && s.statusLabel !== 'Declined',
        );
        const mainHandled = handledSeasons.filter((s) => isMainSeasonNumber(s.seasonNumber));

        if (endedShow && mainRequestable.length === 0 && mainHandled.length > 0
            && (mainAvailable.length > 0 || mainUpToDate.length > 0)) {
            return {
                ...base,
                kind: 'available',
                label: 'Available in library',
                detail: formatTvLibraryDetail(seasonRows),
            };
        }

        if (requestable.length === 0 && handledSeasons.length > 0) {
            if (returningSeries) {
                return {
                    ...base,
                    kind: 'available',
                    label: 'Up to date',
                    detail: formatTvLibraryDetail(
                        seasonRows,
                        'New episodes will be added as they air.',
                    ),
                };
            }
            if (availableSeasons.length > 0 || upToDateSeasons.length > 0) {
                return {
                    ...base,
                    kind: 'available',
                    label: 'Available in library',
                    detail: formatTvLibraryDetail(seasonRows),
                };
            }
        }
        if ((mainAvailable.length > 0 || mainUpToDate.length > 0) && mainRequestable.length > 0) {
            const handledSummary = formatTvLibraryDetail(seasonRows);
            return {
                ...base,
                kind: 'partial',
                label: 'Partially available',
                detail: handledSummary
                    ? `${handledSummary}. ${mainRequestable.length} season${mainRequestable.length === 1 ? '' : 's'} still requestable.`
                    : `${mainRequestable.length} season${mainRequestable.length === 1 ? '' : 's'} still requestable.`,
            };
        }
        if (mainIncomplete.length > 0 && mainRequestable.length === 0) {
            return {
                ...base,
                kind: 'partial',
                label: 'Partially available',
                detail: `${mainIncomplete.length} season${mainIncomplete.length === 1 ? '' : 's'} missing episodes in your library.`,
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
        if (mediaType === 'tv' && item?.sonarrLibraryStatus?.showComplete) {
            return {
                ...base,
                kind: 'available',
                label: 'Available in library',
                detail: 'All aired episodes are on disk (verified via Sonarr).',
            };
        }
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
        if (mediaType === 'tv' && !hasActiveSeerrDownloads(mediaInfo)) {
            return {
                ...base,
                kind: 'available',
                label: 'Available in library',
                detail: 'Your request has been fulfilled.',
            };
        }
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
    const { kind } = resolveMediaAvailabilityState(item);
    return kind === 'available' || kind === 'partial';
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
