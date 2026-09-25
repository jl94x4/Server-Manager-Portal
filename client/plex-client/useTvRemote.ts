import { useEffect } from 'react';
import { readDocumentZoom } from '../shared/ui';
import { isAndroidTvUi } from './config';
import { PLAYER_APP_BASE, PLAYER_NAVIGATE_EVENT, PLAYER_SCROLL_ID, PLAYER_TV_NAV_EVENT } from '../media-player/paths';

const TV_ITEM = '[data-tv-item="1"]';
const TV_RAIL = '[data-tv-rail="1"]';
const TV_NAV_ROOT = '[data-tv-nav-root="1"]';
const TV_NAV_ITEM = '[data-tv-nav="1"]';
const TV_POSTER_BTN = '[data-tv-poster-btn="1"]';
const TV_COVER_BTN = '[data-tv-poster-btn="1"], [data-tv-extra-btn="1"], [data-tv-episode-btn="1"], [data-tv-season-poster-btn="1"]';

const isEditableTarget = (target: EventTarget | null) => {
    const el = target as HTMLElement | null;
    if (!el) return false;
    const tag = String(el.tagName || '').toLowerCase();
    if (tag === 'textarea') return !(el as HTMLTextAreaElement).readOnly && !(el as HTMLTextAreaElement).disabled;
    if (tag === 'select') return !(el as HTMLSelectElement).disabled;
    if (tag === 'input') {
        const input = el as HTMLInputElement;
        if (input.readOnly || input.disabled) return false;
        return true;
    }
    return el.isContentEditable === true;
};

/**
 * True when the element actually has layout. getClientRects() is empty when the
 * element OR ANY ANCESTOR is display:none — critical because the dashboard keeps
 * the home screen mounted (hidden) under other views, and computed style on
 * those descendants still reports their own display value. Focusing an element
 * without layout silently fails, which bricked D-pad nav on details pages.
 */
const hasLayout = (el: HTMLElement) => el.getClientRects().length > 0;

const focusableTvItems = (root: ParentNode = document) => (
    Array.from(root.querySelectorAll<HTMLElement>(TV_ITEM)).filter((el) => {
        if (el.hasAttribute('disabled')) return false;
        if (el.getAttribute('aria-hidden') === 'true') return false;
        if (el.closest(TV_NAV_ROOT)) return false;
        if (!hasLayout(el)) return false;
        return el.tabIndex !== -1;
    })
);

/** Ordered content rails (excludes side nav and hidden screens). */
const visibleContentRails = () => (
    Array.from(document.querySelectorAll<HTMLElement>(TV_RAIL)).filter((rail) => {
        if (rail.closest(TV_NAV_ROOT)) return false;
        if (!hasLayout(rail)) return false;
        return focusableTvItems(rail).length > 0;
    })
);

const TV_OVERLAY = '[data-tv-item-menu="1"], [data-tv-select-menu="1"], [data-tv-resume-dialog="1"], [data-tv-home-switch="1"], [data-tv-version-dialog="1"], [data-tv-track-dialog="1"], [data-tv-settings-dialog="1"]';
const TV_AUTH = '[data-tv-auth="1"]';

type SpatialDir = 'left' | 'right' | 'up' | 'down';

const isAuthScreen = () => Boolean(document.querySelector(TV_AUTH));

const inputCaretAtEdge = (input: HTMLInputElement | HTMLTextAreaElement, dir: SpatialDir) => {
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    if (dir === 'left') return start === 0 && end === 0;
    if (dir === 'right') return start === input.value.length && end === input.value.length;
    return true;
};

const activateFocusedTvItem = (event: KeyboardEvent): boolean => {
    const focused = document.activeElement as HTMLElement | null;
    const item = focused?.closest?.<HTMLElement>(TV_ITEM) || null;
    if (!item || item.hasAttribute('disabled')) return false;
    const tag = String(item.tagName || '').toLowerCase();
    const clickable = tag === 'button'
        || tag === 'a'
        || item.getAttribute('role') === 'button'
        || item.getAttribute('data-tv-action') === '1';
    if (!clickable) return false;
    event.preventDefault();
    event.stopPropagation();
    item.click();
    return true;
};

const isOverlayItem = (el: HTMLElement) => !!el.closest(TV_OVERLAY);

