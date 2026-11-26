# The camera plan and his digital twin

## Contents
- The plan: key places only
- Layouts on the grid
- His twin, end to end
- What was tried before (don't repeat it)

## The plan: key places only

`window.CAMERA = [[time, layout], …]` in film.js, read by the forked engine. Layouts: `full`, `half`, `corner`,
`hidden`. Meng's rule since 22 Nov: the camera only at key places, **10–20 % of the runtime**, in a corner, a third or
half the frame, each stretch whole sentences, 5 to 30 s, never cut mid-sentence (on Greymourn it was
about 25 %). Greymourn's KEYS, the worked example:

| Where | Layout |
|---|---|
| the hook's twist ("I didn't write the code…") | full, then half with the prompt count beside him |
| the promise | half |
| each step's title (5) | half, from the cut + 0.54 s, hidden on the step's first content word (about 3 s; since 22 Nov a stretch runs on to a sentence's end, 5 s at least) |
| "So where is it now?" until "Not at nine" | half |
| what I'd keep | half |
| the end card | corner |

Everything else hidden: the result and the material fill the frame. `scripts/film-facts.mjs` prints the share by
layout (Greymourn: 24.5 % on screen by plan). `?camplan=all` kept the old always-on plan for comparison.

- A move that grows the camera at a cut starts at the cut (`G = 0.54`), never over the leaving scene.
- To and from hidden the camera fades over its glide (it appears in its new shape and leaves in its old one), not a pop.
- Over the camera: the chapter mark top left in a chapter's own scenes, a lower-third name tag on his first full frame.

## Layouts on the grid (1920 × 1080 stage)

- **Half**: x 1224–1824, y 108–972 (600 × 864, 96 from the right, 108 top and bottom). Content in the left column
  (x 120–1160); align its top and bottom to the camera's, and a label's baseline to the camera's top or bottom.
- **Corner**: a 300 px circle at x 1500–1800, y 700–1000, on the content's right margin and 80 from the bottom.
  At 40 px from the edges (the engine's default) judges marked every corner frame down.
- **Full**: the whole frame, his name tag lower left for ~3 s.
- Where the camera hides, the layout may take its room (`html.camkeys` CSS scope); keep a reflow only if it wins
  blind (Greymourn: stack, dream loop and blind pair won; four others lost and were dropped).
- Probe with `scripts/rects.mjs film.html <t> <selectors> --cam` every 0.25 s through camera scenes: nothing runs
  under it except by design.

## His twin, end to end

The recipe for his twin is `meng-digital-twin/references/heygen-twin.md`. For the film:

1. **The stretches.** From the camera plan, list every span where the camera is on screen, padded by the glide
   (Greymourn: 8 stretches, 18.82–49.62, 65.13–68.13, … 249.72–end; 70.8 s).
2. **One audio file of exactly those stretches of the film's voice**, joined with 0.4 s of silence, and a map of
   where each starts in it. The twin then says the film's own words: no re-voice, no word time moves, sync is exact.
3. **Price, then his typed yes.** HeyGen Avatar 6 on his trained **Kimi** look,
   1080p: $0.10 a second (Greymourn: $7.30). His twin's Avatar 6 video node in Fil with the audio wired in as its sound
   (for your own twin, `create-ai-avatar`). One render.
4. **Frames**: `ffmpeg -i kimi-keys.mp4 -q:v 3 film/meng/kimi/%04d.jpg` (not in git). Hold a live face to the film's
   end by playing the render's silent last second back and forth.
5. **twin.js** (`assets/twin.js`): `window.TWIN = [{ from, to, off, dir, n, fps, fx, fy, fs }]`: film from/to, `off`
   = seconds into the render at `from`, and where his face sits in the frames (`fx`, `fy` as shares, measured with
   Apple Vision; `fs` = his face's size against the still the layouts were framed on). `CAM_DRAW` in film.js frames
   his face the same way in every layout, so a glide is one move, and tighter in the corner.
6. **Prove sync**: `scripts/sync-check.mjs kimi-keys.mp4 voice.m4a film/twin.js` cross-correlates the render's audio
   with the film's voice per stretch: Greymourn read 0 ms, r 1.00 on all eight.
7. **No grade.** His frames as HeyGen made them (rule 5 in SKILL.md).
8. **His approval** (21 Nov). Check the mouth and eyes for drift, then send him the twin clip. Only an approved clip
   goes in the film or on to a Genjutsu re-skin.

Judges scored the twin frames 5–6 against his still's 7–8 (soft upscaled 1080p, shiny skin, the mic over his chin,
blurred hands, a cool grey wall). He kept the twin. If a better look or framing would help, price a new render and
ask; HeyGen keeps looks at 1280 × 720 whatever the takes, so the camera is soft at full frame: keep him half or
corner where you can, full frame only for a few seconds.

## What was tried before (don't repeat it)

| Route | Result |
|---|---|
| A drawn silhouette, labelled placeholder (draft 1) | fine as a stand-in; never ship it |
| His approved still 166 with a slow push (drafts 2–4f) | judges 7–8; "dead stills" when held 20 s |
| Seedance 2.5 draft (480p) | 4.5 with judges; brings its own re-timed voice, so the film can't stay on his words |
| Intone 720p (cameras 144/152/154) | 6.5 with judges; he rejected it: "I don't speak like that!" (mouth 30–70 % wider, a fixed stare, 10–46 % slower than him) |
| Genjutsu (motion transfer) | needs a driving video, takes no audio; priced, dropped for this film (his call). Since 21 Nov only if necessary, driven by a HeyGen Avatar 6 twin clip he approved (`genjutsu-scene`) |
| HeyGen Kimi twin on the film's own voice (4g) | kept by him |
