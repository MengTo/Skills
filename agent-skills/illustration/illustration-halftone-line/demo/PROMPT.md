# Halftone line: prompts

## Minimal prompt

Use $illustration-halftone-line to draw a 480x360 SVG card called "Standing Desk": a developer types at a raised desk while stretching one calf.

## Recreate the demo

Use $illustration-halftone-line to draw three new 480x360 SVG cards in the style of `examples/`, one subject each:

1. "Pair Programming": two people share one screen; one types, the other points at the code.
2. "Train Ride": someone codes on a laptop during a commute.
3. "Design Critique": a designer and a reviewer go over printed screens on a table.

Contract for each card:
- One self-contained `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">` whose first element is the full-bleed `#f4f1ea` paper rect; every id on its own prefix (`pp-`, `tr-`, `dc-`).
- Authored as a source with `<stip>` tone tags and compiled with `scripts/halftone.mjs` (wobble filter, pitch 2.58 dots, tones 0.19 and 0.36).
- Only `#111` and `#f4f1ea`; open outlines at 2.0; 3–5 solid black masses; floor strokes with dotted pools; 2–4 doodles.
- Figures 5.5–6 heads tall in profile, with separately outlined fingers and thumbs that pass the thumb proof.

Quality bar: 8/10 on the five criteria in `references/craft.md`, judged next to the shipped examples on a sheet (`scripts/render.mjs --sheet`). Lint each card with `scripts/lint.mjs --prefix <p> --palette style.json`. Do not recompose any reference image's layout.

## Remix prompt

Use $illustration-halftone-line to draw "Release Night" as a 480x360 SVG card: a developer sits cross-legged on a beanbag (dotted 0.19, shadow side 0.36) with a laptop on her knees, a solid black cat asleep against her hip, a floor lamp drawn as an open line with a dotted cone of light (graded `lin` 0.06 → 0.3), and three radiating ticks above her head as the deploy goes green (a black check mark doodle). Keep the two inks, the open 2.0 contour, the wobble filter, the pitch-2.58 dots and the floor pools.
