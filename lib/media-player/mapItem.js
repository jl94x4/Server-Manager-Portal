import { extractTmdbIdFromPlexItem } from '../discovery-because-you-watched.js';

const asInt = (value) => {
    const next = Number(value);
    return Number.isFinite(next) ? next : null;
};

const asArray = (value) => {
    if (Array.isArray(value)) return value;
    if (value == null) return [];
    return [value];
};

/** Series TMDB id for TV seasons; otherwise the title's TMDB id. */
export const pickPlayerTmdbId = (meta = {}) => {
    const type = String(meta.type || '').toLowerCase();
    const source = {
        ...meta,
        type: type === 'season' ? 'episode' : type,
        Guid: asArray(meta.Guid),
    };
    const tmdbId = extractTmdbIdFromPlexItem(source);
    return Number.isFinite(tmdbId) && tmdbId > 0 ? tmdbId : null;
};

const mapPeople = (list, limit = 20) => {
    if (!Array.isArray(list)) return [];
    return list.slice(0, limit).map((row) => ({
        id: row?.id != null ? String(row.id) : String(row?.tag || ''),
        name: String(row?.tag || '').trim(),
        role: String(row?.role || '').trim(),
        thumb: row?.thumb || null,
    })).filter((row) => row.name);
};

/** Actor ids and names Plex will accept as `?actor=` filters. */
export const actorQueryValues = (actorId, name) => {
    const id = String(actorId || '').trim();
    const tag = String(name || '').trim();
    const values = [];
    if (id) values.push(id);
    if (tag && tag.toLowerCase() !== id.toLowerCase()) values.push(tag);
    return values;
};

export const pickPersonFromMetadata = (metas, { actorId, name } = {}) => {
    const wantId = String(actorId || '').trim();
    const wantName = String(name || '').trim().toLowerCase();
    let person = { id: wantId, name: name || wantId, thumb: null };
    for (const meta of Array.isArray(metas) ? metas : []) {
        for (const role of asArray(meta.Role)) {
            const id = role?.id != null ? String(role.id) : '';
            const tag = String(role?.tag || '').trim();
            const idMatch = wantId && (id === wantId || tag === wantId);
            const nameMatch = wantName && tag.toLowerCase() === wantName;
            if (!idMatch && !nameMatch) continue;
            person = {
                id: id || wantId || tag,
                name: tag || person.name,
                thumb: role.thumb || person.thumb,
            };
            if (person.thumb) return person;
        }
    }
    return person;
};

const mapTags = (list) => {
    if (!Array.isArray(list)) return [];
    return list.map((row) => String(row?.tag || '').trim()).filter(Boolean);
};

const STREAM_VIDEO = 1;
const STREAM_AUDIO = 2;
const STREAM_SUBTITLE = 3;

export const DEFAULT_PLAYER_QUALITY_ID = '1080-12';

export const PLAYER_QUALITY_PRESETS = [
    { id: '1080-20', label: '1080p · 20 Mbps', height: 1080, videoResolution: '1920x1080', maxVideoBitrate: 20000, videoQuality: 100 },
    { id: '1080-12', label: '1080p · 12 Mbps', height: 1080, videoResolution: '1920x1080', maxVideoBitrate: 12000, videoQuality: 90 },
    { id: '1080-8', label: '1080p · 8 Mbps', height: 1080, videoResolution: '1920x1080', maxVideoBitrate: 8000, videoQuality: 80 },
    { id: '720-4', label: '720p · 4 Mbps', height: 720, videoResolution: '1280x720', maxVideoBitrate: 4000, videoQuality: 70 },
    { id: '720-2', label: '720p · 2 Mbps', height: 720, videoResolution: '1280x720', maxVideoBitrate: 2000, videoQuality: 60 },
    { id: '480-1.5', label: '480p · 1.5 Mbps', height: 480, videoResolution: '854x480', maxVideoBitrate: 1500, videoQuality: 50 },
    { id: '360-0.7', label: '360p · 0.7 Mbps', height: 360, videoResolution: '640x360', maxVideoBitrate: 720, videoQuality: 40 },
];

