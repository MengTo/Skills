---
name: lightning-energy-skill-vfx
description: Build the effects of a close-combat energy skill as one visual language in Three.js. White-blue lightning re-rolled at 30 Hz with tapering trunks and forks of forks, a see-through ray-marched energy orb (swirling filaments, hot core, feathered rim) that bends the air, a torn black shadow that hangs off the orb and streams behind it as it moves, air bursts felt as refraction, orange sparks for cold-warm contrast, debris that lands, heat in the ground's own cracks, and impact frames that hold, invert in two-tone ink with speed lines, shake and bend the lens, limited to three flashes a second. Use for anime or dark-fantasy skill effects, lightning or thunder fists, energy balls, charge-ups, dashes with shadow trails, shockwaves, storm or domain rings, ultimates, hit-stop, impact frames, negative flashes, screen shake, fisheye punches, time ramps, "black lightning", "thunderstorm fist", "afterimage" or "skill effects only". Includes a reusable module and a five-beat demo with failure-mode switches.
---

# Lightning Energy Skill VFX

Use this for the effect half of a skill: what the fist throws, what the air does, what the hit leaves. Reach for a sibling instead in these cases:

- **Readable, budgeted gameplay effects in general** (telegraphs, status, cleanup rules): `create-game-vfx`. Its readability rules still apply here.
- **Scoring a skill out of 10, or polishing the caster's body and timing:** `game-dev-combat-skill-polish` and `game-dev-combat-animation`.

Source: a 30-second skill-showcase brief for a dark-fantasy ability user. White-blue lightning, a semi-transparent thunderstorm orb ahead of the fist, black smoke afterimages like a shattered cloak, air bursts, orange sparks and impact frames. Only the effect language is kept here. The character, story and shot list are left out.

Verified stack: Three.js r170, WebGL2, GLSL `ShaderMaterial`s, HalfFloat render targets, a 96³ baked noise texture, and a hand-written bloom and composite. No post-processing library.

## The mechanism

**One effect clock, one composite, and a shadow that belongs to the orb.**

- **One clock.** Lightning re-rolls on it, a hit freezes it (a hold), and a time ramp slows it. A 0.1 s hold therefore stops sparks, smoke, rings and lightning together.
- **One composite.** Every layer that bends the air writes a signed screen offset into one shared distortion buffer. The composite reads colour through that offset, adds bloom and tone maps once. Only then does it draw the impact frame on top, so a negative flash inverts the finished image rather than one layer.
- **The orb carries its own shadow.** A black teardrop is drawn behind the orb, and ribbons and billows leave from the orb's back. Wherever the fist goes, the black follows it; nothing is emitted from a body you cannot see.

## Reuse the working effect

Copy [assets/storm-energy.mjs](assets/storm-energy.mjs). You pass in your own `THREE`, and the module does not import a second copy. [The demo](demo/index.html) runs this same module, inlined by `demo/build.mjs` because a page opened from disk cannot import modules.

```js
import { createStormEnergy, ENERGY_LIGHTS_GLSL, GROUND_HEAT_GLSL } from './storm-energy.mjs';

const fx = createStormEnergy(THREE, { renderer, scene, camera });   // bakes the noise texture
fx.setSize(width * dpr, height * dpr, dpr);       // drawing-buffer pixels, again on resize
fx.warmup();                                      // compile every effect before the first hit

const orb = fx.createOrb({ radius: 0.4 });        // shadow: true by default (teardrop, ribbons, billows, motes)
orb.reach = [shoulder, elbow, head];              // Vector3s the arcs can leap back to

// Ground and props: add ENERGY_LIGHTS_GLSL (+ GROUND_HEAT_GLSL), spread fx.lightUniforms
// (+ fx.heatUniforms) into their uniforms, and add energyLight(...) and
// uGlow * groundHeat(p.xz) * yourCrackMask to their colour.

function frame(realDt) {
  const dt = fx.update(realDt);                   // sim seconds: 0 during a hold, scaled by ramps
  // move the fist with dt, then:
  orb.position.copy(fist).addScaledVector(aim, orb.currentRadius * 0.92); orb.axis.copy(aim);
  fx.render();                                    // the orb's shadow follows from its motion here
}

// A heavy hit:
fx.blast(orb.position, aim, { length: 4.6, radius: 1.5 });   // a few divergent bolts + a refraction funnel
fx.burst(orb.position, { strength: 0.9 });        // air burst: felt as refraction
fx.burst(groundUnderFist, { strength: 0.6 });     // ground burst: ring, dust, chips, spark fountain, heat
fx.impact({ hold: 0.1, frame: 'full', at: orb.position });
```

