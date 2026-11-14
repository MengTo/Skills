---
name: game-dev-character-model
description: Create a realistic, AAA-looking 3D character model for a game or web scene, from a description or a reference video/image, as a textured, rigged GLB standing in a relaxed pose in a lit three.js viewer. Covers designing an original character, the photoreal A-pose concept image, image-to-3D with Meshy or Tripo through Fil, rigging, posing in code, hangar-style lighting, headless capture, and the checks before showing it. Use when the user asks for a character model, a hero/heroine/NPC, "a model as good as X", a realistic human for a game, or to rig or pose a generated character.
---

# game-dev-character-model

Makes a character that holds up at game distance (full body to half body) in about an hour for roughly 85–100 Fil credits. Proven on two builds: a slim heroine in a fitted suit (`HTML Pages/heroine/`) and a broad engineer in a bulky work suit with belt gear (`HTML Pages/engineer/`).

## Why it looks good

Not polygon count. The same character looked identical at 310k and 150k triangles. What carries the realism, in order:

1. **The concept image.** Image-to-3D bakes the picture into the textures, so a photoreal concept with real material detail (weave, stitching, scuffed edges, skin pores) gives a photoreal model. A weak concept cannot be rescued later.
2. **4K PBR textures** with normal and roughness maps, so seams and scratches catch light without geometry.
3. **Lighting.** A dark scene with a cool key, a warm fill and two rim lights, ACES tone mapping and soft shadows. The same model under flat light looks like a toy.
4. **A natural pose.** An A-pose reads as an asset; arms down with a head turn reads as a person.

## Steps

Price every Fil run with `max_credits: 0` first, tell the user, and keep a running total.

### 1. Design an original character
If the reference is a character from an existing game, film or show, do not recreate it and do not download ripped assets. Say so, then design an original one at the same fidelity: a different face, hair, silhouette and colour scheme. Take only the quality bar from the reference.

When the reference is a video on X, get it through `api.fxtwitter.com/<user>/status/<id>`, extract frames with the ffmpeg in `imageio_ffmpeg`, and look at full-resolution crops before deciding anything.

Decide the standing height in metres (boots and headgear included); the viewer needs it.

### 2. Concept image (about 7 credits per image)
Make a Fil canvas (`create_canvas`), then `generate`, kind image, model `gpt-image-2.6-flare`, 2:3, 2k, quality high, count 2–4. The quote holds about 26 credits per image; it settles at about 7. The prompt must contain all of:

- "Full-body character reference for a AAA game, photorealistic real-time render quality"
- Face, hair, build, age, height and outfit in concrete terms, with named materials and wear (whatever the genre: fantasy, modern, sci-fi)
- "standing straight facing the camera, relaxed A-pose with arms about N degrees away from the body with a clear gap of background between arm and torso, fingers slightly apart, feet shoulder-width, whole figure inside the frame with margin". N is 35 for a fitted outfit, 45 when sleeves are bulky or there are belts, pouches, holsters or coat hems at the hips.
- "Front view, eye-level orthographic-style camera, no perspective distortion"
- "Even soft neutral studio lighting, no hard shadows, no rim light. Plain flat light grey background. No text, no logos, nothing held in the hands." Gear that is part of the character (tools, holsters, a sheathed blade) is fine when it is "strapped flat against the body".

Flat lighting matters: shadows and rim light in the concept get baked into the texture. Arms away from the body matter: arms against the torso fuse into it and cannot be rigged. Image models ignore where you ask gear to go ("on the back" came out on the hips), so pick the output with the cleanest hands and the widest gap between the hands and anything at the hips.

The output link serves WebP whatever the name. Save it as `.webp` and convert (`sips -s format png in.webp --out concept.png`) if you need a real PNG.

### 3. Image to 3D (60 credits)
`generate`, kind 3d, `inputs` = the chosen image's output id (from `check_node`), no rigging.

- `meshy-7.1` at resolution `4k` is what worked: about 310k triangles, 50 MB GLB, 4–5 minutes.
- `tripo-3.1` at `ultra` (77 credits) is finer on faces and hair, but on 12 Nov 2026 it failed with "403 not enough credit" on Fil's side. If it fails that way the credits come back; switch to Meshy rather than retrying.

A `generate` call can time out with an HTML "Inactivity Timeout" while the run still started. Call `check_node` on the node before retrying, or it is paid for twice.

### 4. Rig (10 credits)
`meshy-rig` with the model's output id as input. It returns 24 Mixamo-style joints (Hips, Spine, Spine01, Spine02, neck, Head, Left/Right Shoulder, Arm, ForeArm, Hand, UpLeg, Leg, Foot, ToeBase) plus non-joint `head_end` and `headfront` nodes, three clips (`Armature|clip0|baselayer`, `walk`, `run`), and a mesh cut to about 150k triangles (the file stays about 50 MB). There are no finger bones, so the hands keep their sculpted shape. List the joint names from the GLB's JSON chunk before posing; if they differ, rename them in the viewer.

