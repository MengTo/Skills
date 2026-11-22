import assert from 'node:assert/strict';
import {deflectCurrent,bedTransmission,waterFresnel,cascadeAt} from '../assets/creek-optics.mjs';
for(let i=0;i<31;i++){
  const a=2*Math.PI*i/31,x=Math.cos(a),z=Math.sin(a);
  const [vx,vz]=deflectCurrent(x,z,0,0,1,[.1,1.4]);
  assert.ok(Math.abs(vx*x+vz*z)<1e-10);
}
assert.deepEqual(bedTransmission(0,1,[.8,.4,.2]),[1,1,1]);
const [r,g,b]=bedTransmission(1,.8,[.8,.4,.2]);assert.ok(r<g && g<b && b<1);
assert.equal(waterFresnel(1),.0204);assert.equal(waterFresnel(0),1);
assert.ok(Math.abs(cascadeAt(.35,2,1.1).drop-.35)<1e-10);
console.log('Creek optics and flow checks passed.');
