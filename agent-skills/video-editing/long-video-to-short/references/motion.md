# Motion rules, in numbers (60 fps, 1080 × 1920)

All of it is in `scripts/reel_draw.py`. If the long video has its own motion language, match these to it instead.

**Layout.** Headline top-left at x 52, y 232, up to 955 px wide. Captions left at x 77, last baseline y 1444, lines
113 px apart, up to 826 px wide, type at most 103 px and shrunk to fit. A dark shade behind the headline (top 620 px)
and under the captions (darkest y 1445–1575). Keep everything read between y 280 and 1640: the platforms' own
buttons cover the rest.

**Headlines** (`heading`): a condensed bold italic in capitals (we used Archivo SemiBold Italic), cream with one word
in orange, 200 px.
- In: 14 frames expo-out; opacity over the first 8; a 12 px blur resolving; tracking in from +0.17 em (+0.07 em when
  the line is wider than 880 px, so it never leaves the frame); a 24 px rise.
- Out: 8 frames into a 10 px blur, finished before the next one starts. Two headlines never overlap.
- It lands six frames before the word it names, never after it.
- Frame 0 is the cover: its headline is already set and only settles a little tracking.

**Captions** (`Captions`, `say`): a regular-weight sans (Geist Regular), letter spacing −0.035 em, no stroke, a soft
dark glow behind.
- Pages of one or two lines, two to four words a line, a phrase a page.
- Each word lights two frames before its sound (a late highlight reads as lag) and never on the same frame as
  another.
- A page's first word is lit from its first frame. The spoken word warms from cream to orange over 4 frames with a
  5 px lift, and cools over 5 when the next starts. No bounce, no hard flips.
- Words rise out of their line's own mask, two frames apart, over 15 frames as a soft focus resolves.
- A page flip: the old page lifts 10 px and fades over 4 frames as the new first word rises.
- A new page starts 5 frames before its first word, or on the picture cut if one falls in the pause.

**The person** (`person`): arrives over 18 frames (opacity over the first 12, focus from a 28 px blur), leaves over
about 20 (focus first, then opacity), with a soft contact shade behind and the bottom 7% feathered into the caption
shade.

**Numbers** (`count`): ease up over 36 frames and settle on the number as it is spoken.

**Joins.** Cut on a word. A dip to dark, if the long video uses one: 12 frames down, 4 black, 18 up. The end card
holds about a second of silence after the last word.
