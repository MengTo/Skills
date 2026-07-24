---
name: build-game-camera-controls
description: Implement or tune Three.js game cameras. Use for isometric framing, follow behavior, orbit/zoom limits, occlusion, lock-on, camera shake, touch camera controls, and camera regression tests.
---

# Build Game Camera Controls

Keep gameplay readable before making the camera cinematic. Define one authoritative target, camera bounds, zoom range, collision/occlusion policy, and reduced-motion behavior.

## Implement

- Smooth position and look-at targets independently; never bind the camera directly to jittery render state.
- Preserve player, immediate threat, objective, and interaction cues in frame at the intended distance.
- Clamp orbit, pitch, and zoom; prevent walls or props from hiding the player without making geometry invisible globally.
- Treat lock-on, scripted moments, and shake as temporary modifiers layered over the base camera.
- On touch, separate camera gesture zones from movement/action controls and provide reset framing.

## Verify

Test corners, tall props, tunnels, multiple enemies, lock-on switching, pause, reduced motion, portrait, and landscape. Confirm no camera behavior breaks targeting, UI, or performance.
