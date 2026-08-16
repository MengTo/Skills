---
name: audit-ai-design-slop
description: Audit websites, product interfaces, app screens, screenshots, prototypes, and design systems for visible AI-design clichés, generic template decisions, weak craft, and established UI or accessibility failures. Use when the user asks for an AI design slop check, design critique, anti-slop review, UI roast, taste audit, visual QA, feedback on whether a design feels AI-generated, or concrete swaps for bad design patterns without automatically redesigning the work.
---

# Audit AI Design Slop

Produce evidence-backed design feedback. Do not guess whether AI made the interface, run an authorship detector, or score its “soul.” Name the visible pattern, show where it appears, explain the consequence, and propose a concrete design swap.

## Preserve the audit boundary

- Audit only unless the user also asks for implementation.
- Treat a screenshot, URL, design file, and source code as different evidence surfaces.
- Separate what is visible, what source confirms, and what remains unknown.
- Do not clear a full product after checking one hero screenshot.
- Do not treat every gradient, card, serif, dark theme, or animation as slop. Context and repetition matter.
- Do not mistake “passes the checklist” for a distinctive design.

Classify findings as:

- **Quality defect:** hurts comprehension, interaction, accessibility, responsiveness, or runtime behavior.
- **Slop pattern:** a recurring generated-design default used without a product reason.
- **Craft gap:** technically valid but generic, unresolved, or missing a point of view.

## 1. Establish the checked scope

Record:

- artifact and version inspected;
- pages, flows, breakpoints, themes, and states available;
- intended audience, task, brand, and release status;
- supplied references or `DESIGN.md` constraints;
- evidence that could not be accessed.

When context is missing, make only the smallest assumption needed. A landing page, dense dashboard, editor, game UI, and checkout should not share one taste rubric.

## 2. Inspect the real experience

When access allows, inspect:

1. full page or full flow, not only the first viewport;
2. desktop and mobile widths;
3. keyboard focus and reading order;
4. hover, focus, active, disabled, loading, empty, success, and error states;
5. content with long labels, real paragraphs, missing media, and large data;
6. reduced-motion behavior and content before animation completes;
7. source tokens, component patterns, console errors, and overflow.

If only a static image is available, mark interaction, semantics, runtime, and responsive behavior `UNKNOWN`.

## 3. Run the quality pass first

AI tells are secondary when the interface does not work.

### Hierarchy and content

- Can a first-time user identify the page purpose, primary action, and next step?
- Does emphasis follow importance, or is every section equally loud?
- Is proof concrete and truthful rather than decorative?
- Is copy specific, concise, and free of repeated labels or unsupported claims?

### Typography and paragraphs

- Are display, body, label, data, and code roles clear?
- Do adjacent type levels have enough contrast, usually at least a `1.25` ratio?
- Is body text generally `16–18px`, `1.45–1.7` line height, and `45–75ch` wide?
- Are headings closer to their own content than to the preceding block?
- Does a font pairing create useful role contrast, or was a second face added as decoration?
- Is one family doing every role monotonously, or is one family being used well through size, weight, width, and spacing?
- Are uppercase, italics, wide tracking, and tight display tracking legible and intentional?

Do not automatically demand a font pair. Recommend one only when it solves hierarchy or brand voice.

### Layout and spacing

- Are related elements closer than unrelated groups?
- Does the grid align content without making every block the same size?
- Are containers necessary, or are borders and cards replacing hierarchy?
- Do paragraphs, controls, and media have comfortable edge insets?
- Do overlays, menus, tooltips, and long content avoid clipping and overflow?
- Does mobile preserve task priority and reading order?

### Controls, feedback, and accessibility

- Are controls recognizable, labeled, keyboard reachable, and large enough to target?
- Are focus, error, loading, empty, disabled, and success states present and distinct?
- Does text meet contrast requirements and avoid color-only meaning?
- Do heading structure, labels, alt text, and DOM order support assistive technology?
- Does reduced motion preserve all information and controls?

### Motion and runtime

- Does motion explain cause, effect, continuity, feedback, or progress?
- Is content complete before entrance effects run?
- Are layout properties, large blurs, offscreen loops, and competing systems avoided?
- Are script errors, broken images, layout shifts, and jank fixed before aesthetic judgment?

## 4. Run the slop-pattern pass

Look for clusters, not isolated fashion choices.

### Template convergence

