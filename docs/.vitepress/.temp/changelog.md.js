import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Changelog","description":"","frontmatter":{},"headers":[],"relativePath":"changelog.md","filePath":"changelog.md","lastUpdated":null}');
const _sfc_main = { name: "changelog.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="changelog" tabindex="-1">Changelog <a class="header-anchor" href="#changelog" aria-label="Permalink to &quot;Changelog&quot;">​</a></h1><p>The project changelog is maintained at the repository root:</p><p><a href="https://github.com/jl94x4/Server-Manager-Portal/blob/main/CHANGELOG.md" target="_blank" rel="noreferrer">View CHANGELOG.md</a></p><p>Use it for detailed release history, new features, and bug fixes.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("changelog.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const changelog = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  changelog as default
};
