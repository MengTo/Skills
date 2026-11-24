---
name: 3d-feature-objects
description: Build a responsive feature grid with individual lit 3D objects that turn on hover and ease back into their composed poses. Use for product instruments, tools, or other small interactive illustrations inside HTML cards.
---

# 3D feature objects

Give each feature a recognizable object. Saltmere pairs a tidal reading with a dial, water chemistry with a probe, and bloom tracking with a flowering branch. This [working shelf](demo/index.html) models a gauge, a flow meter and a probe. Hover a card, move left and right, then leave it.

## Compose the objects

- Pick a silhouette that communicates the feature at its smallest rendered size. Build the parts that change its profile first. On a dial those are the barrel, bezel and connector. Add face marks and a needle after verifying the body from the side.
- Place the artwork in a bounded area of an ordinary HTML card. Keep its heading, text, units and actions in the DOM. Store a starting three-quarter pose on an inner group, then put that group inside a neutral turntable pivot. Fit the camera for the narrowest card and leave room for the longest diagonal during a turn.
- Use one lighting recipe across the set. Give the dark face, metal edge, fasteners and indicator different roughness or specular responses. A broad key, a cooler edge light and a low fill make rotation legible against a quiet card surface. Reuse geometry and materials for repeated markings.

## Wire the turntable

1. Track the pointer within each card’s artwork rectangle. Map horizontal movement to about ±0.7 radians of yaw. While hovered, add about 0.58 radians per second of gentle rotation so the object still moves when the pointer pauses.
2. Compose that target with the object’s base angle. Smooth toward it with `1-exp(-10*dt)`. On leave or cancel, remove the hover target and return along the shortest angular path, calculable with `atan2(sin(delta), cos(delta))`. This avoids a rapid rewind after a long hover.
3. Share one renderer across the grid. The example draws each dirty, visible card on a reusable transparent WebGL canvas and immediately copies the result to that card’s 2D canvas. An alternative for a single unobscured grid is one canvas with per-card scissor rectangles. Keep a camera and independent pose for each object.
4. Reframe on resize, limit render resolution, skip offscreen cards, and stop requesting frames once angles settle. For keyboard or touch, provide an explicit turn control. In reduced motion show the composed pose and apply explicit turn steps instantly. For long-lived apps, release model resources and observers when the grid unmounts.

## Review

Check three cards of different widths, a stationary hover, and a pointer crossing from one card to the next. Confirm the previous instrument settles, the next responds, the copy stays sharp, and the corners of a turning model stay in frame. [Saltmere feature section](https://threeui.com/saltmere#features)
