import {
  DiscoverPosterCard,
  UPGRADER_GRID_SIZE_OPTIONS,
  UPGRADER_GRID_SIZE_STORAGE_KEY,
  normalizeUpgraderGridSize,
  upgraderPosterGridClass,
  upgraderPosterGridStyle
} from "./chunk-C7RS3H3W.js";
import {
  UPGRADER_CODEC_OPTIONS,
  UPGRADER_FEATURE_OPTIONS,
  UPGRADER_QUALITY_OPTIONS,
  UPGRADER_RESOLUTION_OPTIONS
} from "./chunk-3BEYC6OD.js";
import "./chunk-DHMEH53D.js";
import "./chunk-IVCNLRDO.js";
import {
  ArrowUpFromLine,
  Ban,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleArrowUp,
  CircleCheck,
  CircleCheckBig,
  CircleX,
  ClipboardPaste,
  Clock,
  CodeXml,
  CustomSelect,
  Download,
  ExternalLink,
  Funnel,
  History,
  Layers,
  Loader,
  LoaderCircle,
  OverlayCheckbox,
  PenLine,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Settings2,
  ToastContainer,
  Trash2,
  TriangleAlert,
  X,
  __toESM,
  apiFetch,
  portalUrl,
  pushToast,
  require_jsx_runtime,
  require_react,
  resolvePortalAssetUrl
} from "./chunk-A5P6542F.js";

// client/upgrader/UpgraderDashboard.tsx
var import_react10 = __toESM(require_react(), 1);

// client/upgrader/UpgraderUpgradeModal.tsx
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var UpgraderUpgradeModal = ({
  isOpen,
  items,
  onClose,
  onCompleted,
  addToast
}) => {
  const [loadingPreview, setLoadingPreview] = (0, import_react.useState)(false);
  const [running, setRunning] = (0, import_react.useState)(false);
  const [preview, setPreview] = (0, import_react.useState)(null);
  const [triggerSearch, setTriggerSearch] = (0, import_react.useState)(true);
  (0, import_react.useEffect)(() => {
    if (!isOpen || !items.length) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    setLoadingPreview(true);
    apiFetch("/api/upgrader/preview", {
      method: "POST",
      body: JSON.stringify({ ratingKeys: items.map((item) => item.ratingKey) })
    }).then((data) => {
      if (!cancelled) setPreview(data);
    }).catch((e) => {
      if (!cancelled) addToast(e.message || "Failed to load preview", "error");
    }).finally(() => {
      if (!cancelled) setLoadingPreview(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, items, addToast]);
  if (!isOpen) return null;
  const handleConfirm = async () => {
    setRunning(true);
    try {
      const result = await apiFetch("/api/upgrader/upgrade", {
        method: "POST",
        body: JSON.stringify({
          ratingKeys: items.map((item) => item.ratingKey),
          triggerSearch
        })
      });
      const succeeded = Number(result?.totals?.succeeded || 0);
      const failed = Number(result?.totals?.failed || 0);
      if (succeeded > 0) {
        addToast(`Upgrade started for ${succeeded} title${succeeded === 1 ? "" : "s"}.`, "success");
      }
      if (failed > 0) {
        addToast(`${failed} title${failed === 1 ? "" : "s"} could not be upgraded.`, "error");
      }
      onCompleted();
      onClose();
    } catch (e) {
      addToast(e.message || "Upgrade failed", "error");
    } finally {
      setRunning(false);
    }
  };
  const actionable = (preview?.results || []).filter((entry) => entry.success);
  const blocked = (preview?.results || []).filter((entry) => !entry.success);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-black/80 backdrop-blur-sm", onClick: onClose }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl flex flex-col", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-center justify-between px-5 py-4 border-b border-border/60", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: "text-lg font-bold text-text", children: "Upgrade to HEVC" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-xs text-muted mt-1", children: "Changes ARR quality profiles and optionally triggers a search. You still pick releases in ARR." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: onClose, className: "p-2 rounded-full hover:bg-white/10 text-muted hover:text-text", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-4 h-4" }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar", children: [
        loadingPreview ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-center justify-center gap-2 py-10 text-muted", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-5 h-5 animate-spin" }),
          "Building preview\u2026"
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          actionable.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "space-y-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "text-xs font-bold uppercase tracking-wide text-green-300", children: [
              "Ready (",
              actionable.length,
              ")"
            ] }),
            actionable.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2 text-sm", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "font-semibold text-text", children: entry.title }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "text-xs text-muted mt-1", children: [
                entry.arrInstanceName,
                " \xB7 ",
                entry.currentProfileName || "Unknown profile",
                " \u2192 ",
                entry.targetProfileName || `Profile ${entry.targetProfileId}`
              ] })
            ] }, entry.ratingKey))
          ] }),
          blocked.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "space-y-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "text-xs font-bold uppercase tracking-wide text-amber-300", children: [
              "Skipped (",
              blocked.length,
              ")"
            ] }),
            blocked.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "font-semibold text-text", children: entry.title || entry.ratingKey }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "text-xs text-amber-100 mt-1", children: entry.reason || "Cannot upgrade" })
            ] }, entry.ratingKey))
          ] }),
          !actionable.length && !blocked.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "text-sm text-muted text-center py-8", children: "No preview results." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "flex items-start gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-3 cursor-pointer", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: triggerSearch,
              onChange: (e) => setTriggerSearch(e.target.checked),
              className: "mt-1"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "text-sm", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "font-semibold text-text block", children: "Trigger ARR search after profile change" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "text-xs text-muted", children: "Recommended. ARR will search for better releases using the new profile." })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-100", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "w-4 h-4 shrink-0 mt-0.5" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "This updates Sonarr/Radarr settings for selected titles. Review the preview carefully before confirming." })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-center justify-end gap-3 px-5 py-4 border-t border-border/60", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "px-4 py-2 rounded-lg border border-border text-sm font-semibold", onClick: onClose, children: "Cancel" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "button",
          {
            type: "button",
            disabled: running || loadingPreview || actionable.length === 0,
            className: "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-plex text-background text-sm font-bold disabled:opacity-50",
            onClick: handleConfirm,
            children: [
              running ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, { className: "w-4 h-4" }),
              running ? "Upgrading\u2026" : `Confirm ${actionable.length || items.length} upgrade${actionable.length === 1 ? "" : "s"}`
            ]
          }
        )
      ] })
    ] })
  ] });
};

