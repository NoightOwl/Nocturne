export const ROUTES = Object.freeze(["home", "test", "results", "learn", "about", "privacy"]);

/**
 * Parse a hash route without touching the DOM.
 * @param {string} hash
 * @returns {{name: string, path: string}}
 */
export function parseRoute(hash = "") {
  let raw = String(hash || "");
  if (raw.startsWith("#")) raw = raw.slice(1);
  raw = raw.replace(/^\/+/, "").replace(/\/+$/, "");
  const [path] = raw.split("?");
  if (!path) return { name: "home", path: "" };
  return {
    name: ROUTES.includes(path) ? path : "unknown",
    path,
  };
}

export function routeHash(name) {
  return name === "home" ? "#/" : `#/${name}`;
}

export function navigate(name) {
  const next = routeHash(name);
  if (location.hash === next) {
    window.dispatchEvent(new Event("hashchange"));
    return;
  }
  location.hash = next;
}

export function setActiveNav(name) {
  const active = name === "home" || name === "test" || name === "results" ? "test" : name;
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const isActive = link.dataset.nav === active;
    link.classList.toggle("is-active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}
