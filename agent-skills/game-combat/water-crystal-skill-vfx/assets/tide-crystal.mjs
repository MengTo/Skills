// Water and crystal skill VFX: water gathered into a living orb, a lashing stream that splashes,
// ray-traced crystals that erupt where it lands, resonate and shatter into shards with real
// contact, droplets with motion streaks, ripples and caustics on wet stone, all through one
// effect clock and one composite (HalfFloat colour, refraction copy, half-resolution distortion,
// dual-Kawase bloom with a high threshold, ACES once, sRGB, grain, vignette, impact frames).
//
// Pass in your own THREE (r160+). Nothing else is imported.
//
//   const fx = createTideCrystal(THREE, { renderer, scene, camera });
//   fx.setSize(width * dpr, height * dpr, dpr);
//   frame: const simDt = fx.update(realDt); ...drive orb, tubes, crystals...; fx.render();
//
// Layers: 0 world (sky, ground), 1 distortion, 2 seen in the wet-ground mirror, 3 refracting
// solids (crystals, shards), 4 water bodies (orb, streams, crowns), 5 particles.

export const L_DISTORT = 1;
export const L_MIRROR = 2;
export const L_SOLID = 3;
export const L_WATER = 4;
export const L_PART = 5;

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
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 hash32(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yxz + 33.33); return fract((p3.xxy + p3.yzz) * p3.zyx); }
`;

// Periodic Perlin, used once at start-up to bake a tiling 96³ noise texture (four channels).
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

// The baked noise: four independent channels tiling every 6 units, 16 texels a cell.
export const TNOISE_GLSL = /* glsl */`
uniform sampler3D tNoise;
vec4 tn(vec3 p){ return texture(tNoise, p * (1. / 6.)) * 2. - 1.; }
`;

// The moonlit night every glossy surface reflects: a deep teal sky, a small moon with a tight
// aureole, and below the horizon the dark wet flats.
export const ENV_GLSL = /* glsl */`
uniform vec3 uMoonDir, uMoonCol, uSkyZen, uSkyHor;
// the sky without the moon's tight aureole: a navy-to-slate gradient and the low glow along the
// horizon under the moon (what a calm sea or wet glass mostly reflects at night)
vec3 skyBase(vec3 d){
  vec3 c = mix(uSkyHor, uSkyZen, smoothstep(-.03, .55, d.y));
  float m = max(dot(d, uMoonDir), 0.);
  vec2 hz = normalize(d.xz + 1e-5), mz = normalize(uMoonDir.xz);
  // the moonlit haze: a forward-scattering lobe that brightens the lowest sky toward the moon
  c += uMoonCol * (pow(m, 14.) * .0014 + (pow(max(dot(hz, mz), 0.), 2.) * .0068 + .0012) * exp(-abs(d.y) * 9.));
  return c;
}
vec3 skyCol(vec3 d){
  float m = max(dot(d, uMoonDir), 0.);
  return skyBase(d) + uMoonCol * vec3(1., .98, .95) * (pow(m, 4000.) * .03 + pow(m, 500.) * .0032);   // a halo about one radius wide
}
vec3 moonDisc(vec3 d, float blur){
  float x = max(1. - dot(d, uMoonDir), 0.), a = sqrt(2. * x);
  float r0 = .0135, r = r0 + blur;
  return uMoonCol * vec3(1., .97, .92) * 4. * smoothstep(r + .0006 + blur * .6, r - .0006, a) * (r0 * r0) / (r * r);   // a crisp, faintly warm disc
}
// a broken layer of stratocumulus: dark clumps against the navy, their edges silvered by the moon,
// thinning toward the horizon. Projected onto a high plane, it evolves slowly in place.
vec3 skyClouds(vec3 d){
  if (d.y < .004) return vec3(0.);
  vec2 q = d.xz / (d.y + .08);                                         // a high flat deck: patches squash toward the horizon
  vec4 w = tn(vec3(q * 2.4, 2.1));
  vec2 qw = q * 8. + w.xy * 1.1;
  // a soft broken deck: patches with fuzzy edges and gaps, spread over the whole sky
  float c = tn(vec3(qw, 4.7)).x * .62 + tn(vec3(qw * 2.3 + 3.1, 8.1)).y * .26 + tn(vec3(qw * 5.1, 1.9)).z * .12;
  float cov = smoothstep(.02, .2, c) * smoothstep(.0, .08, d.y);
  float m = max(dot(d, uMoonDir), 0.);
  // dim grey-blue patches, silvered toward the moon (thin edges brightest), a shade darker than the sky elsewhere
  float edge = 1. - smoothstep(.02, .3, c);
  float lit = .0002 + pow(m, 5.) * .0012 + pow(m, 30.) * .004 + pow(m, 200.) * .01;
  return uMoonCol * cov * lit * (.7 + edge * .8) + vec3(.0003, .00045, .0006) * cov;
}
vec3 nightEnv(vec3 d, float rough){
  vec3 c = skyCol(d) + moonDisc(d, rough * .12) + skyClouds(d) * (1. - rough);
  float g = smoothstep(.015, -.05, d.y);
  // below the horizon: the dark flats, and the moon's glitter column on the pools under it
  vec2 hz = normalize(d.xz + 1e-5), mz = normalize(uMoonDir.xz);
  float col_ = pow(max(dot(hz, mz), 0.), 90.) * exp(min(d.y, 0.) * 5.) * smoothstep(.01, -.03, d.y);
  vec3 flats = uSkyHor * .32 * exp(d.y * 7.) + vec3(.0007, .0008, .001) + uMoonCol * col_ * .09;
  return mix(c, flats, g);
}
`;

// Eight point lights the water and the crystals throw onto the world (orb, splash, three crystal
// clusters, shatter, stream, spare). Add LIGHTS_GLSL, spread fx.lightUniforms, add energyLight().
export const LIGHTS_GLSL = /* glsl */`
uniform vec3 uLightPos[8];
uniform vec3 uLightCol[8];
vec3 energyLight(vec3 P, vec3 N, vec3 V, vec3 albedo, float rough){
  vec3 acc = vec3(0.);
  float F = .04 + .96 * pow(1. - max(dot(N, V), 0.), 5.);
  float sh = mix(220., 10., rough);
  for (int i = 0; i < 8; i++) {
    vec3 c = uLightCol[i]; if (c.r + c.g + c.b < 1e-4) continue;
    vec3 L = uLightPos[i] - P; float d2 = max(dot(L, L), 1e-4); L *= inversesqrt(d2);
    float ndl = max(dot(N, L), 0.);
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.), sh) * (1. - rough) * (1.2 + 9. * F) * (sh * .02 + .4);
    acc += c * ndl * (albedo / (1. + d2 * 2.4) + spec / (1. + d2 * .5));
  }
  return acc;
}
// diffuse irradiance and the glossy term apart, so a surface can light several layers from one loop
void energySplit(vec3 P, vec3 N, vec3 V, float rough, out vec3 dif, out vec3 spc, out vec3 flat_){
  dif = vec3(0.); spc = vec3(0.); flat_ = vec3(0.);
  float F = .04 + .96 * pow(1. - max(dot(N, V), 0.), 5.);
  float sh = mix(220., 10., rough);
  for (int i = 0; i < 8; i++) {
    vec3 c = uLightCol[i]; if (c.r + c.g + c.b < 1e-4) continue;
    vec3 L = uLightPos[i] - P; float d2 = max(dot(L, L), 1e-4); L *= inversesqrt(d2);
    float ndl = max(dot(N, L), 0.);
    vec3 H = normalize(L + V);
    float att = 1. / (1. + d2 * 2.4);
    dif += c * ndl * att; flat_ += c * max(L.y, 0.) * att;
    spc += c * ndl * pow(max(dot(N, H), 0.), sh) * (1. - rough) * (1.2 + 9. * F) * (sh * .02 + .4) / (1. + d2 * .5);
  }
}
vec3 flatLight(vec3 P){
  vec3 dif = vec3(0.);
  for (int i = 0; i < 8; i++) { vec3 c = uLightCol[i]; if (c.r + c.g + c.b < 1e-4) continue; vec3 L = uLightPos[i] - P; float d2 = max(dot(L, L), 1e-4); dif += c * max(L.y, 0.) * inversesqrt(d2) / (1. + d2 * 2.4); }
  return dif;
}
// the lights seen in a glossy surface or out through a crystal face: soft discs, not points
// two lobes at once (a soft sheen and a crisp core) from one pass over the lights
vec3 lightGlint2(vec3 P, vec3 R, float s1, float k1, float s2, float k2){
  vec3 acc = vec3(0.);
  for (int i = 0; i < 8; i++) {
    vec3 c = uLightCol[i]; if (c.r + c.g + c.b < 1e-4) continue;
    vec3 L = uLightPos[i] - P; float d2 = max(dot(L, L), 1e-4); L *= inversesqrt(d2);
    float x = max(dot(R, L), 0.);
    acc += c * (pow(x, s1) * k1 + pow(x, s2) * k2) / (1. + d2 * .7);
  }
  return acc;
}
vec3 lightGlint(vec3 P, vec3 R, float sharp){
  vec3 acc = vec3(0.);
  for (int i = 0; i < 8; i++) {
    vec3 c = uLightCol[i]; if (c.r + c.g + c.b < 1e-4) continue;
    vec3 L = uLightPos[i] - P; float d2 = max(dot(L, L), 1e-4); L *= inversesqrt(d2);
    acc += c * pow(max(dot(R, L), 0.), sharp) / (1. + d2 * .7);
  }
  return acc;
}
`;

// Rings on the wet ground: up to 24 analytic ripple packets (a leading crest with smaller ones
// trailing, widening as they travel), plus a dense rain field from a 3x3 cell search.
export const RIPPLE_GLSL = /* glsl */`
uniform vec4 uRipA[24];   // x, z, age (s), peak slope
uniform vec4 uRipB[24];   // speed (m/s), wavelength (m), decay (1/s), packet width (m)
uniform float uRain, uTime;
vec3 ripplePacket(vec2 d, float age, float S, vec4 B){
  float r = length(d) + 1e-4;
  float front = B.x * age, x = r - front;
  float w = B.w * (1. + age * 1.6);
  if (x > w * 3. || x < -w * 9.) return vec3(0.);
  float env = x > 0. ? exp(-x * x / (w * w)) : exp(-x * x / (w * w * 9.));
  float lam = B.y * (1. + age * .5);
  float k = 6.2832 / lam;
  float amp = S * exp(-age * B.z) * smoothstep(0., .07, age) / (1. + r * .9);
  float s = amp * env * cos(k * x);
  return vec3(d / r * s, amp * env * sin(k * x) / k);
}
vec3 ripples(vec2 p){
  vec3 acc = vec3(0.);
  for (int i = 0; i < 24; i++) {
    vec4 A = uRipA[i]; if (A.w <= 0.) continue;
    acc += ripplePacket(p - A.xy, A.z, A.w, uRipB[i]);
  }
  return acc;
}
vec3 rainRipples(vec2 p){
  if (uRain <= .001) return vec3(0.);
  const float CELL = .26;
  vec2 g = p / CELL, i0 = floor(g);
  vec3 acc = vec3(0.);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 c = i0 + vec2(float(x), float(y));
    vec3 h = hash32(c);
    float per = .75 + h.z * .5, tt = uTime / per + h.z * 7.13, cyc = floor(tt);
    float age = fract(tt) * per;
    float on = step(hash12(c + cyc * 1.37), uRain);
    if (on < .5) continue;
    vec2 dp = (c + .15 + .7 * hash32(c + cyc * 3.1).xy) * CELL;
    acc += ripplePacket(p - dp, age, .2 + .1 * h.x, vec4(.24, .021, 2.6, .011));
  }
  return acc;
}
`;

// Caustics: the light folded by a moving water surface, as 1/|det J| of the refracted map through
// a sum of travelling waves (bright folds where the surface focuses light). It evolves in place.
export const CAUSTIC_GLSL = /* glsl */`
float caustic(vec2 p, float t, float s){
  p += .07 * vec2(sin(p.y * 3.1 + t * .31), sin(p.x * 2.7 - t * .27));   // break the lattice
  float hxx = 0., hxz = 0., hzz = 0.;
  // seven waves: direction, wavenumber (rad/m) and speed chosen to never line up
  vec3 W[7];
  W[0] = vec3(.951, .309, 41.); W[1] = vec3(-.309, .951, 47.); W[2] = vec3(-.809, -.588, 37.);
  W[3] = vec3(.588, -.809, 53.); W[4] = vec3(.122, .993, 61.); W[5] = vec3(-.966, .259, 29.); W[6] = vec3(.707, .707, 71.);
  for (int i = 0; i < 7; i++) {
    vec2 k = W[i].xy * W[i].z;
    float ph = dot(k, p) + t * (1.3 + float(i) * .37) + float(i) * 1.7;
    float a = -cos(ph) / (W[i].z * W[i].z) * (1.2 - float(i) * .08);
    hxx += a * k.x * k.x; hxz += a * k.x * k.y; hzz += a * k.y * k.y;
  }
  float det = (1. + s * hxx) * (1. + s * hzz) - s * s * hxz * hxz;
  return 1. / max(abs(det), .09);
}
`;

const FS_VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------------ convex solids from half-spaces
// Clip a big box by planes n·p <= d (Sutherland-Hodgman per face, the cut ring ordered round its
// centroid becomes a new face). Faces stay wound counter-clockwise seen from outside.
export function clipFaces(V3, faces, n, d, tag) {
  const out = [], cap = [];
  for (const F of faces) {
    const res = [];
    for (let i = 0; i < F.v.length; i++) {
      const a = F.v[i], b = F.v[(i + 1) % F.v.length], da = a.dot(n) - d, db = b.dot(n) - d;
      if (da <= 0) res.push(a);
      if ((da <= 0) !== (db <= 0)) { const p = a.clone().lerp(b, da / (da - db)); res.push(p); cap.push(p); }
    }
    if (res.length >= 3) out.push({ n: F.n, v: res, tag: F.tag });
  }
  if (cap.length >= 3) {
    const pts = [];
    for (const p of cap) if (!pts.some((q) => q.distanceToSquared(p) < 1e-12)) pts.push(p);
    if (pts.length >= 3) {
      const c = pts.reduce((s, p) => s.add(p), new V3()).divideScalar(pts.length);
      const u = new V3().crossVectors(n, Math.abs(n.y) < 0.9 ? new V3(0, 1, 0) : new V3(1, 0, 0)).normalize(), w = new V3().crossVectors(n, u);
      const _a = new V3(), _b = new V3();
      pts.sort((p, q) => Math.atan2(_a.subVectors(p, c).dot(w), _a.dot(u)) - Math.atan2(_b.subVectors(q, c).dot(w), _b.dot(u)));
      out.push({ n: n.clone(), v: pts, tag });
    }
  }
  return out;
}
export function hullFromPlanes(V3, planes, size = 8) {
  let faces = [];
  for (let ax = 0; ax < 3; ax++) for (const sg of [-1, 1]) {
    const n = new V3(); n.setComponent(ax, sg);
    const u = new V3(), w = new V3(); u.setComponent((ax + 1) % 3, 1); w.crossVectors(n, u);
    faces.push({ n, tag: 'box', v: [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => n.clone().add(u.clone().multiplyScalar(a)).add(w.clone().multiplyScalar(b)).multiplyScalar(size)) });
  }
  for (const P of planes) faces = clipFaces(V3, faces, P.n, P.d, P.tag);
  return faces;
}

export function createTideCrystal(THREE, { renderer, scene, camera, seed = 7, moonDir = null } = {}) {
  const V3 = THREE.Vector3;
  const rnd = mulberry32(seed);
  const R = (a = 0, b = 1) => a + (b - a) * rnd();
  const UP = new V3(0, 1, 0), ZAXIS = new V3(0, 0, 1);
  const _a = new V3(), _b = new V3(), _c = new V3(), _d = new V3(), _e = new V3();
  const _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _col = new THREE.Color();

  const palette = {
    water: new THREE.Color(0.10, 0.62, 0.78),      // what lit water reads as: deep teal-cyan
    glow: new THREE.Color(0.10, 0.78, 1.00),       // the skill's own light (linear), saturated so ACES keeps it cyan
    crystal: new THREE.Color(0.55, 0.92, 1.00),    // crystal body tint (Beer-Lambert per metre, as transmittance)
    light: new THREE.Color(0.7, 0.9, 1.00),        // what the water and crystals cast on stone: near-white, a breath of blue
    foam: new THREE.Color(0.80, 0.93, 1.00),
  };
  const options = {
    crystal: 'traced',   // 'traced' | 'flat' (env reflection on a coloured body: the painted-glass failure)
    water: 'living',     // 'living' | 'sliding' (a noise texture turning on a ball: the failure the user named)
    flashes: 'full',     // 'full' | 'safe'
    shake: 1, fisheye: 1,
  };

  const group = new THREE.Group(); group.name = 'tide-crystal';
  scene.add(group);
  const res = new THREE.Vector2(1, 1);
  let dpr = 1;
  const MOON = (moonDir || new V3(0.47, 0.34, -0.81)).clone().normalize();
  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: res },
    uDpr: { value: 1 },
    uMirrorPass: { value: 0 },
    tNoise: { value: null },
    tGrab: { value: null },
    uGrabAspect: { value: 1 },
    uMoonDir: { value: MOON },
    uMoonCol: { value: new V3(0.88, 0.93, 1.0).multiplyScalar(2.8) },   // a near-white moon: the effect owns the cyan
    uSkyZen: { value: new V3(0.0029, 0.0064, 0.0118) },
    uSkyHor: { value: new V3(0.0105, 0.0175, 0.0275) },
  };
  const envUniforms = { uMoonDir: uniforms.uMoonDir, uMoonCol: uniforms.uMoonCol, uSkyZen: uniforms.uSkyZen, uSkyHor: uniforms.uSkyHor };

  // ---------------------------------------------------------------- clock
  const clock = { sim: 0, real: 0, hold: 0, base: 1, tickAcc: 0, rampFrom: 1, rampTo: 1, rampT: 1, rampDur: 0, rampValue: 1 };
  function ramp(to, seconds = 0.4) { clock.rampFrom = clock.rampValue; clock.rampTo = to; clock.rampT = 0; clock.rampDur = Math.max(seconds, 1e-4); }
  const repeats = [];
  function repeat(ticks, fn) { repeats.push({ ticks, fn }); }   // fn runs on each of the next ticks (30 Hz on the effect clock)

  // ---------------------------------------------------------------- energy lights
  const NL = 8;
  const lightPos = Array.from({ length: NL }, () => new V3());
  const lightCol = Array.from({ length: NL }, () => new V3());
  const lightUniforms = { uLightPos: { value: lightPos }, uLightCol: { value: lightCol } };
  const lights = lightPos.map(() => ({ energy: 0, target: 0, decay: 6, held: false, color: palette.light.clone() }));
  // held lights (orb, clusters, stream) ease toward a target each frame; flashes decay
  function setLight(slot, pos, energy, color = null) { const L = lights[slot]; L.held = true; L.target = energy; lightPos[slot].copy(pos); if (color) L.color.copy(color); }
  function flashLight(slot, pos, energy, decay = 6, color = null) {
    const L = lights[slot]; L.held = false;
    if (energy >= L.energy * 0.6) lightPos[slot].copy(pos);
    L.energy = Math.max(L.energy, energy); L.decay = decay; L.color.copy(color || palette.light);
  }

  // ---------------------------------------------------------------- ground spots: ripples, caustics, frost, foam, wet
  const NRIP = 24;
  const ripA = Array.from({ length: NRIP }, () => new THREE.Vector4(0, 0, 0, 0));
  const ripB = Array.from({ length: NRIP }, () => new THREE.Vector4(0.3, 0.04, 1.5, 0.02));
  const rip = Array.from({ length: NRIP }, () => ({ alive: false, age: 0, life: 1, delay: 0 }));
  // slots 0-11 are for hero rings (splashes, crystals, impacts); 12-23 for the drops, so a shower
  // of small rings never steals a splash's
  function ripple(pos, { slope = 0.25, speed = 0.32, wavelength = 0.035, decay = 1.4, width = 0.025, life = 2.4, delay = 0, small = false } = {}) {
    const lo = small ? 12 : 0, hi = small ? NRIP : 12;
    let k = -1;
    for (let i = lo; i < hi; i++) if (!rip[i].alive) { k = i; break; }
    if (k < 0) { for (let i = lo; i < hi; i++) if (k < 0 || rip[i].age / rip[i].life > rip[k].age / rip[k].life) k = i; }
    rip[k].alive = true; rip[k].age = -delay; rip[k].life = life;
    ripA[k].set(pos.x, pos.z, 0, 0); ripA[k].userSlope = slope;
    ripB[k].set(speed, wavelength, decay, width);
  }
  const caus = Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, 1, 0));
  const causCol = Array.from({ length: 6 }, () => new THREE.Vector4(0.2, 0.8, 1, 0));
  const frost = Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 0.3, 0));
  const frostState = frost.map(() => ({ alive: false, age: 0, R: 0.3, grow: 0.5, life: 3 }));
  function addFrost(pos, radius = 0.35, { grow = 0.45, life = 3.2 } = {}) {
    let k = frostState.findIndex((f) => !f.alive); if (k < 0) k = frostState.reduce((o, f, i) => (f.age > frostState[o].age ? i : o), 0);
    Object.assign(frostState[k], { alive: true, age: 0, R: radius, grow, life }); frost[k].set(pos.x, pos.z, 0.001, 0);
  }
  const foam = Array.from({ length: 4 }, () => new THREE.Vector4(0, 0, 0.5, -1));
  const foamState = foam.map(() => ({ alive: false, age: 0, R: 0.5, life: 2.5 }));
  function addFoam(pos, radius = 0.8, life = 2.6) {
    let k = foamState.findIndex((f) => !f.alive); if (k < 0) k = foamState.reduce((o, f, i) => (f.age > foamState[o].age ? i : o), 0);
    Object.assign(foamState[k], { alive: true, age: 0, R: radius, life }); foam[k].set(pos.x, pos.z, radius, 0);
  }
  const wet = Array.from({ length: 4 }, () => new THREE.Vector4(0, 0, 0.5, 0));
  const groundUniforms = {
    uRipA: { value: ripA }, uRipB: { value: ripB }, uRain: { value: 0 }, uTime: uniforms.uTime,
    uCaus: { value: caus }, uCausCol: { value: causCol }, uFrost: { value: frost }, uFoam: { value: foam }, uWet: { value: wet },
  };

  // ---------------------------------------------------------------- render targets (sized in setSize)
  const rtOpts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: true, samples: 0, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
  const rtColor = new THREE.WebGLRenderTarget(1, 1, rtOpts);
  // the refraction copy, full resolution: clear glass shows the pebbles behind it sharp
  const rtGrab = new THREE.WebGLRenderTarget(1, 1, { ...rtOpts, depthBuffer: false });
  const rtDistort = new THREE.WebGLRenderTarget(1, 1, rtOpts);
  const rtMirror = new THREE.WebGLRenderTarget(1, 1, rtOpts);
  uniforms.tGrab.value = rtGrab.texture;
  const mirrorMat = new THREE.Matrix4();
  const mirrorUniforms = { tMirror: { value: rtMirror.texture }, uMirrorMat: { value: mirrorMat } };
  const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const fsScene = new THREE.Scene();
  const fsMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); fsMesh.frustumCulled = false; fsScene.add(fsMesh);
  const pass = (mat, target) => { fsMesh.material = mat; renderer.setRenderTarget(target); renderer.render(fsScene, fsCam); };

  // the baked noise
  const noiseRT = new THREE.WebGL3DRenderTarget(96, 96, 96, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
  // WebGL3DRenderTarget swaps in a Data3DTexture that defaults to NEAREST and 8-bit: set them here
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

  // screen projection shared by every refracting surface: where a world point lands in the copy
  const GRAB_GLSL = /* glsl */`
    uniform sampler2D tGrab; uniform float uMirrorPass, uGrabAspect; uniform mat4 projectionMatrix;
    vec3 grabAt(vec3 P, vec3 dir, float rough){
      if (uMirrorPass > .5) return nightEnv(dir, max(rough, .25));
      float D = dir.y < -.02 ? min(-P.y / dir.y, 7.) : 5.;
      vec4 c = projectionMatrix * viewMatrix * vec4(P + dir * D, 1.);
      if (c.w <= .05) return nightEnv(dir, max(rough, .25));
      vec2 uv = c.xy / c.w * .5 + .5;
      vec2 o = clamp(uv, vec2(.001), vec2(.999));
      float out_ = length(uv - o) * 30.;
      vec3 g;
      if (rough < .02) g = texture2D(tGrab, o).rgb;
      else {
        // rough or dispersed paths read a small disc of the copy: a soft fringe, not RGB grain
        vec2 r = vec2(rough * .07, rough * .07 * uGrabAspect);
        g = (texture2D(tGrab, o + vec2(r.x, r.y * .4)).rgb + texture2D(tGrab, o - vec2(r.x, r.y * .4)).rgb) * .5;
      }
      return mix(g, nightEnv(dir, max(rough, .25)), clamp(out_, 0., 1.));
    }`;

  // ---------------------------------------------------------------- droplets: streaks of water lit by the effect
  const MAXDROP = 2400;
  const drp = { alive: new Uint8Array(MAXDROP), p: new Float32Array(MAXDROP * 3), v: new Float32Array(MAXDROP * 3), age: new Float32Array(MAXDROP), life: new Float32Array(MAXDROP), size: new Float32Array(MAXDROP), kind: new Uint8Array(MAXDROP), drag: new Float32Array(MAXDROP), grav: new Float32Array(MAXDROP), rip: new Float32Array(MAXDROP) };
  let drpCursor = 0;
  function drop(pos, vel, { life = 1.6, size = 0.003, drag = 0.25, gravity = 1, ripple: rp = 0.25, kind = 0 } = {}) {
    let i = -1;
    for (let k = 0; k < MAXDROP; k++) { const j = (drpCursor + k) % MAXDROP; if (!drp.alive[j]) { i = j; break; } }
    if (i < 0) i = drpCursor;
    drpCursor = (i + 1) % MAXDROP;
    const i3 = i * 3;
    drp.alive[i] = 1; drp.p[i3] = pos.x; drp.p[i3 + 1] = pos.y; drp.p[i3 + 2] = pos.z;
    drp.v[i3] = vel.x; drp.v[i3 + 1] = vel.y; drp.v[i3 + 2] = vel.z;
    drp.age[i] = 0; drp.life[i] = life; drp.size[i] = size; drp.drag[i] = drag; drp.grav[i] = gravity; drp.rip[i] = rp; drp.kind[i] = kind;
  }
  const vortexField = { on: false, center: new V3(), swirl: 4, pull: 1.5, lift: 6, radius: 0.2 };
  function spray(pos, { count = 40, dir = null, spread = 1, speed = [1, 4], size = [0.0015, 0.005], life = [0.8, 1.8], ripple: rp = 0.2, up = 0 } = {}) {
    for (let k = 0; k < count; k++) {
      _a.set(R(-1, 1), R(-1, 1), R(-1, 1)); if (_a.lengthSq() > 1) _a.normalize();
      if (dir) _a.multiplyScalar(spread).add(dir).normalize(); else _a.normalize();
      _a.y += up;
      drop(pos, _b.copy(_a).multiplyScalar(R(speed[0], speed[1])), { size: R(size[0], size[1]), life: R(life[0], life[1]), ripple: rp });
    }
  }
  const idyn = (arr, n) => { const a = new THREE.InstancedBufferAttribute(arr, n); a.setUsage(THREE.DynamicDrawUsage); return a; };
  const drpGeo = new THREE.InstancedBufferGeometry();
  { const q = new THREE.PlaneGeometry(1, 1); drpGeo.index = q.index; drpGeo.setAttribute('position', q.getAttribute('position')); }
  const iDP = new Float32Array(MAXDROP * 3), iDT = new Float32Array(MAXDROP * 3), iDS = new Float32Array(MAXDROP * 2);
  drpGeo.setAttribute('iPos', idyn(iDP, 3)); drpGeo.setAttribute('iTail', idyn(iDT, 3)); drpGeo.setAttribute('iS', idyn(iDS, 2));
  drpGeo.instanceCount = 0;
  const drpMat = new THREE.ShaderMaterial({
    uniforms: { ...lightUniforms, ...envUniforms, uResolution: uniforms.uResolution, uDpr: uniforms.uDpr },
    vertexShader: LIGHTS_GLSL + /* glsl */`
      attribute vec3 iPos; attribute vec3 iTail; attribute vec2 iS;   // size (m), fade
      uniform vec2 uResolution; uniform float uDpr; uniform vec3 uMoonDir, uMoonCol;
      varying vec2 vL; varying float vLen; varying float vW; varying vec3 vCol;
      void main(){
        mat4 vp = projectionMatrix * viewMatrix;
        vec4 h = vp * vec4(iPos, 1.), t = vp * vec4(iTail, 1.);
        // a drop at or behind the lens would divide by ~0 and blow its quad up across the whole screen:
        // invisible (its light is tiny) but it cost a full-screen fill each. Cull it, and pin the tail.
        if (h.w < .06) { gl_Position = vec4(0., 0., 2., 1.); vL = vec2(0.); vLen = 0.; vW = 1.; vCol = vec3(0.); return; }
        if (t.w < .06) t = h;
        vec2 hr = uResolution * .5;
        vec2 sh = h.xy / h.w * hr, st = t.xy / t.w * hr;
        float wpx = iS.x * projectionMatrix[1][1] * hr.y / h.w;
        float w = clamp(wpx, 1. * uDpr, 5. * uDpr);
        float thin = clamp(wpx / (.7 * uDpr), .15, 1.);                      // sub-pixel drops fade instead of fattening
        vec2 d = sh - st; float L = length(d);
        float maxL = min(w * .5, 34. * uDpr);                               // round beads: at most 1.5x long
        if (L > maxL) { d *= maxL / L; L = maxL; }
        vec2 dir = L > 1e-3 ? d / L : vec2(1., 0.), nrm = vec2(-dir.y, dir.x);
        vec2 ctr = sh - d * .5;
        float hl = L * .5 + w;
        vec2 sp = ctr + dir * position.x * 2. * hl + nrm * position.y * 2. * w;
        vL = vec2(position.x * 2. * hl, position.y * 2. * w); vLen = L * .5; vW = w * .5;
        // a drop is seen by what it catches: the effect's lights and the moon, never its own glow
        vec3 V = normalize(cameraPosition - iPos);
        vec3 lit = vec3(0.);
        for (int i = 0; i < 8; i++) { vec3 Lp = uLightPos[i] - iPos; float d2 = dot(Lp, Lp); lit += uLightCol[i] / (1. + d2 * 3.); }
        float moonGlint = pow(max(dot(normalize(V + uMoonDir), V), 0.), 2.);
        lit = lit * .5 + uMoonCol * (.05 + .1 * moonGlint);          // a bead of water catches the moon: a bright speck
        vCol = lit * iS.y * thin / (1. + L / max(w, 1.) * .12);              // a long streak spreads the same light thinner
        gl_Position = vec4(sp / hr * h.w, h.z, h.w);
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vL; varying float vLen; varying float vW; varying vec3 vCol;
      void main(){
        float x = clamp(vL.x, -vLen, vLen);
        float dist = length(vec2(vL.x - x, vL.y));
        float a = 1. - smoothstep(vW * .3, vW, dist);
        // a bead of water: a bright rim and a tiny highlight, its middle darker (it shows the night through it)
        float rr = dist / max(vW, .5);
        float rim = smoothstep(.45, .85, rr) * a;
        float hl = exp(-pow(length(vec2(vL.x - vLen * .5, vL.y) - vec2(-.25, .25) * vW) / max(vW * .35, .4), 2.));
        gl_FragColor = vec4(vCol * (a * .35 + rim * 1.2 + hl * 1.6), 1.);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const drpMesh = new THREE.Mesh(drpGeo, drpMat); drpMesh.frustumCulled = false; drpMesh.renderOrder = 40;
  drpMesh.layers.set(L_PART); drpMesh.layers.enable(L_MIRROR);
  group.add(drpMesh);

  // ---------------------------------------------------------------- the water orb: a living surface, ray-marched
  // The surface is a sphere displaced by the oscillation modes of a free drop (they swell and
  // settle), capillary rings where water joins it, and a fine field that evolves in place (the warp
  // drifts; nothing scrolls). It refracts the frame behind it (a copy of the opaque pass, per
  // channel), reflects the night and the lights with Fresnel, tints by path length, and carries
  // fine bright currents that circulate inside it. A neck reaches out along the stream it sheds.
  const ORB_VERT = /* glsl */`
    uniform float uRadius, uBound; uniform vec3 uCenter; varying vec3 vW;
    void main(){ vW = uCenter + position * uRadius * uBound; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.); }`;
  const ORB_FRAG = NOISE_GLSL + TNOISE_GLSL + ENV_GLSL + LIGHTS_GLSL + GRAB_GLSL + CAUSTIC_GLSL + /* glsl */`
    uniform float uTime, uRadius, uBound, uGlow, uMode, uNeckLen, uNeckR, uPx, uSettle;
    uniform vec3 uCenter, uNeckDir, uSpin;
    uniform vec4 uWob;               // P2 about three axes and a P3 mode, signed amplitudes
    uniform vec4 uRing[4];           // surface rings: direction xyz (unit), age w
    uniform vec4 uRingK[4];          // amplitude, speed (rad/s), width
    uniform vec3 uGlowCol, uWaterCol;
    varying vec3 vW;
    vec3 rot(vec3 p, vec3 ax, float a){ return p * cos(a) + cross(ax, p) * sin(a) + ax * dot(ax, p) * (1. - cos(a)); }
    // what the orb shows through itself: the sky, analytic and sharp, for rays leaving upward; the ground
    // (from the frame copy, where it is on screen) for rays leaving downward, so the inverted horizon is a crisp line
    vec3 orbBg(vec3 P, vec3 dir){
      if (uMirrorPass > .5 || dir.y > -.004) return nightEnv(dir, .0) + skyClouds(dir) * .0;
      float t = min(-P.y / dir.y, 80.);
      vec4 c = projectionMatrix * viewMatrix * vec4(P + dir * t, 1.);
      vec2 uv = c.xy / c.w * .5 + .5;
      vec3 far = nightEnv(dir, .05);
      if (c.w < .05 || any(lessThan(uv, vec2(.002))) || any(greaterThan(uv, vec2(.998)))) return far;
      return mix(texture2D(tGrab, uv).rgb, far, smoothstep(30., 80., t));
    }
    float smin(float a, float b, float k){ float h = clamp(.5 + .5 * (b - a) / k, 0., 1.); return mix(b, a, h) - k * h * (1. - h); }
    // the coarse shape: the drop's modes, one warped swell and the rings. The march only needs this;
    // the fine octaves refine the hit and shape the normal.
    vec3 gW;
    float dispC(vec3 n){
      vec3 A0 = vec3(.0, 1., .0), A1 = vec3(.8, .0, .6), A2 = vec3(-.6, .0, .8);
      float c0 = dot(n, A0), c1 = dot(n, A1), c2 = dot(n, A2);
      float d = uWob.x * (1.5 * c0 * c0 - .5) + uWob.y * (1.5 * c1 * c1 - .5) + uWob.z * (1.5 * c2 * c2 - .5) + uWob.w * (2.5 * c1 * c1 * c1 - 1.5 * c1);
      vec3 q = n * 1.9;
      if (uMode > .5) {
        // the failure: one noise turning rigidly with the ball, a texture sliding over it
        q = rot(q, normalize(vec3(.2, 1., .1)), uTime * .9);
        gW = vec3(0.);
        d += tn(q * 1.4).x * .05;
      } else {
        // the warp drifts through the water, so the swells deform where they are
        gW = tn(q * .9 + vec3(uTime * .11, -uTime * .07, uTime * .05)).xyz;
        d += tn(q * 1.3 + gW * .55).x * .042 * (1. - .5 * uSettle);
      }
      for (int k = 0; k < 4; k++) {
        float age = uRing[k].w; if (age < 0. || uRingK[k].x == 0.) continue;
        float a = acos(clamp(dot(n, uRing[k].xyz), -1., 1.));
        float x = a - age * uRingK[k].y, w = uRingK[k].z * (1. + age * .8);
        d += uRingK[k].x * exp(-age * 1.6) * (-x / w) * exp(-x * x / (w * w)) * inversesqrt(max(sin(a), .34)) * .55;
      }
      return d;
    }
    float dispF(vec3 n){
      float d = dispC(n);
      vec3 q = n * 1.9;
      if (uMode > .5) { q = rot(q, normalize(vec3(.2, 1., .1)), uTime * .9); return d + tn(q * 3.1).y * .016; }
      return d + tn(q * 3.3 + gW * .9 + 2.1).y * .005;    // surface tension: the silhouette stays smooth
    }
    float neck(vec3 p, float s){
      if (uNeckLen <= 0.) return s;
      vec3 a = uNeckDir; float h = clamp(dot(p, a), 0., uNeckLen);
      float cap = length(p - a * h) - uNeckR * mix(1.35, 1., h / max(uNeckLen, 1e-3));
      return smin(s, cap, .32);
    }
    float sdfC(vec3 p){ float r = length(p); return neck(p, r - 1. - dispC(p / max(r, 1e-4))); }
    float sdf(vec3 p){ float r = length(p); return neck(p, r - 1. - dispF(p / max(r, 1e-4))); }
    vec3 sdfN(vec3 p){
      const vec2 e = vec2(.004, -.004);
      return normalize(e.xyy * sdf(p + e.xyy) + e.yyx * sdf(p + e.yyx) + e.yxy * sdf(p + e.yxy) + e.xxx * sdf(p + e.xxx) + 1e-7);
    }
    // fine bright currents: thin filaments in a field that circulates round the orb (a vortex: the
    // inside turns faster than the skin), its warp drifting; the zero set is not pinned to a lattice
    float currents(vec3 p){
      float r = length(p);
      vec3 q = rot(p, uSpin, uTime * (.35 + .9 * (1. - r)));
      vec3 w = tn(q * .9 + vec3(-uTime * .06, uTime * .05, uTime * .08)).xyz;
      if (uMode > .5) { q = rot(p, normalize(vec3(.2, 1., .1)), uTime * .9); w = vec3(0.); }
      float f = tn(q * 1.05 + w * .8).x + .45 * tn(q * 2.1 + w * 1.2 + 3.7).y;
      float line = 1. - smoothstep(.0, .022, abs(f));
      return line * smoothstep(.25, .7, tn(q * .7 + w * .3 + 9.).z * .5 + .5);    // only some filaments carry light
    }
    void main(){
      vec3 ro = (cameraPosition - uCenter) / uRadius, rd = normalize(vW - cameraPosition);
      float B = uNeckLen > 0. ? uBound : 1.17;              // without a neck the surface stays inside 1.17 radii
      float b = dot(ro, rd), c = dot(ro, ro) - B * B, h = b * b - c;
      if (h <= 0.) discard;
      float t = max(-b - sqrt(h), 0.), tEnd = -b + sqrt(h);
      float dmin = 1e9, tmin = t; bool hit = false;
      for (int i = 0; i < 26; i++) {
        float d = sdfC(ro + rd * t);
        if (d < dmin) { dmin = d; tmin = t; }
        if (d < .002) { hit = true; break; }
        t += d * .85;
        if (t > tEnd) break;
      }
      if (hit) for (int k = 0; k < 2; k++) t += sdf(ro + rd * t) * .9;   // the fine octaves move the hit a hair
      float px = uPx * max(tmin, .5);                     // a pixel, in radii, at that depth
      float cov = hit ? 1. : 1. - smoothstep(0., px * 1.2, dmin);
      if (!hit) t = tmin;
      vec3 P = ro + rd * t;
      // a hit that grazes the outline still only covers part of its pixel: measure how far inside it is
      float rho = sqrt(max(dot(ro, ro) - b * b, 0.));
      float inNeck = uNeckLen > 0. ? smoothstep(.55, .8, dot(normalize(P), uNeckDir)) : 0.;
      if (hit) cov = mix(clamp((length(P) - rho) / (px * 1.6) + .5, 0., 1.), 1., inNeck);
      if (cov <= .002) discard;
      vec3 N = sdfN(P), V = -rd;
      // capillary detail lives in the shading normal, not in the outline
      vec3 fq = normalize(P) * 13.3 + gW * 1.4;
      N = normalize(N + (tn(fq + vec3(uTime * .2, 0., 0.)).xyz) * .045 * (uMode > .5 ? 0. : 1.) * clamp(dot(N, V) * 2., 0., 1.));
      vec3 Pw = uCenter + P * uRadius;
      float NV = clamp(dot(N, V), 0., 1.);
      float F = .02 + .98 * pow(1. - NV, 5.);
      vec3 Rr = reflect(rd, N);
      float mR = max(dot(Rr, uMoonDir), 0.);
      vec3 refl = nightEnv(Rr, .02);
      // highlights of small, very bright sources: even 2% reflectance shows them bright, so they are not
      // scaled down with the Fresnel term like the dim sky is (only up at the grazing limb)
      vec3 spec = (lightGlint2(Pw, Rr, 400., .6, 2600., 3.) + uMoonCol * (pow(mR, 2600.) * 1.6 + pow(mR, 200.) * .04)) * (F * .5 + .03) * 22.;
      // through the water: enter, cross, leave through the far side of the living surface
      vec3 tr = refract(rd, N, 1. / 1.333);
      float tb = dot(P, tr), tc = dot(P, P) - 1.08, tx = -tb + sqrt(max(tb * tb - tc, 0.));
      vec3 Pe = P + tr * tx;
      for (int k = 0; k < 2; k++) { float d = sdfC(Pe); Pe -= tr * d; }   // settle onto the real far surface
      vec3 Ne = sdfN(Pe);
      float path = length(Pe - P) * uRadius;
      vec3 trans = exp(-vec3(.35, .1, .08) * path * 1.4);             // clear water: barely a tint even through the middle
      vec3 PeW = uCenter + Pe * uRadius;
      vec3 bg;
      vec3 eR = refract(tr, -Ne, 1.329), eG = refract(tr, -Ne, 1.333), eB = refract(tr, -Ne, 1.338);
      if (dot(eG, eG) < .5) bg = nightEnv(reflect(tr, -Ne), .05) * 1.2 + uMoonCol * .01;   // total internal reflection: the far wall mirrors the night
      else {
        bg = vec3(orbBg(PeW, eR).r, orbBg(PeW, eG).g, orbBg(PeW, eB).b);
        float gm = (bg.r + bg.g + bg.b) / 3. + .002; bg = clamp(bg, vec3(gm * .7), vec3(gm * 1.3));   // a fringe, never rainbow speckle
        // a water lens gathers light: the inverted world inside it reads a little brighter than around it
        bg *= 1.35;
      }
      // inner light: a glow in the heart of the water and fine currents along the chord
      // the light inside: the rippling top focuses it into a moving caustic web on the far inner wall
      // (a glass of water lit from above), seen through the near surface. It evolves; nothing scrolls.
      vec3 cpn = normalize(Pe);
      if (uMode > .5) cpn = rot(cpn, normalize(vec3(.2, 1., .1)), uTime * .9);
      vec2 cq = cpn.xz * 1.75 + gW.xy * .1;
      float cl = 0.;
      if (uMirrorPass < .5) {
        float cau = caustic(cq * (1. + .25 * cpn.y) + 3.1, uTime * (uMode > .5 ? 0. : 1.15), .62);
        // light enters through the top and the moon side and focuses on the far wall opposite: only there
        float focus = smoothstep(.2, .95, dot(cpn, -normalize(uMoonDir + vec3(0., 1.2, 0.))));
        cl = max(cau - 1.9, 0.) * focus * (.35 + .65 * NV);
      }
      float cur = uMirrorPass < .5 ? currents((P + Pe) * .5) : 0.;
      vec3 mid = (P + Pe) * .5;
      float core = exp(-dot(mid, mid) * 4.5);
      vec3 cc = mix(uGlowCol, vec3(.8, .95, 1.), clamp(cl * .35, 0., .85));   // focused light runs to white
      vec3 inner = cc * min(uGlow, 1.) * cl * .12 + vec3(.6, .85, 1.) * uGlow * cur * .008;
      // light trapped by total internal reflection gathers in a crisp rim at the limb
      float limb = pow(1. - NV, 10.) * (1. - pow(1. - NV, 60.));
      // the rim: the bright night horizon mirrored at grazing angles, crisp and silver
      vec3 rimS = (nightEnv(Rr, .02) * 3. + uMoonCol * .02) * pow(1. - NV, 3.) * (1. - pow(1. - NV, 40.));
      vec3 col = bg * trans * (1. - F) + inner * (1. - F) + refl * F + spec * 1.6 + rimS + vec3(.8, .93, 1.) * uGlow * limb * .35;
      vec4 cp = projectionMatrix * viewMatrix * vec4(Pw, 1.);
      gl_FragDepth = clamp(cp.z / cp.w * .5 + .5, 0., 1.);
      gl_FragColor = vec4(col * cov, cov);
    }`;
  const orbGeo = new THREE.IcosahedronGeometry(1, 6);
  const orbs = [];
  function createOrb({ radius = 0.3 } = {}) {
    const u = {
      ...envUniforms, ...lightUniforms, uTime: uniforms.uTime, tNoise: uniforms.tNoise, tGrab: uniforms.tGrab, uGrabAspect: uniforms.uGrabAspect, uMirrorPass: uniforms.uMirrorPass,
      uRadius: { value: radius }, uBound: { value: 1.42 }, uCenter: { value: new V3() }, uGlow: { value: 1 }, uMode: { value: 0 },
      uNeckLen: { value: 0 }, uNeckR: { value: 0.2 }, uNeckDir: { value: new V3(1, 0, 0) }, uPx: { value: 0.01 }, uSettle: { value: 0 },
      uSpin: { value: new V3(0.1, 1, 0.2).normalize() }, uWob: { value: new THREE.Vector4() },
      uRing: { value: Array.from({ length: 4 }, () => new THREE.Vector4(0, 1, 0, -1)) }, uRingK: { value: Array.from({ length: 4 }, () => new THREE.Vector4(0, 2, 0.2, 0)) },
      uGlowCol: { value: new V3(palette.glow.r, palette.glow.g, palette.glow.b) }, uWaterCol: { value: new V3(palette.water.r, palette.water.g, palette.water.b) },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: u, vertexShader: ORB_VERT, fragmentShader: ORB_FRAG, side: THREE.BackSide,   // back faces: the camera may sit inside the bound
      transparent: true, depthWrite: true, depthTest: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    const mesh = new THREE.Mesh(orbGeo, mat); mesh.frustumCulled = false; mesh.renderOrder = 20;
    mesh.layers.set(L_WATER); mesh.layers.enable(L_MIRROR);
    group.add(mesh);
    const O = {
      mesh, u, position: new V3(), radius, glow: 1, visible: true, settle: 0,
      wob: [0, 0, 0, 0], wobV: [0, 0, 0, 0], wobW: [7.2, 8.1, 6.6, 11.3],
      neck: { dir: new V3(1, 0, 0), len: 0, r: 0.2 },
      rings: [0, 1, 2, 3].map(() => ({ age: -1 })), ringNext: 0,
      kick(i, v) { this.wobV[i] += v; },
      // a capillary ring that runs over the surface from where water joins or leaves it
      ring(dirWorld, amp = 0.05, speed = 2.6, width = 0.18) {
        const k = this.ringNext++ % 4; this.rings[k].age = 0;
        u.uRing.value[k].set(dirWorld.x, dirWorld.y, dirWorld.z, 0).setW(0); const v = u.uRing.value[k]; _a.set(v.x, v.y, v.z).normalize(); v.set(_a.x, _a.y, _a.z, 0);
        u.uRingK.value[k].set(amp, speed, width, 0);
      },
      get currentRadius() { return u.uRadius.value; },
    };
    orbs.push(O);
    return O;
  }
  function updateOrbs(dt) {
    for (const O of orbs) {
      const vis = O.visible && O.radius > 0.004;
      O.mesh.visible = vis;
      const u = O.u;
      for (let i = 0; i < 4; i++) {           // free-drop oscillation modes: springs that swell and settle
        const w = O.wobW[i], z = 0.16 + 0.25 * O.settle;
        O.wobV[i] += (-w * w * O.wob[i] - 2 * z * w * O.wobV[i]) * dt;
        O.wob[i] += O.wobV[i] * dt;
      }
      u.uWob.value.set(O.wob[0], O.wob[1], O.wob[2], O.wob[3]);
      for (let k = 0; k < 4; k++) { const Rg = O.rings[k]; if (Rg.age >= 0) { Rg.age += dt; if (Rg.age > 2.5) Rg.age = -1; } u.uRing.value[k].w = Rg.age; }
      u.uRadius.value = Math.max(O.radius, 0.004); u.uCenter.value.copy(O.position); u.uGlow.value = O.glow; u.uSettle.value = O.settle;
      u.uMode.value = options.water === 'sliding' ? 1 : 0;
      u.uNeckLen.value = O.neck.len; u.uNeckR.value = O.neck.r; u.uNeckDir.value.copy(O.neck.dir).normalize();
      u.uBound.value = O.neck.len > 0 ? 1.42 + Math.max(0, O.neck.len - 0.3) : 1.18;   // without a neck the surface stays inside 1.17 radii
      // a pixel in orb radii at unit depth, for the silhouette's coverage
      u.uPx.value = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5) / Math.max(res.y, 1);   // a pixel per unit of distance
    }
  }

  // ---------------------------------------------------------------- tubes: streams, threads, whips
  // A tube follows a polyline of points with a radius each. Its surface carries ripples that move
  // with the flow (water running down its length), thin foam lines torn along the flow, refraction
  // of the frame behind it per channel, and Fresnel reflections of the night and the lights.
  const TUBE_VERT = /* glsl */`
    attribute vec3 aT; attribute vec4 aD;    // tangent; along (m), around (0..1), radius (m), fade
    varying vec3 vW; varying vec3 vN; varying vec3 vT; varying vec4 vD;
    void main(){ vW = position; vN = normal; vT = aT; vD = aD; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`;
  const TUBE_FRAG = NOISE_GLSL + TNOISE_GLSL + ENV_GLSL + LIGHTS_GLSL + GRAB_GLSL + CAUSTIC_GLSL + /* glsl */`
    uniform float uTime, uFlow, uGlow, uFoamK, uOpacity;
    uniform vec3 uGlowCol;
    varying vec3 vW; varying vec3 vN; varying vec3 vT; varying vec4 vD;
    void main(){
      vec3 N = normalize(vN), T = normalize(vT), V = normalize(cameraPosition - vW), rd = -V;
      float s = vD.x, ar = vD.y, rad = max(vD.z, 1e-4);
      // ripples travel with the water: phase = along - flow * t
      float ph = s - uFlow * uTime;
      vec3 B = normalize(cross(T, N));
      float w1 = sin(ph * 61. + ar * 6.2832 * 2. + tn(vec3(ph * 3., ar * 4., 1.3)).x * 3.);
      float w2 = sin(ph * 137. - ar * 6.2832 * 3. + tn(vec3(ph * 7., ar * 6., 4.1)).y * 4.);
      N = normalize(N + T * (w1 * .14 + w2 * .06) + B * tn(vec3(ph * 9., ar * 5., 2.)).z * .08);
      float NV = clamp(dot(N, V), 0., 1.);
      float F = .02 + .98 * pow(1. - NV, 5.);
      vec3 Rr = reflect(rd, N);
      // clear water: what is behind it, bent and flipped by the cylinder, a bright edge on the side the
      // moon and the lights catch, a dark edge on the other, and colour only where it runs thick
      vec3 refl = nightEnv(Rr, .03);
      float mR = max(dot(Rr, uMoonDir), 0.);
      vec3 spec = (lightGlint2(vW, Rr, 180., 1.2, 1500., 4.) + uMoonCol * (pow(mR, 60.) * .35 + pow(mR, 14.) * .03)) * (F * .5 + .03) * 26.;   // bright sources stay bright at 2%
      float chord = 2. * rad * NV;
      vec3 tr = refract(rd, N, 1. / 1.333);
      vec3 Pe = vW + tr * chord;
      vec3 bend = rd - tr;
      vec3 eR = normalize(rd + bend * 1.05), eG = normalize(rd + bend * 1.12), eB = normalize(rd + bend * 1.2);
      vec3 bg = vec3(grabAt(Pe, eR, .02).r, grabAt(Pe, eG, .014).g, grabAt(Pe, eB, .02).b);
      vec3 trans = exp(-vec3(1.6, .34, .24) * chord * 9.);                  // thin water is colourless; thick runs blue-green
      float lit = smoothstep(-.35, .45, dot(N, normalize(uMoonDir + vec3(0., 1.4, 0.))));   // the side facing the moon and the sky above
      float edge = pow(1. - NV, 2.2);
      // thin foam lines torn along the flow, where the surface folds
      float fn = tn(vec3(ph * 4.5, ar * 7., s * .3 + 7.)).x + .5 * tn(vec3(ph * 11., ar * 15., 3.)).y;
      float foam = (1. - smoothstep(.0, .05, abs(fn))) * smoothstep(.35, .75, tn(vec3(ph * 1.7, ar * 2., 9.)).z * .5 + .5) * uFoamK;
      vec3 foamCol = (lightGlint(vW, N, 2.) * .06 + uMoonCol * .006 * (.3 + lit) + vec3(.0015, .0018, .002)) * foam;
      // the skill's light rides inside the water and focuses into bright threads that run with the flow:
      // only where the moving surface focuses it, never as a fill
      // (caustic cells are ~0.12 units: about 5 cm along the flow and two or three round the strand)
      float ang = ar * 6.2832;
      float cst = caustic(vec2(ph * 2.3, sin(ang) * .09 + tn(vec3(ph * 1.5, cos(ang), 5.)).x * .05), uTime * 1.6, .7);
      float stretch = smoothstep(.15, .75, tn(vec3(ph * .6, 3.3, 1.)).y * .5 + .5);    // only some stretches carry the light
      float thread = max(cst - 3.1, 0.) * pow(NV, 2.) * smoothstep(.01, .035, rad) * stretch;
      vec3 inner = vec3(0.) * thread;                                  // clear water: no pattern of its own
      // light carried along the stream by total internal reflection leaks out at the lit limb as a hairline
      vec3 limbL = mix(uGlowCol, vec3(.8, .95, 1.), .6) * uGlow * pow(1. - NV, 6.) * (1. - pow(1. - NV, 40.)) * lit * .5;
      // the near-grazing limbs mirror the bright night horizon and the moon's path: silver edges
      vec3 rimL = (nightEnv(Rr, .02) * 5. + uMoonCol * .07) * pow(1. - NV, 1.6) * (.35 + .65 * lit);   // both limbs mirror the bright night: silver edges
      vec3 col = (bg * trans + inner) * (1. - F) * (1. - .8 * edge * (1. - lit)) + refl * F * (.35 + .9 * lit) + spec * 3. + foamCol + limbL + rimL;
      float a = vD.w * uOpacity;
      gl_FragColor = vec4(col * a, a);
    }`;
  const tubes = [];
  function createTube({ maxPoints = 64, radial = 12, flow = 2, foam = 1, glow = 0.6 } = {}) {
    const nv = maxPoints * radial;
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), tan = new Float32Array(nv * 3), dat = new Float32Array(nv * 4);
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aT', new THREE.BufferAttribute(tan, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aD', new THREE.BufferAttribute(dat, 4).setUsage(THREE.DynamicDrawUsage));
    const idx = [];
    for (let i = 0; i < maxPoints - 1; i++) for (let j = 0; j < radial; j++) {
      const a = i * radial + j, b = i * radial + ((j + 1) % radial), c = (i + 1) * radial + j, d = (i + 1) * radial + ((j + 1) % radial);
      idx.push(a, b, c, b, d, c);              // counter-clockwise seen from outside
    }
    g.setIndex(idx); g.setDrawRange(0, 0);
    const u = { ...envUniforms, ...lightUniforms, uTime: uniforms.uTime, tNoise: uniforms.tNoise, tGrab: uniforms.tGrab, uGrabAspect: uniforms.uGrabAspect, uMirrorPass: uniforms.uMirrorPass, uFlow: { value: flow }, uGlow: { value: glow }, uFoamK: { value: foam }, uOpacity: { value: 1 }, uGlowCol: { value: new V3(palette.glow.r, palette.glow.g, palette.glow.b) } };
    const mat = new THREE.ShaderMaterial({
      uniforms: u, vertexShader: TUBE_VERT, fragmentShader: TUBE_FRAG, transparent: true, depthWrite: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 18;
    mesh.layers.set(L_WATER); mesh.layers.enable(L_MIRROR);
    group.add(mesh);
    const T = { mesh, u, points: [], radii: [], fades: null, along0: 0, maxPoints, radial, visible: false, flow, opacity: 1, glow, wobble: 1, seed: R(0, 100) };
    tubes.push(T);
    return T;
  }
  const _t = new V3(), _n = new V3(), _bn = new V3(), _prevN = new V3();
  function buildTube(T) {
    const n = Math.min(T.points.length, T.maxPoints);
    const g = T.mesh.geometry;
    T.mesh.visible = T.visible && n >= 2;
    if (!T.mesh.visible) { g.setDrawRange(0, 0); return; }
    const pos = g.attributes.position.array, nrm = g.attributes.normal.array, tan = g.attributes.aT.array, dat = g.attributes.aD.array;
    let along = T.along0;
    const t = uniforms.uTime.value;
    for (let i = 0; i < n; i++) {
      const p = T.points[i], pa = T.points[Math.max(0, i - 1)], pb = T.points[Math.min(n - 1, i + 1)];
      _t.subVectors(pb, pa); if (_t.lengthSq() < 1e-12) _t.set(1, 0, 0); _t.normalize();
      if (i === 0) { _n.copy(Math.abs(_t.y) < 0.9 ? UP : ZAXIS).cross(_t).normalize(); }
      else { _n.copy(_prevN).addScaledVector(_t, -_prevN.dot(_t)); if (_n.lengthSq() < 1e-10) _n.copy(UP).cross(_t); _n.normalize(); }   // parallel transport: no twist
      _prevN.copy(_n);
      _bn.crossVectors(_t, _n);
      if (i > 0) along += p.distanceTo(T.points[i - 1]);
      const r0 = T.radii[i] || 0;
      const fade = T.fades ? T.fades[i] : 1;
      for (let j = 0; j < T.radial; j++) {
        const a = (j / T.radial) * Math.PI * 2;
        // the cross-section breathes and wobbles along the flow: an organic outline, not a pipe
        const ph = along - T.flow * t;
        const wob = 1 + T.wobble * (0.13 * Math.sin(ph * 23 + a * 2 + T.seed) + 0.07 * Math.sin(ph * 41 - a * 3 + T.seed * 2.3));
        const r = r0 * wob;
        const ca = Math.cos(a), sa = Math.sin(a);
        const k = (i * T.radial + j);
        const nx = _n.x * ca + _bn.x * sa, ny = _n.y * ca + _bn.y * sa, nz = _n.z * ca + _bn.z * sa;
        pos[k * 3] = p.x + nx * r; pos[k * 3 + 1] = p.y + ny * r; pos[k * 3 + 2] = p.z + nz * r;
        nrm[k * 3] = nx; nrm[k * 3 + 1] = ny; nrm[k * 3 + 2] = nz;
        tan[k * 3] = _t.x; tan[k * 3 + 1] = _t.y; tan[k * 3 + 2] = _t.z;
        dat[k * 4] = along; dat[k * 4 + 1] = j / T.radial; dat[k * 4 + 2] = r; dat[k * 4 + 3] = fade;
      }
    }
    for (const key of ['position', 'normal', 'aT', 'aD']) g.attributes[key].needsUpdate = true;
    g.setDrawRange(0, (n - 1) * T.radial * 6);
    T.u.uFlow.value = T.flow; T.u.uOpacity.value = T.opacity; T.u.uGlow.value = T.glow;
  }

  // ---------------------------------------------------------------- splash crowns
  // A crown is a thin sheet of water thrown up round the hit: it rises and flares, its rim pulls
  // into fingers that pinch off as droplets, holes tear through it, and it falls back.
  const CROWN_SEG = 56, CROWN_ROWS = 7;
  const crownMat = new THREE.ShaderMaterial({
    uniforms: { ...envUniforms, ...lightUniforms, uTime: uniforms.uTime, tNoise: uniforms.tNoise, tGrab: uniforms.tGrab, uGrabAspect: uniforms.uGrabAspect, uMirrorPass: uniforms.uMirrorPass, uGlowCol: { value: new V3(palette.glow.r, palette.glow.g, palette.glow.b) } },
    vertexShader: /* glsl */`
      attribute vec4 aD;   // around (0..1), up (0..1), age (0..1), seed
      varying vec3 vW; varying vec3 vN; varying vec4 vD;
      void main(){ vW = (modelMatrix * vec4(position, 1.)).xyz; vN = normalize(mat3(modelMatrix) * normal); vD = aD; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.); }`,
    fragmentShader: NOISE_GLSL + TNOISE_GLSL + ENV_GLSL + LIGHTS_GLSL + GRAB_GLSL + /* glsl */`
      uniform vec3 uGlowCol; varying vec3 vW; varying vec3 vN; varying vec4 vD;
      void main(){
        vec3 V = normalize(cameraPosition - vW), rd = -V, N = normalize(vN);
        if (dot(N, V) < 0.) N = -N;
        float up = vD.y, age = vD.z;
        // the sheet tears from its rim down as it ages
        float tear = tn(vec3(vD.x * 22., up * 3.5, vD.w)).x * .5 + .5;
        float holes = smoothstep(age * 1.25 - .15, age * 1.25 + .05, tear + (1. - up) * .35);
        float a = holes * smoothstep(0., .18, up) * (1. - smoothstep(.75, 1., age));
        if (a < .01) discard;
        N = normalize(N + vec3(tn(vec3(vD.x * 40., up * 9., 3.)).xyz) * .18);
        float NV = clamp(dot(N, V), 0., 1.), F = .02 + .98 * pow(1. - NV, 5.);
        vec3 Rr = reflect(rd, N);
        vec3 refl = nightEnv(Rr, .04) + lightGlint(vW, Rr, 260.) * .6;
        vec3 bg = grabAt(vW, normalize(rd - N * .12), .03);
        // thrown water is full of air: white where it is thick (the foot, the rim), clear only in the thin sheet
        float aer = smoothstep(.55, .0, up) * .8 + smoothstep(.75, 1., up) * .6 + tn(vec3(vD.x * 60., up * 14., 5.)).x * .25;
        vec3 white = uMoonCol * .07 + lightGlint(vW, N, 2.) * .16 + vec3(.016, .018, .02);
        vec3 col = mix(bg * (1. - F) + refl * F * 1.6, white, clamp(aer, 0., .95));
        col += lightGlint2(vW, Rr, 60., .5, 600., 2.) * (F * .5 + .05) * 6.;   // glints on the sheet
        gl_FragColor = vec4(col * a, a);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  const crowns = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.BufferGeometry();
    const nv = (CROWN_SEG + 1) * CROWN_ROWS;
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nv * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nv * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aD', new THREE.BufferAttribute(new Float32Array(nv * 4), 4).setUsage(THREE.DynamicDrawUsage));
    const idx = [];
    for (let r = 0; r < CROWN_ROWS - 1; r++) for (let s = 0; s < CROWN_SEG; s++) {
      const a = r * (CROWN_SEG + 1) + s, b = a + 1, c = a + CROWN_SEG + 1, d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
    g.setIndex(idx);
    const mesh = new THREE.Mesh(g, crownMat); mesh.frustumCulled = false; mesh.visible = false; mesh.renderOrder = 19;
    mesh.layers.set(L_WATER); mesh.layers.enable(L_MIRROR);
    group.add(mesh);
    crowns.push({ mesh, alive: false, age: 0, life: 0.6, R: 0.15, H: 0.18, fingers: [], seed: 0, shed: 0 });
  }
  function crown(pos, { radius = 0.12, height = 0.16, life = 0.62, droplets = 1 } = {}) {
    const C = crowns.find((c) => !c.alive) || crowns.reduce((o, c) => (c.age / c.life > o.age / o.life ? c : o));
    C.alive = true; C.age = 0; C.life = life; C.R = radius; C.H = height; C.seed = R(0, 50); C.drops = droplets;
    C.mesh.position.copy(pos).setY(0.002);
    // a torn, lopsided crown: the side the jet leans toward throws the tall spikes, the other a low lip
    const nf = 11 + ((rnd() * 7) | 0), lean = R(0, 1);
    C.lean = lean; C.lopside = R(0.35, 0.6);
    C.fingers = Array.from({ length: nf }, (_, k) => {
      const a = (k + R(-0.45, 0.45)) / nf, side = 0.5 + 0.5 * Math.cos((a - lean) * Math.PI * 2);
      return { a, h: R(0.3, 1.0) * (0.35 + 1.3 * side * side), w: R(900, 3200), shed: false };
    });
    C.mesh.visible = true;
  }
  function updateCrowns(dt) {
    for (const C of crowns) {
      if (!C.alive) continue;
      C.age += dt;
      const x = C.age / C.life;
      if (x >= 1) { C.alive = false; C.mesh.visible = false; continue; }
      const g = C.mesh.geometry, pos = g.attributes.position.array, nrm = g.attributes.normal.array, dat = g.attributes.aD.array;
      const rise = Math.sin(Math.min(1, x * 1.15) * Math.PI);          // up, then back down
      const rad = C.R * (0.45 + 1.1 * (1 - Math.pow(1 - x, 2.2)));        // the crown widens as it rises
      const H = C.H * rise;
      for (let r = 0; r < CROWN_ROWS; r++) {
        const v = r / (CROWN_ROWS - 1);
        for (let s = 0; s <= CROWN_SEG; s++) {
          const u = s / CROWN_SEG, a = u * Math.PI * 2;
          // fingers at the rim: the sheet pulls up into jets that pinch off as drops
          let fing = 0;
          for (const f of C.fingers) { let du = Math.abs(u - f.a); du = Math.min(du, 1 - du); fing += f.h * Math.exp(-du * du * f.w); }
          const side = 0.5 + 0.5 * Math.cos((u - C.lean) * Math.PI * 2);
          const top = (1 - C.lopside * (1 - side)) * (1 + 0.6 * fing * Math.pow(v, 2.5)) - 0.12 * Math.pow(v, 2) * (1 + Math.sin(a * 3 + C.seed));
          const flare = 1 + 0.55 * v * v * (0.6 + 0.4 * x);                   // the rim leans outward
          const rr = rad * flare * (1 + 0.04 * Math.sin(a * 5 + C.seed * 2));
          const y = H * v * top;
          const k = r * (CROWN_SEG + 1) + s;
          pos[k * 3] = Math.cos(a) * rr; pos[k * 3 + 1] = y; pos[k * 3 + 2] = Math.sin(a) * rr;
          // outward normal leaning in by the flare's slope
          const slope = (rad * 1.1 * v * (0.6 + 0.4 * x)) / Math.max(H * top, 1e-3);
          const ny = -slope, inv = 1 / Math.hypot(1, ny);
          nrm[k * 3] = Math.cos(a) * inv; nrm[k * 3 + 1] = ny * inv; nrm[k * 3 + 2] = Math.sin(a) * inv;
          dat[k * 4] = u; dat[k * 4 + 1] = v; dat[k * 4 + 2] = x; dat[k * 4 + 3] = C.seed;
        }
      }
      g.attributes.position.needsUpdate = g.attributes.normal.needsUpdate = g.attributes.aD.needsUpdate = true;
      // fingers shed their drops at the top of the rise
      if (C.drops > 0 && x > 0.32) for (const f of C.fingers) {
        if (f.shed) continue;
        if (rnd() < dt * 9) {
          f.shed = true;
          const a = f.a * Math.PI * 2, rr = rad * 1.5;
          // each spike breaks into a few drops at its tip
          for (let k = 0; k < 3; k++) {
            _a.set(C.mesh.position.x + Math.cos(a) * rr, H * (1 + 0.6 * f.h) * R(0.85, 1.05), C.mesh.position.z + Math.sin(a) * rr);
            _b.set(Math.cos(a) * R(0.3, 1.0), R(0.8, 2.1) * (0.6 + f.h * 0.5), Math.sin(a) * R(0.3, 1.0)).multiplyScalar(C.R / 0.12 * 0.9);
            drop(_a, _b, { size: R(0.0022, 0.006), life: 2.2, ripple: 0.6 });
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------- crystals: ray-traced half-space solids
  // A crystal is a hexagonal prism with a lopsided rhombohedral point, built by clipping a box
  // with its planes and bevelled along every edge. The shader traces inside against the same
  // planes: Snell at the face, the exit plane in closed form, Fresnel and total internal
  // reflection for up to four legs, per-channel dispersion at the exit, Beer-Lambert over the true
  // path, inclusion veils and the resonance glow along the way, and thin bright edges.
  const MAXPL = 14, STRETCH = 0.45, MAXPIECE = 16;
  const CRYSTAL_VERT = /* glsl */`
    attribute float aBev;
    varying vec3 vW; varying vec3 vN; varying float vBev;
    void main(){
      vec4 w = modelMatrix * vec4(position, 1.);
      vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vBev = aBev;
      gl_Position = projectionMatrix * viewMatrix * w;
    }`;
  const CRYSTAL_FRAG = NOISE_GLSL + TNOISE_GLSL + ENV_GLSL + LIGHTS_GLSL + GRAB_GLSL + /* glsl */`
    uniform vec4 uPl[${MAXPL}];
    uniform int uNPl;
    uniform vec3 uOrigin, uAxis, uSide;
    uniform float uLen, uRad, uGlow, uVeil, uVeilT, uCrack, uMode, uSeed, uTime, uFrost, uBand, uGroundY;
    uniform vec4 uSeeds[16]; uniform int uNSeeds; uniform float uStretch;
    uniform vec4 uCrk[8]; uniform vec4 uCrkN[8];       // fracture discs: centre + radius, normal
    uniform vec3 uTint, uGlowCol;
    varying vec3 vW; varying vec3 vN; varying float vBev;
    const float IOR = 1.57;
    vec3 toLocal(vec3 p){ vec3 d = p - uOrigin; vec3 s2 = cross(uAxis, uSide); return vec3(dot(d, uSide), dot(d, uAxis), dot(d, s2)) / uRad; }
    // distance to the nearest boundary between fracture cells: the cracks before it breaks
    float crackDist(vec3 p){
      // cells are measured with the axis squeezed, so they run long along it: splinters, not cubes
      float d1 = 1e9; int i1 = 0;
      for (int i = 0; i < 16; i++) { if (i >= uNSeeds) break; vec3 q = p - uSeeds[i].xyz; q -= uAxis * dot(q, uAxis) * (1. - uStretch); float d = dot(q, q); if (d < d1) { d1 = d; i1 = i; } }
      float best = 1e9;
      vec3 a = uSeeds[i1].xyz;
      for (int j = 0; j < 16; j++) {
        if (j >= uNSeeds || j == i1) continue;
        vec3 b = uSeeds[j].xyz, ab = b - a;
        vec3 n = ab - uAxis * dot(ab, uAxis) * (1. - uStretch * uStretch);
        vec3 sa = a - uAxis * dot(a, uAxis) * (1. - uStretch), sb = b - uAxis * dot(b, uAxis) * (1. - uStretch);
        float dd = (dot(sb, sb) - dot(sa, sa)) * .5;
        float ln = length(n);
        best = min(best, (dd - dot(n, p)) / ln);
      }
      return best;
    }
    // the inside: milky veils (warped sheets fixed to the stone), the resonance glow round its heart
    vec3 inside(vec3 p0, vec3 dir, float len){
      vec3 acc = vec3(0.);
      float seg = len / 2. / uRad;                                  // this step, in radii
      vec3 white = vec3(.9, .98, 1.);
      for (int k = 0; k < 2; k++) {
        vec3 p = p0 + dir * len * (float(k) + .5) / 2.;
        vec3 l = toLocal(p);
        float h = l.y * uRad / max(uLen, 1e-3), rr = length(l.xz);
        // the light lives at the root, where the stone meets the water: white-hot there, fading up the stone
        float root = (exp(-max(h, 0.) * 14.) * 1.6 + exp(-max(h, 0.) * 5.) * .3) * exp(-rr * rr * 1.4) * smoothstep(-.15, .02, h);
        // light carried up the stone by internal reflection leaves through the point: the tip burns bright
        float tip = smoothstep(.85, 1.08, h) * exp(-rr * rr * 2.5);
        // resonance: a band of light that climbs from the root to the point and settles
        float band = exp(-pow((h - uBand) / .14, 2.)) * step(-.5, uBand) * exp(-rr * rr * 1.1);
        // fractures and veils: the clear stone shows its light only where something scatters it
        float cd = crackDist(p);
        float some = smoothstep(.4, .8, tn(l * 1.3 + uSeed).x * .5 + .5);
        float frac = exp(-max(cd, 0.) / (.0015 + .0025 * uRad)) * some;
        vec3 w = tn(l * .55 + uSeed).xyz;
        float sh = h * 2.4 + w.x * .22 + w.y * .1;
        float veil = (1. - smoothstep(.0, .045, abs(fract(sh) - .5))) * smoothstep(.62, .88, tn(l * 1.1 + 7. + uSeed).z * .5 + .5);
        float scatter = clamp(veil * 1.5 + frac * 2. + (tn(l * 3.1 + uSeed * 2.).y * .5 + .5) * .35, 0., 1.);
        // the root burns white-hot right at the water; above it the glow shows only through what scatters it
        float glow = (root * (.35 + 1.4 * scatter) + band * (.25 + .9 * scatter) + tip * .35) * 1.35;
        acc += mix(uGlowCol, white, clamp(glow * uGlow * .9, .35, .95)) * glow * uGlow * seg;
        acc += white * frac * (.002 + uGlow * .02 * (root * 2. + .2)) * seg * 2.;
        acc += (vec3(.003, .004, .0045) + white * uGlow * .02 * root) * veil * seg;
        if (uCrack > 0.) acc += white * smoothstep(0., .25, uCrack * 1.35 - h) * exp(-max(cd, 0.) / (.0015 + .003 * uRad)) * seg * .3;
      }
      // fractures: thin discs inside the stone, crossed exactly by the ray. Seen edge-on a crack is a bright
      // white line; face-on a faint silver sheet; its ragged rim always catches the light
      if (uMirrorPass < .5) for (int j = 0; j < 8; j++) {
        vec3 n = uCrkN[j].xyz; float dn = dot(dir, n);
        if (abs(dn) < 1e-3) continue;
        float t = dot(uCrk[j].xyz - p0, n) / dn;
        if (t < 0. || t > len) continue;
        vec3 q = p0 + dir * t - uCrk[j].xyz;
        vec4 cn = tn(q / uCrk[j].w * 2.3 + float(j) * 3.1);
        float rq = length(q) / uCrk[j].w + cn.x * .35 + tn(q / uCrk[j].w * 7. + 1.7).y * .08;   // a ragged, jagged edge
        if (rq > 1.15) continue;
        float sheet = 1. - smoothstep(.8, 1., rq), rim = exp(-pow((rq - .95) / .03, 2.)) * smoothstep(-.2, .3, cn.z);   // the rim shows only in stretches
        float graze = pow(1. - abs(dn), 5.);
        vec3 lq = toLocal(p0 + dir * t);
        float hq = lq.y * uRad / max(uLen, 1e-3);
        float lit = .25 + uGlow * (exp(-max(hq, 0.) * 4.) * 1.6 + .25);
        acc += white * (sheet * (.002 + .14 * graze) + rim * .035) * lit;
      }
      return acc;
    }
    void main(){
      vec3 V = normalize(cameraPosition - vW), rd = -V;
      vec3 N = normalize(vN);
      if (dot(N, V) < 0.) N = -N;
      float NV = clamp(dot(N, V), 0., 1.);
      float F0 = pow((IOR - 1.) / (IOR + 1.), 2.);
      // a water film draining off the stone as it rises out of the ground
      vec3 l0 = toLocal(vW);
      float film = 0.;
      if (uVeil > 0.) {
        float hh = l0.y * uRad;                                  // height along the axis (m)
        float line = uVeilT * (uLen + .05);                      // the film's top edge falls as it drains
        float rivulets = tn(vec3(l0.x * 3., hh * 2.2 + uTime * 1.3, l0.z * 3. + uSeed)).x;   // running down: flow, not scrolling texture
        film = uVeil * smoothstep(line + .02, line - .04, hh + rivulets * .03);
        N = normalize(N + vec3(tn(vec3(l0 * 6. + vec3(0., uTime * 1.6, 0.))).xyz) * .08 * film);
      }
      float Fr = F0 + (1. - F0) * pow(1. - NV, 5.);
      Fr = mix(Fr, .02 + .98 * pow(1. - NV, 5.), film);
      vec3 Rr = reflect(rd, N);
      vec3 refl = nightEnv(Rr, .01) + lightGlint(vW, Rr, 600.) * .7;
      vec3 col;
      if (uMode > .5) {
        // the failure: a tinted body with an env reflection, no light inside: painted glass
        col = uTint * .02 + uGlowCol * uGlow * .05 + refl * Fr;
      } else {
        vec3 dir = refract(rd, N, 1. / IOR), pos = vW;
        float path = 0., thr = 1.;
        vec3 acc = vec3(0.);
        int legs = uMirrorPass > .5 ? 2 : 3;
        for (int leg = 0; leg < 3; leg++) {
          if (leg >= legs) break;
          float tmin = 1e9; vec3 ne = vec3(0., 1., 0.);
          for (int i = 0; i < ${MAXPL}; i++) {
            if (i >= uNPl) break;
            vec3 pn = uPl[i].xyz; float dn = dot(pn, dir);
            if (dn > 1e-4) { float t = (uPl[i].w - dot(pn, pos)) / dn; if (t < tmin) { tmin = t; ne = pn; } }
          }
          if (tmin > 50.) break;
          tmin = max(tmin, 0.);
          if (leg < 2 && uMirrorPass < .5) acc += inside(pos, dir, tmin) * thr * pow(uTint, vec3(path * 3.2));
          else if (leg < 2) acc += uGlowCol * uGlow * .1 * tmin / uRad * thr;                  // the mirror only needs the glow
          pos += dir * tmin; path += tmin;
          vec3 absb = pow(uTint, vec3(path * 5.5));                  // thin glass is clear; the thick body goes deep blue-green
          float ci = clamp(dot(dir, ne), 0., 1.);
          vec3 ex = refract(dir, -ne, IOR);
          // the far face's edges, seen through the stone: light caught along them
          float ed = 1e9;
          if (leg < 2 && uMirrorPass < .5) for (int i = 0; i < ${MAXPL}; i++) { if (i >= uNPl) break; vec3 pn = uPl[i].xyz; float c = dot(pn, ne); if (c > .995) continue; ed = min(ed, (uPl[i].w - dot(pn, pos)) * inversesqrt(max(1. - c * c, 1e-3))); }
          float edgeIn = exp(-ed / (.0035 + .004 * path));
          if (dot(ex, ex) < .5) {                                    // total internal reflection: the rule inside a crystal
            acc += absb * thr * edgeIn * (.012 + uGlow * .1) * mix(uGlowCol, vec3(.9, .98, 1.), .6);
            dir = reflect(dir, -ne);
            continue;
          }
          float ce = sqrt(max(1. - IOR * IOR * (1. - ci * ci), 0.));
          float Fe = F0 + (1. - F0) * pow(1. - ce, 5.);
          vec3 bg;
          if (leg == 0 && uMirrorPass < .5) {
            vec3 xR = refract(dir, -ne, IOR - .006), xB = refract(dir, -ne, IOR + .008);   // dispersion at the exit: quartz-small, so a bright point gets coloured fringes, not three discs
            if (dot(xR, xR) < .5) xR = ex; if (dot(xB, xB) < .5) xB = ex;
            bg = vec3(grabAt(pos, xR, .055).r, grabAt(pos, ex, .03).g, grabAt(pos, xB, .055).b);
            // three taps of a very bright small source (the moon) read as three coloured discs: keep the
            // split to a fringe by not letting one channel run far ahead of the middle one
            float gm = (bg.r + bg.g + bg.b) / 3. + .002; bg = clamp(bg, vec3(gm * .7), vec3(gm * 1.3));   // a fringe, never a coloured speck
          } else if (leg == 1) bg = grabAt(pos, ex, .012);
          else bg = nightEnv(ex, .1);
          bg += lightGlint(pos, ex, 140.) * .6;
          acc += absb * thr * (1. - Fe) * bg + absb * thr * edgeIn * (.008 + uGlow * .08 + dot(bg, vec3(.3))) * uGlowCol;
          thr *= Fe;
          dir = reflect(dir, -ne);
        }
        acc += thr * pow(uTint, vec3(path * 3.2)) * (nightEnv(dir, .2) + mix(uGlowCol, vec3(.9, .98, 1.), .5) * uGlow * .12);   // light still trapped inside
        col = acc * (1. - Fr) + refl * Fr;
      }
      // edges of the near face: a hairline of light where two facets meet
      float ed = 1e9;
      for (int i = 0; i < ${MAXPL}; i++) { if (i >= uNPl) break; vec3 pn = uPl[i].xyz; float c = dot(pn, N); if (c > .995) continue; ed = min(ed, (uPl[i].w - dot(pn, vW)) * inversesqrt(max(1. - c * c, 1e-3))); }
      float ew = max(fwidth(ed) * .55, 1e-5);                       // about a pixel: a hard 1 px catch-light, no outline band
      float edge = exp(-max(ed, 0.) / ew);
      vec3 Ne = normalize(N + V * .35);
      vec3 eRefl = nightEnv(reflect(rd, Ne), .05) * 1.6 + lightGlint(vW, reflect(rd, Ne), 40.) * .5;
      col += edge * eRefl * .6;
      // cracks reaching the surface just before it breaks
      if (uCrack > 0.) {
        // the fractures run up from the root as the stone gives: a hairline front climbing it, not a wireframe all at once
        float front = uCrack * 1.35 - l0.y * uRad / max(uLen, 1e-3);
        float cdS = crackDist(vW);
        float hair = exp(-max(cdS, 0.) / max(.0006, fwidth(cdS) * .5));
        float some = smoothstep(.45, .7, tn(vW * 7. + uSeed).x * .5 + .5);    // a fracture shows only where it catches the light
        col += vec3(.75, .96, 1.) * smoothstep(0., .25, front) * hair * some * (.06 + uGlow * .09);
      }
      // the water film's sheen and its bright draining edge
      float riv = smoothstep(.2, .9, tn(vec3(l0.x * 7., l0.y * uRad * 3. + uTime * 2.2, l0.z * 7. + uSeed)).y);   // rivulets running down
      col += film * ((refl * .6 + lightGlint(vW, Rr, 300.) * .5) * (.4 + riv) + uGlowCol * uGlow * .06 * riv);
      // rime where it came out of the ground
      float hy = vW.y - max(uGroundY, 0.);                         // height over the water (or the rock)
      float rime = uFrost * (1. - smoothstep(.0, .04 + .03 * tn(vec3(l0.xz * 4., 1.)).x, hy)) * smoothstep(.35, .55, tn(vec3(l0 * 16.)).y * .5 + .5 + (1. - smoothstep(0., .03, hy)) * .3);
      col = mix(col, vec3(.035, .06, .07) + uMoonCol * .006 + uGlowCol * uGlow * .1 + lightGlint(vW, N, 2.) * .08, rime * .8);
      gl_FragColor = vec4(col, 1.);
    }`;

  const crystals = [];
  function crystalHabit(r2, len, rad) {
    // local frame: axis +y, the ground near y = 0, the root buried below
    const planes = [];
    const rot = r2() * Math.PI / 3;
    const tipH = rad * (1.1 + r2() * 0.5);
    const apex = new V3((r2() - 0.5) * rad * 0.25, len + tipH, (r2() - 0.5) * rad * 0.25);
    const phi = 0.9 + r2() * 0.12;                            // face normal to axis, about 52 degrees: a quartz point
    for (let k = 0; k < 6; k++) {
      const a = rot + (k * Math.PI) / 3;
      planes.push({ n: new V3(Math.cos(a), 0, Math.sin(a)), d: rad * (1 + (r2() - 0.5) * 0.3), tag: 'prism' });
    }
    for (let k = 0; k < 6; k++) {
      const a = rot + (k * Math.PI) / 3;
      const n = new V3(Math.cos(a) * Math.sin(phi), Math.cos(phi), Math.sin(a) * Math.sin(phi));
      const off = (k % 2) * rad * (0.12 + r2() * 0.18) + r2() * rad * 0.05;   // alternating faces: the lopsided point
      planes.push({ n, d: n.dot(apex) - off, tag: 'tip' });
    }
    planes.push({ n: new V3(0, -1, 0), d: len * 0.5 + 0.2, tag: 'base' });
    return planes;
  }
  function facesToGeometry(faces, { bevelTags = ['bevel'], fracTag = 'frac', piece = -1 } = {}) {
    const pos = [], nrm = [], bev = [], bary = [], edgeM = [], frac = [], pc = [];
    for (const F of faces) {
      const nv = F.v.length;
      for (let i = 1; i < nv - 1; i++) {
        const tri = [F.v[0], F.v[i], F.v[i + 1]];
        // which triangle edges lie on the polygon's outline (for edge lines on shards)
        const e0 = 1, e1 = i === nv - 2 ? 1 : 0, e2 = i === 1 ? 1 : 0;   // edges opposite v0 (vi-vi+1), v1 (v0-vi+1), v2 (v0-vi)
        tri.forEach((p, k) => {
          pos.push(p.x, p.y, p.z); nrm.push(F.n.x, F.n.y, F.n.z);
          bev.push(bevelTags.includes(F.tag) ? 1 : 0);
          bary.push(k === 0 ? 1 : 0, k === 1 ? 1 : 0, k === 2 ? 1 : 0);
          edgeM.push(e0, e1, e2); frac.push(F.tag === fracTag ? 1 : 0); pc.push(piece);
        });
      }
    }
    return { pos, nrm, bev, bary, edgeM, frac, pc };
  }
  function bevelHull(faces, planes, width) {
    // a bevel plane on every edge between two faces: n = normalised sum, cut a hair in
    const out = [];
    for (let i = 0; i < faces.length; i++) for (let j = i + 1; j < faces.length; j++) {
      const A = faces[i], B = faces[j];
      if (A.tag === 'base' || B.tag === 'base' || A.tag === 'box' || B.tag === 'box') continue;
      const shared = A.v.filter((p) => B.v.some((q) => q.distanceToSquared(p) < 1e-10));
      if (shared.length < 2) continue;
      const n = new V3().addVectors(A.n, B.n).normalize();
      const m = shared[0].clone().add(shared[1]).multiplyScalar(0.5);
      out.push({ n, d: n.dot(m) - width, tag: 'bevel' });
    }
    return out;
  }
  const crystalShardMats = [];
  function createCrystal({ base, axis, length = 0.8, radius = 0.09, seed: cs = 1, tint = null, pieces = 7, spin = 0, groundY = 0 } = {}) {
    const r2 = mulberry32(cs * 7919 + 13);
    const planesL = crystalHabit(r2, length, radius);
    let faces = hullFromPlanes(V3, planesL, Math.max(4, length * 3));
    const bev = bevelHull(faces, planesL, radius * 0.022);
    for (const P of bev) faces = clipFaces(V3, faces, P.n, P.d, P.tag);
    const G = facesToGeometry(faces);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(G.nrm, 3));
    geo.setAttribute('aBev', new THREE.Float32BufferAttribute(G.bev, 1));
    const ax = axis.clone().normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(UP, ax);
    quat.multiply(new THREE.Quaternion().setFromAxisAngle(UP, spin));
    const tipTop = Math.max(...faces.flatMap((F) => F.v.map((p) => p.y)));
    const u = {
      ...envUniforms, ...lightUniforms, uTime: uniforms.uTime, tNoise: uniforms.tNoise, tGrab: uniforms.tGrab, uGrabAspect: uniforms.uGrabAspect, uMirrorPass: uniforms.uMirrorPass,
      uPl: { value: Array.from({ length: MAXPL }, () => new THREE.Vector4()) }, uNPl: { value: planesL.length },
      uOrigin: { value: new V3() }, uAxis: { value: ax.clone() }, uSide: { value: new V3(1, 0, 0).applyQuaternion(quat) },
      uLen: { value: length }, uRad: { value: radius }, uGlow: { value: 0 }, uVeil: { value: 0 }, uVeilT: { value: 1 }, uCrack: { value: 0 }, uMode: { value: 0 },
      uSeed: { value: R(0, 30) }, uFrost: { value: 0 }, uBand: { value: -1 }, uGroundY: { value: groundY },
      uSeeds: { value: Array.from({ length: 16 }, () => new THREE.Vector4()) }, uNSeeds: { value: 0 }, uStretch: { value: STRETCH },
      uCrk: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, -9, 0, 0.001)) }, uCrkN: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 1, 0, 0)) },
      // tint: transmittance per ~0.3 m of path: clear when thin, deep blue-green when thick
      uTint: { value: new V3().set(...(tint || [0.3, 0.66, 0.74])) }, uGlowCol: { value: new V3(0.5, 0.88, 1.0) },   // clear when thin, deep blue-green where thick; a cool white light
    };
    const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: CRYSTAL_VERT, fragmentShader: CRYSTAL_FRAG, extensions: { derivatives: true } });
    const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 10;
    mesh.layers.set(L_SOLID); mesh.layers.enable(L_MIRROR);
    mesh.quaternion.copy(quat);
    group.add(mesh);
    // fracture: Voronoi cells inside the part above the ground, clipped from the same hull
    const qInv = quat.clone().invert();
    const upL = UP.clone().applyQuaternion(qInv);
    const groundPlaneL = { n: upL.clone().negate(), d: base.y - groundY, tag: 'frac' };   // keep the part above the pool floor
    const seeds = [];
    const visLen = length + (tipTop - length) * 0.6;
    for (let k = 0; k < pieces; k++) {
      // a few big chunks and many slivers: seeds bunch toward the faces and the point
      const yy = visLen * Math.min(0.97, Math.pow(r2(), 0.8));
      const a = r2() * Math.PI * 2, rr = radius * (0.25 + 0.75 * Math.sqrt(r2()));
      seeds.push(new V3(Math.cos(a) * rr, yy, Math.sin(a) * rr));
    }
    const k2 = STRETCH * STRETCH, mnorm = (v) => v.x * v.x + k2 * v.y * v.y + v.z * v.z;
    const shardPieces = [];
    const outerPlanes = [...planesL, ...bev];
    for (let i = 0; i < seeds.length; i++) {
      let pf = hullFromPlanes(V3, [], Math.max(4, length * 3));
      for (const P of outerPlanes) pf = clipFaces(V3, pf, P.n, P.d, P.tag);
      pf = clipFaces(V3, pf, groundPlaneL.n, groundPlaneL.d, 'frac');
      for (let j = 0; j < seeds.length; j++) {
        if (j === i) continue;
        // the bisector with the axis squeezed: cells run long along the crystal
        const n = new V3().subVectors(seeds[j], seeds[i]); n.y *= k2;
        const d = (mnorm(seeds[j]) - mnorm(seeds[i])) * 0.5, ln = n.length();
        pf = clipFaces(V3, pf, n.multiplyScalar(1 / ln), d / ln, 'frac');
      }
      if (pf.length < 4) continue;
      const verts = [];
      for (const F of pf) for (const p of F.v) if (!verts.some((q) => q.distanceToSquared(p) < 1e-12)) verts.push(p);
      if (verts.length < 4) continue;
      const cen = verts.reduce((s, p) => s.add(p), new V3()).divideScalar(verts.length);
      for (const F of pf) F.v = F.v.map((p) => p.clone().sub(cen));
      const hull = verts.map((p) => p.clone().sub(cen));
      const rad = Math.max(...hull.map((p) => p.length()));
      const planes = pf.map((F) => ({ n: F.n.clone().normalize(), d: F.n.clone().normalize().dot(F.v[0]) }));
      shardPieces.push({ faces: pf, cenL: cen, hull, rad, planes });
    }
    // fracture discs (local): mostly steep, through the body, a few near the root
    const cracksL = Array.from({ length: 8 }, () => {
      const y = (Math.pow(r2(), 0.8) * 0.9 + 0.03) * length;
      const c = new V3((r2() - 0.5) * radius * 0.9, y, (r2() - 0.5) * radius * 0.9);
      const n = new V3(r2() - 0.5, (r2() - 0.5) * 1.4, r2() - 0.5).normalize();
      return { c, n, r: radius * (0.5 + r2() * 0.9) };
    });
    const C = {
      cracksL,
      mesh, u, base: base.clone(), axis: ax, quat, length, radius, tipTop, planesL, grow: 0, glow: 0, veil: 0, veilT: 1, crack: 0, frost: 0,
      visible: false, shattered: false, seedsL: seeds, pieces: shardPieces, shard: null,
      get rise() { return (1 - this.grow) * (this.tipTop + 0.06); },
    };
    C.shard = createShardSet(C);
    crystals.push(C);
    return C;
  }
  function updateCrystals() {
    for (const C of crystals) {
      const vis = C.visible && !C.shattered && C.grow > 0.001;
      C.mesh.visible = vis;
      if (!vis) continue;
      C.mesh.position.copy(C.base).addScaledVector(C.axis, -C.rise);
      C.mesh.updateMatrixWorld();
      const u = C.u;
      for (let i = 0; i < C.planesL.length; i++) {
        const P = C.planesL[i];
        _a.copy(P.n).applyQuaternion(C.quat);
        u.uPl.value[i].set(_a.x, _a.y, _a.z, P.d + _a.dot(C.mesh.position));
      }
      u.uOrigin.value.copy(C.mesh.position);
      u.uGlow.value = C.glow; u.uBand.value = C.band ?? -1; u.uVeil.value = C.veil; u.uVeilT.value = C.veilT; u.uCrack.value = C.crack; u.uFrost.value = C.frost;
      u.uMode.value = options.crystal === 'flat' ? 1 : 0;
      C.cracksL.forEach((K, k) => {
        _a.copy(K.c).applyQuaternion(C.quat).add(C.mesh.position); u.uCrk.value[k].set(_a.x, _a.y, _a.z, K.r);
        _b.copy(K.n).applyQuaternion(C.quat); u.uCrkN.value[k].set(_b.x, _b.y, _b.z, 0);
      });
      u.uNSeeds.value = Math.min(16, C.seedsL.length);              // the fracture cells show inside as hairline planes
      for (let k = 0; k < u.uNSeeds.value; k++) { _a.copy(C.seedsL[k]).applyQuaternion(C.quat).add(C.mesh.position); u.uSeeds.value[k].set(_a.x, _a.y, _a.z, 0); }
    }
  }

  // ---------------------------------------------------------------- shards: rigid pieces that fall, bounce and rest
  const SHARD_VERT = /* glsl */`
    attribute vec3 aBary; attribute vec3 aEdgeM; attribute float aFrac; attribute float aPiece;
    uniform vec4 uPP[16]; uniform vec4 uPQ[16];
    varying vec3 vW; varying vec3 vN; varying vec3 vBary; varying vec3 vEdgeM; varying float vFrac; varying float vPiece;
    vec3 qrot(vec4 q, vec3 v){ return v + 2. * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
    void main(){
      int k = int(aPiece + .5);
      vec4 P = uPP[k], Q = uPQ[k];
      vec3 w = qrot(Q, position * P.w) + P.xyz;
      vW = w; vN = qrot(Q, normal); vBary = aBary; vEdgeM = aEdgeM; vFrac = aFrac; vPiece = aPiece;
      gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
    }`;
  const SHARD_FRAG = NOISE_GLSL + TNOISE_GLSL + ENV_GLSL + LIGHTS_GLSL + GRAB_GLSL + /* glsl */`
    uniform vec3 uTint, uGlowCol; uniform float uGlow, uRad;
    varying vec3 vW; varying vec3 vN; varying vec3 vBary; varying vec3 vEdgeM; varying float vFrac; varying float vPiece;
    void main(){
      vec3 V = normalize(cameraPosition - vW), rd = -V, N = normalize(vN);
      if (dot(N, V) < 0.) N = -N;
      // fresh breaks are conchoidal: faint ripples across the fracture faces
      if (vFrac > .5) N = normalize(N + tn(vW * 41. + vPiece * 3.1).xyz * .05);
      float NV = clamp(dot(N, V), 0., 1.);
      float F = .05 + .95 * pow(1. - NV, 5.);
      vec3 Rr = reflect(rd, N);
      vec3 refl = nightEnv(Rr, .01) + lightGlint(vW, Rr, 120.) * .35;
      // through the piece: a thin prism bends the ray away from the face it entered
      vec3 tr = refract(rd, N, 1. / 1.57);
      vec3 ex = normalize(rd + (rd - tr) * .9);
      float th = uRad * (.6 + NV);
      vec3 bg = grabAt(vW + tr * th, ex, .018) + lightGlint(vW, ex, 24.) * .12;   // the stones behind, bent through it; the lights only as a soft wash
      vec3 absb = pow(uTint, vec3(th * 2.));
      float pg = uGlow * (.4 + .6 * fract(sin(vPiece * 12.9898) * 43758.5453));     // each piece keeps its own share of the light
      // an internal bounce off a back facet (its tilt differs per piece): each face catches a different
      // piece of the sky, the moon or a light, which is what makes broken glass sparkle
      vec3 hb = fract(sin(vec3(vPiece * 7.13, vPiece * 3.71 + 1.3, vPiece * 5.29 + 2.7)) * 43758.5453) - .5;
      vec3 bn = normalize(-N + hb * 1.3);
      vec3 ib = reflect(tr, bn);
      vec3 inner = nightEnv(ib, .03) * 2.2 + lightGlint(vW, ib, 16.) * .25 + uMoonCol * pow(max(dot(ib, uMoonDir), 0.), 60.) * .4;
      vec3 col = (bg * absb * 1.1 + inner * absb * .5) * (1. - F) + refl * F + uGlowCol * pg * .012 * (1. - F);
      // edges catch what the bevel-less break reflects: thin, and only where there is light to catch
      vec3 fw = fwidth(vBary);
      vec3 e3 = vBary / max(fw * 1.2, 1e-5) + (1. - vEdgeM) * 1e3;
      float e = 1. - smoothstep(0., 1., min(min(e3.x, e3.y), e3.z));
      vec3 Ne = normalize(N + V * .3);
      vec3 eR = reflect(rd, Ne);
      float mg = pow(max(dot(eR, uMoonDir), 0.), 24.);
      col += e * (nightEnv(eR, .04) * .25 + uMoonCol * mg * .3 + lightGlint(vW, eR, 30.) * .9 + uGlowCol * pg * .03);
      col += uMoonCol * pow(max(dot(Rr, uMoonDir), 0.), 300.) * .5 * F;     // a facet turned to the moon flashes
      gl_FragColor = vec4(col, 1.);
    }`;
  const shardSets = [];
  function createShardSet(C) {
    const pos = [], nrm = [], bary = [], edgeM = [], frac = [], pc = [];
    C.pieces.slice(0, MAXPIECE).forEach((P, k) => {
      const G = facesToGeometry(P.faces, { piece: k });
      pos.push(...G.pos); nrm.push(...G.nrm); bary.push(...G.bary); edgeM.push(...G.edgeM); frac.push(...G.frac); pc.push(...G.pc);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    geo.setAttribute('aBary', new THREE.Float32BufferAttribute(bary, 3));
    geo.setAttribute('aEdgeM', new THREE.Float32BufferAttribute(edgeM, 3));
    geo.setAttribute('aFrac', new THREE.Float32BufferAttribute(frac, 1));
    geo.setAttribute('aPiece', new THREE.Float32BufferAttribute(pc, 1));
    const u = {
      ...envUniforms, ...lightUniforms, tNoise: uniforms.tNoise, tGrab: uniforms.tGrab, uGrabAspect: uniforms.uGrabAspect, uMirrorPass: uniforms.uMirrorPass,
      uPP: { value: Array.from({ length: MAXPIECE }, () => new THREE.Vector4(0, -10, 0, 1)) }, uPQ: { value: Array.from({ length: MAXPIECE }, () => new THREE.Vector4(0, 0, 0, 1)) },
      uTint: C.u.uTint, uGlowCol: C.u.uGlowCol, uGlow: { value: 0 }, uRad: { value: C.radius * 0.6 },
    };
    const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: SHARD_VERT, fragmentShader: SHARD_FRAG, extensions: { derivatives: true } });
    const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.visible = false; mesh.renderOrder = 11;
    mesh.layers.set(L_SOLID); mesh.layers.enable(L_MIRROR);
    group.add(mesh);
    const bodies = C.pieces.slice(0, MAXPIECE).map((P) => ({
      P, x: new V3(), q: new THREE.Quaternion(), v: new V3(), w: new V3(), s: 1, sleep: false, still: 0, age: 0, rest: false,
      inertia: 0.4 * P.rad * P.rad * 0.6,
    }));
    const S = { mesh, u, bodies, active: false, age: 0, melt: 0 };
    shardSets.push(S);
    return S;
  }
  // break a crystal: every piece takes the crystal's pose, then flies out from `center`
  function shatter(C, { center = null, strength = 1, up = 1.4 } = {}) {
    if (C.shattered) return;
    updateCrystals();
    C.shattered = true; C.mesh.visible = false;
    const S = C.shard; S.active = true; S.age = 0; S.melt = 0; S.mesh.visible = true;
    const cen = center || C.base;
    for (const B of S.bodies) {
      B.x.copy(B.P.cenL).applyQuaternion(C.quat).add(C.mesh.position);
      B.q.copy(C.quat); B.s = 1; B.sleep = false; B.still = 0; B.age = 0; B.rest = false;
      _a.subVectors(B.x, cen); _a.y = 0; const d = _a.length() + 0.05; _a.multiplyScalar(1 / d);
      const k = strength * R(0.7, 1.35);
      B.v.set(_a.x * R(1.2, 2.8) * k, R(0.8, 2.0) * up * k * (0.5 + B.x.y * 0.5), _a.z * R(1.2, 2.8) * k).add(_b.set(R(-0.6, 0.6), 0, R(-0.6, 0.6)));
      B.w.set(R(-1, 1), R(-1, 1), R(-1, 1)).multiplyScalar(R(3, 9) * Math.min(1.6, 0.05 / Math.max(B.P.rad, 0.01)));
    }
    S.u.uGlow.value = Math.min(1.2, C.glow * 0.6);
  }
  const _r = new V3(), _vc = new V3(), _imp = new V3(), _tmp = new V3(), _cs = new V3(), _wq = new THREE.Quaternion();
  function stepBody(B, h) {
    if (B.sleep) return;
    B.v.y -= 9.8 * h;
    B.v.multiplyScalar(Math.exp(-0.05 * h));
    B.w.multiplyScalar(Math.exp(-0.6 * h));
    B.x.addScaledVector(B.v, h);
    const wl = B.w.length();
    if (wl > 1e-6) { _wq.setFromAxisAngle(_tmp.copy(B.w).divideScalar(wl), wl * h); B.q.premultiply(_wq).normalize(); }
    // contacts: the corners below the ground act as one contact at their average point, with
    // restitution and friction. Per-corner impulses over-rotated pieces lying on a face into a jitter;
    // the average lies under a face (no spurious torque) or on an edge (so a balanced piece tips).
    // each corner against the ground right under it (the rock is lumpy: a plane at the centre let
    // corners sink into the next lump)
    const H = B.P.hull, gap = B.gap || (B.gap = new Float32Array(H.length));
    let deepest = 0, nC = 0, near = 0;
    _cs.set(0, 0, 0);
    for (let k = 0; k < H.length; k++) {
      _r.copy(H[k]).multiplyScalar(B.s).applyQuaternion(B.q);
      const y = B.x.y + _r.y - fx.groundAt(B.x.x + _r.x, B.x.z + _r.z);
      gap[k] = y;
      if (y < 0) { nC++; deepest = Math.min(deepest, y); }
    }
    // the contact is every corner within 1.5 mm of the lowest: a face lying on the stone pushes back
    // through its middle, not through whichever corner dipped first
    if (nC > 0) for (let k = 0; k < H.length; k++) {
      if (gap[k] < deepest + 0.0015) { near++; _cs.add(_r.copy(H[k]).multiplyScalar(B.s).applyQuaternion(B.q)); }
    }
    if (nC > 0) {
      _r.copy(_cs).divideScalar(near);
      _vc.copy(B.w).cross(_r).add(B.v);
      if (_vc.y < 0) {
        const rn = _tmp.copy(_r).cross(UP);
        const kN = 1 + rn.lengthSq() / B.inertia;
        const e = Math.abs(_vc.y) > 0.8 ? 0.3 : 0;
        const jn = -(1 + e) * _vc.y / kN;
        _imp.set(0, jn, 0);
        const vt = _tmp.set(_vc.x, 0, _vc.z); const vtl = vt.length();
        if (vtl > 1e-6) {
          const rt = _a.copy(_r).cross(_b.copy(vt).divideScalar(vtl));
          const kT = 1 + rt.lengthSq() / B.inertia;
          const jt = Math.min(vtl / kT, 0.5 * jn);
          _imp.addScaledVector(vt, -jt / vtl);
        }
        B.v.add(_imp);
        B.w.add(_b.copy(_r).cross(_imp).divideScalar(B.inertia));
        B.w.multiplyScalar(Math.exp(-(nC >= 3 ? 16 : 7) * h));   // rolling resistance: a piece settles instead of rocking
        if (nC >= 3 && Math.abs(_vc.y) < 0.3) { B.v.x *= Math.exp(-10 * h); B.v.z *= Math.exp(-10 * h); }
      }
    }
    if (deepest < 0) B.x.y -= deepest;
    if (nC === 0) for (let k = 0; k < H.length; k++) if (gap[k] < 0.0015) near++;
    B.nC = near;
    // wet shingle grips: a piece lying on several corners loses what little motion it has left
    if (near >= 3 && B.v.lengthSq() < 0.03 && B.w.lengthSq() < 1.5) { B.v.multiplyScalar(Math.exp(-14 * h)); B.w.multiplyScalar(Math.exp(-22 * h)); }
    const slow = B.v.lengthSq() < 0.001 && B.w.lengthSq() < 0.05 && (near >= 3 || B.support) && !B.pen;
    B.still = slow ? B.still + h : 0;
    B.age += h;
    if (B.still > 0.3 || (B.age > 6 && B.v.lengthSq() < 0.002 && B.w.lengthSq() < 0.1 && !B.pen)) { B.sleep = true; B.rest = true; B.justSlept = true; B.v.set(0, 0, 0); B.w.set(0, 0, 0); if (!B.support) B.x.y = restY(B); }
  }
  // the ground (terrain) is the host's: fx.groundAt(x, z) -> height; flat y = 0 by default
  function groundPlane(B) {
    const g = fx.groundAt, x = B.x.x, z = B.x.z;
    B.g0 = g(x, z); B.gx = (g(x + 0.04, z) - B.g0) / 0.04; B.gz = (g(x, z + 0.04) - B.g0) / 0.04;
  }
  // the centre height that puts the piece's lowest corner (measured against the ground under each
  // corner) exactly on the ground
  function restY(B) {
    let shift = -1e9;
    for (const hv of B.P.hull) { _r.copy(hv).multiplyScalar(B.s).applyQuaternion(B.q); shift = Math.max(shift, fx.groundAt(B.x.x + _r.x, B.x.z + _r.z) - (B.x.y + _r.y)); }
    return B.x.y + shift;
  }
  function lowest(B) {
    let lo = 1e9;
    for (const hv of B.P.hull) { _r.copy(hv).multiplyScalar(B.s).applyQuaternion(B.q); lo = Math.min(lo, _r.y); }
    return lo;
  }
  // a piece's corners and planes in the world, refreshed before each contact pass
  function bodyWorld(B) {
    const H = B.P.hull, PL = B.P.planes;
    if (!B.wv) { B.wv = H.map(() => new V3()); B.wn = PL.map(() => new V3()); B.wd = new Float32Array(PL.length); }
    for (let i = 0; i < H.length; i++) B.wv[i].copy(H[i]).multiplyScalar(B.s).applyQuaternion(B.q).add(B.x);
    for (let i = 0; i < PL.length; i++) { B.wn[i].copy(PL[i].n).applyQuaternion(B.q); B.wd[i] = PL[i].d * B.s + B.wn[i].dot(B.x); }
  }
  // corners of A inside B: push apart along B's least-penetrated face, and stop them closing
  function contactPair(A, B) {
    let best = 0, bn = null;
    for (const v of A.wv) {
      let sd = -1e9, sn = null;
      for (let j = 0; j < B.wn.length; j++) { const d = B.wn[j].dot(v) - B.wd[j]; if (d > sd) { sd = d; sn = B.wn[j]; } if (sd > 0) break; }
      if (sd < 0 && -sd > best) { best = -sd; bn = sn; }
    }
    if (!bn) return false;
    if (best > 0.002) { A.pen = B.pen = true; }
    if (A.sleep && B.sleep) { if (best > 0.002) { (A.x.y > B.x.y ? A : B).sleep = false; } return true; }   // a resting pair that overlaps: the upper one moves
    const wa = A.sleep ? 0 : B.sleep ? 1 : 0.5, wb = 1 - wa;
    A.x.addScaledVector(bn, best * wa); B.x.addScaledVector(bn, -best * wb);
    const vn = _a.subVectors(A.v, B.v).dot(bn);
    if (vn < 0) { A.v.addScaledVector(bn, -vn * wa); B.v.addScaledVector(bn, vn * wb); }
    if (bn.y > 0.5) A.support = true; else if (bn.y < -0.5) B.support = true;
    return true;
  }
  const pairs = [];
  function updateShards(dt) {
    const all = [];
    for (const S of shardSets) {
      if (!S.active) { S.mesh.visible = false; continue; }
      S.age += dt;
      S.mesh.visible = true;
      for (const B of S.bodies) all.push(B);
    }
    if (dt > 0 && all.length) {
      // candidate pairs once a frame: bounding spheres that could touch within this frame
      pairs.length = 0;
      for (const B of all) B.inPair = false;
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
        const A = all[i], B = all[j];
        if (A.sleep && B.sleep && !A.checkPair && !B.checkPair) continue;
        const rr = A.P.rad * A.s + B.P.rad * B.s + (A.v.length() + B.v.length()) * dt + 0.01;
        if (A.x.distanceToSquared(B.x) < rr * rr) { pairs.push(A, B); A.inPair = B.inPair = true; }
      }
      const sub = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / sub;
      for (let s = 0; s < sub; s++) {
        for (const B of all) { B.support = false; stepBody(B, h); B.pen = false; }
        if (pairs.length) for (let it = 0; it < 2; it++) {
          for (const B of all) if (B.inPair && (!B.sleep || !B.wv || B.checkPair)) bodyWorld(B);
          for (let k = 0; k < pairs.length; k += 2) {
            const A = pairs[k], B = pairs[k + 1];
            if (A.sleep && B.sleep && !A.checkPair && !B.checkPair) continue;
            contactPair(A, B); contactPair(B, A);
          }
        }
        for (const B of all) B.checkPair = false;
      }
      // a piece that just fell asleep is checked against its resting neighbours once more next frame
      for (const B of all) if (B.sleep && B.justSlept) { B.checkPair = true; B.justSlept = false; }
    }
    for (const S of shardSets) {
      if (!S.active) continue;
      S.bodies.forEach((B, k) => {
        // melting: the piece shrinks into the stone, its lowest corner kept on the ground
        if (S.melt > 0) { B.s = Math.max(0.001, 1 - S.melt); if (B.sleep) B.x.y = restY(B); }
        S.u.uPP.value[k].set(B.x.x, B.x.y, B.x.z, B.s);
        S.u.uPQ.value[k].set(B.q.x, B.q.y, B.q.z, B.q.w);
      });
      S.u.uGlow.value *= Math.exp(-dt * 0.45);              // the broken stone keeps its light a while
      if (S.melt >= 1) { S.active = false; S.mesh.visible = false; }
    }
  }

  // ---------------------------------------------------------------- pressure fronts: refraction only
  const ringGeo = new THREE.PlaneGeometry(2, 2, 1, 1);
  const fronts = [];
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
    const m = new THREE.Mesh(ringGeo, dm); m.layers.set(L_DISTORT); m.visible = false; m.frustumCulled = false;
    group.add(m);
    fronts.push({ m, dm, alive: false, age: 0, life: 0.4, R: 2, thick: 0.05, amp: 0.02, center: new V3(), q: new THREE.Quaternion(), delay: 0 });
  }
  function front(center, normal, { radius = 2.5, thick = 0.06, life = 0.4, amp = 0.025, delay = 0 } = {}) {
    const G = fronts.find((r) => !r.alive) || fronts.reduce((o, r) => (r.age / r.life > o.age / o.life ? r : o));
    G.alive = true; G.age = -delay; G.life = life; G.R = radius; G.thick = thick; G.amp = amp;
    G.center.copy(center); G.q.setFromUnitVectors(ZAXIS, _a.copy(normal).normalize());
  }
  const easeOutExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
  function viewUnits(p) {
    const d = Math.max(0.2, _c.copy(p).sub(camera.position).dot(camera.getWorldDirection(_d)));
    return 2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5);
  }
  function updateFronts(dt) {
    for (const G of fronts) {
      if (!G.alive) continue;
      G.age += dt;
      if (G.age > G.life) { G.alive = false; G.m.visible = false; continue; }
      if (G.age < 0) { G.m.visible = false; continue; }
      const x = G.age / G.life, r = Math.max(0.05, G.R * easeOutExpo(x));
      G.m.visible = true; G.m.position.copy(G.center); G.m.quaternion.copy(G.q); G.m.scale.set(r, r, r);
      G.dm.uniforms.uThick.value = Math.min(0.45, G.thick / r * (1 + x * 1.5));
      G.dm.uniforms.uAmp.value = G.amp / viewUnits(G.center) * Math.pow(1 - x, 1.2);
    }
  }

  // ---------------------------------------------------------------- impact frames
  const imp = { active: false, t: 0, frame: 'none', flash: 0, shake: 0, mode: 'axial', dir: new THREE.Vector2(0, 1), fisheye: 0, dim: 0, at: new V3() };
  const flashLog = [];
  function impact({ hold = 0.08, frame = 'center', flash = 0, shake = 0.01, shakeMode = 'axial', shakeDir = null, fisheye = 0, at = null } = {}) {
    const now = clock.real;
    while (flashLog.length && now - flashLog[0] > 1) flashLog.shift();
    const inverts = frame !== 'none' || flash > 0;
    const safe = options.flashes === 'safe' || (inverts && flashLog.length >= 3);   // at most 3 flashes in any second
    if (inverts && !safe) flashLog.push(now);
    imp.active = true; imp.t = 0;
    compositeMat.uniforms.uSeed.value = rnd() * 100;
    imp.frame = safe ? 'none' : frame; imp.flash = safe ? 0 : flash; imp.dim = safe && inverts ? 0.32 : 0;
    imp.shake = shake * options.shake; imp.mode = shakeMode; imp.fisheye = fisheye * options.fisheye;
    if (shakeDir) imp.dir.copy(shakeDir).normalize(); else imp.dir.set(0, 1);
    if (at) imp.at.copy(at);
    clock.hold = Math.max(clock.hold, hold);
  }

  // ---------------------------------------------------------------- post
  const BLOOM_LEVELS = 5;
  const down = [], up = [];
  for (let i = 0; i < BLOOM_LEVELS; i++) {
    down.push(new THREE.WebGLRenderTarget(1, 1, { ...rtOpts, depthBuffer: false }));
    up.push(new THREE.WebGLRenderTarget(1, 1, { ...rtOpts, depthBuffer: false }));
  }
  const copyMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: null } }, vertexShader: FS_VERT,
    fragmentShader: `uniform sampler2D tSrc; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tSrc, vUv); }`,
    depthTest: false, depthWrite: false,
  });
  // four-point star glints: only the brightest specular points (water highlights, the moon in a facet)
  // throw thin cross streaks, built at half resolution from the bloom's prefiltered buffer
  const rtStar = new THREE.WebGLRenderTarget(1, 1, { ...rtOpts, depthBuffer: false });
  const starMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } },
    vertexShader: FS_VERT,
    fragmentShader: /* glsl */`
      uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
      vec3 hot(vec2 uv){ vec3 c = texture2D(tSrc, uv).rgb; float b = max(c.r, max(c.g, c.b)); return c * max(b - 2.2, 0.) / max(b, 1e-3); }
      void main(){
        vec3 acc = vec3(0.);
        for (int i = 1; i <= 14; i++) {
          float f = float(i), w = exp(-f * .2) / f * 1.2;
          vec2 a = vec2(f, 0.) * uTexel * 1.5, b = vec2(0., f) * uTexel * 1.5;
          acc += (hot(vUv + a) + hot(vUv - a) + hot(vUv + b) + hot(vUv - b)) * w;
        }
        gl_FragColor = vec4(min(acc, vec3(30.)), 1.);
      }`,
    depthTest: false, depthWrite: false,
  });
  const prefilterMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: null }, uHalf: { value: new THREE.Vector2() }, uThreshold: { value: 1.3 }, uKnee: { value: 0.6 } },
    vertexShader: FS_VERT,
    fragmentShader: /* glsl */`
      uniform sampler2D tSrc; uniform vec2 uHalf; uniform float uThreshold, uKnee; varying vec2 vUv;
      vec3 pick(vec2 uv){
        vec3 c = texture2D(tSrc, uv).rgb; float br = max(c.r, max(c.g, c.b));
        float soft = clamp(br - uThreshold + uKnee, 0., 2. * uKnee); soft = soft * soft / (4. * uKnee + 1e-4);
        return c * min(max(soft, br - uThreshold), .55) / max(br, 1e-4);   // capped: a small bright disc does not swell into a ball
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
      tColor: { value: rtColor.texture }, tDistort: { value: rtDistort.texture }, tBloom: { value: up[0].texture }, tStar: { value: rtStar.texture }, uStar: { value: 0.05 },
      uAspect: { value: 1 }, uBloom: { value: 0.26 }, uBloomTint: { value: new V3(0.82, 0.92, 1.0) }, uExposure: { value: 1.45 },
      uShake: { value: new THREE.Vector2() }, uZoom: { value: 1 }, uFisheye: { value: 0 },
      uFrame: { value: 0 }, uFrameFull: { value: 0 }, uNegRadius: { value: 0.3 }, uCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uFlash: { value: 0 }, uDim: { value: 0 }, uTime: { value: 0 }, uGrain: { value: 0.007 }, uVignette: { value: 0.3 }, uSeed: { value: 0 },
    },
    vertexShader: FS_VERT,
    fragmentShader: /* glsl */`
      uniform sampler2D tColor, tDistort, tBloom, tStar; uniform float uStar;
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
        vec4 D = texture2D(tDistort, uv);
        vec2 d = D.xy; d.x /= uAspect;
        vec3 col = texture2D(tColor, uv + d).rgb;
        col += texture2D(tBloom, uv + d).rgb * uBloom * uBloomTint + texture2D(tStar, uv).rgb * uStar;
        vec2 vq0 = vUv - .5; col *= 1. - uVignette * dot(vq0, vq0) * 1.6;   // in linear light, before the curve: the moon still clips
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
          vec3 neg = mix(vec3(.86, .97, 1.) * (.965 + .035 * paper), vec3(.006, .02, .026), ink);   // teal ink on pale water-paper
          col = mix(col, mix(col * .3, neg, m), uFrame);
        }
        col = mix(col, vec3(.9, .98, 1.), uFlash);
        col *= 1. - uDim;
        col = srgb(clamp(col, 0., 1.));
        gl_FragColor = vec4(col, 1.);
      }`,
    depthTest: false, depthWrite: false,
  });

  // FXAA on the finished image (the colour target is HalfFloat without MSAA: crystal and orb edges stair-step),
  // then the film grain, so the grain is never smeared
  const rtLDR = new THREE.WebGLRenderTarget(1, 1, { type: THREE.UnsignedByteType, format: THREE.RGBAFormat, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  const fxaaMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: rtLDR.texture }, uTexel: { value: new THREE.Vector2() }, uTime: compositeMat.uniforms.uTime, uGrain: compositeMat.uniforms.uGrain },
    vertexShader: FS_VERT,
    fragmentShader: /* glsl */`
      uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uTime, uGrain; varying vec2 vUv;
      void main(){
        vec3 nw = texture2D(tSrc, vUv + vec2(-1., -1.) * uTexel).rgb, ne = texture2D(tSrc, vUv + vec2(1., -1.) * uTexel).rgb;
        vec3 sw = texture2D(tSrc, vUv + vec2(-1., 1.) * uTexel).rgb, se = texture2D(tSrc, vUv + vec2(1., 1.) * uTexel).rgb;
        vec3 m = texture2D(tSrc, vUv).rgb;
        vec3 lw = vec3(.299, .587, .114);
        float lnw = dot(nw, lw), lne = dot(ne, lw), lsw = dot(sw, lw), lse = dot(se, lw), lm = dot(m, lw);
        float lmin = min(lm, min(min(lnw, lne), min(lsw, lse))), lmax = max(lm, max(max(lnw, lne), max(lsw, lse)));
        vec2 dir = vec2(-((lnw + lne) - (lsw + lse)), (lnw + lsw) - (lne + lse));
        float red = max((lnw + lne + lsw + lse) * .03125, 1. / 128.);
        float rcp = 1. / (min(abs(dir.x), abs(dir.y)) + red);
        dir = clamp(dir * rcp, vec2(-8.), vec2(8.)) * uTexel;
        vec3 a = .5 * (texture2D(tSrc, vUv + dir * (1. / 3. - .5)).rgb + texture2D(tSrc, vUv + dir * (2. / 3. - .5)).rgb);
        vec3 b = a * .5 + .25 * (texture2D(tSrc, vUv - dir * .5).rgb + texture2D(tSrc, vUv + dir * .5).rgb);
        float lb = dot(b, lw);
        vec3 col = (lb < lmin || lb > lmax) ? a : b;
        float g = fract(sin(dot(vUv * vec2(1931., 1087.) + floor(uTime * 24.) * vec2(17., 31.), vec2(12.9898, 78.233))) * 43758.5453);
        gl_FragColor = vec4(col + (g - .5) * uGrain, 1.);
      }`,
    depthTest: false, depthWrite: false,
  });
  let W = 1, H = 1, pendingDt = 0;
  function setSize(width, height, pixelRatio = 1) {
    W = Math.max(1, Math.round(width)); H = Math.max(1, Math.round(height)); dpr = pixelRatio;
    res.set(W, H); uniforms.uDpr.value = dpr;
    rtColor.setSize(W, H); rtGrab.setSize(W, H); rtLDR.setSize(W, H); rtStar.setSize(Math.ceil(W / 2), Math.ceil(H / 2)); starMat.uniforms.uTexel.value.set(2 / W, 2 / H); fxaaMat.uniforms.uTexel.value.set(1 / W, 1 / H);
    rtDistort.setSize(Math.ceil(W / 2), Math.ceil(H / 2));
    rtMirror.setSize(Math.ceil(W / 2), Math.ceil(H / 2));   // the pools mirror the crystals and the streams crisply
    let w = Math.ceil(W / 2), h = Math.ceil(H / 2);
    for (let i = 0; i < BLOOM_LEVELS; i++) { down[i].setSize(w, h); up[i].setSize(w, h); w = Math.max(1, Math.ceil(w / 2)); h = Math.max(1, Math.ceil(h / 2)); }
    compositeMat.uniforms.uAspect.value = W / H;
    uniforms.uGrabAspect.value = W / H;
  }

  const _proj = new V3();
  function updateImpact(realDt) {
    const U = compositeMat.uniforms;
    let shakeX = 0, shakeY = 0, zoom = 1, fish = 0, frame = 0, flash = 0, dim = 0;
    if (imp.active) {
      if (clock.hold > 0) {
        frame = imp.frame !== 'none' ? 1 : 0; fish = imp.fisheye; dim = imp.dim;
        if (imp.mode === 'radial') zoom = 1 + imp.shake * 1.2;
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

  function updateLights(dt) {
    for (let i = 0; i < NL; i++) {
      const L = lights[i];
      if (L.held) L.energy += (L.target - L.energy) * (1 - Math.exp(-dt * 8));   // held lights swell and settle
      else L.energy *= Math.exp(-L.decay * dt);
      lightCol[i].set(L.color.r, L.color.g, L.color.b).multiplyScalar(L.energy);
    }
  }
  function updateSpots(dt) {
    for (let i = 0; i < NRIP; i++) {
      const r = rip[i];
      if (!r.alive) { ripA[i].w = 0; continue; }
      r.age += dt;
      if (r.age > r.life) { r.alive = false; ripA[i].w = 0; continue; }
      if (r.age < 0) { ripA[i].w = 0; continue; }
      const fadeOut = 1 - Math.max(0, (r.age - r.life * 0.7) / (r.life * 0.3));   // no pop when the slot recycles
      ripA[i].z = r.age; ripA[i].w = ripA[i].userSlope * fadeOut;
    }
    frostState.forEach((f, k) => {
      if (!f.alive) { frost[k].w = 0; return; }
      f.age += dt;
      const g = 1 - Math.pow(1 - Math.min(1, f.age / f.grow), 3);
      const fade = 1 - Math.max(0, (f.age - f.life * 0.45) / (f.life * 0.55));
      if (f.age > f.life) { f.alive = false; frost[k].w = 0; return; }
      frost[k].z = Math.max(0.001, f.R * g); frost[k].w = Math.max(0, fade);
    });
    foamState.forEach((f, k) => {
      if (!f.alive) { foam[k].w = -1; return; }
      f.age += dt;
      if (f.age > f.life) { f.alive = false; foam[k].w = -1; return; }
      foam[k].z = f.R; foam[k].w = f.age / f.life;
    });
  }

  function updateDroplets(dt) {
    let n = 0;
    const mat = camera.matrixWorldInverse;
    for (let i = 0; i < MAXDROP; i++) {
      if (!drp.alive[i]) continue;
      const i3 = i * 3;
      drp.age[i] += dt;
      if (drp.age[i] > drp.life[i]) { drp.alive[i] = 0; continue; }
      const dg = Math.exp(-drp.drag[i] * dt);
      drp.v[i3] *= dg; drp.v[i3 + 2] *= dg; drp.v[i3 + 1] = drp.v[i3 + 1] * dg - 9.8 * drp.grav[i] * dt;
      if (drp.kind[i] === 1 && vortexField.on) {
        // drops caught in the gathering vortex: wound round its axis, drawn in and up, swallowed by the orb
        const V = vortexField, dx = drp.p[i3] - V.center.x, dz = drp.p[i3 + 2] - V.center.z, rr = Math.hypot(dx, dz) + 1e-3;
        const dy = V.center.y - drp.p[i3 + 1];
        drp.v[i3] += (-dz / rr * V.swirl - dx / rr * V.pull) * dt; drp.v[i3 + 2] += (dx / rr * V.swirl - dz / rr * V.pull) * dt;
        drp.v[i3 + 1] += (V.lift * Math.sign(dy) * Math.min(1, Math.abs(dy) * 2)) * dt;
        // swallowed by the orb, or flung wide of it at its height (they would hang in the sky as specks): gone
        if (Math.hypot(dx, dy, dz) < V.radius || rr > 1.2 || (dy < 0.12 && rr > V.radius * 2.2)) { drp.alive[i] = 0; continue; }
        const sp = Math.hypot(drp.v[i3], drp.v[i3 + 1], drp.v[i3 + 2]); if (sp > 2.2) { const k = 2.2 / sp; drp.v[i3] *= k; drp.v[i3 + 1] *= k; drp.v[i3 + 2] *= k; }   // swallowed, or flung out of the vortex: gone, never a stray speck in the sky
      }
      drp.p[i3] += drp.v[i3] * dt; drp.p[i3 + 1] += drp.v[i3 + 1] * dt; drp.p[i3 + 2] += drp.v[i3 + 2] * dt;
      const gy = drp.p[i3 + 1] < 0.25 ? fx.groundAt(drp.p[i3], drp.p[i3 + 2]) : -1;
      if (drp.p[i3 + 1] <= Math.max(gy, 0)) {                // a drop that lands rings the water it lands in (not the rock)
        drp.alive[i] = 0;
        if (gy < 0 && drp.rip[i] > 0 && rnd() < drp.rip[i]) ripple(_a.set(drp.p[i3], 0, drp.p[i3 + 2]), { slope: 0.1 + drp.size[i] * 30, speed: 0.22 + drp.size[i] * 20, wavelength: 0.018 + drp.size[i] * 3, decay: 2.2, width: 0.012, life: 1.3, small: true });
        continue;
      }
      const fade = Math.min(1, drp.age[i] / 0.04) * Math.min(1, (drp.life[i] - drp.age[i]) / 0.2);
      const ex = 1 / 45;                                         // exposure: the streak is how far it moved in that time
      iDP[n * 3] = drp.p[i3]; iDP[n * 3 + 1] = drp.p[i3 + 1]; iDP[n * 3 + 2] = drp.p[i3 + 2];
      iDT[n * 3] = drp.p[i3] - drp.v[i3] * ex; iDT[n * 3 + 1] = drp.p[i3 + 1] - drp.v[i3 + 1] * ex; iDT[n * 3 + 2] = drp.p[i3 + 2] - drp.v[i3 + 2] * ex;
      iDS[n * 2] = drp.size[i]; iDS[n * 2 + 1] = fade * (drp.kind[i] === 2 ? 3.6 : 1);
      n++;
    }
    drpGeo.instanceCount = n;
    for (const k of ['iPos', 'iTail', 'iS']) { const a = drpGeo.getAttribute(k); a.needsUpdate = true; a.addUpdateRange?.(0, n * a.itemSize); }
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
    if (clock.hold > 0) { clock.hold = Math.max(0, clock.hold - realDt); simDt = 0; }
    else simDt = realDt * clock.base * clock.rampValue;
    clock.sim += simDt; pendingDt += simDt;
    uniforms.uTime.value = clock.sim;
    clock.tickAcc += simDt;
    let ticks = 0;
    while (clock.tickAcc >= 1 / 30 && ticks < 3) {
      clock.tickAcc -= 1 / 30; ticks++;
      for (let i = repeats.length - 1; i >= 0; i--) { const r = repeats[i]; r.fn(); if (--r.ticks <= 0) repeats.splice(i, 1); }
    }
    if (ticks === 3) clock.tickAcc = 0;
    updateFronts(simDt);
    updateCrowns(simDt);
    updateSpots(simDt);
    updateLights(simDt);
    updateImpact(realDt);
    return simDt;
  }

  // the wet ground's mirror: a virtual camera under y = 0 with an oblique near plane (three's Reflector)
  const mcam = new THREE.PerspectiveCamera();
  const _rp = new V3(), _cp = new V3(), _look = new V3(), _tg = new V3(), _rm = new THREE.Matrix4(), _plane = new THREE.Plane(), _clip = new THREE.Vector4(), _qq = new THREE.Vector4();
  const NUP = new V3(0, 1, 0);
  function updateMirrorCamera() {
    camera.updateMatrixWorld();
    _cp.setFromMatrixPosition(camera.matrixWorld);
    _rp.set(0, 0, 0);
    const view = _a.subVectors(_rp, _cp); view.reflect(NUP).negate(); view.add(_rp);
    _rm.extractRotation(camera.matrixWorld);
    _look.set(0, 0, -1).applyMatrix4(_rm).add(_cp);
    _tg.subVectors(_rp, _look).reflect(NUP).negate().add(_rp);
    mcam.position.copy(view);
    mcam.up.set(0, 1, 0).applyMatrix4(_rm).reflect(NUP);
    mcam.lookAt(_tg);
    mcam.far = camera.far; mcam.near = camera.near;
    mcam.updateMatrixWorld();
    mcam.projectionMatrix.copy(camera.projectionMatrix);
    mirrorMat.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    mirrorMat.multiply(mcam.projectionMatrix).multiply(mcam.matrixWorldInverse);
    _plane.setFromNormalAndCoplanarPoint(NUP, _rp).applyMatrix4(mcam.matrixWorldInverse);
    _clip.set(_plane.normal.x, _plane.normal.y, _plane.normal.z, _plane.constant);
    const pm = mcam.projectionMatrix.elements;
    _qq.x = (Math.sign(_clip.x) + pm[8]) / pm[0]; _qq.y = (Math.sign(_clip.y) + pm[9]) / pm[5]; _qq.z = -1; _qq.w = (1 + pm[10]) / pm[14];
    _clip.multiplyScalar(2 / _clip.dot(_qq));
    pm[2] = _clip.x; pm[6] = _clip.y; pm[10] = _clip.z + 1; pm[14] = _clip.w;
    mcam.projectionMatrixInverse.copy(mcam.projectionMatrix).invert();
  }

  let grabTwice = false;
  const _sp = new V3();
  // the second copy is needed only where water lies over a crystal on screen
  function needGrab2() {
    if (!grabTwice) return false;
    const O = orbs.find((o) => o.mesh.visible);
    const water = O || tubes.some((t) => t.mesh.visible) || crowns.some((c) => c.alive);
    if (!water) return false;
    if (!crystals.some((C) => C.mesh.visible) && !shardSets.some((S) => S.active)) return false;
    if (!O || tubes.some((t) => t.mesh.visible) || crowns.some((c) => c.alive)) return true;
    _sp.copy(O.position).project(camera); const ox = _sp.x, oy = _sp.y;
    const orr = O.radius * 1.3 / Math.max(0.1, camera.position.distanceTo(O.position) * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5));
    for (const C of crystals) {
      if (!C.mesh.visible) continue;
      for (const k of [0, 1]) {
        _sp.copy(C.mesh.position).addScaledVector(C.axis, k * C.tipTop).project(camera);
        if (Math.abs(_sp.x - ox) * camera.aspect < orr + 0.15 && Math.abs(_sp.y - oy) < orr + 0.3) return true;
      }
    }
    return false;
  }
  function render() {
    const dt = pendingDt; pendingDt = 0;
    if (fx.debug.noRip) for (const v of ripA) v.w = 0;
    if (fx.debug.noCaus) for (const v of caus) v.w = 0;
    updateOrbs(dt);
    updateDroplets(dt);
    updateShards(dt);
    updateCrystals();
    for (const T of tubes) buildTube(T);
    const prevTarget = renderer.getRenderTarget();
    const prevMask = camera.layers.mask, prevAuto = renderer.autoClear;
    renderer.autoClear = false;
    renderer.getClearColor(_col); const prevAlpha = renderer.getClearAlpha();
    const mark = fx.mark || (() => {});                // optional profiler hook: mark(label) between passes
    // 1. the mirror: effects only, over transparent black (the ground adds the sky itself)
    mark('mirror');
    updateMirrorCamera();
    uniforms.uMirrorPass.value = 1; res.set(rtMirror.width, rtMirror.height);
    mcam.layers.set(L_MIRROR);
    renderer.setClearColor(0x000000, 0); renderer.setRenderTarget(rtMirror); renderer.clear();
    if (!fx.debug.noMirror) renderer.render(scene, mcam);
    uniforms.uMirrorPass.value = 0; res.set(W, H);
    // 2. the world, then a copy of it for everything that refracts
    mark('world');
    renderer.setClearColor(_col, 1); renderer.setRenderTarget(rtColor); renderer.clear();
    camera.layers.set(0); renderer.render(scene, camera);
    mark('grab');
    copyMat.uniforms.tSrc.value = rtColor.texture; pass(copyMat, rtGrab);
    renderer.setRenderTarget(rtColor);
    mark('solid');
    camera.layers.set(L_SOLID); renderer.render(scene, camera);
    mark('grab2');
    if (needGrab2() && !fx.debug.noGrab2) { copyMat.uniforms.tSrc.value = rtColor.texture; pass(copyMat, rtGrab); renderer.setRenderTarget(rtColor); }
    mark('water');
    camera.layers.set(L_WATER); renderer.render(scene, camera);
    mark('part');
    camera.layers.set(L_PART); renderer.render(scene, camera);
    // 3. the distortion buffer
    mark('post');
    camera.layers.set(L_DISTORT);
    renderer.setClearColor(0x000000, 0); renderer.setRenderTarget(rtDistort); renderer.clear(); renderer.render(scene, camera);
    camera.layers.mask = prevMask;
    renderer.setClearColor(_col, prevAlpha);
    // 4. bloom and the composite
    prefilterMat.uniforms.tSrc.value = rtColor.texture; prefilterMat.uniforms.uHalf.value.set(0.5 / W, 0.5 / H);
    pass(prefilterMat, down[0]);
    starMat.uniforms.tSrc.value = down[0].texture; pass(starMat, rtStar);
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
    mark('end');
    renderer.autoClear = prevAuto;
  }

  function warmup() {
    const hidden = [];
    group.traverse((o) => { if (o.isMesh && !o.visible) { hidden.push(o); o.visible = true; } });
    const prev = renderer.getRenderTarget(), mask = camera.layers.mask;
    renderer.setRenderTarget(rtColor);
    camera.layers.enableAll();
    renderer.compile(scene, camera);
    for (const m of [copyMat, prefilterMat, starMat, downMat, upMat, compositeMat]) { fsMesh.material = m; renderer.compile(fsScene, fsCam); }
    renderer.setRenderTarget(null); fsMesh.material = fxaaMat; renderer.compile(fsScene, fsCam);
    renderer.setRenderTarget(prev); camera.layers.mask = mask;
    for (const o of hidden) o.visible = false;
  }

  const fx = {
    groundAt: () => 0,
    debug: {}, options, palette, group, post: compositeMat.uniforms, uniforms, envUniforms, lightUniforms, groundUniforms, mirrorUniforms, moonDir: MOON,
    get time() { return clock.sim; }, get realTime() { return clock.real; }, get holding() { return clock.hold > 0; },
    get timeScale() { return clock.base; }, set timeScale(v) { clock.base = v; },
    get rampValue() { return clock.rampValue; },
    set grabTwice(v) { grabTwice = v; },
    lights, setLight, flashLight, ripple, caus, causCol, addFrost, addFoam, wet,
    drop, spray, crown, front, vortexField, impact, ramp, repeat,
    createOrb, createTube, createCrystal, shatter, crystals, shardSets, orbs, tubes,
    update, render, setSize, warmup,
    dropList: () => { const o = []; for (let i = 0; i < MAXDROP; i++) if (drp.alive[i]) o.push([drp.p[i * 3], drp.p[i * 3 + 1], drp.p[i * 3 + 2], drp.v[i * 3], drp.v[i * 3 + 1], drp.v[i * 3 + 2], drp.kind[i], drp.age[i]]); return o; },
    stats: () => ({ drops: drpGeo.instanceCount, crystals: crystals.filter((c) => c.mesh.visible).length, shards: shardSets.filter((s) => s.active).length, ripples: rip.filter((r) => r.alive).length }),
  };
  return fx;
}
