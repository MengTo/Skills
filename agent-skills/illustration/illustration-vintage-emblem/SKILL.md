---
name: illustration-vintage-emblem
description: Draws original hand-authored SVG badge illustrations in a vintage emblem style for design and coding subjects. Identifying traits: a seven-colour screen-print palette (green-black ink, cream, terracotta, sand, tan, pale, a touch of teal) with no gradients; one chunky hero object in thick 3.6 px ink outlines, shaded with woodcut gouges and lit with pale streaks; a terracotta sun disc behind it, cut free by a 7.5 px cream keyline; a hard horizontal edge slicing the scene into a dark splash band with cream droplets punched out; a heavy condensed wordmark over a letterspaced serif tagline. Covers lockups, hero objects, gulls, splash bands and lettering. Use when someone asks for a vintage emblem, retro badge, crest, logo-style, screen-print, poster, sticker, patch or merch-style illustration, or a badge card for a team, event, release, empty state, 404 page, blog header or marketing card.
---

# Illustration: Vintage emblem

A screen-printed badge on cream paper: one bold object on a sun disc, a splash of ink along a hard bottom edge, and a heavy condensed wordmark with a small serif tagline. It suits named things (a club, a release, a principle, a team ritual) where the words are part of the picture.
Use `illustration-two-colour-brush` instead for loose brush-painted scenes in two inks; `illustration-teal-spot` for a single-colour spot object with no lettering; `illustration-flat-with-black` for a flat character scene with solid black shapes.

Extracted from a set of 42 original design-and-coding cards in 14 styles; the three cards in examples/ are this style's shipped cards.

## The look in one sentence
One chunky object, outlined in thick green-black ink and shaded with carved ink wedges, stands on a terracotta sun disc that a 7.5 px cream keyline cuts it free from, while a hard horizontal edge slices the scene into a dark splash band with cream droplets punched out, all locked up over a heavy condensed wordmark.

## Palette
Measured from the examples. Seven flat colours, nothing else.

| Role | Hex | Where it goes |
|---|---|---|
| Card | `#f8f0e3` | full-bleed background (78–85 % of the rendered card), keyline, cream highlights, droplets cut into the ink, the billow |
| Ink | `#1f2b25` | outlines, shadow wedges, splash band, gulls, wordmark, tagline (45–51 % of all non-cream pixels, wordmark included) |
| Terracotta | `#c8693f` | the sun disc; one repeat on the subject (nose cone, beetle shell, porthole ring, flame) |
| Sand | `#d9a873` | main fill of the subject (fins, crown, lens rim, flame core) |
| Tan | `#b5824f` | darker fill: trunks, grips, the shaded tone under sand |
| Pale | `#ecd2a8` | highlight streaks, rock faces, glass |
| Teal | `#3f8273` | accent only: one band, ring, collar or set of node dots per card, 2–4 % of non-cream pixels |

- Never: gradients, opacity, textures, hatching, filters, pure black or white, a sixth hue.
- Terracotta never touches the sun: anything terracotta on the subject sits inside the keyline.
- Teal never fills a large shape; a teal fin set was cut from the first card.

## Line and fill
All numbers are in lockup units (the lockup is scaled 0.95–0.97, so on the card they come out about 4 % smaller).
- **Subject outlines: 3.6** ink strokes, `stroke-linejoin="round"` (`OUT` in the kit). Small inner parts 2.2–2.8 (nozzle, collar, porthole ring 2.0).
- **Union outlines:** shapes that read as one mass (trunk + roots, a cluster of puffs) get one outline: an ink underlay stroked at 7.2 (2 × OUT), then the fills (`unionOutline`).
- **Keyline:** the subject's silhouette shapes again, filled and stroked cream at **15** (a 7.5 px cream gap), drawn after the sun and before the subject. Include every lobe, handle and spike, or the subject melts into the disc.
- **Shade is ink cut into colour**, on the right/lower side (light from the upper left):
  - woodcut gouges: `wedge()` 1.8–4.2 wide (10 on a trunk), blunt base, sharp tip;
  - crescents inside round parts (`crescent()`, thickness 2–4.2);
  - a two-tone offset for puffy masses: tan underneath, sand shifted (−2.6, −7.6) on top, so tan shows as a lower-right crescent (`puffs()`).
