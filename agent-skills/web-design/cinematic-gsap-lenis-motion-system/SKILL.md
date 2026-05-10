---
name: cinematic-gsap-lenis-motion-system
description: Create premium cinematic web motion systems with GSAP, ScrollTrigger, and Lenis. Use for luxury editorial websites, creative studio portfolios, Awwwards-style interactions, smooth scroll reveals, staggered text, parallax, pinned sections, magnetic hover states, custom cursors, and mouse-reactive layered movement.
---

# Cinematic GSAP Lenis Motion System

## Use When
- The site needs a full premium motion language, not one isolated animation.
- Smooth scrolling, scroll reveals, pinned scenes, parallax, hover motion, and cursor behavior should feel connected.
- The target feel is luxury editorial, Apple-level polish, creative studio portfolio, or immersive cinematic storytelling.
- The stack can use GSAP, ScrollTrigger, and Lenis.

## Motion Taste
- Smooth, elegant, slightly delayed, and intentional.
- Staggered motion should guide reading order.
- Layered movement should create depth without making the interface feel busy.
- ScrollTrigger should start scenes when they enter the viewport, not react to every tiny scroll.
- Prefer subtlety over intensity.

Avoid:
- Bounce, elastic, springy, or playful motion.
- Fast abrupt transitions.
- Large scale jumps.
- Over-animated UI.
- Flashy gaming-style effects.

## Base Tokens
- Eases: `power3.out`, `power4.out`, `expo.out`.
- Scroll scrub: `scrub: 0.8` to `1.4` for cinematic delay.
- Reveals: `0.75s` to `1.1s`.
- Hover: `0.35s` to `0.6s`.
- Cursor lag: `0.25s` to `0.45s`.
- Text stagger: words `0.035s` to `0.07s`, lines `0.08s` to `0.14s`.
- Card stagger: `0.06s` to `0.1s`.
- Reveal trigger: `start: "top 82%"`.
- Pin handoff: `anticipatePin: 1`.

## Setup

Install:

```bash
npm i gsap lenis
```

Initialize once, after the DOM exists. Lenis drives its RAF through the GSAP ticker so ScrollTrigger and smooth scroll stay synced.

```js
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
gsap.defaults({ ease: "power3.out", duration: 0.85 });

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let lenis;

if (!reduceMotion) {
  lenis = new Lenis({
    lerp: 0.08,
    smoothWheel: true,
    wheelMultiplier: 0.9,
    anchors: true,
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

window.addEventListener("load", () => {
  ScrollTrigger.refresh();
});
```

## Markup API

Use small data attributes so the motion system can be reused across pages.

```html
<h1 data-motion-text="lines">Digital products with cinematic restraint.</h1>
<p data-motion-text="words">Every interaction should feel deliberate.</p>

<section data-reveal-group>
  <article data-reveal="fade-up" data-reveal-item>...</article>
  <article data-reveal="fade-up" data-reveal-item>...</article>
</section>

<figure data-image-reveal data-parallax-section>
  <img data-parallax-image src="/studio.jpg" alt="">
</figure>

<a data-magnetic data-cursor-label="Explore" href="/work">Explore</a>
<div data-cursor><span data-cursor-label></span></div>
```

## CSS Foundation

```css
html.has-motion [data-motion-text],
html.has-motion [data-reveal],
html.has-motion [data-reveal-item],
html.has-motion [data-image-reveal] {
  visibility: hidden;
}

.motion-line-mask,
.motion-word-mask {
  display: inline-block;
  overflow: hidden;
  vertical-align: top;
}

.motion-line,
.motion-word {
  display: inline-block;
  will-change: transform, opacity, filter;
}

[data-image-reveal] {
  overflow: hidden;
}

[data-parallax-image] {
  display: block;
  width: 100%;
  height: 115%;
  object-fit: cover;
  will-change: transform;
}

[data-cursor] {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 9999;
  pointer-events: none;
  mix-blend-mode: difference;
  transform: translate3d(-50%, -50%, 0);
  will-change: transform;
}

@media (prefers-reduced-motion: reduce), (pointer: coarse) {
  [data-cursor] {
    display: none;
  }
}
```

## Staggered Text Reveals

Use masked containers for premium text. Prefer manual line wrappers when exact line breaks matter. Use word splitting for flexible responsive text.

