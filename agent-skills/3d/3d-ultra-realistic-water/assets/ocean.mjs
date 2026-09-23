// Ultra-realistic open-ocean water for Three.js (r150+, WebGL2).
// Extracted from the Pirate Ship Sunset scene. Pass in the project's own THREE
// namespace; nothing here imports a second copy of three.js.
//
//   const waves = createWaves({ direction: 1.22 });
//   const detail = bakeOceanDetail(THREE, renderer);
//   const ocean = createOcean(THREE, { waves, detailTexture: detail, skyCube, sunDirection });
//   scene.add(ocean.mesh);
//   // per frame:
//   waves.update(dt); ocean.update({ time, camera });
//
// Units are metres and seconds. Colours are linear and HDR; tone-map afterwards.

const TAU = Math.PI * 2;

// [wavelength m, amplitude m, heading offset deg, steepness Q]
// Wavelengths step by ~0.63, amplitude ≈ L/100 → L/155, headings alternate around the wind.
// Sum of Q is 0.77: keep it under 1 or the crests fold through themselves.
export const WAVE_SPECTRUM = [
  [78, 0.8, 0, 0.17],
  [47, 0.52, 23, 0.15],
  [31, 0.3, -17, 0.13],
  [19, 0.18, 38, 0.11],
  [12.3, 0.105, -31, 0.08],
  [7.7, 0.06, 12, 0.06],
  [4.9, 0.034, -49, 0.04],
  [3.1, 0.02, 64, 0.03],
];

// ---------------------------------------------------------------------------
// Waves: the one spectrum shared by the GPU surface and CPU buoyancy queries.

export function createWaves({ direction = 1.22, spectrum = WAVE_SPECTRUM, gravity = 9.81 } = {}) {
  const list = spectrum.map(([L, A, deg, Q], i) => {
    const k = TAU / L;
    const heading = direction + (deg * Math.PI) / 180;
    return {
      L, A, Q, k,
      omega: Math.sqrt(gravity * k), // deep-water dispersion
      dx: Math.sin(heading),
      dz: Math.cos(heading),
      QA: Q / k, // horizontal (choppy) displacement
      seed: (i * 2.39) % TAU,
    };
  });
  const count = list.length;
  const sumQ = list.reduce((s, w) => s + w.Q, 0);
  const out = { x: 0, y: 0, z: 0 };

  return {
    list,
    count,
    windX: Math.sin(direction),
    windZ: Math.cos(direction),
    uPhase: new Float32Array(count),
    time: 0,
    // Floating-origin offset. When the world is rebased, add the shift here.
    offX: 0,
    offZ: 0,
    amplitude: 1,
    steepness: 1,

    // Scale the sea state. Steepness follows but is capped so ΣQ stays below 0.95.
    setSeaState(scale) {
      this.amplitude = scale;
      this.steepness = Math.min(scale, 0.95 / sumQ);
    },

    // Phases are wrapped to [0, 2π) on the CPU so the GPU never sees a large sin() argument.
    update(dt) {
      this.time += dt;
      for (let i = 0; i < count; i++) {
        const w = list[i];
        let ph = w.k * (w.dx * this.offX + w.dz * this.offZ) - w.omega * this.time + w.seed;
        ph %= TAU;
        if (ph < 0) ph += TAU;
        this.uPhase[i] = ph;
      }
    },

    // Displacement of the undisplaced surface point (x, z).
    disp(x, z, o = out) {
      let dx = 0, dy = 0, dz = 0;
      const a = this.amplitude, q = this.steepness;
      for (let i = 0; i < count; i++) {
        const w = list[i];
        const th = w.k * (w.dx * x + w.dz * z) + this.uPhase[i];
        const s = Math.sin(th), c = Math.cos(th);
        dy += w.A * a * s;
        dx += w.QA * q * w.dx * c;
        dz += w.QA * q * w.dz * c;
      }
      o.x = dx; o.y = dy; o.z = dz;
      return o;
    },

    // Water height at world (x, z). Gerstner moves points sideways, so invert the
    // horizontal displacement with a few fixed-point steps before reading y.
    height(x, z) {
      let px = x, pz = z;
      for (let i = 0; i < 4; i++) {
        this.disp(px, pz, out);
        px = x - out.x;
        pz = z - out.z;
      }
      return this.disp(px, pz, out).y;
    },
  };
}

// ---------------------------------------------------------------------------
// Geometry: exponential rings centred on the camera, ~84k vertices out to ~12 km.

