---
name: gradient-border-flashlight
description: Add a pointer-driven flashlight across card groups that lights both the surface and the nearest segment of each gradient border, including adjacent cards across gutters. Use for subtle page-wide hover interactions.
---

# Gradient border flashlight

Use one pointer as the light source for a whole group or page. In a gap, the two facing borders should catch the same light. The [working example](demo/index.html) includes functional disclosures so you can check hit testing.

## Build the layers

1. Keep the original corner radius, focus outline and resting border. Paint a quiet linear gradient on a rounded pseudo-element, using a one-pixel inset mask to leave just its perimeter.
2. Put a decorative, absolutely positioned overlay inside each eligible surface. Give it `pointer-events:none`, `aria-hidden="true"` and the same radius. Paint a radial gradient centered at two local CSS variables. A 255 CSS-pixel radius and a pale blue center at about 10% opacity are useful starting values. Keep text legible at peak brightness.
3. Add a second radial gradient to the overlay’s pseudo-element for the rim. Use the same center and radius with a brighter core and a medium-opacity middle. Mask it to a one-pixel ring using two solid mask layers, one clipped to the content box, with `mask-composite:exclude` and a prefixed XOR fallback. Only the portion of the border near the pointer should brighten. Keep the normal border visible when masks or hover are unavailable.

## Track the neighborhood

Listen for pointer movement once at document level. Keep the latest client coordinates and schedule at most one animation frame. Track visible cards with an intersection observer. Read their rectangles together before writing styles. For each card, compute:

```js
const x = pointer.x - rect.left;
const y = pointer.y - rect.top;
const dx = Math.max(0, -x, x - rect.width);
const dy = Math.max(0, -y, y - rect.height);
const lit = Math.hypot(dx, dy) < radius;
```

For nearby cards, write the **unclamped** x and y in CSS pixels. Negative or beyond-edge coordinates make a neighboring card’s border pick up the right part of the gradient. Toggle the overlay’s opacity with a short fade. Recompute after scrolling or resizing under a stationary pointer. Clear on blur, document exit or pointer cancellation. Scope to active dialog surfaces if the page uses modals.

## Review

Move slowly through a narrow gutter and around a rounded corner. Both neighboring rims should respond to the same position. The far edge should remain quiet. Scroll with the pointer stationary and activate a control underneath the glow. Keep a visible keyboard focus outline, skip the decorative layers for touch and forced colors, and remove transition time for reduced motion. [Original treatment in Saltmere](https://threeui.com/saltmere)