Other calls:

- `fx.bolt(a, b, opts)`, `fx.sparks`, `fx.debris`, `fx.puff` and `fx.shards`.
- `fx.ring` for a single pressure front.
- `fx.createTrail({ chain, chainSize })` for any other smoke stream, with billows laid along its path.
- `fx.vortex(center, opts)` for a storm domain.
- `fx.addHeat(pos, radius, amount)` to make the ground glow.
- `fx.ramp(scale, seconds)` for a time ramp.
- `fx.repeat(ticks, fn)` to re-throw something on the next lightning ticks.
- `fx.attractor` to pull everything into a charge.

## The layers, with the numbers that shipped

| layer | numbers |
| --- | --- |
| Lightning | Midpoint displacement with 4–7 levels, up to 129 points; bolts longer than 1.5 m get an extra level. Each split lands 32–68% of the way along, and the offset is 0.15–0.34 × the bolt's length, halving per level, with the first level at 0.6×. Trunk weight varies 0.85–1.45×. Trunks taper as `(1 − 0.85·t^1.3)` and swell and pinch ±15% along their length. Forks leave 15–70% of the way along, 20–42% as long, at 0.42× width and 0.55× brightness. Forks longer than 0.25 m fork again (0.6× again). A new shape on every **30 Hz** tick, living 1–3 ticks and stepping 1.0 → 0.55 → 0.28 → 0.14. Drawn as a screen-space ribbon, at least 5–10 px wide and at most 26 px × dpr. The core radius is max(0.7 px × dpr, 7% of the width), and the halo falls off over 30% of it. Core ×6 white, halo ×2.4 of (0.30, 0.60, 1.00). Bolts fade out within 0.5–1.8 m of the lens. |
| Orb | Ray-marched inside r < 1.02: 22 steps from a random per-pixel start. The interior turns rigidly (t × (1.4 + 2.2 × pressure)) plus a fixed shear of 2.2 × (1 − r) and 2.4 × the axial height, while the noise scrolls at 0.35/s. A baked warp `w` at ×1.5 softens the edge: `1 − smoothstep(.55, 1, r + w·(.025 + .1·instability))`. Filaments are where two simplex fields cross zero, `pow(max(a1·a2, 0), 20) × 12 × (1.25 − r)`, at ×1.6 of the warped coordinate. The core is `exp(−30r²) × 1.2`, and a faint inner glow is `0.045 × (1 − r)`. Absorption is `exp(−dt·edge·(.12 + .2·pressure))`, output alpha 0.3 × (1 − T), so it is mostly additive. The rim is `pow(1 − n·v, 9) × (1.4 + 2.2·pressure)`, feathered 0.25–1 by noise around it. A spring (ω 34, ζ 0.3) compresses and rebounds it. Above 0.45 instability, random kicks of −0.32 to +0.26 land every 0.12–0.32 s. The lens offset −n.xy × 0.11 × (radius ÷ screen-height span) × √(n·v) goes into the buffer's second channel, so it never splits colour. |
| Shadow | **Teardrop**: a camera-facing quad behind the orb. In orb radii it is 1.6 + 2.6K long, with half-width 1.25 + 1.1t − 2.2t² and a round cap at the front. K = 0.65 + 0.35 × (speed − 1) / 4: there is always a tail. Torn tongues come from noise squeezed across the tail (×2.4) and streaming down it (×0.55 at 2.6/s), with finer wisps at ×6.5 / ×1.4. The edge is `smoothstep(−.02, .035)`, the tip shreds from t = 0.7, and holes open toward the tip. The colour is pure black. The tail points against the velocity while the orb moves, and back along the arm and up 0.3 while it holds. **Ribbons**: three from the orb's back at 1.0 / 0.6 / 0.6 × r, erosion 0.24 / 0.22, opacity 0.8. **Billows**: one every 0.5 r travelled, 1.2–2.0 r wide and stretched 1 + 0.7k along the path. Another 14 × (0.4 + pressure) per second stream back while the orb holds. |
| Smoke detail | Ribbons drawn premultiplied over the frame, colour (0.010, 0.011, 0.016). `d = across·1.45 − 0.45 + fbm·0.85 + tatter·0.55`: the tatter is fine rips at ×3.4 along and ×3.8 across. It erodes by `th = mix(0.32 + erode, 1.05, age^0.8)`. Alpha is forced to zero over the outer 16% of the side, and fades within 0.8–2.6 m of the lens. Width w × (1 + 0.9·age) × a noise of 0.3–1.2 along the length, with the tangent taken from points i ± 2. Billows erode 3 octaves plus a fine one with a 0.07-wide edge, and fade into the ground plane over 0.22 m. |
| Air and ground | Three rings 55 ms apart: radius 2.2 / 3.4 / 4.8 × strength, line 0.04 / 0.07 / 0.11 m, life 0.22 / 0.32 / 0.46 s, refraction 0.035 / 0.028 / 0.02 m with a derivative-of-Gaussian profile. **In the air they are refraction only** (colour × 0.12). On the ground they draw at 0.77 / 0.38 / 0.22. Ground bursts add a dust ring, a spark fountain of 30 × strength, chips 3–9 cm across and heat. The punch funnel is refraction only. The punch throws 2 + 2 × strength bolts spread round the axis, 0.35–1.0 × the radius out. |
| Sparks, debris | Sparks run hot (4.2, 2.5, 1.0) → (2.8, 0.78, 0.16) → (0.85, 0.10, 0.025), 4–11 mm, drawn 1.1–5 px wide. Streak = velocity × 20 ms, capped at min(4 × width, 16 px × dpr). Gravity 9.8, drag 1.2, bounce 0.35. Cold motes (negative heat) swirl at the orb at 55 × pressure per second. Chips are twice-subdivided, jittered dodecahedra. Each rests on its rotated hull's lowest corner, bounces at 0.32, slides at 0.55, and shrinks away after 2.4–3.6 s. |

