import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Star, Calendar, Film, ChevronDown } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { DiscoverPosterCard } from '../screens';
import { filterHiddenAvailableItems, useDiscoveryPreferences } from './useDiscoveryPreferences';
import { enrichDiscoverItemsWithAvailability } from './discoverAvailabilityEnrich';
import { upgraderPosterGridClass, upgraderPosterGridStyle } from '../shared/portalLayout';
import { useDiscoverI18n } from './i18n';
import { useDiscoverGridSize } from './useDiscoverGridSize';
import {
    PERSON_CREDIT_ENRICH_CHUNK,
    mergeEnrichedPersonCredits,
    personCreditYear,
    splitPersonCredits,
} from './personCredits';

const splitBiography = (bio: string) => {
    const trimmed = bio.trim();
    if (!trimmed) return { first: '', rest: '', hasMore: false };

    const paragraphs = trimmed.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
    if (paragraphs.length <= 1) {
        return { first: paragraphs[0] || trimmed, rest: '', hasMore: false };
    }

    return {
        first: paragraphs[0],
        rest: paragraphs.slice(1).join('\n\n'),
        hasMore: true,
    };
};

export const PersonDetailsPage: React.FC<{
    personId: number;
    onBack: () => void;
    onSelect: (item: any) => void;
    formatItem: (item: any) => any;
}> = ({ personId, onBack, onSelect, formatItem }) => {
    const { t, locale } = useDiscoverI18n();
    const { preferences } = useDiscoveryPreferences();
    const [gridSize] = useDiscoverGridSize();
    const [person, setPerson] = useState<any>(null);
    const [castCredits, setCastCredits] = useState<any[]>([]);
    const [crewCredits, setCrewCredits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [bioExpanded, setBioExpanded] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const enrichChunked = async (items: any[], apply: (next: any[]) => void) => {
            if (!items.length) return;
            let current = items;
            for (let start = 0; start < items.length; start += PERSON_CREDIT_ENRICH_CHUNK) {
                if (cancelled) return;
                const chunk = items.slice(start, start + PERSON_CREDIT_ENRICH_CHUNK);
                const enriched = await enrichDiscoverItemsWithAvailability(chunk);
                if (cancelled) return;
                current = mergeEnrichedPersonCredits(current, enriched);
                apply(current);
            }
        };

        const fetchPerson = async () => {
            setLoading(true);
            setCastCredits([]);
            setCrewCredits([]);
            try {
                const [personData, creditsData] = await Promise.all([
                    apiFetch(`/api/discovery/proxy/person/${personId}`),
                    apiFetch(`/api/discovery/proxy/person/${personId}/combined_credits`),
                ]);
                if (cancelled) return;
                if (personData) setPerson(personData);

                const { cast, crew } = splitPersonCredits(creditsData || {});
                setCastCredits(cast);
                setCrewCredits(crew);
                setLoading(false);
                await Promise.all([
                    enrichChunked(cast, setCastCredits),
                    enrichChunked(crew, setCrewCredits),
                ]);
            } catch (err) {
                console.error(err);
                if (!cancelled) setLoading(false);
            }
        };
        fetchPerson();
        return () => { cancelled = true; };
    }, [personId, locale]);

    useEffect(() => {
        setBioExpanded(false);
    }, [personId]);

    if (loading) {
        return (
            <div className="w-full flex justify-center py-32">
                <Loader2 className="w-12 h-12 text-plex animate-spin" />
            </div>
        );
    }

    if (!person) return null;

    const profileUrl = person.profilePath ? `https://image.tmdb.org/t/p/h632${person.profilePath}` : '';
    const age = person.birthday ? new Date().getFullYear() - new Date(person.birthday).getFullYear() : null;
    const visibleCast = filterHiddenAvailableItems(castCredits, preferences.hideAvailableMedia);
    const visibleCrew = filterHiddenAvailableItems(crewCredits, preferences.hideAvailableMedia);
    const filmographyCount = visibleCast.length + visibleCrew.length;
    const biography = person.biography || t('person.noBiography', { name: person.name });
    const { first: bioFirst, rest: bioRest, hasMore: bioHasMore } = splitBiography(biography);

    return (
        <div className="w-full flex flex-col gap-8 pb-12 animate-fade-in relative z-10 mt-4">
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-muted hover:text-text font-medium transition-colors w-fit"
            >
                <ArrowLeft className="w-5 h-5" /> {t('person.back')}
            </button>

            <div className="grid grid-cols-[6.75rem_minmax(0,1fr)] sm:grid-cols-[9.5rem_minmax(0,1fr)] md:grid-cols-[minmax(14rem,22rem)_minmax(0,1fr)] gap-x-4 gap-y-4 md:gap-x-8 md:gap-y-6 items-start">
                <div className="md:row-span-2">
                    {profileUrl ? (
                        <img 
                            src={profileUrl} 
                            alt={person.name}
                            className="w-full rounded-xl md:rounded-2xl object-cover aspect-[2/3] border border-border"
                        />
                    ) : (
                        <div className="w-full rounded-xl md:rounded-2xl bg-white/5 border border-border aspect-[2/3] flex items-center justify-center">
                            <span className="text-muted text-xs md:text-2xl font-bold">{t('person.noPhoto')}</span>
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex flex-col gap-3 md:gap-6">
                    <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-text tracking-tight leading-tight">
                        {person.name}
                    </h1>

                    <div className="flex flex-wrap gap-2 md:gap-4 text-[10px] md:text-sm font-bold text-muted uppercase tracking-widest">
                        {person.knownForDepartment && (
                            <span className="flex items-center gap-1.5 md:gap-2 bg-white/10 px-2.5 py-1 md:px-4 md:py-2 rounded-full border border-white/5">
                                <Star className="w-3.5 h-3.5 md:w-4 md:h-4 text-plex" /> {person.knownForDepartment}
                            </span>
                        )}
                        {person.birthday && (
                            <span className="flex items-center gap-1.5 md:gap-2 bg-white/10 px-2.5 py-1 md:px-4 md:py-2 rounded-full border border-white/5">
                                <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-plex" /> {person.birthday} {age ? `(${t('person.yearsOld', { count: age })})` : ''}
                            </span>
                        )}
                        {person.placeOfBirth && (
                            <span className="flex items-center gap-1.5 md:gap-2 bg-white/10 px-2.5 py-1 md:px-4 md:py-2 rounded-full border border-white/5">
                                {person.placeOfBirth}
                            </span>
                        )}
                    </div>
                </div>

                <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
                    <h2 className="text-xl md:text-2xl font-bold text-text">{t('person.biography')}</h2>
                    <div className="text-muted text-base md:text-lg leading-relaxed whitespace-pre-line space-y-4">
                        <p>{bioFirst}</p>
                        {bioHasMore && bioExpanded && <p>{bioRest}</p>}
                    </div>
                    {bioHasMore && (
                        <button
                            type="button"
                            onClick={() => setBioExpanded((expanded) => !expanded)}
                            className="inline-flex items-center gap-1.5 text-sm font-bold text-plex hover:text-plex-hover transition-colors w-fit"
                        >
                            {bioExpanded ? t('common.showLess') : t('common.readMore')}
                            <ChevronDown className={`w-4 h-4 transition-transform ${bioExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    )}
                </div>
            </div>

            {filmographyCount > 0 && (
                <div className="flex flex-col gap-10 mt-12 border-t border-border pt-10">
                    <h2 className="text-2xl font-black text-text flex items-center gap-3">
                        <Film className="w-6 h-6 text-plex" /> {t('person.filmography')}
                        <span className="text-sm font-bold text-muted tracking-normal">
                            {t('person.creditCount', { count: filmographyCount })}
                        </span>
                    </h2>
                    {visibleCast.length > 0 && (
                        <PersonCreditGrid
                            title={visibleCrew.length > 0 ? t('person.acting') : null}
                            items={visibleCast}
                            formatItem={formatItem}
                            onSelect={onSelect}
                            gridSize={gridSize}
                            roleOf={(item) => String(item?.character || '').trim()}
                        />
                    )}
                    {visibleCrew.length > 0 && (
                        <PersonCreditGrid
                            title={visibleCast.length > 0 ? t('person.crew') : null}
                            items={visibleCrew}
                            formatItem={formatItem}
                            onSelect={onSelect}
                            gridSize={gridSize}
                            roleOf={(item) => String(item?.job || item?.department || '').trim()}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

const PersonCreditGrid: React.FC<{
    title?: string | null;
    items: any[];
    formatItem: (item: any) => any;
    onSelect: (item: any) => void;
    roleOf: (item: any) => string;
    gridSize: number;
}> = ({ title, items, formatItem, onSelect, roleOf, gridSize }) => (
    <div className="flex flex-col gap-4">
        {title ? <h3 className="text-lg font-bold text-text">{title}</h3> : null}
        <div className={upgraderPosterGridClass(gridSize)} style={upgraderPosterGridStyle(gridSize)}>
            {items.map((rawItem, idx) => {
                const formatted = formatItem(rawItem);
                const year = personCreditYear(rawItem) || formatted.year;
                const role = roleOf(rawItem);
                return (
                    <DiscoverPosterCard
                        key={`${formatted.mediaType || 'title'}-${formatted.id}-${idx}`}
                        item={formatted}
                        overlay={formatted.overlay}
                        showQualityBadges={false}
                        onPosterClick={() => onSelect(formatted)}
                        footer={(
                            <div className="text-[11px] font-medium leading-tight text-text text-center mt-1 px-0.5">
                                <div className="line-clamp-2">{formatted.title}</div>
                                {(year || role) ? (
                                    <div className="text-muted line-clamp-2 mt-0.5">
                                        {[year, role].filter(Boolean).join(' · ')}
                                    </div>
                                ) : null}
                            </div>
                        )}
                    />
                );
            })}
        </div>
    </div>
);
