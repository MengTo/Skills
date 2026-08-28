---
name: craft-motion-design-scenes
description: Audit, choreograph, implement, and verify polished motion-design scenes for HTML, CSS, SVG, Canvas, WebGL, and timeline-based renderers. Use when a scene feels static, generic, jerky, over-eased, physically implausible, hard to read, disconnected across cuts, optimized only for a thumbnail, or in need of stronger typography, object motion, transitions, looping, deterministic seeking, accessibility, and frame-by-frame quality control.
---

# Craft Motion Design Scenes

Treat motion design as directed communication. Make every movement introduce, focus, explain, connect, or resolve something. Do not add motion merely to keep the frame busy.

## Start With Evidence

1. Play the whole film at normal speed before editing it.
2. Inspect every catalog scene at its entry, action, hold, exit, and cut boundaries.
3. Read the implementation and identify the time source, render path, easing vocabulary, animated properties, and scene ownership.
4. Separate observed defects from taste. Record exact times and visible evidence for overlap, discontinuity, weak hierarchy, dead frames, or implausible motion.

Never approve motion from a single screenshot or midpoint thumbnail.

## Define the Motion Thesis

Write one sentence before coding:

> The viewer should notice **X**, understand **Y**, and feel **Z** as the scene moves from **A** to **B**.

Then define:

- one dominant action per beat;
- one continuity device that survives the transition;
- one motion grammar for the film;
- the intended rest frame or loop seam;
- what must remain readable while everything else moves.

If no element carries state from one beat into the next, redesign the transition before polishing easing.

## Build a Beat Sheet

For every scene or shot, specify:

| Beat | Purpose | Dominant action | Secondary response | Readable hold | Exit bridge |
| --- | --- | --- | --- | --- | --- |
| Setup | Establish context | One clear entrance | Atmosphere only | Short | Direction or object persists |
| Action | Demonstrate change | Cause performs action | UI/type reacts | As needed | New state becomes next setup |
| Resolve | Confirm meaning | Settle or reveal | Reduce motion | Longest | Loop seam or clean cut |

Use three to five meaningful beats for a short scene. Merge beats that express the same idea. Do not restart every element at each catalog boundary when the underlying source film is continuous.

## Choose the Right Motion Grammar

Route the scene by its primary job:

- **Kinetic typography:** animate semantic units, preserve reading order, and let scale/direction reflect meaning.
- **Product or interface:** make inputs cause visible state changes; preserve spatial continuity through zooms and transitions.
- **Abstract system:** establish a rule, vary it, then resolve it. Random decoration is not a system.
- **Narrative collage:** use one recurring anchor, controlled density, and a clear focal handoff.
- **Physical object:** respect pivots, mass, occlusion, contact, material, and lighting. Animate the object’s state, not just its bounding box.
- **Loop:** design the seam first and keep position, velocity, opacity, and state continuous across it.

Read [references/motion-design-principles.md](references/motion-design-principles.md) for detailed timing, typography, camera, object, and transition rules.

## Choreograph Before Polishing

1. Block the primary action with linear timing.
2. Establish hierarchy through amplitude, contrast, speed, and depth.
3. Add secondary motion only when it reacts to the primary action.
4. Add anticipation or overshoot only when the material or interaction supports it.
5. Add holds after the action reads correctly.
6. Apply easing by intent and material.
7. Remove motion that competes with the message.

Prefer continuous position and velocity through camera paths and multi-stage transitions. Avoid slow-fast-slow-fast chains caused by applying a fresh ease to every small segment. Use one continuous progress function or a velocity-preserving curve across waypoints.

## Implement a Deterministic Time Model

Make visible state a function of scene time. Seeking to the same time must reproduce the same frame.

- Drive animation from one render function.
- Derive progress from named time windows.
- Avoid CSS transition clocks for exported or seekable motion.
- Seed procedural randomness.
- Avoid layout reads after writes inside the frame loop.
- Prefer transforms, opacity, Canvas, or shader uniforms over layout-property animation.
- Wait for fonts and required assets before declaring the frame ready.
- Provide a reduced-motion composition, not merely disabled easing.

## Review in Motion

Inspect at normal speed, half speed, and exact frozen times. Check:

- the first readable frame;
- peak velocity;
- the frame immediately before and after each cut;
- the longest hold;
- object silhouettes and overlaps at maximum deformation;
- the loop’s last and first frames;
- native appearance plus project light and dark modes;
- fit and fill at every supported aspect ratio.

Use frame differences to find accidental stillness or abrupt jumps. A thumbnail may be beautiful while the interpolation is poor.

## Score Before Shipping

Score the scene with the 100-point rubric in [references/motion-design-principles.md](references/motion-design-principles.md). Require:

- no collision or clipping failures;
- no unmotivated discontinuity;
- no unreadable key message;
- deterministic frozen frames;
- no unintended native-theme mutation;
- no console errors;
- a clean performance profile for the target frame rate.

Treat any fail gate as a blocking defect regardless of the numeric score.

## Deliver the Result

Report:

- the motion thesis;
- the changed beats and continuity device;
- exact visual defects fixed;
- runtime or accessibility risks remaining;
- validation times, aspect ratios, and appearances checked.

Do not claim “motion-design quality” from a build pass alone. Provide visual verification evidence.
