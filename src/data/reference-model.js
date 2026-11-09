/**
 * NOCTURNE reference entropy model.
 *
 * These are deliberately broad, documented ranges, not measured population
 * frequencies. They are informed by EFF's Panopticlick research and modern
 * browser-fingerprinting literature. The UI must always present the result as
 * an estimate and link to docs/METHODOLOGY.md.
 */
export const MODEL_VERSION = "2026.1";

/** Signals overlap heavily (browser, OS, GPU, fonts), so raw sums overstate. */
export const CORRELATION_FACTOR = 0.5;

/** Maximum aggregate estimate. Precision beyond 24 bits would be misleading. */
export const MAX_BITS = 24;

/**
 * @typedef {Object} AttributeSpec
 * @property {string} label
 * @property {string} category
 * @property {number} low
 * @property {number} high
 * @property {string} why
 * @property {boolean} [volatile] excluded from the stable signature and entropy
 * @property {boolean} [excludeFromSignature]
 * @property {boolean} [excludeFromEntropy]
 */

/** @type {Record<string, AttributeSpec>} */
export const ATTRIBUTE_MODEL = Object.freeze({
  userAgent: {
    label: "User agent",
    category: "Browser",
    low: 4,
    high: 8.5,
    why: "The full browser and OS version string is usually sent with every request. It is one of the strongest single identifiers.",
  },
  uaBrands: {
    label: "User-Agent Client Hints",
    category: "Browser",
    low: 0.5,
    high: 1.5,
    why: "Newer browsers expose a reduced brand, version, platform, and mobile hint set. The exact combination can separate browsers.",
  },
  platform: {
    label: "Platform",
    category: "Browser",
    low: 0.5,
    high: 1,
    why: "The declared platform narrows a fingerprint to an OS family and architecture.",
  },
  languages: {
    label: "Languages",
    category: "Locale",
    low: 0.5,
    high: 2,
    why: "Your language list is often unusual in ways that correlate with region, community, and device setup.",
  },
  timezone: {
    label: "Time zone",
    category: "Locale",
    low: 1,
    high: 2.5,
    why: "A time zone narrows the likely region and, combined with languages, can be quite specific.",
  },
  screen: {
    label: "Screen and display",
    category: "Display",
    low: 1.5,
    high: 3,
    why: "Resolution, available area, colour depth, and display mode form a stable device profile.",
  },
  dpr: {
    label: "Pixel ratio",
    category: "Display",
    low: 0.5,
    high: 1.5,
    why: "Device pixel ratio separates display classes and scaling configurations.",
  },
  canvas: {
    label: "Canvas fingerprint",
    category: "Rendering",
    low: 3,
    high: 6,
    why: "Tiny differences in text rasterisation, GPU drivers, fonts, and anti-aliasing create a visual hash.",
  },
  webgl: {
    label: "WebGL fingerprint",
    category: "Rendering",
    low: 2.5,
    high: 5,
    why: "GPU vendor, renderer, limits, and pixel output can identify a hardware and driver combination.",
  },
  audio: {
    label: "Audio fingerprint",
    category: "Rendering",
    low: 1.5,
    high: 4,
    why: "Audio signal processing differs subtly across hardware and browser builds.",
  },
  fonts: {
    label: "Installed fonts",
    category: "Rendering",
    low: 2,
    high: 5,
    why: "A long or unusual font list is one of the classic high-entropy fingerprinting signals.",
  },
  hardware: {
    label: "Hardware profile",
    category: "Device",
    low: 0.5,
    high: 1.5,
    why: "CPU thread count and reported memory narrow the device class.",
  },
  media: {
    label: "Media and codecs",
    category: "Device",
    low: 0.5,
    high: 2.5,
    why: "Supported codecs and media devices vary by OS, browser build, and hardware.",
  },
  touch: {
    label: "Input and pointer",
    category: "Device",
    low: 0.5,
    high: 1,
    why: "Touch points and pointer capabilities separate phones, tablets, laptops, and desktop setups.",
  },
  plugins: {
    label: "Browser plugins and PDF",
    category: "Browser",
    low: 0,
    high: 1,
    why: "Plugin and built-in viewer combinations are far smaller than they once were, but can still add signal.",
  },
  storage: {
    label: "Storage availability",
    category: "Privacy",
    low: 0,
    high: 1,
    why: "Whether cookies and local storage are available affects how trackers can link visits.",
  },
  privacy: {
    label: "Privacy signals",
    category: "Privacy",
    low: 0,
    high: 1,
    why: "Do Not Track and Global Privacy Control are visible signals and can themselves be distinctive.",
  },
  webrtc: {
    label: "WebRTC candidates",
    category: "Network",
    low: 0,
    high: 1,
    why: "WebRTC can expose local network information unless the browser uses mDNS or blocks candidates.",
  },
  viewport: {
    label: "Viewport",
    category: "Display",
    low: 0,
    high: 0,
    why: "Current window dimensions are volatile and are not used in the stable score.",
    volatile: true,
    excludeFromSignature: true,
    excludeFromEntropy: true,
  },
  blocker: {
    label: "Ad-filter heuristic",
    category: "Privacy",
    low: 0,
    high: 0,
    why: "A weak local heuristic, not a real tracker-blocking test. It is excluded from the fingerprint estimate.",
    excludeFromSignature: true,
    excludeFromEntropy: true,
  },
});

/** Preferred display order in reports. */
export const ATTRIBUTE_ORDER = Object.freeze([
  "userAgent",
  "uaBrands",
  "platform",
  "languages",
  "timezone",
  "screen",
  "dpr",
  "hardware",
  "touch",
  "media",
  "canvas",
  "webgl",
  "audio",
  "fonts",
  "plugins",
  "storage",
  "privacy",
  "webrtc",
  "viewport",
  "blocker",
]);