- pill eyebrow + oversized headline + two CTAs + logo strip;
- three hero metrics followed by identical feature cards;
- bento grid, pricing cards, and final CTA used without content logic;
- tiny numbered section labels or repeated faux-editorial devices;
- every section centered and given the same rhythm.

### Decorative AI costume

- purple/cyan gradients, gradient type, dark glow, glass, and radial halos combined;
- ornamental grids, repeating stripes, blobs, fake terminal cursors, or AI orbs;
- safe beige surfaces selected without a brand reason;
- extreme radii, wide shadows, and translucent borders on every surface.

### Component monoculture

- rounded icon tile above every heading;
- same-sized icon-heading-paragraph cards repeated endlessly;
- nested cards and unnecessary depth;
- colored side-tab borders on rounded cards;
- modal dialogs carrying a full page of work;
- giant icons that outrank the content.

### Typography and copy defaults

- fashionable AI-era fonts selected by reflex;
- flat hierarchy, tiny body text, long measures, or crushed tracking;
- eyebrow labels, uppercase microcopy, em dashes, and aphoristic fragments everywhere;
- vague phrases such as “streamline,” “supercharge,” “future-ready,” or “designed for humans”;
- label, sublabel, hint, and helper text repeating one message.

### Motion theater

- constant floating, marquee motion, fake typing, pulsing status, and bounce easing;
- every image scaling or rotating on hover;
- every section hidden until a staggered reveal;
- several animated gradients, shadows, and particles competing for attention.

### Generated-media filler and fake proof

- generic shape-built illustrations and low-specificity stock imagery;
- mock product screens unrelated to the actual product;
- invented customer logos, testimonials, people, metrics, or security badges;
- charts with no units, sources, labels, or decision value.

## 5. Judge intent and craft

An interface can avoid every cliché and still feel generic. Ask:

- What is the visual thesis in one sentence?
- Which decision could belong only to this product, audience, or story?
- What content carries the design instead of decoration?
- Where does the composition deliberately change scale, density, rhythm, or medium?
- Do references inform principles, or has the work copied a recognizable composition?
- Is there one authored detail worth remembering after the page closes?

Call this a craft gap when the answers are missing. Do not invent a defect to explain a lack of point of view.

## 6. Give design swaps

Recommend the smallest systemic change that fixes the cause. Avoid “make it cleaner,” “make it pop,” “more premium,” or a cosmetic recolor.

Use swaps like:

- **Nested cards →** one section surface, spacing groups, and a single divider.
- **Six identical feature cards →** one proof-led feature, a compact list, and one contextual product image.
- **Purple glow stack →** a palette derived from brand material, with one accent and solid text.
- **Icon tiles everywhere →** small in-flow icons, or remove icons where headings already identify the content.
- **Forced font pair →** one family with stronger role contrast; add a display face only if the brand needs it.
- **Flat type hierarchy →** fewer sizes with larger jumps, readable body leading, and a constrained measure.
- **Hero metric theater →** one sourced outcome with context, date, unit, and audience.
- **Perpetual status pulse →** a static state; animate only during a real transition.
- **Reveal-dependent content →** visible final content with optional, reduced-motion-safe enhancement.
- **Modal abuse →** a dedicated page or progressive flow with saved state and clear navigation.

For every swap, state how to verify the improvement.

## 7. Prioritize the report

Use:

- **P0 — Blocker:** prevents task completion, access, or safe release.
- **P1 — High:** damages comprehension, trust, accessibility, or the central visual idea.
- **P2 — Medium:** repeated slop pattern or system inconsistency with visible impact.
- **P3 — Low:** isolated polish issue.

Do not create a single numeric slop score. It hides evidence and treats taste as objective.

Return this shape:

```markdown
Verdict: [No material slop found in checked scope | Slop patterns present | Quality fixes needed | Blocked by missing evidence]

Checked scope:
- ...

| Priority | Class | Pattern | Evidence | Why it hurts | Design swap |
| --- | --- | --- | --- | --- | --- |
| P1 | Slop pattern | ... | ... | ... | ... |

System notes:
- Typography and pairing: ...
- Color and material: ...
- Layout and spacing: ...
- Motion and states: ...

What already works:
- ...

Unknowns:
- ...

Next pass:
1. ...
```

Lead with the five to eight findings that would most improve the design. Group minor repetitions instead of listing every instance. Quote visible copy or name exact components, sections, states, selectors, or screenshots as evidence.

If the user asks for fixes, finish the report first, implement the approved highest-impact swaps, and verify the rendered result again. Removing slop is one pass; adding a memorable design thesis is a separate craft pass.
