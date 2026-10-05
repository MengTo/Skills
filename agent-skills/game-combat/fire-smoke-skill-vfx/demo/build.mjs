// Rebuild demo/index.html from demo/src and ../assets/fire-fx.mjs.
//
//   node demo/build.mjs
//
// The page opens from disk with no network requests. Three.js r170 (MIT) is loaded from
// demo/assets/three.r170.min.js, a classic build that exposes window.THREE. The module is inlined
// as a classic script (window.FireFX) because a page opened from disk cannot import ES modules,
// and the ground scan's three 1k maps are embedded as data URIs.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(resolve(here, p), 'utf8');

const moduleSrc = read('../assets/fire-fx.mjs');
const map = (f) => 'data:image/jpeg;base64,' + readFileSync(resolve(here, 'assets/ground', f)).toString('base64');
const groundMaps = JSON.stringify({ diff: map('burned_ground_01_diff_1k.jpg'), nor: map('burned_ground_01_nor_gl_1k.jpg'), arm: map('burned_ground_01_arm_1k.jpg') });
const exported = [...moduleSrc.matchAll(/^export (?:const|function) (\w+)/gm)].map((m) => m[1]);
const lib = '<script>\n// assets/fire-fx.mjs, inlined\nwindow.FireFX = (() => {\n' +
  moduleSrc.replace(/^export /gm, '') + `\nreturn { ${exported.join(', ')} };\n})();\n</script>`;
if (/<\/script/i.test(moduleSrc)) throw new Error('module contains </script>');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#070505">
<meta name="color-scheme" content="dark">
<title>Fire and Smoke — Fire Skill VFX · Three.js · WebGL2 · GLSL</title>
<meta name="description" content="A fire skill as one effect language in Three.js: raymarched flame volumes whose turbulence rises with buoyancy, a temperature ramp from white-yellow roots to deep red tips, charcoal smoke lit warm from below, embers that drift and cool to ash, heat haze, firelight on scanned burned ground, and a gentle impact frame.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http%3A//www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23090605'/%3E%3Cpath d='M16 4c1 5 7 8 7 15a7 7 0 0 1-14 0c0-4 3-6 3-9 2 2 2 4 2 5 2-3 2-7 2-11z' fill='%23ff9a4a'/%3E%3C/svg%3E">
<style>
${read('src/ui.css')}</style>
</head>
<body>
${read('src/ui.html')}
<!-- Ground: "Burned Ground 01" by Rob Tuytel, CC0, https://polyhaven.com/a/burned_ground_01 (1k diffuse, normal (GL) and ARM maps, embedded below as data URIs). -->
<!-- Three.js r170, MIT License, https://threejs.org -->
<script src="assets/three.r170.min.js"></script>
${lib}
<script>
// Poly Haven "Burned Ground 01" by Rob Tuytel, CC0 (polyhaven.com/a/burned_ground_01): 1k maps as data URIs
window.GROUND_MAPS = ${groundMaps};
</script>
<script>
${read('src/stage.js')}</script>
<script>
${read('src/ui.js')}</script>
</body>
</html>
`;

const out = resolve(here, 'index.html');
writeFileSync(out, html);
console.log(`wrote ${out} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB)`);
