# Falling Leaves Demo Prompts

## Minimal prompt

```text
Use $falling-leaves to add a maple fall over this section, with leaves that tumble edge-on rather than a generic particle field.
```

## Recreate the demo

Use `$falling-leaves` to build **Late Autumn — The Maple Fall** as a single standalone HTML document. Treat `index.html` as the visual, motion, responsive, accessibility, and performance reference.

### Experience

- One full-viewport dark night: near-black sky, a low ember moon, a fogged treeline, and a maple fall crossing the whole frame.
- The fall is the subject. Type, moon, and ridge are staging and must stay quiet.
- Three depth layers. The far layer drifts behind the type, the near layer crosses in front of it, and that difference carries the depth.
- Every leaf tumbles edge-on at its own rate. Watching any single leaf for four seconds shows it present its face, thin to nothing, and open out on its duller underside.
- A short control strip that changes the fall live and proves the system is parameterised rather than baked.

### Implementation contract

- One `<canvas>` per depth surface. No leaf images, no external assets, no libraries; draw the maple sprite procedurally at boot and cache it.
- Bake both faces as separate sprites and pick between them by the sign of the tumble.
- Drive lateral slip from the tumble angle, ninety degrees out of phase, never an independent sine.
- Sample colour from a small autumn ramp per leaf, not a single red.
- Set density from the recycle band and viewport area before the count; report the count actually built.
- Clamp `dt`, cap DPR at 2, and pause on `document.hidden`.
- Size from a `ResizeObserver` on the root element, and guard the builder against a zero viewport.
- Under `prefers-reduced-motion: reduce`, render one composed still frame rather than hiding the fall, and redraw it when a control changes.
- Controls are real form elements, keyboard reachable, with visible focus and a live region announcing changes.
- Support 390px through 1440px. Keep the console clean.

### Restrictions

- No third-party CSS or JS.
- No `<img>`, no data-URI artwork, no SVG leaf assets.
- Nothing may depend on the pointer. The composition must be complete and correct on a touch device and with a keyboard alone.

## Remix prompt

```text
Use $falling-leaves to rebuild this as a spring sakura drift for a daylight editorial page: warm white sky, pale grey-pink petals on a narrow tint ramp, a slower fall, and a single near layer crossing in front of a serif headline. Keep the tumble, the slip coupling, the two baked faces, the per-leaf variance, the area-scaled density, the reduced-motion still frame, and the DPR and visibility budgets exactly as they are. Change only the subject, palette, type, and composition.
```
