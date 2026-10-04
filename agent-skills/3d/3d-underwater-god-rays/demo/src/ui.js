// Demo controller. The aquarium is created and stepped exactly as Blue Hour
// does it: a fixed 2048×1440 render (1600×1125 below 800px), cover-fitted,
// stepped at 30 fps, with a hovered camera orbit.
(() => {
'use strict';
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const $ = (id) => document.getElementById(id);
const loading = $('loading'), status = $('status'), play = $('play'), sun = $('sun'), sunAngle = $('sun-angle');
let aquarium = null, playing = !motion.matches, pending = 0, dirty = true, last = 0;
let hoverX = 0, hoverY = 0, targetHoverX = 0, targetHoverY = 0;

// The page's sun: (.25, .40, -1), about 21° above the horizon. The slider
// changes elevation and keeps the heading.
const heading = (() => { const x = .25, z = -1, l = Math.hypot(x, z); return { x: x / l, z: z / l }; })();
function setSun(degrees) {
  const e = degrees * Math.PI / 180;
  aquarium.sunDirection.set(heading.x * Math.cos(e), Math.sin(e), heading.z * Math.cos(e)).normalize();
  sunAngle.value = Math.round(degrees) + '°';
  sun.style.setProperty('--sun-progress', ((degrees - sun.min) / (sun.max - sun.min) * 100).toFixed(1) + '%');
  sun.setAttribute('aria-valuetext', Math.round(degrees) + ' degrees above the horizon');
  dirty = true;
}

const messages = {
  pattern: ['Sparse peaks: the march keeps distinct shafts with dark water between them.',
            'Ridge web: the same march averages the ridges into flat haze.'],
  ripples: ['Ripples inside the march: fine streaks run along each shaft.',
            'Ripples painted on screen: the water reads as a pool floor.'],
};
function setCompare(kind, value) {
  const compare = aquarium.light.uniforms.uCompare.value;
  if (kind === 'pattern') compare.x = value; else compare.y = value;
  document.querySelectorAll(`[data-compare="${kind}"]`).forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.value === value)));
  status.textContent = messages[kind][value];
  dirty = true;
}

function updatePlay() {
  play.setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation');
  play.querySelector('svg').innerHTML = playing ? '<path d="M8 5v14M16 5v14"/>' : '<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>';
  $('play-label').textContent = playing ? 'Living ocean' : 'Paused';
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = last ? Math.min((now - last) / 1000, .06) : 0;
  last = now;
  if (document.hidden || !aquarium) return;
  const ease = motion.matches ? 1 : 1 - Math.exp(-dt * 4.5);
  hoverX += ((motion.matches ? 0 : targetHoverX) - hoverX) * ease;
  hoverY += ((motion.matches ? 0 : targetHoverY) - hoverY) * ease;
  const settling = Math.abs(hoverX - targetHoverX) + Math.abs(hoverY - targetHoverY) > .0005;
  aquarium.setPointer(hoverX, hoverY);
  if (playing) {
    pending += dt;
    if (pending < 1 / 30) return;
    aquarium.render(Math.min(pending, .1));
    pending = 0;
  } else if (dirty || settling) {
    aquarium.render(0);
  }
  dirty = false;
}

// A rounded lens displacement field bends the backdrop at the glass edge.
function buildLens() {
  const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 96;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  const pixels = ctx.createImageData(320, 96);
  for (let y = 0; y < 96; y++) for (let x = 0; x < 320; x++) {
    const px = x - 159.5, py = y - 47.5, ox = Math.max(Math.abs(px) - 112, 0), oy = Math.max(Math.abs(py), 0);
    const length = Math.hypot(ox, oy), t = Math.min(Math.max(-(length - 47.5) / 17, 0), 1), bend = Math.sin(t * Math.PI) * .25;
    const nx = length ? Math.sign(px) * ox / length : 0, ny = length ? Math.sign(py) * oy / length : 0, i = (y * 320 + x) * 4;
    pixels.data[i] = Math.round((.5 + nx * bend) * 255); pixels.data[i + 1] = Math.round((.5 + ny * bend) * 255);
    pixels.data[i + 2] = 128; pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  $('glass-displacement').setAttribute('href', canvas.toDataURL());
}

// Short, eased pointer response on the glass rims; no idle animation.
function bindGlassRims() {
  document.querySelectorAll('.liquid-glass').forEach((glass) => {
    const reset = () => ['--mx', '--my', '--glass-angle'].forEach((name) => glass.style.removeProperty(name));
    glass.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch' || motion.matches) return;
      const r = glass.getBoundingClientRect();
      const x = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1), y = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1);
      glass.style.setProperty('--mx', (x * 100).toFixed(2) + '%');
      glass.style.setProperty('--my', (y * 100).toFixed(2) + '%');
      glass.style.setProperty('--glass-angle', (115 + x * 85 + y * 22).toFixed(2) + 'deg');
    });
    glass.addEventListener('pointerleave', reset);
    glass.addEventListener('pointercancel', reset);
  });
}