// client/upgrader/UpgraderShowDrawer.tsx
var import_react2 = __toESM(require_react(), 1);
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
var formatSeasonLabel = (seasonNumber) => {
  if (seasonNumber < 0) return "Specials";
  if (seasonNumber === 0) return "Season 0";
  return `Season ${seasonNumber}`;
};
var EpisodeQualityBadges = ({ tags, isHevc, codec, sizeGB }) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex flex-wrap gap-2 items-center", children: [
  sizeGB ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-xs font-bold px-2 py-1 rounded-md bg-blue-500/20 text-blue-200 border border-blue-500/30", children: sizeGB < 1 ? `${Math.round(sizeGB * 1024)} MB` : `${sizeGB.toFixed(2)} GB` }) : null,
  codec ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-xs font-bold px-2 py-1 rounded-md bg-plex/20 text-plex border border-plex/30", children: codec.match(/^(h|x)26[45]$/i) ? codec.toLowerCase() : codec.toUpperCase() }) : null,
  (tags || []).slice(0, 4).map((tag) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-xs font-bold px-2 py-1 rounded-md bg-white/10 text-text border border-white/10 shadow-sm", children: tag }, tag)),
  isHevc && !(tags || []).includes("HEVC") && (!codec || !codec.toLowerCase().includes("hevc")) && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-xs font-bold px-2 py-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30", children: "HEVC" })
] });
var UpgraderShowDrawer = ({
  show,
  codecs,
  resolutions,
  features,
  qualities,
  onClose,
  addToast,
  automationReady = false,
  onProfileChanged,
  position = "sidebar"
}) => {
  const [loading, setLoading] = (0, import_react2.useState)(false);
  const [detail, setDetail] = (0, import_react2.useState)(null);
  const [expandedSeasons, setExpandedSeasons] = (0, import_react2.useState)(/* @__PURE__ */ new Set());
  const [searchingKey, setSearchingKey] = (0, import_react2.useState)(null);
  const [highlightFilterOnly, setHighlightFilterOnly] = (0, import_react2.useState)(false);
  const [profileInstance, setProfileInstance] = (0, import_react2.useState)(null);
  const [profilesLoading, setProfilesLoading] = (0, import_react2.useState)(false);
  const [selectedProfileId, setSelectedProfileId] = (0, import_react2.useState)("");
  const [triggerSearchOnApply, setTriggerSearchOnApply] = (0, import_react2.useState)(true);
  const [applyingProfile, setApplyingProfile] = (0, import_react2.useState)(false);
  const codecsArr = highlightFilterOnly ? codecs : [];
  const resolutionsArr = highlightFilterOnly ? resolutions : [];
  const featuresArr = highlightFilterOnly ? features : [];
  const qualitiesArr = highlightFilterOnly ? qualities : [];
  const loadDetail = (0, import_react2.useCallback)(async () => {
    if (!show) return;
    setLoading(true);
    try {
      const data = await apiFetch(
        `/api/upgrader/items/${encodeURIComponent(show.ratingKey)}/detail?codecs=${encodeURIComponent(codecsArr.join(","))}&resolutions=${encodeURIComponent(resolutionsArr.join(","))}&features=${encodeURIComponent(featuresArr.join(","))}&qualities=${encodeURIComponent(qualitiesArr.join(","))}`
      );
      setDetail(data);
      const seasons = Array.isArray(data?.seasons) ? data.seasons : [];
      const latestSeason = seasons.reduce((max, s) => Math.max(max, s.seasonNumber ?? -1), -1);
      const defaultExpanded = /* @__PURE__ */ new Set();
      if (codecsArr.length > 0 || resolutionsArr.length > 0 || featuresArr.length > 0 || qualitiesArr.length > 0) {
        seasons.filter((season) => (season.matchedCount ?? 0) > 0).slice(0, 2).forEach((season) => defaultExpanded.add(season.seasonNumber));
      }
      setExpandedSeasons(defaultExpanded);
    } catch (e) {
      setDetail(null);
      addToast?.(e?.message || "Failed to load show detail", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast, show, codecsArr.join(","), resolutionsArr.join(","), featuresArr.join(","), qualitiesArr.join(",")]);
  (0, import_react2.useEffect)(() => {
    if (!show) {
      setDetail(null);
      setExpandedSeasons(/* @__PURE__ */ new Set());
      setHighlightFilterOnly(false);
      setProfileInstance(null);
      setSelectedProfileId("");
      return;
    }
    loadDetail();
  }, [loadDetail, show]);
  (0, import_react2.useEffect)(() => {
    const instanceId = detail?.arr?.instanceId;
    if (!instanceId || !automationReady) {
      setProfileInstance(null);
      return;
    }
    let cancelled = false;
    setProfilesLoading(true);
    apiFetch("/api/upgrader/profiles").then((data) => {
      if (cancelled) return;
      const instances = Array.isArray(data?.instances) ? data.instances : [];
      const match = instances.find((entry) => entry.id === instanceId) || null;
      setProfileInstance(match);
    }).catch(() => {
      if (!cancelled) setProfileInstance(null);
    }).finally(() => {
      if (!cancelled) setProfilesLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [automationReady, detail?.arr?.instanceId]);
  (0, import_react2.useEffect)(() => {
    const arr2 = detail?.arr;
    if (!arr2) return;
    const preferred = arr2.targetProfileId && arr2.targetProfileId !== arr2.currentProfileId ? arr2.targetProfileId : arr2.currentProfileId;
    if (preferred) setSelectedProfileId(String(preferred));
  }, [detail?.arr?.currentProfileId, detail?.arr?.targetProfileId, detail?.arr?.instanceId]);
  const triggerSearch = async (scope, episodeIds, label) => {
    if (!show) return;
    const key = scope === "episode" && episodeIds?.length ? `ep-${episodeIds.join(",")}` : "series";
    setSearchingKey(key);
    try {
      await apiFetch("/api/upgrader/search", {
        method: "POST",
        body: JSON.stringify({
          ratingKey: show.ratingKey,
          scope,
          episodeIds
        })
      });
      addToast?.(label || (scope === "series" ? "Series search triggered." : "Episode search triggered."), "success");
    } catch (e) {
      addToast?.(e?.message || "Search failed", "error");
    } finally {
      setSearchingKey(null);
    }
  };
  const toggleSeason = (seasonNumber) => {
    setExpandedSeasons((prev) => {
      const next = new Set(prev);
      if (next.has(seasonNumber)) next.delete(seasonNumber);
      else next.add(seasonNumber);
      return next;
    });
  };
  const profileOptions = (0, import_react2.useMemo)(
    () => (profileInstance?.profiles || []).map((profile) => ({
      value: String(profile.id),
      label: profile.name
    })),
    [profileInstance?.profiles]
  );
  const currentProfileId = detail?.arr?.currentProfileId ?? null;
  const selectedProfileNumeric = Number(selectedProfileId || 0);
  const profileUnchanged = currentProfileId != null && selectedProfileNumeric === currentProfileId;
  const canApplyProfile = automationReady && detail?.arr?.mapped && selectedProfileNumeric > 0 && !profileUnchanged && !applyingProfile;
  const applyProfile = async () => {
    if (!show || !canApplyProfile) return;
    setApplyingProfile(true);
    try {
      const result = await apiFetch("/api/upgrader/upgrade", {
        method: "POST",
        body: JSON.stringify({
          ratingKeys: [show.ratingKey],
          qualityProfileId: selectedProfileNumeric,
          profileChangeOnly: true,
          triggerSearch: triggerSearchOnApply
        })
      });
      const entry = (result?.results || [])[0];
      if (entry?.skipped) {
        addToast?.(entry.reason || "Already on this profile.", "success");
      } else if (entry?.success) {
        const from = entry.currentProfileName || "current";
        const to = entry.targetProfileName || `profile ${selectedProfileNumeric}`;
        addToast?.(`Quality profile updated: ${from} \u2192 ${to}`, "success");
        await loadDetail();
        onProfileChanged?.();
      } else {
        addToast?.(entry?.reason || "Profile change failed", "error");
      }
    } catch (e) {
      addToast?.(e?.message || "Profile change failed", "error");
    } finally {
      setApplyingProfile(false);
    }
  };
  const displaySeasons = (0, import_react2.useMemo)(() => {
    if (!detail?.seasons) return [];
    const sortedSeasons = [...detail.seasons].sort((a, b) => b.seasonNumber - a.seasonNumber);
    if (highlightFilterOnly) {
      return sortedSeasons.map((season) => ({
        ...season,
        episodes: season.episodes.filter((episode) => episode.matchesPreset !== false)
      })).filter((season) => season.episodes.length > 0);
    }
    return sortedSeasons;
  }, [detail?.seasons, highlightFilterOnly]);
  const episodeSourceLabel = () => "Sonarr";
  if (!show) return null;
  const arr = detail?.arr;
  const showMeta = detail?.show || show;
  const detailReady = !loading && !!detail;
  const canSearch = !!arr?.seriesId;
  const canChangeProfile = automationReady && !!arr?.instanceId;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: `fixed inset-0 z-[60] flex ${position === "modal" ? "items-center justify-center p-0 sm:p-6 md:p-12" : "justify-end"}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "absolute inset-0 bg-black/70 backdrop-blur-sm", onClick: onClose }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: `relative w-full max-w-5xl bg-card border-border/80 shadow-2xl flex flex-col ${position === "modal" ? "h-full sm:h-[90vh] rounded-none sm:rounded-2xl border-none sm:border overflow-hidden mx-auto" : "h-full border-l"}`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "px-4 sm:px-5 py-4 border-b border-border/60 space-y-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", onClick: onClose, className: "inline-flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-lg hover:bg-white/10 text-muted hover:text-text text-sm font-bold transition-colors", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ChevronLeft, { className: "w-4 h-4" }),
          "Back to Filter"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-start gap-4", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "w-16 h-24 rounded-lg overflow-hidden bg-white/5 shrink-0 border border-white/10", children: showMeta.thumbUrl ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "img",
            {
              src: resolvePortalAssetUrl(showMeta.thumbUrl),
              alt: showMeta.title,
              className: "w-full h-full object-cover"
            }
          ) : null }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "flex items-start justify-between gap-3", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { className: "text-lg font-bold text-text", children: showMeta.title }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "text-xs text-muted mt-1", children: [
                showMeta.libraryTitle,
                showMeta.year ? ` \xB7 ${showMeta.year}` : "",
                detail?.stats ? ` \xB7 ${detail.stats.total} episodes` : ""
              ] })
            ] }) }),
            detailReady && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mt-2 flex flex-wrap gap-2 text-[11px]", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "px-2 py-1 rounded-full bg-plex/15 border border-plex/30 text-plex font-semibold", children: arr?.instanceName || showMeta.libraryTitle }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "px-2 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-200 font-semibold", children: [
                episodeSourceLabel(),
                " episodes"
              ] }),
              arr?.currentProfileName && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "px-2 py-1 rounded-full bg-white/5 border border-white/10 text-muted", children: [
                "Current: ",
                arr.currentProfileName
              ] })
            ] }),
            loading && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "text-[11px] text-muted mt-2", children: "Loading episodes from Sonarr\u2026" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex flex-wrap gap-2", children: [
          arr?.deepUrl && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
            "a",
            {
              href: arr.deepUrl,
              target: "_blank",
              rel: "noreferrer",
              className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-bold text-plex no-underline hover:border-plex/40",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ExternalLink, { className: "w-3.5 h-3.5" }),
                "Open in Sonarr"
              ]
            }
          ),
          canSearch && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
            "button",
            {
              type: "button",
              disabled: searchingKey === "series",
              onClick: () => triggerSearch("series", void 0, `Series search started for \u201C${showMeta.title}\u201D.`),
              className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-bold text-text hover:border-plex/40 disabled:opacity-50",
              children: [
                searchingKey === "series" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(LoaderCircle, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Search, { className: "w-3.5 h-3.5" }),
                "Series search"
              ]
            }
          )
        ] }),
        canChangeProfile && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "rounded-xl border border-border/60 bg-background/40 p-3 space-y-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "text-xs font-bold text-text", children: "Sonarr quality profile" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "text-[11px] text-muted mt-0.5", children: "Pick any profile for this series \u2014 not limited to your HEVC default." })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex flex-col sm:flex-row gap-2 sm:items-end", children: [
            profilesLoading ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center gap-2 text-xs text-muted py-2", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(LoaderCircle, { className: "w-4 h-4 animate-spin" }),
              "Loading profiles\u2026"
            ] }) : profileOptions.length ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              CustomSelect,
              {
                value: selectedProfileId,
                onChange: setSelectedProfileId,
                options: profileOptions,
                className: "flex-1 min-w-[200px]"
              }
            ) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "text-xs text-amber-200 py-2", children: "Could not load Sonarr quality profiles." }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
              "button",
              {
                type: "button",
                disabled: !canApplyProfile,
                onClick: applyProfile,
                className: "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-plex text-background text-xs font-bold hover:bg-plex-hover disabled:opacity-50 shrink-0",
                children: [
                  applyingProfile ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(LoaderCircle, { className: "w-3.5 h-3.5 animate-spin" }) : null,
                  applyingProfile ? "Applying\u2026" : "Apply profile"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "flex items-start gap-2 cursor-pointer", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                type: "checkbox",
                checked: triggerSearchOnApply,
                onChange: (e) => setTriggerSearchOnApply(e.target.checked),
                className: "mt-0.5 rounded border-border"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-[11px] text-muted", children: "Trigger series search after profile change" })
          ] }),
          arr?.targetProfileName && arr.targetProfileId && arr.targetProfileId !== arr.currentProfileId && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
            "button",
            {
              type: "button",
              className: "text-[11px] font-bold text-green-300 hover:underline",
              onClick: () => setSelectedProfileId(String(arr.targetProfileId)),
              children: [
                "Quick pick: ",
                arr.targetProfileName,
                " (Settings HEVC default)"
              ]
            }
          )
        ] }),
        detailReady && detail?.stats && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex flex-wrap items-center gap-3 text-[11px] text-muted", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
            detail.stats.total,
            " episode",
            detail.stats.total === 1 ? "" : "s",
            detail.stats.matched !== detail.stats.total ? ` \xB7 ${detail.stats.matched} match current filter` : ""
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "inline-flex items-center gap-2 cursor-pointer", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "input",
              {
                type: "checkbox",
                checked: highlightFilterOnly,
                onChange: (e) => setHighlightFilterOnly(e.target.checked),
                className: "rounded border-border"
              }
            ),
            "Show filter matches only"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "flex-1 overflow-y-auto px-4 sm:px-5 py-4 custom-scrollbar", children: loading ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center justify-center gap-2 py-16 text-muted", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(LoaderCircle, { className: "w-5 h-5 animate-spin" }),
        "Loading show detail\u2026"
      ] }) : !displaySeasons.length ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "text-sm text-muted text-center py-16", children: detailReady ? highlightFilterOnly ? "No episodes match the current browse filter." : "No episodes found for this show." : "Unable to load episode data." }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "space-y-3", children: displaySeasons.map((season) => {
        const expanded = expandedSeasons.has(season.seasonNumber);
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sm:rounded-xl sm:border border-y sm:border-x border-border/60 overflow-hidden bg-white/[0.01]", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              type: "button",
              onClick: () => toggleSeason(season.seasonNumber),
              className: "w-full flex items-center justify-between gap-3 px-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] text-left",
              children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center gap-2", children: [
                expanded ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ChevronDown, { className: "w-4 h-4 text-muted" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ChevronRight, { className: "w-4 h-4 text-muted" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-sm font-bold text-text", children: formatSeasonLabel(season.seasonNumber) }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "text-[11px] text-muted", children: [
                  season.episodes.length,
                  " ep",
                  season.episodes.length === 1 ? "" : "s",
                  highlightFilterOnly && season.matchedCount !== season.episodeCount ? ` \xB7 ${season.matchedCount} matched` : ""
                ] })
              ] })
            }
          ),
          expanded && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "divide-y divide-border/40", children: season.episodes.map((episode) => {
            const epLabel = episode.seasonNumber != null && episode.episodeNumber != null ? `S${String(episode.seasonNumber).padStart(2, "0")}E${String(episode.episodeNumber).padStart(2, "0")}` : null;
            const searchKey = episode.arrEpisodeId ? `ep-${episode.arrEpisodeId}` : null;
            const isSearching = searchKey != null && searchingKey === searchKey;
            return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
              "div",
              {
                className: `group flex flex-col sm:flex-row items-start gap-4 p-4 sm:p-5 hover:bg-white/[0.02] transition-colors border-b border-border/40 last:border-0 ${highlightFilterOnly ? "" : episode.matchesPreset === false ? "opacity-55" : ""}`,
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "w-full sm:w-48 aspect-video rounded-xl overflow-hidden bg-white/5 shrink-0 flex items-center justify-center relative shadow-lg group-hover:shadow-plex/10 transition-all duration-300", children: [
                    episode.thumbUrl || episode.thumb ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                      "img",
                      {
                        src: episode.thumbUrl ? resolvePortalAssetUrl(episode.thumbUrl) : portalUrl(`/api/plex/image?path=${encodeURIComponent(episode.thumb)}&width=384&height=216`),
                        alt: episode.title,
                        className: "w-full h-full object-cover bg-black/40",
                        onError: (e) => {
                          e.target.style.display = "none";
                        }
                      }
                    ) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-xs text-muted/40 font-medium", children: "No image" }),
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "min-w-0 flex-1 flex flex-col justify-center", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex flex-wrap items-center gap-3", children: [
                      epLabel && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-xs font-bold px-2 py-1 rounded-md bg-white/10 text-text shadow-sm", children: epLabel }),
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h4", { className: "text-base font-bold text-text truncate group-hover:text-plex transition-colors", children: episode.title }),
                      episode.airDateUtc && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-xs text-muted ml-auto shrink-0 font-medium", children: new Date(episode.airDateUtc).toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" }) })
                    ] }),
                    episode.overview && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "text-sm text-muted/90 mt-2 leading-relaxed", children: episode.overview }),
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mt-4 flex flex-wrap items-center gap-3", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(EpisodeQualityBadges, { tags: episode.displayTags || [], isHevc: episode.isHevc, codec: episode.videoCodec, sizeGB: episode.sizeGB }),
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "text-xs text-muted flex flex-wrap gap-x-3 gap-y-1.5 font-medium bg-black/30 px-3 py-1.5 rounded-lg border border-white/10 shadow-inner", children: [
                        episode.arrReleaseGroup && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-plex font-bold", children: episode.arrReleaseGroup }),
                        (episode.arrCustomFormats || []).map((cf) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-white/70", children: cf }, cf)),
                        !episode.arrReleaseGroup && !(episode.arrCustomFormats || []).length && episode.arrQualityLabel && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: episode.arrQualityLabel }),
                        episode.arrHasFile === false && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-amber-200", children: "Missing in Sonarr" })
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "flex flex-col justify-start shrink-0 sm:pl-2", children: canSearch && episode.arrEpisodeId && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
                    "button",
                    {
                      type: "button",
                      disabled: isSearching,
                      onClick: () => triggerSearch(
                        "episode",
                        [episode.arrEpisodeId],
                        `Episode search started for ${epLabel || episode.title}.`
                      ),
                      className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-plex/10 text-plex text-xs font-bold hover:bg-plex hover:text-black transition-colors disabled:opacity-50 border border-plex/20",
                      children: [
                        isSearching ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(LoaderCircle, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Search, { className: "w-3.5 h-3.5" }),
                        "Search"
                      ]
                    }
                  ) })
                ]
              },
              episode.ratingKey
            );
          }) })
        ] }, season.seasonNumber);
      }) }) })
    ] })
  ] });
};

// client/upgrader/UpgraderHistoryPanel.tsx
var import_react3 = __toESM(require_react(), 1);
var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
var actionLabel = (entry) => {
  switch (entry.action) {
    case "upgrade":
      return "Profile upgrade";
    case "profile_change":
      return "Profile change";
    case "series_search":
      return "Series search";
    case "episode_search":
      return "Episode search";
    case "movie_search":
      return "Movie search";
    default:
      if (entry.targetProfileId) return "Profile upgrade";
      if (entry.triggerSearch) return "Search";
      return "Action";
  }
};
var ActionIcon = ({ entry }) => {
  const failed = entry.success === false;
  if (failed) return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(CircleX, { className: "w-4 h-4 text-red-400 shrink-0" });
  if (entry.action?.includes("search") || entry.triggerSearch) return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Search, { className: "w-4 h-4 text-plex shrink-0" });
  if (entry.action === "upgrade" || entry.action === "profile_change" || entry.targetProfileId) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ArrowUpFromLine, { className: "w-4 h-4 text-green-400 shrink-0" });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(CircleCheck, { className: "w-4 h-4 text-green-400 shrink-0" });
};
var UpgraderHistoryPanel = () => {
  const [loading, setLoading] = (0, import_react3.useState)(true);
  const [entries, setEntries] = (0, import_react3.useState)([]);
  (0, import_react3.useEffect)(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch("/api/upgrader/audit?limit=100").then((data) => {
      if (!cancelled) setEntries(Array.isArray(data?.entries) ? data.entries : []);
    }).catch(() => {
      if (!cancelled) setEntries([]);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  if (loading) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex items-center justify-center gap-2 py-16 text-muted", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(LoaderCircle, { className: "w-5 h-5 animate-spin" }),
      "Loading upgrade history\u2026"
    ] });
  }
  const visible = entries.filter((entry) => !entry.dryRun);
  if (!visible.length) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rounded-2xl border border-border/60 bg-card/40 p-8 text-center", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "text-sm text-muted", children: "No upgrade or search actions recorded yet." }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rounded-2xl border border-border/60 bg-card/40 overflow-hidden", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "divide-y divide-border/50", children: visible.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "px-4 py-3", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex items-start gap-3", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ActionIcon, { entry }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "text-sm font-semibold text-text", children: entry.title || entry.ratingKey }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "text-[11px] text-muted", children: entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "text-xs text-muted mt-1 flex flex-wrap gap-x-2 gap-y-0.5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "font-semibold text-text/80", children: actionLabel(entry) }),
        entry.arrInstanceName && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: entry.arrInstanceName }),
        entry.currentProfileName && entry.targetProfileName && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
          entry.currentProfileName,
          " \u2192 ",
          entry.targetProfileName
        ] }),
        !entry.currentProfileName && entry.targetProfileName && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
          "\u2192 ",
          entry.targetProfileName
        ] }),
        !entry.currentProfileName && !entry.targetProfileName && entry.targetProfileId && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
          "profile ",
          entry.targetProfileId
        ] }),
        entry.episodeIds?.length ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
          entry.episodeIds.length,
          " episode",
          entry.episodeIds.length === 1 ? "" : "s"
        ] }) : null,
        entry.commandId ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
          "cmd ",
          entry.commandId
        ] }) : null,
        entry.actor?.username ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
          "by ",
          entry.actor.username
        ] }) : null
      ] }),
      entry.success === false && entry.reason && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "text-[11px] text-red-300 mt-1", children: entry.reason })
    ] })
  ] }) }, entry.id)) }) });
};

// client/upgrader/UpgraderExclusionsPanel.tsx
var import_react4 = __toESM(require_react(), 1);
var import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
var UpgraderExclusionsPanel = ({ addToast, onChanged }) => {
  const [loading, setLoading] = (0, import_react4.useState)(true);
  const [saving, setSaving] = (0, import_react4.useState)(false);
  const [prefs, setPrefs] = (0, import_react4.useState)(null);
  const [titleInput, setTitleInput] = (0, import_react4.useState)("");
  const loadPrefs = (0, import_react4.useCallback)(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/upgrader/preferences");
      setPrefs(data?.upgrader || { exclusions: { ratingKeys: [], episodeKeys: [], titles: [], libraries: [] }, snoozed: [] });
    } catch (e) {
      addToast(e.message || "Failed to load exclusions", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);
  (0, import_react4.useEffect)(() => {
    loadPrefs();
  }, [loadPrefs]);
  const savePrefs = async (next) => {
    setSaving(true);
    try {
      await apiFetch("/api/upgrader/preferences", {
        method: "POST",
        body: JSON.stringify({ upgrader: next })
      });
      setPrefs(next);
      onChanged?.();
      addToast("Upgrader exclusions updated.", "success");
    } catch (e) {
      addToast(e.message || "Failed to save exclusions", "error");
    } finally {
      setSaving(false);
    }
  };
  const unsnooze = async (ratingKey) => {
    try {
      await apiFetch("/api/upgrader/unsnooze", {
        method: "POST",
        body: JSON.stringify({ ratingKey })
      });
      await loadPrefs();
      onChanged?.();
    } catch (e) {
      addToast(e.message || "Failed to unsnooze item", "error");
    }
  };
  if (loading || !prefs) {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center justify-center gap-2 py-16 text-muted", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(LoaderCircle, { className: "w-5 h-5 animate-spin" }),
      "Loading exclusions\u2026"
    ] });
  }
  const activeSnoozed = (prefs.snoozed || []).filter((entry) => entry.until && Date.parse(entry.until) > Date.now());
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "space-y-6", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "rounded-2xl border border-border/60 bg-card/40 p-4 space-y-3", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { className: "text-sm font-bold text-text", children: "Snoozed titles" }),
      activeSnoozed.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-xs text-muted", children: "No snoozed titles. Snooze from the browse grid to hide items temporarily." }) : activeSnoozed.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center justify-between gap-3 py-2 border-b border-border/40 last:border-b-0", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "text-sm font-medium text-text", children: entry.ratingKey }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "text-[11px] text-muted", children: [
            "Until ",
            entry.until ? new Date(entry.until).toLocaleString() : "unknown"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "text-xs font-bold text-plex", onClick: () => unsnooze(entry.ratingKey), children: "Unsnooze" })
      ] }, entry.ratingKey))
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "rounded-2xl border border-border/60 bg-card/40 p-4 space-y-3", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { className: "text-sm font-bold text-text", children: "Excluded titles" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "input",
          {
            type: "text",
            value: titleInput,
            onChange: (e) => setTitleInput(e.target.value),
            placeholder: "Exact title to exclude\u2026",
            className: "flex-1 p-2 rounded border border-border bg-background text-text text-sm"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "button",
          {
            type: "button",
            disabled: saving || !titleInput.trim(),
            className: "px-3 py-2 rounded bg-plex text-background text-xs font-bold disabled:opacity-50",
            onClick: () => {
              const title = titleInput.trim();
              if (!title) return;
              const next = {
                ...prefs,
                exclusions: {
                  ...prefs.exclusions,
                  titles: [.../* @__PURE__ */ new Set([...prefs.exclusions.titles || [], title])]
                }
              };
              setTitleInput("");
              savePrefs(next);
            },
            children: "Add"
          }
        )
      ] }),
      (prefs.exclusions.titles || []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-xs text-muted", children: "No title exclusions. Cleaner exclusions also apply." }) : (prefs.exclusions.titles || []).map((title) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex items-center justify-between gap-3 py-2 border-b border-border/40 last:border-b-0", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "text-sm text-text", children: title }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "button",
          {
            type: "button",
            className: "text-xs font-bold text-red-300",
            onClick: () => savePrefs({
              ...prefs,
              exclusions: {
                ...prefs.exclusions,
                titles: (prefs.exclusions.titles || []).filter((entry) => entry !== title)
              }
            }),
            children: "Remove"
          }
        )
      ] }, title))
    ] })
  ] });
};

// client/upgrader/UpgraderProfilesTab.tsx
var import_react9 = __toESM(require_react(), 1);

// client/upgrader/UpgraderCustomFormatModal.tsx
var import_react7 = __toESM(require_react(), 1);

// client/upgrader/customFormatSpec.ts
var CF_INFO_LINK = "https://wiki.servarr.com/sonarr/settings#custom-formats-2";
var SONARR_RESOLUTION_OPTIONS = [
  { value: 0, name: "Unknown" },
  { value: 360, name: "R360p" },
  { value: 480, name: "R480p" },
  { value: 540, name: "R540p" },
  { value: 576, name: "R576p" },
  { value: 720, name: "R720p" },
  { value: 1080, name: "R1080p" },
  { value: 2160, name: "R2160p" }
];
var SONARR_SOURCE_OPTIONS = [
  { value: 0, name: "Unknown" },
  { value: 1, name: "Television" },
  { value: 2, name: "TelevisionRaw" },
  { value: 3, name: "Web" },
  { value: 4, name: "WebRip" },
  { value: 5, name: "DVD" },
  { value: 6, name: "Bluray" },
  { value: 7, name: "BlurayRaw" }
];
var SONARR_QUALITY_MODIFIER_OPTIONS = [
  { value: 0, name: "None" },
  { value: 1, name: "Regional" },
  { value: 2, name: "SCENE" },
  { value: 3, name: "WEBDL" },
  { value: 4, name: "WEBRIP" },
  { value: 5, name: "REMUX" }
];
var SONARR_RELEASE_TYPE_OPTIONS = [
  { value: 0, name: "Unknown" },
  { value: 1, name: "SingleEpisode" },
  { value: 2, name: "MultiEpisode" },
  { value: 3, name: "SeasonPack" },
  { value: 4, name: "SingleEpisodeSeasonPack" },
  { value: 5, name: "MultiEpisodeSeasonPack" }
];
var emptySimpleFormatState = () => ({
  specifications: []
});
var getSpecFieldValue = (spec, fieldName = "value") => {
  if (!spec?.fields) return void 0;
  if (Array.isArray(spec.fields)) {
    return spec.fields.find((f) => f?.name === fieldName)?.value;
  }
  if (typeof spec.fields === "object") {
    return spec.fields[fieldName];
  }
  return void 0;
};
var setSpecFieldValue = (spec, fieldName, value) => {
  if (Array.isArray(spec?.fields)) {
    const hasField = spec.fields.some((f) => f?.name === fieldName);
    return {
      ...spec,
      fields: hasField ? spec.fields.map((f) => f?.name === fieldName ? { ...f, value } : f) : [...spec.fields, { name: fieldName, label: fieldName, type: "textbox", value, order: spec.fields.length }]
    };
  }
  if (spec?.fields && typeof spec.fields === "object") {
    return { ...spec, fields: { ...spec.fields, [fieldName]: value } };
  }
  return {
    ...spec,
    fields: [{ name: fieldName, label: fieldName, type: "textbox", value, order: 0 }]
  };
};
var sourceLabel = (value) => SONARR_SOURCE_OPTIONS.find((o) => o.value === Number(value))?.name || `Source ${value}`;
var resolutionLabel = (value) => SONARR_RESOLUTION_OPTIONS.find((o) => o.value === Number(value))?.name || `${value}p`;
var escapeRegexLiteral = (text) => String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var buildReleaseGroupRegex = (groupName) => `(?<=^|[\\s.-])${escapeRegexLiteral(groupName)}\\b`;
var buildSelectField = (value, label, selectOptions) => [{
  order: 0,
  name: "value",
  label,
  value: Number(value),
  type: "select",
  advanced: false,
  selectOptions: selectOptions.map((o, i) => ({ ...o, order: o.value || i })),
  privacy: "normal",
  isFloat: false
}];
var buildTextField = (value, label = "Regular Expression", helpText = "Custom Format RegEx is Case Insensitive") => [{
  order: 0,
  name: "value",
  label,
  helpText,
  value,
  type: "textbox",
  advanced: false,
  privacy: "normal",
  isFloat: false
}];
var buildNumberField = (value, label, helpText) => [{
  order: 0,
  name: "value",
  label,
  helpText,
  value: Number(value),
  type: "number",
  advanced: false,
  privacy: "normal",
  isFloat: false
}];
var buildResolutionSpecification = (value, { required = true, negate = false } = {}) => ({
  name: resolutionLabel(value),
  implementation: "ResolutionSpecification",
  implementationName: "Resolution",
  infoLink: CF_INFO_LINK,
  negate,
  required,
  fields: buildSelectField(value, "Resolution", SONARR_RESOLUTION_OPTIONS)
});
var buildSourceSpecification = (value, { required = true, negate = false, name } = {}) => {
  const label = sourceLabel(value);
  return {
    name: name || (negate ? `Not ${label}` : label),
    implementation: "SourceSpecification",
    implementationName: "Source",
    infoLink: CF_INFO_LINK,
    negate,
    required,
    fields: buildSelectField(value, "Source", SONARR_SOURCE_OPTIONS)
  };
};
var buildReleaseGroupSpecification = (groupName, { required = false } = {}) => ({
  name: groupName,
  implementation: "ReleaseGroupSpecification",
  implementationName: "Release Group",
  infoLink: CF_INFO_LINK,
  negate: false,
  required,
  fields: buildTextField(buildReleaseGroupRegex(groupName))
});
var buildReleaseTitleSpecification = (pattern, { name, negate = false, required = true } = {}) => ({
  name: name || (negate ? `Exclude ${pattern}` : `Match ${pattern}`),
  implementation: "ReleaseTitleSpecification",
  implementationName: "Release Title",
  infoLink: CF_INFO_LINK,
  negate,
  required,
  fields: buildTextField(pattern, "Regular Expression")
});
var FALLBACK_SPEC_SCHEMA = [
  {
    implementation: "ReleaseTitleSpecification",
    implementationName: "Release Title",
    name: "Release Title",
    fields: buildTextField("")
  },
  {
    implementation: "ReleaseGroupSpecification",
    implementationName: "Release Group",
    name: "Release Group",
    fields: buildTextField("")
  },
  {
    implementation: "SourceSpecification",
    implementationName: "Source",
    name: "Source",
    fields: buildSelectField(3, "Source", SONARR_SOURCE_OPTIONS)
  },
  {
    implementation: "ResolutionSpecification",
    implementationName: "Resolution",
    name: "Resolution",
    fields: buildSelectField(1080, "Resolution", SONARR_RESOLUTION_OPTIONS)
  },
  {
    implementation: "QualityModifierSpecification",
    implementationName: "Quality Modifier",
    name: "Quality Modifier",
    fields: buildSelectField(0, "Quality Modifier", SONARR_QUALITY_MODIFIER_OPTIONS)
  },
  {
    implementation: "LanguageSpecification",
    implementationName: "Language",
    name: "Language",
    fields: buildNumberField(1, "Language", "Language ID (e.g. 1 = English)")
  },
  {
    implementation: "SizeSpecification",
    implementationName: "Size",
    name: "Size",
    fields: [
      { order: 0, name: "min", label: "Min Size (MB)", value: 0, type: "number", advanced: false, privacy: "normal", isFloat: false },
      { order: 1, name: "max", label: "Max Size (MB)", value: 0, type: "number", advanced: false, privacy: "normal", isFloat: false }
    ]
  },
  {
    implementation: "IndexerSpecification",
    implementationName: "Indexer",
    name: "Indexer",
    fields: buildNumberField(0, "Indexer", "Indexer ID from Prowlarr/Sonarr")
  },
  {
    implementation: "ReleaseTypeSpecification",
    implementationName: "Release Type",
    name: "Release Type",
    fields: buildSelectField(1, "Release Type", SONARR_RELEASE_TYPE_OPTIONS)
  },
  {
    implementation: "YearSpecification",
    implementationName: "Year",
    name: "Year",
    fields: buildNumberField(0, "Year")
  },
  {
    implementation: "MultiPartSpecification",
    implementationName: "Multi Part",
    name: "Multi Part",
    fields: buildNumberField(0, "Multi Part")
  },
  {
    implementation: "EditionSpecification",
    implementationName: "Edition",
    name: "Edition",
    fields: buildTextField("")
  },
  {
    implementation: "UntilQualitySpecification",
    implementationName: "Until Quality",
    name: "Until Quality",
    fields: buildNumberField(0, "Quality")
  },
  {
    implementation: "UntilScoreSpecification",
    implementationName: "Until Score",
    name: "Until Score",
    fields: buildNumberField(0, "Score")
  }
];
var findSchemaForSpec = (schema, spec) => {
  const impl = String(spec?.implementation || "");
  return schema.find((s) => s.implementation === impl) || null;
};
var normalizeSpecificationForEditor = (spec, schema) => {
  const base = {
    ...spec,
    infoLink: spec?.infoLink || schema?.infoLink || CF_INFO_LINK,
    implementationName: spec?.implementationName || schema?.implementationName || spec?.implementation
  };
  const fields = spec?.fields;
  if (Array.isArray(fields)) {
    return {
      ...base,
      fields: fields.map((f, i) => ({ ...f, order: f.order ?? i }))
    };
  }
  if (fields && typeof fields === "object") {
    const schemaFields = schema?.fields;
    if (Array.isArray(schemaFields) && schemaFields.length) {
      return {
        ...base,
        fields: schemaFields.map((sf, i) => ({
          ...sf,
          order: sf.order ?? i,
          value: fields[sf.name] ?? sf.value ?? ""
        }))
      };
    }
    const entries = Object.entries(fields);
    if (entries.length === 1 && entries[0][0] === "value") {
      const isSelect = spec.implementation === "ResolutionSpecification" || spec.implementation === "SourceSpecification" || spec.implementation === "QualityModifierSpecification" || spec.implementation === "ReleaseTypeSpecification";
      if (isSelect) {
        const options = spec.implementation === "ResolutionSpecification" ? SONARR_RESOLUTION_OPTIONS : spec.implementation === "SourceSpecification" ? SONARR_SOURCE_OPTIONS : spec.implementation === "QualityModifierSpecification" ? SONARR_QUALITY_MODIFIER_OPTIONS : SONARR_RELEASE_TYPE_OPTIONS;
        const label = spec.implementationName || "Value";
        return { ...base, fields: buildSelectField(Number(entries[0][1]), label, options) };
      }
      return { ...base, fields: buildTextField(String(entries[0][1] ?? "")) };
    }
    return {
      ...base,
      fields: entries.map(([name, value], i) => ({
        name,
        label: name,
        value,
        type: typeof value === "number" ? "number" : "textbox",
        order: i
      }))
    };
  }
  return base;
};
var normalizeSpecificationForSave = (spec) => {
  const { id, ...rest } = spec || {};
  const next = { ...rest };
  if (Array.isArray(next.fields)) {
    next.fields = next.fields.map((f, i) => {
      const field = { ...f, order: f.order ?? i };
      return field;
    });
  }
  return next;
};
var parseSpecificationsToSimple = (specs = [], schema = []) => ({
  specifications: (Array.isArray(specs) ? specs : []).map((spec) => {
    const schemaItem = findSchemaForSpec(schema, spec);
    return normalizeSpecificationForEditor(spec, schemaItem);
  })
});
var buildSpecificationsFromSimple = (state) => (state.specifications || []).map(normalizeSpecificationForSave);
var upsertResolution = (specs, value, opts = {}) => {
  const filtered = specs.filter((s) => s.implementation !== "ResolutionSpecification");
  if (value == null || value <= 0) return filtered;
  return [...filtered, buildResolutionSpecification(value, opts)];
};
var addSourceRule = (specs, value, negate) => [
  ...specs,
  buildSourceSpecification(value, { negate, required: true })
];
var addReleaseGroup = (specs, groupName) => [
  ...specs,
  buildReleaseGroupSpecification(groupName.trim(), { required: false })
];
var addReleaseTitleKeyword = (specs, keyword, { negate = false } = {}) => [
  ...specs,
  buildReleaseTitleSpecification(`\\b${escapeRegexLiteral(keyword)}\\b`, {
    name: negate ? `Not ${keyword}` : keyword,
    negate,
    required: true
  })
];
var normalizeTrashGuidesCustomFormat = (raw, schema = []) => {
  const payload = raw && typeof raw === "object" ? raw : {};
  const specifications = Array.isArray(payload.specifications) ? payload.specifications : [];
  return {
    name: String(payload.name || "").trim(),
    includeCustomFormatWhenRenaming: !!payload.includeCustomFormatWhenRenaming,
    specifications: specifications.map((spec) => {
      const schemaItem = findSchemaForSpec(schema, spec);
      return normalizeSpecificationForEditor(spec, schemaItem);
    })
  };
};
var mergeSchemaLists = (live = [], fallback = FALLBACK_SPEC_SCHEMA) => {
  const map = /* @__PURE__ */ new Map();
  fallback.forEach((s) => map.set(s.implementation, s));
  live.forEach((s) => map.set(s.implementation, s));
  return Array.from(map.values()).sort(
    (a, b) => String(a.implementationName || a.implementation).localeCompare(String(b.implementationName || b.implementation))
  );
};

// client/upgrader/CustomFormatSpecRow.tsx
var import_react5 = __toESM(require_react(), 1);
var import_jsx_runtime5 = __toESM(require_jsx_runtime(), 1);
var FieldEditor = ({ field, value, onChange }) => {
  const label = field?.label || field?.name || "Value";
  const type = String(field?.type || "textbox");
  if (type === "select" && Array.isArray(field?.selectOptions)) {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "block space-y-1", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "text-xs text-muted", children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "select",
        {
          value: String(value ?? field?.value ?? ""),
          onChange: (e) => onChange(field?.isFloat ? parseFloat(e.target.value) : Number(e.target.value)),
          className: "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text",
          children: field.selectOptions.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: opt.value, children: opt.name }, String(opt.value)))
        }
      )
    ] });
  }
  if (type === "number") {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "block space-y-1", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "text-xs text-muted", children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "input",
        {
          type: "number",
          value: value != null ? String(value) : "",
          onChange: (e) => onChange(e.target.value === "" ? "" : Number(e.target.value)),
          className: "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text font-mono"
        }
      )
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "block space-y-1", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "text-xs text-muted", children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      "textarea",
      {
        value: String(value ?? ""),
        onChange: (e) => onChange(e.target.value),
        rows: type === "textbox" && String(value ?? "").length > 80 ? 4 : 2,
        className: "w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-text resize-y min-h-[2.5rem]",
        spellCheck: false
      }
    ),
    field?.helpText && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "text-[10px] text-muted", children: field.helpText })
  ] });
};
var CustomFormatSpecRow = ({
  spec,
  schema,
  expanded = false,
  onToggleExpand,
  onChange,
  onDelete
}) => {
  const implLabel = spec?.implementationName || schema?.implementationName || spec?.implementation || "Specification";
  const fieldDefs = (0, import_react5.useMemo)(() => {
    if (Array.isArray(schema?.fields) && schema.fields.length) return schema.fields;
    if (Array.isArray(spec?.fields) && spec.fields.length) return spec.fields;
    return [{ name: "value", label: "Value", type: "textbox", value: getSpecFieldValue(spec) ?? "" }];
  }, [schema, spec]);
  const updateField = (fieldName, value) => {
    onChange(setSpecFieldValue(spec, fieldName, value));
  };
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "rounded-xl border border-border bg-background/50 overflow-hidden", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex items-center gap-2 p-3", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "button",
        {
          type: "button",
          onClick: onToggleExpand,
          className: "text-muted hover:text-text p-0.5",
          "aria-label": expanded ? "Collapse" : "Expand",
          children: expanded ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ChevronUp, { className: "w-4 h-4" }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ChevronDown, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            type: "text",
            value: spec?.name || "",
            onChange: (e) => onChange({ ...spec, name: e.target.value }),
            placeholder: "Specification name",
            className: "w-full bg-transparent border-0 text-sm font-semibold text-text focus:outline-none"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "text-[10px] text-muted truncate", children: implLabel })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "inline-flex items-center gap-1 text-[10px] text-muted whitespace-nowrap", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            type: "checkbox",
            checked: !!spec?.required,
            onChange: (e) => onChange({ ...spec, required: e.target.checked })
          }
        ),
        "Req"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "inline-flex items-center gap-1 text-[10px] text-muted whitespace-nowrap", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            type: "checkbox",
            checked: !!spec?.negate,
            onChange: (e) => onChange({ ...spec, negate: e.target.checked })
          }
        ),
        "Neg"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", onClick: onDelete, className: "text-muted hover:text-red-400 p-1", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Trash2, { className: "w-4 h-4" }) })
    ] }),
    expanded && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "px-3 pb-3 pt-1 border-t border-border/60 space-y-3", children: fieldDefs.map((field) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      FieldEditor,
      {
        field,
        value: getSpecFieldValue(spec, field.name),
        onChange: (val) => updateField(field.name, val)
      },
      field.name
    )) })
  ] });
};
var cloneSchemaToSpec = (schema, nameOverride) => ({
  name: nameOverride || schema?.name || schema?.implementationName || "New condition",
  implementation: schema.implementation,
  implementationName: schema.implementationName || schema.implementation,
  infoLink: schema.infoLink || CF_INFO_LINK,
  negate: !!schema.negate,
  required: schema.required !== false,
  fields: Array.isArray(schema.fields) ? schema.fields.map((f, i) => ({ ...f, order: f.order ?? i })) : [{ name: "value", label: "Value", type: "textbox", value: "", order: 0 }]
});

// client/upgrader/TrashCatalogBrowser.tsx
var import_react6 = __toESM(require_react(), 1);
var import_jsx_runtime6 = __toESM(require_jsx_runtime(), 1);
var TrashCatalogBrowser = ({ onImport }) => {
  const [loading, setLoading] = (0, import_react6.useState)(true);
  const [refreshing, setRefreshing] = (0, import_react6.useState)(false);
  const [error, setError] = (0, import_react6.useState)("");
  const [categories, setCategories] = (0, import_react6.useState)([]);
  const [sourceUrl, setSourceUrl] = (0, import_react6.useState)("https://trash-guides.info/Sonarr/sonarr-collection-of-custom-formats/");
  const [itemCount, setItemCount] = (0, import_react6.useState)(0);
  const [search, setSearch] = (0, import_react6.useState)("");
  const [categoryFilter, setCategoryFilter] = (0, import_react6.useState)("");
  const [selectedSlug, setSelectedSlug] = (0, import_react6.useState)(null);
  const [importing, setImporting] = (0, import_react6.useState)(false);
  const [preview, setPreview] = (0, import_react6.useState)(null);
  const loadCatalog = (0, import_react6.useCallback)(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/api/upgrader/trash/sonarr/catalog${refresh ? "?refresh=1" : ""}`);
      setCategories(res?.categories || []);
      setItemCount(res?.itemCount || 0);
      if (res?.source) setSourceUrl(res.source);
    } catch (e) {
      setError(e.message || "Failed to load TRaSH catalog");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  (0, import_react6.useEffect)(() => {
    loadCatalog(false);
  }, [loadCatalog]);
  const filteredCategories = (0, import_react6.useMemo)(() => {
    const q = search.trim().toLowerCase();
    return categories.filter((cat) => !categoryFilter || cat.name === categoryFilter).map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => {
        if (!q) return true;
        return item.name.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      })
    })).filter((cat) => cat.items.length > 0);
  }, [categories, search, categoryFilter]);
  const visibleCount = filteredCategories.reduce((n, c) => n + c.items.length, 0);
  const loadPreview = async (slug) => {
    setSelectedSlug(slug);
    setPreview(null);
    try {
      const res = await apiFetch(`/api/upgrader/trash/sonarr/catalog/${encodeURIComponent(slug)}`);
      setPreview(res?.format || null);
    } catch (e) {
      setError(e.message || "Failed to load format");
    }
  };
  const handleImport = async (slug) => {
    setImporting(true);
    setError("");
    try {
      const res = await apiFetch(`/api/upgrader/trash/sonarr/catalog/${encodeURIComponent(slug)}`);
      const format = res?.format;
      if (!format) throw new Error("Format not found");
      onImport({
        name: format.name,
        includeCustomFormatWhenRenaming: !!format.includeCustomFormatWhenRenaming,
        specifications: format.specifications || [],
        trashId: format.trash_id,
        defaultScore: format.trash_scores?.default ?? null
      });
    } catch (e) {
      setError(e.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "space-y-3 p-4 rounded-xl border border-plex/30 bg-plex/5", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-start justify-between gap-3 flex-wrap", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex items-center gap-2 text-sm font-semibold text-text", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(BookOpen, { className: "w-4 h-4 text-plex" }),
          "TRaSH Guides Catalog"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "text-xs text-muted mt-1", children: [
          "Browse the full",
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("a", { href: sourceUrl, target: "_blank", rel: "noopener noreferrer", className: "text-plex hover:underline inline-flex items-center gap-0.5", children: [
            "Sonarr collection",
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ExternalLink, { className: "w-3 h-3" })
          ] }),
          " ",
          "\u2014 audio, HDR, streaming, tiers, language, anime, and more (",
          itemCount,
          " formats)."
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
        "button",
        {
          type: "button",
          onClick: () => loadCatalog(true),
          disabled: refreshing || loading,
          className: "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted hover:text-text disabled:opacity-50",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(RefreshCw, { className: `w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}` }),
            "Refresh"
          ]
        }
      )
    ] }),
    error && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2", children: error }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "flex flex-wrap gap-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "relative flex-1 min-w-[12rem]", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Search, { className: "w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "input",
          {
            type: "text",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            placeholder: "Search formats\u2026",
            className: "w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-text"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
        "select",
        {
          value: categoryFilter,
          onChange: (e) => setCategoryFilter(e.target.value),
          className: "bg-background border border-border rounded-lg px-3 py-2 text-xs text-text max-w-[14rem]",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("option", { value: "", children: "All categories" }),
            categories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("option", { value: c.name, children: [
              c.name,
              " (",
              c.items.length,
              ")"
            ] }, c.name))
          ]
        }
      )
    ] }),
    loading ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "text-xs text-muted py-6 text-center", children: "Loading TRaSH catalog\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-72 overflow-hidden", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "overflow-y-auto custom-scrollbar border border-border rounded-lg bg-background/40 divide-y divide-border/60", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "sticky top-0 bg-card/95 backdrop-blur px-3 py-1.5 text-[10px] text-muted border-b border-border", children: [
          visibleCount,
          " shown"
        ] }),
        filteredCategories.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-plex/80 bg-plex/5", children: cat.name }),
          cat.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
            "button",
            {
              type: "button",
              onClick: () => loadPreview(item.slug),
              className: `w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors ${selectedSlug === item.slug ? "bg-plex/10 text-plex" : "text-text"}`,
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "font-medium truncate", children: item.name }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "text-[10px] text-muted", children: [
                  item.specCount,
                  " spec",
                  item.specCount === 1 ? "" : "s",
                  item.defaultScore != null ? ` \xB7 score ${item.defaultScore}` : ""
                ] })
              ]
            },
            item.slug
          ))
        ] }, cat.name)),
        !visibleCount && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "px-3 py-6 text-xs text-muted text-center", children: "No formats match your search." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "overflow-y-auto custom-scrollbar border border-border rounded-lg bg-background/40 p-3 space-y-3", children: !selectedSlug ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "text-xs text-muted py-8 text-center", children: "Select a format to preview and import." }) : !preview ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "text-xs text-muted py-8 text-center", children: "Loading preview\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "text-sm font-bold text-text", children: preview.name }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "text-[10px] text-muted mt-1 font-mono truncate", children: preview.trash_id }),
          preview.trash_scores?.default != null && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "text-xs text-muted mt-1", children: [
            "Default profile score: ",
            preview.trash_scores.default
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "text-xs text-muted", children: [
          Array.isArray(preview.specifications) ? preview.specifications.length : 0,
          " conditions"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("ul", { className: "text-[11px] text-muted space-y-1 max-h-40 overflow-y-auto custom-scrollbar", children: [
          (preview.specifications || []).slice(0, 12).map((spec, i) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("li", { className: "truncate", children: [
            spec.negate ? "\xAC " : "",
            spec.name,
            " (",
            spec.implementationName || spec.implementation,
            ")"
          ] }, `${spec.name}-${i}`)),
          (preview.specifications || []).length > 12 && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("li", { className: "text-muted", children: [
            "\u2026and ",
            (preview.specifications || []).length - 12,
            " more"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
          "button",
          {
            type: "button",
            disabled: importing,
            onClick: () => handleImport(selectedSlug),
            className: "w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-plex text-background text-xs font-bold hover:bg-plex/90 disabled:opacity-50",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Download, { className: "w-3.5 h-3.5" }),
              importing ? "Importing\u2026" : "Import into editor"
            ]
          }
        )
      ] }) })
    ] })
  ] });
};

