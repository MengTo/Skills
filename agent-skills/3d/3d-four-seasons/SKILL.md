---
name: 3d-four-seasons
description: Add coordinated spring, summer, fall, and winter states to a 3D scene, blending foliage, sunlight, sky, ground materials, snow, and particles without rebuilding the world. Use for seasonal controls, architectural walkthroughs, and outdoor scenes with four-season transitions.
---

# 3D Four Seasons

Keep one recognizable place across all four seasons. Each season should change several mutually consistent visual cues while preserving camera state and interactions.

## Author the seasonal identity

Inventory deciduous trees, evergreens, exposed surfaces, sheltered surfaces, lights, sky, and existing weather. Use species and climate appropriate to the project; the table is a temperate-scene starting point.

| Season | Foliage and ground | Light and atmosphere | Motion |
| --- | --- | --- | --- |
| Spring | Fresh foliage; blossom on appropriate species | Soft warm daylight; gentle haze | Sparse petals or young leaves |
| Summer | Dense deep greens; full ground cover | Stronger daylight; readable shaded greens | Restrained leaf drift and breeze |
| Fall | Species-specific amber, red, and brown; litter | Lower warm sun; golden haze | More falling leaves |
| Winter | Bare deciduous branches; retained evergreens; exposed snow | Cool sky fill; pale sun; warm interiors | Optional sparse snow; little leaf drift |

Choose particle effects only when they serve the scene. A seasonal selector does not require a storm or a full weather simulator.

## Share one state

Use a four-component blend in the order `[spring, summer, fall, winter]`. Accept `autumn` as an alias for `fall`, then normalize to one internal key. The weights start nonnegative and sum to one.

```js
const presets = {
  spring: [1, 0, 0, 0], summer: [0, 1, 0, 0],
  fall: [0, 0, 1, 0], winter: [0, 0, 0, 1],
};
const weights = [0, 1, 0, 0];
let target = presets.summer;
function setSeason(name) {
  const key = name === 'autumn' ? 'fall' : name;
  if (!Object.hasOwn(presets, key)) return false;
  target = presets[key];
  return true;
}
function stepSeason(dt, reducedMotion = false) {
  const a = reducedMotion ? 1 : 1 - Math.exp(-1.4 * Math.min(Math.max(dt, 0), 0.05));
  for (let i = 0; i < 4; i++) weights[i] += (target[i] - weights[i]) * a;
}
```

Feed the same state into material uniforms, sky, sun/fill lighting, particle density, and optional ambient audio. A new selection should redirect the current blend, not queue another animation or reset to summer. Resolve each result from authored base values and weights; repeatedly tinting last frame's color causes drift.

## Change foliage and snow convincingly

Use species-specific color palettes and stable per-instance IDs. Gradually thin deciduous foliage for winter using a deterministic threshold or dither. Preserve evergreen coverage. Apply matching visibility and wind rules to shadow/depth materials so absent leaves do not cast summer shadows.

For inexpensive settled snow, combine winter weight with upward-facing **world-space geometric normals** and an exposure mask:

```text
snow = winterWeight * smoothstep(0.3, 0.85, worldNormal.y) * exposure
```

Blend toward a pale, rough snow material. Upward normal alone also whitens sheltered tables and indoor floors; tag exposed objects or supply shelter masks. A material overlay does not add thickness or change silhouette. Add selective snow-cap geometry only for close-up edges where depth matters. Keep falling snow intensity separate from settled coverage if the scene models accumulation and melt.

## Keep the transition responsive

Preallocate particle pools and reuse materials/geometry. Change uniforms rather than recompiling shaders or rebuilding the world. Preserve existing material hooks when extending shaders and use stable program cache keys; match the installed renderer's shader chunks instead of assuming an old injection point exists.

Keep season independent of time of day and weather. Derive a final lighting state from those inputs once, so several controllers do not overwrite the same sun or fog values. Refresh expensive environment maps at controlled state changes, with caching where possible.

Use keyboard-accessible controls with a visible selected state and updated accessible labels. Under reduced motion, apply the chosen seasonal appearance immediately and retain a composed still scene. Pause continuous animation while hidden.

## Verify

Capture all four seasons from the same camera. Each should be recognizable without its label. Rapidly switch spring → winter → summer → fall mid-transition and check for color drift, stale shadows, allocation spikes, and lost camera controls. Verify snow exposure indoors/outdoors, evergreen retention, particle count, and desktop/mobile rendering.

Read [REFERENCES.md](REFERENCES.md). Seijaku demonstrates shared `uSeason` weights, `setSeason`, `snowInject`, foliage thinning, and seasonal light tinting. Full snowfall physics and climate simulation are extensions, not claims about that implementation.
