---
name: release-threeui-demo
description: Release an interactive web project on ThreeUI with a direct HTML preview, a verified 4K60 MP4, three open-source technique skills, and platform-specific Fil drafts for X, Threads and LinkedIn.
---

# Release a ThreeUI demo

Use this for the launch of a working project. Start from the user's requested stages and any release already in progress. A request to write or update this workflow delivers the skill itself. Run a launch when the user asks to release a project.

## Establish the release

Identify the build revision, the model the user actually used, the thing they built, and one interaction a viewer can reproduce. Confirm the project slug, catalog category and access tier from the request or existing entry. Locate the intended Fil canvas and post. Carry their identifiers forward on retries. A duplicate canvas name needs an owner or a link to disambiguate it.

For a draft-only rehearsal, prepare the build, skill folders, recording and captions locally. Save to Fil if requested. A request for social drafts alongside an authorized ThreeUI and GitHub release permits those named releases. Track pending URLs in the handoff and insert verified links before marking a caption ready.

Track revision, model credit, master filename and hash, live preview URL, three skill URLs, Fil node and media IDs. If someone edits the project before release, check which recordings, skills and claims the change affects.

## Record the project in 4K at 60 fps

1. Rehearse the requested sequence on the working build. Frame the interaction target and the result together. For Studio Glass, a lighting change across the whole room, pulling the blinds and lifting the pen each show something different. Honor the user's shot order and final state.
2. Capture the browser content at **3840 × 2160**, for example a 1920 × 1080 CSS viewport at device scale 2. Check the WebGL backing buffer and exported frames. Capture native 60 fps when the machine sustains it. For a heavy scene, advance the animation clock in 1/60-second steps, dispatch real pointer events, wait for the renderer to present each frame and stream frames into the encoder. Exclude the browser chrome and loading screen unless they are part of the demo.
3. Export an H.264 MP4 with a 4:2:0 pixel format and fast start. Keep this social master separate from ThreeUI's smaller catalog previews. Play the press, drag and final state at normal speed. Watch for repeated frames during motion, misplaced clicks and a soft canvas. Metadata alone cannot detect an upscaled or duplicated-frame capture.
4. Run the bundled check against the master. It decodes the video, checks presentation timestamps and prints a receipt with frame count, duration, bytes and SHA-256.

   ```sh
   python3 scripts/verify_master.py "/path/to/demo.mp4"
   ```

## Create three technique skills

Choose three independently reusable techniques demonstrated by the build. For Studio Glass they were background refraction, the button-press shader and the lit Three.js workspace. Use the release's own techniques for another project. Keep the workflow skill separate from the three deliverables.

For each technique, inspect the corresponding implementation, check the destination for an existing skill, and create or improve its skill folder. Give it a trigger, the implementation steps that affect the outcome, and a small reproducible check. A refraction check might drag the glass across a straight window mullion and inspect how the edge bends. Validate each skill and exercise its example. When publishing the skills is in scope, push them to the agreed skills repository and verify each of the **three folder URLs** against the published revision. Only then describe them as open source.

## Publish the interactive HTML on ThreeUI

- Register or update the item in the requested category and tier. Package the editable project through ThreeUI's source delivery for that tier. Use the catalog's current media pipeline for its thumbnail, gallery video, detail video and runtime assets. Follow the release checkout's upload budget. The social MP4 belongs in Fil.
- Register the authored, hosted HTML as the catalog item's `liveSiteDocument`. In the current ThreeUI catalog, `showsLiveSite` uses that field to select the live HTML frame on the fullscreen route. Use an existing hosted scene as the template. Keep the gallery video in its own preview field.
- Use the catalog's generated short preview path as the social URL, for example [Studio Glass](https://threeui.com/studio-glass). Keep the category detail URL for documentation and Pro source access.
- After deployment, open that **exact short URL** as a signed-out visitor. Wait for the controls, perform an interaction and verify its visible result. For Studio Glass, select Sunset and verify the scene and intensity change. Check that the renderer and textures load from the configured media origin. Verify the private source gate for a Pro release. A successful HTTP response or a working underlying HTML file alone misses a short route that still plays a video.

## Prepare the social post

Use one Fil social-post node with three platform variants. Put the same verified MP4 on each. Each caption leads with the credited model, what was built and a visible result. Use the direct preview URL in the tweet itself. See [Fil upload, copy and readback](references/fil-posts.md) for the node format, platform edits and link counts.

| Platform | Caption and links |
| --- | --- |
| X | One post. Include the demo and all three named skill links in its main text. Shorten the prose to fit the platform counter. |
| Threads | One shorter post. Include the demo and two skill links. Choose the pair that best explains the build, such as refraction and the room. |
| LinkedIn | One professional post. Explain the model's role, one implementation decision and what the viewer can try. Include the demo and the relevant named skills. Include all three for a resource share. |

Save drafts unless the user asks to schedule or publish to named platforms. Verify each saved variant and its attachment in Fil. If a tweet is published, open the returned X status URL, check the account and post, and include that permalink in the release handoff. If the user supplies an existing tweet URL, verify and use that specific link where requested. Distinguish the demo URL shared *inside* the tweet from the permalink *to* the published tweet.

Hand back the live preview, the 4K60 master or its receipt, the three skills and the Fil post link. State which platform drafts were saved and which posts were actually published.
