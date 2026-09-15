import React, { useEffect, useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Film,
    Home,
    LogOut,
    Menu,
    Music,
    Search,
    Settings,
    Tv,
    X,
} from 'lucide-react';
import { exitToPortal, lockBackgroundScroll, useDiscoverI18n } from './host';
import { applyLibraryNavOrder } from './playerSettings';
import type { PlayerSection } from './types';

type NavPage = 'home' | 'library' | 'settings' | 'other';

type Props = {
    libraries: PlayerSection[];
    libraryOrder: string[];
    page: NavPage;
    activeLibraryKey?: string;
    expanded: boolean;
    onToggleExpanded: () => void;
    onHome: () => void;
    onSearch: () => void;
    onOpenLibrary: (section: PlayerSection) => void;
    onOpenSettings: () => void;
};

const libraryIcon = (type: string) => {
    if (type === 'show') return Tv;
    if (type === 'artist') return Music;
    return Film;
};

const navButtonClass = (active: boolean, expanded: boolean) => (
    `flex items-center text-left text-sm font-semibold transition-colors ${
        expanded
            ? 'w-full gap-3 rounded-full px-3.5 py-2.5'
            : 'h-10 w-10 justify-center rounded-full'
    } ${
        active
            ? expanded
                ? 'bg-white text-zinc-900 shadow-lg shadow-black/25'
                : 'bg-white text-zinc-900'
            : 'text-white/80 hover:bg-white/10 hover:text-white'
    }`
);

