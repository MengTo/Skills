# Putting scenes on the canvas, and showing them

## The canvas
The library is the owner's "HTML motion scenes" canvas (find it with `list_canvases`; don't create another). Load the Fil MCP tools with
ToolSearch: `select:mcp__fil__get_canvas,mcp__fil__add_section,mcp__fil__add_node,mcp__fil__update_node,mcp__fil__write_file,mcp__fil__read_file,mcp__fil__log`.

1. `get_canvas` with a `query` (it lists every section with its place) and find room: below the lowest section, at its x. Earlier rounds
   stack 864- or 2088-wide sections 1,200 units apart.
2. `add_section` with x, y, width and height sized for every scene (5 per row: width 2088, height 1008 for two rows), icon `spark`, name
   `<Section name> · N of M at 8/10`. Make it empty first: nodes placed later with x/y land inside it.
3. For each scene, `add_node`: kind `code`, format `motion`, model `claude-opus-5-5`, name `<Scene name> · <low score>/10`, x/y on a
   408 × 456 grid inside the section (x = section x + 48 + 408·col, y = section y + 120 + 456·row), a `prompt` of one sentence starting
   "A <length>-second HTML motion design scene: …", and a `note`:
   `8/10 · judges 8, 8 (round <tag>, <date>; earlier versions …) · Weakest: <the lower judge's weak note> · <Section>, message: <type> · style ref: <what the shot was> (<source url>, <m:ss>)`.
   It costs nothing and doesn't run. Never call `generate`.
4. Write each page with a cheap helper (Sonnet), not yourself, to save context: build the list with
   `node scripts/publish-list.mjs <run>/publish.json <id>=<nodeId>=<file> …`, then brief the helper: "for each entry Read the whole file,
   `write_file` with `text` = the whole file exactly (real `·` and `×`, never `\uXXXX`, no added whitespace), note '<note>', then
   `read_file` and compare its character count with `chars`; rewrite until they match; touch nothing else; never generate."
   Fil renames a node to its page's `<title>` + the score suffix after a write; that's expected.
5. Put each scene's best judged version on the canvas, even the ones short of 8, with the honest score in its name. A later version
   replaces the canvas one only if it scored at least as well (each scene counts the latest panel that judged the version on the canvas).
6. `log` a line on the canvas: what the owner asked, how many reached 8, that no credits were spent. If the canvas has a Scorecard
   document, add a short paragraph with `write_file` find/replace edits (never rewrite it whole).

## Show them at speed
Judges see stills; the owner watches motion. Do both of these before reporting, unasked:
1. **Screening page.** `node scripts/screening.mjs <run>/list.json <run>/screening.html --title "<Section> Screening" --group "<Section>, in film order" --canvas <canvas url>`
   (list.json: `[{id, name, file, final, score, judges, good, weak}]`). Serve the folder on localhost and test it in the in-app browser
   (click "Play all with sound"; check `ctx.state`, every buffer decoded, no console errors), then publish it with the Artifact tool
   (icon `film`).
2. **MP4s.** Start the lab, then `node scripts/video.mjs <run>/list.json <run>/videos` in the background, keeping the runner awake
   (lab.md). Check the result: `ffprobe` each file, a 1-fps contact sheet of `00-reel.mp4`, `volumedetect` (max below 0 dB), and blank
   frames (a fade-in from black on frame 0 is fine). Send the reel and each scene with `SendUserFile`.

## Bookkeeping
- Record every verdict as eval data: one JSONL line per scene per panel in the lab's `scores.jsonl` (task `score`, two ratings with the
  weak notes, `consent: "fil"`), per the owner's evals rule.
- A run's notes (what was asked, every panel, what's on the canvas, what's next) go in `<run>/NOTES.md`.
- Nothing here is a product change: no version, no changelog, no commit in facet-studio (run folders live in untracked `qa/`).
