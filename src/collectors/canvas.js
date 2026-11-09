import { hashPixels, sha256Hex, shortHash } from "../lib/hash.js";
import { result } from "./utils.js";

const WIDTH = 320;
const HEIGHT = 100;

function draw(ctx) {
  ctx.fillStyle = "#f4f7fb";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, "#0b2a4a");
  gradient.addColorStop(0.45, "#38bdf8");
  gradient.addColorStop(1, "#fb7185");
  ctx.fillStyle = gradient;
  ctx.fillRect(8, 8, WIDTH - 16, HEIGHT - 16);

  ctx.globalAlpha = 0.86;
  ctx.fillStyle = "#040a14";
  ctx.font = '600 22px "Arial", "Helvetica", sans-serif';
  ctx.fillText("NOCTURNE // 0123456789", 16, 40);
  ctx.font = 'italic 15px "Georgia", serif';
  ctx.fillText("fingerprint surface λ∑≈", 18, 66);

  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(265, 48, 24, 0, Math.PI * 2);
  ctx.fillStyle = "#fbbf24";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(265, 48, 16, 0, Math.PI * 2);
  ctx.fillStyle = "#040a14";
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "#2dd4bf";
  ctx.beginPath();
  ctx.moveTo(20, 80);
  ctx.bezierCurveTo(90, 20, 180, 120, 230, 78);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  for (let i = 0; i < 12; i += 1) {
    ctx.fillRect(30 + i * 21, 86, 9, 3);
  }
}

async function sample() {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    const error = new Error("Canvas 2D context unavailable");
    error.name = "NotSupportedError";
    throw error;
  }

  draw(ctx);

  try {
    const image = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    return { hash: await hashPixels(image.data, WIDTH, HEIGHT), method: "pixels" };
  } catch {
    const dataUrl = canvas.toDataURL("image/png");
    return { hash: await sha256Hex(`data-url:${dataUrl}`), method: "data-url" };
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

export default {
  id: "canvas",
  label: "Canvas rendering",
  category: "Rendering",
  group: "visual",
  timeoutMs: 2200,
  async collect() {
    try {
      const first = await sample();
      const second = await sample();
      const randomized = first.hash !== second.hash;
      return [
        result(
          "canvas",
          "Canvas fingerprint",
          "Rendering",
          { hash: first.hash, method: first.method },
          shortHash(first.hash, 20),
          {
            stability: randomized ? "randomized" : "stable",
            note: randomized
              ? "The canvas hash changed between two samples, so a tracker cannot rely on a stable visual hash."
              : "Two independent renderings produced the same canvas hash. Pixel readback is stable.",
          },
        ),
      ];
    } catch (error) {
      return [
        result("canvas", "Canvas fingerprint", "Rendering", null, "Canvas readback blocked", {
          status: "blocked",
          stability: "unknown",
          note: error?.name === "NotSupportedError" ? "This browser does not expose a 2D canvas context." : "The browser blocked canvas pixel readback.",
        }),
      ];
    }
  },
};
