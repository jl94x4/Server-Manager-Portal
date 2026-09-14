import React, { useCallback, useEffect, useState } from 'react';
import { portalUrl, stripBasePath } from '../shared/basePath';
import { ToastContainer, pushToast as appendToast, type ToastMessage } from '../shared/toast';
import { useDiscoverI18n } from '../discovery/i18n';
import { startMediaPlayerPlayback } from './api';
import { MediaPlayerHome } from './MediaPlayerHome';
import { MediaPlayerLibrary } from './MediaPlayerLibrary';
import { MediaPlayerDetails } from './MediaPlayerDetails';
import { MediaPlayerPerson } from './MediaPlayerPerson';
import { MediaPlayerVideo } from './MediaPlayerVideo';
import type { PlayerItem, PlayerPlaySession, PlayerSection } from './types';

type PlayerPersonRef = { id: string; name: string; thumb?: string | null };

type PlayerView =
    | { kind: 'home' }
    | { kind: 'library'; sectionKey: string }
    | { kind: 'item'; ratingKey: string }
    | { kind: 'person'; actorId: string; name?: string; thumb?: string | null };

const readPlayerView = (): PlayerView => {
    const href = typeof window !== 'undefined' ? window.location : { pathname: '/media-player', search: '' };
    const parts = stripBasePath(href.pathname)
        .split('/')
        .filter(Boolean);
    const params = new URLSearchParams(href.search || '');
    if (parts[1] === 'library' && parts[2]) return { kind: 'library', sectionKey: parts[2] };
    if (parts[1] === 'item' && parts[2]) return { kind: 'item', ratingKey: parts[2] };
    if (parts[1] === 'person' && parts[2]) {
        return {
            kind: 'person',
            actorId: decodeURIComponent(parts[2]),
            name: params.get('name') || '',
            thumb: params.get('thumb') || '',
        };
    }
    return { kind: 'home' };
};

export const MediaPlayerDashboard: React.FC = () => {
    const { t } = useDiscoverI18n();
    const [view, setView] = useState<PlayerView>(() => readPlayerView());
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [playSession, setPlaySession] = useState<PlayerPlaySession | null>(null);
    const [startingPlay, setStartingPlay] = useState(false);

    const syncFromLocation = useCallback(() => {
        setView(readPlayerView());
    }, []);

    useEffect(() => {
        window.addEventListener('popstate', syncFromLocation);
        window.addEventListener('portal-media-player-navigate', syncFromLocation);
        return () => {
            window.removeEventListener('popstate', syncFromLocation);
            window.removeEventListener('portal-media-player-navigate', syncFromLocation);
        };
    }, [syncFromLocation]);

    const navigate = useCallback((path: string) => {
        window.history.pushState({}, '', portalUrl(path));
        setView(readPlayerView());
        window.dispatchEvent(new Event('portal-media-player-navigate'));
    }, []);

    const openItem = useCallback((item: PlayerItem) => {
        if (!item?.ratingKey) return;
        navigate(`/media-player/item/${encodeURIComponent(item.ratingKey)}`);
    }, [navigate]);

    const openLibrary = useCallback((section: PlayerSection) => {
        if (!section?.key) return;
        navigate(`/media-player/library/${encodeURIComponent(section.key)}`);
    }, [navigate]);

    const openPerson = useCallback((person: PlayerPersonRef) => {
        const actorId = String(person?.id || person?.name || '').trim();
        if (!actorId) return;
        const qs = new URLSearchParams();
        if (person.name) qs.set('name', person.name);
        if (person.thumb) qs.set('thumb', person.thumb);
        const suffix = qs.toString() ? `?${qs}` : '';
        navigate(`/media-player/person/${encodeURIComponent(actorId)}${suffix}`);
    }, [navigate]);

    const goHome = useCallback(() => navigate('/media-player'), [navigate]);

    const goBack = useCallback(() => {
        if (window.history.length > 1) window.history.back();
        else goHome();
    }, [goHome]);

    const playItem = useCallback(async (item: PlayerItem) => {
        if (!item?.canPlay || !item.ratingKey) {
            setToasts((prev) => appendToast(prev, t('mediaPlayerPage.notPlayable'), 'error'));
            return;
        }
        setStartingPlay(true);
        try {
            const session = await startMediaPlayerPlayback(item.ratingKey, item.viewOffsetMs || 0);
            setPlaySession(session);
        } catch (error: any) {
            setToasts((prev) => appendToast(prev, String(error?.message || t('mediaPlayerPage.playError')), 'error'));
        } finally {
            setStartingPlay(false);
        }
    }, [t]);

    return (
        <div className="flex flex-col gap-4">
            {view.kind === 'home' ? (
                <MediaPlayerHome onOpenItem={openItem} onOpenLibrary={openLibrary} />
            ) : null}
            {view.kind === 'library' ? (
                <MediaPlayerLibrary
                    sectionKey={view.sectionKey}
                    onBack={goHome}
                    onOpenItem={openItem}
                    onOpenLibrary={openLibrary}
                />
            ) : null}
            {view.kind === 'item' ? (
                <MediaPlayerDetails
                    ratingKey={view.ratingKey}
                    onBack={goBack}
                    onOpenItem={openItem}
                    onOpenPerson={openPerson}
                    onPlay={playItem}
                    playing={startingPlay}
                />
            ) : null}
            {view.kind === 'person' ? (
                <MediaPlayerPerson
                    actorId={view.actorId}
                    name={view.name}
                    thumb={view.thumb}
                    onBack={goBack}
                    onOpenItem={openItem}
                />
            ) : null}
            {playSession ? (
                <MediaPlayerVideo session={playSession} onClose={() => setPlaySession(null)} />
            ) : null}
            <ToastContainer toasts={toasts} setToasts={setToasts} />
        </div>
    );
};
