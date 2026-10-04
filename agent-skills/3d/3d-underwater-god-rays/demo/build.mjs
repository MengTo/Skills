// Rebuild demo/index.html from the Blue Hour sources.
//
//   node demo/build.mjs <path/to/tanco-assets> [path/to/tanco-iphone-duo.html]
//
// Blue Hour is the living-ocean wallpaper of an iPhone Duo study page. Its
// aquarium renderer (scene.js), school simulation (flock.js) and Blender
// sardine LODs (fish-lods.json) are copied unchanged except at the seams
// below, where the renderer is routed through assets/underwater-light.mjs, so
// the demo runs the exact module the skill ships. Three.js r170 (MIT) is taken
// from the reference page. The device model, its screen UI and the page's
// embedded font stay behind.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const assets = resolve(process.argv[2] || resolve(here, '../../../../../HTML Pages/tanco-assets'));
const reference = resolve(process.argv[3] || resolve(assets, '../tanco-iphone-duo.html'));
const read = (p) => readFileSync(resolve(here, p), 'utf8');

function replaceOnce(text, find, replacement, label) {
  const i = text.indexOf(find);
  if (i < 0 || text.indexOf(find, i + 1) >= 0) throw new Error(`seam not unique: ${label}`);
  return text.slice(0, i) + replacement + text.slice(i + find.length);
}

// Three.js r170 with its MIT notice, from the reference page.
const page = readFileSync(reference, 'utf8');
const licenseStart = page.indexOf('<!--\nThe MIT License');
const threeEnd = page.indexOf('</script>', page.indexOf('window.THREE=(()=>{', licenseStart)) + '</script>'.length;
if (licenseStart < 0 || threeEnd < licenseStart) throw new Error('three.js r170 block not found in the reference page');
let three = page.slice(licenseStart, threeEnd);
// The validator rejects remote URLs. One is a comment; the other is an XHTML
// namespace for which plain createElement is identical in an HTML document.
three = replaceOnce(three, '/* Three.js r170, MIT License — https://threejs.org/ */', '/* Three.js r170, MIT License — threejs.org */', 'three banner');
three = replaceOnce(three, 'document.createElementNS("http://www.w3.org/1999/xhtml",t)', 'document.createElement(t)', 'createElementNS');

// assets/underwater-light.mjs as a classic script: file:// pages cannot import modules.
const moduleSrc = read('../assets/underwater-light.mjs');
const exported = [...moduleSrc.matchAll(/^export (?:const|function) (\w+)/gm)].map((m) => m[1]);
const lightScript = '<script>\n// assets/underwater-light.mjs, inlined\nwindow.UnderwaterLight = (() => {\n' +
  moduleSrc.replace(/^export /gm, '') + `\nreturn { ${exported.join(', ')} };\n})();\n</script>`;

// The aquarium renderer, routed through the module.
let scene = readFileSync(resolve(assets, 'scene.js'), 'utf8');
scene = replaceOnce(scene, '// OCEAN_BACKGROUND_SOURCE', read('src/water.js'), 'water');
scene = replaceOnce(scene,
  /\/\/ Volumetric shafts are marched[^\n]*\nconst shaftTarget=[^\n]*\nU\.uShafts=[^\n]*\nconst shaftScene=[^\n]*\nshaftScene\.add\(new THREE\.Mesh\(quad,shaftMat\)\);\n/.exec(scene)?.[0] ?? '<<missing shaft block>>',
  '// Volumetric shafts are marched at reduced resolution before the water is drawn.\nconst underwaterLight=UnderwaterLight.createUnderwaterLight(THREE,{uniforms:U});\n',
  'shaft pass');
scene = replaceOnce(scene, 'renderer.setRenderTarget(shaftTarget);renderer.clear();renderer.render(shaftScene,flatCamera);', 'underwaterLight.render(renderer);', 'shaft render');
scene = replaceOnce(scene,
  "const shaftW=Math.max(1,Math.ceil(width*dpr*.5)),shaftH=Math.max(1,Math.ceil(height*dpr*.5));shaftTarget.setSize(shaftW,shaftH);U.uShaftTexel.value.set(1/shaftW,1/shaftH);host.dataset.shaftBuffer=shaftW+'x'+shaftH;",
  "const shaftSize=underwaterLight.setSize(width*dpr,height*dpr);host.dataset.shaftBuffer=shaftSize.width+'x'+shaftSize.height;",
  'shaft resize');
scene = replaceOnce(scene, 'shaftTarget.dispose();shaftMat.dispose();', 'underwaterLight.dispose();', 'shaft dispose');
scene = replaceOnce(scene,
  ' float dapple=shaftLight(vWorld,uTime);\n col+=lightBRDF(n,viewDir,L1,base,rough,vec3(3.2,3.8,4.0)*mix(1.,.62+1.5*dapple,uStudio));',
  ' col+=lightBRDF(n,viewDir,L1,base,rough,vec3(3.2,3.8,4.0)*mix(1.,underwaterDapple(vWorld,uTime),uStudio));',
  'fish dapple');
scene = replaceOnce(scene, 'return {canvas:renderer.domElement,foregroundCanvas,', 'return {light:underwaterLight,sunDirection,canvas:renderer.domElement,foregroundCanvas,', 'api');

// Sardine LODs: the renderer draws hero, high and medium. Four decimals is
// well under a texel on a fish 1.15 units long.
const lods = JSON.parse(readFileSync(resolve(assets, 'fish-lods.json'), 'utf8'));
const round = (key, value) => (typeof value === 'number' && !Number.isInteger(value) ? +value.toFixed(4) : value);
const fish = JSON.stringify({ hero: lods.hero, high: lods.high, medium: lods.medium }, round);
scene = replaceOnce(scene, '// BLENDER_FISH_DATA', 'const fishLODData=' + fish + ';', 'fish data');
const aquarium = readFileSync(resolve(assets, 'flock.js'), 'utf8') + '\n' + scene;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#031923">
<meta name="color-scheme" content="dark">
<title>Underwater God Rays — Three.js · WebGL2 · GLSL</title>
<meta name="description" content="Volumetric underwater light in Three.js: one drifting swell field, marched along every view ray at half resolution, becomes shafts that converge on the sun, rippling caustics inside each beam, a shimmering surface underside and dappled light on a schooling sardine shoal.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http%3A//www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23062533'/%3E%3Cpath d='M14 4h4l7 24H7z' fill='%23bfeaf5' opacity='.55'/%3E%3C/svg%3E">
<style>
${read('src/ui.css')}</style>
</head>
<body>
${read('src/ui.html')}
${three}
${lightScript}
<script>
/* Blue Hour aquarium: school simulation and renderer, routed through the module above. */
${aquarium}
</script>
<script>
${read('src/ui.js')}</script>
</body>
</html>
`;

const out = resolve(here, 'index.html');
writeFileSync(out, html);
console.log(`wrote ${out} (${(html.length / 1024).toFixed(0)} KB)`);
