import {
  Check,
  CustomSelect,
  Film,
  LoaderCircle,
  StyledCheckbox,
  Tv,
  X,
  __toESM,
  apiFetch,
  require_jsx_runtime,
  require_react
} from "./chunk-5L3BF6DP.js";

// client/shared/format.ts
var formatDate = (dateString) => {
  if (!dateString) return "Never";
  return dateString.split("T")[0];
};
var getDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return null;
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const datePart = expiryDate.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  const expiry = new Date(year, month - 1, day);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.round(diffTime / (1e3 * 60 * 60 * 24));
};
var addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};
var addYears = (date, years) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
};
var getAccessProgressPct = (expiryDate, joiningDate) => {
  const daysLeft = getDaysUntilExpiry(expiryDate);
  if (daysLeft === null) return 100;
  if (expiryDate && joiningDate) {
    const join = new Date(joiningDate);
    join.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate.split("T")[0]);
    expiry.setHours(0, 0, 0, 0);
    const totalDays = Math.max(1, Math.round((expiry.getTime() - join.getTime()) / (1e3 * 60 * 60 * 24)));
    return Math.min(100, Math.max(0, daysLeft / totalDays * 100));
  }
  return Math.min(100, Math.max(0, daysLeft / 365 * 100));
};
var formatStreamingHour = (hour24) => {
  if (hour24 == null || Number.isNaN(hour24)) return "Unknown";
  const hour = Math.max(0, Math.min(23, Math.round(hour24)));
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:00 ${period}`;
};
var formatTime = (date) => {
  try {
    const is24 = typeof window !== "undefined" && window.__USE_24_HOUR_CLOCK__ === true;
    const str = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: !is24 });
    return is24 ? str : str.replace(/^0:/, "12:");
  } catch {
    return "--:--";
  }
};
var formatDateTime = (dateString) => {
  if (!dateString) return "Unknown";
  return new Date(dateString).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
};
var hexToRgb = (hex) => {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map((x) => x + x).join("");
  const r = parseInt(hex.slice(0, 2), 16) || 0;
  const g = parseInt(hex.slice(2, 4), 16) || 0;
  const b = parseInt(hex.slice(4, 6), 16) || 0;
  return `${r} ${g} ${b}`;
};
var accentHoverRgb = (hex) => {
  const [r, g, b] = hexToRgb(hex).split(" ").map(Number);
  const lift = (value) => Math.min(255, Math.round(value + (255 - value) * 0.18));
  return `${lift(r)} ${lift(g)} ${lift(b)}`;
};
var formatSizeCeil = (bytes) => {
  const safe = Math.max(0, Number(bytes) || 0);
  if (safe === 0) return "0 MB";
  const mb = safe / 1024 ** 2;
  const gb = safe / 1024 ** 3;
  const tb = safe / 1024 ** 4;
  const pb = safe / 1024 ** 5;
  if (pb >= 1) return `${Math.ceil(pb)} PB`;
  if (tb >= 1) return `${Math.ceil(tb)} TB`;
  if (gb >= 1) return `${Math.ceil(gb)} GB`;
  return `${Math.ceil(mb)} MB`;
};

// client/requests/RequestApprovalModal.tsx
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var formatBytes = (bytes) => {
  if (!bytes) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]} free`;
};
var seasonStatusLabel = (status, selected) => {
  if (!selected) return "Not selected";
  if (status === 1) return "Pending";
  if (status === 2) return "Approved";
  if (status === 3) return "Declined";
  return "Not requested";
};
var RequestApprovalModal = ({
  requestId,
  initialTitle,
  mode = "approve",
  onClose,
  onComplete,
  onError
}) => {
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [saving, setSaving] = (0, import_react.useState)(false);
  const [detail, setDetail] = (0, import_react.useState)(null);
  const [servers, setServers] = (0, import_react.useState)([]);
  const [serviceOptions, setServiceOptions] = (0, import_react.useState)(null);
  const [users, setUsers] = (0, import_react.useState)([]);
  const [optionsLoading, setOptionsLoading] = (0, import_react.useState)(false);
  const [serverId, setServerId] = (0, import_react.useState)(null);
  const [profileId, setProfileId] = (0, import_react.useState)(null);
  const [rootFolder, setRootFolder] = (0, import_react.useState)("");
  const [languageProfileId, setLanguageProfileId] = (0, import_react.useState)(null);
  const [userId, setUserId] = (0, import_react.useState)(null);
  const [selectedTags, setSelectedTags] = (0, import_react.useState)([]);
  const [selectedSeasons, setSelectedSeasons] = (0, import_react.useState)([]);
  const serviceType = detail?.type === "tv" ? "sonarr" : "radarr";
  const loadServiceOptions = (0, import_react.useCallback)(async (type, nextServerId) => {
    setOptionsLoading(true);
    try {
      const segment = type === "tv" ? "sonarr" : "radarr";
      const data = await apiFetch(`/api/requests/services/${segment}/${nextServerId}`);
      setServiceOptions(data);
    } catch (e) {
      onError(e?.message || "Failed to load service options");
      setServiceOptions(null);
    } finally {
      setOptionsLoading(false);
    }
  }, [onError]);
  (0, import_react.useEffect)(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [requestData, usersData] = await Promise.all([
          apiFetch(`/api/requests/${requestId}`),
          apiFetch("/api/requests/users").catch(() => ({ users: [] }))
        ]);
        if (cancelled) return;
        const nextDetail = requestData;
        setDetail(nextDetail);
        setUsers(Array.isArray(usersData?.users) ? usersData.users : []);
        const segment = nextDetail.type === "tv" ? "sonarr" : "radarr";
        const serversData = await apiFetch(`/api/requests/services/${segment}`);
        if (cancelled) return;
        const allServers = Array.isArray(serversData?.servers) ? serversData.servers : [];
        const filtered = allServers.filter((s) => s.is4k === nextDetail.is4k);
        setServers(filtered);
        const initialServerId = nextDetail.serverId ?? filtered.find((s) => s.isDefault)?.id ?? filtered[0]?.id ?? null;
        let nextServerId = initialServerId;
        let nextProfileId = nextDetail.profileId ?? null;
        let nextRootFolder = nextDetail.rootFolder || "";
        let nextLanguageProfileId = nextDetail.languageProfileId ?? null;
        let nextTags = Array.isArray(nextDetail.tags) ? nextDetail.tags : [];
        if (nextDetail.tmdbId) {
          try {
            const defaults = await apiFetch("/api/requests/override-defaults", {
              method: "POST",
              body: JSON.stringify({
                mediaType: nextDetail.type,
                tmdbId: nextDetail.tmdbId,
                userId: nextDetail.requestedBy?.id,
                is4k: nextDetail.is4k
              })
            });
            if (defaults?.serverId != null && nextDetail.serverId == null) nextServerId = defaults.serverId;
            if (defaults?.profileId != null && nextDetail.profileId == null) nextProfileId = defaults.profileId;
            if (defaults?.rootFolder && !nextDetail.rootFolder) nextRootFolder = defaults.rootFolder;
            if (defaults?.languageProfileId != null && nextDetail.languageProfileId == null) {
              nextLanguageProfileId = defaults.languageProfileId;
            }
            if (Array.isArray(defaults?.tags) && (!nextDetail.tags || nextDetail.tags.length === 0)) {
              nextTags = defaults.tags;
            }
          } catch {
          }
        }
        setServerId(nextServerId);
        setProfileId(nextProfileId);
        setRootFolder(nextRootFolder);
        setLanguageProfileId(nextLanguageProfileId);
        setSelectedTags(nextTags);
        setUserId(nextDetail.requestedBy?.id ?? null);
        setSelectedSeasons(
          nextDetail.type === "tv" ? (nextDetail.seasons || []).map((s) => s.seasonNumber) : []
        );
      } catch (e) {
        if (!cancelled) onError(e?.message || "Failed to load request");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestId, loadServiceOptions, onError]);
  (0, import_react.useEffect)(() => {
    if (!detail || serverId == null) return;
    loadServiceOptions(detail.type, serverId);
  }, [serverId, detail?.id, detail?.type, loadServiceOptions]);
  (0, import_react.useEffect)(() => {
    if (!serviceOptions || !detail) return;
    if (profileId == null && serviceOptions.profiles.length) {
      const defaultProfile = detail.isAnime && serviceOptions.server.activeAnimeProfileId ? serviceOptions.server.activeAnimeProfileId : serviceOptions.server.activeProfileId;
      setProfileId(defaultProfile ?? serviceOptions.profiles[0]?.id ?? null);
    }
    if (!rootFolder && serviceOptions.rootFolders.length) {
      const defaultFolder = detail.isAnime && serviceOptions.server.activeAnimeDirectory ? serviceOptions.server.activeAnimeDirectory : serviceOptions.server.activeDirectory;
      setRootFolder(defaultFolder || serviceOptions.rootFolders[0]?.path || "");
    }
    if (detail.type === "tv" && languageProfileId == null && serviceOptions.languageProfiles?.length) {
      const defaultLang = detail.isAnime && serviceOptions.server.activeAnimeLanguageProfileId ? serviceOptions.server.activeAnimeLanguageProfileId : serviceOptions.server.activeLanguageProfileId;
      setLanguageProfileId(defaultLang ?? serviceOptions.languageProfiles[0]?.id ?? null);
    }
  }, [serviceOptions, detail, profileId, rootFolder, languageProfileId]);
  const tvSeasonRows = (0, import_react.useMemo)(() => {
    if (!detail || detail.type !== "tv") return [];
    const catalog = detail.tvSeasons?.length ? detail.tvSeasons : (detail.seasons || []).map((s) => ({
      seasonNumber: s.seasonNumber,
      name: s.seasonNumber === 0 ? "Specials" : `Season ${s.seasonNumber}`,
      episodeCount: 0
    }));
    return catalog.map((season) => {
      const requestSeason = detail.seasons?.find((s) => s.seasonNumber === season.seasonNumber);
      return {
        ...season,
        requestStatus: requestSeason?.status ?? null,
        selected: selectedSeasons.includes(season.seasonNumber)
      };
    });
  }, [detail, selectedSeasons]);
  const overrides = (0, import_react.useMemo)(() => ({
    serverId: serverId ?? void 0,
    profileId: profileId ?? void 0,
    rootFolder: rootFolder || void 0,
    languageProfileId: detail?.type === "tv" ? languageProfileId ?? void 0 : void 0,
    userId: userId ?? void 0,
    tags: selectedTags,
    seasons: detail?.type === "tv" ? selectedSeasons : void 0
  }), [serverId, profileId, rootFolder, languageProfileId, userId, selectedTags, selectedSeasons, detail?.type]);
  const toggleSeason = (seasonNumber) => {
    setSelectedSeasons((prev) => prev.includes(seasonNumber) ? prev.filter((n) => n !== seasonNumber) : [...prev, seasonNumber].sort((a, b) => a - b));
  };
  const toggleTag = (tagId) => {
    setSelectedTags((prev) => prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]);
  };
  const handleSave = async (andApprove) => {
    if (!detail) return;
    if (detail.type === "tv" && selectedSeasons.length === 0) {
      onError("Select at least one season to approve");
      return;
    }
    setSaving(true);
    try {
      if (andApprove) {
        await apiFetch(`/api/requests/${requestId}/approve`, {
          method: "POST",
          body: JSON.stringify({ title: detail.title, overrides })
        });
        onComplete(`Approved "${detail.title}"`);
      } else {
        await apiFetch(`/api/requests/${requestId}`, {
          method: "PUT",
          body: JSON.stringify({ title: detail.title, overrides })
        });
        onComplete(`Updated "${detail.title}"`);
      }
      onClose();
    } catch (e) {
      onError(e?.message || (andApprove ? "Failed to approve request" : "Failed to update request"));
    } finally {
      setSaving(false);
    }
  };
  const title = detail?.title || initialTitle || "Request";
  const TypeIcon = detail?.type === "tv" ? Tv : Film;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "div",
    {
      className: "fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm",
      onClick: onClose,
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          className: "w-full max-w-6xl max-h-[90vh] overflow-y-auto glass-card p-5 md:p-6 shadow-2xl border border-border custom-scrollbar",
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-start justify-between gap-4 mb-4", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "min-w-0", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-muted text-xs uppercase tracking-widest font-semibold", children: mode === "approve" ? "Review & Approve" : "Edit Request" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: "text-xl font-bold text-text truncate", children: title }),
                detail?.requestedBy?.displayName && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "text-sm text-muted mt-1", children: [
                  "Requested by ",
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "text-text font-medium", children: detail.requestedBy.displayName }),
                  detail.is4k ? " \xB7 4K" : "",
                  detail.isAnime ? " \xB7 Anime" : ""
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: onClose, className: "p-2 rounded-lg text-muted hover:text-text hover:bg-white/5", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-5 h-5" }) })
            ] }),
            loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-center gap-3 py-16 justify-center text-muted", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-5 h-5 animate-spin text-plex" }),
              "Loading request details..."
            ] }) : !detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-sm text-red-200 py-8 text-center", children: "Could not load this request." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex gap-4 mb-5", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-24 aspect-[2/3] rounded-lg overflow-hidden bg-card border border-border/50 shrink-0", children: detail.posterUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: detail.posterUrl, alt: "", className: "w-full h-full object-cover" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-full h-full flex items-center justify-center text-muted", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypeIcon, { className: "w-8 h-8 opacity-40" }) }) }),
                detail.overview && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-sm text-muted line-clamp-5 leading-relaxed", children: detail.overview })
              ] }),
              detail.type === "tv" && tvSeasonRows.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mb-5", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-sm font-semibold text-text mb-2", children: "Seasons" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "rounded-xl border border-border/60 overflow-hidden", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { className: "w-full text-sm", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { className: "bg-background/60 text-muted text-xs uppercase tracking-wider", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-3 py-2 text-left w-12", children: "On" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-3 py-2 text-left", children: "Season" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-3 py-2 text-right", children: "Episodes" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-3 py-2 text-right", children: "Status" })
                  ] }) }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: tvSeasonRows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { className: "border-t border-border/40", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "px-3 py-2", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                      StyledCheckbox,
                      {
                        checked: row.selected,
                        onChange: () => toggleSeason(row.seasonNumber),
                        label: ""
                      }
                    ) }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "px-3 py-2 text-text font-medium", children: row.name }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "px-3 py-2 text-right text-muted", children: row.episodeCount || "\u2014" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "px-3 py-2 text-right", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "text-xs font-semibold text-muted", children: seasonStatusLabel(row.requestStatus, row.selected) }) })
                  ] }, row.seasonNumber)) })
                ] }) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mb-4", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-sm font-semibold text-text mb-3", children: "Advanced" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [
                  servers.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { className: "block text-xs font-semibold text-muted mb-1.5", children: "Destination Server" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                      CustomSelect,
                      {
                        value: String(serverId ?? ""),
                        onChange: (val) => {
                          setServerId(Number(val));
                          setProfileId(null);
                          setRootFolder("");
                          setLanguageProfileId(null);
                          setSelectedTags([]);
                        },
                        options: servers.map((s) => ({
                          value: String(s.id),
                          label: s.isDefault ? `${s.name} (Default)` : s.name
                        }))
                      }
                    )
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { className: "block text-xs font-semibold text-muted mb-1.5", children: "Quality Profile" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                      CustomSelect,
                      {
                        value: String(profileId ?? ""),
                        onChange: (val) => setProfileId(Number(val)),
                        options: (serviceOptions?.profiles || []).map((p) => ({
                          value: String(p.id),
                          label: p.name
                        }))
                      }
                    )
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "sm:col-span-2", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { className: "block text-xs font-semibold text-muted mb-1.5", children: "Root Folder" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                      CustomSelect,
                      {
                        value: rootFolder,
                        onChange: setRootFolder,
                        options: (serviceOptions?.rootFolders || []).map((f) => ({
                          value: f.path,
                          label: f.freeSpace ? `${f.path} (${formatBytes(f.freeSpace)})` : f.path
                        }))
                      }
                    )
                  ] }),
                  detail.type === "tv" && (serviceOptions?.languageProfiles?.length ?? 0) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "sm:col-span-2", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { className: "block text-xs font-semibold text-muted mb-1.5", children: "Language Profile" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                      CustomSelect,
                      {
                        value: String(languageProfileId ?? ""),
                        onChange: (val) => setLanguageProfileId(Number(val)),
                        options: (serviceOptions?.languageProfiles || []).map((lp) => ({
                          value: String(lp.id),
                          label: lp.name
                        }))
                      }
                    )
                  ] }),
                  users.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "sm:col-span-2", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { className: "block text-xs font-semibold text-muted mb-1.5", children: "Request As" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                      CustomSelect,
                      {
                        value: String(userId ?? ""),
                        onChange: (val) => setUserId(Number(val)),
                        options: users.map((u) => ({
                          value: String(u.id),
                          label: u.email ? `${u.displayName} (${u.email})` : u.displayName
                        }))
                      }
                    )
                  ] })
                ] }),
                (serviceOptions?.tags?.length ?? 0) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mt-3", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { className: "block text-xs font-semibold text-muted mb-2", children: "Tags" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex flex-wrap gap-2", children: serviceOptions.tags.map((tag) => {
                    const active = selectedTags.includes(tag.id);
                    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                      "button",
                      {
                        type: "button",
                        onClick: () => toggleTag(tag.id),
                        className: `px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${active ? "bg-plex/15 border-plex/40 text-plex" : "bg-background/50 border-border text-muted hover:text-text"}`,
                        children: tag.label
                      },
                      tag.id
                    );
                  }) })
                ] }),
                optionsLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "text-xs text-muted mt-2 flex items-center gap-2", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-3.5 h-3.5 animate-spin" }),
                  " Loading service options..."
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border/40", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "button",
                  {
                    type: "button",
                    onClick: onClose,
                    disabled: saving,
                    className: "px-4 py-2.5 rounded-lg border border-border text-muted hover:text-text transition-colors disabled:opacity-50",
                    children: "Cancel"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleSave(false),
                    disabled: saving,
                    className: "px-4 py-2.5 rounded-lg border border-white/10 text-text font-semibold hover:bg-white/5 transition-colors disabled:opacity-50",
                    children: "Save changes"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleSave(true),
                    disabled: saving,
                    className: "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-plex text-background font-bold hover:bg-plex-hover transition-colors disabled:opacity-50",
                    children: [
                      saving ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-4 h-4" }),
                      mode === "approve" ? "Save & Approve" : "Save & Approve"
                    ]
                  }
                )
              ] })
            ] })
          ]
        }
      )
    }
  );
};

