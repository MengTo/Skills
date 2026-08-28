---
name: adapt-threejs-to-motion-design
description: Adapt an existing Three.js, WebGL, or interactive 3D reference into a reference-faithful motion-design composition with one large message, scene-specific typography and camera choreography, subject-safe layout, unclipped text and shadows, and verified catalog media. Use when turning an existing 3D scene or route into motion design; do not use it to redesign or approximate the underlying 3D asset.
---

# Adapt Three.js to Motion Design

Preserve the supplied 3D scene as the visual source of truth. Build motion design around its subject silhouette and native stage using one dominant message whose typography, placement, and movement belong to that scene.

This skill is narrower than `animation-systems`, which covers general product motion, and `threejs`, which covers renderer construction and debugging. Use `record-natural-preview-videos` as the delivery workflow when the result is a new or materially changed catalog item.

## Mechanism

The mechanism is: **keep the exact scene intact, reserve its silhouette as negative space, then choreograph one reference-specific message and a restrained host-camera move around it.**

If removing the original scene, changing the message treatment to a generic template, or placing type across the subject would leave the composition essentially unchanged, the adaptation has failed.

## Non-negotiable rules

1. **Use the exact renderer.** Mount or embed the existing scene. Preserve its geometry, materials, lighting, animation, interaction, camera character, and important shadows. Do not redraw it with CSS, replace it with a screenshot, or make a lookalike.
2. **Keep the native stage.** The scene remains full-bleed or retains its authored framing. Do not shrink it into a new card, plate, browser window, frame, or decorative container unless that frame already belongs to the reference.
3. **Use one message.** Render one semantic heading, normally one `<h1>`, split across one to three large rows. Do not add a kicker, eyebrow, caption, label, metadata, body copy, or other small supporting text.
4. **Write for the reference.** Derive the message from the scene's product, world, material, behavior, or existing copy. Different references require different words. Never reuse one generic slogan across a batch.
5. **Give each scene its own motion grammar.** Choose direction, rotation, tracking, deformation, pacing, color, and shadow from the reference. Do not apply one reveal preset to every scene.
6. **Protect the subject silhouette.** Map the subject, bright core, controls, and long shadows before placing type. Text and its effects must occupy verified negative space at every key state, not merely at the resting frame.
7. **Restrain scene motion.** Start host-camera scale around `0.90–1.01`, animated translation around `0.5–1%`, and rotation around `0.2–1.25deg`. Use a larger static offset only to establish composition. Do not zoom closer until the full subject and its shadows remain safe throughout the loop.
8. **Never clip the message.** Do not use masked rows, `clip-path`, `background-clip`, `overflow: clip`, or an `overflow: hidden` wrapper as the reveal mechanism. Animate complete words or rows with transform, opacity, tracking, rotation, scale, and restrained blur.
9. **Never clip text shadows.** Text rows and their ancestors must be overflow-visible. Inset the headline far enough that the widest shadow, blur, rotation, and entrance/exit transform stay inside the viewport.
10. **Motion must carry meaning.** Zoom, orbit, rotation, and text movement are tools, not requirements to maximize. Use only the techniques that reinforce the reference's physical or visual behavior.

## Workflow

### 1. Inspect before composing

- Open the exact source route in the approved browser and observe a complete interaction or animation cycle.
- Identify the actual renderer/component and reuse it directly.
- Record the native background, subject bounds, shadow bounds, bright areas, interaction targets, copy cues, type character, and open negative space.
- Inspect approved motion-design references for timing and composition principles. Use them as choreography references, not as a shared visual template.
- Capture a clean baseline frame before adding typography.

Read [references/composition-and-motion.md](references/composition-and-motion.md) before choosing the message, layout, or timeline.

### 2. Establish the still composition first

- Freeze the scene at a representative frame.
- Place the full subject before placing text.
- Choose one meaningful message, usually `2–8` words across `1–3` rows.
- Make the heading large enough to act as the composition's second subject; the landed examples used minimums around `52–68px`, fluid sizes around `4–7.5vw`, and maximums around `80–143px`.
- Reserve a safety gap between type effects and the subject. Judge the glow or shadow boundary, not only the glyph box.
- Reject the layout if it needs a new frame, small explanatory text, or scene over-zoom to feel complete.

