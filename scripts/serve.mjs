import { createServer } from "node:http";
import { readdir, realpath, readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve symlinks in the root once so containment checks compare real paths.
const ROOT = await realpath(resolve(fileURLToPath(new URL("..", import.meta.url))));
const PORT = Number(process.env.PORT || process.argv[2] || 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

// Files the server is willing to serve, keyed by decoded URL pathname.
// Request data is only ever used as a lookup key, never to build a filesystem
// path (CWE-22 / CWE-73, CodeQL js/path-injection).
const ALLOWED = new Map();

async function addAllowed(urlPath, filePath) {
  const real = await realpath(filePath);
  if (real !== ROOT && !real.startsWith(ROOT + sep)) return;
  const info = await stat(real);
  if (!info.isFile()) return;
  ALLOWED.set(urlPath, real);
}

async function addExisting(urlPath, filePath) {
  try {
    await addAllowed(urlPath, filePath);
  } catch {
    // Optional file or inaccessible directory; skip it.
  }
}

async function addDirectory(directory, extensions) {
  let entries;
  try {
    entries = await readdir(directory, { recursive: true, withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isFile() || !extensions.includes(extname(entry.name).toLowerCase())) continue;
    const parent = entry.parentPath ?? entry.path;
    const full = resolve(parent, entry.name);
    const relative = full.slice(ROOT.length).split(sep).join("/").replace(/^\/+/, "");
    await addExisting(`/${relative}`, full);
  }
}

await addExisting("/", resolve(ROOT, "index.html"));
await addExisting("/404.html", resolve(ROOT, "404.html"));
await addDirectory(resolve(ROOT, "assets"), [".css", ".js", ".svg", ".webp", ".png"]);
await addDirectory(resolve(ROOT, "src"), [".js"]);

function lookupPath(url) {
  let pathname;
  try {
    pathname = new URL(url || "/", "http://127.0.0.1").pathname;
  } catch {
    return undefined;
  }
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return undefined; // Malformed percent-encoding.
  }
  return ALLOWED.get(decoded);
}

const server = createServer(async (request, response) => {
  let file;
  try {
    file = lookupPath(request.url);
  } catch {
    file = undefined;
  }

  if (!file) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  try {
    const body = await readFile(file);
    response.writeHead(200, {
      "Content-Type": MIME[extname(file).toLowerCase()] || "application/octet-stream",
      "Content-Length": body.length,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`NOCTURNE local server: http://127.0.0.1:${PORT}/ (${ALLOWED.size} files)`);
});