- **Light is pale or cream streaks** on the upper left: `streak()` half-width 1–2.4, both ends sharp; 2–5 per object. Short round-capped pale strokes (1.8–3.6) are fine on narrow parts.
- Flat fills only. No outline on the gulls, splash, droplets or wordmark (the wordmark uses a 2.2 same-colour stroke only to round its corners).

## Characters
No people. The hero object is the character:
- **One hero**, chunky and nearly symmetric, 80–210 px wide, built from 3–8 big shapes. Secondary structures compete with it: a launch tower beside the rocket was cut.
- It breaks the sun's circle: the rocket's nose rises above the disc, the tree crown is wider than the disc, the magnifier sits left so the disc shows as a crescent.
- Each big shape: flat fill, 3.6 outline, one ink shadow shape or 1–3 gouges on the right, 1–3 pale streaks on the left.
- Detail is carved, not drawn: rivets as ink dots r 1.15, grain as gouges, a code glyph `</>` in cream strokes 2.4 inside a porthole.
- Coding cues live inside the object (a `</>` porthole, roots laid out as a git graph with cream-and-teal nodes, a beetle under a lens) or in the splash (curly braces and chevrons as ink strokes 5.2–5.4).
- Creatures are cut like woodcuts: ink head and legs (tapered tubes with round joints), coloured shell with ink striae and pale streaks.
- **Round objects** (lens, dial, porthole, wheel), the Debug Club recipe: a sand ring outlined 3.6; inside a clip of the ring, a tan ring offset (+2.4, +2.4), an ink crescent on the right (thickness 4–4.6) and 5–6 short gouges on the right; a cream arc highlight on the upper left of the ring (stroke 2.6, two dashes); then the glass or dial in pale outlined 3.6, with a sand ring offset (+6, +6) and cream streaks on the upper left, all clipped to the glass.
- Small parts that stick out of a round object (crown, pushers, handle collar) are stadiums or quads standing on its rim, sand or tan, each outlined 3.6 and each in the keyline.

## Decor and props
- **Gulls:** 2–4 ink "m" silhouettes (`gull(x, y, s)`, s 7–10.5), in the sky beside or above the disc, never overlapping the subject, sizes varied, one mirrored.
- **Splash band** along the crop (`foam()`): an ink band from x 96–100 to 380–384, rising to a crest near y 216–224, 5 lobes a side (r 6.5–13.7, mirrored about x 240); cream holes r 1–3.2 punched into the dark (8–15 of them), teardrop drops r 1.8–3.2 flung outward at ±48–72°, 4–6 loose specks r 1–1.5.
- **Centre of the band** is the subject's base and changes per card: a cream cloud billow with ink lobes behind (rocket), a dark knoll with pale boulders and grass tufts (tree), ink spikes with drop tips (magnifier). A cloud bank is ONE outlined mass shaped like a mound, tallest under the hero: `puffs(list, { merge: true, dark: PALE, light: CREAM })`; draw part of it after the hero so the hero sits in it.
- Optional ink flecks: tiny triangle chips, grass blades as `wedge()` tufts.
- Never: stars, sparkles, frames, ribbons, banners, circles of text, dates, a second sun or moon.

## Composition
- **Card:** full-bleed `<rect width="480" height="360" fill="#f8f0e3">`, square corners.
- **Emblem:** sun disc r 86–88 at (240, 114–118); the scene clipped by `<clipPath><rect width="480" height="229"/></clipPath>` so everything ends on one hard horizontal edge at y 229. Emblem 276–328 px wide, about 205 px tall.
- **Wordmark:** top at y 258–260, centred on x 240, scale 0.68–0.95, cap 38–53 lockup units (the CLI prints it), 190–310 px wide on the card. Words of 12+ letters need `--max-width 320` (or `wmMaxWidth: 320` in `card()`) to keep the cap at 38. **Tagline** baseline = wordmark top + cap + 19.
- **Lockup:** everything in `<g transform="translate(240 180) scale(0.95–0.97) translate(-240 -cy)">` with cy = (top of the emblem + tagline baseline) / 2, so the whole badge is centred. Shipped lockups span y 30–331 (84 % of the card height).
- One focal point, dead centre, symmetric weight; the sky stays clean except gulls.

