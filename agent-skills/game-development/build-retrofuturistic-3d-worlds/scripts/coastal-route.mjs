import * as T from 'three';
const V = (x, y, z) => new T.Vector3(x, y, z);
const wrap = (value, period) => ((value % period) + period) % period;

// A surveyed centerline in metres. Each elevation is the actual deck top.
// The coastal chute crosses a small service sill, followed by the shallow S on piles.
const departure=[2.94,94.65,5.60],northCaisson=[-223,-5,1.85];
const plan=[
 [-11.40,71.75,1.86],[-17.33,62.92,1.67],[-16.04,55.30,1.96],[-6.75,47.65,2.54],
 [-2.90,39.20,3.05],[-1.80,32.00,3.17],[-4.24,21.30,3.00],[-9.45,8.00,2.55],
 [-11.10,-8.0,2.19],[-12.40,-27.14,1.90],[-17,-49,1.0],[-25,-75,.25],
 [-44,-99,.15],[-89,-156,.25],[-145,-180,1.2],[-207,-150,1.9],[-229,-134,2.03],[-235,-115,1.97],
 [-231,-79,1.87],[-227,-42,1.83],northCaisson,[-210,22,1.71],[-181,34,1.35],[-143,69,.8],[-102,111,1.45],[-61,135,2.8],
 [-18,136,4.70],[5.2,120,6.87],[6.64,109,7.50],[5.34,101.8,6.86],
 departure,[-1.50,85.17,4.22],[-5.51,79.18,3.22]
];
// The station numbers also locate buildings and the relay junctions. Keep
// that survey datum when moving the lock approach out onto its new deck.
const survey=new T.CatmullRomCurve3(plan.map(([x,z])=>V(x,0,z)),true,'catmullrom',.39);
survey.arcLengthDivisions=4000;
const approach=new Map([
 [31,[.92,.0]],[32,[2.81,.57]],[0,[4.94,1.26]],[1,[5.61,1.01]],
 [2,[6.74,.68]],[3,[9.35,.39]],[4,[10.89,.13]],[5,[10.81,0]],
 [6,[9.52,0]],[7,[6.03,0]],[8,[3.80,0]],[9,[1.50,0]]
]);
const routePoints=survey.points.map((p,i)=>{
 const offset=approach.get(i);return offset?p.clone().add(V(offset[0],0,offset[1])):p.clone();
});
export const road=new T.CatmullRomCurve3(routePoints,true,'catmullrom',.39);
road.arcLengthDivisions=4000;
export const distance=road.getLength();
road.getUtoTmapping=survey.getUtoTmapping.bind(survey);
const elevations=new T.CatmullRomCurve3(plan.map(([, ,height],i)=>V(i,height,0)),true,'catmullrom',.39);
function knot(i){
 const arc=survey.getLengths(survey.arcLengthDivisions),s=i/plan.length*(arc.length-1);
 const a=Math.floor(s);return T.MathUtils.lerp(arc[a],arc[Math.min(arc.length-1,a+1)],s-a)/survey.getLength();
}
export const coastline={departure:knot(plan.indexOf(departure)),marketLock:knot(1),outerBay:knot(11),northGate:knot(plan.indexOf(northCaisson))};
// Vertical alignment of the elevated quay. Both transition grades meet the
// existing approaches with zero change in slope or curvature at their ends.
export function causewayLift(u){
 const t=(u-.013)/.081;
 return t<=0||t>=1?0:1.32*(64*t*t*t*(1-t)*(1-t)*(1-t));
}
export function grade(u){
 const station=wrap(u,1);
 return elevations.getPoint(road.getUtoTmapping(station)).y+causewayLift(station);
}
export function roadScale(u){
 u=wrap(u,1);
 const inland=T.MathUtils.smoothstep(u,.20,.36)*(1.-T.MathUtils.smoothstep(u,.81,.955));
 const sill=T.MathUtils.smoothstep(u,.924,.975)+1.-T.MathUtils.smoothstep(u,.065,.133);
 return .42+.58*inland-.078*Math.min(sill,1.);
}
export function lateral(u,off){const a=Math.abs(off),k=roadScale(u);return Math.sign(off)*(a<=14?a*k:14*k+a-14)}
export function at(u,off=0,y=0){
 u=wrap(u,1);const base=road.getPointAt(u),d=road.getTangentAt(u);return base.addScaledVector(V(-d.z,0,d.x),lateral(u,off)).add(V(0,grade(u)+y,0));
}
// At the crown the road is 1.6 percent of its half-width above the gutter.
// Bridge foundations and adjacent pavements retain their surveyed elevations.
export function carriageway(u,off=0,y=0){
 const span=Math.max(0,1-Math.pow(Math.abs(off)/10.5,1.42));
 return at(u,off,y+.016*10.5*roadScale(u)*span);
}
export const nodes=Array.from({length:1200},(_,i)=>at(i/1200));
// Project onto adjacent segments so that contact and vertical travel remain smooth at 60 Hz.
export function nearest(x,z){
 let best=Infinity,index=0;
 for(let i=0;i<nodes.length;i+=4){const p=nodes[i],d=(p.x-x)**2+(p.z-z)**2;if(d<best){best=d;index=i}}
 let answer=null;best=Infinity;
 for(let j=-5;j<5;j++){
  const i=wrap(index+j,nodes.length),a=nodes[i],b=nodes[(i+1)%nodes.length],dx=b.x-a.x,dz=b.z-a.z;
  const t=T.MathUtils.clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1);
  const qx=a.x+dx*t,qz=a.z+dz*t,d=(x-qx)**2+(z-qz)**2;
  if(d<best){best=d;answer={u:(i+t)/nodes.length,d:Math.sqrt(d),p:V(qx,a.y+(b.y-a.y)*t,qz)}}
 }
 return answer;
}

export function wrapJunction(u){return Math.abs(u-.282)<.011||Math.abs(u-.775)<.012}
