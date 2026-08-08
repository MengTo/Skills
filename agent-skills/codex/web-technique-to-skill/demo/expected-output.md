# Expected extraction handoff

## Triage

| Source part | Pile | Mechanism sentence | Skill |
| --- | --- | --- | --- |
| Beam sweep | mechanism | Density sampled along the ray in steps is what makes a beam read as volume; a flat overlay reads as a painted triangle | `volumetric-beam-sweep` |
| Tide line | mechanism | Two scroll rates that are not multiples of each other are what stop a noise band from visibly repeating | `non-repeating-noise-band` |
| Card hover | mechanism | Splitting lift and shadow onto separate layers lets them run different curves, which is what makes the lift read as weight | `weighted-card-lift` |
| Masthead | staging | — | demo only |
| Preloader | incidental | client request, no repeatable method | dropped |

Three skills, not one. Each survives changing the subject, palette, and layout.

## What each skill must carry

**Numbers, not adjectives.** Beam period 11s; fog march 24 steps desktop, 12
mobile, selected by pixel count not user agent; DPR capped at 2. Card lift 6px
over 240ms on `cubic-bezier(.22,.65,.28,1)`. Tide rates deliberately coprime.

**Failure-anchored rules.** "Sample density along the ray; a screen-space fog
gradient makes the beam read as a painted triangle." "Keep the two scroll rates
off any common multiple, or the foam visibly repeats on a cycle the eye finds
within seconds."

**The expensive gotcha, symptom first.** "An emissive orange comes out of a
tone-mapped composite pink. Drive green and blue toward zero; correcting the
colour in the editor will not work, because the value is decoded before the
material multiplies it." This belongs to `volumetric-beam-sweep` and cost a day.

**Boundaries.** `volumetric-beam-sweep` states when to reach for a general
`webgl-laser` or `corner-lasers` skill instead. `weighted-card-lift` states its
boundary against `beautiful-shadows`.

**Lifecycle.** Pause on `document.hidden`, clamp `dt`, cap DPR at 2, size from a
`ResizeObserver`, and render a designed still frame under reduced motion.

## What must not survive

The client blue `#1B3A57`, the licensed serif, the words "Harbour Nocturne", the
page layout, and the preloader. The demo may keep a real look, but under a
different subject so it does not read as a clone.

## Package

```text
agent-skills/web-design/<skill-name>/
  SKILL.md
  agents/openai.yaml
  demo/index.html
  demo/PROMPT.md
  demo/preview.jpg
```

## Browser evidence required

Each demo driven at 1440×900 and 390×844: primary interaction exercised, focus
visible and ordered under Tab, reduced-motion path rendering a composed frame
with animation stopped, console clean at both sizes.
