// Frost growth: a dendritic frost pattern grown on the CPU the way real frost grows.
//
// Stems leave a seed point and race outward; behind each tip, barbs leave at about 60 degrees
// (ice's hexagonal habit), and finer sub-barbs leave the barbs at 60 degrees again. Every tip
// is an event in one time-ordered queue, so whatever reaches a patch of ground first claims it:
// a tip that runs into another crystal stops there. That competition is what packs real frost
// into feathers instead of a hatch of crossing lines.
//
// Every point carries the time the growth front reached it, so a shader can draw the pattern
// growing out from the seed, each barb from its junction, without ever re-rolling a shape.
//
//   const F = growFrost({ seed: 7, origin: [1.1, 0], dir: [1, 0], radius: 5.6, area: [-5, -6.5, 8, 6.5] });
//   F.seg: Float32Array, 12 floats a segment:
//          x0, z0, x1, z1, t0, t1, hw0, hw1, level, rand, along0, along1
//   F.count: segments; F.spine: [[x, z, t], ...] points of the main forward stem; F.duration: last arrival

export function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function growFrost({
  seed = 7, origin = [0, 0], dir = [1, 0], radius = 5.5, area = [-6, -6, 6, 6], speed = 2.6,
  stems = 11, maxSegments = 160000, density = 1, symmetric = 0, fan = 1,
} = {}) {
  const rnd = mulberry32(seed);
  const R = (a, b) => a + (b - a) * rnd();
  const [ox, oz] = origin;
  const dir0 = Math.atan2(dir[1], dir[0]);

  // ---- spatial hash over the area: cells hold linked lists of points
  const CELL = 0.03;
  const gx0 = area[0], gz0 = area[1];
  const GW = Math.ceil((area[2] - area[0]) / CELL), GH = Math.ceil((area[3] - area[1]) / CELL);
  const head = new Int32Array(GW * GH).fill(-1);
  const MAXPTS = maxSegments + 4096;
  const nxt = new Int32Array(MAXPTS), PX = new Float32Array(MAXPTS), PZ = new Float32Array(MAXPTS), PB = new Int32Array(MAXPTS), PL = new Uint8Array(MAXPTS);
  let np = 0;
  function addPoint(x, z, b, level) {
    if (np >= MAXPTS) return;
    const cx = Math.floor((x - gx0) / CELL), cz = Math.floor((z - gz0) / CELL);
    if (cx < 0 || cz < 0 || cx >= GW || cz >= GH) return;
    const c = cz * GW + cx;
    PX[np] = x; PZ[np] = z; PB[np] = b; PL[np] = level; nxt[np] = head[c]; head[c] = np; np++;
  }
  // is (x, z) within `clear` of a point of another branch at a level <= maxLevel?
  function blocked(x, z, b, parent, clear, maxLevel, junction) {
    const r = Math.ceil(clear / CELL);
    const cx = Math.floor((x - gx0) / CELL), cz = Math.floor((z - gz0) / CELL);
    const c2 = clear * clear;
    for (let j = cz - r; j <= cz + r; j++) {
      if (j < 0 || j >= GH) continue;
      for (let i = cx - r; i <= cx + r; i++) {
        if (i < 0 || i >= GW) continue;
        for (let p = head[j * GW + i]; p >= 0; p = nxt[p]) {
          const pb = PB[p];
          if (pb === b || PL[p] > maxLevel) continue;
          if (pb === parent && junction) continue;            // leaving its parent: the junction is not a collision
          const dx = PX[p] - x, dz = PZ[p] - z;
          if (dx * dx + dz * dz < c2) return true;
        }
      }
    }
    return false;
  }

  // ---- per-level growth rules
  // step (m), speed (share of the stem speed), clearance (m), half-width at start / end (m), checks levels up to
  const LV = [
    { step: 0.024, clear: 0.055, hw: [0.0016, 0.0009], sees: 1 },
    { step: 0.014, clear: 0.0105, hw: [0.0011, 0.0005], sees: 2 },
    { step: 0.008, clear: 0.0062, hw: [0.0005, 0.00028], sees: 2 },
  ];

  const branches = [];
  const heap = [];   // binary heap of branch indices by tip time
  const less = (a, b) => branches[a].t < branches[b].t;
  function push(i) { heap.push(i); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (!less(heap[k], heap[p])) break; [heap[k], heap[p]] = [heap[p], heap[k]]; k = p; } }
  function pop() {
    const top = heap[0], last = heap.pop();
    if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && less(heap[l], heap[m])) m = l; if (r < heap.length && less(heap[r], heap[m])) m = r; if (m === k) break; [heap[k], heap[m]] = [heap[m], heap[k]]; k = m; } }
    return top;
  }
  function spawn(o) {
    const B = Object.assign({ id: branches.length, len: 0, steps: 0, alive: true, side: rnd() < 0.5 ? 1 : -1, curl: 0 }, o);
    B.nextChild = B.level === 0 ? R(0.02, 0.05) : B.level === 1 ? R(0.012, 0.03) : 1e9;
    B.nextFork = B.level === 0 ? R(0.35, 0.8) : 1e9;
    B.rand = rnd();
    branches.push(B); push(B.id);
    return B;
  }

  // ---- seed stems: a fan weighted forward, a few round the back
  const fanAngles = [];
  if (symmetric > 0) {
    for (let k = 0; k < symmetric; k++) fanAngles.push(dir0 + (k / symmetric) * Math.PI * 2);
  } else {
    fanAngles.push(dir0);                                        // the spine: the frost line the ice will follow
    const spread = [0.42, -0.5, 0.95, -1.05, 1.55, -1.6, 2.2, -2.3, 2.9, -2.75, 3.14];
    for (let k = 0; k < stems - 1 && k < spread.length; k++) fanAngles.push(dir0 + spread[k] * fan + R(-0.12, 0.12));
  }
  fanAngles.forEach((a, k) => {
    const back = Math.abs(Math.atan2(Math.sin(a - dir0), Math.cos(a - dir0)));   // 0 forward .. PI behind
    const spine = k === 0 && !symmetric;
    spawn({
      level: 0, parent: -1, x: ox + Math.cos(a) * 0.012, z: oz + Math.sin(a) * 0.012, a, t: R(0, 0.04),
      speed: speed * (spine ? 1.1 : R(0.8, 1.02)),
      maxLen: spine ? radius * 1.02 : radius * R(0.6, 0.95) * (back > 2.2 ? 0.42 : back > 1.4 ? 0.7 : 1),
      hwK: spine ? 1.15 : R(0.85, 1.05), spine, maxL1: R(0.16, 0.3), seedStem: true, path: k,
    });
  });

  const seg = new Float32Array(maxSegments * 12), segB = new Int32Array(maxSegments);
  let ns = 0;
  const spinePts = [], paths = fanAngles.map(() => []), tips = [];
  let tMax = 0;

  while (heap.length && ns < maxSegments) {
    const B = branches[pop()];
    if (!B.alive) continue;
    const L = LV[B.level];
    // steer: stems drift toward the outward radial and wander slowly; barbs stay nearly straight
    let a = B.a;
    if (B.level === 0) {
      const ra = B.spine ? dir0 : Math.atan2(B.z - oz, B.x - ox);
      let da = ra - a; da = Math.atan2(Math.sin(da), Math.cos(da));
      B.curl += R(-0.012, 0.012); B.curl *= 0.9;
      a += da * (B.spine ? 0.05 : B.fork ? 0.012 : 0.04) + B.curl + R(-0.012, 0.012);
    } else {
      a += R(-0.05, 0.05) * (B.level === 1 ? 1 : 1.4);
    }
    const step = L.step * R(0.8, 1.2);
    const x1 = B.x + Math.cos(a) * step, z1 = B.z + Math.sin(a) * step;
    const r1 = Math.hypot(x1 - ox, z1 - oz);
    if (x1 < area[0] + 0.05 || z1 < area[1] + 0.05 || x1 > area[2] - 0.05 || z1 > area[3] - 0.05) { B.alive = false; continue; }
    if (B.len + step > B.maxLen) { B.alive = false; if (B.level < 2 && B.len > 0.06) tips.push([B.x, B.z, B.t, B.level, B.len, B.id]); continue; }
    const nearSeed = B.spine || (B.seedStem && B.len < 0.22);   // the seed stems all leave one point: they cannot block each other there
    const junction = B.len < (B.level === 0 && B.parent >= 0 ? 0.1 : L.clear * 1.6);   // leaving its parent through the parent's own barbs
    if (!nearSeed && !(junction && B.level === 0 && B.parent >= 0) && blocked(x1, z1, B.id, B.parent, L.clear / Math.sqrt(density), L.sees, junction)) { B.alive = false; continue; }
    // speed: stems slow as the front spreads (a racing start, a settling edge)
    const sp = B.level === 0 ? B.speed * (1.25 - 0.55 * Math.min(1, r1 / radius)) : B.speed;
    const t1 = B.t + step / sp;
    const u0 = B.len / B.maxLen, u1 = (B.len + step) / B.maxLen;
    const hw = (u) => (L.hw[0] + (L.hw[1] - L.hw[0]) * u) * B.hwK;
    const o = ns * 12;
    seg[o] = B.x; seg[o + 1] = B.z; seg[o + 2] = x1; seg[o + 3] = z1;
    seg[o + 4] = B.t; seg[o + 5] = t1; seg[o + 6] = hw(u0); seg[o + 7] = hw(u1);
    seg[o + 8] = B.level; seg[o + 9] = B.rand; seg[o + 10] = B.len; seg[o + 11] = B.len + step;
    segB[ns] = B.id;
    ns++;
    addPoint(x1, z1, B.id, B.level);
    if (B.spine) spinePts.push([x1, z1, t1]);
    if (B.path !== undefined) paths[B.path].push([x1, z1, t1]);
    B.x = x1; B.z = z1; B.a = a; B.t = t1; B.len += step; B.steps++;
    tMax = Math.max(tMax, t1);

    // children: barbs off stems, sub-barbs off barbs, alternating sides at about 60 degrees
    if (B.level < 2 && B.len >= B.nextChild) {
      const lv = B.level + 1;
      const paired = B.level === 0 && rnd() < 0.55;
      const sides = paired ? [1, -1] : [B.side];
      for (const s of sides) {
        const ang = a + s * R(0.98, 1.12);
        const maxLen = lv === 1 ? B.maxL1 * (0.25 + 0.95 * Math.pow(rnd(), 1.6)) * (B.spine ? 0.9 : 1) * Math.min(1, 0.35 + B.len * 1.6) : R(0.012, 0.042) * Math.min(1, 0.4 + (B.maxLen - B.len) * 7);
        if (lv === 1 && !symmetric && rnd() < 0.055 * (B.spine ? 0.35 : 1) && B.len > 0.2) {
          // now and then a barb runs on and becomes a feather of its own: the pattern branches like real frost
          spawn({ level: 0, parent: B.id, x: x1, z: z1, a: a + s * R(0.6, 0.95), t: t1 + R(0.02, 0.06), speed: B.speed * R(0.55, 0.8), maxLen: R(0.35, 1.3), hwK: B.hwK * R(0.6, 0.75), spine: false, fork: true, maxL1: B.maxL1 * R(0.5, 0.8) });
          continue;
        }
        spawn({ level: lv, parent: B.id, x: x1, z: z1, a: ang, t: t1 + R(0.01, 0.05) * lv, speed: lv === 1 ? R(0.85, 1.25) : R(0.32, 0.5), maxLen, hwK: B.hwK * R(0.85, 1.1), rx: x1, rz: z1, sgn: s, frac: B.len / B.maxLen });
      }
      if (!paired) B.side = -B.side;
      B.nextChild = B.len + (B.level === 0 ? R(0.018, 0.03) : R(0.009, 0.016)) / Math.sqrt(density);
    }
    // forks: stems split now and then so the fan fills
    if (B.level === 0 && B.len >= B.nextFork && !symmetric) {
      B.nextFork = B.len + R(0.28, 0.65);
      if (rnd() < 0.8 && r1 < radius * 0.88) {
        const s = rnd() < 0.5 ? 1 : -1;
        spawn({ level: 0, parent: B.id, x: x1, z: z1, a: a + s * R(0.45, 0.8), t: t1 + R(0.01, 0.04), speed: B.speed * R(0.82, 0.98), fork: true, maxLen: Math.max(0.3, (B.maxLen - B.len) * R(0.55, 0.95)), hwK: B.hwK * 0.85, spine: false, maxL1: B.maxL1 * R(0.8, 1.1) });
      }
    }
    push(B.id);
  }
  // The growth ran at ice's 60 degrees, so the crystals competed for space the way they do. Now lean every side
  // branch toward its tip (about 40 degrees) and shorten the ones near the tip, rotating and scaling each about its
  // root, its own side branches carried with it. Stems are untouched, so the spine and everything placed on it
  // stays exactly where it grew.
  const M = new Array(branches.length);
  for (const B of branches) {
    if (B.level === 0 || B.parent < 0 || B.rx === undefined) { M[B.id] = B.level === 0 ? null : (M[B.parent] || null); continue; }
    const P = M[B.parent];
    const d = -B.sgn * (B.level === 1 ? 0.36 : 0.28), k = B.level === 1 ? Math.min(1.05, 0.5 + 0.75 * (1 - B.frac)) : 1;
    const c = Math.cos(d) * k, s = Math.sin(d) * k;
    // p -> r + [c -s; s c](p - r), then the parent's transform
    let m = [c, -s, s, c, B.rx - c * B.rx + s * B.rz, B.rz - s * B.rx - c * B.rz];
    if (P) m = [P[0] * m[0] + P[1] * m[2], P[0] * m[1] + P[1] * m[3], P[2] * m[0] + P[3] * m[2], P[2] * m[1] + P[3] * m[3], P[0] * m[4] + P[1] * m[5] + P[4], P[2] * m[4] + P[3] * m[5] + P[5]];
    M[B.id] = m;
  }
  const ap = (m, x, z) => [m[0] * x + m[1] * z + m[4], m[2] * x + m[3] * z + m[5]];
  for (let i = 0; i < ns; i++) {
    const m = M[segB[i]]; if (!m) continue;
    const o = i * 12;
    const [ax, az] = ap(m, seg[o], seg[o + 1]), [bx, bz] = ap(m, seg[o + 2], seg[o + 3]);
    seg[o] = ax; seg[o + 1] = az; seg[o + 2] = bx; seg[o + 3] = bz;
  }
  for (const T of tips) { const m = M[T[5]]; if (m) { const [x, z] = ap(m, T[0], T[1]); T[0] = x; T[1] = z; } }
  return { seg: seg.subarray(0, ns * 12), count: ns, spine: spinePts, paths, tips, duration: tMax, branches: branches.length };
}
