---
name: no-ai-design-slop
description: Create or refine websites, product interfaces, app screens, and design systems so the result avoids generic AI-generated UI patterns and long-standing usability mistakes. Use when building, redesigning, styling, or polishing UI; converting references into an original direction; writing design constraints or DESIGN.md; or when the user asks for no AI design slop, less generic AI design, stronger taste, intentional art direction, or a final anti-slop pass.
---

# No AI Design Slop

Remove generated-design defaults without removing personality. Passing an anti-pattern checklist does not create taste; it only clears the way for intent, craft, and a real point of view.

Do not guess whether AI made a design. Judge the visible decisions.

## Start with intent

Before styling, identify:

- the person using the interface;
- the task or message that matters most;
- the content and proof available;
- the brand character to express;
- the device, environment, and accessibility constraints;
- the one thing the design should make easier to understand or do.

If these are missing, ask one focused question or state a narrow assumption. Do not hide an unclear product behind decoration.

Write a one-sentence design thesis:

```text
For [audience doing task], use [visual idea] to make [priority] unmistakable; prove it with [content or product evidence].
```

## Build from evidence, not model taste

1. Inspect every supplied screenshot, URL, video, brand artifact, and existing screen before designing.
2. Extract principles such as hierarchy, density, rhythm, crop, contrast, and interaction behavior. Do not copy identity, copy, assets, or a distinctive composition.
3. Collect two to five compatible references. Give each one a job; do not blend unrelated aesthetics.
4. Turn the direction into a compact `DESIGN.md` or equivalent token sheet before generating many sections.
5. Use real product copy and contextual imagery. Replace template placeholders early.
6. Change one system at a time, inspect the rendered result, and name the visual problem being fixed.

## Establish a small design system

Use constraints as defaults, then deviate deliberately.

### Typography

- Assign roles before choosing faces: display, body, label, data, and code only when needed.
- Use two to four clear type levels. Make adjacent hierarchy steps visibly different, usually at least a `1.25` ratio.
- Start body text around `16–18px` with `1.45–1.7` line height. Keep sustained reading near `45–75ch`.
- Keep headings closer to the content they introduce than to the block above.
- Pair fonts only when the roles need different voices. Match compatible proportions and x-height, then create contrast through category, weight, or width. One well-used family is better than a forced pairing.
- Avoid reflexively choosing the current popular AI font stack. Select type for the brand and content.
- Reserve uppercase and wide tracking for short labels. Do not use them for paragraphs.

### Spacing and layout

- Use a `4px` or `8px` base scale with a few purposeful steps.
- Keep related items tight and separate unrelated groups by roughly `2–4×` more space.
- Align to a real grid. Preserve optical alignment when icons, caps, or curved shapes make mathematical alignment look wrong.
- Let layout express priority. Do not give every item the same area, card, border, and emphasis.
- Keep mobile reading order logical. Do not merely squeeze the desktop composition.

### Color, shape, and elevation

- Derive color from the brand, content, or product state. Use one clear accent before adding more.
- Meet WCAG contrast; do not use low-contrast gray to simulate sophistication.
- Use two or three radius values. Reserve full pills for tags, compact controls, and statuses that benefit from the shape.
- Choose a defined edge or elevation. Avoid combining a hairline border with a large soft shadow by default.
- Use shadows to explain stacking, not to decorate every container.

### Icons and imagery

- Use one icon family with consistent stroke, fill, optical size, and alignment.
- Keep ordinary interface icons around `16–24px`. Do not let icon tiles overpower the message.
- Prefer real product UI, licensed photography, original illustration, or purposeful graphics.
- Give every image a narrative role, crop, focal point, alt text, loading behavior, and fallback.
- Remove generic shape-built mascots, fake screenshots, invented logos, and decorative media that cannot be defended.

### Motion

- Animate a cause and effect: state change, navigation, spatial continuity, progress, or feedback.
- Start micro-interactions around `120–240ms` and larger transitions around `240–500ms`.
- Prefer transform and opacity. Keep content complete without animation.
- Use spring or bounce only when the object or brand behavior earns it.
- Support `prefers-reduced-motion`; preserve meaning when motion is removed.
- Do not animate status unless the underlying state is actually changing.

## Reject recurring AI defaults