const firstMedia = (meta) => asArray(meta?.Media)[0] || {};
const firstPart = (media) => asArray(media?.Part)[0] || {};
const mediaStreams = (meta) => asArray(firstPart(firstMedia(meta)).Stream);

const streamLabel = (stream, fallback) => {
    const display = String(stream?.displayTitle || stream?.extendedDisplayTitle || stream?.title || '').trim();
    if (display) return display;
    const language = String(stream?.language || stream?.languageTag || stream?.languageCode || '').trim();
    const codec = String(stream?.codec || '').trim().toUpperCase();
    return [language || fallback, codec].filter(Boolean).join(' · ') || fallback;
};

export const sourceVideoHeight = (meta = {}) => {
    const media = firstMedia(meta);
    const video = mediaStreams(meta).find((row) => Number(row?.streamType) === STREAM_VIDEO) || {};
    const height = asInt(video.height) || asInt(media.height);
    if (height) return height;
    const res = String(media.videoResolution || '').toLowerCase();
    if (res.includes('4k') || res.includes('2160')) return 2160;
    if (res.includes('1080')) return 1080;
    if (res.includes('720')) return 720;
    if (res.includes('480')) return 480;
    if (res.includes('576')) return 576;
    return 0;
};

export const mapPlayerAudioTracks = (meta = {}) => mediaStreams(meta)
    .filter((row) => Number(row?.streamType) === STREAM_AUDIO && row?.id != null)
    .map((row) => ({
        id: String(row.id),
        label: streamLabel(row, 'Audio'),
        language: String(row.language || row.languageTag || row.languageCode || '').trim() || null,
        codec: String(row.codec || '').trim() || null,
        channels: asInt(row.channels),
        selected: row.selected === true || row.selected === 1,
    }));

export const mapPlayerSubtitles = (meta = {}) => mediaStreams(meta)
    .filter((row) => Number(row?.streamType) === STREAM_SUBTITLE && row?.id != null)
    .map((row) => ({
        id: String(row.id),
        label: streamLabel(row, 'Subtitles'),
        language: String(row.language || row.languageTag || row.languageCode || '').trim() || null,
        codec: String(row.codec || '').trim() || null,
        forced: row.forced === true || row.forced === 1,
        selected: row.selected === true || row.selected === 1,
    }));

export const mapPlayerQualities = (meta = {}) => {
    const height = Math.min(sourceVideoHeight(meta) || 1080, 1080);
    const list = PLAYER_QUALITY_PRESETS.filter((row) => row.height <= height);
    return (list.length ? list : PLAYER_QUALITY_PRESETS.slice(-1)).map((row) => ({
        id: row.id,
        label: row.label,
        videoResolution: row.videoResolution,
        maxVideoBitrate: row.maxVideoBitrate,
        videoQuality: row.videoQuality,
    }));
};

export const isPlayerQualityId = (value) => PLAYER_QUALITY_PRESETS.some((row) => row.id === String(value || ''));

const toTranscodeAttempt = (row) => ({
    directPlay: '0',
    directStream: row.height >= 1080 ? '1' : '0',
    directStreamAudio: '1',
    videoCodec: 'h264',
    audioCodec: 'aac',
    videoResolution: row.videoResolution,
    maxVideoBitrate: String(row.maxVideoBitrate),
    videoQuality: String(row.videoQuality),
});

export const transcodeSettingsForQuality = (qualityId) => {
    const selected = PLAYER_QUALITY_PRESETS.find((row) => row.id === String(qualityId || ''))
        || PLAYER_QUALITY_PRESETS.find((row) => row.id === DEFAULT_PLAYER_QUALITY_ID);
    const fallback = PLAYER_QUALITY_PRESETS.find((row) => row.height < selected.height);
    return [selected, fallback].filter(Boolean).map(toTranscodeAttempt);
};

