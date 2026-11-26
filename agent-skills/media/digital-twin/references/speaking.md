# How you talk on camera: measure it first

Video models draw a generic speaker. To make a clip read as you, measure how you really talk, write that into the prompt,
and measure every draft against it.

## Measure yourself

```bash
swiftc -O scripts/speakstats.swift -o scripts/speakstats
scripts/speakstats ~/Videos/talk-1021.mp4 503 15 12.5 > me-1021.csv    # VIDEO START DURATION FPS
python3 scripts/speaksummary.py me-*.csv                                 # one row per clip + a mean
```

Take 4–6 windows of 15 s from 2–3 sessions where you talk naturally to the camera. Per frame, speakstats records the
face centre and width, head turn (nose offset over eye distance), roll, pitch, mouth opening (inner-lip gap over mouth
width), eye openness and brow height. speaksummary turns that into the table below.

Also make filmstrips (`ffmpeg -ss 503 -t 15 -i talk.mp4 -vf "fps=2,scale=400:-2,tile=6x5" strip.jpg`) and look at
your hands, your glances and your brows.

## What to measure (one creator's numbers, as an example)

| Per 15 s | His real | Seedance alone | What it means |
|---|---|---|---|
| mouth opening, median | **0.09** | 0.135 | he talks with small openings; Seedance over-articulates |
| mouth opening, 90th percentile | 0.20 | 0.26 | |
| frames with the mouth open > 0.15 | 25 % | 44 % | |
| syllable-like mouth cycles per second | 2.1 | 2.4 | similar pace |
| blinks per minute | 43 (20–64) | 42 | keep "natural blinks" |
| head turn, sd | **0.100** | 0.034 | he turns 3× more |
| head tilt (roll), sd | **3.9°** | 1.7° | 2.4× more |
| head shift and lean, sd (face widths) | **0.075** | 0.029 | he leans toward the lens on stressed words |
| brow movement, sd | 0.035 | 0.047 | his brows move less |

From his filmstrips: hands in most seconds (open palms at chin and chest height), the head always moving, glances up and
away to think, small mouth openings with the lower teeth showing, brows lifting only to stress a point. The old prompt's
"hands out of frame" was the opposite of him. Yours may differ.

## Clauses for the video prompt

**The soft-mouth clause** (the one that brought his drafts closest: mouth p50 0.085–0.10 against his 0.092):
"Their mouth moves the way a calm, quiet speaker's does: small, soft lip movements, the lips only slightly parted on most
words, the upper teeth just showing on open vowels, the lower teeth hidden, the mouth corners relaxed; no pursed or
rounded lips, no wide-open mouth, no stretched lips, no chewing motion."

**Calm head** (what the person picked over a livelier take): "their head stays mostly still, with only small natural
nods". Measured head-turn sd 0.02–0.04.

**Animated** (if you talk with a lot of motion): "they talk the way they really do: animated and engaged, the head never
still. It turns between three-quarter and almost facing the lens, tilts a little and leans toward the camera on stressed
words, with small nods; they glance up and away to think, then back; their hands come up into frame at chest height in
relaxed open-palm gestures". Prompt alone reached head-turn sd 0.067; a video reference of you reached 0.092.

## What a video reference does

A 5 s clip of you talking, passed to Seedance 2.5 `omni_reference` as `--video-references` ("use the reference video
only for how they move, gestures and speaks, not its room, light or clothes"):
- it gives your head motion and gestures (turn sd 0.092 against 0.034 without one);
- the clip drives the mouth more than the prompt does: an open-mouthed clip gave 0.14, calm clips gave 0.08–0.12;
- **things in it leak in:** a lav mic showed up on the shirt. Pick clips without a visible mic.
- The person's verdict on the livelier takes: "the head moves too much, the mouth isn't realistic, the face doesn't look
  as clean". He picked the calm drafts without a video reference.
