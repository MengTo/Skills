---
name: perching-butterfly
description: "Animate a small 3D butterfly that banks in flight, approaches an actual plant surface, settles with hinged wings and takes off when disturbed."
---

# Perching Butterfly

Parent the thorax and four wing surfaces to a body group. Place wing pivots at the thorax and mirror their local flapping axes. Shape the leading and trailing edges separately. Bend the hindwings slightly later than the forewings. Keep a leg or underside reference point for contact.

Store the perch in the plant's local coordinates. Calculate it from an upward face or branch sample, offset along the surface normal to clear the moss, and update its world pose after any plant transform. When landed, bring the feet to that anchor and preserve a readable dorsal angle. Blend orientations with quaternions and a time-based damping factor.

Move the butterfly through four states. Cruise between nearby waypoints, approach on a shallow curve, settle with smaller wing beats, then take off on a short upward arc. Derive banking from turn rate. Allow the pointer near the perched insect to trigger one takeoff, with hysteresis or a cooldown. A brief landing timeout should steer the insect home without causing a position jump.

Force a landing during review. Orbit past a side view and check for floating feet, backwards approach, crossed wing hinges, and penetration on takeoff. Under reduced motion present the butterfly perched with open wings.

Open [the interactive study](demo/index.html) to inspect the technique.
