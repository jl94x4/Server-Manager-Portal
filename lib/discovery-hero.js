/** Backdrop URLs for the discovery hero slideshow (up to 200 trending titles). */

const toBackdropUrl = (path) => {
    if (!path) return null;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `https://image.tmdb.org/t/p/w1280${normalized}`;
};

const addResults = (set, results) => {
    for (const item of results || []) {
        const path = item.backdropPath || item.backdrop_path;
        const url = toBackdropUrl(path);
        if (url) set.add(url);
    }
};

export async function fetchTmdbTrendingBackdrops(apiKey, limit = 200) {
    if (!apiKey) return [];
    const urls = new Set();
    try {
        for (let page = 1; page <= 10 && urls.size < limit; page += 1) {
            const res = await fetch(`https://api.themoviedb.org/3/trending/all/week?api_key=${apiKey}&page=${page}`);
            if (!res.ok) break;
            const json = await res.json();
            addResults(urls, json?.results);
            if (!json?.results?.length) break;
        }
    } catch {
        return [];
    }
    return [...urls].slice(0, limit);
}

export async function fetchSeerrHeroBackdrops(rawFetch, limit = 200) {
    const urls = new Set();

    const safeFetch = async (path) => {
        try {
            return await rawFetch(path);
        } catch {
            return null;
        }
    };

    const trending = await safeFetch('/api/v1/discover/trending');
    addResults(urls, trending?.results);

    for (let page = 1; page <= 8 && urls.size < limit; page += 1) {
        const [movies, tv] = await Promise.all([
            safeFetch(`/api/v1/discover/movies?page=${page}&sortBy=popularity.desc`),
            safeFetch(`/api/v1/discover/tv?page=${page}&sortBy=popularity.desc`),
        ]);
        addResults(urls, movies?.results);
        addResults(urls, tv?.results);
        if (!movies?.results?.length && !tv?.results?.length) break;
    }

    return [...urls].slice(0, limit);
}

export async function fetchDiscoveryHeroBackdrops({ config, rawFetch }) {
    const limit = 200;
    let backgrounds = [];

    if (config?.tmdbApiKey) {
        backgrounds = await fetchTmdbTrendingBackdrops(config.tmdbApiKey, limit);
    }

    if (rawFetch && backgrounds.length < limit) {
        const seerr = await fetchSeerrHeroBackdrops(rawFetch, limit);
        backgrounds = [...new Set([...backgrounds, ...seerr])].slice(0, limit);
    }

    const interval = Math.max(8, parseInt(config?.trendingSlideshowInterval, 10) || 12);

    return { backgrounds, interval };
}
