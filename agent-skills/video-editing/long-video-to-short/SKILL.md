---
name: long-video-to-short
description: Turn a finished long video (a tutorial, a making-of, a first impression) into a 60-second 9:16 short for Instagram Reels, YouTube Shorts and TikTok, at 1080 × 1920, 60 fps and under 30 MB, with you on camera as your HeyGen Avatar 6 twin. Script the useful part in your own voice, voice it with your cloned voice, time every caption word to its sound by phrases, crop the long video's own 4K footage for the backgrounds, draw headlines and word-by-word captions frame by frame in Python, have your Avatar 6 twin say the on-camera lines from the very same sound, cut the twin out and seat it in each scene, and only where a scene really needs it re-skin the twin with Higgsfield Genjutsu (a costume, a world's light). Render two cuts (Instagram ends on a comment keyword, Shorts and TikTok on "full video in the description"), check the rendered files (transcript, caption timing, loudness, silence, colour tags, size), score the animation with independent judges, then schedule the posts paused for the creator's yes. Use when someone asks for a short, a reel, a Short or a TikTok from a long video, "a 60 second version", "a social cut", "put me on camera with my avatar", or wants an existing short's captions, cut-out, lip sync, grade or posts fixed. For a reel made from a tweet or a landing page use html-reel; for one scene of yourself inside a game world use genjutsu-scene.
---

# Long video to short

**A cloned voice · HeyGen Avatar 6 · ffmpeg · Python (Pillow, numpy, OpenCV) · macOS Vision · Higgsfield Genjutsu, only if needed.**

A minute-long vertical short that teaches the best part of a long video, in the creator's voice, with the creator on
camera for the hook, a turn in the middle and the ask. Nobody records anything: the voice is their clone, the face is
their Avatar 6 twin saying that exact sound, and the pictures are the long video's own footage.

Written from a real run (a 61 s short of a 10-minute tutorial, Nov 2026, nine versions; `references/run.md`). This
public copy leaves out account, job and media IDs and machine paths: bring your own cloned voice, HeyGen twin
(`create-ai-avatar`, `digital-twin` in this repo) and Higgsfield account.

```
 long video ──► script (≈150 words) ──► cloned voice, by paragraph ──► phrase-aligned word times ──► voice.wav + timeline.json
      │                                        │
      │                                        └─► each on-camera line's sound ──► HeyGen Avatar 6 twin ──► the creator's yes
      │                                                                              │            └─(only if the scene needs it)─► Genjutsu re-skin, 720p
      └─► 4K footage ──► vertical 60 fps crops (base-NAME.mp4)                       ▼
                                 │                                    60 fps frames ──► Vision mattes ──► cut-out plates
                                 ▼                                                              │
              scenes.py: headlines + captions + the person, a pure function of the frame ◄──────┘
                                 ▼
              export: sections ──► join under the voice (−14 LUFS) ──► two-pass x264 under 30 MB
                                 ▼
              checks on the file ──► judges ──► two cuts ──► posts saved paused ──► the creator's yes
```

## The mechanism

**One sound file drives everything.** The voice is made first, in whole paragraphs. Caption words light on times
measured from that sound; section lengths in frames are cut from it; and each on-camera line is the same paragraph
file, cut in its pauses and handed to the Avatar 6 twin as the sound to speak. So the twin's mouth, the captions and
the cuts can't drift apart: they were never timed separately. Re-voice a paragraph and you redo its captions and its
twin clip; change nothing else.

Every drawn frame is `GFX[name](n)`: a transparent 1080 × 1920 overlay computed from the frame number alone
(`scripts/reel_draw.py`), piped over the section's background clip. No timelines, no editor, so a still of any frame is
free and a render is repeatable.

## Rules (each came from a correction)

1. **Avatar 6 first, approved, then anything else.** The twin clip is shown to the creator before it's cut out or
   re-skinned. Never a general video model's draft of their face.
