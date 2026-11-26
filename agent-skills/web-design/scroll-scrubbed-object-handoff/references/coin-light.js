import { TextureLoader, Vector3 } from "three";
import { coinMaps } from "./material-maps.js";
import { paintLighting } from "./paint-shader.js";

const loader = new TextureLoader();
let mapSet = null,
  ready = null;
function coinTextures() {
  if (!ready) {
    mapSet = {};
    ready = Promise.all(
      ["normal", "depth", "roughness"].map(
        (key) =>
          new Promise((resolve, reject) => {
            mapSet[key] = loader.load(
              coinMaps[key],
              resolve,
              undefined,
              reject,
            );
          }),
      ),
    );
  }
  return mapSet;
}

// Both mints share the painted stamp. The lamp is in camera space so its
// reflection crosses the embossed leaf as the cylinder banks and turns.
export function lightMint(stamp, stage, canvas, camera, repaint) {
  const controls = new AbortController(),
    opts = { signal: controls.signal, passive: true };
  const fine = matchMedia(
    "(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)",
  );
  const lamp = { value: new Vector3() },
    stageAxis = { value: new Vector3() },
    power = { value: 0 };
  let pointer = null;
  const maps = coinTextures();
  let loaded = false;
  ready.then(
    () => {
      loaded = true;
      repaint();
    },
    () => {},
  );
  stamp.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      normalMapPaint: { value: maps.normal },
      depthMapPaint: { value: maps.depth },
      roughnessMapPaint: { value: maps.roughness },
      lampPos: lamp,
      stageAxis,
      lampPower: power,
    });
    shader.vertexShader =
      "varying vec3 vLampPos;\nvarying vec3 vFaceNormal;\n" +
      shader.vertexShader.replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nvLampPos=mvPosition.xyz; vFaceNormal=normalize(normalMatrix*normal);",
      );
    shader.fragmentShader =
      `
      varying vec3 vLampPos; varying vec3 vFaceNormal;
      uniform sampler2D normalMapPaint, depthMapPaint, roughnessMapPaint;
      ${paintLighting}
      uniform vec3 lampPos,stageAxis; uniform float lampPower;
    ` +
      shader.fragmentShader.replace(
        "#include <map_fragment>",
        `
      #include <map_fragment>
      if(lampPower>0.0){
        vec3 paintedNormal=normalize(texture2D(normalMapPaint,vMapUv).xyz*2.-1.);
        float rough=texture2D(roughnessMapPaint,vMapUv).r;
        float height=texture2D(depthMapPaint,vMapUv).r;
        vec3 N=normalize(vFaceNormal);
        vec3 dp1=dFdx(vLampPos), dp2=dFdy(vLampPos);
        vec2 du1=dFdx(vMapUv), du2=dFdy(vMapUv);
        vec3 p2=cross(dp2,N), p1=cross(N,dp1);
        vec3 T=p2*du1.x+p1*du2.x, B=p2*du1.y+p1*du2.y;
        float scale=inversesqrt(max(1.e-8,max(dot(T,T),dot(B,B))));
        N=normalize(T*scale*paintedNormal.x+B*scale*paintedNormal.y+N*paintedNormal.z);
        float plane=dot(vec3(vLampPos.xy,1.),stageAxis);
        vec3 lit=illuminate(diffuseColor.rgb,N,lampPos.xy,plane-height*.013,rough,1.,1.);
        diffuseColor.rgb=mix(diffuseColor.rgb,lit,lampPower);
      }
    `,
      );
  };
  function move(e) {
    if (!fine.matches || e.pointerType === "touch") {
      clear();
      return;
    }
    pointer = { x: e.clientX, y: e.clientY };
    repaint();
  }
  function clear() {
    if (pointer) {
      pointer = null;
      repaint();
    }
  }
  stage.addEventListener("pointermove", move, opts);
  stage.addEventListener("pointerleave", clear, opts);
  stage.addEventListener("pointercancel", clear, opts);
  window.addEventListener("blur", clear, opts);
  fine.addEventListener("change", clear, opts);
  return {
    update() {
      power.value = loaded && pointer && fine.matches ? 1 : 0;
      if (!power.value) return;
      const box = canvas.getBoundingClientRect();
      if (!box.width || !box.height) {
        power.value = 0;
        return;
      }
      const area = stage.getBoundingClientRect();
      lamp.value.set(
        ((pointer.x - area.left) / area.width) * 2 - 1,
        1 - ((pointer.y - area.top) / area.height) * 2,
        0,
      );
      const sx = box.width / camera.right,
        sy = box.height / -camera.bottom;
      stageAxis.value.set(
        (0.85 * sx) / area.width,
        (0.53 * sy) / area.height,
        (0.85 * (box.left - area.left)) / area.width -
          (0.53 * (box.top - area.top)) / area.height -
          0.16,
      );
    },
    close() {
      controls.abort();
    },
  };
}
