---
name: moss-glass-controls
description: "Build Sylva-style dark glass action pills and woodland cards with an inset rim, pale icon well and a gradient that travels around the edge on hover."
---

# Moss Glass Controls

Build each action from a readable face, a one-pixel rim and an icon. Use a deep olive gradient, a faint warm top inset and a soft contact shadow. The elevated action can end in a circular ivory well with a dark directional glyph. Let a card inherit the same radii, outline color and light direction. Inset its image by about 8px.

Clip the rotating gradient to a border ring using two masks (content box and border box with exclude), or stack a solid face over a rotating undersurface. Run the gradient only while hovered or keyboard-focused. Keep the label, image and face stationary. A short perimeter pulse can begin at the pointer entry point. Idle surfaces need only the static rim. Give active press a small scale change over roughly 85ms and use a softer 150–220ms release.

Use a real anchor for navigation and a button for an in-page action. Keep a persistent visible focus outline, at least a 44px tap area, and a dark-enough local surface over bright water. Test via Tab and Space on a light and dark section. Disable continuous rim rotation with reduced motion and retain a still highlight.

Open [the interactive study](demo/index.html) to inspect the technique.
