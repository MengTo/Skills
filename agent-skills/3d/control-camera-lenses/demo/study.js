const T=THREE,canvas=document.querySelector('canvas'),renderer=new T.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(2,devicePixelRatio));const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.04,10);
scene.background=new T.Color(0x88968d);scene.fog=new T.FogExp2(0x96a29a,.19);
const target=new T.WebGLRenderTarget(1,1);target.depthTexture=new T.DepthTexture(1,1,T.UnsignedShortType);
const leaf=new T.Shape();const contour=[[0,-.10],[.31,-.20],[.25,-.06],[.78,.18],[.48,.22],[.66,.68],[.30,.47],[.38,.92],[.14,.63],[0,1.22],[-.14,.63],[-.38,.92],[-.30,.47],[-.66,.68],[-.48,.22],[-.78,.18],[-.25,-.06],[-.31,-.20]];
contour.forEach(([x,y],i)=>{if(i)leaf.lineTo(x,y);else leaf.moveTo(x,y);});leaf.closePath();
const leafGeo=new T.ShapeGeometry(leaf);const twigMat=new T.MeshStandardMaterial({color:0x493b29,roughness:.8});
let seed=2149;const rand=()=>((seed=Math.imul(1664525,seed)+1013904223|0)>>>0)/4294967296;
const palette=[0xa94332,0xc05630,0xc77b38,0xce913e,0x975139].map(c=>new T.MeshStandardMaterial({color:c,side:T.DoubleSide,roughness:.74}));
function branch(a,b,r){const direction=b.clone().sub(a);const m=new T.Mesh(new T.CylinderGeometry(r*.55,r,direction.length(),6),twigMat);m.position.copy(a).lerp(b,.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());scene.add(m);}
for(const z of [-1.15,-2.4,-4.35])for(let j=0;j<(z> -2?1:4);j++){
 const sign=j%2?-1:1,x=z> -2?-.62:(rand()-.5)*3.4,y=z> -2?-.18:(rand()-.5)*.85;
 const a=new T.Vector3(x,y,z),b=new T.Vector3(x+sign*(.67+rand()*.23),y+.15+rand()*.35,z);branch(a,b,.009);
 for(let i=1;i<=12;i++){
  const origin=a.clone().lerp(b,i/13),end=origin.clone().add(new T.Vector3(.07*sign,.09*(i%2?1:-1),0));branch(origin,end,.0025);
  const m=new T.Mesh(leafGeo,palette[Math.floor(rand()*palette.length)]);m.position.copy(end);const scale=.06+rand()*.06;m.scale.setScalar(scale);m.rotation.set(.42*(rand()-.5),.47*(rand()-.5),i%2?-.8:-2.75);scene.add(m);
 }
}
scene.add(new T.HemisphereLight(0xfff6db,0x77806b,1.55));const sun=new T.DirectionalLight(0xffd69e,2);sun.position.set(-1,2,2);scene.add(sun);
const pass=new T.Scene(),screen=new T.OrthographicCamera(-1,1,1,-1,0,1),uniforms={colorMap:{value:target.texture},depthMap:{value:target.depthTexture},size:{value:new T.Vector2()},focus:{value:1.15},gain:{value:1}};
const mat=new T.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,vertexShader:'varying vec2 point;void main(){point=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`
 varying vec2 point;uniform sampler2D colorMap,depthMap;uniform vec2 size;uniform float focus,gain;
 float depthAt(vec2 uv){float d=texture2D(depthMap,uv).x;return .04*10./(10.-d*(10.-.04));}
 void main(){vec3 sum=texture2D(colorMap,point).rgb;float weight=1.,base=depthAt(point),r=clamp(abs(gain*(1.-focus/base)),0.,28.);
 for(int i=0;i<36;i++){float u=(float(i)+.5)/36.,a=float(i)*2.399963;vec2 q=clamp(point+vec2(cos(a),sin(a))*sqrt(u)*r/size,vec2(0.),vec2(1.));
 float z=depthAt(q);float w=1.-smoothstep(.02,.12,base-z);sum+=texture2D(colorMap,q).rgb*w;weight+=w;}gl_FragColor=vec4(sum/weight,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`.replace('#include <colorspace_fragment>',T.ShaderChunk.colorspace_fragment?'#include <colorspace_fragment>':'#include <encodings_fragment>')});
pass.add(new T.Mesh(new T.PlaneGeometry(2,2),mat));
function render(){const mm=Number(document.getElementById('mm').value),distance=Number(document.getElementById('depth').value),ap=Number(document.getElementById('ap').value);
 camera.aspect=innerWidth/innerHeight;camera.fov=verticalFieldOfView(mm);camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);
 const sz=renderer.getDrawingBufferSize(uniforms.size.value);target.setSize(sz.x,sz.y);uniforms.focus.value=distance;
 uniforms.gain.value=signedBlurRadius(1e9,distance,mm,ap,20.25,sz.y);
 document.querySelector('output').value=distance.toFixed(2)+' m';renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(pass,screen);
}
addEventListener('resize',render);document.querySelector('form').addEventListener('input',render);render();
