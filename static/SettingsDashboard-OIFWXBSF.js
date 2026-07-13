import {
  UPGRADER_PRESET_SELECT_OPTIONS
} from "./chunk-3BEYC6OD.js";
import {
  ArrInstancesPanel,
  DASHBOARD_SECTION_LABELS,
  DEFAULT_DASHBOARD_LAYOUT,
  IntegrationTestButton,
  SECTION_PREVIEW_META,
  appConfirm,
  lockWidgetLayout,
  normalizeSectionLayout
} from "./chunk-DHMEH53D.js";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  CustomSelect,
  Eye,
  EyeOff,
  GripVertical,
  Loader,
  RotateCcw,
  Search,
  SettingsToggleRow,
  ToastContainer,
  __toESM,
  apiFetch,
  getPublicOrigin,
  portalUrl,
  pushToast,
  require_jsx_runtime,
  require_react,
  resolvePortalAssetUrl
} from "./chunk-A5P6542F.js";

// client/settings/SettingsDashboard.tsx
var import_react8 = __toESM(require_react(), 1);

// client/settings/SettingHint.tsx
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var SettingHint = ({ children }) => {
  const detailsRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    const handleOutsideClick = (event) => {
      if (!detailsRef.current?.open) return;
      if (detailsRef.current.contains(event.target)) return;
      detailsRef.current.open = false;
    };
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;
      if (detailsRef.current?.open) {
        detailsRef.current.open = false;
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", { ref: detailsRef, className: "relative inline-flex align-middle shrink-0 group ml-1.5", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "summary",
      {
        className: "list-none inline-flex items-center justify-center cursor-pointer select-none text-plex/80 hover:text-plex transition-colors",
        "aria-label": "More information",
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-current text-[9px] leading-none font-semibold", children: "?" })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute z-20 mt-1.5 left-0 w-[min(420px,80vw)] bg-card border border-border rounded-lg px-3 py-2 text-xs text-muted shadow-xl", children })
  ] });
};
var SettingFieldLabel = ({ htmlFor, children, hint, className = "" }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { htmlFor, className: `inline-flex items-center gap-1.5 flex-wrap ${className}`, children: [
  children,
  hint
] });

// client/settings/StreamKillRulesPanel.tsx
var import_react2 = __toESM(require_react(), 1);
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
var RULE_FIELDS = [
  { value: "isTranscoding", label: "Is Transcoding", type: "bool" },
  { value: "videoResolution", label: "Video Resolution", type: "select", options: ["4k", "1080", "720", "480", "sd"] },
  { value: "transcodeVideoDecision", label: "Transcode Decision", type: "select", options: ["transcode", "copy", "directplay"] },
  { value: "mediaType", label: "Media Type", type: "select", options: ["movie", "episode", "track"] },
  { value: "state", label: "Playback State", type: "select", options: ["playing", "paused", "buffering"] },
  { value: "sessionLocation", label: "Connection Location", type: "select", options: ["lan", "wan", "cellular"] },
  { value: "videoCodec", label: "Video Codec", type: "text" },
  { value: "audioCodec", label: "Audio Codec", type: "text" },
  { value: "bandwidth", label: "Bandwidth (Mbps)", type: "number" },
  { value: "user", label: "Username", type: "text" },
  { value: "playerProduct", label: "Player App", type: "text" },
  { value: "playerTitle", label: "Player/Device Name", type: "text" }
];
var KR_OP_TEXT = [{ value: "equals", label: "equals" }, { value: "not_equals", label: "not equals" }, { value: "contains", label: "contains" }, { value: "not_contains", label: "doesn't contain" }];
var KR_OP_NUMBER = [{ value: "equals", label: "equals" }, { value: "not_equals", label: "not equals" }, { value: "greater_than", label: "greater than" }, { value: "less_than", label: "less than" }];
var KR_OP_BOOL = [{ value: "equals", label: "is" }];
var KR_OP_SELECT = [{ value: "equals", label: "equals" }, { value: "not_equals", label: "not equals" }];
function krGetOps(field) {
  if (!field) return KR_OP_TEXT;
  if (field.type === "bool") return KR_OP_BOOL;
  if (field.type === "number") return KR_OP_NUMBER;
  if (field.type === "select") return KR_OP_SELECT;
  return KR_OP_TEXT;
}
function krMkCond() {
  return { id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2), field: "isTranscoding", operator: "equals", value: "true" };
}
function krMkRule() {
  return { id: Date.now().toString(), name: "New Rule", enabled: true, conditionLogic: "AND", conditions: [krMkCond()], killMessage: "Your stream has been stopped by the server administrator." };
}
var KRConditionRow = ({ cond, onCh, onDel }) => {
  const fd = RULE_FIELDS.find((f) => f.value === cond.field);
  const ops = krGetOps(fd);
  const onField = (v) => {
    const def = RULE_FIELDS.find((f) => f.value === v);
    const dv = def?.type === "bool" ? "true" : def && "options" in def && def.options ? def.options[0] : "";
    onCh({ ...cond, field: v, value: dv, operator: krGetOps(def)[0].value });
  };
  const fieldOptions = RULE_FIELDS.map((f) => ({ label: f.label, value: f.value }));
  const opOptions = ops.map((o) => ({ label: o.label, value: o.value }));
  const boolOptions = [{ label: "Yes / True", value: "true" }, { label: "No / False", value: "false" }];
  const selectOptions = "options" in (fd ?? {}) && fd.options ? fd.options.map((o) => ({ label: o, value: o })) : [];
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex flex-wrap items-center gap-2 py-2 border-b border-border/30 last:border-b-0", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      CustomSelect,
      {
        value: cond.field,
        onChange: (v) => onField(v),
        options: fieldOptions,
        className: "flex-shrink-0 min-w-[160px]"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      CustomSelect,
      {
        value: cond.operator,
        onChange: (v) => onCh({ ...cond, operator: v }),
        options: opOptions,
        className: "flex-shrink-0 min-w-[130px]"
      }
    ),
    fd?.type === "bool" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      CustomSelect,
      {
        value: cond.value,
        onChange: (v) => onCh({ ...cond, value: v }),
        options: boolOptions,
        className: "flex-1 min-w-[110px]"
      }
    ) : fd?.type === "select" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      CustomSelect,
      {
        value: cond.value,
        onChange: (v) => onCh({ ...cond, value: v }),
        options: selectOptions,
        className: "flex-1 min-w-[110px]"
      }
    ) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "input",
      {
        type: fd?.type === "number" ? "number" : "text",
        value: cond.value,
        onChange: (e) => onCh({ ...cond, value: e.target.value }),
        placeholder: fd?.type === "number" ? "e.g. 20" : "e.g. Plex Web",
        className: "flex-1 min-w-[100px] bg-background border border-border text-text rounded-lg px-3 py-2 text-sm focus:border-plex focus:ring-1 focus:ring-plex outline-none transition-all"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { onClick: onDel, title: "Remove", className: "p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { xmlns: "http://www.w3.org/2000/svg", width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M18 6 6 18M6 6l12 12" }) }) })
  ] });
};
var StreamKillRulesPanel = ({ addToast, registerSaveHandler }) => {
  const [rules, setRules] = (0, import_react2.useState)([]);
  const [loading, setLoading] = (0, import_react2.useState)(true);
  const [saving, setSaving] = (0, import_react2.useState)(false);
  const [expanded, setExpanded] = (0, import_react2.useState)(null);
  (0, import_react2.useEffect)(() => {
    apiFetch("/api/kill-rules").then((d) => setRules(Array.isArray(d) ? d : [])).catch(() => addToast("Failed to load rules", "error")).finally(() => setLoading(false));
  }, []);
  const saveRules = async (r) => {
    setSaving(true);
    try {
      await apiFetch("/api/kill-rules", { method: "POST", body: JSON.stringify(r) });
      addToast("Stream rules saved!");
      return true;
    } catch {
      addToast("Failed to save rules", "error");
      return false;
    } finally {
      setSaving(false);
    }
  };
  const addRule = () => {
    const r = krMkRule();
    const u = [...rules, r];
    setRules(u);
    setExpanded(r.id);
  };
  const upd = (id, p) => setRules((prev) => prev.map((r) => r.id === id ? { ...r, ...p } : r));
  const del = (id) => setRules((prev) => prev.filter((r) => r.id !== id));
  const addCond = (id) => setRules((prev) => prev.map((r) => r.id === id ? { ...r, conditions: [...r.conditions ?? [], krMkCond()] } : r));
  const updCond = (rId, i, c) => setRules((prev) => prev.map((r) => {
    if (r.id !== rId) return r;
    const cs = [...r.conditions ?? []];
    cs[i] = c;
    return { ...r, conditions: cs };
  }));
  const delCond = (rId, i) => setRules((prev) => prev.map((r) => r.id === rId ? { ...r, conditions: (r.conditions ?? []).filter((_, j) => j !== i) } : r));
  (0, import_react2.useEffect)(() => {
    if (!registerSaveHandler) return;
    registerSaveHandler(() => saveRules(rules));
    return () => registerSaveHandler(null);
  }, [registerSaveHandler, rules]);
  if (loading) return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "flex justify-center py-20", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "w-8 h-8 border-4 border-plex border-t-transparent rounded-full animate-spin" }) });
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mb-8 animate-fade-in", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h3", { className: "text-xl font-bold text-plex mb-1 border-b border-border pb-2 flex items-center gap-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }) }),
      "Stream Kill Rules"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "text-sm text-muted mb-6 leading-relaxed", children: [
      "Define rules that automatically terminate Plex streams. Rules are evaluated every ",
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { className: "text-text", children: "15 seconds" }),
      ". Combine conditions using ",
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { className: "text-plex", children: "AND" }),
      " (all must match) or ",
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { className: "text-plex", children: "OR" }),
      " (any must match). The kill message appears on the user's Plex client screen."
    ] }),
    rules.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-xl text-center gap-3 mb-6", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { xmlns: "http://www.w3.org/2000/svg", width: "40", height: "40", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", className: "text-muted opacity-40", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "text-muted font-medium", children: "No rules configured" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "text-muted text-sm", children: "Add a rule below to start protecting your server automatically." })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "flex flex-col gap-4", children: rules.map((rule) => {
      const isOpen = expanded === rule.id;
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: `border-b border-border/40 pb-4 mb-4 last:border-b-0 last:mb-0 transition-opacity duration-200 ${rule.enabled ? "" : "opacity-70"}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center gap-3 py-2 cursor-pointer select-none", onClick: () => setExpanded(isOpen ? null : rule.id), children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              onClick: (e) => {
                e.stopPropagation();
                upd(rule.id, { enabled: !rule.enabled });
              },
              className: `relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${rule.enabled ? "bg-plex" : "bg-border"}`,
              children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: `absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${rule.enabled ? "translate-x-5" : ""}` })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                value: rule.name,
                onChange: (e) => {
                  e.stopPropagation();
                  upd(rule.id, { name: e.target.value });
                },
                onClick: (e) => e.stopPropagation(),
                className: "bg-transparent border-none outline-none text-text font-bold text-sm w-full placeholder-muted/50",
                placeholder: "Rule name..."
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "text-muted text-xs mt-0.5", children: [
              rule.conditions?.length || 0,
              " condition",
              rule.conditions?.length !== 1 ? "s" : "",
              " \xB7 Logic: ",
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-plex font-bold", children: rule.conditionLogic }),
              " \xB7 ",
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: rule.enabled ? "text-green-400 font-bold" : "text-muted", children: rule.enabled ? "Active" : "Disabled" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center gap-1 flex-shrink-0", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { onClick: (e) => {
              e.stopPropagation();
              del(rule.id);
            }, title: "Delete", className: "p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { xmlns: "http://www.w3.org/2000/svg", width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }) }) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", className: `text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m6 9 6 6 6-6" }) })
          ] })
        ] }),
        isOpen && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "pt-4 flex flex-col gap-5", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center gap-3 flex-wrap", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-muted text-xs font-bold uppercase tracking-wider", children: "Match" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "flex bg-black/40 rounded-lg p-0.5 border border-white/5", children: ["AND", "OR"].map((l) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "button",
              {
                onClick: () => upd(rule.id, { conditionLogic: l }),
                className: `px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition-all ${rule.conditionLogic === l ? "bg-plex text-black shadow" : "text-muted hover:text-text"}`,
                children: l
              },
              l
            )) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-muted text-xs font-bold uppercase tracking-wider", children: "of the following conditions" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex flex-col gap-2", children: [
            (rule.conditions || []).map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(KRConditionRow, { cond: c, onCh: (nc) => updCond(rule.id, i, nc), onDel: () => delCond(rule.id, i) }, c.id ?? i)),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { onClick: () => addCond(rule.id), className: "flex items-center gap-2 text-plex text-sm font-bold hover:text-plex/80 transition-colors mt-1 w-fit py-1", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 5v14M5 12h14" }) }),
              "Add Condition"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "text-xs font-bold uppercase tracking-wider text-muted mb-2 block", children: [
              "Kill Message ",
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "normal-case font-normal text-white/30", children: "(shown on user's Plex client)" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "textarea",
              {
                value: rule.killMessage,
                onChange: (e) => upd(rule.id, { killMessage: e.target.value }),
                rows: 2,
                className: "w-full bg-background border border-border text-text rounded-lg px-3 py-2 text-sm focus:border-plex focus:ring-1 focus:ring-plex outline-none transition-all resize-none",
                placeholder: "Your stream has been stopped by the server administrator."
              }
            )
          ] })
        ] })
      ] }, rule.id);
    }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center gap-3 mt-6 pt-4 border-t border-border", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { onClick: addRule, className: "flex items-center gap-2 px-3 py-2 bg-border text-text rounded-lg font-bold text-xs hover:bg-opacity-80 transition-all", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 5v14M5 12h14" }) }),
        "Add New Rule"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { onClick: () => saveRules(rules), disabled: saving, className: "flex items-center gap-2 px-4 py-2 bg-plex text-background rounded-lg font-bold text-xs hover:opacity-90 transition-all disabled:opacity-50", children: [
        saving ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "w-4 h-4 border-2 border-background/50 border-t-transparent rounded-full animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("polyline", { points: "17 21 17 13 7 13 7 21" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("polyline", { points: "7 3 7 8 15 8" })
        ] }),
        "Save Rules"
      ] })
    ] })
  ] });
};

// client/settings/InvitesSettings.tsx
var import_react3 = __toESM(require_react(), 1);

