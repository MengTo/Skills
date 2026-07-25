#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function fail(message) {
  process.stderr.write(`Capture validation failed: ${message}\n`);
  process.exit(1);
}

function requireString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function requireFile(articleDir, relativePath, label) {
  const rawPath = requireString(relativePath, label);
  const resolved = path.resolve(articleDir, rawPath);
  let stat;

  try {
    stat = fs.statSync(resolved);
  } catch {
    fail(`${label} does not exist: ${resolved}`);
  }

  if (!stat.isFile() || stat.size === 0) {
    fail(`${label} is not a non-empty file: ${resolved}`);
  }

  return resolved;
}

const manifestArg = process.argv[2];
if (!manifestArg) {
  fail("usage: validate_capture.mjs <manifest.json>");
}

const manifestPath = path.resolve(manifestArg);
const articleDir = path.dirname(manifestPath);

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
} catch (error) {
  fail(`cannot read valid JSON from ${manifestPath}: ${error.message}`);
}

if (manifest.itemCount !== 5) {
  fail(`itemCount must be 5, received ${JSON.stringify(manifest.itemCount)}`);
}

if (!Array.isArray(manifest.items) || manifest.items.length !== 5) {
  fail(`items must contain exactly 5 entries, received ${manifest.items?.length ?? "none"}`);
}

const contentPath = requireFile(articleDir, "content.md", "content.md");
const normalizedItems = manifest.items.map((item, index) => {
  const prefix = `items[${index}]`;
  const captureType = requireString(item.captureType, `${prefix}.captureType`);

  const normalized = {
    index: index + 1,
    title: requireString(item.title, `${prefix}.title`),
    creator: requireString(item.creator, `${prefix}.creator`),
    sourceUrl: requireString(item.sourceUrl, `${prefix}.sourceUrl`),
    pageUrl: typeof item.pageUrl === "string" ? item.pageUrl.trim() : null,
    captureType,
    fullPageImage: requireFile(articleDir, item.fullPageImage, `${prefix}.fullPageImage`),
    promptLength: requireString(item.prompt, `${prefix}.prompt`).length,
  };

  if (/website|live/i.test(captureType) && !normalized.pageUrl) {
    fail(`${prefix}.pageUrl is required for live-site capture type ${captureType}`);
  }

  return normalized;
});

process.stdout.write(
  `${JSON.stringify(
    {
      valid: true,
      manifestPath,
      articleDir,
      contentPath,
      itemCount: normalizedItems.length,
      items: normalizedItems,
    },
    null,
    2
  )}\n`
);
