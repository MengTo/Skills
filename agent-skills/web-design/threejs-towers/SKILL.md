---
name: threejs-towers
description: Generate architecture procedurally in Three.js and film it assembling — a small geometry vocabulary that builds pagodas, castles, domes and spires from parameters instead of mesh files, hip roofs with flying eaves driven by a single profile function, and a clipping-plane build animation where everything below a rising line is finished work and scaffolding stands above it. Use for construction studies, architectural title sequences, procedural landmarks, or any hero object that should build itself rather than fade in.
---

# Three.js Towers

Architecture is the one subject where procedural generation pays immediately: buildings are made of repeated, parameterised parts, and once you have the vocabulary a second style costs a parameter set rather than a model.

Stand it in `threejs-landscape` and weather it with `threejs-weather`.

## Build the vocabulary before the building

Write ten small builders that all append into shared vertex/normal/UV/index arrays, then never write raw geometry again:

```txt
face(P, uv)                     quad with a computed normal
box(cx,cy,cz, sx,sy,sz, ry, uvScale, rz)
prism(y0,y1, R0,R1, uv, capTop, capBot)          square on plan
prismN(y0,y1, R0,R1, n, uv, capTop, capBot)      any n-gon
sweepPlan(plan, y0,y1, steps, profile)           an outline scaled up a curve
lathe(cx,cy,cz, y0,y1, profile, steps, seg)      surface of revolution
ring / arc                                        annulus on a face plane
fan(points, z, ry, cx, cy)                        filled polygon on a face
tube(points, r, sides)                            swept tube
```

That set covers a Japanese keep, a Chinese pagoda, an Ottoman dome, a Khmer prasat and a Vietnamese tháp. Each style becomes one assembly function plus a table of levels.

Merge by material, not by part. Six buildings drawn in 11–18 draw calls is the difference between 120fps and 30.

**Winding is the bug you will hit most.** A prism whose side faces are wound inward gets back-face culled and you find yourself looking at the inside of the far wall. Get one prism right, then copy its vertex order everywhere. When a surface goes missing, suspect winding before you suspect anything else.

## Roofs are a function of position along the eave

The whole character of an East Asian roof — flat near the ridge, steepening, then curling up at the corners — comes from one function that maps *(panel, position across, position down)* to a point:

```js
function roofPoint(o, p, u, t) {
  const tc = Math.min(1, t);
  const g = 1 - Math.pow(1 - tc, o.pow);              // the sag of the slope
  const corner = Math.pow(Math.abs(u), 2.0);          // 0 mid-eave, 1 at hips
  const flare = 1 + o.flare * corner * Math.pow(tc, 3.2);
  const y = o.yT - (o.yT - o.yE) * g
          + o.lift * corner * Math.pow(tc, 2.6);      // corners lift
  return [ /* lerp inner edge → outer edge × flare */ ];
}
```

Six numbers give you every roof in the set: `lift`, `tip`, `flare`, `pow`, `trunc`, `ridge`. `trunc` is the one that is easy to miss — it lets a lower roof die cleanly behind the wall above it instead of poking through.

**`Math.pow(negative, 2.35)` is NaN.** Tiles that overshoot the eave push `t` past 1, and the whole roof silently disappears. Clamp `tc = Math.min(1, t)` and handle the overshoot as a separate linear term.

## Non-square plans

`prismN` handles octagons and sixteen-sided drums. For anything with re-entrant corners — a Khmer prasat is a square pushed out on each axis and stepped back twice before the corner — build the outline once and sweep it:

```js
const oct = [[1+P,0],[1+P,0.30],[1.0,0.30],[1.0,0.45],[0.90,0.45], ... ];
const half = oct.concat(oct.slice(0,-1).reverse().map(q => [q[1], q[0]]));
// mirror across the diagonal, then rotate four times
```

Then every storey is the same outline at a smaller scale, and the silhouette is coherent for free.

