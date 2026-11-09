import { BRAND } from "../data/brand.js";
import { ARROW_ICON } from "../ui.js";

export function renderAbout(container) {
  container.innerHTML = `
    <article class="content-page shell">
      <header class="content-hero">
        <p class="eyebrow">About NOCTURNE</p>
        <h1>A local lab for an <span class="text-accent">asymmetric</span> problem.</h1>
        <p class="lede">Websites can ask your browser for a surprising amount of detail. NOCTURNE makes that surface visible, gives you an honest estimate of its cost, and stays out of the data business.</p>
      </header>

      <div class="content-layout">
        <aside class="content-aside panel-corner">
          <span class="eyebrow">Details</span>
          <nav aria-label="About sections">
            <a href="#/about" data-scroll="what">What this is</a>
            <a href="#/about" data-scroll="not">What this is not</a>
            <a href="#/about" data-scroll="method">Method</a>
            <a href="#/about" data-scroll="sources">Sources</a>
            <a href="#/about" data-scroll="license">License</a>
          </nav>
        </aside>

        <div class="prose">
          <section id="what">
            <h2>What this is</h2>
            <p>NOCTURNE is an open-source, static browser exposure lab. It measures a curated set of browser signals, checks whether some rendering surfaces are stable or randomised, and produces a local report. It runs on GitHub Pages with no server, database, analytics, or account system.</p>
            <p>The project is inspired by EFF's Cover Your Tracks and by the public research that made browser fingerprinting legible to ordinary users. It does not copy EFF's code, branding, copy, or visual identity.</p>
            <div class="callout-panel panel-corner">
              <div class="callout-row"><span>Runtime</span><span class="good">100% client-side</span></div>
              <div class="callout-row"><span>Hosting</span><span>GitHub Pages, static</span></div>
              <div class="callout-row"><span>Data collected</span><span class="good">None</span></div>
              <div class="callout-row"><span>License</span><span>${BRAND.license}</span></div>
            </div>
          </section>

          <section id="not">
            <h2>What this is not</h2>
            <p>It is not a live uniqueness database. No static site can truthfully say “1 in N visitors share your fingerprint” without collecting fingerprints from a population. NOCTURNE uses a documented reference model and labels the result as an estimate.</p>
            <p>It is not a complete tracker-blocking test. The original Cover Your Tracks project simulates third-party tracker domains from infrastructure it operates. This edition uses local, low-confidence ad-filter heuristics instead, and says so in the report.</p>
            <p>It is not a guarantee of anonymity, and it is not a substitute for threat modelling. If your threat model includes a determined adversary, use a browser designed for it, keep it updated, and seek advice appropriate to your situation.</p>
          </section>

          <section id="method">
            <h2>Method in one screen</h2>
            <ol class="method-list">
              <li><strong>Collect local signals.</strong> Browser, display, locale, canvas, WebGL, audio, fonts, media, storage, privacy flags, WebRTC candidates, and a blocker heuristic.</li>
              <li><strong>Check stability.</strong> Canvas, WebGL, and audio are rendered twice. A changed hash means the surface is randomised and is not used in the stable signature.</li>
              <li><strong>Estimate.</strong> Per-attribute low/high ranges are summed, discounted for correlation, capped, and expressed as a range with a coverage-based confidence level.</li>
              <li><strong>Sign.</strong> Stable values are canonicalised and hashed with SHA-256 through the browser's own Web Crypto. The report never leaves memory.</li>
            </ol>
            <p>The full table, assumptions, and known limitations live in <span class="mono">docs/METHODOLOGY.md</span> in the repository.</p>
          </section>

          <section id="sources">
            <h2>Sources and inspiration</h2>
            <ul class="source-list">
              <li><a href="${BRAND.effAboutUrl}" target="_blank" rel="noopener noreferrer">EFF Cover Your Tracks — About and methodology</a></li>
              <li><a href="${BRAND.effPaperUrl}" target="_blank" rel="noopener noreferrer">Peter Eckersley, “How Unique Is Your Web Browser?” (PETS 2010)</a></li>
              <li><a href="https://www.eff.org/deeplinks/2010/01/primer-information-theory-and-privacy" target="_blank" rel="noopener noreferrer">EFF — A Primer on Information Theory and Privacy</a></li>
              <li><a href="https://arxiv.org/abs/1905.01051" target="_blank" rel="noopener noreferrer">Laperdrix et al., “Browser Fingerprinting: A Survey”</a></li>
            </ul>
            <p class="muted">The entropy ranges are project estimates informed by these sources. They are not published population measurements and should not be cited as such.</p>
          </section>

          <section id="license">
            <h2>License and independence</h2>
            <p>NOCTURNE's code is released under the ${BRAND.license} license. The name, visual identity, and copy are original to this project.</p>
            <p>Cover Your Tracks is a project of the Electronic Frontier Foundation. NOCTURNE is an independent project inspired by that work. It is not affiliated with, endorsed by, or sponsored by EFF.</p>
            <div class="inline-actions">
              <a class="text-link" href="${BRAND.effUrl}" target="_blank" rel="noopener noreferrer">Visit EFF Cover Your Tracks ${ARROW_ICON}</a>
              <a class="text-link" href="#/privacy">Privacy model ${ARROW_ICON}</a>
            </div>
          </section>
        </div>
      </div>
    </article>
  `;
}
