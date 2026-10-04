// Rebuild demo/index.html from demo/src and ../assets/storm-energy.mjs.
//
//   node demo/build.mjs
//
// The module is inlined as a classic script (window.StormEnergy) because a page
// opened from disk cannot import ES modules. Three.js r170 (MIT) is loaded from
// demo/assets/three.r170.min.js, a classic build that exposes window.THREE.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(resolve(here, p), 'utf8');

const moduleSrc = read('../assets/storm-energy.mjs');
const map = (f) => 'data:image/jpeg;base64,' + readFileSync(resolve(here, 'assets/ground', f)).toString('base64');
const groundMaps = JSON.stringify({ diff: map('dry_ground_01_diff_1k.jpg'), nor: map('dry_ground_01_nor_gl_1k.jpg'), arm: map('dry_ground_01_arm_1k.jpg') });
const exported = [...moduleSrc.matchAll(/^export (?:const|function) (\w+)/gm)].map((m) => m[1]);
const lib = '<script>\n// assets/storm-energy.mjs, inlined\nwindow.StormEnergy = (() => {\n' +
  moduleSrc.replace(/^export /gm, '') + `\nreturn { ${exported.join(', ')} };\n})();\n</script>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#04060a">
<meta name="color-scheme" content="dark">
<title>Black Lightning — Energy Skill VFX · Three.js · WebGL2 · GLSL</title>
<meta name="description" content="A close-combat energy skill as one effect language in Three.js: white-blue lightning re-rolled at 30 Hz, a compressed orb that refracts the air, black afterimage smoke, three-layer air bursts, orange sparks, debris that lands, and impact frames that hold, invert, flash, shake and bend the lens.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http%3A//www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%2305070c'/%3E%3Cpath d='M18 3 8 18h7l-2 11 11-16h-7z' fill='%23cfe8ff'/%3E%3C/svg%3E">
<style>
${read('src/ui.css')}</style>
</head>
<body>
${read('src/ui.html')}
<script src="assets/three.r170.min.js"></script>
${lib}
<script>
// Poly Haven "Dry Ground 01" by Rob Tuytel, CC0 (polyhaven.com/a/dry_ground_01): 1k maps as data URIs
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
console.log(`wrote ${out} (${(html.length / 1024).toFixed(0)} KB)`);