export const mapPlayerPlaybackOptions = (meta = {}) => {
    const qualities = mapPlayerQualities(meta);
    const audioTracks = mapPlayerAudioTracks(meta);
    const subtitles = mapPlayerSubtitles(meta);
    const preferredQuality = qualities.find((row) => row.id === DEFAULT_PLAYER_QUALITY_ID) || qualities[0] || null;
    const selectedAudio = audioTracks.find((row) => row.selected) || audioTracks[0] || null;
    const selectedSubtitle = subtitles.find((row) => row.selected) || null;
    return {
        qualities,
        qualityId: preferredQuality?.id || DEFAULT_PLAYER_QUALITY_ID,
        audioTracks,
        audioStreamId: selectedAudio?.id || null,
        subtitles,
        subtitleStreamId: selectedSubtitle?.id || null,
    };
};

export const buildPlayerHlsSrc = (ratingKey, {
    sessionId = '',
    offsetMs = 0,
    qualityId = '',
    audioStreamId = '',
    subtitleStreamId = '',
    resume = false,
} = {}) => {
    const qs = new URLSearchParams();
    if (isPlaySessionId(sessionId)) qs.set('session', String(sessionId));
    if (Number(offsetMs) > 0) qs.set('offset', String(Math.floor(Number(offsetMs))));
    if (resume) qs.set('resume', '1');
    if (isPlayerQualityId(qualityId)) qs.set('quality', String(qualityId));
    if (String(audioStreamId || '').replace(/\D/g, '')) qs.set('audioStreamID', String(audioStreamId).replace(/\D/g, ''));
    if (String(subtitleStreamId || '').replace(/\D/g, '')) qs.set('subtitleStreamID', String(subtitleStreamId).replace(/\D/g, ''));
    return `/api/media-player/hls/${encodeURIComponent(ratingKey)}/master.m3u8?${qs}`;
};

export const mapPlayerItem = (meta = {}, { serverIdentifier = '' } = {}) => {
    const type = String(meta.type || '');
    const ratingKey = String(meta.ratingKey || '').trim();
    const key = meta.key || (ratingKey ? `/library/metadata/${ratingKey}` : '');
    const plexUrl = serverIdentifier && key
        ? `https://app.plex.tv/desktop/#!/server/${serverIdentifier}/details?key=${encodeURIComponent(key)}`
        : null;
    const genres = mapTags(meta.Genre);
    const showTitle = type === 'season'
        ? (meta.parentTitle || meta.grandparentTitle || null)
        : (meta.grandparentTitle || null);
    const seasonTitle = type === 'episode'
        ? (meta.parentTitle || null)
        : (type === 'season' ? (meta.title || null) : null);
    return {
        ratingKey,
        title: meta.title || meta.grandparentTitle || 'Untitled',
        showTitle,
        seasonTitle,
        type,
        year: meta.year || null,
        summary: meta.summary || '',
        tagline: meta.tagline || '',
        studio: meta.studio || mapTags(meta.Studio)[0] || '',
        thumb: meta.thumb || meta.parentThumb || meta.grandparentThumb || null,
        art: meta.art || meta.grandparentArt || meta.parentArt || null,
        durationMs: asInt(meta.duration),
        viewOffsetMs: asInt(meta.viewOffset) || 0,
        index: asInt(meta.index),
        parentIndex: asInt(meta.parentIndex),
        leafCount: asInt(meta.leafCount),
        childCount: asInt(meta.childCount),
        parentRatingKey: meta.parentRatingKey ? String(meta.parentRatingKey) : null,
        grandparentRatingKey: meta.grandparentRatingKey ? String(meta.grandparentRatingKey) : null,
        contentRating: meta.contentRating || null,
        audienceRating: asInt(meta.audienceRating) || asInt(meta.rating),
        originallyAvailableAt: meta.originallyAvailableAt || null,
        tmdbId: pickPlayerTmdbId(meta),
        genres,
        directors: mapTags(meta.Director),
        writers: mapTags(meta.Writer),
        cast: mapPeople(meta.Role),
        addedAt: asInt(meta.addedAt),
        plexUrl,
        canPlay: type === 'movie' || type === 'episode',
    };
};