export const MediaPlayerNav: React.FC<Props> = ({
    libraries,
    libraryOrder,
    page,
    activeLibraryKey,
    expanded,
    onToggleExpanded,
    onHome,
    onSearch,
    onOpenLibrary,
    onOpenSettings,
}) => {
    const { t } = useDiscoverI18n();
    const [mobileOpen, setMobileOpen] = useState(false);
    const orderedLibraries = applyLibraryNavOrder(libraries, libraryOrder);

    useEffect(() => {
        if (!mobileOpen) return undefined;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setMobileOpen(false);
        };
        window.addEventListener('keydown', onKey);
        const unlock = lockBackgroundScroll();
        return () => {
            window.removeEventListener('keydown', onKey);
            unlock();
        };
    }, [mobileOpen]);

    const closeMobile = () => setMobileOpen(false);

    const go = (action: () => void) => {
        action();
        closeMobile();
    };

    const renderNav = (showLabels: boolean) => (
        <nav className={`flex max-h-full min-h-0 flex-col ${showLabels ? 'gap-3 px-2.5 py-3' : 'items-center gap-1.5 px-1.5 py-2.5'}`}>
            <div className={`flex shrink-0 flex-col ${showLabels ? 'gap-1' : 'items-center gap-1'}`}>
                <button
                    type="button"
                    className={navButtonClass(page === 'home', showLabels)}
                    onClick={() => go(onHome)}
                    title={t('mediaPlayerPage.navHome')}
                >
                    <Home className="h-4 w-4 shrink-0" />
                    {showLabels ? t('mediaPlayerPage.navHome') : null}
                </button>
                <button
                    type="button"
                    className={navButtonClass(false, showLabels)}
                    onClick={() => go(onSearch)}
                    title={t('mediaPlayerPage.navSearch')}
                >
                    <Search className="h-4 w-4 shrink-0" />
                    {showLabels ? t('mediaPlayerPage.navSearch') : null}
                </button>
            </div>

            {orderedLibraries.length ? (
                <div className={`flex min-h-0 flex-col overflow-hidden ${showLabels ? 'gap-1' : 'items-center gap-1'}`}>
                    {showLabels ? (
                        <div className="flex shrink-0 items-center gap-2 px-3 pb-1 pt-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                                {t('mediaPlayerPage.navLibraries')}
                            </p>
                            <div className="h-px min-w-0 flex-1 bg-white/10" />
                        </div>
                    ) : (
                        <div className="my-1 h-px w-6 shrink-0 bg-white/15" />
                    )}
                    <div className={`min-h-0 overflow-y-auto custom-scrollbar ${showLabels ? 'flex flex-col gap-1' : 'flex flex-col items-center gap-1'}`}>
                        {orderedLibraries.map((section) => {
                            const Icon = libraryIcon(section.type);
                            const active = page === 'library' && String(activeLibraryKey) === String(section.key);
                            return (
                                <button
                                    key={section.key}
                                    type="button"
                                    className={navButtonClass(active, showLabels)}
                                    onClick={() => go(() => onOpenLibrary(section))}
                                    title={section.title}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    {showLabels ? <span className="min-w-0 truncate">{section.title}</span> : null}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : null}

            <div className={`flex shrink-0 flex-col ${showLabels ? 'gap-1 border-t border-white/10 pt-3' : 'items-center gap-1 pt-1'}`}>
                {!showLabels ? <div className="mb-1 h-px w-6 bg-white/15" /> : null}
                <button
                    type="button"
                    className={navButtonClass(page === 'settings', showLabels)}
                    onClick={() => go(onOpenSettings)}
                    title={t('mediaPlayerPage.navSettings')}
                >
                    <Settings className="h-4 w-4 shrink-0" />
                    {showLabels ? t('mediaPlayerPage.navSettings') : null}
                </button>
                <button
                    type="button"
                    className={navButtonClass(false, showLabels)}
                    onClick={() => go(exitToPortal)}
                    title={t('mediaPlayerPage.exitToPortal')}
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {showLabels ? t('mediaPlayerPage.exitToPortal') : null}
                </button>
            </div>
        </nav>
    );

    return (
        <>
            <div className="sticky top-0 z-40 flex items-center gap-2 border-b border-white/10 bg-[#0b1018]/90 px-3 py-2 backdrop-blur-xl md:hidden">
                <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
                    aria-label={t('mediaPlayerPage.openNav')}
                >
                    <Menu className="h-5 w-5" />
                </button>
                <p className="min-w-0 flex-1 truncate text-sm font-black text-white">
                    {t('navigation.mediaPlayer')}
                </p>
                <button
                    type="button"
                    onClick={onSearch}
                    className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
                    aria-label={t('mediaPlayerPage.navSearch')}
                >
                    <Search className="h-5 w-5" />
                </button>
            </div>

            <aside className="pointer-events-none absolute inset-y-0 left-0 z-40 hidden md:flex items-center pl-3">
                <div
                    className={`pointer-events-auto relative flex max-h-[calc(100%-3rem)] flex-col transition-[width] duration-200 ${
                        expanded ? 'w-[16.25rem]' : 'w-[4.25rem]'
                    }`}
                >
                    <div className="flex min-h-0 max-h-full flex-col overflow-hidden rounded-[28px] bg-[#0b1018]/80 shadow-[0_18px_50px_rgba(0,0,0,0.45)] ring-1 ring-white/10 backdrop-blur-2xl">
                        {renderNav(expanded)}
                    </div>
                    <button
                        type="button"
                        onClick={onToggleExpanded}
                        className="absolute top-1/2 -right-3 z-10 flex h-11 w-6 -translate-y-1/2 items-center justify-center rounded-r-xl bg-[#0b1018]/85 text-white/80 shadow-lg ring-1 ring-white/10 backdrop-blur-xl hover:bg-white/10 hover:text-white"
                        title={expanded ? t('mediaPlayerPage.collapseNav') : t('mediaPlayerPage.expandNav')}
                        aria-label={expanded ? t('mediaPlayerPage.collapseNav') : t('mediaPlayerPage.expandNav')}
                    >
                        {expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                </div>
            </aside>

            {mobileOpen ? (
                <div className="fixed inset-0 z-[80] md:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/60"
                        aria-label={t('mediaPlayerPage.closeNav')}
                        onClick={closeMobile}
                    />
                    <aside className="relative m-3 flex max-h-[calc(100%-1.5rem)] w-[min(20rem,86vw)] flex-col overflow-hidden rounded-[28px] bg-[#0b1018]/95 shadow-2xl ring-1 ring-white/10">
                        <button
                            type="button"
                            onClick={closeMobile}
                            className="absolute right-2 top-3 z-10 rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
                            aria-label={t('mediaPlayerPage.closeNav')}
                        >
                            <X className="h-4 w-4" />
                        </button>
                        {renderNav(true)}
                    </aside>
                </div>
            ) : null}
        </>
    );
};
