# Cursor trail implementation contract

## Contents

- Installation
- Exact shader graph
- Layering
- Capability and lifecycle gates
- Framework adaptation
- Validation checklist
- Common failures

## Installation

Install `shaders` with the project's existing package manager. Use the framework entry point documented at <https://shaders.com/docs/guide>. For Vite, do not add `shaders` to `optimizeDeps.exclude`; its dependencies need normal pre-bundling.

Use client-only rendering for the shader module. The semantic section and its static background must remain server-renderable. React/Next projects can use the templates in `assets/react/`; the gate delays the dynamic import until capability checks pass.

## Exact shader graph

Use exactly one `Shader` root. Keep these children in this order:

1. `DotGrid`: `id="trailDots"`, `density={40}`, `twinkle={0.9}`, `visible={false}`. Drive `dotSize` with an inline map from `source: "trailFlow"`, channel `alpha`, input `0..1`, output `0..1`.
2. `ChromaFlow`: `id="trailFlow"`, `intensity={1.4}`, `radius={2.9}`, `visible={false}`.
3. `LinearGradient`: `#1e1e1f` to `#070708`, HSL, start `{x:0,y:1}`, end `{x:1,y:0}`.
4. `LinearGradient`: `#000000` to `#ffffff`, HSL, the same endpoints, `maskSource="trailDots"`.
5. `CursorRipples` with defaults.
6. `FilmGrain` with `strength={0.1}`.

The invisible components are data sources, not dead code. `trailFlow` controls dot size; `trailDots` masks the white gradient. Removing either invisible component or breaking either ID link removes the visible trail.

Disable library telemetry when the framework API supports it. Keep the graph's props static rather than putting them into component state.

## Layering

Use this semantic relationship:

```text
section.cursor-trail-region (position: relative; isolation: isolate; overflow: hidden)
├─ static image or dark background (always present)
├─ div.cursor-trail-layer[aria-hidden=true] (absolute, full bleed)
│  └─ capability gate → one Shader canvas
└─ semantic content and controls (relative; higher z-index)
```

For a photographic hero, start with `mix-blend-mode: screen` and opacity around `0.72–0.82`. For a near-black standalone section, use normal blending so the graph's dark gradient becomes the section background. Never sacrifice text contrast.

Do not overlay a separate pointer-capturing element above links. Keep content at a higher stacking level so it remains clickable. Test cursor response over non-interactive and interactive areas before deciding whether the canvas can ignore pointer events.

## Capability and lifecycle gates

Load and mount the shader only when all conditions pass:

- `navigator.gpu` exists.
- `(hover: hover) and (pointer: fine)` matches.
- `prefers-reduced-motion: reduce` does not match.
- `prefers-reduced-transparency: reduce` does not match.
- The document is visible and the window is focused.
- An `IntersectionObserver` reports the section near the viewport.

Listen for preference, visibility, blur, and focus changes. Disconnect the observer and remove every listener during cleanup. Unmounting the shader is the pause mechanism; do not leave a hidden continuous GPU loop running offscreen.

Use CSS media-query fallbacks in addition to JavaScript gates. CSS prevents a late or failed initialization from exposing the canvas when an accessibility preference changes.

## Framework adaptation

React/Next: use the two-module pattern in `assets/react/`. `CursorTrailGate.tsx` is lightweight and lazy-loads `CursorTrailShader.tsx` only after eligibility passes. Keep both files client components in an App Router project.

Vue, Svelte, or Solid: translate the same split into a lightweight host component and a dynamically imported shader component. Import from the framework-specific Shaders subpath. Keep the shader props as static literals and preserve graph order and IDs.

Plain JavaScript: follow the current Shaders plain-JS guide if available. Preserve the same capability checks and static fallback; do not recreate the effect with an unrelated canvas implementation while claiming it is this graph.

## Validation checklist

- One canvas and one shader engine only.
- Graph order and two ID linkages remain exact.
- Static content exists in server-rendered HTML.
- Keyboard focus and activation work above the canvas.
- No shader chunk is requested on unsupported WebGPU, touch-only, or reduced-motion paths when the framework permits conditional loading.
- The shader unmounts offscreen, on blur, and in hidden tabs.
- Reduced motion, reduced transparency, forced colors, and coarse pointers hide the layer.
- Production build, lint, and focused tests pass.
- No hotlinks to Shaders preview/data domains.

## Common failures

- Visible gradient but no dots: restore `source: "trailFlow"`, `id="trailFlow"`, `maskSource="trailDots"`, and `id="trailDots"`.
- Static dots everywhere: keep `dotSize` as the inline map driver and both driver components `visible={false}`.
- Links stop working: fix stacking; do not place a pointer-capturing wrapper above content.
- SSR or hydration failure: isolate Shaders imports in a client-only dynamically loaded module.
- Large initial bundle: move capability checks into a lightweight gate before importing the shader module.
- GPU continues offscreen: use `IntersectionObserver` to unmount, and clean up visibility/focus listeners.
