/** Decide Trakt scrobble calls from Plex session snapshots. */

const WATCHED_PROGRESS = 80;

const roundProgress = (value) => Math.round(Number(value) * 10) / 10;

export const traktScrobbleBody = (session) => {
    const progress = roundProgress(session?.progress);
    if (!Number.isFinite(progress)) return null;
    if (session?.type === 'movie') {
        if (!session.ids || !Object.keys(session.ids).length) return null;
        return { progress, movie: { ids: session.ids } };
    }
    if (session?.type !== 'episode') return null;
    if (!session.showIds || !Object.keys(session.showIds).length) return null;
    if (!Number.isFinite(Number(session.season)) || !Number.isFinite(Number(session.episode))) return null;
    return {
        progress,
        show: { ids: session.showIds },
        episode: { season: Number(session.season), number: Number(session.episode) },
    };
};

/**
 * @param {Record<string, object>} previous Last poll, keyed by session id
 * @param {Array<object>} current Sessions still playing for the linked Plex account
 */
export const planScrobbles = (previous, current) => {
    const prior = previous && typeof previous === 'object' ? previous : {};
    const actions = [];
    const next = {};
    const seen = new Set();

    for (const session of current || []) {
        const key = String(session?.sessionKey || '');
        if (!key || !traktScrobbleBody(session)) continue;
        seen.add(key);
        const prev = prior[key];
        const progress = roundProgress(session.progress);
        const playing = session.player !== 'paused';
        const baseline = Number.isFinite(prev?.lastSent) ? prev.lastSent : prev?.progress;
        let action = null;
        if (prev?.stopped) {
            action = null;
        } else if (!prev) {
            if (progress >= WATCHED_PROGRESS) action = 'stop';
            else action = playing ? 'start' : 'pause';
        } else if (!playing && prev.player !== 'paused') {
            action = 'pause';
        } else if (playing && prev.player === 'paused') {
            action = 'start';
        } else if (playing && progress >= WATCHED_PROGRESS && prev.progress < WATCHED_PROGRESS) {
            action = 'stop';
        } else if (playing && progress < WATCHED_PROGRESS && Math.abs(progress - baseline) >= 10) {
            action = 'start';
        }
        const sentNow = action === 'start' || action === 'stop';
        next[key] = {
            ...session,
            progress,
            player: playing ? 'playing' : 'paused',
            stopped: action === 'stop' || !!prev?.stopped,
            lastSent: sentNow || !Number.isFinite(prev?.lastSent) ? progress : prev.lastSent,
        };
        if (action) actions.push({ action, session: next[key] });
    }

    for (const [key, prev] of Object.entries(prior)) {
        if (seen.has(key) || prev?.stopped) continue;
        const action = prev.progress >= WATCHED_PROGRESS ? 'stop' : 'pause';
        actions.push({ action, session: prev });
    }

    return { actions, next };
};
