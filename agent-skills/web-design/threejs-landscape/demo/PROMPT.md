# Three.js Landscape Demo Prompts

## Minimal prompt

```text
Use $threejs-landscape to put this scene in a real place: a noise heightfield, instanced grass, a gradient sky, and morning/noon/sunset/night that cross-fade.
```

## Recreate the demo

Use `$threejs-landscape` to build **A Place To Stand Something In** as a single standalone HTML document. Treat `index.html` as the visual, motion and performance reference.

### Experience

- A grass plain running to soft landforms on the horizon, under a six-stop sky.
- Drag to orbit, wheel or pinch to zoom. The grass stays dense wherever the camera looks.
- Four times of day on one control, each cross-fading rather than cutting, with stars appearing at night.
- A grid toggle that reveals the polar heightfield underneath, so the structure is legible.

### Implementation contract

- Terrain sampled on a polar grid centred under the camera, radial rings spaced by a power curve so every ring covers about the same number of pixels.
- Domain-warp the noise before layering octaves.
- Ground colour computed from slope, height and moisture. No ground texture, no UVs.
- Grass is one instanced ribbon shaped entirely in the vertex shader, carried in front of the lens as a patch, with its blades fading out at the patch rim.
- Stars confined to the elevation band the camera can reach, in three size classes, with point size scaled by devicePixelRatio.
- Times of day are full states interpolated together; switching mid-transition freezes the current interpolated look as the new start.

## Remix prompts

```text
Use $threejs-landscape but make it a coastal version: wet sand, tide line, and marram grass in clumps rather than an even field.
```

```text
Use $threejs-landscape and add a slow camera dolly that follows the terrain height, keeping the horizon steady.
```
