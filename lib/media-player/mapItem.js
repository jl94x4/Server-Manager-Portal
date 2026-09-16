/** Plex JSON → PlayerItem. Copy this file when splitting Media Player out of SMP. */
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

/** Relative PMS path only — strips server:// URIs used on smart collections. */
export const safePlexLibraryPath = (value) => {
    let raw = String(value || '').trim();
    const libraryIdx = raw.indexOf('/library/');
    const hubsIdx = raw.indexOf('/hubs/');
    const idx = libraryIdx >= 0 ? libraryIdx : hubsIdx;
    if (idx > 0) raw = raw.slice(idx);
    if (!raw.startsWith('/library/') && !raw.startsWith('/hubs/')) return '';
    if (raw.includes('\\') || raw.includes('..') || /^[a-z][a-z0-9+.-]*:/i.test(raw)) return '';
    return raw;
};

export const withPlexContainerParams = (path, token, { start = 0, size = 500 } = {}) => {
    const raw = String(path || '');
    const qIndex = raw.indexOf('?');
    const pathname = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
    const params = new URLSearchParams(qIndex >= 0 ? raw.slice(qIndex + 1) : '');
    params.set('X-Plex-Container-Start', String(Math.max(0, start)));
    params.set('X-Plex-Container-Size', String(Math.max(1, size)));
    if (token) params.set('X-Plex-Token', String(token));
    return `${pathname}?${params.toString()}`;
};

export const plexContainerItems = (payload) => {
    const mc = payload?.MediaContainer || {};
    const nested = asArray(mc.Metadata).flatMap((row) => [
        ...asArray(row?.Children?.Metadata),
        ...asArray(row?.Children?.Directory),
    ]);
    return [
        ...asArray(mc.Metadata),
        ...asArray(mc.Directory),
        ...asArray(mc.Hub).flatMap((hub) => [...asArray(hub?.Metadata), ...asArray(hub?.Directory)]),
        ...nested,
    ];
};

/** Movies/shows inside a collection — skip the collection row itself. */
export const collectionChildItems = (payload, collectionRatingKey = '') => {
    const want = String(collectionRatingKey || '');
    const seen = new Set();
    return plexContainerItems(payload).filter((row) => {
        const key = String(row?.ratingKey || '').trim();
        if (!key || seen.has(key)) return false;
        if (want && key === want) return false;
        if (String(row?.type || '').toLowerCase() === 'collection') return false;
        seen.add(key);
        return true;
    });
};

const childrenPathFromKey = (key) => {
    const path = safePlexLibraryPath(key);
    if (!path) return '';
    if (path.includes('?') || /\/(?:children|items)\/?$/i.test(path)) return path;
    return `${path.replace(/\/$/, '')}/children`;
};

