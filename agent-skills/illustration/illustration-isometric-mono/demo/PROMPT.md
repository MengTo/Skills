# Prompts for illustration-isometric-mono

## Minimal prompt
Use $illustration-isometric-mono to draw a 480x360 SVG card of an API gateway: a router box in the middle cabling out to three services, a key vault, a log card and a mug, all on one slab.

## Recreate the demo
Use $illustration-isometric-mono to draw three 480x360 SVG cards that could ship with `examples/`:
- "Dev Stack": a laptop with code cabled to two server racks, with a database stack, a shipping container, a terminal card, a cloud upload badge, books and a mug.
- "Design Studio": a monitor running a design tool, a drawing tablet, a bookshelf, a mood board, a sketchbook, swatches, a pen cup, a plant and a mug.
- "CI Pipeline": code boxes riding a conveyor through build and test gates to a robot arm that stacks them for shipping, with a status tower.

Build each one by copying `scripts/dev-stack.gen.mjs` and replacing its layout table and props; `node scripts/dev-stack.gen.mjs out.svg` should reproduce the first card exactly. Contract: one self-contained `<svg viewBox="0 0 480 360">`, every id prefixed per card, no background rect, one slab, light from the upper left. Quality bar: 8/10 on the five criteria in `references/craft.md`, a sheet next to the examples, `node scripts/lint.mjs card.svg --prefix xx-` passing and `node scripts/ramp-check.mjs card.svg` reporting 0 strays.

## Remix prompt
Use $illustration-isometric-mono to draw "Feature Flags": a control cabinet at the back with a row of lever switches on its front face, a laptop at the centre showing a toggle list, two small service cubes with tick and cross glyphs, a terminal card in the front left, a stack of config books and a mug, one cable from the laptop to the cabinet. Keep the style's mechanism and numbers: true isometric through `P()`, faces shaded from the five-green ramp by orientation, 0.9 outlines, 0.35-0.6 detail, shadows toward the lower right, the 368.5-wide slab with 56 side margins.
