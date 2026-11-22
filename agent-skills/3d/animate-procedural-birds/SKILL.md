---
name: animate-procedural-birds
description: Build and animate a small bird in Three.js with a recognizable species silhouette, folding wings, independent head and tail motion, grounded toes and a shadow that holds up in close shots. Use for perching, takeoff, flight and landing in wildlife scenes.
---

# Animate procedural birds

Pick a species and a world scale before you animate it. A Japanese wagtail reads from the length of its tail, the dark bib, the white brow and the pale bars across its folded wings. Test its silhouette against light water and a dark bank. For a different species change the body, bill, feet and timing together.

## Build the rig

1. Put the bird origin between its feet. Group the breast, neck, head, shoulders and tail. Keep the lower bill on a separate hinge when calls are visible. Put actual eye sockets on the moving head so the camera has a focus target.
2. Form each wing from two overlapping feather tracts. Narrow the outer primaries towards the tips. Lay the broader coverts across their roots. Give a feather a midrib and an asymmetric blade with thickness from a gently curved cross-section. Use the same feather geometry in the folded and open poses. For a full flight rig, add an elbow and wrist to each wing and fan the primaries as the wrist opens.
3. Give the legs a fixed contact point on the perch. Project each toe base onto the rock, orient the toes to its tangent and tuck the claws around it. Let weight shifts move the breast and hips. Keep the planted feet fixed until takeoff. The supplied study assumes a level perch. A curved rock needs a surface hit for each foot.
4. Animate settling, tail flicks and head turns on separate phases. Drive a hop by compressing the legs, launching the root, tucking the feet during flight and extending them just before contact. Ease a short recovery after touchdown. Keep time in seconds so the bird visits the same poses at 30 and 60 fps.
5. For close-ups, fit a small directional shadow camera around the bird, including the perch as a receiver. Match the depth pose to the visible feather pose. Grow the bias from the depth texel size and projection slope. Apply directional occlusion only to the sun contribution. Check for duplicate silhouettes when handing back to the coarse scene shadow.

## Try the rig

[Open the perch study](demo/index.html) and switch between Perch and Flight. The [reusable rig](demo/assets/wagtail.js) accepts your existing Three.js namespace. Add `makeWagtail(THREE).bird` to the scene, then call the returned `pose(seconds, flightWeight)` each frame. The weight ranges from folded (0) to open (1). The returned `eyes` are child objects in the animated head space.

Pause with the wings half open. Inspect the layering from both sides, then watch where the feet meet the stone during a landing. Back the camera out until the silhouette is small. The long tail and pale wing bars should still identify the wagtail. Compare to the wide and perched shots in [Momiji Creek](https://threeui.com/momiji-creek).
