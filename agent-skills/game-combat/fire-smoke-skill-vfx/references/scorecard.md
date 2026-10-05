# Scorecard: Fire and Smoke demo, matched to target images (October 2026)

**Target:** 8 out of 10 against three target images. **Result: not reached.** The page score went 4.63 → 4.80 → 5.50 over two rounds, and the loop stopped there at the user's request.

## How it was judged

- **Targets:** GPT Image 2.5 edits of the page's own frames at three hero beats (the fire wave at 2.6 s, the pillar at 3.0 s and the impact at 1.6 s), so the camera, framing and layout already matched. Each edit kept the composition and changed only how the fire, smoke, ground, sky and sparks looked.
- **Evidence:** one 1280 × 720 frame per beat from headless Chrome for Testing, loaded from disk at a pixel ratio of 1.5, stepped at 1/60 s from the start of the cast to each beat's time, interface hidden. The judge also saw the targets resized to the same size, crops, levels-stretched views and bright-mask overlays (pixels with luminance over 80, ours against the target's).
- **Judge:** one fresh subagent per round, given the targets, the frames, the previous round's frames and its verdict.
- **Rubric:** composition 0–3, lighting 0–3, materials 0–3, details 0–1 per shot, summed to 10. The page score is the mean of the three shots.

## Rounds

| shot | r0 | r1 | r2 |
| --- | --- | --- | --- |
| Fire wave | 5.2 | 5.15 | 5.93 |
| Pillar | 4.45 | 5.15 | 5.55 |
| Impact | 4.25 | 4.1 | 5.02 |
| **Page** | **4.63** | **4.80** | **5.50** |

The impact was the lowest shot every round.

Measured alongside (r0 → r1 → r2, target):

| | wave | pillar | impact |
| --- | --- | --- | --- |
| bright-mask overlap (IoU) | 0.51 → 0.32 → 0.46 | 0.59 → 0.47 → 0.54 | 0.32 → 0.12 → 0.30 |
| white-hot pixels (lum > 235) | 0% → 0.13% → 0.14%, target 0.16% | 0% → 0.10% → 0.06%, target 0.11% | 0% → 0.10% → 0.02%, target 0.22% |
| backdrop high-frequency energy (r1 → r2) | 1.71 → 0.49, target 0.56 | 1.54 → 0.25, target 0.49 | 1.71 → 0.50, target 0.53 |

## What moved the scores

| round | change | effect |
| --- | --- | --- |
| r1 | Sky and fog neutral slate instead of warm brown; a matte charcoal ground with no sheen; white-hot cores through a hotter ramp; sheet detail inside the flames; bloom halved with a higher threshold; smoke rebuilt as cauliflower billows lit only by the fire; 2.5× more embers as dots, not streaks; a pillar with a hotter column | the pillar rose (4.45 → 5.15); the sky, white-hot fraction and smoke lighting were credited |
| r1 | **Regressions:** the flames became a blocky 2–4 px mosaic; the wave lost its right-hand fires and the impact ring moved (IoU 0.32 → 0.12); the ground read as orange flagstones; a film grain covered the frame | the wave and impact fell |
| r2 | Detail band-limited to the flame buffer and a B-spline upsample; the approved layouts restored through a seed table and a second random stream; the cell pattern removed from the ground for a lump height field with ash flecks; the grain cut to a dither; a thin streaked curtain for the wave's smoke; a broad near-black column with ragged hot cracks for the impact; a pillar with a waist, an S-bend, helical sheets, a blue root, dust banks and a base light pool; a redder ramp | every shot rose; the grain, the mosaic in the column, the wave's missing fires, the cumulus ceiling and the round "lamps" were all called fixed |

## What regressed, and why

