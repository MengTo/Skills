---
name: digital-twin
description: Build a digital twin of yourself, meaning photoreal stills of you in your own real room, talking video clips of you, and lines in your own cloned voice, that people who know you accept as you. It's a proven workflow (160+ numbered stills over two dozen rounds, 20+ talking drafts and a voice taken from 8.7 to 9.2/10 on one creator's twin, Nov 2026). It covers consent, picking references from your own recordings, writing an identity prompt, the 4-part prompt stack on Seedream 5 Pro, your-real-room-only with the camera as the only variable, 3 images at a time, cinematic looks taken from reference videos as words, measuring face proportions, the audit and paste-back fix, an instant voice clone with an audio tag, a speaker-similarity scorer, Seedance 2.5 draft talking clips, and the traps (voice verification lockouts, iMacs, grey hair, wide mouths, other people's faces bleeding in). Use it whenever someone wants AI images, video or voice of THEMSELVES, even if they only say "my digital twin", "AI headshots of me", "a video of me talking", "clone my voice", "make me a presenter clip", "an AI avatar of me", "me at my desk", "a talking-head intro without filming" or "creator or founder content with my face". Only for your own face and voice, or someone who gave documented consent.
---

# Digital twin

Three things that should pass for you: **stills** of you in your own room, **talking clips** of you, and **lines in your
voice**. The bar: someone who knows you says "that's you" without hesitating. **Your own eye is the final judge.** Blind
judges and scorers find the faults; you decide. A blind judge once ranked a shot higher than one the person himself
approved, and the person was right.

**Provenance.** Extracted from one creator's twin, built 6–8 Nov 2026 for a course intro. More than 160 numbered Seedream stills
were scored by blind judges, landmark measurements and the person's own picks. Seedance drafts V1–J2 were measured
against how he really talks, and the voice work took his clone from 8.7 to 9.2/10 on a speaker-similarity scorer. Every
rule below came from a correction he made or a measured failure. His numbers appear as examples, labelled as one person's
results. Measure your own.

**Consent first** (`references/consent.md`). Only your own face and voice, or a person who gave you documented consent
for this use. Never a public figure, a client, or anyone who hasn't agreed. Platform verification steps (a voice
captcha, a face check on your phone) are the owner's to do. Never work around a platform's identity check.

## The workflow at a glance

| Stage | What you make | Tool and price (Nov 2026) | Gate |
|---|---|---|---|
| 0 · Setup | consent, accounts, a project folder, a canvas, a ledger | Fil (and ElevenLabs for your voice) | consent; price before every spend |
| 1 · References | face crops from your own videos: a lean set, angle sets, held-out judge frames, room photos | free (`scripts/`) | never a selfie, never a generated face |
| 2 · Identity | a 250–350-word identity block from a blind feature list | free | judge reads it against held-out frames |
| 3 · Stills | 3 at a time, in your real room, only the camera and time changing | Seedream 5 Pro on Fil: 12 credits ($0.12) | your pick; proportions measured |
| 4 · Audit and fix | every pick checked tile by tile, then fixed | a Seedream edit + `fix_still.py` paste-back | wrong gear, hair, hands, extra objects gone |
| 5 · Voice | lines in your voice | ElevenLabs instant clone, v4 + an audio tag | ≥ 9 on `score_voice.py` on 7–10 s lines; your ear |
| 6 · Talking clips | 5 s, one draft per still | Seedance 2.5 on Fil, 480p: ~52 credits ($0.52) | English exact; mouth and head measured |
| 7 · Deliver | on a canvas, logged | Fil sections, a ledger, a log | every spend logged; picks marked |

The same flow is a ready-made Fil workflow: https://fil.design/workflows/digital-twin (`references/fil-workflow.md`).

## Stage 0 · Setup

- **Accounts:** Fil, where everything runs on one canvas: Seedream 5 Pro stills and edits, ElevenLabs audio nodes in your own
  voice (by its id) and Seedance 2.5 clips. ElevenLabs for making your voice clone (a Creator plan has 1 Professional and 30
  instant slots). Optional: the Higgsfield CLI `higgsfield` for Seedance drafts from a photo outside Fil.
- **A project folder** with `refs/`, `room/`, `rounds/`, `voice/`, `video/`, `LOG.md` and a ledger `credits.txt`. Write
  every run into LOG.md: model, refs, exact prompt, file, canvas node and **your** verdict.
