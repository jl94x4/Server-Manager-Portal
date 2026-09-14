/**
 * Roll watch-history rows for a single library title into stats, users, and charts.
 */

const unixSeconds = (value) => {
    const raw = Number(value) || 0;
    if (raw <= 0) return 0;
    return raw > 9999999999 ? Math.round(raw / 1000) : raw;
};

const platformLabel = (row) => {
    const platform = String(row?.platform || '').trim();
    if (platform) return platform;
    const player = String(row?.player || '').trim();
    if (player) return player;
    return 'Unknown';
};

export const rollupPlatformPlays = (rows = [], { limit = 8 } = {}) => {
    const counts = new Map();
    for (const row of Array.isArray(rows) ? rows : []) {
        if (!row) continue;
        const label = platformLabel(row);
        counts.set(label, (counts.get(label) || 0) + 1);
    }
    const ranked = [...counts.entries()]
        .map(([platform, plays]) => ({ platform, plays }))
        .sort((a, b) => b.plays - a.plays || a.platform.localeCompare(b.platform));
    if (ranked.length <= limit) return ranked;
    const head = ranked.slice(0, limit);
    const otherPlays = ranked.slice(limit).reduce((sum, row) => sum + row.plays, 0);
    if (otherPlays) head.push({ platform: 'Other', plays: otherPlays });
    return head;
};

export const aggregateTitleHistory = (rows = []) => {
    const usersMap = new Map();
    const byMonth = new Map();
    const byHour = Array.from({ length: 24 }, () => 0);
    let totalSeconds = 0;
    let lastWatchedAt = 0;

    for (const row of Array.isArray(rows) ? rows : []) {
        if (!row) continue;
        const user = String(row.user || 'Unknown').trim() || 'Unknown';
        const date = unixSeconds(row.date);
        const duration = Math.max(0, Number(row.duration) || 0);
        totalSeconds += duration;
        if (date > lastWatchedAt) lastWatchedAt = date;

        const entry = usersMap.get(user.toLowerCase()) || {
            user,
            userThumb: row.userThumb || null,
            plays: 0,
            totalSeconds: 0,
            lastWatchedAt: 0,
        };
        entry.plays += 1;
        entry.totalSeconds += duration;
        if (date >= entry.lastWatchedAt) {
            entry.lastWatchedAt = date;
            entry.user = user;
            if (row.userThumb) entry.userThumb = row.userThumb;
        }
        usersMap.set(user.toLowerCase(), entry);

        if (date) {
            const d = new Date(date * 1000);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            byMonth.set(key, (byMonth.get(key) || 0) + 1);
            byHour[d.getHours()] += 1;
        }
    }

    return {
        stats: {
            plays: Array.isArray(rows) ? rows.length : 0,
            uniqueUsers: usersMap.size,
            totalSeconds,
            lastWatchedAt: lastWatchedAt || null,
        },
        users: [...usersMap.values()].sort((a, b) => b.plays - a.plays || b.lastWatchedAt - a.lastWatchedAt),
        byMonth: [...byMonth.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([month, plays]) => ({ month, plays })),
        byHour: byHour.map((plays, hour) => ({ hour, plays })),
        byPlatform: rollupPlatformPlays(rows),
    };
};