// client/upgrader/UpgraderCustomFormatModal.tsx
var import_jsx_runtime7 = __toESM(require_jsx_runtime(), 1);
var UpgraderCustomFormatModal = ({ format, instanceId, onClose, onSave }) => {
  const [name, setName] = (0, import_react7.useState)(format?.name || "");
  const [editorMode, setEditorMode] = (0, import_react7.useState)("simple");
  const [simple, setSimple] = (0, import_react7.useState)(emptySimpleFormatState());
  const [keywordInput, setKeywordInput] = (0, import_react7.useState)("");
  const [negateInput, setNegateInput] = (0, import_react7.useState)("");
  const [groupInput, setGroupInput] = (0, import_react7.useState)("");
  const [saving, setSaving] = (0, import_react7.useState)(false);
  const [rawJson, setRawJson] = (0, import_react7.useState)("");
  const [error, setError] = (0, import_react7.useState)("");
  const [importJson, setImportJson] = (0, import_react7.useState)("");
  const [trashScoreHint, setTrashScoreHint] = (0, import_react7.useState)(null);
  const [schema, setSchema] = (0, import_react7.useState)(FALLBACK_SPEC_SCHEMA);
  const [schemaLoading, setSchemaLoading] = (0, import_react7.useState)(false);
  const [schemaError, setSchemaError] = (0, import_react7.useState)("");
  const [addSpecType, setAddSpecType] = (0, import_react7.useState)("");
  const [manualSpecJson, setManualSpecJson] = (0, import_react7.useState)("");
  const [showManualSpec, setShowManualSpec] = (0, import_react7.useState)(false);
  const [expandedSpecs, setExpandedSpecs] = (0, import_react7.useState)({});
  const mergedSchema = (0, import_react7.useMemo)(() => mergeSchemaLists(schema), [schema]);
  const loadSchema = (0, import_react7.useCallback)(async () => {
    if (!instanceId) return;
    setSchemaLoading(true);
    setSchemaError("");
    try {
      const res = await apiFetch(`/api/upgrader/arr/${instanceId}/customformats/schema`);
      const live = Array.isArray(res?.schema) ? res.schema : [];
      if (live.length) setSchema(live);
    } catch (e) {
      setSchemaError(e.message || "Using built-in schema fallback");
      setSchema(FALLBACK_SPEC_SCHEMA);
    } finally {
      setSchemaLoading(false);
    }
  }, [instanceId]);
  (0, import_react7.useEffect)(() => {
    loadSchema();
  }, [loadSchema]);
  const applySpecifications = (0, import_react7.useCallback)((specifications, formatName, scoreHint) => {
    const parsed = parseSpecificationsToSimple(specifications, mergedSchema);
    setSimple(parsed);
    if (formatName?.trim()) setName(formatName.trim());
    setTrashScoreHint(scoreHint ?? null);
    setRawJson(JSON.stringify(buildSpecificationsFromSimple(parsed), null, 2));
    setExpandedSpecs({});
  }, [mergedSchema]);
  (0, import_react7.useEffect)(() => {
    if (format) {
      applySpecifications(format.specifications || [], format.name);
      setEditorMode("simple");
    } else {
      setSimple(emptySimpleFormatState());
      setRawJson("[]");
    }
  }, [format, applySpecifications]);
  const handleSwitchMode = (mode) => {
    setError("");
    if (mode === "advanced") {
      const generated = buildSpecificationsFromSimple(simple);
      setRawJson(JSON.stringify(generated, null, 2));
      setEditorMode("advanced");
      return;
    }
    if (editorMode === "advanced") {
      try {
        const specs = JSON.parse(rawJson);
        if (!Array.isArray(specs)) throw new Error("Must be a JSON array");
        applySpecifications(specs);
      } catch {
        setError("Cannot leave Advanced mode: JSON must be a valid specifications array.");
        return;
      }
    }
    setEditorMode(mode);
  };
  const resolutionSpec = simple.specifications.find((s) => s.implementation === "ResolutionSpecification");
  const resolutionEnabled = !!resolutionSpec;
  const resolutionValue = Number(resolutionSpec ? resolutionSpec.fields?.find((f) => f.name === "value")?.value : 1080) || 1080;
  const setSpecifications = (specifications) => {
    setSimple({ specifications });
  };
  const handleImportTrash = () => {
    setError("");
    try {
      const raw = JSON.parse(importJson);
      const normalized = normalizeTrashGuidesCustomFormat(raw, mergedSchema);
      if (!normalized.name && !name.trim()) {
        return setError("Imported JSON is missing a format name.");
      }
      applySpecifications(normalized.specifications, normalized.name || name);
      setEditorMode("simple");
      setImportJson("");
    } catch (e) {
      setError(`Invalid TRaSH JSON: ${e.message || "parse failed"}`);
    }
  };
  const handleAddFromSchema = () => {
    const template = mergedSchema.find((s) => s.implementation === addSpecType);
    if (!template) return;
    const next = [...simple.specifications, cloneSchemaToSpec(template)];
    setSpecifications(next);
    setAddSpecType("");
    setExpandedSpecs((prev) => ({ ...prev, [next.length - 1]: true }));
  };
  const handlePasteSpecJson = () => {
    setError("");
    try {
      const parsed = JSON.parse(manualSpecJson);
      if (!parsed?.implementation) throw new Error("Specification must include an implementation field");
      const normalized = parseSpecificationsToSimple([parsed], mergedSchema).specifications[0];
      const next = [...simple.specifications, normalized || parsed];
      setSpecifications(next);
      setManualSpecJson("");
      setShowManualSpec(false);
      setExpandedSpecs((prev) => ({ ...prev, [next.length - 1]: true }));
    } catch (e) {
      setError(`Invalid specification JSON: ${e.message || "parse failed"}`);
    }
  };
  const handleSave = async () => {
    setError("");
    if (!name.trim()) return setError("Name is required");
    let specifications = [];
    if (editorMode === "advanced") {
      try {
        specifications = JSON.parse(rawJson);
        if (!Array.isArray(specifications)) throw new Error("Must be a JSON array");
      } catch (e) {
        return setError(`Invalid JSON: ${e.message}`);
      }
    } else {
      const built = buildSpecificationsFromSimple(simple);
      if (!built.length) return setError("Add at least one condition.");
      specifications = built;
    }
    const payload = {
      id: format?.id,
      name: name.trim(),
      includeCustomFormatWhenRenaming: format?.includeCustomFormatWhenRenaming ?? false,
      specifications
    };
    setSaving(true);
    try {
      await onSave(payload);
    } catch (e) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "bg-card border border-border shadow-xl rounded-2xl w-full max-w-4xl flex flex-col max-h-[90vh]", children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex items-center justify-between p-6 border-b border-border", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h3", { className: "text-xl font-bold text-text", children: format ? "Edit Custom Format" : "Create Custom Format" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("p", { className: "text-xs text-muted mt-1", children: [
          "TRaSH Guides\u2013compatible builder with all Sonarr specification types.",
          schemaLoading && " Loading schema\u2026",
          schemaError && !schemaLoading && ` (${schemaError})`
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { onClick: onClose, className: "text-muted hover:text-text transition-colors", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(X, { className: "w-5 h-5" }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "p-6 flex-1 overflow-y-auto space-y-5 custom-scrollbar", children: [
      error && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-sm", children: error }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("label", { className: "block text-sm font-semibold text-text mb-2", children: "Format Name" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "input",
          {
            type: "text",
            value: name,
            onChange: (e) => setName(e.target.value),
            placeholder: "e.g. WEB-1080p Tier 01",
            className: "w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-plex"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-1 bg-background border border-border rounded-lg p-1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
          "button",
          {
            type: "button",
            onClick: () => handleSwitchMode("catalog"),
            className: `text-xs sm:text-sm font-medium py-2 px-2 rounded-md transition-colors inline-flex items-center justify-center gap-1.5 ${editorMode === "catalog" ? "bg-plex text-background" : "text-muted hover:text-text"}`,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(BookOpen, { className: "w-3.5 h-3.5 shrink-0" }),
              "TRaSH Catalog"
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "button",
          {
            type: "button",
            onClick: () => handleSwitchMode("simple"),
            className: `text-xs sm:text-sm font-medium py-2 px-2 rounded-md transition-colors ${editorMode === "simple" ? "bg-plex text-background" : "text-muted hover:text-text"}`,
            children: "Simple Builder"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
          "button",
          {
            type: "button",
            onClick: () => handleSwitchMode("paste"),
            className: `text-xs sm:text-sm font-medium py-2 px-2 rounded-md transition-colors inline-flex items-center justify-center gap-1.5 ${editorMode === "paste" ? "bg-plex text-background" : "text-muted hover:text-text"}`,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ClipboardPaste, { className: "w-3.5 h-3.5 shrink-0" }),
              "Paste JSON"
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "button",
          {
            type: "button",
            onClick: () => handleSwitchMode("advanced"),
            className: `text-xs sm:text-sm font-medium py-2 px-2 rounded-md transition-colors ${editorMode === "advanced" ? "bg-plex text-background" : "text-muted hover:text-text"}`,
            children: "Advanced JSON"
          }
        )
      ] }),
      editorMode === "catalog" && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
        TrashCatalogBrowser,
        {
          onImport: ({ name: fmtName, specifications, defaultScore }) => {
            applySpecifications(specifications, fmtName, defaultScore);
            setEditorMode("simple");
          }
        }
      ),
      editorMode === "paste" && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "space-y-2 p-4 rounded-xl border border-plex/30 bg-plex/5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("label", { className: "block text-xs font-semibold text-text", children: "Paste TRaSH Guides custom format JSON" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "textarea",
          {
            value: importJson,
            onChange: (e) => setImportJson(e.target.value),
            className: "w-full h-32 bg-background border border-border rounded-lg p-3 text-xs font-mono text-text focus:outline-none focus:border-plex resize-none",
            spellCheck: false,
            placeholder: '{"name":"1080p","specifications":[...]}'
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", onClick: handleImportTrash, className: "text-xs font-bold text-plex hover:underline", children: "Parse into editor" })
      ] }),
      trashScoreHint != null && editorMode === "simple" && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "text-xs text-muted px-3 py-2 rounded-lg border border-dashed border-border", children: [
        "TRaSH default quality profile score for this format: ",
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "text-plex font-semibold", children: trashScoreHint }),
        " ",
        "\u2014 set this in your Quality Profile after saving."
      ] }),
      editorMode === "simple" && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "space-y-5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "p-4 rounded-xl border border-border bg-background/40 space-y-4", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("label", { className: "text-sm font-semibold text-text", children: "Quick Add" }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "space-y-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "text-xs text-muted", children: "Resolution" }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { className: "inline-flex items-center gap-2 text-xs text-muted cursor-pointer", children: [
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  "input",
                  {
                    type: "checkbox",
                    checked: resolutionEnabled,
                    onChange: (e) => setSpecifications(
                      upsertResolution(
                        simple.specifications,
                        e.target.checked ? resolutionValue : null,
                        { required: true, negate: false }
                      )
                    )
                  }
                ),
                "Enable"
              ] })
            ] }),
            resolutionEnabled && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
              "select",
              {
                value: resolutionValue,
                onChange: (e) => setSpecifications(
                  upsertResolution(simple.specifications, Number(e.target.value), {
                    required: resolutionSpec?.required !== false,
                    negate: !!resolutionSpec?.negate
                  })
                ),
                className: "bg-card border border-border rounded-lg px-3 py-2 text-sm text-text",
                children: SONARR_RESOLUTION_OPTIONS.filter((o) => o.value > 0).map((o) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: o.value, children: o.name }, o.value))
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "space-y-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "text-xs text-muted", children: "Source" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex flex-wrap gap-2", children: [
              SONARR_SOURCE_OPTIONS.filter((o) => o.value > 0).map((o) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
                "button",
                {
                  type: "button",
                  onClick: () => setSpecifications(addSourceRule(simple.specifications, o.value, false)),
                  className: "text-xs px-2.5 py-1 rounded-full border border-border hover:border-plex/50 text-muted hover:text-text",
                  children: [
                    "+ ",
                    o.name
                  ]
                },
                `inc-${o.value}`
              )),
              SONARR_SOURCE_OPTIONS.filter((o) => o.value > 0).map((o) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
                "button",
                {
                  type: "button",
                  onClick: () => setSpecifications(addSourceRule(simple.specifications, o.value, true)),
                  className: "text-xs px-2.5 py-1 rounded-full border border-red-500/30 hover:border-red-500/60 text-red-400",
                  children: [
                    "+ Not ",
                    o.name
                  ]
                },
                `not-${o.value}`
              ))
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "space-y-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "text-xs text-muted", children: "Release groups" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
              "input",
              {
                type: "text",
                value: groupInput,
                onChange: (e) => setGroupInput(e.target.value),
                onKeyDown: (e) => {
                  if (e.key === "Enter" && groupInput.trim()) {
                    setSpecifications(addReleaseGroup(simple.specifications, groupInput.trim()));
                    setGroupInput("");
                  }
                },
                placeholder: "CRiSC, FoRM, iFT\u2026 press Enter",
                className: "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-plex"
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "space-y-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "text-xs text-muted", children: "Release title keywords" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
              "input",
              {
                type: "text",
                value: keywordInput,
                onChange: (e) => setKeywordInput(e.target.value),
                onKeyDown: (e) => {
                  if (e.key === "Enter" && keywordInput.trim()) {
                    setSpecifications(addReleaseTitleKeyword(simple.specifications, keywordInput.trim()));
                    setKeywordInput("");
                  }
                },
                placeholder: "HEVC, x265, DV\u2026 press Enter",
                className: "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-plex"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
              "input",
              {
                type: "text",
                value: negateInput,
                onChange: (e) => setNegateInput(e.target.value),
                onKeyDown: (e) => {
                  if (e.key === "Enter" && negateInput.trim()) {
                    setSpecifications(addReleaseTitleKeyword(simple.specifications, negateInput.trim(), { negate: true }));
                    setNegateInput("");
                  }
                },
                placeholder: "Exclude keyword\u2026 press Enter",
                className: "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-plex"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "p-4 rounded-xl border border-border bg-background/40 space-y-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex items-center justify-between gap-3 flex-wrap", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("label", { className: "text-sm font-semibold text-text", children: "All Conditions" }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("p", { className: "text-xs text-muted mt-0.5", children: [
                simple.specifications.length,
                " specification(s) \u2014 language, HDR, size, indexer, and every other TRaSH type.",
                schemaLoading && " Loading schema\u2026",
                schemaError && !schemaLoading && ` (${schemaError})`
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
              "button",
              {
                type: "button",
                onClick: loadSchema,
                disabled: schemaLoading,
                className: "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted hover:text-text disabled:opacity-50",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(RefreshCw, { className: `w-3.5 h-3.5 ${schemaLoading ? "animate-spin" : ""}` }),
                  "Refresh schema"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex items-center gap-2 flex-wrap", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
              "select",
              {
                value: addSpecType,
                onChange: (e) => setAddSpecType(e.target.value),
                className: "bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-text max-w-[12rem]",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "", children: "Add condition type\u2026" }),
                  mergedSchema.map((s) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: s.implementation, children: s.implementationName || s.implementation }, s.implementation))
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
              "button",
              {
                type: "button",
                disabled: !addSpecType,
                onClick: handleAddFromSchema,
                className: "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-plex/15 text-plex text-xs font-semibold hover:bg-plex/25 disabled:opacity-40",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Plus, { className: "w-3.5 h-3.5" }),
                  "Add"
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
              "button",
              {
                type: "button",
                onClick: () => setShowManualSpec((v) => !v),
                className: "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted hover:text-text",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(CodeXml, { className: "w-3.5 h-3.5" }),
                  "Paste spec JSON"
                ]
              }
            )
          ] }),
          showManualSpec && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "space-y-2 p-3 rounded-lg border border-dashed border-border", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
              "textarea",
              {
                value: manualSpecJson,
                onChange: (e) => setManualSpecJson(e.target.value),
                className: "w-full h-24 bg-background border border-border rounded-lg p-3 text-xs font-mono text-text resize-none",
                spellCheck: false,
                placeholder: '{"name":"Language: Not English","implementation":"LanguageSpecification",...}'
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", onClick: handlePasteSpecJson, className: "text-xs font-bold text-plex hover:underline", children: "Add specification from JSON" })
          ] }),
          simple.specifications.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "text-xs text-muted p-4 rounded-lg border border-dashed border-border text-center", children: "No conditions yet. Use quick-add shortcuts above or add any Sonarr specification type from the dropdown." }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "space-y-2", children: simple.specifications.map((spec, idx) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            CustomFormatSpecRow,
            {
              spec,
              schema: findSchemaForSpec(mergedSchema, spec),
              expanded: !!expandedSpecs[idx],
              onToggleExpand: () => setExpandedSpecs((prev) => ({ ...prev, [idx]: !prev[idx] })),
              onChange: (next) => {
                const copy = [...simple.specifications];
                copy[idx] = next;
                setSpecifications(copy);
              },
              onDelete: () => setSpecifications(simple.specifications.filter((_, i) => i !== idx))
            },
            `${spec.implementation}-${idx}-${spec.name}`
          )) })
        ] })
      ] }),
      editorMode === "advanced" && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "flex flex-col h-96", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("label", { className: "block text-sm font-semibold text-text mb-2", children: "Specifications JSON" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "textarea",
          {
            value: rawJson,
            onChange: (e) => setRawJson(e.target.value),
            className: "flex-1 w-full bg-[#1e1e1e] border border-border rounded-lg p-4 text-xs font-mono text-[#d4d4d4] focus:outline-none focus:border-plex resize-none whitespace-pre",
            spellCheck: false
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "p-6 border-t border-border flex justify-end gap-3 bg-background/50 rounded-b-2xl", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
        "button",
        {
          type: "button",
          onClick: onClose,
          className: "px-4 py-2 rounded-lg text-sm font-semibold text-text hover:bg-white/5 transition-colors",
          disabled: saving,
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
        "button",
        {
          type: "button",
          onClick: handleSave,
          disabled: saving,
          className: "bg-plex text-background px-4 py-2 rounded-lg text-sm font-semibold hover:bg-plex/90 transition-colors flex items-center gap-2",
          children: [
            saving ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(RefreshCw, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Save, { className: "w-4 h-4" }),
            saving ? "Saving to Server\u2026" : "Save & Sync"
          ]
        }
      )
    ] })
  ] }) });
};

