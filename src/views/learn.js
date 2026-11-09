import { BRAND } from "../data/brand.js";
import { ARROW_ICON } from "../ui.js";

export function renderLearn(container) {
  container.innerHTML = `
    <article class="content-page shell">
      <header class="content-hero">
        <p class="eyebrow">Field guide</p>
        <h1>Fingerprints are not <span class="text-accent">cookies.</span></h1>
        <p class="lede">A cookie is something a site stores. A fingerprint is something your browser broadcasts. One can be deleted; the other has to be changed.</p>
      </header>

      <div class="content-layout">
        <aside class="content-aside panel-corner">
          <span class="eyebrow">On this page</span>
          <nav aria-label="Field guide sections">
            <a href="#/learn" data-scroll="fingerprinting">What is fingerprinting?</a>
            <a href="#/learn" data-scroll="entropy">What are bits?</a>
            <a href="#/learn" data-scroll="randomisation">Randomised vs spoofed</a>
            <a href="#/learn" data-scroll="limits">What this scan cannot see</a>
          </nav>
        </aside>

        <div class="prose">
          <section id="fingerprinting">
            <h2>What is browser fingerprinting?</h2>
            <p>Every request carries details that help a site render correctly: browser version, language, screen size, and more. JavaScript can ask for additional details like installed fonts, canvas pixels, GPU capabilities, and audio processing differences.</p>
            <p>A tracker combines those details into a profile. It does not need your name to recognise the same browser across visits. The profile can survive cookie deletion because it is derived from configuration and hardware, not a stored value.</p>
            <blockquote>
              <p>The useful question is not “am I completely anonymous?” It is “how much does my browser reduce the signal, and where is the remaining signal concentrated?”</p>
            </blockquote>
          </section>

          <section id="entropy">
            <h2>What are “bits” of identifying information?</h2>
            <p>A bit is a doubling of possibilities. One bit separates two equally likely outcomes; ten bits separate about a thousand. If a signal gives a tracker ten bits, it narrows the crowd by roughly a factor of 1,024.</p>
            <p>Entropy is not a score you can max out. Signals overlap: a browser version implies an OS, an OS implies a GPU family, a GPU family correlates with fonts. Adding raw bits overstates the result, which is why NOCTURNE applies a correlation discount and presents a range with a confidence level.</p>
            <div class="callout-panel panel-corner">
              <div class="callout-row"><span class="mono">1 bit</span><span>2 possibilities</span></div>
              <div class="callout-row"><span class="mono">10 bits</span><span>about 1,024 possibilities</span></div>
              <div class="callout-row"><span class="mono">20 bits</span><span>about 1,048,576 possibilities</span></div>
              <p class="callout-note">These are illustrative. The actual size of the crowd depends on the population, the signals, and their correlations.</p>
            </div>
          </section>

          <section id="randomisation">
            <h2>Randomised beats spoofed</h2>
            <p>If you change one value to look like a different browser, the rest of your signals may no longer agree. A tracker can notice the mismatch: a browser claiming one platform while its GPU, fonts, and canvas output point somewhere else becomes more distinctive, not less.</p>
            <p>Fingerprint-resistant browsers take a different approach. They make a surface return a shared value for everyone, or add noise so the value changes between visits. NOCTURNE checks this directly: canvas, WebGL, and audio are sampled twice. If the hashes differ, the surface is randomised and is excluded from the stable signature.</p>
            <div class="tip-grid">
              <div class="tip-card"><span class="mono">STRONGER</span><h3>Shared or randomised profile</h3><p>Tor Browser, Brave's fingerprinting protection, Firefox's strict protection and <span class="mono">resistFingerprinting</span>.</p></div>
              <div class="tip-card"><span class="mono">WEAKER</span><h3>Single-value spoofing</h3><p>Changing only the user agent or screen size while every other surface stays the same.</p></div>
            </div>
          </section>

          <section id="limits">
            <h2>What this scan cannot see</h2>
            <p>NOCTURNE runs entirely in your browser and has no server. That means it cannot know how many other visitors share your fingerprint, cannot see your IP address as a website would, and cannot run a full third-party tracker-blocking test.</p>
            <p>The score is a reference-model estimate. It is useful for comparing your own browser configurations and spotting which surfaces are exposed, not for proving that you are anonymous or uniquely identifiable.</p>
            <div class="inline-actions">
              <a class="text-link" href="#/about">Read the methodology ${ARROW_ICON}</a>
              <a class="text-link" href="${BRAND.effLearnUrl}" target="_blank" rel="noopener noreferrer">EFF's fingerprinting guide ${ARROW_ICON}</a>
              <a class="text-link" href="${BRAND.effPaperUrl}" target="_blank" rel="noopener noreferrer">The Panopticlick paper ${ARROW_ICON}</a>
            </div>
          </section>
        </div>
      </div>
    </article>
  `;
}
