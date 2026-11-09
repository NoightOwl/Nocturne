# Deploy on GitHub Pages

NOCTURNE is a zero-build static site. GitHub Pages can serve the repository root directly.

## Steps

1. Create a **public** GitHub repository. Suggested name: `nocturne`.
2. From this directory:

   ```bash
   git init
   git add .
   git commit -m "Initial NOCTURNE build"
   git branch -M main
   git remote add origin https://github.com/<your-username>/nocturne.git
   git push -u origin main
   ```

3. Open the repository on GitHub: **Settings → Pages**.
4. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/ (root)**
5. Save. GitHub will publish at:

   ```text
   https://<your-username>.github.io/nocturne/
   ```

No custom domain, CNAME, build step, GitHub Actions, database, or server is required.

## After publishing

- Open the Pages URL and verify the landing page, `#/test`, `#/results`, `#/learn`, `#/about`, and `#/privacy`.
- Set `repoUrl` in `src/data/brand.js` to `https://github.com/<your-username>/nocturne` to show the source link in the UI.
- If you rename the repository, the Pages URL changes to match; no app code needs to change because all paths are relative.
- GitHub Pages serves HTTPS automatically, which is required for `crypto.subtle`.
- If you add a custom domain later, add a `CNAME` file. That is optional and outside the default deployment.

## Cache and headers

GitHub Pages does not allow custom response headers. The app avoids relying on special headers. The CSP is delivered through a `<meta>` tag in `index.html`; `connect-src 'none'` blocks application-level outbound connections.

## Troubleshooting

- **404 after refresh on a subpage:** use hash routes (`#/test`), not path routes. The app intentionally uses hash routing so GitHub Pages needs no rewrite rules.
- **Blank page:** confirm the files were pushed to the branch/root selected in Pages, and that `index.html` is at the repository root.
- **Crypto fallback warning:** ensure the site is loaded over HTTPS or localhost.
- **Fonts or canvas unavailable:** this is a normal privacy-browser result; the report will mark the probe unavailable or randomised.
