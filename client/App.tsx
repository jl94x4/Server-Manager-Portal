import React, { useState, useEffect, useCallback } from 'react';
import { SettingsDashboard } from './settings/SettingsDashboard';
import { bindAppConfirm } from './shared/confirm';
import { apiFetch } from './shared/api';
import { hexToRgb } from './shared/format';
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
    const [contentMaxWidth, setContentMaxWidth] = useState<string>('100%');

    useEffect(() => {
        bindAppConfirm((message, onConfirm) => {
            setConfirmState({ isOpen: true, message, onConfirm });
        });
    }, []);

    useEffect(() => {
        const updateResponsiveContentWidth = () => {
            const screenWidth = window.screen?.width || window.innerWidth;
            const screenHeight = window.screen?.height || window.innerHeight;
            const screenRatio = screenWidth / Math.max(1, screenHeight);
            const wideThreshold = (16 / 9) + 0.03;

            if (screenRatio > wideThreshold) {
                setContentMaxWidth(`${Math.round(screenHeight * (16 / 9))}px`);
            } else {
                setContentMaxWidth('100%');
            }
        };

        updateResponsiveContentWidth();
        window.addEventListener('resize', updateResponsiveContentWidth);
        return () => window.removeEventListener('resize', updateResponsiveContentWidth);
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
            setPublicConfig(data);
            if (data.primaryColor) {
                document.documentElement.style.setProperty('--color-plex', hexToRgb(data.primaryColor));
            }
            if (data.customLogoUrl) {
                updateFavicon(data.customLogoUrl);
            }
        } catch (e) { }
    }, []);

    useEffect(() => {
        fetchPublicConfig();
    }, [fetchPublicConfig]);

    useEffect(() => {
        const onPublicConfigUpdated = () => { fetchPublicConfig(); };
        window.addEventListener('portal-public-config-updated', onPublicConfigUpdated);
        return () => window.removeEventListener('portal-public-config-updated', onPublicConfigUpdated);
    }, [fetchPublicConfig]);

    const setRoute = useCallback((route: 'login' | 'admin' | 'user' | 'users' | 'status' | 'dashboard' | 'settings' | 'logs' | 'analytics' | 'mediastack' | 'maintenance' | 'invite' | 'loading') => {
        if (route === 'logs') {
            setCurrentRoute('settings');
            window.history.pushState({}, '', '/settings#logs');
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
            window.history.pushState({}, '', path);
        }
    }, []);

    const checkSession = useCallback(async () => {
        const path = window.location.pathname;
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
                window.history.replaceState({}, '', '/settings#logs');
                setCurrentRoute('settings');
            }
            else if (path === '/mediastack') setCurrentRoute('mediastack');
            else if (path === '/maintenance' && data.session.isAdmin) setCurrentRoute('maintenance');
            else if (path === '/analytics') setCurrentRoute('analytics');
            else if (path === '/settings' && !data.session.isAdmin) setCurrentRoute('user');
            else if (path === '/portal') setCurrentRoute('user');
            else if (path === '/admin') setCurrentRoute('users');
            else if (path === '/users') setCurrentRoute('users');
            else {
                // If at root or unknown, push to default route
                window.history.replaceState({}, '', '/portal');
                setCurrentRoute('user');
            }
        } catch {
            if (path === '/status') setCurrentRoute('status');
            else if (path === '/dashboard') setCurrentRoute('dashboard');
            else setCurrentRoute('login');
        }
    }, []);

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

    if (currentRoute === 'loading') return <Loader isLoading={true} />;
    if (currentRoute === 'login') {
        const initialLoginError = typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('loginError')
            : null;
        return <Login onLoginSuccess={checkSession} publicConfig={publicConfig} initialError={initialLoginError || undefined} />;
    }

    const isAdmin = !!sessionInfo?.session?.isAdmin;

    const isPublicStatus = currentRoute === 'status' && !sessionInfo;
    const isPublicInvite = currentRoute === 'invite';
    const isPublicView = isPublicStatus || isPublicInvite;

    const renderView = () => {
        if (currentRoute === 'invite') {
            const code = window.location.pathname.split('/')[2];
            return <PublicInviteClaim code={code} />;
        }
        if (currentRoute === 'status') return <StatusDashboard onBack={() => isPublicStatus ? setRoute('login') : setRoute('user')} isAdmin={isAdmin} isPublic={isPublicStatus} />;
        if (currentRoute === 'dashboard') return <LibraryDashboard onBack={() => setRoute('user')} isAdmin={isAdmin} publicConfig={publicConfig} />;
        if (currentRoute === 'settings' && isAdmin) return <SettingsDashboard />;
        if (currentRoute === 'maintenance' && isAdmin) return <MaintenanceDashboard />;
        if (currentRoute === 'logs' && isAdmin) return <LogsDashboard onLogout={handleLogout} />;
        if (currentRoute === 'mediastack') return <MediaStackDashboard isAdmin={isAdmin} />;
        if (currentRoute === 'analytics') return <AnalyticsDashboard isAdmin={isAdmin} sessionInfo={sessionInfo} />;
        if (currentRoute === 'admin' || currentRoute === 'users') return <AdminDashboard onLogout={handleLogout} onViewUserPortal={() => setRoute('user')} onViewStatus={() => setRoute('status')} onViewDashboard={() => setRoute('dashboard')} />;
        return <UserDashboard sessionInfo={sessionInfo} publicConfig={publicConfig} onLogout={handleLogout} refreshSession={checkSession} onViewAdmin={() => setRoute('users')} onViewStatus={() => setRoute('status')} onViewDashboard={() => setRoute('dashboard')} onViewSettings={() => setRoute('settings')} onViewLogs={() => setRoute('logs')} />;
    };

    return (
        <div className="relative flex w-full min-h-screen overflow-x-clip">
            <AppAmbientBackground />
            <ConfirmModal isOpen={confirmState.isOpen} message={confirmState.message} onConfirm={handleConfirm} onCancel={closeConfirm} />
            {!isPublicView && <Navigation currentRoute={currentRoute} onNavigate={setRoute as any} onLogout={handleLogout} isAdmin={isAdmin} serverName={sessionInfo?.serverName || 'Server Portal'} adminThumb={sessionInfo?.adminThumb} requestUrl={sessionInfo?.requestUrl || 'https://yourdomain.com'} navOrder={sessionInfo?.navOrder || ['home', 'discover', 'status', 'analytics', 'mediastack', 'maintenance', 'request', 'settings', 'logout']} appVersion={publicConfig.appVersion} />}
            <div className={`relative z-10 flex-1 min-w-0 flex flex-col items-center px-4 pt-20 pb-[80px] md:p-8 md:pt-8 md:pb-8 overflow-x-visible ${isPublicView ? '!pt-8 !pb-8' : ''}`}>
                <div className="w-full min-w-0" style={{ maxWidth: contentMaxWidth }}>
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