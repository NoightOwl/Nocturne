import { getProbeList, runScan } from "../collectors/index.js";
import { BRAND } from "../data/brand.js";
import { buildReport } from "../lib/report.js";
import { setReport } from "../store.js";
import { navigate } from "../router.js";
import { formatDuration } from "../lib/format.js";
import { ARROW_ICON, LOCK_ICON } from "../ui.js";

const STATUS_TEXT = {
  pending: "Queued",
  running: "Measuring",
  done: "Captured",
  empty: "Unavailable",
  error: "Failed",
};

const STATES = ["pending", "running", "done", "empty", "error"];
/** The fill steps through these classes; no style attribute is ever emitted. */
const WIDTHS = Array.from({ length: 21 }, (_, index) => `is-w-${index * 5}`);
const GROUP_TEXT = { async: "Async", visual: "Main" };

function probeRows(probes) {
  return probes
    .map(
      (probe, index) => `
      <li class="probe-row is-${probe.status}" data-probe="${probe.id}">
        <span class="probe-index mono">${String(index + 1).padStart(2, "0")}</span>
        <span class="probe-dot" aria-hidden="true"></span>
        <span class="probe-label">${probe.label}</span>
        <span class="probe-group">${GROUP_TEXT[probe.group] || "Main"}</span>
        <span class="probe-status" data-probe-status>${STATUS_TEXT[probe.status]}</span>
      </li>`,
    )
    .join("");
}

