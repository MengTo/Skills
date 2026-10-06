# Two-colour brush: prompts

## Minimal prompt

Use $illustration-two-colour-brush to draw a 480x360 SVG card of a designer sketching wireframes on a big pad propped on her knees.

## Recreate the demo

The three shipped cards in `examples/` are the bar. Each is one chunky person doing one readable coding thing, in black marker and mint on cream paper:

- **Rubber Ducking:** a curly-haired developer sitting cross-legged on a round mint floor cushion, laptop on one knee, explaining with a big open hand to a rubber duck as big as he is; a `{…}` speech bubble and a `?` over the duck.
- **Coffee-Driven:** a developer with a hair bun striding to the right, carrying an open laptop like a tray with a tall tower of takeaway cups toppling and spilling, speed lines behind.
- **Night Owl:** a tired developer slumped in a camo-upholstered armchair at 3 a.m., laptop on the lap, mug raised, a night window with a mint moon, a wall clock, a plug and cable.

To make cards of the same kind: one figure, 1-3 props, 2-4 small accents, and the full contract: `viewBox="0 0 480 360"`, a full-bleed `#f1ede3` rect, every id on one prefix, no `<style>`, `class`, `<image>` or external refs. Draw every line with `scripts/brush.mjs` (filled ribbons with blob ends, never strokes), offset every mint block 2-10 px from its outline, halo front objects, camo only the off-white areas, and let `build()` fit the art to 392 x 278. Render, sheet it beside the three examples, zoom every hand at 8x with a thumb proof, and iterate until it is honestly an 8/10 against a commercial illustration pack (`references/craft.md`). Lint with `--palette style.json`: zero warnings.

## Remix prompt

Use $illustration-two-colour-brush to draw "Pair Debugging": two developers on one sofa, one pointing at a laptop screen with an extended index finger, the other leaning in with a hand on her chin, a mint bug icon on the screen and three emphasis ticks above the pointer's head. Keep only the four colours (`#141412`, `#4fd592`, `#f1ede3`, `#f7f4ec`), the wobbly blob-ended marker ribbons at the skill's widths (outlines w 4.0-4.2, hands w 3.2), mint plates offset up-left by 3-7 px, solid black hair and trousers with 2-4 mint dashes each, crinkly camo on the sofa's off-white cushions, profile heads with big noses and dot eyes, and a black floor stroke under every foot.
