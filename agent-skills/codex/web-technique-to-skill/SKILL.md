---
name: web-technique-to-skill
description: Turn a visual or interaction technique you already built into a reusable web-design skill, by isolating the one mechanism that makes it work while reproducing its approved reference exactly around that focus, and packaging it with a demo that proves both the mechanism and the visual fidelity. Covers finding the mechanism, naming the technique plainly, disclosing the verified runtime and renderer, auditing reference layers, carrying real numbers instead of adjectives, preserving owned staging, keeping expensive gotchas, declaring the boundary against neighbouring skills, and browser-verifying before claiming it works. Use when a page, canvas scene, shader, scroll effect, layout system, or hover interaction turned out well and should become a skill rather than staying in one project.
---

# Web Technique to Skill

Start from working code, not from prose. Reach for `article-prompts-to-skills` when the source is an article or a prompt pack that describes behavior. Reach for this when you built the thing, it works, and the knowledge is currently trapped in one file.

Extract one mechanism per skill. A page that turned out well usually holds several; package them separately or each one gets diluted.

Treat this as the living quality contract for every web-technique skill. On every creation or revision, audit this skill too. If the work exposes a missing fidelity rule, failure mode, packaging constraint, or verification step, update this contract in the same scoped change instead of solving it only inside one child skill.

## Name the mechanism in one sentence

Write the sentence before you write anything else: *the one thing that, if removed, makes the effect stop working.* If you cannot write it, you have a look, not a mechanism, and there is no skill here yet.

The sentence decides everything downstream. For a leaf fall it is "the tumble crosses edge-on, and that instant of near-disappearance is what the eye reads as a leaf" — so the sprite artwork, the palette, and the night scene are all staging, and the tumble is the skill.

Test it: change the subject, the palette, and the layout in your head. If the sentence still holds, it is the mechanism. If it stops making sense, you named the staging.

## Name the demo and disclose the stack

Use the concrete technique name for the visible `h1` and browser `<title>`: **Wisps**, **Cursor Ripples**, **Liquid Metal Border**, or **Scroll-scrubbed Word Reveal**. Do not hide the subject behind an abstract mechanism claim. “Draw at any speed” describes behaviour, but it does not tell anyone what the demo is.

Put the verified implementation path directly above or below that title. Name, in order:

1. The runtime or framework: Vanilla JavaScript, React, Vue
2. The renderer or browser API: Canvas 2D, WebGL, DOM/CSS, SVG
3. The technique layer when present: GLSL shaders, Three.js, GSAP, ScrollTrigger

Write **Vanilla JavaScript · Canvas 2D** or **Three.js · WebGL · GLSL**, not “interactive experiment” or “motion study.” Never guess from the look. Verify imports, renderer construction, and context creation in the source. `getContext('2d')` is Canvas 2D, not a shader; `WebGLRenderer` plus `ShaderMaterial` is Three.js, WebGL, and GLSL. When the visual could be mistaken for a more complex stack, state the absence plainly: **No WebGL, shaders, or Three.js.**

Separate the effect stack from the interface stack when they differ. Write **Vanilla JavaScript + Canvas 2D effect; CSS interface** instead of listing CSS beside Canvas 2D as if both render the particles. Readers should know which technology creates the technique and which technology only lays out its controls.

If an approved reference headline must remain for layout fidelity, keep it and put the technique name plus stack in the browser title and the reference's existing kicker, control panel, or secondary label. The implementation must still be obvious on the first screen.

## Split mechanism from staging

Sort every part of the source into three piles and keep only the first:

| pile | goes where | examples |
| --- | --- | --- |
| mechanism | the skill | the maths, the state model, the ordering constraint, the budget |
| staging | the demo only | palette, copy, imagery, page layout, brand |
| incidental | nowhere | selector names, a font choice, a one-off asset path |

Strip project selectors and incidental asset paths from the reusable mechanism in the skill body. Keep the approved reference staging in the demo: the same owned brand, palette, type treatment, composition, asset placement, atmosphere, and motion hierarchy. Isolate the technique by narrowing what the demo teaches and controls, not by inventing a different visual world.

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

- **Treat the approved reference as an acceptance target, not inspiration.** Reproduce the same first frame, layout geometry, palette, type treatment, asset scale, atmosphere, and motion hierarchy around the isolated mechanism. Do a layer-by-layer inventory before coding. Someone opening the demo should identify the source immediately, before reading its name.
- **Use the reference's own assets, by porting the code that makes them.** If the source generates its sky, its moon, its textures, its silhouettes, bring those functions across unchanged. A hand-rolled CSS approximation of a procedurally generated moon is a flat disc next to one with real maria and a crater field, and the gap is obvious the moment they sit side by side. Porting a generator costs nothing at rest, keeps the demo one self-contained file, and makes the staging genuinely the same rather than merely similar.
- **Owned reference assets cross with the technique when they are necessary for fidelity.** Copy the smallest local set the demo needs and record their provenance. Exact owned staging outranks a one-file preference; a portable local bundle is better than a self-contained approximation that no longer matches. What must not cross is anything you do not own: a client's brand, licensed fonts, purchased imagery, or third-party media.
- **Show the mechanism on the first screen** — before any scroll, before any interaction. If it takes a click to see the point, the framing is wrong.
- **Verify the whole state path when the mechanism spans time or scroll.** The opening frame must establish the world and expose its conductor, but it cannot prove a multi-scene journey by itself. Compare every authored key state plus the forward, reverse, fast-skip, and reload-at-depth paths; a perfect hero does not excuse a broken third chapter.
- **Preserve layout-defining reference copy.** If changing the headline or body would change the approved composition, keep it exactly and put the technique name, verified stack, and mechanism argument into the browser title plus the reference's existing secondary panel, controls, microcopy, or accessible description. Do not trade visual fidelity for an explanatory headline, but never leave the implementation unidentified.
- **Keep a family.** Two techniques pulled from the same reference should produce two demos that look like siblings. A library of demos that share a reference reads as a body of work; a library where each one invents its own world reads as scraps.