export const collectionChildPaths = (meta = {}, ratingKey = '') => {
    const id = String(ratingKey || meta.ratingKey || '').trim();
    const sectionId = String(meta.librarySectionID || '').replace(/\D/g, '');
    const index = meta.index != null && String(meta.index).trim() !== '' ? String(meta.index).trim() : '';
    const paths = [];
    const add = (value) => {
        const next = String(value || '').trim();
        if (!next || paths.includes(next)) return;
        paths.push(next);
    };
    add(childrenPathFromKey(meta.key));
    if (id) {
        add(`/library/metadata/${id}/children`);
        add(`/library/collections/${id}/children`);
    }
    add(safePlexLibraryPath(meta.content));
    if (sectionId && id) add(`/library/sections/${sectionId}/all?collection=${encodeURIComponent(id)}`);
    if (sectionId && index && index !== id) add(`/library/sections/${sectionId}/all?collection=${encodeURIComponent(index)}`);
    return paths;
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

const LOGO_IMAGE_TYPES = new Set(['clearlogo', 'logo']);

export const pickPlayerLogo = (meta = {}) => {
    const images = asArray(meta.Image);
    for (const row of images) {
        const type = String(row?.type || '').toLowerCase();
        const alt = String(row?.alt || '').toLowerCase();
        const path = safePlexLibraryPath(row?.url || row?.key || '');
        if (!path) continue;
        if (LOGO_IMAGE_TYPES.has(type) || alt === 'clearlogo' || alt === 'logo' || path.toLowerCase().includes('/clearlogo')) {
            return path;
        }
    }
    const kind = String(meta.type || '');
    const ratingKey = String(meta.ratingKey || '').replace(/\D/g, '');
    if ((kind === 'movie' || kind === 'show') && ratingKey) {
        return `/library/metadata/${ratingKey}/clearLogo`;
    }
    const parentKey = String(meta.grandparentRatingKey || meta.parentRatingKey || '').replace(/\D/g, '');
    if ((kind === 'episode' || kind === 'season') && parentKey) {
        return `/library/metadata/${parentKey}/clearLogo`;
    }
    return null;
};

/** Plex theme audio is `/library/metadata/{id}/theme` — never a filesystem path. */
export const isPlayerThemePath = (value) => {
    const path = safePlexLibraryPath(value);
    const pathname = path.split('?')[0];
    return /^\/library\/metadata\/\d+\/theme$/i.test(pathname);
};

export const pickPlayerThemePath = (meta = {}) => {
    for (const value of [meta.theme, meta.grandparentTheme, meta.parentTheme]) {
        const path = safePlexLibraryPath(value);
        if (!isPlayerThemePath(path)) continue;
        const qIndex = path.indexOf('?');
        const pathname = qIndex >= 0 ? path.slice(0, qIndex) : path;
        const params = new URLSearchParams(qIndex >= 0 ? path.slice(qIndex + 1) : '');
        params.delete('X-Plex-Token');
        const qs = params.toString();
        return qs ? `${pathname}?${qs}` : pathname;
    }
    return '';
};

export const pickPlayerThemeKey = (meta = {}) => {
    const match = String(pickPlayerThemePath(meta) || '').match(/\/library\/metadata\/(\d+)\/theme/i);
    return match?.[1] || '';
};

export const buildPlayerThemeSrc = (ratingKey) => {
    const key = String(ratingKey || '').replace(/\D/g, '');
    return key ? `/api/media-player/theme/${encodeURIComponent(key)}` : '';
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

/** Studio ids and names Plex will accept as `?studio=` filters. */
export const studioQueryValues = (studioKey, name) => {
    const id = String(studioKey || '').trim();
    const tag = String(name || '').trim();
    const values = [];
    if (id) values.push(id);
    if (tag && tag.toLowerCase() !== id.toLowerCase()) values.push(tag);
    return values;
};

const studioKeyFromTag = (row = {}) => {
    const filter = String(row?.filter || '');
    const fromFilter = filter.match(/(?:^|[?&])(?:studio|network)=([^&]+)/i);
    if (fromFilter?.[1]) {
        try {
            return decodeURIComponent(fromFilter[1]);
        } catch {
            return fromFilter[1];
        }
    }
    if (row?.id != null && String(row.id).trim() !== '') return String(row.id);
    return String(row?.tag || row?.title || '').trim();
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

const collectionRatingKeyFromTag = (row = {}) => {
    const fromRatingKey = String(row?.ratingKey || '').replace(/\D/g, '');
    if (fromRatingKey) return fromRatingKey;
    const filter = String(row?.filter || '');
    const fromFilter = filter.match(/(?:^|[?&])collection=(\d+)/i);
    if (fromFilter?.[1]) return fromFilter[1];
    const fromPath = String(row?.key || '').match(/\/(?:collections|metadata)\/(\d+)/i);
    if (fromPath?.[1]) return fromPath[1];
    return String(row?.id || '').replace(/\D/g, '');
};

export const mapCollectionItems = (list) => {
    if (!Array.isArray(list)) return [];
    const seen = new Set();
    return list.map((row) => {
        const title = String(row?.tag || row?.title || '').trim();
        if (!title) return null;
        const ratingKey = collectionRatingKeyFromTag(row);
        const key = ratingKey || title.toLowerCase();
        if (seen.has(key)) return null;
        seen.add(key);
        return { ratingKey, title };
    }).filter(Boolean);
};

const fileNameOnly = (file) => {
    const raw = String(file || '').replace(/\\/g, '/');
    const base = raw.split('/').filter(Boolean).pop() || '';
    if (!base || base === '.' || base === '..') return '';
    return base;
};

const scoreNumber = (value) => {
    const next = Number(value);
    return Number.isFinite(next) ? next : null;
};

const toPercent = (value) => {
    const next = scoreNumber(value);
    if (next == null) return null;
    if (next <= 10) return Math.round(next * 10);
    return Math.round(next);
};

export const pickPlayerExternalIds = (meta = {}) => {
    const ids = { imdb: null, tmdb: pickPlayerTmdbId(meta), tvdb: null };
    const blobs = [meta.guid, ...asArray(meta.Guid).map((row) => row?.id || row)];
    for (const raw of blobs) {
        const id = String(raw || '');
        const imdb = id.match(/imdb:\/\/(tt\d+)/i);
        if (imdb) ids.imdb = imdb[1];
        const tvdb = id.match(/(?:thetvdb|tvdb):\/\/(\d+)/i);
        if (tvdb) ids.tvdb = tvdb[1];
    }
    return ids;
};

export const mapPlayerRatings = (meta = {}) => {
    const ids = pickPlayerExternalIds(meta);
    const out = {
        imdb: null,
        rottenTomatoes: null,
        popcorn: null,
        tmdb: null,
    };
    const take = (key, payload) => {
        if (out[key] || payload?.value == null) return;
        out[key] = payload;
    };
    for (const row of asArray(meta.Rating)) {
        const image = String(row?.image || '').toLowerCase();
        const value = scoreNumber(row?.value);
        if (value == null) continue;
        if (image.includes('imdb')) {
            take('imdb', { value, percent: toPercent(value), url: ids.imdb ? `https://www.imdb.com/title/${ids.imdb}/` : null });
        } else if (image.includes('themoviedb') || image.includes('tmdb')) {
            take('tmdb', {
                value,
                percent: toPercent(value),
                url: ids.tmdb ? `https://www.themoviedb.org/${String(meta.type || '') === 'show' ? 'tv' : 'movie'}/${ids.tmdb}` : null,
            });
        } else if (image.includes('rottentomatoes')) {
            if (image.includes('upright') || image.includes('spilled') || image.includes('popcorn') || row.type === 'audience') {
                take('popcorn', { value, percent: toPercent(value), fresh: image.includes('upright') || (!image.includes('spilled') && value >= 6) });
            } else {
                take('rottenTomatoes', { value, percent: toPercent(value), fresh: image.includes('ripe') || (!image.includes('rotten') && value >= 6) });
            }
        }
    }
    const ratingImage = String(meta.ratingImage || '').toLowerCase();
    const audienceImage = String(meta.audienceRatingImage || '').toLowerCase();
    if (ratingImage.includes('imdb')) {
        take('imdb', { value: scoreNumber(meta.rating), percent: toPercent(meta.rating), url: ids.imdb ? `https://www.imdb.com/title/${ids.imdb}/` : null });
    }
    if (audienceImage.includes('rottentomatoes') || audienceImage.includes('upright') || audienceImage.includes('popcorn')) {
        take('popcorn', { value: scoreNumber(meta.audienceRating), percent: toPercent(meta.audienceRating), fresh: !audienceImage.includes('spilled') });
    }
    if (ratingImage.includes('rottentomatoes')) {
        take('rottenTomatoes', { value: scoreNumber(meta.rating), percent: toPercent(meta.rating), fresh: ratingImage.includes('ripe') });
    }
    return out;
};

export const mapPlayerMediaInfo = (meta = {}) => asArray(meta.Media).map((media, mediaIndex) => {
    const parts = asArray(media.Part).map((part, partIndex) => {
        const streams = asArray(part.Stream);
        const video = streams.find((row) => Number(row?.streamType) === STREAM_VIDEO) || {};
        const audios = streams.filter((row) => Number(row?.streamType) === STREAM_AUDIO);
        const subs = streams.filter((row) => Number(row?.streamType) === STREAM_SUBTITLE);
        return {
            id: String(part.id || `${mediaIndex}-${partIndex}`),
            fileName: fileNameOnly(part.file),
            size: asInt(part.size),
            container: part.container || media.container || null,
            durationMs: asInt(part.duration) || asInt(media.duration),
            video: {
                codec: video.codec || media.videoCodec || null,
                bitrate: asInt(video.bitrate) || asInt(media.bitrate),
                width: asInt(video.width) || asInt(media.width),
                height: asInt(video.height) || asInt(media.height),
                resolution: media.videoResolution || null,
                frameRate: String(media.videoFrameRate || video.frameRate || '') || null,
                profile: video.profile || media.videoProfile || null,
                bitDepth: asInt(video.bitDepth),
                chromaLocation: video.chromaLocation || null,
                codedHeight: asInt(video.codedHeight),
                displayTitle: video.displayTitle || null,
                aspectRatio: media.aspectRatio != null ? String(media.aspectRatio) : null,
            },
            audio: audios.map((row) => ({
                codec: row.codec || null,
                channels: asInt(row.channels),
                language: row.language || row.languageTag || null,
                displayTitle: row.displayTitle || streamLabel(row, 'Audio'),
                bitrate: asInt(row.bitrate),
            })),
            subtitles: subs.map((row) => ({
                language: row.language || row.languageTag || null,
                codec: row.codec || null,
                displayTitle: row.displayTitle || streamLabel(row, 'Subtitles'),
                selected: row.selected === true || row.selected === 1,
            })),
        };
    });
    return {
        id: String(media.id || mediaIndex),
        container: media.container || null,
        bitrate: asInt(media.bitrate),
        width: asInt(media.width),
        height: asInt(media.height),
        videoResolution: media.videoResolution || null,
        videoCodec: media.videoCodec || null,
        audioCodec: media.audioCodec || null,
        audioChannels: asInt(media.audioChannels),
        durationMs: asInt(media.duration),
        parts,
    };
}).filter((row) => row.parts.length || row.videoCodec);

const markerType = (row = {}) => String(row?.type || row?.markerType || '').toLowerCase();

export const mapPlayerMarkers = (meta = {}) => {
    const out = { intro: null, credits: null };
    for (const row of asArray(meta.Marker)) {
        const startMs = asInt(row?.startTimeOffset);
        const endMs = asInt(row?.endTimeOffset);
        if (startMs == null || endMs == null || endMs <= startMs) continue;
        const type = markerType(row);
        const marker = { startMs, endMs };
        if ((type === 'intro' || type === 'introend') && !out.intro) out.intro = marker;
        if ((type === 'credits' || type === 'credit' || type === 'creditsend') && !out.credits) out.credits = marker;
    }
    return out;
};

export const mapPlayerVersions = (meta = {}) => asArray(meta.Media).map((media, mediaIndex) => {
    const part = asArray(media.Part)[0] || {};
    const height = asInt(media.height);
    const res = String(media.videoResolution || '').toLowerCase();
    let resolution = '';
    if (res.includes('4k') || res.includes('2160') || (height && height >= 2160)) resolution = '4K';
    else if (res.includes('1080') || (height && height >= 1080)) resolution = '1080p';
    else if (res.includes('720') || (height && height >= 720)) resolution = '720p';
    else if (res || height) resolution = res || `${height}p`;
    const codec = String(media.videoCodec || '').toUpperCase();
    const container = String(media.container || part.container || '').toUpperCase();
    const title = String(media.title || media.displayTitle || '').trim();
    const label = title || [resolution, codec, container].filter(Boolean).join(' · ') || `Version ${mediaIndex + 1}`;
    return {
        id: String(mediaIndex),
        mediaIndex,
        label,
        resolution: resolution || null,
        videoCodec: media.videoCodec || null,
        audioCodec: media.audioCodec || null,
        container: media.container || part.container || null,
        bitrate: asInt(media.bitrate),
        width: asInt(media.width),
        height,
    };
}).filter((row) => row.label);

export const pickMediaIndex = (value, meta = {}) => {
    const list = asArray(meta?.Media);
    if (!list.length) return 0;
    const next = Math.floor(Number(value));
    if (!Number.isFinite(next)) return 0;
    return Math.min(list.length - 1, Math.max(0, next));
};

export const withSelectedMedia = (meta = {}, mediaIndex = 0) => {
    const list = asArray(meta?.Media);
    if (!list.length) return meta;
    const idx = pickMediaIndex(mediaIndex, meta);
    return { ...meta, Media: [list[idx] || list[0]] };
};

export const itemIsWatched = (meta = {}) => {
    const type = String(meta.type || '');
    if (type === 'show' || type === 'season') {
        const leaf = asInt(meta.leafCount) || 0;
        const viewed = uniqueViewedLeafCount(meta);
        return leaf > 0 && viewed >= leaf;
    }
    return (asInt(meta.viewCount) || 0) > 0;
};

/** Unique watched episodes — never counts a rewatch, never exceeds the episode total. */
export const uniqueViewedLeafCount = (meta = {}) => {
    const leaf = Math.max(0, asInt(meta.leafCount) || 0);
    const unviewed = asInt(meta.unviewedLeafCount);
    if (unviewed != null) return Math.max(0, Math.min(leaf, leaf - Math.max(0, unviewed)));
    const viewed = asInt(meta.viewedLeafCount) || 0;
    return leaf > 0 ? Math.max(0, Math.min(leaf, viewed)) : Math.max(0, viewed);
};

export const mapPlayerFilterOptions = (payload) => asArray(payload?.MediaContainer?.Directory).map((dir) => ({
    key: String(dir?.key || dir?.id || dir?.tag || dir?.title || ''),
    title: String(dir?.title || dir?.tag || dir?.key || ''),
})).filter((row) => row.key);

export const mapPlayerPlaylist = (meta = {}, config = {}) => {
    const item = mapPlayerItem({ ...meta, type: 'playlist' }, config);
    return {
        ...item,
        playlistType: String(meta.playlistType || meta.type || 'video'),
        smart: meta.smart === true || Number(meta.smart) === 1,
        leafCount: asInt(meta.leafCount) || asInt(meta.size) || item.leafCount,
        canPlay: false,
    };
};

export const plexPlaylistUri = (serverIdentifier, ratingKey) => (
    `server://${serverIdentifier}/com.plexapp.plugins.library/library/metadata/${ratingKey}`
);

export const resolvePlayOffsetMs = (requested, fallback, durationMs) => {
    if (requested == null || requested === '') {
        return clampPlayOffsetMs(fallback, durationMs);
    }
    const n = Number(requested);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return clampPlayOffsetMs(n, durationMs);
};

export const mapPlayerItemDetails = (meta = {}, config = {}) => {
    const item = mapPlayerItem(meta, config);
    return {
        ...item,
        ratings: mapPlayerRatings(meta),
        mediaInfo: mapPlayerMediaInfo(meta),
        versions: mapPlayerVersions(meta),
        markers: mapPlayerMarkers(meta),
        externalIds: pickPlayerExternalIds(meta),
    };
};

const STREAM_VIDEO = 1;
const STREAM_AUDIO = 2;
const STREAM_SUBTITLE = 3;

export const DEFAULT_PLAYER_QUALITY_ID = '1080-12';
export const ORIGINAL_PLAYER_QUALITY_ID = 'original';

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

const BROWSER_DIRECT_CONTAINERS = new Set(['mp4', 'mov', 'm4v']);
const BROWSER_DIRECT_VIDEO = new Set(['h264', 'avc', 'avc1']);
const BROWSER_HEVC_VIDEO = new Set(['hevc', 'h265', 'hev1', 'hvc1']);
const BROWSER_DIRECT_AUDIO = new Set(['aac', 'mp3', 'mp4a']);
const BROWSER_AC3_AUDIO = new Set(['ac3', 'eac3', 'ac-3', 'ec-3']);
const NATIVE_DIRECT_CONTAINERS = new Set(['mp4', 'mov', 'm4v', 'mkv', 'webm']);
const NATIVE_DIRECT_VIDEO = new Set(['h264', 'avc', 'avc1', 'hevc', 'h265', 'hev1', 'hvc1', 'av1', 'vp9']);
const NATIVE_DIRECT_AUDIO = new Set([
    'aac', 'mp3', 'mp4a', 'ac3', 'eac3', 'ac-3', 'ec-3', 'flac', 'alac', 'opus',
    'dca', 'dts', 'truehd', 'dtsc', 'dtshd',
]);

export const sourceVideoCodec = (meta = {}) => {
    const media = firstMedia(meta);
    const video = mediaStreams(meta).find((row) => Number(row?.streamType) === STREAM_VIDEO) || {};
    return String(video.codec || media.videoCodec || '').toLowerCase();
};

export const isHevcVideo = (meta = {}) => BROWSER_HEVC_VIDEO.has(sourceVideoCodec(meta));

const codecSet = (raw, fallback) => {
    if (!Array.isArray(raw) || !raw.length) return new Set(fallback);
    const next = new Set();
    for (const value of raw.slice(0, 40)) {
        const id = String(value || '').trim().toLowerCase();
        if (id) next.add(id);
    }
    return next.size ? next : new Set(fallback);
};

const flagEnabled = (raw, keys, fallback) => {
    for (const key of keys) {
        const value = raw?.[key];
        if (value === true || value === 1 || value === '1' || value === 'true') return true;
        if (value === false || value === 0 || value === '0' || value === 'false') return false;
    }
    return fallback;
};

export const normalizePlaybackClient = (value) => {
    const raw = String(value || 'web').trim().toLowerCase();
    if (raw === 'android' || raw === 'ios') return raw;
    if (raw === 'native') return 'android';
    return 'web';
};

export const normalizePlaybackCaps = (raw = {}) => {
    const client = normalizePlaybackClient(raw.client || raw.platform);
    const native = client !== 'web';
    const allowHevc = flagEnabled(raw, ['canPlayHevc', 'allowHevc', 'hevc'], native);
    const allowAc3 = flagEnabled(raw, ['canPlayAc3', 'allowAc3', 'ac3'], native);
    const textSubtitles = flagEnabled(raw, ['textSubtitles', 'canPlayTextSubtitles', 'textSubs'], native);
    const containers = codecSet(raw.containers, native ? NATIVE_DIRECT_CONTAINERS : BROWSER_DIRECT_CONTAINERS);
    const videoCodecs = codecSet(raw.videoCodecs, native ? NATIVE_DIRECT_VIDEO : [
        ...BROWSER_DIRECT_VIDEO,
        ...(allowHevc ? BROWSER_HEVC_VIDEO : []),
    ]);
    const audioCodecs = codecSet(raw.audioCodecs, native ? NATIVE_DIRECT_AUDIO : [
        ...BROWSER_DIRECT_AUDIO,
        ...(allowAc3 ? BROWSER_AC3_AUDIO : []),
    ]);
    if (allowHevc) for (const id of BROWSER_HEVC_VIDEO) videoCodecs.add(id);
    else for (const id of BROWSER_HEVC_VIDEO) videoCodecs.delete(id);
    if (allowAc3) for (const id of BROWSER_AC3_AUDIO) audioCodecs.add(id);
    else for (const id of BROWSER_AC3_AUDIO) audioCodecs.delete(id);
    return {
        client,
        allowHevc,
        allowAc3,
        textSubtitles,
        containers,
        videoCodecs,
        audioCodecs,
        subtitleStreamId: String(raw.subtitleStreamId || ''),
    };
};

const IMAGE_SUBTITLE_CODECS = new Set(['pgs', 'vobsub', 'dvd', 'dvdsub', 'image', 'bluray', 'dvbsub', 'xsub']);

export const subtitleCodecNeedsBurn = (codec) => IMAGE_SUBTITLE_CODECS.has(String(codec || '').toLowerCase());

export const canHttpDirectPlay = (meta = {}, caps = {}) => {
    const profile = normalizePlaybackCaps(caps);
    const subId = String(profile.subtitleStreamId || caps.subtitleStreamId || '').replace(/\D/g, '');
    if (subId) {
        const sub = mediaStreams(meta).find((row) => String(row?.id || '') === subId);
        if (!profile.textSubtitles || subtitleCodecNeedsBurn(sub?.codec)) return false;
    }
    const media = firstMedia(meta);
    const part = firstPart(media);
    if (!String(part.id || '').replace(/\D/g, '')) return false;
    const container = String(part.container || media.container || '').toLowerCase();
    if (!profile.containers.has(container)) return false;
    const streams = mediaStreams(meta);
    const video = streams.find((row) => Number(row?.streamType) === STREAM_VIDEO) || {};
    const audio = streams.find((row) => Number(row?.streamType) === STREAM_AUDIO && (row.selected === true || row.selected === 1))
        || streams.find((row) => Number(row?.streamType) === STREAM_AUDIO)
        || {};
    const vcodec = String(video.codec || media.videoCodec || '').toLowerCase();
    const acodec = String(audio.codec || media.audioCodec || '').toLowerCase();
    if (vcodec && !profile.videoCodecs.has(vcodec)) return false;
    if (acodec && !profile.audioCodecs.has(acodec)) return false;
    return true;
};

export const pickPlayerPartId = (meta = {}) => String(firstPart(firstMedia(meta)).id || '').replace(/\D/g, '');

export const mapPlayerPlaybackSource = (meta = {}) => {
    const media = firstMedia(meta);
    const video = mediaStreams(meta).find((row) => Number(row?.streamType) === STREAM_VIDEO) || {};
    return {
        videoCodec: String(video.codec || media.videoCodec || '') || null,
        audioCodec: String(media.audioCodec || '') || null,
        container: String(media.container || firstPart(media).container || '') || null,
        height: asInt(video.height) || asInt(media.height),
        width: asInt(video.width) || asInt(media.width),
        videoResolution: media.videoResolution || null,
        bitrate: asInt(video.bitrate) || asInt(media.bitrate),
    };
};

export const mapPlayerPlaybackMode = ({ useDirectFile = false, copyOriginal = true, qualityId = '' } = {}) => {
    if (useDirectFile) return 'directPlay';
    if (String(qualityId) === ORIGINAL_PLAYER_QUALITY_ID && copyOriginal) return 'directStream';
    return 'transcode';
};

export const buildPlayerFileSrc = (ratingKey, opts = {}) => {
    const profile = normalizePlaybackCaps(opts);
    const qs = new URLSearchParams();
    if (isPlaySessionId(opts.sessionId)) qs.set('session', String(opts.sessionId));
    if (Number(opts.offsetMs) > 0) qs.set('offset', String(Math.floor(Number(opts.offsetMs))));
    if (profile.client !== 'web') qs.set('client', profile.client);
    if (profile.allowHevc) qs.set('hevc', '1');
    if (profile.allowAc3) qs.set('ac3', '1');
    if (profile.textSubtitles && profile.client !== 'web') qs.set('textSubs', '1');
    if (Number(opts.mediaIndex) > 0) qs.set('mediaIndex', String(Math.floor(Number(opts.mediaIndex))));
    return `/api/media-player/file/${encodeURIComponent(ratingKey)}?${qs}`;
};

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

const streamLanguageTag = (row) => (
    String(row?.languageTag || row?.languageCode || '').trim() || null
);

export const mapPlayerAudioTracks = (meta = {}) => mediaStreams(meta)
    .filter((row) => Number(row?.streamType) === STREAM_AUDIO && row?.id != null)
    .map((row) => ({
        id: String(row.id),
        label: streamLabel(row, 'Audio'),
        language: String(row.language || row.languageTag || row.languageCode || '').trim() || null,
        languageTag: streamLanguageTag(row),
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
        languageTag: streamLanguageTag(row),
        codec: String(row.codec || '').trim() || null,
        forced: row.forced === true || row.forced === 1,
        selected: row.selected === true || row.selected === 1,
    }));

export const mapPlayerQualities = (meta = {}) => {
    const height = Math.min(sourceVideoHeight(meta) || 1080, 1080);
    const list = PLAYER_QUALITY_PRESETS.filter((row) => row.height <= height);
    const transcode = (list.length ? list : PLAYER_QUALITY_PRESETS.slice(-1)).map((row) => ({
        id: row.id,
        label: row.label,
        videoResolution: row.videoResolution,
        maxVideoBitrate: row.maxVideoBitrate,
        videoQuality: row.videoQuality,
    }));
    return [
        { id: ORIGINAL_PLAYER_QUALITY_ID, label: 'Original', videoResolution: '', maxVideoBitrate: 0, videoQuality: 100 },
        ...transcode,
    ];
};

export const isPlayerQualityId = (value) => (
    String(value || '') === ORIGINAL_PLAYER_QUALITY_ID
    || PLAYER_QUALITY_PRESETS.some((row) => row.id === String(value || ''))
);

const toTranscodeAttempt = (row) => ({
    directPlay: '0',
    directStream: '0',
    directStreamAudio: '0',
    videoCodec: 'h264',
    audioCodec: 'aac',
    videoResolution: row.videoResolution,
    maxVideoBitrate: String(row.maxVideoBitrate),
    videoQuality: String(row.videoQuality),
});

export const transcodeSettingsForQuality = (qualityId) => {
    if (String(qualityId || '') === ORIGINAL_PLAYER_QUALITY_ID) {
        const fallback = PLAYER_QUALITY_PRESETS.find((row) => row.id === DEFAULT_PLAYER_QUALITY_ID);
        return [
            { copy: true, directPlay: '0', directStream: '1', directStreamAudio: '0', audioCodec: 'aac', maxAudioChannels: '2' },
            { copy: true, directPlay: '1', directStream: '1', directStreamAudio: '1' },
            fallback ? toTranscodeAttempt(fallback) : null,
        ].filter(Boolean);
    }
    const selected = PLAYER_QUALITY_PRESETS.find((row) => row.id === String(qualityId || ''))
        || PLAYER_QUALITY_PRESETS.find((row) => row.id === DEFAULT_PLAYER_QUALITY_ID);
    const fallback = PLAYER_QUALITY_PRESETS.find((row) => row.height < selected.height);
    return [selected, fallback].filter(Boolean).map(toTranscodeAttempt);
};

export const PLAYER_SUBTITLE_MODES = ['off', 'forced', 'always'];

export const DEFAULT_PLAYER_SETTINGS = {
    mixLibraries: false,
    autoplayNext: true,
    showContinueWatching: true,
    showPlaylists: true,
    defaultQualityId: 'auto',
    audioLanguage: '',
    subtitleMode: 'forced',
    autoSkipIntro: false,
    autoSkipCredits: false,
    playThemeTunes: true,
    homeRowOrder: [],
    libraryNavOrder: [],
};

export const PLAYER_HOME_ROW_IDS = ['continueWatching', 'recents', 'playlists'];
export const MIXED_RECENT_HOME_ROW_IDS = ['recent:movie', 'recent:show', 'recent:artist'];

export const isPlayerHomeRowId = (value) => {
    const id = String(value || '').trim();
    if (id === 'continueWatching' || id === 'recents' || id === 'playlists' || id === 'libraries') return true;
    return /^recent:[A-Za-z0-9._-]{1,64}$/.test(id);
};

export const isPlayerLibraryKey = (value) => /^[A-Za-z0-9._-]{1,64}$/.test(String(value || '').trim());

export const normalizeLibraryNavOrder = (raw) => {
    if (!Array.isArray(raw)) return [];
    const seen = new Set();
    const out = [];
    for (const value of raw) {
        const id = String(value || '').trim();
        if (!isPlayerLibraryKey(id) || seen.has(id)) continue;
        seen.add(id);
        out.push(id);
    }
    return out.slice(0, 40);
};

export const normalizeHomeRowOrder = (raw) => {
    if (!Array.isArray(raw)) return [];
    const seen = new Set();
    const out = [];
    for (const value of raw) {
        const id = String(value || '').trim();
        if (!isPlayerHomeRowId(id) || seen.has(id)) continue;
        seen.add(id);
        out.push(id);
    }
    return out.slice(0, 40);
};

export const libraryNavOrderFromHomeRows = (homeRowOrder) => {
    const mixed = new Set(MIXED_RECENT_HOME_ROW_IDS);
    const keys = [];
    for (const id of normalizeHomeRowOrder(homeRowOrder)) {
        if (!id.startsWith('recent:') || mixed.has(id)) continue;
        keys.push(id.slice('recent:'.length));
    }
    return normalizeLibraryNavOrder(keys);
};

export const collapseHomeRowOrder = (order) => {
    const seen = new Set();
    const out = [];
    for (const raw of normalizeHomeRowOrder(order)) {
        const id = raw.startsWith('recent:') ? 'recents' : raw === 'libraries' ? '' : raw;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push(id);
    }
    return out;
};

export const applyLibraryNavOrder = (libraries = [], order = []) => {
    const list = Array.isArray(libraries) ? libraries.filter((row) => row && String(row.key || '').trim()) : [];
    const byKey = new Map(list.map((row) => [String(row.key), row]));
    const seen = new Set();
    const out = [];
    for (const key of normalizeLibraryNavOrder(order)) {
        const row = byKey.get(key);
        if (!row || seen.has(key)) continue;
        seen.add(key);
        out.push(row);
    }
    for (const row of list) {
        const key = String(row.key);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(row);
    }
    return out;
};

export const applyHomeRowOrder = (ids = [], order = []) => {
    const wanted = [];
    const seenWanted = new Set();
    for (const value of ids) {
        const id = String(value || '').trim();
        if (!id || seenWanted.has(id)) continue;
        seenWanted.add(id);
        wanted.push(id);
    }
    const seen = new Set();
    const out = [];
    for (const id of collapseHomeRowOrder(order)) {
        if (!seenWanted.has(id) || seen.has(id)) continue;
        seen.add(id);
        out.push(id);
    }
    for (const id of wanted) {
        if (seen.has(id)) continue;
        out.push(id);
    }
    return out;
};

export const defaultHomeRowIds = () => [...PLAYER_HOME_ROW_IDS];

const AUDIO_LANGUAGE_ALIASES = {
    en: ['en', 'eng', 'english'],
    es: ['es', 'spa', 'spanish', 'español', 'espanol'],
    fr: ['fr', 'fra', 'fre', 'french', 'français', 'francais'],
    de: ['de', 'deu', 'ger', 'german', 'deutsch'],
    it: ['it', 'ita', 'italian', 'italiano'],
    pt: ['pt', 'por', 'portuguese', 'português', 'portugues'],
    ja: ['ja', 'jpn', 'japanese'],
    ko: ['ko', 'kor', 'korean'],
    zh: ['zh', 'chi', 'zho', 'cmn', 'yue', 'chinese', 'mandarin', 'cantonese'],
    ru: ['ru', 'rus', 'russian'],
    nl: ['nl', 'nld', 'dut', 'dutch', 'nederlands'],
    pl: ['pl', 'pol', 'polish', 'polski'],
    sv: ['sv', 'swe', 'swedish', 'svenska'],
    no: ['no', 'nor', 'nb', 'nn', 'norwegian', 'norsk'],
    da: ['da', 'dan', 'danish', 'dansk'],
    fi: ['fi', 'fin', 'finnish', 'suomi'],
    ar: ['ar', 'ara', 'arabic'],
    hi: ['hi', 'hin', 'hindi'],
    tr: ['tr', 'tur', 'turkish'],
    cs: ['cs', 'ces', 'cze', 'czech'],
    hu: ['hu', 'hun', 'hungarian'],
    th: ['th', 'tha', 'thai'],
    vi: ['vi', 'vie', 'vietnamese'],
    uk: ['uk', 'ukr', 'ukrainian'],
    el: ['el', 'ell', 'gre', 'greek'],
    he: ['he', 'heb', 'hebrew'],
    id: ['id', 'ind', 'indonesian'],
    ro: ['ro', 'ron', 'rum', 'romanian'],
};

const normalizeLang = (value) => String(value || '').trim().toLowerCase().replace(/_/g, '-');

export const playerLanguageMatches = (trackLanguage, preferred) => {
    const pref = normalizeLang(preferred);
    if (!pref) return false;
    const lang = normalizeLang(trackLanguage);
    if (!lang) return false;
    const prefBase = pref.split('-')[0];
    const langBase = lang.split('-')[0];
    if (lang === pref || langBase === prefBase) return true;
    const aliases = AUDIO_LANGUAGE_ALIASES[prefBase] || [prefBase];
    return aliases.includes(lang) || aliases.includes(langBase);
};

const trackMatchesLanguage = (track, preferred) => (
    playerLanguageMatches(track?.languageTag, preferred)
    || playerLanguageMatches(track?.language, preferred)
);

export const isPlayerDefaultQualityId = (value) => (
    String(value || '') === 'auto' || isPlayerQualityId(value)
);

export const normalizePlayerSettings = (raw = {}) => {
    const quality = String(raw.defaultQualityId || 'auto');
    const audioLanguage = normalizeLang(raw.audioLanguage);
    const subtitleMode = String(raw.subtitleMode || DEFAULT_PLAYER_SETTINGS.subtitleMode);
    return {
        mixLibraries: raw.mixLibraries === true,
        autoplayNext: raw.autoplayNext !== false,
        showContinueWatching: raw.showContinueWatching !== false,
        showPlaylists: raw.showPlaylists !== false,
        defaultQualityId: isPlayerDefaultQualityId(quality) ? quality : 'auto',
        audioLanguage: /^[a-z]{2}(?:-[a-z]{2})?$/.test(audioLanguage) ? audioLanguage : '',
        subtitleMode: PLAYER_SUBTITLE_MODES.includes(subtitleMode) ? subtitleMode : 'forced',
        autoSkipIntro: raw.autoSkipIntro === true,
        autoSkipCredits: raw.autoSkipCredits === true,
        playThemeTunes: raw.playThemeTunes !== false,
        homeRowOrder: collapseHomeRowOrder(raw.homeRowOrder),
        libraryNavOrder: normalizeLibraryNavOrder(
            Array.isArray(raw.libraryNavOrder) && raw.libraryNavOrder.length
                ? raw.libraryNavOrder
                : libraryNavOrderFromHomeRows(raw.homeRowOrder),
        ),
    };
};

export const pickPlayerAudioStreamId = (audioTracks = [], audioLanguage = '') => {
    const preferred = String(audioLanguage || '').trim();
    if (preferred) {
        const match = audioTracks.find((row) => trackMatchesLanguage(row, preferred));
        if (match?.id) return match.id;
    }
    return (audioTracks.find((row) => row.selected) || audioTracks[0] || null)?.id || null;
};

export const pickPlayerSubtitleStreamId = (subtitles = [], subtitleMode = 'forced', audioLanguage = '') => {
    const mode = PLAYER_SUBTITLE_MODES.includes(String(subtitleMode || '')) ? String(subtitleMode) : 'forced';
    if (mode === 'off' || !subtitles.length) return null;
    const langMatch = (row) => !audioLanguage || trackMatchesLanguage(row, audioLanguage);
    if (mode === 'forced') {
        return (subtitles.find((row) => row.forced && langMatch(row))
            || subtitles.find((row) => row.forced)
            || null)?.id || null;
    }
    return (subtitles.find((row) => !row.forced && langMatch(row))
        || subtitles.find((row) => langMatch(row))
        || subtitles.find((row) => row.selected)
        || subtitles[0]
        || null)?.id || null;
};

export const mapPlayerPlaybackOptions = (meta = {}, prefs = {}) => {
    const qualities = mapPlayerQualities(meta);
    const audioTracks = mapPlayerAudioTracks(meta);
    const subtitles = mapPlayerSubtitles(meta);
    const settings = normalizePlayerSettings(prefs);
    const preferredQuality = qualities.find((row) => row.id === ORIGINAL_PLAYER_QUALITY_ID)
        || qualities.find((row) => row.id === DEFAULT_PLAYER_QUALITY_ID)
        || qualities[0]
        || null;
    return {
        qualities,
        qualityId: preferredQuality?.id || DEFAULT_PLAYER_QUALITY_ID,
        audioTracks,
        audioStreamId: pickPlayerAudioStreamId(audioTracks, settings.audioLanguage),
        subtitles,
        subtitleStreamId: pickPlayerSubtitleStreamId(subtitles, settings.subtitleMode, settings.audioLanguage),
    };
};

export const buildPlayerHlsSrc = (ratingKey, {
    sessionId = '',
    offsetMs = 0,
    qualityId = '',
    audioStreamId = '',
    subtitleStreamId = '',
    resume = false,
    copy = true,
    mediaIndex = 0,
} = {}) => {
    const qs = new URLSearchParams();
    if (isPlaySessionId(sessionId)) qs.set('session', String(sessionId));
    if (Number(offsetMs) > 0) qs.set('offset', String(Math.floor(Number(offsetMs))));
    if (resume) qs.set('resume', '1');
    if (isPlayerQualityId(qualityId)) qs.set('quality', String(qualityId));
    if (copy === false) qs.set('copy', '0');
    if (Number(mediaIndex) > 0) qs.set('mediaIndex', String(Math.floor(Number(mediaIndex))));
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
    const studioTag = asArray(meta.Studio)[0] || asArray(meta.Network)[0];
    const studioName = meta.studio || mapTags(meta.Studio)[0] || mapTags(meta.Network)[0] || '';
    const studioKey = studioKeyFromTag(studioTag) || studioName;
    const librarySectionID = String(meta.librarySectionID || '').replace(/\D/g, '') || null;
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
        studio: studioName,
        studioKey,
        thumb: meta.thumb || meta.parentThumb || meta.grandparentThumb || null,
        art: meta.art || meta.grandparentArt || meta.parentArt || null,
        logo: pickPlayerLogo(meta),
        themeKey: pickPlayerThemeKey(meta),
        durationMs: asInt(meta.duration),
        viewOffsetMs: asInt(meta.viewOffset) || 0,
        index: asInt(meta.index),
        parentIndex: asInt(meta.parentIndex),
        leafCount: asInt(meta.leafCount),
        childCount: asInt(meta.childCount),
        parentRatingKey: meta.parentRatingKey ? String(meta.parentRatingKey) : null,
        grandparentRatingKey: meta.grandparentRatingKey ? String(meta.grandparentRatingKey) : null,
        librarySectionID,
        contentRating: meta.contentRating || null,
        audienceRating: asInt(meta.audienceRating) || asInt(meta.rating),
        originallyAvailableAt: meta.originallyAvailableAt || null,
        tmdbId: pickPlayerTmdbId(meta),
        genres,
        countries: mapTags(meta.Country),
        collections: mapTags(meta.Collection),
        collectionItems: mapCollectionItems(meta.Collection),
        directors: mapTags(meta.Director),
        writers: mapTags(meta.Writer),
        directorPeople: mapPeople(meta.Director, 8),
        writerPeople: mapPeople(meta.Writer, 8),
        producers: mapPeople(meta.Producer, 8),
        cast: mapPeople(meta.Role),
        addedAt: asInt(meta.addedAt),
        lastViewedAt: asInt(meta.lastViewedAt),
        viewedLeafCount: uniqueViewedLeafCount(meta),
        extraType: meta.extraType != null ? String(meta.extraType) : null,
        extraSubtype: meta.subtype ? String(meta.subtype) : null,
        viewCount: asInt(meta.viewCount) || 0,
        watched: itemIsWatched(meta),
        plexUrl,
        canPlay: type === 'movie' || type === 'episode' || type === 'show' || type === 'season' || type === 'clip',
    };
};

export const mapPlayerHubs = (hubs = [], config = {}) => asArray(hubs)
    .map((hub) => ({
        title: String(hub?.title || hub?.hubIdentifier || 'Related'),
        identifier: String(hub?.hubIdentifier || hub?.key || hub?.title || ''),
        items: asArray(hub?.Metadata).map((row) => mapPlayerItem(row, config)).filter((row) => row.ratingKey),
    }))
    .filter((hub) => hub.items.length);

export const collectionRatingKeyFromHub = (hub = {}) => {
    const blob = [hub.key, hub.hubKey, hub.hubIdentifier].map((value) => String(value || '')).join(' ');
    if (!/collection/i.test(blob)) return '';
    const match = blob.match(/\/library\/collections\/(\d+)/i)
        || blob.match(/collection[./_-](\d+)/i);
    return match?.[1] || '';
};

export const playlistRatingKeyFromHub = (hub = {}) => {
    const blob = [hub.key, hub.hubKey, hub.hubIdentifier, hub.type].map((value) => String(value || '')).join(' ');
    if (!/playlist/i.test(blob)) return '';
    const match = blob.match(/\/playlists\/(\d+)/i);
    return match?.[1] || '';
};

export const mapPlayerHomeHubs = (hubs = [], config = {}) => {
    const seen = new Set();
    const out = [];
    for (const hub of asArray(hubs)) {
        const identifier = String(hub?.hubIdentifier || hub?.key || hub?.title || '').trim();
        if (!identifier || seen.has(identifier)) continue;
        const items = asArray(hub?.Metadata)
            .map((meta) => mapLibraryHubItem(meta, hub, config))
            .filter((row) => row.ratingKey);
        if (!items.length) continue;
        seen.add(identifier);
        out.push({
            title: String(hub?.title || identifier || 'Hub'),
            identifier,
            items: items.slice(0, 24),
            collectionRatingKey: collectionRatingKeyFromHub(hub) || null,
            playlistRatingKey: playlistRatingKeyFromHub(hub) || null,
        });
    }
    return out;
};

export const mapPlayerExtras = (list = [], config = {}) => asArray(list)
    .map((meta) => mapPlayerItem({ ...meta, type: meta.type || 'clip' }, config))
    .filter((row) => row.ratingKey);

/** Recently Added TV should show the series, not the new episode still. */
export const mapRecentlyAddedItem = (meta = {}, section = {}, config = {}) => {
    if (section?.type === 'show' || meta.type === 'episode' || meta.type === 'season') {
        return mapPlayerItem({
            ...meta,
            ratingKey: meta.grandparentRatingKey || meta.parentRatingKey || meta.ratingKey,
            title: meta.grandparentTitle || meta.parentTitle || meta.title,
            thumb: meta.grandparentThumb || meta.parentThumb || meta.thumb,
            type: 'show',
        }, config);
    }
    if (section?.type === 'movie') {
        return mapPlayerItem({ ...meta, type: 'movie' }, config);
    }
    return mapPlayerItem(meta, config);
};

export const isLibraryContinueWatchingHub = (hub = {}) => {
    const blob = [
        hub.hubIdentifier,
        hub.identifier,
        hub.context,
        hub.title,
        hub.key,
        hub.hubKey,
    ].map((value) => String(value || '')).join(' ');
    return /continue\s*watch|ondeck|on[.\s_-]?deck|in[.\s_-]?progress/i.test(blob);
};

export const dedupeLibraryContinueWatchingHubs = (hubs = []) => {
    let keptContinue = false;
    return (Array.isArray(hubs) ? hubs : []).filter((hub) => {
        if (!isLibraryContinueWatchingHub(hub)) return true;
        if (keptContinue) return false;
        keptContinue = true;
        return true;
    });
};

export const mapLibraryHubItem = (meta = {}, hub = {}, config = {}) => {
    const ident = String(hub.hubIdentifier || hub.context || hub.key || '');
    if (meta.type === 'episode' && /ondeck|continue/i.test(ident)) {
        return mapContinueWatchingItem(meta, config);
    }
    if ((meta.type === 'episode' || meta.type === 'season') && /recent/i.test(ident)) {
        return mapRecentlyAddedItem(meta, { type: 'show' }, config);
    }
    return mapPlayerItem(meta, config);
};

export const PLAYER_LIBRARY_SORT_IDS = new Set([
    'addedAt:desc',
    'titleSort',
    'titleSort:desc',
    'year:desc',
    'originallyAvailableAt:desc',
    'audienceRating:desc',
    'lastViewedAt:desc',
    'viewCount:desc',
    'random',
]);

export const nextEpisodeInList = (episodes = [], currentRatingKey = '') => {
    const current = String(currentRatingKey || '');
    const idx = (Array.isArray(episodes) ? episodes : []).findIndex((row) => String(row?.ratingKey || '') === current);
    if (idx < 0) return null;
    return episodes[idx + 1] || null;
};

export const previousEpisodeInList = (episodes = [], currentRatingKey = '') => {
    const current = String(currentRatingKey || '');
    const idx = (Array.isArray(episodes) ? episodes : []).findIndex((row) => String(row?.ratingKey || '') === current);
    if (idx <= 0) return null;
    return episodes[idx - 1] || null;
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

const PLAYER_AVATAR_HOSTS = new Set([
    'plex.tv',
    'www.plex.tv',
    'gravatar.com',
    'www.gravatar.com',
]);

/** Public or portal-proxied avatar only — never a Plex token URL. */
export const safePlayerAvatarUrl = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (raw.startsWith('/api/plex/image') || raw.startsWith('/api/jellyfin/user-image')) return raw;
    try {
        const url = new URL(raw);
        if (url.protocol !== 'https:') return '';
        const host = url.hostname.toLowerCase();
        if (PLAYER_AVATAR_HOSTS.has(host) || host.endsWith('.plex.tv')) {
            url.searchParams.delete('X-Plex-Token');
            url.hash = '';
            return url.toString();
        }
    } catch {
        /* relative library path */
    }
    const path = safePlexLibraryPath(raw);
    if (!path) return '';
    const pathname = path.split('?')[0];
    return `/api/plex/image?path=${encodeURIComponent(pathname)}&width=160&height=160`;
};

export const mapPlayerProfile = (raw = {}) => {
    const username = String(raw.username || raw.title || raw.name || '').trim();
    return {
        username,
        thumb: safePlayerAvatarUrl(raw.thumb) || null,
    };
};

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
    audioStreamId = '',
    subtitleStreamId = '',
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
    const audioId = String(audioStreamId || '').replace(/\D/g, '');
    if (audioId) params.set('audioStreamID', audioId);
    params.set('subtitleStreamID', String(subtitleStreamId || '').replace(/\D/g, '') || '0');
    return params;
};
