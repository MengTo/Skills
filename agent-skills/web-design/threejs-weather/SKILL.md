---
name: threejs-weather
description: Put weather into a Three.js scene that reads as weather — rain anchored inside the frustum, a storm that is the rain leaned on rather than a second system, lightning on its own light with thunder scheduled by distance, snow that blows up into blizzards and keeps settling until the ground goes white, wet ground with puddles and splashes, and looping ambience that has no seam. Use for scene atmosphere, seasonal states, hero backdrops, or any world where clear/rain/storm/snow needs to be a control the viewer can turn.
---

# Three.js Weather

Weather fails in two ways: the particles miss the camera entirely, or every state is a separate system that shares nothing. Both are avoidable.

Pairs with `threejs-landscape` for the ground it falls on, and `threejs-towers` for something to fall against.

## Anchor the volume in the frustum

The first version of any rain system puts a world-sized box of particles around the origin and looks empty. With a long lens the camera sees a narrow cone, so almost every drop is off-camera.

Build a small volume and carry it in front of the camera, facing the way the camera faces:

```js
const WX_W = 17, WX_D = 50, WX_TOP = 40;         // narrow, deep, tall
function anchor(o) {
  const fx = -Math.sin(camAz), fz = -Math.cos(camAz);
  o.position.set(cam.position.x + fx * 46, 0, cam.position.z + fz * 46);
  o.rotation.y = camAz;
}
```

Set `frustumCulled = false` on it — you are moving it every frame and the bounding sphere will fight you.

## Float32BufferAttribute copies your array

This one costs an afternoon. The attribute takes a copy of whatever you hand it, so the array you kept a reference to is not the one the GPU reads:

```js
const attr = new THREE.Float32BufferAttribute(pos, 3);
attr.setUsage(THREE.DynamicDrawUsage);
geo.setAttribute('position', attr);
return { pts, pos: attr.array, n };              // keep the attribute's array
```

Symptom: everything is correct, nothing moves, no error anywhere.

## Density is a draw range, not a new buffer

Allocate the worst case once — a full storm, a full blizzard — and thin it by drawing less:

```js
RAIN.geo.setDrawRange(0, Math.round(RAIN.n * density));
```

A storm then costs no more memory than drizzle; it just stops hiding most of the drops. Reallocating buffers when weather changes causes a hitch exactly when the viewer is watching.

## A storm is the rain leaned on

Do not write a second particle system. Take the rain state and push every dial:

| | rain | storm |
|---|---|---|
| drops drawn | 60% of pool | 100% |
| fall speed | ×1.0 | ×1.42 |
| slant | 2.4 | scales with speed² |
| sun | 30% | 14% |
| fog far | ×0.52 | ×0.38 |

Slant should grow faster than speed — `slant = base * v * v` — because that is what sells wind rather than "rain, but quicker".

## Lightning is its own light

Do not modify the time-of-day state to flash. Add a light nobody else touches, so a strike can flash over whatever the sky happens to be doing:

```js
const bolt = new THREE.DirectionalLight(0xe8eeff, 0);
```

One strike is several flashes — a leader and two or three return strokes — each an exponential decay:

```js
function strike() {
  const near = Math.random();                    // 0 distant … 1 close
  const s = 0.42 + near * 0.58;
  pulses = [{ t: 0, a: s }];
  let tt = 0;
  for (let i = 0, n = 1 + (Math.random() * 2.6 | 0); i < n; i++) {
    tt += 0.05 + Math.random() * 0.14;
    pulses.push({ t: tt, a: s * (0.30 + Math.random() * 0.65) });
  }
  setTimeout(() => sfx(near > 0.5 ? 'thunder_near' : 'thunder_far',
                      { gain: 0.30 + near * 0.60 }),
             (0.32 + (1 - near) * 2.7) * 1000);  // sound arrives late
}
function step(dt) {
  let v = 0;
  for (const p of pulses) if (age >= p.t) v += p.a * Math.exp(-(age - p.t) / 0.085);
  bolt.intensity = v * 3.2;
  skyMat.color.setScalar(1 + v * 0.80);          // multiplies the sky map
  flashEl.style.opacity = (v * 0.15).toFixed(3);
}
```

Two details do most of the work. **Thunder is delayed by distance and quieter the longer it takes** — that single correlation is what makes a strike feel far away. And the **DOM flash belongs under the type, not over it**: a full-screen white overlay above your typography washes the page out, so put it directly above the canvas and keep it under about 0.18 opacity.

Reposition the light on every strike. A flash that always comes from the same side stops reading after the second one.

## A blizzard is a slow envelope, not a state

Snow does not fall at one rate forever. Run a cycle — calm, build, blow, ease — and modulate the snow state with it:

```js
const BLIZ = [12, 6, 15, 8];                     // seconds
function blizzardAt(t) {
  let u = t % TOTAL; if (u < 0) u += TOTAL;
  if (u < BLIZ[0]) return 0;
  ...                                            // smoothstep in, hold, out
}
```

During the blow, open the flake pool, thicken the flakes, drive them sideways and pull the fog in. **Reset the phase clock to zero when you leave the snow state**, or arriving in snow drops you into the middle of a whiteout — a negative start offset wraps into the wrong phase and looks like a bug you cannot find.

## Falling snow and settled snow are two variables

The one people forget. Track what has already landed on its own slow timer, rising while snow falls and melting back when the weather turns:

```js
snowPack += (target - snowPack) * (target > snowPack ? dt / 24 : dt / 13);
```

Then let it keep whitening the ground, the stones and the grass for as long as it falls. Arriving in snow and standing in it for a minute should not look the same.

If the surface colour is mixed inside a shader — instanced grass usually is — the material colour cannot reach it. Give that mix its own uniform, and let snow lie on the tips first and work down:

```glsl
gBase = mix(gBase, vec3(0.60, 0.65, 0.72), uSnow * 0.86);
gTip  = mix(gTip,  vec3(0.90, 0.94, 1.00), uSnow);
```

## Re-light only when the slow values move

Relighting the scene is not free, and blizzard strength and snow depth drift continuously. Gate it:

```js
const look = blizK + snowPack;
if (Math.abs(look - lastLook) > 0.006) { lastLook = look; refreshLook(); }
```

That fires a few times a second instead of sixty, and nothing on screen can tell.

## Wet ground

Three cheap things, in order of payoff: drop roughness and add a little metalness so the ground catches the sky; add flat translucent puddle decals in the hollows; then instance a splash ring sprite with a short life, spawned in proportion to rain intensity. The splashes are what make it read as *falling* rain rather than a rain texture.

## Ambience that loops with no seam

Generated audio never loops cleanly. Fold the tail back over the head with an equal-power cross-fade and throw the overlap away — the clip then ends where it starts:

```python
for i in range(f):
    t = i / f
    out[i] = a[i] * sin(t * pi / 2) + a[n - f + i] * cos(t * pi / 2)
```

Fading the clip in and out instead means it dips to silence every lap, which everyone hears and nobody mentions.

Give weather its own gain bus, separate from music, and run the blizzard as a **second layer swelling over the base bed** rather than a cross-fade to a different clip — a hard swap in the middle of a storm is obvious.

## What to check before you call it done

- Watch a single drop from spawn to ground. If you cannot find one, your volume is outside the frustum.
- Leave it in snow for two minutes. The ground should be visibly whiter at the end, and you should have seen at least one blizzard arrive and pass.
- Enter snow from clear five times. It must start calm every time.
- Stand in a storm for a minute. Strikes should come from different sides, and thunder should never land on the flash.
- Profile with the storm running. Particles are cheap; the relight you forgot to gate is not.
