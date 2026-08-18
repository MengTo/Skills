# Wireframe Scan Reveal Demo Prompts

## Minimal prompt

```text
Use $build-wireframe-scan-reveal to introduce this Three.js form with a topology cage that reaches each region before the solid surface.
```

## Recreate the demo

Use `$build-wireframe-scan-reveal` to recreate **Sylva — Survey Pulse** as a standalone local HTML demo.

- Preserve the grey-green field, low light pool, white Lexend headline, pale field card, ghost wordmark, and procedural root silhouette.
- Put the mechanism on the first screen. Start the 3.4-second scan on load and expose a keyboard-accessible Replay scan button.
- Build the root from Three.js tube geometry. Pair its solid mesh with a temporary line cage derived from the same geometry.
- Drive both materials from one world-space origin and radius. Use the 520-unit solid lag, 36/17-unit wobble, 135-unit rim, 950-unit trail, power-1.35 easing, and final wire burn-off from the Skill.
- Dispose the cage after completion. Replaying must rebuild one cage, never stack copies.
- Cap DPR at 2, clamp `dt` to 1/30 s, size from `ResizeObserver`, and pause offscreen or hidden.
- Under reduced motion, show a composed 62% diagnostic still and keep Replay functional as a state reset.
- Support 390px through 1440px, visible focus, live status, and a clean console.
- Keep dependencies local in `demo/assets/`.

## Remix prompt

```text
Use $build-wireframe-scan-reveal for a warm ivory archaeological exhibit: reveal a terracotta vessel from a low-right survey origin, with charcoal topology and rust solid material. Change the subject, palette, type, and composition, but keep the paired world-space representations, 3.4-second conductor, solid lag, irregular front, temporary cage disposal, reduced-motion still, and lifecycle budgets.
```
