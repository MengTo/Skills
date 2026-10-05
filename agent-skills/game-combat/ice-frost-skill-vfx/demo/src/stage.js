/* Ice and Frost stage: a snowfield at night, a camera, and the five beats of one frost skill, all
   drawn by src/frost-energy.mjs. There is no character model: the cold blooms in an implied hand,
   drops to the snow and does the rest, so what you see is the effect language alone. */
(() => {
  const THREE = window.THREE;
  const { createFrostEnergy, TNOISE_GLSL, HASH_GLSL, LIGHTS_GLSL, FROST_GLSL, LAYERS } = window.FrostEnergy;
  const V3 = THREE.Vector3;
  const UP = new V3(0, 1, 0);
  const canvas = document.getElementById('stage');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(location.search);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: params.has('capture') });
  renderer.autoClear = false;
  const FOG = new THREE.Color(0.0115, 0.02, 0.036);     // the cold horizon: lighter than the black of the sky above it
  renderer.setClearColor(FOG, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.05, 220);
  const fx = createFrostEnergy(THREE, { renderer, scene, camera, seed: 11 });
  fx.options.shake = 0.6; fx.options.fisheye = 0.65;
  if (reduceMotion) { fx.options.shake = 0; fx.options.fisheye = 0; fx.options.flashes = 'safe'; }
  const L = fx.lightUniforms;

  // ------------------------------------------------------------ sky: night, a faint cold band low toward the moon, far ridges
  const sky = new THREE.Mesh(new THREE.SphereGeometry(120, 48, 24), new THREE.ShaderMaterial({
    uniforms: { uFog: { value: new V3(FOG.r, FOG.g, FOG.b) }, uTime: { value: 0 }, uMoonDir: L.uMoonDir, uSkyLift: { value: 0 }, uSkyDim: { value: 0 }, tNoise: fx.uniforms.tNoise },
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: TNOISE_GLSL + HASH_GLSL + `
      uniform vec3 uFog, uMoonDir; uniform float uTime, uSkyLift, uSkyDim; varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir);
        float h = clamp(d.y, -.2, 1.);
        vec3 col = mix(uFog, vec3(.0006, .0026, .006), smoothstep(-.01, .62, h));
        float m = max(dot(normalize(d.xz), normalize(uMoonDir.xz)), 0.);
        col += vec3(.003, .0055, .011) * exp(-max(h, 0.) * 5.) * m * m;                 // the twilight band on the moon's side
        col += vec3(.0012, .002, .004) * pow(max(dot(d, uMoonDir), 0.), 18.);
        // faint high cloud, barely there, drifting very slowly
        vec2 q = d.xz / (d.y + .25);
        float cl = tn(vec3(q * .9 + uTime * .004, 2.)).x * .5 + .5;
        col += vec3(.0014, .002, .0032) * smoothstep(.55, .85, cl) * smoothstep(.02, .3, h);
        // stars: round points on a grid over the sphere, faint, a few brighter; steady
        vec3 sd3 = d * 300.; vec3 sc3 = floor(sd3); vec4 hs4 = h44(vec4(sc3, 3.1));
        float sdist = length(sd3 - sc3 - .2 - .6 * hs4.xyz);
        float star = step(.978, hs4.w) * exp(-sdist * sdist / .06) * smoothstep(.04, .25, h) * (1. - smoothstep(.55, .85, cl));
        col += vec3(.075, .09, .125) * star * (.3 + .7 * hs4.x * hs4.x);
        vec3 sd5 = d * 520.; vec3 sc5 = floor(sd5); vec4 hs5 = h44(vec4(sc5, 7.7));          // a denser layer of faint ones
        col += vec3(.016, .02, .028) * step(.955, hs5.w) * exp(-dot(sd5 - sc5 - .2 - .6 * hs5.xyz, sd5 - sc5 - .2 - .6 * hs5.xyz) / .06) * smoothstep(.04, .25, h) * (1. - smoothstep(.55, .85, cl));
        // a far forest edge: a soft canopy, gently rolling, its top made of rounded crowns
        if (h < .09 && h > -.05) {
          float az = atan(d.z, d.x);
          float tt = az * 230.; float ti = floor(tt), tf = fract(tt);
          float c1 = h11(ti * .37 + 3.1), c2 = h11(ti * .71 + 9.4);
          float crown = (1. - pow(abs(tf - .5) * 2., 1.6)) * (.0012 + .0028 * c1) + (1. - pow(abs(fract(tt + .5) - .5) * 2., 1.6)) * .0012 * c2;
          float ridge = .039 + .0045 * tn(vec3(az * 1.3, 1., 3.)).x + .002 * tn(vec3(az * 6.5, 2., 7.)).y + crown;
          float aa = fwidth(h) * 1.2 + 1e-5;
          float m = 1. - smoothstep(-aa, aa, h - ridge);
          float k = clamp((ridge - h) / ridge, 0., 1.);
          vec3 rc = mix(vec3(.0075, .0135, .0245), vec3(.0055, .0098, .018), k) * (.9 + .2 * h11(ti * 1.7));
          col = mix(col, rc, m);
        }
        col *= 1. - .3 * uSkyDim;                                         // the blizzard's powder veils the moonlit sky
        col += uSkyLift * vec3(.004, .009, .016) * (1. - smoothstep(0., .6, h));
        gl_FragColor = vec4(col, 1.);
      }`,
    side: THREE.BackSide, depthWrite: false,
  }));
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);

  // ------------------------------------------------------------ the ground: Poly Haven "Snow 02" (Rob Tuytel, CC0), 2 m a tile
  const TILE = 2.0;
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
  const spikeGlow = { value: 0 };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: {
      ...L, ...fx.frost.uniforms, ...fx.obst.uniforms, ...groundU, tNoise: fx.uniforms.tNoise,
      uFog: sky.material.uniforms.uFog, uGlowCol: fx.iceShared.uGlowCol, uSpikeGlow: spikeGlow, uTipCol: { value: new V3(0.7, 0.84, 1.0) },
    },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: TNOISE_GLSL + HASH_GLSL + LIGHTS_GLSL + FROST_GLSL + `
      uniform vec3 uFog, uGlowCol, uTipCol; uniform float uMaps, uSpikeGlow, uObstT, uShatter; uniform vec4 uObstBox;
      uniform sampler2D tDiff, tNor, tArm, tObst; varying vec3 vW;
      vec4 obstAt(vec2 xz){ vec2 uv = (xz - uObstBox.xy) * uObstBox.zw; return (uv.x < 0. || uv.y < 0. || uv.x > 1. || uv.y > 1.) ? vec4(9., 99., 0., 0.) : texture2D(tObst, uv); }

      // The snow's relief, in metres: wind dunes, sastrugi ridged along the wind, and a heaped mound of broken snow
      // along the standing ice. Shading only: the surface the effects rest on stays the plane y = 0.
      const mat2 WR = mat2(.93, .36, -.36, .93);
      float reliefD(vec2 p, float mound, float lod, float dune){
        vec2 q = WR * p;
        float sw = tn(vec3(q * .11, 9.2)).y;                                         // long swells
        float rd = 1. - abs(tn(vec3(q.x * .26, q.y * .5, 1.7)).x);                  // wind dunes with sharp crests, 2-4 m apart
        float rd2 = 1. - abs(tn(vec3(q.x * .62, q.y * 1.1, 5.3)).z);                // sastrugi between them
        float lp = 1. - abs(tn(vec3(q * 2.1, 4.3)).y);
        float c1 = 1. - abs(tn(vec3(q * 1.7 + 2., 11.3)).x), c2 = 1. - abs(tn(vec3(q * 3.6 + 5., 12.7)).y);   // choppy wind-torn crust
        float rd3 = 1. - abs(tn(vec3(q.x * .65, q.y * 1.25, 14.1)).w);                // a second octave breaks the dune spacing
        return (sw * .05 + rd * rd * .13 + rd3 * rd3 * .05 * lod) * dune + rd2 * rd2 * rd2 * .03 * lod + c1 * c1 * c1 * .03 * lod + c2 * c2 * c2 * .012 * lod + lp * lp * .004 * lod + mound;
      }
      float reliefL(vec2 p, float mound, float lod){ return reliefD(p, mound, lod, 1.); }
      float reliefLow(vec2 p, float mound){ return reliefL(p, mound, 1.); }
      float moundAt(vec2 p){ vec4 ob = obstAt(p); float on = step(ob.y, uObstT) * step(0., uObstT) * (1. - .5 * uShatter); return on * .12 * exp(-max(ob.x, 0.) * max(ob.x, 0.) / .09) * (.7 + .3 * ob.z); }
      void main(){
        vec2 p = vW.xz;
        vec2 fwv = fwidth(p); float fw = max(max(fwv.x, fwv.y), 1e-5);
        float dist = length(vW - cameraPosition);
        // the scan, twice at two scales and angles: only its fine grain is kept, never its dark dents
        vec2 uv1 = p / ${TILE.toFixed(1)}, uv2 = mat2(.8, .6, -.6, .8) * p / 2.63 + vec2(.37, .71);
        float bw = smoothstep(.3, .7, tn(vec3(p * .55, 5.7)).x * .5 + .5);
        vec3 dif = mix(vec3(.38), mix(texture2D(tDiff, uv1).rgb, texture2D(tDiff, uv2).rgb, bw), uMaps);
        vec3 n1 = texture2D(tNor, uv1).xyz * 2. - 1., n2 = texture2D(tNor, uv2).xyz * 2. - 1.;
        n2.xy = vec2(.8 * n2.x - .6 * n2.y, .6 * n2.x + .8 * n2.y);
        vec3 nm = mix(vec3(0., 0., 1.), normalize(mix(n1, n2, bw)), uMaps);
        float lum = dot(dif, vec3(.2126, .7152, .0722));
        // relief: an exact finite-difference normal of the height field, the shadow it casts toward the moon
        float mound = moundAt(p);
        float lod = 1. - smoothstep(.012, .05, fw);                        // small relief fades before it can alias into ripple lines
        vec4 obq = obstAt(p);
        float dune = 1. - .65 * step(obq.y, uObstT) * step(0., uObstT) * (1. - smoothstep(1.5, 5., obq.x));   // the eruption broke the dunes into crust
        float h0 = reliefD(p, mound, lod, dune);
        float E = max(.03, fw * 1.5);
        float hx = reliefD(p + vec2(E, 0.), moundAt(p + vec2(E, 0.)), lod, dune), hz = reliefD(p + vec2(0., E), moundAt(p + vec2(0., E)), lod, dune);
        vec3 N = normalize(vec3(-(hx - h0) / E, 1., -(hz - h0) / E));
        // the crust: clumped snow, popcorn domes about 5 and 2 cm across with dark gaps between them, each layer
        // fading once a dome is under three pixels, so nothing turns to per-pixel salt
        // the scan again at a 0.55 m tile: its own sugar-grain and clumps, mip-filtered, so the snow is granular at every
        // distance without per-pixel salt
        vec2 uvg = mat2(.6, -.8, .8, .6) * p / .55 + vec2(.21, .63);
        vec3 ng = texture2D(tNor, uvg).xyz * 2. - 1.;
        float lg = dot(texture2D(tDiff, uvg).rgb, vec3(.2126, .7152, .0722));
        N = normalize(N + vec3(nm.x, 0., nm.y) * .55 + vec3(ng.x, 0., ng.y) * .9 * uMaps);
        float crustAO = 1.;
        vec2 Lxz = normalize(uMoonDir.xz); float tanE = uMoonDir.y / length(uMoonDir.xz);
        float sh = 1.;
        for (int i = 1; i <= 4; i++) {
          float s = float(i * i) * .12;
          float hs = reliefD(p + Lxz * s, i < 3 ? moundAt(p + Lxz * s) : 0., lod, dune);
          sh = min(sh, smoothstep(-.012, .02, h0 + s * tanE - hs));
        }
        float trough = smoothstep(.0, .12, h0);                             // the hollows between dunes get less sky
        // cold blue-white snow, a few percent of the scan's grain and a larger crust variation
        float macro = tn(vec3(p * .21, 1.3)).x * .5 + .5;
        float mid = tn(vec3(p * 4.7, 3.9)).y * .5 + .5;
        vec3 alb = vec3(.68, .84, 1.) * .93 * (.9 + .1 * clamp(lum / .38, .7, 1.2)) * (.9 + .14 * macro) * (.93 + .12 * mid);
        alb *= 1. + mound * 1.2;                                            // broken snow heaped by the ice is fresher
        vec3 V = normalize(cameraPosition - vW);
        // granular grain at about three pixels whatever the distance: two octaves of noise blended by scale, so it
        // never aliases to salt and never smooths out into plastic
        float gsc = log2(max(fw * 3.2, 1e-4)), g0 = floor(gsc), gf = gsc - g0;
        float grA = tn(vec3(p / exp2(g0) * .5, 2.1 + g0)).x, grB = tn(vec3(p / exp2(g0 + 1.) * .5, 2.1 + g0 + 1.)).x;
        float grain = mix(grA, grB, gf);
        alb *= (1. + .14 * grain) * mix(1., .78 + .44 * clamp(lg / .4, .6, 1.3), uMaps);
        float ndl = max(dot(N, uMoonDir), 0.);
        vec3 col = alb * crustAO * (uSkyAmb * (1.25 + .9 * N.y) * (.6 + .4 * trough) + uMoonCol * (ndl * sh * 2.3 + .04));
        col += energyLight(vW, N, V, alb, .93) * .48;
        // glitter: one tilted facet per cell, the cells grown with distance so a glint stays a pixel or two from
        // the foot of the frame to the horizon; tested against the moon and every ice light
        float gm = 0.;
        vec2 jx = dFdx(p), jy = dFdy(p); float jd = jx.x * jy.y - jx.y * jy.x;
        mat2 Jinv = mat2(jy.y, -jx.y, -jy.x, jx.x) / (abs(jd) > 1e-14 ? jd : 1e-14);   // world offset -> pixel offset
        {
          float lv = log2(max(fw * 7. / .012, 1.)), l0 = floor(lv), lf = lv - l0;
          for (int k = 0; k < 2; k++) {
            float cs = .012 * exp2(l0 + float(k));
            vec2 gc = floor(p / cs); vec4 gh = h44(vec4(gc, l0 + float(k), 17.31));
            if (gh.w < .3) continue;
            vec2 ctr = (gc + .2 + gh.xy * .6) * cs;
            vec2 dp = Jinv * (p - ctr);
            float spot = exp(-dot(dp, dp) / 1.3);                               // a soft point two or three pixels across
            vec3 nf = normalize(N + vec3(gh.x - .5, 0., gh.y - .5) * 1.1);
            vec3 Rv = reflect(-V, nf);
            float gl = pow(max(dot(Rv, uMoonDir), 0.), 55.) * 5. * sh * smoothstep(.0, .25, ndl);
            for (int i = 0; i < 8; i++) {
              float e = dot(uLightCol[i], vec3(.33)); if (e < .05) continue;
              vec3 Ld = uLightPos[i] - vW; float d2 = dot(Ld, Ld);
              gl += pow(max(dot(Rv, Ld * inversesqrt(d2)), 0.), 260.) * min(e, 2.) * 1.8 / (1. + d2 * .9);
            }
            gm += gl * spot * (k == 0 ? 1. - lf : lf) * (.5 + gh.z);
          }
          gm *= (1. - .45 * smoothstep(25., 55., dist)) * (1. + .8 * smoothstep(6., 16., dist));
          // the sugar: a dense population of faint glints about a pixel across, one facet every couple of pixels
          float lv2 = log2(max(fw * 2.4 / .004, 1.)), m0 = floor(lv2), mf = lv2 - m0;
          float gf2 = 0.;
          for (int k = 0; k < 2; k++) {
            float cs = .004 * exp2(m0 + float(k));
            vec2 gc = floor(p / cs); vec4 gh = h44(vec4(gc, m0 + float(k), 41.7));
            if (gh.w < .35) continue;
            vec2 dp = Jinv * (p - (gc + .2 + gh.xy * .6) * cs);
            float spot = exp(-dot(dp, dp) / .55);
            vec3 nf = normalize(N + vec3(gh.x - .5, 0., gh.y - .5) * 1.2);
            vec3 Rv = reflect(-V, nf);
            float gl = pow(max(dot(Rv, uMoonDir), 0.), 22.) * .45 * (.4 + .6 * sh);
            for (int i = 0; i < 8; i++) {
              float e = dot(uLightCol[i], vec3(.33)); if (e < .05) continue;
              vec3 Ld = uLightPos[i] - vW; float d2 = dot(Ld, Ld);
              gl += pow(max(dot(Rv, Ld * inversesqrt(d2)), 0.), 30.) * min(e, 2.) * .25 / (1. + d2 * .9);
            }
            gf2 += gl * spot * (k == 0 ? 1. - mf : mf) * (.4 + gh.z);
          }
          gm += gf2 * (1. - .6 * smoothstep(15., 40., dist));
        }
        float blueGlint = step(.78, h12(floor(p / .03) + 7.7));
        col += mix(vec3(.82, .9, 1.), vec3(.45, .66, 1.), blueGlint) * gm;
        // the ice standing in it: its foot shadows the snow, its light leaks into it
        vec4 ob = obstAt(p);
        float on = step(ob.y, uObstT) * step(0., uObstT);
        float near = exp(-max(ob.x, 0.) / .07) * on;
        col *= 1. - .3 * near * (1. - .6 * uShatter);
        col += uGlowCol * alb * uSpikeGlow * on * (exp(-max(ob.x, 0.) / .5) * .2 + near * .25) * (.7 + .6 * ndl + .3 * N.y);
        // frost: hairline feathers, their rime, their glints, the fresh growth glowing and its tip blazing
        Frost F = frostAt(p, fw);
        // the frost beside a pixel, toward the moon, shades it: the needles stand off the snow
        float fsh = frostCover(p + Lxz * .006, fw) * (1. - frostCover(p, fw));
        col *= 1. - .45 * fsh;
        if (F.on > 0. || F.rime > 0. || F.crust > 0.) {
          float cover = clamp(F.line + F.micro * .8, 0., 1.);
          vec3 Lf = uSkyAmb * 3.4 + uMoonCol * (max(dot(N, uMoonDir), 0.) * .8 + .45) + lightsAt(vW + vec3(0., .05, 0.)) * .55;
          vec3 frostLit = vec3(.86, .93, 1.) * Lf * 2.95;
          // every crystal is a little facet: about one in three mirrors the moon or an ice light into the lens
          vec2 cc = vec2(floor(F.along / .0022), floor(F.dc / .0016) + F.sd * 53.);
          vec3 ch = h32(cc + F.lv * 7.);
          vec3 nf = normalize(vec3(ch.x - .5, .55, ch.y - .5));
          vec3 Rv = reflect(-V, nf);
          float fg = pow(max(dot(Rv, uMoonDir), 0.), 70.) * 5.;
          for (int i = 0; i < 8; i++) {
            float e = dot(uLightCol[i], vec3(.33)); if (e < .05) continue;
            vec3 Ld = uLightPos[i] - vW; float d2 = dot(Ld, Ld);
            fg += pow(max(dot(Rv, Ld * inversesqrt(d2)), 0.), 60.) * e * 3. / (1. + d2 * .5);
          }
          fg *= step(.62, ch.z) * (1. - smoothstep(.008, .03, fw));
          // the heap where it landed: a tangle of short needles at every angle, two layers deep
          float tangle = 0.;
          if (F.crust > .01) {
            for (int L2 = 0; L2 < 3; L2++) {
              float cs2 = L2 == 0 ? .008 : L2 == 1 ? .0055 : .004;
              vec2 q2 = p / cs2 + float(L2) * 17.3, i2 = floor(q2);
              for (int oy = 0; oy <= 1; oy++) for (int ox = 0; ox <= 1; ox++) {
                vec2 ci = i2 + vec2(ox, oy) - .5 + step(.5, fract(q2)) - .5;
                ci = floor(ci + .5);
                vec3 hh = h32(ci + float(L2) * 9.1);
                vec2 c0 = (ci + hh.xy) * cs2; float an = hh.z * 6.2832;
                vec2 dir = vec2(cos(an), sin(an)), dd = p - c0;
                float al = clamp(dot(dd, dir), -cs2 * .75, cs2 * .75);
                tangle = max(tangle, lineCover(length(dd - dir * al), .00035 + .0003 * hh.x, fw));
              }
            }
            tangle *= smoothstep(.05, .5, F.crust);
          }
          col = mix(col, frostLit * .8, clamp(F.rime * .45 + F.crust * .22, 0., .6));
          col = mix(col, frostLit * 1.25 * (.75 + .5 * h12(floor(p / .004))), tangle);
          col = mix(col, frostLit * (1.15 + .8 * F.ridge) * (.8 + .4 * ch.z), cover);
          col += mix(vec3(.85, .93, 1.), vec3(.5, .7, 1.), step(.9, ch.z)) * fg * (cover + F.micro * .6 + tangle);
          col += uGlowCol * uFrostGlow * F.fresh * (cover * 1.1 + F.rime * .35);
          col += uTipCol * F.tip * 3.5;
        }
        float d = length(vW.xz - cameraPosition.xz);
        col = mix(col, uFog, 1. - exp(-d * .045));
        gl_FragColor = vec4(col, 1.);
      }`,
  }));
  ground.frustumCulled = false;
  scene.add(ground);

  // ------------------------------------------------------------ the implied caster and the frost field
  const caster = { base: new V3(0, 0, 0), facing: new V3(1, 0, 0), side: new V3(0, 0, -1) };
  const hand = new V3(0.42, 1.16, -0.2);
  const ORIGIN = new V3(1.05, 0, -0.08);
  fx.growFrostField({ origin: ORIGIN, dir: caster.facing, radius: 5.6, area: [-3.0, -4.8, 7.6, 4.8], seed: 7 });
  const FD = fx.frost.data;

  // ice spikes along the spine of the frost: clusters that grow taller the further out they stand
  const clusters = [];
  {
    const rng = (() => { let s = 777; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    const RR = (a, b) => a + (b - a) * rng();
    const S_AT = [0.95, 1.65, 2.35, 3.1, 3.9, 4.7, 5.45];
    let sid = 1;
    S_AT.forEach((s, ci) => {
      const sp = fx.spineAt(s);
      const dir = new V3(Math.cos(sp.dir), 0, Math.sin(sp.dir));
      const side = new V3().crossVectors(UP, dir).normalize();
      const k = ci / (S_AT.length - 1);
      const h = 0.55 + 1.45 * Math.pow(k, 0.9) * RR(0.92, 1.06), r = 0.035 + 0.075 * h;
      const base = new V3(sp.x, 0, sp.z);
      const erupt = 0.25 + s / 5.2;
      const lean = new V3().copy(UP).addScaledVector(dir, Math.tan(RR(0.16, 0.34))).addScaledVector(side, Math.tan(RR(-0.12, 0.12))).normalize();
      const C = { s, base, h, r, erupt, dir, side, spikes: [] };
      C.spikes.push(fx.createSpike({ base, axis: lean, height: h, radius: r, seed: sid++, erupt, rise: 0.2 + 0.06 * h }));
      // satellites: smaller shards around the foot, leaning out from it, clear of the main spike
      const nSat = 1 + Math.floor(RR(0, 2.6));
      const used = [];
      for (let j = 0; j < nSat; j++) {
        let a; let tries = 0;
        do { a = RR(-Math.PI, Math.PI); tries++; } while (tries < 20 && used.some((b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) < 1.1));
        used.push(a);
        const hs = h * RR(0.32, 0.6), rs = 0.028 + 0.075 * hs;
        const off = (r + rs) * RR(1.35, 1.7);
        const out = new V3().addScaledVector(dir, Math.cos(a)).addScaledVector(side, Math.sin(a));
        const b = base.clone().addScaledVector(out, off);
        const ax = new V3().copy(UP).addScaledVector(out, Math.tan(RR(0.38, 0.62))).addScaledVector(dir, 0.15).normalize();
        C.spikes.push(fx.createSpike({ base: b, axis: ax, height: hs, radius: rs, seed: sid++, erupt: erupt + RR(0.04, 0.11), rise: 0.16 + 0.05 * hs }));
      }
      clusters.push(C);
    });
  }
  fx.buildObstacles();
  const ALL = clusters.flatMap((c) => c.spikes);
  const mid = clusters[3].base.clone();
  const far = clusters[clusters.length - 1].base.clone();

  // ------------------------------------------------------------ helpers
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const easeIn = (x) => Math.pow(Math.min(1, Math.max(0, x)), 3);
  const rnd = (() => { let s = 4242; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const R = (a, b) => a + (b - a) * rnd();
  const _v = new V3(), _w = new V3(), _x = new V3();
  const world = { frostOn: false, melt: 0, fragFade: 1, fragOut: 0, mistWant: 0.12, spikeGlowWant: 0, cycle: 0 };
  // world state that beats ease toward
  function startFrost() { fx.frost.t = 0; fx.frost.speed = 1; fx.frost.fade = 1; fx.frost.glow = 1; world.frostOn = true; }
  function frostGrown() { return fx.frost.t >= FD.duration; }
  function ensureFrost(fast = 4) { if (fx.frost.t < 0) startFrost(); if (!frostGrown()) fx.frost.speed = fast; }
  function ensureSpikes() { if (fx.state.spikeT < 0) { fx.state.spikeT = 0; for (const S of ALL) S.fired = false; } }
  function landBurst(p) {
    fx.flashLight(6, _v.copy(p).setY(0.3), 2.2, 5);
    fx.ring(p.clone().setY(0.02), UP, { radius: 2.4, thick: 0.06, life: 0.42, amp: 0.02 });
    for (let k = 0; k < 10; k++) { const a = R(0, 6.28); fx.spawnWisp(1, _v.set(p.x + Math.cos(a) * 0.1, 0.06, p.z + Math.sin(a) * 0.1), _w.set(Math.cos(a), 0.15, Math.sin(a)).multiplyScalar(R(0.5, 1.4)), { size: R(0.12, 0.24), grow: 3, life: R(1.0, 1.7), opacity: 0.4, drag: 1.6 }); }
    for (let k = 0; k < 26; k++) fx.spawnMote(1, _v.copy(p).add(_w.set(R(-0.15, 0.15), R(0.02, 0.2), R(-0.15, 0.15))), _w.set(R(-0.6, 0.6), R(0.3, 1.4), R(-0.6, 0.6)), { life: R(1.5, 3), size: R(0.002, 0.0035), gravity: 0.03, drag: 1.4, wind: 0.6 });
  }
  function eruptFx(C, S, big) {
    const top = S.base.clone().addScaledVector(S.axis, S.height * 0.4);
    fx.flashLight(6, top, big ? 5 : 3, 5.5);
    fx.spawnChunks(S.base.clone().setY(0.04), { count: Math.round(6 + S.height * 8), speed: [0.4, 1.1 + 0.5 * S.height], size: [0.016, 0.045 + 0.025 * S.height], life: [11, 15] });
    fx.spawnChunks(S.base.clone().setY(0.06), { count: Math.round(5 + S.height * 6), speed: [0.4, 1.4], size: [0.012, 0.03 + 0.015 * S.height], chips: true, life: [11, 15] });
    for (let k = 0; k < 3 + S.height * 3; k++) { const a = R(0, 6.28); fx.spawnWisp(1, _v.set(S.base.x + Math.cos(a) * S.radius, R(0.05, 0.2), S.base.z + Math.sin(a) * S.radius), _w.set(Math.cos(a), R(0.3, 0.9), Math.sin(a)).multiplyScalar(R(0.6, 1.8)), { size: R(0.15, 0.32) * (0.6 + S.height * 0.4), grow: 2.6, life: R(1.1, 2.0), opacity: 0.45, drag: 1.8, gravity: 0.02 }); }
    for (let k = 0; k < 10 + S.height * 10; k++) fx.spawnMote(1, _v.copy(S.base).add(_w.set(R(-0.2, 0.2), R(0.05, S.height), R(-0.2, 0.2))), _w.set(R(-0.5, 0.5), R(0.2, 1.0), R(-0.5, 0.5)), { life: R(2, 4), size: R(0.0018, 0.0032), gravity: 0.02, drag: 1.5, wind: 0.7 });
    fx.ring(S.base.clone().setY(0.03), UP, { radius: 1.2 + S.height, thick: 0.05, life: 0.32, amp: 0.016 });
    if (big) fx.impact({ hold: 0.06, frame: 'center', shake: 0.012, shakeMode: 'axial', at: top });
    else if (S === C.spikes[0] && S.height > 0.9) fx.impact({ hold: 0, frame: 'none', shake: 0.004 + 0.003 * S.height });
  }

  // ------------------------------------------------------------ beats
  // Each beat: dur (sim seconds), start(), events [[t, fn]], step(t, dt), cam(t) -> {pos, look, fov, k}
  const at = (a, b, c) => new V3().copy(caster.base).addScaledVector(caster.facing, a).addScaledVector(UP, b).addScaledVector(caster.side, c);
  const bloomQ = new THREE.Quaternion();
  function creepPose(u) {
    return {
      pos: new V3().copy(ORIGIN).addScaledVector(caster.facing, -1.25 - 0.9 * u).addScaledVector(caster.side, -0.8 - 2.2 * u).addScaledVector(UP, 0.55 + 1.9 * u),
      look: new V3().copy(ORIGIN).addScaledVector(caster.facing, 1.6 + 0.6 * u).addScaledVector(UP, 0.05),
    };
  }
  const BEATS = {
    chill: {
      title: 'Chill', caption: 'Frost blooms in the hand', dur: 3.6,
      start() {
        const B = fx.bloom; B.group.visible = true; B.t = -0.3; B.fade = 0; this.dropped = false; this.landed = false; fx.setBanks([]);
        world.mistWant = 0.14;
      },
      events: [
        [3.32, () => { BEATS.chill.landed = true; landBurst(ORIGIN); startFrost(); fx.impact({ hold: 0.04, frame: 'none', shake: 0.006 }); }],
      ],
      step(t, dt) {
        const B = fx.bloom;
        B.t = t - 0.3;
        const drop = smooth(2.82, 3.32, t);
        const pulse = 1 - 0.28 * smooth(2.45, 2.85, t) * (1 - drop);
        const s = 0.135 * (0.7 + 0.3 * smooth(0.2, 1.6, t)) * pulse * (1 - 0.75 * drop);
        // the flake lies in the palm, turned up toward the face; it turns slowly and catches the light
        _v.copy(hand).lerp(ORIGIN, easeIn(drop)).y = hand.y + (0.02 - hand.y) * easeIn(drop);
        B.group.position.copy(_v);
        bloomQ.setFromUnitVectors(new V3(0, 0, 1), _w.set(0.18, 0.9, 0.38).normalize());
        B.group.quaternion.copy(bloomQ).multiply(new THREE.Quaternion().setFromAxisAngle(new V3(0, 0, 1), 0.35 + t * 0.22));
        B.group.scale.setScalar(s);
        B.fade = smooth(0, 0.35, t) * (1 - smooth(3.2, 3.34, t));
        B.mat.uniforms.uGlint.value = 1.2 * Math.pow(Math.max(0, Math.sin(t * 1.7 + 0.6)), 6) + 1.4 * smooth(2.45, 2.85, t);
        if (t > 3.36) B.group.visible = false;
        fx.setLight(0, B.group.position, (0.35 + 2.2 * smooth(0.2, 1.8, t)) * (1 + 0.5 * smooth(2.4, 2.85, t)) * (1 - drop * 0.6), { rate: 5 });
        if (dt > 0) {
          // cold breath pours off the palm, curls and sinks
          if (t < 3.0 && rnd() < dt * (4 + 6 * smooth(0.4, 2, t))) {
            fx.spawnWisp(0, _v.copy(B.group.position).add(_w.set(R(-0.04, 0.04), R(-0.03, 0.01), R(-0.04, 0.04))), _w.set(R(-0.08, 0.08), R(-0.2, -0.05), R(-0.08, 0.08)), { size: R(0.04, 0.07), grow: 3.2, life: R(1.8, 2.6), opacity: R(0.22, 0.32), drag: 1.4, gravity: 0.004, wind: 0.5 });
          }
          if (rnd() < dt * 14) {
            const a = R(0, 6.28), rr = R(0.18, 0.5);
            fx.spawnMote(1, _v.copy(hand).add(_w.set(Math.cos(a) * rr, R(-0.25, 0.25), Math.sin(a) * rr)), _w.set(-Math.sin(a) * 0.15, R(-0.05, 0.08), Math.cos(a) * 0.15), { life: R(1.4, 2.4), size: R(0.0016, 0.0028), gravity: 0.004, drag: 0.6, wind: 0.2 });
          }
          if (drop > 0 && drop < 1 && rnd() < dt * 40) fx.spawnWisp(0, B.group.position, _w.set(R(-0.1, 0.1), R(0.1, 0.3), R(-0.1, 0.1)), { size: R(0.04, 0.07), grow: 3, life: R(0.8, 1.3), opacity: 0.3, drag: 2 });
        }
      },
      cam(t) {
        // close on the palm, then easing back to where the creep's shot begins as the cold drops
        // close on the palm; then back far enough to hold the hand and the snow it drops to; then the creep's view
        const mid = new V3().lerpVectors(hand, ORIGIN, 0.5);
        const A = { pos: new V3().copy(hand).addScaledVector(caster.facing, 0.3 + 0.12 * smooth(0, 2.4, t)).addScaledVector(caster.side, -0.34 - 0.12 * smooth(0, 2.4, t)).addScaledVector(UP, -0.02), look: new V3().copy(hand).addScaledVector(UP, 0.02) };
        const Bp = { pos: mid.clone().addScaledVector(caster.side, -1.85).addScaledVector(caster.facing, -0.85).addScaledVector(UP, 0.15), look: mid.clone() };
        const C = creepPose(0);
        const u = smooth(2.25, 2.95, t), w = smooth(3.3, 3.6, t);
        const pos = A.pos.lerp(Bp.pos, u).lerp(C.pos, w), look = A.look.lerp(Bp.look, u).lerp(C.look, w);
        return { pos, look, fov: 42 + 6 * Math.max(u, w), k: 3.5 };
      },
    },

    creep: {
      title: 'Frost creep', caption: 'It races out across the snow', dur: 4.4,
      start() {
        if (fx.frost.t < 0) { startFrost(); landBurst(ORIGIN); } world.mistWant = 0.1;
        // banks lying where the target shot has them, wind blowing to the right and a little away
        fx.setBanks([
          { id: 'cfar', c: new V3(22.5, 0.4, 1.8), ra: 6.5, rc: 3.0, hb: 0.85, ang: 1.28, dens: 0.75 },
          { id: 'cmid', c: new V3(4.1, 0.2, -2.9), ra: 2.8, rc: 0.8, hb: 0.36, ang: 0.6, dens: 0.8 },
          { id: 'ctip', c: new V3(7.9, 0.34, 0.9), ra: 2.0, rc: 0.38, hb: 0.36, ang: 0.785, dens: 3.0 },
          { id: 'cright', c: new V3(11.5, 0.2, 3.6), ra: 3.2, rc: 1.1, hb: 0.35, ang: 1.28, dens: 0.4 },
        ]);
      },
      events: [],
      step(t, dt) {
        const ft = fx.frost.t;
        const live = 1 - smooth(FD.duration * 0.8, FD.duration + 0.6, ft);
        if (fx.stemTip(FD.spine, ft, _v)) fx.setLight(1, _v.setY(0.2), 0.9 * live * smooth(0, 0.2, ft), { rate: 6 });
        const p2 = FD.paths[2] && FD.paths[2].length ? FD.paths[2] : FD.paths[1];
        if (fx.stemTip(p2, ft, _w)) fx.setLight(2, _w.setY(0.2), 0.6 * live * smooth(0, 0.2, ft), { rate: 6 });
        if (dt > 0 && live > 0.05) {
          // the front kicks up a few glinting crystals as it passes
          for (const path of FD.paths) {
            if (rnd() > dt * 7) continue;
            if (!fx.stemTip(path, ft, _x)) continue;
            if (ft > path[path.length - 1][2]) continue;
            fx.spawnMote(1, _x.setY(R(0.01, 0.06)), _w.set(R(-0.2, 0.2), R(0.15, 0.5), R(-0.2, 0.2)), { life: R(1.5, 3), size: R(0.0016, 0.003), gravity: 0.015, drag: 1.2, wind: 0.6 });
          }
        }
      },
      cam(t) { const P = creepPose(smooth(0.4, 4.2, t)); return { pos: P.pos, look: P.look, fov: 50 - 4 * smooth(0.4, 4.2, t), k: 3.5 }; },
    },

    spikes: {
      title: 'Ice spikes', caption: 'Ice erupts along the frost lines', dur: 4.0,
      start() {
        ensureFrost(); world.mistWant = 0.14; world.spikeGlowWant = 1;
        fx.setBanks([
          { id: 'sb1', c: new V3(2.7, 0.2, -0.3), ra: 1.7, rc: 0.5, hb: 0.36, ang: 0.35, dens: 1.5 },
          { id: 'sb2', c: new V3(4.6, 0.16, 0.15), ra: 1.4, rc: 0.45, hb: 0.3, ang: 0.3, dens: 0.9 },
          { id: 'splume', c: new V3(8.0, 0.22, 0.7), ra: 2.5, rc: 0.6, hb: 0.42, ang: 0.15, dens: 1.4 },
        ]);
        const standing = fx.state.spikeT > 0 && !ALL[0].shattered;
        this.sink = standing ? Math.min(fx.state.spikeT, Math.max(...ALL.map((S) => S.erupt + S.rise))) : 0;
        if (standing) fx.state.spikeT = this.sink;
        if (fx.frags.length) world.fragOut = 0.6;              // last cast's pieces melt away rather than vanish
        if (!standing) { fx.resetIce(true); fx.state.spikeT = 0; for (const S of ALL) S.fired = false; }
      },
      events: [],
      step(t, dt) {
        if (this.sink > 0 && dt > 0) {
          // the standing ice runs its rise backwards into the snow, then the new eruption starts from zero
          fx.state.spikeT = Math.max(0, fx.state.spikeT - dt * 4.5 - dt);
          if (fx.state.spikeT <= 0) { this.sink = 0; fx.resetIce(true); for (const S of ALL) S.fired = false; }
        }
      },
      cam(t) {
        const u = smooth(0.2, 3.8, t);
        const look = new V3().copy(mid).addScaledVector(caster.facing, -0.4 + 0.9 * u).addScaledVector(UP, 0.55);
        const pos = new V3().copy(mid).addScaledVector(caster.side, -4.4 + 0.6 * u).addScaledVector(caster.facing, -1.9 + 0.5 * u).addScaledVector(UP, 1.15 - 0.15 * u);
        return { pos, look, fov: 48, k: 3 };
      },
    },

    vortex: {
      title: 'Blizzard', caption: 'Wind-carried snow spirals, then calm', dur: 5.0,
      start() {
        ensureFrost(); ensureSpikes(); world.mistWant = 0.15; world.spikeGlowWant = 1;
        fx.setBanks([
          { id: 'vbase', c: new V3(4.8, 0.2, -0.75), ra: 2.9, rc: 0.6, hb: 0.36, ang: -0.285, dens: 1.0 },
          { id: 'vplL', c: new V3(2.3, 0.45, -0.3), ra: 1.3, rc: 0.9, hb: 0.65, ang: -0.285, dens: 5.5 },
          { id: 'vplR', c: new V3(6.7, 0.38, -1.3), ra: 1.2, rc: 0.8, hb: 0.55, ang: -0.285, dens: 4.0 },
          { id: 'vleft', c: new V3(-1.7, 0.2, -1.5), ra: 3.2, rc: 1.4, hb: 0.38, ang: -2.2, dens: 1.2 },
        ]);
        const V = fx.wind.vortex; V.center.copy(mid).addScaledVector(caster.facing, 0.3); V.radius = 0.75; V.height = 3.8;
        V.sDir.set(0.86, 0, -0.51); V.sAmp = 0.22;                     // the S: leans left mid-height, flares right at the top
      },
      events: [],
      step(t, dt) {
        const V = fx.wind.vortex;
        const k = smooth(0.1, 1.3, t) * (1 - smooth(3.2, 4.8, t));
        V.on = k; V.swirl = 5.2; V.inflow = 2.1; V.lift = 3.2; V.outflow = 0.4; V.veil = 1; V.phase = t * 2.4;
        if (dt <= 0 || k <= 0.001) return;
        const ring = (rMin, rMax, y) => { const a = R(0, 6.28), rr = R(rMin, rMax); fx.vortexAxis(y, _x); return _v.set(_x.x + Math.cos(a) * rr, y, _x.z + Math.sin(a) * rr); };
        const H = V.height;
        // a few hairlines still trace the wind inside the column
        let ns = Math.floor(dt * 30 * k + rnd());
        while (ns-- > 0) {
          const y = 0.3 + (H - 0.9) * Math.pow(rnd(), 0.8), rc = fx.coreAt(y), band = Math.floor(rnd() * 3);
          const a = band * 2.094 + t * 2.4 + y * 1.7 + R(-0.25, 0.25), rr = rc * R(0.65, 0.95);
          fx.vortexAxis(y, _x); _v.set(_x.x + Math.cos(a) * rr, y, _x.z + Math.sin(a) * rr);
          fx.spawnStreamer(_v, { life: R(0.6, 1.1), width: R(0.003, 0.008), opacity: R(0.06, 0.16) });
        }
        // the rope: thousands of fine powder specks on three strands that twist up the column, plus some lifted
        // off the snow at the foot and some scattered through the body
        let n = Math.floor(11000 * k * dt + rnd());
        while (n-- > 0) {
          const pick = rnd();
          if (pick < 0.12) ring(0.25, 1.6, R(0.01, 0.1));
          else if (pick < 0.9) {
            const y = 0.1 + (H - 0.1) * Math.pow(rnd(), 0.9), rc = fx.coreAt(y), band = Math.floor(rnd() * 5);
            const a = band * 1.2566 + t * 2.4 + y * 1.7 + (rnd() - 0.5) * (rnd() - 0.5) * 0.7, rr = rc * (0.78 + (rnd() - 0.5) * 0.14);
            fx.vortexAxis(y, _x); _v.set(_x.x + Math.cos(a) * rr, y, _x.z + Math.sin(a) * rr);
          } else { const y = R(0.2, H); ring(0, 1.1 * fx.coreAt(y), y); }
          fx.windAt(_v.x, _v.y, _v.z, _w);
          const flake = rnd() < 0.9;
          fx.spawnMote(flake ? 0 : 1, _v, _w, { life: R(0.45, 0.9), size: flake ? R(0.0028, 0.0048) : R(0.0018, 0.003), gravity: flake ? 0.03 : 0.02, drag: R(3.2, 4.4), wind: 1, bright: flake ? (0.5 + 3.4 * Math.pow(rnd(), 4)) * (1 + 0.8 * Math.exp(-_v.y / 0.9)) : 1.6, column: true, soft: flake });
        }
        // ice flakes: chipped, tumbling, glinting, carried up the column and dropping off its rim
        let nf = Math.floor(16 * k * dt + rnd());
        while (nf-- > 0) {
          const y = R(0.3, H * 0.95), a = R(0, 6.28), rr = fx.coreAt(y) * R(0.7, 1.15);
          fx.vortexAxis(y, _x); _v.set(_x.x + Math.cos(a) * rr, y, _x.z + Math.sin(a) * rr);
          fx.windAt(_v.x, _v.y, _v.z, _w);
          fx.spawnMote(3, _v, _w, { life: R(0.6, 1.1), size: R(0.008, 0.02), gravity: 0.15, drag: 1.6, wind: 0.85, bright: 1.4, column: true });
        }
        // now and then a long thin straight streak: a flake caught in a gust across the lower column
        if (rnd() < dt * 1.6 * k) {
          const y = R(0.6, 1.7); fx.vortexAxis(y, _x);
          const a = R(0, 6.28), sp = R(9, 13);
          _v.set(_x.x + Math.cos(a) * 0.6, y, _x.z + Math.sin(a) * 0.6);
          _w.set(-Math.sin(a) * sp, R(1.5, 3.5), Math.cos(a) * sp);
          fx.spawnMote(4, _v, _w, { life: R(0.2, 0.32), size: 0.0025, gravity: 0, drag: 0.2, wind: 0, bright: R(0.5, 0.9) });
        }
        // spray plumes at both ends of the spike row: powder bursting up and rolling outward
        let np = Math.floor(dt * 110 * k + rnd());
        while (np-- > 0) {
          const left = rnd() < 0.58, C = left ? clusters[Math.floor(rnd() * 2)] : clusters[5 + Math.floor(rnd() * 2)];
          _v.copy(C.base).add(_w.set(R(-0.6, 0.6), R(0.03, 0.2), R(-0.6, 0.6)));
          if (rnd() < 0.5) fx.spawnWisp(1, _v, _w.set(R(-0.9, 0.9), R(0.6, 1.5), R(-0.9, 0.9)), { size: R(0.22, 0.45), grow: 2.4, life: R(1.0, 1.7), opacity: R(0.16, 0.26), drag: 1.8, wind: 0.5 });
          if (rnd() < 0.6) fx.spawnMote(0, _v, _w.set(R(-0.8, 0.8), R(1.5, 3.2), R(-0.8, 0.8)), { life: R(0.6, 1.1), size: 0.003, gravity: 0.5, drag: 1.8, wind: 0.3, bright: 1.8, soft: true });
        }
        // spray: powder bursting up round the spikes at the foot, and spindrift dragged along the snow toward it
        let nw = Math.floor(dt * 46 * k + rnd());
        while (nw-- > 0) {
          if (rnd() < 0.45) {
            const C = clusters[1 + Math.floor(rnd() * (clusters.length - 2))];
            _v.copy(C.base).add(_w.set(R(-0.3, 0.3), R(0.03, 0.12), R(-0.3, 0.3)));
            fx.spawnWisp(1, _v, _w.set(R(-0.4, 0.4), R(1.2, 2.4), R(-0.4, 0.4)), { size: R(0.12, 0.26), grow: 2.4, life: R(0.9, 1.5), opacity: R(0.22, 0.36), drag: 2.6, wind: 0.6 });
          } else {
            ring(0.45, 2.4, R(0.04, 0.22)); fx.windAt(_v.x, _v.y, _v.z, _w);
            fx.spawnWisp(1, _v, _w, { size: R(0.14, 0.3), grow: 2.0, life: R(1.0, 1.8), opacity: R(0.12, 0.22), drag: 1.8, wind: 1, stretch: 2.4 });
          }
        }
      },
      cam(t) {
        // back far enough to hold the whole column, centred on its foot's lean (not the S), orbiting slowly
        const V = fx.wind.vortex, yaw = 1.25 - 0.45 * smooth(0, 5, t);
        const c = new V3(V.center.x + 0.186, 1.55, V.center.z - 0.0775);   // the framing the shot was built on
        const pos = c.clone().add(new V3(Math.cos(yaw) * 7.0, 0.05 - 0.1 * smooth(0, 5, t), Math.sin(yaw) * 7.0));
        return { pos, look: c, fov: 46, k: 2.4 };
      },
    },

    shatter: {
      title: 'Shatter', caption: 'The spikes crack and burst', dur: 5.6,
      start() {
        const lastErupt = Math.max(...ALL.map((S) => S.erupt + S.rise));
        const standing = fx.state.spikeT >= lastErupt && !ALL[0].shattered;
        if (!standing) { if (fx.frags.length) world.fragOut = 0.6; fx.resetIce(true); fx.state.spikeT = 0; for (const S of ALL) S.fired = false; world.spikeGlowWant = 1; }
        this.off = standing ? 0 : lastErupt + 0.5;               // played cold: the ice rises first, then this beat runs
        this.dur = 5.6 + this.off;
        ensureFrost(); world.mistWant = 0.5;
        fx.setBanks([
          { id: 'sb1', c: new V3(2.6, 0.22, -0.35), ra: 1.4, rc: 0.45, hb: 0.42, ang: 0.35, dens: 0.7 },
          { id: 'splume', c: new V3(7.7, 0.38, 0.75), ra: 2.3, rc: 0.5, hb: 0.42, ang: 0.15, dens: 0.6 },
        ]);
        // cracks run near to far, each spike's in turn: across the shaft, then down its length
        clusters.forEach((C, ci) => C.spikes.forEach((S, si) => {
          const d0 = this.off + 0.12 + ci * 0.1 + si * 0.05;
          [0, 0.16, 0.3, 0.42].forEach((dd, k) => fx.crackSpike(S, k, d0 + dd, 0.32 + 0.12 * S.height));
        }));
        this.burst = false; this.ramped = false;
      },
      events: [],
      burstNow() {
        {
          const c = mid.clone().addScaledVector(UP, 0.7);
          fx.impact({ hold: 0.1, frame: 'full', flash: 0, shake: 0.02, shakeMode: 'axial', at: c });
          clusters.forEach((C, ci) => {
            for (const S of C.spikes) {
              fx.shatterSpike(S, C.base, 0.75 + 0.35 * S.height);
              const top = S.base.clone().addScaledVector(S.axis, S.height * 0.5);
              fx.spawnChunks(top, { count: Math.round(6 + 10 * S.height), speed: [1.5, 4.5], size: [0.006, 0.016 + 0.01 * S.height], chips: true, glow: 0.6 });
              for (let k = 0; k < 30 + 40 * S.height; k++) fx.spawnMote(1, _v.copy(S.base).add(_w.set(R(-0.25, 0.25), R(0.05, S.height * 1.1), R(-0.25, 0.25))), _w.set(R(-1.4, 1.4), R(0.2, 2.2), R(-1.4, 1.4)), { life: R(3, 5.5), size: R(0.0016, 0.0034), gravity: 0.012, drag: 1.6, wind: 0.6 });
              for (let k = 0; k < 4 + S.height * 4; k++) fx.spawnWisp(1, _v.copy(S.base).add(_w.set(R(-0.2, 0.2), R(0.1, S.height * 0.8), R(-0.2, 0.2))), _w.set(R(-1, 1), R(0.2, 0.8), R(-1, 1)), { size: R(0.2, 0.4) * (0.6 + S.height * 0.4), grow: 2.6, life: R(1.2, 2.2), opacity: 0.3, drag: 1.8 });
            }
            fx.ring(C.base.clone().setY(0.4), _v.copy(camera.position).sub(C.base).normalize(), { radius: 1.6 + C.h, thick: 0.06, life: 0.36, delay: ci * 0.03, amp: 0.022 });
          });
          fx.flashLight(7, c, 6, 3.4, new THREE.Color(0.75, 0.9, 1.0));
          world.spikeGlowWant = 0;
        }
      },
      step(t, dt) {
        t -= this.off;
        // the cracking runs in slow motion, the burst snaps back to speed
        if (t > 0.05 && !this.ramped) { this.ramped = true; fx.ramp(0.55, 0.35); }
        if (t >= 1.42 && !this.burst) { this.burst = true; fx.ramp(1, 0.05); this.burstNow(); }
        for (const S of ALL) S.lightBoost = 1.4 * smooth(0.1, 1.4, t) * (t < 1.42 ? 1 : 0);
        if (dt > 0 && t > 1.6 && t < 4.6 && rnd() < dt * 70) {
          // diamond dust: the air is full of ice that glints as it settles
          const C = clusters[Math.floor(rnd() * clusters.length)];
          fx.spawnMote(1, _v.copy(C.base).add(_w.set(R(-1.4, 1.4), R(0.3, 2.4), R(-1.4, 1.4))), _w.set(R(-0.08, 0.08), R(-0.12, -0.03), R(-0.08, 0.08)), { life: R(3, 5), size: R(0.0022, 0.004), gravity: 0.002, drag: 2.5, wind: 0.25, bright: 1.6 });
        }
        if (dt > 0 && t > 0.1 && t < 1.42) {
          // fine ice dust breaks loose where the cracks reach the surface
          for (const S of ALL) for (let k = 0; k < 4; k++) {
            const c = S.crackT[k]; if (c < 0 || c > 0.3 || rnd() > dt * 18) continue;
            const o = S.cracks[k].origin; _v.copy(o).applyQuaternion(S.mesh.quaternion).add(S.mesh.position);
            fx.spawnMote(1, _v, _w.set(R(-0.3, 0.3), R(0, 0.4), R(-0.3, 0.3)), { life: R(0.8, 1.6), size: R(0.0015, 0.0025), gravity: 0.03, drag: 2 });
          }
        }
      },
      cam(t) {
        t -= this.off || 0;
        if (t < -0.2) return BEATS.spikes.cam(t + this.off);
        const tgt = clusters[4].base.clone();
        if (t < 1.4) {
          const u = smooth(0, 1.4, t);
          const look = tgt.clone().addScaledVector(UP, 0.75).addScaledVector(caster.facing, 0.2);
          const pos = tgt.clone().addScaledVector(caster.side, -2.0 + 0.25 * u).addScaledVector(caster.facing, -1.25).addScaledVector(UP, 0.95);
          return { pos, look, fov: 44, k: 3.5 };
        }
        const u = smooth(1.45, 4.0, t), v = smooth(3.4, 5.6, t);
        const look = mid.clone().addScaledVector(caster.facing, 0.7 + 0.3 * v).addScaledVector(UP, 0.25 - 0.1 * u);
        const pos = mid.clone().addScaledVector(caster.side, -4.6 - 0.6 * u + 1.3 * v).addScaledVector(caster.facing, -1.6 + 0.4 * v).addScaledVector(UP, 1.5 + 0.5 * u - 0.6 * v);
        return { pos, look, fov: 48, k: 2.2 };
      },
    },
  };
  const ORDER = ['chill', 'creep', 'spikes', 'vortex', 'shatter'];

  const idle = {
    title: 'Idle', caption: 'Cold air', dur: Infinity, events: [],
    start() { fx.setBanks([]); world.mistWant = Math.max(0.12, world.mistWant * 0.6); world.spikeGlowWant = fx.state.spikeT >= 0 && !ALL[0].shattered ? 0.7 : 0; },
    step() {},
    cam(t) { const look = mid.clone().addScaledVector(UP, 0.5).addScaledVector(caster.facing, -0.8); return { pos: look.clone().add(new V3(-3.2 + 0.3 * Math.sin(t * 0.2), 2.0, 4.8)), look, fov: 50, k: 1.6 }; },
  };

  // ------------------------------------------------------------ the world between beats: spikes, frost and mist ease
  const spikeLightAt = [new V3(), new V3(), new V3()];
  function updateWorld(dt) {
    // the spike clock runs once the ice is called; eruptions fire their effects as it passes them
    if (fx.state.spikeT >= 0 && dt > 0) {
      fx.state.spikeT += dt;
      clusters.forEach((C, ci) => {
        for (let i = 0; i < C.spikes.length; i++) {
          const S = C.spikes[i];
          if (S.fired || fx.state.spikeT < S.erupt) continue;
          S.fired = true;
          eruptFx(C, S, ci === clusters.length - 1 && i === 0);
        }
      });
    }
    // the frost grows on its own clock
    if (fx.frost.t >= 0 && dt > 0) {
      fx.frost.t += dt * fx.frost.speed;
      if (frostGrown()) fx.frost.speed = 1;
    }
    // the glow left in fresh frost settles to a residue
    fx.frost.glow = 1;
    // melting back for the next cycle
    if (world.melt > 0 && dt > 0) {
      world.melt = Math.max(0, world.melt - dt);
      const k = world.melt / 1.6;
      fx.frost.fade = Math.min(fx.frost.fade, k);
      for (const Fr of fx.frags) Fr.fade = Math.min(Fr.fade, k);
      if (world.melt <= 0) { fx.frost.t = -1; fx.frost.fade = 1; fx.resetIce(); fx.state.spikeT = -1; fx.obst.uniforms.uShatter.value = 0; }
    }
    if (world.fragOut > 0 && dt > 0) {
      world.fragOut = Math.max(0, world.fragOut - dt);
      for (const Fr of fx.frags) Fr.fade = Math.min(Fr.fade, world.fragOut / 0.6);
      if (world.fragOut <= 0) fx.clearFrags();
    }
    fx.obst.uniforms.uShatter.value = ALL[0].shattered ? 1 : 0;
    // mist eases toward what the beat asks for
    fx.mist.amount += (world.mistWant - fx.mist.amount) * (1 - Math.exp(-dt * 1.2));
    fx.mist.origin.copy(ORIGIN);
    fx.mist.flowSpeed = 0.3;
    // spike lights: three steady glows along the line, swelling as their spikes rise, fading when they break
    spikeGlow.value += ((fx.state.spikeT >= 0 ? world.spikeGlowWant : 0) - spikeGlow.value) * (1 - Math.exp(-dt * 2.5));
    const groups = [[0, 1, 2], [3, 4], [5, 6]];
    groups.forEach((g, i) => {
      let e = 0; spikeLightAt[i].set(0, 0, 0); let n = 0;
      for (const ci of g) {
        const C = clusters[ci], S = C.spikes[0];
        spikeLightAt[i].add(C.base).addScaledVector(UP, C.h * 0.45); n++;
        if (fx.state.spikeT >= S.erupt && !S.shattered) e += 0.3 + 0.2 * C.h;
      }
      spikeLightAt[i].divideScalar(n);
      fx.setLight(3 + i, spikeLightAt[i], e * (0.6 + 0.4 * world.spikeGlowWant) * (1 + 0.5 * (ALL[0].lightBoost || 0)), { rate: 3 });
    });
    if (run.name !== 'creep') { fx.setLight(1, null, 0, { rate: 3 }); fx.setLight(2, null, 0, { rate: 3 }); }
    if (run.name !== 'chill') fx.setLight(0, null, 0, { rate: 4 });
    if (fx.wind.vortex.on > 0 && run.name !== 'vortex') fx.wind.vortex.on *= Math.exp(-dt * 2);
    // ground mist: wide soft banks rolling out from where the frost landed, the detail the marched mist is too soft to hold
    if (false) {
      const a = R(0, 6.28), rr = R(0.3, 4.2);
      _v.set(ORIGIN.x + Math.cos(a) * rr + 1.0, R(0.08, 0.2), ORIGIN.z + Math.sin(a) * rr * 0.8);
      let clear = true; for (const S of ALL) if (fx.state.spikeT >= S.erupt && !S.shattered && Math.hypot(_v.x - S.base.x, _v.z - S.base.z) < S.radius + 0.45) clear = false;
      if (clear) fx.spawnWisp(2, _v, _w.set(Math.cos(a) * 0.22, 0, Math.sin(a) * 0.22), { size: R(0.35, 0.7), grow: 1.7, life: R(3.5, 5.5), opacity: R(0.16, 0.28) * Math.min(1, fx.mist.amount * 1.6), drag: 0.25, wind: 0.6 });
    }
    if (false) {
      const C = clusters[Math.floor(rnd() * clusters.length)];
      _v.copy(C.base).add(_w.set(R(-0.35, 0.35), R(0.04, 0.14), R(-0.35, 0.35)));
      fx.spawnWisp(1, _v, _w.set(R(0.15, 0.45), R(0.12, 0.3), R(-0.05, 0.1)), { size: R(0.12, 0.26), grow: 2.6, life: R(1.6, 2.6), opacity: R(0.14, 0.24), drag: 0.8, wind: 0.4, stretch: 0.8 });
    }
    // far ground mist: long low banks drifting across the field beyond the frost while the cold spreads
    if (false) {
      const a = R(-1.2, 1.2), rr = R(3.0, 8.5);
      _v.set(ORIGIN.x + Math.cos(a) * rr, R(0.1, 0.3), ORIGIN.z - Math.sin(a) * rr * 0.9 - R(0, 2));
      fx.spawnWisp(2, _v, _w.set(0.25, 0, -0.08), { size: R(0.7, 1.5), grow: 1.5, life: R(4.5, 6.5), opacity: R(0.12, 0.22), drag: 0.2, wind: 0.5 });
    }
    // ambient snow: a few flakes always drifting, sparse diamond dust
    if (dt > 0) {
      const c = camera.position;
      if (false) { _v.set(c.x + R(-4, 4), R(0.3, 1.6), c.z + R(-4, 4)); fx.spawnMote(0, _v, _w.set(0.1, -0.3, 0.05), { life: R(4, 7), size: R(0.003, 0.005), gravity: 0.008, drag: 1, wind: 1, bright: R(0.25, 0.5) }); }
      if (false) { _v.set(c.x + R(-3, 3), R(0.1, 0.8), c.z + R(-3, 3)); fx.spawnMote(1, _v, _w.set(0.05, -0.05, 0), { life: R(4, 7), size: R(0.0015, 0.0025), gravity: 0.002, drag: 1, wind: 0.6 }); }
    }
  }

  // ------------------------------------------------------------ runner
  const run = { beat: idle, name: 'idle', t: 0, fired: 0, loop: false, idleLeft: 0, listeners: [] };
  function start(name) {
    const b = name === 'idle' ? idle : BEATS[name];
    fx.ramp(1, 0.05);
    // a new cast melts the last one away instead of popping it
    if (name === 'chill' && (fx.frost.t >= 0 || fx.state.spikeT >= 0)) world.melt = 1.6;
    if (name !== 'chill') fx.bloom.group.visible = false;
    run.beat = b; run.name = name; run.t = 0; run.fired = 0;
    b.start?.call(b);
    for (const fn of run.listeners) fn(name, b);
  }
  function play(name) {
    if (name === 'all') { run.loop = true; start('chill'); return; }
    run.loop = false; start(name);
  }
  function advance(dt) {
    const b = run.beat;
    run.t += dt;
    while (run.fired < b.events.length && b.events[run.fired][0] <= run.t) b.events[run.fired++][1]();
    b.step(run.t, dt);
    updateWorld(dt);
    if (run.t >= b.dur) {
      if (run.loop) {
        const i = ORDER.indexOf(run.name);
        if (i >= 0 && i < ORDER.length - 1) start(ORDER[i + 1]);
        else { start('idle'); run.idleLeft = 1.2; }
      } else start('idle');
    } else if (run.name === 'idle' && run.loop && (run.idleLeft -= dt) <= 0) start('chill');
  }

  // ------------------------------------------------------------ camera rig
  const cam = { pos: new V3(), look: new V3(), fov: 46, init: false };
  function updateCamera(dt) {
    const w = run.beat.cam(run.t);
    if (!cam.init) { cam.pos.copy(w.pos); cam.look.copy(w.look); cam.fov = w.fov; cam.init = true; }
    const a = 1 - Math.exp(-w.k * dt);
    cam.pos.lerp(w.pos, a); cam.look.lerp(w.look, a); cam.fov += (w.fov - cam.fov) * a;
    cam.pos.y = Math.max(0.16, cam.pos.y);
    const narrow = camera.aspect < 1 ? Math.pow(1 / camera.aspect, 0.55) : 1;   // portrait: back off so the effect keeps its frame
    camera.position.copy(cam.look).addScaledVector(_v.subVectors(cam.pos, cam.look), narrow);
    camera.position.y = Math.max(0.16, camera.position.y);
    camera.lookAt(cam.look);
    if (Math.abs(camera.fov - cam.fov) > 1e-3) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }
    sky.position.copy(camera.position);
    ground.position.set(Math.round(camera.position.x / 20) * 20, 0, Math.round(camera.position.z / 20) * 20);
  }

  // ------------------------------------------------------------ size and loop
  let width = 0, height = 0;
  const dprCap = Number(params.get('dpr')) || 1.5;
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
  let dirty = true, paused = false, last = 0, lastTick = 0;
  function frame(realDt) {
    resize();
    const simDt = fx.update(realDt);
    advance(simDt);
    updateCamera(fx.holding ? 0 : realDt * Math.max(0.45, fx.timeScale * fx.rampValue));
    sky.material.uniforms.uTime.value = fx.time;
    sky.material.uniforms.uSkyDim.value = fx.wind.vortex.on;
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
    // a composed still: the spikes standing in the frost and the mist, glowing. Beats still play on request.
    play('spikes');
    ensureFrost(20);
    for (let i = 0; i < 200; i++) frame(1 / 60);
    paused = true; dirty = true;
  } else if (!params.has('idle')) play('all');
  frame(1 / 60);
  requestAnimationFrame(loop);
  setInterval(() => { if (performance.now() - lastTick > 600) { lastTick = performance.now(); frame(paused ? 0 : 1 / 60); } }, 500);

  window.stage = {
    fx, play, BEATS, ORDER, reduceMotion, camera, clusters, ALL, hand, ORIGIN, ground, sky, renderer,
    get beat() { return run.name; }, get loop() { return run.loop; }, get time() { return run.t; },
    get paused() { return paused; },
    setPaused(v) { paused = v; last = 0; dirty = true; },
    setOption(k, v) { fx.options[k] = v; if (k === 'ice') fx.iceShared.uFlat.value = v === 'flat' ? 1 : 0; dirty = true; },
    setTimeScale(v) { fx.timeScale = v; },
    onBeat(fn) { run.listeners.push(fn); },
    step(dt, n = 1) { for (let i = 0; i < n; i++) frame(dt); },
    redraw() { dirty = true; },
  };
})();
