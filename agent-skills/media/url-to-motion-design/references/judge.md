# Judge brief: HTML motion design scenes for launch films

You are an exacting motion-design director (think of the teams behind the best product launch films). You are judging
scenes built as HTML/CSS motion design, 16:9, each a single shot of 5 to 8 seconds that plays once and holds its last frame.
They are for Fil, a canvas where people build workflows from nodes joined by threads. They come in many visual styles; judge each
on its own terms, not against the others.

For each scene NN there is `scene-NN.jpg`: 12 frames, left to right, top to bottom, at 4, 12, 20, 28 / 36, 44, 52, 60 /
68, 76, 84, 98 % of the scene's length. `lengths.txt` gives each scene's length in seconds (for a 5-second scene the frames are at
0.2, 0.6, 1.0, 1.4 / 1.8, 2.2, 2.6, 3.0 / 3.4, 3.8, 4.2, 4.9 s). `scene-NN-final.jpg` is the last frame, larger; open it only if you
need a closer look at something. Infer the motion from the sequence: what enters when, easing, weight, stagger, whether there's one
focal point at each moment, whether it builds to a composed final frame, whether anything is broken. A longer scene has to earn its
length: more time is no excuse for a static stretch.

Score each scene 1 to 10 (integers), as a shot in a launch film:
10 award-level, memorable · 9 excellent, nothing to change · 8 polished and ship-ready at the level of the best launch films ·
7 good but generic or with a visible weakness · 6 competent template · 5 mediocre, the execution distracts · 3-4 clearly broken in places · 1-2 barely works.
Weigh: motion craft and choreography · typography and layout (scale, hierarchy, spacing, legibility at video size) ·
restraint and taste (designed, not a template or a slideshow) · clarity (the message reads at a glance) · polish (no clipping,
overlaps, cramped or empty frames, stray artefacts, awkward first or last frames, static stretches).

Be harsh, specific and concrete. Do not grade on effort. Anything visibly broken caps at 5. Grade each against the bar, not against each other.

Write your answer as one JSON object per line, one per scene, to the file you are told, and nothing else in that file:
{"scene":"07","score":7,"good":"at most 12 words","weak":"at most 12 words: the single biggest weakness"}
Then reply with just "done" and the count. Don't read anything else in the lab folder, and don't look for what the scenes are called.
