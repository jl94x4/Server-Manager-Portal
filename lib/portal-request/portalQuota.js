/**
 * Portal request quotas + auto-approve (Phase 8).
 * Global config fields — smaller than Seerr's full rules engine.
 */

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

export const getPortalRequestQuotaSettings = (config = {}) => ({
    limit: normalizeRequestQuotaLimit(config.requestQuotaLimit),
    days: normalizeRequestQuotaDays(config.requestQuotaDays),
    limit4k: normalizeRequestQuotaLimit(
        config.requestQuotaLimit4k != null ? config.requestQuotaLimit4k : config.requestQuotaLimit,
    ),
    autoApproveMovies: !!config.autoApproveMovies,
    autoApproveTv: !!config.autoApproveTv,
});

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

export const evaluatePortalMemberQuota = (config, records = [], { is4k = false } = {}) => {
    const settings = getPortalRequestQuotaSettings(config);
    const standardUsed = countPortalRequestsInWindow(records, { days: settings.days, is4k: false });
    const fourKUsed = countPortalRequestsInWindow(records, { days: settings.days, is4k: true });
    const standard = buildPortalQuotaBucket(settings.limit, settings.days, standardUsed);
    const fourK = buildPortalQuotaBucket(settings.limit4k, settings.days, fourKUsed);
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

export const shouldPortalAutoApprove = (config, mediaType) => {
    const settings = getPortalRequestQuotaSettings(config);
    if (mediaType === 'tv') return settings.autoApproveTv;
    return settings.autoApproveMovies;
};

export default {
    getPortalRequestQuotaSettings,
    evaluatePortalMemberQuota,
    shouldPortalAutoApprove,
};
