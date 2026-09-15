import React, { useEffect, useState } from 'react';
import {
    Film,
    Home,
    LogOut,
    Menu,
    Music,
    PanelLeftClose,
    PanelLeftOpen,
    Search,
    Settings,
    Tv,
    X,
} from 'lucide-react';
import { exitToPortal, lockBackgroundScroll, useDiscoverI18n } from './host';
import { applyLibraryNavOrder } from './playerSettings';
import { readPlayerNavCollapsed, writePlayerNavCollapsed } from './playerMemory';
import type { PlayerSection } from './types';

type NavPage = 'home' | 'library' | 'settings' | 'other';

type Props = {
    libraries: PlayerSection[];
    libraryOrder: string[];
    page: NavPage;
    activeLibraryKey?: string;
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

const navButtonClass = (active: boolean, collapsed: boolean) => (
    `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors ${
        collapsed ? 'justify-center px-0' : ''
    } ${
        active
            ? 'bg-white text-zinc-900 shadow-lg shadow-black/20'
            : 'text-white/80 hover:bg-white/10 hover:text-white'
    }`
);

export const MediaPlayerNav: React.FC<Props> = ({
    libraries,
    libraryOrder,
    page,
    activeLibraryKey,
    onHome,
    onSearch,
    onOpenLibrary,
    onOpenSettings,
}) => {
    const { t } = useDiscoverI18n();
    const [collapsed, setCollapsed] = useState(() => readPlayerNavCollapsed());
    const [mobileOpen, setMobileOpen] = useState(false);
    const orderedLibraries = applyLibraryNavOrder(libraries, libraryOrder);

    useEffect(() => {
        writePlayerNavCollapsed(collapsed);
    }, [collapsed]);

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

    const renderNav = (collapsedRail: boolean) => (
        <div className="flex h-full min-h-0 flex-col">
            <div className={`flex items-center ${collapsedRail ? 'justify-center px-2 pt-4' : 'justify-between gap-2 px-3 pt-4'}`}>
                {collapsedRail ? null : (
                    <p className="truncate text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
                        {t('navigation.mediaPlayer')}
                    </p>
                )}
                <button
                    type="button"
                    className="hidden rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white md:inline-flex"
                    onClick={() => setCollapsed((prev) => !prev)}
                    aria-label={collapsedRail ? t('mediaPlayerPage.expandNav') : t('mediaPlayerPage.collapseNav')}
                    title={collapsedRail ? t('mediaPlayerPage.expandNav') : t('mediaPlayerPage.collapseNav')}
                >
                    {collapsedRail ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </button>
            </div>

            <nav className="mt-4 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-2 pb-3 custom-scrollbar">
                <div className="flex flex-col gap-1">
                    <button
                        type="button"
                        className={navButtonClass(page === 'home', collapsedRail)}
                        onClick={() => go(onHome)}
                        title={t('mediaPlayerPage.navHome')}
                    >
                        <Home className="h-4 w-4 shrink-0" />
                        {collapsedRail ? null : t('mediaPlayerPage.navHome')}
                    </button>
                    <button
                        type="button"
                        className={navButtonClass(false, collapsedRail)}
                        onClick={() => go(onSearch)}
                        title={t('mediaPlayerPage.navSearch')}
                    >
                        <Search className="h-4 w-4 shrink-0" />
                        {collapsedRail ? null : t('mediaPlayerPage.navSearch')}
                    </button>
                </div>

                {orderedLibraries.length ? (
                    <div className="flex min-h-0 flex-col gap-1">
                        {collapsedRail ? (
                            <div className="mx-3 my-1 h-px bg-white/10" />
                        ) : (
                            <p className="px-3 pb-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                                {t('mediaPlayerPage.navLibraries')}
                            </p>
                        )}
                        {orderedLibraries.map((section) => {
                            const Icon = libraryIcon(section.type);
                            const active = page === 'library' && String(activeLibraryKey) === String(section.key);
                            return (
                                <button
                                    key={section.key}
                                    type="button"
                                    className={navButtonClass(active, collapsedRail)}
                                    onClick={() => go(() => onOpenLibrary(section))}
                                    title={section.title}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    {collapsedRail ? null : <span className="truncate">{section.title}</span>}
                                </button>
                            );
                        })}
                    </div>
                ) : null}
            </nav>

            <div className="mt-auto flex flex-col gap-1 border-t border-white/10 px-2 py-3">
                <button
                    type="button"
                    className={navButtonClass(page === 'settings', collapsedRail)}
                    onClick={() => go(onOpenSettings)}
                    title={t('mediaPlayerPage.navSettings')}
                >
                    <Settings className="h-4 w-4 shrink-0" />
                    {collapsedRail ? null : t('mediaPlayerPage.navSettings')}
                </button>
                <button
                    type="button"
                    className={navButtonClass(false, collapsedRail)}
                    onClick={() => go(exitToPortal)}
                    title={t('mediaPlayerPage.exitToPortal')}
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {collapsedRail ? null : t('mediaPlayerPage.exitToPortal')}
                </button>
            </div>
        </div>
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

            <aside
                className={`relative z-30 hidden h-full shrink-0 border-r border-white/10 bg-[#0b1018]/92 backdrop-blur-xl md:flex md:flex-col ${
                    collapsed ? 'w-[72px]' : 'w-[260px]'
                }`}
            >
                {renderNav(collapsed)}
            </aside>

            {mobileOpen ? (
                <div className="fixed inset-0 z-[80] md:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/60"
                        aria-label={t('mediaPlayerPage.closeNav')}
                        onClick={closeMobile}
                    />
                    <aside className="relative flex h-full w-[min(20rem,86vw)] flex-col bg-[#0b1018] shadow-2xl">
                        <button
                            type="button"
                            onClick={closeMobile}
                            className="absolute right-2 top-3 rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
                            aria-label={t('mediaPlayerPage.closeNav')}
                        >
                            <X className="h-4 w-4" />
                        </button>
                        {renderNav(false)}
                    </aside>
                </div>
            ) : null}
        </>
    );
};
