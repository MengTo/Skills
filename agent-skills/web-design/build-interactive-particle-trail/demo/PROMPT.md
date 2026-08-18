# Interactive Particle Trail Demo Prompts

## Minimal prompt

```text
Use $build-interactive-particle-trail to lift discrete pollen along this pointer path with consistent spacing at any gesture speed.
```

## Recreate the demo

Use `$build-interactive-particle-trail` to recreate **Sylva — Pollen Trace** as a standalone local HTML demo.

- Preserve the grey-green field, low light pool, white Lexend headline, pale field card, ghost wordmark, and procedural root silhouette.
- Show a composed pollen trace on the first screen, then let pointer, pen, or touch movement replace it with a live trail.
- Raycast one interaction plane. Emit every 7 units along the complete traveled segment, cap at 14 motes per frame, and trickle once every 55 ms while idle.
- Recycle a 620-point ring with a 1.6-second lifetime. Store origin, velocity, birth time, size, and phase in dynamic attributes; integrate flight in the vertex shader.
- Add a keyboard-accessible Release pollen button that reuses the same pool for a 52-mote, 2.5× burst and announces the result.
- Reset the previous hit on leave or ray miss.
- Cap DPR at 2, clamp `dt` to 1/30 s, size from `ResizeObserver`, and pause offscreen or hidden.
- Under reduced motion, seed a designed still trail; the button replaces it with a denser still rather than animating.
- Support 390px through 1440px, visible focus, and a clean console.
- Keep dependencies local in `demo/assets/`.

## Remix prompt

```text
Use $build-interactive-particle-trail for a dark indigo astronomy chart where the pointer sheds small amber star grains. Change the subject, palette, type, and composition, but keep distance-based segment emission, the fixed 620-point pool, 1.6-second shader flight, stale-point reset, keyboard burst, reduced-motion still, and lifecycle budgets.
```
