// Dimensions are in metres. Stations run from the tail (-Z) to the nose (+Z).
// Each station gives distance as a fraction of half-length, half-beam,
// centre deck height, shoulder height and rocker/valance height.
export const designs=[
 {id:'kite',plate:'KT · 04',length:4.87,beam:1.99,paint:'#d5cbb4',trim:'#36403e',
  axles:[[-1.45,.351,.267,.829],[1.39,.351,.246,.822]],
  body:[[-1,.828,.748,.702,.312],[-.96,.891,.795,.731,.282],[-.87,.966,.858,.763,.244],[-.62,.996,.904,.782,.231],[-.34,.956,.900,.748,.224],[.14,.947,.862,.707,.228],[.44,.982,.824,.728,.229],[.58,.988,.774,.738,.235],[.77,.927,.667,.590,.230],[.94,.849,.541,.462,.245],[1,.775,.483,.415,.292]],
  cabin:{back:-1.57,front:.81,rearTop:-.83,frontTop:.105,roof:1.287,width:.713,crown:.045,belt:.855,topBack:.90,topFront:.94,pillar:.335,quarter:.055},rim:.705},
 {id:'latch',plate:'RP · 12',length:4.99,beam:2.07,paint:'#944b3e',trim:'#424844',
  axles:[[-1.47,.445,.323,.905],[1.46,.445,.315,.908]],
  body:[[-1,.889,1.108,1.031,.469],[-.96,.998,1.141,1.093,.385],[-.76,1.017,1.158,1.108,.368],[-.53,1.013,1.157,1.103,.365],[-.31,.981,1.175,1.102,.357],[.10,.984,1.175,1.087,.361],[.36,1.009,1.135,1.059,.368],[.62,1.034,1.104,1.041,.369],[.88,.981,1.041,.984,.378],[.96,.931,.998,.922,.396],[1,.862,.930,.875,.458]],
  cabin:{back:-.96,front:.77,rearTop:-.79,frontTop:.29,roof:1.832,width:.747,crown:.038,belt:.915,topBack:.99,topFront:.977,pillar:.27,quarter:.036},rim:.502},
 {id:'mica',plate:'MC · 02',length:3.65,beam:1.72,paint:'#77a59f',trim:'#344944',
  axles:[[-1.105,.313,.199,.743],[1.056,.307,.184,.737]],
  body:[[-1,.673,.804,.663,.354],[-.97,.734,.866,.733,.287],[-.87,.818,.928,.797,.211],[-.67,.851,.933,.789,.190],[-.32,.857,.892,.747,.179],[.08,.841,.880,.729,.177],[.32,.849,.854,.701,.181],[.60,.851,.798,.705,.187],[.81,.817,.716,.665,.207],[.94,.751,.633,.601,.241],[1,.645,.589,.549,.262]],
  cabin:{back:-1.691,front:.837,rearTop:-1.085,frontTop:.235,roof:1.485,width:.629,crown:.055,belt:.899,topBack:.930,topFront:.96,pillar:.452,quarter:.108},rim:.626},
 {id:'parcel',plate:'SV · 09',length:4.49,beam:1.93,paint:'#b98c50',trim:'#414740',
  axles:[[-1.34,.341,.224,.822],[1.31,.340,.215,.811]],
  body:[[-1,.834,.975,.908,.306],[-.98,.921,1.025,.976,.266],[-.89,.958,1.036,.997,.241],[-.65,.966,1.041,.999,.225],[-.23,.960,1.044,.996,.226],[.25,.943,1.045,.979,.231],[.42,.949,1.013,.953,.226],[.70,.954,.959,.907,.244],[.91,.919,.891,.834,.265],[1,.839,.811,.774,.303]],
  cabin:{back:-2.11,front:.96,rearTop:-2.033,frontTop:.34,roof:1.929,width:.792,crown:.075,belt:.941,topBack:.98,topFront:.936,pillar:.612,quarter:.029},rim:.594}
];
export const soundingCourier={...designs[0],survey:true,finishId:'kite-survey',paint:'#535858',
 rearLampRise:.232,
 body:designs[0].body.map(station=>{
  const [z,beam,deck,shoulder,rocker]=station;
  const u=Math.max(0,Math.min(1,(-z-.16)/.80)),rise=u*u*(3.-2.*u);
  const rearHaunch=Math.exp(-((z+.665)**2)/.055);
  return [z,beam+.035*rearHaunch,deck+.232*rise,shoulder+.214*rise+.024*rearHaunch,rocker+.249*rise];
 }),
 axles:[[-1.69,.406,.305,.901],[1.405,.383,.271,.861]],rim:.557,
 cabin:{...designs[0].cabin,back:-1.923,rearTop:-1.432,frontTop:.093,roof:1.379,width:.727,quarter:.065,pillar:.379}};
export function wheelMounts(d){
 return [-1,1].flatMap(side=>d.axles.map(([z,r,width,track])=>({x:side*track/d.length,y:r*.979/d.length,z:z/d.length,r:r/d.length,width:width/d.length,rim:d.rim,survey:!!d.survey,side})));
}
