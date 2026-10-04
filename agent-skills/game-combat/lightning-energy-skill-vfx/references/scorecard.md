# Scorecard: Black Lightning demo, judged blind (October 2026)

**Target:** every beat at 8 out of 10, against AAA action-game skill effects (Zenless Zone Zero, Final Fantasy XVI, Devil May Cry 5, Genshin Impact, Black Myth: Wukong).

**Result: not reached.** Every beat rose from a baseline of 3–6 to 5–6 and then plateaued. Each round fixed what the judges named, and the next round scored new faults at the same level.

## How it was judged

- **Evidence:** per beat, an 8-frame strip in time order plus one full-resolution close-up. These are headless Chrome captures at 1280 × 720 with a pixel ratio of 1.5, stepped at 1/60 s on a frozen clock, with the interface hidden.
- **Judges:** two fresh subagents per round, given only the rubric and the anonymised images. Beat names were swapped for random ids that changed every round. The lower of the two totals is kept.
- **Rubric:** five criteria at 0–2 points each:
  - orb detail and material;
  - a black shadow that follows the orb;
  - lightning;
  - impact and environment;
  - art direction with no artifacts.

  The judges were told the demo shows effects only, so the missing character is not marked down.

## Rounds (lower judge)

| beat | base | R1 | R2 | R3 | R4 | R5 | R6 | final |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Charge | 3 | 5 | 4 | 5 | 5 | 5 | 5 | **5** |
| Dash | 5 | 5 | 5 | 4 | 5 | 5 | 5 | **5** |
| Barrage | 5 | 6 | 5 | 5 | 5 | 5 | 5 | **6** |
| Storm ring | 4 | 5 | 5 | 5 | 6 | 5 | 4 | **6** |
| Ultimate | 6 | 7 | 6 | 6 | 6 | 7 | 6 | **6** |

The average rose from 4.6 to 5.6. Judge spread was about ±1: in the final round, the storm ring got 7 from one judge and 6 from the other.

## What moved the scores

| round | change | effect |
| --- | --- | --- |
| R1 | Orb rebuilt as a ray-marched volume. Its shadow (teardrop, ribbons, billows) hangs off the orb instead of an invisible body. Chromatic split removed from the orb's lens. Starburst impact frames. | charge 3 → 5, ultimate 6 → 7 |
| R2–R3 | Noise baked into a 3D texture (frame cost fell from about 8 ms to 3 ms) | regressed: the texture was silently NEAREST and 8-bit, and the Perlin lattice zeros lit the orb up as a planet |
| R4 | Texture filter fixed, billows stretched along the path, refraction-only funnel | mosaic and slab complaints stopped |
| R5 | Thin bright rim, no fill, bloom threshold raised to 1.3, fractal forks | the orb scored 2 of 2 in three beats from one judge |
| R6 | Teardrop shadow with torn tongues, ground strikes, a lifted dust wall | dust read as grey cartoon puffs and cracks as neon worms; reverted |

## Where it falls short, in the judges' words (final round)

- **Shadow, 1 of 2 everywhere:** "a vague lumpy cloud parked behind the orb", "one flat ink blot". It is attached and directional, but it never reads as rich torn cloth.
- **Orb, 1 of 2 in most beats:** "a competent textured sphere that stops short of AAA layered energy", "a grey matte halo on a lumpy silhouette". The judges want energy escaping the shell.
- **Debris:** "faceted low-poly blue rocks".
- **Lightning in the storm ring:** "a tangle of equal-width strands" when many bolts overlap.

## What it would take to reach 8

- **Painted assets.** Flipbook smoke and torn-cloth textures, painted lightning strips, and hand-shaped debris meshes. Procedural noise plateaued at about 6 here, as it has on other strict judge loops.
- **A character.** The shadow and arcs need a body to cling to; hanging them off an implied fist caps how much they can read as a cloak.
- **An art director's eye on the motion.** The judges saw stills. Several faults, such as the static blob and the parked cloud, are partly the absence of motion in a strip.

---

# Scorecard 2: realistic lightning, matched to target images (October 2026)

