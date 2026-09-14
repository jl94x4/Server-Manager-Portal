const asInt = (value) => {
    const next = Number(value);
    return Number.isFinite(next) ? next : null;
};

export const mapPlayerItem = (meta = {}, { serverIdentifier = '' } = {}) => {
    const type = String(meta.type || '');
    const ratingKey = String(meta.ratingKey || '').trim();
    const key = meta.key || (ratingKey ? `/library/metadata/${ratingKey}` : '');
    const plexUrl = serverIdentifier && key
        ? `https://app.plex.tv/desktop/#!/server/${serverIdentifier}/details?key=${encodeURIComponent(key)}`
        : null;
    const genres = Array.isArray(meta.Genre)
        ? meta.Genre.map((row) => row?.tag).filter(Boolean)
        : [];
    return {
        ratingKey,
        title: meta.title || meta.grandparentTitle || 'Untitled',
        showTitle: meta.grandparentTitle || null,
        seasonTitle: meta.parentTitle || null,
        type,
        year: meta.year || null,
        summary: meta.summary || '',
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
        genres,
        addedAt: asInt(meta.addedAt),
        plexUrl,
        canPlay: type === 'movie' || type === 'episode',
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

export const rewritePlexUrlToOrigin = (target, plexOrigin) => {
    const origin = new URL(plexOrigin);
    const url = new URL(target, origin);
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

export const rewritePlaylistUrls = (body, plexOrigin, proxyPrefix) => {
    const lines = String(body || '').split(/\r?\n/);
    return lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;
        if (trimmed.startsWith('#')) {
            return line.replace(/URI="([^"]+)"/gi, (_, uri) => {
                const absolute = rewritePlexUrlToOrigin(uri, plexOrigin);
                return `URI="${proxyPrefix}${encodeURIComponent(absolute)}"`;
            });
        }
        const absolute = rewritePlexUrlToOrigin(trimmed, plexOrigin);
        return `${proxyPrefix}${encodeURIComponent(absolute)}`;
    }).join('\n');
};
