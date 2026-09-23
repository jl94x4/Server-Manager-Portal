import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Film, Music, Tv } from 'lucide-react';
import { discoveryTheme, useDiscoverI18n } from './host';
import type { PlayerSection } from './types';

type Props = {
    libraries: PlayerSection[];
    onOpenLibrary: (section: PlayerSection) => void;
    activeKey?: string;
};

const libraryIcon = (type: string) => {
    if (type === 'show') return Tv;
    if (type === 'artist') return Music;
    return Film;
};

export const MediaPlayerLibrariesPanel: React.FC<Props> = ({ libraries, onOpenLibrary, activeKey }) => {
    const { t } = useDiscoverI18n();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setOpen(false);
    }, [activeKey]);

    if (!libraries.length) return null;

    return (
        <section className="flex flex-col gap-3">
            <button
                type="button"
                tabIndex={typeof document !== 'undefined' && (document.documentElement?.dataset?.tv === '1' || window.__PLEX_CLIENT__?.isTv) ? -1 : undefined}
                onClick={() => setOpen((prev) => !prev)}
                className="flex w-full items-center gap-3 min-w-0 text-left"
                aria-expanded={open}
                aria-controls="media-player-libraries"
            >
                <h2 className={`${discoveryTheme.sectionTitle} truncate`}>
                    {t('mediaPlayerPage.libraries')}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-white/5 px-3 py-1.5 text-xs font-bold text-muted">
                    {open ? t('common.hide') : t('common.show')}
                    {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
            </button>
            {open ? (
                <div id="media-player-libraries" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {libraries.map((section) => {
                        const Icon = libraryIcon(section.type);
                        const active = activeKey != null && String(activeKey) === String(section.key);
                        return (
                            <button
                                key={section.key}
                                type="button"
                                onClick={() => {
                                    setOpen(false);
                                    onOpenLibrary(section);
                                }}
                                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left ${
                                    active
                                        ? 'border-plex/50 bg-plex/10'
                                        : 'border-border bg-white/[0.03] hover:border-plex/50 hover:bg-white/[0.06]'
                                }`}
                            >
                                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-plex/15 text-plex">
                                    <Icon className="h-5 w-5" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate font-bold text-text">{section.title}</span>
                                    <span className="block text-[11px] uppercase tracking-wider text-muted">{section.type}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </section>
    );
};
