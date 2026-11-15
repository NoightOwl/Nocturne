import { ATTRIBUTE_MODEL, ATTRIBUTE_ORDER, MODEL_VERSION } from "../data/reference-model.js";
import { BRAND } from "../data/brand.js";
import { buildStablePayload, canonicalJson } from "./canonical.js";
import { computeEntropy } from "./entropy.js";
import { digest, shortHash } from "./hash.js";
import { buildRecommendations, buildSignals } from "../data/recommendations.js";

function orderIndex(id) {
  const index = ATTRIBUTE_ORDER.indexOf(id);
  return index === -1 ? ATTRIBUTE_ORDER.length : index;
}

async function buildSignature(attributes) {
  const payload = buildStablePayload(attributes, ATTRIBUTE_MODEL);
  const serialized = canonicalJson(payload);
  const { algorithm, hash } = await digest(serialized, "SHA-256");
  return {
    version: 1,
    algorithm,
    hash,
    short: shortHash(hash, 16),
    valueCount: Object.keys(payload.values).length,
    payload,
  };
}

/**
 * Turn raw collector output into the report consumed by the results view.
 * @param {Array} attributes
 * @param {{durationMs?: number}} [options]
 */
export async function buildReport(attributes, options = {}) {
  const sorted = [...attributes].sort((a, b) => orderIndex(a.id) - orderIndex(b.id));
  const withBits = sorted.map((attribute) => {
    const spec = ATTRIBUTE_MODEL[attribute.id];
    return {
      ...attribute,
      bits: spec ? { low: spec.low, high: spec.high } : { low: 0, high: 0 },
    };
  });

  const entropy = computeEntropy(withBits);
  const signals = buildSignals(withBits);
  const recommendations = buildRecommendations(withBits, signals, entropy);
  const signature = await buildSignature(withBits);
  const randomized = withBits
    .filter((attribute) => attribute.stability === "randomized")
    .map((attribute) => attribute.label);

  const passCount = signals.filter((signal) => signal.status === "pass").length;
  const warnCount = signals.filter((signal) => signal.status === "warn").length;

  return {
    schemaVersion: 1,
    appVersion: BRAND.version,
    modelVersion: MODEL_VERSION,
    generatedAt: new Date().toISOString(),
    durationMs: options.durationMs ?? null,
    attributes: withBits,
    entropy,
    signals,
    recommendations,
    signature,
    randomized,
    signalSummary: { pass: passCount, warn: warnCount, total: signals.length },
    disclaimer:
      "NOCTURNE is a local reference-model estimate, not a measurement against a live population of browsers. No report data was sent anywhere.",
  };
}
