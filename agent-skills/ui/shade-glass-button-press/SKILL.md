---
name: shade-glass-button-press
description: Add fingertip-local press deformation and a refractive release wave to a glass button. Use for taps, held presses, rim shimmer, and synchronized icon or text response.
---

# Shade a glass button press

Treat contact, activation and release as separate events. The native button owns activation and keyboard semantics. The shader receives a contact position and a clock for each control.

## Hold

- On pointer down, store the contact in local coordinates relative to the undeformed button. Capture the pointer. Start a quick spring toward the held pose. Indent the face near the contact with a Gaussian falloff and reduce the optical thickness there.
- Keep the contact fixed for the release wave. A draggable slider inside a tile may update its own value while held. Resolve the drag threshold before interpreting the gesture as a tap.
- Preserve a visible keyboard focus ring. For Space and Enter, use the button center as the contact and rely on one activation path. On cancel, blur or lost capture, release the visual state and discard the pending activation.

## Release

Compute all distances in one physical space. Multiplying normalized UVs by button dimensions before measuring a radius gives a consistent wave on wide and square controls.

```glsl
vec2 delta = (uv - contactUV) * buttonSize;
float reach = length(max(contactUV, 1. - contactUV) * buttonSize);
float travel = (1. - pow(1. - t, 1.7)) * (reach + bandWidth);
float d = (length(delta) - travel) / bandWidth;
float crest = exp(-d*d);
float wake = exp(-pow((d + 1.1) / 1.6, 2.));
```

Here `t` runs from zero to one on release. Displace the backdrop along the outward direction using the difference between the crest and wake. At the crest, sample adjacent RGB positions for a brief spectral split. Gate the highlight by edge distance so the rim catches light when the wave arrives. Fade the entire response before deactivating the pass. Start with a roughly 700–1000 ms release and tune at actual button size.

Use the same clock for the glass, icon, and lettering. A short displacement or split confined to the passing crest keeps the label readable. A fresh tap replaces that button’s previous wave. Under reduced motion, use a static held highlight and immediate state change.

Try an off-center press in the [wave demo](demo/index.html). Test a long hold, a quick double-tap, keyboard activation and pointer cancellation. A release at the left edge should reach the right rim last.