// client/upgrader/UpgraderQualityProfileModal.tsx
var import_react8 = __toESM(require_react(), 1);
var import_jsx_runtime8 = __toESM(require_jsx_runtime(), 1);
var UpgraderQualityProfileModal = ({ profile, formats, onClose, onSave }) => {
  const [scores, setScores] = (0, import_react8.useState)({});
  const [saving, setSaving] = (0, import_react8.useState)(false);
  const [error, setError] = (0, import_react8.useState)("");
  (0, import_react8.useEffect)(() => {
    const initialScores = {};
    profile.formatItems?.forEach((fi) => {
      initialScores[fi.format] = fi.score;
    });
    setScores(initialScores);
  }, [profile]);
  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      const newFormatItems = formats.map((f) => {
        if (!f.id) return null;
        return {
          format: f.id,
          score: scores[f.id] || 0
        };
      }).filter(Boolean);
      const payload = {
        ...profile,
        formatItems: newFormatItems
      };
      await onSave(payload);
    } catch (e) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "bg-card border border-border shadow-xl rounded-2xl w-full max-w-5xl flex flex-col max-h-[90vh]", children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between p-6 border-b border-border", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { className: "text-xl font-bold text-text", children: "Edit Quality Profile" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-sm text-muted", children: profile.name })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { onClick: onClose, className: "text-muted hover:text-text transition-colors", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(X, { className: "w-5 h-5" }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar", children: [
      error && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-sm", children: error }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { className: "text-sm font-semibold text-text mb-4", children: "Custom Format Scores" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "text-xs text-muted mb-4", children: "Assign positive or negative scores to custom formats to prioritize or exclude them during upgrades. Formats with a score of 0 are effectively ignored." }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "columns-1 md:columns-2 gap-3", children: [
          formats.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "text-sm text-muted text-center py-8 border border-dashed border-border rounded-lg md:col-span-2", children: "No custom formats exist on this instance yet." }),
          [...formats].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0)).map((f) => {
            if (!f.id) return null;
            const score = scores[f.id] || 0;
            return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "flex items-center justify-between bg-background border border-border p-3 rounded-lg mb-3 break-inside-avoid", children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "font-semibold text-sm text-text truncate pr-4", children: f.name }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "w-32", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                "input",
                {
                  type: "number",
                  value: score === 0 ? "" : score,
                  onChange: (e) => setScores({ ...scores, [f.id]: parseInt(e.target.value) || 0 }),
                  placeholder: "0",
                  className: `w-full bg-card border rounded-lg px-3 py-1.5 text-sm font-mono text-right focus:outline-none focus:border-plex ${score > 0 ? "border-green-500/30 text-green-500" : score < 0 ? "border-red-500/30 text-red-500" : "border-border text-text"}`
                }
              ) })
            ] }, f.id);
          })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "p-6 border-t border-border flex justify-end gap-3 bg-background/50 rounded-b-2xl", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        "button",
        {
          onClick: onClose,
          className: "px-4 py-2 rounded-lg text-sm font-semibold text-text hover:bg-white/5 transition-colors",
          disabled: saving,
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
        "button",
        {
          onClick: handleSave,
          disabled: saving,
          className: "bg-plex text-background px-4 py-2 rounded-lg text-sm font-semibold hover:bg-plex/90 transition-colors flex items-center gap-2",
          children: [
            saving ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(RefreshCw, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Save, { className: "w-4 h-4" }),
            saving ? "Saving to Server..." : "Save Scores"
          ]
        }
      )
    ] })
  ] }) });
};

