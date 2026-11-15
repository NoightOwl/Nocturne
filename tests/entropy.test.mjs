import test from "node:test";
import assert from "node:assert/strict";
import { ATTRIBUTE_MODEL } from "../src/data/reference-model.js";
import { computeEntropy } from "../src/lib/entropy.js";

function attributes(overrides = {}) {
  return Object.keys(ATTRIBUTE_MODEL).map((id) => ({
    id,
    status: "ok",
    stability: "stable",
    ...(overrides[id] || {}),
  }));
}

test("full stable surface produces a bounded range with full coverage", () => {
  const entropy = computeEntropy(attributes());
  assert.equal(entropy.available, entropy.expected);
  assert.equal(entropy.coverage, 1);
  assert.ok(entropy.low >= 0);
  assert.ok(entropy.high <= 24);
  assert.ok(entropy.high >= entropy.low);
  assert.ok(entropy.point >= entropy.low && entropy.point <= entropy.high);
  assert.equal(entropy.confidence.label, "High confidence");
  assert.match(entropy.oneInLabel, /^1 in /);
});

test("randomised surfaces do not contribute stable bits", () => {
  const stable = computeEntropy(attributes());
  const randomised = computeEntropy(
    attributes({
      canvas: { stability: "randomized" },
      webgl: { stability: "randomized" },
      audio: { stability: "randomized" },
    }),
  );
  assert.ok(randomised.high < stable.high);
  assert.ok(randomised.low <= stable.low);
  const canvas = randomised.contributions.find((item) => item.id === "canvas");
  assert.equal(canvas.high, 0);
  assert.match(canvas.reason, /Randomised/);
});

test("blocked or missing probes lower coverage", () => {
  const partial = computeEntropy(
    attributes({
      canvas: { status: "blocked", stability: "unknown" },
      webgl: { status: "unavailable", stability: "unknown" },
      audio: { status: "blocked", stability: "unknown" },
      fonts: { status: "blocked", stability: "unknown" },
    }),
  );
  assert.ok(partial.coverage < 1);
  assert.notEqual(partial.confidence.label, "High confidence");
});

test("volatile signals are excluded from the estimate", () => {
  const entropy = computeEntropy(attributes());
  const ids = entropy.contributions.map((item) => item.id);
  assert.ok(!ids.includes("viewport"));
  assert.ok(!ids.includes("blocker"));
});
