import { useEffect } from 'react';
import { isAndroidTvUi } from './config';
import { PLAYER_APP_BASE, PLAYER_NAVIGATE_EVENT, PLAYER_SCROLL_ID, PLAYER_TV_NAV_EVENT } from '../media-player/paths';
import { rectToFixedPixels } from '../shared/ui';

const TV_ITEM = '[data-tv-item="1"]';
const TV_RAIL = '[data-tv-rail="1"]';
const TV_NAV_ROOT = '[data-tv-nav-root="1"]';
const TV_NAV_ITEM = '[data-tv-nav="1"]';
const TV_POSTER_BTN = '[data-tv-poster-btn="1"]';

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
        // visibility inherits, so the element's own computed value covers ancestors.
        if (window.getComputedStyle(el).visibility === 'hidden') return false;
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

const TV_OVERLAY = '[data-tv-item-menu="1"], [data-tv-select-menu="1"], [data-tv-resume-dialog="1"], [data-tv-home-switch="1"]';
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
    const scroller = el.closest(TV_OVERLAY) as HTMLElement | null;
    if (!scroller) return;
    const box = scroller.getBoundingClientRect();
    const row = el.getBoundingClientRect();
    if (row.top < box.top) scroller.scrollTop -= (box.top - row.top);
    else if (row.bottom > box.bottom) scroller.scrollTop += (row.bottom - box.bottom);
};

const POSTER_HOLD_MS = 480;

/**
 * Keep the focused card fully inside its row, and leave a strip of the next
 * row on screen when moving up or down.
 */
const scrollTvTarget = (el: HTMLElement, dir?: SpatialDir) => {
    const rail = el.closest(TV_RAIL) as HTMLElement | null;
    if (rail && rail.scrollWidth > rail.clientWidth + 8) {
        const railBox = rectToFixedPixels(rail.getBoundingClientRect());
        const itemBox = rectToFixedPixels(el.getBoundingClientRect());
        const pad = 32;
        let inline = 0;
        if (itemBox.left < railBox.left + pad) inline = itemBox.left - (railBox.left + pad);
        else if (itemBox.right > railBox.right - pad) inline = itemBox.right - (railBox.right - pad);
        if (inline) rail.scrollLeft += inline;
    }

    const page = document.getElementById(PLAYER_SCROLL_ID);
    if (!page) return;
    const block = (el.closest('.player-rail-enter') || el) as HTMLElement;
    const pageBox = rectToFixedPixels(page.getBoundingClientRect());
    const blockBox = rectToFixedPixels(block.getBoundingClientRect());
    const itemBox = rectToFixedPixels(el.getBoundingClientRect());
    const peek = 120;
    const topPad = 16;
    const vertical = dir === 'up' || dir === 'down';
    const rowFits = blockBox.bottom - blockBox.top < (pageBox.bottom - pageBox.top - peek - topPad);
    let delta = 0;
    if (vertical && rowFits && dir === 'down' && blockBox.bottom > pageBox.bottom - peek) {
        delta = blockBox.bottom - (pageBox.bottom - peek);
    } else if (vertical && rowFits && dir === 'up' && blockBox.top < pageBox.top + topPad) {
        delta = blockBox.top - (pageBox.top + topPad);
    } else if (itemBox.top < pageBox.top + topPad) {
        delta = itemBox.top - (pageBox.top + topPad);
    } else if (itemBox.bottom > pageBox.bottom - (vertical ? peek : topPad)) {
        delta = itemBox.bottom - (pageBox.bottom - (vertical ? peek : topPad));
    }
    if (delta) page.scrollTop += delta;
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
    void block;
    scrollTvTarget(el, dir);
};

