import assert from 'node:assert/strict';

const period = 140;
const trajectory = t => {
  const angle = 2 * Math.PI * (t % period) / period;
  return [1.2 * (1 - Math.cos(angle)), 12 * Math.sin(angle)];
};
const dt = 0.01;
const left = trajectory(period - dt);
const middle = trajectory(period);
const right = trajectory(period + dt);
for (let axis = 0; axis < 2; axis++) {
  const incoming = (middle[axis] - left[axis]) / dt;
  const outgoing = (right[axis] - middle[axis]) / dt;
  assert.ok(Math.abs(incoming - outgoing) < 0.001);
}
const pixels = depth => 1200 * 0.3 / depth;
assert.equal(pixels(10) / pixels(100), 10);
const station = 24 * 3600 * 10;
assert.equal((station + 80) % 80, station % 80);
console.log('Depth ratio, road spacing and loop velocity verified.');
