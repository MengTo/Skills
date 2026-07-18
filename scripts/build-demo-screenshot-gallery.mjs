#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";

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

const demos = skillFiles.map((skillFile) => {
  const parts = skillFile.split("/");
  const category = parts[1];
  const slug = parts[2];
  const base = path.dirname(skillFile).replaceAll(path.sep, "/");
  const demoDirectory = path.join(root, base, "demo");
  const preview = path.join(demoDirectory, "preview.jpg");
  if (!existsSync(preview)) throw new Error("Missing preview screenshot: " + path.relative(root, preview));
  const sourceFile = path.join(demoDirectory, "source.json");
  const source = existsSync(sourceFile) ? JSON.parse(readFileSync(sourceFile, "utf8")) : null;
  const featureScreenshot = path.join(demoDirectory, "preview-feature.jpg");
  return { base, category, feature: existsSync(featureScreenshot), slug, source };
});

const categories = new Map();
for (const demo of demos) {
  const group = categories.get(demo.category) || [];
  group.push(demo);
  categories.set(demo.category, group);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const lines = [
  "# Demo Screenshot Gallery",
  "",
  "Every tracked skill is shown as a real browser rendering of its local `demo/index.html`.",
  "",
  "- Captured demos: " + demos.length,
  "- Browser viewport: 1280 x 720 (a few source pages export a slightly scaled JPEG)",
  "- Format: JPEG",
  "- Reveal hover effect: includes both default and interaction states",
  "",
  "Open the [visual browser gallery](SCREENSHOTS.html), or see [DEMOS.md](DEMOS.md) for the complete demo, prompt, and source index.",
  "",
];

for (const [category, categoryDemos] of [...categories.entries()].sort()) {
  lines.push("## " + category + " (" + categoryDemos.length + ")", "");
  for (const demo of categoryDemos) {
    const sourceLabel = demo.source
      ? "Neuform #1 · " + new Intl.NumberFormat("en-US").format(Number(demo.source?.design?.view_count) || 0) + " views"
      : "Local demo";
    lines.push(
      "### " + demo.slug,
      "",
      "[Open demo](" + demo.base + "/demo/index.html) · [Prompt](" + demo.base + "/demo/PROMPT.md) · " + sourceLabel,
      "",
      "![" + demo.slug + " preview screenshot](" + demo.base + "/demo/preview.jpg)",
      "",
    );
    if (demo.feature) {
      lines.push(
        "#### Interaction state",
        "",
        "![" + demo.slug + " interaction preview](" + demo.base + "/demo/preview-feature.jpg)",
        "",
      );
    }
  }
}

await writeFile(path.join(root, "SCREENSHOTS.md"), lines.join("\n"));

const htmlSections = [...categories.entries()].sort().map(([category, categoryDemos]) => {
  const cards = categoryDemos.map((demo) => {
    const sourceLabel = demo.source
      ? "Neuform #1 · " + new Intl.NumberFormat("en-US").format(Number(demo.source?.design?.view_count) || 0) + " views"
      : "Local demo";
    const feature = demo.feature
      ? '<figure class="feature"><img loading="lazy" src="' + demo.base + '/demo/preview-feature.jpg" alt="' + escapeHtml(demo.slug) + ' interaction state"><figcaption>Interaction state</figcaption></figure>'
      : "";
    return [
      '<article class="card" data-demo="' + escapeHtml(demo.slug) + '">',
      '<a class="imageLink" href="' + demo.base + '/demo/index.html"><img loading="lazy" src="' + demo.base + '/demo/preview.jpg" alt="' + escapeHtml(demo.slug) + ' preview screenshot"></a>',
      feature,
      '<div class="meta"><div><h3>' + escapeHtml(demo.slug) + '</h3><p>' + escapeHtml(sourceLabel) + '</p></div><div class="actions"><a href="' + demo.base + '/demo/index.html">Open demo</a><a href="' + demo.base + '/demo/PROMPT.md">Prompt</a></div></div>',
      "</article>",
    ].filter(Boolean).join("");
  }).join("");
  return '<section id="' + escapeHtml(category) + '"><div class="sectionTitle"><h2>' + escapeHtml(category) + '</h2><span>' + categoryDemos.length + ' demos</span></div><div class="grid">' + cards + "</div></section>";
}).join("");

const categoryLinks = [...categories.entries()].sort()
  .map(([category, categoryDemos]) => '<a href="#' + escapeHtml(category) + '">' + escapeHtml(category) + '<span>' + categoryDemos.length + "</span></a>")
  .join("");

const galleryHtml = [
  "<!doctype html>",
  '<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
  "<title>Skills · Demo Screenshot Gallery</title>",
  "<style>:root{color-scheme:dark;--bg:#0b0b0c;--panel:#151517;--line:#29292d;--muted:#929298;--text:#f4f4f5;--accent:#ff6b5f;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;color:var(--text);background:var(--bg)}a{color:inherit}.hero{padding:72px clamp(24px,5vw,76px) 44px;border-bottom:1px solid var(--line);background:radial-gradient(circle at 82% 0,rgba(255,107,95,.18),transparent 32%)}.kicker{margin:0 0 18px;color:var(--accent);font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase}.hero h1{max-width:900px;margin:0;font-size:clamp(48px,7vw,104px);font-weight:650;letter-spacing:-.07em;line-height:.88}.hero p{max-width:660px;margin:28px 0 0;color:#b7b7bc;font-size:18px;line-height:1.5}.nav{position:sticky;z-index:10;top:0;display:flex;gap:10px;padding:14px clamp(24px,5vw,76px);overflow:auto;border-bottom:1px solid var(--line);background:rgba(11,11,12,.9);backdrop-filter:blur(18px)}.nav a{display:flex;gap:10px;align-items:center;padding:9px 13px;border:1px solid var(--line);border-radius:999px;font-size:12px;text-decoration:none;text-transform:capitalize;white-space:nowrap}.nav span{color:var(--muted)}main{padding:16px clamp(24px,5vw,76px) 80px}section{scroll-margin-top:82px;padding-top:52px}.sectionTitle{display:flex;align-items:end;justify-content:space-between;margin-bottom:18px;padding-bottom:16px;border-bottom:1px solid var(--line)}.sectionTitle h2{margin:0;font-size:30px;letter-spacing:-.04em;text-transform:capitalize}.sectionTitle span{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.12em}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,430px),1fr));gap:24px}.card{overflow:hidden;border:1px solid var(--line);border-radius:18px;background:var(--panel);box-shadow:0 24px 70px rgba(0,0,0,.2)}.imageLink{display:block;overflow:hidden;background:#09090a}.card img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;transition:transform .45s cubic-bezier(.2,.7,.2,1)}.imageLink:hover img{transform:scale(1.018)}.feature{position:relative;margin:0;border-top:1px solid var(--line)}.feature figcaption{position:absolute;right:12px;bottom:12px;padding:7px 10px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(0,0,0,.58);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;backdrop-filter:blur(12px)}.meta{display:flex;gap:20px;align-items:flex-start;justify-content:space-between;padding:18px 20px 20px}.meta h3{max-width:26ch;margin:0;font-size:16px;letter-spacing:-.02em}.meta p{margin:7px 0 0;color:var(--muted);font-size:12px}.actions{display:flex;gap:8px}.actions a{padding:7px 9px;border:1px solid var(--line);border-radius:8px;color:#c9c9cd;font-size:11px;text-decoration:none}.actions a:hover{border-color:#55555c;color:white}@media(max-width:640px){.hero{padding-top:48px}.meta{display:block}.actions{margin-top:16px}.grid{grid-template-columns:1fr}}</style></head>",
  '<body><header class="hero"><p class="kicker">@MengTo / Skills</p><h1>Demo Screenshot Gallery</h1><p>' + demos.length + ' real browser captures from the local HTML demos. Neuform matches use the top-ranked public design; workflow and unmatched skills keep their authored local examples.</p></header>',
  '<nav class="nav" aria-label="Categories">' + categoryLinks + "</nav>",
  "<main>" + htmlSections + "</main></body></html>",
  "",
].join("\n");

await writeFile(path.join(root, "SCREENSHOTS.html"), galleryHtml);
console.log("Built screenshot galleries for " + demos.length + " demos.");
