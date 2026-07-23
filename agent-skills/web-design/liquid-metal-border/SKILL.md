---
name: liquid-metal-border
description: Add and tune animated liquid-metal WebGL borders with the React `metal-fx` package. Use when buttons, icon controls, chips, tabs, cards, or selected surfaces need a metallic active, selected, hover, focus, or premium border; when implementing the MetalFx component from metal.jakubantalik.com; or when troubleshooting its presets, themes, strength, glow, reflections, sizing, radius, animation, accessibility, SSR, or performance.
---

# Liquid Metal Border

## Core Contract

1. Use `metal-fx` in React 18 or newer.
2. Wrap exactly one real host element such as a `button`, `a`, `div`, or `article`.
3. Keep the host semantic and interactive. `MetalFx` is visual framing, not the control.
4. Reserve the animated border for active, selected, focused, hovered, or primary surfaces. Do not put it around every control.
5. Keep a static CSS border or focus outline as the fallback. WebGL decoration must never carry essential state by itself.
6. Pause non-active instances and reduced-motion experiences.
7. Test light and dark modes independently. Reflections intentionally render only in dark mode.

## Inspect Before Editing

- Confirm the project uses React and has `react` and `react-dom` version 18 or newer.
- Find the real control, its dimensions, radius, background, border, outline, shadow, active-state source, and theme source.
- Decide whether the metal should be always visible or driven by `active`, `selected`, hover, or focus state.
- Check whether the project has a manual theme toggle. Use that state instead of `theme="auto"` when it does not follow the OS.
- Identify nearby elements that genuinely benefit from reflected light. Do not add reflections by default.
- Check the installed `metal-fx` version before relying on the prop surface below.

## Install and Import

Install with the project's package manager:

```bash
npm install metal-fx
# pnpm add metal-fx
# yarn add metal-fx
# bun add metal-fx
```

Import the named React component:

```tsx
import { MetalFx } from "metal-fx";
```

Do not import a stylesheet. The package injects its component styles. It supports ESM and CommonJS builds, is SSR-safe, and mounts the WebGL pipeline after hydration. In a Next.js App Router project, render it from a Client Component because the component uses client-side React hooks.

## Baseline Button

Start with a restrained border before adding reflections or custom shader geometry:

```tsx
import { MetalFx } from "metal-fx";

export function UpgradeButton() {
  return (
    <MetalFx
      variant="button"
      preset="chromatic"
      theme="auto"
      strength={0.85}
    >
      <button type="button">Upgrade to Pro</button>
    </MetalFx>
  );
}
```

The wrapper measures the child, paints the metal ring on top, and keeps the child interactive. Size the child normally with CSS, Tailwind, or inline styles.

## Active-State Pattern

Keep one mounted instance and drive its intensity from real component state. Use `aria-pressed`, `aria-selected`, or the native selected-state mechanism so the visual effect is not the only signal.

```tsx
"use client";

import { useEffect, useState } from "react";
import { MetalFx } from "metal-fx";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced;
}

export function LiquidMetalToggle({
  selected,
  onSelect,
}: {
  selected: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();
  const highlighted = selected || hovered || focused;

  return (
    <MetalFx
      className="liquid-metal-toggle"
      variant="button"
      preset="chromatic"
      strength={highlighted ? 0.9 : 0.14}
      paused={reducedMotion || !highlighted}
      disableGlow={reducedMotion || !highlighted}
      ringCssPx={selected ? 1.5 : 1}
      normalizeHostStyles={false}
    >
      <button
        type="button"
        className="liquid-metal-toggle__control"
        aria-pressed={selected}
        onClick={onSelect}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        Auto
      </button>
    </MetalFx>
  );
}
```

```css
.liquid-metal-toggle {
  background: #18181b;
  border-radius: 999px;
}

.liquid-metal-toggle__control {
  min-height: 40px;
  padding: 0 18px;
  color: #fafafa;
  background: transparent;
  border: 0;
  border-radius: 999px;
  box-shadow: none;
}

.liquid-metal-toggle__control:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 3px;
}
```

