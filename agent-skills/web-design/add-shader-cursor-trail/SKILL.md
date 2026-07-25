---
name: add-shader-cursor-trail
description: "Add the Shaders WebGPU mouse effect used for the Tidal Commons hero: a white twinkling halftone cursor trail driven by ChromaFlow, masked through a DotGrid, finished with chromatic ripples and film grain, and protected by static, touch, accessibility, SSR, and performance fallbacks. Use when a user asks for this shader mouse effect, a halftone cursor trail, an interactive WebGPU hero/contact background, or a reusable cursor-following shader layer in React, Next.js, Vue, Svelte, Solid, or plain web projects."
---

# Add Shader Cursor Trail

Implement the exact trail as progressive enhancement. Preserve the host section's semantic content, imagery, controls, and static first frame.

## Workflow

1. Inspect the framework, rendering mode, existing motion stack, layer order, reduced-motion rules, and package manager. Do not add another smooth-scroll engine or replace the section's content.
2. Install `shaders` with the existing package manager. Import from the matching framework subpath: `shaders/react`, `shaders/vue`, `shaders/svelte`, or `shaders/solid`.
3. Read [references/implementation.md](references/implementation.md) before implementation. Keep the six shader nodes, their order, both invisible drivers, and both ID linkages exact.
4. For React or Next.js, copy and adapt the files in `assets/react/`. Keep the lightweight capability gate separate from the heavy shader module so ineligible visitors do not request the shader bundle.
5. Place one full-bleed, `aria-hidden="true"` shader layer behind the section content. Keep links and controls above it. Do not set `pointer-events: none` on the canvas unless cursor tracking is verified to use global events.
6. Gate loading on WebGPU, a fine hover pointer, normal motion/transparency preferences, document visibility, window focus, and section intersection. Unmount when the section leaves view so GPU work stops.
7. Keep the original image or dark background as the complete fallback. Hide the layer for reduced motion, reduced transparency, coarse/no-hover pointers, and forced colors.
8. Adapt only presentation variables such as opacity and blend mode. Do not change the graph to decorative noise, add WebGL/Three.js, or hotlink Shaders preview assets.

## Validate

Run the project's lint, typecheck/tests, and production build. For React implementations, also run:

```bash
node /path/to/add-shader-cursor-trail/scripts/verify-cursor-trail.mjs \
  path/to/CursorTrailShader.tsx \
  path/to/CursorTrailGate.tsx \
  path/to/cursor-trail.css
```

Verify the static section with JavaScript unavailable, keyboard access to content above the layer, touch behavior, reduced motion, unsupported WebGPU, focus/visibility cleanup, and absence of runtime requests to `previews.shaders.com` or `data.shaders.com`.

Report the chosen blend mode, fallback, capability gates, production-build result, and any browser limitation. Do not claim WebGPU visual verification unless it was actually performed in a compatible browser.