- **Price, tell, then run:** `max_credits: 0` on Fil returns the price (a Fil credit is $0.01). On Higgsfield,
  `higgsfield generate cost …` does (a credit is ~$0.039 on Plus annual): compare in dollars, never raw credits.
- **Local tools:** ffmpeg, whisper-cli (a large-v3-turbo model), Swift (macOS Vision for landmarks), Python 3.12 with
  numpy, Pillow, speechbrain and torchaudio.

## Stage 1 · References from your own recordings

Read: `references/references.md`.

1. **Pull frames** from talking-head recordings on your usual camera, mic and light:
   `scripts/extract_frames.sh frames/ rec1.mp4 rec2.mp4 -- 10` → `swift scripts/faces.swift frames/*.jpg > faces.txt` →
   `scripts/crops.sh faces.txt refs/all 1024` (tight head crops: no lav mic, no hands).
2. **Hold out 5 frames as the judge's truth** (J1–J5), from a different day. Never use them as references.
3. **Pick a lean set of 8**, mostly neutral, mouth closed or barely open, head upright, a mix of front and 3/4. Measure
   with `scripts/lmjson.swift` + `scripts/measure.py` and **drop frames that run long in the chin or wide** (smiling and
   mid-word frames). Seedream copies its references' proportions: a set with smiling frames made every image ~8–10 %
   long in the chin and ~7 % wide, and the lean set measured right on his held-out frames.
4. **Angle sets:** the 6 most frontal frames (eye contact shots), the 6 most turned (side shots), 3 full frames (wide).
   Rank them by `yaw` from faces.swift. With only 3/4 references, eye-contact and side shots drift away from you.
5. **Room photos:** 3 of your real room (the whole room, the desk, the window side), always the **last** references.
6. **Never:** a phone selfie (a wide-angle lens enlarges the nose and narrows the jaw, and the model turns a blemish into
   a mole); a generated image as a reference (errors compound); other people's screenshots as image refs (their faces
   blend in); your held-out judge frames.

## Stage 2 · The identity block

Read: `references/identity-template.md`.

Have a fresh blind judge describe your face from the held-out frames, feature by feature: hairline, hair, face shape,
eyes, brows, nose, mouth, ears, skin (with Lab values), age and build. Write one paragraph from it that begins "A real
photograph of exactly the person in the reference photos, the same person" and ends "Use the reference photos only for
who they are, not for their room, light, clothes or microphone". Then keep it short:
- Each fix a judge asks for goes in as one phrase. **Longer blocks over-correct.** A version with every judge fix scored
  ~0.25 lower: "short chin" made a longer chin, and "blue-black sheen" made blue hair.
- Say what you are **and the near misses you are not** ("not a quiff, not a pompadour"; "not tanned"; "not gaunt").
- Words become features: "grey scalp" and "grey stubble" turned into silver hair at the sides. Write "skin-toned scalp…
  no grey, white or silver hair anywhere".
- No "skin texture" or "detailed pores" boosters: they seed specks and spots.
- On Fil all four prompts together must stay under 4,000 characters, so keep a compressed version (~1,900 characters).

## Stage 3 · Stills: your room, three at a time

Read: `references/stills.md`, `references/workspace.md`.

- **Seedream 5 Pro for every image of your face**, edits included. In blind rounds it beat Nano Banana on identity (7.8
  against 7.1), and Nano Banana kept inventing acne pitting, spots and combed hair. Fil's `edit_image` defaults to Nano
  Banana, so pass `model: "seedream-5-pro"`.
- **The 4-part prompt stack**, one prompt node each, joined in order into one `seedream-5-pro` node (16:9, 2k):
  1. **identity**: who you are;
  2. **workspace (shared)**: your real room, described once per round, so every shot of the round is the same room;
  3. **shot**: `Time:` + `Camera:` (lens, height, distance), framing, pose, gaze, one or two small object moves;
  4. **gear + finish (always last)**: your real desk gear named exactly, wardrobe, "no microphone on them", the lens
     look and grade, "no light stands, softboxes or tripods in frame", "no text".
- **Only the camera and the time of day change.** Invented places (lofts, cabins, deserts) read as fake and break
  continuity, and in that project they also ran long in the chin. One believable room, many cameras, like a real crew
  covering a talking head.
