---
name: build-threejs-scroll-worlds
description: Build a cinematic landing page as one persistent Three.js world whose camera, atmosphere, DOM story, foreground cut-outs, and chapter navigation transition through multiple scenes as the visitor scrolls. Use when the user asks for a Three.js scroll site, 3D scrollytelling, camera fly-through, multi-scene WebGL landing page, Kage-style world, scroll-controlled story, or a landing page that feels like entering and traveling through one place instead of moving through stacked sections.
---

# Build Three.js Scroll Worlds

Build one world, then let native page scroll move the visitor through it. The canvas persists for the whole page; chapters change the camera, focus, atmosphere, DOM copy, and near-plane foregrounds without replacing the renderer or rebuilding the scene.

This skill is extracted from **Kage — Hidden Realms of Kyoto**. [demo/index.html](demo/index.html) is the approved `kage.html` source itself, unchanged; it is not a reconstruction. Its recreation contract is [demo/PROMPT.md](demo/PROMPT.md), and the architecture is documented in [references/kage-anatomy.md](references/kage-anatomy.md).

## Keep the Kage world in the reference demo

Treat Kage as the acceptance target, not loose inspiration. Preserve the dark Kyoto sanctuary, vermilion moon, centered temple axis, giant foreground KAGE letters, vertical Japanese type, bottom-anchored foliage, muted sage-white typography, thin editorial rules, film grain, and measured motion hierarchy.

Isolate the scroll-world technique by exposing chapter progress, camera position, and active scene. Do not replace the reference with a generic planet, abstract gradient, floating blobs, a dashboard, or a new brand.

When packaging an owned working reference, copy its HTML and runtime assets unchanged before extracting explanations. Do not rebuild a simpler temple, approximate its camera, or restyle its layout for the demo. The skill body generalizes the technique; the demo preserves the proof.

## Know the boundary

- Use `scroll-world-storytelling` when first choosing among video scrub, Three.js, or semantic HTML/data.
- Use `scroll-scrubbed-visual-sequence` for one reversible video or image transformation inside a pinned stage.
- Use `cinematic-scroll-storytelling` for DOM-first GSAP/Lenis editorial choreography.
- Use this skill when **one persistent WebGL place** must contain several chapters and the camera must travel between authored spatial compositions.

## Write the world contract first

Define 4–7 chapters before code:

```js
const chapters = [
  {
    id: "threshold",
    eyebrow: "Chapter 00 / The Hidden Gate",
    title: "Where stillness reveals the unseen.",
    body: "Enter a world whose path is revealed by movement.",
    camera: { p: [0, 4, 14], t: [0, 7, -18], fov: 36 },
    foreground: ["grass", "branch"],
    state: { moon: 1, lanterns: .45, mist: .2 }
  }
];
```

For every chapter decide:

- the story beat and one dominant sentence;
- the camera position, target, and field of view;
- the world landmark revealed from that frame;
- the foreground silhouette entering at the viewport edge;
- the light, fog, particles, and interactive focus state;
- the scroll weight in viewport heights.

Compose the frames at 1440×900 and 390×844 before interpolating between them. A beautiful path through badly framed endpoints is still a broken experience.

## Use one persistent architecture

Keep these layers separate but drive them from one normalized chapter value:

```text
fixed WebGL canvas       far world, temple, moon, lights, weather
fixed DOM foreground     transparent cut-outs at the bottom/edges
scrolling semantic DOM   headings, copy, media, CTA, section height
fixed interface          nav, chapter rail, cursor, status
```

Create the Three.js scene, camera, renderer, world groups, textures, and lights once. Never create one renderer per section. Never swap full canvases at a seam.

## Turn document position into chapter progress

Measure a stable anchor for each `[data-cam]` section after fonts and media settle:

```js
function measure() {
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  anchors = sections.map((el, i) => {
    if (i === 0) return 0;
    if (i === sections.length - 1) return max;
    return Math.min(max, el.offsetTop + el.offsetHeight / 2 - innerHeight / 2);
  });
}

function chapterProgress(y) {
  for (let i = 0; i < anchors.length - 1; i++) {
    if (y <= anchors[i + 1]) {
      return i + (y - anchors[i]) / (anchors[i + 1] - anchors[i]);
    }
  }
  return anchors.length - 1;
}
```

Native `scrollY` is the source of truth. Never derive story state from wheel delta, animation time, or forward-only triggers. The same scroll position must reproduce the same scene when moving forward, backward, or after reload.

## Separate exact progress from cinematic smoothing

Keep two values:

```js
rig.target = chapterProgress(scrollY);           // exact story state
rig.smooth = reduceMotion
  ? rig.target
  : damp(rig.smooth, rig.target, 5.2, dt);       // rendered camera
```

