/* HTML Demo's engine without a framework: the same window, clock and
   steps' bar as StepWindow.jsx (and the same step-window.css), for a page
   with no React. Load it with a plain <script> (it works from file://
   too) and call HTMLDemo.mount().

   A step is { id, name, dur, html, draw }. `html` is the app inside the
   window at 1200 × 750, built once when the step starts; draw(t, $)
   then sets every moving part from `t` alone (styles, text, classes),
   where $(sel) finds an element in the stage. draw may return
   { cursor: { x, y, press, hide } } to place the pointer. Nothing is left
   to CSS transitions, so a scrub or a frozen frame is exact. */
(function (root) {
  const W = 1200;
  const clamp01 = (x) => Math.min(1, Math.max(0, x));

  /** How far t is through a → b, eased in and out (0 to 1). */
  function ease(t, a, b) {
    const x = clamp01((t - a) / (b - a));
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }
  /** `text` as typed by t: nothing before a, all of it by b. */
  function typed(text, t, a, b) {
    return text.slice(0, Math.round(text.length * clamp01((t - a) / (b - a))));
  }
  /** The value of the last cue whose time has come ([[at, value], …]). */
  function cue(t, cues, before) {
    let v = before;
    for (const [at, value] of cues) {
      if (t < at) break;
      v = value;
    }
    return v;
  }
  /** Whether a click landing at `at` is still pressed. */
  const held = (t, at, len = 0.16) => t >= at && t < at + len;
  /** The pointer at t: travels to (x, y) between `from` and `to` for each
      [from, to, x, y] in `path` (the first is where it starts); pressed
      at each of `clicks`. */
  function glide(t, path, clicks = []) {
    let [, , x, y] = path[0];
    for (let j = 1; j < path.length; j++) {
      const [a, b, nx, ny] = path[j];
      if (t <= a) break;
      const k = ease(t, a, b);
      x += (nx - x) * k;
      y += (ny - y) * k;
    }
    return { x, y, press: clicks.some((at) => held(t, at)) };
  }

  const ARROW =
    'M5.17 5.18Q5 5 5 5.25L5 15.9Q5 16.4 5.5 16.46L8.6 16.86Q8.9 16.9 9.01 17.18L9.64 18.76Q9.95 19.55 10.76 19.29L10.84 19.26Q11.65 19 11.38 18.19L10.05 14.23Q9.95 13.95 10.25 13.91L12.8 13.57Q13.3 13.5 12.95 13.14Z';
  const icon = (d) =>
    `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  const ICONS = {
    home: 'M4 10.5 12 4l8 6.5V20h-5.5v-6h-5v6H4z',
    globe:
      'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm-9 9h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z',
    chev: 'm7 10 5 5 5-5',
    x: 'M7 7l10 10M17 7 7 17',
  };
  const SWATCH = ['#efb36c', '#ef7d9b', '#82c1ee'];
  const esc = (s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
    );
  const lessMotion = () =>
    typeof matchMedia !== 'undefined' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Plays `steps` in a Mac window inside `el`. Returns its controls:
      play(i), seek(seconds), pause(), resume(), setStill(bool), state(),
      onChange(fn) and destroy(). */
  function mount(
    el,
    { steps, tabs = [], label = 'Demo', bar = true, stageClass = '' },
  ) {
    const total = steps.reduce((s, x) => s + x.dur, 0);
    let still = lessMotion();
    let paused = false;
    let at = { i: 0, t: still ? steps[0].dur : 0 };
    let built = -1;
    const listeners = new Set();

    el.classList.add('hd');
    el.innerHTML = `<figure class="hd-win">
      <div class="hd-bar" aria-hidden="true">
        <span class="hd-lights"><i></i><i></i><i></i></span>${icon(ICONS.home)}
        ${tabs
          .map(
            (t, i) =>
              `<span class="hd-tab${i === tabs.length - 1 ? ' on' : ''}"><b style="background:${SWATCH[i % 3]}"></b><span>${esc(t)}</span>${i === tabs.length - 1 ? icon(ICONS.x) : ''}</span>`,
          )
          .join('')}
        <span class="hd-gap"></span>${icon(ICONS.globe)}${icon(ICONS.chev)}
      </div>
      <div class="hd-view" role="img" aria-label="${esc(label)}: ${esc(steps.map((s) => s.name).join(', '))}"></div>
      ${
        bar
          ? `<ol class="hd-steps" aria-label="${esc(label)}, step by step">${steps
              .map(
                (s, i) =>
                  `<li><button type="button" data-i="${i}"><span class="hd-n">${String(i + 1).padStart(2, '0')}</span><span class="hd-label">${esc(s.name)}</span><i></i></button></li>`,
              )
              .join('')}</ol>`
          : ''
      }
    </figure>`;
    const view = el.querySelector('.hd-view');
    const buttons = [...el.querySelectorAll('.hd-steps button')];
    buttons.forEach((b) =>
      b.addEventListener('click', () => play(Number(b.dataset.i))),
    );

    // One number scales the whole stage to the window.
    const fit = () => view.style.setProperty('--k', view.clientWidth / W);
    const ro = new ResizeObserver(fit);
    ro.observe(view);
    fit();

    let stage, cursor;
    const $ = (sel) => stage.querySelector(sel);
    function render() {
      const step = steps[at.i];
      if (built !== at.i) {
        built = at.i;
        stage = document.createElement('div');
        stage.className = `hd-stage ${stageClass}`;
        stage.innerHTML = step.html;
        cursor = document.createElement('span');
        cursor.className = 'hd-cursor';
        cursor.style.transitionDuration = '0s, 0.3s';
        cursor.setAttribute('aria-hidden', 'true');
        cursor.innerHTML = `<svg width="32" height="32" viewBox="0 0 32 32" overflow="visible"><path d="${ARROW}" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="${ARROW}" fill="#000"/></svg>`;
        stage.append(cursor);
        view.replaceChildren(stage);
      }
      const out = step.draw ? step.draw(at.t, $) || {} : {};
      const c = out.cursor;
      cursor.hidden = !c;
      if (c) {
        cursor.style.transform = `translate(${c.x - 5}px, ${c.y - 5}px)`;
        cursor.classList.toggle('press', !!c.press);
        cursor.classList.toggle('away', !!c.hide);
      }
      buttons.forEach((b, i) => {
        b.classList.toggle('on', i === at.i);
        if (i === at.i) b.setAttribute('aria-current', 'step');
        else b.removeAttribute('aria-current');
        const p =
          i === at.i ? Math.min(1, at.t / steps[i].dur) : i < at.i ? 1 : 0;
        b.querySelector('i').style.setProperty('--p', p);
      });
      listeners.forEach((fn) => fn(state()));
    }

    // The clock: only on screen and in a shown tab, a quarter second at
    // most per tick, looping; still under reduced motion.
    let shown = false;
    let last = performance.now();
    const io = new IntersectionObserver(
      ([e]) => {
        shown = e.isIntersecting;
        last = performance.now();
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    const timer = setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      if (still || paused || !shown || document.hidden) return;
      let { i, t } = at;
      t += dt;
      if (t >= steps[i].dur) {
        i = (i + 1) % steps.length;
        t = 0;
      }
      at = { i, t };
      render();
    }, 40);

    function play(i) {
      at = { i, t: still ? steps[i].dur : 0 };
      render();
    }
    function seek(s) {
      let i = 0;
      let t = Math.min(Math.max(0, s), total - 1e-3);
      while (i < steps.length - 1 && t >= steps[i].dur) t -= steps[i++].dur;
      at = { i, t };
      render();
    }
    function state() {
      const before = steps.slice(0, at.i).reduce((s, x) => s + x.dur, 0);
      return { i: at.i, t: at.t, elapsed: before + at.t, total, paused, still };
    }
    render();
    return {
      play,
      seek,
      state,
      pause() {
        paused = true;
        render();
      },
      resume() {
        paused = false;
        render();
      },
      setStill(on) {
        still = on;
        if (on) at = { i: at.i, t: steps[at.i].dur };
        render();
      },
      onChange(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
      destroy() {
        clearInterval(timer);
        io.disconnect();
        ro.disconnect();
        el.replaceChildren();
      },
    };
  }

  root.HTMLDemo = { mount, ease, typed, cue, held, glide, W, H: 750 };
})(globalThis);
