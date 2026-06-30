import fs from 'fs';

const settingsImport = `import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Copy, ChevronUp, ChevronDown } from 'lucide-react';
import { apiFetch } from '../shared/api';
import { appConfirm } from '../shared/confirm';
import { CustomSelect } from '../shared/ui';
import { Loader, ToastContainer, pushToast, type ToastMessage } from '../shared/toast';
import { SettingHint } from './SettingHint';
import type { User, AuditEntry, DeletedUser } from '../shared/types';
import { formatDateTime, formatEventName, hexToRgb, getDaysUntilExpiry, addMonths, addYears, formatDate } from '../shared/format';
`;

const settingHintImport = `import React, { useEffect, useRef } from 'react';
`;

function wrap(file, header, extra = '') {
  let body = fs.readFileSync(file, 'utf8');
  body = body.replace(/^const InvitesSettings/m, 'export const InvitesSettings');
  body = body.replace(/^const StreamKillRulesPanel/m, 'export const StreamKillRulesPanel');
  body = body.replace(/^const SettingsDashboard/m, 'export const SettingsDashboard');
  body = body.replace(/^const StatusMonitorSettings/m, 'export const StatusMonitorSettings');
  body = body.replace(/^const BroadcastSettingsTab/m, 'export const BroadcastSettingsTab');
  body = body.replace(/^const SettingHint/m, 'export const SettingHint');
  fs.writeFileSync(file, header + extra + body);
}

wrap('client/settings/SettingHint.tsx', settingHintImport);
wrap('client/settings/InvitesSettings.tsx', settingsImport);
wrap('client/settings/StreamKillRulesPanel.tsx', settingsImport);

const statusImport = settingsImport
  .replace("import { Loader, ToastContainer, pushToast, type ToastMessage } from '../shared/toast';\n", '')
  .replace("import { SettingHint } from './SettingHint';\n", '');
wrap('client/settings/StatusMonitorSettings.tsx', statusImport);

const broadcastImport = settingsImport
  .replace("import { Loader, ToastContainer, pushToast, type ToastMessage } from '../shared/toast';\n", '')
  .replace("import { SettingHint } from './SettingHint';\n", '')
  .replace("import { appConfirm } from '../shared/confirm';\n", '');
wrap('client/settings/BroadcastSettingsTab.tsx', broadcastImport);

wrap('client/settings/SettingsDashboard.tsx', settingsImport, `
import { StreamKillRulesPanel } from './StreamKillRulesPanel';
import { InvitesSettings } from './InvitesSettings';
import { StatusMonitorSettings } from './StatusMonitorSettings';
import { BroadcastSettingsTab } from './BroadcastSettingsTab';
`);

const lines = fs.readFileSync('index.tsx', 'utf8').split(/\r?\n/);
const removeRanges = [[564, 752], [755, 966], [1616, 3647]];
const remove = new Set();
for (const [a, b] of removeRanges) {
  for (let i = a; i <= b; i++) remove.add(i);
}
const kept = lines.filter((_, idx) => !remove.has(idx + 1));

const importBlock = `
import { SettingsDashboard } from './client/settings/SettingsDashboard';
import { bindAppConfirm } from './client/shared/confirm';
import { apiFetch } from './client/shared/api';
import { formatDate, getDaysUntilExpiry, addMonths, addYears, formatTime, formatEventName, formatDateTime, hexToRgb } from './client/shared/format';
import { CustomSelect, ConfirmModal, StyledCheckbox } from './client/shared/ui';
import { Loader, ToastContainer, pushToast } from './client/shared/toast';
import type { User, PlexConfig, AppSettings, PlexServer, ToastMessage, DeletedUser, AuditEntry, UserStatus } from './client/shared/types';
`;

const insertAt = kept.findIndex((l) => l.startsWith('declare global'));
const out = kept.slice(0, insertAt).join('\n') + importBlock + kept.slice(insertAt).join('\n');

let cleaned = out
  .replace(/interface CustomSelectProps[\s\S]*?^};\n\nimport ReactDOM/m, 'import ReactDOM')
  .replace(/const CustomSelect:[\s\S]*?^};\n\nconst StyledCheckbox/m, '')
  .replace(/const StyledCheckbox:[\s\S]*?^};\n\n\nconst hexToRgb/m, '')
  .replace(/const hexToRgb[\s\S]*?export let appConfirm[\s\S]*?^};\n\n\/\/ --- Interfaces ---/m, '// --- Interfaces ---')
  .replace(/interface User[\s\S]*?type UserStatus = 'active' \| 'expiring' \| 'expired';\n\n\/\/ --- Helper Functions ---/m, '// --- Helper Functions ---')
  .replace(/const formatDate[\s\S]*?const updateFavicon/m, 'const updateFavicon')
  .replace(/interface ToastMessage[\s\S]*?^};\n\ninterface DeletedUser/m, 'interface DeletedUser')
  .replace(/const MAX_VISIBLE_TOASTS[\s\S]*?type UserStatus = 'active' \| 'expiring' \| 'expired';\n\n\/\/ --- Helper Functions ---/m, '// --- Helper Functions ---\n')
  .replace(/interface DeletedUser[\s\S]*?type UserStatus = 'active' \| 'expiring' \| 'expired';\n\n\/\/ --- Helper Functions ---/m, '// --- Helper Functions ---')
  .replace(/const Loader:[\s\S]*?^};\n\nconst SettingsIcon/m, 'const SettingsIcon')
  .replace(/const Toast:[\s\S]*?^};\n\nconst ToastContainer[\s\S]*?^};\n\nconst SettingsIcon/m, 'const SettingsIcon')
  .replace(/export let appConfirm:[\s\S]*?^};\n\nconst ConfirmModal[\s\S]*?^};\n\n\/\/ --- Interfaces ---/m, '// --- Interfaces ---')
  .replace(
    /        appConfirm = \(message, onConfirm\) => \{\n            setConfirmState\(\{ isOpen: true, message, onConfirm \}\);\n        };/,
    '        bindAppConfirm((message, onConfirm) => {\n            setConfirmState({ isOpen: true, message, onConfirm });\n        });'
  );

fs.writeFileSync('index.tsx', cleaned);
console.log('index.tsx lines:', cleaned.split('\n').length);
