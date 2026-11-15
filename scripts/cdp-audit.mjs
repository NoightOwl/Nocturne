/**
 * Optional browser audit helper for local development.
 *
 * 1. Start Chrome with a debugging port:
 *    chrome --headless=new --no-sandbox --remote-debugging-port=9333 \
 *      --user-data-dir=/tmp/nocturne-cdp about:blank
 * 2. Run:
 *    node scripts/cdp-audit.mjs http://127.0.0.1:4173/#/ 390 844 out.png
 *
 * It emulates a mobile viewport, waits for the page, captures a screenshot,
 * prints layout metrics, and lists any non-local requests or console errors.
 * This script is not part of the shipped app.
 */
import { writeFile } from "node:fs/promises";

const port = Number(process.env.CDP_PORT || 9333);
const url = process.argv[2] || "http://127.0.0.1:4173/#/";
const width = Number(process.argv[3] || 390);
const height = Number(process.argv[4] || 844);
const output = process.argv[5] || "cdp-shot.png";

const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = targets.find((target) => target.type === "page");
if (!page) throw new Error("No page target. Start Chrome with --remote-debugging-port.");

const socket = new WebSocket(page.webSocketDebuggerUrl);
let nextId = 0;
const pending = new Map();
const errors = [];
const external = [];

function send(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
  });
}

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
    return;
  }
  if (message.method === "Runtime.exceptionThrown") {
    errors.push(message.params.exceptionDetails?.text || "Uncaught exception");
  }
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
    errors.push(message.params.args?.map((arg) => arg.value ?? arg.description).join(" "));
  }
  if (message.method === "Network.requestWillBeSent") {
    const requestUrl = message.params.request.url;
    if (!requestUrl.startsWith("http://127.0.0.1:4173/") && !requestUrl.startsWith("data:")) {
      external.push(requestUrl);
    }
  }
};

await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
});

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Log.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width,
  height,
  deviceScaleFactor: 1,
  mobile: true,
});
await send("Page.navigate", { url });
await new Promise((resolve) => setTimeout(resolve, 5000));

const metrics = await send("Runtime.evaluate", {
  expression:
    "JSON.stringify({innerWidth, innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, title: document.title, hash: location.hash})",
  returnByValue: true,
});
const shot = await send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: true,
  fromSurface: true,
});
await writeFile(output, Buffer.from(shot.data, "base64"));

console.log(metrics.result.value);
console.log(`screenshot: ${output}`);
console.log(`external requests: ${external.length ? external.join(", ") : "none"}`);
console.log(`console errors: ${errors.length ? errors.join(" | ") : "none"}`);
socket.close();
