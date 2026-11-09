import { getProbeList, runScan } from "../collectors/index.js";
import { BRAND } from "../data/brand.js";
import { buildReport } from "../lib/report.js";
import { setReport } from "../store.js";
import { navigate } from "../router.js";
import { formatDuration } from "../lib/format.js";
import { ARROW_ICON, LOCK_ICON } from "../ui.js";

const STATUS_TEXT = {
  pending: "QUEUED",
  running: "SCANNING",
  done: "CAPTURED",
  empty: "UNAVAILABLE",
  error: "FAILED",
};

export function renderTest(container) {
  let cancelled = false;
  const probes = getProbeList();

  container.innerHTML = `
    <section class="scan-page shell">
      <div class="scan-heading">
        <p class="eyebrow"><span class="signal-dot"></span> Local scan in progress</p>
        <h1>Reading the <span class="text-accent">surface.</span></h1>
        <p class="lede">NOCTURNE is measuring the signals your browser exposes. Everything happens in this tab. Some browsers will block a probe — that is a result, not a failure.</p>
      </div>

      <div class="scan-layout">
        <div class="scan-main panel-corner">
          <div class="scan-topline">
            <span class="mono">SCAN / <span data-progress-count>0</span> OF ${probes.length}</span>
            <span class="mono" data-elapsed>00.0s</span>
          </div>
          <div class="progress-wrap">
            <progress data-progress max="100" value="0" aria-label="Scan progress">0%</progress>
            <div class="progress-meta">
              <span class="mono" data-progress-percent>0%</span>
              <span class="mono">NO UPLOAD</span>
            </div>
          </div>
          <p class="scan-status" data-status role="status" aria-live="polite">Initialising local probes…</p>

          <div class="probe-list" data-probe-list>
            ${probes
              .map(
                (probe, index) => `
                <div class="probe-row" data-probe="${probe.id}" data-state="pending">
                  <span class="probe-index mono">${String(index + 1).padStart(2, "0")}</span>
                  <span class="probe-dot" aria-hidden="true"></span>
                  <span class="probe-label">${probe.label}</span>
                  <span class="probe-group mono">${probe.group === "async" ? "ASYNC" : "MAIN"}</span>
                  <span class="probe-status mono" data-probe-status>${STATUS_TEXT.pending}</span>
                </div>`,
              )
              .join("")}
          </div>

          <div class="scan-foot">
            <span>${LOCK_ICON} Measurements stay in memory for this tab.</span>
            <span class="mono">v${BRAND.version}</span>
          </div>
        </div>

        <aside class="scan-aside">
          <div class="aside-block panel-corner">
            <span class="eyebrow">What happens now</span>
            <ol class="mini-steps">
              <li><span class="mono">01</span> Visual surfaces render in an isolated canvas and WebGL context.</li>
              <li><span class="mono">02</span> Audio, media, storage, and network candidates are sampled in parallel.</li>
              <li><span class="mono">03</span> Stable signals are hashed locally; the report is built in memory.</li>
            </ol>
          </div>
          <div class="aside-block panel-corner">
            <span class="eyebrow">Good to know</span>
            <p>No camera, microphone, location, or notification permission is requested. The WebRTC probe uses an empty STUN list, so it does not contact an external server.</p>
            <a class="text-link" href="#/learn">Why these signals matter ${ARROW_ICON}</a>
          </div>
        </aside>
      </div>

      <div class="scan-error" data-error hidden>
        <h2>The scan could not finish.</h2>
        <p data-error-message>An unexpected browser error interrupted the measurement. Try again in a normal tab.</p>
        <button class="button button-primary" type="button" data-retry>Try again ${ARROW_ICON}</button>
      </div>
    </section>
  `;

  const progress = container.querySelector("[data-progress]");
  const progressCount = container.querySelector("[data-progress-count]");
  const progressPercent = container.querySelector("[data-progress-percent]");
  const status = container.querySelector("[data-status]");
  const elapsed = container.querySelector("[data-elapsed]");
  const errorPanel = container.querySelector("[data-error]");
  const errorMessage = container.querySelector("[data-error-message]");

  const started = performance.now();
  const tick = setInterval(() => {
    if (cancelled) return;
    const seconds = (performance.now() - started) / 1000;
    elapsed.textContent = `${seconds.toFixed(1)}s`;
  }, 100);

  container.querySelector("[data-retry]").addEventListener("click", () => {
    location.hash = "#/test";
    window.dispatchEvent(new Event("hashchange"));
  });

  const updateRow = (id, state) => {
    const row = container.querySelector(`[data-probe="${id}"]`);
    if (!row) return;
    row.dataset.state = state;
    const badge = row.querySelector("[data-probe-status]");
    if (badge) badge.textContent = STATUS_TEXT[state] || state.toUpperCase();
  };

  const onProgress = (event) => {
    if (cancelled) return;
    if (event.type === "start") {
      status.textContent = "Starting local measurements…";
      return;
    }
    if (event.type === "probe") {
      updateRow(event.id, event.status);
      if (event.status === "running") {
        status.textContent = `Measuring ${event.label.toLowerCase()}…`;
      } else {
        const value = Math.round((event.completed / event.total) * 100);
        progress.value = value;
        progress.textContent = `${value}%`;
        progressCount.textContent = String(event.completed);
        progressPercent.textContent = `${value}%`;
        status.textContent =
          event.status === "empty"
            ? `${event.label} was unavailable or blocked. Continuing.`
            : `${event.label} captured.`;
      }
    }
  };

  (async () => {
    try {
      const { attributes, durationMs } = await runScan({ onProgress });
      if (cancelled || !container.isConnected) return;
      status.textContent = "Building your local report…";
      const report = await buildReport(attributes, { durationMs });
      if (cancelled || !container.isConnected) return;
      setReport(report);
      clearInterval(tick);
      status.textContent = `Scan complete in ${formatDuration(durationMs)}. Opening report…`;
      navigate("results");
    } catch {
      if (cancelled || !container.isConnected) return;
      clearInterval(tick);
      errorPanel.hidden = false;
      errorMessage.textContent =
        "An unexpected browser error interrupted the measurement. Reload the page and try again in a normal tab.";
      status.textContent = "Scan interrupted.";
    }
  })();

  return () => {
    cancelled = true;
    clearInterval(tick);
  };
}
