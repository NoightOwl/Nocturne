import {
  ATTRIBUTE_MODEL,
  CORRELATION_FACTOR,
  MAX_BITS,
  MODEL_VERSION,
} from "../data/reference-model.js";
import { confidenceFor, formatOneIn, verdictFor } from "./format.js";

function roundDownHalf(value) {
  return Math.floor(value * 2) / 2;
}

function roundUpHalf(value) {
  return Math.ceil(value * 2) / 2;
}

/**
 * Estimate an identifying-information range from the measured attributes.
 *
 * This is an additive, correlation-discounted reference model. It is not a
 * population measurement and must always be labelled as an estimate.
 *
 * @param {Array<{id:string,status:string,stability:string}>} attributes
 */
export function computeEntropy(attributes) {
  const byId = new Map(attributes.map((attribute) => [attribute.id, attribute]));
  let rawLow = 0;
  let rawHigh = 0;
  let expected = 0;
  let available = 0;
  const contributions = [];

  for (const [id, spec] of Object.entries(ATTRIBUTE_MODEL)) {
    if (spec.volatile || spec.excludeFromEntropy) continue;
    expected += 1;

    const attribute = byId.get(id);
    const randomized = attribute?.stability === "randomized";
    const measured = attribute?.status === "ok";

    if (!measured || randomized) {
      contributions.push({
        id,
        low: 0,
        high: 0,
        reason: randomized ? "Randomised between samples" : "Not measured",
      });
      continue;
    }

    available += 1;
    rawLow += spec.low;
    rawHigh += spec.high;
    contributions.push({ id, low: spec.low, high: spec.high, reason: "" });
  }

  const low = Math.min(MAX_BITS, roundDownHalf(rawLow * CORRELATION_FACTOR));
  const high = Math.max(low, Math.min(MAX_BITS, roundUpHalf(rawHigh * CORRELATION_FACTOR)));
  const point = Math.round(((low + high) / 2) * 10) / 10;
  const coverage = expected === 0 ? 0 : available / expected;
  const confidence = confidenceFor(coverage);
  const verdict = verdictFor(point);

  return {
    modelVersion: MODEL_VERSION,
    low,
    high,
    point,
    oneInLow: 2 ** low,
    oneInHigh: 2 ** high,
    oneInPoint: 2 ** point,
    oneInLabel: `${formatOneIn(2 ** low)} – ${formatOneIn(2 ** high)}`,
    coverage,
    confidence,
    verdict,
    contributions,
    available,
    expected,
  };
}

export function contributionFor(id) {
  return ATTRIBUTE_MODEL[id] ? { low: ATTRIBUTE_MODEL[id].low, high: ATTRIBUTE_MODEL[id].high } : { low: 0, high: 0 };
}
