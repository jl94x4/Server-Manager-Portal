export const isMediaAvailableInLibrary = (item: any = {}) => {
    const raw = item?.mediaInfo?.status ?? item?.media?.status;
    const status = Number(raw);
    if (status === 4 || status === 5) return true;

    const mediaInfo = item?.mediaInfo;
    if (mediaInfo && Number(mediaInfo.id) > 0 && !Number.isFinite(status)) {
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
    return items.filter((item) => !isMediaAvailableInLibrary(item));
};
