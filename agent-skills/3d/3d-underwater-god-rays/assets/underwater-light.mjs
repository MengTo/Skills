// Underwater god rays. One drifting swell field lights the water column, the
// underside of the surface and anything swimming through it, so the shafts,
// the ripples and the dappling move together and parallax with the camera.
//
// Pass in your own THREE; this module never imports a second copy.
//
//   const light = createUnderwaterLight(THREE, { uniforms });   // before materials that use `uniforms`
//   light.setSize(drawingBufferWidth, drawingBufferHeight);      // on resize
//   light.render(renderer);                                      // each frame, before the water pass
//
// `uniforms` is the object your water, fish and particle materials share. It
// must already hold uSunDirection (vec3, normalised, pointing toward the sun),
// uTime, uCameraPosition, uCameraWorld (camera.matrixWorld) and
// uInverseProjection (camera.projectionMatrixInverse). The module adds its own
// uniforms to it, so every material that reads the light sees one set of values.

export const DEFAULTS = {
  surfaceY: 12,        // world height of the surface plane
  shaftScale: 1.3,     // cross-sun frequency; the main swell period is about 2π/1.3 ≈ 4.8 units
  shaftFloor: -0.05,   // smoothstep floor on the swell before squaring: sparse peaks, dark gaps
  gain: 3.6,           // linear HDR gain of the marched light
  color: [0.16, 0.40, 0.47],
  resolution: 0.5,     // march buffer scale against the drawing buffer
};

// Shared light model. Include it in any shader that needs the shafts. The host
// shader must declare `uniform vec3 uSunDirection;` before this chunk.
export const LIGHT_GLSL = /* glsl */ `
uniform float uSurfaceY,uShaftScale,uShaftFloor;
uniform vec2 uCompare; // A/B switches for the two failure modes; leave at 0
// Drifting swells, domain-warped so no crest runs dead straight.
float swell(vec2 p,float t){
  p+=.62*vec2(sin(p.y*.57+t*.21),sin(p.x*.49-t*.17));
  return (sin(dot(p,vec2(.86,.51))+t*.29)
         +sin(dot(p,vec2(-.42,.91))*1.23-t*.24)
         +sin(dot(p,vec2(.13,-.99))*.87+t*.19)
         +sin(dot(p,vec2(-.97,-.24))*1.41-t*.15))*.25;
}
// Position across the sun direction: every shaft stays parallel to it.
vec2 acrossSun(vec3 p){
  vec3 ex=normalize(cross(uSunDirection,vec3(0.,1.,0.))),ey=cross(ex,uSunDirection);
  return vec2(dot(p,ex),dot(p,ey))*uShaftScale;
}
// Where the swells focus sunlight a shaft forms; it fades with depth.
float shaftFocus(vec3 p,float t){
  float depth=max((uSurfaceY-p.y)/max(uSunDirection.y,.2),0.);
  float s=swell(acrossSun(p),t);
  float focus=uCompare.x>.5?pow(1.-abs(s),4.):smoothstep(uShaftFloor,1.,s);
  return focus*focus*exp(-depth*.012);
}
// A finer, faster caustic web ripples inside each shaft.
float shaftWeb(vec3 p,float t){
  return pow(1.-abs(swell(acrossSun(p)*2.6+vec2(3.1,7.7),t*1.35)),5.);
}
float shaftLight(vec3 p,float t){return shaftFocus(p,t)*(.45+.9*shaftWeb(p,t));}
// Multiply a key light by this: fish in a shaft catch it, fish between shafts dim.
float underwaterDapple(vec3 p,float t){return .62+1.5*shaftLight(p,t);}
`;

// Surface underside and the composite of the marched shafts, for the water
// (background) shader. Needs LIGHT_GLSL first, plus uCameraPosition, uTime,
// uShafts and uShaftTexel.
export const WATER_GLSL = /* glsl */ `
// Fine interfering ripples for the surface underside.
vec2 surfaceRipple(vec2 p,float t){
  vec2 a=vec2(.83,.56),b=vec2(-.51,.86),c=vec2(.11,-.99);
  return a*cos(dot(p,a)*2.1+t*.9)*.50+b*cos(dot(p,b)*2.9-t*1.1)*.34+c*cos(dot(p,c)*3.8+t*1.3)*.22
        +vec2(cos(p.y*.61+t*.3),cos(p.x*.55-t*.25))*.35;
}
// The underside of the surface: a dark mirror broken by wave facets that open
// toward the sun, and a caustic network. The same slopes bend sunRay, so the
// sun seen through the surface wobbles with the ripples.
vec3 surfaceUnderside(vec3 ray,inout vec3 sunRay){
  if(ray.y<=.015)return vec3(0.);
  float distanceToSurface=(uSurfaceY-uCameraPosition.y)/ray.y;
  vec2 s=uCameraPosition.xz+ray.xz*distanceToSurface;
  vec2 slope=surfaceRipple(s*.9,uTime);
  float detail=1.-smoothstep(.35,1.6,length(fwidth(s))*.9);
  float fog=exp(-distanceToSurface*.028);
  sunRay=normalize(ray+vec3(slope.x,0.,slope.y)*.018*detail);
  float facet=dot(slope,normalize(uSunDirection.xz+vec2(.0001)));
  vec2 w=s*1.15;
  float network=pow(1.-abs(swell(w,uTime*1.6)),8.)*.75+pow(1.-abs(swell(w*1.9+vec2(4.3,1.9),uTime*2.1)),10.)*.55;
  float glow=pow(max(dot(ray,uSunDirection),0.),5.);
  float sheet=(smoothstep(.3,1.05,facet)*.6+network)*detail+pow(1.-abs(swell(s*.33,uTime*1.4)),6.)*.3;
  return vec3(.0975,.221,.26)*sheet*fog*(.18+.82*glow)*smoothstep(.015,.10,ray.y);
}
// The marched shafts, upsampled with a small tent filter that hides the jitter.
vec3 underwaterShafts(vec2 uv,vec3 ray){
  vec2 o=uShaftTexel*.5;
  vec3 shafts=(texture2D(uShafts,uv+o).rgb+texture2D(uShafts,uv-o).rgb
              +texture2D(uShafts,uv+vec2(o.x,-o.y)).rgb+texture2D(uShafts,uv-vec2(o.x,-o.y)).rgb)*.25;
  if(uCompare.y<.5)return shafts;
  // Failure mode B: the caustic web sampled a few times at full resolution
  // instead of inside the march. It reads as a pool floor painted on the water.
  float web=0.;
  for(int i=0;i<4;i++){float t=5.+float(i*i)*3.2;web+=shaftWeb(uCameraPosition+ray*t,uTime);}
  return shafts*(.45+1.1*mix(web*.25,.28,pow(max(dot(ray,uSunDirection),0.),20.)));
}
`;

