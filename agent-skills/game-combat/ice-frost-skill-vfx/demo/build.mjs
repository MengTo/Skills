// Rebuild demo/index.html from demo/src and ../assets/frost-energy.mjs + ../assets/frost-growth.mjs.
//
//   node demo/build.mjs
//
// The page opens from disk with no network requests. Three.js r170 (MIT) is loaded from
// demo/assets/three.r170.min.js, a classic build that exposes window.THREE. The two modules are
// inlined as one classic script (window.FrostEnergy) because a page opened from disk cannot import
// ES modules, and the ground scan's three 1k maps are embedded as data URIs.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(resolve(here, p), 'utf8');

const growth = read('../assets/frost-growth.mjs');
const energy = read('../assets/frost-energy.mjs');
const strip = (src) => src.replace(/^import .*$/gm, '').replace(/^export /gm, '');
const exported = [...(growth + '\n' + energy).matchAll(/^export (?:const|function) (\w+)/gm)].map((m) => m[1]);
const lib = '<script>\n// assets/frost-growth.mjs + assets/frost-energy.mjs, inlined\nwindow.FrostEnergy = (() => {\n' +
  strip(growth) + '\n' + strip(energy) + `\nreturn { ${exported.join(', ')} };\n})();\n</script>`;
if (/<\/script/i.test(growth + energy)) throw new Error('module contains </script>');
const map = (f) => 'data:image/jpeg;base64,' + readFileSync(resolve(here, 'assets/ground', f)).toString('base64');
const groundMaps = JSON.stringify({ diff: map('snow_02_diff_1k.jpg'), nor: map('snow_02_nor_gl_1k.jpg'), arm: map('snow_02_arm_1k.jpg') });

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#03050a">
<meta name="color-scheme" content="dark">
<title>Ice &amp; Frost — Frost Skill VFX · Three.js · WebGL2 · GLSL</title>
<meta name="description" content="An ice and frost skill as one effect language in Three.js: a frost crystal blooming in an unseen hand, dendritic frost grown across scanned snow, faceted ice spikes ray-traced against their own planes that erupt, crack and shatter into pieces that land and rest, low freezing mist banks, a blizzard rope of powder and glinting diamond dust.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http%3A//www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%2303050a'/%3E%3Cpath d='M16 4v24M5.6 10l20.8 12M5.6 22l20.8-12' stroke='%23cfefff' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E">
<style>
${read('src/ui.css')}</style>
</head>
<body>
${read('src/ui.html')}
<!-- Ground: "Snow 02" by Rob Tuytel, CC0, https://polyhaven.com/a/snow_02 (1k colour, normal (GL) and AO/roughness maps, embedded below as data URIs). -->
<!-- Three.js r170, MIT License, https://threejs.org -->
<script src="assets/three.r170.min.js"></script>
${lib}
<script>
// Poly Haven "Snow 02" by Rob Tuytel, CC0 (polyhaven.com/a/snow_02): 1k maps as data URIs
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
