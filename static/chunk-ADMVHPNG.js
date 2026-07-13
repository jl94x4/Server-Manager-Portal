import {
  CircleCheckBig,
  CircleX,
  Plus,
  RefreshCw,
  SettingsSwitch,
  Star,
  Trash2,
  __toESM,
  apiFetch,
  require_jsx_runtime,
  require_react
} from "./chunk-VHFL7SYV.js";

// client/shared/confirm.ts
var appConfirm = () => {
  console.warn("appConfirm not initialized");
};
var bindAppConfirm = (handler) => {
  appConfirm = handler;
};

// client/shared/IntegrationTestButton.tsx
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var IntegrationTestButton = ({
  type,
  payload = {},
  label = "Test Connection",
  disabled = false,
  className = "",
  onMessage
}) => {
  const [status, setStatus] = (0, import_react.useState)("idle");
  const [message, setMessage] = (0, import_react.useState)("");
  const handleTest = async () => {
    setStatus("testing");
    setMessage("");
    try {
      const result = await apiFetch("/api/config/test-integration", {
        method: "POST",
        body: JSON.stringify({ type, ...payload })
      });
      const msg = result.message || "Connection successful";
      setStatus("success");
      setMessage(msg);
      onMessage?.(msg, true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Connection failed";
      setStatus("error");
      setMessage(msg);
      onMessage?.(msg, false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: `flex flex-col gap-2 ${className}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "button",
      {
        type: "button",
        onClick: handleTest,
        disabled: disabled || status === "testing",
        className: "px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 w-fit",
        children: [
          status === "testing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "w-4 h-4 animate-spin" }) : null,
          label
        ]
      }
    ),
    message && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: `text-sm flex items-start gap-1.5 ${status === "success" ? "text-green-400" : "text-red-400"}`, children: [
      status === "success" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { className: "w-4 h-4 flex-shrink-0 mt-0.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "w-4 h-4 flex-shrink-0 mt-0.5" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: message })
    ] })
  ] });
};

// client/settings/ArrInstancesPanel.tsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
var SECRET_MASK = "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
var hasCredentials = (instance, saved) => {
  const effectiveUrl = String(instance.url || saved?.url || "").trim();
  const effectiveKey = String(instance.apiKey || saved?.apiKey || "").trim();
  return Boolean(effectiveUrl && effectiveKey && effectiveKey !== SECRET_MASK);
};
var generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};
var createEmptyArrInstance = (type, isDefault = false) => ({
  id: generateId(),
  type,
  name: type === "radarr" ? "Radarr" : "Sonarr",
  url: "",
  externalUrl: "",
  apiKey: "",
  enabled: true,
  isDefault,
  plexLibraryIds: []
});
var ArrInstancesPanel = ({
  type,
  title,
  subtitle,
  instances,
  savedInstances,
  libraries = [],
  allInstances = [],
  onChange,
  onMessage,
  className = ""
}) => {
  const libraryType = type === "radarr" ? "movie" : "show";
  const availableLibraries = libraries.filter((entry) => String(entry.type || "").toLowerCase() === libraryType);
  const librariesAssignedElsewhere = (instanceId) => {
    const assigned = /* @__PURE__ */ new Set();
    allInstances.filter((entry) => entry.id !== instanceId && entry.type === type).forEach((entry) => {
      (entry.plexLibraryIds || []).forEach((libraryId) => assigned.add(String(libraryId)));
    });
    return assigned;
  };
  const toggleLibrary = (instanceId, libraryId) => {
    const instance = instances.find((entry) => entry.id === instanceId);
    if (!instance) return;
    const current = new Set((instance.plexLibraryIds || []).map((entry) => String(entry)));
    if (current.has(libraryId)) current.delete(libraryId);
    else current.add(libraryId);
    updateInstance(instanceId, { plexLibraryIds: Array.from(current) });
  };
  const updateInstance = (id, patch) => {
    onChange(instances.map((entry) => entry.id === id ? { ...entry, ...patch } : entry));
  };
  const removeInstance = (id) => {
    const next = instances.filter((entry) => entry.id !== id);
    if (next.length > 0 && !next.some((entry) => entry.isDefault)) {
      next[0] = { ...next[0], isDefault: true };
    }
    onChange(next);
  };
  const setDefault = (id) => {
    onChange(instances.map((entry) => ({ ...entry, isDefault: entry.id === id })));
  };
  const addInstance = () => {
    onChange([
      ...instances,
      createEmptyArrInstance(type, instances.length === 0)
    ]);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-start justify-between gap-4 mb-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { className: "text-lg font-bold text-plex", children: title }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "text-sm text-muted mt-1", children: subtitle })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
        "button",
        {
          type: "button",
          onClick: addInstance,
          className: "px-3 py-2 rounded-lg border border-border text-sm font-medium text-text hover:bg-white/5 transition-colors flex items-center gap-2 shrink-0",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Plus, { className: "w-4 h-4" }),
            "Add Instance"
          ]
        }
      )
    ] }),
    instances.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "rounded-xl border border-dashed border-border p-6 text-sm text-muted text-center", children: [
      "No ",
      type === "radarr" ? "Radarr" : "Sonarr",
      " instances configured."
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "space-y-4", children: instances.map((instance, index) => {
      const saved = savedInstances.find((entry) => entry.id === instance.id);
      const testPayload = type === "sonarr" ? { sonarrUrl: instance.url, sonarrApiKey: instance.apiKey, instanceId: instance.id } : { radarrUrl: instance.url, radarrApiKey: instance.apiKey, instanceId: instance.id };
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "rounded-xl border border-border bg-background/40 p-4 space-y-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center gap-2 min-w-0", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "text-xs uppercase tracking-wider font-bold text-muted", children: [
              "Instance ",
              index + 1
            ] }),
            instance.isDefault && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-[10px] uppercase tracking-wider font-bold text-plex bg-plex/10 px-2 py-0.5 rounded-full", children: "Default" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center gap-2 shrink-0", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              SettingsSwitch,
              {
                checked: instance.enabled !== false,
                onChange: (enabled) => updateInstance(instance.id, { enabled }),
                className: "!ml-0"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "button",
              {
                type: "button",
                title: instance.isDefault ? "Default instance" : "Set as default",
                onClick: () => setDefault(instance.id),
                className: `p-2 rounded-lg transition-colors ${instance.isDefault ? "text-plex bg-plex/10" : "text-muted hover:text-text hover:bg-white/5"}`,
                children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Star, { className: `w-4 h-4 ${instance.isDefault ? "fill-current" : ""}` })
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "button",
              {
                type: "button",
                title: "Remove instance",
                onClick: () => removeInstance(instance.id),
                className: "p-2 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors",
                children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Trash2, { className: "w-4 h-4" })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: "text-xs text-muted uppercase tracking-wider font-bold mb-1 block", children: "Display Name" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "input",
            {
              className: "w-full p-2.5 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all text-sm",
              type: "text",
              value: instance.name,
              onChange: (e) => updateInstance(instance.id, { name: e.target.value }),
              placeholder: type === "radarr" ? "Radarr" : "Sonarr"
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: "text-xs text-muted uppercase tracking-wider font-bold mb-1 block", children: "URL" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "input",
            {
              className: "w-full p-2.5 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all text-sm",
              type: "text",
              value: instance.url,
              onChange: (e) => updateInstance(instance.id, { url: e.target.value }),
              placeholder: type === "radarr" ? "http://localhost:7878" : "http://localhost:8989"
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "text-xs text-muted uppercase tracking-wider font-bold mb-1 flex items-center gap-2", children: [
            "External URL ",
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-[10px] font-normal normal-case text-muted/70", children: "(Optional, for UI links)" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "input",
            {
              className: "w-full p-2.5 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all text-sm",
              type: "text",
              value: instance.externalUrl || "",
              onChange: (e) => updateInstance(instance.id, { externalUrl: e.target.value }),
              placeholder: type === "radarr" ? "https://radarr.yourdomain.com" : "https://sonarr.yourdomain.com"
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: "text-xs text-muted uppercase tracking-wider font-bold mb-1 block", children: "API Key" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "input",
            {
              className: "w-full p-2.5 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all text-sm",
              type: "password",
              value: instance.apiKey,
              onChange: (e) => updateInstance(instance.id, { apiKey: e.target.value }),
              placeholder: "API key"
            }
          )
        ] }),
        availableLibraries.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: "text-xs text-muted uppercase tracking-wider font-bold mb-1 block", children: "Plex Libraries" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "text-[11px] text-muted mb-2", children: "Map libraries to this instance for maintenance routing. Unmapped libraries use the default instance." }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "flex flex-wrap gap-2", children: availableLibraries.map((library) => {
            const libraryId = String(library.id);
            const selected = (instance.plexLibraryIds || []).includes(libraryId);
            const takenElsewhere = librariesAssignedElsewhere(instance.id).has(libraryId);
            return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "button",
              {
                type: "button",
                disabled: takenElsewhere && !selected,
                title: takenElsewhere && !selected ? "Assigned to another instance" : library.title,
                onClick: () => toggleLibrary(instance.id, libraryId),
                className: `px-2.5 py-1 rounded-md text-xs border transition-colors ${selected ? "bg-plex/15 border-plex/40 text-plex" : takenElsewhere ? "bg-background/20 border-border text-muted/50 cursor-not-allowed" : "bg-background/30 border-border text-text hover:border-plex/40"}`,
                children: library.title
              },
              `${instance.id}-${libraryId}`
            );
          }) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          IntegrationTestButton,
          {
            type,
            payload: testPayload,
            disabled: !hasCredentials(instance, saved),
            onMessage
          }
        )
      ] }, instance.id);
    }) })
  ] });
};

// client/shared/dashboardLayout.ts
var DASHBOARD_SECTION_LABELS = {
  wrapUp: "Personal Wrap-Up",
  mainGrid: "Main dashboard grid",
  pendingRequests: "Pending Requests",
  watchRow: "Recently / Most Watched",
  recentlyAdded: "Recently Added rows"
};
var MAIN_GRID_WIDGET_META = {
  adminBadge: { label: "Server Admin badge", column: "left", adminOnly: true },
  quickActions: { label: "Quick Actions", column: "left", adminOnly: true },
  accessStatus: { label: "Access status & expiry", column: "left", userOnly: true },
  tempAccessSetup: { label: "Temp access setup spinner", column: "left", userOnly: true },
  announcement: { label: "Announcement banner", column: "left" },
  referral: { label: "Invite Friends / referral", column: "left", userOnly: true },
  newsletterPrefs: { label: "Newsletter preferences", column: "left", userOnly: true },
  support: { label: "Need Help / contact", column: "left", userOnly: true },
  libraryStats: { label: "Server Library Size", column: "right" },
  analytics: { label: "Your Analytics", column: "right" }
};
var DEFAULT_DASHBOARD_LAYOUT = {
  version: 1,
  sections: ["wrapUp", "mainGrid", "pendingRequests", "watchRow", "recentlyAdded"],
  mainGridOrder: [
    "adminBadge",
    "quickActions",
    "accessStatus",
    "announcement",
    "referral",
    "newsletterPrefs",
    "support",
    "libraryStats",
    "analytics"
  ],
  recentlyAddedOrder: ["recentMovies", "recentShows", "recentMusic"],
  hiddenSections: [],
  hiddenWidgets: [],
  recentHistoryRows: 7,
  topWatchedRows: 2
};
var ALL_SECTIONS = ["wrapUp", "mainGrid", "pendingRequests", "watchRow", "recentlyAdded"];
var ALL_MAIN_GRID = Object.keys(MAIN_GRID_WIDGET_META);
var ALL_RECENTLY_ADDED = ["recentMovies", "recentShows", "recentMusic"];
var uniqueValid = (values, allowed, fallback) => {
  if (!Array.isArray(values)) return [...fallback];
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  values.forEach((value) => {
    if (typeof value !== "string") return;
    const id = value;
    if (!allowed.includes(id) || seen.has(id)) return;
    seen.add(id);
    result.push(id);
  });
  allowed.forEach((id) => {
    if (!seen.has(id)) result.push(id);
  });
  return result;
};
var migrateDashboardSections = (sections) => {
  const next = sections.filter((id, index) => id !== "pendingRequests" || sections.indexOf("pendingRequests") === index);
  if (next.includes("pendingRequests")) return next;
  const mainGridIndex = next.indexOf("mainGrid");
  if (mainGridIndex >= 0) {
    next.splice(mainGridIndex + 1, 0, "pendingRequests");
    return next;
  }
  return [...next, "pendingRequests"];
};
var normalizeDashboardLayout = (raw) => {
  const input = raw && typeof raw === "object" ? raw : {};
  return {
    version: 1,
    sections: migrateDashboardSections(uniqueValid(input.sections, ALL_SECTIONS, DEFAULT_DASHBOARD_LAYOUT.sections)),
    mainGridOrder: uniqueValid(input.mainGridOrder, ALL_MAIN_GRID, DEFAULT_DASHBOARD_LAYOUT.mainGridOrder),
    recentlyAddedOrder: uniqueValid(input.recentlyAddedOrder, ALL_RECENTLY_ADDED, DEFAULT_DASHBOARD_LAYOUT.recentlyAddedOrder),
    hiddenSections: uniqueValid(input.hiddenSections, ALL_SECTIONS, []),
    hiddenWidgets: uniqueValid(
      input.hiddenWidgets,
      [...ALL_MAIN_GRID, ...ALL_RECENTLY_ADDED],
      []
    ),
    recentHistoryRows: typeof input.recentHistoryRows === "number" ? input.recentHistoryRows : DEFAULT_DASHBOARD_LAYOUT.recentHistoryRows,
    topWatchedRows: typeof input.topWatchedRows === "number" ? input.topWatchedRows : DEFAULT_DASHBOARD_LAYOUT.topWatchedRows
  };
};
var isMainGridWidgetAvailable = (id, ctx) => {
  const meta = MAIN_GRID_WIDGET_META[id];
  if (meta.adminOnly && !ctx.isAdmin) return false;
  if (meta.userOnly && ctx.isAdmin) return false;
  if (id === "referral" && !ctx.referralEnabled) return false;
  if (id === "tempAccessSetup" && (ctx.isAdmin || ctx.hasUser)) return false;
  if (id === "accessStatus" && (ctx.isAdmin || !ctx.hasUser)) return false;
  if (id === "adminBadge" && !ctx.isAdmin) return false;
  if (id === "quickActions" && !ctx.isAdmin) return false;
  if (id === "analytics") {
    const isJellyfin = String(ctx.mediaServerType || "").toLowerCase() === "jellyfin";
    if (!isJellyfin) return false;
  }
  return true;
};
var resolveMainGridWidgets = (layout, ctx) => layout.mainGridOrder.filter(
  (id) => !layout.hiddenWidgets.includes(id) && isMainGridWidgetAvailable(id, ctx)
);
var splitMainGridForDesktop = (widgets) => ({
  left: widgets.filter((id) => MAIN_GRID_WIDGET_META[id].column === "left"),
  right: widgets.filter((id) => MAIN_GRID_WIDGET_META[id].column === "right")
});
var resolveRecentlyAddedWidgets = (layout) => layout.recentlyAddedOrder.filter((id) => !layout.hiddenWidgets.includes(id));
var isDashboardSectionAvailable = (id, ctx) => {
  if (id === "pendingRequests") return !!ctx.isAdmin && !!ctx.requestsQueueEnabled;
  return true;
};
var resolveDashboardSections = (layout, ctx) => layout.sections.filter(
  (id) => !layout.hiddenSections.includes(id) && (!ctx || isDashboardSectionAvailable(id, ctx))
);
var lockWidgetLayout = (layout) => ({
  ...layout,
  mainGridOrder: [...DEFAULT_DASHBOARD_LAYOUT.mainGridOrder],
  recentlyAddedOrder: [...DEFAULT_DASHBOARD_LAYOUT.recentlyAddedOrder],
  hiddenWidgets: []
});
var normalizeSectionLayout = (raw) => {
  const normalized = lockWidgetLayout(normalizeDashboardLayout(raw));
  const input = raw && typeof raw === "object" ? raw : null;
  if (!input || !Array.isArray(input.hiddenSections)) {
    return { ...normalized, hiddenSections: [] };
  }
  if (normalized.hiddenSections.length >= ALL_SECTIONS.length) {
    return { ...normalized, hiddenSections: [] };
  }
  return normalized;
};
var SECTION_PREVIEW_META = {
  wrapUp: {
    shortLabel: "Wrap-Up",
    description: "Personal stats cards",
    previewClass: "h-14"
  },
  mainGrid: {
    shortLabel: "Main grid",
    description: "Admin/actions left \xB7 library stats right",
    previewClass: "h-20"
  },
  pendingRequests: {
    shortLabel: "Pending requests",
    description: "Approve media requests from home (admin)",
    previewClass: "h-12"
  },
  watchRow: {
    shortLabel: "Watch history",
    description: "Recently watched & most watched",
    previewClass: "h-16"
  },
  recentlyAdded: {
    shortLabel: "Recently added",
    description: "Movies, shows & music rows",
    previewClass: "h-12"
  }
};

export {
  appConfirm,
  bindAppConfirm,
  IntegrationTestButton,
  createEmptyArrInstance,
  ArrInstancesPanel,
  DASHBOARD_SECTION_LABELS,
  DEFAULT_DASHBOARD_LAYOUT,
  resolveMainGridWidgets,
  splitMainGridForDesktop,
  resolveRecentlyAddedWidgets,
  resolveDashboardSections,
  lockWidgetLayout,
  normalizeSectionLayout,
  SECTION_PREVIEW_META
};
