---
name: room-short-9x16
description: Make a 60-second 9:16 short from a finished long video, set in the creator's own 3D room. About 60% is the product demo playing on their real devices, rendered in Blender on a rented GPU (RunPod, Cycles), and about 40% is them on camera, generated with Seedance 2.5 from approved dark-study stills (drafts first, then 1080p finals of the picked takes), with Inter Tight words set in the scene, a music bed written from a measured reference, a cover that is the first frame, two cuts (Instagram ends on a comment keyword, Shorts and TikTok on "full video in the description"), file checks, an independent judge, and posts scheduled in Fil. It begins by asking how the stills (Seedream 5.0 Pro), the black-and-white storyboard, the Blender scenes, the script, the cover, the voice, the words, the music and the posting should be set up for this video. Use when someone asks for a short, reel, Short or TikTok "in my room", "with my desk and devices", "demo on my Studio Display", "like that room reel", a "dark study" or "product film" look for a vertical video, Blender or RunPod demo scenes for a short, or wants this workflow or its prompts repeated for a new video. For a twin cut out over the long video's own footage use long-video-to-short; for a reel from a tweet or landing page use html-reel.
---

# Room short, 9:16

A 57 s short of a 22-minute tutorial (a design-tool tutorial, 24 Nov 2026), made in one day across five cuts. The idea: the viewer
sits in the creator's room. The demo plays on their real desk display, and they turn to the camera to say the lines
that matter. This skill is that run written down, with every prompt in `references/prompts.md`. It starts with questions (the stills' setup, the storyboard, how the
Blender scenes run, then the script, voice, words, cover, music and posting), because no two videos use the same setup.

It builds on `long-video-to-short` (script, voice, phrase alignment, `build_voice.py`, `export.py`, `sync_check.py`,
`check_export.sh`, judging, posting). Read that skill first; this one only changes where the pictures come from.

## What the creator asked for, in their words

These are the brief. Check every cut against them.

- "60% is just demo of my landing page, and maybe 40% where I'm showing the camera."
- Sets from their own 3D room: the desk display, the laptop, the phone, the chair, the room.
- "More like night lights with lamps… we don't need particles." Then: "this is too yellow."
- The look: a dark study, warm lamps as bokeh, the screen the brightest thing, big clean type.
- Text: Inter Tight, "augmented, where there's good contrast in a scene, so highly contextual": a light line plus one
  heavy phrase, set in the scene. Not a fixed headline with captions at the bottom.
- "Make sure we see the demo well." Never clip a design; show the polished final builds.
- Their face is never graded, filtered, covered or under type.

## Ask these first, every time

No video uses the same setup, so nothing below is assumed from the last run. Before any paid run, any still and any
render, ask the creator these things and wait for the answers. The first three decide the most; the rest are quick. Ask them together, in one message, each with
the last run's answer offered as the default they can accept or change.

1. **The stills: how is Seedream 5.0 Pro set up for this video?**
   - Is it Seedream 5.0 Pro again, or another image model?
   - Which look: is there a reference video or picture for the lighting and mood? (Last run: a dark study taken from
     a 30 s product film they sent. Never guess a look; three were made before one was approved.)
   - Which room and devices appear, and which face references and outfit for the shots of them?
   - Resolution and price a still (last run: 1.5k, 9:16, 6 credits a demo still, 8 with face references).
2. **The storyboard: black and white first?**
   - Confirm the black-and-white storyboard comes before any colour still (the default, and what they asked for).
   - How many scenes, and the split between camera and demo (last run: 11 scenes, 38% camera, 62% demo).
   - Which lines are said to camera, which are working shots, and which devices each demo scene uses.