**Light and heat.** Four point lights fall off as 1/(1 + 1.4d²):

- **Orb:** (1.6 + 5.5 × pressure) × radius/0.45.
- **Impact:** 14 × strength, warm cooling to blue.
- **Bolt flash:** min(length × brightness × 2.2, 26).
- **Blast:** 30 × strength.

Heat spots work the same way for ground bursts and the orb. Ground bursts leave radius 1.5 × strength, decaying as e^(−1.3t). Below 2.6 m the orb strikes the ground with p = 0.18 + 0.3 × pressure per tick, leaving 0.8. The ground's own crack mask glows with the heat, and the fine cracks stay faint.

**Impact frames** (composite, after ACES):

| part | numbers |
| --- | --- |
| Hold | 0.05 s warning, 0.1 s heavy hit, 0.15 s ultimate. Sim time is 0 and lightning stops, so the whole frame holds. |
| Two-tone negative | Shown during the hold. Luminance through `smoothstep(.26, .34)` becomes ink (0.012, 0.014, 0.022) on paper (0.93, 0.965, 1.0). `full` covers the frame. `center` is a jagged starburst, `R × (1 + 0.38·spikes)`. Both carry manga speed lines in ink: 140 angular slots with a new seed per hit, 45% of them drawn, widths 0.08–0.33, each starting at 0.3–0.8 R. |
| Flash | Fades to white as e^(−t/0.07) after the hold. Use it only on the ultimate: after a normal hit it read as a grey wash. |
| Shake | `axial`: −a·e^(−7t)·cos(2π·5.5t), a drop and then a rebound, a = 0.006–0.022 screen heights. `radial`: zoom 1 + 1.4a·e^(−6t)·cos(2π·7t) plus jitter. Overscan by 1 + 2.2·|shake|. |
| Fisheye | Barrel (1 + k·r²·1.8)/(1 + 0.45k), k = 0.42 for the ultimate, decaying as e^(−2.2t). |
| Time ramp | 1 → 0.4 over 0.6 s for the ultimate charge (0.22 stretched it to 11 s), back to 1 in 0.04 s. Lightning never drops below 35% of real time. |
| Safety | At most 3 inverting or white flashes in any rolling second. Past that, or with `flashes: 'safe'`, a hit dims the frame by 0.32 instead. Under `prefers-reduced-motion` set `flashes: 'safe'`, `shake: 0` and `fisheye: 0`. |

**Composite:**

- Dual-Kawase bloom with 5 levels from half resolution, **threshold 1.3**, knee 0.6, × 0.085.
- A half-resolution HalfFloat distortion buffer. The xy channels hold fronts and the funnel; zw holds the orb's lens.
- No chromatic split.
- One ACES pass, then sRGB, grain 0.02 and vignette 0.85.
- Scene: a storm-grey horizon of (0.034, 0.039, 0.05).

## Cut a brief into beats

