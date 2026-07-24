/**
 * Best-effort Autoscan config.yml → portal scanner config.
 * Supports a minimal YAML subset (key: value, lists, nested maps) without a YAML dependency.
 */

const stripQuotes = (s) => {
    const t = String(s || '').trim();
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
        return t.slice(1, -1);
    }
    return t;
};

/**
 * Very small YAML parser for Autoscan-style configs.
 * Not a general YAML implementation — enough for typical autoscan config.yml.
 */
export const parseSimpleYaml = (text) => {
    const lines = String(text || '').split(/\r?\n/);
    const root = {};
    const stack = [{ indent: -1, obj: root, kind: 'map' }];

    const current = () => stack[stack.length - 1];

    for (let rawLine of lines) {
        if (!rawLine.trim() || rawLine.trim().startsWith('#')) continue;
        // Drop inline comments when preceded by space
        const hash = rawLine.search(/\s#/);
        if (hash >= 0) rawLine = rawLine.slice(0, hash);

        const indent = rawLine.match(/^\s*/)[0].length;
        const line = rawLine.trim();
        if (!line) continue;

        while (stack.length > 1 && indent <= current().indent) stack.pop();
        const parent = current();

        if (line.startsWith('- ')) {
            const rest = line.slice(2).trim();
            if (!Array.isArray(parent.obj)) {
                // convert placeholder
                continue;
            }
            if (rest.includes(':') && !rest.startsWith('"') && !rest.startsWith("'")) {
                const idx = rest.indexOf(':');
                const key = rest.slice(0, idx).trim();
                const val = rest.slice(idx + 1).trim();
                const item = {};
                if (val === '' || val === '|' || val === '>') {
                    item[key] = {};
                    parent.obj.push(item);
                    stack.push({ indent, obj: item[key], kind: 'map' });
                } else {
                    item[key] = coerce(stripQuotes(val));
                    parent.obj.push(item);
                    stack.push({ indent, obj: item, kind: 'map' });
                }
            } else if (rest === '') {
                const item = {};
                parent.obj.push(item);
                stack.push({ indent, obj: item, kind: 'map' });
            } else {
                parent.obj.push(coerce(stripQuotes(rest)));
            }
            continue;
        }

        const idx = line.indexOf(':');
        if (idx < 0) continue;
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();

        if (!parent.obj || Array.isArray(parent.obj)) continue;

        if (val === '' || val === '|' || val === '>') {
            // Look ahead — if next non-empty is list, make array
            parent.obj[key] = {};
            stack.push({ indent, obj: parent.obj[key], kind: 'map', key, parentObj: parent.obj });
        } else {
            parent.obj[key] = coerce(stripQuotes(val));
        }
    }

    // Second pass: promote empty maps that should be arrays based on structure we already built
    return root;
};

const coerce = (v) => {
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (v === 'null' || v === '~') return null;
    if (/^\d+$/.test(v)) return Number(v);
    return v;
};

/**
 * Re-parse with a line-oriented approach that handles Autoscan lists better.
 */
export const parseAutoscanYaml = (text) => {
    const lines = String(text || '').split(/\r?\n/);
    const result = {
        minimumAge: '1m',
        authUsername: '',
        authPassword: '',
        triggers: { sonarr: [], radarr: [], lidarr: [] },
        targets: { plex: [], jellyfin: [], emby: [] },
    };

    let section = null; // processor | auth | triggers | targets
    let triggerKind = null;
    let currentTrigger = null;
    let targetKind = null;
    let currentTarget = null;
    let rewriteOwner = null; // trigger | target
    let inRewrite = false;

    const finishTrigger = () => {
        if (currentTrigger && triggerKind && result.triggers[triggerKind]) {
            result.triggers[triggerKind].push(currentTrigger);
        }
        currentTrigger = null;
        inRewrite = false;
    };
    const finishTarget = () => {
        if (currentTarget && targetKind && result.targets[targetKind]) {
            result.targets[targetKind].push(currentTarget);
        }
        currentTarget = null;
        inRewrite = false;
    };

    for (let raw of lines) {
        const trimmed = raw.replace(/\s+#.*$/, '').trimEnd();
        if (!trimmed.trim() || trimmed.trim().startsWith('#')) continue;
        const indent = trimmed.match(/^\s*/)[0].length;
        const line = trimmed.trim();

        if (indent === 0 && line.endsWith(':') && !line.startsWith('-')) {
            finishTrigger();
            finishTarget();
            const key = line.slice(0, -1);
            if (key === 'triggers') { section = 'triggers'; triggerKind = null; continue; }
            if (key === 'targets') { section = 'targets'; targetKind = null; continue; }
            if (key === 'authentication') { section = 'auth'; continue; }
            section = key;
            continue;
        }

        if (line.startsWith('minimum-age:')) {
            result.minimumAge = stripQuotes(line.slice('minimum-age:'.length));
            continue;
        }

        if (section === 'auth') {
            if (line.startsWith('username:')) result.authUsername = stripQuotes(line.slice('username:'.length));
            if (line.startsWith('password:')) result.authPassword = stripQuotes(line.slice('password:'.length));
            continue;
        }

        if (section === 'triggers') {
            if (indent === 2 && line.endsWith(':') && !line.startsWith('-')) {
                finishTrigger();
                triggerKind = line.slice(0, -1);
                if (!result.triggers[triggerKind]) result.triggers[triggerKind] = [];
                continue;
            }
            if (line.startsWith('- name:') || line.startsWith('-name:')) {
                finishTrigger();
                currentTrigger = {
                    name: stripQuotes(line.replace(/^-\s*name:\s*/, '')),
                    priority: 0,
                    rewrite: [],
                };
                rewriteOwner = 'trigger';
                inRewrite = false;
                continue;
            }
            if (line.startsWith('- ') && triggerKind && !currentTrigger) {
                // nameless list item start
                currentTrigger = { name: triggerKind, priority: 0, rewrite: [] };
                rewriteOwner = 'trigger';
            }
            if (!currentTrigger) continue;
            if (line.startsWith('name:')) currentTrigger.name = stripQuotes(line.slice(5));
            if (line.startsWith('priority:')) currentTrigger.priority = Number(stripQuotes(line.slice(9))) || 0;
            if (line === 'rewrite:' || line.startsWith('rewrite:')) {
                inRewrite = true;
                rewriteOwner = 'trigger';
                continue;
            }
            if (inRewrite && rewriteOwner === 'trigger' && line.startsWith('- from:')) {
                currentTrigger.rewrite.push({ from: stripQuotes(line.slice('- from:'.length)), to: '' });
                continue;
            }
            if (inRewrite && rewriteOwner === 'trigger' && line.startsWith('to:') && currentTrigger.rewrite.length) {
                currentTrigger.rewrite[currentTrigger.rewrite.length - 1].to = stripQuotes(line.slice(3));
                continue;
            }
            if (inRewrite && rewriteOwner === 'trigger' && line.startsWith('- to:')) {
                // uncommon
                continue;
            }
            continue;
        }

        if (section === 'targets') {
            if (indent === 2 && line.endsWith(':') && !line.startsWith('-')) {
                finishTarget();
                targetKind = line.slice(0, -1);
                if (!result.targets[targetKind]) result.targets[targetKind] = [];
                continue;
            }
            if (line.startsWith('- url:') || (line.startsWith('- ') && line.includes('url:'))) {
                finishTarget();
                currentTarget = {
                    enabled: true,
                    usePortalCredentials: false,
                    url: stripQuotes(line.replace(/^-\s*url:\s*/, '')),
                    token: '',
                    apiKey: '',
                    rewrite: [],
                };
                rewriteOwner = 'target';
                inRewrite = false;
                continue;
            }
            if (!currentTarget && line.startsWith('- ')) {
                currentTarget = {
                    enabled: true,
                    usePortalCredentials: false,
                    url: '',
                    token: '',
                    apiKey: '',
                    rewrite: [],
                };
                rewriteOwner = 'target';
            }
            if (!currentTarget) continue;
            if (line.startsWith('url:')) currentTarget.url = stripQuotes(line.slice(4));
            if (line.startsWith('token:')) {
                currentTarget.token = stripQuotes(line.slice(6));
                currentTarget.apiKey = currentTarget.token;
            }
            if (line === 'rewrite:' || line.startsWith('rewrite:')) {
                inRewrite = true;
                rewriteOwner = 'target';
                continue;
            }
            if (inRewrite && rewriteOwner === 'target' && line.startsWith('- from:')) {
                currentTarget.rewrite.push({ from: stripQuotes(line.slice('- from:'.length)), to: '' });
                continue;
            }
            if (inRewrite && rewriteOwner === 'target' && line.startsWith('to:') && currentTarget.rewrite.length) {
                currentTarget.rewrite[currentTarget.rewrite.length - 1].to = stripQuotes(line.slice(3));
            }
        }
    }
    finishTrigger();
    finishTarget();

    // Normalize unused kinds to defaults if empty
    for (const kind of ['sonarr', 'radarr', 'lidarr']) {
        if (!result.triggers[kind]?.length) {
            result.triggers[kind] = [{ name: kind, priority: 1, rewrite: [] }];
        }
    }
    if (!result.targets.plex.length) {
        result.targets.plex = [{ enabled: true, usePortalCredentials: true, url: '', token: '', rewrite: [] }];
    } else {
        // Prefer portal Plex Settings for URL/token; import only rewrites from Autoscan.
        result.targets.plex = result.targets.plex.map((t) => ({
            enabled: true,
            usePortalCredentials: true,
            url: '',
            token: '',
            rewrite: t.rewrite || [],
        }));
    }
    for (const kind of ['jellyfin', 'emby']) {
        if (!result.targets[kind]?.length) {
            result.targets[kind] = [{ enabled: false, usePortalCredentials: true, url: '', apiKey: '', rewrite: [] }];
        } else {
            result.targets[kind] = result.targets[kind].map((t) => ({
                enabled: true,
                usePortalCredentials: false,
                url: t.url || '',
                apiKey: t.apiKey || t.token || '',
                rewrite: t.rewrite || [],
            }));
        }
    }

    return {
        minimumAge: result.minimumAge || '1m',
        verifyPathExists: false,
        authUsername: result.authUsername,
        authPassword: result.authPassword,
        triggers: result.triggers,
        targets: result.targets,
    };
};

// Keep parseSimpleYaml exported for tests but prefer parseAutoscanYaml
export { parseSimpleYaml as _parseSimpleYaml };
