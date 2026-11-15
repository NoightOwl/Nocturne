import { BRAND } from "./brand.js";
import { pluralize } from "../lib/format.js";

function attributeMap(attributes) {
  return new Map(attributes.map((attribute) => [attribute.id, attribute]));
}

function valueOf(attribute, fallback = null) {
  return attribute?.status === "ok" ? attribute.value : fallback;
}

export function buildSignals(attributes) {
  const map = attributeMap(attributes);
  const privacy = valueOf(map.get("privacy")) || {};
  const storage = valueOf(map.get("storage")) || {};
  const fonts = valueOf(map.get("fonts")) || {};
  const webrtc = valueOf(map.get("webrtc")) || {};
  const blocker = valueOf(map.get("blocker")) || {};
  const canvas = map.get("canvas");
  const webgl = map.get("webgl");
  const audio = map.get("audio");

  const signals = [];

  signals.push({
    id: "gpc",
    label: "Global Privacy Control",
    status: privacy.gpc === true ? "pass" : privacy.gpc === false ? "warn" : "unknown",
    detail:
      privacy.gpc === true
        ? "Your browser sends an opt-out signal. Sites are not required to honour it."
        : privacy.gpc === false
          ? "Your browser does not send a Global Privacy Control opt-out signal."
          : "This browser does not expose a GPC signal to JavaScript.",
  });

  signals.push({
    id: "dnt",
    label: "Do Not Track",
    status: privacy.dnt === "enabled" ? "pass" : privacy.dnt === "disabled" ? "warn" : "unknown",
    detail:
      privacy.dnt === "enabled"
        ? "A Do Not Track header is requested. Most sites ignore it."
        : privacy.dnt === "disabled"
          ? "Do Not Track is explicitly disabled or unsupported."
          : "Do Not Track is unset or not exposed to JavaScript.",
  });

  signals.push({
    id: "canvas",
    label: "Canvas readback",
    status:
      canvas?.stability === "randomized" || canvas?.status === "blocked"
        ? "pass"
        : canvas?.status === "ok"
          ? "warn"
          : "unknown",
    detail:
      canvas?.stability === "randomized"
        ? "The canvas hash changed between samples — the browser is adding noise."
        : canvas?.status === "blocked"
          ? "Canvas pixel readback is blocked."
          : canvas?.status === "ok"
            ? "A tracker can read canvas pixels and derive a stable visual hash."
            : "Canvas readback could not be measured.",
  });

  signals.push({
    id: "webgl",
    label: "WebGL / GPU",
    status:
      webgl?.stability === "randomized" || webgl?.status === "blocked"
        ? "pass"
        : webgl?.status === "ok"
          ? "warn"
          : "unknown",
    detail:
      webgl?.status === "ok"
        ? "The GPU renderer, limits, or rendered pixels are readable."
        : webgl?.status === "blocked"
          ? "WebGL is unavailable or blocked."
          : "WebGL could not be measured.",
  });

  signals.push({
    id: "audio",
    label: "Audio fingerprint",
    status:
      audio?.stability === "randomized" || audio?.status === "blocked"
        ? "pass"
        : audio?.status === "ok"
          ? "warn"
          : "unknown",
    detail:
      audio?.stability === "randomized"
        ? "Audio output changed between samples — the browser is adding noise."
        : audio?.status === "blocked"
          ? "Offline audio rendering is blocked."
          : audio?.status === "ok"
            ? "An offline audio rendering produces a readable signal hash."
            : "Audio fingerprinting could not be measured.",
  });

  signals.push({
    id: "webrtc",
    label: "WebRTC candidates",
    status: webrtc.rawIp ? "warn" : webrtc.candidateCount > 0 ? "pass" : "unknown",
    detail: webrtc.rawIp
      ? "A raw IP address appeared in local WebRTC candidates."
      : webrtc.candidateCount > 0
        ? "Candidates were limited to mDNS-style or non-address values."
        : "No local WebRTC candidates were produced.",
  });

  const fontCount = Number(fonts.count) || 0;
  signals.push({
    id: "fonts",
    label: "Font surface",
    status: fontCount === 0 ? "unknown" : fontCount > 35 ? "warn" : "pass",
    detail:
      fontCount === 0
        ? "Font detection was unavailable."
        : `${pluralize(fontCount, "font")} detected. A large or unusual list adds bits.`,
  });

  const storageOn = Boolean(storage.cookies || storage.localStorage || storage.indexedDB);
  signals.push({
    id: "storage",
    label: "Persistent storage",
    status: storageOn ? "warn" : "pass",
    detail: storageOn
      ? "First-party cookies or local storage are available, so sites can link visits within this browser."
      : "First-party persistent storage appears unavailable.",
  });

  signals.push({
    id: "blocker",
    label: "Ad-filter heuristic",
    status: blocker.detected ? "pass" : "unknown",
    detail: blocker.detected
      ? "A cosmetic or request-pattern ad filter was detected. This is a weak signal, not proof of tracker blocking."
      : "No local ad-filter heuristic fired. It cannot prove that no blocker is active.",
  });

  return signals;
}

