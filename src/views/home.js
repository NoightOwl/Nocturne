import { BRAND } from "../data/brand.js";
import { ATTRIBUTE_MODEL } from "../data/reference-model.js";
import { ARROW_ICON, LOCK_ICON } from "../ui.js";
import { mountField } from "../ui/field.js";
import { mountReveal } from "../ui/reveal.js";

const SIGNAL_COUNT = Object.keys(ATTRIBUTE_MODEL).length;

/** Facts that are already true on this page — nothing is measured yet. */
function heroFacts() {
  const ratio = Math.round((Number(window.devicePixelRatio) || 1) * 100) / 100;
  return [
    [LOCK_ICON, "No data leaves this device"],
    [null, "~2–3 s typical scan"],
    [null, `Screen read at ${ratio}×`],
  ];
}

function readouts() {
  const threads = Number(navigator.hardwareConcurrency);
  const width = Number(window.screen?.width);
  const height = Number(window.screen?.height);
  const ratio = Math.round((Number(window.devicePixelRatio) || 1) * 100) / 100;
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown";
  const language = navigator.language || "unknown";
  return [
    ["Screen", width && height ? `${width}×${height}` : "hidden"],
    ["Pixel ratio", `${ratio}×`],
    ["Time zone", zone],
    ["Hardware threads", threads ? String(threads) : "hidden"],
    ["Language", language],
    ["Signals probed", String(SIGNAL_COUNT)],
  ];
}

const STEPS = [
  {
    title: "Collect",
    body: "Canvas, WebGL, audio, fonts, display, locale, storage, and network candidates are measured locally. No permission prompts.",
  },
  {
    title: "Estimate",
    body: "A documented reference model turns the measured surface into a range of identifying bits and a confidence level.",
  },
  {
    title: "Harden",
    body: "See which surfaces are stable, which are randomised, and which settings actually reduce the signal instead of moving it.",
  },
];

const LEDGER = [
  ["Canvas pixels", "Read in this tab"],
  ["GPU renderer", "Read in this tab"],
  ["Font list", "Read in this tab"],
  ["Report storage", "Memory only"],
  ["Server upload", "None"],
];

export function renderHome(container) {
  container.innerHTML = `
    <section class="hero shell">
      <div class="hero-copy">
        <h1>See which signals your browser exposes</h1>
        <p class="lede">${BRAND.description}</p>
        <div class="hero-actions">
          <a class="button button-primary" href="#/test" data-prefetch="test">
            Run local scan ${ARROW_ICON}
          </a>
          <a class="button button-ghost" href="#/" data-scroll="how">How it works</a>
        </div>
        <ul class="hero-facts" aria-label="What is already true on this page">
          ${heroFacts()
            .map(([icon, text]) => `<li>${icon ?? ""}<span>${text}</span></li>`)
            .join("")}
        </ul>
      </div>

      <div class="hero-panel glass dense panel" data-field data-depth>
        <div class="field-host" aria-hidden="true"></div>
        <div class="panel-body">
          <div class="panel-head">
            <span class="label">Signature preview</span>
            <span class="panel-state"><span class="signal-dot on"></span>Live</span>
          </div>
          <p class="panel-figure mono"><span data-panel-bits>—</span><span class="panel-unit">bits</span></p>
          <p class="panel-note">Measured after you run a scan</p>
          <div class="readout-list">
            ${readouts()
              .map(([name, value]) => `<div class="readout"><span class="label">${name}</span><span class="mono">${value}</span></div>`)
              .join("")}
          </div>
        </div>
      </div>
    </section>

    <section class="trust-strip" aria-label="What this tool does not do">
      <span>Local processing</span>
      <span class="trust-sep"></span>
      <span>No account, no cookies, no server-side database</span>
      <span class="trust-sep"></span>
      <span>Open source</span>
    </section>

    <section class="section shell" id="how">
      <div class="section-heading reveal">
        <h2>Three passes, one clearer picture</h2>
        <p>NOCTURNE reads the same categories of signals a tracker can request, then turns them into an honest range — not a false promise of anonymity.</p>
      </div>
      <ol class="steps reveal-stagger">
        ${STEPS.map(
          (step, index) => `
          <li class="step reveal"><span class="step-index mono">${String(index + 1).padStart(2, "0")}</span><h3>${step.title}</h3><p>${step.body}</p></li>`,
        ).join("")}
      </ol>
    </section>

    <section class="section shell two-col">
      <div class="section-heading reveal">
        <h2>Static by design. Honest about it.</h2>
        <p>A true “1 in N browsers” score needs a live population and a server collecting fingerprints. This edition deliberately has neither. The score is a local estimate from a versioned model, and the interface says so everywhere it matters.</p>
        <p>That trade-off is the point: the code stays inspectable, it is free to host, and it never builds another database of visitors.</p>
        <div class="inline-actions">
          <a class="text-link" href="#/about">Read the methodology ${ARROW_ICON}</a>
          <a class="text-link" href="#/privacy">Privacy model ${ARROW_ICON}</a>
        </div>
      </div>
      <div class="reveal">
        <div class="stack-tight">
          <div class="glass panel">
            ${LEDGER.map(([name, state]) => `<div class="glass-row row-row"><span>${name}</span><span class="mono">${state}</span></div>`).join("")}
          </div>
          <p class="small muted">Even on a static page, your host can see the IP address that requested the files. NOCTURNE adds no analytics, cookies, or report uploads on top of that</p>
        </div>
      </div>
    </section>

    <section class="section shell">
      <div class="cta-band glass panel reveal">
        <h2>The scan stays on your device</h2>
        <p>No sign-up, no upload — just a clear read on what your browser is broadcasting</p>
        <a class="button button-primary" href="#/test" data-prefetch="test">Run local scan ${ARROW_ICON}</a>
      </div>
    </section>
  `;

  const field = mountField(container.querySelector(".field-host"), { live: true });
  const stopReveal = mountReveal(container);
  const wake = () => field.poke();
  window.addEventListener("focus", wake);

  return () => {
    window.removeEventListener("focus", wake);
    stopReveal();
    field.cleanup();
  };
}
