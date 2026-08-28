---
name: build-holographic-brand-cards
description: Build or adapt portrait partner and sponsor cards that combine brand-specific playing-card artwork, an exact logo lockup, and pointer-driven Three.js foil, glitter, laminate, tilt, and shadow. Use for retro partner cards, holographic sponsor cards, or interactive collectible brand cards; use the generic threejs skill for unrelated 3D scenes and company-logos when the task is only sourcing a logo.
---

# Build Holographic Brand Cards

The mechanism is one normalized pointer signal driving card pose, glitter reveal, laminate normal, lighting, and cast shadow together; if those layers use unrelated motion, the result reads as effects pasted over a flat image.

## Preserve the card contract

- Start from a supplied or approved portrait artwork. Default to a `640 x 848` card coordinate system and a `4 / 5` presentation frame.
- Keep the artwork, WebGL foil, and pointer response as one visual object. Do not scale the DOM card on hover; depth comes from the Three.js tilt and shadow.
- Keep the identity footer outside WebGL: an accurate logo mark, brand name, and short collaboration description. Do not add visual-theme labels or activity pills unless requested.
- Use an authoritative local or official logo asset. Never ask image generation to redraw a trademark and treat the approximation as the final mark.
- Measure the artwork's visible outer curve and pass that value to the shader. A generic radius produces transparent corners that do not match the printed frame.

## Build the scene

1. Render the artwork on one `PlaneGeometry` with a transparent `ShaderMaterial`.
2. Composite in this order: artwork shading, screen-blended glitter, laminate/specular light, then rounded-edge alpha. Changing the order bleaches the art or lets glitter escape the silhouette.
3. Normalize pointer coordinates to `[-1, 1]` from the visible card bounds. Use the same coordinates for rotation, glitter field shift, sheen center, and hue shift.
4. Ease current pointer and hover values toward targets with an exponential time constant. Do not animate position or scale.
5. Project the rounded card silhouette from the light onto a segmented shadow plane. An offset blurred duplicate reads as a second card, not a cast shadow.
6. Keep the renderer transparent and let the host page own the background and card footer.

Use these landed defaults before art-specific tuning:

| Parameter | Default | Failure prevented |
| --- | ---: | --- |
| Card coordinates | `640 x 848` | Foil density changing with CSS size |
| Corner radius | `40 px` | Shader mask cutting across the printed border |
| Maximum tilt | `+/-14.35 deg` | Flat response below `8 deg`; toy-like distortion above `18 deg` |
| Camera distance | `3.95` card widths | Excess perspective or near-orthographic motion |
| Tilt time constant | `0.14 s` | Pointer jitter or sluggish lag |
| DPR cap | `2` | Mobile fill-rate spikes |
| Frame delta cap | `0.05 s` | A large jump after tab or viewport resume |
| Visible card height | `min(90vh, 720px, 89vw / aspect)` | Cropping at short or narrow viewports |

For the shader constants, iframe query contract, shadow projection, and React integration, read [references/implementation.md](references/implementation.md).

## Integrate without duplicate artwork

- For an eager, above-the-fold card, mount the renderer immediately and omit the separate fallback `<img>`; otherwise the same image loads and appears twice during initialization.
- For a lazy grid card, a fallback image is acceptable while offscreen. Fade it out only after the iframe reports ready.
- If an iframe has `pointer-events: none`, forward pointer coordinates from the semantic parent with `postMessage`. Check `event.origin` inside the scene.
- Keep the semantic link or article outside the decorative iframe. The iframe is `aria-hidden` or has a non-redundant title and is never keyboard focusable.
- The WebGL layer must not carry essential text, state, or the only copy of the logo.

## Lifecycle and accessibility

- Pause when `document.hidden` or outside the viewport; reset the previous time before resuming.
- Under `prefers-reduced-motion: reduce`, render one composed foil frame with no RAF loop. Keep links and controls usable.
- Recompute camera, renderer, and plane scale on resize. Guard zero-sized bounds.
- Dispose geometries, materials, textures, observers, listeners, and animation frames when the host unmounts.
- Use visible focus on the semantic card and preserve a non-WebGL fallback for failed renderer initialization.

## Verify

- Compare the card and demo at the source viewport, including artwork crop, footer proportions, logo accuracy, and outer radius.
- Test center, all four pointer extremes, leave, touch down/up, and keyboard focus.
- Verify `390 x 844` and `1440 x 900`, reduced motion, reload, offscreen pause/resume, and a clean console.
- Confirm hover changes pose and foil but never DOM scale.

Use the implementation reference for reusable structure and tune every visual constant against the supplied artwork.