Use `paused` to stop non-active canvas updates; it freezes the last frame without hiding the ring. `strength` changes rendered opacity from `0` to `1` but does not slow the shader.

## Static Border and Card Pattern

Use the wrapper as the surface when the child must remain transparent:

```tsx
<MetalFx
  variant="button"
  preset="silver"
  theme="dark"
  strength={0.55}
  borderRadius={24}
  ringCssPx={1}
  shaderScale={1.45}
  disableGlow
  normalizeHostStyles={false}
  style={{ background: "#111318" }}
>
  <article className="feature-card">
    <h3>Realtime review</h3>
    <p>Keep feedback attached to the work.</p>
  </article>
</MetalFx>
```

Keep the article background transparent so it does not cover the ring. Use the child for content layout and the `MetalFx` wrapper for the visible surface.

## Complete Customization Surface

| Prop | Values and default | Use |
| --- | --- | --- |
| `children` | One React host element; required | Preserve the real button, link, chip, card, or icon control. |
| `variant` | `"button"` default, `"circle"` | Choose a 1 px pill-style baseline at shader scale `1.6`, or a 2 px compact-circle baseline at scale `1.3`. The measured child still controls the rendered size. |
| `preset` | `"chromatic"` default, `"silver"`, `"gold"` | Choose iridescent rainbow, cool steel, or warm gold. Each includes dark and light tuning. |
| `theme` | `"auto"` default, `"dark"`, `"light"` | Follow live `prefers-color-scheme` changes or pin the effect to the app theme. SSR starts dark, then resolves on the client. |
| `strength` | Number `0..1`; default `1` | Scale canvas and glow opacity. Use lower values for idle states and stronger values for active states. |
| `paused` | Boolean; default `false` | Freeze this instance on its current shader frame while keeping the silhouette visible. |
| `borderRadius` | Number in CSS pixels; optional | Override the radius. When omitted, read the child's computed radius on resize. |
| `normalizeHostStyles` | Boolean; default `true` | Remove the child's background, border, outline, and shadow so they do not fight the ring. Set `false` when preserving a custom focus outline or fallback border. |
| `reflectionTargets` | Array of React element refs; optional | Cast a soft mirrored reflection onto selected neighbouring elements. Dark mode only. |
| `disableGlow` | Boolean; default `false` | Remove the wandering halo while retaining the shader ring. |
| `shaderScale` | Number; variant baseline by default | Increase to zoom into larger metal pattern features; decrease to zoom out. |
| `ringCssPx` | Number; variant baseline by default | Override the visible ring thickness in CSS pixels. |
| `scale` | Number; default `1` | Scale every absolute-pixel engine constant together for CSS zoom or deliberately enlarged UI systems. |
| `className` | String; optional | Style the `MetalFx` wrapper, not the child. |
| `style` | React CSS properties; optional | Size or style the wrapper surface directly. |
| `ref` | React ref; optional | Access the forwarded wrapper `HTMLDivElement`. |

Other valid `HTMLDivElement` attributes are forwarded to the wrapper.

## Tuning Defaults

- Primary pill button: `variant="button"`, `strength={0.75}`, `ringCssPx={1}`.
- Selected tab or filter: idle strength `0.1–0.2`, selected strength `0.75–0.9`.
- Icon button: `variant="circle"`, explicit square child dimensions, `strength={0.7}`.
- Large card: `ringCssPx={1}`, `shaderScale={1.3–1.6}`, `disableGlow`.
- Premium CTA: start with `chromatic`; use `silver` for neutral UI and `gold` only for warm or luxury palettes.
- Quiet active state: disable glow before reducing the ring below legibility.
- Doubled design system: use `scale={2}` instead of independently doubling shader, ring, glow, and reflection values.

Keep `strength <= 0.9` for routine controls. Full-strength chromatic metal can dominate labels and icons.

## Sizing and Radius

Prefer sizing the child:

```tsx
<MetalFx variant="circle">
  <button style={{ width: 36, height: 36 }} aria-label="Send">
    ↑
  </button>
</MetalFx>
```

To make the frame larger than the child, size the wrapper and stretch the child:

