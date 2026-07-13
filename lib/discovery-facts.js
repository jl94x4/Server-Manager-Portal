/**
 * Build a pool of trivia-style notes from TMDB/Seerr media details + optional Wikipedia.
 */

const formatUsd = (amount) => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return null;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')} million`;
    if (n >= 1_000) return `$${Math.round(n / 1_000).toLocaleString()}K`;
    return `$${n.toLocaleString()}`;
};

const pickRandom = (items) => {
    if (!items?.length) return null;
    return items[Math.floor(Math.random() * items.length)];
};

const shuffle = (items) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const sentenceSplit = (text) => {
    if (!text) return [];
    return text
        .replace(/\([^)]*\)/g, '')
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 40 && s.length <= 280 && !/^\d+\s*$/.test(s));
};

export const buildTmdbFacts = (details, mediaType) => {
    const facts = [];
    if (!details || typeof details !== 'object') return facts;

    const title = mediaType === 'movie' ? details.title : details.name;
    const year = String(details.releaseDate || details.firstAirDate || '').slice(0, 4);

    if (details.tagline?.trim()) {
        facts.push(`"${details.tagline.trim()}"`);
    }

    if (mediaType === 'movie') {
        const budget = formatUsd(details.budget);
        const revenue = formatUsd(details.revenue);
        if (budget) facts.push(`${title} had a reported production budget of ${budget}.`);
        if (revenue) facts.push(`${title} grossed about ${revenue} worldwide.`);
        if (details.runtime > 0) facts.push(`The runtime is ${details.runtime} minutes.`);
    }

    if (mediaType === 'tv') {
        if (details.numberOfSeasons) {
            const eps = details.numberOfEpisodes ? ` and ${details.numberOfEpisodes} episodes` : '';
            facts.push(`${title} ran for ${details.numberOfSeasons} season${details.numberOfSeasons === 1 ? '' : 's'}${eps}.`);
        }
        if (details.episodeRunTime?.length) {
            const mins = details.episodeRunTime.filter((n) => Number(n) > 0);
            if (mins.length) {
                const avg = Math.round(mins.reduce((a, b) => a + Number(b), 0) / mins.length);
                facts.push(`Typical episode length is around ${avg} minutes.`);
            }
        }
        if (details.createdBy?.length) {
            const names = details.createdBy.map((c) => c.name).filter(Boolean).slice(0, 3).join(', ');
            if (names) facts.push(`Created by ${names}.`);
        }
        if (details.networks?.length) {
            const names = details.networks.map((n) => n.name).filter(Boolean).join(', ');
            if (names) facts.push(`Originally aired on ${names}.`);
        }
        if (details.firstAirDate) {
            facts.push(`First premiered on ${details.firstAirDate.slice(0, 10)}.`);
        }
        if (details.lastAirDate && details.status?.toLowerCase() !== 'returning series') {
            facts.push(`Final episode aired on ${details.lastAirDate.slice(0, 10)}.`);
        }
    }

    if (details.productionCountries?.length) {
        const names = details.productionCountries.map((c) => c.name || c.iso_3166_1).filter(Boolean).join(', ');
        if (names) facts.push(`Produced in ${names}.`);
    }

    if (details.spokenLanguages?.length > 1) {
        const langs = details.spokenLanguages.map((l) => l.english_name || l.name).filter(Boolean).join(', ');
        if (langs) facts.push(`Features dialogue in ${langs}.`);
    } else if (details.originalLanguage) {
        facts.push(`Original language: ${details.originalLanguage.toUpperCase()}.`);
    }

    if (details.genres?.length >= 2) {
        const g = details.genres.map((x) => x.name).slice(0, 3).join(', ');
        facts.push(`Genres include ${g}.`);
    }

    if (details.voteAverage > 0 && details.voteCount > 50) {
        facts.push(`TMDB users rate it ${details.voteAverage.toFixed(1)}/10 from ${details.voteCount.toLocaleString()} votes.`);
    }

    if (details.productionCompanies?.length) {
        const studios = details.productionCompanies.map((c) => c.name).filter(Boolean).slice(0, 3).join(', ');
        if (studios) facts.push(`Production companies include ${studios}.`);
    }

    if (details.belongsToCollection?.name) {
        facts.push(`Part of the ${details.belongsToCollection.name} collection.`);
    }

    if (details.status && mediaType === 'tv') {
        facts.push(`Series status: ${details.status}.`);
    }

    if (year) {
        facts.push(`${title} first released in ${year}.`);
    }

    return facts.filter(Boolean);
};

export const fetchWikipediaFacts = async (fetchFn, title, year, mediaType) => {
    if (!title || typeof fetchFn !== 'function') return [];

    const suffix = mediaType === 'movie' ? 'film' : 'TV series';
    const queries = [
        year ? `${title} (${year} ${suffix})` : null,
        `${title} (${suffix})`,
        title,
    ].filter(Boolean);

    for (const query of queries) {
        try {
            const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=3`;
            const searchRes = await fetchFn(searchUrl, { timeout: 6000 });
            const searchData = await searchRes.json();
            const hit = searchData?.query?.search?.[0];
            if (!hit?.title) continue;

            const pageKey = encodeURIComponent(hit.title.replace(/ /g, '_'));
            const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${pageKey}`;
            const summaryRes = await fetchFn(summaryUrl, { timeout: 6000 });
            if (!summaryRes.ok) continue;

            const summary = await summaryRes.json();
            const extract = summary?.extract || '';
            const sentences = sentenceSplit(extract);
            if (sentences.length) {
                return sentences.slice(0, 8);
            }
        } catch {
            // try next query
        }
    }

    return [];
};

export const buildDiscoveryFacts = async ({ details, mediaType, fetchFn }) => {
    const tmdbFacts = buildTmdbFacts(details, mediaType);
    const title = mediaType === 'movie' ? details?.title : details?.name;
    const year = String(details?.releaseDate || details?.firstAirDate || '').slice(0, 4);

    let wikiFacts = [];
    try {
        wikiFacts = await fetchWikipediaFacts(fetchFn, title, year, mediaType);
    } catch {
        wikiFacts = [];
    }

    const combined = shuffle([...wikiFacts, ...tmdbFacts]);
    const unique = [...new Set(combined.map((f) => f.trim()).filter(Boolean))];

    return {
        facts: unique,
        fact: pickRandom(unique) || null,
        sources: {
            wikipedia: wikiFacts.length,
            tmdb: tmdbFacts.length,
        },
    };
};
