const T=THREE,canvas=document.querySelector('canvas'),scene=new T.Scene();
const renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(2,devicePixelRatio));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
scene.background=new T.Color(0x5c695b);scene.fog=new T.FogExp2(0x7b8371,1.1);
const camera=new T.PerspectiveCamera(23,1,.01,7),rig=makeWagtail(T);scene.add(rig.bird);
const ground=new T.Mesh(new T.PlaneGeometry(8,8),new T.MeshStandardMaterial({color:0x596250,roughness:.91}));ground.rotation.x=-Math.PI/2;ground.position.y=-.085;ground.receiveShadow=true;scene.add(ground);
const geo=new T.IcosahedronGeometry(1,4),pos=geo.attributes.position,colors=[];
for(let i=0;i<pos.count;i++){
 const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),n=Math.sin(9*x+1.2*Math.cos(15*z))*Math.cos(13*y+3*x),f=1+.048*n;
 pos.setXYZ(i,x*f*.135,Math.min(.045,y*f*.068)-.045,z*f*.083);
 const c=new T.Color(n>.29?0x7c8056:0x72716a).multiplyScalar(.8+n*.13);colors.push(c.r,c.g,c.b);
}
geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
const stone=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:.79}));stone.receiveShadow=stone.castShadow=true;scene.add(stone);
const fill=new T.HemisphereLight(0xf3eedb,0x66695a,1.6);scene.add(fill);
const key=new T.DirectionalLight(0xffddb3,2.1);key.position.set(-.7,1.24,.69);key.castShadow=true;
Object.assign(key.shadow.camera,{left:-.24,right:.24,bottom:-.24,top:.24,near:.1,far:3});key.shadow.camera.updateProjectionMatrix();key.shadow.mapSize.set(1024,1024);key.shadow.normalBias=.00024;scene.add(key);
const angle=document.getElementById('angle'),choice=document.getElementById('pose'),btn=document.getElementById('pause');
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches,seconds=0,weight=0,previous=null;
function label(){btn.textContent=paused?'Play':'Pause';btn.setAttribute('aria-pressed',String(paused));}
btn.onclick=()=>{paused=!paused;label();};label();
function frame(now){
 const dt=previous===null?0:Math.min(.065,(now-previous)/1000);previous=now;
 if(!paused)seconds+=dt;
 weight+=(Number(choice.value)-weight)*(1-Math.exp(-7*dt));rig.pose(seconds,weight);
 rig.bird.position.y=weight*(.056+.008*Math.sin(seconds*3));
 const a=Number(angle.value)*Math.PI/180;camera.position.set(.59*Math.cos(a),.14+.022*weight,.59*Math.sin(a));camera.lookAt(0,.044+.048*weight,-.015);
 renderer.render(scene,camera);requestAnimationFrame(frame);
}
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();requestAnimationFrame(frame);