// client/upgrader/UpgraderProfilesTab.tsx
var import_jsx_runtime9 = __toESM(require_jsx_runtime(), 1);
var InstanceDropdown = ({ options, value, onChange, disabled }) => {
  const [open, setOpen] = (0, import_react9.useState)(false);
  const selected = options.find((o) => o.id === value);
  (0, import_react9.useEffect)(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "relative inline-block", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
      "button",
      {
        type: "button",
        onClick: () => !disabled && setOpen((o) => !o),
        className: `flex items-center justify-between gap-2 bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-medium text-text focus:outline-none transition-all min-w-[9rem] ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-plex/60 cursor-pointer"} ${open ? "border-plex shadow-[0_0_0_2px_rgb(var(--color-plex)/0.15)]" : ""}`,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "truncate", children: selected?.name || "Select..." }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(ChevronDown, { className: `w-3.5 h-3.5 text-muted flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}` })
        ]
      }
    ),
    open && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "absolute right-0 mt-1.5 w-full min-w-max origin-top-right bg-card border border-border rounded-xl shadow-2xl z-50 py-1 overflow-hidden animate-slide-up", children: options.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
      "button",
      {
        className: `w-full flex items-center gap-2 text-left px-3 py-2 text-sm transition-colors ${opt.id === value ? "bg-plex/15 text-plex font-semibold" : "text-text hover:bg-white/8"}`,
        onClick: () => {
          onChange(opt.id);
          setOpen(false);
        },
        children: [
          opt.id === value && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Check, { className: "w-3 h-3 flex-shrink-0" }),
          opt.id !== value && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "w-3" }),
          opt.name
        ]
      },
      opt.id
    )) })
  ] });
};
var UpgraderProfilesTab = ({
  initialInstanceId = "",
  initialFormatPage = 1,
  initialProfilePage = 1,
  onUrlStateChange
}) => {
  const [loading, setLoading] = (0, import_react9.useState)(true);
  const [instances, setInstances] = (0, import_react9.useState)([]);
  const [selectedInstanceId, setSelectedInstanceId] = (0, import_react9.useState)(initialInstanceId);
  const [formats, setFormats] = (0, import_react9.useState)([]);
  const [profiles, setProfiles] = (0, import_react9.useState)([]);
  const [editingFormat, setEditingFormat] = (0, import_react9.useState)({ show: false, format: null });
  const [editingProfile, setEditingProfile] = (0, import_react9.useState)({ show: false, profile: null });
  const [formatPage, setFormatPage] = (0, import_react9.useState)(initialFormatPage);
  const [profilePage, setProfilePage] = (0, import_react9.useState)(initialProfilePage);
  const pageSize = 18;
  (0, import_react9.useEffect)(() => {
    setSelectedInstanceId(initialInstanceId);
    setFormatPage(initialFormatPage);
    setProfilePage(initialProfilePage);
  }, [initialInstanceId, initialFormatPage, initialProfilePage]);
  const handleInstanceChange = (instanceId) => {
    setSelectedInstanceId(instanceId);
    setFormatPage(1);
    setProfilePage(1);
    onUrlStateChange?.({ instance: instanceId, formatPage: 1, profilePage: 1 });
  };
  const handleFormatPageChange = (nextPage) => {
    setFormatPage(nextPage);
    onUrlStateChange?.({ formatPage: nextPage });
  };
  const handleProfilePageChange = (nextPage) => {
    setProfilePage(nextPage);
    onUrlStateChange?.({ profilePage: nextPage });
  };
  const loadData = (0, import_react9.useCallback)(async () => {
    setLoading(true);
    try {
      const profilesRes = await apiFetch("/api/upgrader/profiles");
      const loadedInstances = profilesRes?.instances?.map((i) => ({
        id: i.id,
        name: i.name || (i.type === "radarr" ? "Radarr" : "Sonarr"),
        type: i.type
      })) || [];
      setInstances(loadedInstances);
      if (loadedInstances.length > 0) {
        setSelectedInstanceId((current) => {
          if (current && loadedInstances.some((i) => i.id === current)) return current;
          const preferred = initialInstanceId && loadedInstances.find((i) => i.id === initialInstanceId)?.id;
          const next = preferred || loadedInstances[0].id;
          if (next !== current) onUrlStateChange?.({ instance: next });
          return next;
        });
      }
    } catch (e) {
      console.error("Failed to load instances", e);
    } finally {
      setLoading(false);
    }
  }, [initialInstanceId, onUrlStateChange]);
  const loadInstanceData = (0, import_react9.useCallback)(async (instanceId) => {
    setLoading(true);
    try {
      const [formatsRes, profilesRes] = await Promise.all([
        apiFetch(`/api/upgrader/arr/${instanceId}/customformats`),
        apiFetch(`/api/upgrader/arr/${instanceId}/qualityprofiles`)
      ]);
      setFormats(formatsRes?.formats || []);
      setProfiles(profilesRes?.profiles || []);
    } catch (e) {
      console.error("Failed to load instance data", e);
    } finally {
      setLoading(false);
    }
  }, []);
  const handleSaveFormat = async (format) => {
    if (!selectedInstanceId) return;
    const method = format.id ? "PUT" : "POST";
    const url = format.id ? `/api/upgrader/arr/${selectedInstanceId}/customformats/${format.id}` : `/api/upgrader/arr/${selectedInstanceId}/customformats`;
    await apiFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(format)
    });
    await loadInstanceData(selectedInstanceId);
    setEditingFormat({ show: false, format: null });
  };
  const handleSaveProfile = async (profile) => {
    if (!selectedInstanceId) return;
    const url = `/api/upgrader/arr/${selectedInstanceId}/qualityprofiles/${profile.id}`;
    await apiFetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile)
    });
    await loadInstanceData(selectedInstanceId);
    setEditingProfile({ show: false, profile: null });
  };
  (0, import_react9.useEffect)(() => {
    loadData();
  }, [loadData]);
  (0, import_react9.useEffect)(() => {
    if (selectedInstanceId) {
      loadInstanceData(selectedInstanceId);
    } else {
      setFormats([]);
      setProfiles([]);
    }
  }, [selectedInstanceId, loadInstanceData]);
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "bg-card border border-border shadow-sm rounded-xl p-6", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("h3", { className: "text-lg font-bold text-text flex items-center gap-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Settings2, { className: "w-5 h-5 text-plex" }),
            "Profiles & Custom Formats"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "text-sm text-muted mt-1", children: "Manage and sync Quality Profiles and Custom Formats directly to Sonarr and Radarr." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            InstanceDropdown,
            {
              options: instances,
              value: selectedInstanceId,
              onChange: handleInstanceChange,
              disabled: loading
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            "button",
            {
              type: "button",
              className: "p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted hover:text-text transition-colors",
              onClick: () => selectedInstanceId && loadInstanceData(selectedInstanceId),
              disabled: loading,
              children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(RefreshCw, { className: `w-4 h-4 ${loading ? "animate-spin text-plex" : ""}` })
            }
          )
        ] })
      ] }),
      loading && !formats.length ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "text-center py-12 text-muted", children: "Loading data from ARR..." }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex flex-col gap-8 mt-6", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("h4", { className: "text-md font-semibold text-text", children: [
              "Custom Formats (",
              formats.length,
              ")"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
              "button",
              {
                onClick: () => setEditingFormat({ show: true, format: null }),
                className: "text-xs bg-plex/20 text-plex hover:bg-plex hover:text-background px-3 py-1.5 rounded-lg flex items-center gap-2 font-semibold transition-colors",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Plus, { className: "w-3 h-3" }),
                  "New Format"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: formats.slice((formatPage - 1) * pageSize, formatPage * pageSize).map((f) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
            "div",
            {
              onClick: () => setEditingFormat({ show: true, format: f }),
              className: "bg-background border border-border p-4 rounded-lg flex flex-col justify-between group cursor-pointer hover:border-plex transition-colors",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "font-semibold text-sm text-text truncate", children: f.name }),
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(PenLine, { className: "w-3 h-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "text-xs text-muted mt-1", children: [
                  f.specifications?.length || 0,
                  " conditions"
                ] })
              ]
            },
            f.id
          )) }),
          formats.length > pageSize && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center justify-center gap-2 mt-4", children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
              "button",
              {
                disabled: formatPage === 1,
                onClick: () => handleFormatPageChange(formatPage - 1),
                className: "px-3 py-1 bg-background border border-border rounded-lg text-sm text-muted hover:text-text disabled:opacity-50",
                children: "Previous"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "text-sm text-muted", children: [
              "Page ",
              formatPage,
              " of ",
              Math.ceil(formats.length / pageSize)
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
              "button",
              {
                disabled: formatPage >= Math.ceil(formats.length / pageSize),
                onClick: () => handleFormatPageChange(formatPage + 1),
                className: "px-3 py-1 bg-background border border-border rounded-lg text-sm text-muted hover:text-text disabled:opacity-50",
                children: "Next"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex items-center justify-between mb-4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("h4", { className: "text-md font-semibold text-text", children: [
            "Quality Profiles (",
            profiles.length,
            ")"
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: profiles.slice((profilePage - 1) * pageSize, profilePage * pageSize).map((p) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
            "div",
            {
              onClick: () => setEditingProfile({ show: true, profile: p }),
              className: "bg-background border border-border p-4 rounded-lg flex flex-col justify-between group cursor-pointer hover:border-plex transition-colors",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "font-semibold text-sm text-text truncate", children: p.name }),
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(PenLine, { className: "w-3 h-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "text-xs text-muted mt-1", children: [
                  p.formatItems?.filter((f) => f.score !== 0).length || 0,
                  " active custom formats"
                ] })
              ]
            },
            p.id
          )) }),
          profiles.length > pageSize && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center justify-center gap-2 mt-4", children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
              "button",
              {
                disabled: profilePage === 1,
                onClick: () => handleProfilePageChange(profilePage - 1),
                className: "px-3 py-1 bg-background border border-border rounded-lg text-sm text-muted hover:text-text disabled:opacity-50",
                children: "Previous"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "text-sm text-muted", children: [
              "Page ",
              profilePage,
              " of ",
              Math.ceil(profiles.length / pageSize)
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
              "button",
              {
                disabled: profilePage >= Math.ceil(profiles.length / pageSize),
                onClick: () => handleProfilePageChange(profilePage + 1),
                className: "px-3 py-1 bg-background border border-border rounded-lg text-sm text-muted hover:text-text disabled:opacity-50",
                children: "Next"
              }
            )
          ] })
        ] })
      ] })
    ] }),
    editingFormat.show && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      UpgraderCustomFormatModal,
      {
        format: editingFormat.format,
        instanceId: selectedInstanceId,
        onClose: () => setEditingFormat({ show: false, format: null }),
        onSave: handleSaveFormat
      }
    ),
    editingProfile.show && editingProfile.profile && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      UpgraderQualityProfileModal,
      {
        profile: editingProfile.profile,
        formats,
        onClose: () => setEditingProfile({ show: false, profile: null }),
        onSave: handleSaveProfile
      }
    )
  ] });
};

