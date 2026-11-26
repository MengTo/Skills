/* The making-of film's motion kit, lifted from the Greymourn tutorial's film.js (drafts 3–4g, 17–19 Nov 2026).
   Load after explainer.js:  <script src="explainer.js"></script><script src="motion.js"></script>
   Every function sets an element from t, the film's seconds, and an `at` that is a word's time (T.name):
   nothing keeps state between frames except the one-time word wrapping, so any frame can be drawn alone.
   Calm by design: expo-out arrivals, soft focus resolving, no shines, glints or sweeps (Meng's taste).
   Colours come from the look's variables (--fire for highlights, --gilt for linework), never from here. */
(function (root) {
  'use strict';
  const X = root.HTMLExplainer;
  if (!X) throw new Error('motion.js: load explainer.js first');
  const { show, ease, expo, clamp } = X;

  /** Film seconds as the chapter time a viewer sees: 64.2 -> "1:04". */
  const mmss = (x) => Math.floor(x / 60) + ':' + String(Math.floor(x % 60)).padStart(2, '0');
  const kids = (el) => [...el.children];
  /** Children of a list in one after another from `at`, `gap` s apart (rows, chips, cards). */
  const each = (list, t, at, gap = 0.12, leave) => list.forEach((el, i) => show(el, t, at + i * gap, leave));

  /** el's words, each wrapped once in a line mask: <span class="mw"><span class="mi">word</span></span>. */
  function maskWords(el) {
    if (!el) return [];
    if (el._mw) return el._mw;
    const walk = (n) => {
      for (const c of [...n.childNodes]) {
        if (c.nodeType === 3) {
          const f = root.document.createDocumentFragment();
          for (const part of c.textContent.split(/(\s+)/)) {
            if (!part) continue;
            if (/^\s+$/.test(part)) { f.append(part); continue; }
            const w = root.document.createElement('span'); w.className = 'mw';
            const i = root.document.createElement('span'); i.className = 'mi'; i.textContent = part;
            w.append(i); f.append(w);
          }
          c.replaceWith(f);
        } else if (c.nodeType === 1 && !c.classList.contains('mw')) walk(c);
      }
    };
    walk(el);
    el._mw = [...el.querySelectorAll('.mi')];
    return el._mw;
  }
  /** A masked word reveal: each word rises out of its line, a soft focus resolving as it settles, `gap` s after
      the one before (or at o.times[i], one word per spoken word); from o.leave they lift out of the same mask.
      Needs the CSS:  .mw { display:inline-block; overflow:hidden; vertical-align:top; padding-bottom:.08em }
                      .mi { display:inline-block; will-change:transform } */
  function words(el, t, at, o = {}) {
    if (!el) return 0;
    const W = maskWords(el), gap = o.gap ?? 0.07, dur = o.dur ?? 0.8, leave = o.leave ?? Infinity;
    if (t < at - 1e-6 || t > leave + 0.4 + W.length * 0.02) { el.style.visibility = 'hidden'; return 0; }
    el.style.visibility = 'visible';
    W.forEach((w, i) => {
      const a = o.times && o.times[i] != null ? o.times[i] : at + i * gap, p = expo(t, a, a + dur), q = ease(t, leave + i * 0.02, leave + i * 0.02 + 0.32);
      const b = (1 - p) * 7 + q * 6;
      w.style.transform = p > 0.9995 && q < 0.0005 ? '' : `translateY(${((1 - p) * 118 - q * 70).toFixed(2)}%)`;
      w.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : '';
      w.style.opacity = (Math.min(1, p * 1.4) * (1 - q)).toFixed(3);
    });
    return expo(t, at, at + dur);
  }
  /** An AR glass panel: flies in from depth, turning a little, and settles flat and face-on; its gilt corners and
      edges draw on (--draw 0..1, for ornament()) as it lands. Flat at rest, so it's sharp: never scale it up
      under perspective (Chromium rasterises 3D layers at layout size). o: z, rx, ry, x, y, dur, leave. */
  function panel(el, t, at, o = {}) {
    if (!el) return 0;
    const dur = o.dur ?? 0.95, leave = o.leave ?? Infinity;
    if (t < at - 1e-6 || t > leave + 0.35) { el.style.visibility = 'hidden'; return 0; }
    el.style.visibility = 'visible';
    const p = expo(t, at, at + dur), q = ease(t, leave, leave + 0.3);
    const k = 1 - p;
    const z = k * (o.z ?? 260), rx = k * (o.rx ?? 6), ry = k * (o.ry ?? -10), x = k * (o.x ?? 40), y = k * (o.y ?? 34) - q * 24;
    el.style.transform = k < 0.0005 && q < 0.0005 ? '' : `perspective(2000px) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${(-z).toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`;
    el.style.opacity = (Math.min(1, p * 1.6) * (1 - q)).toFixed(4);
    const b = k * 8 + q * 8;
    el.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : '';
    el.style.setProperty('--draw', ease(t, at + 0.15, at + dur + 0.35).toFixed(4));
    return p * (1 - q);
  }
  /** The project's frame as holographic linework, sized w × h: a hairline rectangle, an inner one, corner brackets
      and a diamond at the middle of each edge (Greymourn's menus and map). Every path has pathLength=1, so CSS draws
      it on from --draw:  .orn path { fill:none; stroke:var(--gilt); stroke-width:1; stroke-dasharray:1;
      stroke-dashoffset:calc(1 - var(--draw, 1)) }. Change the motif to the project's own (its corners, its marks). */
  function ornament(w, h, o = {}) {
    const c = o.c ?? 34, d = 7, i = o.inset ?? 12;
    const br = (x, y, sx, sy) => `M${x + sx * c} ${y} L${x} ${y} L${x} ${y + sy * c}`;
    const dia = (x, y) => `M${x} ${y - d} L${x + d} ${y} L${x} ${y + d} L${x - d} ${y} Z`;
    return `<svg class="orn" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">
      <path class="o-edge" pathLength="1" d="M${i} ${i} H${w - i} V${h - i} H${i} Z"/>
      <path class="o-in" pathLength="1" d="M${i + 10} ${i + 10} H${w - i - 10} V${h - i - 10} H${i + 10} Z"/>
      ${[br(0, 0, 1, 1), br(w, 0, -1, 1), br(w, h, -1, -1), br(0, h, 1, -1)].map((p) => `<path class="o-br" pathLength="1" d="${p}"/>`).join('')}
      ${[dia(w / 2, i), dia(w / 2, h - i), dia(i, h / 2), dia(w - i, h / 2)].map((p) => `<path class="o-dia" pathLength="1" d="${p}"/>`).join('')}
    </svg>`;
  }
  /** An SVG ornament's linework drawn on between a and b. */
  function drawOn(svg, t, a, b) {
    if (!svg) return;
    const p = ease(t, a, b);
    svg.style.setProperty('--draw', p.toFixed(4));
    svg.style.visibility = p > 0 ? 'visible' : 'hidden';
  }
  /** A word lit while it's said: its colour mixed toward --fire and a thin underline, from at to leave.
      For a prompt read aloud ("the same camera, the same layout, the same pose"), one phrase at a time. */
  function hi(el, t, at, leave = Infinity) {
    const a = ease(t, at, at + 0.2) * (1 - ease(t, leave, leave + 0.2));
    el.style.color = a > 0.01 ? `color-mix(in srgb, var(--fire) ${(a * 100).toFixed(0)}%, currentColor)` : '';
    el.style.boxShadow = a > 0.01 ? `inset 0 -0.12em 0 color-mix(in srgb, var(--fire) ${(50 * a).toFixed(1)}%, transparent)` : 'none';
  }
  /** Before → after: `over` (the after picture, laid on the before) revealed left to right between a and b, with a
      bright vertical line (`line`, 3 px of --fire with a glow) riding the edge. The screenshot wiping into its repaint. */
  function wipe(over, line, t, a, b) {
    const p = ease(t, a, b);
    over.style.clipPath = `inset(0 ${((1 - p) * 100).toFixed(3)}% 0 0)`;
    line.style.left = `calc(${(p * 100).toFixed(3)}% - 1.5px)`;
    line.style.opacity = p > 0.001 && p < 0.999 ? 1 : 0;
  }
  /** A number counting up to n on its word, decelerating hard into place (expo): "176" on "hundred". */
  function count(el, t, n, a, b, fmt = (x) => String(Math.round(x))) {
    el.textContent = fmt(n * expo(t, a, b));
  }

  /** Real footage as a folder of numbered frames (0001.jpg… at `fps`), shown at s seconds into the clip. Returns
      the image's decode promise (the engine waits for it), or null when the frame is already up. A game's capture,
      a UI clip, a plate: frame-exact, so a re-render is the same picture. */
  function frame(img, dir, s, n, fps = 60) {
    const k = clamp(Math.floor(s * fps) + 1, 1, n);
    const src = dir.replace(/\/?$/, '/') + String(k).padStart(4, '0') + '.jpg';
    if (img.dataset.src === src) return null;
    img.dataset.src = src;
    img.src = src;
    return img.decode().catch(() => {});
  }
  /** Clips cut one after another on two stacked images, each cut a short dissolve (xf s).
      segs: [[at, {dir, n, fps}, from s into the clip, rate]]. The cold open's five gameplay cuts. */
  function montage(A, B, t, segs, xf = 0.24) {
    let i = 0;
    segs.forEach((g, k) => { if (t >= g[0]) i = k; });
    const at = (g) => g[2] + (t - g[0]) * (g[3] ?? 1);
    const clip = (g) => g[1];
    const ps = [frame(B, clip(segs[i]).dir, at(segs[i]), clip(segs[i]).n, clip(segs[i]).fps)];
    const k = i > 0 ? ease(t, segs[i][0], segs[i][0] + xf) : 1;
    B.style.opacity = k.toFixed(4);
    if (k < 1) { A.style.visibility = 'visible'; ps.push(frame(A, clip(segs[i - 1]).dir, at(segs[i - 1]), clip(segs[i - 1]).n, clip(segs[i - 1]).fps)); } else A.style.visibility = 'hidden';
    return Promise.all(ps.filter(Boolean));
  }

  /** A step title: the small label and the big numeral with its gilt rule arrive on "Step" (at), the title's words
      land on their own words (titleAt). Markup: <div class="steptitle"><p class="st-l">Step</p><p class="st-n">01</p>
      <i class="st-rule"></i><h2 class="hero">Get it playable</h2></div>. The rule is transform-origin: left. */
  function stepTitle(el, t, at, titleAt) {
    show(el.querySelector('.st-l'), t, at);
    words(el.querySelector('.st-n'), t, at, { dur: 1.0 });
    const rule = el.querySelector('.st-rule');
    if (rule) rule.style.transform = `scaleX(${ease(t, at + 0.1, at + 1.2).toFixed(4)})`;
    words(el.querySelector('.hero'), t, titleAt, { gap: 0.09, dur: 0.9 });
    return el;
  }
  /** Cards said one after another: each lands on its word and is lit (--hl) while it's being said, and the others
      step back (--dim) so the eye goes to the one being named. ats: one word time per card, plus one after the last. */
  function litCards(cards, t, ats, o = {}) {
    const hl = cards.map((_, i) => ease(t, ats[i] - 0.1, ats[i] + 0.2) * (1 - ease(t, (ats[i + 1] ?? Infinity) - 0.2, (ats[i + 1] ?? Infinity) + 0.1)));
    cards.forEach((el, i) => { panel(el, t, ats[i] - 0.15, o); el.style.setProperty('--hl', hl[i].toFixed(3)); });
    const any = Math.max(...hl);
    cards.forEach((el, i) => el.style.setProperty('--dim', (1 - 0.5 * any * (1 - hl[i])).toFixed(3)));
  }
  /** The engine's `over` hook for every scene: a slow drift left (0.6 px/s), centred on the scene's middle so its
      edges sit on the grid at the key frames, and a 0.3 s exit lifting into a soft blur before the cut, so the next
      scene comes in on its word. A scene marked nodrift (full-frame footage) or noexit (the cold open) skips them.
      film({ …, over: MakingOf.over }) */
  function over(s, t) {
    const k = s.noexit ? 0 : ease(t, s.to - 0.3, s.to);
    const dx = s.nodrift ? 0 : -0.6 * (t - (s.from + s.to) / 2);
    s.el.style.transform = dx || k ? `translate(${dx.toFixed(2)}px, ${(-16 * k).toFixed(2)}px)` : '';
    if (k > 0) s.el.style.opacity = (1 - k).toFixed(3);
    s.el.style.filter = k > 0.002 ? `blur(${(9 * k).toFixed(2)}px)` : '';
  }

  root.MakingOf = { mmss, kids, each, maskWords, words, panel, ornament, drawOn, hi, wipe, count, frame, montage, stepTitle, litCards, over };
})(typeof window !== 'undefined' ? window : globalThis);
