// Rebuild demo/index.html from demo/src, demo/layout and ../assets/tide-crystal.mjs.
//
//   node demo/build.mjs
//
// The page opens from disk with no network requests. Three.js r170 (MIT) is loaded from
// demo/assets/three.r170.min.js, a classic build that exposes window.THREE. The module is inlined
// as a classic script (window.TideCrystal) because a page opened from disk cannot import ES modules,
// and the ground scan's three 1k maps and the shore's layout map are embedded.
//
// The Low Tide Rocks scan ships at JPEG quality ~97: 3.9 MB for the three maps, 5.2 MB as base64.
// demo/assets/ground/ holds the same maps decoded and re-encoded at quality 85, keeping their 4:2:0
// chroma so nothing is subsampled twice (1.26 MB in all):
//   djpeg -nosmooth <map>.jpg | cjpeg -quality 85 -sample 2x2 -optimize -progressive > demo/assets/ground/<map>.jpg
// An in-page A/B of the same paused frames differed by a mean of 0.9–1.7 levels, only in single glint
// pixels on the wet stone.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(resolve(here, p), 'utf8');

const moduleSrc = read('../assets/tide-crystal.mjs');
const map = (f) => 'data:image/jpeg;base64,' + readFileSync(resolve(here, 'assets/ground', f)).toString('base64');
const groundMaps = JSON.stringify({ diff: map('low_tide_rocks_diff_1k.jpg'), nor: map('low_tide_rocks_nor_gl_1k.jpg'), arm: map('low_tide_rocks_arm_1k.jpg') });
// The shore's layout (where the pools and the rock banks lie round the skill), traced from the target
// images through each shot's camera onto a 5 cm world grid by demo/layout/layout.py: 200 × 180 bytes,
// high nibble water, low nibble confidence. The stage reads it as window.TIDE_LAYOUT.
const layout = JSON.stringify({ x0: -3, z0: -6, d: 0.05, nx: 200, nz: 180, b64: readFileSync(resolve(here, 'layout/layout.bin')).toString('base64') });
const exported = [...moduleSrc.matchAll(/^export (?:const|function) (\w+)/gm)].map((m) => m[1]);
const lib = '<script>\n// assets/tide-crystal.mjs, inlined\nwindow.TideCrystal = (() => {\n' +
  moduleSrc.replace(/^export /gm, '') + `\nreturn { ${exported.join(', ')} };\n})();\n</script>`;
if (/<\/script/i.test(moduleSrc)) throw new Error('module contains </script>');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#020608">
<meta name="color-scheme" content="dark">
<title>Tide Glass — Water and Crystal Skill VFX · Three.js · WebGL2 · GLSL</title>
<meta name="description" content="A water and crystal skill as one effect language in Three.js: water gathered from moonlit tide pools into a clear orb, a lashing stream that splashes into a pool, ray-traced quartz that erupts where it lands, resonates and shatters into shards that fall and rest, rain that rings the pools, and moon glitter on a tidal rock flat.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http%3A//www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23031015'/%3E%3Cpath d='M16 4 9 15l7 13 7-13z' fill='none' stroke='%239ff3ff' stroke-width='1.6' stroke-linejoin='round'/%3E%3Cpath d='M9 15h14M16 4v24' stroke='%239ff3ff' stroke-width='.8' opacity='.6'/%3E%3C/svg%3E">
<style>
${read('src/ui.css')}</style>
</head>
<body>
${read('src/ui.html')}
<!-- Ground: "Low Tide Rocks" by Dimitrios Savva, CC0, https://polyhaven.com/a/low_tide_rocks (1k diffuse, normal (GL) and ARM maps, re-encoded at quality 85, embedded below as data URIs). -->
<!-- Three.js r170, MIT License, https://threejs.org -->
<script src="assets/three.r170.min.js"></script>
${lib}
<script>
// Poly Haven "Low Tide Rocks" by Dimitrios Savva, CC0 (polyhaven.com/a/low_tide_rocks): 1k maps as data URIs
window.GROUND_MAPS = ${groundMaps};
window.TIDE_LAYOUT = ${layout};
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
