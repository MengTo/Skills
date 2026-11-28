// Usage: node prepare.mjs rig.glb register.glb [target-triangles] [--master original.glb]
import {createHash, randomUUID} from 'node:crypto';
import {link, stat, unlink} from 'node:fs/promises';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {NodeIO, Primitive} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {compactPrimitive} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import {inspectCharacter, inspectFile} from './inspect.mjs';

const {positionals,values}=parseArgs({allowPositionals:true,options:{master:{type:'string'},idle:{type:'string'}}});
const [source,destination,count='300000']=positionals;
const target=Number(count);
if(!source||!destination||positionals.length>3||!Number.isSafeInteger(target)||target<1)
 throw Error('Usage: node prepare.mjs rig.glb register.glb [target-triangles] [--master original.glb] [--idle clip-name]');
if(path.resolve(source)===path.resolve(destination))throw Error('Choose a separate runtime file.');
try{await stat(destination);throw Error('The destination exists. Choose a new filename.')}
catch(error){if(error.code!=='ENOENT')throw error}
const master=values.master?await inspectFile(values.master):undefined;
// The standard writer omits near-identity transforms. Retain the exporter's
// exact local transforms so inverse bind matrices still describe the same rest pose.
class RegisterIO extends NodeIO{
 async writeJSON(document,options){
  const output=await super.writeJSON(document,options);
  if(output.json.nodes.length!==this.authoredNodes.length)throw Error('Node count changed.');
  for(const [index,node] of output.json.nodes.entries()){
   const original=this.authoredNodes[index];
   if(node.name!==original.name||JSON.stringify(node.children)!==JSON.stringify(original.children))
    throw Error('Node order changed during export.');
   for(const key of ['matrix','translation','rotation','scale']){
    if(original[key]!==undefined)node[key]=original[key];
    else delete node[key];
   }
  }
  return output;
 }
}
const io=new RegisterIO().registerExtensions(ALL_EXTENSIONS);
const input=await io.readAsJSON(source);
io.authoredNodes=input.json.nodes;
const supported=new Set(ALL_EXTENSIONS.map(extension=>extension.EXTENSION_NAME));
function carriesExtension(value,name){
 if(!value||typeof value!=='object')return false;
 if(Object.hasOwn(value.extensions??{},name))return true;
 return Object.values(value).some(child=>carriesExtension(child,name));
}
input.json.extensionsUsed=(input.json.extensionsUsed??[]).filter(name=>{
 if(supported.has(name))return true;
 if(input.json.extensionsRequired?.includes(name)||carriesExtension(input.json,name))
  throw Error('This converter cannot preserve '+name);
 return false;
});
const doc=await io.readJSON(input), root=doc.getRoot();
if(!root.listSkins().length)throw Error('Use the rigged Tripo export with its skeleton.');
await MeshoptSimplifier.ready;

// Preserve semantic animation channels, inverse binds, hierarchy and texture payloads
// across serialization. A software-generated rest pose cannot pass this comparison.
function rigSignature(root){
 const nodes=root.listNodes(),index=node=>nodes.indexOf(node);
 const hash=array=>createHash('sha256').update(new Uint8Array(array.buffer,array.byteOffset,array.byteLength)).digest('hex');
 return JSON.stringify({
  hierarchy:nodes.map(n=>[n.getName(),n.getTranslation(),n.getRotation(),n.getScale(),n.listChildren().map(index)]),
  skins:root.listSkins().map(s=>[s.listJoints().map(index),s.getInverseBindMatrices()?hash(s.getInverseBindMatrices().getArray()):null]),
  clips:root.listAnimations().map(a=>[a.getName(),a.listChannels().map(c=>{
   const s=c.getSampler();return [index(c.getTargetNode()),c.getTargetPath(),s.getInterpolation(),hash(s.getInput().getArray()),hash(s.getOutput().getArray())];
  })]),
  images:root.listTextures().map(t=>hash(t.getImage()))
 });
}
const signature=rigSignature(root);
const rigReport=inspectCharacter(root);
const idleName=values.idle ?? rigReport.movingSkinClips.find(name=>/(?:^|[^a-z])idle(?:$|[^a-z])/i.test(name));
if(!idleName||!rigReport.movingSkinClips.includes(idleName))
 throw Error('No moving idle found on the weighted skeleton. Export or retarget the preset and pass its exact name with --idle.');
