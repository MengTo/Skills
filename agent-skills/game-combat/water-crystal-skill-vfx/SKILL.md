---
name: water-crystal-skill-vfx
description: Build the effects of a water and crystal skill as one visual language in Three.js. Water that reads as clear water, never a teal fill or a textured ball. A ray-marched water orb whose surface swells, rings and deforms in place: it refracts the frame behind it with an inverted horizon, has a silver rim and sharp highlights, and shows a faint caustic web on its far wall. Streams wound up from tide pools as uneven beaded ropes with silver edges, drips and shed drops. A lash that unspools from the orb, whips and pours into a pool under a torn, lopsided splash crown of aerated white water with spikes breaking into drops. Analytic ripple rings and rain on the pools. Crystals traced against their own half-space planes (Snell, Fresnel, total internal reflection, exit dispersion, Beer–Lambert, fracture discs, a white-hot root glow and a resonance band that climbs the stone), growing out of the water in a draining veil, then shattering into Voronoi shards that fall, tumble and rest with real contact on a heightfield. Caustics on the pool floor, and a moonlit tidal rock flat: rock banks traced from target images onto a world grid, flat mirror pools, a moon-glitter column of micro-facet glints, and a moon disc with maria. Use for water or ice-crystal skills, water orbs or bubbles, water whips, jets or tentacles, splash impacts, tide pools, rain, crystal growth or eruption, crystal resonance, shattering glass or quartz, caustics, wet-stone night scenes, moon reflections on water, "water and crystal", "hydro", "clear water VFX", "crystal shatter" or "skill effects only". Includes a reusable module and a five-beat demo on a scanned CC0 low-tide floor with failure-mode switches.
---

# Water and Crystal Skill VFX

Use this for the effect half of a water skill: what gathers above the hand, what it throws, what grows where it lands and what breaks. Reach for a sibling instead in these cases:

- **Lightning, an energy orb, black afterimage smoke and air bursts:** `lightning-energy-skill-vfx`. This skill reuses its clock, composite, impact frames and flash limiter.
- **Fire, smoke, embers and heat haze:** `fire-smoke-skill-vfx`.
- **Readable, budgeted gameplay effects in general** (telegraphs, status, cleanup rules): `create-game-vfx`. Its readability rules still apply here.
- **Scoring a skill out of 10, or polishing the caster's body and timing:** `game-dev-combat-skill-polish`.

Source: a brief for elemental skill pages built to the Black Lightning demo's bar, with the notes the user gave on that demo ("not as in-your-face", "more fine lines", "smooth transitions", "a more realistic floor", "no sliding textures", "more detail in the frames"). There is no character: water gathers over an implied open palm. After its self-critique rounds and a review round, the page went through three rounds of a dream loop against GPT Image edits of its own frames (see [references/scorecard.md](references/scorecard.md)).

