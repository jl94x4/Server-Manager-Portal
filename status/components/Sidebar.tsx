
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isAdmin: boolean;
  onLogout: () => void;
  onLogin: (pass: string) => boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isAdmin, onLogout, onLogin }) => {
  const location = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin(password)) {
      setShowLoginModal(false);
      setPassword('');
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <>
      {/* Sidebar for Desktop / Bottom Bar for Mobile */}
      <aside className="fixed bottom-0 left-0 right-0 h-16 md:relative md:h-screen md:w-64 bg-white dark:bg-slate-950 border-t md:border-t-0 md:border-r border-slate-200 dark:border-white/5 flex md:flex-col items-center md:items-stretch py-0 md:py-8 space-y-0 md:space-y-8 z-50 transition-colors">
        <div className="hidden md:flex px-6 items-center space-x-3 mb-4">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <i className="fa-solid fa-snowflake text-lg text-white"></i>
          </div>
          <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">SubZero</span>
        </div>

        <nav className="flex-1 flex md:block px-2 md:px-4 items-center justify-around w-full md:space-y-1">
          <Link 
            to="/" 
            className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all ${
              isActive('/') 
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-semibold' 
              : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 font-medium'
            }`}
          >
            <i className="fa-solid fa-chart-line w-5 text-center text-sm"></i>
            <span className="hidden md:block text-sm">Dashboard</span>
          </Link>

          {isAdmin ? (
            <Link 
              to="/admin" 
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all ${
                isActive('/admin') 
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-semibold' 
                : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 font-medium'
              }`}
            >
              <i className="fa-solid fa-gears w-5 text-center text-sm"></i>
              <span className="hidden md:block text-sm">Admin Panel</span>
            </Link>
          ) : (
            <button 
              onClick={() => setShowLoginModal(true)}
              className="flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 font-medium w-full"
            >
              <i className="fa-solid fa-lock w-5 text-center text-sm"></i>
              <span className="hidden md:block text-sm text-left">Authorize</span>
            </button>
          )}

          {isAdmin && (
            <button 
              onClick={onLogout}
              className="md:hidden flex items-center space-x-3 px-4 py-2 rounded-lg text-slate-500 hover:text-rose-500"
            >
              <i className="fa-solid fa-right-from-bracket w-5 text-center"></i>
            </button>
          )}
        </nav>

        <div className="hidden md:block px-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-white/5">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Session</p>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${isAdmin ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}>
                {isAdmin ? 'System Root' : 'Public Access'}
              </span>
              {isAdmin && (
                <button onClick={onLogout} className="text-slate-400 hover:text-rose-500 transition-colors" title="Logout">
                  <i className="fa-solid fa-right-from-bracket text-xs"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/10 p-8 shadow-2xl transition-colors">
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Authentication</h3>
            <p className="text-sm text-slate-500 mb-6">Enter administrative passkey to configure nodes.</p>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <input 
                autoFocus
                type="password" 
                placeholder="Passkey"
                className={`w-full bg-slate-50 dark:bg-slate-800 border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white`}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              {error && <p className="text-rose-500 text-xs font-semibold">Incorrect passkey provided.</p>}
              <div className="flex space-x-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 py-3 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 text-white"
                >
                  Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
