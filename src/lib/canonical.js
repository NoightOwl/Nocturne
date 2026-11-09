/** Deterministic JSON serialisation for fingerprint signatures. */

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isPlainObject(value)) {
    const sorted = {};
    for (const key of Object.keys(value).sort()) sorted[key] = canonicalize(value[key]);
    return sorted;
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

/**
 * Build the payload that is actually hashed. Only stable, successfully
 * measured attributes are included. Volatile values and privacy heuristics are
 * excluded so the signature describes the browser, not the current window.
 */
export function buildStablePayload(attributes, model) {
  const values = {};
  for (const attribute of attributes) {
    const spec = model[attribute.id];
    if (!spec || spec.volatile || spec.excludeFromSignature) continue;
    if (attribute.status !== "ok" || attribute.stability !== "stable") continue;
    values[attribute.id] = attribute.value;
  }
  return {
    v: 1,
    values: canonicalize(values),
  };
}
