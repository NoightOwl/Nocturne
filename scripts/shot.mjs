/**
 * Capture helper for local QA (not part of the app, not used by GitHub Pages).
 *
 *   node scripts/shot.mjs <url> <w> <h> <out.png> [waitMs] [--keep] [--mobile]
 *
 * Needs a headless Chrome started with --remote-debugging-port (CDP_PORT,
 * default 9333), for example:
 *   chrome --headless --remote-debugging-port=9333 --user-data-dir=%TEMP%\nocturne-cdp about:blank
 *
 * Loads the URL at an exact viewport, waits `waitMs`, then writes a full-page
 * PNG and prints layout metrics, non-local requests and console/page errors.
 * Exits 1 if the page reported errors or overflowed horizontally. `--keep`
 * skips the reload and captures the page as it currently is.
 */
import { writeFile } from "node:fs/promises";

const port = Number(process.env.CDP_PORT || 9333);
const [url, w, h, output, waitArg] = process.argv.slice(2);
if (!url || !output) {
  console.error("usage: node scripts/shot.mjs <url> <w> <h> <out.png> [waitMs] [--keep] [--mobile]");
  process.exit(2);
}
const width = Number(w || 1440);
const height = Number(h || 900);
const waitMs = Number(waitArg && /^\d+$/.test(waitArg) ? waitArg : 5000);
const keep = process.argv.includes("--keep");
const mobile = process.argv.includes("--mobile");

let targets;
try {
  targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
} catch {
  console.error(`No Chrome debugging port on ${port}. Start one, for example:`);
  console.error(`  chrome --headless --remote-debugging-port=${port} --user-data-dir=%TEMP%\\nocturne-cdp about:blank`);
  process.exit(2);
}
// Work in a tab of our own: retarget this CDP session at a fresh tab so the
// network log and viewport belong to this capture alone.
const pages = targets.filter((target) => target.type === "page");
const created = await (
  await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })
).json();
const page = created || pages[0];
if (!page) throw new Error("No page target. Start Chrome with --remote-debugging-port.");
const socket = new WebSocket(page.webSocketDebuggerUrl);
let nextId = 0;
const pending = new Map();
const errors = [];
const external = [];

function send(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

let origin = "";
try {
  origin = new URL(url).origin;
} catch {
  origin = "";
}
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(`${message.error.message} (${message.error.code})`));
    else resolve(message.result);
    return;
  }
  if (message.method === "Runtime.exceptionThrown") {
    const details = message.params.exceptionDetails;
    errors.push(details.exception?.description?.slice(0, 300) || details.text);
  }
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
    errors.push(message.params.args?.map((arg) => arg.value ?? arg.description).join(" "));
  }
  if (message.method === "Network.responseReceived" && message.params.response.status >= 400) {
    errors.push(`HTTP ${message.params.response.status} ${message.params.response.url}`);
  }
  if (message.method === "Network.requestWillBeSent") {
    const requestUrl = message.params.request.url;
    if (!requestUrl.startsWith(`${origin}/`) && !requestUrl.startsWith("data:") && !requestUrl.startsWith("about:")) {
      external.push(requestUrl);
    }
  }
};

await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
});
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// A killed socket leaves sends pending forever; fail loudly instead of hanging.
setTimeout(() => {
  console.error("CDP timeout: the page target did not respond (another client may have taken it).");
  process.exit(1);
}, waitMs + 30000).unref();

try {
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  if (!keep) {
    await send("Page.navigate", { url: "about:blank" });
    await sleep(120);
    await send("Page.navigate", { url });
  }
  await sleep(waitMs);

  const timeOrigin = Date.now();
  for (;;) {
    let metrics;
    try {
      metrics = await send("Runtime.evaluate", {
        expression:
          "JSON.stringify({innerWidth, innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, title: document.title, hash: location.hash})",
        returnByValue: true,
      });
      const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, fromSurface: true });
      if (shot?.data) await writeFile(output, Buffer.from(shot.data, "base64"));
    } catch (error) {
      console.error(`capture error: ${error.message}`);
      process.exitCode = 1;
      break;
    }
    const layout = JSON.parse(metrics.result.value || "{}");
    // Another client driving this same tab can steal layout mid-capture; retry.
    if (layout.innerWidth === width && layout.scrollHeight > 0) {
      console.log(metrics.result.value);
      console.log(`screenshot: ${output}`);
      console.log(`external: ${external.length ? external.join(", ") : "none"}`);
      console.log(`console errors: ${errors.length ? errors.join(" | ") : "none"}`);
      if (layout.scrollWidth > width) {
        console.log(`OVERFLOW: scrollWidth ${layout.scrollWidth} > ${width}`);
        process.exitCode = 1;
      } else if (errors.length) process.exitCode = 1;
      break;
    }
    if (Date.now() - timeOrigin > 8000) {
      console.error("capture failed: viewport kept being changed by another client");
      process.exitCode = 1;
      break;
    }
    await sleep(400);
  }
} finally {
  socket.close();
  if (created?.id) await fetch(`http://127.0.0.1:${port}/json/close/${created.id}`).catch(() => {});
}
