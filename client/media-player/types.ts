export type PlayerRatingScore = {
    value: number;
    percent: number | null;
    url?: string | null;
    fresh?: boolean;
};

export type PlayerRatings = {
    imdb: PlayerRatingScore | null;
    rottenTomatoes: PlayerRatingScore | null;
    popcorn: PlayerRatingScore | null;
    tmdb: PlayerRatingScore | null;
};

export type PlayerMediaStreamInfo = {
    codec?: string | null;
    bitrate?: number | null;
    width?: number | null;
    height?: number | null;
    resolution?: string | null;
    frameRate?: string | null;
    profile?: string | null;
    bitDepth?: number | null;
    chromaLocation?: string | null;
    codedHeight?: number | null;
    displayTitle?: string | null;
    aspectRatio?: string | null;
    channels?: number | null;
    language?: string | null;
    selected?: boolean;
};

export type PlayerMediaPartInfo = {
    id: string;
    fileName: string;
    size: number | null;
    container: string | null;
    durationMs: number | null;
    video: PlayerMediaStreamInfo;
    audio: PlayerMediaStreamInfo[];
    subtitles: PlayerMediaStreamInfo[];
};

export type PlayerMediaInfo = {
    id: string;
    container: string | null;
    bitrate: number | null;
    width: number | null;
    height: number | null;
    videoResolution: string | null;
    videoCodec: string | null;
    audioCodec: string | null;
    audioChannels: number | null;
    durationMs: number | null;
    parts: PlayerMediaPartInfo[];
};

export type PlayerItem = {
    ratingKey: string;
    title: string;
    showTitle?: string | null;
    seasonTitle?: string | null;
    type: string;
    year?: number | null;
    summary?: string;
    thumb?: string | null;
    art?: string | null;
    durationMs?: number | null;
    viewOffsetMs?: number;
    index?: number | null;
    parentIndex?: number | null;
    leafCount?: number | null;
    childCount?: number | null;
    parentRatingKey?: string | null;
    grandparentRatingKey?: string | null;
    contentRating?: string | null;
    audienceRating?: number | null;
    originallyAvailableAt?: string | null;
    tmdbId?: number | null;
    genres?: string[];
    addedAt?: number | null;
    viewedLeafCount?: number | null;
    extraType?: string | null;
    extraSubtype?: string | null;
    plexUrl?: string | null;
    canPlay?: boolean;
    tagline?: string;
    studio?: string;
    directors?: string[];
    writers?: string[];
    cast?: Array<{ id: string; name: string; role: string; thumb?: string | null }>;
    ratings?: PlayerRatings;
    mediaInfo?: PlayerMediaInfo[];
    externalIds?: { imdb: string | null; tmdb: number | null; tvdb: string | null };
};

export type PlayerPersonPage = {
    person: { id: string; name: string; thumb?: string | null };
    items: PlayerItem[];
};

export type PlayerSection = {
    key: string;
    title: string;
    type: string;
    agent?: string;
    thumb?: string | null;
};

export type PlayerHomeRail = {
    library: PlayerSection;
    items: PlayerItem[];
};

export type PlayerHome = {
    libraries: PlayerSection[];
    continueWatching: PlayerItem[];
    recentByLibrary: PlayerHomeRail[];
};

export type PlayerLibraryHub = {
    title: string;
    identifier: string;
    items: PlayerItem[];
};

export type PlayerLibraryHome = {
    title: string;
    type: string;
    hubs: PlayerLibraryHub[];
};

export type PlayerLibraryFilters = {
    genres: Array<{ key: string; title: string }>;
};

export type PlayerLibraryPage = {
    title: string;
    type: string;
    total: number;
    items: PlayerItem[];
};

export type PlayerItemPage = {
    item: PlayerItem;
    children: PlayerItem[];
    extras?: PlayerItem[];
    related?: PlayerLibraryHub[];
};

export type PlayerQualityOption = {
    id: string;
    label: string;
    videoResolution: string;
    maxVideoBitrate: number;
    videoQuality: number;
};

export type PlayerAudioTrack = {
    id: string;
    label: string;
    language?: string | null;
    codec?: string | null;
    channels?: number | null;
    selected?: boolean;
};

export type PlayerSubtitleTrack = {
    id: string;
    label: string;
    language?: string | null;
    codec?: string | null;
    forced?: boolean;
    selected?: boolean;
};

export type PlayerPlaySession = {
    sessionId: string;
    item: PlayerItem;
    src: string;
    offsetMs: number;
    qualities?: PlayerQualityOption[];
    qualityId?: string;
    audioTracks?: PlayerAudioTrack[];
    audioStreamId?: string | null;
    subtitles?: PlayerSubtitleTrack[];
    subtitleStreamId?: string | null;
};
