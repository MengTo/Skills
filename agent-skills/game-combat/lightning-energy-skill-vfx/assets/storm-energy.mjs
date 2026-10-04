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
// Periodic classic Perlin noise (Ashima / Stefan Gustavson, MIT), used once at start-up to
// bake a tiling 3D noise texture. Needs NOISE_GLSL's mod289/permute/taylorInvSqrt.
const PNOISE_GLSL = /* glsl */`
vec3 fade3(vec3 t){ return t * t * t * (t * (t * 6. - 15.) + 10.); }
float pnoise(vec3 P, vec3 rep){
  vec3 Pi0 = mod(floor(P), rep), Pi1 = mod(Pi0 + vec3(1.), rep);
  Pi0 = mod289(Pi0); Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P), Pf1 = Pf0 - vec3(1.);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x), iy = vec4(Pi0.yy, Pi1.yy);
  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + Pi0.zzzz), ixy1 = permute(ixy + Pi1.zzzz);
  vec4 gx0 = ixy0 * (1. / 7.), gy0 = fract(floor(gx0) * (1. / 7.)) - .5; gx0 = fract(gx0);
  vec4 gz0 = vec4(.5) - abs(gx0) - abs(gy0), sz0 = step(gz0, vec4(0.));
  gx0 -= sz0 * (step(0., gx0) - .5); gy0 -= sz0 * (step(0., gy0) - .5);
  vec4 gx1 = ixy1 * (1. / 7.), gy1 = fract(floor(gx1) * (1. / 7.)) - .5; gx1 = fract(gx1);
  vec4 gz1 = vec4(.5) - abs(gx1) - abs(gy1), sz1 = step(gz1, vec4(0.));
  gx1 -= sz1 * (step(0., gx1) - .5); gy1 -= sz1 * (step(0., gy1) - .5);
  vec3 g000 = vec3(gx0.x, gy0.x, gz0.x), g100 = vec3(gx0.y, gy0.y, gz0.y), g010 = vec3(gx0.z, gy0.z, gz0.z), g110 = vec3(gx0.w, gy0.w, gz0.w);
  vec3 g001 = vec3(gx1.x, gy1.x, gz1.x), g101 = vec3(gx1.y, gy1.y, gz1.y), g011 = vec3(gx1.z, gy1.z, gz1.z), g111 = vec3(gx1.w, gy1.w, gz1.w);
  vec4 n0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= n0.x; g010 *= n0.y; g100 *= n0.z; g110 *= n0.w;
  vec4 n1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= n1.x; g011 *= n1.y; g101 *= n1.z; g111 *= n1.w;
  vec4 nz = mix(vec4(dot(g000, Pf0), dot(g100, vec3(Pf1.x, Pf0.yz)), dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z)), dot(g110, vec3(Pf1.xy, Pf0.z))),
                vec4(dot(g001, vec3(Pf0.xy, Pf1.z)), dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z)), dot(g011, vec3(Pf0.x, Pf1.yz)), dot(g111, Pf1)), fade3(Pf0).z);
  vec2 nyz = mix(nz.xy, nz.zw, fade3(Pf0).y);
  return 2.2 * mix(nyz.x, nyz.y, fade3(Pf0).x);
}`;

