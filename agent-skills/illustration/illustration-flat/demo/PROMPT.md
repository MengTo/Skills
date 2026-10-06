# Prompts for illustration-flat

## Minimal prompt

Use $illustration-flat to draw a 480x360 SVG card titled "Offline": a woman in a mint tee kneels to plug a big yellow cable back into a browser window.

## Recreate the demo

Use $illustration-flat to draw three 480x360 SVG cards in the same set as `examples/`, one per subject, each an original design or coding scene:

1. **Broken Link:** one person tearing at a snapped chain link.
2. **Fatal Error:** one person recoiling from a warning bursting out of a laptop.
3. **Coming Soon:** one person putting up a website poster with a "SOON" tag.

Contract for each card: one self-contained `<svg viewBox="0 0 480 360">`, presentation attributes only, no background rect, an id prefix on any id, text in `ui-sans-serif`. Build it with a generator next to a copy of `scripts/flat-kit.mjs` so limbs taper, hands have separated fingers with the thumb on the correct side, and sneakers match the set.

Quality bar: 8/10 against a commercial flat illustration pack, scored on the five criteria in `references/craft.md`. That means no outline on any big shape, white fold strokes as the only shading, a 205 to 235 px figure with a 35 px head, a lean and a weight-bearing leg, every hand traced back through a wrist to a sleeve, 6 or 7 confetti pieces, and no ground line. Render a sheet next to the three examples and zoom every hand at 8x before calling it done; lint with `--palette style.json`.

## Remix prompt

Use $illustration-flat to draw a 480x360 SVG card titled "Merge Approved" for a release-notes header. A man in a lavender sweater and indigo trousers, in 3/4 profile facing left, leans back on one leg and pulls a giant yellow lever whose handle is a git-branch icon; a white browser window behind the lever shows a pink "merged" pill. Keep the style's numbers: white folds 1.4, navy only on hair, sneakers, face and one arm-over-torso contour, coral socks, a 35 px head with a short quiff, both hands as fists round the lever handle with the thumbs checked against the handedness table. Stay inside the palette (try mint as the hero prop's accent instead of yellow if the sweater is yellow), add six confetti pieces and one pair of navy motion arcs beside the lever, and leave the floor implicit.
