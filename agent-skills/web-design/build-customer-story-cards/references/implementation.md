# Implementation reference

## Content model

Keep data separate from the card shell:

```ts
type CustomerStory = {
  href: string
  imageSrc: string
  imageAlt: string
  title: string
  description: string
  readTime: string
}
```

The final compact layout intentionally omits publication date and image count. Keep `readTime` immediately above the CTA.

## Semantic order

Use one link as the card root:

```jsx
<a className="story-card" href={story.href}>
  <canvas className="story-card__noise" aria-hidden="true" />
  <span className="story-card__glow" aria-hidden="true" />
  <canvas className="story-card__wisps" aria-hidden="true" />
  <div className="story-card__media">
    <img src={story.imageSrc} alt={story.imageAlt} />
  </div>
  <div className="story-card__body">
    <h3>{story.title}</h3>
    <p>{story.description}</p>
    <span className="story-card__meta">{story.readTime}</span>
    <span className="story-card__cta">Read story <span aria-hidden="true">›</span></span>
  </div>
</a>
```

Do not nest a button inside the link. Decorative canvases are `aria-hidden` and never receive focus.

## Equal-height layout

```css
.story-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(1rem, 1.4vw, 1.375rem);
}

.story-card {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
  border-radius: 12px;
}

.story-card__media { aspect-ratio: 3 / 2; }

.story-card__body {
  position: relative;
  z-index: 4;
  display: flex;
  min-height: 296px;
  flex-direction: column;
}

.story-card__meta { margin-top: auto; }
```

On the single-column breakpoint, remove the fixed minimum height if it creates excessive empty space. The three-column desktop row is the alignment reference.

## Scoped no-scale override

Shared article-card CSS often contains a transform. Override all interactive states inside the customer-story scope:

```css
.customer-stories .story-card__media img,
.customer-stories .story-card:hover .story-card__media img,
.customer-stories .story-card:focus-visible .story-card__media img {
  transform: none;
}

.customer-stories .story-card__media img {
  transition: filter 240ms ease;
}

.customer-stories .story-card:hover .story-card__media img,
.customer-stories .story-card:focus-visible .story-card__media img {
  filter: brightness(1.04) saturate(1.06);
}
```

Do not use a broad `!important` unless the shared selector cannot be narrowed. The goal is to protect this card type without changing article cards elsewhere.

## Noise budget

Render noise into a smaller backing canvas and upscale it with CSS:

- desktop resolution multiplier: `0.72`;
- low-power resolution multiplier: `0.48`;
- desktop cadence: `12 fps`;
- low-power cadence: `8 fps`;
- reduced motion: one frame only.

Pause the timer or RAF when `IntersectionObserver` reports the card offscreen or `document.hidden` is true. A per-card 60 fps full-resolution noise canvas is both expensive and visually harsher.

## Wisp budget

Create wisps only for the active card:

```js
const count = Math.max(16, Math.min(34, Math.round(area / 4200)))
const dpr = Math.min(devicePixelRatio || 1, 2)
const dt = Math.min((time - previousTime) / 1000, 0.05)
```

Give particles radii from `0.5-1.8 px` and speeds from `14-60 px/s`. Fade them near the card edges and clear the canvas on leave. In reduced motion, do not start the wisp loop.

## Layering and pointer glow

Keep canvases clipped by the card's `overflow: hidden`. Put surface effects behind all text and images. Update CSS variables from pointer position:

```js
const rect = card.getBoundingClientRect()
card.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`)
card.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`)
```

Use the variables for one restrained radial gradient. Do not move, rotate, or scale the shell.
