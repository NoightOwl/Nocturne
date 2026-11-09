# Performance notes

NOCTURNE is designed to feel immediate on a static host.

## Budgets

| Surface | Budget | Current |
|---|---|---|
| Initial route HTML + CSS + JS | ≤ 80 KB gzip | ~18 KB |
| Test/results lazy chunk | ≤ 60 KB gzip | ~30 KB |
| All app JS/CSS | ≤ 160 KB gzip | ~48 KB |
| Raster images loaded by app | 0 | 0 |

The README screenshot is a 48 KB WebP in `docs/`; it is not loaded by the app.

Run:

```bash
node scripts/check-budget.mjs
```

The check gzips the initial route and scan modules using Node's built-in `zlib`.

## Techniques

- **No framework or build step.** Vanilla ES modules keep the initial payload small and auditable.
- **Lazy routes.** The scan engine is dynamically imported only when the user starts a scan. The landing page statically imports only the shell, home view, router, store, and UI helpers.
- **Prefetch without execution.** The test chunk is warmed on CTA hover/focus or during idle. Prefetching does not run probes.
- **Parallel async probes.** Audio, WebRTC, media, storage, and blocker checks run alongside the sequential visual probes. A slow probe cannot block the rest of the report.
- **Short timeouts.** Every probe has a timeout; a blocked API cannot hang the scan.
- **No webfonts.** System font stack only.
- **No raster images.** Logo, favicon, hero art, and decoration are inline SVG/CSS. SVG is smaller and sharper than WebP for vector marks. Any future raster screenshot must be WebP.
- **No expensive effects.** No large backdrop filters, blur layers, or canvas animation loops. Motion uses transform/opacity and respects `prefers-reduced-motion`.
- **No persistence or service worker.** No cache invalidation complexity; the browser cache handles static files.

## Measuring

Open DevTools → Network with cache disabled:

1. Load `#/` and confirm only same-origin files are requested.
2. Check transfer sizes against the table.
3. Start a scan and confirm the module chunk is requested once.
4. Confirm no requests occur after the scan begins.
5. Use the Performance panel to confirm the main thread is not blocked for long tasks.

The report displays its own scan duration using `performance.mark`/`measure`.
