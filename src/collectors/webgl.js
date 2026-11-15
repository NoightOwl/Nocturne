import { hashPixels } from "../lib/hash.js";
import { result } from "./utils.js";

const SIZE = 64;

const VERTEX_SHADER = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
void main() {
  vec2 p = gl_FragCoord.xy;
  float v = fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  gl_FragColor = vec4(v, fract(v * 7.0), fract(v * 13.0), 1.0);
}
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function makeProgram(gl) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

async function sample() {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const gl = canvas.getContext("webgl", {
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  if (!gl) {
    canvas.width = 0;
    canvas.height = 0;
    return null;
  }

  const debug = gl.getExtension("WEBGL_debug_renderer_info");
  const vendor = debug
    ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL)
    : gl.getParameter(gl.VENDOR);
  const renderer = debug
    ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
    : gl.getParameter(gl.RENDERER);

  const limits = {
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxViewportDims: Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS) || []),
    maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
    aliasedLineWidthRange: Array.from(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE) || []),
    aliasedPointSizeRange: Array.from(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) || []),
  };

  let hash = null;
  const program = makeProgram(gl);
  if (program) {
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const location = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, SIZE, SIZE);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
  } else {
    gl.clearColor(0.02, 0.04, 0.08, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  const pixels = new Uint8Array(SIZE * SIZE * 4);
  gl.readPixels(0, 0, SIZE, SIZE, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  hash = await hashPixels(pixels, SIZE, SIZE);

  const value = {
    vendor: vendor ? String(vendor) : "unknown",
    renderer: renderer ? String(renderer) : "unknown",
    version: gl.getParameter(gl.VERSION) ? String(gl.getParameter(gl.VERSION)) : "unknown",
    shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
      ? String(gl.getParameter(gl.SHADING_LANGUAGE_VERSION))
      : "unknown",
    hash,
    extensionsCount: (gl.getSupportedExtensions() || []).length,
    limits,
  };

  gl.getExtension("WEBGL_lose_context")?.loseContext();
  canvas.width = 0;
  canvas.height = 0;
  return value;
}

export default {
  id: "webgl",
  label: "WebGL and GPU",
  category: "Rendering",
  group: "visual",
  timeoutMs: 2500,
  async collect() {
    try {
      const first = await sample();
      const second = await sample();
      if (!first || !second) {
        return [
          result("webgl", "WebGL fingerprint", "Rendering", null, "WebGL unavailable", {
            status: "blocked",
            stability: "unknown",
            note: "The browser did not provide a WebGL context.",
          }),
        ];
      }

      const randomized = first.hash !== second.hash;
      return [
        result(
          "webgl",
          "WebGL fingerprint",
          "Rendering",
          first,
          `${first.vendor} · ${first.renderer}`,
          {
            stability: randomized ? "randomized" : "stable",
            note: randomized
              ? "The WebGL hash changed between samples, so the rendered surface is not stable."
              : "The GPU renderer, limits, and a rendered pixel hash are readable and stable.",
          },
        ),
      ];
    } catch {
      return [
        result("webgl", "WebGL fingerprint", "Rendering", null, "WebGL blocked", {
          status: "blocked",
          stability: "unknown",
          note: "The browser blocked WebGL context creation or pixel readback.",
        }),
      ];
    }
  },
};