**Deck the ledges.** Where a storey steps back onto the one above, the gap between the two outlines is open. Fill it with a flat annulus on the plan or the tower reads as a stack of floating shelves with daylight between them.

## Size detail to the surface it sits on

The most common modelling mistake is not the geometry, it is the proportion. A doorway sized for a face that turns out to be a third as wide spills onto the returns and reads as noise. Measure the face first, then size the door, the colonnettes and the pediment as fractions of it — and check that the pediment finishes *under* the cornice rather than through it.

## The build animation is one clipping plane

Everything exists from the first frame. A plane facing down travels up, and every structural material clips against it:

```js
renderer.localClippingEnabled = true;
const CLIP = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
['stone','plaster','tile','timber', ...].forEach(k => {
  MAT[k].clippingPlanes = [CLIP];
  MAT[k].clipShadows = true;                     // or the shadow builds early
});
CLIP.constant = heightAt(t);
```

A clipped shell is hollow, so add a cap mesh at the plane's height, scaled to the footprint. That is what turns a see-through section into what reads as a solid course of masonry.

**The cap has to match the plan it is capping.** A square cap dropped into an octagonal tower leaves four wedges open to the sky. Let each style declare the plan of its own section — four sides through a hall, eight through a drum, sixteen through a dome — and rebuild the cap geometry as the plane passes from one into the next:

```js
caps: [[0, 4.74, 2.56], [4.74, 5.42, 2.02, 8], [5.42, 6.46, 1.86, 16]]
//      y0    y1   radius  sides
```

For interiors, a capped inner volume on a `DoubleSide` dark material reads as solid stone from any angle, and costs almost nothing.

## Scaffolding is the exception to the plane

It ignores the clip, so it always stands one step ahead of the finished work. That single relationship is what makes the animation read as construction rather than as a wipe.

**`BoxGeometry` gives every face UVs of 0..1 regardless of size.** A three-metre pole and a fifteen-centimetre brace therefore get the same grain, and both read as plastic. Rewrite the UVs in world units before upload:

```js
const dims = [[sz,sy],[sz,sy],[sx,sz],[sx,sz],[sx,sy],[sx,sy]];
for (let f = 0; f < 6; f++) {
  const du = dims[f][0], dv = dims[f][1], swap = dv > du;
  for (let i = 0; i < 4; i++) { /* scale by real size, offset randomly */ }
}
```

Grow each tier in with a short eased scale — verticals scale in Y, horizontals in X — and let it fall away just before the next stage lands.

## Stages carry the timeline

Give each style a list of `[local caption, ENGLISH, target height]` and ease the plane between targets. The caption names what is happening, which is most of what makes a construction study legible:

```js
stages: [['準備','READY',0.00], ['石垣普請','STONEWORK',3.36],
         ['柱梁組立','TIMBER',6.24], ['白壁塗籠','PLASTER',8.80], ...]
```

Fire a one-shot sound on each stage change and a bell on the last. Keep the whole build short — four to five seconds — and put a large percentage somewhere quiet in the frame. People will rebuild it repeatedly if it is fast.

## Emissive light leaks

If you light windows at night with an emissive material, that glow escapes through every opening you did not deck: under eaves, through truncated roofs, out of hollow storeys. Deck the truncated roofs and split enclosed volumes onto a non-emissive material. The symptom is a building that glows along its silhouette like a lantern.

## What to check before you call it done

- Orbit a full turn at ground level. Missing walls are inverted winding; long bars flying out of faces are a rotation sign error on face-mounted boxes.
- Scrub the timeline slowly through every stage. The cap should stay inside the walls at every height, and never poke out at the corners.
- Look at the roof from directly above once. Overshooting tiles and NaN panels only show from there.
- Switch styles ten times. If memory climbs, you are not disposing the previous group's geometries.
- Count draw calls per style. If one style is triple the others, a material is not shared.
