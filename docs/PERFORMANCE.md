# Performance notes

NOCTURNE is designed to feel immediate on a static host, including on slow phones and locked-down browsers.

## Budgets

| Surface | Budget | Current |
|---|---|---|
| Initial route HTML + CSS + JS | ≤ 80 KB gzip | ~24 KB |
| Test/results lazy chunk | ≤ 60 KB gzip | ~31 KB |
| All app JS/CSS | ≤ 200 KB gzip | ~55 KB |
| Raster images loaded by app | 0 | 0 |

The README screenshot is a small WebP in `docs/`; it is not loaded by the app.

Run:

```bash
node scripts/check-budget.mjs
```

The check gzips `INITIAL` (shell, styles, router, home view, reveal, field, device tier, reference data) and `TEST_CHUNK` (scan views, collectors, libs, recommendation data) using Node's built-in `zlib`. New modules must be added to the list, or they escape the budget.

## Techniques

- **No framework or build step.** Vanilla ES modules keep the initial payload small and auditable.
- **Lazy routes.** The scan engine is dynamically imported only when the user starts a scan. The landing page statically imports only the shell, home view, router, store, UI helpers, the reveal and field modules, and the device tier.
- **Prefetch without execution.** The test chunk is warmed on CTA hover/focus or during idle. Prefetching does not run probes.
- **Parallel async probes.** Audio, WebRTC, media, storage, and blocker checks run alongside the sequential visual probes. A slow probe cannot block the rest of the report.
- **Short timeouts.** Every probe has a timeout; a blocked API cannot hang the scan.
- **No webfonts.** System font stack only.
- **No raster images.** Logo, favicon, field, and decoration are inline SVG/CSS. Any future raster screenshot must be WebP.
- **No persistence or service worker.** No cache invalidation complexity; the browser cache handles static files.

## Glass, field, and motion

The design is smoked glass over a faint signal field. Each effect has a cheap path, and the decision is made once per page load by `deviceTier()` in `src/lib/perf.js`, which `src/main.js` applies as `<html data-motion="on|off">`.

`deviceTier()` returns `"low"` when any of these is true:

| Signal | Source | Rationale |
|---|---|---|
| `prefers-reduced-motion: reduce` | `matchMedia` | The user asked for less motion; motion is removed, not just shortened |
| `prefers-reduced-transparency: reduce` | CSS media query | Glass becomes solid via CSS, no JS needed |
| `navigator.connection.saveData` | Network Information API | The user is metering data or CPU |
| `effectiveType` is `slow-2g` or `2g` | Network Information API | A single static paint is the right cost |
| `navigator.deviceMemory` < 2 | Device Memory API | Blur-heavy compositing is expensive |
| `deviceMemory` ≤ 4 and `hardwareConcurrency` ≤ 4 | Device Memory + Hardware Concurrency | Low-end pairing; a single weak signal is not enough |

Missing APIs mean `"high"`: the page must never look broken because a browser hides a hint.

What changes on a low tier:

- **Glass.** `backdrop-filter` is removed by CSS (`html[data-motion="off"]`, `@supports not (backdrop-filter: ...)`, and `prefers-reduced-transparency`), and panels fall back to a solid `--raised` surface.
- **Reveal.** `src/ui/reveal.js` adds `is-in` to everything immediately and never observes.
- **Depth.** No `--depth-y` writes, no scroll listener.
- **Field.** `src/ui/field.js` paints one static frame and stops; the trace never animates.

On a high tier the costs are bounded on purpose:

- **Glass** is one `backdrop-filter` per visible panel. Glass is never nested inside glass, and no glass ancestor carries a transform, opacity, or filter (the only exception is `.reveal` on the glass element itself), which keeps the blur from re-compositing every frame.
- **Reveal** is `transform` and `opacity` only, one class added once per element, then the element is unobserved. Stagger lives in CSS (`:nth-child` delays), so no inline styles are written.
- **Depth** uses one passive `scroll` listener and one `requestAnimationFrame` at a time, samples rects once per frame, writes a single custom property (`--depth-y`, clamped to ±8px), and detaches the listener when no depth target is on screen or the tab is hidden.
- **Field** is a 2D canvas, device pixel ratio capped at 2. It paints one frame at mount, then rAF only while `live && intersecting && document.visibilityState === "visible"`, capped at ~30 fps. A `ResizeObserver` repaints on size change. No WebGL.
- **The page ground** (`.page-ground`) is two fixed decorative layers painted once by the compositor; it never scrolls with content and cannot blur anything by itself.

## Measuring

Open DevTools → Network with cache disabled:

1. Load `#/` and confirm only same-origin files are requested.
2. Check transfer sizes against the table.
3. Start a scan and confirm the module chunk is requested once.
4. Confirm no requests occur after the scan begins.
5. In the Rendering panel, enable **Paint flashing** and scroll: only revealed elements should repaint, and nothing should repaint continuously once a section is settled.
6. Emulate **prefers-reduced-motion: reduce** (Rendering panel) and confirm panels turn solid and nothing animates.

## Screenshot helper

`scripts/shot.mjs` captures an exact-viewport full-page PNG and reports horizontal overflow, non-local requests, and console or HTTP errors, then exits non-zero on problems. It needs a headless Chrome with a debugging port:

```bash
chrome --headless --remote-debugging-port=9333 --user-data-dir=%TEMP%\nocturne-cdp about:blank
node scripts/shot.mjs "http://127.0.0.1:4173/#/" 1440 1000 home.png 1500
node scripts/shot.mjs "http://127.0.0.1:4173/#/test" 390 844 scan.png 600 --mobile
```

Note that headless Chrome reports `prefers-reduced-motion: reduce` by default in some builds, so audited runs may show the low-tier (static) variant. Use CDP `Emulation.setEmulatedMedia` to capture the animated variant.

The report displays its own scan duration using `performance.mark`/`measure`.
