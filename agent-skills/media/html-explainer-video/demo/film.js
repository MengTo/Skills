/* The skill's own film: an explainer of itself, one script drawn from one
   clock. Nothing here names a colour, a face or a shape: the look and the
   shape come in from outside, so ?look=paper&shape=9:16 needs no other code.
   Every time is a word of the voice (T.clock), from words.js. */
const { film, times, frameOf, show, ring, pointer, fit, ease, out, back, mix, pulse, typed, blink, rnd, clamp, lin, captionLines } = HTMLExplainer;
const WORDS = window.WORDS;
const T = times(WORDS);
const END = T.end + 2.4;

// The scenes' starts, each just before its first word.
const AT = {
  give: T.give - 0.12,
  makes: T.it2 - 0.12,
  look: T.your3 - 0.16,
  step1: T.heres - 0.12,
  step2: T.two - 0.12,
  step3: T.three - 0.12,
  step4: T.four - 0.12,
  camera: T.no - 0.12,
  end: T.so2 - 0.12,
};
const PARTS = [
  ['Hook', 0],
  ['Benefit', AT.give],
  ['Quick tutorial', AT.step1],
  ['Try it', AT.camera],
];
window.CHAPTERS = PARTS;
const px = (n) => n.toFixed(2) + 'px';
/** A part that's in its place from the scene's start, waiting, and comes up on its word: the frame's never empty. */
const waits = (el, t, at, wait = 0.22) => {
  const p = ease(t, at - 0.06, at + 0.18);
  el.style.visibility = 'visible';
  el.style.opacity = (wait + (1 - wait) * p).toFixed(3);
  el.style.scale = (0.985 + 0.015 * back(t, at, at + 0.3)).toFixed(4);
};
const motionDur = (el) => parseFloat(getComputedStyle(el).getPropertyValue('--x-motion-dur')) || 0.5;
const secs = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
/** The words between two named times, spoken. */
const said = (a, b) => WORDS.filter((w) => w[1] >= a - 0.001 && w[1] <= b + 0.001);

/* ------------------------------------------------------------ the hook */
// The cover: at t = 0 the title and the frame taken apart are already there.
// Each layer is laid out at the frame's own size and pushed back in 3D, never
// scaled up, so nothing goes soft.
const hook = {
  id: 'hook',
  from: 0,
  to: AT.give,
  tone: 1,
  setup($) {
    this.tags = [...document.querySelectorAll('#hook .hk-tag')].map((el) => ({ el, pin: document.querySelector(`.${el.dataset.for} .hk-pin`) }));
    this.layers = [...document.querySelectorAll('#hook .hk-layer')];
  },
  draw(t, $, f) {
    const open = ease(t, T.every - 0.1, T.every + 0.9); // further apart on "every frame"
    const flat = ease(t, T.web - 0.45, T.page + 0.2); // to the full frame on "web page"
    const form = f.tall ? 'tall' : f.wide ? 'wide' : f.square ? 'square' : 'classic';
    const seat = { classic: [90, 214, -1180], wide: [420, 120, -1120], square: [40, 230, -1500], tall: [40, 280, -1750] }[form].slice();
    // Big type at the foot: the frame taken apart sits above it, and to the side of a column it stays clear.
    if (f.at === 'bottom') {
      seat[1] = f.tall ? -470 : f.wide ? -250 : -290;
      seat[2] = f.tall ? -2500 : -1700;
    }
    if (f.at === 'side') seat[0] = -40;
    const gap = (190 + 90 * open) * (1 - flat);
    const rx = (58 - 6 * open) * (1 - flat);
    const rz = (-36 + 5 * Math.sin(t * 0.55) + 10 * open) * (1 - flat);
    const hold = 1 - flat;
    $('.hk-stack').style.transform = `translate3d(${px(seat[0] * (1 - open * 0.5) * hold)}, ${px(seat[1] * (1 - open * 0.7) * hold)}, ${((seat[2] + 90 * open) * hold).toFixed(1)}px) rotateX(${rx.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`;
    this.layers.forEach((l, i) => {
      l.style.transform = `translateZ(${(i * gap - 1.5 * gap).toFixed(2)}px)`;
    });
    // Flat labels at each layer's corner, measured from where it's drawn.
    const gone = 1 - ease(t, T.web - 0.3, T.web + 0.02);
    const stage = document.getElementById('stage').getBoundingClientRect();
    const kk = stage.width / f.W;
    for (const g of this.tags) {
      const r = g.pin.getBoundingClientRect();
      const x = (r.left - stage.left) / kk;
      const y = (r.top - stage.top) / kk;
      g.el.style.transform = `translate(${Math.min(f.W - 200, x + 14).toFixed(1)}px, ${(y - 24).toFixed(1)}px)`;
      g.el.style.opacity = gone;
      g.el.style.display = gone > 0 ? 'block' : 'none';
    }
    // The title holds from the first frame, and gives way to what the top layer says.
    const lead = ease(t, T.every - 0.3, T.every + 0.05);
    const title = $('.hk-title');
    title.style.opacity = 1 - lead;
    title.style.visibility = lead >= 1 ? 'hidden' : 'visible';
    // Big type at the foot and the layer's own words would land on each other: its words wait for "every frame".
    if (f.at === 'bottom') $('.hk-said').style.opacity = ease(t, T.every - 0.1, T.every + 0.35);

  },
};

