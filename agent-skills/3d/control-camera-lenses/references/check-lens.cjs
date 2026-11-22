const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const scope={module:{exports:{}}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../demo/assets/lens.js'),'utf8'),scope);
const {verticalFieldOfView,signedBlurRadius}=scope.module.exports;
for(const mm of [24,35,58]){
 const degrees=verticalFieldOfView(mm);
 assert.ok(Math.abs(20.25/(2*Math.tan(degrees*Math.PI/360))-mm)<1e-9);
 assert.equal(signedBlurRadius(2,2,mm,2,20.25,1080),0);
 assert.ok(signedBlurRadius(.7,2,mm,2,20.25,1080)<0);
 const far=signedBlurRadius(9,2,mm,2,20.25,1080);
 assert.ok(far>0);assert.equal(signedBlurRadius(9,2,mm,2,20.25,2160),far*2);
}
console.log('Projection, focal plane and Retina blur checks passed.');
