---
name: web-technique-to-skill
description: Turn a visual or interaction technique you already built into a reusable web-design skill, by isolating the one mechanism that makes it work, separating it from the staging it happens to sit in, and packaging it with a demo that proves it. Covers finding the mechanism, anchoring every rule to the failure it prevents, carrying real numbers instead of adjectives, keeping the expensive gotchas, declaring the boundary against neighbouring skills, and browser-verifying before claiming it works. Use when a page, canvas scene, shader, scroll effect, layout system, or hover interaction turned out well and should become a skill rather than staying in one project.
---

# Web Technique to Skill

Start from working code, not from prose. Reach for `article-prompts-to-skills` when the source is an article or a prompt pack that describes behavior. Reach for this when you built the thing, it works, and the knowledge is currently trapped in one file.

Extract one mechanism per skill. A page that turned out well usually holds several; package them separately or each one gets diluted.

## Name the mechanism in one sentence

Write the sentence before you write anything else: *the one thing that, if removed, makes the effect stop working.* If you cannot write it, you have a look, not a mechanism, and there is no skill here yet.

The sentence decides everything downstream. For a leaf fall it is "the tumble crosses edge-on, and that instant of near-disappearance is what the eye reads as a leaf" — so the sprite artwork, the palette, and the night scene are all staging, and the tumble is the skill.

Test it: change the subject, the palette, and the layout in your head. If the sentence still holds, it is the mechanism. If it stops making sense, you named the staging.

## Split mechanism from staging

Sort every part of the source into three piles and keep only the first:

| pile | goes where | examples |
| --- | --- | --- |
| mechanism | the skill | the maths, the state model, the ordering constraint, the budget |
| staging | the demo only | palette, copy, imagery, page layout, brand |
| incidental | nowhere | selector names, a font choice, a one-off asset path |

Strip brand names, hard-coded palettes, project selectors, and asset paths from the skill body. Let the demo keep a real look — a demo with no art direction proves nothing about a visual technique — but rename the subject so it does not read as a clone of the source project.

## Anchor every rule to the failure it prevents

State the wrong result, not the right adjective. A rule with a named failure is testable; a rule without one is decoration.

- Weak: "vary the particle rotation for a natural feel."
- Strong: "drive rotation from the tumble angle, ninety degrees out of phase. An independent sine reads as a wobble or as an easing bug."

If you cannot name what goes wrong, you probably never tested the alternative, and the rule may not be real. Cut it or go and find out.

## Carry numbers, not adjectives

Ship the constants you actually landed on. "Subtle" is unusable; `0.3–0.5` is a starting point someone can adjust.

Include ranges per layer or state, timing and easing, size and spacing, budgets (`dt` clamp, DPR cap, instance counts), and any formula that trades one quantity against another. Where a value was tuned by measurement rather than taste, say what was measured.

Prefer a small table over prose when three or more parameters vary together.

## Keep the expensive gotchas

The rules worth most are the ones that cost hours and cannot be re-derived by reading the code. They are usually one of:

- **Colour space** — a value that looks right in the editor and wrong on screen because something decodes or tone-maps between the two.
- **Layout timing** — code that measures once and is correct only if layout already happened; the fix is an observer, not a longer timeout.
- **Stacking and compositing** — an element that cannot rise above another because of a context created three ancestors up.
- **Ordering** — two correct operations that are wrong in one order.
- **Platform quirks** — a property that silently no-ops on one engine.

Write these as their own rule with the symptom first, so the reader recognises the bug they are currently staring at.

## Declare the boundary in the opening lines

Name the nearest existing skill and say when to reach for it instead. Search `agent-skills/*/*/SKILL.md` before you start; if a skill already covers the mechanism, extend it rather than adding a near-duplicate.

Two skills that both "add particles" with no stated boundary means neither gets picked correctly.

## Fold in accessibility and lifecycle

For web-design skills these are part of the mechanism, not an appendix:

- Under `prefers-reduced-motion: reduce`, render a **designed still frame**. Do not hide the effect; the composition was built with it in. Keep controls live so they still do something.
- Pause on `document.hidden` and when the section leaves the viewport. Reset the time base on resume so the first frame does not integrate the whole pause.
- Clamp `dt` to about 1/30 s. Cap device pixel ratio at 2.
- Size from a `ResizeObserver`, and guard any build step against a zero viewport.
- Keep controls as real form elements, keyboard reachable, with visible focus and a live region for changes.

## State the cost honestly

Say what is actually expensive, and measure before claiming it. Profile rather than guess: the part that looks heavy often is not. Name the real bottleneck, the cheap lever, and the thing that does not matter.

Report the lever that buys the most for the least — for a recycled particle field, tightening the spawn band beats raising the count, because on-screen density goes as count ÷ area.

## Record where the design came from

Write one line in `SKILL.md` naming the source: what the project was, and what the mechanism was doing in it. A reader decides whether the skill applies to them by understanding the context it survived — "extracted from a dark WebGL Kyoto night scene where it had to stay legible over type" tells them more than any amount of description.

The demo should look like that source — see **Direct the demo** below. What stays behind is only what you do not own: a client's name and brand, licensed fonts, purchased or third-party imagery. Substitute those and reproduce everything else.

## Direct the demo

