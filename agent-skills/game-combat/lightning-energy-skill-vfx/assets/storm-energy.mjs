// Storm energy skill VFX: white-blue high-pressure lightning, a compressed orb that
// bends the air behind it, black afterimage smoke, three-layer air bursts, orange
// sparks, debris that lands, and impact frames (hold, negative, flash, shake, fisheye).
//
// Pass in your own THREE (r160+). Nothing else is imported.
//
//   const fx = createStormEnergy(THREE, { renderer, scene, camera });
//   fx.setSize(width * dpr, height * dpr, dpr);
//   const orb = fx.createOrb({ radius: 0.45 });
//   frame: const simDt = fx.update(realDt); ...move orb, push trails, spawn bursts...; fx.render();
//
// Every effect runs on the module's clock: fx.impact({ hold }) freezes it, fx.ramp()
// slows it, and lightning keeps re-rolling on its own floor so slow motion stays alive.

export const DISTORT_LAYER = 1;

export const NOISE_GLSL = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm2(vec3 p){return .5*snoise(p)+.25*snoise(p*2.03+17.1);}
float fbm3(vec3 p){float a=.5,s=0.;for(int i=0;i<3;i++){s+=a*snoise(p);p=p*2.03+17.1;a*=.5;}return s;}
float fbm4(vec3 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*snoise(p);p=p*2.03+17.1;a*=.5;}return s;}
`;

// Four point lights the effect throws onto the world: orb, impact, bolt flash, blast.
// Add ENERGY_LIGHTS_GLSL to your ground and prop shaders, merge fx.lightUniforms into
// their uniforms, and add energyLight(...) to their colour.
// Heat left in the ground by impacts: up to 4 spots (x, z, radius, heat). Multiply your
// ground's own crack mask by groundHeat(worldXZ) and add it as emission.
export const GROUND_HEAT_GLSL = /* glsl */`
uniform vec4 uHeat[4];
float groundHeat(vec2 p){
  float h = 0.;
  for (int i = 0; i < 4; i++) { float d = length(p - uHeat[i].xy) / max(uHeat[i].z, 1e-3); h += uHeat[i].w * exp(-d * d * 2.2); }
  return h;
}`;

export const ENERGY_LIGHTS_GLSL = /* glsl */`
uniform vec3 uLightPos[4];
uniform vec3 uLightCol[4];
vec3 energyLight(vec3 P, vec3 N, vec3 V, vec3 albedo, float rough){
  vec3 acc = vec3(0.);
  for (int i = 0; i < 4; i++) {
    vec3 L = uLightPos[i] - P; float d2 = max(dot(L, L), 1e-4); L *= inversesqrt(d2);
    float att = 1. / (1. + d2 * 1.4);
    float ndl = max(dot(N, L), 0.);
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.), mix(90., 6., rough)) * (1. - rough) * 2.2;
    acc += uLightCol[i] * att * ndl * (albedo + spec);
  }
  return acc;
}`;

// Screen-space ribbon: each point is two vertices pushed apart across the projected
// path, so a bolt keeps a crisp core however far away it is (aData.w = minimum px).
const RIBBON_VERT = /* glsl */`
attribute vec3 aPrev;
attribute vec3 aNext;
attribute vec4 aData;   // side (-1|1), along or age (0..1), width (world), min width (px)
attribute vec2 aExtra;  // intensity or distance, seed
uniform vec2 uResolution;
varying vec4 vData;
varying vec2 vExtra;
varying float vPx;
void main(){
  mat4 vp = projectionMatrix * viewMatrix;
  vec4 c = vp * vec4(position, 1.);
  vec4 a = vp * vec4(aPrev, 1.);
  vec4 b = vp * vec4(aNext, 1.);
  vec2 hr = uResolution * .5;
  vec2 sa = a.xy / max(a.w, 1e-3) * hr;
  vec2 sb = b.xy / max(b.w, 1e-3) * hr;
  vec2 d = sb - sa; float L = length(d);
  d = L > 1e-4 ? d / L : vec2(1., 0.);
  vec2 n = vec2(-d.y, d.x);
  float px = max(aData.z * projectionMatrix[1][1] * hr.y / max(c.w, 1e-3), aData.w);
  c.xy += n * aData.x * px * .5 / hr * c.w;
  vData = aData; vExtra = aExtra; vPx = px;
  gl_Position = c;
}`;

const FS_VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createStormEnergy(THREE, { renderer, scene, camera, seed = 7 } = {}) {
  const V3 = THREE.Vector3;
  const rnd = mulberry32(seed);
  const R = (a = 0, b = 1) => a + (b - a) * rnd();
  const UP = new V3(0, 1, 0), X = new V3(1, 0, 0), ZAXIS = new V3(0, 0, 1);
  const _a = new V3(), _b = new V3(), _c = new V3(), _d = new V3(), _e = new V3(), _u = new V3(), _w = new V3();
  const _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _s = new V3(), _col = new THREE.Color();

  const palette = {
    core: new THREE.Color(1.0, 1.0, 1.0),          // bolt and orb core, linear HDR before gain
    glow: new THREE.Color(0.30, 0.60, 1.00),       // white-blue halo
    rim: new THREE.Color(0.55, 0.80, 1.00),        // orb fresnel rim
    smoke: new THREE.Color(0.010, 0.011, 0.016),   // afterimage black, faintly blue
    ember: new THREE.Color(0.25, 0.55, 1.00),      // lightning caught in the smoke's torn edge
    dust: new THREE.Color(0.040, 0.042, 0.048),    // ground dust, low, cool and only a little lighter than the ground
  };

  const options = {
    lightning: 'reroll',   // 'reroll' (new shape every arc tick) | 'tween' (the noodle failure)
    afterimage: 'over',    // 'over' (premultiplied, darkens) | 'additive' (the vanishing failure)
    orb: 'lens',           // 'lens' (refracts the air) | 'glow' (the light-bulb failure)
    flashes: 'full',       // 'full' | 'safe' (no inversions or white frames)
    shake: 1, fisheye: 1,  // set both to 0 under prefers-reduced-motion
    arcHz: 30,             // lightning re-roll rate
    arcFloor: 0.35,        // lightning never slows below this share of real time
  };

  const group = new THREE.Group(); group.name = 'storm-energy';
  scene.add(group);
  const res = new THREE.Vector2(1, 1);
  let dpr = 1;
  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: res },
    uDpr: { value: 1 },
  };

  // ---------------------------------------------------------------- clock
  const clock = { sim: 0, real: 0, hold: 0, base: 1, arcAcc: 0, arcPhase: 0, rampFrom: 1, rampTo: 1, rampT: 1, rampDur: 0, rampValue: 1 };
  function ramp(to, seconds = 0.4) {
    clock.rampFrom = clock.rampValue; clock.rampTo = to; clock.rampT = 0; clock.rampDur = Math.max(seconds, 1e-4);
  }
  const effectiveScale = () => (clock.hold > 0 ? 0 : clock.base * clock.rampValue);

  // ---------------------------------------------------------------- energy lights
  const lightPos = [new V3(), new V3(), new V3(), new V3()];
  const lightCol = [new V3(), new V3(), new V3(), new V3()];
  const lightUniforms = { uLightPos: { value: lightPos }, uLightCol: { value: lightCol } };
  const lights = [0, 1, 2, 3].map(() => ({ energy: 0, decay: 10, color: new THREE.Color(), warm: 0 }));
  function flashLight(slot, pos, energy, decay, warm = 0) {
    const L = lights[slot];
    if (energy >= L.energy * 0.6) lightPos[slot].copy(pos);
    L.energy = Math.max(L.energy, energy); L.decay = decay; L.warm = warm;
  }
  const WARM = new THREE.Color(1.0, 0.55, 0.22);
  const heat = [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 1, 0));
  const heatUniforms = { uHeat: { value: heat } };
  function addHeat(pos, radius, amount = 1) {
    let slot = heat[0];
    for (const h of heat) if (h.w < slot.w) slot = h;
    slot.set(pos.x, pos.z, radius, amount);
  }

  // ---------------------------------------------------------------- lightning
  const MAXP = 65, MAXBOLTS = 220;
  const bolts = [];
  for (let i = 0; i < MAXBOLTS; i++) bolts.push({ alive: false, n: 0, pts: new Float32Array(MAXP * 3), from: new Float32Array(MAXP * 3), gen: { a: new V3(), b: new V3(), bend: new V3(), hasBend: false, levels: 4, jag: 0.2 }, anchor: null, width: 0.04, minPx: 8, I: 1, life: 2, age: 0, seed: 0, branch: false });
  const SA = new Float32Array(MAXP * 3), SB = new Float32Array(MAXP * 3);
  let boltFlashEnergy = 0;

  function basis(dir) {
    const ref = Math.abs(dir.y) < 0.9 ? UP : X;
    _u.crossVectors(dir, ref).normalize(); _w.crossVectors(dir, _u);
  }
  // Midpoint displacement: each level halves the segments' offset, so the bolt has
  // big kinks and fine crackle at once. A fixed bend bows it (orb surface arcs).
  function shape(dst, gen) {
    const { a, b, levels, jag } = gen;
    let src = SA, n = 2;
    src[0] = a.x; src[1] = a.y; src[2] = a.z; src[3] = b.x; src[4] = b.y; src[5] = b.z;
    _d.subVectors(b, a); const len = _d.length() || 1e-4; _d.divideScalar(len); basis(_d);
    let amp = len * jag;
    for (let l = 0; l < levels; l++) {
      const out = src === SA ? SB : SA; let m = 0;
      for (let i = 0; i < n - 1; i++) {
        const i3 = i * 3;
        out[m++] = src[i3]; out[m++] = src[i3 + 1]; out[m++] = src[i3 + 2];
        let mx = (src[i3] + src[i3 + 3]) * 0.5, my = (src[i3 + 1] + src[i3 + 4]) * 0.5, mz = (src[i3 + 2] + src[i3 + 5]) * 0.5;
        if (l === 0 && gen.hasBend) { mx += gen.bend.x; my += gen.bend.y; mz += gen.bend.z; }
        const th = rnd() * 6.2832, g = (rnd() + rnd() + rnd() - 1.5) / 1.5;
        const cu = Math.cos(th) * amp * g, cw = Math.sin(th) * amp * g;
        out[m++] = mx + _u.x * cu + _w.x * cw; out[m++] = my + _u.y * cu + _w.y * cw; out[m++] = mz + _u.z * cu + _w.z * cw;
      }
      const l3 = (n - 1) * 3;
      out[m++] = src[l3]; out[m++] = src[l3 + 1]; out[m++] = src[l3 + 2];
      n = n * 2 - 1; src = out; amp *= 0.5;
    }
    dst.set(src.subarray(0, n * 3));
    return n;
  }
  function freeBolt() {
    for (let i = 0; i < MAXBOLTS; i++) if (!bolts[i].alive) return bolts[i];
    let oldest = bolts[0];
    for (let i = 1; i < MAXBOLTS; i++) if (bolts[i].age / bolts[i].life > oldest.age / oldest.life) oldest = bolts[i];
    return oldest;
  }
  // a, b: world points, or offsets from `anchor` (a Vector3 the bolt follows, e.g. orb.position).
  function bolt(a, b, { levels = 5, jag = 0.2, width = 0.04, minPx = 8, intensity = 1, life = 2, branches = 1, anchor = null, bend = null } = {}) {
    const B = freeBolt();
    B.alive = true; B.branch = false; B.anchor = anchor; B.width = width; B.minPx = minPx; B.I = intensity;
    B.life = options.lightning === 'tween' ? life * 5 : life; B.age = 0; B.seed = rnd();
    B.gen.a.copy(a); B.gen.b.copy(b); B.gen.levels = Math.min(levels, 6); B.gen.jag = jag;
    B.gen.hasBend = !!bend; if (bend) B.gen.bend.copy(bend);
    B.n = shape(B.pts, B.gen); B.from.set(B.pts.subarray(0, B.n * 3));
    const len = a.distanceTo(b);
    boltFlashEnergy += len * intensity;
    if (len * intensity > 0.6) { _a.addVectors(a, b).multiplyScalar(0.5); if (anchor) _a.add(anchor); flashLight(2, _a, Math.min(len * intensity * 2.2, 26), 18); }
    // Forks leave from the first two-thirds, thinner and dimmer, and taper to nothing.
    for (let k = 0; k < branches; k++) {
      if (B.n < 9 || rnd() < 0.25) continue;
      const i = Math.floor(B.n * R(0.18, 0.66)), i3 = i * 3;
      const F = freeBolt(); if (F === B) continue;
      _b.set(B.pts[i3], B.pts[i3 + 1], B.pts[i3 + 2]);
      _c.set(B.pts[i3 + 3] - B.pts[i3 - 3], B.pts[i3 + 4] - B.pts[i3 - 2], B.pts[i3 + 5] - B.pts[i3 - 1]).normalize();
      _d.set(R(-1, 1), R(-1, 1), R(-1, 1)).multiplyScalar(0.7); _c.add(_d).normalize();
      const fl = len * R(0.22, 0.45);
      F.alive = true; F.branch = true; F.anchor = anchor; F.width = width * 0.55; F.minPx = minPx * 0.55; F.I = intensity * 0.7;
      F.life = B.life; F.age = 0; F.seed = rnd();
      F.gen.a.copy(_b); F.gen.b.copy(_b).addScaledVector(_c, fl); F.gen.levels = Math.max(3, B.gen.levels - 1); F.gen.jag = jag * 1.1; F.gen.hasBend = false;
      F.n = shape(F.pts, F.gen); F.from.set(F.pts.subarray(0, F.n * 3));
    }
  }
  const STEP_I = [1.0, 0.55, 0.28, 0.14, 0.07];
  function boltIntensity(B) {
    if (options.lightning === 'tween') return B.I * Math.max(0, 1 - (B.age + clock.arcPhase) / B.life);
    return B.I * STEP_I[Math.min(B.age, 4)] * (0.75 + 0.25 * ((B.seed * 7.31 + B.age * 0.37) % 1));
  }

  const boltCap = MAXBOLTS * MAXP * 2;
  const boltGeo = new THREE.BufferGeometry();
  const bPos = new Float32Array(boltCap * 3), bPrev = new Float32Array(boltCap * 3), bNext = new Float32Array(boltCap * 3);
  const bData = new Float32Array(boltCap * 4), bExtra = new Float32Array(boltCap * 2);
  const bIndex = new Uint32Array(MAXBOLTS * (MAXP - 1) * 6);
  const dyn = (arr, n) => new THREE.BufferAttribute(arr, n).setUsage(THREE.DynamicDrawUsage);
  boltGeo.setAttribute('position', dyn(bPos, 3)); boltGeo.setAttribute('aPrev', dyn(bPrev, 3)); boltGeo.setAttribute('aNext', dyn(bNext, 3));
  boltGeo.setAttribute('aData', dyn(bData, 4)); boltGeo.setAttribute('aExtra', dyn(bExtra, 2)); boltGeo.setIndex(dyn(bIndex, 1));
  const boltMat = new THREE.ShaderMaterial({
    uniforms: { uResolution: uniforms.uResolution, uDpr: uniforms.uDpr, uCore: { value: new V3(1, 1, 1) }, uGlow: { value: new V3() } },
    vertexShader: RIBBON_VERT,
    fragmentShader: /* glsl */`
      uniform vec3 uCore; uniform vec3 uGlow; uniform float uDpr;
      varying vec4 vData; varying vec2 vExtra; varying float vPx;
      void main(){
        float px = abs(vData.x) * vPx * .5;
        float coreR = max(.85 * uDpr, vPx * .065);
        float core = exp(-(px * px) / (coreR * coreR));
        float glow = exp(-px / (vPx * .17)) * (1. - abs(vData.x));
        gl_FragColor = vec4((uCore * core * 7. + uGlow * glow * 1.5) * vExtra.x, 1.);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const boltMesh = new THREE.Mesh(boltGeo, boltMat); boltMesh.frustumCulled = false; boltMesh.renderOrder = 30;
  group.add(boltMesh);

  function writeRibbonVertex(arrs, v, x, y, z, px, py, pz, nx, ny, nz, side, d1, d2, d3, e0, e1) {
    const v3 = v * 3, v4 = v * 4, v2 = v * 2;
    arrs.pos[v3] = x; arrs.pos[v3 + 1] = y; arrs.pos[v3 + 2] = z;
    arrs.prev[v3] = px; arrs.prev[v3 + 1] = py; arrs.prev[v3 + 2] = pz;
    arrs.next[v3] = nx; arrs.next[v3 + 1] = ny; arrs.next[v3 + 2] = nz;
    arrs.data[v4] = side; arrs.data[v4 + 1] = d1; arrs.data[v4 + 2] = d2; arrs.data[v4 + 3] = d3;
    arrs.extra[v2] = e0; arrs.extra[v2 + 1] = e1;
  }
  const boltArrs = { pos: bPos, prev: bPrev, next: bNext, data: bData, extra: bExtra };
  const TMP = new Float32Array(MAXP * 3);
  function buildBolts() {
    let v = 0, idx = 0;
    const tween = options.lightning === 'tween';
    const ph = clock.arcPhase * clock.arcPhase * (3 - 2 * clock.arcPhase);
    for (const B of bolts) {
      if (!B.alive) continue;
      const I = boltIntensity(B); if (I <= 0.002) continue;
      const n = B.n, P = tween ? TMP : B.pts;
      if (tween) for (let i = 0; i < n * 3; i++) TMP[i] = B.from[i] + (B.pts[i] - B.from[i]) * ph;
      const ox = B.anchor ? B.anchor.x : 0, oy = B.anchor ? B.anchor.y : 0, oz = B.anchor ? B.anchor.z : 0;
      const base = v;
      for (let i = 0; i < n; i++) {
        const i3 = i * 3, p3 = Math.max(i - 1, 0) * 3, n3 = Math.min(i + 1, n - 1) * 3;
        const t = i / (n - 1);
        const taper = B.branch ? 0.12 + 0.88 * Math.pow(1 - t, 0.8) : 1 - 0.4 * t;
        const w = B.width * taper, mp = B.minPx * taper;
        for (let s = -1; s <= 1; s += 2) {
          writeRibbonVertex(boltArrs, v++, P[i3] + ox, P[i3 + 1] + oy, P[i3 + 2] + oz,
            P[p3] + ox, P[p3 + 1] + oy, P[p3 + 2] + oz, P[n3] + ox, P[n3 + 1] + oy, P[n3 + 2] + oz,
            s, t, w, mp * dpr, I, B.seed);
        }
      }
      for (let i = 0; i < n - 1; i++) {
        const k = base + i * 2;
        bIndex[idx++] = k; bIndex[idx++] = k + 2; bIndex[idx++] = k + 1;
        bIndex[idx++] = k + 1; bIndex[idx++] = k + 2; bIndex[idx++] = k + 3;
      }
    }
    for (const name of ['position', 'aPrev', 'aNext', 'aData', 'aExtra']) { const at = boltGeo.getAttribute(name); at.needsUpdate = true; at.clearUpdateRanges?.(); at.addUpdateRange?.(0, v * at.itemSize); }
    boltGeo.index.needsUpdate = true; boltGeo.index.clearUpdateRanges?.(); boltGeo.index.addUpdateRange?.(0, idx);
    boltGeo.setDrawRange(0, idx);
  }

  // ---------------------------------------------------------------- afterimage smoke trails
  const trails = [];
  const MAXTP = 200;
  function createTrail({ width = 0.6, life = 0.8, spacing = 0.06, drift = null, jitter = 0.35, shards = 0.5, billows = 0.45, opacity = 1 } = {}) {
    const T = {
      width, life, spacing, jitter, shards, billows, opacity, active: true, drift: drift ? drift.clone() : new V3(),
      n: 0, p: new Float32Array(MAXTP * 3), v: new Float32Array(MAXTP * 3), born: new Float32Array(MAXTP), dist: new Float32Array(MAXTP),
      shed: new Uint8Array(MAXTP), seed: rnd() * 50, total: 0,
      push(pos) {
        if (!T.active) return;
        const n = T.n;
        if (n >= 2) {
          const j = (n - 2) * 3;
          const dx = pos.x - T.p[j], dy = pos.y - T.p[j + 1], dz = pos.z - T.p[j + 2];
          if (dx * dx + dy * dy + dz * dz < T.spacing * T.spacing) { T.p[(n - 1) * 3] = pos.x; T.p[(n - 1) * 3 + 1] = pos.y; T.p[(n - 1) * 3 + 2] = pos.z; return; }
        }
        if (n >= MAXTP) T.drop(1);
        const k = T.n, k3 = k * 3;
        if (k > 0) { const j = (k - 1) * 3; T.total += Math.hypot(pos.x - T.p[j], pos.y - T.p[j + 1], pos.z - T.p[j + 2]); }
        T.p[k3] = pos.x; T.p[k3 + 1] = pos.y; T.p[k3 + 2] = pos.z;
        // jitter varies smoothly with distance along the trail: random per point folds the ribbon into shards
        const ph = T.total * 1.6 + T.seed;
        T.v[k3] = T.drift.x + (Math.sin(ph) + 0.5 * Math.sin(ph * 2.3 + 1)) * T.jitter;
        T.v[k3 + 1] = T.drift.y + (Math.sin(ph * 1.3 + 2) * 0.6 + 0.3) * T.jitter;
        T.v[k3 + 2] = T.drift.z + (Math.sin(ph * 0.9 + 4) + 0.5 * Math.sin(ph * 1.9 + 3)) * T.jitter;
        T.born[k] = clock.sim; T.dist[k] = T.total; T.shed[k] = 0; T.n++;
      },
      drop(count) {
        T.p.copyWithin(0, count * 3, T.n * 3); T.v.copyWithin(0, count * 3, T.n * 3);
        T.born.copyWithin(0, count, T.n); T.dist.copyWithin(0, count, T.n); T.shed.copyWithin(0, count, T.n);
        T.n -= count;
      },
      stop() { T.active = false; },
      restart() { T.active = true; T.n = 0; },
    };
    trails.push(T);
    return T;
  }
  function updateTrails(dt) {
    const t = clock.sim;
    for (let ti = trails.length - 1; ti >= 0; ti--) {
      const T = trails[ti];
      let drop = 0;
      while (drop < T.n && t - T.born[drop] > T.life) drop++;
      if (drop) T.drop(drop);
      if (!T.active && T.n === 0 && T.disposable) { trails.splice(ti, 1); continue; }
      if (dt <= 0) continue;
      const damp = Math.exp(-1.6 * dt);
      for (let i = 0; i < T.n - (T.active ? 1 : 0); i++) {
        const i3 = i * 3, age = (t - T.born[i]) / T.life;
        const x = T.p[i3], y = T.p[i3 + 1], z = T.p[i3 + 2];
        // a slow curl so old smoke rolls instead of sliding
        const wx = Math.sin(y * 2.1 + t * 1.3 + T.seed), wy = Math.sin(z * 1.7 + t * 1.1 + T.seed * 2), wz = Math.sin(x * 1.9 + t * 1.5 + T.seed * 3);
        T.p[i3] += (T.v[i3] + wx * 0.5 * age) * dt; T.p[i3 + 1] += (T.v[i3 + 1] + wy * 0.35 * age) * dt; T.p[i3 + 2] += (T.v[i3 + 2] + wz * 0.5 * age) * dt;
        T.v[i3] *= damp; T.v[i3 + 1] *= damp; T.v[i3 + 2] *= damp;
        if (T.p[i3 + 1] < 0.05) T.p[i3 + 1] = 0.05;
        // shred: torn pieces leave the ribbon as it erodes
        if (!T.shed[i] && age > 0.32) {
          T.shed[i] = 1;
          if (rnd() < T.shards) spawnSprite(1, _a.set(x, y, z), _b.set(T.v[i3], T.v[i3 + 1], T.v[i3 + 2]).multiplyScalar(0.6).add(_c.set(R(-0.6, 0.6), R(0, 0.8), R(-0.6, 0.6))), { size: R(0.04, 0.1) * (T.width / 0.6), life: R(0.5, 1.1) });
          if (rnd() < T.billows) spawnSprite(0, _a.set(x, y, z), _b.set(T.v[i3], T.v[i3 + 1], T.v[i3 + 2]).multiplyScalar(0.4), { size: T.width * R(0.45, 0.8), grow: 1.8, life: R(0.45, 0.85), opacity: 0.7, drag: 2, buoy: 0.25 });
        }
      }
    }
  }
  const SMOKECAP = 40 * MAXTP * 2;
  const smokeGeo = new THREE.BufferGeometry();
  const sArrs = { pos: new Float32Array(SMOKECAP * 3), prev: new Float32Array(SMOKECAP * 3), next: new Float32Array(SMOKECAP * 3), data: new Float32Array(SMOKECAP * 4), extra: new Float32Array(SMOKECAP * 2) };
  const sIndex = new Uint32Array(40 * MAXTP * 6);
  smokeGeo.setAttribute('position', dyn(sArrs.pos, 3)); smokeGeo.setAttribute('aPrev', dyn(sArrs.prev, 3)); smokeGeo.setAttribute('aNext', dyn(sArrs.next, 3));
  smokeGeo.setAttribute('aData', dyn(sArrs.data, 4)); smokeGeo.setAttribute('aExtra', dyn(sArrs.extra, 2)); smokeGeo.setIndex(dyn(sIndex, 1));
  const smokeMat = new THREE.ShaderMaterial({
    uniforms: { uResolution: uniforms.uResolution, uTime: uniforms.uTime, uSmoke: { value: new V3() } },
    vertexShader: RIBBON_VERT,
    fragmentShader: NOISE_GLSL + /* glsl */`
      uniform float uTime; uniform vec3 uSmoke;
      varying vec4 vData; varying vec2 vExtra;
      void main(){
        float v = vData.x, age = vData.y;
        float across = 1. - v * v;
        // warped across, streaked along the motion: torn cloak and speed lines, not a plank
        vec3 q = vec3(vExtra.x * 1.3 - uTime * .2, v * 2.1, vExtra.y + uTime * .25);
        q.y += fbm2(vec3(vExtra.x * .6, v * 1.1, vExtra.y + uTime * .3)) * 1.3;
        float n = fbm3(q);
        float streak = snoise(vec3(vExtra.x * .25, v * 3., vExtra.y * 2. + uTime * .2));
        // the noise moves the edge by most of the half-width, so the outline is torn, never the ribbon's side
        float d = across * 1.45 - .45 + n * 1.05 + streak * .2;   // zero at the ribbon's side whatever the noise
        float th = mix(.32, 1.05, pow(age, .8));               // erosion rises with age
        float a = smoothstep(th - .08, th + .3, d) * vData.z;   // vData.z carries opacity here
        gl_FragColor = vec4(uSmoke * a, a);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
  // Smoke uses aData.z for width like the bolts, and hands its opacity to the
  // fragment stage in that slot instead.
  smokeMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('attribute vec2 aExtra;', 'attribute vec2 aExtra;\nattribute float aOpacity;')
      .replace('vData = aData;', 'vData = vec4(aData.x, aData.y, aOpacity, aData.w);');
  };
  const sOpacity = new Float32Array(SMOKECAP);
  smokeGeo.setAttribute('aOpacity', dyn(sOpacity, 1));
  const smokeMesh = new THREE.Mesh(smokeGeo, smokeMat); smokeMesh.frustumCulled = false; smokeMesh.renderOrder = 10;
  group.add(smokeMesh);
  function buildSmoke() {
    let v = 0, idx = 0;
    const t = clock.sim;
    for (const T of trails) {
      if (T.n < 2) continue;
      if (v + T.n * 2 > SMOKECAP) break;
      const base = v;
      for (let i = 0; i < T.n; i++) {
        // a two-point stencil for the tangent: wide ribbons fold over on single-segment kinks
        const i3 = i * 3, p3 = Math.max(i - 2, 0) * 3, n3 = Math.min(i + 2, T.n - 1) * 3;
        const age = Math.min((t - T.born[i]) / T.life, 1);
        const head = T.active ? Math.min(1, (T.n - 1 - i) / 3) : 1;          // taper into the emitter
        const sw = 0.65 + 0.35 * Math.sin(T.dist[i] * 1.7 + T.seed) + 0.2 * Math.sin(T.dist[i] * 4.1 + T.seed * 2);
        const w = T.width * (1 + 0.9 * age) * (0.35 + 0.65 * head) * sw;
        for (let s = -1; s <= 1; s += 2) {
          writeRibbonVertex(sArrs, v, T.p[i3], T.p[i3 + 1], T.p[i3 + 2], T.p[p3], T.p[p3 + 1], T.p[p3 + 2], T.p[n3], T.p[n3 + 1], T.p[n3 + 2], s, age, w, 0, T.dist[i], T.seed);
          sOpacity[v] = T.opacity; v++;
        }
      }
      for (let i = 0; i < T.n - 1; i++) {
        const k = base + i * 2;
        sIndex[idx++] = k; sIndex[idx++] = k + 2; sIndex[idx++] = k + 1;
        sIndex[idx++] = k + 1; sIndex[idx++] = k + 2; sIndex[idx++] = k + 3;
      }
    }
    for (const name of ['position', 'aPrev', 'aNext', 'aData', 'aExtra', 'aOpacity']) { const at = smokeGeo.getAttribute(name); at.needsUpdate = true; at.clearUpdateRanges?.(); at.addUpdateRange?.(0, v * at.itemSize); }
    smokeGeo.index.needsUpdate = true; smokeGeo.index.clearUpdateRanges?.(); smokeGeo.index.addUpdateRange?.(0, idx);
    smokeGeo.setDrawRange(0, idx);
  }

  // ---------------------------------------------------------------- dark sprites: billows, dust, shards
  const MAXSPR = 1600;
  const spr = { n: 0, alive: new Uint8Array(MAXSPR), type: new Uint8Array(MAXSPR), p: new Float32Array(MAXSPR * 3), v: new Float32Array(MAXSPR * 3), s0: new Float32Array(MAXSPR), s1: new Float32Array(MAXSPR), rot: new Float32Array(MAXSPR), rotV: new Float32Array(MAXSPR), age: new Float32Array(MAXSPR), life: new Float32Array(MAXSPR), drag: new Float32Array(MAXSPR), buoy: new Float32Array(MAXSPR), col: new Float32Array(MAXSPR * 3), op: new Float32Array(MAXSPR), seed: new Float32Array(MAXSPR) };
  let sprCursor = 0;
  function spawnSprite(type, pos, vel, { size = 0.5, grow = 2.2, life = 1, drag = 1.6, buoy = 0.3, color = palette.smoke, opacity = 1 } = {}) {
    let i = -1;
    for (let k = 0; k < MAXSPR; k++) { const j = (sprCursor + k) % MAXSPR; if (!spr.alive[j]) { i = j; break; } }
    if (i < 0) i = sprCursor;
    sprCursor = (i + 1) % MAXSPR;
    const i3 = i * 3;
    spr.alive[i] = 1; spr.type[i] = type;
    spr.p[i3] = pos.x; spr.p[i3 + 1] = pos.y; spr.p[i3 + 2] = pos.z;
    spr.v[i3] = vel.x; spr.v[i3 + 1] = vel.y; spr.v[i3 + 2] = vel.z;
    spr.s0[i] = size; spr.s1[i] = size * grow; spr.rot[i] = R(0, 6.28); spr.rotV[i] = R(-2, 2) * (type === 1 ? 3 : 0.4);
    spr.age[i] = 0; spr.life[i] = life; spr.drag[i] = drag; spr.buoy[i] = buoy;
    spr.col[i3] = color.r; spr.col[i3 + 1] = color.g; spr.col[i3 + 2] = color.b; spr.op[i] = opacity; spr.seed[i] = rnd() * 100;
  }
  const sprGeo = new THREE.InstancedBufferGeometry();
  { const q = new THREE.PlaneGeometry(1, 1); sprGeo.index = q.index; sprGeo.setAttribute('position', q.getAttribute('position')); }
  const iSprPos = new Float32Array(MAXSPR * 3), iSprA = new Float32Array(MAXSPR * 4), iSprB = new Float32Array(MAXSPR * 4), iSprT = new Float32Array(MAXSPR);
  const idyn = (arr, n) => new THREE.InstancedBufferAttribute(arr, n).setUsage(THREE.DynamicDrawUsage);
  sprGeo.setAttribute('iPos', idyn(iSprPos, 3)); sprGeo.setAttribute('iA', idyn(iSprA, 4)); sprGeo.setAttribute('iB', idyn(iSprB, 4)); sprGeo.setAttribute('iT', idyn(iSprT, 1));
  sprGeo.instanceCount = 0;
  const sprMat = new THREE.ShaderMaterial({
    uniforms: { uTime: uniforms.uTime, uEmber: { value: new V3() } },
    vertexShader: /* glsl */`
      attribute vec3 iPos; attribute vec4 iA; attribute vec4 iB; attribute float iT;
      varying vec2 vQ; varying vec4 vA; varying vec4 vB; varying float vT;
      void main(){
        vec4 mv = viewMatrix * vec4(iPos, 1.);
        float c = cos(iA.y), s = sin(iA.y);
        vec2 p = position.xy;
        if (iT > .5) p.x *= .55;                    // flakes are a little longer than wide
        mv.xy += vec2(c * p.x - s * p.y, s * p.x + c * p.y) * iA.x;
        vQ = position.xy * 2.; vA = iA; vB = iB; vT = iT;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: NOISE_GLSL + /* glsl */`
      uniform float uTime; uniform vec3 uEmber;
      varying vec2 vQ; varying vec4 vA; varying vec4 vB; varying float vT;
      void main(){
        float age = vA.z, seed = vA.w;
        float a;
        if (vT < .5) {
          // billow: soft disc broken by noise, eroding as it ages
          float r = length(vQ);
          float n = fbm2(vec3(vQ * 1.4, seed + age * 1.2)) * .5 + .5;
          float th = mix(.12, .75, age);
          a = smoothstep(th, th + .22, n * smoothstep(1., .25, r));
        } else {
          // flake: an irregular torn polygon, like ash or a scrap of cloak
          float ang = atan(vQ.y, vQ.x);
          float lim = .62 + .26 * snoise(vec3(cos(ang) * 1.3, sin(ang) * 1.3, seed)) + .08 * snoise(vec3(cos(ang) * 4., sin(ang) * 4., seed + 5.));
          a = 1. - smoothstep(lim - .05, lim, length(vQ));
          a *= smoothstep(mix(-.2, .7, age), mix(-.1, .8, age), snoise(vec3(vQ * 2.2, seed)) * .5 + .5);
        }
        a *= vB.a * (1. - smoothstep(.75, 1., age));
        gl_FragColor = vec4(vB.rgb * a, a);
      }`,
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
  const sprMesh = new THREE.Mesh(sprGeo, sprMat); sprMesh.frustumCulled = false; sprMesh.renderOrder = 11;
  group.add(sprMesh);

  // ---------------------------------------------------------------- sparks
  const MAXSPK = 1800;
  const spk = { alive: new Uint8Array(MAXSPK), p: new Float32Array(MAXSPK * 3), v: new Float32Array(MAXSPK * 3), age: new Float32Array(MAXSPK), life: new Float32Array(MAXSPK), size: new Float32Array(MAXSPK), heat: new Float32Array(MAXSPK), grav: new Float32Array(MAXSPK), drag: new Float32Array(MAXSPK) };
  let spkCursor = 0;
  function spawnSpark(pos, vel, { life = 0.6, size = 0.012, heat = 1, gravity = 1, drag = 1.2 } = {}) {
    let i = -1;
    for (let k = 0; k < MAXSPK; k++) { const j = (spkCursor + k) % MAXSPK; if (!spk.alive[j]) { i = j; break; } }
    if (i < 0) i = spkCursor;
    spkCursor = (i + 1) % MAXSPK;
    const i3 = i * 3;
    spk.alive[i] = 1; spk.p[i3] = pos.x; spk.p[i3 + 1] = pos.y; spk.p[i3 + 2] = pos.z;
    spk.v[i3] = vel.x; spk.v[i3 + 1] = vel.y; spk.v[i3 + 2] = vel.z;
    spk.age[i] = 0; spk.life[i] = life; spk.size[i] = size; spk.heat[i] = heat; spk.grav[i] = gravity; spk.drag[i] = drag;
  }
  function sparks(pos, { count = 40, dir = null, spread = 1, speed = [3, 10], life = [0.35, 0.9], size = [0.004, 0.011], gravity = 1, heat = [0.7, 1] } = {}) {
    for (let k = 0; k < count; k++) {
      _a.set(R(-1, 1), R(-1, 1), R(-1, 1)); if (_a.lengthSq() > 1) _a.normalize();
      if (dir) _a.multiplyScalar(spread).add(dir).normalize(); else _a.normalize();
      spawnSpark(pos, _a.multiplyScalar(R(speed[0], speed[1])), { life: R(life[0], life[1]), size: R(size[0], size[1]), heat: R(heat[0], heat[1]), gravity });
    }
  }
  const spkGeo = new THREE.InstancedBufferGeometry();
  { const q = new THREE.PlaneGeometry(1, 1); spkGeo.index = q.index; spkGeo.setAttribute('position', q.getAttribute('position')); }
  const iSpkPos = new Float32Array(MAXSPK * 3), iSpkTail = new Float32Array(MAXSPK * 3), iSpkS = new Float32Array(MAXSPK * 2);
  spkGeo.setAttribute('iPos', idyn(iSpkPos, 3)); spkGeo.setAttribute('iTail', idyn(iSpkTail, 3)); spkGeo.setAttribute('iS', idyn(iSpkS, 2));
  spkGeo.instanceCount = 0;
  const spkMat = new THREE.ShaderMaterial({
    uniforms: { uResolution: uniforms.uResolution, uDpr: uniforms.uDpr },
    vertexShader: /* glsl */`
      attribute vec3 iPos; attribute vec3 iTail; attribute vec2 iS;   // size (world), heat
      uniform vec2 uResolution; uniform float uDpr;
      varying vec2 vL; varying float vLen; varying float vW; varying float vHeat;
      void main(){
        mat4 vp = projectionMatrix * viewMatrix;
        vec4 h = vp * vec4(iPos, 1.), t = vp * vec4(iTail, 1.);
        vec2 hr = uResolution * .5;
        vec2 sh = h.xy / max(h.w, 1e-3) * hr, st = t.xy / max(t.w, 1e-3) * hr;
        float w = clamp(iS.x * projectionMatrix[1][1] * hr.y / max(h.w, 1e-3), 1.1 * uDpr, 5. * uDpr);
        vec2 d = sh - st; float L = length(d);
        float maxL = min(w * 4., 16. * uDpr);          // short streaks: long ones read as dashes
        if (L > maxL) { d *= maxL / L; L = maxL; }
        vec2 dir = L > 1e-3 ? d / L : vec2(1., 0.), nrm = vec2(-dir.y, dir.x);
        vec2 ctr = sh - d * .5;
        float hl = L * .5 + w;
        vec2 sp = ctr + dir * position.x * 2. * hl + nrm * position.y * 2. * w;
        vL = vec2(position.x * 2. * hl, position.y * 2. * w); vLen = L * .5; vW = w * .5; vHeat = iS.y;
        gl_Position = vec4(sp / hr * h.w, h.z, h.w);
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vL; varying float vLen; varying float vW; varying float vHeat;
      void main(){
        float x = clamp(vL.x, -vLen, vLen);
        float dist = length(vec2(vL.x - x, vL.y));
        float a = 1. - smoothstep(vW * .35, vW, dist);
        vec3 hot = vec3(4.2, 2.5, 1.0), mid = vec3(2.8, .78, .16), cool = vec3(.85, .10, .025);
        vec3 c = vHeat > .5 ? mix(mid, hot, (vHeat - .5) * 2.) : mix(cool, mid, vHeat * 2.);
        gl_FragColor = vec4(c * a * smoothstep(0., .08, vHeat), 1.);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const spkMesh = new THREE.Mesh(spkGeo, spkMat); spkMesh.frustumCulled = false; spkMesh.renderOrder = 31;
  group.add(spkMesh);

  // ---------------------------------------------------------------- debris: lit chips that land and rest
  const MAXDEB = 160;
  const rockGeo = (() => {
    const g = new THREE.DodecahedronGeometry(1, 0);
    const p = g.getAttribute('position');
    const key = (x, y, z) => `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    const jit = new Map(); const r2 = mulberry32(91);
    for (let i = 0; i < p.count; i++) {
      const k = key(p.getX(i), p.getY(i), p.getZ(i));
      if (!jit.has(k)) jit.set(k, 0.7 + r2() * 0.5);          // shared corners move together: no cracks
      const s = jit.get(k); p.setXYZ(i, p.getX(i) * s, p.getY(i) * s * 0.7, p.getZ(i) * s);
    }
    g.computeVertexNormals();
    return g;
  })();
  const rockHull = (() => {
    const p = rockGeo.getAttribute('position'), seen = new Set(), out = [];
    for (let i = 0; i < p.count; i++) { const k = `${p.getX(i).toFixed(4)},${p.getY(i).toFixed(4)},${p.getZ(i).toFixed(4)}`; if (!seen.has(k)) { seen.add(k); out.push(new V3(p.getX(i), p.getY(i), p.getZ(i))); } }
    return out;
  })();
  // distance from the centre to the lowest corner, for this rotation and scale
  function rockBottom(q, s) {
    let lo = 0;
    for (const h of rockHull) { _c.copy(h).multiply(s).applyQuaternion(q); if (_c.y < lo) lo = _c.y; }
    return -lo;
  }
  const debMat = new THREE.ShaderMaterial({
    uniforms: { ...lightUniforms, uAmbient: { value: new V3(0.012, 0.014, 0.02) } },
    vertexShader: /* glsl */`
      varying vec3 vW; varying vec3 vN;
      void main(){
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.);
        vW = w.xyz; vN = normalize(mat3(modelMatrix * instanceMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: ENERGY_LIGHTS_GLSL + /* glsl */`
      uniform vec3 uAmbient; varying vec3 vW; varying vec3 vN;
      void main(){
        vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
        vec3 alb = vec3(.075, .072, .07);
        vec3 c = alb * uAmbient * 8. + energyLight(vW, N, V, alb, .7);
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  const debMesh = new THREE.InstancedMesh(rockGeo, debMat, MAXDEB); debMesh.count = 0; debMesh.frustumCulled = false;
  debMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(debMesh);
  const deb = [];
  for (let i = 0; i < MAXDEB; i++) deb.push({ alive: false, p: new V3(), v: new V3(), q: new THREE.Quaternion(), axis: new V3(), spin: 0, s: new V3(), age: 0, life: 3, rest: false });
  function debris(pos, { count = 8, speed = [2.5, 7], size = [0.03, 0.09], dir = null, life = [2.4, 3.6] } = {}) {
    for (let k = 0; k < count; k++) {
      const D = deb.find((d) => !d.alive) || deb.reduce((o, d) => (d.age > o.age ? d : o));
      D.alive = true; D.rest = false; D.age = 0; D.life = R(life[0], life[1]);
      D.p.copy(pos).add(_a.set(R(-0.3, 0.3), 0, R(-0.3, 0.3)));
      _b.set(R(-1, 1), R(0.6, 1.6), R(-1, 1)).normalize(); if (dir) _b.addScaledVector(dir, 0.8).normalize();
      D.v.copy(_b).multiplyScalar(R(speed[0], speed[1]));
      const s = R(size[0], size[1]); D.s.set(s * R(0.7, 1.3), s * R(0.6, 1.0), s * R(0.7, 1.3));
      D.p.y = Math.max(D.p.y, 0.12);
      D.q.setFromEuler(new THREE.Euler(R(0, 6), R(0, 6), R(0, 6))); D.axis.set(R(-1, 1), R(-1, 1), R(-1, 1)).normalize(); D.spin = R(6, 18);
    }
  }
  function updateDebris(dt) {
    let n = 0;
    for (const D of deb) {
      if (!D.alive) continue;
      D.age += dt;
      if (D.age > D.life + 0.5) { D.alive = false; continue; }
      if (!D.rest && dt > 0) {
        D.v.y -= 9.8 * dt; D.p.addScaledVector(D.v, dt);
        _q.setFromAxisAngle(D.axis, D.spin * dt); D.q.premultiply(_q);
        const floor = rockBottom(D.q, D.s);              // its lowest corner touches the ground: not sunk, not floating
        if (D.p.y < floor) {
          D.p.y = floor;
          if (Math.abs(D.v.y) < 1.0 && Math.hypot(D.v.x, D.v.z) < 0.6) { D.rest = true; D.v.set(0, 0, 0); }
          else { D.v.y = -D.v.y * 0.32; D.v.x *= 0.55; D.v.z *= 0.55; D.spin *= 0.5; }
        }
      }
      const shrink = D.age > D.life ? 1 - (D.age - D.life) / 0.5 : 1;
      _s.copy(D.s).multiplyScalar(Math.max(shrink, 0.001));
      if (D.rest) _a.copy(D.p).setY(rockBottom(D.q, _s)); else _a.copy(D.p);
      _m.compose(_a, D.q, _s); debMesh.setMatrixAt(n++, _m);
    }
    debMesh.count = n; debMesh.instanceMatrix.needsUpdate = true;
  }

  // ---------------------------------------------------------------- rings: air bursts and their refraction
  const ringGeo = new THREE.PlaneGeometry(2, 2, 1, 1);
  const RING_VERT = /* glsl */`
    varying vec2 vL; varying vec2 vRad;
    void main(){ vL = position.xy; vRad = (modelViewMatrix * vec4(position.xy, 0., 0.)).xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
  const rings = [];
  for (let i = 0; i < 40; i++) {
    const cm = new THREE.ShaderMaterial({
      uniforms: { uThick: { value: 0.05 }, uI: { value: 0 }, uSeed: { value: 0 }, uAge: { value: 0 }, uColor: { value: new V3() } },
      vertexShader: RING_VERT,
      fragmentShader: NOISE_GLSL + /* glsl */`
        uniform float uThick, uI, uSeed, uAge; uniform vec3 uColor; varying vec2 vL;
        void main(){
          float r = length(vL); if (r > 1.) discard;
          float x = (r - .9) / uThick;
          float band = exp(-x * x) * .35 + exp(-x * x * 9.) * .9;          // a thin hot line inside a faint halo
          float ang = atan(vL.y, vL.x);
          float br = smoothstep(.3, .75, snoise(vec3(cos(ang) * 3., sin(ang) * 3., uSeed + uAge * 2.)) * .5 + .5);   // torn into arcs, never a hoop
          gl_FragColor = vec4(uColor * band * br * uI, 1.);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const dm = new THREE.ShaderMaterial({
      uniforms: { uThick: { value: 0.05 }, uAmp: { value: 0 } },
      vertexShader: RING_VERT,
      fragmentShader: /* glsl */`
        uniform float uThick, uAmp; varying vec2 vL; varying vec2 vRad;
        void main(){
          float r = length(vL); if (r > 1.) discard;
          float x = (r - .9) / (uThick * 1.6);
          float prof = -1.7 * x * exp(-x * x);             // push-pull: the edge of a pressure front
          vec2 dir = vRad / max(length(vRad), 1e-5);
          gl_FragColor = vec4(dir * prof * uAmp, 0., 1.);
        }`,
      transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    });
    const cmesh = new THREE.Mesh(ringGeo, cm), dmesh = new THREE.Mesh(ringGeo, dm);
    cmesh.renderOrder = 25; dmesh.layers.set(DISTORT_LAYER); cmesh.visible = dmesh.visible = false; cmesh.frustumCulled = dmesh.frustumCulled = false;
    group.add(cmesh, dmesh);
    rings.push({ alive: false, cmesh, dmesh, cm, dm, age: 0, delay: 0, life: 0.3, R: 2, thick: 0.05, I: 1, amp: 0.1, center: new V3(), q: new THREE.Quaternion(), color: new V3() });
  }
  function ring(center, normal, { radius = 2.5, thick = 0.06, intensity = 1, life = 0.3, delay = 0, amp = 0.03, color = null } = {}) {
    const G = rings.find((r) => !r.alive) || rings.reduce((o, r) => (r.age / r.life > o.age / o.life ? r : o));
    G.alive = true; G.age = -delay; G.life = life; G.R = radius; G.thick = thick; G.I = intensity; G.amp = amp;
    G.center.copy(center); G.q.setFromUnitVectors(ZAXIS, _a.copy(normal).normalize());
    const c = color || palette.glow; G.color.set(c.r, c.g, c.b);
    G.cm.uniforms.uSeed.value = rnd() * 40;
  }
  const easeOutExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
  function viewUnitsPerUV(p) {
    // world units spanned by the full screen height at point p
    const d = Math.max(0.2, _c.copy(p).sub(camera.position).dot(camera.getWorldDirection(_d)));
    return 2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5);
  }
  function updateRings(dt) {
    for (const G of rings) {
      if (!G.alive) continue;
      G.age += dt;
      if (G.age > G.life) { G.alive = false; G.cmesh.visible = G.dmesh.visible = false; continue; }
      if (G.age < 0) { G.cmesh.visible = G.dmesh.visible = false; continue; }
      const x = G.age / G.life, r = Math.max(0.05, G.R * easeOutExpo(x));
      for (const m of [G.cmesh, G.dmesh]) { m.visible = true; m.position.copy(G.center); m.quaternion.copy(G.q); m.scale.set(r, r, r); }
      const thick = Math.min(0.45, G.thick / r * (1 + x * 1.5));
      G.cm.uniforms.uThick.value = thick; G.cm.uniforms.uAge.value = x;
      const span = r / viewUnitsPerUV(G.center);                   // ring radius as a share of the screen height
      G.cm.uniforms.uI.value = G.I * Math.pow(1 - x, 1.8) * 1.3 * Math.min(1, Math.max(0.2, 0.3 / span)); G.cm.uniforms.uColor.value.copy(G.color);
      G.dm.uniforms.uThick.value = thick;
      G.dm.uniforms.uAmp.value = G.amp / viewUnitsPerUV(G.center) * Math.pow(1 - x, 1.2);
    }
  }

  // ---------------------------------------------------------------- blast cones: the punch's pressure funnel
  const coneGeo = new THREE.CylinderGeometry(1, 0.07, 1, 48, 12, true); coneGeo.translate(0, 0.5, 0);
  const CONE_VERT = /* glsl */`
    varying vec3 vW; varying vec3 vN; varying float vAlong; varying vec2 vAng;
    void main(){
      vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz;
      vN = normalize(mat3(modelMatrix) * normal); vAlong = position.y; vAng = normalize(position.xz + 1e-5);
      gl_Position = projectionMatrix * viewMatrix * w;
    }`;
  const cones = [];
  for (let i = 0; i < 8; i++) {
    const cm = new THREE.ShaderMaterial({
      uniforms: { uAge: { value: 0 }, uI: { value: 0 }, uSeed: { value: 0 }, uGlow: { value: new V3() }, uCore: { value: new V3() } },
      vertexShader: CONE_VERT,
      fragmentShader: NOISE_GLSL + /* glsl */`
        uniform float uAge, uI, uSeed; uniform vec3 uGlow, uCore;
        varying vec3 vW; varying vec3 vN; varying float vAlong; varying vec2 vAng;
        void main(){
          vec3 V = normalize(cameraPosition - vW);
          float e = pow(1. - abs(dot(normalize(vN), V)), 1.6);
          float shells = pow(.5 + .5 * sin((vAlong * 5. - uAge * 7.) * 6.2832), 9.);
          float ang = atan(vAng.y, vAng.x);
          float str = pow(snoise(vec3(cos(ang) * 4., sin(ang) * 4., vAlong * 1.6 - uAge * 5. + uSeed)) * .5 + .5, 5.);
          float fade = pow(1. - uAge, 1.8) * smoothstep(0., .08, vAlong) * smoothstep(1., .55, vAlong);
          float tear = smoothstep(.35, .7, snoise(vec3(cos(ang) * 2.5, sin(ang) * 2.5, vAlong * 2.2 - uAge * 3. + uSeed)) * .5 + .5);
          vec3 c = (uGlow * (e * .6 + shells * .5 * e) + uCore * str * (.25 + e) * 1.1) * tear;
          gl_FragColor = vec4(c * fade * uI, 1.);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const dm = new THREE.ShaderMaterial({
      uniforms: { uAge: { value: 0 }, uAmp: { value: 0 } },
      vertexShader: CONE_VERT,
      fragmentShader: /* glsl */`
        uniform float uAge, uAmp; varying vec3 vW; varying vec3 vN; varying float vAlong;
        void main(){
          vec3 V = normalize(cameraPosition - vW); vec3 N = normalize(vN);
          float e = 1. - abs(dot(N, V));
          vec2 nv = (viewMatrix * vec4(N, 0.)).xy;
          float fade = pow(1. - uAge, 1.2) * smoothstep(0., .1, vAlong) * smoothstep(1., .6, vAlong);
          float shells = .5 + .5 * sin((vAlong * 5. - uAge * 7.) * 6.2832);
          gl_FragColor = vec4(nv * uAmp * (.35 + e) * (.5 + shells) * fade, 0., 1.);
        }`,
      transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    });
    const cmesh = new THREE.Mesh(coneGeo, cm), dmesh = new THREE.Mesh(coneGeo, dm);
    cmesh.renderOrder = 26; dmesh.layers.set(DISTORT_LAYER); cmesh.visible = dmesh.visible = false; cmesh.frustumCulled = dmesh.frustumCulled = false;
    group.add(cmesh, dmesh);
    cones.push({ alive: false, cmesh, dmesh, cm, dm, age: 0, life: 0.3, L: 4, R: 1.4, I: 1, amp: 0.2, pos: new V3(), q: new THREE.Quaternion() });
  }

  // ---------------------------------------------------------------- scorch decals: the mark the hit leaves
  const scorchGeo = new THREE.PlaneGeometry(2, 2); scorchGeo.rotateX(-Math.PI / 2);
  const scorches = [];
  for (let i = 0; i < 14; i++) {
    const m = new THREE.ShaderMaterial({
      uniforms: { uAge: { value: 0 }, uSeed: { value: 0 }, uHeat: { value: 0 }, uGlow: { value: new V3() } },
      vertexShader: /* glsl */`varying vec2 vL; void main(){ vL = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: NOISE_GLSL + /* glsl */`
        uniform float uAge, uSeed, uHeat; uniform vec3 uGlow; varying vec2 vL;
        void main(){
          float r = length(vL); if (r > 1.) discard;
          float ang = atan(vL.y, vL.x);
          float n = fbm3(vec3(vL * 2.2, uSeed)) * .5 + .5;
          float burn = smoothstep(1., .25, r + (n - .5) * .45);
          float a = burn * .7 * (1. - smoothstep(.7, 1., uAge));
          gl_FragColor = vec4(vec3(.004, .004, .006) * a, a);
        }`,
      transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    const mesh = new THREE.Mesh(scorchGeo, m); mesh.visible = false; mesh.renderOrder = 2; mesh.frustumCulled = false;
    group.add(mesh);
    scorches.push({ alive: false, mesh, m, age: 0, life: 3 });
  }
  function scorch(pos, radius = 1.4, life = 3.2) {
    const S = scorches.find((s) => !s.alive) || scorches.reduce((o, s) => (s.age / s.life > o.age / o.life ? s : o));
    S.alive = true; S.age = 0; S.life = life; S.mesh.visible = true;
    S.mesh.position.set(pos.x, 0.004, pos.z); S.mesh.scale.setScalar(radius); S.mesh.rotation.y = R(0, 6.28);
    S.m.uniforms.uSeed.value = rnd() * 30;
  }

  // ---------------------------------------------------------------- orb: compressed, refracting thunderstorm energy
  const orbGeo = new THREE.IcosahedronGeometry(1, 20);
  const ORB_VERT = NOISE_GLSL + /* glsl */`
    uniform float uTime, uRadius, uInstab; uniform vec3 uCenter;
    varying vec3 vW; varying vec3 vN; varying vec3 vLocal;
    void main(){
      vec3 n = normalize(position);
      float wob = snoise(n * 1.8 + vec3(0., uTime * 1.7, uTime * .9)) * (.03 + .11 * uInstab)
                + snoise(n * 4.3 - uTime * 2.6) * (.012 + .04 * uInstab);
      vLocal = n * (1. + wob); vN = n;
      vW = uCenter + vLocal * uRadius;
      gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
    }`;
  const orbs = [];
  function createOrb({ radius = 0.45 } = {}) {
    const u = {
      uTime: uniforms.uTime, uRadius: { value: radius }, uInstab: { value: 0.2 }, uCenter: { value: new V3() }, uAxis: { value: new V3(1, 0, 0) },
      uPressure: { value: 0.6 }, uMode: { value: 0 }, uCore: { value: new V3() }, uRim: { value: new V3() }, uLens: { value: 0 },
    };
    const cm = new THREE.ShaderMaterial({
      uniforms: u, vertexShader: ORB_VERT,
      fragmentShader: NOISE_GLSL + /* glsl */`
        uniform float uTime, uPressure, uMode, uRadius; uniform vec3 uCenter, uAxis, uCore, uRim;
        varying vec3 vW; varying vec3 vN; varying vec3 vLocal;
        void main(){
          vec3 V = normalize(cameraPosition - vW), N = normalize(vN);
          float ndv = abs(dot(N, V));
          float fres = pow(1. - ndv, 3.);
          bool back = !gl_FrontFacing;
          if (uMode > .5) {                                 // the failure: a light bulb
            if (back) discard;
            gl_FragColor = vec4(uCore * (.8 + 2.4 * pow(ndv, 1.5)) * (1.5 + 2. * uPressure), .95); return;
          }
          // streaks wound around the punch axis, front shell one way and back shell the other:
          // two surfaces give the depth of a volume without marching one (marching banded)
          vec3 p = normalize(vLocal);
          vec3 b1 = normalize(cross(uAxis, abs(uAxis.y) < .9 ? vec3(0., 1., 0.) : vec3(1., 0., 0.)));
          vec3 b2 = cross(uAxis, b1);
          float h = dot(p, uAxis), phi = atan(dot(p, b2), dot(p, b1));
          float twist = phi + h * 2.8 + uTime * (2.4 + 4. * uPressure) * (back ? -.7 : 1.);
          vec3 q = vec3(cos(twist) * .75, sin(twist) * .75, h * 4.2 + uTime * .5);
          float n1 = snoise(q), n2 = snoise(q * vec3(1.6, 1.6, 2.3) + 7.3 - uTime * .4);
          float streak = pow(1. - abs(n1), 26.) + .35 * pow(1. - abs(n2), 32.);
          vec3 emit = uRim * fres * (.35 + .8 * uPressure) * (back ? .35 : 1.)
                    + uCore * streak * (.45 + 1.25 * uPressure) * (back ? .4 : 1.)
                    + uRim * pow(ndv, 2.) * .05 * (1. + uPressure);
          float a = back ? 0. : (.05 + .07 * uPressure) * (1. - fres);   // a little density: it darkens what is behind it
          gl_FragColor = vec4(emit, a);
        }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    const dm = new THREE.ShaderMaterial({
      uniforms: u, vertexShader: ORB_VERT,
      fragmentShader: NOISE_GLSL + /* glsl */`
        uniform float uLens, uTime, uMode; varying vec3 vW; varying vec3 vN;
        void main(){
          if (uMode > .5) { gl_FragColor = vec4(0.); return; }
          vec3 V = normalize(cameraPosition - vW), N = normalize(vN);
          float thick = sqrt(clamp(dot(N, V), 0., 1.));
          vec2 nv = (viewMatrix * vec4(N, 0.)).xy;
          vec2 off = -nv * uLens * thick;                                         // a dense lens: pulls the background in
          off += vec2(-nv.y, nv.x) * uLens * .6 * snoise(vec3(nv * 2.5, uTime * 1.8)) * thick;   // vortex shimmer
          gl_FragColor = vec4(off, 0., 1.);
        }`,
      transparent: true, depthWrite: false, depthTest: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    });
    const cmesh = new THREE.Mesh(orbGeo, cm), dmesh = new THREE.Mesh(orbGeo, dm);
    cmesh.renderOrder = 20; dmesh.layers.set(DISTORT_LAYER); cmesh.frustumCulled = dmesh.frustumCulled = false;
    group.add(cmesh, dmesh);
    const O = {
      position: u.uCenter.value, axis: u.uAxis.value, radius, pressure: 0.6, instability: 0.2, visible: true, arcRate: 1, reach: [],
      scale: 1, vel: 0, nextKick: 0, u, cmesh, dmesh,
      pulse(k = -0.2) { O.vel += k * 34; },               // compress (negative) or swell; the spring rebounds past rest
      get currentRadius() { return u.uRadius.value; },
    };
    orbs.push(O);
    return O;
  }
  function updateOrbs(dt) {
    const t = clock.sim;
    for (const O of orbs) {
      // critically under-damped spring: compress, rebound past rest, settle
      const w = 34, z = 0.3, steps = 4, h = dt / steps;
      for (let i = 0; i < steps; i++) { const acc = -w * w * (O.scale - 1) - 2 * z * w * O.vel; O.vel += acc * h; O.scale += O.vel * h; }
      if (O.instability > 0.45 && t > O.nextKick) {     // unstable: expand, compress, collapse, re-expand
        O.pulse(R(-0.32, 0.26) * O.instability); O.nextKick = t + R(0.12, 0.32);
      }
      const breathe = 1 + 0.035 * Math.sin(t * 9) + 0.05 * O.instability * Math.sin(t * 17 + 1.3);
      const r = Math.max(0.001, O.radius * O.scale * breathe);
      O.u.uRadius.value = r; O.u.uInstab.value = O.instability; O.u.uPressure.value = O.pressure;
      O.u.uMode.value = options.orb === 'glow' ? 1 : 0;
      O.u.uCore.value.set(palette.core.r * 0.78, palette.core.g * 0.9, palette.core.b);   // streaks a touch bluer than a bolt's core
      O.u.uRim.value.set(palette.rim.r, palette.rim.g, palette.rim.b);
      O.u.uLens.value = 0.11 * r / viewUnitsPerUV(O.position);
      O.cmesh.visible = O.dmesh.visible = O.visible && O.radius > 0.02;
      if (O.cmesh.visible) flashLight(0, O.position, (1.6 + 5.5 * O.pressure) * (r / 0.45), 30);
    }
  }
  function orbTick(O) {
    if (!O.visible || O.radius < 0.05) return;
    const r = O.u.uRadius.value, rate = O.arcRate;
    const surf = Math.round((R(0.6, 1.6) + 2 * O.pressure) * rate);
    for (let k = 0; k < surf; k++) {
      _a.set(R(-1, 1), R(-1, 1), R(-1, 1)).normalize();
      _d.set(R(-1, 1), R(-1, 1), R(-1, 1)).cross(_a).normalize();
      _b.copy(_a).applyAxisAngle(_d, R(0.6, 1.5));
      const bend = _c.addVectors(_a, _b).normalize().multiplyScalar(r * R(0.12, 0.42));
      bolt(_a.multiplyScalar(r * 1.02), _b.multiplyScalar(r * 1.02), { levels: 5, jag: 0.34, width: 0.02 * (r / 0.45), minPx: 5, intensity: 0.85, life: R(1, 2.6) | 0, anchor: O.position, bend, branches: 0 });
    }
    const inner = Math.round(R(0.5, 1.8) * rate);
    for (let k = 0; k < inner; k++) {
      _a.set(R(-1, 1), R(-1, 1), R(-1, 1)).multiplyScalar(r * 0.7); _b.set(R(-1, 1), R(-1, 1), R(-1, 1)).multiplyScalar(r * 0.7);
      bolt(_a, _b, { levels: 4, jag: 0.25, width: 0.014, minPx: 4, intensity: 0.6, life: 1, anchor: O.position, branches: 0 });
    }
    if (rnd() < (0.3 + 0.55 * O.pressure) * Math.min(rate, 1.6)) {
      _a.set(R(-1, 1), R(-1, 1), R(-1, 1)).normalize();
      if (_a.dot(O.axis) > 0.3) _a.addScaledVector(O.axis, -1.2).normalize();   // leap back along the arm or out sideways, not ahead
      const reach = O.reach.length && rnd() < 0.55 ? O.reach[(rnd() * O.reach.length) | 0] : null;
      if (reach) _b.subVectors(reach, O.position); else _b.copy(_a).multiplyScalar(r * R(1.5, 2.8)).add(_c.set(R(-1, 1), R(-1, 1), R(-1, 1)).multiplyScalar(r * 0.4));
      bolt(_a.multiplyScalar(r), _b, { levels: 5, jag: 0.26, width: 0.03, minPx: 8, intensity: 1, life: 2, anchor: O.position, branches: 1 });
    }
  }

  // ---------------------------------------------------------------- composites
  function puff(pos, { count = 8, size = [0.5, 1.0], speed = [0.6, 2.2], life = [0.7, 1.3], color = palette.smoke, dir = null, spread = 1, opacity = 0.95, grow = 2.2, buoy = 0.4 } = {}) {
    for (let k = 0; k < count; k++) {
      _a.set(R(-1, 1), R(-0.4, 1), R(-1, 1)).normalize();
      if (dir) _a.multiplyScalar(spread).add(dir).normalize();
      spawnSprite(0, _b.copy(pos).addScaledVector(_a, R(0, 0.25)), _a.multiplyScalar(R(speed[0], speed[1])), { size: R(size[0], size[1]), life: R(life[0], life[1]), color, opacity, grow, buoy });
    }
  }
  function shards(pos, { count = 12, speed = [1, 4], size = [0.05, 0.15], life = [0.6, 1.3], dir = null, spread = 1 } = {}) {
    for (let k = 0; k < count; k++) {
      _a.set(R(-1, 1), R(-0.5, 1), R(-1, 1)).normalize(); if (dir) _a.multiplyScalar(spread).add(dir).normalize();
      spawnSprite(1, pos, _a.multiplyScalar(R(speed[0], speed[1])), { size: R(size[0], size[1]), life: R(life[0], life[1]), drag: 2.2, buoy: 0.5, grow: 1.2 });
    }
  }
  // An air burst in three layers: a hot thin ring, a wider pressure ring, a slow outer
  // ring, each with its own refraction, staggered by 55 ms. On the ground it also throws
  // dust low and outward, chips that land, and leaves a scorch.
  function burst(pos, { strength = 1, normal = 'camera', layers = 3, sparks: nSparks = 50, debris: nDebris = 6, dust = 12, scorchMark = true, bolts: nBolts = 4, warm = true } = {}) {
    const ground = pos.y < 0.4;
    const c = ground ? _d.set(pos.x, 0.03, pos.z).clone() : pos.clone();
    const RAD = [2.2, 3.4, 4.8], TH = [0.04, 0.07, 0.11], IN = [0.85, 0.42, 0.24], LF = [0.22, 0.32, 0.46], AMP = [0.035, 0.028, 0.02];
    // a spherical pressure front projects to a circle from any view, so air rings face the camera
    const facing = ground ? UP : (normal === 'camera' ? _e.copy(camera.position).sub(c).normalize().clone() : normal);
    for (let k = 0; k < layers; k++) ring(c, facing, { radius: RAD[k] * strength, thick: TH[k] * Math.sqrt(strength), intensity: IN[k], life: LF[k] * (0.8 + 0.2 * strength), delay: k * 0.055, amp: AMP[k] * strength });
    sparks(c, { count: nSparks, dir: ground ? UP : null, spread: ground ? 1.4 : 1, speed: [3 * Math.sqrt(strength), 11 * Math.sqrt(strength)] });
    if (ground) {
      if (nDebris) debris(c, { count: nDebris, speed: [2.5 * Math.sqrt(strength), 6.5 * Math.sqrt(strength)] });
      for (let k = 0; k < dust; k++) {
        const ang = R(0, 6.28), out = _a.set(Math.cos(ang), 0, Math.sin(ang));
        spawnSprite(0, _b.copy(c).addScaledVector(out, R(0.2, 0.6)).setY(R(0.08, 0.35)), out.multiplyScalar(R(2.5, 6) * strength).setY(R(0.2, 0.9)), { size: R(0.4, 0.9) * Math.sqrt(strength), life: R(0.9, 1.6), color: palette.dust, opacity: 0.6, drag: 2.4, buoy: 0.15, grow: 2.6 });
      }
      if (scorchMark) { scorch(c, 1.1 * strength); addHeat(c, 1.5 * strength, 1); }
      for (let k = 0; k < nBolts; k++) {
        const ang = R(0, 6.28);
        _a.set(c.x, 0.05, c.z); _b.set(c.x + Math.cos(ang) * R(1, 2.6) * strength, R(0.02, 0.25), c.z + Math.sin(ang) * R(1, 2.6) * strength);
        bolt(_a, _b, { levels: 5, jag: 0.22, width: 0.035, minPx: 7, intensity: 1, life: 2, branches: 1 });
      }
    } else {
      puff(c, { count: Math.round(6 * strength), size: [0.4 * strength, 0.9 * strength] });
      shards(c, { count: Math.round(14 * strength) });
      for (let k = 0; k < nBolts; k++) {
        _a.set(R(-1, 1), R(-1, 1), R(-1, 1)).normalize();
        bolt(c, _b.copy(c).addScaledVector(_a, R(0.8, 2.2) * strength), { levels: 5, jag: 0.24, width: 0.032, minPx: 7, intensity: 0.9, life: 2, branches: 1 });
      }
    }
    flashLight(1, c, 14 * strength, 9, warm ? 1 : 0);
  }
  // The punch: a funnel of pressure shells out of the fist, a spear of lightning
  // re-thrown for three ticks, sparks and torn smoke blown forward.
  function blast(pos, dir, { length = 4, radius = 1.4, strength = 1, life = 0.28 } = {}) {
    const C = cones.find((c) => !c.alive) || cones[0];
    C.alive = true; C.age = 0; C.life = life; C.L = length; C.R = radius; C.I = strength; C.amp = 0.04 * strength;
    C.pos.copy(pos); C.q.setFromUnitVectors(UP, _a.copy(dir).normalize());
    C.cm.uniforms.uSeed.value = rnd() * 40;
    const d = dir.clone().normalize(), p = pos.clone();
    basis(d); const bu = _u.clone(), bw = _w.clone();       // bolt() rewrites _u/_w, so keep our own
    const spear = () => {
      for (let k = 0; k < Math.round(3 + 4 * strength); k++) {
        const th = R(0, 6.28), rr = radius * R(0, 0.85);
        _b.copy(p).addScaledVector(d, length * R(0.55, 1.0)).addScaledVector(bu, Math.cos(th) * rr).addScaledVector(bw, Math.sin(th) * rr);
        bolt(_a.copy(p).addScaledVector(d, 0.15), _b, { levels: 6, jag: 0.15, width: 0.045 * Math.sqrt(strength), minPx: 9, intensity: 1.1, life: 2, branches: 2 });
      }
    };
    spear(); repeat(2, spear);
    ring(_c.copy(p).addScaledVector(d, length * 0.35), d, { radius: radius * 1.3, thick: 0.08, intensity: 0.3, life: 0.3, amp: 0.05 * strength });
    sparks(p, { count: Math.round(70 * strength), dir: d, spread: 0.45, speed: [6, 16] });
    shards(_c.copy(p).addScaledVector(d, 0.4), { count: Math.round(16 * strength), dir: d, spread: 0.6, speed: [3, 8] });
    flashLight(3, _c.copy(p).addScaledVector(d, Math.min(1.5, length * 0.3)), 30 * strength, 7);
  }
  function updateCones(dt) {
    for (const C of cones) {
      if (!C.alive) continue;
      C.age += dt;
      if (C.age > C.life) { C.alive = false; C.cmesh.visible = C.dmesh.visible = false; continue; }
      const x = C.age / C.life, e = 1 - Math.pow(1 - x, 3);
      for (const m of [C.cmesh, C.dmesh]) { m.visible = true; m.position.copy(C.pos); m.quaternion.copy(C.q); m.scale.set(C.R * (0.35 + 0.65 * e), C.L * (0.2 + 0.8 * e), C.R * (0.35 + 0.65 * e)); }
      C.cm.uniforms.uAge.value = x; C.cm.uniforms.uI.value = C.I * 0.9;
      C.cm.uniforms.uGlow.value.set(palette.glow.r, palette.glow.g, palette.glow.b); C.cm.uniforms.uCore.value.set(palette.core.r, palette.core.g, palette.core.b);
      C.dm.uniforms.uAge.value = x; C.dm.uniforms.uAmp.value = C.amp * C.R / viewUnitsPerUV(C.pos);
    }
  }

  // A storm domain: black smoke bands orbiting a centre, lightning thrown across them,
  // dust and shards dragged into the spin. Move .center, .radius, .tilt per frame.
  const vortices = [];
  function vortex(center, { radius = 2.6, height = 1.6, duration = 4, bands = 6, speed = 7 } = {}) {
    const V = { center: center.clone(), radius, tilt: 0, intensity: 1, t: 0, duration, emitters: [], pos: new V3(), alive: true };
    for (let k = 0; k < bands; k++) {
      const T = createTrail({ width: R(0.55, 1.05), life: R(0.38, 0.5), spacing: 0.1, drift: new V3(0, 0.5, 0), jitter: 0.25, shards: 0.35 });
      T.disposable = true;
      V.emitters.push({ T, phase: (k / bands) * 6.28 + R(0, 0.6), r: R(0.78, 1.08), h: R(0.15, height), w: speed * R(0.85, 1.2) * (k % 2 ? 1 : 0.92) });
    }
    vortices.push(V);
    return V;
  }
  function updateVortices(dt) {
    for (let i = vortices.length - 1; i >= 0; i--) {
      const V = vortices[i];
      V.t += dt;
      const live = V.t < V.duration;
      for (const E of V.emitters) {
        if (!live) { E.T.stop(); continue; }
        E.phase += E.w * dt;
        const r = V.radius * E.r;
        E.pos = E.pos || new V3();
        E.pos.set(Math.cos(E.phase) * r, E.h + Math.sin(E.phase) * r * V.tilt, Math.sin(E.phase) * r).add(V.center);
        E.T.push(E.pos);
      }
      if (live && dt > 0 && rnd() < dt * 40) {
        const ang = R(0, 6.28), rr = V.radius * R(0.6, 1.2);
        spawnSprite(0, _a.set(V.center.x + Math.cos(ang) * rr, R(0.05, 0.4), V.center.z + Math.sin(ang) * rr), _b.set(-Math.sin(ang), 0.15, Math.cos(ang)).multiplyScalar(R(3, 6)), { size: R(0.4, 0.8), life: R(0.6, 1.1), color: palette.dust, opacity: 0.8, drag: 1.2, buoy: 0.2 });
      }
      if (!live && V.t > V.duration + 1) { vortices.splice(i, 1); V.alive = false; }
    }
  }
  function vortexTick(V) {
    if (V.t >= V.duration) return;
    const E = V.emitters, n = Math.round(R(1, 2.6) * V.intensity);
    for (let k = 0; k < n; k++) {
      const a = E[(rnd() * E.length) | 0], b = E[(rnd() * E.length) | 0];
      if (!a.pos || !b.pos) continue;
      if (a === b || rnd() < 0.35) bolt(a.pos, _b.copy(a.pos).setY(0.03), { levels: 5, jag: 0.22, width: 0.035, minPx: 8, intensity: 1, life: 2, branches: 1 });
      else bolt(a.pos, b.pos, { levels: 5, jag: 0.24, width: 0.035, minPx: 8, intensity: 1, life: 2, branches: 1 });
    }
    flashLight(3, _a.copy(V.center).setY(1), 6 * V.intensity, 8);
  }
  // Pull sparks, smoke billows and shards toward a point, with a swirl (ultimate charge-up).
  const attractor = { position: new V3(), strength: 0, swirl: 0, axis: new V3(0, 1, 0) };

  // ---------------------------------------------------------------- arc ticks and repeats
  const repeats = [];
  function repeat(ticks, fn) { repeats.push({ ticks, fn }); }
  function arcTick() {
    for (const B of bolts) {
      if (!B.alive) continue;
      B.age++;
      if (B.age >= B.life) { B.alive = false; continue; }
      if (options.lightning === 'tween') { B.from.set(B.pts.subarray(0, B.n * 3)); B.n = shape(B.pts, B.gen); }
    }
    for (let i = repeats.length - 1; i >= 0; i--) { repeats[i].fn(); if (--repeats[i].ticks <= 0) repeats.splice(i, 1); }
    for (const O of orbs) orbTick(O);
    for (const V of vortices) vortexTick(V);
    fx.skyFlash = Math.min(1, boltFlashEnergy * 0.05);
    boltFlashEnergy = 0;
  }

  // ---------------------------------------------------------------- particle simulation
  function updateParticles(dt) {
    const at = attractor;
    // sparks
    let ns = 0;
    for (let i = 0; i < MAXSPK; i++) {
      if (!spk.alive[i]) continue;
      if (dt > 0) {
        spk.age[i] += dt;
        if (spk.age[i] > spk.life[i]) { spk.alive[i] = 0; continue; }
        const i3 = i * 3;
        let vx = spk.v[i3], vy = spk.v[i3 + 1], vz = spk.v[i3 + 2];
        vy -= 9.8 * spk.grav[i] * dt;
        if (at.strength > 0 || at.swirl > 0) {
          const dx = at.position.x - spk.p[i3], dy = at.position.y - spk.p[i3 + 1], dz = at.position.z - spk.p[i3 + 2];
          const d = Math.hypot(dx, dy, dz) + 1e-3, f = at.strength / (0.4 + d * 0.25) * dt;
          vx += dx / d * f - dz / d * at.swirl * dt; vy += dy / d * f + 9.8 * spk.grav[i] * dt * Math.min(1, at.strength * 0.1); vz += dz / d * f + dx / d * at.swirl * dt;
          if (d < 0.3 && at.strength > 0) { spk.alive[i] = 0; continue; }
        }
        const dr = Math.exp(-spk.drag[i] * dt); vx *= dr; vy *= dr; vz *= dr;
        spk.p[i3] += vx * dt; spk.p[i3 + 1] += vy * dt; spk.p[i3 + 2] += vz * dt;
        if (spk.p[i3 + 1] < 0.01) { spk.p[i3 + 1] = 0.01; if (vy < 0) { vy *= -0.35; vx *= 0.7; vz *= 0.7; } }
        spk.v[i3] = vx; spk.v[i3 + 1] = vy; spk.v[i3 + 2] = vz;
      }
      const i3 = i * 3, o3 = ns * 3, o2 = ns * 2;
      iSpkPos[o3] = spk.p[i3]; iSpkPos[o3 + 1] = spk.p[i3 + 1]; iSpkPos[o3 + 2] = spk.p[i3 + 2];
      iSpkTail[o3] = spk.p[i3] - spk.v[i3] * 0.02; iSpkTail[o3 + 1] = spk.p[i3 + 1] - spk.v[i3 + 1] * 0.02; iSpkTail[o3 + 2] = spk.p[i3 + 2] - spk.v[i3 + 2] * 0.02;
      iSpkS[o2] = spk.size[i]; iSpkS[o2 + 1] = spk.heat[i] * Math.pow(1 - spk.age[i] / spk.life[i], 0.8);
      ns++;
    }
    spkGeo.instanceCount = ns;
    for (const n of ['iPos', 'iTail', 'iS']) spkGeo.getAttribute(n).needsUpdate = true;
    // dark sprites
    let nd = 0;
    for (let i = 0; i < MAXSPR; i++) {
      if (!spr.alive[i]) continue;
      const i3 = i * 3;
      if (dt > 0) {
        spr.age[i] += dt;
        if (spr.age[i] > spr.life[i]) { spr.alive[i] = 0; continue; }
        let vx = spr.v[i3], vy = spr.v[i3 + 1] + spr.buoy[i] * dt, vz = spr.v[i3 + 2];
        if (at.strength > 0 || at.swirl > 0) {
          const dx = at.position.x - spr.p[i3], dy = at.position.y - spr.p[i3 + 1], dz = at.position.z - spr.p[i3 + 2];
          const d = Math.hypot(dx, dy, dz) + 1e-3, f = at.strength / (0.5 + d * 0.3) * dt;
          vx += dx / d * f - dz / d * at.swirl * dt; vy += dy / d * f; vz += dz / d * f + dx / d * at.swirl * dt;
          if (d < 0.35 && at.strength > 0) spr.age[i] = Math.max(spr.age[i], spr.life[i] * 0.85);
        }
        const dr = Math.exp(-spr.drag[i] * dt); vx *= dr; vy *= dr; vz *= dr;
        spr.p[i3] += vx * dt; spr.p[i3 + 1] += vy * dt; spr.p[i3 + 2] += vz * dt;
        if (spr.p[i3 + 1] < 0.04) { spr.p[i3 + 1] = 0.04; vy = Math.abs(vy) * 0.2; }
        spr.v[i3] = vx; spr.v[i3 + 1] = vy; spr.v[i3 + 2] = vz;
        spr.rot[i] += spr.rotV[i] * dt;
      }
      const a = spr.age[i] / spr.life[i];
      const o3 = nd * 3, o4 = nd * 4;
      iSprPos[o3] = spr.p[i3]; iSprPos[o3 + 1] = spr.p[i3 + 1]; iSprPos[o3 + 2] = spr.p[i3 + 2];
      iSprA[o4] = spr.s0[i] + (spr.s1[i] - spr.s0[i]) * (1 - Math.exp(-3 * a)); iSprA[o4 + 1] = spr.rot[i]; iSprA[o4 + 2] = a; iSprA[o4 + 3] = spr.seed[i];
      iSprB[o4] = spr.col[i3]; iSprB[o4 + 1] = spr.col[i3 + 1]; iSprB[o4 + 2] = spr.col[i3 + 2]; iSprB[o4 + 3] = spr.op[i] * Math.min(1, spr.age[i] * 12 + 0.2);
      iSprT[nd] = spr.type[i];
      nd++;
    }
    sprGeo.instanceCount = nd;
    for (const n of ['iPos', 'iA', 'iB', 'iT']) sprGeo.getAttribute(n).needsUpdate = true;
  }

  // ---------------------------------------------------------------- impact frames
  const imp = { active: false, t: 0, frame: 'none', flash: 0, shake: 0, mode: 'axial', dir: new THREE.Vector2(0, 1), fisheye: 0, dim: 0, at: new V3(), held: false };
  const flashLog = [];
  // hold: seconds the world freezes (0.05 warning, 0.1 heavy hit, 0.15 ultimate).
  // frame: 'center' inverts a disc around the hit in two tones, 'full' the whole frame.
  function impact({ hold = 0.1, frame = 'center', flash = 0, shake = 0.012, shakeMode = 'axial', shakeDir = null, fisheye = 0, at = null } = {}) {
    const now = clock.real;
    while (flashLog.length && now - flashLog[0] > 1) flashLog.shift();
    const inverts = frame !== 'none' || flash > 0;
    const safe = options.flashes === 'safe' || (inverts && flashLog.length >= 3);   // never more than 3 flashes a second
    if (inverts && !safe) flashLog.push(now);
    imp.active = true; imp.t = 0; imp.held = hold > 0;
    imp.frame = safe ? 'none' : frame; imp.flash = safe ? 0 : flash; imp.dim = safe && inverts ? 0.32 : 0;
    imp.shake = shake * options.shake; imp.mode = shakeMode; imp.fisheye = fisheye * options.fisheye;
    if (shakeDir) imp.dir.copy(shakeDir).normalize(); else imp.dir.set(0, 1);
    if (at) imp.at.copy(at); else if (orbs[0]) imp.at.copy(orbs[0].position);
    clock.hold = Math.max(clock.hold, hold);
  }

  // ---------------------------------------------------------------- render targets and post
  const rtOpts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: true, samples: 0, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
  const rtColor = new THREE.WebGLRenderTarget(1, 1, rtOpts);
  const rtDistort = new THREE.WebGLRenderTarget(1, 1, rtOpts);
  const BLOOM_LEVELS = 5;
  const down = [], up = [];
  for (let i = 0; i < BLOOM_LEVELS; i++) {
    down.push(new THREE.WebGLRenderTarget(1, 1, { ...rtOpts, depthBuffer: false }));
    up.push(new THREE.WebGLRenderTarget(1, 1, { ...rtOpts, depthBuffer: false }));
  }
  const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const fsScene = new THREE.Scene();
  const fsMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); fsMesh.frustumCulled = false; fsScene.add(fsMesh);
  const pass = (mat, target) => { fsMesh.material = mat; renderer.setRenderTarget(target); renderer.render(fsScene, fsCam); };
  const prefilterMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: null }, uHalf: { value: new THREE.Vector2() }, uThreshold: { value: 0.9 }, uKnee: { value: 0.5 } },
    vertexShader: FS_VERT,
    fragmentShader: /* glsl */`
      uniform sampler2D tSrc; uniform vec2 uHalf; uniform float uThreshold, uKnee; varying vec2 vUv;
      vec3 pick(vec2 uv){
        vec3 c = texture2D(tSrc, uv).rgb; float br = max(c.r, max(c.g, c.b));
        float soft = clamp(br - uThreshold + uKnee, 0., 2. * uKnee); soft = soft * soft / (4. * uKnee + 1e-4);
        return c * max(soft, br - uThreshold) / max(br, 1e-4);
      }
      void main(){
        vec3 c = pick(vUv + vec2(-uHalf.x, -uHalf.y)) + pick(vUv + vec2(uHalf.x, -uHalf.y)) + pick(vUv + vec2(-uHalf.x, uHalf.y)) + pick(vUv + uHalf);
        gl_FragColor = vec4(min(c * .25, vec3(60.)), 1.);
      }`,
    depthTest: false, depthWrite: false,
  });
  const downMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: null }, uHalf: { value: new THREE.Vector2() } },
    vertexShader: FS_VERT,
    fragmentShader: /* glsl */`
      uniform sampler2D tSrc; uniform vec2 uHalf; varying vec2 vUv;
      void main(){
        vec4 s = texture2D(tSrc, vUv) * 4.;
        s += texture2D(tSrc, vUv - uHalf); s += texture2D(tSrc, vUv + uHalf);
        s += texture2D(tSrc, vUv + vec2(uHalf.x, -uHalf.y)); s += texture2D(tSrc, vUv - vec2(uHalf.x, -uHalf.y));
        gl_FragColor = s / 8.;
      }`,
    depthTest: false, depthWrite: false,
  });
  const upMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: null }, tSkip: { value: null }, uHalf: { value: new THREE.Vector2() } },
    vertexShader: FS_VERT,
    fragmentShader: /* glsl */`
      uniform sampler2D tSrc, tSkip; uniform vec2 uHalf; varying vec2 vUv;
      void main(){
        vec2 h = uHalf;
        vec4 s = texture2D(tSrc, vUv + vec2(-h.x * 2., 0.)) + texture2D(tSrc, vUv + vec2(-h.x, h.y)) * 2.
               + texture2D(tSrc, vUv + vec2(0., h.y * 2.)) + texture2D(tSrc, vUv + vec2(h.x, h.y)) * 2.
               + texture2D(tSrc, vUv + vec2(h.x * 2., 0.)) + texture2D(tSrc, vUv + vec2(h.x, -h.y)) * 2.
               + texture2D(tSrc, vUv + vec2(0., -h.y * 2.)) + texture2D(tSrc, vUv + vec2(-h.x, -h.y)) * 2.;
        gl_FragColor = s / 12. + texture2D(tSkip, vUv);
      }`,
    depthTest: false, depthWrite: false,
  });
  const compositeMat = new THREE.ShaderMaterial({
    uniforms: {
      tColor: { value: rtColor.texture }, tDistort: { value: rtDistort.texture }, tBloom: { value: up[0].texture },
      uAspect: { value: 1 }, uBloom: { value: 0.12 }, uExposure: { value: 1 },
      uShake: { value: new THREE.Vector2() }, uZoom: { value: 1 }, uFisheye: { value: 0 },
      uFrame: { value: 0 }, uFrameFull: { value: 0 }, uNegRadius: { value: 0.42 }, uCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uFlash: { value: 0 }, uDim: { value: 0 }, uTime: { value: 0 }, uGrain: { value: 0.035 }, uVignette: { value: 0.55 },
    },
    vertexShader: FS_VERT,
    fragmentShader: /* glsl */`
      uniform sampler2D tColor, tDistort, tBloom;
      uniform float uAspect, uBloom, uExposure, uZoom, uFisheye, uFrame, uFrameFull, uNegRadius, uFlash, uDim, uTime, uGrain, uVignette;
      uniform vec2 uShake, uCenter;
      varying vec2 vUv;
      vec3 aces(vec3 x){ return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
      vec3 srgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(.0031308, c)); }
      void main(){
        vec2 p = vUv - .5; p.x *= uAspect;
        float r2 = dot(p, p);
        p *= (1. + uFisheye * r2 * 1.8) / (1. + uFisheye * .45);       // barrel: the centre swells toward the lens
        p = p / uZoom + uShake;
        vec2 uv = vec2(p.x / uAspect, p.y) + .5;
        vec2 d = texture2D(tDistort, uv).xy; d.x /= uAspect;
        float dl = length(d);
        vec2 dir = dl > 1e-5 ? d / dl : vec2(0.);
        float ca = min(dl * .2 + uFisheye * .006 * sqrt(r2), .003);   // the split follows the tear in the air
        vec3 col;
        col.r = texture2D(tColor, uv + d + dir * ca).r;
        col.g = texture2D(tColor, uv + d).g;
        col.b = texture2D(tColor, uv + d - dir * ca).b;
        col += texture2D(tBloom, uv + d).rgb * uBloom;
        col = aces(col * uExposure);
        if (uFrame > 0.) {
          float l = dot(col, vec3(.2126, .7152, .0722));
          float ink = smoothstep(.26, .34, l);
          vec2 q = vUv - uCenter; q.x *= uAspect;
          float m = uFrameFull > .5 ? 1. : 1. - smoothstep(uNegRadius * .7, uNegRadius, length(q));
          vec3 neg = mix(vec3(.93, .965, 1.), vec3(.012, .014, .022), ink);   // energy turns to ink on white
          col = mix(col, mix(col * .3, neg, m), uFrame);
        }
        col = mix(col, vec3(.95, .97, 1.), uFlash);
        col *= 1. - uDim;
        vec2 vq = vUv - .5; col *= 1. - uVignette * dot(vq, vq) * 1.6;
        col = srgb(clamp(col, 0., 1.));
        float g = fract(sin(dot(vUv * vec2(1931., 1087.) + floor(uTime * 24.) * vec2(17., 31.), vec2(12.9898, 78.233))) * 43758.5453);
        gl_FragColor = vec4(col + (g - .5) * uGrain, 1.);
      }`,
    depthTest: false, depthWrite: false,
  });

  let W = 1, H = 1, pendingDt = 0;
  function setSize(width, height, pixelRatio = 1) {
    W = Math.max(1, Math.round(width)); H = Math.max(1, Math.round(height)); dpr = pixelRatio;
    res.set(W, H); uniforms.uDpr.value = dpr;
    rtColor.setSize(W, H);
    rtDistort.setSize(Math.ceil(W / 2), Math.ceil(H / 2));
    let w = Math.ceil(W / 2), h = Math.ceil(H / 2);
    for (let i = 0; i < BLOOM_LEVELS; i++) { down[i].setSize(w, h); up[i].setSize(w, h); w = Math.max(1, Math.ceil(w / 2)); h = Math.max(1, Math.ceil(h / 2)); }
    compositeMat.uniforms.uAspect.value = W / H;
  }

  const _proj = new V3();
  function updateImpact(realDt) {
    const U = compositeMat.uniforms;
    let shakeX = 0, shakeY = 0, zoom = 1, fish = 0, frame = 0, flash = 0, dim = 0;
    if (imp.active) {
      if (clock.hold > 0) {
        frame = imp.frame !== 'none' ? 1 : 0; fish = imp.fisheye;
        if (imp.mode === 'radial') zoom = 1 + imp.shake * 1.2;
        dim = imp.dim;
      } else {
        imp.t += realDt; const t = imp.t;
        if (imp.mode === 'axial') {
          const s = -imp.shake * Math.exp(-7 * t) * Math.cos(2 * Math.PI * 5.5 * t);   // sharp drop, then rebound
          shakeX = imp.dir.x * s + imp.shake * 0.15 * Math.exp(-9 * t) * Math.sin(t * 91);
          shakeY = imp.dir.y * s;
        } else {
          zoom = 1 + imp.shake * 1.4 * Math.exp(-6 * t) * Math.cos(2 * Math.PI * 7 * t);
          shakeX = imp.shake * Math.exp(-8 * t) * Math.sin(t * 113 + 1.7);
          shakeY = imp.shake * Math.exp(-8 * t) * Math.sin(t * 97);
        }
        flash = imp.flash * Math.exp(-t / 0.07);
        dim = imp.dim * Math.exp(-t / 0.12);
        fish = imp.fisheye * Math.exp(-t * 2.2);
        if (t > 1.6) imp.active = false;
      }
      _proj.copy(imp.at).project(camera);
      U.uCenter.value.set(_proj.x * 0.5 + 0.5, _proj.y * 0.5 + 0.5);
    }
    U.uShake.value.set(shakeX, shakeY);
    U.uZoom.value = zoom * (1 + Math.hypot(shakeX, shakeY) * 2.2);       // overscan so the shake never shows an edge
    U.uFisheye.value = fish; U.uFrame.value = frame; U.uFrameFull.value = imp.frame === 'full' ? 1 : 0;
    U.uFlash.value = flash; U.uDim.value = dim; U.uTime.value = clock.real;
  }

  function updateLights(dt) {
    for (let i = 0; i < 4; i++) {
      const L = lights[i];
      if (i !== 0) L.energy *= Math.exp(-L.decay * dt);
      L.color.copy(palette.glow);
      if (L.warm > 0) L.color.lerp(WARM, Math.min(1, L.warm * L.energy / 6));
      lightCol[i].set(L.color.r, L.color.g, L.color.b).multiplyScalar(L.energy);
      if (i === 0) L.energy = 0;            // orb light is re-asserted every frame while the orb is visible
    }
  }

  // ---------------------------------------------------------------- frame
  function update(realDt) {
    realDt = Math.min(Math.max(realDt, 0), 0.1);
    clock.real += realDt;
    if (clock.rampT < 1) {
      clock.rampT = Math.min(1, clock.rampT + realDt / clock.rampDur);
      const e = clock.rampT * clock.rampT * (3 - 2 * clock.rampT);
      clock.rampValue = clock.rampFrom + (clock.rampTo - clock.rampFrom) * e;
    }
    let simDt;
    const wasHeld = clock.hold > 0;
    if (wasHeld) { clock.hold = Math.max(0, clock.hold - realDt); simDt = 0; }
    else simDt = realDt * clock.base * clock.rampValue;
    clock.sim += simDt; pendingDt += simDt;
    uniforms.uTime.value = clock.sim;
    if (!wasHeld) {
      const arcDt = realDt * clock.base * Math.max(clock.rampValue, options.arcFloor);
      clock.arcAcc += arcDt;
      const tick = 1 / options.arcHz;
      let ticks = 0;
      while (clock.arcAcc >= tick && ticks < 3) { clock.arcAcc -= tick; arcTick(); ticks++; }
      if (ticks === 3) clock.arcAcc = 0;
      clock.arcPhase = clock.arcAcc / tick;
    }
    updateOrbs(simDt);
    updateTrails(simDt);
    updateVortices(simDt);
    updateRings(simDt);
    updateCones(simDt);
    for (const S of scorches) {
      if (!S.alive) continue;
      S.age += simDt;
      if (S.age > S.life) { S.alive = false; S.mesh.visible = false; continue; }
      const x = S.age / S.life;
      S.m.uniforms.uAge.value = x; S.m.uniforms.uHeat.value = Math.exp(-S.age * 2.4);
      S.m.uniforms.uGlow.value.set(palette.glow.r, palette.glow.g, palette.glow.b);
    }
    updateLights(simDt);
    for (const h of heat) h.w *= Math.exp(-simDt * 1.3);
    updateImpact(realDt);
    return simDt;
  }

  function render() {
    const dt = pendingDt; pendingDt = 0;              // spawns made after update() still get this frame's step
    updateDebris(dt);
    updateParticles(dt);
    buildBolts();
    buildSmoke();
    boltMat.uniforms.uGlow.value.set(palette.glow.r, palette.glow.g, palette.glow.b);
    smokeMat.uniforms.uSmoke.value.set(palette.smoke.r, palette.smoke.g, palette.smoke.b);
    sprMat.uniforms.uEmber.value.set(palette.ember.r, palette.ember.g, palette.ember.b);
    const additive = options.afterimage === 'additive';
    for (const m of [smokeMat, sprMat]) {
      const dst = additive ? THREE.OneFactor : THREE.OneMinusSrcAlphaFactor;
      if (m.blendDst !== dst) { m.blendDst = dst; m.needsUpdate = true; }
    }
    const prevTarget = renderer.getRenderTarget();
    const prevMask = camera.layers.mask;
    renderer.getClearColor(_col); const prevAlpha = renderer.getClearAlpha();
    renderer.setRenderTarget(rtColor); renderer.clear(); renderer.render(scene, camera);
    const bg = scene.background; scene.background = null;
    camera.layers.set(DISTORT_LAYER);
    renderer.setClearColor(0x000000, 0); renderer.setRenderTarget(rtDistort); renderer.clear(); renderer.render(scene, camera);
    camera.layers.mask = prevMask; scene.background = bg;
    renderer.setClearColor(_col, prevAlpha);
    prefilterMat.uniforms.tSrc.value = rtColor.texture; prefilterMat.uniforms.uHalf.value.set(0.5 / W, 0.5 / H);
    pass(prefilterMat, down[0]);
    for (let i = 1; i < BLOOM_LEVELS; i++) {
      downMat.uniforms.tSrc.value = down[i - 1].texture; downMat.uniforms.uHalf.value.set(0.5 / down[i - 1].width, 0.5 / down[i - 1].height);
      pass(downMat, down[i]);
    }
    let src = down[BLOOM_LEVELS - 1];
    for (let i = BLOOM_LEVELS - 2; i >= 0; i--) {
      upMat.uniforms.tSrc.value = src.texture; upMat.uniforms.tSkip.value = down[i].texture; upMat.uniforms.uHalf.value.set(0.5 / src.width, 0.5 / src.height);
      pass(upMat, up[i]); src = up[i];
    }
    pass(compositeMat, prevTarget);
  }

  // Compile every effect's program before the first hit, against the same render
  // target the colour pass uses, so the first strike does not hitch on a shader compile.
  function warmup() {
    const hidden = [];
    group.traverse((o) => { if ((o.isMesh || o.isInstancedMesh) && !o.visible) { hidden.push(o); o.visible = true; } });
    const prev = renderer.getRenderTarget(), mask = camera.layers.mask;
    renderer.setRenderTarget(rtColor);
    camera.layers.enableAll();
    renderer.compile(scene, camera);
    for (const m of [prefilterMat, downMat, upMat]) { fsMesh.material = m; renderer.compile(fsScene, fsCam); }
    renderer.setRenderTarget(null); fsMesh.material = compositeMat; renderer.compile(fsScene, fsCam);
    renderer.setRenderTarget(prev); camera.layers.mask = mask;
    for (const o of hidden) o.visible = false;
  }

  function dispose() {
    scene.remove(group);
    group.traverse((o) => { if (o.material) o.material.dispose?.(); });
    for (const g of [boltGeo, smokeGeo, sprGeo, spkGeo, rockGeo, ringGeo, coneGeo, scorchGeo, orbGeo]) g.dispose();
    for (const rt of [rtColor, rtDistort, ...down, ...up]) rt.dispose();
    for (const m of [prefilterMat, downMat, upMat, compositeMat]) m.dispose();
  }

  const fx = {
    options, palette, group, lightUniforms, heatUniforms, attractor, skyFlash: 0, post: compositeMat.uniforms,
    get time() { return clock.sim; }, get realTime() { return clock.real; }, get holding() { return clock.hold > 0; },
    get timeScale() { return clock.base; }, set timeScale(v) { clock.base = v; },
    get rampValue() { return clock.rampValue; },
    createOrb, createTrail, bolt, sparks, debris, puff, shards, burst, blast, ring, scorch, vortex, impact, ramp, repeat,
    spawnSpark, spawnSprite,
    update, render, setSize, warmup, dispose,
    stats: () => ({ bolts: bolts.filter((b) => b.alive).length, sparks: spkGeo.instanceCount, sprites: sprGeo.instanceCount, debris: debMesh.count, trails: trails.length }),
  };
  return fx;
}
