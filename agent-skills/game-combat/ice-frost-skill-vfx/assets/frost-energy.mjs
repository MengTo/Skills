// Ice and frost skill VFX: dendritic frost that grows across the ground from a seed point, faceted
// ice spikes ray-traced against their own planes (Snell, Fresnel, total internal reflection,
// Beer-Lambert blue, cracks, bubbles, frosted edges) that erupt, crack along visible planes and
// shatter into pieces that land and rest, a low freezing mist ray-marched along the ground that
// parts around the ice, breath-like vapour, snow and glinting diamond dust, and the composite:
// HalfFloat colour, a half-resolution refraction buffer, dual-Kawase bloom with a high threshold,
// ACES once, then sRGB, grain, vignette and impact frames with a 3-a-second flash limiter.
//
// Pass in your own THREE (r160+).
//
//   const fx = createFrostEnergy(THREE, { renderer, scene, camera });
//   fx.setSize(width * dpr, height * dpr, dpr);
//   frame: const dt = fx.update(realDt); ...beats...; fx.render();
//
// Passes: the world (layer 0: sky, ground, rocks, snow chunks) is drawn first and copied with
// mipmaps; the ice (layer 2) is traced against that copy; the mist is marched at half resolution
// against the depth; then the light effects (layer 3); the refraction buffer (layer 1); post.

import { growFrost, mulberry32 } from './frost-growth.mjs';

