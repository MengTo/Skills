# Mouse-Driven Orbit Demo Prompts

## Minimal prompt

```text
Use $add-mouse-driven-orbit to give this Three.js hero restrained pointer depth without turning it into a draggable product viewer.
```

## Recreate the demo

Use `$add-mouse-driven-orbit` to recreate **Sylva — Living Orbit** as a standalone local HTML demo.

- Preserve the grey-green field, low light pool, white Lexend headline, pale field card, ghost wordmark, and procedural root silhouette.
- Build the complete centered composition first. Pointer motion must be an enhancement.
- Record one normalized pointer target, damp it with the 0.055-at-60-Hz equivalent, and split it across camera translation, a 42% carried look-at, 0.055/0.026-radian near-root rotation, and 0.030-radian far-layer yaw.
- Ignore touch pointer movement and return smoothly to center on pointer leave.
- Add keyboard-operable Horizontal and Vertical range controls plus a Motion button. Announce changes in a live region.
- Avoid layout reads in `pointermove`; cache dimensions via `ResizeObserver`.
- Cap DPR at 2, clamp `dt` to 1/30 s, and pause offscreen or hidden.
- Under reduced motion, show the designed `x=.28, y=-.12` three-quarter still; let the range controls select other still poses without easing.
- Support 390px through 1440px, visible focus, and a clean console.
- Keep dependencies local in `demo/assets/`.

## Remix prompt

```text
Use $add-mouse-driven-orbit for a pale museum plinth holding a cobalt ceramic form. Change the subject, palette, type, and composition, but keep the centered base pose, one damped normalized target, split camera/object motion, pointer-leave return, touch-safe center state, keyboard pose controls, reduced-motion still, and lifecycle budgets.
```
