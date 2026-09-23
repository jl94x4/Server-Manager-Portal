import React from 'react';
import type { CombinedRatings } from './mediaDetailUtils';
import { useDiscoverI18n } from './i18n';

const pillLinkClass = 'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all hover:brightness-110 hover:scale-[1.02]';
const pillStaticClass = 'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold';

const RtTomatoIcon: React.FC<{ fresh: boolean }> = ({ fresh }) => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden>
        <circle cx="12" cy="13" r="8" fill={fresh ? '#fa320a' : '#6b7280'} />
        <ellipse cx="12" cy="6" rx="3" ry="1.5" fill="#166534" />
        <path d="M9 5c0-2 1.5-3 3-3s3 1 3 3" stroke="#166534" strokeWidth="1.5" fill="none" />
    </svg>
);

const RtPopcornIcon: React.FC<{ fresh: boolean }> = ({ fresh }) => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden>
        <path
            d="M6 10h12v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8z"
            fill={fresh ? '#fa320a' : '#6b7280'}
        />
        <circle cx="8" cy="8" r="2" fill="#fbbf24" />
        <circle cx="12" cy="7" r="2.2" fill="#fde047" />
        <circle cx="16" cy="8" r="2" fill="#fbbf24" />
        <circle cx="10" cy="5.5" r="1.6" fill="#fde047" />
        <circle cx="14" cy="5.5" r="1.6" fill="#fbbf24" />
    </svg>
);

const TmdbMark: React.FC = () => (
    <span className="px-1 py-0.5 rounded bg-[#01b4e4] text-[10px] font-black text-white leading-none tracking-tight">
        TMDB
    </span>
);

type MediaRatingPillsProps = {
    ratings?: CombinedRatings | null;
    tmdbScore?: string | null;
    tmdbUrl?: string | null;
    /** When false, show scores as static pills (no external links / focus targets). */
    interactive?: boolean;
};

export const MediaRatingPills: React.FC<MediaRatingPillsProps> = ({
    ratings,
    tmdbScore,
    tmdbUrl,
    interactive = true,
}) => {
    const { t } = useDiscoverI18n();
    const pillClass = interactive ? pillLinkClass : pillStaticClass;
    const rtCritics = Number(ratings?.rt?.criticsScore);
    const rtAudience = Number(ratings?.rt?.audienceScore);
    const imdbScore = ratings?.imdb?.criticsScore;
    const imdbScoreLabel = imdbScore == null || imdbScore === ''
        ? null
        : typeof imdbScore === 'number'
            ? (Number.isInteger(imdbScore) ? String(imdbScore) : imdbScore.toFixed(1))
            : String(imdbScore);
    const rtCriticsFresh = ratings?.rt?.criticsRating !== 'Rotten';
    const rtAudienceFresh = ratings?.rt?.audienceRating !== 'Spilled';

    const pills: React.ReactNode[] = [];

    const renderPill = (
        key: string,
        className: string,
        title: string,
        content: React.ReactNode,
        href?: string | null,
    ) => {
        if (interactive && href) {
            return (
                <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                    title={title}
                >
                    {content}
                </a>
            );
        }
        return (
            <span key={key} className={className} title={title}>
                {content}
            </span>
        );
    };

    if (Number.isFinite(rtCritics)) {
        pills.push(renderPill(
            'rt-critics',
            `${pillClass} ${
                rtCriticsFresh
                    ? 'border-green-500/30 bg-green-500/10 text-green-100'
                    : 'border-red-500/30 bg-red-500/10 text-red-100'
            }`,
            t('ratings.rottenTomatoesTomatometer'),
            (
                <>
                    <RtTomatoIcon fresh={rtCriticsFresh} />
                    <span>{rtCritics}%</span>
                </>
            ),
            ratings?.rt?.url,
        ));
    }

    if (Number.isFinite(rtAudience)) {
        pills.push(renderPill(
            'rt-audience',
            `${pillClass} ${
                rtAudienceFresh
                    ? 'border-green-500/30 bg-green-500/10 text-green-100'
                    : 'border-red-500/30 bg-red-500/10 text-red-100'
            }`,
            t('ratings.rottenTomatoesAudience'),
            (
                <>
                    <RtPopcornIcon fresh={rtAudienceFresh} />
                    <span>{rtAudience}%</span>
                </>
            ),
            ratings?.rt?.url,
        ));
    }

    if (imdbScoreLabel) {
        pills.push(renderPill(
            'imdb',
            `${pillClass} border-[#F5C518]/40 bg-[#F5C518]/15 text-white gap-2`,
            t('ratings.imdb'),
            (
                <>
                    <span className="px-1 py-0.5 rounded bg-[#F5C518] text-[10px] font-black text-black leading-none tracking-tight">
                        IMDb
                    </span>
                    <span>{imdbScoreLabel}</span>
                </>
            ),
            ratings?.imdb?.url,
        ));
    }

    if (tmdbScore) {
        pills.push(renderPill(
            'tmdb',
            `${pillClass} border-[#01b4e4]/35 bg-[#01b4e4]/10 text-[#b8ecf7]`,
            t('ratings.tmdb'),
            (
                <>
                    <TmdbMark />
                    <span>{tmdbScore}</span>
                </>
            ),
            tmdbUrl,
        ));
    }

    if (!pills.length) return null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {pills}
        </div>
    );
};
