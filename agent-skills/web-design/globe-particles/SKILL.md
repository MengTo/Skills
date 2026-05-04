---
name: globe-particles
description: Create a globe-like 3D particle visualization with a dense luminous spherical core and thinner orbital ring or flattened disc. Use when a design needs a premium planetary, orbital, synthesized data-globe effect rendered with real WebGL/Three.js particles, not generic starfields or full page layout changes.
---

# Globe Particles

## Scope
- Apply only to a globe-like 3D particle visualization.
- Do not change full page layout, copy, or unrelated motion systems.
- Use for planetary, orbital, infrastructure, or synthesized data-globe effects.
- Keep the core neutral or white-hot and derive ring/glow accents from the design's primary color.

## Visual Target
- Dense spherical core of luminous points.
- Thinner outer orbital ring or flattened disc around the sphere.
- Clear globe silhouette with tilt, depth, and layered particle density.
- Dark atmospheric background, restrained glow, clean structure, and subtle sci-fi depth.
- Premium and cinematic, not playful or noisy.

## HTML And CSS

```html
<div class="globe-particles-shell">
  <canvas class="globe-particles-canvas" data-globe-particles></canvas>
</div>
```

```css
.globe-particles-shell {
  position: relative;
  width: min(100%, 760px);
  aspect-ratio: 1 / 1;
}

.globe-particles-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}
```

## Particle Shader
Use circular shader points so particles stay crisp and luminous.

```js
const globeParticleVertex = `
attribute float a_size;
attribute float a_layer;

uniform float u_time;
uniform float u_pointSize;

varying float v_layer;
varying float v_depth;
varying float v_falloff;

void main() {
  vec3 pos = position;
  float breathe = 1.0 + sin(u_time * 0.65 + a_layer * 4.0) * 0.012;
  pos *= breathe;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = u_pointSize * a_size * (1.0 / max(0.18, -mvPosition.z));
  gl_Position = projectionMatrix * mvPosition;

  v_layer = a_layer;
  v_depth = smoothstep(-1.8, 1.8, pos.z);
  v_falloff = smoothstep(2.45, 0.25, length(pos));
}
`;

const globeParticleFragment = `
precision highp float;

uniform vec3 u_coreColor;
uniform vec3 u_accentColor;

varying float v_layer;
varying float v_depth;
varying float v_falloff;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float alpha = smoothstep(0.5, 0.0, d);
  alpha *= alpha;

  vec3 color = mix(u_coreColor, u_accentColor, smoothstep(0.35, 1.0, v_layer));
  color += vec3(1.0) * v_depth * 0.08;
  color = mix(color * 0.42, color, clamp(v_falloff + v_layer * 0.28, 0.0, 1.0));
  alpha *= mix(0.52, 1.0, clamp(v_falloff + v_layer * 0.24, 0.0, 1.0));

  gl_FragColor = vec4(color, alpha);
}
`;
```

## Three.js Recipe

