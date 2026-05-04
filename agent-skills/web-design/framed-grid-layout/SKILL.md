---
name: framed-grid-layout
description: Create minimal framed grid layouts with thin visible boundary lines, L-shaped corner brackets, subtle diagonal line texture, and strict section alignment. Use when asked for clean, neutral, precise, structured, editorial, technical, or guide-border web layouts.
---

# Framed Grid Layout

## Use When
- A page needs a clean technical structure with visible section boundaries.
- Content should feel precise, organized, editorial, or system-like.
- The design calls for thin guide borders, L-shaped corner brackets, and consistent framed boxes.

## Layout Rules
1. Define the parent grid first; make every section snap to the same columns and rows.
2. Use one border color, one corner bracket color, and one spacing scale across the page.
3. Keep frames rectangular and precise. Avoid floating cards, soft blobs, and uneven margins.
4. Use thin lines: `1px` borders, low-contrast dividers, and subtle bracket marks.
5. Add diagonal background texture at very low opacity; it should read only as surface tension.
6. Align section padding, headings, controls, and media edges to the same grid rhythm.
7. Separate sections with consistent gaps, not random whitespace.

## Base Tokens
Use neutral colors and tune contrast per theme.

```css
:root {
  --fg-bg: #f7f7f4;
  --fg-surface: rgba(255, 255, 255, 0.62);
  --fg-line: rgba(24, 24, 27, 0.14);
  --fg-line-strong: rgba(24, 24, 27, 0.34);
  --fg-texture: rgba(24, 24, 27, 0.035);
  --fg-gap: 16px;
  --fg-pad: clamp(16px, 2vw, 28px);
  --fg-corner: 18px;
}
```

## Parent Grid
Use the parent grid to enforce vertical and horizontal alignment.

```css
.framed-grid {
  min-height: 100vh;
  padding: var(--fg-gap);
  background:
    repeating-linear-gradient(
      135deg,
      transparent 0 11px,
      var(--fg-texture) 11px 12px
    ),
    var(--fg-bg);
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--fg-gap);
}

.framed-grid > * {
  min-width: 0;
}
```

## Framed Section
Each section gets the same box model, line weight, and padding.

```css
.frame {
  position: relative;
  border: 1px solid var(--fg-line);
  background: var(--fg-surface);
  padding: var(--fg-pad);
  overflow: hidden;
}

.frame + .frame {
  margin-top: 0;
}
```

## L-Shaped Corner Brackets
Use background layers so brackets stay crisp without extra markup.

```css
.frame-brackets {
  background:
    linear-gradient(var(--fg-line-strong), var(--fg-line-strong)) left top / var(--fg-corner) 1px no-repeat,
    linear-gradient(var(--fg-line-strong), var(--fg-line-strong)) left top / 1px var(--fg-corner) no-repeat,
    linear-gradient(var(--fg-line-strong), var(--fg-line-strong)) right top / var(--fg-corner) 1px no-repeat,
    linear-gradient(var(--fg-line-strong), var(--fg-line-strong)) right top / 1px var(--fg-corner) no-repeat,
    linear-gradient(var(--fg-line-strong), var(--fg-line-strong)) left bottom / var(--fg-corner) 1px no-repeat,
    linear-gradient(var(--fg-line-strong), var(--fg-line-strong)) left bottom / 1px var(--fg-corner) no-repeat,
    linear-gradient(var(--fg-line-strong), var(--fg-line-strong)) right bottom / var(--fg-corner) 1px no-repeat,
    linear-gradient(var(--fg-line-strong), var(--fg-line-strong)) right bottom / 1px var(--fg-corner) no-repeat,
    var(--fg-surface);
}
```

## Section Spans
Prefer explicit grid spans over ad hoc widths.

```css
.span-12 { grid-column: span 12; }
.span-8 { grid-column: span 8; }
.span-6 { grid-column: span 6; }
.span-4 { grid-column: span 4; }

@media (max-width: 760px) {
  .framed-grid {
    grid-template-columns: 1fr;
  }

  .span-12,
  .span-8,
  .span-6,
  .span-4 {
    grid-column: 1 / -1;
  }
}
```

## Example

```html
<main class="framed-grid">
  <section class="frame frame-brackets span-12">...</section>
  <section class="frame frame-brackets span-8">...</section>
  <aside class="frame frame-brackets span-4">...</aside>
  <section class="frame frame-brackets span-6">...</section>
  <section class="frame frame-brackets span-6">...</section>
</main>
```

## Taste Rules
- Keep frames aligned to the parent grid even when content inside varies.
- Use square or lightly rounded corners only if the product style requires it.
- Do not mix different border weights in adjacent frames.
- Do not add heavy shadows; the visible frame is the structure.
- Keep diagonal texture below `0.05` opacity.
- Repeat corner bracket size consistently across all major sections.

## Quick Checks
- Section edges line up vertically and horizontally.
- Every frame uses the same border, padding, and corner bracket scale.
- Gaps between frames are consistent on desktop and mobile.
- The diagonal texture is visible only on close inspection.
- The layout still reads clearly if the texture layer is removed.
