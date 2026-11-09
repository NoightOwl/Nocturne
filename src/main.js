import { renderHome } from "./views/home.js";
import { parseRoute, ROUTES, setActiveNav } from "./router.js";
import { applyBrand, focusView, scrollTop, setDocumentTitle } from "./ui.js";

const view = document.getElementById("view");
const TITLES = {
  home: "",
  test: "Local scan",
  results: "Exposure report",
  learn: "Field guide",
  about: "About and methodology",
  privacy: "Privacy model",
};

const LOADERS = {
  home: () => Promise.resolve({ render: renderHome }),
  test: () => import("./views/test.js").then((module) => ({ render: module.renderTest })),
  results: () => import("./views/results.js").then((module) => ({ render: module.renderResults })),
  learn: () => import("./views/learn.js").then((module) => ({ render: module.renderLearn })),
  about: () => import("./views/about.js").then((module) => ({ render: module.renderAbout })),
  privacy: () => import("./views/privacy.js").then((module) => ({ render: module.renderPrivacy })),
};

const loaded = new Map();
let cleanup = null;
let renderToken = 0;
let firstRender = true;

function prefetchRoute(name) {
  if (!LOADERS[name] || loaded.has(name)) return;
  const request = LOADERS[name]();
  loaded.set(name, request);
  request.catch(() => loaded.delete(name));
}

function getLoader(name) {
  const key = ROUTES.includes(name) ? name : "home";
  if (!loaded.has(key)) loaded.set(key, LOADERS[key]());
  return loaded.get(key);
}

function renderNotFound() {
  view.innerHTML = `
    <section class="empty-report shell panel-corner">
      <p class="eyebrow"><span class="signal-dot"></span> Route not found</p>
      <h1>That signal is off the map.</h1>
      <p>The page you followed does not exist. The scanner is one click away.</p>
      <a class="button button-primary" href="#/test">Run local scan</a>
    </section>
  `;
}

async function renderRoute() {
  const token = ++renderToken;
  const route = parseRoute(location.hash);
  setActiveNav(route.name === "unknown" ? "" : route.name);
  setDocumentTitle(TITLES[route.name] ?? "Page not found");

  if (route.name === "unknown") {
    cleanup?.();
    cleanup = null;
    renderNotFound();
    focusView(view);
    scrollTop();
    return;
  }

  view.setAttribute("aria-busy", "true");
  try {
    const module = await getLoader(route.name);
    if (token !== renderToken) return;
    cleanup?.();
    cleanup = null;
    view.innerHTML = "";
    const result = module.render(view);
    if (typeof result === "function") cleanup = result;
    view.setAttribute("aria-busy", "false");
    if (!firstRender) {
      focusView(view);
      scrollTop();
    }
    firstRender = false;
  } catch {
    if (token !== renderToken) return;
    view.setAttribute("aria-busy", "false");
    view.innerHTML = `
      <section class="empty-report shell panel-corner">
        <p class="eyebrow"><span class="signal-dot"></span> Load error</p>
        <h1>This view failed to load.</h1>
        <p>The local JavaScript module could not be loaded. Refresh the page and try again.</p>
        <a class="button button-primary" href="#/">Return home</a>
      </section>
    `;
  }
}

function prefetchFromEvent(event) {
  const target = event.target.closest?.("[data-prefetch]");
  if (!target) return;
  prefetchRoute(target.dataset.prefetch);
}

document.addEventListener("pointerover", prefetchFromEvent, { passive: true });
document.addEventListener("focusin", prefetchFromEvent);
document.addEventListener("click", (event) => {
  const link = event.target.closest?.("[data-scroll]");
  if (!link) return;
  const target = document.getElementById(link.dataset.scroll);
  if (!target) return;
  event.preventDefault();
  target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
});
window.addEventListener("hashchange", renderRoute);
window.addEventListener("load", () => {
  // Warm the scan chunk once the page is idle; it is still not executed.
  const idle = window.requestIdleCallback || ((callback) => setTimeout(callback, 1200));
  idle(() => prefetchRoute("test"));
});

applyBrand();
document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

if (!location.hash) {
  history.replaceState(null, "", "#/");
}
renderRoute();
