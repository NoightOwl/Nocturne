import { BRAND } from "../data/brand.js";
import { ATTRIBUTE_MODEL } from "../data/reference-model.js";
import { getReport } from "../store.js";
import { prettyJson, copyText, downloadText } from "../lib/dom.js";
import { formatBits, formatDuration, formatOneIn, formatPercent } from "../lib/format.js";
import { ARROW_ICON, toast } from "../ui.js";

function statusLabel(status) {
  return status === "ok" ? "Measured" : status === "blocked" ? "Blocked" : status === "error" ? "Error" : "Unavailable";
}

function toneClass(tone) {
  return tone === "good" ? "good" : tone === "danger" ? "danger" : tone === "warn" ? "warn" : tone === "caution" ? "caution" : "info";
}

function makeAttributeRow(attribute, contribution) {
  const spec = ATTRIBUTE_MODEL[attribute.id];
  const status = attribute.status === "ok" ? "ok" : attribute.status;
  const bits = attribute.stability === "randomized" ? "randomised" : formatBits(attribute.bits.low, attribute.bits.high);
  const details = document.createElement("details");
  details.className = "attribute-details";
  const summary = document.createElement("summary");
  summary.className = "attribute-summary";

  const left = document.createElement("span");
  left.className = "attribute-left";
  const dot = document.createElement("span");
  dot.className = `attribute-dot ${status}`;
  dot.setAttribute("aria-hidden", "true");
  const name = document.createElement("span");
  name.className = "attribute-name";
  name.textContent = attribute.label;
  const category = document.createElement("span");
  category.className = "attribute-category mono";
  category.textContent = attribute.category;
  left.append(dot, name, category);

  const right = document.createElement("span");
  right.className = "attribute-right";
  const value = document.createElement("span");
  value.className = "attribute-value mono";
  value.textContent = attribute.displayValue;
  const bitBadge = document.createElement("span");
  bitBadge.className = `bit-badge mono ${attribute.stability === "randomized" ? "good" : ""}`;
  bitBadge.textContent = bits;
  right.append(value, bitBadge);

  summary.append(left, right);
  details.append(summary);

  const body = document.createElement("div");
  body.className = "attribute-body";
  const meta = document.createElement("p");
  meta.className = "attribute-note";
  meta.textContent = spec?.why || attribute.note || "";
  body.append(meta);

  if (attribute.note) {
    const note = document.createElement("p");
    note.className = "attribute-note muted";
    note.textContent = attribute.note;
    body.append(note);
  }

  const rawLabel = document.createElement("span");
  rawLabel.className = "mono attribute-raw-label";
  rawLabel.textContent = `RAW SIGNAL · ${statusLabel(attribute.status)}${contribution ? ` · ${formatBits(contribution.low, contribution.high)} contribution` : " · not counted"}`;
  const pre = document.createElement("pre");
  pre.className = "raw-value";
  pre.textContent = prettyJson(attribute.value);
  body.append(rawLabel, pre);
  details.append(body);
  return details;
}

function makeSignalRow(signal) {
  const row = document.createElement("div");
  row.className = "signal-row";
  const dot = document.createElement("span");
  dot.className = `signal-status ${signal.status}`;
  dot.setAttribute("aria-hidden", "true");
  const copy = document.createElement("span");
  copy.className = "signal-copy";
  const label = document.createElement("strong");
  label.textContent = signal.label;
  const detail = document.createElement("span");
  detail.textContent = signal.detail;
  copy.append(label, detail);
  const badge = document.createElement("span");
  badge.className = `status-badge ${signal.status}`;
  badge.textContent = signal.status === "pass" ? "PASS" : signal.status === "warn" ? "CHECK" : "UNKNOWN";
  row.append(dot, copy, badge);
  return row;
}

function makeRecommendation(item) {
  const article = document.createElement("article");
  article.className = `recommendation ${toneClass(item.tone)}`;
  const marker = document.createElement("span");
  marker.className = "recommendation-marker mono";
  marker.textContent = item.tone === "good" ? "KEEP" : item.tone === "warn" ? "FIX" : "NOTE";
  const copy = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = item.title;
  const body = document.createElement("p");
  body.textContent = item.body;
  copy.append(title, body);
  if (item.link) {
    const link = document.createElement("a");
    link.href = item.link.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "text-link";
    link.textContent = item.link.label;
    copy.append(link);
  }
  if (item.secondaryLink) {
    const second = document.createElement("a");
    second.href = item.secondaryLink.url;
    second.target = "_blank";
    second.rel = "noopener noreferrer";
    second.className = "text-link recommendation-secondary";
    second.textContent = item.secondaryLink.label;
    copy.append(second);
  }
  article.append(marker, copy);
  return article;
}

