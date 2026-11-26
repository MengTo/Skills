---
name: endless-riding-parallax
description: Use for motorcycle rides and endless runners that need nearby ground to pass quickly while a distant castle or mountain range moves slowly.
---

# Build an endless riding landscape

1. Keep cumulative travel as a JavaScript number. For constant speed use `distance = elapsedSeconds * speed`; for variable speed integrate velocity over elapsed time. Use this same station for the road, wheel contact, roadside plants and odometer.
2. Reuse a finite set of road and verge instances ahead of the camera. Return each instance to the far end only when it has cleared the visible region. Feed the GPU the remainder for each repeating period. Keep the integer cycle in CPU code when placement needs a stable seed.
3. Parent the castle, its foundations, the plains and the nearer mountain faces to one landscape transform. Apply that displacement to shadows, lighting probes and culling queries in the same frame. The depth of each feature determines its screen speed.
4. For a finite vista, use a small closed camera-relative move. Cloud Pass uses `x = 1.2*(1-cos(a))`, `z = 12*sin(a)` with `a = 2π*(t % 140)/140`. Position and velocity match across the join. Keep forward motion on the road running across this boundary.
5. Check a side view as well as a chase view. The relative motion is easiest to see where a nearby tree overlaps a distant roof. Check wheels against the ground separately when the landscape is displaced.

## Check the result

At the same focal length, a sideways displacement should move a marker at 10 units about ten times as far across the image as a marker at 100 units. At 139.99 and 140.01 seconds, the scenery should pass smoothly through its origin.

Run `node examples/check.mjs` from this skill folder for the numeric check.
