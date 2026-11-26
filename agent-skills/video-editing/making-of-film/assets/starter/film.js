/* The making-of film starter's timeline. Every scene is drawn from t (the film's seconds) and every time is a word
   of the voice (T.made is when it says "made"), so a new voice means a new words.js and a re-render, no scene
   change. Word names: X.times() lower-cases and strips each word, a repeat gets a number (the 3rd "in" is T.in3).
   T is strict here: a misspelt word name throws at once instead of hiding an element for ever. */
(function () {
  const X = HTMLExplainer, M = MakingOf;
  const { show, ease, typed, blink } = X;
  const T0 = X.times(window.WORDS);
  const T = new Proxy(T0, { get: (o, k) => { if (typeof k === 'string' && !(k in o)) throw new Error('no word T.' + k); return o[k]; } });
  const COLD = T.i; // the voice's first word: the cold open runs until then

  const scenes = [];
  const add = (id, from, draw, o = {}) => scenes.push({ id, from, draw, ...o });

  // 0 · cold open: real footage as frame folders (M.montage), the badge leaves before the voice comes in
  add('cold', 0, (t, $) => { $('#cold-badge').style.opacity = 1 - ease(t, COLD - 0.5, COLD - 0.1); }, { noexit: true, nodrift: true });
  // 1 · the hook: each word of "Made in three days" on its spoken word
  add('hook', COLD, (t, $) => {
    M.words($('#hk-days'), t, T.made - 0.05, { times: [T.made - 0.05, T.in - 0.05, T.three - 0.08, T.days - 0.08] });
    M.words($('#hk-tab'), t, T.it - 0.1, { gap: 0.06 });
  }, { nodrift: true });
  // 2 · the promise: rows there from the start, each lit on its word, with the time its chapter starts
  add('promise', T.in3 - 0.3, (t, $) => {
    M.words($('#pr-h'), t, T.in3 - 0.3);
    const rows = M.kids($('#pr-rows')), on = [T.stack, T.steps, T.falls - 0.3], at = [T.the5, T.step, T.so];
    rows.forEach((li, i) => {
      show(li, t, T.in3 + 0.15 + i * 0.08);
      li.style.setProperty('--on', ease(t, on[i] - 0.15, on[i] + 0.25).toFixed(3));
      li.lastChild.textContent = M.mmss(at[i]);
    });
  });
  // 3 · the stack: each card lands on its name, lit while it's said
  add('stack', T.the5, (t, $) => {
    M.words($('#st-h'), t, T.the5);
    M.litCards(M.kids($('#st-grid')), t, [T.claude, T.fil, T.three2, T.end + 9]);
  });
  // 4 · step title
  add('s1a', T.step, (t, $) => M.stepTitle($('.steptitle'), t, T.step, T.get2 - 0.12));
  // 5 · his real prompt, typed on its words, the whole of it held before the cut
  const P = 'keep working until 8 out of 10';
  add('s1b', T.one2, (t, $) => {
    M.panel($('#s1b-win'), t, T.one2 - 0.1);
    $('#s1b-qt').textContent = typed(P, t, T.keep - 0.05, T.ten + 0.1);
    $('#s1b-c').style.opacity = t < T.ten + 0.1 ? 1 : blink(t);
  });
  // 6 · where it falls short
  add('short', T.so, (t, $) => M.words($('#sh-h'), t, T.not - 0.05));
  // 7 · what I'd keep, and the end card
  add('end', T.the7, (t, $) => {
    M.words($('#end-h'), t, T.go - 0.1);
    M.each(M.kids($('#end-links')), t, T.its - 0.1, 0.3);
  });

  // What each stretch is, for the edit's chapters and the description (scripts/film-facts.mjs prints them).
  window.CHAPTERS = [[0, 'Cold open'], [COLD, 'Made in three days'], [T.in3 - 0.3, 'What you get'], [T.the5, 'The stack'], [T.step, 'Step 1: Get it playable'], [T.so, 'Where it falls short'], [T.the7, "What I'd keep"]];

  // The camera at key places only, about a quarter of the film (Meng, 18 Nov: "only put cameras at key places
  // 25% of the video"): where he is large (the intro, each step's title, the verdict, what I'd keep) and the end
  // card; hidden everywhere else. A move that grows the camera at a cut starts at the cut (G), never over the
  // scene that's leaving. To and from hidden it fades over its glide (the forked engine).
  const G = 0.54;
  window.CAMERA = [[0, 'hidden'], [T.in3 + G, 'half'], [T.the5, 'hidden'], [T.step + G, 'half'], [T.one2, 'hidden'], [T.so + G, 'half'], [T.not + 0.1, 'hidden'], [T.the7 + G, 'half'], [T.its, 'corner']];

  // His twin in the camera (assets/twin.js → film/twin.js: window.TWIN = [{ from, to, off, dir, n, fps, fx, fy, fs }]):
  // the render's frames, exactly as HeyGen made them (no grade, relight or sharpening, Meng 19 Nov), framed on his
  // face in every layout so a glide between layouts is one move. Without twin.js the engine's labelled stand-in shows.
  if (window.TWIN && window.TWIN.length) {
    window.CAM_HTML = '<img id="cam-img" alt=""><i class="cam-frame"></i>';
    window.CAM_DRAW = (el, c, t) => {
      const img = el.firstChild, k = window.TWIN.find((s) => t >= s.from && t < s.to) || window.TWIN[t < window.TWIN[0].from ? 0 : window.TWIN.length - 1];
      const z = (1 + 0.8 * Math.max(0, Math.min(1, (620 - c.w) / 320))) / (k.fs || 1); // tighter in the corner circle
      const h = Math.max(c.h, (c.w * 9) / 16) * Math.max(z, 1), w = (h * 16) / 9;
      img.style.cssText = `position:absolute;width:${w.toFixed(2)}px;height:${h.toFixed(2)}px;left:${Math.min(0, Math.max(c.w - w, c.w / 2 - w * (k.fx ?? 0.5))).toFixed(2)}px;top:${Math.min(0, Math.max(c.h - h, c.h * 0.44 - h * (k.fy ?? 0.4))).toFixed(2)}px;max-width:none`;
      const n = Math.max(1, Math.min(k.n, Math.floor(((k.off || 0) + Math.max(0, t - k.from)) * (k.fps || 25)) + 1));
      const src = k.dir + String(n).padStart(4, '0') + '.jpg';
      if (img.dataset.src === src) return null;
      img.dataset.src = src; img.src = src;
      return img.decode().catch(() => {});
    };
  }

  window.T = T0;
  const END = T.end + 2.4;
  X.film({ words: window.WORDS, end: END, shape: '16:9', look: 'project', camera: true, cameraPlan: window.CAMERA, scenes, loop: false, over: M.over });
})();