export function renderTest(container) {
  let cancelled = false;
  let scan = null;
  let total = 0;

  /** Rebuilds the card, its rows and its listeners. Runs once, and again on retry. */
  const mount = () => {
    cancelled = false;
    const probes = getProbeList().map((probe) => ({ ...probe, status: "pending" }));
    total = probes.length;

    container.innerHTML = `
    <section class="scan-page shell" data-scan aria-busy="true">
      <header class="scan-intro reveal">
        <h1 class="scan-title">Run the local scan</h1>
        <p class="scan-lede">NOCTURNE reads the signals your browser exposes, one probe at a time, and keeps every result in this tab. A blocked probe counts as a result, not a failure.</p>
      </header>

      <div class="scan-layout">
        <div class="scan-card glass dense panel">
          <div class="scan-head">
            <span class="scan-label">Progress</span>
            <span class="scan-meter mono"><span data-progress-count>0</span> of ${total}</span>
            <span class="scan-elapsed mono" data-elapsed>0.0 s</span>
          </div>
          <div class="scan-progress" data-progress role="progressbar" aria-label="Scan progress"
            aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="0">
            <span class="scan-progress-fill is-w-0"></span>
          </div>
          <p class="scan-status" data-status role="status" aria-live="polite">Preparing the probes</p>

          <ol class="probe-list" aria-label="Probes">${probeRows(probes)}</ol>

          <div class="scan-foot">
            <span class="scan-foot-note">${LOCK_ICON}Measurements stay in memory for this tab</span>
            <span class="scan-foot-version mono">v${BRAND.version}</span>
          </div>
        </div>

        <aside class="scan-aside glass light reveal" aria-label="About this scan">
          <h2 class="scan-aside-title">What happens now</h2>
          <ol class="scan-steps">
            <li><span class="mono">01</span>Visual surfaces render in an isolated canvas and WebGL context</li>
            <li><span class="mono">02</span>Audio, media, storage and network candidates are sampled in parallel</li>
            <li><span class="mono">03</span>Stable signals are hashed locally and the report is built in memory</li>
          </ol>
          <h3 class="scan-aside-title">Good to know</h3>
          <p class="scan-aside-copy">No camera, microphone, location or notification permission is requested. The WebRTC probe uses an empty STUN list, so it does not contact an external server.</p>
          <a class="text-link" href="#/learn">Why these signals matter ${ARROW_ICON}</a>
        </aside>
      </div>

      <div class="scan-error" data-error hidden>
        <h2>The scan could not finish</h2>
        <p data-error-message>An unexpected browser error interrupted the measurement. Try again in a normal tab.</p>
        <button class="button button-primary" type="button" data-retry>Try again ${ARROW_ICON}</button>
      </div>
    </section>
  `;

    const section = container.querySelector("[data-scan]");
    const fill = container.querySelector(".scan-progress-fill");
    const progress = container.querySelector("[data-progress]");
    const counter = container.querySelector("[data-progress-count]");
    const status = container.querySelector("[data-status]");
    const elapsed = container.querySelector("[data-elapsed]");
    const errorPanel = container.querySelector("[data-error]");
    const errorMessage = container.querySelector("[data-error-message]");
    // The top row is the one being measured; keep it in view on short screens.
    const list = container.querySelector(".probe-list");

    const started = performance.now();
    let timer = 0;
    const clearTimer = () => timer && clearInterval(timer);
    timer = setInterval(() => {
      if (cancelled) return;
      elapsed.textContent = `${((performance.now() - started) / 1000).toFixed(1)} s`;
    }, 100);

    scan = {
      clearTimer,
      updateRow(id, state) {
        const row = container.querySelector(`[data-probe="${id}"]`);
        if (!row) return;
        row.classList.remove(...STATES.map((name) => `is-${name}`));
        row.classList.add(`is-${state}`);
        const label = row.querySelector("[data-probe-status]");
        if (label) label.textContent = STATUS_TEXT[state] || state;
      },
      setProgress(done) {
        const value = Math.round((done / total) * 20) * 5;
        progress.setAttribute("aria-valuenow", String(done));
        counter.textContent = String(done);
        if (fill.classList.contains(`is-w-${value}`)) return;
        fill.classList.remove(...WIDTHS);
        fill.classList.add(`is-w-${value}`);
        section.style.setProperty("--scan", `${value}%`); // progress track only
      },
    };

    container.querySelector("[data-retry]").addEventListener("click", () => {
      // The route hash has not changed, so re-render here instead of firing a
      // synthetic hashchange, which would just re-enter this handler.
      clearTimer();
      cancelled = true;
      mount();
    });

    const onProgress = (event) => {
      if (cancelled) return;
      if (event.type === "start") {
        total = event.total || total;
        status.textContent = "Starting local measurements";
        return;
      }
      if (event.type !== "probe") return;
      scan.updateRow(event.id, event.status);
      if (event.status === "running") {
        progress.setAttribute("aria-valuenow", String(event.completed));
        counter.textContent = String(event.completed);
        status.textContent = `Measuring ${event.label.toLowerCase()}`;
        scrollToActive();
        return;
      }
      scan.setProgress(event.completed);
      status.textContent =
        event.status === "empty"
          ? `${event.label} was unavailable or blocked. Continuing.`
          : `${event.label} captured.`;
      scrollToActive();
    };

    /** Which async probe is still open, so its row stays visible without jumps. */
    const scrollToActive = () => {
      const active = list.querySelector(".probe-row.is-running");
      if (!active) return;
      const box = active.getBoundingClientRect();
      if (box.bottom > window.innerHeight - 24) active.scrollIntoView({ block: "nearest" });
    };

    (async () => {
      try {
        const { attributes, durationMs } = await runScan({ onProgress });
        if (cancelled || !container.isConnected) return;
        status.textContent = "Building your local report";
        section.removeAttribute("aria-busy");
        const report = await buildReport(attributes, { durationMs });
        if (cancelled || !container.isConnected) return;
        setReport(report);
        clearTimer();
        elapsed.textContent = formatDuration(durationMs);
        status.textContent = `Scan complete in ${formatDuration(durationMs)}. Opening report`;
        navigate("results");
      } catch {
        if (cancelled || !container.isConnected) return;
        clearTimer();
        section.removeAttribute("aria-busy");
        errorPanel.hidden = false;
        errorMessage.textContent =
          "An unexpected browser error interrupted the measurement. Reload the page and try again in a normal tab.";
        status.textContent = "Scan interrupted";
      }
    })();
  };

  mount();

  return () => {
    cancelled = true;
    scan?.clearTimer();
  };
}
