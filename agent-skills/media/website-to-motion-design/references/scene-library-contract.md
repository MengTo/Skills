# Portable scene-library contract

Use this contract when a page-derived frame must run inside a catalog, editor, or export host.

## Fixed stage

Compose on a declared pixel stage and let the host scale it. Size type and spacing from
the stage, not `vw` or `vh`, so preview and export proportions match.

```css
#stage {
  position: fixed;
  left: 50%;
  top: 50%;
  width: 1920px;
  height: 1080px;
  overflow: hidden;
  transform-origin: 50% 50%;
  font-size: 10.8px;
}
```

## Render and ready messages

Agree on message names with the owning host. The scene must accept an exact time,
render deterministically, and report ready only after fonts, assets, and the first frame
can draw.

```js
const duration = 4
let hostOwnsTime = false

function renderAt(seconds) {
  const t = ((seconds % duration) + duration) % duration
  render(t)
  document.body.dataset.ready = '1'
}

addEventListener('message', (event) => {
  if (event.origin !== location.origin) return
  if (event.data?.type !== 'motion:render') return
  hostOwnsTime = true
  renderAt(Number(event.data.time) || 0)
})

boot().then(() => {
  if (!hostOwnsTime) requestAnimationFrame(frame)
  parent.postMessage({ type: 'motion:ready' }, location.origin)
})
```

Once the host supplies time, stop any independent animation clock. Seeking to the same
time twice must produce the same frame.

## Appearance

Do not let a host apply a blanket invert or hue filter to WebGL, images, or video. Expose
explicit scene tokens or uniforms for supported appearances, preserve native appearance
as the default, and test appearance changes during an active session.

## Catalog entry

Record the source, duration or scene range, thumbnail time, native appearance, and any
configuration values the host needs. Split ranges where beats actually change. Ranges
must not overlap, and each thumbnail time must lie inside its range.

## Verification

- Seek `a → b → a`; require the two `a` frames to match and `b` to differ.
- Verify the ready signal occurs after a drawable frame exists.
- Render native and supported appearances through the host path.
- Test fit and fill separately at every supported aspect ratio.
- Verify every catalog path, scene range, and thumbnail time.
- Run the owning project's type, source, media, and build checks.