export function buildRecommendations(attributes, signals, entropy) {
  const map = attributeMap(attributes);
  const privacy = valueOf(map.get("privacy")) || {};
  const fonts = valueOf(map.get("fonts")) || {};
  const webrtc = valueOf(map.get("webrtc")) || {};
  const browser = valueOf(map.get("userAgent")) || "";
  const recommendations = [];
  const randomized = ["canvas", "webgl", "audio"].some(
    (id) => map.get(id)?.stability === "randomized",
  );

  if (randomized) {
    recommendations.push({
      tone: "good",
      title: "Your browser is already adding noise",
      body: "At least one rendering surface changed between samples. That makes a stable visual hash much harder to build. Keep using the fingerprint-protection mode that produced this result.",
    });
  } else {
    recommendations.push({
      tone: "info",
      title: "Use a browser built to resist fingerprints",
      body: "Tor Browser aims for a shared fingerprint. Brave and Firefox with strict fingerprinting protection randomise or reduce common surfaces for everyday browsing.",
      link: { label: "Tor Browser", url: BRAND.torUrl },
      secondaryLink: { label: "Firefox", url: BRAND.firefoxUrl },
    });
  }

  if (map.get("canvas")?.status === "ok" && map.get("canvas")?.stability !== "randomized") {
    recommendations.push({
      tone: "warn",
      title: "Canvas readback is exposed",
      body: "Canvas pixel readback gives trackers a compact visual hash. Prefer a browser that blocks or randomises canvas data; avoid extensions that only hide one canvas call.",
    });
  }

  if (map.get("webgl")?.status === "ok" && map.get("webgl")?.stability !== "randomized") {
    recommendations.push({
      tone: "warn",
      title: "Your GPU is visible",
      body: "WebGL renderer strings and rendering limits can separate hardware and driver combinations. Fingerprint-resistant browsers return generic or randomised values.",
    });
  }

  if (Number(fonts.count) > 30) {
    recommendations.push({
      tone: "info",
      title: "Your font list is doing a lot of work",
      body: `${pluralize(fonts.count, "font")} were detected. Installing many design or language fonts can make a browser more distinctive, though this is usually a weak signal on its own.`,
    });
  }

  if (privacy.gpc !== true) {
    recommendations.push({
      tone: "info",
      title: "Send an opt-out signal anyway",
      body: "Turn on Global Privacy Control where your browser supports it. It is not a silver bullet, but it is a clear, machine-readable request to sites that respect it.",
    });
  }

  if (webrtc.rawIp) {
    recommendations.push({
      tone: "warn",
      title: "WebRTC exposed a raw address",
      body: "A local IP address appeared in ICE candidates. Use a browser that hides candidates behind mDNS, or disable WebRTC when you do not need real-time calls.",
    });
  }

  if (!map.get("blocker")?.value?.detected) {
    recommendations.push({
      tone: "info",
      title: "Add a tracker blocker",
      body: "A content blocker stops many fingerprinting scripts before they run. This local test can only make a weak guess about blockers, so verify with the blocker's own test page.",
      link: { label: "Privacy Badger", url: BRAND.privacyBadgerUrl },
    });
  }

  if (entropy.point >= 17) {
    recommendations.push({
      tone: "warn",
      title: "Do not chase a single metric",
      body: "Spoofing one value while everything else stays the same can make you easier to spot. Reduce the whole surface, or use a browser that presents a shared or randomised profile.",
    });
  }

  recommendations.push({
    tone: "info",
    title: "Re-test after changing settings",
    body: browser
      ? "Compare a fresh scan with this one. Look for removed stable bits and for surfaces that changed between samples — a randomised value is stronger than a spoofed one."
      : "Compare a fresh scan with this one. Look for removed stable bits and for surfaces that changed between samples.",
  });

  return recommendations.slice(0, 6);
}
