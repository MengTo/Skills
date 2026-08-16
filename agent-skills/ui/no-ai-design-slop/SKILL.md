---
name: no-ai-design-slop
description: Remove visible AI-design clichés, generic generated defaults, and established UI defects from websites, apps, screenshots, mockups, and design code while preserving the existing direction. Use for an anti-slop pass, a restrained cleanup, or a request to make an interface feel less AI-generated without turning it into a full redesign.
---

# No AI Design Slop

Act as a subtractive design editor. Preserve the product's direction, personality, and useful choices. Remove the minimum amount of visual noise, generic patterning, and interface harm needed to make the work clearer and more intentional.

## Boundaries

- Do not infer whether AI made the design.
- Do not redesign the interface by default.
- Do not prescribe a new font, palette, layout, component library, or art direction unless the user asks.
- Do not treat a gradient, serif, dark theme, glass effect, card, animation, or single-font system as slop on its own.
- Do not replace a distinctive choice with a neutral template merely because it is unusual.
- Remove a choice only when it is repeated without purpose, has no clear job, obscures the content, weakens hierarchy, fakes proof, or creates an interaction problem.

## What Counts as Slop

Look for a cluster of symptoms, not a lone aesthetic technique:

- **Defaultness:** the choice feels inserted because it is a common generated-design reflex, not because the product needs it.
- **Repetition:** the same container, icon, sentence shape, glow, or reveal is applied everywhere.
- **No role:** the element communicates no useful information, state, action, hierarchy, or brand meaning.
- **Harm:** the choice makes the interface harder to read, navigate, trust, or use.

Separate these from ordinary quality defects. Both should be removed, but name them accurately.

## Remove AI-Default Layers

### Decorative stacking

Remove decoration when several effects are doing the same job:

- glow behind a gradient headline inside a glass card over an ambient background
- multiple borders, shadows, highlights, and inner rings around one container
- floating orbs, grids, particles, beams, and noise with no product meaning
- excessive pills, badges, eyebrows, and labels that repeat nearby copy
- decorative browser chrome, code windows, or dashboards that do not show real product evidence

Keep the strongest useful layer and remove the rest.

### Template repetition

Remove or collapse patterns that flatten every piece of content into the same component:

- a card around every paragraph, feature, metric, or action
- repeated icon-heading-description tiles with interchangeable copy
- stacked rounded containers whose nesting does not express hierarchy
- the same hero, bento grid, logo strip, testimonials, FAQ, and CTA sequence regardless of the product
- repeated section headings that restate the navigation or preceding sentence

Preserve containers that communicate grouping, state, action, comparison, or interaction.

### Typography and copy clutter

Remove:

- empty superlatives and category claims
- duplicate headings, labels, captions, or button text
- decorative italics, gradients, or letter spacing applied without hierarchy
- unnecessary font changes that do not signal a meaningful role
- long centered paragraphs or line breaks that make reading harder
- tiny labels used to make ordinary content look technical

Keep the author's voice and meaning. Edit the smallest amount of copy needed.

### Motion theater

Remove motion that delays, hides, or competes with the content:

- identical entrance animation on every element
- scroll effects that add no spatial or narrative meaning
- perpetual motion behind reading or form controls
- hover effects that make targets move away
- transitions that block input or make the interface feel slower

Preserve motion that explains state, causality, hierarchy, or spatial change.

### Fake proof and generated filler

Remove:

- invented metrics, customers, testimonials, awards, ratings, or activity
- fake dashboards and charts presented as product evidence
- duplicated logos or placeholder portraits that imply real adoption
- decorative UI screenshots that contradict the actual product
- filler sections added only to make a page feel complete

If proof is unavailable, leave honest space or use clearly labeled placeholders.

## Remove Established UI Failures

Fix these regardless of whether they resemble AI output:

- unclear primary action or competing actions with the same emphasis
- low contrast, unreadable text, or paragraphs that are difficult to scan
- clipped, overflowing, or overlapping content
- broken assets, links, scripts, and controls
- essential information available only on hover
- missing focus, loading, empty, error, disabled, selected, or success states when the flow needs them
- controls without clear labels, roles, or feedback
- inconsistent spacing, type, color, radius, or icon rules that look accidental
- motion that ignores reduced-motion preferences
- layout that fails at a relevant viewport
- visual hierarchy that contradicts task importance

Use the product's existing patterns and tokens when correcting these failures.

## Workflow

1. Inspect the full artifact and note its existing visual direction.
2. Identify a specific harmful pattern. Name the element, evidence, and harm.
3. Ask whether deleting it would remove meaning, state, action, or necessary hierarchy.
4. If not, remove it.
5. If deletion would cause a loss, make the smallest correction using the existing design system.
6. Verify the affected flow, viewport, state, and content.
7. Repeat only for the next highest-impact problem. Stop when the remaining choices have a clear job.

## Editing Rules

- Make the minimum effective edit.
- Prefer one systemic removal over many local restyles.
- Do not add new sections, effects, colors, fonts, assets, or dependencies as compensation.
- Preserve intentional edge, asymmetry, density, humor, and brand character.
- Keep useful proof and product-specific detail.
- When implementation is requested, change the artifact directly and verify it.
- When only feedback is requested, do not modify files.

## Completion Check

Before finishing, confirm:

- the interface has less noise without losing meaning
- primary content and actions are easier to find
- the existing direction still feels recognizable
- no invented proof or placeholder claim is presented as real
- no important state, interaction, or accessibility behavior was removed
- every remaining decorative layer has a defensible role

Report what was removed and why. Do not give an AI-authorship guess or a generic quality score.
