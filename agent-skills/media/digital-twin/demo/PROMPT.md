# Digital Twin prompts

## Minimal prompt

```text
Use $digital-twin to build my digital twin from my own recordings in ~/Videos: pick a lean reference set and held-out judge frames, write my identity block, make 3 Seedream 5 Pro stills in my real room with only the camera changing, measure and audit them, clone my voice and score it to 9/10, then make one Seedance 2.5 draft per picked still. Price every step first.
```

## Just one part

```text
Use $digital-twin to clone my voice from my last three recordings: label my own speech, build an instant clone from my cleanest 3 minutes, try v4 with and without audio tags, score every take with the ECAPA scorer on 7–10 s lines, and send me a before/after with my real voice.
```

```text
Use $digital-twin to make 3 new stills of me in my studio: same room, same refs, same look as my last picks; change only the camera (one 3/4 past the lens, one eye contact, one new position). Measure each face against my held-out frames and audit them before you show me.
```

```text
Use $digital-twin to turn my picked still #12 into a talking clip: one Seedance 2.5 draft, 5 s, 480p, with this line in my cloned voice: "…". Measure the mouth and head against how I talk, and check the words with whisper.
```

## Recreate the landing page

Use `$digital-twin` to build **Your Digital Twin**, a one-page landing page for the skill. Treat `index.html` as the
reference for structure, tone and responsiveness.

### Experience

- **Top bar:** a mono wordmark `$digital-twin` and links to In Fil, Workflow, Worked example, Voice, Lessons, Consent and Use it.
  It sticks below the safe area, and the links hide under 720 px.
- **Hero:** a kicker naming the stack, the title "Your digital twin", one line on what it makes, one line of provenance
  (160+ stills, 20+ drafts, a voice taken from 8.7 to 9.2), a "Copy the prompt" button, and a contact strip of the three
  stills of one batch with shot-log captions: still number, time of day, lens.
- **In Fil:** the Digital twin workflow played live in a Fil window (`twin-demo.js` on HTML Demo's `step-window.js`): her
  files dropped in, three stills made together, the iMac fixed in the image editor, her line, then still 2 as a draft made
  final at 1080p, every frame drawn from one clock with Fil's own words and prices, a clock to drag and end frames for
  reduced motion.
- **What it makes:** stills, talking clips and voice lines, each with a real example (a still, the draft video, the
  voice line), its model, price and gate.
- **The workflow:** stages 0–7 as a sequence. Each has what it needs or costs and its gate.
- **Worked example:** one batch for Mai, one of Fil's example presenters (an AI portrait standing in for you): her eight
  face frames, still 1 as it came (an iMac with a chin and logo) and fixed (only the display pasted back), still 2 picked,
  and its Seedance 2.5 draft beside a readout (3 + 3 stills and edits, ~60 Fil credits, 15 Higgsfield, the words exact).
  Never a real person's face, voice or name in public examples.
- **Voice:** how the scorer works (the formula, "9 is you", score 7–10 s lines, the verification trap); a bar chart to scale, 0–10, with a dashed line at 9:
  [calm] 9.2, [calm, deep voice] 9.1, old professional clone 8.7, [calm, low voice] 8.6, [calm, relaxed] 8.6,
  Multilingual v2 8.1, v4 without a tag 7.7, v3 5.9.
- **Ten lessons,** each a rule and the failure it prevents. **Numbers that shipped,** as a table. **Consent.** **Use it,**
  with copyable prompts and the file list.

### Implementation contract

- One HTML file with no framework, and Fil's window as its two scripts and stylesheets beside it. Fonts from Google
  Fonts only: Gloock (display), Schibsted Grotesk (body), IBM Plex Mono (labels, numbers), and Geist inside Fil's window. Media next to it in `media/`: webp stills at 1400 px q80, the draft mp4 with a webp poster,
  and three mp3 clips.
- Dark-first tokens on `:root` (a warm near-black, warm ivory text, practical-lamp amber, olive-earth), with the light
  theme under `prefers-color-scheme: light` and `[data-theme="light"]`.
- The stage numbers are real (a sequence). The lessons aren't numbered.
- The chart is drawn to scale with percentage widths (score × 10 %), with `role="img"` and an aria-label listing the
  values.
- Copy buttons call `navigator.clipboard.writeText` inside the click, and fall back to selecting the text.
- At 390 px: one column, no sideways scroll, the stage cells stacked under the stage title.

### Restrictions

- Only owned media: the person's own consented twin. No stock faces, and no other people's frames.
- Every number on the page comes from the skill's references.
- Audio never autoplays.

## Remix prompt

```text
Use $digital-twin to build a landing page for [your twin / your client's consented twin]: hero with three of their picked stills logged like a camera report (shot number, lens, measured face), the stages with prices and gates, their best talking draft beside its measurements, a voice before/after with the scorer explained and a to-scale bar chart of their takes, the lessons, consent, and copyable prompts. Use only their own consented media, and every number from their logs.
```
