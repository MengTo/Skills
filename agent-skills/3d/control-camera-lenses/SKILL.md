---
name: control-camera-lenses
description: Add photographic focal length, sensor fit, subject tracking and depth-aware shallow focus to a Three.js scene. Use for lens selectors, dolly and zoom shots, eye focus, and sharp deterministic film exports.
---

# Control camera lenses in Three.js

Keep the camera pose, focal length, focus distance and aperture as separate controls. Use a fixed position when demonstrating two lenses. A dolly changes the relative size of foreground and background objects as the camera moves. A zoom at a fixed position crops the same perspective.

## Set up the shot

1. Define a sensor gate. The creek uses a 36 mm wide, 16:9 gate with a height of 20.25 mm. Set the vertical field of view to `2 * atan(sensorHeight / (2 * focalLength))` and convert to degrees for `camera.fov`. Set the aspect on resize and update the projection matrix. Choose a gate-fit policy for portrait framing, and use the same convention for presets and the displayed millimetres.
2. Set a focus plane in metres along the camera's local forward axis. After animation and camera movement, transform both eye centres to camera space and use the nearer visible eye. With the subject off centre, Euclidean camera-to-eye distance places the focus plane behind it. Preserve the last valid focus when the target moves behind the camera.
3. Store linear depth for every visible surface, including water and alpha-tested foliage. Thin-lens blur uses focal length squared and grows with the difference in reciprocal depth. Carry the blur sign to distinguish foreground and background. The [lens helper](demo/assets/lens.js) returns signed radius in output pixels. Recompute it at the actual backing-buffer height for Retina and native 4K.
4. Gather colour around each pixel using the signed blur radius. Reject farther samples that would bleed across a sharp foreground edge. A near-field occupancy or dilation pass lets blurred foreground shapes expand across their silhouettes. Keep an in-focus subject at its original resolution. Tone-map once after combining the passes.
5. Animate the millimetres and the camera motion independently. Momiji Creek starts at 24 mm, uses 35 mm for the house, and eases from 40 to 58 mm on the perched wagtail. Let the eye stay sharp as the water recedes into softer highlights. Advance camera and subject on the same fixed-step clock for film export.

## Check the image

[Open the lens study](demo/index.html). Switch from 24 to 58 mm without moving the camera. The nearby twig grows against the sensor while its alignment with the distant marker holds. Shift focus from the twig to the far trees and back. Check that the sharp band follows the selected distance at both lens settings. Try a different frame aspect and inspect the output at native resolution. Run `node references/check-lens.cjs` for the projection and blur checks.
