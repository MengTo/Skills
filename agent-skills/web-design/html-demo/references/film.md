# The film variant: a hero window that runs whole workflows

Use the step window for a chapter that shows one feature in 3–5 steps. Use a film for a hero that shows the product end to end: several canvases (flows) one after another, each one built, run and then explored, with a camera that follows the work. Fil's hero (`MacWorkflows.jsx` on fil.design/download) has four flows: a logo and brand guide; a landing page that opens in Design and then in the browser; a story video that goes into the video editor; and social posts that get published.

## One function: `frameAt(t)`

The whole film is a single pure function from seconds to a frame description:

```js
frameAt(t) → {
  i,            // which flow (canvas tab)
  state,        // { [nodeKey]: 'ready' | 'idle' | 'wait' | 'run' | 'done' }
  chat,         // 'ready' before the run, 'run' after
  mode,         // what's open over the canvas: '' | 'design' | 'editor' | 'viewer'
  show, select, menu, pick, platform, publish,   // what the beats set
  aim, press, move,   // the pointer: what it aims at, pressed, glide seconds
  focus,        // what the camera frames: 'all' or [nodeKeys]
  spent, left,  // credits spent in this flow, and the balance left
  done,
}
```

React renders the frame. A 50 ms tick calls `frameAt(clock)` and sets state only when `JSON.stringify(frame)` changes. Most ticks change nothing, so most ticks cost nothing.

## Flows scheduled from their graph

Each flow lists its nodes (`{ key, kind, name, x, y, w, dur?, src?, cr? }`) and its links (`[from, to]`). A node with `dur` is a step. Its start time is worked out from the graph, as "Generate all" really runs:

- A step starts once every step feeding it is done, plus `HOP = 0.3` s for the result to travel down the thread.
- Its depth (1 + the deepest input) groups the steps into waves for the run's ready card.
- The run starts `R = 2.2` s after the flow's tab shows; the pointer presses Generate all then.
- Shown durations are multiplied by `SHOWN = 18` ("Made 5 things in 2:14"), so one demo second reads as 18 s of real run.

Don't hand-time a run of 8 steps. Derive it, so adding a node retimes everything after it.

## Beats after the run

After the run, a flow plays its beats, one after another:

```js
beats: [
  { dur: 2.7, base: { focus: ['music', 's1', 's2', 's3'] },
    cues: [[0, { aim: 'node:s1' }], [0.55, { tap: true, select: ['s1'] }], [0.75, { aim: 'node:s2' }], …] },
  { dur: 1.7, cues: [[0.15, { tap: true, menu: true }], [0.45, { aim: 'menu-video' }], [1.45, { tap: true }]] },
  { dur: 1.5, base: { menu: false, select: [], show: ['edit'], focus: ['s2', 'edit'] } },
  { dur: 5.8, base: { mode: 'editor' } },
]
```

`beatsAt(flow, lt)` folds every beat up to `lt` into one state: first each beat's `base`, then each cue whose time has come. Values stick until something sets them again. A cue with `tap` presses the pointer for 0.2 s as it lands. Because this fold is pure, any moment can be rebuilt from scratch.

## The camera

- **What it frames:** the whole canvas before the run. During the run, the newest step being made, together with the nodes that feed it, so the eye sees where the result comes from. With more than two steps starting at once, it frames the middle one. Between steps it frames what was made last, and after the run the flow's `end` nodes.
- **How the frame is fitted:** it's measured from the laid-out nodes (`offsetLeft/Top/Width/Height`) in a layout effect, inside the free part of the canvas (beside the chat, or beside the browser when it's open), with a 48 px margin. The zoom is `min(1.2, max(1, fit))` on steps and `min(1.08, max(0.86, fit))` for the whole canvas.
- **How it moves:** it glides by a CSS transition, `transform 1.3s cubic-bezier(0.45, 0, 0.2, 1)`.
- **Store the transform with the flow index it was measured on**, and apply it only while that flow is the one shown. Otherwise the next canvas starts from the last canvas's transform and swoops across the stage.

## Switching canvases

Keep `seen[i]`, the last frame of each flow. When `frame.i` changes, the pointer presses the next tab at once, but what's drawn stays on `seen[old]` for 300 ms while it fades out. Then it switches. Without that lag, the new canvas's nodes flash through the old canvas's fade.

The browser beside the canvas closes before the next flow starts. Preload the next flow's pictures while this one runs.

## The threads

Draw the links as the real canvas draws them: a cubic from the source node's right edge to the target's left, with `dx = max(48, |x2 − x1| / 2)`, 1.6 px at 0.8 opacity in the source kind's colour. Links from a brief or skill stay quiet at 0.14. A link into a step that's being made marches (`stroke-dasharray: 6 7`, 0.7 s linear loop). Measure the paths from the nodes after layout. The canvas's own ref isn't set while its children lay out, so measure from the thread layer's own element.

## Reduced motion

The film shows one frame: the first flow just after its run (`R + runEnd + 0.6`), with everything made.
