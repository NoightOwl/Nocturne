/**
 * The surface field behind the hero glass: a faint dot grid and one trace per
 * probe. Static by default — one frame is painted and the module stops. It
 * animates only while it is both live and on screen, at ~30fps, in 2D canvas.
 */

const GRID = 24;
const TRACES = 12;
const FPS = 33;

function calm() {
  let reduce = false;
  try {
    reduce = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  } catch {
    reduce = false;
  }
  if (reduce || document.documentElement.dataset.motion === "off") return true;
  // A save-data connection gets the same static page as a low-end device.
  return Boolean(window.navigator?.connection?.saveData);
}

function inkColors(host) {
  const colors = { trace: "rgba(75,82,91,.35)", grid: "rgba(58,64,72,.4)", accent: "#e06a2c" };
  try {
    const style = getComputedStyle(host);
    for (const key of Object.keys(colors)) {
      const value = style.getPropertyValue(`--ink-${key}`).trim() || style.getPropertyValue(`--${key}`).trim();
      if (value) colors[key] = value;
    }
  } catch {
    // Fallbacks above are fine.
  }
  return colors;
}

/** Deterministic per-trace shape so the resting frame always looks the same. */
const SHAPES = Array.from({ length: TRACES }, (_, i) => ({
  phase: i * 0.73,
  amp: 0.04 + ((i * 7) % 9) / 90,
  freq: 0.9 + ((i * 3) % 5) * 0.32,
  y: (i + 0.5) / TRACES,
  bright: i % 4 === 1,
}));

/**
 * @param {HTMLElement} host the `.field-host` element
 * @param {{live?: boolean, quiet?: boolean}} [options]
 */
export function mountField(host, options = {}) {
  if (!host) return { setLive() {}, poke() {}, cleanup() {} };

  const colors = inkColors(host);
  const still = options.quiet ?? calm();
  let width = 0;
  let height = 0;
  let time = 0;
  let live = Boolean(options.live) && !still;
  let visible = false;
  let frame = 0;
  let stamp = 0;

  let canvas = host.querySelector("canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    host.append(canvas);
  }
  let ctx = canvas.getContext ? canvas.getContext("2d") : null;
  canvas.addEventListener("contextlost", (event) => {
    event.preventDefault();
    ctx = null;
  });

  function size() {
    if (!ctx) return false;
    width = Math.round(host.clientWidth);
    height = Math.round(host.clientHeight);
    if (width < 2 || height < 2) return false;
    const ratio = Math.min(2, Number(window.devicePixelRatio) || 1);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 1;
    return true;
  }

  function paint() {
    if (!ctx || !size()) return;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = colors.grid;
    for (let y = GRID / 2; y < height; y += GRID) {
      for (let x = GRID / 2; x < width; x += GRID) ctx.fillRect(x, y, 1, 1);
    }

    for (const trace of SHAPES) {
      const base = trace.y * height;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 4) {
        const wave =
          Math.sin(x * 0.012 * trace.freq + time * 0.9 + trace.phase) * 0.6 +
          Math.sin(x * 0.004 * trace.freq - time * 0.55 + trace.phase * 1.7) * 0.4;
        const y = base + wave * trace.amp * height;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = trace.bright ? "rgba(96,105,116,.5)" : colors.trace;
      ctx.stroke();
    }

    // One accent line, and only while the reading is live.
    if (live) {
      const base = height * (0.5 + Math.sin(time * 0.9) * 0.32);
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = colors.accent;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 4) {
        const y = base + Math.sin(x * 0.02 + time * 1.6) * 6;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function tick(now) {
    frame = 0;
    if (!live || !visible || document.visibilityState !== "visible") return;
    if (now - stamp >= FPS) {
      stamp = now;
      time += 0.05;
      paint();
    }
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    const run = live && visible && document.visibilityState === "visible";
    if (!run && frame) cancelAnimationFrame(frame);
    if (!run) frame = 0;
    else if (!frame) frame = requestAnimationFrame(tick);
  }

  /* Geometry, visibility and lifecycle. Without a canvas the field is simply absent. */
  const watchers = [];
  if (ctx && typeof window.ResizeObserver === "function") {
    const resize = new ResizeObserver(() => paint());
    resize.observe(host);
    watchers.push(() => resize.disconnect());
  } else if (ctx) {
    window.addEventListener("resize", paint);
    watchers.push(() => window.removeEventListener("resize", paint));
  }

  const onVisibility = () => {
    if (document.visibilityState === "visible") paint();
    sync();
  };
  document.addEventListener("visibilitychange", onVisibility);
  watchers.push(() => document.removeEventListener("visibilitychange", onVisibility));

  if (typeof window.IntersectionObserver === "function") {
    const seen = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      sync();
    });
    seen.observe(host);
    watchers.push(() => seen.disconnect());
  } else {
    visible = true;
  }

  paint();

  return {
    setLive(next) {
      live = Boolean(next) && !still;
      sync();
    },
    poke() {
      paint();
    },
    cleanup() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      live = false;
      for (const fn of watchers) fn();
      watchers.length = 0;
      canvas?.remove?.();
      canvas = null;
      ctx = null;
    },
  };
}

export default mountField;