Verified stack: Three.js r170, WebGL2, GLSL `ShaderMaterial`s, HalfFloat render targets, a 96³ baked noise texture, and a hand-written bloom, glint and composite chain. No post-processing library. The demo's floor is Poly Haven's [Low Tide Rocks](https://polyhaven.com/a/low_tide_rocks) by Dimitrios Savva (CC0). Its 1k colour, normal and ARM maps are in `demo/assets/ground/`, re-encoded at quality 85 and embedded by `demo/build.mjs` as data URIs, so the page opens from disk.

## The mechanism

**Water is what it bends and what it mirrors; crystal is light caught between planes.**

- **Clear water has no colour of its own.** Every water surface (orb, streams, splash) refracts a copy of the frame drawn behind it, reflects the night and the lights with Fresnel, and is tinted only by its path length (Beer–Lambert). Its look comes from silver rims, a dark edge on the unlit side and sharp highlights of small bright sources, which are never scaled down by the 2% reflectance.
- **Surfaces evolve in place.** The orb is a sphere-traced field: its free-drop oscillation modes ride on springs, capillary rings run over it, and a warp field drifts *through* its noise. Nothing turns rigidly or scrolls (the **Sliding texture** switch shows that failure). Streams carry ripples that move with the flow.
- **Crystals are their own planes.** Each crystal is a convex hull clipped from half-spaces. The fragment shader traces the ray inside against those same planes in closed form, so back facets, total internal reflection and edges show inside the stone (the **Painted glass** switch shows a tinted body with only a reflection).
- **The ground is a place, not a texture.** A heightfield of wet rock banks stands out of one flat water plane at y = 0. Where the rock is below the plane, it is the pool floor seen through water. A half-resolution mirror pass (an oblique-clipped reflected camera) puts the rock, the orb, the streams, the crystals and the drops into the pools, and the moon arrives as a glitter column of micro-facet glints. The same terrain runs on the CPU, so shards and drops land on the surface that is drawn.
- **One clock and one composite,** as in `lightning-energy-skill-vfx`: holds freeze every layer at once, refraction-only pressure fronts write into one half-resolution distortion buffer, and the impact frame draws after tone mapping. Here the vignette sits *before* the tone curve, so highlights still clip.

## Reuse the working effect

Copy [assets/tide-crystal.mjs](assets/tide-crystal.mjs). You pass in your own `THREE`, and the module does not import a second copy. [The demo](demo/index.html) runs this same module, inlined by `demo/build.mjs` because a page opened from disk cannot import modules.

```js
import { createTideCrystal, ENV_GLSL, LIGHTS_GLSL, RIPPLE_GLSL, CAUSTIC_GLSL, TNOISE_GLSL, NOISE_GLSL, L_MIRROR } from './tide-crystal.mjs';

const fx = createTideCrystal(THREE, { renderer, scene, camera, seed: 23, moonDir });   // bakes the 96³ noise texture
fx.setSize(width * dpr, height * dpr, dpr);       // drawing-buffer pixels, again on resize
fx.warmup();                                      // compile every effect before the first cast
fx.options.shake = 0.6; fx.options.fisheye = 0.65;   // felt, not thrown at the viewer
fx.groundAt = (x, z) => myTerrainHeight(x, z);    // shards and drops land on your ground (default: y = 0)

// The orb: grow it, ring it when water joins it, kick its drop modes.
const orb = fx.createOrb({ radius: 0.02 });
orb.position.copy(overThePalm); orb.radius = 0.25; orb.glow = 1;
orb.ring(dirOnTheSphere, 0.05, 2.4, 0.2);         // a capillary ring from where a stream arrives
orb.kick(1, 0.03);                                // excite one oscillation mode

// A stream: rebuild its centreline every frame (points + radius per point); the module tubes it.
const stream = fx.createTube({ maxPoints: 64, radial: 14, flow: 3.2, foam: 1.1, glow: 0.7 });
stream.points = arcPoints; stream.radii = arcRadii; stream.visible = true;

// Crystals rise out of the pool floor, glow, crack and shatter.
const C = fx.createCrystal({ base, axis, length: 0.9, radius: 0.1, seed: 7, pieces: 7, groundY: floorY });
C.visible = true; C.grow = 0.6; C.glow = 0.4; C.band = 0.5;   // set every frame from your beat
fx.shatter(C, { center: clusterCentre, strength: 1.2, up: 1.2 });

// Your ground and pools: add NOISE_GLSL, TNOISE_GLSL, ENV_GLSL, LIGHTS_GLSL and RIPPLE_GLSL (and
// CAUSTIC_GLSL for the pool floor), spread fx.envUniforms, fx.lightUniforms, fx.groundUniforms and
// fx.mirrorUniforms into their uniforms. Use ripples(p) + rainRipples(p) for the water's slope,
// sample tMirror through uMirrorMat for the reflection, skyBase/skyClouds for the sky in it, and
// energySplit(...) for the effect's light. Put a copy of your ground on layer L_MIRROR so it reflects.

function frame(realDt) {
  const dt = fx.update(realDt);                   // sim seconds: 0 during a hold, scaled by ramps
  // drive the orb, streams and crystals with dt, then:
  fx.render();                                    // mirror, world, frame copies, solids, water, drops, haze, bloom, composite
}

// A splash:
fx.crown(splashPoint, { radius: 0.16, height: 0.3, life: 0.8 });
fx.spray(splashPoint, { count: 160, dir: UP, spread: 0.9, speed: [1.2, 3.6], size: [0.002, 0.0065], life: [1, 2] });
fx.ripple(splashPoint, { slope: 0.42, speed: 0.55, wavelength: 0.06, decay: 0.75, width: 0.05, life: 3.6 });
fx.addFoam(splashPoint, 0.7, 3.2);
fx.impact({ hold: 0.05, frame: 'none', shake: 0.007, at: splashPoint });
```

Other calls:

- `fx.createOrb({ radius })` returns an orb you change every frame: `position`, `radius`, `glow`, `visible`, `settle` (0–1: calmer, more damped), `neck` `{ dir, len, r }` (a capsule smooth-unioned onto the orb where a stream leaves it), `ring(dir, amp, speed, width)`, `kick(mode, v)` and `currentRadius`.
- `fx.createTube({ maxPoints, radial, flow, foam, glow })` returns a tube: `points` (Vector3s), `radii`, `fades`, `along0` (where the ripples sit on the water, so they ride with it), `visible`, `flow`, `opacity`, `glow` and `wobble`.
- `fx.createCrystal({ base, axis, length, radius, seed, tint, pieces, spin, groundY })` returns a crystal: `visible`, `grow` (0–1, rising out of the floor), `glow`, `band` (the resonance band's height, −1 for none), `veil` and `veilT` (the water film and its draining line), `crack` (0–1, fractures climbing from the root), `frost` and `shattered`. Its shards come pre-cut (`C.pieces`).
- `fx.shatter(C, { center, strength, up })` hands the crystal to its shards (rigid bodies with contact).
- `fx.crown(pos, { radius, height, life, droplets })`, `fx.drop(pos, vel, { life, size, drag, gravity, ripple, kind })` and `fx.spray(pos, { count, dir, spread, speed, size, life, ripple, up })`.
- `fx.ripple(pos, { slope, speed, wavelength, decay, width, life, delay, small })` (slots 0–11 are for hero rings; `small: true` uses 12–23, so drops never steal a splash's ring), `fx.groundUniforms.uRain.value` (0–1).
- `fx.caus[i]` (x, z, radius, gain) and `fx.causCol[i]` (r, g, b, dispersion) for six caustic spots, `fx.addFrost(pos, radius, { grow, life })`, `fx.addFoam(pos, radius, life)`, `fx.wet[i]`.
- `fx.setLight(slot, pos, energy, color)` (held, eased), `fx.flashLight(slot, pos, energy, decay, color)` (decays), `fx.front(center, normal, { radius, thick, life, amp, delay })` (refraction only).
- `fx.vortexField` `{ on, center, swirl, pull, lift, radius }` winds drops of `kind: 1` round a centre and swallows them.
- `fx.impact({ hold, frame: 'center' | 'full' | 'none', flash, shake, shakeMode, fisheye, at })`, `fx.ramp(scale, seconds)`, `fx.repeat(ticks, fn)`, `fx.stats()`, `fx.dropList()` (the live drops, for debugging), `fx.debug` (`noMirror`, `noGrab2`, `noRip`, `noCaus`).
- `fx.options`: `water` (`'living'` | `'sliding'`), `crystal` (`'traced'` | `'flat'`), `flashes` (`'full'` | `'safe'`), `shake`, `fisheye`. `fx.grabTwice = true` takes a second frame copy after the crystals when water overlaps them on screen.
- Layers: 0 the world, 1 distortion, 2 seen in the mirror (`L_MIRROR`), 3 refracting solids, 4 water bodies, 5 drops.

## The layers, with the numbers that shipped

| layer | numbers |
| --- | --- |
| Orb | A back-faced icosphere bound (1.18 radii, 1.42 + the neck's length with a neck) around a sphere-traced field: radius 1 + three P2 modes and a P3 mode on springs (ω 7.2 / 8.1 / 6.6 / 11.3 rad/s, damping 0.16 + 0.25 × settle), a warped noise drifting through at (0.11, −0.07, 0.05)/s with amplitude 4.2% (halved as it settles), a fine octave at 0.5% (surface tension keeps the outline smooth), and up to 4 capillary rings as a derivative of a Gaussian over the arc (amp e^(−1.6t), width × (1 + 0.8t)). Capillary detail at 13.3/radius lives only in the normal (0.045). 26 sphere-trace steps on the coarse field plus 2 refinements on the full one; analytic coverage at the silhouette from the ray's closest approach. Refraction IOR 1.333 through the real far surface; exit dispersion 1.329 / 1.333 / 1.338, clamped to ±30% of the mean channel. **Background:** rays leaving upward read the sky analytically and sharp; rays leaving downward read the frame copy at their ground hit, so the inverted horizon is a line. × 1.35 (a water lens gathers light). Tint e^(−(0.35, 0.1, 0.08) × path × 1.4). A caustic web on the far wall only where 1/|det J| > 1.9 and the wall faces away from the moon, × 0.12. Highlights (lights at pow 400 / 2600, the moon at pow 2600 × 1.6) × (0.5F + 0.03) × 22 × 1.6. Rim: the night mirrored at grazing angles, (env × 3) × (1 − N·V)³. |
| Streams and lash | Tubes rebuilt every frame with parallel-transported frames (no twist), the cross-section wobbling 13% and 7% along the flow. Shading: the frame copy refracted per channel at 1.05 / 1.12 / 1.2 × the bend; thin water colourless, tint e^(−(1.6, 0.34, 0.24) × chord × 9); a silver rim (night env × 5 + moon × 0.07) × (1 − N·V)^1.6 brightest on the lit side; the unlit edge darkened by 0.8; highlights × 26 × 3; thin foam lines torn along the flow. **Gather:** six streams; four wind up a funnel with their own turn (2.1–4.7 rad), climb, bow and 2.5–7 cm of wind drift; two make a figure-eight solved from the shot's screen points (orb-relative Catmull-Rom). Radius 12.5–16.5 mm × a swell of 0.85–1.2 × noise beads (+35% and +25%), thinning 15% toward the orb; drips fall from five points; a bead pinches off every 0.06–0.22 s. **Lash:** a quadratic Bézier from the orb to the splash with its control point 0.93 m above the higher end, a whip wave running out along it (9.5 rad, 0.11 m, dying as e^(−2.6t)), an uneven wind sway of up to ±4.5 cm, more toward the far end, radius 24 → 54 mm toward the impact with beads over the first 30–50%; on release the points go ballistic, bead up and break into drops at 0.42 s. |
| Splash | A lathe crown (56 segments × 7 rows) that rises as sin(π·min(1, 1.15x)) and widens 0.45 → 1.55 radii, lopsided: one side throws 11–17 spikes (heights 0.3–1.0 × (0.35 + 1.3·side²), widths random), the other a low lip (35–60% lower). The sheet tears from the rim down with noise. Aerated white where thick (foot and rim), clear only in the thin sheet; each spike breaks into three drops at its tip. Churn crowns every 0.13–0.2 s while it pours, 150 spray drops a second, foam lace on the pool. |
| Drops | A pool of 2,400, drawn as screen-space beads: width clamp(size on screen, 1, 5) px × dpr, at most 1.5× as long as wide; a dark middle, a bright rim and one highlight. Lit only by the effect lights, 1/(1 + 3d²) × 0.5, and the moon, 0.05 + 0.1 × glint. They land on `fx.groundAt` and ring the water only where they land in it. Drops at or behind the lens are culled (they divided by ~0 into invisible full-screen quads). |
| Ripples and chop | 24 analytic packets: a leading crest with smaller ones trailing, width w(1 + 1.6t), wavelength λ(1 + 0.5t), amplitude S·e^(−decay·t)/(1 + 0.9r), fading in over 0.07 s and out over the last 30% of the life (no pop when a slot recycles). Rain: 26 cm cells, each with a drop every 0.75–1.25 s, a packet at 0.24 m/s and 2.1 cm. Chop: two faint swells (23 and 37 rad/m, × 0.25, gone by 10 m) and four fine waves (83, 109, 131, 177 rad/m, slopes 0.004–0.006, gone by 9 m). Ring slopes count 2.5× on the pools. |
| Pools and mirror | One flat plane at y = 0, depth-tested against the terrain, so every waterline is cut exactly; its alpha is its reflectance, so the pool floor drawn beneath shows through. Reflectance mix(Fresnel, 1, 0.6): still, shallow water at night reads as a mirror. The reflected sky is analytic plus a moonlit haze (0.0085, 0.0128, 0.0185). **Mirror pass:** a reflected camera with an oblique near plane at y = 0, half resolution, drawing layer 2 (a 151² copy of the terrain, the orb, streams, crystals, shards and drops). It is sampled offset by the ripple slope × 0.3/(1 + 0.15d). **Moon column:** the surface is cut into facets of 1.4 cm plus 2.2 pixels' footprint, each wandering on its own slow cycle by σ × 1.3 around the mean slope. A facet flashes when it is within 0.016 of the slope that mirrors the moon, with slope spread σ = 0.04 + 0.02·smoothstep(2, 30, d). × 55 near → 18 far, warm white (1, 0.95, 0.89). |
| Terrain and layout map | A 361² grid stretched by sinh (k = 7.2) to ±900 m around the action: about 5 cm a cell round the action, metres at the horizon. Height in the vertex shader: floor −5 cm plus up to 2.5 cm of noise; rock top 0.4 cm + 6 cm × lump² + 2.5 cm on band ridges − 1.8 cm, plus **rubble**: one dome per 15 cm cell, radius 5–13.5 cm, height 0.7r√q, the highest dome winning with its exact gradient (× 0.55–1 by distance). Rock where procedural east-west bands (x × 0.085, z × 1.45, warped by 3.2 / 1.2 m) pass 0.27–0.35, **or** where the layout map says so, mixed by its confidence and cleared round the skill's basins. **The layout map:** 200 × 180 bytes over x −3…7, z −6…3 at 5 cm (high nibble water, low nibble confidence), traced from the target images through each shot's camera by `demo/layout/layout.py`. The CPU mirrors the terrain exactly (integer hash, same maths), cached on a 2 cm grid over the action for the physics. |
| Rock | The scan at 1.55 m a tile, near-black and faintly warm: (0.075, 0.068, 0.06) × (0.4 + smoothstep(0.06, 0.4, lightness)). AO from the scan and the lumps down to 0.12 in the crevices. Scan normals × 1.35 plus crumb noise at 26 and 61 per metre. Roughness from the ARM green × 0.45 + 0.08, widened by the normals' pixel variance × 5 (specular anti-aliasing). Wet glints: one facet per 0.9 cm cell plus 1.4 pixels' footprint on wet crumbs, pow 260 toward the moon, × 4.5, warm. Under the waterline it is the pool floor, absorbed by e^(−(14, 8, 6.5) × depth) × 0.7. Fog 1 − e^(−0.035d) into slate (0.0082, 0.0112, 0.016). |
| Crystals | A habit of 6 prism planes (radius ±15%), 6 rhombohedral planes at 52–58° to the axis with alternating offsets of 12–30% of the radius (the lopsided quartz point) and a base. A bevel plane on every edge at 2.2% of the radius. The shader traces against the 13 habit planes (14 slots): IOR 1.57, 3 legs (2 in the mirror), total internal reflection, exit dispersion IOR − 0.006 / + 0.008 clamped to ±30% of the mean, absorption (0.3, 0.66, 0.74)^(5.5 × path in metres). Inside: a root glow (1.6e^(−14h) + 0.3e^(−5h)) × (0.35 + 1.4 × scatter) and the resonance band (a Gaussian 0.14 of the height wide) × (0.25 + 0.9 × scatter), where veils, fractures or a little noise do the scattering, all × 1.35; edges a 1-pixel catch-light from fwidth, never a band. Growth: up out of the floor over 0.42 + 0.28 × length s (ease-out), sheathed in a water film that drains in rivulets, a ripple and spray where it breaks the surface, rime at the foot. Clusters of 7, 5 and 5 placed with an overlap test (corners against each other's planes, 12 mm margin), plus a chain of 13 small points in 5 groups of 2 or 3. |
| Fractures and shards | 8 fracture discs per crystal (radius 0.5–1.4 × the crystal's, ragged edge), crossed exactly by each ray: a bright line edge-on (0.14 × (1 − |d·n|)⁵), a faint sheet face-on, a rim in stretches. When it gives, Voronoi cracks climb from the root. Shards are the Voronoi cells of up to 16 seeds measured with the axis squeezed to 0.45 (splinters, not cubes), clipped from the crystal's own planes and the floor. Rigid bodies at 240 Hz substeps: each corner against the ground under it, one impulse at the mean of the corners within 1.5 mm of the lowest, restitution 0.3 above 0.8 m/s, friction 0.5, rolling resistance; piece against piece by corners in the other's planes, two passes a substep; sleep after 0.3 s still. In the packaged demo, 114 of 120 pieces come to rest within 1 mm of the rock and none sinks below it; the other six lie 2 mm to 6 cm up, on other shards, and the worst overlap between two pieces is 1.9 mm (earlier runs: 116–118 of 120, overlaps up to 4.6 mm). |
| Caustics | 1/max(|det J|, 0.09) of the map through 7 travelling waves (29–71 rad/m, never aligned), above 1.35 × 0.45. Six spots: three round the clusters (warm white (0.95, 0.82, 0.58), dispersion 0.014) and three along the lash while it pours (cool white (0.75, 0.88, 1)). The orb throws none: it is clear water, not a lamp. Full strength only below the waterline (× 4 on the pool floor, × 0.12 on dry rock). |
| Moon and sky | The moon at 7.5° elevation, azimuth −52°, colour (0.88, 0.93, 1) × 2.8. Disc of 0.0135 rad × 4 × (1, 0.97, 0.92) with a 0.0006 edge; maria multiply it down to 0.065–0.12 inside the disc, so it sits just above the clip and its grey seas show. Halo pow(m, 4000) × 0.03 + pow(m, 500) × 0.0032. Zenith (0.0029, 0.0064, 0.0118), horizon (0.0105, 0.0175, 0.0275), a forward-scattering haze toward the moon's azimuth (pow 2 × 0.0068 + 0.0012) × e^(−9|y|). Clouds: a deck projected on q = d.xz/(y + 0.08), soft patches (smoothstep 0.02–0.2) lit by the moon (pow 5 / 30 / 200). A 3 px haze line at the horizon. |
| Lights | 8 slots: orb, splash flash, three cluster bases (at the waterline, 0.12 m up), shatter, the stream's foot, spare. Held lights ease at 8/s; flashes decay. Diffuse 1/(1 + 2.4d²), specular 1/(1 + 0.5d²) with Fresnel. Colour (0.7, 0.9, 1): near-white. |
| Grade and composite | HalfFloat colour target. A full-resolution copy of the opaque frame for everything that refracts, and a second after the crystals when water overlaps them. Half-resolution distortion (refraction fronts). Dual-Kawase bloom, 5 levels from half resolution, **threshold 1.3**, knee 0.6, each pixel's share capped at 0.55 above the threshold (a small bright disc no longer swells into a ball), × 0.26 tinted (0.82, 0.92, 1). A star-glint pass at half resolution: 4 arms of 14 taps from pixels above 2.2, × 0.05. **Vignette 0.3 in linear light before ACES**, exposure 1.45, ACES, the impact frame, sRGB, then FXAA (the HalfFloat target has no MSAA) and a 0.007 grain after it. |

## Cut a brief into beats

| brief says | call |
| --- | --- |
| water rises from the tide pools into an orb (4.6 s) | an orb growing 0.02 → 0.28 m as six streams arrive, each a tube rising up its path over 0.8–0.96 s, held 0.55 s, then cut from the root (the figure-eight pair hold until 4 s); a ring and a mode kick where each joins the orb; drops lifted off the pool into `vortexField`; rings at every root every 0.32 s |
| the orb unspools into a lash (4.6 s) | draw back 9 cm and stretch a neck, then a tube along the arc reaching out over 0.44 s; at 1.02 s `crown` + 160 spray + three rings 0.16 s apart + foam + a light flash + a refraction front + a 0.05 s hold; churn crowns while it pours; release at 2.75 s; the orb drifts out over the field |
| crystals erupt where it lands (4.4 s) | three clusters from 0.3, 1.05 and 1.6 s, crystals 0.08–0.09 s apart, each `grow` easing up with its veil draining, frost rings on the stone, then a chain of small points back toward the palm from 2.2 s |
| light rings through the crystals (5.0 s) | four pulses at 0.3, 1.35, 2.4 and 3.4 s, each a refraction front out of the orb and a swell reaching each crystal at its distance / 3.6 m/s (2.0 × (1 − e^(−t/0.08))e^(−t/0.65), summed, never overwritten), the band climbing at 1.9 heights a second; all together at the end, cracks climbing from 4.35 s |
| shatter and rain (5.8 s) | a 0.08 s ink starburst, a light flash, two fronts, every crystal to `shatter`, spray from each; the orb drifts up over the field and bursts at 1.7 s into 220 drops; rain thickens to 0.85 and thins to 45%, ringing the pools to the end; the clusters keep a little light |

**Between beats, ease.** The orb's radius (3.2/s), glow (4/s) and place (5/s) follow what a beat asks; a beat's camera eases in over 1.4 s, its pitch tilt (a few pixels at 720 lines) at 2.5/s; crystals grow, glow and fade through curves. Nothing pops on a beat change.

## Rules, each with the failure it prevents

Each rule came from a capture of this demo that went wrong, flagged by a reviewer, a judge or the user.

**Water**

- **Clear water is not a teal fill.** Streams shaded with an inner glow and the orb with a caustic net over its whole disc read as "teal neon tubes" and a "teal net ball", and every frame was one hue. Water takes its colour only from path length; refraction, silver rims, a dark unlit edge and sharp highlights carry it.
- **Never scale bright small sources by 2% reflectance.** The moon and the lights in a stream at F ≈ 0.02 all but vanished. Multiply only the dim sky by Fresnel; give point sources (0.5F + 0.03) × 22.
- **Never scroll or spin a noise on a water surface.** A rigidly turning noise reads as a printed ball (the **Sliding texture** switch). Drift the warp through the field and let modes and rings move it.
- **Put the light at the splash foot, not inside the stream.** A point light inside a tube glinted all over its own skin.
- **Show the inverted horizon sharp.** Reading every refracted ray from the frame copy made the orb murky. Read the sky analytically for rays leaving upward and the frame copy only at the ground hit for rays leaving downward. (The judge still calls the orb murky; a sharp capture from the orb's centre is the next step, see the scorecard.)
- **Kill drops that leave a vortex.** Drops flung out at the orb's height hung in the sky and were counted as stars (37 in one round-2 frame). Killing them when they leave, and capping their speed, cut that to a handful.

**Moon, sky and grade**

- **The moon's reflection read as a "≡" glyph.** A smooth mirror with a few swells drew a compact stack of four or five white dashes. Real glitter is many small facets, each flashing when its own wandering slope mirrors the moon: a long, thin, broken column that brightens toward the horizon. Keep the slope spread narrow (σ 0.04) or big swells turn it to chrome.
- **A vignette after the tone curve capped every highlight at about 225.** The moon never clipped, and the brightest 0.1% stayed at 211–226 against the target's 247–255. Apply the vignette in linear light before ACES.
- **Cap what one pixel gives the bloom.** An uncapped moon swelled into a soft ball with 1.2–2.2× the target's bright area; a per-pixel cap of 0.55 above the threshold keeps it a crisp disc.
- **A disc far above the clip shows no maria.** Scale the disc so it sits just above 1.0 after the curve, and let the maria multiply it below.
- **The sky brightens toward the moon at the horizon.** In round 2 the sky darkened toward the horizon where the target's brightened. A forward-scattering haze lobe over the lowest few degrees fixed the moon side, but the final round lifted the side away from the moon about 40% too far, and the gather shot's pixel error rose from 13.9 to 15.6. Lift only a thin band toward the moon.
- **Clouds are the hardest texture to fake.** Stretched noise read as brush-stroke cirrus, billowed noise as a "mackerel" ripple, and a thresholded deck as camouflage. Soft, dim wisps at about 30% coverage, silver only near the moon, is still open (see the scorecard).

**Ground**

- **A scan alone reads as a flat gravel plane.** The Low Tide Rocks scan at 2.17 m a tile read as "one flat teal gravel plane". A tidal flat needs macro structure: rock banks standing proud of truly flat mirror pools.
- **Trace the pool and rock layout from the targets.** Each target image was classified into water (the blue sky reflected, B − R high, or the moon's glitter) and rock (neutral and dark), every pixel was traced through its shot's real camera onto y = 0, and the result was splatted into a 5 cm world grid weighted toward the nearer camera, with the skill's own elements masked out. A few screen rectangles force water or rock where the colour test is ambiguous. One map serves all three shots, because they share one world.
- **Test contact per corner on lumpy ground.** A plane fitted at a shard's centre let its corners sink into the next lump (62 of 120 pieces sank, one by 23 cm); testing every corner against the height under it brought that to 3 pieces within 3.4 mm, and 0 in the shipped build.
- **Keep the terrain identical on the CPU and the GPU.** Use an integer hash (not `fract(sin)`) and the same maths, or shards rest above or inside the drawn rock.
- **Anti-alias the specular on scanned normals.** Pebble glints became salt-and-pepper that crawled with the camera, and the preview video came out at 10.5 MB. Widening roughness by the normals' pixel variance fixed the crawl and, with lossless capture frames, brought the video to 6.5 MB.
- **Caustics belong under the water.** Projected on steep rock they read as "gold claw streaks"; weight them by the depth below the waterline.
- **Re-encode the scan, don't ship quality 97.** The three 1k maps were 3.9 MB (5.2 MB as base64, 84% of the page). Decoded with `djpeg -nosmooth` and re-encoded at quality 85 with the original 4:2:0 chroma (`cjpeg -sample 2x2`), they are 1.26 MB, and an in-page A/B of the same paused frames differed by 0.9–1.7 levels in single glint pixels. The page went from 6.2 to 2.6 MB.

**Crystals**

- **Milky glass is scattered light everywhere.** A glow term along every ray lifted every face, and the judge read the crystals as frosted or milky plastic. Show the inner light only where something scatters it (veils, fractures) and at the root; let reflection, refraction and edges carry the rest. (The demo still reads as frosted to the judge; see the scorecard.)
- **An outline band reads as wireframe.** A 3–4 px pale edge on every facet read as SVG strokes; a 1-pixel catch-light from fwidth reads as a cut edge.
- **Dark tips are dropped light.** Ending the trace after three legs left the terminations black; add the light still trapped inside (night env + a little glow) and let the point carry what leaves through it.
- **Three dispersion taps of a bright point are three coloured discs.** Clamp each channel to ±30% of the mean, so the moon through a crystal gets a fringe.
- **Never overwrite a swell's start time.** Each resonance pulse replaced the last hit time before the swell played out, so every swell was cut short; keep a list of hits and sum their swells.
- **Squeeze the Voronoi axis for splinters.** Plain cells broke the prisms into cubes; measuring with the axis at 0.45 makes long shards.

**Frame and tools**

- **Per-pass timer queries lie on ANGLE/Metal.** Every pass read 7–12 ms. Time whole frames, best of several redraws, and attribute cost with interleaved on/off A/B runs.
- **A `//` comment on a uniform's line swallowed the next uniform.** The shatter crashed on an undefined uniform; check that every declared uniform exists on its material after each shader edit.
- **Hide the controls without a fade in captures.** A 0.3 s fade left ghosted controls in a stepped capture; capture mode turns transitions off.

## Cost

The cost is fill rate: the orb's march, the crystals' traces, the full-screen terrain and pools, and two frame copies. Measured with WebGL timer queries at 1440 × 900 and a pixel ratio of 1.5 (2160 × 1350): every 6th frame of each beat redrawn 6 times and the fastest kept.

| build | load | gather | current | crystallize | resonance | shatter | cast |
| --- | --- | --- | --- | --- | --- | --- | --- |
| shipped, its own page | 5.6–7.3 | 4.1 (p90 6.7) | 4.6 (p90 6.8) | 4.5 (p90 6.8) | 5.5 (p90 6.4) | 4.7 (p90 7.1) | 4.6 (p90 6.8) |
| shipped, this demo | 5.5–6.3 | 4.1 (p90 5.9) | 4.6 (p90 6.7) | 4.9 (p90 6.9) | 6.6 (p90 9.9) | 4.7 (p90 7.1) | 5.0 (p90 7.5) |

Medians in ms. Timing every frame once, back to back, gave 11–18 ms medians on the same machine at the same load: the shared GPU queues other work between submissions, and the best-of-6 figure is the one to compare. CPU per step is 0.2 ms, 1.6 ms in the shatter (shard contacts). The demo caps the pixel ratio at 1.5.

## Lifecycle and accessibility

- `fx.update(realDt)` clamps a step to 0.1 s. Reset your frame clock on `visibilitychange`.
- Under `prefers-reduced-motion: reduce`, the demo holds a composed still (the crystals ringing with light) and plays beats only on request, with safe flashes, no shake and no fisheye.
- The demo's interface is minimal: no panels, small text controls over a faint scrim. Switches are real buttons with `aria-pressed`, beats are on keys 1–5 (0 for the full cast), Space pauses, H hides the controls, and changes are announced in a live region. No text renders under 11 px.
- `window.stage` (`play`, `step(dt, n)`, `setPaused`, `fx`, `BEATS`, `ORDER`, `camera`, `orb`, `heightAt`, ...) is there for deterministic headless captures; `?capture` keeps the drawing buffer and turns the interface's fades off, `?idle` starts without the cast, `?still` holds the reduced-motion still, and `?dpr=` lowers the pixel-ratio cap.

## Verify

- [ ] With **Sliding texture** on, the orb's surface turns like a printed ball; with **Living surface** its swells deform in place and rings run over it.
- [ ] With **Painted glass** on, the crystals are tinted bodies with a reflection; with **Traced** their back facets, internal reflections and fractures show.
- [ ] The streams and the orb are clear: the frame behind them bends through them, their edges are silver on the lit side, and there is no teal fill.
- [ ] The moon's reflection is a long, broken column of small glints, not a stack of dashes; the moon is a crisp near-white disc with faint grey maria, not a soft ball.
- [ ] The pools are flat mirrors between rock banks; the rock, the orb, the streams and the crystals reflect in them, broken by rings.
- [ ] Shards come to rest on the rock with their lowest corner within about 1 mm of it and none sunk; any that sit higher lie on other shards.
- [ ] Fire five inverting hits inside a second with **Full** flashes: the first three invert, and the fourth and fifth dim by 0.32 instead.
- [ ] Reduced motion holds a still with safe flashes. Opened from disk, the page requests only its own files. The console is clean at 1440 × 900 and 390 × 844, and the portrait camera backs off by (1/aspect)^0.55 and turns toward the orb.
