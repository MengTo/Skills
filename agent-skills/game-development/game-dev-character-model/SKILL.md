---
name: game-dev-character-model
description: Create a realistic, AAA-looking 3D character model for a game or web scene, from a description or a reference video/image, as a textured, rigged GLB standing in a relaxed pose in a lit three.js viewer. Covers designing an original character, the photoreal A-pose concept image, image-to-3D with Meshy or Tripo through Fil, rigging, posing in code, hangar-style lighting, headless capture, and the checks before showing it. Use when the user asks for a character model, a hero/heroine/NPC, "a model as good as X", a realistic human for a game, or to rig or pose a generated character.
---

# game-dev-character-model

Makes a character that holds up at game distance (full body to half body) in about an hour for roughly 100 Fil credits.

## Why it looks good

Not polygon count. The same character looked identical at 310k and 150k triangles. What carries the realism, in order:

1. **The concept image.** Image-to-3D bakes the picture into the textures, so a photoreal concept with real material detail (weave, stitching, scuffed edges, skin pores) gives a photoreal model. A weak concept cannot be rescued later.
2. **4K PBR textures** with normal and roughness maps, so seams and scratches catch light without geometry.
3. **Lighting.** A dark scene with a cool key, a warm fill and two rim lights, ACES tone mapping and soft shadows. The same model under flat light looks like a toy.
4. **A natural pose.** An A-pose reads as an asset; arms down with a head turn reads as a person.

## Steps

### 1. Design an original character
If the reference is a character from an existing game, film or show, do not recreate it and do not download ripped assets. Say so, then design an original one at the same fidelity: a different face, hair, silhouette and colour scheme. Take only the quality bar from the reference.

When the reference is a video on X, get it through `api.fxtwitter.com/<user>/status/<id>`, extract frames with the ffmpeg in `imageio_ffmpeg`, and look at full-resolution crops before deciding anything.

### 2. Concept image (about 27 credits)
Fil `generate`, kind image, model `gpt-image-2.6-flare`, 2:3, 2k, quality high. It quotes up to 105 credits for a batch of four but settled at 27. The prompt must contain all of:

- "Full-body character reference for a AAA game, photorealistic real-time render quality"
- Face, hair, build and outfit in concrete terms, with named materials and wear
- "standing straight facing the camera, relaxed A-pose with arms about 35 degrees away from the body, fingers slightly apart, feet shoulder-width, whole figure inside the frame with margin"
- "Front view, eye-level orthographic-style camera, no perspective distortion"
- "Even soft neutral studio lighting, no hard shadows, no rim light. Plain flat light grey background. No text, no logos, no weapons, no props."

Flat lighting matters: shadows and rim light in the concept get baked into the texture. Arms away from the body matter: arms against the torso fuse into it and cannot be rigged. Pick the output with the cleanest hands and the clearest gap between arms and body.

### 3. Image to 3D (60 credits)
Fil `generate`, kind 3d, wired from the concept node, rigging off.

- `meshy-7.1` at resolution `4k` is what worked: about 310k triangles, 50 MB GLB, 5 minutes.
- `tripo-3.1` at `ultra` (77 credits) is finer on faces and hair, but on 12 Nov 2026 it failed with "403 not enough credit" on Fil's side. If it fails that way the credits come back; switch to Meshy rather than retrying.

A `generate` call can time out with an HTML "Inactivity Timeout" while the run still started. Check `get_canvas` before retrying, or it is paid for twice.

### 4. Rig (10 credits)
`meshy-rig` wired from the model node. It returns 24 Mixamo-style bones (Hips, Spine02, Spine01, Spine, neck, Head, Left/Right Shoulder, Arm, ForeArm, Hand, UpLeg, Leg, Foot, ToeBase), walk and run clips, and a mesh cut to about 150k triangles. There are no finger bones, so the hands keep their sculpted shape.

Keep the unrigged GLB too: it is the full-detail version.

### 5. Viewer and pose
Copy `assets/viewer.html` next to the GLBs (`assets/heroine-rigged.glb` by default, or pass `?m=`). It has the light rig, floor, bloom, the four camera views, a turntable, and the pose code.

Pose by direction, not by Euler angles, because the bones' local axes are arbitrary. The viewer's `aim(bone, child, worldDir)` turns a bone so the segment to its child points along a world direction, and `turn(bone, worldAxis, degrees)` adds a twist. A relaxed stand is: upper arms `[±0.30, -1, 0]`, forearms `[±0.20, -1, 0.27]`, chest turned 5°, head turned about 10°. Leave the legs alone unless the feet are re-grounded afterwards. The breathing idle multiplies small offsets onto the posed quaternions.

Re-fit the arm directions for each character: hands must hang clear of hip pouches, holsters and coat hems.

### 6. Capture and check
The Browser pane has WebGL disabled, so capture headless:

```bash
node scripts/capture.mjs http://localhost:<port>/<folder>/index.html <out-dir>
```

Look at every image before sending. Check for:

- hands or forearms passing through the body or gear
- torn or collapsed mesh at the armpits and elbows
- feet on the floor, with a contact shadow
- a blown-out floor or face (lower exposure or the rim light, raise floor roughness)
- two views with the same file size, which means the render loop stalled and the frame is a duplicate

Send the A-pose and posed shots as a before/after pair, and say which view is weakest.

## Known limits, say them plainly

- **Face up close.** Skin is flat and eyes look painted in a tight close-up. Fine from half body outward. A close-up hero needs a MetaHuman base instead, which takes many hours.
- **One fused mesh.** Hair, clothes and body are a single surface; nothing can be swapped or simulated without splitting it.
- **No fingers.** Gripping a weapon needs grafted rigged hands.

## Traps

- `page.waitForFunction` polls on animation frames and never resolves on a heavy skinned mesh. Poll with `page.evaluate` in a loop.
- A second `page.goto` on the same page hangs while the model renders. Switch views by clicking the view buttons on one page.
- `page.screenshot` times out under load. Read the canvas with `toDataURL` (the renderer needs `preserveDrawingBuffer: true`).
- Set `frustumCulled = false` on the skinned mesh and recompute its bounding box after posing, or the grounding and culling use the bind pose.
- Check `uptime` first. With a load average above about 20 from other sessions, captures stall; wait rather than debug.
