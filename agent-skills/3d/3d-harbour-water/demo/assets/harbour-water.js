// Side-effect import or classic script. Supply the host's Three.js and Reflector.
globalThis.HarbourWater = (() => {
  const waves = [[.67,.44,-1.47,.054],[-.35,1.11,1.82,.037],[.75,-1.46,-2.10,.022]];
  const waveTerms = waves.map(([x,z,speed,amplitude]) =>
    'vec3(' + [x,z,speed].map(n=>n.toFixed(3)).join(',') + '), ' + amplitude.toFixed(3));
  const swell = `
    void wave(inout vec3 h, vec3 p, vec3 k, float a) {
      float phase = dot(k,p);
      h += a * vec3(sin(phase), k.xy * cos(phase));
    }
    vec3 swell(vec2 p) {
      vec3 h = vec3(0.);
      ${waveTerms.map(term=>'wave(h, vec3(p, uTime), '+term+');').join('\n')}
      return (.42 + .65 * wind) * h;
    }`;
  const vertexShader = `
    uniform mat4 textureMatrix;
    uniform float uTime, wind;
    varying vec3 world;
    varying vec4 mirrorUV;
    ${swell}
    void main() {
      mirrorUV = textureMatrix * vec4(position,1.);
      world = (modelMatrix * vec4(position,1.)).xyz;
      world.y += swell(world.xz).x;
      gl_Position = projectionMatrix * viewMatrix * vec4(world,1.);
    }`;

  const historySize = 28;
  const maxLights = 8;
  const fragmentShader = `
    uniform float uTime, wind, rain;
    uniform sampler2D tDiffuse, depths, spectrum;
    uniform mat4 reflectedVP, inverseVP;
    uniform int lampCount, wakeCount;
    uniform vec4 lamps[${maxLights}], trail[${historySize}], wakeBounds;
    uniform vec3 lampPower[${maxLights}], body, sky;
    varying vec3 world;
    varying vec4 mirrorUV;
    ${swell}
    float hash(vec2 v) { return fract(sin(dot(v,vec2(127.1,311.7))) * 43758.5); }
    vec2 drops(vec2 p) {
      vec2 cell=floor(p);
      float seed=hash(cell), cycle=uTime*1.35+seed;
      float age=fract(cycle), sequence=floor(cycle);
      vec2 centre=.36+.28*vec2(hash(cell+sequence),hash(cell-sequence-33.));
      vec2 delta=fract(p)-centre;
      float d=length(delta), offset=d-.31*age;
      return delta/max(d,.001)*cos(114.*offset)*exp(-abs(offset)*51.)
        *sin(3.14159*age)*smoothstep(.04,.35,seed);
    }
    // x,y hold wave slopes. z adds the narrow line of foam on each shoulder.
    vec3 wakeShape(vec2 p) {
      if(wakeCount<2 || any(lessThan(p,wakeBounds.xy)) || any(greaterThan(p,wakeBounds.zw))) return vec3(0.);
      float nearest=1e5, age=0., speed=0.;
      vec2 side=vec2(0.);
      for(int i=1;i<${historySize};i++) {
        if(i>=wakeCount) break;
        vec4 a=trail[i-1], b=trail[i];
        vec2 ab=b.xy-a.xy;
        float h=clamp(dot(p-a.xy,ab)/max(dot(ab,ab),.000001),0.,1.);
        vec2 delta=p-(a.xy+ab*h);
        float d2=dot(delta,delta);
        if(d2<nearest) {
          nearest=d2; side=delta; age=uTime-mix(a.z,b.z,h); speed=mix(a.w,b.w,h);
        }
      }
      float d=sqrt(nearest), offset=d-(.16+age*.47);
      float energy=smoothstep(0.,.22,age)*(1.-smoothstep(1.1,6.,age))*smoothstep(.08,1.2,speed);
      float crest=exp(-abs(offset)*4.4)*energy;
      return vec3(side/max(d,.001)*crest*cos(offset*13.)*.17, crest*exp(-abs(offset)*5.));
    }
    void main() {
      vec2 p=world.xz;
      float fp=max(length(dFdx(p)),length(dFdy(p)));
      mat2 turn=mat2(.80,.60,-.60,.80);
      vec3 a=texture2D(spectrum,p/10.4+uTime*vec2(-.025,-.039)).rgb-.5;
      vec3 b=texture2D(spectrum,turn*p/4.7+uTime*vec2(.038,.017)+.39).rgb-.5;
      vec3 c=texture2D(spectrum,p/1.75+uTime*vec2(-.037,.068)+.12).rgb-.5;
      vec2 fine=texture2D(spectrum,turn*p/vec2(.87,2.4)-uTime*vec2(.073,.011)).rg-.5;
      float nearWeight=1.-smoothstep(.035,.19,fp);
      vec2 slope=swell(p).yz+(.36+.33*wind)*(a.xy*.47+transpose(turn)*b.xy*.30+c.xy*.22+
        transpose(turn)*fine*.16*nearWeight);
      if(rain>0. && fp<.20) slope+=rain*.073*drops(p*1.42)*(1.-smoothstep(.045,.20,fp));
      vec3 wake=wakeShape(p);
      slope+=wake.xy;
      vec3 N=normalize(vec3(-slope.x,1.,-slope.y)), V=normalize(cameraPosition-world);
      float facing=clamp(dot(N,V),.01,1.), fresnel=.021+.979*pow(1.-facing,5.);
      vec3 ray=reflect(-V,N), ideal=reflect(-V,vec3(0.,1.,0.));
      vec2 uv=mirrorUV.xy/mirrorUV.w;
      float z=texture2D(depths,uv).r;
      vec4 hit=inverseVP*vec4(uv*2.-1.,z*2.-1.,1.);
      float path=z>.9999 || abs(hit.w)<.00001 ? 55. : clamp(distance(hit.xyz/hit.w,world),.02,75.);
      vec4 proj=reflectedVP*vec4(world+path*normalize(mix(ideal,ray,.52)),1.);
      vec2 shift=proj.xy/max(.02,proj.w)*.5+.5-uv;
      vec2 coord=uv+shift/(1.+13.*length(shift));
      vec2 edge=min(coord,1.-coord);
      float valid=smoothstep(0.,.024,min(edge.x,edge.y))*step(.001,proj.w);
      vec2 texel=.65/vec2(textureSize(tDiffuse,0));
      vec3 reflection=texture2D(tDiffuse,coord).rgb*.56+
        .22*(texture2D(tDiffuse,coord+texel).rgb+texture2D(tDiffuse,coord-texel).rgb);
      vec2 along=normalize(V.xz+vec2(.00001)), across=vec2(-along.y,along.x);
      float rolled=dot(slope,along), broken=smoothstep(-.16,.18,b.z*.79+c.z*.49);
      float silver=smoothstep(.018,.19,rolled+.22*c.z)*(.15+.85*broken);
      vec3 result=mix(body*(.89+.32*a.z),mix(sky,reflection,valid),.13+.84*fresnel);
      result+=sky*silver*(.24+.65*nearWeight)*exp(-abs(ray.y-.22)*3.);
      vec2 width=vec2(.022+.009*rain,.145+.048*wind);
      vec2 filterWidth=min(.038*fwidth(slope)*8.,vec2(.032));
      for(int i=0;i<${maxLights};i++) {
        if(i>=lampCount) break;
        vec3 L=lamps[i].xyz-world;
        float d2=max(dot(L,L),.02); L*=inversesqrt(d2);
        vec3 H=normalize(V+L);
        vec2 error=H.xz/max(H.y,.08)+slope;
        float angular=clamp(lamps[i].w*inversesqrt(d2),.001,.07);
        vec2 spread=sqrt(width*width+filterWidth*filterWidth+angular*angular*vec2(1.,.4));
        vec2 k=vec2(dot(error,across),dot(error,along))/spread;
        float lobe=exp(-dot(k,k))/(3.14159*spread.x*spread.y);
        float nl=max(dot(N,L),0.), fl=.035+.91*pow(1.-max(dot(L,H),0.),5.);
        result+=lampPower[i]*lobe*fl*nl*(.32+1.12*broken)/((3.+d2)*(.08+facing*nl));
      }
      result+=vec3(.26,.38,.41)*wake.z*(.22+.78*broken);
      gl_FragColor=vec4(result,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;

  // Integer frequencies make the signed slopes periodic in both directions, including at mip seams.
  function makeSpectrum(T) {
    const size=128, data=new Uint8Array(size*size*4);
    const modes=[[1,2,.83],[2,-1,.71],[3,2,.44],[2,5,.39],[-4,3,.33],[5,7,.22],
      [8,3,.23],[-6,7,.19],[11,-3,.16],[-5,12,.12],[10,9,.12],[17,5,.08],[19,-7,.06]];
    for(let j=0;j<size;j++) for(let i=0;i<size;i++) {
      let sx=0,sz=0,height=0;
      modes.forEach(([x,z,weight],n)=>{
        const phase=2*Math.PI*(x*i+z*j)/size+n*n*1.735;
        const slope=weight*Math.cos(phase)/Math.hypot(x,z);
        sx+=slope*x; sz+=slope*z; height+=weight*Math.sin(phase);
      });
      const offset=(j*size+i)*4;
      [sx,sz,height].forEach((v,k)=>{data[offset+k]=Math.round(127.5+124*Math.tanh(v*.82));});
      data[offset+3]=255;
    }
    const map=new T.DataTexture(data,size,size);
    map.wrapS=map.wrapT=T.RepeatWrapping;
    map.minFilter=T.LinearMipmapLinearFilter; map.magFilter=T.LinearFilter;
    map.generateMipmaps=true; map.needsUpdate=true;
    return map;
  }

  function create(T, Reflector, {size=100,segments=128,mirrorWidth=768,mirrorHeight=432,
    level=0,body=0x17323e,sky=0x668291}={}) {
    const uniform=value=>({value});
    const uniforms={};
    for(const key of ['color','tDiffuse','textureMatrix','spectrum','depths']) uniforms[key]=uniform(null);
    for(const key of ['uTime','wind','rain','lampCount','wakeCount']) uniforms[key]=uniform(0);
    for(const key of ['reflectedVP','inverseVP']) uniforms[key]=uniform(new T.Matrix4());
    uniforms.body=uniform(new T.Color(body)); uniforms.sky=uniform(new T.Color(sky));
    uniforms.lamps=uniform(Array.from({length:maxLights},()=>new T.Vector4()));
    uniforms.lampPower=uniform(Array.from({length:maxLights},()=>new T.Vector3()));
    uniforms.trail=uniform(Array.from({length:historySize},()=>new T.Vector4()));
    uniforms.wakeBounds=uniform(new T.Vector4());
    const geometry=new T.PlaneGeometry(size,size,segments,segments);
    const mesh=new Reflector(geometry,{textureWidth:mirrorWidth,textureHeight:mirrorHeight,
      multisample:0,clipBias:.001,shader:{name:'HarbourWater',uniforms,vertexShader,fragmentShader}});
    mesh.rotation.x=-Math.PI/2; mesh.position.y=level;
    const u=mesh.material.uniforms, target=mesh.getRenderTarget();
    target.depthTexture=new T.DepthTexture(mirrorWidth,mirrorHeight);
    u.depths.value=target.depthTexture; u.spectrum.value=makeSpectrum(T);
    const reflect=mesh.onBeforeRender;
    mesh.onBeforeRender=function(renderer,scene,camera) {
      reflect.call(mesh,renderer,scene,camera);
      u.reflectedVP.value.multiplyMatrices(mesh.camera.projectionMatrix,mesh.camera.matrixWorldInverse);
      u.inverseVP.value.copy(u.reflectedVP.value).invert();
    };
    function heightAt(x,z) {
      let h=0;
      for(const [kx,kz,rate,amp] of waves) h+=amp*Math.sin(kx*x+kz*z+rate*u.uTime.value);
      return mesh.position.y+h*(.42+.65*u.wind.value);
    }
    function setWeather(wind,rain) {
      u.wind.value=Math.max(0,Math.min(2,wind)); u.rain.value=Math.max(0,Math.min(1.5,rain));
    }
    function setLights(list) {
      if(list.length>maxLights) throw new RangeError('HarbourWater supports up to eight local emitters');
      list.forEach(({position,color,power,radius=.16},i)=>{
        u.lamps.value[i].set(position.x,position.y,position.z,radius);
        const rgb=new T.Color(color);
        u.lampPower.value[i].set(rgb.r,rgb.g,rgb.b).multiplyScalar(power);
      });
      u.lampCount.value=list.length;
    }
    function clearWake() { u.wakeCount.value=0; }
    // Track the stern at simulation time, in world metres. Keep samples long enough for turns.
    function trackStern(x,z) {
      const t=u.uTime.value, points=u.trail.value, first=points[0];
      let n=u.wakeCount.value, dt=t-first.z;
      if(n && (dt<0 || dt>1 || Math.hypot(x-first.x,z-first.y)>5)) n=0;
      if(n && dt<.22) return;
      const speed=n?Math.hypot(x-first.x,z-first.y)/dt:0;
      for(let i=Math.min(n,historySize-1);i>0;i--) points[i].copy(points[i-1]);
      points[0].set(x,z,t,speed);
      u.wakeCount.value=n=Math.min(n+1,historySize);
      let minX=x,maxX=x,minZ=z,maxZ=z;
      for(let i=1;i<n;i++) {
        minX=Math.min(minX,points[i].x); maxX=Math.max(maxX,points[i].x);
        minZ=Math.min(minZ,points[i].y); maxZ=Math.max(maxZ,points[i].y);
      }
      u.wakeBounds.value.set(minX-4,minZ-4,maxX+4,maxZ+4);
    }
    function setTime(time) { if(time<u.uTime.value) clearWake(); u.uTime.value=time; }
    function dispose() { mesh.removeFromParent(); geometry.dispose(); u.spectrum.value.dispose(); mesh.dispose(); }
    return {mesh,heightAt,setTime,setWeather,setLights,trackStern,clearWake,dispose};
  }
  return {create};
})();
