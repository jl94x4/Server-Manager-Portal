import fs from 'fs';

const lines = fs.readFileSync('index.tsx', 'utf8').split(/\r?\n/);
const body = lines.slice(243, 890).join('\n').replace(/^const LibraryMaintenancePanel/m, 'export const LibraryMaintenancePanel');
const header = `import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '../shared/api';
import { appConfirm } from '../shared/confirm';
import { CustomSelect, StyledCheckbox } from '../shared/ui';

`;
fs.mkdirSync('client/maintenance', { recursive: true });
fs.writeFileSync('client/maintenance/LibraryMaintenancePanel.tsx', header + body);

const kept = [...lines.slice(0, 243), ...lines.slice(890)];
const importLine = "import { LibraryMaintenancePanel } from './client/maintenance/LibraryMaintenancePanel';";
const insertAt = kept.findIndex((l) => l.startsWith('import { SettingsDashboard'));
if (insertAt >= 0) {
  kept.splice(insertAt + 1, 0, importLine);
}
fs.writeFileSync('index.tsx', kept.join('\n'));
console.log('index.tsx lines:', kept.length);
