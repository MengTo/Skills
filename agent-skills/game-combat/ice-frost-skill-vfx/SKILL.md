---
name: ice-frost-skill-vfx
description: Build the effects of an ice and frost skill as one visual language in Three.js. Frost that grows like real frost, not a painted fern: a dendritic tree grown on the CPU from a seed point, stems racing outward with barbs and sub-barbs that compete for space in one time-ordered queue, side branches leaned toward their tips, baked into a distance field so the shader draws hairline feathers growing out from the seed with a bright tip, rime, crystal glints and a contact shadow. Faceted ice spikes built from half-spaces and ray-traced against their own planes (Snell, Fresnel, total internal reflection, Beer-Lambert blue, trapped bubbles, a fracture network, frosted edges) that erupt along the frost line, crack along visible planes and shatter into convex pieces that tumble, land on a face and rest, with snow lumps and ice chips settled into the crust. A low freezing mist marched as wind-stretched banks that churn in place and part around the ice, a blizzard column of powder on helical strands with a fibrous veil, glinting diamond dust, and a scanned snow floor with dunes, broken crust, a raking moon with self-shadow and two populations of glints. Use for ice or frost skills, frost novas, ice spikes or walls, glacial eruptions, shattering ice, blizzards, snow devils, freezing mist, frozen ground, "ice and frost", "frost creep", "ice shards", "realistic ice" or "skill effects only". Includes two reusable modules and a five-beat demo on a scanned CC0 snow floor with a failure-mode switch.
---

# Ice and Frost Skill VFX

Use this for the effect half of an ice or frost skill: what forms in the hand, what spreads across the ground, what erupts, what the wind does and what breaks. Reach for a sibling instead in these cases:

- **Lightning, an energy orb, black afterimage smoke and air bursts:** `lightning-energy-skill-vfx`. This skill reuses its clock, composite, impact frames and flash limiter.
- **Flames, smoke, embers and burning ground:** `fire-smoke-skill-vfx`.
- **Readable, budgeted gameplay effects in general** (telegraphs, status, cleanup rules): `create-game-vfx`. Its readability rules still apply here.
- **Scoring a skill out of 10, or polishing the caster's body and timing:** `game-dev-combat-skill-polish`.

Source: a brief for elemental skill pages built to the Black Lightning demo's bar, with the notes the user gave on that demo ("not as in-your-face", "more fine lines", "smooth transitions", "a more realistic floor", "no sliding textures", "more detail in the shadows"). There is no character: the frost blooms in an implied hand at chest height. Then eight self-critique rounds, two rounds of review on the blizzard, and a three-round dream loop against GPT Image edits of the page's own frames (see [references/scorecard.md](references/scorecard.md)).

