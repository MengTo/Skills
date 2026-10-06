# Vintage emblem: prompts

## Minimal prompt
Use $illustration-vintage-emblem to draw a 480 × 360 SVG badge reading "CODE REVIEW".

## Recreate the demo
Use $illustration-vintage-emblem to draw three new emblem cards in the same set as `examples/`, one at a time:
- **Ship It:** a rocket with a `</>` porthole lifting off a cream billow; tagline "BUILD • TEST • DEPLOY".
- **Open Source:** an old tree on a rocky knoll, roots laid out like a git graph with nodes; tagline "FORK • BUILD • SHARE".
- **Debug Club:** a carved beetle seen through a big magnifying glass, braces and chevrons in the splash; tagline "FIND • FIX • REPEAT".

Contract: `viewBox="0 0 480 360"`, a full-bleed cream `#f8f0e3` card rect, one id prefix per card, no `<style>`, class, script or image, only the seven palette colours. Build each card with a generator that imports `scripts/emblem-kit.mjs` and lets `card()` lay out the sun, keyline, crop, lockup and the `wordmark.mjs` lettering. Quality bar: 8/10 against a commercial illustration pack on the five criteria in `references/craft.md`; check the sheet next to the examples and lint with `--palette style.json` (no warnings).

## Remix prompt
Use $illustration-vintage-emblem to draw "NIGHT BUILD": a lighthouse-shaped server tower with a teal lamp band and a terracotta cap rising above the sun disc, its beam drawn as two cream wedges, standing on a dark rocky knoll with grass tufts; three gulls; tagline "COMPILE • TEST • SLEEP". Keep the seven colours, 3.6 px ink outlines, carved wedges for shade, the 15 px cream keyline, the hard edge at y 229 and the wordmark from `scripts/wordmark.mjs`.
