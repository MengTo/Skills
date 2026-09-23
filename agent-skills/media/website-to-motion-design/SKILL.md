---
name: website-to-motion-design
description: "Turn an existing landing page, website or HTML build into a short motion-design piece — a sting, title card, brand ident or social cutdown — reusing its own type, palette and 3D scene. Use when someone asks to make a video or motion piece out of a page, to reuse a page's hero scene as a title card, to convert a scroll-driven build into a fixed timeline, or to ship a page-derived frame into a scene library."
---

# Website to Motion Design

A page and a motion frame can share every asset and still be built on opposite
principles. A page is *navigated*: it rewards affordances, scannable hierarchy and
interaction. A frame is *watched*: it has one message, a fixed length, and no user. This
skill is the conversion — what to keep, what to delete, and what has to be rebuilt.

Two skills carry pieces of it and are worth loading alongside: `compose-motion-frames`
for proportion and layout, and `craft-motion-design-scenes` for beats and easing.

## Use When

- "Make a 5-second video out of this landing page."
- "Reuse the hero's 3D scene as a title card / ident / social post."
- A scroll-driven or hover-driven build has to become a fixed, seekable timeline.
- A page-derived frame needs to enter a scene library.

## 1. Pick the One Message and the One Subject

Before touching code, name both:

> The frame says **<one sentence>**, over **<one subject>**.

The message is usually *not* the page's H1 — a hero headline is written to be read at
arm's length with a subhead and a button under it. Rewrite it to stand alone. If it needs
a second sentence to work, it is not one message yet.

The subject is usually the page's hero object, not its hero *section*. Photographs,
illustrations and 3D scenes carry; card grids, testimonials and stat rows do not.

## 2. Translate, Don't Port

Go through the page element by element. Most of it does not survive.

| On the page | In the frame |
| --- | --- |
| Nav, footer, breadcrumbs | Delete |
| CTA button, "watch demo" link | Delete — nothing in a frame may look clickable |
| Hero headline + subhead + rule | One statement; the rule and subhead go |
| Wordmark in the header | Either a tracked chapter label, or a resolve at the end, or nothing |
| Scroll-reveal | One beat on the timeline |
| Hover / pointer-parallax | Delete, or convert to an authored move |
| Hero image / 3D scene | The subject |
| Stat row, card grid, accordion | Delete, or become their own separate frames |
| Background gradient, grain, palette | Keep — this is what makes it recognisably the same brand |

Keeping the palette, the typeface and the subject while deleting everything else is what
makes the piece read as *that* brand rather than as a generic sting.

## 3. Lift the Assets into a Self-Contained File

Do not import from the page — copy out of it, so the frame is one file that survives the
page changing underneath it.

```bash
node scripts/lift-from-page.mjs \
  --from ../site/index.html --out frame.html \
  --style "font-family:'Outfit'" \
  --script "Three.js Authors" --script "window.__ASSET =" --script "window.SceneModule = {" \
  --body frame-body.html --js frame.js
```

Match blocks **by content, not by index** — a page gains and loses `<script>` tags and an
index-based extractor silently lifts the wrong one. Three things that bite:

- **Head/body order.** Assembling by string surgery leaves a stray `</head>` before
  `</body>` and the markup ends up in the head. The script handles this; if you assemble
  by hand, check the document order before anything else.
- **Size budget.** Self-contained means large, and that can be fine. Compare the result
  with the target library's existing size range. Prefer a deflated, base64'd asset decoded with
  `DecompressionStream('deflate')` over shipping it raw; it saved 120 KB and costs one
  async boot.
- **Fonts.** Inline the subset the page already inlines. A frame that waits on a network
  font will export its first frames unstyled.

## 4. Convert Interaction Time into Scene Time

This is the step that actually takes the work. A page animates from `performance.now()`,
pointer state and scroll position, and accumulates. A frame must be a **pure function of
scene time**: seeking to the same time twice must produce the same pixels.

- Delete pointer and scroll inputs, or replace them with an authored value on the timeline.
- Derive every value from `u = time / duration` through named windows, not from a clock.
- **Rewrite anything that integrates.** Particle systems that advance by `dt` are the
  usual offender. Solve position in closed form from the particle's age
  (`age = (time - birth) mod life`, `p = anchor + v·age + ½g·age²`) and sample any
  anchors once against a fixed reference pose.
- Seed every random source. Static noise textures too — an unseeded grain tile makes two
  renders of the same frame differ.
- Wait for fonts and assets before declaring the first frame ready.

## 5. Compose and Choreograph

Composition — proportion, element budget, where the air goes, the per-format anchors —
is `compose-motion-frames`. Beats, easing vocabulary, continuity and holds are
`craft-motion-design-scenes`. Do the composition first: no amount of easing rescues a
frame that is still laid out like a hero section.

One conversion-specific trap: **fade the canvas layer, not the materials.** A page can
fade a 3D object by ramping material opacity; a frame usually cannot, because
transmissive and instanced materials fall apart under it. Ramp the canvas element's
opacity instead — it takes the whole scene at once and gives you a clean loop seam.

## 6. Make It Re-Skinnable

The piece will be reused with other words. Ship one `CONFIG` object (message, label,
duration, format, theme, accent), every key overridable from the query string, `?t=` to
freeze a deterministic frame, `?ui=0` to strip any preview chrome, and a
`window.MOTION = { seek, play, pause, duration, config }` handle for a recorder.

Auto-fit the statement so a longer replacement message still fits its column.

## 7. Verify

- **Contact sheet.** Seek to 6–8 times, screenshot the stage element only, tile them.
  Pacing problems are obvious in a grid and invisible live.
- **Determinism.** Seek `a → b → a` and require the two `a` frames to be byte-identical.
- **Loop seam.** Compare computed `opacity`/`transform` at `0` and at `duration`, not
  screenshots.
- **Every format and appearance**, at one time index, side by side.
- **A message 40% longer** than the placeholder.
- **Proportions**, with `compose-motion-frames/scripts/measure-frame.mjs`, against a
  library you trust.

## 8. Ship It Into a Scene Library

If the frame is going into a library rather than staying standalone, it has to meet that
library's runtime contract — fixed stage size, a render message, a ready signal, an
appearance protocol, and a catalog entry. See
[references/scene-library-contract.md](references/scene-library-contract.md) for a
portable contract, including the appearance trap that can invert a WebGL render when
the scene does not answer for itself.

## Deliver

Report the message and subject you chose, what you deleted from the page, what had to be
rewritten for determinism, the formats and appearances you checked, and the measured
statement proportion. Do not claim motion-design quality from a screenshot of the middle
of the timeline.
