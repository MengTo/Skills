---
name: scroll-world-storytelling
description: "Turn an article, case study, brand narrative, product journey, or long-form story into a cinematic scroll-driven landing page using one of three renderers: scrubbed video, a real-time Three.js world, or semantic HTML/SVG data and typography. Use when the user asks for a scroll world, fly-through landing page, article-to-website transformation, animated planet, data scrollytelling, video-scrubbed page, connected visual journey, or story-led alternative to ordinary stacked sections."
---

# Scroll World Storytelling

Turn source material into one connected journey. Scroll advances a visual world and the copy reveals the story in deliberate beats.

The skill has exactly three production modes. Choose one primary mode before building:

1. **Video scrub** — generated or filmed footage, mapped to scroll.
2. **Three.js world** — a real-time 3D object, place, planet, or system.
3. **HTML / data / type** — semantic DOM, SVG charts, metrics, and kinetic typography.

Do not mix modes by default. A focused renderer produces a clearer concept, smaller test surface, and more reliable fallback.

## Start with the contract

Write these blocks before implementation.

### Goal

> Turn the supplied story into a one-page journey with 5–7 memorable beats and one final action. A first-time visitor should understand the thesis, tension, mechanism, proof, and payoff without reading the source.

### House rules

- Preserve the source thesis, sequence, facts, and caveats. Never invent proof.
- Use one connected world, one dominant motion grammar, and one art direction.
- Let motion carry transitions; let copy explain meaning.
- Keep one primary CTA. Keep navigation and utility controls quiet.
- Keep native, reversible document scrolling. Never hijack the wheel.
- Never spend generation credits, publish, deploy, or replace production files without approval.
- Keep builder and verifier separate when agents are available.

### Bar

- A visitor can explain the arc after one pass.
- Scrolling works forward, backward, slowly, and with a fast flick.
- No visible jump, flash, or unintended reversal at a seam.
- The page remains legible on mobile and with reduced motion.
- Every completion claim includes browser, console, responsive, and asset evidence.

## Read the whole source

1. Read the complete article or narrative.
2. Inspect the target repo, framework, asset pipeline, and current page.
3. Separate source facts from presentation ideas.
4. Collect supplied brand assets and 2–3 references when available.
5. Identify the one action the story should earn.

If a local daily-inspiration archive exists, inspect the latest one or two capture articles, their stills, and representative local motion files before choosing the art direction. Extract principles such as palette, hierarchy, material, composition, and motion; do not copy layouts literally or upload local reference files to an external generator without explicit approval.

When reuse rights are unclear, paraphrase the source and keep quotations short. Never fabricate testimonials, metrics, or customer claims.

## Build the story map

Reduce the source to 5–7 beats:

1. **Hook** — the promise or surprising thesis.
2. **Old way** — the friction or belief being rejected.
3. **New rule** — the idea that changes the route.
4. **Mechanism** — how the system works.
5. **Proof** — the strongest evidence.
6. **Payoff** — the transformed end state.
7. **Action** — one next step.

Create a beat ledger before code:

| Field | Constraint |
| --- | --- |
| id | short stable slug |
| scene | what exists in the visual world |
| eyebrow | 2–4 words |
| headline | 3–8 words |
| body | one sentence, ideally under 24 words |
| evidence | exact source fact or asset |
| motion | one clear verb phrase |
| scroll weight | 0.7–1.8 viewport heights |
| CTA | final beat only unless required earlier |

Combine repeated arguments. Do not turn every paragraph into a scene.

## Write the style bible

Define:

- Mood: three precise adjectives.
- World metaphor: one place or system that can hold every beat.
- Palette: 4–6 named colors with one dominant field and one accent.
- Typography: one display voice and one reading voice.
- Material language: one system such as paper, glass, clay, photographic, or mechanical.
- Motion grammar: forward glide, orbit, crane, lateral track, dive, or staged reveal.
- Pacing: where the story pauses and where it moves quickly.
- Exclusions: three visual clichés to avoid.

For generated media, reuse the style preamble byte-for-byte in every asset prompt.

## Choose one mode

| Choose | Best for | Strength | Main cost |
| --- | --- | --- | --- |
| Video scrub | cinematic realism, places, products, pre-rendered camera moves | exact art direction and photographic finish | heavier assets and seek tuning |
| Three.js world | planets, objects, maps, systems, spatial interaction | real-time depth and responsive camera control | WebGL performance and fallback work |
| HTML / data / type | reports, launches, metrics, editorial stories | accessible, crisp, lightweight, content-first | less photographic spectacle |

If the story is primarily proof and numbers, prefer HTML/data. If the central metaphor is spatial and interactive, prefer Three.js. If cinematic imagery is the idea, prefer video.

## Mode 1 — Video scrub

Use [demo/video/index.html](demo/video/index.html) and [demo/video/PROMPT.md](demo/video/PROMPT.md).

### Generate the source clip

1. Choose one continuous 6–15 second camera move. Avoid cuts.
2. Write three materially different style studies before generating: change the dominant field, material language, lighting, and composition—not just the accent color.
3. Keep important subjects near center with usable headline space.
4. Generate a short calibration clip before the final render when paid tools are used.
5. For multi-leg journeys, start each leg from the previous leg's actual rendered last frame.
6. Keep raw masters and record provider, model, prompt, seed, duration, aspect ratio, and rights.