/* ------------------------------------------------------------ give */
const give = {
  id: 'give',
  from: AT.give,
  tone: 2,
  dissolve: 0.3,
  setup($) {
    const bar = $('.gv-bar');
    const ends = [...PARTS.slice(1).map((p) => p[1]), END];
    bar.innerHTML = PARTS.map(([name, at], i) => `<div class="gv-seg" style="flex:${(ends[i] - at).toFixed(2)} 0 0"><u></u><span>${name}</span></div>`).join('');
    this.segs = [...bar.children];
  },
  draw(t, $) {
    show($('.x-head'), t, AT.give);
    waits($('#gv1'), t, T.product);
    waits($('#gv2'), t, T.feature);
    waits($('#gv3'), t, T.idea);
    show($('#gvfilm'), t, T.oneminute - 0.1);
    // Each part of the minute fills in turn as "explainer" lands.
    this.segs.forEach((s, i) => {
      const a = T.oneminute + i * 0.26;
      s.querySelector('u').style.transform = `scaleX(${out(t, a, a + 0.5).toFixed(3)})`;
    });
    $('.gv-time').textContent = t >= T.oneminute ? `${secs(END)} in all, on this film's own clock` : '';
  },
};

/* ------------------------------------------------------------ makes */
const SCRIPT_LINES = ['This video was never filmed.', 'Every frame is a web page.', 'Give your agent a product, a feature or an idea, and it makes a one-minute explainer.', 'It writes the script, makes the voice…'];
const makes = {
  id: 'makes',
  from: AT.makes,
  tone: 3,
  setup($, f) {
    $('.mk-lines').innerHTML = SCRIPT_LINES.map((_, i) => `<p data-i="${i}"></p>`).join('');
    // The voice's own words as bars: each as long as it's said.
    const bars = WORDS.slice(0, 44);
    $('.mk-wave').innerHTML = bars.map((w, i) => `<i style="height:${(18 + 62 * rnd(i, 3) * (0.5 + 0.5 * Math.min(1, (w[2] - w[1]) * 3))).toFixed(1)}%"></i>`).join('');
    this.bars = [...$('.mk-wave').children];
    const n = f.tall || (f.at === 'side' && !f.wide) ? 8 : 6;
    $('.mk-frames').innerHTML = Array.from({ length: n }, (_, i) => `<div class="mk-frame"><u></u><img src="pictures/${i % 2 ? 'box' : 'ridge'}.webp" alt=""></div>`).join('');
    this.frames = [...$('.mk-frames').children];
  },
  draw(t, $) {
    const lines = $('.mk-lines').children;
    const a = T.writes - 0.05,
      step = (T.makes2 - a) * 0.92;
    SCRIPT_LINES.forEach((l, i) => {
      const from = a + (i * step) / SCRIPT_LINES.length;
      const text = typed(l, t, from, from + step / SCRIPT_LINES.length);
      lines[i].textContent = text;
      lines[i].className = text.length && text.length < l.length ? 'cur' : '';
    });
    waits($('#mk1'), t, T.writes);
    waits($('#mk2'), t, T.makes2);
    waits($('#mk3'), t, T.draws);
    const played = lin(t, T.makes2, T.draws + 0.4) * this.bars.length;
    this.bars.forEach((b, i) => b.classList.toggle('on', i < played));
    this.frames.forEach((fr, i) => show(fr, t, T.draws + i * 0.1, Infinity, { dur: 0.3 }));
    for (const [id, at] of [['#mk-w1', T.script], ['#mk-w2', T.voice], ['#mk-w3', T.scene]]) {
      const lit = ease(t, at - 0.08, at + 0.12);
      $(id).style.color = lit > 0.5 ? 'var(--x-ink)' : 'var(--x-dim)';
    }
    show($('.mk-head'), t, AT.makes);
  },
};

