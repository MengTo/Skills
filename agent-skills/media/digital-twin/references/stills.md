# Stills: the prompt stack

## Model

**Seedream 5 Pro** for every image of the face, new or edited.
- On Fil: model `seedream-5-pro`, 16:9, 2k, 12 credits; edits with `edit_image` and `model: "seedream-5-pro"` (Fil
  defaults to Nano Banana), 9 credits.
- On Higgsfield: `seedream_v5_pro`, 2.5 credits, up to 10 image references, at most 8 jobs at once on Plus.
- Per still in dollars: Fil $0.12 (that's BytePlus's own cost: $0.09 + $0.003 per extra reference), Higgsfield ~$0.10
  on Plus annual, $0.13–0.14 at top-up rates. About the same: pick the platform for the workflow, not the price.
- Why Seedream: in blind rounds it beat Nano Banana on identity (7.8 against 7.1). Nano Banana kept inventing acne
  pitting, spots and combed hair.

## The 4-part prompt stack

On Fil, make one prompt node per part, joined in this order into one `seedream-5-pro` node per shot. With the CLI,
join them with blank lines (`scripts/make_round.py` does it from a SPEC file).

1. **Identity**, the same in every shot (`identity-template.md`).
2. **Workspace**, shared by the round's three shots:
   ```
   Scene: their own [studio / office / room] from the last three reference photos, the same furniture and layout, the
   walls [colour]: [floor], [desk: material, top, riser], [shelves and what's on them], [windows: blinds, curtains, the
   view], [seating], [plants]. Lit like a cozy high-end creator film: [the look: warm amber practical lamps, the ambient
   light and shadows with a muted olive-green earthy cast…]; a soft warm key on their face from camera [left/right].
   Their mic arm is out of the shot.
   ```
3. **Shot**, one per image:
   ```
   Time: [early sunrise, the first low golden sun slanting through the blinds… / evening, the last deep blue dusk outside,
   inside only the warm lamps glowing]. Camera: a [50]mm lens at f/[1.8] [on the desk beside the monitor / a metre to
   the left / from just above eye level over the monitor], at [their eye level] about [two] metres away[, looking back
   across the room]: a [medium shot from the waist up / chest up / close-up], their head three-quarters toward camera
   [right], looking just past the lens at someone beside the camera [or: facing the lens and talking straight into it
   with warm eye contact, head upright], their hands up in a relaxed gesture; [one or two object moves: a mug and a
   plant moved, a cushion on the sofa, a warm lamp glowing on the shelf behind them].
   ```
4. **Gear + finish**, the same in every shot, always last:
   ```
   Their gear where it shows: [the exact models: "an Apple Studio Display (thin flat silver aluminium, a uniform thin black
   border, no chin, a slim aluminium stand)…"]; no [the wrong models it draws: "no iMac"], no other brands; screens dim
   with a dark-mode [editor / app]. [Wardrobe], no microphone on them. Shot on a full-frame cinema camera, very shallow
   depth of field, creamy bokeh, face, eyes and hair tack sharp, a warm filmic grade with rich blacks and fine grain. No
   light stands, softboxes or tripods in frame. No text.
   ```

Why four parts: the room and the finish stay word-for-word the same, so the only thing that changes between shots is
the shot itself. That's what keeps a set consistent, and what lets you see what a change did.

**References,** wired into the same node, in order: the lean set (or front frames for eye contact), then the three room
photos last.

## Batches of three

- Generate 3, look, measure, ask which are you, then build the next 3 from the picks: "143–145 around 140 (same room,
  light, refs; camera only)".
- Spread a batch: a 3/4 past the lens, an eye-contact shot, and a new camera position or a new time of day.
- Name each shot with its number and its change, so a pick is one line ("144 145 are good").
- Lay each batch out on the canvas in its own section ("★ Score these · 164–166 · new angles at evening and early
  sunrise"), with a note on each image: its recipe, its measured proportions and its audit findings.
- Move picks into a KEEP section, with ✓ in the title and the person's own words in the note.

## Commands

Fil (MCP): `add_prompt` ×4 (or reuse the shared ones), `add_node` kind image, model `seedream-5-pro`, aspect 16:9,
resolution 2k, wired with `connect` from the prompts and the reference file nodes; `generate` with `max_credits: 0` to
price, then with a budget; `check_node` with `wait` for the result.

Higgsfield CLI (bash; in zsh put the flags in an array, because an unquoted `$FLAGS` doesn't split):
```bash
python3 scripts/make_round.py round.json rounds/r04/prompts
scripts/run_round.sh rounds/r04 10 "round 4 · evening + sunrise"    # runs, logs the spend, makes a numbered sheet
```

## Framing limits

- Seedream holds framing near medium whatever the lens says. "35mm a bit wider" barely changed it; "28mm wide" came out
  medium-wide. For a wide shot say "their face about a fifth of the frame width" and use the wide refs.
- A side camera plus a turn to the lens drifts off the person. Keep 3/4 shots past the lens, and frontal shots square to
  the lens.
- 85 mm at eye level for close shots; 50–65 mm for medium; 35 mm only from slightly high with eye contact.
- Retired framings: a 135 mm near-profile against a backlit window (reads as someone else), a 35 mm wide with them
  twisting toward the lens (lower face wide, lids open), square-on with flat front fill, a profile toward a monitor at
  night (gaunt, wet-looking hair).

## Optional passes

- **A face-only edit** when the shot is right but the face is slightly off: a Seedream edit with the image first, then the
  lean refs. "Edit the first image only… Keep the first image exactly as it is: [framing, pose, light, room, clothes].
  Change only their face and hair so they match the person in the other reference photos exactly: [the identity
  sentences for the faults you see]. Do not change anything else." Include the hair don'ts. It added about +0.25 blind.
- **A chin warp** (`scripts/warp_face.py IN.jpg LM.json OUT.jpg --lift 16`, needs numpy, scipy, Pillow): a wash. It won one blind round and lost the next, because judges
  read chin length relative to the other versions in the set.
- **Colour-only film grades** (`scripts/film_grade.py br2049-orange|br2049-neon|dune-arrakis|dune-caladan in out`) for
  a quick look. Lighting the look into a new generation reads better.
