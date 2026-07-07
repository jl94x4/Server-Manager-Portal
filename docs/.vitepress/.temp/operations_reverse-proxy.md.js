import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Reverse Proxy","description":"","frontmatter":{},"headers":[],"relativePath":"operations/reverse-proxy.md","filePath":"operations/reverse-proxy.md","lastUpdated":null}');
const _sfc_main = { name: "operations/reverse-proxy.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="reverse-proxy" tabindex="-1">Reverse Proxy <a class="header-anchor" href="#reverse-proxy" aria-label="Permalink to &quot;Reverse Proxy&quot;">​</a></h1><p>Run the app on an internal port and proxy HTTPS to it with Caddy, Nginx, Traefik, Cloudflare Tunnel, or a similar reverse proxy.</p><h2 id="root-hosting" tabindex="-1">Root Hosting <a class="header-anchor" href="#root-hosting" aria-label="Permalink to &quot;Root Hosting&quot;">​</a></h2><p>Root hosting is the simplest option.</p><div class="language-txt vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">txt</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>portal.example.com {</span></span>
<span class="line"><span>    reverse_proxy localhost:2121</span></span>
<span class="line"><span>}</span></span></code></pre></div><p>Use:</p><div class="language-ini vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">ini</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#D73A49", "--shiki-dark": "#F97583" })}">FORCE_SECURE_COOKIES</span><span style="${ssrRenderStyle({ "--shiki-light": "#24292E", "--shiki-dark": "#E1E4E8" })}">=true</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#D73A49", "--shiki-dark": "#F97583" })}">PUBLIC_BASE_URL</span><span style="${ssrRenderStyle({ "--shiki-light": "#24292E", "--shiki-dark": "#E1E4E8" })}">=https://portal.example.com</span></span></code></pre></div><h2 id="subpath-hosting" tabindex="-1">Subpath Hosting <a class="header-anchor" href="#subpath-hosting" aria-label="Permalink to &quot;Subpath Hosting&quot;">​</a></h2><p>The portal can run under a path such as <code>https://media.example.com/portal</code>.</p><div class="language-txt vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">txt</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>media.example.com {</span></span>
<span class="line"><span>    handle /portal/* {</span></span>
<span class="line"><span>        reverse_proxy localhost:2121</span></span>
<span class="line"><span>    }</span></span>
<span class="line"><span>}</span></span></code></pre></div><p>Use:</p><div class="language-ini vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">ini</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#D73A49", "--shiki-dark": "#F97583" })}">BASE_PATH</span><span style="${ssrRenderStyle({ "--shiki-light": "#24292E", "--shiki-dark": "#E1E4E8" })}">=/portal</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#D73A49", "--shiki-dark": "#F97583" })}">PUBLIC_BASE_URL</span><span style="${ssrRenderStyle({ "--shiki-light": "#24292E", "--shiki-dark": "#E1E4E8" })}">=https://media.example.com/portal</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#D73A49", "--shiki-dark": "#F97583" })}">FORCE_SECURE_COOKIES</span><span style="${ssrRenderStyle({ "--shiki-light": "#24292E", "--shiki-dark": "#E1E4E8" })}">=true</span></span></code></pre></div><p><code>BASE_PATH</code> can be omitted when <code>PUBLIC_BASE_URL</code> already includes the path. The app derives the path from the public URL.</p><p>The proxy should forward requests with the path prefix intact. Do not strip <code>/portal</code> before requests reach the app.</p><h2 id="cookie-notes" tabindex="-1">Cookie Notes <a class="header-anchor" href="#cookie-notes" aria-label="Permalink to &quot;Cookie Notes&quot;">​</a></h2><p>Only enable <code>FORCE_SECURE_COOKIES=true</code> when the public route is HTTPS. Leaving it enabled for plain HTTP LAN access prevents browsers from sending the session cookie.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("operations/reverse-proxy.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const reverseProxy = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  reverseProxy as default
};
