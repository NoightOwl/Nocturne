import { hashSamples, shortHash } from "../lib/hash.js";
import { result } from "./utils.js";

async function render() {
  const OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OfflineContext) {
    const error = new Error("OfflineAudioContext unavailable");
    error.name = "NotSupportedError";
    throw error;
  }

  const sampleRate = 44100;
  const context = new OfflineContext(1, Math.round(sampleRate * 0.45), sampleRate);
  const oscillator = context.createOscillator();
  const compressor = context.createDynamicsCompressor();
  const gain = context.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.value = 10_000;
  gain.gain.value = 0.08;
  compressor.threshold.value = -50;
  compressor.knee.value = 40;
  compressor.ratio.value = 12;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;

  oscillator.connect(compressor);
  compressor.connect(gain);
  gain.connect(context.destination);
  oscillator.start(0);
  oscillator.stop(0.4);

  const buffer = await context.startRendering();
  const samples = buffer.getChannelData(0);
  const hash = await hashSamples(samples, sampleRate);
  return { hash, sampleRate };
}

export default {
  id: "audio",
  label: "Audio processing",
  category: "Rendering",
  group: "async",
  timeoutMs: 3500,
  async collect() {
    try {
      const first = await render();
      const second = await render();
      const randomized = first.hash !== second.hash;
      return [
        result(
          "audio",
          "Audio fingerprint",
          "Rendering",
          first,
          shortHash(first.hash, 20),
          {
            stability: randomized ? "randomized" : "stable",
            note: randomized
              ? "The audio hash changed between samples, so the signal is not stable."
              : "Two offline audio renders produced the same hash. The processing pipeline is readable and stable.",
          },
        ),
      ];
    } catch (error) {
      return [
        result("audio", "Audio fingerprint", "Rendering", null, "Audio fingerprint blocked", {
          status: "blocked",
          stability: "unknown",
          note:
            error?.name === "NotSupportedError"
              ? "This browser does not expose an offline audio context."
              : "The browser blocked offline audio rendering.",
        }),
      ];
    }
  },
};
