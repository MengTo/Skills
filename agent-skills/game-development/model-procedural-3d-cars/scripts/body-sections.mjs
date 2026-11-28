// Coordinates are metres. Positive Z points to the nose.
import {designs} from './fleet-dimensions.mjs';

function stationCurve(rows, column) {
  const slopes = rows.slice(1).map((row, i) =>
    (row[column] - rows[i][column]) / (row[0] - rows[i][0]));
  const tangents = rows.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === slopes.length) return slopes[i - 1];
    const a = slopes[i - 1], b = slopes[i];
    return a * b <= 0 ? 0 : 2 / (1 / a + 1 / b);
  });
  return (z) => {
    if (z <= rows[0][0]) return rows[0][column];
    if (z >= rows.at(-1)[0]) return rows.at(-1)[column];
    const right = rows.findIndex(row => row[0] > z);
    const left = right - 1, span = rows[right][0] - rows[left][0];
    const t = (z - rows[left][0]) / span, s = 1 - t;
    return s*s*(1+2*t)*rows[left][column] + t*t*(3-2*t)*rows[right][column]
      + span * (s*s*t*tangents[left] - s*t*t*tangents[right]);
  };
}

// Reuse one sampler per design, for both sides of the chassis. Each returned
// section describes transverse hard points; it is not a finished body mesh.
export function bodySections(design, archClearance) {
  if (!Number.isFinite(archClearance) || archClearance < 0)
    throw new RangeError('Expected non-negative wheel-arch clearance in metres.');
  const [width, deck, shoulder, rocker] = [1, 2, 3, 4].map(i => stationCurve(design.body, i));
  return z => {
    if (!Number.isFinite(z) || Math.abs(z) > design.length / 2)
      throw new RangeError('Station falls outside the body.');
    const t = 2 * z / design.length;
    let cut = rocker(t);
    for (const [axleZ, radius] of design.axles) {
      const r = radius + archClearance, dz = z - axleZ;
      if (Math.abs(dz) < r) cut = Math.max(cut, 0.979 * radius + Math.sqrt(r*r - dz*dz));
    }
    return {z, halfWidth: width(t), deck: deck(t), shoulder: shoulder(t),
      rocker: rocker(t), wheelOpening: cut};
  };
}

export const fleetSections = designs.map((design, index) =>
  bodySections(design, [0.047, 0.069, 0.039, 0.046][index]));