Keep the unrigged GLB too: it is the full-detail version.

### 5. Viewer and pose
Copy `assets/viewer.html` to `<folder>/index.html` and set its per-character constants, `MODEL` (the rigged GLB) and `H` (height in metres), plus the `<title>`. Every setting can also be overridden in the URL: `?m=`, `?h=`, `?arm=out,foreOut,foreFwd`, `?clear=`, `?pose=a` (no pose), `?cam=x,y,z,tx,ty,tz` (a custom close-up in fractions of H), `?debug=1`. Camera views are fractions of H, so they frame any height.

Pose by direction, not by Euler angles, because the bones' local axes are arbitrary. `aim(bone, child, worldDir)` turns a bone so the segment to its child points along a world direction; `turn(bone, worldAxis, degrees)` adds a twist. The pose turns the chest about 5° and the head about 10° first, then `fitArm` places each arm: it starts from `ARM` (upper arm `[±0.30, -1, 0]`, forearm `[±0.20, -1, 0.27]`) and widens in 0.05 steps until the forearm and hand clear the hips, torso and thighs by `CLEAR` (2.5 cm), measured on the CPU-skinned mesh. The result is in `window.__arms` and the console: `out` (0.30–0.40 is a relaxed arm; both test characters landed at 0.30–0.35), `gapCm`, and two counts of mis-skinned vertices (see Traps). Leave the legs alone unless the feet are re-grounded afterwards. The breathing idle multiplies small offsets onto the posed quaternions.

If an arm runs to the 0.75 limit, it is not the pose: load with `?debug=1` and read which vertices stay closest at each step.

### 6. Serve, capture and check
Serve the folder over http (any static server; in the desktop app use `preview_start` with a `.claude/launch.json` entry). The Browser pane has WebGL disabled, so capture headless. `capture.mjs` loads `playwright-core` from the working directory, so install it once in a scratch folder and run from there:

```bash
cd <scratch> && npm i playwright-core
node <skill>/scripts/capture.mjs http://localhost:<port>/<folder>/index.html <out-dir>
```

It writes `full`, `tq` (three-quarter), `back`, `face` and `half` (pass a comma list as the third argument to choose), prints the arm fit, and exits non-zero on any page or console error. Then frame close-ups of both hips and anything near the hands with `?cam=` (for example `?cam=-0.75,0.5,0.6,-0.15,0.5,0` for the right hip), one new page per close-up.

Look at every image before sending. Check for:

- hands or forearms passing through the body or gear, and gear stretched toward a hand
- torn or collapsed mesh at the armpits and elbows
- feet on the floor, with a contact shadow
- a blown-out floor or face (lower exposure or the rim light, raise floor roughness), and skin tone against the concept: the cool key pales warm skin
- two views with the same file size, which means the render loop stalled and the frame is a duplicate
- no console errors (the viewer has an inline favicon, so a favicon 404 does not show up)

Send the A-pose and posed shots as a before/after pair, and say which view is weakest.

## Known limits, say them plainly

- **Face up close.** Skin is flat and eyes look painted in a tight close-up. Fine from half body outward. A close-up hero needs a MetaHuman base instead, which takes many hours.
- **One fused mesh.** Hair, clothes, gear and body are a single surface; nothing can be swapped or simulated without splitting it.
- **No fingers.** Gripping a tool or weapon needs grafted rigged hands.

## Traps

- **Gear that touched a hand in the A-pose is skinned to the arm.** The rigger gave hip-holster vertices to the forearm, so a plain distance check never cleared and pushed the arm out to a splayed 0.75. The viewer ignores arm vertices more than 0.075·H from the forearm-to-fingertip line (`stray`) and body vertices with over 10% forearm or hand weight (`tether`), since they move with the arm. Hundreds of either is normal for belt gear; look at the hip close-ups to see whether that gear stretches.
- **Fit the arms after turning the chest.** A 5° chest turn swings the hands several centimetres, enough to turn a 0.4 cm gap into 7 cm or the reverse.
- `page.waitForFunction` polls on animation frames and never resolves on a heavy skinned mesh. Poll with `page.evaluate` in a loop.
- A second `page.goto` on the same page hangs while the model renders. Switch views by clicking the view buttons on one page.
- `page.screenshot` times out under load. Read the canvas with `toDataURL` (the renderer needs `preserveDrawingBuffer: true`).
- Set `frustumCulled = false` on the skinned mesh and recompute its bounding box after posing, or the grounding and culling use the bind pose.
- Check `uptime` first. Captures slow down when other sessions load the machine; at load averages of 100–250 they still finished in a few minutes, so run them in the background and wait rather than debug.
