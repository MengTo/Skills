// Local XZ coordinates in metres, flow direction supplied by the creek spline.
export function deflectCurrent(x,z,centreX,centreZ,radius,velocity) {
  if(!(radius>0))throw new RangeError('Rock radius must be positive');
  const dx=x-centreX,dz=z-centreZ,d2=dx*dx+dz*dz;
  if(d2<radius*radius)return [0,0];
  const influence=radius*radius/d2;
  const projection=(velocity[0]*dx+velocity[1]*dz)/d2;
  return [(1+influence)*velocity[0]-2*influence*projection*dx,
          (1+influence)*velocity[1]-2*influence*projection*dz];
}
export function bedTransmission(depthMetres, cosRefracted, extinction) {
  const path=Math.max(0,depthMetres)/Math.max(.12,Math.abs(cosRefracted));
  return extinction.map(k=>Math.exp(-Math.max(0,k)*path));
}
export function waterFresnel(cosView) {
  const angle=Math.max(0,Math.min(1,cosView));
  return .0204+.9796*Math.pow(1-angle,5);
}
export function cascadeAt(head,t,inlet) {
  if(head<0||t<0)throw new RangeError('Head and time must be nonnegative');
  const age=Math.min(t,Math.sqrt(2*head/9.81));
  return {downstream:inlet*age,drop:.5*9.81*age*age};
}
