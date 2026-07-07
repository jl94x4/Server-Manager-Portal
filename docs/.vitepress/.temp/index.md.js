import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"","description":"","frontmatter":{"layout":"home","hero":{"name":"Server Portal","text":"Self-hosted Plex and Jellyfin management.","tagline":"Manage access, analytics, onboarding, status, and media-server operations from one polished portal.","image":{"src":"/logo.png","alt":"Server Portal logo"},"actions":[{"theme":"brand","text":"Get Started","link":"/guide/getting-started"},{"theme":"alt","text":"Docker Deployment","link":"/guide/docker"}]},"features":[{"title":"Plex and Jellyfin ready","details":"First-time setup supports Plex OAuth/server selection or Jellyfin URL/API-key configuration with Jellyfin login and Quick Connect."},{"title":"User access automation","details":"Invite links, temporary access, expiry checks, inactivity cleanup, grace-period emails, and audit logs keep access predictable."},{"title":"Personal analytics","details":"User dashboards include watch history, rankings, media profile cards, peak hours, top titles, and shareable wrap-up exports."},{"title":"Admin operations","details":"Live sessions, user management, server status, background jobs, layout controls, and maintenance tools are available from the browser."}]},"headers":[],"relativePath":"index.md","filePath":"index.md","lastUpdated":null}');
const _sfc_main = { name: "index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h2 id="what-is-server-portal" tabindex="-1">What Is Server Portal? <a class="header-anchor" href="#what-is-server-portal" aria-label="Permalink to &quot;What Is Server Portal?&quot;">​</a></h2><p>Server Portal is a Node.js, Express, React, and Tailwind CSS application for managing a Plex or Jellyfin media server community. It stores runtime data in local JSON files, so it does not require a database.</p><p>Use these docs when you need to install the app, configure integrations, run it in Docker, operate background tasks, or understand the project structure.</p><h2 id="quick-commands" tabindex="-1">Quick Commands <a class="header-anchor" href="#quick-commands" aria-label="Permalink to &quot;Quick Commands&quot;">​</a></h2><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">npm</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> install</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">npm</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> start</span></span></code></pre></div><p>For production Docker deployments, start with the <a href="/Server-Manager-Portal/guide/docker">Docker guide</a>.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
