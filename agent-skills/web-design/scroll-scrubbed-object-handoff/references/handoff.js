import { lightMint } from "./coin-light.js";
import { startSurfaceLight } from "./surface-light.js";
import { startEngraving } from "./engraving.js";
import { Scene, OrthographicCamera, WebGLRenderer, CylinderGeometry, CanvasTexture, Texture, Mesh, MeshBasicMaterial, MeshStandardMaterial, SRGBColorSpace, RepeatWrapping, AmbientLight, DirectionalLight } from "three";

const clamp = n => Math.max(0, Math.min(1, n));
function phase(value, from, to) {
  const t = clamp((value - from) / (to - from));
  return t * t * (3 - 2 * t);
}
const mix = (a,b,t) => a + (b-a)*t;

// The stamp is the same mint artwork as the two-phone transfer farther down the page.
function mint(layer,image,count,onLost,repaint) {
  const canvas=document.createElement("canvas");
  const gl=canvas.getContext("webgl2",{alpha:true,antialias:true,premultipliedAlpha:true});
  if(!gl) return null;
  canvas.className="hf-gl";
  const renderer=new WebGLRenderer({canvas,context:gl,alpha:true,antialias:true});
  renderer.setClearColor(0,0);
  const scene=new Scene(),camera=new OrthographicCamera(0,1,0,-1,.1,2000);
  camera.position.z=900;
  const face=new Texture(image);
  face.colorSpace=SRGBColorSpace; face.center.set(.5,.5);face.rotation=Math.PI/2;face.needsUpdate=true;
  const strip=document.createElement("canvas");strip.width=16;strip.height=4;
  const ctx=strip.getContext("2d");
  for(const [x,w,col] of [[0,16,"#ae834b"],[0,5,"#6b4b2e"],[6,4,"#e3c791"]]) {ctx.fillStyle=col;ctx.fillRect(x,0,w,4)}
  const rimTexture=new CanvasTexture(strip);rimTexture.colorSpace=SRGBColorSpace;rimTexture.wrapS=RepeatWrapping;rimTexture.repeat.x=76;
  const rim=new MeshStandardMaterial({map:rimTexture,roughness:.62,metalness:.2});
  const stamp=new MeshBasicMaterial({map:face,transparent:true,alphaTest:.08});
  const geo=new CylinderGeometry(1,1,.14,72);geo.rotateX(Math.PI/2);
  const meshes=Array.from({length:count},()=>{ const m=new Mesh(geo,[rim,stamp,stamp]);scene.add(m);return m;});
  scene.add(new AmbientLight(0xffecd3,1.6)); const sun=new DirectionalLight(0xffe4b6,2.8);sun.position.set(-4,7,8);scene.add(sun);
  const lamp=lightMint(stamp,layer.closest(".hf-spread"),canvas,camera,repaint);
  canvas.addEventListener("webglcontextlost",onLost);layer.append(canvas);
  return {
    size(w,h){renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.setSize(w,h,false);camera.right=w;camera.bottom=-h;camera.updateProjectionMatrix()},
    draw(coins){lamp.update();meshes.forEach((m,i)=>{const c=coins[i];m.visible=c.size>.25;m.position.set(c.x,-c.y,c.z);m.rotation.set(c.pitch,c.yaw,c.roll);m.scale.setScalar(c.size*.5)});renderer.render(scene,camera)},
    close(){lamp.close();canvas.removeEventListener("webglcontextlost",onLost);geo.dispose();rim.dispose();stamp.dispose();face.dispose();rimTexture.dispose();renderer.dispose();canvas.remove()}
  };
}

