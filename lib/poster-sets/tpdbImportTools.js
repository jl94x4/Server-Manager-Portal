/**
 * ThePosterDB → Poster Sets import helpers (bookmarklet + userscript).
 * TPDB blocks iframes; these run on theposterdb.com and open the portal.
 */

export const extractTpdbSetUrl = (href = '') => {
    let parsed;
    try {
        parsed = new URL(String(href || '').trim(), 'https://theposterdb.com');
    } catch {
        return null;
    }
    const host = String(parsed.hostname || '').replace(/^www\./i, '').toLowerCase();
    if (host !== 'theposterdb.com') return null;
    const path = String(parsed.pathname || '').replace(/\/+$/, '');
    const setMatch = path.match(/^\/(?:poster\/)?set\/(\d+)$/i);
    if (setMatch) return `https://theposterdb.com/set/${setMatch[1]}`;
    const posterMatch = path.match(/^\/poster\/(\d+)$/i);
    if (posterMatch) return `https://theposterdb.com/poster/${posterMatch[1]}`;
    return null;
};

export const posterSetsImportHash = (setUrl, { apply = true } = {}) => {
    const params = new URLSearchParams();
    params.set('url', String(setUrl || ''));
    if (apply) params.set('action', 'apply');
    return `#discover?${params.toString()}`;
};

export const posterSetsImportHref = (portalRoot, setUrl, { apply = true } = {}) => {
    const root = String(portalRoot || '').replace(/\/+$/, '');
    if (!root || !setUrl) return '';
    return `${root}/poster-sets${posterSetsImportHash(setUrl, { apply })}`;
};

export const buildTpdbImportBookmarklet = (portalRoot, { apply = true } = {}) => {
    const root = String(portalRoot || '').replace(/\/+$/, '');
    const extra = apply ? '&action=apply' : '';
    const src = `(function(){var h=location.href;var a=h.match(/theposterdb\\.com\\/(?:poster\\/)?set\\/(\\d+)/i);var b=a?null:h.match(/theposterdb\\.com\\/poster\\/(\\d+)/i);var url=a?("https://theposterdb.com/set/"+a[1]):(b?("https://theposterdb.com/poster/"+b[1]):null);if(!url){alert("Open a ThePosterDB set (or poster) page first.");return;}window.open(${JSON.stringify(root)}+"/poster-sets#discover?url="+encodeURIComponent(url)+${JSON.stringify(extra)},"_blank");})();`;
    return `javascript:${src}`;
};

export const buildTpdbImportUserscript = ({
    portalRoot,
    scriptUrl,
    apply = true,
} = {}) => {
    const root = String(portalRoot || '').replace(/\/+$/, '');
    const updateUrl = String(scriptUrl || `${root}/api/poster-sets/tpdb-import.user.js`);
    const applyFlag = apply ? 'true' : 'false';
    return `// ==UserScript==
// @name         SMP — Import to Poster Sets
// @namespace    server-manager-portal
// @version      1.0.0
// @description  Import ThePosterDB sets into Server Manager Portal Poster Sets (opens the portal; TPDB cannot be iframed).
// @author       Server Manager Portal
// @match        https://theposterdb.com/*
// @match        https://www.theposterdb.com/*
// @icon         https://theposterdb.com/favicon.ico
// @grant        none
// @downloadURL  ${updateUrl}
// @updateURL    ${updateUrl}
// ==/UserScript==

(function () {
  'use strict';
  var PORTAL = ${JSON.stringify(root)};
  var APPLY = ${applyFlag};

  function extractSetUrl(href) {
    try {
      var parsed = new URL(String(href || '').trim(), 'https://theposterdb.com');
    } catch (e) { return null; }
    var host = String(parsed.hostname || '').replace(/^www\\./i, '').toLowerCase();
    if (host !== 'theposterdb.com') return null;
    var path = String(parsed.pathname || '').replace(/\\/+$/, '');
    var setMatch = path.match(/^\\/(?:poster\\/)?set\\/(\\d+)$/i);
    if (setMatch) return 'https://theposterdb.com/set/' + setMatch[1];
    var posterMatch = path.match(/^\\/poster\\/(\\d+)$/i);
    if (posterMatch) return 'https://theposterdb.com/poster/' + posterMatch[1];
    return null;
  }

  function importHref(setUrl) {
    var params = new URLSearchParams();
    params.set('url', setUrl);
    if (APPLY) params.set('action', 'apply');
    return PORTAL + '/poster-sets#discover?' + params.toString();
  }

  function openImport(setUrl) {
    if (!setUrl) return;
    window.open(importHref(setUrl), '_blank', 'noopener');
  }

  function styleButton(btn, compact) {
    btn.type = 'button';
    btn.textContent = compact ? 'SMP' : 'Import to Poster Sets';
    btn.title = 'Queue this set in Server Manager Portal';
    btn.style.cssText = [
      'display:inline-flex',
      'align-items:center',
      'justify-content:center',
      'gap:6px',
      compact ? 'padding:4px 8px' : 'padding:8px 14px',
      'border-radius:999px',
      'border:0',
      'background:#e5a00d',
      'color:#111',
      'font:700 ' + (compact ? '11px' : '13px') + '/1.2 system-ui,sans-serif',
      'cursor:pointer',
      'box-shadow:0 8px 24px rgba(0,0,0,.35)',
      'z-index:2147483646',
      'text-decoration:none',
    ].join(';');
  }

  function addPageBar() {
    var setUrl = extractSetUrl(location.href);
    if (!setUrl) return;
    if (document.getElementById('smp-tpdb-import-bar')) return;
    var bar = document.createElement('div');
    bar.id = 'smp-tpdb-import-bar';
    bar.style.cssText = 'position:fixed;top:12px;right:12px;z-index:2147483646;';
    var btn = document.createElement('button');
    styleButton(btn, false);
    btn.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      openImport(setUrl);
    });
    bar.appendChild(btn);
    document.documentElement.appendChild(bar);
  }

  function decorateLinks(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var links = scope.querySelectorAll('a[href*="/set/"], a[href*="/poster/set/"], a[href*="/poster/"]');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      if (link.dataset.smpTpdbDecorated === '1') continue;
      var setUrl = extractSetUrl(link.href);
      if (!setUrl) continue;
      if (extractSetUrl(location.href) === setUrl) continue;
      link.dataset.smpTpdbDecorated = '1';
      var btn = document.createElement('button');
      styleButton(btn, true);
      btn.style.marginLeft = '8px';
      btn.style.verticalAlign = 'middle';
      btn.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        openImport(event.currentTarget.getAttribute('data-smp-url'));
      });
      btn.setAttribute('data-smp-url', setUrl);
      link.insertAdjacentElement('afterend', btn);
    }
  }

  function boot() {
    addPageBar();
    decorateLinks(document);
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var nodes = mutations[i].addedNodes;
        for (var j = 0; j < nodes.length; j++) {
          if (nodes[j].nodeType === 1) decorateLinks(nodes[j]);
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
`;
};