**The demo is the only evidence most readers will ever see.** They will not read the source project, and they will judge the technique by this one file. A mechanism that shipped on a considered page, demonstrated by something that looks like a test harness, reads as unfinished — and nobody reaches for a skill that looks unfinished.

So the demo inherits the craft bar of the source, not the craft bar of a code sample.

- **Build the demo as close to the reference as you can.** Same palette, same type treatment, same composition, same atmosphere. The reference is the proof that this technique looks good when it is done properly, and a demo that wanders off into its own art direction throws that proof away. Someone opening the demo should recognise it as the page the technique came from.
- **Use the reference's own assets, by porting the code that makes them.** If the source generates its sky, its moon, its textures, its silhouettes, bring those functions across unchanged. A hand-rolled CSS approximation of a procedurally generated moon is a flat disc next to one with real maria and a crater field, and the gap is obvious the moment they sit side by side. Porting a generator costs nothing at rest, keeps the demo one self-contained file, and makes the staging genuinely the same rather than merely similar.
- **What must not cross is anything you do not own:** a client's brand, licensed fonts, purchased or third-party imagery, and any binary asset you would have to ship alongside the file. Substitute those; reproduce everything else.
- **Show the mechanism on the first screen** — before any scroll, before any interaction. If it takes a click to see the point, the framing is wrong.
- **Write the skill's argument as the page's copy.** The demo explains the technique through its own content, not through a caption bolted underneath. Put the mechanism in the headline and the failure it prevents in the body, in the reference's own voice. Atmospheric filler makes the reader guess what they are looking at, and a demo that has to be explained elsewhere has failed as evidence.
- **Keep a family.** Two techniques pulled from the same reference should produce two demos that look like siblings. A library of demos that share a reference reads as a body of work; a library where each one invents its own world reads as scraps.

A worked example of the copy rule, for a trail that emits per unit of distance:

> **A flick and a crawl draw the same line.**
> The motes are shed by distance, not by the clock, so the spacing along the path never changes with the speed of the hand. Switch emission to a timer and the same gesture breaks apart — a fast pass leaves scattered dots, a resting hand piles them on one spot.

The headline is the mechanism. The body is the failure. The control named in the last sentence is on screen, so the reader can go and check the claim.
- **One idea per screen.** A demo proving three things proves none of them.
- **Controls expose states that matter**, as real form elements, and prove the system is parameterised rather than baked. Skip controls that only restate what is already visible.

### Quality floor

Every one of these, every time:

- A deliberate type scale with a considered largest and smallest step — never browser defaults
- Spacing on one consistent rhythm
- A restrained palette with one accent that carries meaning
- Every interactive control styled, including its focus state
- Real, specific copy from a plausible project — never "Card title" or "Demo section"
- One self-contained file: no build step, no external assets, no libraries unless the skill is about one
- 390px through 1440px, semantic HTML, visible focus, and a clean console at both ends

If the demo would embarrass you next to the page you extracted it from, it is not finished.

## Verify in a browser, then report

Do not claim visual or interaction behavior from reading the file. Drive it:

1. Load the demo at 1440×900 and 390×844.
2. Exercise the primary interaction and confirm the state actually changes.
3. Tab through and confirm focus is visible and ordered.
4. Run the reduced-motion path and confirm a composed frame renders and animation stops.
5. Confirm the console is clean at both sizes.
6. Capture the preview at the repository's shared dimensions.

Expect this pass to find something. When it does, fix the demo and re-run rather than softening the rule.

## Package and commit

```text
agent-skills/<category>/<skill-name>/
  SKILL.md
  agents/openai.yaml
  demo/
    index.html
    PROMPT.md
    preview.jpg
```

Write `SKILL.md` in imperative form with only `name` and `description` in frontmatter, and put every trigger phrase in the description. Give `demo/PROMPT.md` three headings: **Minimal prompt**, **Recreate the demo**, **Remix prompt**, where the remix changes subject, palette, and composition while preserving the mechanism and the budgets.

Stage only the new folder and the gallery rows it needs. Review `git diff --cached --stat` before committing, and leave pre-existing dirty files alone.

## Verify

- [ ] The mechanism sentence survives changing the subject, palette, and layout
- [ ] Staging lives in the demo, not in the skill body
- [ ] Every rule names the failure it prevents
- [ ] Constants are real numbers, not adjectives
- [ ] The expensive gotchas are written symptom-first
- [ ] The boundary against the nearest existing skill is stated in the opening lines
- [ ] Provenance is one line of context naming the source project
- [ ] The demo is recognisably the reference — same palette, type, composition, atmosphere
- [ ] The reference's own asset generators were ported, not approximated
- [ ] Nothing unowned crossed over, and the demo ships as one file
- [ ] Demos from the same reference look like siblings
- [ ] The demo's own copy states the mechanism and names the failure it prevents
- [ ] The demo shows the mechanism on the first screen, before scroll or interaction
- [ ] The demo would not embarrass you next to the page it came from
- [ ] Type scale, spacing rhythm, and palette are deliberate, not defaults
- [ ] Reduced motion renders a designed still, not a hidden element
- [ ] Cost claims were measured, not assumed
- [ ] The demo was driven in a browser at both breakpoints with a clean console
- [ ] Only the new skill folder is staged
