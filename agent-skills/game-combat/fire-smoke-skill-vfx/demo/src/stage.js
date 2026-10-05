/* Fire and Smoke stage: a burned plain at night, a camera, and the five beats of one fire skill,
   all drawn by src/fire-fx.mjs. There is no character: the flame is held by an implied hand at
   chest height, so what you see is the effect language alone. */
(() => {
  const THREE = window.THREE;
  const { createFireFX, FIRE_LIGHTS_GLSL, GROUND_HEAT_GLSL, TNOISE_GLSL } = window.FireFX;
  const V3 = THREE.Vector3;
  const UP = new V3(0, 1, 0);
  const canvas = document.getElementById('stage');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(location.search);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: params.has('capture') });
  const FOG = new THREE.Color(0.017, 0.0158, 0.016);   // a neutral slate night horizon: the warmth belongs to the fire, not the air
  renderer.setClearColor(FOG, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 220);
  const fx = createFireFX(THREE, { renderer, scene, camera, seed: 23 });
  fx.options.shake = 0.6; fx.options.fisheye = 0.65;   // felt, not thrown at the viewer
  if (reduceMotion) { fx.options.shake = 0; fx.options.fisheye = 0; fx.options.flashes = 'safe'; }

  // ------------------------------------------------------------ sky: night haze the fire lights from below
  const sky = new THREE.Mesh(new THREE.SphereGeometry(120, 48, 24), new THREE.ShaderMaterial({
    uniforms: { uFog: { value: new V3(FOG.r, FOG.g, FOG.b) }, uTime: fx.uniforms.uTime, tNoise: fx.uniforms.tNoise, ...fx.lightUniforms },
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: TNOISE_GLSL + `
      uniform vec3 uFog; uniform float uTime; uniform vec3 uLightPos[8]; uniform vec3 uLightCol[8]; varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir);
        float h = clamp(d.y, -.2, 1.);
        vec3 col = mix(uFog, vec3(.0034, .0036, .0047), smoothstep(-.01, .32, h));
        vec2 q = d.xz / (d.y + .22);
        vec2 wq = q * .55 + tn(vec3(q * .35, 3.)).xy * .6;
        float cl = tfbm3(vec3(wq + uTime * .006, uTime * .01)) * .5 + .5;
        float haze = smoothstep(.42, .78, cl) * smoothstep(-.02, .25, h);
        col += vec3(.0024, .0026, .0033) * haze * (1. - .5 * smoothstep(.3, .8, h));   // a dim slate cloud deck, barely there
        // the fire lights the haze: a warm glow low in the sky toward each fire
        vec3 glow = vec3(0.);
        for (int i = 0; i < 8; i++) {
          vec3 L = uLightPos[i] - cameraPosition; float dist = length(L) + .5; float c = max(dot(d, L / dist), 0.);
          glow += uLightCol[i] * (pow(c, 24.) * .0018 + pow(c, 4.) * .0007) / (1. + dist * .05);
        }
        col += glow * (.2 + .5 * haze) * (1. - smoothstep(.05, .45, h));   // only the haze right over the fire takes its warmth
        gl_FragColor = vec4(col, 1.);
      }`,
    side: THREE.BackSide, depthWrite: false,
  }));
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);

  // ------------------------------------------------------------ ground: a scan of burned forest floor
  // Poly Haven's "Burned Ground 01" (Rob Tuytel, CC0) at its real 1 m tile, its colour, normal and
  // AO/roughness maps at 1k, embedded by build.mjs as data URIs. The shader re-tints it to char and
  // ash, breaks the repeat with a second rotated sample under a macro mask, and lights it from the
  // fire. Its darkest pockets hold faint embers that breathe; heat makes them, and the pine needles
  // (thin bright filaments in the scan), glow.
  const GM = window.GROUND_MAPS || {};
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const groundU = { tDiff: { value: null }, tNor: { value: null }, tArm: { value: null }, uMaps: { value: 0 } };
  let mapsLeft = 0;
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
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: { ...fx.lightUniforms, ...fx.heatUniforms, ...groundU, uFog: sky.material.uniforms.uFog, uTime: fx.uniforms.uTime, tNoise: fx.uniforms.tNoise, uAmbient: { value: new V3(0.5, 0.55, 0.75) } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: TNOISE_GLSL + FIRE_LIGHTS_GLSL + GROUND_HEAT_GLSL + `
      uniform vec3 uFog, uAmbient; uniform float uMaps, uTime; uniform sampler2D tDiff, tNor, tArm; varying vec3 vW;
      // an arithmetic hash: sin() of a large argument is not random on every GPU
      vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .103, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
      // charcoal litter: lumps a few centimetres across, as a height field (no cells, no grout)
      float lumps(vec2 p, float fade){
        return tn(vec3(p * 7., 31.)).x * .5 + tn(vec3(p * 15., 47.)).y * .32 * fade + tn(vec3(p * 31., 53.)).z * .18 * fade * fade;
      }
      void main(){
        vec2 p = vW.xz;
        float fw = length(fwidth(p));
        // the scan at a 1.6 m tile, so its needles and clods read at this distance as burnt litter and
        // charcoal grit; a second sample, turned and scaled, takes over under a macro mask
        vec4 m4 = tn(vec3(p * .25, 8.1));
        float mB = smoothstep(.44, .56, m4.x * .5 + .5);
        mat2 M = mat2(.8, .6, -.6, .8);
        vec2 uvA = p / 1.6, uvB = M * p / 1.3 + vec2(.31, .67);
        vec3 dif = mix(texture2D(tDiff, uvA).rgb, texture2D(tDiff, uvB).rgb, mB);
        vec3 arm = mix(texture2D(tArm, uvA).rgb, texture2D(tArm, uvB).rgb, mB);
        vec3 nA = texture2D(tNor, uvA).xyz * 2. - 1., nB = texture2D(tNor, uvB).xyz * 2. - 1.;
        nB.xy = transpose(M) * nB.xy;
        vec3 nm = mix(nA, nB, mB);
        dif = mix(vec3(.08), dif, uMaps); arm = mix(vec3(.6, .9, 0.), arm, uMaps); nm = mix(vec3(0., 0., 1.), nm, uMaps);
        float lum = dot(dif, vec3(.2126, .7152, .0722));
        float ao = arm.r;
        float macro = m4.y * .5 + .5;
        vec4 f4 = tn(vec3(p * .6, 12.));
        vec4 g4 = tn(vec3(p * 3.5, 21.)), g5 = tn(vec3(p * 8.5, 5.));    // grit: charcoal clods a few centimetres across
        vec2 hb = groundHeat(p);
        float heat = hb.x, burn = min(hb.y, 1.);
        float fwm = min(length(dFdx(p)), length(dFdy(p)));                 // the finer of the pixel's two footprints
        float far = smoothstep(.03, .09, fwm);                             // past this a centimetre clod is noise, not texture
        // neutral charcoal: the scan's soil, clods and needles all burnt dark (albedo about 0.03), its relief
        // left to catch the firelight; pale ash only in drifts and in small flecks
        float needle = smoothstep(.12, .3, lum);
        vec3 alb = vec3(.03, .029, .028) * (.45 + 1.1 * smoothstep(.0, .14, lum)) * (.8 + .4 * smoothstep(-.5, .6, g4.x));
        alb = mix(alb, vec3(.018, .017, .016), needle * .6);                 // burnt needles and twigs: darker strands
        alb *= .8 + .4 * macro;
        alb = mix(alb, vec3(.055, .054, .052), smoothstep(.64, .86, f4.x * .5 + .5) * .35 * (1. - burn));   // drifts of fine grey ash
        // ash flecks: a few millimetre-to-centimetre pale grey bits, sparse
        vec2 fc = p * 38.; vec2 fi = floor(fc); vec2 fh = hash22(fi + 3.);
        float frad = length(fract(fc) - .5 - (fh - .5) * .5) / 38.;
        float fsz = .003 + .006 * fh.y;
        float fleck = (1. - smoothstep(fsz * .7, fsz + fwm * .5, frad)) * step(.965, fh.x) * (1. - far);
        alb = mix(alb, vec3(.12, .118, .114), fleck * .8);
        alb *= 1. - burn * .3;
        float lf = 1. - smoothstep(.006, .02, fwm);                          // the finer lumps fade before they alias
        float lv = 1. - smoothstep(.02, .06, fwm);
        float e = .006, h0 = lumps(p, lf);
        vec2 lg = vec2(lumps(p + vec2(e, 0.), lf) - h0, lumps(p + vec2(0., e), lf) - h0) / e;
        alb *= mix(1., .5 + .95 * smoothstep(-.45, .45, h0), lv);           // lump tops lighter, the gaps between them dark
        vec3 N = normalize(vec3(nm.x * 1.2 - lg.x * .035 * lv, nm.z, nm.y * 1.2 - lg.y * .035 * lv));
        vec3 V = normalize(cameraPosition - vW);
        float cav = mix(1., .45 + .9 * smoothstep(-.4, .4, h0), lv);          // the gaps between lumps take less light
        vec3 col = alb * vec3(.06, .062, .07) * mix(.4, 1., ao) + fireLight(vW, N, V, alb, .97) * mix(.55, 1.15, ao) * cav;   // dry and matte: no sheen
        // embers: the darkest pockets glow faintly and breathe, each on its own slow phase; heat wakes them,
        // and in real heat the needles burn as thin bright filaments
        float pocket = smoothstep(.034, .012, lum) * smoothstep(.6, .44, ao);
        float br = smoothstep(.3, .95, tn(vec3(p * 2.1, uTime * .2)).z * .5 + .5);
        float grain = smoothstep(.2, .7, tn(vec3(p * 23., 3.7)).w * .5 + .5);
        float hot = heat * (.75 + .5 * macro);
        float crease = smoothstep(.56, .42, ao) * (1. - needle);
        float g = pocket * (.07 * br * grain + hot * 1.3 * (.45 + .55 * br)) + needle * smoothstep(.5, 1.2, hot) * (.35 + .65 * br) * .9 + hot * .012
                + crease * smoothstep(.12, .6, hot) * (.3 + .7 * br) * .22;
        // burnt needles smoulder as thin orange hairlines over the scorched ground: a few stretches of
        // them at a time, waking and dimming, densest near what still burns
        float run = smoothstep(.56, .78, tn(vec3(p * 5.5, uTime * .12 + 4.)).x * .5 + .5);
        float hair = smoothstep(.2, .34, lum) * run * (burn * .55 + smoothstep(.05, .5, heat) * 1.6) * (.4 + .6 * br) * (1. - far);
        g += hair * 1.1;
        g *= 1. - smoothstep(.004, .02, fw) * .5;
        col += vec3(.75, .1, .012) * g + vec3(1.3, .38, .07) * g * g * .45;   // red-orange: yellow only where it is really hot
        // ember specks: single sparks of fuel left on the ground, a pixel or two each
        vec2 gc = p * 13.;
        vec2 ci = floor(gc);
        vec2 eh = hash22(ci + 13.); float e1 = eh.x, e2 = eh.y;
        vec2 off = vec2(e1, e2) - .5;
        float rr = length(fract(gc) - .5 - off * .6) / 13.;
        float sz = .0035 + .005 * e2, aa = max(fwm * .7, 1e-4);
        float szp = max(sz, fwm * .55);                                         // never smaller than about a pixel: far ones stay single bright points
        float dotm = (1. - smoothstep(szp - aa, szp + aa, rr)) * min(1., sz / szp);
        float smoulder = smoothstep(.5, .85, tn(vec3(p * .35, 71.)).x * .5 + .5);   // broad stretches of ground still smouldering
        float want = .03 + .22 * burn + .5 * smoothstep(.0, .6, heat) + .22 * smoulder * (1. - far * .5);
        float on = step(e1 * .7 + e2 * .3, want * .55);
        float tw = .55 + .45 * sin(uTime * (1.3 + 2.7 * e1) + e2 * 40.);
        col += vec3(1.2, .24, .035) * dotm * on * tw * (1. - smoothstep(.06, .14, fwm)) * (.7 + 1.6 * e2);
        float d = length(vW.xz - cameraPosition.xz);
        col = mix(col, uFog, 1. - exp(-d * .035));
        gl_FragColor = vec4(col, 1.);
      }`,
  }));
  ground.frustumCulled = false;
  scene.add(ground);

  // ------------------------------------------------------------ the implied caster
  const HAND = new V3(0.32, 1.18, 0);
  const P = new V3(4.6, 0, 0.25);           // where the pillar rises and the hit lands
  const caster = { hand: HAND.clone() };

  // ------------------------------------------------------------ helpers
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const easeOut = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  const easeIn = (x) => Math.pow(Math.min(1, Math.max(0, x)), 3);
  const rnd = (() => { let s = 7331; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const R = (a, b) => a + (b - a) * rnd();
  // a second stream for everything added after the layouts were approved, so the main stream (which
  // places every burning patch) keeps its exact sequence
  const rnd2 = (() => { let s = 90217; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const R2 = (a, b) => a + (b - a) * rnd2();
  const _v = new V3(), _w = new V3(), _c = new THREE.Color();

  // a light the stage places itself (a second light up the pillar, say)
  function stageLight(pos, energy = 0, fall = 2.4) {
    const L = { alive: true, pos: pos.clone(), energy, fall, lightPos(out) { return out.copy(L.pos); }, lightEnergy() { return L.energy; }, kill() { L.alive = false; } };
    claim(L); return L;
  }
  function claim(L) {
    const ls = fx.lights;
    for (let i = 1; i < ls.length; i++) if (!ls[i].owner && ls[i].energy < 0.08) { ls[i].owner = L; return; }
    for (let i = 1; i < ls.length; i++) if (!ls[i].owner) { ls[i].owner = L; return; }
    const want = (i) => (ls[i].owner.light || 0) * (ls[i].owner.intensity ?? 1);   // what the owner asks for, not where its light is now
    let j = -1; for (let i = 1; i < ls.length; i++) if (ls[i].owner && ls[i].owner.fall === undefined && (j < 0 || want(i) < want(j))) j = i;   // a stage light outranks the dimmest flame's
    if (j > 0) ls[j].owner = L;
  }

  // What a passing front leaves burning. Never one kind of little teardrop: a third are only glowing
  // fuel, a quarter low flat licks running along the ground, a quarter clumps of 3-5 tongues of
  // unequal height, and a few taller flames leaning with the wind.
  const WIND = new V3(0.85, 0, 0.5).normalize();
  const burning = [];
  function pickKind() { const k = rnd(); return k < 0.34 ? 'glow' : k < 0.6 ? 'lick' : k < 0.86 ? 'clump' : 'tall'; }
  function burnPatch(pos, { kind = pickKind(), radius = R(0.2, 0.42), life = R(3.2, 5.5), intensity = R(0.75, 1.0), light = 0, embers = 0.3, smoke = 0.5, delay = 0, dir = null } = {}) {
    const B = { kind, pos: pos.clone().setY(0), radius, life, t: -delay, I: intensity, light, embers, smoke, flame: null, patch: null, done: false, subs: [], temp: R(0.66, 0.84), nextE: R(0.3, 1.2) };
    if (kind === 'clump') {
      const n = 3 + ((rnd() * 3) | 0);
      for (let k = 0; k < n; k++) {
        const a = R(0, 6.28), rr = radius * R(0.1, 0.8), fr = R(0.05, 0.11);
        B.subs.push({ off: new V3(Math.cos(a) * rr, 0, Math.sin(a) * rr), fr, fh: fr * R(2.2, 6.5), lag: R(0, 0.5), k: R(0.55, 1), flame: null });
      }
    } else if (kind === 'tall') { B.fr = R(0.11, 0.17); B.fh = B.fr * R(5.5, 7.5) * 1.3; B.lean = R(0.25, 0.45); }
    else if (kind === 'lick') { B.len = R(0.45, 1.0); B.ang = dir !== null ? dir + R(-0.7, 0.7) + (rnd() < 0.5 ? Math.PI : 0) + Math.PI / 2 : R(0, 6.28); B.fh = R(0.12, 0.28); B.w = R(0.06, 0.1); }   // licks run with the wave, across its front
    burning.push(B);
    return B;
  }
  function startPatch(B) {
    B.patch = fx.addHeat(B.pos, B.radius * (B.kind === 'glow' ? 2 : 1.6), 0, { burn: R(0.55, 0.9), tau: 1e6 });
    const common = { intensity: B.I, temp: B.temp, soot: 0.55, light: B.light, embers: B.embers, smoke: B.smoke, smokeSize: 1.1, smokeKind: 'wisp', heat: 0, fadeIn: 0.35, haze: 0 };
    if (B.kind === 'tall') B.flame = fx.flame({ mode: 'plume', pos: B.pos, radius: B.fr * 0.3, height: B.fh * 0.2, lean: { x: WIND.x * B.lean, y: WIND.z * B.lean }, ragged: R(0.45, 0.6), stretch: R(1.3, 1.6), scale: B.fr * R(0.36, 0.46), ...common, temp: B.temp + 0.08 });
    else if (B.kind === 'lick') {
      // a short low wall running along the ground: a slice of a wide circle, its ends crumbling
      const big = 9, ha = B.len / (2 * big), c = _w.set(B.pos.x - Math.cos(B.ang) * big, 0, B.pos.z - Math.sin(B.ang) * big).clone();
      B.flame = fx.flame({ mode: 'arc', pos: c, radius: B.w, height: B.fh * 0.3, arcR: big, a0: B.ang - ha, a1: B.ang + ha, f0: B.ang - ha, f1: B.ang + ha, fw: ha * 0.9, hvar: 0.45, wobble: 0, lean: { x: R(-0.12, 0.12), y: 0 }, ragged: 0.8, scale: B.w * 0.9, ...common });
    }
  }
  function updateBurning(dt) {
    for (let i = burning.length - 1; i >= 0; i--) {
      const B = burning[i];
      B.t += dt;
      if (B.t < 0) continue;
      if (!B.patch) startPatch(B);
      const e = smooth(0, 0.45, B.t) * (1 - smooth(B.life * 0.5, B.life, B.t));
      for (const S of B.subs) {
        const ts = B.t - S.lag;
        if (!S.flame && !S.gone && ts > 0 && !B.done) S.flame = fx.flame({ mode: 'plume', pos: _v.copy(B.pos).add(S.off), radius: 0.02, height: 0.05, intensity: B.I, temp: B.temp * R(0.9, 1.08), light: S === B.subs[0] ? B.light : 0, embers: B.embers * 0.4, smoke: B.smoke * 0.4, smokeKind: 'wisp', fadeIn: 0.3, haze: 0, ragged: R(0.5, 0.75), stretch: R(1.2, 1.6), scale: S.fr * R(0.36, 0.5), lean: { x: WIND.x * R(0, 0.25), y: WIND.z * R(0, 0.25) } });
        if (S.flame) {
          const es = smooth(0, 0.45, ts) * (1 - smooth(B.life * 0.45 * S.k, B.life * S.k, ts));
          S.flame.radius = S.fr * (0.45 + 0.55 * es); S.flame.height = S.fh * (0.25 + 0.75 * es); S.flame.intensity = B.I * Math.min(1, es * 1.4);
          if (ts >= B.life * S.k || B.done) { S.flame.kill(0.3); S.flame = null; S.gone = true; }
        }
      }
      if (B.flame) {
        if (B.kind === 'lick') { B.flame.height = B.fh * (0.3 + 0.7 * e); B.flame.radius = B.w * (0.5 + 0.5 * e); }
        else { B.flame.radius = B.fr * (0.45 + 0.55 * e); B.flame.height = B.fh * (0.25 + 0.75 * e); }
        B.flame.intensity = B.I * Math.min(1, e * 1.4);
      }
      B.patch.heat = (B.kind === 'glow' ? 0.35 + 0.65 * e : 0.25 + 1.0 * e);
      if (B.kind === 'glow' && dt > 0 && (B.nextE -= dt) <= 0) {   // glowing fuel lets an ember go now and then
        B.nextE = R(0.6, 1.6);
        fx.spawnSpark(_v.copy(B.pos).add(_w.set(R(-0.2, 0.2), 0.03, R(-0.2, 0.2))), _w.set(R(-0.2, 0.2), R(0.4, 0.9), R(-0.2, 0.2)), { life: R(1.2, 2.4), size: R(0.002, 0.0045), heat: R(0.6, 0.85), cool: R(0.4, 0.7), drag: 1.2, buoy: R(0.6, 1.1), gravity: 0.02, curl: 1.2, flake: 0.3 });
      }
      if (B.t >= B.life && !B.done) { if (B.flame) { B.flame.kill(0.3); B.flame = null; } B.done = true; B.patch.tau = B.kind === 'glow' ? 7 : 4.5; }
      if (B.done) { for (const S of B.subs) if (S.flame) { S.flame.kill(0.3); S.flame = null; } burning.splice(i, 1); }
    }
  }
  function smoulderWisp(pos, k = 1) {
    fx.spawnSmoke(_v.copy(pos).setY(R(0.08, 0.25)), _w.set(R(-0.08, 0.08), R(0.25, 0.5), R(-0.08, 0.08)), { type: 2, size: R(0.16, 0.3) * k, grow: R(2.2, 3), life: R(2.4, 3.8), opacity: R(0.35, 0.55), aspect: R(1.8, 2.6), fibre: 1.6, buoy: R(0.08, 0.16), drag: 0.6, curl: 0.5, glow: 0.12 });
  }

  // ------------------------------------------------------------ beats
  // Each beat: dur (sim seconds), start(), events [[t, fn]], step(t, dt), cam(t) -> {pos, look, fov, k}
  let baseLight = null;
  let core = null, coreLight = 0, wave = null, pillar = null, pillarLight = null, skirt = null, ball = null, fireball = null, ringFire = null;
  const BEATS = {
    ignition: {
      title: 'Ignition', caption: 'A spark becomes a held flame', dur: 4.4, cut: true, flameScale: 0.8,
      start() {
        if (core) { core.kill(0.3); core = null; }
        this.sparked = false;
      },
      events: [
        [0.3, () => {
          fx.glint(caster.hand, { size: 0.05, life: 0.32, intensity: 1.3 });
          fx.flash(caster.hand, 1.6, 7, 1);
          fx.sparks(caster.hand, { count: 4, speed: [0.6, 1.8], life: [0.25, 0.6], size: [0.0015, 0.003], gravity: 0.25, cool: [1.4, 2.4], flake: 0 });
        }],
        [0.42, () => {
          core = fx.flame({ mode: 'ball', pos: caster.hand, radius: 0.012, height: 0.04, intensity: 1, temp: 1.06, soot: 0.3, light: 2.6, embers: 0, smoke: 0, smokeSize: 0.6, smokeKind: 'wisp', fadeIn: 0.15, haze: 0.9, swirl: 3.5, spin: 2.2, ragged: 0.45 });
        }],
      ],
      step(t, dt) {
        if (!core) return;
        const g = easeOut((t - 0.42) / 1.6);
        const breathe = 1 + 0.035 * Math.sin(t * 2.1) + 0.02 * Math.sin(t * 3.3 + 1);
        core.radius = (0.012 + 0.098 * g) * breathe;
        core.height = core.radius * (3.6 + 1.2 * g);
        core.temp = 1.06 + 0.06 * (1 - g);
        core.light = 2.8 * g + 0.4;
        core.embers = t > 1.6 ? 0.9 : 0; core.smoke = t > 1.8 ? 0.9 : 0;
        core.pos.copy(caster.hand).addScaledVector(UP, 0.01 * Math.sin(t * 1.3));
        if (dt > 0 && t > 1.2 && rnd() < dt * 2.2) {   // now and then an ember curls up off it
          const a = R(0, 6.28);
          fx.spawnSpark(_v.copy(core.pos).add(_w.set(Math.cos(a) * core.radius * 0.8, R(0, 0.12), Math.sin(a) * core.radius * 0.8)), _w.set(-Math.sin(a) * 0.5, R(0.4, 0.9), Math.cos(a) * 0.5), { life: R(1.0, 1.8), size: R(0.0015, 0.003), heat: R(0.8, 1), cool: R(0.6, 1.0), drag: 1.4, buoy: 1.4, gravity: 0.02, curl: 1.4, flake: 0.3 });
        }
      },
      cam(t) {
        const look = new V3().copy(caster.hand).addScaledVector(UP, 0.02 + 0.1 * smooth(0.5, 2.5, t));
        const yaw = 2.3 - 0.4 * smooth(0, 4.4, t), dist = 1.05 + 0.4 * smooth(0.6, 3.6, t);
        return { pos: new V3(look.x + Math.cos(yaw) * dist, 1.48 + 0.1 * smooth(0, 4, t), look.z + Math.sin(yaw) * dist), look, fov: 42, k: 4 };
      },
    },

    wave: {
      title: 'Fire wave', caption: 'A breath of fire rolls across the ground', dur: 4.6, flameScale: 0.85,
      start() {
        if (!core) core = fx.flame({ mode: 'ball', pos: caster.hand, radius: 0.11, height: 0.44, intensity: 1, temp: 1.06, soot: 0.3, light: 3.2, embers: 0.9, smoke: 0.9, smokeSize: 0.6, smokeKind: 'wisp', haze: 0.9, swirl: 3.5, spin: 2.2, ragged: 0.45 });
        this.rLast = 0;
      },
      events: [
        [0.6, () => {
          // the held flame is thrown down: the wave leaves the ground where it lands
          fx.flash(new V3(0.8, 0.3, 0), 9, 5, 1);
          fx.options.flameScale = 0.72;   // the wall and its patches fill the frame; detail is band-limited to whatever resolution this is
          wave = fx.flameArc({ center: new V3(0, 0, 0), R: 0.7, w: 0.32, height: 0.2, a0: -0.6, a1: 0.6, segments: 8, lights: 2, lean: { x: 0.3, y: 0.55 }, intensity: 1, temp: 1.0, soot: 0.65, smoke: 2.2, smokeSize: 1.3, embers: 2.2, heat: 0.6, light: 4.6, hvar: 0.5, wobble: 0.05, ragged: 0.75, stretch: 1.05, fadeIn: 0.12 });
          fx.ring(new V3(0.8, 0.05, 0), UP, { radius: 3.2, thick: 0.1, life: 0.45, amp: 0.018 });
          fx.sparks(new V3(0.8, 0.1, 0), { count: 14, dir: new V3(1, 0.6, 0), spread: 0.7, speed: [2, 5], life: [0.5, 1.1], gravity: 0.8, curl: 0.4 });
        }],
      ],
      step(t, dt) {
        if (core) {
          if (t < 0.48) {
            const k = smooth(0, 0.42, t);
            core.radius = 0.11 * (1 - 0.25 * k); core.intensity = 1 + 0.5 * k; core.temp = 1.06 + 0.1 * k;
            core.pos.copy(caster.hand).addScaledVector(UP, 0.04 * k).add(_v.set(-0.06 * k, 0, 0));
          } else {
            const u = (t - 0.48) / 0.13;
            core.pos.lerpVectors(caster.hand, _v.set(0.75, 0.3, 0), easeIn(u));
            if (u >= 1) { core.kill(0.08); core = null; }
          }
        }
        if (wave && wave.alive) {
          const u = Math.max(0, t - 0.6);
          const rr = 0.7 + 6.0 * easeOut(u / 2.6);
          const h = (0.6 + 1.75 * smooth(0, 0.3, u)) * (1 - 0.52 * smooth(0.35, 2.6, u));
          // it smokes once it is well out: smoke made near the caster hung between the camera and the fire as a wall
          wave.set({ R: rr, height: h, w: 0.32 - 0.1 * smooth(0, 2.6, u), lean: 0.3 - 0.12 * smooth(0, 2.6, u), smoke: 3 * smooth(1.6, 3.2, rr) });
          if (u > 2.3 && !this.killed) { wave.kill(0.7); this.killed = true; }
          // the front leaves burning patches behind it
          while (rr - this.rLast > 0.42 && u < 2.4) {
            this.rLast += 0.42;
            const n = 1 + (rnd() < 0.45 ? 1 : 0);
            for (let k = 0; k < n; k++) {
              const a = R(-0.5, 0.5), r2 = this.rLast - R(0.35, 1.0), big = rnd() < 0.3;   // well behind the front, so they never line up under it as a fuse
              burnPatch(new V3(Math.cos(a) * r2, 0, Math.sin(a) * r2), { kind: big ? (rnd() < 0.55 ? 'clump' : 'tall') : pickKind(), radius: big ? R(0.35, 0.55) : R(0.16, 0.34), life: R(3.5, 7), delay: R(0.2, 0.7), dir: a, light: big ? 1.6 : 0, embers: R(0.15, 0.4), smoke: big ? 0.8 : R(0.2, 0.5) });
              if (rnd() < 0.6) fx.addHeat(_v.set(Math.cos(a + R(-0.15, 0.15)) * (r2 + R(-0.3, 0.3)), 0, Math.sin(a + R(-0.15, 0.15)) * (r2 + R(-0.3, 0.3))), R(0.3, 0.7), R(0.5, 0.9), { burn: R(0.5, 0.9), tau: R(5, 9) });   // smouldering ground between the flames
            }
          }
        }
      },
      cam(t) {
        const u = smooth(0.4, 3.8, t);
        return { pos: new V3(-2.1 + 1.6 * u, 1.2 - 0.25 * u, 1.9 + 1.4 * u), look: new V3(1.6 + 2.6 * u, 0.6 - 0.1 * u, 0.1), fov: 48, k: 3 };
      },
    },

    pillar: {
      title: 'Fire pillar', caption: 'A fire tornado and its smoke column', dur: 5.4, flameScale: 0.72,
      start() {
        if (wave && wave.alive) wave.kill(0.5);
        this.nextIn = 0;
      },
      events: [
        [0.0, () => { this.heatP = fx.addHeat(P, 1.0, 0.2, { burn: 0.6, tau: 1e6 }); }],
        [0.55, () => {
          pillar = fx.flame({ mode: 'plume', pos: P, radius: 0.18, height: 0.3, intensity: 1.05, temp: 1.02, soot: 0.75, swirl: 1.9, spin: 2.6, blue: 0.45, light: 6.5, smoke: 9, smokeSize: 1.15, embers: 36, heat: 1.4, fadeIn: 0.2, haze: 1.3, wander: 0.11, ragged: 0.5 });
          pillarLight = stageLight(_v.copy(P).addScaledVector(UP, 2.6), 0);
          baseLight = stageLight(_v.copy(P).addScaledVector(UP, 0.55), 0, 0.35);   // the pool the column throws on the ground round its foot
          // a broken skirt of low flame round its foot, leaning in: the air the column draws in drags the fire with it
          skirt = fx.flameArc({ center: P.clone(), R: 1.3, w: 0.14, height: 0.1, a0: -Math.PI, a1: Math.PI, segments: 8, lights: 0, lean: { x: -0.55, y: 0 }, intensity: 0.95, temp: 0.9, smoke: 0.5, smokeSize: 0.8, smokeKind: 'wisp', embers: 0.6, heat: 0.6, hvar: 0.15, wobble: 0.1, ragged: 0.8, fadeIn: 0.4, blue: 0.35 });
          fx.ring(P.clone().setY(0.05), UP, { radius: 3.8, thick: 0.1, life: 0.5, amp: 0.022 });
          // low banks of dust and smoke either side, lit only by the column
          for (let k = 0; k < 12; k++) {
            const side = k % 2 ? 1 : -1, along = R2(2.2, 6.5) * side, back = R2(0, 4);
            _v.set(P.x + 0.93 * along + 0.36 * back, R2(0.6, 1.8), P.z + 0.36 * along - 0.93 * back);
            fx.spawnSmoke(_v, _w.set(R2(-0.05, 0.05), R2(0.01, 0.05), R2(-0.05, 0.05)), { type: 2, size: R2(4.5, 7), grow: 1.2, life: R2(6.5, 8), opacity: R2(0.14, 0.24), aspect: R2(0.45, 0.6), fibre: 0.5, buoy: 0.01, drag: 0.5, curl: 0.08, glow: 0, color: _c.set(0.05, 0.042, 0.038) });
          }
          fx.sparks(P.clone().setY(0.2), { count: 18, dir: UP, spread: 0.8, speed: [2, 6], life: [0.6, 1.2], gravity: 0.5, curl: 0.6 });
        }],
      ],
      step(t, dt) {
        const hp = BEATS.pillar.heatP;
        if (hp) hp.heat = 0.2 + 1.1 * smooth(0, 0.6, t);
        // before it rises, embers are drawn in along the ground, swirling
        if (t < 0.65 && dt > 0 && t > this.nextIn) {
          this.nextIn = t + 0.05;
          const a = R(0, 6.28), rr = R(1.0, 2.2);
          fx.spawnSpark(_v.set(P.x + Math.cos(a) * rr, R(0.05, 0.3), P.z + Math.sin(a) * rr), _w.set(-Math.cos(a) * 1.6 - Math.sin(a) * 1.8, R(0.1, 0.5), -Math.sin(a) * 1.6 + Math.cos(a) * 1.8), { life: R(0.6, 1.1), size: R(0.003, 0.006), heat: R(0.7, 0.95), cool: 0.5, drag: 0.6, gravity: 0, curl: 0.2 });
        }
        if (pillar) {
          const g = easeOut((t - 0.55) / 1.1), late = smooth(4.4, 5.4, t);
          pillar.radius = 0.14 + 0.5 * g - 0.06 * late;   // narrow at the root; the funnel widens it up the column
          if (skirt && skirt.alive) skirt.set({ R: 1.45 - 0.45 * g, height: 0.1 + 0.5 * g * (1 - 0.5 * late) });
          pillar.height = 0.3 + 4.4 * g;
          pillar.spin = 2.6 + 0.8 * smooth(1.5, 3.5, t);
          if (pillarLight) { pillarLight.pos.copy(P).addScaledVector(UP, Math.min(4.6, pillar.height * 0.88)); pillarLight.energy = 5 * g; }   // high in the column: it lights the smoke leaving the top
          if (baseLight) baseLight.energy = 4.2 * g * (1 - 0.4 * late);
        }
      },
      cam(t) {
        const u = smooth(0.3, 2.4, t), v = smooth(2.4, 5.4, t);
        const yaw = -2.0 + 0.3 * v;
        const dist = 6.2 + 1.4 * u - 0.7 * v;
        const look = new V3(P.x, 1.0 + 2.0 * u, P.z);
        return { pos: new V3(P.x + Math.cos(yaw) * dist, 0.55 + 0.35 * u, P.z - Math.sin(yaw) * dist), look, fov: 52 + 6 * u, k: 2.6 };
      },
    },

    impact: {
      title: 'Impact', caption: 'Flame burst and a ring of fire', dur: 4.8, HIT: 0.85, flameScale: 0.64,
      start() {
        this.top = P.clone().addScaledVector(UP, 3.3);
        this.rLast = 0.6; this.hit = false; this.inkAt = 0; this.smAcc = 0;
        ball = fx.flame({ mode: 'ball', pos: this.top, radius: 0.01, height: 0.03, intensity: 1.1, temp: 1.1, soot: 0.3, light: 4, embers: 2, smoke: 1.2, smokeSize: 0.8, smokeLife: 0.5, fadeIn: 0.15, haze: 1, swirl: 2.6, spin: 3.2, ragged: 0.6 });
      },
      events: [
        [0.85, () => {
          const B = BEATS.impact, at = P.clone().addScaledVector(UP, 0.45);
          B.hit = true;
          if (ball) { ball.kill(0.06); ball = null; }
          if (pillar) { pillar.kill(0.1); pillar = null; }
          if (pillarLight) { pillarLight.kill(); pillarLight = null; }
          if (baseLight) { baseLight.kill(); baseLight = null; }
          B.inkAt = 0.06;
          fx.flash(at, 30, 3.2, 1);
          fireball = fx.flame({ mode: 'ball', pos: at, radius: 0.3, height: 0.7, intensity: 1.25, temp: 1.3, soot: 0.9, billow: 0.85, light: 9, smoke: 10, smokeSize: 0.55, embers: 16, heat: 1.6, fadeIn: 0.04, haze: 1.4, blue: 0.4 });
          ringFire = fx.flameArc({ center: P.clone(), R: 0.6, w: 0.2, height: 1.1, a0: -Math.PI, a1: Math.PI, segments: 12, lights: 4, lean: { x: 0.2, y: 0 }, intensity: 1.05, temp: 0.92, soot: 0.6, smoke: 0.9, smokeSize: 1, smokeKind: 'wisp', embers: 0.8, heat: 0.7, light: 3.2, hvar: 0.75, wobble: 0.17, ragged: 0.75, stretch: 1.05, fadeIn: 0.08 });
          fx.addHeat(P, 1.7, 1.7, { burn: 0.95, tau: 3.2 });
          fx.ring(P.clone().setY(0.06), UP, { radius: 7, thick: 0.14, life: 0.55, amp: 0.03 });
          fx.ring(at, _v.copy(camera.position).sub(at).normalize(), { radius: 3.2, thick: 0.1, life: 0.35, amp: 0.025, delay: 0.03 });
          fx.sparks(at, { count: 46, speed: [4, 11], life: [0.5, 1.3], gravity: 1, cool: [0.9, 1.6], curl: 0.3, flake: 0.25 });
          fx.sparks(at, { count: 18, dir: UP, spread: 0.9, speed: [1.5, 4], life: [1.5, 3], gravity: 0.08, buoy: 1.2, cool: [0.35, 0.6], curl: 1.2, flake: 0.6 });
          for (let k = 0; k < 10; k++) {   // ash thrown low off the ground
            const a = R(0, 6.28), out = _w.set(Math.cos(a), 0, Math.sin(a));
            fx.spawnSmoke(_v.copy(P).addScaledVector(out, R(0.3, 0.9)).setY(R(0.08, 0.3)), out.clone().multiplyScalar(R(3, 6.5)).setY(R(0.2, 0.7)), { type: 2, size: R(0.35, 0.7), grow: 2.8, life: R(1.4, 2.4), color: fx.palette.ash, opacity: 0.32, drag: 2.3, buoy: 0.1, glow: 0.1 });
          }
        }],
      ],
      step(t, dt) {
        const HIT = this.HIT;
        if (this.inkAt && t >= HIT + this.inkAt) {   // the ink frame waits for the burst to have a shape
          this.inkAt = 0;
          fx.impact({ hold: 0.08, frame: 'center', shake: 0.016, shakeMode: 'axial', fisheye: 0.14, at: P.clone().addScaledVector(UP, 0.6), radius: 0.36 });
        }
        if (t < HIT) {
          if (pillar) {   // the pillar is drawn up into the ball above it
            const u = smooth(0, 0.55, t);
            pillar.pos.copy(P).addScaledVector(UP, 3.0 * easeIn(u));
            pillar.height = Math.max(0.05, 5.2 * (1 - u) + 0.4);
            pillar.radius = 0.52 - 0.3 * u;
            if (u >= 1) { pillar.kill(0.15); pillar = null; }
            if (pillarLight) pillarLight.energy *= Math.exp(-dt * 3);
          }
          if (ball) {
            const g = easeOut(t / 0.5);
            ball.radius = 0.01 + 0.36 * g; ball.height = ball.radius * 3.2;
            const fall = easeIn((t - 0.62) / (HIT - 0.62));
            ball.pos.copy(this.top).addScaledVector(UP, -(this.top.y - 0.45) * fall);
          }
        }
        if (fireball) {
          const u = t - HIT;
          fireball.radius = 0.3 + 0.95 * easeOut(u / 0.5);
          fireball.scale = fireball.radius * 0.22;
          fireball.height = fireball.radius * (2.5 + 0.6 * smooth(0, 1.2, u));
          fireball.pos.y = 0.45 + 0.75 * fireball.radius + 0.9 * u;
          fireball.temp = 1.3 * Math.exp(-u / 0.42);
          fireball.intensity = 1.25 * (1 - smooth(0.5, 1.05, u) * 0.7);   // it breaks up into dark smoke with a few hot pockets, then hands over to the rising smoke
          fireball.light = 9 * Math.exp(-u / 0.3);
          fireball.smoke = 0;
          fireball.blue = 0.4 * (1 - smooth(0, 0.3, u));
          fireball.steps = u > 0.3 ? 26 : 0;   // breaking up into dark smoke it needs fewer samples: this window was the beat's GPU peak
          // the burst itself burns out fast: its soot is drawn over the smoke, so it must hand over to it early
          if (u > 0.5) { fireball.kill(0.22); fireball = null; }
        }
        if (this.hit) {   // the mushroom and its stem, from the moment of the hit (the burst itself is gone by 0.7 s)
          const u = t - HIT, fbR = 0.3 + 0.95 * easeOut(u / 0.5), fbY = 0.45 + 0.75 * fbR + 0.9 * u;
            if (dt > 0 && u > 0.12 && u < 1.0) {   // the approved sequence's draws, kept so the patches after them land where they did
              this.smAcc = (this.smAcc || 0) + 34 * (1 - smooth(0.6, 1.0, u)) * dt;
              while (this.smAcc >= 1) { this.smAcc -= 1; for (let k = 0; k < 13; k++) rnd(); }
            }
            // the column: dense, near-black billows filling a broad rising mass from just above the ground
            // up to the burst, with a few hot crevices low down; no stem
            if (dt > 0 && u > 0.04 && u < 1.2) {
              this.smAcc2 = (this.smAcc2 || 0) + 95 * (1 - smooth(0.7, 1.2, u)) * dt;
              while (this.smAcc2 >= 1) {
                this.smAcc2 -= 1;
                const a = R2(0, 6.28), rr = Math.sqrt(rnd2()) * (0.6 + 0.7 * smooth(0, 0.4, u)), hy = 0.35 + rnd2() * (fbY + fbR * 1.4);
                _v.set(P.x + Math.cos(a) * rr, hy, P.z + Math.sin(a) * rr);
                _w.set(Math.cos(a) * R2(0.1, 0.45), R2(1.4, 2.8), Math.sin(a) * R2(0.1, 0.45));
                const hot = rnd2() < 0.32 * (1 - smooth(0.35, 1.0, u)) && hy < fbY + fbR;
                fx.spawnSmoke(_v, _w, { size: R2(0.55, 0.95), grow: R2(1.3, 1.7), life: R2(2.8, 3.8), opacity: 1, glow: R2(0.08, 0.18) * Math.exp(-u / 0.7), color: _c.set(0.019, 0.018, 0.017), fibre: hot ? 4.5 + R2(0.8, 1.6) : 1.2, buoy: R2(0.4, 0.8), drag: 0.9, aspect: R2(1.0, 1.3), curl: 0.35 });
              }
            }
        }
        if (ringFire && ringFire.alive) {
          const u = t - HIT;
          const rr = 0.6 + 3.8 * easeOut(u / 1.6);
          ringFire.set({ R: rr, height: (0.35 + 0.8 * smooth(0, 0.3, u)) * (1 - 0.5 * smooth(0.3, 1.8, u)), w: 0.2 - 0.05 * smooth(0, 1.6, u), lean: 0.16 * (1 - smooth(0, 0.9, u)) + 0.03 });
          if (u > 2.0 && !this.ringKilled) { ringFire.kill(1.0); this.ringKilled = true; }
          while (rr - this.rLast > 0.55 && u < 1.9) {
            this.rLast += 0.55;
            for (let k = 0; k < 3; k++) {
              const a = R(0, 6.28), r2 = this.rLast - R(0, 0.25), big = rnd() < 0.25;
              burnPatch(new V3(P.x + Math.cos(a) * r2, 0, P.z + Math.sin(a) * r2), { kind: big ? (rnd() < 0.55 ? 'clump' : 'tall') : pickKind(), radius: big ? R(0.35, 0.55) : R(0.16, 0.34), life: R(4, 7.5), delay: R(0, 0.2), light: big ? 1.4 : 0, embers: R(0.15, 0.4), smoke: big ? 0.7 : R(0.2, 0.5) });
              fx.addHeat(_v.set(P.x + Math.cos(a + 0.4) * r2, 0, P.z + Math.sin(a + 0.4) * r2), R(0.35, 0.8), R(0.5, 0.9), { burn: R(0.6, 0.95), tau: R(6, 10) });
            }
          }
        }
      },
      cam(t) {
        const u = smooth(this.HIT, 4.8, t);
        const look = new V3(P.x - 0.2, 1.25 + 0.25 * u - 0.35 * smooth(0, this.HIT, t), P.z);
        return { pos: new V3(P.x - 6.4 + 0.6 * u, 2.0 + 0.3 * u, P.z + 6.0 - 0.4 * u), look, fov: 50, k: 3 };
      },
    },

    aftermath: {
      title: 'Aftermath', caption: 'Smoulder, drifting embers, settling smoke', dur: 5.2, cut: true, flameScale: 0.8,
      start() {
        if (ringFire && ringFire.alive) ringFire.kill(0.8);
        if (burning.length < 6) {   // played on its own: a field that has just burned
          for (let k = 0; k < 14; k++) { const a = R(0, 6.28), rr = R(0.4, 4); burnPatch(new V3(P.x + Math.cos(a) * rr, 0, P.z + Math.sin(a) * rr), { life: R(2.5, 5), delay: -R(0.5, 2), light: k < 2 ? 1.2 : 0, embers: 0.3, smoke: 0.4 }); }
          for (let k = 0; k < 10; k++) { const a = R(0, 6.28), rr = R(0.5, 4); fx.addHeat(new V3(P.x + Math.cos(a) * rr, 0, P.z + Math.sin(a) * rr), R(0.5, 1.1), R(0.4, 0.8), { burn: R(0.6, 0.95), tau: 4 }); }
        }
        this.nextE = 0; this.nextS = 0; this.nextW = 0;
        // what the fire leaves: wide heat that cools over the beat, so the needles glow as hairlines and go out,
        // and the pockets keep breathing after them
        for (let k = 0; k < 14; k++) { const a = R(0, 6.28), rr = R(0.3, 3.9); fx.addHeat(new V3(P.x + Math.cos(a) * rr, 0, P.z + Math.sin(a) * rr), R(0.7, 1.3), R(0.85, 1.25), { burn: R(0.6, 0.95), tau: R(10, 16) }); }   // cools slowly enough to carry the shot into the loop
        // a few low flames still licking, dying one after another
        for (let k = 0; k < 6; k++) { const a = R(0, 6.28), rr = R(0.6, 3.4); burnPatch(new V3(P.x + Math.cos(a) * rr, 0, P.z + Math.sin(a) * rr), { kind: ['clump', 'lick', 'lick', 'clump', 'tall', 'tall'][k], radius: R(0.18, 0.3), life: [2.6, 3.4, 4.2, 5, 7, 8.5][k], delay: -0.4, embers: 0.4, smoke: 0.5, light: k > 3 ? 1.1 : 0 }); }   // the last two outlast the shot and carry it into the loop
        this.glowL = [stageLight(new V3(P.x - 0.8, 0.3, P.z + 0.6), 0), stageLight(new V3(P.x + 1.2, 0.3, P.z - 0.8), 0), stageLight(new V3(P.x + 0.2, 0.3, P.z + 2.2), 0)];
      },
      events: [],
      step(t, dt) {
        if (this.glowL) for (const L of this.glowL) { L.energy = 1.5 * smooth(0, 0.8, t) * (1 - 0.35 * smooth(2.5, 5.2, t)); if (t > 5.15) L.kill(); }   // the embers' own faint light on the low smoke
        if (dt <= 0) return;
        // drifting embers off the smouldering ground, cooling to ash
        if (t > this.nextE) {
          this.nextE = t + R(0.07, 0.18);
          const a = R(0, 6.28), rr = R(0.2, 4);
          fx.spawnSpark(_v.set(P.x + Math.cos(a) * rr, R(0.05, 0.3), P.z + Math.sin(a) * rr), _w.set(R(-0.3, 0.3) + 0.25, R(0.3, 0.9), R(-0.3, 0.3)), { life: R(2.5, 4.5), size: R(0.0025, 0.005), heat: R(0.55, 0.85), cool: R(0.25, 0.45), drag: 1.2, buoy: R(0.5, 1.0), gravity: 0.02, curl: R(1, 1.8), flake: 0.7 });
        }
        // smoke settling: low, wide, slow
        if (t > this.nextS && t < 4.6) {
          this.nextS = t + R(0.35, 0.6);
          const a = R(0, 6.28), rr = R(0.5, 3.5);
          fx.spawnSmoke(_v.set(P.x + Math.cos(a) * rr, R(0.35, 0.9), P.z + Math.sin(a) * rr), _w.set(R(0.1, 0.3), R(0.02, 0.1), R(-0.1, 0.1)), { type: 2, size: R(1.2, 2.0), grow: R(1.6, 2.1), life: R(4.5, 6.5), opacity: R(0.3, 0.45), buoy: R(0.01, 0.05), drag: 0.5, curl: 0.25, glow: 0, aspect: R(0.55, 0.75) });
        }
        // thin wisps off the hottest patches
        if (t > this.nextW) {
          this.nextW = t + R(0.12, 0.26);
          let best = null, bh = 0.05;
          for (let k = 0; k < 6; k++) { const Pt = fx.patches[(rnd() * fx.patches.length) | 0]; if (Pt && Pt.heat > bh && Pt.shape === 0) { bh = Pt.heat; best = Pt; } }
          if (best) smoulderWisp(_v.set(best.x + R(-0.3, 0.3), 0, best.z + R(-0.3, 0.3)));
        }
      },
      cam(t) {
        const u = smooth(0, 5.8, t);
        return { pos: new V3(P.x - 4.8 + 1.6 * u, 1.15 - 0.3 * u, P.z + 4.2 - 1.0 * u), look: new V3(P.x + 0.2 + 0.4 * u, 0.1, P.z - 0.2), fov: 44, k: 2 };
      },
    },
  };
  const ORDER = ['ignition', 'wave', 'pillar', 'impact', 'aftermath'];

  const idle = {
    title: 'Idle', caption: 'Holding the flame', dur: Infinity, events: [], flameScale: 0.75,
    start() {},
    step(t, dt) {
      if (core) {
        const breathe = 1 + 0.035 * Math.sin(t * 2.1 + 1) + 0.02 * Math.sin(t * 3.3);
        core.radius += (0.11 * breathe - core.radius) * (1 - Math.exp(-dt * 3)); core.height = core.radius * 4.8;
        core.intensity += (1 - core.intensity) * (1 - Math.exp(-dt * 3)); core.temp += (1.06 - core.temp) * (1 - Math.exp(-dt * 3));
        core.pos.lerp(caster.hand, 1 - Math.exp(-dt * 4));
      }
    },
    cam(t) {
      if (core) { const look = caster.hand.clone().addScaledVector(UP, 0.1), yaw = 2.0 + 0.12 * Math.sin(t * 0.25); return { pos: new V3(look.x + Math.cos(yaw) * 1.5, 1.25, look.z + Math.sin(yaw) * 1.5), look, fov: 40, k: 1.6 }; }
      return { pos: new V3(P.x - 4.2, 1.1, P.z + 3.6), look: new V3(P.x, 0.5, P.z), fov: 48, k: 1.6 };
    },
  };

  // ------------------------------------------------------------ runner
  const run = { beat: idle, name: 'idle', t: 0, fired: 0, loop: false, idleLeft: 0, listeners: [] };
  // A beat picked by hand can cut another short: let whatever that beat was driving fade out
  // instead of freezing in place.
  function settle(name) {
    if (ball) { ball.kill(0.3); ball = null; }
    if (name !== 'impact') {
      if (fireball) { fireball.kill(0.6); fireball = null; }
      if (ringFire && ringFire.alive) ringFire.kill(0.8);
      if (pillar) { pillar.kill(0.9); pillar = null; }
      if (pillarLight) { pillarLight.kill(); pillarLight = null; }
      if (baseLight) { baseLight.kill(); baseLight = null; }
    }
    if (name !== 'pillar' && skirt && skirt.alive) { skirt.kill(0.5); skirt = null; }
    if (name !== 'pillar' && wave && wave.alive) wave.kill(0.6);
    if (core && (name === 'pillar' || name === 'impact' || name === 'aftermath')) { core.kill(0.4); core = null; }
  }
  function start(name) {
    const b = name === 'idle' ? idle : BEATS[name];
    settle(name);
    fx.ramp(1, 0.05);
    run.beat = b; run.name = name; run.t = 0; run.fired = 0;
    if (b !== idle) { b.killed = false; b.ringKilled = false; }
    if (b.flameScale) fx.options.flameScale = b.flameScale;
    b.start?.call(b);
    if (b.cut) cam.init = false;   // a new shot: cut instead of swinging the camera across the plain
    for (const fn of run.listeners) fn(name, b);
  }
  function play(name) {
    if (name === 'all') { run.loop = true; start('ignition'); return; }
    run.loop = false; start(name);
  }
  function advance(dt) {
    const b = run.beat;
    run.t += dt;
    while (run.fired < b.events.length && b.events[run.fired][0] <= run.t) b.events[run.fired++][1].call(b);
    b.step.call(b, run.t, dt);
    updateBurning(dt);
    if (run.t >= b.dur) {
      if (run.loop) {
        const i = ORDER.indexOf(run.name);
        if (i >= 0 && i < ORDER.length - 1) start(ORDER[i + 1]);
        else { start('idle'); run.idleLeft = 1.4; }
      } else start('idle');
    } else if (run.name === 'idle' && run.loop && (run.idleLeft -= dt) <= 0) start('ignition');
  }

  // ------------------------------------------------------------ camera rig
  const cam = { pos: new V3(), look: new V3(), fov: 42, init: false };
  function updateCamera(dt) {
    const w = run.beat.cam.call(run.beat, run.t);
    if (!cam.init) { cam.pos.copy(w.pos); cam.look.copy(w.look); cam.fov = w.fov; cam.init = true; }
    const a = 1 - Math.exp(-w.k * dt);
    cam.pos.lerp(w.pos, a); cam.look.lerp(w.look, a); cam.fov += (w.fov - cam.fov) * a;
    cam.pos.y = Math.max(0.2, cam.pos.y);
    // portrait screens see a narrow slice: back the camera off so the effect keeps its frame
    const narrow = camera.aspect < 1 ? Math.pow(1 / camera.aspect, 0.6) : 1;
    camera.position.copy(cam.look).addScaledVector(_v.subVectors(cam.pos, cam.look), narrow);
    camera.position.y = Math.max(0.2, camera.position.y);
    camera.lookAt(cam.look);
    if (Math.abs(camera.fov - cam.fov) > 1e-3) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }
    camera.updateMatrixWorld();
    sky.position.copy(camera.position);
    ground.position.set(Math.round(camera.position.x / 20) * 20, 0, Math.round(camera.position.z / 20) * 20);
  }

  // ------------------------------------------------------------ size and loop
  let width = 0, height = 0;
  const dprCap = Number(params.get('dpr')) || 1.5;   // the flame marches and the smoke are fill-bound
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
  if ('ResizeObserver' in window) new ResizeObserver(() => { dirty = true; }).observe(canvas);
  addEventListener('resize', () => { dirty = true; });
  let dirty = true, paused = false, frozen = false, last = 0, lastTick = 0;
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
    if (frozen) return;
    const dt = last ? (now - last) / 1000 : 1 / 60; last = now;
    if (paused) { if (dirty) { dirty = false; frame(0); } return; }
    frame(dt);
  }
  document.addEventListener('visibilitychange', () => { last = 0; });

  resize();
  fx.warmup();
  start('idle');
  if (reduceMotion || params.has('still')) {
    // A composed still: the pillar at its height. Beats still play on request.
    play('pillar');
    for (let i = 0; i < 170; i++) frame(1 / 60);
    paused = true; dirty = true;
  } else if (!params.has('idle')) play('all');
  frame(1 / 60);
  requestAnimationFrame(loop);
  // If rAF never runs (a hidden tab), still paint a settled frame.
  setInterval(() => { if (!frozen && performance.now() - lastTick > 600) { lastTick = performance.now(); frame(paused ? 0 : 1 / 60); } }, 500);

  window.stage = {
    fx, play, BEATS, ORDER, reduceMotion, camera, caster, ground, sky, groundU, renderer,
    get beat() { return run.name; }, get loop() { return run.loop; }, get time() { return run.t; },
    get paused() { return paused; },
    setPaused(v) { paused = v; last = 0; dirty = true; },
    freeze(v) { frozen = v; },   // for isolated captures: the page stops drawing on its own
    setOption(k, v) { fx.options[k] = v; dirty = true; },
    setTimeScale(v) { fx.timeScale = v; },
    onBeat(fn) { run.listeners.push(fn); },
    // deterministic stepping for captures: stage.step(1/60, n)
    step(dt, n = 1) { for (let i = 0; i < n; i++) frame(dt); },
    redraw() { dirty = true; },
  };
})();
