---
name: editorial-portfolio-chapters
description: Create or redesign creative-studio, agency, photographer, artist, and portfolio websites where project work leads the story. Use for dark editorial shells, full-bleed campaign media, color-coded case-study chapters, oversized service typography, restrained project reveals, and a decisive contact finale.
---

# Editorial Portfolio Chapters

Build the page as a sequence of distinct editorial chapters. Let the work establish desire before explaining the studio.

## Establish the Story

1. Open with one strong campaign image and a concise positioning line.
2. Move directly into selected work. Treat each case study as a new magazine cover.
3. Explain the studio point of view only after the work has earned attention.
4. Use oversized service typography as the handoff from proof to contact.
5. End with a high-contrast contact chapter that feels final, not appended.

Replace all source brands, projects, people, claims, images, labels, and links with original or client-provided content. Preserve pacing and hierarchy, not source content.

## Build the Visual System

- Frame the page with near-black, then introduce warm white and one muted color field per project.
- Use a grotesk display face with a neutral text companion. Keep labels compact and copy readable.
- Align to a 12-column grid with 40–64px desktop edge margins.
- Favor square or deliberately cropped media, restrained radii, hairline rules, and almost no shadow.
- Let the strongest proof change scale. Do not turn every section into a hero or bento grid.
- Keep full-bleed chapters rare and purposeful.

## Compose the Page

- Header: place compact navigation at the outer edges and keep the identity centered or strongly anchored.
- Hero: reserve most of the first viewport for one stable image; expose the first project below the fold.
- Projects: alternate dark framing with muted color panels; show title, role, year, and action without hover.
- Studio: use an asymmetrical portrait or process composition instead of a generic team-card grid.
- Services: set capabilities as large semantic headings or links with controlled wrapping.
- Contact: switch to one unmistakable signal color and one primary action.
- Footer: resolve navigation, location, social links, and legal text without competing with the contact ask.

## Implement the Signature Interactions

### Editorial project panel reveal

- Reserve the panel height before media loads.
- Clip only the image layer; keep title and metadata selectable.
- Reveal with a 500–760ms mask or shallow translate.
- On hover or focus, scale media no more than `1.02` and expose the same project action.
- Keep every panel understandable when static.

### Oversized service handoff

- Use `clamp()` for scale and a short edge-aligned text mask.
- Shift weight, underline, or tone on hover and focus without moving layout.
- Open optional details with semantic disclosure behavior, Escape support, and focus return.
- Wrap deliberately on mobile and render immediately under reduced motion.

## Motion Defaults

- Use 160–220ms for control feedback and 500–760ms for section entrances.
- Stagger direct children by 45–70ms with `cubic-bezier(.22,.61,.36,1)`.
- Keep parallax below 5% and the hero stable enough to study.
- Tie navigation or background changes to section boundaries.
- Pause offscreen media and observers; clean up timelines on route changes.
- Do not hijack scroll.

## Validate

- Confirm logical heading order, visible focus, useful alt text, and contrast through every color change.
- Test keyboard, touch, 200% zoom, narrow mobile, slow media, missing media, and reduced motion.
- Confirm case studies remain readable before animation and no source content was lightly paraphrased.
- Remove invented awards, clients, outcomes, or claims when evidence is unavailable.

## Source-Backed Prompt Pack

Use [Mara Voss Interaction Prompt Pack](ARTICLE.md) as a worked example for turning one editorial portfolio into portable loader, pinned chapter, archive, inspection, sticky-stack, and footer interaction prompts. Reuse the motion logic, not the reference identity, copy, imagery, or claims.

## Avoid

- Explaining the studio before showing its work.
- Repeating identical rounded cards across every chapter.
- Fast card choreography, large parallax, or decorative motion loops.
- Hiding project titles or actions until hover.
- Copying source imagery, brand language, project names, or client claims.