export function startHandoff() {
  const story=document.querySelector(".hf-story");
  if(!story)return ()=>{};
  const el=s=>story.querySelector(s),stage=el(".hf-stage"),spread=el(".hf-spread"),page=story.closest(".page");
  const opening=el(".hf-opening"),work=el(".hf-work"),hands=el(".hf-hands"),pouch=el(".hf-pouch"),artist=el(".hf-artist");
  const robot=el(".hf-robot"),human=el(".hf-human"),title=el(".hf-title"),foot=el(".hf-opening-foot"),copy=el(".hf-work-copy");
  const layer=el(".hf-money"),stamp=el(".hf-mint"),tokens=[...story.querySelectorAll(".hf-token")],state=el(".commission-state"),button=el("#commission-advance");
  const picker=el(".hf-hand-picker");
  const radios=[...picker.querySelectorAll("input")];
  const finishes=[...robot.querySelectorAll("img")];
  const finger=el(".hf-finger"),front=finger.querySelector("img"),support=el(".hf-support");
  const cradle=el(".hf-cradle");
  function chooseFinish(id) {
    const selected=radios.find(input=>input.value===id) || radios[0];
    selected.checked=true;
    for (const image of finishes) image.hidden=image.dataset.finish!==selected.value;
    story.dataset.hand=selected.value;
    front.src=finishes.find(image=>image.dataset.finish===selected.value).src;
    robot.style.setProperty("--painted-silhouette",'url("'+front.src+'")');
  }
  function chooseFromRadio(event) {chooseFinish(event.target.value);measure()}
  picker.addEventListener("change",chooseFromRadio);
  chooseFinish(new URLSearchParams(location.search).get("hand") || radios.find(input=>input.checked)?.value);
  const feeText=state.textContent,buttonText=button.textContent;
  let received=false, focusWorkflow=false;
  function requested(event) {
    if(event.detail===0 && event.target.closest('a[href="#solutions"]')){
      focusWorkflow=true;
      if(!story.hasAttribute("data-scrub"))requestAnimationFrame(focusEnd);
    }
  }
  function focusEnd(){if(focusWorkflow){focusWorkflow=false;el("#sv-title").focus({preventScroll:true})}}
  story.addEventListener("click",requested);
  function record(){received=!received;state.textContent=received?"$9,600 received · $14,400 remaining":feeText;button.textContent=received?"Undo advance":buttonText}
  button.addEventListener("click",record);
  layer.style.setProperty("--coin-face",'url("'+stamp.src+'")');
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  let renderer=null,failed=false,w=0,h=0,range=1,top=0,geom,frame=0,last=-1,visible=true;
  const stopLight=startSurfaceLight(page);
  const stopEngraving=startEngraving(page,story);
  const entered=performance.now();
  let introDone=!!location.hash || page.scrollTop>2 || reduced.matches;
  function lost(event){event.preventDefault();failed=true;renderer?.close();renderer=null;last=-1;schedule()}
  function measure(){
    const active=!reduced.matches && page.clientHeight>=450;
    story.toggleAttribute("data-scrub",active);
    const pageBox=page.getBoundingClientRect(),storyBox=story.getBoundingClientRect();
    top=storyBox.top-pageBox.top+page.scrollTop;
    const width=spread.clientWidth;
    const minKnotY=title.offsetTop+title.offsetHeight+Math.min(14,width*.008)+human.offsetHeight*.477;
    hands.style.setProperty("--heading-clearance", width>=700 ? Math.ceil(minKnotY)+"px" : "0px");
    // The source plates have different fingertip heights. Measure the painted point
    // against the pouch base at rest and with the wrist turned to receive it.
    const saved=[pouch.style.translate,pouch.style.scale,pouch.style.rotate,robot.style.translate,robot.style.rotate];
    pouch.style.translate=pouch.style.scale=pouch.style.rotate="none";
    robot.style.translate=robot.style.rotate="none";
    const bag=pouch.getBoundingClientRect(),rest=support.getBoundingClientRect();
    robot.style.rotate="-6deg";
    const turned=cradle.getBoundingClientRect(),base=bag.left+.49*bag.width;
    const approach=Math.min(width*.096,148);
    const rise=Math.min(.105*bag.height,13);
    const restX=base-1.38*bag.width-rest.x,restY=bag.bottom+.14*bag.height-rest.y;
    const receiveX=base-approach-turned.x,receiveY=bag.bottom-rise+.018*bag.height-turned.y;
    [pouch.style.translate,pouch.style.scale,pouch.style.rotate,robot.style.translate,robot.style.rotate]=saved;
    const grip={restX,restY,receiveX,receiveY,approach,rise,bagHeight:bag.height};
    if(!active) {
      introDone=true;story.style.setProperty("--hero-ink","1");story.style.setProperty("--workflow-ink","1");
      story.style.setProperty("--seal-opacity",".28");story.style.setProperty("--seal-rotation","0deg");
      robot.style.setProperty("--contact","0");
      opening.inert=false;work.inert=false;picker.inert=false;picker.style.opacity="";work.style.opacity="";artist.style.opacity="";artist.style.translate="";copy.style.opacity="";
      for(const e of [human,robot,pouch,title,foot,copy]){e.style.translate="";e.style.rotate="";e.style.scale="";e.style.opacity=""}
      robot.style.translate=restX+"px "+restY+"px";finger.style.opacity=0;hands.style.opacity=""; layer.hidden=true;
      el("#solutions").style.top=work.offsetTop+spread.offsetTop+"px";renderer?.close(); renderer=null;
      return;
    }
    layer.hidden=false;el("#solutions").style.top="";
    w=spread.clientWidth;h=spread.clientHeight;range=Math.max(1,story.offsetHeight-stage.offsetHeight);
    geom={...grip,knotX:hands.offsetLeft+pouch.offsetLeft,knotY:pouch.offsetTop, laptopX:artist.offsetLeft+artist.offsetWidth*.57,laptopY:artist.offsetTop+artist.offsetHeight*.33};
    renderer?.size(w,h);
    last=-1;schedule();
  }
  // Each token first peels out from the knot, fans across the page, then banks into the screen.
  function paint(){
    frame=0;
    if(!story.hasAttribute("data-scrub") || !visible || document.hidden || !geom)return;
    const p=clamp((page.scrollTop-top)/range);
    const age=(performance.now()-entered)/1150;
    if(p>.008 || age>=1 || reduced.matches)introDone=true;
    if(Math.abs(last-p)<.000015 && introDone && story.dataset.entered==="true")return;
    last=p;
    const intro=introDone ? 1 : phase(age,0,1);
    story.dataset.entered=String(introDone);
    if(!introDone)schedule();
    const give=phase(p,.008,.285),release=phase(p,.325,.56),withdraw=phase(p,.44,.71),exchange=1-phase(p,.45,.69);
    const entry=1-intro, rightEntry=w*.115*entry,leftEntry=w*.145*entry;
    const carriedX=rightEntry-geom.approach*give,carriedY=-geom.rise*give;
    human.style.translate=(carriedX+w*.17*release)+"px "+(carriedY-h*.14*release+entry*h*.018)+"px";
    const rx=mix(geom.restX,geom.receiveX,give)-leftEntry-w*.125*withdraw;
    const ry=mix(geom.restY,geom.receiveY,give)+entry*h*.03+h*.086*withdraw;
    robot.style.translate=finger.style.translate=rx+"px "+ry+"px";
    robot.style.rotate=finger.style.rotate=(-6*give+3*withdraw+entry*1.2)+"deg";
    // The purse is fully visible on top of the palm. The original pinch stays
    // registered to the drawstring until the giving hand lifts clear.
    finger.style.opacity=0;
    robot.style.setProperty("--contact",String(phase(p,.185,.29)*(1-phase(p,.375,.505))));
    const moveX=carriedX-.016*w*release,moveY=carriedY+.020*h*release+entry*h*.018;
    pouch.style.translate=moveX+"px "+moveY+"px";
    const open=phase(p,.335,.49),vanish=phase(p,.39,.55);
    pouch.style.scale=(1+.12*open-.99*vanish)+" "+(1-.14*open-.85*vanish);
    pouch.style.rotate=(-Math.sin(Math.PI*give)*8+open*7)+"deg";
    pouch.style.opacity=1-vanish;
    const inkIn=introDone?1:phase(age,.03,.91),inkOut=phase(p,.25,.49);
    story.style.setProperty("--hero-ink",String(inkIn*(1-inkOut)));
    story.style.setProperty("--workflow-ink",String(phase(p,.62,.83)));
    story.style.setProperty("--seal-opacity",String((.14+.10*intro+.13*give)*(1-phase(p,.53,.86))));
    story.style.setProperty("--seal-rotation",(entry*-18+give*8+release*6)+"deg");
    hands.style.opacity=exchange;title.style.opacity=1-phase(p,.39,.50);title.style.translate="0 "+(-h*.048*phase(p,.16,.48))+"px";
    const footAlpha=(1-phase(p,.15,.255))*(.65+.35*intro);
    foot.style.opacity=footAlpha;picker.style.opacity=footAlpha;picker.inert=p>.27;
    const reveal=phase(p,.54,.84),words=phase(p,.58,.81);
    work.style.opacity=1;artist.style.opacity=reveal;copy.style.opacity=words;copy.style.translate="0 "+(1-words)*19+"px";
    artist.style.translate=((1-reveal)*w*.05)+"px "+((1-reveal)*h*.042)+"px";
    // A hidden scene cannot receive pointer or keyboard input.
    opening.inert=p>=.30;work.inert=p<.77;
    if(p>.96)focusEnd();
    const coinWindow=p>.32 && p<.935;
    layer.style.visibility=coinWindow?"visible":"hidden";
    if(!coinWindow)return;
    if(!renderer && !failed && stamp.naturalWidth){
      try {renderer=mint(layer,stamp,tokens.length,lost,()=>{if(layer.style.visibility==="visible")refresh()}); if(renderer)renderer.size(w,h);else failed=true} catch {failed=true; renderer?.close(); renderer=null}
    }
    const x0=geom.knotX-geom.approach-.015*w,y0=geom.knotY-geom.rise+.57*geom.bagHeight,size=Math.min(w*(w<701?.087:.075),h*.135);
    const coins=tokens.map((token,i)=>{
      const f=i/(tokens.length-1),side=f-.5;
      const fan=phase(p,.33+.048*f,.58+.037*f),land=phase(p,.58+.046*f,.855+.072*f);
      const crest=Math.sin(Math.PI*fan);
      const x=mix(mix(x0,w*(.50+side*.65),fan),geom.laptopX,land);
      const y=mix(mix(y0,h*(.43+side*side*.63+.055*Math.sin(i*1.7)),fan)-crest*h*.12,geom.laptopY,land)-Math.sin(Math.PI*land)*h*(.08+.1*f);
      const diameter=size*(.70+.25*(i%3)/2)*phase(p,.33+.042*f,.42+.043*f)*(1-phase(land,.48,1));
      const c={x,y,z:2+i*2,size:diameter,pitch:.17*Math.sin(i+p*8),yaw:side+.40+fan*(3.4+i*.55)+land*(2.8+i*.23),roll:side*.60+fan*(side+.2)};
      if(!renderer){token.style.opacity=diameter>.25?1:0;token.style.width=token.style.height=diameter+"px";token.style.transform="translate("+x+"px,"+y+"px) translate(-50%,-50%) rotate("+(-c.roll)+"rad) scaleX("+Math.max(.11,Math.abs(Math.cos(c.yaw)))+")"}
      else token.style.opacity=0;
      return c;
    });
    renderer?.draw(coins);
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(paint)}
  function refresh(){last=-1;schedule()}
  page.addEventListener("scroll",schedule,{passive:true});
  const observer=new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)refresh()},{root:page,rootMargin:"10% 0px"});observer.observe(story);
  const resize=new ResizeObserver(measure);resize.observe(page);resize.observe(spread);
  reduced.addEventListener("change",measure);document.addEventListener("visibilitychange",refresh);
  [artist,pouch,stamp].forEach(img=>img.addEventListener("load",measure));
  measure();document.fonts.ready.then(measure);
  return ()=>{stopLight();stopEngraving();observer.disconnect();resize.disconnect();cancelAnimationFrame(frame);page.removeEventListener("scroll",schedule);reduced.removeEventListener("change",measure);document.removeEventListener("visibilitychange",refresh);[artist,pouch,stamp].forEach(img=>img.removeEventListener("load",measure));button.removeEventListener("click",record);story.removeEventListener("click",requested);picker.removeEventListener("change",chooseFromRadio);renderer?.close()};
}
