import fs from 'fs';
import { execSync } from 'child_process';

const normalizeSha = (sha) => {
    if (!sha) return '';
    const trimmed = String(sha).trim();
    const withoutPrefix = trimmed.replace(/^v1\.0\.0-/i, '');
    return withoutPrefix.slice(0, 7);
};

const resolveBuildVersion = () => {
    const fromEnv = normalizeSha(process.env.GIT_SHA || process.env.GITHUB_SHA || '');
    if (fromEnv) return fromEnv;

    try {
        return execSync('git rev-parse --short HEAD', { stdio: 'pipe' }).toString().trim();
    } catch {
        return `build-${Date.now()}`;
    }
};

const assetVersion = resolveBuildVersion();
fs.writeFileSync('version.txt', `v1.0.0-${assetVersion}`);

try {
    const indexPath = 'index.html';
    const html = fs.readFileSync(indexPath, 'utf8');
    const stamped = html
        .replace(/(?:\/)?static\/tailwind\.css\?v=[^"']+/g, `static/tailwind.css?v=${assetVersion}`)
        .replace(/(?:\/)?static\/bundle\.js\?v=[^"']+/g, `static/bundle.js?v=${assetVersion}`);
    fs.writeFileSync(indexPath, stamped);
} catch (e) {
    console.warn('Could not stamp index.html asset versions:', e.message);
}