| brief says | call |
| --- | --- |
| charge, condensing orb, fingers curl | `orb.radius` 0.1 → 0.5 over 2.2 s, `pressure` 0.35 → 1, `orb.pulse(−0.3)`, `fx.attractor` pulling motes in, `fx.addHeat` under the orb, dust drawn round beneath it |
| first small burst warning | `fx.impact({ hold: 0.05, frame: 'center', shake: 0.006 })` + a 2-layer burst at strength 0.5 |
| vanish into a dash, zigzag turns | move the orb: its shadow lays out along the path by itself. `fx.repeat(20, …)` throws bolts from the orb back to recent path points. Each turn gets refraction and black billows. |
| straight punch, thunderstorm fist compression | `orb.pulse(−0.35)` 120 ms early, then `fx.blast` + air `burst` + ground `burst` + `impact({ hold: 0.1, frame: 'full', flash: 0 })` |
| lateral swing, spinning elbow | the orb sweeps the arc and its shadow follows; a fan of 9 bolts across the front; a flat ring at chest height as refraction |
| landing, storm domain | ground burst at strength 1.8, `fx.vortex(base, { radius: 2.8, bands: 6 })` (narrow ribbons with billow chains), `attractor.swirl` 6, bolts from the orb into the ring, squeeze the radius 2.8 → 2.15 → 1.7 → 3.3 on the gestures |
| ultimate charge-up | `fx.ramp(0.4, 0.6)`, `instability` 1, `arcRate` 2.2, `attractor` 18 / swirl 5, streams of shadow spiralling in |
| ultimate release | `fx.ramp(1, 0.04)`, the funnel and bursts at 2.2, 10 shadow streams flung along the shockwave's outer edge, 4 ticks of radial bolts, `impact({ hold: 0.15, frame: 'full', flash: 1, shakeMode: 'radial', fisheye: 0.42 })` |
| embers after | slow flakes, slow billows and sparks (gravity 0.04, drag 0.4), and small residual bolts every 0.12–0.3 s |

On a rigged character, the fist socket and the aim drive `orb.position` and `orb.axis`, and shoulder, elbow and head go into `orb.reach`. For a cloak on the body as well, add `fx.createTrail({ chain })` streams from the shoulder bones. The demo has no body.

## Rules, each with the failure it prevents

Each rule came from a capture of this demo that went wrong, most of them flagged by blind judges.

**Shadow and smoke**

- **Hang the shadow off the energy.** Black cloak trails from an invisible body read as detached planks and blobs. The teardrop and smoke must leave from the orb itself.
- **Give the shadow a direction and a torn edge.** A round dark halo read as "a blurred static backdrop". A teardrop with tongues, a crisp edge, holes and a shredding tip reads as a cloak in motion.
- **Black needs a storm-grey backdrop, premultiplied "over" blending and a high bloom threshold.** At a 0.016 sky the smoke vanished, and at 0.046 the frame read as washed-out grey. With a bloom threshold of 0.9, the orb's halo washed the black smoke into "blue haze". Additive black adds nothing (the **Additive** switch shows this).
- **Let the noise own every smoke outline.** Alpha must reach zero at a ribbon's side whatever the noise, or the quad edge shows as a plank. A lengthwise streak term drew striations. Jitter must vary along the length: random per-point drift folded ribbons into glass shards. Keep ribbons narrower than their bends, with the tangent from i ± 2, or they fold like paper.
- **Billows laid along a path need detailed edges and must stretch along that path.** Round, soft billows read as "stamped blotches" or "an out-of-focus smear". Give them crisp three-octave erosion, stretch them 1–1.7× along the path, and fade them into the ground plane so no quad cuts it in a straight line.

**The orb**

- **March sparse filaments, never sheets.** Seven to sixteen steps through soft noise sheets integrated into banding, then a flat white disc. Lines where two noise fields cross zero stay sparse.
- **Bound the swirl.** `spin·t·(1.6 − r)` shears without limit and winds the noise into ever-finer rings and grain. Use a rigid spin, a fixed shear and a scrolling offset.
- **Keep the orb luminous, translucent and calm-edged.** An absorbing body read as an opaque navy marble. A wide, dim rim read as a grey marble rim, and a uniform bright one as a hoop. Surface crackle read as cracks, and a wobbling edge as jelly. Spiral arms read as primitive crescents. A bright opaque sphere reads as a light bulb (the **Glow ball** switch shows this).
- **Jitter the march randomly per pixel.** Interleaved gradient noise drew a diagonal hatch over thin filaments.

**Noise**