// client/upgrader/upgraderUrlState.ts
var VALID_TABS = /* @__PURE__ */ new Set(["browse", "history", "exclusions", "profiles"]);
var splitList = (raw) => raw ? raw.split(",").map((v) => v.trim()).filter(Boolean) : [];
var parseUpgraderUrl = (search = "") => {
  const params = new URLSearchParams(search);
  const tabRaw = params.get("tab");
  const tab = VALID_TABS.has(tabRaw) ? tabRaw : "browse";
  return {
    tab,
    browse: {
      codecs: splitList(params.get("codecs")),
      resolutions: splitList(params.get("resolutions")),
      features: splitList(params.get("features")),
      qualities: splitList(params.get("qualities")),
      library: params.get("library") || "all",
      type: params.get("type") || "all",
      sort: params.get("sort") || "sizeGB",
      search: params.get("search") || "",
      page: Math.max(1, Number(params.get("page")) || 1)
    },
    profiles: {
      instance: params.get("instance") || "",
      formatPage: Math.max(1, Number(params.get("formatPage")) || 1),
      profilePage: Math.max(1, Number(params.get("profilePage")) || 1)
    }
  };
};
var buildUpgraderSearch = (state) => {
  const params = new URLSearchParams();
  if (state.tab !== "browse") params.set("tab", state.tab);
  if (state.tab === "browse") {
    const b = state.browse;
    if (b.codecs.length) params.set("codecs", b.codecs.join(","));
    if (b.resolutions.length) params.set("resolutions", b.resolutions.join(","));
    if (b.features.length) params.set("features", b.features.join(","));
    if (b.qualities.length) params.set("qualities", b.qualities.join(","));
    if (b.library !== "all") params.set("library", b.library);
    if (b.type !== "all") params.set("type", b.type);
    if (b.sort !== "sizeGB") params.set("sort", b.sort);
    if (b.search) params.set("search", b.search);
    if (b.page > 1) params.set("page", String(b.page));
  } else if (state.tab === "profiles") {
    const p = state.profiles;
    if (p.instance) params.set("instance", p.instance);
    if (p.formatPage > 1) params.set("formatPage", String(p.formatPage));
    if (p.profilePage > 1) params.set("profilePage", String(p.profilePage));
  }
  return params.toString();
};
var buildUpgraderPath = (state) => {
  const qs = buildUpgraderSearch(state);
  return qs ? `${portalUrl("/upgrader")}?${qs}` : portalUrl("/upgrader");
};
var replaceUpgraderUrl = (state) => {
  const next = buildUpgraderPath(state);
  const current = `${window.location.pathname}${window.location.search}`;
  if (current !== next) {
    window.history.replaceState({ upgrader: true }, "", next);
  }
};
var readUpgraderUrl = () => parseUpgraderUrl(typeof window !== "undefined" ? window.location.search : "");