export function renderResults(container) {
  const report = getReport();
  if (!report) {
    container.innerHTML = `
      <section class="empty-report shell panel-corner">
        <p class="eyebrow"><span class="signal-dot"></span> No report in memory</p>
        <h1>Run a scan first.</h1>
        <p>Reports are intentionally kept only in this tab. Refresh the page and the previous result is gone.</p>
        <a class="button button-primary" href="#/test">Run local scan ${ARROW_ICON}</a>
      </section>
    `;
    return;
  }

  const { entropy, signature, randomized } = report;
  const categoryOrder = ["Browser", "Device", "Display", "Locale", "Rendering", "Privacy", "Network"];
  const contributionById = new Map(entropy.contributions.map((item) => [item.id, item]));
  const sortedAttributes = [...report.attributes].sort((a, b) => {
    const aContribution = contributionById.get(a.id)?.high || 0;
    const bContribution = contributionById.get(b.id)?.high || 0;
    if (aContribution !== bContribution) return bContribution - aContribution;
    return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
  });

  container.innerHTML = `
    <section class="results-page shell">
      <div class="report-heading">
        <div>
          <p class="eyebrow"><span class="signal-dot"></span> Exposure report // local</p>
          <h1>Your browser's <span class="text-accent">signal footprint.</span></h1>
          <p class="lede">A local estimate of how many identifying details this configuration exposes, plus the signals worth acting on.</p>
        </div>
        <div class="report-actions">
          <a class="button button-ghost" href="#/test" data-prefetch="test">Run again ${ARROW_ICON}</a>
        </div>
      </div>

      <div class="summary-grid">
        <article class="score-card panel-corner">
          <div class="score-topline">
            <span class="mono">ESTIMATED IDENTIFYING INFORMATION</span>
            <span class="confidence ${toneClass(entropy.confidence.tone)}">${entropy.confidence.label}</span>
          </div>
          <div class="score-main">
            <div class="score-number"><span data-score-point>${entropy.point}</span><span class="score-unit">bits</span></div>
            <div class="score-range mono" data-score-range>${formatBits(entropy.low, entropy.high)}</div>
          </div>
          <progress class="score-meter" max="24" value="${entropy.point}" aria-label="Estimated identifying information: ${formatBits(entropy.low, entropy.high)}">${entropy.point}</progress>
          <div class="score-scale mono"><span>0 · common</span><span>12</span><span>18</span><span>24 · distinctive</span></div>
          <div class="score-foot">
            <span>Reference range <strong data-one-in>${entropy.oneInLabel}</strong></span>
            <span class="mono" data-coverage>${formatPercent(entropy.coverage)} coverage</span>
          </div>
          <div class="score-foot score-point">
            <span>Point estimate <strong data-one-in-point>${formatOneIn(entropy.oneInPoint)}</strong></span>
            <span class="muted">derived from the model midpoint</span>
          </div>
          <p class="score-disclaimer">This is not a live population count. It is a documented local estimate with a deliberately wide range.</p>
        </article>

        <article class="verdict-card panel-corner">
          <span class="eyebrow">Readout</span>
          <h2 class="verdict ${toneClass(entropy.verdict.tone)}" data-verdict>${entropy.verdict.label}</h2>
          <p class="verdict-sentence" data-verdict-sentence>${entropy.verdict.sentence}</p>
          <div class="verdict-meta">
            <div><span class="mono">CONFIDENCE</span><strong data-confidence>${entropy.confidence.label}</strong></div>
            <div><span class="mono">SCAN TIME</span><strong data-duration>${report.durationMs ? formatDuration(report.durationMs) : "n/a"}</strong></div>
            <div><span class="mono">SIGNALS</span><strong data-signal-count>${entropy.available}/${entropy.expected}</strong></div>
          </div>
          <p class="muted small" data-confidence-detail>${entropy.confidence.detail}</p>
          <a class="text-link" href="#/about">How this estimate works ${ARROW_ICON}</a>
        </article>
      </div>

      <div class="randomized-note panel-corner" data-randomized hidden>
        <span class="mono">RANDOMISATION DETECTED</span>
        <p data-randomized-copy></p>
      </div>

      <div class="report-grid">
        <section class="report-section panel-corner" aria-labelledby="attributes-heading">
          <div class="section-title-row">
            <div>
              <p class="eyebrow">01 / Surfaces</p>
              <h2 id="attributes-heading">What makes you stand out</h2>
            </div>
            <span class="mono muted">SORTED BY CONTRIBUTION</span>
          </div>
          <p class="section-intro">Each row is a signal a website can request. Expand a row to see the raw value and why it matters.</p>
          <div class="attribute-list" data-attributes></div>
        </section>

        <div class="report-side">
          <section class="report-section panel-corner" aria-labelledby="signals-heading">
            <p class="eyebrow">02 / Defences</p>
            <h2 id="signals-heading">Privacy signals</h2>
            <p class="section-intro">These are observations, not a security score. “Unknown” is a normal outcome on locked-down browsers.</p>
            <div class="signal-list" data-signals></div>
          </section>

          <section class="report-section panel-corner" aria-labelledby="signature-heading">
            <p class="eyebrow">03 / Signature</p>
            <h2 id="signature-heading">Local fingerprint hash</h2>
            <p class="section-intro">Stable, successfully measured values are canonicalised and hashed with the browser's native Web Crypto. Nothing is uploaded.</p>
            <div class="signature-box">
              <code data-signature>${signature.short}</code>
              <span class="mono" data-signature-meta>${signature.valueCount} stable values · ${signature.algorithm}</span>
            </div>
            <div class="inline-actions">
              <button class="button button-small button-ghost" type="button" data-copy>Copy full hash</button>
              <button class="button button-small button-ghost" type="button" data-download>Download report</button>
            </div>
            <p class="muted small signature-note" data-signature-note></p>
          </section>
        </div>
      </div>

      <section class="recommendations panel-corner" aria-labelledby="recommendations-heading">
        <div class="section-title-row">
          <div>
            <p class="eyebrow">04 / Next step</p>
            <h2 id="recommendations-heading">What to do with this</h2>
          </div>
          <span class="mono muted">${report.signalSummary.pass} PASS · ${report.signalSummary.warn} CHECK</span>
        </div>
        <div class="recommendation-list" data-recommendations></div>
      </section>

      <footer class="report-footer">
        <p><span class="mono">METHOD:</span> ${report.disclaimer}</p>
        <p><span class="mono">MODEL:</span> ${report.modelVersion} · <span class="mono">SCHEMA:</span> ${report.schemaVersion} · <span class="mono">APP:</span> ${report.appVersion}</p>
        <p class="muted">Inspired by EFF's Cover Your Tracks. NOCTURNE is independent and not affiliated with or endorsed by EFF. <a href="${BRAND.effAboutUrl}" target="_blank" rel="noopener noreferrer">Read EFF's methodology</a>.</p>
      </footer>
    </section>
  `;

  const attrRoot = container.querySelector("[data-attributes]");
  for (const attribute of sortedAttributes) {
    attrRoot.append(makeAttributeRow(attribute, contributionById.get(attribute.id)));
  }

  const signalRoot = container.querySelector("[data-signals]");
  for (const signal of report.signals) signalRoot.append(makeSignalRow(signal));

  const recommendationRoot = container.querySelector("[data-recommendations]");
  for (const item of report.recommendations) recommendationRoot.append(makeRecommendation(item));

  const randomizedNote = container.querySelector("[data-randomized]");
  if (randomized.length) {
    randomizedNote.hidden = false;
    container.querySelector("[data-randomized-copy]").textContent =
      `${randomized.join(", ")} changed between samples. Those surfaces are excluded from the stable signature, and the estimate above uses only stable bits.`;
  }

  const signatureNote = container.querySelector("[data-signature-note]");
  if (!signature.algorithm.startsWith("SHA-256")) {
    signatureNote.textContent =
      "Web Crypto is unavailable in this context, so a non-cryptographic fallback was used. The hash is still stable, but it is not suitable as a security primitive.";
  } else {
    signatureNote.textContent =
      "The hash is a local comparison aid. It is not an account, an identifier, or proof of uniqueness.";
  }

  const copyButton = container.querySelector("[data-copy]");
  copyButton.addEventListener("click", async () => {
    const ok = await copyText(signature.hash);
    toast(ok ? "Full signature hash copied." : "Clipboard unavailable. Select the hash manually.");
  });

  container.querySelector("[data-download]").addEventListener("click", () => {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadText(`nocturne-report-${stamp}.json`, prettyJson(report));
    toast("Report downloaded locally.");
  });
}
