# Three.js Style-Study Demo Prompt

## Build the landing page

Use $scroll-world-storytelling in **Three.js world** mode to create a responsive standalone landing page titled The Contract: One Coherent Object.

### Story

Use six chapters: Destination, Fence, Bar, Loop, Route, and Proof. The central metaphor is a kinetic bead-and-ring sculpture. As the contract becomes clearer, scattered paths resolve into one legible object. Finish with one CTA.

### Inspiration audit

Before designing, inspect the newest one or two daily UI inspiration captures in the local Content project when available. Review the article, full-page stills, and representative local MP4 frames. Extract visual principles, not markup or exact layouts.

For this demo, abstract three directions from the July 17 references:

1. **Signal red** — REFORM and Swiss editorial cues: vermilion field, black structural object, hard graphic contrast, giant compressed type.
2. **Monochrome editorial** — Tomorrow cues: warm white report field, severe black geometry, fine rules, photography-like shadows, numeric precision.
3. **Soft pearl** — Portal cues: warm ivory space, pearl ceramic beads, charcoal wire structure, diffuse daylight, one coral signal.

Build all three as switchable, labeled art directions around the same scene and story. They must change background, object material, light, contrast, and page palette—not merely accent colors. Default to Soft pearl.

### Three.js requirements

- Use a local pinned Three.js module, not a CDN.
- Create one real-time scene with a perspective camera and WebGL renderer.
- Build a non-literal spatial object from an instanced bead shell, faceted core, orbital rings, a structural knot, and six evidence nodes.
- Map normalized scroll progress to camera orbit, camera distance, object rotation, shell alignment, ring scale, and active chapter.
- Keep ambient object rotation slow; scroll must remain the primary conductor.
- Cap device pixel ratio at 2, resize correctly, pause rendering when the document is hidden, and dispose resources on teardown.
- Preserve native reversible scrolling. Do not add orbit controls or wheel hijacking.
- Provide a CSS/SVG sculptural fallback when WebGL is unavailable and a static ordered version for reduced motion.

### Layout

- Reserve the left side for oversized editorial chapter type and the right side for the sculpture.
- Keep the art-direction switch compact and persistent without covering story copy.
- On mobile, move the sculpture above the copy and turn the three styles into a bottom segmented control.
- Avoid dashboard cards, glass panels, purple gradients, star fields, glowing planet clichés, and ornamental UI chrome.

### Verification bar

- The page proves that a Three.js canvas is rendering.
- Each art-direction control changes the field, material, lighting, and interface palette.
- All six chapters change the camera and world state at the expected scroll points.
- Reverse scrolling restores prior camera states.
- No console errors, missing module, WebGL overflow, or hidden text collision.
- Verify desktop and 390px mobile, device-pixel-ratio cap, resize, hidden-tab pause, keyboard focus, and reduced motion.

## Remix prompt

Use $scroll-world-storytelling in Three.js mode for my supplied story. Read the complete source, audit the newest local daily inspirations, and return a beat ledger plus three materially different art-direction studies before coding. Then build one procedural real-time world whose camera and object states are deterministically controlled by native scroll. Use local pinned dependencies, a static fallback, responsive composition, reduced motion, and a real Codex-browser verification pass.