/** Keep a focused overlay row visible inside the overlay only — never pan the page. */
const scrollOverlayOnly = (el: HTMLElement) => {
    const scroller = (
        el.closest<HTMLElement>('[data-tv-overlay-scroll="1"]')
        || el.closest<HTMLElement>(TV_OVERLAY)
    );
    if (!scroller) return;
    const box = scroller.getBoundingClientRect();
    const row = el.getBoundingClientRect();
    if (row.top < box.top) scroller.scrollTop -= (box.top - row.top);
    else if (row.bottom > box.bottom) scroller.scrollTop += (row.bottom - box.bottom);
};

const PEEK_PX = 88;

/** CSS zoom makes rail.scrollLeft a no-op. Native scrollIntoView is what pans the row. */
const scrollRailItem = (el: HTMLElement) => {
    try {
        el.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'auto' });
    } catch {
        try {
            el.scrollIntoView(false);
        } catch {
            /* ignore */
        }
    }
};

/** Slide a poster rail just far enough that the next card still peeks in. */
const revealNeighbor = (el: HTMLElement, dir: SpatialDir | undefined) => {
    if (!dir) return;
    if (dir !== 'left' && dir !== 'right') return;
    const rail = el.closest<HTMLElement>('[data-tv-poster-rail="1"]');
    if (!rail || rail.scrollWidth <= rail.clientWidth + 8) return;
    scrollRailItem(el);
    const zoom = readDocumentZoom();
    const railBox = rail.getBoundingClientRect();
    const itemBox = el.getBoundingClientRect();
    const before = rail.scrollLeft;
    if (dir === 'right' && rail.scrollLeft < rail.scrollWidth - rail.clientWidth - 2) {
        const raw = (itemBox.right - (railBox.right - PEEK_PX * zoom)) / zoom;
        if (raw > 1) rail.scrollLeft += Math.max(0, raw);
    } else if (dir === 'left') {
        const fromStart = rail.scrollLeft + (itemBox.left - railBox.left) / zoom;
        if (fromStart < rail.clientWidth * 0.55) rail.scrollLeft = 0;
    }
    if (rail.scrollLeft === before) scrollRailItem(el);
};

/** Play / Open / title actions — not seasons, cast, or poster rails. */
const isHeaderControl = (el: HTMLElement) => {
    if (el.closest('[data-tv-row="1"], [data-tv-poster-rail="1"], [data-tv-season-poster-btn="1"], [data-tv-episode-btn="1"], [data-tv-extra-btn="1"], [data-tv-episode-neighbor="1"]')) {
        return false;
    }
    return Boolean(el.closest('.player-home-hero, [data-tv-action-row="1"], .media-details-hero-row, .media-details-hero-content'));
};

const pageTopFor = (from: HTMLElement) => {
    const details = from.closest<HTMLElement>('[data-tv-details="1"]');
    if (details) {
        return details.querySelector<HTMLElement>('[data-tv-page-top="1"]') || details;
    }
    return from.closest<HTMLElement>('.player-home-hero, [data-tv-page-top="1"]');
};

/** One rail / section. Never the whole page. */
const focusedRow = (el: HTMLElement) => {
    if (isHeaderControl(el)) {
        return pageTopFor(el) || el;
    }
    const named = el.closest<HTMLElement>('.player-rail-enter, [data-tv-row="1"]');
    if (named) return named;
    const rail = el.closest<HTMLElement>('[data-tv-poster-rail="1"]');
    if (rail && rail.scrollWidth > rail.clientWidth + 8) {
        return (rail.closest<HTMLElement>('section') || rail.parentElement || rail) as HTMLElement;
    }
    const page = document.getElementById(PLAYER_SCROLL_ID);
    const section = el.closest<HTMLElement>('section');
    if (section && page && section.offsetHeight < page.clientHeight * 1.1) return section;
    return el;
};

/** CSS zoom on TV makes element.scrollTop a no-op. Native scrollIntoView is what actually moves the page. */
const scrollEl = (node: HTMLElement, block: ScrollLogicalPosition) => {
    try {
        node.scrollIntoView({ inline: 'nearest', block, behavior: 'auto' });
    } catch {
        try {
            node.scrollIntoView(block === 'start');
        } catch {
            /* ignore */
        }
    }
};

/** Vertical row moves must not pan overflow-x rails — that clips the first poster / glow. */
const scrollRowWithoutPanningRails = (row: HTMLElement, block: ScrollLogicalPosition) => {
    const rails = row.querySelectorAll<HTMLElement>('[data-tv-poster-rail="1"], [data-tv-rail="1"]');
    const prev: string[] = [];
    rails.forEach((rail) => {
        prev.push(rail.style.overflowX);
        rail.style.overflowX = 'hidden';
    });
    scrollEl(row, block);
    rails.forEach((rail, i) => {
        rail.style.overflowX = prev[i] || '';
    });
};

