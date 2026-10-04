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
    'lightning:reroll': 'Re-rolled: every bolt gets a new shape each 1/30 s and lives two or three ticks, stepping down in brightness. It crackles.',
    'lightning:tween': 'Tweened: the same bolts morph smoothly from shape to shape and fade evenly. Lightning turns into wriggling noodles.',
    'afterimage:over': 'Smoke over: the afterimage is drawn premultiplied over the frame, so black stays black and swallows the light behind it.',
    'afterimage:additive': 'Additive: black adds nothing, so the afterimage vanishes down to its lit edges, and the dust turns the ground grey.',
    'orb:lens': 'Air lens: the orb is mostly empty. It bends the background, and its light lives in the rim and in filaments spinning around the punch axis.',
    'orb:glow': 'Glow ball: an opaque bright sphere with no refraction. It reads as a light bulb, not as air forced into a ball.',
    'flashes:full': 'Full: hits hold the frame, invert it in two tones and flash, never more than three times a second.',
    'flashes:safe': 'Safe: no inversions and no white frames. Hits dim the frame instead. This is the default under reduced motion.',
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
  if (S.fx.options.flashes === 'safe') press(document.querySelector('[data-opt="flashes"]').parentElement, document.querySelector('[data-val="safe"]'));

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
  const b = S.loop ? 'all' : S.beat;
  const beat = S.BEATS[S.beat];
  if (beat) { capBeat.textContent = S.loop ? 'Full cast' : beat.title; capText.textContent = beat.caption; }
  markBeat();
  if (b !== 'all' && S.paused) { capBeat.textContent = 'Still'; capText.textContent = 'Charge held at full pressure'; }
})();
