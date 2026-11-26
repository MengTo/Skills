---
name: scroll-fisheye-dolly-zoom
description: Use for a scroll or pinch camera that widens from a normal lens into a mild fisheye while the rider, vehicle or portrait stays framed.
---

# Scroll a rider-locked fisheye lens

1. Save the normal camera pose, the subject’s projected position and the vertical field of view before applying the lens. Rebuild from that pose each frame so small wheel events cannot accumulate camera error.
2. Convert wheel lines and pages to pixels. Let a positive wheel delta widen the lens. Clamp a width control to 0–1, ease toward it using elapsed time, and give pinch and keyboard input the same control. Leave modified wheel gestures to the browser.
3. For width `w`, use `spread = 1 + 0.72*w`. Divide the subject-to-camera vector by `spread`, then multiply `tan(fov/2)` by `spread`. Their product sets the visible height at the subject. Clamp the camera above terrain before reprojecting the subject.
4. Use `curve = 0.30*w*w`. Multiply the widened FOV tangent by `1+curve` for overscan. Keep the saved subject position by adjusting the projection offsets, then refresh the inverse projection matrix. Center the distortion at that screen position.
5. In the final scene pass, sample at `center + delta * (1 + curve*r2)/(1 + curve)`. Compute `r2` from the aspect-corrected squared distance to the anchor, normalized by the furthest corner. Put rain and clouds through the same pass. Draw HTML controls afterward. At zero width the original lens can render directly.

## Check the result

Measure the chest-to-seat distance in pixels at normal and wide settings. A few percent of change gives a convincing dolly zoom. The ground beside the bike should expand, straight features at the edges should bend, and scrolling back should recover the first frame.

Run `node examples/check.mjs` from this skill folder for the numeric check.