// client/requests/RequestCardShell.tsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
var RequestCardShell = ({ backdropUrl, posterUrl, className = "", children }) => {
  const artUrl = backdropUrl || posterUrl;
  const cardGradient = "linear-gradient(to right, rgb(var(--color-bg) / 1) 0%, rgb(var(--color-bg) / 0.94) 24%, rgb(var(--color-bg) / 0.55) 50%, rgb(var(--color-bg) / 0.28) 76%, rgb(var(--color-bg) / 0.18) 100%)";
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: `relative overflow-hidden rounded-xl border border-white/10 hover:border-white/20 transition-colors ${className}`, children: [
    artUrl ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "div",
        {
          className: `absolute inset-0 bg-cover bg-center ${backdropUrl ? "opacity-30" : "opacity-20 blur-[2px] scale-105"}`,
          style: { backgroundImage: `url(${artUrl})` },
          "aria-hidden": true
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "div",
        {
          className: "absolute inset-0",
          style: { backgroundImage: cardGradient },
          "aria-hidden": true
        }
      )
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "absolute inset-0 bg-background/50", "aria-hidden": true }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "relative z-[1]", children })
  ] });
};
var requestCardActionBtnClass = "inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 whitespace-nowrap";
var RequestCardActions = ({
  className = "",
  children
}) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: `flex sm:flex-col gap-1.5 sm:justify-center shrink-0 ${className}`, children });

export {
  formatDate,
  getDaysUntilExpiry,
  addMonths,
  addYears,
  getAccessProgressPct,
  formatStreamingHour,
  formatTime,
  formatDateTime,
  hexToRgb,
  accentHoverRgb,
  formatSizeCeil,
  RequestApprovalModal,
  RequestCardShell,
  requestCardActionBtnClass,
  RequestCardActions
};