function bindControls() {
  document.querySelectorAll('[data-compare]').forEach((b) => b.addEventListener('click', () => setCompare(b.dataset.compare, +b.dataset.value)));
  sun.addEventListener('input', () => setSun(+sun.value));
  play.addEventListener('click', () => { playing = !playing; pending = 0; updatePlay(); dirty = true; });
  const focusView = (clean) => {
    document.body.classList.toggle('clean', clean);
    (clean ? $('restore-ui') : $('focus-view')).focus();
    status.textContent = clean ? 'Controls hidden. Press H to show them.' : 'Controls shown.';
  };
  $('focus-view').addEventListener('click', () => focusView(true));
  $('restore-ui').addEventListener('click', () => focusView(false));
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.target.matches('input')) return;
    if (e.code === 'Space' && !e.target.matches('button')) { e.preventDefault(); play.click(); }
    if (e.key.toLowerCase() === 'h') focusView(!document.body.classList.contains('clean'));
  });
  // Hover orbits with the mouse; on touch, dragging across the water does the same.
  const aim = (e) => {
    if (motion.matches) return;
    if (e.pointerType !== 'mouse' && e.buttons === 0) return;
    targetHoverX = Math.min(Math.max(e.clientX / innerWidth * 2 - 1, -1), 1);
    targetHoverY = Math.min(Math.max(1 - e.clientY / innerHeight * 2, -1), 1);
  };
  document.addEventListener('pointermove', aim, { passive: true });
  document.addEventListener('pointerdown', aim, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { targetHoverX = targetHoverY = 0; });
  motion.addEventListener('change', (e) => { playing = !e.matches; targetHoverX = targetHoverY = 0; updatePlay(); dirty = true; });
  document.addEventListener('visibilitychange', () => { last = 0; pending = 0; });
}

function boot() {
  try {
    const wide = (innerWidth || document.documentElement.clientWidth || 1440) > 800;
    aquarium = window.createAquariumWallpaper({ manual: true, width: wide ? 2048 : 1600, height: wide ? 1440 : 1125, pixelRatio: 1, count: 2200, immersiveStudio: true });
    if (!aquarium || !aquarium.canvas) throw new Error('WebGL2 is unavailable.');
    $('ocean-backdrop').appendChild(aquarium.canvas);
    if (aquarium.foregroundCanvas) {
      const front = document.createElement('div');
      front.id = 'ocean-foreground'; front.setAttribute('aria-hidden', 'true');
      front.appendChild(aquarium.foregroundCanvas);
      document.body.insertBefore(front, document.querySelector('main'));
    }
    aquarium.canvas.setAttribute('aria-hidden', 'true');
    document.querySelector('main').setAttribute('aria-describedby', 'mechanism');
    setSun(+sun.value);
    aquarium.render(0);                       // a composed frame before the loop starts
    loading.classList.add('done');
    window.__demo = { aquarium, setCompare, setSun, render: (dt = 0) => aquarium.render(dt) };
  } catch (error) {
    console.error('Underwater God Rays could not start', error);
    loading.textContent = 'This demo needs WebGL2. Try a current browser.';
    return;
  }
  buildLens(); bindGlassRims(); bindControls(); updatePlay();
  requestAnimationFrame(frame);
}
boot();
})();