```tsx
<MetalFx style={{ width: 44, height: 44 }} variant="circle">
  <button
    style={{ width: "100%", height: "100%" }}
    aria-label="Send"
  >
    ↑
  </button>
</MetalFx>
```

The wrapper uses `display: inline-flex`. Do not create cyclic percentage sizing where neither wrapper nor child has an intrinsic size.

## Proximity Reflections

Pass only explicit refs to neighbouring elements:

```tsx
import { useRef } from "react";

const chipRef = useRef<HTMLButtonElement>(null);

<>
  <button ref={chipRef}>Tools</button>
  <MetalFx variant="circle" reflectionTargets={[chipRef]}>
    <button aria-label="Send">↑</button>
  </MetalFx>
</>
```

Omit `reflectionTargets` to disable reflection work. In light mode, reflections are skipped automatically.

## Accessibility and Motion

- Preserve native `button`, `a`, and form semantics inside the wrapper.
- Keep active state in `aria-pressed`, `aria-selected`, checked state, or current-route state.
- Do not rely on hue or animation alone. Retain text, icon, position, weight, or a static edge change.
- Be careful with `normalizeHostStyles`. Its default removes the child's `outline`; set it to `false` and define transparent chrome plus `:focus-visible` when the control needs its own focus ring.
- Set `paused` for reduced motion. Also disable the wandering glow when its movement is unnecessary.
- Keep the effect pointer-transparent and verify the child remains clickable and keyboard-operable.
- Retain a plain CSS border or surface treatment for WebGL failure.

## Performance

`metal-fx` reuses one shared WebGL context, one compiled shader, and one animation loop across mounted instances. It also pauses offscreen copies with `IntersectionObserver` and debounces resize work through animation frames.

Still keep the effect selective:

- Mount it on primary or stateful surfaces, not whole grids of idle controls.
- Pause non-active instances.
- Omit reflections unless they add visible depth.
- Do not animate the wrapped element's dimensions continuously.
- Prefer `disableGlow` for restrained cards and dense toolbars.

## Verification

Run the project's lint, typecheck, production build, tests, and `git diff --check`. Then verify in the Codex browser:

1. Confirm the package is present in the manifest and lockfile.
2. Confirm one `.metal-fx-root` wraps one semantic host.
3. Test hover, pointer-down, selected, keyboard focus, and disabled states.
4. Confirm the active state is exposed semantically and remains clear with the effect hidden.
5. Confirm the focus ring is visible when `normalizeHostStyles` is enabled or disabled.
6. Check the measured size and radius at every responsive breakpoint.
7. Test the app's real light and dark themes; do not assume `auto` matches a manual toggle.
8. Enable reduced motion and confirm the shader stops moving.
9. Scroll the control offscreen and back; confirm the effect resumes without a blank frame.
10. Check console output for WebGL, hydration, resize, or ref errors.
11. Confirm neighbouring controls receive reflections only when explicitly targeted in dark mode.

## Failure Diagnosis

- **The ring is covered:** the child has an opaque background above the canvas. Use default normalization or make the child transparent and style the wrapper.
- **The focus ring disappeared:** `normalizeHostStyles` removed the child outline. Set it to `false` and reset only background, border, and shadow in project CSS.
- **The radius is wrong:** use a real computed radius on the child or pass `borderRadius` explicitly.
- **A circle looks soft or thin:** use `variant="circle"` and explicit square dimensions before increasing `ringCssPx`.
- **The pattern is too busy:** lower `strength`, disable glow, or use `silver`; do not immediately thicken the ring.
- **Reflections are missing in light mode:** expected behavior; reflections are dark-mode only.
- **The effect is the wrong physical size after zooming:** set `scale` to the UI scale instead of tuning each pixel constant independently.
- **The page crashes in a server component:** move the usage behind the framework's client-component boundary.
- **The border is blank on unsupported hardware:** keep the semantic control and CSS fallback complete; treat the WebGL ring as enhancement.

## Handoff

Report the installed `metal-fx` version, wrapped control, active-state source, preset, theme strategy, fallback border, reduced-motion behavior, build/test results, and Codex-browser verification. Distinguish local readiness from a deployed result.
