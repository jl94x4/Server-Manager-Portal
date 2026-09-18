import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    pushToast as appendToast,
    stripBasePath,
    ToastContainer,
    useDiscoverI18n,
    type ToastMessage,
} from './host';
import { fetchMediaPlayerLibraries, fetchMediaPlayerMe, startMediaPlayerPlayback } from './api';
import { MediaPlayerHome } from './MediaPlayerHome';
import { MediaPlayerLibrary } from './MediaPlayerLibrary';
import { MediaPlayerCollection } from './MediaPlayerCollection';
import { MediaPlayerPlaylist } from './MediaPlayerPlaylist';
import { MediaPlayerDetails } from './MediaPlayerDetails';
import { MediaPlayerPerson } from './MediaPlayerPerson';
import { MediaPlayerStudio } from './MediaPlayerStudio';
import { MediaPlayerSettings } from './MediaPlayerSettings';
import { MediaPlayerVideo } from './MediaPlayerVideo';
import { MediaPlayerNav } from './MediaPlayerNav';
import { PLAYER_APP_BASE, PLAYER_NAVIGATE_EVENT, PLAYER_SCROLL_ID } from './paths';
import { usePlayerSettings } from './usePlayerSettings';
import { formatClock, shouldOfferResume } from './playerUtils';
import {
    consumePlayerSearchFocus,
    focusPlayerSearchInput,
    readPlayerNavExpanded,
    requestPlayerHomeReset,
    requestPlayerSearchFocus,
    restorePlayerHomeScrollWhenReady,
    stashPlayerHomeScroll,
    writePlayerNavExpanded,
} from './playerMemory';
import type { PlayerItem, PlayerPlayOptions, PlayerPlaySession, PlayerSection } from './types';

type PlayerPersonRef = { id: string; name: string; thumb?: string | null };
type LibraryTab = 'home' | 'browse' | 'collections';

type PlayerView =
    | { kind: 'home' }
    | { kind: 'library'; sectionKey: string; tab: LibraryTab }
    | { kind: 'collection'; sectionKey: string; ratingKey: string }
    | { kind: 'playlist'; ratingKey: string }
    | { kind: 'item'; ratingKey: string }
    | { kind: 'person'; actorId: string; name?: string; thumb?: string | null }
    | { kind: 'studio'; studioKey: string; name?: string; sectionKey?: string; mediaType?: 'movie' | 'show' }
    | { kind: 'settings' };

type PendingResume = {
    item: PlayerItem;
    offsetMs: number;
    mediaIndex?: number;
    audioStreamId?: string | null;
    subtitleStreamId?: string | null;
};

const readPlayerView = (): PlayerView => {
    const href = typeof window !== 'undefined' ? window.location : { pathname: PLAYER_APP_BASE, search: '' };
    const parts = stripBasePath(href.pathname)
        .split('/')
        .filter(Boolean);
    const params = new URLSearchParams(href.search || '');
    if (parts[1] === 'library' && parts[2]) {
        if (parts[3] === 'collection' && parts[4]) {
            return { kind: 'collection', sectionKey: parts[2], ratingKey: parts[4] };
        }
        const tab = parts[3] === 'browse' || parts[3] === 'collections' ? parts[3] : 'home';
        return { kind: 'library', sectionKey: parts[2], tab };
    }
    if (parts[1] === 'collection' && parts[2]) {
        return { kind: 'collection', sectionKey: '', ratingKey: parts[2] };
    }
    if (parts[1] === 'playlist' && parts[2]) {
        return { kind: 'playlist', ratingKey: parts[2] };
    }
    if (parts[1] === 'settings') return { kind: 'settings' };
    if (parts[1] === 'item' && parts[2]) return { kind: 'item', ratingKey: parts[2] };
    if (parts[1] === 'person' && parts[2]) {
        return {
            kind: 'person',
            actorId: decodeURIComponent(parts[2]),
            name: params.get('name') || '',
            thumb: params.get('thumb') || '',
        };
    }
    if (parts[1] === 'studio' && parts[2]) {
        return {
            kind: 'studio',
            studioKey: decodeURIComponent(parts[2]),
            name: params.get('name') || '',
            sectionKey: params.get('section') || '',
            mediaType: params.get('type') === 'movie' ? 'movie' : params.get('type') === 'show' ? 'show' : undefined,
        };
    }
    return { kind: 'home' };
};

