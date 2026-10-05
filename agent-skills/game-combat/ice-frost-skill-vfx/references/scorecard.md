# Scorecard: Ice and Frost demo, matched to target images (October 2026)

**Target:** 8 out of 10 against three target images. **Result: not reached.** The page score went 4.90 → 5.88 → 5.95 → 6.25 over three rounds, and the loop stopped there at the user's request.

## How it was judged

- **Targets:** GPT Image 2.5 edits of the page's own frames at three hero beats (the frost creep at 2.6 s, the ice spikes at 3.2 s and the blizzard at 2.4 s), so the camera, framing and layout already matched. Each edit kept the composition and changed only how the frost, ice, snow, mist, powder and sky looked.
- **Evidence:** one 1280 × 720 frame per beat from headless Chrome for Testing, loaded from disk at a pixel ratio of 1.5, stepped at 1/60 s from the start of the cast to each beat's time, interface hidden. The judge also measured region means and spreads, luminance percentiles, bright hue, speck and glint counts against a local median, star counts and per-band profiles of the blizzard column, and read side-by-side crops and overlays.
- **Judge:** one fresh subagent per round, given the targets, the frames, the previous round's frames and its verdict.
- **Rubric:** composition 0–3, lighting 0–3, materials 0–3, details 0–1 per shot, summed to 10. The page score is the mean of the three shots.

## Rounds

| shot | r0 | r1 | r2 | final |
| --- | --- | --- | --- | --- |
| Frost creep | 5.4 | 6.1 | 6.05 | 6.25 |
| Ice spikes | 4.95 | 5.95 | 6.1 | 6.35 |
| Blizzard | 4.35 | 5.6 | 5.7 | 6.15 |
| **Page** | **4.90** | **5.88** | **5.95** | **6.25** |

The blizzard was the lowest shot every round.

Measured alongside (r0 → r1 → r2 → final unless marked, then the target):

| | value |
| --- | --- |
| creep: frost pixels with luminance over 120 | 0.86% → 3.30% → 4.07% → 3.74%, target 4.50% |
| creep: far-right snowfield (mist bank) | (21,32,51) (r1) → (19,33,53) → (24,39,63), target (25,40,61) |
| creep: bottom-right snow std (relief contrast) | 9.1 (r1) → 7.4 → 11.8, target 14.5 |
| creep: bottom-right strong glints | 61 (r1) → 1 → 1, target 415 |
| spikes: foreground mean | (48,63,88) (r1) → (48,71,99) → (40,60,86), target (40,59,86) |
| spikes: p99.9 luminance | 205 → 222 → 217 → 217, target 238 |
| blizzard: left sky, y 100–200 | (7,15,29) (r1) → (7,15,29) → (4,9,20), target (2,7,16) |
| blizzard: lower column (y 320–400) band peak | 87 (r1) → 68 → 93, target 103 |

## What moved the scores

| round | change | effect |
| --- | --- | --- |
| r1 | The palette moved from cyan to steel blue-white; a navy sky with twice the stars and a flat forest edge; the snow given relief, raking moonlight and glitter; the frost thicker and beaded with crystal-facet glints, a contact shadow and stars on its tips; the ice given a fracture network, crisp facet edges and FXAA on ice pixels; the blizzard rebuilt as an S-shaped column of powder on helical strands | every shot rose about a point (4.90 → 5.88); the palette, the brighter frost, the treeline height, the column's footprint and the removal of the orbit arcs were credited |
| r1 | **Regressions:** the old mist sheet was removed and nothing replaced it; the new glitter was uniform single-pixel salt, over the far field and in the air | the mist became the judge's first fix three rounds running |
| r2 | Mist banks laid where the targets have mist; two glint sizes with a pixel-space spot; crystal clumps at the frost's hub; halos and micro-glints on the far arm tips; the ambient motes and the twinkle sprites partly removed; softer powder points; the spray off the top kept within the column | only +0.07: the salt was gone but the snow now read as satin with "10× too few" glints, the banks were too thin to register, and new artifacts (a posterised hub, puffs, twinkles) cost what the fixes gained |
| final | **A step change, driven by measurement:** a region-stats harness (mean, std, percentiles, high-frequency energy and glint counts per region, frame against target); a mist-only debug view; each bank marched over its own span with white jitter and a blur; the scan's own normal at a 0.55 m tile for grain; band-limited relief with sharp-crested dunes, broken crust near the ice and self-shadow; dense sugar sparkle plus strong glints; side branches leaned toward their tips as a post-transform; the sky dimmed under the blizzard; brighter strands in the column veil; more rubble | +0.3, and the blizzard +0.45: the far mist bank, the relief, the foreground exposure, the blizzard sky and its lower column were credited |

## What regressed, and why

- **The mist removal (r1).** The original teal sheet read as flat haze, so it was cut; nothing took its place, and all three targets rely on mist. It took two more rounds to bring it back, because the first banks were too thin and too dim to register, and one march over all the banks together gave a small plume only two samples. A mist-only debug view found both in one capture.
- **The salt glitter (r1).** Hashed micro-facet glints one pixel across, over every surface and at every distance, read as noise. The fix in r2 swung the other way: snow with almost no sparkle. The target has both a dense fine sparkle and a few strong glints; measuring high-frequency energy and glint count separately, as two populations, ended the flip-flop.
- **The barbs and the shared random stream (r2).** Changing the side branches' angle inside the frost growth drew different numbers from the shared generator, moved the spine and moved every spike placed along it. The angle change was reverted, then made in round 3 as a post-transform about each branch's own root, which moves nothing else.
- **The framing (r3).** Straightening the blizzard's axis also moved the camera aimed at it, and every spike shifted 30 px off the target. The camera was pinned to the framing the targets were cut from.