export function createOceanGeometry(THREE, { rings = 210, segments = 400 } = {}) {
  const pos = [0, 0, 0];
  const idx = [];
  const radius = (i) => 11.92 * (Math.exp(0.033 * i) - 1);
  for (let i = 1; i <= rings; i++) {
    const r = radius(i);
    for (let j = 0; j < segments; j++) {
      const a = (j / segments) * TAU;
      pos.push(Math.cos(a) * r, 0, Math.sin(a) * r);
    }
  }
  for (let j = 0; j < segments; j++) idx.push(0, 1 + ((j + 1) % segments), 1 + j);
  for (let i = 1; i < rings; i++) {
    const a = 1 + (i - 1) * segments;
    const b = 1 + i * segments;
    for (let j = 0; j < segments; j++) {
      const h = (j + 1) % segments;
      idx.push(a + j, a + h, b + j, a + h, b + h, b + j);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}

// ---------------------------------------------------------------------------
// Detail texture, baked once: RG = tileable micro-normal, B = foam lattice, A = fbm.

const NOISE_GLSL = /* glsl */ `
float hash11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vnoiseP(vec2 p, vec2 per){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  vec2 i0 = mod(i, per), i1 = mod(i + 1.0, per);
  return mix(mix(hash21(i0), hash21(vec2(i1.x, i0.y)), u.x), mix(hash21(vec2(i0.x, i1.y)), hash21(i1), u.x), u.y);
}
float fbmP(vec2 p, vec2 per){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += a * vnoiseP(p, per); p *= 2.0; per *= 2.0; a *= 0.5; } return s / 0.97; }
`;

const DETAIL_GLSL = /* glsl */ `
varying vec2 vUv;
float worley(vec2 p, float per){
  vec2 i = floor(p), f = fract(p);
  float d1 = 9.0, d2 = 9.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){
    vec2 g = vec2(x, y);
    vec2 o = hash22(mod(i + g, per));
    vec2 r = g + o - f;
    float d = dot(r, r);
    if (d < d1){ d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return sqrt(d2) - sqrt(d1);
}
void main(){
  vec2 uv = vUv;
  // micro-normal: 48 sines with integer wave vectors, so the tile repeats seamlessly
  vec2 g = vec2(0.0);
  for (int i = 0; i < 48; i++){
    float fi = float(i);
    vec2 h = hash22(vec2(fi * 1.37, 7.1));
    float ang = h.x * 6.2831;
    float kmag = floor(3.0 + pow(h.y, 1.6) * 44.0);
    vec2 k = floor(vec2(cos(ang), sin(ang)) * kmag + 0.5);
    if (dot(k, k) < 1.0) k = vec2(3.0, 1.0);
    float amp = 1.0 / pow(length(k), 1.35);
    float ph = hash11(fi * 9.7) * 6.2831;
    float th = dot(k, uv) * 6.2831 + ph;
    g += k * amp * cos(th);
  }
  g *= 0.9;
  vec3 n = normalize(vec3(-g * 0.22, 1.0));
  // foam lattice: cell edges from two Worley octaves plus a bubble layer
  vec2 warp = vec2(fbmP(uv * 4.0, vec2(4.0)), fbmP(uv * 4.0 + 0.37, vec2(4.0))) - 0.5;
  vec2 wu = uv + warp * 0.09;
  float w1 = worley(wu * 9.0, 9.0);
  float w2 = worley(wu * 21.0 + 3.0, 21.0);
  float w3 = worley(uv * 47.0 + 7.0, 47.0);
  float lace = (1.0 - smoothstep(0.0, 0.2, w1)) * (0.6 + 0.4 * vnoiseP(uv * 36.0, vec2(36.0)));
  lace = max(lace, (1.0 - smoothstep(0.0, 0.24, w2)) * 0.7);
  float bubbles = smoothstep(0.35, 0.5, w3) * 0.35;
  float body = fbmP(wu * 7.0, vec2(7.0));
  float foam = clamp(lace * 0.75 + body * 0.75 - 0.12 + bubbles * (1.0 - lace), 0.0, 1.0);
  float nz = fbmP(uv * 5.0 + 11.0, vec2(5.0));
  gl_FragColor = vec4(n.xy * 0.5 + 0.5, foam, nz);
}`;

export function bakeOceanDetail(THREE, renderer, { size = 512 } = {}) {
  const target = new THREE.WebGLRenderTarget(size, size, {
    type: THREE.UnsignedByteType,
    depthBuffer: false,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.RepeatWrapping,
    wrapT: THREE.RepeatWrapping,
    colorSpace: THREE.NoColorSpace, // data, not colour
  });
  target.texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const material = new THREE.ShaderMaterial({
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: NOISE_GLSL + DETAIL_GLSL,
    depthTest: false,
    depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(quad);
  const prev = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  renderer.render(scene, new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1));
  renderer.setRenderTarget(prev);
  material.dispose();
  quad.geometry.dispose();
  return target.texture;
}

// ---------------------------------------------------------------------------
// Gerstner sum with analytic partial derivatives and a per-wave footprint fade.

const gerstnerGLSL = (count) => /* glsl */ `
#define NW ${count}
uniform vec4 uWaveDir[NW];   // dx, dz, k, A
uniform vec4 uWaveQ[NW];     // QA, L
uniform float uWavePhase[NW];
uniform float uAmp, uSteep, uFootprint;

// A wave shorter than ~2-5x the sampling footprint cannot be represented; fade it out.
vec3 gerstner(vec2 p, float footprint, out vec3 dPdx, out vec3 dPdz, out float crest){
  footprint *= uFootprint;
  vec3 d = vec3(0.0);
  dPdx = vec3(1.0, 0.0, 0.0);
  dPdz = vec3(0.0, 0.0, 1.0);
  crest = 0.0;
  for (int i = 0; i < NW; i++){
    vec4 w = uWaveDir[i];
    float L = uWaveQ[i].y;
    float fade = 1.0 - smoothstep(L * 0.18, L * 0.5, footprint);
    if (fade <= 0.0) continue;
    float A = w.w * fade * uAmp;
    float QA = uWaveQ[i].x * fade * uSteep;
    float th = w.z * dot(w.xy, p) + uWavePhase[i];
    float s = sin(th), c = cos(th);
    d.y += A * s;
    d.x += QA * w.x * c;
    d.z += QA * w.y * c;
    float kA = w.z * A, kQA = w.z * QA;
    dPdx.x -= kQA * w.x * w.x * s;
    dPdx.y += kA * w.x * c;
    dPdx.z -= kQA * w.x * w.y * s;
    dPdz.x -= kQA * w.x * w.y * s;
    dPdz.y += kA * w.y * c;
    dPdz.z -= kQA * w.y * w.y * s;
    crest += kQA * s;
  }
  return d;
}
`;

const hullGLSL = (n, zMin, zMax) => /* glsl */ `
uniform vec4 uShip;          // x, z, forward.x, forward.z
uniform float uHullW[${n}];  // hull half-width at the waterline, sampled along its length
uniform float uBowZ;
float hullHalf(float lz){
  float f = clamp((lz - ${zMin.toFixed(1)}) / ${(zMax - zMin).toFixed(1)} * ${(n - 1).toFixed(1)}, 0.0, ${(n - 1.001).toFixed(3)});
  int i = int(floor(f));
  return mix(uHullW[i], uHullW[i + 1], fract(f));
}
`;

const DEFAULT_HAZE_GLSL = /* glsl */ `
uniform vec3 uHazeColor;
vec3 oceanHaze(vec3 dir){ return uHazeColor; }
`;

/**
 * @param THREE the project's three.js namespace
 * @param o.waves        createWaves() result
 * @param o.detailTexture bakeOceanDetail() result
 * @param o.skyCube      cube texture rendered from the same sky shader the page draws
 * @param o.sunDirection Vector3, normalised, pointing at the sun
 * @param o.hazeGLSL     optional GLSL defining `vec3 oceanHaze(vec3 dir)`; may declare uSunDir
 * @param o.hazeUniforms uniforms that hazeGLSL needs (shared objects are fine)
 * @param o.wake         optional createWake() result
 * @param o.hull         optional { halfWidths:number[], zMin, zMax, bowZ } in ship-local metres
 */
export function createOcean(THREE, {
  waves,
  detailTexture,
  skyCube,
  sunDirection = new THREE.Vector3(0.66, 0.1, 0.745).normalize(),
  hazeGLSL = DEFAULT_HAZE_GLSL,
  hazeUniforms = {},
  wake = null,
  hull = null,
  sunColor = new THREE.Vector3(4.2, 2.3, 1.1),
  ambient = new THREE.Vector3(0.22, 0.18, 0.28),
  deepColor = new THREE.Vector3(0.006, 0.03, 0.048),
  scatterColor = new THREE.Vector3(0.035, 0.3, 0.27),
  foamColor = new THREE.Vector3(0.92, 0.9, 0.86),
  fogDensity = 28e-5,
  geometry,
} = {}) {
  const vec4s = (fn) => waves.list.map((w) => new THREE.Vector4(...fn(w)));
  const hullN = hull ? hull.halfWidths.length : 2;
  const uniforms = {
    ...hazeUniforms,
    uWaveDir: { value: vec4s((w) => [w.dx, w.dz, w.k, w.A]) },
    uWaveQ: { value: vec4s((w) => [w.QA, w.L, 0, 0]) },
    uWavePhase: { value: waves.uPhase },
    uAmp: { value: 1 },
    uSteep: { value: 1 },
    uFootprint: { value: 1 },    // 0 disables the footprint fade (for comparison only)
    uPixelNormals: { value: 1 }, // 0 shades with per-vertex normals (for comparison only)
    uGridCenter: { value: new THREE.Vector3() },
    uDetail: { value: detailTexture },
    uDetOffA: { value: new THREE.Vector2() },
    uDetOffB: { value: new THREE.Vector2() },
    uFoamOff: { value: new THREE.Vector2() },
    uFoamOff2: { value: new THREE.Vector2() },
    uSkyCube: { value: skyCube },
    uRefl: { value: null },
    uReflMat: { value: new THREE.Matrix4() },
    uWake: { value: wake ? wake.rt.texture : null },
    uWakeCenter: wake ? wake.uniforms.uCenter : { value: new THREE.Vector2() },
    uWakeSpan: wake ? wake.uniforms.uSpan : { value: 1 },
    uShip: { value: new THREE.Vector4(0, 0, 0, 1) },
    uHullW: { value: hull ? hull.halfWidths.slice() : [0, 0] },
    uBowZ: { value: hull ? hull.bowZ : 0 },
    uSunColor: { value: sunColor },
    uAmbient: { value: ambient },
    uDeep: { value: deepColor },
    uSSS: { value: scatterColor },
    uFoamCol: { value: foamColor },
    uTime: { value: 0 },
    uFogK: { value: fogDensity },
    uHazeColor: hazeUniforms.uHazeColor || { value: new THREE.Vector3(0.95, 0.55, 0.45) },
  };
  if (!uniforms.uSunDir) uniforms.uSunDir = { value: sunDirection };
  const declareSun = /\buniform\s+vec3\b[^;]*\buSunDir\b/.test(hazeGLSL) ? '' : 'uniform vec3 uSunDir;\n';

  const defines = {};
  if (wake) defines.OCEAN_WAKE = '';
  if (hull) defines.OCEAN_HULL = '';
  const HULL = hull ? hullGLSL(hullN, hull.zMin, hull.zMax) : '';
  const GERSTNER = gerstnerGLSL(waves.count);

  const vertexShader = GERSTNER + HULL + /* glsl */ `
    uniform vec3 uGridCenter;
    varying vec3 vWorld;
    varying vec2 vBase;
    varying float vHeight;
    varying vec3 vVertexNormal;
    void main(){
      vec3 p = position + vec3(uGridCenter.x, 0.0, uGridCenter.z);
      float r = length(position.xz);
      float spacing = 0.033 * (r + 12.0); // ring spacing of the exponential grid
      vec3 dx, dz; float crest;
      vec3 d = gerstner(p.xz, spacing * 1.2, dx, dz, crest);
      vVertexNormal = normalize(cross(dz, dx));
    #ifdef OCEAN_HULL
      // bow wave hump and a shallow trough along the hull
      vec2 rel = p.xz - uShip.xy;
      vec2 fw = uShip.zw;
      float lz = dot(rel, fw);
      float lx = dot(rel, vec2(fw.y, -fw.x));
      float hw = hullHalf(lz);
      float out_ = abs(lx) - hw;
      float bz_ = (lz - (uBowZ - 3.0)) / 5.0; float bo_ = max(out_, 0.0) / 2.6;
      float bow = exp(-bz_ * bz_) * exp(-bo_ * bo_);
      float along = smoothstep(-16.0, -6.0, lz) * smoothstep(12.0, 4.0, lz) * exp(-max(out_, 0.0) * max(out_, 0.0) / 9.0);
      d.y += bow * 0.55 - along * 0.18;
    #endif
      vec3 wp = p + d;
      vBase = p.xz;
      vWorld = wp;
      vHeight = d.y;
      gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
    }`;

  const fragmentShader = GERSTNER + declareSun + hazeGLSL + HULL + /* glsl */ `
    uniform sampler2D uDetail, uRefl, uWake;
    uniform samplerCube uSkyCube;
    uniform vec2 uDetOffA, uDetOffB, uFoamOff, uFoamOff2, uWakeCenter;
    uniform float uWakeSpan, uTime, uFogK, uPixelNormals;
    uniform mat4 uReflMat;
    uniform vec3 uSunColor, uAmbient, uDeep, uSSS, uFoamCol;
    varying vec3 vWorld;
    varying vec2 vBase;
    varying float vHeight;
    varying vec3 vVertexNormal;
    void main(){
      vec3 P = vWorld;
      vec3 toCam = cameraPosition - P;
      float dist = length(toCam);
      vec3 V = toCam / dist;
      // per-pixel footprint in world metres
      vec2 fw2 = fwidth(vBase);
      float foot = max(fw2.x + fw2.y, 1e-3);
      vec3 dPdx, dPdz; float crest;
      vec3 disp = gerstner(vBase, foot * 2.0, dPdx, dPdz, crest);
      vec3 N = normalize(cross(dPdz, dPdx));
      if (uPixelNormals < 0.5) N = normalize(vVertexNormal);
      float J = dPdx.x * dPdz.z - dPdx.z * dPdz.x; // Jacobian: < 1 where the surface bunches into a crest

    #ifdef OCEAN_WAKE
      vec2 wuv = (vBase - uWakeCenter) / uWakeSpan + 0.5;
      float inW = step(0.0, wuv.x) * step(wuv.x, 1.0) * step(0.0, wuv.y) * step(wuv.y, 1.0);
      vec4 wk = texture2D(uWake, wuv) * inW;
      float te = 1.0 / 512.0;
      float khx = texture2D(uWake, wuv + vec2(te, 0.0)).a * inW - wk.a;
      float khz = texture2D(uWake, wuv + vec2(0.0, te)).a * inW - wk.a;
      float texM = uWakeSpan / 512.0;
      N = normalize(N + vec3(-khx, 0.0, -khz) / texM * 0.9);
    #else
      vec4 wk = vec4(0.0);
    #endif

      // detail normals: two scrolling octaves, faded with distance
      vec2 dA = texture2D(uDetail, vBase / 19.0 + uDetOffA).xy * 2.0 - 1.0;
      vec2 dB = texture2D(uDetail, vec2(vBase.y, -vBase.x) / 7.3 + uDetOffB).xy * 2.0 - 1.0;
      float calm = 1.0 - 0.6 * wk.b;
      float dStr = (0.4 * exp(-dist / 500.0) + 0.08) * calm;
      vec2 dn = (dA * 0.65 + vec2(-dB.y, dB.x) * 0.45) * dStr;
      vec3 Nd = normalize(N + vec3(dn.x, 0.0, dn.y));

      vec3 L = uSunDir;
      float NdV = max(dot(Nd, V), 0.0);
      float F = 0.02 + 0.98 * pow(clamp(1.0 - NdV, 0.0, 1.0), 5.0); // Schlick, water F0 = 0.02
      vec3 R = reflect(-V, Nd);
      R.y = abs(R.y) + 0.002;
      vec3 skyR = textureCube(uSkyCube, R).rgb;

      // planar reflection of the ship and islands, nudged by the surface normal
      vec4 rc = uReflMat * vec4(vBase.x, 0.0, vBase.y, 1.0);
      vec2 ruv = rc.xy / rc.w + Nd.xz * vec2(0.06, 0.03) * clamp(30.0 / dist, 0.2, 1.0);
      vec4 refl = texture2D(uRefl, ruv);
      vec3 reflection = mix(skyR * vec3(0.82, 0.9, 1.0), refl.rgb, refl.a * 0.9);

      // water body: deep colour + sun-lit subsurface through the wave crests
      vec2 lh = normalize(L.xz);
      float toward = pow(max(dot(-V.xz / max(length(V.xz), 1e-4), lh), 0.0), 2.0);
      float hgt = smoothstep(-0.6, 1.0, vHeight);
      float face = clamp(1.0 - N.y, 0.0, 1.0);
      float sss = (0.25 + 0.75 * toward) * hgt * (0.35 + face * 4.0);
      vec3 body = uDeep * (1.0 + uAmbient * 2.0) + uSSS * sss * (0.4 + 0.6 * max(dot(N, L), 0.0) + toward * 0.6);
      body += uSSS * 0.08 * wk.g; // aerated wake water is lighter
      vec3 col = mix(body, reflection, F);

      // sun glitter: a broad sheen plus sharp HDR sparkles for the bloom to catch
      float rl = max(dot(R, L), 0.0);
      float sheen = pow(rl, 90.0) * 1.2 + pow(rl, 12.0) * 0.06;
      float sp = pow(rl, 1400.0) * 40.0;
      vec3 spec = uSunColor * (sheen + sp) * mix(1.0, 0.4, wk.g);

      // foam mask
      float hullFoam = 0.0;
    #ifdef OCEAN_HULL
      vec2 rel = vBase - uShip.xy;
      vec2 fw = uShip.zw;
      float lz = dot(rel, fw);
      float lx = dot(rel, vec2(fw.y, -fw.x));
      float hw = hullHalf(lz);
      float outD = abs(lx) - hw;
      if (lz > uBowZ - 1.0) outD = max(outD, length(vec2(lx, lz - (uBowZ - 1.0))) - 0.2);
      if (lz < -15.0) outD = max(outD, (-15.0 - lz));
      float bowF = smoothstep(2.0, 15.0, lz);
      // foam hugs the hull line from both sides (the true waterline moves with roll and heave)
      float band = 0.55 + bowF * 1.5 + smoothstep(-8.0, -15.0, lz) * 0.8;
      hullFoam = exp(-abs(outD) / band) * (0.5 + 0.5 * bowF) * step(lz, uBowZ + 6.0);
      float fromBow = uBowZ - lz;
      float bowWave = smoothstep(-2.0, 1.5, fromBow) * smoothstep(16.0, 3.0, fromBow) * exp(-max(outD, 0.0) / (1.2 + max(fromBow, 0.0) * 0.22));
      hullFoam = max(hullFoam, bowWave * 0.95);
    #endif
      float crestFoam = smoothstep(0.6, 0.28, J) * smoothstep(0.2, 0.75, vHeight + 0.3);
      vec4 ft = texture2D(uDetail, vBase / 9.0 + uFoamOff);
      vec4 ft2 = texture2D(uDetail, vBase / 3.3 + uFoamOff2);
      float pattern = ft.b * 0.72 + ft2.b * 0.28;
      float wash = wk.g;
      float mask = clamp(max(max(crestFoam * 0.7, hullFoam), max(wk.r * 0.7, wash * 0.92)), 0.0, 1.0);
      // threshold the lattice by the mask: foam breaks into lace instead of fading to grey
      float foam = smoothstep(1.0 - mask, 1.0 - mask + 0.2, pattern * 0.88 + mask * 0.22);
      foam *= smoothstep(1600.0, 250.0, dist);
      // milky aerated water under and around the foam
      float aer = clamp(wash * 0.9 + hullFoam * 0.55 + wk.r * 0.35 + crestFoam * 0.2, 0.0, 1.0) * smoothstep(0.0, 0.7, ft.a + 0.25);
      vec3 milky = uSSS * 0.9 + uAmbient * 0.28 + skyR * 0.06;
      col = mix(col, milky, aer * 0.42);
      float NL = max(dot(N, L), 0.0);
      vec3 foamLit = uFoamCol * (uAmbient * 1.25 + uSunColor * (0.2 + 0.8 * NL) * 0.5) * (0.78 + 0.22 * pattern);
      col = mix(col, foamLit, foam);
      col += spec * (1.0 - foam);

      // aerial perspective into the same haze the sky draws at the horizon
      float fog = 1.0 - exp(-dist * uFogK);
      fog = pow(clamp(fog, 0.0, 1.0), 1.6);
      vec3 hz = oceanHaze(normalize(vec3(-V.x, 0.0, -V.z)));
      col = mix(col, hz, fog);
      gl_FragColor = vec4(col, 1.0);
    }`;

  const material = new THREE.ShaderMaterial({ name: 'ocean', uniforms, defines, vertexShader, fragmentShader });
  const mesh = new THREE.Mesh(geometry || createOceanGeometry(THREE), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;

  const fract = (v) => v - Math.floor(v);

  return {
    mesh,
    material,
    uniforms,
    setReflection(reflection) {
      uniforms.uRefl.value = reflection.texture;
      uniforms.uReflMat.value = reflection.matrix;
    },
    // Call after waves.update(). ship = { x, z, fx, fz } when a hull is attached.
    update({ time, camera, ship }) {
      uniforms.uAmp.value = waves.amplitude;
      uniforms.uSteep.value = waves.steepness;
      // rings follow the camera in whole-metre steps (sliding them measured the same)
      uniforms.uGridCenter.value.set(Math.round(camera.position.x), 0, Math.round(camera.position.z));
      if (ship) uniforms.uShip.value.set(ship.x, ship.z, ship.fx, ship.fz);
      // texture scrolls include the floating-origin offset with the same divisor as the sampling scale
      const ox = waves.offX, oz = waves.offZ;
      uniforms.uDetOffA.value.set(fract(ox / 19 + time * 0.021 * waves.windX), fract(oz / 19 + time * 0.021 * waves.windZ));
      uniforms.uDetOffB.value.set(fract(oz / 7.3 + time * 0.043), fract(-ox / 7.3 - time * 0.017));
      uniforms.uFoamOff.value.set(fract(ox / 9 + time * 0.004), fract(oz / 9 + time * 0.003));
      uniforms.uFoamOff2.value.set(fract(ox / 3.3 - time * 0.009), fract(oz / 3.3 + time * 0.006));
      uniforms.uTime.value = time;
    },
    dispose() {
      mesh.geometry.dispose();
      material.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Kelvin wake: a 512² half-float field that follows the ship.
// R = diverging arms, G = stern wash, B = calm slick, A = Kelvin wave height.

const WAKE_POINTS = 64;

export function createWake(THREE, renderer, { shipLength = 34, span = 380, resolution = 512 } = {}) {
  const rt = new THREE.WebGLRenderTarget(resolution, resolution, {
    type: THREE.HalfFloatType,
    depthBuffer: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
  });
  const path = [];
  for (let i = 0; i < WAKE_POINTS; i++) path.push(new THREE.Vector4());
  const uniforms = {
    uPath: { value: path },
    uCount: { value: 2 },
    uCenter: { value: new THREE.Vector2() },
    uSpan: { value: span },
    uShipLen: { value: shipLength },
  };
  const material = new THREE.ShaderMaterial({
    name: 'wake',
    uniforms,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      uniform vec4 uPath[${WAKE_POINTS}];
      uniform int uCount;
      uniform vec2 uCenter;
      uniform float uSpan, uShipLen;
      void main(){
        vec2 p = uCenter + (vUv - 0.5) * uSpan;
        float best = 1e9, along = 0.0, side = 0.0;
        for (int i = 0; i < ${WAKE_POINTS - 1}; i++){
          if (i >= uCount - 1) break;
          vec4 a = uPath[i], b = uPath[i + 1];
          vec2 ab = b.xy - a.xy;
          float l2 = max(dot(ab, ab), 1e-4);
          float t = clamp(dot(p - a.xy, ab) / l2, 0.0, 1.0);
          vec2 q = a.xy + ab * t;
          float d2 = dot(p - q, p - q);
          if (d2 < best){
            best = d2;
            along = mix(a.z, b.z, t);
            side = ab.x * (p.y - a.y) - ab.y * (p.x - a.x);
          }
        }
        float d = sqrt(best);
        float a = along;                  // metres behind the bow
        float as = a - uShipLen;          // metres behind the stern
        // Kelvin arms from the bow (atan 0.35 ≈ 19.3°) plus a weaker stern pair
        float armX = 1.2 + a * 0.35;
        float w = 1.1 + a * 0.03;
        float q1 = (d - armX) / w;
        float arm = exp(-q1 * q1) * exp(-a / 115.0) * smoothstep(0.0, 5.0, a);
        float q2 = (d - (3.0 + max(as, 0.0) * 0.3)) / (1.0 + max(as, 0.0) * 0.03);
        float armS = exp(-q2 * q2) * exp(-max(as, 0.0) / 80.0) * smoothstep(-2.0, 6.0, as) * 0.6;
        // turbulent centre wash from the stern
        float ww = 2.6 + max(as, 0.0) * 0.055;
        float wash = exp(-(d / ww) * (d / ww)) * exp(-max(as, 0.0) / 170.0) * smoothstep(-7.0, -1.0, as);
        wash *= 0.88 + 0.12 * sin(as * 0.23);
        float q3 = d / (ww * 1.6 + 2.0);
        float slick = exp(-q3 * q3) * exp(-max(as, 0.0) / 260.0) * smoothstep(-6.0, 1.0, as);
        // Kelvin wave height: diverging crests inside the wedge
        float inWedge = smoothstep(armX + w * 2.0, armX - w, d) * smoothstep(0.0, 10.0, a);
        float kh = sin((a * 0.5 - d * 0.9) * 1.1) * inWedge * exp(-a / 90.0) * 0.35;
        kh += sin((a - d * 1.6) * 0.9) * arm * 0.4;
        float valid = step(-60.0, a) * step(a, 360.0);
        gl_FragColor = vec4(max(arm, armS) * valid, wash * valid, slick * valid, kh * valid);
      }`,
    depthTest: false,
    depthWrite: false,
  });
  const scene = new THREE.Scene();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  scene.add(quad);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const trail = [];
  let sinceDrop = 0;

  return {
    rt,
    uniforms,
    // Lay a straight trail behind the ship so the first frame already has a wake.
    reset(x, z, fx, fz) {
      trail.length = 0;
      for (let i = 0; i < 40; i++) trail.push({ x: x - fx * i * 3, z: z - fz * i * 3 });
    },
    shift(dx, dz) {
      for (const p of trail) { p.x -= dx; p.z -= dz; }
    },
    // x, z = ship centre; fx, fz = forward; step = metres travelled this frame
    update(x, z, fx, fz, step) {
      sinceDrop += step;
      if (sinceDrop > 3 || trail.length === 0) {
        sinceDrop = 0;
        trail.unshift({ x, z });
        if (trail.length > WAKE_POINTS - 2) trail.pop();
      }
      const half = shipLength * 0.5;
      path[0].set(x + fx * half, z + fz * half, 0, 0); // bow
      path[1].set(x, z, half, 0);
      let along = half, px = x, pz = z, n = 2;
      for (let i = 0; i < trail.length && n < WAKE_POINTS; i++) {
        const p = trail[i];
        const seg = Math.hypot(p.x - px, p.z - pz);
        if (seg < 0.5) continue;
        along += seg;
        path[n++].set(p.x, p.z, along, 0);
        px = p.x; pz = p.z;
      }
      uniforms.uCount.value = n;
      uniforms.uCenter.value.set(x - fx * 120, z - fz * 120); // most of the field sits behind the ship
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(rt);
      renderer.render(scene, camera);
      renderer.setRenderTarget(prev);
    },
    dispose() {
      rt.dispose();
      material.dispose();
      quad.geometry.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Planar reflection of the objects that stand in the water (ship, islands).
// The sky is reflected from the cube instead, so only put floating/standing
// objects on `layer`.

export function createPlanarReflection(THREE, renderer, { layer = 1, clipBias = 0.05, resolutionScale = 0.5 } = {}) {
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: true });
  const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.5, 14e3);
  camera.layers.set(layer);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), clipBias);
  // clip space → [0, 1] texture space
  const bias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
  const matrix = new THREE.Matrix4();
  const forward = new THREE.Vector3();
  const up = new THREE.Vector3();
  const look = new THREE.Vector3();

  return {
    target,
    texture: target.texture,
    matrix,
    camera,
    setSize(width, height) {
      target.setSize(Math.round(width * resolutionScale), Math.round(height * resolutionScale));
    },
    render(scene, viewCamera) {
      camera.position.set(viewCamera.position.x, -viewCamera.position.y, viewCamera.position.z);
      forward.set(0, 0, -1).applyQuaternion(viewCamera.quaternion);
      forward.y = -forward.y;
      up.set(0, 1, 0).applyQuaternion(viewCamera.quaternion);
      up.y = -up.y;
      camera.up.copy(up);
      camera.lookAt(look.copy(camera.position).add(forward));
      camera.fov = viewCamera.fov;
      camera.aspect = viewCamera.aspect;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      matrix.copy(bias).multiply(camera.projectionMatrix).multiply(camera.matrixWorldInverse);

      const prev = renderer.getRenderTarget();
      const autoShadow = renderer.shadowMap.autoUpdate;
      renderer.clippingPlanes = [plane];
      renderer.setRenderTarget(target);
      renderer.setClearColor(0, 0);
      renderer.clear();
      renderer.shadowMap.autoUpdate = false; // reuse this frame's shadow map
      renderer.render(scene, camera);
      renderer.shadowMap.autoUpdate = autoShadow;
      renderer.clippingPlanes = [];
      renderer.setRenderTarget(prev);
    },
    dispose() {
      target.dispose();
    },
  };
}
