import test from "node:test";
import assert from "node:assert/strict";
import { ATTRIBUTE_MODEL } from "../src/data/reference-model.js";
import { buildStablePayload, canonicalJson, canonicalize } from "../src/lib/canonical.js";

test("canonical JSON sorts object keys recursively", () => {
  const value = { b: 1, a: { d: 2, c: 3 } };
  assert.equal(canonicalJson(value), '{"a":{"c":3,"d":2},"b":1}');
});

test("canonicalize preserves array order", () => {
  assert.deepEqual(canonicalize({ z: [3, 1, 2], a: true }), { a: true, z: [3, 1, 2] });
});

test("stable payload excludes volatile, randomised, and blocked values", () => {
  const payload = buildStablePayload(
    [
      { id: "userAgent", status: "ok", stability: "stable", value: "UA" },
      { id: "canvas", status: "ok", stability: "randomized", value: "noise" },
      { id: "webgl", status: "blocked", stability: "unknown", value: null },
      { id: "viewport", status: "ok", stability: "volatile", value: "123" },
      { id: "blocker", status: "ok", stability: "volatile", value: true },
      { id: "fonts", status: "ok", stability: "stable", value: { count: 1, fonts: ["Arial"] } },
    ],
    ATTRIBUTE_MODEL,
  );
  assert.deepEqual(Object.keys(payload.values), ["fonts", "userAgent"]);
});

test("stable payload is deterministic for the same values", () => {
  const attrs = [
    { id: "userAgent", status: "ok", stability: "stable", value: "UA" },
    { id: "screen", status: "ok", stability: "stable", value: { height: 900, width: 1440 } },
  ];
  const a = canonicalJson(buildStablePayload(attrs, ATTRIBUTE_MODEL));
  const b = canonicalJson(buildStablePayload([...attrs].reverse(), ATTRIBUTE_MODEL));
  assert.equal(a, b);
});
