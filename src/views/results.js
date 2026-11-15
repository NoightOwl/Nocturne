import { BRAND } from "../data/brand.js";
import { ATTRIBUTE_MODEL, MAX_BITS } from "../data/reference-model.js";
import { getReport } from "../store.js";
import { prettyJson, copyText, downloadText } from "../lib/dom.js";
import { formatBits, formatDuration } from "../lib/format.js";
import { ARROW_ICON, toast } from "../ui.js";

const TONE_TEXT = { good: "Stable", warn: "Worth a look", danger: "Exposed", caution: "Worth a look", info: "Observation" };

function formatDateTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "just now";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function anchor(text, url) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "text-link";
  link.textContent = text;
  return link;
}

function makeAttributeRow(attribute, contribution) {
  const spec = ATTRIBUTE_MODEL[attribute.id];
  const randomized = attribute.stability === "randomized";
  const counted = Boolean(contribution && contribution.high > 0);
  const details = document.createElement("details");
  details.className = `attribute-details${counted ? " is-top" : ""}`;

  const summary = document.createElement("summary");
  summary.className = "attribute-summary";
  const left = document.createElement("span");
  left.className = "attribute-left";
  const dot = document.createElement("span");
  dot.className = `attribute-dot ${attribute.status}`;
  dot.setAttribute("aria-hidden", "true");
  const name = document.createElement("span");
  name.className = "attribute-name";
  name.textContent = attribute.label;
  const category = document.createElement("span");
  category.className = "attribute-category";
  category.textContent = attribute.category;
  left.append(dot, name, category);

  // The short value only: the raw reading lives in the expanded row.
  const value = document.createElement("span");
  value.className = "attribute-value";
  value.textContent = attribute.displayValue;
  const points = document.createElement("span");
  points.className = `attribute-points mono${counted ? " is-top" : ""}`;
  points.textContent = randomized ? "randomised" : formatBits(attribute.bits.low, attribute.bits.high);
  const right = document.createElement("span");
  right.className = "attribute-right";
  right.append(value, points);
  summary.append(left, right);
  details.append(summary);

  const body = document.createElement("div");
  body.className = "attribute-body";
  const why = document.createElement("p");
  why.className = "attribute-note";
  why.textContent = spec?.why || attribute.note || "";
  body.append(why);
  if (attribute.note) {
    const note = document.createElement("p");
    note.className = "attribute-note muted";
    note.textContent = attribute.note;
    body.append(note);
  }

  const rawLabel = document.createElement("span");
  rawLabel.className = "attribute-raw-label mono";
  rawLabel.textContent = `${TONE_TEXT[attribute.status] || "Unknown"} · ${counted ? `${formatBits(contribution.low, contribution.high)} added` : "not counted here"}`;
  const pre = document.createElement("pre");
  pre.className = "attribute-raw";
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
  badge.className = `signal-badge ${signal.status}`;
  badge.textContent = signal.status === "pass" ? "Pass" : signal.status === "warn" ? "Check" : "Unknown";
  row.append(dot, copy, badge);
  return row;
}

function makeRecommendation(item) {
  const article = document.createElement("article");
  article.className = `recommendation ${item.tone}`;
  const marker = document.createElement("span");
  marker.className = "recommendation-marker mono";
  marker.textContent = item.tone === "good" ? "Keep" : item.tone === "warn" ? "Fix" : "Note";
  const copy = document.createElement("div");
  copy.className = "recommendation-copy";
  const title = document.createElement("h3");
  title.textContent = item.title;
  const body = document.createElement("p");
  body.textContent = item.body;
  copy.append(title, body);
  if (item.link) copy.append(anchor(item.link.label, item.link.url));
  if (item.secondaryLink) {
    const second = anchor(item.secondaryLink.label, item.secondaryLink.url);
    second.classList.add("recommendation-secondary");
    copy.append(second);
  }
  article.append(marker, copy);
  return article;
}