Use `target` for chapter labels, navigation, accessibility, and deterministic state. Use `smooth` only for visual interpolation. Smoothing must never change an endpoint or make the interface report the wrong chapter.

## Author camera waypoints, then interpolate

Store `{ position, target, fov }` for every chapter. Use a Catmull–Rom curve for position and target when the path should feel continuous; use segment interpolation when the world requires hard turns.

On each frame:

1. Sample camera position and target from `rig.smooth`.
2. Interpolate FOV between adjacent chapters.
3. Apply a small aspect-ratio pullback on tall screens.
4. Add only restrained pointer parallax after the framing is correct.
5. Update the projection matrix only when FOV or aspect changes.

Do not point every waypoint at the same center. Each frame should reveal a new spatial relationship: approach, threshold, courtyard, craft, horizon, departure.

## Choreograph the world from the same conductor

Create named state functions instead of scattering magic thresholds through the render loop:

```js
const state = segmentState(rig.smooth);
moon.scale.setScalar(lerp(state.a.moon, state.b.moon, state.t));
lanterns.forEach(light => light.intensity = lerp(state.a.lanterns, state.b.lanterns, state.t));
fog.density = lerp(state.a.fog, state.b.fog, state.t);
```

Let the world remain physically continuous. Reveal a landmark by camera occlusion, light, haze, and depth before reaching for object teleportation. If an object must change, crossfade or transform it over a full segment.

## Treat foreground cut-outs as the near plane

The active chapter's transparent assets must be fully opaque at rest. Anchor them to the bottom or side of the viewport so they behave like scenery close to the lens, not images scrolling inside the section.

When the chapter changes:

1. Lift the incoming stage into one fixed foreground host above the canvas and reading layer.
2. Resolve its parked transform before activating it.
3. Bring pieces in from their anchored edge with staggered transform and opacity.
4. Leave the previous stage in place for about 700–900 ms while it fades and blurs out.
5. Return the retired stage to its semantic section after the transition.

Keep decorative foregrounds `alt=""` and `pointer-events:none`. Use WebP/PNG alpha; never imitate the cut-out with a rectangular image card.

## Reveal text as authored beats

- Keep all essential copy in semantic HTML above the canvas.
- Split display headings by word, preserve the original phrase as the accessible label, and reveal words at 50–80 ms intervals.
- Reveal eyebrow, heading, body, media, and CTA as separate elements.
- Trigger the entrance from the section becoming active; reverse only effects that communicate scene state.
- Keep the reading block still while the camera moves. Do not animate every axis at once.

## Keep the world fast enough to feel physical

- Pin Three.js locally; no CDN dependency in portable demos.
- Cap device pixel ratio at 2 and add a measured quality governor before cutting geometry.
- Share geometries and materials; instance leaves, stones, lights, and repeated architecture.
- Compress photographic plates and foregrounds to WebP/AVIF with alpha when supported.
- Pause the loop on `document.hidden`; clamp `dt` after resuming.
- Render reflection or card cameras only while their section is visible.
- Dispose geometries, materials, textures, render targets, observers, listeners, and animation frames during teardown.
- Keep a composed poster behind the canvas for WebGL failure and loading.

## Preserve access and fallback

- Use native reversible scrolling. Do not intercept the wheel or trap the visitor in a section.
- Keep a real heading hierarchy, links, button labels, visible focus, and a reachable footer.
- On reduced motion, snap to the nearest waypoint, remove stagger and blur, and keep the ordered story in normal document flow.
- On WebGL failure, show the composed reference poster and keep every chapter readable.
- On mobile, pull the camera back, shorten copy, reduce foreground density, and keep the same chapter order.

## Verify the journey, not only the first frame

- [ ] The first frame is recognisably Kage before scrolling
- [ ] One canvas and one scene persist through the whole page
- [ ] Every chapter has a deliberately framed camera endpoint at desktop and mobile
- [ ] Slow, fast, reverse, scrollbar-drag, refresh-at-depth, and anchor-link scroll reproduce the correct state
- [ ] The chapter rail and DOM state follow exact progress, not the damped camera
- [ ] Foreground cut-outs are 100% opaque while active, fixed to the viewport edge, then fade and blur out
- [ ] Headings reveal word by word; supporting elements reveal separately
- [ ] No seam rebuilds the renderer, flashes the poster, or resets the world
- [ ] Reduced motion, WebGL failure, keyboard focus, and the footer remain complete
- [ ] DPR, resize, hidden-tab pause, teardown, local assets, and console are clean

Use the Codex browser for the full pass. Verify 1440×900 and 390×844, then capture a representative frame from the live WebGL demo rather than a mockup.

## Deliver

Return the chapter ledger, camera table, world/layer map, working page, local assets, exact recreation prompt, desktop/mobile evidence, performance notes, and any remaining visual gap against the reference.