if(!rigReport.weightedTriangles)throw Error('The active scene has no triangles attached to a skin.');
const parts=[];
for(const mesh of root.listMeshes()){
 for(const primitive of mesh.listPrimitives()){
  if(primitive.getMode()!==Primitive.Mode.TRIANGLES)throw Error('Expected triangle meshes from Tripo.');
  const positions=primitive.getAttribute('POSITION');
  const indices=primitive.getIndices()?.getArray()??Uint32Array.from({length:positions.getCount()},(_,i)=>i);
  const triangles=indices.length/3;
  if(!Number.isInteger(triangles)||!triangles)throw Error('Invalid triangle count on '+mesh.getName());
  const joints=primitive.getAttribute('JOINTS_0'),weights=primitive.getAttribute('WEIGHTS_0');
  if(Boolean(joints)!==Boolean(weights))throw Error('Incomplete skin attributes on '+mesh.getName());
  const skins=root.listNodes().filter(n=>n.getMesh()===mesh&&n.getSkin()).map(n=>n.getSkin());
  const faceOrHand=skins.map(s=>s.listJoints().map(j=>/head|jaw|eye|hand|thumb|index|middle|ring|pinky|finger/i.test(j.getName())));
  // Weight the character's face, hair, fingers, and anything attached directly
  // to those bones more heavily when sharing the triangle budget with the coat.
  const detail=new Uint8Array(positions.getCount()),ji=[],wt=[];
  if(joints&&faceOrHand.length){
   for(let i=0;i<detail.length;i++){
    joints.getElement(i,ji);weights.getElement(i,wt);
    detail[i]=Number(faceOrHand.some(mask=>wt.reduce((sum,w,k)=>sum+(mask[ji[k]]?w:0),0)>=.55));
   }
  }else if(/head|eye|hair|hand|finger|glass|visor/i.test(mesh.getName()))detail.fill(1);
  const counts=[0,0],regions=new Uint8Array(triangles),usage=new Uint8Array(detail.length);
  for(let t=0;t<triangles;t++){
   const a=indices[3*t],b=indices[3*t+1],c=indices[3*t+2];
   const region=Number(detail[a]+detail[b]+detail[c]>=2);regions[t]=region;counts[region]++;
   usage[a]|=1<<region;usage[b]|=1<<region;usage[c]|=1<<region;
  }
  parts.push({primitive,indices,regions,counts,triangles,locks:usage.map(bits=>Number(bits===3))});
 }
}
const total=parts.reduce((sum,p)=>sum+p.triangles,0);
const allowance=(n,region,multiplier)=>Math.min(n,Math.max(Math.min(96,n),Math.round(n*multiplier*(region?2.5:1))));
let lo=0,hi=1;
for(let i=0;i<30;i++){
 const mid=(lo+hi)/2;
 const needed=parts.reduce((sum,p)=>sum+p.counts.reduce((n,c,r)=>n+allowance(c,r,mid),0),0);
 if(needed>target)hi=mid;else lo=mid;
}
let result=0,detailBefore=0,detailAfter=0;
for(const {primitive,indices,regions,counts,triangles,locks} of parts){
 const pos=primitive.getAttribute('POSITION'),normal=primitive.getAttribute('NORMAL'),uv=primitive.getAttribute('TEXCOORD_0');
 if(!(pos.getArray() instanceof Float32Array))throw Error('Export full-precision positions before reducing this rig.');
 const n=pos.getCount(),channels=[...(normal?[normal]:[]),...(uv?[uv]:[])];
 const importance=[...(normal?[.2,.2,.2]:[]),...(uv?[.55,.55]:[])];
 if(!importance.length)importance.push(0);
 const stride=importance.length;
 const attrs=new Float32Array(n*stride),v=[];
 let offset=0;
 for(const a of channels){
  for(let i=0;i<n;i++){a.getElement(i,v);for(let k=0;k<a.getElementSize();k++)attrs[i*stride+offset+k]=v[k]}
  offset+=a.getElementSize();
 }
 const split=counts.map(c=>new Uint32Array(3*c)),at=[0,0];
 for(let t=0;t<triangles;t++){const r=regions[t];for(let j=0;j<3;j++)split[r][at[r]++]=indices[3*t+j]}
 const out=split.map((ids,r)=>{
  if(!ids.length||total<=target)return ids;
  const budget=3*allowance(counts[r],r,lo);
  if(budget>=ids.length)return ids;
  return MeshoptSimplifier.simplifyWithAttributes(ids,pos.getArray(),3,attrs,stride,importance,locks,budget,.004,['PreserveFolds'])[0];
 });
 detailBefore+=counts[1];detailAfter+=out[1].length/3;
 const length=out[0].length+out[1].length;result+=length/3;
 if(length===indices.length)continue;
 const merged=new Uint32Array(length);merged.set(out[0]);merged.set(out[1],out[0].length);
 const old=primitive.getIndices();
 primitive.setIndices(doc.createAccessor().setType('SCALAR').setBuffer(pos.getBuffer()).setArray(merged));
 if(old&&old.listParents().length===1)old.dispose();
 compactPrimitive(primitive);
}
const temp=path.join(path.dirname(destination),'.'+randomUUID()+'.glb');
let runtimeReport;
try{
 await io.write(temp,doc);
 const reread=await io.read(temp);
 if(rigSignature(reread.getRoot())!==signature)throw Error('The exported rig, clips or images changed.');
 runtimeReport=inspectCharacter(reread.getRoot());
 if(!runtimeReport.movingSkinClips.includes(idleName))throw Error('Runtime skin lost its moving idle.');
 await link(temp,destination);
}finally{await unlink(temp).catch(error=>{if(error.code!=='ENOENT')throw error})}
console.log(JSON.stringify({source,destination,sourceTriangles:total,targetTriangles:target,outputTriangles:result,
 faceAndHandTriangles:{source:detailBefore,runtime:detailAfter},joints:root.listSkins().map(s=>s.listJoints().length),
 clips:root.listAnimations().map(a=>a.getName()),bytes:(await stat(destination)).size,
 comparison:{master,rig:rigReport,runtime:runtimeReport}},null,2));
