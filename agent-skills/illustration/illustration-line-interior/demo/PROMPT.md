# Line interior: prompts

## Minimal prompt
Use $illustration-line-interior to draw a "Code Review" card: a developer at a desk leans toward a monitor and points at a highlighted line while a colleague on a stool reads along.

## Recreate the demo
Draw three 480 × 360 cards in this style, each an original design or coding scene with its own subject, so they sit beside the three cards in `examples/` as one set:
- **Books**: a developer pulls a JS book off a ladder shelf, holding an open book at her hip.
- **Remote Work**: a developer types on a laptop in a hammock on a city terrace.
- **Whiteboard**: one developer draws a system diagram on a wheeled board while a colleague on a stool watches with a coffee.

Contract for every card: one self-contained `<svg viewBox="0 0 480 360">` with no `<style>`, `class`, `<script>` or `<image>`; every id starting with the card's prefix; no background rect (white card); a pale `#cfc9e0` 1 px background layer (bricks, pendant lamps from the top edge, a framed poster); an indigo `#3a2d66` 1.4 px foreground layer with white fills and accents on under 7% of the card; a floor line at y 308 with end dashes. People stand about 230 px tall with heads about 34 px. Hands come from the toolkit with thumbs proven on the correct side.

Quality bar: 8/10 on the five criteria in `references/craft.md`. A buyer of a commercial illustration pack should accept the card as a new one in the pack. Render, sheet it with the examples, zoom every hand at 8x, and lint with `--palette style.json` before calling it done.

## Remix prompt
Use $illustration-line-interior to draw a "Design Handoff" card in the same room language. A designer kneels on one knee beside a low table and slides a tablet with a component sheet across to a developer seated on a beanbag; the developer reaches for it with an open hand. Keep the 1.4 px indigo line, white fills and the floor line at y 308. Put a fiddle-leaf fig in a peach pot at the right and a cone lamp and two brick clusters in the background. Use teal and mustard as the only clothing accents, give the two people different skin tones and hair presets, and keep coloured fills under 7% of the card.
