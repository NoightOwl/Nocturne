# Contributing

Thanks for helping make browser tracking more legible.

## Privacy invariants

These are non-negotiable:

1. **No outbound requests.** Do not add `fetch`, `XMLHttpRequest`, `sendBeacon`, WebSocket, remote scripts, remote fonts, CDNs, or third-party images. The CSP intentionally sets `connect-src 'none'`.
2. **No analytics or advertising.** No accounts, telemetry, error reporting, or tracking pixels.
3. **No persistent report storage.** Reports live in memory. Do not add localStorage/sessionStorage report caches, service workers, or cookies that survive the probe.
4. **No permission prompts.** Do not call `getUserMedia`, geolocation, notifications, clipboard read, or other permission-gated APIs without an explicit design discussion.
5. **No external assets.** The app loads zero raster images. Use inline SVG/CSS. Any future raster asset must be WebP and documented.
6. **Escape collected values.** Insert browser-derived values with `textContent` or DOM APIs, never into `innerHTML`.
7. **Do not overclaim.** The estimate is a reference model, not a live population score. Keep the word “estimate” visible.

## Development

```bash
node scripts/serve.mjs
npm test
npm run check:budget
```

No dependencies are required. Keep it that way unless there is a compelling,
documented reason.

## Adding or changing a probe

- Add a module under `src/collectors/` with `id`, `label`, `category`, `group`, `timeoutMs`, and `collect()`.
- Return an array of `result(...)` objects from `src/collectors/utils.js`.
- Use a timeout-safe implementation. Never let a blocked API hang the scan.
- Clean up canvases, audio contexts, iframes, and temporary DOM nodes.
- Add the attribute to `ATTRIBUTE_MODEL` with a documented low/high range and a plain-language `why`.
- Add it to `ATTRIBUTE_ORDER`.
- Add a unit test if the probe has pure logic.
- Update `docs/METHODOLOGY.md`.

## Style

- Vanilla ES modules, modern browser APIs, no framework.
- Keep functions small and side effects explicit.
- Prefer semantic HTML and accessible names.
- Respect `prefers-reduced-motion`.
- Do not introduce inline event handlers or inline `<style>` blocks.
- Keep the initial route lazy and within the performance budget.

## Reporting a security issue

See [SECURITY.md](SECURITY.md). Please do not include a real fingerprint report or personal data in a public issue.
