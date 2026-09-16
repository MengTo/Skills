---
name: 3d-virtual-tour
description: Build guided and interactive virtual tours through a 3D environment with authored camera paths, room and floor-plan navigation, orbit inspection, smooth mode handoffs, and progressive loading. Use for architectural walkthroughs, real-estate tours, museums, showrooms, and explorable spaces built with Three.js or a similar renderer.
---

# 3D Virtual Tour

Help the viewer understand a place through movement, landmarks, and direct navigation. Keep the route, camera, room labels, and controls in agreement.

## Establish the tour model

Inspect the scene, coordinate system, scale, floor elevations, door openings, renderer, camera controls, and asset-loading path. Preserve existing architecture and interactions. Choose the navigation modes the experience actually needs:

| Mode | Camera owner | Navigation |
| --- | --- | --- |
| Guided tour | Authored route sampler | Scroll, play/pause, or previous/next stops |
| Room destination | Authored room pose or route stop | Room list, hotspot, or floor plan |
| Inspect | Bounded orbit controller | Drag, pinch, zoom, and return |
| Free walk, when requested | First-person controller with collision | Movement and look controls |

For a Seijaku-style experience, start with a guided route, room destinations, and optional model inspection. Add free walking only when requested or required; orbit controls alone do not provide a walkable interior. If the source is only a set of panoramic images, use linked panorama viewpoints rather than implying that it contains navigable geometric depth.

## Author a route through real openings

Store route keys as progress/time, position, look target or orientation, and field of view. Store stops with stable IDs, labels, route coordinates, and associated asset groups. Keep the route coordinate independent of page height or animation clock so room links survive layout changes.

Place keys before, within, and after narrow openings. Use floor-relative eye height, account for raised floors and steps, and slow before turns or important views. Keep the horizon stable and avoid large simultaneous changes in position, gaze, and field of view. Favor physically plausible proportions over an excessively wide lens that stretches rooms.

Use timed Hermite interpolation, a suitable spline, or authored animation. Seijaku uses nonuniform timed Hermite keys for position, gaze, and field of view. A centripetal spline is another useful option, but any smooth curve can cut a corner between collision-free keys. Inspect the complete interpolated path, including the camera's near-plane clearance, against walls, ceilings, furniture, and doorframes.

Curve parameter is not automatically distance or travel time. Use arc-length sampling when roughly constant speed matters, or intentionally time segments to create pauses and reveal landmarks. Inspect [Curve](https://threejs.org/docs/pages/Curve.html) for the installed renderer's parameterization methods.

Interpolate orientation with quaternion slerp when using orientation keys. If interpolating look targets, prevent the target from crossing or coinciding with the camera, which can flip its direction. Update the projection matrix when field of view or aspect changes.

## Give one controller final camera ownership

Use a small navigation state machine and one final camera write per frame. Inputs request state changes; the route sampler, orbit controller, and transition handler must not all mutate the live camera independently.

Entering inspection should save the current route coordinate, active stop, playback state, and any scroll bookmark. Initialize inspection from a compatible view on the viewer's current side of the building. Freeze guided progression while inspecting.

Blend position, orientation, and field of view during the handoff using a validated transition path. A straight line from an interior to an exterior orbit can cross a roof; even an upward arc needs checking. Use safe waypoints, or a brief fade and destination cut when there is no credible continuous route. Clamp orbit distance and pitch to the intended inspection area.

Returning restores the saved guided state, reconciles scroll position, clears stale drag velocity, and resumes playback only if it was previously running. Disable inactive controllers and stale damping updates so they cannot pull the camera away after a transition. New navigation requests should replace the pending destination from the current pose rather than queue several competing tweens.

## Connect rooms, maps, and controls

Drive room cards, a chapter rail, floor-plan regions, and scene hotspots from the same stop registry. Use a clear world-to-plan coordinate transform; do not assume a plan's vertical axis matches world Z. Highlight the current room or route segment, with hysteresis at boundaries to avoid flicker.

Room selection should either travel along a safe connecting route or use an intentional cut/fade. Do not fly a direct interpolation through several walls. Keep the selected label and URL state, if present, synchronized with the actual destination; update browser history on meaningful navigation rather than every frame.

Use semantic HTML buttons or links for stops and provide a keyboard-accessible room list alongside graphical maps. Label hotspots, keep focus visible, and restore focus to the inspection trigger on exit. Make Escape and a visible Return button release inspection mode.

On a scrolling page, touch gestures should continue scrolling until the viewer explicitly enters interaction mode. Scope pointer capture and `touch-action` to the active canvas region. Handle pointer cancellation, lost capture, and blur; restore the prior scrolling styles on exit. Do not intercept wheel or keyboard input over forms or unrelated page controls.

## Synchronize the world with navigation

Derive route-driven doors, captions, and exposure from the current route coordinate so seeking backward or jumping to a room produces the correct scene immediately. Timer-only events can leave a closed door in the camera's path after a seek. Preserve user-selected seasons and lighting overrides unless the tour explicitly owns those settings.

Prefetch upcoming room assets by route proximity and load a directly selected destination before revealing it. Show a useful placeholder or hold a stable view during loading; a failed optional asset should not trap navigation. Cache shared textures and meshes, and cancel or ignore obsolete destination work after a new request.

Use region visibility only when it remains correct for the current camera mode. Regions hidden along a guided path may become visible when the viewer orbits the model. Recompute visibility or enable the required regions during inspection instead of exposing missing walls or rooms.

If free walk is included, constrain movement to walkable surfaces and provide collision/clearance checks. Pointer lock supplies look input, not collision or floor following. Give touch users an equivalent navigation path and a visible exit from immersive controls.

## Motion, loading, and lifecycle

Use frame-time-based interpolation and reset the time base after hiding the page. Pause playback and unnecessary rendering while hidden. Retain a static, informative view under reduced motion; room buttons should select composed views without requiring a long camera flight. Start audio only after a user gesture and preserve its mute state across navigation.

Keep one render loop, reuse scratch objects, and avoid layout reads or large allocations inside pointer handlers. Prepare the opening room first and spread expensive scene generation, texture uploads, and shader preparation across appropriate stages. Resize camera framing and render targets together; tune narrow-view compositions without moving the camera into geometry. Remove listeners, release capture, and dispose owned resources when the tour unmounts.

## Verify

- Complete the route forward and backward; inspect every opening, elevation change, and interior/exterior transition.
- Choose every room from both the list and floor plan; labels, doors, assets, and camera destination must agree.
- Enter inspection from the start, an interior, and the end; drag/zoom, then return to the exact saved stop and playback state.
- Interrupt a transition with another destination, Escape, a resize, or a hidden-tab interval; confirm one active camera owner and no stuck scroll lock.
- Test keyboard navigation, touch scrolling, pointer cancellation, reduced motion, and failed asset loading.
- Check desktop and portrait layouts, shader/console errors, opening load, destination loading, and interaction frame time.

## Reference

Read [REFERENCES.md](REFERENCES.md) for Seijaku's `KEYS`, `interp`, `Film`, `Orbit`, `_rooms`, `_plan`, and `goTo` implementation, plus the relevant camera APIs. Its guided walk and exterior inspection are reference techniques. Collision-based free walking and the additional accessibility checks above are implementation guidance, not claims about the reference's features.
