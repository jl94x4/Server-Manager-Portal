import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { getBasePath } from '../shared/basePath';
import { api } from './api';
import { CollexionsSubnav } from './CollexionsSubnav';
import Dashboard from './pages/Dashboard';
import Gallery from './pages/Gallery';
import Creator from './pages/Creator';
import JobsPage from './pages/Jobs';
import StatsPage from './pages/Stats';
import ConfigPage from './pages/Config';
import LogsPage from './pages/Logs';
import Onboarding from './pages/Onboarding';

const Shell: React.FC = () => (
    <div className="animate-fade-in">
        <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-text tracking-tight">Collexions</h1>
            <p className="text-sm text-muted mt-1">Manage automated Plex collections from the portal</p>
        </div>
        <CollexionsSubnav />
        <Outlet />
    </div>
);

const CollexionsRoutes: React.FC = () => {
    const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
    const [bootError, setBootError] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const status = await api.getAuthStatus();
                if (!cancelled) setNeedsOnboarding(!!status.needs_onboarding);
            } catch (e: any) {
                if (!cancelled) {
                    setBootError(e?.message || 'Collexions sidecar is unreachable. Check Settings → Collexions.');
                    setNeedsOnboarding(false);
                }
            }
        })();
        const onDone = () => setNeedsOnboarding(false);
        window.addEventListener('collexions-onboarding-done', onDone);
        return () => {
            cancelled = true;
            window.removeEventListener('collexions-onboarding-done', onDone);
        };
    }, []);

    if (needsOnboarding === null) {
        return (
            <div className="flex h-64 items-center justify-center text-muted flex-col gap-3">
                <div className="w-8 h-8 border-2 border-border border-t-plex rounded-full animate-spin" />
                <p className="text-sm">Connecting to Collexions…</p>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="onboarding" element={<Onboarding />} />
            <Route element={<Shell />}>
                <Route
                    index
                    element={
                        needsOnboarding
                            ? <Navigate to="onboarding" replace />
                            : (
                                <>
                                    {bootError && (
                                        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-3 text-sm">
                                            {bootError}
                                        </div>
                                    )}
                                    <Dashboard />
                                </>
                            )
                    }
                />
                <Route path="gallery" element={<Gallery />} />
                <Route path="creator" element={<Creator />} />
                <Route path="jobs" element={<JobsPage />} />
                <Route path="stats" element={<StatsPage />} />
                <Route path="config" element={<ConfigPage />} />
                <Route path="logs" element={<LogsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export const CollexionsDashboard: React.FC = () => {
    const basename = `${getBasePath()}/collexions`.replace(/\/+/g, '/') || '/collexions';
    return (
        <BrowserRouter basename={basename}>
            <CollexionsRoutes />
        </BrowserRouter>
    );
};
