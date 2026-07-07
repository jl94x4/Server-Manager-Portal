import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Discover and Media Stack","description":"","frontmatter":{},"headers":[],"relativePath":"features/discover.md","filePath":"features/discover.md","lastUpdated":null}');
const _sfc_main = { name: "features/discover.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="discover-and-media-stack" tabindex="-1">Discover and Media Stack <a class="header-anchor" href="#discover-and-media-stack" aria-label="Permalink to &quot;Discover and Media Stack&quot;">​</a></h1><h2 id="discover" tabindex="-1">Discover <a class="header-anchor" href="#discover" aria-label="Permalink to &quot;Discover&quot;">​</a></h2><p>The Discover page highlights current activity and useful community-level recommendations.</p><p>Live activity includes stream totals, direct-play and transcode counts, bandwidth, now-playing cards, poster art, quality badges, player details, progress bars, and ETA.</p><p>Content sections include:</p><ul><li>Recently added movies, TV shows, and music.</li><li>Trending this week.</li><li>Top movies and shows.</li><li>Weekend activity.</li><li>Night viewing.</li><li>All-time favorites.</li><li>Niche high-engagement titles.</li><li>Older titles receiving recent attention.</li></ul><p>The page reuses analytics caches where possible so startup and navigation stay fast.</p><h2 id="media-stack" tabindex="-1">Media Stack <a class="header-anchor" href="#media-stack" aria-label="Permalink to &quot;Media Stack&quot;">​</a></h2><p>The Media Stack page integrates Sonarr and Radarr:</p><table tabindex="0"><thead><tr><th>Section</th><th>Purpose</th></tr></thead><tbody><tr><td>Release Calendar</td><td>Upcoming episodes and movies with availability state</td></tr><tr><td>Active Queue</td><td>Current downloads and progress</td></tr><tr><td>Recent History</td><td>Imports and grab history</td></tr><tr><td>Month Navigation</td><td>Browse releases across months</td></tr><tr><td>ID Matching</td><td>Map content through IMDb, TMDB, and TVDB IDs</td></tr></tbody></table><p>Configure Sonarr and Radarr URLs and API keys in Settings.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("features/discover.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const discover = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  discover as default
};
