# Prompts for illustration-flat-with-black

## Minimal prompt
Use $illustration-flat-with-black to draw a 480x360 SVG card of a designer catching a falling colour swatch, for an empty state.

## Recreate the demo
Use $illustration-flat-with-black to draw three 480x360 SVG cards that could ship with `examples/`:
- "Messages": one developer running from a swarm of envelopes and chat bubbles, glancing back.
- "Friday Deploy": one developer leaning over a desk, finger hovering over a big red DEPLOY button, with a FRI calendar, a clock and a cat.
- "Stand-up": two teammates with mugs turned toward each other at a sticky-note board.

Contract for each: a single self-contained `<svg viewBox="0 0 480 360">` with presentation attributes only, every id prefixed per card, no background rect, the scene in one `translate(240 178) scale(0.95) translate(-cx -cy)` group, one ink ground line. Build limbs, shoes, heads and hands with `scripts/parts.mjs`. Quality bar: 8/10 on the five criteria in `references/craft.md`, with a thumb proof for every hand, a sheet next to the examples, and `node scripts/lint.mjs card.svg --prefix xx- --palette style.json` passing with no unexplained warnings.

## Remix prompt
Use $illustration-flat-with-black to draw "Code Freeze": a developer in a tomato jumper and black trousers wrapped in a denim scarf, hugging a laptop that is iced over with sky-blue blocks, one knee bent against the cold, two stars and two sparkles in the empty corners. Keep the style's mechanism and numbers: no outlines on coloured fills, black as solid masses for 20-40% of the painted area, far limbs one shade darker, big shoes on a 1.25 ink ground line, side margins near 90.
