// Fire and smoke skill VFX: raymarched flame volumes whose turbulence rises with buoyancy,
// charcoal smoke billows drawn premultiplied over the frame and lit by the fire, embers and
// sparks that drift on a curl field and cool to ash, heat haze, firelight shared with the
// world, a world-space heat map the ground's cracks glow from, and impact frames.
//
// Pass in your own THREE (r160+). Nothing else is imported.
//
//   const fx = createFireFX(THREE, { renderer, scene, camera });
//   fx.setSize(width * dpr, height * dpr, dpr);
//   const f = fx.flame({ mode: 'ball', pos, radius: 0.1, height: 0.36, light: 3 });
//   frame: const simDt = fx.update(realDt); ...move things...; fx.render();
//
// Every effect runs on the module's clock: fx.impact({ hold }) freezes it and fx.ramp() slows it.

export const DISTORT_LAYER = 1;
export const FLAME_LAYER = 2;   // flames march at a reduced resolution and are laid over the frame
export const LATE_LAYER = 3;    // sparks and glints, drawn over the flames
export const NL = 8;

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

// Periodic classic Perlin noise (Ashima / Stefan Gustavson, MIT), used once at start-up to bake
// a tiling 3D noise texture. Needs NOISE_GLSL's mod289/permute/taylorInvSqrt.
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

// Four independent noises baked into a 96³ texture that tiles every 6 units (16 texels a cell).
export const TNOISE_GLSL = /* glsl */`
uniform sampler3D tNoise;
vec4 tn(vec3 p){ return texture(tNoise, p * (1. / 6.)) * 2. - 1.; }
float tfbm2(vec3 p){ return tn(p).x * .5 + tn(p * 2.03 + 1.7).y * .25; }
float tfbm3(vec3 p){ return tn(p).x * .5 + tn(p * 2.03 + 1.7).y * .25 + tn(p * 4.07 + 3.1).z * .125; }
`;

// Eight firelights. Diffuse falls off fast; the glint reaches much further and grows at grazing
// angles, so glossy char catches the fire as a long warm streak, not only a pool under it.
export const FIRE_LIGHTS_GLSL = /* glsl */`
uniform vec3 uLightPos[${NL}];
uniform vec3 uLightCol[${NL}];
uniform float uLightFall[${NL}];
vec3 fireLight(vec3 P, vec3 N, vec3 V, vec3 albedo, float rough){
  vec3 acc = vec3(0.);
  float F = .04 + .96 * pow(1. - max(dot(N, V), 0.), 5.);
  float sp = mix(260., 9., rough);
  for (int i = 0; i < ${NL}; i++) {
    vec3 L = uLightPos[i] - P; float d2 = max(dot(L, L), 1e-4); L *= inversesqrt(d2);
    float ndl = max(dot(N, L) * .8 + .2, 0.);   // a little wrap: the low fire still picks out each pebble's top
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.), sp) * (1. - rough) * (1. - rough) * (1. + 6. * F) * (sp + 8.) * .03;
    acc += uLightCol[i] * ndl * (albedo / (1. + d2 * uLightFall[i]) + spec / (1. + d2 * .22));   // tight pools: the far ground stays neutral black
  }
  return acc;
}`;