2. **Genjutsu only when the scene needs it.** The twin as it is (their look, their room's light) is the default and is
   enough for most shorts. Re-skin only to put them in a world's costume or light, and then 720p is enough for 9:16.
3. **Price first.** Say the price of every paid run (voice takes, twin clips, re-skins, captions), wait for the
   creator's typed yes, then run it, and log it in a ledger. No run is too small to ask about.
4. **Keep their colour.** Seat the cut-out with a little of the scene's light on the edge; never desaturate the face
   to match a grey scene.
5. **Check the rendered file, not the project.** Transcript, caption timing, loudness, silence, colour tags, size.
6. **Shorts and TikTok never end on a comment ask.** Only Instagram says "Comment WORD"; the others end "check the
   full video in the description".
7. **Nothing goes public without their typed yes for that exact thing.** Posts are saved paused. AI labels are theirs to
   set, and a twin on camera means the label is yes.
8. **No paid-partnership label on a short nobody paid for.** If the long video had a sponsor, the caption says "The
   full video is sponsored by X."
9. **Every word inside the centred 3:4 area.** In the 1080 × 1920 frame that is y 240 to 1680, with a little to
   spare. Instagram's grid and profile show that middle and cut the rest. Headlines, captions and the cover's type
   all stay inside it; measure the drawn frames, don't judge by eye.

## Workflow

Work in one project folder; run every script from it. Python needs numpy, pillow, opencv-python; plus ffmpeg and
whisper.cpp (`WHISPER_MODEL` set to a ggml model).

### 1. Script (≈150 words for 60 s)

From the long video's own voiceover and facts, nothing new: a hook that names the subject in the first two seconds,
the one surprising thing, three or four steps someone can use today, the ask. Plain words, as they'd say it to a
friend, with a few of their fillers ("so", "you know", "kind of"). A cloned voice reads about 2.4 words a second with
its pauses. Mark which lines are on camera: the hook, one turn ("so, here's how I…"), the ask. Aim for 20–25% of the
runtime; on camera for every line is a talking head, never is a slideshow.

Write it as 3–5 paragraphs, each a file `voice/A.txt`, `voice/B.txt`… with the words exactly as voiced, and get the
script approved before voicing.

### 2. Voice

Voice each paragraph whole in their cloned voice (two takes, keep the better: natural pitch, no clipped ending) as
`voice/A.mp3`… Shape pauses if the read runs on (about 0.45 s at a full stop, 0.24 s at a comma). Listen, or
transcribe, before building on it: names and numbers first. Price the takes and wait for a typed yes before making
them.

What worked best for a cloned ElevenLabs voice: `eleven-v4` with no tag, run-on text (commas, "and", "so"; no "!" or
"…"; numbers as words), one paragraph per generation, a few light hedges, the lower-pitched of two takes. The same
file is what the twin speaks in step 5.

### 3. Word times, by phrases

```bash
python scripts/align_phrases.py voice/A.mp3 voice/A.txt voice/A-aligned.json --syllables syl.json
```

Whisper's word stamps drift at pauses: a sentence's last word lands on the next one, so captions light late after
every breath. This cuts the paragraph into its phrases by sound, so a phrase's first word is exact, and shares the
phrase among its words by syllables (`syl.json` fixes what a vowel count gets wrong: `{"gpt": 3, "url": 3, "3d": 2}`).

### 4. Plan, sound and timeline

`plan.json` (`references/plan-example.json`) lists the sections in order: which paragraph, where it's cut (seconds,
inside pauses), which words it holds, its caption pages broken for the frame (one or two lines, two to four words a
line, a phrase a page), its headlines, and its talking clip if someone is on camera.

```bash
python scripts/build_voice.py          # voice.wav + timeline.json: each section's first frame, frames, word times
```

Frame boundaries follow the sound and never drift more than half a frame. Keep paragraphs whole where someone is on
camera; cut a word out only between sections (`"fade": true` on both sides).

### 5. On camera: the Avatar 6 twin (`references/on-camera.md`)

For each on-camera line:

1. Cut its sound from the paragraph file, from the section's `in` to a pause after its last word
   (`ffmpeg -ss IN -to OUT -i voice/A.mp3 line-hook.mp3`). A line may run past its section; the plan's `line_at` says
   where the clip's sound starts in the paragraph.
