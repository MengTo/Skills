# Web Technique to Skill Demo Prompts

## Minimal prompt

```text
Use $web-technique-to-skill to extract the mechanism behind this effect and package it as a reusable skill with a demo.
```

## Recreate the demo

Use `$web-technique-to-skill` to build **The Triage Bench** as a single standalone HTML document. Treat `index.html` as the visual, motion, responsive, accessibility, and performance reference.

### Experience

- A working page has been shipped and its parts must be sorted before any skill is written. The demo is that sorting bench.
- The source project's parts arrive as a column of cards, each carrying a short description and, where one exists, the failure the part prevents.
- Sorting a part into **Mechanism**, **Staging**, or **Drop** immediately rewrites the skill outline on the right. The outline is the point: it shows that a skill is what survives triage, not what was in the source.
- A part sorted into Mechanism reveals its mechanism sentence and asks whether it survives changing subject, palette, and layout. Failing that test moves it back.
- The outline reports a live count of rules that name a failure versus rules that do not, because a rule without a named failure is decoration.
- Ship one worked example pre-sorted so the bench is legible before anything is touched.

### Implementation contract

- One self-contained HTML file. No build step, no external assets, no libraries.
- Sorting is real state, driven by real form controls, and reflected in the outline synchronously.
- Every control is keyboard reachable in a sensible order, with visible focus and a live region announcing each sort.
- Support 390px through 1440px. The bench stacks below 720px rather than scrolling horizontally.
- Under `prefers-reduced-motion: reduce`, drop the card transitions but keep every state change visible and instant.
- Keep the console clean at both breakpoints.

### Restrictions

- No third-party CSS or JS.
- No placeholder copy. Every card carries real, specific content from a plausible project.
- Nothing may depend on the pointer; the bench must be fully operable from the keyboard alone.

## Remix prompt

```text
Use $web-technique-to-skill to rebuild the triage bench for a design-system audit instead of a skill extraction: the input is a component library, the piles become Token, Component, and One-off, and the right-hand panel builds a spec outline rather than a skill outline. Use a light paper palette and a serif heading. Keep the synchronous state, the survives-a-rename test, the failure-named counter, the keyboard operability, the live region, the 390-to-1440 range, and the reduced-motion behavior exactly as they are.
```
