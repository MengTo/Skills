// Flat positions and triangle indices, in one part's rest coordinate system.
export function buildScanCage(positions, indices, cellSize) {
  if (!(cellSize > 0) || !Number.isFinite(cellSize) || positions.length % 3 !== 0) {
    throw new Error("Supply XYZ positions and a positive, finite cell size.");
  }
  const sourceCount = positions.length / 3;
  const cornerCount = indices == null ? sourceCount : indices.length;
  if (cornerCount % 3 !== 0) throw new Error("Triangle data must be complete.");

  const cells = new Map();
  const sums = [];
  const remap = new Map();
  function representative(index) {
    if (!Number.isInteger(index) || index < 0 || index >= sourceCount) {
      throw new RangeError("Triangle index lies outside the position buffer.");
    }
    if (remap.has(index)) return remap.get(index);
    const start = index * 3;
    const coords = [positions[start], positions[start + 1], positions[start + 2]];
    if (!coords.every(Number.isFinite)) throw new Error("Invalid vertex coordinate.");
    const key = coords.map(value => Math.floor(value / cellSize)).join(",");
    if (!cells.has(key)) {
      cells.set(key, sums.length);
      sums.push([0, 0, 0, 0]);
    }
    const id = cells.get(key);
    const sum = sums[id];
    for (let axis = 0; axis < 3; axis++) sum[axis] += coords[axis];
    sum[3]++;
    remap.set(index, id);
    return id;
  }

  const edges = [];
  const seenEdges = new Set();
  function addEdge(a, b) {
    if (a === b) return;
    const key = Math.min(a, b) + "," + Math.max(a, b);
    if (seenEdges.has(key)) return;
    seenEdges.add(key);
    edges.push(a, b);
  }
  for (let i = 0; i < cornerCount; i += 3) {
    const a = representative(indices == null ? i : indices[i]);
    const b = representative(indices == null ? i + 1 : indices[i + 1]);
    const c = representative(indices == null ? i + 2 : indices[i + 2]);
    addEdge(a, b);
    addEdge(b, c);
    addEdge(c, a);
  }
  const points = new Float32Array(sums.length * 3);
  for (let i = 0; i < sums.length; i++) {
    for (let axis = 0; axis < 3; axis++) points[i * 3 + axis] = sums[i][axis] / sums[i][3];
  }
  const IndexArray = sums.length > 65535 ? Uint32Array : Uint16Array;
  return { positions: points, edgeIndices: new IndexArray(edges) };
}
