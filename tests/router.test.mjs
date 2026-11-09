import test from "node:test";
import assert from "node:assert/strict";
import { parseRoute, routeHash } from "../src/router.js";

test("parses the home route", () => {
  assert.deepEqual(parseRoute("#/"), { name: "home", path: "" });
  assert.deepEqual(parseRoute(""), { name: "home", path: "" });
});

test("parses known routes and strips query strings", () => {
  assert.deepEqual(parseRoute("#/test"), { name: "test", path: "test" });
  assert.deepEqual(parseRoute("#/learn?source=home"), { name: "learn", path: "learn" });
  assert.deepEqual(parseRoute("about"), { name: "about", path: "about" });
});

test("unknown routes are explicit", () => {
  assert.deepEqual(parseRoute("#/not-a-page"), { name: "unknown", path: "not-a-page" });
});

test("route hashes round-trip", () => {
  assert.equal(routeHash("home"), "#/");
  assert.equal(routeHash("results"), "#/results");
});
