#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const skillFiles = execFileSync(
  "git",
  ["ls-files", "agent-skills/**/SKILL.md"],
  { cwd: root, encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean)
  .sort();

const failures = [];
const stats = { skills: skillFiles.length, html: 0, prompts: 0, previews: 0, workflows: 0, assets: 0, sources: 0 };
let previewDimensions = null;

function fail(file, message) {
  failures.push(file + ": " + message);
}

function readRequired(file) {
  if (!existsSync(file)) {
    fail(path.relative(root, file), "missing");
    return "";
  }
  return readFileSync(file, "utf8");
}

function readJpegDimensions(file) {
  const data = readFileSync(file);
  if (data.length < 12 || data[0] !== 0xff || data[1] !== 0xd8) return null;
  const startOfFrameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset + 8 < data.length) {
    if (data[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (data[offset] === 0xff) offset += 1;
    const marker = data[offset];
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 2 > data.length) break;
    const length = data.readUInt16BE(offset);
    if (startOfFrameMarkers.has(marker) && offset + 7 <= data.length) {
      return { height: data.readUInt16BE(offset + 3), width: data.readUInt16BE(offset + 5) };
    }
    if (length < 2) break;
    offset += length;
  }
  return null;
}

for (const skillFile of skillFiles) {
  const parts = skillFile.split("/");
  const category = parts[1];
  const slug = parts[2];
  const demoDirectory = path.join(root, path.dirname(skillFile), "demo");
  const htmlFile = path.join(demoDirectory, "index.html");
  const promptFile = path.join(demoDirectory, "PROMPT.md");
  const previewFile = path.join(demoDirectory, "preview.jpg");
  const sourceFile = path.join(demoDirectory, "source.json");
  const sourceDerived = existsSync(sourceFile);
  let sourceManifest = null;
  if (sourceDerived) {
    stats.sources += 1;
    try {
      sourceManifest = JSON.parse(readFileSync(sourceFile, "utf8"));
    } catch (error) {
      fail(path.relative(root, sourceFile), "invalid JSON: " + error.message);
    }
  }
  const html = readRequired(htmlFile);
  const prompt = readRequired(promptFile);

  if (!existsSync(previewFile)) {
    fail(path.relative(root, previewFile), "missing");
  } else {
    const dimensions = readJpegDimensions(previewFile);
    if (!dimensions) {
      fail(path.relative(root, previewFile), "expected JPEG preview screenshot");
    } else {
      stats.previews += 1;
      previewDimensions ||= dimensions;
      const widthDrift = Math.abs(dimensions.width - previewDimensions.width) / previewDimensions.width;
      const heightDrift = Math.abs(dimensions.height - previewDimensions.height) / previewDimensions.height;
      if (widthDrift > 0.02 || heightDrift > 0.02) {
        fail(path.relative(root, previewFile), "capture size drifted from the shared viewport: " + dimensions.width + " x " + dimensions.height);
      }
      if (dimensions.width < 1200 || dimensions.height < 700) {
        fail(path.relative(root, previewFile), "capture is too small: " + dimensions.width + " x " + dimensions.height);
      }
      if (statSync(previewFile).size > 2 * 1024 * 1024) {
        fail(path.relative(root, previewFile), "preview exceeds 2 MB");
      }
    }
  }

  if (html) {
    stats.html += 1;
    if (!/^<!doctype html>/i.test(html)) fail(path.relative(root, htmlFile), "missing doctype");
    if (!sourceDerived && !/<html lang="en"/i.test(html)) fail(path.relative(root, htmlFile), "missing language");
    if (!/<meta name="viewport"/i.test(html)) fail(path.relative(root, htmlFile), "missing viewport meta");
    if (!/<title>[^<]+<\/title>/i.test(html)) fail(path.relative(root, htmlFile), "missing title");
    if (!sourceDerived && !/<main(?:\s|>)/i.test(html)) fail(path.relative(root, htmlFile), "missing main landmark");
    const headingCount = (html.match(/<h1(?:\s|>)/gi) || []).length;
    if (!sourceDerived && headingCount !== 1) fail(path.relative(root, htmlFile), "expected one h1, found " + headingCount);
    if (!sourceDerived && category !== "codex" && !html.includes("prefers-reduced-motion")) {
      fail(path.relative(root, htmlFile), "missing reduced-motion fallback");
    }
    if (!sourceDerived && /https?:\/\/[^"'\s<>]+/i.test(html)) fail(path.relative(root, htmlFile), "remote URL found; demos must be self-contained");
    if (/\/Users\/|file:\/\//i.test(html)) fail(path.relative(root, htmlFile), "personal absolute path found");
    if (!sourceDerived && /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(html)) fail(path.relative(root, htmlFile), "email address found");

    const references = [...html.matchAll(/(?:src|href)=["']([^"'#]+)["']/gi)]
      .map((match) => match[1])
      .filter((reference) => !/^(?:data:|javascript:|mailto:)/i.test(reference));
    for (const reference of references) {
      if (sourceDerived && /^(?:https?:|\/|\?|#)/i.test(reference)) continue;
      if (sourceDerived && !reference.startsWith("assets/")) continue;
      const decoded = decodeURIComponent(reference.split("?")[0]);
      const target = path.resolve(demoDirectory, decoded);
      if (!target.startsWith(demoDirectory)) {
        fail(path.relative(root, htmlFile), "reference escapes demo folder: " + reference);
      } else if (!existsSync(target)) {
        fail(path.relative(root, htmlFile), "missing referenced file: " + reference);
      } else if (target.includes(path.sep + "assets" + path.sep)) {
        stats.assets += 1;
        if (statSync(target).size > 5 * 1024 * 1024) {
          fail(path.relative(root, target), "asset exceeds 5 MB");
        }
      }
    }

    for (const match of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
      const attributes = match[1] || "";
      if (/type=["'](?:application\/json|importmap)["']/i.test(attributes)) continue;
      const script = match[2].trim();
      if (!script) continue;
      try {
        new vm.Script(script, { filename: path.relative(root, htmlFile) });
      } catch (error) {
        fail(path.relative(root, htmlFile), "inline JavaScript syntax error: " + error.message);
      }
    }
  }

  if (sourceDerived && sourceManifest) {
    if (sourceManifest.provider !== "Neuform") fail(path.relative(root, sourceFile), "unexpected provider");
    if (sourceManifest?.ranking?.position !== 1) fail(path.relative(root, sourceFile), "expected rank 1 source");
    if (!sourceManifest?.design?.id || !sourceManifest?.design?.title || !sourceManifest?.design?.url) {
      fail(path.relative(root, sourceFile), "missing design provenance");
    }
    if (!/^[a-f0-9]{64}$/.test(String(sourceManifest?.html?.original_sha256 || ""))) {
      fail(path.relative(root, sourceFile), "missing original HTML checksum");
    }
    const preview = String(sourceManifest?.assets?.preview || "").trim();
    if (preview && !existsSync(path.join(demoDirectory, preview))) {
      fail(path.relative(root, sourceFile), "missing source preview asset");
    }
  }

  if (prompt) {
    stats.prompts += 1;
    const wordCount = prompt.trim().split(/\s+/).length;
    if (wordCount < 120) fail(path.relative(root, promptFile), "prompt recipe is too thin: " + wordCount + " words");
    if (!prompt.includes("$" + slug)) fail(path.relative(root, promptFile), "does not trigger $" + slug);
    for (const heading of ["## Minimal prompt", "## Recreate the demo", "## Remix prompt"]) {
      if (!prompt.includes(heading)) fail(path.relative(root, promptFile), "missing " + heading);
    }
    if (/\/Users\/|file:\/\//i.test(prompt)) fail(path.relative(root, promptFile), "personal absolute path found");
    if (/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(prompt)) fail(path.relative(root, promptFile), "email address found");
  }

  if (category === "codex") {
    stats.workflows += 1;
    readRequired(path.join(demoDirectory, "input.md"));
    readRequired(path.join(demoDirectory, "expected-output.md"));
  }
}

const demosIndex = readRequired(path.join(root, "DEMOS.md"));
if (demosIndex) {
  const rows = demosIndex
    .split("\n")
    .filter((line) => /^\| [a-z0-9][a-z0-9-]* \|/.test(line));
  if (rows.length !== skillFiles.length) {
    fail("DEMOS.md", "expected " + skillFiles.length + " demo rows, found " + rows.length);
  }
}

const screenshotIndex = readRequired(path.join(root, "SCREENSHOTS.md"));
if (screenshotIndex) {
  const previewLinks = screenshotIndex.match(/!\[[^\]]+\]\(agent-skills\/[^)]+\/demo\/preview\.jpg\)/g) || [];
  if (previewLinks.length !== skillFiles.length) {
    fail("SCREENSHOTS.md", "expected " + skillFiles.length + " preview screenshots, found " + previewLinks.length);
  }
  const revealFeature = path.join(root, "agent-skills/web-design/reveal-hover-effect/demo/preview-feature.jpg");
  if (!existsSync(revealFeature)) fail(path.relative(root, revealFeature), "missing");
  if (!screenshotIndex.includes("reveal-hover-effect/demo/preview-feature.jpg")) {
    fail("SCREENSHOTS.md", "missing Reveal interaction-state screenshot");
  }
}

const screenshotGallery = readRequired(path.join(root, "SCREENSHOTS.html"));
if (screenshotGallery) {
  const galleryCards = screenshotGallery.match(/data-demo=/g) || [];
  if (galleryCards.length !== skillFiles.length) {
    fail("SCREENSHOTS.html", "expected " + skillFiles.length + " demo cards, found " + galleryCards.length);
  }
}

if (failures.length) {
  console.error("Demo validation failed with " + failures.length + " issue(s):");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("Demo validation passed.");
console.log("- tracked skills: " + stats.skills);
console.log("- HTML demos: " + stats.html);
console.log("- prompt recipes: " + stats.prompts);
console.log("- browser preview screenshots: " + stats.previews + " at " + previewDimensions.width + " x " + previewDimensions.height);
console.log("- workflow examples: " + stats.workflows);
console.log("- local asset references: " + stats.assets);
console.log("- Neuform source demos: " + stats.sources);
