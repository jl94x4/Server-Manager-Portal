/** Resolve a TMDB relative path or an absolute (e.g. TVDB) image URL. */
export const resolveTmdbImageUrl = (
    path: string | null | undefined,
    size: string = 'w342',
): string => {
    const raw = String(path || '').trim();
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    const normalized = raw.startsWith('/') ? raw : `/${raw}`;
    return `https://image.tmdb.org/t/p/${size}${normalized}`;
};
