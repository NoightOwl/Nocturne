# Methodology

NOCTURNE is a local, browser-only exposure estimate. This document explains what it measures, how the number is produced, and what the number does **not** mean.

## 1. What is measured

| Attribute | Source | Stable in signature? | Notes |
|---|---|---|---|
| User agent | `navigator.userAgent` | Yes | Full browser/OS version string. |
| UA Client Hints | `navigator.userAgentData` | Yes | Brands, mobile flag, platform, vendor. |
| Platform | UA-CH platform or `navigator.platform` | Yes | Coarse OS family. |
| Languages | `navigator.languages` / `language` | Yes | Ordered preferences. |
| Time zone | `Intl.DateTimeFormat` | Yes | Zone, offset, locale, calendar, numbering system. |
| Screen | `screen.*`, media queries | Yes | Dimensions, colour depth, display mode, colour scheme. |
| Pixel ratio | `devicePixelRatio` | Yes | Display scaling. |
| Canvas | Two fresh canvases, pixel hash | Only if the two hashes match | A changed hash means the browser is adding noise. |
| WebGL | Renderer, limits, pixel hash | Only if the two hashes match | Uses `WEBGL_debug_renderer_info` when exposed. |
| Audio | Two `OfflineAudioContext` renders | Only if the two hashes match | No audio is played or recorded. |
| Fonts | Width measurement against a curated list | Yes | Heuristic; aliases and metric-compatible fonts can be missed. |
| Hardware | `hardwareConcurrency`, `deviceMemory` | Yes | Coarse CPU/memory hints. |
| Media/codecs | `canPlayType`, `MediaRecorder`, device count | Yes | No permission prompt; labels are not used. |
| Touch/pointer | `maxTouchPoints`, media queries | Yes | Input class. |
| Plugins/PDF | `navigator.plugins`, `pdfViewerEnabled` | Yes | Mostly legacy. |
| Storage | Temporary cookie/localStorage tests, IndexedDB presence | Yes | Probe values are deleted immediately. |
| Privacy signals | GPC, DNT, cookie enabled | Yes | Signals, not guarantees. |
| WebRTC | Local ICE candidates, no STUN | No (volatile) | Raw addresses are not stored; only booleans/types. |
| Viewport | Window dimensions | No (volatile) | Excluded from the signature and estimate. |
| Ad-filter heuristic | Cosmetic bait + local request bait | No (volatile) | Weak and explicitly not a tracker-blocking test. |

## 2. Stability and randomisation

Canvas, WebGL, and audio are sampled twice. If the two hashes differ, the attribute is marked `randomized`. It is removed from the stable signature and contributes **zero stable bits**. This is intentional: a value that changes between visits is not a reliable tracking identifier, even if it is expensive to compute.

Two identical hashes do not prove the surface is impossible to fingerprint; they only mean it was stable during this scan.

## 3. Entropy estimate

Each attribute has a low/high range in [`src/data/reference-model.js`](../src/data/reference-model.js). The ranges are project estimates informed by public fingerprinting research, not measured frequencies from this site's visitors.

For every attribute that is both successfully measured and not randomised:

```text
rawLow  += low
rawHigh += high
```

Then:

```text
lowBits  = round_down_half(rawLow  * 0.5)
highBits = round_up_half(rawHigh * 0.5), clamped to 24
point    = midpoint(lowBits, highBits)
```

The `0.5` correlation discount exists because the signals overlap heavily: UA implies OS, OS implies a GPU family, GPU and fonts correlate, and so on. A naive sum would overstate the identifying information.

The UI shows:

- a point estimate for readability;
- the low–high range;
- `2^low`–`2^high` as a rough “1 in N” range;
- a confidence based on probe coverage (`available / expected`).

### Why the range is wide

Without a live population, there is no defensible single number. A narrow, precise-looking value would be fabricated precision. The range plus confidence is the honest presentation.

### Verdict thresholds

| Point estimate | Label |
|---|---|
| < 12 bits | Relatively common |
| 12–16.9 bits | Somewhat distinctive |
| 17–20.9 bits | Distinctive |
| ≥ 21 bits | Highly distinctive |

These labels are project language, not a scientific classification.

## 4. Signature

Only attributes with `status === "ok"` and `stability === "stable"` are included. Volatile and excluded attributes (`viewport`, `blocker`, WebRTC) are not included. Values are canonicalised by recursively sorting object keys; arrays keep their order (font and extension lists are sorted by their collectors).

The canonical JSON is hashed with SHA-256 via `crypto.subtle`. If SubtleCrypto is unavailable, the app uses FNV-1a-64 and labels it as a non-cryptographic fallback. The signature is a local comparison aid, not an account or identifier.

## 5. Known limitations

- No live population, so no measured uniqueness.
- No HTTP request headers beyond what JavaScript can read.
- No IP address visibility as a website would see it.
- No external STUN, so WebRTC candidates may be incomplete.
- Font detection is heuristic and may miss metric-compatible fonts.
- Codec/device support can change with browser updates and hardware.
- The blocker heuristic cannot prove a blocker is absent, and it is not a tracker-blocking test.
- A deterministic headless browser can produce a stable, unusual signature; that is a property of the environment, not a user.
- The model does not account for every fingerprinting technique, including TLS/JA3/JA4, HTTP header order, favicon caching, or advanced cross-site linking.

## 6. Sources

- Peter Eckersley, “How Unique Is Your Web Browser?”, PETS 2010. <https://coveryourtracks.eff.org/browser-uniqueness.pdf>
- EFF, “Cover Your Tracks — About and Methodology.” <https://coveryourtracks.eff.org/about>
- EFF, “A Primer on Information Theory and Privacy.” <https://www.eff.org/deeplinks/2010/01/primer-information-theory-and-privacy>
- Pierre Laperdrix, Nataliia Bielova, Benoit Baudry, Gildas Avoine, “Browser Fingerprinting: A Survey.” <https://arxiv.org/abs/1905.01051>

The ranges in this project are estimates informed by these sources. They are not the published measurements of those papers and should not be cited as such.
