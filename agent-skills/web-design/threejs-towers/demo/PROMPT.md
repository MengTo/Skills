# Three.js Towers Demo Prompts

## Minimal prompt

```text
Use $threejs-towers to generate a tower procedurally and film it assembling behind a rising clip plane, with scaffolding standing above the line.
```

## Recreate the demo

Use `$threejs-towers` to build **A Building That Builds Itself** as a single standalone HTML document. Treat `index.html` as the geometry, motion and performance reference.

### Experience

- A tower assembles from the ground up in about four and a half seconds, then holds.
- Everything below the rising line is finished work; the scaffolding for the next stage is always standing above it.
- A caption names the stage as it passes, and a large percentage sits quietly in the corner.
- A style control swaps a castle keep for a five-tier pagoda. Both are the same primitives with different parameters.
- Scrub the timeline to sit anywhere in the build. Drag to orbit.

### Implementation contract

- A small geometry vocabulary — face, box, n-gon prism, swept plan, lathe — and nothing else. No mesh files.
- Roofs come from one function of position along the eave, with lift, tip, flare, truncation and ridge as its parameters. Clamp before any `Math.pow`, or an overshooting tile returns NaN and the roof vanishes.
- One `THREE.Plane`; every structural material clips against it with `clipShadows` on.
- A cap mesh at the plane's height, its plan matching what is being cut.
- Scaffolding is the only thing that ignores the plane, and its box UVs are rewritten in world units so a long pole and a short brace do not share a grain.
- Merge by material. Count draw calls, not triangles.

## Remix prompts

```text
Use $threejs-towers but build a lighthouse: a tapered tower, a gallery, and a lantern room that lights when the build completes.
```

```text
Use $threejs-towers and drive the clip plane from scroll position instead of a timeline, so the building assembles as the page moves.
```
