#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const force = process.argv.includes("--force");
const skillFiles = execFileSync(
  "git",
  ["ls-files", "agent-skills/**/SKILL.md"],
  { cwd: root, encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean)
  .sort();

const workflowExamples = {
  "audit-verify-explain-grade-5": {
    scenario: "Verify a checkout fix before handing it back to a non-technical product owner.",
    input: [
      "# Audit request",
      "",
      "The checkout button previously submitted twice on a slow connection.",
      "A guard was added to disable the button while the request is pending.",
      "",
      "Evidence available:",
      "- targeted unit test output",
      "- browser recording of one successful checkout",
      "- changed-file diff",
    ].join("\n"),
    output: [
      "# Verification result",
      "",
      "Status: PASS",
      "",
      "The button now locks after the first click, so a second order is not created.",
      "The focused test passed and the browser recording shows one network request.",
      "",
      "Remaining risk: retry behavior after a failed payment was not exercised.",
    ].join("\n"),
  },
  "browser-video-recording": {
    scenario: "Turn a short product walkthrough into a polished browser demo recording.",
    input: [
      "# Recording brief",
      "",
      "Page: local product dashboard",
      "Format: 4:3, 60 fps, 4K",
      "Actions:",
      "1. Open the analytics card.",
      "2. Hover the chart.",
      "3. Change the date range.",
      "4. Return to the overview.",
    ].join("\n"),
    output: [
      "# Recording handoff",
      "",
      "- 3840 x 2880 at 60 fps",
      "- natural macOS cursor and deliberate click pauses",
      "- zoom follows the active control",
      "- ffprobe dimensions and duration verified",
      "- contact sheet checked for framing and cursor continuity",
    ].join("\n"),
  },
  "customer-email-draft-threads": {
    scenario: "Triage one new support message while keeping the response in draft.",
    input: [
      "# Customer message",
      "",
      "Subject: Cannot access my project",
      "",
      "I signed in today and my saved project is missing. Can you help me find it?",
      "",
      "Constraint: draft only; do not send or mutate the account.",
    ].join("\n"),
    output: [
      "# Draft handoff",
      "",
      "Status: DRAFTED, NOT SENT",
      "",
      "Draft asks the customer to confirm the sign-in email and project name.",
      "Ownership and project records still require verification before promising a fix.",
      "One canonical follow-up thread is recorded; no duplicate support task was created.",
    ].join("\n"),
  },
  "customer-support-verification": {
    scenario: "Check a refund-support handoff against evidence and authorization boundaries.",
    input: [
      "# Verification packet",
      "",
      "- Customer identity: confirmed",
      "- Charge id: present",
      "- Product ownership: confirmed",
      "- Refund action: not authorized",
      "- Gmail reply: saved as draft",
    ].join("\n"),
    output: [
      "# Gate result",
      "",
      "Status: PASS WITH HOLD",
      "",
      "The investigation and draft are supported by evidence.",
      "The refund must remain unissued until explicit approval is received.",
      "Final handoff must say that the draft is unsent and the mutation is pending.",
    ].join("\n"),
  },
  "daily-ui-inspiration-capture": {
    scenario: "Package a daily reference study into a repeatable design bundle.",
    input: [
      "# Capture brief",
      "",
      "Collect five current landing-page references.",
      "For each: capture the full page, isolate one interaction, and write a reusable prompt.",
      "Avoid duplicates from prior daily bundles.",
    ].join("\n"),
    output: [
      "# Daily bundle",
      "",
      "- 5 verified source links",
      "- 5 full-page captures",
      "- 5 focused section crops",
      "- motion notes based on the live source",
      "- one implementation prompt per interaction",
      "- duplicate and file-integrity checks complete",
    ].join("\n"),
  },
  "elevenlabs-tts": {
    scenario: "Generate a clean product-tour voiceover from a short script.",
    input: [
      "# Voiceover script",
      "",
      "Start with the overview. Open any project to see its activity, collaborators, and latest changes in one place.",
      "",
      "Voice: use the configured neutral product narrator.",
      "Output: MP3 and WAV.",
    ].join("\n"),
    output: [
      "# Audio handoff",
      "",
      "- local voice profile resolved without exposing account data",
      "- MP3 and WAV generated",
      "- duration and file type verified",
      "- spoken copy checked for clipping and unintended pauses",
    ].join("\n"),
  },
  "article-prompts-to-skills": {
    scenario: "Turn three independent prompts from a fictional editorial article into portable skill packages.",
    input: [
      "# Source prompt pack",
      "",
      "1. A bound-aware pointer lens that reveals alternate media.",
      "2. A keyboard-accessible chapter progress rail.",
      "3. Focus-safe animated archive filters.",
      "",
      "Preserve behavior and accessibility. Remove the source page's art direction.",
    ].join("\n"),
    output: [
      "# Skill-package handoff",
      "",
      "1. pointer-lens-reveal",
      "2. chapter-progress-rail",
      "3. accessible-collection-filters",
      "",
      "Each package includes a portable SKILL.md, three prompt levels, a working demo, browser preview, validation evidence, and a narrow commit.",
    ].join("\n"),
  },
  "html-to-interaction-prompts": {
    scenario: "Extract reusable interaction recipes from an existing HTML landing page.",
    input: [
      "# Source",
      "",
      "A local landing page with a sticky hero, word reveal, magnetic CTA, and WebGL background.",
      "",
      "Create one focused prompt per interaction and pair each prompt with visual evidence.",
    ].join("\n"),
    output: [
      "# Interaction prompt pack",
      "",
      "1. Sticky hero progression",
      "2. Masked word reveal",
      "3. Magnetic CTA hover",
      "4. Pointer-reactive background",
      "",
      "Each entry includes source evidence, timing, easing, implementation constraints, and acceptance checks.",
    ].join("\n"),
  },
  "optimize-web-animations": {
    scenario: "Reduce CPU use on an animation-heavy marketing page.",
    input: [
      "# Performance report",
      "",
      "- three requestAnimationFrame loops run continuously",
      "- offscreen canvas remains active",
      "- resize listeners are added on every route visit",
      "- marquee duplicates animate under reduced motion",
    ].join("\n"),
    output: [
      "# Optimization result",
      "",
      "- consolidated animation work into one scheduled loop",
      "- paused canvas and marquee while offscreen",
      "- added listener cleanup on route change",
      "- disabled continuous motion for reduced-motion users",
      "- verified idle CPU returns near baseline",
    ].join("\n"),
  },
  "performance-profiling": {
    scenario: "Plan an evidence-first investigation for an iOS app that stutters after several minutes.",
    input: [
      "# Symptoms",
      "",
      "The timeline starts smoothly, then drops frames after editing for 8–10 minutes.",
      "Memory grows continuously and does not fall after closing the editor.",
    ].join("\n"),
    output: [
      "# Profiling plan",
      "",
      "1. Record a reproducible signposted editing session.",
      "2. Capture Time Profiler and Allocations traces.",
      "3. Compare live-object growth before and after closing the editor.",
      "4. Inspect retain cycles with Memory Graph.",
      "5. Re-run the same scenario after the narrow fix.",
    ].join("\n"),
  },
  "stitched-full-page-capture": {
    scenario: "Repair a full-page screenshot that contains blank animated sections.",
    input: [
      "# Capture problem",
      "",
      "The live page scrolls correctly, but the full-page capture has two gray sections.",
      "Both sections lazy-load images and start their reveal animation only after entering view.",
    ].join("\n"),
    output: [
      "# Capture repair",
      "",
      "- walked the page viewport by viewport",
      "- waited for lazy media and reveal completion",
      "- captured overlapping segments",
      "- stitched against stable landmarks",
      "- verified the final image against a real scroll recording",
    ].join("\n"),
  },
  "video-to-superprompt": {
    scenario: "Translate a 20-second reference video into an implementation-ready recreation prompt.",
    input: [
      "# Video observations",
      "",
      "0–4s: quiet editorial hero",
      "4–10s: title splits while the image scales",
      "10–16s: three cards pin and stack",
      "16–20s: footer is uncovered by the final card",
    ].join("\n"),
    output: [
      "# Superprompt outline",
      "",
      "- visual system and typography",
      "- section-by-section structure",
      "- exact motion chronology",
      "- likely implementation primitives",
      "- responsive and reduced-motion behavior",
      "- asset list and acceptance checks",
    ].join("\n"),
  },
  "x-bookmark-quote-posts": {
    scenario: "Turn a recent saved design post into five voice-calibrated quote-post options.",
    input: [
      "# Source packet",
      "",
      "Saved post: a designer explains why polished prototypes should be tested before a design system is finalized.",
      "Source engagement: above the configured recommendation threshold.",
      "Voice corpus: latest 100 authored posts, with replies used for phrasing only.",
    ].join("\n"),
    output: [
      "# Draft set",
      "",
      "Five materially different first-person options:",
      "- concise observation",
      "- practical lesson",
      "- contrarian framing",
      "- builder workflow",
      "- reflective takeaway",
      "",
      "All drafts remain unsent and link back to the verified source.",
    ].join("\n"),
  },
};

function parseFrontmatter(source) {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) throw new Error("Missing frontmatter");
  const nameMatch = match[1].match(/^name:\s*"?([^"\n]+)"?\s*$/m);
  const descriptionMatch = match[1].match(/^description:\s*(.+)$/m);
  if (!nameMatch || !descriptionMatch) throw new Error("Missing name or description");
  return {
    name: nameMatch[1].trim(),
    description: descriptionMatch[1].trim().replace(/^"|"$/g, ""),
  };
}

