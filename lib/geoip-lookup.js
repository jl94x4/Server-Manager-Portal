/**
 * Approximate GeoIP lookup for remote stream player IPs.
 * Prefers Tautulli get_geoip_lookup when configured; falls back to ip-api.com.
 */

const CACHE_TTL_MS = 60 * 60 * 1000;
const geoCache = new Map();

const isPrivateOrLocalIp = (raw = '') => {
    const ip = String(raw || '').trim().replace(/^::ffff:/i, '');
    if (!ip || ip === 'Unknown IP' || ip === 'unknown') return true;
    if (ip === '::1' || ip === '0.0.0.0') return true;
    if (ip.startsWith('127.')) return true;
    if (ip.startsWith('10.')) return true;
    if (ip.startsWith('192.168.')) return true;
    if (ip.startsWith('169.254.')) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
    if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:')) return true;
    // Hostname / non-IP strings are not useful for GeoIP
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip) && !ip.includes(':')) return true;
    return false;
};

const buildLabel = ({ city, region, country }) => {
    const parts = [city, region, country].map((p) => String(p || '').trim()).filter(Boolean);
    return parts.length ? parts.join(', ') : null;
};

const normalizeGeo = (raw, source) => {
    const latitude = Number(raw?.latitude ?? raw?.lat);
    const longitude = Number(raw?.longitude ?? raw?.lon ?? raw?.lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    if (latitude === 0 && longitude === 0) return null;

    const city = raw?.city || null;
    const region = raw?.region || raw?.regionName || raw?.region_name || null;
    const country = raw?.country || raw?.country_name || raw?.code || null;
    const label = buildLabel({ city, region, country });
    if (!label) return null;

    return {
        city,
        region,
        country,
        latitude,
        longitude,
        label,
        source,
    };
};

/** @returns {{ hit: true, value: object|null } | { hit: false }} */
const getCached = (ip) => {
    const hit = geoCache.get(ip);
    if (!hit) return { hit: false };
    if (Date.now() - hit.at >= CACHE_TTL_MS) {
        geoCache.delete(ip);
        return { hit: false };
    }
    return { hit: true, value: hit.value };
};

const setCached = (ip, value) => {
    geoCache.set(ip, { at: Date.now(), value });
};

const lookupViaTautulli = async (config, ip, { fetchImpl, resolveUrl }) => {
    const base = resolveUrl?.(config.tautulliUrl) || String(config.tautulliUrl || '').trim().replace(/\/+$/, '');
    const apiKey = String(config.tautulliApiKey || '').trim();
    if (!base || !apiKey) return null;

    const url = `${base}/api/v2?apikey=${encodeURIComponent(apiKey)}&cmd=get_geoip_lookup&ip_address=${encodeURIComponent(ip)}`;
    const res = await fetchImpl(url, { headers: { Accept: 'application/json' } }, 8000);
    if (!res.ok) return null;
    const payload = await res.json().catch(() => null);
    if (payload?.response?.result !== 'success') return null;
    return normalizeGeo(payload.response.data || {}, 'tautulli');
};

const lookupViaIpApi = async (ip, { fetchImpl }) => {
    const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,city,regionName,country,lat,lon`;
    const res = await fetchImpl(url, { headers: { Accept: 'application/json' } }, 8000);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data || data.status !== 'success') return null;
    return normalizeGeo(data, 'ip-api');
};

/**
 * Resolve approximate geo for a public IP. Returns null for private/LAN/unknown.
 */
export const lookupGeoForIp = async (config, rawIp, {
    fetchImpl = globalThis.fetch,
    resolveUrl,
} = {}) => {
    const ip = String(rawIp || '').trim().replace(/^::ffff:/i, '');
    if (isPrivateOrLocalIp(ip)) return null;

    const cached = getCached(ip);
    if (cached.hit) return cached.value;

    let result = null;
    try {
        result = await lookupViaTautulli(config, ip, { fetchImpl, resolveUrl });
    } catch {
        result = null;
    }

    if (!result) {
        try {
            result = await lookupViaIpApi(ip, { fetchImpl });
        } catch {
            result = null;
        }
    }

    setCached(ip, result);
    return result;
};

/**
 * Attach `geo` onto session objects (admin remote public IPs only).
 * Mutates and returns the same array for convenience.
 */
export const enrichSessionsWithGeo = async (config, sessions, {
    isAdmin = false,
    fetchImpl = globalThis.fetch,
    resolveUrl,
} = {}) => {
    if (!isAdmin || !Array.isArray(sessions) || !sessions.length) return sessions || [];

    const uniqueIps = [...new Set(
        sessions
            .filter((s) => String(s?.sessionLocation || '').toLowerCase() !== 'lan')
            .map((s) => String(s?.playerAddress || '').trim())
            .filter((ip) => ip && !isPrivateOrLocalIp(ip)),
    )];

    const byIp = new Map();
    await Promise.all(uniqueIps.map(async (ip) => {
        const geo = await lookupGeoForIp(config, ip, { fetchImpl, resolveUrl });
        byIp.set(ip, geo);
    }));

    for (const session of sessions) {
        const ip = String(session?.playerAddress || '').trim();
        const isLan = String(session?.sessionLocation || '').toLowerCase() === 'lan';
        if (isLan || isPrivateOrLocalIp(ip)) {
            session.geo = null;
            continue;
        }
        session.geo = byIp.has(ip) ? byIp.get(ip) : null;
    }

    return sessions;
};

export const __geoipTestUtils = {
    isPrivateOrLocalIp,
    buildLabel,
    normalizeGeo,
};