// client/settings/settingsIndex.ts
var SETTINGS_TABS = [
  "plex",
  "smtp",
  "newsletter",
  "cleanup",
  "mediastack",
  "branding",
  "navigation",
  "home-layout",
  "status",
  "invites",
  "tasks",
  "upgrader",
  "system",
  "contact",
  "broadcast",
  "stream-rules",
  "logs"
];
var SETTINGS_INDEX = [
  { id: "branding", tabId: "branding", label: "Portal UI", group: "Portal", keywords: ["theme", "logo", "color", "branding", "ui"] },
  { id: "branding/logo", tabId: "branding", sectionId: "logo", label: "Custom Logo", group: "Portal", keywords: ["logo", "icon", "favicon", "upload"] },
  { id: "branding/theme", tabId: "branding", sectionId: "theme", label: "Portal Theme", group: "Portal", keywords: ["theme", "plex dark", "slate", "jellyfin purple"] },
  { id: "branding/announcement", tabId: "branding", sectionId: "announcement", label: "Portal Announcement", group: "Portal", keywords: ["announcement", "banner", "notice"] },
  { id: "branding/poster-badges", tabId: "branding", sectionId: "poster-badges", label: "Poster Quality Badges", group: "Portal", keywords: ["poster", "quality", "badges", "hdr", "4k", "codec"] },
  { id: "branding/slideshow", tabId: "branding", sectionId: "slideshow", label: "TMDB Trending Slideshow", group: "Portal", keywords: ["slideshow", "tmdb", "trending", "background", "splash"] },
  { id: "contact", tabId: "contact", label: "Contact Details", group: "Portal", keywords: ["contact", "support", "help"] },
  { id: "contact/whatsapp", tabId: "contact", sectionId: "whatsapp", label: "WhatsApp Number", group: "Portal", keywords: ["whatsapp", "phone", "number"] },
  { id: "contact/email", tabId: "contact", sectionId: "email", label: "Contact Email", group: "Portal", keywords: ["email", "mail", "support"] },
  { id: "navigation", tabId: "navigation", label: "Navigation", group: "Portal", keywords: ["menu", "order", "sidebar", "nav"] },
  { id: "home-layout", tabId: "home-layout", label: "Home Layout", group: "Portal", keywords: ["dashboard", "widgets", "sections", "home", "layout", "reorder", "hide"] },
  { id: "plex", tabId: "plex", label: "Media Player", group: "Media Stack", keywords: ["plex", "jellyfin", "media", "player", "server"] },
  { id: "plex/connection", tabId: "plex", sectionId: "connection", label: "Media Server Connection", group: "Media Stack", keywords: ["token", "server", "docker", "url", "jellyfin", "plex"] },
  { id: "plex/privacy", tabId: "plex", sectionId: "privacy", label: "Stream User Privacy", group: "Media Stack", keywords: ["privacy", "anonymous", "hide", "stream", "users"] },
  { id: "plex/analytics-usernames", tabId: "plex", sectionId: "analytics-usernames", label: "Show Usernames in Analytics", group: "Media Stack", keywords: ["analytics", "usernames", "viewer", "privacy"] },
  { id: "plex/libraries", tabId: "plex", sectionId: "libraries", label: "Default Libraries", group: "Media Stack", keywords: ["libraries", "share", "temporary", "access"] },
  { id: "mediastack", tabId: "mediastack", label: "Integrations", group: "Media Stack", keywords: ["integrations", "arr", "sonarr", "radarr"] },
  { id: "mediastack/arr", tabId: "mediastack", sectionId: "arr", label: "Sonarr & Radarr Instances", group: "Media Stack", keywords: ["sonarr", "radarr", "arr", "instances"] },
  { id: "mediastack/tautulli", tabId: "mediastack", sectionId: "tautulli", label: "Tautulli Integration", group: "Media Stack", keywords: ["tautulli", "analytics", "plex"] },
  { id: "mediastack/jellystat", tabId: "mediastack", sectionId: "jellystat", label: "Jellystat Integration", group: "Media Stack", keywords: ["jellystat", "jellyfin", "analytics"] },
  { id: "mediastack/seerr", tabId: "mediastack", sectionId: "seerr", label: "Request App (Seerr/Ombi)", group: "Media Stack", keywords: ["seerr", "overseerr", "jellyseerr", "ombi", "request"] },
  { id: "mediastack/tmdb", tabId: "mediastack", sectionId: "tmdb", label: "TMDB API Key", group: "Media Stack", keywords: ["tmdb", "api", "trending", "metadata"] },
  { id: "status", tabId: "status", label: "Status Monitor", group: "Media Stack", keywords: ["uptime", "health", "services", "monitor"] },
  { id: "smtp", tabId: "smtp", label: "SMTP Alerts", group: "Comms", keywords: ["mail", "smtp", "email", "alerts", "test"] },
  { id: "newsletter", tabId: "newsletter", label: "Newsletter", group: "Comms", keywords: ["digest", "send", "frequency", "weekly", "monthly"] },
  { id: "broadcast", tabId: "broadcast", label: "Broadcast Email", group: "Comms", keywords: ["announcement", "bulk", "users", "broadcast"] },
  { id: "invites", tabId: "invites", label: "Invites", group: "Comms", keywords: ["invite", "link", "code"] },
  { id: "invites/referral", tabId: "invites", sectionId: "referral", label: "Referral System", group: "Comms", keywords: ["referral", "reward", "trial", "invite friends"] },
  { id: "invites/links", tabId: "invites", sectionId: "invite-links", label: "Automated Invite Links", group: "Comms", keywords: ["invite link", "generate", "email invite"] },
  { id: "cleanup", tabId: "cleanup", label: "Cleanup", group: "Automation", keywords: ["inactive", "revoke", "expiry", "cleanup"] },
  { id: "stream-rules", tabId: "stream-rules", label: "Stream Rules", group: "Automation", keywords: ["kill", "transcode", "rule", "stream"] },
  { id: "tasks", tabId: "tasks", label: "Background Tasks", group: "Automation", keywords: ["jobs", "scheduler", "run now", "tasks"] },
  { id: "upgrader", tabId: "upgrader", label: "Library Upgrader", group: "Automation", keywords: ["upgrader", "hevc", "h264", "codec", "upgrade", "sonarr", "radarr"] },
  { id: "system", tabId: "system", label: "System", group: "Automation", keywords: ["system", "diagnostics", "backup"] },
  { id: "system/health", tabId: "system", sectionId: "health", label: "Health Dashboard", group: "Automation", keywords: ["health", "score", "alerts", "integrations"] },
  { id: "system/maintenance", tabId: "system", sectionId: "maintenance", label: "Cleaner Experimental Mode", group: "Automation", keywords: ["cleaner", "maintenance", "experimental"] },
  { id: "system/backup", tabId: "system", sectionId: "backup", label: "Backup & Restore", group: "Automation", keywords: ["backup", "restore", "export", "import"] },
  { id: "system/diagnostics", tabId: "system", sectionId: "diagnostics", label: "Diagnostics", group: "Automation", keywords: ["diagnostics", "version", "node", "debug"] },
  { id: "logs", tabId: "logs", label: "Logs & Audit", group: "Automation", keywords: ["audit", "emails", "deleted users", "history", "logs"] }
];
var SETTINGS_TAB_GROUPS = [
  { title: "Portal", tabs: SETTINGS_INDEX.filter((entry) => entry.group === "Portal" && !entry.sectionId) },
  { title: "Media Stack", tabs: SETTINGS_INDEX.filter((entry) => entry.group === "Media Stack" && !entry.sectionId) },
  { title: "Comms", tabs: SETTINGS_INDEX.filter((entry) => entry.group === "Comms" && !entry.sectionId) },
  { title: "Automation", tabs: SETTINGS_INDEX.filter((entry) => entry.group === "Automation" && !entry.sectionId) }
].map((group) => ({
  title: group.title,
  tabs: group.tabs.map((entry) => ({
    id: entry.tabId,
    label: entry.label,
    keywords: entry.keywords
  }))
}));
var RECENT_KEY = "portal-settings-recent";
var RECENT_LIMIT = 6;
var parseSettingsHash = (hash) => {
  const raw = hash.replace(/^#/, "").trim();
  if (!raw) return { tabId: null, sectionId: null };
  if (raw === "system/upgrader") return { tabId: "upgrader", sectionId: null };
  const [tabPart, ...sectionParts] = raw.split("/");
  const tabId = SETTINGS_TABS.includes(tabPart) ? tabPart : null;
  const sectionId = sectionParts.length > 0 ? sectionParts.join("/") : null;
  return { tabId, sectionId };
};
var buildSettingsHash = (tabId, sectionId) => sectionId ? `#${tabId}/${sectionId}` : `#${tabId}`;
var getSettingsSectionElementId = (sectionId) => `settings-section-${sectionId}`;
var searchSettingsIndex = (term) => {
  const query = term.trim().toLowerCase();
  if (!query) return [];
  return SETTINGS_INDEX.filter((entry) => {
    const haystack = `${entry.group} ${entry.label} ${entry.keywords.join(" ")}`.toLowerCase();
    return haystack.includes(query);
  }).slice(0, 12);
};
var getRecentSettingsIds = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
};
var recordRecentSetting = (entryId) => {
  if (typeof window === "undefined") return;
  const existing = getRecentSettingsIds().filter((id) => id !== entryId);
  const next = [entryId, ...existing].slice(0, RECENT_LIMIT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
};
var resolveSettingsEntry = (entryId) => SETTINGS_INDEX.find((entry) => entry.id === entryId);
var getRecentSettingsEntries = () => getRecentSettingsIds().map((id) => resolveSettingsEntry(id)).filter((entry) => !!entry);

// client/settings/InvitesSettings.tsx
var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
var InvitesSettings = ({
  addToast,
  referralEnabled,
  setReferralEnabled,
  referralTrialDays,
  setReferralTrialDays,
  referralRewardDays,
  setReferralRewardDays
}) => {
  const [invites, setInvites] = (0, import_react3.useState)([]);
  const [loading, setLoading] = (0, import_react3.useState)(true);
  const [durationDays, setDurationDays] = (0, import_react3.useState)(30);
  const [maxUses, setMaxUses] = (0, import_react3.useState)(1);
  const [emailInvite, setEmailInvite] = (0, import_react3.useState)("");
  const [emailing, setEmailing] = (0, import_react3.useState)(false);
  const [libraries, setLibraries] = (0, import_react3.useState)([]);
  const [selectedLibraries, setSelectedLibraries] = (0, import_react3.useState)([]);
  const fetchInvites = (0, import_react3.useCallback)(async () => {
    try {
      const data = await apiFetch("/api/invites");
      setInvites(data);
      const libData = await apiFetch("/api/plex/libraries").catch(() => []);
      setLibraries(libData || []);
    } catch (e) {
      addToast("Failed to load invites", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);
  (0, import_react3.useEffect)(() => {
    fetchInvites();
  }, [fetchInvites]);
  const handleCreate = async () => {
    try {
      await apiFetch("/api/invites", {
        method: "POST",
        body: JSON.stringify({ durationDays, maxUses, libraryIds: selectedLibraries })
      });
      addToast("Invite link created", "success");
      fetchInvites();
    } catch (e) {
      addToast(e.message || "Error creating invite", "error");
    }
  };
  const handleEmailInvite = async () => {
    if (!emailInvite) return addToast("Please enter an email address", "error");
    setEmailing(true);
    try {
      await apiFetch("/api/invites/email", {
        method: "POST",
        body: JSON.stringify({ email: emailInvite, durationDays, libraryIds: selectedLibraries })
      });
      addToast("Email invite sent!", "success");
      setEmailInvite("");
      fetchInvites();
    } catch (e) {
      addToast(e.message || "Error sending email invite", "error");
    } finally {
      setEmailing(false);
    }
  };
  const handleDelete = async (code) => {
    appConfirm("Are you sure you want to delete this invite link?", async () => {
      try {
        await apiFetch(`/api/invites/${code}`, { method: "DELETE" });
        addToast("Invite link deleted", "success");
        fetchInvites();
      } catch (e) {
        addToast(e.message || "Error deleting invite", "error");
      }
    });
  };
  const handleCopy = (code) => {
    navigator.clipboard.writeText(`${getPublicOrigin()}/invite/${code}`);
    addToast("Invite link copied to clipboard!", "success");
  };
  if (loading) return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "text-muted", children: "Loading invites..." });
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "animate-fade-in mb-8 space-y-10", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { id: getSettingsSectionElementId("referral"), className: "scroll-mt-24", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { className: "text-xl font-bold text-plex mb-4 border-b border-border pb-2", children: "Referral System" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "text-sm text-muted mb-6", children: "Let existing members share a referral link. New users get temporary access; referrers earn bonus days when someone joins." }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        SettingsToggleRow,
        {
          title: "Enable Referrals",
          hint: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(SettingHint, { children: "Allow users to generate a referral link from their home page." }),
          checked: referralEnabled,
          onChange: setReferralEnabled,
          border: false,
          className: "mb-6"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: `transition-all ${!referralEnabled ? "opacity-50 pointer-events-none" : ""}`, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex flex-col sm:flex-row gap-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex-1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { className: "block text-sm mb-1 font-medium", children: "Referred User Temporary Access Days" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "number", min: "0", className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex transition-all", value: referralTrialDays, onChange: (e) => setReferralTrialDays(Number(e.target.value)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex-1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { className: "block text-sm mb-1 font-medium", children: "Referrer Reward Days" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "number", min: "0", className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex transition-all", value: referralRewardDays, onChange: (e) => setReferralRewardDays(Number(e.target.value)) })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { id: getSettingsSectionElementId("invite-links"), className: "scroll-mt-24", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { className: "text-xl font-bold text-plex mb-4 border-b border-border pb-2", children: "Automated Invite Links" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "text-sm text-muted mb-6", children: "Generate unique links to automatically invite users to your Plex server." }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "space-y-6 mb-8", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h4", { className: "font-bold", children: "Create New Invite Link" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex flex-col md:flex-row gap-4 items-end mb-6", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex-1 w-full", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { className: "block text-sm mb-1 font-medium", children: "Duration (Days)" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "number", min: "1", className: "w-full p-2.5 rounded-lg bg-background border border-border text-text outline-none focus:border-plex", value: durationDays, onChange: (e) => setDurationDays(Number(e.target.value)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex-1 w-full", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { className: "block text-sm mb-1 font-medium", children: "Max Uses (Number or 'unlimited')" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "text", className: "w-full p-2.5 rounded-lg bg-background border border-border text-text outline-none focus:border-plex", value: maxUses, onChange: (e) => setMaxUses(e.target.value) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: "w-full md:w-auto px-6 py-2.5 bg-plex text-background font-bold rounded-lg hover:bg-plex-hover transition-colors shadow-lg", onClick: handleCreate, children: "Generate Link" })
        ] }),
        libraries.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mb-6", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { className: "block text-sm mb-2 font-medium", children: "Libraries to Share (Leave unselected to share ALL libraries)" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "flex flex-wrap gap-2", children: libraries.map((lib) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "flex items-center gap-2 bg-background border border-border px-3 py-2 rounded-lg cursor-pointer hover:border-plex transition-colors", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "input",
              {
                type: "checkbox",
                checked: selectedLibraries.includes(lib.id),
                onChange: (e) => {
                  if (e.target.checked) setSelectedLibraries([...selectedLibraries, lib.id]);
                  else setSelectedLibraries(selectedLibraries.filter((id) => id !== lib.id));
                },
                className: "accent-plex"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "text-sm font-medium", children: lib.title })
          ] }, lib.id)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "border-t border-border/50 pt-6", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h4", { className: "font-bold mb-4", children: "Direct Email Invite" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "text-sm text-muted mb-4", children: "Send a 1-time use invite directly to a user's email address (uses the Duration defined above)." }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex flex-col md:flex-row gap-4 items-end", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex-1 w-full", children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { className: "block text-sm mb-1 font-medium", children: "Email Address" }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "email", placeholder: "user@example.com", className: "w-full p-2.5 rounded-lg bg-background border border-border text-text outline-none focus:border-plex", value: emailInvite, onChange: (e) => setEmailInvite(e.target.value) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { disabled: emailing, className: "w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50", onClick: handleEmailInvite, children: emailing ? "Sending..." : "Send Email Invite" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "overflow-x-auto", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("table", { className: "w-full text-left border-collapse min-w-[600px]", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("tr", { className: "border-b border-border text-muted text-sm uppercase tracking-wider", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { className: "p-3", children: "Invite Link" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { className: "p-3", children: "Duration" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { className: "p-3", children: "Uses" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { className: "p-3", children: "Libraries" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { className: "p-3", children: "Created" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { className: "p-3 text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("tbody", { children: invites.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { colSpan: 6, className: "p-8 text-center text-muted", children: "No active invites. Create one above!" }) }) : invites.map((inv) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("tr", { className: "border-b border-border/50 hover:bg-white/5 transition-colors", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { className: "p-3", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "font-mono text-sm text-plex select-all", children: [
              getPublicOrigin(),
              "/invite/",
              inv.code
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { onClick: () => handleCopy(inv.code), className: "text-muted hover:text-plex transition-colors p-1", title: "Copy Link", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Copy, { size: 16 }) })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("td", { className: "p-3 font-medium", children: [
            inv.durationDays,
            " days"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("td", { className: "p-3", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "font-medium", children: inv.maxUses === "unlimited" ? "Unlimited" : `${inv.currentUses} / ${inv.maxUses}` }),
            inv.usedBy && inv.usedBy.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mt-1.5 flex flex-wrap gap-1 max-w-[200px]", children: inv.usedBy.map((u, idx) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "text-[10px] text-plex bg-plex/10 border border-plex/20 px-1.5 py-0.5 rounded shadow-sm", title: `Claimed on ${new Date(u.date).toLocaleString()} by ${u.email}`, children: u.username }, idx)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { className: "p-3 text-sm", children: inv.libraryIds && inv.libraryIds.length > 0 ? libraries.filter((l) => inv.libraryIds.includes(l.id)).map((l) => l.title).join(", ") || `${inv.libraryIds.length} selected` : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "text-plex opacity-80", children: "All Libraries" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("td", { className: "p-3 text-muted text-sm", children: [
            new Date(inv.createdAt).toLocaleDateString(),
            inv.sentTo && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "text-xs text-blue-400 mt-1", children: [
              "Sent to: ",
              inv.sentTo
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { className: "p-3 text-right", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { onClick: () => handleDelete(inv.code), className: "text-red-500 hover:text-red-400 font-bold border border-red-500/30 px-3 py-1 rounded hover:bg-red-500/10 transition-colors text-xs", children: "Revoke" }) })
        ] }, inv.code)) })
      ] }) })
    ] })
  ] });
};

// client/settings/StatusMonitorSettings.tsx
var import_react4 = __toESM(require_react(), 1);
var import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
var StatusMonitorSettings = ({ config, onChange, appConfirm: appConfirm2, fetchConfig, addToast }) => {
  const [localConfig, setLocalConfig] = (0, import_react4.useState)({ groups: [], services: [] });
  (0, import_react4.useEffect)(() => {
    if (config) {
      setLocalConfig({
        groups: config.groups || [],
        services: config.services || []
      });
    }
  }, [config]);
  const addGroup = () => {
    const id = `group-${Date.now()}`;
    const newConfig = { ...localConfig, groups: [...localConfig.groups, { id, name: "New Group", order: localConfig.groups.length }] };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };
  const addService = () => {
    const id = `service-${Date.now()}`;
    const newService = {
      id,
      name: "New Service",
      url: "",
      category: "web",
      type: "http",
      groupId: null,
      isCritical: true,
      description: ""
    };
    const newConfig = { ...localConfig, services: [...localConfig.services, newService] };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };
  const updateGroup = (id, field, value) => {
    const newConfig = {
      ...localConfig,
      groups: localConfig.groups.map((g) => g.id === id ? { ...g, [field]: value } : g)
    };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };
  const updateService = (id, field, value) => {
    const newConfig = {
      ...localConfig,
      services: localConfig.services.map((s) => s.id === id ? { ...s, [field]: value } : s)
    };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };
  const removeGroup = async (id) => {
    const groupName = localConfig.groups.find((g) => g.id === id)?.name || "this group";
    appConfirm2(`Remove group "${groupName}"? Services inside it won't be deleted but will lose their group.`, () => {
      const newConfig = {
        ...localConfig,
        groups: localConfig.groups.filter((g) => g.id !== id),
        services: localConfig.services.map((s) => s.groupId === id ? { ...s, groupId: null } : s)
      };
      setLocalConfig(newConfig);
      onChange(newConfig);
    });
  };
  const removeService = async (id) => {
    appConfirm2(`Remove service ${id}?`, () => {
      const newConfig = {
        ...localConfig,
        services: localConfig.services.filter((s) => s.id !== id)
      };
      setLocalConfig(newConfig);
      onChange(newConfig);
    });
  };
  const handleResetStats = () => {
    appConfirm2("Are you sure you want to reset all uptime statistics? This will delete all historical status data.", async () => {
      try {
        const res = await apiFetch("/api/status/reset", { method: "POST" });
        if (res.error) throw new Error(res.error);
        addToast("Status statistics reset successfully.", "success");
      } catch (e) {
        addToast(e.message || "Failed to reset statistics.", "error");
      }
    });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex flex-col gap-8 w-full", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex justify-between items-center mb-4 border-b border-border pb-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h4", { className: "font-bold text-xl text-text", children: "Service Groups" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { onClick: addGroup, className: "px-4 py-2 bg-white/10 hover:bg-white/20 text-text rounded-md text-sm font-bold transition-colors", children: "Add Group" })
      ] }),
      localConfig.groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex flex-col sm:flex-row sm:items-center gap-3 mb-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "input",
          {
            type: "text",
            value: group.name,
            onChange: (e) => updateGroup(group.id, "name", e.target.value),
            className: "flex-1 w-full p-3 rounded-lg bg-background border border-border focus:border-plex outline-none text-sm",
            placeholder: "Group Name"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", onClick: () => removeGroup(group.id), className: "px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-md text-xs font-bold transition-colors flex-shrink-0 sm:w-[5.75rem]", children: "Remove" })
      ] }, group.id)),
      localConfig.groups.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-muted text-sm italic py-2", children: "No groups defined. Create one to organize your services." })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex justify-between items-center mb-4 border-b border-border pb-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h4", { className: "font-bold text-xl text-text", children: "Monitored Services" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { onClick: addService, className: "px-4 py-2 bg-plex text-background hover:bg-plex-hover rounded-md text-sm font-bold transition-colors shadow-lg", children: "Add Service" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "flex flex-col gap-6", children: localConfig.services.map((service) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex flex-col gap-3 pb-6 border-b border-border/40 last:border-b-0 last:pb-0", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("label", { className: "block text-sm text-muted mb-1", children: "Service Name" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "input",
            {
              type: "text",
              value: service.name,
              onChange: (e) => updateService(service.id, "name", e.target.value),
              className: "w-full p-3 rounded-lg bg-background border border-border focus:border-plex outline-none text-sm font-bold",
              placeholder: "Service Name"
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("label", { className: "block text-sm text-muted mb-1", children: "Service URL" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "input",
            {
              type: "text",
              value: service.url,
              onChange: (e) => updateService(service.id, "url", e.target.value),
              className: "w-full p-3 rounded-lg bg-background border border-border focus:border-plex outline-none text-sm font-mono",
              placeholder: "Service URL (e.g. https://...)"
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex flex-wrap items-center justify-between gap-3 text-sm", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-muted", children: "Group:" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "w-48", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              CustomSelect,
              {
                value: service.groupId || "",
                onChange: (val) => updateService(service.id, "groupId", val || null),
                options: [
                  { label: "None", value: "" },
                  ...localConfig.groups.map((g) => ({ label: g.name, value: g.id }))
                ]
              }
            ) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center gap-2 flex-shrink-0 ml-auto", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
              "button",
              {
                type: "button",
                onClick: () => updateService(service.id, "isCritical", !service.isCritical),
                className: `px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-2 ${service.isCritical ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-white/10 text-muted hover:bg-white/20"}`,
                children: [
                  "Critical: ",
                  service.isCritical ? "Yes" : "No"
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", onClick: () => removeService(service.id), className: "px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-md text-xs font-bold transition-colors w-[5.75rem]", children: "Remove" })
          ] })
        ] })
      ] }, service.id)) }),
      localConfig.services.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-muted text-sm italic py-2", children: "No services defined. Add some services to monitor." })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "border-t border-border/40 pt-6 mt-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h4", { className: "font-bold text-xl text-text mb-2", children: "Reset Statistics" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-sm text-muted mb-4", children: "Resetting the status statistics will clear all historical uptime and latency data for all monitored services. This action cannot be undone." }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        "button",
        {
          type: "button",
          onClick: handleResetStats,
          className: "px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-bold transition-colors shadow-lg",
          children: "Reset Uptime Data"
        }
      )
    ] })
  ] });
};

