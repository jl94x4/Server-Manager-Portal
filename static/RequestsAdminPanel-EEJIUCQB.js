import {
  RequestApprovalModal,
  RequestCardActions,
  RequestCardShell,
  formatDateTime,
  requestCardActionBtnClass
} from "./chunk-6C5E2AH4.js";
import {
  Check,
  ExternalLink,
  Film,
  Loader,
  LoaderCircle,
  Pencil,
  RefreshCw,
  RotateCcw,
  ToastContainer,
  Trash2,
  Tv,
  X,
  __toESM,
  apiFetch,
  pushToast,
  require_jsx_runtime,
  require_react
} from "./chunk-VHFL7SYV.js";

// client/requests/RequestsAdminPanel.tsx
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var formatRelativeTime = (value) => {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDateTime(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 6e4);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateTime(value);
};
var RequestTypeBadge = ({ type, is4k }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "inline-flex items-center gap-1.5", children: [
  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-white/5 border border-border text-muted", children: type === "tv" ? "TV" : "Movie" }),
  is4k && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-200", children: "4K" })
] });
var RequestsAdminPanel = ({ onCountsChange }) => {
  const [toasts, setToasts] = (0, import_react.useState)([]);
  const [filter, setFilter] = (0, import_react.useState)("pending");
  const [requests, setRequests] = (0, import_react.useState)([]);
  const [counts, setCounts] = (0, import_react.useState)({
    pending: 0,
    approved: 0,
    declined: 0,
    failed: 0,
    total: 0,
    configured: false,
    connected: false,
    supported: true
  });
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [refreshing, setRefreshing] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const [actionId, setActionId] = (0, import_react.useState)(null);
  const [declineTarget, setDeclineTarget] = (0, import_react.useState)(null);
  const [declineReason, setDeclineReason] = (0, import_react.useState)("");
  const [reviewTarget, setReviewTarget] = (0, import_react.useState)(null);
  const [deleteTarget, setDeleteTarget] = (0, import_react.useState)(null);
  const addToast = (0, import_react.useCallback)((message, type = "success") => {
    setToasts((prev) => pushToast(prev, message, type));
  }, []);
  const loadData = (0, import_react.useCallback)(async (opts) => {
    if (!opts?.silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const countData = await apiFetch("/api/requests/count");
      const nextCounts = {
        pending: Number(countData?.pending) || 0,
        approved: Number(countData?.approved) || 0,
        declined: Number(countData?.declined) || 0,
        failed: Number(countData?.failed) || 0,
        total: Number(countData?.total) || 0,
        configured: !!countData?.configured,
        connected: !!countData?.connected,
        supported: countData?.supported !== false
      };
      setCounts(nextCounts);
      if (!nextCounts.configured) {
        setRequests([]);
        return;
      }
      if (!nextCounts.supported || !nextCounts.connected) {
        setRequests([]);
        setError(countData?.error || "Cannot connect to your request app");
        return;
      }
      const listData = await apiFetch(`/api/requests?filter=${encodeURIComponent(filter)}&take=30`);
      if (listData?.connected === false) {
        setRequests([]);
        setError(listData?.error || "Cannot connect to your request app");
        return;
      }
      setRequests(Array.isArray(listData?.results) ? listData.results : []);
    } catch (e) {
      setError(e?.message || "Failed to load requests");
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);
  (0, import_react.useEffect)(() => {
    loadData();
  }, [loadData]);
  const filterTabs = (0, import_react.useMemo)(() => [
    { id: "pending", label: "Pending", count: counts.pending },
    { id: "failed", label: "Failed", count: counts.failed },
    { id: "approved", label: "Approved", count: counts.approved },
    { id: "declined", label: "Declined", count: counts.declined }
  ], [counts]);
  const handleQuickApprove = async (item) => {
    setActionId(item.id);
    try {
      await apiFetch(`/api/requests/${item.id}/approve`, {
        method: "POST",
        body: JSON.stringify({ title: item.title })
      });
      addToast(`Approved "${item.title}"`);
      await loadData({ silent: true });
      onCountsChange?.();
    } catch (e) {
      addToast(e?.message || "Failed to approve request", "error");
    } finally {
      setActionId(null);
    }
  };
  const handleDecline = async () => {
    if (!declineTarget) return;
    setActionId(declineTarget.id);
    try {
      await apiFetch(`/api/requests/${declineTarget.id}/decline`, {
        method: "POST",
        body: JSON.stringify({ title: declineTarget.title, reason: declineReason.trim() })
      });
      addToast(`Declined "${declineTarget.title}"`);
      setDeclineTarget(null);
      setDeclineReason("");
      await loadData({ silent: true });
      onCountsChange?.();
    } catch (e) {
      addToast(e?.message || "Failed to decline request", "error");
    } finally {
      setActionId(null);
    }
  };
  const handleRetry = async (item) => {
    setActionId(item.id);
    try {
      await apiFetch(`/api/requests/${item.id}/retry`, {
        method: "POST",
        body: JSON.stringify({ title: item.title })
      });
      addToast(`Retried "${item.title}"`);
      await loadData({ silent: true });
      onCountsChange?.();
    } catch (e) {
      addToast(e?.message || "Failed to retry request", "error");
    } finally {
      setActionId(null);
    }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionId(deleteTarget.id);
    try {
      await apiFetch(`/api/requests/${deleteTarget.id}`, {
        method: "DELETE",
        body: JSON.stringify({ title: deleteTarget.title })
      });
      addToast(`Deleted "${deleteTarget.title}"`);
      setDeleteTarget(null);
      await loadData({ silent: true });
      onCountsChange?.();
    } catch (e) {
      addToast(e?.message || "Failed to delete request", "error");
    } finally {
      setActionId(null);
    }
  };
  const seerrLink = requests[0]?.seerrUrl || null;
  const showPendingActions = filter === "pending";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "w-full max-w-[100%] animate-fade-in", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loader, { isLoading: loading && requests.length === 0 }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToastContainer, { toasts, setToasts }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { className: "text-2xl md:text-3xl font-bold text-plex", children: "Requests" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-sm text-muted mt-1", children: counts.configured && counts.connected ? `${counts.pending} pending \xB7 full Seerr-style review with profiles, folders, tags & seasons` : counts.configured ? "Request app is configured \u2014 connection failed (see below)" : "Connect Seerr, Overseerr, or Jellyseerr in Settings \u2192 Integrations to manage requests here." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-center gap-2 shrink-0", children: [
        seerrLink && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "a",
          {
            href: seerrLink,
            target: "_blank",
            rel: "noreferrer",
            className: "inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted hover:text-text hover:bg-white/5 transition-colors",
            children: [
              "Open Seerr ",
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "w-4 h-4" })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "button",
          {
            type: "button",
            onClick: () => loadData({ silent: true }),
            disabled: refreshing,
            className: "inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-border text-text text-sm font-semibold hover:bg-opacity-80 transition-colors disabled:opacity-50",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: `w-4 h-4 ${refreshing ? "animate-spin" : ""}` }),
              "Refresh"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "glass-card p-4 md:p-6 shadow-2xl", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex flex-wrap gap-2 mb-5", children: filterTabs.map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "button",
        {
          type: "button",
          onClick: () => setFilter(tab.id),
          className: `px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === tab.id ? "nav-item-active" : "text-muted hover:text-text hover:bg-white/5"}`,
          children: [
            tab.label,
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "ml-1.5 text-xs opacity-70", children: [
              "(",
              tab.count,
              ")"
            ] })
          ]
        },
        tab.id
      )) }),
      error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mb-4 p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-200 text-sm space-y-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: error }),
        counts.configured && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "text-xs text-red-200/80", children: [
          "If you use a public reverse-proxy URL, the portal container may not reach it. Add an",
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Internal fetch URL" }),
          " under Settings \u2192 Integrations (docker service name or LAN IP, e.g. ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { className: "text-red-100", children: "http://jellyseerr:5055" }),
          ")."
        ] })
      ] }),
      !counts.configured && !loading && !error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "py-12 text-center text-muted", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "font-medium text-text mb-2", children: "Request app not configured" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-sm max-w-md mx-auto", children: "Set Request App Type, URL, and API key under Settings \u2192 Integrations. Ombi is not supported for in-portal approval yet." })
      ] }),
      counts.configured && !counts.supported && !loading && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "py-12 text-center text-muted", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "font-medium text-text mb-2", children: "Request app type not supported" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-sm max-w-md mx-auto", children: "In-portal approval works with Seerr, Overseerr, and Jellyseerr. Ombi requires the external request UI." })
      ] }),
      counts.configured && counts.supported && !loading && requests.length === 0 && !error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "py-12 text-center text-muted", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "font-medium text-text mb-1", children: [
          "No ",
          filter,
          " requests"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-sm", children: "You're all caught up." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "space-y-3", children: requests.map((item) => {
        const busy = actionId === item.id;
        const TypeIcon = item.type === "tv" ? Tv : Film;
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          RequestCardShell,
          {
            backdropUrl: item.backdropUrl,
            posterUrl: item.posterUrl,
            className: "hover:border-plex/25",
            children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex flex-col sm:flex-row gap-4 p-4", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex gap-4 min-w-0 flex-1", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-[9rem] aspect-[2/3] rounded-lg overflow-hidden bg-card border border-border/50 shrink-0", children: item.posterUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "img",
                  {
                    src: item.posterUrl,
                    alt: "",
                    className: "w-full h-full object-cover",
                    loading: "lazy"
                  }
                ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-full h-full flex items-center justify-center text-muted", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TypeIcon, { className: "w-8 h-8 opacity-40" }) }) }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "min-w-0 flex-1", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex flex-wrap items-center gap-2 mb-1", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", { className: "font-bold text-text truncate", children: [
                      item.title,
                      item.year ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "text-muted font-medium", children: [
                        " (",
                        item.year,
                        ")"
                      ] }) : null
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequestTypeBadge, { type: item.type, is4k: item.is4k })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "text-sm text-muted mb-1", children: [
                    "Requested by ",
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "text-text font-medium", children: item.requestedBy.displayName }),
                    " \xB7 ",
                    formatRelativeTime(item.createdAt)
                  ] }),
                  item.routingSummary && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-xs text-plex/90 mb-2 font-medium", children: item.routingSummary }),
                  item.type === "tv" && item.seasons && item.seasons.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "text-xs text-muted mb-2", children: [
                    "Seasons: ",
                    item.seasons.map((s) => s.seasonNumber).join(", ")
                  ] }),
                  item.overview && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-xs text-muted line-clamp-2", children: item.overview })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RequestCardActions, { children: [
                showPendingActions && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "button",
                    {
                      type: "button",
                      disabled: busy,
                      onClick: () => setReviewTarget(item),
                      className: `${requestCardActionBtnClass} border border-plex/50 bg-background/80 text-plex font-bold hover:bg-plex/15`,
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "w-3.5 h-3.5" }),
                        "Review"
                      ]
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "button",
                    {
                      type: "button",
                      disabled: busy,
                      onClick: () => handleQuickApprove(item),
                      className: `${requestCardActionBtnClass} bg-plex text-background font-bold hover:bg-plex-hover shadow-sm shadow-black/20`,
                      children: [
                        busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-3.5 h-3.5" }),
                        "Quick Approve"
                      ]
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "button",
                    {
                      type: "button",
                      disabled: busy,
                      onClick: () => {
                        setDeclineTarget(item);
                        setDeclineReason("");
                      },
                      className: `${requestCardActionBtnClass} border border-red-500/50 bg-background/80 text-red-200 hover:bg-red-500/15`,
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-3.5 h-3.5" }),
                        "Decline"
                      ]
                    }
                  )
                ] }),
                (filter === "failed" || item.canRetry) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "button",
                  {
                    type: "button",
                    disabled: busy,
                    onClick: () => handleRetry(item),
                    className: `${requestCardActionBtnClass} border border-amber-500/50 bg-background/80 text-amber-200 hover:bg-amber-500/15`,
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "w-3.5 h-3.5" }),
                      "Retry"
                    ]
                  }
                ),
                !showPendingActions && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "button",
                  {
                    type: "button",
                    disabled: busy,
                    onClick: () => setReviewTarget(item),
                    className: `${requestCardActionBtnClass} border border-white/15 bg-background/80 text-text hover:bg-white/10`,
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "w-3.5 h-3.5" }),
                      "Edit"
                    ]
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "button",
                  {
                    type: "button",
                    disabled: busy,
                    onClick: () => setDeleteTarget(item),
                    className: `${requestCardActionBtnClass} border border-border bg-background/80 text-muted hover:text-red-200 hover:border-red-500/40 hover:bg-red-500/10`,
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "w-3.5 h-3.5" }),
                      "Delete"
                    ]
                  }
                )
              ] })
            ] })
          },
          item.id
        );
      }) })
    ] }),
    reviewTarget && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      RequestApprovalModal,
      {
        requestId: reviewTarget.id,
        initialTitle: reviewTarget.title,
        mode: showPendingActions ? "approve" : "edit",
        onClose: () => setReviewTarget(null),
        onComplete: (message) => {
          addToast(message);
          setReviewTarget(null);
          loadData({ silent: true });
          onCountsChange?.();
        },
        onError: (message) => addToast(message, "error")
      }
    ),
    declineTarget && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "w-full max-w-md glass-card p-5 shadow-2xl border border-border", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: "text-lg font-bold text-text mb-1", children: "Decline request" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "text-sm text-muted mb-4", children: [
        "Decline ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "text-text font-medium", children: declineTarget.title }),
        "?"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { className: "block text-sm font-medium text-text mb-2", children: "Reason (optional)" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "textarea",
        {
          className: "w-full min-h-[100px] p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex transition-colors mb-4",
          value: declineReason,
          onChange: (e) => setDeclineReason(e.target.value),
          placeholder: "Let the requester know why this was declined..."
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            onClick: () => {
              setDeclineTarget(null);
              setDeclineReason("");
            },
            className: "px-4 py-2 rounded-lg border border-border text-muted hover:text-text transition-colors",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            onClick: handleDecline,
            disabled: actionId === declineTarget.id,
            className: "px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-500 transition-colors disabled:opacity-50",
            children: actionId === declineTarget.id ? "Declining..." : "Decline request"
          }
        )
      ] })
    ] }) }),
    deleteTarget && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "w-full max-w-md glass-card p-5 shadow-2xl border border-border", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: "text-lg font-bold text-text mb-1", children: "Delete request" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "text-sm text-muted mb-4", children: [
        "Permanently delete ",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "text-text font-medium", children: deleteTarget.title }),
        " from your request app?"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            onClick: () => setDeleteTarget(null),
            className: "px-4 py-2 rounded-lg border border-border text-muted hover:text-text transition-colors",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            onClick: handleDelete,
            disabled: actionId === deleteTarget.id,
            className: "px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-500 transition-colors disabled:opacity-50",
            children: actionId === deleteTarget.id ? "Deleting..." : "Delete request"
          }
        )
      ] })
    ] }) })
  ] });
};
export {
  RequestsAdminPanel
};