3. **The Blender scenes: how will they run?**
   - Where: on this Mac (Metal) or a rented GPU (RunPod)? State the hourly price and the estimated total first.
   - From which 3D project, and may a copy be made? Which screen shows each demo (desk display, laptop, phone, TV)?
   - What plays on the screens: recordings of the live pages, or frames from the long video's master?
   - Quality: samples, denoiser, render at 30 fps doubled or a true 60, and the lighting (night lamps, how warm).
   - Or no Blender at all for this video (the room's three.js render, or footage from the long video)?

4. **The script.**
   - Which part of the long video is the short about, and what is the one thing a viewer should take away?
   - The hook line, how many steps or rules, and which exact product and model names to say.
   - The two endings: the comment keyword for Instagram, and the Shorts and TikTok line.
   - Length (last run: 57 s), and anything a sponsor's contract says must or must not be said.
5. **The voice and the shots of them.**
   - Which voice (last run: their cloned voice for the demo lines, Seedance's own voice on camera)?
   - How they appear: Seedance 2.5 from stills, their avatar twin, or real camera takes? Drafts first, and may the
     picked drafts be made into 1080p finals (price first)?
6. **The words on screen.** Font, the light line plus heavy phrase or another style, and the accent colour (last run:
   Inter Tight, off-white on dark shots, dark ink on a light wall).
7. **The cover.**
   - Which logo (a real file), the big name or number, and the light line above it.
   - Colour (last run: off-white, no orange), the logo above the line, both large.
   - Which frame of them it sits on, and whether it is also the video's opening frame (needed for Shorts and TikTok).
8. **Music and posting.**
   - A reference for the music's feel, and may its sound be recorded to measure it?
   - Which platforms and accounts, the day and time, and whether the full video is public yet.
   - The comment automation: keyword, the public reply, and what the DM sends.

Write their answers at the top of the video's ledger or plan, with their words, and build from those. If an answer
changes a step below, the answer wins.

## The order, and what gets approved when

Each arrow is a stop for a yes. Skipping one cost a full round every time it was tried.

```
script + voice ─► black-and-white storyboard ─► colour scene stills (the look) ─► room in Blender, demo clips on a GPU
      ─► Seedance drafts of each on-camera line ─► cut ─► 1080p finals of the picked drafts ─► music
      ─► file checks ─► judge, fix the lowest item ─► cover as the first frame ─► two cuts ─► posts scheduled
```

1. **Script and voice** as in `long-video-to-short`: paragraphs in their cloned voice, two takes each, word times by
   `align_phrases.py`. On-camera lines are whole sentences of 4 to 7 s.
2. **Storyboard, black and white.** One frame per scene with CAMERA or DEMO, the time, and the line. Count the
   seconds: aim for 38 to 40% camera. Composition is settled here, where a frame costs 5 credits.
3. **Scene stills in the look.** One look prompt wired into every still, so a change of look is one edit. Camera
   stills use their identity prompt and face references. Three looks were tried (golden hour, game-cinematic god rays,
   dark study); only the one taken from their own reference video was approved. Ask for a reference before guessing.
4. **The room in Blender** (below). The demo clips come from here, not from the stills: stills show a frozen page.
5. **Seedance 2.5 drafts** of them saying each on-camera line, from the approved stills. Check each transcript.
6. **The cut** with the drafts, to judge pacing before paying for finals.
7. **Finals, music, checks, judge, cover, posts.**

## The room in Blender

Scripts are in `scripts/`. The creator's room model is private: never upload it anywhere public.

1. **Export the room** from its three.js project as a GLB (`export-glb.mjs`): night lighting, the display's screen
   mesh named `SCREEN`, a JSON of the lights. Work on a copy of the project; never edit the original.
2. **Build the .blend** (`blender -b -P build.py`): imports the GLB Z-up, rebuilds the spot and point lights from the
   JSON (colours pulled 75% toward white: three.js lamp colours render far too yellow in Cycles), gives `SCREEN` an
   emission material fed by an image sequence, and a near-black world.
3. **Record each page** as frames (`anim.mjs`, or frames pulled from the long video's 4K master), one folder per clip.
   **Every demo scene moves:** the page scrolls or is being used in every clip, from a real recording of the
   finished page (speed a slow scroll up 2 to 3 times). A page held still on the display reads as a screenshot;
   the creator sent the first cut back for five still scenes.
4. **Render a clip** (`render.py`): the camera frames the screen by how much of the frame it fills (`fill`), with a
   slow eased move (`side`, `up`), depth of field focused on the screen, Cycles with AgX. Options: `seq, n, out,
   frames, step, fill, side, up, samples, fstop, exposure, device, dn`. Render at 30 fps (`step: 2`) and double to 60.
5. **Rent the GPU.** State the hourly price before creating a pod and terminate only pods you created. One RTX 4090
   rendered eight clips (1,219 frames at 1080 × 1920, 64 samples, OptiX denoiser) in about 70 minutes for $1.05.
   Send the bundle (`room.blend`, `render.py`, the frame folders) through a small token-protected upload server on
   the pod's own proxied port, in 40 MB parts. No public links, no new SSH keys.
6. **Check a still of every clip before the full render**: screen readable, nothing clipped, the lamp or webcam not
   where the words will go.

What the Blender room lacks against the three.js one: glass, thin plant stems, some small props. Say so.

## On camera

- **Drafts first.** Seedance 2.5 draft, 480p, 9:16, the still as start image and image reference, the line in their
  voice as the audio reference. One draft per line. Prompts in `references/prompts.md`.
- **Finals only for picked drafts**, by `draft_job_id` through the Higgsfield MCP (16 credits a second). The final
  keeps the take, so nothing in the timeline moves. Never regenerate a final.
- **Keep Seedance's own voice on these lines.** A speech-to-speech pass into the cloned voice scored further from it
  (0.76) than Seedance's voice did (0.85, the same as two of the clone's own paragraphs against each other). What the
  ear hears as "a different voice" was tone: Seedance's lines were about 9 dB duller above 5 kHz. Meet in the middle:
  +6 dB high shelf at 5.5 kHz on the Seedance lines, −3 dB on the cloned paragraphs.
- **Working shots** (typing, reading) are drafts with no audio reference and "He does not speak". They take the voice
  over them and are how the camera share reaches 38 to 40% without more talking heads.
- 24 fps clips go to 60 by repeating frames (`fps=60`), never by interpolation: it smears faces.

## Words in the scene

`scripts/scenes.py` (drop-in for `long-video-to-short`'s). Each section in `plan.json` has `pages` (a light line and
a heavy last line), `at` (where it sits), `ink` (`dark` on a light wall) and `scale`.

- On dark shots: both lines off-white, with a soft shadow. No orange by default: the creator keeps orange for videos
  about one product whose colour it is. Ask the accent colour; when unsure, off-white.
- On a light wall: both lines in dark ink at `scale` 0.8 (0.86 before the 3:4 rule). Orange on beige measured 1.35:1 and the judge could not
  read it; descenders touched the lamp bar at full size.
- **Every word sits inside the centred 3:4 area of the 9:16 frame: y 240 to 1680 of 1920, with 10 px to spare.**
  Instagram's grid and profile show that middle and cut the rest, so a caption at the very top loses its first line.
  This holds for captions, the cover's type and logo, and anything else meant to be read. `scripts/safe_area.py`
  measures every frame's words and fails naming the section outside; run it before every export. If the words then
  touch something in the shot (a lamp bar, a webcam), make them smaller (`scale` 0.8 here), don't move them out.
- Never across their face or the page on the screen. On their shots the words sit on the shirt, below the hands.
- A clip that changes page in its last frames flashes at the cut: trim and hold the last good frame.

## Music from a reference they can't describe

`scripts/record-reference-audio.mjs` plays the reference in Playwright's bundled Chromium, muted to the speakers,
and records the page's own audio stream (ask first: it is a recording of someone's video, used only to measure).
Measure tempo, where the energy sits and how level it is, then write the music prompt from those numbers. Mix the bed
about 15 dB under the voice, fade the last 1.3 s, and loudness-normalise the mix to −14 LUFS. Add music after
`sync_check.py` has passed on the voice-only file: music breaks its onset detection.

## The cover is the first frame

Shorts and TikTok take a frame, not an upload, so the cover has to be in the video. `assets/cover.html` draws it over
the hook's first frame (logo above a light line above the big name, off-white, below their hands, inside the 3:4 area
and the 4:5 feed crop). `cover-overlay.mjs` saves the same type as a see-through PNG; `scenes.py` holds it over the hook until the
subject's name has been said (frame 87 here), fades it in nine frames, and starts captions after it. Use a real logo
file, never a redrawn one.