```js
document.documentElement.classList.add("has-motion");

function splitWords(element) {
  if (element.dataset.motionSplit === "true") return;

  const text = element.textContent || "";
  const parts = text.split(/(\s+)/);

  element.textContent = "";
  element.setAttribute("aria-label", text.trim());

  let index = 0;
  parts.forEach((part) => {
    if (!part.trim()) {
      element.appendChild(document.createTextNode(part));
      return;
    }

    const mask = document.createElement("span");
    const word = document.createElement("span");

    mask.className = "motion-word-mask";
    mask.setAttribute("aria-hidden", "true");
    word.className = "motion-word";
    word.textContent = part;
    word.style.setProperty("--word-index", index);

    mask.appendChild(word);
    element.appendChild(mask);
    index += 1;
  });

  element.dataset.motionSplit = "true";
}

function splitLines(element) {
  if (element.dataset.motionLineSplit === "true") return;
  if (element.querySelector(".motion-line")) return;

  const text = (element.textContent || "").trim();
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return;

  element.textContent = "";
  element.setAttribute("aria-label", text);

  lines.forEach((line) => {
    const mask = document.createElement("span");
    const inner = document.createElement("span");

    mask.className = "motion-line-mask";
    mask.setAttribute("aria-hidden", "true");
    inner.className = "motion-line";
    inner.textContent = line;

    mask.appendChild(inner);
    element.appendChild(mask);
    element.appendChild(document.createTextNode(" "));
  });

  element.dataset.motionLineSplit = "true";
}

function initTextReveals() {
  if (reduceMotion) {
    gsap.set("[data-motion-text]", { autoAlpha: 1, clearProps: "all" });
    return;
  }

  gsap.utils.toArray("[data-motion-text='words']").forEach((element) => {
    splitWords(element);
    const words = element.querySelectorAll(".motion-word");

    gsap.set(element, { autoAlpha: 1 });
    gsap.fromTo(
      words,
      { yPercent: 110, autoAlpha: 0, filter: "blur(8px)" },
      {
        yPercent: 0,
        autoAlpha: 1,
        filter: "blur(0px)",
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.055,
        scrollTrigger: {
          trigger: element,
          start: "top 82%",
          once: true,
        },
      }
    );
  });

  gsap.utils.toArray("[data-motion-text='lines']").forEach((element) => {
    splitLines(element);
    const lines = element.querySelectorAll(".motion-line");
    const targets = lines.length ? lines : element.children;

    gsap.set(element, { autoAlpha: 1 });
    gsap.fromTo(
      targets,
      { yPercent: 100, autoAlpha: 0, filter: "blur(8px)" },
      {
        yPercent: 0,
        autoAlpha: 1,
        filter: "blur(0px)",
        duration: 1,
        ease: "power4.out",
        stagger: 0.11,
        scrollTrigger: {
          trigger: element,
          start: "top 84%",
          once: true,
        },
      }
    );
  });
}
```

Line markup when exact line breaks matter:

```html
<h2 data-motion-text="lines">
  <span class="motion-line-mask"><span class="motion-line">Cinematic motion</span></span>
  <span class="motion-line-mask"><span class="motion-line">with editorial restraint.</span></span>
</h2>
```

## Scroll Reveals

Create a small reveal preset map. Use `autoAlpha`, transforms, and light blur. Use blur sparingly on large elements.

