import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './step-window.css';

/* HTML Demo's engine: an app shown working, drawn live in HTML instead of
   recorded.

   A demo is a list of steps, { id, name, dur, View }. View({ t, dur })
   draws everything inside the app's window at a fixed design size
   (W × H, 1200 × 750) for `t` seconds into its step, from `t` alone: the
   same t gives the same frame. The window scales that stage to its own
   width with one number (--k), plays the steps in a loop only while it's
   on screen and the tab is shown, and under prefers-reduced-motion shows
   each step's end frame, still. A bar along the window's foot names the
   steps and fills as each plays; a click plays that one.

   Extracted from fil.design/download, where the hero window and eight
   chapter windows show Fil for Mac doing its work this way. */

export const W = 1200;
export const H = 750;

export const lessMotion = () =>
  typeof matchMedia !== 'undefined' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches;

const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** How far `t` is through the stretch from `a` to `b`, eased in and out
    (0 before a, 1 after b). */
export function ease(t, a, b) {
  const x = clamp01((t - a) / (b - a));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/** `text` as typed by `t`: nothing before `a`, all of it by `b`. */
export function typed(text, t, a, b) {
  return text.slice(0, Math.round(text.length * clamp01((t - a) / (b - a))));
}

/** The value of the last cue whose time has come. `cues` is
    [[at, value], …] in time order; `before` until the first. */
export function cue(t, cues, before) {
  let v = before;
  for (const [at, value] of cues) {
    if (t < at) break;
    v = value;
  }
  return v;
}

/** Whether a click that lands at `at` is still pressed (about 0.16 s, a
    person's click). */
export const held = (t, at, len = 0.16) => t >= at && t < at + len;

/** Where the pointer is at `t`, worked out from `t` alone, so a scrub or
    a frozen frame puts it exactly where it belongs. `path` is
    [[from, to, x, y], …]: it travels to (x, y), eased, between `from` and
    `to` seconds (the first entry, [0, 0, x, y], is where it starts).
    `clicks` are the moments it presses. Spread the result into <Cursor>,
    which then draws it with no transition of its own. */
export function glide(t, path, clicks = []) {
  let [, , x, y] = path[0];
  for (let j = 1; j < path.length; j++) {
    const [a, b, nx, ny] = path[j];
    if (t <= a) break;
    const k = ease(t, a, b);
    x += (nx - x) * k;
    y += (ny - y) * k;
  }
  return { x, y, move: 0, press: clicks.some((at) => held(t, at)) };
}

const ARROW =
  'M5.17 5.18Q5 5 5 5.25L5 15.9Q5 16.4 5.5 16.46L8.6 16.86Q8.9 16.9 9.01 17.18L9.64 18.76Q9.95 19.55 10.76 19.29L10.84 19.26Q11.65 19 11.38 18.19L10.05 14.23Q9.95 13.95 10.25 13.91L12.8 13.57Q13.3 13.5 12.95 13.14Z';

/** The pointer at (x, y) in the stage's W × H, its tip on that point,
    pressed while `press`, faded out while `hide`. With `move` it glides
    there over that many seconds (a CSS transition); with glide() it's
    placed exactly. Render it last, over the app. */
export function Cursor({ x, y, press = false, hide = false, move = 0.7 }) {
  return (
    <span
      className={`hd-cursor${press ? ' press' : ''}${hide ? ' away' : ''}`}
      style={{
        transform: `translate(${x - 5}px, ${y - 5}px)`,
        transitionDuration: `${move}s, 0.3s`,
      }}
      aria-hidden="true"
    >
      <svg width="32" height="32" viewBox="0 0 32 32" overflow="visible">
        <path
          d={ARROW}
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d={ARROW} fill="#000" />
      </svg>
    </span>
  );
}

/** The steps' clock: which step plays and how far in. It runs only while
    the window is on screen (30% of it) and the tab is shown, never jumps
    more than a quarter second at once (a tab coming back, a slow frame),
    and loops. Under reduced motion it stands still on each step's end.

    `start` ({ i, t }) freezes it at that frame, paused: for screenshots.
    `off` keeps it from running (StepWindow passes it when it's given a
    clock of its own). */
export function useStepClock(steps, { still, start, off = false } = {}) {
  const calm = still ?? lessMotion();
  const root = useRef(null);
  const endOf = (i) => steps[i].dur;
  const [at, setAt] = useState(() => start || { i: 0, t: calm ? endOf(0) : 0 });
  const [paused, setPaused] = useState(!!start);
  const now = useRef(at);
  const go = (i, t) => {
    now.current = { i, t };
    setAt(now.current);
  };

  // Reduced motion shown (or asked for): each step's end, still.
  useEffect(() => {
    if (calm) go(now.current.i, endOf(now.current.i));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calm]);

  useEffect(() => {
    if (calm || paused || off) return;
    let shown = false;
    let last = performance.now();
    const io = new IntersectionObserver(
      ([e]) => {
        shown = e.isIntersecting;
        last = performance.now();
      },
      { threshold: 0.3 },
    );
    if (root.current) io.observe(root.current);
    const id = setInterval(() => {
      const t0 = performance.now();
      const dt = Math.min(0.25, (t0 - last) / 1000);
      last = t0;
      if (!shown || document.hidden) return;
      let { i, t } = now.current;
      t += dt;
      if (t >= steps[i].dur) {
        i = (i + 1) % steps.length;
        t = 0;
      }
      go(i, t);
    }, 40);
    return () => {
      clearInterval(id);
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calm, paused, off, steps]);

  const total = steps.reduce((s, x) => s + x.dur, 0);
  const before = (i) => steps.slice(0, i).reduce((s, x) => s + x.dur, 0);
  return {
    root,
    steps,
    i: at.i,
    t: at.t,
    total,
    still: calm,
    paused,
    /** Seconds into the whole demo. */
    elapsed: before(at.i) + at.t,
    /** Plays step `i` from its start (its end, under reduced motion). */
    play: (i) => go(i, calm ? endOf(i) : 0),
    /** Shows the demo `s` seconds in (a scrub). */
    seek: (s) => {
      let i = 0;
      let t = Math.min(Math.max(0, s), total - 1e-3);
      while (i < steps.length - 1 && t >= steps[i].dur) t -= steps[i++].dur;
      go(i, t);
    },
    pause: () => setPaused(true),
    resume: () => setPaused(false),
  };
}

const SWATCH = ['#efb36c', '#ef7d9b', '#82c1ee'];
const svg = (d) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
);
const HOME = 'M4 10.5 12 4l8 6.5V20h-5.5v-6h-5v6H4z';
const GLOBE =
  'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm-9 9h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z';
const CHEV = 'm7 10 5 5 5-5';
const CLOSE = 'M7 7l10 10M17 7 7 17';

/** A Mac window that plays `steps`: its title bar with `tabs` (the last
    one shown), the app at W × H scaled to fit, and the steps' bar.
    `stageClass` adds the app's own class (its tokens and fonts) to the
    stage; `clock` drives it from outside (useStepClock), for a scrubber. */
export default function StepWindow({
  steps,
  tabs = [],
  label = 'Demo',
  clock: given,
  stageClass = '',
  bar = true,
}) {
  const own = useStepClock(steps, { off: !!given });
  const clock = given || own;
  const view = useRef(null);

  // Scaled to the window: one number for the whole stage.
  useLayoutEffect(() => {
    const el = view.current;
    const fit = () => el.style.setProperty('--k', el.clientWidth / W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const step = steps[clock.i];
  const { View } = step;
  return (
    <div className="hd" ref={clock.root}>
      <figure className="hd-win">
        <div className="hd-bar" aria-hidden="true">
          <span className="hd-lights">
            <i />
            <i />
            <i />
          </span>
          {svg(HOME)}
          {tabs.map((t, i) => (
            <span
              key={t}
              className={`hd-tab${i === tabs.length - 1 ? ' on' : ''}`}
            >
              <b style={{ background: SWATCH[i % SWATCH.length] }} />
              <span>{t}</span>
              {i === tabs.length - 1 && svg(CLOSE)}
            </span>
          ))}
          <span className="hd-gap" />
          {svg(GLOBE)}
          {svg(CHEV)}
        </div>
        <div
          className="hd-view"
          ref={view}
          role="img"
          aria-label={`${label}: ${steps.map((s) => s.name).join(', ')}`}
        >
          <div className={`hd-stage ${stageClass}`} key={step.id}>
            <View t={clock.t} dur={step.dur} />
          </div>
        </div>
        {bar && (
          <ol className="hd-steps" aria-label={`${label}, step by step`}>
            {steps.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={i === clock.i ? 'on' : ''}
                  aria-current={i === clock.i ? 'step' : undefined}
                  onClick={() => clock.play(i)}
                >
                  <span className="hd-n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="hd-label">{s.name}</span>
                  <i
                    style={{
                      '--p':
                        i === clock.i
                          ? Math.min(1, clock.t / s.dur)
                          : i < clock.i
                            ? 1
                            : 0,
                    }}
                  />
                </button>
              </li>
            ))}
          </ol>
        )}
      </figure>
    </div>
  );
}
