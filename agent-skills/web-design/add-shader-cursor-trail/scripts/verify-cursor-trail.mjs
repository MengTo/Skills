#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import process from "node:process";

const [graphPath, gatePath, cssPath] = process.argv.slice(2);

if (!graphPath || !gatePath || !cssPath) {
  console.error(
    "Usage: verify-cursor-trail.mjs GRAPH_FILE GATE_FILE CSS_FILE",
  );
  process.exit(2);
}

const [graph, gate, css] = await Promise.all([
  readFile(graphPath, "utf8"),
  readFile(gatePath, "utf8"),
  readFile(cssPath, "utf8"),
]);

function requireMatch(source, pattern, label) {
  if (!pattern.test(source)) {
    throw new Error(`Missing ${label}`);
  }
}

function requireOrdered(source, tokens) {
  let cursor = -1;
  for (const token of tokens) {
    cursor = source.indexOf(token, cursor + 1);
    if (cursor < 0) throw new Error(`Missing or out-of-order shader node: ${token}`);
  }
}

requireOrdered(graph, [
  "<DotGrid",
  "<ChromaFlow",
  "<LinearGradient",
  "<LinearGradient",
  "<CursorRipples",
  "<FilmGrain",
]);

for (const [pattern, label] of [
  [/from ["']shaders\/react["']/, "Shaders React import"],
  [/id=["']trailDots["']/, "trailDots ID"],
  [/source:\s*["']trailFlow["']/, "trailFlow map source"],
  [/id=["']trailFlow["']/, "trailFlow ID"],
  [/maskSource=["']trailDots["']/, "trailDots mask source"],
  [/density=\{40\}/, "dot density"],
  [/twinkle=\{0\.9\}/, "dot twinkle"],
  [/intensity=\{1\.4\}/, "flow intensity"],
  [/radius=\{2\.9\}/, "flow radius"],
  [/<FilmGrain\s+strength=\{0\.1\}/, "film grain"],
]) {
  requireMatch(graph, pattern, label);
}

if ((graph.match(/visible=\{false\}/g) ?? []).length < 2) {
  throw new Error("DotGrid and ChromaFlow must remain invisible driver components");
}

for (const [pattern, label] of [
  [/lazy\(\(\)\s*=>\s*import\(["']\.\/CursorTrailShader["']\)\)/, "lazy shader import"],
  [/navigator as Navigator & \{ gpu\?: unknown \}/, "WebGPU gate"],
  [/prefers-reduced-motion: reduce/, "reduced-motion gate"],
  [/prefers-reduced-transparency: reduce/, "reduced-transparency gate"],
  [/\(hover: hover\) and \(pointer: fine\)/, "fine-pointer gate"],
  [/IntersectionObserver/, "viewport observer"],
  [/visibilitychange/, "document visibility handling"],
  [/visibilityObserver\?\.disconnect\(\)/, "observer cleanup"],
]) {
  requireMatch(gate, pattern, label);
}

for (const [pattern, label] of [
  [/@media \(prefers-reduced-motion: reduce\)/, "reduced-motion CSS"],
  [/\(pointer: coarse\)/, "coarse-pointer CSS"],
  [/@media \(forced-colors: active\)/, "forced-colors CSS"],
  [/\.cursor-trail-layer[\s\S]*position:\s*absolute/, "full-bleed layer"],
  [/\.cursor-trail-content[\s\S]*z-index:\s*1/, "content stacking"],
]) {
  requireMatch(css, pattern, label);
}

const combined = `${graph}\n${gate}\n${css}`;
if (/previews\.shaders\.com|data\.shaders\.com/i.test(combined)) {
  throw new Error("Runtime hotlink to a Shaders preview/data domain found");
}

console.log("Cursor trail graph, gates, fallbacks, and cleanup verified.");
