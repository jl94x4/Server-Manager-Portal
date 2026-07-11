import fs from 'fs/promises';
import path from 'path';

const TRASH_REPO = 'TRaSH-Guides/Guides';
const TRASH_BRANCH = 'master';
const TRASH_RAW = `https://raw.githubusercontent.com/${TRASH_REPO}/${TRASH_BRANCH}`;
const TRASH_SONARR_CF_DIR = `${TRASH_RAW}/docs/json/sonarr/cf`;
const TRASH_SONARR_MD = `${TRASH_RAW}/docs/Sonarr/sonarr-collection-of-custom-formats.md`;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FETCH_CONCURRENCY = 16;

let memoryCache = null;
let memoryCacheAt = 0;
let buildPromise = null;

export const getTrashCatalogCachePath = (configDir) =>
    path.join(configDir, 'trash-sonarr-catalog.json');

const fetchJson = async (url, timeoutMs = 20000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        return await res.json();
    } finally {
        clearTimeout(timer);
    }
};

const fetchText = async (url, timeoutMs = 30000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        return await res.text();
    } finally {
        clearTimeout(timer);
    }
};

/** Parse TRaSH collection markdown — categories from ## / ### headings plus JSON blocks. */
export const parseSonarrCatalogMarkdown = (md = '') => {
    const categoryPositions = [...String(md).matchAll(/^## (.+)$/gm)]
        .map((m) => ({ pos: m.index ?? 0, name: m[1].trim() }))
        .filter((c) => c.name !== 'INDEX' && c.name !== 'TOP' && !c.name.startsWith('---'));

    const formatPositions = [...String(md).matchAll(/^### (.+)$/gm)]
        .map((m) => ({ pos: m.index ?? 0, name: m[1].trim() }));

    const entries = [];
    const jsonMatches = [...String(md).matchAll(/`\s*(\{[\s\S]*?"trash_id"[\s\S]*?\})\s*`/g)];

    for (const match of jsonMatches) {
        const pos = match.index ?? 0;
        const category = [...categoryPositions].reverse().find((c) => c.pos < pos)?.name || 'Other';
        const formatName = [...formatPositions].reverse().find((f) => f.pos < pos)?.name || '';
        try {
            const parsed = JSON.parse(match[1]);
            if (!parsed?.trash_id) continue;
            entries.push({
                trashId: String(parsed.trash_id),
                name: String(parsed.name || formatName || 'Unnamed'),
                category,
                defaultScore: parsed.trash_scores?.default ?? null,
                specCount: Array.isArray(parsed.specifications) ? parsed.specifications.length : 0,
            });
        } catch {
            // skip malformed blocks
        }
    }
    return entries;
};

const listSonarrCfSlugs = async () => {
    const tree = await fetchJson(
        `https://api.github.com/repos/${TRASH_REPO}/git/trees/${TRASH_BRANCH}?recursive=1`,
        45000,
    );
    const prefix = 'docs/json/sonarr/cf/';
    return (Array.isArray(tree?.tree) ? tree.tree : [])
        .filter((node) => node?.type === 'blob' && String(node.path || '').startsWith(prefix) && node.path.endsWith('.json'))
        .map((node) => ({
            slug: path.basename(node.path, '.json'),
            path: node.path,
        }));
};

const mapWithConcurrency = async (items, limit, fn) => {
    const results = new Array(items.length);
    let idx = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (idx < items.length) {
            const current = idx++;
            results[current] = await fn(items[current], current);
        }
    });
    await Promise.all(workers);
    return results;
};

const buildTrashIdSlugMap = async (slugs) => {
    const pairs = await mapWithConcurrency(slugs, FETCH_CONCURRENCY, async ({ slug }) => {
        try {
            const data = await fetchJson(`${TRASH_SONARR_CF_DIR}/${slug}.json`, 15000);
            if (!data?.trash_id) return null;
            return [String(data.trash_id), slug];
        } catch {
            return null;
        }
    });
    return new Map(pairs.filter(Boolean));
};

const groupByCategory = (items) => {
    const map = new Map();
    for (const item of items) {
        const cat = item.category || 'Other';
        if (!map.has(cat)) map.set(cat, []);
        map.get(cat).push(item);
    }
    return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, catItems]) => ({
            name,
            items: catItems.sort((a, b) => a.name.localeCompare(b.name)),
        }));
};