const focusItem = (el: HTMLElement, block: ScrollLogicalPosition = 'nearest', dir?: SpatialDir) => {
    try {
        el.focus({ preventScroll: true });
    } catch {
        el.focus();
    }
    if (isOverlayItem(el)) {
        const page = document.getElementById(PLAYER_SCROLL_ID);
        const frozen = page?.scrollTop ?? 0;
        scrollOverlayOnly(el);
        if (page) page.scrollTop = frozen;
        return;
    }
    if (isHeaderControl(el)) {
        const top = pageTopFor(el);
        if (top) {
            scrollEl(top, 'start');
            return;
        }
    }
    const settingsRoot = el.closest<HTMLElement>('[data-tv-settings="1"]');
    if (settingsRoot) {
        const first = settingsRoot.querySelector<HTMLElement>('[data-tv-item="1"]');
        if (first && (el === first || first.contains(el))) {
            const top = settingsRoot.querySelector<HTMLElement>('[data-tv-page-top="1"]') || settingsRoot;
            scrollEl(top, 'start');
            return;
        }
        if (dir === 'up' || dir === 'down') {
            scrollRowWithoutPanningRails(focusedRow(el), 'nearest');
            return;
        }
    }
    const details = Boolean(el.closest('[data-tv-details="1"]'));
    // Title pages have a tall hero. Centering the seasons/episodes/cast row
    // chops the poster to a sliver. Park the row at the bottom instead.
    if (dir === 'up' || dir === 'down') {
        scrollRowWithoutPanningRails(focusedRow(el), details ? 'end' : 'center');
        return;
    }
    if (details && el.closest('[data-tv-row="1"]')) {
        scrollEl(focusedRow(el), 'end');
        if (dir === 'left' || dir === 'right') scrollRailItem(el);
        revealNeighbor(el, dir);
        return;
    }
    scrollEl(el, block);
    revealNeighbor(el, dir);
};

let focusedPosterEl: HTMLElement | null = null;

const syncPosterFocusAttr = () => {
    const active = document.activeElement as HTMLElement | null;
    const next = (active?.closest?.(TV_COVER_BTN) as HTMLElement | null)
        || (active?.matches?.(TV_COVER_BTN) ? active : null);
    if (focusedPosterEl && focusedPosterEl !== next) {
        focusedPosterEl.removeAttribute('data-tv-focused');
    }
    if (next && next !== focusedPosterEl) next.setAttribute('data-tv-focused', '1');
    focusedPosterEl = next;
};

const currentPath = () => String(window.location.pathname || '').replace(/\/+$/, '') || '/';

const tvFocusByPath = new Map<string, string>();

export const hasRememberedTvFocus = (path = currentPath()) => Boolean(tvFocusByPath.get(path));

export const rememberTvFocusKey = (key: string, path = currentPath()) => {
    const id = String(key || '').trim();
    if (!id || !path) return;
    tvFocusByPath.set(path, id);
};

const tvKeyOf = (el: HTMLElement | null) => {
    if (!el) return '';
    const own = el.getAttribute('data-tv-key');
    if (own) return own;
    return el.closest('[data-tv-key]')?.getAttribute('data-tv-key') || '';
};

const findTvItemByKey = (key: string) => (
    focusableTvItems().find((el) => tvKeyOf(el) === key) || null
);

/** Restore the last focused poster on this page. Retries until the kept-alive home rail has layout. */
export const restoreTvFocus = (): boolean => {
    const key = tvFocusByPath.get(currentPath());
    if (!key) return false;
    const match = findTvItemByKey(key);
    if (!match) return false;
    focusItem(match, 'center');
    requestAnimationFrame(syncPosterFocusAttr);
    return true;
};

const restoreTvFocusWhenReady = () => {
    if (isPlayerItemPath()) {
        focusTvPlayWhenReady();
        return;
    }
    if (isPlayerSettingsPath()) {
        focusTvSettingsWhenReady();
        return;
    }
    if (isPlayerHomePath() && !tvFocusByPath.get(currentPath())) {
        focusTvHeroWhenReady();
        return;
    }
    if (!tvFocusByPath.get(currentPath())) return;
    if (restoreTvFocus()) return;
    let attempts = 12;
    const tick = () => {
        if (restoreTvFocus() || attempts-- <= 0) return;
        window.setTimeout(tick, 40);
    };
    window.setTimeout(tick, 40);
};

const isConfirmKey = (event: KeyboardEvent) => (
    event.key === 'Enter'
    || event.key === ' '
    || event.key === 'NumpadEnter'
    || event.key === 'Select'
    || event.keyCode === 23
);

