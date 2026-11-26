// A complete quay with physical emitters. X/Z are metres and +Y is up.
(() => {
  const T=HarbourDemoEngine, view=document.querySelector('#view');
  let renderer;
  try { renderer=new T.WebGLRenderer({canvas:view,antialias:true,powerPreference:'high-performance'}); }
  catch { const error=document.querySelector('#error'); error.hidden=false; error.textContent='Enable WebGL 2 to view the water study.'; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.10;
  const scene=new T.Scene(), camera=new T.PerspectiveCamera(47,1,.1,280);
  scene.background=new T.Color(0x486377); scene.fog=new T.FogExp2(0x45586c,.017);
  scene.add(new T.HemisphereLight(0xcbdcea,0x6c6456,1.55));
  const moon=new T.DirectionalLight(0xffdfc2,1.9); moon.position.set(-23,32,-11); scene.add(moon);
  // Paint a cloud deck in world direction, so the mirrored camera sees the same sky.
  const dome=new T.Mesh(new T.SphereGeometry(240,40,18),new T.ShaderMaterial({
    side:T.BackSide,depthWrite:false,uniforms:{},
    vertexShader:'varying vec3 dir; void main(){ dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader:`varying vec3 dir;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 b=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(b),h(b+vec2(1.,0.)),f.x),mix(h(b+vec2(0.,1.)),h(b+1.),f.x),f.y);}
    void main(){vec3 d=normalize(dir);float e=max(d.y,0.);vec2 p=d.xz/(.16+e)*2.4;
    float n=noise(p*1.2)*.52+noise(p*2.9)*.27+noise(p*7.5)*.14+noise(p*18.)*.07;
    float dusk=pow(max(0.,dot(normalize(vec3(-.60,.06,-1.)),d)),9.);
    vec3 c=mix(vec3(.095,.158,.193),vec3(.018,.039,.080),smoothstep(.01,.45,e));
    c+=vec3(.20,.075,.048)*dusk*exp(-6.*e);
    c=mix(c*.62,c*1.43,smoothstep(.15,.84,n));gl_FragColor=vec4(c,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`}));
  dome.renderOrder=-5; scene.add(dome);
  let seed=207;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const basic=color=>new T.MeshBasicMaterial({color});
  const paint=(color,metalness=.2,roughness=.62)=>new T.MeshStandardMaterial({color,metalness,roughness});
  const dark=paint(0x253240), steel=paint(0x59646b,.5), rust=paint(0x91573a), timber=paint(0x684e40),
    concrete=paint(0x797776), rubber=paint(0x262d32), bone=paint(0xe5dfbf), stripe=paint(0xf0a04f),
    amber=basic(0xffaf55), ice=basic(0xc2fff4), ruby=basic(0xff5458);
  const cube=new T.BoxGeometry(), cylinder=new T.CylinderGeometry(1,1,1,12);
  const batches=new Map(),transform=new T.Object3D(),up=new T.Vector3(0,1,0);
  function part(geometry,material,x,y,z,w,h,d,rot=0,parent) {
    const obj=parent?new T.Mesh(geometry,material):transform;
    obj.position.set(x,y,z); obj.rotation.set(0,rot,0); obj.scale.set(w,h,d);
    if(parent){parent.add(obj);return obj;}
    obj.updateMatrix();
    const key=geometry.uuid+material.uuid;
    if(!batches.has(key))batches.set(key,{geometry,material,matrices:[]});
    batches.get(key).matrices.push(obj.matrix.clone());
  }
  const box=(m,x,y,z,w,h,d,rot=0,parent)=>part(cube,m,x,y,z,w,h,d,rot,parent);
  const pole=(m,x,y,z,r,h,parent)=>part(cylinder,m,x,y,z,r,h,r,0,parent);
  function beam(m,a,b,r,parent) {
    const A=new T.Vector3(...a),B=new T.Vector3(...b),v=B.clone().sub(A);
    const obj=new T.Mesh(cylinder,m); obj.position.copy(A).lerp(B,.5);
    obj.scale.set(r,v.length(),r); obj.quaternion.setFromUnitVectors(up,v.normalize()); obj.updateMatrix();
    if(parent){parent.add(obj);return;}
    const key=cylinder.uuid+m.uuid;
    if(!batches.has(key))batches.set(key,{geometry:cylinder,material:m,matrices:[]});
    batches.get(key).matrices.push(obj.matrix.clone());
  }
  function texture(w,h,draw) {
    const c=document.createElement('canvas'); c.width=w; c.height=h;
    draw(c.getContext('2d'),w,h); const tex=new T.CanvasTexture(c); tex.colorSpace=T.SRGBColorSpace;
    tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy()); return tex;
  }
  const elevations=[];
  for(let k=0;k<5;k++) {
    const map=texture(256,512,(g,w,h)=>{
      g.fillStyle=['#3e484e','#434951','#394654','#48535b','#393f48'][k];g.fillRect(0,0,w,h);
      for(let y=0;y<16;y++)for(let x=0;x<8;x++){
        const X=x*32,Y=y*32;
        g.fillStyle='#2c373d';g.fillRect(X+3,Y+4,27,22);
        g.fillStyle=rand()<.29?['#ffe5b3','#e0b68b','#a0bfbb','#ffd398','#a2aeb2'][Math.floor(rand()*5)]:'#405062';
        g.fillRect(X+6,Y+7,21,15);g.fillStyle='#33404b';g.fillRect(X+16,Y+7,2,15);
        if(rand()<.65){g.fillStyle='#5a6264';g.fillRect(X+5,Y+7,23,2+rand()*6);}
        g.fillStyle='#596067';g.fillRect(X,Y+29,32,2);
      }
    }); elevations.push(new T.MeshBasicMaterial({map,color:0xc9d2d7}));
  }
  for(let row=0;row<3;row++)for(let x=-95;x<94;) {
    const w=3+rand()*6,h=3+rand()*(row?17:6),z=-30-row*11-rand()*6;
    const m=elevations[Math.floor(rand()*elevations.length)];box(m,x,h/2,z,w,h,4+rand()*3);
    box(dark,x,h+.12,z,w+.18,.23,6);box(steel,x+rand()-.5,h+.7,z,1.5,1.1,1.9);
    if(h>18&&rand()<.5){pole(steel,x,h+1.4,z,.045,2.7);box(ruby,x,h+2.8,z,.1,.14,.1);}
    x+=w+1+rand()*3;
  }
  const wall=texture(512,192,(g,w,h)=>{
    g.fillStyle='#69716e';g.fillRect(0,0,w,h);
    for(let i=0;i<3500;i++){g.fillStyle=rand()<.5?'#1c252b22':'#e2d8c419';g.fillRect(rand()*w,rand()*h,1+rand()*3,1+rand()*6);}
    for(let i=0;i<12;i++){let x=rand()*w;g.fillStyle='#252d302d';g.fillRect(x,0,2+rand()*6,25+rand()*155);}
    g.fillStyle='#344343';g.fillRect(0,146,w,46);g.fillStyle='#596862';g.fillRect(0,140,w,6);
  });
  const wallMat=new T.MeshStandardMaterial({map:wall,roughness:.92});
  for(let x=-64;x<=64;x+=4) {
    box(wallMat,x,.62,-12.4,3.99,2.9,1);box(concrete,x,2.1,-12.3,4.02,.2,1.26);
    box(stripe,x+.28,1.93,-11.85,1.6,.14,.11);box(dark,x-.25,1.1,-11.73,.24,2.1,.27);
  }
  box(concrete,0,1.92,-18,132,.34,10.7);
  const shedBody=paint(0x495b61), panel=paint(0x768187), door=paint(0x405865), glassPanes=basic(0x8aa9ae);
  for(let n=-3;n<4;n++){
    const x=n*12.4;
    box(shedBody,x,3.9,-16.8,11.9,3.5,4.2);box(dark,x,5.69,-16.8,12.25,.25,4.55);
    for(let k=-5;k<=5;k++)box(panel,x+k,3.87,-14.65,.065,3.45,.13);
    for(let k=-1;k<=1;k++){
      box(door,x+k*3.8,3.42,-14.51,3,2.48,.14);
      for(let j=0;j<8;j++)box(steel,x+k*3.8,2.5+j*.26,-14.40,2.96,.033,.07);
      box(amber,x+k*3.8,4.98,-14.44,1.02,.065,.08);
      box(steel,x+k*3.8,4.45,-14.34,2.80,.32,.06);
      for(let j=0;j<5;j++)box((n+k)%3===0?amber:glassPanes,x+k*3.8-1.06+j*.53,4.45,-14.28,.44,.22,.05);
    }
  }
  function sign(x,y,z,w,h,top,bottom,bg,ink) {
    box(dark,x,y,z-.10,w+.22,h+.20,.25);
    const map=texture(768,192,(g,W,H)=>{
      g.fillStyle=bg;g.fillRect(0,0,W,H);g.strokeStyle=ink;g.lineWidth=3;g.strokeRect(8,8,W-16,H-16);
      g.fillStyle=ink;g.textAlign='center';g.font='bold 86px Helvetica, Arial, sans-serif';g.fillText(top,W/2,107,W-55);
      g.font='500 30px monospace';g.fillText(bottom,W/2,156,W-50);
    });
    const face=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map}));
    face.position.set(x,y,z+.04);scene.add(face);
    for(const a of [-.38,.38])box(steel,x+w*a,y-h*.63,z-.1,.13,h*.48,.18);
  }
  sign(-7,6.67,-14.8,9.6,2.0,'東雲埠頭','S H I N O N O M E   /   P I E R   0 4','#83e3e2','#16363d');
  sign(14.5,6.45,-14.74,6.1,1.63,'港湾倉庫','B O N D E D   S T O R E S','#f7ab69','#4f291d');
  const lamps=[];
  function emitter(x,y,z,color,power,radius){lamps.push({position:new T.Vector3(x,y,z),color,power,radius});}
  emitter(-7,6.67,-14.7,0x70f4ff,78,1.15); emitter(14.5,6.45,-14.7,0xff9760,64,.8);
  const haloMap=texture(64,64,(g,w,h)=>{
    const gradient=g.createRadialGradient(32,32,0,32,32,32);
    gradient.addColorStop(0,'#ffffff');gradient.addColorStop(.12,'#ffffff8a');gradient.addColorStop(.38,'#ffffff22');gradient.addColorStop(1,'#ffffff00');
    g.fillStyle=gradient;g.fillRect(0,0,w,h);
  });
  function lantern(x,y,z,glow=0xffbd76,scale=1) {
    const sprite=new T.Sprite(new T.SpriteMaterial({map:haloMap,color:glow,blending:T.AdditiveBlending,depthWrite:false,transparent:true}));
    sprite.position.set(x,y,z);sprite.scale.setScalar(scale);scene.add(sprite);
  }
  for(let i=-3;i<=3;i++){
    const x=i*8.4+1.2;
    pole(steel,x,3.73,-12.3,.070,3.3);
    beam(steel,[x,5.32,-12.3],[x,5.55,-11.5],.055);
    box(dark,x,5.51,-11.48,.55,.14,.29);box(amber,x,5.41,-11.46,.44,.09,.23);
    lantern(x,5.41,-11.46,0xffaa66,1.55);
    if(i>=-2&&i<=1)emitter(x,5.4,-11.46,0xffaf64,22,.15);
  }
  // The lattice crane and its lifting cable register in the moving reflection.
  function crane(x,z,s) {
    const at=(p)=>[x+p[0]*s,2.05+p[1]*s,z+p[2]*s];
    const rod=(a,b,r=.08)=>beam(rust,at(a),at(b),r*s);
    for(const k of [-1,1])for(const j of [-1,1])rod([k*1.6,0,j*1.1],[k*.78,6.3,j*.65],.16);
    for(const k of [-1,1]){
      rod([-1.4,.4,k],[.85,5.1,k*.69]);rod([1.4,.4,k],[-.85,5.1,k*.69]);
      rod([0,6.5,k*.63],[7.6,11.5,k*.29]);rod([0,7.78,k*.63],[7.6,11.85,k*.29]);
      for(let j=0;j<6;j++){const a=j/6,b=(j+1)/6;rod([7.6*a,6.5+5*a,k*(.63-.34*a)],[7.6*b,7.78+4.07*b,k*(.63-.34*b)],.05);}
    }
    box(rust,x,2.05+6.44*s,z,3.6*s,1.05*s,2.2*s);
    box(dark,x+1*s,2.05+7.05*s,z+.1*s,1.4*s,1.1*s,1.74*s);
    beam(dark,at([7.56,11.6,.05]),at([7.56,5,.05]),.025*s);box(stripe,x+7.56*s,2.05+4.96*s,z,1.1*s,.31*s,.38*s);
  }
  crane(-25,-18,1.25);crane(26,-21,.9);
  // Fender caps and bollards give a waterline reference close to the camera.
  for(const x of [10.1,12.5]){
    for(let z=-6;z<=9;z+=3.5){
      pole(timber,x,.52,z,.23,2.55);pole(dark,x,1.78,z,.24,.14);
      if(x<11){box(rubber,x-.20,.65,z,.18,1.05,.30);box(bone,x-.21,1.15,z,.19,.17,.30);}
    }
  }
  const boards=texture(512,128,(g,w,h)=>{
    g.fillStyle='#76604c';g.fillRect(0,0,w,h);
    for(let i=0;i<900;i++){let x=rand()*w,y=rand()*h;g.fillStyle=rand()<.5?'#2c1f2027':'#ecce9f23';g.fillRect(x,y,4+rand()*120,1+rand()*1.3);}
    for(const x of [28,480])for(const y of [18,103]){g.fillStyle='#342d2e';g.fillRect(x,y,3,4);}
  });
  const wetWood=new T.MeshStandardMaterial({map:boards,roughness:.48,metalness:.16});
  for(let z=-7;z<10;z+=.32)box(wetWood,11.30,1.34,z,2.9,.22,.30);
  for(const z of [-5,2,8.7]){
    pole(dark,10.4,1.68,z,.13,.46);pole(dark,10.4,1.92,z,.20,.08);
  }
  pole(steel,12.35,2.55,6.7,.10,2.5);pole(ice,12.35,3.88,6.7,.13,.23);lantern(12.35,3.88,6.7,0x9ae8dc,1.1);
  emitter(12.35,3.88,6.7,0x94f6e5,10,.13);

  // A lofted displacement hull, separate boot stripe, wheelhouse and guard rails.
  const launch=new T.Group();launch.rotation.order='YXZ';scene.add(launch);
  function hull() {
    const stations=[[-2.85,.76],[-2.58,.96],[-1.2,1.04],[.75,1.01],[1.81,.80],[2.55,.40],[2.99,.035]];
    const geometry=new T.BufferGeometry(),v=[],colors=[],index=[];
    const levels=[[-.34,.46,0x552f26],[-.11,.84,0xc7653e],[.075,.92,0xda8245],[.13,.935,0xe4d9ad],[.18,.946,0x24505b],[.62,1,0x315c62]];
    function quad(a,b,c,d,color){
      const off=v.length/3, tint=new T.Color(color);
      v.push(...a,...b,...c,...d);for(let n=0;n<4;n++)colors.push(tint.r,tint.g,tint.b);
      index.push(off,off+1,off+2,off,off+2,off+3);
    }
    const pt=(i,j,s)=>[s*stations[i][1]*levels[j][1],levels[j][0]+.14*Math.pow(Math.max(0,stations[i][0])/3,2),stations[i][0]];
    for(let i=0;i<stations.length-1;i++){
      for(let j=0;j<levels.length-1;j++)for(const s of [-1,1])quad(pt(i,j,s),pt(i+1,j,s),pt(i+1,j+1,s),pt(i,j+1,s),levels[j][2]);
      quad(pt(i,5,-1),pt(i,5,1),pt(i+1,5,1),pt(i+1,5,-1),0x9f8c73);
    }
    for(const i of [0,stations.length-1])for(let j=0;j<5;j++)quad(pt(i,j,-1),pt(i,j,1),pt(i,j+1,1),pt(i,j+1,-1),levels[j][2]);
    geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(v),3));geometry.setAttribute('color',new T.BufferAttribute(new Float32Array(colors),3));
    geometry.setIndex(index);geometry.computeVertexNormals();launch.add(new T.Mesh(geometry,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.49,metalness:.2})));
  }
  hull();
  const windowMap=texture(128,128,(g,w,h)=>{
    const t=g.createLinearGradient(0,0,w/3,h);t.addColorStop(0,'#aec0bc');t.addColorStop(.38,'#76989a');t.addColorStop(.52,'#537d84');t.addColorStop(.56,'#48626c');t.addColorStop(1,'#23343e');
    g.fillStyle=t;g.fillRect(0,0,w,h);g.fillStyle='#c5d7cf38';g.beginPath();g.moveTo(w*.64,0);g.lineTo(w*.88,0);g.lineTo(w*.36,h);g.lineTo(w*.31,h);g.fill();
  });
  const glass=new T.MeshBasicMaterial({map:windowMap});
  box(bone,0,.90,.42,1.54,.60,2.05,0,launch);box(dark,0,1.46,.41,1.51,.68,2.02,0,launch);
  for(const s of [-1,1])for(let j=0;j<3;j++)box(glass,s*.76,1.48,-.27+j*.64,.035,.48,.52,0,launch);
  for(const s of [-1,1])box(glass,s*.36,1.47,1.43,.60,.48,.035,0,launch);
  box(stripe,0,1.84,.40,1.75,.14,2.23,0,launch);box(bone,0,1.92,.4,1.67,.08,2.15,0,launch);
  pole(dark,0,2.28,.27,.05,.66,launch);beam(steel,[-.46,2.45,.27],[.46,2.45,.27],.032,launch);pole(ice,0,2.66,.27,.055,.15,launch);
  box(amber,0,1.80,1.55,.31,.075,.075,0,launch);
  for(const s of [-1,1]){
    for(const z of [-2.2,-1.66,-1.1])beam(steel,[s*.84,.65,z],[s*.84,1.03,z],.022,launch);
    beam(steel,[s*.84,1.03,-2.28],[s*.84,1.03,-1.04],.028,launch);
    for(const [x,z,X,Z] of [[.83,1.5,.64,2.06],[.64,2.06,.10,2.77]]){
      beam(steel,[s*x,.71,z],[s*x,1.06,z],.022,launch);beam(steel,[s*x,1.06,z],[s*X,1.06,Z],.027,launch);
    }
    for(const z of [-1.9,-.8,.4]){
      const f=pole(rubber,s*.98,.49,z,.105,.43,launch);f.rotation.z=s*.12;
      beam(timber,[s*.95,.72,z-.08],[s*.98,.63,z],.016,launch);
    }
  }
  const nameMap=texture(512,96,(g,w,h)=>{
    g.fillStyle='#24505b';g.fillRect(0,0,w,h);g.fillStyle='#f2edd0';g.font='600 67px Helvetica, sans-serif';g.textAlign='center';g.fillText('SHIO  04',w*.5,73);
  });
  for(const s of [-1,1]){
    const name=new T.Mesh(new T.PlaneGeometry(1.07,.20),new T.MeshBasicMaterial({map:nameMap}));
    name.position.set(s*1.01,.43,.10);name.rotation.y=s*Math.PI/2;launch.add(name);
    box(bone,s*.85,1.22,.48,.055,.043,2.14,0,launch);
    box(stripe,s*.795,.98,.36,.04,.06,1.98,0,launch);
    box(s===1?ice:ruby,s*.82,1.75,1.23,.09,.08,.13,0,launch);
    for(const z of [-.55,.12,.76,1.39])box(bone,s*.768,1.47,z,.05,.55,.045,0,launch);
    for(let k=0;k<4;k++)box(dark,s*.79,.90,-.44+k*.075,.035,.20,.028,0,launch);
  }
  pole(steel,-.40,2.06,-.34,.13,.22,launch);pole(dark,-.40,2.18,-.34,.16,.055,launch);
  box(steel,.32,2.02,-.16,.48,.13,.67,0,launch);box(dark,.32,2.10,-.16,.41,.035,.57,0,launch);
  beam(dark,[.54,1.95,-.46],[.55,2.84,-.54],.015,launch);
  beam(steel,[-.65,.81,1.66],[-.65,1.16,1.66],.024,launch);
  beam(steel,[.65,.81,1.66],[.65,1.16,1.66],.024,launch);
  box(rust,0,.73,2.06,.38,.12,.46,0,launch);
  box(timber,0,.77,-1.2,.77,.29,.48,0,launch);box(dark,0,.77,-2,.85,.23,.32,0,launch);
  for(const {geometry,material,matrices} of batches.values()){
    const instances=new T.InstancedMesh(geometry,material,matrices.length);
    matrices.forEach((matrix,i)=>instances.setMatrixAt(i,matrix));instances.computeBoundingSphere();scene.add(instances);
  }
  const water=HarbourWater.create(T,T.Reflector,{size:170,segments:200});
  scene.add(water.mesh);water.setLights(lamps);
  const presets={calm:[.16,0],rain:[.88,.76],squall:[1.65,1.4]};
  water.setWeather(...presets.rain);
  let time=0,low=false,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,frameId=0,last=0;
  function locateBoat(t){
    const a=t*.12-.53,x=Math.sin(a)*7.6-1.4,z=3.8+Math.cos(a)*3.35;
    const yaw=Math.atan2(7.6*Math.cos(a),-3.35*Math.sin(a)),fx=Math.sin(yaw),fz=Math.cos(yaw);
    const length=2.2,beam=.74, sample=(f,s)=>water.heightAt(x+fx*f+fz*s,z+fz*f-fx*s);
    const bow=sample(length,0),stern=sample(-length,0),star=sample(0,beam),port=sample(0,-beam);
    launch.position.set(x,(bow+stern+star+port)/4,z);
    launch.rotation.set(-Math.atan2(bow-stern,2*length),yaw,Math.atan2(star-port,2*beam),'YXZ');
    water.trackStern(x-fx*2.75,z-fz*2.75);
  }
  // Pre-roll provides a complete trail when motion is paused on the first frame.
  for(let i=0;i<=28;i++){time=-6.44+i*.23;water.setTime(time);locateBoat(time);}
  time=0;
  function draw(){water.setTime(time);locateBoat(time);renderer.render(scene,camera);}
  function frame(stamp){
    if(last)time+=Math.min(.09,(stamp-last)/1000);
    last=stamp;draw();frameId=requestAnimationFrame(frame);
  }
  function sync(){
    cancelAnimationFrame(frameId);last=0;
    const b=document.querySelector('#pause');b.textContent=paused?'Play':'Pause';b.setAttribute('aria-pressed',String(paused));
    draw();if(!paused&&!document.hidden)frameId=requestAnimationFrame(frame);
  }
  function resize(){
    const w=view.clientWidth,h=view.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;
    const narrow=w/h<1.1;
    camera.position.set(...(low?[6.6,1.18,16]:narrow?[6.8,4.8,20.4]:[8.1,4.85,20.8]));
    camera.lookAt(...(low?[0,1.25,-5]:narrow?[-1,1.40,-1.9]:[-1,1.3,-1.1]));
    camera.updateProjectionMatrix();draw();
  }
  document.querySelectorAll('[data-weather]').forEach(btn=>btn.addEventListener('click',()=>{
    water.setWeather(...presets[btn.dataset.weather]);
    document.querySelectorAll('[data-weather]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));draw();
  }));
  document.querySelector('#angle').addEventListener('click',event=>{low=!low;event.currentTarget.setAttribute('aria-pressed',String(low));resize();});
  document.querySelector('#pause').addEventListener('click',()=>{paused=!paused;sync();});
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',event=>{paused=event.matches;sync();});
  document.addEventListener('visibilitychange',sync);
  new ResizeObserver(resize).observe(view);resize();sync();
})();