export const buildSonarrTrashCatalog = async () => {
    const [md, slugs] = await Promise.all([
        fetchText(TRASH_SONARR_MD),
        listSonarrCfSlugs(),
    ]);

    const mdEntries = parseSonarrCatalogMarkdown(md);
    const trashIdToSlug = await buildTrashIdSlugMap(slugs);

    const slugMeta = new Map();
    for (const { slug } of slugs) {
        slugMeta.set(slug, { slug, name: slug, category: 'Other', trashId: null, defaultScore: null, specCount: 0 });
    }

    for (const entry of mdEntries) {
        const slug = trashIdToSlug.get(entry.trashId);
        if (!slug) continue;
        slugMeta.set(slug, { slug, ...entry });
    }

    // Fill gaps: markdown may miss entries that exist only as JSON files
    const missing = slugs.filter(({ slug }) => !mdEntries.find((e) => trashIdToSlug.get(e.trashId) === slug));
    if (missing.length) {
        await mapWithConcurrency(missing, FETCH_CONCURRENCY, async ({ slug }) => {
            try {
                const data = await fetchJson(`${TRASH_SONARR_CF_DIR}/${slug}.json`, 15000);
                if (!data?.trash_id) return;
                const existing = slugMeta.get(slug);
                if (existing?.category && existing.category !== 'Other') return;
                slugMeta.set(slug, {
                    slug,
                    trashId: String(data.trash_id),
                    name: String(data.name || slug),
                    category: existing?.category || 'Other',
                    defaultScore: data.trash_scores?.default ?? null,
                    specCount: Array.isArray(data.specifications) ? data.specifications.length : 0,
                });
            } catch {
                // ignore
            }
        });
    }

    const items = Array.from(slugMeta.values()).filter((i) => i.trashId);
    return {
        fetchedAt: new Date().toISOString(),
        source: 'https://trash-guides.info/Sonarr/sonarr-collection-of-custom-formats/',
        itemCount: items.length,
        categories: groupByCategory(items),
        items,
    };
};

const readDiskCache = async (cachePath) => {
    try {
        const raw = await fs.readFile(cachePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed?.fetchedAt || !Array.isArray(parsed?.items)) return null;
        const age = Date.now() - new Date(parsed.fetchedAt).getTime();
        if (age > CACHE_TTL_MS) return null;
        return parsed;
    } catch {
        return null;
    }
};

const writeDiskCache = async (cachePath, data) => {
    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(cachePath, JSON.stringify(data, null, 2));
};

export const getSonarrTrashCatalog = async (configDir, { refresh = false } = {}) => {
    const cachePath = getTrashCatalogCachePath(configDir);

    if (!refresh) {
        if (memoryCache && Date.now() - memoryCacheAt < CACHE_TTL_MS) return memoryCache;
        const disk = await readDiskCache(cachePath);
        if (disk) {
            memoryCache = disk;
            memoryCacheAt = Date.now();
            return disk;
        }
    }

    if (!buildPromise) {
        buildPromise = buildSonarrTrashCatalog()
            .then(async (catalog) => {
                memoryCache = catalog;
                memoryCacheAt = Date.now();
                await writeDiskCache(cachePath, catalog);
                return catalog;
            })
            .finally(() => {
                buildPromise = null;
            });
    }

    return buildPromise;
};

export const getSonarrTrashCustomFormat = async (slug) => {
    const safe = String(slug || '').trim().replace(/[^a-z0-9-]/gi, '');
    if (!safe) throw new Error('Invalid catalog slug');
    return fetchJson(`${TRASH_SONARR_CF_DIR}/${safe}.json`, 20000);
};
