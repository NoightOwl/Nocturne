import { BRAND } from "../data/brand.js";
import { ARROW_ICON } from "../ui.js";
import { mountReveal } from "../ui/reveal.js";

const MIT_TEXT = `MIT License

Copyright (c) 2026 NOCTURNE contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

export function renderLicense(container) {
  container.innerHTML = `
    <article class="content-page">
      <header class="content-hero shell">
        <p class="label">License and notices</p>
        <h1>MIT, with the notices that go with it</h1>
        <p class="lede">The code is open, the report is yours, and the project is independent of the organizations it cites.</p>
      </header>

      <div class="doc-layout shell">
        <aside class="doc-nav glass light">
          <nav aria-label="On this page">
            <p class="label">On this page</p>
            <a href="#/license" data-scroll="scope">What this covers</a>
            <a href="#/license" data-scroll="text">MIT License</a>
            <a href="#/license" data-scroll="notices">Third-party notices</a>
            <a href="#/license" data-scroll="report">Your report</a>
          </nav>
        </aside>

        <div class="doc-body">
          <section class="doc-section reveal" id="scope" tabindex="-1">
            <h2>What this covers</h2>
            <p>NOCTURNE's original source code, copy, and visual identity are released under the ${BRAND.license} License. You may use, modify, and redistribute them, including commercially, provided the copyright and permission notice travels with copies or substantial portions of the software.</p>
            <table class="facts-table">
              <tbody>
                <tr><th scope="row">Source code</th><td>${BRAND.license}</td></tr>
                <tr><th scope="row">Documentation</th><td>${BRAND.license}</td></tr>
                <tr><th scope="row">Runtime dependencies</th><td class="good">None</td></tr>
                <tr><th scope="row">Report data</th><td class="good">Yours, not collected</td></tr>
              </tbody>
            </table>
          </section>

          <section class="doc-section reveal" id="text" tabindex="-1">
            <h2>The MIT License</h2>
            <p>This is the license text for the repository. The canonical copy also lives in <a href="${BRAND.repoUrl}/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">LICENSE</a>.</p>
            <pre class="license-text" aria-label="MIT License text">${MIT_TEXT}</pre>
          </section>

          <section class="doc-section reveal" id="notices" tabindex="-1">
            <h2>Third-party notices</h2>
            <p>NOCTURNE is inspired by EFF's Cover Your Tracks and by the public research that made browser fingerprinting legible to ordinary users. It does not include EFF source code, logos, site copy, illustrations, or other EFF assets.</p>
            <p>NOCTURNE is not affiliated with, endorsed by, or sponsored by the Electronic Frontier Foundation. The names of EFF, Cover Your Tracks, Tor, Firefox, Brave, and Privacy Badger belong to their respective owners and are used only to describe the work or the tools.</p>
            <ul class="sources">
              <li><a href="${BRAND.effAboutUrl}" target="_blank" rel="noopener noreferrer">EFF Cover Your Tracks — About and methodology</a></li>
              <li><a href="${BRAND.effPaperUrl}" target="_blank" rel="noopener noreferrer">Peter Eckersley, “How Unique Is Your Web Browser?” (PETS 2010)</a></li>
            </ul>
          </section>

          <section class="doc-section reveal" id="report" tabindex="-1">
            <h2>Your report</h2>
            <p>A scan produces a report in your browser's memory. It is not sent to a server, added to a dataset, or covered by a license claim from this project. You can copy its hash or download it as a local file.</p>
            <p>The software is provided “as is”, without warranty of any kind, as the license above explains. That is also true of the reference model's estimate: it is a local comparison aid, not a measurement of a population.</p>
            <div class="inline-actions">
              <a class="text-link" href="${BRAND.repoUrl}" target="_blank" rel="noopener noreferrer">View the source ${ARROW_ICON}</a>
              <a class="text-link" href="#/about">About the method ${ARROW_ICON}</a>
            </div>
          </section>
        </div>
      </div>
    </article>
  `;

  container.querySelector(".doc-section")?.classList.add("reveal-stagger", "is-in");
  return mountReveal(container);
}
