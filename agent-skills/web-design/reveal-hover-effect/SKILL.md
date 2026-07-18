---
name: reveal-hover-effect
description: Build cursor-following spotlight reveals that expose a second aligned image through a soft radial mask. Use for hover-to-color, before-and-after, x-ray, material, texture, product-detail, and illustrated hero effects where a desaturated or embossed base image should remain visible while another treatment follows an eased pointer.
---

# Reveal Hover Effect

## Core Contract

1. Prepare two images with identical dimensions, composition, crop, and focal point.
2. Keep the base image fully visible.
3. Stack the reveal image directly above it.
4. Apply a feathered radial `mask-image` to the reveal image.
5. Track pointer coordinates in the component's local coordinate space.
6. Ease the rendered position toward the raw pointer with `requestAnimationFrame`.
7. Collapse the mask on pointer exit; never leave a stale spotlight behind.

Default to CSS masks instead of generating a canvas data URL every frame. The CSS version preserves the same look with less allocation and simpler cleanup.

## Motion Defaults

- Desktop spotlight radius: `260px`.
- Compact spotlight radius: `140px` to `220px`.
- Pointer easing: `0.1`.
- Radius easing: `0.14`.
- Mask stops:
  - `0%`: alpha `1`
  - `40%`: alpha `1`
  - `60%`: alpha `0.75`
  - `75%`: alpha `0.4`
  - `88%`: alpha `0.12`
  - `100%`: alpha `0`
- Initial state: base image only.
- Exit state: radius eases back to `0`.
- Cursor: keep the native cursor unless the design explicitly needs a custom one.

## Markup

Use real images so loading, intrinsic sizing, and accessibility remain predictable.

```html
<figure class="reveal-hover" data-reveal-hover data-reveal-radius="260">
  <img
    class="reveal-hover__image reveal-hover__image--base"
    src="/images/product-linework.webp"
    alt="Sculpted product shown in a pale linework treatment"
    width="1600"
    height="1000"
    decoding="async"
  />
  <img
    class="reveal-hover__image reveal-hover__image--overlay"
    src="/images/product-color.webp"
    alt=""
    width="1600"
    height="1000"
    decoding="async"
    aria-hidden="true"
  />
</figure>
```

Keep the overlay decorative when both images communicate the same subject. If the comparison carries unique information, provide visible labels or a separate accessible description.

## CSS Mask

```css
.reveal-hover {
  --reveal-x: 50%;
  --reveal-y: 50%;
  --reveal-radius: 0px;

  position: relative;
  overflow: clip;
  isolation: isolate;
  margin: 0;
  background: #f3f1ec;
  contain: paint;
}

.reveal-hover__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.reveal-hover__image--base {
  position: relative;
  z-index: 0;
}

.reveal-hover__image--overlay {
  position: absolute;
  z-index: 1;
  inset: 0;
  pointer-events: none;
  -webkit-mask-image: radial-gradient(
    circle var(--reveal-radius) at var(--reveal-x) var(--reveal-y),
    rgb(0 0 0 / 1) 0%,
    rgb(0 0 0 / 1) 40%,
    rgb(0 0 0 / 0.75) 60%,
    rgb(0 0 0 / 0.4) 75%,
    rgb(0 0 0 / 0.12) 88%,
    transparent 100%
  );
  mask-image: radial-gradient(
    circle var(--reveal-radius) at var(--reveal-x) var(--reveal-y),
    rgb(0 0 0 / 1) 0%,
    rgb(0 0 0 / 1) 40%,
    rgb(0 0 0 / 0.75) 60%,
    rgb(0 0 0 / 0.4) 75%,
    rgb(0 0 0 / 0.12) 88%,
    transparent 100%
  );
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  will-change: -webkit-mask-image, mask-image;
}

@media (hover: none), (pointer: coarse) {
  .reveal-hover__image--overlay {
    display: none;
  }
}
```

Keep `object-fit` and `object-position` identical on both layers. A one-pixel mismatch becomes obvious inside the spotlight.

## Eased Pointer Tracking

Run the animation loop only while values are changing. Convert `clientX` and `clientY` with `getBoundingClientRect()`; page coordinates will drift after scroll.

