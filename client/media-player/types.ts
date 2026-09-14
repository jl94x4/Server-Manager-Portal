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
    plexUrl?: string | null;
    canPlay?: boolean;
    tagline?: string;
    studio?: string;
    directors?: string[];
    writers?: string[];
    cast?: Array<{ id: string; name: string; role: string; thumb?: string | null }>;
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

export type PlayerHome = {
    libraries: PlayerSection[];
    continueWatching: PlayerItem[];
    recentMovies: PlayerItem[];
    recentShows: PlayerItem[];
    recentMusic: PlayerItem[];
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
};

export type PlayerPlaySession = {
    sessionId: string;
    item: PlayerItem;
    src: string;
    offsetMs: number;
};
