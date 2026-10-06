# Grainy gouache: prompts

## Minimal prompt

Use $illustration-grainy-gouache to draw a 480x360 SVG card of a raccoon in a beanie fixing a bug on a laptop at a cosy desk.

## Recreate the demo

The three shipped cards in `examples/` are the bar. Each is one cute animal in a design or coding moment, on the hot-pink card:

- **Cozy Commit:** a fox in a `{ }`-patterned scarf curled on an open laptop that sits on a stack of three books, a commit graph on the screen, a cocoa mug beside it.
- **Rainy Refactor:** an otter in a knit sweater with a Fair-Isle band, sitting on a rainy window sill, holding a tea mug in both paws, a small laptop showing a diff, a potted plant with a trailing ivy vine.
- **Night Shift:** an owl in a knit beanie perched on the arm of a desk lamp, head tilted toward a monitor reading 02:14, sticky notes, a round night window with a crescent moon.

To make cards of the same kind: one animal (not a person), one clear coding action, 3-5 props from the skill's vocabulary, and the full contract: `viewBox="0 0 480 360"`, a full-bleed `#FF81BE` rect, every id on one prefix, no `<style>`, `class`, `<image>` or external refs. Build the shared defs with `node scripts/gouache.mjs defs <prefix>`. Every large shape gets a gradient and the edge grain; the face, whiskers, code and decor stay crisp; a chalky pool sits under the group; 7-8 leaves and the cream sparkles stay in the margins. Render, sheet it next to the three examples, zoom every paw and the face at 8x, and iterate until it is honestly an 8/10 against a commercial illustration pack (`references/craft.md`). Lint with `--palette style.json`.

## Remix prompt

Use $illustration-grainy-gouache to draw "Code Review Tea Party": a hedgehog in an ochre knit cardigan sitting on a stack of maroon and ivy books, holding a cream teacup in both paws, peering at a laptop screen that shows a diff with one coral and one olive-green row. Keep the hot-pink `#FF81BE` card, the outline-free shapes with radial gradient shading and edge-gathered grain, the glossy cream-ringed eyes with star highlights, `#FF7FB0` blush, two whiskers a side, the chalky `#B95A93` pool, and 7 grained oak, ivy and olive leaves in the margins with 2 bursts, 6 stars and about 20 cream dots. The hedgehog's spines are a darker amber-brown ramp with a few cream tick lines, not outlines. Head over the dark laptop screen, scene 340 px wide, pool bottom at y 318.
