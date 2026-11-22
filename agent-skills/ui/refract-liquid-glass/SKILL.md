---
name: refract-liquid-glass
description: Build sharp, draggable liquid-glass panels that bend a live backdrop through a rounded glass lip. Use for scene-aware refraction, responsive rim reflections, and elastic panel motion.
---

# Refract liquid glass

Start with a visual test target. Place the panel across a thin diagonal, a bright window frame, and a dark surface. The line should stay recognizable through the face, curve inside the shoulder, and meet the undisturbed scene outside the rim.

## Render the lens

1. Render the backdrop once to a texture before drawing glass. A Three.js scene can share its linear-color render target with the glass pass. For a DOM-only surface, use an accessible backdrop treatment unless the application controls a texture that represents the backdrop. Align the texture to the actual viewport and scroll offset.
2. Measure the DOM rect in CSS pixels. Convert fragment coordinates once to the same space, including the vertical axis. Evaluate a rounded-box signed distance and use its screen derivative for coverage. Reserve the high-curvature profile for the shoulder. A flat face preserves the detail inside a large tile.
3. Build a unit entrance normal from the rounded-box gradient and a smoothly varying tilt. Trace toward a backing plane with a modest glass index. These expressions assume an eye-facing normal, an incident ray along negative Z, and a thickness expressed in CSS pixels.

   ```glsl
   vec3 ray = refract(vec3(0., 0., -1.), normal, 1. / 1.46);
   vec2 offsetPx = thicknessPx * ray.xy / max(-ray.z, 0.15);
   vec2 sampleUV = (fragmentPx + offsetPx) / viewportPx;
   ```

4. Use the displaced UV for transmission. Sample the surroundings farther along the rim normal for reflected color and increase its contribution toward grazing angles. Let hover shift the reflection and the apparent thickness locally. Inspect a dark and a bright background before tuning the rim intensity.
5. Render typography and focus indicators at display density. Size the drawing buffer to the CSS rectangle times the chosen device scale. Use linear filtering, derivative-based edge coverage and a filtered source for minified samples. If the room is expensive, reduce the atmospheric pass first. Increasing the final framebuffer cannot restore detail lost in the input texture.

## Drag and settle

Give a title or grip pointer capture. Translate the panel with the pointer, then drive a separate damped spring with movement impulses. Anchor shear near the grip so the far edge lags on reversal. Apply the same displayed transform to the glass, icons, text and hit coordinates. In a worker renderer, present the DOM transform when its matching rendered frame is acknowledged. Release capture on cancel. Offer a keyboard move or reset and suppress oscillation under reduced motion.

Open the [live loupe](demo/index.html). Drag it across the shoreline, reverse direction, and release. Check the text, rim, backdrop alignment and stationary end state at 1× and 2×.
