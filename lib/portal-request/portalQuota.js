/**
 * Portal request quotas + auto-approve (Phase 8 + Seerr parity).
 * Global config fields — smaller than Seerr's full rules engine.
 * Per-user limits come from resolveMemberRequestPolicy → passed as `policy`.
 */

import { getPortalRequestDefaults, shouldPortalAutoApprove as shouldAutoApproveFromDefaults } from './portalRequestDefaults.js';

export const normalizeRequestQuotaLimit = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(1000, Math.floor(n));
};

export const normalizeRequestQuotaDays = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 1) return 7;
    return Math.min(365, Math.floor(n));
};

export const getPortalRequestQuotaSettings = (config = {}) => {
    const defaults = getPortalRequestDefaults(config);
    return {
        limit: defaults.movieQuotaLimit,
        days: defaults.movieQuotaDays,
        limit4k: defaults.fourKQuotaLimit,
        autoApproveMovies: defaults.autoApproveMovies,
        autoApproveTv: defaults.autoApproveTv,
        autoApproveMovies4k: defaults.autoApproveMovies4k,
        autoApproveTv4k: defaults.autoApproveTv4k,
    };
};

const withinWindow = (iso, days) => {
    const ts = Date.parse(iso || '');
    if (!Number.isFinite(ts)) return false;
    const windowMs = Math.max(1, days) * 24 * 60 * 60 * 1000;
    return Date.now() - ts <= windowMs;
};

/**
 * Count portal requests in the rolling window for quota.
 * Declined requests do not consume quota.
 */
export const countPortalRequestsInWindow = (records = [], { days = 7, is4k = null } = {}) => {
    let used = 0;
    for (const record of records) {
        if (Number(record?.status) === 3) continue; // declined
        if (!withinWindow(record?.createdAt, days)) continue;
        if (is4k === true && !record?.is4k) continue;
        if (is4k === false && record?.is4k) continue;
        used += 1;
    }
    return used;
};

export const buildPortalQuotaBucket = (limit, days, used) => {
    const safeLimit = normalizeRequestQuotaLimit(limit);
    const safeDays = normalizeRequestQuotaDays(days);
    const safeUsed = Math.max(0, Number(used) || 0);
    if (safeLimit <= 0) {
        return {
            limit: 0,
            days: safeDays,
            used: safeUsed,
            remaining: null,
        };
    }
    return {
        limit: safeLimit,
        days: safeDays,
        used: safeUsed,
        remaining: Math.max(0, safeLimit - safeUsed),
    };
};

/**
 * @param {object} config
 * @param {object[]} records
 * @param {object} [opts]
 * @param {boolean} [opts.is4k]
 * @param {object} [opts.policy] from resolveMemberRequestPolicy
 * @param {'movie'|'tv'} [opts.mediaType] when set, use movie vs tv quota limits from policy
 */
export const evaluatePortalMemberQuota = (config, records = [], { is4k = false, policy = null, mediaType = null } = {}) => {
    const settings = getPortalRequestQuotaSettings(config);
    const effective = policy || getPortalRequestDefaults(config);
    const type = mediaType === 'tv' ? 'tv' : 'movie';

    const standardLimit = type === 'tv'
        ? (effective.tvQuotaLimit ?? settings.limit)
        : (effective.movieQuotaLimit ?? settings.limit);
    const standardDays = type === 'tv'
        ? (effective.tvQuotaDays ?? settings.days)
        : (effective.movieQuotaDays ?? settings.days);
    const fourKLimit = effective.fourKQuotaLimit ?? settings.limit4k;
    const fourKDays = effective.fourKQuotaDays ?? settings.days;

    const standardUsed = countPortalRequestsInWindow(records, { days: standardDays, is4k: false });
    const fourKUsed = countPortalRequestsInWindow(records, { days: fourKDays, is4k: true });
    const standard = buildPortalQuotaBucket(standardLimit, standardDays, standardUsed);
    const fourK = buildPortalQuotaBucket(fourKLimit, fourKDays, fourKUsed);
    const standardBlocked = standard.limit > 0 && standard.remaining === 0;
    const fourKBlocked = fourK.limit > 0 && fourK.remaining === 0;
    return {
        settings,
        quota: { standard, fourK },
        standardQuotaBlocked: standardBlocked,
        fourKQuotaBlocked: fourKBlocked,
        blocked: is4k ? fourKBlocked : standardBlocked,
    };
};

export const shouldPortalAutoApprove = (config, mediaType, opts = {}) => (
    shouldAutoApproveFromDefaults(config, mediaType, opts)
);

export default {
    getPortalRequestQuotaSettings,
    evaluatePortalMemberQuota,
    shouldPortalAutoApprove,
};
