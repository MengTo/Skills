// Blue Hour's own water: a depth gradient and the sun seen from below. The
// skill adds two calls, the surface underside and the marched shafts.
const oceanLight = UnderwaterLight.LIGHT_GLSL;
const oceanFragment = `
precision highp float;
varying vec2 vUv;
uniform vec3 uSunDirection,uCameraPosition;
uniform mat4 uCameraWorld;
uniform mat4 uInverseProjection;
uniform float uStudio,uTime;
uniform sampler2D uShafts;
uniform vec2 uShaftTexel;
${UnderwaterLight.LIGHT_GLSL}
${UnderwaterLight.WATER_GLSL}
void main() {
  vec4 viewRay=uInverseProjection*vec4(vUv*2.-1.,1.,1.);
  vec3 ray=normalize((uCameraWorld*vec4(viewRay.xyz,0.)).xyz);
  float up=smoothstep(-.55,.64,ray.y);
  vec3 color=mix(vec3(.0015,.011,.021),vec3(.0058,.038,.058),up);
  color=mix(color,mix(vec3(.0017,.014,.025),vec3(.0078,.047,.068),up),uStudio);

  vec3 sunRay=ray;
  color+=surfaceUnderside(ray,sunRay);

  // One source; its direction also lights the fish and projects the ray pass.
  // The broad corona is kept low; the shafts carry most of the light.
  float facing=max(dot(sunRay,uSunDirection),0.);
  float corona=pow(facing,48.);
  float disk=pow(facing,240.);
  float depthFade=mix(.55,1.,smoothstep(.26,.82,vUv.y));
  color+=vec3(.043,.095,.123)*corona*depthFade*(.4+.6*uStudio);
  color+=vec3(1.08,1.24,1.30)*disk*depthFade*(.35+.65*uStudio);

  color+=underwaterShafts(vUv,ray);
  gl_FragColor=vec4(color,0.);
}
`;
