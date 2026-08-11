---
name: threejs-landscape
description: Build a live Three.js landscape that stays quiet behind a subject — a noise heightfield on a polar grid so resolution follows the lens, ground coloured by slope and moisture rather than by texture, instanced GPU grass whose wind costs nothing on the CPU, scattered stones, a gradient sky dome, a star field you can actually see, and a time-of-day system that cross-fades instead of cutting. Use for hero backdrops, product stages, scroll worlds, or any scene where a building, object, or figure has to sit in a place rather than float on a gradient.
---

# Three.js Landscape

A backdrop has one job: make the subject look like it is somewhere. Everything here is chosen so the landscape reads at a glance and then gets out of the way.

Reach for `threejs-weather` to put rain, storm or snow on top of it, and `threejs-towers` when the subject standing in it is architecture.

## Ring the camera with a polar grid

Do not build a square heightfield. A long lens sees a narrow wedge, so a square grid spends most of its triangles behind the camera and still runs out of resolution at the horizon.

Sample on a polar grid centred under the camera, with radial rings that get further apart as they recede:

```js
const AN = 900, RN = 52, R0 = 2.0, R1 = 700;   // angular, radial, near, far
for (let r = 0; r <= RN; r++) {
  const t = r / RN;
  const rad = R0 + (R1 - R0) * Math.pow(t, 2.4);   // dense near, sparse far
  for (let a = 0; a < AN; a++) {
    const th = a / AN * Math.PI * 2;
    push(Math.cos(th) * rad, landH(x, z), Math.sin(th) * rad);
  }
}
```

Two thousand triangles near the subject beat two hundred thousand spread evenly. `pow(t, 2.4)` is the whole trick: every ring covers roughly the same number of screen pixels.

**Watch the winding.** On a polar grid it is easy to wind every quad the wrong way and end up looking at the sky through the ground. Index as `(a0, b1, b0, a0, a1, b1)` and check by orbiting under the horizon once, deliberately, before you build anything else on top.

## Warp the domain before you layer octaves

Plain fBm reads as crumpled paper. Warping the sample position with another noise field before you evaluate it is the single biggest step toward terrain that looks eroded:

```js
function landH(x, z) {
  const wx = x + fbm(x * 0.012, z * 0.012, 3) * 26;   // domain warp
  const wz = z + fbm(x * 0.012 + 41, z * 0.012 - 17, 3) * 26;
  let h = fbm(wx * 0.0075, wz * 0.0075, 5) * 34;      // broad landforms
  h += ridged(wx * 0.021, wz * 0.021, 3) * 9;         // ridge lines
  return h;
}
```

Keep the analytic function separate from the mesh. Grass, stones, fog and anything else you scatter must sample the same `landH`, or they will float and sink.

Ridge layers have to scale with distance. A ridge amplitude that reads well at 40 units is invisible at 600, so the far rings need theirs multiplied up or the horizon goes flat.

## Colour by what the ground is doing, not by a texture

A tiled ground texture always announces itself. Compute a vertex colour from the terrain's own properties instead:

```js
const slope = 1 - normal.y;                      // steep = rock
const moist = smoothstep(-4, 6, -height);        // low = wet, green
const c = rock.clone()
  .lerp(grass, (1 - slope * 3.2) * (0.35 + moist * 0.65))
  .lerp(sand, Math.max(0, 0.5 - moist) * 0.6);
```

You get cliffs that go stony, hollows that go green and ridges that go pale, for free, with no UVs and no seams. Keep a very low-frequency noise on top so the colour does not band.

## Grass: one ribbon, shaped entirely in the vertex shader

100k blades is a single `InstancedMesh` of a five-segment ribbon. Every bend, lean, taper and gust happens in the vertex shader, so the wind costs nothing on the CPU:

```js
const geo = new THREE.BufferGeometry();          // 11 verts: a strip + a tip
const mesh = new THREE.InstancedMesh(geo, mat, 104000);
mat.onBeforeCompile = sh => {
  Object.assign(sh.uniforms, grassUni);
  sh.vertexShader = `
    uniform float uTime, uWindAmp; uniform vec2 uWind;
    attribute vec4 aParams;                      // height, phase, tint, lean
    varying float vT; varying float vTint;
  ` + sh.vertexShader.replace('#include <begin_vertex>', `
    float gT = position.y;                       // 0 at root, 1 at tip
    float gBend = uRestBend + sin(uTime * 1.7 + aParams.y) * uWindAmp;
    vec2  gRib  = ... ;                          // sweep the blade along an arc
    vec3 transformed = vec3(gRib.x, gT * aParams.x, gRib.y);
  `);
};
mat.customProgramCacheKey = () => 'grass';       // or every instance recompiles
```

Anchor the field to the camera. Keep a fixed grid of blades around the viewer and move the *grid*, snapping to cell size, rather than growing the field outward. The player never reaches the edge and you never pay for grass behind them.

**Do not hard-code the blade colour in the fragment shader and then expect the material colour to change it.** `diffuseColor.rgb *= mix(base, tip, t)` multiplies whatever the material gave you, so a white material times a green constant is still green. If anything — settled snow, a season, a night palette — has to recolour the grass, that mix needs its own uniform. This costs an hour to find because every debug print says the material is white.

## Stones from the same height function

Scatter with rejection sampling against slope, then `setMatrixAt` on an `InstancedMesh`. Weld the icosphere and scale it flat so they read as embedded rather than dropped:

```js
geo.scale(1, 0.62, 1); geo.translate(0, 0.3, 0);   // sunk, not resting
```

A few thousand at three or four sizes is enough. They matter most near the subject, where they give the eye something to measure scale against.

## Sky: six stops on an 8×512 canvas

Paint a vertical gradient into a tiny canvas and map it to a back-side sphere. Repainting it is so cheap you can do it every frame of a transition:

```js
const grd = ctx.createLinearGradient(0, 0, 0, 512);
[0, 0.30, 0.52, 0.68, 0.84, 1].forEach((s, i) => grd.addColorStop(s, cols[i]));
ctx.fillStyle = grd; ctx.fillRect(0, 0, 8, 512);
skyMat.map.needsUpdate = true;
```

Six stops is the number. Three gives you a CSS gradient; ten and you cannot tune it. Put the horizon stop slightly *below* the geometric horizon so the fog colour and the sky meet without a visible line.

## Stars: confine them to the band the camera can reach

The mistake is scattering over the whole sphere. With a ~10° lens the frame sees about 0.5% of it, so 1,200 stars puts roughly six on screen and reads as a bug.

- Confine to the elevation band your camera clamp actually allows.
- Use three size classes with different point sizes so brightness varies.
- Scale `PointsMaterial.size` by `devicePixelRatio` or they vanish on retina.
- Additive blending, `sizeAttenuation: false`, `fog: false`, `depthWrite: false`.

Around 39,000 points across three classes gives a sky that reads as stars rather than as noise. It costs one draw call each.

## Time of day is interpolation, not a switch

Store each time of day as a full state — sun position and colour, hemisphere, ambient, fill, rim, fog colour and range, ground, grass, six sky stops, shadow strength, star opacity — and lerp between two of them:

```js
function applyState(A, B, t) {
  key.position.setFromSpherical(lerpAngle(A.sun, B.sun, t));
  key.color.copy(A.sunC).clone().lerp(B.sunC, t);
  scene.fog.color.copy(A.fog).lerp(B.fog, t);
  for (let i = 0; i < 6; i++) CUR.sky[i].copy(A.sky[i]).lerp(B.sky[i], t);
  paintSky(CUR.sky);
}
```

When the user switches mid-transition, freeze the *current interpolated* state as the new `A` rather than snapping to the last preset. Otherwise every impatient click jumps.

Keep weather as a multiplier layered on top of this, never as more presets. Four times of day × four weathers is four states and four modifiers, not sixteen.

## What to check before you call it done

- Orbit below the horizon once. If you can see the sky through the ground, your winding is inverted.
- Look at the far ring. If the terrain is flat out there, your ridge amplitude is not scaling with distance.
- Switch time of day mid-transition twice in a row. It should never jump.
- Check on a retina display. Stars and thin geometry are where DPR bugs show first.
- Watch the draw call count, not the triangle count. 1.3M triangles in 18 calls runs at 120fps; 200k triangles in 900 calls does not.