const dirOfKey = (key: string): SpatialDir | null => {
    if (key === 'ArrowLeft') return 'left';
    if (key === 'ArrowRight') return 'right';
    if (key === 'ArrowUp') return 'up';
    if (key === 'ArrowDown') return 'down';
    return null;
};

const spanOverlap = (a1: number, a2: number, b1: number, b2: number) => (
    Math.max(0, Math.min(a2, b2) - Math.max(a1, b1))
);

/**
 * Geometric spatial navigation (LRUD): pick the nearest focusable in the pressed
 * direction. Vertical moves never skip a closer row (e.g. Top Cast) just because
 * a later rail lines up with the focused control.
 */
const findSpatialTarget = (from: HTMLElement, dir: SpatialDir, root?: ParentNode): HTMLElement | null => {
    const fromRect = from.getBoundingClientRect();
    if (fromRect.width <= 0 && fromRect.height <= 0) return null;
    const fcx = fromRect.left + fromRect.width / 2;

    if (dir === 'left' || dir === 'right') {
        let best: HTMLElement | null = null;
        let bestScore = Infinity;
        for (const el of focusableTvItems(root)) {
            if (el === from || el.contains(from) || from.contains(el)) continue;
            const r = el.getBoundingClientRect();
            if (r.width <= 0 || r.height <= 0) continue;
            const cx = r.left + r.width / 2;
            const primary = dir === 'left' ? fcx - cx : cx - fcx;
            if (primary <= 2) continue;
            if (spanOverlap(fromRect.top, fromRect.bottom, r.top, r.bottom) <= 0) continue;
            if (primary < bestScore) {
                bestScore = primary;
                best = el;
            }
        }
        return best;
    }

    type VertCand = { el: HTMLElement; r: DOMRect; primary: number };
    const cands: VertCand[] = [];
    for (const el of focusableTvItems(root)) {
        if (el === from || el.contains(from) || from.contains(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) continue;
        const overlapY = spanOverlap(fromRect.top, fromRect.bottom, r.top, r.bottom);
        if (overlapY > Math.min(fromRect.height, r.height) * 0.35) continue;
        if (dir === 'down' && r.top < fromRect.top + 8) continue;
        if (dir === 'up' && r.bottom > fromRect.bottom - 8) continue;
        const primary = dir === 'down' ? r.top - fromRect.bottom : fromRect.top - r.bottom;
        if (primary < -12) continue;
        cands.push({ el, r, primary });
    }
    if (!cands.length) return null;

    const nearest = Math.min(...cands.map((c) => Math.max(0, c.primary)));
    const nearestH = cands.find((c) => Math.max(0, c.primary) === nearest)?.r.height || 80;
    const band = cands.filter((c) => Math.max(0, c.primary) <= nearest + Math.max(64, nearestH * 0.7));
    const firstInCastRow = (el: HTMLElement | null) => {
        if (!el || el.getAttribute('data-tv-cast') !== '1') return el;
        const fromRow = from.closest<HTMLElement>('[data-tv-row="1"]');
        const toRow = el.closest<HTMLElement>('[data-tv-row="1"]');
        if (!toRow || toRow === fromRow) return el;
        return focusableTvItems(toRow).find(hasLayout) || el;
    };

    const columnHit = band.some((c) => spanOverlap(fromRect.left, fromRect.right, c.r.left, c.r.right) > 0);
    if (!columnHit) {
        band.sort((a, b) => a.r.left - b.r.left);
        return firstInCastRow(band[0].el);
    }

    let best: HTMLElement | null = null;
    let bestScore = Infinity;
    for (const c of band) {
        const overlap = spanOverlap(fromRect.left, fromRect.right, c.r.left, c.r.right);
        const orth = overlap > 0
            ? 0
            : Math.min(Math.abs(c.r.left - fromRect.right), Math.abs(fromRect.left - c.r.right));
        const score = Math.max(0, c.primary) + orth * 2;
        if (score < bestScore) {
            bestScore = score;
            best = c.el;
        }
    }
    return firstInCastRow(best);
};

const isNavOpen = () => document.documentElement?.dataset?.tvNavOpen === '1';

const setNavOpen = (open: boolean) => {
    try {
        if (open) document.documentElement.dataset.tvNavOpen = '1';
        else delete document.documentElement.dataset.tvNavOpen;
    } catch {
        /* ignore */
    }
    window.dispatchEvent(new CustomEvent(PLAYER_TV_NAV_EVENT, { detail: { action: open ? 'open' : 'close' } }));
};

const focusNavItem = () => {
    const root = document.querySelector(TV_NAV_ROOT);
    if (!root) return;
    const active = root.querySelector<HTMLElement>(`${TV_NAV_ITEM}[data-tv-nav-active="1"]`);
    const first = root.querySelector<HTMLElement>(TV_NAV_ITEM);
    const target = active || first;
    if (!target) return;
    try {
        target.focus({ preventScroll: true });
    } catch {
        target.focus();
    }
};

const posterButtonOf = (node: EventTarget | null) => {
    const el = node as HTMLElement | null;
    if (!el?.closest) return null;
    const poster = el.closest<HTMLElement>(TV_POSTER_BTN);
    return poster && hasLayout(poster) ? poster : null;
};

const openPosterMenu = (poster: HTMLElement) => {
    const ratingKey = poster.getAttribute('data-tv-key') || '';
    if (!ratingKey) return;
    window.dispatchEvent(new CustomEvent('smp-tv-poster-menu', { detail: { ratingKey } }));
};

/** Land on the remembered poster, or the first one in this library. */
export const focusFirstPoster = (root: ParentNode = document) => {
    if (hasRememberedTvFocus() && restoreTvFocus()) return true;
    const poster = Array.from(root.querySelectorAll<HTMLElement>(TV_POSTER_BTN)).find(hasLayout);
    if (!poster) return false;
    focusItem(poster, 'center');
    requestAnimationFrame(syncPosterFocusAttr);
    return true;
};

/** Leave the side nav without jumping the page — same row you were on. */
const leaveNavToContent = () => {
    setNavOpen(false);
    window.setTimeout(() => {
        if (restoreTvFocus()) return;
        focusTvContent();
    }, 40);
};

/** Focus last remembered poster, else the first content control. */
export const focusTvContent = () => {
    if (isAuthScreen()) {
        const active = document.activeElement as HTMLElement | null;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') && active.closest(TV_AUTH)) {
            return;
        }
        const items = focusableTvItems();
        const action = items.find((el) => el.getAttribute('data-tv-action') === '1');
        const target = action || items[0];
        if (target) {
            focusItem(target, 'nearest');
            return;
        }
    }
    if (restoreTvFocus()) return;
    if (isPlayerItemPath() && focusTvPlayButton()) return;
    if (isPlayerSettingsPath() && focusTvSettings()) return;
    if (isPlayerHomePath() && focusTvHero()) return;
    const library = document.querySelector<HTMLElement>('[data-tv-library="1"]');
    if (library && hasLayout(library)) {
        const poster = Array.from(library.querySelectorAll<HTMLElement>(TV_POSTER_BTN)).find(hasLayout);
        if (poster) {
            focusItem(poster, 'center');
            requestAnimationFrame(syncPosterFocusAttr);
            return;
        }
    }
    const rails = visibleContentRails();
    if (rails.length) {
        const items = focusableTvItems(rails[0]);
        if (items[0]) {
            focusItem(items[0], 'center');
            requestAnimationFrame(syncPosterFocusAttr);
            return;
        }
    }
    const poster = Array.from(document.querySelectorAll<HTMLElement>(TV_POSTER_BTN)).find(hasLayout);
    if (poster) {
        focusItem(poster, 'center');
        requestAnimationFrame(syncPosterFocusAttr);
        return;
    }
    const search = document.getElementById('media-player-search') as HTMLElement | null;
    if (search && hasLayout(search)) {
        search.focus();
        return;
    }
    const fallback = focusableTvItems()[0];
    if (fallback) focusItem(fallback, 'nearest');
};