export const LAYERS = { world: 0, distort: 1, ice: 2, fx: 3 };

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
`;

// Hashes without sine (Dave Hoskins): stable across GPUs, no banding at large inputs.
export const HASH_GLSL = /* glsl */`
float h11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec4 h44(vec4 p4){ p4 = fract(p4 * vec4(.1031, .1030, .0973, .1099)); p4 += dot(p4, p4.wzxy + 33.33); return fract((p4.xxyz + p4.yzzw) * p4.zywx); }
vec3 h32(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yxz + 33.33); return fract((p3.xxy + p3.yzz) * p3.zyx); }
`;

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

// Four independent noises baked into a 96^3 texture that tiles every 6 units (16 texels a cell).
export const TNOISE_GLSL = /* glsl */`
uniform sampler3D tNoise;
vec4 tn(vec3 p){ return texture(tNoise, p * (1. / 6.)) * 2. - 1.; }
float tfbm2(vec3 p){ return tn(p).x * .5 + tn(p * 2.03 + 1.7).y * .25; }
float tfbm3(vec3 p){ return tn(p).x * .5 + tn(p * 2.03 + 1.7).y * .25 + tn(p * 4.07 + 3.1).z * .125; }
`;

// Eight point lights the ice throws onto the world, plus the moon and the sky's ambient.
export const LIGHTS_GLSL = /* glsl */`
uniform vec3 uLightPos[8];
uniform vec3 uLightCol[8];
uniform vec3 uMoonDir, uMoonCol, uSkyAmb;
vec3 energyLight(vec3 P, vec3 N, vec3 V, vec3 albedo, float rough){
  vec3 acc = vec3(0.);
  float F = .04 + .96 * pow(1. - max(dot(N, V), 0.), 5.);
  for (int i = 0; i < 8; i++) {
    vec3 L = uLightPos[i] - P; float d2 = max(dot(L, L), 1e-4); L *= inversesqrt(d2);
    float att = 1. / (1. + d2 * 2.6);
    float ndl = max(dot(N, L), 0.);
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.), mix(160., 8., rough)) * (1. - rough) * (1.2 + 8. * F);
    acc += uLightCol[i] * ndl * (att * albedo + spec / (1. + d2 * .45));
  }
  return acc;
}
vec3 lightsAt(vec3 P){
  vec3 acc = vec3(0.);
  for (int i = 0; i < 8; i++) { vec3 L = uLightPos[i] - P; acc += uLightCol[i] / (1. + dot(L, L) * 2.6); }
  return acc;
}`;

// The frost the ground grows: a baked distance field to the frost tree, with the time the growth
// front reached each texel. Needs TNOISE_GLSL and HASH_GLSL. frostAt(p.xz, metres per pixel).
export const FROST_GLSL = /* glsl */`
uniform sampler2D tFrostA, tFrostB;   // A: centre distance, arrival, direction; B: half-width, level, seed, arc length
uniform vec4 uFrostBox;               // x0, z0, 1/width, 1/depth
uniform float uFrostT, uFrostFade, uFrostGlow; uniform vec3 uFrostSeed;
struct Frost { float line; float micro; float rime; float fresh; float tip; float cell; float lv; float on; float crust; float ridge; float along; float sd; float dc; };
float lineCover(float dc, float hw, float fw){ float lo = max(dc - hw, -.5 * fw), hi = min(dc + hw, .5 * fw); return clamp((hi - lo) / fw, 0., 1.); }
Frost frostAt(vec2 p, float fw){
  Frost f = Frost(0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 1.);
  vec2 uv = (p - uFrostBox.xy) * uFrostBox.zw;
  if (uFrostT < 0. || uFrostFade <= 0. || uv.x < 0. || uv.y < 0. || uv.x > 1. || uv.y > 1.) return f;
  // the seed point frosts over solid: a crust that spreads a little behind the front
  float rs = length(p - uFrostSeed.xz);
  float cr = .06 + .5 * smoothstep(0., 1.4, uFrostT);
  f.crust = smoothstep(0., .3, uFrostT) * (1. - smoothstep(cr * .35, cr, rs + tn(vec3(p * 3.1, 4.)).x * .12)) * uFrostFade;
  vec4 A = texture2D(tFrostA, uv);
  float dc = A.x, age = uFrostT - A.y;
  if (dc > .05 || age < -.03) return f;
  vec4 B = texture2D(tFrostB, uv);
  float hw = B.x, lv = B.y, sd = B.z, along = B.w;
  // brightness varies along every stroke; the growth tip is crisp
  float vary = .5 + .5 * smoothstep(-.5, .6, tn(vec3(along * 7., sd * 40., lv * 3.)).x);
  float grown = smoothstep(-.006, .01, age);
  // hoarfrost is clumpy: crystals heap into beads along every needle
  float bead = .55 + .9 * smoothstep(.3, .85, tn(vec3(along * 90., sd * 31., lv * 5.)).y * .5 + .5);
  float hwv = hw * 2. * (.75 + .5 * vary) * bead, hwe = max(hwv, fw * .5);
  float cov = lineCover(dc, hwe, fw) * sqrt(hwv / hwe);
  f.ridge = 1. - smoothstep(0., hwe, dc) * .55;                 // brighter along its spine than at its edges
  f.line = cov * grown * (lv < .5 ? 1. : lv < 1.5 ? .85 : .7) * (.55 + .45 * vary);
  // hair-fine barbs on both sides of every line, leaning forward at 60 degrees: the herringbone of
  // real frost feathers, finer than the bake can hold, drawn only where a pixel can show them
  float sp = .0028 + .0012 * sd;
  float c = along - dc * 1.;                                     // 45 degrees, leaning toward the tip
  float mdist = abs(fract(c / sp + sd * 13.) - .5) * sp * .71;
  float reach = .0022 + .0055 * (1. - lv * .3) * vary;
  f.micro = lineCover(mdist, .00026, fw) * (1. - smoothstep(reach * .55, reach, dc)) * step(hwv, dc) * (1. - smoothstep(.0014, .004, fw)) * smoothstep(.04, .25, age);
  f.rime = smoothstep(0., .7, age) * (exp(-dc / .0035) * .5 + exp(-dc / .01) * .08) * (.6 + .4 * vary);
  f.fresh = (exp(-max(age, 0.) * 1.8) * .85 + .15 * exp(-max(age, 0.) * .12)) * grown;   // a glow that lingers faintly
  f.tip = exp(-abs(age) * 45.) * step(dc, hw + fw * 1.5) * step(-.02, age);
  f.cell = h12(vec2(floor(along / .0045), sd * 97. + lv));
  f.lv = lv; f.on = grown; f.along = along; f.sd = sd; f.dc = dc;
  f.line *= uFrostFade; f.micro *= uFrostFade; f.rime *= uFrostFade; f.fresh *= uFrostFade; f.tip *= uFrostFade;
  return f;
}
// how much frost covers p, cheaply: for the shadow it casts on the snow beside it
float frostCover(vec2 p, float fw){
  vec2 uv = (p - uFrostBox.xy) * uFrostBox.zw;
  if (uFrostT < 0. || uv.x < 0. || uv.y < 0. || uv.x > 1. || uv.y > 1.) return 0.;
  vec4 A = texture2D(tFrostA, uv);
  if (A.x > .02 || uFrostT < A.y) return 0.;
  float hw = texture2D(tFrostB, uv).x * 1.9;
  return lineCover(A.x, max(hw, fw * .45), fw) * uFrostFade;
}`;

const FS_VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;

// ----------------------------------------------------------------------------- convex hulls
// A solid built from half-spaces n.x <= d: clip a big cube by each plane, keep the cut ring as a face.
function clipHull(V3, planes, B = 6) {
  let faces = [];
  for (let ax = 0; ax < 3; ax++) for (const sg of [-1, 1]) {
    const n = new V3(); n.setComponent(ax, sg);
    const u = new V3(); u.setComponent((ax + 1) % 3, 1); const w = new V3().crossVectors(n, u);
    const v = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => n.clone().multiplyScalar(B).addScaledVector(u, a * B).addScaledVector(w, b * B));
    faces.push({ n, d: B, v, pi: -1 });
  }
  const _t = new V3(), _s = new V3();
  planes.forEach((P, pi) => {
    const out = [], cap = [];
    for (const F of faces) {
      const res = [];
      for (let i = 0; i < F.v.length; i++) {
        const a = F.v[i], b = F.v[(i + 1) % F.v.length], da = a.dot(P.n) - P.d, db = b.dot(P.n) - P.d;
        if (da <= 0) res.push(a);
        if ((da <= 0) !== (db <= 0)) { const p = a.clone().lerp(b, da / (da - db)); res.push(p); cap.push(p); }
      }
      if (res.length >= 3) out.push({ n: F.n, d: F.d, v: res, pi: F.pi });
    }
    if (cap.length >= 3) {
      const pts = [];
      for (const p of cap) if (!pts.some((q) => q.distanceToSquared(p) < 1e-12)) pts.push(p);
      if (pts.length >= 3) {
        const c = pts.reduce((s, p) => s.add(p), new V3()).divideScalar(pts.length);
        const u = new V3().crossVectors(P.n, Math.abs(P.n.y) < 0.9 ? new V3(0, 1, 0) : new V3(1, 0, 0)).normalize(), w = new V3().crossVectors(P.n, u);
        pts.sort((p, q) => Math.atan2(_t.subVectors(p, c).dot(w), _t.dot(u)) - Math.atan2(_s.subVectors(q, c).dot(w), _s.dot(u)));
        out.push({ n: P.n.clone(), d: P.d, v: pts, pi });
      }
    }
    faces = out;
  });
  return faces;
}
function hullVerts(faces) {
  const out = [];
  for (const F of faces) for (const p of F.v) if (!out.some((q) => q.distanceToSquared(p) < 1e-10)) out.push(p);
  return out;
}
// add a bevel plane along every edge between two of the given planes (main faces only)
function bevelPlanes(V3, faces, planes, width, skip = () => false) {
  const out = [];
  for (let i = 0; i < faces.length; i++) for (let j = i + 1; j < faces.length; j++) {
    const A = faces[i], B = faces[j];
    if (A.pi < 0 || B.pi < 0 || skip(A.pi) || skip(B.pi)) continue;
    let shared = 0;
    for (const p of A.v) if (B.v.some((q) => q.distanceToSquared(p) < 1e-10)) shared++;
    if (shared < 2) continue;
    const s = new V3().addVectors(A.n, B.n), L = s.length();
    if (L < 1e-3) continue;
    out.push({ n: s.divideScalar(L), d: (planes[A.pi].d + planes[B.pi].d) / L - width, bevel: true });
  }
  return out;
}
function hullGeometry(THREE, faces) {
  const pos = [], nrm = [];
  for (const F of faces) for (let i = 1; i < F.v.length - 1; i++) for (const p of [F.v[0], F.v[i], F.v[i + 1]]) { pos.push(p.x, p.y, p.z); nrm.push(F.n.x, F.n.y, F.n.z); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.computeBoundingSphere();
  return g;
}
function hullVolume(faces) {
  let v = 0;
  for (const F of faces) for (let i = 1; i < F.v.length - 1; i++) { const a = F.v[0], b = F.v[i], c = F.v[i + 1]; v += a.x * (b.y * c.z - b.z * c.y) - a.y * (b.x * c.z - b.z * c.x) + a.z * (b.x * c.y - b.y * c.x); }
  return v / 6;
}

export function createFrostEnergy(THREE, { renderer, scene, camera, seed = 7 } = {}) {
  const V3 = THREE.Vector3;
  const rnd = mulberry32(seed);
  const R = (a = 0, b = 1) => a + (b - a) * rnd();
  const UP = new V3(0, 1, 0);
  const _a = new V3(), _b = new V3(), _c = new V3(), _d = new V3(), _e = new V3();
  const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _m = new THREE.Matrix4(), _col = new THREE.Color();

  const palette = {
    glow: new THREE.Color(0.44, 0.64, 1.0),      // the ice's inner light (linear): cyan, kept saturated so ACES does not bleach it
    tip: new THREE.Color(0.75, 0.92, 1.0),       // the frost's growth tip
    light: new THREE.Color(0.5, 0.68, 1.0),      // what the ice casts on snow
    flash: new THREE.Color(0.8, 0.9, 1.0),       // white-cold flashes
  };
  const options = { flashes: 'full', shake: 1, fisheye: 1, ice: 'traced' };

  const group = new THREE.Group(); group.name = 'frost-energy';
  scene.add(group);
  const res = new THREE.Vector2(1, 1);
  let dpr = 1;
  const uniforms = { uTime: { value: 0 }, uResolution: { value: res }, uDpr: { value: 1 }, tNoise: { value: null } };
  const layer = (o, l) => { o.layers.set(l); o.frustumCulled = false; return o; };

  // ---------------------------------------------------------------- clock
  const clock = { sim: 0, real: 0, hold: 0, base: 1, rampFrom: 1, rampTo: 1, rampT: 1, rampDur: 0, rampValue: 1 };
  function ramp(to, seconds = 0.4) { clock.rampFrom = clock.rampValue; clock.rampTo = to; clock.rampT = 0; clock.rampDur = Math.max(seconds, 1e-4); }

  // ---------------------------------------------------------------- lights: they swell and settle
  const NL = 8;
  const lightPos = Array.from({ length: NL }, () => new V3(0, -50, 0));
  const lightCol = Array.from({ length: NL }, () => new V3());
  const moonDir = new V3(0.35, 0.36, -0.86).normalize();   // behind the scene from the cameras' side: the snow and the ice are backlit, and facets can glint
  const lightUniforms = {
    uLightPos: { value: lightPos }, uLightCol: { value: lightCol },
    uMoonDir: { value: moonDir }, uMoonCol: { value: new V3(0.05, 0.062, 0.082) }, uSkyAmb: { value: new V3(0.0052, 0.0088, 0.0148) },
  };
  // energy eases toward `target` at `rate`; a flash adds on top and decays at `decay`
  const lights = lightPos.map(() => ({ energy: 0, target: 0, rate: 4, flash: 0, decay: 8, color: palette.light.clone(), want: new V3(), follow: 12 }));
  function setLight(i, pos, target, { rate = 4, color = null, snap = false } = {}) {
    const L = lights[i];
    if (pos) { if (snap || L.energy + L.flash < 0.02) lightPos[i].copy(pos); L.want.copy(pos); }
    L.target = target; L.rate = rate; if (color) L.color.copy(color);
  }
  function flashLight(i, pos, energy, decay = 8, color = null) {
    const L = lights[i];
    if (pos) { lightPos[i].copy(pos); L.want.copy(pos); }
    L.flash = Math.max(L.flash, energy); L.decay = decay; if (color) L.color.copy(color);
  }
  function updateLights(dt) {
    for (let i = 0; i < NL; i++) {
      const L = lights[i];
      L.energy += (L.target - L.energy) * (1 - Math.exp(-L.rate * dt));
      L.flash *= Math.exp(-L.decay * dt);
      lightPos[i].lerp(L.want, 1 - Math.exp(-L.follow * dt));
      const e = L.energy + L.flash;
      lightCol[i].set(L.color.r, L.color.g, L.color.b).multiplyScalar(e);
    }
  }

  // ---------------------------------------------------------------- render targets and post
  const rtOpts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: false, samples: 0, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
  const depthTex = new THREE.DepthTexture(1, 1);
  depthTex.type = THREE.UnsignedIntType; depthTex.minFilter = depthTex.magFilter = THREE.NearestFilter;
  const rtColor = new THREE.WebGLRenderTarget(1, 1, { ...rtOpts, depthBuffer: true, depthTexture: depthTex });
  const rtScene = new THREE.WebGLRenderTarget(1, 1, { ...rtOpts, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
  const rtMist = new THREE.WebGLRenderTarget(1, 1, rtOpts), rtMist2 = new THREE.WebGLRenderTarget(1, 1, rtOpts);
  const rtCol = new THREE.WebGLRenderTarget(1, 1, rtOpts);   // the blizzard column, at half resolution so its fibres hold
  const rtDistort = new THREE.WebGLRenderTarget(1, 1, rtOpts);
  // the finished frame in 8 bits, its alpha marking ice, for the edge anti-aliasing pass
  const rtLDR = new THREE.WebGLRenderTarget(1, 1, { type: THREE.UnsignedByteType, format: THREE.RGBAFormat, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  const BLOOM_LEVELS = 5;
  const down = [], up = [];
  for (let i = 0; i < BLOOM_LEVELS; i++) { down.push(new THREE.WebGLRenderTarget(1, 1, rtOpts)); up.push(new THREE.WebGLRenderTarget(1, 1, rtOpts)); }
  const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const fsScene = new THREE.Scene();
  const fsMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); fsMesh.frustumCulled = false; fsScene.add(fsMesh);
  const pass = (mat, target) => { fsMesh.material = mat; renderer.setRenderTarget(target); renderer.render(fsScene, fsCam); };

  // the baked noise
  const noiseRT = new THREE.WebGL3DRenderTarget(96, 96, 96, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
  // WebGL3DRenderTarget swaps in a Data3DTexture that defaults to NEAREST and 8-bit: set it on the texture
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

  const copyMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: null } }, vertexShader: FS_VERT, depthTest: false, depthWrite: false,
    fragmentShader: `uniform sampler2D tSrc; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tSrc, vUv).rgb, 1.); }`,
  });

  // ---------------------------------------------------------------- frost: grown on the CPU, baked to a distance field
  const frost = {
    t: -1, speed: 1, fade: 1, glow: 1, data: null, origin: new V3(), dir: new V3(1, 0, 0), box: new THREE.Vector4(), size: [1, 1],
    uniforms: { tFrostA: { value: null }, tFrostB: { value: null }, uFrostBox: { value: new THREE.Vector4() }, uFrostT: { value: -1 }, uFrostFade: { value: 1 }, uFrostGlow: { value: 1 }, uFrostSeed: { value: new V3() } },
  };
  function growFrostField({ origin, dir, radius = 5.6, area, seed: fseed = 7, res: texW = 2048 } = {}) {
    const F = growFrost({ seed: fseed, origin: [origin.x, origin.z], dir: [dir.x, dir.z], radius, area });
    frost.data = F; frost.origin.copy(origin); frost.dir.copy(dir); frost.uniforms.uFrostSeed.value.copy(origin);
    const W = area[2] - area[0], H = area[3] - area[1];
    const tw = texW, th = Math.round(texW * H / W);
    frost.size = [tw, th];
    const rt = new THREE.WebGLRenderTarget(tw, th, { count: 2, type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: true, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false });
    const box = new THREE.Vector4(area[0], area[1], 1 / W, 1 / H);
    frost.box.copy(box);
    // instanced capsules: each segment writes its distance field; the depth test keeps the nearest
    const geo = new THREE.InstancedBufferGeometry();
    const q = new THREE.PlaneGeometry(1, 1); geo.index = q.index; geo.setAttribute('position', q.getAttribute('position'));
    const n = F.count, iSeg = new Float32Array(n * 4), iT = new Float32Array(n * 4), iL = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const s = F.seg, o = i * 12;
      iSeg.set([s[o], s[o + 1], s[o + 2], s[o + 3]], i * 4);
      iT.set([s[o + 4], s[o + 5], s[o + 6], s[o + 7]], i * 4);
      iL.set([s[o + 8], s[o + 9], s[o + 10], s[o + 11]], i * 4);
    }
    geo.setAttribute('iSeg', new THREE.InstancedBufferAttribute(iSeg, 4));
    geo.setAttribute('iT', new THREE.InstancedBufferAttribute(iT, 4));
    geo.setAttribute('iL', new THREE.InstancedBufferAttribute(iL, 4));
    geo.instanceCount = n;
    const RAD = 0.045;
    const mat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: { uBox: { value: box }, uR: { value: RAD } },
      vertexShader: /* glsl */`
        in vec4 iSeg; in vec4 iT; in vec4 iL;
        uniform vec4 uBox; uniform float uR;
        out vec2 vP; out vec4 vSeg; out vec4 vT; out vec4 vL;
        void main(){
          vec2 a = iSeg.xy, b = iSeg.zw, d = b - a; float L = length(d);
          vec2 t = L > 1e-6 ? d / L : vec2(1., 0.), n = vec2(-t.y, t.x);
          vec2 p = mix(a - t * uR, b + t * uR, position.x + .5) + n * position.y * 2. * uR;
          vP = p; vSeg = iSeg; vT = iT; vL = iL;
          gl_Position = vec4(((p - uBox.xy) * uBox.zw) * 2. - 1., 0., 1.);
        }`,
      fragmentShader: /* glsl */`
        uniform float uR;
        in vec2 vP; in vec4 vSeg; in vec4 vT; in vec4 vL;
        layout(location = 0) out vec4 oA;
        layout(location = 1) out vec4 oB;
        void main(){
          vec2 a = vSeg.xy, ab = vSeg.zw - vSeg.xy;
          float u = clamp(dot(vP - a, ab) / max(dot(ab, ab), 1e-12), 0., 1.);
          float dc = length(vP - (a + ab * u));
          float hw = mix(vT.z, vT.w, u), e = dc - hw;
          if (e > uR) discard;
          gl_FragDepth = clamp((e + .01) / (uR + .01), 0., 1.);
          oA = vec4(dc, mix(vT.x, vT.y, u), normalize(ab + 1e-9));
          oB = vec4(hw, vL.x, vL.y, mod(mix(vL.z, vL.w, u), .5));   // arc length kept modulo 0.5 m: a half float holds it to 0.2 mm there
        }`,
      depthTest: true, depthWrite: true,
    });
    const initMat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: `void main(){ gl_Position = vec4(position.xy, 1., 1.); }`,
      fragmentShader: `layout(location = 0) out vec4 oA; layout(location = 1) out vec4 oB; void main(){ oA = vec4(1., 99., 1., 0.); oB = vec4(0.); }`,
      depthTest: false, depthWrite: false,
    });
    const bakeScene = new THREE.Scene();
    const init = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), initMat); init.frustumCulled = false; init.renderOrder = 0;
    const segs = new THREE.Mesh(geo, mat); segs.frustumCulled = false; segs.renderOrder = 1;
    bakeScene.add(init, segs);
    const prev = renderer.getRenderTarget(), ac = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setRenderTarget(rt); renderer.clear(true, true, false);
    renderer.render(bakeScene, fsCam);
    renderer.setRenderTarget(prev); renderer.autoClear = ac;
    geo.dispose(); mat.dispose(); initMat.dispose();
    frost.rt = rt;
    frost.uniforms.tFrostA.value = rt.textures[0]; frost.uniforms.tFrostB.value = rt.textures[1];
    buildTipStars(F);
    buildHubClumps(origin);
    frost.uniforms.uFrostBox.value.copy(box);
    return F;
  }
  // the growing tips glow: a small cold star at the end of every main arm, tiny blue sparks on the side branches
  const tipStars = { mesh: null, mat: null };
  function buildTipStars(F) {
    const r2 = mulberry32(9137);
    const list = [];
    for (const [x, z, t, lv, len] of F.tips) {
      if (lv === 0) {
        const big = len > 0.9 && Math.hypot(x - frost.origin.x, z - frost.origin.z) > 3.2;
        list.push([x, z, t, big ? -(0.05 + 0.03 * Math.min(1, len / 2)) : 0.03, big ? 1.2 + 0.5 * r2() : 0.8 + 0.4 * r2()]);
        // the needle tips round a growing arm catch the light too: a cluster of small glints
        if (big) for (let k = 0; k < 10; k++) list.push([x + (r2() - 0.5) * 0.24, z + (r2() - 0.5) * 0.24, t + 0.03 + r2() * 0.1, 0.007 + 0.006 * r2(), 0.8 + 0.8 * r2()]);
      } else if (r2() < 0.09) list.push([x, z, t, 0.009 + 0.008 * r2(), 0.35 + 0.5 * r2()]);
    }
    const n = list.length;
    const geo = new THREE.InstancedBufferGeometry();
    const q = new THREE.PlaneGeometry(1, 1); geo.index = q.index; geo.setAttribute('position', q.getAttribute('position'));
    const iA = new Float32Array(n * 4), iB = new Float32Array(n * 4);
    list.forEach(([x, z, t, sz, br], i) => { iA.set([x, 0.004, z, t], i * 4); iB.set([sz, br, r2() * 50, 0], i * 4); });
    geo.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); geo.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
    geo.instanceCount = n;
    const mat = new THREE.ShaderMaterial({
      uniforms: { uT: frost.uniforms.uFrostT, uFade: frost.uniforms.uFrostFade, uTime: uniforms.uTime, uResolution: uniforms.uResolution, uDpr: uniforms.uDpr },
      vertexShader: /* glsl */`
        attribute vec4 iA; attribute vec4 iB;
        uniform float uT, uFade, uTime; uniform vec2 uResolution; uniform float uDpr;
        varying vec2 vQ; varying float vI; varying float vBig;
        void main(){
          vec4 mv = viewMatrix * vec4(iA.xyz, 1.);
          float sz = abs(iB.x);
          float px = sz * projectionMatrix[1][1] * uResolution.y * .5 / max(-mv.z, .05);
          float minPx = iB.x < 0. ? 14. * clamp(6.5 / max(-mv.z, .1), .35, 1.2) : 3.;   // the main arms' tips: a halo, smaller far away
          float s = sz * max(1., minPx * uDpr / max(px, 1e-3));
          mv.xy += position.xy * 2. * s;
          vQ = position.xy * 2.;
          float age = uT - iA.w;
          float on = step(0., age) * step(0., uT);
          // a flare as the tip arrives, then a steady glow that breathes very slowly
          vI = on * iB.y * (1. + 2.5 * exp(-max(age, 0.) * 3.)) * (.85 + .15 * sin(uTime * .9 + iB.z)) * uFade * (iB.x < 0. ? 1. : min(1., px / (3. * uDpr) + .25));
          vBig = iB.x < 0. ? 1. : 0.;
          vI *= 1. - .75 * smoothstep(8.5, 13., -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        varying vec2 vQ; varying float vI; varying float vBig;
        void main(){
          float r = length(vQ);
          float core = exp(-r * r * mix(60., 220., vBig)), halo = exp(-r * r * mix(9., 5., vBig)) * (1. - smoothstep(.7, 1., r));
          vec3 col = vec3(.85, .93, 1.) * core * mix(3.2, 4.5, vBig) + vec3(.36, .6, 1.) * halo * mix(.7, .32, vBig);
          gl_FragColor = vec4(col * vI, 1.);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const mesh = layer(new THREE.Mesh(geo, mat), LAYERS.fx); mesh.renderOrder = 30;
    group.add(mesh);
    tipStars.mesh = mesh; tipStars.mat = mat;
  }
  // the heap where the frost landed: a pile of real crystal clumps, so the hub stands up off the snow
  const hub = { mesh: null, list: [], lastT: -9, lastF: -1 };
  function buildHubClumps(origin) {
    const r3 = mulberry32(5521);
    const P = [];
    for (let k = 0; k < 9; k++) { const n = new V3(r3() * 2 - 1, (r3() * 2 - 1) * 1.6, r3() * 2 - 1).normalize(); P.push({ n, d: 0.5 + r3() * 0.35 }); }
    for (const sg of [-1, 1]) P.push({ n: new V3(0, sg, 0), d: 1 });
    const faces = clipHull(V3, P, 3);
    for (const F of faces) { for (const p of F.v) { p.x *= 0.45; p.z *= 0.45; } F.n = new V3(F.n.x / 0.45, F.n.y, F.n.z / 0.45).normalize(); }
    const geo = hullGeometry(THREE, faces);
    const hv = hullVerts(faces);
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...lightUniforms },
      vertexShader: /* glsl */`varying vec3 vW; varying vec3 vN; varying float vS;
        void main(){ vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix * instanceMatrix) * normal); vS = fract(float(gl_InstanceID) * .618); gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: LIGHTS_GLSL + /* glsl */`
        varying vec3 vW; varying vec3 vN; varying float vS;
        void main(){
          vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
          vec3 alb = vec3(.86, .93, 1.);
          float ndl = max(dot(N, uMoonDir), 0.);
          float top = smoothstep(-.3, .9, N.y);
          // hoarfrost scatters light through itself: every face is bright, the tops brightest
          vec3 col = alb * (uSkyAmb * 12. + uMoonCol * (2.3 + 2.2 * ndl) + lightsAt(vW) * 1.6) * (.7 + .6 * top);
          vec3 H = normalize(uMoonDir + V);
          col += vec3(.85, .93, 1.) * pow(max(dot(N, H), 0.), 70.) * 6. * uMoonCol * 20. * step(.35, vS);
          col += energyLight(vW, N, V, vec3(.1), .15) * 1.5;
          gl_FragColor = vec4(col, 1.);
        }`,
    });
    const n = 170;
    const mesh = layer(new THREE.InstancedMesh(geo, mat, n), LAYERS.world); mesh.count = 0; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    group.add(mesh);
    for (let i = 0; i < n; i++) {
      const rr = 0.3 * Math.pow(r3(), 1.15), an = r3() * 6.2832;
      const s = (0.012 + 0.022 * r3()) * (1 - 0.65 * rr / 0.3) * (1 + 0.9 * Math.max(0, 1 - rr / 0.15));   // the tallest crystals heap in the middle
      const pile = 0;                                                   // every clump stands on the snow, a third of it sunk in the crust        // stacked a little higher toward the middle
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(r3() * 3, r3() * 6.28, r3() * 3));
      let bot = 0; for (const p of hv) { const y = p.clone().applyQuaternion(q).y; if (y < bot) bot = y; }
      hub.list.push({ x: origin.x + Math.cos(an) * rr, z: origin.z + Math.sin(an) * rr, y: pile, s, q, bot: -bot, t0: 0.05 + rr * 2.2 + r3() * 0.12 });
    }
    hub.mesh = mesh;
  }
  const _hs = new V3(), _hp = new V3();
  function updateHubClumps() {
    if (!hub.mesh) return;
    const t = frost.t, f = frost.fade;
    if (t === hub.lastT && f === hub.lastF) return;
    hub.lastT = t; hub.lastF = f;
    let n = 0;
    if (t >= 0) for (const C of hub.list) {
      const g = Math.min(1, Math.max(0, (t - C.t0) / 0.35));
      if (g <= 0) continue;
      const sc = C.s * (1 - Math.pow(1 - g, 3)) * f;
      if (sc < 1e-4) continue;
      _hs.set(sc, sc, sc); _hp.set(C.x, C.y + sc * C.bot * 0.7, C.z);   // its lowest corner a little into the crust
      _m.compose(_hp, C.q, _hs); hub.mesh.setMatrixAt(n++, _m);
    }
    hub.mesh.count = n; hub.mesh.instanceMatrix.needsUpdate = true;
  }
  // where a seed stem's tip is at time t (for the lights that ride the front)
  function stemTip(path, t, out) {
    if (!path || !path.length) return null;
    let lo = 0, hi = path.length - 1;
    if (t <= path[0][2]) return out.set(path[0][0], 0, path[0][1]);
    if (t >= path[hi][2]) return out.set(path[hi][0], 0, path[hi][1]);
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (path[m][2] <= t) lo = m; else hi = m; }
    const A = path[lo], B = path[hi], u = (t - A[2]) / Math.max(1e-6, B[2] - A[2]);
    return out.set(A[0] + (B[0] - A[0]) * u, 0, A[1] + (B[1] - A[1]) * u);
  }
  // a point along the spine at arc length s, with its arrival time
  function spineAt(s) {
    const P = frost.data.spine; let acc = 0;
    let px = frost.origin.x, pz = frost.origin.z, pt = 0;
    for (const [x, z, t] of P) {
      const L = Math.hypot(x - px, z - pz);
      if (acc + L >= s) { const u = (s - acc) / Math.max(L, 1e-6); return { x: px + (x - px) * u, z: pz + (z - pz) * u, t: pt + (t - pt) * u, dir: Math.atan2(z - pz, x - px) }; }
      acc += L; px = x; pz = z; pt = t;
    }
    return { x: px, z: pz, t: pt, dir: 0 };
  }

  // ---------------------------------------------------------------- ice: traced against its own planes
  const MAXPL = 20;
  const ICE_VERT = /* glsl */`
    varying vec3 vObj; varying vec3 vN; varying vec3 vW;
    void main(){
      vObj = position; vN = normal;
      vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w;
    }`;
  const ICE_FRAG = TNOISE_GLSL + HASH_GLSL + LIGHTS_GLSL + /* glsl */`
    #define MAXPL ${MAXPL}
    uniform mat4 modelMatrix, projectionMatrix;
    uniform vec4 uPl[MAXPL]; uniform int uNPl; uniform int uFresh;
    uniform vec4 uCrA[6]; uniform vec4 uCrB[6]; uniform vec4 uCrFront;
    uniform vec3 uCamObj, uGlowCol, uSigma, uCrackCol, uCore;
    uniform vec4 uGroundObj;
    uniform float uScale, uGlow, uFrost, uSeed, uHeight, uFade, uFlat;
    uniform sampler2D tScene;
    varying vec3 vObj; varying vec3 vN; varying vec3 vW;
    vec3 envSky(vec3 d){
      vec3 sky = mix(vec3(.010, .015, .026), vec3(.003, .005, .011), smoothstep(0., .5, d.y));
      vec3 gnd = vec3(.02, .028, .044);
      return d.y > 0. ? sky : mix(vec3(.010, .015, .026), gnd, smoothstep(0., -.12, d.y));
    }
    // what a ray leaving the ice sees: the ground where it lands, or the sky far off, read from the world pass
    vec3 sceneAt(vec3 pw, vec3 dw, float lod){
      vec3 q = dw.y < -.02 ? pw + dw * (max(pw.y, 0.) / -dw.y) : pw + dw * 30.;
      vec4 c = projectionMatrix * viewMatrix * vec4(q, 1.);
      if (c.w <= .02) return envSky(dw);
      vec2 uv = c.xy / c.w * .5 + .5;
      vec2 e = min(uv, 1. - uv);
      float inside = smoothstep(-.01, .05, min(e.x, e.y));
      return mix(envSky(dw), textureLod(tScene, clamp(uv, .002, .998), lod).rgb, inside);
    }
    // a fracture network: the borders of a 3-D Voronoi tiling of the ice, F2 - F1 small near a border
    float vorEdge(vec3 x){
      vec3 i = floor(x), f = fract(x); float d1 = 8., d2 = 8.;
      for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int xx = -1; xx <= 1; xx++) {
        vec3 g = vec3(float(xx), float(y), float(z));
        vec3 r = g + h44(vec4(i + g, uSeed)).xyz * .85 - f;
        float dd = dot(r, r);
        if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) d2 = dd;
      }
      return sqrt(d2) - sqrt(d1);
    }
    vec3 iceSpec(vec3 P, vec3 N, vec3 V, float sharp){
      vec3 acc = vec3(0.);
      for (int i = 0; i < 8; i++) {
        vec3 L = uLightPos[i] - P; float d2 = max(dot(L, L), 1e-4); L *= inversesqrt(d2);
        acc += uLightCol[i] * pow(max(dot(N, normalize(L + V)), 0.), sharp) * 2.2 / (1. + d2 * .45);
      }
      acc += uMoonCol * pow(max(dot(N, normalize(uMoonDir + V)), 0.), sharp * 1.5) * 9.;
      return acc;
    }
    void main(){
      if (vW.y < 0.) discard;                                   // still under the snow it is rising through
      vec3 o = vObj, Nf = normalize(vN);
      mat3 M = mat3(modelMatrix) / uScale;
      vec3 V = normalize(o - uCamObj);
      vec3 Vw = normalize(vW - cameraPosition);
      vec3 om = o * uScale;
      // the face this pixel is on, and how far the nearest edge is (second-nearest plane)
      float s1 = 1e9, s2 = 1e9; int i1 = 0;
      for (int i = 0; i < MAXPL; i++) { if (i >= uNPl) break; float s = uPl[i].w - dot(uPl[i].xyz, o); if (s < s1) { s2 = s1; s1 = s; i1 = i; } else if (s < s2) s2 = s; }
      float edge = s2 * uScale;
      bool fresh = ((uFresh >> i1) & 1) == 1;                   // a fracture face: clear, no rime yet
      // a running crack meets the surface: a jagged white hairline, its newest part glowing
      float crackS = 0.;
      for (int c = 0; c < 4; c++) {
        vec4 CA = uCrA[c], CB = uCrB[c];
        if (CB.w <= 0.) continue;
        float rr = length(o - CB.xyz);
        float lim = CB.w * (.8 + .35 * tn(o * 7. * uScale + float(c) * 3.1).x);
        if (rr > lim) continue;
        float dpl = abs(dot(CA.xyz, o) - CA.w + tn(om * 38. + float(c) * 9.).x * .004 / uScale) * uScale;
        crackS = max(crackS, (1. - smoothstep(.0005, .0022, dpl)) * (.65 + .35 * smoothstep(lim * .6, lim, rr)) + (1. - smoothstep(.0, .012, dpl)) * .12);
      }
      // rime: frosted bands along the edges, the snow it broke through clinging to its foot, crystalline patches
      float pn = tfbm3(om * 5.5 + uSeed);
      float rimeE = 1. - smoothstep(.0015, .012 + .02 * (pn * .5 + .5), edge);
      float foot = 1. - smoothstep(0., .025 + .045 * (pn * .5 + .5), vW.y);
      float patches = smoothstep(.3, .62, pn + tn(om * 17. + uSeed).y * .25);
      float streak = smoothstep(.55, .9, tn(vec3(om.x * 60., om.y * 1.6, om.z * 60.) + uSeed).x * .5 + .5) * smoothstep(.2, .6, pn * .5 + .5);   // rime streaks along the growth
      rimeE = 1. - smoothstep(.001, .004 + .008 * (pn * .5 + .5), edge);
      float frost = clamp(max(rimeE * .45, foot) * uFrost, 0., 1.) * (fresh ? .15 : 1.);
      // the fracture network on the surface: crisp hairlines, broken here and there like real cracks
      vec3 cq = om / .1;
      float ce = vorEdge(cq + tn(om * 9. + uSeed).xyz * .12);
      float cw = fwidth(ce) * .7 + .002;
      float cmask = smoothstep(-.05, .3, tn(om * 4. + uSeed + 7.).y);
      float crackNet = (1. - smoothstep(cw * .4, cw, ce)) * cmask * (fresh ? .4 : 1.);
      vec3 g1 = tn(om * 38. + uSeed).xyz, g2 = tn(om * 7. + uSeed * 1.3).xyz;
      vec3 N = normalize(Nf + g1 * .1 * frost + g2 * .018);
      vec3 Nw = normalize(M * N);
      float cosI = clamp(dot(-V, N), 0., 1.);
      float F = .02 + .98 * pow(1. - cosI, 5.);
      float lodR = frost * 3.;
      vec3 refl = sceneAt(vW, reflect(Vw, Nw), lodR * .5) + iceSpec(vW, Nw, -Vw, mix(900., 60., frost));
      // inside: refract, walk to the exit plane, total internal reflection is the rule, Beer-Lambert blue
      vec3 p = o, d = refract(V, N, 1. / 1.31);
      vec3 acc = vec3(0.), T = vec3(1.);
      float w = 1., path = 0., milky = 0.;
      for (int leg = 0; leg < 3; leg++) {
        float tx = 1e9; int ix = 0;
        for (int i = 0; i < MAXPL; i++) { if (i >= uNPl) break; float dn = dot(uPl[i].xyz, d); if (dn > 1e-5) { float t = (uPl[i].w - dot(uPl[i].xyz, p)) / dn; if (t < tx) { tx = t; ix = i; } } }
        tx = max(tx, 0.);
        bool ground = false;
        float gd = dot(uGroundObj.xyz, d);
        if (gd < -1e-5) { float tg = (uGroundObj.w - dot(uGroundObj.xyz, p)) / gd; if (tg > 0. && tg < tx) { tx = tg; ground = true; } }
        // cracks this leg crosses: thin air gaps, silver at a grazing angle, nearly invisible face-on
        for (int c = 0; c < 6; c++) {
          vec4 CA = uCrA[c], CB = uCrB[c];
          if (CB.w <= 0.) continue;
          float dn = dot(CA.xyz, d); if (abs(dn) < 1e-4) continue;
          float tc = (CA.w - dot(CA.xyz, p)) / dn;
          if (tc <= 0. || tc >= tx) continue;
          vec3 h = p + d * tc; float rr = length(h - CB.xyz);
          float lim = CB.w * (c < 4 ? .8 + .35 * tn(h * 7. * uScale + float(c) * 3.1).x : .5 + .7 * (tn(h * 4. * uScale + float(c) * 3.1).x * .5 + .5));
          if (rr > lim) continue;
          float graze = 1. - abs(dn);
          float sheen = .12 + .88 * graze * graze * graze;
          vec3 hp = h * uScale;
          float plume = .55 + .45 * smoothstep(-.3, .5, tn(hp * vec3(26., 26., 26.) + float(c) * 5.).x) * (.6 + .4 * tn(hp * 70. + float(c)).y);   // feathery texture on the fracture face
          float fw4 = c == 0 ? uCrFront.x : c == 1 ? uCrFront.y : c == 2 ? uCrFront.z : c == 3 ? uCrFront.w : 0.;
          float front = smoothstep(lim * .85, lim, rr) * fw4;                                           // a running crack's front shows as a bright line
          float rimFade = c < 4 ? 1. : 1. - smoothstep(lim * .45, lim, rr);
          acc += w * T * uCrackCol * (sheen * plume * rimFade + front * 1.3);
          w *= 1. - .55 * sheen;
        }
        // the fracture network seen through the ice: the ray crossing a crack sheet catches it as a bright line
        if (leg == 0) {
          float ci = 0.;
          for (int k = 0; k < 3; k++) {
            vec3 s = (p + d * tx * (float(k) + .45) / 3.) * uScale;
            float e = vorEdge(s / .1 + tn(s * 9. + uSeed).xyz * .12);
            ci += (1. - smoothstep(.0, .04, e)) * smoothstep(-.05, .3, tn(s * 4. + uSeed + 7.).y);
          }
          acc += w * T * vec3(.75, .86, 1.) * (.18 + lightsAt(vW) * .25 + uMoonCol * 2.) * ci * .55;
        }
        // trapped bubbles, frozen into columns along the growth axis
        if (leg == 0) {
          for (int k = 0; k < 4; k++) {
            vec3 s = p + d * tx * (float(k) + .5) / 4.;
            vec3 cs = vec3(.022, .06, .022) / uScale;
            vec3 cell = floor(s / cs);
            vec4 hh = h44(vec4(cell, uSeed));
            float coreK = exp(-dot(s.xz - uCore.xy, s.xz - uCore.xy) / (uCore.z * uCore.z) * 1.5);
            if (hh.w > .1 + .5 * coreK) continue;
            vec3 f = (cell + .2 + .6 * hh.xyz) * cs;
            float rb = (.0007 + .0024 * hh.x * hh.x) / uScale;
            vec3 fp = f - p; float al = dot(fp, d);
            if (al < 0. || al > tx) continue;
            float x = length(fp - d * al) / rb;
            if (x < 1.) acc += w * T * (uCrackCol * .8 + uGlowCol * uGlow * .5) * (smoothstep(.5, .92, x) * (1. - smoothstep(.92, 1., x)) * 1.6 + .08);
          }
        }
        // the milky core: where the ray passes close to the axis, the ice froze cloudy
        {
          vec2 dx = d.xz, px = p.xz - uCore.xy;
          float sx = clamp(-dot(px, dx) / max(dot(dx, dx), 1e-6), 0., tx);
          vec3 cp = p + d * sx;
          float yk = clamp(cp.y / max(uHeight, 1e-3), 0., 1.);
          float rc = uCore.z * (1. - .75 * yk);
          float r2 = dot(px + dx * sx, px + dx * sx);
          milky += exp(-r2 / (rc * rc)) * min(tx, rc * 3.) / (rc * 3.) * smoothstep(-.05, .05, cp.y);
        }
        path += tx;
        T = exp(-uSigma * path * uScale);
        vec3 p2 = p + d * tx;
        vec3 pw2 = (modelMatrix * vec4(p2, 1.)).xyz;
        if (ground) { acc += w * T * sceneAt(pw2 + vec3(0., .002, 0.), vec3(0., -1., 0.), 2.) * .55; w = 0.; break; }
        vec3 n2 = uPl[ix].xyz;
        if (leg < 2) {
          float e1 = 1e9, e2 = 1e9;
          for (int i = 0; i < MAXPL; i++) { if (i >= uNPl) break; float sv = uPl[i].w - dot(uPl[i].xyz, p2); if (sv < e1) { e2 = e1; e1 = sv; } else if (sv < e2) e2 = sv; }
          float eg = exp(-e2 * uScale / .0035);
          acc += w * T * (uCrackCol * .55 + uGlowCol * uGlow * .7) * eg * (leg == 0 ? 1. : .6);
        }
        vec3 dOut = refract(d, -n2, 1.31);
        if (dot(dOut, dOut) < 1e-5) { d = reflect(d, -n2); p = p2; continue; }
        float F2 = .02 + .98 * pow(1. - clamp(dot(dOut, n2), 0., 1.), 5.);
        acc += w * (1. - F2) * T * sceneAt(pw2, normalize(M * dOut), lodR + float(leg) * .7);
        w *= F2; d = reflect(d, -n2); p = p2;
      }
      acc += w * T * uSkyAmb * 3.;
      vec3 lit = lightsAt(vW);
      // subsurface: long paths scatter a little toward a milky blue lit by the moon and the ice's own light
      vec3 scat = (uSkyAmb * 2. + uMoonCol * .25 + lit * .12) * vec3(.45, .75, 1.);
      vec3 body = mix(acc, scat, clamp(1. - exp(-path * uScale * .9), 0., .1));
      // the magic light inside: a cold core along the axis, the foot where it meets the snow, a faint fill
      // the cold light within: a milky core, hottest low down, white-blue rather than cyan
      body += (vec3(.7, .82, 1.) * .06 + uGlowCol * uGlow * .5) * milky * T * (.25 + 4. * exp(-vW.y * 5.));
      body += uGlowCol * uGlow * (.004 * path * uScale + .12 * exp(-vW.y * 7.)) * T;
      vec3 col = body * (1. - F) + refl * F;
      // every facet edge a crisp bright line: a bevel catching the moon and the ice light
      float ew = fwidth(edge) * .9 + .0004;
      float rimH = 1. - smoothstep(ew * .5, ew * 1.6, edge);
      vec3 moonE = uMoonCol * (2.4 + 14. * pow(max(dot(Nw, normalize(uMoonDir - Vw)), 0.), 6.));
      col += rimH * (vec3(.8, .88, 1.) * .25 + refl * .8 + moonE + lit * .4 + uGlowCol * uGlow * .25);
      col += crackNet * vec3(.8, .9, 1.) * (.3 + lit * .5 + uMoonCol * 3. + uGlowCol * uGlow * .5) * .8;
      // frost on top: rough white crystals, lit like the snow but glittering
      float spark = step(.985, h12(floor(om.xy * 900.) + floor(om.z * 900.) * .37)) * pow(max(dot(Nw, normalize(uMoonDir - Vw)), 0.), 6.);
      vec3 frostCol = vec3(.78, .87, .97) * (uSkyAmb * 3.2 + uMoonCol * max(dot(Nw, uMoonDir), 0.) * .9 + lit * .4) + uGlowCol * uGlow * .12 + spark * vec3(.6, .8, 1.);
      col = mix(col, frostCol, frost * .82);
      col += crackS * (vec3(.85, .95, 1.) * (.9 + lit * .8) + uGlowCol * uGlow * 1.2);
      if (uFlat > .5) { col = vec3(.02, .05, .08) + uGlowCol * uGlow * .2 * (.5 + .5 * Nw.y) + refl * F * .5; }    // the failure: shaded plastic, nothing inside
      gl_FragColor = vec4(col * uFade, 0.);                    // alpha 0 marks ice for the edge anti-aliasing
    }`;
  const iceShared = { tScene: { value: rtScene.texture }, uGlowCol: { value: new V3(palette.glow.r, palette.glow.g, palette.glow.b) }, uSigma: { value: new V3(3.3, 1.75, 0.78) }, uFlat: { value: 0 } };
  function iceMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        ...lightUniforms, tNoise: uniforms.tNoise, ...iceShared,
        uPl: { value: Array.from({ length: MAXPL }, () => new THREE.Vector4(0, 0, 0, 1e3)) }, uNPl: { value: 0 }, uFresh: { value: 0 },
        uCrA: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 1, 0, 0)) }, uCrB: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, 0, 0)) }, uCrFront: { value: new THREE.Vector4() },
        uCamObj: { value: new V3() }, uCrackCol: { value: new V3(0.4, 0.5, 0.6) }, uCore: { value: new V3(0, 0, 0.05) },
        uGroundObj: { value: new THREE.Vector4(0, 1, 0, 0) },
        uScale: { value: 1 }, uGlow: { value: 0 }, uFrost: { value: 1 }, uSeed: { value: 0 }, uHeight: { value: 1 }, uFade: { value: 1 },
      },
      vertexShader: ICE_VERT, fragmentShader: ICE_FRAG,
    });
  }
  const _inv = new THREE.Matrix4(), _nrm = new THREE.Vector3();
  // per-frame: the camera and the ground in the piece's own frame
  function updateIceUniforms(mesh) {
    const u = mesh.material.uniforms;
    mesh.updateMatrixWorld();
    _inv.copy(mesh.matrixWorld).invert();
    u.uCamObj.value.copy(camera.position).applyMatrix4(_inv);
    const s = mesh.scale.x;
    _nrm.set(0, 1, 0).applyQuaternion(_q.copy(mesh.quaternion).invert());
    u.uGroundObj.value.set(_nrm.x, _nrm.y, _nrm.z, -mesh.position.y / s);
    u.uScale.value = s;
  }

  // a spike: an irregular faceted prism with a lopsided point, leaning out of the ground
  const spikes = [];
  function spikePlanes(rng, h, r) {
    const RR = (a, b) => a + (b - a) * rng();
    const P = [];
    const k = 4 + Math.floor(rng() * 3), phi0 = RR(0, 6.28);
    const alpha = Math.atan(r / (h * 1.2));
    for (let i = 0; i < k; i++) {
      const phi = phi0 + (i + RR(-0.26, 0.26)) / k * Math.PI * 2, ri = r * RR(0.7, 1.22);
      P.push({ n: new V3(Math.cos(phi) * Math.cos(alpha), Math.sin(alpha), Math.sin(phi) * Math.cos(alpha)), d: ri * Math.cos(alpha), kind: 'side' });
    }
    // some are blades: squashed across one direction
    const blade = rng() < 0.45 ? RR(0.25, 0.55) : 0, phB = RR(0, 6.28);
    for (const Pl of P) { const ph = Math.atan2(Pl.n.z, Pl.n.x); Pl.d *= 1 - blade * Math.cos(ph - phB) ** 2; }
    // chips: a few planes that slice a little off an edge, so the silhouette breaks and new facets catch the light
    const nChip = 1 + Math.floor(rng() * 3);
    for (let c = 0; c < nChip; c++) {
      const ph = RR(0, 6.28), yy = RR(0.15, 0.7) * h, tilt = RR(0.02, 0.55);   // never tilted down: that would slice the shaft off below
      const n = new V3(Math.cos(ph) * Math.cos(tilt), Math.sin(tilt), Math.sin(ph) * Math.cos(tilt)).normalize();
      const rAt = r * (1 - yy / (h * 1.2)) * (1 - blade * Math.cos(ph - phB) ** 2);
      P.push({ n, d: n.dot(new V3(0, yy, 0)) + rAt * RR(0.62, 0.85), kind: 'chip' });
    }
    const apex = new V3(RR(-0.18, 0.18) * r, h, RR(-0.18, 0.18) * r);
    const m = 2 + Math.floor(rng() * 3), psi0 = RR(0, 6.28);
    for (let j = 0; j < m; j++) {
      const psi = psi0 + (j + RR(-0.2, 0.2)) / m * Math.PI * 2, g = RR(1.12, 1.38);
      const n = new V3(Math.cos(psi) * Math.sin(g), Math.cos(g), Math.sin(psi) * Math.sin(g));
      P.push({ n, d: n.dot(apex) + RR(-0.004, 0.03) * h, kind: 'tip' });
    }
    P.push({ n: new V3(0, -1, 0), d: 0.5 * h + 0.1, kind: 'bottom' });
    return P;
  }
  function createSpike({ base, axis, height = 1, radius = 0.15, seed: sseed = 1, erupt = 0, rise = 0.24 } = {}) {
    const rng = mulberry32(sseed * 7919 + 13);
    const RR = (a, b) => a + (b - a) * rng();
    const main = spikePlanes(rng, height, radius);
    let faces = clipHull(V3, main, 4 + height);
    const bev = bevelPlanes(V3, faces, main, 0.0022 + 0.0022 * height, (i) => main[i].kind === 'bottom');
    faces = clipHull(V3, [...main, ...bev], 4 + height);
    const geo = hullGeometry(THREE, faces);
    const mat = iceMaterial();
    const u = mat.uniforms;
    main.forEach((P, i) => u.uPl.value[i].set(P.n.x, P.n.y, P.n.z, P.d));
    u.uNPl.value = main.length; u.uSeed.value = RR(0, 50); u.uHeight.value = height;
    u.uCore.value.set(0, 0, radius * 0.24);
    const mesh = layer(new THREE.Mesh(geo, mat), LAYERS.ice);
    mesh.visible = false;
    group.add(mesh);
    // cracks: three across the shaft at rising heights, tilted, and one down its length above the first;
    // a crack starts on the surface and runs through the ice before the spike bursts along it
    const cracks = [];
    const ys = [0.16 + RR(0, 0.08), 0.42 + RR(-0.05, 0.06), 0.68 + RR(-0.05, 0.05)];
    for (const yy of ys) {
      const tau = RR(0.25, 0.7), psi = RR(0, 6.28);
      const n = new V3(Math.sin(tau) * Math.cos(psi), Math.cos(tau), Math.sin(tau) * Math.sin(psi));
      const c = new V3(0, yy * height, 0);
      cracks.push({ n, d: n.dot(c), y: yy * height, origin: c.clone().add(new V3(Math.cos(psi + 2.2), 0, Math.sin(psi + 2.2)).multiplyScalar(radius * (1 - yy * 0.7) * 0.9)), reach: radius * 2.4, kind: 'across' });
    }
    {
      const psi = RR(0, 6.28), n = new V3(Math.cos(psi), RR(-0.15, 0.15), Math.sin(psi)).normalize();
      const c = new V3(RR(-0.2, 0.2) * radius, 0.55 * height, RR(-0.2, 0.2) * radius);
      cracks.push({ n, d: n.dot(c), y: 0.5 * height, origin: c.clone().add(new V3(0, 0.25 * height, 0)), reach: height * 0.9, kind: 'along' });
    }
    // two small old fractures frozen inside from the start
    const old = [];
    for (let k = 0; k < 2; k++) {
      const n = new V3(RR(-1, 1), RR(-1, 1), RR(-1, 1)).normalize(), c = new V3(RR(-0.3, 0.3) * radius, RR(0.15, 0.6) * height, RR(-0.3, 0.3) * radius);
      old.push({ n, d: n.dot(c), origin: c, r: radius * RR(0.35, 0.7) });
    }
    old.forEach((C, k) => { u.uCrA.value[4 + k].set(C.n.x, C.n.y, C.n.z, C.d); u.uCrB.value[4 + k].set(C.origin.x, C.origin.y, C.origin.z, C.r); });
    cracks.forEach((C, k) => { u.uCrA.value[k].set(C.n.x, C.n.y, C.n.z, C.d); u.uCrB.value[k].set(C.origin.x, C.origin.y, C.origin.z, 0); });
    const q = new THREE.Quaternion().setFromUnitVectors(UP, axis.clone().normalize());
    q.multiply(new THREE.Quaternion().setFromAxisAngle(UP, RR(0, 6.28)));
    const S = {
      mesh, mat, main, faces, cracks, height, radius, base: base.clone(), axis: axis.clone().normalize(), q, erupt, rise, seed: sseed,
      state: 'hidden', t: 0, glowK: 1, crackT: [-99, -99, -99, -99], crackDur: [0.4, 0.4, 0.4, 0.5], glow: 0, shattered: false, lightBoost: 0,
    };
    spikes.push(S);
    return S;
  }
  // world position of the spike's base point after rising a share e of its travel
  function spikePose(S, e) {
    const sink = (1 - e) * (S.height * 1.05 + 0.05);
    S.mesh.position.copy(S.base).addScaledVector(S.axis, -sink);
    S.mesh.quaternion.copy(S.q);
    S.mesh.scale.setScalar(1);
  }
  function crackSpike(S, k, delay = 0, dur = null) { S.crackT[k] = -delay; if (dur) S.crackDur[k] = dur; }

  // ---------------------------------------------------------------- fragments: the pieces a spike bursts into
  const frags = [];
  function shatterSpike(S, center, strength = 1) {
    if (S.shattered) return;
    S.shattered = true; S.mesh.visible = false; S.state = 'shattered';
    const order = [0, 1, 2, 3];
    let pieces = [{ planes: S.main.map((P) => ({ n: P.n, d: P.d })), fresh: 0 }];
    for (const k of order) {
      const C = S.cracks[k];
      const next = [];
      for (const pc of pieces) {
        const fA = clipHull(V3, pc.planes, 4 + S.height);
        const cy = hullVerts(fA).reduce((s, p) => s + p.y, 0) / Math.max(1, hullVerts(fA).length);
        if (C.kind === 'along' && cy < S.cracks[0].y) { next.push(pc); continue; }
        let split = false;
        for (const sg of [1, -1]) {
          const pl = [...pc.planes, { n: C.n.clone().multiplyScalar(sg), d: C.d * sg }];
          const f = clipHull(V3, pl, 4 + S.height);
          if (f.length >= 4 && hullVolume(f) > 1e-6) { next.push({ planes: pl, fresh: pc.fresh | (1 << (pl.length - 1)) }); split = true; }
        }
        if (!split) next.push(pc);
      }
      pieces = next;
    }
    _m.compose(S.mesh.position, S.mesh.quaternion, S.mesh.scale);
    const centroidW = new V3();
    for (const pc of pieces) {
      const faces = clipHull(V3, pc.planes, 4 + S.height);
      const verts = hullVerts(faces);
      if (verts.length < 4) continue;
      const c = verts.reduce((s, p) => s.add(p), new V3()).divideScalar(verts.length);
      const minY = Math.min(...verts.map((p) => p.y));
      const stump = minY < 0.02 * S.height;                       // the piece still frozen into the ground stays
      // recentre the piece on its centroid so it turns about itself
      const planes = pc.planes.map((P) => ({ n: P.n.clone(), d: P.d - P.n.dot(c) }));
      // the clipper shares corner objects between neighbouring faces: copy before moving them
      const lf = faces.map((F) => ({ n: F.n, d: F.d, pi: F.pi, v: F.v.map((p) => p.clone().sub(c)) }));
      const locVerts = hullVerts(lf);
      const geo = hullGeometry(THREE, lf);
      const mat = iceMaterial(), u = mat.uniforms;
      planes.slice(0, MAXPL).forEach((P, i) => u.uPl.value[i].set(P.n.x, P.n.y, P.n.z, P.d));
      u.uNPl.value = Math.min(MAXPL, planes.length); u.uFresh.value = pc.fresh;
      u.uSeed.value = S.mat.uniforms.uSeed.value; u.uHeight.value = S.height; u.uCore.value.set(-c.x, -c.z, S.radius * 0.24);
      u.uGlow.value = S.mat.uniforms.uGlow.value; u.uFrost.value = S.mat.uniforms.uFrost.value;
      // the old fractures stay inside the pieces that hold them
      for (let k = 4; k < 6; k++) { const A = S.mat.uniforms.uCrA.value[k], B = S.mat.uniforms.uCrB.value[k]; u.uCrA.value[k].set(A.x, A.y, A.z, A.w - (A.x * c.x + A.y * c.y + A.z * c.z)); u.uCrB.value[k].set(B.x - c.x, B.y - c.y, B.z - c.z, B.w); }
      const mesh = layer(new THREE.Mesh(geo, mat), LAYERS.ice);
      group.add(mesh);
      centroidW.copy(c).applyMatrix4(_m);
      mesh.position.copy(centroidW); mesh.quaternion.copy(S.mesh.quaternion);
      const rg2 = locVerts.reduce((s, p) => s + p.lengthSq(), 0) / locVerts.length;
      const Fr = { mesh, mat, verts: locVerts, faces: lf, v: new V3(), w: new V3(), invI: 1 / (0.4 * rg2 + 1e-6), rad: Math.sqrt(rg2), stump, rest: stump, still: 0, settle: null, age: 0, glow0: u.uGlow.value, spike: S, contact: false, fade: 1 };
      if (!stump) {
        const out = _a.copy(centroidW).sub(center); out.y = 0; const dist = out.length(); out.normalize();
        const k = strength * (0.8 + 0.6 * rnd());
        Fr.v.copy(out).multiplyScalar((1.6 + 2.2 * Math.exp(-dist * 0.4)) * k).add(_b.set(R(-0.6, 0.6), R(1.6, 3.4) * k, R(-0.6, 0.6)));
        Fr.v.addScaledVector(S.axis, R(0.4, 1.4) * (centroidW.y / S.height));
        Fr.w.set(R(-1, 1), R(-1, 1), R(-1, 1)).normalize().multiplyScalar(R(3, 9) * Math.min(1.6, 0.25 / Fr.rad + 0.3));
      }
      frags.push(Fr);
    }
  }
  const _r = new V3(), _vc = new V3(), _imp = new V3(), _t1 = new V3();
  function updateFrags(dt) {
    if (dt <= 0) return;
    const sub = 3, h = dt / sub;
    for (const Fr of frags) {
      Fr.age += dt;
      if (Fr.rest) continue;
      for (let s = 0; s < sub; s++) {
        if (Fr.settle) break;
        Fr.v.y -= 9.8 * h;
        Fr.mesh.position.addScaledVector(Fr.v, h);
        const wl = Fr.w.length();
        if (wl > 1e-6) { _q.setFromAxisAngle(_a.copy(Fr.w).divideScalar(wl), wl * h); Fr.mesh.quaternion.premultiply(_q).normalize(); }
        // the deepest corner below the snow: one contact, an impulse with friction
        let lo = 0, ci = -1;
        for (let i = 0; i < Fr.verts.length; i++) { _b.copy(Fr.verts[i]).applyQuaternion(Fr.mesh.quaternion); const y = Fr.mesh.position.y + _b.y; if (y < lo) { lo = y; ci = i; } }
        Fr.contact = ci >= 0;
        if (ci >= 0) {
          Fr.mesh.position.y -= lo;
          _r.copy(Fr.verts[ci]).applyQuaternion(Fr.mesh.quaternion);
          _vc.copy(Fr.w).cross(_r).add(Fr.v);
          if (_vc.y < 0) {
            const rxn = _a.copy(_r).cross(UP);
            const jn = -(1 + (_vc.y < -0.6 ? 0.22 : 0)) * _vc.y / (1 + Fr.invI * rxn.lengthSq());   // no bounce at a crawl: it only fed the rocking
            Fr.v.y += jn;
            Fr.w.addScaledVector(_t1.copy(_r).cross(_imp.set(0, jn, 0)), Fr.invI);
            // friction
            _vc.copy(Fr.w).cross(_r).add(Fr.v); _vc.y = 0;
            const vt = _vc.length();
            if (vt > 1e-5) {
              _vc.divideScalar(vt);
              const rxt = _a.copy(_r).cross(_vc);
              const jt = Math.min(vt / (1 + Fr.invI * rxt.lengthSq()), 0.55 * jn);
              Fr.v.addScaledVector(_vc, -jt);
              Fr.w.addScaledVector(_t1.copy(_r).cross(_imp.copy(_vc).multiplyScalar(-jt)), Fr.invI);
            }
          }
          Fr.w.multiplyScalar(Math.exp(-3 * h));
          Fr.v.x *= Math.exp(-1.2 * h); Fr.v.z *= Math.exp(-1.2 * h);
        } else Fr.w.multiplyScalar(Math.exp(-0.3 * h));
      }
      // asleep: tip it onto the face nearest the ground and let it rest there, flat on the snow
      const slow = Fr.contact && Fr.v.length() < 0.35 && Fr.w.length() * Fr.rad < 0.12;   // surface speed, so small chips do not rock forever
      if (Fr.age > 2.6 && Fr.contact) { Fr.v.multiplyScalar(Math.exp(-4 * dt)); Fr.w.multiplyScalar(Math.exp(-4 * dt)); }
      Fr.still = slow ? Fr.still + dt : 0;
      Fr.touch = (Fr.touch || 0) + (Fr.contact ? dt : 0);
      if (!Fr.settle && (Fr.still > 0.18 || Fr.touch > 0.9)) {
        let best = null, bd = -2;
        for (const F of Fr.faces) { _a.copy(F.n).applyQuaternion(Fr.mesh.quaternion); if (-_a.y > bd) { bd = -_a.y; best = F.n; } }
        _a.copy(best).applyQuaternion(Fr.mesh.quaternion);
        _q.setFromUnitVectors(_a, _b.set(0, -1, 0));
        Fr.settle = { from: Fr.mesh.quaternion.clone(), to: _q.clone().multiply(Fr.mesh.quaternion), t: 0, x: Fr.mesh.position.x, z: Fr.mesh.position.z };
        Fr.v.set(0, 0, 0); Fr.w.set(0, 0, 0);
      }
      if (Fr.settle) {
        const Sx = Fr.settle; Sx.t = Math.min(1, Sx.t + dt / 0.22);
        const e = Sx.t * Sx.t * (3 - 2 * Sx.t);
        Fr.mesh.quaternion.slerpQuaternions(Sx.from, Sx.to, e);
        let lo = 1e9; for (const p of Fr.verts) { _b.copy(p).applyQuaternion(Fr.mesh.quaternion); lo = Math.min(lo, _b.y); }
        Fr.mesh.position.y = -lo;
        if (Sx.t >= 1) { Fr.rest = true; depenetrate(Fr); }
      }
    }
    // pieces never pass through each other or the stumps: push overlapping ones apart across the snow
    for (let i = 0; i < frags.length; i++) for (let j = i + 1; j < frags.length; j++) {
      const A = frags[i], B = frags[j];
      if (A.rest && B.rest && !(A.settle && A.settle.t < 1) && !(B.settle && B.settle.t < 1)) continue;
      const dx = B.mesh.position.x - A.mesh.position.x, dz = B.mesh.position.z - A.mesh.position.z, dy = B.mesh.position.y - A.mesh.position.y;
      const rr = (A.rad + B.rad) * 0.62, d2 = dx * dx + dz * dz + dy * dy;
      if (d2 > rr * rr || d2 < 1e-10) continue;
      const d = Math.sqrt(d2), push = (rr - d) / d * 0.5;
      const wa = A.stump ? 0 : B.stump ? 1 : 0.5, wb = 1 - wa;
      if (!A.stump) { A.mesh.position.x -= dx * push * (wa ? 2 * wa : 0); A.mesh.position.z -= dz * push * (wa ? 2 * wa : 0); }
      if (!B.stump) { B.mesh.position.x += dx * push * (wb ? 2 * wb : 0); B.mesh.position.z += dz * push * (wb ? 2 * wb : 0); }
    }
  }
  // a piece that has come to rest is slid across the snow until none of its corners is inside another piece and none of theirs inside it
  const _dp = new V3(), _di = new THREE.Matrix4();
  function cornerInside(A, B) {
    A.mesh.updateMatrixWorld(); B.mesh.updateMatrixWorld(); _di.copy(B.mesh.matrixWorld).invert();
    const U = B.mat.uniforms;
    for (const p of A.verts) {
      _dp.copy(p).applyMatrix4(A.mesh.matrixWorld); if (_dp.y < 0.002) continue;
      _dp.applyMatrix4(_di); let inside = true;
      for (let i = 0; i < U.uNPl.value; i++) { const P = U.uPl.value[i]; if (P.x * _dp.x + P.y * _dp.y + P.z * _dp.z - P.w > -0.001) { inside = false; break; } }
      if (inside) return true;
    }
    return false;
  }
  function depenetrate(Fr) {
    for (let it = 0; it < 40; it++) {
      let hit = null;
      for (const O of frags) { if (O === Fr || !O.mesh.visible) continue; if (O.mesh.position.distanceTo(Fr.mesh.position) > O.rad + Fr.rad) continue; if (cornerInside(Fr, O) || cornerInside(O, Fr)) { hit = O; break; } }
      if (!hit) return;
      _a.subVectors(Fr.mesh.position, hit.mesh.position); _a.y = 0; if (_a.lengthSq() < 1e-8) _a.set(1, 0, 0);
      Fr.mesh.position.addScaledVector(_a.normalize(), 0.006);
    }
  }
  function clearFrags() {
    for (const Fr of frags) { group.remove(Fr.mesh); Fr.mesh.geometry.dispose(); Fr.mat.dispose(); }
    frags.length = 0;
  }

  // ---------------------------------------------------------------- chunks: snow lumps and ice chips that land and rest
  const MAXCH = 260;
  function lumpGeo(seedc, flat = 0.72) {
    const rng = mulberry32(seedc);
    const P = [];
    for (let ax = 0; ax < 3; ax++) for (const sg of [-1, 1]) { const n = new V3(); n.setComponent(ax, sg); P.push({ n, d: 1 }); }
    const cuts = 14 + Math.floor(rng() * 6);
    for (let k = 0; k < cuts; k++) P.push({ n: new V3(rng() * 2 - 1, (rng() * 2 - 1) * 0.8, rng() * 2 - 1).normalize(), d: 0.55 + rng() * 0.35 });
    const faces = clipHull(V3, P, 3);
    for (const F of faces) { for (const p of F.v) p.y *= flat; F.n = new V3(F.n.x, F.n.y / flat, F.n.z).normalize(); }
    return { geo: hullGeometry(THREE, faces), verts: hullVerts(faces), faces };
  }
  const lumpKinds = [lumpGeo(91), lumpGeo(57, 0.8), lumpGeo(23, 0.6)];
  const chipKinds = [lumpGeo(7, 0.35), lumpGeo(19, 0.5)];
  const chunkMat = new THREE.ShaderMaterial({
    uniforms: { ...lightUniforms, tNoise: uniforms.tNoise, uKind: { value: 0 }, uGlowCol: iceShared.uGlowCol },
    vertexShader: /* glsl */`
      attribute vec2 iX;   // glow, fade
      varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec2 vX;
      void main(){
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.);
        vW = w.xyz; vN = normalize(mat3(modelMatrix * instanceMatrix) * normal); vL = position * 3.; vX = iX;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: TNOISE_GLSL + LIGHTS_GLSL + /* glsl */`
      uniform float uKind; uniform vec3 uGlowCol;
      varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec2 vX;
      void main(){
        if (vX.y <= 0.) discard;
        vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
        vec4 g = tn(vL * 1.3);
        vec3 col;
        if (uKind < .5) {
          // packed snow: bright, crumbly, faintly blue in the creases
          N = normalize(N + g.yzw * .45);
          vec3 alb = vec3(.8, .86, .95) * (.85 + .25 * g.x);
          col = alb * (uSkyAmb * (3.6 + N.y) + uMoonCol * max(dot(N, uMoonDir) * .6 + .4, 0.) * 1.2 + lightsAt(vW) * .35) + energyLight(vW, N, V, alb, .9) * 1.2;
        } else {
          // an ice chip: dark glass, a bright Fresnel edge and the ice's light inside
          N = normalize(N + g.yzw * .06);
          float F = .02 + .98 * pow(1. - max(dot(N, V), 0.), 5.);
          vec3 R = reflect(-V, N);
          vec3 env = R.y > 0. ? vec3(.006, .009, .018) : vec3(.03, .04, .06);
          vec3 inside = (uSkyAmb * 7. + uMoonCol * 1.2) * vec3(.55, .78, 1.) + lightsAt(vW) * vec3(.4, .62, .9) * .7;
          col = inside + uGlowCol * vX.x * .6 + (env * 4. + energyLight(vW, N, V, vec3(.05), .06) * 2.) * (.25 + .75 * F) + uMoonCol * pow(max(dot(reflect(-V, N), uMoonDir), 0.), 40.) * 8.;
        }
        gl_FragColor = vec4(col * vX.y, 1.);
      }`,
  });
  const chipMat = new THREE.ShaderMaterial({ uniforms: { ...chunkMat.uniforms, uKind: { value: 1 } }, vertexShader: chunkMat.vertexShader, fragmentShader: chunkMat.fragmentShader });
  const chunkMeshes = [...lumpKinds.map((K) => [K, chunkMat]), ...chipKinds.map((K) => [K, chipMat])].map(([K, M]) => {
    const m = new THREE.InstancedMesh(K.geo, M, MAXCH); m.count = 0; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const iX = new THREE.InstancedBufferAttribute(new Float32Array(MAXCH * 2), 2).setUsage(THREE.DynamicDrawUsage);
    m.geometry = m.geometry.clone(); m.geometry.setAttribute('iX', iX);
    layer(m, LAYERS.world); group.add(m); return { m, K, iX };
  });
  const chunks = [];
  for (let i = 0; i < MAXCH * 2; i++) chunks.push({ alive: false, kind: 0, p: new V3(), v: new V3(), q: new THREE.Quaternion(), axis: new V3(), spin: 0, s: new V3(), age: 0, life: 6, rest: false, glow: 0, fade: 1 });
  function spawnChunks(pos, { count = 8, speed = [1.5, 4], size = [0.015, 0.045], chips = false, dir = null, life = [5, 8], glow = 0.4 } = {}) {
    for (let k = 0; k < count; k++) {
      const C = chunks.find((d) => !d.alive) || chunks.reduce((o, d) => (d.age > o.age ? d : o));
      C.alive = true; C.rest = false; C.age = 0; C.life = R(life[0], life[1]); C.fade = 1; C.glow = glow;
      C.kind = chips ? 3 + (rnd() < 0.5 ? 0 : 1) : Math.floor(rnd() * 3);
      C.p.copy(pos).add(_a.set(R(-0.12, 0.12), R(0, 0.1), R(-0.12, 0.12)));
      _b.set(R(-1, 1), R(0.7, 1.7), R(-1, 1)).normalize(); if (dir) _b.addScaledVector(dir, 0.9).normalize();
      C.v.copy(_b).multiplyScalar(R(speed[0], speed[1]));
      const s = R(size[0], size[1]);
      C.s.set(s * R(0.75, 1.25), s * R(0.7, 1.0), s * R(0.75, 1.25));
      C.p.y = Math.max(C.p.y, 0.05);
      C.q.setFromEuler(new THREE.Euler(R(0, 6), R(0, 6), R(0, 6))); C.axis.set(R(-1, 1), R(-1, 1), R(-1, 1)).normalize(); C.spin = R(4, 14);
    }
  }
  const _s3 = new V3();
  function chunkBottom(q, s, verts) { let lo = 0; for (const h of verts) { _c.copy(h).multiply(s).applyQuaternion(q); if (_c.y < lo) lo = _c.y; } return -lo; }
  function updateChunks(dt) {
    const counts = chunkMeshes.map(() => 0);
    for (const C of chunks) {
      if (!C.alive) continue;
      C.age += dt;
      if (C.age > C.life + 0.8) { C.alive = false; continue; }
      const K = chunkMeshes[C.kind].K;
      if (!C.rest && dt > 0) {
        C.v.y -= 9.8 * dt; C.v.multiplyScalar(Math.exp(-0.4 * dt)); C.p.addScaledVector(C.v, dt);
        _q.setFromAxisAngle(C.axis, C.spin * dt); C.q.premultiply(_q);
        const floor = chunkBottom(C.q, C.s, K.verts);
        if (C.p.y < floor) {
          C.p.y = floor;
          if (Math.abs(C.v.y) < 0.9 && Math.hypot(C.v.x, C.v.z) < 0.5) {
            // rest on the face nearest the snow, not balanced on a corner
            let best = null, bd = -2;
            for (const F of K.faces) { _a.copy(F.n).applyQuaternion(C.q); if (-_a.y > bd) { bd = -_a.y; best = F.n; } }
            _a.copy(best).applyQuaternion(C.q); _q.setFromUnitVectors(_a, _b.set(0, -1, 0)); C.q.premultiply(_q);
            C.rest = true; C.v.set(0, 0, 0);
            for (const S of spikes) {
              if (S.state === 'hidden') continue;
              const dx = C.p.x - S.base.x, dz = C.p.z - S.base.z, d = Math.hypot(dx, dz), need = S.radius * 1.25 + C.s.x * 1.2;
              if (d < need) { const k = (need + 0.004) / Math.max(d, 1e-4); C.p.x = S.base.x + (d > 1e-4 ? dx : 1) * k; C.p.z = S.base.z + (d > 1e-4 ? dz : 0) * k; }
            }
          } else { C.v.y = -C.v.y * 0.25; C.v.x *= 0.5; C.v.z *= 0.5; C.spin *= 0.5; }
        }
      }
      // melt away at the end: shrink into the snow
      const melt = C.age > C.life ? 1 - (C.age - C.life) / 0.8 : 1;
      _s3.copy(C.s).multiplyScalar(Math.max(melt * C.fade, 0.001));
      _a.copy(C.p); if (C.rest) _a.y = chunkBottom(C.q, _s3, K.verts) * (C.kind >= 3 ? 0.55 : 0.62);   // settled into the snow
      _m.compose(_a, C.q, _s3);
      const M = chunkMeshes[C.kind], i = counts[C.kind]++;
      M.m.setMatrixAt(i, _m); M.iX.array[i * 2] = C.glow * Math.exp(-C.age * 0.6); M.iX.array[i * 2 + 1] = 1;
    }
    chunkMeshes.forEach((M, k) => { M.m.count = counts[k]; M.m.instanceMatrix.needsUpdate = true; M.iX.needsUpdate = true; });
  }

  // ---------------------------------------------------------------- motes: snowflakes, diamond dust, cold sparks (additive)
  const MAXP = 15000;
  const P = { soft: new Uint8Array(MAXP), col: new Uint8Array(MAXP), sk: new Float32Array(MAXP), alive: new Uint8Array(MAXP), kind: new Uint8Array(MAXP), p: new Float32Array(MAXP * 3), v: new Float32Array(MAXP * 3), age: new Float32Array(MAXP), life: new Float32Array(MAXP), size: new Float32Array(MAXP), seed: new Float32Array(MAXP), grav: new Float32Array(MAXP), drag: new Float32Array(MAXP), wind: new Float32Array(MAXP), n: new Float32Array(MAXP * 3), spin: new Float32Array(MAXP * 3), bright: new Float32Array(MAXP) };
  let pCursor = 0;
  // kind 0: snowflake (soft, lit), 1: diamond dust (a tumbling facet that glints), 2: cold spark (bright, short)
  function spawnMote(kind, pos, vel, { life = 3, size = 0.004, gravity = 0.05, drag = 1, wind = 1, bright = 1, column = false, soft = false } = {}) {
    let i = -1;
    for (let k = 0; k < MAXP; k++) { const j = (pCursor + k) % MAXP; if (!P.alive[j]) { i = j; break; } }
    if (i < 0) i = pCursor;
    pCursor = (i + 1) % MAXP;
    const i3 = i * 3;
    P.alive[i] = 1; P.col[i] = column ? 1 : 0; P.soft[i] = soft ? 1 : 0; P.sk[i] = R(0.35, 1.25); P.kind[i] = kind; P.age[i] = 0; P.life[i] = life; P.size[i] = size; P.seed[i] = rnd() * 100; P.grav[i] = gravity; P.drag[i] = drag; P.wind[i] = wind; P.bright[i] = bright;
    P.p[i3] = pos.x; P.p[i3 + 1] = pos.y; P.p[i3 + 2] = pos.z; P.v[i3] = vel.x; P.v[i3 + 1] = vel.y; P.v[i3 + 2] = vel.z;
    _a.set(R(-1, 1), R(-1, 1), R(-1, 1)).normalize(); P.n[i3] = _a.x; P.n[i3 + 1] = _a.y; P.n[i3 + 2] = _a.z;
    _a.set(R(-1, 1), R(-1, 1), R(-1, 1)).normalize().multiplyScalar(R(1.2, 3.2)); P.spin[i3] = _a.x; P.spin[i3 + 1] = _a.y; P.spin[i3 + 2] = _a.z;
  }
  const mGeo = new THREE.InstancedBufferGeometry();
  { const q = new THREE.PlaneGeometry(1, 1); mGeo.index = q.index; mGeo.setAttribute('position', q.getAttribute('position')); }
  const iMPos = new Float32Array(MAXP * 3), iMTail = new Float32Array(MAXP * 3), iMCol = new Float32Array(MAXP * 4), iMK = new Float32Array(MAXP * 2);
  const idyn = (arr, n) => new THREE.InstancedBufferAttribute(arr, n).setUsage(THREE.DynamicDrawUsage);
  mGeo.setAttribute('iPos', idyn(iMPos, 3)); mGeo.setAttribute('iTail', idyn(iMTail, 3)); mGeo.setAttribute('iCol', idyn(iMCol, 4)); mGeo.setAttribute('iK', idyn(iMK, 2));
  mGeo.instanceCount = 0;
  const moteMat = new THREE.ShaderMaterial({
    uniforms: { uResolution: uniforms.uResolution, uDpr: uniforms.uDpr },
    vertexShader: /* glsl */`
      attribute vec3 iPos; attribute vec3 iTail; attribute vec4 iCol; attribute vec2 iK;   // rgb, size (world); kind, seed
      uniform vec2 uResolution; uniform float uDpr;
      varying vec2 vL; varying float vLen; varying float vW; varying vec3 vCol; varying float vSoft; varying vec2 vK;
      void main(){
        mat4 vp = projectionMatrix * viewMatrix;
        vec4 h = vp * vec4(iPos, 1.), t = vp * vec4(iTail, 1.);
        vec2 hr = uResolution * .5;
        vec2 sh = h.xy / max(h.w, 1e-3) * hr, st = t.xy / max(t.w, 1e-3) * hr;
        float wpx = abs(iCol.w) * projectionMatrix[1][1] * hr.y / max(h.w, 1e-3);
        float w = clamp(wpx, (iCol.w < 0. ? 2.2 : iK.x > 2.5 && iK.x < 3.5 ? 1.7 : .9) * uDpr, 7. * uDpr);   // soft powder: never under two pixels
        vec2 d = sh - st; float L = length(d);
        float maxL = (iK.x > 3.5 ? 320. : 26.) * uDpr;                 // the rare long streak of a fast flake
        if (L > maxL) { d *= maxL / L; L = maxL; }
        vec2 dir = L > 1e-3 ? d / L : vec2(1., 0.), nrm = vec2(-dir.y, dir.x);
        vec2 ctr = sh - d * .5;
        float hl = L * .5 + w;
        vec2 sp = ctr + dir * position.x * 2. * hl + nrm * position.y * 2. * w;
        vL = vec2(position.x * 2. * hl, position.y * 2. * w); vLen = L * .5; vW = w * .5;
        // a flake smaller than a pixel spreads its light, never its brightness, over the pixel it covers
        vCol = iCol.rgb * min(1., wpx / max(w, 1e-3)) * min(1., (w * 2.) / max(w * 2. + L * .5, 1e-3) * 1.6);
        vCol *= smoothstep(.12, .5, h.w);                         // nothing pops in front of the lens
        vSoft = wpx > 3. * uDpr ? 1. : 0.; vK = iK;
        if (iK.x > 3.5) vCol = iCol.rgb;                              // streaks keep their light along their length
        gl_Position = vec4(sp / hr * h.w, h.z, h.w);
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vL; varying float vLen; varying float vW; varying vec3 vCol; varying float vSoft; varying vec2 vK;
      void main(){
        float x = clamp(vL.x, -vLen, vLen);
        float dist = length(vec2(vL.x - x, vL.y));
        float a = 1. - smoothstep(vW * mix(.3, .05, vSoft), vW, dist);
        if (vK.x > 2.5 && vK.x < 3.5) {
          // a chipped ice flake: an irregular four- or five-sided chip, turned to its own angle
          float an = vK.y * 6.2832, c = cos(an), sn = sin(an);
          vec2 q = mat2(c, -sn, sn, c) * vL / max(vW * 2., 1e-3);
          float r = abs(q.x) * (1.1 + .5 * fract(vK.y * 7.)) + abs(q.y) * (.8 + .6 * fract(vK.y * 13.)) + .25 * abs(q.x + q.y) * fract(vK.y * 3.);
          a = 1. - smoothstep(.75, 1., r);
        } else if (vK.x > 3.5) {
          a *= sin(3.1416 * clamp((vL.x + vLen + vW) / (2. * (vLen + vW)), 0., 1.));   // tapered at both ends
        } else a *= .3 + .7 * smoothstep(-vLen - vW, vLen, vL.x);          // bright at the head, fading down the streak
        gl_FragColor = vec4(vCol * a, 1.);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const moteMesh = layer(new THREE.Mesh(mGeo, moteMat), LAYERS.fx); moteMesh.renderOrder = 31;
  group.add(moteMesh);

  // ---------------------------------------------------------------- wind: one field that moves motes, sprites and the mist
  // The blizzard is a column: a narrow core at its foot opening toward the top, the axis leaning a little so every
  // helix tilts the same way; tangential wind peaks just outside the core (faster and tighter toward the axis than
  // further out), air is drawn in along the snow at the foot, rises inside the core and is thrown out at the top.
  const wind = { base: new V3(0.15, 0, 0.05), vortex: { on: 0, center: new V3(), radius: 0.75, swirl: 0, inflow: 0, lift: 0, outflow: 0, height: 3.6, lean: new V3(0, 0, 0), veil: 1, sDir: new V3(1, 0, 0), sAmp: 0 } };
  // the axis bends in a slow S, swinging out to one side at the top
  const sBend = (h) => -Math.sin(4.712 * h);
  function vortexAxis(y, out) { const W = wind.vortex, b = W.sAmp * sBend(Math.max(0, y) / W.height); return out.set(W.center.x + W.lean.x * y + W.sDir.x * b, 0, W.center.z + W.lean.z * y + W.sDir.z * b); }
  // narrow at the foot, opening toward the top
  function coreAt(y) { const W = wind.vortex, h = Math.min(1.25, Math.max(0, y) / W.height); return W.radius * (0.3 + 0.85 * Math.pow(h, 1.4)); }
  const _ax = new V3();
  function windAt(x, y, z, out) {
    out.copy(wind.base);
    const W = wind.vortex;
    if (W.on > 0) {
      vortexAxis(y, _ax);
      const dx = x - _ax.x, dz = z - _ax.z, r = Math.hypot(dx, dz) + 1e-3;
      const rc = coreAt(y);
      const vt = W.swirl * 2 * r * rc / (r * r + rc * rc) * (0.45 + 0.55 * Math.min(1, Math.max(0, y) / 0.9));   // the snow drags the swirl at the foot: air there converges instead of orbiting
      const top = Math.min(1, Math.max(0, (y - W.height * 0.85) / (W.height * 0.3)));
      const foot = Math.exp(-Math.max(0, y) / 0.7);
      const inside = Math.exp(-(r * r) / (rc * rc * 2.2));
      const vr = -W.inflow * foot * Math.min(1, r / rc) * (1 - top) + W.outflow * top * Math.min(1, r / rc + 0.3) * Math.exp(-Math.max(0, r - rc * 1.5) / 2);
      const vy = W.lift * inside * (1 - 0.85 * top) * (0.55 + 0.45 * Math.min(1, Math.max(0, y) / 0.6));
      out.x += (-dz / r * vt + dx / r * vr) * W.on;
      out.z += (dx / r * vt + dz / r * vr) * W.on;
      out.y += vy * W.on;
    }
    return out;
  }

  // ---------------------------------------------------------------- vapour and powder: soft wisps drawn premultiplied over
  const MAXS = 900;
  const SP = { alive: new Uint8Array(MAXS), type: new Uint8Array(MAXS), p: new Float32Array(MAXS * 3), v: new Float32Array(MAXS * 3), s0: new Float32Array(MAXS), s1: new Float32Array(MAXS), rot: new Float32Array(MAXS), rotV: new Float32Array(MAXS), age: new Float32Array(MAXS), life: new Float32Array(MAXS), drag: new Float32Array(MAXS), buoy: new Float32Array(MAXS), op: new Float32Array(MAXS), seed: new Float32Array(MAXS), grav: new Float32Array(MAXS), wind: new Float32Array(MAXS) };
  let sCursor = 0;
  // type 0: vapour (thin, fibrous, cold breath), 1: powder (denser snow dust)
  function spawnWisp(type, pos, vel, { size = 0.2, grow = 2.5, life = 2, drag = 1.2, buoy = 0, opacity = 0.5, gravity = 0, wind: wk = 1, stretch = 0 } = {}) {
    let i = -1;
    for (let k = 0; k < MAXS; k++) { const j = (sCursor + k) % MAXS; if (!SP.alive[j]) { i = j; break; } }
    if (i < 0) i = sCursor;
    sCursor = (i + 1) % MAXS;
    const i3 = i * 3;
    SP.alive[i] = 1; SP.type[i] = type; SP.age[i] = 0; SP.life[i] = life; SP.s0[i] = size; SP.s1[i] = size * grow; SP.drag[i] = drag; SP.buoy[i] = buoy; SP.op[i] = opacity; SP.grav[i] = gravity; SP.wind[i] = wk;
    SP.rot[i] = R(0, 6.28); SP.rotV[i] = R(-0.5, 0.5); SP.seed[i] = rnd() * 100; SPasp[i] = stretch;
    SP.p[i3] = pos.x; SP.p[i3 + 1] = pos.y; SP.p[i3 + 2] = pos.z; SP.v[i3] = vel.x; SP.v[i3 + 1] = vel.y; SP.v[i3 + 2] = vel.z;
  }
  const wGeo = new THREE.InstancedBufferGeometry();
  { const q = new THREE.PlaneGeometry(1, 1); wGeo.index = q.index; wGeo.setAttribute('position', q.getAttribute('position')); }
  const iWPos = new Float32Array(MAXS * 3), iWA = new Float32Array(MAXS * 4), iWB = new Float32Array(MAXS * 4), iWC = new Float32Array(MAXS * 2);
  const SPasp = new Float32Array(MAXS);
  wGeo.setAttribute('iPos', idyn(iWPos, 3)); wGeo.setAttribute('iA', idyn(iWA, 4)); wGeo.setAttribute('iB', idyn(iWB, 4)); wGeo.setAttribute('iC', idyn(iWC, 2));
  wGeo.instanceCount = 0;
  const wispMat = new THREE.ShaderMaterial({
    uniforms: { tNoise: uniforms.tNoise },
    vertexShader: /* glsl */`
      attribute vec3 iPos; attribute vec4 iA; attribute vec4 iB; attribute vec2 iC;   // A: size, rot, age, seed; B: lit rgb, opacity; C: stretch along rot
      varying vec2 vQ; varying vec4 vA; varying vec4 vB; varying float vY; varying float vDepth; varying float vType;
      void main(){
        vec4 mv = viewMatrix * vec4(iPos, 1.); vType = iC.y;
        float c = cos(iA.y), s = sin(iA.y);
        vec2 p = position.xy * vec2(1. + iC.x, 1. / sqrt(1. + iC.x));
        mv.xy += vec2(c * p.x - s * p.y, s * p.x + c * p.y) * iA.x;
        vQ = position.xy * 2.; vA = iA; vB = iB;
        vY = (inverse(viewMatrix) * mv).y; vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: TNOISE_GLSL + /* glsl */`
      varying vec2 vQ; varying vec4 vA; varying vec4 vB; varying float vY; varying float vDepth; varying float vType;
      void main(){
        float age = vA.z, seed = vA.w, r = length(vQ);
        // the wisp evolves where it is: the noise is sliced by age, never scrolled across it
        vec3 q = vec3(vQ * 1.6, seed + age * .9);
        vec3 wq = q + tn(q * .7 + 3.).xyz * .55;
        float n = tfbm3(wq) * .5 + .5;
        float a;
        if (vType > 1.5) {
          // ground mist: a wide soft bank with curling edges, thinning toward its top
          float curl = tn(vec3(wq.xy * 3.4, seed * 1.3 + age * .5)).y * .16 + tn(vec3(wq.xy * 8.5, seed + age * .8)).z * .08;
          a = smoothstep(.38, .78, n + curl - r * r * .45) * (1. - smoothstep(.55, 1., r)) * .6;
          a *= smoothstep(-.9, .1, vQ.y);
        } else if (vType < .5) {
          // vapour: a soft see-through body that thins from the middle out, its edge broken into fine curls
          float curl = tn(vec3(wq.xy * 4.2, seed * 1.7 + age * .7)).y * .14 + tn(vec3(wq.xy * 9., seed + age)).z * .07;
          float th = mix(.42, .7, age);
          a = smoothstep(th - .12, th + .3, n + curl * smoothstep(.15, .8, r) - r * r * .5) * .55;
          a *= 1. - smoothstep(.6, 1., r);
        } else {
          float fib = tn(vec3(wq.x * 3.5, wq.y * 11., seed * 1.3 + age * .6)).y * .12 + tn(vec3(wq.xy * 7., seed + age)).z * .08;   // fine curls at the edge
          float th = mix(.4, .76, age);
          a = smoothstep(th, th + .2, n + fib * smoothstep(.2, .9, r) - r * r * .6);
          a *= 1. - smoothstep(.75, 1., r);
        }
        a *= vB.a * (1. - smoothstep(.6, 1., age)) * smoothstep(0., .08, age);
        a *= smoothstep(0., .15, vY) * smoothstep(.25, .9, vDepth);
        vec3 col = vB.rgb * (.75 + .45 * n);
        gl_FragColor = vec4(col * a, a);
      }`,
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
  const wispMesh = layer(new THREE.Mesh(wGeo, wispMat), LAYERS.fx); wispMesh.renderOrder = 20;
  group.add(wispMesh);

  // ---------------------------------------------------------------- streamers: ribbons of wind-blown snow carried by the wind field
  const MAXST = 240, STN = 26;
  const streamers = [];
  for (let i = 0; i < MAXST; i++) streamers.push({ alive: false, pts: new Float32Array(STN * 3), n: 0, head: new V3(), v: new V3(), age: 0, life: 2, width: 0.01, op: 0.15, seed: 0, last: new V3(), col: new V3(), out: 0 });
  function spawnStreamer(pos, { life = 2, width = 0.01, opacity = 0.15 } = {}) {
    const S = streamers.find((x) => !x.alive) || streamers.reduce((o, x) => (x.age / x.life > o.age / o.life ? x : o));
    S.alive = true; S.n = 1; S.age = 0; S.life = life; S.width = width; S.op = opacity; S.seed = rnd() * 50; S.out = 0;
    S.head.copy(pos); S.last.copy(pos); windAt(pos.x, pos.y, pos.z, S.v); S.pts.set([pos.x, pos.y, pos.z], 0);
  }
  const stGeo = new THREE.BufferGeometry();
  const STV = MAXST * STN * 2;
  const stArr = { pos: new Float32Array(STV * 3), prev: new Float32Array(STV * 3), next: new Float32Array(STV * 3), data: new Float32Array(STV * 4), col: new Float32Array(STV * 4) };
  const stIndex = new Uint32Array(MAXST * (STN - 1) * 6);
  const dynA = (arr, n) => new THREE.BufferAttribute(arr, n).setUsage(THREE.DynamicDrawUsage);
  stGeo.setAttribute('position', dynA(stArr.pos, 3)); stGeo.setAttribute('aPrev', dynA(stArr.prev, 3)); stGeo.setAttribute('aNext', dynA(stArr.next, 3));
  stGeo.setAttribute('aData', dynA(stArr.data, 4)); stGeo.setAttribute('aCol', dynA(stArr.col, 4)); stGeo.setIndex(dynA(stIndex, 1));
  const stMat = new THREE.ShaderMaterial({
    uniforms: { uResolution: uniforms.uResolution, uDpr: uniforms.uDpr, tNoise: uniforms.tNoise },
    vertexShader: /* glsl */`
      attribute vec3 aPrev; attribute vec3 aNext; attribute vec4 aData; attribute vec4 aCol;   // side, along, width (world), seed; lit rgb, opacity
      uniform vec2 uResolution; uniform float uDpr;
      varying vec4 vData; varying vec4 vCol; varying float vDepth; varying float vCover;
      void main(){
        mat4 vp = projectionMatrix * viewMatrix;
        vec4 c = vp * vec4(position, 1.), a = vp * vec4(aPrev, 1.), b = vp * vec4(aNext, 1.);
        vec2 hr = uResolution * .5;
        vec2 d = b.xy / max(b.w, 1e-3) * hr - a.xy / max(a.w, 1e-3) * hr; float L = length(d);
        d = L > 1e-4 ? d / L : vec2(1., 0.);
        vec2 n = vec2(-d.y, d.x);
        float pw = aData.z * projectionMatrix[1][1] * hr.y / max(c.w, 1e-3);
        float px = clamp(pw, .75 * uDpr, 2.2 * uDpr);           // a hairline to about two pixels
        c.xy += n * aData.x * (px + 1.) * .5 / hr * c.w;          // a pixel more for the edge falloff
        vData = aData; vCol = aCol; vDepth = c.w; vCover = min(1., pw / px);
        gl_Position = c;
      }`,
    fragmentShader: TNOISE_GLSL + /* glsl */`
      varying vec4 vData; varying vec4 vCol; varying float vDepth; varying float vCover;
      void main(){
        float v = vData.x, u = vData.y, sd = vData.w;
        float a = 1. - smoothstep(.45, 1., abs(v));                       // a fine line: soft only at its very edge
        // brightness varies along it: denser snow here, a gap there
        a *= .35 + .65 * smoothstep(.3, .75, tn(vec3(u * 5.5 + sd, sd * .7, 2.)).x * .5 + .5 + .2 * tn(vec3(u * 17. + sd, sd, 5.)).y);
        a *= smoothstep(0., .3, u) * (1. - smoothstep(.7, 1., u));
        a *= vCol.a * vCover * smoothstep(.8, 2.2, vDepth);
        gl_FragColor = vec4(vCol.rgb * a, a);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
  const stMesh = layer(new THREE.Mesh(stGeo, stMat), LAYERS.fx); stMesh.renderOrder = 22;
  group.add(stMesh);
  function updateStreamers(dt) {
    let v = 0, idx = 0;
    for (const S of streamers) {
      if (!S.alive) continue;
      if (dt > 0) {
        S.age += dt;
        if (S.age > S.life) { S.alive = false; continue; }
        windAt(S.head.x, S.head.y, S.head.z, _wv);
        S.v.lerp(_wv, 1 - Math.exp(-7 * dt));
        S.head.addScaledVector(S.v, dt); S.head.y = Math.max(0.03, S.head.y);
        // a streamer that leaves the column fades: none may cut across the frame
        vortexAxis(S.head.y, _ax);
        const rr = Math.hypot(S.head.x - _ax.x, S.head.z - _ax.z);
        const allowed = S.head.y < 0.5 ? 2.4 : 1.25 * coreAt(S.head.y) * 1.3;    // the body's radius at this height, a little over: spray off the rim, not loops
        if (rr > allowed || S.head.y > wind.vortex.height + 0.25) S.out += dt;
        if (S.out > 0.3) { S.alive = false; continue; }
        if (S.head.distanceTo(S.last) > 0.065) {
          if (S.n >= STN) { S.pts.copyWithin(0, 3); S.n = STN - 1; }
          S.pts.set([S.head.x, S.head.y, S.head.z], S.n * 3); S.n++; S.last.copy(S.head);
        }
      }
      if (S.n < 3) continue;
      const a = S.age / S.life, fade = Math.min(1, S.age * 4) * (1 - Math.pow(a, 2)) * Math.min(1, wind.vortex.on * 2) * (1 - S.out / 0.3);
      lightAt(S.head.x, S.head.y, S.head.z, _lp);
      const base = v;
      for (let i = 0; i < S.n; i++) {
        const i3 = i * 3, p3 = Math.max(i - 2, 0) * 3, n3 = Math.min(i + 2, S.n - 1) * 3;
        const u = i / (S.n - 1);
        const w = S.width * (0.55 + 0.45 * Math.sin(u * 3.14));
        for (let sd = -1; sd <= 1; sd += 2) {
          const o3 = v * 3, o4 = v * 4;
          stArr.pos[o3] = S.pts[i3]; stArr.pos[o3 + 1] = S.pts[i3 + 1]; stArr.pos[o3 + 2] = S.pts[i3 + 2];
          stArr.prev[o3] = S.pts[p3]; stArr.prev[o3 + 1] = S.pts[p3 + 1]; stArr.prev[o3 + 2] = S.pts[p3 + 2];
          stArr.next[o3] = S.pts[n3]; stArr.next[o3 + 1] = S.pts[n3 + 1]; stArr.next[o3 + 2] = S.pts[n3 + 2];
          stArr.data[o4] = sd; stArr.data[o4 + 1] = u; stArr.data[o4 + 2] = w; stArr.data[o4 + 3] = S.seed;
          stArr.col[o4] = _lp.x * 1.7; stArr.col[o4 + 1] = _lp.y * 1.8; stArr.col[o4 + 2] = _lp.z * 1.9; stArr.col[o4 + 3] = S.op * fade;
          v++;
        }
      }
      for (let i = 0; i < S.n - 1; i++) { const k = base + i * 2; stIndex[idx++] = k; stIndex[idx++] = k + 2; stIndex[idx++] = k + 1; stIndex[idx++] = k + 1; stIndex[idx++] = k + 2; stIndex[idx++] = k + 3; }
    }
    for (const k of ['position', 'aPrev', 'aNext', 'aData', 'aCol']) { const at = stGeo.getAttribute(k); at.needsUpdate = true; at.clearUpdateRanges?.(); at.addUpdateRange?.(0, v * at.itemSize); }
    stGeo.index.needsUpdate = true; stGeo.index.clearUpdateRanges?.(); stGeo.index.addUpdateRange?.(0, idx);
    stGeo.setDrawRange(0, idx);
  }

  // light at a point from the 8 slots, the moon and the sky, for particles lit on the CPU
  function lightAt(x, y, z, out) {
    const amb = lightUniforms.uSkyAmb.value, moon = lightUniforms.uMoonCol.value;
    out.set(amb.x * 3 + moon.x * 0.7, amb.y * 3 + moon.y * 0.7, amb.z * 3 + moon.z * 0.7);
    for (let i = 0; i < NL; i++) {
      const L = lightPos[i], d2 = (L.x - x) ** 2 + (L.y - y) ** 2 + (L.z - z) ** 2;
      out.addScaledVector(lightCol[i], 1 / (1 + d2 * 2.6));
    }
    return out;
  }

  const _lp = new V3(), _wv = new V3(), _cv = new V3(), _ld = new V3();
  function updateMotes(dt) {
    let n = 0;
    const cam = camera.position;
    for (let i = 0; i < MAXP; i++) {
      if (!P.alive[i]) continue;
      const i3 = i * 3;
      if (dt > 0) {
        P.age[i] += dt;
        if (P.age[i] > P.life[i]) { P.alive[i] = 0; continue; }
        windAt(P.p[i3], P.p[i3 + 1], P.p[i3 + 2], _wv);
        const k = 1 - Math.exp(-P.drag[i] * dt);
        P.v[i3] += (_wv.x * P.wind[i] - P.v[i3]) * k;
        P.v[i3 + 1] += (_wv.y * P.wind[i] - P.v[i3 + 1]) * k - 9.8 * P.grav[i] * dt;
        P.v[i3 + 2] += (_wv.z * P.wind[i] - P.v[i3 + 2]) * k;
        if (P.kind[i] === 0) { const s = P.seed[i]; P.v[i3] += Math.sin(P.age[i] * 2.3 + s) * 0.25 * dt; P.v[i3 + 2] += Math.cos(P.age[i] * 1.9 + s * 1.7) * 0.25 * dt; }   // flakes flutter
        P.p[i3] += P.v[i3] * dt; P.p[i3 + 1] += P.v[i3 + 1] * dt; P.p[i3 + 2] += P.v[i3 + 2] * dt;
        if (P.col[i] && wind.vortex.on > 0) {
          vortexAxis(P.p[i3 + 1], _ax);
          const rr = Math.hypot(P.p[i3] - _ax.x, P.p[i3 + 2] - _ax.z), y = P.p[i3 + 1];
          const allowed = y < 0.5 ? 2.6 : (y > wind.vortex.height * 0.6 ? 1.15 : 1.3) * coreAt(y) * 1.25;
          if ((rr > allowed || y > wind.vortex.height + 0.2) && P.age[i] < P.life[i] - 0.15) P.age[i] = P.life[i] - 0.15;   // spray off the rim fades, it does not fill the sky
        }
        if (P.p[i3 + 1] < 0.004) { P.p[i3 + 1] = 0.004; P.v[i3] = P.v[i3 + 1] = P.v[i3 + 2] = 0; if (P.kind[i] !== 1) P.age[i] = Math.max(P.age[i], P.life[i] - 0.4); }
        // the facet tumbles
        const sx = P.spin[i3] * dt, sy = P.spin[i3 + 1] * dt, sz = P.spin[i3 + 2] * dt;
        let nx = P.n[i3], ny = P.n[i3 + 1], nz = P.n[i3 + 2];
        const cx = sy * nz - sz * ny, cy = sz * nx - sx * nz, cz = sx * ny - sy * nx;
        nx += cx; ny += cy; nz += cz; const nl = Math.hypot(nx, ny, nz); P.n[i3] = nx / nl; P.n[i3 + 1] = ny / nl; P.n[i3 + 2] = nz / nl;
      }
      const x = P.p[i3], y = P.p[i3 + 1], z = P.p[i3 + 2];
      const a = P.age[i] / P.life[i], fade = Math.min(1, P.age[i] * 4) * (1 - Math.pow(a, 3));
      const kind = P.kind[i];
      lightAt(x, y, z, _lp);
      let br = 0;
      if (kind === 0) {
        // snow backlit by the moon scatters forward: flakes between the lens and the moon light up
        _cv.set(x - cam.x, y - cam.y, z - cam.z).normalize();
        const fs = Math.pow(Math.max(0, _cv.dot(moonDir)), 4);
        _lp.multiplyScalar(2.6 * P.bright[i] * (1 + 2.6 * fs));
      }
      else if (kind === 1 || kind === 3) {
        // a glint: the facet mirrors the moon or an ice light into the lens for a moment
        _cv.set(cam.x - x, cam.y - y, cam.z - z).normalize();
        const nx = P.n[i3], ny = P.n[i3 + 1], nz = P.n[i3 + 2];
        const hm = _ld.copy(moonDir).add(_cv).normalize(), gm = Math.abs(nx * hm.x + ny * hm.y + nz * hm.z);
        br = Math.pow(gm, 90) * 9;
        for (let k = 0; k < NL; k++) {
          const e = lightCol[k].x + lightCol[k].y + lightCol[k].z; if (e < 0.05) continue;
          _ld.set(lightPos[k].x - x, lightPos[k].y - y, lightPos[k].z - z); const d2 = _ld.lengthSq(); _ld.normalize().add(_cv).normalize();
          const g = Math.abs(nx * _ld.x + ny * _ld.y + nz * _ld.z);
          br += Math.pow(g, 70) * Math.min(e, 3) * 2 / (1 + d2 * 0.5);
        }
        br = Math.min(br, 7); _lp.x = _lp.x * 0.5 + br * 0.75; _lp.y = _lp.y * 0.6 + br * 0.9; _lp.z = _lp.z * 0.7 + br; _lp.multiplyScalar(P.bright[i]);   // dust shows only when it glints
      } else if (kind === 4) { _lp.multiplyScalar(2.2 * P.bright[i]); }
      else { _lp.set(1.4, 2.6, 3.4).multiplyScalar(P.bright[i] * (1 - a)); }
      const o3 = n * 3, o4 = n * 4;
      iMPos[o3] = x; iMPos[o3 + 1] = y; iMPos[o3 + 2] = z;
      const sp2 = P.v[i3] * P.v[i3] + P.v[i3 + 1] * P.v[i3 + 1] + P.v[i3 + 2] * P.v[i3 + 2];
      const st = kind === 3 ? 0 : kind === 4 ? 0.09 : (kind === 2 ? 0.025 : kind === 0 && sp2 > 4 ? 0.024 : 0.012) * P.sk[i] * (P.col[i] ? 0.12 : 1);   // powder in the column: round specks, not dashes
      iMTail[o3] = x - P.v[i3] * st; iMTail[o3 + 1] = y - P.v[i3 + 1] * st; iMTail[o3 + 2] = z - P.v[i3 + 2] * st;
      iMCol[o4] = _lp.x * fade; iMCol[o4 + 1] = _lp.y * fade; iMCol[o4 + 2] = _lp.z * fade; iMCol[o4 + 3] = P.soft[i] ? -P.size[i] : P.size[i];
      iMK[n * 2] = kind; iMK[n * 2 + 1] = P.seed[i] % 1;
      n++;
    }
    mGeo.instanceCount = n;
    for (const k of ['iPos', 'iTail', 'iCol', 'iK']) mGeo.getAttribute(k).needsUpdate = true;
  }
  function updateWisps(dt) {
    let n = 0;
    for (let i = 0; i < MAXS; i++) {
      if (!SP.alive[i]) continue;
      const i3 = i * 3;
      if (dt > 0) {
        SP.age[i] += dt;
        if (SP.age[i] > SP.life[i]) { SP.alive[i] = 0; continue; }
        windAt(SP.p[i3], SP.p[i3 + 1], SP.p[i3 + 2], _wv);
        const k = 1 - Math.exp(-SP.drag[i] * dt);
        SP.v[i3] += (_wv.x * SP.wind[i] - SP.v[i3]) * k;
        SP.v[i3 + 1] += (_wv.y * SP.wind[i] - SP.v[i3 + 1]) * k + (SP.buoy[i] - 9.8 * SP.grav[i]) * dt;
        SP.v[i3 + 2] += (_wv.z * SP.wind[i] - SP.v[i3 + 2]) * k;
        SP.p[i3] += SP.v[i3] * dt; SP.p[i3 + 1] += SP.v[i3 + 1] * dt; SP.p[i3 + 2] += SP.v[i3 + 2] * dt;
        const floor = SP.s0[i] * 0.3;
        if (SP.p[i3 + 1] < floor) { SP.p[i3 + 1] = floor; SP.v[i3 + 1] = Math.abs(SP.v[i3 + 1]) * 0.1; }   // cold vapour pools and spreads on the snow
        SP.rot[i] += SP.rotV[i] * dt;
      }
      const a = SP.age[i] / SP.life[i];
      lightAt(SP.p[i3], SP.p[i3 + 1], SP.p[i3 + 2], _lp);
      const alb = SP.type[i] === 0 ? 0.32 : SP.type[i] === 2 ? 0.5 : 0.6;
      const o3 = n * 3, o4 = n * 4;
      iWPos[o3] = SP.p[i3]; iWPos[o3 + 1] = SP.p[i3 + 1]; iWPos[o3 + 2] = SP.p[i3 + 2];
      iWA[o4] = SP.s0[i] + (SP.s1[i] - SP.s0[i]) * (1 - Math.exp(-2.5 * a)); iWA[o4 + 1] = SP.rot[i]; iWA[o4 + 2] = a; iWA[o4 + 3] = SP.seed[i];
      iWB[o4] = _lp.x * alb * 0.9; iWB[o4 + 1] = _lp.y * alb * 0.95; iWB[o4 + 2] = _lp.z * alb; iWB[o4 + 3] = SP.op[i];
      let asp = 0;
      if (SP.type[i] === 2) { iWA[o4 + 1] = Math.sin(SP.seed[i] + SP.age[i] * 0.2) * 0.12; asp = 1.3; }
      else if (SPasp[i] > 0) {
        // spindrift streams along its own motion on screen
        _cv.set(SP.p[i3], SP.p[i3 + 1], SP.p[i3 + 2]).project(camera); _ld.set(SP.p[i3] + SP.v[i3] * 0.1, SP.p[i3 + 1] + SP.v[i3 + 1] * 0.1, SP.p[i3 + 2] + SP.v[i3 + 2] * 0.1).project(camera);
        iWA[o4 + 1] = Math.atan2(_ld.y - _cv.y, (_ld.x - _cv.x) * (W / H));
        asp = Math.min(SPasp[i], Math.hypot(SP.v[i3], SP.v[i3 + 1], SP.v[i3 + 2]) * 0.45 * SPasp[i]);
      }
      iWC[n * 2] = asp; iWC[n * 2 + 1] = SP.type[i];
      n++;
    }
    wGeo.instanceCount = n;
    for (const k of ['iPos', 'iA', 'iB', 'iC']) wGeo.getAttribute(k).needsUpdate = true;
  }

  // ---------------------------------------------------------------- the frost bloom in the hand: dendrites radiating from the palm
  // A frost flower: a dozen and a half hairline dendrites leave the palm over a hemisphere (local +Z is the palm's
  // normal), each with side branches at 60 degrees in its own plane and twigs off those, all growing out from the
  // centre on one clock. Units: 1 = the longest arm; the stage scales the group to about 11 cm.
  const bloom = { group: new THREE.Group(), t: -1, scale: 1, fade: 0, spin: 0, mesh: null, mat: null };
  bloom.group.visible = false; group.add(bloom.group);
  {
    const rng = mulberry32(4242);
    const RR = (a, b) => a + (b - a) * rng();
    const strips = [];
    const speed = 0.85;                                     // arm lengths per second
    const NA = 17, ga = Math.PI * (3 - Math.sqrt(5));
    const v3 = (x, y, z) => new V3(x, y, z);
    for (let i = 0; i < NA; i++) {
      // directions over a cone round +Z, spread like a sunflower so no side is bare
      const k = (i + 0.5) / NA, th = Math.acos(1 - k * (1 - Math.cos(1.25))), ph = i * ga + RR(-0.25, 0.25);
      const d = v3(Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)).normalize();
      const e = v3(RR(-1, 1), RR(-1, 1), RR(-1, 1)).cross(d).normalize();   // the plane its branches lie in
      const L = RR(0.5, 1.0) * (1 - 0.25 * k), t0 = RR(0, 0.12);
      const bend = v3(RR(-1, 1), RR(-1, 1), RR(-1, 1)).multiplyScalar(0.06);
      const P = (u) => d.clone().multiplyScalar(u).addScaledVector(bend, u * u);
      const main = []; for (let j = 0; j <= 16; j++) { const u = j / 16 * L; const q = P(u); main.push([q.x, q.y, q.z, t0 + u / speed]); }
      strips.push({ pts: main, w: 0.009, I: 1, depth: 0, seed: rng() });
      const nSide = 3 + Math.floor(L * 6);
      for (let sI = 0; sI < nSide; sI++) {
        const s0 = (0.18 + 0.72 * (sI + RR(-0.2, 0.2)) / nSide) * L, len = (0.34 - 0.26 * s0 / L) * L * RR(0.75, 1.15);
        const base = P(s0), tb = t0 + s0 / speed + 0.03;
        for (const sg of (rng() < 0.7 ? [1, -1] : [rng() < 0.5 ? 1 : -1])) {
          const bd = d.clone().multiplyScalar(0.5).addScaledVector(e, sg * 0.866).normalize();
          const sp = []; for (let j = 0; j <= 6; j++) { const f = j / 6 * len; const q = base.clone().addScaledVector(bd, f); sp.push([q.x, q.y, q.z, tb + f / (speed * 0.55)]); }
          strips.push({ pts: sp, w: 0.006, I: 0.75, depth: 1, seed: rng() });
          const nt = 1 + Math.floor(rng() * 2.5);
          for (let j2 = 1; j2 <= nt; j2++) {
            const f0 = len * j2 / (nt + 1), lt = len * RR(0.22, 0.4), tt = tb + f0 / (speed * 0.55) + 0.03;
            const b0 = base.clone().addScaledVector(bd, f0);
            const tw = []; for (let j = 0; j <= 3; j++) { const g = j / 3 * lt; const q = b0.clone().addScaledVector(d, g); tw.push([q.x, q.y, q.z, tt + g / (speed * 0.4)]); }
            strips.push({ pts: tw, w: 0.004, I: 0.5, depth: 2, seed: rng() });
          }
        }
      }
    }
    // short hoar needles packed round the palm
    for (let i = 0; i < 26; i++) {
      const d = v3(RR(-1, 1), RR(-1, 1), RR(0.2, 1)).normalize(), L = RR(0.08, 0.22), t0 = RR(0.05, 0.5);
      strips.push({ pts: [[0, 0, 0, t0], [d.x * L * 0.5, d.y * L * 0.5, d.z * L * 0.5, t0 + L * 0.5 / (speed * 0.4)], [d.x * L, d.y * L, d.z * L, t0 + L / (speed * 0.4)]], w: 0.004, I: 0.55, depth: 2, seed: rng() });
    }
    // build ribbon vertices: position, prev, next, side, along, width, intensity, arrival, seed
    const pos = [], prev = [], next = [], data = [], extra = [], index = [];
    let v = 0;
    for (const S of strips) {
      const n = S.pts.length, base = v;
      for (let i = 0; i < n; i++) {
        const p = S.pts[i], pp = S.pts[Math.max(0, i - 1)], pn = S.pts[Math.min(n - 1, i + 1)];
        const taper = 1 - 0.7 * (i / (n - 1));
        for (const side of [-1, 1]) {
          pos.push(p[0], p[1], p[2]); prev.push(pp[0], pp[1], pp[2]); next.push(pn[0], pn[1], pn[2]);
          data.push(side, i / (n - 1), S.w * taper, S.depth); extra.push(S.I * (0.7 + 0.3 * rng()), p[3], S.seed);
          v++;
        }
      }
      for (let i = 0; i < n - 1; i++) { const k = base + i * 2; index.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aPrev', new THREE.Float32BufferAttribute(prev, 3));
    g.setAttribute('aNext', new THREE.Float32BufferAttribute(next, 3));
    g.setAttribute('aData', new THREE.Float32BufferAttribute(data, 4));
    g.setAttribute('aExtra', new THREE.Float32BufferAttribute(extra, 3));
    g.setIndex(index);
    bloom.mat = new THREE.ShaderMaterial({
      uniforms: { uResolution: uniforms.uResolution, uDpr: uniforms.uDpr, uT: { value: 0 }, uFade: { value: 0 }, uGlowCol: iceShared.uGlowCol, uGlint: { value: 0 } },
      vertexShader: /* glsl */`
        attribute vec3 aPrev; attribute vec3 aNext; attribute vec4 aData; attribute vec3 aExtra;
        uniform vec2 uResolution; uniform float uDpr, uT;
        varying float vSide; varying float vI; varying float vPx; varying float vAlong; varying float vDepth; varying float vSeed;
        void main(){
          mat4 mvp = projectionMatrix * modelViewMatrix;
          vec4 c = mvp * vec4(position, 1.), a = mvp * vec4(aPrev, 1.), b = mvp * vec4(aNext, 1.);
          vec2 hr = uResolution * .5;
          vec2 d = b.xy / b.w * hr - a.xy / a.w * hr; float L = length(d);
          d = L > 1e-4 ? d / L : vec2(1., 0.);
          vec2 n = vec2(-d.y, d.x);
          float sc = length(modelMatrix[0].xyz);
          float pw = aData.z * sc * projectionMatrix[1][1] * hr.y / max(c.w, 1e-3);
          float px = clamp(pw, .75 * uDpr, 4. * uDpr);
          c.xy += n * aData.x * px * 1.5 / hr * c.w;           // 3x the line: room for its glow
          float age = uT - aExtra.y;
          vI = aExtra.x * smoothstep(-.012, .008, age) * (1. + 1.8 * exp(-max(age, 0.) * 12.)) * min(1., pw / px + .35);
          vSide = aData.x; vPx = px; vAlong = aData.y; vDepth = aData.w; vSeed = aExtra.z;
          gl_Position = c;
        }`,
      fragmentShader: /* glsl */`
        uniform float uFade, uDpr, uGlint, uT; uniform vec3 uGlowCol;
        varying float vSide; varying float vI; varying float vPx; varying float vAlong; varying float vDepth; varying float vSeed;
        void main(){
          float s = abs(vSide) * 1.5;                           // 0 at the centreline, 1 at the line's edge
          float core = 1. - smoothstep(.3, .62, s);
          float glow = exp(-s * s * 2.6) * .35;
          float vary = (.55 + .45 * sin(vAlong * 19. + vSeed * 40.) * sin(vAlong * 7.3 + vSeed * 11.)) * (1. - .55 * vAlong) * (.5 + .5 * fract(vSeed * 7.13 + .3));
          // a crystal face turning into the light: each strand glints for a moment as the bloom turns
          float gl = pow(max(sin(uT * 1.1 + vSeed * 6.283 + vAlong * 1.5), 0.), 24.) * 2.2;
          vec3 col = vec3(.85, .95, 1.) * core * (1.2 + uGlint + gl) + uGlowCol * glow * (1. + gl * .3);
          gl_FragColor = vec4(col * vI * vary * uFade, 1.);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    bloom.mesh = layer(new THREE.Mesh(g, bloom.mat), LAYERS.fx); bloom.mesh.renderOrder = 32;
    bloom.group.add(bloom.mesh);
    bloom.duration = 1.4;
  }

  // ---------------------------------------------------------------- refraction rings: pressure fronts felt, not drawn
  const ringGeo = new THREE.PlaneGeometry(2, 2, 1, 1);
  const rings = [];
  for (let i = 0; i < 16; i++) {
    const dm = new THREE.ShaderMaterial({
      uniforms: { uThick: { value: 0.05 }, uAmp: { value: 0 } },
      vertexShader: `varying vec2 vL; varying vec2 vRad; void main(){ vL = position.xy; vRad = (modelViewMatrix * vec4(position.xy, 0., 0.)).xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */`
        uniform float uThick, uAmp; varying vec2 vL; varying vec2 vRad;
        void main(){
          float r = length(vL); if (r > 1.) discard;
          float x = (r - .9) / (uThick * 1.6);
          float prof = -1.7 * x * exp(-x * x);
          vec2 dir = vRad / max(length(vRad), 1e-5);
          gl_FragColor = vec4(dir * prof * uAmp, 0., 0.);
        }`,
      transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    });
    const dmesh = layer(new THREE.Mesh(ringGeo, dm), LAYERS.distort); dmesh.visible = false;
    group.add(dmesh);
    rings.push({ alive: false, dmesh, dm, age: 0, delay: 0, life: 0.3, R: 2, thick: 0.05, amp: 0.1, center: new V3(), q: new THREE.Quaternion() });
  }
  function ring(center, normal, { radius = 2.5, thick = 0.06, life = 0.35, delay = 0, amp = 0.025 } = {}) {
    const G = rings.find((r) => !r.alive) || rings[0];
    G.alive = true; G.age = -delay; G.life = life; G.R = radius; G.thick = thick; G.amp = amp;
    G.center.copy(center); G.q.setFromUnitVectors(new V3(0, 0, 1), _a.copy(normal).normalize());
  }
  function viewSpan(p) { const d = Math.max(0.2, _c.copy(p).sub(camera.position).dot(camera.getWorldDirection(_d))); return 2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5); }
  function updateRings(dt) {
    for (const G of rings) {
      if (!G.alive) continue;
      G.age += dt;
      if (G.age > G.life) { G.alive = false; G.dmesh.visible = false; continue; }
      if (G.age < 0) { G.dmesh.visible = false; continue; }
      const x = G.age / G.life, r = Math.max(0.05, G.R * (1 - Math.pow(2, -10 * x)));
      G.dmesh.visible = true; G.dmesh.position.copy(G.center); G.dmesh.quaternion.copy(G.q); G.dmesh.scale.setScalar(r);
      G.dm.uniforms.uThick.value = Math.min(0.45, G.thick / r * (1 + x * 1.5));
      G.dm.uniforms.uAmp.value = G.amp / viewSpan(G.center) * Math.pow(1 - x, 1.2);
    }
  }

  // ---------------------------------------------------------------- obstacles: where the ice stands, for the mist and the snow
  const obst = { tex: null, box: new THREE.Vector4(), t: 0, uniforms: { tObst: { value: null }, uObstBox: { value: new THREE.Vector4() }, uObstT: { value: -1 }, uShatter: { value: 0 } } };
  // a smooth 2-D value noise for the mist's top height, baked with the obstacles (one fetch instead of a 3-D one)
  const vnHash = (i, j) => { let h = (i * 374761393 + j * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  function vnoise(x, z) { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz); return (vnHash(i, j) * (1 - u) + vnHash(i + 1, j) * u) * (1 - v) + (vnHash(i, j + 1) * (1 - u) + vnHash(i + 1, j + 1) * u) * v; }
  const topNoise = (x, z) => 0.65 * vnoise(x * 0.55, z * 0.55) + 0.35 * vnoise(x * 1.3 + 7, z * 1.3 + 3);
  function buildObstacles() {
    const box = frost.box, W = 192, H = Math.max(8, Math.round(192 * (1 / box.w) / (1 / box.z)));
    const data = new Uint16Array(W * H * 4);
    const toH = THREE.DataUtils.toHalfFloat;
    const x0 = box.x, z0 = box.y, sx = 1 / box.z / W, sz = 1 / box.w / H;
    const foot = spikes.map((S) => { const a = S.axis; const k = a.y > 0.2 ? (S.mesh ? 1 : 1) : 1; return { x: S.base.x, z: S.base.z, r: S.radius * 0.95 * k, t: S.erupt, h: S.height }; });
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const x = x0 + (i + 0.5) * sx, z = z0 + (j + 0.5) * sz;
      let best = 9, bt = 99, bh = 0;
      for (const f of foot) { const d = Math.hypot(x - f.x, z - f.z) - f.r; if (d < best) { best = d; bt = f.t; bh = f.h; } }
      const o = (j * W + i) * 4;
      data[o] = toH(Math.min(best, 8)); data[o + 1] = toH(bt); data[o + 2] = toH(bh); data[o + 3] = toH(topNoise(x, z));
    }
    const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.HalfFloatType);
    tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.needsUpdate = true;
    obst.tex = tex; obst.uniforms.tObst.value = tex; obst.uniforms.uObstBox.value.copy(box);
  }

  // ---------------------------------------------------------------- mist: ray-marched along the ground at half resolution
  const mist = { amount: 0, height: 0.45, flowSpeed: 0.25, origin: new V3(), swirl: 0, phase: 0, banks: [] };
  // mist banks: {id, c: V3, ra, rc, hb, ang, dens}; each eases toward its wanted density, so they never pop
  function setBanks(list) {
    for (const B of mist.banks) B.want = 0;
    for (const L of list) {
      let B = mist.banks.find((b) => b.id === L.id);
      if (!B) { B = { id: L.id, amt: 0, c: new V3() }; mist.banks.push(B); }
      Object.assign(B, L, { c: B.c.copy(L.c), want: L.dens });
    }
  }
  function updateBanks(dt) {
    for (const B of mist.banks) B.amt += (B.want - B.amt) * (1 - Math.exp(-dt * 1.1));
    mist.banks = mist.banks.filter((B) => B.want > 0 || B.amt > 0.003).slice(0, 8);
    const U = mistMat.uniforms;
    mist.banks.forEach((B, i) => { U.uBankA.value[i].set(B.c.x, B.c.y, B.c.z, B.ra); U.uBankB.value[i].set(B.rc, B.hb, B.ang, B.amt); });
    U.uBankN.value = mist.banks.length;
  }
  const mistLightPos = Array.from({ length: 4 }, () => new V3(0, -50, 0)), mistLightCol = Array.from({ length: 4 }, () => new V3());
  const mistMat = new THREE.ShaderMaterial({
    uniforms: {
      tDepth: { value: depthTex }, uInvProj: { value: new THREE.Matrix4() }, uCamMat: { value: new THREE.Matrix4() }, uCamPos: { value: new V3() },
      uTime: uniforms.uTime, tNoise: uniforms.tNoise, uAmt: { value: 0 }, uH: { value: 0.45 }, uOrigin: { value: new V3() }, uFlow: { value: 0.25 },
      uVortex: { value: new THREE.Vector4(0, 0, 2, 0) }, uVort: { value: new V3() }, uPhase: { value: 0 }, uMistCol: { value: new V3(0.64, 0.73, 0.88) },
      uMoonCol: lightUniforms.uMoonCol, uSkyAmb: lightUniforms.uSkyAmb, uMoonDir: lightUniforms.uMoonDir, uML: { value: mistLightPos }, uMC: { value: mistLightCol },
      uCol1: { value: new THREE.Vector4(0, 0, 3.3, 0.75) }, uCol2: { value: new THREE.Vector4() }, uColS: { value: new THREE.Vector2() },
      uBankA: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) }, uBankB: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) }, uBankN: { value: 0 },
      ...obst.uniforms, uRes: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader: FS_VERT,
    fragmentShader: TNOISE_GLSL + HASH_GLSL + /* glsl */`
      uniform sampler2D tDepth, tObst; uniform mat4 uInvProj, uCamMat; uniform vec3 uCamPos, uOrigin, uVort, uMistCol, uMoonCol, uSkyAmb, uMoonDir;
      uniform vec2 uColS;           // the S bend: direction * amplitude
      uniform vec4 uBankA[8], uBankB[8]; uniform int uBankN;   // mist banks: centre, length; width, height, wind angle, density
      uniform vec4 uCol1, uCol2;   // the column: lean x, lean z, height, core radius at the foot; amount, turn (rad/s), climb (m/s)
      uniform vec3 uML[4], uMC[4];
      uniform float uTime, uAmt, uH, uFlow, uPhase, uObstT, uShatter; uniform vec4 uVortex, uObstBox; uniform vec2 uRes;
      varying vec2 vUv;
      const float RAD = 8.5;                               // the mist lies within this distance of where the frost landed
      // where the air at xz was tau seconds ago: pushed out from where the frost landed, carried round the column
      // and drawn in along the snow at its foot. Rotation, not a straight shift, so the bank turns round the axis.
      vec2 advect(vec2 xz, float tau){
        vec2 q = xz - uOrigin.xz; float r = length(q) + .2;
        xz -= q / r * uFlow / (1. + r * .3) * tau;
        vec2 c = xz - uVortex.xy; float rc = length(c) + 1e-3, core = uVortex.z;
        float om = uVortex.w / core * (rc < core ? 1. : core * core / (rc * rc));   // Rankine: the bank turns as one inside the core, slower outside
        float ang = -om * tau, sn = sin(ang), cs = cos(ang);
        c = vec2(cs * c.x - sn * c.y, sn * c.x + cs * c.y);
        c *= max(rc + uVort.x * min(1., rc / core) * tau, .02) / rc;
        return uVortex.xy + c;
      }
      vec4 obstAt(vec2 xz){ vec2 uv = (xz - uObstBox.xy) * uObstBox.zw; return (uv.x < 0. || uv.y < 0. || uv.x > 1. || uv.y > 1.) ? vec4(9., 99., 0., 0.) : texture2D(tObst, uv); }
      void main(){
        vec2 uv = vUv;
        float z = texture2D(tDepth, uv).x;
        vec4 ndc = vec4(uv * 2. - 1., z * 2. - 1., 1.);
        vec4 vp = uInvProj * ndc; vp /= vp.w;
        vec3 wp = (uCamMat * vp).xyz;
        vec3 ro = uCamPos, rd = normalize(wp - ro);
        float tEnd = z >= .99999 ? 60. : length(wp - ro);
        #ifndef COLUMN
        vec3 colAcc = vec3(0.); float colTr = 1.;
        #endif
        #ifdef COLUMN
        // the column: a thin veil of lifted powder climbing the funnel, its fibres torn along the helix
        vec3 colAcc = vec3(0.); float colTr = 1.;
        if (uCol2.x > .005) {
          float H = uCol1.z, Rm = uCol1.w * 1.5 * 1.7 + length(uCol1.xy) * H * .5 + length(uColS) * .5;
          vec2 oc2 = ro.xz - uVortex.xy - uCol1.xy * H * .5;   // bound round the axis at mid-height
          float A2 = dot(rd.xz, rd.xz), B2 = dot(oc2, rd.xz), C2 = dot(oc2, oc2) - Rm * Rm;
          float disc2 = B2 * B2 - A2 * C2;
          if (disc2 > 0. && A2 > 1e-6) {
            float sq2 = sqrt(disc2);
            float c0 = max((-B2 - sq2) / A2, 0.), c1 = min((-B2 + sq2) / A2, tEnd);
            if (rd.y > 0.) c1 = min(c1, (H * 1.05 - ro.y) / rd.y);
            else if (rd.y < 0.) { c1 = min(c1, ro.y / -rd.y); if (ro.y > H * 1.05) c0 = max(c0, (ro.y - H * 1.05) / -rd.y); }
            if (c1 > c0) {
              const int NC = 20;
              float dc = (c1 - c0) / float(NC);
              float jc = h12(gl_FragCoord.xy * 1.37 + 11.3 + fract(uPhase * 3.) * 17.);
              float g1 = fract(uPhase), g2 = fract(uPhase + .5), gw = 1. - abs(2. * g1 - 1.);
              float t1p = (g1 - .5) * 4.5, t2p = (g2 - .5) * 4.5;
              float fwd = .4 + 2.6 * pow(max(dot(rd, uMoonDir), 0.), 4.);       // looking toward the moon, the powder lights up from behind
              for (int i = 0; i < NC; i++) {
                vec3 p = ro + rd * (c0 + (float(i) + jc) * dc);
                float hh = max(p.y, 0.) / H;
                vec2 d = p.xz - uVortex.xy - uCol1.xy * p.y - uColS * (-sin(4.712 * hh)); float r = length(d);
                float rc = uCol1.w * (.3 + .85 * pow(min(1.25, hh), 1.4));
                if (r > rc * 1.7) continue;
                float shell = exp(-pow((r - rc * .8) / (rc * .45), 2.)) + .25 * exp(-r * r / (rc * rc));
                float hgt = (.75 + .7 * exp(-p.y / .9)) * (1. - smoothstep(H * .68, H * 1.02, p.y));
                float th = atan(d.y, d.x);
                // three strands twisting up the funnel, the same strands the powder specks ride: a rope, not a cone
                float rope = .15 + 1.6 * pow(.5 + .5 * cos(4. * (th - 1.7 * p.y - uCol2.w)), 5.);
                float prof = shell * hgt * rope;
                if (prof < .02) continue;
                // fibres along the helix, carried round and up by the wind: two phases crossfaded, like the bank.
                // 1.9099 = 12 / 2 pi turns a revolution into 12 units; the noise tiles every 6, so the wrap is seamless
                float U1 = (th - uCol2.y * t1p) * 1.9099, V1 = (p.y - uCol2.z * t1p) * 1.8;
                float U2 = (th - uCol2.y * t2p) * 1.9099, V2 = (p.y - uCol2.z * t2p) * 1.8;
                float s1 = U1 - V1 * 1.8, s2 = U2 - V2 * 1.8;   // about 1.7 rad of turn per metre of climb, like the wind's own helix
                s1 *= 1.6; s2 *= 1.6;                            // finer fibres
                // fine across the helix, long along it, the spacing warped and the veil torn into patches: never a lattice
                vec4 wv1 = tn(vec3(s1 * .5, V1 * .4, r * .9 + 7.)), wv2 = tn(vec3(s2 * .5, V2 * .4 + 2.7, r * .9 + 7.));
                float n1 = (tn(vec3(s1 * 2.6 + wv1.x * 1.1, V1 * .3, r * 2.6)).x * .7 + .2) * .5 + .5;
                float n2 = (tn(vec3(s2 * 2.6 + wv2.x * 1.1, V2 * .3 + 2.7, r * 2.6)).x * .7 + .2) * .5 + .5;
                float torn = smoothstep(-.25, .35, mix(wv2.y, wv1.y, gw));
                // the far side of the column is mostly hidden behind its own powder
                float face = .25 + .75 * smoothstep(-.35, .55, dot(d / max(r, 1e-3), normalize(ro.xz - uVortex.xy)));
                float dens = smoothstep(.5, .66, mix(n2, n1, gw)) * (.3 + .7 * torn) * face * prof * uCol2.x * 1.3;
                if (dens < .003) continue;
                float a = 1. - exp(-dens * dc * 2.);
                // thin powder glows against the moon; thick powder shades itself
                vec3 L = uSkyAmb * 4. + uMoonCol * fwd * (4.2 - 1.6 * smoothstep(0., .6, dens)) * (1. + .6 * exp(-p.y / 1.2));
                for (int k = 0; k < 3; k++) { vec3 dl = uML[k] - p; L += uMC[k] / (1. + dot(dl, dl) * 2.2) * .7; }
                colAcc += colTr * a * L * uMistCol;
                colTr *= 1. - a;
              }
            }
          }
        }
        gl_FragColor = vec4(colAcc, 1. - colTr); return;
        #endif
        // ---- the mist banks: low wind-stretched sheets laid where the cold air pools, fibrous, churning in place
        vec3 bAcc = vec3(0.); float bTr = 1.;
        if (uBankN > 0) {
          // each bank marched over its own span, so a small plume gets as many samples as a wide sheet
          float jb = h12(gl_FragCoord.xy * 1.13 + fract(uPhase * 7.) * 37.);   // white jitter: a patterned one printed a screen door
          float g1 = fract(uPhase * .8), g2 = fract(uPhase * .8 + .5), gw = 1. - abs(2. * g1 - 1.);
          float fwdB = .55 + 1.8 * pow(max(dot(rd, uMoonDir), 0.), 2.);
          for (int k = 0; k < 8; k++) {
            if (k >= uBankN || bTr < .04) break;
            vec4 A = uBankA[k], B = uBankB[k];
            // the bank's bounding ellipsoid, stretched along the wind
            vec2 wd = vec2(cos(B.z), sin(B.z)), wn = vec2(-wd.y, wd.x);
            vec3 sc = vec3(A.w, B.y * 2.2, B.x) * 1.3;
            vec3 o3 = vec3(dot(ro.xz - A.xz, wd), ro.y - A.y, dot(ro.xz - A.xz, wn)) / sc;
            vec3 d3 = vec3(dot(rd.xz, wd), rd.y, dot(rd.xz, wn)) / sc;
            float aa = dot(d3, d3), bb = dot(o3, d3), cc = dot(o3, o3) - 1., dd = bb * bb - aa * cc;
            if (dd <= 0.) continue;
            float sq3 = sqrt(dd), b0 = max((-bb - sq3) / aa, 0.), b1 = min((-bb + sq3) / aa, tEnd);
            if (rd.y < 0.) b1 = min(b1, ro.y / -rd.y);
            if (b1 <= b0) continue;
            const int NB = 10;
            float db = (b1 - b0) / float(NB);
            for (int i = 0; i < NB; i++) {
              vec3 p = ro + rd * (b0 + (float(i) + jb) * db);
              vec2 dx = p.xz - A.xz;
              float u = dot(dx, wd), v = dot(dx, wn);
              float e2 = u * u / (A.w * A.w) + v * v / (B.x * B.x);
              float env = exp(-1.3 * e2) * exp(-pow((p.y - A.y) / B.y, 2.)) * smoothstep(0., .06, p.y) * (1. - smoothstep(.9, 1.6, e2));   // falls to zero well inside its bounds: no cut edges
              if (env < .01) continue;
              // stretched along the wind (about 3:1), domain-warped, advected along the wind in two crossfaded phases
              vec3 q = vec3(u * .38, p.y * 2.6, v * 1.7) + float(k) * 7.3;
              vec3 wq = tn(q * .45 + vec3(0., 0., uTime * .05)).xyz * .9;
              float n1 = tn(q + wq - vec3((g1 - .5) * 1.4, 0., 0.)).x * .6 + tn((q + wq - vec3((g1 - .5) * 1.4, 0., 0.)) * 2.1 + 1.7).y * .3;
              float n2 = tn(q + wq - vec3((g2 - .5) * 1.4, 0., 0.) + 11.).x * .6 + tn((q + wq - vec3((g2 - .5) * 1.4, 0., 0.) + 11.) * 2.1 + 1.7).y * .3;
              float n = mix(n2, n1, gw) + tn(q * 4.3 + wq + 5.).z * .14;                // torn, curling edges
              float wsp = smoothstep(-.12, .42, n);
              float dens = (.06 + .94 * wsp * wsp) * env * B.w * .2;                     // the whole sheet, thicker and thinner along torn wind streaks
              if (dens < .002) continue;
              float a = 1. - exp(-dens * 2.2 * db);
              vec3 L = (uSkyAmb * 9. + uMoonCol * fwdB * (2.8 + 1.6 * smoothstep(0., .5, p.y))) * B.w / max(B.w, 1.) * 1.25;
              for (int m = 0; m < 3; m++) { vec3 dl = uML[m] - p; L += uMC[m] / (1. + dot(dl, dl) * 1.6) * 2.4; }
              bAcc += bTr * a * L * uMistCol;
              bTr *= 1. - a;
            }
          }
        }
        colAcc += colTr * bAcc; colTr *= bTr;
        float lift = 1. + uVort.y * 3.;
        float topY = uH * 1.9 * lift;
        float t0 = 0., t1 = tEnd;
        if (ro.y > topY) { if (rd.y >= 0.) { gl_FragColor = vec4(colAcc, 1. - colTr); return; } t0 = (ro.y - topY) / -rd.y; }
        else if (rd.y > 0.) t1 = min(t1, (topY - ro.y) / rd.y);
        if (rd.y < 0.) t1 = min(t1, ro.y / -rd.y);
        // clip to the cylinder the mist lives in
        vec2 oc = ro.xz - uOrigin.xz, dxz = rd.xz; float A = dot(dxz, dxz), B = dot(oc, dxz), C = dot(oc, oc) - RAD * RAD;
        float disc = B * B - A * C;
        if (disc <= 0. || A < 1e-6) { gl_FragColor = vec4(colAcc, 1. - colTr); return; }
        float sq = sqrt(disc); t0 = max(t0, (-B - sq) / A); t1 = min(t1, (-B + sq) / A);
        if (t1 <= t0 || uAmt <= 0.) { gl_FragColor = vec4(colAcc, 1. - colTr); return; }
        int N = int(clamp((t1 - t0) / .6, 8., 16.));
        float dt = (t1 - t0) / float(N);
        float j = h12(gl_FragCoord.xy * .97 + fract(uPhase * 5.) * 53.);
        vec3 acc = vec3(0.); float Tr = 1.;
        float ph = uPhase, f1 = fract(ph), f2 = fract(ph + .5), w1 = 1. - abs(2. * f1 - 1.);
        vec3 amb = uSkyAmb * 2.2;
        for (int i = 0; i < 16; i++) {
          if (i >= N) break;
          float t = t0 + (float(i) + j) * dt;
          vec3 p = ro + rd * t;
          vec2 xz = p.xz;
          float r0 = length(xz - uOrigin.xz);
          float cover = (1. - smoothstep(3.5, RAD, r0)) * (.35 + .65 * smoothstep(.5, 3., r0));   // thin over the seed: the frost there stays crisp
          vec4 ob = obstAt(xz);
          float top = uH * (.6 + .8 * (ob.y > 98. ? .5 : ob.w)) * (1. + uVort.y * 3. * exp(-length(xz - uVortex.xy) / (uVortex.z * .8)));
          float hf = 1. - smoothstep(top * .15, top * 1.55, p.y);
          if (hf * cover <= .01) continue;
          float on = step(ob.y, uObstT) * (1. - .7 * uShatter);
          // parting: the mist thins out around each standing spike and banks up against it
          float part = mix(1., smoothstep(.02, .35, ob.x) + .35 * exp(-max(ob.x - .3, 0.) * 6.) * smoothstep(.1, .3, ob.x), on);
          // the warp drifts through, so it churns in place; two phases of advection along the flow, crossfaded
          vec3 w = p * .5 + vec3(.09, .16, -.07) * uTime;
          vec3 wq = tn(w).xyz * .8;
          vec3 q = p * vec3(1.1, 2.2, 1.1) + wq;
          vec2 a1 = advect(xz, (f1 - .5) * 4.5), a2 = advect(xz, (f2 - .5) * 4.5);
          vec3 q1 = vec3(a1.x, p.y, a1.y) * vec3(1.1, 2.2, 1.1) + wq, q2 = vec3(a2.x, p.y, a2.y) * vec3(1.1, 2.2, 1.1) + wq + vec3(13.1, 0., 7.7);
          float b1 = tn(q1).x * .55 + tn(q1 * 2.03 + 1.7).y * .28;
          float b2 = tn(q2).x * .55 + tn(q2 * 2.03 + 1.7).y * .28;
          float n = mix(b2, b1, w1);
          float pre = n + hf * .5 - .36;
          if (pre < -.12) continue;                                       // nothing here, skip the detail
          n += tn(q * 4.7 + 3.1).z * .17;                                // finer wisps at the edges (the finest live in the sprites)
          float vk = uVort.y * exp(-length(xz - uVortex.xy) / (uVortex.z * 1.3));    // near the column the bank tears into arms
          float dens = smoothstep(mix(.06, .14, vk), mix(.32, .24, vk), n + hf * .5 - .36) * hf * hf * cover * part * uAmt * (1. + vk * .6);
          if (dens < .002) continue;
          float a = 1. - exp(-dens * 1.9 * dt);
          // lit by the moon from above (the top of the bank brighter) and by the four strongest ice lights
          vec3 L = amb * 1.6 + uMoonCol * (.7 + .9 * smoothstep(0., uH * 1.4, p.y)) * (.6 + 1.4 * pow(max(dot(rd, uMoonDir), 0.), 2.));
          for (int k = 0; k < 3; k++) { vec3 dl = uML[k] - p; L += uMC[k] / (1. + dot(dl, dl) * 2.2) * .8; }
          acc += Tr * a * L * uMistCol;
          Tr *= 1. - a;
          if (Tr < .03) break;
        }
        gl_FragColor = vec4(colAcc + colTr * acc, 1. - colTr * Tr);
      }`,
    depthTest: false, depthWrite: false,
  });
  const colMat = new THREE.ShaderMaterial({ uniforms: mistMat.uniforms, vertexShader: mistMat.vertexShader, fragmentShader: mistMat.fragmentShader, defines: { COLUMN: 1 }, depthTest: false, depthWrite: false });
  const mistBlurMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2(1, 1) }, uDir: { value: new THREE.Vector2(1, 0) } }, vertexShader: FS_VERT,
    fragmentShader: `uniform sampler2D tSrc; uniform vec2 uTexel, uDir; varying vec2 vUv;
      void main(){ vec2 d = uDir * uTexel;
        gl_FragColor = texture2D(tSrc, vUv) * .3 + (texture2D(tSrc, vUv + d) + texture2D(tSrc, vUv - d)) * .24 + (texture2D(tSrc, vUv + 2. * d) + texture2D(tSrc, vUv - 2. * d)) * .11; }`,
    depthTest: false, depthWrite: false,
  });
  const mistCompMat = new THREE.ShaderMaterial({
    uniforms: { tMist: { value: rtMist.texture }, uTexel: { value: new THREE.Vector2(1, 1) } }, vertexShader: FS_VERT,
    fragmentShader: `uniform sampler2D tMist; uniform vec2 uTexel; varying vec2 vUv;
      void main(){   // a tent filter over the low-resolution march: no blocks at its edges
        vec2 h = uTexel * .75;
        gl_FragColor = (texture2D(tMist, vUv + vec2(-h.x, -h.y)) + texture2D(tMist, vUv + vec2(h.x, -h.y)) + texture2D(tMist, vUv + vec2(-h.x, h.y)) + texture2D(tMist, vUv + h)) * .25;
      }`,
    transparent: true, depthTest: false, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
  });
  const colCompMat = new THREE.ShaderMaterial({ uniforms: { tMist: { value: rtCol.texture }, uTexel: { value: new THREE.Vector2(1, 1) } }, vertexShader: mistCompMat.vertexShader, fragmentShader: mistCompMat.fragmentShader,
    transparent: true, depthTest: false, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor });

  // ---------------------------------------------------------------- bloom and composite
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
    uniforms: { tSrc: { value: null }, uHalf: { value: new THREE.Vector2() } }, vertexShader: FS_VERT,
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
    uniforms: { tSrc: { value: null }, tSkip: { value: null }, uHalf: { value: new THREE.Vector2() } }, vertexShader: FS_VERT,
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
      uAspect: { value: 1 }, uBloom: { value: 0.26 }, uBloomTint: { value: new V3(0.6, 0.74, 1.0) }, uExposure: { value: 1 },
      uShake: { value: new THREE.Vector2() }, uZoom: { value: 1 }, uFisheye: { value: 0 },
      uFrame: { value: 0 }, uFrameFull: { value: 0 }, uNegRadius: { value: 0.42 }, uCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uFlash: { value: 0 }, uDim: { value: 0 }, uTime: { value: 0 }, uGrain: { value: 0.016 }, uVignette: { value: 0.85 }, uSeed: { value: 0 },
    },
    vertexShader: FS_VERT,
    fragmentShader: /* glsl */`
      uniform sampler2D tColor, tDistort, tBloom;
      uniform vec3 uBloomTint;
      uniform float uAspect, uBloom, uExposure, uZoom, uFisheye, uFrame, uFrameFull, uNegRadius, uFlash, uDim, uTime, uGrain, uVignette, uSeed;
      uniform vec2 uShake, uCenter;
      varying vec2 vUv;
      vec3 aces(vec3 x){ return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
      vec3 srgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(.0031308, c)); }
      void main(){
        vec2 p = vUv - .5; p.x *= uAspect;
        float r2 = dot(p, p);
        p *= (1. + uFisheye * r2 * 1.8) / (1. + uFisheye * .45);
        p = p / uZoom + uShake;
        vec2 uv = vec2(p.x / uAspect, p.y) + .5;
        vec2 d = texture2D(tDistort, uv).xy; d.x /= uAspect;
        vec3 col = texture2D(tColor, uv + d).rgb;
        col += texture2D(tBloom, uv + d).rgb * uBloom * uBloomTint;     // ice light scatters cyan
        col = aces(col * uExposure);
        if (uFrame > 0.) {
          float l = dot(col, vec3(.2126, .7152, .0722));
          float ink = smoothstep(.2, .28, l);
          vec2 q = vUv - uCenter; q.x *= uAspect;
          float qr = length(q), qa = atan(q.y, q.x);
          float spikes = .5 * sin(qa * 7. + uSeed) + .3 * sin(qa * 13. + uSeed * 1.7) + .2 * sin(qa * 29. + uSeed * 2.3);
          float Rn = uNegRadius * (1. + .38 * spikes + .05 * sin(qa * 61. + uSeed * 3.1) + .03 * sin(qa * 113. + uSeed * .7));
          float m = uFrameFull > .5 ? 1. : 1. - smoothstep(Rn * .94, Rn, qr);
          float uu = (qa + 3.14159) / 6.28318 * 140.;
          float hsh = fract(sin(floor(uu) * 12.9898 + uSeed * 78.233) * 43758.5453);
          float reach = smoothstep(uNegRadius * (.3 + .5 * hsh), uNegRadius * 1.6, qr);
          float wdt = (.06 + .28 * hsh) * (.3 + .7 * reach);
          float ray = step(.45, hsh) * (1. - smoothstep(wdt * .5, wdt, abs(fract(uu) - .5)));
          float brk = 1. - step(.86, fract(sin(floor(qr / uNegRadius * 3.5 + hsh * 7.) * 91.7 + floor(uu) * 3.3) * 4375.85)) * step(.5, hsh);
          float uu2 = (qa + 3.14159) / 6.28318 * 360., h2 = fract(sin(floor(uu2) * 7.13 + uSeed * 3.1) * 43758.5453);
          float ray2 = step(.72, h2) * (1. - smoothstep(.05, .12, abs(fract(uu2) - .5))) * smoothstep(uNegRadius * (.9 + .6 * h2), uNegRadius * 2.1, qr);
          ink = max(ink, max(ray * reach * brk, ray2 * .7));
          float paper = fract(sin(dot(floor(vUv * vec2(960., 540.)), vec2(12.9898, 78.233)) + uSeed) * 43758.5453);
          vec3 neg = mix(vec3(.9, .96, 1.) * (.965 + .035 * paper), vec3(.01, .016, .028), ink);      // ink on pale ice-blue paper
          col = mix(col, mix(col * .3, neg, m), uFrame);
        }
        col = mix(col, vec3(.93, .97, 1.), uFlash);
        col *= 1. - uDim;
        vec2 vq = vUv - .5; col *= 1. - uVignette * dot(vq, vq) * 1.6;
        col = srgb(clamp(col, 0., 1.));
        float g = fract(sin(dot(vUv * vec2(1931., 1087.) + floor(uTime * 24.) * vec2(17., 31.), vec2(12.9898, 78.233))) * 43758.5453);
        float iceMask = 1. - step(.5, texture2D(tColor, uv + d).a);
        gl_FragColor = vec4(col + (g - .5) * uGrain, iceMask);
      }`,
    depthTest: false, depthWrite: false,
  });

  // FXAA on the ice's edges only (its alpha marks the ice): the traced facets have no MSAA on the HalfFloat target,
  // and running it everywhere would soften the frost hairlines and the glitter
  const fxaaMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: rtLDR.texture }, uPx: { value: new THREE.Vector2(1, 1) } },
    vertexShader: FS_VERT,
    fragmentShader: /* glsl */`
      uniform sampler2D tSrc; uniform vec2 uPx; varying vec2 vUv;
      float lu(vec3 c){ return dot(c, vec3(.299, .587, .114)); }
      void main(){
        vec4 M = texture2D(tSrc, vUv);
        vec4 NW = texture2D(tSrc, vUv + vec2(-1., -1.) * uPx), NE = texture2D(tSrc, vUv + vec2(1., -1.) * uPx);
        vec4 SW = texture2D(tSrc, vUv + vec2(-1., 1.) * uPx), SE = texture2D(tSrc, vUv + vec2(1., 1.) * uPx);
        float ice = max(max(M.a, NW.a), max(max(NE.a, SW.a), SE.a));
        if (ice < .5) { gl_FragColor = vec4(M.rgb, 1.); return; }
        float lM = lu(M.rgb), lNW = lu(NW.rgb), lNE = lu(NE.rgb), lSW = lu(SW.rgb), lSE = lu(SE.rgb);
        float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE))), lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
        vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE));
        float red = max((lNW + lNE + lSW + lSE) * .03125, 1. / 128.);
        float rcp = 1. / (min(abs(dir.x), abs(dir.y)) + red);
        dir = clamp(dir * rcp, vec2(-8.), vec2(8.)) * uPx;
        vec3 A = .5 * (texture2D(tSrc, vUv + dir * (1. / 3. - .5)).rgb + texture2D(tSrc, vUv + dir * (2. / 3. - .5)).rgb);
        vec3 B = A * .5 + .25 * (texture2D(tSrc, vUv - dir * .5).rgb + texture2D(tSrc, vUv + dir * .5).rgb);
        float lB = lu(B);
        gl_FragColor = vec4((lB < lMin || lB > lMax) ? A : B, 1.);
      }`,
    depthTest: false, depthWrite: false,
  });

  // ---------------------------------------------------------------- impact frames
  const imp = { active: false, t: 0, frame: 'none', flash: 0, shake: 0, mode: 'axial', dir: new THREE.Vector2(0, 1), fisheye: 0, dim: 0, at: new V3() };
  const flashLog = [];
  function impact({ hold = 0.1, frame = 'center', flash = 0, shake = 0.012, shakeMode = 'axial', shakeDir = null, fisheye = 0, at = null } = {}) {
    const now = clock.real;
    while (flashLog.length && now - flashLog[0] > 1) flashLog.shift();
    const inverts = frame !== 'none' || flash > 0;
    const safe = options.flashes === 'safe' || (inverts && flashLog.length >= 3);   // never more than 3 flashes a second
    if (inverts && !safe) flashLog.push(now);
    imp.active = true; imp.t = 0;
    compositeMat.uniforms.uSeed.value = rnd() * 100;
    imp.frame = safe ? 'none' : frame; imp.flash = safe ? 0 : flash; imp.dim = safe && inverts ? 0.32 : 0;
    imp.shake = shake * options.shake; imp.mode = shakeMode; imp.fisheye = fisheye * options.fisheye;
    if (shakeDir) imp.dir.copy(shakeDir).normalize(); else imp.dir.set(0, 1);
    if (at) imp.at.copy(at);
    clock.hold = Math.max(clock.hold, hold);
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
          const s = -imp.shake * Math.exp(-7 * t) * Math.cos(2 * Math.PI * 5.5 * t);
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
    U.uZoom.value = zoom * (1 + Math.hypot(shakeX, shakeY) * 2.2);
    U.uFisheye.value = fish; U.uFrame.value = frame; U.uFrameFull.value = imp.frame === 'full' ? 1 : 0;
    U.uFlash.value = flash; U.uDim.value = dim; U.uTime.value = clock.real;
  }

  // ---------------------------------------------------------------- tip glints: the points of the tallest spikes catch the moon
  const tipG = { n: 0, pos: new Float32Array(32 * 3), I: new Float32Array(32) };
  const tgGeo = new THREE.InstancedBufferGeometry();
  { const q = new THREE.PlaneGeometry(1, 1); tgGeo.index = q.index; tgGeo.setAttribute('position', q.getAttribute('position')); }
  tgGeo.setAttribute('iP', new THREE.InstancedBufferAttribute(tipG.pos, 3).setUsage(THREE.DynamicDrawUsage));
  tgGeo.setAttribute('iI', new THREE.InstancedBufferAttribute(tipG.I, 1).setUsage(THREE.DynamicDrawUsage));
  tgGeo.instanceCount = 0;
  const tgMat = new THREE.ShaderMaterial({
    uniforms: { uResolution: uniforms.uResolution, uDpr: uniforms.uDpr },
    vertexShader: /* glsl */`
      attribute vec3 iP; attribute float iI; uniform vec2 uResolution; uniform float uDpr; varying vec2 vQ; varying float vI;
      void main(){ vec4 c = projectionMatrix * viewMatrix * vec4(iP, 1.); c.xy += position.xy * 2. * 16. * uDpr / uResolution * c.w; vQ = position.xy * 2.; vI = iI; gl_Position = c; }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ; varying float vI;
      void main(){
        float r = length(vQ);
        float core = exp(-r * r * 90.), halo = exp(-r * r * 10.) * (1. - smoothstep(.6, 1., r));
        float rays = (exp(-abs(vQ.x) * 40.) * exp(-abs(vQ.y) * 4.) + exp(-abs(vQ.y) * 40.) * exp(-abs(vQ.x) * 4.)) * .25;
        gl_FragColor = vec4((vec3(.9, .95, 1.) * (core * 3. + rays) + vec3(.35, .55, 1.) * halo * .35) * vI, 1.);
      }`,
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  });
  const tgMesh = layer(new THREE.Mesh(tgGeo, tgMat), LAYERS.fx); tgMesh.renderOrder = 33;
  group.add(tgMesh);
  const _apex = new V3();
  function updateTipGlints() {
    let n = 0;
    for (const S of spikes) {
      if (!S.mesh.visible || S.shattered || S.height < 0.9 || n >= 32) continue;
      if (S.apexLocal === undefined) { let best = null; const pos = S.mesh.geometry.getAttribute('position'); for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (!best || y > best.y) best = new V3(pos.getX(i), y, pos.getZ(i)); } S.apexLocal = best; }
      _apex.copy(S.apexLocal).applyMatrix4(S.mesh.matrixWorld);
      if (_apex.y < 0.05) continue;
      tipG.pos.set([_apex.x, _apex.y, _apex.z], n * 3);
      tipG.I[n] = 0;
      n++;
    }
    tgGeo.instanceCount = n;
    tgGeo.getAttribute('iP').needsUpdate = true; tgGeo.getAttribute('iI').needsUpdate = true;
  }

  // ---------------------------------------------------------------- per-frame spike state
  const _sp = new V3();
  function updateSpikes(dt, spikeT) {
    for (const S of spikes) {
      const u = S.mat.uniforms;
      if (S.shattered) continue;
      const age = spikeT - S.erupt;
      if (age < 0 || spikeT < 0) { S.mesh.visible = false; S.state = 'hidden'; continue; }
      S.mesh.visible = true;
      const x = Math.min(1, age / S.rise);
      const e = 1 - Math.pow(1 - x, 3.2);
      spikePose(S, e);
      S.state = x < 1 ? 'rising' : 'standing';
      // the inner light: a burst as it breaks the surface, settling to a steady glow
      const g = 0.24 + 1.4 * Math.exp(-age * 3.5) + 0.65 * S.lightBoost;
      u.uGlow.value = g * S.glowK;
      for (let k = 0; k < 4; k++) {
        if (S.crackT[k] < -50) continue;
        if (dt > 0 && S.crackT[k] > -60) S.crackT[k] += dt;
        const c = Math.max(0, S.crackT[k]) / S.crackDur[k];
        const r = S.crackT[k] < 0 ? 0 : S.cracks[k].reach * Math.pow(Math.min(1, c), 0.7);
        const B = u.uCrB.value[k]; B.w = r;
        u.uCrFront.value.setComponent(k, S.crackT[k] < 0 ? 0 : 1 - Math.min(1, c));
      }
      updateIceUniforms(S.mesh);
      const lit = lightAt(S.base.x, S.height * 0.4, S.base.z, _sp);
      u.uCrackCol.value.set(0.35 + lit.x * 0.6, 0.45 + lit.y * 0.6, 0.6 + lit.z * 0.6).multiplyScalar(0.55);
    }
    for (const Fr of frags) {
      const u = Fr.mat.uniforms;
      u.uGlow.value = Fr.glow0 * Math.exp(-Fr.age * 0.55) * Fr.fade + 0.12 * Fr.fade;
      // melting away: the piece settles down into the snow, which clips it, instead of darkening
      const sinkTo = (1 - Fr.fade) * (Fr.rad * 2.4 + 0.02);
      Fr.mesh.position.y += (Fr.baseY === undefined ? 0 : Fr.baseY - sinkTo - Fr.mesh.position.y);
      if (Fr.rest && Fr.baseY === undefined) Fr.baseY = Fr.mesh.position.y;
      u.uFade.value = Fr.baseY === undefined ? Fr.fade : 1;
      Fr.mesh.visible = Fr.fade > 0.01;
      updateIceUniforms(Fr.mesh);
      u.uCrackCol.value.set(0.25, 0.32, 0.4);
    }
  }
  function resetIce(keepFrags = false) {
    if (!keepFrags) clearFrags();
    for (const S of spikes) { S.shattered = false; S.state = 'hidden'; S.mesh.visible = false; S.crackT = [-99, -99, -99, -99]; for (let k = 0; k < 4; k++) S.mat.uniforms.uCrB.value[k].w = 0; S.mat.uniforms.uCrFront.value.set(0, 0, 0, 0); S.lightBoost = 0; }
  }

  // ---------------------------------------------------------------- size, update, render
  let W = 1, H = 1, pendingDt = 0;
  function setSize(width, height, pixelRatio = 1) {
    W = Math.max(1, Math.round(width)); H = Math.max(1, Math.round(height)); dpr = pixelRatio;
    res.set(W, H); uniforms.uDpr.value = dpr;
    rtColor.setSize(W, H);
    rtScene.setSize(W, H);
    const hw = Math.ceil(W / 2), hh = Math.ceil(H / 2);
    const mw = Math.ceil(W / 3), mh = Math.ceil(H / 3);   // the mist is soft: a third of the resolution holds it
    rtMist.setSize(mw, mh); rtMist2.setSize(mw, mh); mistBlurMat.uniforms.uTexel.value.set(1 / mw, 1 / mh); rtDistort.setSize(hw, hh); rtLDR.setSize(W, H); rtCol.setSize(hw, hh); colCompMat.uniforms.uTexel.value.set(1 / hw, 1 / hh); fxaaMat.uniforms.uPx.value.set(1 / W, 1 / H); mistCompMat.uniforms.uTexel.value.set(1 / mw, 1 / mh);
    mistMat.uniforms.uRes.value.set(mw, mh);
    let w = hw, h = hh;
    for (let i = 0; i < BLOOM_LEVELS; i++) { down[i].setSize(w, h); up[i].setSize(w, h); w = Math.max(1, Math.ceil(w / 2)); h = Math.max(1, Math.ceil(h / 2)); }
    compositeMat.uniforms.uAspect.value = W / H;
  }

  const state = { spikeT: -1 };
  function update(realDt) {
    realDt = Math.min(Math.max(realDt, 0), 0.1);
    clock.real += realDt;
    if (clock.rampT < 1) {
      clock.rampT = Math.min(1, clock.rampT + realDt / clock.rampDur);
      const e = clock.rampT * clock.rampT * (3 - 2 * clock.rampT);
      clock.rampValue = clock.rampFrom + (clock.rampTo - clock.rampFrom) * e;
    }
    let simDt;
    if (clock.hold > 0) { clock.hold = Math.max(0, clock.hold - realDt); simDt = 0; }
    else simDt = realDt * clock.base * clock.rampValue;
    clock.sim += simDt; pendingDt += simDt;
    uniforms.uTime.value = clock.sim;
    updateLights(simDt);
    updateRings(simDt);
    updateImpact(realDt);
    return simDt;
  }

  function render() {
    const dt = pendingDt; pendingDt = 0;
    updateFrags(dt);
    updateChunks(dt);
    updateMotes(dt);
    updateWisps(dt);
    updateStreamers(dt);
    updateSpikes(dt, state.spikeT);
    updateTipGlints();
    updateHubClumps();
    // frost and obstacle clocks
    frost.uniforms.uFrostT.value = frost.t; frost.uniforms.uFrostFade.value = frost.fade; frost.uniforms.uFrostGlow.value = frost.glow;
    obst.uniforms.uObstT.value = state.spikeT;
    if (bloom.group.visible) { bloom.mat.uniforms.uT.value = bloom.t; bloom.mat.uniforms.uFade.value = bloom.fade; }
    // mist uniforms
    const MU = mistMat.uniforms;
    updateBanks(dt);
    MU.uAmt.value = mist.amount; MU.uH.value = mist.height; MU.uOrigin.value.copy(mist.origin); MU.uFlow.value = mist.flowSpeed;
    mist.phase += dt / 4.5; MU.uPhase.value = mist.phase;
    const Vx = wind.vortex;
    MU.uVortex.value.set(Vx.center.x, Vx.center.z, 1.8, Vx.swirl * Vx.on * 0.42);   // the bank turns about a radian a second at the core: a visible turn, not a churn
    MU.uVort.value.set(Vx.inflow * Vx.on * 0.5, Vx.on * 0.5, 0);
    MU.uCol1.value.set(Vx.lean.x, Vx.lean.z, Vx.height, Vx.radius); MU.uColS.value.set(Vx.sDir.x * Vx.sAmp, Vx.sDir.z * Vx.sAmp); MU.uCol2.value.set(Vx.on * Vx.veil, 1.6, 1.2, Vx.phase || 0);
    {
      const order = [...Array(NL).keys()].sort((x, y) => (lightCol[y].x + lightCol[y].y + lightCol[y].z) - (lightCol[x].x + lightCol[x].y + lightCol[x].z));
      for (let k = 0; k < 4; k++) { mistLightPos[k].copy(lightPos[order[k]]); mistLightCol[k].copy(lightCol[order[k]]); }
    }
    camera.updateMatrixWorld();
    MU.uInvProj.value.copy(camera.projectionMatrixInverse); MU.uCamMat.value.copy(camera.matrixWorld); MU.uCamPos.value.copy(camera.position);

    const prevTarget = renderer.getRenderTarget();
    const prevMask = camera.layers.mask;
    const ac = renderer.autoClear; renderer.autoClear = false;
    renderer.getClearColor(_col); const prevAlpha = renderer.getClearAlpha();
    // 1. the world
    renderer.setRenderTarget(rtColor); renderer.clear(true, true, true);
    camera.layers.set(LAYERS.world); renderer.render(scene, camera);
    // 2. a copy with mipmaps for the ice to look through (rough frost reads a blurrier level)
    copyMat.uniforms.tSrc.value = rtColor.texture; pass(copyMat, rtScene);
    if (fx.debug === 'mist') { renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(true, false, false); renderer.setClearColor(_col, prevAlpha); }   // debug: the mist alone, over black
    // 3. the ice, traced against that copy
    renderer.setRenderTarget(rtColor);
    if (fx.debug !== 'mist') { camera.layers.set(LAYERS.ice); renderer.render(scene, camera); }
    // 4. the mist, marched against the depth, laid over
    if (mist.amount > 0.001 || mist.banks.length) {
      pass(mistMat, rtMist);
      // a small separable blur: the march's jitter grain goes, the wisps stay
      mistBlurMat.uniforms.tSrc.value = rtMist.texture; mistBlurMat.uniforms.uDir.value.set(1, 0); pass(mistBlurMat, rtMist2);
      mistBlurMat.uniforms.tSrc.value = rtMist2.texture; mistBlurMat.uniforms.uDir.value.set(0, 1); pass(mistBlurMat, rtMist);
      fsMesh.material = mistCompMat; renderer.setRenderTarget(rtColor); renderer.render(fsScene, fsCam);
    }
    if (wind.vortex.on * wind.vortex.veil > 0.005) {
      pass(colMat, rtCol);
      fsMesh.material = colCompMat; renderer.setRenderTarget(rtColor); renderer.render(fsScene, fsCam);
    }
    // 5. light effects
    renderer.setRenderTarget(rtColor);
    if (fx.debug !== 'mist') { camera.layers.set(LAYERS.fx); renderer.render(scene, camera); }
    // 6. refraction
    renderer.setClearColor(0x000000, 0); renderer.setRenderTarget(rtDistort); renderer.clear(true, false, false);
    camera.layers.set(LAYERS.distort); renderer.render(scene, camera);
    renderer.setClearColor(_col, prevAlpha);
    camera.layers.mask = prevMask;
    // 7. bloom and composite
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
    pass(compositeMat, rtLDR);
    pass(fxaaMat, prevTarget);
    renderer.autoClear = ac;
  }

  function warmup() {
    const hidden = [];
    group.traverse((o) => { if ((o.isMesh || o.isInstancedMesh) && !o.visible) { hidden.push(o); o.visible = true; } });
    const prev = renderer.getRenderTarget(), mask = camera.layers.mask;
    renderer.setRenderTarget(rtColor);
    camera.layers.enableAll();
    renderer.compile(scene, camera);
    for (const m of [copyMat, mistMat, mistBlurMat, colMat, colCompMat, mistCompMat, prefilterMat, downMat, upMat, compositeMat]) { fsMesh.material = m; renderer.compile(fsScene, fsCam); }
    renderer.setRenderTarget(null); fsMesh.material = fxaaMat; renderer.compile(fsScene, fsCam);
    renderer.setRenderTarget(prev); camera.layers.mask = mask;
    for (const o of hidden) o.visible = false;
  }

  const fx = {
    options, palette, group, lightUniforms, uniforms, frost, obst, mist, wind, bloom, spikes, frags, state, LAYERS,
    post: compositeMat.uniforms, iceShared,
    get time() { return clock.sim; }, get realTime() { return clock.real; }, get holding() { return clock.hold > 0; },
    get timeScale() { return clock.base; }, set timeScale(v) { clock.base = v; },
    get rampValue() { return clock.rampValue; },
    setLight, flashLight, lights, lightAt, windAt,
    growFrostField, stemTip, spineAt, buildObstacles,
    createSpike, crackSpike, shatterSpike, resetIce, clearFrags,
    setBanks, spawnChunks, spawnMote, spawnWisp, spawnStreamer, coreAt, vortexAxis, ring, impact, ramp,
    update, render, setSize, warmup,
    stats: () => ({ motes: mGeo.instanceCount, wisps: wGeo.instanceCount, frags: frags.length, chunks: chunks.filter((c) => c.alive).length, frostSegs: frost.data ? frost.data.count : 0 }),
  };
  return fx;
}
