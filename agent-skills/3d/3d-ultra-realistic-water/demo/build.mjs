// Rebuild demo/index.html from the Pirate Ship Sunset reference.
//
//   node demo/build.mjs [path/to/pirate-ship-sunset.html]
//
// The reference is one self-contained bundle (three.js r169 inlined, so it opens
// from file://). This keeps its ship, sky, islands, gulls, spray, camera and post
// untouched, removes its minified ocean, and routes the scene through
// assets/ocean.mjs instead, so the demo runs the exact module the skill ships.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const refPath = resolve(process.argv[2] || resolve(here, '../../../pirate-ship-sunset.html'));
const read = (p) => readFileSync(resolve(here, p), 'utf8');
let html = readFileSync(refPath, 'utf8');

function replaceOnce(find, replacement, label) {
  const i = html.indexOf(find);
  if (i < 0 || html.indexOf(find, i + 1) >= 0) throw new Error(`anchor not unique: ${label}`);
  html = html.slice(0, i) + replacement + html.slice(i + find.length);
}
function replaceBetween(start, end, replacement, label) {
  const i = html.indexOf(start);
  const j = html.indexOf(end, i);
  if (i < 0 || j < 0 || html.indexOf(start, i + 1) >= 0) throw new Error(`range not unique: ${label}`);
  html = html.slice(0, i) + replacement + html.slice(j);
}

// ocean.mjs as a classic script: file:// pages cannot import modules from disk.
const moduleSrc = read('../assets/ocean.mjs');
const exported = [...moduleSrc.matchAll(/^export (?:const|function) (\w+)/gm)].map((m) => m[1]);
const oceanScript =
  '<script>\n// assets/ocean.mjs, inlined\nwindow.OceanSkill = (() => {\n' +
  moduleSrc.replace(/^export /gm, '') +
  `\nreturn { ${exported.join(', ')} };\n})();\n</script>`;

// 1. Head: name the technique and stack, add the interface styles.
replaceOnce('<title>​</title>',
  '<title>Ultra-Realistic Water — Three.js · WebGL2 · GLSL</title>\n' +
  '<meta name="description" content="Eight deep-water Gerstner waves shaded per pixel from analytic derivatives, each faded at its own pixel footprint, with Fresnel sky reflection, subsurface light, Jacobian foam and a Kelvin wake.">\n' +
  '<link rel="icon" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAzMiAzMic+PHJlY3Qgd2lkdGg9JzMyJyBoZWlnaHQ9JzMyJyByeD0nNycgZmlsbD0nIzIwMWEzMycvPjxjaXJjbGUgY3g9JzE2JyBjeT0nMTQnIHI9JzUnIGZpbGw9JyNmZmIyN2EnLz48cGF0aCBkPSdNNSAyMWMzLjUtMiA3LjUtMiAxMSAwczcuNSAyIDExIDAnIHN0cm9rZT0nI2Y2ZThkOCcgc3Ryb2tlLXdpZHRoPScyJyBmaWxsPSdub25lJy8+PC9zdmc+">',
  'title');
replaceOnce('</style>\n</head>', '</style>\n<style>\n' + read('src/ui.css') + '</style>\n</head>', 'head style');

// 2. Body: describe the canvas, add the interface, the controller and the module ahead of the bundle.
replaceOnce('<canvas id="c" aria-hidden="true"></canvas>',
  '<main>\n<canvas id="c" role="img" aria-label="A three-masted ship under sail at sunset on a rolling open sea, with sun glitter, foam along the hull and a spreading Kelvin wake."></canvas>\n' +
  read('src/ui.html') + '</main>\n<script>\n' + read('src/ui.js') + '</script>\n' + oceanScript,
  'canvas');

// three.js creates its canvas through an XHTML namespace string; plain createElement is identical in an HTML page.
replaceOnce('document.createElementNS("http://www.w3.org/1999/xhtml",s)', 'document.createElement(s)', 'createElementNS');

// 3. Detail texture: bake from the module, drop the reference's copy of the shader.
replaceBetween(',fS=`', ';function Am(s){', '', 'detail shader');
replaceOnce('t.oceanDetail=es(s,512,512,fS,{},{})', 't.oceanDetail=OceanSkill.bakeOceanDetail(Nn,s)', 'detail bake');

// 4. Waves, ocean surface and wake: thin adapters over the module, same call sites.
replaceBetween('var gS=9.81,Im=', 'function Fm(', `
function Dm(s){return __OD.waves=OceanSkill.createWaves({direction:s})}
function Lm({waves:s,atmos:t,detailTex:e,skyCube:n,wake:i}){
  let r=[];for(let u=0;u<36;u++)r.push(Je(-18+36*u/35,.1)); // hull half-width at the waterline, stern to bow
  __OD.ocean=OceanSkill.createOcean(Nn,{waves:s,detailTexture:e,skyCube:n,wake:i,
    hull:{halfWidths:r,zMin:-18,zMax:18,bowZ:_e(.1)},
    hazeGLSL:Li+mo+"\\nvec3 oceanHaze(vec3 d){ return hazeColor(d); }\\n",hazeUniforms:t});
  return __OD.ocean}
function Um(s,t){return OceanSkill.createWake(Nn,s,{shipLength:t})}
`, 'ocean');

// 5. Planar reflection through the module.
replaceOnce('zh=new Ze(1,1,{type:Mn,depthBuffer:!0});is.uniforms.uRefl.value=zh.texture;',
  'zh=(__OD.refl=OceanSkill.createPlanarReflection(Nn,Ce,{layer:yr})).target;is.setReflection(__OD.refl);__OD.sync&&__OD.sync();',
  'reflection');

// 6. Per-frame uniforms, reflection pass, and a frame clock that can hold a still.
replaceBetween('function VS(s){', 'function Qm(){',
  'function VS(s){is.update({time:s,camera:Oe,ship:{x:wt.x,z:wt.z,fx:Si.x,fz:Si.z}})}function Jm(){__OD.refl.render(Be,Oe)}',
  'frame uniforms');
replaceOnce('function Qm(){let s=performance.now(),t=Math.max(0,(s-Ud)/1e3);Ud=s;let e=Math.min(t,1/20);',
  'function Qm(){if(__OD.hold()){Ud=performance.now();return}let s=performance.now(),t=Math.max(0,(s-Ud)/1e3);Ud=s;let e=__OD.frozen?0:Math.min(t,1/20);',
  'frame clock');

const out = resolve(here, 'index.html');
writeFileSync(out, html);
console.log(`wrote ${out} (${(html.length / 1024).toFixed(0)} KB)`);
