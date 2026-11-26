import {
  WebGLRenderer,
  ShaderMaterial,
  PlaneGeometry,
  Mesh,
  Scene,
  Camera,
  Texture,
  SRGBColorSpace,
  NoColorSpace,
  NoBlending,
  Vector2,
  Vector4,
  Vector3,
} from "three";
import { paintLighting } from "./paint-shader.js";

const vertexShader = `
varying vec2 vUv;
void main(){vUv=uv; gl_Position=vec4(position.xy,0.,1.);}
`;
const fragmentShader = `
uniform sampler2D paintTex, normalTex, depthTex, roughTex;
uniform vec4 region, imageBox;
uniform vec2 aim;
uniform vec3 stageAxis;
uniform float metalMode;
varying vec2 vUv;
${paintLighting}
vec3 encodeColor(vec3 c) {
  return mix(12.92*c,1.055*pow(max(c,vec3(.00001)),vec3(1./2.4))-.055,step(.0031308,c));
}
void main(){
  vec2 local=region.xy+vec2(vUv.x,1.-vUv.y)*region.zw;
  vec2 uv=(local-imageBox.xy)/imageBox.zw;
  if(any(lessThan(uv,vec2(0.))) || any(greaterThan(uv,vec2(1.)))) discard;
  uv.y=1.-uv.y;
  vec4 originalPaint=texture2D(paintTex,uv);
  if(originalPaint.a<.02)discard;
  float h=texture2D(depthTex,uv).r;
  // A shallow depth card. Anchor the cut edges and shift internal paint by
  // relative depth. This also keeps skin and the pouch registered on contact.
  vec2 shifted=uv+aim*(h-.45)*min(4.2,min(imageBox.z,imageBox.w)*.007)/imageBox.zw;
  float solid=min(originalPaint.a,texture2D(paintTex,shifted).a);
  uv=mix(uv,shifted,smoothstep(.78,.99,solid));
  vec4 base=texture2D(paintTex,uv);
  vec3 N=normalize(texture2D(normalTex,uv).xyz*2.-1.);
  h=texture2D(depthTex,uv).r;
  float rough=texture2D(roughTex,uv).r;
  vec3 L=studioDirection(aim);
  vec2 stepUv=L.xy/max(.35,L.z)*min(11.,min(imageBox.z,imageBox.w)*.028)/imageBox.zw;
  float blocker=0.;
  for(int i=1;i<=5;i++){
    float t=float(i);
    float other=texture2D(depthTex,uv+stepUv*t).r;
    blocker=max(blocker,(other-h-.031*t)/(.10+.035*t));
  }
  float visibility=1.-.72*clamp(blocker,0.,1.);
  float metal=metalMode>1.5 ? 1.-smoothstep(.43,.62,rough) : metalMode;
  float plane=dot(vec3(local,1.),stageAxis);
  vec3 lit=illuminate(base.rgb,N,aim,plane,rough,metal,visibility);
  vec3 original=encodeColor(originalPaint.rgb);
  vec3 change=clamp(encodeColor(lit),0.,1.)-original;
  // Source-over decomposition. Only the difference is composited on the
  // full-resolution painting, so fine brushwork and animated water stay sharp.
  vec3 needed=max(change/max(vec3(.001),1.-original),-change/max(vec3(.001),original));
  float amount=clamp(max(needed.r,max(needed.g,needed.b)),.0001,1.);
  vec3 overlay=clamp(original+change/amount,0.,1.);
  float a=amount*originalPaint.a;
  gl_FragColor=vec4(overlay*a,a);
}
`;
export function makePaintRenderer(onLoss) {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    depth: false,
    antialias: false,
    premultipliedAlpha: true,
    powerPreference: "low-power",
  });
  if (!gl) return null;
  const renderer = new WebGLRenderer({
    canvas,
    context: gl,
    alpha: true,
    premultipliedAlpha: true,
  });
  renderer.setClearColor(0, 0);
  const uniforms = {
    paintTex: { value: null },
    normalTex: { value: null },
    depthTex: { value: null },
    roughTex: { value: null },
    region: { value: new Vector4() },
    imageBox: { value: new Vector4() },
    aim: { value: new Vector2() },
    stageAxis: { value: new Vector3() },
    metalMode: { value: 0 },
  };
  const material = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    blending: NoBlending,
    depthTest: false,
    depthWrite: false,
  });
  const geometry = new PlaneGeometry(2, 2),
    scene = new Scene(),
    camera = new Camera(),
    mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  scene.add(mesh);
  const textures = new Map();
  function getTexture(image, isPaint) {
    if (!textures.has(image)) {
      const texture = new Texture(image);
      texture.colorSpace = isPaint ? SRGBColorSpace : NoColorSpace;
      texture.needsUpdate = true;
      textures.set(image, texture);
    }
    return textures.get(image);
  }
  canvas.addEventListener("webglcontextlost", onLoss);
  return {
    draw(map, patch, region, imageBox, aim, axis, metal) {
      const { ctx, canvas: out } = patch;
      if (canvas.width < out.width || canvas.height < out.height)
        renderer.setSize(
          Math.max(canvas.width, out.width),
          Math.max(canvas.height, out.height),
          false,
        );
      renderer.setViewport(0, 0, out.width, out.height);
      renderer.setScissor(0, 0, out.width, out.height);
      renderer.setScissorTest(true);
      for (const [name, key] of [
        ["paintTex", "paint"],
        ["normalTex", "normal"],
        ["depthTex", "depth"],
        ["roughTex", "roughness"],
      ])
        uniforms[name].value = getTexture(map[key], key === "paint");
      uniforms.region.value.fromArray(region);
      uniforms.imageBox.value.fromArray(imageBox);
      uniforms.aim.value.set(aim.x, aim.y);
      uniforms.stageAxis.value.fromArray(axis);
      uniforms.metalMode.value = metal;
      renderer.render(scene, camera);
      ctx.globalCompositeOperation = "copy";
      ctx.drawImage(
        canvas,
        0,
        canvas.height - out.height,
        out.width,
        out.height,
        0,
        0,
        out.width,
        out.height,
      );
    },
    close() {
      canvas.removeEventListener("webglcontextlost", onLoss);
      for (const texture of textures.values()) texture.dispose();
      textures.clear();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