2. **Price it, wait for a typed yes**, then have the twin say that sound: HeyGen Avatar 6, the creator's trained twin, one look,
   1080p, 16:9, the sound file as the speech (not text, so the timing is the voice's own). About $0.10 a second in
   our run.
3. Look at it yourself (mouth on the consonants, eyes, hands), then show the creator and wait for their yes. A
   startled or stiff delivery is redone here, where a take costs under a dollar (priced and approved again).
4. **Only if this scene needs a costume or a world's light:** a Genjutsu motion-transfer re-skin of the approved
   clip, 720p, priced and approved the same way. Otherwise skip it; the twin goes straight to the cut-out.
5. Cut them out. 60 fps frames, a person matte on every frame, then solid, steady plates:

```bash
ffmpeg -i twin-hook.mp4 -vf minterpolate=fps=60:mi_mode=mci frames/hook/%04d.png   # or fps=60 if it's already smooth
swiftc -O scripts/segdir.swift -o segdir && ./segdir frames/hook masks/hook        # macOS Vision, accurate
python scripts/plates.py frames/hook masks/hook plates/hook 60                     # --warm-edge for a warm set behind dark cloth
```

Then set where they sit in `plan.json` (`camera.hook`: `wide`, the plate's drawn width; `cx`; `y`) from stills: eyes
in the upper-middle third, shoulders running out under the caption shade, head clear of the headline.

### 6. Backgrounds

The long video's own footage, at its real speed: `scripts/base.sh SOURCE START FRAMES NAME [X] [HEIGHT]` makes
`base-NAME.mp4` at the section's exact frame count (from `timeline.json`). Push in (`HEIGHT` 2300) to put a HUD, a
weapon or a bright light out of frame. Behind a person, pick the calmest shot: nothing crossing their head, no
strong light under the headline.

### 7. Draw the sections

Copy `scripts/scenes.py` into the project. As it stands it draws each section from the plan: headlines that land six
frames before the word they name, captions, the person. Add each section's own graphics where marked (a prompt on a
chip, a picture card, a count that settles on the spoken number), always as a function of `n` and the word frames
(`at(name, k)`). The motion rules are in `references/motion.md`; the short's first frame is its cover, so the hook's
headline and first caption page are already set on frame 0.

```bash
PYTHONPATH=scripts python scenes.py sheet.jpg hook:0 hook:200 steer:30 card:120    # finished stills, no render
```

Look at stills of every entrance, exit and page flip before rendering.

### 8. Export

```bash
PYTHONPATH=scripts python scripts/export.py            # sections, join, short-master.mp4, then short.mp4 under 29 MB
```

Sound at −14 LUFS, −1.5 dBTP; video tagged bt709 throughout (an untagged or sRGB-tagged file plays dark on YouTube);
the small file is a two-pass x264 at the bitrate that fits the limit.

### 9. Check the file

```bash
python scripts/sync_check.py short.mp4      # captions vs sound after each pause: 20-70 ms early, none late
scripts/check_export.sh short.mp4 30        # size, 1080x1920@60, bt709, LUFS, silences over 1 s, transcript
```

Pass: the transcript matches the script word for word (the closing line above all); no silence over a second except
the end hold; and, on stills of on-camera frames against the twin clip, the mouth matches within a frame.

### 10. Judge it (`references/judging.md`)

An independent judge (a fresh agent that hasn't seen the work) scores frame strips of entrances, exits, text, cut-out
edges and how the person sits in the scene, out of 10, same rubric each round. Fix the lowest item, re-render,
re-judge. Report the lowest item, not the average, and say plainly when the target wasn't reached.

### 11. The second cut

Instagram's cut ends "Comment WORD to get …". For Shorts and TikTok make `plan-d.json`: the same plan with the last
section replaced (its own paragraph "So, check the full video in the description", its own twin clip and plates),
marked `"own": true`.

```bash
python scripts/build_voice.py plan-d.json d
PYTHONPATH=scripts python scripts/export.py --tag d --reuse ''     # renders only the changed section
```

Run the checks on both files.

### 12. Posts (`references/posting.md`)

Write the captions, save the three posts scheduled but paused, and wait for a typed yes on the captions and the
time; nothing is posted or switched on before it. Tell
the creator the AI labels they set by hand on each platform. After the Instagram reel is up, set up the comment
keyword's auto-reply (paused) with the full video and the free resource.

## Files

- `scripts/align_phrases.py` · word times exact at phrase starts
- `scripts/build_voice.py` · `voice.wav` and `timeline.json` from `plan.json`
- `scripts/base.sh` · a vertical 60 fps background crop
- `scripts/segdir.swift`, `scripts/plates.py` · person mattes and cut-out plates
- `scripts/reel_draw.py` · headlines, captions, the person, shades, easing
- `scripts/scenes.py` · the plan-driven scene file to copy and extend
- `scripts/export.py` · render, join, compress, second cut
- `scripts/sync_check.py`, `scripts/check_export.sh` · the checks
- `references/on-camera.md` · Avatar 6, when to re-skin with Genjutsu, cut-out faults and fixes
- `references/motion.md` · the motion rules in numbers
- `references/judging.md` · the rubric and the judge's brief
- `references/posting.md` · captions, schedules, labels, the comment keyword
- `references/plan-example.json` · a two-section plan
- `references/run.md` · the run this came from: what each version changed and why
