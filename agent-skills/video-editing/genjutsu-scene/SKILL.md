---
name: genjutsu-scene
description: Make a scene of Meng To himself inside any world, saying his line with his own face, voice and mouth, from his HeyGen Avatar 6 twin to Genjutsu. The world comes from the video's own footage (a game capture), a three.js 3D scene or a Blender scene, in its costume and light. Greymourn scene one recipe (Nov 2026) with an eye-anchored drive from his Avatar 6 twin, a plate from the world, a Seedream start still, Higgsfield Genjutsu motion transfer, Sync Lipsync 3 on his voice (remap + repeated-frame fix), a 4K60 insert, lip-sync and gaze measures, two blind Opus judges, a 480p draft then the 1080p final, every spend priced and run on his typed yes. Use whenever he asks for "me inside the game", "put me in this Blender/3D scene", "me in knight armour", a Genjutsu shot of himself, the next scene of a film, or a fix to one (lip sync, eyes, head size, light, the ending), even without saying Genjutsu. Not for his desk camera (making-of-film), studio stills or clips (meng-digital-twin), or a character in his place.
---

# Meng in the scene: HeyGen Avatar 6 → Genjutsu

A 5-10 s shot of Meng **inside a world**: a game, a three.js scene or a Blender scene. He wears its costume, is lit by its
light, and says a line with his own voice, his own mouth and his own camera's motion. In a film it goes in as an insert
where his desk camera would be, over the same words. Greymourn's scene one (film 19.25-25.65 s, "I didn't write the code,
and I didn't model anything. I wrote about a hundred and seventy short prompts.") took four threads to get right
(`references/greymourn.md`). This skill is what they learned.

Written for Meng's own setup (Greymourn, Nov 2026). This public copy leaves out his job and media IDs and machine
paths: bring your own HeyGen twin (`create-ai-avatar`, `digital-twin` in this repo) and Higgsfield account. Skills
named `meng-…` below are his private ones.

```
 his HeyGen Avatar 6 twin ──► drive (eye-anchored, push-in) ───────────────────────────┐
 the world (game capture │ three.js │ Blender) ──► plate + costume ──► composite ──► Seedream start still
                                                                                        ▼
           Genjutsu motion transfer ──► Sync Lipsync 3 (his voice) ──► dedup + retime ──► 4K60 insert
                                                         ──► measure ──► 2 blind judges ──► report, his yes
```
First a 480p draft. After he confirms it, the 1080p final with the same inputs, changing only what he asked.

## His rules for these shots (each came from a correction)

1. **His camera, his face, his voice.** "I want you to use my camera, my face" (prompt 220): the motion comes from his own
   twin, never from a game character re-skinned. "as long as we can see my face and I'm talking, and it's using my voice"
   (222): the film's own voice (or his cloned voice for a new line), never someone else's.
2. **Never cut off the speech.** "the speech should not be cut off ... roughly around five to 10 seconds" (229). Use whole
   sentences, with the last word's tail inside the clip.
3. **Draft first, then the final.** "once we confirm draft, we'll render at 1080p non-draft" (230). Drafts are 480p
   ("Yes, 480p", 232).
