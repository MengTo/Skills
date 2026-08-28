---
name: compose-motion-frames
description: "Compose and proportion a motion-design frame — title cards, stings, brand idents, scene beats, social cutdowns — so it reads as film rather than as a landing page. Use when a motion piece feels like a web hero, when one message has to survive 16:9, 1:1, 4:5 and 9:16, when type and subject need proportioning against the frame instead of the viewport, or when a placeholder message will later be replaced by someone else's words."
---

# Compose Motion Frames

A motion frame and a page hero can contain the same words and still read completely
differently. This skill is about the difference: **proportion, element budget, and where
the air goes.** It says nothing about timing — for beats, easing, continuity and
deterministic seeking use `craft-motion-design-scenes`.

## Use When

- A motion piece "looks like a landing page" and you cannot say why.
- One message has to hold across several aspect ratios.
- A subject (product, object, 3-D render, photograph) shares the frame with a statement.
- The message is a placeholder that someone will replace with longer words.

## The Tell

These five habits are what make a frame read as a web page. Each has a fix.

| Page habit | Why it reads as a page | Frame fix |
| --- | --- | --- |
| Wordmark → headline → hairline rule → subtext | That stack *is* a hero section | Drop the rule. Three text nodes maximum |
| Copy flush to a narrow left rail | A rail implies a column of content below it | Give the message its own half of the frame, optically centred in it |
| Statement at 6–8% of frame height | Sized for reading distance, not for a screen across a room | 8–14% of frame height |
| Wordmark set as a wordmark | A logo in the corner is chrome | Set it as a chapter label: uppercase, +0.14–0.18em, 1.5–3% of frame height |
| Buttons, nav, dividers, scroll cues | Affordances imply interaction | Nothing in a frame should look clickable |

## Measure Against the Frame, Never the Viewport

Define one unit and size everything in it:

```css
.stage { font-size: calc(var(--stage-height) / 100); }  /* 1em === 1% of frame height */
```

The window is only a place to look at the frame through. Letterbox the stage to the
chosen aspect, set that custom property from JS on resize, and never write a `vw`/`vh`
anywhere inside it. This is what lets one composition survive four formats and any
export resolution.

Beware `em` inheritance the moment you override `font-size`: a `3.4em` gap under a
`12.4em` headline is 42% of the frame, not 3.4%. Express gaps as a fraction of the
element's own size (`margin-top: .27em`) or hang them on a wrapper.

## Proportions

Measured across a representative motion library at 1920×1080. Re-derive these values
from the current reference set rather than trusting them blindly:

| Element | Range observed | Use |
| --- | --- | --- |
| Statement | 8.1 – 13.9% of frame height | **10–13%**, median observed 10.6% |
| Statement tracking | −0.02 to −0.04em | closes up as it grows |
| Statement leading | 1.02 – 1.08 | tighter than any page |
| Label / eyebrow | 0.7 – 3.1% of frame height | **1.8–2.2%**, uppercase, +0.16em |
| Supporting line | 1.7 – 2.5% of frame height | one line, never a paragraph |
| Text blocks in frame | 1 – 3 | **1 is the strongest**; 3 is the ceiling, not the target |

The two best frames in the library carry exactly **one** block — the statement and
nothing else. A label and a supporting line are worth having available and worth leaving
empty; every one you add is another thing competing with the message you wrote the piece
for.

Air is the other half of it. Single-statement scenes in the library sit inside margins
of **25–45% of the frame** — vastly more than a page would allow. Even a two-column
frame should inset its message block ~9% from the frame edge and centre it optically in
its own half.

## Composition

Split the frame into a **subject half** and a **message half**, and let the reading
order run subject → message: left-to-right in landscape, top-to-bottom in square and
vertical. The subject holds one half at 30–45% of frame height.

**Size the statement first, then give it the column it needs** — not the other way
round. A fifteen-character line at 10–13% of frame height wants roughly 38–46% of the
frame's width in landscape, well past the third a page column would take. Getting this
backwards is the easiest mistake to make and it is invisible by eye: build the frame,
measure it, and if the column has forced the statement below 10% of frame height then
the column is too narrow or the message is too long. Both are fixable; shipping an
undersized statement is not.

Three things to check that are easy to miss:

- **What the subject sweeps through.** An object is not its bounding box. A hand's
  forearm, a bottle's shadow, a card's stack all extend well past the thing you framed
  on, and they will run straight along the statement's baseline. Move the subject until
  its overhang leaves the frame edge rather than crossing the copy.
- **Frame on the subject, not on the model.** Sizing to a bounding box frames whatever
  is longest, not whatever matters. Re-pivot on the hero element and measure against it.
- **Crop on purpose.** Letting the subject run out of frame is a motion-design move; a
  fingertip clipped by 20px is a mistake. Either well inside or decisively out.

## One Message

The brief is one message. That means one statement, and the rest of the frame is
support:

- Split the statement on explicit newlines and honour them — the writer chose the breaks.
- Make each configured line one visual line (`display:inline-block; white-space:nowrap`)
  so it is measurable, then **shrink the statement until the widest line fits its
  column**. A placeholder always gets replaced by something longer.
- If the message needs a second sentence to work, it is not one message yet.

## Formats

Re-anchor per format; never scale one layout down.

| Format | Subject | Message | Subject height |
| --- | --- | --- | --- |
| 16:9 | left half | right column, ~35% wide, vertically centred | 38–42% |
| 1:1 | upper half, left of centre | lower band, full inset width | 28–32% |
| 4:5 | upper half, left of centre | lower band | 24–28% |
| 9:16 | upper third, left of centre | lower band | 20–24% |

Vertical formats are not landscape with the sides cut off. The subject moves off-centre
so its overhang exits the frame edge instead of crossing the copy band, and the
statement drops a size because its column is narrower.

## Make It Re-Skinnable

The piece will be re-used with other words, another brand, another format. Ship:

- one `CONFIG` object holding message, label, note, duration, format, theme, accent;
- every key overridable from the query string, so it re-skins without being edited;
- `?t=<seconds>` to freeze one deterministic frame;
- `window.MOTION = { seek, play, pause, duration, config }` for a recorder;
- a control bar that `?ui=0` removes for capture.

## Verify

- **Contact sheet.** Seek to 6–8 times across the piece, screenshot the stage element
  only, and tile them. Pacing and dead frames are visible in a grid and invisible live.
- **Every format, both themes.** Render all of them at the same time index and look at
  them side by side; collisions show up immediately.
- **Longest plausible message.** Re-render with a message about 40% longer than the
  placeholder. If it overflows or overlaps the subject, the fit rule is not doing its job.
- **Loop seam numerically.** Seek to `0` and to `duration`, read back computed
  `opacity`/`transform` on the canvas and on the first line, and require them to match.
  Do not compare screenshots.
- **Measure your own frame against the library.** Use the Codex in-app browser to read
  computed font size, tracking, text-block count, and outer margins for your frame and a
  few approved references. Convert values to percentages of frame height or width; do
  not estimate them from screenshots.

## What This Skill Does Not Cover

Beats, easing vocabulary, continuity across cuts, deterministic render contracts, and
the scoring rubric — all of that is `craft-motion-design-scenes`. Compose the frame
here, choreograph it there. And if the frame is being derived from an existing page —
lifting its type, palette and hero scene out of a landing page and converting its
interaction time into scene time — start from `website-to-motion-design`, which treats
this skill as its composition step.
