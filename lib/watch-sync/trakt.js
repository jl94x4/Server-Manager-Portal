const TRAKT_API = 'https://api.trakt.tv';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const createTraktClient = ({ fetchImpl = fetch, log } = {}) => {
    const headersFor = (config, extra = {}) => ({
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': config.clientId,
        'User-Agent': 'ServerPortal-WatchSync',
        ...(config.accessToken ? { Authorization: `Bearer ${config.accessToken}` } : {}),
        ...extra,
    });

    const request = async (config, path, { method = 'GET', body, allowStatuses = [], retries = 0 } = {}) => {
        const url = path.startsWith('http') ? path : `${TRAKT_API}${path}`;
        let response;
        try {
            response = await fetchImpl(url, {
                method,
                headers: headersFor(config),
                body: body == null ? undefined : JSON.stringify(body),
            });
        } catch (error) {
            throw new Error(`Trakt request failed: ${error.message}`);
        }
        if (response.status === 429) {
            if (retries >= 2) throw new Error('Trakt rate limit');
            const wait = Number(response.headers.get('retry-after')) || 2;
            await sleep(Math.min(wait, 8) * 1000);
            return request(config, path, { method, body, allowStatuses, retries: retries + 1 });
        }
        const text = await response.text();
        let payload = null;
        if (text) {
            try { payload = JSON.parse(text); } catch { payload = { raw: text }; }
        }
        if (!response.ok && !allowStatuses.includes(response.status)) {
            const detail = payload?.error_description || payload?.error || response.statusText || 'request failed';
            const error = new Error(`Trakt ${response.status}: ${detail}`);
            error.status = response.status;
            error.payload = payload;
            throw error;
        }
        return { status: response.status, payload, headers: response.headers };
    };

    const refreshIfNeeded = async (config, saveConfig) => {
        if (!config.refreshToken || !config.clientId || !config.clientSecret) return config;
        const expires = config.tokenExpiresAt ? Date.parse(config.tokenExpiresAt) : 0;
        if (expires && expires - Date.now() > 5 * 60 * 1000) return config;
        const { payload } = await request(config, '/oauth/token', {
            method: 'POST',
            body: {
                refresh_token: config.refreshToken,
                client_id: config.clientId,
                client_secret: config.clientSecret,
                redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
                grant_type: 'refresh_token',
            },
        });
        const next = {
            ...config,
            accessToken: payload.access_token || config.accessToken,
            refreshToken: payload.refresh_token || config.refreshToken,
            tokenExpiresAt: new Date(Date.now() + (Number(payload.expires_in) || 7776000) * 1000).toISOString(),
        };
        if (typeof saveConfig === 'function') await saveConfig(next);
        return next;
    };

    const paged = async (config, path) => {
        const items = [];
        let page = 1;
        let pages = 1;
        while (page <= pages && page <= 50) {
            const { payload, headers } = await request(config, `${path}${path.includes('?') ? '&' : '?'}page=${page}&limit=1000`);
            const batch = Array.isArray(payload) ? payload : [];
            items.push(...batch);
            pages = Number(headers.get('x-pagination-page-count')) || 1;
            if (!batch.length) break;
            page += 1;
        }
        return items;
    };

    return {
        request,
        refreshIfNeeded,
        async startDevice(config) {
            if (!config.clientId) throw new Error('Trakt client ID is required.');
            const { payload } = await request(config, '/oauth/device/code', {
                method: 'POST',
                body: { client_id: config.clientId },
            });
            return {
                deviceCode: payload.device_code,
                userCode: payload.user_code,
                verificationUrl: payload.verification_url || 'https://trakt.tv/activate',
                expiresIn: payload.expires_in || 600,
                interval: payload.interval || 5,
            };
        },
        async pollDevice(config, deviceCode) {
            try {
                const { payload, status } = await request(config, '/oauth/device/token', {
                    method: 'POST',
                    body: {
                        code: deviceCode,
                        client_id: config.clientId,
                        client_secret: config.clientSecret,
                    },
                    allowStatuses: [400, 404, 409, 410, 418, 429],
                });
                if (status !== 200) {
                    return { pending: true, error: payload?.error || 'authorization_pending' };
                }
                return {
                    pending: false,
                    accessToken: payload.access_token,
                    refreshToken: payload.refresh_token,
                    expiresIn: payload.expires_in,
                };
            } catch (error) {
                if (error.status === 400 || error.status === 404 || error.status === 409) {
                    return { pending: true, error: error.payload?.error || 'authorization_pending' };
                }
                throw error;
            }
        },
        async settings(config) {
            const { payload } = await request(config, '/users/settings');
            return payload?.user?.username || payload?.user?.ids?.slug || '';
        },
        watchedMovies: (config) => paged(config, '/sync/watched/movies'),
        watchedShows: (config) => paged(config, '/sync/watched/shows'),
        ratingsMovies: (config) => paged(config, '/sync/ratings/movies'),
        ratingsEpisodes: (config) => paged(config, '/sync/ratings/episodes'),
        collectionMovies: (config) => paged(config, '/sync/collection/movies'),
        collectionShows: (config) => paged(config, '/sync/collection/shows'),
        watchlistMovies: (config) => paged(config, '/sync/watchlist/movies'),
        watchlistShows: (config) => paged(config, '/sync/watchlist/shows'),
        async addHistory(config, body) {
            return request(config, '/sync/history', { method: 'POST', body });
        },
        async addRatings(config, body) {
            return request(config, '/sync/ratings', { method: 'POST', body });
        },
        async addCollection(config, body) {
            return request(config, '/sync/collection', { method: 'POST', body });
        },
        async addWatchlist(config, body) {
            return request(config, '/sync/watchlist', { method: 'POST', body });
        },
        log,
    };
};
