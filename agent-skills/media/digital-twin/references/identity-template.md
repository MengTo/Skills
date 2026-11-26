# The identity block

One paragraph, pasted first in every prompt. It is the only description of your face; the references carry the rest.

## 1. Get a blind feature list

Give a fresh subagent (one that hasn't seen your prompts) your held-out frames J1–J5 and ask it to describe the face as a
casting director would, feature by feature, with the near misses it is **not**:
hairline · hair (colour, length, texture, direction, sides) · face shape (upper, lower, jaw, chin) · neck · eyes (shape,
lids, set) · brows · nose (bridge, tip, wings) · mouth (width, lips, Cupid's bow) · facial hair · ears · skin (tone with
cheek Lab on a 45 px patch, texture, shine) · age it reads · build.

## 2. Write it in this structure

Fill the brackets. Keep it to 250–350 words for Higgsfield, and a compressed ~1,900 characters for Fil, where all four
prompts together must stay under 4,000.

```
A real photograph of exactly the person in the reference photos, the same person, shot on a full-frame cinema camera at
eye level. Their features, which must match the references: about [age], [a grown man / woman, not young / not old],
[skin quality for the age]; [hair colour] hair [cut: sides, fade, length], [texture and how it falls, which side it goes
to "on THEIR left (camera right when they face the lens)"], [ends: blunt and soft / curls / waves], [sheen]; not [the
styles it is not: slicked back, combed, gelled, a quiff…]; [hairline]; [face shape: long/round/oval, cheekbones], then
[lower face: jaw shape, chin], not [square / wide / round / gaunt]; [neck]; [eyes: shape, lids, colour, set]; [brows:
thickness, shape, height]; [nose: length, bridge, tip, wings]; [mouth: width, lips colour and fullness, Cupid's bow];
[facial hair, if any: "a faint sparse dark stubble shadow"]; [ears]; [skin tone and undertone], [texture], [shine]. Head
upright, not tilted; relaxed expression, lips slightly parted as if mid-sentence. No freckles, no pigment spots, no moles,
no acne scars, no blemishes, not tanned [only those that are true]. Whatever the light, a soft diffused neutral fill on
the face keeps its tone [your tone]; the room may be warm, the skin is not orange. Use the reference photos only for who
they are, not for their room, light, clothes or microphone; the last [three] photos are their own room.
```

For talking stills, add a second paragraph:

```
They are caught mid-sentence, the way they really talk: the mouth moves very little, lips soft and only slightly apart,
the lower teeth just visible at most; a calm, warm, engaged expression; no wide-open or exaggerated mouth.
```

(Replace it with your own measured mouth if you talk with bigger openings: `references/speaking.md`.)

## 3. Rules learned the hard way

- **One fix, one phrase.** A version that added every judge fix scored ~0.25 lower. "Short chin" produced a longer chin,
  and "blue-black sheen" produced blue hair. Longer blocks over-correct.
- **Words become features.** "Grey scalp visible above the ears" and "grey stubble" turned into silver hair at the sides.
  Write "skin-toned scalp showing through the fade… no grey, white or silver hair anywhere on the head" and "faint
  sparse dark stubble".
- **Say the near misses.** "Not a quiff, not a pompadour, not slicked back, not gelled spikes" stopped the model's
  favourite hairstyles. Repeat these in every face edit: an edit without them turned the hair into a pompadour.
- **Hair direction in the subject's frame:** "over to THEIR LEFT side (camera right when they face the lens, whichever
  way they turn)". "Left" alone flips.
- **Age:** "about 42, a grown man, not young" fixed reading 38–40. "Faint soft lines under the eyes" can push older; drop
  it first if they look aged. "About 40, fresh and youthful… no deep lines" was the later fix when he said the video made
  him look older.
- **Skin:** never add "skin texture" or "detailed pores": they seed specks. "Fine even pores, a light natural shine on
  the forehead and nose" is enough.
- **Lips:** "naturally rosy-pink lips, a fuller lower lip" fixed thin pale lips; later "soft matte muted-pink lips" fixed
  glossy ones.
- **Eyes:** "heavy hooded upper lids covering the crease on both sides, brows low and relaxed" stopped the model opening
  the lids and raising the brows, which made him look surprised and older.
- **Lower face:** "full cheeks just under the cheekbones, then lean through the lower face: the jaw narrows in a soft V
  to a narrow, softly pointed chin; not square, not wide, not round; not gaunt". Without "not gaunt" you get hollow
  cheeks.

## 4. Version it

Save each version (`prompts/identity-v1.txt` …) with the round it was used in and its blind scores. Change it only
between rounds, never mid-round, so results compare. In that project v5 made the first approved shots, v7 the best
blind score, and v140 (the compressed one, with no grey and a small mouth) every pick in his room.