```js
import * as THREE from "three";

function hexToRgb01(hex) {
  const clean = hex.replace("#", "").trim();
  const value = clean.length === 3
    ? clean.split("").map((char) => char + char).join("")
    : clean;

  return new THREE.Color(
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255
  );
}

function buildGlobeParticleGeometry(options = {}) {
  const sphereCount = options.sphereCount || 2600;
  const ringCount = options.ringCount || 1300;
  const radius = options.radius || 1.35;
  const ringRadius = options.ringRadius || 2.05;
  const ringThickness = options.ringThickness || 0.12;
  const total = sphereCount + ringCount;

  const positions = new Float32Array(total * 3);
  const sizes = new Float32Array(total);
  const layers = new Float32Array(total);

  for (let i = 0; i < sphereCount; i++) {
    const z = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const r = radius * (0.58 + Math.pow(Math.random(), 0.42) * 0.42);
    const root = Math.sqrt(1 - z * z);
    const index = i * 3;

    positions[index] = Math.cos(theta) * root * r;
    positions[index + 1] = Math.sin(theta) * root * r;
    positions[index + 2] = z * r;
    sizes[i] = 0.72 + Math.random() * 0.72;
    layers[i] = Math.random() * 0.28;
  }

  for (let i = 0; i < ringCount; i++) {
    const pointIndex = sphereCount + i;
    const angle = Math.random() * Math.PI * 2;
    const r = ringRadius + (Math.random() - 0.5) * ringThickness;
    const y = (Math.random() - 0.5) * ringThickness * 0.58;
    const index = pointIndex * 3;

    positions[index] = Math.cos(angle) * r;
    positions[index + 1] = y;
    positions[index + 2] = Math.sin(angle) * r;
    sizes[pointIndex] = 0.62 + Math.random() * 0.58;
    layers[pointIndex] = 0.72 + Math.random() * 0.28;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("a_size", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("a_layer", new THREE.BufferAttribute(layers, 1));
  return geometry;
}

function initGlobeParticles(canvas, options = {}) {
  if (!canvas) return () => {};

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.maxDpr || 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, options.cameraDistance || 5.6);

  const accent = options.accentColor
    ? new THREE.Color(options.accentColor)
    : hexToRgb01(getComputedStyle(document.documentElement).getPropertyValue("--brand-accent").trim() || "#8b5cf6");

  const geometry = buildGlobeParticleGeometry(options);
  const material = new THREE.ShaderMaterial({
    vertexShader: globeParticleVertex,
    fragmentShader: globeParticleFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      u_time: { value: 0 },
      u_pointSize: { value: options.pointSize || 18 },
      u_coreColor: { value: new THREE.Color(options.coreColor || 0xf8fafc) },
      u_accentColor: { value: accent },
    },
  });

  const particles = new THREE.Points(geometry, material);
  particles.rotation.x = options.tiltX ?? -0.42;
  particles.rotation.z = options.tiltZ ?? 0.22;
  scene.add(particles);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = new THREE.Vector2(0, 0);
  let rafId = 0;

  function resize() {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.maxDpr || 1.6));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function handlePointerMove(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  }

  function render(time = 0) {
    const t = time * 0.001;
    material.uniforms.u_time.value = t;

    const mouseStrength = options.mouseStrength ?? 0.08;
    const breath = reduceMotion ? 0 : Math.sin(t * 0.55) * 0.045;
    particles.rotation.y = t * (options.rotationSpeed || 0.12);
    particles.rotation.x = (options.tiltX ?? -0.42) + pointer.y * mouseStrength;
    particles.rotation.z = (options.tiltZ ?? 0.22) + pointer.x * mouseStrength;
    particles.scale.setScalar(1 + breath);

    renderer.render(scene, camera);
    if (!reduceMotion) rafId = requestAnimationFrame(render);
  }

  function handleResize() {
    cancelAnimationFrame(rafId);
    resize();
    render();
  }

  resize();
  render();
  window.addEventListener("resize", handleResize);
  window.addEventListener("pointermove", handlePointerMove);

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("pointermove", handlePointerMove);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  };
}

const cleanupGlobe = initGlobeParticles(document.querySelector("[data-globe-particles]"), {
  sphereCount: 2600,
  ringCount: 1300,
  accentColor: "#8b5cf6",
  radius: 1.35,
  ringRadius: 2.05,
  rotationSpeed: 0.12,
  mouseStrength: 0.08,
});
```

## Tuning Knobs
- Density: tune `sphereCount` and `ringCount` separately.
- Scale: tune `radius`, `ringRadius`, `ringThickness`, and `cameraDistance`.
- Color: keep `coreColor` neutral; derive `accentColor` from the brand primary.
- Motion: tune `rotationSpeed`, `tiltX`, `tiltZ`, `mouseStrength`, and breathing amplitude.
- Glow: tune `pointSize`, additive blending, and particle count so the shape stays crisp.
- Performance: lower particle counts or cap `maxDpr` before changing the visual structure.

## Taste Rules
- The silhouette must read as a globe, not a loose starfield.
- The ring should feel orbital and tilted, not like a flat decorative underline.
- Use restrained glow; let density and depth create the premium feel.
- Keep mouse response gentle so the object drifts rather than swings.
- Put the globe over a dark background or inside a dark atmospheric shell.

## Avoid
- Generic starfield noise with no spherical structure.
- Oversized particles or bloom that destroys the globe silhouette.
- Hardcoded accent colors when the design has a clear primary color.
- Wild cursor interaction or fast spinning.
- Dense fog that turns the object into a blurry blob.

## Quick Checks
- Sphere and ring are distinct particle populations.
- Core reads mostly neutral or white-hot.
- Accent color appears on ring, highlights, or glow.
- Tilt reveals the ring and globe depth.
- Reduced motion renders a still or near-still object.
- Geometry, material, renderer, listeners, and RAF are cleaned up.
