# One-line: prompts

## Minimal prompt
Use $illustration-one-line to draw a "Deep Work" card: a developer cross-legged on a floating cushion, laptop on the knees, headphones on, a squiggle of thought loops rising from the head.

## Recreate the demo
Draw three 480 × 360 cards in this style, each an original design or coding scene in a big action pose, so they sit beside the cards in `examples/` as one set:
- **Flow State**: a developer leaps between two code braces, laptop clamped under one arm, the other arm flung back.
- **Hackathon Sprint**: a sprinter carries a `</>` baton, with a stopwatch on a motion squiggle behind.
- **Juggling Tasks**: a developer on one leg juggles a laptop, a coffee cup and a bug along one looping path.

Contract for every card: one self-contained `<svg viewBox="0 0 480 360">` with no `<style>`, `class`, `<script>` or `<image>`; every id starting with the card's prefix; a full-bleed `#ece7da` paper rect; the figure as ONE `#1d1b1a` path at 2.3 px with round caps; coral `#f2846e`, periwinkle `#8790f4` and white patches behind the line, each offset 2–6 px and wobbled with its own seed; coral stripes on the top; masks wherever the line passes behind something. No text, no ground plane.

Quality bar: 8/10 on the five criteria in `references/craft.md`. A buyer of a commercial illustration pack should accept the card as a new one in the pack. Build each card with `scripts/oneline.mjs`, render it, sheet it with the examples, zoom every hand, joint and crossing at 8x, prove the thumbs, and lint with `--palette style.json`.

## Remix prompt
Use $illustration-one-line to draw a "Ship Day" card in the same line. A developer rides a rocket that climbs to the right, the near fist on a grab handle and the far arm thrown up with an open hand. The rocket is one wandering line with a coral nose, periwinkle fins and a periwinkle porthole holding a `</>` glyph. Its white patch covers only the rear two thirds of the body. Add an exhaust squiggle with one loop, a coral flame patch, a small white cloud and three speed strokes. Keep 30–40 px of paper at every edge, more room ahead of the rocket than behind it, and mask the rocket's line under the rider.
