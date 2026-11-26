# Builder brief (template)

Copy this into `<run>/BRIEF.md`, fill the `<…>` parts, and point each helper at it. Helpers are fresh general-purpose agents (Opus for
design); give each 2 to 3 scenes that share a ground, and tell them which files are theirs.

---

# <Section name>: <N> scenes in the style of <what the source is, in plain words>

The owner shared <the source> and picked <N> of its motion shots for Fil's motion scenes library, 5 to 8 seconds each. Each must reach
**8/10 from two fresh blind judges** (lower score counts). You build <your scene ids>.

Work on files only: don't touch the Fil canvas, the repo, `public/` or anyone else's files.

## Read first
1. `<skill>/references/scene-contract.md`: the contract (variables, fonts, stage, editable words, sounds, motion, the renderer, words).
2. `<skill>/references/seven-to-eight.md`: what separates a 7 from an 8, and "Before a builder calls a scene done". All of it applies.
3. `<skill>/references/judge.md`: what your judges are told, word for word.
4. `<run>/refs/<id>.jpg`: 8 frames across each source shot; `<run>/shots/` full-size stills; `<run>/README.md` what moves in each.
   Bar sheets that scored 8, 8: <paths, if you have some>.

## Style, not copy
This is someone else's film. Take its **look and motion language** and nothing else: <describe the grounds, palette, type feel, marks,
camera, textures, easing and density in plain words, e.g. "warm paper with hairline grid cells and + marks; one coral red; isometric
hairline objects; numbers that count; captions that fill grey to ink" / "near-black with a faint grid; white type; glowing particle
fields; slow camera glides">.

Never reuse its brand, product name, logo, words, people, photos, partner logos or exact layouts, or its claims. Every word is about Fil.
The only logo you may draw is Fil's cube, copied exactly from `<repo>/public/favicon.svg`. No other company's name or logo, no invented
brand, no faces or names (avatars become node-kind glyphs).

**Section look, shared by all:** `--font-display: "<face>"` (weight <w>, track <t>), `--font-text: "<face>"`, `--font-mono: "<face>"`.
Light scenes use `data-mode="light"` as their own mode, dark scenes `data-mode="dark"`; both modes must still look designed.

## Fil's world (true facts only)
Fil is a canvas: nodes (prompts, pictures, films, 3D models, pages, sounds, documents) joined by threads; one click ("Generate all") runs
the whole flow; results are cut in Fil's video editor and published. Line: "One thread from idea to finished work." True figures: a
launch film of nine five-second scenes, about 45 seconds, from one click; Fil's MCP lets an agent build on your canvas with add_node,
connect, generate, write_file, look; every node keeps its runs and versions; sections keep a big canvas in order. No invented stats,
customers, money or percentages.

## Your scenes (id · length · source shot · message type · what it says)
- `<id>` · <5–8> s · <shot> · **<feature | number | statement>** · <one or two sentences: the source's motion idea carried into Fil's
  world>.

These are starting points: change the words or the idea where it makes a better shot, but keep the message type and the shot's motion idea.

## Paths
- Your scenes: `<run>/scenes/<id>.html`. Edit only your own files. Copy `<skill>/lab/template.html` to start.
- Render: `node <skill>/scripts/render.mjs <run>/scenes/<id>.html <run>/out/<id>` (sheet `out/<id>.jpg`, last frame
  `out/<id>-final.jpg`; frames follow your scene's length; `--times`, `--mode`, `--t key="words"`). Shared runner; never launch a
  browser or a server. If renders hang more than 5 minutes, check `curl -s localhost:<port>/status` and say so.
- Mode and long-headline checks go to `<run>/out/_<id>-a` and `<run>/out/_<id>-b`. Pages over 30 KB are refused.

## Final answer (short)
One line per scene: id, message type, one sentence on the choreography, editable fields, honest score out of 10, what still bugs you.

---

## Sending a fix round
Send the panel's verdicts word for word (both judges' "good" and "weak"), your own read of the sheet in one or two concrete sentences, and
what to change. Tell the helper which version is the base (restore it into `scenes/` yourself if the latest scored lower), to back up
first, to keep everything else, and to render the final file to `out/<id>` before reporting. Re-judge every new version on a fresh panel.
