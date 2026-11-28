import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {NodeIO, Primitive} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';

// Inspect assigned weights on referenced vertices. Some exporters leave unused
// vertices or zero-weight padding entries in the joint buffers.
function surfaceWeights(primitive, skinJoints) {
  const sets = [];
  const count = primitive.getAttribute('POSITION').getCount();
  for (const semantic of primitive.listSemantics().filter(s => /^WEIGHTS_\d+$/.test(s))) {
    const weights = primitive.getAttribute(semantic);
    const indices = primitive.getAttribute(semantic.replace('WEIGHTS_', 'JOINTS_'));
    if (!indices || weights.getCount() !== count || indices.getCount() !== count) {
      throw new Error('Inconsistent joint buffers on a skinned surface.');
    }
    sets.push({weights, indices, w: [], j: []});
  }
  const index = primitive.getIndices()?.getArray();
  let used;
  if (index) {
    used = new Uint8Array(count);
    for (const vertex of index) used[vertex] = 1;
  }
  const influenced = new Set();
  let maxWeightSumError = 0;
  for (let vertex = 0; vertex < count; vertex++) {
    if (used && !used[vertex]) continue;
    let sum = 0;
    for (const {weights, indices, w, j} of sets) {
      weights.getElement(vertex, w);
      indices.getElement(vertex, j);
      for (let i = 0; i < w.length; i++) {
        const weight = w[i];
        if (weight === 0) continue;
        if (!Number.isFinite(weight) || weight < 0 || !skinJoints[j[i]]) {
          throw new Error('Invalid skin influence at vertex ' + vertex);
        }
        sum += weight;
        influenced.add(skinJoints[j[i]]);
      }
    }
    if (sum === 0) throw new Error('The rig has an unweighted surface vertex at ' + vertex);
    maxWeightSumError = Math.max(maxWeightSumError, Math.abs(sum - 1));
  }
  return {influenced, maxWeightSumError};
}

// Quaternion signs are interchangeable. Cubic curves can bend between equal keys.
function hasMotion(channel) {
  const path = channel.getTargetPath();
  if (!['rotation', 'translation', 'scale'].includes(path)) return false;
  const sampler = channel.getSampler(), times = sampler.getInput(), values = sampler.getOutput();
  if (times.getCount() < 2) return false;
  const cubic = sampler.getInterpolation() === 'CUBICSPLINE';
  const key = i => values.getElement(cubic ? i * 3 + 1 : i, []);
  const first = key(0);
  function differs(v) {
    if (path === 'rotation') {
      const norm = Math.hypot(...first) * Math.hypot(...v);
      const dot = first.reduce((sum, value, i) => sum + value * v[i], 0);
      return norm > 0 && 1 - Math.abs(dot / norm) > 1e-9;
    }
    return v.some((value, i) => Math.abs(value - first[i]) > 1e-6);
  }
  for (let i = 1; i < times.getCount(); i++) {
    const end = key(i);
    if (differs(end)) return true;
    if (!cubic) continue;
    const start = key(i - 1), duration = times.getScalar(i) - times.getScalar(i - 1);
    const outSlope = values.getElement(3 * i - 1, []), inSlope = values.getElement(3 * i, []);
    for (const t of [1/3, 2/3]) {
      const s = 1 - t;
      const point = start.map((v, j) => s*s*(1+2*t)*v + t*t*(3-2*t)*end[j]
        + duration*(s*s*t*outSlope[j] - s*t*t*inSlope[j]));
      if (differs(point)) return true;
    }
  }
  return false;
}

// Measure the scene that the GLB opens on, including instanced geometry.
// Unused meshes or textures in an export should not inflate the result.
export function inspectCharacter(root) {
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  if (!scene) throw new Error('The GLB has no scene.');

  const materials = new Set();
  const joints = new Set();
  const weightedJoints = new Set();
  let triangles = 0;
  let weightedTriangles = 0;
  let maxWeightSumError = 0;
  scene.traverse(node => {
    const mesh = node.getMesh();
    if (!mesh) return;
    const skin = node.getSkin();
    for (const primitive of mesh.listPrimitives()) {
      const count = (primitive.getIndices() ?? primitive.getAttribute('POSITION')).getCount();
      const mode = primitive.getMode();
      let faces = 0;
      if (mode === Primitive.Mode.TRIANGLES) faces = Math.floor(count / 3);
      if (mode === Primitive.Mode.TRIANGLE_FAN || mode === Primitive.Mode.TRIANGLE_STRIP) {
        faces = Math.max(0, count - 2);
      }
      if (!faces) continue;
      triangles += faces;
      if (skin) {
        const skinJoints = skin.listJoints();
        const weights = surfaceWeights(primitive, skinJoints);
        for (const joint of weights.influenced) weightedJoints.add(joint);
        maxWeightSumError = Math.max(maxWeightSumError, weights.maxWeightSumError);
        weightedTriangles += faces;
        for (const joint of skinJoints) joints.add(joint);
      }
      if (primitive.getMaterial()) materials.add(primitive.getMaterial());
    }
  });
  if (!triangles) throw new Error('The default scene has no triangles.');

  const skinDrivers = new Set();
  for (const joint of weightedJoints) {
    for (let node = joint; node && !skinDrivers.has(node); node = node.getParentNode())
      skinDrivers.add(node);
  }
  const textures = new Map();
  function describe(texture) {
    if (!texture) return null;
    if (!textures.has(texture)) {
      const bytes = texture.getImage();
      if (!bytes) throw new Error('Cannot read texture ' + texture.getName());
      textures.set(texture, {
        dimensions: texture.getSize(),
        sha256: createHash('sha256').update(bytes).digest('hex')
      });
    }
    return textures.get(texture);
  }
  return {
    triangles,
    weightedTriangles,
    joints: joints.size,
    weightedJoints: weightedJoints.size,
    maxWeightSumError: weightedTriangles ? maxWeightSumError : null,
    movingSkinClips: root.listAnimations()
      .filter(clip => clip.listChannels().some(c => skinDrivers.has(c.getTargetNode()) && hasMotion(c)))
      .map(clip => clip.getName()),
    skeletalClips: root.listAnimations()
      .filter(clip => clip.listChannels().some(channel => joints.has(channel.getTargetNode())))
      .map(clip => clip.getName()),
    materials: [...materials].map(material => ({
      name: material.getName(),
      baseColor: describe(material.getBaseColorTexture()),
      normal: describe(material.getNormalTexture()),
      metallicRoughness: describe(material.getMetallicRoughnessTexture())
    }))
  };
}

export async function inspectFile(file) {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  return inspectCharacter((await io.read(file)).getRoot());
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const files = process.argv.slice(2);
  if (!files.length) throw new Error('Usage: node inspect.mjs character.glb [other.glb ...]');
  const reports = [];
  for (const file of files) reports.push({file, ...await inspectFile(file)});
  console.log(JSON.stringify(reports, null, 2));
}
