import { BRAND } from "../data/brand.js";
import { ARROW_ICON } from "../ui.js";
import { mountReveal } from "../ui/reveal.js";

export function renderLearn(container) {
  container.innerHTML = `
    <article class="content-page">
      <header class="content-hero shell">
        <p class="label">Field guide</p>
        <h1>Fingerprints are not cookies</h1>
        <p class="lede">A cookie is something a site stores. A fingerprint is something your browser broadcasts. One can be deleted; the other has to be changed.</p>
      </header>

      <div class="doc-layout shell">
        <aside class="doc-nav glass light">
          <nav aria-label="On this page">
            <p class="label">On this page</p>
            <a href="#/" data-scroll="fingerprinting">What fingerprinting is</a>
            <a href="#/" data-scroll="entropy">What bits measure</a>
            <a href="#/" data-scroll="randomisation">Randomised beats spoofed</a>
            <a href="#/" data-scroll="limits">What this scan cannot see</a>
          </nav>
        </aside>

        <div class="doc-body">
          <section class="doc-section reveal" id="fingerprinting" tabindex="-1">
            <h2>What is browser fingerprinting?</h2>
            <p>Every request carries details that help a site render correctly: browser version, language, screen size, and more. JavaScript can ask for additional details like installed fonts, canvas pixels, GPU capabilities, and audio processing differences.</p>
            <p>A tracker combines those details into a profile. It does not need your name to recognise the same browser across visits. The profile can survive cookie deletion because it is derived from configuration and hardware, not a stored value.</p>
            <blockquote class="doc-quote">
              <p>The useful question is not “am I completely anonymous?” It is “how much does my browser reduce the signal, and where is the remaining signal concentrated?”</p>
            </blockquote>
          </section>

          <section class="doc-section reveal" id="entropy" tabindex="-1">
            <h2>What are “bits” of identifying information?</h2>
            <p>A bit is a doubling of possibilities. One bit separates two equally likely outcomes; ten bits separate about a thousand. If a signal gives a tracker ten bits, it narrows the crowd by roughly a factor of 1,024.</p>
            <p>Entropy is not a score you can max out. Signals overlap: a browser version implies an OS, an OS implies a GPU family, a GPU family correlates with fonts. Adding raw bits overstates the result, which is why NOCTURNE applies a correlation discount and presents a range with a confidence level.</p>
            <table class="doc-table">
              <thead>
                <tr><th scope="col">Bits</th><th scope="col">Crowd size</th><th scope="col">Possibilities</th></tr>
              </thead>
              <tbody>
                <tr><td>1 bit</td><td>2 people</td><td class="mono">2</td></tr>
                <tr><td>10 bits</td><td>about a thousand</td><td class="mono">1,024</td></tr>
                <tr><td>20 bits</td><td>a million or more</td><td class="mono">1,048,576</td></tr>
              </tbody>
            </table>
            <p class="doc-note-text">These are illustrative. The actual size of the crowd depends on the population, the signals, and their correlations.</p>
          </section>

          <section class="doc-section reveal" id="randomisation" tabindex="-1">
            <h2>Randomised beats spoofed</h2>
            <p>If you change one value to look like a different browser, the rest of your signals may no longer agree. A tracker can notice the mismatch: a browser claiming one platform while its GPU, fonts, and canvas output point somewhere else becomes more distinctive, not less.</p>
            <p>Fingerprint-resistant browsers take a different approach. They make a surface return a shared value for everyone, or add noise so the value changes between visits. NOCTURNE checks this directly: canvas, WebGL, and audio are sampled twice. If the hashes differ, the surface is randomised and is excluded from the stable signature.</p>
            <div class="doc-columns">
              <div class="note glass light">
                <p class="label">Stronger</p>
                <h3>Shared or randomised profile</h3>
                <p>Tor Browser, Brave's fingerprinting protection, Firefox's strict protection and <code class="mono">resistFingerprinting</code>.</p>
              </div>
              <div class="note glass light">
                <p class="label">Weaker</p>
                <h3>Single-value spoofing</h3>
                <p>Changing only the user agent or screen size while every other surface stays the same.</p>
              </div>
            </div>
          </section>

          <section class="doc-section reveal" id="limits" tabindex="-1">
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

  // The section that holds the first screen is present from the start; the
  // rest reveal as they enter the viewport.
  container.querySelector(".doc-section")?.classList.add("reveal-stagger", "is-in");
  return mountReveal(container);
}
