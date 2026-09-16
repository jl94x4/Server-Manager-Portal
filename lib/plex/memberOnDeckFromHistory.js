/**
 * Continue Watching for shared Plex friends (not Plex Home profiles).
 * The owner token cannot switch into a friend's plex.tv account, but PMS
 * history is stored per local accountID and is readable with the server token.
 */

import { isPlexOwnerLocalAccountId } from './localAccountId.js';
import { historyItemWatchPercent } from '../profile/recentWatched.js';

const CONTINUE_MIN_PERCENT = 5;
const CONTINUE_MAX_PERCENT = 90;

const asList = (value) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
};

export const historyItemIsContinueWatching = (item = {}) => {
    const type = String(item?.type || '').toLowerCase();
    if (type !== 'movie' && type !== 'episode') return false;
    const pct = historyItemWatchPercent(item);
    if (pct != null) return pct >= CONTINUE_MIN_PERCENT && pct < CONTINUE_MAX_PERCENT;
    return Number(item?.viewOffset) > 0 && Number(item?.watchedStatus || 0) < 1;
};

export const continueWatchingHistoryKey = (item = {}) => {
    if (String(item?.type || '').toLowerCase() === 'episode') {
        const show = String(item.grandparentRatingKey || item.grandparentTitle || '').trim();
        if (show) return `show:${show}`;
    }
    return `item:${String(item.ratingKey || item.key || item.title || '').trim()}`;
};

export const pickContinueWatchingFromHistory = (items = [], { sectionKey, limit = 24 } = {}) => {
    const section = String(sectionKey || '').trim();
    const max = Math.min(24, Math.max(1, Number(limit) || 24));
    const picked = [];
    const seen = new Set();
    for (const item of asList(items)) {
        if (!item?.ratingKey) continue;
        if (section) {
            const sid = String(item.librarySectionID || '').trim();
            if (sid && sid !== section) continue;
        }
        const key = continueWatchingHistoryKey(item);
        if (!key || key === 'item:' || seen.has(key)) continue;
        seen.add(key);
        if (!historyItemIsContinueWatching(item)) continue;
        picked.push(item);
        if (picked.length >= max) break;
    }
    return picked;
};

export const fetchMemberOnDeckFromHistory = async ({
    uri,
    token,
    accountID,
    headers = {},
    fetchImpl = fetch,
    timeoutMs = 8000,
    containerSize = 80,
    sectionKey,
    limit = 24,
} = {}) => {
    const id = String(accountID || '').trim();
    const auth = String(token || '').trim();
    const base = String(uri || '').replace(/\/+$/, '');
    if (!id || !auth || !base || isPlexOwnerLocalAccountId(id)) return [];

    const params = new URLSearchParams({
        accountID: id,
        sort: 'viewedAt:desc',
        includeGuids: '1',
        'X-Plex-Container-Start': '0',
        'X-Plex-Container-Size': String(Math.min(200, Math.max(10, Number(containerSize) || 80))),
        'X-Plex-Token': auth,
    });
    const url = `${base}/status/sessions/history/all?${params.toString()}`;
    const extra = {};
    if (Number(timeoutMs) > 0 && typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        extra.signal = AbortSignal.timeout(Math.floor(Number(timeoutMs)));
    }
    const res = await fetchImpl(url, { headers, ...extra });
    if (!res?.ok) return [];
    const payload = await res.json().catch(() => null);
    return pickContinueWatchingFromHistory(asList(payload?.MediaContainer?.Metadata), { sectionKey, limit });
};
