
import React from 'react';
import { Theme } from '../types';

interface HeaderProps {
  isAdmin: boolean;
  theme: Theme;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ isAdmin, theme, toggleTheme }) => {
  return (
    <header className="h-16 border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-4 md:px-8 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-40 transition-colors sticky top-0">
      <div className="flex items-center space-x-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)] status-pulse"></div>
            <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Grid Nominal</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
          title="Toggle Theme"
        >
          <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-xs`}></i>
        </button>

        <div className="hidden lg:flex items-center bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-500/20 text-xs font-semibold">
          <i className="fa-solid fa-code-branch mr-2 opacity-70"></i>
          v1.0.4
        </div>
        
        <div className="flex items-center space-x-3 border-l border-slate-200 dark:border-white/10 pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900 dark:text-white">{isAdmin ? 'Administrator' : 'Guest User'}</p>
          </div>
          <div className={`w-8 h-8 rounded-full p-0.5 shadow-sm ${isAdmin ? 'bg-gradient-to-tr from-indigo-600 to-cyan-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
            <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center border border-white/10">
              <i className={`fa-solid ${isAdmin ? 'fa-user-shield text-indigo-600 text-xs' : 'fa-user text-slate-400 text-xs'}`}></i>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