- **Three at a time.** Spread them: one 3/4 past the lens, one eye contact (front refs mixed in), one new camera or a new
  time. Number every shot ("165 · early sunrise · 65mm") so a pick is one line.
- **The camera and light rule that made it him:** 85 mm (50–65 mm for medium) at eye level; head turned three-quarters
  toward the side your real recordings show, looking just past the lens, or square to the lens for eye contact; a large
  soft key from one side (a window, blinds) with a gentle falloff; a soft neutral fill so skin keeps its real tone in a
  warm room. Never a head tilt. Seedream frames near medium whatever the lens says: for a wide shot say "their face about
  a fifth of the frame width".
- **Measure every face** against your held-out frames: chin and width over n (`references/references.md`). Within about
  ±0.05 reads as you; +0.08 reads long. Pick the takes nearest your numbers.

## Cinematic looks

Read: `references/cinematic.md`.

- Take the look from reference videos **as words only**: the composition (a laptop in the foreground, a desk on the
  diagonal, an armchair), the practicals (a mushroom lamp, an arc lamp, a pendant), the key and the grade.
- Looks that won in that project: golden-hour stripes through blinds, sunset through sheer curtains, god rays, warm
  amber practicals at dusk, Blade Runner 2049 orange haze or neon, Dune Arrakis ochre, and **white walls in olive-earth
  light** ("the ambient light and shadows with a muted olive-green earthy cast… olive shadows and warm highlights").
- "Green walls" meant the light, not paint. Ask what a colour word refers to before you paint the room.
- Never name lighting gear ("through a large diffuser", "octabox"): Seedream draws the stand in frame. Describe the
  light on the face.

## Stage 4 · Audit and fix

Read: `references/audit.md`.

Before any video, two fresh reviewers check each pick in 3×3 native-resolution tiles. The usual misses: **wrong-brand or
wrong-model gear** (an iMac with a chin, even when told "no iMac"), **grey hair** at the sides, **hands** (fingers, a
ghost finger), extra objects (a second monitor or laptop, a floating bulb), **light stands**, a **mic** on the shirt, sand
or haze indoors, broken laptop lids. Fix with one Seedream edit listing all of that still's mistakes, then paste back only
the flagged rectangles with the face masked:
`scripts/fix_still.py ORIG EDIT OUT 'x0,y0,x1,y1;…' --protect-face LM.json --match`. Reject an edit that recomposed the
frame, and redo it with fewer changes.

## Stage 5 · Your voice

Read: `references/voice.md`.

1. **Start with an instant clone** from ~3 minutes of your cleanest solo speech (`scripts/voice/build_ref.py` labels
   your segments in recordings with other people, and `make_ivc.py` packs the best). It's ready in a minute and needs no
   verification.
2. **Generate on `eleven_v4`** and measure the pitch. If it runs high, put an **audio tag** in front: on that project
   `[calm]` took v4 from 136–162 Hz back into his 106–131 range, and the score from 7.7 to 9.2. Stability didn't move the
   pitch at all. Whisper confirms the tag isn't spoken. `scripts/voice/tts_line.sh VOICE_ID "Line." out.mp3`.
   **On Fil:** an audio node on `eleven-v4` with your clone's voice id in its voice field and `[calm]` at the start of the
   prompt (about 1 credit per 10 s), on the same canvas as your stills and clips.
3. **Score** with `scripts/voice/score_voice.py REF_DIR clip.mp3`: ECAPA speaker similarity, calibrated so your own
   held-out clips = 10 and other people = 0, plus pitch inside your own p10–p90; score = 0.7 × similarity + 0.3 × pitch.
   Your own denoised voice scores ~9.3, so **9 ≈ you**. Score 7–10 s lines (a 4 s clip of the right voice scored 4.7).
   Don't use Resemblyzer to score: it's channel-sensitive and scored his own denoised voice 3.8. Then let your ear decide
   on a before/after: real line → clone.
4. **Professional Voice Clone traps:** adding samples to a working PVC **resets its verification**, and it becomes
   **unusable on every model** until you re-verify and it retrains (3–6 h). Verification is you reading a passage into
   your mic: **5 tries, then a 24 h lock**. All five failed there, although every sample scanned clean. So test a 30 s
   mic clip against your samples before spending tries, keep an instant clone as the stand-in, and never add samples to a
   PVC that is in use without planning for the downtime.
