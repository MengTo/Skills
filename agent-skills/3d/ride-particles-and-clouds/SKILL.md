---
name: ride-particles-and-clouds
description: Use for forward motion through pollen, seeds or rain below moving 3D cloud layers. Tie the atmosphere to the terrain and the light.
---

# Light windborne particles under a 3D sky

1. Seed a fixed pool of instanced quads once. Give each a field station, altitude, wind phase and size. Start with mostly tiny grains and a few recognizable seeds. Cloud Pass uses 920 instances on desktop and 425 on smaller devices.
2. Advance the near population through a bounded depth volume using the road station. For a 34-unit corridor, `z = mod(seedZ + travel + flutter, 34) - 24`. Use positive modulo. Sample the terrain at the particle’s displaced position and add its altitude so the particles follow the slope.
3. Fade both ends of the wrap. Cloud Pass fades the far edge in field coordinates, then fades very near and very distant particles in camera depth. Change the sideways seed offset at the hidden boundary. Project the previous and current positions through their respective camera matrices for motion streaks. Reset that history after a seek or camera cut.
4. Sample 3D cloud density in world or weather coordinates. Move the noise with wind independently of the road. March each camera ray through the cloud layer up to the opaque geometry depth. At each step accumulate scattered light, then reduce transmittance by `exp(-density*stepLength)`. A lower-resolution cloud pass can be upsampled with scene depth to resolve rooflines.
5. Share the sun direction and weather state between the cloud scattering and particle highlights. Render transparent particles with depth testing and without depth writes. Let sunset and storm change the light on the seeds as well as the sky.

## Check the result

Pause travel and orbit. A seed should pass in front of or behind the rider according to depth, and a roof should occlude a cloud bank behind it. Inspect the nearest and furthest positions of one seed, then switch from daylight to low light and check the highlights.

Run `node examples/check.mjs` from this skill folder for the numeric check.
