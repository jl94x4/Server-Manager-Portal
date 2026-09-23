import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DiscoverI18nProvider } from '../discovery/i18n';
import { MediaPlayerDashboard } from '../media-player/MediaPlayerDashboard';
import { prefetchMediaPlayerHome } from '../media-player/api';
import { PLAYER_APP_BASE, PLAYER_LOGOUT_EVENT } from '../media-player/paths';
import { apiFetch } from '../shared/api';
import { PlexClientAuthScreen, PlexClientBootSplash } from './AuthScreen';
import {
    bootstrapPlexClientConfig,
    clearPlexClientSession,
    detectAndApplyTvUi,
    getSessionToken,
    isAndroidTvUi,
} from './config';
import { installNativeMediaPlayerBridge } from './nativePlayer';
import { useTvRemote } from './useTvRemote';

const ensurePlayerRoute = () => {
    try {
        const path = window.location.pathname || '/';
        if (path === '/' || path === '') {
            window.history.replaceState({}, '', PLAYER_APP_BASE);
        }
    } catch {
        /* ignore */
    }
};

const PlexClientApp: React.FC = () => {
    const [ready, setReady] = useState(false);
    const [authed, setAuthed] = useState(false);
    const [checking, setChecking] = useState(true);
    const [tvReady, setTvReady] = useState(false);

    useTvRemote(ready && tvReady);

    useEffect(() => {
        let cancelled = false;
        const boot = async () => {
            bootstrapPlexClientConfig();
            const tv = await detectAndApplyTvUi();
            if (cancelled) return;
            setTvReady(tv || isAndroidTvUi());
            installNativeMediaPlayerBridge();
            setReady(true);
            const token = getSessionToken();
            if (!token) {
                setChecking(false);
                return;
            }
            try {
                const data = await apiFetch('/api/auth/session');
                if (cancelled) return;
                if (data?.authenticated) {
                    ensurePlayerRoute();
                    prefetchMediaPlayerHome();
                    setAuthed(true);
                } else clearPlexClientSession();
            } catch {
                if (!cancelled) clearPlexClientSession();
            } finally {
                if (!cancelled) setChecking(false);
            }
        };
        void boot();
        return () => { cancelled = true; };
    }, []);

    const onAuthenticated = useCallback(() => {
        ensurePlayerRoute();
        prefetchMediaPlayerHome();
        setAuthed(true);
    }, []);

    useEffect(() => {
        const onLogout = () => {
            void apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
            clearPlexClientSession();
            setAuthed(false);
        };
        window.addEventListener(PLAYER_LOGOUT_EVENT, onLogout);
        return () => window.removeEventListener(PLAYER_LOGOUT_EVENT, onLogout);
    }, []);

    if (!ready || checking) {
        return <PlexClientBootSplash />;
    }

    if (!authed) {
        return <PlexClientAuthScreen onAuthenticated={onAuthenticated} />;
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            <MediaPlayerDashboard />
        </div>
    );
};

const container = document.getElementById('root');
if (container) {
    createRoot(container).render(
        <DiscoverI18nProvider>
            <PlexClientApp />
        </DiscoverI18nProvider>,
    );
}
