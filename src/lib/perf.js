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
