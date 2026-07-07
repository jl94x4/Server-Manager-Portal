import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Project Structure","description":"","frontmatter":{},"headers":[],"relativePath":"development/project-structure.md","filePath":"development/project-structure.md","lastUpdated":null}');
const _sfc_main = { name: "development/project-structure.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="project-structure" tabindex="-1">Project Structure <a class="header-anchor" href="#project-structure" aria-label="Permalink to &quot;Project Structure&quot;">​</a></h1><div class="language-text vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>Server-Manager-Portal/</span></span>
<span class="line"><span>├── index.js</span></span>
<span class="line"><span>├── index.tsx</span></span>
<span class="line"><span>├── client/</span></span>
<span class="line"><span>│   ├── App.tsx</span></span>
<span class="line"><span>│   ├── screens.tsx</span></span>
<span class="line"><span>│   ├── home/</span></span>
<span class="line"><span>│   ├── settings/</span></span>
<span class="line"><span>│   ├── shared/</span></span>
<span class="line"><span>│   ├── setup/</span></span>
<span class="line"><span>│   └── maintenance/</span></span>
<span class="line"><span>├── input.css</span></span>
<span class="line"><span>├── static/</span></span>
<span class="line"><span>├── lib/</span></span>
<span class="line"><span>├── config/</span></span>
<span class="line"><span>├── Dockerfile</span></span>
<span class="line"><span>├── docker-compose.yml</span></span>
<span class="line"><span>├── unraid/</span></span>
<span class="line"><span>├── docs/</span></span>
<span class="line"><span>├── .env.example</span></span>
<span class="line"><span>├── build-version.js</span></span>
<span class="line"><span>└── package.json</span></span></code></pre></div><h2 id="backend" tabindex="-1">Backend <a class="header-anchor" href="#backend" aria-label="Permalink to &quot;Backend&quot;">​</a></h2><p><code>index.js</code> contains the Express API, authentication, Plex and Jellyfin integrations, email handling, security headers, rate limiting, background jobs, and static asset serving.</p><h2 id="frontend" tabindex="-1">Frontend <a class="header-anchor" href="#frontend" aria-label="Permalink to &quot;Frontend&quot;">​</a></h2><p><code>index.tsx</code> mounts the React application. The app source lives in <code>client/</code>:</p><table tabindex="0"><thead><tr><th>Path</th><th>Purpose</th></tr></thead><tbody><tr><td><code>client/App.tsx</code></td><td>Application shell and responsive navigation</td></tr><tr><td><code>client/screens.tsx</code></td><td>Main views, dashboards, login, and shared screens</td></tr><tr><td><code>client/home/</code></td><td>User dashboard layout and widgets</td></tr><tr><td><code>client/settings/</code></td><td>Settings panels</td></tr><tr><td><code>client/shared/</code></td><td>API helpers, types, themes, formatters, UI helpers</td></tr><tr><td><code>client/setup/</code></td><td>First-time setup wizard</td></tr><tr><td><code>client/maintenance/</code></td><td>Library maintenance UI</td></tr></tbody></table><h2 id="styling-and-builds" tabindex="-1">Styling and Builds <a class="header-anchor" href="#styling-and-builds" aria-label="Permalink to &quot;Styling and Builds&quot;">​</a></h2><p>Tailwind source lives in <code>input.css</code>, and generated CSS is written to <code>static/tailwind.css</code>.</p><p>The React bundle is produced by esbuild and written to <code>static/bundle.js</code>.</p><h2 id="runtime-data" tabindex="-1">Runtime Data <a class="header-anchor" href="#runtime-data" aria-label="Permalink to &quot;Runtime Data&quot;">​</a></h2><p><code>lib/data-paths.js</code> centralizes runtime file paths and migrates legacy root-level JSON files into <code>config/</code>.</p><p><code>config/</code> and <code>backup/</code> are runtime directories and should not be committed.</p><h2 id="docs" tabindex="-1">Docs <a class="header-anchor" href="#docs" aria-label="Permalink to &quot;Docs&quot;">​</a></h2><p>The VitePress documentation source lives in <code>docs/</code>.</p><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">npm</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> run</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> docs:dev</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">npm</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> run</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> docs:build</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">npm</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> run</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> docs:preview</span></span></code></pre></div></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("development/project-structure.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const projectStructure = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  projectStructure as default
};