```js
const revealPresets = {
  "fade-up": { from: { y: 32, autoAlpha: 0 }, to: { y: 0, autoAlpha: 1 } },
  "blur-in": { from: { y: 18, autoAlpha: 0, filter: "blur(10px)" }, to: { y: 0, autoAlpha: 1, filter: "blur(0px)" } },
  "scale": { from: { scale: 0.96, autoAlpha: 0 }, to: { scale: 1, autoAlpha: 1 } },
  "slide-left": { from: { x: 48, autoAlpha: 0 }, to: { x: 0, autoAlpha: 1 } },
  "slide-right": { from: { x: -48, autoAlpha: 0 }, to: { x: 0, autoAlpha: 1 } },
};

function initScrollReveals() {
  if (reduceMotion) {
    gsap.set("[data-reveal], [data-reveal-item]", { autoAlpha: 1, clearProps: "all" });
    return;
  }

  gsap.utils.toArray("[data-reveal-group]").forEach((group) => {
    const items = group.querySelectorAll("[data-reveal-item]");
    gsap.set(group, { autoAlpha: 1 });
    gsap.fromTo(
      items,
      { y: 36, autoAlpha: 0, filter: "blur(8px)" },
      {
        y: 0,
        autoAlpha: 1,
        filter: "blur(0px)",
        duration: 0.95,
        ease: "power4.out",
        stagger: 0.075,
        scrollTrigger: {
          trigger: group,
          start: "top 82%",
          once: true,
        },
      }
    );
  });

  gsap.utils.toArray("[data-reveal]:not([data-reveal-item])").forEach((element) => {
    const preset = revealPresets[element.dataset.reveal] || revealPresets["fade-up"];
    gsap.set(element, { autoAlpha: 1 });
    gsap.fromTo(element, preset.from, {
      ...preset.to,
      duration: 0.9,
      ease: "power4.out",
      delay: Number(element.dataset.revealDelay || 0),
      scrollTrigger: {
        trigger: element,
        start: "top 84%",
        once: true,
      },
    });
  });
}
```

## Clip Image Reveals

```js
function initImageReveals() {
  if (reduceMotion) {
    gsap.set("[data-image-reveal]", { autoAlpha: 1, clipPath: "none" });
    return;
  }

  gsap.utils.toArray("[data-image-reveal]").forEach((figure) => {
    const image = figure.querySelector("img");
    gsap.set(figure, { autoAlpha: 1 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: figure,
        start: "top 82%",
        once: true,
      },
    });

    tl.fromTo(
      figure,
      { clipPath: "inset(0 0 100% 0)" },
      { clipPath: "inset(0 0 0% 0)", duration: 1.1, ease: "power4.out" }
    ).fromTo(
      image,
      { scale: 1.08, autoAlpha: 0.75 },
      { scale: 1, autoAlpha: 1, duration: 1.2, ease: "power4.out" },
      0
    );
  });
}
```

## Parallax Motion

Use speed differences instead of dramatic movement. Backgrounds move slower than content. Foreground accents move slightly faster.

```js
function initParallax() {
  if (reduceMotion) return;

  gsap.utils.toArray("[data-parallax-image], [data-parallax-layer]").forEach((layer) => {
    const speed = Number(layer.dataset.parallaxSpeed || 0.18);
    const section = layer.closest("[data-parallax-section]") || layer;

    gsap.to(layer, {
      y: () => window.innerHeight * speed * -1,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.2,
        invalidateOnRefresh: true,
      },
    });
  });
}
```

## Pinned Scroll Sections

Use pinned sections for story moments only. Keep scroll-synced movement linear, then layer eased reveal tweens inside the scene.

