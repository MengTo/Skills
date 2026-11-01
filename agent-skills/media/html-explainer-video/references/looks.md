# Looks

A look is one block of CSS variables. Scenes use only these, so changing the block changes the whole film, including how it moves. It can sit on the page (`<html data-look="…">`) or on any element, and it can be read from a site, written from a named style, or taken from a brand guide.

## Reading one

```bash
node scripts/read-look.mjs https://their-site.example --name brand --out looks
```

It opens the page, measures what's really drawn (ground, ink, second ink, accent from buttons and links, panels, corners, edges, shadow, headline and body faces with weights, tracking and case, how fast its transitions run) and writes `looks/brand.css`, `looks/brand.md` and a screenshot. Add `<link rel="stylesheet" href="looks/brand.css">` to the film and open it with `?look=brand`.

Then finish it by eye. `brand.md` lists what's left:

- **Fonts.** A face not on Google Fonts can't load here. Add a `@font-face` from the person's own files if they have the rights to embed it, or name the closest Google font.
- **Ground.** A dark hero on a light site can read as the site's ground. `--x-ground-image` starts flat: bring across its gradient, grain or grid.
- **Motion.** A still page can't tell you how it moves. Watch it and set `--x-motion` yourself.
- **Compare** a still of the film with their screenshot, side by side. It should look like a video their own designer would make, not their colours on someone else's template.

## Naming one

If they name a style ("editorial", "brutalist", "calm and technical"), decide the five things that make it that style, then write the block:

1. **Ground and ink:** one mode, one accent.
2. **Type:** one headline face, its weight, tracking and case; one body face, one label treatment.
3. **Edges:** corners, border weight, shadows or none.
4. **Chrome:** how windows are drawn (traffic lights, a thin frame, a heavy bar).
5. **Motion:** how things arrive (`rise`, `fade`, `snap`, `wipe`) and how fast.

A style that's only a colour swap isn't a style. If two looks differ only by hue, change the type, the edges and the motion too.

## The variables

| variable | what it is |
| --- | --- |
| `--x-ground`, `--x-ground-image` | The frame's colour, and a gradient, grid or grain over it |
| `--x-panel`, `--x-panel-2` | Windows and cards, and what's inside them |
| `--x-ink`, `--x-dim` | The statement and the lead-in of a two-tone headline |
| `--x-line` | Hairlines and grids |
| `--x-accent`, `--x-accent-ink` | The one strong colour, and words on it |
| `--x-ring`, `--x-ring-w` | Highlights: `ring()` draws this line, 1.5 px unless the look is heavy |
| `--x-head-at`, `--x-head-h`, `--x-head-align`, `--x-m` | Where headlines sit (`top`, `side`, `bottom`), how tall they run, how they're set, the side margin |
| `--x-head-font`, `-weight`, `-size`, `-line`, `-track`, `-case` | Headlines |
| `--x-hero-size`, `--x-hero-track` | The biggest type: the hook, the end |
| `--x-body-font`, `--x-body-weight` | Everything read in a window |
| `--x-label-font`, `-weight`, `-case`, `-track` | Labels, buttons, window titles |
| `--x-mono-font` | Code, addresses, numbers |
| `--x-radius`, `--x-radius-s` | Windows and cards; buttons and chips |
| `--x-edge`, `--x-edge-color` | Border weight and colour |
| `--x-shadow` | Under windows: soft, hard or none |
| `--x-bar`, `--x-bar-ink`, `--x-lights`, `--x-light-1…3`, `--x-light-radius` | A window's bar, its words, and whether it has traffic lights |
| `--x-pointer`, `--x-pointer-edge` | The pointer's fill and edge |
| `--x-pic-filter`, `--x-pic-blend`, `--x-pic-ground` | How pictures sit in the look: `sepia(.14)`, or black ink on colour. Never a blur |
| `--x-motion`, `--x-motion-dur`, `--x-motion-dist` | `rise`, `fade`, `snap` or `wipe`; its seconds; how far, in px |
| `--x-cap-font`, `-size`, `-weight`, `-ink`, `-word`, `-edge`, `-bg`, `-pad` | Captions, the spoken word's colour, and a box where the grounds change: send the same to Fil (`box: "line"`, `background`) |
| `--x-name-face`, `--x-name-moves` | The words a scene shows when it names the look |

