import browser from "./browser.js";
import screen from "./screen.js";
import locale from "./locale.js";
import privacy from "./privacy.js";
import storage from "./storage.js";
import fonts from "./fonts.js";
import canvas from "./canvas.js";
import webgl from "./webgl.js";
import audio from "./audio.js";
import media from "./media.js";
import webrtc from "./webrtc.js";
import blocker from "./blocker.js";
import { finishScan, markScanStart } from "../lib/perf.js";
import { nextFrame, withTimeout } from "../lib/timeout.js";

export const COLLECTORS = Object.freeze([
  browser,
  screen,
  locale,
  privacy,
  fonts,
  canvas,
  webgl,
  storage,
  media,
  audio,
  webrtc,
  blocker,
]);

export function getProbeList() {
  return COLLECTORS.map(({ id, label, group }) => ({ id, label, group }));
}

async function runCollector(collector) {
  try {
    const attributes = await withTimeout(
      collector.collect(),
      collector.timeoutMs,
      `${collector.label} timed out`,
    );
    return Array.isArray(attributes) ? attributes : [];
  } catch {
    return [];
  }
}

/**
 * Run all probes. Visual probes are sequential so canvas/WebGL/font work does
 * not contend for the main thread; async probes run in parallel.
 *
 * @param {{onProgress?: (event: object) => void}} options
 */
export async function runScan({ onProgress = () => {} } = {}) {
  const total = COLLECTORS.length;
  const probes = getProbeList();
  const attributes = [];
  let completed = 0;

  const emit = (event) => {
    try {
      onProgress(event);
    } catch {
      // A UI error must not abort the scan.
    }
  };

  emit({ type: "start", total, probes });
  const start = markScanStart();

  const run = async (collector) => {
    emit({ type: "probe", id: collector.id, label: collector.label, status: "running", completed, total });
    const found = await runCollector(collector);
    attributes.push(...found);
    completed += 1;
    emit({
      type: "probe",
      id: collector.id,
      label: collector.label,
      status: found.length ? "done" : "empty",
      completed,
      total,
      attributes: found,
    });
    return found;
  };

  const asyncCollectors = COLLECTORS.filter((collector) => collector.group === "async");
  const visualCollectors = COLLECTORS.filter((collector) => collector.group !== "async");

  const asyncWork = Promise.all(asyncCollectors.map(run));

  for (const collector of visualCollectors) {
    await run(collector);
    await nextFrame();
  }

  await asyncWork;
  const durationMs = finishScan(start);
  emit({ type: "complete", durationMs, total, completed });

  return { attributes, durationMs };
}
