/**
 * Plex Home profile list + switch helpers (Who's watching?).
 * Managed Home users have no plex.tv login; apps switch after the owner authenticates.
 */

const truthy = (value) => {
    if (value === true || value === 1) return true;
    const raw = String(value || '').trim().toLowerCase();
    return raw === '1' || raw === 'true' || raw === 'yes';
};

const firstAttr = (attrs, names) => {
    for (const name of names) {
        if (attrs[name] != null && String(attrs[name]).trim() !== '') return attrs[name];
    }
    return null;
};

const parseXmlAttributes = (tag) => {
    const attrs = {};
    const re = /([A-Za-z_:][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let match;
    while ((match = re.exec(String(tag || '')))) {
        attrs[match[1]] = match[3] != null ? match[3] : match[4];
    }
    return attrs;
};

export const normalizePlexHomeUser = (raw = {}) => {
    if (!raw || typeof raw !== 'object') return null;
    const id = firstAttr(raw, ['id', 'userID', 'userId']);
    if (id == null || String(id).trim() === '') return null;
    const title = String(
        firstAttr(raw, ['title', 'friendlyName', 'username', 'name']) || 'Plex User',
    ).trim();
    return {
        id: String(id).trim(),
        uuid: raw.uuid ? String(raw.uuid).trim() : '',
        title,
        username: String(raw.username || '').trim(),
        email: String(raw.email || '').trim(),
        thumb: String(raw.thumb || raw.avatar || '').trim() || null,
        restricted: truthy(raw.restricted),
        admin: truthy(raw.admin),
        guest: truthy(raw.guest),
        protected: truthy(raw.protected) || truthy(raw.hasPassword),
    };
};

export const toPublicPlexHomeUser = (user) => {
    if (!user) return null;
    return {
        id: user.id,
        uuid: user.uuid || '',
        title: user.title,
        thumb: user.thumb,
        restricted: !!user.restricted,
        admin: !!user.admin,
        protected: !!user.protected,
    };
};

const asUserList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
};

export const parsePlexHomeUsers = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) {
        return payload.map(normalizePlexHomeUser).filter(Boolean);
    }
    if (typeof payload !== 'object') return [];

    const candidates = [
        payload.users,
        payload.User,
        payload.user,
        payload.MediaContainer?.User,
        payload.MediaContainer?.user,
        payload.MediaContainer?.users,
        payload.mediaContainer?.User,
    ];
    for (const candidate of candidates) {
        if (candidate == null) continue;
        const list = asUserList(candidate).map(normalizePlexHomeUser).filter(Boolean);
        if (list.length) return list;
    }
    return [];
};

export const parsePlexHomeUsersXml = (xml = '') => {
    const text = String(xml || '');
    if (!text.includes('<')) return [];
    const users = [];
    const re = /<User\b([^>]*)\/?>/gi;
    let match;
    while ((match = re.exec(text))) {
        const user = normalizePlexHomeUser(parseXmlAttributes(match[1]));
        if (user) users.push(user);
    }
    return users;
};

export const shouldOfferPlexHomeSelect = (users = []) => (
    Array.isArray(users) && users.length > 1
);

export const isSamePlexHomeUser = (user, targetId) => {
    const want = String(targetId || '').trim();
    if (!user || !want) return false;
    return [user.id, user.uuid, user.plexId]
        .map((value) => String(value || '').trim())
        .filter(Boolean)
        .includes(want);
};

export const findRememberedPlexHomeUser = (users, rememberedUserId) => {
    const want = String(rememberedUserId || '').trim();
    if (!want || !Array.isArray(users)) return null;
    return users.find((user) => isSamePlexHomeUser(user, want)) || null;
};

export const extractSwitchAuthToken = (payload, xml = '') => {
    if (payload && typeof payload === 'object') {
        const token = payload.authToken
            || payload.authenticationToken
            || payload.user?.authToken
            || payload.user?.authenticationToken
            || payload.User?.authToken
            || payload.User?.authenticationToken;
        if (token) return String(token).trim();
    }
    const text = String(xml || '');
    const match = text.match(/\b(?:authenticationToken|authToken)="([^"]+)"/i);
    return match ? String(match[1]).trim() : '';
};

export const fetchPlexHomeUsers = async (token, { fetchImpl = fetch, headers = {} } = {}) => {
    const authHeaders = { ...headers };
    if (token && !authHeaders['X-Plex-Token'] && !authHeaders['x-plex-token']) {
        authHeaders['X-Plex-Token'] = String(token);
    }
    const tryUrl = async (url) => {
        const res = await fetchImpl(url, { headers: authHeaders });
        if (!res.ok) return [];
        const raw = await res.text();
        try {
            const parsed = JSON.parse(raw);
            const users = parsePlexHomeUsers(parsed);
            if (users.length) return users;
        } catch {
            // XML fallback
        }
        return parsePlexHomeUsersXml(raw);
    };

    const v2 = await tryUrl('https://plex.tv/api/v2/home/users').catch(() => []);
    if (v2.length) return v2;
    return tryUrl('https://plex.tv/api/home/users').catch(() => []);
};

export const switchPlexHomeUser = async ({
    token,
    userId,
    pin,
    fetchImpl = fetch,
    headers = {},
} = {}) => {
    const id = String(userId || '').trim();
    if (!id) return { ok: false, needsPin: false, authToken: '' };

    const params = new URLSearchParams();
    const pinValue = String(pin || '').trim();
    if (pinValue) params.set('pin', pinValue);
    const qs = params.toString();
    const url = `https://plex.tv/api/home/users/${encodeURIComponent(id)}/switch${qs ? `?${qs}` : ''}`;
    const authHeaders = { ...headers };
    if (token && !authHeaders['X-Plex-Token'] && !authHeaders['x-plex-token']) {
        authHeaders['X-Plex-Token'] = String(token);
    }

    const res = await fetchImpl(url, { method: 'POST', headers: authHeaders });
    const raw = await res.text().catch(() => '');
    if (res.status === 401 || res.status === 403) {
        return { ok: false, needsPin: true, authToken: '' };
    }
    if (!res.ok) return { ok: false, needsPin: false, authToken: '' };

    let payload = null;
    try { payload = JSON.parse(raw); } catch { payload = null; }
    const authToken = extractSwitchAuthToken(payload, raw);
    if (!authToken) return { ok: false, needsPin: false, authToken: '' };
    return { ok: true, needsPin: false, authToken };
};
