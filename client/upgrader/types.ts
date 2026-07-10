export type UpgraderPreset =
    | 'non_hevc'
    | 'h264_only'
    | '4k_non_hevc'
    | 'hdr_non_hevc'
    | 'large_non_hevc'
    | 'arr_mapped'
    | 'arr_unmapped';

export type UpgraderSort = 'title' | 'sizeGB' | 'watchCount' | 'addedAt' | 'daysSinceAdded' | 'staleAdded';

export type UpgraderStatus = {
    enabled: boolean;
    generatedAt: string | null;
    itemCount: number;
    rebuildInProgress: boolean;
    mediaServerType: string;
    plexConfigured: boolean;
    arrConfigured: boolean;
    automationEnabled: boolean;
    profileMapConfigured: boolean;
    maxActionsPerHour: number;
    recentUpgradeCount: number;
    defaultPreset: UpgraderPreset;
    defaultSort: UpgraderSort;
    minSizeGB: number;
};

export type UpgraderSummary = {
    generatedAt: string | null;
    totalItems: number;
    nonHevcCount: number;
    hevcCount: number;
    nonHevc4kCount: number;
    nonHevcHdrCount: number;
    arrMappedCount: number;
    arrUnmappedCount: number;
    estimatedReclaimableGB: number;
    minSizeGB: number;
};

export type UpgraderItem = {
    ratingKey: string;
    title: string;
    year: number | null;
    thumb: string;
    thumbUrl?: string | null;
    mediaType: string;
    libraryTitle: string;
    libraryId: string;
    videoCodec: string;
    videoResolution: string;
    displayTags: string[];
    sizeGB: number;
    watchCount: number;
    addedAt: string | null;
    daysSinceAdded?: number | null;
    isHevc: boolean;
    hasHdr: boolean;
    hasDolbyVision: boolean;
    totalEpisodeCount?: number;
    nonHevcEpisodeCount?: number;
    nonHevcEpisodeSizeGB?: number;
    plexUrl: string | null;
    arrMapped: boolean;
    arrType: string;
    arrInstanceName: string | null;
    arrInstanceId: string | null;
    arrDeepUrl: string | null;
    arrQualityProfileId?: number | null;
    excluded: boolean;
    snoozed?: boolean;
};

export type UpgraderEpisode = {
    ratingKey: string;
    title: string;
    showTitle?: string;
    seasonNumber?: number | null;
    episodeNumber?: number | null;
    thumb?: string;
    thumbUrl?: string | null;
    mediaType: string;
    videoCodec: string;
    videoResolution?: string;
    sizeGB: number;
    displayTags: string[];
    isHevc: boolean;
    hasHdr?: boolean;
    hasDolbyVision?: boolean;
    plexUrl: string | null;
};

export type UpgraderItemsResponse = {
    generatedAt: string | null;
    preset: UpgraderPreset;
    total: number;
    page: number;
    limit: number;
    libraries: Array<{ id: string; title: string; count: number }>;
    items: UpgraderItem[];
};

export type UpgraderQueueSummary = {
    instances: Array<{ instanceId: string; instanceName: string; type: string; total: number }>;
    totalQueued: number;
};

export type UpgraderUpgradePreviewEntry = {
    ratingKey: string;
    title?: string;
    success: boolean;
    reason?: string;
    arrInstanceName?: string;
    currentProfileId?: number | null;
    currentProfileName?: string | null;
    targetProfileId?: number;
    targetProfileName?: string | null;
};

export type UpgraderUpgradePreviewResult = {
    dryRun: boolean;
    results: UpgraderUpgradePreviewEntry[];
    totals: { succeeded: number; failed: number };
};

export type UpgraderAuditEntry = {
    id: string;
    timestamp: string;
    ratingKey: string;
    title: string;
    arrInstanceId?: string;
    arrInstanceName?: string;
    arrType?: string;
    currentProfileId?: number | null;
    targetProfileId?: number;
    triggerSearch?: boolean;
    commandId?: string | null;
    dryRun?: boolean;
    actor?: { username?: string | null; email?: string | null };
};

export type UpgraderPreferences = {
    exclusions: {
        ratingKeys: string[];
        episodeKeys: string[];
        titles: string[];
        libraries: string[];
    };
    snoozed: Array<{ ratingKey: string; until: string | null; reason?: string | null }>;
};
