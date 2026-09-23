# Ocean integration reference

All values below come from Pirate Ship Sunset. Units are metres, seconds and linear HDR colour.

## Module API (`assets/ocean.mjs`)

| export | returns | notes |
| --- | --- | --- |
| `WAVE_SPECTRUM` | `[L, A, headingDeg, Q][]` | 8 rows, wind-relative headings |
| `createWaves({ direction, spectrum, gravity })` | `{ list, uPhase, time, offX, offZ, amplitude, steepness, setSeaState, update, disp, height }` | CPU twin of the GPU surface |
| `bakeOceanDetail(THREE, renderer, { size })` | `Texture` | RG micro-normal, B foam lattice, A fbm. Tileable, mipmapped, anisotropy ≤ 8, `NoColorSpace` |
| `createOceanGeometry(THREE, { rings, segments })` | `BufferGeometry` | exponential rings; bounding sphere 1e5 so it is never culled |
| `createOcean(THREE, opts)` | `{ mesh, material, uniforms, setReflection, update, dispose }` | `opts`: `waves, detailTexture, skyCube, sunDirection, hazeGLSL, hazeUniforms, wake, hull`, colours, `fogDensity` |
| `createWake(THREE, renderer, { shipLength, span, resolution })` | `{ rt, uniforms, reset, shift, update, dispose }` | R arms, G stern wash, B calm slick, A Kelvin height |
| `createPlanarReflection(THREE, renderer, { layer, clipBias, resolutionScale })` | `{ target, texture, matrix, camera, setSize, render, dispose }` | mirror camera renders only `layer` |

`hazeGLSL` must define `vec3 oceanHaze(vec3 dir)`. It may declare `uSunDir`; when it does not, the module declares it and uses `sunDirection`. Without `hazeGLSL`, haze is one flat colour, `uHazeColor`, which leaves the hard horizon line described in SKILL.md.

`wake` and `hull` are compiled in through `#define OCEAN_WAKE` and `#define OCEAN_HULL`. Leave them out for open water with no vessel.

Comparison uniforms for demos: `uFootprint` (1 on, 0 off) and `uPixelNormals` (1 per pixel, 0 per vertex). Ship them at 1.

## Frame order

1. `dt = min(realDt, 1/20)`
2. `waves.update(dt)`: phases are wrapped on the CPU
3. Ship buoyancy from `waves.height()` (below)
4. Floating-origin rebase when the ship is more than 1200 m from the origin
5. Camera update. Clamp the camera to at least 2.2 m above `waves.height()` at its position.
6. `ocean.update({ time, camera, ship })`, then `wake.update(...)` with `step = speed·dt`
7. Re-render the sky cube every 0.25 s while the clouds drift
8. `reflection.render(scene, camera)`
9. Main pass into a HalfFloat, 4× MSAA target, then bloom, light shafts and the composite

## Buoyancy (reference constants)

Sample `height()` at 9 hull points in ship space (forward, side): the centre counted twice, (±13, 0), (0, ±4.2), (7, ±3.8) and (−8, ±3.8). Then:

- heave target = weighted mean − 0.05
- pitch target = `atan2(mean(bow three) − mean(stern three), 22) · 0.85`
- roll target = `atan2(mean(port) − mean(starboard), 8) · 0.42 − 0.05`

Drive each with a damped spring, `v += (k·(target − x) − c·v)·dt`, using k, c = heave 5, 3.2; pitch 3.6, 2.6; roll 2, 1.7. Add a small bank into turns: roll −0.8 × turn rate.

## Floating-origin rebase

When `|x|` or `|z|` of the ship passes 1200 m, round the ship position to whole metres `(tx, tz)`. Subtract that from every world-space thing: ship, camera, camera rig origin, wake trail (`wake.shift`), particles and islands. Add it to `waves.offX/offZ`, then call `waves.update(0)` so the phases absorb the shift. The detail and foam scroll offsets divide `offX/offZ` by the same scale they sample at (19, 7.3, 9, 3.3). A mismatched divisor makes the pattern jump at the rebase.

## Hull interaction

`hull.halfWidths` holds the waterline half-width at 36 stations from `zMin` to `zMax` (stern to bow). The reference sampled its procedural hull 0.1 m above the waterline. The shader uses them for:

- a bow hump: `+0.55 · exp(−((lz − (bow − 3))/5)²) · exp(−(out/2.6)²)`
- a shallow trough alongside: `−0.18`, between lz −16 and 12
- a foam band hugging the hull: width `0.55 + 1.5·bowF + 0.8·sternF`, stronger toward the bow, plus a bow wave 3–16 m aft of the stem

The true waterline moves with roll and heave, so the foam band sits on both sides of the static line rather than on it.

## Wake field

The path is a polyline of up to 64 points. The bow sits at index 0, the ship centre at index 1, and a new trail point drops every 3 m travelled. `reset()` lays a straight 120 m trail so the first frame already has a wake. The field is centred 120 m behind the ship because almost all of the wake lies aft. Outside the 380 m square, the sampled wake is 0.

The wake adds Kelvin-height normal perturbation to N (0.9 gain in texel units), lightens the water body with the wash, dims the glitter under the wash (×0.4), and calms the detail normals under the slick (×0.4).

## Post (reference)

- Bloom: 6 mips from half resolution. Prefilter threshold 1.6, knee 0.8, input clamped at 60. Upsample tent with gain 0.62. Composite × 0.35.
- Light shafts: sky-only mask (alpha 0 marks sky) × exp(−5·d²) around the sun at ¼ resolution, two radial passes (28 taps, step 0.034 then 0.011), × 0.55, tint (1, 0.72, 0.45).
- Composite: slight edge chromatic aberration, exposure 0.9, then ACES (RRT/ODT fit). A warm-highlight / cool-shadow grade and a gentle S-curve follow, then a vignette to 0.72, sRGB, and ±0.011 grain.

## Sunset palette (linear)

| uniform | value |
| --- | --- |
| sun direction | normalize(0.66, 0.10, 0.745), about 5.7° elevation |
| `uSunColor` (ocean) | (3.6, 1.9, 0.95) in the scene; module default (4.2, 2.3, 1.1) |
| `uAmbient` | (0.2, 0.15, 0.24) in the scene; module default (0.22, 0.18, 0.28) |
| `uDeep` | (0.006, 0.03, 0.048) |
| `uSSS` | (0.035, 0.3, 0.27) |
| `uFoamCol` | (0.92, 0.9, 0.86) |
| fog density | 2.8e-4 |

A starting point for daylight, not tested in the reference: raise the sun above 30°, cut `uSunColor` to about (2.2, 2.0, 1.8), and set `uDeep` toward (0.004, 0.02, 0.04). Change the palette for the time of day and leave the spectrum, footprint fade, Fresnel and foam as they are.
