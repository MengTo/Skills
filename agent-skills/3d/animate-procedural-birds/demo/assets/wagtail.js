/* Pass the project's existing THREE namespace. Dimensions are metres, +Z is forward. */
function makeWagtail(T) {
  const bird = new T.Group(), body = new T.Group(), head = new T.Group(), tail = new T.Group();
  const mat = color => new T.MeshStandardMaterial({color, roughness:.78});
  const charcoal = mat(0x242831), ivory = mat(0xe3dfd0), slate = mat(0x626674), horn = mat(0x302d29);
  bird.add(body); body.position.y=.059; body.add(head, tail); head.position.set(0,.036,.038); tail.position.set(0,0,-.043);
  function lobe(parent,material,x,y,z,sx,sy,sz) {
    const part=new T.Mesh(new T.SphereGeometry(1,24,16),material);
    part.scale.set(sx,sy,sz);part.position.set(x,y,z);part.castShadow=true;part.receiveShadow=true;parent.add(part);return part;
  }
  function shaft(parent,a,b,r,material) {
    const delta=new T.Vector3().subVectors(b,a);
    const mesh=new T.Mesh(new T.CylinderGeometry(r*.65,r,delta.length(),8),material);
    mesh.position.copy(a).lerp(b,.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
    mesh.castShadow=true;parent.add(mesh);return mesh;
  }
  const v=(x,y,z)=>new T.Vector3(x,y,z);
  function feather(parent,root,tip,width,material,lift=0) {
    const axis=tip.clone().sub(root),side=v(axis.z,0,-axis.x).normalize();
    const positions=[],indices=[];
    for(let i=0;i<=10;i++){
      const u=i/10,breath=Math.pow(Math.sin(Math.PI*u),.68)*width;
      const centre=root.clone().addScaledVector(axis,u);centre.y+=Math.sin(Math.PI*u)*lift;
      for(const k of [-1,0,1]){
        const p=centre.clone().addScaledVector(side,k*breath*(k<0?.65:1));
        p.y-=Math.abs(k)*breath*.21;positions.push(...p.toArray());
      }
      if(i)for(let j=0;j<2;j++){const a=(i-1)*3+j;indices.push(a,a+3,a+1,a+1,a+3,a+4);}
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
    const mesh=new T.Mesh(geo,material);material.side=T.DoubleSide;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
  }
  lobe(body,ivory,0,0,0,.027,.030,.055);
  lobe(body,slate,0,.012,-.010,.025,.023,.049);
  lobe(head,ivory,0,0,0,.021,.022,.024);
  lobe(head,charcoal,0,.010,-.002,.021,.014,.023);
  lobe(body,charcoal,0,.014,.037,.021,.023,.017);
  const eyes=[];
  for(const side of [-1,1]){
    lobe(head,charcoal,side*.017,.002,.003,.005,.005,.020);
    lobe(head,ivory,side*.018,.007,.008,.0036,.0029,.016);
    eyes.push(lobe(head,horn,side*.020,.004,.010,.0033,.0035,.0035));
  }
  const bill=new T.Mesh(new T.ConeGeometry(.0055,.023,10),horn);
  bill.rotation.x=Math.PI/2;bill.position.set(0,.001,.032);bill.castShadow=true;head.add(bill);
  for(let i=-3;i<=3;i++){
    feather(tail,v(.0015*i,0,0),v(i*.004,-.006,-.080+Math.abs(i)*.005),.0039,Math.abs(i)===3?ivory:charcoal,.002);
  }
  const wings=[],legs=new T.Group();bird.add(legs);
  for(const sign of [-1,1]){
    const wing=new T.Group();wing.position.set(sign*.014,.010,.012);body.add(wing);wings.push(wing);
    for(let i=0;i<9;i++){
      const u=i/8;
      feather(wing,v(sign*.006*u,.006*u,0),v(sign*(.109-.052*u),-.005+.004*u,-.031-.028*u),.0075,charcoal,.006);
    }
    for(let row=0;row<2;row++)for(let i=0;i<7;i++){
      const u=i/6;
      feather(wing,v(sign*.001,.003+row*.0008,.004),v(sign*(.077-.051*u)*(1-row*.24),.008,-.021-.015*u+.003*row),.0068,row?slate:ivory,.006);
    }
    const ankle=v(sign*.014,.005,0);
    shaft(legs,v(sign*.014,.042,.003),v(sign*.014,.021,-.004),.0014,horn);
    shaft(legs,v(sign*.014,.021,-.004),ankle,.0010,horn);
    for(const spread of [-1,0,1])shaft(legs,ankle,v(sign*.014+spread*.005,0,.014-Math.abs(spread)*.004),.00065,horn);
    shaft(legs,ankle,v(sign*.014,0,-.009),.0007,horn);
  }
  function pose(t,flight=0) {
    const wingBeat=Math.sin(t*2*Math.PI*7.4),breathe=Math.sin(t*3.8);
    body.position.y=.059+.00085*breathe;
    head.rotation.y=.20*Math.sin(t*1.4)+.12*Math.sin(t*.74);head.rotation.x=.045*Math.sin(t*2.1);
    tail.rotation.x=.07+.10*Math.sin(2.65*t);
    for(let i=0;i<wings.length;i++){
      const sign=i?1:-1,wing=wings[i];
      wing.rotation.order='YXZ';wing.rotation.y=sign*(1.20-.99*flight);
      wing.rotation.z=sign*(-.42*(1-flight)+flight*(.14+.77*wingBeat));
    }
    legs.scale.y=1-.67*flight;legs.position.y=.045*flight;
  }
  pose(0);return {bird,eyes,pose};
}
if(typeof module!=='undefined')module.exports={makeWagtail};
