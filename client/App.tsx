import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SettingsDashboard } from './settings/SettingsDashboard';
import { bindAppConfirm } from './shared/confirm';
import { apiFetch } from './shared/api';
import { getPublicOrigin, portalUrl, resolvePortalAssetUrl, stripBasePath } from './shared/basePath';
import { ConfirmModal } from './shared/ui';
import { Loader } from './shared/toast';
import { AppAmbientBackground } from './shared/theme';

import {
    updateFavicon,
    Login,
    PublicInviteClaim,
    StatusDashboard,
    LibraryDashboard,
    MaintenanceDashboard,
    LogsDashboard,
    MediaStackDashboard,
    AnalyticsDashboard,
    AdminDashboard,
    UserDashboard,
    Navigation,
} from './screens';

export const MainApp: React.FC = () => {
    const [confirmState, setConfirmState] = useState<{ isOpen: boolean, message: string, onConfirm: () => void }>({ isOpen: false, message: '', onConfirm: () => { } });

    const [activeTheme, setActiveTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('portal-theme') || 'plex';
        }
        return 'plex';
    });

    useEffect(() => {
        bindAppConfirm((message, onConfirm) => {
            setConfirmState({ isOpen: true, message, onConfirm });
        });
    }, []);


    const closeConfirm = () => setConfirmState(s => ({ ...s, isOpen: false }));
    const handleConfirm = () => {
        confirmState.onConfirm();
        closeConfirm();
    };

    const [currentRoute, setCurrentRoute] = useState<'login' | 'admin' | 'user' | 'users' | 'status' | 'dashboard' | 'settings' | 'logs' | 'analytics' | 'mediastack' | 'maintenance' | 'invite' | 'loading'>('loading');
    const [sessionInfo, setSessionInfo] = useState<any>(null);
    const [publicConfig, setPublicConfig] = useState<any>({});

    const fetchPublicConfig = useCallback(async () => {
        try {
            const data = await apiFetch('/api/config/public');
            window.__USE_24_HOUR_CLOCK__ = data.use24HourClock === true;
            if (typeof data.basePath === 'string') {
                window.__BASE_PATH__ = data.basePath;
            }
            setPublicConfig(data);

            if (data.customLogoUrl) {
                updateFavicon(data.customLogoUrl);
            }
        } catch (e) { }
    }, []);

    const lastBrandingTheme = useRef<string | null>(null);

    useEffect(() => {
        if (!publicConfig.brandingTheme) return;

        if (lastBrandingTheme.current === null) {
            // First time config loads - respect user's localStorage choice if any
            const theme = localStorage.getItem('portal-theme') || publicConfig.brandingTheme || 'plex';
            setActiveTheme(theme);
            lastBrandingTheme.current = publicConfig.brandingTheme;
        } else if (publicConfig.brandingTheme !== lastBrandingTheme.current) {
            // Default theme setting was changed (e.g. saved in Settings) - override local theme
            setActiveTheme(publicConfig.brandingTheme);
            localStorage.setItem('portal-theme', publicConfig.brandingTheme);
            lastBrandingTheme.current = publicConfig.brandingTheme;
        }
    }, [publicConfig.brandingTheme]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', activeTheme);
        localStorage.setItem('portal-theme', activeTheme);
        document.documentElement.style.removeProperty('--color-plex');
        document.documentElement.style.removeProperty('--color-plex-hover');
    }, [activeTheme]);

    useEffect(() => {
        if (publicConfig?.useBrandedSkeleton !== false) {
            document.documentElement.classList.add('branded-skeleton');
        } else {
            document.documentElement.classList.remove('branded-skeleton');
        }
    }, [publicConfig?.useBrandedSkeleton]);

    useEffect(() => {
        fetchPublicConfig();
    }, [fetchPublicConfig]);

    useEffect(() => {
        if (currentRoute === 'status' && !sessionInfo && publicConfig?.showPublicStatusMonitor === false) {
            setCurrentRoute('login');
            window.history.replaceState({}, '', portalUrl('/'));
        }
    }, [currentRoute, publicConfig?.showPublicStatusMonitor, sessionInfo]);

    useEffect(() => {
        const onPublicConfigUpdated = () => { fetchPublicConfig(); };
        window.addEventListener('portal-public-config-updated', onPublicConfigUpdated);
        return () => window.removeEventListener('portal-public-config-updated', onPublicConfigUpdated);
    }, [fetchPublicConfig]);

    const setRoute = useCallback((route: 'login' | 'admin' | 'user' | 'users' | 'status' | 'dashboard' | 'settings' | 'logs' | 'analytics' | 'mediastack' | 'maintenance' | 'invite' | 'loading', options?: { hash?: string }) => {
        if (route === 'logs') {
            setCurrentRoute('settings');
            window.history.pushState({}, '', portalUrl('/settings#logs'));
            return;
        }
        setCurrentRoute(route);
        if (route !== 'loading' && route !== 'invite') {
            let path = '/';
            if (route === 'admin') path = '/admin';
            if (route === 'users') path = '/users';
            if (route === 'user') path = '/portal';
            if (route === 'status') path = '/status';
            if (route === 'dashboard') path = '/dashboard';
            if (route === 'settings') path = '/settings#branding';
            if (route === 'analytics') path = '/analytics';
            if (route === 'mediastack') path = '/mediastack';
            if (route === 'maintenance') path = '/maintenance';
            if (options?.hash) path += options.hash;
            window.history.pushState({}, '', portalUrl(path));
        }
    }, []);

    const checkSession = useCallback(async () => {
        const path = stripBasePath(window.location.pathname);
        if (path.startsWith('/invite/')) {
            setCurrentRoute('invite');
            return;
        }
        const params = new URLSearchParams(window.location.search);
        const loginError = params.get('loginError');
        if (loginError) {
            setCurrentRoute('login');
            return;
        }

        if (path.startsWith('/auth/')) {
            setCurrentRoute('login');
            return;
        }

        try {
            const data = await apiFetch('/api/users/me');
            setSessionInfo(data);
            if (data.serverName) document.title = `${data.serverName} Portal`;
            if (path === '/status') setCurrentRoute('status');
            else if (path === '/dashboard') setCurrentRoute('dashboard');
            else if (path === '/settings' && data.session.isAdmin) setCurrentRoute('settings');
            else if (path === '/logs' && data.session.isAdmin) {
                window.history.replaceState({}, '', portalUrl('/settings#logs'));
                setCurrentRoute('settings');
            }
            else if (path === '/mediastack') setCurrentRoute('mediastack');
            else if (path === '/maintenance' && data.session.isAdmin) setCurrentRoute('maintenance');
            else if (path === '/analytics') setCurrentRoute('analytics');
            else if (path === '/admin' || path === '/users') {
                if (data.session.isAdmin && !data.impersonation?.active) setCurrentRoute('users');
                else {
                    window.history.replaceState({}, '', portalUrl('/portal'));
                    setCurrentRoute('user');
                }
            }
            else if (path === '/portal') setCurrentRoute('user');
            else {
                window.history.replaceState({}, '', portalUrl('/portal'));
                setCurrentRoute('user');
            }
        } catch {
            if (path === '/status' && publicConfig?.showPublicStatusMonitor !== false) setCurrentRoute('status');
            else if (path === '/dashboard') setCurrentRoute('dashboard');
            else setCurrentRoute('login');
        }
    }, [publicConfig?.showPublicStatusMonitor]);

    useEffect(() => {
        // Initial session check
        checkSession();
    }, [checkSession]);

    useEffect(() => {
        const onPopState = () => {
            checkSession();
        };
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, [checkSession]);

    const handleLogout = async () => {
        await apiFetch('/api/auth/logout', { method: 'POST' });
        setSessionInfo(null);
        setRoute('login');
    };

    const handleStopImpersonation = async () => {
        try {
            await apiFetch('/api/admin/stop-impersonation', { method: 'POST' });
            await checkSession();
            setRoute('users');
        } catch (e) {
            console.error('Failed to stop impersonation', e);
        }
    };

    const handleViewAsUser = async (userId: string) => {
        try {
            await apiFetch(`/api/admin/impersonate/${encodeURIComponent(userId)}`, { method: 'POST' });
            await checkSession();
            setRoute('user');
        } catch (e) {
            console.error('Failed to impersonate user', e);
            throw e;
        }
    };

    if (currentRoute === 'loading') return <Loader isLoading={true} isCinematic={!!publicConfig?.useCinematicLoading} />;
    if (currentRoute === 'login') {
        const initialLoginError = typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('loginError')
            : null;
        return <Login onLoginSuccess={checkSession} publicConfig={publicConfig} initialError={initialLoginError || undefined} />;
    }

    const isAdmin = !!sessionInfo?.session?.isAdmin;
    const isImpersonating = !!sessionInfo?.impersonation?.active;

    const isPublicStatus = currentRoute === 'status' && !sessionInfo;
    const isPublicInvite = currentRoute === 'invite';
    const isPublicView = isPublicStatus || isPublicInvite;

    const renderView = () => {
        if (currentRoute === 'invite') {
            const code = stripBasePath(window.location.pathname).split('/')[2];
            return <PublicInviteClaim code={code} />;
        }
        if (currentRoute === 'status') return <StatusDashboard onBack={() => isPublicStatus ? setRoute('login') : setRoute('user')} isAdmin={isAdmin} isPublic={isPublicStatus} />;
        if (currentRoute === 'dashboard') return <LibraryDashboard onBack={() => setRoute('user')} isAdmin={isAdmin} publicConfig={publicConfig} mediaServerType={sessionInfo?.mediaServerType} onViewAnalytics={(hash) => setRoute('analytics', { hash })} />;
        if (currentRoute === 'settings' && isAdmin) return <SettingsDashboard />;
        if (currentRoute === 'maintenance' && isAdmin) return <MaintenanceDashboard />;
        if (currentRoute === 'logs' && isAdmin) return <LogsDashboard onLogout={handleLogout} />;
        if (currentRoute === 'mediastack') return <MediaStackDashboard isAdmin={isAdmin} />;
        if (currentRoute === 'analytics') return <AnalyticsDashboard isAdmin={isAdmin} sessionInfo={sessionInfo} />;
        if (currentRoute === 'admin' || currentRoute === 'users') return <AdminDashboard onLogout={handleLogout} onViewUserPortal={() => setRoute('user')} onViewStatus={() => setRoute('status')} onViewDashboard={() => setRoute('dashboard')} onViewAsUser={handleViewAsUser} />;
        return <UserDashboard sessionInfo={sessionInfo} publicConfig={publicConfig} onLogout={handleLogout} refreshSession={checkSession} onViewAdmin={() => setRoute('users')} onViewStatus={() => setRoute('status')} onViewDashboard={() => setRoute('dashboard')} onViewSettings={() => setRoute('settings')} onViewLogs={() => setRoute('logs')} />;
    };

    return (
        <div className="relative flex w-full min-h-screen md:h-dvh md:overflow-hidden">
            <AppAmbientBackground backgroundImageUrl={publicConfig?.backgroundImageUrl} />
            <ConfirmModal isOpen={confirmState.isOpen} message={confirmState.message} onConfirm={handleConfirm} onCancel={closeConfirm} />
            {!isPublicView && <Navigation currentRoute={currentRoute} onNavigate={setRoute as any} onLogout={handleLogout} isAdmin={isAdmin} serverName={sessionInfo?.serverName || 'Server Portal'} adminThumb={sessionInfo?.adminThumb} customLogoUrl={publicConfig?.customLogoUrl} requestUrl={sessionInfo?.requestUrl || 'https://yourdomain.com'} navOrder={sessionInfo?.navOrder || ['home', 'discover', 'status', 'analytics', 'mediastack', 'maintenance', 'request', 'settings', 'logout']} navFeatures={sessionInfo?.navFeatures} appVersion={publicConfig.appVersion} activeTheme={activeTheme} setActiveTheme={setActiveTheme} />}
            <div className={`relative z-10 flex-1 min-w-0 min-h-0 flex flex-col items-center px-4 pb-[80px] md:px-8 md:pb-8 overflow-x-visible md:overflow-y-auto custom-scrollbar ${isPublicView ? '!pb-8' : ''}`}>
                {isImpersonating && (
                    <div className="w-full max-w-[100%] pt-20 md:pt-0 md:sticky md:top-0 md:z-30">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-100 shadow-lg backdrop-blur-md">
                            <p className="text-sm font-medium">
                                Viewing portal as <span className="font-bold text-white">{sessionInfo?.impersonation?.targetUsername || sessionInfo?.session?.username}</span>
                            </p>
                            <button
                                type="button"
                                onClick={handleStopImpersonation}
                                className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-50 text-sm font-bold hover:bg-amber-500/30 transition-colors whitespace-nowrap"
                            >
                                Exit impersonation
                            </button>
                        </div>
                    </div>
                )}
                <div className={`w-full min-w-0 max-w-[100%] ${isImpersonating ? 'pt-3 md:pt-4' : 'pt-20 md:pt-8'}`}>
                    {renderView()}
                </div>

                {/* Mobile Bottom Version */}
                {!isPublicView && publicConfig?.appVersion && (
                    <div className="md:hidden mt-auto pt-12 pb-4 w-full text-center text-[10px] text-white/30 font-mono tracking-widest pointer-events-none">
                        {publicConfig.appVersion}
                    </div>
                )}
            </div>
        </div>
    );
};
