# References from your own recordings

The references carry who you are. The prompt only steers. Pick them carefully, because Seedream 5 Pro copies their
proportions, their light and anything in them (a lav mic, a hand, another person's face).

## 1. Source: your own talking-head recordings

Use recordings from your usual camera, at a normal distance and lens (a webcam, a mirrorless camera on the desk, a screen
recorder's camera track), in soft even light. Several sessions on different days beat one long session.

Avoid:
- **phone selfies:** a wide-angle lens at arm's length enlarges the nose, narrows the jaw and distorts the forehead, and
  the model turns any blemish into a mole;
- **heavily graded or filtered video:** the grade becomes your skin tone;
- **frames with hands, a mic, glasses you don't usually wear, or other people.**

## 2. Pull frames and crop

```bash
scripts/extract_frames.sh frames/ ~/Videos/talk-0925.mp4 ~/Videos/talk-1021.mp4 -- 10   # a frame every 10 s
swift scripts/faces.swift frames/*.jpg > faces.txt    # file x y w h confidence yaw roll (largest face)
scripts/crops.sh faces.txt refs/all 1024              # 2.7 face widths, square, 1024 px
```

`yaw` from faces.swift ranks head turn. Most people turn mostly one way on camera (his was always toward camera right,
nose offset p5/p50/p95 = 0.20 / 0.41 / 0.68 of the eye distance). Note your side: it becomes the default pose in every
prompt.

## 3. Hold out the judge's truth

Put **5 frames from a different day** aside as J1–J5: one frontal, two 3/4, one with a slight smile, one in different
light. A blind judge compares candidates against them. **Never** use them as references, or the judge only measures
copying.

## 4. The lean set (8 references)

1. Measure every candidate crop:
   ```bash
   swift scripts/lmjson.swift lm.json refs/all/*.jpg
   python3 scripts/measure.py lm.json      # c/n (chin), wNose, wMouth (widths) over n = eye line → nose base
   ```
2. Measure your held-out frames the same way. Their means are your target.
3. Drop crops whose chin or width runs long: **smiling, mid-word, laughing, chin-down and leaning-in frames.** In that
   project the first set of 8 averaged chin 0.85 n and width 2.73 n against his real 0.80 / 2.63. Every generated image
   came out ~8–10 % long in the chin and ~7 % wide. The lean set (0.765 / 2.56) brought the generated face to
   0.82 / 2.66, and it won two blind rounds in a row.
4. Order matters. Put the clearest **frontal** frame first, then near-frontal, then 3/4: G1 (front), N1, N2 (neutral, near
   front), G2, G3, G7 (3/4), N3, N4. Keep it the same in every run so results compare.

## 5. Angle sets

The lean set is built for 3/4 shots. Other angles need references at that angle, or the face drifts:
- **front / eye contact:** the 6 most frontal crops (lowest |yaw|), tight heads, no mic, plus G1 and N1. For a medium
  shot, mix 3 of them (F1–F3) into the lean set in place of three 3/4 frames.
- **side:** the 6 most turned crops, plus two 3/4 lean frames.
- **wide:** 3 full uncropped frames (they show your build and how you sit) + 5 lean crops.

In that project, eye-contact shots built with the front frames measured closest of all (0.82 / 2.55, 0.83 / 2.51). A
shot from the side camera with a turn to the lens, without side refs, was "very off".

## 6. Room photos (always last)

Three photos of your real room, taken from where the cameras will be: the whole room, the desk, the window side. Upright,
no people, your usual furniture and gear in place. Say "their own room from the last three reference photos" in the
workspace prompt. Three photos hold the room's layout across camera angles far better than one.

## Limits

- At most 10 references per Seedream run: 7–8 face refs + the room photos.
- The reference order and set stay fixed within a round, so the only variable is the camera.
- Never feed a generated image back as an identity reference. A generated face compounds its own errors.
- A screenshot of someone else (a look you like) goes into the prompt **as words**, never as an image reference.

## Checking a result's proportions

```bash
swift scripts/lmjson.swift lm.json rounds/r03/out/*.jpg && python3 scripts/measure.py lm.json
swiftc -O scripts/landmarks.swift -o lm && ./lm rounds/r03/out/*.jpg   # chin and jaw width over the eye→mouth distance
```

Within about ±0.05 n of your held-out means reads as you. +0.08 reads long or wide, and people describe it as "older" or
"heavier". Prompt words and chin-only edits move it less than 1 %, so pick the takes nearest your numbers.
