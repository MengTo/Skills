#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
// Entries already in SCREENSHOTS.md / SCREENSHOTS.html are kept verbatim (many carry hand-tuned
// titles and descriptions); only demos without an entry are generated. --fresh regenerates all.
const fresh = process.argv.includes("--fresh");
function readExisting(file, pattern) {
  const target = path.join(root, file);
  if (fresh || !existsSync(target)) return new Map();
  return new Map([...readFileSync(target, "utf8").matchAll(pattern)].map((match) => [match[1], match[0]]));
}
const existingMarkdown = readExisting("SCREENSHOTS.md", /^### (\S+)\n[\s\S]*?(?=^###? |(?![\s\S]))/gm);
const existingCards = readExisting("SCREENSHOTS.html", /<article class="card" data-demo="([^"]+)"[\s\S]*?<\/article>/g);
const skillFiles = execFileSync(
  "git",
  ["ls-files", "agent-skills/**/SKILL.md"],
  { cwd: root, encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean)
  // Index only skills that ship a demo folder; demos are optional (README folder contract).
  .filter((file) => file.split("/").length === 4 && existsSync(path.join(root, path.dirname(file), "demo", "index.html")))
  .sort();

function parseDescription(source) {
  const frontmatter = source.match(/^---\s*\n([\s\S]*?)\n---/);
  const match = frontmatter?.[1].match(/^description:\s*(.+)$/m);
  if (!match) return "Reusable workflow and implementation guidance.";
  return match[1].trim().replace(/^(["'])(.*)\1$/, "$2").trim();
}

function displayName(value) {
  const names = {
    "3d": "3D",
    ai: "AI",
    api: "API",
    cobejs: "COBE.js",
    css: "CSS",
    gltf: "GLTF",
    gsap: "GSAP",
    html: "HTML",
    ios: "iOS",
    js: "JS",
    matterjs: "Matter.js",
    mcp: "MCP",
    pdf: "PDF",
    seo: "SEO",
    svg: "SVG",
    threejs: "Three.js",
    tts: "TTS",
    ui: "UI",
    ux: "UX",
    vantajs: "Vanta.js",
    webgl: "WebGL",
  };
  return value
    .split("-")
    .map((part) => names[part] || (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

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
  const description = parseDescription(readFileSync(path.join(root, skillFile), "utf8"));
  return { base, category, description, feature: existsSync(featureScreenshot), slug, source };
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
  "Every skill that ships a `demo/` folder is shown as a real browser rendering of its local `demo/index.html`.",
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
    if (existingMarkdown.has(demo.slug)) {
      lines.push(existingMarkdown.get(demo.slug).replace(/\n+$/, ""), "");
      continue;
    }
    const sourceLabel = demo.source
      ? "Neuform #1 · " + new Intl.NumberFormat("en-US").format(Number(demo.source?.design?.view_count) || 0) + " views"
      : "Local demo";
    lines.push(
      "### " + demo.slug,
      "",
      demo.description,
      "",
      "[Open demo](" + demo.base + "/demo/index.html) · [Skill](" + demo.base + "/SKILL.md) · [Prompt](" + demo.base + "/demo/PROMPT.md) · " + sourceLabel,
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
    if (existingCards.has(demo.slug)) return existingCards.get(demo.slug);
    const sourceLabel = demo.source
      ? "Neuform #1 · " + new Intl.NumberFormat("en-US").format(Number(demo.source?.design?.view_count) || 0) + " views"
      : "Local demo";
    const sourceKey = demo.source ? "neuform" : "local";
    const searchText = [demo.slug, demo.category, demo.description, sourceLabel].join(" ").toLowerCase();
    const feature = demo.feature
      ? '<figure class="feature"><img loading="lazy" src="' + demo.base + '/demo/preview-feature.jpg" alt="' + escapeHtml(demo.slug) + ' interaction state"><figcaption>Interaction state</figcaption></figure>'
      : "";
    return [
      '<article class="card" data-demo="' + escapeHtml(demo.slug) + '" data-category="' + escapeHtml(demo.category) + '" data-source="' + sourceKey + '" data-search="' + escapeHtml(searchText) + '">',
      '<a class="imageLink" href="' + demo.base + '/demo/index.html" aria-label="Open ' + escapeHtml(demo.slug) + ' demo"><img loading="lazy" src="' + demo.base + '/demo/preview.jpg" alt="' + escapeHtml(demo.slug) + ' preview screenshot"></a>',
      feature,
      '<div class="cardBody"><div class="eyebrow"><span class="categoryTag">' + escapeHtml(displayName(demo.category)) + '</span><span class="sourceTag ' + sourceKey + '">' + escapeHtml(sourceLabel) + '</span></div><h3>' + escapeHtml(displayName(demo.slug)) + '</h3><code>$' + escapeHtml(demo.slug) + '</code><p class="description">' + escapeHtml(demo.description) + '</p><div class="actions"><a class="primary" href="' + demo.base + '/demo/index.html">View demo</a><a href="' + demo.base + '/SKILL.md">Skill</a><a href="' + demo.base + '/demo/PROMPT.md">Prompt</a></div></div>',
      "</article>",
    ].filter(Boolean).join("");
  }).join("");
  return '<section id="' + escapeHtml(category) + '" data-section="' + escapeHtml(category) + '"><div class="sectionTitle"><h2>' + escapeHtml(displayName(category)) + '</h2><span>' + categoryDemos.length + ' skills</span></div><div class="grid">' + cards + "</div></section>";
}).join("");

const categoryButtons = [
  '<button class="filterButton active" type="button" data-category-filter="all" aria-pressed="true">All <span>' + demos.length + "</span></button>",
  ...[...categories.entries()].sort().map(([category, categoryDemos]) => '<button class="filterButton" type="button" data-category-filter="' + escapeHtml(category) + '" aria-pressed="false">' + escapeHtml(displayName(category)) + '<span>' + categoryDemos.length + "</span></button>"),
].join("");

const galleryHtml = [
  "<!doctype html>",
  '<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
  "<title>Skills — Demo Gallery</title>",
  "<style>:root{color-scheme:light;--canvas:#f7f6f3;--surface:#fff;--ink:#282826;--muted:#787774;--line:#e8e6e1;--soft:#f0efec;--blue:#e1f3fe;--blueText:#1f6c9f;--green:#edf3ec;--greenText:#346538;font-family:\"Helvetica Neue\",Helvetica,Arial,sans-serif}*{box-sizing:border-box}html{scroll-behavior:smooth}body{min-width:320px;margin:0;color:var(--ink);background:var(--canvas);font-size:15px;line-height:1.6}button,input,select{font:inherit}a{color:inherit}.topbar{position:sticky;z-index:30;top:0;display:flex;align-items:center;justify-content:space-between;height:58px;padding:0 clamp(20px,4vw,64px);border-bottom:1px solid var(--line);background:rgba(247,246,243,.94);backdrop-filter:blur(16px)}.brand{font-size:12px;font-weight:700;letter-spacing:.14em;text-decoration:none;text-transform:uppercase}.topLinks{display:flex;gap:22px}.topLinks a{color:var(--muted);font-size:12px;text-decoration:none}.topLinks a:hover{color:var(--ink)}.hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(250px,.65fr);gap:48px;align-items:end;max-width:1500px;margin:auto;padding:clamp(64px,10vw,136px) clamp(20px,4vw,64px) clamp(54px,7vw,92px)}.kicker{margin:0 0 22px;color:var(--muted);font:600 11px/1.2 \"SF Mono\",Menlo,monospace;letter-spacing:.12em;text-transform:uppercase}.hero h1{max-width:900px;margin:0;font-family:\"Iowan Old Style\",\"Baskerville\",Georgia,serif;font-size:clamp(54px,7vw,112px);font-weight:400;letter-spacing:-.055em;line-height:.88}.intro{max-width:520px;margin:0;color:var(--muted);font-size:17px}.summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;margin-top:30px;border:1px solid var(--line);background:var(--line)}.summary div{padding:18px;background:var(--canvas)}.summary strong{display:block;font-family:\"Iowan Old Style\",Georgia,serif;font-size:28px;font-weight:400;line-height:1}.summary span{display:block;margin-top:8px;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em}.controls{position:sticky;z-index:20;top:58px;border-block:1px solid var(--line);background:rgba(247,246,243,.96);backdrop-filter:blur(16px)}.controlsInner{display:grid;grid-template-columns:minmax(240px,1fr) auto;gap:18px;align-items:center;max-width:1500px;margin:auto;padding:14px clamp(20px,4vw,64px)}.searchWrap{position:relative}.searchWrap label{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.search{width:100%;height:42px;padding:0 14px;border:1px solid var(--line);border-radius:6px;outline:none;color:var(--ink);background:var(--surface)}.search:focus{border-color:#aaa8a2}.filterRow{display:flex;gap:7px;align-items:center;overflow:auto}.filterButton{display:flex;gap:7px;align-items:center;height:34px;padding:0 11px;border:1px solid var(--line);border-radius:999px;color:var(--muted);background:var(--surface);font-size:12px;white-space:nowrap;cursor:pointer}.filterButton span{color:#aaa8a2}.filterButton.active{border-color:var(--ink);color:var(--surface);background:var(--ink)}.filterButton.active span{color:#d8d8d4}.sourceSelect{height:34px;padding:0 28px 0 10px;border:1px solid var(--line);border-radius:6px;color:var(--muted);background:var(--surface)}.resultLine{display:flex;justify-content:space-between;max-width:1500px;margin:0 auto;padding:24px clamp(20px,4vw,64px) 0;color:var(--muted);font:500 11px/1.2 \"SF Mono\",Menlo,monospace;letter-spacing:.08em;text-transform:uppercase}main{max-width:1500px;margin:auto;padding:0 clamp(20px,4vw,64px) 100px}section{scroll-margin-top:140px;padding-top:52px}.sectionTitle{display:flex;align-items:end;justify-content:space-between;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid var(--line)}.sectionTitle h2{margin:0;font-family:\"Iowan Old Style\",Georgia,serif;font-size:36px;font-weight:400;letter-spacing:-.035em}.sectionTitle span{color:var(--muted);font:500 10px/1.2 \"SF Mono\",Menlo,monospace;letter-spacing:.09em;text-transform:uppercase}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,330px),1fr));gap:18px}.card{overflow:hidden;border:1px solid var(--line);border-radius:12px;background:var(--surface);transition:border-color .2s ease,transform .2s ease}.card:hover{border-color:#cfcdc7;transform:translateY(-2px)}.imageLink{display:block;overflow:hidden;border-bottom:1px solid var(--line);background:var(--soft)}.imageLink img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;transition:transform .45s cubic-bezier(.16,1,.3,1)}.imageLink:hover img{transform:scale(1.012)}.feature{position:relative;margin:0;border-bottom:1px solid var(--line)}.feature img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}.feature figcaption{position:absolute;right:9px;bottom:9px;padding:5px 8px;border:1px solid rgba(255,255,255,.7);border-radius:999px;color:white;background:rgba(40,40,38,.72);font-size:9px;letter-spacing:.08em;text-transform:uppercase}.cardBody{padding:19px 19px 20px}.eyebrow{display:flex;gap:7px;align-items:center;justify-content:space-between;margin-bottom:15px}.eyebrow span{max-width:64%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.categoryTag,.sourceTag{padding:4px 7px;border-radius:999px;font-size:9px;font-weight:650;letter-spacing:.06em;text-transform:uppercase}.categoryTag{color:#5d5c58;background:var(--soft)}.sourceTag.neuform{color:var(--blueText);background:var(--blue)}.sourceTag.local{color:var(--greenText);background:var(--green)}.card h3{margin:0;font-family:\"Iowan Old Style\",Georgia,serif;font-size:25px;font-weight:400;letter-spacing:-.03em;line-height:1.06}.card code{display:block;margin-top:7px;color:#999791;font:11px/1.4 \"SF Mono\",Menlo,monospace}.description{display:-webkit-box;min-height:4.8em;margin:15px 0 20px;overflow:hidden;color:var(--muted);font-size:13px;line-height:1.6;-webkit-box-orient:vertical;-webkit-line-clamp:3}.actions{display:flex;gap:8px;align-items:center}.actions a{padding:7px 9px;border:1px solid var(--line);border-radius:5px;color:#64635f;font-size:11px;text-decoration:none}.actions a:hover{border-color:#aaa8a2;color:var(--ink)}.actions .primary{border-color:var(--ink);color:white;background:var(--ink)}.actions .primary:hover{background:#3b3b38}.empty{display:none;padding:80px 0;text-align:center;color:var(--muted)}.empty.show{display:block}.card[hidden],section[hidden]{display:none}.js .card{opacity:0;transform:translateY(10px)}.js .card.visible{opacity:1;transform:none;transition:opacity .55s cubic-bezier(.16,1,.3,1),transform .55s cubic-bezier(.16,1,.3,1),border-color .2s}.footer{display:flex;justify-content:space-between;max-width:1500px;margin:auto;padding:28px clamp(20px,4vw,64px);border-top:1px solid var(--line);color:var(--muted);font-size:11px}@media(max-width:900px){.hero{grid-template-columns:1fr}.controlsInner{grid-template-columns:1fr}.filterRow{padding-bottom:2px}.controls{position:relative;top:auto}.resultLine{padding-top:18px}.grid{grid-template-columns:repeat(auto-fill,minmax(min(100%,290px),1fr))}}@media(max-width:560px){.hero{padding-top:56px}.topLinks{display:none}.summary{grid-template-columns:1fr 1fr}.filterRow{margin-right:-20px;padding-right:20px}.sourceSelect{display:none}.footer{display:block}.footer span{display:block;margin-top:8px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.card,.imageLink img{transition:none!important}.js .card{opacity:1;transform:none}}</style></head>",
  '<body><nav class="topbar" aria-label="Primary"><a class="brand" href="#top">@MengTo / Skills</a><div class="topLinks"><a href="DEMOS.md">Demo index</a><a href="SCREENSHOTS.md">Screenshot index</a></div></nav><header class="hero" id="top"><div><p class="kicker">Reusable design systems and interactions</p><h1>Skills, shown through working demos.</h1></div><div><p class="intro">A visual catalog of ' + demos.length + ' reusable skills. Each entry includes its live HTML demo, source instructions, recreation prompt, and a rendered preview.</p><div class="summary"><div><strong>' + demos.length + '</strong><span>Skills</span></div><div><strong>' + categories.size + '</strong><span>Categories</span></div></div></div></header>',
  '<div class="controls"><div class="controlsInner"><div class="searchWrap"><label for="skillSearch">Search skills</label><input class="search" id="skillSearch" type="search" placeholder="Search by skill, technique, or description…" autocomplete="off"></div><div class="filterRow" role="group" aria-label="Filter by category">' + categoryButtons + '<select class="sourceSelect" id="sourceFilter" aria-label="Filter by source"><option value="all">All sources</option><option value="neuform">Neuform</option><option value="local">Local demos</option></select></div></div></div>',
  '<div class="resultLine"><span id="resultCount">Showing ' + demos.length + ' skills</span><span>Preview · Demo · Skill · Prompt</span></div>',
  '<main>' + htmlSections + '<div class="empty" id="emptyState"><p>No skills match this search.</p></div></main><footer class="footer"><span>@MengTo / Skills</span><span>' + demos.length + ' demos · ' + categories.size + ' categories</span></footer>',
  '<script>document.documentElement.classList.add("js");const cards=[...document.querySelectorAll(".card")],sections=[...document.querySelectorAll("[data-section]")],buttons=[...document.querySelectorAll("[data-category-filter]")],search=document.querySelector("#skillSearch"),source=document.querySelector("#sourceFilter"),count=document.querySelector("#resultCount"),empty=document.querySelector("#emptyState");let category="all";const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target)}}},{rootMargin:"80px 0px"});for(const card of cards)observer.observe(card);function applyFilters(){const query=search.value.trim().toLowerCase();let visible=0;for(const card of cards){const matchCategory=category==="all"||card.dataset.category===category,matchSource=source.value==="all"||card.dataset.source===source.value,matchQuery=!query||card.dataset.search.includes(query);card.hidden=!(matchCategory&&matchSource&&matchQuery);if(!card.hidden){visible+=1;card.classList.add("visible")}}for(const section of sections)section.hidden=!section.querySelector(".card:not([hidden])");count.textContent="Showing "+visible+(visible===1?" skill":" skills");empty.classList.toggle("show",visible===0)}for(const button of buttons)button.addEventListener("click",()=>{category=button.dataset.categoryFilter;for(const item of buttons){const active=item===button;item.classList.toggle("active",active);item.setAttribute("aria-pressed",String(active))}applyFilters()});search.addEventListener("input",applyFilters);source.addEventListener("change",applyFilters);</script></body></html>',
  "",
].join("\n");

await writeFile(path.join(root, "SCREENSHOTS.html"), galleryHtml);
console.log("Built screenshot galleries for " + demos.length + " demos.");
