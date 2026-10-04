/* Black Lightning stage: a dark storm plain, a camera, and the five beats of one
   close-combat skill, all drawn by assets/storm-energy.mjs. There is no character
   model: the effects hang off an implied body, shoulder and fist, so what you see
   is the effect language alone. */
(() => {
  const THREE = window.THREE;
  const { createStormEnergy, ENERGY_LIGHTS_GLSL, GROUND_HEAT_GLSL, NOISE_GLSL, WET_GLSL } = window.StormEnergy;
  const V3 = THREE.Vector3;
  const UP = new V3(0, 1, 0);
  const canvas = document.getElementById('stage');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(location.search);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: params.has('capture') });
  const FOG = new THREE.Color(0.017, 0.024, 0.036);   // slate, measured off the targets' horizons  // a navy storm horizon, still lighter than the black smoke in front of it
  renderer.setClearColor(FOG, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.05, 220);
  const fx = createStormEnergy(THREE, { renderer, scene, camera, seed: 11 });
  if (reduceMotion) { fx.options.shake = 0; fx.options.fisheye = 0; fx.options.flashes = 'safe'; }

  // ------------------------------------------------------------ arena
  const sky = new THREE.Mesh(new THREE.SphereGeometry(120, 48, 24), new THREE.ShaderMaterial({
    uniforms: { uFog: { value: new V3(FOG.r, FOG.g, FOG.b) }, uTime: { value: 0 }, uSkyFlash: { value: 0 } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: NOISE_GLSL + `
      uniform vec3 uFog; uniform float uTime, uSkyFlash; varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir);
        float h = clamp(d.y, -.2, 1.);
        vec3 col = mix(uFog, vec3(.0055, .0095, .017), smoothstep(-.02, .5, h));
        vec2 q = d.xz / (d.y + .28);
        vec2 wq = q * .9 + vec2(fbm2(vec3(q * .6, 3.)), fbm2(vec3(q * .6, 8.))) * .9;   // warped hard: torn storm cloud, not streaks
        float cl = fbm4(vec3(wq + uTime * .012, uTime * .02)) * .5 + .5 + snoise(vec3(wq * 9., uTime * .05)) * .07 + snoise(vec3(wq * 23., 3.)) * .03;
        float clouds = smoothstep(.5, .68, cl) * smoothstep(-.04, .32, h);
        col += (clouds - .3) * vec3(.0019, .0025, .0035) + clouds * uSkyFlash * vec3(.02, .03, .06) + uSkyFlash * vec3(.002, .0035, .008) + uSkyFlash * uSkyFlash * vec3(.006, .01, .022);   // heavy lightning lifts the whole sky   // dim charcoal cloud with crisp texture: bright blue swathes fought the lightning
        gl_FragColor = vec4(col, 1.);
      }`,
    side: THREE.BackSide, depthWrite: false,
  }));
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);

  // The cracks use an integer hash and value noise that JavaScript reproduces exactly (crackEdge
  // below), so arcs at a strike can be traced along the very cracks the shader draws.
  const CRACK_GLSL = `
      uvec2 pcg2d(uvec2 v){
        v = v * 1664525u + 1013904223u; v.x += v.y * 1664525u; v.y += v.x * 1664525u; v ^= v >> 16u;
        v.x += v.y * 1664525u; v.y += v.x * 1664525u; v ^= v >> 16u; return v;
      }
      vec2 ihash(vec2 c){ return vec2(pcg2d(uvec2(ivec2(c) + 32768))) * (1. / 4294967295.); }
      vec2 vn(vec2 p){
        vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);
        return mix(mix(ihash(i), ihash(i + vec2(1., 0.)), u.x), mix(ihash(i + vec2(0., 1.)), ihash(i + vec2(1., 1.)), u.x), u.y) * 2. - 1.;
      }
      vec2 crackWarp(vec2 p){ return (vn(p * .35) + vn(p * .8 + 7.3) * .4) * .9 + vn(p * 3.7 + 1.3) * .06; }   // the fine term makes the crack edges jagged
      // distance to the nearest cell border (not f2 - f1, which swells near corners), the cell's id,
      // and the offset to its centre; bn is the border's normal, so the distance's gradient is -bn
      vec4 plates(vec2 x, out vec2 bn){
        vec2 n = floor(x), f = fract(x), mg = vec2(0.), mr = vec2(0.); float md = 8.;
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec2 g = vec2(float(i), float(j)), r = g + ihash(n + g) - f; float d = dot(r, r);
          if (d < md) { md = d; mr = r; mg = g; }
        }
        md = 8.; bn = vec2(1., 0.);
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec2 g = mg + vec2(float(i), float(j)), r = g + ihash(n + g) - f;
          if (dot(mr - r, mr - r) > 1e-5) { vec2 nn = normalize(r - mr); float dd = dot(.5 * (mr + r), nn); if (dd < md) { md = dd; bn = nn; } }
        }
        return vec4(md, ihash(n + mg).x, mr);
      }`;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: { ...fx.lightUniforms, ...fx.heatUniforms, uGlow: { value: new V3(fx.palette.glow.r, fx.palette.glow.g, fx.palette.glow.b) }, uFog: sky.material.uniforms.uFog, uAmbient: { value: new V3(0.17, 0.2, 0.27) }, uSkyFlash: sky.material.uniforms.uSkyFlash },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: NOISE_GLSL + ENERGY_LIGHTS_GLSL + GROUND_HEAT_GLSL + WET_GLSL + CRACK_GLSL + `
      uniform vec3 uFog, uAmbient, uGlow; uniform float uSkyFlash; varying vec3 vW;
      void main(){
        vec2 p = vW.xz;
        float fw = length(fwidth(p));                                  // metres per pixel: fine grain fades out with distance
        float n = fbm3(vec3(p * .8, 4.1)) * .5 + .5;
        float kf = 1. - smoothstep(.004, .02, fw);
        float g1 = (snoise(vec3(p * 17., 2.)) * .5 + .5) * kf, g2 = abs(snoise(vec3(p * 53., 6.))) * (1. - smoothstep(.004, .012, fw));
        float g3 = (1. - abs(snoise(vec3(p * 97., 9.)))) * (1. - smoothstep(.003, .009, fw));   // grit: what breaks a wet sheen into glints
        vec2 pw = p + crackWarp(p);                                     // warped: cracked stone, not tiles
        vec2 bnB, bnS;
        vec4 B = plates(pw * .62, bnB), S = plates(pw * 1.9 + 3., bnS);
        float eB = B.x / .62, eS = S.x / 1.9;                           // border distances in metres
        float fwB = fwidth(eB), fwS = fwidth(eS);
        float liveS = smoothstep(-.15, .3, vn(p * 1.1 + 9.).x);         // the fine cracks come and go
        float wB = .018 + .03 * (vn(p * 3.1 + 2.).y * .5 + .5);         // crack width wanders along the crack
        float crack = max(1. - smoothstep(0., wB + fwB, eB), (1. - smoothstep(0., .006 + fwS, eS)) * liveS * .9);
        float wetH = wetness(p);                                        // wet hollows are smooth: only the grit stands out of them
        // plates at their own height and tilt, edges chipped down into the crack: an analytic gradient (the border
        // normal), since screen-space derivatives stepped in 2x2 blocks along every crack and the sheen showed them as dashes
        float wc = wB * 2.5 + .01 * (vn(p * 9. + 4.).x * .5 + .5), tB = clamp(eB / wc, 0., 1.), tS = clamp(eS / .012, 0., 1.);
        vec2 kB = ihash(vec2(B.y * 9173., 3.)) - .5;
        vec2 gA = -bnB * .016 * 6. * tB * (1. - tB) / wc - bnS * .004 * liveS * 6. * tS * (1. - tS) / .012 - kB * .035 * .62;
        vec3 N0 = normalize(vec3(-gA.x, 1., -gA.y));
        // the fine grit stays a screen-space bump: small, soft, and it fades with distance
        float h = (n - .5) * .006 + g1 * .0012 * (1. - wetH) + g2 * .0008 + g3 * .00045;
        vec3 dpx = dFdx(vW), dpy = dFdy(vW);
        vec3 r1 = cross(dpy, N0), r2 = cross(N0, dpx); float det = dot(dpx, r1);
        vec3 N = normalize(abs(det) * N0 - sign(det) * (dFdx(h) * r1 + dFdy(h) * r2));
        vec3 alb = vec3(.04, .043, .051) * (.6 + .65 * n) * (.75 + .5 * g1) * (.85 + .3 * g2) * (.8 + .4 * B.y);
        alb = mix(alb, vec3(.006, .006, .008), crack * .92);
        float wet = wetH * (1. - crack);                                // a wet sheen in the hollows (the bolts' reflections land here too)
        alb *= 1. - wet * .35;
        float rough = clamp(.5 - wet * .34 + crack * .35 - g1 * .1, .1, .95);   // the whole plain is damp, the hollows wet
        vec3 V = normalize(cameraPosition - vW);
        vec3 col = alb * uAmbient + energyLight(vW, N, V, alb, rough);
        // wet stone mirrors the storm: the horizon glow, and the blue the lightning throws into the air, catch on
        // every damp facet at a grazing angle. Point lights alone lit only a pool under each strike.
        vec3 R = reflect(-V, N);
        vec3 storm = vec3(0.); for (int i = 1; i < 6; i++) storm += uLightCol[i];   // flashes only: the orb's steady light is not a lit sky
        vec3 env = uFog * 1.3 * smoothstep(.35, -.02, R.y) + (uGlow * .25 + .75 * vec3(.35, .45, 1.)) * dot(storm, vec3(.0024)) + uSkyFlash * vec3(.05, .08, .18);   // the lightning, not a constant, lights the wet stone
        float Fr = .04 + .96 * pow(1. - max(dot(N, V), 0.), 5.);
        col += env * Fr * (1. - rough) * (1. - rough) * 1.4 * (1. - crack);
        col += uSkyFlash * vec3(.008, .013, .024) * (.35 + wet);
        // the strike's current runs in the stone's own cracks: hairlines, white-hot near the hit, blue further out
        float heat = groundHeat(p);
        if (heat > .01) {
          float lineB = 1. - smoothstep(0., .005 + fwB * 1.2, eB), lineS = (1. - smoothstep(0., .0035 + fwS * 1.2, eS)) * liveS;
          float live = smoothstep(-.3, .2, snoise(vec3(p * .9, 17.)));   // low frequency: long live stretches, never dashes
          float lines = (lineB + lineS * .75) * live * smoothstep(.12, .5, heat), halo = (exp(-eB / .05) + exp(-eS / .028) * liveS * .5) * live;   // lines only where it is hot: a wide lit web read as neon tiling
          col += (vec3(.9, .95, 1.) * lines * 1.6 * smoothstep(.35, 1., heat) + uGlow * (lines * 2. + halo * .35)) * heat;
        }
        float d = length(vW.xz - cameraPosition.xz);
        col = mix(col, uFog, 1. - exp(-d * .048));
        gl_FragColor = vec4(col, 1.);
      }`,
  }));
  ground.frustumCulled = false;
  scene.add(ground);

  // The same cracks on the CPU: pcg2d, value noise and the Voronoi border distance, mirrored from
  // CRACK_GLSL. fx calls crackPath() when a bolt strikes, and its crawling arcs follow the cracks.
  const pcg = (x, y) => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0; y = (Math.imul(y, 1664525) + 1013904223) >>> 0;
    x = (x + Math.imul(y, 1664525)) >>> 0; y = (y + Math.imul(x, 1664525)) >>> 0; x = (x ^ (x >>> 16)) >>> 0; y = (y ^ (y >>> 16)) >>> 0;
    x = (x + Math.imul(y, 1664525)) >>> 0; y = (y + Math.imul(x, 1664525)) >>> 0; x = (x ^ (x >>> 16)) >>> 0; y = (y ^ (y >>> 16)) >>> 0;
    HX = x / 4294967295; HY = y / 4294967295;
  };
  let HX = 0, HY = 0;
  const ih = (cx, cy) => pcg((cx + 32768) | 0, (cy + 32768) | 0);
  function vn(px, py, out) {
    const ix = Math.floor(px), iy = Math.floor(py), fx_ = px - ix, fy = py - iy, ux = fx_ * fx_ * (3 - 2 * fx_), uy = fy * fy * (3 - 2 * fy);
    ih(ix, iy); const a0 = HX, a1 = HY; ih(ix + 1, iy); const b0 = HX, b1 = HY; ih(ix, iy + 1); const c0 = HX, c1 = HY; ih(ix + 1, iy + 1);
    out[0] = ((a0 + (b0 - a0) * ux) * (1 - uy) + (c0 + (HX - c0) * ux) * uy) * 2 - 1;
    out[1] = ((a1 + (b1 - a1) * ux) * (1 - uy) + (c1 + (HY - c1) * ux) * uy) * 2 - 1;
  }
  const V2a = [0, 0], V2b = [0, 0];
  function plateEdge(x, y) {
    const nx = Math.floor(x), ny = Math.floor(y), fx_ = x - nx, fy = y - ny;
    let md = 8, mrx = 0, mry = 0, mgx = 0, mgy = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      ih(nx + i, ny + j); const rx = i + HX - fx_, ry = j + HY - fy, d = rx * rx + ry * ry;
      if (d < md) { md = d; mrx = rx; mry = ry; mgx = i; mgy = j; }
    }
    md = 8;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const gx = mgx + i, gy = mgy + j; ih(nx + gx, ny + gy);
      const rx = gx + HX - fx_, ry = gy + HY - fy, dx = rx - mrx, dy = ry - mry, l2 = dx * dx + dy * dy;
      if (l2 > 1e-5) md = Math.min(md, (0.5 * (mrx + rx) * dx + 0.5 * (mry + ry) * dy) / Math.sqrt(l2));
    }
    return md;
  }
  function crackEdge(x, z) {                // metres to the nearest drawn crack
    vn(x * 0.35, z * 0.35, V2a); vn(x * 0.8 + 7.3, z * 0.8 + 7.3, V2b);
    let wx = x + (V2a[0] + V2b[0] * 0.4) * 0.9, wz = z + (V2a[1] + V2b[1] * 0.4) * 0.9;
    vn(x * 3.7 + 1.3, z * 3.7 + 1.3, V2a); wx += V2a[0] * 0.06; wz += V2a[1] * 0.06;
    const eB = plateEdge(wx * 0.62, wz * 0.62) / 0.62;
    vn(x * 1.1 + 9, z * 1.1 + 9, V2a);
    const liveS = Math.min(1, Math.max(0, (V2a[0] + 0.15) / 0.45));
    return liveS > 0.5 ? Math.min(eB, plateEdge(wx * 1.9 + 3, wz * 1.9 + 3) / 1.9) : eB;
  }
  // From a strike, walk outward along the cracks: each step tries a fan of headings and takes the one
  // that stays deepest in a crack, so the arc turns where the crack turns.
  fx.options.crackPath = (x, z, heading, length) => {
    const step = 0.045, n = Math.min(60, Math.max(4, Math.round(length / step)));
    const out = [x, 0, z];
    let a = heading;
    for (let i = 0; i < n; i++) {
      let best = 1e9, ba = a;
      for (let k = -3; k <= 3; k++) {
        const t = a + k * 0.32, e = crackEdge(x + Math.cos(t) * step, z + Math.sin(t) * step) + Math.abs(k) * 0.004;
        if (e < best) { best = e; ba = t; }
      }
      a = ba; x += Math.cos(a) * step; z += Math.sin(a) * step;
      out.push(x, 0, z);
    }
    return out;
  };

  // ------------------------------------------------------------ the implied caster
  const caster = { base: new V3(), facing: new V3(1, 0, 0), aim: new V3(1, 0, 0), side: new V3(), body: new V3(), shoulder: new V3(), elbow: new V3(), fist: new V3(), head: new V3(), lift: 0, lunge: 0, crouch: 0 };
  const orb = fx.createOrb({ radius: 0.36 });
  orb.reach = [caster.shoulder, caster.elbow, caster.head];
  function pose() {
    const c = caster;
    c.side.crossVectors(UP, c.facing).normalize();
    c.body.copy(c.base).addScaledVector(UP, 1.15 + c.lift - c.crouch);
    c.head.copy(c.body).addScaledVector(UP, 0.55);
    c.shoulder.copy(c.body).addScaledVector(c.side, 0.19).addScaledVector(UP, 0.3);
    c.fist.copy(c.shoulder).addScaledVector(c.aim, 0.62 + c.lunge).addScaledVector(UP, -0.12);
    c.elbow.lerpVectors(c.shoulder, c.fist, 0.5).addScaledVector(UP, -0.08);
    orb.position.copy(c.fist).addScaledVector(c.aim, orb.currentRadius * 0.92);
    orb.axis.copy(c.aim);
  }
  const at = (a, b, c) => new V3().copy(caster.base).addScaledVector(caster.facing, a).addScaledVector(UP, b).addScaledVector(caster.side, c);

  // The shadow belongs to the orb (fx.createOrb draws its corona, ribbons and billows), so it
  // follows the energy wherever the fist goes. The stage only keeps a short record of the
  // orb's path for arcs thrown along a strike.
  let gale = 1;
  const orbPath = [];
  function recordOrb(t) { orbPath.push({ t, p: orb.position.clone() }); while (orbPath.length && t - orbPath[0].t > 0.3) orbPath.shift(); }
  const pathPoint = (back) => orbPath[Math.max(0, orbPath.length - 1 - back)].p;

  // ------------------------------------------------------------ helpers
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const easeOut = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  const easeIn = (x) => Math.pow(Math.min(1, Math.max(0, x)), 3);
  const rnd = (() => { let s = 4242; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const R = (a, b) => a + (b - a) * rnd();
  const _v = new V3(), _w = new V3(), _x = new V3();
  const randDir = (v) => v.set(R(-1, 1), R(-1, 1), R(-1, 1)).normalize();
  const history = [];   // recent body positions, for arcs along a dash
  function record(t) { history.push({ t, p: caster.body.clone() }); while (history.length && t - history[0].t > 0.3) history.shift(); }
  function arcsAlongPath(ticks) {
    fx.repeat(ticks, () => {
      if (history.length < 3) return;
      for (let k = 0; k < 1; k++) {                  // rooted at the orb and thrown back along the path it just tore through
        const i = (rnd() * (history.length - 2)) | 0;
        fx.bolt(orb.position, _w.copy(history[i].p).add(randDir(_x).multiplyScalar(0.35)), { levels: 6, jag: 0.22, width: 0.032, minPx: 7, intensity: 0.95, life: 2, branches: 2 });
      }
    });
  }
  function motes(count, radius, cold = false) {
    for (let k = 0; k < count; k++) {
      randDir(_v); _w.copy(orb.position).addScaledVector(_v, R(radius * 0.5, radius));
      fx.spawnSpark(_w, _x.copy(_v).cross(UP).multiplyScalar(R(0.4, 1.2)).addScaledVector(_v, -R(0.2, 0.8)), { life: R(0.6, 1.2), size: cold ? R(0.003, 0.006) : R(0.006, 0.011), heat: cold ? -R(0.4, 0.9) : R(0.35, 0.7), gravity: 0.05, drag: 0.6 });
    }
  }
  function groundDust(rate, rMin, rMax, dt, outward = 1.5) {
    if (rnd() > rate * dt) return;
    const a = R(0, 6.28), rr = R(rMin, rMax);
    fx.spawnSprite(0, _v.set(caster.base.x + Math.cos(a) * rr, R(0.05, 0.3), caster.base.z + Math.sin(a) * rr), _w.set(Math.cos(a), 0.2, Math.sin(a)).multiplyScalar(R(0.5, outward)), { size: R(0.35, 0.8), life: R(0.9, 1.6), color: fx.palette.dust, opacity: 0.5, drag: 1.2, buoy: 0.15, grow: 2.2 });
  }

  // ------------------------------------------------------------ beats
  // Each beat: dur (sim seconds), start(), events [[t, fn]], step(t, dt), cam(t) -> {pos, look, fov, k}
  const camWant = { pos: new V3(), look: new V3(), fov: 46, k: 5 };
  const orbit = (center, yaw, dist, height) => new V3().copy(center).addScaledVector(caster.side, Math.cos(yaw) * dist).addScaledVector(caster.facing, Math.sin(yaw) * dist).addScaledVector(UP, height);
  let vortex = null, converge = [], tsunami = [], ultimateAt = new V3();

  const BEATS = {
    charge: {
      title: 'Charge', caption: 'Black lightning awakening', dur: 3.6,
      start() { orb.visible = true; orb.radius = 0.1; orb.pressure = 0.35; orb.instability = 0.15; orb.arcRate = 0.8; caster.lift = 0; caster.lunge = 0; gale = 1; },
      events: [
        [1.7, () => { orb.pulse(-0.3); fx.ring(orb.position, _v.copy(camera.position).sub(orb.position).normalize(), { radius: 1.3, thick: 0.05, intensity: 0.06, life: 0.26, amp: 0.03 }); fx.puff(at(-0.4, 1.1, 0), { count: 6, size: [0.5, 0.9], dir: caster.facing.clone().negate(), spread: 0.6 }); }],
        [3.0, () => {
          fx.impact({ hold: 0.05, frame: 'center', shake: 0.006, shakeMode: 'axial' });
          fx.burst(orb.position.clone().addScaledVector(caster.aim, 0.25), { strength: 0.5, layers: 2, sparks: 30, bolts: 3 });
          fx.burst(at(0.3, 0, 0), { strength: 0.55, layers: 1, sparks: 0, debris: 0, dust: 14, scorchMark: false, bolts: 2 });
        }],
      ],
      step(t, dt) {
        const k = smooth(0, 2.2, t);
        orb.radius = 0.1 + 0.4 * easeOut(t / 2.2);
        orb.pressure = t < 1.7 ? 0.35 + 0.35 * k : Math.min(1, 0.7 + (t - 1.7) * 0.6);
        orb.arcRate = t < 1.7 ? 0.8 + 0.5 * k : 1.8;
        orb.strikeRate = t > 1.9 ? 1 : undefined;          // once it is full, the orb keeps striking the stone under it
        orb.strikeAt = at(0.47, 0, -0.59);
        gale = t < 1.7 ? 1 : 1.6;
        fx.attractor.position.copy(orb.position); fx.attractor.strength = t < 2.4 ? 2.5 : 0; fx.attractor.swirl = t < 2.4 ? 1.5 : 0;
        if (dt > 0 && rnd() < dt * 22) motes(1, 2.6);
        if (t > 1.7) groundDust(8, 0.8, 2.4, dt);
        fx.addHeat(_v.set(orb.position.x, 0, orb.position.z), 0.6 + orb.radius, 0.08 + 0.25 * orb.pressure * smooth(0.6, 2.2, t));   // the stone under the orb starts to glow
        if (dt > 0 && rnd() < dt * 5 * orb.pressure) {   // dust drawn round under it
          const a = R(0, 6.28), rr = R(0.6, 1.8);
          fx.spawnSprite(0, _v.set(orb.position.x + Math.cos(a) * rr, R(0.05, 0.25), orb.position.z + Math.sin(a) * rr), _w.set(-Math.sin(a), 0.25, Math.cos(a)).multiplyScalar(R(1.2, 2.4)), { size: R(0.35, 0.7), life: R(0.8, 1.3), color: fx.palette.dust, opacity: 0.45, drag: 1, buoy: 0.2, grow: 2 });
        }
      },
      cam(t) {
        const yaw = -0.35 + 1.45 * smooth(0.2, 3.3, t), dist = 2.1 + 1.3 * smooth(0.7, 3.1, t);
        const look = new V3().lerpVectors(orb.position, caster.body, 0.45 * smooth(0.8, 3, t));
        return { pos: orbit(look, yaw, dist, -0.12 - 0.22 * smooth(0.5, 3, t)), look, fov: 38 + 8 * smooth(0.6, 3, t), k: 5 };
      },
    },

    dash: {
      title: 'Dash', caption: 'Limit instant charge', dur: 2.6,
      start() {
        const c = caster, f = c.facing.clone(), s = c.side.clone();
        this.f = f; this.base0 = c.base.clone();
        const p0 = c.body.clone();
        const p1 = c.base.clone().addScaledVector(f, 4.2).addScaledVector(s, 1.7).setY(0.75);
        const p2 = p1.clone().addScaledVector(f, 3.2).addScaledVector(s, -2.7).setY(3.4);
        const p3 = p2.clone().addScaledVector(f, 3.6).addScaledVector(s, 1.2).setY(1.15);
        const p4 = p3.clone().addScaledVector(f, 1.3);
        this.path = [[0.32, p0], [0.52, p1], [0.74, p2], [0.92, p3], [1.22, p4]];
        orb.pressure = 1; history.length = 0;
      },
      events: [
        [0.3, () => {
          fx.burst(caster.base.clone(), { strength: 0.8, layers: 2, sparks: 30, debris: 8, dust: 18, bolts: 3 });
          fx.impact({ hold: 0.04, frame: 'none', shake: 0.008 });
          arcsAlongPath(20);
        }],
        [0.52, () => BEATS.dash.turn(1)],
        [0.74, () => BEATS.dash.turn(2)],
        [0.92, () => {
          fx.burst(caster.base.clone(), { strength: 1.0, layers: 3, sparks: 60, debris: 10, dust: 22, bolts: 4 });
          fx.impact({ hold: 0.06, frame: 'center', shake: 0.012, at: caster.body });
          fx.puff(caster.body.clone(), { count: 10, size: [0.6, 1.2] });
        }],
      ],
      turn(i) {
        const P = this.path, a = P[i][1], d = new V3().subVectors(P[i + 1][1], a).normalize();
        fx.ring(a, d, { radius: 2.2, thick: 0.06, intensity: 0, life: 0.26, amp: 0.02 });
        fx.puff(a, { count: 12, size: [0.65, 1.3], speed: [0.4, 1.6] });
        fx.shards(a, { count: 22, speed: [1.5, 5] });
        fx.sparks(a, { count: 26, speed: [4, 10] });
        for (let k = 0; k < 3; k++) fx.bolt(a, _v.copy(a).add(randDir(_w).multiplyScalar(R(1, 2))), { levels: 5, jag: 0.26, width: 0.032, minPx: 8, life: 2, branches: 1 });
      },
      step(t, dt) {
        const P = this.path, c = caster;
        if (t < 0.32) {
          c.crouch = 0.28 * smooth(0, 0.3, t); orb.radius = 0.4 - 0.18 * smooth(0, 0.3, t);
        } else {
          let i = 0; while (i < P.length - 2 && t > P[i + 1][0]) i++;
          const [t0, a] = P[i], [t1, b] = P[i + 1];
          const u = Math.min(1, (t - t0) / (t1 - t0)), e = i === P.length - 2 ? easeOut(u) : u * u * (3 - 2 * u) * 0.35 + u * 0.65;
          const body = new V3().lerpVectors(a, b, e);
          c.crouch = 0; c.base.set(body.x, 0, body.z); c.lift = body.y - 1.15;
          if (u < 1 && i < P.length - 2) c.aim.subVectors(b, a).normalize(); else c.aim.lerp(c.facing, 1 - Math.exp(-dt * 8)).normalize();
          orb.radius = t < 0.95 ? 0.22 : 0.22 + 0.16 * smooth(1.0, 2.0, t);
        }
        pose();
        if (t > 0.3 && t < 1.25) record(t);
        if (t > 0.92 && t < 1.25 && dt > 0) {   // skid: sparks off the ground behind the feet
          fx.sparks(c.base.clone().setY(0.03), { count: 3, dir: _v.copy(c.facing).negate().add(UP), spread: 0.6, speed: [2, 6], life: [0.25, 0.5] });
          groundDust(60, 0, 0.4, dt, 0.6);
        }
      },
      cam(t) {
        const c = caster;
        if (t < 0.3) return { pos: at(-2.6, 0.5, 1.7), look: c.body.clone().addScaledVector(c.facing, 2), fov: 50, k: 6 };
        if (t < 0.95) return { pos: new V3().copy(orb.position).addScaledVector(c.aim, -2.1).addScaledVector(c.side, 0.9).setY(Math.max(0.35, orb.position.y * 0.7)), look: orb.position.clone().addScaledVector(c.aim, 1.2), fov: 52, k: 10 };
        return { pos: at(-2.7, 0.85, -2.3), look: c.body.clone().addScaledVector(c.facing, 0.8), fov: 50, k: 4 };
      },
    },

    barrage: {
      title: 'Barrage', caption: 'Thunderstorm barrage', dur: 4.4,
      start() { orb.pressure = 1; orb.instability = 0.3; orb.arcRate = 1.4; },
      events: [
        [0.14, () => orb.pulse(-0.35)],
        [0.26, () => {
          const c = caster;
          fx.blast(orb.position, c.aim, { length: 4.6, radius: 1.5, strength: 1 });
          fx.burst(orb.position.clone().addScaledVector(c.aim, 0.4), { strength: 0.9, layers: 3, sparks: 70, bolts: 4 });
          fx.burst(c.fist.clone().setY(0), { strength: 0.6, layers: 1, debris: 6, dust: 12, sparks: 10, bolts: 2 });
          fx.impact({ hold: 0.1, frame: 'full', flash: 0, shake: 0.016, shakeMode: 'axial', at: orb.position });   // no white after the ink: it read as a grey wash
        }],
        [1.3, () => BEATS.barrage.swingArcs()],
        [1.45, () => {
          const c = caster;
          fx.ring(c.body, UP, { radius: 4.2, thick: 0.06, intensity: 0.12, life: 0.3, amp: 0.035 });   // felt as refraction, not drawn as a hoop
          fx.ring(c.body, UP, { radius: 5.6, thick: 0.1, intensity: 0.05, life: 0.42, delay: 0.06, amp: 0.025 });
          for (let k = 0; k < 9; k++) {
            const a = -1.35 + 2.7 * (k / 8) + R(-0.1, 0.1);
            const d = _x.copy(c.facing).multiplyScalar(Math.cos(a)).addScaledVector(c.side, Math.sin(a));
            fx.bolt(_v.copy(c.body).addScaledVector(d, 0.6), _w.copy(c.body).addScaledVector(d, R(2.2, 3.8)).addScaledVector(UP, R(-0.3, 0.3)), { levels: 6, jag: 0.18, width: 0.04, minPx: 9, intensity: 1.1, life: 2, branches: 1 });
          }
          fx.sparks(c.body, { count: 40, dir: c.facing, spread: 1.2, speed: [4, 11] });
          fx.impact({ hold: 0.05, frame: 'none', shake: 0.012, shakeDir: new THREE.Vector2(1, 0.15) });
        }],
        [2.3, () => BEATS.barrage.spinArcs()],
        [2.56, () => {
          const c = caster;
          fx.burst(c.body.clone().addScaledVector(c.facing, 0.9), { strength: 1.3, layers: 3, sparks: 110, bolts: 6 });
          fx.burst(c.base.clone().addScaledVector(c.facing, 0.9), { strength: 1.2, layers: 3, debris: 14, dust: 22, sparks: 30, bolts: 5 });
          fx.blast(orb.position, c.facing, { length: 3.4, radius: 2.4, strength: 1.1 });
          fx.puff(c.body.clone().addScaledVector(c.facing, -0.5), { count: 12, size: [0.7, 1.4] });
          fx.impact({ hold: 0.1, frame: 'full', flash: 0, shake: 0.022, shakeMode: 'axial', at: orb.position });
        }],
      ],
      swingArcs() { fx.repeat(5, () => { if (orbPath.length < 4) return; fx.bolt(orb.position, _v.copy(pathPoint(3)).add(randDir(_w).multiplyScalar(0.3)), { levels: 6, jag: 0.24, width: 0.035, minPx: 8, life: 2, branches: 1 }); }); },
      spinArcs() { fx.repeat(8, () => { if (orbPath.length < 5) return; fx.bolt(orb.position, pathPoint(4), { levels: 6, jag: 0.22, width: 0.04, minPx: 9, life: 2, branches: 1 }); fx.bolt(orb.position, _w.copy(orb.position).addScaledVector(caster.aim, R(1.2, 2.2)).add(randDir(_x).multiplyScalar(0.5)), { levels: 6, jag: 0.24, width: 0.03, minPx: 7, life: 2, branches: 1 }); }); },
      step(t, dt) {
        const c = caster;
        c.lunge = t < 0.22 ? 0 : t < 0.3 ? 0.55 * easeOut((t - 0.22) / 0.08) : 0.55 - 0.45 * smooth(0.3, 0.7, t);
        if (t > 0.26 && t < 1.2) orb.radius = 0.24 + 0.18 * smooth(0.35, 1.1, t); else if (t <= 0.26) orb.radius = 0.42;
        // left reverse swing: the fist sweeps a half circle across the front
        if (t >= 1.3 && t < 1.6) {
          const u = smooth(1.3, 1.44, t), a = Math.PI / 2 - Math.PI * u;
          c.aim.copy(c.facing).multiplyScalar(Math.cos(a)).addScaledVector(c.side, Math.sin(a)).normalize();
        } else if (t >= 2.3 && t < 2.56) {
          // spinning elbow: the fist goes all the way round
          const a = 6.2832 * easeOut((t - 2.3) / 0.26);
          c.aim.copy(c.facing).applyAxisAngle(UP, a).normalize();
        } else c.aim.lerp(c.facing, 1 - Math.exp(-dt * 10)).normalize();
        pose();
      },
      cam(t) {
        const c = caster, look = c.body.clone().addScaledVector(c.facing, 0.6);
        return { pos: orbit(look, 0.35 + t * 0.62, 2.9 - 0.4 * smooth(2, 2.6, t), -0.42), look, fov: 50, k: 4.5 };
      },
    },

    storm: {
      title: 'Storm ring', caption: 'Black lightning storm domain', dur: 4.4,
      start() { orb.pressure = 1; orb.instability = 0.35; orb.arcRate = 0.6; this.rTarget = 2.8; },
      events: [
        [0.02, () => { fx.burst(caster.base.clone(), { strength: 0.5, layers: 1, debris: 4, dust: 10, sparks: 10, scorchMark: false, bolts: 2 }); }],
        [0.48, () => {
          const c = caster;
          fx.burst(c.base.clone(), { strength: 1.8, layers: 3, debris: 0, dust: 34, sparks: 30, bolts: 8 });
          fx.debris(c.base.clone(), { count: 20, speed: [2.5, 6], size: [0.045, 0.11] });   // chunks of the plain, big enough to float in the storm
          fx.impact({ hold: 0.08, frame: 'center', shake: 0.02, at: c.base });
          vortex = fx.vortex(c.base.clone(), { radius: 2.8, height: 2.6, base: 1.1, duration: 3.5, bands: 6, chords: false });   // every bolt comes from the orb
          // the discharge: four steep trunks down to the left and one long arm to the right, each a channel
          // re-struck every tick (life 1, so one strand each), and now and then one up out of the orb's top
          const STORM_HITS = [[-0.63, 2.27], [-0.77, 1.59], [-0.9, 1.02], [-0.53, 0.3], [-1.36, -1.0]];
          fx.repeat(95, () => {
            if (!vortex || !vortex.alive || vortex.t > vortex.duration) return;
            for (let q = 0; q < STORM_HITS.length; q++) {
              if (rnd() < 0.15) continue;
              const [f, sd] = STORM_HITS[q];
              _w.copy(at(f, 0, sd)).add(_x.set(R(-0.1, 0.1), 0, R(-0.1, 0.1))).setY(0.02);
              _v.subVectors(_w, orb.position).normalize().multiplyScalar(orb.currentRadius).add(orb.position);   // leave from the membrane, not through the core
              fx.bolt(_v, _w, { levels: 6, jag: 0.21, width: q === 4 ? 0.06 : 0.05, minPx: 10, intensity: 1.15, life: 1, branches: q === 4 ? 2.6 : 1.8, twigK: 1.2 });
            }
            if (rnd() < 0.5) {
              _w.copy(orb.position).addScaledVector(UP, R(0.9, 1.3)).add(randDir(_x).multiplyScalar(0.3));
              _v.copy(orb.position).addScaledVector(UP, orb.currentRadius);
              fx.bolt(_v, _w, { levels: 5, jag: 0.22, width: 0.04, minPx: 8, intensity: 1, life: 1, branches: 1.2 });
            }
          });
          fx.attractor.position.copy(c.base).addScaledVector(UP, 0.8); fx.attractor.strength = 0; fx.attractor.swirl = 6; fx.attractor.lift = 1;   // the domain lifts the broken stone
        }],
        [1.6, () => {
          BEATS.storm.rTarget = 2.15; orb.pulse(0.3);
          for (let k = 0; k < 4; k++) fx.bolt(orb.position, _v.copy(orb.position).addScaledVector(UP, R(1.4, 2.6)).add(randDir(_w).multiplyScalar(0.6)), { levels: 6, jag: 0.2, width: 0.04, minPx: 9, life: 3, branches: 2 });
        }],
        [2.4, () => { BEATS.storm.rTarget = 1.7; if (vortex) vortex.intensity = 1.8; orb.pulse(-0.35); fx.ring(caster.body, UP, { radius: 2.4, thick: 0.05, intensity: 0.5, life: 0.24, amp: 0.03 }); }],
        [3.1, () => {
          BEATS.storm.rTarget = 3.3;
          fx.ring(caster.base.clone().setY(0.05), UP, { radius: 5.6, thick: 0.08, intensity: 0.8, life: 0.4, amp: 0.035 });
          fx.impact({ hold: 0.04, frame: 'none', shake: 0.01 });
        }],
        [3.9, () => { fx.attractor.swirl = 0; fx.attractor.lift = 0; }],
      ],
      step(t, dt) {
        const c = caster;
        c.lift = t < 0.34 ? 1.5 * easeOut(t / 0.34) : t < 0.48 ? 1.5 * (1 - easeIn((t - 0.34) / 0.14)) : 0;
        if (t > 3.1 && t < 3.35) c.facing.applyAxisAngle(UP, dt * 2.4).normalize();
        c.aim.lerp(c.facing, 1 - Math.exp(-dt * 10)).normalize();
        pose();
        if (vortex && vortex.alive) {
          vortex.radius += (this.rTarget - vortex.radius) * (1 - Math.exp(-dt * 7));
          vortex.tilt = t > 1.6 && t < 3.1 ? 0.14 : 0;
          vortex.center.copy(c.base);
        }
      },
      cam(t) {
        const c = caster;
        const wide = { pos: at(-6.6, 3.7, 3.3), look: c.base.clone().addScaledVector(UP, 0.9) };
        const close = { pos: at(-2.3, 0.55, 1.5), look: c.body.clone().addScaledVector(UP, -0.1) };
        const u = smooth(1.0, 3.0, t);
        return { pos: wide.pos.lerp(close.pos, u), look: wide.look.lerp(close.look, u), fov: 62 - 12 * u, k: t < 0.6 ? 6 : 3.5 };
      },
    },

    ultimate: {
      title: 'Ultimate', caption: 'Black lightning realm collapse', dur: 6.2, release: 2.0,
      start() {
        fx.ramp(0.4, 0.6);                 // slow enough to feel the pause, short enough not to stall the cut
        orb.visible = true; orb.instability = 1; orb.arcRate = 2.2; orb.pressure = 1;
        fx.attractor.strength = 18; fx.attractor.swirl = 5;
        converge = []; tsunami = []; this.nextIn = 0; this.nextEmber = 0; this.nextArc = 0;
        // two great channels cross through the orb in an X, corner to corner of the frame
        const X_DIRS = [[-0.67, 0.74], [0.5, -0.87], [0.88, 0.48], [-0.66, -0.75]];
        fx.repeat(58, () => {
          if (!orb.visible) return;
          const right = _x.setFromMatrixColumn(camera.matrixWorld, 0), up = new V3().setFromMatrixColumn(camera.matrixWorld, 1);
          for (const [sx, sy] of X_DIRS) {
            const a = Math.atan2(sy, sx) + R(-0.07, 0.07), L = R(2.9, 3.6) * (orb.currentRadius / 0.85);
            _w.copy(orb.position).addScaledVector(right, Math.cos(a) * L).addScaledVector(up, Math.sin(a) * L);
            fx.bolt(orb.position.clone().addScaledVector(right, -Math.cos(a) * 0.12), _w, { levels: 7, jag: 0.17, width: 0.075, minPx: 13, intensity: 1.15, life: 1, branches: 1.6, twigK: 1.2, core: 0.75, forkLen: 0.45, hit: false });   // life 1: one X at a time; short forks, or they ran alongside as parallel strands
          }
        });
        fx.repeat(70, () => {
          if (!orb.visible || rnd() < 0.8) return;
          randDir(_v); _v.y = Math.abs(_v.y) * 0.6;
          _w.copy(orb.position).addScaledVector(_v, orb.currentRadius + R(0.4, 1.0));   // short arcs into the shell; the X carries the long ones
          fx.bolt(_w, _x.copy(orb.position).addScaledVector(_v, orb.currentRadius), { levels: 6, jag: 0.2, width: 0.035, minPx: 8, intensity: 0.9, life: 2, branches: 1 });
        });
      },
      events: [
        [1.85, () => orb.pulse(-0.5)],
        [2.0, () => {
          const c = caster, f = c.facing.clone();
          ultimateAt.copy(orb.position);
          fx.ramp(1, 0.04);
          fx.attractor.strength = 0; fx.attractor.swirl = 0;
          for (const E of converge) E.T.stop();
          fx.blast(orb.position, f, { length: 10, radius: 4.2, strength: 1.6, life: 0.42 });
          fx.burst(orb.position.clone().addScaledVector(f, 0.5), { strength: 2.2, layers: 3, sparks: 220, bolts: 10 });
          fx.burst(c.base.clone().addScaledVector(f, 1.6), { strength: 2.2, layers: 3, debris: 40, dust: 50, sparks: 60, bolts: 10 });
          // black afterimages like a tsunami, wrapping the outer layer of the shockwave
          for (let k = 0; k < 10; k++) {
            const a = (k / 10) * 6.2832 + R(-0.2, 0.2);
            const radial = _x.copy(c.side).multiplyScalar(Math.cos(a)).addScaledVector(UP, Math.sin(a) * 0.8);
            const T = fx.createTrail({ width: R(0.5, 0.8), life: 1.4, spacing: 0.1, jitter: 0.4, shards: 0.4, erode: 0.1, chain: 0.45, chainSize: 1.8 }); T.disposable = true;
            tsunami.push({ T, p: orb.position.clone().addScaledVector(radial, 0.5), v: new V3().copy(f).multiplyScalar(0.75).addScaledVector(radial, 0.65).normalize().multiplyScalar(R(11, 15)), age: 0 });
          }
          fx.repeat(4, () => { for (let k = 0; k < 6; k++) { randDir(_v); fx.bolt(ultimateAt, _w.copy(ultimateAt).addScaledVector(_v, R(3, 7)), { levels: 6, jag: 0.18, width: 0.05, minPx: 10, intensity: 1.2, life: 2, branches: 2 }); } });
          fx.impact({ hold: 0.15, frame: 'full', flash: 1, shake: 0.03, shakeMode: 'radial', fisheye: 0.42, at: orb.position });
          orb.visible = false; gale = 1.8;
        }],
        [5.3, () => { orb.visible = true; orb.radius = 0.08; orb.instability = 0.15; orb.arcRate = 0.8; orb.pressure = 0.5; }],
      ],
      step(t, dt) {
        const c = caster;
        c.aim.lerp(c.facing, 1 - Math.exp(-dt * 10)).normalize();
        const REL = this.release;
        c.lunge = t < REL ? -0.12 * smooth(0, 1, t) : t < REL + 0.1 ? 0.6 : 0.6 - 0.5 * smooth(REL + 0.1, REL + 0.9, t);
        if (t < REL) orb.radius = 0.4 + 0.5 * smooth(0, REL - 0.2, t);
        else if (t > 5.3) orb.radius = 0.08 + 0.28 * smooth(5.3, 6.2, t);
        pose();
        if (t < REL) {
          fx.attractor.position.copy(orb.position);
          // streams of shadow spiralling in from the edges of the frame
          if (t > this.nextIn && t < REL - 0.3) {
            this.nextIn = t + 0.22;
            const T = fx.createTrail({ width: R(0.25, 0.4), life: 0.55, spacing: 0.08, jitter: 0.2, shards: 0.15, chain: 0.35, chainSize: 1.6 }); T.disposable = true;
            converge.push({ T, a0: R(0, 6.28), h: R(-0.8, 1.6), r0: R(3.8, 5), age: 0 });
          }
          if (dt > 0) { motes(Math.round(dt * 30), 4.5, true); groundDust(30, 1.5, 4, dt, 0.4); }   // cold motes: the gathering storm is blue, not embers
        } else {
          if (t > REL + 0.1 && dt > 0 && t > this.nextEmber) {   // embers: torn shadow and slow sparks drifting in the after-air
            this.nextEmber = t + (t < REL + 2 ? 0.02 : 0.06);
            _v.copy(ultimateAt).addScaledVector(c.facing, R(0, 6)).add(_w.set(R(-2.5, 2.5), R(-0.9, 1.8), R(-2.5, 2.5)));
            _v.y = Math.max(0.2, _v.y);
            fx.spawnSprite(1, _v, _w.set(R(-0.3, 0.3), R(0.1, 0.5), R(-0.3, 0.3)), { size: R(0.07, 0.2), life: R(1.8, 3), drag: 0.6, buoy: 0.05, grow: 1 });
            if (rnd() < 0.18) fx.spawnSprite(0, _v, _w.set(R(-0.4, 0.4), R(0.1, 0.4), R(-0.4, 0.4)), { size: R(0.5, 1.1), grow: 2.4, life: R(2, 3.2), opacity: 0.55, drag: 0.8, buoy: 0.08 });
            if (rnd() < 0.5) fx.spawnSpark(_v, _w.set(R(-0.3, 0.3), R(0.1, 0.6), R(-0.3, 0.3)), { life: R(1.2, 2.2), size: R(0.006, 0.012), heat: R(0.4, 0.75), gravity: 0.04, drag: 0.4 });
          }
          if (t > REL + 0.4 && t < 5.4 && t > this.nextArc) {     // residual arcs
            this.nextArc = t + R(0.12, 0.3);
            _v.copy(ultimateAt).addScaledVector(c.facing, R(0.5, 5)).add(_w.set(R(-1.5, 1.5), R(-1, 1), R(-1.5, 1.5))); _v.y = Math.max(0.1, _v.y);
            fx.bolt(_v, _w.copy(_v).add(randDir(_x).multiplyScalar(R(0.5, 1.3))), { levels: 4, jag: 0.25, width: 0.022, minPx: 5, intensity: 0.6, life: 1, branches: 0 });
          }
          if (t > REL + 1.5) gale = 1 + 0.8 * (1 - smooth(REL + 1.5, 6.2, t));
        }
        for (let i = converge.length - 1; i >= 0; i--) {
          const E = converge[i]; E.age += dt;
          const u = Math.min(1, E.age / 0.9);
          if (u >= 1 || !E.T.active) { E.T.stop(); converge.splice(i, 1); continue; }
          const r = E.r0 * Math.pow(1 - u, 1.3) + orb.currentRadius * 0.8, a = E.a0 + u * 4.2;
          E.T.push(_v.copy(orb.position).addScaledVector(c.side, Math.cos(a) * r).addScaledVector(c.facing, Math.sin(a) * r).addScaledVector(UP, E.h * (1 - u)));
        }
        for (let i = tsunami.length - 1; i >= 0; i--) {
          const E = tsunami[i]; E.age += dt;
          if (E.age > 0.55) { E.T.stop(); tsunami.splice(i, 1); continue; }
          E.v.multiplyScalar(Math.exp(-dt * 2.2)); E.p.addScaledVector(E.v, dt); E.p.y = Math.max(0.15, E.p.y);
          E.T.push(E.p);
        }
      },
      cam(t) {
        const c = caster, REL = this.release;
        if (t < REL - 0.05) {
          const yaw = 0.15 + 1.0 * smooth(0.4, REL, t), dist = Math.max(1.9, orb.currentRadius * 4.5) + 0.5 * smooth(0.6, REL, t);
          const look = orb.position.clone().lerp(c.body, 0.25 * smooth(0.8, REL, t));
          return { pos: orbit(look, yaw, dist, -0.15), look, fov: 42 + 4 * smooth(0.8, REL, t), k: 4 };
        }
        if (t < REL + 0.4) return { pos: orb.position.clone().addScaledVector(c.facing, 1.2).addScaledVector(c.side, 1.4).addScaledVector(UP, 0.1), look: c.body.clone().addScaledVector(c.facing, 3), fov: 58, k: 7 };
        return { pos: at(1.0, 1.7, 5.6), look: at(3.4, 0.8, 0), fov: 60, k: 3 };
      },
    },
  };
  const ORDER = ['charge', 'dash', 'barrage', 'storm', 'ultimate'];

  const idle = {
    title: 'Idle', caption: 'Holding the charge', dur: Infinity, events: [],
    start() { orb.visible = true; orb.pressure = 0.55; orb.instability = 0.15; orb.arcRate = 0.8; fx.attractor.strength = 0; fx.attractor.swirl = 0; },
    step(t, dt) {
      const c = caster;
      orb.radius += (0.36 - orb.radius) * (1 - Math.exp(-dt * 3));
      c.lunge *= Math.exp(-dt * 4); c.crouch *= Math.exp(-dt * 4); c.lift *= Math.exp(-dt * 4);
      c.aim.lerp(c.facing, 1 - Math.exp(-dt * 6)).normalize();
      gale += (1 - gale) * (1 - Math.exp(-dt * 2));
      pose();
    },
    cam(t) { const look = new V3().lerpVectors(orb.position, caster.body, 0.4); return { pos: orbit(look, 0.95 + 0.12 * Math.sin(t * 0.25), 2.9, -0.32), look, fov: 46, k: 2.5 }; },
  };

  // ------------------------------------------------------------ runner
  const run = { beat: idle, name: 'idle', t: 0, fired: 0, loop: false, idleLeft: 0, listeners: [] };
  function start(name) {
    const b = name === 'idle' ? idle : BEATS[name];
    fx.ramp(1, 0.05);
    run.beat = b; run.name = name; run.t = 0; run.fired = 0;
    orb.strikes = name !== 'ultimate'; orb.strikeRate = undefined; orb.strikeAt = null;                 // the ultimate's charge holds its lightning in the X, not on the ground
    fx.attractor.lift = 0;
    b.start?.call(b);
    for (const fn of run.listeners) fn(name, b);
  }
  function play(name) {
    if (name === 'all') { run.loop = true; start('charge'); return; }
    run.loop = false; start(name);
  }
  function advance(dt) {
    const b = run.beat;
    run.t += dt;
    while (run.fired < b.events.length && b.events[run.fired][0] <= run.t) b.events[run.fired++][1]();
    b.step(run.t, dt);
    if (run.t >= b.dur) {
      if (run.loop) {
        const i = ORDER.indexOf(run.name);
        if (i >= 0 && i < ORDER.length - 1) start(ORDER[i + 1]);
        else { start('idle'); run.idleLeft = 1.2; }
      } else start('idle');
    } else if (run.name === 'idle' && run.loop && (run.idleLeft -= dt) <= 0) start('charge');
  }

  // ------------------------------------------------------------ camera rig
  const cam = { pos: new V3(), look: new V3(), fov: 46, init: false };
  function updateCamera(dt) {
    const w = run.beat.cam(run.t);
    if (!cam.init) { cam.pos.copy(w.pos); cam.look.copy(w.look); cam.fov = w.fov; cam.init = true; }
    const a = 1 - Math.exp(-w.k * dt);
    cam.pos.lerp(w.pos, a); cam.look.lerp(w.look, a); cam.fov += (w.fov - cam.fov) * a;
    cam.pos.y = Math.max(0.18, cam.pos.y);
    // portrait screens see a narrow slice: back the camera off so the effect keeps its frame
    const narrow = camera.aspect < 1 ? Math.pow(1 / camera.aspect, 0.55) : 1;
    camera.position.copy(cam.look).addScaledVector(_v.subVectors(cam.pos, cam.look), narrow);
    camera.position.y = Math.max(0.18, camera.position.y);
    camera.lookAt(cam.look);
    if (Math.abs(camera.fov - cam.fov) > 1e-3) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }
    sky.position.copy(camera.position);
    ground.position.set(Math.round(camera.position.x / 20) * 20, 0, Math.round(camera.position.z / 20) * 20);
  }

  // ------------------------------------------------------------ size and loop
  let width = 0, height = 0;
  const dprCap = Number(params.get('dpr')) || 1.5;      // the orb's volume and the smoke are fill-bound: 1.75 cost ~2× at 1440 wide
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
  let dirty = true, paused = false, last = 0, lastTick = 0;
  function frame(realDt) {
    resize();
    const simDt = fx.update(realDt);
    advance(simDt);
    recordOrb(fx.time);
    updateCamera(fx.holding ? 0 : realDt * Math.max(0.45, fx.timeScale * fx.rampValue));
    sky.material.uniforms.uTime.value = fx.time;
    sky.material.uniforms.uSkyFlash.value += (fx.skyFlash - sky.material.uniforms.uSkyFlash.value) * 0.5;
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

  pose();
  resize();
  fx.warmup();
  start('idle');
  if (reduceMotion || params.has('still')) {
    // A composed still: the charge held at full pressure. Beats still play on request.
    play('charge');
    for (let i = 0; i < 165; i++) frame(1 / 60);
    paused = true; dirty = true;
  } else if (!params.has('idle')) play('all');
  frame(1 / 60);
  requestAnimationFrame(loop);
  // If rAF never runs (a hidden tab), still paint a settled frame.
  setInterval(() => { if (performance.now() - lastTick > 600) { lastTick = performance.now(); frame(paused ? 0 : 1 / 60); } }, 500);

  window.stage = {
    fx, play, BEATS, ORDER, reduceMotion, camera, caster, orb,
    get beat() { return run.name; }, get loop() { return run.loop; }, get time() { return run.t; },
    get paused() { return paused; },
    setPaused(v) { paused = v; last = 0; dirty = true; },
    setOption(k, v) { fx.options[k] = v; dirty = true; },
    setTimeScale(v) { fx.timeScale = v; },
    onBeat(fn) { run.listeners.push(fn); },
    // deterministic stepping for captures: stage.step(1/60, n)
    step(dt, n = 1) { for (let i = 0; i < n; i++) frame(dt); },
    redraw() { dirty = true; },
  };
})();
