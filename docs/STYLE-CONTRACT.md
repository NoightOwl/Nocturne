# NOCTURNE visual contract — "Observed smoke"

Every view module emits the markup this file describes. `assets/styles.css` is the only place
these classes are styled. Read this before editing any view.

## Rules

1. **Only classes in this file.** If you need a new class, message the Lead; do not add CSS.
2. **No inline `style` attributes.** The CSP is `style-src 'self'`, so an inline style is a
   console violation and will fail verification.
3. **No external assets, fonts, images or network calls.** `connect-src 'none'`.
4. **Motion is only `transform` and `opacity`,** and it is already driven by `.reveal` and
   `[data-depth]`. Never add `animation`, infinite loops or transitions of layout properties.
5. **No emoji.** Icons are the existing 16px line SVGs from `src/ui.js` (`ARROW_ICON`,
   `LOCK_ICON`, `GITHUB_ICON`) or nothing.
6. **Sentence case.** No uppercase tracked labels (`.eyebrow`/`.label` render lowercase-type
   sentence case at 13px; write `Exposure report`, not `EXPOSURE REPORT`).
7. **No trailing periods** on headings, labels, buttons, badges or captions. Full sentences in
   paragraphs keep their periods.
8. **Numbers:** one format, tabular. Use `.mono` or `.num` on figures. Bits are `16.8`, `0.5–1.5`,
   never `16.80`.
9. **Anchors that scroll:** `href="#how"` would fight the hash router. Use
   `<a class="button button-ghost" href="#/" data-scroll="how">` and an element with `id="how"`.
10. **Preserve these hooks** (tests and behaviour depend on them):
    `.signal-row`, `.attribute-details`, `.recommendation`, `[data-score-point]`,
    `[data-signature]`, `[data-nav]`, `[data-prefetch]`, `[data-scroll]`, `[data-brand-*]`,
    `[data-version]`, `[data-license]`, `[data-year]`, `[data-repo-link]`, `[data-eff-link]`.

## Palette (CSS custom properties)

| Token | Use |
| --- | --- |
| `--page` `#131518` | page |
| `--raised` `#1a1d21`, `--raised-2` `#22262b` | solid surfaces, pressed states |
| `--text` `#e9ebee` | headings, primary text |
| `--text-2` `#adb3bb` | body, secondary |
| `--text-muted` `#868d96` | meta, captions only |
| `--accent` `#e06a2c` | measured/live only: primary button, the bits point, active state |
| `--accent-text` `#f08a52` | accent used as text |
| `--stable` `#7fa08a`, `--exposed` `#d0604f` | stable / exposed readings |
| `--hairline`, `--hairline-strong` | borders |
| `--ease`, `--dur-fast` 120ms, `--dur-med` 160ms, `--dur-enter` 420ms | motion |

Accent is rare: at most one or two accent marks per screen besides the primary button.

## Glass

| Class | Use |
| --- | --- |
| `class="glass"` | standard card (12px radius, blur 18px) |
| `class="glass panel"` | large panel (16px radius) |
| `class="glass dense"` | the hero instrument panel and the scan card |
| `class="glass light"` | quiet blocks (contents lists, notes) |
| `class="glass-row"` | one row inside a glass card; has hover wash |
| `class="glass-row is-accent"` | the one live/measured row |

Rules of glass:
- Glass must sit over something (field canvas or page). Never nest a glass element inside a
  glass element; use `.glass-row` or a hairline `<hr>`-like `<div class="rule">` instead.
- Do **not** put `transform`, `filter` or `opacity` on an ancestor of glass. `.reveal` is the
  one exception and is allowed on a glass element itself, never on its parent wrapper.
- Nested radius: rows inside a `.glass` card use `--radius-row` (8px), automatically.
- No gradients anywhere: not on surfaces, text, buttons, borders or the page itself. The only
  drawing behind glass is the field canvas in the hero, painted in flat ink colours.

## Layout

| Class | Use |
| --- | --- |
| `.shell` | page gutter (max 1180px) |
| `.section` | vertical band, 96px (64px mobile) |
| `.section-heading` | intro block: optional `.eyebrow`, `h2`, one `p` |
| `.two-col` | 2-column split that collapses to one column on mobile |
| `.hero` | split hero (see below) |
| `.reveal` | add to blocks that enter once |
| `.reveal-stagger` on a parent with `.reveal` children | 40ms stagger, max 240ms |
| `[data-depth]` | max one per page; drifts ≤ 8px with scroll |

Headline sizes come from `h1`/`h2`/`h3` globally. Do not restyle them inline.

## Components

### Hero (home only)
```
<section class="hero shell">
  <div class="hero-copy"> ... </div>
  <div class="hero-panel glass dense panel" data-field data-depth> ... </div>
</section>
```

### Instrument panel (hero)
```
<div class="hero-panel glass dense panel" data-field data-depth>
  <div class="field-host" aria-hidden="true"></div>
  <div class="panel-body">
    <div class="panel-head">
      <span class="label">Signature preview</span>
      <span class="panel-state"><span class="signal-dot on"></span>Live</span>
    </div>
    <p class="panel-figure mono"><span data-panel-bits>—</span><span class="panel-unit">bits</span></p>
    <p class="panel-note">Measured after you run a scan</p>
    <div class="readout-list">
      <div class="readout"><span class="label">Screen</span><span class="mono">…</span></div>
      ...
    </div>
  </div>
</div>
```
The panel shows only values that are already true on page load (screen, pixel ratio, time zone,
threads, language, signal count). The bits figure stays `—` until a scan exists: never invent a
score on the landing page.

### Rows / lists
```
<div class="row-list">
  <div class="glass-row row-row"> <span>…</span> <span class="mono">…</span> </div>
</div>
```

### Score ruler (results)
```
<div class="ruler-card glass panel">
  <p class="ruler-figure"><span data-score-point class="mono">16.8</span><span class="ruler-unit">bits</span></p>
  <div class="ruler"><span class="ruler-range" ...></span><span class="ruler-point" ...></span></div>
  <div class="ruler-scale mono"><span>0</span><span>8</span><span>16</span><span>24</span></div>
</div>
```
Widths must come from classes (`.is-w-…`) or be set by JS as a CSS custom property, never a
style attribute.

### Signature plate (results)
```
<div class="signature glass panel">
  <code data-signature class="signature-hash mono">…</code>
  <div class="signature-actions"> … </div>
</div>
```

### Steps (home)
```
<ol class="steps reveal-stagger">
  <li class="step reveal"><span class="step-index mono">01</span><h3>Collect</h3><p>…</p></li>
</ol>
```

### Notes / callouts
```
<aside class="note"> <h3>…</h3> <p>…</p> </aside>
```
`.note` is a flat `--raised` surface, not glass: a note usually sits inside a `.doc-section`,
which is itself a `.reveal` (opacity/transform), and glass may not be nested inside glass or
under a transformed ancestor.

### Error pages
```
<section class="error-page shell glass light">
  <p class="label">Route not found</p>
  <h1>That page is not here</h1>
  <p>…</p>
  <a class="button button-primary" href="#/test">Run local scan</a>
</section>
```

### Buttons
`.button.button-primary` (one per screen), `.button.button-ghost`, `.button-small`,
`.text-link`. Hover, press and focus states are already styled.
