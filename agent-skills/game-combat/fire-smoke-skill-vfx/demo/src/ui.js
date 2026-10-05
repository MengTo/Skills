(() => {
  const S = window.stage;
  const app = document.getElementById('app');
  const note = document.getElementById('note');
  const live = document.getElementById('live');
  const playBtn = document.getElementById('play');
  const speed = document.getElementById('speed');
  const speedOut = document.getElementById('speedOut');
  const hide = document.getElementById('hide');
  const capBeat = document.getElementById('capBeat');
  const capText = document.getElementById('capText');

  const NOTES = {
    'noise:advected': 'Rising: the turbulence leaves the root slowly, then accelerates and stretches as it climbs, and a drifting warp deforms it on the way up.',
    'noise:scrolled': 'Scrolled: the same noise slides up at one speed. The flame turns into a texture moving through a fixed shape.',
    'smoke:over': 'Over: the smoke is drawn premultiplied over the frame, so charcoal stays black above the fire and warm where the fire lights it.',
    'smoke:additive': 'Additive: black adds nothing, so the column vanishes and only its lit edges remain, as grey haze.',
    'flashes:full': 'Full: the hit holds the frame and inverts it round the burst in two tones, never more than three times a second.',
    'flashes:safe': 'Safe: no inversions and no white frames. The hit dims the frame instead. This is the default under reduced motion.',
  };

  function press(group, btn) {
    for (const b of group.querySelectorAll('button')) b.setAttribute('aria-pressed', String(b === btn));
  }
  for (const btn of document.querySelectorAll('.pills button')) {
    btn.addEventListener('click', () => {
      const { opt, val } = btn.dataset;
      press(btn.parentElement, btn);
      S.setOption(opt, val);
      note.textContent = NOTES[`${opt}:${val}`];
      live.textContent = `${btn.closest('[role=group]').querySelector('.label').textContent}: ${btn.textContent}`;
    });
  }
  if (S.fx.options.flashes === 'safe') press(document.querySelector('[data-opt="flashes"]').parentElement, document.querySelector('[data-opt="flashes"][data-val="safe"]'));

  const beatButtons = [...document.querySelectorAll('.beats button')];
  function markBeat() {
    const current = S.loop ? 'all' : S.beat;
    for (const b of beatButtons) b.setAttribute('aria-pressed', String(b.dataset.beat === current));
  }
  function setPaused(p) {
    S.setPaused(p);
    playBtn.dataset.paused = String(p);
    playBtn.setAttribute('aria-label', p ? 'Play' : 'Pause');
  }
  function playBeat(name) {
    S.play(name);
    if (S.paused) setPaused(false);
    markBeat();
  }
  for (const b of beatButtons) b.addEventListener('click', () => playBeat(b.dataset.beat));
  S.onBeat((name, beat) => {
    capBeat.textContent = S.loop ? 'Full cast' : beat.title;
    capText.textContent = beat.caption;
    if (name !== 'idle') live.textContent = `${beat.title}: ${beat.caption}`;
    markBeat();
  });

  playBtn.addEventListener('click', () => setPaused(!S.paused));
  speed.addEventListener('input', () => {
    const v = Number(speed.value);
    S.setTimeScale(v);
    speedOut.textContent = `${v.toFixed(2)}×`;
  });
  hide.addEventListener('click', () => {
    const h = !app.classList.contains('hidden');
    app.classList.toggle('hidden', h);
    hide.setAttribute('aria-pressed', String(h));
  });

  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = e.target.tagName;
    if (e.key === ' ' && tag === 'BUTTON') return;
    if (tag === 'INPUT' && e.key.startsWith('Arrow')) return;
    const n = '012345'.indexOf(e.key);
    if (n >= 0) { playBeat(n === 0 ? 'all' : S.ORDER[n - 1]); return; }
    if (e.key === ' ') { e.preventDefault(); setPaused(!S.paused); }
    else if (e.key === 'h' || e.key === 'H') hide.click();
  });

  setPaused(S.paused);
  const beat = S.BEATS[S.beat];
  if (beat) { capBeat.textContent = S.loop ? 'Full cast' : beat.title; capText.textContent = beat.caption; }
  markBeat();
  if (!S.loop && S.paused) { capBeat.textContent = 'Still'; capText.textContent = 'The fire pillar at its height'; }
})();
