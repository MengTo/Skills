# Three.js Planet Demo Prompt

## Build the landing page

Use $scroll-world-storytelling in **Three.js world** mode to create a responsive standalone landing page titled The Contract: Orbital Standard.

### Story

Use six chapters: Destination, Fence, Bar, Loop, Route, and Proof. The central metaphor is a planet whose orbit becomes more precise as the contract becomes clearer. Finish with one CTA.

### Three.js requirements

- Use a local pinned Three.js module, not a CDN.
- Create one real-time scene with a perspective camera and WebGL renderer.
- Build the planet procedurally with sphere geometry and a custom shader or locally generated texture.
- Add atmosphere, two orbital rings, route arcs, signal nodes, a star field, and restrained lighting.
- Map normalized scroll progress to camera orbit, camera distance, planet rotation, ring alignment, route brightness, and active chapter.
- Keep ambient planet rotation slow; scroll must remain the primary conductor.
- Cap device pixel ratio at 2, resize correctly, pause rendering when the document is hidden, and dispose resources on teardown.
- Preserve native reversible scrolling. Do not add orbit controls or wheel hijacking.
- Provide a CSS/SVG planet fallback when WebGL is unavailable and a static ordered version for reduced motion.

### Art direction

Scientific atlas meets premium mission control: deep blue-black space, midnight teal planet, electric cyan atmosphere, signal amber routes, warm parchment typography, fine orbital lines, no dashboard cards, no neon overload. Pair a compressed technical sans stack with a high-contrast serif.

### Verification bar

- The page proves that a Three.js canvas is rendering.
- All six chapters change the camera and world state at the expected scroll points.
- Reverse scrolling restores prior camera states.
- No console errors, missing module, shader failures, or WebGL overflow.
- Verify desktop and 390px mobile, device-pixel-ratio cap, resize, hidden-tab pause, keyboard focus, and reduced motion.

## Remix prompt

Use $scroll-world-storytelling in Three.js mode for my supplied story. First define a single spatial metaphor and 5–7 beat ledger. Then build one procedural real-time world whose camera and object states are deterministically controlled by scroll. Use local pinned dependencies, a static fallback, native scrolling, responsive composition, reduced motion, and a real-browser verification pass.
