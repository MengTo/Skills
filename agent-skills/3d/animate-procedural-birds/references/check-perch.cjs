const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=path.join(__dirname,'../demo/assets');
const scope=vm.createContext({console});
vm.runInContext(fs.readFileSync(path.join(dir,'three.min.js'),'utf8'),scope);
vm.runInContext(fs.readFileSync(path.join(dir,'wagtail.js'),'utf8'),scope);
const {bird,eyes,pose}=scope.makeWagtail(scope.THREE);
function bounds(time,open){pose(time,open);bird.updateMatrixWorld(true);return new scope.THREE.Box3().setFromObject(bird,true);}
const perched=bounds(0,0),rest=bounds(2,0),flight=bounds(.26,1);
assert.ok(Math.abs(perched.min.y-rest.min.y)<.001);
assert.ok((flight.max.x-flight.min.x)>(rest.max.x-rest.min.x)*1.35);
assert.equal(eyes.length,2);
for(const eye of eyes)assert.ok(eye.getWorldPosition(new scope.THREE.Vector3()).y>.080);
console.log('Planted foot height, wingspan and both eye targets passed.');