const isPlayerHomePath = () => {
    const raw = String(window.location.pathname || '').replace(/\/+$/, '') || '/';
    return raw === PLAYER_APP_BASE || raw === '/' || raw === '';
};

const isPlayerItemPath = () => /\/item\/[^/]+/.test(currentPath());

const isPlayerSettingsPath = () => /\/settings$/.test(currentPath());

const focusTvSettings = (): boolean => {
    const root = document.querySelector<HTMLElement>('[data-tv-settings="1"]');
    const first = root?.querySelector<HTMLElement>('[data-tv-item="1"]');
    if (!root || !first || !hasLayout(first)) return false;
    const top = root.querySelector<HTMLElement>('[data-tv-page-top="1"]') || root;
    scrollEl(top, 'start');
    try {
        first.focus({ preventScroll: true });
    } catch {
        first.focus();
    }
    return true;
};

const focusTvSettingsWhenReady = () => {
    if (focusTvSettings()) return;
    let attempts = 24;
    const tick = () => {
        if (!isPlayerSettingsPath() || focusTvSettings() || attempts-- <= 0) return;
        window.setTimeout(tick, 40);
    };
    window.setTimeout(tick, 40);
};

/** Land title pages on Play — TV apps always highlight the primary action. */
export const focusTvPlayButton = (): boolean => {
    const play = focusableTvItems().find((el) => el.getAttribute('data-tv-play') === '1');
    if (!play) return false;
    focusItem(play, 'nearest');
    return true;
};