const syncPosterFocusAttr = () => {
    const active = document.activeElement as HTMLElement | null;
    const focusedBtn = active?.closest?.(TV_POSTER_BTN) as HTMLElement | null
        || (active?.getAttribute?.('data-tv-poster-btn') === '1' ? active : null);
    // Touch every poster button so stale attrs cannot linger across rails.
    document.querySelectorAll<HTMLElement>(TV_POSTER_BTN).forEach((el) => {
        if (focusedBtn && el === focusedBtn) el.setAttribute('data-tv-focused', '1');
        else el.removeAttribute('data-tv-focused');
    });
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
    const columnHit = band.some((c) => spanOverlap(fromRect.left, fromRect.right, c.r.left, c.r.right) > 0);
    if (!columnHit) {
        band.sort((a, b) => a.r.left - b.r.left);
        return band[0].el;
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
    return best;
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
    if (target) focusItem(target, 'nearest');
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
    focusItem(poster, 'nearest', 'down');
    requestAnimationFrame(syncPosterFocusAttr);
    return true;
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
    if (isPlayerItemPath() && focusTvPlayButton()) return;
    if (restoreTvFocus()) return;
    const library = document.querySelector<HTMLElement>('[data-tv-library="1"]');
    if (library && hasLayout(library)) {
        const poster = Array.from(library.querySelectorAll<HTMLElement>(TV_POSTER_BTN)).find(hasLayout);
        if (poster) {
            focusItem(poster, 'nearest', 'down');
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
        || document.querySelector('[data-tv-select-menu="1"], [data-tv-item-menu="1"], [data-tv-home-switch="1"]')
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
        setNavOpen(false);
        window.setTimeout(focusTvContent, 40);
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

        let posterHoldTimer = 0;
        let posterHoldFired = false;
        let posterHoldEl: HTMLElement | null = null;
        const clearPosterHold = () => {
            if (posterHoldTimer) window.clearTimeout(posterHoldTimer);
            posterHoldTimer = 0;
        };

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
                const poster = document.querySelector(TV_OVERLAY)
                    ? null
                    : (posterButtonOf(event.target) || posterButtonOf(document.activeElement));
                if (poster) {
                    event.preventDefault();
                    event.stopPropagation();
                    if (event.repeat) return;
                    const menuKey = event.key === 'ContextMenu' || event.keyCode === 82;
                    clearPosterHold();
                    posterHoldEl = poster;
                    if (menuKey) {
                        posterHoldFired = true;
                        openPosterMenu(poster);
                        return;
                    }
                    posterHoldFired = false;
                    posterHoldTimer = window.setTimeout(() => {
                        posterHoldFired = true;
                        openPosterMenu(poster);
                    }, POSTER_HOLD_MS);
                    return;
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
                    setNavOpen(false);
                    window.setTimeout(focusTvContent, 40);
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

            const rowRail = !menuRoot && (dir === 'left' || dir === 'right')
                ? current.closest<HTMLElement>(TV_RAIL)
                : null;
            const target = findSpatialTarget(current, dir, menuRoot || rowRail || undefined);
            if (target) {
                focusItem(target, 'nearest', dir);
                requestAnimationFrame(syncPosterFocusAttr);
                return;
            }
            // An open context menu owns D-pad until closed — do not jump to nav.
            if (menuRoot) return;
            // Setup screen has no side nav — stay put instead of opening an empty rail.
            if (auth) return;
            // No candidate to the left = focus is at the left edge → open side nav.
            if (dir === 'left') {
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

        const onKeyUp = (event: KeyboardEvent) => {
            if (!isConfirmKey(event)) return;
            clearPosterHold();
            const held = posterHoldEl;
            const fired = posterHoldFired;
            posterHoldEl = null;
            posterHoldFired = false;
            if (!held) return;
            event.preventDefault();
            event.stopPropagation();
            if (!fired) held.click();
        };

        const onFocusPosters = () => {
            const root = document.querySelector('[data-tv-library="1"]') || document;
            focusFirstPoster(root);
        };

        window.addEventListener('keydown', onKeyDown, true);
        window.addEventListener('keyup', onKeyUp, true);
        window.addEventListener('smp-tv-focus-posters', onFocusPosters);
        document.addEventListener('focusin', onFocusIn, true);
        window.addEventListener('popstate', onNavigate);
        window.addEventListener(PLAYER_NAVIGATE_EVENT, onNavigate);
        // Do not sync on focusout — WebView activeElement is unreliable mid-blur and
        // was leaving data-tv-focused on the first poster of other rails.
        syncPosterFocusAttr();
        return () => {
            if (window.__SMP_HANDLE_BACK__ === handleTvBack) {
                delete window.__SMP_HANDLE_BACK__;
            }
            clearPosterHold();
            window.removeEventListener('keydown', onKeyDown, true);
            window.removeEventListener('keyup', onKeyUp, true);
            window.removeEventListener('smp-tv-focus-posters', onFocusPosters);
            document.removeEventListener('focusin', onFocusIn, true);
            window.removeEventListener('popstate', onNavigate);
            window.removeEventListener(PLAYER_NAVIGATE_EVENT, onNavigate);
        };
    }, [enabled]);
};