One occurrence is not a verdict. A cluster of defaults with no product reason is the signal.

### Decorative AI costume

- purple-to-cyan gradients chosen by reflex;
- dark surfaces covered in glow, blur, glass, or radial halos;
- gradient text, ornamental grids, repeating stripes, and floating blobs;
- a warm beige palette used only to look tasteful;
- glowing AI orbs, fake terminal cursors, and pulsing dots with no live state;
- giant corner radii that turn every surface into the same soft shape.

Swap the costume for a palette, material, and lighting logic tied to the product.

### Component monoculture

- identical icon-heading-paragraph cards repeated across the page;
- rounded icon tiles above every heading;
- cards inside cards inside cards;
- a colored side stripe on rounded cards;
- bento grids used for content that has no grid relationship;
- every section centered, evenly spaced, and equally important;
- complex workflows compressed into a modal.

Flatten unnecessary containers. Use typography, alignment, dividers, lists, and changes in scale to create structure.

### Template hierarchy

- pill eyebrow, oversized headline, two CTAs, logo strip, three metrics, feature grid, pricing, CTA;
- tiny numbered labels pretending to add editorial structure;
- long display headlines that consume the first viewport;
- generic metric theater without context or evidence;
- the same hero treatment copied into every section.

Rebuild the page around the product's actual decision sequence and strongest proof.

### Typography and copy defaults

- one fashionable typeface used without a brand reason;
- weak hierarchy made from many nearly identical sizes;
- tiny body text, tight leading, crushed display tracking, or lines wider than `80ch`;
- excessive uppercase labels, eyebrow copy, em dashes, and dramatic fragments;
- vague SaaS language such as “supercharge,” “streamline,” or “built for the future”;
- redundant label, helper, and hint text saying the same thing.

Use specific nouns and verbs. Make typography clarify content before it adds personality.

### Motion theater

- autoplay marquees, perpetual floating, and reveal animation on every block;
- image scale or rotation on every hover;
- bounce easing on ordinary dialogs and cards;
- invisible-at-rest content that depends on JavaScript to appear;
- animated gradients, shadows, and status indicators competing at once.

Keep the strongest one or two motion ideas and remove the rest.

### Fake product proof

- invented testimonials, customer logos, metrics, security badges, or people;
- generic dashboards that do not match the product;
- placeholder copy shipped as evidence;
- decorative charts with no units, labels, source, or decision value.

Use truthful product evidence or omit the proof block.

## Fix long-standing UI failures

These are defects regardless of whether a design looks AI-generated:

- unclear primary action or reading order;
- weak affordances and click targets smaller than `24×24px` without adequate spacing;
- missing hover, focus, active, disabled, loading, empty, success, and error states;
- essential content available only on hover or through motion;
- low contrast, color-only meaning, missing labels, skipped heading levels, or broken keyboard order;
- clipped menus, overlapping text, horizontal overflow, and body copy touching the viewport edge;
- paragraphs with poor measure, leading, alignment, or spacing;
- forms without persistent labels, useful validation, or a clear recovery path;
- mobile layouts that reorder meaning, hide actions, or preserve desktop density;
- layout animation, uncapped effects, and offscreen motion that cause jank;
- visual polish applied before runtime errors and broken content are fixed.

## Run the anti-slop loop

1. Render with real content at desktop and mobile widths.
2. Fix usability and accessibility defects first.
3. Name each remaining default pattern. Do not use vague feedback such as “make it pop” or “more premium.”
4. Replace the highest-impact pattern with a systemic change, not a cosmetic recolor.
5. Verify hierarchy, paragraph reading, interaction states, responsiveness, and reduced motion.
6. Remove any effect or component that cannot explain its job.
7. Repeat until the design is coherent, complete, and specific to the product.

Before handoff, check:

- **Intent:** every major decision supports the task or brand thesis.
- **Hierarchy:** one clear focal point and reading order exist at each viewport.
- **Coherence:** type, color, spacing, shape, imagery, and motion share one logic.
- **Originality:** references informed principles, not copied identity or composition.
- **Usability:** controls, states, semantics, contrast, keyboard, touch, and mobile work.
- **Completeness:** real content, proof, edge states, media fallbacks, and final polish exist.

Do not claim a design has “soul” because it passes. State what gives it a point of view.
