# Security policy

NOCTURNE is a static, client-side site. It has no server, database, accounts, or
report upload. The primary security concerns are:

- injection through browser-derived strings,
- unexpected network exfiltration,
- supply-chain additions,
- misleading privacy claims.

## Reporting

If you find a vulnerability, please open a private security advisory on the
GitHub repository rather than a public issue. Include:

- a description of the issue,
- reproduction steps,
- the browser and version,
- whether any data could leave the browser.

Do not include a real fingerprint report, IP address, or other personal data.

## Scope

In scope:

- script injection or DOM XSS,
- bypass of the no-network design,
- CSP or storage leaks,
- data exfiltration through a dependency or probe,
- privacy claim mismatches.

Out of scope:

- the host's own request logs (GitHub Pages),
- browser-level fingerprinting performed by the browser itself,
- availability of third-party links,
- the inherent limits of a local estimate.

## Design guarantees

- No backend or API keys.
- No third-party runtime dependencies.
- CSP blocks outbound connections (`connect-src 'none'`).
- Reports are in-memory by default.
- Temporary cookie/storage probes are deleted immediately.
- Browser-derived values are rendered with `textContent`.