## Where it falls short, in the last judge's words

- **Glints read as airborne dots:** "evenly sized, bright, 3–5 px discs over the snowfields" that "read as dust on the lens or falling snow"; the snow "still has no real sparkle" (creep strong glints 1 against 415).
- **Mist:** the far bank is "a smooth, flat haze with no torn, wind-stretched streamers"; the left bank and the lit plume off the top tip are still missing in creep; in spikes the right mist is "a flat, smooth, horizontal sheet" where the target's plume hugs the ground and tapers.
- **Blizzard base:** "the base eruption is still missing", "billowing white spray plumes" at both ends of the row; the fog body "still shows the screen-door cross-hatch"; "too many strong flakes and too little faint powder".
- **Ice:** "still milky, with axis-stretched streaks" apart from the big pair; "edge seams are still dotted"; tips "clean, needle-sharp points" where the target's are chisel-cut; rubble "white, crumpled, paper-like clumps" not sunk into a mound.
- **Frost:** "still a flat painted decal" with a "fishbone comb rhythm"; the hub "a blocky, posterised staircase clump"; tip halos "small, soft round blobs".
- **Details:** a straight 10–12-level seam in the blizzard's ground; a treeline that is "a straight band with 1-px vertical ticks and vertical striations".

## What it would take to reach 8

The judge's remaining list is structural, not tuning:

- **Snow sparkle on the surface, not in the air.** Strong glints 1.5–3 px, only on lit crests and fading with distance, with no round discs; about 400 in the creep shot's near corner.
- **Mist with shape.** Torn, wind-stretched streamers trailing off the banks; a lit plume off the frost's top tip; ground-hugging plumes from the spike bases that taper.
- **A real eruption at the blizzard's foot.** Billowing, noise-eroded spray sprites 40–120 px across with backlit cores, a churned snow dome, and the fog body moved into particles and ribbons so the screen-door goes.
- **Clear, chiselled ice on a crushed-ice mound.** Near-zero diffuse on every shard, analytic edges, chisel-cut and stepped tips, cracks at several depths, a white-hot rim with bloom, a broken shard leaning on the big pair; 60–120 ice-shaded chunks sunk into a 0.2–0.4 m ridge.
- **Frost with relief.** Needle fur and crystal knobs from a height field with normals and a contact shadow, a heaped hub of crystals with lit tops and dark gaps, a regrown stub fork, and 20–40 px halos at the arm tips.
- **A soft treeline** with rolling crowns and no vertical striations.

## Cost

GPU frame time on the shipped page, WebGL timer queries at 1440 × 900 and a pixel ratio of 1.5 (2160 × 1350), at a load average of 3.1–4.8 on a shared machine:

| sampling | chill | creep | spikes | blizzard | shatter |
| --- | --- | --- | --- | --- | --- |
| every 4th frame redrawn 5 times, fastest kept (median / p90) | 5.7 / 8.7 | 5.9 / 9.8 | 5.1 / 7.4 | 5.5 / 8.5 | 5.7 / 8.4 |
| every frame, one query each (median / p90) | 5.7 / 8.8 | 9.7 / 10.7 | 9.9 / 16.3 | 3.9 / 7.6 | 8.7 / 12.7 |

Milliseconds. All beats are within the brief's 12 ms median budget. The best-of-5 row is the better estimate of the page's own cost; the single-query row includes other work on the shared GPU. Measurements taken while the load average was 25–75 during the loop read 16–28 ms and were not trusted.

## The user's notes, from the brief

The page was built against notes the user gave on the Black Lightning demo, before any judging:

- **"Too much animation… really cool and dynamic, but not as in-your-face."** Shapes hold and fade; one major event at a time (the bloom, the creep, the eruption, the wind, the shatter); lights swell and settle; shake and fisheye run at 0.6 and 0.65.
- **"Less bold, more subtle, more fine lines… more nuance."** Hairline frost with finer needles than the bake can hold, brightness varying along every stroke; ice with fine cracks, bubbles and edge lines; powder as soft points and hairline streamers.
- **"The transitions need to be smooth."** Every size, intensity and mist bank eases; the blizzard ramps in and out; replaying a beat sinks the standing ice back into the snow, and a new cast melts the last one away.
- **"The floor needs to be more realistic."** The scanned CC0 Snow 02, re-tinted cold blue-white, with dunes, crust, moonlight and glints, and lit by the ice itself.
- **"The balls' sliding textures."** The frost is grown and revealed, never scrolled; the mist and the veil churn in place through drifting warps and crossfaded advection.
- **"The black shadow and frames should also have more details."** Impact frames keep the tapered speed lines; the ice carries internal cracks, bubbles and edges rather than one flat tint.

Before the dream loop, two reviews of the blizzard drove two rebuilds: "a dozen fat, opaque strokes crossing each other at random angles… like scribbles on the lens" became many hairlines on a column with a centre, a tilt and a turning base; then "a wire sculpture or a scribbled spring" became a translucent fibrous veil carrying powder on helical strands, with a crown kept within 1.3× the body's width. The same review asked for whiter, less saturated ice, and it was changed from cyan to white-blue.
