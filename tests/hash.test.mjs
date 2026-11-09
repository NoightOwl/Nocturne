import test from "node:test";
import assert from "node:assert/strict";
import { digest, fnv1aHex, hashPixels, sha256Hex, shortHash } from "../src/lib/hash.js";

test("SHA-256 matches the known digest for abc", async () => {
  assert.equal(
    await sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

test("digest reports the SHA-256 algorithm", async () => {
  const result = await digest("abc");
  assert.equal(result.algorithm, "SHA-256");
  assert.equal(result.hash.length, 64);
});

test("FNV-1a is deterministic and non-empty", () => {
  assert.equal(fnv1aHex("abc"), fnv1aHex("abc"));
  assert.match(fnv1aHex("abc"), /^[0-9a-f]{16}$/);
  assert.notEqual(fnv1aHex("abc"), fnv1aHex("abd"));
});

test("pixel hash is deterministic and includes dimensions", async () => {
  const pixels = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);
  const first = await hashPixels(pixels, 2, 1);
  const second = await hashPixels(pixels, 2, 1);
  const otherDimensions = await hashPixels(pixels, 1, 2);
  assert.equal(first, second);
  assert.notEqual(first, otherDimensions);
  assert.equal(shortHash(first, 10).length, 10);
});
