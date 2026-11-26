import assert from 'node:assert/strict';

const halfFovTangent = Math.tan(57 * Math.PI / 360);
const normalDistance = 6;
const visibleHeight = 2 * normalDistance * halfFovTangent;

for (const width of [0, 0.25, 0.5, 0.75, 1]) {
  const spread = 1 + 0.72 * width;
  const curve = 0.30 * width ** 2;
  const distance = normalDistance / spread;
  const captureTangent = halfFovTangent * spread * (1 + curve);
  const centerMagnification = 1 + curve;
  const effectiveHeight = 2 * distance * captureTangent / centerMagnification;
  assert.ok(Math.abs(effectiveHeight - visibleHeight) < 1e-10);
  const sampleRadius = radius => radius * (1 + curve * radius ** 2) / (1 + curve);
  assert.equal(sampleRadius(0), 0);
  assert.equal(sampleRadius(1), 1);
  if (width > 0) assert.ok(sampleRadius(0.5) < 0.5);
}
console.log('Subject scale, optical anchor and corner coverage verified.');
