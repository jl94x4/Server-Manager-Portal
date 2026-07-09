export const LAST_SEEN_VERSION_KEY = 'portal-last-seen-version';

export type ReleaseNotesSection = {
    title: string;
    items: string[];
};

export type ReleaseNotes = {
    version: string | null;
    date?: string | null;
    title?: string;
    sections: ReleaseNotesSection[];
    changelogUrl?: string;
};

export const parseAppSemver = (version: string | null | undefined): string | null => {
    if (!version) return null;
    const match = String(version).match(/v?(\d+\.\d+\.\d+)/i);
    return match ? match[1] : null;
};

export const compareSemver = (a: string, b: string): number => {
    const pa = a.split('.').map((part) => parseInt(part, 10) || 0);
    const pb = b.split('.').map((part) => parseInt(part, 10) || 0);
    for (let i = 0; i < 3; i += 1) {
        const diff = (pa[i] || 0) - (pb[i] || 0);
        if (diff !== 0) return diff;
    }
    return 0;
};

export const getLastSeenVersion = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LAST_SEEN_VERSION_KEY);
};

export const setLastSeenVersion = (semver: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LAST_SEEN_VERSION_KEY, semver);
};

export const shouldShowReleaseNotes = (
    appVersion: string | null | undefined,
    releaseNotes: ReleaseNotes | null,
    lastSeenVersion: string | null,
): boolean => {
    const currentSemver = parseAppSemver(appVersion);
    if (!currentSemver || !releaseNotes?.version) return false;
    if (releaseNotes.version !== currentSemver) return false;
    if (!releaseNotes.sections?.length) return false;
    if (!lastSeenVersion) return true;
    return compareSemver(currentSemver, lastSeenVersion) > 0;
};
