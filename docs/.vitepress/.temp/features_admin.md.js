import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Admin Dashboard","description":"","frontmatter":{},"headers":[],"relativePath":"features/admin.md","filePath":"features/admin.md","lastUpdated":null}');
const _sfc_main = { name: "features/admin.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="admin-dashboard" tabindex="-1">Admin Dashboard <a class="header-anchor" href="#admin-dashboard" aria-label="Permalink to &quot;Admin Dashboard&quot;">​</a></h1><p>The admin dashboard is the operations center for the portal owner.</p><h2 id="live-session-monitor" tabindex="-1">Live Session Monitor <a class="header-anchor" href="#live-session-monitor" aria-label="Permalink to &quot;Live Session Monitor&quot;">​</a></h2><p>Admins can see active streams in real time with user identity, media title, playback progress, stream type, and technical playback details such as codecs, bitrate, resolution, and transcode reason.</p><h2 id="user-management" tabindex="-1">User Management <a class="header-anchor" href="#user-management" aria-label="Permalink to &quot;User Management&quot;">​</a></h2><p>The user table includes usernames, email addresses, avatars, access expiry, last-seen data, and quick actions:</p><ul><li>Add one month.</li><li>Add one year.</li><li>Grant unlimited access.</li><li>Revoke access.</li></ul><h2 id="settings" tabindex="-1">Settings <a class="header-anchor" href="#settings" aria-label="Permalink to &quot;Settings&quot;">​</a></h2><p>The Settings area controls media-player integration, SMTP, scheduled tasks, branding, home layout, status services, media stack integrations, and diagnostics.</p><h2 id="home-layout" tabindex="-1">Home Layout <a class="header-anchor" href="#home-layout" aria-label="Permalink to &quot;Home Layout&quot;">​</a></h2><p>Admins can reorder major home sections, hide or show them, and preview the result before saving. Admin-only widgets remain protected by backend validation.</p><h2 id="library-maintenance" tabindex="-1">Library Maintenance <a class="header-anchor" href="#library-maintenance" aria-label="Permalink to &quot;Library Maintenance&quot;">​</a></h2><p>The maintenance tools can scan for missing or empty media, manage exclusions, and run cleanup tasks from the portal.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("features/admin.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const admin = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  admin as default
};
