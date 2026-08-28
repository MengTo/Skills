# Motion Design Principles

## The Core Test

At every moment, ask:

1. Where should the eye go?
2. What changed?
3. Why did it move?
4. What state survives into the next beat?
5. Can the viewer read the intended message before it leaves?

If those answers are unclear, adding polish will not fix the scene.

## 1. Give Motion a Job

Every movement must serve at least one function:

- **Introduce:** establish an object, message, or world.
- **Focus:** move attention to the next important element.
- **Explain:** show a relationship, process, or state change.
- **Connect:** preserve continuity through a transition.
- **Resolve:** confirm the result and reduce visual energy.

Delete motion that serves none of these functions.

## 2. Establish Hierarchy

Use motion contrast deliberately:

- Give the dominant action the largest change in scale, position, depth, or contrast.
- Keep supporting elements slower, smaller, dimmer, or phase-locked to the dominant action.
- Avoid giving text, camera, object, particles, and background equal energy at once.
- Preserve negative space around the focal element at its maximum extent, not only at rest.
- Let the resolve be calmer than the setup unless the film intentionally ends on impact.

One beat should have one clear visual verb: open, assemble, focus, connect, confirm, dissolve, or launch.

## 3. Build Continuity

Use at least one continuity device across each transition:

- an object persists and changes state;
- camera direction continues;
- shape or mask transforms into the next composition;
- color transfers from source to destination;
- typography becomes a layout element;
- velocity carries through the cut;
- foreground occlusion hides the swap.

Avoid fading everything out and restarting from empty unless absence is the intended beat.

For continuous camera travel, preserve velocity through waypoints. Do not concatenate independently eased segments. Use a continuous progress curve, arc-length parameterization, or spline with matched tangents.

## 4. Use Time as Structure

Treat these as starting ranges at 30 fps, not rigid presets:

| Action | Typical range | Frames | Notes |
| --- | ---: | ---: | --- |
| Micro response | 0.13–0.27s | 4–8 | Hover, cursor, small state change |
| Text unit reveal | 0.20–0.40s | 6–12 | Stagger semantic units by 1–4 frames |
| UI panel or card | 0.27–0.53s | 8–16 | Use distance and perceived mass |
| Hero object move | 0.60–1.20s | 18–36 | Preserve silhouette during travel |
| Camera reframe | 0.80–1.80s | 24–54 | Keep continuous velocity |
| Short phrase hold | 0.47–0.90s | 14–27 | Longer for unfamiliar language |
| Headline plus support | 1.20–2.20s | 36–66 | Count from fully readable state |

Make the hold proportional to reading complexity, not scene duration. Count the readable hold only after the final important element arrives.

Use rhythm rather than uniform timing. A useful pattern is setup → acceleration → impact → readable hold → bridged exit. Vary beat length by meaning while keeping the motion grammar consistent.

## 5. Ease by Intent and Material

- Use ease-out for arrival and legibility.
- Use ease-in for departure or loss of control.
- Use symmetric ease-in-out for deliberate mechanical travel.
- Use spring behavior only for elastic or interactive systems.
- Use linear motion for scans, conveyors, orbit loops, and constant camera drift.
- Use damped overshoot for material that can flex; cap it before geometry collides or text blurs.

Avoid applying the same ease to all properties. Position may lead, rotation may settle later, and shadow may lag slightly. Keep the causal order readable.

Avoid repeated easing at closely spaced waypoints. Each ease forces velocity toward zero and produces the visible slow-fast-slow-fast cadence. Maintain velocity unless a real impact, hold, or decision occurs.

## 6. Choreograph Typography

- Animate by semantic unit: phrase, word group, or meaningful letter cluster.
- Preserve reading order unless the disruption expresses the message.
- Use masks, baselines, tracking, weight, or scale as one coherent language.
- Keep type transforms compatible with the letterforms; large rotation can destroy serif detail.
- Reserve character-by-character motion for typing, counting, decoding, or an intentional texture.
- Hold the final phrase long enough to read.
- Measure the animated extrema. Rules, chapter labels, counters, and secondary copy must never cross the headline.
- Establish safe rectangles for headline, metadata, object, and chapter furniture. Test the union of their animated bounds.