// client/settings/BroadcastSettingsTab.tsx
var import_react5 = __toESM(require_react(), 1);
var import_jsx_runtime5 = __toESM(require_jsx_runtime(), 1);
var BroadcastSettingsTab = ({ selectedUserIds, users }) => {
  const [subject, setSubject] = (0, import_react5.useState)("Big updates to the Plex Server! \u{1F680}");
  const [body, setBody] = (0, import_react5.useState)(`\u{1F3AC} <b>Hey everyone! Big updates to the Plex Server!</b> \u{1F680}<br><br>If you have any friends or family who want to check out the server, I\u2019m currently offering a <b>3-Day Temporary Access</b> pass with instant access to the entire library! \u{1F37F}<br>\u2705 No bank details needed<br>\u2705 No purchase required<br>\u2705 Instant, automated setup<br><br>We also just launched a brand new <b>User Portal</b> (https://yourdomain.com) packed with awesome features for everyone:<br>\u{1F552} <b>Account Status:</b> Easily check exactly how many days you have left until your account expires.<br>\u{1F7E2} <b>Server Health:</b> View live 24/7 uptime stats for all server services.<br>\u{1F4CA} <b>Live Library Stats:</b> See exact, live counts of our massive library.<br><br>Feel free to share the link (https://yourdomain.com) with anyone who might be interested! \u{1F447}`);
  const [recipientFilter, setRecipientFilter] = (0, import_react5.useState)("all");
  const [customSelectedUserIds, setCustomSelectedUserIds] = (0, import_react5.useState)([]);
  const [isSending, setIsSending] = (0, import_react5.useState)(false);
  const [isPreviewMode, setIsPreviewMode] = (0, import_react5.useState)(false);
  const [isSendingTest, setIsSendingTest] = (0, import_react5.useState)(false);
  const handleSend = async () => {
    setIsSending(true);
    try {
      const finalFilter = recipientFilter === "custom" ? "selected" : recipientFilter;
      const finalSelectedIds = recipientFilter === "custom" ? customSelectedUserIds : selectedUserIds;
      const res = await apiFetch("/api/users/broadcast", {
        method: "POST",
        body: JSON.stringify({ subject, body, recipientFilter: finalFilter, selectedUserIds: finalSelectedIds })
      });
      alert(res.message);
    } catch (e) {
      alert(e.message || "Failed to send broadcast");
    } finally {
      setIsSending(false);
    }
  };
  const handleTestSend = async () => {
    setIsSendingTest(true);
    try {
      const res = await apiFetch("/api/users/broadcast/test", {
        method: "POST",
        body: JSON.stringify({ subject, body })
      });
      alert(res.message);
    } catch (e) {
      alert(e.message || "Failed to send test broadcast");
    } finally {
      setIsSendingTest(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("label", { className: "block mb-2 font-bold text-text", children: "Recipients" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        CustomSelect,
        {
          value: recipientFilter,
          onChange: (val) => setRecipientFilter(val),
          options: [
            { label: "All Users", value: "all" },
            { label: "Active Users Only", value: "active" },
            { label: "Temporary Access Users Only", value: "trial" },
            { label: "Expiring Soon (Next 7 Days)", value: "expiring" },
            { label: "Expired Users", value: "expired" },
            ...selectedUserIds.length > 0 ? [{ label: `Selected Users (${selectedUserIds.length})`, value: "selected" }] : [],
            { label: "Custom User Selection...", value: "custom" }
          ]
        }
      )
    ] }),
    recipientFilter === "custom" && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "p-4 border border-border/40 rounded-lg max-h-48 overflow-y-auto", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "mb-2 font-bold text-text", children: [
        "Select Users (",
        customSelectedUserIds.length,
        " selected):"
      ] }),
      users.map((u) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "flex items-center gap-2 cursor-pointer py-1 text-sm text-text hover:text-plex transition-colors", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            className: "accent-plex w-4 h-4",
            type: "checkbox",
            checked: customSelectedUserIds.includes(u.id),
            onChange: (e) => {
              if (e.target.checked) setCustomSelectedUserIds((prev) => [...prev, u.id]);
              else setCustomSelectedUserIds((prev) => prev.filter((id) => id !== u.id));
            }
          }
        ),
        u.username,
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "text-muted", children: [
          "(",
          u.email || "No email",
          ")"
        ] })
      ] }, u.id))
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("label", { className: "block mb-2 font-bold text-text", children: "Subject" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "input",
        {
          className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all",
          type: "text",
          value: subject,
          onChange: (e) => setSubject(e.target.value)
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex justify-between items-center mb-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("label", { className: "font-bold text-text m-0", children: "Email Body (HTML supported)" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { className: "px-3 py-1 bg-border text-text rounded text-xs font-medium hover:bg-opacity-80 transition-colors", onClick: () => setIsPreviewMode(!isPreviewMode), children: isPreviewMode ? "Edit HTML" : "Preview Output" })
      ] }),
      isPreviewMode ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "iframe",
        {
          title: "Email body preview",
          sandbox: "",
          srcDoc: body,
          className: "w-full h-[300px] rounded-lg bg-white border border-border"
        }
      ) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "textarea",
        {
          value: body,
          onChange: (e) => setBody(e.target.value),
          className: "w-full h-[300px] p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all font-mono text-sm"
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex justify-end gap-3 mt-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { className: "px-6 py-2.5 bg-border text-text rounded-lg font-bold hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2", onClick: handleTestSend, disabled: isSending || isSendingTest, children: isSendingTest ? "Sending Test..." : "Send Test To Admin" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { className: "px-6 py-2.5 bg-plex text-background rounded-lg font-bold hover:bg-plex-hover transition-colors flex items-center justify-center gap-2", onClick: handleSend, disabled: isSending || isSendingTest, children: isSending ? "Sending..." : "Send Broadcast" })
    ] })
  ] });
};

// client/settings/HomeLayoutSettings.tsx
var import_react6 = __toESM(require_react(), 1);
var import_jsx_runtime6 = __toESM(require_jsx_runtime(), 1);
var reorderSections = (sections, from, to) => {
  if (from === to || from < 0 || to < 0 || from >= sections.length || to >= sections.length) return sections;
  const next = [...sections];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};
var SectionVisibilityToggle = ({ visible, onToggle }) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
  "button",
  {
    type: "button",
    onClick: (e) => {
      e.stopPropagation();
      onToggle();
    },
    "aria-pressed": visible,
    "aria-label": visible ? "Section shown on home page" : "Section hidden on home page",
    className: `inline-flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
            ${visible ? "bg-plex/15 border-plex/40 text-plex hover:bg-plex/25 shadow-[0_0_12px_rgba(229,160,13,0.12)]" : "bg-white/5 border-border/50 text-muted hover:border-white/20 hover:text-text"}`,
    children: [
      visible ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Eye, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(EyeOff, { className: "w-3.5 h-3.5" }),
      visible ? "Shown" : "Hidden"
    ]
  }
);
var SectionPreview = ({ layout }) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "rounded-xl border border-border/50 bg-background/40 p-4 space-y-2", children: [
  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "text-xs font-bold uppercase tracking-wider text-muted mb-3", children: "Live preview" }),
  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "flex flex-col gap-2", children: layout.sections.map((id) => {
    const meta = SECTION_PREVIEW_META[id];
    const hidden = layout.hiddenSections.includes(id);
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
      "div",
      {
        className: `rounded-lg border transition-all ${hidden ? "opacity-35 border-border/30 bg-white/[0.02]" : "border-plex/40 bg-plex/[0.08] shadow-[0_0_16px_rgba(229,160,13,0.08)]"}`,
        children: [
          id === "mainGrid" && !hidden ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: `${meta.previewClass} p-2 flex gap-2`, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "w-1/3 flex flex-col gap-1", children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "flex-1 rounded bg-plex/20 border border-plex/30", title: "Left column" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "h-4 rounded bg-plex/15 border border-plex/25" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "w-2/3 flex flex-col gap-1", children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "h-8 rounded bg-plex/20 border border-plex/30" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "flex-1 rounded bg-plex/15 border border-plex/25" })
            ] })
          ] }) : id === "pendingRequests" && !hidden ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: `${meta.previewClass} p-2 mx-2 mt-2`, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "h-full rounded bg-plex/20 border border-plex/30 flex items-center justify-center px-3", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "h-6 w-full max-w-md rounded bg-plex/15 border border-plex/25" }) }) }) : id === "watchRow" && !hidden ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: `${meta.previewClass} p-2 flex gap-2`, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "w-1/3 rounded bg-plex/20 border border-plex/30" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "w-2/3 rounded bg-plex/15 border border-plex/25" })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: `${meta.previewClass} rounded bg-plex/15 border border-plex/25 mx-2 my-2` }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "px-3 pb-2 flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "min-w-0", children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: `text-sm font-semibold truncate ${hidden ? "text-muted line-through" : "text-text"}`, children: meta.shortLabel }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "text-[10px] text-muted truncate", children: meta.description })
            ] }),
            hidden && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted shrink-0", children: "Hidden" })
          ] })
        ]
      },
      id
    );
  }) }),
  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "text-[10px] text-muted/80 pt-1", children: "Hero banner stays at the top and is not configurable." })
] });
var HomeLayoutSettings = ({ layout, onChange }) => {
  const [dragIndex, setDragIndex] = (0, import_react6.useState)(null);
  const [dropIndex, setDropIndex] = (0, import_react6.useState)(null);
  const applyChange = (0, import_react6.useCallback)(
    (next) => onChange(lockWidgetLayout(next)),
    [onChange]
  );
  const toggleSectionHidden = (sectionId) => {
    const hidden = layout.hiddenSections.includes(sectionId) ? layout.hiddenSections.filter((s) => s !== sectionId) : [...layout.hiddenSections, sectionId];
    applyChange({ ...layout, hiddenSections: hidden });
  };
  const handleDrop = (targetIndex) => {
    if (dragIndex === null) return;
    applyChange({ ...layout, sections: reorderSections(layout.sections, dragIndex, targetIndex) });
    setDragIndex(null);
    setDropIndex(null);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "mb-8 animate-fade-in space-y-6", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { className: "text-xl font-bold text-plex mb-2 border-b border-border pb-2", children: "Home Page Layout" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "text-muted text-sm max-w-2xl", children: "Drag sections to reorder the home page for everyone. Show or hide whole sections. The main dashboard grid keeps its fixed left/right layout so card heights stay balanced." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
        "button",
        {
          type: "button",
          onClick: () => applyChange({ ...DEFAULT_DASHBOARD_LAYOUT }),
          className: "inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-semibold text-muted hover:text-text hover:border-plex/40 transition-colors shrink-0",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(RotateCcw, { className: "w-4 h-4" }),
            "Reset to default"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-5xl", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h4", { className: "text-sm font-bold uppercase tracking-wider text-muted mb-3", children: "Page sections" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "text-xs text-muted mb-3", children: "Drag the handle to reorder. Use Shown/Hidden to toggle each section \u2014 all are visible by default." }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "flex flex-col gap-2", children: layout.sections.map((id, index) => {
          const hidden = layout.hiddenSections.includes(id);
          const isDragging = dragIndex === index;
          const isDropTarget = dropIndex === index && dragIndex !== null && dragIndex !== index;
          return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
            "div",
            {
              draggable: true,
              onDragStart: () => setDragIndex(index),
              onDragEnd: () => {
                setDragIndex(null);
                setDropIndex(null);
              },
              onDragOver: (e) => {
                e.preventDefault();
                setDropIndex(index);
              },
              onDragLeave: () => {
                if (dropIndex === index) setDropIndex(null);
              },
              onDrop: (e) => {
                e.preventDefault();
                handleDrop(index);
              },
              className: `flex items-center gap-2 py-3 px-3 rounded-xl border bg-background/30 transition-all cursor-grab active:cursor-grabbing
                                        ${isDragging ? "opacity-50 border-plex/40 scale-[0.98]" : "border-border/40"}
                                        ${isDropTarget ? "border-plex ring-1 ring-plex/30" : ""}`,
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(GripVertical, { className: "w-5 h-5 text-muted shrink-0", "aria-hidden": true }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "min-w-0 flex-1", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: `text-text font-medium ${hidden ? "opacity-50 line-through" : ""}`, children: DASHBOARD_SECTION_LABELS[id] }),
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "text-xs text-muted mt-0.5", children: SECTION_PREVIEW_META[id].description })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(SectionVisibilityToggle, { visible: !hidden, onToggle: () => toggleSectionHidden(id) })
              ]
            },
            id
          );
        }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(SectionPreview, { layout })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "max-w-5xl rounded-xl border border-plex/30 bg-plex/5 px-4 py-3", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "text-xs text-plex font-semibold", children: [
      "Click ",
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "text-text", children: "Save Settings" }),
      " at the bottom of this page to apply layout changes for everyone."
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "max-w-5xl rounded-xl border border-border/30 bg-background/20 px-4 py-3", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "text-xs text-muted", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "font-semibold text-text", children: "Locked:" }),
      " Individual widgets inside the main grid (Quick Actions, Library Size, etc.) cannot be reordered or hidden \u2014 that prevents uneven columns and wasted space on desktop. Pending Requests is its own section and can be moved or hidden above."
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "max-w-5xl", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h4", { className: "text-sm font-bold uppercase tracking-wider text-muted mb-3", children: "Watch History Configuration" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "bg-background/30 p-4 rounded-xl border border-border/40", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("label", { className: "block text-text font-semibold mb-1", children: "Recently Watched Rows" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "text-xs text-muted mb-3", children: "Number of rows to display per page." }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            CustomSelect,
            {
              value: String(layout.recentHistoryRows ?? 7),
              onChange: (val) => applyChange({ ...layout, recentHistoryRows: parseInt(val, 10) }),
              options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map((n) => ({ value: String(n), label: `${n} ${n === 1 ? "Row" : "Rows"}` }))
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "bg-background/30 p-4 rounded-xl border border-border/40", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("label", { className: "block text-text font-semibold mb-1", children: "Most Watched Rows" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "text-xs text-muted mb-3", children: "Number of rows to display per page." }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            CustomSelect,
            {
              value: String(layout.topWatchedRows ?? 2),
              onChange: (val) => applyChange({ ...layout, topWatchedRows: parseInt(val, 10) }),
              options: [1, 2, 3, 4, 5, 6, 8, 10].map((n) => ({ value: String(n), label: `${n} ${n === 1 ? "Row" : "Rows"}` }))
            }
          )
        ] })
      ] })
    ] })
  ] });
};

