---
name: 3d-underwater-god-rays
description: Add volumetric underwater god rays to a Three.js scene, marching one drifting swell field along every view ray at half resolution so the light shafts converge on the sun, parallax with the camera and carry rippling caustic streaks, with a shimmering surface underside, a sun that wobbles through the ripples, and the same light dappling fish as they swim through the beams. Use for underwater scenes, oceans seen from below, aquariums, reefs, kelp forests, diving and shipwreck scenes, schools of fish, sunbeams or light shafts through water, caustics, "rays of light shining through the ocean", or watery ripples on a background. Includes a reusable module and the Blue Hour sardine-school demo.
---

# 3D Underwater God Rays

Use this when the camera is under the water and the light comes down through it. Reach for a sibling instead in these cases:

- **Sun shafts in air, cut by trees and rooflines:** use `3d-sky-rays`. Its screen-space radial blur of an occlusion mask is the right tool there. It cannot parallax or carry ripples, so under water keep it only as a low companion for fish shadows (Blue Hour runs it at 0.25).
- **The ocean surface seen from above, with a horizon:** use `3d-ultra-realistic-water`.
- **Authored shaft planes through one window in a lit interior:** use `3d-wood-lighting-scorecard`.

Source: extracted from **Blue Hour**, the living-ocean wallpaper of a Three.js iPhone Duo study. A school of 2,200 Blender sardines turns behind a glass device. The light had to read as sun through water across the whole 38 s camera dolly and on the device's own screen.

Verified stack: Three.js r170, WebGL2, GLSL `ShaderMaterial`s, one HalfFloat render target, and a hand-written ACES pass. No post-processing library.

## The mechanism

**Sample one drifting swell field across the sun direction, and integrate it along every view ray.** Each point in the water is lit by the swell value at its position measured perpendicular to the sun. The shafts are therefore parallel columns in the world. They converge on the sun the way rails converge on a vanishing point, and they slide past the fish when the camera moves. Paint the same shafts in screen space and they stay locked to the lens.

## Reuse the working effect

Copy [assets/underwater-light.mjs](assets/underwater-light.mjs). You pass in your own `THREE`, and the module does not import a second copy. [The demo](demo/index.html) runs this same module inside Blue Hour's renderer. `demo/build.mjs` rebuilds it from the Blue Hour sources.

```js
import { createUnderwaterLight, LIGHT_GLSL, WATER_GLSL } from './underwater-light.mjs';

// One uniforms object shared by the water, fish and particle materials.
const uniforms = {
  uSunDirection: { value: new THREE.Vector3(.25, .40, -1).normalize() },   // toward the sun
  uTime: { value: 0 },
  uCameraPosition: { value: camera.position },
  uCameraWorld: { value: camera.matrixWorld },
  uInverseProjection: { value: camera.projectionMatrixInverse },
};
const light = createUnderwaterLight(THREE, { uniforms });   // before creating the materials below
light.setSize(innerWidth * dpr, innerHeight * dpr);          // drawing-buffer pixels, again on resize

// Water: a full-screen quad. Declare uSunDirection, uCameraPosition, uTime,
// uShafts and uShaftTexel, then add ${LIGHT_GLSL}${WATER_GLSL} and in main():
//   vec3 sunRay = ray;
//   color += surfaceUnderside(ray, sunRay);     // also bends sunRay through the ripples
//   ...draw your sun with sunRay...
//   color += underwaterShafts(vUv, ray);
// Fish: declare uSunDirection, then add ${LIGHT_GLSL} and multiply the sun key
// by underwaterDapple(worldPosition, uTime).

// Every frame, in this order:
uniforms.uTime.value = time;
camera.updateMatrixWorld();
light.render(renderer);          // the march, into its own half-resolution target
// then the water, the fish, and one tone map at the end
```

## The numbers that shipped

| layer | constants |
| --- | --- |
| Swell | 4 sines along (.86, .51), (−.42, .91), (.13, −.99), (−.97, −.24) at ×1, 1.23, 0.87, 1.41; drift 0.29, 0.24, 0.19, 0.15 rad/s; domain warp 0.62 |
| Across the sun | scale 1.3, so the main period is about 4.8 world units against a frame about 22 units wide at the school |
| Shaft focus | `smoothstep(−0.05, 1, swell)²`, faded by `exp(−0.012 · distance to the surface along the sun)` |
| Caustic web | the swell again at ×2.6 and 1.35× speed, `(1 − |s|)^5`; light = focus × (0.45 + 0.9·web) |
| March | 26 steps, `t = 4 + 50·f²`, weight `exp(−0.06t)·(0.08 + f)`, divided by the weight sum; a stable per-pixel jitter (interleaved gradient noise) instead of temporal noise |
| Sun blend | `total = mix(total, 0.16, μ^28)`, where μ = ray·sun |
| Phase | `0.7 + 1.1μ^5 + 0.9μ^40`; rays below the horizon × `mix(0.45, 1, smoothstep(−0.45, 0.35, ray.y))` |
| Gain | (0.16, 0.40, 0.47) × 3.6, linear HDR, tone-mapped once at the end |
| Buffer | 0.5 × the drawing buffer, HalfFloat, single-sampled (the march is soft, so MSAA buys nothing), upsampled with a 4-tap tent at ½ texel |
| Surface underside | plane at y = 12; network `(1 − |swell(1.15s, 1.6t)|)^8·0.75 + (1 − |swell(2.19s, 2.1t)|)^10·0.55`; fog `exp(−0.028d)`; detail faded by `1 − smoothstep(0.35, 1.6, 0.9·|fwidth(s)|)`; colour (0.098, 0.221, 0.26); sun ray bent by 0.018 × the ripple slope |
| Fish | sun key × `0.62 + 1.5 · shaftLight` |
| The rest of the frame | sun corona halved to (0.043, 0.095, 0.123)·μ^48; screen-space ray pass cut from 0.82 to 0.25 |