Use one primary type behavior per film. Variation should derive from that behavior rather than introducing an unrelated reveal in every scene.

## 7. Direct Camera Motion

- Move the camera to reveal information or change scale, not to make a static layout feel active.
- Use one dominant axis per move and introduce secondary axes only after the direction reads.
- Keep screen-space velocity stable on long travels.
- Avoid simultaneous large camera rotation, object rotation, and text movement.
- Preserve horizon, anchor, or vanishing-point logic between shots.
- Let parallax confirm depth; do not fake depth with unrelated layer drift.

At each camera extreme, check crop, focus, scale, and edge tangencies.

## 8. Animate Physical Objects Credibly

Define these before keyframes:

- pivot or hinge;
- mass and stiffness;
- contact surface;
- collision and occlusion order;
- light direction;
- shadow source;
- material response;
- final state.

Rotate around the real pivot. Couple contact shadows to height and footprint. Let heavier objects accelerate and settle more slowly. Preserve thickness at edge-on angles. Do not allow surfaces to intersect merely to hit a pretty midpoint.

## 9. Build Transitions From Shared State

Plan the exit and next entrance together. Use shared geometry, direction, color, or content. Check the frame before and after the boundary side by side.

Good transition questions:

- What remains on screen?
- What transfers energy?
- What reveals the next shot?
- Does the next scene begin from the previous velocity?
- Is the cut motivated by impact, occlusion, or a completed thought?

Do not hide weak transitions with a full-frame fade by default.

## 10. Design Loops as Seams

Match start and end state for:

- position and transform order;
- velocity and direction;
- opacity;
- camera;
- particles and procedural state;
- text visibility;
- color and lighting.

Use a rest-frame seam, an occlusion seam, or a truly periodic function. Do not let a modulo reset expose a snap.

## 11. Preserve Determinism and Performance

- Render the same scene time to the same frame.
- Seed randomness or precompute procedural values.
- Update transforms, opacity, Canvas, SVG attributes, or uniforms.
- Avoid repeated layout reads after style writes.
- Avoid animating top, left, width, and height in the hot path when transforms can express the same result.
- Avoid CSS transitions when a frame-seekable timeline owns time.
- Budget blur, filters, shadows, and overdraw at target resolution.
- Test the export path, not only live playback.

## 12. Provide Reduced Motion

Reduced motion is a different composition, not a broken animation.

- Preserve the narrative states and reading order.
- Replace large travel, parallax, spin, or simulated camera motion with crossfades or short local reveals.
- Keep useful state changes such as progress, selection, and confirmation.
- Remove continuous ambient drift.
- Render deterministic reduced-motion frames for seeking and export.

## 100-Point Review Rubric

| Category | Points | Passing evidence |
| --- | ---: | --- |
| Story and purpose | 15 | Every beat communicates a distinct idea |
| Visual hierarchy | 15 | Eye path and dominant action are unambiguous |
| Choreography and causality | 15 | Secondary motion responds to a primary cause |
| Continuity and transitions | 15 | State, direction, or velocity bridges every boundary |
| Timing and easing | 10 | Readable holds, material-aware curves, no cadence stutter |
| Typography and composition | 10 | Collision-free, readable, intentional extrema |
| Object and material craft | 10 | Credible pivots, depth, lighting, occlusion, and contact |
| Technical determinism | 5 | Exact seeking and repeatable frames |
| Performance and accessibility | 5 | Target frame rate and reduced-motion composition |

Passing target: 85/100, with no fail gate.

### Fail Gates

- key message is unreadable;
- text or geometry visibly collides;
- a cut or loop visibly snaps without intent;
- a physical object intersects or pivots implausibly;
- the same requested time produces different output;
- native appearance is unintentionally changed;
- motion produces a console error or export failure;
- reduced-motion mode removes required meaning.
