---
name: shaders-cursor-ripples
description: Add cursor-following fluid WebGPU distortion over an existing image with the Shaders library's ImageTexture and CursorRipples components. Use when a hero, gallery, or media panel needs a water-ripple mouse effect; when replacing a drifting CSS spotlight or flashlight reveal; or when a prompt says to borrow only the shader interaction from a Shaders.com reference while preserving the current brand, image, copy, and layout.
---

# Shaders Cursor Ripples

## Core Contract

1. Preserve the existing page, content, and semantic image.
2. Install `shaders` and import from the active framework subpath.
3. Render the source image through one `Shader` canvas.
4. Place `CursorRipples` after `ImageTexture` so it post-processes that image.
5. Keep `toneMapping="aces"` on the root.
6. Let Shaders track the cursor. Remove custom spotlight coordinates, radial masks, duplicated reveal images, and pointer animation loops.
7. Keep one real image beneath the canvas as the accessible loading and WebGPU fallback.
8. Disable the shader for reduced motion and unsupported WebGPU.
9. Lazy-load the shader code so the library does not inflate the initial page bundle.

When the user asks for only the shader effect, do not copy a reference's ribbon, blob, glow, typography, layout, copy, colors, or identity. Do not substitute the Shaders `Water` component: `CursorRipples` is the interactive image-displacement effect.

## Inspect Before Editing

- Find the real media wrapper, image URL, crop, overlays, z-index, and existing motion.
- Confirm the wrapper has a non-zero rendered width and height.
- Search for old reveal code such as `data-reveal-hover`, `mask-image: radial-gradient`, duplicated images, `requestAnimationFrame`, and manual pointer listeners.
- Preserve unrelated parallax or entrance motion unless it conflicts with the shader canvas.
- Check the installed `shaders` version and current framework API when the package may have changed.

## Install

```bash
npm install shaders
```

Import from `shaders/react`, `shaders/vue`, `shaders/svelte`, or `shaders/solid`. For Vite projects, never add `shaders` to `optimizeDeps.exclude`; its CommonJS dependencies need Vite pre-bundling. No `optimizeDeps` entry is normally required.

Before a commercial release, verify the current Shaders license terms.

## Required Composition

Keep the component order and values below:

```tsx
<Shader toneMapping="aces">
  <ImageTexture url={imageUrl} objectFit="cover" />
  <CursorRipples decay={7.3} radius={0.6} />
</Shader>
```

Use this as the baseline before tuning `intensity`, `chromaticSplit`, or `edges`. Do not add `SolidColor`, `Blob`, `Form3D`, `GaborNoise`, `Glow`, or another generator unless the user explicitly requests the reference's generated artwork.

For React, copy and adapt [assets/react/cursor-ripple-shader.tsx](assets/react/cursor-ripple-shader.tsx) and [assets/react/cursor-ripple-media.css](assets/react/cursor-ripple-media.css).

## Client and Fallback Pattern

Mount the shader only after the browser confirms WebGPU and motion is allowed:

```tsx
const CursorRippleShader = lazy(() => import("./cursor-ripple-shader"));

const [shaderEnabled, setShaderEnabled] = useState(false);
const [shaderReady, setShaderReady] = useState(false);

useEffect(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const sync = () => {
    const enabled = "gpu" in navigator && !reduceMotion.matches;
    setShaderEnabled(enabled);
    if (!enabled) setShaderReady(false);
  };

  sync();
  reduceMotion.addEventListener("change", sync);
  return () => reduceMotion.removeEventListener("change", sync);
}, []);
```

Keep the semantic image in the wrapper, then overlay the lazy shader:

```tsx
<figure className="cursor-ripple-media">
  <img
    className="cursor-ripple-media__fallback"
    src={imageUrl}
    alt={meaningfulAlt}
    width={width}
    height={height}
  />

  {shaderEnabled ? (
    <Suspense fallback={null}>
      <CursorRippleShader
        imageUrl={imageUrl}
        ready={shaderReady}
        onReady={() => setShaderReady(true)}
      />
    </Suspense>
  ) : null}
</figure>
```

For Next.js, an `ssr: false` dynamic import is also valid. Do not hide the fallback until the shader calls `onReady`; a failed WebGPU initialization must leave the page legible and complete.

## Layering Rules

- Give the media wrapper `position: relative`, a definite size, `overflow: hidden`, and `isolation: isolate`.
- Keep the fallback at z-index `0` and the canvas at z-index `1`.
- Fill the wrapper with `position: absolute; inset: 0; width: 100%; height: 100%`.
- Set the shader layer to `pointer-events: none`; Shaders listens globally and converts pointer coordinates using the canvas bounds.
- Mark the shader wrapper `aria-hidden="true"`; the fallback image owns the accessible name.
- Place copy, links, and controls above the canvas so the effect never intercepts interaction.
- Preserve the same crop between the fallback and `ImageTexture`. Use `objectFit="cover"` for full-bleed media.

## Remove the Failed Spotlight Pattern

Delete the old implementation rather than leaving it hidden:

- second reveal image;
- radial `mask-image` and custom reveal variables;
- smoke or blur overlays tied to pointer position;
- component-local `requestAnimationFrame` pointer easing;
- `pointerenter`, `pointermove`, `pointerleave`, and resize bookkeeping created only for the flashlight;
- coarse-pointer rules that reference the retired reveal layers.

Keeping both systems causes coordinate drift, extra GPU work, and confusing fallbacks.

## Performance and Motion

- Lazy-load the shader module behind the WebGPU check.
- Keep exactly one shader canvas for the media panel.
- Use the library's `onReady` callback for a short opacity handoff.
- Use `disableTelemetry` when telemetry is not required.
- Do not animate the canvas size; animate a stable parent if parallax is needed.
- Disable or unmount the shader under `prefers-reduced-motion: reduce`.
- Keep touch layouts usable with the static image; never put essential information inside the effect.

## Verification

Run the project's lint, production build, rendered tests, and `git diff --check`. Then verify in a real browser:

1. Confirm exactly one `canvas[data-renderer="shaders"]` exists.
2. Confirm the shader reaches its ready class and the fallback image remains present.
3. Sweep the pointer across several points in the media. The distortion must follow that path without a detached circle.
4. Confirm links and controls remain clickable.
5. Confirm no console errors or warnings occur.
6. Confirm the static image remains when WebGPU is unavailable or reduced motion is enabled.
7. Confirm the old `data-reveal-hover` or radial-mask layer is absent.
8. Check mobile and desktop crops after the canvas initializes.

## Failure Diagnosis

- **Canvas exists but is blank:** verify the wrapper has non-zero dimensions and the image URL is same-origin or CORS-readable.
- **Image renders but does not ripple:** keep `CursorRipples` after `ImageTexture`; it requires a child/input surface.
- **Ripple is offset:** remove manual pointer transforms and check whether a transformed ancestor changes the canvas bounds.
- **Page crashes during SSR:** move the shader into a client-only, lazy-loaded component.
- **Image flashes on load:** retain the fallback and fade the shader in only from `onReady`.
- **Initial bundle becomes large:** confirm the Shaders import lives only inside the lazy module.
- **Effect blocks buttons:** keep the canvas pointer-transparent and controls in a higher stacking layer.

## Handoff

Report the affected media, Shaders package version, fallback behavior, reduced-motion behavior, build/test results, and live interaction verification. Distinguish a locally ready effect from a published deployment.