## Techniques
Two helpers in `scripts/`, no dependencies. From the skill folder:
- `node scripts/wordmark.mjs "RELEASE DAY" --tagline "TAG • SHIP • REST" --prefix rd-` prints the wordmark `<g>`, the tagline `<text>` and the lockup numbers. A–Z, 0–9 and `- . ! '`. `--max-width 280` (default) sets the scale; `node scripts/wordmark.mjs --sheet alphabet.svg` renders every glyph. It reproduces the shipped OPEN SOURCE and DEBUG CLUB wordmarks exactly.
- `node scripts/emblem-kit.mjs demo.svg` writes a self-test card. `card()` builds the whole SVG shell (card, crop, sun, keyline, lockup centring, wordmark, tagline). When the hero rises above the sun (a rocket nose, a bow), pass `top:` its highest y, or the lockup centres on the sun and sits low.

```js
import * as K from '/abs/path/to/illustration-vintage-emblem/scripts/emblem-kit.mjs';
const P = 'rd-', fo = K.foam();                       // the Debug Club band; pass lobes/holes/flung to vary it
const body = 'M210 60 L270 60 L270 200 L210 200Z';     // your hero's silhouette paths
const svg = K.card({ prefix: P, label: 'Release Day', word: 'RELEASE DAY', tag: 'TAG • SHIP • REST',
  keyline: `<path d="${body}"/>` + fo.keyline,          // silhouettes: cream, stroked 15
  emblem: `<g fill="${K.INK}"><path d="${K.gull(150, 60, 9)}"/></g>
    ${K.outlined(body, K.SAND)}
    <path d="${K.wedge(262, 196, 258, 90, 4, 0)}" fill="${K.INK}"/>
    <path d="${K.streak(218, 80, 220, 150, 2, 0)}" fill="${K.PALE}"/>
    <g fill="${K.INK}">${fo.ink}</g><g fill="${K.CREAM}">${fo.holes}</g>` });
```

A cloud bank the hero sits in: back puffs, hero, front puffs, each set under one outline; every puff also goes in the keyline.
```js
const rnd = K.rng(23);
const back = [K.puff(190, 206, 30, 12, 9.5, rnd), K.puff(292, 206, 30, 12, 9.5, rnd)];
const front = [K.puff(240, 214, 36, 17, 11.5, rnd), K.puff(196, 222, 26, 11, 9.5, rnd), K.puff(284, 222, 26, 11, 9.5, rnd)];
const pb = K.puffs(back, { prefix: P + 'b', dark: K.PALE, light: K.CREAM, merge: true });
const pf = K.puffs(front, { prefix: P + 'f', dark: K.PALE, light: K.CREAM, merge: true });
// defs: pb.defs + pf.defs; keyline: [...back, ...front].map(c => K.puffShape(c, K.OUT)).join('')
// emblem: splash, pb.svg, hero, pf.svg
```

Carving inside a shape, clipped so gouges never cross the outline (as the rocket body and beetle shell do):
```xml
<clipPath id="rd-bodyclip"><path d="M…body…"/></clipPath>
<g clip-path="url(#rd-bodyclip)">
  <path d="M243 55 C244 66 243 78 242 88 … L262 146 V55Z" fill="#1f2b25"/>   <!-- shadow side -->
  <path d="M245.6 86 C246.6 96 … Z" fill="#d9a873"/>                         <!-- reflected light in it -->
</g>
<path d="M…body…" fill="none" stroke="#1f2b25" stroke-width="4.2" stroke-linejoin="round"/>  <!-- outline last -->
```