export const FULLSCREEN_VERTEX = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';

// March each view ray through the water. At every sample, sunlight is looked
// up across the sun direction; forward scattering brightens the shafts that
// converge on the sun. Integrating the caustic web along the ray is what turns
// it into fine rippling streaks inside each shaft.
export const SHAFT_FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec3 uSunDirection,uCameraPosition,uShaftColor;
uniform mat4 uCameraWorld,uInverseProjection;
uniform float uTime,uShaftGain;
${LIGHT_GLSL}
void main(){
  vec4 viewRay=uInverseProjection*vec4(vUv*2.-1.,1.,1.);
  vec3 ray=normalize((uCameraWorld*vec4(viewRay.xyz,0.)).xyz);
  // Stable subpixel phase breaks up banding without frame-to-frame shimmer.
  float jitter=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
  const float NEAR=4.,FAR=54.;
  float total=0.,weights=0.;
  for(int i=0;i<26;i++){
    float f=(float(i)+jitter)/26.;
    float t=NEAR+(FAR-NEAR)*f*f;
    vec3 p=uCameraPosition+ray*t;
    if(p.y>uSurfaceY)break;
    // Near samples smear least, so they carry the most weight.
    float w=exp(-t*.06)*(.08+f);
    total+=(uCompare.y>.5?shaftFocus(p,uTime):shaftLight(p,uTime))*w;
    weights+=w;
  }
  total/=max(weights,.0001);
  float mu=max(dot(ray,uSunDirection),0.);
  // Looking straight up a shaft the pattern stops meaning anything: close to
  // the sun the shafts merge into its glow instead of leaving a dark hole.
  total=mix(total,.16,pow(mu,28.));
  float phase=.7+1.1*pow(mu,5.)+.9*pow(mu,40.);
  float below=mix(.45,1.,smoothstep(-.45,.35,ray.y));
  gl_FragColor=vec4(uShaftColor*total*phase*below*uShaftGain,1.);
}
`;

const REQUIRED = ['uSunDirection', 'uTime', 'uCameraPosition', 'uCameraWorld', 'uInverseProjection'];

export function createUnderwaterLight(THREE, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const uniforms = o.uniforms;
  if (!uniforms) throw new Error('createUnderwaterLight: pass the uniforms your water and fish materials share');
  for (const name of REQUIRED) {
    if (!uniforms[name]) throw new Error(`createUnderwaterLight: uniforms.${name} is required`);
  }
  // Half float keeps the HDR shafts above 1 until the single tone map. The
  // march is soft, so the target stays single-sampled.
  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType, format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false,
  });
  Object.assign(uniforms, {
    uSurfaceY: { value: o.surfaceY },
    uShaftScale: { value: o.shaftScale },
    uShaftFloor: { value: o.shaftFloor },
    uShaftGain: { value: o.gain },
    uShaftColor: { value: new THREE.Vector3(...o.color) },
    uCompare: { value: new THREE.Vector2(0, 0) },
    uShafts: { value: target.texture },
    uShaftTexel: { value: new THREE.Vector2(1, 1) },
  });
  const material = new THREE.ShaderMaterial({
    uniforms, vertexShader: FULLSCREEN_VERTEX, fragmentShader: SHAFT_FRAGMENT,
    depthTest: false, depthWrite: false,
  });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geometry = new THREE.PlaneGeometry(2, 2);
  const quad = new THREE.Mesh(geometry, material);
  quad.frustumCulled = false;
  scene.add(quad);
  return {
    uniforms, target, material,
    // Pass drawing-buffer pixels (CSS size × pixel ratio).
    setSize(pixelWidth, pixelHeight) {
      const width = Math.max(1, Math.ceil(pixelWidth * o.resolution));
      const height = Math.max(1, Math.ceil(pixelHeight * o.resolution));
      target.setSize(width, height);
      uniforms.uShaftTexel.value.set(1 / width, 1 / height);
      return { width, height };
    },
    render(renderer) {
      const previous = renderer.getRenderTarget();
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(previous);
    },
    dispose() { target.dispose(); material.dispose(); geometry.dispose(); },
  };
}