```js
function initHorizontalGalleries() {
  if (reduceMotion) return;

  gsap.utils.toArray("[data-horizontal-gallery]").forEach((section) => {
    const track = section.querySelector("[data-horizontal-track]");
    if (!track) return;

    gsap.to(track, {
      x: () => -(track.scrollWidth - window.innerWidth),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${track.scrollWidth}`,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
  });
}
```

Sticky storytelling pattern:

```js
function initStoryScenes() {
  if (reduceMotion) return;

  gsap.utils.toArray("[data-story-scene]").forEach((scene) => {
    const panels = scene.querySelectorAll("[data-story-panel]");

    gsap.timeline({
      scrollTrigger: {
        trigger: scene,
        start: "top top",
        end: () => `+=${panels.length * window.innerHeight}`,
        scrub: 1.1,
        pin: true,
        anticipatePin: 1,
      },
    })
      .to(panels, { yPercent: -100 * (panels.length - 1), ease: "none" })
      .to(scene.querySelectorAll("[data-story-depth]"), { yPercent: -16, ease: "none" }, 0);
  });
}
```

## Premium Hover Interactions

Use GSAP `quickTo` for magnetic motion so hover follows the pointer without re-creating tweens on every event.

```js
function initMagnetic() {
  if (reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;

  gsap.utils.toArray("[data-magnetic]").forEach((element) => {
    const strength = Number(element.dataset.magnetic || 0.18);
    const xTo = gsap.quickTo(element, "x", { duration: 0.45, ease: "power3.out" });
    const yTo = gsap.quickTo(element, "y", { duration: 0.45, ease: "power3.out" });

    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * strength;
      const y = (event.clientY - rect.top - rect.height / 2) * strength;

      xTo(x);
      yTo(y);
    });

    element.addEventListener("pointerleave", () => {
      xTo(0);
      yTo(0);
    });
  });
}
```

Hover recipes:
- Magnetic buttons: translate `x/y` only, keep scale under `1.03`.
- Magnetic cards: add `rotateX/rotateY` under `4deg`.
- Image zoom: `scale: 1` to `1.06`, duration `0.7s`, ease `power3.out`.
- Grayscale to color: transition filter only on small/medium media.
- Animated arrows: move icon `x: 0` to `x: 6`, fade the duplicate arrow in.
- Directional hover: calculate pointer entry side, but keep movement under `16px`.

## Custom Cursor

Use a cursor follower as atmosphere, not decoration. Hide it on touch devices.

```js
function initCursor() {
  if (reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;

  const cursor = document.querySelector("[data-cursor]");
  if (!cursor) return;

  const label = cursor.querySelector("[data-cursor-label]");
  const xTo = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3.out" });
  const yTo = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3.out" });

  document.addEventListener("pointermove", (event) => {
    xTo(event.clientX);
    yTo(event.clientY);
  });

  gsap.utils.toArray("[data-cursor-label]")
    .filter((target) => !cursor.contains(target))
    .forEach((target) => {
      target.addEventListener("pointerenter", () => {
        if (label) label.textContent = target.dataset.cursorLabel || "";
        gsap.to(cursor, { scale: 1.75, duration: 0.35, ease: "power3.out" });
      });

      target.addEventListener("pointerleave", () => {
        if (label) label.textContent = "";
        gsap.to(cursor, { scale: 1, duration: 0.35, ease: "power3.out" });
      });
    });
}
```

## Mouse-Reactive Layers

Use one pointer listener per section. Depth should be barely visible.

```js
function initMouseParallax() {
  if (reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;

  gsap.utils.toArray("[data-mouse-parallax]").forEach((section) => {
    const layers = section.querySelectorAll("[data-mouse-depth]");
    const setters = Array.from(layers).map((layer) => ({
      layer,
      depth: Number(layer.dataset.mouseDepth || 0.04),
      xTo: gsap.quickTo(layer, "x", { duration: 0.8, ease: "power3.out" }),
      yTo: gsap.quickTo(layer, "y", { duration: 0.8, ease: "power3.out" }),
    }));

    section.addEventListener("pointermove", (event) => {
      const rect = section.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;

      setters.forEach(({ depth, xTo, yTo }) => {
        xTo(x * depth);
        yTo(y * depth);
      });
    });

    section.addEventListener("pointerleave", () => {
      setters.forEach(({ xTo, yTo }) => {
        xTo(0);
        yTo(0);
      });
    });
  });
}
```

## Choreography Rules
- Hero: background or media starts first, headline lines second, supporting copy third, CTA last.
- Sections: label first, heading second, media third, cards/details last.
- Pinned scenes: one idea per viewport. Avoid stacking too many simultaneous transforms.
- Parallax: background slower, foreground slightly faster, text mostly stable.
- Cursor and hover effects should support navigation intent, not fight it.

## Performance Rules
- Animate `transform`, `opacity`, and short-lived `clip-path`.
- Use `filter: blur()` only on text or small elements.
- Keep pinned sections limited and test them on mobile.
- Add `will-change` only to elements that actually animate.
- Use `ScrollTrigger.refresh()` after images, fonts, or layout shifts.
- In React or SPA routes, wrap setup in `gsap.context()` and call `ctx.revert()` on cleanup.
- Kill or revert ScrollTriggers on page transitions before initializing the next route.

## Init Order

```js
initTextReveals();
initScrollReveals();
initImageReveals();
initParallax();
initHorizontalGalleries();
initStoryScenes();
initMagnetic();
initCursor();
initMouseParallax();
ScrollTrigger.refresh();
```

## QA Checklist
- Text and content remain visible with JavaScript disabled.
- Reduced-motion users get static content and no smooth-scroll hijacking.
- Scroll reveals animate once unless the design explicitly asks for replay.
- Pinned sections do not overlap the next section.
- Hover and cursor interactions are disabled on touch.
- No layout properties are animated during scroll.
- The page still feels readable if all decorative motion is removed.
