import React, { useMemo } from 'react';

const languageDisplayName = (code?: string | null): string | null => {
    const raw = String(code || '').trim().toLowerCase().split(/[-_]/)[0];
    if (!raw) return null;
    try {
        const name = new Intl.DisplayNames(['en'], { type: 'language' }).of(raw);
        return name || raw.toUpperCase();
    } catch {
        return raw.toUpperCase();
    }
};

type Props = {
    genres?: string[] | null;
    originalLanguage?: string | null;
    maxGenres?: number;
    className?: string;
};

/** Compact genre + original-language chips for request cards / review modal. */
export const RequestMetaChips: React.FC<Props> = ({
    genres,
    originalLanguage,
    maxGenres = 4,
    className = '',
}) => {
    const languageLabel = useMemo(() => languageDisplayName(originalLanguage), [originalLanguage]);
    const genreList = Array.isArray(genres)
        ? genres.map((g) => String(g || '').trim()).filter(Boolean).slice(0, maxGenres)
        : [];

    if (!languageLabel && genreList.length === 0) return null;

    return (
        <div className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
            {languageLabel && (
                <span
                    className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-plex/10 border border-plex/25 text-plex"
                    title="Original language"
                >
                    {languageLabel}
                </span>
            )}
            {genreList.map((genre) => (
                <span
                    key={genre}
                    className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-white/5 border border-border text-muted"
                >
                    {genre}
                </span>
            ))}
            {Array.isArray(genres) && genres.length > maxGenres && (
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-white/5 border border-border text-muted">
                    +{genres.length - maxGenres}
                </span>
            )}
        </div>
    );
};