4. **Price, ask, then run.** Get every paid step's price on the real inputs (`estimate_video_cost`, `higgsfield generate
   cost`, Fil `max_credits: 0`). Ask one plain question with credits and dollars, and run only on a yes he types in your own
   thread. A relayed yes doesn't count for video of him. Re-price a step whose input didn't exist when you asked. Stop if it
   prices higher than you said. The HeyGen wallet is shared with DreamCut, so say the balance too.
5. **His camera stays as HeyGen made it.** Never grade, relight or sharpen his twin footage in the film (212, 214). The
   drive is a working copy for Genjutsu only.
6. **Small head, eyes on the lens, a real mouth, real light** (225-226). The pauldrons or shoulders span about 4.0-4.5 face
   widths; a warm key falls off across the face with a cool rim.
7. **"don't finish with big eyes"** (237). Genjutsu exaggerates, so a small brow lift in the drive becomes a startled
   stare. Check the drive's last ~1.5 s before spending.
8. **Hands off his screen.** Headless only: no clicks in the browser pane, no computer use, no recording. Show results
   with SendUserFile (`display: render`) and a copy in `~/Downloads/`.

## Workflow

Work in `~/Library/Caches/<project>/<thread>/`, never in a repo. Build the macOS Vision tools once:
`swiftc -O scripts/lmdump.swift -o <work>/lmdump` (face landmarks, `--video clip.mp4 FPS` or `--images …`) and
`swiftc -O scripts/seg.swift -o <work>/seg` (person matte). Run anything over ~2 minutes in the background.

### 1. The line
From the film's word timings (`words.json`, `[word, start, end]` in film seconds), take whole sentences of 5-10 s. Clip
window = just before the first word to just after the last word, ending before the next word. Cut the **clean voice** for
the window (mp3 for Sync; upload with `media_upload` + PUT + `media_confirm`, free) and the **film mix** for the same window
(laid under the result). Find where speech really ends (RMS above -35 dB of peak); Greymourn's ended 6.13 s into the 6.40 s line.

### 2. The motion source: his HeyGen Avatar 6 twin
Two ways, both his real face from real takes (the recipe and the looks are in `meng-digital-twin` →
`references/heygen-twin.md`):
- **The film's own camera** (free): his twin footage that's already in the film, as frames. Choose a stretch where he
  looks into the lens (`gaze.py`: 85-90 %+ of frames |look| < 0.05), with quiet, low hands, and **no brow raise or big
  gesture in its last ~1.5 s** (`eyes.py --every 2`: brow above ~0.43 is the warning sign). Its mouth says other words,
  which is fine because Sync redraws the mouth.
- **A new Avatar 6 clip of the exact line** (~$0.10 a second at 1080p, ~$0.64 for 6.4 s, priced and asked): Fil video node
  `heygen-twin-meng-6`, 16:9, 1080p, the voice line wired in as the sound, in the look that matches the film (Greymourn:
  Kimi). Its mouth and head already move with these words, which gives Sync less to fix. Looks are 1280 × 720 underneath.
- Then build the drive with `scripts/drive.py`. It anchors his eye midpoint on the start still's eye point, adds a slow
  push-in (scale ~0.77 → 0.90), and fills the border with blurred edge pixels (a hard edge comes back as a slab). Make it
  the line's length (6.4 s at 25 fps = 160 frames).
- **Genjutsu follows the drive in real time and drops the tail** past the last whole second (a 6.40 s drive came back
  6.04 s), so the last frame you'll see is drive frame ~151.
- To fix a bad ending without changing an approved part: keep frames 0..k, then play back and forth inside a calm stretch,
  turning at slow moments and never into a long blink (`--index 0-116,115-94,95-115`). Check the tail as a contact sheet
  and with `eyes.py`.

### 3. The world: a plate, the light, the costume
One clean plate at the talking shot's camera: eye height, 30-36° field of view (35-50 mm), the spot 2-3 m in front of a
background with depth, a motivated light source in or just out of frame (a brazier camera left), and nothing standing where
he will be. Pick from 3-4 candidates.
- **The video's own world (a game or web scene):** capture headless in Chrome for Testing with the game's own renderer.
  Hide the player, HUD and menus, remove enemies near the spot, set the camera by position, look point and fov, step the
  world so it settles, then take the screenshot at 3840 × 2160. Example: `references/plate-capture-example.mjs` (Greymourn's
  P2 plate: `{"pos":[86.6,17.62,57.0],"look":[85.0,18.6,75],"fov":36}`).
- **A three.js 3D scene:** the same, from the page: a window hook that sets the camera, hides UI and helpers, renders one
  frame at 2× and returns the canvas. Use the page's own renderer, tone mapping and post, so the plate matches the scene.
- **A Blender scene:** `Blender -b scene.blend -P scripts/blender_plate.py -- --cam X,Y,Z --look X,Y,Z --lens 35 --fstop 2
  --hide "Character" --out plate.png`. It renders 3840 × 2160 Cycles on the GPU with depth of field focused on the spot, and
  writes `plate-meta.json` with the lights' directions from the spot, for the relight. It never saves the .blend.
- **The costume:** the world's own character or armour (a render or capture of it, head removed, drawn as a silhouette),
  scaled so the shoulders span ~4.3 of his face widths. Write down the light: key direction and colour, the rim, the ambient.

### 4. The start still (2-3 looks, 2.5 credits each)
- **Composite** (free): plate + costume + **his head from the drive's first frame at the drive's framing** (`seg` for the
  matte), so the still and the drive line up. Pre-relight it to the plate's light (key falling off across the face, rim on
  the far edge). Method: `references/comp-example.py`.
- **Seedream 5.0 Pro edit** (`seedream_v5_pro`, 2k, 16:9). Refs are the composite, the costume reference and real photos of
  him only. The prompt keeps him from the neck up, describes his face and hair in words, describes the costume as composed,
  and gives one light paragraph per look. Greymourn's: `references/seedream-common-greymourn.txt` + `seedream-lowkey-greymourn.txt`.
- **Pick** by: shoulders/face width 4.0-4.5; face proportions vs his real photos (chin/iod ~1.9-2.0, width/iod ~2.3); eyes
  on the lens; his hairline (receding M, skin fade, messy clumps); face no brighter than the costume; a real falloff across
  the face. Seedream reframes tighter than the composite and ignores "keep the head size".

### 5. Genjutsu motion transfer (480p 18 credits, 1080p 120, for 6 s)
`generate_video` model `hf_mult_motion_control`, medias `image_references` = the still and `video_references` = the drive,
`resolution` 480p (draft) or 1080p (final), `aspect_ratio` 16:9. Prompt: `references/genjutsu-prompt-greymourn.txt`. It
keeps his face, hair, costume and world, asks for gauntlets that never touch the pauldrons, no helmet and no microphone,
and a calm face to the very end. Wait with `higgsfield generate wait <id> --json` in the background. Download it, extract
frames and look before spending more: identity, hands, edges, the ending (`gaze.py`, `eyes.py --tail 1`).

### 6. Sync Lipsync 3 (~21.75 credits for 6.4 s, the same at 480p and 1080p)
`generate_video` model `sync_so` (listed by `models_explore action:list type:video`), medias `input_video` = the Genjutsu
job id and `input_audio` = the uploaded clean voice, with **`sync_mode: "remap"`**. `cut_off` would clip the last word when
Genjutsu comes back short. Sync redraws mostly the mouth. It keeps the mouth small (it misses some b/p closures and rounded
o's) and softens the eyes slightly.

### 7. Dedup + retime (free, always after remap)
Run `scripts/dedup.py sync.mp4 even.mp4`. Remap pads by repeating about one frame in 17, which hitches every 0.7 s at
60 fps. The script spreads the unique frames evenly over the line (145 frames over 6.4 s; mouth drift max 34 ms).

### 8. Post (free)
Run `scripts/post.sh even.mp4 <out>/<name>-4k60 "label" line-film.m4a` to get `-clean.mp4` and `-labelled.mp4` (3840 ×
2160, 60 fps, ~29 Mbps, one grain pass, the film's audio under it). Copy the clean one to
`~/Downloads/<project>-<thread>-<scene>-4k60.mp4` and send it with SendUserFile. Stills are single 3840 × 2160 JPEG q95
frames from the clean files at the same frame number before and after (`…-before.jpg`, `…-after.jpg`, never grids).
Include one in the last sentence and one on the last word.

### 9. Measure (free; report the numbers alongside the judges)
`lmdump --video even.mp4 <N/dur> > dump.jsonl`, then:
- `phon.py dump N/dur FILM_START checks.json`: closures (m/b/p < 0.03) and open vowels (> 0.08) at the line's sounds
  (example: `references/greymourn-checks.json`).
- `lipsync.py dump N/dur FILM_START voice16k.wav`: envelope r and z vs shifted controls. It's noisy on 6 s, so read it with phon.
- `gaze.py dump frames/ --fps N/dur --split <sentence break>`: on-the-lens %. Compare only at equal resolution, and confirm
  any drop by eye with an eye strip.
- `eyes.py dump --fps N/dur --tail 1`: the ending's eye openness vs the clip median.

### 10. Blind judges, then report
- `scripts/judgekit.py config.json` (example `references/greymourn-judgekit.json`) builds both versions' full frames, face
  crops, a labelled mouth strip and an eye strip at the same moments, plus his truth photos, and shuffles sides once per judge.
- Run two fresh subagents (`model: "opus"`, `effort: "xhigh"`) in the background with `references/judge-prompt.md` inline.
  They see image files only. Save their JSON as `j1-result.json` / `j2-result.json`, then run
  `scripts/tally.py DIR KEY.json <before> <after>`. The lower score counts. Separate rounds drift about a point, so compare
  only within one round.
- Report: what changed and what it cost, the video (sent and in Downloads), the before/after stills (one line each), the
  judges' table and tally, the measures, and the faults still in it. End with one plain question ("Confirm the draft and
  run the 1080p final for ~142 credits (~$5.53)?").
- Record: log every prompt he types (read the last number first, since other sessions log too). Add one ledger row per
  spend with the Total updated. Commit only those files. Write a hand-over note with a placement proposal.

## Costs (Nov 2026; Higgsfield ~$0.039 a credit)
| step | cost |
|---|---|
| HeyGen Avatar 6 clip of the line (optional) | $0.10/s at 1080p (~$0.64 for 6.4 s) |
| Seedream 5.0 Pro edit, 2k | 2.5 credits each, 2-3 looks |
| Genjutsu 6 s: 480p / 720p / 1080p | 18 / 35 / 120 credits |
| Sync Lipsync 3, 6.4 s | 21.75 credits |
| plates, composite, uploads, estimates, post, measures, judges | free |
A scene in practice: draft 39.75 + final 141.75 = ~181.5 credits (~$7.08), plus the stills once per look.

## What Greymourn's scene one scored (19 Nov 2026)
- Final vs draft, blind, lower score: **26 wins, 3 ties, 1 loss**. The final scored likeness 7, eyes 7.5, lighting 7.5,
  proportions 7, hands 5.5-6, fits the scene 7.5, sharpness 8, lip sync 6, eye contact 8. Nothing reached 9. The 480p draft
  lost to a 720p take on sharpness alone (5 vs 7), and that dragged every other item down.
- Faults resolution doesn't fix, each with its lever:
  - The lips stay open on b/p and the o is flat. A new Avatar 6 drive of the exact line should help; Intone was rejected:
    "I don't speak like that!"
  - The gauntlets grip the shoulder rims, because the drive's hands are at chest height. Choose a drive with lower hands.
  - The face reads rounder and fuller than his. That comes from the still; pick by chin/iod and width/iod.
  - A hard light/dark split down the gorget. Fix it in the still's light paragraph.

## Into the film (a separate step and thread)
The shot replaces his camera over the same words, in the camera's own layout. Cut in at the first word and out after the
last, before the next one. Drop the clip's own audio (the film's mix is already there). Don't edit the film's files from
the scene thread.