## Two cuts, checks, judge, posts

- Instagram's cut ends "Comment WORD and I'll send you every prompt"; Shorts and TikTok end "check the full video in
  the description". Export the first, swap the closing clip, then `export.py --tag d --reuse ''`.
- `safe_area.py` (and `--tag d`) passes: no word outside the 3:4 area.
- Both files: under 30 MB, 1080 × 1920 at 60 fps, bt709, about −14 LUFS, no silence over 1 s, transcript word for
  word, captions 20 to 70 ms early.
- One independent judge on frame strips (brief in `references/prompts.md`). Fix its lowest item and report the
  scorecard as it is, including what is left.
- Posts are Fil post nodes with the video as media, scheduled per platform (`assets/posts-example.md`). The full
  video should be public before they go out. The comment-keyword automation can only attach to a reel that exists,
  so book a task for a few minutes after the post time. AI labels are set by the creator by hand.

## What it cost (this run)

| What | Cost |
|---|---|
| Storyboard, 12 frames, Seedream 5.0 Pro | 60 Fil credits |
| Scene stills, three looks | 88 + 74 Fil credits |
| Voice, five paragraphs × two takes | about 14 Fil credits |
| Blender on one RTX 4090, 70 min | $1.05 |
| Seedance drafts, five clips | about 87 Higgsfield credits |
| Seedance 1080p finals, 29 s | 464 Higgsfield credits |
| Music, 60 s | 15 Fil credits |

Log every paid run with the creator's words that allowed it.

## Mistakes this run made, so the next one doesn't

- Three looks before asking for a reference video.
- A three.js render of the room first, then Blender: go to Blender once the storyboard is approved.
- Earlier cuts seated a cut-out Avatar twin in the room; the creator then asked for Seedance shots from the stills,
  which are full frame and need no cut-out.
- Orange heavy lines on a light wall.
- Captions set 10 px above the 3:4 area, found by the creator in the scheduled posts' previews. Both cuts were
  re-rendered and the posts' videos replaced.
- A cover made as a separate image, then moved into the video.
- Posting asked for while the full video was still unlisted: check that first.

## Files

- `references/prompts.md`: every prompt (storyboard, look, scene stills, Seedance lines and working shot, finals,
  music, judge).
- `scripts/`: `export-glb.mjs`, `anim.mjs`, `shot.mjs`, `build.py`, `render.py`, `scenes.py`, `safe_area.py`, `sheet.py`,
  `record-reference-audio.mjs`, `cover-shot.mjs`, `cover-overlay.mjs`. The `.mjs` files need `playwright` installed
  (its bundled Chromium, never real Chrome).
- `assets/`: `plan-example.json`, `cover.html`, `posts-example.md`.
