# The camera

**Off by default.** A voice-led film: no camera slots, no reserved corner, scenes fill the frame. Nothing in this file applies, and nothing else in the skill assumes a person.

**Turn it on** only when they ask to be in it. Then the person records last and only has to press Record: everything else is finished and ready before they say a word.

## What changes

| | off | on |
| --- | --- | --- |
| Regions | `pic` uses the whole frame | `pic` stops short of the corner (`frameOf(shape, true)`) |
| Voice | The final voice | A scratch voice; their take replaces it |
| Hook | Set piece | Set piece, camera hidden |
| Benefit | Scenes | First line to the lens, full frame with a see-through title; the camera shrinks to the corner |
| Tutorial | Scenes fill the frame | Scenes clear of the corner |
| Try it | End card | Full frame with a see-through title over the ask |
| Captions | Under the scenes | The same, with the corner kept clear, and hidden while the camera fills the frame |
| In the edit | Nothing extra | Two `camera` slots, keyframes, a titles lane, a script document |

In the film: `film({ camera: true, cameraPlan: [[0, 'hidden'], [T.give, 'full'], [T.explainer, 'corner'], [T.so, 'full']] })`, or `?camera=on`. Each move glides for 0.54 s and arrives at its time. `hidden` cuts: use it for a scene that truly fills the frame, such as looks side by side. Previews draw a stand-in there: a backlit silhouette, drawn, never a generated face.

Run `check-film.mjs film.html --camera on`: it fails if any words sit under the corner while the camera's there.

## The corner

| shape | size | place |
| --- | --- | --- |
| 4:3 | 374 × 210 | x 1026, y 830: 40 px from the right and the bottom |
| 16:9 | 374 × 210 | 40 px from the right and the bottom |
| 1:1 | 300 × 169 | 40 px from the right and the bottom |
| 9:16 | 374 × 210 | 40 px from the right, 300 px from the bottom, clear of a phone's buttons |

Move a window with `view()` so its buttons sit left of or above the corner. A pointer must never click in it.

## Parts, about 30 seconds each

People read two short takes better than one long one. Part 1 runs from 0 to the start of "Here's how". Part 2 runs from there to the end. In the edit, each part is one camera slot, and its layouts are keyframes on that one clip, so a retake replaces one part with every layout intact.

## In Fil

After the scenes are in the edit (`references/fil-editor.md`):

```json
{"op":"add","insert":"camera","at":0,"dur":27.84,"set":{"camera":"rounded","camera_box":"landscape"}}
{"op":"add","insert":"camera","at":27.84,"dur":31.76,"set":{"camera":"rounded","camera_box":"landscape"}}
{"op":"set","clips":["<part 1>","<part 2>"],"set":{"animations":null}}
```

Add slots in time order. Clearing `animations` stops the slots fading at the join.

Keyframes on the 4:3 frame (a landscape take covers 4:3 at scale 1.3334; the corner is scale 0.26, x 493, y 395):

- **Part 1:** `opacity` at 0 → 0 with `ease:"hold"`, at the benefit's first word → 1. `x`, `y`, `scale`: at that same time `0, 0, 1.3334` with `ease:"hold"`; about 0.2 s before the first line ends the same values without hold; 0.54 s later `493, 395, 0.26`.
- **Part 2:** `493, 395, 0.26` with hold at its start, the same again about 0.18 s before the ask's first word, then `0, 0, 1.3334` 0.52 s later.

Keyframes closer than 0.02 s merge. On 16:9 the corner is scale 0.195, x 733, y 395, and full is scale 1. Measure other shapes: `set: { camera: "rounded" }` lays one out, and `get_video` reads back its numbers.

Scenes land above the camera when added after it. Move them under: `{"op":"lane","lane":"<scenes' lane>","below":"<camera lane>","name":"Scenes"}`.

## Titles over the full-frame camera

A see-through Motion node, one for each full-frame stretch: `add_nodes` with `{"type":"node","kind":"code","format":"motion"}`, then `write_file`:

```html
<!doctype html>
<html><head><meta charset="utf-8">
<meta name="fil:duration" content="2.38"><meta name="fil:alpha" content="1">
<style>
html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: transparent; }
.scrim { position: absolute; left: 0; right: 0; bottom: 0; height: 34vw; background: linear-gradient(transparent, rgba(0,0,0,.72)); animation: fade 2.38s linear both; }
h1 { position: absolute; left: 4.2vw; bottom: 8.6vw; margin: 0; white-space: nowrap; font: 600 6.2vw/1.05 'YOUR FACE', sans-serif; color: #fff; animation: word 2.38s linear both; }
@keyframes fade { 0% { opacity: 0 } 12% { opacity: 1 } 88% { opacity: 1 } 100% { opacity: 0 } }
@keyframes word { 0% { opacity: 0; transform: translateY(1.6vw) } 15% { opacity: 1; transform: none } 89% { opacity: 1; transform: none } 100% { opacity: 0; transform: translateY(-.8vw) } }
</style></head>
<body><div class="scrim"></div><h1 data-fil-text="title" data-fil-label="Title">The film's name.</h1></body></html>
```

Then `{"op":"add","node":"<title>","overlay":true,"at":…,"dur":…}`, name the lane "Titles", and check it sits above the camera. Type in `vw` grows on a wider shape: use `vmin` if it's going to be reshaped.

## The teleprompter

`add_document` named `Script · <name>.md`: each line on its own, `#` headings and `[directions]` show but aren't read, so the word count should equal the words spoken. The row reads each slot's words from the scratch voice under it, so check every word is covered by a slot. Captions must stay in the edit: they're what the teleprompter reads. Hide them under big type with a range; don't remove them.

## Hand it over

Tell them: press Record on either camera, two parts, about 30 seconds each. Everything else is in place. Don't try the record link yourself. Links for phones are single-claim: send the QR code as a picture.

## When the take is in

Read the take's words (`look: { max_words: 1 }`, `get_video` with `captions: "list"`, `scripts/words.py`). Because scenes are timed by name, new words mean a new render at the new times. Where they reworded a line, keep the scratch word's name by editing `words.json`, or add a word to the scene. Render the scenes that moved, then `{"op":"replace","clip":…,"file":…}` each: a replace keeps its place and length, so check with `get_video` when a scene's length changed.