/* ------------------------------------------------------------ the look */
// The same three lines, in three looks side by side, each coming in by its own
// look's motion: the scene says when, the look says how.
const look = {
  id: 'look',
  from: AT.look,
  setup($, f) {
    this.strips = [...document.querySelectorAll('#look .lk-strip')].map((el) => {
      const cs = getComputedStyle(el);
      el.querySelector('.lk-name').textContent = cs.getPropertyValue('--x-name-face').trim().replace(/"/g, '');
      const words = [...el.querySelectorAll('.lk-word')];
      const room = el.clientWidth * 0.84;
      const size = Math.min(...words.map((w) => { w.style.fontSize = ''; return fit(w, room); }), f.tall ? 150 : 130);
      words.forEach((w) => (w.style.fontSize = size.toFixed(2) + 'px'));
      return { el, words, chips: el.querySelector('.lk-chips'), name: el.querySelector('.lk-name'), ground: el.querySelector('.x-ground') };
    });
  },
  draw(t, $, f) {
    this.strips.forEach((s, i) => {
      const lag = i * 0.05;
      const m = { dur: Math.min(0.3, motionDur(s.el)) };
      show(s.words[0], t, T.your3 + lag, T.your4 - 0.24, m);
      show(s.words[1], t, T.your4 + lag, T.your5 - 0.24, m);
      show(s.words[2], t, T.your5 + lag, Infinity, m);
      show(s.chips, t, T.colours, T.your5 - 0.2);
      show(s.name, t, T.your3 + lag + 0.2);
    });
  },
};

/* ------------------------------------------------------------ one */
const ASK = 'Use $html-explainer-video to explain our new scheduling feature in one minute, in our own look.';
const step1 = {
  id: 'step1',
  from: AT.step1,
  tone: 1,
  draw(t, $) {
    show($('.x-head'), t, T.one - 0.1);
    const text = typed(ASK, t, T.one + 0.1, T.explain + 0.1);
    const ask = text.replace('$html-explainer-video', '<code>$html-explainer-video</code>').replace(/\$html-explainer-vide?o?$/, '');
    const caret = blink(t) ? '<s></s>' : '<s style="opacity:0"></s>';
    $('#s1-ask').innerHTML = ask + caret;
    const send = T.explain + 0.28;
    const press = t >= send && t < send + 0.16;
    $('#s1-send').style.scale = press ? 0.94 : 1;
    ring($('#s1-send'), t, send - 0.2, Infinity, 5);
  },
};

/* ------------------------------------------------------------ two */
// A real page from the first frame, never a wireframe: its heading and its
// button are what the look is read from, and they're ringed as they're named.
const step2 = {
  id: 'step2',
  from: AT.step2,
  tone: 2,
  setup($) {
    const cs = getComputedStyle(document.documentElement);
    const v = (k) => cs.getPropertyValue(k).trim().replace(/"/g, '');
    // What the look really says, read off the page.
    const rows = [
      ['Type', v('--x-name-face'), 'type'],
      ['Ground', v('--x-ground'), 'c'],
      ['Ink', v('--x-ink'), 'c'],
      ['Accent', v('--x-accent'), 'c'],
      ['Corners', `${parseFloat(v('--x-radius'))} px`, 'x'],
      ['Motion', v('--x-name-moves'), 'x'],
    ];
    $('.s2-rows').innerHTML = rows
      .map(([k, val, kind]) => `<div data-k="${kind}"><dt>${k}</dt><dd>${kind === 'c' ? `<i style="background:${val}"></i>` : ''}${val}</dd></div>`)
      .join('');
    this.rows = [...$('.s2-rows').children];
    this.type = this.rows[0];
    this.colours = this.rows.slice(1, 4);
    this.chips = [...$('#s2-styles').children];
  },
  draw(t, $) {
    show($('#s2-h1'), t, T.two, T.or2 - 0.26);
    show($('#s2-h2'), t, T.or2, T.it4 - 0.26);
    show($('#s2-h3'), t, T.it4);
    $('#s2-url').textContent = typed('yoursite.com', t, T.point - 0.1, T.site);
    // Each style in its own look, in its own way.
    this.chips.forEach((c, i) => show(c, t, T.name + i * 0.12, T.it4 - 0.18, { dur: 0.3 }));
    const read = ease(t, T.it4 - 0.2, T.it4 + 0.35);
    $('#s2-tokens').style.flexGrow = read.toFixed(3);
    $('#s2-tokens').style.display = read > 0.001 ? 'flex' : 'none';
    $('.s2-pic').style.gap = read > 0.001 ? '' : '0';
    show($('#s2-tokens'), t, T.it4 - 0.1);
    this.rows.forEach((r, i) => show(r, t, T.reads + i * 0.09, Infinity, { dur: 0.3 }));
    // The type: its row and the page's heading. The colours: their rows and its button.
    ring(this.type, t, T.type - 0.06, T.colours2 - 0.1, 3);
    ring($('#s2-title'), t, T.type - 0.06, T.colours2 - 0.1, 6);
    this.colours.forEach((r) => ring(r, t, T.colours2 - 0.06, T.sets - 0.05, 3));
    ring($('#s2-btn'), t, T.colours2 - 0.06, T.sets - 0.05, 6);
    // On "sets the look" the whole page takes a beat.
    const beat = pulse(t, T.sets, 0.06, 0.45);
    $('.s2-page').style.filter = beat > 0.02 ? `brightness(${(1 + beat * 0.16).toFixed(3)})` : 'none';
  },
};

/* ------------------------------------------------------------ three */
const step3 = {
  id: 'step3',
  from: AT.step3,
  tone: 3,
  setup($, f) {
    this.line = said(T.the7, T.word);
    $('#s3-line').innerHTML = this.line.map((w) => `<span class="x-w">${w[0]}</span> `).join('');
    this.spans = [...$('#s3-line').children];
    // Every word as a block on a ruler, at its real time.
    const rule = $('#s3-rule');
    // The ruler holds the clause being said, large enough to read.
    this.ruled = said(T.so, T.word);
    const a = this.ruled[0][1],
      b = this.ruled[this.ruled.length - 1][2];
    this.span = [a, b];
    const pct = (x) => ((x - a) / (b - a)) * 100;
    rule.innerHTML =
      this.ruled.map((w) => `<div class="s3-block" style="left:${pct(w[1]).toFixed(2)}%;width:calc(${(pct(w[2]) - pct(w[1])).toFixed(2)}% - 4px)">${w[0].replace(/[.,]/g, '')}</div>`).join('') +
      this.ruled.filter((_, i) => i % 2 === 0).map((w, i) => `<span class="s3-tick" style="left:${pct(w[1]).toFixed(2)}%">${w[1].toFixed(2)}</span>`).join('') +
      '<i class="s3-head"></i>';
    this.head = rule.querySelector('.s3-head');
    this.blocks = [...rule.querySelectorAll('.s3-block')];
    this.code = `T.clock = ${T.clock.toFixed(2)}`;
    this.code2 = `T.word = ${T.word.toFixed(2)}`;
  },
  draw(t, $) {
    show($('.x-head'), t, T.three);
    show($('#s3-line'), t, T.three);
    show($('#s3-rule'), t, T.three + 0.2);
    this.spans.forEach((s, i) => {
      const w = this.line[i];
      s.className = 'x-w' + (t >= w[1] && t < w[2] + 0.06 ? ' now' : t >= w[1] ? ' said' : '');
    });
    const [a, b] = this.span;
    this.head.style.left = (clamp((t - a) / (b - a)) * 100).toFixed(3) + '%';
    show($('#s3-code'), t, T.clock);
    $('#s3-code').textContent = t >= T.word ? this.code2 : this.code;
    // The block lands on its word.
    const last = this.blocks[this.blocks.length - 1];
    ring(last, t, T.word, Infinity, 3);
  },
};

/* ------------------------------------------------------------ four */
// Every lane is this film's own: its scenes at their lengths, the voice's words,
// the music, and each sound where the plan puts it.
const step4 = {
  id: 'step4',
  from: AT.step4,
  tone: 1,
  setup($) {
    const lanes = $('.s4-lanes');
    const names = ['Scenes', 'Voice', 'Captions', 'Music', 'Sound'];
    lanes.innerHTML = names.map((n) => `<div class="s4-lane" data-n="${n}"><label>${n}</label></div>`).join('') + '<i class="s4-head"></i>';
    const lane = (n) => lanes.querySelector(`[data-n="${n}"]`);
    const pct = (x) => (x / END) * 100;
    const SCENES = window.FILM_SCENES;
    lane('Scenes').innerHTML += SCENES.map((s) => `<div class="s4-clip scene" style="left:${pct(s.a).toFixed(2)}%;width:calc(${(pct(s.b) - pct(s.a)).toFixed(2)}% - 3px)"><img src="pictures/${SCENES.indexOf(s) % 2 ? 'box' : 'ridge'}.webp" alt=""></div>`).join('');
    lane('Voice').innerHTML += `<div class="s4-wave">${WORDS.map((w, i) => `<i style="height:${(14 + 74 * rnd(i, 5)).toFixed(0)}%"></i>`).join('')}</div>`;
    const caps = captionLines(WORDS, 30);
    lane('Captions').innerHTML += caps.map((c) => `<div class="s4-clip words" style="left:${pct(c.from).toFixed(2)}%;width:calc(${(pct(c.to) - pct(c.from)).toFixed(2)}% - 2px)"></div>`).join('');
    lane('Music').innerHTML += `<div class="s4-clip music" style="left:0;width:100%"></div>`;
    const cues = window.SFX || [];
    lane('Sound').innerHTML += cues.map((c) => `<i class="s4-tick" style="left:${pct(c[0]).toFixed(2)}%"></i>`).join('');
    this.scenes = [...lane('Scenes').querySelectorAll('.s4-clip')];
    this.wave = lane('Voice').querySelector('.s4-wave');
    this.caps = [...lane('Captions').querySelectorAll('.s4-clip')];
    this.music = lane('Music').querySelector('.s4-clip');
    this.ticks = [...lane('Sound').querySelectorAll('.s4-tick')];
    this.laneHead = lanes.querySelector('.s4-head');
  },
  draw(t, $) {
    show($('.x-head'), t, T.four);
    const n = this.scenes.length;
    this.scenes.forEach((c, i) => show(c, t, T.renders + (i * (T.builds - 0.2 - T.renders)) / n));
    show(this.wave, t, T.builds - 0.05);
    this.caps.forEach((c, i) => show(c, t, T.captions + i * 0.018));
    show(this.music, t, T.music);
    this.ticks.forEach((c, i) => show(c, t, T.sound + i * 0.008));
    // The playhead sweeps the whole film as it comes together.
    const head = mix(t, T.builds, END - 0.4 - (END - AT.camera), 0, 1);
    this.laneHead.style.left = `calc(172px + (100% - 192px) * ${head.toFixed(4)})`;
    this.laneHead.style.visibility = t >= T.builds ? 'visible' : 'hidden';
  },
};

/* ------------------------------------------------------------ the camera */
const camera = {
  id: 'camera',
  from: AT.camera,
  tone: 2,
  setup($, f) {
    const mini = $('#cm-mini');
    const r = f.pic;
    const room = f.tall ? r.h - 120 : r.h;
    const cols = f.tall ? r.w : r.w - 280;
    const k = Math.min(cols / f.W, room / f.H);
    mini.style.width = f.W * k + 'px';
    mini.style.height = f.H * k + 'px';
    this.k = k;
    this.off = frameOf(f.shape, false, f.at, f.headRows, f.margin);
    this.on = frameOf(f.shape, true, f.at, f.headRows, f.margin);
  },
  draw(t, $, f) {
    show($('#cm-h1'), t, T.no, T.if - 0.3);
    show($('#cm-h2'), t, T.turn - 0.1);
    const on = ease(t, T.on2, T.on2 + 0.5);
    const k = this.k;
    const g = (a, b) => a + (b - a) * on;
    const h = $('.cm-h'),
      w = $('.cm-win'),
      A = this.off,
      B = this.on;
    h.style.left = px(A.head.x * k);
    h.style.top = px(A.head.y * k);
    h.style.width = px(A.head.w * k);
    h.style.fontSize = px(58 * k);
    w.style.left = px(g(A.pic.x, B.pic.x) * k);
    w.style.top = px(g(A.pic.y, B.pic.y) * k);
    w.style.width = px(g(A.pic.w, B.pic.w) * k);
    w.style.height = px(g(A.pic.h, B.pic.h) * k);
    const slot = $('#cm-slot');
    slot.style.left = px(B.cam.x * k);
    slot.style.top = px(B.cam.y * k);
    slot.style.width = px(B.cam.w * k);
    slot.style.height = px(B.cam.h * k);
    slot.style.opacity = ease(t, T.on2 - 0.02, T.on2 + 0.3);
    slot.style.scale = 0.8 + 0.2 * back(t, T.on2, T.on2 + 0.4);
    $('#cm-toggle').style.background = t >= T.on2 ? 'var(--x-accent)' : '';
    $('#cm-toggle u').style.left = px(3 + 40 * out(t, T.on2, T.on2 + 0.2));
    pointer($('#cm-ptr'), t, [[AT.camera, AT.camera, f.W - 120, f.H - 160], [T.turn - 0.3, T.on2 - 0.3, '#cm-toggle', 0.5, 0.6], [T.on2 + 0.5, T.make, f.W - 90, f.H - 130]], [T.on2]);
  },
};

/* ------------------------------------------------------------ the end */
const end = {
  id: 'end',
  from: AT.end,
  tone: 3,
  dissolve: 0.3,
  setup($, f) {
    const room = f.W - f.m * 2;
    $('.en-title').style.whiteSpace = f.tall ? 'normal' : 'nowrap';
    if (!f.tall) fit($('.en-title'), room);
    fit($('#en-at'), room - 64);
    this.tiles = [...document.querySelectorAll('#end .en-tile')];
  },
  draw(t, $) {
    show($('#en-try'), t, AT.end + 0.02, T.html - 0.3);
    show($('#en-name'), t, T.html - 0.04);
    // The looks land on the words after its name, then where to get it.
    const on = [T.the12, T.skill, T.is2, T.free];
    this.tiles.forEach((el, i) => show(el, t, on[i], Infinity, { dur: 0.35 }));
    show($('#en-at'), t, T.at2 - 0.05, Infinity, { dur: 0.35 });
  },
};

const SCENES = [hook, give, makes, look, step1, step2, step3, step4, camera, end];
window.FILM_SCENES = SCENES.map((s, i) => ({ id: s.id, a: s.from, b: SCENES[i + 1] ? SCENES[i + 1].from : END }));

/* The sound cues: t is the frame the thing happens (scripts/sfx.mjs gives each
   its take, its sync point and its level). About one a second, on what you see. */
window.SFX = [
  [T.every, 'whoosh-soft'], [T.frame, 'tap'], [T.web - 0.3, 'whoosh-heavy'], [T.page + 0.2, 'sub'],
  [T.product, 'pop'], [T.feature, 'pop'], [T.idea, 'pop'], [T.oneminute, 'whoosh-soft'], [T.explainerEnd, 'tap'],
  [T.writes, 'pop-soft'], [T.makes2, 'pop-soft'], [T.draws, 'pop-soft'], [T.scene, 'tap'],
  [T.your3, 'whoosh-soft'], [T.your4, 'whoosh-soft'], [T.your5, 'whoosh-soft'], [T.motionEnd, 'ting'],
  [T.one, 'click'], [T.one + 0.15, 'typing', 1.5], [T.explain + 0.28, 'key'],
  [T.two, 'click'], [T.point, 'typing', 0.6], [T.name, 'pop-soft'], [T.reads, 'pop-soft'], [T.type, 'tap'], [T.colours2, 'tap'], [T.sets, 'whoosh-soft'],
  [T.three, 'click'], [T.check, 'tap'], [T.clock, 'pop'], [T.word, 'ting'],
  [T.four, 'click'], [T.renders, 'pop-soft'], [T.builds, 'whoosh-soft'], [T.captions, 'pop-soft'], [T.music, 'pop-soft'], [T.sound, 'pop-soft'],
  [T.no, 'tap'], [T.on2, 'click'], [T.make, 'whoosh-soft'],
  [T.so2, 'whoosh-soft'], [T.html, 'sub'], [T.the12, 'pop-soft'], [T.skill, 'pop-soft'], [T.is2, 'pop-soft'], [T.free, 'pop'], [T.at2, 'whoosh-soft'], [T.fil2, 'ting'],
].filter((c) => Number.isFinite(c[0]));

film({
  shape: '4:3',
  look: 'night',
  voice: 'voice.mp3',
  words: WORDS,
  end: END,
  scenes: SCENES,
  capsOff: [[0, AT.give], [AT.look, AT.step1], [T.the7, AT.step4], [AT.end, END + 0.1]],
  // With the camera on: off for the hook, the looks side by side and the end card, which fill the frame.
  cameraPlan: [[0, 'hidden'], [AT.give, 'full'], [T.explainer, 'corner'], [AT.look, 'hidden'], [AT.step1, 'corner'], [T.so2, 'full'], [T.html, 'hidden']],
});
