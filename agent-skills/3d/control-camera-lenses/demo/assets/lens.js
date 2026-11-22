/* Sensor and lens in millimetres, depth in metres, blur radius in output pixels. */
function verticalFieldOfView(mm, sensorHeight=20.25) {
  if(!(mm>0 && sensorHeight>0))throw new RangeError('Lens and sensor dimensions must be positive');
  return 2*Math.atan(sensorHeight/(2*mm))*180/Math.PI;
}
function eyePlaneDepth(camera, eyes, scratch) {
  camera.updateWorldMatrix(true,false);
  let near=Infinity;
  for(const eye of eyes) {
    eye.getWorldPosition(scratch).applyMatrix4(camera.matrixWorldInverse);
    if(scratch.z<0)near=Math.min(near,-scratch.z);
  }
  return Number.isFinite(near)?Math.max(camera.near,near):null;
}
function signedBlurRadius(depth, focus, mm, fStop, sensorHeight, pixelsHigh) {
  const f=mm*.001,near=Math.max(depth,.001);
  if(!(focus>f && fStop>0 && sensorHeight>0))return 0;
  const diameter=f*f/(fStop*(focus-f))*(1-focus/near);
  return diameter*.5*pixelsHigh/(sensorHeight*.001);
}
if(typeof module!=='undefined')module.exports={verticalFieldOfView,eyePlaneDepth,signedBlurRadius};