// Four independent noises, baked into a 96³ texture that tiles every 6 units (16 texels a
// cell: at 8, sharp thresholds showed the trilinear facets as stair-steps). One
// texture fetch replaces four procedural noise calls: the orb, corona and smoke all
// sample it, and the frame cost of the largest orb dropped several times over.
export const TNOISE_GLSL = /* glsl */`
uniform sampler3D tNoise;
vec4 tn(vec3 p){ return texture(tNoise, p * (1. / 6.)) * 2. - 1.; }
float tfbm2(vec3 p){ return tn(p).x * .5 + tn(p * 2.03 + 1.7).y * .25; }
float tfbm3(vec3 p){ return tn(p).x * .5 + tn(p * 2.03 + 1.7).y * .25 + tn(p * 4.07 + 3.1).z * .125; }
`;

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
uniform float uMaxPx;
varying vec4 vData;
varying vec2 vExtra;
varying float vPx;
varying float vDepth;
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
  float px = min(max(aData.z * projectionMatrix[1][1] * hr.y / max(c.w, 1e-3), aData.w), uMaxPx);
  c.xy += n * aData.x * px * .5 / hr * c.w;
  vData = aData; vExtra = aExtra; vPx = px; vDepth = c.w;
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
    dust: new THREE.Color(0.024, 0.028, 0.036),    // ground dust, low, cool, close to the ground's own value
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
    tNoise: { value: null },          // baked in the post section below
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
  const MAXP = 129, MAXBOLTS = 260;
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
        const f = 0.5 + (rnd() - 0.5) * 0.36;           // an uneven split: equal halves read as even, drawn segments
        let mx = src[i3] + (src[i3 + 3] - src[i3]) * f, my = src[i3 + 1] + (src[i3 + 4] - src[i3 + 1]) * f, mz = src[i3 + 2] + (src[i3 + 5] - src[i3 + 2]) * f;
        const th = rnd() * 6.2832, g = (rnd() + rnd() + rnd() - 1.5) / 1.5;
        const k0 = l === 0 ? 0.6 : 1;                    // a softer first kink: full strength there bends bolts at right angles
        const cu = Math.cos(th) * amp * g * k0, cw = Math.sin(th) * amp * g * k0;
        out[m++] = mx + _u.x * cu + _w.x * cw; out[m++] = my + _u.y * cu + _w.y * cw; out[m++] = mz + _u.z * cu + _w.z * cw;
      }
      const l3 = (n - 1) * 3;
      out[m++] = src[l3]; out[m++] = src[l3 + 1]; out[m++] = src[l3 + 2];
      n = n * 2 - 1; src = out; amp *= 0.5;
    }
    if (gen.hasBend) {                               // bow along a parabola: a single midpoint kink made brackets
      for (let i = 0; i < n; i++) { const t = i / (n - 1), k = 4 * t * (1 - t); src[i * 3] += gen.bend.x * k; src[i * 3 + 1] += gen.bend.y * k; src[i * 3 + 2] += gen.bend.z * k; }
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
    const big = R(0.85, 1.45);                       // not every trunk is the same weight
    B.alive = true; B.branch = false; B.anchor = anchor; B.width = width * big; B.minPx = minPx * big; B.I = intensity;
    B.life = options.lightning === 'tween' ? life * 5 : life; B.age = 0; B.seed = rnd();
    B.gen.a.copy(a); B.gen.b.copy(b); B.gen.levels = Math.min(levels + (a.distanceTo(b) > 1.5 ? 1 : 0), 7); B.gen.jag = jag;   // long bolts get a finer level
    B.gen.hasBend = !!bend; if (bend) B.gen.bend.copy(bend);
    B.n = shape(B.pts, B.gen); B.from.set(B.pts.subarray(0, B.n * 3));
    const len = a.distanceTo(b);
    boltFlashEnergy += len * intensity;
    if (len * intensity > 0.6) { _a.addVectors(a, b).multiplyScalar(0.5); if (anchor) _a.add(anchor); flashLight(2, _a, Math.min(len * intensity * 2.2, 26), 18); }
    // Forks leave from the first two-thirds, thinner and dimmer, taper to nothing, and fork again.
    fork(B, branches, len, 0);
  }
  function fork(P, count, len, depth) {
    for (let k = 0; k < count; k++) {
      if (P.n < 9 || rnd() < 0.2) continue;
      const i = Math.floor(P.n * R(0.15, 0.7)), i3 = i * 3;
      const F = freeBolt(); if (F === P) continue;
      _b.set(P.pts[i3], P.pts[i3 + 1], P.pts[i3 + 2]);
      _c.set(P.pts[i3 + 3] - P.pts[i3 - 3], P.pts[i3 + 4] - P.pts[i3 - 2], P.pts[i3 + 5] - P.pts[i3 - 1]).normalize();
      _d.set(R(-1, 1), R(-1, 1), R(-1, 1)).multiplyScalar(0.75); _c.add(_d).normalize();
      const fl = len * R(0.2, 0.42) * (depth ? 0.6 : 1);
      F.alive = true; F.branch = true; F.anchor = P.anchor; F.width = P.width * (depth ? 0.6 : 0.42); F.minPx = P.minPx * (depth ? 0.6 : 0.42); F.I = P.I * (depth ? 0.7 : 0.55);
      F.life = P.life; F.age = 0; F.seed = rnd();
      F.gen.a.copy(_b); F.gen.b.copy(_b).addScaledVector(_c, fl); F.gen.levels = Math.max(3, P.gen.levels - 1); F.gen.jag = P.gen.jag * 1.1; F.gen.hasBend = false;
      F.n = shape(F.pts, F.gen); F.from.set(F.pts.subarray(0, F.n * 3));
      if (depth < 1 && fl > 0.25) fork(F, rnd() < 0.6 ? 2 : 1, fl, depth + 1);   // a second generation of fine forks
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
    uniforms: { uResolution: uniforms.uResolution, uDpr: uniforms.uDpr, uMaxPx: { value: 30 }, uCore: { value: new V3(0.9, 0.96, 1) }, uGlow: { value: new V3() } },
    vertexShader: RIBBON_VERT,
    fragmentShader: /* glsl */`
      uniform vec3 uCore; uniform vec3 uGlow; uniform float uDpr;
      varying vec4 vData; varying vec2 vExtra; varying float vPx; varying float vDepth;
      void main(){
        float px = abs(vData.x) * vPx * .5;
        float coreR = max(.7 * uDpr, vPx * .07);                // thick trunks get thicker cores: hierarchy, not uniform lines
        float core = exp(-(px * px) / (coreR * coreR));
        float glow = exp(-px / (vPx * .3)) * (1. - abs(vData.x));
        gl_FragColor = vec4((uCore * core * 6. + uGlow * glow * 2.4) * vExtra.x * smoothstep(.5, 1.8, vDepth), 1.);   // fade by the lens
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
        // trunks taper hard and swell and pinch along their length; branches thin to nothing
        const taper = B.branch ? 0.08 + 0.92 * Math.pow(1 - t, 1.2) : (1 - 0.85 * Math.pow(t, 1.3)) * (0.78 + 0.3 * Math.sin(i * 0.9 + B.seed * 40));   // trunks end in a point, not a tube cap
        const w = B.width * taper, mp = B.minPx * taper;
        for (let s = -1; s <= 1; s += 2) {
          writeRibbonVertex(boltArrs, v++, P[i3] + ox, P[i3 + 1] + oy, P[i3 + 2] + oz,
            P[p3] + ox, P[p3 + 1] + oy, P[p3 + 2] + oz, P[n3] + ox, P[n3 + 1] + oy, P[n3 + 2] + oz,
            s, t, w * 1.35, mp * dpr * 1.35, I, B.seed);
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
  // erode: extra erosion from birth (0–0.4). Raise it for long-lived streams like a cloak,
  // which otherwise stay solid enough to read as straight bars at a distance.
  // chain: lay a billow every `chain` metres along the path (0 = off), chainSize × width across.
  // Billows give the trail volume; the ribbon stays a thin torn core inside it.
  function createTrail({ width = 0.6, life = 0.8, spacing = 0.06, drift = null, jitter = 0.35, shards = 0.5, billows = 0.45, opacity = 1, erode = 0, chain = 0, chainSize = 1.6 } = {}) {
    const T = {
      width, life, spacing, jitter, shards, billows, opacity, erode, chain, chainSize, chainAcc: 0, active: true, drift: drift ? drift.clone() : new V3(),
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
        if (k > 0) {
          const j = (k - 1) * 3, seg = Math.hypot(pos.x - T.p[j], pos.y - T.p[j + 1], pos.z - T.p[j + 2]);
          T.total += seg;
          if (T.chain > 0) {
            T.chainAcc += seg; let made = 0;
            while (T.chainAcc >= T.chain && made++ < 6) {
              T.chainAcc -= T.chain;
              const f = 1 - T.chainAcc / Math.max(seg, 1e-4);
              _e.set(T.p[j] + (pos.x - T.p[j]) * f, T.p[j + 1] + (pos.y - T.p[j + 1]) * f, T.p[j + 2] + (pos.z - T.p[j + 2]) * f);
              _sa.set(pos.x - T.p[j], pos.y - T.p[j + 1], pos.z - T.p[j + 2]);
              const ang = screenAngle(_e, _sa.normalize());
              spawnSprite(0, _e, _c.copy(T.drift).multiplyScalar(0.5).add(_d.set(R(-0.2, 0.2), R(0, 0.25), R(-0.2, 0.2))), { size: T.width * T.chainSize * R(0.75, 1.2), grow: 1.8, life: T.life * R(0.9, 1.35), opacity: 0.8, drag: 1.8, buoy: 0.12, angle: ang, aspect: 1.8 });
            }
          }
        }
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
    uniforms: { uResolution: uniforms.uResolution, uMaxPx: { value: 1e5 }, uTime: uniforms.uTime, tNoise: uniforms.tNoise, uSmoke: { value: new V3() } },
    vertexShader: RIBBON_VERT,
    fragmentShader: TNOISE_GLSL + /* glsl */`
      uniform float uTime; uniform vec3 uSmoke;
      varying vec4 vData; varying vec2 vExtra; varying float vDepth;
      void main(){
        float v = vData.x, age = vData.y;
        float across = 1. - v * v;
        // warped across, streaked along the motion: torn cloak and speed lines, not a plank
        vec3 q = vec3(vExtra.x * 1.3 - uTime * .2, v * 2.1, vExtra.y + uTime * .25);
        q.y += tn(vec3(vExtra.x * .6, v * 1.1, vExtra.y + uTime * .3)).w * 1.1;
        float n = tfbm3(q);
        float tatter = tfbm2(vec3(vExtra.x * 3.4 - uTime * .3, v * 3.8, vExtra.y * 1.7 + uTime * .45)) * 1.3;   // fine rips along the edge
        // the noise moves the edge by most of the half-width, so the outline is torn, never the ribbon's side
        float d = across * 1.45 - .45 + n * .85 + tatter * .55;             // no lengthwise streak term: it drew striations
        float th = mix(.32 + vData.w, 1.05, pow(age, .8));      // erosion rises with age (vData.w: the trail's erode)
        float a = smoothstep(th - .08, th + .3, d) * vData.z * smoothstep(.8, 2.6, vDepth);   // vData.z: opacity; fade near the lens
        a *= smoothstep(0., .16, across);                      // whatever the noise, nothing reaches the ribbon's side
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
        const head = T.active && T.taper !== false ? Math.min(1, (T.n - 1 - i) / 3) : 1;   // taper into the emitter
        const sw = 0.65 + 0.35 * Math.sin(T.dist[i] * 1.7 + T.seed) + 0.2 * Math.sin(T.dist[i] * 4.1 + T.seed * 2);
        const w = T.width * (1 + 0.9 * age) * (0.35 + 0.65 * head) * sw;
        for (let s = -1; s <= 1; s += 2) {
          writeRibbonVertex(sArrs, v, T.p[i3], T.p[i3 + 1], T.p[i3 + 2], T.p[p3], T.p[p3 + 1], T.p[p3 + 2], T.p[n3], T.p[n3 + 1], T.p[n3 + 2], s, age, w, T.erode, T.dist[i], T.seed);
          // fade both ends: a stopped trail's head was a blunt square cut
          sOpacity[v] = T.opacity * Math.min(1, i / 3) * (T.active ? 1 : Math.min(1, (T.n - 1 - i) / 4)); v++;
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
  const spr = { n: 0, alive: new Uint8Array(MAXSPR), type: new Uint8Array(MAXSPR), asp: new Float32Array(MAXSPR), p: new Float32Array(MAXSPR * 3), v: new Float32Array(MAXSPR * 3), s0: new Float32Array(MAXSPR), s1: new Float32Array(MAXSPR), rot: new Float32Array(MAXSPR), rotV: new Float32Array(MAXSPR), age: new Float32Array(MAXSPR), life: new Float32Array(MAXSPR), drag: new Float32Array(MAXSPR), buoy: new Float32Array(MAXSPR), col: new Float32Array(MAXSPR * 3), op: new Float32Array(MAXSPR), seed: new Float32Array(MAXSPR) };
  let sprCursor = 0;
  // angle/aspect: lay a billow along a direction on screen (screenAngle) and stretch it there,
  // so a chain of them reads as a stream, not a string of beads
  function spawnSprite(type, pos, vel, { size = 0.5, grow = 2.2, life = 1, drag = 1.6, buoy = 0.3, color = palette.smoke, opacity = 1, angle = null, aspect = 1 } = {}) {
    let i = -1;
    for (let k = 0; k < MAXSPR; k++) { const j = (sprCursor + k) % MAXSPR; if (!spr.alive[j]) { i = j; break; } }
    if (i < 0) i = sprCursor;
    sprCursor = (i + 1) % MAXSPR;
    const i3 = i * 3;
    spr.alive[i] = 1; spr.type[i] = type;
    spr.p[i3] = pos.x; spr.p[i3 + 1] = pos.y; spr.p[i3 + 2] = pos.z;
    spr.v[i3] = vel.x; spr.v[i3 + 1] = vel.y; spr.v[i3 + 2] = vel.z;
    spr.s0[i] = size; spr.s1[i] = size * grow; spr.asp[i] = aspect;
    spr.rot[i] = angle === null ? R(0, 6.28) : angle + R(-0.12, 0.12); spr.rotV[i] = angle === null ? R(-2, 2) * (type === 1 ? 3 : 0.4) : 0;
    spr.age[i] = 0; spr.life[i] = life; spr.drag[i] = drag; spr.buoy[i] = buoy;
    spr.col[i3] = color.r; spr.col[i3 + 1] = color.g; spr.col[i3 + 2] = color.b; spr.op[i] = opacity; spr.seed[i] = rnd() * 100;
  }
  const sprGeo = new THREE.InstancedBufferGeometry();
  { const q = new THREE.PlaneGeometry(1, 1); sprGeo.index = q.index; sprGeo.setAttribute('position', q.getAttribute('position')); }
  const iSprPos = new Float32Array(MAXSPR * 3), iSprA = new Float32Array(MAXSPR * 4), iSprB = new Float32Array(MAXSPR * 4), iSprT = new Float32Array(MAXSPR * 2);
  const idyn = (arr, n) => new THREE.InstancedBufferAttribute(arr, n).setUsage(THREE.DynamicDrawUsage);
  sprGeo.setAttribute('iPos', idyn(iSprPos, 3)); sprGeo.setAttribute('iA', idyn(iSprA, 4)); sprGeo.setAttribute('iB', idyn(iSprB, 4)); sprGeo.setAttribute('iT', idyn(iSprT, 2));
  sprGeo.instanceCount = 0;
  const sprMat = new THREE.ShaderMaterial({
    uniforms: { uTime: uniforms.uTime, tNoise: uniforms.tNoise, uEmber: { value: new V3() } },
    vertexShader: /* glsl */`
      attribute vec3 iPos; attribute vec4 iA; attribute vec4 iB; attribute vec2 iT;   // type, aspect
      varying vec2 vQ; varying vec4 vA; varying vec4 vB; varying float vT; varying float vY;
      void main(){
        vec4 mv = viewMatrix * vec4(iPos, 1.);
        float c = cos(iA.y), s = sin(iA.y);
        vec2 p = position.xy;
        if (iT.x > .5) p.x *= .55;                  // flakes are a little longer than wide
        else p *= vec2(iT.y, 1. / sqrt(iT.y));        // billows laid along a path stretch along it
        mv.xy += vec2(c * p.x - s * p.y, s * p.x + c * p.y) * iA.x;
        vQ = position.xy * 2.; vA = iA; vB = iB; vT = iT.x;
        vY = (inverse(viewMatrix) * mv).y;                 // world height of this fragment's quad corner
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: TNOISE_GLSL + /* glsl */`
      uniform float uTime; uniform vec3 uEmber;
      varying vec2 vQ; varying vec4 vA; varying vec4 vB; varying float vT; varying float vY;
      void main(){
        float age = vA.z, seed = vA.w;
        float a;
        if (vT < .5) {
          // billow: soft disc broken by noise, eroding as it ages
          float r = length(vQ);
          float n = (tfbm3(vec3(vQ * 2.1, seed + age * 1.1)) + tn(vec3(vQ * 6.4, seed * 1.3 + age * 2.)).w * .14) * .5 + .5;
          float th = mix(.16, .78, age);
          a = smoothstep(th, th + .07, n * smoothstep(1., .2, r));   // a crisp, torn edge: a soft one read as an out-of-focus smear
        } else {
          // flake: an irregular torn polygon, like ash or a scrap of cloak
          float ang = atan(vQ.y, vQ.x);
          float lim = .62 + .26 * tn(vec3(cos(ang) * 1.3, sin(ang) * 1.3, seed)).x + .08 * tn(vec3(cos(ang) * 4., sin(ang) * 4., seed + 5.)).y;
          a = 1. - smoothstep(lim - .05, lim, length(vQ));
          a *= smoothstep(mix(-.2, .7, age), mix(-.1, .8, age), tn(vec3(vQ * 2.2, seed)).z * .5 + .5);
        }
        a *= vB.a * (1. - smoothstep(.75, 1., age));
        a *= smoothstep(0., .22, vY);                       // a soft particle against the ground plane: no straight cut line
        gl_FragColor = vec4(vB.rgb * a, a);
      }`,
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
  const sprMesh = new THREE.Mesh(sprGeo, sprMat); sprMesh.frustumCulled = false; sprMesh.renderOrder = 11;
  group.add(sprMesh);

  const _sa = new V3(), _sb = new V3();
  function screenAngle(pos, dir) {
    _sa.copy(pos).project(camera); _sb.copy(pos).addScaledVector(dir, 0.2).project(camera);
    return Math.atan2((_sb.y - _sa.y), (_sb.x - _sa.x) * (W / H));
  }

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
        float hh = abs(vHeat);
        vec3 c = vHeat > .5 ? mix(mid, hot, (vHeat - .5) * 2.) : mix(cool, mid, vHeat * 2.);
        if (vHeat < 0.) c = mix(vec3(.2, .4, 1.2), vec3(2.4, 3.1, 4.2), hh);    // negative heat: cold motes of the orb
        gl_FragColor = vec4(c * a * smoothstep(0., .08, hh), 1.);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const spkMesh = new THREE.Mesh(spkGeo, spkMat); spkMesh.frustumCulled = false; spkMesh.renderOrder = 31;
  group.add(spkMesh);

  // ---------------------------------------------------------------- debris: lit chips that land and rest
  const MAXDEB = 160;
  const rockGeo = (() => {
    const g = new THREE.DodecahedronGeometry(1, 2);         // subdivided twice, then jittered: a chip, not a low-poly gem
    const p = g.getAttribute('position');
    const key = (x, y, z) => `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    const jit = new Map(); const r2 = mulberry32(91);
    for (let i = 0; i < p.count; i++) {
      const k = key(p.getX(i), p.getY(i), p.getZ(i));
      if (!jit.has(k)) jit.set(k, 0.62 + r2() * 0.6);          // shared corners move together: no cracks
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
        vec3 alb = vec3(.045, .044, .046);                   // dark basalt chips, rough: they catch light, they don't sparkle
        vec3 c = alb * uAmbient * 8. + energyLight(vW, N, V, alb, .92) * .8;
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  const debMesh = new THREE.InstancedMesh(rockGeo, debMat, MAXDEB); debMesh.count = 0; debMesh.frustumCulled = false;
  debMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(debMesh);
  const deb = [];
  for (let i = 0; i < MAXDEB; i++) deb.push({ alive: false, p: new V3(), v: new V3(), q: new THREE.Quaternion(), axis: new V3(), spin: 0, s: new V3(), age: 0, life: 3, rest: false });
  function debris(pos, { count = 8, speed = [2.5, 7], size = [0.018, 0.055], dir = null, life = [2.4, 3.6] } = {}) {
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
          gl_FragColor = vec4(dir * prof * uAmp, 0., 0.);
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
          gl_FragColor = vec4(nv * uAmp * (.35 + e) * (.5 + shells) * fade, 0., 0.);
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
  // The orb is a ray-marched volume inside a bounding sphere: a hot core, current sheets wound
  // round the punch axis at two scales, a liquid edge, and a crackling membrane with a crisp rim.
  // Behind it a black corona stretches into a tail along the orb's motion, and smoke ribbons and
  // billows leave from its back, so the shadow belongs to the energy and follows it.
  const orbGeo = new THREE.IcosahedronGeometry(1, 20);
  const ORB_VERT = NOISE_GLSL + /* glsl */`
    uniform float uTime, uRadius, uInstab; uniform vec3 uCenter;
    varying vec3 vW; varying vec3 vN; varying vec3 vLocal;
    void main(){
      vec3 n = normalize(position);
      float wob = snoise(n * 1.8 + vec3(0., uTime * 1.7, uTime * .9)) * (.03 + .11 * uInstab);
      vLocal = n * (1. + wob); vN = n;
      vW = uCenter + vLocal * uRadius;
      gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
    }`;
  const ORB_VOLUME_VERT = /* glsl */`
    uniform float uRadius; uniform vec3 uCenter; varying vec3 vW;
    void main(){ vW = uCenter + position * uRadius * 1.12; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.); }`;
  const ORB_VOLUME_FRAG = NOISE_GLSL + TNOISE_GLSL + /* glsl */`
    uniform float uTime, uPressure, uMode, uRadius, uInstab; uniform vec3 uCenter, uAxis, uCore, uRim, uDeep;
    varying vec3 vW;
    vec3 rot(vec3 p, vec3 ax, float a){ return p * cos(a) + cross(ax, p) * sin(a) + ax * dot(ax, p) * (1. - cos(a)); }
    void main(){
      const float S = 1.12;                                   // bounding radius, in orb radii
      vec3 ro = (cameraPosition - uCenter) / uRadius, rd = normalize(vW - cameraPosition);
      float b = dot(ro, rd), h = b * b - (dot(ro, ro) - S * S);
      if (h <= 0.) discard;
      h = sqrt(h);
      float t0 = max(-b - h, 0.), t1 = -b + h;
      float hs = b * b - (dot(ro, ro) - 1.);
      if (uMode > .5) {                                       // the failure: a light bulb
        if (hs <= 0.) discard;
        vec3 n = normalize(ro + rd * (-b - sqrt(hs)));
        gl_FragColor = vec4(uCore * (.8 + 2.4 * pow(clamp(-dot(n, rd), 0., 1.), 1.5)) * (1.5 + 2. * uPressure), .95); return;
      }
      // march only the sphere itself (r < 1.02), where the density lives, so every step counts
      float hb = b * b - (dot(ro, ro) - 1.0404);
      if (hb > 0.) { hb = sqrt(hb); t0 = max(-b - hb, 0.); t1 = -b + hb; }
      const int N = 22;
      float dt = (t1 - t0) / float(N);
      // random per-pixel jitter: an ordered pattern (interleaved gradient noise) showed as a hatch over thin filaments
      float t = t0 + dt * fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
      float spin = uTime * (1.4 + 2.2 * uPressure);
      vec3 col = vec3(0.); float trans = 1.;
      for (int i = 0; i < N; i++) {
        vec3 p = ro + rd * t; t += dt;
        float r = length(p);
        if (r > S) continue;
        // rigid spin plus a FIXED shear: spin × (1.6 − r) grows without limit and winds the noise into fine rings
        vec3 q = rot(p, uAxis, spin + 2.2 * (1. - r) + dot(p, uAxis) * 2.4);
        q += vec3(0., 0., uTime * .35);                                      // the structure evolves by scrolling instead
        float w = tn(q * 1.5 + vec3(0., 0., uTime * .45)).x;
        float edge = 1. - smoothstep(.55, 1.0, r + w * (.025 + .1 * uInstab));   // a soft edge, calm unless unstable: a wobbling one read as lumpy
        if (edge <= 0.) continue;
        // filaments where two noise fields cross zero: lines of current, like a plasma globe.
        // Sheets (one zero set) cross every ray many times and integrate to a flat white disc.
        vec3 qq = q * 1.6 + w * .5;                                          // low frequency: a few long filaments, not yarn
        // filaments from procedural simplex noise: the baked Perlin is zero on its lattice, and
        // those zeros lit up as a regular grid of bright cloud that read as a planet
        float a1 = 1. - abs(snoise(qq)), a2 = 1. - abs(snoise(qq * 1.07 + vec3(17.3, -4.1, 9.7)));
        float fil = pow(max(a1 * a2, 0.), 20.) * 12. * (1.25 - r);           // brightest toward the core
        float core = exp(-r * r * 30.) * 1.2 + exp(-r * r * 6.) * .08;   // hot, but small: a blown-out core flattened the filaments
        vec3 ramp = mix(uCore, mix(uRim, uDeep, smoothstep(.4, 1., r)), smoothstep(.05, .45, r));
        col += (ramp * fil * edge * (.6 + 2. * uPressure) + uDeep * .045 * edge * (1. - r) + uCore * core * (1. + 2.2 * uPressure)) * dt * trans;   // a faint inner glow, strongest at the centre
        trans *= exp(-dt * edge * (.12 + .2 * uPressure));                   // see-through: the dark behind it shows
      }
      if (hs > 0.) {                                          // the membrane: crisp rim and fine crackle
        vec3 n = normalize(ro + rd * (-b - sqrt(hs)));
        float ndv = clamp(-dot(n, rd), 0., 1.);
        float ra = atan(dot(n, cross(uAxis, vec3(0., 1., 0.)) + vec3(1e-3)), dot(n, uAxis));
        float feather = .25 + .75 * smoothstep(-.2, .6, tn(vec3(cos(ra) * 2., sin(ra) * 2., uTime * 1.3)).y);   // the rim breaks up by angle: a uniform one read as a hoop
        col += mix(uRim, uCore, .45) * pow(1. - ndv, 9.) * (1.4 + 2.2 * uPressure) * feather;
      }
      gl_FragColor = vec4(col, (1. - trans) * .3);       // mostly additive: a dark absorbing body read as an opaque navy ball
    }`;
  const coronaGeo = new THREE.PlaneGeometry(2, 2);
  const ringGeoOrb = new THREE.TorusGeometry(1, 0.022, 8, 220);
  const orbs = [];
  function createOrb({ radius = 0.45, shadow = true } = {}) {
    const u = {
      uTime: uniforms.uTime, uRadius: { value: radius }, uInstab: { value: 0.2 }, uCenter: { value: new V3() }, uAxis: { value: new V3(1, 0, 0) },
      uPressure: { value: 0.6 }, uMode: { value: 0 }, uCore: { value: new V3() }, uRim: { value: new V3() }, uDeep: { value: new V3() }, uLens: { value: 0 },
      tNoise: uniforms.tNoise,
    };
    const cm = new THREE.ShaderMaterial({
      uniforms: u, vertexShader: ORB_VOLUME_VERT, fragmentShader: ORB_VOLUME_FRAG,
      transparent: true, depthWrite: false,
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
          gl_FragColor = vec4(0., 0., off);                    // zw: bends the air without a chromatic split
        }`,
      transparent: true, depthWrite: false, depthTest: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    });
    const cmesh = new THREE.Mesh(orbGeo, cm), dmesh = new THREE.Mesh(orbGeo, dm);
    cmesh.renderOrder = 20; dmesh.layers.set(DISTORT_LAYER); cmesh.frustumCulled = dmesh.frustumCulled = false;
    group.add(cmesh, dmesh);
    // the black corona: a camera-facing disc of dark flames behind the orb, stretched along its tail
    const cu = { uTime: uniforms.uTime, tNoise: uniforms.tNoise, uCenter: u.uCenter, uRadius: u.uRadius, uTrail: { value: new THREE.Vector2(-1, 0) }, uTrailK: { value: 0.4 }, uDensity: { value: 0.97 }, uSmoke: { value: new V3() }, uGlow: { value: new V3() } };
    const corona = new THREE.Mesh(coronaGeo, new THREE.ShaderMaterial({
      uniforms: cu,
      vertexShader: /* glsl */`
        uniform vec3 uCenter; uniform float uRadius, uTrailK; uniform vec2 uTrail; varying vec2 vQ; varying vec2 vP;
        void main(){
          vP = position.xy;
          vQ = position.xy * 3.6 + uTrail * 2.2;              // in orb radii, shifted down the tail so the whole teardrop fits
          vec4 mv = viewMatrix * vec4(uCenter, 1.); mv.xy += vQ * uRadius;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: TNOISE_GLSL + /* glsl */`
        uniform float uTime, uTrailK, uDensity; uniform vec2 uTrail; uniform vec3 uSmoke, uGlow; varying vec2 vQ; varying vec2 vP;
        void main(){
          float r = length(vQ);
          vec2 N = vec2(-uTrail.y, uTrail.x);
          float al = dot(vQ, uTrail), pe = dot(vQ, N);           // along the tail, across it
          // a teardrop: about the orb's width at the orb, widening a little, then tapering to a point down the tail
          float L = 1.6 + 2.6 * uTrailK;
          float t = clamp(al / L, 0., 1.);
          float halfW = al < 0. ? sqrt(max(1.25 * 1.25 - al * al, 0.)) : 1.25 + 1.1 * t - 2.2 * t * t;
          // torn tongues: noise squeezed across the tail and streaming down it
          float tongues = tfbm3(vec3(pe * 2.4, al * .55 - uTime * 2.6, 3.7));
          float wisps = tn(vec3(pe * 6.5, al * 1.4 - uTime * 3.4, 9.1)).x;
          float d = abs(pe) - halfW * (1. + .7 * tongues + .35 * wisps * (.3 + t));
          float mass = 1. - smoothstep(-.02, .035, d);                  // a crisp torn edge: a soft one read as a blurred backdrop
          mass *= 1. - smoothstep(.7, .95, t + .25 * tongues);          // the tip shreds away
          mass *= smoothstep(-1.6, -.9, al);
          float rips = tn(vec3(pe * 4.2, al * 1.1 - uTime * 3., 21.)).z;  // torn holes opening toward the tip
          mass *= 1. - smoothstep(.15, .35, rips + t * .5 - .35) * smoothstep(.15, .5, t);
          mass *= smoothstep(3.3, 2.3, r) * (1. - smoothstep(.8, .98, max(abs(vP.x), abs(vP.y))));   // round, never the quad's edge
          float a = mass * uDensity;
          gl_FragColor = vec4(uSmoke * a, a);              // pure black: a lit edge read as blue haze
        }`,
      transparent: true, depthWrite: false, depthTest: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    }));
    corona.renderOrder = 19; corona.frustumCulled = false; group.add(corona);
    // spiral arms: thin wind streaks wound round the orb, broken into wisps by the noise
    const su = { uTime: uniforms.uTime, tNoise: uniforms.tNoise, uCenter: u.uCenter, uRadius: u.uRadius, uI: { value: 0 }, uSpin: { value: -6 }, uCore: u.uCore, uRim: u.uRim };
    const spiral = new THREE.Mesh(coronaGeo, new THREE.ShaderMaterial({
      uniforms: su,
      vertexShader: /* glsl */`
        uniform vec3 uCenter; uniform float uRadius; varying vec2 vQ;
        void main(){ vQ = position.xy * 2.6; vec4 mv = viewMatrix * vec4(uCenter, 1.); mv.xy += vQ * uRadius; mv.z += uRadius * .9; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: TNOISE_GLSL + /* glsl */`
        uniform float uTime, uI, uSpin; uniform vec3 uCore, uRim; varying vec2 vQ;
        void main(){
          float r = length(vQ); if (r > 2.6) discard;
          float th = atan(vQ.y, vQ.x);
          float arms = .5 + .5 * sin(th * 3. - log(max(r, .05)) * 7. + uTime * uSpin);
          float n = tn(vec3(vQ * 1.5, uTime * .7)).x;
          float streak = pow(arms, 34.) * smoothstep(-.1, .5, n);          // thin wind streaks, not crescents
          float band = smoothstep(.85, 1.05, r) * smoothstep(1.9, 1.1, r);
          gl_FragColor = vec4(mix(uRim, uCore, pow(arms, 40.)) * streak * band * uI, 1.);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    spiral.renderOrder = 22; spiral.frustumCulled = false;   // kept off: soft spiral arms read as primitive crescents
    // compression rings: thin currents running round the orb on tilted planes
    const rings3 = [].map((k, i) => {
      const m = new THREE.Mesh(ringGeoOrb, new THREE.ShaderMaterial({
        uniforms: { uTime: uniforms.uTime, uI: { value: 0 }, uSpeed: { value: [0.9, -1.3, 0.7][i] }, uSeed: { value: i * 3.7 }, uGlow: { value: new V3() }, uCore: { value: new V3() } },
        vertexShader: /* glsl */`varying vec2 vUv; varying float vF;
          void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vec3 N = normalize(mat3(modelMatrix) * normal);
            vF = abs(dot(N, normalize(cameraPosition - w.xyz))); gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */`uniform float uTime, uI, uSpeed, uSeed; uniform vec3 uGlow, uCore; varying vec2 vUv; varying float vF;
          void main(){
            float s = fract(vUv.x * 2. - uTime * uSpeed + uSeed);
            float dash = smoothstep(0., .03, s) * pow(1. - s, 5.);          // comet streaks running round
            float gap = smoothstep(.15, .35, fract(vUv.x * 2. + uSeed * .37)); // broken, never a full hoop
            gl_FragColor = vec4((uCore * dash * 1.6 + uGlow * dash * .8) * pow(vF, .7) * gap * uI, 1.);
          }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      m.renderOrder = 21; m.frustumCulled = false; group.add(m);
      return { m, k, tilt: [0.32, -0.42, 0.22][i], prec: [0.7, -0.5, 0.35][i] };
    });
    const O = {
      position: u.uCenter.value, axis: u.uAxis.value, radius, pressure: 0.6, instability: 0.2, visible: true, arcRate: 1, reach: [],
      scale: 1, vel: 0, nextKick: 0, u, cmesh, dmesh, corona, cu, rings: rings3, spiral, su,
      shadow, velocity: new V3(), prev: null, trail: new V3(-1, 0, 0), billowAcc: 0, moteAcc: 0,
      pulse(k = -0.2) { O.vel += k * 34; },               // compress (negative) or swell; the spring rebounds past rest
      get currentRadius() { return u.uRadius.value; },
    };
    if (shadow) {
      O.trails = [
        createTrail({ width: 0.8, life: 0.75, spacing: 0.04, jitter: 0.15, shards: 0.06, billows: 0.15, erode: 0.24, opacity: 0.8 }),
        createTrail({ width: 0.5, life: 0.6, spacing: 0.04, jitter: 0.2, shards: 0.12, billows: 0.05, erode: 0.22 }),
        createTrail({ width: 0.5, life: 0.6, spacing: 0.04, jitter: 0.2, shards: 0.12, billows: 0.05, erode: 0.22 }),
      ];
      for (const T of O.trails) T.taper = false;
    }
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
      O.u.uCore.value.set(palette.core.r * 0.92, palette.core.g * 0.97, palette.core.b);
      O.u.uRim.value.set(palette.rim.r, palette.rim.g, palette.rim.b);
      O.u.uDeep.value.set(palette.glow.r * 0.45, palette.glow.g * 0.5, palette.glow.b);
      O.u.uLens.value = 0.11 * r / viewUnitsPerUV(O.position);
      const on = O.visible && O.radius > 0.02;
      O.cmesh.visible = O.dmesh.visible = on;
      O.corona.visible = on && O.shadow;
      O.spiral.visible = false;
      O.su.uI.value = 0.25 + 0.75 * O.pressure; O.su.uSpin.value = -(4 + 6 * O.pressure);
      if (on) flashLight(0, O.position, (1.6 + 5.5 * O.pressure) * (r / 0.45), 30);
    }
  }
  // Runs in render(), after the caller has moved the orb this frame.
  const _tv = new V3(), _tw = new V3();
  function updateOrbShadows(dt) {
    for (const O of orbs) {
      const on = O.visible && O.radius > 0.02;
      if (!O.prev) O.prev = O.position.clone();
      if (dt > 0) {
        _tv.subVectors(O.position, O.prev).divideScalar(dt);
        O.velocity.lerp(_tv, 1 - Math.exp(-dt * 20));
      }
      O.prev.copy(O.position);
      const r = O.u.uRadius.value, speed = O.velocity.length();
      // trailing direction: against the motion when it moves, back along the arm (and a little up) when it holds
      const k = Math.min(1, Math.max(0, (speed - 1.0) / 4));
      _tw.copy(O.axis).negate().addScaledVector(UP, 0.3).normalize();
      if (speed > 1e-3) _tv.copy(O.velocity).negate().divideScalar(speed); else _tv.copy(_tw);
      O.trail.copy(_tw).lerp(_tv, k).normalize();
      // the corona's tail, in view space
      _tv.copy(O.trail).transformDirection(camera.matrixWorldInverse);
      O.cu.uTrail.value.set(_tv.x, _tv.y); if (O.cu.uTrail.value.lengthSq() > 1e-6) O.cu.uTrail.value.normalize();
      O.cu.uTrailK.value = 0.65 + 0.35 * k;               // always a tail: a round halo read as a static backdrop
      O.cu.uSmoke.value.set(palette.smoke.r, palette.smoke.g, palette.smoke.b); O.cu.uGlow.value.set(palette.glow.r, palette.glow.g, palette.glow.b);
      // compression rings
      for (const G of O.rings) {
        G.m.visible = on && options.orb !== 'glow';
        if (!G.m.visible) continue;
        basis(O.axis);
        const a = clock.sim * G.prec;
        _tv.copy(O.axis).addScaledVector(_u, Math.cos(a) * Math.tan(G.tilt)).addScaledVector(_w, Math.sin(a) * Math.tan(G.tilt)).normalize();
        G.m.quaternion.setFromUnitVectors(ZAXIS, _tv); G.m.position.copy(O.position); G.m.scale.setScalar(r * G.k);
        const mu = G.m.material.uniforms;
        mu.uI.value = 0.35 + 0.9 * O.pressure; mu.uGlow.value.set(palette.glow.r, palette.glow.g, palette.glow.b); mu.uCore.value.set(palette.core.r, palette.core.g, palette.core.b);
      }
      if (!O.shadow) continue;
      for (const T of O.trails) if (!on && T.active) T.stop(); else if (on && !T.active) T.restart();
      if (!on) continue;
      // smoke leaves the orb's back: low drift when it moves (so it lays out along the path), a steady stream when it holds
      basis(O.trail);
      const drift = _tw.copy(O.trail).multiplyScalar(1.7 * (1 - k)).addScaledVector(UP, 0.3).addScaledVector(O.velocity, 0.06);
      const widths = [1.0, 0.6, 0.6];
      for (let i = 0; i < 3; i++) {
        const T = O.trails[i]; T.width = r * widths[i]; T.drift.copy(drift);
        const sp = clock.sim * 3 + i * 3.14;
        _tv.copy(O.position).addScaledVector(O.trail, r * (i ? 0.25 : 0.4));
        if (i) _tv.addScaledVector(_u, Math.cos(sp) * r * 0.5).addScaledVector(_w, Math.sin(sp) * r * 0.5);
        T.push(_tv);
      }
      if (dt > 0) {
        const step = r * 0.5;
        O.pathAcc = (O.pathAcc || 0) + _tv.subVectors(O.position, O.lastBillow || O.position).length();
        if (!O.lastBillow) O.lastBillow = O.position.clone();
        while (O.pathAcc >= step) {                    // one billow every third of a radius travelled: smoke that follows the orb
          O.pathAcc -= step;
          O.lastBillow.lerp(O.position, Math.min(1, step / Math.max(1e-4, O.lastBillow.distanceTo(O.position))));
          _tv.copy(O.lastBillow).addScaledVector(O.trail, r * 0.5).add(_c.set(R(-1, 1), R(-1, 1), R(-1, 1)).multiplyScalar(r * 0.35));
          const ang = screenAngle(_tv, O.trail);
          spawnSprite(0, _tv, _d.copy(O.trail).multiplyScalar(R(0.3, 0.8)).addScaledVector(UP, 0.15), { size: r * R(1.2, 2.0), grow: 1.9, life: R(0.6, 1.0), opacity: 0.9, drag: 2.2, buoy: 0.15, angle: ang, aspect: 1 + 0.7 * k });
        }
        O.lastBillow.copy(O.position);
        O.billowAcc += dt * 14 * (0.4 + O.pressure);
        while (O.billowAcc >= 1) {
          O.billowAcc -= 1;
          _tv.copy(O.position).addScaledVector(O.trail, r * R(0.6, 1.2)).add(_c.set(R(-1, 1), R(-1, 1), R(-1, 1)).multiplyScalar(r * 0.45));
          spawnSprite(0, _tv, _d.copy(O.trail).multiplyScalar(R(0.8, 1.8) * (1 - k * 0.7)).addScaledVector(O.velocity, 0.25).addScaledVector(UP, 0.2), { size: r * R(1.0, 1.8), grow: 2.0, life: R(0.5, 0.9), opacity: 0.85, drag: 1.6, buoy: 0.2 });
        }
        O.moteAcc += dt * 55 * O.pressure;           // cold motes caught in the vortex
        while (O.moteAcc >= 1) {
          O.moteAcc -= 1;
          _c.set(R(-1, 1), R(-1, 1), R(-1, 1)).normalize();
          _tv.copy(O.position).addScaledVector(_c, r * R(1.3, 2.4));
          _d.crossVectors(O.axis, _c).multiplyScalar(R(2, 4)).addScaledVector(_c, -R(0.5, 1.5)).addScaledVector(O.velocity, 0.9);
          spawnSpark(_tv, _d, { life: R(0.35, 0.7), size: R(0.003, 0.007), heat: -R(0.6, 1), gravity: 0, drag: 0.8 });
        }
      }
    }
  }
  function orbTick(O) {
    if (!O.visible || O.radius < 0.05) return;
    const r = O.u.uRadius.value, rate = O.arcRate;
    const surf = Math.round((R(0.1, 0.8) + 0.7 * O.pressure) * rate);
    for (let k = 0; k < surf; k++) {                 // short crackles leaping outward: arcs laid round the shell read as wire loops
      _a.set(R(-1, 1), R(-1, 1), R(-1, 1)).normalize();
      _b.copy(_a).multiplyScalar(R(1.3, 1.75)).add(_c.set(R(-1, 1), R(-1, 1), R(-1, 1)).multiplyScalar(0.35));
      bolt(_a.multiplyScalar(r * 0.95), _b.multiplyScalar(r), { levels: 5, jag: 0.3, width: 0.022 * (r / 0.45), minPx: 5, intensity: 0.9, life: R(1, 2.6) | 0, anchor: O.position, branches: 1 });
    }
    if (O.position.y < 2.6 && rnd() < 0.18 + 0.3 * O.pressure) {   // strikes down to the ground under it
      const a = R(0, 6.28), d = R(0.3, 1.6);
      const hit = new V3(O.position.x + Math.cos(a) * d, 0.02, O.position.z + Math.sin(a) * d);
      _b.subVectors(hit, O.position); _a.copy(_b).normalize().multiplyScalar(r);
      bolt(_a, _b, { levels: 6, jag: 0.24, width: 0.04, minPx: 9, intensity: 1.1, life: 2, anchor: O.position, branches: 2 });
      addHeat(hit, 0.8, 0.5); sparks(hit, { count: 6, dir: UP, spread: 0.9, speed: [1.5, 4] });
    }
    for (let leap = 0; leap < 2; leap++) if (rnd() < (0.3 + 0.55 * O.pressure) * Math.min(rate, 1.6)) {
      _a.set(R(-1, 1), R(-1, 1), R(-1, 1)).normalize();
      if (_a.dot(O.axis) > 0.3) _a.addScaledVector(O.axis, -1.2).normalize();   // leap back along the arm or out sideways, not ahead
      const reach = O.reach.length && rnd() < 0.55 ? O.reach[(rnd() * O.reach.length) | 0] : null;
      if (reach) _b.subVectors(reach, O.position); else _b.copy(_a).multiplyScalar(r * R(1.5, 2.8)).add(_c.set(R(-1, 1), R(-1, 1), R(-1, 1)).multiplyScalar(r * 0.4));
      bolt(_a.multiplyScalar(r), _b, { levels: 6, jag: 0.24, width: 0.03, minPx: 8, intensity: 1, life: 2, anchor: O.position, branches: 2 });
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
    // in the air the front is felt as refraction; a bright band there reads as a HUD hoop
    for (let k = 0; k < layers; k++) ring(c, facing, { radius: RAD[k] * strength, thick: TH[k] * Math.sqrt(strength), intensity: ground ? IN[k] * 0.9 : IN[k] * 0.12, life: LF[k] * (0.8 + 0.2 * strength), delay: k * 0.055, amp: AMP[k] * strength });
    sparks(c, { count: nSparks, dir: ground ? UP : null, spread: ground ? 1.4 : 1, speed: [3 * Math.sqrt(strength), 11 * Math.sqrt(strength)] });
    if (ground) {
      if (nDebris) debris(c, { count: nDebris, speed: [2.5 * Math.sqrt(strength), 6.5 * Math.sqrt(strength)], size: [0.03, 0.09] });
      sparks(c, { count: Math.round(30 * strength), dir: UP, spread: 0.45, speed: [5, 11], life: [0.5, 1.0] });   // a fountain straight up off the hit
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
      shards(c, { count: Math.round(3 * strength) });
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
      const n = Math.round(2 + 2 * strength), th0 = R(0, 6.28);
      for (let k = 0; k < n; k++) {                    // few and divergent: a parallel bundle read as combed hair
        const th = th0 + (k / n) * 6.28 + R(-0.4, 0.4), rr = radius * R(0.35, 1.0);
        _b.copy(p).addScaledVector(d, length * R(0.45, 1.0)).addScaledVector(bu, Math.cos(th) * rr).addScaledVector(bw, Math.sin(th) * rr);
        bolt(_a.copy(p).addScaledVector(d, 0.15), _b, { levels: 6, jag: 0.2, width: 0.05 * Math.sqrt(strength), minPx: 10, intensity: 1.2, life: 2, branches: 3 });
      }
    };
    spear(); repeat(2, spear);
    ring(_c.copy(p).addScaledVector(d, length * 0.35), d, { radius: radius * 1.3, thick: 0.08, intensity: 0.05, life: 0.3, amp: 0.05 * strength });
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
      C.cmesh.visible = false;                         // refraction only: the drawn surface read as grey slabs from inside
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
      const T = createTrail({ width: R(0.32, 0.55), life: R(0.38, 0.5), spacing: 0.1, drift: new V3(0, 0.5, 0), jitter: 0.25, shards: 0.08, erode: 0.12, chain: 0.32, chainSize: 1.9, opacity: 0.45 });
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
        const r = V.radius * E.r, sub = 4;
        E.pos = E.pos || new V3();
        for (let s = 0; s < sub; s++) {                  // sub-steps: a fast circle pushed once a frame turns into a sawtooth
          E.phase += E.w * dt / sub;
          E.pos.set(Math.cos(E.phase) * r, E.h + Math.sin(E.phase) * r * V.tilt, Math.sin(E.phase) * r).add(V.center);
          E.T.push(E.pos);
        }
      }
      if (live && dt > 0 && rnd() < dt * 12) {          // a few, stretched round the ring: many round ones read as stamps
        const ang = R(0, 6.28), rr = V.radius * R(0.6, 1.2);
        _a.set(V.center.x + Math.cos(ang) * rr, R(0.05, 0.4), V.center.z + Math.sin(ang) * rr);
        _b.set(-Math.sin(ang), 0.15, Math.cos(ang));
        spawnSprite(0, _a, _b.clone().multiplyScalar(R(3, 6)), { size: R(0.4, 0.8), life: R(0.6, 1.1), color: palette.dust, opacity: 0.6, drag: 1.2, buoy: 0.2, angle: screenAngle(_a, _b), aspect: 2 });
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
      if (a === b || rnd() < 0.35) {
        _b.copy(a.pos).sub(V.center).setY(0).normalize().multiplyScalar(R(0.4, 1.4)).add(a.pos).setY(0.03);   // slanted down and out
        bolt(a.pos, _b, { levels: 6, jag: 0.26, width: 0.035, minPx: 8, intensity: 1, life: 2, branches: 2 });
      } else {
        bolt(a.pos, b.pos, { levels: 6, jag: 0.28, width: 0.035, minPx: 8, intensity: 1, life: 2, branches: 2 });   // jagged chords: a bow read as a bridge
      }
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
      iSprT[nd * 2] = spr.type[i]; iSprT[nd * 2 + 1] = spr.asp[i];
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
    compositeMat.uniforms.uSeed.value = rnd() * 100;
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
  const noiseRT = new THREE.WebGL3DRenderTarget(96, 96, 96, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
  // WebGL3DRenderTarget replaces its texture with a Data3DTexture that defaults to NEAREST and
  // 8-bit, ignoring the options above: set them on the texture or every sampler reads mosaic blocks.
  Object.assign(noiseRT.texture, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false });
  noiseRT.texture.wrapS = noiseRT.texture.wrapT = noiseRT.texture.wrapR = THREE.RepeatWrapping;
  {
    const bake = new THREE.ShaderMaterial({
      uniforms: { uZ: { value: 0 } }, vertexShader: FS_VERT, depthTest: false, depthWrite: false,
      fragmentShader: NOISE_GLSL + PNOISE_GLSL + /* glsl */`
        uniform float uZ; varying vec2 vUv;
        void main(){
          vec3 p = vec3(vUv, uZ) * 6., r = vec3(6.);
          gl_FragColor = vec4(pnoise(p, r), pnoise(p + vec3(37., 11., 53.), r), pnoise(p + vec3(5., 71., 23.), r), pnoise(p + vec3(61., 29., 7.), r)) * .5 + .5;
        }`,
    });
    const prev = renderer.getRenderTarget();
    fsMesh.material = bake;
    for (let z = 0; z < 96; z++) { bake.uniforms.uZ.value = (z + 0.5) / 96; renderer.setRenderTarget(noiseRT, z); renderer.render(fsScene, fsCam); }
    renderer.setRenderTarget(prev); bake.dispose();
  }
  uniforms.tNoise.value = noiseRT.texture;
  const prefilterMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: null }, uHalf: { value: new THREE.Vector2() }, uThreshold: { value: 1.3 }, uKnee: { value: 0.6 } },
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
      uAspect: { value: 1 }, uBloom: { value: 0.085 }, uExposure: { value: 1 },
      uShake: { value: new THREE.Vector2() }, uZoom: { value: 1 }, uFisheye: { value: 0 },
      uFrame: { value: 0 }, uFrameFull: { value: 0 }, uNegRadius: { value: 0.42 }, uCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uFlash: { value: 0 }, uDim: { value: 0 }, uTime: { value: 0 }, uGrain: { value: 0.02 }, uVignette: { value: 0.85 }, uSeed: { value: 0 },
    },
    vertexShader: FS_VERT,
    fragmentShader: /* glsl */`
      uniform sampler2D tColor, tDistort, tBloom;
      uniform float uAspect, uBloom, uExposure, uZoom, uFisheye, uFrame, uFrameFull, uNegRadius, uFlash, uDim, uTime, uGrain, uVignette, uSeed;
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
        vec4 D = texture2D(tDistort, uv);
        vec2 d = D.xy + D.zw; d.x /= uAspect;                          // xy: fronts and funnels; zw: the orb's lens
        vec3 col = texture2D(tColor, uv + d).rgb;                     // no chromatic split: it fringed every spark in rainbows
        col += texture2D(tBloom, uv + d).rgb * uBloom;
        col = aces(col * uExposure);
        if (uFrame > 0.) {
          float l = dot(col, vec3(.2126, .7152, .0722));
          float ink = smoothstep(.26, .34, l);
          vec2 q = vUv - uCenter; q.x *= uAspect;
          float qr = length(q), qa = atan(q.y, q.x);
          // a jagged starburst, not a disc
          float spikes = .5 * sin(qa * 7. + uSeed) + .3 * sin(qa * 13. + uSeed * 1.7) + .2 * sin(qa * 29. + uSeed * 2.3);
          float Rn = uNegRadius * (1. + .38 * spikes);
          float m = uFrameFull > .5 ? 1. : 1. - smoothstep(Rn * .94, Rn, qr);
          // manga speed lines in ink: random widths, each starting at its own radius
          float uu = (qa + 3.14159) / 6.28318 * 140.;
          float hsh = fract(sin(floor(uu) * 12.9898 + uSeed * 78.233) * 43758.5453);
          float wdt = .08 + .25 * hsh;
          float ray = step(.45, hsh) * (1. - smoothstep(wdt * .5, wdt, abs(fract(uu) - .5)));
          ink = max(ink, ray * smoothstep(uNegRadius * (.3 + .5 * hsh), uNegRadius * 1.6, qr) * .9);
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
    boltMat.uniforms.uMaxPx.value = 26 * pixelRatio;
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
    updateOrbShadows(dt);
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
    for (const rt of [rtColor, rtDistort, noiseRT, ...down, ...up]) rt.dispose();
    for (const m of [prefilterMat, downMat, upMat, compositeMat]) m.dispose();
  }

  const fx = {
    options, palette, group, lightUniforms, heatUniforms, attractor, skyFlash: 0, post: compositeMat.uniforms,
    get time() { return clock.sim; }, get realTime() { return clock.real; }, get holding() { return clock.hold > 0; },
    get timeScale() { return clock.base; }, set timeScale(v) { clock.base = v; },
    get rampValue() { return clock.rampValue; },
    createOrb, createTrail, addHeat, bolt, sparks, debris, puff, shards, burst, blast, ring, scorch, vortex, impact, ramp, repeat,
    spawnSpark, spawnSprite,
    update, render, setSize, warmup, dispose,
    stats: () => ({ bolts: bolts.filter((b) => b.alive).length, sparks: spkGeo.instanceCount, sprites: sprGeo.instanceCount, debris: debMesh.count, trails: trails.length }),
  };
  return fx;
}
