# Prompts for illustration-ink-sketch

## Minimal prompt

Use $illustration-ink-sketch to draw a 480x360 SVG card titled "Bug Report": a googly-eyed ladybird holding up a tiny clipboard on a grass patch.

## Recreate the demo

Use $illustration-ink-sketch to draw three 480x360 SVG cards in the same set as `examples/`, each an original critter whose body carries a coding idea:

1. **Slow Build:** a slow creature stuck partway along a progress bar, something on its body reading as a loading spinner.
2. **Merge Conflict:** two branch-coloured critters clashing where their lines meet.
3. **Hello World:** a friendly object or plant greeting the viewer with hand-lettered "hello, world".

Contract for each card: one self-contained `<svg viewBox="0 0 480 360">`, no background rect, every id prefixed (`setPrefix`), no `<style>` or `class`. Generate it with a script next to a copy of `scripts/ink-kit.mjs`, so every line is a seeded brush polygon and both filters (`rough`, `mottle`) are present.

Quality bar: 8/10 against a commercial hand-drawn illustration pack, scored on the five criteria in `references/craft.md`. That means tapered brush outlines broken into separate strokes, fills that slip past the line with mottle and gloss, hatched shadows, googly eyes 40 to 55 px across with offset pupils, a grass patch or desk with a hatched contact shadow, 9 to 11 flecks, and a metaphor that reads at 1x. Render a sheet next to the examples, zoom the eyes and any hands at 8x, and lint with `--prefix` and `--palette style.json`.

## Remix prompt

Use $illustration-ink-sketch to draw a 480x360 SVG card titled "Cache Miss" for a blog header. A teal octopus-like critter sits on a wooden desk top reaching for a row of three paper index cards with two tentacles while a third card flutters away out of reach; its eyes (radius 22 and 25) track the escaping card, with a sweat drop and two motion arcs. Use the teal family for the critter and wood for the desk, a yellow-family spark on the missed card, hatch the shadow side of the body and the desk leg, and hand-letter "MISS" in brush strokes on the flying card. Keep the style's numbers: outlines from `OUT()` in 3 to 6 strokes per shape with one gap and one overshoot, fills slipped 2 to 3.6 px, mottle at 0.4, 2 to 5 hairs per outline stroke, 10 flecks, and the whole card inside the prefixed rough filter.
