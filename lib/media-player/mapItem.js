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
