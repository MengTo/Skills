# Bold pop: prompts

## Minimal prompt

Use $illustration-bold-pop to draw a 480x360 SVG card called "Merge Queue": a developer pushes a stack of pull-request blocks into a browser window.

## Recreate the demo

Use $illustration-bold-pop to draw three new 480x360 SVG cards in the style of `examples/`, one subject each:

1. "Page Under Construction": a worker builds a web page with heavy tools and a crane.
2. "Two-Factor Auth": a person confirms a one-time code on a big phone beside a login window.
3. "Hot Reload": a code change loops straight back into a live preview.

Contract for each card:
- One self-contained `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">`, no background rect, presentation attributes only, every id on its own prefix (`up-`, `tf-`, `hr-`).
- Built with `scripts/pop.mjs`: 3.0 navy outlines, navy extrusions stepped down-right, the ten texture patterns, the group transform from `p.card()`.
- One slim character in 3/4 view facing right, 45–50% of the card height, with a neck, blush and grouped-finger hands whose thumbs pass the thumb proof.
- A browser window plus 3–5 overlapping extruded props, 6–9 floating marks, ink box 75–81% of the card width, balanced margins.

Quality bar: 8/10 on the five criteria in `references/craft.md`, judged next to the shipped examples on a sheet (`scripts/render.mjs --sheet`). Lint each card with `scripts/lint.mjs --prefix <p> --palette style.json`.

## Remix prompt

Use $illustration-bold-pop to draw "Dark Mode Switch" as a 480x360 SVG card: a woman with a violet bob leans her whole weight on a giant toggle switch (aqua track, white knob, 6-unit extrusion) that flips a browser window from white to a navy-on-cream wireframe, with a lemon crescent moon tile and a pink bolt tucked behind the window corners. Keep the navy 3.0 outline, the down-right extrusions, hatch on the right-hand sides and the palette in `style.json`; use deep skin `#c68660`; no new colours.