5. **Your real voice** works too: a clean 4–5 s line cut from a recording, as the Seedance audio reference. Seedance
   re-voices it but keeps your real pitch (112 Hz against his real 113).

## Stage 6 · Talking clips

Read: `references/video.md`, `references/speaking.md`.

1. Start from an **audited, picked close-up still**. A close-up gives the face ~190–235 px at 480p; a medium shot gives
   only 110–140.
2. **On Fil:** add the still to **Settings › Your face** first (a one-time phone check, then "Ready for Seedance" in a few
   seconds). Fil's Seedance takes a real face only once that exact picture is in your verified face library; a still that
   isn't is refused and the credits come back. Don't try to get past that check any other way.
3. **Seedance 2.5**, 5 s, 480p, the still wired in as image 1, the line in the prompt in quotes (~52 Fil credits). Off Fil,
   the Higgsfield CLI takes the still as it is: `seedance_2_5 --mode omni_reference --start-image S --image-references S
   --audio-references LINE-5s.mp3 --duration 5 --resolution 480p --draft true` (15 credits), with your 5 s voice line as
   the audio reference. **No video reference** unless you want much more head motion: a talking clip of you as a video
   reference doubled the head motion but leaked your mic and made the mouth busier.
4. **The prompt:** "They speak English", the exact words in quotes (a Seedance 2.0 clip once came out in Chinese),
   "locked-off close-up at eye level", "head stays mostly still, with only small natural nods", the soft-mouth clause,
   "face stays exactly as in the start image: clean, smooth, sharp", and "their [gear] stays exactly as in the start
   image". Eye contact or past the lens, to match the still.
5. **Measure** with `scripts/measure_drafts.sh DIR K…`: whisper for the words, mouth opening p50 and head-turn sd against
   **your** numbers (measure yourself with `speakstats`). Seedance opens the mouth ~50 % wider than a calm speaker.
6. **One draft per still.** Near-duplicate tests read as waste to the person paying; say up front when a pair is a test.
   A 480p draft keeps about a third of the still's face detail. Once a draft is picked, offer a 1080p final made from
   that draft (same take, face detail back), priced first: see "Making the final from a draft" in `references/video.md`.

## Stage 7 · Deliver

A canvas section per batch, a note on each node (recipe, measurements, audit), picks marked ✓ and moved to a KEEP
section, a numbered sheet to choose from, one question ("which are you?"), and the ledger and log updated before you
report.

## What fails, and the fix

| Fault | Fix that worked |
|---|---|
| Face 8–12 % too wide or round; reads older | a lean reference set (no smiling or mid-word frames); "lean through the lower face… soft V… not wide, not round"; 85 mm at eye level; no head tilt |
| Chin long | the lean set + front frames; pick the take nearest your measured chin; prompt words and chin-only edits move it < 1 % |
| Grey, white or silver hair | remove "grey" from the identity block entirely; "no white, grey or silver hairs anywhere on the head"; "faint sparse dark stubble" |
| Hair spiky, gelled or a pompadour | "thick soft clumps with blunt, soft, rounded ends"; list the styles it is not, in every face edit too |
| Eyes wide open, brows lifted for eye contact | "heavy relaxed lids… brows low and relaxed"; front angle refs |
| Spots, freckles, acne pits, tan or orange skin | Seedream only; "no freckles… not tanned"; "a soft neutral fill keeps the skin [tone], never orange" |
| Wrong gear (an iMac with a chin) | describe the real model precisely ("no chin, a slim aluminium stand"), audit, edit + paste back the region |
| Invented places, inconsistent rooms | your real room, three room photos last, a shared workspace prompt; only the camera changes |
| Light stands and softboxes in frame | never name lighting gear; "no light stands, softboxes or tripods in frame" |
| Lav mic leaks from refs | tight head crops; "no microphone on them"; no video ref with a visible mic |
| Another person's face blends in | reference videos as words only, never as image refs |
| Video mouth too wide | the soft-mouth clause; close-up stills; measure p50 |
| Video head frozen or too busy | no video ref + "mostly still, small natural nods" (calm); a video ref of you for more life |
| Video speaks another language | Seedance 2.5, "speaks English" + the exact words |
| Voice too high and bright | an instant clone on v4 + an audio tag (`[calm]`); or your real line as the audio ref |
| Voice offline after adding samples | warn first; keep an instant stand-in; test a mic clip before verification tries |

