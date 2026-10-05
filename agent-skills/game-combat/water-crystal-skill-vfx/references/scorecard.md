# Scorecard: Water and Crystal demo, matched to target images (October 2026)

**Target:** 8 out of 10 against three target images. **Result: not reached.** The page score went 3.13 → 5.05 → 5.33 → 5.52 over three rounds, and the loop stopped there at the user's request.

## How it was judged

- **Targets:** GPT Image 2.5 edits of the page's own frames at three hero beats (gather at 3.5 s, current at 1.4 s and resonance at 1.6 s), so the camera, framing and layout already matched. Each edit kept the composition and changed how the water, crystals, ground, moon and sky looked.
- **Evidence:** one 1280 × 720 frame per beat from headless Chrome for Testing, loaded from disk at a pixel ratio of 1.5, stepped at 1/60 s from the start of the cast to each beat's time, interface hidden.
- **Judge:** one fresh subagent per round, given the targets, the frames, the previous round's frames and its verdict. It compared crops and measured region percentiles, an 8 × 6 grid of luminance and pixel error, horizon row profiles, the moon disc, the moon path per 40-row band, glint density and sky point sources.
- **Rubric:** composition 0–3, lighting 0–3, materials 0–3, details 0–1 per shot, summed to 10. The page score is the mean of the three shots.
- **Allowed corrections:** after round 1, small moves *toward* the target were allowed (a few pixels of camera pitch, orb offsets by the judge's measured amounts), never a layout change away from it.

## Rounds

| shot | r0 | r1 | r2 | final |
| --- | --- | --- | --- | --- |
| Gather | 2.9 | 5.35 | 5.7 | 5.7 |
| Current | 3.0 | 4.7 | 5.0 | 5.3 |
| Resonance | 3.5 | 5.1 | 5.3 | 5.55 |
| **Page** | **3.13** | **5.05** | **5.33** | **5.52** |

The lowest shot was gather in round 0 (2.9), then current in every later round (4.7, 5.0, 5.3).

Measured by the judge alongside (gather / current / resonance where it gives three):

| | r0 | r1 | r2 | final | target |
| --- | --- | --- | --- | --- | --- |
| brightest 0.1% (luminance p99.9) | 178–203 | 211 / 217 / 226 | 228 / 237 / 242 | 230 / 234 / 240 | 247 / 251 / 255 |
| moon disc | core 222–233, never clips | 0 pixels over 240 | 255, flat (maria std 0.4) | mean 237–238, maria std 3.9 | 233–243, std 3.2–11.8 |
| ground saturation (HSV S) | 153–162 | 68–80 | 94–107 | | 97–105 |
| horizon height | 10–14 px low | 5–9 px low | exact | exact | |
| pixel error (MAE) | | 14.7 / 17.1 / 22.1 | 13.9 / 17.0 / 21.6 | 15.6 / 17.1 / 22.2 | |
| near-ground glint density | | 0.005–0.006 | 0.009–0.012 | | 0.031–0.053 |
| sky point sources (stars) | | | 37 / 0 / 22 | "a handful" | 0 |

Region stats of the final frames against the targets, from the builder's own harness (luminance unless noted):

| shot | region | final | target |
| --- | --- | --- | --- |
| gather | sky, top (mean RGB) | 14/24/37 | 12/21/30 |
| gather | sky above the horizon, moon side (mean RGB) | 39/49/61 | 39/48/56 |
| gather | pool at the stream feet, p99 | 103 | 172 |
| gather | orb, p99 | 155 | 221 |
| gather | moon path, p90 | 131 | 218 |
| current | foreground pool, p99 | 89 | 228 |
| current | orb, p99 | 147 | 237 |
| current | splash, p99 | 206 | 220 |
| resonance | crystals, p90 / share over 200 | 161 / 2.5% | 208 / 11.4% |
| resonance | crystal reflections, p99 | 188 | 250 |

## What moved the scores

| round | change | effect |
| --- | --- | --- |
| r1 | The ground rebuilt as a tidal rock flat: a heightfield of wet rock banks, one flat pool plane at y = 0 cut by the depth test, a mirror pass, a moon-glitter column, caustics on the pool floor. A neutral grade (the teal cast gone, sky grain from 0.03 to 0.007). A clear orb and silver-edged streams with sharp highlights; a star-glint pass; the gather figure-eight solved from the target's screen points; an aerated splash; drops as round beads instead of streaks; clear quartz with a root glow and traced fracture sheets; FXAA | 3.13 → 5.05, "a large step up": the ground, the teal cast, the glitter path, the orb's refraction, the rain-like streaks and the grain were all credited |
| r2 | The pool and rock layout traced from the targets onto a 5 cm world grid; rubble domes and crumb detail with glints only on wet crumbs; caustics on the pool floor only; a 1-pixel crystal edge instead of a 3–4 px outline; lit tips; inner glow only where veils and fractures scatter it; a light at each cluster's waterline; a crisp moon with the bloom capped per pixel and the vignette moved before the tone curve; discrete glitter; rings carrying 3× further and 2.5× stronger, a fine chop; a torn, lopsided crown; even beaded streams with drips; pitch tilts of 5, 6 and 9 px and orb offsets; the orb's sky read sharp | 5.05 → 5.33: the horizon and orb positions exact, the moon a crisp clipped disc, the ground saturation matched, lit crystal tips, the wireframe outlines and pool sparkle gone |
| final | The zenith lifted and a moonlit haze lobe toward the moon; a softer cloud deck; maria on the disc only, so it sits just above the clip; drops flung out of the gather vortex killed; the layout re-traced with forced water and rock regions at the judge's coordinates (the current peninsula cut back, the resonance near ridge removed) | 5.33 → 5.52: the moon disc with maria, the lifted zenith, the better haze, the open current pool, the asymmetric crown, the ridge and the gold claw streaks gone and the pool median matched were credited |

## What regressed, and why

- **Round 2: the clouds and the sky.** Billowed noise turned the cirrus streaks into a "mackerel" ripple, and a strong zenith gradient made the sky darker than round 1, darkening toward the horizon where the target's brightens. The final round lifted it, but about 40% too far on the side away from the moon, and in the final round's cloud deck a thresholded noise read as a two-tone "camouflage" pattern with too much coverage. Gather's pixel error rose from 13.9 to 15.6 for it.
- **Round 2: the crystals went darker.** Showing the inner glow only where something scatters it removed the milky look, but cut the cluster's bright pixels (p95 196 → 180, over 200 from 4.2% to 2.2%) while the target wants 11%. The white has to come back through the facets' highlights, not the fill.
- **Round 2: the gather strands lost their highlight dots** when evenly spaced beads were replaced by noise beads, and read as dull grey glass.
- **Round 2: three new artifacts.** A black rope in the pool under the lash (by the judge's reading, the mirror pass drew the arc's dark refracted interior, not its highlights); square and "x"-shaped droplet sprites round the splash (the builder's reading: bright drops cross the star-glint threshold and grow arms); and a ghost of the orb's reflection at the bottom edge of the resonance shot. All three were still there at the end.
- **Final: over-correction in the layout.** Forced water regions turned the gather bottom right and the resonance left third into flat, empty mirror pools where the targets have low granular rubble shelves.

## Where it falls short, in the last judge's words

- **Water:** "there are still no chop or ripple glints anywhere", and the current shot's pool is "still mirror-flat": pool p95 46–48 against 100–118. The chop is in the shader (slopes 0.004–0.006), but too faint to throw glints at this size.
- **Moon path:** it "still dies in the foreground", with peaks of 43–117 below y 520 against 213–254.
- **Orbs:** "murky; no crisp inverted horizon and no starbursts"; p99 152–154 against 224–234.
- **Streams and lash:** "smooth tubes with RGB dispersion speckle", with no drip threads in gather.
- **Crystals:** "frosted, milky caps; painted strokes"; the main cluster's p95 is 182 against 236.
- **Reflections:** "milky opaque copies" of the crystals rather than broken streaks.
- **Rock:** "smooth melted humps", and a far field of faceted dune humps with long pale strips.
- **Sky:** the camouflage clouds, the overshot lower sky, and "a hard one-pixel horizon step" (31 → 19, where the target fades over 4 px).

## What it would take to reach 8

The judge's top fixes, all structural rather than tuning:

- **Chop and ring normals strong enough on all the water** that the moon's lobe makes a glint web and carries the moon path to the bottom of the frame; a neutral deep tint instead of navy.
- **Soft, dim wisps at about 30% coverage**, silver only near the moon; the sky's lift concentrated in a thin band toward the moon; the horizon blended over 4 px.
- **Granular rubble shelves** (2–6 cm proud of the water, many small clumps, crumb normals, warm lit tops) wherever the targets have them, never smooth humps or empty mirror pools.
- **Clear faceted quartz:** flat-normal tips, facet highlights pushed to HDR so about 11% of the cluster passes 200, white-hot base lights, and the right cluster fanned out.
- **Orbs from a sharp full-resolution capture** taken from the orb's centre (a crisp horizon, the crystals inverted inside), clinging rim droplets and HDR moon starbursts.
- **Beaded water ropes** with highlight glints, drip threads and the dispersion clamped.
- **The artifacts gone:** the arc's highlights rendered into the mirror instead of its interior, droplets as round impostors kept out of the star pass, no ghost orb reflection.
- **A torn splash with a 200 px foam skirt**, streaky HDR crystal reflections, and the warm caustic net under the whole resonance pool.

The final round was cut short when the user said to finish up: the sky, moon, star and layout changes landed, and the planned orb capture, crystal and pool-chop changes were not built.

## Cost, measured after the loop

WebGL timer queries at 1440 × 900 and a pixel ratio of 1.5 (2160 × 1350): every 6th frame of each beat redrawn 6 times and the fastest kept. Medians in ms, p90 in brackets. The machine is shared; its one-minute load average is given for each run.

| build | load | gather | current | crystallize | resonance | shatter | full cast |
| --- | --- | --- | --- | --- | --- | --- | --- |
| the shipped page | 5.6 → 7.3 | 4.1 (6.7) | 4.6 (6.8) | 4.5 (6.8) | 5.5 (6.4) | 4.7 (7.1) | 4.6 (6.8) |
| this demo | 6.3 → 5.5 | 4.1 (5.9) | 4.6 (6.7) | 4.9 (6.9) | 6.6 (9.9) | 4.7 (7.1) | 5.0 (7.5) |

The two are the same module and stage; the demo only loads three.js as a separate script. Timing every frame once, back to back, at load 5.3 gave medians of 10.9 (gather), 11.1 (current), 17.7 (crystallize), 12.0 (resonance) and 16.0 ms (shatter): the shared GPU queues other work between submissions, so compare the best-of-6 figures. Per-pass timer queries are not usable on ANGLE/Metal (every pass read 7–12 ms). CPU per step is 0.2 ms, and 1.6 ms during the shatter's shard contacts.

## The user's notes, from the brief

The page was built against notes the user gave on the Black Lightning demo, before any judging:

- **"Too much animation… really cool and dynamic, but not as in-your-face."** One major event at a time; the orb, the lights and the crystals swell and settle through eased curves; the rain thins rather than stops; shake and fisheye run at 0.6 and 0.65.
- **"Less bold, more subtle, more fine lines… more nuance."** Streams of 12–17 mm radius with travelling beads and drips, drops as 1–5 px beads, fractures as hairlines, a 1-pixel catch-light on every crystal edge, glints as single facets.
- **"The transitions need to be smooth."** The orb's size, glow and place, the camera and its pitch all ease between beats; crystals grow, drain and glow through curves; ripples fade in and out, so nothing pops when a slot recycles.
- **"The floor needs to be more realistic."** The scanned CC0 Low Tide Rocks, re-tinted to near-black wet rock with crumb detail and wet glints, built into banks and pools, lit by the effect itself.
- **"The balls' sliding textures."** The orb deforms in place through its drop modes, rings and a drifting warp (the **Sliding texture** switch shows the failure); ripples ride with the flow along the streams, and rivulets run down the crystals.
- **"The black shadow and frames should also have more details."** A water skill has no smoke; the impact frame is the lightning demo's ink starburst with tapered strokes, and the detail went into fractures, foam and spray.

Before the dream loop, the self-critique rounds and one review round fixed: crystals filled with flat teal; jagged orb and crystal edges; resonance swells cut short by an overwritten hit time; gather streams that read as stilts (now a winding funnel); shards that sank and jittered; white wireframe edges on the shards; a camera that snapped between beats; an orb that burst out of frame; a moon that split into three coloured discs behind a crystal. The review round then named "teal neon tubes", a "teal net ball" of an orb, a monochrome teal frame, a moon reflection that read as a "≡" glyph, the framing and a dark ending, which led to clear water, the neutral grade, the glitter column, the orb drifting over the field and a lit ending.