const libraryPath = (sectionKey: string, tab: LibraryTab = 'home') => (
    tab === 'home'
        ? `${PLAYER_APP_BASE}/library/${encodeURIComponent(sectionKey)}`
        : `${PLAYER_APP_BASE}/library/${encodeURIComponent(sectionKey)}/${tab}`
);

export const MediaPlayerDashboard: React.FC = () => {
    const { t } = useDiscoverI18n();
    const [settings] = usePlayerSettings();
    const [view, setView] = useState<PlayerView>(() => readPlayerView());
    const [libraries, setLibraries] = useState<PlayerSection[]>([]);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [playSession, setPlaySession] = useState<PlayerPlaySession | null>(null);
    const [playNextQueue, setPlayNextQueue] = useState<PlayerItem[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [startingPlay, setStartingPlay] = useState(false);
    const [pendingResume, setPendingResume] = useState<PendingResume | null>(null);
    const [navExpanded, setNavExpanded] = useState(() => {
        try {
            if (typeof window !== 'undefined' && (window.__PLEX_CLIENT__?.isTv || document.documentElement?.dataset?.tv === '1')) {
                return false;
            }
        } catch {
            /* ignore */
        }
        return readPlayerNavExpanded();
    });
    const [keepHome, setKeepHome] = useState(() => view.kind === 'home');
    const viewKindRef = useRef(view.kind);

    const syncFromLocation = useCallback(() => {
        setView(readPlayerView());
    }, []);

    useEffect(() => {
        try {
            if (window.__PLEX_CLIENT__?.isTv || document.documentElement?.dataset?.tv === '1') {
                setNavExpanded(false);
            }
        } catch {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        const previous = viewKindRef.current;
        viewKindRef.current = view.kind;
        if (view.kind === 'home') setKeepHome(true);
        if (previous === 'home' && view.kind !== 'home') stashPlayerHomeScroll();
        if (view.kind !== 'home' || previous === 'home') return undefined;
        return restorePlayerHomeScrollWhenReady();
    }, [view.kind]);

    useEffect(() => {
        window.addEventListener('popstate', syncFromLocation);
        window.addEventListener(PLAYER_NAVIGATE_EVENT, syncFromLocation);
        return () => {
            window.removeEventListener('popstate', syncFromLocation);
            window.removeEventListener(PLAYER_NAVIGATE_EVENT, syncFromLocation);
        };
    }, [syncFromLocation]);

    useEffect(() => {
        let cancelled = false;
        fetchMediaPlayerLibraries()
            .then((data) => {
                if (!cancelled) setLibraries(data.libraries || []);
            })
            .catch(() => {
                if (!cancelled) setLibraries([]);
            });
        fetchMediaPlayerMe()
            .then((me) => {
                if (!cancelled) setIsAdmin(Boolean(me?.isAdmin));
            })
            .catch(() => {
                if (!cancelled) setIsAdmin(false);
            });
        return () => { cancelled = true; };
    }, []);

    const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToasts((prev) => appendToast(prev, message, type));
    }, []);

    const enqueuePlayNext = useCallback((item: PlayerItem) => {
        if (!item?.ratingKey) return;
        setPlayNextQueue((prev) => {
            const without = prev.filter((row) => row.ratingKey !== item.ratingKey);
            return [item, ...without];
        });
    }, []);

    const consumePlayNext = useCallback(() => {
        setPlayNextQueue((prev) => prev.slice(1));
    }, []);

    const navigate = useCallback((path: string) => {
        // Stay on the Capacitor/WebView origin. portalUrl() is absolute to the SMP host
        // and breaks history.pushState (cross-origin) so poster clicks never open overview.
        window.history.pushState({}, '', path);
        setView(readPlayerView());
        window.dispatchEvent(new Event(PLAYER_NAVIGATE_EVENT));
    }, []);

    const openItem = useCallback((item: PlayerItem) => {
        if (!item?.ratingKey) return;
        if (item.type === 'collection') {
            const section = String(item.librarySectionID || '').trim();
            if (section) {
                navigate(`${PLAYER_APP_BASE}/library/${encodeURIComponent(section)}/collection/${encodeURIComponent(item.ratingKey)}`);
            } else {
                navigate(`${PLAYER_APP_BASE}/collection/${encodeURIComponent(item.ratingKey)}`);
            }
            return;
        }
        if (item.type === 'playlist') {
            navigate(`${PLAYER_APP_BASE}/playlist/${encodeURIComponent(item.ratingKey)}`);
            return;
        }
        navigate(`${PLAYER_APP_BASE}/item/${encodeURIComponent(item.ratingKey)}`);
    }, [navigate]);

    const openLibrary = useCallback((section: PlayerSection, tab: LibraryTab = 'home') => {
        if (!section?.key) return;
        navigate(libraryPath(section.key, tab));
    }, [navigate]);

    const openCollection = useCallback((sectionKey: string, item: PlayerItem) => {
        if (!item?.ratingKey) return;
        navigate(`${PLAYER_APP_BASE}/library/${encodeURIComponent(sectionKey)}/collection/${encodeURIComponent(item.ratingKey)}`);
    }, [navigate]);

    const openPerson = useCallback((person: PlayerPersonRef) => {
        const actorId = String(person?.id || person?.name || '').trim();
        if (!actorId) return;
        const qs = new URLSearchParams();
        if (person.name) qs.set('name', person.name);
        if (person.thumb) qs.set('thumb', person.thumb);
        const suffix = qs.toString() ? `?${qs}` : '';
        navigate(`${PLAYER_APP_BASE}/person/${encodeURIComponent(actorId)}${suffix}`);
    }, [navigate]);

    const openStudio = useCallback((studio: { key: string; name: string; sectionKey?: string; mediaType?: 'movie' | 'show' }) => {
        const studioKey = String(studio?.key || studio?.name || '').trim();
        if (!studioKey) return;
        const qs = new URLSearchParams();
        if (studio.name) qs.set('name', studio.name);
        if (studio.sectionKey) qs.set('section', studio.sectionKey);
        if (studio.mediaType) qs.set('type', studio.mediaType);
        const suffix = qs.toString() ? `?${qs}` : '';
        navigate(`${PLAYER_APP_BASE}/studio/${encodeURIComponent(studioKey)}${suffix}`);
    }, [navigate]);

    const goHome = useCallback(() => {
        requestPlayerHomeReset();
        navigate(PLAYER_APP_BASE);
    }, [navigate]);

    const openSearch = useCallback(() => {
        requestPlayerSearchFocus();
        if (view.kind !== 'home') navigate(PLAYER_APP_BASE);
        window.setTimeout(() => {
            if (focusPlayerSearchInput()) consumePlayerSearchFocus();
        }, 80);
    }, [navigate, view.kind]);

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
            const tag = String((event.target as HTMLElement | null)?.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
            event.preventDefault();
            openSearch();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [openSearch]);

    const goBack = useCallback(() => {
        if (window.history.length > 1) window.history.back();
        else goHome();
    }, [goHome]);

    const startPlayback = useCallback(async (item: PlayerItem, opts: PlayerPlayOptions = {}) => {
        setStartingPlay(true);
        setPendingResume(null);
        try {
            const session = await startMediaPlayerPlayback(item.ratingKey, {
                offsetMs: opts.offsetMs,
                qualityId: opts.qualityId || settings.defaultQualityId,
                mediaIndex: opts.mediaIndex,
                audioLanguage: settings.audioLanguage,
                subtitleMode: settings.subtitleMode,
                audioStreamId: opts.audioStreamId,
                subtitleStreamId: opts.subtitleStreamId,
            });
            setPlaySession(session);
        } catch (error: any) {
            setToasts((prev) => appendToast(prev, String(error?.message || t('mediaPlayerPage.playError')), 'error'));
        } finally {
            setStartingPlay(false);
        }
    }, [settings.audioLanguage, settings.defaultQualityId, settings.subtitleMode, t]);

    const playItem = useCallback(async (item: PlayerItem, opts: PlayerPlayOptions = {}) => {
        if (item?.type === 'playlist' && item.ratingKey) {
            navigate(`${PLAYER_APP_BASE}/playlist/${encodeURIComponent(item.ratingKey)}`);
            return;
        }
        if (!item?.canPlay || !item.ratingKey) {
            setToasts((prev) => appendToast(prev, t('mediaPlayerPage.notPlayable'), 'error'));
            return;
        }
        const playableType = item.type === 'movie' || item.type === 'episode' || item.type === 'clip' || item.type === 'trailer';
        if (!opts.skipResume && playableType && shouldOfferResume(item, opts.offsetMs)) {
            setPendingResume({
                item,
                offsetMs: opts.offsetMs == null ? Number(item.viewOffsetMs || 0) : Number(opts.offsetMs),
                mediaIndex: opts.mediaIndex,
                audioStreamId: opts.audioStreamId,
                subtitleStreamId: opts.subtitleStreamId,
            });
            return;
        }
        await startPlayback(item, opts);
    }, [navigate, startPlayback, t]);

    const openSettings = useCallback(() => navigate(`${PLAYER_APP_BASE}/settings`), [navigate]);
    const toggleNavExpanded = useCallback(() => {
        setNavExpanded((current) => {
            const next = !current;
            writePlayerNavExpanded(next);
            return next;
        });
    }, []);
    const navPage = view.kind === 'home'
        ? 'home'
        : view.kind === 'settings'
            ? 'settings'
            : view.kind === 'library' || view.kind === 'collection'
                ? 'library'
                : 'other';
    const activeLibraryKey = view.kind === 'library' || view.kind === 'collection' ? view.sectionKey : undefined;

    return (
        <div className="relative flex h-full min-h-0 w-full flex-col">
            <MediaPlayerNav
                libraries={libraries}
                libraryOrder={settings.libraryNavOrder}
                page={navPage}
                activeLibraryKey={activeLibraryKey}
                expanded={navExpanded}
                onToggleExpanded={toggleNavExpanded}
                onHome={goHome}
                onSearch={openSearch}
                onOpenLibrary={openLibrary}
                onOpenSettings={openSettings}
            />
            <div
                id={PLAYER_SCROLL_ID}
                className={`min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-clip px-4 py-4 md:py-6 md:pr-6 ${
                    typeof document !== 'undefined' && document.documentElement?.dataset?.tv === '1'
                        ? 'hide-scrollbar'
                        : 'custom-scrollbar'
                } ${
                    navExpanded ? 'md:pl-[18.25rem]' : 'md:pl-[6.5rem]'
                } ${playSession ? 'pb-36' : ''}`}
            >
                <div className="mx-auto flex w-full max-w-[2400px] flex-col gap-4">
            {keepHome ? (
                <div className={view.kind === 'home' ? '' : 'hidden'} hidden={view.kind !== 'home'}>
                    <MediaPlayerHome
                        active={view.kind === 'home'}
                        onOpenItem={openItem}
                        onPlay={playItem}
                        onOpenLibrary={openLibrary}
                        onPlayNext={enqueuePlayNext}
                        onToast={notify}
                        isAdmin={isAdmin}
                        playlistsEnabled={settings.showPlaylists}
                    />
                </div>
            ) : null}
            {view.kind === 'settings' ? (
                <MediaPlayerSettings onBack={goHome} isAdmin={isAdmin} />
            ) : null}
            {view.kind === 'library' ? (
                <MediaPlayerLibrary
                    sectionKey={view.sectionKey}
                    tab={view.tab}
                    onBack={goHome}
                    onOpenItem={openItem}
                    onOpenLibrary={openLibrary}
                    onOpenCollection={openCollection}
                    onChangeTab={(tab) => navigate(libraryPath(view.sectionKey, tab))}
                    onPlay={playItem}
                    onPlayNext={enqueuePlayNext}
                    onToast={notify}
                    isAdmin={isAdmin}
                    playlistsEnabled={settings.showPlaylists}
                />
            ) : null}
            {view.kind === 'collection' ? (
                <MediaPlayerCollection
                    ratingKey={view.ratingKey}
                    sectionKey={view.sectionKey}
                    onBack={() => (
                        view.sectionKey
                            ? navigate(libraryPath(view.sectionKey, 'collections'))
                            : goBack()
                    )}
                    onOpenItem={openItem}
                    onPlay={playItem}
                />
            ) : null}
            {view.kind === 'playlist' ? (
                <MediaPlayerPlaylist
                    ratingKey={view.ratingKey}
                    onBack={goHome}
                    onOpenItem={openItem}
                    onPlay={playItem}
                />
            ) : null}
            {view.kind === 'item' ? (
                <MediaPlayerDetails
                    ratingKey={view.ratingKey}
                    onBack={goBack}
                    onOpenItem={openItem}
                    onOpenPerson={openPerson}
                    onOpenStudio={openStudio}
                    onPlay={playItem}
                    playing={startingPlay}
                    playbackActive={Boolean(playSession)}
                />
            ) : null}
            {view.kind === 'person' ? (
                <MediaPlayerPerson
                    actorId={view.actorId}
                    name={view.name}
                    thumb={view.thumb}
                    onBack={goBack}
                    onOpenItem={openItem}
                    onPlay={playItem}
                />
            ) : null}
            {view.kind === 'studio' ? (
                <MediaPlayerStudio
                    studioKey={view.studioKey}
                    name={view.name}
                    sectionKey={view.sectionKey}
                    mediaType={view.mediaType}
                    onBack={goBack}
                    onOpenItem={openItem}
                    onPlay={playItem}
                />
            ) : null}
            {pendingResume ? (
                <div className="fixed inset-0 z-[3500] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
                    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-card p-5 shadow-2xl">
                        <p className="text-xs font-black uppercase tracking-widest text-muted">{t('mediaPlayerPage.resumeTitle')}</p>
                        <h2 className="mt-2 text-lg font-bold text-text">{pendingResume.item.title}</h2>
                        <p className="mt-1 text-sm text-muted">
                            {t('mediaPlayerPage.resumeFrom', { time: formatClock(pendingResume.offsetMs) })}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => void startPlayback(pendingResume.item, {
                                    offsetMs: pendingResume.offsetMs,
                                    mediaIndex: pendingResume.mediaIndex,
                                    audioStreamId: pendingResume.audioStreamId,
                                    subtitleStreamId: pendingResume.subtitleStreamId,
                                    skipResume: true,
                                })}
                                className="rounded-xl bg-plex px-4 py-2.5 text-sm font-black text-black"
                            >
                                {t('mediaPlayerPage.resume')}
                            </button>
                            <button
                                type="button"
                                onClick={() => void startPlayback(pendingResume.item, {
                                    offsetMs: 0,
                                    mediaIndex: pendingResume.mediaIndex,
                                    audioStreamId: pendingResume.audioStreamId,
                                    subtitleStreamId: pendingResume.subtitleStreamId,
                                    skipResume: true,
                                })}
                                className="rounded-xl border border-border bg-white/5 px-4 py-2.5 text-sm font-bold text-text"
                            >
                                {t('mediaPlayerPage.startOver')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setPendingResume(null)}
                                className="rounded-xl px-4 py-2.5 text-sm font-bold text-muted hover:text-text"
                            >
                                {t('common.close')}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
            {playSession ? (
                <MediaPlayerVideo
                    session={playSession}
                    onClose={() => setPlaySession(null)}
                    autoplayNext={settings.autoplayNext}
                    autoSkipIntro={settings.autoSkipIntro}
                    autoSkipCredits={settings.autoSkipCredits}
                    playNextQueue={playNextQueue}
                    onConsumePlayNext={consumePlayNext}
                    onPlayItem={playItem}
                />
            ) : null}
            <ToastContainer toasts={toasts} setToasts={setToasts} />
                </div>
            </div>
        </div>
    );
};
