# Teal spot: prompts

## Minimal prompt

Use $illustration-teal-spot to draw a 480x360 SVG card of a white password vault with its teal dial turned, for an empty state about saved passwords.

## Recreate the demo

Use $illustration-teal-spot to draw three cards that sit next to `examples/command-k.svg`, `examples/git-merge.svg` and `examples/backup.svg` as one set:

- Subjects: one design or coding idea per card, each turned into a single physical object (a keyboard case with popped keys, a tile carrying a git graph, a database drum in a lifebuoy). Name the object and the part that lifts out before drawing.
- Contract: `viewBox="0 0 480 360"`, a full-bleed `#ebebeb` rect, every id on its own prefix, presentation attributes only, no `<text>` (glyphs as stroked paths). Build each card with a generator based on `scripts/starter.mjs` and `scripts/teal3d.mjs`, using the camera `makeCam({ TH: -25, PH: 36 })`.
- Look: white top and front faces, teal only on right-facing sides, 1.2 px `#0e3f3d` outlines, a hard `#0e4a48` floor shadow pushed down-right, 2–4 floating extras with their own hard shadows, three sparkles, up to three arc ticks.
- Quality bar: 8/10 against a commercial spot-illustration pack. Render a sheet next to the examples, zoom every crease and shadow at 8x, and lint with `--palette style.json` until no WARN remains.

## Remix prompt

Use $illustration-teal-spot to draw "Feature Flags": a white rounded control box with three recessed toggle slots, one teal toggle switched on and lifted a little out of its slot, a tilted pale settings card floating top-right with one teal row, and a coin showing an on/off glyph floating left. Keep the -25/36 camera, white faces with a teal right side, the hard down-right shadows, three sparkles and one arc tick; use only the eleven palette colours.
