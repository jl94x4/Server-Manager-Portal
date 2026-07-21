import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Image,
    Sparkles,
    Clock,
    BarChart3,
    Settings,
    ScrollText,
} from 'lucide-react';

const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/gallery', label: 'Gallery', icon: Image },
    { to: '/creator', label: 'Creator', icon: Sparkles },
    { to: '/jobs', label: 'Jobs', icon: Clock },
    { to: '/stats', label: 'Stats', icon: BarChart3 },
    { to: '/config', label: 'Config', icon: Settings },
    { to: '/logs', label: 'Logs', icon: ScrollText },
];

export const CollexionsSubnav: React.FC = () => (
    <nav className="flex gap-1 overflow-x-auto no-scrollbar border-b border-border pb-2 mb-4 -mx-1 px-1">
        {navItems.map((item) => {
            const Icon = item.icon;
            return (
                <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                            isActive
                                ? 'bg-plex text-background'
                                : 'text-muted hover:text-text hover:bg-white/5'
                        }`
                    }
                >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                </NavLink>
            );
        })}
    </nav>
);