## Numbers that shipped

One person's measured results, Nov 2026. Measure your own.

| what | value |
|---|---|
| his face, real frames | chin 0.80 n, width 2.63 n at the nose, 2.24 n at the mouth (n = eye line → nose base) |
| a good take | within ±0.05 of those; three room photos + front refs gave 0.78–0.83 on most shots |
| still | Seedream 5 Pro on Fil, 16:9, 2k, 12 credits; edit 9 |
| batch | 3 stills; ≤ 10 refs (8 face + room photos); ≤ 4,000 prompt characters on Fil |
| blind plateau | 8.75 identity; a judge drifts 0.4–1.25 between rounds, so compare in pairs with anchors |
| his mouth when talking | opening p50 0.092 (Seedance 0.135), open > 0.15 in 25 % of frames, 2.1 syllable cycles/s, 43 blinks/min |
| his head when talking | turn sd 0.100, tilt sd 3.9°, lean sd 0.075 (Seedance alone 0.034, 1.7°, 0.029) |
| best drafts | mouth p50 0.085–0.10, head turn sd 0.02–0.04 (calm, his pick) |
| his voice | median F0 116 Hz, p10–p90 106–131 Hz; instant + `[calm]` 9.2/10, old Pro voice 8.7, Multilingual v2 ~8.1, v3 5–7 |
| talking clip | Seedance 2.5 on Fil, 480p, 5 s: ~52 credits ($0.52); off Fil, a Higgsfield draft is 15 credits (~$0.59) |

## Verify before you report

- [ ] Consent recorded; only the owner's face and voice.
- [ ] Every still: Seedream 5 Pro, the real room with room photos last, the real gear, no grey hair, warm light.
- [ ] Faces measured against the held-out frames; the numbers are in the node notes.
- [ ] Every pick audited and fixed before video, with the face masked in the paste-back.
- [ ] Voice lines scored on 7–10 s lines (≥ 9) and heard; the tag isn't spoken.
- [ ] Drafts: one per still, words exact, mouth and head measured against the owner's own numbers.
- [ ] Priced before running; ledger and log updated; picks marked on the canvas.

## Files

- `references/consent.md`: whose face and voice, platform checks, what never to do.
- `references/references.md`: pulling frames, the lean set, angle sets, held-out judge frames, measuring proportions.
- `references/identity-template.md`: the identity block, field by field, with a worked structure.
- `references/stills.md`: the prompt stack with templates, refs order, Fil and Higgsfield commands, batches of three.
- `references/workspace.md`: your real room, what may change, cameras that worked, planning a batch.
- `references/cinematic.md`: reference videos as words, looks that won and lost, lens and light rules.
- `references/audit.md`: the checklist and the edit + paste-back fix.
- `references/voice.md`: datasets, the instant clone, tags, the scorer, Professional Voice Clone traps, API calls.
- `references/speaking.md`: measure how you talk; the speaking and soft-mouth clauses.
- `references/video.md`: Seedance on Fil (Your face) and the Higgsfield CLI, prices, commands, prompts, measuring.
- `references/judging.md`: the blind judge protocol for stills and voice, and why your eye decides.
- `references/costs.md`: every price in credits and dollars (Nov 2026).
- `references/fil-workflow.md`: the Digital twin workflow in Fil, node by node, and how to run a batch there.
- `scripts/`: `extract_frames.sh`, `faces.swift`, `crops.sh`, `lmjson.swift`, `landmarks.swift`, `measure.py`,
  `make_round.py`, `hf_seedream_batch.sh`, `run_round.sh`, `numbered_sheet.py`, `fix_still.py`, `warp_face.py`,
  `film_grade.py`,
  `speakstats.swift`, `speaksummary.py`, `measure_drafts.sh`.
- `scripts/voice/`: `el.sh` (API helper; key from `.env`, never printed), `build_ref.py`, `scan_dataset.py`,
  `make_dataset.py`, `make_ivc.py`, `tts_line.sh`, `score_voice.py`, `watch_train.sh`.
- `demo/index.html`: one batch for Mai, one of Fil's example presenters: her face frames, three stills, the iMac fixed,
  a talking clip and her line. `demo/PROMPT.md`: prompts to use and remix this skill. The page is fil.design/skills/digital-twin.