## Failure modes
- **Hero lost among props.** A launch tower beside the rocket split the focus; one hero only.
- **Teal everywhere.** Teal fins made the badge read as a different palette; keep teal to one band or ring.
- **Busy base.** A row of separately outlined cloud puffs looked like bubble wrap (the self-test hit this again with `puffs()` defaults); use one merged cream billow (`merge: true`) in the centre and ink lobes with punched holes at the sides.
- **Flat cloud sausage.** Equal-height puffs in a row read as a bolster; make the bank a mound, tallest under the hero.
- **Wordmark too small.** A 13-letter word at the default width came out with a 33-unit cap; widen to `--max-width 320` before shortening the words.
- **Crown reads as balls or a mushroom.** Plain circles for foliage; build clumps from bump rings with ink curls under the top bumps, gouges up from the bottom and the two-tone offset (`puffs()`).
- **Roots or lines read as scribble.** Free diagonal shapes; lay them out as lanes with vertical tangents (`gstep`), like a git graph, with nodes.
- **Subject melts into the sun.** Keyline missing on a lobe or handle; every silhouette shape goes into the keyline group.
- **Wordmark looks typed.** A system font in `<text>` changes per machine; build the wordmark with `wordmark.mjs`. Only the 12.5 px tagline may be `<text>` (Georgia bold, tracking 2), as in Ship It.
- **Wordmark letters fold over.** A corner radius wider than half the inner width makes cream slivers inside round glyphs; `wordmark.mjs` clamps it, so keep custom glyphs within it too.
- **Lockup off centre.** The scale was applied without re-centring; compute cy from the emblem top and the tagline baseline (`card()` does).

## Examples
- `examples/ship-it.svg`: rocket lifting off a cream billow, terracotta nose and porthole ring with a `</>` glyph, teal band, sand fins; carved shadow down the right of the body; wordmark at scale 0.95 with a `<text>` tagline.
- `examples/open-source.svg`: old tree on a dark knoll with pale boulders; crown of two-tone leafy clumps; roots as git-graph lanes with cream-and-teal nodes; grass tufts in the splash; wordmark scale 0.74.
- `examples/debug-club.svg`: big magnifier offset left so the sun shows as a crescent, a carved beetle in the glass, grip with ink bands and a teal collar; ink spikes, braces and chevrons in the splash; wordmark scale 0.84.

## Workflow
Commands run from the skill folder (Playwright must resolve for render: `npm i -D playwright-core` there or globally).
1. **Brief:** name the subject, pick ONE hero object that says it, and write the wordmark (1–3 words) and a three-beat tagline with `•` separators.
2. **Hero:** sketch its silhouette in 3–8 big shapes; decide how it breaks the sun's circle and what sits at its base in the splash band.
3. **Words:** `node scripts/wordmark.mjs "WORD" --tagline "A • B • C" --prefix xx-` to see the scale and cap height. If the cap is under 38, rerun with `--max-width 320`; only then shorten the words.
4. **Block:** write a generator (`card.gen.mjs`) that imports `emblem-kit.mjs` by absolute path. Silhouettes first (they feed the keyline), then fills, ink shade, pale streaks, splash, gulls. Use `K.card()` for the shell.
5. **Render:** `node scripts/render.mjs card.svg card.png`.
6. **Sheet:** `node scripts/render.mjs --sheet sheet.png examples/*.svg card.svg`. Same weight of ink, same palette share, same lockup size?
7. **Zoom:** `node scripts/render.mjs card.svg z.png --zoom x,y,w,h --scale 6` on the keyline, the carving, the splash holes and the wordmark joins.
8. **Critique** on the five criteria in references/craft.md (character drawing = the hero object's construction). Fix and re-render; expect 3–4 rounds.
9. **Lint:** `node scripts/lint.mjs card.svg --prefix xx- --palette style.json`. It should pass with no warnings.

## Verify
- [ ] Only the seven palette colours appear; `lint --palette` prints no WARN.
- [ ] Cream full-bleed card rect, square corners.
- [ ] A terracotta sun disc r 86–88 sits behind the hero, and the hero breaks its circle.
- [ ] A cream keyline about 7.5 px wide separates every part of the hero from the disc.
- [ ] Every hero shape has a 3.6 ink outline; shade is ink wedges or crescents, light is pale streaks.
- [ ] No gradients, opacity, hatching, textures or filters.
- [ ] The scene ends on one hard horizontal edge, with an ink splash band, punched cream holes and flung drops.
- [ ] 2–4 gulls, none touching the hero.
- [ ] Teal appears once or twice, small.
- [ ] Wordmark is paths from `wordmark.mjs`, cap 38–53 lockup units, centred, at most 310 px wide; tagline 12.5 serif bold with `•`.
- [ ] Lockup centred vertically: equal space above the emblem and below the tagline (± 6 px).
- [ ] The subject reads at 1x without the words.