## Rules, each with the failure it prevents

These came from A/B renders of the Blue Hour frame: the same camera, the same frozen fish, one change at a time.

- **Shape the swell into sparse peaks, not ridges.** `1 − |swell|` makes a web of thin sheets, and a ray that crosses many sheets averages them into flat haze. On a frozen frame the ridge web raised the mean brightness of the water by 20% and halved the contrast between pixel columns, from 0.247 to 0.118. The demo's **Ridge web** switch shows it.
- **Start the march 4 units out.** Starting at 1.5 units, a shaft passing over the camera filled a quarter of the frame with one bright wedge. Weight the samples by `exp(−0.06t)`: the near ones smear least, so they hold the beam edges.
- **Merge the shafts into the sun's glow as the ray points at it.** Looking straight up one column, the integral is a single swell value. Where the camera sat between shafts, that left a dark hole on the sun. `mix(total, 0.16, μ^28)` closes it.
- **Integrate the caustic web inside the march.** Sampled 4 times at full resolution instead, the web reads as a pool floor painted over the water. Inside the 26-step march at half resolution, it becomes fine streaks that run along each beam. The demo's **Painted on screen** switch shows it.
- **Turn down any uniform glow already in the frame.** Blue Hour's corona and screen-space ray pass lit the top of the frame evenly. The first shafts barely showed in the composite at about the gain that later shipped. They read only after the corona was halved and the radial pass cut from 0.82 to 0.25, so the shafts carry the light and the gaps stay dark.
- **Judge the gain on the composed page, not the raw canvas.** Gain 2.2 looked right on the canvas. On the page, where the canvas sits at 82% opacity under a darkening CSS shade, the same frame showed almost nothing. 3.6 survives the page.
- **Lift the sun above the top edge for full-frame beams.** At 21° the sun sits in frame: the convergence point is a glow and the beams are short. Between 30° and 44° it clears the top edge, and the beams fan down the whole frame. The demo's **Sun** slider sweeps it.
- **Declare each uniform once per shader.** `LIGHT_GLSL` declares its own uniforms (`uSurfaceY`, `uShaftScale`, `uShaftFloor`, `uCompare`) and expects the host to declare `uSunDirection` before it. Declaring one twice is a compile error, and the material quietly draws nothing.

## Cost

Under heavy machine load (load average about 60), headless Chrome on ANGLE Metal rendered the whole Blue Hour frame in 6–10 ms at 2048×1440. That frame includes 2,200 instanced sardines, the water, the 1024×720 march, the screen-space ray pass and the tone map. Skipping the march changed the median by less than the run-to-run noise (about ±2 ms) across 5 alternating rounds of 20 frames, so it is not the bottleneck here. If it shows up in your profile, lower the buffer scale or the step count. The shafts are low frequency, so both mostly cost softness, but measure that before you rely on it.

## Lifecycle and accessibility

- Step the simulation at 30 fps, with each step capped at 0.1 s. Blue Hour renders the aquarium into a fixed 2048×1440 canvas (1600×1125 below 800 px) and cover-fits it, so the march cost doesn't scale with the screen.
- Under `prefers-reduced-motion: reduce`, hold the frame at t = 0 and re-render only when a control changes. The jitter is stable per pixel, so a still frame doesn't crawl.
- Stop on `document.hidden`, and reset the frame clock on `visibilitychange` so the first frame back doesn't integrate the whole pause.

## Verify

- [ ] Orbit the camera: the shafts slide against the fish and still converge on the sun. If they move with the lens, they are painted in screen space.
- [ ] With **Ridge web** on, the water turns to haze. Back on sparse peaks, you see distinct beams with dark water between them.
- [ ] With **Painted on screen** on, a pool-floor web covers the water. Inside the march, fine streaks run along each beam.
- [ ] Looking straight at the sun, there is no dark hole.
- [ ] Sweep the sun from 21° to 44°: the convergence point moves off the top edge, and the beams lengthen across the frame.
- [ ] A fish crossing a beam brightens and dims again past it.
- [ ] Reduced motion holds a composed still, the controls still re-render it, and the console is clean at 1440×900 and 390×844.