When the user requests Grok Imagine, use its current video interface or API, choose Video, set the requested aspect ratio, duration, and resolution, and generate the approved style studies. Prefer 16:9, 6–10 seconds, and 720p for a first landing-page pass unless the brief requires otherwise. Never substitute a procedural placeholder and call it generated footage.

Preferred prompt shape:

> Single continuous [camera move], no cuts. Travel through [world metaphor] from [opening] to [payoff]. [Exact scene sequence]. [Byte-identical style preamble]. Center-safe composition, quiet negative space for editorial copy, no text, no logos, no captions.

Do not promise seamless connectors unless the model accepts the required start frame, or both endpoints for a connector.

### Encode for scrubbing

~~~bash
ffmpeg -i source.mp4 -an \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
  -g 8 -keyint_min 8 -sc_threshold 0 \
  -movflags +faststart output.mp4
~~~

- Use one codec and encode profile across every clip.
- Strip audio unless the experience explicitly includes it.
- Keep small GOPs for responsive seeking.
- Use byte-range hosting or fetch to a Blob URL before scrubbing.
- Keep the first frame as a poster until video paints.
- Map one normalized scroll value to `currentTime`; coalesce seeks in `requestAnimationFrame`.
- Reduced motion uses the poster or ordered stills with ordinary document flow.

## Mode 2 — Three.js world

Use [demo/threejs/index.html](demo/threejs/index.html) and [demo/threejs/PROMPT.md](demo/threejs/PROMPT.md).

1. Produce three art-direction studies before committing. Each must change the field color, object material, light behavior, typography relationship, and composition—not just shader colors.
2. Reject the generic default of a glowing blue planet in dark space unless the source specifically earns it.
3. Create one scene, perspective camera, renderer, and world group.
4. Make the hero object carry the metaphor: sculpture, machine, archive, constellation, city, product, or a non-literal planetary system.
5. Map scroll progress to camera position, camera target, object rotation, lights, and scene states.
6. Keep ambient motion subtle; scroll must remain the primary conductor.
7. Cap device pixel ratio at 2 and update renderer and camera on resize.
8. Pause continuous rendering when the page is hidden or off-screen.
9. Dispose geometries, materials, textures, and listeners during teardown.
10. Provide a static CSS/SVG poster when WebGL fails or reduced motion is requested.

Use local, pinned Three.js files in portable demos. Do not depend on a remote CDN for the core renderer.

## Mode 3 — HTML / data / type

Use [demo/html-data/index.html](demo/html-data/index.html) and [demo/html-data/PROMPT.md](demo/html-data/PROMPT.md).

1. Start with semantic headings, paragraphs, lists, tables, and real links.
2. Turn the strongest evidence into one chart grammar: bars, line, range, slope, or comparison.
3. Use inline SVG only when a DOM chart needs paths or axes; keep labels as selectable text.
4. Drive CSS custom properties from one normalized scroll value.
5. Animate transforms, opacity, clip paths, counters, and SVG stroke offsets.
6. Keep chart scales truthful and expose values in accessible text or a table.
7. Let the page remain complete and readable when JavaScript is disabled.
8. Reduced motion removes interpolation while preserving state changes and order.

This mode should not secretly become Canvas or WebGL. Its advantage is native layout, accessibility, and sharp responsive typography.

## Shared page contract

Keep content separate from renderer code:

~~~js
const story = {
  title: "The journey",
  cta: { label: "Begin", href: "#begin" },
  sections: [
    {
      id: "hook",
      eyebrow: "01 / Premise",
      title: "A destination, not a route.",
      body: "Define arrival clearly and let the system find the path.",
      evidence: null,
      scroll: 1.4
    }
  ]
};
~~~

Every runtime needs:

- A pinned or sticky visual stage.
- One scroll conductor and config-driven chapters.
- Native reversible scrolling and keyboard focus.
- Local easing without changing scene endpoints.
- Work that stops when settled, unless ambient motion is visibly required.
- Lazy loading for heavy current and next assets.
- Semantic headings, one real CTA, and visible focus.
- A reduced-motion version with ordinary document flow.

## Verify with a fresh pass

Check:

1. **Story** — every beat advances the thesis.
2. **Timing** — the right state is active at each scroll position.
3. **Reverse** — backward scroll restores the exact prior state.
4. **Performance** — no unnecessary work after settling; no decoder or WebGL backlog.
5. **Responsive** — verify 390, 768, 1024, and 1440 pixel widths.
6. **Mobile** — fast flick, orientation change, safe areas, and readable copy.
7. **Accessibility** — semantic order, visible focus, contrast, and reduced motion.
8. **Integrity** — every fact matches the source and the CTA works.
9. **Console** — no errors or failed local assets.
10. **Mode proof** — confirm the result actually uses the selected renderer.

Repeat: build, verify, close the largest gap. Stop when no material gap remains against the bar.

## Deliverables

Return:

- Story map and final beat ledger.
- Style bible.
- Chosen mode and why it fits.
- Working page and reusable story configuration.
- Exact asset-generation and page prompts.
- Local assets with source, model, and rights notes where applicable.
- Desktop and mobile behavior.
- Verification evidence and known limitations.

Start at [demo/index.html](demo/index.html) for the three-mode launcher. Keep [REFERENCES.md](REFERENCES.md) as the external reading list.