// The heat map: a world-space texture of heat (r) and burn (g) that the ground samples.
export const GROUND_HEAT_GLSL = /* glsl */`
uniform sampler2D tHeat; uniform vec4 uHeatRect;
vec2 groundHeat(vec2 p){
  vec2 uv = (p - uHeatRect.xy) / uHeatRect.zw + .5;
  vec2 e = step(vec2(0.), uv) * step(uv, vec2(1.));
  return texture2D(tHeat, uv).rg * e.x * e.y;
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

// ---------------------------------------------------------------- the flame volume
// One shader for every flame. A ray crosses the instance's box and samples a signed field:
// the flame's profile (a plume from a source disc, a wall along an arc, or a teardrop ball)
// minus the distance from its axis, pushed in and out by turbulence. The turbulence rises:
// its height coordinate is y0·log(1 + h/y0), so features leave the root slowly and accelerate
// and stretch as they climb (buoyancy), and a warp field drifting through the noise deforms
// them on the way. Density is a narrow band of that field, so tongues are crisp sheets, and
// islands above the tips are detached wisps. Colour comes from a temperature ramp; where the
// gas has cooled, soot absorbs, so the blend is premultiplied "over" with the flame's light
// added and its smoke darkening.
const FLAME_VERT = /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
// The flame's proxy: a tube (plume, ball) or a bent slab (a wall's sector) shaped in the vertex shader to
// the same lateral reach the march's cheap bound uses, height by height and following the lean, so only
// pixels a tongue could cover run the march. Axis-aligned boxes covered the screen about eight times over.
const PROXY_VERT = TNOISE_GLSL + /* glsl */`
uniform vec3 uP; uniform vec4 uS, uS2, uS3, uS4, uArc; uniform int uMode; uniform float uTop; uniform vec2 uSpan;
varying vec3 vW;
void main(){
  float R = uS.x, H0 = max(uS.y, .001);
  float h = position.y * uTop;
  float yb = clamp(h / H0, 0., 1.6);
  float reach = R * ((uS2.y != 0. ? 1.6 : 1.05) + (uS4.x + 1.3 * yb + uS3.w * .9) * .72 + (.08 + .85 * yb) * .55) + uS4.z * h * 1.42 + .01;
  float lean = h * h / H0;
  vec3 w;
  if (uMode == 1) {
    float a = mix(uSpan.x, uSpan.y, position.x);
    // the slab follows the ring's own uneven radius (the same read as the march), so it stays thin
    float wob = uS4.y * uArc.x * tn(vec3(cos(a), sin(a), 0.) * min(uArc.x * .42, 1.3) + vec3(0., 0., uS2.w * 1.7 + 11.)).z * 1.4;
    float rr = max(uArc.x + wob + position.z * (reach + abs(uS3.y) * lean + uS4.y * uArc.x * .12) + (position.z > 0. ? max(uS3.x, 0.) : min(uS3.x, 0.)) * lean, 0.);
    w = vec3(uP.x + cos(a) * rr, uP.y + h, uP.z + sin(a) * rr);
  } else {
    float base = uMode == 2 ? uP.y - R : uP.y;
    w = vec3(uP.x + uS3.x * lean + position.x * reach * 1.025, base + h, uP.z + uS3.y * lean + position.z * reach * 1.025);
  }
  vW = w; gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}`;
const FLAME_COMMON = /* glsl */`
uniform float uTime, uScroll, uSteps, uFreq, uReach, uDbg, uPix;
uniform vec3 uBoxMin, uBoxMax, uP;
uniform vec4 uS;     // radius (arc: band half-width), height, intensity, temperature
uniform vec4 uS2;    // soot, swirl (rad/m), spin phase, seed
uniform vec4 uS3;    // lean x (arc: radial), lean z, blue roots, billow
uniform vec4 uArc;   // ring radius, sector a0, sector a1, fan fade width
uniform vec4 uArc2;  // fan start, fan end, height variation, -
uniform vec4 uS4;    // ragged base (noise share at the root), arc wobble (m), tornado wander, vertical stretch of the turbulence
uniform int uMode;   // 0 plume, 1 arc, 2 ball
varying vec3 vW;
float gT, gH, gCore, gW, gSkip, gHxz, gEdge, gLick, gArcPh, gSheet;
// the signed field in metres (> 0 inside); also leaves temperature, height, depth and the sector
// weight in gT, gH, gCore, gW. Texture reads are staged: a cheap bound reads none, one low-frequency
// read gives the sway (the whole flame bending as one sheet) and the drifting warp, one octave decides
// whether a tongue can reach the sample at all, and only then are the finer octaves read.
float field(vec3 p, bool full){
  float R = uS.x, H = uS.y, H0 = uS.y;
  gW = 1.; gSkip = 0.; gEdge = 1.; gLick = -1.;
  float h0, r0;
  if (uMode == 1) { h0 = p.y - uP.y; r0 = abs(length(p.xz - uP.xz) - uArc.x); }
  else { vec3 l0 = p - uP; h0 = uMode == 2 ? l0.y + R : l0.y; r0 = length(l0.xz); }
  if (r0 > uReach) { gSkip = (r0 - uReach) / max(gHxz, .05); return -9.; }
  float topCut = H0 * (uMode == 1 ? 2.6 : 1.75) + R;
  if (h0 < 0. || h0 > topCut) return -9.;
  float yb = clamp(h0 / H0, 0., 1.6);
  float reach = R * ((uS2.y != 0. ? 1.6 : 1.05) + (uS4.x + 1.3 * yb + uS3.w * .9) * .72 + (.08 + .85 * yb) * .55)
              + (abs(uS3.x) + abs(uS3.y)) * h0 * h0 / max(H0, .05) + uS4.z * h0 * 1.42;
  if (uMode != 1 && r0 > reach) return -9.;
  // every bound fades the gas out before it cuts it: a billow that outgrew its bound showed as a box
  gEdge = (1. - smoothstep(.8, 1., r0 / reach)) * (1. - smoothstep(.82, 1., h0 / topCut));
  if (uDbg > 1.5) gEdge = 1.;
  float h = h0, hp = h0, r, prof, amp, yn;
  float F = uFreq, st = uS4.w;
  // buoyant advection: features rise from the root at ~1 m/s and accelerate and stretch as they climb
  float y0 = .45 * H0 + .03;
  float s = uScroll > .5 ? h : y0 * log(1. + h / y0);
  float V = uScroll > .5 ? 1.7 : .95;
  float adv = (s - uTime * V) / st;
  vec2 nxz;
  vec4 A;   // the low-frequency read: sway in .xz, warp in .yzw
  if (uMode == 1) {
    vec2 rel = p.xz - uP.xz;
    // each box owns its sector with soft shoulders that sum to one with its neighbours', so the wall's
    // separately-marched pieces blend instead of meeting at a hard seam
    float o = uArc2.w;
    float a = uArc.y - o + mod(atan(rel.y, rel.x) - uArc.y + o, 6.2831853);
    if (a > uArc.z + o) return -9.;
    float lo = smoothstep(uArc.y - o, uArc.y + o + 1e-5, a), hi = 1. - smoothstep(uArc.z - o - 1e-5, uArc.z + o, a);
    if (uArc.w > 0.) {   // a fan's two end pieces have no neighbour outside: the fan's own fade ends them
      if (uArc.y <= uArc2.x + 1e-4) lo = step(uArc2.x, a);
      if (uArc.z >= uArc2.y - 1e-4) hi = step(a, uArc2.y);
    }
    gW = lo * hi;
    if (gW <= 0.) return -9.;
    float fw = min(uArc.w, 1.5 * H0 / max(uArc.x, .1));                   // the fan's ends thin out over more than the wall's height
    float fan = uArc.w > 0. ? smoothstep(uArc2.x, uArc2.x + fw, a) * (1. - smoothstep(uArc2.y - fw, uArc2.y, a)) : 1.;
    // A burning front is clumps of separate tongues, not a curtain: half-metre clusters, unequal in height,
    // with real gaps between them, and stretches of a few metres that barely burn. The fan's ends crumble
    // into sparse low clumps. Both reads go round the circle, so a ring has no seam where it closes.
    vec3 cs = vec3(cos(a), sin(a), 0.);
    vec4 E2 = tn(cs * min(uArc.x * .42, 1.3) + vec3(0., 0., uS2.w * 1.7 + 11.));   // a few lobes round any ring: faster ones folded the wall over itself
    float wob = uS4.y * uArc.x * E2.z * 1.4;                               // the radius varies stretch by stretch: never a circle
    float rw = abs(length(rel) - uArc.x - wob);
    if (rw > reach) return -9.;                                            // the exact distance to this stretch of the ring, before the next read
    gEdge = (1. - smoothstep(.8, 1., rw / reach)) * (1. - smoothstep(.82, 1., h0 / topCut));
    vec4 E = tn(cs * uArc.x * 1.3 + vec3(0., 0., uS2.w + uTime * .05));
    float vig = smoothstep(-.55, .35, E2.x);
    float k = smoothstep(0., .55, E.x + (vig - .5) * .5 + .34 - uArc2.z * .25) * fan;   // about a third of the front is gap
    if (k < .02) return -9.;
    // at a clump's flanks the tongues lean outward, away from where the clump burns strongest
    float da = .15 / max(uArc.x, .2);
    float Eb = tn(vec3(cos(a + da), sin(a + da), 0.) * uArc.x * 1.3 + vec3(0., 0., uS2.w + uTime * .05)).x;
    float leanT = clamp((E.x - Eb) * 2.2, -1., 1.) * .28;
    R *= .25 + .75 * sqrt(k);
    gW *= smoothstep(.06, .24, k);   // where the front barely burns it goes out, instead of leaving a thin glowing line
    float Hk = H * (.3 + .7 * pow(k, .6)) * (1. + .3 * E.z) * (.75 + .25 * vig);   // the clump only limits height softly
    // The outline is made of tongues, not of the clump: each tongue its own height (the tallest about three
    // times the shortest), pointed, with dark notches down nearly to the root between them.
    float sp = clamp(uS.x * .62, .06, .3);   // several tongues to a clump
    float yk = hp / max(Hk, .05);
    float sw = (a * uArc.x - leanT * Hk * yk * yk) / sp + E.y * .9 + uS2.w
             + (sin(hp * 7.5 / max(Hk, .3) - uTime * 4.4 + a * uArc.x * 8.) * .26 + sin(hp * 13. / max(Hk, .3) - uTime * 6.1 + a * uArc.x * 5.) * .1) * min(yk * 1.3, 1.6);   // tongues snake sideways, more toward their tips
    float ti = floor(sw), tf = fract(sw);
    // an arithmetic hash: sin() of a large argument lost its randomness on the GPU and every tongue came out tall
    float p1 = fract((ti + 71.) * .1031); p1 *= p1 + 33.33; p1 *= p1 + p1;
    float p2 = fract((ti + 13.) * .1137); p2 *= p2 + 19.19; p2 *= p2 + p2;
    float h1 = fract(p1), h2 = fract(p2);
    float Ht = Hk * (.34 + .95 * h1 * h1);                                     // mostly short tongues and a few tall ones, not a comb
    float tc = .5 + (h2 - .5) * .44;                                           // each tongue off-centre in its cell: uneven spacing
    float tw = tf < tc ? tf / tc : (1. - tf) / (1. - tc);
    H = Ht * (.07 + .93 * pow(tw, .62));
    float yy = hp / H0;
    float ring = uArc.x + wob + uS3.x * hp * hp / max(H0, .05)              // the wall leans forward as it rolls,
               + uS3.y * H0 * (1.6 * yy - 1.6 * yy * yy);                   // and a curl: forward, then the tops roll back over the burn
    float rRad = abs(length(rel) - ring);
    // now and then a tongue's tip breaks off and rises as a short lick, shrinking, before it goes out
    float ph = fract(uTime * (1.2 + .8 * h2) + h1 * 7.3);
    float rl = sp * .42 * (1. - ph) * smoothstep(0., .12, ph) * step(.35, h2) * k;
    float dLick = rl - length(vec3((tf - tc) * sp, (h - Ht * (.95 + .65 * ph)) * .6, rRad));
    if ((H < .03 && dLick <= 0.) || R < .004) return -9.;
    H = max(H, .03);
    yn = h / H;
    prof = R * pow(clamp(1. - yn, 0., 1.), .55) * (.62 + .38 * smoothstep(0., .25, yn)) - R * .8 * max(yn - 1., 0.);
    amp = R * (uS4.x * 1.15 + .95 * clamp(yn, 0., 1.3));                    // less churn: the tongues carry the outline
    float swayMag = R * (.08 + .85 * clamp(h / H0, 0., 1.2));
    if (rRad - prof - amp * (.72 + uS3.w * .5) - swayMag * .75 > 0. && dLick <= 0.) return -9.;   // out of reach before any further read
    gLick = dLick; gArcPh = ph;
    float Fs = F * .34;
    A = tn(vec3(p.x * Fs, adv * Fs, p.z * Fs) + 31. + uS2.w);
    if (uScroll < .5) rel += A.xz * swayMag;
    r = abs(length(rel) - ring);
    nxz = p.xz;
  } else {
    vec3 l = p - uP;
    l.xz -= uS3.xy * hp * hp / max(H, .05);
    if (uS4.z > 0.) l.xz -= uS4.z * hp * vec2(sin(1.3 * hp - 1.6 * uTime + uS2.w), cos(1.05 * hp - 1.25 * uTime + uS2.w * 1.7));   // the column's axis wanders
    if (uS2.y != 0.) l.xz -= R * .55 * smoothstep(0., .4, hp / H) * vec2(sin(3.4 * hp / H - .7 * uTime + uS2.w), cos(2.9 * hp / H - .6 * uTime + uS2.w * 1.3));   // and bends in an S
    yn = h / H;
    if (uMode == 2) {
      float hb = h - R, top = max(H - R, .01);
      // a teardrop: a narrow rounded root, widest a little above it, tapering into tongues
      prof = h < R ? sqrt(max(R * R - hb * hb, 0.)) * (.62 + .38 * h / R) : R * pow(clamp(1. - hb / top, 0., 1.), .65) - R * 1.6 * max(hb / top - 1., 0.);
      yn = clamp((h - R * .45) / max(H - R * .45, .01), 0., 1.3);
      amp = R * (uS4.x + 1.2 * clamp(hb / top, 0., 1.3)) + uS3.w * R * .5;
    } else if (uS2.y != 0.) {
      float yc = clamp(yn, 0., 1.);
      prof = R * (.42 + 1.25 * yc) * (1. - .28 * exp(-pow((yc - .26) / .1, 2.))) * pow(clamp(1.04 - yn, 0., 1.), .35) - R * .8 * max(yn - 1., 0.);   // a funnel, narrow at the root, a waist, widening up the column
      amp = R * (uS4.x + .8 * clamp(yn, 0., 1.3));
    } else {
      // a flame is several tongues round its source, each its own height, so its outline splits into
      // points with notches between them instead of closing into a teardrop
      float swp = atan(l.z, l.x) * (6. / 6.28318) + uS2.w * 3.1;
      float ti = floor(swp), tf = fract(swp);
      float p1 = fract((ti + 41.) * .1031); p1 *= p1 + 33.33; p1 *= p1 + p1;
      float p2 = fract((ti + 9.) * .1137); p2 *= p2 + 19.19; p2 *= p2 + p2;
      float th1 = fract(p1), tc = .5 + (fract(p2) - .5) * .4;
      float tw = tf < tc ? tf / tc : (1. - tf) / (1. - tc);
      float Hl = H * (.45 + .75 * th1 * th1) * (.4 + .6 * pow(tw, .6));
      yn = h / max(Hl, .02);
      prof = R * pow(clamp(1. - yn, 0., 1.), 1.1) * (.85 + .15 * smoothstep(0., .15, yn)) - R * .7 * max(yn - 1., 0.);
      amp = R * (uS4.x + 1.05 * clamp(yn, 0., 1.3));
    }
    float swayMag = R * (.08 + .85 * clamp(h / H, 0., 1.2));
    if (length(l.xz) - prof - amp * (.72 + uS3.w * .5) - swayMag * .75 > 0.) return -9.;   // out of reach before any read
    float Fs = F * .34;
    A = tn(vec3(l.x * Fs, adv * Fs, l.z * Fs) + 31. + uS2.w);
    if (uScroll < .5) l.xz += A.xz * swayMag;
    if (uS2.y != 0. || uS2.z != 0.) { float sw = uS2.y * h + uS2.z; float c = cos(sw), sn = sin(sw); l.xz = mat2(c, sn, -sn, c) * l.xz; }   // the gas turns round the axis
    r = length(l.xz);
    nxz = l.xz;
  }
  float slack = r - prof - amp * (.8 + uS3.w * .5);
  if (slack > 0.) return -slack - .001;          // too far out for any tongue to reach
  vec3 q = vec3(nxz.x * F, adv * F, nxz.y * F) + vec3(uS2.w * 1.37, 0., uS2.w * .71);   // tongues taller than wide
  if (uScroll < .5) q += A.yzw * .9;             // the warp drifts with the gas: shapes deform as they rise
  float n1 = tn(q).x;
  float d1 = prof - r + n1 * .6 * amp;
  if (d1 < -amp * (.42 + uS3.w * .7)) return d1;      // the finer octaves cannot close the gap
  // Band-limited: every octave fades out before it gets finer than the flame buffer can hold. Detail
  // finer than a few pixels does not read as detail; it aliases into a blocky mosaic.
  float ppc = 1. / max(length(p - cameraPosition) * uPix * F, 1e-5);   // flame-buffer pixels per noise cycle at this sample
  float w2 = smoothstep(4., 9., ppc / 2.07), w3 = smoothstep(5., 11., ppc / 3.4);
  float n2 = tn(q * 2.07 + 3.7).y;
  float n = n1 * .6 + mix(.0, (.42 - abs(n2) * 1.3) * .32, w2);                 // a ridged octave: tongues end in points, not lobes
  float nf = 0.;
  gSheet = .5;
  if (full) {
    vec4 f4 = tn(q * vec3(3.4, 2.4, 3.4) + 9.1); n += f4.z * (.12 + .1 * clamp(yn, 0., 1.)) * w3; nf = f4.w * w3;   // finer licks toward the tips
    // licks: a few broad brighter streaks along the rise, only where the buffer can draw them smoothly
    float ws = smoothstep(6., 14., ppc / 1.6);
    vec4 s4 = tn(q * vec3(1.6, .55, 1.6) + vec3(17.3, 0., 5.1));
    gSheet = mix(.5, 1. - smoothstep(0., .45, abs(s4.x)), ws);
  }
  if (uS3.w > 0.) n = mix(n, abs(n1) * 1.7 - .34 + n2 * .25, uS3.w);
  float d = prof - r + n * amp;
  if (uS2.y != 0. && full) {
    // a fire whirl is sheets of flame wrapped round its axis: bright ribbons with darker gaps between the turns
    float th = atan(nxz.y, nxz.x) + n1 * 1.4;
    gSheet = mix(gSheet, 1. - smoothstep(.12, .62, abs(sin(th * 2. + hp * 1.1))), smoothstep(5., 12., ppc * 1.2));
  }
  bool lick = gLick > d;
  if (lick) d = gLick;
  gCore = clamp(d / (R * .55), 0., 1.);
  // temperature follows depth inside the noisy shape, so the hot core is a smaller copy of the flame
  // nested inside it; it cools with height, and fine streaks vary it along every tongue
  float ynT = uS2.y != 0. ? yn * .62 : yn;   // a fire whirl burns hot most of the way up its column
  gT = uS.w * (1. - smoothstep(-.18, .86, ynT + .25 * n + .1 * nf)) * (.38 + .62 * gCore) * (.9 + .2 * nf)
     * (.42 + .58 * smoothstep(0., .2 * H, h + .06 * H * n));    // the brightest gas sits a little above the fuel, not on it as a line
  if (lick) gT = uS.w * (.6 - .32 * gArcPh) * (.75 + .25 * nf);                // a detached lick burns orange and cools as it rises
  if (uS3.w > 0.) gT *= mix(1., .06 + 3. * smoothstep(.45, .85, n1), uS3.w);   // a burst cools unevenly: a few hot pockets in darkening smoke
  // white heat: deep in the body, a little above the roots, the gas runs past yellow toward white
  gT += uS.w * (uMode == 1 ? .34 : uMode == 2 ? .12 : uS2.y != 0. ? .36 : .5) * gCore * gCore * smoothstep(.02, .14, yn) * (1. - smoothstep(.22, .62, yn + .2 * n)) * (1. - uS3.w);
  gT *= .9 + .2 * gSheet;
  gH = h;
  return d;
}
bool boxRay(vec3 ro, vec3 rd, vec3 bmin, vec3 bmax, out float t0, out float t1){
  vec3 inv = 1. / (rd + vec3(equal(rd, vec3(0.))) * 1e-6);
  vec3 a = (bmin - ro) * inv, b = (bmax - ro) * inv;
  vec3 lo = min(a, b), hi = max(a, b);
  t0 = max(max(lo.x, lo.y), max(lo.z, 0.)); t1 = min(min(hi.x, hi.y), hi.z);
  if (rd.y < 0.) t1 = min(t1, -ro.y / rd.y);    // the ground hides what is under it
  return t1 > t0;
}
bool cylClip(vec3 ro, vec3 rd, vec2 c, float rad, inout float t0, inout float t1){
  vec2 o = ro.xz - c, d = rd.xz;
  float a = dot(d, d);
  if (a < 1e-8) return dot(o, o) < rad * rad;
  float b = dot(o, d), cc = dot(o, o) - rad * rad, disc = b * b - a * cc;
  if (disc <= 0.) return false;
  float sq = sqrt(disc);
  t0 = max(t0, (-b - sq) / a); t1 = min(t1, (-b + sq) / a);
  return t1 > t0;
}
float ign(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
`;
const FLAME_FRAG = TNOISE_GLSL + FLAME_COMMON + /* glsl */`
// white-yellow at the root, through orange and deep red to nothing (linear HDR)
vec3 fireRamp(float T){
  vec3 c = vec3(.3, .024, .003) * smoothstep(.02, .2, T);
  c = mix(c, vec3(1.5, .15, .014), smoothstep(.16, .42, T));
  c = mix(c, vec3(3.4, .7, .09), smoothstep(.4, .66, T));
  c = mix(c, vec3(6., 1.9, .45), smoothstep(.64, .86, T));
  c = mix(c, vec3(9., 4.6, 1.9), smoothstep(.85, 1.05, T));       // warm yellow-white, never cream: blue stays well under the red
  c = mix(c, vec3(18., 13., 7.), smoothstep(1.02, 1.3, T));
  return c;
}
void main(){
  vec3 ro = cameraPosition, rd = normalize(vW - cameraPosition);
  if (uDbg > .5 && uDbg < 1.5) { gl_FragColor = vec4(.06, 0., 0., 0.); return; }   // debug: where the proxy rasterises
  float t0, t1;
  if (!boxRay(ro, rd, uBoxMin, uBoxMax, t0, t1)) { if (uDbg < -.5) { gl_FragColor = vec4(0., .2, 0., 0.); return; } discard; }
  if (!cylClip(ro, rd, uP.xz, uMode == 1 ? uArc.x + uReach : uReach, t0, t1)) discard;
  gHxz = length(rd.xz);
  float R = uS.x, edge = R * .07 + .003;
  float N = uSteps, dt = (t1 - t0) / N;
  float t = t0 + dt * ign(gl_FragCoord.xy);
  // the flame's light saturates within about a third of its radius, so tongues have crisp outlines and
  // the hot root shows through the cooler skin only partly; soot is tracked apart and is the only alpha
  float sig = 6. / max(R, .01);
  vec3 col = vec3(0.); float bw = 0.; float trE = 1., trS = 1., tmax = 0., cov = 0., covA = 0.;
  float tPrev = t0; bool inside = false;
  for (int i = 0; i < 64; i++) {
    if (float(i) >= N || t > t1) break;
    vec3 p = ro + rd * t;
    float d = field(p, true);
    // a thin shell round the flame, as thick as a step: a tongue thinner than the step is still met
    // (partly) by every ray, instead of hit by some pixels and missed by their neighbours (speckle)
    float shell = 0.;
    if (d <= -shell) { inside = false; tPrev = t; t += dt + floor(gSkip / dt) * dt; continue; }
    if (!inside) {
      // entering the flame: find its surface, so every pixel starts on it and not somewhere past it
      // (with a dithered start the saturating colour came out as grain)
      float ta = tPrev, tb = t;
      for (int k = 0; k < 4; k++) { float tm = (ta + tb) * .5; if (field(ro + rd * tm, false) > -shell) tb = tm; else ta = tm; }
      t = tb + dt * .25; p = ro + rd * t; d = field(p, true);
      inside = true;
      if (d <= -shell) { tPrev = t; t += dt; continue; }
    }
    t += dt;
    // a wall's neighbouring boxes both march their shared shoulder at full density, so both saturate alike,
    // and each adds only its weight of the light there: the two halves sum to one flame, with no dim band
    float dens = smoothstep(-shell, edge, d) * smoothstep(.25, 1.2, t) * gEdge;   // nothing burns on the lens
    dens *= mix(1., .45 + 1.1 * gSheet, uMode == 2 ? .3 : uS2.y != 0. ? .8 : .55);                  // brighter licks, with thinner gas between them
    float a = 1. - exp(-dens * sig * dt);
    vec3 e = fireRamp(gT);
    float skin = 1. - gCore;
    bw += uS3.z * (1. - smoothstep(0., .1 * uS.y, gH)) * skin * skin * a * trE * gW;   // a hint of blue at the roots' edge
    float wa = a * trE * trS * gW;
    col += e * wa;
    cov += wa;
    covA += wa * smoothstep(.35, .65, gT);   // only bright flame hides what is behind it: cool gas left dark ghosts
    tmax = max(tmax, gT * smoothstep(0., edge * 5., d) * gEdge);   // the hottest gas along the ray shows through the cooler skin, softly
    trE *= 1. - a;
    float soot = uS2.x * uS3.w * min(uS.z, 1.) * dens * smoothstep(.22, .02, gT);   // only a burst carries its own soot: on a flame it stood as a black post
    trS *= exp(-soot * dt * 3.2);
    if (trE * trS < .02) break;
  }
  vec3 hot = fireRamp(tmax);
  col = mix(col, hot * cov, .38);   // the hottest gas shows through, but the sheets keep their structure
  bw = smoothstep(.3, .55, bw * 2.4) * .9;   // a sharp change: a soft blend of blue and orange passes through pink
  col = mix(col, vec3(.05, .26, 1.2) * cov, bw) * uS.z;   // the root's blue replaces the yellow there: added, the two read as pink
  // coverage goes into alpha as well, so where two boxes of one wall meet, or one flame stands in front
  // of another, they layer instead of adding into a bright seam
  gl_FragColor = vec4(col, 1. - (1. - (uMode == 1 ? .4 : .85) * covA * min(uS.z, 1.)) * trS);
}`;
// Heat haze: a cheap profile of the hot air above and round the flame, a few steps through a
// taller box, and a fine rising shimmer as a signed screen offset.
const HAZE_FRAG = TNOISE_GLSL + FLAME_COMMON + /* glsl */`
uniform vec3 uHMin, uHMax; uniform float uHaze;
void main(){
  vec3 ro = cameraPosition, rd = normalize(vW - cameraPosition);
  float t0, t1;
  if (!boxRay(ro, rd, uHMin, uHMax, t0, t1)) discard;
  float R = uS.x, H = uS.y;
  float dt = (t1 - t0) / 4., t = t0 + dt * ign(gl_FragCoord.xy), acc = 0.; vec3 pm = vec3(0.);
  for (int i = 0; i < 4; i++) {
    vec3 p = ro + rd * t; t += dt;
    float r, h;
    if (uMode == 1) { vec2 rel = p.xz - uP.xz; r = abs(length(rel) - uArc.x); h = p.y; float a = uArc.y + mod(atan(rel.y, rel.x) - uArc.y, 6.2831853); if (a > uArc.z) continue; }
    else { vec3 l = p - uP; r = length(l.xz); h = uMode == 2 ? l.y + R : l.y; }
    float Rh = R * (1.4 + .5 * clamp(h / H, 0., 2.)) + .04, hh = h / (H * 2.4);
    float w = exp(-r * r / (Rh * Rh)) * smoothstep(-.02, .2, hh) * (1. - smoothstep(.45, 1., hh));
    acc += w * dt; pm += p * w * dt;
  }
  if (acc < 1e-5) discard;
  pm /= acc;
  vec3 q = vec3(pm.x * 7., pm.y * 4.5 - uTime * 4.8, pm.z * 7.);
  q += tn(q * .45 + vec3(uTime * .3, 0., -uTime * .2)).xyz * .7;
  vec2 off = tn(q).xy + .45 * tn(q * 2.1 + 5.).zw;
  gl_FragColor = vec4(off * uHaze * clamp(acc / (R * 1.6 + .05), 0., 1.), 0., 0.);
}`;

export function createFireFX(THREE, { renderer, scene, camera, seed = 7 } = {}) {
  const V3 = THREE.Vector3;
  const rnd = mulberry32(seed);
  const R = (a = 0, b = 1) => a + (b - a) * rnd();
  const UP = new V3(0, 1, 0), ZAXIS = new V3(0, 0, 1);
  const _a = new V3(), _b = new V3(), _c = new V3(), _d = new V3(), _e = new V3();

  const palette = {
    smoke: new THREE.Color(0.024, 0.022, 0.021),   // charcoal: black where nothing lights it, warm brown where the fire does
    ash: new THREE.Color(0.04, 0.036, 0.033),      // ash and dust thrown off the ground: never lighter than the lit char
    flake: new THREE.Color(0.016, 0.014, 0.012),   // a cooled ember: a dark scrap of ash
    light: new THREE.Color(1.0, 0.4, 0.12),        // firelight, linear
    lightHot: new THREE.Color(1.0, 0.6, 0.3),      // a hit's flash
    ambient: new THREE.Color(0.018, 0.019, 0.024), // the night the smoke sits in
    glow: new THREE.Color(1.0, 0.27, 0.05),        // smoke still glowing from inside
  };

  const options = {
    noise: 'advected',     // 'advected' (rises, accelerates, deforms) | 'scrolled' (the sliding-texture failure)
    smoke: 'over',         // 'over' (premultiplied, darkens) | 'additive' (the grey-haze failure)
    flashes: 'full',       // 'full' | 'safe'
    shake: 1, fisheye: 1,  // set both to 0 under prefers-reduced-motion
    tickHz: 30,
    lightGain: 2.4,        // firelight on the world, relative to the flame's own brightness
    flameScale: 0.75,    // the flame layer's resolution, a share of the drawing buffer's (set per shot)
    flameBudget: 260,     // a safety net: march work (screen share x steps x scale²) above this drops the resolution
  };

  const debug = { noFlames: false, noSmoke: false, noHaze: false, noSparks: false };
  const group = new THREE.Group(); group.name = 'fire-fx';
  scene.add(group);
  const res = new THREE.Vector2(1, 1);
  let dpr = 1, W = 1, H = 1;
  const uniforms = { uTime: { value: 0 }, uResolution: { value: res }, uDpr: { value: 1 }, tNoise: { value: null }, uScroll: { value: 0 }, uPix: { value: 0.002 } };

  // ---------------------------------------------------------------- clock
  const clock = { sim: 0, real: 0, hold: 0, base: 1, tickAcc: 0, rampFrom: 1, rampTo: 1, rampT: 1, rampDur: 0, rampValue: 1 };
  function ramp(to, seconds = 0.4) { clock.rampFrom = clock.rampValue; clock.rampTo = to; clock.rampT = 0; clock.rampDur = Math.max(seconds, 1e-4); }
  const repeats = [];
  function repeat(ticks, fn) { repeats.push({ ticks, fn }); }

  // ---------------------------------------------------------------- full-screen passes and the noise bake
  const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const fsScene = new THREE.Scene();
  const fsMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); fsMesh.frustumCulled = false; fsScene.add(fsMesh);
  const pass = (mat, target) => { fsMesh.material = mat; renderer.setRenderTarget(target); renderer.render(fsScene, fsCam); };
  const noiseRT = new THREE.WebGL3DRenderTarget(96, 96, 96, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
  // WebGL3DRenderTarget swaps in a Data3DTexture that defaults to NEAREST and 8-bit: set them on the texture
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

  // ---------------------------------------------------------------- firelight
  // Slot 0 is for flashes (a hit, the ignition spark); slots 1-7 follow the flames that ask for one.
  // Energy swells in fast and settles slowly, with a gentle slow drift: firelight breathes, it does not strobe.
  const lightPos = Array.from({ length: NL }, () => new V3(0, -50, 0));
  const lightCol = Array.from({ length: NL }, () => new V3());
  const lightFall = new Float32Array(NL).fill(2.4);   // ground falloff per light: a big source (the whirl) lights the ground far out
  const lightUniforms = { uLightPos: { value: lightPos }, uLightCol: { value: lightCol }, uLightFall: { value: lightFall } };
  const lights = lightPos.map((p, i) => ({ owner: null, energy: 0, target: 0, decay: 0, hot: 0, phase: i * 1.73, pos: p }));
  function flash(pos, energy, decay = 6, hot = 1) {
    const L = lights[0];
    if (energy >= L.energy * 0.5) L.pos.copy(pos);
    L.energy = Math.max(L.energy, energy); L.decay = decay; L.hot = hot;
  }
  function updateLights(dt) {
    const t = clock.sim;
    for (let i = 0; i < NL; i++) {
      const L = lights[i];
      if (i === 0) { L.energy *= Math.exp(-L.decay * dt); }
      else {
        const O = L.owner;
        if (O && !O.alive) L.owner = null;
        if (L.owner) { L.target = L.owner.lightEnergy(); L.owner.lightPos(L.pos); } else L.target = 0;
        const k = L.target > L.energy ? 1 - Math.exp(-dt / 0.09) : 1 - Math.exp(-dt / 0.38);   // swell, then settle
        L.energy += (L.target - L.energy) * k;
      }
      const drift = 1 + 0.07 * Math.sin(t * 2.3 + L.phase) + 0.04 * Math.sin(t * 3.7 + L.phase * 1.3);
      const c = i === 0 ? palette.lightHot : palette.light;
      const e = L.energy * (i === 0 ? 1 : drift) * options.lightGain;
      lightCol[i].set(c.r, c.g, c.b).multiplyScalar(e);
      lightFall[i] = (L.owner && L.owner.fall) || 2.4;
      if (i > 0 && L.hot > 0) lightCol[i].lerp(_a.set(palette.lightHot.r, palette.lightHot.g, palette.lightHot.b).multiplyScalar(e), Math.min(1, L.hot));
    }
  }
  function claimLight(F) {
    for (let i = 1; i < NL; i++) if (!lights[i].owner && lights[i].energy < 0.08) { lights[i].owner = F; F.lightPos(lights[i].pos); lights[i].hot = F.temp > 1.05 ? 0.5 : 0; return; }
    for (let i = 1; i < NL; i++) if (!lights[i].owner) { lights[i].owner = F; F.lightPos(lights[i].pos); return; }
  }

  // ---------------------------------------------------------------- heat map
  // A world-space texture of heat (r) and burn (g), redrawn every frame from a list of patches:
  // lasting ones that cool and live ones that flames re-assert while they burn.
  const HEATRES = 256;
  const heatRect = new THREE.Vector4(3.5, 0, 26, 26);
  const heatRT = new THREE.WebGLRenderTarget(HEATRES, HEATRES, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  const heatUniforms = { tHeat: { value: heatRT.texture }, uHeatRect: { value: heatRect } };
  const MAXHEAT = 320;
  const patches = [];
  const hGeo = new THREE.InstancedBufferGeometry();
  { const q = new THREE.PlaneGeometry(2, 2); hGeo.index = q.index; hGeo.setAttribute('position', q.getAttribute('position')); }
  const hA = new Float32Array(MAXHEAT * 4), hB = new Float32Array(MAXHEAT * 4), hC = new Float32Array(MAXHEAT * 4);
  const idyn = (arr, n) => new THREE.InstancedBufferAttribute(arr, n).setUsage(THREE.DynamicDrawUsage);
  hGeo.setAttribute('iA', idyn(hA, 4)); hGeo.setAttribute('iB', idyn(hB, 4)); hGeo.setAttribute('iC', idyn(hC, 4));
  const hMat = new THREE.ShaderMaterial({
    uniforms: { uRect: { value: heatRect } },
    vertexShader: /* glsl */`
      attribute vec4 iA; attribute vec4 iB; attribute vec4 iC; uniform vec4 uRect;
      varying vec2 vW; varying vec4 vA; varying vec4 vB; varying vec4 vC;
      void main(){
        vW = iA.xy + position.xy * iA.z; vA = iA; vB = iB; vC = iC;
        gl_Position = vec4((vW - uRect.xy) / uRect.zw * 2., 0., 1.);
      }`,
    fragmentShader: NOISE_GLSL + /* glsl */`
      varying vec2 vW; varying vec4 vA; varying vec4 vB; varying vec4 vC;
      void main(){
        float f;
        vec2 rel = vW - vA.xy;
        float n = snoise(vec3(vW * 1.3, vC.z)) * .5 + snoise(vec3(vW * 3.1, vC.z + 4.)) * .25;
        if (vA.w < .5) { float d = length(rel) / (vB.x * (1. + .28 * n)); f = exp(-d * d * 2.2); }
        else {
          float a = vB.z + mod(atan(rel.y, rel.x) - vB.z, 6.2831853);
          float x = (length(rel) - vB.x) / (vB.y * (1. + .4 * n));
          f = exp(-x * x * 2.) * step(a, vB.w) * smoothstep(.05, .5, snoise(vec3(cos(a) * vB.x * 1.4, sin(a) * vB.x * 1.4, vC.z)) + snoise(vec3(vW * 2.6, vC.z + 3.)) * .3);   // the front's heat is ragged and interrupted, never a fuse
        }
        gl_FragColor = vec4(vC.x * f, vC.y * f, 0., 1.);
      }`,
    depthTest: false, depthWrite: false, transparent: true,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  });
  const hMesh = new THREE.Mesh(hGeo, hMat); hMesh.frustumCulled = false;
  const heatScene = new THREE.Scene(); heatScene.add(hMesh);
  let liveHeat = [];
  // a lasting patch: heat cools by e^(-t/tau), burn (the charred mark) lasts
  function addHeat(pos, radius, amount = 1, { burn = 0.6, tau = 2.5, shape = 0, R: ringR = 0, w = 0.3, a0 = -Math.PI, a1 = Math.PI } = {}) {
    if (patches.length >= MAXHEAT - 40) { let oi = 0; for (let i = 1; i < patches.length; i++) if (patches[i].heat + patches[i].burn < patches[oi].heat + patches[oi].burn) oi = i; patches.splice(oi, 1); }
    const P = { x: pos.x, z: pos.z, r: radius, heat: amount, burn, tau, shape, R: ringR, w, a0, a1, seed: R(0, 40) };
    patches.push(P);
    return P;
  }
  function liveHeatAt(o) { liveHeat.push(o); }
  function renderHeat() {
    let n = 0;
    const write = (P, heatV, burnV) => {
      if (n >= MAXHEAT) return;
      const o = n * 4;
      const ext = P.shape === 1 ? P.R + P.w * 2.5 : P.r * 1.8;
      hA[o] = P.x; hA[o + 1] = P.z; hA[o + 2] = ext; hA[o + 3] = P.shape;
      hB[o] = P.shape === 1 ? P.R : P.r; hB[o + 1] = P.w; hB[o + 2] = P.a0; hB[o + 3] = P.a1;
      hC[o] = heatV; hC[o + 1] = burnV; hC[o + 2] = P.seed; hC[o + 3] = 0;
      n++;
    };
    for (const P of patches) write(P, P.heat, P.burn);
    for (const P of liveHeat) write(P, P.heat, P.burn || 0);
    hGeo.instanceCount = n;
    for (const k of ['iA', 'iB', 'iC']) hGeo.getAttribute(k).needsUpdate = true;
    renderer.setClearColor(0x000000, 0); renderer.setRenderTarget(heatRT); renderer.clear();
    if (n) renderer.render(heatScene, fsCam);
  }
  function updateHeat(dt) {
    for (let i = patches.length - 1; i >= 0; i--) {
      const P = patches[i];
      P.heat *= Math.exp(-dt / P.tau);
      if (P.heat < 0.004 && P.burn < 0.02) patches.splice(i, 1);
    }
  }

  // ---------------------------------------------------------------- flames
  const MAXFL = 96;
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const tubeGeo = new THREE.CylinderGeometry(1, 1, 1, 16, 8, false); tubeGeo.translate(0, 0.5, 0);
  const slabGeo = new THREE.BoxGeometry(1, 1, 2, 12, 6, 1); slabGeo.translate(0.5, 0.5, 0);
  const flames = [];
  const BLEND_OVER = { blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor };
  for (let i = 0; i < MAXFL; i++) {
    const u = {
      uTime: uniforms.uTime, tNoise: uniforms.tNoise, uScroll: uniforms.uScroll, uPix: uniforms.uPix,
      uBoxMin: { value: new V3() }, uBoxMax: { value: new V3() }, uP: { value: new V3() },
      uS: { value: new THREE.Vector4() }, uS2: { value: new THREE.Vector4() }, uS3: { value: new THREE.Vector4() },
      uArc: { value: new THREE.Vector4() }, uArc2: { value: new THREE.Vector4() }, uS4: { value: new THREE.Vector4() }, uMode: { value: 0 }, uSteps: { value: 32 }, uFreq: { value: 3 }, uReach: { value: 1 }, uDbg: { value: 0 }, uTop: { value: 1 }, uSpan: { value: new THREE.Vector2() },
    };
    const hu = { ...u, uHMin: { value: new V3() }, uHMax: { value: new V3() }, uHaze: { value: 0 } };
    const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: PROXY_VERT, fragmentShader: FLAME_FRAG, transparent: true, depthWrite: false, depthTest: false, side: THREE.BackSide, ...BLEND_OVER });
    const hmat = new THREE.ShaderMaterial({ uniforms: hu, vertexShader: FLAME_VERT, fragmentShader: HAZE_FRAG, transparent: true, depthWrite: false, depthTest: false, side: THREE.BackSide, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor });
    const mesh = new THREE.Mesh(tubeGeo, mat), hmesh = new THREE.Mesh(boxGeo, hmat);
    mesh.renderOrder = 20; mesh.visible = hmesh.visible = false; mesh.layers.set(FLAME_LAYER); mesh.frustumCulled = false;
    hmesh.layers.set(DISTORT_LAYER);
    group.add(mesh, hmesh);
    const F = {
      alive: false, mesh, hmesh, u, hu, pos: new V3(), lean: new THREE.Vector2(), age: 0, env: 0, dying: false, dieAge: 0, fadeOut: 0.4,
      smokeAcc: 0, emberAcc: 0, spinPhase: 0,
      lightPos(out) {
        if (F.mode === 1) { const a = (F.a0 + F.a1) * 0.5; return out.set(F.pos.x + Math.cos(a) * F.arcR, F.pos.y + F.height * 0.35, F.pos.z + Math.sin(a) * F.arcR); }
        if (F.mode === 2) return out.copy(F.pos).addScaledVector(UP, F.radius * 0.4);
        return out.copy(F.pos).addScaledVector(UP, Math.min(F.height * 0.32, 1.4));
      },
      lightEnergy() { return F.light * F.intensity * F.env; },
      kill(seconds = 0.4) { if (!F.alive || F.dying) return; F.dying = true; F.dieAge = 0; F.fadeOut = Math.max(seconds, 1e-3); },
    };
    flames.push(F);
  }
  const MODES = { plume: 0, arc: 1, ball: 2 };
  // mode: 'plume' (a fire rising off a source disc at pos), 'arc' (a wall of flame along a circle
  // round pos, between angles a0 and a1), 'ball' (a teardrop of flame centred at pos, its tongues
  // licking up; height counts from its bottom). Everything is mutable after creation.
  // The seeds of the first flames of the cast, in the order they are made. The art direction was
  // approved on these exact layouts (which clumps burn, where a ring has gaps), so later changes to how
  // many particles are spawned, which draw from the same random stream, must not reshuffle them.
  const SEED_TABLE = [35.7941,5.0208,39.5241,31.4388,24.6116,0.4392,38.1754,10.6796,0.8051,13.7861,3.4875,19.9564,28.6944,2.7653,22.58,30.0921,12.6926,6.1507,26.9679,33.2128,15.0749,36.1888,0.074,22.8551,21.3869,14.4256,31.9938,4.6454,16.6429,23.8103,3.3792,2.6419,37.1538,38.2493,20.847,23.2016,1.2213,4.0143,19.6492,37.7672,35.7742,36.6133,4.0791,32.5946,32.1338,24.2147,34.835,34.9191,23.2005,1.1884,28.1733,6.0479,31.6505,24.1646,13.733,23.8543,6.5038,30.6673,35.5261,11.2859,10.6654,1.3823,27.4669,4.6602,6.212,36.4297,19.0498,25.6893,19.0223,12.5859,9.7273,23.3763,34.7573,0.41,11.8841,29.6193,5.5556,14.2284,5.5696,26.4402,28.7,7.9906,12.6642,0.8213,10.4409,26.6656,6.1677,31.8285,17.6171,5.2754,35.4982,32.0193,12.868,15.3931,7.3943,2.0605,35.0448,17.0372,30.6703,10.1997,33.1153,6.505,8.2923,25.0952,10.4955,19.7764,4.5699,26.7108,0.4366,14.699,4.5796,6.287,29.5536,12.6083,24.7033,23.1571,4.6997,2.4297,38.7138,9.7105,36.315];
  let flameCalls = 0;
  function flame(o = {}) {
    let F = flames.find((f) => !f.alive);
    // pool exhausted: take a fading flame, else the least important one (small, low), never a hero
    if (!F) F = flames.reduce((m, f) => ((f.dying ? 1e3 : 0) - f.radius * f.height > (m.dying ? 1e3 : 0) - m.radius * m.height ? f : m), flames[0]);
    Object.assign(F, {
      alive: true, mode: MODES[o.mode || 'plume'], radius: 0.3, height: 1, intensity: 1, temp: 1, soot: 0.5, swirl: 0, spin: 0,
      blue: 0, billow: 0, arcR: 1, a0: -0.5, a1: 0.5, f0: -0.5, f1: 0.5, fw: 0, hvar: 0.35, light: 0, smoke: 0, smokeSize: 1, embers: 0,
      heat: 0, fadeIn: 0.25, scale: 0, steps: 0, haze: 1, seed: R(0, 40), overlap: 0, ragged: null, wobble: 0, wander: 0, stretch: 0, smokeKind: 'billow', smokeLife: 1,
      age: 0, env: 0, dying: false, dieAge: 0, smokeAcc: R(0, 1), emberAcc: R(0, 1), spinPhase: R(0, 6.28),
    });
    if (flameCalls < SEED_TABLE.length) F.seed = SEED_TABLE[flameCalls];
    flameCalls++;
    if (window.__seedRec) window.__seedRec.push(F.seed);
    for (const k of Object.keys(o)) if (k !== 'mode' && k !== 'pos' && k !== 'lean') F[k] = o[k];
    if (o.pos) F.pos.copy(o.pos); else F.pos.set(0, 0, 0);
    if (o.lean) F.lean.set(o.lean.x, o.lean.y); else F.lean.set(0, 0);
    F.mesh.geometry = F.mode === 1 ? slabGeo : tubeGeo;
    if (F.light > 0) claimLight(F);
    return F;
  }
  // a wall of flame along an arc, cut into sectors so each box marches only its own part of the
  // wall; the fan's two ends fade in, a full ring has none
  function flameArc({ center, R: ringR = 1, w = 0.25, height = 1, a0 = -0.6, a1 = 0.6, segments = 8, lights = 2, ...rest } = {}) {
    const full = a1 - a0 >= 6.28;
    const fw = full ? 0 : (a1 - a0) * 0.45;   // the most the ends may taper; the shader fits it to the wall's height
    const segs = [];
    for (let k = 0; k < segments; k++) {
      const s0 = a0 + (a1 - a0) * (k / segments), s1 = a0 + (a1 - a0) * ((k + 1) / segments);
      const lit = lights > 0 && (k + 0.5) % (segments / lights) < 1;
      segs.push(flame({ mode: 'arc', pos: center, radius: w, height, arcR: ringR, a0: s0, a1: s1, f0: a0, f1: a1, fw, overlap: (s1 - s0) * 0.3, ...rest, light: lit ? rest.light || 0 : 0 }));
    }
    const G = {
      segs, center: center.clone(), R: ringR, w, height, intensity: rest.intensity ?? 1, lean: rest.lean ? rest.lean.x : 0,
      sync() { for (const F of segs) { F.pos.copy(G.center); F.arcR = G.R; F.radius = G.w; F.height = G.height; F.intensity = G.intensity; F.lean.x = G.lean; } },
      set(props) { Object.assign(G, props); G.sync(); for (const F of segs) for (const k of ['temp', 'soot', 'smoke', 'embers', 'heat', 'blue', 'hvar']) if (k in props) F[k] = props[k]; },
      kill(s) { for (const F of segs) F.kill(s); },
      get alive() { return segs.some((F) => F.alive); },
    };
    return G;
  }
  const _min = new V3(), _max = new V3(), _ctr = new V3(), _sz = new V3();
  let flameLoad = 0;
  function pickFlameScale() {
    // the caller sets options.flameScale per shot: a close-up of one flame marches sharp, the ring of fire at
    // half resolution. A safety net halves it again if the march work would run far past the budget.
    let want = options.flameScale;
    if (flameLoad * want * want > options.flameBudget) want = Math.max(0.5, Math.sqrt(options.flameBudget / Math.max(flameLoad, 1e-3)));
    want = Math.round(want * 20) / 20;
    if (Math.abs(want - flameScaleNow) > 1e-3) applyScale(want);
  }
  function applyScale(s) {
    flameScaleNow = s;
    rtFlame.setSize(Math.ceil(W * s), Math.ceil(H * s));
    flameOverMat.uniforms.uTexel.value.set(1 / rtFlame.width, 1 / rtFlame.height);
    flameOverMat.uniforms.uSharp.value = 0.;   // a cubic B-spline: smooth gradients; the sharpened kernel turned the march's per-pixel variation into a mosaic
  }
  function updateFlames(dt) {
    const tNow = clock.sim;
    flameLoad = 0;
    for (const F of flames) {
      if (!F.alive) continue;
      if (dt > 0) {
        F.age += dt; F.spinPhase += F.spin * dt;
        if (F.dying) { F.dieAge += dt; if (F.dieAge >= F.fadeOut) { F.alive = false; F.mesh.visible = F.hmesh.visible = false; continue; } }
      }
      const fin = F.fadeIn > 0 ? Math.min(1, F.age / F.fadeIn) : 1;
      const fout = F.dying ? 1 - F.dieAge / F.fadeOut : 1;
      F.env = fin * fin * (3 - 2 * fin) * fout * fout * (3 - 2 * fout);
      // the box and the lateral reach: everything the field can reach (mirrors the shader's bound)
      const Rr = F.radius, Hh = Math.max(F.height, 1e-3), lean = Math.abs(F.lean.x) + Math.abs(F.lean.y);
      const rag = F.ragged ?? (F.mode === 1 ? 0.4 : F.mode === 2 ? 0.34 : 0.24);
      const top = Hh * (F.mode === 1 ? 2.6 : 1.75) + Rr;
      const wobMax = F.mode === 1 ? F.wobble * F.arcR * 1.4 : 0;
      const reach = Rr * ((F.swirl ? 1.6 : 1.05) + (rag + 2.08 + F.billow * 0.9) * 0.72 + 1.44 * 0.55) + lean * top * top / Hh + F.wander * top * 1.42 + wobMax + 0.01;
      F.u.uReach.value = reach;   // the clip and the box carry the ring's whole wobble; the proxy follows it exactly
      if (F.mode === 1) {
        const m = reach, mi = reach;
        _min.set(1e9, 0, 1e9); _max.set(-1e9, F.pos.y + top, -1e9);
        const b0 = Math.max(F.a0 - F.overlap, F.f0 - (F.fw > 0 ? 0 : 1e9)), b1 = Math.min(F.a1 + F.overlap, F.f1 + (F.fw > 0 ? 0 : 1e9));
        for (let k = 0; k <= 8; k++) {
          const a = b0 + (b1 - b0) * k / 8, ca = Math.cos(a), sa = Math.sin(a);
          for (const rr of [Math.max(0, F.arcR - mi), F.arcR + m]) { const x = F.pos.x + ca * rr, z = F.pos.z + sa * rr; _min.x = Math.min(_min.x, x); _min.z = Math.min(_min.z, z); _max.x = Math.max(_max.x, x); _max.z = Math.max(_max.z, z); }
        }
        _min.y = F.pos.y;
      } else if (F.mode === 2) {
        _min.set(F.pos.x - reach, F.pos.y - Rr, F.pos.z - reach); _max.set(F.pos.x + reach, F.pos.y - Rr + top, F.pos.z + reach);
      } else {
        _min.set(F.pos.x - reach, F.pos.y, F.pos.z - reach); _max.set(F.pos.x + reach, F.pos.y + top, F.pos.z + reach);
      }
      _min.y = Math.max(_min.y, 0);
      const visible = F.env > 0.002 && F.intensity > 0.002 && Hh > 0.005 && Rr > 0.002 && _max.y > _min.y;
      F.mesh.visible = visible && !debug.noFlames && !(debug.noArc && F.mode === 1) && !(debug.noPlume && F.mode === 0) && !(debug.noBall && F.mode === 2); F.hmesh.visible = visible && F.haze > 0 && F.mode !== 1 && !debug.noHaze;   // a wall's haze cost more than it showed
      if (!visible) continue;
      _ctr.addVectors(_min, _max).multiplyScalar(0.5); _sz.subVectors(_max, _min);
      F.mesh.position.copy(_ctr); F.mesh.updateMatrixWorld();   // sorting only: the proxy is placed in the vertex shader
      F.u.uTop.value = top;
      if (F.mode === 1) F.u.uSpan.value.set(Math.max(F.a0 - F.overlap, F.fw > 0 ? F.f0 : -1e9), Math.min(F.a1 + F.overlap, F.fw > 0 ? F.f1 : 1e9));
      const u = F.u;
      u.uBoxMin.value.copy(_min); u.uBoxMax.value.copy(_max); u.uP.value.copy(F.pos);
      u.uS.value.set(Rr, Hh, F.intensity * F.env, F.temp);
      u.uS2.value.set(F.soot, F.swirl, F.spinPhase, F.seed);
      u.uS3.value.set(F.lean.x, F.lean.y, F.blue, F.billow);
      u.uArc.value.set(F.arcR, F.a0, F.a1, F.fw); u.uArc2.value.set(F.f0, F.f1, F.hvar, F.overlap || 0);
      u.uS4.value.set(F.ragged ?? (F.mode === 1 ? 0.4 : F.mode === 2 ? 0.34 : 0.24), F.wobble, F.wander, F.stretch || (F.swirl ? 1 : 1.25));
      u.uMode.value = F.mode; u.uDbg.value = debug.proxy ? 1 : debug.boxMiss ? -1 : debug.noEdge ? 2 : 0;
      u.uFreq.value = 1 / Math.max(0.012, F.scale || Rr * (F.mode === 1 ? 0.8 : 0.45));
      // steps by the box's size on screen: small flames march less
      const dist = Math.max(0.3, _c.copy(_ctr).sub(camera.position).length());
      const pxFull = (_sz.length() / dist) * H * 0.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5), px = pxFull * flameScaleNow;
      u.uSteps.value = F.steps || Math.round(Math.min(F.mode === 1 ? 32 : 38, Math.max(14, 12 + px / 12)));
      flameLoad += Math.min(1.5, 0.45 * pxFull * pxFull / (W * H)) * u.uSteps.value;
      // haze box: taller, a little wider
      const hu = F.hu;
      if (F.mode === 1) { hu.uHMin.value.copy(_min); hu.uHMax.value.copy(_max); }
      else {
        const hr = Rr * 2.2 + lean * Hh + F.wander * Hh * 2 + 0.05, cx = F.pos.x + F.lean.x * Hh, cz = F.pos.z + F.lean.y * Hh, by = F.mode === 2 ? F.pos.y - Rr : F.pos.y;
        hu.uHMin.value.set(cx - hr, by, cz - hr); hu.uHMax.value.set(cx + hr, by + Hh * 2.5 + Rr, cz + hr);
      }
      hu.uHaze.value = 0.0032 * F.haze * Math.min(1, F.intensity) * F.env;
      F.hmesh.position.addVectors(hu.uHMin.value, hu.uHMax.value).multiplyScalar(0.5); F.hmesh.scale.subVectors(hu.uHMax.value, hu.uHMin.value).addScalar(0.002); F.hmesh.updateMatrixWorld();
      if (dt <= 0) continue;
      // smoke off the tips, embers out of the body, heat into the ground under it
      const strength = F.env * Math.min(1.4, F.intensity);
      if (F.smoke > 0) {
        // a burning line smokes along its whole length: a fan's rate grows with its arc, or a wide front
        // fed a couple of big puffs a second and they rose apart as separate lumps
        const len = F.mode === 1 && F.smokeKind !== 'wisp' ? Math.max(1, Math.min(5, (F.a1 - F.a0) * F.arcR / 0.35)) : 1;
        F.smokeAcc += F.smoke * strength * len * dt;
        while (F.smokeAcc >= 1) { F.smokeAcc -= 1; smokeFromFlame(F); }
      }
      if (F.embers > 0) {
        F.emberAcc += F.embers * strength * 2.5 * dt;
        while (F.emberAcc >= 1) { F.emberAcc -= 1; emberFromFlame(F); }
      }
      if (F.heat > 0) {
        if (F.mode === 1) liveHeatAt({ x: F.pos.x, z: F.pos.z, shape: 1, R: F.arcR, w: F.radius * 1.6, a0: F.a0, a1: F.a1, heat: F.heat * strength, burn: 0, seed: F.seed });
        else if (F.mode === 0 || F.pos.y - F.radius < 0.35) liveHeatAt({ x: F.pos.x, z: F.pos.z, shape: 0, r: F.radius * 2.2 + 0.1, heat: F.heat * strength, burn: 0, seed: F.seed });
      }
    }
    liveHeat.length = Math.min(liveHeat.length, 120);
    void tNow;
  }
  function pointInFlame(F, out, upper) {
    if (F.mode === 1) {
      const a = R(F.a0, F.a1), rr = F.arcR + R(-1, 1) * F.radius;
      return out.set(F.pos.x + Math.cos(a) * rr, F.pos.y + F.height * (upper ? R(0.18, 0.5) : R(0.1, 0.6)), F.pos.z + Math.sin(a) * rr);
    }
    if (F.mode === 2) {
      const ang = R(0, 6.28), rr = F.radius * R(0, 0.7);
      return out.set(F.pos.x + Math.cos(ang) * rr, F.pos.y + (upper ? (F.height - F.radius) * R(0.45, 0.85) : R(-0.3, 0.6) * F.radius), F.pos.z + Math.sin(ang) * rr);
    }
    const ang = R(0, 6.28), rr = F.radius * R(0, 0.8) * (F.swirl ? 1.2 : 1);
    return out.set(F.pos.x + Math.cos(ang) * rr, F.pos.y + F.height * (upper ? (F.swirl ? R(0.82, 1.05) : R(0.6, 0.95)) : R(0.05, 0.5)), F.pos.z + Math.sin(ang) * rr);   // a column's smoke leaves its top, it does not hide its flame
  }
  function smokeFromFlame(F) {
    pointInFlame(F, _a, true);
    if (F.mode === 1 && F.smokeKind !== 'wisp') {   // a front smokes in thick stretches and thin ones, not evenly
      const a = Math.atan2(_a.z - F.pos.z, _a.x - F.pos.x);
      if (rnd() > 0.3 + 0.7 * Math.pow(0.5 + 0.5 * Math.sin(a * 4.3 + F.seed * 1.7), 1.5)) return;
    }
    const s = Math.min(2.2, (F.mode === 1 ? F.radius * 3.6 : F.radius * 2.6) * F.smokeSize) * R(0.75, 1.25);
    _b.set(R(-0.15, 0.15) + F.lean.x * (F.mode === 1 ? 0 : 0.5), R(0.55, 1.0) * Math.min(1.6, 0.6 + F.height * 0.4), R(-0.15, 0.15) + F.lean.y * 0.5);   // hot smoke leaves the fire fast
    if (F.mode === 1) { const a = Math.atan2(_a.z - F.pos.z, _a.x - F.pos.x); _b.x += Math.cos(a) * F.lean.x * 1.5; _b.z += Math.sin(a) * F.lean.x * 1.5; }
    if (F.smokeKind === 'wisp') {   // a small fire gives off thin fibrous wisps, not billows
      spawnSmoke(_a, _b.multiplyScalar(0.6), { type: 2, size: Math.min(0.45, s * 0.3), grow: R(1.8, 2.4), life: R(2.2, 3.4), opacity: R(0.18, 0.3), aspect: R(1.4, 1.9), fibre: 1.1, buoy: R(0.15, 0.3), drag: 0.6, curl: 0.5, glow: 0.1 });
      return;
    }
    if (F.mode === 1) {
      // a grass-fire front: a thin streaked curtain rising straight off the tongues, born small and faint
      // among the tips so it never reads as a ball sitting on the fire, joined into one sheet by its neighbours
      _a.y = F.pos.y + F.height * R(0.45, 0.95);
      _b.set(R(-0.08, 0.08), R(0.55, 0.85) * Math.min(1.5, 0.6 + F.height * 0.4), R(-0.08, 0.08));
      spawnSmoke(_a, _b, { type: 3, size: s * 0.8, grow: R(2.4, 3), life: R(2.8, 4) * F.smokeLife, opacity: R(0.4, 0.55), glow: R(0.6, 0.9) * Math.min(1, F.temp), buoy: R(0.5, 0.8), drag: 0.45, aspect: R(2.0, 2.5), curl: 0.22, fibre: 1 });
      return;
    }
    if (F.swirl) { const dx = _a.x - F.pos.x, dz = _a.z - F.pos.z, dl = Math.hypot(dx, dz) + 1e-3; _b.x += dx / dl * R(0.3, 0.7); _b.z += dz / dl * R(0.3, 0.7); }   // the column's smoke spreads as it climbs
    // a rising sheet off the tips: born inside the flames, tall and thin, spreading and darkening as it
    // climbs, overlapping its neighbours into a broken curtain
    spawnSmoke(_a, _b, { size: s * 0.45, grow: F.swirl ? R(2.2, 2.9) : R(3.4, 4.6), life: R(2.8, 4.2) * Math.min(1.6, 0.7 + F.height * 0.3) * F.smokeLife, opacity: R(0.75, 0.95), glow: (F.swirl ? R(1.1, 1.6) : R(0.5, 0.8)) * Math.min(1, F.temp), buoy: R(0.45, 0.75), drag: 0.55, aspect: R(0.95, 1.25), fibre: 1.2 });
    // and the sheet's root: a faint, wide, short-lived haze just over the tips, lit by them, which
    // joins the columns to the fire and to each other
    if (rnd() < 0) {
      pointInFlame(F, _a, true); _a.y = F.pos.y + F.height * R(0.75, 1.05);
      _b.set(F.lean.x * 0.2, R(0.2, 0.35), F.lean.y * 0.2);
      spawnSmoke(_a, _b, { size: s * R(0.7, 0.9), grow: R(1.6, 2.1), life: R(1.4, 2.0), opacity: R(0.35, 0.5), glow: R(0.2, 0.35) * Math.min(1, F.temp), buoy: 0.25, drag: 1, aspect: R(0.6, 0.85), fibre: 1.3, curl: 0.25 });
    }
  }
  function emberFromFlame(F) {
    pointInFlame(F, _a, false);
    _b.set(R(-0.4, 0.4), R(0.8, 2.2), R(-0.4, 0.4));
    if (F.swirl) {   // a whirl's sparks ride the air spiralling round it, outside the flame
      const ang = R(0, 6.28), rr = F.radius * R(0.95, 1.7);
      _a.set(F.pos.x + Math.cos(ang) * rr, F.pos.y + F.height * Math.pow(rnd(), 1.4) * 0.95, F.pos.z + Math.sin(ang) * rr);
      const dx = _a.x - F.pos.x, dz = _a.z - F.pos.z; _b.x += -dz * F.spin * 0.75 - dx * 0.25; _b.z += dx * F.spin * 0.75 - dz * 0.25;
    }
    spawnSpark(_a, _b, { life: R(1.4, 3.2), size: R(0.003, 0.007), heat: R(0.75, 1), cool: R(0.35, 0.7), drag: R(0.9, 1.5), buoy: R(1.2, 2.2), gravity: 0.05, curl: R(0.8, 1.6), flake: 0.22 });
  }

  // ---------------------------------------------------------------- curl drift for embers and smoke
  // A divergence-free field: the curl of a potential made of a few travelling sine waves per axis.
  const CK = [];
  { const r2 = mulberry32(seed * 31 + 7); for (let ax = 0; ax < 3; ax++) for (let j = 0; j < 4; j++) { const k = new V3(r2() * 2 - 1, r2() * 2 - 1, r2() * 2 - 1).normalize().multiplyScalar(0.9 + r2() * 2.6); CK.push({ ax, k, w: (r2() * 2 - 1) * 0.8, ph: r2() * 6.28, a: 1 / (k.length() * 1.2) }); } }
  const grad = [new V3(), new V3(), new V3()];
  function curlAt(x, y, z, t, out) {
    grad[0].set(0, 0, 0); grad[1].set(0, 0, 0); grad[2].set(0, 0, 0);
    for (const C of CK) { const c = Math.cos(C.k.x * x + C.k.y * y + C.k.z * z + C.w * t + C.ph) * C.a; grad[C.ax].x += C.k.x * c; grad[C.ax].y += C.k.y * c; grad[C.ax].z += C.k.z * c; }
    return out.set(grad[2].y - grad[1].z, grad[0].z - grad[2].x, grad[1].x - grad[0].y);
  }

  // ---------------------------------------------------------------- smoke billows, wisps, ash flakes
  const MAXSMK = 900;
  const smk = { alive: new Uint8Array(MAXSMK), type: new Uint8Array(MAXSMK), p: new Float32Array(MAXSMK * 3), v: new Float32Array(MAXSMK * 3), s0: new Float32Array(MAXSMK), s1: new Float32Array(MAXSMK), rot: new Float32Array(MAXSMK), rotV: new Float32Array(MAXSMK), age: new Float32Array(MAXSMK), life: new Float32Array(MAXSMK), drag: new Float32Array(MAXSMK), buoy: new Float32Array(MAXSMK), col: new Float32Array(MAXSMK * 3), op: new Float32Array(MAXSMK), seed: new Float32Array(MAXSMK), glow: new Float32Array(MAXSMK), asp: new Float32Array(MAXSMK), fib: new Float32Array(MAXSMK), curl: new Float32Array(MAXSMK) };
  let smkCursor = 0;
  // type 0: a billow (torn crisp edge, dry-brush fibres, folds lit by the fire); 1: an ash flake
  function spawnSmoke(pos, vel, { type = 0, size = 0.6, grow = 2.2, life = 2.5, drag = 0.8, buoy = 0.35, color = palette.smoke, opacity = 0.9, glow = 0, aspect = 1, fibre = 1, curl = 0.35, angle = null } = {}) {
    let i = -1;
    for (let k = 0; k < MAXSMK; k++) { const j = (smkCursor + k) % MAXSMK; if (!smk.alive[j]) { i = j; break; } }
    if (i < 0) i = smkCursor;
    smkCursor = (i + 1) % MAXSMK;
    const i3 = i * 3;
    smk.alive[i] = 1; smk.type[i] = type;
    smk.p[i3] = pos.x; smk.p[i3 + 1] = pos.y; smk.p[i3 + 2] = pos.z;
    smk.v[i3] = vel.x; smk.v[i3 + 1] = vel.y; smk.v[i3 + 2] = vel.z;
    smk.s0[i] = size; smk.s1[i] = size * grow; smk.asp[i] = aspect; smk.fib[i] = fibre; smk.curl[i] = curl;
    smk.rot[i] = angle === null ? R(-0.5, 0.5) : angle; smk.rotV[i] = type === 1 ? R(-3, 3) : R(-0.12, 0.12);
    smk.age[i] = 0; smk.life[i] = life; smk.drag[i] = drag; smk.buoy[i] = buoy;
    smk.col[i3] = color.r; smk.col[i3 + 1] = color.g; smk.col[i3 + 2] = color.b; smk.op[i] = opacity; smk.seed[i] = rnd() * 100; smk.glow[i] = glow;
  }
  const smkGeo = new THREE.InstancedBufferGeometry();
  { const q = new THREE.PlaneGeometry(1, 1); smkGeo.index = q.index; smkGeo.setAttribute('position', q.getAttribute('position')); }
  const iSmkPos = new Float32Array(MAXSMK * 3), iSmkA = new Float32Array(MAXSMK * 4), iSmkB = new Float32Array(MAXSMK * 4), iSmkC = new Float32Array(MAXSMK * 4);
  smkGeo.setAttribute('iPos', idyn(iSmkPos, 3)); smkGeo.setAttribute('iA', idyn(iSmkA, 4)); smkGeo.setAttribute('iB', idyn(iSmkB, 4)); smkGeo.setAttribute('iC', idyn(iSmkC, 4));
  smkGeo.instanceCount = 0;
  const smkMat = new THREE.ShaderMaterial({
    uniforms: { uTime: uniforms.uTime, tNoise: uniforms.tNoise, uAmbient: { value: new V3() }, uGlowCol: { value: new V3() }, uCamRight: { value: new V3() }, uCamUp: { value: new V3() }, ...lightUniforms },
    vertexShader: /* glsl */`
      attribute vec3 iPos; attribute vec4 iA; attribute vec4 iB; attribute vec4 iC;   // A: size, rot, age, seed  B: albedo, opacity  C: type, aspect, glow, fibre
      uniform vec3 uCamRight, uCamUp;
      uniform vec3 uLightPos[${NL}]; uniform vec3 uLightCol[${NL}];
      varying vec2 vQ; varying vec4 vA; varying vec4 vB; varying vec4 vC; varying vec3 vLight; varying vec3 vLdir; varying vec2 vUp; varying float vY; varying float vDepth;
      void main(){
        float c = cos(iA.y), s = sin(iA.y);
        vec2 p = position.xy;
        if (iC.x > .5 && iC.x < 1.5) p.x *= .7;
        else { float as = mix(iC.y, 1., clamp(iA.z * 1.3, 0., 1.)); p *= vec2(1. / sqrt(as), sqrt(as)); }   // smoke leaves the flames tall and narrow, then spreads
        vec2 o = vec2(c * p.x - s * p.y, s * p.x + c * p.y) * iA.x;
        vec3 wp = iPos + uCamRight * o.x + uCamUp * o.y;
        // the fire lights each corner: summed colour and the mean direction it comes from
        vec3 Ls = vec3(0.), Ld = vec3(0.);
        for (int i = 0; i < ${NL}; i++) {
          vec3 L = uLightPos[i] - wp; float d2 = dot(L, L) + .05;
          vec3 li = uLightCol[i] / (1. + d2 * 1.9);   // lit warm close to the fire, darker above it
          Ls += li; Ld += L * inversesqrt(d2) * dot(li, vec3(.3, .55, .15));
        }
        vLight = Ls; vLdir = (viewMatrix * vec4(Ld, 0.)).xyz;
        vec2 upv = (viewMatrix * vec4(0., 1., 0., 0.)).xy; upv /= max(length(upv), 1e-4);
        vUp = vec2(c * upv.x + s * upv.y, -s * upv.x + c * upv.y);   // world up, in the sprite's own frame
        vQ = position.xy * 2.; vA = iA; vB = iB; vC = iC; vY = wp.y;
        vec4 mv = viewMatrix * vec4(wp, 1.);
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: TNOISE_GLSL + /* glsl */`
      uniform vec3 uAmbient, uGlowCol;
      varying vec2 vQ; varying vec4 vA; varying vec4 vB; varying vec4 vC; varying vec3 vLight; varying vec3 vLdir; varying vec2 vUp; varying float vY; varying float vDepth;
      vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .103, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
      // cauliflower: the union of round domes of different sizes, one per cell; creases where they meet
      float lobes(vec2 x, float sd){
        vec2 i = floor(x), f = fract(x);
        float acc = 0.;
        for (int y = -1; y <= 1; y++) for (int k = -1; k <= 1; k++) {
          vec2 g = vec2(float(k), float(y)), h = hash22(i + g + sd);
          vec2 c = g + .2 + .6 * h - f;
          float rad = .62 + .38 * h.y;
          float d2 = dot(c, c) / (rad * rad);
          acc += exp(8. * sqrt(max(1. - d2, 0.)) * rad);
        }
        return log(acc) / 8. - .14;   // a soft union: neighbouring domes melt into each other at the creases
      }
      void main(){
        float age = vA.z, seed = vA.w;
        float r = length(vQ);
        if (r > 1.) discard;
        float a; vec3 col;
        if (vC.x < .5 || vC.x > 2.5) {
          // A billow of thick smoke: round lobes with sharp creases, lobes on lobes (abs-noise octaves),
          // shaded as a relief lit by the fire: undersides facing it glow, creases and tops fall dark.
          // Type 3 is the curtain off a grass-fire front: the same light, but streaked along the rise and thin.
          float cur = step(2.5, vC.x);
          float along = dot(vQ, vUp), across = vQ.x * vUp.y - vQ.y * vUp.x;
          vec2 qq = vec2(across, along) / (1. + age * .3);
          vec2 wq = qq + tn(vec3(qq * .9, seed + age * .25)).xy * .18;          // the domes churn a little as it rolls
          float sd = floor(seed * 7.);
          float lf = clamp(vA.x * 1.1, 3.2, 7.);                               // lobes about forty centimetres across, whatever the sprite's size
          float B = lobes(wq * lf * .55, sd + 5.) * .55 + lobes(wq * lf * 1.3, sd) * .45;                  // the mass's big lobes: its outline
          vec3 sq = vec3(wq * lf * .75, seed + age * .4);
          float Bd = (1. - abs(tn(sq).z)) * .55 + (1. - abs(tn(sq * 2.1 + 5.3).w)) * .3 + (tn(sq * 4.3 + 1.1).y * .5 + .5) * .15;   // billows on them: ridged, not cells
          Bd = Bd * Bd * 1.2;
          if (cur > .5) {
            // streaks along the rise: the noise is stretched up about 2.5:1 and drifts up through the sprite
            vec3 sc = vec3(across * 2.1, along * 1.25 - age * 1.1, seed * 1.3);
            sc.xy += tn(sc * .7 + 9.).xy * .55;                                  // curled, so the streaks tear and wisp instead of smearing
            float s1 = 1. - abs(tn(sc).x), s2 = 1. - abs(tn(sc * 2.1 + 4.7).y), s3 = tn(sc * 4.3 + 1.3).z * .5 + .5;
            B = .45 + (s1 * .6 + s2 * .4 - .62) * .9;
            Bd = s1 * .45 + s2 * .35 + s3 * .2;
          }
          float b3 = tn(vec3(qq * 6., seed)).w;
          float sph = 1. - r * r;
          float Hh = sph * .3 + B * .5 + Bd * .55;
          float fibre = min(vC.w, 1.5), pocket = max(vC.w - 4.5, 0.);
          // density: the dome's falloff times the lobes, so the outline is lobed and fades out well inside the quad
          float m = (pow(max(sph, 0.), .6) + (B - .6) * 1.25 + (Bd - .6) * .55) * smoothstep(1., .86, r) - .08 * smoothstep(.2, .9, along) * fibre * (abs(b3) * 2. - .3);
          float th = .4 + .08 * age;
          a = smoothstep(th - .06, th + .3 + .1 * age, m);                   // soft: smoke has no surface, and neighbours blend into one mass
          if (cur > .5) a = smoothstep(1., .25, r) * smoothstep(.22, .75, Bd) * smoothstep(-1., -.2, along);   // a curtain is thin: its streaks show, the sky between them, and it has no edge or underside of its own
          a *= smoothstep(-1.05, -.6, along + age * .2);    // the underside thins a little into the flames it rises from (they are laid over it)
          // relief: screen-space slope of the lobes, in sprite units
          vec2 gs = vec2(dFdx(Hh), dFdy(Hh)) / max(length(vec2(dFdx(vQ.x), dFdy(vQ.x))), 1e-5);
          // the mass is rounded (its underside faces down to the fire and toward a camera below it), and its lobes bend that
          vec2 qs = vec2(vQ.x, vQ.y);
          vec3 N = normalize(vec3(qs * .08 - gs * .085 / lf * 2.3, 1.));   // no ball shading: the firelight's own falloff (per corner, in world space) shades the mass as one
          float lw = length(vLdir);
          vec3 Ld = lw > 1e-5 ? vLdir / lw : vec3(0., -1., .3);
          float diff = max(dot(N, Ld) * .55 + .45, .22);   // wrapped, and a little light always scatters through from a fire behind it
          // the side of the mass away from the fire is in its own shadow
          vec2 Ls = normalize(Ld.xy + 1e-4);
          vec2 qv = vec2(dot(vQ, vec2(1., 0.)), dot(vQ, vec2(0., 1.)));   // sprite frame
          float ao = mix((.58 + .42 * smoothstep(.12, .62, Bd)) * (.72 + .28 * smoothstep(.1, .5, B)), .3 + .7 * smoothstep(.25, .85, Bd), cur);   // creases between lobes stay darker
          vec3 alb = vB.rgb * (.7 + .5 * Bd);
          float upN = .55 + .45 * clamp(dot(N.xy, normalize(vUp)) , -1., 1.);
          vec3 vL = vLight / (1. + dot(vLight, vec3(.3, .5, .2)) * .45);      // a strong light saturates on the smoke instead of bleaching it
          vL = mix(vL, vec3(dot(vL, vec3(.3, .5, .2))), .45);                    // scattered through grey smoke the firelight loses some of its colour
          float thin = 1. - smoothstep(th, th + .4, m);
          col = alb * ao * (uAmbient * upN * 1.6 + vL * diff * 1.7) + alb * vL * thin * .15;
          col += alb * ao * vec3(.3, .31, .34) * cur * smoothstep(1.2, 3.5, vY);   // high up, a curtain is faintly grey against the night
          // fresh smoke over the flames is lit hard from right under it: a warm band that fades within a metre or two
          col += uGlowCol * vC.z * ao * (.3 + .7 * Bd) * (.35 + .65 * diff) * mix(smoothstep(.6, 0., age) * smoothstep(.6, -.75, along) * .9,
                 smoothstep(2.4, .7, vY) * .75, cur);   // lit from right under it: a billow's underside; a curtain by its height above the front, as one sheet
          // a hot pocket inside a burst's smoke: fire still burning deep in the creases, its light half smothered
          if (pocket > 0.) {
            // ragged cracks of fire between the billows: thin ridged lines, only in the creases, never a round glow
            float spot = smoothstep(.45, .75, tn(vec3(wq * 1.6, seed * 3.1)).x * .5 + .5);
            vec2 wc = wq * 3.4 + tn(vec3(wq * 2.5, seed + 7.)).xy * .35;
            float crack = smoothstep(.72, .93, 1. - abs(tn(vec3(wc, seed * 2.3)).y)) * (1. - smoothstep(.3, .7, Bd));
            float deep = sph * spot * crack;
            col += vec3(1., .36, .07) * pocket * deep * (1. - smoothstep(.2, .75, age)) * 4. + vec3(.45, .11, .02) * pocket * spot * sph * (1. - smoothstep(.25, .6, Bd)) * (1. - smoothstep(.1, .6, age)) * .35;
          }
        } else if (vC.x > 1.5) {
          // a wisp: a thin fibrous strand of smoke off a small fire
          // the billow grows: its noise spreads from the centre instead of sliding across it
          vec2 qq = vQ / (1. + age * .45);
          vec3 s = vec3(qq * 1.75, seed + age * .55);
          float n0 = tn(s).x, n1 = tn(s * 2.03 + 1.7).y, n2 = tn(s * 4.07 + 3.1).z;
          float n = (n0 * .5 + n1 * .25 + n2 * .14) * .9 + .5;
          float along = dot(vQ, vUp), across = vQ.x * vUp.y - vQ.y * vUp.x;
          // dry-brush fibres stretched along the rise fray the rim
          vec4 fb2 = tn(vec3(across * 36., along * 4.4, seed + 3.));
          float fib = tn(vec3(across * 15., along * 2.1 - age * .7, seed * 1.7)).x * .6 + fb2.y * .4;
          // an inverted cone, not an ellipse: narrow where it rose from the flames and widening above, so
          // even a detached mass ends below in a frayed stem instead of a round hanging lobe
          r = length(vec2(across * (1. + .7 * smoothstep(.5, -.9, along) * (1. - .4 * age)), along));
          float rimZ = smoothstep(.25, 1., r);
          float topZ = smoothstep(-.1, .85, along);
          float botZ = 1. - smoothstep(-.9, .3, along);
          float m = (n + fib * .12 * vC.w * (rimZ * rimZ + topZ * .9 + botZ * 1.4)) * smoothstep(1., .22, r);   // torn, fibrous tops, not round puffs
          m -= (.2 - fib * .14) * botZ * (1. - .5 * age);   // the underside frays into rising streaks, not a rounded hanging lobe
          // it erodes only a little and thins as it spreads: eroding it to the end left floating lumps
          float th = mix(.2, .36, pow(age, .8));
          float ew = .2 + .2 * (1. - smoothstep(0., .45, age)) + .3 * smoothstep(.5, 1., age);   // and soft again as it spreads out and thins: old smoke dissolves into haze instead of drifting off as lumps   // soft and see-through while it is fresh over the flames, edges tearing as it climbs
          a = smoothstep(th, th + ew, m);
          float band = 1. - smoothstep(th + .02, th + .22, m);           // 1 at the edge, 0 deep inside
          a *= 1. - band * smoothstep(-.05, .5, -fib) * .72 * vC.w;     // the rim's strokes go partly see-through, like a brush running dry
          // flecks of soot tearing off just outside the edge
          // fine soot flecks just outside the rim, small and few: large ones read as floating rocks
          float fleck = smoothstep(.68, .76, tn(vec3(vQ * 11., seed * 2.3 + age * .3)).z * .5 + .5) * (1. - a) * smoothstep(th - .12, th - .02, m);
          a = max(a, fleck * .5 * smoothstep(.15, .5, age));
          float b0 = mix(-1.05, -.5, sqrt(age));
          a *= smoothstep(b0, b0 + 1., along);   // a wispy underside, never a round hanging lobe: younger smoke fills the column below
          // inner folds: a normal bent by the billow's own noise, lit from where the fire is
          vec2 g = vec2(dFdx(n), dFdy(n)) / max(fwidth(vQ.x) + fwidth(vQ.y), 1e-4) * .9;   // free: a soft billow does not need an exact gradient
          // a nearly flat normal bent by the folds: the light's gradient comes from where the fire is (the
          // corners nearer it are brighter), not from a rounded shape, which lit every puff as a rimmed lump
          vec3 N = normalize(vec3(vQ * .12 - g * .25, 1.));
          float lw = length(vLdir);
          float diff = lw > 1e-5 ? max(dot(N, vLdir / lw) * .5 + .5, 0.) : .3;
          vec3 alb = vB.rgb * (.5 + 1. * n);
          float thin = 1. - smoothstep(th, th + .3, m);
          col = alb * (uAmbient + vLight * diff * 1.45) + vLight * vB.rgb * thin * .08;
          // fresh smoke right over the tips still glows: only while it is young and low, or every billow
          // that kept a little of it rose as a lit orange lump
          col += uGlowCol * vC.z * (.35 + .65 * n) * smoothstep(1.4, .3, vY) * smoothstep(.22, 0., age) * .8;
        } else {
          // an ash flake: a torn scrap, tumbling
          float ang = atan(vQ.y, vQ.x);
          float lim = .6 + .26 * tn(vec3(cos(ang) * 1.3, sin(ang) * 1.3, seed)).x + .1 * tn(vec3(cos(ang) * 4., sin(ang) * 4., seed + 5.)).y;
          a = 1. - smoothstep(lim - .06, lim, r);
          col = vB.rgb * (uAmbient * 2. + vLight * .5) + uGlowCol * vC.z * 1.4;   // a glowing rim while it is still hot
        }
        a *= vB.a * smoothstep(0., vC.x < .5 ? .025 : vC.x > 2.5 ? .07 : .1, age) * (1. - smoothstep(.45, 1., age)) * (vC.x < .5 || vC.x > 1.5 ? 1. - .35 * age : 1.);
        a *= smoothstep(0., .25, vY) * smoothstep(.15, .9, vDepth);   // soft against the ground and the lens
        gl_FragColor = vec4(col * a, a);
      }`,
    transparent: true, depthWrite: false, ...BLEND_OVER,
  });
  const smkMesh = new THREE.Mesh(smkGeo, smkMat); smkMesh.frustumCulled = false; smkMesh.renderOrder = 10;
  group.add(smkMesh);
  const smkOrder = new Int32Array(MAXSMK), smkDepth = new Float32Array(MAXSMK);
  function updateSmoke(dt) {
    const t = clock.sim;
    const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
    camera.getWorldDirection(_e);
    let n = 0;
    for (let i = 0; i < MAXSMK; i++) {
      if (!smk.alive[i]) continue;
      const i3 = i * 3;
      if (dt > 0) {
        smk.age[i] += dt;
        if (smk.age[i] > smk.life[i]) { smk.alive[i] = 0; continue; }
        const u = smk.age[i] / smk.life[i];
        curlAt(smk.p[i3] * 0.55, smk.p[i3 + 1] * 0.55, smk.p[i3 + 2] * 0.55, t * 0.5, _a);
        const ck = smk.curl[i] * (0.3 + u);
        let vx = smk.v[i3] + _a.x * ck * dt, vy = smk.v[i3 + 1] + (smk.buoy[i] * (1 - u * 0.7) + _a.y * ck * 0.5) * dt, vz = smk.v[i3 + 2] + _a.z * ck * dt;
        const dr = Math.exp(-smk.drag[i] * dt); vx *= dr; vy *= dr; vz *= dr;
        smk.p[i3] += vx * dt; smk.p[i3 + 1] += vy * dt; smk.p[i3 + 2] += vz * dt;
        if (smk.p[i3 + 1] < 0.05) { smk.p[i3 + 1] = 0.05; vy = Math.abs(vy) * 0.2; }
        smk.v[i3] = vx; smk.v[i3 + 1] = vy; smk.v[i3 + 2] = vz;
        smk.rot[i] += smk.rotV[i] * dt;
      }
      smkOrder[n] = i; smkDepth[i] = (smk.p[i3] - cx) * _e.x + (smk.p[i3 + 1] - cy) * _e.y + (smk.p[i3 + 2] - cz) * _e.z;
      n++;
    }
    const ord = Array.from(smkOrder.subarray(0, n)).sort((x, y) => smkDepth[y] - smkDepth[x]);   // far to near
    for (let k = 0; k < n; k++) {
      const i = ord[k], i3 = i * 3, a = smk.age[i] / smk.life[i], o3 = k * 3, o4 = k * 4;
      iSmkPos[o3] = smk.p[i3]; iSmkPos[o3 + 1] = smk.p[i3 + 1]; iSmkPos[o3 + 2] = smk.p[i3 + 2];
      iSmkA[o4] = smk.s0[i] + (smk.s1[i] - smk.s0[i]) * (1 - Math.exp(-2.4 * a)); iSmkA[o4 + 1] = smk.rot[i]; iSmkA[o4 + 2] = a; iSmkA[o4 + 3] = smk.seed[i];
      iSmkB[o4] = smk.col[i3]; iSmkB[o4 + 1] = smk.col[i3 + 1]; iSmkB[o4 + 2] = smk.col[i3 + 2]; iSmkB[o4 + 3] = smk.op[i];
      iSmkC[o4] = smk.type[i]; iSmkC[o4 + 1] = smk.asp[i]; iSmkC[o4 + 2] = smk.glow[i] * Math.exp(-smk.age[i] * (smk.type[i] === 1 ? 0.8 : 1.6)); iSmkC[o4 + 3] = smk.fib[i];
    }
    smkGeo.instanceCount = debug.noSmoke ? 0 : n;
    for (const k of ['iPos', 'iA', 'iB', 'iC']) smkGeo.getAttribute(k).needsUpdate = true;
  }

  // ---------------------------------------------------------------- sparks and embers
  // Additive streaks that drift on the curl field and cool white -> orange -> dull red; a cooled one
  // may live on as an ash flake. Few at a time: in numbers they read as confetti.
  const MAXSPK = 1200;
  const spk = { alive: new Uint8Array(MAXSPK), p: new Float32Array(MAXSPK * 3), v: new Float32Array(MAXSPK * 3), age: new Float32Array(MAXSPK), life: new Float32Array(MAXSPK), size: new Float32Array(MAXSPK), heat: new Float32Array(MAXSPK), cool: new Float32Array(MAXSPK), drag: new Float32Array(MAXSPK), buoy: new Float32Array(MAXSPK), grav: new Float32Array(MAXSPK), curl: new Float32Array(MAXSPK), flake: new Float32Array(MAXSPK) };
  let spkCursor = 0;
  function spawnSpark(pos, vel, { life = 0.8, size = 0.006, heat = 1, cool = 1, drag = 1.2, buoy = 0, gravity = 1, curl = 0, flake = 0 } = {}) {
    let i = -1;
    for (let k = 0; k < MAXSPK; k++) { const j = (spkCursor + k) % MAXSPK; if (!spk.alive[j]) { i = j; break; } }
    if (i < 0) i = spkCursor;
    spkCursor = (i + 1) % MAXSPK;
    const i3 = i * 3;
    spk.alive[i] = 1; spk.p[i3] = pos.x; spk.p[i3 + 1] = pos.y; spk.p[i3 + 2] = pos.z;
    spk.v[i3] = vel.x; spk.v[i3 + 1] = vel.y; spk.v[i3 + 2] = vel.z;
    spk.age[i] = 0; spk.life[i] = life; spk.size[i] = size; spk.heat[i] = heat; spk.cool[i] = cool; spk.drag[i] = drag; spk.buoy[i] = buoy; spk.grav[i] = gravity; spk.curl[i] = curl; spk.flake[i] = flake;
  }
  function sparks(pos, { count = 20, dir = null, spread = 1, speed = [2, 6], life = [0.4, 1.0], size = [0.003, 0.007], heat = [0.8, 1], cool = [0.8, 1.6], gravity = 1, drag = 1.1, buoy = 0, curl = 0.3, flake = 0.15 } = {}) {
    for (let k = 0; k < count; k++) {
      _a.set(R(-1, 1), R(-1, 1), R(-1, 1)); if (_a.lengthSq() > 1) _a.normalize();
      if (dir) _a.multiplyScalar(spread).add(dir).normalize(); else _a.normalize();
      spawnSpark(pos, _a.multiplyScalar(R(speed[0], speed[1])), { life: R(life[0], life[1]), size: R(size[0], size[1]), heat: R(heat[0], heat[1]), cool: R(cool[0], cool[1]), gravity, drag, buoy, curl, flake });
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
        if (h.w < .05) { gl_Position = vec4(2., 2., 2., 1.); return; }
        vec2 hr = uResolution * .5;
        vec2 sh = h.xy / h.w * hr, st = t.xy / max(t.w, 1e-3) * hr;
        float w = clamp(iS.x * projectionMatrix[1][1] * hr.y / h.w, 1.5 * uDpr, 4.2 * uDpr);
        vec2 d = sh - st; float L = length(d);
        float maxL = min(w * 2.5, 7. * uDpr);          // dots and short dashes: long streaks read as rain
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
        float a = 1. - smoothstep(vW * .3, vW, dist);
        a *= .55 + .45 * smoothstep(-vLen - vW, vLen, vL.x);     // the head burns brighter than its tail
        float h = clamp(vHeat, 0., 1.);
        vec3 c = h > .66 ? mix(vec3(3., 1.05, .22), vec3(4.2, 2.1, .7), (h - .66) / .34)
               : h > .33 ? mix(vec3(1.1, .16, .025), vec3(3., 1.05, .22), (h - .33) / .33)
               : mix(vec3(.08, .006, .001), vec3(1.1, .16, .025), h / .33);
        gl_FragColor = vec4(c * a, 1.);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const spkMesh = new THREE.Mesh(spkGeo, spkMat); spkMesh.frustumCulled = false; spkMesh.renderOrder = 31; spkMesh.layers.set(LATE_LAYER);
  group.add(spkMesh);
  function updateSparks(dt) {
    const t = clock.sim;
    let ns = 0;
    for (let i = 0; i < MAXSPK; i++) {
      if (!spk.alive[i]) continue;
      const i3 = i * 3;
      if (dt > 0) {
        spk.age[i] += dt;
        const heatNow = spk.heat[i] * Math.exp(-spk.age[i] * spk.cool[i]);
        if (spk.age[i] > spk.life[i] || heatNow < 0.06) {
          spk.alive[i] = 0;
          if (rnd() < spk.flake[i] * 0.6) spawnSmoke(_a.set(spk.p[i3], spk.p[i3 + 1], spk.p[i3 + 2]), _b.set(spk.v[i3] * 0.6, spk.v[i3 + 1] * 0.4, spk.v[i3 + 2] * 0.6), { type: 1, size: R(0.006, 0.014), grow: 1, life: R(1.4, 2.8), drag: 1.6, buoy: R(-0.15, 0.25), color: palette.flake, opacity: 1, glow: 0.35, curl: 0.6 });
          continue;
        }
        let vx = spk.v[i3], vy = spk.v[i3 + 1], vz = spk.v[i3 + 2];
        if (spk.curl[i] > 0) { curlAt(spk.p[i3] * 0.9, spk.p[i3 + 1] * 0.9, spk.p[i3 + 2] * 0.9, t * 0.7, _a); vx += _a.x * spk.curl[i] * dt * 2.2; vy += _a.y * spk.curl[i] * dt * 1.2; vz += _a.z * spk.curl[i] * dt * 2.2; }
        vy += (spk.buoy[i] * Math.exp(-spk.age[i] * 0.6) - 9.8 * spk.grav[i]) * dt;
        const dr = Math.exp(-spk.drag[i] * dt); vx *= dr; vy *= dr; vz *= dr;
        spk.p[i3] += vx * dt; spk.p[i3 + 1] += vy * dt; spk.p[i3 + 2] += vz * dt;
        if (spk.p[i3 + 1] < 0.01) { spk.p[i3 + 1] = 0.01; if (vy < 0) { vy *= -0.3; vx *= 0.6; vz *= 0.6; } }
        spk.v[i3] = vx; spk.v[i3 + 1] = vy; spk.v[i3 + 2] = vz;
      }
      const o3 = ns * 3, o2 = ns * 2;
      iSpkPos[o3] = spk.p[i3]; iSpkPos[o3 + 1] = spk.p[i3 + 1]; iSpkPos[o3 + 2] = spk.p[i3 + 2];
      iSpkTail[o3] = spk.p[i3] - spk.v[i3] * 0.028; iSpkTail[o3 + 1] = spk.p[i3 + 1] - spk.v[i3 + 1] * 0.028; iSpkTail[o3 + 2] = spk.p[i3 + 2] - spk.v[i3 + 2] * 0.028;
      iSpkS[o2] = spk.size[i]; iSpkS[o2 + 1] = spk.heat[i] * Math.exp(-spk.age[i] * spk.cool[i]) * Math.min(1, spk.age[i] * 30 + 0.3);
      ns++;
    }
    spkGeo.instanceCount = ns;
    for (const n of ['iPos', 'iTail', 'iS']) spkGeo.getAttribute(n).needsUpdate = true;
  }

  // ---------------------------------------------------------------- glints: a white-hot point (the ignition spark, a hit)
  const MAXGL = 12;
  const gl = { alive: new Uint8Array(MAXGL), p: new Float32Array(MAXGL * 3), age: new Float32Array(MAXGL), life: new Float32Array(MAXGL), size: new Float32Array(MAXGL), I: new Float32Array(MAXGL) };
  const glGeo = new THREE.InstancedBufferGeometry();
  { const q = new THREE.PlaneGeometry(1, 1); glGeo.index = q.index; glGeo.setAttribute('position', q.getAttribute('position')); }
  const iGlP = new Float32Array(MAXGL * 3), iGlA = new Float32Array(MAXGL * 2);
  glGeo.setAttribute('iPos', idyn(iGlP, 3)); glGeo.setAttribute('iA', idyn(iGlA, 2)); glGeo.instanceCount = 0;
  const glMat = new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: /* glsl */`attribute vec3 iPos; attribute vec2 iA; varying vec2 vQ; varying float vI;
      void main(){ vec4 mv = viewMatrix * vec4(iPos, 1.); mv.xy += position.xy * iA.x * 2.; vQ = position.xy * 2.; vI = iA.y; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`varying vec2 vQ; varying float vI;
      void main(){ float r = length(vQ); float g = exp(-r * r * 90.) * 6. + exp(-r * 7.) * .35; g *= 1. - smoothstep(.8, 1., r);
        gl_FragColor = vec4(vec3(1., .78, .5) * g * vI, 1.); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const glMesh = new THREE.Mesh(glGeo, glMat); glMesh.frustumCulled = false; glMesh.renderOrder = 32; glMesh.layers.set(LATE_LAYER); group.add(glMesh);
  function glint(pos, { size = 0.05, life = 0.3, intensity = 1 } = {}) {
    let i = 0; for (let k = 0; k < MAXGL; k++) if (!gl.alive[k]) { i = k; break; }
    gl.alive[i] = 1; gl.p[i * 3] = pos.x; gl.p[i * 3 + 1] = pos.y; gl.p[i * 3 + 2] = pos.z; gl.age[i] = 0; gl.life[i] = life; gl.size[i] = size; gl.I[i] = intensity;
  }
  function updateGlints(dt) {
    let n = 0;
    for (let i = 0; i < MAXGL; i++) {
      if (!gl.alive[i]) continue;
      gl.age[i] += dt; const x = gl.age[i] / gl.life[i];
      if (x > 1) { gl.alive[i] = 0; continue; }
      iGlP[n * 3] = gl.p[i * 3]; iGlP[n * 3 + 1] = gl.p[i * 3 + 1]; iGlP[n * 3 + 2] = gl.p[i * 3 + 2];
      iGlA[n * 2] = gl.size[i] * (0.6 + 0.4 * Math.min(1, x * 6)); iGlA[n * 2 + 1] = gl.I[i] * Math.min(1, x * 12) * (1 - x) * (1 - x);
      n++;
    }
    glGeo.instanceCount = n;
    glGeo.getAttribute('iPos').needsUpdate = true; glGeo.getAttribute('iA').needsUpdate = true;
  }

  // ---------------------------------------------------------------- pressure fronts: refraction only
  const ringGeo = new THREE.PlaneGeometry(2, 2, 1, 1);
  const rings = [];
  for (let i = 0; i < 12; i++) {
    const dm = new THREE.ShaderMaterial({
      uniforms: { uThick: { value: 0.05 }, uAmp: { value: 0 } },
      vertexShader: /* glsl */`varying vec2 vL; varying vec2 vRad; void main(){ vL = position.xy; vRad = (modelViewMatrix * vec4(position.xy, 0., 0.)).xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
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
    const mesh = new THREE.Mesh(ringGeo, dm); mesh.layers.set(DISTORT_LAYER); mesh.visible = false; mesh.frustumCulled = false;
    group.add(mesh);
    rings.push({ alive: false, mesh, dm, age: 0, delay: 0, life: 0.3, R: 2, thick: 0.05, amp: 0.02, center: new V3(), q: new THREE.Quaternion() });
  }
  function ring(center, normal, { radius = 2.5, thick = 0.06, life = 0.35, delay = 0, amp = 0.025 } = {}) {
    const G = rings.find((r) => !r.alive) || rings[0];
    G.alive = true; G.age = -delay; G.life = life; G.R = radius; G.thick = thick; G.amp = amp;
    G.center.copy(center); G.q.setFromUnitVectors(ZAXIS, _a.copy(normal).normalize());
  }
  function viewUnitsPerUV(p) {
    const d = Math.max(0.2, _c.copy(p).sub(camera.position).dot(camera.getWorldDirection(_d)));
    return 2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5);
  }
  function updateRings(dt) {
    for (const G of rings) {
      if (!G.alive) continue;
      G.age += dt;
      if (G.age > G.life) { G.alive = false; G.mesh.visible = false; continue; }
      if (G.age < 0) { G.mesh.visible = false; continue; }
      const x = G.age / G.life, r = Math.max(0.05, G.R * (1 - Math.pow(2, -10 * x)));
      G.mesh.visible = true; G.mesh.position.copy(G.center); G.mesh.quaternion.copy(G.q); G.mesh.scale.setScalar(r);
      G.dm.uniforms.uThick.value = Math.min(0.45, G.thick / r * (1 + x * 1.5));
      G.dm.uniforms.uAmp.value = G.amp / viewUnitsPerUV(G.center) * Math.pow(1 - x, 1.2);
    }
  }

  // ---------------------------------------------------------------- impact frames
  const imp = { active: false, t: 0, frame: 'none', flash: 0, shake: 0, mode: 'axial', dir: new THREE.Vector2(0, 1), fisheye: 0, dim: 0, at: new V3() };
  const flashLog = [];
  function impact({ hold = 0.08, frame = 'center', flash: fl = 0, shake = 0.012, shakeMode = 'axial', shakeDir = null, fisheye = 0, at = null, radius = 0.42 } = {}) {
    const now = clock.real;
    while (flashLog.length && now - flashLog[0] > 1) flashLog.shift();
    const inverts = frame !== 'none' || fl > 0;
    const safe = options.flashes === 'safe' || (inverts && flashLog.length >= 3);   // never more than 3 flashes a second
    if (inverts && !safe) flashLog.push(now);
    imp.active = true; imp.t = 0;
    compositeMat.uniforms.uSeed.value = rnd() * 100; compositeMat.uniforms.uNegRadius.value = radius;
    imp.frame = safe ? 'none' : frame; imp.flash = safe ? 0 : fl; imp.dim = safe && inverts ? 0.32 : 0;
    imp.shake = shake * options.shake; imp.mode = shakeMode; imp.fisheye = fisheye * options.fisheye;
    if (shakeDir) imp.dir.copy(shakeDir).normalize(); else imp.dir.set(0, 1);
    if (at) imp.at.copy(at);
    clock.hold = Math.max(clock.hold, hold);
  }

  // ---------------------------------------------------------------- render targets and post
  const rtOpts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: true, samples: 0, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
  const rtColor = new THREE.WebGLRenderTarget(1, 1, rtOpts);
  const rtDistort = new THREE.WebGLRenderTarget(1, 1, { ...rtOpts, depthBuffer: false });
  const rtFlame = new THREE.WebGLRenderTarget(1, 1, { ...rtOpts, depthBuffer: false });
  const flameOverMat = new THREE.ShaderMaterial({
    vertexShader: FS_VERT,
    uniforms: { tSrc: { value: rtFlame.texture }, uTexel: { value: new THREE.Vector2(1, 1) }, uSharp: { value: 0.5 } },
    fragmentShader: /* glsl */`
      uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uSharp; varying vec2 vUv;
      // Catmull-Rom from nine bilinear taps: the reduced flame layer comes up sharp instead of soft or stepped
      void main(){
        vec2 sz = 1. / uTexel, sp = vUv * sz, tp = floor(sp - .5) + .5, f = sp - tp;
        vec2 w0 = f * (-.5 + f * (1. - .5 * f)), w1 = 1. + f * f * (-2.5 + 1.5 * f), w2 = f * (.5 + f * (2. - 1.5 * f)), w3 = f * f * (-.5 + .5 * f);
        vec2 w12 = w1 + w2, o12 = w2 / w12;
        vec2 t0 = (tp - 1.) * uTexel, t3 = (tp + 2.) * uTexel, t12 = (tp + o12) * uTexel;
        vec4 c = texture2D(tSrc, vec2(t0.x, t0.y)) * w0.x * w0.y + texture2D(tSrc, vec2(t12.x, t0.y)) * w12.x * w0.y + texture2D(tSrc, vec2(t3.x, t0.y)) * w3.x * w0.y
               + texture2D(tSrc, vec2(t0.x, t12.y)) * w0.x * w12.y + texture2D(tSrc, t12) * w12.x * w12.y + texture2D(tSrc, vec2(t3.x, t12.y)) * w3.x * w12.y
               + texture2D(tSrc, vec2(t0.x, t3.y)) * w0.x * w3.y + texture2D(tSrc, vec2(t12.x, t3.y)) * w12.x * w3.y + texture2D(tSrc, vec2(t3.x, t3.y)) * w3.x * w3.y;
        // a cubic B-spline from four bilinear taps: soft, never stepped; blended in so thin tips at half
        // resolution do not crumble into blocks
        vec2 b0 = (1. - f) * (1. - f) * (1. - f) / 6., b1 = (4. - 6. * f * f + 3. * f * f * f) / 6., b2 = (1. + 3. * f + 3. * f * f - 3. * f * f * f) / 6., b3 = f * f * f / 6.;
        vec2 g0 = b0 + b1, g1 = b2 + b3, h0 = (tp - 1. + b1 / g0) * uTexel, h1 = (tp + 1. + b3 / g1) * uTexel;
        vec4 bs = (texture2D(tSrc, h0) * g0.x + texture2D(tSrc, vec2(h1.x, h0.y)) * g1.x) * g0.y + (texture2D(tSrc, vec2(h0.x, h1.y)) * g0.x + texture2D(tSrc, h1) * g1.x) * g1.y;
        gl_FragColor = max(mix(bs, c, uSharp), vec4(0.));
      }`,
    depthTest: false, depthWrite: false, transparent: true, ...BLEND_OVER,
  });
  const BLOOM_LEVELS = 5;
  const down = [], up = [];
  for (let i = 0; i < BLOOM_LEVELS; i++) {
    down.push(new THREE.WebGLRenderTarget(1, 1, { ...rtOpts, depthBuffer: false }));
    up.push(new THREE.WebGLRenderTarget(1, 1, { ...rtOpts, depthBuffer: false }));
  }
  const prefilterMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: null }, uHalf: { value: new THREE.Vector2() }, uThreshold: { value: 2.2 }, uKnee: { value: 0.6 } },
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
      uAspect: { value: 1 }, uBloom: { value: 0.16 }, uBloomTint: { value: new V3(1.0, 0.78, 0.6) }, uExposure: { value: 1 },
      uShake: { value: new THREE.Vector2() }, uZoom: { value: 1 }, uFisheye: { value: 0 },
      uFrame: { value: 0 }, uFrameFull: { value: 0 }, uNegRadius: { value: 0.42 }, uCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uFlash: { value: 0 }, uDim: { value: 0 }, uTime: { value: 0 }, uGrain: { value: 0.0022 }, uVignette: { value: 0.4 }, uSeed: { value: 0 },
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
        col += texture2D(tBloom, uv + d).rgb * uBloom * uBloomTint;
        col = aces(col * uExposure);
        if (uFrame > 0.) {
          float l = dot(col, vec3(.2126, .7152, .0722));
          float ink = smoothstep(.2, .3, l);
          vec2 q = vUv - uCenter; q.x *= uAspect;
          float qr = length(q), qa = atan(q.y, q.x);
          float spikes = .5 * sin(qa * 7. + uSeed) + .3 * sin(qa * 13. + uSeed * 1.7) + .2 * sin(qa * 29. + uSeed * 2.3);
          float Rn = uNegRadius * (1. + .34 * spikes + .05 * sin(qa * 61. + uSeed * 3.1) + .03 * sin(qa * 113. + uSeed * .7));   // the edge bleeds like ink
          float m = uFrameFull > .5 ? 1. : 1. - smoothstep(Rn * .92, Rn, qr);
          float uu = (qa + 3.14159) / 6.28318 * 150.;
          float hsh = fract(sin(floor(uu) * 12.9898 + uSeed * 78.233) * 43758.5453);
          float reach = smoothstep(uNegRadius * (.3 + .5 * hsh), uNegRadius * 1.6, qr);
          float wdt = (.05 + .24 * hsh) * (.25 + .75 * reach);      // strokes taper toward the centre
          float ray = step(.5, hsh) * (1. - smoothstep(wdt * .5, wdt, abs(fract(uu) - .5)));
          float brk = 1. - step(.86, fract(sin(floor(qr / uNegRadius * 3.5 + hsh * 7.) * 91.7 + floor(uu) * 3.3) * 4375.85)) * step(.5, hsh);
          float uu2 = (qa + 3.14159) / 6.28318 * 380., h2 = fract(sin(floor(uu2) * 7.13 + uSeed * 3.1) * 43758.5453);
          float ray2 = step(.74, h2) * (1. - smoothstep(.05, .12, abs(fract(uu2) - .5))) * smoothstep(uNegRadius * (.9 + .6 * h2), uNegRadius * 2.1, qr);
          ink = max(ink, max(ray * reach * brk, ray2 * .7));
          float paper = fract(sin(dot(floor(vUv * vec2(960., 540.)), vec2(12.9898, 78.233)) + uSeed) * 43758.5453);
          vec3 neg = mix(vec3(1., .94, .84) * (.96 + .04 * paper), vec3(.03, .012, .006), ink);   // fire turns to ink on warm paper
          col = mix(col, mix(col * .35, neg, m), uFrame);
        }
        col = mix(col, vec3(1., .93, .82), uFlash);
        col *= 1. - uDim;
        vec2 vq = vUv - .5; col *= 1. - uVignette * dot(vq, vq) * 1.6;
        col = srgb(clamp(col, 0., 1.));
        float g = fract(sin(dot(vUv * vec2(1931., 1087.) + floor(uTime * 24.) * vec2(17., 31.), vec2(12.9898, 78.233))) * 43758.5453);
        gl_FragColor = vec4(col + (g - .5) * uGrain, 1.);
      }`,
    depthTest: false, depthWrite: false,
  });

  // the flame layer's resolution follows how much flame is on screen: a close-up of one flame marches
  // sharp, the ring of fire at half resolution. Three levels with hysteresis, so it rarely changes.
  let flameScaleNow = 0;
  function sizeFlame() { applyScale(flameScaleNow || options.flameScale); }
  function setSize(width, height, pixelRatio = 1) {
    W = Math.max(1, Math.round(width)); H = Math.max(1, Math.round(height)); dpr = pixelRatio;
    res.set(W, H); uniforms.uDpr.value = dpr;
    rtColor.setSize(W, H);
    rtDistort.setSize(Math.ceil(W / 2), Math.ceil(H / 2));
    sizeFlame();
    let w = Math.ceil(W / 2), h = Math.ceil(H / 2);
    for (let i = 0; i < BLOOM_LEVELS; i++) { down[i].setSize(w, h); up[i].setSize(w, h); w = Math.max(1, Math.ceil(w / 2)); h = Math.max(1, Math.ceil(h / 2)); }
    compositeMat.uniforms.uAspect.value = W / H;
  }

  const _proj = new V3();
  function updateImpact(realDt) {
    const U = compositeMat.uniforms;
    let shakeX = 0, shakeY = 0, zoom = 1, fish = 0, frame = 0, fl = 0, dim = 0;
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
        fl = imp.flash * Math.exp(-t / 0.07);
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
    U.uFlash.value = fl; U.uDim.value = dim; U.uTime.value = clock.real;
  }

  // ---------------------------------------------------------------- frame
  let pendingDt = 0;
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
    uniforms.uScroll.value = options.noise === 'scrolled' ? 1 : 0;
    if (simDt > 0) {
      clock.tickAcc += simDt;
      const tick = 1 / options.tickHz;
      let ticks = 0;
      while (clock.tickAcc >= tick && ticks < 3) { clock.tickAcc -= tick; ticks++; for (let i = repeats.length - 1; i >= 0; i--) { repeats[i].fn(); if (--repeats[i].ticks <= 0) repeats.splice(i, 1); } }
      if (ticks === 3) clock.tickAcc = 0;
    }
    updateRings(simDt);
    updateHeat(simDt);
    updateImpact(realDt);
    return simDt;
  }

  function render() {
    const dt = pendingDt; pendingDt = 0;   // spawns made after update() still get this frame's step
    liveHeat = [];
    updateFlames(dt);
    pickFlameScale();
    uniforms.uPix.value = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5) / Math.max(1, rtFlame.height);   // metres per flame-buffer pixel at 1 m
    updateLights(dt);
    updateSparks(dt);
    updateSmoke(dt);
    updateGlints(dt);
    smkMat.uniforms.uAmbient.value.set(palette.ambient.r, palette.ambient.g, palette.ambient.b);
    smkMat.uniforms.uGlowCol.value.set(palette.glow.r, palette.glow.g, palette.glow.b);
    smkMat.uniforms.uCamRight.value.setFromMatrixColumn(camera.matrixWorld, 0);
    smkMat.uniforms.uCamUp.value.setFromMatrixColumn(camera.matrixWorld, 1);
    const dst = options.smoke === 'additive' ? THREE.OneFactor : THREE.OneMinusSrcAlphaFactor;
    if (smkMat.blendDst !== dst) { smkMat.blendDst = dst; smkMat.needsUpdate = true; }
    const prevTarget = renderer.getRenderTarget();
    const prevMask = camera.layers.mask;
    const clearCol = new THREE.Color(); renderer.getClearColor(clearCol); const prevAlpha = renderer.getClearAlpha();
    renderHeat();
    renderer.setClearColor(clearCol, prevAlpha);
    renderer.setRenderTarget(rtColor); renderer.clear(); renderer.render(scene, camera);
    const bg = scene.background; scene.background = null;
    // flames: marched into their own smaller target, laid over the frame, then sparks on top
    const autoClear = renderer.autoClear;
    camera.layers.set(FLAME_LAYER);
    renderer.setClearColor(0x000000, 0); renderer.setRenderTarget(rtFlame); renderer.clear(); renderer.render(scene, camera);
    renderer.autoClear = false;
    pass(flameOverMat, rtColor);
    camera.layers.set(LATE_LAYER); renderer.setRenderTarget(rtColor); renderer.render(scene, camera);
    renderer.autoClear = autoClear;
    camera.layers.set(DISTORT_LAYER);
    renderer.setClearColor(0x000000, 0); renderer.setRenderTarget(rtDistort); renderer.clear(); renderer.render(scene, camera);
    camera.layers.mask = prevMask; scene.background = bg;
    renderer.setClearColor(clearCol, prevAlpha);
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

  // Compile every program before the first hit, against the colour pass's render target.
  function warmup() {
    const hidden = [];
    group.traverse((o) => { if (o.isMesh && !o.visible) { hidden.push(o); o.visible = true; } });
    const prev = renderer.getRenderTarget(), mask = camera.layers.mask;
    renderer.setRenderTarget(rtColor);
    camera.layers.enableAll();
    renderer.compile(scene, camera);
    for (const m of [prefilterMat, downMat, upMat, flameOverMat]) { fsMesh.material = m; renderer.compile(fsScene, fsCam); }
    renderer.setRenderTarget(heatRT); renderer.compile(heatScene, fsCam);
    renderer.setRenderTarget(null); fsMesh.material = compositeMat; renderer.compile(fsScene, fsCam);
    renderer.setRenderTarget(prev); camera.layers.mask = mask;
    for (const o of hidden) o.visible = false;
  }

  const fx = {
    options, palette, group, debug, lightUniforms, heatUniforms, uniforms, post: compositeMat.uniforms, lights, patches,
    get time() { return clock.sim; }, get realTime() { return clock.real; }, get holding() { return clock.hold > 0; },
    get timeScale() { return clock.base; }, set timeScale(v) { clock.base = v; },
    get rampValue() { return clock.rampValue; },
    flame, flameArc, flash, addHeat, sparks, spawnSpark, spawnSmoke, glint, ring, impact, ramp, repeat, curlAt,
    update, render, setSize, warmup,
    stats: () => ({ flameScale: flameScaleNow, flameLoad: +flameLoad.toFixed(1), flames: flames.filter((f) => f.alive).length, sparks: spkGeo.instanceCount, smoke: smkGeo.instanceCount, patches: patches.length, lights: lights.map((L) => +L.energy.toFixed(2)) }),
  };
  return fx;
}