A worked example of the copy rule, for a Canvas 2D trail that emits per unit of distance:

> Vanilla JavaScript · Canvas 2D
>
> **Wisps**
>
> Distance-emitted Canvas 2D particles keep the same spacing at any hand speed; CSS styles the interface only. Switch emission to a timer and the same gesture breaks apart — a fast pass leaves scattered dots, while a resting hand piles them on one spot. No WebGL, shaders, or Three.js.

The title names the effect. The kicker identifies the stack. The body states the mechanism, the failure, and any likely implementation ambiguity. The control named in the body is on screen, so the reader can check the claim.
- **One idea per screen.** A demo proving three things proves none of them.
- **Controls expose states that matter**, as real form elements, and prove the system is parameterised rather than baked. Skip controls that only restate what is already visible.

### Quality floor

Every one of these, every time:

- A deliberate type scale with a considered largest and smallest step — never browser defaults
- Spacing on one consistent rhythm
- A restrained palette with one accent that carries meaning
- Every interactive control styled, including its focus state
- A concrete technique title plus the verified runtime, renderer, and major technique libraries on the first screen
- Real, specific copy from a plausible project — never "Card title" or "Demo section"
- One self-contained file when the exact reference permits it; otherwise a minimal local bundle of owned assets with no remote runtime dependency
- 390px through 1440px, semantic HTML, visible focus, and a clean console at both ends

If the demo would embarrass you next to the page you extracted it from, it is not finished.

## Verify in a browser, then report

Do not claim visual or interaction behavior from reading the file. Drive it:

1. Load the demo at 1440×900 and 390×844.
2. Confirm the visible title names the technique and the stack disclosure matches the source imports, renderer, and context creation.
3. Exercise the primary interaction and confirm the state actually changes.
4. For scroll, timeline, or multi-state techniques, traverse every authored state forward and backward, fast-skip across seams, and reload at a nonzero state.
5. Tab through and confirm focus is visible and ordered.
6. Run the reduced-motion path and confirm a composed frame renders and animation stops.
7. Confirm the console is clean at both sizes.
8. Capture the preview at the repository's shared dimensions.
9. Compare the demo and source side by side at the source viewport. For multi-state techniques, compare every representative key state. Fix structural drift in hierarchy, crop, scale, alignment, and atmosphere before polishing the isolated effect.

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
    reference.*        # optional owned staging required for exact fidelity
```

Write `SKILL.md` in imperative form with only `name` and `description` in frontmatter, and put every trigger phrase in the description. Give `demo/PROMPT.md` three headings: **Minimal prompt**, **Recreate the demo**, **Remix prompt**, where the remix changes subject, palette, and composition while preserving the mechanism and the budgets.

Stage only the new folder and the gallery rows it needs. Review `git diff --cached --stat` before committing, and leave pre-existing dirty files alone.

## Verify

- [ ] The mechanism sentence survives changing the subject, palette, and layout
- [ ] The visible title names the technique instead of using an abstract mechanism claim
- [ ] The first screen states the verified runtime, renderer or browser API, and major technique libraries
- [ ] Staging lives in the demo, not in the skill body
- [ ] Every rule names the failure it prevents
- [ ] Constants are real numbers, not adjectives
- [ ] The expensive gotchas are written symptom-first
- [ ] The boundary against the nearest existing skill is stated in the opening lines
- [ ] Provenance is one line of context naming the source project
- [ ] The demo is recognisably the reference — same palette, type, composition, atmosphere
- [ ] The source and demo were compared side by side at the source viewport; no structural drift remains
- [ ] The reference's own generators were ported, or the smallest owned reference asset was bundled when exact code isolation was not practical
- [ ] Nothing unowned crossed over, and the demo ships as one file or the smallest justified local owned-asset bundle
- [ ] Demos from the same reference look like siblings
- [ ] The demo's own copy states the mechanism and names the failure it prevents
- [ ] The demo shows the mechanism on the first screen, before scroll or interaction
- [ ] A scroll, timeline, or multi-state mechanism was verified at every key state, in reverse, across fast skips, and after reload at depth
- [ ] The demo would not embarrass you next to the page it came from
- [ ] Type scale, spacing rhythm, and palette are deliberate, not defaults
- [ ] Reduced motion renders a designed still, not a hidden element
- [ ] Cost claims were measured, not assumed
- [ ] The demo was driven in a browser at both breakpoints with a clean console
- [ ] Only the new skill folder is staged
