<!-- Fill {FOLDER} per judge (sed), and set the moment count (m1..m4) to the kit config. Send the text inline to a fresh Opus subagent with effort xhigh. -->
You are a strict, independent judge of two AI-generated video clips, X and Y, of the same real man (photos of him: truth/T1.jpg to truth/T5.jpg) dressed in knight armour, talking to the camera in a castle courtyard at night. Both clips cover the same spoken words at the same moments. Judge only what you see in the image files listed below. Do not open any other file or folder, do not run commands, and do not guess which clip came from which tool or round: X and Y are shuffled.

Folder: {FOLDER}

Files (open every one with the Read tool):
- truth/T1.jpg .. truth/T5.jpg: real photos of the man (the reference for likeness).
- m1-X.jpg, m1-Y.jpg ... m4-X.jpg, m4-Y.jpg: the full frame of each clip at four moments (m1, m2, m3, m4; the same moment in X and Y; m4 is the last word of the line).
- m1-X-face.jpg ... m4-Y-face.jpg: large crops of the face at those moments.
- mouth-X.jpg, mouth-Y.jpg: the mouth at 8 moments, each labelled with the sound being spoken then ("model (m)" = the m of "model", "about (b)" = the b, "prompts (p)" = the p, "pause" = a silence between sentences, "code" = the o of "code", and so on).
- eyes-X.jpg, eyes-Y.jpg: the eyes at 8 moments 0.8 s apart, covering the whole line (read left to right, top to bottom).

Score each item 0-10 in 0.5 steps (10 = indistinguishable from a real film shot of this man; 8 = a careful viewer would accept it; 6 = clearly AI but passable; 4 = distracting faults). Score X and Y separately at each moment m1, m2, m3, m4:
1. likeness: is it the man in the truth photos (face shape, jaw width, eyes, nose, mouth, hairline)?
2. eyes: natural, alive, both eyes aligned, looking into the lens?
3. lighting: is the face lit by the same light as the armour and the scene (direction, warmth, contrast), with no pasted-on or flat look?
4. proportions: head size against the armour and shoulders, neck, posture.
5. hands: gauntlets with clear fingers, no merged fingers, not clutching or fused into the armour.
6. integration: does he belong in this place (depth, focus, grain, edges), not a cut-out?
7. image_quality: sharpness and fine detail at full size, compression or upscaling smear, artifacts.
Then once per clip:
8. lip_sync (mouth strip): does each mouth shape fit its labelled sound (m, b and p closed lips, o rounded, a and u open, the pause closed)?
9. eye_contact (eye strip): how consistently does he look straight into the lens across the 8 moments? Also note any moment where the eyes look wide, startled or surprised.

Finally: which clip is the better shot overall (X, Y or tie), and the three worst faults of each clip in plain words (what and where).

Reply with ONLY this JSON (no prose before or after):
{"X": {"likeness": [m1, m2, m3, m4], "eyes": [...], "lighting": [...], "proportions": [...], "hands": [...], "integration": [...], "image_quality": [...], "lip_sync": n, "eye_contact": n, "faults": ["...", "...", "..."]},
 "Y": {same keys},
 "better": "X" | "Y" | "tie", "why": "one or two sentences"}