### 3. Author a reference-specific ten-second loop

- Lock the scene/camera motion before layering text.
- Use a clear entrance, long readable hold, and exit. A useful starting structure is `0–1.8s` entrance, `1.8–7.0s` hold, `7.0–8.6s` exit, and `8.6–10.0s` loop reset or visual breathing room.
- Stagger heading rows by about `0.08–0.16s` when the reading order benefits from it.
- Break interactive 3D movement into three or four eased arcs with pauses. The pointer should land purposefully; it should not wander.
- Keep complete words visible during entrances and exits. A word may translate, rotate, skew, stretch, or defocus, but it must not be sliced by a mask.
- Give each variant named keyframes or a distinct timeline so batch work cannot silently collapse into one preset.

### 4. Implement as a host-layer composition

- Keep the exact renderer isolated beneath a DOM typography layer.
- Prefer `transform` and `opacity`; animate blur and text shadow sparingly.
- Keep row wrappers overflow-visible and allow enough outer inset for shadows.
- Add `animation-fill-mode: both` when delayed rows would otherwise flash in their resting state.
- Support `prefers-reduced-motion` with a designed still frame: the subject and message remain visible, while non-essential movement stops.
- Pause animation when the document is hidden or the composition leaves the viewport.
- If deterministic frame capture is needed, expose capture timing only behind an explicit preview mode; do not leak capture controls into normal UI.

Read [references/implementation-and-qa.md](references/implementation-and-qa.md) when writing code, integrating a catalog item, recording previews, or validating delivery media.

### 5. Review as a motion designer

Review the opening, entrance, hold, exit, and loop seam at the target aspect ratio. For every state ask:

- Is this unmistakably the supplied reference?
- Is there exactly one message and no small supporting copy?
- Does the message sound like this scene rather than the previous scene?
- Are the typeface, scale, color, placement, and motion specific to the reference?
- Is the full subject readable without aggressive zoom?
- Does any glyph, glow, or shadow touch the subject?
- Is any glyph or shadow clipped by a wrapper or viewport edge?
- Does the scene motion guide attention without competing with the message?

If any answer is wrong, fix the composition and review the full loop again. Do not solve overlap by making the heading small.

### 6. Deliver and verify

When the work changes a rendered catalog item:

- Record one native `1920x1080`, `10.000s`, `30fps` browser capture with 300 dense source frames.
- Derive a cursor-free `1280x720` JPEG thumbnail from a native source frame.
- Derive both the `1280x720` gallery VP9 WebM and `1920x1080` detail VP9 WebM from the same native master.
- Keep the 1080p detail preview below `3,000,000` bytes.
- Inspect midpoint frames, a one-second contact sheet, and representative entrance/exit frames.
- Verify dimensions, duration, frame rate, pixel format, codec, audio absence, catalog paths, reduced motion, and a clean console.
- Preserve unrelated dirty work and commit only the semantic task scope when the owning project requires commits.

## Failure signals

Stop and recompose when any of these appears:

- The original scene has become a background texture rather than the subject.
- Several variants share the same font, copy structure, placement, or reveal.
- A small label exists only to make the layout feel designed.
- The subject is enlarged to compensate for weak composition.
- The heading crosses the object, its controls, bright core, or long shadow.
- A row appears by sliding through a clipped strip.
- A shadow disappears at a row boundary or viewport edge.
- The still frame works, but the entrance or exit collides with the subject.
- The preview is a smooth automated cursor loop rather than intentional eased arcs and holds.

## Completion report

Report:

1. Which exact renderer was preserved.
2. The message and motion grammar chosen for each variant.
3. How subject-safe zones, restrained scale, and unclipped shadows were verified.
4. Which preview assets and tests were completed.
5. Any unrelated worktree changes intentionally left untouched.