- **Bake it, but set the 3D texture yourself.** `WebGL3DRenderTarget` swaps in a texture that defaults to NEAREST and 8-bit, which showed as mosaic edges for two rounds. Use at least 16 texels per noise cell, or thresholds show trilinear facets.
- **Never take zero-crossing filaments from baked classic Perlin.** It is zero on every lattice point, so the orb lit up in a regular grid of cloud that read as a planet. Keep procedural simplex for those.

**Lightning**

- **Re-roll lightning; never tween it.** Morphing bolts read as wriggling noodles (the **Tweened** switch).
- **Build a hierarchy.** Even-width lines with equal segments read as "lines drawn point to point". Give trunks weight, taper them to a point (a blunt end read as a neon tube), split segments unevenly, and let forks fork again.
- **Avoid parallel bundles and bows.** A spear of near-parallel bolts read as combed hair. Chords bowed upward read as bridges and arches.
- **Root discharge at the orb.** Bolts between points out in the air read as loose noodles. Strike from the orb into the ring and down to the ground.
- **Wind ribbons counter-clockwise on screen, and test them with a solid colour first.** Clockwise ribbons were silently culled; the empty frame looked like a tuning problem.

**Impacts and the world**

- **Use the air for refraction, not colour.** Coloured air rings read as hoops. The punch funnel's surface read as grey slabs from inside. Keep refraction under about 1.5% of the screen and drop the chromatic split: a quarter-screen offset turned the orb into a rainbow, and smaller splits fringed every spark.
- **Make the impact frame a starburst with speed lines, and skip the white after a normal hit.** A soft disc read as a spotlight cutout, and the white flash after it as a grey wash.
- **Keep flakes few and dark.** In numbers they read as confetti, lobed ones as leaves, and blue-rimmed ones as worms.
- **Put heat in the world's own cracks, warped, with the fine ones faint.** A radial decal read as a sticker, voronoi tiles as a neon hex grid, and bright fine cracks as worms. Lifting the dust read as flat grey cartoon puffs.
- **Warm up shaders against the colour pass's render target.** First-use compiles cost 44–71 ms hitches.

## Cost

Measured in headless Chrome for Testing 151 on ANGLE Metal at a load average of about 7. Frames were stepped synchronously and each finished with a 1-pixel `readPixels`, so times are CPU plus GPU.

| drawing buffer | median per beat | 95th percentile |
| --- | --- | --- |
| 1440 × 900 (dpr 1) | 4.5–6.3 ms | 8.8–12.6 ms |
| 2520 × 1575 (dpr 1.75) | 8.9–13.1 ms | 16.4–26.2 ms |

The cost is fill rate: the orb's march, and smoke over smoke. Baking the noise cut the frame from 7–10 ms to 2–5 ms at 1440 × 900 before the orb's march grew to 22 steps. The demo caps the pixel ratio at 1.5. Only the first frame after load is slow, at about 120 ms.

Everything is pooled: 260 bolts × 129 points, 1,600 smoke sprites, 1,800 sparks, 160 chips, 40 rings, 8 funnels and 14 scorch marks.

## Lifecycle and accessibility

- `fx.update(realDt)` clamps a step to 0.1 s. Reset your frame clock on `visibilitychange`.
- Under `prefers-reduced-motion: reduce`, the demo holds a composed still (the charge at full pressure) and plays beats only on request, with safe flashes, no shake and no fisheye.
- The demo's interface is minimal: no panels, small text controls over a faint scrim. Switches are real buttons with `aria-pressed`, beats are on keys 1–5 (0 for the full cast), Space pauses, H hides the controls, and changes are announced in a live region. No text renders under 11 px.

## Verify

- [ ] Play the dash: the black shadow streams behind the orb along its path, and nothing dark hangs where there is no orb.
- [ ] With **Tweened** on, the arcs turn into wriggling wire. With **Additive** on, the black is gone and the dust greys the ground. With **Glow ball** on, the orb is an opaque bulb.
- [ ] The orb up close shows swirling filaments around a small hot core inside a thin, broken rim. There is no hatch, no rings and no grid of blobs.
- [ ] The barrage's hits hold for 0.1 s as a full-frame ink negative with speed lines, with no grey wash after. The ultimate's negative is followed by a white flash.
- [ ] Fire five inverting hits inside a second with **Full** flashes: the first three invert, and the fourth and fifth dim by 0.32 instead.
- [ ] Chips come to rest with their lowest corner within 1 mm of y = 0.
- [ ] Reduced motion holds a still with safe flashes. The console is clean at 1440 × 900 and 390 × 844, and the portrait camera backs off so the orb keeps its frame.
