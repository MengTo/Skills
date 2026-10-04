/* Black Lightning stage: a dark storm plain, a camera, and the five beats of one
   close-combat skill, all drawn by assets/storm-energy.mjs. There is no character
   model: the effects hang off an implied body, shoulder and fist, so what you see
   is the effect language alone. */
(() => {
  const THREE = window.THREE;
  const { createStormEnergy, ENERGY_LIGHTS_GLSL, GROUND_HEAT_GLSL, NOISE_GLSL } = window.StormEnergy;
  const V3 = THREE.Vector3;
  const UP = new V3(0, 1, 0);
  const canvas = document.getElementById('stage');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(location.search);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: params.has('capture') });
  const FOG = new THREE.Color(0.046, 0.052, 0.066);   // a storm-grey horizon, so black smoke has something to be black against
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
        vec3 col = mix(uFog, vec3(.012, .014, .021), smoothstep(-.02, .55, h));
        vec2 q = d.xz / (d.y + .28);
        float cl = fbm4(vec3(q * .9 + uTime * .012, uTime * .02)) * .5 + .5;
        float clouds = smoothstep(.42, .82, cl) * smoothstep(-.04, .32, h);
        col += (clouds - .35) * vec3(.016, .018, .024) + clouds * uSkyFlash * vec3(.05, .08, .14);
        gl_FragColor = vec4(col, 1.);
      }`,
    side: THREE.BackSide, depthWrite: false,
  }));
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: { ...fx.lightUniforms, ...fx.heatUniforms, uGlow: { value: new V3(0.3, 0.6, 1.0) }, uFog: sky.material.uniforms.uFog, uAmbient: { value: new V3(0.34, 0.37, 0.45) }, uSkyFlash: sky.material.uniforms.uSkyFlash },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: NOISE_GLSL + ENERGY_LIGHTS_GLSL + GROUND_HEAT_GLSL + `
      uniform vec3 uFog, uAmbient, uGlow; uniform float uSkyFlash; varying vec3 vW;
      vec2 hash2(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
      float cells(vec2 p){
        vec2 n = floor(p), f = fract(p); float f1 = 8., f2 = 8.;
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec2 g = vec2(float(i), float(j)); vec2 r = g + hash2(n + g) - f; float d = dot(r, r);
          if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
        }
        return sqrt(f2) - sqrt(f1);
      }
      void main(){
        vec2 p = vW.xz;
        float big = fbm3(vec3(p * .16, 1.7)) * .5 + .5;
        float n = fbm4(vec3(p * .8, 4.1)) * .5 + .5;
        float fine = snoise(vec3(p * 7., 2.)) * .5 + .5;
        float crack = 1. - smoothstep(0., .05, cells(p * .5));
        crack = max(crack, (1. - smoothstep(0., .035, cells(p * 1.6 + 3.))) * .55);
        vec3 alb = vec3(.06, .062, .068) * (.68 + .55 * n) * (.86 + .28 * fine);
        alb = mix(alb, vec3(.015, .015, .018), crack * .85);
        float wet = smoothstep(.48, .7, big) * (1. - crack);
        float rough = clamp(.8 - wet * .62 + crack * .15 - fine * .08, .1, .95);
        float e = .03;
        float h0 = fbm3(vec3(p * 2.2, 7.)), hx = fbm3(vec3((p + vec2(e, 0.)) * 2.2, 7.)), hz = fbm3(vec3((p + vec2(0., e)) * 2.2, 7.));
        vec3 N = normalize(vec3(-(hx - h0) / e * .03 * (1. - wet), 1., -(hz - h0) / e * .03 * (1. - wet)));
        vec3 V = normalize(cameraPosition - vW);
        vec3 col = alb * uAmbient + energyLight(vW, N, V, alb, rough);
        col += uSkyFlash * vec3(.008, .013, .024) * (.35 + wet);
        // the hit's heat glows in the stone's own cracks and cools
        float heat = groundHeat(p);
        float fineCrack = 1. - smoothstep(0., .02 + .03 * heat, cells(p * 1.6 + 3.));
        col += uGlow * heat * (crack * .9 + fineCrack * .6) * (1.6 + 2.2 * heat);
        float d = length(vW.xz - cameraPosition.xz);
        col = mix(col, uFog, 1. - exp(-d * .048));
        gl_FragColor = vec4(col, 1.);
      }`,
  }));
  ground.frustumCulled = false;
  scene.add(ground);

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

  // The cloak: three smoke ribbons streaming back off the body, always on.
  const cloak = [
    { T: fx.createTrail({ width: 0.62, life: 0.75, spacing: 0.05, jitter: 0.4, shards: 0.6 }), off: [-0.18, 0.5, 0], wob: 1.3 },
    { T: fx.createTrail({ width: 0.75, life: 0.85, spacing: 0.05, jitter: 0.45, shards: 0.7 }), off: [-0.22, 0.12, 0.22], wob: 1.7 },
    { T: fx.createTrail({ width: 0.66, life: 0.8, spacing: 0.05, jitter: 0.45, shards: 0.7 }), off: [-0.2, -0.32, -0.18], wob: 2.1 },
  ];
  let gale = 1;
  const emitPos = new V3();
  function pushCloak(t) {
    for (const C of cloak) {
      C.T.drift.copy(caster.facing).multiplyScalar(-2.1 * gale).addScaledVector(UP, 0.55).addScaledVector(caster.side, Math.sin(t * C.wob) * 0.3);
      emitPos.copy(caster.body).addScaledVector(caster.facing, C.off[0]).addScaledVector(UP, C.off[1]).addScaledVector(caster.side, C.off[2] + Math.sin(t * C.wob * 2.3) * 0.06);
      C.T.push(emitPos);
    }
  }
  // Dash and strike ribbons, restarted each time they are used.
  const dashTrails = [fx.createTrail({ width: 1.0, life: 0.8, spacing: 0.08, jitter: 0.5, shards: 0.9 }), fx.createTrail({ width: 0.42, life: 0.55, spacing: 0.08, jitter: 0.3, shards: 0.5 }), fx.createTrail({ width: 0.42, life: 0.55, spacing: 0.08, jitter: 0.3, shards: 0.5 })];
  const swing = fx.createTrail({ width: 0.8, life: 0.5, spacing: 0.05, jitter: 0.3, shards: 0.7 });
  const spin = fx.createTrail({ width: 0.95, life: 0.6, spacing: 0.05, jitter: 0.3, shards: 0.8 });
  for (const T of [...dashTrails, swing, spin]) T.stop();

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
      for (let k = 0; k < 2; k++) {
        const i = (rnd() * (history.length - 2)) | 0, j = Math.min(history.length - 1, i + 1 + ((rnd() * 4) | 0));
        _v.copy(history[i].p).add(randDir(_x).multiplyScalar(0.25));
        fx.bolt(_v, _w.copy(history[j].p).add(randDir(_x).multiplyScalar(0.35)), { levels: 5, jag: 0.3, width: 0.03, minPx: 7, intensity: 0.95, life: 2, branches: 1 });
      }
    });
  }
  function motes(count, radius) {
    for (let k = 0; k < count; k++) {
      randDir(_v); _w.copy(orb.position).addScaledVector(_v, R(radius * 0.5, radius));
      fx.spawnSpark(_w, _x.copy(_v).cross(UP).multiplyScalar(R(0.4, 1.2)).addScaledVector(_v, -R(0.2, 0.8)), { life: R(0.6, 1.2), size: R(0.006, 0.011), heat: R(0.35, 0.7), gravity: 0.05, drag: 0.6 });
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
        [1.7, () => { orb.pulse(-0.3); fx.ring(orb.position, _v.copy(camera.position).sub(orb.position).normalize(), { radius: 1.3, thick: 0.05, intensity: 0.5, life: 0.26, amp: 0.03 }); fx.puff(at(-0.4, 1.1, 0), { count: 6, size: [0.5, 0.9], dir: caster.facing.clone().negate(), spread: 0.6 }); }],
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
        gale = t < 1.7 ? 1 : 1.6;
        fx.attractor.position.copy(orb.position); fx.attractor.strength = t < 2.4 ? 2.5 : 0; fx.attractor.swirl = t < 2.4 ? 1.5 : 0;
        if (dt > 0 && rnd() < dt * 22) motes(1, 2.6);
        if (t > 1.7) groundDust(26, 0.8, 2.4, dt);
      },
      cam(t) {
        const yaw = -0.35 + 1.45 * smooth(0.2, 3.3, t), dist = 1.45 + 1.4 * smooth(0.7, 3.1, t);
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
          for (const T of BEATS.dash.trailsOn()) T.restart();
          arcsAlongPath(20);
        }],
        [0.52, () => BEATS.dash.turn(1)],
        [0.74, () => BEATS.dash.turn(2)],
        [0.92, () => {
          fx.burst(caster.base.clone(), { strength: 1.0, layers: 3, sparks: 60, debris: 10, dust: 22, bolts: 4 });
          fx.impact({ hold: 0.06, frame: 'center', shake: 0.012, at: caster.body });
          fx.puff(caster.body.clone(), { count: 10, size: [0.6, 1.2] });
        }],
        [1.25, () => { for (const T of dashTrails) T.stop(); }],
      ],
      trailsOn() { return dashTrails; },
      turn(i) {
        const P = this.path, a = P[i][1], d = new V3().subVectors(P[i + 1][1], a).normalize();
        fx.ring(a, d, { radius: 2.2, thick: 0.06, intensity: 0.45, life: 0.26, amp: 0.035 });
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
        if (t > 0.3 && t < 1.25) {
          record(t);
          dashTrails[0].push(c.body);
          dashTrails[1].push(_v.copy(c.body).addScaledVector(c.side, 0.3).addScaledVector(UP, 0.22));
          dashTrails[2].push(_v.copy(c.body).addScaledVector(c.side, -0.3).addScaledVector(UP, -0.25));
        }
        if (t > 0.92 && t < 1.25 && dt > 0) {   // skid: sparks off the ground behind the feet
          fx.sparks(c.base.clone().setY(0.03), { count: 3, dir: _v.copy(c.facing).negate().add(UP), spread: 0.6, speed: [2, 6], life: [0.25, 0.5] });
          groundDust(60, 0, 0.4, dt, 0.6);
        }
      },
      cam(t) {
        const c = caster;
        if (t < 0.3) return { pos: at(-2.6, 0.5, 1.7), look: c.body.clone().addScaledVector(c.facing, 2), fov: 50, k: 6 };
        if (t < 0.95) return { pos: new V3().copy(c.body).addScaledVector(c.aim, -3.1).addScaledVector(c.side, 1.1).setY(Math.max(0.32, c.body.y * 0.45)), look: c.body.clone().addScaledVector(c.aim, 1.6), fov: 54, k: 9 };
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
          fx.impact({ hold: 0.1, frame: 'center', shake: 0.016, shakeMode: 'axial', at: orb.position });
        }],
        [1.3, () => { swing.restart(); BEATS.barrage.swingArcs(); }],
        [1.45, () => {
          const c = caster;
          fx.ring(c.body, UP, { radius: 4.2, thick: 0.06, intensity: 0.8, life: 0.3, amp: 0.035 });
          fx.ring(c.body, UP, { radius: 5.6, thick: 0.1, intensity: 0.35, life: 0.42, delay: 0.06, amp: 0.025 });
          for (let k = 0; k < 9; k++) {
            const a = -1.35 + 2.7 * (k / 8) + R(-0.1, 0.1);
            const d = _x.copy(c.facing).multiplyScalar(Math.cos(a)).addScaledVector(c.side, Math.sin(a));
            fx.bolt(_v.copy(c.body).addScaledVector(d, 0.6), _w.copy(c.body).addScaledVector(d, R(2.2, 3.8)).addScaledVector(UP, R(-0.3, 0.3)), { levels: 6, jag: 0.18, width: 0.04, minPx: 9, intensity: 1.1, life: 2, branches: 1 });
          }
          fx.sparks(c.body, { count: 40, dir: c.facing, spread: 1.2, speed: [4, 11] });
          fx.impact({ hold: 0.05, frame: 'none', shake: 0.012, shakeDir: new THREE.Vector2(1, 0.15) });
        }],
        [1.6, () => swing.stop()],
        [2.3, () => { spin.restart(); BEATS.barrage.spinArcs(); }],
        [2.56, () => {
          const c = caster;
          spin.stop();
          fx.burst(c.body.clone().addScaledVector(c.facing, 0.9), { strength: 1.3, layers: 3, sparks: 110, bolts: 6 });
          fx.burst(c.base.clone().addScaledVector(c.facing, 0.9), { strength: 1.2, layers: 3, debris: 14, dust: 22, sparks: 30, bolts: 5 });
          fx.blast(orb.position, c.facing, { length: 3.4, radius: 2.4, strength: 1.1 });
          fx.puff(c.body.clone().addScaledVector(c.facing, -0.5), { count: 12, size: [0.7, 1.4] });
          fx.impact({ hold: 0.1, frame: 'center', shake: 0.022, shakeMode: 'axial', at: orb.position });
        }],
      ],
      swingArcs() { fx.repeat(5, () => { const p = swing.n > 2 ? swing : null; if (!p) return; const i = Math.max(0, p.n - 3); _v.set(p.p[i * 3], p.p[i * 3 + 1], p.p[i * 3 + 2]); fx.bolt(orb.position, _v.add(randDir(_w).multiplyScalar(0.3)), { levels: 5, jag: 0.25, width: 0.035, minPx: 8, life: 2, branches: 1 }); }); },
      spinArcs() { fx.repeat(8, () => { if (spin.n < 3) return; const i = Math.max(0, spin.n - 4); _v.set(spin.p[i * 3], spin.p[i * 3 + 1], spin.p[i * 3 + 2]); fx.bolt(orb.position, _v, { levels: 5, jag: 0.22, width: 0.04, minPx: 9, life: 2, branches: 1 }); fx.bolt(orb.position, _w.copy(orb.position).addScaledVector(caster.aim, R(1.2, 2.2)).add(randDir(_x).multiplyScalar(0.5)), { levels: 5, jag: 0.25, width: 0.03, minPx: 7, life: 2, branches: 0 }); }); },
      step(t, dt) {
        const c = caster;
        c.lunge = t < 0.22 ? 0 : t < 0.3 ? 0.55 * easeOut((t - 0.22) / 0.08) : 0.55 - 0.45 * smooth(0.3, 0.7, t);
        if (t > 0.26 && t < 1.2) orb.radius = 0.24 + 0.18 * smooth(0.35, 1.1, t); else if (t <= 0.26) orb.radius = 0.42;
        // left reverse swing: the fist sweeps a half circle across the front
        if (t >= 1.3 && t < 1.6) {
          const u = smooth(1.3, 1.44, t), a = Math.PI / 2 - Math.PI * u;
          c.aim.copy(c.facing).multiplyScalar(Math.cos(a)).addScaledVector(c.side, Math.sin(a)).normalize();
          swing.push(_v.copy(c.body).addScaledVector(c.aim, 1.05).addScaledVector(UP, 0.05));
        } else if (t >= 2.3 && t < 2.56) {
          // spinning elbow: the fist goes all the way round
          const a = 6.2832 * easeOut((t - 2.3) / 0.26);
          c.aim.copy(c.facing).applyAxisAngle(UP, a).normalize();
          spin.push(_v.copy(c.body).addScaledVector(c.aim, 0.85).addScaledVector(UP, 0.12));
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
      start() { orb.pressure = 1; orb.instability = 0.35; orb.arcRate = 1.2; this.rTarget = 2.8; },
      events: [
        [0.02, () => { fx.burst(caster.base.clone(), { strength: 0.5, layers: 1, debris: 4, dust: 10, sparks: 10, scorchMark: false, bolts: 2 }); }],
        [0.48, () => {
          const c = caster;
          fx.burst(c.base.clone(), { strength: 1.8, layers: 3, debris: 18, dust: 34, sparks: 120, bolts: 8 });
          fx.impact({ hold: 0.08, frame: 'center', shake: 0.02, at: c.base });
          vortex = fx.vortex(c.base.clone(), { radius: 2.8, height: 1.9, duration: 3.5, bands: 6 });
          fx.attractor.position.copy(c.base).addScaledVector(UP, 0.8); fx.attractor.strength = 0; fx.attractor.swirl = 6;
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
        [3.9, () => { fx.attractor.swirl = 0; }],
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
      title: 'Ultimate', caption: 'Black lightning realm collapse', dur: 6.4,
      start() {
        fx.ramp(0.22, 0.9);
        orb.visible = true; orb.instability = 1; orb.arcRate = 2.2; orb.pressure = 1;
        fx.attractor.strength = 18; fx.attractor.swirl = 5;
        converge = []; tsunami = []; this.nextIn = 0; this.nextEmber = 0; this.nextArc = 0;
        fx.repeat(70, () => {
          if (!orb.visible) return;
          randDir(_v); _v.y = Math.abs(_v.y) * 0.6;
          _w.copy(orb.position).addScaledVector(_v, R(2.6, 4.6));
          fx.bolt(_w, _x.copy(orb.position).addScaledVector(_v, orb.currentRadius), { levels: 6, jag: 0.2, width: 0.035, minPx: 8, intensity: 0.9, life: 2, branches: 1 });
        });
      },
      events: [
        [2.35, () => orb.pulse(-0.5)],
        [2.5, () => {
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
            const T = fx.createTrail({ width: R(0.9, 1.4), life: 0.95, spacing: 0.1, jitter: 0.4, shards: 0.9 }); T.disposable = true;
            tsunami.push({ T, p: orb.position.clone().addScaledVector(radial, 0.5), v: new V3().copy(f).multiplyScalar(0.75).addScaledVector(radial, 0.65).normalize().multiplyScalar(R(11, 15)), age: 0 });
          }
          fx.repeat(4, () => { for (let k = 0; k < 6; k++) { randDir(_v); fx.bolt(ultimateAt, _w.copy(ultimateAt).addScaledVector(_v, R(3, 7)), { levels: 6, jag: 0.18, width: 0.05, minPx: 10, intensity: 1.2, life: 2, branches: 2 }); } });
          fx.impact({ hold: 0.15, frame: 'full', flash: 1, shake: 0.03, shakeMode: 'radial', fisheye: 0.42, at: orb.position });
          orb.visible = false; gale = 2.4;
        }],
        [5.5, () => { orb.visible = true; orb.radius = 0.08; orb.instability = 0.15; orb.arcRate = 0.8; orb.pressure = 0.5; }],
      ],
      step(t, dt) {
        const c = caster;
        c.aim.lerp(c.facing, 1 - Math.exp(-dt * 10)).normalize();
        c.lunge = t < 2.5 ? -0.12 * smooth(0, 1, t) : t < 2.6 ? 0.6 : 0.6 - 0.5 * smooth(2.6, 3.4, t);
        if (t < 2.5) orb.radius = 0.4 + 0.52 * smooth(0, 2.2, t);
        else if (t > 5.5) orb.radius = 0.08 + 0.28 * smooth(5.5, 6.4, t);
        pose();
        if (t < 2.5) {
          fx.attractor.position.copy(orb.position);
          // streams of shadow spiralling in from the edges of the frame
          if (t > this.nextIn && t < 2.2) {
            this.nextIn = t + 0.22;
            const T = fx.createTrail({ width: R(0.4, 0.7), life: 0.55, spacing: 0.08, jitter: 0.2, shards: 0.4 }); T.disposable = true;
            converge.push({ T, a0: R(0, 6.28), h: R(-0.8, 1.6), r0: R(3.8, 5), age: 0 });
          }
          if (dt > 0) { motes(Math.round(dt * 160), 4.5); groundDust(30, 1.5, 4, dt, 0.4); }
        } else {
          if (t > 2.6 && dt > 0 && t > this.nextEmber) {   // embers: torn shadow and slow sparks drifting in the after-air
            this.nextEmber = t + (t < 4 ? 0.03 : 0.12);
            _v.copy(ultimateAt).addScaledVector(c.facing, R(0, 6)).add(_w.set(R(-2.5, 2.5), R(-0.9, 1.8), R(-2.5, 2.5)));
            _v.y = Math.max(0.2, _v.y);
            fx.spawnSprite(1, _v, _w.set(R(-0.3, 0.3), R(0.1, 0.5), R(-0.3, 0.3)), { size: R(0.05, 0.13), life: R(1.6, 2.6), drag: 0.6, buoy: 0.05, grow: 1 });
            if (rnd() < 0.5) fx.spawnSpark(_v, _w.set(R(-0.3, 0.3), R(0.1, 0.6), R(-0.3, 0.3)), { life: R(1.2, 2.2), size: R(0.006, 0.012), heat: R(0.4, 0.75), gravity: 0.04, drag: 0.4 });
          }
          if (t > 2.9 && t < 5.4 && t > this.nextArc) {     // residual arcs
            this.nextArc = t + R(0.18, 0.4);
            _v.copy(ultimateAt).addScaledVector(c.facing, R(0.5, 5)).add(_w.set(R(-1.5, 1.5), R(-1, 1), R(-1.5, 1.5))); _v.y = Math.max(0.1, _v.y);
            fx.bolt(_v, _w.copy(_v).add(randDir(_x).multiplyScalar(R(0.5, 1.3))), { levels: 4, jag: 0.25, width: 0.022, minPx: 5, intensity: 0.6, life: 1, branches: 0 });
          }
          if (t > 4.4) gale = 1 + 1.4 * (1 - smooth(4.4, 6.2, t));
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
        const c = caster;
        if (t < 2.45) {
          const yaw = 0.15 + 1.0 * smooth(0.6, 2.4, t), dist = Math.max(1.6, orb.currentRadius * 3.6) + 0.6 * smooth(0.9, 2.4, t);
          const look = orb.position.clone().lerp(c.body, 0.25 * smooth(1, 2.4, t));
          return { pos: orbit(look, yaw, dist, -0.15), look, fov: 40 + 4 * smooth(1, 2.4, t), k: 4 };
        }
        if (t < 2.9) return { pos: orb.position.clone().addScaledVector(c.facing, 1.2).addScaledVector(c.side, 1.4).addScaledVector(UP, 0.1), look: c.body.clone().addScaledVector(c.facing, 3), fov: 58, k: 7 };
        return { pos: at(1.4, 2.5, 7.6), look: at(4.2, 0.9, 0), fov: 64, k: 3.2 };
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
    for (const T of [...dashTrails, swing, spin]) T.stop();
    fx.ramp(1, 0.05);
    run.beat = b; run.name = name; run.t = 0; run.fired = 0;
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
  const dprCap = Number(params.get('dpr')) || 1.75;
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
    pushCloak(fx.time);
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
    fx, play, BEATS, ORDER, reduceMotion,
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
