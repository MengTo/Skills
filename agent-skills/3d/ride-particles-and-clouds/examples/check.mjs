import assert from 'node:assert/strict';

const mod = (value, span) => ((value % span) + span) % span;
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const visibility = depth => smooth(0.72, 2.15, depth) * (1 - smooth(15, 23, depth));
const position = travel => mod(travel, 34) - 24;
assert.equal(visibility(-position(33.999)), 0);
assert.equal(visibility(-position(34.001)), 0);
assert.equal(visibility(-position(16)), 1);
const transmit = (density, total, steps) => Math.exp(-density * total / steps) ** steps;
assert.ok(Math.abs(transmit(0.2, 10, 8) - transmit(0.2, 10, 64)) < 1e-12);
assert.ok(transmit(0.4, 10, 8) < transmit(0.2, 10, 8));
console.log('Wrap visibility and cloud transmittance verified.');