```js
function initRevealHover(element) {
  const overlay = element.querySelector(".reveal-hover__image--overlay");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!overlay || !finePointer.matches) return () => {};

  const state = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    radius: 0,
    targetRadius: 0,
    clientX: 0,
    clientY: 0,
    inside: false,
    frame: 0,
  };

  const getRadius = () => {
    const requested = Number.parseFloat(element.dataset.revealRadius);
    if (Number.isFinite(requested)) return requested;
    return Math.min(260, Math.max(140, element.clientWidth * 0.22));
  };

  const updateTarget = (clientX, clientY) => {
    const rect = element.getBoundingClientRect();
    state.clientX = clientX;
    state.clientY = clientY;
    state.targetX = clientX - rect.left;
    state.targetY = clientY - rect.top;
  };

  const schedule = () => {
    if (!state.frame) state.frame = requestAnimationFrame(tick);
  };

  const tick = () => {
    state.frame = 0;

    const positionEase = reduceMotion.matches ? 1 : 0.1;
    const radiusEase = reduceMotion.matches ? 1 : 0.14;

    state.x += (state.targetX - state.x) * positionEase;
    state.y += (state.targetY - state.y) * positionEase;
    state.radius += (state.targetRadius - state.radius) * radiusEase;

    element.style.setProperty("--reveal-x", `${state.x.toFixed(2)}px`);
    element.style.setProperty("--reveal-y", `${state.y.toFixed(2)}px`);
    element.style.setProperty("--reveal-radius", `${state.radius.toFixed(2)}px`);

    const unsettled =
      Math.abs(state.targetX - state.x) > 0.1 ||
      Math.abs(state.targetY - state.y) > 0.1 ||
      Math.abs(state.targetRadius - state.radius) > 0.1;

    if (unsettled) schedule();
  };

  const onPointerEnter = (event) => {
    state.inside = true;
    updateTarget(event.clientX, event.clientY);

    if (state.radius < 0.5) {
      state.x = state.targetX;
      state.y = state.targetY;
    }

    state.targetRadius = getRadius();
    schedule();
  };

  const onPointerMove = (event) => {
    updateTarget(event.clientX, event.clientY);
    schedule();
  };

  const hideReveal = () => {
    state.inside = false;
    state.targetRadius = 0;
    schedule();
  };

  const onViewportChange = () => {
    if (!state.inside) return;
    updateTarget(state.clientX, state.clientY);
    state.targetRadius = getRadius();
    schedule();
  };

  element.addEventListener("pointerenter", onPointerEnter);
  element.addEventListener("pointermove", onPointerMove);
  element.addEventListener("pointerleave", hideReveal);
  element.addEventListener("pointercancel", hideReveal);
  window.addEventListener("blur", hideReveal);
  window.addEventListener("scroll", onViewportChange, { passive: true });

  const resizeObserver = new ResizeObserver(onViewportChange);
  resizeObserver.observe(element);

  return () => {
    if (state.frame) cancelAnimationFrame(state.frame);
    resizeObserver.disconnect();
    element.removeEventListener("pointerenter", onPointerEnter);
    element.removeEventListener("pointermove", onPointerMove);
    element.removeEventListener("pointerleave", hideReveal);
    element.removeEventListener("pointercancel", hideReveal);
    window.removeEventListener("blur", hideReveal);
    window.removeEventListener("scroll", onViewportChange);
  };
}

const revealHoverCleanups = Array.from(
  document.querySelectorAll("[data-reveal-hover]")
).map(initRevealHover);
```

In React, Vue, or Svelte, initialize after mount and call every returned cleanup during unmount. Do not create a new animation loop on every render.

## Optional Grid Parallax

Add a subtle grid only when it supports the art direction.

- Use a `48px` SVG or CSS grid.
- Keep opacity near `0.1`.
- Normalize the eased pointer around the component center.
- Limit drift to `±16px`.
- Ease grid offset with factor `0.06`, slower than the reveal.
- Disable the drift under `prefers-reduced-motion`.

The grid is atmosphere, not the focal interaction. It should barely move.

## Nested Glass or Refraction Cards

When a foreground card must reveal the same alternate treatment:

1. Stack the same base and reveal assets inside the card.
2. Use the same viewport pointer state.
3. Subtract the card's `getBoundingClientRect().left` and `.top` before setting its local mask coordinates.
4. Preserve the card's own crop and border radius.
5. Update the card and hero from the same animation frame so the refraction does not lag.

## Touch and Accessibility

- Default coarse pointers to the static base image.
- If the reveal contains meaningful information, add an explicit “Show alternate” control for touch and keyboard users.
- Do not rely on hover to expose navigation, pricing, instructions, or essential copy.
- Under reduced motion, update the spotlight directly without trailing easing and disable parallax.
- Keep the native cursor visible so the reveal center remains obvious.

## Performance Rules

- Animate CSS custom properties from one `requestAnimationFrame` loop.
- Stop the loop after the pointer and radius settle.
- Do not call `canvas.toDataURL()` every frame.
- Keep both images at the same encoded dimensions and responsive source set.
- Use `will-change` only on the masked overlay.
- Test Safari with both `mask-*` and `-webkit-mask-*`.
- Avoid masking a huge page-sized layer when the effect only occupies one component.

## Quick Checks

- Base and reveal assets remain pixel-aligned at every breakpoint.
- The reveal begins under the pointer rather than sweeping in from the component center.
- The full-strength core holds through `40%` of the radius.
- The feather reaches full transparency at the edge without a visible ring.
- Pointer exit and window blur collapse the mask.
- Scrolling while hovered does not detach the spotlight from the cursor.
- Touch users get a deliberate static or toggle fallback.
- Reduced-motion mode has no trailing movement or grid drift.
- The animation loop stops when idle and cleans up on route changes.
