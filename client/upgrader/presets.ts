import type { UpgraderCodec, UpgraderResolution, UpgraderFeature, UpgraderQuality } from './types';

export const UPGRADER_CODEC_OPTIONS: Array<{ id: UpgraderCodec; label: string }> = [
    { id: 'h264', label: 'H.264 / x264' },
    { id: 'hevc', label: 'HEVC' },
    { id: 'av1', label: 'AV1' },
    { id: 'vp9', label: 'VP9' },
];

export const UPGRADER_RESOLUTION_OPTIONS: Array<{ id: UpgraderResolution; label: string }> = [
    { id: 'sd', label: 'SD' },
    { id: '720p', label: '720p' },
    { id: '1080p', label: '1080p' },
    { id: '4k', label: '4K' },
];

export const UPGRADER_FEATURE_OPTIONS: Array<{ id: UpgraderFeature; label: string }> = [
    { id: 'non_hevc', label: 'Non-HEVC' },
    { id: 'hdr', label: 'HDR' },
    { id: 'dolby_vision', label: 'Dolby Vision' },
    { id: 'large', label: 'Large Size' },
];

export const UPGRADER_QUALITY_OPTIONS: Array<{ id: UpgraderQuality; label: string }> = [
    { id: 'web-dl', label: 'WEB-DL' },
    { id: 'webrip', label: 'WEBRip' },
    { id: 'remux', label: 'Remux' },
    { id: 'hdtv', label: 'HDTV' },
    { id: 'bluray', label: 'BluRay' },
];

export const UPGRADER_PRESET_SELECT_OPTIONS = [
    { value: 'all', label: 'All titles' },
    { value: 'non_hevc', label: 'Non-HEVC' },
    { value: 'h264_only', label: 'H.264 / x264' },
    { value: 'hevc_only', label: 'HEVC only' },
    { value: 'av1_only', label: 'AV1 only' },
    { value: 'vp9_only', label: 'VP9 only' },
    { value: 'sd', label: 'SD' },
    { value: '720p', label: '720p' },
    { value: '1080p', label: '1080p' },
    { value: '4k_all', label: '4K (all)' },
    { value: '4k_non_hevc', label: '4K non-HEVC' },
    { value: 'hdr_non_hevc', label: 'HDR non-HEVC' },
    { value: 'dolby_vision', label: 'Dolby Vision' },
    { value: 'large_non_hevc', label: 'Large non-HEVC' },
];