const focusTvPlayWhenReady = () => {
    if (focusTvPlayButton()) return;
    let attempts = 20;
    const tick = () => {
        if (focusTvPlayButton() || attempts-- <= 0) return;
        window.setTimeout(tick, 40);
    };
    window.setTimeout(tick, 40);
};

/** Home lands on the whole hero — Left/Right cycle, Select opens. */
const focusTvHero = (): boolean => {
    if (!isPlayerHomePath()) return false;
    const hero = document.querySelector<HTMLElement>('[data-tv-home-hero="1"]')
        || document.querySelector<HTMLElement>('.player-home-hero [data-tv-item="1"]');
    if (!hero || !hasLayout(hero)) return false;
    focusItem(hero, 'start');
    return true;
};

const focusTvHeroWhenReady = () => {
    if (focusTvHero()) return;
    let attempts = 30;
    const tick = () => {
        if (!isPlayerHomePath() || focusTvHero() || attempts-- <= 0) return;
        window.setTimeout(tick, 40);
    };
    window.setTimeout(tick, 40);
};

/**
 * Handle hardware / remote Back. Returns true when consumed (do not finish Activity).
 * Capacitor WebView pushState does not populate canGoBack(), so native Back must
 * be routed here via MainActivity → window.__SMP_HANDLE_BACK__.
 */
const handleTvBack = (): boolean => {
    if (isEditableTarget(document.activeElement)) {
        const field = document.activeElement as HTMLElement;
        if (field.closest('[data-tv-home-switch="1"]')) {
            field.blur();
            window.dispatchEvent(new Event('smp-tv-overlay-close'));
            return true;
        }
        field.blur();
        return true;
    }
    if (document.documentElement?.dataset?.tvSelectOpen === '1'
        || document.documentElement?.dataset?.tvMenuOpen === '1'
        || document.querySelector('[data-tv-select-menu="1"], [data-tv-item-menu="1"], [data-tv-home-switch="1"], [data-tv-version-dialog="1"], [data-tv-track-dialog="1"], [data-tv-settings-dialog="1"]')
    ) {
        window.dispatchEvent(new Event('smp-tv-select-close'));
        window.dispatchEvent(new Event('smp-tv-menu-close'));
        window.dispatchEvent(new Event('smp-tv-overlay-close'));
        return true;
    }
    const resumeClose = document.querySelector<HTMLElement>('[data-tv-resume-dialog="1"] [data-tv-item="1"]:last-child');
    if (document.querySelector('[data-tv-resume-dialog="1"]')) {
        // Prefer Close button if present; otherwise click primary cancel path.
        const closeBtn = Array.from(
            document.querySelectorAll<HTMLElement>('[data-tv-resume-dialog="1"] [data-tv-item="1"]')
        ).find((el) => /close|cancel/i.test(el.textContent || '')) || resumeClose;
        closeBtn?.click();
        return true;
    }
    const authBack = document.querySelector<HTMLElement>(`${TV_AUTH} [data-tv-auth-back="1"]`);
    if (authBack) {
        authBack.click();
        return true;
    }
    if (isNavOpen()) {
        leaveNavToContent();
        return true;
    }
    if (!isPlayerHomePath()) {
        const before = window.location.pathname;
        window.history.back();
        window.setTimeout(() => {
            if (window.location.pathname === before) {
                window.history.replaceState({}, '', PLAYER_APP_BASE);
                window.dispatchEvent(new Event(PLAYER_NAVIGATE_EVENT));
            }
            restoreTvFocusWhenReady();
        }, 80);
        return true;
    }
    return false;
};

declare global {
    interface Window {
        __SMP_HANDLE_BACK__?: () => boolean;
    }
}

/**
 * Leanback remote layer — same web UI, D-pad moves focus geometrically (nearest
 * focusable in the pressed direction), Back walks history. Left at the left edge
 * opens the side nav.
 */
