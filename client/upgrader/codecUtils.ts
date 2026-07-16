/** Collapse Sonarr/Radarr codec aliases into stable family keys (x264 ≡ h264, x265 ≡ hevc). */
export const normalizeArrVideoCodecKey = (codec: string | null | undefined): string => {
    const c = String(codec || '').toLowerCase().trim();
    if (!c) return '';
    if (/\bav1\b|av01/.test(c)) return 'av1';
    if (/hevc|h\.?265|x265|hev1/.test(c)) return 'hevc';
    if (/h\.?264|x264|\bavc\b|avc1/.test(c)) return 'h264';
    if (/vp9|vp09/.test(c)) return 'vp9';
    if (/mpeg-?2|mp2v/.test(c)) return 'mpeg2';
    if (/mpeg-?4|xvid|divx/.test(c)) return 'mpeg4';
    return c;
};

const CODEC_LABELS: Record<string, string> = {
    h264: 'H.264',
    hevc: 'HEVC',
    av1: 'AV1',
    vp9: 'VP9',
    mpeg2: 'MPEG-2',
    mpeg4: 'MPEG-4',
};

export const formatUpgraderCodecLabel = (codec: string | null | undefined): string => {
    const key = normalizeArrVideoCodecKey(codec);
    if (!key) return '';
    return CODEC_LABELS[key] || key.toUpperCase();
};

export const mergeUpgraderCodecCounts = (
    codecCounts: Record<string, number> | null | undefined,
): Record<string, number> => {
    const merged: Record<string, number> = {};
    Object.entries(codecCounts || {}).forEach(([raw, count]) => {
        const key = normalizeArrVideoCodecKey(raw);
        if (!key) return;
        merged[key] = (merged[key] || 0) + Number(count || 0);
    });
    return merged;
};

/** Percent of files *with known mediaInfo* that use the dominant codec family. */
export const getDominantCodecShare = (
    codecCounts: Record<string, number> | null | undefined,
    onDiskFileCount = 0,
): { key: string; label: string; count: number; percent: number; percentLabel: string; knownFiles: number; unknownFiles: number } | null => {
    const merged = mergeUpgraderCodecCounts(codecCounts);
    const sorted = Object.entries(merged).sort((a, b) => b[1] - a[1]);
    if (!sorted.length) return null;

    const [key, count] = sorted[0];
    const knownFiles = Object.values(merged).reduce((sum, n) => sum + n, 0);
    // Prefer known-codec files so missing Sonarr mediaInfo does not drag the % down.
    const denom = knownFiles > 0 ? knownFiles : onDiskFileCount;
    if (denom <= 0) return null;

    const exact = (count / denom) * 100;
    const percent = Math.abs(exact - Math.round(exact)) < 0.05
        ? Math.round(exact)
        : Math.round(exact * 10) / 10;
    const percentLabel = Number.isInteger(percent) ? String(percent) : percent.toFixed(1);

    return {
        key,
        label: formatUpgraderCodecLabel(key),
        count,
        percent,
        percentLabel,
        knownFiles,
        unknownFiles: Math.max(0, onDiskFileCount - knownFiles),
    };
};
