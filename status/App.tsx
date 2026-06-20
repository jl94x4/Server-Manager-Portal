
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { INITIAL_GROUPS } from './constants.tsx';
import { Service, ServiceHealth, Theme, SystemAnnouncement, Group } from './types.ts';
import Dashboard from './components/Dashboard.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('subzero_theme');
    if (saved) return saved as Theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [configLoaded, setConfigLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [announcement, setAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [healthData, setHealthData] = useState<Record<string, ServiceHealth>>({});

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('nexus_admin_session') === 'active';
  });

  // Load Full State (Config + Global Health)
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setServices(data.config.services || []);
        setGroups(data.config.groups || INITIAL_GROUPS);
        setAnnouncement(data.config.announcement || null);
        setHealthData(data.healthData || {});
        setConfigLoaded(true);
        setLoadError(null);
      } else {
        setLoadError(`Server returned ${res.status}`);
      }
    } catch (e) {
      console.error("Failed to fetch global status", e);
      setLoadError("Cannot connect to API server");
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Autosave Config (Admin only)
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (!configLoaded || !isAdmin) return;
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const saveConfig = async () => {
      try {
        await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ services, groups, announcement })
        });
      } catch (e) {
        console.error("Failed to save config", e);
      }
    };

    const timeout = setTimeout(saveConfig, 1000);
    return () => clearTimeout(timeout);
  }, [services, groups, announcement, configLoaded, isAdmin]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('subzero_theme', nextTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const handleLogin = (pass: string) => {
    if (pass === 'JB22051608lml.') {
      setIsAdmin(true);
      localStorage.setItem('nexus_admin_session', 'active');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('nexus_admin_session');
  };

  if (!configLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-950 p-6 text-center">
        {!loadError ? (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        ) : (
          <div className="max-w-xs">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Connection Error</h2>
            <p className="text-slate-500 text-sm mb-6">{loadError}. Please check if the backend server is running.</p>
            <button 
              onClick={() => { setLoadError(null); fetchStatus(); }}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-sm transition-all"
            >
              Retry Connection
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <HashRouter>
      <div className={`flex flex-col md:flex-row min-h-screen md:h-screen md:overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500/30 transition-colors duration-300`}>
        <Sidebar isAdmin={isAdmin} onLogout={handleLogout} onLogin={handleLogin} />
        
        <main className="flex-1 flex flex-col md:h-full relative">
          <Header isAdmin={isAdmin} theme={theme} toggleTheme={toggleTheme} />
          
          <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8 md:overflow-y-auto md:scrollbar-hide">
            <Routes>
              <Route path="/" element={<Dashboard services={services} groups={groups} healthData={healthData} announcement={announcement} />} />
              <Route 
                path="/admin" 
                element={isAdmin ? <AdminPanel services={services} setServices={setServices} groups={groups} setGroups={setGroups} announcement={announcement} setAnnouncement={setAnnouncement} /> : <Navigate to="/" replace />} 
              />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
