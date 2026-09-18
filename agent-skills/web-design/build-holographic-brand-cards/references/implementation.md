# Implementation reference

## Component contract

Keep the WebGL scene narrow and reusable:

```ts
type HolographicPartnerCardProps = {
  brand: string
  imageSrc: string
  variant?: 'portrait' | 'landscape'
  eager?: boolean
  showFallback?: boolean
}
```

The iframe accepts these query parameters:

| Key | Portrait default | Landscape default |
| --- | ---: | ---: |
| `image` | required | required |
| `cardWidth` | `640` | `960` |
| `cardHeight` | `848` | `640` |
| `radius` | `40` | `43` |

Use image-space dimensions for the shader. CSS may resize the host freely, but glitter density and corner geometry should not change with presentation size.

## Pointer bridge

If the decorative iframe does not receive pointer events, normalize them on the semantic host and forward them:

```js
function sendPointer(event) {
  const rect = host.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  const y = 1 - ((event.clientY - rect.top) / rect.height) * 2
  frame.contentWindow?.postMessage(
    { type: 'holographic-pointer', x, y, hover: 1 },
    location.origin,
  )
}

function resetPointer() {
  frame.contentWindow?.postMessage(
    { type: 'holographic-pointer', x: 0, y: 0, hover: 0 },
    location.origin,
  )
}
```

Inside the scene, reject messages from other origins and clamp every value:

```js
addEventListener('message', (event) => {
  if (event.origin !== location.origin) return
  if (event.data?.type !== 'holographic-pointer') return
  target.x = Math.max(-1, Math.min(1, Number(event.data.x) || 0))
  target.y = Math.max(-1, Math.min(1, Number(event.data.y) || 0))
  target.hover = Math.max(0, Math.min(1, Number(event.data.hover) || 0))
})
```

Reset on pointer leave, cancel, touch end, blur, and host unmount.

## Landed shader constants

Use these as a coherent starting point rather than independent decoration knobs:

| Layer | Value |
| --- | --- |
| Primary glitter cell | `6.8` image pixels |
| Fine glitter factor | `0.42 x 0.42` |
| Dissolve/noise scale | `255` |
| Pointer field shift | `0.62` |
| Idle field drift | `0.03` |
| Sheen radii | `70`, `300` |
| Broad laminate | scale `115`, strength `0.09` |
| Fine laminate | scale `5`, strength `0.012` |
| Key light | `(-1.30, 1.24, 2.25)` |
| Fill light | `(1.20, -0.90, 2.05)` |
| Shadow receiver depth | `0.62` |
| Shadow blur | `310` image pixels |
| Shadow opacity | `0.86` |

The artwork texture is sRGB. Perform lighting and blend math in a consistent color space, then encode once for display. Double-encoding makes dark art gray; skipping conversion makes colored foil too saturated.

## Rounded silhouette and shadow

Convert fragment coordinates into the same image-space units as `radius`, evaluate a rounded-rectangle signed distance, and soften the edge with `fwidth`. Use the same silhouette for the shadow projection. A CSS radius alone cannot stop shader glitter from appearing in transparent corners.

Project each edge and arc segment from the light position onto the receiver plane. Build one closed shadow polygon and blur that polygon. Do not duplicate and offset the artwork texture.

## Loading states

Use three explicit host states:

- `loading`: renderer has mounted but has not reported ready.
- `ready`: scene texture, materials, and first frame are complete.
- `fallback`: WebGL or texture initialization failed.

For eager above-fold cards, render no duplicate `<img>` during `loading`. For lazy cards, keep one fallback image until `ready`, then fade it out. Never leave both layers visibly opaque.

## Footer geometry

A balanced partner-card footer starts with:

- a `64 x 64 px` logo tile;
- a logo mark around `40 x 40 px` with safe padding;
- a `14 px` gap from tile to brand name;
- `16-21 px` top separation from the artwork;
- brand name plus one short relationship description.

Theme names such as `Arcade`, `Windows 95`, or `Skeuomorphic`, and activity pills such as `Courses` or `Partnership`, were intentionally removed from the final card. Preserve that simplified hierarchy unless the task explicitly asks to restore taxonomy.
