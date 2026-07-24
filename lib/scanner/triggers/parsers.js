import path from 'path';
import { createRewriter } from '../rewrite.js';

const posixDir = (...parts) => {
    const joined = path.posix.join(...parts.map((p) => String(p || '').replace(/\\/g, '/')));
    return joined;
};

/**
 * @param {object} event Sonarr webhook body
 * @returns {string[]} folder paths (before rewrite)
 */
export const pathsFromSonarrEvent = (event) => {
    const type = String(event?.eventType || '');
    if (/^test$/i.test(type)) return [];

    const paths = [];
    if (/^(Download|EpisodeFileDelete)$/i.test(type)) {
        const rel = event?.episodeFile?.relativePath || event?.episodeFile?.RelativePath;
        const seriesPath = event?.series?.path || event?.series?.Path;
        if (!rel || !seriesPath) throw Object.assign(new Error('Required fields missing'), { status: 400 });
        paths.push(path.posix.dirname(posixDir(seriesPath, rel)));
    }
    if (/^SeriesDelete$/i.test(type)) {
        const seriesPath = event?.series?.path || event?.series?.Path;
        if (!seriesPath) throw Object.assign(new Error('Required fields missing'), { status: 400 });
        paths.push(String(seriesPath).replace(/\\/g, '/'));
    }
    if (/^Rename$/i.test(type)) {
        const seriesPath = event?.series?.path || event?.series?.Path;
        if (!seriesPath) throw Object.assign(new Error('Required fields missing'), { status: 400 });
        const renamed = event?.renamedEpisodeFiles || event?.RenamedEpisodeFiles || [];
        const seen = new Set();
        for (const file of renamed) {
            const previousPath = file.previousPath || file.PreviousPath;
            const relativePath = file.relativePath || file.RelativePath;
            if (previousPath) {
                const prev = path.posix.dirname(String(previousPath).replace(/\\/g, '/'));
                if (!seen.has(prev)) { seen.add(prev); paths.push(prev); }
            }
            if (relativePath) {
                const cur = path.posix.dirname(posixDir(seriesPath, relativePath));
                if (!seen.has(cur)) { seen.add(cur); paths.push(cur); }
            }
        }
    }
    return paths;
};

/**
 * @param {object} event Radarr webhook body
 */
export const pathsFromRadarrEvent = (event) => {
    const type = String(event?.eventType || '');
    if (/^test$/i.test(type)) return [];

    if (/^(Download|MovieFileDelete)$/i.test(type)) {
        const rel = event?.movieFile?.relativePath || event?.movieFile?.RelativePath;
        const folder = event?.movie?.folderPath || event?.movie?.FolderPath;
        if (!rel || !folder) throw Object.assign(new Error('Required fields missing'), { status: 400 });
        return [path.posix.dirname(posixDir(folder, rel))];
    }
    if (/^(MovieDelete|Rename)$/i.test(type)) {
        const folder = event?.movie?.folderPath || event?.movie?.FolderPath;
        if (!folder) throw Object.assign(new Error('Required fields missing'), { status: 400 });
        return [String(folder).replace(/\\/g, '/')];
    }
    return [];
};

/**
 * Lidarr webhook — mirror Autoscan: track folder from artist + track file.
 * @param {object} event
 */
export const pathsFromLidarrEvent = (event) => {
    const type = String(event?.eventType || '');
    if (/^test$/i.test(type)) return [];

    if (/^(Download|TrackFileDelete)$/i.test(type)) {
        const rel = event?.trackFile?.relativePath || event?.trackFile?.RelativePath;
        const artistPath = event?.artist?.path || event?.artist?.Path;
        if (!rel || !artistPath) throw Object.assign(new Error('Required fields missing'), { status: 400 });
        return [path.posix.dirname(posixDir(artistPath, rel))];
    }
    if (/^(ArtistDelete|Rename)$/i.test(type)) {
        const artistPath = event?.artist?.path || event?.artist?.Path;
        if (!artistPath) throw Object.assign(new Error('Required fields missing'), { status: 400 });
        return [String(artistPath).replace(/\\/g, '/')];
    }
    return [];
};

export const buildScansFromPaths = (paths, { priority = 0, source = 'trigger', rewrite = [] } = {}) => {
    const rewriter = createRewriter(rewrite);
    const now = new Date().toISOString();
    return (paths || [])
        .map((p) => String(p || '').trim())
        .filter(Boolean)
        .map((folder) => ({
            folder: rewriter(folder),
            priority: Number(priority) || 0,
            time: now,
            source,
        }));
};
