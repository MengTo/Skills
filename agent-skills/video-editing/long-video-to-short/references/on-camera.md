# On camera: the Avatar 6 twin, and Genjutsu only when needed

## The order

1. The voice exists and is approved.
2. The twin says each on-camera line from that sound. **Show the creator. Wait for their yes.**
3. Does this scene need more than the twin as they are? Usually no: go to the cut-out. Genjutsu only if necessary,
   and a shot that must look exactly like them (an intro, the first seconds) is always the real twin clip cut out.
4. If yes: a Genjutsu re-skin of the approved clip. **Show the creator. Wait for their yes.**
5. Cut out, seat, render.

Never the other way round, and never a general video model's draft of their face in between: a twin clip costs
cents and is them; a draft is a stranger who has to be argued with.

## The twin clip (HeyGen Avatar 6)

- **Their trained twin and one of its looks**, not a photo avatar: no set-up fee and it's the same person in every
  line. Pick the look once for the whole short (plain clothes, a plain or dark room cut out most cleanly).
- **Sound in, not text.** Give it the line's sound file, cut from the voiced paragraph. The mouth then follows the
  exact take the captions were timed from. Text would make a new, different read.
- **The voice** is their cloned ElevenLabs voice, with no tag.
- **1080p, 16:9.** The cut-out is drawn about 2,000 px wide in a 1080-wide frame, so 1080p is already past what the
  short shows.
- **Cut the line's sound generously.** Start at the section's first sound, end in the pause after its last word (or
  run on into the next sentence if the next section shows something else: the short only uses the part it needs).
  Record `line_at`, the second in the paragraph where the clip starts, in the plan.
- **Price:** about $0.10 a second at 1080p in our run (an 8 s hook about $0.80, a 2.7 s closing line $0.27). Quote
  it, get a yes, log it.
- **Look before showing:** the mouth closes on b, m and p; the eyes look into the lens and blink; the hands don't
  smear; the delivery matches the line (a hook can be lively, an ask is warm and direct). Redo a startled or flat
  take now.
- **Check the sync after rendering:** find a hard consonant in the line, step the rendered short and the twin clip
  to it; they should agree within a frame (0.02 s).

## When a scene needs Genjutsu (and when it doesn't)

Use the twin as it is when the person is simply *presenting*: over footage, beside a graphic, on the closing card.
That's most on-camera moments in a short, and every one in a short whose long video is a screen recording.

Re-skin with Higgsfield Genjutsu (motion transfer) only when the scene asks for one of these:

- **A costume from the world on screen** (the game's jacket or armour, a period outfit) that the long video already
  showed them in, so the short matches it.
- **A light the cut-out can't fake**: strong coloured light, a low key, a night scene, where the twin's flat studio
  light would look pasted on even after the grade.
- **A different framing or setting** than any of the twin's looks, for one beat.

One re-skinned beat is a statement; three is a habit that triples the cost and the faults. In our run the hook was
re-skinned and it took five drafts.

If the beat must look exactly like them, don't re-skin it: cut the real twin clip out over the background. It's free
and it can't drift.

How:

- **Start still:** the costume or world image, with **the person's face from a frame of an approved clip placed
  ahead of it** in the references. The costume image alone gave a rounder, different face. Describe their face and
  hair in words read from that frame, not from older stills, and say "no microphone". Show the stills; they pick one
  before any Genjutsu.
- **Drive:** the approved twin clip, with the eyes on the still's eye point and never closer than the still: its
  first frame has the still's eye spacing (about 0.78 of the twin's framing in our run). A drive closer than the still
  gave a big, startled head. Pad it to the next whole second: Genjutsu drops the tail past the last whole second.
- **Prompt:** "saying exactly: "…"", the delivery in a word or two, then what stays the same: "talks to camera the
  way he does in the reference video… use the reference video only for how he moves… his face stays the same man as
  in the start image… eyes relaxed… locked-off camera, real photographic look. No text, no captions."
- **Don't** add the person's real photos as extra images: they brought the photos' desk microphone into the scene.
- **Watch for props that catch light** (a sword, a visor): they flash from frame to frame. Prefer the plainer
  costume.
- **A 480p draft first** (about 3 credits a second), shown and approved, **then the 1080p final** (about 20 credits a
  second) with the same inputs, changing only what they asked. (Our run's re-skins were 720p, about 6-7 credits a
  second; that is no longer the default.) Price every step first, on the platform you'll run on (the same model costs
  differently on Higgsfield and in Fil), and run only on their typed yes.
- The re-skin replaces the picture only. The sound stays the voice file, so compare the re-skin's mouth with the
  twin's side by side before using it; if it drifted, redo it rather than nudging the clip. Measure the mouth first
  (closures on b, m and p; the envelope against the voice); only if it's weak, run Sync Lipsync 3 in remap mode and
  drop its repeated frames (`genjutsu-scene`, steps 6-7).

## Cut-out faults and what fixed them

| Fault a judge named | Fix |
|---|---|
| Hands and a desk mic see-through in some frames | `plates.py`: soft insides made opaque; the clip's median matte holds the still torso and mic below the chin |
| A bright ragged line of the old set along a dark shoulder | `plates.py` takes the inside's colour where a dark inside meets a much brighter edge; `--warm-edge` reaches further for a warm backlight |
| A rim of the old set on the hair | the matte is pulled in two pixels, then the edge colour is unmixed from the background |
| A square halo when they defocus in or out | blur premultiplied colour with a true Gaussian (`reel_draw.person`) |
| A sharp face half faded | arriving: opacity over 12 frames while focus resolves over 18; leaving: focus first, then opacity |
| Something in the footage growing out of their shoulder | push the background in and across (`base.sh` X and HEIGHT) |
| Grey, lifeless skin | keep saturation near 1; only tint, gain and a little of the scene's light on the edge (`plan.json` `grades`) |
| Still looks pasted on | what's left is real light: no rim or wrap from the scene. Pick a background whose light agrees with the twin's, or that beat is a case for a re-skin |

Vision's person matte is fast (a few frames a second) and good on a plain room. A slower portrait matting model
gives finer hair if the machine has time; the plates step is the same either way.
