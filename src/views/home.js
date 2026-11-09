import { BRAND } from "../data/brand.js";
import { ARROW_ICON, LOCK_ICON } from "../ui.js";

const HERO_ART = `
<svg class="print-visual" viewBox="0 0 320 320" role="img" aria-label="Abstract fingerprint inside a hexagonal sensor grid">
  <defs>
    <linearGradient id="print-gradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#38bdf8"/>
      <stop offset="0.55" stop-color="#2563eb"/>
      <stop offset="1" stop-color="#2dd4bf"/>
    </linearGradient>
    <radialGradient id="print-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#38bdf8" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#38bdf8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="160" cy="160" r="156" fill="url(#print-glow)"/>
  <g class="print-grid" fill="none" stroke="#1b3a5c" stroke-width="1">
    <path d="M160 16v58M160 246v58M16 160h58M246 160h58"/>
    <path d="M52 52l41 41M227 227l41 41M268 52l-41 41M93 227l-41 41"/>
    <circle cx="160" cy="160" r="126"/>
    <circle cx="160" cy="160" r="96" stroke-dasharray="2 8"/>
  </g>
  <path class="hex-outline" d="M160 38 262 96v128l-102 58L58 224V96Z" fill="none" stroke="url(#print-gradient)" stroke-width="2"/>
  <g class="print-ridges" fill="none" stroke="url(#print-gradient)" stroke-width="4.5" stroke-linecap="round">
    <path d="M160 232c-37 0-67-29-67-65 0-40 33-73 73-73s73 33 73 73c0 27-15 50-37 62"/>
    <path d="M160 212c-25 0-45-18-45-42 0-28 22-50 50-50s50 22 50 50c0 18-10 34-25 43"/>
    <path d="M160 194c-15 0-27-11-27-25 0-17 13-30 30-30s30 13 30 30c0 11-5 20-14 26"/>
    <path d="M160 176c-6 0-11-5-11-11 0-7 6-13 13-13s13 6 13 13c0 4-2 8-5 10"/>
    <path d="M160 232v-20M111 150c-7 9-11 20-11 32 0 13 4 25 12 34M209 150c7 9 11 20 11 32 0 13-4 25-12 34"/>
  </g>
  <circle class="print-core" cx="160" cy="168" r="4.5" fill="#2dd4bf"/>
  <circle class="radar-ring" cx="160" cy="160" r="146" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="14 210"/>
</svg>`;

const SIGNALS = [
  ["Canvas", "surface"],
  ["WebGL", "hardware"],
  ["Audio", "pipeline"],
  ["Fonts", "installed"],
  ["WebRTC", "network"],
  ["Storage", "available"],
];

