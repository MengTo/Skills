---
name: vantajs
description: Use when adding animated WebGL background effects with Vanta.js (setup, parameters, resizing, performance, integration in React/Next.js).
---

# Vanta.js — Animated WebGL Backgrounds Skill

## When to use
- Decorative animated backgrounds behind hero sections
- You want “wow” quickly without building a full three.js scene
- Lightweight integration into static sites or React/Vue

## How it works
- Vanta injects a canvas into a container element and renders an effect (many use three.js).
- Typical usage: include `three.min.js` (or provide THREE) + one Vanta effect bundle.

## Key APIs/patterns
- Init:
  - `const effect = VANTA.WAVES({ el: "#hero", ...options })`
- Update after init:
  - `effect.setOptions({ color: 0xff88cc })`
- Resize:
  - `effect.resize()` (if container size changes)
- Cleanup:
  - `effect.destroy()` (important in SPAs)

## Common pitfalls
- Container has no size → nothing visible
  - Ensure the target element has explicit width/height (or is laid out).
- Multiple WebGL canvases on one page → GPU load
  - Keep to 1–2 effects/page.
- Mobile/older GPU issues
  - Provide a fallback background color/image; consider disabling on small screens.
- Bundling in frameworks
  - Some builds require `window.THREE` or passing `THREE` in options.

## Quick recipes

### 1) Minimal waves background
```html
<div id="hero" style="height: 70vh;"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vanta/dist/vanta.waves.min.js"></script>
<script>
  const effect = VANTA.WAVES({ el: "#hero", color: 0x0b1220, shininess: 40, waveHeight: 16, zoom: 0.9 });
</script>
```

### 2) React cleanup pattern (concept)
- Create effect in `useEffect`, store in ref, call `destroy()` on unmount.

## What to ask the user
- Which effect (waves, birds, fog, net, etc.) and brand colors?
- Must it run on mobile? If yes, what’s acceptable FPS/quality?
- Is it behind text (needs contrast/readability)?