**A look can change the layout, not only its colours.** `--x-head-at` (`top`, `side` or `bottom`) moves the headline and every region with it, and `--x-head-h` says how tall its headlines run. `--x-bar-order: 2` makes a window's bar a caption under it. `--x-pic-blend: multiply` with `--x-pic-ground` prints pictures in ink on colour. And a look's file can restyle the parts directly (`[data-look='paper'] .x-head .x-lead { display: block; font-style: italic }`). Two looks that share a composition read as reskins, so change the composition.

A look may also restyle a tone: `[data-look='poster'] .x-scene[data-tone='2'] { --x-ground: #1b2bff; … }`, with `tone: 2` on a scene. That's how a look gets a new ground on every scene without the scene knowing.

## Worked looks (`demo/looks/`)

| look | ground · ink · accent | type | edges | motion | came from |
| --- | --- | --- | --- | --- | --- |
| **Night** | #09090b · #f5f5f7 · #efb36c | Geist 600, two-tone, headline on top | 16 px corners, 1 px edge, soft deep shadow | rise, 0.55 s | Written |
| **Paper** | #f3ecdf · #1d1a15 · #b5381f | Newsreader 400, headline in a column beside the picture, labels in Hanken Grotesk | 2 px corners, hairlines, no shadow, captions under figures | fade, 0.8 s | Written |
| **Poster** | #ffd400, #1b2bff, #ff3b1f by tone · #0c0c0c | Archivo 900 in capitals across the foot, the picture above | No corners, 4 px edge, 12 px hard shadow, slightly turned windows, pictures printed in black on colour | snap, 0.2 s | Written |
| **Terminal** | #0a0d0b · #d9f2df · #7dff9e | JetBrains Mono 700, a small prompt over panes that fill the frame | No corners, ruled lines, pictures in phosphor | snap, 0.1 s | Colours and face read from a real page, a Fil survey in its Terminal style, by `read-look.mjs` (`terminal.md`), and its layout finished by hand |

All four run the same scenes. `check-film.mjs` passes on each.

Blind judges called the film's first looks reskins, and named Night and Terminal as too alike longest: a real difference comes from composition, not tint.

## Fonts and licences

Rendering a font into a film still uses it. Use faces you may use: Google Fonts' are free for this. A system font such as SF Pro is licensed for mock-ups on its own platform, so don't put it in a public film unless the person holds that licence. Fil's captions come from its own list, so pick the closest of these for `look.font`: Geist, Inter, Inter Tight, Instrument Sans, DM Sans, Manrope, Space Grotesk, Sora, Outfit, Plus Jakarta Sans, Figtree, Poppins, Montserrat, Work Sans, IBM Plex Sans, Roboto, Open Sans, Archivo, Bricolage Grotesque, Funnel Display, Funnel Sans, Syne, Unbounded, Anton, Bebas Neue, Instrument Serif, Fraunces, Newsreader, Playfair Display, Cormorant Garamond, EB Garamond, Lora, Source Serif 4, Libre Baskerville, STIX Two Text, Geist Mono, JetBrains Mono, DM Mono, IBM Plex Mono, Space Mono, Shantell Sans, Caveat.

## Telling two looks apart

Render the same still in both and put them side by side. If you squint and they look like the same film, they're not different enough yet: where the headline sits, how windows are drawn and how pictures are treated do more of that work than the colour does. Then run `check-film.mjs` in each, because a look with bigger type can push words out of a window that fit before.
