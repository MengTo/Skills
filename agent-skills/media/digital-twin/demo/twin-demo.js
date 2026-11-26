/* The Digital twin workflow in Fil, drawn live in HTML (HTML Demo's
   engine, step-window.js; on fil.design through stepsTwin.jsx): Mai, one
   of Fil's example presenters standing in for you, drops her face frames
   and a photo of her room into the workflow, makes three Seedream 5.0 Pro
   stills, fixes the iMac in still 1, reads her line with ElevenLabs v4,
   and turns still 2 into a Seedance 2.5 draft, then makes it final at
   1080p. Every frame is draw(t) on Fil's canvas at 1200 x 750, with Fil's
   own words, prices and the workflow's real pictures, sound and clips.

   TwinDemo.steps(base) gives the steps, { id, name, dur, html, draw },
   with the media read from `base` (a folder holding face.webp,
   still-1-before.webp, still-1.webp, still-2.webp, still-3.webp,
   talk.mp4/.webp and talk-final.mp4/.webp). Classes are xtw- only. */
(function (root) {
  'use strict';

  /* ---------- time ---------- */
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lin = (t, a, b) => clamp((t - a) / (b - a));
  function ease(t, a, b) {
    const x = lin(t, a, b);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }
  const mix = (a, b, p) => a + (b - a) * p;
  const typed = (s, t, a, b) => s.slice(0, Math.round(s.length * lin(t, a, b)));
  const within = (t, spans) => spans.some(([a, b]) => t >= a && t < b);
  const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const credits = (n) => Math.round(n).toLocaleString('en-US');
  const caretOn = (t) => Math.floor(t * 2.2) % 2 === 0;
  const lessMotion = () =>
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  /** The pointer at t along keys ([t, x, y] in order): eased from one to
      the next along a slight arc, as a hand moves; held at the ends. */
  function along(t, keys) {
    if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
    for (let i = 1; i < keys.length; i++) {
      const [t1, x1, y1] = keys[i];
      if (t > t1) continue;
      const [t0, x0, y0] = keys[i - 1];
      const p = ease(t, t0, t1);
      const dx = x1 - x0;
      const dy = y1 - y0;
      const len = Math.hypot(dx, dy) || 1;
      const bow = Math.sin(p * Math.PI) * len * 0.06;
      return [x0 + dx * p - (dy / len) * bow, y0 + dy * p + (dx / len) * bow];
    }
    const k = keys[keys.length - 1];
    return [k[1], k[2]];
  }

  /* ---------- writing the frame ---------- */
  // Each draw sets what moves; a value is written only when it changes.
  function css(el, prop, v) {
    if (!el) return;
    const memo = el.__xtw || (el.__xtw = {});
    if (memo[prop] === v) return;
    memo[prop] = v;
    el.style.setProperty(prop, v);
  }
  const op = (el, v) => css(el, 'opacity', String(Math.round(v * 1000) / 1000));
  function txt(el, s) {
    if (el && el.textContent !== s) el.textContent = s;
  }
  const cls = (el, c, on) => el && el.classList.toggle(c, !!on);
  const spin = (el, t) => css(el, 'transform', `rotate(${Math.round((t * 520) % 360)}deg)`);
  /** A clip at `want` seconds: playing while the clock runs forward,
      otherwise held on that frame (a scrub, a pause, reduced motion). */
  function clip(v, want, on) {
    if (!v) return;
    v.muted = true;
    const at = Math.max(0, Math.min(want, (v.duration || 6) - 0.05));
    const last = v.__last;
    v.__last = want;
    const moving = on && last != null && want > last && want - last < 0.3 && !lessMotion();
    // The clock draws every 40 ms while it runs; once it stops (paused,
    // off screen, a hidden tab), the clip stops with it.
    clearTimeout(v.__stop);
    if (moving) {
      if (Math.abs(v.currentTime - at) > 0.45) v.currentTime = at;
      if (v.paused) v.play().catch(() => {});
      v.__stop = setTimeout(() => v.pause(), 300);
    } else {
      if (!v.paused) v.pause();
      if (Math.abs(v.currentTime - at) > 0.04) {
        try {
          v.currentTime = at;
        } catch (e) {
          /* not loaded yet */
        }
      }
    }
  }

  /* ---------- Fil's icons (src/data/icons.js) ---------- */
  const IC = {
    "home": "<path d=\"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8\"/><path d=\"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/>",
    "comment": "<path d=\"M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719\"/>",
    "image": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" ry=\"2\"/><circle cx=\"9\" cy=\"9\" r=\"2\"/><path d=\"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\"/>",
    "film": "<path d=\"m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5\"/><rect x=\"2\" y=\"6\" width=\"14\" height=\"12\" rx=\"2\"/>",
    "cube": "<path d=\"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z\"/><path d=\"m3.3 7 8.7 5 8.7-5\"/><path d=\"M12 22V12\"/>",
    "terminal": "<path d=\"m7 11 2-2-2-2\"/><path d=\"M11 13h4\"/><rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" ry=\"2\"/>",
    "grid": "<rect width=\"7\" height=\"7\" x=\"3\" y=\"3\" rx=\"1\"/><rect width=\"7\" height=\"7\" x=\"14\" y=\"3\" rx=\"1\"/><rect width=\"7\" height=\"7\" x=\"14\" y=\"14\" rx=\"1\"/><rect width=\"7\" height=\"7\" x=\"3\" y=\"14\" rx=\"1\"/>",
    "star": "<path d=\"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z\"/>",
    "globe": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20\"/><path d=\"M2 12h20\"/>",
    "compass": "<path d=\"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z\"/><circle cx=\"12\" cy=\"12\" r=\"10\"/>",
    "workflow": "<rect width=\"8\" height=\"8\" x=\"3\" y=\"3\" rx=\"2\"/><path d=\"M7 11v4a2 2 0 0 0 2 2h4\"/><rect width=\"8\" height=\"8\" x=\"13\" y=\"13\" rx=\"2\"/>",
    "puzzle": "<path d=\"M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z\"/>",
    "bot": "<path d=\"M12 8V4H8\"/><rect width=\"16\" height=\"12\" x=\"4\" y=\"8\" rx=\"2\"/><path d=\"M2 14h2\"/><path d=\"M20 14h2\"/><path d=\"M15 13v2\"/><path d=\"M9 13v2\"/>",
    "book": "<path d=\"M12 7v14\"/><path d=\"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z\"/>",
    "music": "<path d=\"M9 18V5l12-2v13\"/><circle cx=\"6\" cy=\"18\" r=\"3\"/><circle cx=\"18\" cy=\"16\" r=\"3\"/>",
    "search": "<path d=\"m21 21-4.34-4.34\"/><circle cx=\"11\" cy=\"11\" r=\"8\"/>",
    "bolt": "<path d=\"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z\"/>",
    "chev-d": "<path d=\"m6 9 6 6 6-6\"/>",
    "chev-r": "<path d=\"m9 18 6-6-6-6\"/>",
    "share": "<circle cx=\"18\" cy=\"5\" r=\"3\"/><circle cx=\"6\" cy=\"12\" r=\"3\"/><circle cx=\"18\" cy=\"19\" r=\"3\"/><line x1=\"8.59\" x2=\"15.42\" y1=\"13.51\" y2=\"17.49\"/><line x1=\"15.41\" x2=\"8.59\" y1=\"6.51\" y2=\"10.49\"/>",
    "panel-l": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"/><path d=\"M9 3v18\"/>",
    "pointer": "<path d=\"M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z\"/>",
    "hand": "<path d=\"M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2\"/><path d=\"M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2\"/><path d=\"M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8\"/><path d=\"M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15\"/>",
    "annotate": "<rect width=\"11\" height=\"9\" x=\"10\" y=\"3\" rx=\"2\"/><path d=\"M13 6.5h5\"/><path d=\"M13 9.5h3\"/><path d=\"M10 10.5 5.5 15\"/><circle cx=\"4.5\" cy=\"16.5\" r=\"1.5\"/><path d=\"M3 21h8\"/>",
    "undo": "<path d=\"M9 14 4 9l5-5\"/><path d=\"M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11\"/>",
    "redo": "<path d=\"m15 14 5-5-5-5\"/><path d=\"M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13\"/>",
    "type": "<path d=\"M12 4v16\"/><path d=\"M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2\"/><path d=\"M9 20h6\"/>",
    "frame": "<line x1=\"22\" x2=\"2\" y1=\"6\" y2=\"6\"/><line x1=\"22\" x2=\"2\" y1=\"18\" y2=\"18\"/><line x1=\"6\" x2=\"6\" y1=\"2\" y2=\"22\"/><line x1=\"18\" x2=\"18\" y1=\"2\" y2=\"22\"/>",
    "img-plus": "<path d=\"M16 5h6\"/><path d=\"M19 2v6\"/><path d=\"M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5\"/><path d=\"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\"/><circle cx=\"9\" cy=\"9\" r=\"2\"/>",
    "x": "<path d=\"M18 6 6 18\"/><path d=\"m6 6 12 12\"/>",
    "play": "<path d=\"M7.5 4.8v14.4a.8.8 0 0 0 1.22.68l11.2-7.2a.8.8 0 0 0 0-1.36L8.72 4.12A.8.8 0 0 0 7.5 4.8z\" fill=\"currentColor\" stroke=\"none\"/>",
    "pause": "<rect x=\"14\" y=\"3\" width=\"5\" height=\"18\" rx=\"1\"/><rect x=\"5\" y=\"3\" width=\"5\" height=\"18\" rx=\"1\"/>",
    "lock": "<rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\"/><path d=\"M7 11V7a5 5 0 0 1 10 0v4\"/>",
    "check": "<path d=\"M20 6 9 17l-5-5\"/>",
    "spark": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m14.31 8 5.74 9.94\"/><path d=\"M9.69 8h11.48\"/><path d=\"m7.38 12 5.74-9.94\"/><path d=\"M9.69 16 3.95 6.06\"/><path d=\"M14.31 16H2.83\"/><path d=\"m16.62 12-5.74 9.94\"/>",
    "download": "<path d=\"M12 15V3\"/><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/><path d=\"m7 10 5 5 5-5\"/>",
    "brush": "<path d=\"m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08\"/><path d=\"M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z\"/>",
    "lasso": "<path d=\"M7 22a5 5 0 0 1-2-4\"/><path d=\"M3.3 14A6.8 6.8 0 0 1 2 10c0-4.4 4.5-8 10-8s10 3.6 10 8-4.5 8-10 8a12 12 0 0 1-5-1\"/><path d=\"M5 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z\"/>",
    "box-select": "<path d=\"M5 3a2 2 0 0 0-2 2\"/><path d=\"M19 3a2 2 0 0 1 2 2\"/><path d=\"M21 19a2 2 0 0 1-2 2\"/><path d=\"M5 21a2 2 0 0 1-2-2\"/><path d=\"M9 3h1\"/><path d=\"M9 21h1\"/><path d=\"M14 3h1\"/><path d=\"M14 21h1\"/><path d=\"M3 9v1\"/><path d=\"M21 9v1\"/><path d=\"M3 14v1\"/><path d=\"M21 14v1\"/>",
    "eraser": "<path d=\"m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21\"/><path d=\"M22 21H7\"/><path d=\"m5 11 9 9\"/>",
    "eye": "<path d=\"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>",
    "layers": "<path d=\"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z\"/><path d=\"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12\"/><path d=\"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17\"/>",
    "outpaint": "<rect x=\"8\" y=\"8\" width=\"8\" height=\"8\" rx=\"1\"/><path d=\"M3 7V5a2 2 0 0 1 2-2h2\"/><path d=\"M17 3h2a2 2 0 0 1 2 2v2\"/><path d=\"M21 17v2a2 2 0 0 1-2 2h-2\"/><path d=\"M7 21H5a2 2 0 0 1-2-2v-2\"/>",
    "crop": "<path d=\"M6 2v14a2 2 0 0 0 2 2h14\"/><path d=\"M18 22V8a2 2 0 0 0-2-2H2\"/>",
    "rotate3d": "<path d=\"M16.466 7.5C15.643 4.237 13.952 2 12 2 9.239 2 7 6.477 7 12s2.239 10 5 10c.342 0 .677-.069 1-.2\"/><path d=\"m15.194 13.707 3.814 1.86-1.86 3.814\"/><path d=\"M19 15.57c-1.804.885-4.274 1.43-7 1.43-5.523 0-10-2.239-10-5s4.477-5 10-5c4.838 0 8.873 1.718 9.8 4\"/>",
    "grid4": "<path d=\"M12 3v18\"/><path d=\"M3 12h18\"/><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/>",
    "clock": "<path d=\"M12 6v6l4 2\"/><circle cx=\"12\" cy=\"12\" r=\"10\"/>",
    "clapper": "<path d=\"M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z\"/><path d=\"m6.2 5.3 3.1 3.9\"/><path d=\"m12.4 3.4 3.1 4\"/><path d=\"M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z\"/>",
    "wand": "<path d=\"m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72\"/><path d=\"m14 7 3 3\"/><path d=\"M5 6v4\"/><path d=\"M19 14v4\"/><path d=\"M10 2v2\"/><path d=\"M7 8H3\"/><path d=\"M21 16h-4\"/><path d=\"M11 3H9\"/>",
    "file": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\"/><path d=\"M14 2v4a2 2 0 0 0 2 2h4\"/>",
    "plus": "<path d=\"M5 12h14\"/><path d=\"M12 5v14\"/>",
    "dup": "<line x1=\"15\" x2=\"15\" y1=\"12\" y2=\"18\"/><line x1=\"12\" x2=\"18\" y1=\"15\" y2=\"15\"/><rect width=\"14\" height=\"14\" x=\"8\" y=\"8\" rx=\"2\" ry=\"2\"/><path d=\"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2\"/>",
    "trash": "<path d=\"M10 11v6\"/><path d=\"M14 11v6\"/><path d=\"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6\"/><path d=\"M3 6h18\"/><path d=\"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\"/>",
    "copy": "<rect width=\"14\" height=\"14\" x=\"8\" y=\"8\" rx=\"2\" ry=\"2\"/><path d=\"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2\"/>",
    "link": "<path d=\"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71\"/><path d=\"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71\"/>",
    "front": "<path d=\"M5 3h14\"/><path d=\"m18 13-6-6-6 6\"/><path d=\"M12 7v14\"/>",
    "fit": "<path d=\"M3 7V5a2 2 0 0 1 2-2h2\"/><path d=\"M17 3h2a2 2 0 0 1 2 2v2\"/><path d=\"M21 17v2a2 2 0 0 1-2 2h-2\"/><path d=\"M7 21H5a2 2 0 0 1-2-2v-2\"/>",
    "play-o": "<path d=\"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z\"/>",
    "pencil": "<path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\"/><path d=\"m15 5 4 4\"/>",
  };
  const icon = (name, style) =>
    `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${style ? ` style="${style}"` : ''}>${IC[name] || ''}</svg>`;
  const BYTEDANCE =
    '<svg class="xtw-mk" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.8772 1.4685L24 2.5326v18.9426l-4.1228 1.0563V1.4685zm-13.3481 9.428l4.115 1.0641v8.9786l-4.115 1.0642v-11.107zM0 2.572l4.115 1.0642v16.7354L0 21.428V2.572zm17.4553 5.6205v11.107l-4.1228-1.0642V9.2568l4.1228-1.0642z"/></svg>';
  const ELEVEN = '<span class="xtw-mono">E</span>';
  const LOGO =
    '<svg class="xtw-logo" viewBox="0 0 32 32" aria-hidden="true"><path d="m16 5 10 6-10 6-10-6z" fill="#efb36c"/><path d="m6 11 10 6v11L6 22z" fill="#ef7d9b"/><path d="m26 11-10 6v11l10-6z" fill="#82c1ee"/></svg>';
  const K = {
    image: 'var(--xtw-c1)',
    video: 'var(--xtw-c2)',
    cube: 'var(--xtw-c3)',
    code: 'var(--xtw-ok)',
    audio: 'var(--xtw-c5)',
    quiet: 'var(--xtw-fg-3)',
  };

  /* ---------- the workflow, as Fil lays it out ---------- */
  // Its nodes on the canvas (src/data/workflows.js, digital-twin), in
  // canvas pixels: the files and Twin.md, the three stills in a row, then
  // the voice and the talking clip under them. `port` is how far down a
  // node its threads meet it.
  const N = {
    face: { x: 0, y: 0, w: 240, h: 234, port: 119 },
    room: { x: 0, y: 290, w: 240, h: 234, port: 119 },
    twin: { x: 0, y: 580, w: 240, h: 272, port: 145 },
    skill: { x: 0, y: 908, w: 240, h: 168, port: 84 },
    s1: { x: 320, y: 0, w: 300, h: 350, port: 207 },
    s2: { x: 650, y: 0, w: 300, h: 350, port: 207 },
    s3: { x: 980, y: 0, w: 300, h: 350, port: 207 },
    vo: { x: 320, y: 430, w: 340, h: 288, port: 176 },
    talk: { x: 980, y: 430, w: 400, h: 406, port: 235 },
  };
  // The workflow's threads; still 2 is the one picked for the clip.
  const LINKS = [
    ['twin', 's1'], ['twin', 's2'], ['twin', 's3'],
    ['skill', 's1'], ['skill', 's2'], ['skill', 's3'],
    ['twin', 'vo'], ['twin', 'talk'], ['skill', 'talk'],
    ['face', 's1'], ['face', 's2'], ['face', 's3'],
    ['room', 's1'], ['room', 's2'], ['room', 's3'],
    ['s2', 'talk'],
  ];
  const QUIET = { twin: true, skill: true };
  function thread(a, b) {
    const p = N[a];
    const q = N[b];
    const x1 = p.x + p.w;
    const y1 = p.y + p.port;
    const x2 = q.x;
    const y2 = q.y + q.port;
    const dx = Math.max(48, Math.abs(x2 - x1) * 0.5);
    return `M${x1} ${y1}C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`;
  }
  // The canvas under the bar, on the stage, and its size.
  const CX = 56;
  const CY = 56;
  // The cameras: the whole workflow; the stills; the voice; the clip.
  const CAM = {
    all: { s: 0.84, x: 30, y: 74 },
    stills: { s: 1, x: -227, y: 78 },
    voice: { s: 1.3, x: 568 - 490 * 1.3, y: 380 - 574 * 1.3 },
    clip: { s: 0.92, x: -620, y: -170 },
  };
  /** Where world point (x, y) is on the stage under camera `c`. */
  const onStage = (c, x, y) => [CX + c.x + x * c.s, CY + c.y + y * c.s];
  const at = (c, key, dx, dy) => onStage(c, N[key].x + dx, N[key].y + dy);

  // Words, as Fil and the workflow say them.
  const STILL_PROMPT = (n) =>
    `The person in Your face, in Your room, as Twin.md says: shot ${n}, from its camera at its time of day.`;
  const CLIP_PROMPT =
    'The person in the still says Twin.md’s line in English, word for word, to someone just past the lens: the head mostly still with small natural nods, small soft lip movements…';
  const LINE = 'This course is different. The agent writes the code and you shape how it feels.';
  const FACE_HINT =
    'Six to eight sharp frames of your face from your own talking-head videos: head upright, mouth closed or nearly, no selfies.';
  const ROOM_HINT =
    'Three photos of the room you film in: the whole room, your desk and the window. They go in last, so it stays your room.';
  // Mai's Twin.md, filled in (its rows as the workflow writes them).
  const TWIN = [
    ['Who', 'Mai, one of Fil’s example presenters, standing in for you'],
    ['Face', 'early thirties, a dark bob just above the shoulders, warm brown eyes, soft straight brows, gold drop earrings'],
    ['Room', 'white walls, wooden shelves and plants, a desk by tall curtained windows, a warm lamp'],
    ['Gear and clothes', 'a thin display with no chin, a white keyboard; a pink striped jumper'],
    ['Look', 'warm amber lamps, soft window light'],
    ['Line', LINE],
  ];
  // The voices v4 offers, the end of its list (server/models.js).
  const VOICES = [
    ['Hope', 'Upbeat and clear · American'],
    ['Cassidy', 'Crisp, direct and clear · American'],
    ['Brittney', 'Social media, fun and youthful · American'],
    ['Arabella', 'Mysterious and emotive · American'],
    ['Jessica Anne Bogart', 'Voiceover professional · American'],
    ['Max', 'eLearning and documentary · American'],
    ['Hey Its Brad', 'Clear documentary narrator · American'],
    ['Drew', 'Casual, curious and fun · American'],
    ['Kristen', 'Natural, upbeat and focused · American'],
  ];
  // The line's loudness, 56 bars (voice.mp3, measured).
  const WAVE = [
    0.39, 0.46, 0.51, 0.11, 0.24, 0.53, 0.1, 0.45, 0.33, 0.08, 0.62, 0.18, 0.34, 0.31, 0.14, 0.07, 0.06, 0.02,
    0.01, 0.35, 0.74, 0.56, 0.76, 0.45, 0.36, 0.4, 0.79, 0.29, 0.07, 0.35, 0.34, 0.48, 0.4, 0.3, 0.04, 0.38, 1,
    0.86, 0.58, 0.6, 0.32, 0.43, 0.52, 0.24, 0.48, 0.55, 0.29, 0.05, 0.4, 0.4, 0.3, 0.12, 0.03, 0.04, 0, 0,
  ];
  const LINE_SECS = 5.44;
  // What each run costs and took, from Fil's prices (server/models.js
  // creditsFor: Seedream 5.0 Pro at 2K with 11 references, its edit, v4 for
  // 86 characters, Seedance 2.5 at 480p with a start frame and its 1080p
  // final) and the real draft (62 s) and final (52 s).
  const PRICE = { still: 12, edit: 9, line: 1, draft: 55, final: 289 };
  const START = 2400;
  const AFTER_STILLS = START - 3 * PRICE.still;
  const AFTER_EDIT = AFTER_STILLS - PRICE.edit;
  const AFTER_LINE = AFTER_EDIT - PRICE.line;
  const AFTER_DRAFT = AFTER_LINE - PRICE.draft;
  const AFTER_FINAL = AFTER_DRAFT - PRICE.final;

  function steps(base = '') {
    const M = (f) => base + f;
    const PIC = {
      face: M('face.webp'),
      before: M('still-1-before.webp'),
      s1: M('still-1.webp'),
      s2: M('still-2.webp'),
      s3: M('still-3.webp'),
      draft: M('talk.webp'),
      final: M('talk-final.webp'),
    };
    const CLIP = { draft: M('talk.mp4'), final: M('talk-final.mp4') };
    // The room's photo: the corner of it still 2 sees, past Mai.
    const ROOM = `<span class="xtw-room"><img src="${PIC.s2}" alt=""></span>`;
    // Every step's pictures loaded once, ahead; the clips while the voice
    // plays, a step before they're needed.
    const kept = [];
    let warm = 0;
    function preload(clips) {
      if (typeof document === 'undefined' || warm >= (clips ? 2 : 1)) return;
      if (!warm) for (const src of Object.values(PIC)) kept.push(Object.assign(new Image(), { src }));
      if (clips)
        for (const src of Object.values(CLIP)) {
          const v = document.createElement('video');
          v.muted = true;
          v.preload = 'auto';
          v.src = src;
          kept.push(v);
        }
      warm = clips ? 2 : 1;
    }
    const FACE = `<img src="${PIC.face}" alt="">`;

    /* ---------- the parts ---------- */
    const chip = (inner, extra = '', attrs = '') => `<span class="xtw-chip ${extra}"${attrs}>${inner}</span>`;
    const cost = (n) => `<span class="xtw-cost">${icon('bolt')}${n}</span>`;
    /** A node's run button: Generate, busy, then Add (another take). */
    const runBtn = (price) =>
      `<span class="xtw-btn xtw-pri xtw-run"><span class="xtw-b-go">${icon('play')}Generate${cost(price)}</span><span class="xtw-b-busy"><span class="xtw-spin"></span>Generate</span><span class="xtw-b-add">${icon('plus')}Add${cost(price)}</span></span>`;
    const handles = '<i class="xtw-hd xtw-htl"></i><i class="xtw-hd xtw-htr"></i><i class="xtw-hd xtw-hbl"></i><i class="xtw-hd xtw-hbr"></i>';
    const box = (key, cls2 = '') => {
      const n = N[key];
      return `class="xtw-node ${cls2}" data-n="${key}" style="left:${n.x}px;top:${n.y}px;width:${n.w}px;height:${n.h}px"`;
    };
    const port = (key, side, colour) =>
      `<span class="xtw-port xtw-p${side}" style="top:${N[key].port}px${colour ? `;--pc:${colour}` : ''}"></span>`;
    /** The running state over a picture: drifting dots, a dim copy that
        sharpens, the picture drawing in under its scan, the timer. */
    const making = (src, typical) =>
      `<span class="xtw-dots"></span>${src ? `<img class="xtw-dev" src="${src}" alt=""><img class="xtw-rev" src="${src}" alt="">` : ''}<span class="xtw-scan"></span><span class="xtw-pill"><span class="xtw-spin"></span>Generating <code>0:00</code></span><span class="xtw-usual">${typical}</span>`;

    /** A workflow's place for a file: dropped in, it shows the picture. */
    const fileNode = (key, name, hint, pic, size) => `<div ${box(key, 'xtw-file')}>
      <span class="xtw-nname">${name}</span>${port(key, 'out', K.image)}
      <div class="xtw-nh">${icon('image', `color:${K.image}`)}<b>${name}</b><span class="xtw-tag xtw-need">Needed</span><span class="xtw-tag xtw-added">Added</span></div>
      <div class="xtw-body" style="top:50px;height:138px">
        <div class="xtw-slot"><span class="xtw-slot-ic">${icon('img-plus')}${icon('download')}</span><b><span class="xtw-slot-a">Drop an image here</span><span class="xtw-slot-o">Drop to use it as ${name}</span></b><small>${hint}</small><span class="xtw-slot-tag">or click to upload or pick one</span></div>
        <div class="xtw-adding"><span class="xtw-spin"></span>Adding your file…</div>
        <div class="xtw-pic">${pic}</div>
        <span class="xtw-scan"></span>
      </div>
      <div class="xtw-foot" style="top:198px">${chip(icon('lock'), 'xtw-ic')}<span class="xtw-hint"><span class="xtw-h-need">Needed for 3 steps</span><span class="xtw-h-done">Uploaded · ${size}</span></span></div>
    </div>`;

    const docNode = () => `<div ${box('twin', 'xtw-doc')}>
      <span class="xtw-nname">Twin.md</span>${port('twin', 'out', K.quiet)}
      <div class="xtw-nh">${icon('book', `color:${K.quiet}`)}<b>Document</b><span class="xtw-tag">MD</span></div>
      <div class="xtw-dtabs"><span class="on">Preview</span><span>Code</span><i></i><span>${icon('pencil')}Edit</span></div>
      <div class="xtw-dbody"><h4>Twin</h4><ul>${TWIN.map(([k, v]) => `<li><b>${k}:</b> ${v}</li>`).join('')}</ul></div>
      <div class="xtw-foot" style="top:234px">${chip(icon('lock'), 'xtw-ic')}<span class="xtw-hint">1 KB · 135 words</span></div>
    </div>`;

    const skillNode = () => `<div ${box('skill', 'xtw-doc')}>
      <span class="xtw-nname">digital-twin SKILL.md</span>${port('skill', 'out', K.quiet)}
      <div class="xtw-nh">${icon('wand', `color:${K.quiet}`)}<b>Skill</b><span class="xtw-tag">MD</span></div>
      <div class="xtw-sbody"><small>name</small><span>digital-twin</span><small>description</small><span class="xtw-sdesc">Makes a digital twin of the person in the reference photos, with their consent: photoreal stills of them in their own room, three at a time…</span></div>
      <div class="xtw-foot" style="top:130px">${chip(icon('lock'), 'xtw-ic')}<span class="xtw-hint">3 KB · 504 words</span></div>
    </div>`;

    /** One of the three stills: Seedream 5.0 Pro, 16:9 at 2K. */
    const stillNode = (key, n, src) => `<div ${box(key, 'xtw-gen')}>
      <span class="xtw-nname">Still ${n}</span>${port(key, 'in')}${port(key, 'out', K.image)}
      <div class="xtw-nh">${icon('image', `color:${K.image}`)}<b>Image</b><span class="xtw-nmodel">${BYTEDANCE}Seedream 5.0 Pro${icon('chev-d')}</span>${icon('x')}</div>
      <div class="xtw-refs" style="top:48px"><span class="xtw-rt xtw-rt-face">${FACE}</span><span class="xtw-rt xtw-rt-room">${ROOM}</span><span class="xtw-dchip">${icon('file')}</span><span class="xtw-dchip">${icon('file')}</span><span class="xtw-rl">2 docs</span></div>
      <div class="xtw-np" style="top:76px;height:44px">${STILL_PROMPT(n)}</div>
      <div class="xtw-pre" style="top:128px;height:157.5px">
        <span class="xtw-empty">${icon('image')}Images will appear here</span>${making(src, 'Usually under a minute')}
      </div>
      <div class="xtw-last" style="top:291px">Last run</div>
      <div class="xtw-nf" style="top:312px">${chip('16:9')}${chip('2K')}${chip(icon('lock'), 'xtw-ic')}<i class="xtw-gap"></i>${runBtn(PRICE.still)}</div>
      ${handles}
    </div>`;

    const voiceNode = () => `<div ${box('vo', 'xtw-gen xtw-audio')}>
      <span class="xtw-nname">Voice</span>${port('vo', 'in')}${port('vo', 'out', K.audio)}
      <div class="xtw-nh">${icon('music', `color:${K.audio}`)}<b>Audio</b><span class="xtw-nmodel">${ELEVEN}ElevenLabs v4${icon('chev-d')}</span>${icon('x')}</div>
      <div class="xtw-refs" style="top:48px"><span class="xtw-dchip">${icon('file')}</span><span class="xtw-rl">1 doc</span></div>
      <div class="xtw-np" style="top:76px;height:44px">${LINE}</div>
      <div class="xtw-pre xtw-wave" style="top:128px;height:96px">
        <span class="xtw-empty">${icon('music')}Your audio will appear here</span>${making('', 'Usually under a minute')}
        <span class="xtw-player"><span class="xtw-playbtn">${icon('play')}${icon('pause')}</span><span class="xtw-bars">${['dim', 'lit'].map((k) => `<span class="xtw-bl xtw-bl-${k}">${WAVE.map((v) => `<i style="--h:${Math.max(0.06, v).toFixed(2)}"></i>`).join('')}</span>`).join('')}</span><span class="xtw-wtime">0.0 / 5 s</span></span>
      </div>
      <div class="xtw-last" style="top:230px">Last run</div>
      <div class="xtw-nf" style="top:250px">${chip('<span class="xtw-voice">Hope</span>', 'xtw-vchip')}${chip(icon('lock'), 'xtw-ic')}<i class="xtw-gap"></i>${runBtn(PRICE.line)}</div>
      ${handles}
    </div>`;

    const clipNode = () => `<div ${box('talk', 'xtw-gen xtw-video')}>
      <span class="xtw-nname">Talking clip</span>${port('talk', 'in')}${port('talk', 'out', K.video)}
      <div class="xtw-nh">${icon('film', `color:${K.video}`)}<b>Video</b><span class="xtw-nmodel">${BYTEDANCE}Seedance 2.5${icon('chev-d')}</span>${icon('x')}</div>
      <div class="xtw-refs" style="top:48px"><span class="xtw-rt xtw-rt-s2"><img src="${PIC.s2}" alt=""></span><span class="xtw-dchip xtw-d1">${icon('file')}</span><span class="xtw-dchip xtw-d2">${icon('file')}</span><span class="xtw-rl"><span class="xtw-rl-a">2 docs</span><span class="xtw-rl-b">Start frame</span></span></div>
      <div class="xtw-np" style="top:76px;height:44px">${CLIP_PROMPT}</div>
      <div class="xtw-pre" style="top:128px;height:213.75px">
        <span class="xtw-empty">${icon('film')}Your clip will appear here</span>
        <video class="xtw-v xtw-v-draft" src="${CLIP.draft}" poster="${PIC.draft}" muted playsinline preload="auto"></video>
        <video class="xtw-v xtw-v-final" src="${CLIP.final}" poster="${PIC.final}" muted playsinline preload="auto"></video>
        <span class="xtw-badge">${icon('play')}Video</span>
        <span class="xtw-run-a">${making(PIC.draft, 'Usually 1–3 minutes')}</span>
        <span class="xtw-run-b">${making(PIC.final, 'Usually 1–3 minutes')}</span>
      </div>
      <div class="xtw-last" style="top:347px">Last run</div>
      <div class="xtw-nf" style="top:368px">${chip('16:9')}${chip('480p')}${chip('5 s')}${chip('<span class="xtw-draft">No draft</span>', 'xtw-dchip2')}${chip(icon('lock'), 'xtw-ic')}<i class="xtw-gap"></i>${runBtn(PRICE.draft)}</div>
      ${handles}
    </div>`;

    function world() {
      const paths = LINKS.map(
        ([a, b]) =>
          `<path class="xtw-edge${QUIET[a] ? ' xtw-quiet' : ''}" data-l="${a}-${b}" d="${thread(a, b)}" style="stroke:${QUIET[a] ? K.quiet : K.image}"/>`,
      ).join('');
      return `<svg class="xtw-threads" width="1400" height="1100" aria-hidden="true">${paths}</svg>
        ${fileNode('face', 'Your face', FACE_HINT, FACE, '42 KB')}
        ${fileNode('room', 'Your room', ROOM_HINT, ROOM, '41 KB')}
        ${docNode()}${skillNode()}
        ${stillNode('s1', 1, PIC.s1)}${stillNode('s2', 2, PIC.s2)}${stillNode('s3', 3, PIC.s3)}
        ${voiceNode()}${clipNode()}
        <span class="xtw-marq"></span>`;
    }
    const RAIL = ['home', 'comment', 'image', 'film', 'cube', 'terminal', '', 'grid', 'star', 'globe', 'compass', 'workflow', 'puzzle', 'bot', 'book'];
    const RAIL_C = { image: K.image, film: K.video, cube: K.cube, terminal: K.code };
    const TOOLS = ['pointer', 'hand', 'annotate', 'comment', '', 'undo', 'redo', '', 'type', 'image', 'film', 'cube', 'terminal', 'music', '', 'frame', 'img-plus'];
    const TOOL_C = { ...RAIL_C, music: K.audio };
    /** Fil for Mac with the canvas open: the rail, the bar, the canvas and
        its tools, `over` on the canvas and `above` over everything. */
    const app = (over = '', above = '') => `<div class="xtw">
      <nav class="xtw-rail">${LOGO}${RAIL.map((n) => (n ? icon(n, RAIL_C[n] ? `color:${RAIL_C[n]}` : '') : '<i></i>')).join('')}<span class="xtw-sw xtw-sw1"></span><span class="xtw-sw xtw-sw2"></span><span class="xtw-sw xtw-sw0 xtw-on"></span><i class="xtw-gap"></i><span class="xtw-me">M</span></nav>
      <div class="xtw-main">
        <div class="xtw-top"><span class="xtw-crumb">Drafts${icon('chev-r')}<b>Digital twin</b></span><i class="xtw-gap"></i><span class="xtw-search">${icon('search')}<span>Search or run a command</span><kbd>⌘K</kbd></span><span class="xtw-credits">${icon('bolt')}<span class="xtw-left">${credits(START)}</span>${icon('chev-d')}</span><span class="xtw-me">M</span><span class="xtw-share">${icon('share')}<span>Share</span></span></div>
        <div class="xtw-canvas">
          <div class="xtw-world">${world()}</div>
          <span class="xtw-cchip">${icon('panel-l')}<span class="xtw-sw xtw-sw0"></span>Digital twin${icon('comment')}</span>
          ${over}
          <div class="xtw-tools">${TOOLS.map((n, j) => (n ? `<span${j === 0 ? ' class="xtw-on"' : ''}>${icon(n, TOOL_C[n] ? `color:${TOOL_C[n]}` : '')}</span>` : '<i></i>')).join('')}</div>
        </div>
      </div>
      ${above}
    </div>`;
    const toast = (words) => `<span class="xtw-toast">${words}</span>`;

    /* ---------- the canvas, from t ---------- */
    /** The world under camera `c`. */
    function camera($, c) {
      css($('.xtw-world'), 'transform', `translate(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px) scale(${c.s.toFixed(4)})`);
    }
    const node = ($, key) => $(`[data-n="${key}"]`);
    const part = ($, key, sel) => $(`[data-n="${key}"] ${sel}`);
    /** A file dropped into its place: over it, adding, then the picture. */
    function file($, key, { over = false, from = Infinity, t }) {
      const el = node($, key);
      const added = t >= from + 0.38;
      const reveal = ease(t, from + 0.38, from + 1);
      cls(el, 'xtw-over', over && t < from);
      cls(el, 'xtw-in', added);
      op(part($, key, '.xtw-slot'), t < from ? 1 : 0);
      op(part($, key, '.xtw-adding'), t >= from && !added ? 1 : 0);
      spin(part($, key, '.xtw-adding .xtw-spin'), t);
      css(part($, key, '.xtw-pic'), 'clip-path', `inset(0 0 ${((1 - reveal) * 100).toFixed(2)}% 0)`);
      const sc = part($, key, '.xtw-scan');
      op(sc, reveal > 0 && reveal < 1 ? 1 : 0);
      css(sc, 'top', `${(reveal * 100).toFixed(2)}%`);
      return added;
    }
    /** A generation node's run: `go` when it starts, its picture drawing
        in over [a, b]; `rate` how many of the app's seconds pass for each
        of the demo's, for its timer. */
    function run($, key, { t, go, a, b, rate, price, sel, scope = '' }) {
      const el = node($, key);
      const pre = (s) => part($, key, `${scope} ${s}`);
      const busy = t >= go && t < b;
      const done = t >= b;
      const reveal = ease(t, a, b);
      const settle = lin(t, b, b + 0.9);
      if (!scope) {
        cls(el, 'xtw-busy', busy);
        cls(el, 'xtw-done', done);
        cls(el, 'xtw-sel', !!sel);
        css(el, '--glow', busy ? (0.75 + 0.25 * Math.sin(t * 5)).toFixed(3) : '0');
        op(part($, key, '.xtw-empty'), t < go ? 1 : 0);
      }
      op(pre('.xtw-dots'), busy ? 1 - reveal : 0);
      css(pre('.xtw-dots'), 'background-position', `${((t * 9) % 18).toFixed(1)}px 0`);
      op(pre('.xtw-dev'), busy ? lin(t, go + 0.2, a + 0.2) * (1 - reveal) * 0.6 : 0);
      const rev = pre('.xtw-rev');
      css(rev, 'clip-path', `inset(0 0 ${((1 - (t >= go ? reveal : 0)) * 100).toFixed(2)}% 0)`);
      css(rev, 'filter', `brightness(${(1 + 0.35 * (1 - settle)).toFixed(3)})`);
      const sc = pre('.xtw-scan');
      op(sc, reveal > 0 && reveal < 1 ? 1 : 0);
      css(sc, 'top', `${(reveal * 100).toFixed(2)}%`);
      op(pre('.xtw-pill'), busy ? 1 : 0);
      spin(pre('.xtw-pill .xtw-spin'), t);
      txt(pre('.xtw-pill code'), clock(Math.max(0, Math.min(t, b) - go) * rate));
      op(pre('.xtw-usual'), busy ? 1 - reveal : 0);
      const last = part($, key, '.xtw-last');
      if (done) txt(last, `Last run · ${clock((b - go) * rate)} · ${price} ${price === 1 ? 'credit' : 'credits'}`);
      op(last, done ? 1 : 0);
      spin(part($, key, '.xtw-b-busy .xtw-spin'), t);
      return done;
    }
    /** The threads: a file's light up once it's in; a thread into a node
        that's running marches. */
    function threads($, t, { lit = {}, live = {} }) {
      for (const [a, b] of LINKS) {
        const el = $(`[data-l="${a}-${b}"]`);
        const on = lit[a] == null ? 1 : lit[a];
        if (!QUIET[a]) op(el, 0.22 + 0.58 * on);
        cls(el, 'xtw-live', !!live[b]);
        css(el, 'stroke-dashoffset', live[b] ? `${-((t * 20) % 13).toFixed(1)}` : '0');
      }
    }
    /** What every node shows once the steps before have run. */
    function made($, { stills = true, voice = false, kristen = false }) {
      for (const k of ['face', 'room']) file($, k, { from: -9, t: 0 });
      if (stills)
        for (const k of ['s1', 's2', 's3']) {
          run($, k, { t: 99, go: T2.go, a: REV2[k][0], b: REV2[k][1], rate: 18, price: PRICE.still });
        }
      refs($, { face: true, room: true, s2: stills });
      if (voice) {
        run($, 'vo', { t: 99, go: 0, a: 0, b: 0.8, rate: 5, price: PRICE.line });
        cls(node($, 'vo'), 'xtw-heard', true);
        bars($, 1, 0);
      }
      txt(part($, 'vo', '.xtw-voice'), kristen ? 'Kristen' : 'Hope');
    }
    /** The stills' and the clip's inputs: the files once they're in. */
    function refs($, { face, room, s2 }) {
      for (const k of ['s1', 's2', 's3']) {
        const n = (face ? 1 : 0) + (room ? 1 : 0);
        cls(part($, k, '.xtw-rt-face'), 'xtw-on', face);
        cls(part($, k, '.xtw-rt-room'), 'xtw-on', room);
        txt(part($, k, '.xtw-rl'), `${n ? `${n} reference${n > 1 ? 's' : ''} · ` : ''}2 docs`);
      }
      cls(node($, 'talk'), 'xtw-framed', s2);
    }
    /** The line's waveform: drawn in `drawn` of the way, played `played`. */
    function bars($, drawn, played) {
      const list = part($, 'vo', '.xtw-bars');
      if (!list) return;
      css(list, 'clip-path', `inset(0 ${((1 - drawn) * 100).toFixed(2)}% 0 0)`);
      css(part($, 'vo', '.xtw-bl-lit'), 'clip-path', `inset(0 ${((1 - played) * 100).toFixed(2)}% 0 0)`);
      txt(part($, 'vo', '.xtw-wtime'), `${(played * LINE_SECS).toFixed(1)} / 5 s`);
    }
    const left = ($, n) => txt($('.xtw-left'), credits(n));

    /* ================================================== 1 · the files */
    // A file from Finder dragged over its place, dropped, then the next.
    const FACE_AT = at(CAM.all, 'face', 120, 119);
    const ROOM_AT = at(CAM.all, 'room', 120, 119);
    const T1 = { in1: 0.25, drop1: 1.3, out: 2.2, in2: 2.3, drop2: 3.25 };
    const DROP_KEYS = [
      [0, 1236, 300],
      [T1.in1, 1236, 300],
      [1.2, FACE_AT[0], FACE_AT[1] + 2],
      [T1.drop1, FACE_AT[0], FACE_AT[1] + 2],
      [T1.out, 1236, 520],
      [T1.in2, 1236, 520],
      [3.15, ROOM_AT[0], ROOM_AT[1] + 2],
      [T1.drop2, ROOM_AT[0], ROOM_AT[1] + 2],
      [4.1, 610, 640],
    ];
    const ghost = (pic, name) =>
      `<span class="xtw-ghost xtw-ghost-${name}"><span class="xtw-gpic">${pic}</span><span class="xtw-gname">${name}.webp</span></span>`;
    const filesStep = {
      id: 'files',
      name: 'Drop your files',
      dur: 5.6,
      html: app('', ghost(FACE, 'face') + ghost(ROOM, 'room')),
      draw(t, $) {
        preload(false);
        camera($, CAM.all);
        made($, { stills: false });
        const [x, y] = along(t, DROP_KEYS);
        const dragging1 = t >= T1.in1 && t < T1.drop1;
        const dragging2 = t >= T1.in2 && t < T1.drop2;
        const g1 = $('.xtw-ghost-face');
        const g2 = $('.xtw-ghost-room');
        op(g1, dragging1 ? 1 : 0);
        op(g2, dragging2 ? 1 : 0);
        css(g1, 'transform', `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`);
        css(g2, 'transform', `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`);
        // Over a place while it's carried there.
        const near = (p) => Math.hypot(x - p[0], y - p[1]) < 120;
        const faceIn = file($, 'face', { over: dragging1 && near(FACE_AT), from: T1.drop1, t });
        const roomIn = file($, 'room', { over: dragging2 && near(ROOM_AT), from: T1.drop2, t });
        threads($, t, { lit: { face: ease(t, T1.drop1 + 0.38, T1.drop1 + 0.9), room: ease(t, T1.drop2 + 0.38, T1.drop2 + 0.9), s2: 0 } });
        refs($, { face: faceIn, room: roomIn, s2: false });
        for (const k of ['s1', 's2', 's3']) run($, k, { t, go: 99, a: 99, b: 99, rate: 1, price: PRICE.still });
        run($, 'vo', { t, go: 99, a: 99, b: 99, rate: 1, price: PRICE.line });
        run($, 'talk', { t, go: 99, a: 99, b: 99, rate: 1, price: PRICE.draft, scope: '.xtw-run-a' });
        left($, START);
        return { cursor: { x, y, press: dragging1 || dragging2 } };
      },
    };

    /* ================================================= 2 · three stills */
    // Picked together, Generate 3 nodes from their menu, all three at once.
    const C2 = CAM.stills;
    const MARQ = { from: [129, 516], to: [1124, 100], a: 0.6, b: 1.35 };
    const MENU_AT = at(C2, 's2', 150, 207);
    const T2 = { press: 0.55, rclick: 1.95, open: 2.0, go: 2.5, deselect: 4.95 };
    const REV2 = { s1: [3.0, 3.8], s2: [3.35, 4.15], s3: [3.7, 4.5] };
    const MENU2 = [
      ['play-o', 'Generate 3 nodes', '↵'],
      ['dup', 'Duplicate', '⌘ D'],
      ['copy', 'Copy', '⌘ C'],
      ['copy', 'Copy prompt', ''],
      ['link', 'Copy link', '', true],
      ['front', 'Bring to front', ''],
      ['fit', 'Zoom to selection', '⇧ 2'],
      ['trash', 'Delete 3 nodes', '⌫'],
    ];
    const menu = (cls2, head, rows) =>
      `<div class="xtw-menu ${cls2}">${head ? `<span class="xtw-menu-h">${head}</span>` : ''}${rows.join('')}</div>`;
    const ctxMenu = menu(
      'xtw-ctx',
      '',
      MENU2.map(([ic, label, kbd, off], j) => `<span class="xtw-mi${off ? ' xtw-off' : ''}${j === 0 ? ' xtw-first' : ''}">${icon(ic)}<span class="xtw-mi-t">${label}</span><kbd>${kbd}</kbd></span>`),
    );
    const STILL_PATH = [
      [0, 610, 640],
      [0.45, ...MARQ.from],
      [MARQ.a, ...MARQ.from],
      [MARQ.b, ...MARQ.to],
      [1.45, ...MARQ.to],
      [1.85, MENU_AT[0], MENU_AT[1]],
      [T2.rclick + 0.1, MENU_AT[0], MENU_AT[1]],
      [2.35, MENU_AT[0] + 48, MENU_AT[1] + 22],
      [T2.go + 0.05, MENU_AT[0] + 48, MENU_AT[1] + 22],
      [3.3, 650, 600],
      [T2.deselect + 0.2, 650, 600],
    ];
    const stillsStep = {
      id: 'stills',
      name: 'Three stills',
      dur: 6.4,
      html: app(ctxMenu),
      draw(t, $) {
        preload(false);
        camera($, C2);
        made($, { stills: false });
        const [x, y] = along(t, STILL_PATH);
        // The box drawn round the three, and what it takes in.
        const m = $('.xtw-marq');
        const p = ease(t, MARQ.a, MARQ.b);
        const drawing = t >= MARQ.a && t < MARQ.b + 0.05;
        const toWorld = ([sx, sy]) => [(sx - CX - C2.x) / C2.s, (sy - CY - C2.y) / C2.s];
        const [ax, ay] = toWorld(MARQ.from);
        const [bx, by] = toWorld([mix(MARQ.from[0], MARQ.to[0], p), mix(MARQ.from[1], MARQ.to[1], p)]);
        op(m, drawing ? 1 : 0);
        css(m, 'left', `${Math.min(ax, bx).toFixed(1)}px`);
        css(m, 'top', `${Math.min(ay, by).toFixed(1)}px`);
        css(m, 'width', `${Math.abs(bx - ax).toFixed(1)}px`);
        css(m, 'height', `${Math.abs(by - ay).toFixed(1)}px`);
        const sel = (k) => t < T2.deselect && t >= MARQ.a && Math.max(ax, bx) >= N[k].x && t >= MARQ.a + 0.05;
        // Its menu, at the pointer.
        const cm = $('.xtw-ctx');
        const open = t >= T2.open && t < T2.go + 0.06;
        op(cm, open ? ease(t, T2.open, T2.open + 0.12) : 0);
        css(cm, 'left', `${MENU_AT[0] - CX + 2}px`);
        css(cm, 'top', `${MENU_AT[1] - CY + 2}px`);
        cls($('.xtw-ctx .xtw-first'), 'xtw-over', t >= 2.2);
        let spent = 0;
        for (const k of ['s1', 's2', 's3']) {
          const [a, b] = REV2[k];
          if (run($, k, { t, go: T2.go, a, b, rate: 18, price: PRICE.still, sel: sel(k) })) spent += PRICE.still;
        }
        threads($, t, { lit: { s2: ease(t, REV2.s2[1], REV2.s2[1] + 0.5) }, live: { s1: t >= T2.go && t < REV2.s1[1], s2: t >= T2.go && t < REV2.s2[1], s3: t >= T2.go && t < REV2.s3[1] } });
        refs($, { face: true, room: true, s2: t >= REV2.s2[1] });
        left($, START - spent);
        run($, 'vo', { t, go: 99, a: 99, b: 99, rate: 1, price: PRICE.line });
        run($, 'talk', { t, go: 99, a: 99, b: 99, rate: 1, price: PRICE.draft, scope: '.xtw-run-a' });
        const press = within(t, [[T2.press, MARQ.b + 0.05], [T2.rclick, T2.rclick + 0.16], [T2.go, T2.go + 0.16], [T2.deselect, T2.deselect + 0.16]]);
        return { cursor: { x, y, press } };
      },
    };

    /* ================================================ 3 · fix the iMac */
    // Still 1 opens in the image editor; the iMac is marked, one note,
    // Seedream 5.0 Pro edits it, and the display comes back thin.
    const ED = { x: 192.5, y: 62, w: 903, h: 508 };
    const NODE_PIC = (() => {
      const [x, y] = at(C2, 's1', 10, 128);
      return { x, y, w: 280 * C2.s, h: 157.5 * C2.s };
    })();
    const ZONE = { u: 0.545, v: 0.27, u2: 0.905, v2: 0.9 };
    const zx = (u) => ED.x + u * ED.w;
    const zy = (v) => ED.y + v * ED.h;
    const FIX = 'A thin display with no chin and no logo';
    const T3 = { dbl: [0.5, 0.66], open: [0.75, 1.2], tool: 1.6, press: 2.05, drag: [2.1, 2.8], ask: 2.85, type: [2.95, 3.8], enter: 3.9, go: 4.45, work: 4.7, rev: [5.3, 6.1] };
    const GO3 = [933, 704];
    const BOX_TOOL = [384, 32];
    const ED_TOOLS = [['inpaint', 'Inpaint', 'brush'], ['outpaint', 'Outpaint', 'outpaint'], ['crop', 'Crop', 'crop'], ['angle', 'Angle', 'rotate3d'], ['layers', 'Layers', 'layers'], ['grid', 'Grid', 'grid4']];
    const editor = `<div class="xtw-ed">
        <div class="xtw-ebar">
          <span class="xtw-etitle"><b>${STILL_PROMPT(1)}</b><small><span class="xtw-sub-a">Mark what to change</span><span class="xtw-sub-b">1 zone marked</span></small></span>
          <span class="xtw-seg xtw-tseg"><span class="xtw-t-brush">${icon('brush')}</span><span>${icon('lasso')}</span><span class="xtw-t-box">${icon('box-select')}</span><span>${icon('eraser')}</span></span>
          <span class="xtw-size"><i></i><span class="xtw-range"></span></span>
          <span class="xtw-ib xtw-undo">${icon('undo')}</span><span class="xtw-ib xtw-dim">${icon('redo')}</span>
          <span class="xtw-btn xtw-plain xtw-clear">Clear</span>
          <i class="xtw-gap"></i>
          <span class="xtw-seg"><span>${icon('eye')}View</span><span class="xtw-on">${icon('brush')}Edit</span></span>
          <span class="xtw-btn">${icon('download')}Download</span>
          <span class="xtw-ib">${icon('x')}</span>
        </div>
        <nav class="xtw-erail">${ED_TOOLS.map(([id, label, ic]) => `<span${id === 'inpaint' ? ' class="xtw-on"' : ''}>${icon(ic)}<em>${label}</em></span>`).join('')}</nav>
        <div class="xtw-compose">
          <span class="xtw-zone"><span class="xtw-num">1</span><span class="xtw-where">Right</span><span class="xtw-zone-t">${FIX}</span><span class="xtw-zone-ph">Describe this change</span></span>
          <span class="xtw-ta"><span class="xtw-ta-a">Describe the change, or mark where it goes first</span><span class="xtw-ta-b">Anything else, for the whole image (optional)</span></span>
          <div class="xtw-row"><span class="xtw-ehint"><span class="xtw-eh-a">Nothing marked: the whole image is edited.</span><span class="xtw-eh-b">Seedream 5.0 Pro can’t use marked areas: the whole image is edited, as described.</span></span>${chip(`${BYTEDANCE}Seedream 5.0 Pro${icon('chev-d')}`, 'xtw-mchip')}${chip('Original')}${chip('2K')}${chip(icon('lock'), 'xtw-ic')}<span class="xtw-btn xtw-pri xtw-ego"><span class="xtw-b-go">Generate${cost(PRICE.edit)}</span><span class="xtw-b-busy">Starting…</span></span></div>
        </div>
      </div>
      <div class="xtw-frame" style="left:${ED.x}px;top:${ED.y}px;width:${ED.w}px;height:${ED.h}px">
        <img class="xtw-f-before" src="${PIC.before}" alt="">
        <img class="xtw-dev" src="${PIC.s1}" alt="">
        <span class="xtw-dots"></span>
        <img class="xtw-rev" src="${PIC.s1}" alt="">
        <span class="xtw-mark" style="left:${ZONE.u * 100}%;top:${ZONE.v * 100}%"></span>
        <span class="xtw-scan"></span>
        <span class="xtw-pill"><span class="xtw-spin"></span>Generating <code>0:00</code></span>
      </div>
      <span class="xtw-num xtw-pin" style="left:${zx(ZONE.u) + 5}px;top:${zy(ZONE.v) + 5}px">1</span>
      <span class="xtw-ask" style="left:${zx(ZONE.u)}px;top:${zy(ZONE.v) - 46}px"><span class="xtw-num">1</span><span class="xtw-ask-in"><span class="xtw-ask-t"></span><i class="xtw-caret"></i><span class="xtw-ask-ph">What should change here?</span></span><span class="xtw-ib">${icon('check')}</span></span>`;
    const FIX_PATH = [
      [0, 650, 600],
      [0.45, NODE_PIC.x + 140, NODE_PIC.y + 70],
      [0.8, NODE_PIC.x + 140, NODE_PIC.y + 70],
      [1.45, ...BOX_TOOL],
      [1.7, ...BOX_TOOL],
      [2.0, zx(ZONE.u), zy(ZONE.v)],
      [T3.drag[0], zx(ZONE.u), zy(ZONE.v)],
      [T3.drag[1], zx(ZONE.u2), zy(ZONE.v2)],
      [3.9, zx(ZONE.u2) + 20, zy(ZONE.v2) + 30],
      [4.3, ...GO3],
      [T3.go + 0.1, ...GO3],
      [5.1, 1110, 640],
    ];
    const fixStep = {
      id: 'fix',
      name: 'Fix the iMac',
      dur: 7.2,
      html: app('', editor),
      draw(t, $) {
        camera($, C2);
        made($, {});
        threads($, t, {});
        left($, AFTER_STILLS);
        run($, 'vo', { t, go: 99, a: 99, b: 99, rate: 1, price: PRICE.line });
        run($, 'talk', { t, go: 99, a: 99, b: 99, rate: 1, price: PRICE.draft, scope: '.xtw-run-a' });
        const [x, y] = along(t, FIX_PATH);
        // The editor opens, the still flying from its node to full size.
        const o = ease(t, ...T3.open);
        op($('.xtw-ed'), o);
        const f = $('.xtw-frame');
        const sx = mix(NODE_PIC.w / ED.w, 1, o);
        css(f, 'transform', `translate(${mix(NODE_PIC.x - ED.x, 0, o).toFixed(1)}px, ${mix(NODE_PIC.y - ED.y, 0, o).toFixed(1)}px) scale(${sx.toFixed(4)})`);
        op(f, t >= T3.open[0] ? 1 : 0);
        css(f, 'border-radius', `${mix(8 / sx, 10, o).toFixed(1)}px`);
        // The box tool, then the iMac marked.
        const boxTool = t >= T3.tool;
        cls($('.xtw-t-box'), 'xtw-on', boxTool);
        cls($('.xtw-t-brush'), 'xtw-on', !boxTool);
        const p = ease(t, ...T3.drag);
        const marked = t >= T3.drag[0];
        const zone = t >= T3.drag[1];
        const fresh = t < T3.rev[0];
        const mk = $('.xtw-mark');
        op(mk, marked ? 1 - lin(t, T3.rev[0], T3.rev[0] + 0.4) : 0);
        css(mk, 'width', `${(p * (ZONE.u2 - ZONE.u) * 100).toFixed(2)}%`);
        css(mk, 'height', `${(p * (ZONE.v2 - ZONE.v) * 100).toFixed(2)}%`);
        op($('.xtw-pin'), zone && fresh ? 1 : 0);
        cls($('.xtw-ed'), 'xtw-zoned', zone && fresh);
        cls($('.xtw-ed'), 'xtw-noted', t >= T3.enter && fresh);
        cls($('.xtw-undo'), 'xtw-dim', !marked);
        cls($('.xtw-clear'), 'xtw-dim', !marked);
        // What should change there, typed.
        const asking = t >= T3.ask && t < T3.enter;
        op($('.xtw-ask'), asking ? lin(t, T3.ask, T3.ask + 0.15) : 0);
        const said = typed(FIX, t, ...T3.type);
        txt($('.xtw-ask-t'), said);
        op($('.xtw-ask-ph'), said ? 0 : 1);
        op($('.xtw-caret'), t < T3.type[1] + 0.05 || caretOn(t) ? 1 : 0);
        // Generate, then the picture working and drawing in.
        const ego = $('.xtw-ego');
        cls(ego, 'xtw-off', t < T3.enter || !fresh);
        cls(ego, 'xtw-going', t >= T3.go + 0.04 && t < T3.work);
        const busy = t >= T3.work && t < T3.rev[1];
        const reveal = ease(t, ...T3.rev);
        const settle = lin(t, T3.rev[1], T3.rev[1] + 0.9);
        op($('.xtw-frame .xtw-dots'), busy ? 1 - reveal : 0);
        css($('.xtw-frame .xtw-dots'), 'background-position', `${((t * 9) % 18).toFixed(1)}px 0`);
        op($('.xtw-frame .xtw-dev'), busy ? lin(t, T3.work, T3.rev[0]) * (1 - reveal) * 0.5 : 0);
        op($('.xtw-f-before'), 1 - (busy ? 0.45 * (1 - reveal) * lin(t, T3.work, T3.work + 0.3) : 0));
        const rev = $('.xtw-frame .xtw-rev');
        css(rev, 'clip-path', `inset(0 0 ${((1 - reveal) * 100).toFixed(2)}% 0)`);
        css(rev, 'filter', `brightness(${(1 + 0.3 * (1 - settle)).toFixed(3)})`);
        const sc = $('.xtw-frame .xtw-scan');
        op(sc, reveal > 0 && reveal < 1 ? 1 : 0);
        css(sc, 'top', `${(reveal * 100).toFixed(2)}%`);
        op($('.xtw-frame .xtw-pill'), busy ? 1 : 0);
        spin($('.xtw-frame .xtw-pill .xtw-spin'), t);
        txt($('.xtw-frame .xtw-pill code'), clock(Math.max(0, Math.min(t, T3.rev[1]) - T3.go) * 18));
        const press = within(t, [[T3.dbl[0], T3.dbl[0] + 0.1], [T3.dbl[1], T3.dbl[1] + 0.1], [T3.tool, T3.tool + 0.16], [T3.press, T3.drag[1] + 0.05], [T3.go, T3.go + 0.16]]);
        return { cursor: { x, y, press } };
      },
    };

    /* ===================================================== 4 · the voice */
    // Kristen picked for the line, Generate, then it plays.
    const C4 = CAM.voice;
    const VCHIP = at(C4, 'vo', 36, 264);
    const VGO = at(C4, 'vo', 290, 264);
    const VPLAY = at(C4, 'vo', 39, 176);
    const VMENU = { x: at(C4, 'vo', 10, 0)[0] - CX, bottom: at(C4, 'vo', 0, 250)[1] - CY - 6 };
    const KRISTEN = [VMENU.x + CX + 90, VMENU.bottom + CY - 6 - 22];
    const T4 = { chip: 0.85, open: 0.9, pick: 1.4, go: 2.0, a: 2.8, b: 3.2, play: 3.6 };
    const voiceMenu = `<div class="xtw-menu xtw-vmenu" style="left:${VMENU.x}px;bottom:${686 - VMENU.bottom}px"><span class="xtw-menu-h">Voice</span>${VOICES.map(([n, about]) => `<span class="xtw-mi xtw-vi${n === 'Kristen' ? ' xtw-k' : ''}${n === 'Hope' ? ' xtw-h' : ''}"><span class="xtw-mi-t">${n}<small>${about}</small></span>${icon('check')}</span>`).join('')}</div>`;
    const VOICE_PATH = [
      [0, 1110, 640],
      [0.7, ...VCHIP],
      [T4.chip + 0.08, ...VCHIP],
      [1.25, ...KRISTEN],
      [T4.pick + 0.08, ...KRISTEN],
      [1.85, ...VGO],
      [T4.go + 0.1, ...VGO],
      [3.4, ...VPLAY],
      [T4.play + 0.1, ...VPLAY],
      [4.3, 700, 690],
    ];
    const voiceStep = {
      id: 'voice',
      name: 'Your voice',
      dur: 5.6,
      html: app(voiceMenu),
      draw(t, $) {
        preload(true);
        camera($, C4);
        made($, {});
        threads($, t, { live: { vo: t >= T4.go && t < T4.a } });
        const [x, y] = along(t, VOICE_PATH);
        const vm = $('.xtw-vmenu');
        const open = t >= T4.open && t < T4.pick + 0.06;
        op(vm, open ? ease(t, T4.open, T4.open + 0.12) : 0);
        cls($('.xtw-vmenu .xtw-k'), 'xtw-over', t >= 1.2);
        const kristen = t >= T4.pick;
        cls($('.xtw-vmenu .xtw-h'), 'xtw-on', !kristen);
        txt(part($, 'vo', '.xtw-voice'), kristen ? 'Kristen' : 'Hope');
        cls(node($, 'vo'), 'xtw-sel', t >= T4.chip);
        const done = run($, 'vo', { t, go: T4.go, a: T4.a, b: T4.a + 0.01, rate: 4 / (T4.a - T4.go), price: PRICE.line });
        cls(node($, 'vo'), 'xtw-sel', t >= T4.chip);
        cls(node($, 'vo'), 'xtw-heard', done);
        const playing = t >= T4.play + 0.05;
        cls(node($, 'vo'), 'xtw-playing', playing);
        bars($, ease(t, T4.a, T4.b), playing ? Math.min(1, (t - T4.play - 0.05) / LINE_SECS) : 0);
        left($, done ? AFTER_LINE : AFTER_EDIT);
        run($, 'talk', { t, go: 99, a: 99, b: 99, rate: 1, price: PRICE.draft, scope: '.xtw-run-a' });
        const press = within(t, [[T4.chip, T4.chip + 0.16], [T4.pick, T4.pick + 0.16], [T4.go, T4.go + 0.16], [T4.play, T4.play + 0.16]]);
        return { cursor: { x, y, press } };
      },
    };

    /* =============================================== 5 · the talking clip */
    // Draft on, Generate: a 480p draft of still 2 talking; then Make final
    // makes the same take at 1080p.
    const C5 = CAM.clip;
    const DCHIP = at(C5, 'talk', 178, 382);
    const DGO = at(C5, 'talk', 336, 382);
    const DMENU = { x: at(C5, 'talk', 142, 0)[0] - CX, bottom: at(C5, 'talk', 0, 368)[1] - CY - 6 };
    const DON = [DMENU.x + CX + 70, DMENU.bottom + CY - 6 - 50 - 25];
    const FINAL_BTN = [1004, 276];
    const T5 = { chip: 0.9, open: 0.95, on: 1.4, go: 1.95, a: 3.6, b: 4.2, final: 4.9, fa: 6.2, fb: 6.8 };
    const draftMenu = `<div class="xtw-menu xtw-dmenu" style="left:${DMENU.x}px;bottom:${686 - DMENU.bottom}px"><span class="xtw-menu-h">Draft mode</span><span class="xtw-mi xtw-d-on"><span class="xtw-mi-t">On<small>A 480p preview to check the shot, for less; make it final after</small></span>${icon('check')}</span><span class="xtw-mi xtw-d-off xtw-on"><span class="xtw-mi-t">Off<small>Made at the resolution you pick</small></span>${icon('check')}</span></div>`;
    const kv = (rows) => `<dl class="xtw-kv">${rows.map(([k, v, c]) => `<dt${c ? ` class="${c}"` : ''}>${k}</dt><dd${c ? ` class="${c}"` : ''}>${v}</dd>`).join('')}</dl>`;
    const inspector = `<aside class="xtw-insp">
        <div class="xtw-i-take"><span class="xtw-i-pic"><img class="xtw-i-a" src="${PIC.draft}" alt=""><img class="xtw-i-b" src="${PIC.final}" alt=""></span>
          <span class="xtw-i-acts"><span class="xtw-btn xtw-sm">${icon('book')}Turn into skill</span><span class="xtw-btn xtw-sm xtw-pri xtw-final">${icon('spark')}<span class="xtw-f-a">Make final</span><span class="xtw-spin"></span>${cost(PRICE.final)}</span><span class="xtw-btn xtw-sm">${icon('clapper')}Add to video editor</span></span></div>
        <section class="xtw-isec"><h4>Details</h4>${kv([
          ['Status', '<span class="xtw-st">Not generated yet</span>'],
          ['Visibility', `${icon('lock')}Private`],
          ['Model', 'Seedance 2.5'],
          ['Time', '<span class="xtw-took">1:02</span>', 'xtw-r-took'],
          ['Cost', '<span class="xtw-cost2">55 credits</span>', 'xtw-r-took'],
          ['Runs', '<span class="xtw-runs">0</span>'],
          ['Cost per run', `${PRICE.draft} credits`, 'xtw-r-per'],
          ['Credits left', `<span class="xtw-ileft">${credits(AFTER_LINE)}</span>`],
        ])}</section>
        <div class="xtw-ifoot"><span class="xtw-btn xtw-pri xtw-wide xtw-run"><span class="xtw-b-go">${icon('play')}Generate</span><span class="xtw-b-busy"><span class="xtw-spin"></span>Generating</span><span class="xtw-b-add">${icon('plus')}Add</span></span></div>
      </aside>`;
    const CLIP_PATH = [
      [0, 700, 690],
      [0.75, ...DCHIP],
      [T5.chip + 0.08, ...DCHIP],
      [1.25, ...DON],
      [T5.on + 0.08, ...DON],
      [1.8, ...DGO],
      [T5.go + 0.1, ...DGO],
      [3.1, 820, 640],
      [4.15, 820, 640],
      [4.75, ...FINAL_BTN],
      [T5.final + 0.1, ...FINAL_BTN],
      [5.7, 820, 650],
    ];
    const clipStep = {
      id: 'clip',
      name: 'Talking clip',
      dur: 8.2,
      html: app(draftMenu + inspector + toast('<span class="xtw-ta1">Generating Talking clip</span><span class="xtw-ta2">Making the draft final at 1080p</span>')),
      draw(t, $) {
        preload(true);
        camera($, C5);
        made($, { voice: true, kristen: true });
        const [x, y] = along(t, CLIP_PATH);
        const n = node($, 'talk');
        const picked = t >= T5.chip;
        cls(n, 'xtw-sel', picked);
        // The inspector, for the clip picked.
        const insp = $('.xtw-insp');
        const ii = ease(t, T5.chip + 0.04, T5.chip + 0.3);
        op(insp, ii);
        css(insp, 'transform', `translateX(${((1 - ii) * 16).toFixed(1)}px)`);
        // Draft mode, on.
        const dm = $('.xtw-dmenu');
        const open = t >= T5.open && t < T5.on + 0.06;
        op(dm, open ? ease(t, T5.open, T5.open + 0.12) : 0);
        cls($('.xtw-d-on'), 'xtw-over', t >= 1.22);
        const draft = t >= T5.on;
        txt(part($, 'talk', '.xtw-draft'), draft ? 'Draft' : 'No draft');
        // The draft: running, drawing in, then playing.
        const pre = part($, 'talk', '.xtw-pre');
        const busyA = t >= T5.go && t < T5.b;
        const drafted = t >= T5.b;
        cls(n, 'xtw-busy', busyA || (t >= T5.final && t < T5.fb));
        cls(n, 'xtw-done', drafted);
        css(n, '--glow', busyA || (t >= T5.final && t < T5.fb) ? (0.75 + 0.25 * Math.sin(t * 5)).toFixed(3) : '0');
        op(part($, 'talk', '.xtw-empty'), t < T5.go ? 1 : 0);
        run($, 'talk', { t, go: T5.go, a: T5.a, b: T5.b, rate: 62 / (T5.b - T5.go), price: PRICE.draft, scope: '.xtw-run-a' });
        // Make final: the same take again at 1080p, over the draft.
        const finalRun = t >= T5.final + 0.05;
        const finished = t >= T5.fb;
        run($, 'talk', { t: finalRun ? t : -1, go: T5.final + 0.05, a: T5.fa, b: T5.fb, rate: 52 / (T5.fb - T5.final - 0.05), price: PRICE.final, scope: '.xtw-run-b' });
        op(part($, 'talk', '.xtw-run-a'), t < T5.b + 0.05 ? 1 : 0);
        op(part($, 'talk', '.xtw-run-b'), finalRun && !finished ? 1 : 0);
        const last = part($, 'talk', '.xtw-last');
        txt(last, finished ? 'Last run · 0:52 · 289 credits' : 'Last run · 1:02 · 55 credits');
        op(last, drafted ? 1 : 0);
        const vd = part($, 'talk', '.xtw-v-draft');
        const vf = part($, 'talk', '.xtw-v-final');
        op(vd, drafted && !finished ? 1 - (finalRun ? 0.55 * lin(t, T5.final + 0.05, T5.final + 0.4) : 0) : 0);
        op(vf, finished ? 1 : 0);
        clip(vd, Math.max(0, Math.min(t, T5.fa) - T5.b), drafted && !finalRun);
        clip(vf, Math.max(0, t - T5.fb), finished);
        op(part($, 'talk', '.xtw-badge'), drafted && (!finalRun || finished) ? 1 : 0);
        cls(pre, 'xtw-lit', drafted);
        threads($, t, { live: { talk: busyA || (finalRun && !finished) } });
        // The node's button and the inspector's.
        const ib = $('.xtw-insp .xtw-run');
        cls(ib, 'xtw-is-busy', busyA);
        cls(ib, 'xtw-is-add', drafted);
        spin($('.xtw-insp .xtw-b-busy .xtw-spin'), t);
        cls(insp, 'xtw-tall', drafted);
        cls(insp, 'xtw-fin', finished);
        op($('.xtw-i-b'), finished ? 1 : 0);
        const fb = $('.xtw-final');
        cls(fb, 'xtw-off', finalRun);
        spin($('.xtw-final .xtw-spin'), t);
        txt($('.xtw-st'), finished || (drafted && !finalRun) ? 'Generated' : busyA || finalRun ? 'Generating' : 'Not generated yet');
        txt($('.xtw-took'), finished ? '0:52' : '1:02');
        txt($('.xtw-cost2'), finished ? '289 credits' : '55 credits');
        txt($('.xtw-runs'), finalRun ? '2' : t >= T5.go ? '1' : '0');
        const spent = (drafted ? PRICE.draft : 0) + (finished ? PRICE.final : 0);
        left($, AFTER_LINE - spent);
        txt($('.xtw-ileft'), credits(AFTER_LINE - spent));
        // What it's doing, at the top.
        const ts = $('.xtw-toast');
        const one = t >= T5.go + 0.05 && t < T5.go + 1.4;
        const two = t >= T5.final + 0.05 && t < T5.final + 1.3;
        op(ts, one ? lin(t, T5.go + 0.05, T5.go + 0.25) * (1 - lin(t, T5.go + 1.2, T5.go + 1.4)) : two ? lin(t, T5.final + 0.05, T5.final + 0.25) * (1 - lin(t, T5.final + 1.1, T5.final + 1.3)) : 0);
        cls(ts, 'xtw-second', t >= T5.final);
        const press = within(t, [[T5.chip, T5.chip + 0.16], [T5.on, T5.on + 0.16], [T5.go, T5.go + 0.16], [T5.final, T5.final + 0.16]]);
        return { cursor: { x, y, press } };
      },
    };

    // Each step's frame as it ends, the same whichever order they play.
    return [filesStep, stillsStep, fixStep, voiceStep, clipStep];
  }

  root.TwinDemo = { steps, PRICE, AFTER_FINAL };
})(globalThis);
