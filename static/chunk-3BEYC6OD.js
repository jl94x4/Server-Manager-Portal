// client/upgrader/presets.ts
var UPGRADER_CODEC_OPTIONS = [
  { id: "h264", label: "H.264 / x264" },
  { id: "hevc", label: "HEVC" },
  { id: "av1", label: "AV1" },
  { id: "vp9", label: "VP9" }
];
var UPGRADER_RESOLUTION_OPTIONS = [
  { id: "sd", label: "SD" },
  { id: "720p", label: "720p" },
  { id: "1080p", label: "1080p" },
  { id: "4k", label: "4K" }
];
var UPGRADER_FEATURE_OPTIONS = [
  { id: "non_hevc", label: "Non-HEVC" },
  { id: "hdr", label: "HDR" },
  { id: "dolby_vision", label: "Dolby Vision" },
  { id: "large", label: "Large Size" },
  { id: "zero_size", label: "0 Byte Files" }
];
var UPGRADER_QUALITY_OPTIONS = [
  { id: "webdl", label: "WEB-DL" },
  { id: "webrip", label: "WEBRip" },
  { id: "remux", label: "Remux" },
  { id: "hdtv", label: "HDTV" },
  { id: "bluray", label: "BluRay" }
];
var UPGRADER_PRESET_SELECT_OPTIONS = [
  { value: "all", label: "All titles" },
  { value: "non_hevc", label: "Non-HEVC" },
  { value: "h264_only", label: "H.264 / x264" },
  { value: "hevc_only", label: "HEVC only" },
  { value: "av1_only", label: "AV1 only" },
  { value: "vp9_only", label: "VP9 only" },
  { value: "sd", label: "SD" },
  { value: "720p", label: "720p" },
  { value: "1080p", label: "1080p" },
  { value: "4k_all", label: "4K (all)" },
  { value: "4k_non_hevc", label: "4K non-HEVC" },
  { value: "hdr_non_hevc", label: "HDR non-HEVC" },
  { value: "dolby_vision", label: "Dolby Vision" },
  { value: "large_non_hevc", label: "Large non-HEVC" }
];

export {
  UPGRADER_CODEC_OPTIONS,
  UPGRADER_RESOLUTION_OPTIONS,
  UPGRADER_FEATURE_OPTIONS,
  UPGRADER_QUALITY_OPTIONS,
  UPGRADER_PRESET_SELECT_OPTIONS
};
