import type { UpgraderPreset } from './types';

export const UPGRADER_PRESET_OPTIONS: Array<{ id: UpgraderPreset; label: string; group?: string }> = [
    { id: 'all', label: 'All titles', group: 'Browse' },
    { id: 'non_hevc', label: 'Non-HEVC', group: 'Codec' },
    { id: 'h264_only', label: 'H.264 / x264', group: 'Codec' },
    { id: 'hevc_only', label: 'HEVC only', group: 'Codec' },
    { id: 'av1_only', label: 'AV1 only', group: 'Codec' },
    { id: 'vp9_only', label: 'VP9 only', group: 'Codec' },
    { id: 'sd', label: 'SD', group: 'Resolution' },
    { id: '720p', label: '720p', group: 'Resolution' },
    { id: '1080p', label: '1080p', group: 'Resolution' },
    { id: '4k_all', label: '4K (all)', group: 'Resolution' },
    { id: '4k_non_hevc', label: '4K non-HEVC', group: 'Upgrade' },
    { id: 'hdr_non_hevc', label: 'HDR non-HEVC', group: 'Upgrade' },
    { id: 'dolby_vision', label: 'Dolby Vision', group: 'Upgrade' },
    { id: 'large_non_hevc', label: 'Large non-HEVC', group: 'Upgrade' },
];

export const UPGRADER_PRESET_SELECT_OPTIONS = UPGRADER_PRESET_OPTIONS.map((option) => ({
    value: option.id,
    label: option.label,
}));
