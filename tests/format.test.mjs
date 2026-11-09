import test from "node:test";
import assert from "node:assert/strict";
import {
  formatBits,
  formatDuration,
  formatOneIn,
  formatPercent,
  verdictFor,
} from "../src/lib/format.js";

test("formats one-in values at useful scales", () => {
  assert.equal(formatOneIn(1), "1 in 1");
  assert.equal(formatOneIn(999), "1 in 999");
  assert.equal(formatOneIn(1500), "1 in 1.5k");
  assert.equal(formatOneIn(1_500_000), "1 in 1.5M");
  assert.equal(formatOneIn(1_500_000_000), "1 in 1.5B");
});

test("formats bit ranges and durations", () => {
  assert.equal(formatBits(10, 10), "10 bits");
  assert.equal(formatBits(10, 12.4), "10–12.4 bits");
  assert.equal(formatDuration(240), "240 ms");
  assert.equal(formatDuration(2400), "2.4 s");
  assert.equal(formatPercent(0.75), "75%");
});

test("qualitative verdicts are ordered without claiming uniqueness", () => {
  assert.equal(verdictFor(8).label, "Relatively common");
  assert.equal(verdictFor(14).label, "Somewhat distinctive");
  assert.equal(verdictFor(19).label, "Distinctive");
  assert.equal(verdictFor(23).label, "Highly distinctive");
  assert.ok(!verdictFor(23).sentence.toLowerCase().includes("unique"));
});
