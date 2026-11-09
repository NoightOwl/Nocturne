import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

const INITIAL = [
  "index.html",
  "assets/styles.css",
  "src/main.js",
  "src/router.js",
  "src/store.js",
  "src/ui.js",
  "src/views/home.js",
  "src/data/brand.js",
  "src/data/reference-model.js",
];

const TEST_CHUNK = [
  "src/views/test.js",
  "src/views/results.js",
  "src/collectors/index.js",
  "src/collectors/browser.js",
  "src/collectors/screen.js",
  "src/collectors/locale.js",
  "src/collectors/privacy.js",
  "src/collectors/storage.js",
  "src/collectors/fonts.js",
  "src/collectors/canvas.js",
  "src/collectors/webgl.js",
  "src/collectors/audio.js",
  "src/collectors/media.js",
  "src/collectors/webrtc.js",
  "src/collectors/blocker.js",
  "src/collectors/utils.js",
  "src/lib/hash.js",
  "src/lib/canonical.js",
  "src/lib/entropy.js",
  "src/lib/format.js",
  "src/lib/timeout.js",
  "src/lib/dom.js",
  "src/lib/perf.js",
  "src/lib/report.js",
  "src/data/fonts.js",
  "src/data/recommendations.js",
];

async function gzipBytes(files) {
  let total = 0;
  const details = [];
  for (const file of files) {
    try {
      const buffer = await readFile(resolve(ROOT, file));
      const size = gzipSync(buffer).length;
      total += size;
      details.push({ file, size });
    } catch {
      // A missing optional file is ignored; syntax tests cover the rest.
    }
  }
  return { total, details };
}

export async function checkBudgets() {
  const initial = await gzipBytes(INITIAL);
  const test = await gzipBytes(TEST_CHUNK);
  const all = await gzipBytes([...new Set([...INITIAL, ...TEST_CHUNK])]);
  const failures = [];
  if (initial.total > 80 * 1024) failures.push(`Initial route is ${initial.total} bytes gzip (limit 80 KB)`);
  if (test.total > 60 * 1024) failures.push(`Test/results chunk is ${test.total} bytes gzip (limit 60 KB)`);
  if (all.total > 160 * 1024) failures.push(`All app JS/CSS is ${all.total} bytes gzip (limit 160 KB)`);
  return { initial, test, all, failures };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const result = await checkBudgets();
  console.log(`Initial route: ${(result.initial.total / 1024).toFixed(1)} KB gzip`);
  console.log(`Test/results chunk: ${(result.test.total / 1024).toFixed(1)} KB gzip`);
  console.log(`All app JS/CSS: ${(result.all.total / 1024).toFixed(1)} KB gzip`);
  if (result.failures.length) {
    for (const failure of result.failures) console.error(`BUDGET FAIL: ${failure}`);
    process.exitCode = 1;
  } else {
    console.log("Performance budgets passed.");
  }
}
