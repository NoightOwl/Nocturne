import test from "node:test";
import assert from "node:assert/strict";
import { checkBudgets } from "../scripts/check-budget.mjs";

test("initial route and scan chunks stay inside performance budgets", async () => {
  const result = await checkBudgets();
  assert.deepEqual(result.failures, []);
  assert.ok(result.initial.total > 0);
  assert.ok(result.test.total > 0);
});
