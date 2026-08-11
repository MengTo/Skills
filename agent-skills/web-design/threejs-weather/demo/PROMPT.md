# Three.js Weather Demo Prompts

## Minimal prompt

```text
Use $threejs-weather to add rain and a storm to this Three.js scene, with the drops anchored inside the frustum rather than scattered over the world.
```

## Recreate the demo

Use `$threejs-weather` to build **Four Weathers Over One Field** as a single standalone HTML document. Treat `index.html` as the behaviour, motion and performance reference.

### Experience

- One landscape, four states on a single control: clear, rain, storm, snow.
- The storm is visibly the rain state pushed harder — more drops, falling faster, slanting further — not a different-looking system.
- Lightning strikes on its own schedule. Each strike is several flashes over about a fifth of a second, from a different direction each time, and the sky flashes with it.
- Snow arrives calm, blows up into a blizzard after a while, and eases off again. Standing in it for a minute leaves the ground visibly whiter than when you arrived.

### Implementation contract

- One fixed pool per precipitation type, sized against the frustum, thinned with `setDrawRange` rather than reallocated.
- Keep the attribute's own array (`attr.array`), never the array you passed to `Float32BufferAttribute`.
- The particle volume is anchored ahead of the camera and rotated to face it, with `frustumCulled = false`.
- Lightning is a dedicated light plus a DOM flash layer *under* the typography, never a change to the time-of-day state.
- Falling snow and settled snow are separate variables on separate clocks.
- Anything whose colour is mixed inside a shader gets a uniform for the snow, because the material colour cannot reach it.
- Re-light only when the slow values have actually moved.

## Remix prompts

```text
Use $threejs-weather but make it fog and drizzle only — no lightning — and have the fog thicken and thin on a slow cycle.
```

```text
Use $threejs-weather and add hail: heavier than rain, bouncing once off the ground, with a shorter and harder sound.
```