export function renderResults(container) {
  const report = getReport();
  if (!report) {
    container.innerHTML = `
      <section class="empty-report shell">
        <h1>Run a scan first</h1>
        <p>Reports are kept only in this tab. Refresh the page and the previous result is gone, so the next step is a fresh local scan.</p>
        <a class="button button-primary" href="#/test" data-prefetch="test">Run local scan ${ARROW_ICON}</a>
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
  const top = report.attributes
    .map((attribute) => ({ attribute, contribution: contributionById.get(attribute.id) }))
    .filter(({ attribute, contribution }) => contribution?.high > 0 && attribute.stability !== "randomized")
    .sort((a, b) => b.contribution.high - a.contribution.high)[0];
  const contributionLine = (highest) =>
    highest
      ? `Largest single contributor: ${highest.attribute.label.toLowerCase()}, ${formatBits(highest.contribution.low, highest.contribution.high)} after discounting.`
      : "";

  const lowest = [...sortedAttributes].reverse().find((attribute) => (attribute.bits?.high ?? 0) === 0);
  const zeroLine = lowest ? ` ${lowest.label} was measured but adds no bits, so it sits at zero.` : "";

  container.innerHTML = `
    <section class="results-page shell">
      <header class="results-head">
        <div class="results-title-group">
          <h1 class="results-title">Exposure report</h1>
          <p class="results-subtitle">Measured ${formatDateTime(report.generatedAt)} in this tab. Nothing left the browser.</p>
        </div>
        <div class="results-actions">
          <button class="button button-ghost" type="button" data-print>Print or save</button>
          <a class="button button-primary" href="#/test" data-prefetch="test">Run again ${ARROW_ICON}</a>
        </div>
      </header>

      <div class="summary-grid">
        <div class="ruler-card glass panel">
          <p class="ruler-figure mono">
            <span data-score-point>${entropy.point}</span>
            <span class="ruler-unit">bits</span>
          </p>
          <div class="ruler" data-ruler role="img" aria-label="Estimated identifying information ${formatBits(entropy.low, entropy.high)} on a 0 to ${MAX_BITS} bit scale">
            <span class="ruler-track" aria-hidden="true"></span>
            <span class="ruler-range" data-ruler-range aria-hidden="true"></span>
            <span class="ruler-point" data-ruler-point aria-hidden="true"></span>
          </div>
          <div class="ruler-scale mono" aria-hidden="true">
            <span>0</span><span class="ruler-tick is-third">8</span><span class="ruler-tick is-two-thirds">16</span><span>${MAX_BITS}</span>
          </div>
          <dl class="ruler-facts">
            <div><dt>Reference range</dt><dd class="mono">${entropy.oneInLabel}</dd></div>
            <div><dt>Coverage</dt><dd class="mono">${Math.round(entropy.coverage * 100)}%</dd></div>
          </dl>
          <p class="ruler-caption">Reference model ${report.modelVersion}, with overlapping signals discounted. This is a fixed-model estimate, not a live population count.</p>
        </div>

        <div class="verdict-card glass">
          <h2 class="verdict ${entropy.verdict.tone}">${entropy.verdict.label}</h2>
          <p class="verdict-sentence">${entropy.verdict.sentence}</p>
          <div class="verdict-meta">
            <div><span>Confidence</span><span class="${entropy.confidence.tone}">${entropy.confidence.label}</span></div>
            <div><span>Scan time</span><span class="mono">${report.durationMs ? formatDuration(report.durationMs) : "n/a"}</span></div>
            <div><span>Signals captured</span><span class="mono">${entropy.available} of ${entropy.expected}</span></div>
          </div>
          <p class="verdict-detail">${contributionLine(top)}</p>
          <a class="text-link" href="#/about">How this estimate works ${ARROW_ICON}</a>
        </div>
      </div>

      <div class="report-randomized" data-randomized hidden>
        <p data-randomized-copy></p>
      </div>

      <div class="report-grid">
        <section class="report-section" aria-labelledby="attributes-heading">
          <div class="report-section-head">
            <h2 id="attributes-heading">What makes you stand out</h2>
            <span class="report-section-meta">Sorted by contribution</span>
          </div>
          <p class="report-section-intro">Each row is a signal a website can request. Expand one to see the raw value and why it counts.${zeroLine}</p>
          <div class="attribute-list" data-attributes></div>
        </section>

        <div class="report-side">
          <section class="report-section" aria-labelledby="signals-heading">
            <div class="report-section-head">
              <h2 id="signals-heading">Privacy signals</h2>
            </div>
            <p class="report-section-intro">Observations, not a security score. “Unknown” is a normal outcome on locked-down browsers.</p>
            <div class="signal-list" data-signals></div>
          </section>

          <section class="report-section report-signature" aria-labelledby="signature-heading">
            <div class="report-section-head">
              <h2 id="signature-heading">Signature</h2>
              <span class="report-section-meta mono">${signature.valueCount} stable values</span>
            </div>
            <div class="signature glass panel">
              <code data-signature class="signature-hash mono">${signature.short}</code>
              <div class="signature-actions">
                <button class="button button-small button-ghost" type="button" data-copy>Copy full hash</button>
                <button class="button button-small button-ghost" type="button" data-download>Download report</button>
              </div>
            </div>
            <p class="signature-note" data-signature-note></p>
            <p class="report-randomized-note" data-randomized-note hidden data-randomized-inline></p>
          </section>
        </div>
      </div>

      <section class="recommendations" aria-labelledby="recommendations-heading">
        <div class="report-section-head">
          <h2 id="recommendations-heading">What to do with this</h2>
          <span class="report-section-meta">${report.signalSummary.pass} pass · ${report.signalSummary.warn} check</span>
        </div>
        <div class="recommendation-list" data-recommendations></div>
      </section>

      <footer class="report-footer">
        <p>Model ${report.modelVersion} · schema ${report.schemaVersion} · app ${report.appVersion}. ${report.disclaimer}</p>
        <p>Inspired by EFF's Cover Your Tracks. NOCTURNE is independent and not affiliated with or endorsed by EFF. <a href="${BRAND.effAboutUrl}" target="_blank" rel="noopener noreferrer">Read EFF's methodology</a></p>
      </footer>
    </section>
  `;

  // The ruler has no stylesheet dependency for its geometry: positions are
  // written once as custom properties on the card.
  const ruler = container.querySelector(".ruler-card");
  const lowPct = (entropy.low / MAX_BITS) * 100;
  const highPct = (entropy.high / MAX_BITS) * 100;
  ruler.style.setProperty("--range-from", `${lowPct}%`);
  ruler.style.setProperty("--range-to", `${highPct}%`);
  ruler.style.setProperty("--point", `${(entropy.point / MAX_BITS) * 100}%`);

  const attrRoot = container.querySelector("[data-attributes]");
  for (const attribute of sortedAttributes) {
    attrRoot.append(makeAttributeRow(attribute, contributionById.get(attribute.id)));
  }

  const signalRoot = container.querySelector("[data-signals]");
  for (const signal of report.signals) signalRoot.append(makeSignalRow(signal));

  const recommendationRoot = container.querySelector("[data-recommendations]");
  for (const item of report.recommendations) recommendationRoot.append(makeRecommendation(item));

  const randomizedCut =
    randomized.length && entropy.available < entropy.expected
      ? `${randomized.join(", ")} changed between samples. Those surfaces are left out of the stable signature, and the estimate uses only stable bits.`
      : "";
  if (randomizedCut) {
    for (const node of container.querySelectorAll("[data-randomized-copy]")) node.textContent = randomizedCut;
    container.querySelector("[data-randomized]").hidden = false;
  }

  const inlineNote = container.querySelector("[data-randomized-inline]");
  if (randomizedCut) {
    inlineNote.hidden = false;
    inlineNote.textContent = `${randomized.join(", ")} changes between samples, so it is not part of the signature.`;
  }

  container.querySelector("[data-signature-note]").textContent = signature.algorithm.startsWith("SHA-256")
    ? "A local comparison aid. Not an account, an identifier, or proof of uniqueness."
    : "Web Crypto was unavailable, so a non-cryptographic fallback produced this hash. It is still stable, but not a security primitive.";

  container.querySelector("[data-copy]").addEventListener("click", async () => {
    const ok = await copyText(signature.hash);
    toast(ok ? "Full signature hash copied." : "Clipboard unavailable. Select the hash manually.");
  });

  container.querySelector("[data-download]").addEventListener("click", () => {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadText(`nocturne-report-${stamp}.json`, prettyJson(report));
    toast("Report downloaded locally.");
  });

  // Printing opens every collapsed row so the paper copy is the whole report.
  container.querySelector("[data-print]").addEventListener("click", () => {
    for (const details of container.querySelectorAll(".attribute-details")) details.open = true;
    window.print();
  });
}
