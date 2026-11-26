# Adapting the film's look to what was built

The film wears the project's clothes. A viewer should feel they're inside the thing being made: its colours, its
frame, its UI, its world behind the cards. Everything here is read from the project, never invented to resemble it.

## Contents
- Tokens from the project
- Type
- The UI language: hairlines, frames, frosted glass, holographic panels
- Real captures (frame-exact)
- Backgrounds from the project's own world
- What judges marked down

## Tokens from the project

Open the project's UI and its best captures and measure: the ground (darkest value), the ink (text), the metal or
accent its frames are drawn in, one hot accent for highlights. Put them in film.css's `[data-look='project']` block
(`assets/starter/film.css` lists every token with Greymourn's values). Greymourn: near-black #090806, ivory #f2ebdc,
antique gold hairlines rgba(217,194,138,.2), gilt linework #e6cf94, one fire accent #ffb347 for highlights, rings,
step numerals, the wipe line. One accent only: every label, ring and line in the same colour reads as one system.

## Type

The Geist trio, Meng's pick for the film ("Geist Serif and Geist Sans and Geist Mono for the video
editing"; the fonts are in `assets/starter/fonts/`):
- **Geist Serif** for headlines and display (tracked in −0.03 to −0.04 em), balanced line breaks.
- **Geist Sans** for body, caps labels (500, tracked out 0.14 em), and big numerals (200, tabular: Geist Mono's
  slashed zero lost with judges).
- **Geist Mono** for his prompts, code, file names, addresses.
- Stage sizes: display 150–170, head 84, rows 50–56, body 32, labels 22–24; nothing under 20 (40 px in the 4K file).
The project's own typeface shows where the project shows (its captures) and on the covers (Greymourn's covers used
the game's Cinzel caps).

## The UI language

Since 22 Nov this dresses the demo, it doesn't replace it: at least 25 % of the runtime is the exact real UI, full
frame, and headline-plus-card scenes read as a slide deck ("too many presentations, too few demos").

- **Gilt hairlines.** 1 px lines in the project's metal at ~20 % opacity for borders, rules and table lines.
- **The project's frame motif as linework.** Greymourn's menus had double hairlines, corner brackets and diamonds at
  each edge's middle; `motion.js ornament(w, h)` draws that as SVG and `--draw` draws it on as a panel lands. Change
  the motif to the project's own (its corners, its marks), keep the draw-on.
- **Frosted glass.** Panels are the ground tinted at ~75 % with a blur behind (`.glass`), a long soft shadow, the
  hairline border. Flat and face-on at rest (sharp at 4K); they arrive from depth (`panel()`).
- **Holographic / AR panels.** The look Meng asked for ("AR UI, holographic UI, and in-game UI"): glass
  panels that fly in, turn a little and settle; linework that draws on; the project's real data drawn in light (the
  level plan as a gold wireframe on a glass table, the real source code typing on a glass pane).
- **The exact real UI (since 22 Nov).** Show the agent or app as it really is: a recording of it, or an exact HTML
  copy of its real UI (its sidebar, the chat with the prompt, its browser pane), full frame and uncropped; real pages
  full frame and scrolling. Never a drawn stand-in, never a clipped design. Any word you had to write for the film,
  say so in the report.
- **Drawn windows with real words** (Greymourn, superseded 22 Nov). A Claude Code window was a plain window (`.win`,
  three dots, a title like "claude · greymourn") with his real prompt typed in it, not a copy of the app's chrome.
- **Lit while said.** Cards, rows and threads light (border and text toward the accent) while their name is said,
  the rest step back to ~50 %.

## Real captures (frame-exact)

Footage plays as folders of numbered 4K JPEG frames (`0001.jpg…`, frame n at (n−1)/60 s), read by `motion.js frame()`
and `montage()`, so every render is the same picture. Greymourn's three sources, each a pattern to reuse:
- **Gameplay**: cut from his 4K60 gameplay master with ffmpeg (`tools/extract-gameplay.sh`), plus its sound for the
  cold open. The gameplay was a scripted bot: the film says so.
- **The UI** (thread V2, `tools/capture-ui.mjs`): the live game in headless Chrome for Testing at 3840 × 2160, every
  video frame one game tick, the HUD clock 1/60 s, JS time on Playwright's fake clock, every CSS animation paused and
  seeked to its age in video time; menus driven by the page's own events and test hooks; the capture stops if the
  console reports a greybox or shader error. 13 clips with a table of what's on screen when (`07-ui-footage.md`).
- **Plates: the project's world as the background** (thread A2, `tools/capture-plates.mjs` + `plates.json`): the game
  renders its own castle with the camera flown through its camera hook, player hidden, enemies cleared, HUD off, one
  eased move per plate, 4K60. Graded toward the film's palette with an SVG `feColorMatrix` (85 % toward a warm
  monochrome, then darker and more contrast) and shaded on the type's side. The game's cool fog lost to the warm UI
  until graded.
Captures are the project's, so their faults are the project's: list them for the project's owners instead of
hiding them (V2 listed 12 game fixes, none made by the film).

## Backgrounds from the project's own world

`film/bg.js` (thread V3, 104 KB raw WebGL2, `BG.md` documents it) drew one canvas under every scene, every pixel a
pure function of t: a dark wet-stone studio with warm shafts and dust; the game's crest and compass as shaded gold
relief; the gatehouse in wire with a glass panel of the real level plan; the castle at dusk rim-lit in gold; the
real source code typing on glass; the real level as a wireframe on a glass table; and a **burn** transition (the old
look chars away along a beading gold thread, 1.4 s) at chapter changes. Per scene `hero` (0–1) fades the look's main
object, so behind cards it's only atmosphere. Build the new project's backgrounds the same way: from its own data
(its logo, its level, its code, its renders), quiet behind type, a burn or cut at chapters, 3–7 ms a 4K frame.

## What judges marked down (so don't)

- A perspective grid floor ("generic Tron") → dark flagstones. Wire outlines → shaded relief. Rainbow iridescence →
  warm foil only. God rays through spires → vertical smears, dropped.
- A plate or hero object behind a headline (battlements at the x-height) → keep plates where the frame is otherwise
  dead; hero 0 behind cards.
- A blurred cover copy behind landscape art (reads as a pasted band) → only behind portrait art.
- Hiding a look under an opaque plate: it shows in the plate's fade-in and the next burn. Change the look underneath.
- Soft captures at 4K, every round. Capture at 4K or show smaller. A Fil canvas screenshot needs his own Retina
  capture (ask him for one at 3000 px+, zoomed to 50 %).
- Standalone background judges and in-film judges pull opposite ways (rich hero vs quiet atmosphere): judge
  backgrounds in the film, at the key frames.
