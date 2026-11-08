# Audit and fix: find every mistake before video

A talking clip inherits every flaw of its start still, and moving video makes a wrong object obvious. Audit every pick
before it goes into video.

## The audit

- **Two independent fresh reviewers** (subagents that haven't seen your prompts), each given the still cut into 3×3 tiles
  at native resolution plus the whole frame. Verify each finding by eye yourself.
- Checklist, most common first:
  1. **Gear:** the wrong model or brand. Seedream draws an iMac with a chin (often with a logo) even when told "Studio
     Display, no chin". Also a black keyboard instead of a white one, a silver laptop instead of space grey, a laptop lid
     missing or rotated, a second monitor or laptop that isn't in your room.
  2. **Hair:** grey, white or silver at the sides, temples or fade; stray white strands; a silver sideburn.
  3. **Hands:** five fingers each, no ghost finger over the shirt, a natural gesture.
  4. **Light logic:** the key matches the window side; shadow stripes on the face match the stripes on the wall; lamps
     that glow light something.
  5. **Objects:** floating bulbs, duplicates, light stands or softboxes, a mic on the shirt (it leaks in from references).
  6. **Setting:** sand or haze indoors (desert looks), the window on the wrong side, the layout changed.
  7. **Face:** blotches, moles, spots; measured proportions.
- Leave alone (low impact or a style choice): garbled code on screens (soft at video resolution), stray cables, a busy
  background.

What a 16-still audit found in that project:
- High: iMacs in 5 stills, a silver sideburn, a black keyboard and mouse, a ghost finger.
- Medium: grey at the sides, a silver lid and an odd hand, MacBooks with missing or rotated lids, a second laptop and a
  floating bulb, sand indoors, white strands.

## The fix: one edit, then paste back only what was flagged

1. **One Seedream 5 Pro edit per still**, listing all of its mistakes in one prompt: "Edit the first image only. Keep
   everything exactly as it is, except: [replace the iMac with an Apple Studio Display (thin flat silver aluminium, a
   uniform thin black border, no chin, a slim aluminium stand)]; [make the keyboard and mouse white Magic Keyboard and
   Magic Mouse]; [remove the second laptop]." Fil: `edit_image` with `model: "seedream-5-pro"` (9 credits). Higgsfield:
   `seedream_v5_pro` with the still as the image reference (2.5).
2. **Paste back only the flagged rectangles** onto the original:
   ```bash
   swift scripts/lmjson.swift lm.json original.jpg
   python3 scripts/fix_still.py original.jpg edit.jpg fixed.jpg '0.52,0.30,0.80,0.62;0.10,0.70,0.30,0.95' --protect-face lm.json --match
   ```
   - The regions are fractions of the width and height.
   - The pasted regions have a feathered edge, and their colour is matched to the ring of the original around each one.
   - `--protect-face` masks the face core (eyes, brows, nose, mouth), so the face can't change.
   - It prints how far the edit drifted outside the regions, and phase correlation checks for a shift.
3. **Reject an edit that recomposed the frame.** One edit moved 472 px because it was also asked to clear the background.
   Redone with only the display and laptop, it aligned (drift 2.6).
4. A hair-only fault may need a second, hair-only pass.
5. Keep the originals (`approved/orig/`), and make a before/after sheet to show.

Free colour hacks failed in that project: darkening grey hair painted a blob, and tinting a lid caught the sand around it.
Use the edit + paste-back.

Cost: 16 edits × 2.5 = 40 Higgsfield credits (~$1.60), or 9 Fil credits ($0.09) each.
