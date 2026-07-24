import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

/** Compare dotted semver-ish versions (major.minor.patch). Returns >0 if a>b. */
export const compareSemver = (a, b) => {
    const parse = (value) => String(value || '0')
        .replace(/^v/i, '')
        .split(/[.+-]/)
        .map((part) => {
            const n = Number.parseInt(part, 10);
            return Number.isFinite(n) ? n : 0;
        });
    const left = parse(a);
    const right = parse(b);
    const len = Math.max(left.length, right.length);
    for (let i = 0; i < len; i += 1) {
        const diff = (left[i] || 0) - (right[i] || 0);
        if (diff !== 0) return diff;
    }
    return 0;
};

const readPackageJsonVersion = (cwd = process.cwd()) => {
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
        return String(pkg?.version || '').trim() || null;
    } catch {
        return null;
    }
};

/**
 * Effective marketing version for stamps / sidebar.
 * Beta/testing often lag main's package.json by a release; take the max of:
 * - local package.json
 * - PACKAGE_VERSION_FLOOR / MAIN_PACKAGE_VERSION (CI)
 * - origin/main:package.json (when git remote is available)
 */
export const resolvePackageVersion = (cwd = process.cwd()) => {
    let version = readPackageJsonVersion(cwd) || '1.0.0';

    const floor = String(
        process.env.PACKAGE_VERSION_FLOOR
        || process.env.MAIN_PACKAGE_VERSION
        || '',
    ).trim().replace(/^v/i, '');
    if (floor && compareSemver(floor, version) > 0) {
        version = floor;
    }

    try {
        const mainPkgRaw = execSync('git show origin/main:package.json', {
            cwd,
            stdio: ['ignore', 'pipe', 'ignore'],
            encoding: 'utf8',
        });
        const mainVersion = String(JSON.parse(mainPkgRaw)?.version || '').trim();
        if (mainVersion && compareSemver(mainVersion, version) > 0) {
            version = mainVersion;
        }
    } catch {
        /* shallow clones / offline builds — floor env still applies */
    }

    return version;
};
