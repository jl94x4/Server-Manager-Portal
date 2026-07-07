import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Background Tasks","description":"","frontmatter":{},"headers":[],"relativePath":"operations/background-tasks.md","filePath":"operations/background-tasks.md","lastUpdated":null}');
const _sfc_main = { name: "operations/background-tasks.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="background-tasks" tabindex="-1">Background Tasks <a class="header-anchor" href="#background-tasks" aria-label="Permalink to &quot;Background Tasks&quot;">​</a></h1><p>The Background Tasks settings page shows the active scheduler and lets admins run jobs manually.</p><p>Task labels adapt to the selected media player:</p><table tabindex="0"><thead><tr><th>Task</th><th>Plex Mode</th><th>Jellyfin Mode</th></tr></thead><tbody><tr><td>User sync</td><td>Sync Plex users</td><td>Sync Jellyfin users</td></tr><tr><td>Expiry checks</td><td>Email users nearing expiry</td><td>Same</td></tr><tr><td>Revoke access</td><td>Remove expired Plex access</td><td>Revoke expired portal access</td></tr><tr><td>Inactive cleanup</td><td>Revoke inactive users</td><td>Revoke inactive Jellyfin portal users</td></tr><tr><td>Analytics cache</td><td>Plex and Tautulli data where configured</td><td>Jellyfin and JellyStat data where configured</td></tr><tr><td>Library stats</td><td>Plex stats builder</td><td>Hidden in Jellyfin mode</td></tr><tr><td>Maintenance index</td><td>Build media/request index</td><td>Same</td></tr><tr><td>Rolling backup</td><td>Create config backups</td><td>Same</td></tr></tbody></table><h2 id="diagnostics" tabindex="-1">Diagnostics <a class="header-anchor" href="#diagnostics" aria-label="Permalink to &quot;Diagnostics&quot;">​</a></h2><p>The Settings System diagnostics page uses the same media-aware task list. A Jellyfin portal is not expected to pass Plex-only checks, and Plex-only jobs are hidden where appropriate.</p><h2 id="backups" tabindex="-1">Backups <a class="header-anchor" href="#backups" aria-label="Permalink to &quot;Backups&quot;">​</a></h2><p>Rolling backups are written to the backup directory. In Docker, mount <code>/app/backup</code> so snapshots survive container replacement.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("operations/background-tasks.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const backgroundTasks = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  backgroundTasks as default
};