- **The mosaic.** Round 1 added thin flame sheets at a frequency finer than the reduced-resolution flame buffer could hold, and brought the buffer up with a partly sharpened Catmull-Rom filter. Every flame turned into 2–4 px square cells. Fixed by fading every octave by its size in buffer pixels and upsampling with a plain B-spline.
- **The seed reshuffle.** Round 1's new particles drew from the same random stream that seeded the flames and placed the burning patches. Every flame created after them got a different seed: the wave's right-hand fires vanished, and a deliberate change of the ring's seed moved it further from the target. Fixed by recording the approved cast's 121 flame seeds in creation order, using them as a table, and giving later features a second stream; parity was checked through the capture protocol.
- **The flagstone ground.** Worley "charcoal clods" with dark gaps between cells read as orange paving under a wide, warm fire light. Fixed with a lump height field, neutral albedo and tight light falloff.
- **The grain.** A 0.028 film grain gave the black backdrop about 4× the target's high-frequency energy. Cut to a 0.0022 dither.

## Where it falls short, in the last judge's words

- **Flames:** the near flames still have "stair-stepped, dithered 2–3 px edges, and soft interiors with no filaments"; the back-front tongues are "thick soft cones" and the impact front "a picket fence of identical soft triangles". The target's are thin, wiry, forked tongues with bright filament veins and dark gaps.
- **Ground:** it "reads as a rippled lake or oil surface", horizontally stretched bands with glints along the crests at the grazing view, where the target is matte charcoal gravel with twigs and stubble.
- **Horizon:** "a hard, perfectly straight horizon line" in every shot, where the target has layered mist.
- **Impact:** "lost almost all white-hot pixels" (0.017% against 0.221%) and is too dark (40.8% true black against 25%); its foreground ground is 2.4× too dark.
- **Pillar smoke:** "regressed from a tall plume to a compact beige mushroom puff"; the blue root "overshot" into "a solid pale-lavender blob".
- **Sparks:** "still about 2× too long, too yellow and too widely scattered", and about half as many as the target's in the pillar and impact.

## What it would take to reach 8

The judge named these as structural, not tuning:

- **Filament flames at full resolution.** Bright veins from a ridged mask (1 − |2·fbm − 1|)^4–6, emission ∝ T^2.5, thin forked tongues with lognormal heights and random spacing, rendered at full resolution or upsampled bilaterally. The flame layer's half-resolution budget is what the "soft cones" come from.
- **A ground that stays matte at grazing angles.** An isotropic gravel height field with real relief and no specular, plus stubble and twig decals and a few charred clump meshes.
- **Atmosphere.** Height fog and mist strata that hide the horizon, lit warm near the fire; a single continuous dust layer in the pillar shot.
- **Smoke that is many small puffs, not a few big ones.** 40–80 px billows with sharp Worley erosion and self-shadowing, a tall pillar plume that leaves the frame, and lit undersides only near the fire.
- **More, smaller sparks** (about 500 in the pillar and impact) kept close to their source and depth-tested against the smoke.

## The user's notes, from the brief

The page was built against notes the user gave on the Black Lightning demo, before any judging:

- **"Too much animation… really cool and dynamic, but not as in-your-face."** Shapes hold and fade; one major event at a time; firelight swells and settles; shake and fisheye run at 0.6 and 0.65.
- **"Less bold, more subtle, more fine lines… more nuance."** Thin crisp tongues instead of blobs, brighter licks inside, hairline needles on the ground, sparks as small dots.
- **"The transitions need to be smooth."** Every size and intensity a beat sets runs through its own curve; flames fade in and out; nothing pops on a beat change.
- **"The floor needs to be more realistic."** The scanned CC0 Burned Ground 01, re-tinted to charcoal and ash and lit by the fire itself.
- **"The balls' sliding textures."** Flames rise with buoyant advection and a drifting warp; nothing scrolls (the **Scrolled** switch shows the failure).
- **"The black shadow and frames should also have more details."** Smoke has lobes, creases, streaks and cracks of fire, never one flat black; the impact frame has tapered strokes.

Before the dream loop, two rounds of review notes fixed: a smoke box from a march bound; fronts that read as curtains and patches that read as candles; a ring that was a perfect circle; clumps that read as tents (now separate tongues of very different heights with notches and detaching licks); wave smoke that read as floating rocks (now a sheet joined to the fire); and a fireball that cooled as a soft red mass (now dark smoke with a few hot pockets).