The first loop's lightning, the orb's in particular, "doesn't look like lightning at all". The second loop rebuilt the lightning against three locked target images: GPT Image edits of the charge, ultimate and storm-ring close-ups, keeping the camera, framing and black shadow and changing only the electricity, the orb, the ground and the debris.

**Target:** 8 out of 10 against those images. **Result: not reached.** The scores went 4.1 → 3.6 → 4.2 → 4.25 → 4.0 and stalled; the loop stopped there, by its own rule, to ask the user.

## How it was judged

- **Evidence:** the three close-ups (headless Chrome for Testing, 1280 × 720 at a pixel ratio of 1.5, stepped at 1/60 s on a frozen clock, interface hidden), each next to its target, plus side-by-side crops of the orb, the ground strike and the storm's bolts.
- **Judge:** one fresh subagent per round, given the images, the previous round's images and its verdict.
- **Rubric:** composition 0–3, lighting 0–3, materials 0–3, details 0–1 per shot, summed to 10; the overall is the mean of the three shots.

## Rounds

| shot | R1 | R2 | R3 | R4 | R5 |
| --- | --- | --- | --- | --- | --- |
| Charge | 4.7 | 3.7 | 4.4 | 4.55 | 4.4 |
| Ultimate | 3.75 | 4.2 | 4.3 | 4.4 | 3.95 |
| Storm ring | 3.95 | 3.0 | 3.8 | 3.8 | 3.55 |
| **Overall** | **4.13** | **3.63** | **4.17** | **4.25** | **3.97** |

## What changed, round by round

| round | change | effect |
| --- | --- | --- |
| R1 | Lightning as trees of strips in one point ring (forks of forks to twigs, trunks heavier), a glow measured off the target, ground strikes with flat crawling arcs, a fractured-rock generator, and an orb whose filaments were replaced by a lit cloud volume plus 10–15 real arcs from its core | the orb was first called a plasma globe; the cloud read as "flat royal blue", the arcs as a "hairy brush" |
| R2 | Crack-following ground arcs (the ground's hash mirrored in JavaScript), wet reflections, the X of bolts in the ultimate, floating rocks in the storm | the ultimate rose; charge and storm fell because random strikes went sideways and rocks crowded the camera |
| R3 | Every bolt leaves the orb's membrane, a straight strike under the charge orb, the shadow's head kept inside the orb (it had drawn a dark ring), evenly spread arcs, a hairline rim | all three rose |
| R4 | **The structural round:** the orb's cloud as a lit billow surface, the main channels aimed at the targets' contact points, every re-struck channel a single strand | the orbs and the storm's fan were recognised; +0.08 overall |
| R5 | Wet sheen, analytic crack normals (screen-derivative bumps had drawn dashes along every crack), brighter ground and a darker sky | judged as clay tiles under a too-dark sky; −0.28. Measured against the targets afterwards, the sky had been 2–4× too dark and the quiet charge's ground 2× too bright; both were reset from the measurements |

The judges contradicted each other twice on brightness (the sky and the ground "too dark", then "too bright"); pixel measurements against the target settled both.

## Where it falls short, in the last judge's words

- **Ground:** "a bright clay tile", "thin black Voronoi lines"; the target is dark wet basalt with granular glints and irregular chipped cracks.
- **Orb:** "Earth from orbit mapped onto a ball"; the target's cumulus has finer wisps, deeper cavities and a dense vein network.
- **Bolts:** halos half as wide as the target's, branchlets that bundle into "brooms".
- **Smoke and rocks:** smooth silhouettes and low-poly hulls.

## What it would take to reach 8

The last judge named these as structural, not tuning, and they match the first scorecard:

- **A scanned ground:** a CC0 wet slate or basalt set (albedo, normal, roughness, height) instead of a procedural Voronoi plain, with the effect's own lights and reflections on it.
- **Lightning that lights the world:** line-light approximations or a light-accumulation pass, so the smoke, sky and ground brighten round the bolts, and halos 2× wider.
- **Real content for the soft and the solid:** painted or flipbook smoke cards with fibrous edges, sculpted or scanned rocks, and a higher-resolution cloud inside the orb.

