---
name: build-lens-raindrops
description: Add camera-space water drops, rain on glass and windshield beads that bend the live scene. Use for a rain-soaked driving camera, a wet intro lens, speed-responsive runoff or a performant WebGL refraction pass.
---

# Build lens raindrops

Start with a moving scene containing one strong contrast edge, such as a lit sign against a dark wall. A convincing bead bends that edge inside its silhouette. To judge the motion, look at a stationary bead and a runner side by side.

[Watch the lens comparison](assets/demo.mp4) or [inspect the taillight detail](assets/demo.jpg). Both sides use the same recorded game frame. The right side runs the two bundled shaders over it. The lower pair magnifies the same region in each render.

## Wire the two passes

1. Finish rendering the 3D scene, including the lights you want refracted, to a sampleable color target. Give it clamp-to-edge sampling. Keep the HUD in a later pass or DOM layer so speed, messages and buttons stay readable.
2. Draw [drop-field.frag](assets/drop-field.frag) on a fullscreen triangle into a separate, linearly filtered RGBA8 target at half the scene's width and height. The red and green channels store biased signed slopes. Blue carries droplet height. Treat this field as linear data, with blending, tone mapping, color conversion and mipmaps off.
3. Draw [refract.frag](assets/refract.frag) to a different target using the scene color and field. Feed both passes a bottom-left-origin `vUv` in [0,1]. Give `uAspect` the scene's width divided by height. In the field pass, set `uFieldSize` to the actual field target size in pixels. Resize targets when viewport or render scale changes. Apply the output color transform once in the host pipeline.
4. Feed `uIntensity` (0–1) and `uPhase` (accumulated animation time) to the field. Feed `uAmount` (0–1) and `uBend` to the composite. Try 0.005 for `uBend` in viewport-height units. Both shaders use WebGL 2. In a node-material pipeline the same stages are a data render target followed by a displaced scene-color lookup.

The sample combines fine pinned beads with larger runners. Per-column timing breaks up parallel movement. Each moving bead has a round head and thinner tail extending upward. Taking differences of the scalar field produces a slope which bends the underlying image. Reversing the UV origin reverses the apparent fall; correct the coordinate convention at the pass boundary.

## Drive it from weather and speed

The game's driving lens used a half-resolution field, a speed ramp between 30 and 240 km/h, and separate wetting and drying rates. Its intro glass had a separate treatment. Adapt those thresholds to the game's actual cruising speed. A slow market drive may need visible drizzle even at idle.

```js
// dt is elapsed simulation time in seconds. Clamp long resume gaps in the host clock.
const speedMix = Math.min(1, Math.max(0, (Math.abs(kmh) - minKmh) / (fullKmh - minKmh)));
const target = exposed ? rainIntensity * (idleWetness + (1 - idleWetness) * speedMix) : 0;
const rate = target > wetness ? 1.2 : 0.35;
wetness += (target - wetness) * -Math.expm1(-rate * dt);
if (target === 0 && wetness < 0.002) wetness = 0;
phase += dt * (0.9 + 2.4 * wetness);
```

Choose `fullKmh > minKmh`; keep rain intensity and idle wetness in [0,1]. Use `wetness` for intensity and `Math.min(1, wetness * 5)` for amount as a starting point. Resume with the current phase when rain returns. At zero, bypass both passes and use the unmodified scene. On a wet menu or stationary window, drive the same inputs from rainfall and elapsed time. For reduced motion, hold the phase or fade out the pass according to the host's preference setting.

## Test the glass

Move a bright line behind a drop. The line should bend locally and remain sharp on the dry glass. Pan the camera; the field should stay attached to the screen. Compare idle, acceleration and shelter, then check the same bead at wide and portrait aspect ratios. Inspect the HUD at peak wetness. On low-end hardware, reduce the field target first and measure GPU frame time. Render a dry frame against the same unprocessed scene and compare their pixels.
