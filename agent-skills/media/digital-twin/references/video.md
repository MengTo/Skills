# Talking clips with Seedance 2.5

## The workflow the person approved ("pretty good… remember this workflow")

1. **Start still:** an audited, picked **close-up**. A close-up gives the face ~190–235 px at 480p; a medium shot gives only
   110–140, and the face goes soft. Convert it: `sips -s format jpeg -s formatOptions 92 still.png --out start.jpg`.
2. **Audio:** a 5 s line in your voice (the clone, or your real line), padded to exactly 5.0 s with a ~0.35 s lead.
3. **Seedance 2.5 draft**, 5 s, 480p, `omni_reference`: the still as `--start-image` **and** `--image-references`, the
   line as `--audio-references`, **no video reference**.
4. **One draft per still.** Make each draft visibly different (a new still, line or look), or say up front that a pair is
   a test and why. Six drafts where two repeated two others drew "why 6?? 3 are same??".
5. **Measure** every draft (below) and show them with their numbers.
6. **A final only after a pick:** a draft keeps about a third of the still's face detail (Laplacian variance 0.25–0.38 of
   the still's), and a face close-up as a second reference doesn't change that. Render the picked draft as a final with
   `--draft_job_id <job id>` (no `--draft`), 720p 35 Higgsfield credits, with the owner's OK.

## Routes and prices (Nov 2026, 5 s)

| Route | Setting | Price | Notes |
|---|---|---|---|
| Higgsfield CLI `seedance_2_5` | `--draft true`, 480p | 15 credits (~$0.59) | takes a photo of you as it is; the usual route |
| Higgsfield `seedance_2_5` | 720p final | 35 | only for a picked draft |
| Higgsfield `seedance_2_5` | 1080p final | 80 | |
| Higgsfield `seedance_2_0` | `--mode fast`, 480p | 5 | cheap angle tests; flatter voice, once spoke Chinese |
| Fil Seedance 2.5 | 480p | ~52–55 Fil ($0.52–0.55) | the face must be in your verified face library first |
| Fil Seedance 2.5 | 720p / 1080p | 118 / 289 | |

Fil's Seedance (BytePlus) refuses a photoreal face as the start frame (`PrivacyInformation`, credits returned) unless that
exact picture is in your **Settings › Your face** library: verify once on your phone, then add each still ("Ready for
Seedance" in ~4 s). Each new still must be added before its run. Don't try to get past the filter any other way.

Other video models (talking-photo avatars, lip-sync tools, Kling) are different products. Don't switch models without
the owner's OK. In that project two such tests were run without asking, and that was a mistake: they measured worse (a
mouth 0.173 wide, or a frozen head) and broke the owner's rule.

## Commands (bash; in zsh put flags in an array)

```bash
H=(higgsfield generate create seedance_2_5 --mode omni_reference
   --start-image ./start.jpg --image-references ./start.jpg --audio-references ./line-5s.mp3
   --duration 5 --resolution 480p --draft true --wait --wait-timeout 20m --json)
"${H[@]}" --prompt "$(cat prompt.txt)" > video/D1.json
higgsfield generate cost seedance_2_5 --duration 5 --resolution 480p --draft true    # price first
```

Run several at once in one background shell (`… & … & wait`).

## The prompt (the shape that worked)

```
Image-to-video from the start image: the same [man/woman], with the same face, hair, skin and [clothes], in the same room
and light, all exactly as in the start image: [one line describing the room and light]. Cinematic, locked-off close-up
at their eye level, no cut. They speak English. They talk calmly [just past the lens to someone beside the camera /
straight into the lens, holding warm, direct eye contact with the viewer for the whole line, heavy relaxed eyelids].
Their head stays mostly still, with only small natural nods; natural blinks; eyebrows low and relaxed. [The soft-mouth
clause.] They say exactly: "[the exact words of the audio line]", in that voice and with that timing, their lips matching
every word. The face stays exactly as in the start image: clean, smooth, sharp, no added lines; [hair colour] hair, no
grey. Their [gear] stays exactly as in the start image. No microphone. Only their voice and quiet room tone, no music.
Real footage, shallow depth of field, fine film grain, no text.
```

- **"They speak English" + the exact words:** a Seedance 2.0 clip once spoke Chinese.
- **Eye contact** makes the brows lift and the lids open. Say "eyebrows low and relaxed, heavy relaxed eyelids".
- **Camera moves that held the face:** a very slow push-in at 85 mm, a slow lateral slide with parallax, or locked off.
  Locked off was the person's pick.
- With his voice as the audio reference, Seedance re-voiced the line in a voice cloned from it (pitch 117 Hz against his
  121) and lip-synced to its own delivery. Pauses moved by up to 0.4 s.

## Measure every draft

```bash
scripts/measure_drafts.sh video D1 D2 D3    # fetch, 16 kHz wav, speakstats, filmstrip, whisper, summary
```

- **Words:** whisper's text must match the line exactly, in English.
- **Mouth opening p50** against yours (his 0.092; best drafts 0.085–0.10; Seedance alone 0.135).
- **Head turn sd** against yours and the look you want (calm drafts 0.02–0.04).
- **Face shape** holds: median width within a few percent of the still; the chin rises a little with mouth opening.
- **Detail:** Laplacian variance in the face box against the still at 480p.
- Gear, room and light hold through the clip; no mic appears; no grey hair.

## Results from that project, for scale

| Drafts | Setup | Mouth p50 | Head turn sd | Verdict |
|---|---|---|---|---|
| D1–D4 | his calm clips as video refs | 0.10–0.14 | 0.046 | mouth better; a mic leaked |
| E1–E3 | a calm clip as video ref + "very animated" | 0.07–0.09 | 0.05–0.10 | "head moves too much… face not as clean" |
| F1–F3 | no video ref, "head mostly still", the still as image ref too | 0.08–0.13 | 0.014–0.026 | calm |
| G1–G4 | close-up stills + the soft-mouth clause | 0.085–0.12 | 0.023–0.037 | **"pretty good"**: the workflow |
| H1–H2 | stills in his real room, the clone voice | 0.10–0.13 | 0.02 | room and gear held |
| J1–J2 | the same, with his real voice line | 0.10–0.13 | 0.027 | pitch matched his real voice |

## Making the final from a draft (8 Nov 2026)

- The person, on a 1080p final made from the draft they picked: "the non-draft looks great". Offer one once a draft is
  picked, priced first: Higgsfield 1080p 80 credits for 5 s (96 for 6 s), 720p 35; Fil "Make final" 287 for 5 s at 1080p.
- **The `higgsfield` CLI can't make it**: `--draft_job_id` fails validation ("a validation rule could not be evaluated"), with or
  without the media. Use the Higgsfield MCP `generate_video` with `{"model": "seedance_2_5", "draft_job_id": "<draft id>",
  "resolution": "1080p", "duration": <same>, "prompt": <same prompt>}` (price it first with `get_cost: true`). It keeps the
  draft's take: the same words, timing and motion, with the face detail back.
- Encode for the web with `ffmpeg -c:v libx264 -crf 23 -preset slow -pix_fmt yuv420p -movflags +faststart` (6 s at 1080p ≈ 1 MB).
