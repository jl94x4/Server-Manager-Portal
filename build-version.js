import fs from 'fs';
import { execSync } from 'child_process';

let assetVersion = 'dev';
try {
    assetVersion = execSync('git rev-parse --short HEAD', { stdio: 'pipe' }).toString().trim();
    fs.writeFileSync('version.txt', 'v1.0.0-' + assetVersion);
} catch (e) {
    if (!fs.existsSync('version.txt')) {
        fs.writeFileSync('version.txt', 'v1.0.0');
    }
    try {
        assetVersion = fs.readFileSync('version.txt', 'utf8').trim().replace(/^v/, '');
    } catch {
        assetVersion = String(Date.now());
    }
}

try {
    const indexPath = 'index.html';
    const html = fs.readFileSync(indexPath, 'utf8');
    const stamped = html
        .replace(/\/static\/tailwind\.css\?v=[^"']+/g, `/static/tailwind.css?v=${assetVersion}`)
        .replace(/\/static\/bundle\.js\?v=[^"']+/g, `/static/bundle.js?v=${assetVersion}`);
    fs.writeFileSync(indexPath, stamped);
} catch (e) {
    console.warn('Could not stamp index.html asset versions:', e.message);
}