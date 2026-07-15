import React, { useMemo, useState } from 'react';
import { ArrowRight, ExternalLink, Play } from 'lucide-react';
import {
    buildExternalLinks,
    buildMediaFactRows,
    type CombinedRatings,
    sortKeyCrew,
} from './mediaDetailUtils';

const RatingPill: React.FC<{
    label: string;
    value: string;
    href?: string | null;
    accent?: 'green' | 'red' | 'amber' | 'blue';
}> = ({ label, value, href, accent = 'blue' }) => {
    const colors = {
        green: 'border-green-500/25 bg-green-500/10 text-green-100',
        red: 'border-red-500/25 bg-red-500/10 text-red-100',
        amber: 'border-amber-500/25 bg-amber-500/10 text-amber-100',
        blue: 'border-blue-500/25 bg-blue-500/10 text-blue-100',
    };
    const className = `inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${colors[accent]} transition-colors hover:brightness-110`;
    const content = (
        <>
            <span className="text-[10px] uppercase tracking-wider opacity-70">{label}</span>
            <span>{value}</span>
        </>
    );
    if (href) {
        return (
            <a href={href} target="_blank" rel="noreferrer" className={className}>
                {content}
            </a>
        );
    }
    return <span className={className}>{content}</span>;
};

export const MediaOverviewExtras: React.FC<{
    mediaType: 'movie' | 'tv';
    details: any;
    ratings?: CombinedRatings | null;
    onOpenPerson?: (personId: number) => void;
    onOpenCollection?: (collectionId: number) => void;
}> = ({ mediaType, details, ratings, onOpenPerson, onOpenCollection }) => {
    const [showAllStudios, setShowAllStudios] = useState(false);

    const factRows = useMemo(() => buildMediaFactRows(mediaType, details), [mediaType, details]);
    const crew = useMemo(
        () => sortKeyCrew(details?.credits?.crew || []).slice(0, 6),
        [details?.credits?.crew],
    );
    const keywords = Array.isArray(details?.keywords) ? details.keywords : [];
    const externalLinks = useMemo(
        () => buildExternalLinks(mediaType, details, ratings),
        [mediaType, details, ratings],
    );
    const trailerUrl = useMemo(() => {
        const videos = details?.relatedVideos || details?.videos?.results || details?.videos || [];
        const list = Array.isArray(videos) ? videos : [];
        const trailer = list.find((video) => video?.type === 'Trailer' && video?.site === 'YouTube')
            || list.find((video) => video?.site === 'YouTube');
        if (!trailer) return null;
        if (trailer.url) return trailer.url;
        if (trailer.key) return `https://www.youtube.com/watch?v=${trailer.key}`;
        return null;
    }, [details]);

    const tmdbScore = Number(details?.voteAverage) > 0
        ? `${Math.round(Number(details.voteAverage) * 10)}%`
        : null;
    const rtCriticAccent = ratings?.rt?.criticsRating === 'Rotten' ? 'red' : 'green';
    const rtAudienceAccent = ratings?.rt?.audienceRating === 'Spilled' ? 'red' : 'green';

    const studioRow = factRows.find((row) => row.key === 'studios');
    const visibleFactRows = factRows.filter((row) => row.key !== 'studios');
    const studioNames = studioRow?.value.split(', ') || [];

    const hasRatings = !!(
        ratings?.rt?.criticsScore
        || ratings?.rt?.audienceScore
        || ratings?.imdb?.criticsScore
        || tmdbScore
    );

    if (!hasRatings && !visibleFactRows.length && !studioRow && !crew.length && !keywords.length && !externalLinks.length && !trailerUrl && !details?.collection) {
        return null;
    }

    return (
        <div className="flex flex-col gap-5 max-w-3xl">
            {(hasRatings || trailerUrl) && (
                <div className="flex flex-wrap items-center gap-2">
                    {typeof ratings?.rt?.criticsScore === 'number' && (
                        <RatingPill
                            label="RT Critics"
                            value={`${ratings.rt.criticsScore}%`}
                            href={ratings.rt?.url}
                            accent={rtCriticAccent}
                        />
                    )}
                    {typeof ratings?.rt?.audienceScore === 'number' && (
                        <RatingPill
                            label="RT Audience"
                            value={`${ratings.rt.audienceScore}%`}
                            href={ratings.rt?.url}
                            accent={rtAudienceAccent}
                        />
                    )}
                    {ratings?.imdb?.criticsScore != null && (
                        <RatingPill
                            label="IMDb"
                            value={String(ratings.imdb.criticsScore)}
                            href={ratings.imdb?.url}
                            accent="amber"
                        />
                    )}
                    {tmdbScore && (
                        <RatingPill
                            label="TMDB"
                            value={tmdbScore}
                            href={buildExternalLinks(mediaType, details)[0]?.url}
                            accent="blue"
                        />
                    )}
                    {trailerUrl && (
                        <a
                            href={trailerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.06] text-xs font-semibold text-white/85 hover:bg-white/10 hover:border-white/20 transition-colors"
                        >
                            <Play className="w-3.5 h-3.5" />
                            Watch trailer
                        </a>
                    )}
                </div>
            )}

            {(visibleFactRows.length > 0 || studioRow) && (
                <div className="rounded-xl border border-white/10 bg-black/35 backdrop-blur-xl overflow-hidden ring-1 ring-white/[0.04]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
                        {visibleFactRows.map((row) => (
                            <div key={row.key} className="px-4 py-3 min-w-0">
                                <div className="text-[9px] font-bold uppercase tracking-wider text-white/35">
                                    {row.label}
                                </div>
                                <div className="text-sm text-white/85 mt-1 leading-snug">
                                    {row.value}
                                </div>
                            </div>
                        ))}
                    </div>
                    {studioRow && (
                        <div className="px-4 py-3 border-t border-white/[0.06]">
                            <div className="text-[9px] font-bold uppercase tracking-wider text-white/35">
                                {studioRow.label}
                            </div>
                            <div className="text-sm text-white/85 mt-1 leading-snug">
                                {(showAllStudios ? studioNames : studioNames.slice(0, 3)).join(', ')}
                            </div>
                            {studioNames.length > 3 && (
                                <button
                                    type="button"
                                    onClick={() => setShowAllStudios((prev) => !prev)}
                                    className="mt-2 text-xs font-semibold text-plex hover:text-plex-hover transition-colors"
                                >
                                    {showAllStudios ? 'Show less' : `Show ${studioNames.length - 3} more`}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {details?.collection?.id && details?.collection?.name && (
                <button
                    type="button"
                    onClick={() => onOpenCollection?.(Number(details.collection.id))}
                    className="group text-left rounded-xl border border-white/10 bg-black/35 backdrop-blur-xl overflow-hidden ring-1 ring-white/[0.04] hover:border-plex/30 transition-colors"
                >
                    <div className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-[9px] font-bold uppercase tracking-wider text-white/35">Collection</div>
                            <div className="text-sm font-semibold text-white/90 mt-1 truncate">{details.collection.name}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-plex transition-colors shrink-0" />
                    </div>
                </button>
            )}

            {crew.length > 0 && (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xs font-black text-white/50 uppercase tracking-[0.2em]">Key crew</h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        {crew.map((person: any) => (
                            <button
                                key={`${person.id}-${person.job}`}
                                type="button"
                                onClick={() => onOpenPerson?.(person.id)}
                                className="flex items-baseline justify-between gap-3 text-left border-0 bg-transparent p-0 group cursor-pointer min-w-0"
                            >
                                <span className="text-[11px] uppercase tracking-wide text-white/40 shrink-0">{person.job}</span>
                                <span className="text-sm text-white/80 group-hover:text-plex transition-colors truncate">
                                    {person.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {keywords.length > 0 && (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xs font-black text-white/50 uppercase tracking-[0.2em]">Keywords</h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {keywords.slice(0, 24).map((keyword: any) => (
                            <span
                                key={keyword.id}
                                className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-[11px] font-medium text-white/60"
                            >
                                {keyword.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {externalLinks.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                    {externalLinks.map((link) => (
                        <a
                            key={link.key}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-[11px] font-semibold text-white/65 hover:text-white hover:border-white/20 hover:bg-white/[0.07] transition-colors"
                        >
                            <ExternalLink className="w-3 h-3 opacity-70" />
                            {link.label}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};
