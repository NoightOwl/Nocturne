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

export const GITHUB_ICON = `
<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
  <path fill="currentColor" d="M12 .7A11.3 11.3 0 0 0 .7 12a11.3 11.3 0 0 0 7.7 10.7c.6.1.8-.2.8-.5v-1.8c-3.1.7-3.8-1.3-3.8-1.3-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 1.7 2.6 1.2 3.2.9.1-.7.4-1.2.7-1.5-2.5-.3-5.1-1.2-5.1-5.5 0-1.2.4-2.2 1.1-3-.1-.3-.5-1.4.1-2.9 0 0 .9-.3 3.1 1.1a10.8 10.8 0 0 1 5.6 0c2.1-1.5 3.1-1.1 3.1-1.1.6 1.5.2 2.6.1 2.9.7.8 1.1 1.8 1.1 3 0 4.3-2.6 5.2-5.1 5.5.4.3.8 1 .8 2v2.9c0 .3.2.6.8.5A11.3 11.3 0 0 0 23.3 12 11.3 11.3 0 0 0 12 .7Z"/>
</svg>`;

export const ARROW_ICON = `
<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
  <path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M4 10h11M11 5l5 5-5 5"/>
</svg>`;

export const LOCK_ICON = `
<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
  <rect x="4" y="8" width="12" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <path d="M7 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.5"/>
</svg>`;