function titleCase(value) {
  const labels = {
    cobejs: "Cobe.js",
    css: "CSS",
    gsap: "GSAP",
    html: "HTML",
    js: "JS",
    matterjs: "Matter.js",
    tailwindcss: "Tailwind CSS",
    threejs: "Three.js",
    tts: "TTS",
    ui: "UI",
    vantajs: "Vanta.js",
    webgl: "WebGL",
    x: "X",
  };
  return value
    .split("-")
    .map((part) => labels[part] || part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function hueFor(value) {
  let hash = 0;
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash % 360;
}

function themeFor(slug) {
  const light = /(light|paper|beige|orange|blue-cloudy|agency|book|image-first|landing-page|pricing-page|company-logos|solar|tailwind|design-first|asset-images)/.test(slug);
  const hue = hueFor(slug);
  const accent = slug.includes("green")
    ? "#91ff4f"
    : slug.includes("orange")
      ? "#ff6b2b"
      : slug.includes("purple")
        ? "#d46cff"
        : slug.includes("blue")
          ? "#5d8dff"
          : "hsl(" + hue + " 92% 68%)";
  return light
    ? {
        bg: "#ece9e2",
        panel: "rgba(255,255,255,.68)",
        panelStrong: "#f8f6f1",
        ink: "#171917",
        muted: "#686b66",
        line: "rgba(23,25,23,.16)",
        accent,
      }
    : {
        bg: "#080a0f",
        panel: "rgba(18,21,29,.72)",
        panelStrong: "#121620",
        ink: "#f2f5f7",
        muted: "#929aa7",
        line: "rgba(255,255,255,.14)",
        accent,
      };
}

function kindFor(slug, category) {
  if (category === "codex") return "workflow";
  if (slug === "reveal-hover-effect") return "reveal";
  if (/pricing-page/.test(slug)) return "pricing";
  if (/landing-page/.test(slug)) return "landing";
  if (/(marquee|company-logos)/.test(slug)) return "marquee";
  if (/(solar-duotone|number-details)/.test(slug)) return "icons";
  if (/matterjs/.test(slug)) return "matter";
  if (/gooey-blob/.test(slug)) return "physics";
  if (/(globe|cobejs)/.test(slug)) return "globe";
  if (/(threejs|webgl-3d-object)/.test(slug)) return "object";
  if (/(webgl|threejs|vantajs|unicorn-studio|background-grid|dither|laser|atmosphere|mesh-gradient)/.test(slug)) return "canvas";
  if (/(animation|gsap|scroll|reveal)/.test(slug)) return "motion";
  if (/(shadow|blur|masking|border-gradient|corner|glass|skeuomorphic)/.test(slug)) return "surface";
  if (category === "media") return "media";
  return "layout";
}

function directionFor(slug, kind) {
  if (kind === "workflow") return "Present the workflow as a compact evidence-first input and output handoff.";
  if (kind === "pricing") return "Use a three-plan conversion layout with one clearly recommended plan.";
  if (kind === "landing") return "Use a focused single-offer hero, benefit proof, and one primary call to action.";
  if (kind === "motion") return "Make choreography, easing, and replay behavior the primary demonstration.";
  if (kind === "globe") return "Center a luminous orbital data globe inside a restrained technical interface.";
  if (kind === "object") return "Center a lit, rotating geometric object with visible mesh depth and restrained camera motion.";
  if (kind === "canvas") return "Use a full-bleed procedural canvas atmosphere behind precise interface framing.";
  if (kind === "matter") return "Demonstrate contained 2D bodies with gravity, collision, and a clear reset state.";
  if (kind === "physics") return "Make the central scene visibly responsive, fluid, and continuously simulated.";
  if (kind === "surface") return "Compare the treatment across a hero surface, compact control, and detail card.";
  if (kind === "marquee") return "Demonstrate a seamless duplicated logo loop with a calm, readable speed.";
  if (kind === "icons") return "Show the detail system at multiple scales with consistent alignment and weight.";
  if (kind === "media") return "Present a curated contact sheet with crop, ratio, and intended-use annotations.";
  return "Build a complete editorial hero and supporting card grid that clearly expresses the named visual system.";
}

function checksFor(kind) {
  const common = [
    "Keep the demo responsive from 390px through 1440px.",
    "Use semantic HTML, visible focus states, and reduced-motion handling.",
    "Keep all HTML, CSS, and JavaScript inside demo/index.html.",
    "Use only relative local asset paths.",
  ];
  const specific = {
    workflow: [
      "Show a realistic input and expected output without exposing real customer or account data.",
      "Make authorization boundaries and verification status explicit.",
    ],
    pricing: [
      "Make plan differences scannable and keep one recommendation visually dominant.",
      "Include a keyboard-accessible billing-period control.",
    ],
    motion: [
      "Provide a replay control and stop continuous work when the animation settles.",
      "Remove nonessential movement under prefers-reduced-motion.",
    ],
    globe: [
      "Pause rendering when the page is hidden and resize the canvas without distortion.",
      "Keep labels readable above the visualization.",
    ],
    object: [
      "Show real perspective, mesh depth, and a stable rotation axis.",
      "Pause rendering when the page is hidden and resize without distortion.",
    ],
    canvas: [
      "Keep the canvas decorative and the content readable if rendering is unavailable.",
      "Cap device pixel ratio and pause when the document is hidden.",
    ],
    matter: [
      "Keep simulated bodies inside visible bounds and provide a deterministic reset.",
      "Pause or throttle the simulation when the page is hidden.",
    ],
    physics: [
      "Keep the simulation contained and provide a reset control.",
      "Avoid trapping pointer or keyboard input.",
    ],
    surface: [
      "Preserve readable contrast at the softest and strongest treatment levels.",
      "Avoid clipping focus rings or interactive content.",
    ],
    media: [
      "Label aspect ratio, crop, and use case for each selection.",
      "Treat placeholder source URLs as placeholders, never verified links.",
    ],
  };
  return common.concat(specific[kind] || [
    "Keep the visual hierarchy obvious without explanatory paragraphs.",
    "Use one restrained interaction that supports the design direction.",
  ]);
}

function canonicalDetailsFor(skill, kind) {
  const title = titleCase(skill.name);
  const details = {
    workflow: [
      "Use demo/input.md as the fictional source packet.",
      "Present demo/expected-output.md as the verified handoff beside it.",
    ],
    pricing: [
      "Use Starter at $18, Studio at $42, and Scale at $96.",
      "Mark Studio as Recommended and give it the strongest tinted surface.",
    ],
    landing: [
      "Use the headline Turn the brief into a system.",
      "Pair one dark primary CTA with a quiet secondary action and three compact proof points.",
    ],
    marquee: [
      "Loop Aperture, Nova, Orbit, Mono, Vector, and Kite twice for a seamless track.",
      "Keep the strip edge-masked and readable rather than fast or decorative.",
    ],
    icons: [
      "Show three details numbered 01, 02, and 03.",
      "Use the labels Signal, System, and Orbit with consistent glyph framing.",
    ],
    physics: [
      "Merge three animated circles with an SVG blur-and-threshold filter.",
      "Include a reset control and keep the fluid mass contained inside the stage.",
    ],
    matter: [
      "Simulate fourteen differently sized bodies under gravity inside a bounded canvas.",
      "Use restrained bounce and friction so the system settles instead of exploding.",
    ],
    globe: [
      "Build a 360-point rotating sphere with a faint orbital ellipse.",
      "Overlay a Live field label, 72.4 metric, and Drag to steer hint.",
    ],
    object: [
      "Project and rotate a glowing wireframe cube with eight vertices and visible perspective.",
      "Keep the object centered inside a technical measurement frame.",
    ],
    canvas: [
      "Render eighteen slow procedural wave bands and one narrow moving signal beam.",
      "Place the animated field behind compact live-system metadata.",
    ],
    motion: [
      "Reveal the lines Motion should, explain the, and next state in sequence.",
      "Use a four-part timeline and a keyboard-accessible Replay sequence control.",
    ],
    media: [
      "Show a 16:9 atmospheric landscape, 4:5 editorial portrait, and 1:1 abstract surface.",
      "Label the ratio and intended use beneath every selection.",
    ],
    surface: [
      "Show the treatment on a large Depth without noise surface, one compact metric card, and one control.",
      "Use the same edge, shadow, blur, or masking logic consistently across all three scales.",
    ],
    layout: [
      "Use " + title + " as the central system title.",
      "Pair the hero with three structural cards labeled Frame, Rhythm, and Signal.",
    ],
  };
  return details[kind] || details.layout;
}

function promptMarkdown(skill, kind) {
  if (skill.name === "reveal-hover-effect") return revealPrompt();
  const title = titleCase(skill.name);
  const checks = checksFor(kind);
  return [
    "# " + title + " Demo Prompts",
    "",
    "## Minimal prompt",
    "",
    "Use $" + skill.name + " to create a polished standalone HTML example that clearly demonstrates the skill.",
    "",
    "## Recreate the demo",
    "",
    "Use $" + skill.name + " to build a responsive reference demo for this capability:",
    "",
    "> " + skill.description,
    "",
    "### Direction",
    "",
    directionFor(skill.name, kind),
    "",
    "Use an art-directed composition with one clear focal point, restrained supporting copy, and enough surrounding interface to show how the technique behaves in a real product or landing page.",
    "",
    "### Canonical example",
    "",
    ...canonicalDetailsFor(skill, kind).map((detail) => "- " + detail),
    "",
    "### Deliverable",
    "",
    "- Create demo/index.html as a standalone document.",
    "- Keep CSS and JavaScript inline.",
    "- Put any required images, fonts, models, textures, or vendor files in demo/assets/.",
    "- Do not add a framework, package manager, build step, or node_modules.",
    "- Add controls only when they help inspect or replay the technique.",
    "",
    "### Acceptance checks",
    "",
    ...checks.map((check) => "- " + check),
    "",
    "## Remix prompt",
    "",
    "Use $" + skill.name + " and keep the same implementation contract, but change the subject, copy, palette, and content hierarchy. Preserve the core technique, accessibility behavior, responsive rules, and performance constraints demonstrated by the reference.",
    "",
  ].join("\n");
}

function revealPrompt() {
  return [
    "# Reveal Hover Effect Demo Prompts",
    "",
    "## Minimal prompt",
    "",
    "Use $reveal-hover-effect to build a cursor-following spotlight that reveals a second perfectly aligned image.",
    "",
    "## Recreate the demo",
    "",
    "Use $reveal-hover-effect to create a responsive, full-screen editorial hero called Materia.",
    "",
    "Generate two images at 1586 x 992 with exactly the same composition, crop, camera, lighting, and sculptural shell form:",
    "",
    "1. Default image: quiet mineral plaster in warm beige and ivory.",
    "2. Reveal image: the identical object transformed into opal glass, iridescent color, and polished chrome.",
    "",
    "### Art direction",
    "",
    "- Museum-catalog editorial composition.",
    "- Warm beige background with a subtle 48px technical grid.",
    "- Large serif headline: Matter remembers color.",
    "- Small uppercase metadata, thin rules, and restrained navigation.",
    "- Keep typography and interface above both image layers.",
    "",
    "### Interaction",
    "",
    "- Keep the plaster image permanently visible.",
    "- Stack the opal image exactly above it.",
    "- Reveal the opal image through a 260px cursor-following radial CSS mask.",
    "- Keep the center fully opaque through 40% of the radius.",
    "- Feather through 60%, 75%, and 88%, reaching transparency at 100%.",
    "- Ease pointer position by 0.1 and radius by 0.14.",
    "- Begin the reveal directly under the pointer.",
    "- Handle the first pointer movement when the page loads under a stationary cursor.",
    "- Collapse on pointer exit, pointer cancel, and window blur.",
    "- Stop requestAnimationFrame when the animation settles.",
    "- Recalculate local coordinates after scrolling or resizing.",
    "",
    "### Accessibility",
    "",
    "- Keep the native cursor.",
    "- Show the static plaster image on coarse pointers.",
    "- Add a Reveal material button that toggles the complete opal image.",
    "- Remove trailing movement under reduced-motion preferences.",
    "",
    "### Deliverable",
    "",
    "- Put all HTML, CSS, and JavaScript in demo/index.html.",
    "- Put both optimized images in demo/assets/.",
    "- Do not use React, a build system, external fonts, or package dependencies.",
    "- Use relative asset paths.",
    "",
    "### Acceptance checks",
    "",
    "- Both images remain pixel-aligned at every breakpoint.",
    "- There is no visible mask ring.",
    "- The reveal never sweeps in from the center.",
    "- The animation loop stops when idle.",
    "- The demo works at desktop and mobile sizes.",
    "",
    "## Remix prompt",
    "",
    "Use $reveal-hover-effect to keep this exact interaction and delivery contract, but replace the shell with another subject and generate a new aligned default/reveal pair. Change the editorial copy and palette while preserving the mask stops, accessibility fallbacks, cleanup, and idle-loop behavior.",
    "",
  ].join("\n");
}

function stageMarkup(skill, kind) {
  const title = titleCase(skill.name);
  if (kind === "pricing") {
    return [
      '<div class="pricingWrap">',
      '  <div class="billingBar"><span>Simple plans · cancel anytime</span><button class="billingToggle" type="button" aria-pressed="false">Show annual pricing</button></div>',
      '  <div class="pricing">',
      '    <article><p>Starter</p><strong data-monthly="$18" data-annual="$15">$18</strong><span>For focused prototypes</span><button type="button">Choose starter</button></article>',
      '    <article class="featured"><p>Studio · Recommended</p><strong data-monthly="$42" data-annual="$35">$42</strong><span>For teams shipping weekly</span><button type="button">Start with Studio</button></article>',
      '    <article><p>Scale</p><strong data-monthly="$96" data-annual="$80">$96</strong><span>For multi-product systems</span><button type="button">Talk to us</button></article>',
      "  </div>",
      "</div>",
    ].join("\n");
  }
  if (kind === "landing") {
    return [
      '<div class="landing">',
      '  <span class="kicker">One workspace · zero handoff drift</span>',
      '  <h2>Turn the brief into a system.</h2>',
      '  <p>Shape direction, production, and review around one source of truth.</p>',
      '  <div class="actions"><button>Build a workspace</button><button class="quiet">See the workflow</button></div>',
      '  <div class="proof"><span>4.9/5 team rating</span><span>38% faster review</span><span>24h setup</span></div>',
      "</div>",
    ].join("\n");
  }
  if (kind === "marquee") {
    const logos = ["Aperture", "NOVA", "ORBIT", "MONO", "VECTOR", "KITE"];
    const items = logos.concat(logos).map((logo) => '<span aria-hidden="true">' + logo + "</span>").join("\n");
    return '<div class="marquee"><div class="marqueeTrack">' + items + "</div></div>";
  }
  if (kind === "icons") {
    return [
      '<div class="iconGrid">',
      '  <article><span class="number">01</span><div class="glyph">✦</div><h3>Signal</h3></article>',
      '  <article><span class="number">02</span><div class="glyph">◈</div><h3>System</h3></article>',
      '  <article><span class="number">03</span><div class="glyph">◎</div><h3>Orbit</h3></article>',
      "</div>",
    ].join("\n");
  }
  if (kind === "physics") {
    return [
      '<div class="simulation">',
      '  <svg class="goo" viewBox="0 0 800 420" aria-label="Fluid merging shapes">',
      '    <defs><filter id="goo"><feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur"/><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 24 -10" result="goo"/><feBlend in="SourceGraphic" in2="goo"/></filter></defs>',
      '    <g filter="url(#goo)"><circle cx="310" cy="210" r="92"/><circle class="orb orbA" cx="470" cy="210" r="70"/><circle class="orb orbB" cx="400" cy="125" r="52"/></g>',
      "  </svg>",
      '  <button class="reset">Reset study</button>',
      "</div>",
    ].join("\n");
  }
  if (kind === "globe" || kind === "canvas" || kind === "object" || kind === "matter") {
    const finalControl = kind === "matter"
      ? '<button class="resetBodies" type="button">Reset bodies</button>'
      : "<span>" + (kind === "globe" ? "Auto orbit" : kind === "object" ? "Live rotation" : "Live signal") + "</span>";
    return [
      '<div class="visualization">',
      '  <canvas aria-label="' + escapeHtml(title) + ' procedural visualization"></canvas>',
      '  <div class="vizMeta"><span>Live field</span><strong>72.4</strong>' + finalControl + "</div>",
      "</div>",
    ].join("\n");
  }
  if (kind === "motion") {
    return [
      '<div class="motionStage">',
      '  <p class="maskLine"><span>Motion should</span></p>',
      '  <p class="maskLine"><span>explain the</span></p>',
      '  <p class="maskLine accentLine"><span>next state.</span></p>',
      '  <div class="timeline"><i></i><i></i><i></i><i></i></div>',
      '  <button class="replay">Replay sequence</button>',
      "</div>",
    ].join("\n");
  }
  if (kind === "media") {
    return [
      '<div class="contactSheet">',
      '  <article><div class="asset assetOne"></div><b>Hero landscape</b><span>16:9 · atmospheric</span></article>',
      '  <article><div class="asset assetTwo"></div><b>Editorial portrait</b><span>4:5 · directional light</span></article>',
      '  <article><div class="asset assetThree"></div><b>Abstract surface</b><span>1:1 · quiet texture</span></article>',
      "</div>",
    ].join("\n");
  }
  if (kind === "surface") {
    return [
      '<div class="surfaceStudy">',
      '  <article class="surfaceHero"><span>Primary surface</span><strong>Depth without noise.</strong></article>',
      '  <article class="surfaceCard"><span>Compact card</span><b>24</b><small>Active studies</small></article>',
      '  <button class="surfaceControl">Inspect detail</button>',
      "</div>",
    ].join("\n");
  }
  return [
    '<div class="layoutStudy">',
    '  <div class="layoutHero"><span>Studio system 04</span><h2>' + escapeHtml(title) + "</h2><p>Structure creates the atmosphere before decoration begins.</p></div>",
    '  <div class="layoutCards"><article><b>01</b><span>Frame</span></article><article><b>02</b><span>Rhythm</span></article><article><b>03</b><span>Signal</span></article></div>',
    "</div>",
  ].join("\n");
}

function specificCss(slug, kind) {
  const css = [];
  if (/glass/.test(slug)) css.push(".showcase{backdrop-filter:blur(22px);background:linear-gradient(145deg,rgba(255,255,255,.12),rgba(255,255,255,.035));box-shadow:inset 0 1px rgba(255,255,255,.25),0 28px 80px rgba(0,0,0,.34)}");
  if (/corner-diagonals|framed-tech|technical-wireframe/.test(slug)) css.push(".showcase,.surfaceStudy article,.layoutCards article{clip-path:polygon(0 14px,14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%)}");
  if (/beautiful-shadows|skeuomorphic/.test(slug)) css.push(".showcase{box-shadow:0 1px 2px rgba(0,0,0,.16),0 14px 34px rgba(0,0,0,.18),0 46px 90px rgba(0,0,0,.16),inset 0 1px rgba(255,255,255,.55)}.surfaceControl{box-shadow:inset 0 2px 3px rgba(255,255,255,.65),inset 0 -4px 8px rgba(0,0,0,.22),0 8px 18px rgba(0,0,0,.2)}");
  if (/border-gradient/.test(slug)) css.push(".showcase::before{position:absolute;inset:0;padding:1px;border-radius:inherit;background:linear-gradient(135deg,var(--accent),transparent 36%,rgba(255,255,255,.55),transparent 76%,var(--accent));content:\"\";-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}");
  if (/dither/.test(slug)) css.push("body::after{position:fixed;inset:0;opacity:.17;background-image:radial-gradient(circle at center,currentColor .7px,transparent .8px);background-size:4px 4px;mix-blend-mode:soft-light;pointer-events:none;content:\"\"}");
  if (/paper|beige|book-serif/.test(slug)) css.push("body{background-image:repeating-linear-gradient(97deg,transparent 0 4px,rgba(90,70,40,.018) 5px 6px)}h1,.layoutHero h2{font-family:Iowan Old Style,Baskerville,Georgia,serif;font-weight:400;letter-spacing:-.06em}");
  if (/container|framed-grid|grid-layout/.test(slug)) css.push(".shell::before,.shell::after{position:fixed;top:0;bottom:0;width:1px;background:var(--line);content:\"\"}.shell::before{left:max(20px,calc((100vw - 1280px)/2))}.shell::after{right:max(20px,calc((100vw - 1280px)/2))}");
  if (/alpha-masking/.test(slug)) css.push(".showcase{-webkit-mask-image:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent);mask-image:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent)}");
  if (/progressive-blur/.test(slug)) css.push(".showcase::after{position:absolute;right:0;bottom:0;left:0;height:42%;background:linear-gradient(transparent,var(--panelStrong));backdrop-filter:blur(10px);-webkit-mask-image:linear-gradient(transparent,#000);mask-image:linear-gradient(transparent,#000);content:\"\";pointer-events:none}");
  if (/blue|webgl|laser|tech/.test(slug)) css.push(".showcase{background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:48px 48px}");
  if (/laser/.test(slug)) css.push(".showcase::after{position:absolute;top:-20%;bottom:-20%;left:62%;width:2px;background:#fff;box-shadow:0 0 8px #fff,0 0 26px var(--accent),0 0 80px var(--accent);content:\"\";transform:rotate(10deg);opacity:.9}");
  if (/image-first/.test(slug)) css.push(".layoutHero{background:radial-gradient(circle at 68% 28%,var(--accent),transparent 18%),linear-gradient(145deg,rgba(0,0,0,.06),transparent 58%);min-height:370px;padding:clamp(28px,5vw,68px)}");
  if (/high-contrast/.test(slug)) css.push(".showcase{border-width:2px;box-shadow:inset 0 0 0 8px var(--bg)}");
  if (/nested/.test(slug)) css.push(".showcase{padding:22px}.showcase>div{border:1px solid var(--line);border-radius:22px;padding:20px;background:var(--panelStrong)}");
  if (/editorial/.test(slug)) css.push(".layoutStudy{grid-template-columns:1.45fr .55fr}.layoutHero h2{font-family:Iowan Old Style,Baskerville,Georgia,serif;font-style:italic}");
  if (/orange/.test(slug)) css.push("button{border-radius:999px}.showcase{border-radius:32px}");
  if (/split-layout/.test(slug)) css.push(".layoutStudy{grid-template-columns:1fr 1fr}.layoutHero{border-right:1px solid var(--line)}");
  if (/tailwind/.test(slug)) css.push(".showcase{border-radius:24px}.layoutCards article{border-radius:14px}.layoutHero h2{letter-spacing:-.045em}");
  if (kind === "workflow") css.push(".showcase{min-height:0}");
  return css.join("\n");
}

function visualHtml(skill, category, kind) {
  if (kind === "reveal") return revealHtml();
  const theme = themeFor(skill.name);
  const title = titleCase(skill.name);
  const stage = stageMarkup(skill, kind);
  const description = escapeHtml(skill.description);
  const eyebrow = category.replace("-", " ") + " / reference demo";
  const style = [
    ":root{--bg:" + theme.bg + ";--panel:" + theme.panel + ";--panelStrong:" + theme.panelStrong + ";--ink:" + theme.ink + ";--muted:" + theme.muted + ";--line:" + theme.line + ";--accent:" + theme.accent + ";font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;color:var(--ink);background:var(--bg)}",
    "*{box-sizing:border-box}html{background:var(--bg);scroll-behavior:smooth}body{min-width:320px;margin:0;background:radial-gradient(circle at var(--mx,76%) var(--my,16%),color-mix(in srgb,var(--accent) 16%,transparent),transparent 34%),var(--bg);color:var(--ink)}button,a{font:inherit;color:inherit}button{border:1px solid var(--line);border-radius:999px;padding:11px 15px;background:var(--panel);cursor:pointer}button:hover,button:focus-visible{border-color:var(--accent);outline:2px solid color-mix(in srgb,var(--accent) 42%,transparent);outline-offset:3px}.shell{width:min(1280px,calc(100% - 40px));min-height:100svh;margin:auto;padding:22px 0 40px}.topbar{display:flex;align-items:center;justify-content:space-between;padding:10px 0 30px;border-bottom:1px solid var(--line);font-size:11px;font-weight:700;letter-spacing:.13em;text-transform:uppercase}.brand{display:flex;gap:9px;align-items:center}.brand i{width:9px;height:9px;border-radius:50%;background:var(--accent);box-shadow:0 0 24px var(--accent)}.topbar a{text-decoration:none}.intro{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr);gap:44px;align-items:end;padding:clamp(54px,9vw,116px) 0 42px}.intro small{display:block;margin-bottom:22px;color:var(--muted);font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase}.intro h1{max-width:11ch;margin:0;font-size:clamp(48px,8vw,112px);font-weight:580;letter-spacing:-.075em;line-height:.86}.intro p{max-width:48ch;margin:0;color:var(--muted);font-size:clamp(14px,1.2vw,18px);line-height:1.6}.showcase{position:relative;min-height:470px;overflow:hidden;border:1px solid var(--line);border-radius:18px;background:var(--panel);isolation:isolate}.showcaseHeader{position:absolute;z-index:5;top:18px;right:18px;left:18px;display:flex;justify-content:space-between;color:var(--muted);font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;pointer-events:none}.layoutStudy{display:grid;grid-template-columns:1.15fr .85fr;min-height:470px}.layoutHero{display:flex;flex-direction:column;justify-content:flex-end;padding:clamp(28px,5vw,70px);border-right:1px solid var(--line)}.layoutHero>span,.kicker{color:var(--muted);font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}.layoutHero h2,.landing h2{max-width:9ch;margin:18px 0;font-size:clamp(42px,6vw,84px);line-height:.9;letter-spacing:-.065em}.layoutHero p,.landing p{max-width:38ch;color:var(--muted);line-height:1.55}.layoutCards{display:grid;grid-template-rows:repeat(3,1fr)}.layoutCards article{display:flex;align-items:end;justify-content:space-between;padding:26px;border-bottom:1px solid var(--line)}.layoutCards article:last-child{border:0}.layoutCards b{color:var(--accent);font-size:34px}.layoutCards span{text-transform:uppercase;font-size:10px;letter-spacing:.15em}.pricing{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;min-height:470px;background:var(--line)}.pricing article{display:flex;flex-direction:column;padding:80px 28px 28px;background:var(--panelStrong)}.pricing article.featured{background:linear-gradient(160deg,color-mix(in srgb,var(--accent) 20%,var(--panelStrong)),var(--panelStrong))}.pricing p{font-size:11px;letter-spacing:.13em;text-transform:uppercase}.pricing strong{margin:24px 0 8px;font-size:56px;letter-spacing:-.06em}.pricing span{color:var(--muted)}.pricing button{margin-top:auto}.landing{display:flex;min-height:470px;flex-direction:column;justify-content:center;padding:clamp(40px,8vw,100px);background:radial-gradient(circle at 75% 36%,color-mix(in srgb,var(--accent) 45%,transparent),transparent 24%)}.landing .actions{display:flex;gap:10px;margin-top:24px}.landing .actions button:first-child{color:var(--bg);background:var(--ink)}.landing .proof{display:flex;gap:28px;margin-top:54px;color:var(--muted);font-size:11px}.marquee{display:flex;min-height:470px;align-items:center;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 15%,#000 85%,transparent);mask-image:linear-gradient(90deg,transparent,#000 15%,#000 85%,transparent)}.marqueeTrack{display:flex;width:max-content;animation:marquee 18s linear infinite}.marqueeTrack span{min-width:220px;padding:34px;border:1px solid var(--line);font-size:22px;font-weight:700;letter-spacing:-.04em;text-align:center}.iconGrid,.contactSheet{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;min-height:470px;background:var(--line)}.iconGrid article,.contactSheet article{position:relative;padding:70px 28px 28px;background:var(--panelStrong)}.number{position:absolute;top:22px;right:22px;color:var(--accent);font-size:11px}.glyph{display:grid;width:110px;height:110px;place-items:center;margin:30px auto;border:1px solid var(--line);border-radius:34px;background:linear-gradient(145deg,color-mix(in srgb,var(--accent) 20%,transparent),transparent);font-size:48px}.iconGrid h3{text-align:center}.contactSheet .asset{height:280px;margin-bottom:22px;border-radius:2px;background-size:cover}.assetOne{background:radial-gradient(circle at 70% 30%,#d9f7ff,transparent 20%),linear-gradient(145deg,#203962,#8db3d6 48%,#d7d5c8)}.assetTwo{background:radial-gradient(circle at 50% 28%,#f1c6a2 0 10%,transparent 11%),linear-gradient(120deg,#1b2738,#754c5a 52%,#e1a77f)}.assetThree{background:repeating-radial-gradient(circle at 30% 65%,#c8b8ff 0 9px,#4c4274 10px 18px,#151629 19px 29px)}.contactSheet b,.contactSheet span{display:block}.contactSheet span{margin-top:8px;color:var(--muted);font-size:11px}.surfaceStudy{display:grid;grid-template-columns:1.4fr .6fr;grid-template-rows:1fr auto;gap:18px;min-height:470px;padding:70px 24px 24px}.surfaceStudy article{border:1px solid var(--line);border-radius:20px;background:linear-gradient(145deg,color-mix(in srgb,var(--accent) 12%,var(--panelStrong)),var(--panelStrong))}.surfaceHero{display:flex;grid-row:1/3;flex-direction:column;justify-content:flex-end;padding:42px}.surfaceHero strong{max-width:8ch;margin-top:20px;font-size:clamp(40px,5vw,72px);line-height:.92;letter-spacing:-.06em}.surfaceHero span,.surfaceCard span{color:var(--muted);font-size:10px;letter-spacing:.14em;text-transform:uppercase}.surfaceCard{display:flex;flex-direction:column;padding:26px}.surfaceCard b{margin:auto 0 4px;font-size:56px}.surfaceCard small{color:var(--muted)}.surfaceControl{align-self:end}.motionStage{display:flex;min-height:470px;flex-direction:column;justify-content:center;padding:70px clamp(28px,7vw,90px)}.maskLine{overflow:hidden;margin:0;font-size:clamp(44px,7vw,98px);font-weight:600;letter-spacing:-.075em;line-height:.84}.maskLine span{display:block;transform:translateY(110%);animation:wordIn .8s cubic-bezier(.16,1,.3,1) forwards}.maskLine:nth-child(2) span{animation-delay:.12s}.maskLine:nth-child(3) span{animation-delay:.24s}.accentLine{color:var(--accent)}.timeline{display:flex;gap:8px;margin:42px 0 20px}.timeline i{width:58px;height:3px;background:var(--line);transform-origin:left;animation:grow .8s .42s both}.timeline i:nth-child(2){animation-delay:.54s}.timeline i:nth-child(3){animation-delay:.66s}.timeline i:nth-child(4){animation-delay:.78s}.replay{width:max-content}.visualization{position:relative;min-height:470px}.visualization canvas{position:absolute;inset:0;width:100%;height:100%}.vizMeta{position:absolute;right:28px;bottom:24px;left:28px;display:grid;grid-template-columns:1fr auto 1fr;align-items:end;color:var(--muted);font-size:10px;letter-spacing:.14em;text-transform:uppercase}.vizMeta strong{color:var(--ink);font-size:48px;letter-spacing:-.06em}.vizMeta span:last-child{text-align:right}.simulation{position:relative;min-height:470px}.goo{position:absolute;inset:0;width:100%;height:100%}.goo circle{fill:var(--accent)}.orbA{animation:orbA 4.4s ease-in-out infinite alternate}.orbB{animation:orbB 5.1s ease-in-out infinite alternate}.reset{position:absolute;right:24px;bottom:24px}.demoNote{display:flex;justify-content:space-between;gap:24px;padding:20px 2px;color:var(--muted);font-size:11px;line-height:1.5}.demoNote a{color:var(--ink)}",
    ".pricingWrap{min-height:470px;padding-top:52px}.billingBar{display:flex;align-items:center;justify-content:space-between;min-height:58px;padding:8px 20px;border-top:1px solid var(--line);color:var(--muted);font-size:10px;letter-spacing:.12em;text-transform:uppercase}.billingBar .billingToggle{padding:8px 12px;background:var(--panelStrong);font-size:10px}.pricingWrap .pricing{min-height:360px}.pricingWrap .pricing article{padding:42px 28px 28px}.vizMeta button{justify-self:end;padding:8px 11px;font-size:9px;letter-spacing:.1em;text-transform:uppercase}",
    specificCss(skill.name, kind),
    "@keyframes marquee{to{transform:translateX(-50%)}}@keyframes wordIn{to{transform:translateY(0)}}@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}@keyframes orbA{to{transform:translate(-120px,70px)}}@keyframes orbB{to{transform:translate(80px,120px)}}@media(max-width:760px){.intro{grid-template-columns:1fr;padding-top:60px}.intro h1{font-size:54px}.layoutStudy,.pricing,.iconGrid,.contactSheet,.surfaceStudy{grid-template-columns:1fr}.layoutHero{border-right:0;border-bottom:1px solid var(--line)}.pricing article{min-height:320px}.surfaceHero{grid-row:auto}.showcase{min-height:540px}.topbar span:last-child{display:none}.demoNote{flex-direction:column}.landing .proof{flex-direction:column;gap:8px}.vizMeta{grid-template-columns:1fr auto}.vizMeta span:last-child{display:none}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.marqueeTrack,.maskLine span,.timeline i,.orbA,.orbB{animation:none;transform:none}}",
  ].join("\n");
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    '  <link rel="icon" href="data:,">',
    "  <title>" + escapeHtml(title) + " · Skill Demo</title>",
    "  <style>" + style + "</style>",
    "</head>",
    '<body data-kind="' + kind + '" data-skill="' + escapeHtml(skill.name) + '">',
    '  <main class="shell">',
    '    <nav class="topbar" aria-label="Demo navigation"><a class="brand" href="#"><i></i>' + escapeHtml(title) + "</a><span>Standalone skill reference · 01</span></nav>",
    '    <header class="intro">',
    "      <div><small>" + escapeHtml(eyebrow) + "</small><h1>" + escapeHtml(title) + "</h1></div>",
    "      <p>" + description + "</p>",
    "    </header>",
    '    <section class="showcase" aria-label="' + escapeHtml(title) + ' demonstration">',
    '      <div class="showcaseHeader"><span>Live example</span><span>' + escapeHtml(kind) + "</span></div>",
    stage,
    "    </section>",
    '    <footer class="demoNote"><span>Open <strong>PROMPT.md</strong> for the exact recreation and remix prompts.</span><a href="PROMPT.md">Read prompt →</a></footer>',
    "  </main>",
    "  <script>" + genericScript(kind) + "</script>",
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

function genericScript(kind) {
  const canvasMode = ["globe", "object", "matter"].includes(kind) ? kind : "field";
  return [
    'const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;',
    'addEventListener("pointermove",event=>{document.body.style.setProperty("--mx",event.clientX+"px");document.body.style.setProperty("--my",event.clientY+"px")},{passive:true});',
    'const billing=document.querySelector(".billingToggle");if(billing)billing.addEventListener("click",()=>{const annual=billing.getAttribute("aria-pressed")!=="true";billing.setAttribute("aria-pressed",String(annual));billing.textContent=annual?"Show monthly pricing":"Show annual pricing";document.querySelectorAll(".pricing strong").forEach(price=>price.textContent=annual?price.dataset.annual:price.dataset.monthly)});',
    'const replay=document.querySelector(".replay");if(replay)replay.addEventListener("click",()=>{document.querySelectorAll(".maskLine span,.timeline i").forEach(node=>{node.style.animation="none";node.offsetHeight;node.style.animation=""})});',
    'const reset=document.querySelector(".reset");if(reset)reset.addEventListener("click",()=>document.querySelectorAll(".orbA,.orbB").forEach(node=>{node.style.animation="none";node.offsetHeight;node.style.animation=""}));',
    'const canvas=document.querySelector("canvas");if(canvas&&!reduced){',
    'const context=canvas.getContext("2d");let width=0,height=0,frame=0,time=0;const mode="' + canvasMode + '";const bodies=Array.from({length:14},(_,i)=>({x:80+(i%7)*92,y:40+Math.floor(i/7)*70,vx:(i%3-1)*.7,vy:0,r:12+(i%4)*5}));',
    'const resetBodies=()=>bodies.forEach((body,i)=>{body.x=40+(i%7)*Math.max(32,(width-80)/6);body.y=35+Math.floor(i/7)*58;body.vx=(i%3-1)*.7;body.vy=0});const resetBodiesButton=document.querySelector(".resetBodies");if(resetBodiesButton)resetBodiesButton.addEventListener("click",resetBodies);',
    'const resize=()=>{const rect=canvas.getBoundingClientRect();const ratio=Math.min(devicePixelRatio||1,2);width=rect.width;height=rect.height;canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);context.setTransform(ratio,0,0,ratio,0,0)};',
    'const draw=()=>{frame=requestAnimationFrame(draw);time+=.008;context.clearRect(0,0,width,height);const accent=getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();if(mode==="globe"){const radius=Math.min(width,height)*.29;const cx=width*.5,cy=height*.47;context.fillStyle=accent;for(let i=0;i<360;i++){const phi=Math.acos(1-2*(i+.5)/360);const theta=Math.PI*(1+Math.sqrt(5))*i+time;const x=Math.sin(phi)*Math.cos(theta);const y=Math.cos(phi);const z=Math.sin(phi)*Math.sin(theta);const scale=(z+1.7)/2.7;context.globalAlpha=.16+.74*scale;context.beginPath();context.arc(cx+x*radius,cy+y*radius,Math.max(.7,2.2*scale),0,Math.PI*2);context.fill()}context.globalAlpha=.16;context.strokeStyle=accent;context.beginPath();context.ellipse(cx,cy+radius*.18,radius*1.34,radius*.34,time*.4,0,Math.PI*2);context.stroke()}else if(mode==="object"){const size=Math.min(width,height)*.24,cx=width*.5,cy=height*.48;const vertices=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];const edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];const points=vertices.map(([x,y,z])=>{const a=time*1.1,b=time*.73;const x1=x*Math.cos(a)-z*Math.sin(a),z1=x*Math.sin(a)+z*Math.cos(a),y1=y*Math.cos(b)-z1*Math.sin(b),z2=y*Math.sin(b)+z1*Math.cos(b),p=3.8/(z2+5);return{x:cx+x1*size*p,y:cy+y1*size*p,z:z2,p}});context.strokeStyle=accent;context.lineWidth=1.4;context.shadowColor=accent;context.shadowBlur=12;for(const [a,b] of edges){context.globalAlpha=.25+.45*((points[a].z+points[b].z+4)/8);context.beginPath();context.moveTo(points[a].x,points[a].y);context.lineTo(points[b].x,points[b].y);context.stroke()}context.fillStyle=accent;for(const point of points){context.globalAlpha=.55+.35*(point.z+2)/4;context.beginPath();context.arc(point.x,point.y,3.2*point.p,0,Math.PI*2);context.fill()}context.shadowBlur=0}else if(mode==="matter"){context.fillStyle=accent;for(const body of bodies){body.vy+=.16;body.x+=body.vx;body.y+=body.vy;if(body.x<body.r||body.x>width-body.r){body.vx*=-.94;body.x=Math.max(body.r,Math.min(width-body.r,body.x))}if(body.y>height-body.r-30){body.y=height-body.r-30;body.vy*=-.78}context.globalAlpha=.28+.45*(body.r/32);context.beginPath();context.arc(body.x,body.y,body.r,0,Math.PI*2);context.fill()}context.globalAlpha=.22;context.fillRect(0,height-31,width,1)}else{context.strokeStyle=accent;context.lineWidth=1;for(let i=0;i<18;i++){const y=(i/17)*height;context.globalAlpha=.08+.12*Math.sin(time+i*.4);context.beginPath();for(let x=0;x<=width;x+=12){const wave=Math.sin(x*.012+i*.54+time*3)*18*Math.sin(i/17*Math.PI);context.lineTo(x,y+wave)}context.stroke()}context.globalAlpha=.65;const x=width*(.52+.16*Math.sin(time*.6));const gradient=context.createLinearGradient(x,0,x+2,0);gradient.addColorStop(0,"transparent");gradient.addColorStop(.5,"white");gradient.addColorStop(1,"transparent");context.fillStyle=gradient;context.fillRect(x,0,3,height)}};',
    'resize();new ResizeObserver(resize).observe(canvas);const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0}else if(!frame)draw()};document.addEventListener("visibilitychange",visibility);draw();}',
  ].join("");
}

function workflowHtml(skill, example) {
  const theme = themeFor(skill.name);
  const title = titleCase(skill.name);
  const input = escapeHtml(example.input);
  const output = escapeHtml(example.output);
  const css = [
    ":root{--bg:" + theme.bg + ";--panel:" + theme.panel + ";--ink:" + theme.ink + ";--muted:" + theme.muted + ";--line:" + theme.line + ";--accent:" + theme.accent + ";font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;color:var(--ink);background:var(--bg)}",
    "*{box-sizing:border-box}body{min-width:320px;margin:0;background:radial-gradient(circle at 80% 0,color-mix(in srgb,var(--accent) 18%,transparent),transparent 34%),var(--bg);color:var(--ink)}main{width:min(1220px,calc(100% - 40px));margin:auto;padding:22px 0 48px}nav{display:flex;align-items:center;justify-content:space-between;padding:12px 0 28px;border-bottom:1px solid var(--line);font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}nav span:first-child{display:flex;gap:9px;align-items:center}nav i{width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 18px var(--accent)}header{display:grid;grid-template-columns:1.1fr .9fr;gap:48px;align-items:end;padding:clamp(52px,8vw,100px) 0 40px}h1{max-width:11ch;margin:0;font-size:clamp(46px,7vw,88px);line-height:.9;letter-spacing:-.065em}header p{max-width:52ch;margin:0;color:var(--muted);line-height:1.65}.scenario{padding:18px 22px;border:1px solid var(--line);border-bottom:0;border-radius:18px 18px 0 0;background:var(--panel);color:var(--muted);font-size:12px}.scenario b{color:var(--ink)}.handoff{display:grid;grid-template-columns:1fr 1fr;gap:1px;overflow:hidden;border:1px solid var(--line);border-radius:0 0 18px 18px;background:var(--line)}article{min-width:0;padding:26px;background:var(--panel)}article>span{display:block;margin-bottom:20px;color:var(--accent);font-size:9px;font-weight:800;letter-spacing:.15em;text-transform:uppercase}pre{min-height:330px;margin:0;overflow:auto;white-space:pre-wrap;color:var(--ink);font:12px/1.65 ui-monospace,SFMono-Regular,Menlo,monospace}.links{display:flex;justify-content:space-between;padding:18px 2px;color:var(--muted);font-size:11px}.links a{color:var(--ink)}@media(max-width:760px){header,.handoff{grid-template-columns:1fr}header{gap:24px}h1{font-size:52px}pre{min-height:0}.links{flex-direction:column;gap:10px}}",
  ].join("");
  return [
    "<!doctype html>",
    '<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" href="data:,">',
    "<title>" + escapeHtml(title) + " · Workflow Demo</title><style>" + css + "</style></head>",
    "<body><main>",
    '<nav><span><i></i>' + escapeHtml(title) + "</span><span>Workflow reference · 01</span></nav>",
    "<header><h1>" + escapeHtml(title) + "</h1><p>" + escapeHtml(skill.description) + "</p></header>",
    '<div class="scenario"><b>Scenario:</b> ' + escapeHtml(example.scenario) + "</div>",
    '<section class="handoff" aria-label="Example input and expected output">',
    '<article><span>Example input</span><pre>' + input + "</pre></article>",
    '<article><span>Expected output</span><pre>' + output + "</pre></article>",
    "</section>",
    '<footer class="links"><span>Portable fictional example. No live account or customer data.</span><span><a href="PROMPT.md">Prompt</a> · <a href="input.md">Input</a> · <a href="expected-output.md">Output</a></span></footer>',
    "</main></body></html>",
    "",
  ].join("\n");
}

function revealHtml() {
  const css = [
    ":root{--ink:#1c1b19;--paper:#e9e2d7;font-family:\"Helvetica Neue\",Arial,sans-serif;color:var(--ink);background:var(--paper)}*{box-sizing:border-box}body{min-width:320px;margin:0;background:var(--paper)}button,a{color:inherit;font:inherit}.hero{--reveal-x:68%;--reveal-y:52%;--reveal-radius:0px;position:relative;isolation:isolate;min-height:100svh;overflow:hidden;background:#d9d0c4;contain:paint}.hero::before{position:absolute;z-index:2;inset:0;background:linear-gradient(90deg,rgba(231,224,213,.94) 0%,rgba(231,224,213,.76) 23%,rgba(231,224,213,.22) 46%,transparent 66%),linear-gradient(180deg,rgba(0,0,0,.07),transparent 22% 78%,rgba(0,0,0,.1));pointer-events:none;content:\"\"}.hero::after{position:absolute;z-index:2;inset:0;opacity:.07;background-image:linear-gradient(to right,rgba(28,27,25,.65) 1px,transparent 1px),linear-gradient(to bottom,rgba(28,27,25,.65) 1px,transparent 1px);background-size:48px 48px;pointer-events:none;content:\"\"}.heroArt{position:absolute;z-index:0;inset:0}.heroImage{position:absolute;inset:0;display:block;width:100%;height:100%;user-select:none;object-fit:cover;object-position:center}.overlay{z-index:1;pointer-events:none;-webkit-mask-image:radial-gradient(circle var(--reveal-radius) at var(--reveal-x) var(--reveal-y),#000 0%,#000 40%,rgba(0,0,0,.75) 60%,rgba(0,0,0,.4) 75%,rgba(0,0,0,.12) 88%,transparent 100%);mask-image:radial-gradient(circle var(--reveal-radius) at var(--reveal-x) var(--reveal-y),#000 0%,#000 40%,rgba(0,0,0,.75) 60%,rgba(0,0,0,.4) 75%,rgba(0,0,0,.12) 88%,transparent 100%);-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;will-change:-webkit-mask-image,mask-image}.hero.pinned .overlay{-webkit-mask-image:none;mask-image:none}.topbar{position:relative;z-index:4;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;min-height:92px;padding:0 clamp(22px,3.5vw,56px);border-bottom:1px solid rgba(28,27,25,.2);font-size:11px;font-weight:600;letter-spacing:.13em;text-transform:uppercase}.brand{display:inline-flex;gap:10px;align-items:center;width:max-content;text-decoration:none}.mark{width:13px;height:13px;border:1px solid currentColor;border-radius:50%;background:radial-gradient(circle at 35% 32%,#f2e4c7 0 12%,transparent 13%),conic-gradient(from 20deg,#17225a,#6f75fa,#e1a474,#17225a)}.edition{display:flex;gap:24px}.edition span+span{padding-left:24px;border-left:1px solid rgba(28,27,25,.25)}.toggle{display:inline-flex;gap:9px;align-items:center;justify-self:end;padding:12px 15px;border:1px solid rgba(28,27,25,.36);border-radius:999px;background:rgba(235,228,216,.42);cursor:pointer;letter-spacing:.08em;text-transform:uppercase;backdrop-filter:blur(12px)}.toggle:hover,.toggle:focus-visible,.toggle[aria-pressed=true]{color:#f5f0e8;background:#1e1d1a;outline:none}.toggle i{width:6px;height:6px;border-radius:50%;background:currentColor}.content{position:relative;z-index:3;width:min(48rem,52vw);padding:clamp(64px,11vh,132px) 0 150px clamp(22px,3.5vw,56px)}.eyebrow{display:flex;gap:24px;margin-bottom:clamp(28px,5vh,58px);font-size:10px;font-weight:600;letter-spacing:.15em;text-transform:uppercase}.content h1{max-width:7.2ch;margin:0;font-family:\"Iowan Old Style\",Baskerville,Georgia,serif;font-size:clamp(4.2rem,8.1vw,9.25rem);font-weight:400;letter-spacing:-.075em;line-height:.78}.content h1 span{display:block;margin-left:.22em;font-style:italic;letter-spacing:-.09em}.lede{max-width:32rem;margin:clamp(34px,5.4vh,62px) 0 0;font-size:clamp(13px,1.05vw,16px);line-height:1.55}.instruction{position:absolute;z-index:4;right:clamp(24px,4vw,64px);bottom:118px;font-size:9px;font-weight:650;letter-spacing:.17em;text-transform:uppercase;transform:rotate(-90deg) translateX(100%);transform-origin:right bottom}.footer{position:absolute;z-index:4;right:0;bottom:0;left:0;display:grid;grid-template-columns:1fr auto 72px;align-items:end;min-height:92px;padding:18px clamp(22px,3.5vw,56px);border-top:1px solid rgba(28,27,25,.2);font-size:10px;font-weight:590;letter-spacing:.12em;text-transform:uppercase}.footer p{margin:0}.footer p>span{display:block;margin-top:7px;color:rgba(28,27,25,.58);font-size:8px}.footerMeta{display:flex;gap:44px;padding-right:clamp(40px,6vw,100px)}.count{text-align:right}@media(max-width:760px){.topbar{grid-template-columns:1fr auto}.edition{display:none}.content{width:88vw;padding-top:86px}.content h1{font-size:clamp(4rem,19vw,6rem)}.footer{grid-template-columns:1fr auto}.footerMeta{display:none}}@media(hover:none),(pointer:coarse){.overlay{display:none}.hero.pinned .overlay{display:block}}@media(prefers-reduced-motion:reduce){.overlay{will-change:auto}}",
  ].join("");
  const script = [
    'const hero=document.querySelector(".hero"),toggle=document.querySelector(".toggle"),fine=matchMedia("(hover:hover) and (pointer:fine)"),reduce=matchMedia("(prefers-reduced-motion:reduce)");',
    'toggle.addEventListener("click",()=>{const pinned=hero.classList.toggle("pinned");toggle.setAttribute("aria-pressed",String(pinned));toggle.lastChild.textContent=pinned?" Return to plaster":" Reveal material"});',
    'if(fine.matches){const s={x:0,y:0,tx:0,ty:0,r:0,tr:0,cx:0,cy:0,inside:false,frame:0};const target=(cx,cy)=>{const rect=hero.getBoundingClientRect();s.cx=cx;s.cy=cy;s.tx=cx-rect.left;s.ty=cy-rect.top};const schedule=()=>{if(!s.frame)s.frame=requestAnimationFrame(tick)};const tick=()=>{s.frame=0;const pe=reduce.matches?1:.1,re=reduce.matches?1:.14;s.x+=(s.tx-s.x)*pe;s.y+=(s.ty-s.y)*pe;s.r+=(s.tr-s.r)*re;hero.style.setProperty("--reveal-x",s.x.toFixed(2)+"px");hero.style.setProperty("--reveal-y",s.y.toFixed(2)+"px");hero.style.setProperty("--reveal-radius",s.r.toFixed(2)+"px");if(Math.abs(s.tx-s.x)>.1||Math.abs(s.ty-s.y)>.1||Math.abs(s.tr-s.r)>.1)schedule()};const show=e=>{s.inside=true;target(e.clientX,e.clientY);if(s.r<.5){s.x=s.tx;s.y=s.ty}s.tr=260;schedule()};const move=e=>{target(e.clientX,e.clientY);if(!s.inside){s.inside=true;if(s.r<.5){s.x=s.tx;s.y=s.ty}s.tr=260}schedule()};const hide=()=>{s.inside=false;s.tr=0;schedule()};const viewport=()=>{if(s.inside){target(s.cx,s.cy);schedule()}};hero.addEventListener("pointerenter",show);hero.addEventListener("pointermove",move);hero.addEventListener("pointerleave",hide);hero.addEventListener("pointercancel",hide);addEventListener("blur",hide);addEventListener("scroll",viewport,{passive:true});new ResizeObserver(viewport).observe(hero)}',
  ].join("");
  return [
    "<!doctype html>",
    '<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" href="data:,">',
    "<title>Materia · Reveal Hover Effect</title><style>" + css + "</style></head>",
    '<body><main class="hero" data-reveal-hover>',
    '<div class="heroArt" aria-hidden="true"><img class="heroImage" src="assets/hero-plaster.webp" alt="" width="1586" height="992"><img class="heroImage overlay" src="assets/hero-opal.webp" alt="" width="1586" height="992"></div>',
    '<header class="topbar"><a class="brand" href="#" aria-label="Materia home"><i class="mark"></i>MATERIA</a><div class="edition"><span>Research object 07</span><span>Tokyo · 2026</span></div><button class="toggle" type="button" aria-pressed="false"><i></i> Reveal material</button></header>',
    '<section class="content" aria-labelledby="title"><div class="eyebrow"><span>Material study · No. 07</span><span>Light as interface</span></div><h1 id="title">Matter<span>remembers</span>color.</h1><p class="lede">A study in latent surfaces. Move through the field to let opal, chrome, and light emerge from the quiet form.</p></section>',
    '<div class="instruction" aria-hidden="true">Move to reveal</div>',
    '<footer class="footer"><p>Iris Conch<span>Generative material archive</span></p><p class="footerMeta"><span>Base / mineral plaster</span><span>Reveal / opal glass + chrome</span></p><p class="count">07 / 12</p></footer>',
    "</main><script>" + script + "</script></body></html>",
    "",
  ].join("\n");
}

async function writeDemo(skillFile) {
  const absoluteSkillFile = path.join(root, skillFile);
  const skillDirectory = path.dirname(absoluteSkillFile);
  const category = skillFile.split("/")[1];
  const source = await readFile(absoluteSkillFile, "utf8");
  const skill = parseFrontmatter(source);
  const kind = kindFor(skill.name, category);
  const demoDirectory = path.join(skillDirectory, "demo");
  await mkdir(demoDirectory, { recursive: true });
  const sourceManifestFile = path.join(demoDirectory, "source.json");
  const sourceDerived = existsSync(sourceManifestFile);
  const writeGenerated = async (file, content) => {
    if (!sourceDerived && (force || !existsSync(file))) await writeFile(file, content);
  };
  await writeGenerated(path.join(demoDirectory, "PROMPT.md"), promptMarkdown(skill, kind));
  if (kind === "workflow") {
    const example = workflowExamples[skill.name];
    if (!example) throw new Error("Missing workflow example for " + skill.name);
    await writeGenerated(path.join(demoDirectory, "input.md"), example.input + "\n");
    await writeGenerated(path.join(demoDirectory, "expected-output.md"), example.output + "\n");
    await writeGenerated(path.join(demoDirectory, "index.html"), workflowHtml(skill, example));
  } else {
    await writeGenerated(path.join(demoDirectory, "index.html"), visualHtml(skill, category, kind));
  }
  let demoSource = null;
  if (sourceDerived) {
    demoSource = JSON.parse(await readFile(sourceManifestFile, "utf8"));
  }
  return { category, kind, name: skill.name, skillFile, source: demoSource };
}

const demos = [];
for (const skillFile of skillFiles) demos.push(await writeDemo(skillFile));

const counts = demos.reduce((result, demo) => {
  result[demo.category] = (result[demo.category] || 0) + 1;
  return result;
}, {});
const fence = String.fromCharCode(96).repeat(3);
const index = [
  "# Skill Demos",
  "",
  "Every tracked skill has a portable demo and the exact prompt needed to recreate or remix it.",
  "",
  "## Folder contract",
  "",
  fence + "text",
  "agent-skills/<category>/<skill-name>/",
  "  SKILL.md",
  "  demo/",
  "    index.html",
  "    PROMPT.md",
  "    preview.jpg         # rendered 1280 x 720 browser screenshot",
  "    source.json          # Neuform provenance and ranking snapshot",
  "    assets/              # only when local assets are required",
  "    input.md             # workflow skills",
  "    expected-output.md   # workflow skills",
  fence,
  "",
  "- Keep HTML, CSS, and JavaScript in demo/index.html.",
  "- Keep images, fonts, models, textures, and vendored files inside demo/assets/.",
  "- Keep one rendered 1280 x 720 browser screenshot in demo/preview.jpg.",
  "- Use relative paths and no build step.",
  "- Keep the exact recreation prompt and a shorter remix prompt in demo/PROMPT.md.",
  "- Use fictional portable data in workflow examples.",
  "- Neuform-sourced demos preserve the real generated HTML and may retain pinned CDN runtime dependencies.",
  "- Browse every rendered example in [SCREENSHOTS.md](SCREENSHOTS.md) or the [visual browser gallery](SCREENSHOTS.html).",
  "",
  "Run any demo with:",
  "",
  fence + "bash",
  "python3 -m http.server 4173 -d agent-skills/<category>/<skill-name>/demo",
  fence,
  "",
  "Fill missing demo files without replacing hand-tuned examples:",
  "",
  fence + "bash",
  "node scripts/backfill-skill-demos.mjs",
  fence,
  "",
  "Refresh exact Neuform matches from their current top-ranked public design:",
  "",
  fence + "bash",
  "node scripts/sync-neuform-skill-demos.mjs",
  fence,
  "",
  "Rebuild the screenshot gallery after refreshing browser captures:",
  "",
  fence + "bash",
  "node scripts/build-demo-screenshot-gallery.mjs",
  fence,
  "",
  "Use --force only when every locally generated demo should be intentionally regenerated. Source-derived demos are never replaced by the generic backfill.",
  "",
  "## Library coverage",
  "",
  "- Total: " + demos.length,
  ...Object.entries(counts).sort().map(([category, count]) => "- " + category + ": " + count),
  "",
  "## Demo index",
  "",
  "| Skill | Category | Demo | Preview | Prompt | Source |",
  "| --- | --- | --- | --- | --- | --- |",
  ...demos.map((demo) => {
    const base = path.dirname(demo.skillFile).replaceAll(path.sep, "/");
    const source = demo.source
      ? "[Neuform #1 · " + new Intl.NumberFormat("en-US").format(Number(demo.source?.design?.view_count) || 0) + " views](" + base + "/demo/source.json)"
      : "Local";
    return "| " + demo.name + " | " + demo.category + " | [Open](" + base + "/demo/index.html) | [Preview](" + base + "/demo/preview.jpg) | [Prompt](" + base + "/demo/PROMPT.md) | " + source + " |";
  }),
  "",
].join("\n");
await writeFile(path.join(root, "DEMOS.md"), index);

console.log((force ? "Regenerated " : "Checked and filled ") + demos.length + " skill demos.");
for (const [category, count] of Object.entries(counts).sort()) {
  console.log("- " + category + ": " + count);
}
