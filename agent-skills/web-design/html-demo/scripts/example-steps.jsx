import { useEffect } from 'react';
import StepWindow, {
  Cursor,
  ease,
  glide,
  held,
  typed,
  useStepClock,
} from './StepWindow.jsx';

/* An example to copy: two steps of an image app, written against the
   contract. Times are names at the top; every value is worked out from t;
   the pointer is placed by glide() so a scrub puts it exactly. The app's
   markup is kept small here: in a real demo it is the real app's markup
   and CSS, copied from its references. */

const ASK =
  'The Ashen One, a knight in blackened armour resting on his sword, torn cloak, on plain light grey';

// 1 · The prompt typed, the pointer onto Generate.
const FOCUS_AT = 0.95;
const TYPE = [1.25, 3.45];
function Prompt({ t }) {
  const focused = t >= FOCUS_AT;
  const text = typed(ASK, t, ...TYPE);
  return (
    <>
      <Node
        ask={text}
        focused={focused}
        caret={focused && t < 3.9}
        hover={t >= 4.55}
      />
      <Cursor
        {...glide(
          t,
          [
            [0, 0, 840, 600],
            [0.2, 0.9, 620, 205],
            [3.8, 4.5, 686, 650],
          ],
          [FOCUS_AT],
        )}
      />
    </>
  );
}

// 2 · Generate pressed: a working state, the picture drawn in from the
// top under a scan line, then settled.
const PRESS_AT = 0.3;
const REVEAL = [1.15, 4.35];
function Generate({ t }) {
  const running = t >= PRESS_AT + 0.15 && t < REVEAL[1];
  const done = t >= REVEAL[1];
  const k = Math.min(1, Math.max(0, (t - REVEAL[0]) / (REVEAL[1] - REVEAL[0])));
  const settle = ease(t, REVEAL[1], REVEAL[1] + 0.9);
  return (
    <>
      <Node
        ask={ASK}
        pressed={held(t, PRESS_AT)}
        label={done ? 'Add' : running ? 'Generating' : 'Generate'}
      >
        {t >= REVEAL[0] && (
          <img
            src="knight.webp"
            alt=""
            style={{
              clipPath: `inset(0 0 ${(1 - k) * 100}% 0)`,
              filter: done ? `brightness(${1.35 - 0.35 * settle})` : undefined,
            }}
          />
        )}
        {t >= REVEAL[0] && !done && (
          <span className="ex-scan" style={{ top: `${k * 100}%` }} />
        )}
        {running && (
          <span className="ex-status">
            Generating 0:0{Math.min(4, Math.floor(t - PRESS_AT))}
          </span>
        )}
      </Node>
      <Cursor
        {...glide(
          t,
          [
            [0, 0, 686, 650],
            [1.0, 1.8, 840, 600],
          ],
          [PRESS_AT],
        )}
      />
    </>
  );
}

// The app, much reduced: one image node at 1200 × 750 coordinates.
function Node({
  ask,
  focused,
  caret,
  hover,
  pressed,
  label = 'Generate',
  children,
}) {
  return (
    <div className="ex-node" style={{ left: 511, top: 110 }}>
      <div className="ex-head">Image · Nano Banana 2.1</div>
      <div className={`ex-ask${focused ? ' focus' : ''}`}>
        {ask || 'Describe what to make'}
        {caret && <i className="ex-caret" />}
      </div>
      <div className="ex-pre">{children}</div>
      <span
        className={`ex-run${hover ? ' hover' : ''}${pressed ? ' down' : ''}`}
      >
        {label} · 7
      </span>
    </div>
  );
}

export const STEPS = [
  { id: 'prompt', name: 'Write the prompt', dur: 6, View: Prompt },
  { id: 'generate', name: 'Generate', dur: 6.5, View: Generate },
];

/** The window with a scrubber under it: the clock comes from outside. */
export function DemoWithClock() {
  const clock = useStepClock(STEPS);
  useEffect(() => {
    // For screenshots: window.__hd.seek(3.2), then shoot.
    window.__hd = clock;
  });
  return (
    <>
      <StepWindow
        steps={STEPS}
        tabs={['The Ashen One']}
        label="Make a picture"
        clock={clock}
      />
      <input
        type="range"
        min="0"
        max={clock.total}
        step="0.01"
        value={clock.elapsed}
        aria-label="The demo's clock"
        onChange={(e) => {
          clock.pause();
          clock.seek(Number(e.target.value));
        }}
      />
    </>
  );
}
