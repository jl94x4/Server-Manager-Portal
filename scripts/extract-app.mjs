import fs from 'fs';

const lines = fs.readFileSync('index.tsx', 'utf8').split(/\r?\n/);

const sharedImports = `import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Home, Film, Activity, Sparkles, LogOut, Settings, FileText, BarChart3, Users, PlaySquare, TrendingUp, X, Star, Layers, HardDrive, Calendar, Tv, Clock, DownloadCloud, MonitorSmartphone, Copy, ChevronUp, ChevronDown, List, Palette, Music, Play, Shield, CheckCircle, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Trophy, PlayCircle, Coffee, Compass, PieChart, Clapperboard, AlertTriangle, Check, Cpu, Monitor, LineChart as LucideLineChart } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';

import { SettingsDashboard } from './settings/SettingsDashboard';
import { LibraryMaintenancePanel } from './maintenance/LibraryMaintenancePanel';
import { appConfirm } from './shared/confirm';
import { apiFetch } from './shared/api';
import { formatDate, getDaysUntilExpiry, addMonths, addYears, formatTime, formatEventName, formatDateTime, hexToRgb } from './shared/format';
import { CustomSelect, ConfirmModal, StyledCheckbox } from './shared/ui';
import { Loader, ToastContainer, pushToast } from './shared/toast';
import type { User, PlexConfig, AppSettings, PlexServer, ToastMessage, DeletedUser, AuditEntry, UserStatus } from './shared/types';

declare global {
    interface Window {
        __USE_24_HOUR_CLOCK__?: boolean;
    }
}

`;

const exportNames = [
    'updateFavicon',
    'Login',
    'PublicInviteClaim',
    'StatusDashboard',
    'LibraryDashboard',
    'MaintenanceDashboard',
    'LogsDashboard',
    'MediaStackDashboard',
    'AnalyticsDashboard',
    'AdminDashboard',
    'UserDashboard',
    'Navigation',
];

let screensBody = lines.slice(19, 7059).join('\n');
for (const name of exportNames) {
    screensBody = screensBody.replace(
        new RegExp(`^(const ${name}(?::|\\s))`, 'm'),
        'export $1'
    );
}

fs.writeFileSync('client/screens.tsx', sharedImports + screensBody);

const appImports = `import React, { useState, useEffect, useCallback } from 'react';
import { SettingsDashboard } from './settings/SettingsDashboard';
import { bindAppConfirm } from './shared/confirm';
import { apiFetch } from './shared/api';
import { hexToRgb } from './shared/format';
import { ConfirmModal } from './shared/ui';
import { Loader } from './shared/toast';
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

`;

const appBody = lines.slice(7060, 7231).join('\n').replace(/^const MainApp/, 'export const MainApp');
fs.writeFileSync('client/App.tsx', appImports + appBody);

const entry = `import { createRoot } from 'react-dom/client';
import { MainApp } from './client/App';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<MainApp />);
`;

fs.writeFileSync('index.tsx', entry);
console.log('screens.tsx lines:', (sharedImports + screensBody).split('\n').length);
console.log('App.tsx lines:', (appImports + appBody).split('\n').length);
console.log('index.tsx lines:', entry.split('\n').length);
