---
name: build-customer-story-cards
description: Build or adapt equal-height customer-story card grids with fixed landscape artwork, animated noise, pointer glow, restrained hover wisps, pinned read-time and CTA placement, and no image scaling. Use for customer outcomes, case-study teasers, testimonial story cards, or editorial customer grids; use a generic article-card pattern when equal rows and customer-proof artwork are not central.
---

# Build Customer Story Cards

The mechanism is a fixed `3 / 2` story cover followed by an equal-height flex body whose metadata is pushed to the bottom before the CTA; surface noise and pointer light add tactility without changing the artwork's scale.

## Preserve the card contract

- Use one semantic link per card. Keep the full card clickable and give it visible keyboard focus.
- Use a `3 / 2` media region and an equal body height of about `18.5rem` at desktop. Let the body become content-sized in the single-column mobile layout.
- Order body content as title, description, read time, CTA. Put `margin-top: auto` on the metadata so the read time and CTA align across unequal copy.
- Show only the read time when compact metadata is requested. Do not reintroduce date or image-count labels unless the content requires them.
- Keep the image at `transform: none` in idle, hover, and focus-visible states. A generic article-card hover selector often reintroduces `scale(1.035)`; override all three states locally.
- Round the outer shell and clip every decorative layer with the inherited radius. Do not wrap the cards in another visible container.

## Layer the surface

Use this stacking order:

1. Shell background and border.
2. Low-resolution animated noise canvas at `z-index: 1`.
3. Pointer-positioned indigo radial glow at `z-index: 2`.
4. Hover-only wisp canvas at `z-index: 3`.
5. Media and body content at `z-index: 4`.

If the noise or wisps sit above the text, legibility collapses. If the glow sits below an opaque background, the hover appears broken.

Start with these landed values:

| Parameter | Default | Failure prevented |
| --- | ---: | --- |
| Desktop columns | `3` | Portrait cards becoming too narrow or a sparse two-column row |
| Grid gap | `16-22 px` | Cards touching or losing visual grouping |
| Outer radius | `12 px` | White image corners leaking beyond the shell |
| Body height | `296 px` | CTA rows drifting with title length |
| Noise resolution | `0.72x`, `0.48x` low-power | Full-resolution canvas cost with no visible gain |
| Noise cadence | `12 fps`, `8 fps` low-power | Static texture or wasteful 60 fps grain |
| Wisp count | `clamp(16, area / 4200, 34)` | Sparse dust or opaque particle fog |
| Wisp speed | `14-60 px/s` | Frozen specks or frantic streaks |
| Wisp DPR | `min(devicePixelRatio, 2)` | Excess mobile backing-store cost |
| Frame delta cap | `0.05 s` | Long trails after a paused tab resumes |
| CTA radius | `8 px` | Inconsistent button corners |

For the content model, React ordering, canvas budgets, and scoped CSS selectors, read [references/implementation.md](references/implementation.md).

## Interaction rules

- Track pointer position on the semantic card and feed only the glow center. Do not translate or scale the shell.
- Mount or animate wisps only while hovered or focused. Twenty always-running canvases waste memory and fill rate.
- Let image hover change saturation or brightness only. Keep its transform `none` and transition only `filter`.
- Strengthen the CTA border and fill on hover/focus so there is a clear affordance even with reduced motion.
- Do not make every surface effect equally strong. Noise is persistent and quiet; glow and wisps are transient.

## Lifecycle and accessibility

- Pause noise and wisps when the card leaves the viewport or the document is hidden.
- Use `ResizeObserver`; do not assume the grid is measured before fonts and images settle.
- Under `prefers-reduced-motion: reduce`, draw one noise frame, hide wisps, and keep border, CTA, and focus feedback.
- Use descriptive image alt text when the portrait carries identity. Treat purely decorative schematics as part of that description, not separate controls.
- Clear timers, observers, listeners, RAF handles, and canvas state on unmount.

## Verify

- Compare the three-card row at the source viewport and check title, description, read-time, and CTA baselines.
- Hover and focus every card. Confirm image transform is exactly `none`, the CTA changes state, and wisps remain clipped.
- Test long title, long description, missing metadata, `390 x 844`, `1440 x 900`, reduced motion, offscreen pause/resume, and a clean console.

Use the implementation reference for reusable structure and tune the surface treatment to the supplied artwork.