export const useTvRemote = (enabled = true) => {
    useEffect(() => {
        if (!enabled || !isAndroidTvUi()) return undefined;

        window.__SMP_HANDLE_BACK__ = handleTvBack;

        const isBackKey = (event: KeyboardEvent) => (
            event.key === 'Escape'
            || event.key === 'BrowserBack'
            || event.key === 'GoBack'
            || event.keyCode === 4
        );

        const onKeyDown = (event: KeyboardEvent) => {
            const editable = isEditableTarget(event.target);
            const auth = isAuthScreen();

            if (editable && isBackKey(event)) {
                const el = event.target as HTMLElement;
                event.preventDefault();
                el.blur();
                if (auth) window.setTimeout(focusTvContent, 0);
                return;
            }

            if (isBackKey(event)) {
                event.preventDefault();
                handleTvBack();
                return;
            }

            if (isConfirmKey(event)) {
                if (editable) {
                    const form = (event.target as HTMLElement).closest('form');
                    if (form && (auth || (event.target as HTMLElement).closest(TV_OVERLAY))) {
                        event.preventDefault();
                        event.stopPropagation();
                        if (typeof form.requestSubmit === 'function') form.requestSubmit();
                        else form.submit();
                        return;
                    }
                    return;
                }
                if (document.documentElement?.dataset?.tvSelectOpen === '1') return;
                const menuKey = event.key === 'ContextMenu' || event.keyCode === 82;
                if (menuKey && !document.querySelector(TV_OVERLAY)) {
                    const poster = posterButtonOf(event.target) || posterButtonOf(document.activeElement);
                    if (poster) {
                        event.preventDefault();
                        event.stopPropagation();
                        openPosterMenu(poster);
                        return;
                    }
                }
                if (activateFocusedTvItem(event)) return;
            }

            if (editable) {
                const leaveDir = dirOfKey(event.key);
                if (!leaveDir || !(auth || (event.target as HTMLElement).closest(TV_OVERLAY))) return;
                const field = event.target as HTMLInputElement;
                if ((leaveDir === 'left' || leaveDir === 'right') && !inputCaretAtEdge(field, leaveDir)) return;
                // Fall through so D-pad can leave the URL / PIN field.
            }

            const overlayMenu = document.querySelector<HTMLElement>(TV_OVERLAY);
            if (overlayMenu && isConfirmKey(event) && document.documentElement?.dataset?.tvSelectOpen !== '1') {
                activateFocusedTvItem(event);
                return;
            }

            const active = document.activeElement as HTMLElement | null;
            const inNav = Boolean(active?.closest?.(TV_NAV_ROOT));
            if (document.documentElement?.dataset?.tvSelectOpen === '1') {
                // Open CustomSelect owns D-pad / Back until closed.
                return;
            }

            const dir = dirOfKey(event.key);
            if (!dir) return;

            const overlayOpen = Boolean(document.querySelector(TV_OVERLAY));
            if (inNav && !overlayOpen) {
                if (dir === 'left') {
                    event.preventDefault();
                    return;
                }
                if (dir === 'right') {
                    event.preventDefault();
                    event.stopPropagation();
                    leaveNavToContent();
                    return;
                }
                const root = document.querySelector(TV_NAV_ROOT);
                if (!root) return;
                const items = Array.from(root.querySelectorAll<HTMLElement>(TV_NAV_ITEM)).filter((el) => el.tabIndex !== -1);
                if (!items.length) return;
                let idx = active ? items.indexOf(active) : -1;
                if (idx < 0 && active) idx = items.findIndex((el) => el.contains(active));
                if (idx < 0) return;
                const nextIdx = dir === 'down' ? idx + 1 : dir === 'up' ? idx - 1 : idx;
                event.preventDefault();
                event.stopPropagation();
                if (nextIdx < 0 || nextIdx >= items.length) return;
                focusItem(items[nextIdx], 'nearest');
                return;
            }

            // Content area: geometric spatial navigation.
            event.preventDefault();
            event.stopPropagation();

            const menuRoot = document.querySelector<HTMLElement>(TV_OVERLAY);
            const current = active && active !== document.body && active !== document.documentElement
                ? (active.closest<HTMLElement>(TV_ITEM) || active)
                : null;
            if (!current || (menuRoot && current && !menuRoot.contains(current))) {
                if (menuRoot) {
                    const first = focusableTvItems(menuRoot)[0];
                    if (first) focusItem(first, 'nearest');
                    return;
                }
                focusTvContent();
                return;
            }

            let target: HTMLElement | null = null;
            if (!menuRoot && current.closest('[data-tv-home-hero="1"]')) {
                if (dir === 'left' || dir === 'right') {
                    current.dispatchEvent(new CustomEvent('smp-tv-hero-cycle', {
                        bubbles: true,
                        detail: { delta: dir === 'right' ? 1 : -1 },
                    }));
                    return;
                }
                if (dir === 'down') {
                    const firstRail = visibleContentRails().find((rail) => !rail.closest('.player-home-hero'));
                    target = firstRail ? focusableTvItems(firstRail)[0] || null : null;
                }
            }
            if (!menuRoot && dir === 'down' && current.closest('[data-tv-action-row="1"]')) {
                const details = current.closest('[data-tv-details="1"]') || document;
                target = Array.from(details.querySelectorAll<HTMLElement>(
                    '[data-tv-episode-neighbor-btn="1"]'
                )).find(hasLayout)
                    || Array.from(details.querySelectorAll<HTMLElement>(
                        '[data-tv-season-poster-btn="1"], [data-tv-episode-btn="1"]'
                    )).find(hasLayout)
                    || Array.from(details.querySelectorAll<HTMLElement>(
                        '[data-tv-cast="1"]'
                    )).find(hasLayout)
                    || null;
            }
            if (!target && !menuRoot && (dir === 'left' || dir === 'right')) {
                const posterRail = current.closest<HTMLElement>('[data-tv-poster-rail="1"]');
                if (posterRail) target = findSpatialTarget(current, dir, posterRail);
            }
            if (!target) target = findSpatialTarget(current, dir, menuRoot || undefined);
            if (!target && !menuRoot && dir === 'up' && isPlayerHomePath()) {
                const hero = document.querySelector<HTMLElement>('[data-tv-home-hero="1"]');
                if (hero && hasLayout(hero) && !current.closest('[data-tv-home-hero="1"]')) {
                    focusItem(hero, 'start');
                    return;
                }
            }
            if (!target && !menuRoot && dir === 'up') {
                const top = pageTopFor(current);
                if (top) {
                    scrollEl(top, 'start');
                    return;
                }
            }
            if (target) {
                focusItem(target, 'nearest', dir);
                return;
            }
            // An open context menu owns D-pad until closed — do not jump to nav.
            if (menuRoot) return;
            // Setup screen has no side nav — stay put instead of opening an empty rail.
            if (auth) return;
            // No candidate to the left = focus is at the left edge → open side nav.
            if (dir === 'left') {
                const key = tvKeyOf(current);
                if (key) rememberTvFocusKey(key);
                setNavOpen(true);
                window.setTimeout(focusNavItem, 50);
            }
        };

        const onFocusIn = (event: FocusEvent) => {
            syncPosterFocusAttr();
            const target = event.target as HTMLElement | null;
            if (!target) return;
            if (target.closest(TV_NAV_ROOT) && !isNavOpen()) {
                window.setTimeout(() => {
                    if (!isNavOpen() && document.activeElement?.closest?.(TV_NAV_ROOT)) {
                        restoreTvFocusWhenReady();
                    }
                }, 0);
                return;
            }
            const key = tvKeyOf(target.closest<HTMLElement>(TV_ITEM) || target);
            if (key && !target.closest(TV_NAV_ROOT)) rememberTvFocusKey(key);
        };

        const onNavigate = () => restoreTvFocusWhenReady();

        const onFocusPosters = () => {
            const root = document.querySelector('[data-tv-library="1"]') || document;
            focusFirstPoster(root);
        };

        window.addEventListener('keydown', onKeyDown, true);
        window.addEventListener('smp-tv-focus-posters', onFocusPosters);
        document.addEventListener('focusin', onFocusIn, true);
        window.addEventListener('popstate', onNavigate);
        window.addEventListener(PLAYER_NAVIGATE_EVENT, onNavigate);
        // Do not sync on focusout — WebView activeElement is unreliable mid-blur and
        // was leaving data-tv-focused on the first poster of other rails.
        syncPosterFocusAttr();
        if (isPlayerHomePath()) focusTvHeroWhenReady();
        else restoreTvFocusWhenReady();
        return () => {
            if (window.__SMP_HANDLE_BACK__ === handleTvBack) {
                delete window.__SMP_HANDLE_BACK__;
            }
            window.removeEventListener('keydown', onKeyDown, true);
            window.removeEventListener('smp-tv-focus-posters', onFocusPosters);
            document.removeEventListener('focusin', onFocusIn, true);
            window.removeEventListener('popstate', onNavigate);
            window.removeEventListener(PLAYER_NAVIGATE_EVENT, onNavigate);
        };
    }, [enabled]);
};
