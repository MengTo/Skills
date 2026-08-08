---
name: falling-leaves
description: Build falling leaves that read as leaves, with each one tumbling on its own axis so it presents a face, thins to an edge, and opens out again, and with its sideways slip driven by that same tumble. Covers the 2-D canvas build and the instanced-3-D variant, where leaves are recycled from, density-versus-count maths, depth layering, colour under a tone-mapped composite, reduced motion, and visibility pausing. Use for autumn maple, sakura petals, blossom, ash, snowfall shapes, or any drifting foliage where a generic particle field reads as confetti.
---

# Falling Leaves

Make the falling thing read as a leaf. Reach for `ambient-section-particles` when you want a bounded atmosphere of generic motes. Reach for this when the shape has to be recognisable.

## Build the tumble first

Turn each leaf about its own long axis so it shows its face, thins to nothing edge-on, then opens out on the other side. That instant of near-disappearance is what the eye reads as "leaf". A sprite that only spins in the picture plane reads as confetti, a coin, or a paper scrap, however good the artwork is.

On 2-D canvas the tumble is a horizontal scale that crosses zero:

```js
ctx.save();
ctx.translate(l.x, l.y);
ctx.rotate(l.roll);              // long axis drifting in-plane
ctx.scale(Math.cos(l.spin), 1);  // the tumble: cos crosses 0, edge-on
ctx.globalAlpha = l.alpha;
ctx.drawImage(sprite, -w / 2, -h / 2, w, h);
ctx.restore();
```

Drive two axes, not one. `roll` turns the leaf within the picture plane; `spin` turns it through the plane. Give each its own rate per leaf, or the motion reads as mechanical however you ease it.

In 3-D, instance **quads**, never point sprites. A point sprite always faces the camera and can never turn away, so it can never go edge-on. That single constraint decides the whole implementation.

## Couple the slip to the tumble

Drive lateral motion from the same angle as the tumble, ninety degrees out of phase. A leaf slides sideways when it knifes through the air edge-on and stalls when it presents its face flat:

```js
l.x += Math.sin(l.spin) * l.slip * dt;   // fastest when cos(spin) ≈ 0
l.y += l.fall * dt;
```

Do not put an independent sine on `x`. It reads as wind or as an easing bug. This coupling costs one term and is what makes the path look aerodynamic.

## Bake both faces

Bake two sprites per colour and pick by the sign of the tumble:

```js
const img = Math.cos(l.spin) < 0 ? sprite.back : sprite.face;
```

Make the back duller and paler than the front. Without this the leaf reads as a flat cut-out spinning; with it, as a solid object with a front and a back. It is the cheapest realism in the system.

## Vary every parameter per leaf

Randomise fall speed, tumble rate, roll rate, slip amount, phase, scale, and opacity at spawn. Share any one of them and the field stops being leaves and becomes a texture scrolling down the screen. The eye finds the common rhythm in about two seconds.

## Choose where leaves come back from

This decides how many leaves are actually on screen.

**In 2-D**, recycle across the viewport. When a leaf passes the bottom, respawn it above the top at a new random x. Wrap x as well, so wind does not empty one side.

**In 3-D**, recycle *ahead of the camera*, not around it. A band centred on the camera spends nearly all its volume behind and beside the frustum; on a 36° camera, a couple of hundred leaves put barely a dozen in frame. Drop them into a disc hung down the camera's own sight line instead and the same count appears several times over:

```js
camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
const cx = camera.position.x + fwd.x * AHEAD;
const cz = camera.position.z + fwd.z * AHEAD;
const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * SPREAD;
l.x = cx + Math.cos(a) * r;  l.z = cz + Math.sin(a) * r;  l.y = camera.position.y + 16;
```

Keep a far wrap as a backstop for a camera that walks out from under its own weather, and put it well outside the fog so nothing is seen to jump.

## Set density by band area, not by count

On-screen density goes as count ÷ band area. Tighten the band before raising the count:

- Halving the recycle radius quadruples on-screen density at the same count.
- Doubling the count doubles draw cost for the same on-screen gain.

Scale an authored count by viewport area rather than taking it literally, or a figure that reads as a drift on desktop arrives as a blizzard on a phone:

```js
const k = clamp(Math.sqrt((W * H) / (1440 * 900)), .5, 1.3);
const n = Math.round(authored * layerShare * k);
```

## Layer for depth

Use two or three layers, each with its own scale, speed, opacity, and blur:

| layer | scale | fall | opacity | note |
| --- | --- | --- | --- | --- |
| far | 0.3–0.5 | slow | 0.22–0.40 | drawn first, may sit behind content |
| mid | 0.5–0.85 | medium | 0.46–0.78 | the body of the effect |
| near | 1.05–1.9 | fast | 0.50–0.82 | few, optionally blurred, drawn over content |

Cross the near layer *in front* of the type. That crossing is the depth cue. Use two or three leaves there, not a curtain.

## Handle colour and light

- Sample each leaf from a small ramp — deep oxblood through vermilion to dry amber — and vary saturation per leaf. One red for every leaf is the giveaway.
- Alpha-test rather than alpha-blend for 3-D leaves so they sort correctly at any angle without a per-frame depth sort.
- **An emissive red comes back out of a tone-mapped composite pink.** If leaves self-illuminate in a dark scene, drive green and blue to zero (`0x780200`, not `0x8c1410`), or the whole fall turns candy-coloured.

## Budget the cost

The per-leaf update is free; a few hundred leaves of trigonometry does not register above a CPU profiler's sampling floor. The cost is fill and draw:

- 2-D canvas: one `drawImage` per leaf. Pre-render the sprite once at the largest size you will draw. Never re-path the leaf per frame.
- 3-D: one `InstancedMesh`, matrices composed into a shared `Matrix4`. Hoist scratch `Matrix4`/`Quaternion`/`Euler`/`Vector3` to module scope.
- Alpha-tested leaves lose early-Z, so they cost more per pixel than their triangle count suggests. Prefer more, smaller leaves to fewer huge ones.

## Stop invisible work

- Pause on `document.hidden` and when the section leaves the viewport (`IntersectionObserver`). Reset `lastTime` on resume so the first frame after does not integrate the whole pause.
- Clamp `dt` to about 1/30 s so a stall does not teleport the field.
- Cap device pixel ratio at 2.
- Size from a `ResizeObserver` on the root element, not from a one-shot measurement at script time. A page laid out later leaves the canvas 0×0 forever, because the resize event it was waiting for has already fired.
- Guard the build against a zero viewport. Controls that wire up by running once reach the builder before first layout and otherwise spawn the whole field stacked at the origin.

## Respect the reader

Under `prefers-reduced-motion: reduce`, render one still, well-composed frame and do not animate. Do not simply hide the leaves; the composition was designed with them in it. Redraw that still when a control changes so the controls still do something.

## Verify

- [ ] Tumble crosses edge-on; leaves visibly thin and vanish once per turn
- [ ] Slip is driven by the tumble angle, not an independent sine
- [ ] Front and back faces differ
- [ ] Every parameter varies per leaf
- [ ] Recycle band is as tight as the composition allows before count goes up
- [ ] 3-D: recycled ahead of the camera, not around it
- [ ] 3-D: emissive reds have green and blue at zero
- [ ] Count scales with viewport area; the readout reports what was actually built
- [ ] Paused when hidden or off-screen; `dt` clamped; DPR capped at 2
- [ ] A designed still frame under reduced motion
- [ ] Console clean at 390px and 1440px