/** On Deck cards should look like library posters, not episode stills. */
export const mapContinueWatchingItem = (meta = {}, config = {}) => {
    const item = mapPlayerItem(meta, config);
    if (item.type !== 'episode') return item;
    return {
        ...item,
        title: meta.grandparentTitle || item.title,
        thumb: meta.grandparentThumb || meta.parentThumb || item.thumb,
    };
};

export const mapPlayerSection = (dir = {}) => ({
    key: String(dir.key || ''),
    title: dir.title || 'Library',
    type: dir.type || '',
    agent: dir.agent || '',
    thumb: dir.thumb || dir.composite || null,
});

export const isAllowedPlexProxyUrl = (target, plexOrigin) => {
    try {
        const origin = new URL(plexOrigin);
        const url = new URL(target, origin);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
        if (url.username || url.password) return false;
        if (url.hostname !== origin.hostname) return false;
        const originPort = origin.port || (origin.protocol === 'https:' ? '443' : '80');
        const urlPort = url.port || (url.protocol === 'https:' ? '443' : '80');
        return urlPort === originPort;
    } catch {
        return false;
    }
};

export const isHlsPlaylist = (body) => /^\s*#EXTM3U/m.test(String(body || ''));

export const clampPlayOffsetMs = (offsetMs, durationMs) => {
    const offset = Math.max(0, Number(offsetMs) || 0);
    const duration = Math.max(0, Number(durationMs) || 0);
    if (offset < 5000) return 0;
    if (duration && offset > Math.max(0, duration - 15000)) return 0;
    return Math.floor(offset);
};

export const rewritePlexUrlToOrigin = (target, plexOrigin, baseUrl = plexOrigin) => {
    const origin = new URL(plexOrigin);
    const url = new URL(target, baseUrl || plexOrigin);
    url.protocol = origin.protocol;
    url.host = origin.host;
    return stripPlexTokenFromUrl(url.toString());
};

export const stripPlexTokenFromUrl = (target) => {
    const url = new URL(target);
    url.searchParams.delete('X-Plex-Token');
    url.searchParams.delete('x-plex-token');
    return url.toString();
};

export const rewritePlaylistUrls = (body, plexOrigin, proxyPrefix, playlistUrl = plexOrigin) => {
    const baseUrl = playlistUrl || plexOrigin;
    const lines = String(body || '').split(/\r?\n/);
    return lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;
        if (trimmed.startsWith('#')) {
            return line.replace(/URI="([^"]+)"/gi, (_, uri) => {
                const absolute = rewritePlexUrlToOrigin(uri, plexOrigin, baseUrl);
                return `URI="${proxyPrefix}${encodeURIComponent(absolute)}"`;
            });
        }
        const absolute = rewritePlexUrlToOrigin(trimmed, plexOrigin, baseUrl);
        return `${proxyPrefix}${encodeURIComponent(absolute)}`;
    }).join('\n');
};

export const TIMELINE_STATES = new Set(['playing', 'paused', 'buffering', 'stopped']);

export const isPlaySessionId = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || '').trim());

export const buildPlexTimelineParams = ({
    ratingKey,
    state,
    timeMs = 0,
    durationMs = 0,
    sessionId = '',
} = {}) => {
    const params = new URLSearchParams({
        ratingKey: String(ratingKey || ''),
        key: `/library/metadata/${ratingKey}`,
        identifier: 'com.plexapp.plugins.library',
        state: TIMELINE_STATES.has(String(state || '')) ? String(state) : 'playing',
        time: String(Math.max(0, Math.floor(Number(timeMs) || 0))),
        duration: String(Math.max(0, Math.floor(Number(durationMs) || 0))),
        playbackTime: String(Math.max(0, Math.floor(Number(timeMs) || 0))),
        type: 'video',
        hasMDE: '1',
    });
    if (isPlaySessionId(sessionId)) params.set('X-Plex-Session-Identifier', String(sessionId));
    return params;
};