// client/upgrader/UpgraderDashboard.tsx
var import_jsx_runtime10 = __toESM(require_jsx_runtime(), 1);
var SORT_OPTIONS = [
  { value: "sizeGB", label: "Largest first" },
  { value: "hevcFirst", label: "Largest HEVC first" },
  { value: "h264First", label: "Largest H.264 first" },
  { value: "av1First", label: "Largest AV1 first" },
  { value: "watchCount", label: "Most watched" },
  { value: "addedAt", label: "Recently added" },
  { value: "daysSinceAdded", label: "Oldest added" },
  { value: "staleAdded", label: "Stale (old + unwatched)" },
  { value: "title", label: "Title A\u2013Z" }
];
var isUpgradableItem = (item) => {
  if (item.mediaType === "show") {
    if ((item.totalEpisodeCount ?? 0) > 0) return (item.nonHevcEpisodeCount ?? 0) > 0;
    return !item.isHevc;
  }
  return !item.isHevc;
};
var readStoredSet = (key) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : /* @__PURE__ */ new Set();
  } catch {
    return /* @__PURE__ */ new Set();
  }
};
var formatIndexAge = (generatedAt) => {
  if (!generatedAt) return "never built";
  const ageMs = Date.now() - Date.parse(generatedAt);
  if (!Number.isFinite(ageMs) || ageMs < 0) return "just now";
  const hours = Math.floor(ageMs / (60 * 60 * 1e3));
  if (hours < 1) return "under 1h ago";
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};
var isUpgraderDisabledError = (error) => {
  const msg = String(error?.message || error || "").toLowerCase();
  return msg.includes("library upgrader is disabled") || msg.includes("plex-only");
};
var UpgraderDashboard = () => {
  const initialUrl = (0, import_react10.useMemo)(() => readUpgraderUrl(), []);
  const [toasts, setToasts] = (0, import_react10.useState)([]);
  const [loading, setLoading] = (0, import_react10.useState)(true);
  const [rebuilding, setRebuilding] = (0, import_react10.useState)(false);
  const [featureEnabled, setFeatureEnabled] = (0, import_react10.useState)(false);
  const [status, setStatus] = (0, import_react10.useState)(null);
  const [summary, setSummary] = (0, import_react10.useState)(null);
  const [queue, setQueue] = (0, import_react10.useState)(null);
  const [items, setItems] = (0, import_react10.useState)([]);
  const [total, setTotal] = (0, import_react10.useState)(0);
  const [libraries, setLibraries] = (0, import_react10.useState)([]);
  const [codecs, setCodecs] = (0, import_react10.useState)(() => {
    const fromUrl = initialUrl.browse.codecs;
    if (fromUrl.length) return new Set(fromUrl);
    return readStoredSet("upgrader_filters_codecs");
  });
  const [resolutions, setResolutions] = (0, import_react10.useState)(() => {
    const fromUrl = initialUrl.browse.resolutions;
    if (fromUrl.length) return new Set(fromUrl);
    return readStoredSet("upgrader_filters_resolutions");
  });
  const [features, setFeatures] = (0, import_react10.useState)(() => {
    const fromUrl = initialUrl.browse.features;
    if (fromUrl.length) return new Set(fromUrl);
    return readStoredSet("upgrader_filters_features");
  });
  const [qualities, setQualities] = (0, import_react10.useState)(() => {
    const fromUrl = initialUrl.browse.qualities;
    if (fromUrl.length) return new Set(fromUrl);
    return readStoredSet("upgrader_filters_qualities");
  });
  const [filtersExpanded, setFiltersExpanded] = (0, import_react10.useState)(() => {
    try {
      return window.localStorage.getItem("upgrader_filters_expanded") === "true";
    } catch {
      return false;
    }
  });
  const [presetReady, setPresetReady] = (0, import_react10.useState)(false);
  const [sort, setSort] = (0, import_react10.useState)(() => initialUrl.browse.sort || window.localStorage.getItem("upgrader_filters_sort") || "sizeGB");
  const [libraryId, setLibraryId] = (0, import_react10.useState)(() => initialUrl.browse.library || window.localStorage.getItem("upgrader_filters_library") || "all");
  const [mediaType, setMediaType] = (0, import_react10.useState)(() => initialUrl.browse.type || window.localStorage.getItem("upgrader_filters_type") || "all");
  const [search, setSearch] = (0, import_react10.useState)(initialUrl.browse.search);
  const [searchInput, setSearchInput] = (0, import_react10.useState)(initialUrl.browse.search);
  const [page, setPage] = (0, import_react10.useState)(initialUrl.browse.page);
  const [showQualityBadges, setShowQualityBadges] = (0, import_react10.useState)(true);
  const [selectedKeys, setSelectedKeys] = (0, import_react10.useState)(/* @__PURE__ */ new Set());
  const [upgradeItems, setUpgradeItems] = (0, import_react10.useState)([]);
  const [upgradeModalOpen, setUpgradeModalOpen] = (0, import_react10.useState)(false);
  const [activeTab, setActiveTab] = (0, import_react10.useState)(initialUrl.tab);
  const [profilesUrl, setProfilesUrl] = (0, import_react10.useState)(initialUrl.profiles);
  const [showDrawerItem, setShowDrawerItem] = (0, import_react10.useState)(null);
  const [drawerPosition, setDrawerPosition] = (0, import_react10.useState)("sidebar");
  const handleOpenDrawer = (0, import_react10.useCallback)((item) => {
    window.history.pushState({ drawerOpen: true }, "", window.location.href);
    setShowDrawerItem(item);
  }, []);
  const handleCloseDrawer = (0, import_react10.useCallback)(() => {
    if (window.history.state?.drawerOpen) {
      window.history.back();
    } else {
      setShowDrawerItem(null);
    }
  }, []);
  (0, import_react10.useEffect)(() => {
    const onPopState = (e) => {
      if (!e.state?.drawerOpen) {
        setShowDrawerItem(null);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  const [gridSize, setGridSize] = (0, import_react10.useState)(() => {
    if (typeof window === "undefined") return "medium";
    return normalizeUpgraderGridSize(window.localStorage.getItem(UPGRADER_GRID_SIZE_STORAGE_KEY));
  });
  (0, import_react10.useEffect)(() => {
    window.localStorage.setItem(UPGRADER_GRID_SIZE_STORAGE_KEY, gridSize);
    window.localStorage.setItem("upgrader_filters_codecs", JSON.stringify(Array.from(codecs)));
    window.localStorage.setItem("upgrader_filters_resolutions", JSON.stringify(Array.from(resolutions)));
    window.localStorage.setItem("upgrader_filters_features", JSON.stringify(Array.from(features)));
    window.localStorage.setItem("upgrader_filters_qualities", JSON.stringify(Array.from(qualities)));
    window.localStorage.setItem("upgrader_filters_expanded", String(filtersExpanded));
    window.localStorage.setItem("upgrader_filters_sort", sort);
    window.localStorage.setItem("upgrader_filters_library", libraryId);
    window.localStorage.setItem("upgrader_filters_type", mediaType);
  }, [gridSize, codecs, resolutions, features, qualities, filtersExpanded, sort, libraryId, mediaType]);
  const addToast = (0, import_react10.useCallback)((message, type = "success") => {
    setToasts((prev) => pushToast(prev, message, type));
  }, []);
  (0, import_react10.useEffect)(() => {
    apiFetch("/api/config").then((configData) => {
      const defaultSort = configData?.settings?.upgraderDefaultSort;
      const hasUrlSort = new URLSearchParams(window.location.search).has("sort");
      if (!hasUrlSort && !window.localStorage.getItem("upgrader_filters_sort") && defaultSort) {
        setSort(defaultSort);
      }
    }).catch(() => {
    }).finally(() => setPresetReady(true));
  }, []);
  const syncUpgraderUrl = (0, import_react10.useCallback)(() => {
    replaceUpgraderUrl({
      tab: activeTab,
      browse: {
        codecs: Array.from(codecs),
        resolutions: Array.from(resolutions),
        features: Array.from(features),
        qualities: Array.from(qualities),
        library: libraryId,
        type: mediaType,
        sort,
        search,
        page
      },
      profiles: profilesUrl
    });
  }, [activeTab, codecs, resolutions, features, qualities, libraryId, mediaType, sort, search, page, profilesUrl]);
  (0, import_react10.useEffect)(() => {
    syncUpgraderUrl();
  }, [syncUpgraderUrl]);
  (0, import_react10.useEffect)(() => {
    const onPopState = () => {
      const next = readUpgraderUrl();
      setActiveTab(next.tab);
      setCodecs(new Set(next.browse.codecs));
      setResolutions(new Set(next.browse.resolutions));
      setFeatures(new Set(next.browse.features));
      setQualities(new Set(next.browse.qualities));
      setLibraryId(next.browse.library);
      setMediaType(next.browse.type);
      setSort(next.browse.sort);
      setSearch(next.browse.search);
      setSearchInput(next.browse.search);
      setPage(next.browse.page);
      setProfilesUrl(next.profiles);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  const handleTabChange = (0, import_react10.useCallback)((tab) => {
    setActiveTab(tab);
  }, []);
  const handleProfilesUrlChange = (0, import_react10.useCallback)((patch) => {
    setProfilesUrl((prev) => ({ ...prev, ...patch }));
  }, []);
  const loadData = (0, import_react10.useCallback)(async (silent = false) => {
    if (!presetReady) return;
    if (!silent) setLoading(true);
    try {
      const configData = await apiFetch("/api/config");
      const enabled = !!configData?.settings?.upgraderEnabled;
      setFeatureEnabled(enabled);
      if (configData?.settings?.upgraderDrawerPosition) setDrawerPosition(configData.settings.upgraderDrawerPosition);
      if (!enabled) return;
      const [statusData, summaryData, itemsData, queueData, publicConfig] = await Promise.all([
        apiFetch("/api/upgrader/status"),
        apiFetch("/api/upgrader/summary"),
        apiFetch(`/api/upgrader/items?codecs=${encodeURIComponent(Array.from(codecs).join(","))}&resolutions=${encodeURIComponent(Array.from(resolutions).join(","))}&features=${encodeURIComponent(Array.from(features).join(","))}&qualities=${encodeURIComponent(Array.from(qualities).join(","))}&libraryId=${encodeURIComponent(libraryId)}&mediaType=${encodeURIComponent(mediaType)}&search=${encodeURIComponent(search)}&sort=${encodeURIComponent(sort)}&page=${page}&limit=48`),
        apiFetch("/api/upgrader/queue").catch(() => null),
        apiFetch("/api/config/public").catch(() => ({}))
      ]);
      setStatus(statusData || null);
      setSummary(summaryData || null);
      setQueue(queueData || null);
      setItems(Array.isArray(itemsData?.items) ? itemsData.items : []);
      setTotal(Number(itemsData?.total || 0));
      setLibraries(Array.isArray(itemsData?.libraries) ? itemsData.libraries : []);
      setShowQualityBadges(publicConfig?.showPosterQualityBadges !== false);
    } catch (e) {
      if (isUpgraderDisabledError(e)) {
        setFeatureEnabled(false);
        return;
      }
      addToast(e.message || "Failed to load upgrader data", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [addToast, libraryId, mediaType, page, codecs, resolutions, features, qualities, presetReady, search, sort]);
  (0, import_react10.useEffect)(() => {
    loadData();
  }, [loadData]);
  (0, import_react10.useEffect)(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  (0, import_react10.useEffect)(() => {
    setSelectedKeys(/* @__PURE__ */ new Set());
  }, [codecs, resolutions, features, qualities, libraryId, mediaType, search, page, sort]);
  (0, import_react10.useEffect)(() => {
    if (status?.rebuildInProgress) {
      setRebuilding(true);
    } else if (rebuilding) {
      setRebuilding(false);
    }
  }, [status?.rebuildInProgress]);
  (0, import_react10.useEffect)(() => {
    if (!rebuilding && !status?.rebuildInProgress) return void 0;
    const poll = window.setInterval(() => {
      loadData(true);
    }, 2500);
    return () => window.clearInterval(poll);
  }, [rebuilding, status?.rebuildInProgress, loadData]);
  const handleRebuild = async () => {
    try {
      await apiFetch("/api/upgrader/rebuild", { method: "POST" });
      addToast("Library index rebuild started.", "success");
      setRebuilding(true);
      await loadData(true);
    } catch (e) {
      addToast(e.message || "Failed to rebuild index", "error");
    }
  };
  const openUpgradeModal = (targets) => {
    if (!status?.automationEnabled) {
      addToast("Enable Upgrader automation in Settings first.", "error");
      return;
    }
    if (!status?.profileMapConfigured) {
      addToast("Configure HEVC quality profiles per ARR instance in Settings.", "error");
      return;
    }
    const upgradable = targets.filter((item) => isUpgradableItem(item));
    if (!upgradable.length) {
      addToast("No valid titles selected.", "error");
      return;
    }
    setUpgradeItems(upgradable);
    setUpgradeModalOpen(true);
  };
  const toggleSelected = (ratingKey) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(ratingKey)) next.delete(ratingKey);
      else next.add(ratingKey);
      return next;
    });
  };
  const handleSnooze = async (item, days = 30) => {
    try {
      await apiFetch("/api/upgrader/snooze", {
        method: "POST",
        body: JSON.stringify({ ratingKey: item.ratingKey, days })
      });
      addToast(`Snoozed \u201C${item.title}\u201D for ${days} days.`, "success");
      await loadData(true);
    } catch (e) {
      addToast(e.message || "Failed to snooze title", "error");
    }
  };
  const mediaServerLabel = status?.mediaServerType === "jellyfin" ? "Jellyfin" : "Plex";
  const selectedItems = (0, import_react10.useMemo)(
    () => items.filter((item) => selectedKeys.has(item.ratingKey)),
    [items, selectedKeys]
  );
  const summaryChips = (0, import_react10.useMemo)(() => {
    if (!summary) return [];
    const chips = [
      `${summary.totalItems} titles indexed`,
      `index ${formatIndexAge(summary.generatedAt)}`
    ];
    if (summary.estimatedReclaimableGB > 0) {
      chips.push(`~${summary.estimatedReclaimableGB} GB reclaimable`);
    }
    if (status?.automationEnabled) {
      chips.push(`${status.recentUpgradeCount}/${status.maxActionsPerHour} upgrades this hour`);
    }
    return chips;
  }, [summary, status]);
  const totalPages = Math.max(1, Math.ceil(total / 48));
  const automationReady = !!status?.automationEnabled && !!status?.profileMapConfigured;
  const tabButtonClass = (tab) => `inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${activeTab === tab ? "bg-plex text-background border-plex" : "bg-white/5 text-muted border-white/10 hover:text-text"}`;
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "w-full flex flex-col gap-6 pb-8", children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(ToastContainer, { toasts, setToasts }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
      UpgraderUpgradeModal,
      {
        isOpen: upgradeModalOpen,
        items: upgradeItems,
        onClose: () => setUpgradeModalOpen(false),
        onCompleted: () => loadData(true),
        addToast
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
      UpgraderShowDrawer,
      {
        show: showDrawerItem,
        codecs: Array.from(codecs),
        resolutions: Array.from(resolutions),
        features: Array.from(features),
        qualities: Array.from(qualities),
        onClose: handleCloseDrawer,
        addToast,
        automationReady,
        onProfileChanged: () => loadData(true),
        position: drawerPosition
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex flex-col gap-6", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex flex-col md:flex-row md:items-start md:justify-between gap-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex items-center gap-3 mb-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(CircleArrowUp, { className: "w-8 h-8 text-plex" }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("h1", { className: "page-title", children: "Upgrader" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "text-sm text-muted max-w-2xl", children: "Browse your Sonarr and Radarr libraries, filter by codec and quality, drill into series episodes, change quality profiles, and trigger searches." })
        ] }),
        featureEnabled && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
          "button",
          {
            type: "button",
            className: "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-plex text-background font-bold hover:bg-plex-hover transition-colors disabled:opacity-50",
            onClick: handleRebuild,
            disabled: rebuilding || !!status?.rebuildInProgress,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(RefreshCw, { className: `w-4 h-4 ${rebuilding || status?.rebuildInProgress ? "animate-spin" : ""}` }),
              rebuilding || status?.rebuildInProgress ? "Rebuilding\u2026" : "Rebuild Index"
            ]
          }
        )
      ] }),
      !featureEnabled && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-center", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("h3", { className: "text-xl font-bold text-plex mb-2", children: "Upgrader Disabled" }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "text-sm text-muted mb-3", children: "Library Upgrader is currently OFF." }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "text-xs text-muted mb-4", children: "Enable it in Settings \u2192 Library Upgrader, then click Save Settings." }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
          "a",
          {
            href: portalUrl("/settings#upgrader"),
            className: "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-plex text-background font-bold no-underline hover:bg-plex-hover transition-colors",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Settings, { className: "w-4 h-4" }),
              "Open Settings"
            ]
          }
        )
      ] }),
      featureEnabled && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
        summaryChips.length > 0 && activeTab === "browse" && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex flex-wrap gap-2", children: [
          summaryChips.map((chip) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "text-xs font-semibold px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-text", children: chip }, chip)),
          !status?.arrConfigured && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "text-xs font-semibold px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-200", children: "No Sonarr/Radarr instances configured" }),
          status?.arrConfigured && status.automationEnabled && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "text-xs font-semibold px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400", children: "Automation is ON" }),
          status?.arrConfigured && !status.automationEnabled && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "text-xs font-semibold px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400", children: "Manual Upgrades only" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { type: "button", className: tabButtonClass("browse"), onClick: () => handleTabChange("browse"), children: "Browse" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("button", { type: "button", className: tabButtonClass("history"), onClick: () => handleTabChange("history"), children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(History, { className: "w-4 h-4" }),
            "History"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("button", { type: "button", className: tabButtonClass("exclusions"), onClick: () => handleTabChange("exclusions"), children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Ban, { className: "w-4 h-4" }),
            "Exclusions"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("button", { type: "button", className: tabButtonClass("profiles"), onClick: () => handleTabChange("profiles"), children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Settings2, { className: "w-4 h-4" }),
            "Profiles"
          ] })
        ] }),
        activeTab === "history" && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(UpgraderHistoryPanel, {}),
        activeTab === "exclusions" && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(UpgraderExclusionsPanel, { addToast, onChanged: () => loadData(true) }),
        activeTab === "profiles" && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
          UpgraderProfilesTab,
          {
            initialInstanceId: profilesUrl.instance,
            initialFormatPage: profilesUrl.formatPage,
            initialProfilePage: profilesUrl.profilePage,
            onUrlStateChange: handleProfilesUrlChange
          }
        ),
        activeTab === "browse" && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
          queue && queue.totalQueued > 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "rounded-xl border border-border/60 bg-card/40 px-4 py-3 flex flex-wrap items-center gap-3", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex items-center gap-2 text-sm font-semibold text-text", children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Layers, { className: "w-4 h-4 text-plex" }),
              "ARR queue: ",
              queue.totalQueued,
              " active"
            ] }),
            queue.instances.filter((entry) => entry.total > 0).map((entry) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("span", { className: "text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-muted", children: [
              entry.instanceName,
              ": ",
              entry.total
            ] }, entry.instanceId))
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex flex-col gap-4 p-4 rounded-2xl border border-border/60 bg-card/40", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex flex-col w-full", children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
                "button",
                {
                  type: "button",
                  onClick: () => setFiltersExpanded(!filtersExpanded),
                  className: "lg:hidden w-full py-2 mb-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors",
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Funnel, { className: "w-4 h-4" }),
                    filtersExpanded ? "Hide Filters" : "Show Filters"
                  ]
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: `flex flex-row flex-wrap items-start gap-x-8 gap-y-3 ${filtersExpanded ? "flex" : "hidden lg:flex"}`, children: [
                /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex flex-wrap items-center justify-center lg:justify-start gap-2", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "text-xs font-bold text-muted uppercase tracking-wider mr-1 hidden lg:inline", children: "Codec:" }),
                  UPGRADER_CODEC_OPTIONS.map((option) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                    "button",
                    {
                      type: "button",
                      onClick: () => {
                        setCodecs((prev) => {
                          const next = new Set(prev);
                          if (next.has(option.id)) next.delete(option.id);
                          else next.add(option.id);
                          return next;
                        });
                        setPage(1);
                      },
                      className: `px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${codecs.has(option.id) ? "bg-plex text-background border-plex" : "bg-white/5 text-muted border-white/10 hover:text-text"}`,
                      children: option.label
                    },
                    option.id
                  ))
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex flex-wrap items-center justify-center lg:justify-start gap-2", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "text-xs font-bold text-muted uppercase tracking-wider mr-1 hidden lg:inline", children: "Resolution:" }),
                  UPGRADER_RESOLUTION_OPTIONS.map((option) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                    "button",
                    {
                      type: "button",
                      onClick: () => {
                        setResolutions((prev) => {
                          const next = new Set(prev);
                          if (next.has(option.id)) next.delete(option.id);
                          else next.add(option.id);
                          return next;
                        });
                        setPage(1);
                      },
                      className: `px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${resolutions.has(option.id) ? "bg-plex text-background border-plex" : "bg-white/5 text-muted border-white/10 hover:text-text"}`,
                      children: option.label
                    },
                    option.id
                  ))
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex flex-wrap items-center justify-center lg:justify-start gap-2", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "text-xs font-bold text-muted uppercase tracking-wider mr-1 hidden lg:inline", children: "Features:" }),
                  UPGRADER_FEATURE_OPTIONS.map((option) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                    "button",
                    {
                      type: "button",
                      onClick: () => {
                        setFeatures((prev) => {
                          const next = new Set(prev);
                          if (next.has(option.id)) next.delete(option.id);
                          else next.add(option.id);
                          return next;
                        });
                        setPage(1);
                      },
                      className: `px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${features.has(option.id) ? "bg-plex text-background border-plex" : "bg-white/5 text-muted border-white/10 hover:text-text"}`,
                      children: option.label
                    },
                    option.id
                  ))
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex flex-wrap items-center justify-center lg:justify-start gap-2", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "text-xs font-bold text-muted uppercase tracking-wider mr-1 hidden lg:inline", children: "Quality:" }),
                  UPGRADER_QUALITY_OPTIONS.map((option) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                    "button",
                    {
                      type: "button",
                      onClick: () => {
                        setQualities((prev) => {
                          const next = new Set(prev);
                          if (next.has(option.id)) next.delete(option.id);
                          else next.add(option.id);
                          return next;
                        });
                        setPage(1);
                      },
                      className: `px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${qualities.has(option.id) ? "bg-plex text-background border-plex" : "bg-white/5 text-muted border-white/10 hover:text-text"}`,
                      children: option.label
                    },
                    option.id
                  ))
                ] })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: `flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full pt-4 border-t border-white/5 ${filtersExpanded ? "flex" : "hidden lg:flex"}`, children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                CustomSelect,
                {
                  value: gridSize,
                  onChange: (value) => setGridSize(normalizeUpgraderGridSize(value)),
                  options: UPGRADER_GRID_SIZE_OPTIONS,
                  className: "flex-1 w-full sm:w-auto min-w-[140px]"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                CustomSelect,
                {
                  value: sort,
                  onChange: (value) => {
                    setSort(value);
                    setPage(1);
                  },
                  options: SORT_OPTIONS,
                  className: "flex-1 w-full sm:w-auto min-w-[140px]"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                CustomSelect,
                {
                  value: libraryId,
                  onChange: (value) => {
                    setLibraryId(value);
                    setPage(1);
                  },
                  options: [{ value: "all", label: "All instances" }, ...libraries.map((lib) => ({ value: lib.id, label: `${lib.title} (${lib.count})` }))],
                  className: "flex-1 w-full sm:w-auto min-w-[140px]"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                CustomSelect,
                {
                  value: mediaType,
                  onChange: (value) => {
                    setMediaType(value);
                    setPage(1);
                  },
                  options: [
                    { value: "all", label: "Movies & shows" },
                    { value: "movie", label: "Movies only" },
                    { value: "show", label: "Shows only" }
                  ],
                  className: "flex-1 w-full sm:w-auto min-w-[140px]"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "relative flex-1 w-full sm:w-auto min-w-[140px]", children: [
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" }),
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                  "input",
                  {
                    type: "search",
                    value: searchInput,
                    onChange: (e) => setSearchInput(e.target.value),
                    placeholder: "Search titles\u2026",
                    className: "w-full pl-9 pr-3 py-2 h-[38px] rounded-lg border border-border bg-background text-text text-sm outline-none focus:border-plex"
                  }
                )
              ] })
            ] })
          ] }),
          automationReady && selectedItems.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-plex/30 bg-plex/10 px-4 py-3 backdrop-blur-md", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("span", { className: "text-sm font-semibold text-text", children: [
              selectedItems.length,
              " selected"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { type: "button", className: "px-3 py-1.5 rounded-lg border border-border text-xs font-bold", onClick: () => setSelectedKeys(/* @__PURE__ */ new Set()), children: "Clear" }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
                "button",
                {
                  type: "button",
                  className: "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-plex text-background text-xs font-bold",
                  onClick: () => openUpgradeModal(selectedItems),
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(ArrowUpFromLine, { className: "w-3.5 h-3.5" }),
                    "Upgrade selected"
                  ]
                }
              )
            ] })
          ] }),
          loading ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Loader, { isLoading: true }) : (status?.itemCount ?? 0) === 0 ? /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-8 text-center", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("h3", { className: "text-xl font-bold text-yellow-200 mb-2", children: "Index empty \u2014 rebuild from Sonarr/Radarr" }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "text-sm text-muted mb-4", children: "Upgrader reads directly from your Sonarr and Radarr libraries. Click Rebuild Index to populate the browse grid." }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
              "button",
              {
                type: "button",
                className: "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-plex text-background font-bold",
                onClick: handleRebuild,
                disabled: rebuilding || !!status?.rebuildInProgress,
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(RefreshCw, { className: `w-4 h-4 ${rebuilding ? "animate-spin" : ""}` }),
                  "Rebuild Index"
                ]
              }
            )
          ] }) : total === 0 ? /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "rounded-2xl border border-border/60 bg-card/40 p-8 text-center", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("h3", { className: "text-xl font-bold text-text mb-2", children: "No matches for this filter" }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "text-sm text-muted", children: "Try another preset, instance, or search term." })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { className: "text-xs text-muted", children: [
              total,
              " title",
              total === 1 ? "" : "s",
              " \xB7 page ",
              page,
              " of ",
              totalPages
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: upgraderPosterGridClass(gridSize), style: upgraderPosterGridStyle(gridSize), children: items.map((item) => {
              const canUpgrade = automationReady && isUpgradableItem(item);
              const isSelected = selectedKeys.has(item.ratingKey);
              const isShow = item.mediaType === "show";
              const epCount = item.matchedEpisodeCount ?? item.nonHevcEpisodeCount ?? 0;
              const isCodecFiltered = codecs.size > 0 || features.has("non_hevc");
              const codecLabel = item.videoCodec ? item.videoCodec.match(/^(h|x)26[45]$/i) ? item.videoCodec.toLowerCase() : item.videoCodec.toUpperCase() : "";
              const showCodecLabel = isShow ? isCodecFiltered ? codecLabel : "" : codecLabel;
              let gridBadgeText = "";
              let listBadgeText = "";
              if (isShow) {
                const codecc = item.codecCounts || {};
                const ressc = item.resCounts || {};
                const parts = [];
                Object.entries(codecc).sort((a, b) => b[1] - a[1]).forEach(([c, count]) => {
                  const label = c.match(/^(h|x)26[45]$/i) ? c.toLowerCase() : c.toUpperCase();
                  parts.push(`${count} ${label} eps`);
                });
                Object.entries(ressc).sort((a, b) => b[1] - a[1]).forEach(([r, count]) => {
                  let label = "SD";
                  if (r === "1080") label = "1080p";
                  else if (r === "720") label = "720p";
                  else if (r === "4k") label = "4K";
                  parts.push(`${count} ${label} eps`);
                });
                const snapshot = parts.join(" | ");
                if (epCount > 0 && showCodecLabel) gridBadgeText = `${epCount} ${showCodecLabel} eps`;
                else if (epCount > 0) gridBadgeText = `${epCount} eps`;
                else if (showCodecLabel) gridBadgeText = `${showCodecLabel} eps`;
                else gridBadgeText = "Episodes";
                if (epCount === 1) gridBadgeText = gridBadgeText.replace("eps", "ep");
                listBadgeText = snapshot || gridBadgeText;
              } else {
                gridBadgeText = showCodecLabel || "UNKNOWN";
                listBadgeText = gridBadgeText;
              }
              let dominantCodecPercentageLabel = "";
              let dominantCodecColorClass = "bg-white/10 border-white/20 text-gray-300";
              if (isShow && item.totalEpisodeCount > 0) {
                const totalEps = item.totalEpisodeCount;
                const codecc = item.codecCounts || {};
                const sortedCodecs = Object.entries(codecc).sort((a, b) => b[1] - a[1]);
                if (sortedCodecs.length > 0) {
                  const [dominantCodec, count] = sortedCodecs[0];
                  const percent = Math.round(count / totalEps * 100);
                  const label = dominantCodec.match(/^(h|x)26[45]$/i) ? dominantCodec.toLowerCase() : dominantCodec.toUpperCase();
                  dominantCodecPercentageLabel = `${percent}% ${label}`;
                  if (label.includes("265") || label.includes("hevc") || label.includes("HEVC") || label.includes("AV1")) {
                    dominantCodecColorClass = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                  } else if (label.includes("264") || label.includes("AVC")) {
                    dominantCodecColorClass = "bg-amber-500/10 border-amber-500/20 text-amber-400";
                  } else {
                    dominantCodecColorClass = "bg-blue-500/10 border-blue-500/20 text-blue-400";
                  }
                } else {
                  const nonHevcEps = item.nonHevcEpisodeCount || 0;
                  const hevcEps = Math.max(0, totalEps - nonHevcEps);
                  if (hevcEps >= nonHevcEps) {
                    const percent = Math.round(hevcEps / totalEps * 100);
                    dominantCodecPercentageLabel = `${percent}% HEVC`;
                    dominantCodecColorClass = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                  } else {
                    const percent = Math.round(nonHevcEps / totalEps * 100);
                    const fallbackCodec = item.videoCodec && !item.videoCodec.toLowerCase().includes("hevc") && !item.videoCodec.toLowerCase().includes("265") ? item.videoCodec.match(/^(h|x)26[45]$/i) ? item.videoCodec.toLowerCase() : item.videoCodec.toUpperCase() : "H264";
                    dominantCodecPercentageLabel = `${percent}% ${fallbackCodec}`;
                    if (fallbackCodec.includes("AV1") || fallbackCodec.includes("AV01")) {
                      dominantCodecColorClass = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                    } else {
                      dominantCodecColorClass = "bg-amber-500/10 border-amber-500/20 text-amber-400";
                    }
                  }
                }
              }
              const sizesToShow = [];
              if (isShow && item.codecSizesGB && codecs.size > 0) {
                for (const reqCodec of Array.from(codecs)) {
                  let sizeForCodec = 0;
                  for (const [actualCodec, sizeGB] of Object.entries(item.codecSizesGB)) {
                    const actUpper = actualCodec.toUpperCase();
                    let familyStr = "other";
                    if (actUpper.includes("AV1") || actUpper.includes("AV01")) familyStr = "av1";
                    else if (actUpper.includes("HEVC") || actUpper.includes("265")) familyStr = "hevc";
                    else if (actUpper.includes("AVC") || actUpper.includes("264")) familyStr = "h264";
                    else if (actUpper.includes("VP9")) familyStr = "vp9";
                    if (familyStr === reqCodec) {
                      sizeForCodec += sizeGB;
                    }
                  }
                  if (sizeForCodec > 0) {
                    const displayCodec = reqCodec.match(/^(h|x)26[45]$/i) ? reqCodec.toLowerCase() : reqCodec.toUpperCase();
                    sizesToShow.push({ label: `${displayCodec} eps`, sizeGB: sizeForCodec });
                  }
                }
              }
              if (sizesToShow.length === 0 && isShow && codecs.size > 0 && item.sizeGB > 0) {
                const totalSize = item.sizeGB || 0;
                const nonHevcSize = item.nonHevcEpisodeSizeGB || 0;
                const hevcSize = Math.max(0, totalSize - nonHevcSize);
                if (codecs.has("h264") && nonHevcSize > 0) {
                  sizesToShow.push({ label: "h264 eps", sizeGB: nonHevcSize });
                }
                if (codecs.has("hevc") && hevcSize > 0) {
                  sizesToShow.push({ label: "HEVC eps", sizeGB: hevcSize });
                }
              }
              if (sizesToShow.length === 0 && (item.mediaType === "show" && (item.nonHevcEpisodeSizeGB ?? 0) > 0 || item.sizeGB > 0)) {
                const label = item.mediaType === "show" ? showCodecLabel ? `${showCodecLabel.toUpperCase()} eps` : "" : "";
                sizesToShow.push({
                  label,
                  sizeGB: item.mediaType === "show" ? item.nonHevcEpisodeSizeGB ?? 0 : item.sizeGB
                });
              }
              if (gridSize === "list") {
                return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex flex-col sm:flex-row gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors relative", children: [
                  automationReady && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "absolute top-2 left-2 z-20", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                    OverlayCheckbox,
                    {
                      checked: isSelected,
                      onChange: () => toggleSelected(item.ratingKey),
                      size: "md",
                      title: isSelected ? "Deselect" : "Select for upgrade"
                    }
                  ) }),
                  /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "w-full sm:w-24 shrink-0 aspect-[2/3] sm:aspect-auto sm:h-36 rounded-md overflow-hidden bg-black/50 relative border border-white/5 cursor-pointer", onClick: isShow ? () => handleOpenDrawer(item) : void 0, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("img", { src: item.thumbUrl ? resolvePortalAssetUrl(item.thumbUrl) : item.thumb ? portalUrl(`/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=200&height=300`) : item.posterFallbackUrl ? resolvePortalAssetUrl(item.posterFallbackUrl) : "", alt: item.title, className: "w-full h-full object-cover" }),
                    showQualityBadges && item.displayTags && item.displayTags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "absolute bottom-1 left-1 right-1 flex flex-wrap gap-0.5 pointer-events-none z-10", children: item.displayTags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "text-[8px] font-bold px-1 py-px rounded bg-black/85 text-white/95 border border-white/15 uppercase tracking-wide", children: tag }, tag)) })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex-1 min-w-0 flex flex-col justify-center gap-1", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex items-start justify-between gap-4", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { children: [
                        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
                          "button",
                          {
                            type: "button",
                            className: `text-lg font-bold text-white line-clamp-1 text-left ${isShow ? "hover:text-plex transition-colors" : "cursor-default"}`,
                            onClick: isShow ? () => handleOpenDrawer(item) : void 0,
                            children: [
                              item.title,
                              item.year ? ` (${item.year})` : ""
                            ]
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex flex-wrap gap-2 mt-2", children: [
                          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "px-2 py-0.5 rounded-md bg-white/10 border border-white/5 text-xs font-semibold text-gray-300", children: item.arrInstanceName || (item.arrType === "radarr" ? "Radarr" : "Sonarr") }),
                          sizesToShow.map((s, idx) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "px-2 py-0.5 rounded-md bg-white/10 border border-white/5 text-xs font-semibold text-gray-300", children: `${s.sizeGB < 1 ? Math.round(s.sizeGB * 1024) + " MB" : Math.round(s.sizeGB * 100) / 100 + " GB"}${s.label ? ` (${s.label})` : ""}` }, idx)),
                          dominantCodecPercentageLabel && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: `px-2 py-0.5 rounded-md border text-xs font-semibold ${dominantCodecColorClass}`, children: dominantCodecPercentageLabel })
                        ] })
                      ] }),
                      listBadgeText && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                        "button",
                        {
                          type: "button",
                          onClick: isShow ? () => handleOpenDrawer(item) : void 0,
                          className: `shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-black/75 border border-white/20 text-amber-200 ${isShow ? "hover:border-plex/50 cursor-pointer" : "cursor-default"}`,
                          children: listBadgeText
                        }
                      )
                    ] }),
                    item.overview && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "mt-2 text-xs text-muted line-clamp-2 md:line-clamp-3", children: item.overview }),
                    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "mt-auto pt-3 flex flex-wrap items-center gap-4", children: [
                      isShow && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                        "button",
                        {
                          type: "button",
                          className: "text-xs font-bold text-gray-300 hover:text-white transition-colors",
                          onClick: () => handleOpenDrawer(item),
                          children: "View Episodes"
                        }
                      ),
                      item.arrDeepUrl && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
                        "a",
                        {
                          href: item.arrDeepUrl,
                          target: "_blank",
                          rel: "noreferrer",
                          className: "text-xs font-bold text-plex hover:text-orange-400 transition-colors",
                          children: [
                            "Open in ",
                            item.arrType === "radarr" ? "Radarr" : "Sonarr"
                          ]
                        }
                      )
                    ] })
                  ] })
                ] }, item.ratingKey);
              }
              const checkboxSize = gridSize === "small" || gridSize === "medium" ? "sm" : "md";
              return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "relative min-w-0", children: [
                automationReady && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "absolute top-1.5 left-1.5 z-20 upgrader-card-select", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                  OverlayCheckbox,
                  {
                    checked: isSelected,
                    onChange: () => toggleSelected(item.ratingKey),
                    size: checkboxSize,
                    title: isSelected ? "Deselect" : "Select for upgrade"
                  }
                ) }),
                gridBadgeText && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                  "button",
                  {
                    type: "button",
                    onClick: isShow ? () => handleOpenDrawer(item) : void 0,
                    className: `absolute top-2 right-2 z-20 upgrader-card-badge text-[10px] font-bold px-2 py-1 rounded-full bg-black/75 border border-white/20 text-amber-200 ${isShow ? "hover:border-plex/50 cursor-pointer" : "cursor-default"}`,
                    children: gridBadgeText
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                  DiscoverPosterCard,
                  {
                    variant: "home",
                    posterOnlyLink: true,
                    onPosterClick: isShow ? () => handleOpenDrawer(item) : void 0,
                    showQualityBadges,
                    posterWidth: 600,
                    posterHeight: 900,
                    item: {
                      title: item.title,
                      thumb: item.thumb,
                      thumbUrl: item.thumbUrl || void 0,
                      posterFallbackUrl: item.posterFallbackUrl || void 0,
                      plexUrl: item.arrDeepUrl || "#",
                      tags: item.displayTags,
                      year: item.year ?? void 0
                    },
                    footer: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "px-1 space-y-1", children: [
                      isShow ? /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
                        "button",
                        {
                          type: "button",
                          className: "upgrader-card-title text-xs font-medium text-text line-clamp-2 leading-tight text-left hover:text-plex transition-colors",
                          onClick: () => handleOpenDrawer(item),
                          children: [
                            item.title,
                            item.year ? ` (${item.year})` : ""
                          ]
                        }
                      ) : /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "upgrader-card-title text-xs font-medium text-text line-clamp-2 leading-tight", children: [
                        item.title,
                        item.year ? ` (${item.year})` : ""
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "upgrader-card-meta flex flex-wrap gap-1.5 mt-2", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "px-1.5 py-0.5 rounded-md bg-white/10 border border-white/5 text-[10px] font-semibold text-gray-300", children: item.arrInstanceName || (item.arrType === "radarr" ? "Radarr" : "Sonarr") }),
                        sizesToShow.map((s, idx) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "px-1.5 py-0.5 rounded-md bg-white/10 border border-white/5 text-[10px] font-semibold text-gray-300", children: `${s.sizeGB < 1 ? Math.round(s.sizeGB * 1024) + " MB" : Math.round(s.sizeGB * 100) / 100 + " GB"}${s.label ? ` (${s.label})` : ""}` }, idx)),
                        dominantCodecPercentageLabel && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: `px-1.5 py-0.5 rounded-md border text-[10px] font-semibold ${dominantCodecColorClass}`, children: dominantCodecPercentageLabel })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "upgrader-card-actions flex flex-wrap gap-x-2 gap-y-1", children: [
                        isShow && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                          "button",
                          {
                            type: "button",
                            className: "text-[10px] font-bold text-muted hover:underline",
                            onClick: () => handleOpenDrawer(item),
                            children: gridBadgeText
                          }
                        ),
                        item.arrDeepUrl && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
                          "a",
                          {
                            href: item.arrDeepUrl,
                            target: "_blank",
                            rel: "noreferrer",
                            className: "inline-block text-[10px] font-bold text-plex hover:underline",
                            children: [
                              "Open in ",
                              item.arrType === "radarr" ? "Radarr" : "Sonarr"
                            ]
                          }
                        ),
                        canUpgrade && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                          "button",
                          {
                            type: "button",
                            onClick: (e) => {
                              e.stopPropagation();
                              openUpgradeModal([item]);
                            },
                            className: "text-[10px] font-bold text-plex hover:underline",
                            children: "Trigger Upgrade"
                          }
                        ),
                        automationReady && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
                          "button",
                          {
                            type: "button",
                            className: "inline-flex items-center gap-1 text-[10px] font-bold text-muted hover:text-text",
                            onClick: () => handleSnooze(item),
                            title: "Hide from Upgrader for 30 days",
                            children: [
                              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Clock, { className: "w-3 h-3" }),
                              "Snooze"
                            ]
                          }
                        )
                      ] })
                    ] })
                  }
                )
              ] }, item.ratingKey);
            }) }),
            totalPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex items-center justify-center gap-3", children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                "button",
                {
                  type: "button",
                  className: "px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40",
                  disabled: page <= 1,
                  onClick: () => setPage((p) => Math.max(1, p - 1)),
                  children: "Previous"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("span", { className: "text-sm text-muted", children: [
                page,
                " / ",
                totalPages
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                "button",
                {
                  type: "button",
                  className: "px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40",
                  disabled: page >= totalPages,
                  onClick: () => setPage((p) => Math.min(totalPages, p + 1)),
                  children: "Next"
                }
              )
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
};
export {
  UpgraderDashboard
};