Verified stack: Three.js r170, WebGL2, GLSL `ShaderMaterial`s (one in GLSL3 for a two-target bake), HalfFloat render targets with a depth texture, a 96³ baked noise texture, and a hand-written bloom, composite and FXAA. No post-processing library. The demo's floor is Poly Haven's [Snow 02](https://polyhaven.com/a/snow_02) by Rob Tuytel (CC0), its 1k colour, normal and AO/roughness maps in `demo/assets/ground/`, embedded by `demo/build.mjs` as data URIs so the page opens from disk.

## The mechanism

**Frost is grown once and drawn by its arrival time; ice is traced against its own planes; the air is marched where the cold pools.**

- **Grow the frost, then let the shader reveal it.** `growFrost` runs a small diffusion-limited growth on the CPU in about 50 ms: stems, barbs and sub-barbs advance as events in one time-ordered heap, so whichever tip reaches a patch first claims it and later tips stop against it. Every segment carries the time the front reached it. The tree is baked once into a 2048-wide HalfFloat distance field, and the ground shader draws hairlines from it by comparing that arrival time with the frost clock. Nothing is re-rolled or scrolled: the pattern grows.
- **Ice is a convex hull you can trace exactly.** Each spike is a set of planes (sides, tip facets, chips, a base) clipped from a cube. The fragment shader refracts into the hull, finds the exit plane in closed form, reflects internally while total internal reflection holds, and samples a mip-mapped copy of the world pass for what is seen through it. Cracks are planes too: the spike shatters along exactly the planes the viewer watched crack.
- **Pieces are rigid bodies with one contact.** Every fragment and chunk keeps its hull vertices, so the lowest corner is known each substep. An impulse with friction lands it, and when it slows it tips onto the face nearest the snow, so nothing ends balanced on a point, floating or sunk.
- **Mist is a ray march in banks, not cards.** Each bank is a wind-stretched ellipsoid marched over its own span at a third of the resolution, with domain-warped fibres advected in two crossfaded phases so it churns in place. A mist-only debug view (`fx.debug = 'mist'`) is how it was calibrated.
- **One wind field moves everything.** A column vortex (foot inflow, core lift, top outflow, an S-shaped axis) drives the powder, the flakes, the hairline streamers and the mist's rotation.
- **One clock and one composite,** as in `lightning-energy-skill-vfx`: holds freeze every layer, a time ramp slows the crack, refraction rings go into a half-resolution distortion buffer, bloom has a high threshold, and the impact frame draws after tone mapping. FXAA runs only on pixels the ice pass marks, because MSAA on a HalfFloat target resolves to garbage.

## Reuse the working effect

Copy [assets/frost-energy.mjs](assets/frost-energy.mjs) and [assets/frost-growth.mjs](assets/frost-growth.mjs) side by side (`frost-energy` imports `./frost-growth.mjs`). You pass in your own `THREE`, and neither module imports a second copy. [The demo](demo/index.html) runs these same modules, inlined by `demo/build.mjs` because a page opened from disk cannot import modules.

```js
import { createFrostEnergy, LIGHTS_GLSL, FROST_GLSL, TNOISE_GLSL, HASH_GLSL, LAYERS } from './frost-energy.mjs';

const fx = createFrostEnergy(THREE, { renderer, scene, camera, seed: 11 });   // bakes the 96³ noise
fx.setSize(width * dpr, height * dpr, dpr);       // drawing-buffer pixels, again on resize
fx.options.shake = 0.6; fx.options.fisheye = 0.65;   // felt, not thrown at the viewer

// Grow the frost once: a seed point, a forward direction, a reach and the ground area it may use.
const F = fx.growFrostField({ origin: new THREE.Vector3(1.05, 0, -0.08), dir: new THREE.Vector3(1, 0, 0),
  radius: 5.6, area: [-3.0, -4.8, 7.6, 4.8], seed: 7 });
fx.frost.t = 0;                                    // start the growth front; advance it on the effect clock

// Spikes along the frost's main stem, then the obstacle map the mist and snow read.
const s = fx.spineAt(2.35);                        // { x, z, t, dir } 2.35 m along the spine
const spike = fx.createSpike({ base: new THREE.Vector3(s.x, 0, s.z), axis: new THREE.Vector3(0.2, 1, 0).normalize(),
  height: 1.1, radius: 0.12, seed: 3, erupt: 0.7, rise: 0.27 });
fx.buildObstacles();
fx.state.spikeT = 0;                               // the eruption clock; each spike rises when it passes `erupt`

// The ground (or any prop): add TNOISE_GLSL + HASH_GLSL + LIGHTS_GLSL + FROST_GLSL, spread
// fx.lightUniforms, fx.frost.uniforms and fx.obst.uniforms into its uniforms, light it with
// energyLight(P, N, V, albedo, rough) and draw frostAt(p.xz, metresPerPixel) on top. Put it on LAYERS.world.

function frame(realDt) {
  const dt = fx.update(realDt);                   // sim seconds: 0 during a hold, scaled by ramps
  fx.frost.t += dt; fx.state.spikeT += dt;
  fx.render();                                    // world, ice, mist, column, light effects, refraction, post
}

// Crack, then shatter along the same planes:
for (let k = 0; k < 4; k++) fx.crackSpike(spike, k, 0.12 + 0.14 * k, 0.4);
// ...1.4 s later:
fx.shatterSpike(spike, spike.base, 1);
fx.impact({ hold: 0.1, frame: 'full', shake: 0.02, at: spike.base });
```

Other calls:

- `growFrost(opts)` (in `frost-growth.mjs`) returns `{ seg, count, spine, paths, tips, duration, branches }`: `seg` is 12 floats a segment (x0, z0, x1, z1, t0, t1, half-width 0 and 1, level, rand, arc length 0 and 1); `spine` and `paths` are `[x, z, t]` points of the forward stem and of each seed stem (for lights that ride the front); `tips` are branch ends for glints. Options: `seed`, `origin`, `dir`, `radius`, `area`, `speed` (2.6 m/s), `stems` (11), `density`, `symmetric` (a stellar frost of n stems), `fan`, `maxSegments`.
- `fx.growFrostField(opts)` runs `growFrost`, bakes the distance field (2048 wide by default, `res`), builds the tip stars and the hub crystal clumps, and fills `fx.frost.uniforms`. `fx.frost.t`, `.fade`, `.glow` drive it. `fx.stemTip(path, t, out)` and `fx.spineAt(s)` read the grown tree.
- `fx.createSpike({ base, axis, height, radius, seed, erupt, rise })` returns a spike; `fx.crackSpike(S, k, delay, duration)` starts crack `k` (0–2 across the shaft, 3 down its length); `fx.shatterSpike(S, center, strength)`; `fx.resetIce(keepFrags)`, `fx.clearFrags()`; `fx.buildObstacles()` after placing spikes.
- `fx.spawnChunks(pos, { count, speed, size, chips, dir, life, glow })`: snow lumps, or translucent ice chips with `chips: true`.
- `fx.spawnMote(kind, pos, vel, opts)`: kind 0 snowflake, 1 diamond dust (a tumbling facet that glints), 2 cold spark, 3 chipped flake, 4 long straight streak; `life`, `size`, `gravity`, `drag`, `wind`, `bright`, `column` (fades once it leaves the vortex body), `soft` (never under 2.2 px).
- `fx.spawnWisp(type, pos, vel, opts)`: type 0 vapour, 1 powder, 2 ground mist; `size`, `grow`, `life`, `opacity`, `drag`, `buoy`, `gravity`, `wind`, `stretch` (aligns to its screen motion).
- `fx.spawnStreamer(pos, { life, width, opacity })`: a hairline ribbon carried by the wind.
- `fx.setBanks([{ id, c, ra, rc, hb, ang, dens }])`: up to 8 mist banks (centre, half-length along the wind, half-width, height, wind angle, density); banks not in the list ease out, new ones ease in at 1.1/s.
- `fx.wind.vortex` (`on`, `center`, `radius`, `height`, `swirl`, `inflow`, `lift`, `outflow`, `sDir`, `sAmp`, `veil`, `phase`), `fx.windAt(x, y, z, out)`, `fx.vortexAxis(y, out)`, `fx.coreAt(y)`.
- `fx.mist` (`amount`, `height`, `origin`, `flowSpeed`), `fx.bloom` (the hand's frost flower: `group`, `t`, `fade`), `fx.setLight(i, pos, energy, { rate, color, snap })`, `fx.flashLight(i, pos, energy, decay, color)`, `fx.lightAt(x, y, z, out)`.
- `fx.ring(center, normal, { radius, thick, life, delay, amp })` (refraction only), `fx.impact({ hold, frame: 'center' | 'full' | 'none', flash, shake, shakeMode, fisheye, at })`, `fx.ramp(scale, seconds)`.
- `fx.options`: `flashes` (`'full'` | `'safe'`), `shake`, `fisheye`, `ice` (`'traced'` | `'flat'`, the demo's **Shaded** failure). `fx.debug = 'mist'` renders the mist alone over black. `fx.stats()`.

## The layers, with the numbers that shipped

| layer | numbers |
| --- | --- |
| Frost growth | 11 seed stems (the forward spine plus 10 at ±0.42–3.14 rad, the back ones 0.42–0.7 × as long), 2.6 m/s slowing to 0.7× at the edge, spine 1.1×. Per level: step 24 / 14 / 8 mm, clearance 55 / 10.5 / 6.2 mm, half-width 1.6→0.9 / 1.1→0.5 / 0.5→0.28 mm. Barbs every 18–30 mm on stems (55% paired), sub-barbs every 9–16 mm on barbs, at 0.98–1.12 rad (ice's 60°); barbs 0.25–1.2 × a per-stem 0.16–0.3 m, sub-barbs 12–42 mm. Stems fork every 0.28–0.65 m (p 0.8 inside 88% of the reach) at 0.45–0.8 rad; 5.5% of barbs (2% on the spine) run on as new feathers. A tip dies on its maximum length, the area edge, or a point of another branch within the clearance (a branch leaving its parent ignores the parent). **Then the side branches lean to the tip:** each is rotated about its own root by −0.36 rad (barbs) or −0.28 rad (sub-barbs) toward its stem's tip and shortened by min(1.05, 0.5 + 0.75(1 − the share of its stem already grown)), its children carried with it. Result: 41,610 segments, 14,618 branches, grown in 2.4 s of effect time, 40–65 ms on the CPU. |
| Frost bake | Instanced capsules (radius 45 mm) into a two-target 2048 × 1855 HalfFloat MRT over 10.6 × 9.6 m (5.2 mm texels), each writing depth = its distance so the nearest segment wins. Target A: distance to the centreline, arrival time, direction; target B: half-width, level, seed, arc length modulo 0.5 m (a half float holds 0.2 mm there). |
| Frost on the ground | Coverage by a box filter of the line against the pixel footprint, never under 0.5 px wide (thinner lines dim instead); width × 2 × beads 0.55–1.45 along the line. Fine needles drawn in the shader at 45° toward the tip, 2.8–4 mm apart, reaching 2.2–7.7 mm, only while a pixel is under 1.4–4 mm. Rime e^(−d/3.5 mm) × 0.5 + e^(−d/10 mm) × 0.08. The growth tip blazes e^(−45·\|age\|); fresh frost glows (0.85e^(−1.8 age) + 0.15e^(−0.12 age)). Crystal facets on 2.2 × 1.6 mm cells: 38% mirror the moon (pow 70 × 5) or an ice light; 10% of those blue. A contact shadow 6 mm toward the moon darkens the snow by 0.45. Lit colour (0.86, 0.93, 1) × (3.4 sky + moon (0.8 N·L + 0.45) + 0.55 ice light) × 2.95. |
| Hub and tips | A crust at the seed growing to 0.56 m; a three-layer tangle of short needles (8 / 5.5 / 4 mm cells); 170 instanced crystal clumps (11-plane hulls squashed to 0.45 across, 12–34 mm, up to 1.9× in the middle) each seated on its lowest corner, lit as scattering hoarfrost. Tip stars: the far main arm tips (over 3.2 m from the seed) get a halo of at least 14 px × clamp(6.5/d, 0.35, 1.2) with 10 micro-glints within 0.12 m; near tips get a 3 px glint; 9% of side-branch tips a small blue spark. |
| Ice spikes | 7 clusters 0.95–5.45 m along the spine, main spike height 0.55 + 1.45k^0.9 (k = 0..1 along the line), radius 0.035 + 0.075h, leaning 0.16–0.34 rad forward; 1–3 satellites at 0.32–0.6 × the height, 1.35–1.7 radii out, leaning out 0.38–0.62 rad, never closer than 1.1 rad apart round the foot. Eruption at 0.25 + s/5.2 s (a wave at about 5 m/s), rising over 0.2 + 0.06h s along 1 − (1 − x)^3.2 from under the snow (pixels below y = 0 are discarded). **Hull:** 4–6 side planes at radius × 0.7–1.22, 45% squashed into blades by 0.25–0.55, 1–3 chip planes tilted only upward (a downward tilt sliced the shaft off), 2–4 tip planes at 1.12–1.38 rad round a lopsided apex (±0.18 r), a base plane, and a bevel of 2.2 + 2.2h mm on every edge. |
| Ice shading | Traced in object space: IOR 1.31, Schlick F0 0.02, up to 3 legs with total internal reflection, the ground plane as an exit; Beer–Lambert σ = (3.3, 1.75, 0.78) per metre. What a leg sees is the world pass copied with mipmaps (LOD = rime × 3 + 0.7 per leg), or a sky gradient off-screen. Inside: a Voronoi fracture network (0.1 m cells, edges under 0.04, in patches) sampled at 3 depths of the first leg; the back facets' edges (within 3.5 mm) glow faintly; bubbles in columns (22 × 60 × 22 mm cells, 0.7–3.1 mm); a milky core 0.24r round the axis, hottest low (× (0.25 + 4e^(−5y))). Outside: rime only on edges (1–12 mm) and the foot (25–70 mm), the fracture net as hairlines, facet edges as analytic lines (fwidth) catching the moon at 2.4 + 14 pow(N·H, 6). Inner glow 0.24 + 1.4e^(−3.5 age) + 0.65 × the crack boost, in (0.44, 0.64, 1). Alpha 0 marks ice for FXAA. |
| Cracks and shatter | Four planes per spike: three across the shaft at 16–24%, 37–48% and 63–73% of the height (tilted 0.25–0.7 rad), one down its length; two old fractures frozen in from the start. A crack runs from a surface point to 2.4 radii (0.9 × the height for the long one) as (t/d)^0.7 over 0.32 + 0.12h s: inside, a silver sheet `0.12 + 0.88·graze³` with plumose texture and a bright running front; outside, a jagged hairline. The demo cracks near to far (0.1 s per cluster, 0.05 s per satellite), slows time to 0.55 while they run and snaps back for the burst. **Shatter:** the hull is cut by each crack plane in turn; the piece still in the ground stays as a stump; the rest are launched out (1.6 + 2.2e^(−0.4d) m/s) and up (1.6–3.4), spun 3–9 rad/s. |
| Fragments and rubble | 3 substeps, gravity 9.8, one contact at the lowest hull corner: restitution 0.22 above 0.6 m/s (none at a crawl, which only fed rocking), friction 0.55. A piece sleeps when \|v\| < 0.35 and its surface speed \|ω\|·r < 0.12 for 0.18 s, or after 0.9 s in contact, then tips onto the face nearest the snow over 0.22 s and is pushed out of any other piece (6 mm steps). Melting pieces sink into the snow instead of darkening. Chunks: 3 snow-lump and 2 chip hulls (14–19 random cuts, squashed 0.35–0.8), 6 + 8h lumps of 16–(45 + 25h) mm and 5 + 6h chips of 12–(30 + 15h) mm per spike, living 11–15 s, resting on a face, settled up to about a quarter of their height into the crust and pushed out of spike footprints. Ice chips are lit inside (sky × 7, moon × 1.2, ice light × 0.7) with a moon glint. |
| Snow surface | The scan at a 2 m tile and again at 2.63 m turned 37° (blended by noise), plus a third sample at 0.55 m for sugar grain: its normal × 0.9 and its lightness as albedo 0.78–1.22×. Albedo (0.68, 0.84, 1) × 0.93 × macro variation. **Relief** (shading only; the surface stays y = 0): swells 0.05 m, sharp-crested dunes (1 − \|n\|)² × 0.13 m 2–4 m apart along the wind, a second octave × 0.05, sastrugi × 0.03, choppy crust 0.03 + 0.012, ripples 0.004; the small terms fade as the pixel footprint grows from 12 to 50 mm, and the dunes drop to 0.35× within 1.5–5 m of standing ice (the eruption broke them into crust). A 0.12 m mound follows the ice. Finite-difference normals at max(3 cm, 1.5 px). **Light:** a moon at (0.35, 0.36, −0.86), about 21° up, colour (0.05, 0.062, 0.082) × (2.3 N·L × shadow + 0.04); sky (0.0052, 0.0088, 0.0148) × (1.25 + 0.9 N_y) × (0.6 + 0.4 trough); a 4-step self-shadow march toward the moon at 0.12i² m. |
| Glints | Two populations, scored separately. **Strong:** cells 12 mm × 2^lod (lod keeps a cell about 7 px across), 70% occupied, facet normals tilted 1.1, pow(R·L, 55) × 5 × shadow for the moon and pow 260 for the ice lights, drawn as a Gaussian of variance 1.3 px² in pixel space (the cell centre mapped through the inverse screen Jacobian). **Sugar:** cells 4 mm × 2^lod (2.4 px across), 65% occupied, tilt 1.2, pow 22 × 0.45. 22% are blue (0.45, 0.66, 1); the strong ones fade 45% beyond 25–55 m, the sugar 60% beyond 15–40 m. |
| Mist | **Base layer:** marched at a third of the resolution, 8–16 steps (one per 0.6 m) inside a cylinder of 8.5 m round the seed, warped noise advected along a radial outflow and the vortex's rotation (solid-body inside its core) in two phases crossfaded over 4.5 s; it thins round standing spikes and banks up against them. **Banks** (up to 8): an ellipsoid each, marched over its own span in 10 steps; envelope e^(−1.3e²) × a Gaussian in height, cut to zero between e² 0.9 and 1.6; fibres in (0.38u, 2.6y, 1.7v) warped by 0.9, advected along the wind in two phases crossfaded over 5.6 s; density (0.06 + 0.94·s²) × envelope × 0.2 × dens. Lit by sky × 9 and the moon forward-scattered (0.55 + 1.8 pow(R·L, 2)) × (2.8 + 1.6h), × 1.25, plus the three strongest ice lights × 2.4, tinted (0.64, 0.73, 0.88). White per-pixel jitter, a 5-tap separable blur, a tent-filtered upsample. |
| Blizzard column | Height 3.8 m; core radius 0.75 × (0.3 + 0.85h^1.4); axis −0.22 sin(1.5πh) m sideways (left mid-height, right at the top). Wind: tangential swirl·2r·r_c/(r² + r_c²) at swirl 5.2, dragged to 0.45 at the snow; inflow 2.1 at the foot, lift 3.2 in the core, outflow 0.4 at the top. **Veil:** its own half-resolution pass, 20 steps through the column; a shell at 0.8r_c ± 0.45r_c plus a quarter-strength core; four rope strands `0.15 + 1.6(0.5 + 0.5cos 4(θ − 1.7y − phase))^5`; fibres in helical coordinates (a revolution is 12 units, so the 6-tiling noise wraps seamlessly) torn by a second noise; the far side at 0.25. **Particles:** 11,000 powder points a second on 5 strands (life 0.45–0.9 s, at least 2.2 px, brightness 0.5–3.9 lifted at the foot), 16 chipped flakes a second, 30 hairline streamers a second, a straight streak 1.6 times a second, 110 spray particles a second at the row's ends; anything born in the column fades once it leaves 1.25 × the core × 1.3 (1.15 at the top). Ramps in over 0.1–1.3 s and out over 3.2–4.8 s; the sky dims 30% under it. |
| Hand bloom | A frost flower of 17 dendrites within 72° of the palm's normal, each with 60° side branches and twigs, plus 26 hoar needles: screen-space ribbons 0.75–4 px with a white core and a cyan glow, grown out on its own clock at 0.85 arm lengths a second, glints as strands turn. Vapour off the palm: soft-bodied sprites, 4–10 a second, sinking. |
| Light | 8 point lights eased toward targets (`setLight`, rate 3–6/s) with flashes on top that decay: the bloom, two riding the frost front (0.9 and 0.6), three over the spike groups (0.3 + 0.2h per standing cluster), an eruption flash and a shatter flash. Diffuse 1/(1 + 2.6d²), specular pow(mix(160, 8, rough)) × (1.2 + 8F) / (1 + 0.45d²). Colour (0.5, 0.68, 1): steel blue, not cyan. |
| Sky and treeline | Horizon (0.0115, 0.02, 0.036) to zenith (0.0006, 0.0026, 0.006) over 0–0.62 rad. Two star layers of round Gaussian points on direction grids (300 per radian, 2.2% bright; 520, 4.5% faint), hidden by faint cloud. A forest edge 0.039 ± 0.0045 rad high with rounded crowns (230 per radian, 1.2–4 mrad), anti-aliased by fwidth. |
| Composite | A HalfFloat colour target with a depth texture. World (layer 0) → a mip-mapped copy for the ice → ice (layer 2) → base mist and banks (one third, blurred) → the column veil (half) → light effects (layer 3) → refraction (layer 1, half) → dual-Kawase bloom, 5 levels, **threshold 1.3**, knee 0.6, × 0.26, tint (0.6, 0.74, 1) → ACES → sRGB, grain 0.016, vignette 0.85, into an 8-bit target whose alpha marks ice → FXAA on ice pixels only. Impact frames as in `lightning-energy-skill-vfx` (ink on pale ice-blue paper), at most 3 inverting flashes a second, then a 0.32 dim. |

## Cut a brief into beats

| brief says | call |
| --- | --- |
| frost blooms in the hand and vapour curls | `fx.bloom` grown over 1.6 s at 11 cm, turning slowly, palm-up; light 0 at 0.35 → 2.5; vapour wisps sinking; at 2.45 s it clenches (0.72×) and glints, drops over 2.8–3.3 s, a soft flash and a ring where it lands, and the frost starts there |
| frost races out across the floor | the frost clock runs (fully grown at 2.4 s); lights ride the spine and a second stem; diamond dust kicked up by the front; four mist banks laid where the cold pools; the camera lifts behind and to the side |
| ice spikes erupt along the frost lines | `fx.state.spikeT` from 0: each spike rises at 0.25 + s/5.2 s with lumps, chips, a refraction ring and a flash; the tallest gets a 0.06 s starburst; three spike lights swell; base banks and a plume trailing downwind |
| a blizzard spirals, then calm | `fx.wind.vortex.on` eased in and out; powder, flakes, streamers and spray fed onto the strands; the column veil and five banks; a slow orbit holding the whole column |
| the spikes crack and burst, dust settles | `crackSpike` near to far in slow motion (0.55), then `shatterSpike` on every spike at 1.42 s with a 0.1 s full ink frame, chips, diamond dust and a flash; pieces land and rest; dust glints as it settles while the camera pushes in |

**Between beats, ease.** Every size and intensity a beat sets runs through its own curve; banks ease in and out; replaying the spikes sinks the standing ice back into the snow before it rises again; a new cast melts the last frost and pieces away instead of popping them.

## Rules, each with the failure it prevents

Each rule came from a capture of this demo that went wrong, flagged by the user, a judge or a measurement.

**Measuring**

- **Build a region-stats harness before tuning.** For each shot, split frame and target into regions (sky, treeline, far, mid and near snow, the spike band, each mist zone, the column) and print mean RGB, luminance std, p99/p99.9, mean |Laplacian| and glint blob counts side by side. A judge naming the same four gaps two rounds running ("mist missing", "rope dim", "ice not clear", "ground flat") only moved once every change was driven by closing those numbers.
- **Score glitter on two axes: high-frequency energy and glint count.** One round was "salt noise, too many glints"; after the fix the next was "about 10× too few". The target is dense fine granular sparkle plus a few bright glints. Match the fine energy with a sugar population and the bright count with a separate strong population, and the flip-flop stops.
- **Render the mist alone to calibrate it.** Twice the banks were "still missing" in the frame while existing in the code: too thin, too dim, or undersampled. A debug flag that draws only the mist over black showed each problem at once.
- **The final judge still read surface glints as airborne dots.** Soft 3–5 px round glints evenly spread over the snow read as dust on the lens. Keep strong glints to 1.5–3 px, on lit crests only, and fade them with distance.

**Rendering**

- **No MSAA on a HalfFloat target; use FXAA in the composite.** A multisampled HDR target resolves to blocky garbage. Mark the ice in the 8-bit target's alpha and run FXAA only there, so the frost hairlines and glints stay sharp.
- **March each mist bank over its own span, with white jitter and a small blur.** One march over the union of all banks gave a 1 m plume two samples, so it vanished; a patterned (interleaved-gradient) jitter printed vertical bars and a screen door on the thin mist. Per-bank spans, a hashed jitter, a 5-tap blur and a tent upsample cured both.
- **Band-limit relief to the pixel footprint.** Small dune and ripple terms aliased into horizontal water ripples at grazing distances; fade them as the footprint grows from 12 to 50 mm.
- **Polygon cells read as fish scales.** Voronoi crust domes with flat normals read as cobblestones; the scan's own normal at a small mip-mapped tile reads as snow.
- **Tilt chip planes only upward.** A downward chip plane sliced the whole lower shaft off and left tips floating.
- **Copy shared hull vertices before moving them.** The clipper shares corner objects between faces; recentring a fragment shifted them twice and drew black and white garbage.
- **Glints need a pixel-space spot.** A spot sized in world units stretched into streaks at grazing angles; map the cell centre through the inverse screen Jacobian and draw a Gaussian in pixels.

**Layout and randomness**

- **Never change a shared random stream to restyle a feature.** Changing the barb angles inside the growth reshuffled the generator, moved the spine and moved every spike placed on it. Leaning the barbs as a post-transform about their own roots changed the look without moving anything.
- **Keep the framing the targets were cut from.** Removing the vortex's lean also moved the camera aimed at it and shifted every spike 30 px; pin the camera to the old framing when you change the subject.

**Looks**

- **Frost is a grown tree, not a texture.** Barbs at a fixed angle and spacing read as a fishbone comb; competition in a time-ordered queue packs them into feathers, and the fine needles, beads, rime and glints carry the realism.
- **Traced ice reads as ice; shaded ice reads as plastic.** The **Shaded** switch shows the same facets lit from outside only.
- **Ice glow is white-blue, low, and mostly in the core.** A cyan body glow read as acrylic; keep it in a milky core near the base and let the moonlit edges and refraction carry the rest.
- **No twinkle sprites on tips, no cotton-ball puffs.** Four-point stars on every crystal tip and isolated round mist puffs were called out every time.
- **A blizzard is a column of fine powder, not scribbles.** A dozen fat, opaque streamers crossing at random read as scribbles on the lens. Many hairlines, thousands of soft powder points on a few helical strands, a translucent fibrous veil, and a crown kept within 1.3× the body's width.
- **Pieces rest on a face, buried a little.** Rocks balanced on a corner, chunks floating a few millimetres up and mist cards cutting the ground were all called. Contact is checked numerically for every piece.

## Cost

The cost is fill rate: the ground (relief, self-shadow, two glint loops), the traced ice, and the mist and column marches. Measured with WebGL timer queries at 1440 × 900 and a pixel ratio of 1.5 (2160 × 1350), at a load average of 3.1–4.8:

| sampling | chill | creep | spikes | vortex | shatter |
| --- | --- | --- | --- | --- | --- |
| every 4th frame redrawn 5 times, fastest kept (median / p90) | 5.7 / 8.7 | 5.9 / 9.8 | 5.1 / 7.4 | 5.5 / 8.5 | 5.7 / 8.4 |
| every frame, one query each (median / p90) | 5.7 / 8.8 | 9.7 / 10.7 | 9.9 / 16.3 | 3.9 / 7.6 | 8.7 / 12.7 |

Milliseconds. The second row includes contention from other GPU work on the shared machine; the first is the better estimate of the page's own cost. On the CPU a frame costs about 2–4.5 ms at the blizzard's peak (spawning, 4,000+ particles and their buffers). The demo caps the pixel ratio at 1.5. Growing and baking the frost costs about 50 ms once, at load.

## Lifecycle and accessibility

- `fx.update(realDt)` clamps a step to 0.1 s. Reset your frame clock on `visibilitychange`.
- Under `prefers-reduced-motion: reduce`, the demo holds a composed still (the spikes standing in the frost and the mist) and plays beats only on request, with safe flashes, no shake and no fisheye.
- The demo's interface is minimal: no panels, small text controls over a faint scrim. Switches are real buttons with `aria-pressed`, beats are on keys 1–5 (0 for the full cast), Space pauses, H hides the controls, and changes are announced in a live region. No text renders under 11 px.
- `window.stage` (`play`, `step(dt, n)`, `setPaused`, `setOption`, `fx`, `BEATS`, `clusters`, ...) is there for deterministic headless captures. The portrait camera backs off by (1/aspect)^0.55.

## Verify

- [ ] The frost grows out from where the bloom lands: stems race ahead, barbs open behind them leaning toward the tips, the growth tip blazes and the fresh frost glows, then settles; nothing slides.
- [ ] With **Shaded** on, the spikes are flat tinted plastic; with **Traced**, the snow and sky bend through them, back facets and cracks show inside, and edges catch the moon.
- [ ] Spikes erupt along the frost line in a wave, with lumps and chips settling round the bases; the mist hugs the bases and trails downwind.
- [ ] The blizzard is a column of fine powder on helical strands with a translucent veil, ramping in and out; nothing crosses the frame as a fat streak.
- [ ] Cracks run near to far in slow motion, then every spike bursts along those planes; every piece lands on a face within 1 mm of the snow, none overlap, stumps stay.
- [ ] Fire five inverting hits inside a second with **Full** flashes: the first three invert, and the fourth and fifth dim by 0.32 instead.
- [ ] Reduced motion holds a still with safe flashes. Opened from disk, the page requests only its own files. The console is clean at 1440 × 900 and 390 × 844.