// client/settings/SettingsSearchPanel.tsx
var import_react7 = __toESM(require_react(), 1);
var import_jsx_runtime7 = __toESM(require_jsx_runtime(), 1);
var SettingsSearchPanel = ({ onSelect, activeEntryId }) => {
  const [query, setQuery] = (0, import_react7.useState)("");
  const [recent, setRecent] = (0, import_react7.useState)([]);
  const [isFocused, setIsFocused] = (0, import_react7.useState)(false);
  const containerRef = (0, import_react7.useRef)(null);
  (0, import_react7.useEffect)(() => {
    setRecent(getRecentSettingsEntries());
  }, []);
  const results = (0, import_react7.useMemo)(() => searchSettingsIndex(query), [query]);
  const showResults = isFocused && query.trim().length > 0;
  const showRecent = isFocused && query.trim().length === 0 && recent.length > 0;
  (0, import_react7.useEffect)(() => {
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);
  const handleSelect = (entry) => {
    onSelect(entry);
    setRecent(getRecentSettingsEntries());
    setQuery("");
    setIsFocused(false);
  };
  const renderEntryButton = (entry, icon) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
    "button",
    {
      type: "button",
      onClick: () => handleSelect(entry),
      className: `w-full text-left px-2.5 py-2 rounded-md text-sm transition-all ${activeEntryId === entry.id ? "nav-item-active" : "text-text hover:bg-white/5"}`,
      children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "flex items-start gap-2", children: [
        icon,
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "min-w-0", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "font-medium block truncate", children: entry.label }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "text-[10px] text-muted block truncate", children: entry.sectionId ? `${entry.group} \xB7 ${SETTINGS_INDEX_TAB_LABEL(entry.tabId)}` : entry.group })
        ] })
      ] })
    },
    entry.id
  );
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { ref: containerRef, className: "shrink-0 relative", children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("label", { className: "text-muted text-[10px] uppercase tracking-wider font-bold mb-1 block", children: "Find Setting" }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "relative", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Search, { className: "absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
        "input",
        {
          type: "search",
          placeholder: "Search settings...",
          value: query,
          onChange: (e) => setQuery(e.target.value),
          onFocus: () => {
            setIsFocused(true);
            setRecent(getRecentSettingsEntries());
          },
          className: "w-full bg-background border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm text-text focus:outline-none focus:border-plex transition-colors"
        }
      )
    ] }),
    (showResults || showRecent) && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "absolute z-30 left-0 right-0 mt-1.5 rounded-lg border border-border bg-card shadow-2xl overflow-hidden", children: [
      showRecent && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "p-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("p", { className: "text-[10px] uppercase tracking-wider font-bold text-muted px-2 py-1 flex items-center gap-1.5", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Clock, { className: "w-3 h-3" }),
          " Recent"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "space-y-0.5", children: recent.map((entry) => renderEntryButton(entry)) })
      ] }),
      showResults && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "p-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "text-[10px] uppercase tracking-wider font-bold text-muted px-2 py-1", children: "Results" }),
        results.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "text-xs text-muted px-2 py-2", children: "No settings found." }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "space-y-0.5 max-h-64 overflow-y-auto custom-scrollbar", children: results.map((entry) => renderEntryButton(entry)) })
      ] })
    ] })
  ] });
};
var SETTINGS_INDEX_TAB_LABEL = (tabId) => {
  const labels = {
    plex: "Media Player",
    "home-layout": "Home Layout",
    "stream-rules": "Stream Rules"
  };
  return labels[tabId] || tabId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

// client/settings/SettingsDashboard.tsx
var import_jsx_runtime8 = __toESM(require_jsx_runtime(), 1);
var normalizeArrInstancesFromSettings = (settings = {}) => {
  if (Array.isArray(settings.arrInstances) && settings.arrInstances.length > 0) {
    return settings.arrInstances.map((entry) => ({ ...entry }));
  }
  const instances = [];
  if (settings.sonarrUrl || settings.sonarrApiKey) {
    instances.push({
      id: "sonarr-default",
      type: "sonarr",
      name: "Sonarr",
      url: settings.sonarrUrl || "",
      apiKey: settings.sonarrApiKey || "",
      enabled: true,
      isDefault: true
    });
  }
  if (settings.radarrUrl || settings.radarrApiKey) {
    instances.push({
      id: "radarr-default",
      type: "radarr",
      name: "Radarr",
      url: settings.radarrUrl || "",
      apiKey: settings.radarrApiKey || "",
      enabled: true,
      isDefault: true
    });
  }
  return instances;
};
var hasIntegrationCredentials = (url, apiKey, savedUrl, savedApiKey) => {
  const effectiveUrl = String(url || savedUrl || "").trim();
  const effectiveKey = String(apiKey || savedApiKey || "").trim();
  return Boolean(effectiveUrl && effectiveKey);
};
var SELFHST_ICON_BASE = "https://cdn.jsdelivr.net/gh/selfhst/icons/svg";
var APP_ICONS = {
  sonarr: `${SELFHST_ICON_BASE}/sonarr.svg`,
  radarr: `${SELFHST_ICON_BASE}/radarr.svg`,
  tautulli: `${SELFHST_ICON_BASE}/tautulli.svg`,
  seerr: `${SELFHST_ICON_BASE}/seerr.svg`,
  overseerr: `${SELFHST_ICON_BASE}/seerr.svg`,
  jellyseerr: `${SELFHST_ICON_BASE}/jellyseerr.svg`,
  ombi: `${SELFHST_ICON_BASE}/ombi.svg`,
  jellystat: "https://cdn.jsdelivr.net/gh/selfhst/icons@main/png/jellystat.png",
  tmdb: `${SELFHST_ICON_BASE}/tmdb.svg`
};
var ProgramIcon = ({ app, label }) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "inline-flex w-8 h-8 rounded-lg bg-white/5 border border-white/10 items-center justify-center overflow-hidden flex-shrink-0", children: [
  APP_ICONS[app] ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
    "img",
    {
      src: APP_ICONS[app],
      alt: "",
      className: "w-5 h-5 object-contain",
      onError: (e) => {
        e.currentTarget.style.display = "none";
      }
    }
  ) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "text-[10px] font-black text-plex", children: label.slice(0, 2).toUpperCase() }),
  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "sr-only", children: label })
] });
var IntegrationHeading = ({ app, title, subtitle, className = "" }) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: `integration-heading border-b border-border pb-3 mb-4 ${className}`, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "grid grid-cols-[2rem_1fr] gap-x-3 gap-y-0.5", children: [
  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "row-start-1 self-center", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ProgramIcon, { app, label: title }) }),
  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { className: "integration-heading-title text-xl font-bold text-text leading-tight min-w-0 col-start-2 row-start-1", children: title }),
  subtitle && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-xs text-muted col-start-2 row-start-2", children: subtitle })
] }) });
var JELLYFIN_BRAND_LOGO_URL = "/api/jellyfin/branding/icon";
var JELLYFIN_BRAND_BACKGROUND_URL = "/api/jellyfin/branding/splash";
var SettingsDashboard = () => {
  const [statusDraft, setStatusDraft] = (0, import_react8.useState)(null);
  const [isLoading, setLoading] = (0, import_react8.useState)(true);
  const [configLoadError, setConfigLoadError] = (0, import_react8.useState)(null);
  const [initialSettings, setInitialSettings] = (0, import_react8.useState)({});
  const [isConfigLoaded, setIsConfigLoaded] = (0, import_react8.useState)(false);
  const [toasts, setToasts] = (0, import_react8.useState)([]);
  const streamRulesSaveHandlerRef = (0, import_react8.useRef)(null);
  const [statusConfig, setStatusConfig] = (0, import_react8.useState)({});
  const [users, setUsers] = (0, import_react8.useState)([]);
  const addToast = (0, import_react8.useCallback)((message, type = "success") => {
    setToasts((t) => pushToast(t, message, type));
  }, []);
  const fetchStatusConfig = (0, import_react8.useCallback)(async () => {
    try {
      const sConf = await apiFetch("/api/status/config");
      setStatusConfig(sConf);
    } catch (e) {
    }
  }, []);
  (0, import_react8.useEffect)(() => {
    const fetchConfig = async () => {
      setLoading(true);
      setConfigLoadError(null);
      try {
        const configData = await apiFetch("/api/config");
        if (configData.settings) {
          setInitialSettings(configData.settings);
        }
        const usersData = await apiFetch("/api/users");
        setUsers(usersData);
        await fetchStatusConfig();
        setIsConfigLoaded(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load config";
        setConfigLoadError(message);
        addToast(message, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
    apiFetch("/api/plex/libraries").then((libData) => setLibraries(libData || [])).catch(() => setLibraries([]));
  }, [addToast, fetchStatusConfig]);
  const handleSaveConfig = async (newConfig) => {
    setLoading(true);
    try {
      await apiFetch("/api/config", { method: "POST", body: JSON.stringify(newConfig) });
      const configData = await apiFetch("/api/config");
      if (configData.settings) {
        setInitialSettings(configData.settings);
      }
      window.dispatchEvent(new CustomEvent("portal-public-config-updated"));
      addToast("Settings Saved!");
    } catch (e) {
      addToast(e.message || "Failed to save config", "error");
    } finally {
      setLoading(false);
    }
  };
  const [token, setToken] = (0, import_react8.useState)("");
  const [mediaServerType, setMediaServerType] = (0, import_react8.useState)("plex");
  const [plexServerUrl, setPlexServerUrl] = (0, import_react8.useState)("");
  const [jellyfinUrl, setJellyfinUrl] = (0, import_react8.useState)("");
  const [jellyfinApiKey, setJellyfinApiKey] = (0, import_react8.useState)("");
  const [servers, setServers] = (0, import_react8.useState)([]);
  const [selectedServer, setSelectedServer] = (0, import_react8.useState)("");
  const [checkInterval, setCheckInterval] = (0, import_react8.useState)(60);
  const [hideStreamUsers, setHideStreamUsers] = (0, import_react8.useState)("false");
  const [showUsernamesInAnalytics, setShowUsernamesInAnalytics] = (0, import_react8.useState)(false);
  const [useTrendingSlideshowOnLogin, setUseTrendingSlideshowOnLogin] = (0, import_react8.useState)(false);
  const [defaultLibraryIds, setDefaultLibraryIds] = (0, import_react8.useState)([]);
  const [libraries, setLibraries] = (0, import_react8.useState)([]);
  const [activeTab, setActiveTab] = (0, import_react8.useState)(() => {
    const { tabId } = parseSettingsHash(window.location.hash);
    return tabId || "branding";
  });
  const initialHash = parseSettingsHash(window.location.hash);
  const [activeSectionId, setActiveSectionId] = (0, import_react8.useState)(initialHash.sectionId);
  const [scrollToSection, setScrollToSection] = (0, import_react8.useState)(initialHash.sectionId);
  const [activeSettingId, setActiveSettingId] = (0, import_react8.useState)(() => {
    if (initialHash.tabId && initialHash.sectionId) return `${initialHash.tabId}/${initialHash.sectionId}`;
    return initialHash.tabId || "branding";
  });
  const [highlightMaintenanceToggle, setHighlightMaintenanceToggle] = (0, import_react8.useState)(false);
  const settingsTabGroups = SETTINGS_TAB_GROUPS;
  const settingsTabsFlat = settingsTabGroups.flatMap((group) => group.tabs);
  const visibleTabGroups = settingsTabGroups;
  const navigateToSetting = (0, import_react8.useCallback)((entry) => {
    setActiveTab(entry.tabId);
    setActiveSectionId(entry.sectionId || null);
    setScrollToSection(entry.sectionId || null);
    setActiveSettingId(entry.id);
    recordRecentSetting(entry.id);
  }, []);
  (0, import_react8.useEffect)(() => {
    const hash = buildSettingsHash(activeTab, activeSectionId);
    if (window.location.hash !== hash) {
      window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}${hash}`);
    }
  }, [activeTab, activeSectionId]);
  (0, import_react8.useEffect)(() => {
    const syncTabFromHash = () => {
      const { tabId, sectionId } = parseSettingsHash(window.location.hash);
      if (tabId) {
        setActiveTab(tabId);
        setActiveSectionId(sectionId);
        setScrollToSection(sectionId);
        setActiveSettingId(sectionId ? `${tabId}/${sectionId}` : tabId);
      } else if (!window.location.hash) {
        setActiveTab("branding");
        setActiveSectionId(null);
        setScrollToSection(null);
        setActiveSettingId("branding");
      }
    };
    window.addEventListener("hashchange", syncTabFromHash);
    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, []);
  (0, import_react8.useEffect)(() => {
    if (!scrollToSection) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(getSettingsSectionElementId(scrollToSection));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.add("settings-section-highlight");
        window.setTimeout(() => el.classList.remove("settings-section-highlight"), 2200);
      }
      setScrollToSection(null);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [activeTab, scrollToSection]);
  (0, import_react8.useEffect)(() => {
    if (activeTab !== "system") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("focus") !== "maintenance-toggle") return;
    setHighlightMaintenanceToggle(true);
    setActiveSectionId("maintenance");
    setScrollToSection("maintenance");
    setActiveSettingId("system/maintenance");
    const timer = window.setTimeout(() => setHighlightMaintenanceToggle(false), 4200);
    url.searchParams.delete("focus");
    const nextUrl = `${url.pathname}${url.search}${url.hash || ""}`;
    window.history.replaceState({}, "", nextUrl);
    return () => window.clearTimeout(timer);
  }, [activeTab]);
  const [smtpHost, setSmtpHost] = (0, import_react8.useState)("");
  const [smtpPort, setSmtpPort] = (0, import_react8.useState)(587);
  const [smtpUser, setSmtpUser] = (0, import_react8.useState)("");
  const [smtpPass, setSmtpPass] = (0, import_react8.useState)("");
  const [smtpFrom, setSmtpFrom] = (0, import_react8.useState)("");
  const [smtpSecure, setSmtpSecure] = (0, import_react8.useState)(false);
  const [emailDaysBefore, setEmailDaysBefore] = (0, import_react8.useState)(7);
  const [testRecipient, setTestRecipient] = (0, import_react8.useState)("");
  const [isTestingSmtp, setIsTestingSmtp] = (0, import_react8.useState)(false);
  const [isTestingNewsletter, setIsTestingNewsletter] = (0, import_react8.useState)(false);
  const [isSendingNewsletter, setIsSendingNewsletter] = (0, import_react8.useState)(false);
  const [newsletterFrequency, setNewsletterFrequency] = (0, import_react8.useState)("disabled");
  const [newsletterDay, setNewsletterDay] = (0, import_react8.useState)(0);
  const [publicDomain, setPublicDomain] = (0, import_react8.useState)("https://yourdomain.com");
  const [requestUrl, setRequestUrl] = (0, import_react8.useState)("https://yourdomain.com");
  const [contactUrl, setContactUrl] = (0, import_react8.useState)("");
  const [contactWhatsApp, setContactWhatsApp] = (0, import_react8.useState)("");
  const [contactEmail, setContactEmail] = (0, import_react8.useState)("");
  const [inactiveCleanupEnabled, setInactiveCleanupEnabled] = (0, import_react8.useState)(false);
  const [inactiveCleanupDays, setInactiveCleanupDays] = (0, import_react8.useState)(90);
  const [arrInstances, setArrInstances] = (0, import_react8.useState)([]);
  const [savedArrInstances, setSavedArrInstances] = (0, import_react8.useState)([]);
  const [tautulliUrl, setTautulliUrl] = (0, import_react8.useState)("");
  const [tautulliApiKey, setTautulliApiKey] = (0, import_react8.useState)("");
  const [jellystatUrl, setJellystatUrl] = (0, import_react8.useState)("");
  const [jellystatApiKey, setJellystatApiKey] = (0, import_react8.useState)("");
  const [requestAppType, setRequestAppType] = (0, import_react8.useState)("none");
  const [requestAppUrl, setRequestAppUrl] = (0, import_react8.useState)("");
  const [requestAppFetchUrl, setRequestAppFetchUrl] = (0, import_react8.useState)("");
  const [requestAppApiKey, setRequestAppApiKey] = (0, import_react8.useState)("");
  const [maintenanceExperimentalEnabled, setMaintenanceExperimentalEnabled] = (0, import_react8.useState)(false);
  const [upgraderEnabled, setUpgraderEnabled] = (0, import_react8.useState)(false);
  const [upgraderDefaultPreset, setUpgraderDefaultPreset] = (0, import_react8.useState)("non_hevc");
  const [upgraderMinSizeGB, setUpgraderMinSizeGB] = (0, import_react8.useState)(5);
  const [upgraderAutomationEnabled, setUpgraderAutomationEnabled] = (0, import_react8.useState)(false);
  const [upgraderMaxActionsPerHour, setUpgraderMaxActionsPerHour] = (0, import_react8.useState)(25);
  const [upgraderDefaultSort, setUpgraderDefaultSort] = (0, import_react8.useState)("sizeGB");
  const [upgraderDrawerPosition, setUpgraderDrawerPosition] = (0, import_react8.useState)("sidebar");
  const [upgraderProfileMap, setUpgraderProfileMap] = (0, import_react8.useState)({});
  const [upgraderProfileInstances, setUpgraderProfileInstances] = (0, import_react8.useState)([]);
  const [loadingUpgraderProfiles, setLoadingUpgraderProfiles] = (0, import_react8.useState)(false);
  const [dashboardLayout, setDashboardLayout] = (0, import_react8.useState)(DEFAULT_DASHBOARD_LAYOUT);
  const dashboardLayoutRef = (0, import_react8.useRef)(DEFAULT_DASHBOARD_LAYOUT);
  const updateDashboardLayout = (0, import_react8.useCallback)((next) => {
    dashboardLayoutRef.current = next;
    setDashboardLayout(next);
  }, []);
  const [customLogoUrl, setCustomLogoUrl] = (0, import_react8.useState)("");
  const [backgroundImageUrl, setBackgroundImageUrl] = (0, import_react8.useState)("");
  const [useScrollRevealAnimations, setUseScrollRevealAnimations] = (0, import_react8.useState)(false);
  const [useCinematicLoading, setUseCinematicLoading] = (0, import_react8.useState)(false);
  const [useBrandedSkeleton, setUseBrandedSkeleton] = (0, import_react8.useState)(true);
  const [useTrendingSlideshow, setUseTrendingSlideshow] = (0, import_react8.useState)(false);
  const [trendingSlideshowInterval, setTrendingSlideshowInterval] = (0, import_react8.useState)(30);
  const [tmdbApiKey, setTmdbApiKey] = (0, import_react8.useState)("");
  const [brandingTheme, setBrandingTheme] = (0, import_react8.useState)("plex");
  const [referralEnabled, setReferralEnabled] = (0, import_react8.useState)(false);
  const [referralTrialDays, setReferralTrialDays] = (0, import_react8.useState)(3);
  const [referralRewardDays, setReferralRewardDays] = (0, import_react8.useState)(7);
  const [announcement, setAnnouncement] = (0, import_react8.useState)("");
  const [isPushingAnnouncement, setIsPushingAnnouncement] = (0, import_react8.useState)(false);
  const [use24HourClock, setUse24HourClock] = (0, import_react8.useState)(initialSettings?.use24HourClock || false);
  const [showPosterQualityBadges, setShowPosterQualityBadges] = (0, import_react8.useState)(initialSettings?.showPosterQualityBadges !== false);
  const [showPublicStatusMonitor, setShowPublicStatusMonitor] = (0, import_react8.useState)(initialSettings?.showPublicStatusMonitor !== false);
  const [showPublicLibraryStats, setShowPublicLibraryStats] = (0, import_react8.useState)(initialSettings?.showPublicLibraryStats !== false);
  const [allowTemporaryAccess, setAllowTemporaryAccess] = (0, import_react8.useState)(initialSettings?.allowTemporaryAccess || false);
  const ensureMaintenanceNavOrder = (0, import_react8.useCallback)((order) => {
    const base = Array.isArray(order) ? order.filter(Boolean) : ["home", "discover", "status", "analytics", "mediastack", "request", "settings", "logout"];
    if (!base.includes("maintenance")) {
      const requestIndex = base.indexOf("request");
      if (requestIndex >= 0) base.splice(requestIndex, 0, "maintenance");
      else base.push("maintenance");
    }
    return base;
  }, []);
  const [navOrder, setNavOrder] = (0, import_react8.useState)(() => ensureMaintenanceNavOrder(["home", "discover", "status", "analytics", "mediastack", "request", "settings", "logout"]));
  const [logoFile, setLogoFile] = (0, import_react8.useState)(null);
  const [tasks, setTasks] = (0, import_react8.useState)([]);
  const [diagnostics, setDiagnostics] = (0, import_react8.useState)(null);
  const [isLoadingDiagnostics, setIsLoadingDiagnostics] = (0, import_react8.useState)(false);
  const [backupRestoreText, setBackupRestoreText] = (0, import_react8.useState)("");
  const [isRestoringBackup, setIsRestoringBackup] = (0, import_react8.useState)(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = (0, import_react8.useState)(false);
  const [autoBackupIntervalDays, setAutoBackupIntervalDays] = (0, import_react8.useState)(2);
  const [autoBackupRetentionCount, setAutoBackupRetentionCount] = (0, import_react8.useState)(10);
  const [backupFiles, setBackupFiles] = (0, import_react8.useState)([]);
  const [auditLogEntries, setAuditLogEntries] = (0, import_react8.useState)([]);
  const [isLoadingAuditLog, setIsLoadingAuditLog] = (0, import_react8.useState)(false);
  const [auditLogPage, setAuditLogPage] = (0, import_react8.useState)(1);
  const [deletedUsersLog, setDeletedUsersLog] = (0, import_react8.useState)([]);
  const [emailLogPage, setEmailLogPage] = (0, import_react8.useState)(1);
  const handlePushAnnouncement = async () => {
    setIsPushingAnnouncement(true);
    try {
      const res = await apiFetch("/api/announcements/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: announcement, sendEmail: true })
      });
      if (res.error) throw new Error(res.error);
      addToast("Announcement saved and email push started (staggered over 30 mins).");
    } catch (e) {
      addToast(e.message || "Failed to push announcement", "error");
    } finally {
      setIsPushingAnnouncement(false);
    }
  };
  const fetchTasks = async () => {
    try {
      const data = await apiFetch("/api/tasks");
      setTasks(data);
    } catch (e) {
      addToast("Failed to load tasks", "error");
    }
  };
  const fetchDiagnostics = async () => {
    setIsLoadingDiagnostics(true);
    try {
      const data = await apiFetch("/api/admin/diagnostics");
      setDiagnostics(data);
    } catch (e) {
      addToast("Failed to load diagnostics", "error");
    } finally {
      setIsLoadingDiagnostics(false);
    }
  };
  const fetchBackupFiles = async () => {
    try {
      const data = await apiFetch("/api/admin/backups");
      setBackupFiles(Array.isArray(data) ? data : []);
    } catch (e) {
      addToast("Failed to load backup files", "error");
    }
  };
  const fetchAuditLog = async () => {
    setIsLoadingAuditLog(true);
    try {
      const data = await apiFetch("/api/audit-log");
      setAuditLogEntries(Array.isArray(data) ? data : []);
      setAuditLogPage(1);
      setEmailLogPage(1);
    } catch (e) {
      addToast("Failed to load audit log", "error");
    } finally {
      setIsLoadingAuditLog(false);
    }
  };
  const fetchDeletedUsersLog = async () => {
    try {
      const data = await apiFetch("/api/deleted-users");
      setDeletedUsersLog(Array.isArray(data) ? data : []);
    } catch (e) {
      addToast("Failed to load deleted users log", "error");
    }
  };
  const handleDownloadBackup = async () => {
    try {
      const response = await fetch(portalUrl("/api/admin/backup"));
      if (!response.ok) throw new Error("Backup download failed");
      const text = await response.text();
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `portal-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addToast("Backup downloaded successfully.");
    } catch (e) {
      addToast(e.message || "Backup download failed", "error");
    }
  };
  const handleCreateBackupFile = async () => {
    try {
      const res = await apiFetch("/api/admin/backups/create", { method: "POST" });
      addToast(res?.filename ? `Backup created: ${res.filename}` : "Backup created successfully.");
      await fetchBackupFiles();
      await fetchDiagnostics();
    } catch (e) {
      addToast(e.message || "Failed to create backup file", "error");
    }
  };
  const handleRestoreBackup = async () => {
    if (!backupRestoreText.trim()) {
      addToast("Paste a backup JSON payload before restoring.", "error");
      return;
    }
    appConfirm("Restore backup now? This overwrites current data files.", async () => {
      setIsRestoringBackup(true);
      try {
        const response = await fetch(portalUrl("/api/admin/backup/restore?confirm=true"), {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
            "x-confirm-restore": "true"
          },
          body: backupRestoreText
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Backup restore failed");
        addToast(data.message || "Backup restored successfully.");
        await Promise.all([fetchDiagnostics(), fetchTasks()]);
      } catch (e) {
        addToast(e.message || "Backup restore failed", "error");
      } finally {
        setIsRestoringBackup(false);
      }
    });
  };
  const handleRestoreFromFile = async (filename) => {
    appConfirm(`Restore from backup file "${filename}"? This will overwrite current data.`, async () => {
      try {
        const res = await apiFetch("/api/admin/backups/restore-file", {
          method: "POST",
          body: JSON.stringify({ filename, confirm: true })
        });
        addToast(res?.message || "Backup restored from file successfully.");
        await Promise.all([fetchDiagnostics(), fetchTasks(), fetchBackupFiles()]);
      } catch (e) {
        addToast(e.message || "Failed to restore backup file", "error");
      }
    });
  };
  const renderConfigPill = (configured) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: `inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${configured ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"}`, children: configured ? "Configured" : "Missing" });
  const renderOptionalPill = (enabled, configured) => {
    if (!enabled) {
      return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-muted border border-border", children: "Disabled" });
    }
    return renderConfigPill(configured);
  };
  const renderOptionalIntegrationPill = (configured) => {
    if (configured) {
      return renderConfigPill(true);
    }
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-muted border border-border", children: "Optional" });
  };
  const trackedIntegrationKeys = (0, import_react8.useMemo)(() => {
    const mediaKey = mediaServerType === "jellyfin" ? "jellyfinConfigured" : "plexConfigured";
    const analyticsKey = mediaServerType === "jellyfin" ? "jellystatConfigured" : "tautulliConfigured";
    return [mediaKey, "sonarrConfigured", "radarrConfigured", analyticsKey, "requestAppConfigured"];
  }, [mediaServerType]);
  const integrationLabels = {
    jellyfinConfigured: "Jellyfin",
    plexConfigured: "Plex",
    sonarrConfigured: "Sonarr",
    radarrConfigured: "Radarr",
    tautulliConfigured: "Tautulli",
    jellystatConfigured: "Jellystat",
    requestAppConfigured: "Request App"
  };
  (0, import_react8.useEffect)(() => {
    if (activeTab === "tasks" || activeTab === "system") {
      fetchTasks();
    }
    if (activeTab === "system") {
      fetchDiagnostics();
      fetchBackupFiles();
      fetchAuditLog();
    }
    if (activeTab === "logs") {
      fetchDeletedUsersLog();
      fetchAuditLog();
    }
  }, [activeTab]);
  const handleUnblockDeletedUser = async (deletedUser) => {
    const label = deletedUser.username || deletedUser.email || "this user";
    appConfirm(`Allow ${label} to use the portal again? This does not invite them automatically.`, async () => {
      setLoading(true);
      try {
        await apiFetch(`/api/deleted-users/${encodeURIComponent(deletedUser.blockId)}`, { method: "DELETE" });
        addToast("Deleted user unblocked.");
        await Promise.all([fetchDeletedUsersLog(), fetchAuditLog()]);
      } catch (error) {
        addToast(error instanceof Error ? error.message : "Failed to unblock user.", "error");
      } finally {
        setLoading(false);
      }
    });
  };
  const formatEventName = (event) => event.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  const formatDateTime = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleString();
  };
  const stringifyAuditValue = (value) => {
    if (value === null || value === void 0) return "\u2014";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };
  const getAuditDiffRows = (details) => {
    if (!details || typeof details !== "object") return [];
    const rows = [];
    const keys = Object.keys(details);
    const used = /* @__PURE__ */ new Set();
    const pairCandidate = (primaryKey, label, candidates) => {
      if (used.has(primaryKey)) return;
      for (const key of candidates) {
        if (key in details) {
          rows.push({
            field: label,
            before: stringifyAuditValue(details[primaryKey]),
            after: stringifyAuditValue(details[key])
          });
          used.add(primaryKey);
          used.add(key);
          return;
        }
      }
    };
    if ("before" in details && "after" in details) {
      rows.push({ field: "Value", before: stringifyAuditValue(details.before), after: stringifyAuditValue(details.after) });
      used.add("before");
      used.add("after");
    }
    if ("oldValue" in details && "newValue" in details) {
      rows.push({ field: "Value", before: stringifyAuditValue(details.oldValue), after: stringifyAuditValue(details.newValue) });
      used.add("oldValue");
      used.add("newValue");
    }
    keys.forEach((key) => {
      if (used.has(key)) return;
      if (!key.startsWith("previous")) return;
      const suffix = key.replace(/^previous/, "");
      if (!suffix) return;
      const lowerSuffix = suffix.charAt(0).toLowerCase() + suffix.slice(1);
      pairCandidate(key, suffix, [lowerSuffix, `new${suffix}`, `current${suffix}`]);
    });
    return rows;
  };
  const systemHealth = (0, import_react8.useMemo)(() => {
    if (!diagnostics) {
      return {
        score: 0,
        status: "Unknown",
        alerts: ["Diagnostics have not been loaded yet."],
        integrationsConfigured: 0,
        integrationsTotal: 0,
        cacheHealthy: 0,
        cacheTotal: 0,
        runningJobs: 0,
        failingJobs: 0
      };
    }
    const integrations = diagnostics.integrations || {};
    const trackedIntegrations = trackedIntegrationKeys.filter((key) => key !== "requestAppConfigured" || integrations.requestAppEnabled).map((key) => [key, !!integrations[key]]);
    const cacheEntries = Object.entries(diagnostics.caches || {}).filter(([key]) => {
      if (!maintenanceExperimentalEnabled) {
        if (key.startsWith("maintenance")) return false;
      }
      if (mediaServerType === "jellyfin" && key === "plexStats") return false;
      return true;
    });
    const cacheValues = cacheEntries.map(([, entry]) => !!entry?.exists);
    const jobs = Array.isArray(diagnostics.jobs) ? diagnostics.jobs : [];
    const integrationsConfigured = trackedIntegrations.filter(([, configured]) => configured).length;
    const integrationsTotal = trackedIntegrations.length;
    const cacheHealthy = cacheValues.filter(Boolean).length;
    const cacheTotal = cacheValues.length;
    const runningJobs = jobs.filter((job) => !!job.running).length;
    const failingJobs = jobs.filter((job) => !!job.lastError).length;
    const alerts = [];
    if (integrationsConfigured < integrationsTotal) {
      const missingNames = trackedIntegrations.filter(([, configured]) => !configured).map(([key]) => integrationLabels[key]);
      alerts.push(`${missingNames.join(", ")} not configured.`);
    }
    if (cacheHealthy < cacheTotal) {
      alerts.push(`${cacheTotal - cacheHealthy} cache file(s) are missing.`);
    }
    if (failingJobs > 0) {
      alerts.push(`${failingJobs} background job(s) reported recent errors.`);
    }
    if (diagnostics?.backup?.enabled && !diagnostics?.backup?.lastRunAt) {
      alerts.push("Auto backup is enabled but has not completed a run yet.");
    }
    const maxPenalty = 55;
    const integrationPenalty = integrationsTotal > 0 ? Math.round((integrationsTotal - integrationsConfigured) / integrationsTotal * 25) : 0;
    const cachePenalty = cacheTotal > 0 ? Math.round((cacheTotal - cacheHealthy) / cacheTotal * 20) : 0;
    const jobPenalty = Math.min(10, failingJobs * 5);
    const penalty = Math.min(maxPenalty, integrationPenalty + cachePenalty + jobPenalty);
    const score = Math.max(0, 100 - penalty);
    const status = score >= 85 ? "Healthy" : score >= 65 ? "Watch" : "Needs Attention";
    return {
      score,
      status,
      alerts,
      integrationsConfigured,
      integrationsTotal,
      cacheHealthy,
      cacheTotal,
      runningJobs,
      failingJobs
    };
  }, [diagnostics, maintenanceExperimentalEnabled, mediaServerType, trackedIntegrationKeys]);
  const auditEventsPerPage = 12;
  const totalAuditLogPages = Math.max(1, Math.ceil(auditLogEntries.length / auditEventsPerPage));
  const pagedAuditEntries = auditLogEntries.slice((auditLogPage - 1) * auditEventsPerPage, auditLogPage * auditEventsPerPage);
  const emailAuditEntries = auditLogEntries.filter((entry) => entry.event === "system_email_sent");
  const emailsPerPage = 12;
  const totalEmailLogPages = Math.max(1, Math.ceil(emailAuditEntries.length / emailsPerPage));
  const pagedEmailEntries = emailAuditEntries.slice((emailLogPage - 1) * emailsPerPage, emailLogPage * emailsPerPage);
  const handleRunTask = async (taskId) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/tasks/run/${taskId}`, { method: "POST" });
      addToast(res.message || "Task executed successfully", "success");
      await fetchTasks();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Task failed", "error");
    } finally {
      setLoading(false);
    }
  };
  (0, import_react8.useEffect)(() => {
    if (isConfigLoaded) {
      setToken(initialSettings.token || "");
      setMediaServerType(initialSettings.mediaServerType === "jellyfin" ? "jellyfin" : "plex");
      setPlexServerUrl(initialSettings.plexServerUrl || "");
      setJellyfinUrl(initialSettings.jellyfinUrl || "");
      setJellyfinApiKey(initialSettings.jellyfinApiKey || "");
      setSelectedServer(initialSettings.serverIdentifier || "");
      setCheckInterval(initialSettings.checkIntervalMinutes || 60);
      setSmtpHost(initialSettings.smtpHost || "");
      setSmtpPort(initialSettings.smtpPort || 587);
      setSmtpUser(initialSettings.smtpUser || "");
      setSmtpPass(initialSettings.smtpPass || "");
      setSmtpFrom(initialSettings.smtpFrom || "");
      setSmtpSecure(!!initialSettings.smtpSecure);
      setEmailDaysBefore(initialSettings.emailDaysBefore || 7);
      setNewsletterFrequency(initialSettings.newsletterFrequency || "disabled");
      setNewsletterDay(initialSettings.newsletterDay || 0);
      setInactiveCleanupEnabled(!!initialSettings.inactiveCleanupEnabled);
      setInactiveCleanupDays(initialSettings.inactiveCleanupDays || 90);
      setPublicDomain(initialSettings.publicDomain || "https://portal.yourdomain.com");
      setRequestUrl(initialSettings.requestUrl || "https://yourdomain.com");
      setContactUrl(initialSettings.contactUrl || "");
      setContactWhatsApp(initialSettings.contactWhatsApp || "");
      setContactEmail(initialSettings.contactEmail || "");
      const loadedArrInstances = normalizeArrInstancesFromSettings(initialSettings);
      setArrInstances(loadedArrInstances);
      setSavedArrInstances(loadedArrInstances.map((entry) => ({ ...entry })));
      setTautulliUrl(initialSettings.tautulliUrl || "");
      setTautulliApiKey(initialSettings.tautulliApiKey || "");
      setJellystatUrl(initialSettings.jellystatUrl || "");
      setJellystatApiKey(initialSettings.jellystatApiKey || "");
      setRequestAppType(initialSettings.requestAppType === "overseerr" ? "seerr" : initialSettings.requestAppType || "none");
      setRequestAppUrl(initialSettings.requestAppUrl || "");
      setRequestAppFetchUrl(initialSettings.requestAppFetchUrl || "");
      setRequestAppApiKey(initialSettings.requestAppApiKey || "");
      const savedBrandingTheme = localStorage.getItem("portal-theme") || initialSettings.brandingTheme || "plex";
      setBrandingTheme(savedBrandingTheme);
      setCustomLogoUrl(initialSettings.customLogoUrl || "");
      setBackgroundImageUrl(initialSettings.backgroundImageUrl || "");
      setUseScrollRevealAnimations(!!initialSettings.useScrollRevealAnimations);
      setUseCinematicLoading(!!initialSettings.useCinematicLoading);
      setUseBrandedSkeleton(initialSettings.useBrandedSkeleton !== false);
      setUseTrendingSlideshow(!!initialSettings.useTrendingSlideshow);
      setTrendingSlideshowInterval(initialSettings.trendingSlideshowInterval || 30);
      setTmdbApiKey(initialSettings.tmdbApiKey || "");
      setReferralEnabled(!!initialSettings.referralEnabled);
      setReferralTrialDays(initialSettings.referralTrialDays || 3);
      setReferralRewardDays(initialSettings.referralRewardDays || 7);
      setAnnouncement(initialSettings.announcement || "");
      if (initialSettings.navOrder) setNavOrder(ensureMaintenanceNavOrder(initialSettings.navOrder));
      setHideStreamUsers(initialSettings.hideStreamUsers === true ? "anonymous" : initialSettings.hideStreamUsers || "false");
      setShowUsernamesInAnalytics(!!initialSettings.showUsernamesInAnalytics);
      setUseTrendingSlideshowOnLogin(initialSettings.useTrendingSlideshowOnLogin !== false);
      if (initialSettings.defaultLibraryIds) setDefaultLibraryIds(initialSettings.defaultLibraryIds);
      if (initialSettings.use24HourClock !== void 0) setUse24HourClock(!!initialSettings.use24HourClock);
      if (initialSettings.showPosterQualityBadges !== void 0) setShowPosterQualityBadges(initialSettings.showPosterQualityBadges !== false);
      if (initialSettings.showPublicStatusMonitor !== void 0) setShowPublicStatusMonitor(initialSettings.showPublicStatusMonitor !== false);
      if (initialSettings.showPublicLibraryStats !== void 0) setShowPublicLibraryStats(initialSettings.showPublicLibraryStats !== false);
      if (initialSettings.allowTemporaryAccess !== void 0) setAllowTemporaryAccess(!!initialSettings.allowTemporaryAccess);
      if (initialSettings.autoBackupEnabled !== void 0) setAutoBackupEnabled(!!initialSettings.autoBackupEnabled);
      if (initialSettings.autoBackupIntervalDays !== void 0) setAutoBackupIntervalDays(Number(initialSettings.autoBackupIntervalDays) || 2);
      if (initialSettings.autoBackupRetentionCount !== void 0) setAutoBackupRetentionCount(Number(initialSettings.autoBackupRetentionCount) || 10);
      if (initialSettings.maintenanceExperimentalEnabled !== void 0) setMaintenanceExperimentalEnabled(!!initialSettings.maintenanceExperimentalEnabled);
      if (initialSettings.upgraderEnabled !== void 0) setUpgraderEnabled(!!initialSettings.upgraderEnabled);
      if (initialSettings.upgraderDefaultPreset) setUpgraderDefaultPreset(initialSettings.upgraderDefaultPreset);
      if (initialSettings.upgraderMinSizeGB !== void 0) setUpgraderMinSizeGB(Math.max(0, Number(initialSettings.upgraderMinSizeGB) || 5));
      if (initialSettings.upgraderAutomationEnabled !== void 0) setUpgraderAutomationEnabled(!!initialSettings.upgraderAutomationEnabled);
      if (initialSettings.upgraderMaxActionsPerHour !== void 0) setUpgraderMaxActionsPerHour(Math.max(1, Number(initialSettings.upgraderMaxActionsPerHour) || 25));
      if (initialSettings.upgraderDefaultSort) setUpgraderDefaultSort(initialSettings.upgraderDefaultSort);
      if (initialSettings.upgraderDrawerPosition) setUpgraderDrawerPosition(initialSettings.upgraderDrawerPosition);
      if (initialSettings.upgraderProfileMap && typeof initialSettings.upgraderProfileMap === "object") {
        setUpgraderProfileMap(initialSettings.upgraderProfileMap);
      }
      const layout = normalizeSectionLayout(initialSettings.dashboardLayout);
      dashboardLayoutRef.current = layout;
      setDashboardLayout(layout);
      setTestRecipient("");
      setServers([]);
    }
  }, [initialSettings, isConfigLoaded]);
  (0, import_react8.useEffect)(() => {
    if (!upgraderEnabled) {
      setUpgraderProfileInstances([]);
      return;
    }
    let cancelled = false;
    setLoadingUpgraderProfiles(true);
    apiFetch("/api/upgrader/profiles").then((data) => {
      if (cancelled) return;
      setUpgraderProfileInstances(Array.isArray(data?.instances) ? data.instances : []);
    }).catch(() => {
      if (!cancelled) setUpgraderProfileInstances([]);
    }).finally(() => {
      if (!cancelled) setLoadingUpgraderProfiles(false);
    });
    return () => {
      cancelled = true;
    };
  }, [upgraderEnabled]);
  const handleFetchServers = async () => {
    if (!token) {
      addToast("Please enter a Plex token.", "error");
      return;
    }
    setLoading(true);
    try {
      const foundServers = await apiFetch("/api/plex/servers", {
        method: "POST",
        body: JSON.stringify({ token, plexServerUrl: plexServerUrl || void 0 })
      });
      setServers(foundServers);
      if (foundServers.length > 0) {
        addToast("Successfully fetched servers!", "success");
        const currentServerStillExists = foundServers.some((s) => s.identifier === selectedServer);
        if (!currentServerStillExists) {
          setSelectedServer(foundServers[0].identifier);
        }
      } else {
        addToast("No owned servers found for this token. Make sure you are the owner of the server.", "error");
        setSelectedServer("");
      }
    } catch (error) {
      addToast(error instanceof Error ? error.message : "An unknown error occurred.", "error");
      setServers([]);
      setSelectedServer("");
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {
    if (activeTab === "stream-rules" && streamRulesSaveHandlerRef.current) {
      await streamRulesSaveHandlerRef.current();
      return;
    }
    if (mediaServerType === "plex" && (!token || !selectedServer)) {
      addToast("Token and server must be selected.", "error");
      return;
    }
    if (mediaServerType === "jellyfin" && (!jellyfinUrl || !hasIntegrationCredentials(jellyfinUrl, jellyfinApiKey, initialSettings.jellyfinUrl, initialSettings.jellyfinApiKey))) {
      addToast("Jellyfin URL and API key must be set.", "error");
      return;
    }
    if (logoFile) {
      try {
        await fetch(portalUrl("/api/config/logo"), { method: "POST", body: logoFile });
      } catch (e) {
        addToast("Failed to upload logo", "error");
      }
    }
    if (statusDraft) {
      try {
        await apiFetch("/api/status/config", { method: "POST", body: JSON.stringify(statusDraft) });
        setStatusConfig(statusDraft);
      } catch (e) {
        addToast("Failed to save status monitor configuration", "error");
      }
    }
    await handleSaveConfig({
      token,
      mediaServerType,
      serverIdentifier: selectedServer,
      plexServerUrl: plexServerUrl || "",
      jellyfinUrl,
      jellyfinApiKey,
      checkIntervalMinutes: checkInterval,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpFrom,
      smtpSecure,
      emailDaysBefore,
      newsletterFrequency,
      newsletterDay,
      inactiveCleanupEnabled,
      inactiveCleanupDays,
      publicDomain,
      requestUrl,
      contactUrl,
      contactWhatsApp,
      contactEmail,
      arrInstances,
      tautulliUrl,
      tautulliApiKey,
      jellystatUrl,
      jellystatApiKey,
      requestAppType,
      requestAppUrl,
      requestAppFetchUrl,
      requestAppApiKey,
      primaryColor: "",
      customLogoUrl,
      brandingTheme,
      backgroundImageUrl,
      useScrollRevealAnimations,
      useCinematicLoading,
      useBrandedSkeleton,
      useTrendingSlideshow,
      trendingSlideshowInterval,
      tmdbApiKey,
      referralEnabled,
      referralTrialDays,
      referralRewardDays,
      announcement,
      navOrder: ensureMaintenanceNavOrder(navOrder),
      hideStreamUsers,
      showUsernamesInAnalytics,
      useTrendingSlideshowOnLogin,
      defaultLibraryIds,
      use24HourClock,
      allowTemporaryAccess,
      showPosterQualityBadges,
      showPublicStatusMonitor,
      showPublicLibraryStats,
      autoBackupEnabled,
      autoBackupIntervalDays,
      autoBackupRetentionCount,
      maintenanceExperimentalEnabled,
      upgraderEnabled,
      upgraderDefaultPreset,
      upgraderMinSizeGB,
      upgraderAutomationEnabled,
      upgraderMaxActionsPerHour,
      upgraderDefaultSort,
      upgraderDrawerPosition,
      upgraderProfileMap,
      dashboardLayout: normalizeSectionLayout(dashboardLayoutRef.current)
    });
  };
  const applyJellyfinBranding = () => {
    setCustomLogoUrl(JELLYFIN_BRAND_LOGO_URL);
    setBackgroundImageUrl(JELLYFIN_BRAND_BACKGROUND_URL);
    setLogoFile(null);
    addToast("Jellyfin server icon and splash background applied. Save settings to publish.");
  };
  const handleTestEmail = async () => {
    if (!smtpHost || !smtpUser || !smtpPass || !testRecipient) {
      addToast("Please fill out SMTP Host, User, Password, and Test Recipient.", "error");
      return;
    }
    setIsTestingSmtp(true);
    try {
      const result = await apiFetch("/api/config/test-email", {
        method: "POST",
        body: JSON.stringify({
          smtpHost,
          smtpPort,
          smtpUser,
          smtpPass,
          smtpFrom,
          smtpSecure,
          testRecipient
        })
      });
      addToast(result.message || "Test email sent successfully!", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "SMTP test failed.", "error");
    } finally {
      setIsTestingSmtp(false);
    }
  };
  const handleTestNewsletter = async () => {
    setIsTestingNewsletter(true);
    try {
      const result = await apiFetch("/api/newsletter/test", {
        method: "POST"
      });
      addToast(result.message || "Newsletter sent successfully!", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Newsletter test failed.", "error");
    } finally {
      setIsTestingNewsletter(false);
    }
  };
  const handleSendNewsletterNow = async () => {
    appConfirm("Are you sure you want to send the newsletter to ALL configured users immediately? This cannot be undone.", async () => {
      setIsSendingNewsletter(true);
      try {
        const result = await apiFetch("/api/newsletter/send-now", {
          method: "POST"
        });
        addToast(result.message || "Newsletter dispatch initiated!", "success");
      } catch (error) {
        addToast(error instanceof Error ? error.message : "Newsletter dispatch failed.", "error");
      } finally {
        setIsSendingNewsletter(false);
      }
    });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "w-full flex flex-col box-border", children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Loader, { isLoading }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ToastContainer, { toasts, setToasts }),
    configLoadError && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-6 p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-200 text-sm", children: [
      "Could not load settings: ",
      configLoadError,
      ". Try refreshing the page. If this persists on Docker, confirm your session cookie is valid and the container can reach the API."
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "w-full flex flex-col min-w-0", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "w-full md:grid md:grid-cols-[18rem_minmax(0,1fr)] md:gap-8 xl:gap-10 md:items-start", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "block md:hidden mb-6 space-y-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h1", { className: "text-xl font-bold text-plex", children: "Settings" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingsSearchPanel, { onSelect: navigateToSetting, activeEntryId: activeSettingId }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { htmlFor: "settings-tab-select", className: "text-muted text-xs uppercase tracking-wider font-bold mb-2 block", children: "Settings Category" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            CustomSelect,
            {
              id: "settings-tab-select",
              value: activeTab,
              onChange: (val) => {
                const entry = resolveSettingsEntry(val);
                if (entry) navigateToSetting(entry);
              },
              options: settingsTabsFlat.map((tab) => ({ label: tab.label, value: tab.id }))
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("aside", { className: "hidden md:flex md:flex-col w-72 shrink-0 sticky top-0 self-start glass-card nav-shell p-4 shadow-2xl z-10", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h1", { className: "text-2xl font-bold text-plex px-2 mb-3 shrink-0", children: "Settings" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingsSearchPanel, { onSelect: navigateToSetting, activeEntryId: activeSettingId }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "mt-2.5", children: visibleTabGroups.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-xs text-muted px-2 py-2", children: "No settings sections found." }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "space-y-2", children: visibleTabGroups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-[10px] uppercase tracking-wider font-bold text-plex px-2 mb-0.5", children: group.title }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "space-y-0.5", children: group.tabs.map((tab) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            "button",
            {
              onClick: () => navigateToSetting({ id: tab.id, tabId: tab.id, label: tab.label, group: group.title, keywords: tab.keywords || [] }),
              className: `w-full text-left px-2 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? "nav-item-active" : "text-muted hover:text-text hover:bg-white/5"}`,
              children: tab.label
            },
            tab.id
          )) })
        ] }, group.title)) }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "min-w-0 w-full", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "settings-panel", children: [
          activeTab === "stream-rules" && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(StreamKillRulesPanel, { addToast, registerSaveHandler: (handler) => {
            streamRulesSaveHandlerRef.current = handler;
          } }),
          activeTab === "plex" && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-8", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { className: "text-xl font-bold text-plex mb-4 border-b border-border pb-2", children: "Media Server Integration" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { id: getSettingsSectionElementId("connection"), className: "scroll-mt-24 mb-4", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                SettingFieldLabel,
                {
                  htmlFor: "mediaServerType",
                  hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "Choose the media server used for portal authentication and server-specific integrations." }),
                  children: "Media Server Type"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                CustomSelect,
                {
                  id: "mediaServerType",
                  value: mediaServerType,
                  onChange: (val) => setMediaServerType(val === "jellyfin" ? "jellyfin" : "plex"),
                  options: [
                    { label: "Plex", value: "plex" },
                    { label: "Jellyfin", value: "jellyfin" }
                  ]
                }
              ),
              mediaServerType === "jellyfin" && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-6 p-4 rounded-lg border border-border bg-background/40", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { className: "font-bold text-text mb-3", children: "Jellyfin Connection" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { htmlFor: "jellyfinUrl", children: "Jellyfin URL" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "jellyfinUrl", type: "url", value: jellyfinUrl, onChange: (e) => setJellyfinUrl(e.target.value), placeholder: "http://192.168.1.6:8096" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { htmlFor: "jellyfinApiKey", children: "Jellyfin API Key" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "jellyfinApiKey", type: "password", value: jellyfinApiKey, onChange: (e) => setJellyfinApiKey(e.target.value), placeholder: "API key from Jellyfin dashboard" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                  IntegrationTestButton,
                  {
                    type: "jellyfin",
                    payload: { jellyfinUrl, jellyfinApiKey },
                    disabled: !hasIntegrationCredentials(jellyfinUrl, jellyfinApiKey, initialSettings.jellyfinUrl, initialSettings.jellyfinApiKey),
                    onMessage: (msg, ok) => addToast(msg, ok ? "success" : "error")
                  }
                )
              ] }),
              mediaServerType === "plex" && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { className: "text-lg font-bold text-text mb-4", children: "Plex Connection" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    SettingFieldLabel,
                    {
                      htmlFor: "plexToken",
                      hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(SettingHint, { children: [
                        "Needed to fetch users and manage access. ",
                        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("a", { href: "https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/", target: "_blank", rel: "noopener noreferrer", children: "How to find your token." })
                      ] }),
                      children: "Plex Token"
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "plexToken", type: "password", value: token, onChange: (e) => setToken(e.target.value), placeholder: "Enter your X-Plex-Token" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex flex-wrap items-start gap-3", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: "px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2", onClick: handleFetchServers, disabled: !token, children: "Fetch Servers" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    IntegrationTestButton,
                    {
                      type: "plex",
                      payload: {
                        token,
                        serverIdentifier: selectedServer || initialSettings.serverIdentifier,
                        plexServerUrl: plexServerUrl || void 0
                      },
                      disabled: !token || !(selectedServer || initialSettings.serverIdentifier),
                      onMessage: (msg, ok) => addToast(msg, ok ? "success" : "error")
                    }
                  )
                ] }),
                (selectedServer || initialSettings.serverIdentifier) && servers.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "mt-3 text-sm text-muted inline-flex items-center gap-1.5 flex-wrap", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { children: [
                  "Saved server: ",
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: selectedServer || initialSettings.serverIdentifier })
                ] }) }),
                servers.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4", style: { marginTop: "1rem" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingFieldLabel, { htmlFor: "serverSelect", children: "Select Server" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    CustomSelect,
                    {
                      id: "serverSelect",
                      value: selectedServer,
                      onChange: (val) => setSelectedServer(val),
                      options: servers.map((s) => ({ label: `${s.name} (${s.identifier})`, value: s.identifier }))
                    }
                  ),
                  initialSettings.serverIdentifier && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { className: "mt-2 text-xs text-muted", children: [
                    "Currently saved server ID: ",
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: initialSettings.serverIdentifier })
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4", style: { marginTop: "1rem" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
                    SettingFieldLabel,
                    {
                      htmlFor: "plexServerUrl",
                      hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(SettingHint, { children: [
                        "Your Plex server's LAN address. Use this when Plex.tv discovery fails from inside the container (e.g. ",
                        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("code", { className: "text-xs", children: "getaddrinfo EAI_AGAIN \u2026plex.direct" }),
                        " errors)."
                      ] }),
                      children: [
                        "Direct Plex URL",
                        " ",
                        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "text-muted font-normal normal-case", children: "(required in Docker)" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    "input",
                    {
                      className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all",
                      id: "plexServerUrl",
                      type: "url",
                      value: plexServerUrl,
                      onChange: (e) => setPlexServerUrl(e.target.value),
                      placeholder: "http://192.168.1.6:32400"
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4", style: { marginTop: "1rem" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    SettingFieldLabel,
                    {
                      htmlFor: "checkInterval",
                      hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "How often to check for expired users in the background." }),
                      children: "Check Interval (minutes)"
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "checkInterval", type: "number", value: checkInterval, onChange: (e) => setCheckInterval(Number(e.target.value)), min: "1" })
                ] }),
                libraries.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { id: getSettingsSectionElementId("libraries"), className: "mb-4 mt-4 scroll-mt-24", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    SettingFieldLabel,
                    {
                      hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "Libraries to share automatically when users request temporary access or link their account. Leave empty to share ALL libraries." }),
                      children: "Default Temporary Access/Automated Libraries"
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "flex flex-wrap gap-3 mt-2", children: libraries.map((lib) => {
                    const isSelected = defaultLibraryIds.includes(lib.id);
                    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: `flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all border shadow-sm select-none ${isSelected ? "bg-plex/10 border-plex text-plex font-bold" : "bg-background border-border/50 text-muted hover:border-white/20 hover:text-text font-medium"}`, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                        "input",
                        {
                          type: "checkbox",
                          checked: isSelected,
                          onChange: (e) => {
                            if (e.target.checked) setDefaultLibraryIds([...defaultLibraryIds, lib.id]);
                            else setDefaultLibraryIds(defaultLibraryIds.filter((id) => id !== lib.id));
                          },
                          className: "hidden"
                        }
                      ),
                      isSelected && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Check, { className: "w-3.5 h-3.5" }),
                      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "text-sm", children: lib.title })
                    ] }, lib.id);
                  }) })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { id: getSettingsSectionElementId("privacy"), className: "mb-4 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-border/40 scroll-mt-24", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { className: "font-bold text-text", children: "Stream User Privacy" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-sm text-muted", children: "Control how stream users are displayed to non-admins (e.g. on the public status page)." })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "w-56 ml-4 flex-shrink-0", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                CustomSelect,
                {
                  value: String(hideStreamUsers),
                  onChange: (val) => setHideStreamUsers(val),
                  options: [
                    { label: "Show Names", value: "false" },
                    { label: "Show as Anonymous", value: "anonymous" },
                    { label: "Hide Completely", value: "hidden" }
                  ]
                }
              ) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { id: getSettingsSectionElementId("analytics-usernames"), className: "scroll-mt-24", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              SettingsToggleRow,
              {
                title: "Show Usernames in Analytics",
                description: "Allow non-admin users to see real usernames on the Analytics dashboard. If disabled, usernames are shown as Viewer 1, Viewer 2, etc.",
                checked: showUsernamesInAnalytics,
                onChange: setShowUsernamesInAnalytics
              }
            ) }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4", style: { marginTop: "1rem" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                SettingFieldLabel,
                {
                  htmlFor: "requestUrl",
                  hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "The URL users are redirected to when they click the Request Content button." }),
                  children: "Request URL"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "requestUrl", type: "text", value: requestUrl, onChange: (e) => setRequestUrl(e.target.value), placeholder: "https://yourdomain.com" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4", style: { marginTop: "1rem" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                SettingFieldLabel,
                {
                  htmlFor: "contactUrl",
                  hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: 'Used for the "Request Extension" button in expiry emails. Defaults to sending an email to the SMTP User.' }),
                  children: "Contact URL / Email"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "contactUrl", type: "text", value: contactUrl, onChange: (e) => setContactUrl(e.target.value), placeholder: "mailto:youremail@example.com OR https://wa.me/123456" })
            ] })
          ] }),
          activeTab === "smtp" && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-8", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { className: "text-xl font-bold text-plex mb-4 border-b border-border pb-2", children: "SMTP Email Notifications" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex flex-col md:flex-row gap-4 mb-4", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex-2", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { htmlFor: "smtpHost", children: "SMTP Host" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "smtpHost", type: "text", value: smtpHost, onChange: (e) => setSmtpHost(e.target.value), placeholder: "smtp.mailgun.org" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex-1", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { htmlFor: "smtpPort", children: "Port" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "smtpPort", type: "number", value: smtpPort, onChange: (e) => setSmtpPort(Number(e.target.value)), placeholder: "587" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex flex-col md:flex-row gap-4 mb-4", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex-1", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { htmlFor: "smtpUser", children: "SMTP Username" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "smtpUser", type: "text", value: smtpUser, onChange: (e) => setSmtpUser(e.target.value), placeholder: "postmaster@yourdomain.com" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex-1", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { htmlFor: "smtpPass", children: "SMTP Password" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "smtpPass", type: "password", value: smtpPass, onChange: (e) => setSmtpPass(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex flex-col md:flex-row gap-4 mb-4 md:items-center", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex-[2]", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { htmlFor: "smtpFrom", children: "Sender Address (From)" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "smtpFrom", type: "text", value: smtpFrom, onChange: (e) => setSmtpFrom(e.target.value), placeholder: "Server Manager Portal <noreply@yourdomain.com>" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "flex-1", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                SettingsToggleRow,
                {
                  title: "SSL / Secure",
                  checked: smtpSecure,
                  onChange: setSmtpSecure,
                  border: false,
                  className: "!py-0"
                }
              ) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                SettingFieldLabel,
                {
                  htmlFor: "emailDaysBefore",
                  hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "Automated notification email will be sent when user has this many days left." }),
                  children: "Warning Alert Threshold (Days Before Expiry)"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "emailDaysBefore", type: "number", value: emailDaysBefore, onChange: (e) => setEmailDaysBefore(Number(e.target.value)), min: "0" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mt-6 space-y-3", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { className: "font-bold text-text", children: "Test SMTP Settings" }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex flex-col md:flex-row gap-4 mb-4", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                  "input",
                  {
                    type: "email",
                    value: testRecipient,
                    onChange: (e) => setTestRecipient(e.target.value),
                    placeholder: "test-recipient@gmail.com",
                    className: "flex-grow p-3 rounded-lg border border-border bg-background text-text text-sm outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: "px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2", onClick: handleTestEmail, disabled: isTestingSmtp || !testRecipient, children: isTestingSmtp ? "Sending..." : "Send Test" })
              ] })
            ] })
          ] }),
          activeTab === "newsletter" && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-8", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { className: "text-xl font-bold text-plex mb-4 border-b border-border pb-2", children: "Automated Newsletter" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                SettingFieldLabel,
                {
                  htmlFor: "newsletterFrequency",
                  hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "How often should users receive the newsletter." }),
                  children: "Frequency"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                CustomSelect,
                {
                  id: "newsletterFrequency",
                  value: newsletterFrequency,
                  onChange: (val) => setNewsletterFrequency(val),
                  options: [
                    { label: "Disabled", value: "disabled" },
                    { label: "Weekly", value: "weekly" },
                    { label: "Monthly", value: "monthly" }
                  ]
                }
              )
            ] }),
            newsletterFrequency !== "disabled" && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4", style: { marginTop: "1rem" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { htmlFor: "newsletterDay", children: "Send Day" }),
                newsletterFrequency === "weekly" ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                  CustomSelect,
                  {
                    id: "newsletterDay",
                    value: newsletterDay,
                    onChange: (val) => setNewsletterDay(Number(val)),
                    options: [
                      { label: "Sunday", value: 0 },
                      { label: "Monday", value: 1 },
                      { label: "Tuesday", value: 2 },
                      { label: "Wednesday", value: 3 },
                      { label: "Thursday", value: 4 },
                      { label: "Friday", value: 5 },
                      { label: "Saturday", value: 6 }
                    ]
                  }
                ) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "newsletterDay", type: "number", min: "1", max: "28", value: newsletterDay, onChange: (e) => setNewsletterDay(Number(e.target.value)), placeholder: "Day of the month (1-28)" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4", style: { marginTop: "1rem" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                  SettingFieldLabel,
                  {
                    htmlFor: "publicDomain",
                    hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "Your public URL. This is required to host the posters inside the email." }),
                    children: "Public Domain"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "publicDomain", type: "text", value: publicDomain, onChange: (e) => setPublicDomain(e.target.value), placeholder: "https://portal.yourdomain.com" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mt-6 space-y-3", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { className: "font-bold text-text", children: "Test Newsletter" }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex flex-col md:flex-row gap-4 mb-4", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: "px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2", onClick: handleTestNewsletter, disabled: isTestingNewsletter || isSendingNewsletter, children: isTestingNewsletter ? "Generating & Sending..." : "Send Test Newsletter To Admin" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: "px-4 py-2 bg-plex text-background rounded-md font-medium hover:bg-plex-hover transition-colors flex items-center justify-center gap-2", onClick: handleSendNewsletterNow, disabled: isTestingNewsletter || isSendingNewsletter, children: isSendingNewsletter ? "Sending To All..." : "Send Newsletter To ALL NOW" })
              ] })
            ] })
          ] }),
          activeTab === "cleanup" && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-8 animate-fade-in", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { className: "text-xl font-bold text-plex mb-4 border-b border-border pb-2", children: "Automated User Cleanup" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-6 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-sm text-yellow-500 font-bold mb-1", children: "Warning" }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-xs text-muted", children: "When enabled, the server will automatically revoke portal access for users who have not watched anything for the specified number of days. You can exempt specific users from this rule by editing them in the Users table." })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              SettingsToggleRow,
              {
                title: "Enable Automated Cleanup",
                description: "Run cleanup job automatically in the background",
                checked: inactiveCleanupEnabled,
                onChange: setInactiveCleanupEnabled,
                border: false,
                className: "mb-6"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: `transition-all ${!inactiveCleanupEnabled ? "opacity-50 pointer-events-none" : ""}`, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                SettingFieldLabel,
                {
                  htmlFor: "inactiveCleanupDays",
                  hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "Revoke access if a user has not watched anything in this many days." }),
                  children: "Inactivity Threshold (Days)"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                "input",
                {
                  className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all",
                  id: "inactiveCleanupDays",
                  type: "number",
                  min: "1",
                  value: inactiveCleanupDays,
                  onChange: (e) => setInactiveCleanupDays(Number(e.target.value))
                }
              )
            ] }) })
          ] }),
          activeTab === "mediastack" && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-8 animate-fade-in", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { id: getSettingsSectionElementId("arr"), className: "scroll-mt-24", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                ArrInstancesPanel,
                {
                  type: "sonarr",
                  title: "Sonarr Instances",
                  subtitle: "TV series automation",
                  instances: arrInstances.filter((entry) => entry.type === "sonarr"),
                  savedInstances: savedArrInstances.filter((entry) => entry.type === "sonarr"),
                  libraries,
                  allInstances: arrInstances,
                  onChange: (nextSonarr) => {
                    const other = arrInstances.filter((entry) => entry.type !== "sonarr");
                    setArrInstances([...other, ...nextSonarr]);
                  },
                  onMessage: (msg, ok) => addToast(msg, ok ? "success" : "error")
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                ArrInstancesPanel,
                {
                  type: "radarr",
                  title: "Radarr Instances",
                  subtitle: "Movie automation",
                  className: "mt-10",
                  instances: arrInstances.filter((entry) => entry.type === "radarr"),
                  savedInstances: savedArrInstances.filter((entry) => entry.type === "radarr"),
                  libraries,
                  allInstances: arrInstances,
                  onChange: (nextRadarr) => {
                    const other = arrInstances.filter((entry) => entry.type !== "radarr");
                    setArrInstances([...other, ...nextRadarr]);
                  },
                  onMessage: (msg, ok) => addToast(msg, ok ? "success" : "error")
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { id: getSettingsSectionElementId("tmdb"), className: "scroll-mt-24", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(IntegrationHeading, { app: "tmdb", title: "TMDB Integration", subtitle: "Worldwide trending backgrounds", className: "mt-8" }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                  SettingFieldLabel,
                  {
                    htmlFor: "tmdbApiKey",
                    hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "Used to fetch worldwide trending media backgrounds for the portal slideshow. Get one for free at themoviedb.org." }),
                    children: "TMDB API Key"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "tmdbApiKey", type: "password", value: tmdbApiKey, onChange: (e) => setTmdbApiKey(e.target.value), placeholder: "Enter TMDB API Key" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { id: getSettingsSectionElementId("tautulli"), className: "scroll-mt-24", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(IntegrationHeading, { app: "tautulli", title: "Tautulli Integration", subtitle: "Plex activity and analytics", className: "mt-8" }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { htmlFor: "tautulliUrl", children: "Tautulli URL" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "tautulliUrl", type: "text", value: tautulliUrl, onChange: (e) => setTautulliUrl(e.target.value), placeholder: "http://localhost:8181" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-8", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { htmlFor: "tautulliApiKey", children: "Tautulli API Key" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "tautulliApiKey", type: "password", value: tautulliApiKey, onChange: (e) => setTautulliApiKey(e.target.value), placeholder: "Enter Tautulli API Key" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                IntegrationTestButton,
                {
                  type: "tautulli",
                  payload: { tautulliUrl, tautulliApiKey },
                  disabled: !hasIntegrationCredentials(tautulliUrl, tautulliApiKey, initialSettings.tautulliUrl, initialSettings.tautulliApiKey),
                  className: "mb-6",
                  onMessage: (msg, ok) => addToast(msg, ok ? "success" : "error")
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { id: getSettingsSectionElementId("jellystat"), className: "scroll-mt-24", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(IntegrationHeading, { app: "jellystat", title: "Jellystat Integration", subtitle: "Jellyfin activity and analytics", className: "mt-8" }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                  SettingFieldLabel,
                  {
                    htmlFor: "jellystatUrl",
                    hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "The URL to your Jellystat instance. Jellystat is the Jellyfin analytics companion, similar to Tautulli for Plex." }),
                    children: "Jellystat URL"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "jellystatUrl", type: "text", value: jellystatUrl, onChange: (e) => setJellystatUrl(e.target.value), placeholder: "http://localhost:3000" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-8", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { htmlFor: "jellystatApiKey", children: "Jellystat API Key" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "jellystatApiKey", type: "password", value: jellystatApiKey, onChange: (e) => setJellystatApiKey(e.target.value), placeholder: "API key from Jellystat Settings" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                IntegrationTestButton,
                {
                  type: "jellystat",
                  payload: { jellystatUrl, jellystatApiKey },
                  disabled: !hasIntegrationCredentials(jellystatUrl, jellystatApiKey, initialSettings.jellystatUrl, initialSettings.jellystatApiKey),
                  className: "mb-6",
                  onMessage: (msg, ok) => addToast(msg, ok ? "success" : "error")
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { id: getSettingsSectionElementId("seerr"), className: "scroll-mt-24", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                IntegrationHeading,
                {
                  app: requestAppType === "none" ? "seerr" : requestAppType,
                  title: "Request App Integration",
                  subtitle: "Seerr, Jellyseerr, or Ombi for media requests",
                  className: "mt-8"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                  SettingFieldLabel,
                  {
                    htmlFor: "requestAppType",
                    hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "Used by Library Maintenance rules for request-age/status filtering and cleanup workflows." }),
                    children: "Request App Type"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                  CustomSelect,
                  {
                    id: "requestAppType",
                    value: requestAppType,
                    onChange: (val) => setRequestAppType(val),
                    options: [
                      { label: "Disabled", value: "none" },
                      { label: "Seerr", value: "seerr" },
                      { label: "Jellyseerr", value: "jellyseerr" },
                      { label: "Ombi", value: "ombi" }
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                  SettingFieldLabel,
                  {
                    htmlFor: "requestAppUrl",
                    hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "Public URL users see (reverse proxy is fine). Server-side API calls use the internal fetch URL below when set." }),
                    children: "Request App URL"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "requestAppUrl", type: "text", value: requestAppUrl, onChange: (e) => setRequestAppUrl(e.target.value), placeholder: "https://requests.yourdomain.com" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                  SettingFieldLabel,
                  {
                    htmlFor: "requestAppFetchUrl",
                    hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(SettingHint, { children: [
                      "Optional. URL the portal uses to talk to Seerr from inside Docker (e.g. ",
                      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("code", { children: "http://jellyseerr:5055" }),
                      " or ",
                      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("code", { children: "http://192.168.1.10:5055" }),
                      "). Leave blank to use the public URL above."
                    ] }),
                    children: "Internal fetch URL (optional)"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "requestAppFetchUrl", type: "text", value: requestAppFetchUrl, onChange: (e) => setRequestAppFetchUrl(e.target.value), placeholder: "http://jellyseerr:5055" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-8", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { htmlFor: "requestAppApiKey", children: "Request App API Key" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "requestAppApiKey", type: "password", value: requestAppApiKey, onChange: (e) => setRequestAppApiKey(e.target.value), placeholder: "API key from request app settings" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                IntegrationTestButton,
                {
                  type: "requestApp",
                  payload: { requestAppType, requestAppUrl, requestAppFetchUrl, requestAppApiKey },
                  disabled: requestAppType === "none" || !hasIntegrationCredentials(requestAppUrl, requestAppApiKey, initialSettings.requestAppUrl, initialSettings.requestAppApiKey),
                  onMessage: (msg, ok) => addToast(msg, ok ? "success" : "error")
                }
              )
            ] })
          ] }),
          activeTab === "home-layout" && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(HomeLayoutSettings, { layout: dashboardLayout, onChange: updateDashboardLayout }),
          activeTab === "navigation" && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-8 animate-fade-in", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { className: "text-xl font-bold text-plex mb-4 border-b border-border pb-2", children: "Navigation Order" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-muted text-sm mb-4", children: "Drag and drop or use the arrows to reorder the navigation items on the sidebar." }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "flex flex-col gap-2 max-w-md", children: navOrder.map((key, index) => {
              const labels = {
                "home": "Home",
                "discover": "Discover",
                "status": "Status",
                "logs": "Logs (Admin Only)",
                "analytics": "Analytics",
                "mediastack": "Integrations",
                "maintenance": "Cleaner (Admin Only)",
                "upgrader": "Upgrader (Admin Only)",
                "requests": "Requests (Admin Only)",
                "request": "Request Content",
                "settings": "Settings (Admin Only)",
                "logout": "Logout"
              };
              return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between py-3 border-b border-border/40", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "text-text font-medium", children: labels[key] || key }) }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    "button",
                    {
                      disabled: index === 0,
                      onClick: () => {
                        const newOrder = [...navOrder];
                        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
                        setNavOrder(newOrder);
                      },
                      className: `p-1 rounded transition-colors ${index === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/10 text-muted hover:text-text"}`,
                      children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ChevronUp, { className: "w-5 h-5" })
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    "button",
                    {
                      disabled: index === navOrder.length - 1,
                      onClick: () => {
                        const newOrder = [...navOrder];
                        [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
                        setNavOrder(newOrder);
                      },
                      className: `p-1 rounded transition-colors ${index === navOrder.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/10 text-muted hover:text-text"}`,
                      children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ChevronDown, { className: "w-5 h-5" })
                    }
                  )
                ] })
              ] }, key);
            }) })
          ] }),
          activeTab === "broadcast" && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-8 animate-fade-in", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { className: "text-xl font-bold text-plex mb-4 border-b border-border pb-2", children: "Broadcast Email" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(BroadcastSettingsTab, { users, selectedUserIds: [] })
          ] }),
          activeTab === "status" && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-8 animate-fade-in", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { className: "text-xl font-bold text-plex mb-4 border-b border-border pb-2", children: "Status Monitor" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              StatusMonitorSettings,
              {
                config: statusConfig,
                onChange: setStatusDraft,
                appConfirm,
                fetchConfig: fetchStatusConfig,
                addToast
              }
            )
          ] }),
          activeTab === "contact" && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-8", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { className: "text-xl font-bold text-plex mb-4 border-b border-border pb-2", children: "Contact Details" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-sm text-muted mb-6", children: 'These details are displayed in the "Need Help?" box on the User Dashboard. Users can click these buttons to contact you directly if they need to extend their access, report an issue, or request support.' }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { id: getSettingsSectionElementId("whatsapp"), className: "mb-4 scroll-mt-24", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                SettingFieldLabel,
                {
                  htmlFor: "contactWhatsApp",
                  hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "Enter your phone number including country code, without any '+', spaces, or dashes. If left blank, the WhatsApp button will be hidden." }),
                  children: "WhatsApp Number (Optional)"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "contactWhatsApp", type: "text", value: contactWhatsApp, onChange: (e) => setContactWhatsApp(e.target.value), placeholder: "e.g. 447303647923" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { id: getSettingsSectionElementId("email"), className: "mb-4 scroll-mt-24", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                SettingFieldLabel,
                {
                  htmlFor: "contactEmail",
                  hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "The email address users should contact. If left blank, the Email button will be hidden." }),
                  children: "Email Address (Optional)"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "contactEmail", type: "email", value: contactEmail, onChange: (e) => setContactEmail(e.target.value), placeholder: "e.g. admin@example.com" })
            ] })
          ] }),
          activeTab === "branding" && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-8 animate-fade-in", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { className: "text-xl font-bold text-plex mb-4 border-b border-border pb-2", children: "Branding & UI" }),
            mediaServerType === "jellyfin" && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "mb-4 rounded-lg border border-plex/30 bg-plex/10 p-4", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center gap-3 min-w-0", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "w-11 h-11 rounded-lg bg-background border border-plex/30 flex items-center justify-center overflow-hidden flex-shrink-0", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("img", { src: JELLYFIN_BRAND_LOGO_URL, alt: "", className: "w-8 h-8 object-contain" }) }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { className: "font-bold text-text", children: "Jellyfin branding" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-xs text-muted mt-1", children: "Use the Jellyfin server icon and splash background across the portal." })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                "button",
                {
                  type: "button",
                  onClick: applyJellyfinBranding,
                  className: "px-4 py-2 bg-plex hover:bg-plex-hover text-background rounded-md font-bold transition-colors whitespace-nowrap",
                  children: "Use Jellyfin icon & splash"
                }
              )
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { id: getSettingsSectionElementId("logo"), className: "mb-4 scroll-mt-24", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingFieldLabel, { hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "Provide a URL or upload a file. (Max 5MB)" }), children: "Custom Logo" }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex flex-col gap-2", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { type: "url", className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex transition-all", value: customLogoUrl, onChange: (e) => setCustomLogoUrl(e.target.value), placeholder: "https://example.com/logo.png" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "text-center text-muted font-bold text-sm", children: "OR" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { type: "file", accept: "image/*", className: "w-full p-2 rounded-lg border border-border bg-background text-muted text-sm outline-none focus:border-plex transition-all file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-text hover:file:bg-white/20 file:cursor-pointer cursor-pointer", onChange: (e) => setLogoFile(e.target.files?.[0] || null) })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { id: getSettingsSectionElementId("theme"), className: "mb-8 relative z-[50] scroll-mt-24", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                SettingFieldLabel,
                {
                  hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "The default theme applied to new visitors and users. Users can still customize their local theme preference in the navigation menu." }),
                  children: "Portal Theme"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                CustomSelect,
                {
                  value: brandingTheme,
                  onChange: setBrandingTheme,
                  options: [
                    { label: "Dynamic (Chameleon)", value: "dynamic" },
                    { label: "Plex Dark", value: "plex" },
                    { label: "Sleek Slate", value: "slate" },
                    { label: "Nordic Frost", value: "nordic" },
                    { label: "Jellyfin Purple", value: "jellyfin" },
                    { label: "Emerald Green", value: "emerald" },
                    { label: "Neon Midnight", value: "midnight" },
                    { label: "Crimson Red", value: "crimson" },
                    { label: "Deep Amethyst", value: "amethyst" },
                    { label: "Sunset Orange", value: "sunset" }
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              SettingsToggleRow,
              {
                title: "Enable Scroll Reveal Animations",
                hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "Smoothly slide elements into place as you scroll down the dashboard." }),
                checked: useScrollRevealAnimations,
                onChange: setUseScrollRevealAnimations,
                className: "mb-4 mt-4"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              SettingsToggleRow,
              {
                title: "Enable Cinematic Loading Sequences",
                hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "Replaces the standard loading spinner with a beautiful SVG line-drawing animation." }),
                checked: useCinematicLoading,
                onChange: setUseCinematicLoading,
                className: "mb-4"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              SettingsToggleRow,
              {
                title: "Enable Branded Skeleton Loading",
                hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "Use a branded, animated shimmer effect for skeleton loaders instead of the default pulse." }),
                checked: useBrandedSkeleton,
                onChange: setUseBrandedSkeleton,
                className: "mb-4"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { id: getSettingsSectionElementId("slideshow"), className: "scroll-mt-24", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              SettingsToggleRow,
              {
                title: "Enable TMDB Trending Slideshow",
                hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "Replaces the static splash background with a fading slideshow of currently trending movies and shows from TMDB. Requires a TMDB API key in Integrations." }),
                checked: useTrendingSlideshow,
                onChange: setUseTrendingSlideshow,
                className: "mb-4",
                children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: `transition-all overflow-hidden ${useTrendingSlideshow ? "max-h-[100px] opacity-100 mt-4" : "max-h-0 opacity-0"}`, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { children: "Slideshow Interval (Seconds)" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
                    "select",
                    {
                      className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex transition-all mt-1",
                      value: trendingSlideshowInterval,
                      onChange: (e) => setTrendingSlideshowInterval(parseInt(e.target.value, 10)),
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: 10, children: "10 Seconds" }),
                        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: 20, children: "20 Seconds" }),
                        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: 30, children: "30 Seconds" }),
                        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: 40, children: "40 Seconds" }),
                        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: 50, children: "50 Seconds" }),
                        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: 60, children: "60 Seconds" })
                      ]
                    }
                  )
                ] })
              }
            ) }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              SettingsToggleRow,
              {
                title: "Enable Slideshow on Login Page",
                hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "Display the TMDB trending slideshow background on the login and landing pages." }),
                checked: useTrendingSlideshowOnLogin,
                onChange: setUseTrendingSlideshowOnLogin,
                className: "mb-4"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: `mb-4 transition-opacity ${useTrendingSlideshow ? "opacity-50 pointer-events-none" : "opacity-100"}`, children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                SettingFieldLabel,
                {
                  hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "Shown as a subtle splash image on the login screen and portal background." }),
                  children: "Static Splash Background Image"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                "input",
                {
                  type: "url",
                  className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex transition-all",
                  value: backgroundImageUrl,
                  onChange: (e) => setBackgroundImageUrl(e.target.value),
                  placeholder: "https://example.com/background.png"
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "mb-6 rounded-lg border border-border overflow-hidden bg-background/70", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              "div",
              {
                className: "relative min-h-[220px] flex items-center justify-center p-6 bg-card",
                style: backgroundImageUrl ? {
                  backgroundImage: `linear-gradient(rgba(10,15,20,0.42), rgba(10,15,20,0.56)), url("${resolvePortalAssetUrl(backgroundImageUrl).replace(/"/g, "%22")}")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  backgroundSize: "cover"
                } : void 0,
                children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "text-center", children: [
                  customLogoUrl ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    "img",
                    {
                      src: resolvePortalAssetUrl(customLogoUrl),
                      alt: "Server icon preview",
                      className: "max-w-28 max-h-24 object-contain mx-auto mb-4 drop-shadow-[0_0_24px_rgba(0,0,0,0.75)]",
                      onError: (e) => {
                        e.currentTarget.style.display = "none";
                      }
                    }
                  ) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "w-24 h-24 rounded-full border-2 border-plex/50 bg-background/80 mx-auto mb-4 p-3 shadow-[0_0_36px_rgba(0,164,220,0.28)]", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "w-full h-full flex items-center justify-center text-3xl font-black text-plex", children: "S" }) }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-sm font-bold text-text", children: "Portal splash preview" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-xs text-muted mt-1", children: "This is the server icon and background users will see." })
                ] })
              }
            ) }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              SettingsToggleRow,
              {
                title: "Use 24-Hour Clock across the Portal",
                checked: use24HourClock,
                onChange: setUse24HourClock,
                className: "mb-4"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { id: getSettingsSectionElementId("poster-badges"), className: "scroll-mt-24", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              SettingsToggleRow,
              {
                title: "Poster Quality Badges",
                description: "Show quality badges on recently added and discover posters (4K, HDR, codec, Atmos)",
                hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "Applies to Home and Discover poster cards for all users." }),
                checked: showPosterQualityBadges,
                onChange: setShowPosterQualityBadges,
                className: "mb-4"
              }
            ) }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              SettingsToggleRow,
              {
                title: "Allow Temporary Access (Public Sign-ups)",
                checked: allowTemporaryAccess,
                onChange: setAllowTemporaryAccess,
                className: "mb-4"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-border/40", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { className: "font-bold text-text", children: "Show Status Monitor Before Login" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "Allow visitors without a session to open the status page and see monitored service health." })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                  "input",
                  {
                    type: "checkbox",
                    className: "sr-only peer",
                    checked: showPublicStatusMonitor,
                    onChange: (e) => setShowPublicStatusMonitor(e.target.checked)
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "w-11 h-6 bg-background peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-plex" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-border/40", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { className: "font-bold text-text", children: "Show Library Stats Before Login" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "Display public library counts on login and invite pages before users sign in." })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                  "input",
                  {
                    type: "checkbox",
                    className: "sr-only peer",
                    checked: showPublicLibraryStats,
                    onChange: (e) => setShowPublicLibraryStats(e.target.checked)
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "w-11 h-6 bg-background peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-plex" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { id: getSettingsSectionElementId("announcement"), className: "text-xl font-bold text-plex mb-4 border-b border-border pb-2 mt-8 scroll-mt-24", children: "Announcements" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-4", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingFieldLabel, { hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "If provided, this announcement will be prominently displayed to all users." }), children: "Portal Announcement Banner" }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("textarea", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex transition-all", value: announcement, onChange: (e) => setAnnouncement(e.target.value), placeholder: "E.g. Server maintenance scheduled for Friday...", rows: 3 }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "flex justify-end mt-2", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                "button",
                {
                  onClick: handlePushAnnouncement,
                  disabled: isPushingAnnouncement || !announcement,
                  className: "bg-plex hover:bg-plex-hover disabled:opacity-50 text-background font-bold py-1.5 px-4 rounded-lg transition-colors text-sm whitespace-nowrap",
                  children: isPushingAnnouncement ? "Pushing..." : "Save & Send Email Blast"
                }
              ) })
            ] })
          ] }),
          activeTab === "invites" && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            InvitesSettings,
            {
              addToast,
              referralEnabled,
              setReferralEnabled,
              referralTrialDays,
              setReferralTrialDays,
              referralRewardDays,
              setReferralRewardDays
            }
          ),
          activeTab === "tasks" && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-8 animate-fade-in", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { className: "text-xl font-bold text-plex mb-4 border-b border-border pb-2", children: "Background Tasks" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "flex flex-col gap-4", children: tasks.map((task) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "py-4 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex flex-wrap items-center gap-2 mb-1", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { className: "font-bold text-lg", children: task.name }),
                  task.running ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.15)] animate-pulse", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" }),
                    "Running"
                  ] }) : task.lastError ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "w-1.5 h-1.5 bg-red-400 rounded-full" }),
                    "Failed"
                  ] }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 text-muted border border-border", children: "Idle" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-sm text-muted mb-2", children: task.description }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { className: "text-text", children: "Last Run:" }),
                    " ",
                    task.lastRun ? new Date(task.lastRun).toLocaleString() : "Never"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { className: "text-text", children: "Next Run:" }),
                    " ",
                    task.nextRun ? new Date(task.nextRun).toLocaleString() : "Not Scheduled"
                  ] }),
                  task.lastDurationMs !== null && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { className: "text-text", children: "Duration:" }),
                    " ",
                    Math.round(task.lastDurationMs / 1e3),
                    "s"
                  ] }),
                  task.lastError && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "bg-red-500/20 text-red-300 px-2 py-1 rounded", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: "Error:" }),
                    " ",
                    task.lastError
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                "button",
                {
                  className: `px-4 py-2 rounded-md font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${task.running ? "bg-slate-800 text-muted border border-border cursor-not-allowed opacity-60" : "bg-plex text-background hover:bg-plex-hover"}`,
                  disabled: task.running,
                  onClick: () => handleRunTask(task.id),
                  children: task.running ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("svg", { className: "animate-spin h-4 w-4 text-muted", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
                      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: "Running..." })
                  ] }) : "Run Now"
                }
              )
            ] }, task.id)) })
          ] }),
          activeTab === "upgrader" && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-8 animate-fade-in space-y-6", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { className: "text-xl font-bold text-plex mb-4 border-b border-border pb-2", children: "Library Upgrader" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { id: getSettingsSectionElementId("upgrader"), className: "space-y-3 scroll-mt-24", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                SettingsToggleRow,
                {
                  title: "Enable Library Upgrader",
                  hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "Standalone admin view to find non-HEVC titles with Plex or Jellyfin and Sonarr/Radarr deep links. OFF by default." }),
                  checked: upgraderEnabled,
                  onChange: setUpgraderEnabled,
                  border: false
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { className: `text-xs mt-2 font-semibold ${upgraderEnabled ? "text-green-300" : "text-yellow-300"}`, children: [
                "Current status: ",
                upgraderEnabled ? "ON" : "OFF"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mt-3", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { className: "font-semibold text-sm block mb-2", children: "Default filter preset" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    CustomSelect,
                    {
                      value: upgraderDefaultPreset,
                      onChange: setUpgraderDefaultPreset,
                      options: UPGRADER_PRESET_SELECT_OPTIONS
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { className: "font-semibold text-sm block mb-2", children: "Large non-HEVC minimum size (GB)" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    "input",
                    {
                      type: "number",
                      min: 0,
                      step: 0.5,
                      className: "w-full p-2 rounded border border-border bg-background text-text",
                      value: upgraderMinSizeGB,
                      onChange: (e) => setUpgraderMinSizeGB(Math.max(0, Number(e.target.value) || 0))
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                SettingsToggleRow,
                {
                  title: "Enable ARR automation",
                  hint: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingHint, { children: "Allow Upgrader to switch Sonarr/Radarr quality profiles and trigger searches. Opt-in per action with dry-run preview." }),
                  checked: upgraderAutomationEnabled,
                  onChange: setUpgraderAutomationEnabled,
                  border: false
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mt-3", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { className: "font-semibold text-sm block mb-2", children: "Default sort" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    CustomSelect,
                    {
                      value: upgraderDefaultSort,
                      onChange: setUpgraderDefaultSort,
                      options: [
                        { value: "sizeGB", label: "Largest first" },
                        { value: "watchCount", label: "Most watched" },
                        { value: "addedAt", label: "Recently added" },
                        { value: "daysSinceAdded", label: "Oldest added" },
                        { value: "staleAdded", label: "Stale (old + unwatched)" },
                        { value: "title", label: "Title A\u2013Z" }
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { className: "font-semibold text-sm block mb-2", children: "Drawer display mode" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    CustomSelect,
                    {
                      value: upgraderDrawerPosition,
                      onChange: setUpgraderDrawerPosition,
                      options: [
                        { value: "sidebar", label: "Right sidebar (default)" },
                        { value: "modal", label: "Center modal" }
                      ]
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mt-3", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { className: "font-semibold text-sm block mb-2", children: "Max upgrades per hour" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                  "input",
                  {
                    type: "number",
                    min: 1,
                    className: "w-full p-2 rounded border border-border bg-background text-text",
                    value: upgraderMaxActionsPerHour,
                    onChange: (e) => setUpgraderMaxActionsPerHour(Math.max(1, Number(e.target.value) || 25))
                  }
                )
              ] }) }),
              upgraderAutomationEnabled && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mt-4 space-y-3", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h5", { className: "font-semibold text-sm text-text", children: "HEVC quality profile per ARR instance" }),
                loadingUpgraderProfiles ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-xs text-muted", children: "Loading quality profiles\u2026" }) : upgraderProfileInstances.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-xs text-yellow-200", children: "Configure ready Sonarr/Radarr instances first." }) : upgraderProfileInstances.map((instance) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-3 items-end border border-border/40 rounded-lg p-3", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-sm font-semibold text-text", children: instance.name }),
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-[11px] text-muted capitalize", children: instance.type })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    CustomSelect,
                    {
                      value: String(upgraderProfileMap[instance.id]?.hevcProfileId || ""),
                      onChange: (value) => {
                        const hevcProfileId = Number(value);
                        setUpgraderProfileMap((prev) => {
                          const next = { ...prev };
                          if (hevcProfileId > 0) next[instance.id] = { hevcProfileId };
                          else delete next[instance.id];
                          return next;
                        });
                      },
                      options: [
                        { value: "", label: "Select HEVC profile\u2026" },
                        ...(instance.profiles || []).map((profile) => ({
                          value: String(profile.id),
                          label: profile.name
                        }))
                      ]
                    }
                  )
                ] }, instance.id))
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-[11px] text-muted mt-1", children: "Requires Plex or Jellyfin. Sonarr/Radarr recommended for deep links and automation." }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-[11px] text-muted mt-1", children: "After changing these options, click Save Settings." })
            ] })
          ] }),
          activeTab === "system" && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-8 animate-fade-in space-y-6", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { className: "text-xl font-bold text-plex mb-4 border-b border-border pb-2", children: "System" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { id: getSettingsSectionElementId("health"), className: "space-y-4 mb-8 scroll-mt-24", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { className: "font-bold text-text", children: "Health Dashboard" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: `text-xs px-2 py-1 rounded font-bold ${systemHealth.score >= 85 ? "bg-green-500/20 text-green-300" : systemHealth.score >= 65 ? "bg-yellow-500/20 text-yellow-300" : "bg-red-500/20 text-red-300"}`, children: systemHealth.status })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 text-sm", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-muted text-xs mb-1", children: "Health Score" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { className: "text-xl font-bold text-text", children: [
                    systemHealth.score,
                    "%"
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-muted text-xs mb-1", children: "Integrations" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { className: "text-xl font-bold text-text", children: [
                    systemHealth.integrationsConfigured,
                    "/",
                    systemHealth.integrationsTotal
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-muted text-xs mb-1", children: "Caches" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { className: "text-xl font-bold text-text", children: [
                    systemHealth.cacheHealthy,
                    "/",
                    systemHealth.cacheTotal
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-muted text-xs mb-1", children: "Running Jobs" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-xl font-bold text-text", children: systemHealth.runningJobs })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-muted text-xs mb-1", children: "Failing Jobs" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: `text-xl font-bold ${systemHealth.failingJobs > 0 ? "text-red-300" : "text-text"}`, children: systemHealth.failingJobs })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-xs font-semibold text-muted mb-2", children: "Attention Needed" }),
                systemHealth.alerts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-sm text-green-300", children: "No active health alerts." }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("ul", { className: "text-sm text-yellow-200 space-y-1", children: systemHealth.alerts.map((alert2, index) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("li", { children: [
                  "- ",
                  alert2
                ] }, `health-alert-${index}`)) })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { id: getSettingsSectionElementId("maintenance"), className: `space-y-3 mb-8 transition-all duration-300 scroll-mt-24 ${highlightMaintenanceToggle ? "ring-2 ring-plex/50 rounded-lg p-3 -m-3" : ""}`, children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { className: "font-bold text-text", children: "Cleaner Experimental Mode" }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                SettingsToggleRow,
                {
                  title: "Enable Cleaner Module",
                  description: "Single global toggle for the main Cleaner navigation section. OFF by default.",
                  checked: maintenanceExperimentalEnabled,
                  onChange: setMaintenanceExperimentalEnabled,
                  border: false
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { className: `text-xs mt-2 font-semibold ${maintenanceExperimentalEnabled ? "text-green-300" : "text-yellow-300"}`, children: [
                "Current status: ",
                maintenanceExperimentalEnabled ? "ON" : "OFF"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-[11px] text-muted mt-1", children: "After changing this toggle, click the main Save Settings button." })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { id: getSettingsSectionElementId("backup"), className: "space-y-4 mb-8 scroll-mt-24", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { className: "font-bold text-text", children: "Backup & Restore" }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-4", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                  SettingsToggleRow,
                  {
                    title: "Auto Backup Enabled",
                    checked: autoBackupEnabled,
                    onChange: setAutoBackupEnabled,
                    border: false,
                    className: "!py-0"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { className: "font-semibold text-sm block mb-2", children: "Interval (Days)" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    "input",
                    {
                      type: "number",
                      min: 1,
                      className: "w-full p-2 rounded border border-border bg-background text-text",
                      value: autoBackupIntervalDays,
                      onChange: (e) => setAutoBackupIntervalDays(Math.max(1, Number(e.target.value) || 1))
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("label", { className: "font-semibold text-sm block mb-2", children: "Rolling Backups Kept" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    "input",
                    {
                      type: "number",
                      min: 1,
                      className: "w-full p-2 rounded border border-border bg-background text-text",
                      value: autoBackupRetentionCount,
                      onChange: (e) => setAutoBackupRetentionCount(Math.max(1, Number(e.target.value) || 1))
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex flex-wrap gap-3 mb-4", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: "px-4 py-2 bg-plex text-background rounded-md font-bold hover:bg-plex-hover transition-colors", onClick: handleDownloadBackup, children: "Download Backup" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: "px-4 py-2 bg-indigo-600 text-white rounded-md font-bold hover:bg-indigo-500 transition-colors", onClick: handleCreateBackupFile, children: "Create Backup File" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: "px-4 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-500 transition-colors disabled:opacity-50", onClick: handleRestoreBackup, disabled: isRestoringBackup, children: isRestoringBackup ? "Restoring..." : "Restore Backup" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                "textarea",
                {
                  className: "w-full min-h-[140px] p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex",
                  placeholder: "Paste backup JSON here before clicking Restore Backup...",
                  value: backupRestoreText,
                  onChange: (e) => setBackupRestoreText(e.target.value)
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mt-4", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h5", { className: "font-semibold text-sm text-text mb-2", children: "Auto Backup Files" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "flex flex-col gap-2 max-h-56 overflow-y-auto pr-1", children: backupFiles.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-xs text-muted", children: "No backup files found in backup folder." }) : backupFiles.map((file) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "py-2 border-b border-border/40 flex items-center justify-between gap-2 last:border-b-0", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "text-xs", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "font-semibold text-text", children: file.filename }),
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { className: "text-muted", children: [
                      file.createdAt ? new Date(file.createdAt).toLocaleString() : "Unknown date",
                      " \xB7 ",
                      (file.size / 1024).toFixed(1),
                      " KB"
                    ] })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: "px-3 py-1.5 bg-red-600/80 text-white rounded text-xs font-bold hover:bg-red-500", onClick: () => handleRestoreFromFile(file.filename), children: "Restore" })
                ] }, file.filename)) })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { id: getSettingsSectionElementId("diagnostics"), className: "space-y-4 mb-8 scroll-mt-24", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { className: "font-bold text-text", children: "System Diagnostics" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: "px-3 py-1.5 bg-border text-text rounded-md font-semibold hover:bg-opacity-80", onClick: fetchDiagnostics, children: isLoadingDiagnostics ? "Refreshing..." : "Refresh" })
              ] }),
              diagnostics ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-4 gap-y-2 text-sm", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: "App Version:" }),
                  " ",
                  diagnostics?.app?.version || "unknown"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: "Uptime:" }),
                  " ",
                  diagnostics?.app?.uptimeSeconds || 0,
                  "s"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: "Node:" }),
                  " ",
                  diagnostics?.app?.nodeVersion || "n/a"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: "Memory:" }),
                  " ",
                  diagnostics?.app?.memoryRssMB || 0,
                  " MB"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("strong", { children: [
                    "Media Player (",
                    mediaServerType === "jellyfin" ? "Jellyfin" : "Plex",
                    ")"
                  ] }),
                  renderConfigPill(mediaServerType === "jellyfin" ? !!diagnostics?.integrations?.jellyfinConfigured : !!diagnostics?.integrations?.plexConfigured)
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: "SMTP" }),
                  renderOptionalIntegrationPill(!!diagnostics?.integrations?.smtpConfigured)
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: "Sonarr" }),
                  renderConfigPill(!!diagnostics?.integrations?.sonarrConfigured),
                  diagnostics?.integrations?.arrInstanceCounts?.sonarr?.ready > 1 && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "text-[10px] text-muted", children: [
                    diagnostics.integrations.arrInstanceCounts.sonarr.ready,
                    " instances"
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: "Radarr" }),
                  renderConfigPill(!!diagnostics?.integrations?.radarrConfigured),
                  diagnostics?.integrations?.arrInstanceCounts?.radarr?.ready > 1 && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "text-[10px] text-muted", children: [
                    diagnostics.integrations.arrInstanceCounts.radarr.ready,
                    " instances"
                  ] })
                ] }),
                mediaServerType === "jellyfin" ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: "Jellystat" }),
                  renderConfigPill(!!diagnostics?.integrations?.jellystatConfigured)
                ] }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: "Tautulli" }),
                  renderConfigPill(!!diagnostics?.integrations?.tautulliConfigured)
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: "Request App" }),
                  renderOptionalPill(!!diagnostics?.integrations?.requestAppEnabled, !!diagnostics?.integrations?.requestAppConfigured)
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: "Analytics Cache" }),
                  renderConfigPill(!!diagnostics?.caches?.analytics?.exists)
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: "Trending Cache" }),
                  renderConfigPill(!!diagnostics?.caches?.trending?.exists)
                ] }),
                mediaServerType !== "jellyfin" && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: "Plex Stats Cache" }),
                  renderConfigPill(!!diagnostics?.caches?.plexStats?.exists)
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: "Users File" }),
                  renderConfigPill(!!diagnostics?.files?.users?.exists)
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: "Config File" }),
                  renderConfigPill(!!diagnostics?.files?.config?.exists)
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: "Auto Backup" }),
                  renderConfigPill(!!diagnostics?.backup?.enabled)
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: "Backup Files:" }),
                  " ",
                  diagnostics?.backup?.availableBackups ?? 0
                ] })
              ] }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-sm text-muted", children: "No diagnostics loaded yet." })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { className: "space-y-4 mb-8", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { className: "font-bold text-text", children: "Job Queue" }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "flex flex-col gap-3", children: tasks.map((task) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "py-3 border-b border-border/40 last:border-b-0 flex items-center justify-between gap-4", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "font-semibold text-text", children: task.name }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "text-xs text-muted mt-1", children: [
                    "Last: ",
                    task.lastRun ? new Date(task.lastRun).toLocaleString() : "Never",
                    " \xB7 Next: ",
                    task.nextRun ? new Date(task.nextRun).toLocaleString() : "Not Scheduled",
                    task.lastDurationMs !== null ? ` \xB7 Duration: ${Math.round(task.lastDurationMs / 1e3)}s` : ""
                  ] }),
                  task.lastError && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "text-xs text-red-300 mt-1", children: [
                    "Last error: ",
                    task.lastError
                  ] })
                ] }),
                task.running ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.15)] animate-pulse whitespace-nowrap", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" }),
                  "Running"
                ] }) : task.lastError ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 whitespace-nowrap", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "w-1.5 h-1.5 bg-red-400 rounded-full" }),
                  "Failed"
                ] }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 text-muted border border-border whitespace-nowrap", children: "Idle" })
              ] }, `system-${task.id}`)) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { className: "space-y-4 mb-8", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { className: "font-bold text-text", children: "Audit Log Viewer" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: "px-3 py-1.5 bg-border text-text rounded-md font-semibold hover:bg-opacity-80", onClick: fetchAuditLog, children: isLoadingAuditLog ? "Refreshing..." : "Refresh" })
              ] }),
              pagedAuditEntries.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-sm text-muted", children: "No audit events found." }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "space-y-3", children: [
                pagedAuditEntries.map((entry) => {
                  const diffRows = getAuditDiffRows(entry.details);
                  const detailKeys = entry.details && typeof entry.details === "object" ? Object.entries(entry.details).filter(([key]) => !diffRows.some((row) => key.toLowerCase().includes(row.field.toLowerCase()))) : [];
                  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("details", { className: "py-3 border-b border-border/40 last:border-b-0", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("summary", { className: "cursor-pointer list-none", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "font-semibold text-text text-sm", children: formatEventName(entry.event || "event") }),
                        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "text-[11px] text-muted", children: formatDateTime(entry.timestamp) })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { className: "text-xs text-muted mt-1", children: [
                        "Target: ",
                        entry.target?.username || entry.target?.email || "System",
                        entry.actor?.username || entry.actor?.email ? ` \xB7 Actor: ${entry.actor.username || entry.actor.email}` : ""
                      ] })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mt-3 space-y-2", children: [
                      diffRows.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "overflow-x-auto", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("table", { className: "w-full text-xs border border-border/60 rounded-lg overflow-hidden", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("thead", { className: "bg-black/30 text-muted", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("tr", { children: [
                          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("th", { className: "text-left px-2 py-1", children: "Field" }),
                          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("th", { className: "text-left px-2 py-1", children: "Before" }),
                          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("th", { className: "text-left px-2 py-1", children: "After" })
                        ] }) }),
                        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("tbody", { children: diffRows.map((row, rowIdx) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("tr", { className: "border-t border-border/50", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("td", { className: "px-2 py-1 text-text", children: row.field }),
                          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("td", { className: "px-2 py-1 text-red-300", children: row.before }),
                          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("td", { className: "px-2 py-1 text-green-300", children: row.after })
                        ] }, `${entry.id}-diff-${rowIdx}`)) })
                      ] }) }),
                      detailKeys.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "text-xs text-muted bg-black/30 rounded p-2 space-y-1", children: detailKeys.map(([key, value]) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { children: [
                        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "text-text", children: [
                          key,
                          ":"
                        ] }),
                        " ",
                        stringifyAuditValue(value)
                      ] }, `${entry.id}-${key}`)) })
                    ] })
                  ] }, entry.id);
                }),
                totalAuditLogPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between pt-1", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    "button",
                    {
                      className: "px-3 py-1.5 bg-border text-text rounded-md font-semibold hover:bg-opacity-80 disabled:opacity-50",
                      disabled: auditLogPage === 1,
                      onClick: () => setAuditLogPage((p) => Math.max(1, p - 1)),
                      children: "Previous"
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "text-xs text-muted", children: [
                    "Page ",
                    auditLogPage,
                    " of ",
                    totalAuditLogPages
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    "button",
                    {
                      className: "px-3 py-1.5 bg-border text-text rounded-md font-semibold hover:bg-opacity-80 disabled:opacity-50",
                      disabled: auditLogPage === totalAuditLogPages,
                      onClick: () => setAuditLogPage((p) => Math.min(totalAuditLogPages, p + 1)),
                      children: "Next"
                    }
                  )
                ] })
              ] })
            ] })
          ] }),
          activeTab === "logs" && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "mb-8 animate-fade-in space-y-8", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { className: "text-xl font-bold text-plex mb-4 border-b border-border pb-2", children: "Logs & Audit" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { className: "space-y-3", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { className: "font-bold text-text", children: "Deleted User Blocklist" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-300", children: deletedUsersLog.length })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "space-y-2", children: deletedUsersLog.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-sm text-muted", children: "No deleted users are currently blocked." }) : deletedUsersLog.map((deletedUser) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "py-3 border-b border-border/40 flex items-center justify-between gap-3 last:border-b-0", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-sm font-semibold text-text truncate", children: deletedUser.username || "Unknown user" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-xs text-muted truncate", children: deletedUser.email || deletedUser.plexId || deletedUser.id || "No identifier" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { className: "text-[11px] text-muted/80", children: [
                    "Deleted ",
                    formatDateTime(deletedUser.deletedAt),
                    " by ",
                    deletedUser.deletedBy || "admin"
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                  "button",
                  {
                    className: "px-3 py-1.5 bg-border text-text rounded text-xs font-semibold hover:bg-opacity-80",
                    onClick: () => handleUnblockDeletedUser(deletedUser),
                    children: "Unblock"
                  }
                )
              ] }, deletedUser.blockId)) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { className: "space-y-3", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { className: "font-bold text-text", children: "Email Log" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: "px-3 py-1.5 bg-border text-text rounded-md font-semibold hover:bg-opacity-80", onClick: fetchAuditLog, children: isLoadingAuditLog ? "Refreshing..." : "Refresh" })
              ] }),
              pagedEmailEntries.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-sm text-muted", children: "No system emails have been logged yet." }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "space-y-2", children: [
                pagedEmailEntries.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "py-3 border-b border-border/40 last:border-b-0", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-start justify-between gap-3", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-sm font-semibold text-text line-clamp-1", children: entry.details?.subject || "System Email" }),
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "text-[11px] text-muted whitespace-nowrap", children: formatDateTime(entry.timestamp) })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { className: "text-xs text-muted mt-1", children: [
                    "To: ",
                    entry.target?.username || entry.target?.email || "Unknown user"
                  ] })
                ] }, entry.id)),
                totalEmailLogPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between pt-1", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    "button",
                    {
                      className: "px-3 py-1.5 bg-border text-text rounded-md font-semibold hover:bg-opacity-80 disabled:opacity-50",
                      disabled: emailLogPage === 1,
                      onClick: () => setEmailLogPage((p) => Math.max(1, p - 1)),
                      children: "Previous"
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "text-xs text-muted", children: [
                    "Page ",
                    emailLogPage,
                    " of ",
                    totalEmailLogPages
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    "button",
                    {
                      className: "px-3 py-1.5 bg-border text-text rounded-md font-semibold hover:bg-opacity-80 disabled:opacity-50",
                      disabled: emailLogPage === totalEmailLogPages,
                      onClick: () => setEmailLogPage((p) => Math.min(totalEmailLogPages, p + 1)),
                      children: "Next"
                    }
                  )
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex justify-end gap-4 mt-8 pt-6 border-t border-border/50", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("a", { href: "https://jl94x4.github.io/Server-Manager-Portal/", target: "_blank", rel: "noreferrer", className: "w-full sm:w-auto px-6 py-3 bg-border text-text rounded-lg font-bold hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(BookOpen, { className: "w-5 h-5" }),
            " Docs"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: "w-full sm:w-auto px-6 py-3 bg-plex text-background rounded-lg font-bold hover:bg-plex-hover transition-colors flex items-center justify-center gap-2 shadow-lg shadow-plex/10", onClick: handleSave, children: activeTab === "stream-rules" ? "Save Stream Rules" : "Save Settings" })
        ] })
      ] })
    ] }) })
  ] });
};
export {
  SettingsDashboard
};
