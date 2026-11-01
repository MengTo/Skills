/* HTML Explainer Video's clock: a whole film drawn from one number.
   window.__frame(t) sets every element from t, the film's seconds, and the
   times come from the voice's words (T.clock is when it says "clock"), so
   a new voice or a real take retimes every scene without animating
   anything again.
   Three inputs change the picture and none of them touches a scene:
   - the look: <html data-look="…">, a block of --x- variables (looks/*.css):
     type, colour, corners, chrome, and how things move;
   - the shape: 4:3, 16:9, 1:1 or 9:16, each a stage with a short side of
     1080, its regions set as variables (--pic-x, --head-y…);
   - the camera: off by default, so scenes fill the frame; on, a corner is
     kept clear in every region and the plan's layouts play over the film.
   Three things drive the same page:
   - scripts/render.mjs calls __frame(t) once a frame and screenshots;
   - Fil's video editor plays it as an HTML scene, stepping its clock;
   - a browser plays it live, looping, with ?controls for a scrubber.
   ?look= ?shape= ?camera=on ?scene= ?captions=on change it from the address.
   No framework, no build: <script src="explainer.js"></script>, then
   HTMLExplainer.film({ words, scenes }). Works from file:// too. */
(function (root) {
  'use strict';
  const SHAPES = { '4:3': [1440, 1080], '16:9': [1920, 1080], '1:1': [1080, 1080], '9:16': [1080, 1920] };

  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lin = (t, a, b) => (b === a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));
  /** 0 → 1 between a and b, eased in and out (cubic). */
  const ease = (t, a, b) => {
    const x = lin(t, a, b);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  };
  /** 0 → 1 between a and b, fast then settling (cubic out). */
  const out = (t, a, b) => 1 - Math.pow(1 - lin(t, a, b), 3);
  /** 0 → 1 decelerating hard into place, for words and cards landing. */
  const expo = (t, a, b) => {
    const x = lin(t, a, b);
    return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
  };
  /** 0 → 1 overshooting a little and settling. */
  const back = (t, a, b, c = 1.5) => {
    const x = lin(t, a, b) - 1;
    return 1 + (c + 1) * x * x * x + c * x * x;
  };
  /** from → to between a and b, eased. */
  const mix = (t, a, b, from, to) => from + (to - from) * ease(t, a, b);
  /** A beat: rises to 1 at `at` over `up` s, dies away over `down` s. */
  const pulse = (t, at, up = 0.08, down = 0.5) => (t < at ? Math.exp(-Math.pow((at - t) / up, 2)) : Math.exp(-(t - at) / down));
  /** `text` typed between a and b. */
  const typed = (text, t, a, b) => text.slice(0, Math.round(text.length * lin(t, a, b)));
  /** The value of the last cue at or before t. */
  const cue = (t, list, before) => list.reduce((v, [at, x]) => (t >= at ? x : v), before);
  /** A caret's on and off, from t. */
  const blink = (t) => (t % 1 < 0.55 ? 1 : 0);
  /** A number from 0 to 1 that's always the same for the same i and k: nothing random on the stage. */
  const rnd = (i, k = 1) => {
    const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };

  /** Every word named by itself: T.clock, T.clockEnd, a word said again T.look2, T.end the last word's end. */
  function times(words) {
    const T = {},
      seen = {};
    for (const w of words || []) {
      let base = String(w[0]).toLowerCase().replace(/[^a-z0-9]/g, '') || 'w';
      if (/^\d/.test(base)) base = 'n' + base;
      seen[base] = (seen[base] || 0) + 1;
      const name = seen[base] === 1 ? base : base + seen[base];
      T[name] = w[1];
      T[name + 'End'] = w[2] ?? w[1];
    }
    const last = words && words[words.length - 1];
    T.end = last ? last[2] ?? last[1] : 0;
    return T;
  }

  /** A clock from a script's own words, for nothing, until a voice's real
      words replace it: each word's share of the time by its letters, a pause
      after punctuation. The same as scripts/words.py --draft. */
  function draft(text, pace = 2.6, start = 0.12) {
    const tokens = String(text).split(/\s+/).filter(Boolean);
    const size = (w) => Math.max(3, w.replace(/\W/g, '').length);
    const pause = (w) => (/[.!?]$/.test(w) ? 0.42 : /[,:;]$/.test(w) ? 0.24 : 0);
    const letters = tokens.reduce((n, w) => n + size(w), 0) || 1;
    const speaking = Math.max(1, tokens.length / pace - tokens.reduce((n, w) => n + pause(w), 0));
    const words = [];
    let t = start;
    for (const w of tokens) {
      const d = (speaking * size(w)) / letters;
      words.push([w, +t.toFixed(3), +(t + d).toFixed(3)]);
      t += d + pause(w);
    }
    return words;
  }

  /** The frame's regions, in stage pixels, for a shape, the camera and where
      the look puts its headline: m the side margin, head the headline's
      band, pic what's left for the picture, cap the captions' line, cam the
      corner a camera takes. `at` is 'top', 'bottom' (the picture above,
      big type under it) or 'side' (a column beside it, on the wider shapes;
      on 1:1 and 9:16 it's the top). With the camera on, pic and head stop
      short of that corner, so nothing anyone reads or a pointer clicks is
      ever under it. `headH0` is how tall the look's headlines run on 4:3,
      `m0` its side margin. */
  function frameOf(shape = '4:3', camera = false, at = 'top', headH0 = 0, m0 = 0) {
    const [W, H] = SHAPES[shape] || SHAPES['4:3'];
    const tall = H > W,
      wide = W / H > 1.5,
      square = W === H;
    const m = m0 || (wide ? 96 : tall ? 64 : 72);
    const place = at === 'side' && (tall || square) ? 'top' : at === 'bottom' || at === 'side' ? at : 'top';
    // A phone's own buttons cover the top and the bottom of 9:16.
    const topY = tall ? 210 : m0 || (wide ? 72 : 64);
    // Lines wrap sooner on narrower shapes, and type grows on wider ones.
    const headH = headH0 ? headH0 * (tall ? 1.55 : wide ? 1.2 : 1) : tall ? 250 : 136;
    const foot = tall ? 400 : 116;
    const cam = { w: square ? 300 : 374, h: square ? 169 : 210 };
    cam.x = W - cam.w - 40;
    cam.y = H - cam.h - (tall ? 300 : 40);
    const room = W - m * 2;
    let head, pic;
    if (place === 'side') {
      const col = wide ? 520 : 400;
      head = { x: m, y: topY, w: col, h: H - topY - foot };
      pic = { x: m + col + 44, y: topY, w: room - col - 44, h: H - topY - foot };
      if (camera) {
        if (wide) pic.w = cam.x - 32 - pic.x;
        else pic.h = cam.y - 28 - pic.y;
      }
    } else if (place === 'bottom') {
      head = { x: m, y: H - foot - headH, w: room, h: headH };
      pic = { x: m, y: topY, w: room, h: H - foot - headH - 28 - topY };
      if (camera) {
        if (tall) {
          head.y = cam.y - 28 - headH;
          pic.h = head.y - 28 - pic.y;
        } else {
          head.w = cam.x - 28 - m;
          pic.h = Math.min(pic.h, cam.y - 28 - pic.y);
          head.y = pic.y + pic.h + 20;
        }
      }
    } else {
      head = { x: m, y: topY, w: room, h: headH };
      pic = { x: m, y: topY + headH, w: room, h: H - topY - headH - foot };
      if (camera) {
        if (wide) pic.w = cam.x - 32 - m;
        else pic.h = cam.y - 28 - pic.y;
      }
    }
    const cap = { y: H - foot + (tall ? 40 : 24), h: tall ? 110 : 76, x: camera && !tall ? m : 0, w: camera && !tall ? cam.x - m - 20 : W };
    return { W, H, shape, camera: !!camera, tall, wide, square, at: place, m, head, pic, cap, cam };
  }

  const params = () => {
    try {
      return new URLSearchParams(root.location ? root.location.search : '');
    } catch (e) {
      return new URLSearchParams('');
    }
  };

  /** The motion a look asks for, read once per look: --x-motion rise, fade,
      snap or wipe, and --x-motion-dur its seconds. */
  const motions = new Map();
  function motionOf(el) {
    const host = (el && el.closest && el.closest('[data-look]')) || root.document.documentElement;
    const key = host.getAttribute('data-look') || '';
    if (!motions.has(key)) {
      const cs = root.getComputedStyle(host);
      motions.set(key, {
        kind: cs.getPropertyValue('--x-motion').trim() || 'rise',
        dur: parseFloat(cs.getPropertyValue('--x-motion-dur')) || 0.55,
        dist: parseFloat(cs.getPropertyValue('--x-motion-dist')) || 26,
      });
    }
    return motions.get(key);
  }

  /** Brings el in at `at` and out from `leave`, the way its look moves: the
      scene says when, the look says how. Returns how far in it is (0–1). */
  function show(el, t, at, leave = Infinity, o = {}) {
    if (!el) return 0;
    const m = { ...motionOf(el), ...o };
    const gone = 0.22;
    if (t < at - 1e-6 || t > leave + gone) {
      el.style.visibility = 'hidden';
      return 0;
    }
    el.style.visibility = 'visible';
    const dur = o.dur ?? m.dur;
    let p, q;
    if (m.kind === 'snap') {
      p = back(t, at, at + dur, 2);
      q = t >= leave ? 1 : 0;
      el.style.opacity = q ? 0 : 1;
      el.style.scale = (0.94 + 0.06 * p).toFixed(4);
      el.style.translate = `0 ${((1 - p) * m.dist * 0.6).toFixed(2)}px`;
      el.style.clipPath = 'none';
    } else if (m.kind === 'wipe') {
      p = ease(t, at, at + dur);
      q = ease(t, leave, leave + gone);
      el.style.opacity = 1;
      el.style.clipPath = `inset(-20% ${((1 - p) * 110 - 5).toFixed(2)}% -20% ${(q * 110 - 5).toFixed(2)}%)`;
      el.style.translate = 'none';
      el.style.scale = 'none';
    } else if (m.kind === 'fade') {
      p = ease(t, at, at + dur);
      q = ease(t, leave, leave + gone);
      el.style.opacity = (p * (1 - q)).toFixed(4);
      el.style.translate = `0 ${((1 - p) * m.dist * 0.3).toFixed(2)}px`;
      el.style.scale = 'none';
      el.style.clipPath = 'none';
    } else {
      p = expo(t, at, at + dur);
      q = ease(t, leave, leave + gone);
      el.style.opacity = (Math.min(1, p * 1.5) * (1 - q)).toFixed(4);
      el.style.translate = `0 ${((1 - p) * m.dist - q * m.dist * 0.5).toFixed(2)}px`;
      el.style.scale = 'none';
      el.style.clipPath = 'none';
    }
    return p * (1 - q);
  }

  /** A highlight that fits what it marks: a thin line with even clear space
      on every side, on the element itself so it follows it through any
      move. Never a band; a ring is drawn by outline and outline-offset. */
  function ring(el, t, at, leave = Infinity, gap = 5) {
    if (!el) return;
    const a = ease(t, at, at + 0.22) * (1 - ease(t, leave, leave + 0.22));
    el.style.outline = a > 0.004 ? `var(--x-ring-w, 1.5px) solid color-mix(in srgb, var(--x-ring) ${(a * 100).toFixed(1)}%, transparent)` : 'none';
    el.style.outlineOffset = `${gap}px`;
  }

  /** A view of an element inside its parent at t, along stops
      [[from, to, { x, y, s, ax?, ay? }], …]: its point (x, y), as shares of
      it, at the parent's point (ax, ay), scale s. Eased and calm. */
  function view(el, t, stops) {
    if (!el) return;
    const W = el.offsetWidth,
      H = el.offsetHeight,
      P = el.parentElement,
      PW = P.clientWidth,
      PH = P.clientHeight;
    const pose = (p) => ({ s: p.s, x: PW * (p.ax ?? 0.5) - W * p.x * p.s, y: PH * (p.ay ?? 0.5) - H * p.y * p.s });
    let cur = pose(stops[0][2]);
    for (const [a, b, p] of stops) {
      if (t <= a) break;
      const q = pose(p),
        e = ease(t, a, b);
      cur = { s: cur.s + (q.s - cur.s) * e, x: cur.x + (q.x - cur.x) * e, y: cur.y + (q.y - cur.y) * e };
      if (t < b) break;
    }
    el.style.transformOrigin = '0 0';
    el.style.transform = `translate(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px) scale(${cur.s.toFixed(4)})`;
  }

  /** Splits el's words into spans once, to bring them in one by one. */
  function split(el) {
    if (!el || el.dataset.split) return el ? [...el.querySelectorAll('.x-w')] : [];
    el.dataset.split = '1';
    const walk = (n) => {
      for (const c of [...n.childNodes]) {
        if (c.nodeType === 3) {
          const f = root.document.createDocumentFragment();
          for (const part of c.textContent.split(/(\s+)/)) {
            if (!part) continue;
            if (/^\s+$/.test(part)) f.append(part);
            else {
              const s = root.document.createElement('span');
              s.className = 'x-w';
              s.textContent = part;
              f.append(s);
            }
          }
          c.replaceWith(f);
        } else if (c.nodeType === 1) walk(c);
      }
    };
    walk(el);
    return [...el.querySelectorAll('.x-w')];
  }

  /** Shrinks el's type until its line fits `max` px; call it in setup, after the fonts. */
  function fit(el, max) {
    const size = parseFloat(root.getComputedStyle(el).fontSize);
    const r = root.document.createRange();
    r.selectNodeContents(el);
    const k = el.getBoundingClientRect().width / (el.offsetWidth || 1) || 1;
    const w = r.getBoundingClientRect().width / k;
    if (w > max) el.style.fontSize = ((size * max) / w).toFixed(2) + 'px';
    return w > max ? (size * max) / w : size;
  }

  /** The pointer at t along a path [[from, to, x, y] or [from, to, selector], …],
      gliding between points, aimed at each element as it's drawn; presses
      at the times in `clicks`. Measured, never guessed: a label that changes
      or a look with other sizes can't make it miss. */
  function pointer(el, t, path, clicks = [], o = {}) {
    if (!el) return;
    const stage = el.closest('#stage') || root.document.body;
    const s = stage.getBoundingClientRect();
    const k = s.width / (stage.offsetWidth || 1) || 1;
    const at = (p) => {
      if (typeof p[2] === 'string') {
        const e = stage.querySelector(p[2]);
        if (!e) return [0, 0];
        const r = e.getBoundingClientRect();
        return [(r.left + r.width * (p[3] ?? 0.5) - s.left) / k, (r.top + r.height * (p[4] ?? 0.5) - s.top) / k];
      }
      return [p[2], p[3]];
    };
    let [x, y] = at(path[0]);
    for (const p of path) {
      if (t <= p[0]) break;
      const [nx, ny] = at(p),
        e = ease(t, p[0], p[1]);
      x += (nx - x) * e;
      y += (ny - y) * e;
      if (t < p[1]) break;
    }
    const press = clicks.reduce((v, c) => Math.max(v, t >= c && t < c + 0.16 ? 1 : 0), 0);
    el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${press ? 0.92 : 1})`;
    el.style.opacity = o.hide ? 0 : 1;
  }

  /** The film. words: [[word, start, end], …] (a voice's, or draft-words). scenes:
      [{ id, from, to, tone, dissolve, setup, draw(t, $, f) }], each drawing
      its <section class="x-scene" id="…"> from t, the film's seconds; $
      finds inside that section, f is the frame's regions. camera: the plan
      when it's on, [[at, 'hidden' | 'full' | 'corner'], …], moves taking
      `glide` s to end at their time. capsOff: stretches with no captions,
      under big type that says the same words. */
  function film(o) {
    const doc = root.document;
    const q = params();
    const stage = doc.querySelector(o.stage || '#stage');
    const html = doc.documentElement;
    const shape = SHAPES[q.get('shape')] ? q.get('shape') : SHAPES[o.shape] ? o.shape : '4:3';
    const camera = q.has('camera') ? q.get('camera') === 'on' : !!o.camera;
    const look = q.get('look') || o.look || html.getAttribute('data-look') || 'night';
    html.setAttribute('data-look', look);
    // Where the look puts its headline changes every region, so it's read first.
    const lookCs = root.getComputedStyle(html);
    const headAt = lookCs.getPropertyValue('--x-head-at').trim() || 'top';
    const headRows = parseFloat(lookCs.getPropertyValue('--x-head-h')) || 0;
    const margin = parseFloat(lookCs.getPropertyValue('--x-m')) || 0;
    const f = frameOf(shape, camera, headAt, headRows, margin);
    f.headRows = headRows;
    f.margin = margin;
    html.setAttribute('data-head', f.at);
    html.setAttribute('data-shape', shape);
    html.setAttribute('data-camera', camera ? 'on' : 'off');
    html.setAttribute('data-form', f.tall ? 'tall' : f.wide ? 'wide' : f.square ? 'square' : 'classic');
    const set = (k, v) => stage.style.setProperty(k, v + 'px');
    set('--W', f.W);
    set('--H', f.H);
    set('--m', f.m);
    for (const [name, r] of [['head', f.head], ['pic', f.pic], ['cap', f.cap], ['cam', f.cam]])
      for (const k of ['x', 'y', 'w', 'h']) set(`--${name}-${k}`, r[k]);

    const scenes = o.scenes.map((s, i) => ({ ...s, el: doc.getElementById(s.id), to: s.to ?? (o.scenes[i + 1] ? o.scenes[i + 1].from : o.end) }));
    for (const s of scenes) {
      if (!s.el) continue;
      if (s.tone) s.el.setAttribute('data-tone', s.tone);
      s.$ = (sel) => s.el.querySelector(sel);
    }
    const only = q.get('scene');
    const one = only ? scenes.find((s) => s.id === only) : null;
    const a = one ? one.from : 0,
      b = one ? one.to : o.end;
    const span = b - a;

    // The stage fits the window, unless the page places it itself.
    const barH = q.has('controls') ? 54 : 0;
    const fitStage = () => {
      const k = Math.min(root.innerWidth / f.W, (root.innerHeight - barH) / f.H) || 1;
      stage.style.setProperty('--k', String(k));
      stage.style.left = Math.max(0, (root.innerWidth - f.W * k) / 2) + 'px';
    };
    root.addEventListener('resize', fitStage);
    fitStage();

    // Captions, for previews: Fil draws the real ones.
    const capsOn = q.get('captions') === 'on' || !!o.captions;
    const caps = capsOn ? captionLines(o.words || [], o.capChars || (f.tall ? 22 : 30)) : [];
    let capEl = null;
    if (capsOn) {
      capEl = doc.createElement('div');
      capEl.className = 'x-cap';
      stage.append(capEl);
    }
    let lastCap = null;
    const drawCaps = (t) => {
      if (!capEl) return;
      const off = (o.capsOff || []).some(([x, y]) => t >= x && t < y);
      const i = off ? -1 : caps.findIndex((c) => t >= c.from && t < c.to);
      if (i < 0) {
        if (lastCap !== '') capEl.innerHTML = '';
        lastCap = '';
        return;
      }
      const c = caps[i];
      const now = c.words.findIndex((w) => t >= w[1] && t < w[2]);
      const sig = i + ':' + now;
      if (sig === lastCap) return;
      lastCap = sig;
      capEl.innerHTML = '<span class="x-cap-line">' + c.words.map((w, j) => (j === now ? `<b>${w[0]}</b>` : w[0])).join(' ') + '</span>';
    };

    // The camera over the film, when it's on: a stand-in until takes are in.
    let camEl = null;
    if (camera && q.get('standin') !== 'off') {
      camEl = doc.createElement('div');
      camEl.className = 'x-cam';
      camEl.innerHTML = STAND_IN;
      stage.append(camEl);
    }
    const drawCam = (t) => {
      if (!camEl) return;
      const c = cameraAt(o.cameraPlan || [[0, 'corner']], t, f);
      camEl.style.display = c.o > 0 ? 'block' : 'none';
      camEl.style.opacity = c.o;
      camEl.style.left = c.x + 'px';
      camEl.style.top = c.y + 'px';
      camEl.style.width = c.w + 'px';
      camEl.style.height = c.h + 'px';
      camEl.style.borderRadius = c.r + 'px';
    };

    const drawAt = (t) => {
      const list = [];
      for (const s of scenes) {
        if (!s.el) continue;
        const d = one || s === scenes[0] ? 0 : s.dissolve || 0;
        const on = one ? s === one : t >= s.from - d / 2 && t < s.to + (scenes[scenes.indexOf(s) + 1]?.dissolve || 0) / 2;
        s.el.style.display = on ? 'block' : 'none';
        if (!on) continue;
        s.el.style.opacity = d ? ease(t, s.from - d / 2, s.from + d / 2) : 1;
        s.el.style.zIndex = list.length;
        list.push(s);
      }
      for (const s of list) s.draw && s.draw(t, s.$, f);
      drawCaps(t);
      drawCam(t);
    };

    let ready = null;
    const prepare = () =>
      ready ||
      (ready = (async () => {
        // Every face the page may use, before the first frame: a font that
        // loads when its scene first shows moves the words on that frame.
        if (doc.fonts) {
          const latin = [...doc.fonts].filter((x) => !x.unicodeRange || /U\+0-FF|U\+0000-00FF|U\+0-10FFFF/i.test(x.unicodeRange));
          await Promise.race([Promise.all(latin.map((x) => x.load().catch(() => {}))), new Promise((r) => setTimeout(r, 15000))]);
          await doc.fonts.ready;
        }
        await Promise.all([...doc.images].map((i) => (i.decode ? i.decode().catch(() => {}) : 0)));
        // Scenes measure themselves while shown.
        for (const s of scenes) {
          if (!s.el) continue;
          s.el.style.display = 'block';
          if (s.setup) await s.setup(s.$, f);
          s.el.style.display = 'none';
        }
        if (o.setup) await o.setup(f);
        fitStage();
      })());

    let driven = q.has('frame') || root.__driven === true;
    root.__film = {
      shape,
      camera,
      look,
      W: f.W,
      H: f.H,
      a,
      b,
      scenes: scenes.map((s) => ({ id: s.id, a: s.from, b: s.to })),
      frame: f,
      cameraPlan: o.cameraPlan || null,
    };
    root.__dur = span;
    root.__ready = prepare;
    /** Draws the frame at t, the film's seconds. Called from outside, it stops the live play. */
    root.__frame = async (t) => {
      driven = true;
      await prepare();
      drawAt(t);
    };

    // Live: from the page's own clock, which Fil's video editor steps a
    // frame at a time and a browser runs (it loops, holding its end).
    const hold = o.hold == null ? 0.8 : o.hold;
    const loops = o.loop !== false && !root.__filScene;
    let paused = q.has('still'),
      base = clamp(parseFloat(q.get('at')) || 0, 0, span),
      since = root.performance.now(),
      shown = base;
    const head = () => {
      const x = paused ? base : base + (root.performance.now() - since) / 1000;
      return loops ? x % (span + hold) : x;
    };
    const live = () => {
      if (driven) return;
      if (!paused) {
        shown = head();
        drawAt(a + Math.min(shown, span));
      }
      root.requestAnimationFrame(live);
    };
    if (o.autoplay !== false && !driven && !paused) prepare().then(() => !driven && root.requestAnimationFrame(live));
    else if (paused && !driven) prepare().then(() => {
      if (driven) return;
      drawAt(a + base);
      root.requestAnimationFrame(live);
    });
    else prepare().then(() => !driven && drawAt(a));
    let wasPlaying = false;
    if (!root.__filScene)
      doc.addEventListener('visibilitychange', () => {
        if (doc.hidden) {
          wasPlaying = !paused;
          api.pause();
        } else if (wasPlaying) api.play();
      });

    const api = {
      span,
      frame: f,
      voice: o.voice || null,
      seek(x) {
        paused = true;
        base = shown = clamp(x, 0, span);
        return prepare().then(() => drawAt(a + shown));
      },
      pause() {
        if (paused) return;
        base = shown = head();
        paused = true;
        if (!driven) prepare().then(() => drawAt(a + Math.min(shown, span)));
      },
      play() {
        if (!paused) return;
        if (base >= span) base = 0;
        since = root.performance.now();
        paused = false;
      },
      get paused() {
        return paused;
      },
      get time() {
        return paused ? base : Math.min(head(), span);
      },
    };
    root.__explainer = api;
    if (q.has('controls')) controls(api);
    return api;
  }

  /** The words as caption lines: a line ends at a sentence, or at max chars. */
  function captionLines(words, max = 30) {
    const lines = [];
    let cur = [];
    const flush = () => {
      if (cur.length) lines.push({ from: cur[0][1], to: cur[cur.length - 1][2], words: cur });
      cur = [];
    };
    const small = /^(a|an|and|at|but|by|for|in|is|it|of|on|or|so|the|to|with|your)$/i;
    for (const w of words) {
      const len = cur.reduce((n, x) => n + String(x[0]).length + 1, 0);
      if (cur.length && len + String(w[0]).length > max) {
        // A line never ends on a small word: it goes down with the next one.
        const held = [];
        while (cur.length > 1 && small.test(String(cur[cur.length - 1][0]))) held.unshift(cur.pop());
        flush();
        cur = held;
      }
      cur.push(w);
      if (/[.!?:]$/.test(String(w[0])) || (/,$/.test(String(w[0])) && len > max * 0.45)) flush();
    }
    flush();
    // A line stays up until the next starts, if that's soon.
    for (let i = 0; i < lines.length - 1; i++) if (lines[i + 1].from - lines[i].to < 0.5) lines[i].to = lines[i + 1].from;
    return lines;
  }

  /** The camera at t along a plan [[at, layout], …]: 'hidden', 'full' or
      'corner', a move gliding `glide` s to arrive at its time. */
  function cameraAt(plan, t, f, glide = 0.54) {
    const full = { x: 0, y: 0, w: f.W, h: f.H, r: 0, o: 1 };
    const corner = { x: f.cam.x, y: f.cam.y, w: f.cam.w, h: f.cam.h, r: 22, o: 1 };
    const of = (n) => (n === 'full' ? full : n === 'corner' ? corner : { ...corner, o: 0 });
    let cur = of(plan[0][1]);
    for (let i = 1; i < plan.length; i++) {
      const [at, n] = plan[i],
        to = of(n);
      if (t < at - glide) break;
      const hard = cur.o === 0 || to.o === 0;
      if (hard) {
        cur = t >= at ? to : cur;
        continue;
      }
      const e = ease(t, at - glide, at);
      cur = { x: cur.x + (to.x - cur.x) * e, y: cur.y + (to.y - cur.y) * e, w: cur.w + (to.w - cur.w) * e, h: cur.h + (to.h - cur.h) * e, r: cur.r + (to.r - cur.r) * e, o: 1 };
    }
    return cur;
  }

  // Where a person goes until they record: a backlit silhouette, drawn, never a generated face.
  const STAND_IN = '<svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs><radialGradient id="x-back" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="#f4e6cd"/><stop offset=".6" stop-color="#d3bd96"/><stop offset="1" stop-color="#7d6c50"/></radialGradient></defs><rect width="160" height="90" fill="url(#x-back)"/><ellipse cx="80" cy="40" rx="15.5" ry="19" fill="#17120c"/><path d="M36 92c2-22 22-30 44-30s42 8 44 30z" fill="#17120c"/></svg>';

  /** A quiet bar for a film: play and pause, a scrubber, the time. For previews; a render never shows it. */
  function controls(api, el) {
    const doc = root.document;
    const bar = el || doc.body.appendChild(doc.createElement('div'));
    bar.classList.add('x-controls');
    bar.innerHTML = '<button type="button" aria-label="Pause"></button><input type="range" min="0" step="0.01" aria-label="The film’s clock"><output></output>' + (api.voice ? '<button type="button" class="x-sound">Sound</button>' : '');
    const btn = bar.querySelector('button'),
      range = bar.querySelector('input'),
      say = bar.querySelector('output'),
      sound = bar.querySelector('.x-sound');
    // The voice follows the clock, off until someone asks for it.
    let audio = null;
    if (sound)
      sound.onclick = () => {
        if (audio) {
          audio.pause();
          audio = null;
        } else audio = new Audio(api.voice);
        sound.setAttribute('aria-pressed', audio ? 'true' : 'false');
      };
    range.max = String(api.span);
    const paint = () => {
      btn.textContent = api.paused ? '▶' : '❚❚';
      btn.setAttribute('aria-label', api.paused ? 'Play' : 'Pause');
    };
    btn.onclick = () => {
      if (api.paused) api.play();
      else api.pause();
      paint();
    };
    range.oninput = () => {
      api.seek(+range.value);
      paint();
    };
    let was = null,
      dragging = false;
    range.addEventListener('pointerdown', () => (dragging = true));
    root.addEventListener('pointerup', () => (dragging = false));
    const tick = () => {
      if (!bar.isConnected) return;
      const x = Math.min(api.time, api.span);
      if (!dragging) range.value = String(x);
      say.textContent = x.toFixed(1) + ' s';
      if (audio) {
        if (api.paused) audio.pause();
        else {
          if (Math.abs(audio.currentTime - x) > 0.25) audio.currentTime = x;
          if (audio.paused) audio.play().catch(() => {});
        }
      }
      // Tells a page around it where it's up to, so a switch of look keeps its place.
      if (root.parent && root.parent !== root) root.parent.postMessage({ explainer: 'time', t: x }, '*');
      if (api.paused !== was) {
        was = api.paused;
        paint();
      }
      root.requestAnimationFrame(tick);
    };
    paint();
    tick();
    return bar;
  }

  root.HTMLExplainer = { film, controls, times, draft, frameOf, show, ring, view, pointer, split, fit, ease, out, expo, back, mix, pulse, typed, cue, blink, rnd, clamp, lin, captionLines, cameraAt, SHAPES };
})(typeof window !== 'undefined' ? window : globalThis);
