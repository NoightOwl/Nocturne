import { mountReveal } from "../ui/reveal.js";

export function renderPrivacy(container) {
  container.innerHTML = `
    <article class="content-page">
      <header class="content-hero shell">
        <p class="label">Privacy model</p>
        <h1>Your report stays in this tab</h1>
        <p class="lede">NOCTURNE has no backend, no account system, no analytics, and no report upload. The only network request is the one that loads the static files.</p>
      </header>

      <div class="doc-layout shell">
        <aside class="doc-nav glass light">
          <nav aria-label="On this page">
            <p class="label">On this page</p>
            <a href="#/" data-scroll="local">Local processing</a>
            <a href="#/" data-scroll="host">What GitHub sees</a>
            <a href="#/" data-scroll="storage">Storage</a>
            <a href="#/" data-scroll="links">External links</a>
          </nav>
        </aside>

        <div class="doc-body">
          <section class="doc-section reveal" id="local" tabindex="-1">
            <h2>Local processing</h2>
            <p>All measurement happens in your browser using standard Web APIs. The report is assembled in memory and rendered in the current tab. It is not sent to a server, written to a database, or shared with another service.</p>
            <p>There are no third-party scripts, remote fonts, analytics pixels, or CDNs. The content security policy blocks outbound connections from the page.</p>
            <table class="facts-table">
              <tbody>
                <tr><th scope="row">Report upload</th><td class="good">None</td></tr>
                <tr><th scope="row">Analytics</th><td class="good">None</td></tr>
                <tr><th scope="row">Advertising</th><td class="good">None</td></tr>
                <tr><th scope="row">Accounts</th><td class="good">None</td></tr>
                <tr><th scope="row">Report persistence</th><td class="warn">Memory only</td></tr>
              </tbody>
            </table>
          </section>

          <section class="doc-section reveal" id="host" tabindex="-1">
            <h2>What GitHub Pages can see</h2>
            <p>NOCTURNE is a static site hosted on GitHub Pages. Like any web host, GitHub receives the request that loads the page, including an IP address, user agent, and requested URL, subject to GitHub's own policies. NOCTURNE does not add any tracking on top of that infrastructure layer.</p>
            <p>If you need to avoid host-level request logs entirely, run the project locally or serve the static files from infrastructure you control.</p>
          </section>

          <section class="doc-section reveal" id="storage" tabindex="-1">
            <h2>Cookies and storage probes</h2>
            <p>The storage collector checks whether first-party cookies and local storage are available. It writes a temporary cookie and a temporary storage key, reads them back, and deletes them immediately. Neither contains an identifier, and neither is used to recognise you later.</p>
            <p>Reports are not saved to local storage. Refreshing the page clears the in-memory report. The “Download report” button creates a local file only when you click it, and “Copy full hash” writes to your clipboard only when you click it.</p>
          </section>

          <section class="doc-section reveal" id="links" tabindex="-1">
            <h2>External links</h2>
            <p>Links to EFF, Tor, Firefox, Privacy Badger, and research papers open only when you activate them. External links use <code class="mono">rel="noopener noreferrer"</code> and the page sends no referrer information.</p>
            <p>The WebRTC collector uses an empty STUN server list, so it does not contact an external server to discover candidates. It reports only whether raw address-looking candidates appeared; actual addresses are not included in the report.</p>
            <p class="doc-note-text">This page describes the app's behaviour, not legal advice or a guarantee about third-party sites you choose to visit.</p>
          </section>
        </div>
      </div>
    </article>
  `;

  container.querySelector(".doc-section")?.classList.add("reveal-stagger", "is-in");
  return mountReveal(container);
}
