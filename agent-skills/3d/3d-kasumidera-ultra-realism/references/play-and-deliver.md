# From playable scene to a verified take

## Play the route

In the sanctuary, moving the mouse controls the view. WASD walks, holding Shift runs, Q and E turn left and right. Keep look controls suspended while a modal owns the pointer. The HUD is compact HTML, the map opens on demand, and the game begins with a 3D field journal at the gate. For a different game, preserve its input conventions.

Use three tests for the bridge. Cross its center and sides, approach both railings at an angle, and look underneath from the ravine. Sample the actual timber top and compare it with the walking surface. In this game the largest measured discrepancy at deck hits was 5.1 mm. That number is an observed result for this bridge. Choose tolerances for the new player's body and step solver.

## Make the journal behave like a bound object

Use a cover hinge, a fixed spine, a stack of individually indexed leaves, two printed faces per leaf and a thin edge. Bend successive strips from the spine, preserving strip length through the curl. Keep the spine, scale and canvas aspect fixed for the whole turn. Paint the stamps into the cover material or fit a thin decal to the surface. Preserve the broken transparent ink edge. Anchor each ribbon under the cover, constrain its length, and give its free end damping and clearance from the text.

Keep three values distinct: the selected spread, the continuous bend amount, and the destination chosen by the active gesture. While dragging inward, move the bend with the pointer. Once deliberate travel passes the commit threshold, latch the destination. When fully turned, keep that leaf on its destination side. On release or lost capture, settle monotonically to the latched spread. Reject a stale final sample that would drag a completed leaf back. Let a short uncommitted nudge settle to its starting spread.

Check both directions, a release that repeats an older coordinate, full travel followed by retreat, lost capture, and a small nudge. Verify the page number **and the leaf geometry after settling**. Also check page-region taps, keyboard navigation, closed cover, bookmark drag and click outside. Give the gesture to one owner at a time. Do a fresh check on a narrow screen where changing footer controls could resize the book.

## Mix sound against action

Start browser audio on a player gesture. Give the user a mute control. Begin with a continuous music and outdoor bed, fade water up near the ravine, and tie footsteps to distance actually traveled. On the repair boards, mix a short wooden contact under the footfall. Trigger a paper swish when the leaf starts to move. A rustle can peak after the onset while the paper is still curling.

Kasumidera used the creator’s Seerveil library, Earshot paper and wood effects, and the shrine’s original bell. Use the project’s own licensed library for a new game. Record music attribution and edits. With Earshot available, compare plausible candidates, inspect cue onsets and peaks against picture, then measure the decoded master. The example 40-second stereo mix measured −18.8 LUFS integrated and −1.5 dBTP. Judge audibility against the intended use, especially if narration will be added.

## Check real-time detail and capture separately

1. Record the camera zoom, CSS dimensions, drawing buffer and device pixel ratio. Test the actual device. Keep fine geometry native and adjust the fog pass or distant LODs first when slow frames warrant it.
2. For an export at 4K/60, lock a 3840 × 2160, 16:9 render before the first frame. Size each journal or HUD surface to the aspect of its own drawing buffer. Uniformly composite it into the final frame. Check the closed cover, mid-turn and settled spread against the same live poses.
3. Capture through the chosen recorder. The project used the Codex browser and DreamCut. When live playback drops frames, a fixed 1/60-second simulation replay and verified pickups can preserve timing. Validate the first frame, a fast turn and the last frame by comparison with the rendered source.
4. Read the delivered file back. A 40-second take at 60 fps contains 2,400 pictures. Check decoded frame count, timestamp cadence, aspect, repeated or missing pictures, audio length and sync at multiple positions. A nominal frame-rate tag alone cannot demonstrate motion cadence.

```sh
ffprobe -v error -count_frames \
  -show_entries stream=codec_name,width,height,sample_aspect_ratio,display_aspect_ratio,avg_frame_rate,nb_read_frames,duration,sample_rate,channels:format=duration \
  -of json game-walkthrough.mp4
```

## Keep the tutorial reproducible

For each round, record the creator’s steering, model or scan source, fixed camera, before/after frame, physical change, review result and decision. Label a proposal as a proposal. Keep the best intermediate take when the newest one regresses. A tutorial cut can show the rejected silver deck beside the restored brown deck at the same time of day.

For a requested Fil handoff, gather the screenshots, prompts, review notes, shot timeline and credit lines into the designated section. Run the requested compression workflow on **review copies**. The project supplied H.265 MP4 and VP9 WebM alongside a full-resolution master. Verify playback, duration, dimensions and the intended audio track after compression. For a standalone HTML delivery, open the exported file with its embedded textures, modules and sounds, and walk the same route again.
