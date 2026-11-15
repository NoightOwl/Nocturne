import { BRAND } from "./data/brand.js";

export function applyBrand() {
  document.querySelectorAll("[data-brand-name]").forEach((node) => {
    node.textContent = BRAND.name;
  });
  document.querySelectorAll("[data-brand-product]").forEach((node) => {
    node.textContent = BRAND.product;
  });
  document.querySelectorAll("[data-brand-tagline]").forEach((node) => {
    node.textContent = BRAND.tagline;
  });
  document.querySelectorAll("[data-version]").forEach((node) => {
    node.textContent = BRAND.version;
  });
  document.querySelectorAll("[data-license]").forEach((node) => {
    node.textContent = BRAND.license;
  });

  document.querySelectorAll("[data-repo-link]").forEach((link) => {
    if (BRAND.repoUrl) {
      link.href = BRAND.repoUrl;
      link.hidden = false;
    } else {
      link.hidden = true;
    }
  });

  document.querySelectorAll("[data-eff-link]").forEach((link) => {
    link.href = BRAND.effAboutUrl;
  });
}

export function setDocumentTitle(title) {
  document.title = title ? `${title} · ${BRAND.name}` : `${BRAND.name} — ${BRAND.product}`;
}

export function focusView(view) {
  try {
    view.focus({ preventScroll: true });
  } catch {
    view.focus();
  }
}

export function scrollTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

export function toast(message) {
  let node = document.querySelector(".toast");
  if (!node) {
    node = document.createElement("div");
    node.className = "toast";
    node.setAttribute("role", "status");
    node.setAttribute("aria-live", "polite");
    document.body.append(node);
  }
  node.textContent = message;
  node.classList.add("is-visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("is-visible"), 2600);
}

/* Icons — 16px line art, 1.5 stroke, currentColor. No fills except where a mark is solid. */
const ICON_SIZE = `width="16" height="16"`;

export const GITHUB_ICON = `
<svg viewBox="0 0 20 20" ${ICON_SIZE} aria-hidden="true" focusable="false" fill="currentColor">
  <path d="M10 1.6a8.4 8.4 0 0 0-2.66 16.36c.42.08.58-.18.58-.4v-1.4c-2.36.5-2.86-.98-2.86-.98-.38-1-.94-1.26-.94-1.26-.77-.52.06-.51.06-.51.85.06 1.3.87 1.3.87.76 1.28 1.98.91 2.46.7.08-.55.3-.92.54-1.13-1.9-.22-3.9-.94-3.9-4.19 0-.93.33-1.69.88-2.28-.09-.22-.38-1.1.08-2.3 0 0 .72-.23 2.35.88a8.06 8.06 0 0 1 4.28 0c1.63-1.11 2.35-.88 2.35-.88.46 1.2.17 2.08.08 2.3.55.59.88 1.35.88 2.28 0 3.26-2 3.97-3.91 4.18.31.27.58.79.58 1.6V17c0 .22.16.48.59.4A8.4 8.4 0 0 0 10 1.6Z"/>
</svg>`;

export const ARROW_ICON = `
<svg viewBox="0 0 20 20" ${ICON_SIZE} aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 10h11M11 5.5l4.5 4.5-4.5 4.5"/>
</svg>`;

export const LOCK_ICON = `
<svg viewBox="0 0 20 20" ${ICON_SIZE} aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <rect x="4.25" y="8.5" width="11.5" height="8" rx="2"/>
  <path d="M7.25 8.5V6.4a2.75 2.75 0 0 1 5.5 0v2.1"/>
</svg>`;
