// index.tsx
import { useState, useEffect, useMemo as useMemo2, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";

// node_modules/lucide-react/dist/esm/createLucideIcon.mjs
import { forwardRef as forwardRef2, createElement as createElement3 } from "react";

// node_modules/lucide-react/dist/esm/shared/src/utils/mergeClasses.mjs
var mergeClasses = (...classes) => classes.filter((className, index, array) => {
  return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();

// node_modules/lucide-react/dist/esm/shared/src/utils/toKebabCase.mjs
var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

// node_modules/lucide-react/dist/esm/shared/src/utils/toCamelCase.mjs
var toCamelCase = (string) => string.replace(
  /^([A-Z])|[\s-_]+(\w)/g,
  (match, p1, p2) => p2 ? p2.toUpperCase() : p1.toLowerCase()
);

// node_modules/lucide-react/dist/esm/shared/src/utils/toPascalCase.mjs
var toPascalCase = (string) => {
  const camelCase = toCamelCase(string);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};

// node_modules/lucide-react/dist/esm/Icon.mjs
import { forwardRef, createElement as createElement2 } from "react";

// node_modules/lucide-react/dist/esm/defaultAttributes.mjs
var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};

// node_modules/lucide-react/dist/esm/shared/src/utils/hasA11yProp.mjs
var hasA11yProp = (props) => {
  for (const prop in props) {
    if (prop.startsWith("aria-") || prop === "role" || prop === "title") {
      return true;
    }
  }
  return false;
};

// node_modules/lucide-react/dist/esm/context.mjs
import { createContext, useContext, useMemo, createElement } from "react";
var LucideContext = createContext({});
var useLucideContext = () => useContext(LucideContext);

// node_modules/lucide-react/dist/esm/Icon.mjs
var Icon = forwardRef(
  ({ color, size, strokeWidth, absoluteStrokeWidth, className = "", children, iconNode, ...rest }, ref) => {
    const {
      size: contextSize = 24,
      strokeWidth: contextStrokeWidth = 2,
      absoluteStrokeWidth: contextAbsoluteStrokeWidth = false,
      color: contextColor = "currentColor",
      className: contextClass = ""
    } = useLucideContext() ?? {};
    const calculatedStrokeWidth = absoluteStrokeWidth ?? contextAbsoluteStrokeWidth ? Number(strokeWidth ?? contextStrokeWidth) * 24 / Number(size ?? contextSize) : strokeWidth ?? contextStrokeWidth;
    return createElement2(
      "svg",
      {
        ref,
        ...defaultAttributes,
        width: size ?? contextSize ?? defaultAttributes.width,
        height: size ?? contextSize ?? defaultAttributes.height,
        stroke: color ?? contextColor,
        strokeWidth: calculatedStrokeWidth,
        className: mergeClasses("lucide", contextClass, className),
        ...!children && !hasA11yProp(rest) && { "aria-hidden": "true" },
        ...rest
      },
      [
        ...iconNode.map(([tag, attrs]) => createElement2(tag, attrs)),
        ...Array.isArray(children) ? children : [children]
      ]
    );
  }
);

// node_modules/lucide-react/dist/esm/createLucideIcon.mjs
var createLucideIcon = (iconName, iconNode) => {
  const Component = forwardRef2(
    ({ className, ...props }, ref) => createElement3(Icon, {
      ref,
      iconNode,
      className: mergeClasses(
        `lucide-${toKebabCase(toPascalCase(iconName))}`,
        `lucide-${iconName}`,
        className
      ),
      ...props
    })
  );
  Component.displayName = toPascalCase(iconName);
  return Component;
};

// node_modules/lucide-react/dist/esm/icons/activity.mjs
var __iconNode = [
  [
    "path",
    {
      d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",
      key: "169zse"
    }
  ]
];
var Activity = createLucideIcon("activity", __iconNode);

// node_modules/lucide-react/dist/esm/icons/calendar.mjs
var __iconNode2 = [
  ["path", { d: "M8 2v4", key: "1cmpym" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
  ["path", { d: "M3 10h18", key: "8toen8" }]
];
var Calendar = createLucideIcon("calendar", __iconNode2);

// node_modules/lucide-react/dist/esm/icons/chart-column.mjs
var __iconNode3 = [
  ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16", key: "c24i48" }],
  ["path", { d: "M18 17V9", key: "2bz60n" }],
  ["path", { d: "M13 17V5", key: "1frdt8" }],
  ["path", { d: "M8 17v-3", key: "17ska0" }]
];
var ChartColumn = createLucideIcon("chart-column", __iconNode3);

// node_modules/lucide-react/dist/esm/icons/clock.mjs
var __iconNode4 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 6v6l4 2", key: "mmk7yg" }]
];
var Clock = createLucideIcon("clock", __iconNode4);

// node_modules/lucide-react/dist/esm/icons/cloud-download.mjs
var __iconNode5 = [
  ["path", { d: "M12 13v8l-4-4", key: "1f5nwf" }],
  ["path", { d: "m12 21 4-4", key: "1lfcce" }],
  ["path", { d: "M4.393 15.269A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.436 8.284", key: "ui1hmy" }]
];
var CloudDownload = createLucideIcon("cloud-download", __iconNode5);

// node_modules/lucide-react/dist/esm/icons/file-text.mjs
var __iconNode6 = [
  [
    "path",
    {
      d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
      key: "1oefj6"
    }
  ],
  ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5", key: "wfsgrz" }],
  ["path", { d: "M10 9H8", key: "b1mrlr" }],
  ["path", { d: "M16 13H8", key: "t4e002" }],
  ["path", { d: "M16 17H8", key: "z1uh3a" }]
];
var FileText = createLucideIcon("file-text", __iconNode6);

// node_modules/lucide-react/dist/esm/icons/film.mjs
var __iconNode7 = [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }],
  ["path", { d: "M7 3v18", key: "bbkbws" }],
  ["path", { d: "M3 7.5h4", key: "zfgn84" }],
  ["path", { d: "M3 12h18", key: "1i2n21" }],
  ["path", { d: "M3 16.5h4", key: "1230mu" }],
  ["path", { d: "M17 3v18", key: "in4fa5" }],
  ["path", { d: "M17 7.5h4", key: "myr1c1" }],
  ["path", { d: "M17 16.5h4", key: "go4c1d" }]
];
var Film = createLucideIcon("film", __iconNode7);

// node_modules/lucide-react/dist/esm/icons/hard-drive.mjs
var __iconNode8 = [
  ["path", { d: "M10 16h.01", key: "1bzywj" }],
  [
    "path",
    {
      d: "M2.212 11.577a2 2 0 0 0-.212.896V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.527a2 2 0 0 0-.212-.896L18.55 5.11A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
      key: "18tbho"
    }
  ],
  ["path", { d: "M21.946 12.013H2.054", key: "zqlbp7" }],
  ["path", { d: "M6 16h.01", key: "1pmjb7" }]
];
var HardDrive = createLucideIcon("hard-drive", __iconNode8);

// node_modules/lucide-react/dist/esm/icons/house.mjs
var __iconNode9 = [
  ["path", { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8", key: "5wwlr5" }],
  [
    "path",
    {
      d: "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
      key: "r6nss1"
    }
  ]
];
var House = createLucideIcon("house", __iconNode9);

// node_modules/lucide-react/dist/esm/icons/layers.mjs
var __iconNode10 = [
  [
    "path",
    {
      d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",
      key: "zw3jo"
    }
  ],
  [
    "path",
    {
      d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",
      key: "1wduqc"
    }
  ],
  [
    "path",
    {
      d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",
      key: "kqbvx6"
    }
  ]
];
var Layers = createLucideIcon("layers", __iconNode10);

// node_modules/lucide-react/dist/esm/icons/log-out.mjs
var __iconNode11 = [
  ["path", { d: "m16 17 5-5-5-5", key: "1bji2h" }],
  ["path", { d: "M21 12H9", key: "dn1m92" }],
  ["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", key: "1uf3rs" }]
];
var LogOut = createLucideIcon("log-out", __iconNode11);

// node_modules/lucide-react/dist/esm/icons/settings.mjs
var __iconNode12 = [
  [
    "path",
    {
      d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",
      key: "1i5ecw"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
];
var Settings = createLucideIcon("settings", __iconNode12);

// node_modules/lucide-react/dist/esm/icons/sparkles.mjs
var __iconNode13 = [
  [
    "path",
    {
      d: "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",
      key: "1s2grr"
    }
  ],
  ["path", { d: "M20 2v4", key: "1rf3ol" }],
  ["path", { d: "M22 4h-4", key: "gwowj6" }],
  ["circle", { cx: "4", cy: "20", r: "2", key: "6kqj1y" }]
];
var Sparkles = createLucideIcon("sparkles", __iconNode13);

// node_modules/lucide-react/dist/esm/icons/square-play.mjs
var __iconNode14 = [
  ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", key: "h1oib" }],
  [
    "path",
    {
      d: "M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z",
      key: "kmsa83"
    }
  ]
];
var SquarePlay = createLucideIcon("square-play", __iconNode14);

// node_modules/lucide-react/dist/esm/icons/star.mjs
var __iconNode15 = [
  [
    "path",
    {
      d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
      key: "r04s7s"
    }
  ]
];
var Star = createLucideIcon("star", __iconNode15);

// node_modules/lucide-react/dist/esm/icons/trending-up.mjs
var __iconNode16 = [
  ["path", { d: "M16 7h6v6", key: "box55l" }],
  ["path", { d: "m22 7-8.5 8.5-5-5L2 17", key: "1t1m79" }]
];
var TrendingUp = createLucideIcon("trending-up", __iconNode16);

// node_modules/lucide-react/dist/esm/icons/tv.mjs
var __iconNode17 = [
  ["path", { d: "m17 2-5 5-5-5", key: "16satq" }],
  ["rect", { width: "20", height: "15", x: "2", y: "7", rx: "2", key: "1e6viu" }]
];
var Tv = createLucideIcon("tv", __iconNode17);

// node_modules/lucide-react/dist/esm/icons/users.mjs
var __iconNode18 = [
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["path", { d: "M16 3.128a4 4 0 0 1 0 7.744", key: "16gr8j" }],
  ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", key: "kshegd" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }]
];
var Users = createLucideIcon("users", __iconNode18);

// node_modules/lucide-react/dist/esm/icons/x.mjs
var __iconNode19 = [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
];
var X = createLucideIcon("x", __iconNode19);

// index.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var CustomSelect = ({ id, value, onChange, options, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const selectedOption = options.find((opt) => String(opt.value) === String(value)) || options[0];
  return /* @__PURE__ */ jsxs("div", { className: `relative ${className || ""}`, ref: selectRef, id, children: [
    /* @__PURE__ */ jsxs("div", { className: `flex justify-between items-center w-full cursor-pointer h-full px-4 py-3 rounded-lg border bg-background text-text transition-all ${isOpen ? "border-plex ring-1 ring-plex" : "border-border hover:border-plex/50"}`, onClick: () => setIsOpen(!isOpen), children: [
      /* @__PURE__ */ jsx("span", { className: "truncate mr-4 font-medium text-sm", children: selectedOption?.label || "Select..." }),
      /* @__PURE__ */ jsx("span", { className: `text-[10px] transition-transform ${isOpen ? "rotate-180" : ""}`, children: "\u25BC" })
    ] }),
    isOpen && /* @__PURE__ */ jsx("div", { className: "absolute top-[calc(100%+8px)] right-0 w-max min-w-full bg-[#1e2329] border border-border rounded-lg shadow-2xl z-50 overflow-hidden py-1", children: options.map((opt) => /* @__PURE__ */ jsx(
      "div",
      {
        className: `px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors whitespace-nowrap text-sm ${String(value) === String(opt.value) ? "bg-plex/10 text-plex font-bold" : "text-text"}`,
        onClick: () => {
          onChange(String(opt.value));
          setIsOpen(false);
        },
        children: opt.label
      },
      String(opt.value)
    )) })
  ] });
};
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
var apiFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...options.headers
    },
    ...options
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "An unknown API error occurred." }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }
  if (response.status === 204) return;
  return response.json();
};
var updateFavicon = (thumbUrl) => {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    document.head.appendChild(link);
  }
  if (thumbUrl) {
    link.href = thumbUrl.startsWith("http") ? thumbUrl : `/api/plex/image?path=${encodeURIComponent(thumbUrl)}&width=32&height=32`;
  } else {
    link.href = "/static/logo.png";
  }
};
var Loader = ({ isLoading }) => {
  if (!isLoading) return null;
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[3000]", children: /* @__PURE__ */ jsx("div", { className: "border-4 border-border border-t-plex rounded-full w-12 h-12 animate-spin shadow-[0_0_15px_rgba(229,160,13,0.5)]" }) });
};
var Toast = ({ message, type, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const animTimer = setTimeout(() => setIsVisible(true), 50);
    const timer = setTimeout(onDismiss, 5e3);
    return () => {
      clearTimeout(animTimer);
      clearTimeout(timer);
    };
  }, [onDismiss]);
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: `px-8 py-4 rounded-xl text-white font-medium shadow-2xl transition-all duration-300 transform ${isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"} ${type === "success" ? "bg-green-600" : "bg-red-600"}`,
      children: message
    }
  );
};
var UserCard = ({ user, onEdit, onDelete, onRevoke, isConfigured, isSelected, onSelect }) => {
  const { status, statusText, daysRemainingText, pillClass, borderClass } = useMemo2(() => {
    const days = getDaysUntilExpiry(user.expiryDate);
    let status2 = "active";
    let statusText2 = "Active";
    let daysRemainingText2 = "";
    let pillClass2 = "bg-green-500/10 text-green-400 border border-green-500/20";
    let borderClass2 = "border-green-500/50";
    if (days === null) {
      status2 = "active";
      statusText2 = "Active";
      daysRemainingText2 = "Access never expires.";
    } else if (days < 0) {
      status2 = "expired";
      statusText2 = "Expired";
      daysRemainingText2 = `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago.`;
      pillClass2 = "bg-red-500/10 text-red-400 border border-red-500/20";
      borderClass2 = "border-red-500/50";
    } else if (days <= 30) {
      status2 = "expiring";
      statusText2 = "Expiring Soon";
      daysRemainingText2 = days === 0 ? "Expires today." : `Expires in ${days} day${days === 1 ? "" : "s"}.`;
      pillClass2 = "bg-orange-500/10 text-orange-400 border border-orange-500/20";
      borderClass2 = "border-orange-500/50";
    } else {
      daysRemainingText2 = `Expires in ${days} day${days === 1 ? "" : "s"}.`;
    }
    return { status: status2, statusText: statusText2, daysRemainingText: daysRemainingText2, pillClass: pillClass2, borderClass: borderClass2 };
  }, [user.expiryDate]);
  const handleCardClick = () => {
    onSelect(user.id);
  };
  return /* @__PURE__ */ jsxs("div", { className: `bg-card rounded-xl p-6 shadow-lg border-l-4 ${borderClass} hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex flex-col relative cursor-pointer ${isSelected ? "selected" : ""}`, onClick: handleCardClick, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            className: "w-5 h-5 flex-shrink-0 appearance-none rounded-full border-2 border-muted checked:bg-plex checked:border-plex transition-colors cursor-pointer relative checked:after:content-[''] checked:after:block checked:after:w-2.5 checked:after:h-2.5 checked:after:bg-background checked:after:rounded-full checked:after:absolute checked:after:top-1/2 checked:after:left-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2",
            type: "checkbox",
            checked: isSelected,
            readOnly: true,
            style: { borderRadius: "50%" }
          }
        ),
        user.thumb ? /* @__PURE__ */ jsx("img", { src: user.thumb, alt: user.username, className: "w-10 h-10 rounded-full object-cover border border-border flex-shrink-0" }) : /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-border flex items-center justify-center text-text font-bold text-sm uppercase flex-shrink-0", children: user.username.substring(0, 2) }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-w-0 pr-2", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold truncate leading-tight", title: user.username, children: user.username }),
          user.email && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted truncate mt-0.5", title: user.email, children: user.email })
        ] })
      ] }),
      /* @__PURE__ */ jsx("span", { className: `px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${pillClass}`, children: statusText })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 mt-4 flex-grow", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-sm pb-2 border-b border-white/5 last:border-0 last:pb-0", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted text-xs uppercase tracking-wider font-bold", children: "Joined" }),
        /* @__PURE__ */ jsx("span", { className: "text-text font-medium flex items-center gap-2", children: formatDate(user.joiningDate) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between md:items-center items-start text-sm pb-2 border-b border-white/5 last:border-0 last:pb-0 gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted text-xs uppercase tracking-wider font-bold flex-shrink-0 pt-1 md:pt-0", children: "Expires" }),
        /* @__PURE__ */ jsxs("span", { className: "text-text font-medium flex flex-wrap justify-end md:items-center gap-1", children: [
          /* @__PURE__ */ jsx("span", { className: "whitespace-nowrap", children: formatDate(user.expiryDate) }),
          " ",
          /* @__PURE__ */ jsxs("span", { className: "text-[0.7rem] text-muted whitespace-nowrap", children: [
            "(",
            daysRemainingText,
            ")"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-sm pb-2 border-b border-white/5 last:border-0 last:pb-0", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted text-xs uppercase tracking-wider font-bold", children: "Plex" }),
        /* @__PURE__ */ jsxs("span", { className: "info-value plex-status", children: [
          /* @__PURE__ */ jsx("span", { className: `plex-status-dot ${user.plexAccessStatus}` }),
          user.plexAccessStatus.charAt(0).toUpperCase() + user.plexAccessStatus.slice(1)
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mt-auto pt-6", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2", onClick: onEdit, children: "Edit" }),
      /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2", onClick: onDelete, children: "Delete" }),
      status === "expired" && user.plexAccessStatus !== "revoked" && /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2", onClick: onRevoke, disabled: !isConfigured, children: "Revoke Now" })
    ] })
  ] });
};
var UserModal = ({ isOpen, onClose, onSave, user }) => {
  const [username, setUsername] = useState("");
  const [joiningDate, setJoiningDate] = useState(formatDate((/* @__PURE__ */ new Date()).toISOString()));
  const [expiryDate, setExpiryDate] = useState(formatDate(addMonths(/* @__PURE__ */ new Date(), 1).toISOString()));
  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setJoiningDate(formatDate(user.joiningDate));
      setExpiryDate(user.expiryDate ? formatDate(user.expiryDate) : null);
    } else {
      setUsername("");
      setJoiningDate(formatDate((/* @__PURE__ */ new Date()).toISOString()));
      setExpiryDate(formatDate(addMonths(/* @__PURE__ */ new Date(), 1).toISOString()));
    }
  }, [user, isOpen]);
  if (!isOpen) return null;
  const handleSave = () => {
    if (!user) return;
    const updatedUser = { ...user, expiryDate };
    onSave(updatedUser);
  };
  const handleQuickAction = (action) => {
    const baseDate = expiryDate ? new Date(expiryDate) : /* @__PURE__ */ new Date();
    if (expiryDate) baseDate.setMinutes(baseDate.getMinutes() + baseDate.getTimezoneOffset());
    switch (action) {
      case "addMonth":
        setExpiryDate(formatDate(addMonths(baseDate, 1).toISOString()));
        break;
      case "addYear":
        setExpiryDate(formatDate(addYears(baseDate, 1).toISOString()));
        break;
      case "unlimited":
        setExpiryDate(null);
        break;
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[1000]", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "bg-card p-4 md:p-8 rounded-2xl w-[90%] max-w-lg shadow-2xl border border-border", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-text", children: "Edit User" }),
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsx("label", { children: "Plex Username" }),
      /* @__PURE__ */ jsx("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", type: "text", value: username, disabled: true })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsx("label", { children: "Joining Date" }),
      /* @__PURE__ */ jsx("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", type: "date", value: joiningDate, disabled: true })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "expiryDate", children: "Expiry Date" }),
      /* @__PURE__ */ jsx("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "expiryDate", type: "date", value: expiryDate ?? "", onChange: (e) => setExpiryDate(e.target.value) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 grid grid-cols-3 gap-2", children: [
        /* @__PURE__ */ jsx("button", { className: "w-full h-10 px-3 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center text-sm whitespace-nowrap", onClick: () => handleQuickAction("addMonth"), children: "+1M" }),
        /* @__PURE__ */ jsx("button", { className: "w-full h-10 px-3 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center text-sm whitespace-nowrap", onClick: () => handleQuickAction("addYear"), children: "+1Y" }),
        /* @__PURE__ */ jsx("button", { className: "w-full h-10 px-3 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center text-sm whitespace-nowrap", onClick: () => handleQuickAction("unlimited"), children: "Unlimited" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end gap-4 mt-8 pt-4 border-t border-border", children: /* @__PURE__ */ jsx("button", { className: "px-6 py-3 bg-plex text-background rounded-md font-bold hover:bg-plex-hover transition-colors flex items-center justify-center gap-2", onClick: handleSave, children: "Save" }) })
  ] }) });
};
var SettingsDashboard = () => {
  const [isLoading, setLoading] = useState(true);
  const [initialSettings, setInitialSettings] = useState({});
  const [toasts, setToasts] = useState([]);
  const [statusConfig, setStatusConfig] = useState({});
  const [users, setUsers] = useState([]);
  const [isStatusModalOpen, setStatusModalOpen] = useState(false);
  const [isBroadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const addToast = useCallback((message, type = "success") => {
    setToasts((t) => [...t, { id: Date.now(), message, type }]);
  }, []);
  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const configRes = await fetch("/api/config");
        const configData = await configRes.json();
        if (configData.settings) {
          setInitialSettings(configData.settings);
        }
        const usersData = await apiFetch("/api/users");
        setUsers(usersData);
        try {
          const sConf = await apiFetch("/api/status/config");
          setStatusConfig(sConf);
        } catch (e) {
        }
      } catch (error) {
        addToast("Failed to load config", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [addToast]);
  const handleSaveConfig = async (newConfig) => {
    setLoading(true);
    try {
      await apiFetch("/api/config", { method: "POST", body: JSON.stringify(newConfig) });
      setInitialSettings(newConfig);
      addToast("Settings Saved!");
    } catch (e) {
      addToast(e.message || "Failed to save config", "error");
    } finally {
      setLoading(false);
    }
  };
  const [token, setToken] = useState("");
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState("");
  const [checkInterval, setCheckInterval] = useState(60);
  const [activeTab, setActiveTab] = useState("plex");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [emailDaysBefore, setEmailDaysBefore] = useState(7);
  const [testRecipient, setTestRecipient] = useState("");
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [isTestingNewsletter, setIsTestingNewsletter] = useState(false);
  const [isSendingNewsletter, setIsSendingNewsletter] = useState(false);
  const [newsletterFrequency, setNewsletterFrequency] = useState("disabled");
  const [newsletterDay, setNewsletterDay] = useState(0);
  const [publicDomain, setPublicDomain] = useState("https://plexified.co.uk");
  const [requestUrl, setRequestUrl] = useState("https://plexified.co.uk");
  const [contactUrl, setContactUrl] = useState("");
  const [sonarrUrl, setSonarrUrl] = useState("");
  const [sonarrApiKey, setSonarrApiKey] = useState("");
  const [radarrUrl, setRadarrUrl] = useState("");
  const [radarrApiKey, setRadarrApiKey] = useState("");
  useEffect(() => {
    if (initialSettings) {
      setToken(initialSettings.token || "");
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
      setPublicDomain(initialSettings.publicDomain || "https://portal.plexified.co.uk");
      setRequestUrl(initialSettings.requestUrl || "https://plexified.co.uk");
      setContactUrl(initialSettings.contactUrl || "");
      setSonarrUrl(initialSettings.sonarrUrl || "");
      setSonarrApiKey(initialSettings.sonarrApiKey || "");
      setRadarrUrl(initialSettings.radarrUrl || "");
      setRadarrApiKey(initialSettings.radarrApiKey || "");
      setTestRecipient("");
      setServers([]);
    }
  }, [initialSettings]);
  const handleFetchServers = async () => {
    if (!token) {
      addToast("Please enter a Plex token.", "error");
      return;
    }
    setLoading(true);
    try {
      const foundServers = await apiFetch("/api/plex/servers", {
        method: "POST",
        body: JSON.stringify({ token })
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
    if (!token || !selectedServer) {
      addToast("Token and server must be selected.", "error");
      return;
    }
    await handleSaveConfig({
      token,
      serverIdentifier: selectedServer,
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
      publicDomain,
      requestUrl,
      contactUrl,
      sonarrUrl,
      sonarrApiKey,
      radarrUrl,
      radarrApiKey
    });
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
    if (!confirm("Are you sure you want to send the newsletter to ALL configured users immediately? This cannot be undone.")) return;
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
  };
  return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-7xl mx-auto flex flex-col", children: [
    /* @__PURE__ */ jsx(Loader, { isLoading }),
    /* @__PURE__ */ jsx("div", { className: "fixed bottom-5 left-1/2 -translate-x-1/2 z-[2000] flex flex-col-reverse gap-2 items-center", children: toasts.map((toast) => /* @__PURE__ */ jsx(Toast, { ...toast, onDismiss: () => setToasts((t) => t.filter((item) => item.id !== toast.id)) }, toast.id)) }),
    /* @__PURE__ */ jsxs("header", { className: "hidden md:flex items-center justify-between w-full mb-6 mt-2 md:mt-0", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-xl md:text-3xl font-bold text-plex", children: "Settings" }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
        /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2 text-sm", onClick: () => setStatusModalOpen(true), children: "Manage Status" }),
        /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-plex text-background rounded-md font-bold hover:bg-plex-hover transition-colors flex items-center justify-center gap-2 text-sm", onClick: () => setBroadcastModalOpen(true), children: "Broadcast Email" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-card p-4 md:p-8 rounded-2xl w-full flex flex-col shadow-2xl border border-border", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex md:hidden gap-3 mb-6", children: [
        /* @__PURE__ */ jsx("button", { className: "flex-1 px-4 py-2.5 bg-border text-text rounded-lg font-medium text-sm flex items-center justify-center gap-2", onClick: () => setStatusModalOpen(true), children: "Manage Status" }),
        /* @__PURE__ */ jsx("button", { className: "flex-1 px-4 py-2.5 bg-plex text-background rounded-lg font-bold text-sm flex items-center justify-center gap-2", onClick: () => setBroadcastModalOpen(true), children: "Broadcast Email" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "block md:hidden mb-6", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "settings-tab-select", className: "text-muted text-xs uppercase tracking-wider font-bold mb-2 block", children: "Settings Category" }),
        /* @__PURE__ */ jsx(
          CustomSelect,
          {
            id: "settings-tab-select",
            value: activeTab,
            onChange: (val) => setActiveTab(val),
            options: [
              { label: "Plex Integration", value: "plex" },
              { label: "SMTP Alerts", value: "smtp" },
              { label: "Newsletter", value: "newsletter" },
              { label: "Media Stack", value: "mediastack" }
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden md:flex gap-8 mt-4 mb-6 border-b border-border pb-2", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setActiveTab("plex"),
            className: `bg-none border-none font-bold text-base py-2 px-1 transition-all border-b-2 cursor-pointer ${activeTab === "plex" ? "text-plex border-plex" : "text-muted border-transparent hover:text-text"}`,
            children: "Plex Integration"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setActiveTab("smtp"),
            className: `bg-none border-none font-bold text-base py-2 px-1 transition-all border-b-2 cursor-pointer ${activeTab === "smtp" ? "text-plex border-plex" : "text-muted border-transparent hover:text-text"}`,
            children: "SMTP Alerts"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setActiveTab("newsletter"),
            className: `bg-none border-none font-bold text-base py-2 px-1 transition-all border-b-2 cursor-pointer ${activeTab === "newsletter" ? "text-plex border-plex" : "text-muted border-transparent hover:text-text"}`,
            children: "Newsletter"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setActiveTab("mediastack"),
            className: `bg-none border-none font-bold text-base py-2 px-1 transition-all border-b-2 cursor-pointer ${activeTab === "mediastack" ? "text-plex border-plex" : "text-muted border-transparent hover:text-text"}`,
            children: "Media Stack"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "overflow-y-auto pr-2 flex-grow mb-4 custom-scrollbar", children: [
        activeTab === "plex" && /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-plex mb-4 border-b border-border pb-2", children: "Plex Integration" }),
          /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "plexToken", children: "Plex Token" }),
            /* @__PURE__ */ jsx("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "plexToken", type: "password", value: token, onChange: (e) => setToken(e.target.value), placeholder: "Enter your X-Plex-Token" }),
            /* @__PURE__ */ jsxs("small", { children: [
              "Needed to fetch users and manage access. ",
              /* @__PURE__ */ jsx("a", { href: "https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/", target: "_blank", rel: "noopener noreferrer", children: "How to find your token." })
            ] })
          ] }),
          /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2", onClick: handleFetchServers, disabled: !token, children: "Fetch Servers" }),
          servers.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-4", style: { marginTop: "1rem" }, children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "serverSelect", children: "Select Server" }),
            /* @__PURE__ */ jsx(
              CustomSelect,
              {
                id: "serverSelect",
                value: selectedServer,
                onChange: (val) => setSelectedServer(val),
                options: servers.map((s) => ({ label: `${s.name} (${s.identifier})`, value: s.identifier }))
              }
            ),
            initialSettings.serverIdentifier && /* @__PURE__ */ jsxs("small", { children: [
              "Currently saved server ID: ",
              /* @__PURE__ */ jsx("strong", { children: initialSettings.serverIdentifier })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-4", style: { marginTop: "1rem" }, children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "checkInterval", children: "Check Interval (minutes)" }),
            /* @__PURE__ */ jsx("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "checkInterval", type: "number", value: checkInterval, onChange: (e) => setCheckInterval(Number(e.target.value)), min: "1" }),
            /* @__PURE__ */ jsx("small", { children: "How often to check for expired users in the background." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-4", style: { marginTop: "1rem" }, children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "requestUrl", children: "Request URL" }),
            /* @__PURE__ */ jsx("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "requestUrl", type: "text", value: requestUrl, onChange: (e) => setRequestUrl(e.target.value), placeholder: "https://plexified.co.uk" }),
            /* @__PURE__ */ jsx("small", { children: "The URL users are redirected to when they click the Request Content button." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-4", style: { marginTop: "1rem" }, children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "contactUrl", children: "Contact URL / Email" }),
            /* @__PURE__ */ jsx("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "contactUrl", type: "text", value: contactUrl, onChange: (e) => setContactUrl(e.target.value), placeholder: "mailto:youremail@example.com OR https://wa.me/123456" }),
            /* @__PURE__ */ jsx("small", { children: 'Used for the "Request Extension" button in expiry emails. Defaults to sending an email to the SMTP User.' })
          ] })
        ] }),
        activeTab === "smtp" && /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-plex mb-4 border-b border-border pb-2", children: "SMTP Email Notifications" }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-4 mb-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-2", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "smtpHost", children: "SMTP Host" }),
              /* @__PURE__ */ jsx("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "smtpHost", type: "text", value: smtpHost, onChange: (e) => setSmtpHost(e.target.value), placeholder: "smtp.mailgun.org" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "smtpPort", children: "Port" }),
              /* @__PURE__ */ jsx("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "smtpPort", type: "number", value: smtpPort, onChange: (e) => setSmtpPort(Number(e.target.value)), placeholder: "587" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-4 mb-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "smtpUser", children: "SMTP Username" }),
              /* @__PURE__ */ jsx("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "smtpUser", type: "text", value: smtpUser, onChange: (e) => setSmtpUser(e.target.value), placeholder: "postmaster@yourdomain.com" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "smtpPass", children: "SMTP Password" }),
              /* @__PURE__ */ jsx("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "smtpPass", type: "password", value: smtpPass, onChange: (e) => setSmtpPass(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-4 mb-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-2", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "smtpFrom", children: "Sender Address (From)" }),
              /* @__PURE__ */ jsx("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "smtpFrom", type: "text", value: smtpFrom, onChange: (e) => setSmtpFrom(e.target.value), placeholder: "Plex Manager <noreply@yourdomain.com>" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "form-group flex-1 checkbox-group", children: /* @__PURE__ */ jsxs("label", { htmlFor: "smtpSecure", className: "flex items-center gap-2 cursor-pointer select-none text-muted hover:text-text transition-colors", children: [
              /* @__PURE__ */ jsx("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "smtpSecure", type: "checkbox", checked: smtpSecure, onChange: (e) => setSmtpSecure(e.target.checked) }),
              /* @__PURE__ */ jsx("span", { children: "SSL / Secure" })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "emailDaysBefore", children: "Warning Alert Threshold (Days Before Expiry)" }),
            /* @__PURE__ */ jsx("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "emailDaysBefore", type: "number", value: emailDaysBefore, onChange: (e) => setEmailDaysBefore(Number(e.target.value)), min: "0" }),
            /* @__PURE__ */ jsx("small", { children: "Automated notification email will be sent when user has this many days left." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-background border border-border rounded-xl p-4 mt-6 shadow-inner", children: [
            /* @__PURE__ */ jsx("h4", { children: "Test SMTP Settings" }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-4 mb-4", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "email",
                  value: testRecipient,
                  onChange: (e) => setTestRecipient(e.target.value),
                  placeholder: "test-recipient@gmail.com",
                  className: "flex-grow p-3 rounded-lg border border-border bg-card text-text text-sm outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all"
                }
              ),
              /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2", onClick: handleTestEmail, disabled: isTestingSmtp || !testRecipient, children: isTestingSmtp ? "Sending..." : "Send Test" })
            ] })
          ] })
        ] }),
        activeTab === "newsletter" && /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-plex mb-4 border-b border-border pb-2", children: "Automated Newsletter" }),
          /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "newsletterFrequency", children: "Frequency" }),
            /* @__PURE__ */ jsx(
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
            ),
            /* @__PURE__ */ jsx("small", { children: "How often should users receive the newsletter." })
          ] }),
          newsletterFrequency !== "disabled" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-4", style: { marginTop: "1rem" }, children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "newsletterDay", children: "Send Day" }),
              newsletterFrequency === "weekly" ? /* @__PURE__ */ jsx(
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
              ) : /* @__PURE__ */ jsx("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "newsletterDay", type: "number", min: "1", max: "28", value: newsletterDay, onChange: (e) => setNewsletterDay(Number(e.target.value)), placeholder: "Day of the month (1-28)" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mb-4", style: { marginTop: "1rem" }, children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "publicDomain", children: "Public Domain" }),
              /* @__PURE__ */ jsx("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "publicDomain", type: "text", value: publicDomain, onChange: (e) => setPublicDomain(e.target.value), placeholder: "https://portal.plexified.co.uk" }),
              /* @__PURE__ */ jsx("small", { children: "Your public URL. This is required to host the posters inside the email." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-background border border-border rounded-xl p-4 mt-6 shadow-inner", style: { marginTop: "1rem" }, children: [
            /* @__PURE__ */ jsx("h4", { children: "Test Newsletter" }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-4 mb-4", children: [
              /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2", onClick: handleTestNewsletter, disabled: isTestingNewsletter || isSendingNewsletter, children: isTestingNewsletter ? "Generating & Sending..." : "Send Test Newsletter To Admin" }),
              /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-plex text-background rounded-md font-medium hover:bg-plex-hover transition-colors flex items-center justify-center gap-2", onClick: handleSendNewsletterNow, disabled: isTestingNewsletter || isSendingNewsletter, children: isSendingNewsletter ? "Sending To All..." : "Send Newsletter To ALL NOW" })
            ] })
          ] })
        ] }),
        activeTab === "mediastack" && /* @__PURE__ */ jsxs("div", { className: "mb-8 animate-fade-in", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-plex mb-4 border-b border-border pb-2", children: "Sonarr Integration" }),
          /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "sonarrUrl", children: "Sonarr URL" }),
            /* @__PURE__ */ jsx("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "sonarrUrl", type: "text", value: sonarrUrl, onChange: (e) => setSonarrUrl(e.target.value), placeholder: "http://localhost:8989" }),
            /* @__PURE__ */ jsx("small", { children: "The URL to your Sonarr instance." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "sonarrApiKey", children: "Sonarr API Key" }),
            /* @__PURE__ */ jsx("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "sonarrApiKey", type: "password", value: sonarrApiKey, onChange: (e) => setSonarrApiKey(e.target.value), placeholder: "API Key from Sonarr Settings -> General" })
          ] }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-plex mb-4 border-b border-border pb-2 mt-8", children: "Radarr Integration" }),
          /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "radarrUrl", children: "Radarr URL" }),
            /* @__PURE__ */ jsx("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "radarrUrl", type: "text", value: radarrUrl, onChange: (e) => setRadarrUrl(e.target.value), placeholder: "http://localhost:7878" }),
            /* @__PURE__ */ jsx("small", { children: "The URL to your Radarr instance." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "radarrApiKey", children: "Radarr API Key" }),
            /* @__PURE__ */ jsx("input", { className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all", id: "radarrApiKey", type: "password", value: radarrApiKey, onChange: (e) => setRadarrApiKey(e.target.value), placeholder: "API Key from Radarr Settings -> General" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-end gap-4 mt-8", style: { marginTop: "2rem" }, children: /* @__PURE__ */ jsx("button", { className: "px-6 py-3 bg-plex text-background rounded-md font-bold hover:bg-plex-hover transition-colors flex items-center justify-center gap-2", onClick: handleSave, children: "Save Settings" }) })
    ] }),
    /* @__PURE__ */ jsx(
      StatusConfigModal,
      {
        isOpen: isStatusModalOpen,
        onClose: () => setStatusModalOpen(false),
        config: statusConfig,
        onSave: async (newConfig) => {
          try {
            await apiFetch("/api/status/config", { method: "POST", body: JSON.stringify(newConfig) });
            setStatusConfig(newConfig);
            setStatusModalOpen(false);
            addToast("Status Config Saved!");
          } catch (e) {
            addToast("Failed to save status config", "error");
          }
        }
      }
    ),
    /* @__PURE__ */ jsx(
      BroadcastModal,
      {
        isOpen: isBroadcastModalOpen,
        onClose: () => setBroadcastModalOpen(false),
        selectedUserIds: [],
        users
      }
    )
  ] });
};
var StatusConfigModal = ({ isOpen, onClose, config, onSave }) => {
  const [cfgText, setCfgText] = useState("");
  useEffect(() => {
    if (isOpen) setCfgText(JSON.stringify(config, null, 2));
  }, [isOpen, config]);
  if (!isOpen) return null;
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[1000]", children: /* @__PURE__ */ jsxs("div", { className: "modal-content", style: { maxWidth: "800px", width: "90%" }, children: [
    /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-text", children: "Manage Status Config" }),
    /* @__PURE__ */ jsx("p", { children: "Edit the raw JSON configuration for the status monitor." }),
    /* @__PURE__ */ jsx(
      "textarea",
      {
        value: cfgText,
        onChange: (e) => setCfgText(e.target.value),
        style: { width: "100%", height: "400px", fontFamily: "monospace", backgroundColor: "#1a1a1a", color: "#fff", padding: "1rem" }
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-4 mt-8", style: { marginTop: "1rem" }, children: [
      /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2", onClick: onClose, children: "Cancel" }),
      /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-plex text-background rounded-md font-medium hover:bg-plex-hover transition-colors flex items-center justify-center gap-2", onClick: () => {
        try {
          const parsed = JSON.parse(cfgText);
          onSave(parsed);
        } catch (e) {
          alert("Invalid JSON");
        }
      }, children: "Save" })
    ] })
  ] }) });
};
var BroadcastModal = ({ isOpen, onClose, selectedUserIds, users }) => {
  const [subject, setSubject] = useState("Big updates to the Plex Server! \u{1F680}");
  const [body, setBody] = useState(`\u{1F3AC} <b>Hey everyone! Big updates to the Plex Server!</b> \u{1F680}<br><br>If you have any friends or family who want to check out the server, I\u2019m currently offering a <b>3-Day Free Trial</b> with instant access to the entire library! \u{1F37F}<br>\u2705 No bank details needed<br>\u2705 No purchase required<br>\u2705 Instant, automated setup<br><br>We also just launched a brand new <b>User Portal</b> (https://plexified.co.uk) packed with awesome features for everyone:<br>\u{1F552} <b>Account Status:</b> Easily check exactly how many days you have left until your account expires.<br>\u{1F7E2} <b>Server Health:</b> View live 24/7 uptime stats for all server services.<br>\u{1F4CA} <b>Live Library Stats:</b> See exact, live counts of our massive library.<br><br>Feel free to share the link (https://plexified.co.uk) with anyone who might be interested! \u{1F447}`);
  const [recipientFilter, setRecipientFilter] = useState("all");
  const [customSelectedUserIds, setCustomSelectedUserIds] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  if (!isOpen) return null;
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
      onClose();
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
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[1000]", children: /* @__PURE__ */ jsxs("div", { className: "modal-content", style: { maxWidth: "800px", width: "90%" }, children: [
    /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-text", children: "Broadcast Email" }),
    /* @__PURE__ */ jsxs("div", { style: { marginBottom: "1rem" }, children: [
      /* @__PURE__ */ jsx("label", { style: { display: "block", marginBottom: "0.5rem", fontWeight: "bold" }, children: "Recipients" }),
      /* @__PURE__ */ jsx(
        CustomSelect,
        {
          value: recipientFilter,
          onChange: (val) => setRecipientFilter(val),
          options: [
            { label: "All Users", value: "all" },
            { label: "Active Users Only", value: "active" },
            { label: "Trial Users Only", value: "trial" },
            { label: "Expiring Soon (Next 7 Days)", value: "expiring" },
            { label: "Expired Users", value: "expired" },
            ...selectedUserIds.length > 0 ? [{ label: `Selected Users (${selectedUserIds.length})`, value: "selected" }] : [],
            { label: "Custom User Selection...", value: "custom" }
          ],
          className: "broadcast-select"
        }
      )
    ] }),
    recipientFilter === "custom" && /* @__PURE__ */ jsxs("div", { style: { marginBottom: "1rem", padding: "0.75rem", backgroundColor: "var(--background-dark)", border: "1px solid var(--border-color)", borderRadius: "4px", maxHeight: "200px", overflowY: "auto" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { marginBottom: "0.5rem", fontWeight: "bold" }, children: [
        "Select Users (",
        customSelectedUserIds.length,
        " selected):"
      ] }),
      users.map((u) => /* @__PURE__ */ jsxs("label", { style: { display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", padding: "0.25rem 0" }, children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all",
            type: "checkbox",
            checked: customSelectedUserIds.includes(u.id),
            onChange: (e) => {
              if (e.target.checked) setCustomSelectedUserIds((prev) => [...prev, u.id]);
              else setCustomSelectedUserIds((prev) => prev.filter((id) => id !== u.id));
            },
            style: { accentColor: "var(--plex-gold)" }
          }
        ),
        u.username,
        " (",
        u.email || "No email",
        ")"
      ] }, u.id))
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { marginBottom: "1rem" }, children: [
      /* @__PURE__ */ jsx("label", { style: { display: "block", marginBottom: "0.5rem", fontWeight: "bold" }, children: "Subject" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          className: "w-full p-3 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all",
          type: "text",
          value: subject,
          onChange: (e) => setSubject(e.target.value),
          style: { width: "100%", padding: "0.75rem", borderRadius: "4px", backgroundColor: "#333", color: "#fff", border: "1px solid #444" }
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { marginBottom: "1rem" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }, children: [
        /* @__PURE__ */ jsx("label", { style: { fontWeight: "bold", margin: 0 }, children: "Email Body (HTML supported)" }),
        /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2", onClick: () => setIsPreviewMode(!isPreviewMode), style: { padding: "0.25rem 0.5rem", fontSize: "0.85rem" }, children: isPreviewMode ? "Edit HTML" : "Preview Output" })
      ] }),
      isPreviewMode ? /* @__PURE__ */ jsx(
        "div",
        {
          style: { width: "100%", height: "300px", padding: "1rem", borderRadius: "4px", backgroundColor: "#fff", color: "#000", border: "1px solid #444", overflowY: "auto" },
          dangerouslySetInnerHTML: { __html: body }
        }
      ) : /* @__PURE__ */ jsx(
        "textarea",
        {
          value: body,
          onChange: (e) => setBody(e.target.value),
          style: { width: "100%", height: "300px", padding: "0.75rem", borderRadius: "4px", backgroundColor: "#333", color: "#fff", border: "1px solid #444", fontFamily: "monospace" }
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-4 mt-8", style: { marginTop: "1.5rem", justifyContent: "flex-end", gap: "1rem" }, children: [
      /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2", onClick: onClose, disabled: isSending || isSendingTest, children: "Cancel" }),
      /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2", onClick: handleTestSend, disabled: isSending || isSendingTest, children: isSendingTest ? "Sending Test..." : "Send Test To Admin" }),
      /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-plex text-background rounded-md font-medium hover:bg-plex-hover transition-colors flex items-center justify-center gap-2", onClick: handleSend, disabled: isSending || isSendingTest, style: { backgroundColor: "var(--plex-gold)", color: "#000" }, children: isSending ? "Sending..." : "Send Broadcast" })
    ] })
  ] }) });
};
var UserAnalyticsModal = ({ userId, username, thumb, days, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiFetch(`/api/plex/analytics/user/${userId}?days=${days}`).then((res) => setData(res)).catch(() => {
    }).finally(() => setLoading(false));
  }, [userId, days]);
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "bg-card/90 border border-border w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-border flex items-center justify-between bg-black/20 flex-shrink-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full p-[2px] bg-gradient-to-r from-plex to-[#e5a00d]", children: /* @__PURE__ */ jsx("img", { src: thumb ? thumb.startsWith("http") ? thumb : `/api/plex/image?path=${encodeURIComponent(thumb)}&width=128&height=128` : "/static/logo.png", alt: username, className: "w-full h-full rounded-full object-cover bg-card", onError: (e) => {
          e.target.src = "/static/logo.png";
        } }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-text", children: username }),
          /* @__PURE__ */ jsx("p", { className: "text-muted text-sm", children: loading ? "Loading stats..." : `${data?.totalPlays || 0} total plays (${days === "all" ? "All Time" : `Last ${days} Days`})` })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "text-muted hover:text-white transition-colors bg-white/5 p-2 rounded-full", children: /* @__PURE__ */ jsx(X, { className: "w-6 h-6" }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "p-6 overflow-y-auto flex-1 min-h-0 flex flex-col gap-8 custom-scrollbar", children: loading ? /* @__PURE__ */ jsx("div", { className: "flex justify-center items-center h-40", children: /* @__PURE__ */ jsx(Loader, { isLoading: true }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(SquarePlay, { className: "text-plex w-4 h-4" }),
            " Favorite Libraries"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-3", children: data.topLibraries.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted text-sm", children: "No library data." }) : data.topLibraries.map((lib, i) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center bg-black/20 p-2 rounded border border-white/5", children: [
            /* @__PURE__ */ jsxs("span", { className: "font-bold text-sm text-text", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-muted mr-2", children: [
                "#",
                i + 1
              ] }),
              lib.title
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-plex text-xs font-mono", children: [
              lib.plays,
              " plays"
            ] })
          ] }, lib.id)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(TrendingUp, { className: "text-plex w-4 h-4" }),
            " Top Watched"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-3", children: data.topContent.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted text-sm", children: "No content data." }) : data.topContent.map((c, i) => /* @__PURE__ */ jsxs("a", { href: c.plexUrl, target: "_blank", rel: "noreferrer", className: "flex items-center gap-3 bg-black/20 p-2 rounded border border-white/5 hover:bg-white/10 transition-colors", children: [
            /* @__PURE__ */ jsx("div", { className: "w-8 h-12 bg-black/40 rounded overflow-hidden flex-shrink-0", children: c.thumbUrl ? /* @__PURE__ */ jsx("img", { src: c.thumbUrl, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx(Film, { className: "w-full h-full p-2 opacity-50" }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col flex-grow overflow-hidden", children: [
              /* @__PURE__ */ jsx("span", { className: "font-bold text-sm text-text truncate", children: c.title }),
              /* @__PURE__ */ jsx("span", { className: "text-muted text-[10px] uppercase tracking-wider", children: c.type })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-plex text-xs font-mono whitespace-nowrap", children: [
              c.plays,
              " plays"
            ] })
          ] }, c.key)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Activity, { className: "text-plex w-4 h-4" }),
          " Recent Watch History"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: data.recentHistory.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted text-sm col-span-full", children: "No recent history." }) : data.recentHistory.map((h, i) => /* @__PURE__ */ jsxs("a", { href: h.plexUrl, target: "_blank", rel: "noreferrer", className: "flex items-center gap-3 bg-white/5 border border-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-14 bg-black/40 rounded overflow-hidden flex-shrink-0", children: h.thumbUrl ? /* @__PURE__ */ jsx("img", { src: h.thumbUrl, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx(Film, { className: "w-full h-full p-2 opacity-50" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col overflow-hidden", children: [
            /* @__PURE__ */ jsx("span", { className: "font-bold text-sm text-text truncate", children: h.title }),
            h.episodeTitle && /* @__PURE__ */ jsx("span", { className: "text-muted text-xs truncate", children: h.episodeTitle }),
            /* @__PURE__ */ jsx("span", { className: "text-plex font-mono text-[10px] mt-1", children: new Date(h.viewedAt * 1e3).toLocaleString() })
          ] })
        ] }, i)) })
      ] })
    ] }) })
  ] }) });
};
var PersonalAnalyticsDashboard = ({ username, thumb }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("30");
  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/plex/analytics/me?days=${days}`).then((res) => setData(res)).catch(() => {
    }).finally(() => setLoading(false));
  }, [days]);
  return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-7xl animate-fade-in flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-text uppercase tracking-widest flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(ChartColumn, { className: "w-8 h-8 text-plex" }),
          "Personal Analytics"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted text-sm mt-1", children: "Deep dive into your playback history" })
      ] }),
      /* @__PURE__ */ jsxs(
        "select",
        {
          value: days,
          onChange: (e) => setDays(e.target.value),
          className: "bg-card text-text border border-border rounded px-4 py-2 text-sm focus:outline-none focus:border-plex",
          children: [
            /* @__PURE__ */ jsx("option", { value: "30", children: "Last 30 Days" }),
            /* @__PURE__ */ jsx("option", { value: "60", children: "Last 60 Days" }),
            /* @__PURE__ */ jsx("option", { value: "365", children: "Last 1 Year" }),
            /* @__PURE__ */ jsx("option", { value: "1825", children: "Last 5 Years" }),
            /* @__PURE__ */ jsx("option", { value: "all", children: "All Time" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-card/90 border border-border w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col", children: [
      /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-border flex items-center justify-between bg-black/20 flex-shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full p-[2px] bg-gradient-to-r from-plex to-[#e5a00d]", children: /* @__PURE__ */ jsx("img", { src: thumb ? thumb.startsWith("http") ? thumb : `/api/plex/image?path=${encodeURIComponent(thumb)}&width=128&height=128` : "/static/logo.png", alt: username, className: "w-full h-full rounded-full object-cover bg-card", onError: (e) => {
          e.target.src = "/static/logo.png";
        } }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-text", children: username }),
          /* @__PURE__ */ jsx("p", { className: "text-muted text-sm", children: loading ? "Loading stats..." : `${data?.totalPlays || 0} total plays (${days === "all" ? "All Time" : `Last ${days} Days`})` })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "p-6 overflow-y-auto flex-1 min-h-0 flex flex-col gap-8 custom-scrollbar", children: loading ? /* @__PURE__ */ jsx("div", { className: "flex justify-center items-center h-40", children: /* @__PURE__ */ jsx(Loader, { isLoading: true }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(SquarePlay, { className: "text-plex w-4 h-4" }),
              " Favorite Libraries"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-3", children: data.topLibraries.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted text-sm", children: "No library data." }) : data.topLibraries.map((lib, i) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center bg-black/20 p-2 rounded border border-white/5", children: [
              /* @__PURE__ */ jsxs("span", { className: "font-bold text-sm text-text", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-muted mr-2", children: [
                  "#",
                  i + 1
                ] }),
                lib.title
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "text-plex text-xs font-mono", children: [
                lib.plays,
                " plays"
              ] })
            ] }, lib.id)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(TrendingUp, { className: "text-plex w-4 h-4" }),
              " Top Watched"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-3", children: data.topContent.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted text-sm", children: "No content data." }) : data.topContent.map((c, i) => /* @__PURE__ */ jsxs("a", { href: c.plexUrl, target: "_blank", rel: "noreferrer", className: "flex items-center gap-3 bg-black/20 p-2 rounded border border-white/5 hover:bg-white/10 transition-colors", children: [
              /* @__PURE__ */ jsx("div", { className: "w-8 h-12 bg-black/40 rounded overflow-hidden flex-shrink-0", children: c.thumbUrl ? /* @__PURE__ */ jsx("img", { src: c.thumbUrl, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx(Film, { className: "w-full h-full p-2 opacity-50" }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col flex-grow overflow-hidden", children: [
                /* @__PURE__ */ jsx("span", { className: "font-bold text-sm text-text truncate", children: c.title }),
                /* @__PURE__ */ jsx("span", { className: "text-muted text-[10px] uppercase tracking-wider", children: c.type })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "text-plex text-xs font-mono whitespace-nowrap", children: [
                c.plays,
                " plays"
              ] })
            ] }, c.key)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Activity, { className: "text-plex w-4 h-4" }),
            " Recent Watch History"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: data.recentHistory.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted text-sm col-span-full", children: "No recent history." }) : data.recentHistory.map((h, i) => /* @__PURE__ */ jsxs("a", { href: h.plexUrl, target: "_blank", rel: "noreferrer", className: "flex items-center gap-3 bg-white/5 border border-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-14 bg-black/40 rounded overflow-hidden flex-shrink-0", children: h.thumbUrl ? /* @__PURE__ */ jsx("img", { src: h.thumbUrl, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx(Film, { className: "w-full h-full p-2 opacity-50" }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col overflow-hidden", children: [
              /* @__PURE__ */ jsx("span", { className: "font-bold text-sm text-text truncate", children: h.title }),
              h.episodeTitle && /* @__PURE__ */ jsx("span", { className: "text-muted text-xs truncate", children: h.episodeTitle }),
              /* @__PURE__ */ jsx("span", { className: "text-plex font-mono text-[10px] mt-1", children: new Date(h.viewedAt * 1e3).toLocaleString() })
            ] })
          ] }, i)) })
        ] })
      ] }) })
    ] })
  ] });
};
var MediaStackDashboard = ({ isAdmin }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [calendarDays, setCalendarDays] = useState("7");
  const fetchData = useCallback(async () => {
    try {
      const res = await apiFetch("/api/media-stack/summary");
      if (res.error) throw new Error(res.error);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load Media Stack data.");
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3e4);
    return () => clearInterval(interval);
  }, [fetchData]);
  const formatRelativeAirDate = (date) => {
    const now = /* @__PURE__ */ new Date();
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isMidnight = date.getHours() === 0 && date.getMinutes() === 0;
    const timeStr = isMidnight ? "" : ` at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
    if (date >= today && date < tomorrow) {
      return `Today${timeStr}`;
    }
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    if (date >= tomorrow && date < dayAfterTomorrow) {
      return `Tomorrow${timeStr}`;
    }
    if (diffDays > 1 && diffDays < 7) {
      const dayName = date.toLocaleDateString([], { weekday: "long" });
      return `${dayName}${timeStr}`;
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" }) + timeStr;
  };
  const formatBytes = (bytes) => {
    if (!bytes) return "0.0 GB";
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };
  const calendarItems = useMemo2(() => {
    if (!data) return [];
    const items = [];
    if (data.sonarr?.calendar) {
      data.sonarr.calendar.forEach((ep) => {
        items.push({
          id: `sonarr-${ep.id || ep.airDateUtc || ep.airDate}-${ep.title}`,
          type: "tv",
          service: "Sonarr",
          title: ep.series?.title || "Unknown Series",
          subtitle: `S${String(ep.seasonNumber).padStart(2, "0")}E${String(ep.episodeNumber).padStart(2, "0")} - ${ep.title}`,
          date: new Date(ep.airDateUtc || ep.airDate),
          hasFile: ep.hasFile,
          monitored: ep.monitored
        });
      });
    }
    if (data.radarr?.calendar) {
      data.radarr.calendar.forEach((movie) => {
        const releaseDateStr = movie.digitalRelease || movie.physicalRelease || movie.inCinemas || movie.added;
        if (releaseDateStr) {
          items.push({
            id: `radarr-${movie.id || releaseDateStr}-${movie.title}`,
            type: "movie",
            service: "Radarr",
            title: movie.title,
            subtitle: movie.studio || "Movie Release",
            date: new Date(releaseDateStr),
            hasFile: movie.hasFile,
            monitored: movie.monitored
          });
        }
      });
    }
    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [data]);
  const filteredCalendar = useMemo2(() => {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + Number(calendarDays));
    return calendarItems.filter((item) => {
      const itemDate = item.date;
      return itemDate >= today && itemDate <= cutoff;
    });
  }, [calendarItems, calendarDays]);
  const activeQueue = useMemo2(() => {
    if (!data) return [];
    const queueItems = [];
    if (data.sonarr?.queue?.records) {
      data.sonarr.queue.records.forEach((item) => {
        queueItems.push({ ...item, service: "Sonarr" });
      });
    }
    if (data.radarr?.queue?.records) {
      data.radarr.queue.records.forEach((item) => {
        queueItems.push({ ...item, service: "Radarr" });
      });
    }
    return queueItems;
  }, [data]);
  const combinedHistory = useMemo2(() => {
    if (!data) return [];
    const historyItems = [];
    if (data.sonarr?.history?.records) {
      data.sonarr.history.records.forEach((item) => {
        let cleanTitle = "";
        if (item.series?.title) {
          cleanTitle = item.series.title;
          if (item.episode?.seasonNumber !== void 0 && item.episode?.episodeNumber !== void 0) {
            cleanTitle += ` - S${String(item.episode.seasonNumber).padStart(2, "0")}E${String(item.episode.episodeNumber).padStart(2, "0")}`;
            if (item.episode.title) {
              cleanTitle += ` - ${item.episode.title}`;
            }
          }
        } else {
          cleanTitle = item.sourceTitle || "Unknown TV Show";
        }
        historyItems.push({
          id: `sonarr-hist-${item.id}`,
          service: "Sonarr",
          title: cleanTitle,
          date: new Date(item.date),
          eventType: item.eventType
        });
      });
    }
    if (data.radarr?.history?.records) {
      data.radarr.history.records.forEach((item) => {
        historyItems.push({
          id: `radarr-hist-${item.id}`,
          service: "Radarr",
          title: item.movie?.title || item.sourceTitle || "Unknown Movie",
          date: new Date(item.date),
          eventType: item.eventType
        });
      });
    }
    return historyItems.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);
  }, [data]);
  if (isLoading) return /* @__PURE__ */ jsx(Loader, { isLoading: true });
  if (error) return /* @__PURE__ */ jsx("div", { className: "text-center p-8 text-status-expiring", children: error });
  if (!data) return null;
  const getHistoryColor = (type) => {
    if (!type) return "bg-muted";
    switch (type.toLowerCase()) {
      case "grabbed":
        return "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]";
      case "downloadfolderimported":
      case "moviefileimported":
      case "imported":
        return "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]";
      case "downloadfailed":
      case "failed":
        return "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]";
      case "episodefiledeleted":
      case "moviefiledeleted":
      case "deleted":
        return "bg-zinc-600 shadow-[0_0_6px_rgba(113,113,122,0.5)]";
      default:
        return "bg-plex shadow-[0_0_6px_rgba(229,160,13,0.5)]";
    }
  };
  const formatEventType = (type) => {
    if (!type) return "";
    switch (type.toLowerCase()) {
      case "grabbed":
        return "Grabbed";
      case "downloadfolderimported":
      case "moviefileimported":
      case "imported":
        return "Imported";
      case "downloadfailed":
      case "failed":
        return "Failed";
      case "episodefiledeleted":
      case "moviefiledeleted":
      case "deleted":
        return "Deleted";
      default:
        return type.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()).trim();
    }
  };
  const renderStatusCard = (name, info) => {
    if (!info || !info.configured) {
      return /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border/40 rounded-2xl p-4 md:p-6 shadow-xl flex flex-col justify-between h-44 relative overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-text/80", children: name }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-white/5 text-muted border border-white/5", children: "Unconfigured" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted leading-relaxed", children: "Please set the URL and API key in Settings under the Media Stack tab to activate monitoring." }),
        /* @__PURE__ */ jsx("div", { className: "text-right", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-plex hover:underline cursor-pointer", children: "Configure in Settings \u2192" }) })
      ] });
    }
    const status = info.status;
    const disk = info.disk ? info.disk[0] : null;
    const freeGB = disk ? disk.freeSpace / 1024 / 1024 / 1024 : 0;
    const totalGB = disk ? disk.totalSpace / 1024 / 1024 / 1024 : 1;
    const freePercent = disk ? freeGB / totalGB * 100 : 0;
    const usedPercent = 100 - freePercent;
    return /* @__PURE__ */ jsxs("div", { className: "bg-card border border-white/5 shadow-2xl rounded-2xl p-4 md:p-6 relative overflow-hidden backdrop-blur-sm group hover:border-white/10 transition-all duration-300", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all duration-500", children: /* @__PURE__ */ jsx(HardDrive, { className: "w-24 h-24" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-plex/10 flex items-center justify-center border border-plex/20", children: name === "Sonarr" ? /* @__PURE__ */ jsx(Tv, { className: "w-5 h-5 text-plex" }) : /* @__PURE__ */ jsx(Film, { className: "w-5 h-5 text-plex" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-text tracking-wide", children: name }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-0.5", children: [
            /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-green-500 tracking-wider uppercase", children: "Online" }),
            status?.version && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-muted font-bold", children: [
              "v",
              status.version
            ] })
          ] })
        ] })
      ] }),
      disk && /* @__PURE__ */ jsxs("div", { className: "bg-background/40 rounded-xl p-3 border border-white/5 mt-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end mb-1", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-muted uppercase tracking-wider", children: "Free Storage" }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-text", children: [
            freeGB.toFixed(1),
            " GB free"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-full bg-white/5 rounded-full h-2 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "bg-plex h-full rounded-full transition-all duration-500", style: { width: `${usedPercent}%` } }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[9px] text-muted/60 mt-1 font-medium", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            usedPercent.toFixed(0),
            "% Used"
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            totalGB.toFixed(0),
            " GB Total"
          ] })
        ] })
      ] })
    ] });
  };
  return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-7xl animate-fade-in flex flex-col gap-6", children: [
    /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between gap-4 mb-2", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-text uppercase tracking-widest flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(Layers, { className: "w-8 h-8 text-plex" }),
        "Media Stack"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-muted text-sm mt-1", children: "Unified monitoring dashboard for TV & movies" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 flex flex-col gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-card border border-white/5 shadow-2xl rounded-2xl p-4 md:p-6 relative", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b border-border/30 pb-4", children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-text flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Calendar, { className: "w-5 h-5 text-plex" }),
              "Upcoming Releases"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex bg-white/5 p-1 rounded-xl border border-white/10 w-fit self-end", children: ["7", "14", "30"].map((d) => /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setCalendarDays(d),
                className: `px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${calendarDays === d ? "bg-plex text-background shadow-lg" : "text-muted hover:text-text"}`,
                children: [
                  d,
                  " Days"
                ]
              },
              d
            )) })
          ] }),
          filteredCalendar.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12 bg-background/30 rounded-xl border border-white/5 text-muted text-sm", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "w-12 h-12 text-muted/30 mx-auto mb-3" }),
            "No upcoming releases in the next ",
            calendarDays,
            " days"
          ] }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: filteredCalendar.map((item) => /* @__PURE__ */ jsx(
            "div",
            {
              className: `bg-background/40 hover:bg-background/60 border border-white/5 hover:border-white/10 transition-all duration-300 rounded-xl p-3.5 flex flex-col gap-2 shadow-lg border-l-4 ${item.type === "tv" ? "border-l-blue-500/80" : "border-l-red-500/80"}`,
              children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start gap-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-grow", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1.5", children: [
                    /* @__PURE__ */ jsx("span", { className: `text-[8px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded ${item.service === "Sonarr" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`, children: item.service }),
                    /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-muted flex items-center gap-1 font-medium", children: [
                      /* @__PURE__ */ jsx(Clock, { className: "w-3.5 h-3.5 text-muted/60" }),
                      formatRelativeAirDate(item.date)
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("h4", { className: "font-bold text-sm text-text line-clamp-1 leading-tight group-hover:text-plex transition-colors", children: item.title }),
                  /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted/75 line-clamp-1 mt-0.5", children: item.subtitle })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end gap-1.5 flex-shrink-0", children: [
                  item.hasFile ? /* @__PURE__ */ jsx("span", { className: "text-[9px] font-bold text-green-500 bg-green-500/10 border border-green-500/20 rounded-md px-1.5 py-0.5 whitespace-nowrap", children: "\u2713 Downloaded" }) : item.monitored && /* @__PURE__ */ jsxs("span", { className: "text-[9px] font-bold text-plex bg-plex/10 border border-plex/20 rounded-md px-1.5 py-0.5 flex items-center gap-1 whitespace-nowrap", children: [
                    /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-plex animate-pulse" }),
                    "Monitored"
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "text-[9px] text-muted/50 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5", children: [
                    item.type === "tv" ? /* @__PURE__ */ jsx(Tv, { className: "w-3 h-3" }) : /* @__PURE__ */ jsx(Film, { className: "w-3 h-3" }),
                    item.type === "tv" ? "TV" : "Movie"
                  ] })
                ] })
              ] })
            },
            item.id
          )) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-card border border-white/5 shadow-2xl rounded-2xl p-4 md:p-6 relative", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-text mb-4 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Activity, { className: "w-5 h-5 text-plex" }),
            "Active Downloads (",
            activeQueue.length,
            ")"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-3", children: activeQueue.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-8 bg-background/30 rounded-xl border border-white/5 text-muted text-sm", children: [
            /* @__PURE__ */ jsx(CloudDownload, { className: "w-10 h-10 text-muted/30 mx-auto mb-2" }),
            "No active downloads in the queue"
          ] }) : activeQueue.map((item) => {
            const downloaded = item.size - item.sizeleft;
            const progress = item.size > 0 ? downloaded / item.size * 100 : 0;
            return /* @__PURE__ */ jsxs("div", { className: "bg-background/40 hover:bg-background/60 transition-all rounded-xl p-4 border border-white/5 flex flex-col gap-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 min-w-0", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-bold text-sm text-text line-clamp-1 leading-snug", children: item.title }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: `text-[8px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded ${item.service === "Sonarr" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`, children: item.service }),
                    /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-muted/60 font-semibold", children: [
                      item.timeleft || "Unknown time",
                      " left"
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold px-2 py-0.5 bg-plex/10 text-plex rounded-md border border-plex/20 uppercase tracking-wider", children: item.status })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-full bg-white/5 rounded-full h-2 overflow-hidden mt-1 relative", children: /* @__PURE__ */ jsx("div", { className: "bg-plex h-full rounded-full transition-all duration-500", style: { width: `${progress}%` } }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[10px] text-muted/60 mt-0.5 font-medium", children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  progress.toFixed(1),
                  "% Completed"
                ] }),
                /* @__PURE__ */ jsxs("span", { children: [
                  formatBytes(downloaded),
                  " / ",
                  formatBytes(item.size)
                ] })
              ] })
            ] }, item.id);
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-text flex items-center gap-2 mb-1", children: [
            /* @__PURE__ */ jsx(Layers, { className: "w-5 h-5 text-plex" }),
            "Stack Status"
          ] }),
          renderStatusCard("Sonarr", data.sonarr),
          renderStatusCard("Radarr", data.radarr)
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-card border border-white/5 shadow-2xl rounded-2xl p-4 md:p-6 relative flex-grow flex flex-col", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-text mb-4 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-plex" }),
            "Recent History"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-3 flex-grow justify-start", children: combinedHistory.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-12 bg-background/30 rounded-xl border border-white/5 text-muted text-sm flex-grow flex flex-col justify-center items-center", children: "No recent history records" }) : combinedHistory.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 bg-background/30 rounded-xl p-3 border border-white/5 hover:bg-background/50 transition-colors", children: [
            /* @__PURE__ */ jsx("div", { className: `w-1 h-8 rounded-full flex-shrink-0 ${getHistoryColor(item.eventType)}` }),
            /* @__PURE__ */ jsxs("div", { className: "flex-grow min-w-0", children: [
              /* @__PURE__ */ jsx("div", { className: "font-bold text-xs text-text line-clamp-1 leading-snug", children: item.title }),
              /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-muted flex justify-between items-center mt-0.5", children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  item.service,
                  " \u2022 ",
                  /* @__PURE__ */ jsx("span", { children: formatEventType(item.eventType) })
                ] }),
                /* @__PURE__ */ jsx("span", { children: formatRelativeAirDate(item.date) })
              ] })
            ] })
          ] }, item.id)) })
        ] })
      ] })
    ] })
  ] });
};
var AnalyticsDashboard = ({ isAdmin, sessionInfo }) => {
  if (!isAdmin) {
    return /* @__PURE__ */ jsx(PersonalAnalyticsDashboard, { username: sessionInfo?.session?.username || "User", thumb: null });
  }
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState("30");
  const [selectedUser, setSelectedUser] = useState(null);
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/api/plex/analytics?days=${days}`);
        setAnalyticsData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [days]);
  if (isLoading) return /* @__PURE__ */ jsx(Loader, { isLoading: true });
  if (error) return /* @__PURE__ */ jsx("div", { className: "text-red-500 font-bold p-8 text-center", children: error });
  if (!analyticsData) return null;
  const { topUsers, topLibraries, topContent } = analyticsData;
  const maxLibraryPlays = Math.max(...topLibraries.map((l) => l.plays), 1);
  return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-7xl animate-fade-in flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-text uppercase tracking-widest flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(ChartColumn, { className: "w-8 h-8 text-plex" }),
          "Advanced Analytics"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted text-sm mt-1", children: "Deep dive into playback history" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "w-48", children: /* @__PURE__ */ jsx(
        CustomSelect,
        {
          value: days,
          onChange: (val) => setDays(val),
          options: [
            { label: "Last 1 Day", value: "1" },
            { label: "Last 7 Days", value: "7" },
            { label: "Last 30 Days", value: "30" },
            { label: "Last 60 Days", value: "60" },
            { label: "Last 1 Year", value: "365" },
            { label: "Last 5 Years", value: "1825" },
            { label: "All Time", value: "all" }
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-card/50 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-xl border border-border", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Users, { className: "text-plex w-5 h-5" }),
          " Top Viewers"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-4", children: topUsers.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted text-sm", children: "No data available." }) : topUsers.map((user, idx) => /* @__PURE__ */ jsxs("div", { onClick: () => setSelectedUser({ id: user.id, username: user.username, thumb: user.thumb }), className: "flex items-center justify-between p-3 bg-black/20 rounded-lg hover:bg-black/40 transition-colors cursor-pointer group hover:ring-1 hover:ring-plex", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full p-[2px] bg-gradient-to-r from-plex to-[#e5a00d]", children: /* @__PURE__ */ jsx("img", { src: user.thumb ? user.thumb.startsWith("http") ? user.thumb : `/api/plex/image?path=${encodeURIComponent(user.thumb)}&width=80&height=80` : "/static/logo.png", alt: user.username, className: "w-full h-full rounded-full object-cover bg-card", onError: (e) => {
                e.target.src = "/static/logo.png";
              } }) }),
              /* @__PURE__ */ jsxs("div", { className: "absolute -top-2 -right-2 bg-plex text-black font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center", children: [
                "#",
                idx + 1
              ] })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "font-bold text-text group-hover:text-plex transition-colors", children: user.username })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "font-mono text-plex font-bold", children: [
            user.plays,
            " plays"
          ] })
        ] }, user.id)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-card/50 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-xl border border-border", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(SquarePlay, { className: "text-plex w-5 h-5" }),
          " Popular Libraries"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-5 mt-2", children: topLibraries.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted text-sm", children: "No data available." }) : topLibraries.map((lib, idx) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end", children: [
            /* @__PURE__ */ jsxs("span", { className: "font-bold text-text flex items-center gap-2", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-muted text-xs", children: [
                "#",
                idx + 1
              ] }),
              " ",
              lib.title
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted font-mono", children: [
              lib.plays,
              " plays"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-2 w-full bg-black/40 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-gradient-to-r from-plex to-[#e5a00d] rounded-full", style: { width: `${lib.plays / maxLibraryPlays * 100}%` } }) })
        ] }, lib.id)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-card/50 backdrop-blur-md rounded-xl p-4 md:p-6 shadow-xl border border-border col-span-full", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-text mb-4 uppercase tracking-wider flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(TrendingUp, { className: "text-plex w-5 h-5" }),
          " Trending Content"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-4", children: topContent.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted text-sm col-span-full", children: "No data available." }) : topContent.slice(0, 10).map((item, idx) => /* @__PURE__ */ jsxs("a", { href: item.plexUrl, target: "_blank", rel: "noreferrer", className: "flex flex-col sm:flex-row bg-black/20 rounded-xl overflow-hidden hover:bg-black/40 transition-all cursor-pointer group hover:ring-1 hover:ring-plex shadow-md", children: [
          /* @__PURE__ */ jsxs("div", { className: "sm:w-32 lg:w-40 flex-shrink-0 aspect-[2/3] relative", children: [
            item.thumbUrl ? /* @__PURE__ */ jsx("img", { src: item.thumbUrl, alt: item.title, className: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" }) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center bg-black/40", children: /* @__PURE__ */ jsx(Film, { className: "w-8 h-8 opacity-50 text-muted" }) }),
            /* @__PURE__ */ jsxs("div", { className: "absolute top-2 left-2 bg-plex text-black font-bold text-xs px-2 py-1 rounded-md shadow-lg drop-shadow-md", children: [
              "#",
              idx + 1
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-5 flex flex-col justify-between flex-grow", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2 mb-2", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-lg sm:text-xl font-bold text-text group-hover:text-plex transition-colors line-clamp-1", children: item.title }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 bg-white/10 px-2 py-1 rounded-md text-xs font-mono text-plex flex-shrink-0 whitespace-nowrap shadow-sm", children: [
                  /* @__PURE__ */ jsx(SquarePlay, { className: "w-3 h-3" }),
                  " ",
                  item.plays,
                  " plays"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted mb-3 font-medium", children: [
                item.year && /* @__PURE__ */ jsx("span", { children: item.year }),
                item.year && (item.contentRating || item.rating || item.duration > 0 || item.genres && item.genres.length > 0) && /* @__PURE__ */ jsx("span", { className: "opacity-50", children: "\u2022" }),
                item.contentRating && /* @__PURE__ */ jsx("span", { children: item.contentRating }),
                item.contentRating && (item.rating || item.duration > 0 || item.genres && item.genres.length > 0) && /* @__PURE__ */ jsx("span", { className: "opacity-50", children: "\u2022" }),
                item.duration > 0 && /* @__PURE__ */ jsxs("span", { children: [
                  Math.round(item.duration / 6e4),
                  " min"
                ] }),
                item.duration > 0 && item.rating && /* @__PURE__ */ jsx("span", { className: "opacity-50", children: "\u2022" }),
                item.rating && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-yellow-500", children: [
                  /* @__PURE__ */ jsx(Star, { className: "w-3 h-3 fill-current" }),
                  " ",
                  item.rating
                ] })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-text/80 line-clamp-2 sm:line-clamp-3 mb-3 leading-relaxed", children: item.summary || "No summary available." })
            ] }),
            item.genres && item.genres.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 mt-auto", children: [
              item.genres.slice(0, 4).map((g, i) => /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase tracking-wider bg-white/5 border border-white/10 text-muted px-2 py-1 rounded-full shadow-sm", children: g }, i)),
              item.genres.length > 4 && /* @__PURE__ */ jsxs("span", { className: "text-[10px] uppercase tracking-wider bg-white/5 border border-white/10 text-muted px-2 py-1 rounded-full shadow-sm", children: [
                "+",
                item.genres.length - 4
              ] })
            ] })
          ] })
        ] }, item.key)) })
      ] })
    ] }),
    selectedUser && /* @__PURE__ */ jsx(
      UserAnalyticsModal,
      {
        userId: selectedUser.id,
        username: selectedUser.username,
        thumb: selectedUser.thumb,
        days,
        onClose: () => setSelectedUser(null)
      }
    )
  ] });
};
var LogsDashboard = ({ onLogout }) => {
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [auditEntries, setAuditEntries] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "success") => {
    setToasts((t) => [...t, { id: Date.now(), message, type }]);
  }, []);
  const fetchSecurityData = useCallback(async () => {
    setLoading(true);
    try {
      const [deletedUsersData, auditLogData] = await Promise.all([
        apiFetch("/api/deleted-users"),
        apiFetch("/api/audit-log")
      ]);
      setDeletedUsers(deletedUsersData);
      setAuditEntries(auditLogData);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to fetch logs.", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);
  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);
  const handleUnblockDeletedUser = async (deletedUser) => {
    const label = deletedUser.username || deletedUser.email || "this user";
    if (!window.confirm(`Allow ${label} to use the portal again? This does not invite them automatically.`)) return;
    setLoading(true);
    try {
      await apiFetch(`/api/deleted-users/${encodeURIComponent(deletedUser.blockId)}`, { method: "DELETE" });
      addToast("Deleted user unblocked.");
      await fetchSecurityData();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to unblock user.", "error");
    } finally {
      setLoading(false);
    }
  };
  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}, ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };
  const formatEventName = (event) => {
    return event.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };
  const isConfigured = true;
  const filteredAuditLog = auditEntries.filter((e) => e.event !== "system_email_sent");
  const emailLogs = auditEntries.filter((e) => e.event === "system_email_sent");
  return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-7xl mx-auto flex flex-col", children: [
    /* @__PURE__ */ jsx(Loader, { isLoading }),
    /* @__PURE__ */ jsx("div", { className: "fixed bottom-5 left-1/2 -translate-x-1/2 z-[2000] flex flex-col-reverse gap-2 items-center", children: toasts.map((toast) => /* @__PURE__ */ jsx(Toast, { ...toast, onDismiss: () => setToasts((t) => t.filter((item) => item.id !== toast.id)) }, toast.id)) }),
    /* @__PURE__ */ jsx("header", { className: "hidden md:flex items-center justify-between w-full mb-6 mt-2 md:mt-0", children: /* @__PURE__ */ jsx("h1", { className: "text-xl md:text-3xl font-bold text-plex", children: "System Logs" }) }),
    /* @__PURE__ */ jsx("main", { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-6 mb-8", children: [
      /* @__PURE__ */ jsxs("section", { className: "bg-card border border-border rounded-xl p-4 md:p-5 shadow-md", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4 mb-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-text", children: "Deleted User Blocklist" }),
            /* @__PURE__ */ jsx("p", { className: "text-muted text-xs mt-1", children: "Deleted users are logged out and blocked from claiming another trial." })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold", children: deletedUsers.length })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-3", children: deletedUsers.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted text-sm border border-dashed border-border rounded-lg p-4 text-center", children: "No deleted users are currently blocked." }) : deletedUsers.map((deletedUser) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 bg-background/60 border border-border rounded-lg p-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsx("p", { className: "text-text font-semibold text-sm truncate", children: deletedUser.username || "Unknown user" }),
            /* @__PURE__ */ jsx("p", { className: "text-muted text-xs truncate", children: deletedUser.email || deletedUser.plexId || deletedUser.id || "No identifier" }),
            /* @__PURE__ */ jsxs("p", { className: "text-muted/70 text-[11px] mt-1", children: [
              "Deleted ",
              formatDateTime(deletedUser.deletedAt),
              " by ",
              deletedUser.deletedBy || "admin"
            ] })
          ] }),
          /* @__PURE__ */ jsx("button", { className: "px-3 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors text-xs flex-shrink-0", onClick: () => handleUnblockDeletedUser(deletedUser), children: "Unblock" })
        ] }, deletedUser.blockId)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "bg-card border border-border rounded-xl p-4 md:p-5 shadow-md", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4 mb-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-text", children: "Audit Log" }),
            /* @__PURE__ */ jsx("p", { className: "text-muted text-xs mt-1", children: "Recent invite, deletion, sync, and access events." })
          ] }),
          /* @__PURE__ */ jsx("button", { className: "px-3 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors text-xs", onClick: fetchSecurityData, children: "Refresh" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-3", children: filteredAuditLog.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted text-sm border border-dashed border-border rounded-lg p-4 text-center", children: "No audit events recorded yet." }) : filteredAuditLog.slice(0, 20).map((entry) => /* @__PURE__ */ jsxs("div", { className: "bg-background/60 border border-border rounded-lg p-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsx("p", { className: "text-text font-semibold text-sm", children: formatEventName(entry.event) }),
            /* @__PURE__ */ jsx("span", { className: "text-muted text-[11px] whitespace-nowrap", children: formatDateTime(entry.timestamp) })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-muted text-xs mt-1", children: [
            "Target: ",
            entry.target?.username || entry.target?.email || "System",
            entry.actor?.username || entry.actor?.email ? ` \xB7 Actor: ${entry.actor.username || entry.actor.email}` : ""
          ] })
        ] }, entry.id)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "bg-card border border-border rounded-xl p-4 md:p-5 shadow-md", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between gap-4 mb-4", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-text", children: "Email Log" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted text-xs mt-1", children: "Recent system emails sent." })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-3", children: emailLogs.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted text-sm border border-dashed border-border rounded-lg p-4 text-center", children: "No emails sent yet." }) : emailLogs.slice(0, 20).map((entry) => /* @__PURE__ */ jsxs("div", { className: "bg-background/60 border border-border rounded-lg p-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsx("p", { className: "text-text font-semibold text-sm line-clamp-1", children: entry.details?.subject || "System Email" }),
            /* @__PURE__ */ jsx("span", { className: "text-muted text-[11px] whitespace-nowrap", children: formatDateTime(entry.timestamp) })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-muted text-xs mt-1", children: [
            "To: ",
            entry.target?.username || entry.target?.email || "Unknown"
          ] })
        ] }, entry.id)) })
      ] })
    ] }) })
  ] });
};
var AdminDashboard = ({ onLogout, onViewUserPortal, onViewStatus, onViewDashboard }) => {
  const [users, setUsers] = useState([]);
  const [isConfigured, setConfigured] = useState(false);
  const [configSettings, setConfigSettings] = useState({ checkIntervalMinutes: 60 });
  const [isUserModalOpen, setUserModalOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkCustomDate, setBulkCustomDate] = useState("");
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [auditEntries, setAuditEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("username-asc");
  const addToast = useCallback((message, type = "success") => {
    setToasts((t) => [...t, { id: Date.now(), message, type }]);
  }, []);
  const fetchUsers = useCallback(async () => {
    try {
      const usersData = await apiFetch("/api/users");
      setUsers(usersData);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to fetch users.", "error");
    }
  }, [addToast]);
  const fetchSecurityData = useCallback(async () => {
    try {
      const [deletedUsersData, auditLogData] = await Promise.all([
        apiFetch("/api/deleted-users"),
        apiFetch("/api/audit-log")
      ]);
      setDeletedUsers(deletedUsersData);
      setAuditEntries(auditLogData);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to fetch security data.", "error");
    }
  }, [addToast]);
  useEffect(() => {
    const checkConfigAndFetchData = async () => {
      setLoading(true);
      try {
        const configStatus = await apiFetch("/api/config");
        setConfigured(configStatus.configured);
        setConfigSettings(configStatus.settings);
        if (configStatus.configured) {
          await fetchUsers();
          await fetchSecurityData();
        } else {
          addToast("Welcome! Please configure your Plex settings to begin.", "success");
          setSettingsModalOpen(true);
        }
      } catch (error) {
        addToast(error instanceof Error ? error.message : "Could not connect to backend.", "error");
      } finally {
        setLoading(false);
      }
    };
    checkConfigAndFetchData();
  }, [fetchUsers, fetchSecurityData, addToast]);
  const handleSaveConfig = async (config) => {
    setLoading(true);
    try {
      await apiFetch("/api/config", {
        method: "POST",
        body: JSON.stringify(config)
      });
      setConfigured(true);
      setConfigSettings({
        token: config.token,
        serverIdentifier: config.serverIdentifier,
        checkIntervalMinutes: config.checkIntervalMinutes || 60,
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpUser: config.smtpUser,
        smtpPass: config.smtpPass,
        smtpFrom: config.smtpFrom,
        smtpSecure: config.smtpSecure,
        emailDaysBefore: config.emailDaysBefore,
        newsletterFrequency: config.newsletterFrequency,
        newsletterDay: config.newsletterDay,
        publicDomain: config.publicDomain
      });
      setSettingsModalOpen(false);
      addToast("Settings saved successfully!");
      await fetchUsers();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to save config.", "error");
    } finally {
      setLoading(false);
    }
  };
  const handleImportUsers = async () => {
    if (!isConfigured) {
      addToast("Please configure Plex settings first.", "error");
      return;
    }
    setLoading(true);
    try {
      const result = await apiFetch("/api/sync", { method: "POST" });
      addToast(result.message || `Synced ${result.count} users from Plex.`);
      await fetchUsers();
      await fetchSecurityData();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "An unknown error occurred during sync.", "error");
    } finally {
      setLoading(false);
    }
  };
  const revokePlexAccess = async (userId) => {
    setLoading(true);
    try {
      const updatedUser = await apiFetch(`/api/users/${userId}/revoke`, { method: "POST" });
      setUsers((currentUsers) => currentUsers.map((u) => u.id === userId ? updatedUser : u));
      addToast("Plex access revoked successfully.");
      await fetchSecurityData();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to revoke access.", "error");
    } finally {
      setLoading(false);
    }
  };
  const handleOpenUserModal = (user) => {
    setEditingUser(user);
    setUserModalOpen(true);
  };
  const handleCloseModal = () => {
    setUserModalOpen(false);
    setEditingUser(null);
  };
  const handleSaveUser = async (userToSave) => {
    setLoading(true);
    try {
      const updatedUser = await apiFetch(`/api/users/${userToSave.id}`, {
        method: "PUT",
        body: JSON.stringify({ expiryDate: userToSave.expiryDate })
      });
      setUsers(users.map((u) => u.id === updatedUser.id ? updatedUser : u));
      handleCloseModal();
      addToast("User updated successfully!");
      await fetchSecurityData();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to save user.", "error");
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user? This will revoke Plex access first.")) {
      setLoading(true);
      try {
        await apiFetch(`/api/users/${userId}`, { method: "DELETE" });
        setUsers(users.filter((u) => u.id !== userId));
        addToast("User removed from manager.");
        await fetchSecurityData();
      } catch (error) {
        addToast(error instanceof Error ? error.message : "Failed to delete user.", "error");
      } finally {
        setLoading(false);
      }
    }
  };
  const handleToggleSelection = (userId) => {
    setSelectedUserIds(
      (prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };
  const handleBulkUpdate = async (action, customDate) => {
    setLoading(true);
    try {
      await apiFetch("/api/users/bulk-update", {
        method: "POST",
        body: JSON.stringify({ userIds: selectedUserIds, action, customDate })
      });
      addToast(`Successfully updated ${selectedUserIds.length} users.`);
      setSelectedUserIds([]);
      setBulkCustomDate("");
      await fetchUsers();
      await fetchSecurityData();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Bulk update failed.", "error");
    } finally {
      setLoading(false);
    }
  };
  const handleUnblockDeletedUser = async (deletedUser) => {
    const label = deletedUser.username || deletedUser.email || "this user";
    if (!window.confirm(`Allow ${label} to use the portal again? This does not invite them automatically.`)) return;
    setLoading(true);
    try {
      await apiFetch(`/api/deleted-users/${encodeURIComponent(deletedUser.blockId)}`, { method: "DELETE" });
      addToast("Deleted user unblocked.");
      await fetchSecurityData();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to unblock user.", "error");
    } finally {
      setLoading(false);
    }
  };
  const filteredAndSortedUsers = useMemo2(() => {
    return users.filter((user) => {
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchesName = user.username.toLowerCase().includes(query);
        const matchesEmail = user.email?.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesEmail) return false;
      }
      if (statusFilter === "all") return true;
      const days = getDaysUntilExpiry(user.expiryDate);
      const isRevoked = user.plexAccessStatus === "revoked";
      const isTrial = user.isTrial === true;
      if (statusFilter === "trial") return isTrial;
      if (statusFilter === "revoked") return isRevoked;
      if (isRevoked) return false;
      if (statusFilter === "active") {
        return days === null || days > 30;
      }
      if (statusFilter === "expiring") {
        return days !== null && days >= 0 && days <= 30;
      }
      if (statusFilter === "expired") {
        return days !== null && days < 0;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "username-asc") {
        return a.username.localeCompare(b.username);
      }
      if (sortBy === "username-desc") {
        return b.username.localeCompare(a.username);
      }
      if (sortBy === "joined-desc") {
        return new Date(b.joiningDate).getTime() - new Date(a.joiningDate).getTime();
      }
      if (sortBy === "expiry-asc") {
        if (a.expiryDate === null) return 1;
        if (b.expiryDate === null) return -1;
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      }
      if (sortBy === "expiry-desc") {
        if (a.expiryDate === null) return 1;
        if (b.expiryDate === null) return -1;
        return new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime();
      }
      return 0;
    });
  }, [users, searchQuery, statusFilter, sortBy]);
  const filteredUserIds = useMemo2(() => filteredAndSortedUsers.map((u) => u.id), [filteredAndSortedUsers]);
  const allFilteredSelected = filteredUserIds.length > 0 && filteredUserIds.every((id) => selectedUserIds.includes(id));
  return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-7xl mx-auto flex flex-col", children: [
    /* @__PURE__ */ jsx(Loader, { isLoading }),
    /* @__PURE__ */ jsx("div", { className: "fixed bottom-5 left-1/2 -translate-x-1/2 z-[2000] flex flex-col-reverse gap-2 items-center", children: toasts.map((toast) => /* @__PURE__ */ jsx(Toast, { ...toast, onDismiss: () => setToasts((t) => t.filter((item) => item.id !== toast.id)) }, toast.id)) }),
    /* @__PURE__ */ jsx("header", { className: "hidden md:flex items-center justify-between w-full mb-6 mt-2 md:mt-0", children: /* @__PURE__ */ jsx("h1", { className: "text-xl md:text-3xl font-bold text-plex", children: "Admin Portal" }) }),
    /* @__PURE__ */ jsxs("main", { children: [
      isConfigured && /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-4 md:items-center mb-8 bg-card border border-border p-4 rounded-xl shadow-md", children: [
        /* @__PURE__ */ jsx("span", { className: "font-bold text-muted uppercase tracking-wider text-sm hidden md:inline-block mr-2", children: "Quick Actions:" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:flex md:flex-row gap-3 w-full md:w-auto flex-1", children: [
          /* @__PURE__ */ jsx("button", { className: "col-span-1 px-3 py-2 bg-plex text-background rounded-md font-bold hover:bg-plex-hover transition-colors flex items-center justify-center gap-2 text-sm md:text-base", onClick: handleImportUsers, disabled: isLoading, children: "Sync Plex Users" }),
          /* @__PURE__ */ jsx("button", { className: "col-span-1 px-3 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2 text-sm md:text-base md:ml-auto", onClick: () => {
            setEditingUser(null);
            setUserModalOpen(true);
          }, children: "+ Add Custom User" })
        ] })
      ] }),
      isConfigured && /* @__PURE__ */ jsxs("div", { className: "flex flex-col xl:flex-row justify-between xl:items-center bg-card border border-border p-4 rounded-xl mb-8 gap-4 xl:gap-6 w-full", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative w-full xl:w-auto xl:flex-1 min-w-[250px]", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Search by username or email...",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: "w-full py-3 pr-10 pl-4 rounded-lg border border-border bg-background text-text text-sm outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all"
            }
          ),
          searchQuery && /* @__PURE__ */ jsx("button", { className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text text-xl", onClick: () => setSearchQuery(""), children: "\xD7" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 sm:flex sm:flex-row bg-background p-1 rounded-lg border border-border overflow-x-auto custom-scrollbar w-full xl:w-auto", children: ["all", "active", "trial", "expiring", "expired", "revoked"].map((status) => /* @__PURE__ */ jsx(
          "button",
          {
            className: `col-span-1 px-2 sm:px-4 py-2 rounded-md font-medium transition-all text-xs sm:text-sm text-center ${statusFilter === status ? "bg-plex text-background shadow-md font-bold" : "text-muted hover:bg-white/5 hover:text-text"}`,
            onClick: () => setStatusFilter(status),
            children: status.charAt(0).toUpperCase() + status.slice(1)
          },
          status
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 whitespace-nowrap w-full xl:w-auto xl:ml-auto", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "sortSelect", className: "text-muted font-bold text-sm hidden sm:block", children: "Sort By" }),
          /* @__PURE__ */ jsx(
            CustomSelect,
            {
              id: "sortSelect",
              value: sortBy,
              onChange: (val) => setSortBy(val),
              className: "w-full sm:w-[200px]",
              options: [
                { label: "Username (A-Z)", value: "username-asc" },
                { label: "Username (Z-A)", value: "username-desc" },
                { label: "Expiry (Soonest)", value: "expiry-asc" },
                { label: "Expiry (Furthest)", value: "expiry-desc" },
                { label: "Joined Date (Newest)", value: "joined-desc" }
              ]
            }
          )
        ] })
      ] }),
      selectedUserIds.length > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border p-4 rounded-xl flex justify-between items-center mb-8 flex-wrap gap-4 w-full", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center flex-wrap gap-4 text-sm font-medium", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-plex", children: [
            selectedUserIds.length,
            " selected"
          ] }),
          allFilteredSelected ? /* @__PURE__ */ jsx("button", { className: "text-muted hover:text-text transition-colors underline", onClick: () => setSelectedUserIds((prev) => prev.filter((id) => !filteredUserIds.includes(id))), children: "Unselect Filtered" }) : /* @__PURE__ */ jsxs("button", { className: "text-muted hover:text-text transition-colors underline", onClick: () => setSelectedUserIds((prev) => Array.from(/* @__PURE__ */ new Set([...prev, ...filteredUserIds]))), children: [
            "Select Filtered (",
            filteredAndSortedUsers.length,
            ")"
          ] }),
          /* @__PURE__ */ jsx("button", { className: "text-muted hover:text-text transition-colors underline", onClick: () => setSelectedUserIds([]), children: "Unselect All" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2", onClick: () => handleBulkUpdate("addMonth"), children: "+1 Month" }),
          /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2", onClick: () => handleBulkUpdate("addYear"), children: "+1 Year" }),
          /* @__PURE__ */ jsx("button", { className: "px-4 py-2 bg-border text-text rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2", onClick: () => handleBulkUpdate("unlimited"), children: "Unlimited" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: bulkCustomDate,
                onChange: (e) => setBulkCustomDate(e.target.value),
                className: "p-2 rounded-md border border-border bg-background text-text text-sm outline-none focus:border-plex cursor-pointer"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "px-4 py-2 bg-plex text-background rounded-md font-medium hover:bg-plex-hover transition-colors flex items-center justify-center gap-2",
                onClick: () => {
                  if (!bulkCustomDate) {
                    addToast("Please select a custom expiry date.", "error");
                    return;
                  }
                  handleBulkUpdate("custom", bulkCustomDate);
                },
                children: "Set Custom Date"
              }
            )
          ] })
        ] })
      ] }),
      isConfigured && filteredAndSortedUsers.length === 0 && !isLoading && /* @__PURE__ */ jsx("p", { className: "text-center text-muted p-8 border border-dashed border-border rounded-xl mt-4 w-full", children: "No users found matching your filters. Try syncing or widening filters." }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 w-full", children: filteredAndSortedUsers.map((user) => /* @__PURE__ */ jsx(
        UserCard,
        {
          user,
          onEdit: () => handleOpenUserModal(user),
          onDelete: () => handleDeleteUser(user.id),
          onRevoke: () => revokePlexAccess(user.id),
          isConfigured,
          isSelected: selectedUserIds.includes(user.id),
          onSelect: handleToggleSelection
        },
        user.id
      )) })
    ] }),
    /* @__PURE__ */ jsx(
      UserModal,
      {
        isOpen: isUserModalOpen,
        onClose: handleCloseModal,
        onSave: handleSaveUser,
        user: editingUser
      }
    )
  ] });
};
var PublicUptimeBanner = () => {
  const [healthData, setHealthData] = useState({});
  const [config, setConfig] = useState({});
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await apiFetch("/api/status");
        setConfig(res.config);
        setHealthData(res.healthData);
      } catch (e) {
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15e3);
    return () => clearInterval(interval);
  }, []);
  if (!config.services || config.services.length === 0) return null;
  return /* @__PURE__ */ jsxs("div", { className: "w-full flex flex-col items-center mt-2 mb-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center mb-4", children: [
      /* @__PURE__ */ jsx("a", { href: "/status", className: "text-plex hover:text-plex-hover font-bold text-[10px] tracking-wider uppercase mb-1 transition-colors", children: "View Full Status Page \u2192" }),
      /* @__PURE__ */ jsx("h3", { className: "text-text font-bold uppercase tracking-widest text-sm", children: "Live System Status" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-wrap justify-center gap-4", children: config.services.map((service) => {
      const health = healthData[service.id];
      if (!health) return null;
      const isUp = health.currentStatus === "online";
      const colorClass = isUp ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10";
      const dotClass = isUp ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]";
      return /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-2 px-4 py-2 rounded-full border ${colorClass} backdrop-blur-sm`, children: [
        /* @__PURE__ */ jsx("span", { className: `w-2 h-2 rounded-full ${dotClass}` }),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-text", children: service.name }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-muted", children: [
          health.uptimePercentage,
          "%"
        ] })
      ] }, service.id);
    }) })
  ] });
};
var LivePlexStats = () => {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiFetch("/api/plex/stats");
        if (res && res.movies !== void 0) {
          setStats(res);
        }
      } catch (e) {
      }
    };
    fetchStats();
  }, []);
  if (!stats) return /* @__PURE__ */ jsxs("ul", { className: "server-features", children: [
    /* @__PURE__ */ jsx("li", { children: "\u{1F3AC} 10,000+ Movies & TV Shows" }),
    /* @__PURE__ */ jsx("li", { children: "\u{1F3B5} Thousands of Music Albums" }),
    /* @__PURE__ */ jsx("li", { children: "\u{1F504} Automated Request System" })
  ] });
  return /* @__PURE__ */ jsxs("div", { className: "w-full flex flex-col items-center mt-6 mb-8", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-plex/10 text-plex text-xs font-bold px-4 py-1.5 rounded-full border border-plex/20 uppercase tracking-wider mb-4", children: "Live Library Stats" }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3 w-full", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-1 shadow-lg backdrop-blur-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xl", children: "\u{1F3AC}" }),
        /* @__PURE__ */ jsx("span", { className: "text-plex font-bold text-xl", children: stats.movies.toLocaleString() }),
        /* @__PURE__ */ jsx("span", { className: "text-muted text-[10px] uppercase tracking-wider font-bold", children: "Movies" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-1 shadow-lg backdrop-blur-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xl", children: "\u{1F4FA}" }),
        /* @__PURE__ */ jsx("span", { className: "text-plex font-bold text-xl", children: stats.shows.toLocaleString() }),
        /* @__PURE__ */ jsx("span", { className: "text-muted text-[10px] uppercase tracking-wider font-bold", children: "TV Shows" })
      ] }),
      stats.music > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-1 shadow-lg backdrop-blur-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xl", children: "\u{1F3B5}" }),
        /* @__PURE__ */ jsx("span", { className: "text-plex font-bold text-xl", children: stats.music.toLocaleString() }),
        /* @__PURE__ */ jsx("span", { className: "text-muted text-[10px] uppercase tracking-wider font-bold", children: "Artists" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "w-full mt-3", children: /* @__PURE__ */ jsxs("div", { className: "bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center gap-1 shadow-lg backdrop-blur-sm", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-plex font-bold text-lg flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-orange-500", children: "\u26A1" }),
        " 30%"
      ] }),
      /* @__PURE__ */ jsx("span", { className: "text-muted text-[10px] uppercase tracking-wider font-bold", children: "Available in 4K" })
    ] }) })
  ] });
};
var SetupWizard = ({ onComplete }) => {
  const [token, setToken] = useState("");
  const [serverIdentifier, setServerIdentifier] = useState("");
  const [servers, setServers] = useState([]);
  const [sonarrUrl, setSonarrUrl] = useState("");
  const [sonarrApiKey, setSonarrApiKey] = useState("");
  const [radarrUrl, setRadarrUrl] = useState("");
  const [radarrApiKey, setRadarrApiKey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const handleFetchServers = async () => {
    if (!token) {
      setError("Please enter a Plex token first.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const foundServers = await apiFetch("/api/plex/servers", {
        method: "POST",
        body: JSON.stringify({ token })
      });
      setServers(foundServers);
      if (foundServers.length > 0) {
        setServerIdentifier(foundServers[0].identifier);
      } else {
        setError("No owned servers found for this token. Make sure you are the owner.");
        setServerIdentifier("");
      }
    } catch (error2) {
      setError(error2 instanceof Error ? error2.message : "An unknown error occurred.");
      setServers([]);
      setServerIdentifier("");
    } finally {
      setIsLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/config", {
        method: "POST",
        body: JSON.stringify({ token, serverIdentifier, sonarrUrl, sonarrApiKey, radarrUrl, radarrApiKey })
      });
      if (res.error) throw new Error(res.error);
      onComplete();
    } catch (err) {
      setError(err.message || "Failed to save configuration");
      setIsLoading(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "w-full max-w-2xl mx-auto px-4 py-12 md:py-20", children: /* @__PURE__ */ jsxs("div", { className: "bg-card rounded-2xl shadow-2xl border border-white/10 p-5 md:p-8 lg:p-12 relative overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-plex to-[#e5a00d]" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center mb-8", children: [
      /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-plex/10 rounded-full flex items-center justify-center mb-4 border border-plex/20", children: /* @__PURE__ */ jsx(Settings, { className: "w-8 h-8 text-plex" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-text mb-2", children: "Initial Setup" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted", children: "Configure your Plex server details to get started." })
    ] }),
    error && /* @__PURE__ */ jsx("div", { className: "p-4 bg-status-expiring/20 border border-status-expiring/50 rounded-lg text-status-expiring mb-6", children: error }),
    /* @__PURE__ */ jsxs("div", { className: "mb-8 p-4 bg-plex/5 border border-plex/20 rounded-xl text-sm text-muted", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-plex font-bold mb-2 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4" }),
        " Need help finding these?"
      ] }),
      /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 space-y-2", children: [
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Plex Token:" }),
          " Log into Plex Web, view the XML of any library item, and look for ",
          /* @__PURE__ */ jsx("code", { className: "bg-background px-1 rounded", children: "X-Plex-Token=..." }),
          " in the URL."
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Server Identifier:" }),
          " You can automatically fetch this by entering your token and clicking ",
          /* @__PURE__ */ jsx("strong", { children: "Fetch Servers" }),
          "."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "flex flex-col gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm font-bold text-muted uppercase tracking-wider", children: "Plex Token" }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx("input", { type: "text", className: "w-full p-4 rounded-lg bg-background border border-border text-text focus:border-plex outline-none transition-colors", placeholder: "Enter your Plex Token", value: token, onChange: (e) => setToken(e.target.value), required: true }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: handleFetchServers, disabled: isLoading || !token, className: "px-6 bg-plex/20 text-plex rounded-lg font-bold hover:bg-plex/30 transition-colors whitespace-nowrap", children: "Fetch Servers" })
        ] })
      ] }),
      servers.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm font-bold text-muted uppercase tracking-wider", children: "Select Server" }),
        /* @__PURE__ */ jsx("select", { className: "w-full p-4 rounded-lg bg-background border border-border text-text focus:border-plex outline-none transition-colors appearance-none", value: serverIdentifier, onChange: (e) => setServerIdentifier(e.target.value), required: true, children: servers.map((s) => /* @__PURE__ */ jsxs("option", { value: s.identifier, children: [
          s.name,
          " (",
          s.identifier,
          ")"
        ] }, s.identifier)) })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm font-bold text-muted uppercase tracking-wider", children: "Server Identifier" }),
        /* @__PURE__ */ jsx("input", { type: "text", className: "w-full p-4 rounded-lg bg-background border border-border text-text focus:border-plex outline-none transition-colors", placeholder: "Enter your Server Identifier (or Fetch above)", value: serverIdentifier, onChange: (e) => setServerIdentifier(e.target.value), required: true })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "border-t border-border pt-6 mt-2", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-plex mb-4", children: "Optional: Media Stack Integration" }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-bold text-muted uppercase tracking-wider", children: "Sonarr URL & API Key" }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx("input", { type: "text", className: "w-1/2 p-3 rounded-lg bg-background border border-border text-text focus:border-plex outline-none transition-colors", placeholder: "http://localhost:8989", value: sonarrUrl, onChange: (e) => setSonarrUrl(e.target.value) }),
              /* @__PURE__ */ jsx("input", { type: "password", className: "w-1/2 p-3 rounded-lg bg-background border border-border text-text focus:border-plex outline-none transition-colors", placeholder: "Sonarr API Key", value: sonarrApiKey, onChange: (e) => setSonarrApiKey(e.target.value) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-bold text-muted uppercase tracking-wider", children: "Radarr URL & API Key" }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx("input", { type: "text", className: "w-1/2 p-3 rounded-lg bg-background border border-border text-text focus:border-plex outline-none transition-colors", placeholder: "http://localhost:7878", value: radarrUrl, onChange: (e) => setRadarrUrl(e.target.value) }),
              /* @__PURE__ */ jsx("input", { type: "password", className: "w-1/2 p-3 rounded-lg bg-background border border-border text-text focus:border-plex outline-none transition-colors", placeholder: "Radarr API Key", value: radarrApiKey, onChange: (e) => setRadarrApiKey(e.target.value) })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "submit", disabled: isLoading || !token || !serverIdentifier, className: "w-full py-4 mt-2 bg-plex text-background rounded-lg font-bold text-lg hover:bg-plex-hover transition-colors disabled:opacity-50", children: isLoading ? "Saving..." : "Complete Setup" })
    ] })
  ] }) });
};
var Login = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [publicInfo, setPublicInfo] = useState({ thumb: null, serverName: "Plex Server", isConfigured: null });
  const fetchPublicInfo = () => {
    apiFetch("/api/public/info").then((data) => {
      if (data) {
        setPublicInfo({
          thumb: data.thumb || null,
          serverName: data.serverName || "Plex Server",
          isConfigured: data.isConfigured !== false
        });
        if (data.thumb) updateFavicon(data.thumb);
        if (data.serverName) document.title = `${data.serverName} Portal`;
      }
    }).catch(() => {
      setPublicInfo((prev) => ({ ...prev, isConfigured: false }));
    });
  };
  useEffect(() => {
    fetchPublicInfo();
    const path = window.location.pathname;
    if (path.startsWith("/auth/")) {
      const pinId = path.split("/")[2];
      setIsLoading(true);
      window.history.replaceState({}, "", "/");
      apiFetch("/api/auth/plex/callback", {
        method: "POST",
        body: JSON.stringify({ pinId })
      }).then(() => {
        onLoginSuccess();
      }).catch((e) => {
        setError(e.message || "Login failed");
        setIsLoading(false);
      });
    }
  }, [onLoginSuccess]);
  const handlePlexLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/auth/plex/login", { method: "POST" });
      const forwardUrl = window.location.origin + "/auth/" + data.id;
      const authUrl = `https://app.plex.tv/auth#?clientID=${data.clientIdentifier}&code=${data.code}&context[device][product]=Plex%20Expiry%20Manager&forwardUrl=${encodeURIComponent(forwardUrl)}`;
      window.location.href = authUrl;
    } catch (e) {
      setError("Failed to initiate Plex login");
      setIsLoading(false);
    }
  };
  if (publicInfo.isConfigured === false) {
    return /* @__PURE__ */ jsx(SetupWizard, { onComplete: fetchPublicInfo });
  }
  if (publicInfo.isConfigured === null) {
    return /* @__PURE__ */ jsx(Loader, { isLoading: true });
  }
  return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[80vh] px-4 pt-12 md:pt-20", children: [
    /* @__PURE__ */ jsx(Loader, { isLoading }),
    /* @__PURE__ */ jsxs("div", { className: "w-full max-w-5xl mx-auto bg-card rounded-2xl shadow-2xl border-t-[6px] border-plex flex flex-col-reverse md:flex-row relative z-10 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 p-4 md:p-8 lg:p-12 flex flex-col justify-center", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl md:text-4xl font-bold text-plex mb-4", children: [
          "Welcome to ",
          publicInfo.serverName
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-muted text-sm md:text-base leading-relaxed mb-6", children: [
          "The ultimate Plex experience. Get instant access to our entire library with a ",
          /* @__PURE__ */ jsx("strong", { children: "3-Day Free Trial" }),
          "."
        ] }),
        /* @__PURE__ */ jsx(LivePlexStats, {}),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted mt-2 mb-4 text-center", children: "You'll need a free Plex account to continue. You can create one securely on the next screen." }),
        /* @__PURE__ */ jsx("button", { className: "w-full py-4 bg-plex text-background rounded-lg font-bold text-lg hover:bg-plex-hover transition-colors shadow-lg", onClick: handlePlexLogin, disabled: isLoading, children: "Claim Free Trial" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "hidden md:block w-px bg-white/5 my-12" }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 p-4 md:p-8 lg:p-12 flex flex-col justify-center bg-white/[0.02]", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "w-full flex justify-center mb-8", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-plex rounded-full blur-[50px] opacity-20 pointer-events-none" }),
          publicInfo.thumb ? /* @__PURE__ */ jsx("img", { src: publicInfo.thumb, alt: "Server Logo", className: "w-32 h-32 object-cover rounded-full border-2 border-plex drop-shadow-[0_0_15px_rgba(229,160,13,0.25)] relative z-10", onError: (e) => {
            e.currentTarget.src = "/static/logo.png";
            e.currentTarget.className = "w-40 object-contain drop-shadow-[0_0_15px_rgba(229,160,13,0.25)] relative z-10";
          } }) : /* @__PURE__ */ jsx("img", { src: "/static/logo.png", alt: "Server Logo", className: "w-40 object-contain drop-shadow-[0_0_15px_rgba(229,160,13,0.25)] relative z-10", onError: (e) => e.currentTarget.style.display = "none" })
        ] }) }),
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-text mb-4", children: "Already on our server?" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted text-sm mb-8", children: "Manage your existing subscription or re-link your account." }),
        /* @__PURE__ */ jsx("button", { className: "w-full py-4 bg-border text-text rounded-lg font-bold hover:bg-white/10 transition-colors border border-white/10", onClick: handlePlexLogin, disabled: isLoading, children: "Login with Plex" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-4 w-full max-w-5xl mx-auto", children: /* @__PURE__ */ jsx(PublicUptimeBanner, {}) }),
    error && /* @__PURE__ */ jsx("div", { className: "error-message", style: { marginTop: "1rem" }, children: error })
  ] });
};
var UserDashboard = ({ sessionInfo, onLogout, refreshSession, onViewAdmin, onViewStatus, onViewDashboard }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const user = sessionInfo.account;
  const [optOutNewsletter, setOptOutNewsletter] = useState(user?.optOutNewsletter || false);
  const handleToggleNewsletter = async () => {
    setIsLoading(true);
    try {
      const newValue = !optOutNewsletter;
      await apiFetch("/api/users/preferences", {
        method: "POST",
        body: JSON.stringify({ optOutNewsletter: newValue })
      });
      setOptOutNewsletter(newValue);
      setToast({ id: 3, message: "Newsletter preferences updated!", type: "success" });
      refreshSession();
    } catch (e) {
      setToast({ id: 3, message: e.message || "Failed to update preferences", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };
  const handleRequestInvite = async () => {
    setIsLoading(true);
    try {
      await apiFetch("/api/users/request-invite", { method: "POST" });
      setToast({ id: 1, message: "Invite requested successfully! Check your email.", type: "success" });
      refreshSession();
    } catch (e) {
      setToast({ id: 1, message: e.message || "Failed to request invite", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (!user && !isLoading && !sessionInfo.session.isAdmin) {
      handleRequestInvite();
    }
  }, []);
  const handleRelink = async () => {
    setIsLoading(true);
    try {
      await apiFetch("/api/users/relink", { method: "POST" });
      setToast({ id: 2, message: "Account re-linked! Check your email for the invite.", type: "success" });
      refreshSession();
    } catch (e) {
      setToast({ id: 2, message: e.message || "Failed to re-link account", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };
  const daysLeft = user?.expiryDate ? getDaysUntilExpiry(user.expiryDate) : null;
  const progressPct = daysLeft !== null ? Math.min(100, Math.max(0, daysLeft / 365 * 100)) : 100;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7;
  const isRevoked = user?.plexAccessStatus === "revoked";
  const isPending = user?.plexAccessStatus?.toLowerCase() === "pending";
  return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-2xl mx-auto flex flex-col gap-5", children: [
    /* @__PURE__ */ jsx(Loader, { isLoading }),
    toast && /* @__PURE__ */ jsx(Toast, { message: toast.message, type: toast.type, onDismiss: () => setToast(null) }),
    /* @__PURE__ */ jsxs("div", { className: "relative bg-card border border-border rounded-2xl overflow-hidden shadow-2xl", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-plex to-transparent opacity-80" }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 md:p-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
          /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-full bg-gradient-to-br from-plex/40 to-plex/10 border-2 border-plex/60 flex items-center justify-center text-plex font-black text-2xl flex-shrink-0 shadow-lg shadow-plex/20", children: sessionInfo.session.username?.[0]?.toUpperCase() || "?" }),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsx("p", { className: "text-muted text-xs uppercase tracking-[3px] font-semibold", children: "Welcome back" }),
            /* @__PURE__ */ jsx("h1", { className: "text-2xl md:text-3xl font-black text-text leading-tight truncate", children: sessionInfo.session.username })
          ] }),
          sessionInfo.session.isAdmin && /* @__PURE__ */ jsx("span", { className: "ml-auto px-3 py-1 rounded-full text-[10px] font-black bg-plex/20 text-plex border border-plex/40 uppercase tracking-widest flex-shrink-0", children: "Admin" })
        ] }),
        sessionInfo.session.isAdmin && /* @__PURE__ */ jsxs("div", { className: "bg-plex/5 border border-plex/20 rounded-xl p-4 text-sm text-muted leading-relaxed", children: [
          /* @__PURE__ */ jsx("span", { className: "text-plex font-bold", children: "Server Administrator" }),
          " \u2014 You own this server. Use the Admin Panel to manage users and settings."
        ] }),
        !sessionInfo.session.isAdmin && !user && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-muted text-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "w-4 h-4 rounded-full border-2 border-plex border-t-transparent animate-spin flex-shrink-0" }),
          "Setting up your 3-Day Free Trial..."
        ] }),
        !sessionInfo.session.isAdmin && user && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 mb-5", children: [
            /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black border uppercase tracking-wider ${isRevoked ? "bg-red-500/10 border-red-500/30 text-red-400" : isExpiringSoon ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" : "bg-green-500/10 border-green-500/30 text-green-400"}`, children: [
              /* @__PURE__ */ jsx("span", { className: `w-1.5 h-1.5 rounded-full animate-pulse ${isRevoked ? "bg-red-400" : isExpiringSoon ? "bg-yellow-400" : "bg-green-400"}` }),
              user.plexAccessStatus,
              user.isTrial && " \xB7 Trial"
            ] }),
            user.expiryDate ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/5 border border-white/10 text-muted", children: [
              "\u{1F4C5} ",
              new Date(user.expiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
            ] }) : /* @__PURE__ */ jsx("span", { className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-green-500/10 border border-green-500/30 text-green-400", children: "\u267E\uFE0F Unlimited" })
          ] }),
          daysLeft !== null && /* @__PURE__ */ jsxs("div", { className: "mb-5 bg-background/50 rounded-xl p-4 border border-border", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-baseline mb-3", children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted text-xs uppercase tracking-widest font-semibold", children: "Time Remaining" }),
              /* @__PURE__ */ jsxs("span", { className: `font-black text-3xl leading-none ${isExpiringSoon ? "text-yellow-400" : "text-plex"}`, children: [
                daysLeft,
                /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-muted ml-1", children: daysLeft === 1 ? "day" : "days" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "w-full h-2 bg-white/5 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: `h-full rounded-full transition-all duration-1000 ${isExpiringSoon ? "bg-yellow-400" : "bg-gradient-to-r from-plex via-yellow-300 to-plex"}`, style: { width: `${progressPct}%` } }) }),
            isExpiringSoon && /* @__PURE__ */ jsx("p", { className: "text-yellow-400/80 text-xs mt-2", children: "\u26A0\uFE0F Expiring soon \u2014 contact the admin to renew" })
          ] }),
          isPending && /* @__PURE__ */ jsxs("div", { className: "rounded-xl overflow-hidden border-2 border-plex mb-5 shadow-lg shadow-plex/20", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-plex px-5 py-3 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xl", children: "\u{1F4E7}" }),
              /* @__PURE__ */ jsx("strong", { className: "text-background text-sm tracking-wide", children: "TIP - Accept Your Plex Invite" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-plex/10 p-5", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-text text-sm leading-relaxed mb-4", children: [
                "You need to accept the invite in the email before Plex access is active. Your ",
                /* @__PURE__ */ jsx("strong", { className: "text-plex", children: "3-Day Free Trial" }),
                " remains set on your account."
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2.5", children: [{ n: "1", t: "\u{1F4EC} Open the email from Plex \u2014 check your inbox AND spam/junk folder" }, { n: "2", t: '\u2705 Click the "Accept Invite" button inside the email' }, { n: "3", t: "\u{1F389} Log into Plex and enjoy your free trial!" }].map((s) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 bg-black/20 rounded-lg px-3.5 py-2.5", children: [
                /* @__PURE__ */ jsx("span", { className: "w-5 h-5 rounded-full bg-plex text-background text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5", children: s.n }),
                /* @__PURE__ */ jsx("span", { className: "text-muted text-sm leading-snug", children: s.t })
              ] }, s.n)) }),
              /* @__PURE__ */ jsx("p", { className: "text-muted/60 text-xs italic mt-3", children: "\u23F3 Haven't received the email? Contact the admin below." })
            ] })
          ] }),
          isRevoked && daysLeft !== null && daysLeft >= 0 && /* @__PURE__ */ jsxs("div", { className: "bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-5 flex flex-col gap-3", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-yellow-400 font-semibold text-sm", children: [
              "\u26A0\uFE0F Access revoked \u2014 but you have ",
              daysLeft,
              " day",
              daysLeft !== 1 ? "s" : "",
              " remaining."
            ] }),
            /* @__PURE__ */ jsx("button", { className: "self-start px-5 py-2.5 bg-plex text-background rounded-lg font-bold hover:bg-plex-hover transition-colors text-sm", onClick: handleRelink, children: "Re-link Plex Account" })
          ] })
        ] })
      ] })
    ] }),
    user && !sessionInfo.session.isAdmin && /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-2xl p-4 md:p-6 shadow-lg", children: [
      /* @__PURE__ */ jsx("p", { className: "text-muted text-xs uppercase tracking-widest font-semibold mb-4", children: "Preferences" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-text font-semibold text-sm", children: "Weekly Newsletter" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted text-xs mt-0.5", children: "Automated library updates delivered to your inbox" })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleToggleNewsletter,
            "aria-label": "Toggle newsletter",
            className: `relative inline-flex items-center w-12 h-6 rounded-full transition-all flex-shrink-0 border ${!optOutNewsletter ? "bg-plex border-plex" : "bg-border border-border"}`,
            children: /* @__PURE__ */ jsx("span", { className: `inline-block w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${!optOutNewsletter ? "translate-x-7" : "translate-x-1"}` })
          }
        )
      ] })
    ] }),
    !sessionInfo?.session?.isAdmin && /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-2xl p-4 md:p-6 shadow-lg", children: [
      user?.isTrial ? /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-plex font-bold text-base mb-1", children: "\u{1F37F} Enjoying your Free Trial?" }),
        /* @__PURE__ */ jsxs("p", { className: "text-muted text-sm leading-relaxed", children: [
          "Once your 3-day trial ends, you'll lose access. A full subscription is just ",
          /* @__PURE__ */ jsx("span", { className: "text-plex font-black", children: "\xA360/year" }),
          ". Get in touch to upgrade!"
        ] })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-text font-bold text-base mb-1", children: "\u{1F4AC} Need Help?" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted text-sm leading-relaxed", children: "Contact the admin to renew your subscription, report an issue, or get support." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: "https://wa.me/447305697245",
            target: "_blank",
            rel: "noreferrer",
            className: "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all border bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20",
            children: [
              /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", width: "18", height: "18", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M12.031 21.972c-1.63 0-3.21-.42-4.606-1.21l-5.111 1.34 1.36-4.972a9.92 9.92 0 0 1-1.34-4.978C2.334 6.64 6.685 2.28 12.031 2.28c5.344 0 9.697 4.36 9.697 9.872 0 5.512-4.353 9.82-9.697 9.82zm0-18.062c-4.47 0-8.115 3.65-8.115 8.13 0 1.48.39 2.92 1.12 4.19l-1.02 3.73 3.82-1a8.13 8.13 0 0 0 4.195 1.15c4.475 0 8.115-3.65 8.115-8.13s-3.64-8.07-8.115-8.07zm4.332 11.23c-.237-.12-1.405-.69-1.62-.77-.216-.08-.372-.12-.53.12-.158.24-.616.77-.754.93-.138.16-.276.18-.513.06-1.124-.55-2.062-1.28-2.812-2.19-.214-.26-.14-.4.08-.56.12-.08.27-.3.41-.45.14-.15.19-.25.28-.42.1-.17.05-.32 0-.44-.05-.12-.53-1.28-.73-1.75-.19-.46-.38-.4-.53-.41h-.45c-.16 0-.41.06-.63.3-.22.24-.85.83-.85 2.02 0 1.19.87 2.34.99 2.5.12.16 1.7 2.6 4.12 3.64 1.38.59 2.05.65 2.8.55.75-.1 1.4-.57 1.6-1.12.2-.55.2-.102.14-1.12-.06-.1-.22-.16-.46-.28z" }) }),
              "WhatsApp"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: "mailto:jasonlucas58@gmail.com",
            className: "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all border bg-white/5 border-white/10 text-text hover:bg-white/10",
            children: [
              /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", width: "18", height: "18", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                /* @__PURE__ */ jsx("rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }),
                /* @__PURE__ */ jsx("path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" })
              ] }),
              "Email"
            ]
          }
        )
      ] })
    ] })
  ] });
};
var StatusDashboard = ({ onBack, isAdmin, isPublic }) => {
  const [statusData, setStatusData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchStatus = useCallback(async () => {
    try {
      const data = await apiFetch("/api/status");
      setStatusData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15e3);
    return () => clearInterval(interval);
  }, [fetchStatus]);
  if (isLoading || !statusData) {
    return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-4xl mx-auto flex flex-col items-center justify-center", children: [
      /* @__PURE__ */ jsxs("header", { className: "flex items-center gap-4 w-full mb-8 pb-4 border-b border-border", children: [
        isPublic && /* @__PURE__ */ jsx("button", { onClick: onBack, className: "p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center text-muted hover:text-text", children: /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 19l-7-7m0 0l7-7m-7 7h18" }) }) }),
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-text", children: "Server Status" })
      ] }),
      /* @__PURE__ */ jsx(Loader, { isLoading: true })
    ] });
  }
  const { config, healthData } = statusData;
  const services = config?.services || [];
  const groups = config?.groups || [];
  return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-6xl mx-auto flex flex-col", children: [
    /* @__PURE__ */ jsxs("header", { className: "flex items-center gap-4 w-full mb-8 pb-4 border-b border-border", children: [
      isPublic && /* @__PURE__ */ jsx("button", { onClick: onBack, className: "p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center text-muted hover:text-text", children: /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 19l-7-7m0 0l7-7m-7 7h18" }) }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-text", children: "Server Status" })
    ] }),
    /* @__PURE__ */ jsxs("main", { className: "user-content", children: [
      config.announcement && config.announcement.enabled && /* @__PURE__ */ jsx("div", { className: "status-announcement", children: config.announcement.message }),
      groups.length === 0 && /* @__PURE__ */ jsx("p", { style: { textAlign: "center", marginTop: "2rem" }, children: "No status monitors configured." }),
      groups.map((group) => {
        const groupServices = services.filter((s) => s.groupId === group.id);
        if (groupServices.length === 0) return null;
        return /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-muted uppercase tracking-[2px] mb-6 border-b border-white/10 pb-2", children: group.name }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: groupServices.map((service) => {
            const health = healthData[service.id] || { currentStatus: "unknown", uptimePercentage: 100, history: [] };
            return /* @__PURE__ */ jsxs("div", { className: "bg-card rounded-xl p-4 md:p-6 border border-white/5 shadow-lg flex flex-col gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2 gap-4", children: [
                /* @__PURE__ */ jsx("h4", { className: "font-bold text-text text-lg", children: service.name }),
                /* @__PURE__ */ jsx("span", { className: `px-3 py-1 rounded-full text-[0.65rem] uppercase tracking-wider font-bold border flex items-center gap-1.5 shadow-lg ${health.currentStatus === "online" ? "bg-status-active/10 text-status-active border-status-active/30 shadow-[0_0_10px_rgba(35,134,54,0.3)]" : health.currentStatus === "offline" ? "bg-status-expired/10 text-[#D32F2F] border-[#D32F2F]/30 shadow-[0_0_10px_rgba(211,47,47,0.3)] animate-pulse" : "bg-status-expiring/10 text-status-expiring border-status-expiring/30 shadow-[0_0_10px_rgba(210,153,34,0.3)]"}`, children: health.currentStatus.toUpperCase() })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-sm text-muted font-medium", children: /* @__PURE__ */ jsxs("span", { children: [
                "Uptime: ",
                health.uptimePercentage,
                "%"
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "flex gap-[2px] h-10 mt-auto items-end pt-4", children: Array.from({ length: 40 }).map((_, i) => {
                const histIndex = health.history.length - 40 + i;
                const hist = histIndex >= 0 ? health.history[histIndex] : null;
                const barClass = hist ? hist.status : "unknown";
                return /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: `flex-1 rounded-sm transition-all duration-300 hover:opacity-100 opacity-80 cursor-pointer ${barClass === "online" ? "bg-status-active h-full shadow-[0_0_8px_rgba(35,134,54,0.6)]" : barClass === "offline" ? "bg-status-expired h-1/4 shadow-[0_0_8px_rgba(218,54,51,0.6)] animate-pulse" : barClass === "degraded" ? "bg-status-expiring h-2/3 shadow-[0_0_8px_rgba(210,153,34,0.6)]" : "bg-border h-1/5"}`,
                    title: hist ? `${hist.status.toUpperCase()} - ${hist.latency}ms` : "No data"
                  },
                  i
                );
              }) })
            ] }, service.id);
          }) })
        ] }, group.id);
      })
    ] })
  ] });
};
var LibraryDashboard = ({ onBack }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentLimit, setRecentLimit] = useState(25);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiFetch(`/api/plex/dashboard?limit=${recentLimit}`);
        if (res.error) throw new Error(res.error);
        setDashboardData(res);
      } catch (err) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 3e4);
    return () => clearInterval(interval);
  }, [recentLimit]);
  if (loading && !dashboardData) return /* @__PURE__ */ jsx(Loader, { isLoading: true });
  const totalStreams = dashboardData?.activeSessions?.length || 0;
  const transcodingStreams = dashboardData?.activeSessions?.filter((s) => s.isTranscoding).length || 0;
  const directStreams = totalStreams - transcodingStreams;
  const totalBandwidthKbps = dashboardData?.activeSessions?.reduce((acc, s) => acc + (s.bandwidth || 0), 0) || 0;
  const totalBandwidthMbps = (totalBandwidthKbps / 1e3).toFixed(2);
  return /* @__PURE__ */ jsx("div", { className: "w-[calc(100%-8px)] md:w-[95%] max-w-[1400px] mx-auto flex flex-col min-h-screen", children: /* @__PURE__ */ jsxs("main", { className: "w-full pb-8 mt-4 md:mt-0", children: [
    error && /* @__PURE__ */ jsx("div", { className: "toast error show", children: error }),
    dashboardData && totalStreams > 0 && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white/5 border border-white/10 rounded-xl py-2 px-3 flex flex-col items-center justify-center gap-0.5 shadow-lg backdrop-blur-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "text-plex font-bold text-2xl", children: totalStreams }),
        /* @__PURE__ */ jsx("span", { className: "text-muted text-[10px] uppercase tracking-wider font-bold", children: "Total Streams" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white/5 border border-white/10 rounded-xl py-2 px-3 flex flex-col items-center justify-center gap-0.5 shadow-lg backdrop-blur-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "text-status-active font-bold text-2xl", children: directStreams }),
        /* @__PURE__ */ jsx("span", { className: "text-muted text-[10px] uppercase tracking-wider font-bold", children: "Direct Play" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white/5 border border-white/10 rounded-xl py-2 px-3 flex flex-col items-center justify-center gap-0.5 shadow-lg backdrop-blur-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "text-status-expiring font-bold text-2xl", children: transcodingStreams }),
        /* @__PURE__ */ jsx("span", { className: "text-muted text-[10px] uppercase tracking-wider font-bold", children: "Transcoding" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white/5 border border-white/10 rounded-xl py-2 px-3 flex flex-col items-center justify-center gap-0.5 shadow-lg backdrop-blur-sm", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-plex font-bold text-2xl", children: [
          totalBandwidthMbps,
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Mbps" })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-muted text-[10px] uppercase tracking-wider font-bold", children: "Total Bandwidth" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "mb-12 w-full", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2", children: "ACTIVITY" }),
      dashboardData && dashboardData.activeSessions && dashboardData.activeSessions.length > 0 ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6", children: dashboardData.activeSessions.map((session, i) => /* @__PURE__ */ jsxs("a", { href: session.plexUrl, target: "_blank", rel: "noreferrer", className: "bg-card rounded-xl border border-border flex flex-col overflow-hidden shadow-lg hover:border-plex/50 hover:shadow-plex/20 transition-all cursor-pointer", style: { textDecoration: "none", color: "inherit" }, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-row flex-grow relative", children: [
          /* @__PURE__ */ jsxs("div", { className: "w-28 md:w-32 flex-shrink-0 relative overflow-hidden bg-card", children: [
            /* @__PURE__ */ jsx("div", { className: "w-full pb-[150%]" }),
            /* @__PURE__ */ jsx("img", { src: `/api/plex/image?path=${encodeURIComponent(session.thumb)}&width=300&height=450`, alt: session.title, loading: "lazy", className: "absolute inset-0 w-full h-full object-cover drop-shadow-2xl" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-3 md:p-4 flex flex-col flex-grow min-w-0 justify-center", children: [
            /* @__PURE__ */ jsxs("div", { className: "activity-header mb-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "activity-title-group", children: [
                /* @__PURE__ */ jsx("div", { className: "text-base md:text-lg font-bold text-text truncate", children: session.grandparentTitle ? session.grandparentTitle : session.title }),
                session.grandparentTitle && /* @__PURE__ */ jsx("div", { className: "text-xs md:text-sm text-muted truncate", children: session.title })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "activity-player text-[10px] md:text-xs text-muted truncate mt-0.5", children: session.playerProduct })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "activity-details flex flex-col gap-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start text-[10px] md:text-xs border-b border-white/5 pb-1", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted uppercase tracking-wider font-bold mt-0.5", children: "PLAYER" }),
                /* @__PURE__ */ jsx("span", { className: "detail-value text-right break-words max-w-[130px] md:max-w-[180px]", children: session.playerTitle })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-[10px] md:text-xs border-b border-white/5 pb-1", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted uppercase tracking-wider font-bold", children: "STREAM" }),
                /* @__PURE__ */ jsx("span", { className: `font-bold ${session.isTranscoding ? "text-status-expiring" : "text-status-active"}`, children: session.isTranscoding ? "Transcode" : "Direct Play" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-[10px] md:text-xs border-b border-white/5 pb-1", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted uppercase tracking-wider font-bold", children: "STATE" }),
                /* @__PURE__ */ jsx("span", { className: "detail-value", children: session.state.charAt(0).toUpperCase() + session.state.slice(1) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-[10px] md:text-xs pb-1", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted uppercase tracking-wider font-bold", children: "BANDWIDTH" }),
                /* @__PURE__ */ jsxs("span", { className: "detail-value", children: [
                  (session.bandwidth / 1e3).toFixed(1),
                  " Mbps"
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-full h-1 bg-background/50 relative mt-auto", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-plex absolute top-0 left-0 transition-all duration-1000", style: { width: `${session.progress}%` } }) })
      ] }, i)) }) : /* @__PURE__ */ jsx("div", { className: "text-center text-muted p-8 border border-dashed border-border rounded-xl mt-4 w-full", children: "No active streams" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-4 items-center mb-8", children: [
      /* @__PURE__ */ jsx("span", { style: { fontSize: "0.85rem", color: "#999" }, children: "RECENTLY ADDED LIMIT" }),
      /* @__PURE__ */ jsxs("select", { className: "w-full md:w-32 p-2 rounded-lg border border-border bg-background text-text outline-none focus:border-plex focus:ring-1 focus:ring-plex transition-all cursor-pointer text-sm", value: recentLimit, onChange: (e) => setRecentLimit(Number(e.target.value)), children: [
        /* @__PURE__ */ jsx("option", { value: 10, children: "10 Items" }),
        /* @__PURE__ */ jsx("option", { value: 25, children: "25 Items" }),
        /* @__PURE__ */ jsx("option", { value: 50, children: "50 Items" }),
        /* @__PURE__ */ jsx("option", { value: 100, children: "100 Items" }),
        /* @__PURE__ */ jsx("option", { value: 150, children: "150 Items" }),
        /* @__PURE__ */ jsx("option", { value: 200, children: "200 Items" }),
        /* @__PURE__ */ jsx("option", { value: 250, children: "250 Items" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-12 w-full", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2", children: "RECENTLY ADDED MOVIES" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 w-full pb-4", children: [
          dashboardData && dashboardData.recentMovies.slice(0, recentLimit).map((item, i) => /* @__PURE__ */ jsxs("a", { href: item.plexUrl, target: "_blank", rel: "noreferrer", className: "flex flex-col w-full gap-2 group", style: { textDecoration: "none", color: "inherit" }, children: [
            /* @__PURE__ */ jsx("div", { className: "relative aspect-[2/3] w-full rounded-lg overflow-hidden border border-border group-hover:border-plex transition-colors shadow-md", children: /* @__PURE__ */ jsx("img", { src: `/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=300&height=450`, alt: item.title, loading: "lazy", className: "w-full h-full object-cover" }) }),
            /* @__PURE__ */ jsx("div", { className: "text-white text-xs font-medium text-center mt-1 line-clamp-2 leading-tight", children: item.title })
          ] }, i)),
          (!dashboardData || dashboardData.recentMovies.length === 0) && /* @__PURE__ */ jsx("div", { className: "text-center text-muted p-8 border border-dashed border-border rounded-xl mt-4 w-full col-span-full", children: "No recent movies" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2", children: "RECENTLY ADDED TV SHOWS" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 w-full pb-4", children: [
          dashboardData && dashboardData.recentShows.slice(0, recentLimit).map((item, i) => /* @__PURE__ */ jsxs("a", { href: item.plexUrl, target: "_blank", rel: "noreferrer", className: "flex flex-col w-full gap-2 group", style: { textDecoration: "none", color: "inherit" }, children: [
            /* @__PURE__ */ jsx("div", { className: "relative aspect-[2/3] w-full rounded-lg overflow-hidden border border-border group-hover:border-plex transition-colors shadow-md", children: /* @__PURE__ */ jsx("img", { src: `/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=300&height=450`, alt: item.title, loading: "lazy", className: "w-full h-full object-cover" }) }),
            /* @__PURE__ */ jsx("div", { className: "text-white text-xs font-medium text-center mt-1 line-clamp-2 leading-tight", children: item.title })
          ] }, i)),
          (!dashboardData || dashboardData.recentShows.length === 0) && /* @__PURE__ */ jsx("div", { className: "text-center text-muted p-8 border border-dashed border-border rounded-xl mt-4 w-full col-span-full", children: "No recent TV shows" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-plex text-sm uppercase tracking-[2px] mb-6 font-bold border-b border-white/10 pb-2", children: "RECENTLY ADDED MUSIC" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 w-full pb-4", children: [
          dashboardData && dashboardData.recentMusic.slice(0, recentLimit).map((item, i) => /* @__PURE__ */ jsxs("a", { href: item.plexUrl, target: "_blank", rel: "noreferrer", className: "flex flex-col w-full gap-2 group", style: { textDecoration: "none", color: "inherit" }, children: [
            /* @__PURE__ */ jsx("div", { className: "relative aspect-square w-full rounded-lg overflow-hidden border border-border group-hover:border-plex transition-colors shadow-md", children: /* @__PURE__ */ jsx("img", { src: `/api/plex/image?path=${encodeURIComponent(item.thumb)}&width=300&height=300`, alt: item.title, loading: "lazy", className: "w-full h-full object-cover" }) }),
            /* @__PURE__ */ jsx("div", { className: "text-white text-xs font-medium text-center mt-1 line-clamp-2 leading-tight", children: item.title })
          ] }, i)),
          (!dashboardData || dashboardData.recentMusic.length === 0) && /* @__PURE__ */ jsx("div", { className: "text-center text-muted p-8 border border-dashed border-border rounded-xl mt-4 w-full col-span-full", children: "No recent music" })
        ] })
      ] })
    ] })
  ] }) });
};
var Navigation = ({ currentRoute, onNavigate, onLogout, isAdmin, serverName, adminThumb, requestUrl }) => {
  useEffect(() => {
    updateFavicon(adminThumb);
  }, [adminThumb]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "md:hidden fixed top-0 left-0 right-0 h-16 bg-[#161b22] border-b border-[#30363d] z-50 flex items-center justify-between px-4 shadow-md", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: adminThumb ? adminThumb.startsWith("http") ? adminThumb : `/api/plex/image?path=${encodeURIComponent(adminThumb)}&width=64&height=64` : "/static/logo.png",
            alt: "Logo",
            className: "w-8 h-8 rounded-full object-cover",
            onError: (e) => {
              e.target.src = "/static/logo.png";
            }
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "font-bold text-text uppercase tracking-widest text-sm", children: serverName })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("button", { onClick: (e) => {
          e.preventDefault();
          onNavigate("analytics");
        }, className: `text-muted hover:text-text transition-colors ${currentRoute === "analytics" ? "text-plex" : ""}`, children: /* @__PURE__ */ jsx(ChartColumn, { className: "w-5 h-5" }) }),
        isAdmin && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("button", { onClick: (e) => {
            e.preventDefault();
            onNavigate("mediastack");
          }, className: `text-muted hover:text-text transition-colors ${currentRoute === "mediastack" ? "text-plex" : ""}`, children: /* @__PURE__ */ jsx(Layers, { className: "w-5 h-5" }) }),
          /* @__PURE__ */ jsx("button", { onClick: (e) => {
            e.preventDefault();
            onNavigate("logs");
          }, className: `text-muted hover:text-text transition-colors ${currentRoute === "logs" ? "text-plex" : ""}`, children: /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5" }) }),
          /* @__PURE__ */ jsx("button", { onClick: (e) => {
            e.preventDefault();
            onNavigate("settings");
          }, className: `text-muted hover:text-text transition-colors ${currentRoute === "settings" ? "text-plex" : ""}`, children: /* @__PURE__ */ jsx(Settings, { className: "w-5 h-5" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "hidden md:flex flex-col w-72 bg-card border-r border-border p-6 sticky top-0 h-screen shadow-2xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center mb-10", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-text text-center mb-4", children: serverName }),
        /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsx("div", { className: "w-24 h-24 rounded-full p-[2px] bg-gradient-to-r from-plex to-[#e5a00d] shadow-lg shadow-plex/20", children: /* @__PURE__ */ jsx("div", { className: "w-full h-full rounded-full overflow-hidden bg-card", children: /* @__PURE__ */ jsx(
          "img",
          {
            src: adminThumb ? adminThumb.startsWith("http") ? adminThumb : `/api/plex/image?path=${encodeURIComponent(adminThumb)}&width=192&height=192` : "/static/logo.png",
            alt: "Admin Profile",
            className: "w-full h-full object-cover",
            onError: (e) => {
              e.target.src = "/static/logo.png";
            }
          }
        ) }) }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
        /* @__PURE__ */ jsxs("a", { href: "#", className: `flex items-center gap-4 p-3 text-muted no-underline rounded-lg transition-all font-medium hover:bg-white/5 hover:text-text ${["admin", "user"].includes(currentRoute) ? "border-l-4 border-plex rounded-l-none bg-white/5 text-text" : ""}`, onClick: (e) => {
          e.preventDefault();
          onNavigate(isAdmin ? "admin" : "user");
        }, children: [
          /* @__PURE__ */ jsx(House, { className: "w-5 h-5 flex-shrink-0" }),
          " Home"
        ] }),
        /* @__PURE__ */ jsxs("a", { href: "#", className: `flex items-center gap-4 p-3 text-muted no-underline rounded-lg transition-all font-medium hover:bg-white/5 hover:text-text ${currentRoute === "dashboard" ? "border-l-4 border-plex rounded-l-none bg-white/5 text-text" : ""}`, onClick: (e) => {
          e.preventDefault();
          onNavigate("dashboard");
        }, children: [
          /* @__PURE__ */ jsx(Film, { className: "w-5 h-5 flex-shrink-0" }),
          " Discover"
        ] }),
        /* @__PURE__ */ jsxs("a", { href: "#", className: `flex items-center gap-4 p-3 text-muted no-underline rounded-lg transition-all font-medium hover:bg-white/5 hover:text-text ${currentRoute === "status" ? "border-l-4 border-plex rounded-l-none bg-white/5 text-text" : ""}`, onClick: (e) => {
          e.preventDefault();
          onNavigate("status");
        }, children: [
          /* @__PURE__ */ jsx(Activity, { className: "w-5 h-5 flex-shrink-0" }),
          " Status"
        ] }),
        isAdmin && /* @__PURE__ */ jsxs("a", { href: "#", className: `flex items-center gap-4 p-3 text-muted no-underline rounded-lg transition-all font-medium hover:bg-white/5 hover:text-text ${currentRoute === "settings" ? "border-l-4 border-plex rounded-l-none bg-white/5 text-text" : ""}`, onClick: (e) => {
          e.preventDefault();
          onNavigate("settings");
        }, children: [
          /* @__PURE__ */ jsx(Settings, { className: "w-5 h-5 flex-shrink-0" }),
          " Settings"
        ] }),
        isAdmin && /* @__PURE__ */ jsxs("a", { href: "#", className: `flex items-center gap-4 p-3 text-muted no-underline rounded-lg transition-all font-medium hover:bg-white/5 hover:text-text ${currentRoute === "logs" ? "border-l-4 border-plex rounded-l-none bg-white/5 text-text" : ""}`, onClick: (e) => {
          e.preventDefault();
          onNavigate("logs");
        }, children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 flex-shrink-0" }),
          " Logs"
        ] }),
        /* @__PURE__ */ jsxs("a", { href: "#", className: `flex items-center gap-4 p-3 text-muted no-underline rounded-lg transition-all font-medium hover:bg-white/5 hover:text-text ${currentRoute === "analytics" ? "border-l-4 border-plex rounded-l-none bg-white/5 text-text" : ""}`, onClick: (e) => {
          e.preventDefault();
          onNavigate("analytics");
        }, children: [
          /* @__PURE__ */ jsx(ChartColumn, { className: "w-5 h-5 flex-shrink-0" }),
          " Analytics"
        ] }),
        /* @__PURE__ */ jsxs("a", { href: "#", className: `flex items-center gap-4 p-3 text-muted no-underline rounded-lg transition-all font-medium hover:bg-white/5 hover:text-text ${currentRoute === "mediastack" ? "border-l-4 border-plex rounded-l-none bg-white/5 text-text" : ""}`, onClick: (e) => {
          e.preventDefault();
          onNavigate("mediastack");
        }, children: [
          /* @__PURE__ */ jsx(Layers, { className: "w-5 h-5 flex-shrink-0" }),
          " Media Stack"
        ] }),
        /* @__PURE__ */ jsxs("a", { href: requestUrl, target: "_blank", rel: "noreferrer", className: "flex items-center gap-4 p-3 text-muted no-underline rounded-lg transition-all font-medium hover:bg-white/5 hover:text-text", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "w-5 h-5 flex-shrink-0" }),
          " Request Content"
        ] }),
        /* @__PURE__ */ jsxs("a", { href: "#", className: "flex items-center gap-4 p-3 text-muted no-underline rounded-lg transition-all font-medium hover:bg-white/5 hover:text-text", onClick: (e) => {
          e.preventDefault();
          onLogout();
        }, children: [
          /* @__PURE__ */ jsx(LogOut, { className: "w-5 h-5 flex-shrink-0" }),
          " Logout"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "md:hidden fixed bottom-0 left-0 right-0 w-full bg-[#161b22] border-t border-[#30363d] z-50 pb-[env(safe-area-inset-bottom)]", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-around items-center h-16", children: [
      /* @__PURE__ */ jsxs("a", { href: "#", className: `relative flex flex-col items-center justify-center gap-1 h-full flex-1 text-center text-[0.65rem] transition-colors ${["admin", "user"].includes(currentRoute) ? "text-plex font-bold" : "text-muted hover:text-text"}`, onClick: (e) => {
        e.preventDefault();
        onNavigate(isAdmin ? "admin" : "user");
      }, children: [
        /* @__PURE__ */ jsx(House, { className: "w-5 h-5 flex-shrink-0" }),
        " Home",
        ["admin", "user"].includes(currentRoute) && /* @__PURE__ */ jsx("div", { className: "absolute bottom-1 w-1.5 h-1.5 rounded-full bg-plex shadow-[0_0_5px_rgba(229,160,13,0.8)]" })
      ] }),
      /* @__PURE__ */ jsxs("a", { href: "#", className: `relative flex flex-col items-center justify-center gap-1 h-full flex-1 text-center text-[0.65rem] transition-colors ${currentRoute === "dashboard" ? "text-plex font-bold" : "text-muted hover:text-text"}`, onClick: (e) => {
        e.preventDefault();
        onNavigate("dashboard");
      }, children: [
        /* @__PURE__ */ jsx(Film, { className: "w-5 h-5 flex-shrink-0" }),
        " Discover",
        currentRoute === "dashboard" && /* @__PURE__ */ jsx("div", { className: "absolute bottom-1 w-1.5 h-1.5 rounded-full bg-plex shadow-[0_0_5px_rgba(229,160,13,0.8)]" })
      ] }),
      /* @__PURE__ */ jsxs("a", { href: "#", className: `relative flex flex-col items-center justify-center gap-1 h-full flex-1 text-center text-[0.65rem] transition-colors ${currentRoute === "status" ? "text-plex font-bold" : "text-muted hover:text-text"}`, onClick: (e) => {
        e.preventDefault();
        onNavigate("status");
      }, children: [
        /* @__PURE__ */ jsx(Activity, { className: "w-5 h-5 flex-shrink-0" }),
        " Status",
        currentRoute === "status" && /* @__PURE__ */ jsx("div", { className: "absolute bottom-1 w-1.5 h-1.5 rounded-full bg-plex shadow-[0_0_5px_rgba(229,160,13,0.8)]" })
      ] }),
      /* @__PURE__ */ jsxs("a", { href: "#", className: `relative flex flex-col items-center justify-center gap-1 h-full flex-1 text-center text-[0.65rem] transition-colors ${currentRoute === "analytics" ? "text-plex font-bold" : "text-muted hover:text-text"}`, onClick: (e) => {
        e.preventDefault();
        onNavigate("analytics");
      }, children: [
        /* @__PURE__ */ jsx(ChartColumn, { className: "w-5 h-5 flex-shrink-0" }),
        " Analytics",
        currentRoute === "analytics" && /* @__PURE__ */ jsx("div", { className: "absolute bottom-1 w-1.5 h-1.5 rounded-full bg-plex shadow-[0_0_5px_rgba(229,160,13,0.8)]" })
      ] }),
      /* @__PURE__ */ jsxs("a", { href: "#", className: `relative flex flex-col items-center justify-center gap-1 h-full flex-1 text-center text-[0.65rem] transition-colors ${currentRoute === "mediastack" ? "text-plex font-bold" : "text-muted hover:text-text"}`, onClick: (e) => {
        e.preventDefault();
        onNavigate("mediastack");
      }, children: [
        /* @__PURE__ */ jsx(Layers, { className: "w-5 h-5 flex-shrink-0" }),
        " Media",
        currentRoute === "mediastack" && /* @__PURE__ */ jsx("div", { className: "absolute bottom-1 w-1.5 h-1.5 rounded-full bg-plex shadow-[0_0_5px_rgba(229,160,13,0.8)]" })
      ] }),
      isAdmin && /* @__PURE__ */ jsxs("a", { href: "#", className: `relative flex flex-col items-center justify-center gap-1 h-full flex-1 text-center text-[0.65rem] transition-colors ${currentRoute === "settings" ? "text-plex font-bold" : "text-muted hover:text-text"}`, onClick: (e) => {
        e.preventDefault();
        onNavigate("settings");
      }, children: [
        /* @__PURE__ */ jsx(Settings, { className: "w-5 h-5 flex-shrink-0" }),
        " Settings",
        currentRoute === "settings" && /* @__PURE__ */ jsx("div", { className: "absolute bottom-1 w-1.5 h-1.5 rounded-full bg-plex shadow-[0_0_5px_rgba(229,160,13,0.8)]" })
      ] }),
      /* @__PURE__ */ jsxs("a", { href: requestUrl, target: "_blank", rel: "noreferrer", className: "relative flex flex-col items-center justify-center gap-1 h-full text-muted flex-1 text-center text-[0.65rem] transition-colors hover:text-text", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "w-5 h-5 flex-shrink-0" }),
        " Request"
      ] }),
      /* @__PURE__ */ jsxs("a", { href: "#", className: "relative flex flex-col items-center justify-center gap-1 h-full text-muted flex-1 text-center text-[0.65rem] transition-colors hover:text-text", onClick: (e) => {
        e.preventDefault();
        onLogout();
      }, children: [
        /* @__PURE__ */ jsx(LogOut, { className: "w-5 h-5 flex-shrink-0" }),
        " Logout"
      ] })
    ] }) })
  ] });
};
var MainApp = () => {
  const [currentRoute, setCurrentRoute] = useState("loading");
  const [sessionInfo, setSessionInfo] = useState(null);
  const setRoute = useCallback((route) => {
    setCurrentRoute(route);
    if (route !== "loading") {
      let path = "/";
      if (route === "admin") path = "/admin";
      if (route === "user") path = "/portal";
      if (route === "status") path = "/status";
      if (route === "dashboard") path = "/dashboard";
      if (route === "settings") path = "/settings";
      if (route === "logs") path = "/logs";
      if (route === "analytics") path = "/analytics";
      if (route === "mediastack") path = "/mediastack";
      window.history.pushState({}, "", path);
    }
  }, []);
  const checkSession = useCallback(async () => {
    const path = window.location.pathname;
    try {
      const data = await apiFetch("/api/users/me");
      setSessionInfo(data);
      if (data.serverName) document.title = `${data.serverName} Portal`;
      if (path === "/status") setCurrentRoute("status");
      else if (path === "/dashboard") setCurrentRoute("dashboard");
      else if (path === "/settings" && data.session.isAdmin) setCurrentRoute("settings");
      else if (path === "/logs" && data.session.isAdmin) setCurrentRoute("logs");
      else if (path === "/mediastack") setCurrentRoute("mediastack");
      else if (path === "/analytics") setCurrentRoute("analytics");
      else if (path === "/settings" && !data.session.isAdmin) setCurrentRoute("user");
      else if (path === "/portal") setCurrentRoute("user");
      else if (path === "/admin") setCurrentRoute("admin");
      else {
        const defaultRoute = data.session.isAdmin ? "admin" : "user";
        window.history.replaceState({}, "", defaultRoute === "admin" ? "/admin" : "/portal");
        setCurrentRoute(defaultRoute);
      }
    } catch {
      if (path === "/status") setCurrentRoute("status");
      else if (path === "/dashboard") setCurrentRoute("dashboard");
      else setCurrentRoute("login");
    }
  }, []);
  useEffect(() => {
    if (!window.location.hash.startsWith("#auth/")) {
      checkSession();
    } else {
      setRoute("login");
    }
  }, [checkSession, setRoute]);
  const handleLogout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setSessionInfo(null);
    setRoute("login");
  };
  if (currentRoute === "loading") return /* @__PURE__ */ jsx(Loader, { isLoading: true });
  if (currentRoute === "login") return /* @__PURE__ */ jsx(Login, { onLoginSuccess: checkSession });
  const isAdmin = !!sessionInfo?.session?.isAdmin;
  const isPublicStatus = currentRoute === "status" && !sessionInfo;
  const renderView = () => {
    if (currentRoute === "status") return /* @__PURE__ */ jsx(StatusDashboard, { onBack: () => isPublicStatus ? setRoute("login") : setRoute(isAdmin ? "admin" : "user"), isAdmin, isPublic: isPublicStatus });
    if (currentRoute === "dashboard") return /* @__PURE__ */ jsx(LibraryDashboard, { onBack: () => setRoute(isAdmin ? "admin" : "user") });
    if (currentRoute === "settings" && isAdmin) return /* @__PURE__ */ jsx(SettingsDashboard, {});
    if (currentRoute === "logs" && isAdmin) return /* @__PURE__ */ jsx(LogsDashboard, { onLogout: handleLogout });
    if (currentRoute === "mediastack") return /* @__PURE__ */ jsx(MediaStackDashboard, { isAdmin });
    if (currentRoute === "analytics") return /* @__PURE__ */ jsx(AnalyticsDashboard, { isAdmin, sessionInfo });
    if (currentRoute === "admin") return /* @__PURE__ */ jsx(AdminDashboard, { onLogout: handleLogout, onViewUserPortal: () => setRoute("user"), onViewStatus: () => setRoute("status"), onViewDashboard: () => setRoute("dashboard") });
    return /* @__PURE__ */ jsx(UserDashboard, { sessionInfo, onLogout: handleLogout, refreshSession: checkSession, onViewAdmin: () => setRoute("admin"), onViewStatus: () => setRoute("status"), onViewDashboard: () => setRoute("dashboard") });
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex w-full min-h-screen bg-background", children: [
    !isPublicStatus && /* @__PURE__ */ jsx(Navigation, { currentRoute, onNavigate: setRoute, onLogout: handleLogout, isAdmin, serverName: sessionInfo?.serverName || "Plex Server", adminThumb: sessionInfo?.adminThumb, requestUrl: sessionInfo?.requestUrl || "https://plexified.co.uk" }),
    /* @__PURE__ */ jsx("div", { className: `flex-grow flex flex-col items-center p-4 md:p-8 pt-20 pb-[80px] md:pt-8 md:pb-8 w-full overflow-x-hidden ${isPublicStatus ? "!pt-8 !pb-8" : ""}`, children: renderView() })
  ] });
};
var container = document.getElementById("root");
var root = createRoot(container);
root.render(/* @__PURE__ */ jsx(MainApp, {}));
/*! Bundled license information:

lucide-react/dist/esm/shared/src/utils/mergeClasses.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/shared/src/utils/toKebabCase.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/shared/src/utils/toCamelCase.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/shared/src/utils/toPascalCase.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/defaultAttributes.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/shared/src/utils/hasA11yProp.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/context.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/Icon.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/createLucideIcon.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/activity.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/calendar.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/chart-column.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/clock.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/cloud-download.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/file-text.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/film.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/hard-drive.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/house.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/layers.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/log-out.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/settings.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/sparkles.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/square-play.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/star.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/trending-up.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/tv.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/users.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/icons/x.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/lucide-react.mjs:
  (**
   * @license lucide-react v1.21.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
