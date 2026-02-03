---
name: css-alpha-masking
description: Apply CSS alpha masking with linear-gradient for horizontal or vertical edge fades (mask-image and -webkit-mask-image). Use when asked for alpha masks, fade edges, or CSS mask gradients.
---

# CSS Alpha Masking Skill

## Workflow
1. Confirm direction (horizontal or vertical) and fade stop percentages.
2. Provide the inline CSS snippet and any needed class usage.
3. Offer small tweaks only (direction, stop positions, colors).

## Usage checklist
- Apply the mask styles directly on the element or in a CSS class.
- Always include both `mask-image` and `-webkit-mask-image` for Safari.
- Ensure the element has visible content; masks reveal/hide alpha only.

## Horizontal (left/right) fade
```css
/* Add this inline CSS to any element */
mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
-webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
```

## Vertical (top/bottom) fade
```css
/* Add this inline CSS to any element */
mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
-webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
```

## Customization knobs
- Direction: `to right`, `to left`, `to bottom`, `to top`.
- Fade depth: adjust `15%` and `85%` stops.
- Strength: change `transparent` to `rgba(0,0,0,0.2)` for softer fades.

## Common pitfalls
- Forgetting the `-webkit-mask-image` fallback in Safari.
- Expecting masks to work on elements with `overflow: hidden` but no visible content behind.

## Questions to ask when specs are missing
- Which direction should the fade go?
- How wide should the fade edges be?
- Is this for images, text, or a container background?
