/** Performance marks used to show scan duration without a network round-trip. */

export function now() {
  return globalThis.performance?.now ? performance.now() : Date.now();
}

export function markScanStart() {
  const start = now();
  try {
    performance.mark("nocturne:scan-start");
  } catch {
    // Performance API may be unavailable in unusual environments.
  }
  return start;
}

export function finishScan(start) {
  const duration = now() - start;
  try {
    performance.measure("nocturne:scan", { start: "nocturne:scan-start" });
  } catch {
    // Ignore missing marks.
  }
  return duration;
}

/**
 * Coarse device class for the motion and glass decisions. Missing APIs mean
 * "high": the page must never behave worse because a browser is private.
 *
 * @returns {"low" | "high"}
 */
export function deviceTier() {
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return "low";
  } catch {
    // matchMedia is optional.
  }
  const memory = Number(navigator.deviceMemory);
  if (memory && memory < 2) return "low";
  const threads = Number(navigator.hardwareConcurrency);
  if (memory && memory <= 4 && threads && threads <= 4) return "low";
  try {
    const connection = navigator.connection;
    if (connection?.saveData) return "low";
    if (connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g") return "low";
  } catch {
    // Network Information API is optional.
  }
  return "high";
}

/** Reflects the device tier on <html data-motion="on|off">. Idempotent. */
export function applyMotionPreference() {
  const motion = deviceTier() === "low" ? "off" : "on";
  document.documentElement.dataset.motion = motion;
  return motion;
}
