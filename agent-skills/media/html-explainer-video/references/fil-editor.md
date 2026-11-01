# Assembling in Fil's video editor over MCP

A Video edit node cuts canvas videos, pictures, sounds and words into one film. Install Fil's MCP from fil.design/for-agents. Everything here is free except the voice, the captions and any music you generate, and each of those gives its price first with `max_credits: 0`. Send the commands as they're written, with `brief: true`, and read back with `get_video`.

Why rendered MP4s, not live HTML scenes in the edit: a whole film page floods `write_file`, and Fil draws about 5 ms per element a frame. Render scenes to MP4. Small see-through titles stay real Motion nodes.

## 1. The canvas and the words

`create_canvas`, give the person its link, then `add_document` for Explainer.md, Look.md and Script.md.

## 2. The voice

```
generate { canvas_id, kind: "audio", model: "eleven-v4", voice: "Hope", name: "Voice", prompt: <the script's lines>, max_credits: 0 }
```

That gives the price and leaves the node waiting. Tell the person, and run it with their OK: `generate { canvas_id, node_id, max_credits: <the price> }`, then `check_node` with `wait` for its link. Save it as `voice.mp3` (`curl -o`), once. `list_models` with `kind: "audio"` lists the voices.

## 3. The edit, and the clock

```
make_video { canvas_id, node_ids: [<voice>], shape: "4:3", fps: 60, name: "<the film>" }
```

It answers with the voice's clip id.

Captions with one word to a line give every word's time:

```
edit_video { node_id, commands: [{"op":"set","clip":"<voice clip>","set":{"sound":"voice"}},{"op":"captions","generate":true,"look":{"max_words":1}}], max_credits: 1, brief: true, wait: 20 }
get_video { node_id, captions: "list" }
```

Save that answer as `captions.txt`, then `python scripts/words.py captions.txt --voice voice.mp3 --out demo/words`. Short words can still share a line ("word. Four."), so `--voice` splits a line with two sentences at the voice's own pause, and the rest by their letters. A voice made in Fil is aligned to its own script, so names come out as written. Read them against the script anyway. Now every scene is on the real words: re-check them, and render (`scripts/render.mjs film.html --scene all --fps 60 --scale 2 --out final`).

## 4. Upload the scenes and sounds

`upload_file { canvas_id }` gives an address, good for an hour.

- Under 3.9 MB: `curl -sS -T file.mp4 "<address>"`. It answers with its `asset_id`.
- Larger: `curl -sS -X POST "<address><name>?direct=1"` gives `upload_url`, `content_type` and `finish_url`. Then `curl -T file.mp4 -H "Content-Type: <content_type>" "<upload_url>"`, then `curl -X POST "<finish_url>"`.

Name each `<film>-<scene>.mp4`, and keep the ids. Save the sounds' ids as `assets.json` for `sfx.mjs`. Up to 100 MB each on Max. A minute of flat graphic scenes at 2×, 60 fps came to about 16 MB in all.

## 5. Scenes in order

```json
{"op":"add","file":"<hook>"}
{"op":"add","file":"<give>"}
```

Then `{"op":"set","clips":[…all scenes…],"set":{"mute":true}}`, and on each scene that dissolves `{"op":"set","clip":"…","set":{"transition":"dissolve","transition_duration":0.3}}`. Name their lane: `{"op":"lane","lane":"<lane>","name":"Scenes"}`, and the voice's "Voice". At most 60 commands a call.

## 6. Music

```json
{"op":"add","file":"<bed>","at":0,"dur":<the film's end>,"set":{"sound":"music","volume":0.12,"under_voices":0.5,"fade_out":1.5}}
```

Name its lane "Music" (the answer says which: look for its new lane in `Lanes`). A bed from their library is free; `eleven-music` is priced first.

## 7. Sound effects

`scripts/sfx.mjs film.html --out sfx.json --assets assets.json` writes the commands. Send them 60 a call, `brief: true`. Read the lanes back: a busy named lane sends a clip elsewhere, so check nothing sits on the voice's lane or above the scenes, and name the new lanes "Sound effects", "Sound effects 2".

## 8. Captions in the look

Map the look's caption variables onto Fil's closest face, then hide them under big type with a range. Don't remove those: removing a caption deletes words the teleprompter reads, and renumbers the rest.

```json
{"op":"captions","look":{"font":"Geist","size":46,"weight":600,"color":"#ffffff","highlight":"#efb36c","outline":3,"outline_color":"#000000","box":"none","position":"bottom","max_chars":30,"max_lines":1,"max_words":0,"animation":"none"},"ranges":[{"start":0,"end":3.9,"offset":400},{"start":17,"end":20.2,"offset":400},{"start":52.3,"end":61.8,"offset":400}]}
```

A look whose grounds change from scene to scene needs a box, or white words with an outline turn to mud on a bright ground: `"box":"line","background":"#0c0c0c","background_opacity":1,"outline":0`. Every range goes in one command: a new `ranges` replaces the old. On 9:16 use a bigger size (about 56) and `offset: -240`, to sit clear of a phone's buttons.

A caption edit must keep its word count: a longer `text` eats the next caption's id and merges them. Read `captions: "list"` first, and if it merges, set the whole text with `split_after`.

## 9. Chapters

```json
{"op":"chapters","chapters":[{"at":0,"name":"Hook"},{"at":4.1,"name":"Benefit"},{"at":20.2,"name":"Quick tutorial"},{"at":45.2,"name":"Try it"}]}
```

## 10. Read it back

`get_video { node_id }` once: scenes in order and muted, the voice on its own lane, music under it, nothing above the scenes but what should be, the length as planned. `get_canvas` with a `query` gives a short read: `check_node` on an edit lists every clip.

## 11. Export

`export_video { node_id }` renders in the Fil window that has the canvas open. It says queued, and `check_node` may still say so 25 s later, then it finishes in minutes, even with the tab hidden. One at a time. Stuck, or "This file isn't available": the open tab is stale, so reload it and export again. Then read the link with `get_video`, and download it once to check it (`references/checks.md`). Don't run ffmpeg over its link, and don't open the edit in a browser to look at it: use `get_video` and a downloaded copy.

## Changing a scene

Re-render it, upload it, `{"op":"replace","clip":"…","file":"…"}`. A replace keeps the clip's place and length, so a same-length render is one command. A changed length moves the scenes after it: read `get_video`, and move anything at an absolute time back.

## Another shape from the same edit

Better: render the scenes again in the shape, which takes one setting. For a quick copy, `{"op":"settings","shape":"16:9","copy":true}` makes a copy beside it: 4:3 scenes fit on their own edges, cameras keep their corner. Type in `vw` on a title grows with the width.

## Traps

- Closing a gap moves everything after it, sound effects too. Remove with `close_gap: false`, or move the effects back afterwards.
- Scenes land above whatever's already there when they're added after it: `{"op":"lane","lane":"…","below":"…"}`.
- A session's Fil tool list is fixed when it connects. A field refused as unknown means an older list: start a new session.
- A soundless video still counts as a sound to transcribe: mute scene clips before generating captions, or it costs double.