export function renderHome(container) {
  container.innerHTML = `
    <section class="hero shell">
      <div class="hero-copy">
        <p class="eyebrow"><span class="signal-dot"></span> Local-only browser exposure lab</p>
        <h1>See what your browser <span class="text-accent">reveals.</span></h1>
        <p class="lede">${BRAND.description}</p>
        <div class="hero-actions">
          <a class="button button-primary" href="#/test" data-prefetch="test">
            Run local scan ${ARROW_ICON}
          </a>
          <a class="button button-ghost" href="#/" data-scroll="how">How it works</a>
        </div>
        <ul class="hero-facts" aria-label="Privacy properties">
          <li>${LOCK_ICON}<span>No data leaves this device</span></li>
          <li><span class="mono">~2–3s</span><span>Typical scan time</span></li>
          <li><span class="mono">0</span><span>Trackers or analytics</span></li>
        </ul>
      </div>

      <div class="hero-panel panel-corner" aria-hidden="true">
        <div class="panel-head">
          <span class="mono">EXPOSURE MONITOR</span>
          <span class="panel-state"><span class="signal-dot"></span> IDLE</span>
        </div>
        <div class="visual-wrap">
          ${HERO_ART}
          <div class="radar-sweep"></div>
          <span class="visual-label visual-label-a">SIGNAL 01</span>
          <span class="visual-label visual-label-b">LOCAL / ENCRYPTED</span>
        </div>
        <div class="signal-grid">
          ${SIGNALS.map(
            ([name, detail]) => `
              <div class="signal-tile">
                <span class="signal-name">${name}</span>
                <span class="signal-detail">${detail}</span>
                <span class="signal-bar"><i></i><i></i><i></i><i></i><i></i></span>
              </div>`,
          ).join("")}
        </div>
        <div class="panel-foot">
          <span class="mono">NO NETWORK CALLS AFTER LOAD</span>
          <span class="mono">v${BRAND.version}</span>
        </div>
      </div>
    </section>

    <section class="trust-strip" aria-label="What this tool does not do">
      <span class="mono">LOCAL PROCESSING</span>
      <span class="trust-sep"></span>
      <span>No account. No cookies. No server-side fingerprint database.</span>
      <span class="trust-sep"></span>
      <span class="mono">OPEN SOURCE</span>
    </section>

    <section class="section shell" id="how">
      <div class="section-heading">
        <p class="eyebrow">Protocol</p>
        <h2>Three passes. One clearer picture.</h2>
        <p>NOCTURNE reads the same categories of signals a tracker can request, then turns them into an honest range — not a false promise of anonymity.</p>
      </div>
      <div class="steps">
        <article class="step-card">
          <span class="step-number mono">01</span>
          <h3>Collect</h3>
          <p>Canvas, WebGL, audio, fonts, display, locale, storage, and network candidates are measured locally. No permission prompts.</p>
          <span class="step-tag mono">BROWSER API READ</span>
        </article>
        <article class="step-card">
          <span class="step-number mono">02</span>
          <h3>Estimate</h3>
          <p>A documented reference model turns the measured surface into a range of identifying bits and a confidence level.</p>
          <span class="step-tag mono">REFERENCE MODEL</span>
        </article>
        <article class="step-card">
          <span class="step-number mono">03</span>
          <h3>Harden</h3>
          <p>See which surfaces are stable, which are randomised, and which settings actually reduce the signal instead of moving it.</p>
          <span class="step-tag mono">ACTIONABLE READOUT</span>
        </article>
      </div>
    </section>

    <section class="section shell">
      <div class="evidence-grid">
        <div class="evidence-copy">
          <p class="eyebrow">Read the fine print</p>
          <h2>Static by design. Honest about it.</h2>
          <p>A true “1 in N browsers” score needs a live population and a server collecting fingerprints. This edition deliberately has neither. The score is a local estimate from a versioned model, and the interface says so everywhere it matters.</p>
          <p>That trade-off is the point: you can inspect the code, host it for free, and run it without creating another database of visitors.</p>
          <div class="inline-actions">
            <a class="text-link" href="#/about">Read the methodology ${ARROW_ICON}</a>
            <a class="text-link" href="#/privacy">Privacy model ${ARROW_ICON}</a>
          </div>
        </div>
        <div class="callout-panel panel-corner">
          <div class="callout-row">
            <span class="mono">SIGNAL</span><span class="mono">LOCAL</span>
          </div>
          <div class="callout-row"><span>Canvas pixels</span><span class="ok">READ IN TAB</span></div>
          <div class="callout-row"><span>GPU renderer</span><span class="ok">READ IN TAB</span></div>
          <div class="callout-row"><span>Font list</span><span class="ok">READ IN TAB</span></div>
          <div class="callout-row"><span>Report storage</span><span class="warn">MEMORY ONLY</span></div>
          <div class="callout-row"><span>Server upload</span><span class="good">NONE</span></div>
          <p class="callout-note">Even on a static page, your host can see the IP address that requested the files. NOCTURNE does not add analytics, cookies, or report uploads on top of that.</p>
        </div>
      </div>
    </section>

    <section class="cta-band shell panel-corner">
      <div>
        <p class="eyebrow">Ready when you are</p>
        <h2>The scan stays on your device.</h2>
        <p>No sign-up. No upload. Just a clear read on what your browser is broadcasting.</p>
      </div>
      <a class="button button-primary" href="#/test" data-prefetch="test">Run local scan ${ARROW_ICON}</a>
    </section>
  `;
}
