/* Tide Glass stage: a moonlit low-tide shore of wet shingle and pools, a camera, and the five beats
   of one water and crystal skill, all drawn by src/water-crystal.mjs. There is no character: the
   water gathers above an implied open palm, so what you see is the effect language alone. */
(() => {
  const THREE = window.THREE;
  const TC = window.TideCrystal;
  const { createTideCrystal, NOISE_GLSL, TNOISE_GLSL, ENV_GLSL, LIGHTS_GLSL, RIPPLE_GLSL, CAUSTIC_GLSL } = TC;
  const V3 = THREE.Vector3;
  const UP = new V3(0, 1, 0);
  const canvas = document.getElementById('stage');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(location.search);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: params.has('capture') });
  if (params.has('capture')) document.documentElement.classList.add('capture');
  const FOG = new THREE.Color(0.0082, 0.0112, 0.016);       // a slate-blue haze the far flats dissolve into (the effect owns the teal)
  renderer.setClearColor(FOG, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(44, 1, 0.05, 200);
  const el = 7.5 * Math.PI / 180, az = -52 * Math.PI / 180;   // low over the flats, clear of the captions, its glitter path behind the crystals
  const MOON = new V3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  const fx = createTideCrystal(THREE, { renderer, scene, camera, seed: 23, moonDir: MOON });
  fx.options.shake = 0.6; fx.options.fisheye = 0.65;        // felt, not thrown at the viewer
  if (reduceMotion) { fx.options.shake = 0; fx.options.fisheye = 0; fx.options.flashes = 'safe'; }

  // ------------------------------------------------------------ sky
  const sky = new THREE.Mesh(new THREE.SphereGeometry(120, 48, 24), new THREE.ShaderMaterial({
    uniforms: { ...fx.envUniforms, tNoise: fx.uniforms.tNoise, uTime: fx.uniforms.uTime, uFog: { value: new V3(FOG.r, FOG.g, FOG.b) } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: TNOISE_GLSL + ENV_GLSL + `
      uniform vec3 uFog; uniform float uTime; varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir);
        vec3 col = skyCol(d) + moonDisc(d, 0.) + skyClouds(d);
        // the moon's face: faint maria
        float md = 1. - dot(d, uMoonDir);
        if (md < .0001) {                                    // maria: grey seas on the disc only (it sits just above the clip so they show)
          vec3 t = cross(uMoonDir, vec3(0., 1., 0.)); vec2 mq = vec2(dot(d, normalize(t)), dot(d, normalize(cross(t, uMoonDir)))) * 95.;
          float disc = smoothstep(.0000955, .000085, md);
          col *= mix(1., .065 + .055 * smoothstep(-.3, .4, tn(vec3(mq * 1.3, 2.)).z + tn(vec3(mq * 3., 5.)).w * .4), disc);
        }   // maria: the disc sits just above the clip so its grey seas show
        col = mix(uFog, col, smoothstep(-.06, .05, d.y));
        col = mix(col, uFog * 1.25 + vec3(.002, .0025, .003), exp(-abs(d.y) * 260.) * .7);   // a 3 px haze line at the horizon
        gl_FragColor = vec4(col, 1.);
      }`,
    side: THREE.BackSide, depthWrite: false,
  }));
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);

  // ------------------------------------------------------------ ground: a tidal rock flat
  // Long, lumpy banks of dark wet rock stand proud of flat tide pools, receding in bands to the
  // horizon. The terrain is a heightfield mesh (dense near the action, sparse to the horizon) whose
  // height comes from an integer-hash value noise mirrored exactly on the CPU, so shards and drops land
  // on the same surface the GPU draws. The pools are a separate flat water plane at y = 0: a mirror of
  // the sky, the moon and the effect (the mirror pass), broken by ripples, rings and rain, showing the
  // pool floor through it. The rock wears the Poly Haven scan "Low Tide Rocks" (Dimitrios Savva, CC0)
  // at a larger scale, re-tinted near-black and faintly warm, wet and glinting.
  const ROCK_TILE = 1.55, FLOOR_TILE = 1.1;
  // basins: small pools the skill needs open (centre x, z, radius x, z); the layout grid does the rest
  const BASINS = [
    [0.28, 0.12, 0.5, 0.42], [0.08, 0.85, 0.3, 0.35],                   // gather: the pool round the stream feet
    [2.85, 0.14, 0.5, 0.42],                                             // where the lash comes down
    [3.02, -0.12, 0.5, 0.5], [2.3, -0.95, 0.38, 0.32], [3.8, 0.72, 0.38, 0.38], [1.85, 0.32, 0.75, 0.22],   // the crystals stand in water
  ];
  // the layout: where the target shots put water and rock, projected onto a 5 cm world grid (4 bits
  // water, 4 bits confidence). Outside it, and where it is unsure, procedural bands take over.
  const LY = window.TIDE_LAYOUT || { x0: 0, z0: 0, d: 1, nx: 1, nz: 1, b64: 'AA==' };
  const lyBytes = Uint8Array.from(atob(LY.b64), (c) => c.charCodeAt(0));
  const lyRG = new Uint8Array(LY.nx * LY.nz * 4);
  for (let i = 0; i < LY.nx * LY.nz; i++) { lyRG[i * 4] = (lyBytes[i] >> 4) * 17; lyRG[i * 4 + 1] = (lyBytes[i] & 15) * 17; lyRG[i * 4 + 3] = 255; }
  const lyTex = new THREE.DataTexture(lyRG, LY.nx, LY.nz, THREE.RGBAFormat);
  lyTex.magFilter = lyTex.minFilter = THREE.LinearFilter; lyTex.needsUpdate = true;
  function layoutAt(x, z) {                                                  // bilinear, as the GPU samples it
    const u = (x - LY.x0) / LY.d - 0.5, v = (z - LY.z0) / LY.d - 0.5;
    if (u < 0 || v < 0 || u >= LY.nx - 1 || v >= LY.nz - 1) return [0.5, 0];
    const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j;
    const at = (ii, jj, ch) => lyRG[(jj * LY.nx + ii) * 4 + ch] / 255;
    const bl = (ch) => (at(i, j, ch) * (1 - fu) + at(i + 1, j, ch) * fu) * (1 - fv) + (at(i, j + 1, ch) * (1 - fu) + at(i + 1, j + 1, ch) * fu) * fv;
    return [bl(0), bl(1)];
  }
  const HEIGHT_GLSL = `
    uniform vec4 uBasins[${BASINS.length}];
    uniform sampler2D tLayout; uniform vec4 uLayout;   // x0, z0, 1/d, unused
    uint hu(ivec2 p){ uvec2 q = uvec2(p + ivec2(40000)); uint h = (q.x * 1597334677u) ^ (q.y * 3812015801u); h = (h ^ (h >> 16u)) * 2246822519u; h ^= h >> 13u; return h; }
    float hh(ivec2 p){ return float(hu(p) & 16777215u) * (1. / 16777215.); }
    float vn(vec2 p){
      vec2 i = floor(p), f = p - i, u = f * f * f * (f * (f * 6. - 15.) + 10.); ivec2 c = ivec2(i);
      return mix(mix(hh(c), hh(c + ivec2(1, 0)), u.x), mix(hh(c + ivec2(0, 1)), hh(c + ivec2(1, 1)), u.x), u.y);
    }
    float basinAt(vec2 p){
      float b = -1.;
      for (int i = 0; i < ${BASINS.length}; i++) { vec2 d = (p - uBasins[i].xy) / uBasins[i].zw; b = max(b, 1. - dot(d, d)); }
      return b;
    }
    // rubble: the rock breaks into clumps, a dome in each 15 cm cell, water films between them
    // (height, dh/dx, dh/dz): the highest dome wins, its gradient is exact
    vec3 rubbleG(vec2 p){
      vec2 g = p / .15; ivec2 c0 = ivec2(floor(g)); vec3 best = vec3(0.);
      for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++) {
        ivec2 c = c0 + ivec2(dx, dy);
        vec2 ctr = (vec2(c) + .1 + .8 * vec2(hh(c + ivec2(311, 17)), hh(c + ivec2(57, 913)))) * .15;
        float r = .05 + .085 * hh(c + ivec2(733, 421));
        vec2 d = p - ctr; float q = 1. - dot(d, d) / (r * r);
        if (q <= 0.) continue;
        float sq = sqrt(q), h = r * .7 * sq;
        if (h > best.x) best = vec3(h, -.7 / (r * max(sq, .08)) * d);
      }
      return best;
    }
    float rubble(vec2 p){ return rubbleG(p).x; }
    // the smooth parts (no rubble): x floor height, y rock top without rubble, z rock mask, w lumps
    vec4 terrainBase(vec2 p){
      vec2 w = vec2(vn(p * .19 + vec2(3.1, 7.7)), vn(p * .19 + vec2(11.3, 1.9))) - .5;
      vec2 q = p + w * vec2(3.2, 1.2);
      float band = vn(vec2(q.x * .085, q.y * 1.45)) * .62 + vn(vec2(q.x * .24 + 5.3, q.y * 2.9 + 2.1)) * .38;
      float l1 = vn(p * 2.2 + vec2(17., 4.)), l2 = vn(p * 4.9 + vec2(3., 11.));
      float lump = l1 * .5 + l2 * .33 + .085;
      float rockP = smoothstep(.27, .35, band + (lump - .5) * .24);
      vec2 lu = (p - uLayout.xy) * uLayout.z / vec2(${LY.nx}., ${LY.nz}.);
      vec2 L = (lu.x > 0. && lu.y > 0. && lu.x < 1. && lu.y < 1.) ? textureLod(tLayout, lu, 0.).rg : vec2(.5, 0.);
      float rockL = smoothstep(.62, .38, L.x + (vn(p * 9. + vec2(2., 5.)) - .5) * .3);
      float rock = mix(rockP, rockL, L.y) * (1. - smoothstep(-.25, .35, basinAt(p)));
      float floorH = -.05 + .02 * vn(p * 1.1 + vec2(40., 7.)) + .01 * (l2 - .5);
      float top = .004 + .06 * lump * lump + .025 * smoothstep(.55, .9, band) - .018;
      return vec4(floorH, top, rock, lump);
    }
    // the surface with its normal: base parts by finite differences, rubble exact
    void terrainHN(vec2 p, float rubK, out float h, out vec3 n, out vec2 rl){
      const float e = .025;
      vec4 b = terrainBase(p), bx = terrainBase(p + vec2(e, 0.)), bz = terrainBase(p + vec2(0., e));
      vec3 rg = rubK > 0. ? rubbleG(p) * rubK : vec3(0.);
      float top = b.y + rg.x;
      h = mix(b.x, top, b.z);
      vec2 dFloor = vec2(bx.x - b.x, bz.x - b.x) / e, dTop = vec2(bx.y - b.y, bz.y - b.y) / e + rg.yz, dRock = vec2(bx.z - b.z, bz.z - b.z) / e;
      vec2 grad = mix(dFloor, dTop, b.z) + (top - b.x) * dRock;
      n = normalize(vec3(-grad.x, 1., -grad.y));
      rl = vec2(b.z, b.w);
    }
    // x: height (m, water at 0), y: rock mask, z: lumps 0..1
    vec3 terrain(vec2 p, float detail){
      vec2 w = vec2(vn(p * .19 + vec2(3.1, 7.7)), vn(p * .19 + vec2(11.3, 1.9))) - .5;
      vec2 q = p + w * vec2(3.2, 1.2);
      float band = vn(vec2(q.x * .085, q.y * 1.45)) * .62 + vn(vec2(q.x * .24 + 5.3, q.y * 2.9 + 2.1)) * .38;   // long east-west strips
      float l1 = vn(p * 2.2 + vec2(17., 4.)), l2 = vn(p * 4.9 + vec2(3., 11.));
      float lump = l1 * .5 + l2 * .33 + .085;
      float rockP = smoothstep(.27, .35, band + (lump - .5) * .24);
      vec2 lu = (p - uLayout.xy) * uLayout.z / vec2(${LY.nx}., ${LY.nz}.);
      vec2 L = (lu.x > 0. && lu.y > 0. && lu.x < 1. && lu.y < 1.) ? texture(tLayout, lu).rg : vec2(.5, 0.);
      float rockL = smoothstep(.62, .38, L.x + (vn(p * 9. + vec2(2., 5.)) - .5) * .3);
      float rock = mix(rockP, rockL, L.y) * (1. - smoothstep(-.25, .35, basinAt(p)));
      float floorH = -.05 + .02 * vn(p * 1.1 + vec2(40., 7.)) + .01 * (l2 - .5);
      float top = .004 + .06 * lump * lump + .025 * smoothstep(.55, .9, band) + rubble(p) * mix(.55, 1., detail) - .018;
      return vec3(mix(floorH, top, rock), rock, lump);
    }`;
  // the same terrain on the CPU (identical integer hash, float maths to a few 1e-7)
  const hu = (x, y) => { let h = (Math.imul((x + 40000) >>> 0, 1597334677) ^ Math.imul((y + 40000) >>> 0, 3812015801 | 0)) >>> 0; h = Math.imul(h ^ (h >>> 16), 2246822519 | 0) >>> 0; return (h ^ (h >>> 13)) >>> 0; };
  const hh = (x, y) => (hu(x, y) & 16777215) / 16777215;
  const mixf = (a, b, t) => a + (b - a) * t;
  const vn = (px, py) => {
    const ix = Math.floor(px), iy = Math.floor(py), fx_ = px - ix, fy = py - iy;
    const ux = fx_ * fx_ * fx_ * (fx_ * (fx_ * 6 - 15) + 10), uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
    return mixf(mixf(hh(ix, iy), hh(ix + 1, iy), ux), mixf(hh(ix, iy + 1), hh(ix + 1, iy + 1), ux), uy);
  };
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function basinAt(x, z) { let b = -1; for (const [cx, cz, rx, rz] of BASINS) { const dx = (x - cx) / rx, dz = (z - cz) / rz; b = Math.max(b, 1 - dx * dx - dz * dz); } return b; }
  function rubbleAt(x, z) {
    const c0x = Math.floor(x / 0.15), c0z = Math.floor(z / 0.15); let h = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const cx = c0x + dx, cz = c0z + dy;
      const ox = (cx + 0.1 + 0.8 * hh(cx + 311, cz + 17)) * 0.15, oz = (cz + 0.1 + 0.8 * hh(cx + 57, cz + 913)) * 0.15;
      const r = 0.05 + 0.085 * hh(cx + 733, cz + 421);
      const q = 1 - ((x - ox) ** 2 + (z - oz) ** 2) / (r * r);
      h = Math.max(h, r * 0.7 * Math.sqrt(Math.max(q, 0)));
    }
    return h;
  }
  function terrainAt(x, z, detail = 1) {
    const wx = vn(x * 0.19 + 3.1, z * 0.19 + 7.7) - 0.5, wz = vn(x * 0.19 + 11.3, z * 0.19 + 1.9) - 0.5;
    const qx = x + wx * 3.2, qz = z + wz * 1.2;
    const band = vn(qx * 0.085, qz * 1.45) * 0.62 + vn(qx * 0.24 + 5.3, qz * 2.9 + 2.1) * 0.38;
    const l1 = vn(x * 2.2 + 17, z * 2.2 + 4), l2 = vn(x * 4.9 + 3, z * 4.9 + 11);
    const lump = l1 * 0.5 + l2 * 0.33 + 0.085;
    const rockP = sstep(0.27, 0.35, band + (lump - 0.5) * 0.24);
    const [Lw, Lc] = layoutAt(x, z);
    const rockL = sstep(0.62, 0.38, Lw + (vn(x * 9 + 2, z * 9 + 5) - 0.5) * 0.3);
    const rock = mixf(rockP, rockL, Lc) * (1 - sstep(-0.25, 0.35, basinAt(x, z)));
    const floorH = -0.05 + 0.02 * vn(x * 1.1 + 40, z * 1.1 + 7) + 0.01 * (l2 - 0.5);
    const top = 0.004 + 0.06 * lump * lump + 0.025 * sstep(0.55, 0.9, band) + rubbleAt(x, z) * mixf(0.55, 1, detail) - 0.018;
    return mixf(floorH, top, rock);
  }
  // shards and drops sample the ground often: a 2 cm height grid over the action area (built once),
  // bilinear like the mesh between its vertices; the exact function elsewhere
  const HG = { x0: -1.5, z0: -2.5, n: 7.5 / 0.02, d: 0.02, h: null };
  function heightAt(x, z) {
    const u = (x - HG.x0) / HG.d, v = (z - HG.z0) / HG.d;
    if (u < 0 || v < 0 || u >= HG.n || v >= HG.n) return terrainAt(x, z, 1);
    if (!HG.h) {
      const n = HG.n + 1; HG.h = new Float32Array(n * n);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) HG.h[j * n + i] = terrainAt(HG.x0 + i * HG.d, HG.z0 + j * HG.d, 1);
    }
    const n = HG.n + 1, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, k = j * n + i;
    return (HG.h[k] * (1 - fu) + HG.h[k + 1] * fu) * (1 - fv) + (HG.h[k + n] * (1 - fu) + HG.h[k + n + 1] * fu) * fv;
  }
  fx.groundAt = heightAt;                                                // shards and drops land on this same surface

  const GM = window.GROUND_MAPS || {};
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const groundU = { tDiff: { value: null }, tNor: { value: null }, tArm: { value: null }, uMaps: { value: 0 }, uBasins: { value: BASINS.map((b) => new THREE.Vector4(...b)) }, tLayout: { value: lyTex }, uLayout: { value: new THREE.Vector4(LY.x0, LY.z0, 1 / LY.d, 0) } };
  let mapsLeft = 0, dirty = true;
  function groundMap(key, srgb) {
    const t = new THREE.Texture();
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = Math.min(8, maxAniso);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    if (!GM[key]) return t;
    mapsLeft++;
    const img = new Image();
    img.onload = () => { t.image = img; t.needsUpdate = true; if (--mapsLeft === 0) { groundU.uMaps.value = 1; dirty = true; } };
    img.src = GM[key];
    return t;
  }
  groundU.tDiff.value = groundMap('diff', true);
  groundU.tNor.value = groundMap('nor', false);
  groundU.tArm.value = groundMap('arm', false);
  const groundCommon = { ...fx.envUniforms, ...fx.lightUniforms, ...fx.groundUniforms, ...groundU, tNoise: fx.uniforms.tNoise, uMirrorPass: fx.uniforms.uMirrorPass, uFog: sky.material.uniforms.uFog, uMoonLight: { value: new V3(0.86, 0.9, 1.0).multiplyScalar(0.075) } };

  // the terrain mesh: a grid stretched by sinh, ~3 cm a cell round the action, metres at the horizon
  const GK = 7.2, GEXT = 900, GC = new V3(1.4, 0, 0.2);
  function terrainGrid(GN) {
    const tgeo = new THREE.BufferGeometry();
    const pos = new Float32Array((GN + 1) * (GN + 1) * 3), idx = [];
    const warp = (u) => GEXT * Math.sinh(u * GK) / Math.sinh(GK);
    for (let j = 0; j <= GN; j++) for (let i = 0; i <= GN; i++) {
      const k = (j * (GN + 1) + i) * 3;
      pos[k] = GC.x + warp(i / GN * 2 - 1); pos[k + 1] = 0; pos[k + 2] = GC.z + warp(j / GN * 2 - 1);
    }
    for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) {
      const a = j * (GN + 1) + i, b = a + 1, c = a + GN + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    tgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    tgeo.setIndex(idx);
    return tgeo;
  }
  const TERRAIN_VERT = HEIGHT_GLSL + `
    varying vec3 vW; varying vec3 vN; varying vec2 vT;
    void main(){
      vec3 P = position;
      float dc = length(P.xz - cameraPosition.xz);
      float detail = 1. - smoothstep(6., 14., dc);
      float h; vec3 n; vec2 rl;
      terrainHN(P.xz, mix(.55, 1., detail) * (1. - smoothstep(14., 22., dc)), h, n, rl);   // rubble is sub-pixel far away
      P.y = h; vN = n; vT = rl; vW = P;
      gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.);
    }`;
  const TERRAIN_FRAG = NOISE_GLSL + TNOISE_GLSL + ENV_GLSL + LIGHTS_GLSL + CAUSTIC_GLSL + `
    uniform sampler2D tDiff, tNor, tArm;
    uniform float uMaps, uMirrorPass, uTime; uniform vec3 uFog, uMoonLight;
    uniform vec4 uCaus[6], uCausCol[6], uFrost[8];
    varying vec3 vW; varying vec3 vN; varying vec2 vT;
    void main(){
      vec2 p = vW.xz;
      vec3 V = normalize(cameraPosition - vW);
      float dist = length(cameraPosition - vW);
      float fw = length(fwidth(p));
      float rock = vT.x, lump = vT.y;
      vec2 uv = p / ${ROCK_TILE.toFixed(2)};
      vec3 dif = mix(vec3(.2), texture2D(tDiff, uv).rgb, uMaps);
      vec3 arm = mix(vec3(.85, .6, 0.), texture2D(tArm, uv).rgb, uMaps);
      vec3 nm = mix(vec3(0., 0., 1.), texture2D(tNor, uv).xyz * 2. - 1., uMaps);
      float lum = dot(dif, vec3(.2126, .7152, .0722));
      vec4 mac = tn(vec3(p * .35, 1.7));
      // near-black wet rock, faintly warm, every lump its own shade; deep crevices go fully black
      vec3 alb = vec3(.075, .068, .06) * clamp(.4 + 1. * smoothstep(.06, .4, lum), .35, 1.3) * (.7 + .6 * (mac.y * .5 + .5));
      float ao = mix(.12, 1., smoothstep(.62, .95, arm.r)) * mix(.15, 1., smoothstep(.15, .75, lump));   // deep crevices between lumps go black
      // relief: the mesh's lumps, then the scan's normals for the rock's own grain
      float far = smoothstep(.003, .03, fw);
      vec3 N = normalize(vN);
      vec3 T = normalize(cross(vec3(0., 0., 1.), N)), B = cross(N, T);
      vec3 Nd = normalize(T * nm.x * 1.35 + B * nm.y * 1.35 + N * nm.z);
      // granular: crumbs and pits at 2-5 cm on top of the scan's grain (fixed to the rock, never sliding)
      vec4 gA = tn(vec3(p * 26., 3.3)), gB = tn(vec3(p * 61., 7.9));
      float grain = (1. - abs(gA.x)) * .6 + (1. - abs(gB.y)) * .4;
      Nd = normalize(Nd + (T * (gA.y * .35 + gB.z * .22) + B * (gA.z * .35 + gB.w * .22)) * (1. - far) * rock);
      lump = clamp(lump + (grain - .55) * .35, 0., 1.);
      Nd = normalize(mix(Nd, N, far * .8));
      float nvar = length(fwidth(Nd));
      float rough = clamp(sqrt(pow(arm.g * .45 + .08, 2.) + far * .15 + nvar * nvar * 5.), .14, .8);
      float wetTop = 1. - smoothstep(.0, .14, vW.y);              // the lower rock is wetter and glossier
      rough = mix(rough, rough * .6, wetTop);
      vec3 L = uMoonDir, H = normalize(L + V);
      float ndl = max(dot(Nd, L), 0.);
      float a2 = rough * rough * rough * rough;
      float nh = max(dot(Nd, H), 0.), dd = nh * nh * (a2 - 1.) + 1.;
      float D = a2 / (3.14159 * dd * dd);
      float Fs = .04 + .96 * pow(1. - max(dot(H, V), 0.), 5.);
      vec3 col = uMoonLight * (alb * ndl * ao + D * Fs * ndl * .5 / max(dot(Nd, V), .12));
      // the sky in the wet surface, and pinpoint glints: each small cell a facet that either catches the moon or not
      vec3 Rs = reflect(-V, Nd);
      float Fn = .04 + .96 * pow(1. - max(dot(Nd, V), 0.), 5.);
      col += skyBase(Rs) * Fn * (1. - rough) * .9 * ao;
      if (uMirrorPass < .5 && vW.y > 0.) {
        // wet glints: crumbs on the tops and wet edges whose facets mirror the moon. They gather along the
        // moon's path (the half-vector decides) and are warm white like the moon on water
        float cs = .009 + fw * 1.4;
        vec2 ci = floor(p / cs), cf = fract(p / cs) - .5; vec3 hs = hash32(ci + 7.1);
        vec3 Ng = normalize(Nd + (hs - .5) * .35);
        float wetEdge = smoothstep(.35, .8, grain) * smoothstep(.2, .6, lump);
        float g = pow(max(dot(reflect(-V, Ng), uMoonDir), 0.), 260.) * wetEdge * exp(-dot(cf, cf) / .08);
        col += vec3(1., .95, .89) * uMoonCol * g * 4.5 * (1. - far * .6);
      }
      vec3 eDif = vec3(0.), eSpc = vec3(0.), up = vec3(0.);
      bool near_ = dist < 20.;
      if (near_) energySplit(vW, Nd, V, rough, eDif, eSpc, up);
      col += alb * eDif * ao + eSpc * .12 * ao;
      col += alb * vec3(.0016, .0017, .002) * ao;                       // the faintest sky fill: true black stays black
      // caustics from the water and the crystals on the stone and the pool floor
      if (near_ && uMirrorPass < .5) {
        vec3 caus = vec3(0.);
        for (int i = 0; i < 6; i++) {
          vec4 C = uCaus[i]; if (C.w <= 0.) continue;
          vec2 d = p - C.xy; float m = exp(-dot(d, d) / (C.z * C.z) * 2.) * (1. - smoothstep(.004, .016, fw));
          if (m < .01) continue;
          float sc = 1.05 / max(C.z, .25);
          float c0 = caustic(C.xy * sc + d * sc, uTime * .8 + float(i) * 3., .9);
          caus += uCausCol[i].rgb * C.w * m * max(c0 - 1.35, 0.) * .45;
        }
        // caustics fall on the pool floor (light focused by the water over it); on dry rock only a trace
        float under = smoothstep(.0, -.012, vW.y);
        col += caus * (alb * 1.6 + .006) * mix(.12, 4., under);
        // frost where crystals came out of the stone
        for (int i = 0; i < 8; i++) {
          vec4 Fz = uFrost[i]; if (Fz.w <= 0.) continue;
          vec2 d = p - Fz.xy; float rr = length(d) / Fz.z;
          if (rr > 1.3) continue;
          float edge = 1. - smoothstep(.55, 1., rr + tn(vec3(p * 9., 4.2)).x * .3);
          float lines = 1. - smoothstep(0., .07, abs(tn(vec3(p * 31., 1.1)).x + .5 * tn(vec3(p * 67., 2.9)).y));
          float grain = smoothstep(.2, .7, tn(vec3(p * 140., 6.)).z * .5 + .5);
          float rime = edge * Fz.w * (lines * .8 + grain * .25);
          col = mix(col, uMoonLight * .6 + up * .55 + vec3(.003, .0035, .004), clamp(rime, 0., 1.) * .85);
        }
      }
      // below the waterline this is the pool floor, seen through water that darkens it with depth
      float wdep = max(-vW.y, 0.);
      col *= exp(-vec3(14., 8., 6.5) * wdep) * (wdep > 0. ? .7 : 1.);
      col = mix(col, uFog, 1. - exp(-dist * .035));
      gl_FragColor = vec4(col, 1.);
    }`;
  const terrainMat = new THREE.ShaderMaterial({ uniforms: groundCommon, vertexShader: TERRAIN_VERT, fragmentShader: TERRAIN_FRAG });
  const ground = new THREE.Mesh(terrainGrid(360), terrainMat);
  ground.frustumCulled = false; ground.renderOrder = -5;
  scene.add(ground);
  // the rock banks reflect in the pools: a coarser copy of the terrain, drawn only by the mirror camera
  const groundMirror = new THREE.Mesh(terrainGrid(150), terrainMat);
  groundMirror.frustumCulled = false; groundMirror.renderOrder = -5; groundMirror.layers.set(TC.L_MIRROR);
  scene.add(groundMirror);

  // the pools: one flat plane at y = 0, seen only where the rock is below it
  const WATER_FRAG = NOISE_GLSL + TNOISE_GLSL + ENV_GLSL + LIGHTS_GLSL + RIPPLE_GLSL + `
    uniform sampler2D tMirror; uniform mat4 uMirrorMat;
    uniform vec3 uFog, uMoonLight;
    uniform vec4 uFoam[4];
    varying vec3 vW;
    // the pools' own motion: faint long swells and a fine wind chop (3-10 cm), both fading with distance
    vec2 chop(vec2 p, float dist){
      vec2 g = vec2(0.);
      float sw = .25 * (1. - smoothstep(2., 10., dist));
      g += vec2(.8, .6) * cos(dot(p, vec2(.8, .6)) * 23. + uTime * 1.3) * .004 * sw;
      g += vec2(-.5, .86) * cos(dot(p, vec2(-.5, .86)) * 37. - uTime * 1.7) * .0034 * sw;
      float fc = 1. - smoothstep(3., 9., dist);
      g += vec2(.96, .28) * cos(dot(p, vec2(.96, .28)) * 83. + uTime * 3.1) * .006 * fc;
      g += vec2(-.42, .91) * cos(dot(p, vec2(-.42, .91)) * 131. - uTime * 3.9) * .005 * fc;
      g += vec2(.17, -.98) * cos(dot(p, vec2(.17, -.98)) * 177. + uTime * 4.6) * .004 * fc;
      g += vec2(-.88, -.47) * cos(dot(p, vec2(-.88, -.47)) * 109. + uTime * 3.4 + 1.3) * .005 * fc;
      return g;
    }
    // The pools' surface, drawn over the pool floor (the terrain below y = 0, already in the frame): the
    // depth test cuts it at every waterline, and its alpha is the reflectance, so the floor shows through
    // where the surface does not mirror.
    void main(){
      vec2 p = vW.xz;
      vec3 V = normalize(cameraPosition - vW);
      float dist = length(cameraPosition - vW);
      float fw = length(fwidth(p));
      bool near_ = dist < 20.;
      vec3 rp = near_ ? ripples(p) + rainRipples(p) : vec3(0.);
      vec2 g = rp.xy * 2.5 + chop(p, dist);
      vec3 Nw = normalize(vec3(-g.x, 1., -g.y));
      float NV = max(dot(Nw, V), 0.);
      float F = .02 + .98 * pow(1. - NV, 5.);
      vec3 Rw = reflect(-V, Nw);
      vec4 mp = uMirrorMat * vec4(vW, 1.);
      vec2 muv = mp.xy / mp.w + g * .3 / (1. + dist * .15);
      vec4 mo = texture2D(tMirror, muv);
      vec3 sky = skyBase(Rw) + skyClouds(Rw);
      // the moonlit haze over the flats: still water at night is a shade brighter than the sky overhead
      // still water at night reflects a sky a shade brighter and bluer than overhead (the moonlit haze)
      vec3 refl = (sky + vec3(.0085, .0128, .0185)) * (1. - mo.a) + mo.rgb + (near_ ? lightGlint2(vW, Rw, 900., .12, 70., .045) : vec3(0.));
      // the moon: a long column on the water. A sheen from the mean surface plus glints from small
      // facets that tilt to mirror it, so the column is bright, long and broken
      vec3 Hm = normalize(uMoonDir + V);
      vec2 need = -Hm.xz / max(Hm.y, .05);
      float sig = .04 + .02 * smoothstep(2., 30., dist);                   // a narrow column
      vec2 dv = need - g; float env = exp(-dot(dv, dv) / (2. * sig * sig));
      vec3 moonC = vec3(0.);
      if (env > .002) {
        float cs = .014 + fw * 2.2;
        vec2 ci = floor(p / cs), cf = fract(p / cs) - .5;
        vec3 hs = hash32(ci + 17.3);
        vec2 micro = sig * 1.3 * vec2(sin(uTime * (1.1 + 1.7 * hs.x) + hs.z * 6.28), cos(uTime * (1.3 + hs.x) + hs.y * 6.28)) * (.4 + .9 * hs.y);
        vec2 dd = need - (g + micro);
        float hit = exp(-dot(dd, dd) / (2. * .016 * .016)) * exp(-dot(cf, cf) / .05);
        float Fm = max(.02 + .98 * pow(1. - max(dot(Hm, V), 0.), 5.), .045);
        // discrete glints all the way: no smooth chrome sheen, warm white like the moon on water
        moonC = vec3(1., .95, .89) * uMoonCol * Fm * env * (hit * mix(55., 18., smoothstep(6., 40., dist)) + env * .25);
      }
      // still, shallow pools at night read as mirrors: a strong reflection (wet-film sheen on top of the
      // Fresnel), the floor faint beneath
      float Fe = mix(F, 1., .6);
      vec3 col = refl * Fe + moonC;
      float a = Fe;
      // light from the effect scattering in the shallow water round a bright source (the crystals' bases)
      if (near_) for (int i = 0; i < 8; i++) { vec3 c = uLightCol[i]; if (c.r + c.g + c.b < 1e-3) continue; vec3 Lp = uLightPos[i] - vW; float d2 = dot(Lp.xz, Lp.xz) + Lp.y * Lp.y * 4.; col += c * .006 / (1. + d2 * 14.); }
      // foam lace spreading from a splash: it hides the floor under it
      if (near_) for (int i = 0; i < 4; i++) {
        vec4 Fo = uFoam[i]; if (Fo.w < 0.) continue;
        vec2 d = p - Fo.xy; float age = Fo.w;
        float rr = length(d) / (Fo.z * (.35 + .65 * sqrt(age)));
        if (rr > 1.2) continue;
        float m = smoothstep(1.05, .55, rr) * (1. - age) * (1. - age);
        vec2 q = p * 6.5 + d * age * 2.;
        float lace = 1. - smoothstep(0., .05 + .04 * age, abs(tn(vec3(q, age * .7 + float(i))).x + .45 * tn(vec3(q * 2.3, 1.)).y));
        lace *= smoothstep(-.2, .3, tn(vec3(q * .5, 7.)).z) * m;
        col += (uMoonLight * .7 + vec3(.004, .0045, .005)) * lace; a = max(a, lace * .8);
      }
      float fogK = 1. - exp(-dist * .035);
      col = mix(col, uFog * a, fogK);
      gl_FragColor = vec4(col, a);
    }`;
  const waterMat = new THREE.ShaderMaterial({
    uniforms: { ...groundCommon, ...fx.mirrorUniforms }, fragmentShader: WATER_FRAG,
    depthTest: true,
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    transparent: true, depthWrite: true,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  const pools = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400).rotateX(-Math.PI / 2), waterMat);
  pools.frustumCulled = false; pools.renderOrder = -4;
  scene.add(pools);

  // ------------------------------------------------------------ the implied caster: water gathers over an open palm
  const PALM = new V3(0.05, 1.0, 0.3);
  const ORB_HOME = new V3(0.12, 1.3, 0.22);
  const HOVER = new V3(1.977, 1.234, -0.406);        // after the lash the orb drifts out over the field it seeded
  const LAND = new V3(3.0, 0, -0.08);
  const SPLASH = new V3(2.85, 0, 0.14);        // where the lash comes down (in the pool, a little nearer than the crystals)
  const orb = fx.createOrb({ radius: 0.02 });
  orb.position.copy(ORB_HOME);
  const want = { r: 0.02, glow: 0.4, pos: ORB_HOME.clone() };   // what the beat asks for; the orb eases toward it

  // gather threads: water drawn up out of the pools into the orb
  // around the point under the orb (0.12, 0.22): a ring of draws 0.35-0.8 m out, all inside the pool
  // round the point under the orb (0.12, 0.22): draws 0.5-0.75 m out, all inside the pool
  const SOURCES = [0.3, 1.35, 2.45, 3.5, 4.55, 5.6].map((a, i) => new V3(0.22 + Math.cos(a) * (0.32 + 0.14 * ((i * 0.618) % 1)), 0, 0.15 + Math.sin(a) * (0.28 + 0.12 * ((i * 0.618) % 1))));
  const threads = SOURCES.map(() => fx.createTube({ maxPoints: 40, radial: 9, flow: 1.6, foam: 0.7, glow: 0.8 }));
  const hideThreads = () => { for (const T of threads) T.visible = false; fx.vortexField.on = false; };
  // the stream: the orb unspooled along an arc to where it lands
  const stream = fx.createTube({ maxPoints: 64, radial: 14, flow: 3.2, foam: 1.1, glow: 0.7 });
  const loose = [];   // the stream's points once it lets go: ballistic

  // ------------------------------------------------------------ crystals: three clusters where the water lands, a chain toward the palm
  const rng = (() => { let s = 977; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const RR = (a, b) => a + (b - a) * rng();
  const CLUSTERS = [
    { c: new V3(3.02, 0, -0.12), n: 7, len: [0.5, 1.2], rad: [0.065, 0.125], spread: 0.3, tilt: [0.1, 0.5], t0: 0.3, gap: 0.09, light: 2 },
    { c: new V3(2.3, 0, -0.95), n: 5, len: [0.32, 0.78], rad: [0.05, 0.088], spread: 0.24, tilt: [0.15, 0.55], t0: 1.05, gap: 0.08, light: 3 },
    { c: new V3(3.8, 0, 0.72), n: 5, len: [0.28, 0.68], rad: [0.045, 0.082], spread: 0.24, tilt: [0.15, 0.6], t0: 1.6, gap: 0.08, light: 4 },
  ];
  const crystalPlan = [];
  function worldPlanes(C) { return C.planesL.map((P) => { const n = P.n.clone().applyQuaternion(C.quat); return { n, d: P.d + n.dot(C.base) }; }); }
  function overlaps(A, B) {
    // any above-ground corner of one inside the other's planes (both directions), with a margin
    const test = (X, Y) => {
      const pl = worldPlanes(Y);
      const pos = X.mesh.geometry.getAttribute('position');
      const v = new V3();
      for (let i = 0; i < pos.count; i += 3) {
        v.fromBufferAttribute(pos, i).applyQuaternion(X.quat).add(X.base);
        if (v.y < 0.005) continue;
        if (pl.every((P) => P.n.dot(v) - P.d < 0.012)) return true;
      }
      return false;
    };
    return test(A, B) || test(B, A);
  }
  CLUSTERS.forEach((K, ci) => {
    const made = [];
    for (let k = 0; k < K.n; k++) {
      for (let attempt = 0; attempt < 30; attempt++) {
        const big = k === 0;
        const a = rng() * Math.PI * 2, rr = big ? RR(0, 0.04) : RR(0.06, K.spread);
        const out = new V3(Math.cos(a), 0, Math.sin(a));
        const tilt = big ? RR(0.05, 0.16) : RR(K.tilt[0], K.tilt[1]) * (0.6 + rr / K.spread * 0.6);
        const axis = new V3(0, 1, 0).addScaledVector(out, Math.tan(tilt)).normalize();
        const s = big ? 1 : RR(0.25, 0.85);
        const len = K.len[0] + (K.len[1] - K.len[0]) * s, rad = K.rad[0] + (K.rad[1] - K.rad[0]) * (big ? 1 : s * RR(0.7, 1.1));
        const base = K.c.clone().addScaledVector(out, rr);
        const gy = heightAt(base.x, base.z); base.y = gy - 0.03;               // rooted in the pool floor
        const C = fx.createCrystal({ base, axis, length: len * 1.06 + Math.max(0, -gy), radius: rad, seed: ci * 100 + k * 7 + attempt * 31 + 3, pieces: Math.max(3, Math.min(9, Math.round(len * 7.5))), spin: RR(0, 6.28), groundY: gy });
        if (made.some((M) => overlaps(M, C))) { fx.group.remove(C.mesh, C.shard.mesh); fx.crystals.pop(); fx.shardSets.pop(); continue; }
        made.push(C);
        crystalPlan.push({ C, cluster: ci, t0: K.t0 + k * K.gap + (big ? 0 : RR(0, 0.05)), dur: 0.42 + len * 0.28, light: K.light });
        break;
      }
    }
  });
  // the chain: small points rising one after another back toward the palm, where the stream's drops fell
  for (let k = 0; k < 5; k++) {
    const u = k / 4;
    const c = new V3(2.4 - u * 1.15 + RR(-0.08, 0.08), -0.02, 0.34 - u * 0.05 + RR(-0.15, 0.15));
    const made = [];
    const m = k % 2 ? 2 : 3;
    for (let j = 0; j < m; j++) {
      for (let attempt = 0; attempt < 20; attempt++) {
        const a = rng() * Math.PI * 2, out = new V3(Math.cos(a), 0, Math.sin(a));
        const base = c.clone().addScaledVector(out, j ? RR(0.03, 0.07) : 0);
        const axis = new V3(0, 1, 0).addScaledVector(out, j ? RR(0.35, 0.8) : RR(0, 0.2)).normalize();
        const len = (j ? RR(0.07, 0.15) : RR(0.14, 0.26)) * (1 - u * 0.35), rad = (j ? RR(0.018, 0.028) : RR(0.026, 0.04)) * (1 - u * 0.25);
        const gy = heightAt(base.x, base.z); base.y = gy - 0.03;
        const C = fx.createCrystal({ base, axis, length: len + Math.max(0, -gy), radius: rad, seed: 900 + k * 13 + j * 101 + attempt * 7, pieces: j ? 2 : 3, spin: RR(0, 6.28), groundY: gy });
        if (made.some((M) => overlaps(M, C))) { fx.group.remove(C.mesh, C.shard.mesh); fx.crystals.pop(); fx.shardSets.pop(); continue; }
        made.push(C);
        crystalPlan.push({ C, cluster: 3, t0: 2.2 + k * 0.13 + j * 0.05, dur: 0.32 + len * 0.3, light: -1 });
        break;
      }
    }
  }
  const clusterGlow = [0, 0, 0, 0];
  fx.grabTwice = true;

  // ------------------------------------------------------------ helpers
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const easeOut = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const rnd = (() => { let s = 4242; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const R = (a, b) => a + (b - a) * rnd();
  const _v = new V3(), _w = new V3(), _x = new V3();
  const bez = (a, c, b, s, out) => out.set(0, 0, 0).addScaledVector(a, (1 - s) * (1 - s)).addScaledVector(c, 2 * (1 - s) * s).addScaledVector(b, s * s);

  // a gather thread's path from its pool up into the orb, curling a little round the palm
  const _ta = new V3(), _tc1 = new V3(), _tc2 = new V3(), _sa = new V3(), _sc = new V3();
  // smooth 1-D value noise (0..1), for shapes that wander instead of repeating
  const hash1 = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const vn1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash1(i) * (1 - u) + hash1(i + 1) * u; };
  // Each stream is its own: how far it winds, how it climbs, how thick it runs and how much the wind
  // pushes it. Together they still turn one way, so they read as one vortex drawing the water up, but
  // the funnel breathes and no two strands share a pitch: not a spring.
  const SP = SOURCES.map((_, i) => ({
    turn: 2.1 + 2.6 * hash1(i * 3.1 + 1), climb: 1.05 + 0.7 * hash1(i * 5.7 + 2), bow: 0.6 + 0.5 * hash1(i * 2.3 + 4),
    thick: 0.0125 + 0.004 * hash1(i * 7.9 + 3), wind: 0.025 + 0.045 * hash1(i * 4.4 + 5), seed: i * 13.7 + 2,
  }));
  // The last two streams hold the shot: a figure-eight that leaves the orb's underside, swings out,
  // crosses once and lands in the pool. Their paths (orb-relative, from the orb down to the water)
  // were solved from the shot's framing; the near one passes in front of the far one at the crossing.
  const FIG8 = [
    [[-0.134, -0.082, 0], [-0.152, -0.178, -0.003], [-0.148, -0.301, -0.012], [-0.097, -0.424, -0.027], [0.008, -0.558, -0.047], [0.149, -0.671, -0.074], [0.284, -0.763, -0.107], [0.383, -0.919, -0.145], [0.432, -1.083, -0.19], [0.441, -1.222, -0.24], [0.437, -1.305, -0.297]],
    [[0.13, -0.1, 0], [0.249, -0.187, -0.003], [0.345, -0.275, -0.011], [0.406, -0.379, -0.025], [0.4, -0.486, -0.045], [0.342, -0.594, -0.07], [0.282, -0.706, -0.101], [0.191, -0.821, -0.137], [0.075, -0.941, -0.179], [-0.034, -1.075, -0.227], [-0.098, -1.223, -0.28], [-0.107, -1.305, -0.339]],
  ].map((pts, k) => pts.map(([x, y, z], i, a) => new V3(x, y, z - (k === 1 ? 0.07 * Math.sin(Math.PI * i / (a.length - 1)) : 0))).reverse());   // reversed: from the water up
  const _cr = new V3();
  function catmull(pts, s, out) {
    const n = pts.length - 1, f = Math.min(n - 1e-6, Math.max(0, s * n)), i = Math.floor(f), u = f - i;
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
    const u2 = u * u, u3 = u2 * u;
    return out.set(0, 0, 0).addScaledVector(p0, -0.5 * u3 + u2 - 0.5 * u).addScaledVector(p1, 1.5 * u3 - 2.5 * u2 + 1).addScaledVector(p2, -1.5 * u3 + 2 * u2 + 0.5 * u).addScaledVector(p3, 0.5 * u3 - 0.5 * u2);
  }
  function threadPath(i, s, out, t = fx.time) {
    if (i >= 4) {
      const O = orb.position, P = SP[i];
      catmull(FIG8[i - 4], s, out).add(O);
      out.y = Math.max(out.y, 0);
      const env = Math.sin(Math.PI * s);
      out.x += (vn1(s * 3.1 - t * 0.9 + P.seed) - 0.5) * 0.03 * env; out.z += (vn1(s * 2.7 - t * 0.7 + P.seed + 40) - 0.5) * 0.03 * env;
      return out;
    }
    const S = SOURCES[i], O = orb.position, Rr = Math.max(orb.currentRadius, 0.05), P = SP[i];
    const dx = S.x - O.x, dz = S.z - O.z, rho0 = Math.hypot(dx, dz), a0 = Math.atan2(dz, dx);
    const a = a0 + P.turn * Math.pow(s, 1.6) + 0.5 * s;           // it lifts off nearly straight, then winds
    const breathe = 1 + 0.16 * Math.sin(t * 1.3 + i * 2.1) * Math.sin(Math.PI * s);
    const rho = (rho0 * Math.pow(1 - s, P.bow) + Rr * 0.86 * Math.pow(s, 1.6)) * breathe;
    const y = (O.y - 0.5 * Rr) * (1 - Math.pow(1 - s, P.climb));
    // the wind pushes it off the ideal path: slow, uneven, larger in the middle of the strand
    const env = Math.sin(Math.PI * s);
    const wx = (vn1(s * 3.1 - t * 0.9 + P.seed) - 0.5) * 2 * P.wind * env, wz = (vn1(s * 2.7 - t * 0.7 + P.seed + 40) - 0.5) * 2 * P.wind * env;
    const wy = (vn1(s * 4.3 - t * 1.3 + P.seed + 80) - 0.5) * P.wind * env;
    out.set(O.x + Math.cos(a) * rho + wx, y + wy, O.z + Math.sin(a) * rho + wz);
    return out;
  }
  // how thick the water runs at s: it necks and beads in a pattern that travels up with the flow
  function threadRadius(i, s, t) {
    const P = SP[i], ph = s * 6.5 - t * 2.6 + P.seed;
    // a rope of nearly even thickness (0.85-1.2x), with irregular beads riding up it (noise, not a sine)
    const swell = 0.85 + 0.35 * vn1(ph);
    const bead = 1 + 0.35 * Math.max(0, vn1(s * 23 - t * 4.2 + P.seed * 2) - 0.6) / 0.4 + 0.25 * Math.max(0, vn1(s * 41 - t * 6.1 + P.seed) - 0.7) / 0.3;
    return P.thick * swell * bead * (1 - 0.15 * s);
  }
  const TH = SOURCES.map((_, i) => ({ t0: 0.2 + i * 0.42 + (i % 2) * 0.06, rise: 0.8 + (i % 3) * 0.08, hold: 0.55, cut: 0, done: false, arrived: false, nextRip: 0, nextShed: 0 }));
  TH.forEach((T) => { T.cut = T.t0 + T.rise + T.hold; });
  // the figure-eight pair rise last and hold until the orb is full
  Object.assign(TH[4], { t0: 1.85, rise: 0.95 }); TH[4].cut = 4.0;
  Object.assign(TH[5], { t0: 2.15, rise: 0.95 }); TH[5].cut = 4.1;
  for (const k of [4, 5]) SOURCES[k].copy(FIG8[k - 4][0]).add(ORB_HOME).setY(0);

  function streamArc(s, out) {
    const A = _sa.copy(orb.position), B = SPLASH;
    const C = _sc.set((A.x + B.x) * 0.5, Math.max(A.y, B.y) + 0.93, (A.z + B.z) * 0.5 + 0.18);
    return bez(A, C, B, s, out);
  }

  // ------------------------------------------------------------ beats
  const camWant = { pos: new V3(), look: new V3(), fov: 44, k: 3 };
  const BEATS = {
    gather: {
      title: 'Gather', caption: 'Water rises from the tide pools', dur: 4.6,
      start() {
        want.r = 0.02; want.glow = 0.45; want.pos.copy(ORB_HOME); orb.settle = 0;
        if (!orb.visible) { orb.radius = 0.02; orb.position.copy(ORB_HOME); orb.glow = 0.4; }   // re-forms from nothing
        orb.visible = true;
        TH.forEach((T) => { T.done = false; T.arrived = false; T.nextRip = 0; });
        stream.visible = false; loose.length = 0;
        for (const S of fx.shardSets) if (S.active) S.meltFrom = 0;
      },
      events: [],
      step(t, dt) {
        // shards left from the last cast melt back into the stone, their corners kept on it
        for (const S of fx.shardSets) if (S.active) S.melt = clamp01(t / 1.6);
        let arrived = 0;
        TH.forEach((T, i) => {
          const tube = threads[i];
          const head = clamp01((t - T.t0) / T.rise);
          const tail = clamp01((t - T.cut) / 0.45);
          if (head <= 0 || tail >= 1) { tube.visible = false; return; }
          tube.visible = true;
          const sHead = easeOut(head), sTail = tail * tail;
          if (head >= 1 && !T.arrived) {
            T.arrived = true;
            _v.copy(threadPath(i, 0.97, _x)).sub(orb.position).normalize();
            orb.ring(_v, 0.05, 2.4, 0.2); orb.kick(i % 4, 0.025);
          }
          if (T.arrived) arrived++;
          const n = 40, pts = tube.points, rad = tube.radii, fades = (tube.fades = tube.fades || []);
          pts.length = rad.length = fades.length = 0;
          for (let k = 0; k < n; k++) {
            const s = sTail + (sHead - sTail) * (k / (n - 1));
            pts.push(threadPath(i, s, new V3()));
            const fromHead = (sHead - s) / Math.max(sHead - sTail, 1e-3);
            const root = Math.exp(-s * 40) * (1 - tail);
            let r = threadRadius(i, s, t) * (0.6 + 0.4 * smooth(0, 0.15, fromHead)) + 0.006 * root;
            if (head < 1) r *= 1 + 0.7 * Math.exp(-fromHead * fromHead * 400);   // a bead leads the rise
            if (tail > 0) r *= 1 - 0.5 * tail;
            rad.push(r); fades.push(1);
          }
          tube.along0 = sTail * (SOURCES[i].distanceTo(orb.position) * 1.3);   // the ripples stay on the water, not on the mesh
          if (t > T.nextRip && tail < 0.6) {                // the pool rings round the root while it draws
            T.nextRip = t + 0.32;
            fx.ripple(SOURCES[i], { slope: 0.16, speed: 0.26, wavelength: 0.03, decay: 1.6, width: 0.016, life: 1.6 });
          }
          if (i >= 4 && head > 0.5 && dt > 0) {            // drip threads: drops hanging off fixed points of the figure-eight, falling in columns
            for (const s0 of [0.32, 0.47, 0.61, 0.74, 0.86]) {
              if (rnd() < dt * 7) { threadPath(i, s0 + (i === 5 ? 0.04 : 0), _v); _v.y -= threadRadius(i, s0, t); fx.drop(_v, _w.set(R(-0.03, 0.03), R(-0.15, 0), R(-0.03, 0.03)), { size: R(0.004, 0.009), life: 2, drag: 0.1, ripple: 0.7 }); }
            }
          }
          if (head > 0.2 && t > T.nextShed) {               // a bead pinches off and falls: water sheds drops as it climbs
            T.nextShed = t + R(0.06, 0.22);
            const s = R(sTail + 0.1, sHead * 0.9); threadPath(i, s, _v); threadPath(i, Math.min(1, s + 0.03), _x);
            _w.subVectors(_x, _v).normalize().multiplyScalar(R(0.2, 0.6)).add(_x.set(R(-0.2, 0.2), R(-0.4, 0.), R(-0.2, 0.2)));
            fx.drop(_v, _w, { size: threadRadius(i, s, t) * R(0.35, 0.6), life: 1.8, ripple: 0.5, drag: 0.15 });
          }
          if (tail > 0 && !T.done && rnd() < dt * 20) {     // the cut tail beads up and some drops fall back
            threadPath(i, sTail, _v);
            fx.drop(_v, _w.set(R(-0.2, 0.2), R(-0.5, 0.3), R(-0.2, 0.2)), { size: R(0.002, 0.004), life: 1.6, ripple: 0.8 });
          }
        });
        want.r = 0.03 + 0.25 * smooth(0.5, 4.0, t) * (0.35 + 0.65 * arrived / SOURCES.length);
        // drops lifted off the pool and carried up the same vortex
        const VF = fx.vortexField;
        VF.on = t < 4.2; VF.center.copy(orb.position); VF.radius = orb.currentRadius * 0.9; VF.swirl = 5.5; VF.pull = 1.2; VF.lift = 5;
        if (dt > 0 && t > 0.3 && t < 3.6) {
          const n = Math.round(dt * 46 + rnd() * 0.6);
          for (let k = 0; k < n; k++) {
            const a = R(0, 6.283), rr = R(0.3, 0.85);
            _v.set(orb.position.x + Math.cos(a) * rr, 0.01, orb.position.z + Math.sin(a) * rr);
            _w.set(-Math.sin(a) * R(0.6, 1.4) - Math.cos(a) * 0.3, R(0.6, 1.6), Math.cos(a) * R(0.6, 1.4) - Math.sin(a) * 0.3);
            fx.drop(_v, _w, { size: R(0.0012, 0.003), life: R(1.2, 1.8), gravity: 0.1, drag: 0.9, ripple: 0, kind: 1 });
            if (rnd() < 0.15) fx.ripple(_v, { slope: 0.08, speed: 0.22, wavelength: 0.02, decay: 2.2, width: 0.012, life: 1.1, small: true });
          }
        }
        want.glow = 0.45 + 0.6 * smooth(0.8, 3.8, t);
        orb.settle = smooth(3.4, 4.6, t);
        orb.neck.len = 0;
      },
      cam(t) {
        const u = smooth(0, 4.6, t);
        return { pos: new V3(-0.5 + 0.28 * u, 0.98 + 0.06 * u, 2.1 + 0.45 * u), look: new V3(0.12 + 0.1 * u, 0.76, 0.25), fov: 44 + 2 * u, k: 3, tilt: 5 };
      },
    },

    current: {
      title: 'Current', caption: 'The orb unspools into a lash', dur: 4.6,
      start() { hideThreads(); orb.settle = 0.4; want.glow = 1.05; this.landed = false; this.released = false; this.burst = false; this.nextChurn = 0; stream.visible = false; loose.length = 0; },
      events: [
        [0.15, () => { orb.kick(1, -0.05); orb.ring(_v.set(1, 0.2, -0.1), 0.05, 2.2, 0.22); }],
        [1.02, () => {
          BEATS.current.landed = true;
          fx.crown(SPLASH, { radius: 0.16, height: 0.3, life: 0.8 });
          fx.spray(_v.copy(SPLASH).setY(0.04), { count: 160, dir: UP, spread: 0.9, speed: [1.2, 3.6], size: [0.002, 0.0065], life: [1, 2], ripple: 0.35 });
          for (let k = 0; k < 3; k++) fx.ripple(SPLASH, { slope: 0.42 - k * 0.1, speed: 0.55 - k * 0.1, wavelength: 0.06 + k * 0.012, decay: 0.75, width: 0.05, life: 3.6, delay: k * 0.16 });
          fx.addFoam(SPLASH, 0.7, 3.2);
          fx.wet[0].set(SPLASH.x, SPLASH.z, 0.7, 0.6);
          fx.flashLight(1, _v.copy(SPLASH).setY(0.25), 5, 3.5);
          fx.front(_v.copy(SPLASH).setY(0.15), _w.copy(camera.position).sub(SPLASH).normalize(), { radius: 1.6, thick: 0.06, life: 0.36, amp: 0.02 });
          fx.impact({ hold: 0.05, frame: 'none', shake: 0.007, at: SPLASH });
        }],
        [2.75, () => BEATS.current.release()],
      ],
      release() {
        this.released = true;
        // the stream lets go of the orb: every point keeps the velocity of the water there and falls
        loose.length = 0;
        const n = 46;
        for (let k = 0; k < n; k++) {
          const s = k / (n - 1);
          const p = streamArc(s, new V3()), q = streamArc(Math.min(1, s + 0.02), new V3());
          const v = q.sub(p).normalize().multiplyScalar(2.4 * (1 - s * 0.5));
          loose.push({ p, v, alive: true, s });
        }
        orb.ring(_v.set(1, -0.2, 0), 0.07, 2.6, 0.2); orb.kick(1, 0.06);
        want.r = 0.16;
      },
      step(t, dt) {
        const T = this;
        orb.neck.dir.copy(streamArc(0.06, _x)).sub(orb.position).normalize();
        // anticipation: the orb draws back toward the palm and stretches, then lashes
        const back = t < 0.6 ? smooth(0, 0.55, t) : 1 - smooth(0.6, 0.85, t);
        want.pos.copy(ORB_HOME).addScaledVector(_v.set(-1, 0.1, 0.05), 0.09 * back).add(_w.set(-0.04, 0.02, -0.006).multiplyScalar(smooth(0, 0.8, t))).lerp(HOVER, smooth(3.0, 4.5, t));
        if (!T.released) {
          const head = easeOut(clamp01((t - 0.58) / 0.44));
          if (head <= 0) { stream.visible = false; orb.neck.len = 0.35 * smooth(0.3, 0.58, t); orb.neck.r = 0.45; }
          else {
            stream.visible = true;
            orb.neck.len = 0.55; orb.neck.r = 0.32;
            const pts = stream.points, rad = stream.radii, fades = (stream.fades = stream.fades || []);
            pts.length = rad.length = fades.length = 0;
            const n = 60;
            const whip = Math.exp(-Math.max(0, t - 0.6) * 2.6);
            for (let k = 0; k < n; k++) {
              const u = k / (n - 1), s = 0.05 + (head - 0.05) * u;
              const p = streamArc(Math.max(0, s), new V3());
              // the whip: a bend that runs out along the stream to its tip and dies away
              const wave = Math.sin((u - (t - 0.58) * 2.4) * 9.5) * 0.11 * whip * Math.sin(Math.PI * u);
              p.x += -wave * 0.3; p.z += wave; p.y += wave * 0.35;
              // and the air pushes it about: slow, uneven sway, more toward the far end
              const env = Math.sin(Math.PI * u) * (0.4 + 0.6 * u);
              p.x += (vn1(u * 2.6 - t * 0.8 + 3) - 0.5) * 0.09 * env; p.y += (vn1(u * 3.3 - t * 1.1 + 9) - 0.5) * 0.05 * env; p.z += (vn1(u * 2.2 - t * 0.7 + 17) - 0.5) * 0.09 * env;
              pts.push(p);
              // it runs thick out of the neck, thins, necks and beads along the way with the flow
              const ph = u * 5.5 - t * 3.4;
              // thin and broken into beads near the orb, swelling as it falls and gathers toward the impact
              const bead = 0.7 + 0.6 * Math.max(0, vn1(u * 60 - t * 18) - 0.4) / 0.6 * (1 - smooth(0.3, 0.5, u));
              let r = (0.024 + 0.03 * smooth(0.55, 0.97, u)) * (0.8 + 0.4 * vn1(ph + 21)) * bead * (1 + 0.3 * Math.max(0, vn1(u * 17 - t * 6 + 4) - 0.55) / 0.45);
              if (!T.landed) r *= 1 + 0.55 * Math.exp(-Math.pow((1 - u) * 14, 2));   // the leading head
              rad.push(r); fades.push(1);
            }
            stream.along0 = 0;
          }
          want.r = T.landed ? 0.27 - 0.1 * smooth(1.0, 2.7, t) : 0.27 - 0.05 * head;
          if (T.landed && t > T.nextChurn && t < 2.7) {     // it keeps pouring: a churning foot
            T.nextChurn = t + R(0.13, 0.2);
            fx.crown(_v.copy(SPLASH).add(_w.set(R(-0.06, 0.06), 0, R(-0.06, 0.06))), { radius: R(0.1, 0.15), height: R(0.13, 0.22), life: 0.6 });
            fx.spray(_v.setY(0.03), { count: 16, dir: UP, spread: 1, speed: [0.8, 2.4], size: [0.0012, 0.0035], life: [0.8, 1.4], ripple: 0.3 });
            fx.ripple(SPLASH, { slope: 0.3, speed: 0.45, wavelength: 0.05, decay: 0.7, width: 0.04, life: 3 });
          }
          if (head > 0.1 && t < 2.72 && dt > 0) {          // beads thrown off the jet along its whole length
            const nB = Math.round(dt * 70 + rnd() * 0.6);
            for (let k = 0; k < nB; k++) {
              const u = R(0.05, Math.max(0.06, head * 0.95)); streamArc(u, _v); streamArc(Math.min(1, u + 0.02), _x);
              _w.subVectors(_x, _v).normalize().multiplyScalar(R(1.2, 2.6)).add(_x.set(R(-0.5, 0.5), R(-0.2, 0.6), R(-0.5, 0.5)));
              _v.add(_x.set(R(-0.02, 0.02), R(-0.02, 0.02), R(-0.02, 0.02)));
              fx.drop(_v, _w, { size: R(0.004, 0.011), life: 1.6, drag: 0.2, ripple: 0.4 });
            }
          }
          if (T.landed && t < 2.72 && dt > 0) {            // spray thrown off the foot the whole time it pours
            const n = Math.round(dt * 150 + rnd() * 0.6);
            for (let k = 0; k < n; k++) {
              const a = R(0, 6.283);
              fx.drop(_v.copy(SPLASH).add(_w.set(Math.cos(a) * 0.05, 0.03, Math.sin(a) * 0.05)), _x.set(Math.cos(a) * R(0.4, 1.3), R(0.9, 2.4), Math.sin(a) * R(0.4, 1.3)), { size: R(0.0012, 0.0032), life: 1.4, ripple: 0.25 });
            }
          }
          if (T.landed) {
            fx.setLight(6, _v.copy(SPLASH).setY(0.22), 1.6);   // the churning foot glows; a light inside the stream would glint all over its own skin
            for (let k = 0; k < 3; k++) { streamArc(0.35 + k * 0.25, _v); fx.caus[2 + k].set(_v.x, _v.z, 0.32, 0.9 * (1 - smooth(2.4, 3.0, t))); fx.causCol[2 + k].set(0.75, 0.88, 1, 0); }
          }
        } else {
          // ballistic fall: the stream thins, beads up (Plateau-Rayleigh) and breaks into drops
          const since = t - 2.75;
          const pts = stream.points, rad = stream.radii, fades = stream.fades;
          pts.length = rad.length = fades.length = 0;
          for (const L of loose) {
            if (!L.alive) continue;
            L.v.y -= 9.8 * dt; L.p.addScaledVector(L.v, dt);
            if (L.p.y <= 0.01) {
              L.alive = false;
              if (rnd() < 0.5) fx.ripple(L.p, { slope: 0.14, speed: 0.3, wavelength: 0.03, decay: 1.6, width: 0.02, life: 1.6 });
              fx.spray(L.p.clone().setY(0.02), { count: 3, dir: UP, spread: 1, speed: [0.5, 1.4], size: [0.0012, 0.003], life: [0.6, 1], ripple: 0.2 });
            }
          }
          const broken = since > 0.42;
          if (broken && !T.burst) {
            T.burst = true;
            for (const L of loose) if (L.alive) for (let j = 0; j < 2; j++) fx.drop(L.p.clone().add(_w.set(R(-0.01, 0.01), R(-0.01, 0.01), R(-0.01, 0.01))), L.v.clone().add(_x.set(R(-0.2, 0.2), R(-0.2, 0.2), R(-0.2, 0.2))), { size: R(0.003, 0.006), life: 2, ripple: 0.6, drag: 0.1 });
          }
          if (!broken) {
            loose.forEach((L, k) => {
              if (!L.alive) return;
              pts.push(L.p.clone());
              const bead = 1 + Math.min(0.9, since * 2.2) * Math.sin(k * 2.1 + since * 3);
              rad.push(0.03 * (1 - 0.4 * L.s) * (1 - since * 1.4) * bead); fades.push(1);
            });
          }
          stream.visible = pts.length >= 2 && !broken;
          orb.neck.len = 0.4 * (1 - smooth(0, 0.25, since)); orb.neck.r = 0.3;
          fx.setLight(6, SPLASH, 0);
          for (let k = 0; k < 3; k++) fx.caus[2 + k].w *= Math.exp(-dt * 5);
        }
        if (T.landed) fx.wet[0].w = 0.6;
      },
      cam(t) {
        const u = smooth(0, 4.6, t);
        return { pos: new V3(0.9 + 0.4 * u, 1.08 - 0.08 * u, 3.95 - 0.2 * u), look: new V3(1.5 + 0.25 * u, 0.68, -0.08), fov: 48, k: 2.5, tilt: 6 };
      },
    },

    crystallize: {
      title: 'Crystallize', caption: 'Crystals erupt where it lands', dur: 4.4,
      start() { hideThreads();
        want.r = 0.16; want.glow = 0.9; want.pos.copy(HOVER); orb.settle = 0.8; stream.visible = false; loose.length = 0; orb.neck.len = 0;
        for (const P of crystalPlan) { const C = P.C; C.shattered = false; C.visible = false; C.grow = 0; C.glow = 0; C.crack = 0; C.veil = 0; C.frost = 0; P.started = false; C.shard.active = false; C.shard.mesh.visible = false; }
        for (let k = 0; k < 4; k++) clusterGlow[k] = 0;
      },
      events: [
        [0.05, () => { fx.addFrost(LAND, 1.05, { grow: 0.7, life: 4.6 }); fx.ripple(LAND, { slope: 0.12, speed: 0.6, wavelength: 0.03, decay: 1, width: 0.02, life: 2 }); }],
        [1.0, () => fx.addFrost(CLUSTERS[1].c, 0.6, { grow: 0.5, life: 3.8 })],
        [1.55, () => fx.addFrost(CLUSTERS[2].c, 0.6, { grow: 0.5, life: 3.4 })],
      ],
      step(t, dt) { growCrystals(t, dt); },
      cam(t) {
        const u = smooth(0, 4.4, t);
        return { pos: new V3(1.6 + 0.25 * u, 0.62 - 0.08 * u, 2.5 - 0.3 * u), look: new V3(2.95, 0.5 + 0.05 * u, -0.18), fov: 46 - 2 * u, k: 2.5 };
      },
    },

    resonance: {
      title: 'Resonance', caption: 'Light rings through the crystals', dur: 5.0,
      start() { hideThreads(); want.r = 0.16; want.glow = 1.1; orb.settle = 0.8; this.pulses = [0.3, 1.35, 2.4, 3.4]; this.fired = 0; for (const P of crystalPlan) { P.C.visible = true; P.C.grow = 1; P.C.veil = 0; P.hits = []; } },
      events: [],
      step(t, dt) {
        const T = this;
        if (T.fired < T.pulses.length && t >= T.pulses[T.fired]) {
          T.fired++;
          orb.ring(_v.set(0.3, 1, 0.2), 0.05, 2.8, 0.2); orb.kick(0, 0.03);
          fx.front(orb.position, _v.copy(camera.position).sub(orb.position).normalize(), { radius: 3.4, thick: 0.05, life: 1.0, amp: 0.016 });
          fx.front(_v.copy(orb.position).setY(0.05), UP, { radius: 4.2, thick: 0.08, life: 1.15, amp: 0.012 });
          for (const P of crystalPlan) P.hits.push(t + P.C.base.distanceTo(orb.position) / 3.6);   // the ring reaches each crystal in turn
        }
        const final = smooth(3.9, 5.0, t);
        for (const P of crystalPlan) {
          const C = P.C;
          let g = 0.13 + 0.05 * Math.sin(t * 1.3 + P.t0 * 5);
          let last = -1;
          for (const h of P.hits) if (t >= h) { const a = t - h; g += 2.0 * (1 - Math.exp(-a / 0.08)) * Math.exp(-a / 0.65); last = a; }   // each swell rises, then settles
          C.band = last >= 0 ? last * 1.9 - 0.15 : -1;
          g = g * (1 - final) + final * (1.6 + 0.6 * smooth(4.4, 5, t));
          C.glow += (g - C.glow) * (1 - Math.exp(-dt * 14));
          C.crack = smooth(4.35, 4.95, t) * (P.cluster === 3 ? 0.8 : 1);
        }
        clusterGlowFromCrystals();
        want.glow = 1 + 0.4 * final;
      },
      cam(t) {
        const u = smooth(0, 5, t);
        return { pos: new V3(1.25 + 0.45 * u, 0.86 - 0.06 * u, 3.55 + 0.1 * u), look: new V3(2.15 + 0.35 * u, 0.6, -0.2), fov: 46 - 2 * u, k: 2.2, tilt: 9 };
      },
    },

    shatter: {
      title: 'Shatter and rain', caption: 'Shards fall, the orb breaks into rain', dur: 5.8,
      start() { hideThreads(); this.rainOn = 0; this.broke = false; orb.settle = 0.6; for (const P of crystalPlan) { P.C.visible = true; P.C.grow = 1; } },
      events: [
        [0.0, () => {
          fx.impact({ hold: 0.08, frame: 'center', shake: 0.012, at: LAND });
          fx.flashLight(5, _v.copy(LAND).setY(0.5), 9, 3);
          fx.front(_v.copy(LAND).setY(0.5), _w.copy(camera.position).sub(LAND).normalize(), { radius: 2.6, thick: 0.07, life: 0.42, amp: 0.026 });
          fx.front(_v.copy(LAND).setY(0.04), UP, { radius: 3.6, thick: 0.1, life: 0.55, amp: 0.016, delay: 0.05 });
          for (const P of crystalPlan) {
            const K = P.cluster < 3 ? CLUSTERS[P.cluster].c : P.C.base;
            fx.shatter(P.C, { center: _v.copy(K).setY(0), strength: P.cluster < 3 ? 1.2 : 0.7, up: 1.2 });
            // the crystals were water: some of it sprays out as they break
            fx.spray(_w.copy(P.C.base).addScaledVector(P.C.axis, P.C.length * 0.5).setY(Math.max(0.05, P.C.length * 0.4)), { count: Math.round(10 + P.C.length * 20), speed: [0.8, 3], size: [0.0015, 0.004], life: [1, 1.8], ripple: 0.3 });
          }
          for (let k = 0; k < 3; k++) fx.ripple(CLUSTERS[k].c, { slope: 0.25, speed: 0.5, wavelength: 0.05, decay: 0.9, width: 0.04, life: 3 });
        }],
        [0.6, () => { want.pos.set(1.45, 1.75, 0.1); }],
        [1.7, () => {
          BEATS.shatter.broke = true;
          orb.visible = false;
          fx.spray(orb.position, { count: 220, speed: [0.8, 3.2], size: [0.002, 0.006], life: [1.4, 2.4], ripple: 0.5, up: 0.5 });
          fx.front(orb.position, _w.copy(camera.position).sub(orb.position).normalize(), { radius: 2.2, thick: 0.05, life: 0.45, amp: 0.024 });
          fx.flashLight(1, orb.position, 5, 2.5);
          fx.impact({ hold: 0, frame: 'none', shake: 0.005, at: orb.position });
        }],
      ],
      step(t, dt) {
        for (const P of crystalPlan) { P.C.glow *= Math.exp(-dt * 3); P.C.crack = 0; }
        clusterGlowFromCrystals(true);
        for (let k = 0; k < 3; k++) fx.setLight(CLUSTERS[k].light, _v.copy(CLUSTERS[k].c).setY(0.3), (0.7 + 2.2 * Math.exp(-t * 0.9)) * (k === 0 ? 1 : 0.6));   // the broken stone keeps a little of its light
        // rain: thrown up out of the broken orb, falling over the whole shore, then thinning
        const rain = this.broke ? smooth(1.75, 2.3, t) * (1 - 0.55 * smooth(3.4, 5.4, t)) : 0;   // it thins to a light rain that rings the pools to the end
        fx.groundUniforms.uRain.value = rain * 0.85;
        if (rain > 0 && dt > 0) {
          // the broken orb comes down as rain round where it burst, densest over the shards
          const n = Math.round(rain * 260 * dt + rnd());
          for (let k = 0; k < n; k++) {
            const a = R(0, 6.283), rr = Math.sqrt(rnd()) * 3.4;
            _v.set(2.2 + Math.cos(a) * rr, R(2.4, 3.6), 0.5 + Math.sin(a) * rr * 0.8);
            fx.drop(_v, _w.set(0.3, R(-5.2, -4.0), 0.1), { size: R(0.0018, 0.0034), life: 1.2, drag: 0.02, ripple: 0.06, kind: 2 });
          }
        }
        want.glow = this.broke ? 0 : 1.2;
      },
      cam(t) {
        const u = smooth(0.3, 5.6, t);
        return { pos: new V3(1.2 + 0.55 * u, 1.2 - 0.62 * u, 4.4 - 1.6 * u), look: new V3(2.6 + 0.15 * u, 0.42 - 0.3 * u, -0.05 + 0.3 * u), fov: 48 - 6 * u, k: 2.2 };
      },
    },
  };
  const ORDER = ['gather', 'current', 'crystallize', 'resonance', 'shatter'];

  function growCrystals(t, dt) {
    for (const P of crystalPlan) {
      const C = P.C;
      const x = (t - P.t0) / P.dur;
      if (x <= 0) { C.visible = false; continue; }
      C.visible = true;
      if (!P.started) {
        P.started = true;
        // it breaks the surface: a ring, water thrown off, a flash of its light on the stone
        fx.ripple(C.base, { slope: 0.18 + C.length * 0.15, speed: 0.38, wavelength: 0.035, decay: 1.3, width: 0.025, life: 2.2, small: P.cluster === 3 });
        fx.spray(_v.copy(C.base).setY(0.03), { count: Math.round(6 + C.length * 22), dir: C.axis, spread: 0.7, speed: [0.6, 1.8 + C.length], size: [0.0012, 0.0035], life: [0.8, 1.5], ripple: 0.4 });
      }
      C.grow = easeOut(x);
      // the water veil: it rises sheathed in water that drains off once it stops
      C.veil = 1 - smooth(1.4, 2.2, x);
      C.veilT = 1 - smooth(1.0, 2.1, x);
      C.frost = 1 - smooth(2.5, 9, x);
      const g = 0.7 * Math.exp(-Math.max(0, x - 0.6) * 1.6) + 0.13;   // it keeps a faint light of its own
      C.glow += (g - C.glow) * (1 - Math.exp(-dt * 10));
      if (x < 1 && rnd() < dt * 26 * C.length) {         // water sheeting off its faces as it rises
        _v.copy(C.mesh.position).addScaledVector(C.axis, C.tipTop * (0.5 + 0.5 * rnd()));
        if (_v.y > 0.05) fx.drop(_v, _w.set(R(-0.6, 0.6), R(0.2, 1.4), R(-0.6, 0.6)), { size: R(0.0012, 0.003), life: 1.3, ripple: 0.3 });
      }
    }
    clusterGlowFromCrystals();
  }
  function clusterGlowFromCrystals(decayOnly = false) {
    const sum = [0, 0, 0, 0], n = [0, 0, 0, 0];
    for (const P of crystalPlan) { if (!P.C.visible && !P.C.shattered) continue; const v = P.C.shattered ? 0 : P.C.glow * (0.4 + P.C.length); sum[P.cluster] += v; n[P.cluster]++; }
    for (let k = 0; k < 3; k++) {
      const K = CLUSTERS[k];
      const e = sum[k] * 0.9;
      fx.setLight(K.light, _v.copy(K.c).setY(0.12), e * 1.0);           // at the waterline: the base burns white-hot and spills onto the pool
    }
    // the clusters' light, bent through their faces, lands on the stone as dispersed caustics
    const slots = [1, 2, 3];
    for (let k = 0; k < 3; k++) {
      const K = CLUSTERS[k], g = Math.max(0, sum[k] * 0.55 - 0.15);
      fx.caus[slots[k]].set(K.c.x + 0.2, K.c.z + 0.45, 0.85 + k * 0.05, g * 2.4 + 0.25 * (k === 0 ? 1 : 0.5) * (sum[k] > 0 ? 1 : 0));   // the pool floor round them carries their light as a caustic net
      fx.causCol[slots[k]].set(0.95, 0.82, 0.58, 0.014);   // the light bent through the crystals lands warm-white on the pool floor
    }
  }

  const idle = {
    title: 'Idle', caption: 'Holding the water', dur: Infinity, events: [],
    start() {
      hideThreads(); want.glow = 0.8; orb.settle = 0.8; stream.visible = false;
      if (!orb.visible) { orb.radius = 0.02; orb.position.copy(ORB_HOME); orb.glow = 0.3; want.r = 0.03; }   // after the burst it re-forms over the palm, from nothing
      else want.r = Math.max(want.r, 0.12);
      orb.visible = true;
    },
    step(t, dt) { want.pos.copy(ORB_HOME); fx.groundUniforms.uRain.value *= Math.exp(-dt * 2); for (const P of crystalPlan) P.C.glow *= Math.exp(-dt * 2); },
    cam(t) { return { pos: new V3(0.4, 1.0, 3.9), look: new V3(1.1, 0.8, 0.1), fov: 46, k: 2 }; },
  };

  // ------------------------------------------------------------ runner
  const run = { beat: idle, name: 'idle', t: 0, fired: 0, loop: false, idleLeft: 0, listeners: [] };
  function start(name) {
    const b = name === 'idle' ? idle : BEATS[name];
    fx.ramp(1, 0.05);
    run.beat = b; run.name = name; run.t = 0; run.fired = 0;
    b.start?.call(b);
    for (const fn of run.listeners) fn(name, b);
  }
  function play(name) {
    if (name === 'all') { run.loop = true; start('gather'); return; }
    run.loop = false;
    // a beat played alone sets up what the earlier beats would have left behind
    if (name === 'resonance' || name === 'shatter') { BEATS.crystallize.start(); for (const P of crystalPlan) P.started = true; growCrystals(9, 1); for (const P of crystalPlan) { P.C.veil = 0; P.C.frost = 0; } orb.radius = want.r = 0.16; orb.visible = true; orb.position.copy(HOVER); want.pos.copy(HOVER); }
    if (name === 'crystallize' || name === 'current') orb.visible = true;
    if (name === 'current' && orb.radius < 0.2) { orb.radius = want.r = 0.27; }
    start(name);
  }
  // the orb's size, glow and place follow what each beat asks for through a short ease: no pops
  function advance(dt) {
    const b = run.beat;
    run.t += dt;
    while (run.fired < b.events.length && b.events[run.fired][0] <= run.t) b.events[run.fired++][1]();
    b.step.call(b, run.t, dt);
    if (dt > 0) {
      const k = 1 - Math.exp(-dt * 3.2), kg = 1 - Math.exp(-dt * 4), kp = 1 - Math.exp(-dt * 5);
      orb.radius += (want.r - orb.radius) * k;
      orb.glow += (want.glow - orb.glow) * kg;
      orb.position.lerp(want.pos, kp);
      // a hovering orb bobs a little on the palm's breath
      orb.position.y += Math.sin(fx.time * 1.7) * 0.0006;
    }
    if (orb.visible) {
      fx.setLight(0, orb.position, (0.9 + 3.2 * orb.radius / 0.27) * orb.glow);
      fx.caus[0].w = 0;                                                  // the orb throws no caustic patch: it is clear water, not a lamp
      fx.causCol[0].set(0.2, 0.85, 1.0, 0);
    } else { fx.setLight(0, orb.position, 0); fx.caus[0].w = 0; }
    if (run.name !== 'current') { fx.setLight(6, SPLASH, 0); for (let k = 0; k < 3; k++) if (run.name === 'gather') fx.caus[2 + k].w *= Math.exp(-dt * 4); }
    if (run.name !== 'current') fx.wet[0].w *= Math.exp(-dt * 0.3);
    if (run.t >= b.dur) {
      if (run.loop) {
        const i = ORDER.indexOf(run.name);
        if (i >= 0 && i < ORDER.length - 1) start(ORDER[i + 1]);
        else { start('idle'); run.idleLeft = 0.8; }
      } else start('idle');
    } else if (run.name === 'idle' && run.loop && (run.idleLeft -= dt) <= 0) start('gather');
  }

  // ------------------------------------------------------------ camera rig
  const cam = { pos: new V3(), look: new V3(), fov: 44, tilt: 0, init: false };
  let portraitPull = 0; const _lk = new V3();
  function updateCamera(dt) {
    const w = run.beat.cam(run.t);
    if (!cam.init) { cam.pos.copy(w.pos); cam.look.copy(w.look); cam.fov = w.fov; cam.init = true; }
    const a = 1 - Math.exp(-w.k * (0.3 + 0.7 * smooth(0, 1.4, run.t)) * dt);   // a new beat eases the camera in
    cam.pos.lerp(w.pos, a); cam.look.lerp(w.look, a); cam.fov += (w.fov - cam.fov) * a;
    cam.tilt += ((w.tilt || 0) - cam.tilt) * (1 - Math.exp(-2.5 * dt));   // a few px of pitch (at 720 lines), eased across beats
    const narrow = camera.aspect < 1 ? Math.pow(1 / camera.aspect, 0.55) : 1;   // portrait: back off so the skill keeps its frame
    // a portrait frame is narrow: turn toward the orb as well, so it never sits outside the slice
    portraitPull += ((orb.visible && camera.aspect < 1 ? 0.95 * (1 - camera.aspect) : 0) - portraitPull) * (1 - Math.exp(-dt * 3));
    _lk.copy(cam.look).lerp(orb.position, portraitPull);
    camera.position.copy(_lk).addScaledVector(_v.subVectors(cam.pos, cam.look), narrow);
    camera.position.y = Math.max(0.2, camera.position.y);
    camera.lookAt(_lk);
    if (Math.abs(camera.fov - cam.fov) > 1e-3) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }
    if (cam.tilt) camera.rotateX(-Math.atan(cam.tilt / (360 / Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5))));
    camera.updateMatrixWorld();
    sky.position.copy(camera.position);
  }

  // ------------------------------------------------------------ size and loop
  let width = 0, height = 0;
  const dprCap = Math.min(1.5, Number(params.get('dpr')) || 1.5);
  function resize() {
    const w = canvas.clientWidth || window.innerWidth || 1280, h = canvas.clientHeight || window.innerHeight || 720;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    if (w === width && h === height && renderer.getPixelRatio() === dpr) return;
    width = w; height = h;
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    fx.setSize(w * dpr, h * dpr, dpr);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    dirty = true;
  }
  new ResizeObserver(() => { dirty = true; }).observe(canvas);
  addEventListener('resize', () => { dirty = true; });
  let paused = false, last = 0, lastTick = 0;
  function frame(realDt) {
    resize();
    const simDt = fx.update(realDt);
    advance(simDt);
    updateCamera(fx.holding ? 0 : realDt * Math.max(0.45, fx.timeScale * fx.rampValue));
    fx.render();
  }
  function loop(now) {
    requestAnimationFrame(loop);
    lastTick = performance.now();
    const dt = last ? (now - last) / 1000 : 1 / 60; last = now;
    if (paused) { if (dirty) { dirty = false; frame(0); } return; }
    frame(dt);
  }
  document.addEventListener('visibilitychange', () => { last = 0; });

  resize();
  fx.warmup();
  start('idle');
  if (reduceMotion || params.has('still')) {
    // a composed still: the crystals grown and ringing with light. Beats still play on request.
    play('resonance');
    for (let i = 0; i < 96; i++) frame(1 / 60);
    paused = true; dirty = true;
  } else if (!params.has('idle')) play('all');
  frame(1 / 60);
  requestAnimationFrame(loop);
  // if rAF never runs (a hidden tab), still paint a settled frame
  setInterval(() => { if (performance.now() - lastTick > 600) { lastTick = performance.now(); frame(paused ? 0 : 1 / 60); } }, 500);

  window.stage = {
    fx, play, BEATS, ORDER, reduceMotion, camera, orb, crystals: crystalPlan, LAND, ground, pools, sky, heightAt,
    get beat() { return run.name; }, get loop() { return run.loop; }, get time() { return run.t; },
    get paused() { return paused; },
    setPaused(v) { paused = v; last = 0; dirty = true; },
    setOption(k, v) { fx.options[k] = v; dirty = true; },
    setTimeScale(v) { fx.timeScale = v; },
    onBeat(fn) { run.listeners.push(fn); },
    step(dt, n = 1) { for (let i = 0; i < n; i++) frame(dt); },   // deterministic stepping for captures
    redraw() { dirty = true; },
  };
})();
