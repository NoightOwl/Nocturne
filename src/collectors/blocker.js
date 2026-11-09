import { result } from "./utils.js";

const BAIT_CLASS = "nocturne-bait-ad adsbox ad-banner pub_300x250 sponsored-ad";
const REQUEST_TIMEOUT = 700;

function cosmeticCheck() {
  const bait = document.createElement("div");
  bait.className = BAIT_CLASS;
  bait.setAttribute("aria-hidden", "true");
  bait.textContent = "advertisement";
  document.body.append(bait);

  try {
    const style = getComputedStyle(bait);
    const rect = bait.getBoundingClientRect();
    const visible =
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity) !== 0 &&
      rect.width > 1 &&
      rect.height > 1;
    return !visible;
  } finally {
    bait.remove();
  }
}

function requestCheck() {
  return new Promise((resolve) => {
    let settled = false;
    let timer;
    const script = document.createElement("script");
    script.src = new URL("./assets/probes/ads-bait.js", document.baseURI).href;
    script.async = true;

    const finish = (status) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      script.remove();
      try {
        delete window.__nocturneAdProbeLoaded;
      } catch {
        window.__nocturneAdProbeLoaded = undefined;
      }
      resolve(status);
    };

    script.onload = () => finish(window.__nocturneAdProbeLoaded === true ? "loaded" : "unknown");
    script.onerror = () => finish("blocked");
    timer = setTimeout(() => finish("unknown"), REQUEST_TIMEOUT);
    document.head.append(script);
  });
}

export default {
  id: "blocker",
  label: "Ad-filter heuristic",
  category: "Privacy",
  group: "async",
  timeoutMs: 2000,
  async collect() {
    const cosmetic = cosmeticCheck();
    const request = await requestCheck();
    const detected = cosmetic || request === "blocked";

    return [
      result(
        "blocker",
        "Ad-filter heuristic",
        "Privacy",
        { cosmetic, request, detected },
        detected
          ? cosmetic
            ? "Cosmetic ad filter detected"
            : "Local bait request blocked"
          : "No local ad filter detected",
        {
          stability: "volatile",
          note: "This is a weak local heuristic, not a tracker-blocking test. It cannot prove that no blocker is active.",
        },
      ),
    ];
  },
};
