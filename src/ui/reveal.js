/**
 * Entrance reveal + sub-8px depth drift. No scroll library: two
 * IntersectionObservers, at most one passive scroll listener, one rAF at a
 * time. The only style a view writes is the `--depth-y` custom property.
 */

const REDUCED = "(prefers-reduced-motion: reduce)";
const MAX_DEPTH = 8;

export function quiet() {
  let reduce = false;
  try {
    reduce = Boolean(window.matchMedia?.(REDUCED).matches);
  } catch {
    reduce = false;
  }
  return reduce || document.documentElement.dataset.motion === "off";
}

function revealAll(root) {
  for (const node of root.querySelectorAll(".reveal")) node.classList.add("is-in");
}

/**
 * @param {ParentNode} root element containing `.reveal` / `[data-depth]`
 * @returns {() => void} cleanup
 */
export function mountReveal(root) {
  const scope = root && root.querySelectorAll ? root : document;
  const cleanups = [];
  const done = () => cleanups.forEach((fn) => fn());

  if (quiet() || typeof window.IntersectionObserver !== "function") {
    revealAll(scope);
    return done;
  }

  /* --- entrance: one class, added once, then unobserved --------------- */
  const reveal = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        reveal.unobserve(entry.target);
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
  );
  for (const node of scope.querySelectorAll(".reveal")) reveal.observe(node);
  cleanups.push(() => reveal.disconnect());

  /* --- depth: rects cached, recalculated at most once per rAF -------- */
  const targets = [...scope.querySelectorAll("[data-depth]")];
  if (!targets.length) return done;

  const visible = new Set();
  const rects = new Map();
  let frame = 0;
  let listening = false;

  const paint = () => {
    frame = 0;
    const height = window.innerHeight || 1;
    const center = height / 2;
    for (const node of visible) {
      const rect = rects.get(node);
      if (!rect) continue;
      const progress = (rect.top + rect.height / 2 - center) / height;
      const y = Math.max(-MAX_DEPTH, Math.min(MAX_DEPTH, progress * MAX_DEPTH));
      node.style.setProperty("--depth-y", `${y.toFixed(2)}px`);
    }
  };
  const request = () => {
    if (!frame) frame = requestAnimationFrame(paint);
  };
  const sample = () => {
    // One layout read per target per frame, shared by every depth element.
    for (const node of visible) rects.set(node, node.getBoundingClientRect());
    request();
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(() => {
      frame = 0;
      sample();
    });
  };
  const listen = (on) => {
    if (on === listening) return;
    listening = on;
    const method = on ? "addEventListener" : "removeEventListener";
    window[method]("scroll", onScroll, { passive: true });
    window[method]("resize", onScroll, { passive: true });
  };
  const stop = () => {
    listen(false);
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };

  const depth = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      if (!visible.size) return stop();
      listen(true);
      onScroll();
    },
    { threshold: 0 },
  );
  for (const node of targets) depth.observe(node);
  cleanups.push(() => {
    stop();
    depth.disconnect();
  });

  const onVisibility = () => {
    if (document.visibilityState === "hidden") stop();
    else if (visible.size) {
      listen(true);
      onScroll();
    }
  };
  document.addEventListener("visibilitychange", onVisibility);
  cleanups.push(() => document.removeEventListener("visibilitychange", onVisibility));

  return done;
}

export default mountReveal;
