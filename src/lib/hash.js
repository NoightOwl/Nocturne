/**
 * Hashing helpers. Prefer Web Crypto; fall back to a clearly labelled
 * non-cryptographic hash when SubtleCrypto is unavailable.
 */

const encoder = new TextEncoder();

function bytesFrom(data) {
  if (typeof data === "string") return encoder.encode(data);
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  throw new TypeError("Unsupported data for hashing");
}

function toHex(bytes) {
  let out = "";
  for (const byte of bytes) out += byte.toString(16).padStart(2, "0");
  return out;
}

export function shortHash(hash, length = 16) {
  if (!hash) return "";
  return hash.slice(0, length);
}

/** FNV-1a over bytes, returned as 16 hex characters. */
export function fnv1aHex(data) {
  const bytes = bytesFrom(data);
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;
  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = (hash * prime) & mask;
  }
  return hash.toString(16).padStart(16, "0");
}

/**
 * @returns {Promise<{algorithm: string, hash: string}>}
 */
export async function digest(data, algorithm = "SHA-256") {
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    try {
      const bytes = bytesFrom(data);
      const result = await subtle.digest(algorithm, bytes);
      return { algorithm, hash: toHex(new Uint8Array(result)) };
    } catch {
      // Fall through to the documented fallback.
    }
  }
  return { algorithm: "FNV-1a-64 (non-cryptographic fallback)", hash: fnv1aHex(data) };
}

export async function sha256Hex(data) {
  return (await digest(data, "SHA-256")).hash;
}

/**
 * Hash image pixels together with their dimensions so two different buffers
 * cannot accidentally produce the same value.
 */
export async function hashPixels(data, width, height) {
  const prefix = encoder.encode(`${width}x${height}:`);
  const pixels = bytesFrom(data);
  const combined = new Uint8Array(prefix.length + pixels.length);
  combined.set(prefix, 0);
  combined.set(pixels, prefix.length);
  return sha256Hex(combined);
}

export async function hashSamples(samples, sampleRate) {
  const prefix = encoder.encode(`audio:${sampleRate}:${samples.length}:`);
  const bytes = bytesFrom(samples);
  const combined = new Uint8Array(prefix.length + bytes.length);
  combined.set(prefix, 0);
  combined.set(bytes, prefix.length);
  return sha256Hex(combined);
}
