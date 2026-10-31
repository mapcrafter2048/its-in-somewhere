import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {part as roundedPart,material,CABINET_BOX} from '../prop-models';
// Rounded housing where its silhouette matters; flat trim shares the twelve-triangle box.
const part=(root:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,color:number)=>roundedPart(root,x,y,z,w,h,d,color,0,Math.min(w,h,d)<=.055?CABINET_BOX:undefined);
import {toWorld,NOOK,DESKTOP_Y} from '../hub-layout';
import {officeDate} from '../shift-clock';
import type {Save} from '../types';
import {DRINKS} from './stationery';
const SPOOL=new THREE.CylinderGeometry(.044,.044,.095,16);
const CAN=new THREE.CylinderGeometry(.034,.034,.12,16),TOP=new THREE.CylinderGeometry(.033,.033,.004,16),LABEL=new THREE.PlaneGeometry(.055,.083);
const colors={cola:0x925849,orange:0xc18d48,water:0x658e98};
const labels=new Map<string,THREE.MeshStandardMaterial>();
function labelMaterial(text:string,bg:string,width=256,height=256){const c=document.createElement('canvas');c.width=width;c.height=height;const x=c.getContext('2d')!;x.fillStyle=bg;x.fillRect(0,0,width,height);x.fillStyle='#f1e5c6';x.textAlign='center';x.textBaseline='middle';const words=text.split('|');words.forEach((t,i)=>{let size=Math.min(width/9,height/(words.length+1)*.7);x.font=`bold ${size}px Georgia`;if(x.measureText(t).width>width*.9){size*=width*.9/x.measureText(t).width;x.font=`bold ${size}px Georgia`;}x.fillText(t,width/2,height*(i+1)/(words.length+1));});const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshStandardMaterial({map,roughness:.85,emissive:0xffffff,emissiveMap:map,emissiveIntensity:.18});}
export function makeCan(drink:keyof typeof DRINKS,empty=false){const g=new THREE.Group();g.name=empty?'empty-drinks-can':'drinks-can';const body=new THREE.Mesh(CAN,material(colors[drink]));body.position.y=.06;g.add(body);for(const y of [.002,.121]){const top=new THREE.Mesh(TOP,material(0xbfc7b9));top.position.y=y;g.add(top);}if(!labels.has(drink))labels.set(drink,labelMaterial(drink==='cola'?'R&R|COLA':drink==='orange'?'ORANGE|OVERTIME':'STILL|EMPLOYED',`#${colors[drink].toString(16)}`));const label=new THREE.Mesh(LABEL,labels.get(drink));label.position.set(0,.066,.0345);g.add(label);const tab=new THREE.Mesh(TOP,material(empty?0x46534b:0xcbd0c1));tab.scale.set(.22,.6,.42);tab.position.set(0,.124,.004);g.add(tab);return g;}
export function makeStationeryHeld(kind:'pad'|'thread'|'marker'|'sticky',color=0xeee4a2){const g=new THREE.Group();if(kind==='pad'||kind==='sticky'){part(g,0,.055,0,.19,kind==='pad'?.025:.003,.19,color);part(g,0,.073,-.075,.19,.004,.035,0xc7be81);}else if(kind==='thread'){const body=new THREE.Mesh(SPOOL,material(0xa75b48));body.position.y=.06;g.add(body);for(const y of [.008,.112]){const rim=new THREE.Mesh(TOP,material(0xcbb991));rim.scale.set(1.6,1,1.6);rim.position.y=y;g.add(rim);}}else {part(g,0,.07,0,.018,.14,.018,0xd0d2bc);part(g,0,.145,0,.021,.04,.021,0x4f6770);}return g;}
const heldWritingCanvas=document.createElement('canvas');heldWritingCanvas.width=320;heldWritingCanvas.height=320;
const heldWritingMap=new THREE.CanvasTexture(heldWritingCanvas);heldWritingMap.colorSpace=THREE.SRGBColorSpace;
const heldWritingMaterial=new THREE.MeshStandardMaterial({map:heldWritingMap,roughness:1});
const heldWritingPlane=new THREE.PlaneGeometry(.17,.145);let heldWritingKey='';
export function makeStickyHeld(text:string,color:number){const key=`${text}:${color}`;if(heldWritingKey!==key){heldWritingKey=key;const ctx=heldWritingCanvas.getContext('2d')!;ctx.fillStyle=`#${color.toString(16).padStart(6,'0')}`;ctx.fillRect(0,0,320,320);ctx.fillStyle='#344638';ctx.font='20px Georgia';ctx.textBaseline='top';let line=0;for(const paragraph of text.split('\n')){const lines=paragraph.match(/.{1,25}(?:\s|$)|.{1,25}/gu)??[''];for(const part of lines){if(line>=12)break;ctx.fillText(part.trim(),15,12+line++*24,290);}}heldWritingMap.needsUpdate=true;}
 const root=makeStationeryHeld('sticky',color),writing=new THREE.Mesh(heldWritingPlane,heldWritingMaterial);writing.rotation.x=-Math.PI/2;writing.position.set(0,.058,.012);root.add(writing);return root;
}
function batchSolids(root:THREE.Group){const groups=new Map<THREE.Material,THREE.Mesh[]>();root.traverse(o=>{if(o instanceof THREE.Mesh&&!o.userData.dynamic&&(o.material as THREE.Material).visible&&!(o.material as THREE.MeshStandardMaterial).map){const m=o.material as THREE.Material;groups.set(m,[...(groups.get(m)??[]),o]);}});root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),pieces:THREE.BufferGeometry[]=[];for(const [mat,meshes]of groups){const color=(mat as THREE.MeshStandardMaterial).color??new THREE.Color(0xffffff);for(const mesh of meshes){let geom=mesh.geometry.clone().applyMatrix4(inverse.clone().multiply(mesh.matrixWorld));if(geom.index)geom=geom.toNonIndexed();const n=geom.getAttribute('position').count;const a=new Float32Array(n*3);for(let i=0;i<n;i++)color.toArray(a,i*3);if(!geom.hasAttribute('color'))geom.setAttribute('color',new THREE.BufferAttribute(a,3));geom.deleteAttribute('uv');pieces.push(geom);mesh.removeFromParent();}}if(pieces.length){const geometry=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());if(geometry)root.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85})));}}
function batchFixtureLabels(root:THREE.Group){
 const meshes:THREE.Mesh[]=[];root.traverse(o=>{if(o instanceof THREE.Mesh&&(o.material as THREE.MeshStandardMaterial).map)meshes.push(o);});
 const atlas=document.createElement('canvas');atlas.width=2048;atlas.height=1024;const context=atlas.getContext('2d')!;
 const maps=[...new Set(meshes.map(m=>(m.material as THREE.MeshStandardMaterial).map!))];
 maps.forEach((map,i)=>context.drawImage(map.image as CanvasImageSource,(i%4)*512,Math.floor(i/4)*512,512,512));
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert();
 const pieces=meshes.map(mesh=>{let g=mesh.geometry.clone().applyMatrix4(inverse.clone().multiply(mesh.matrixWorld));if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}const cell=maps.indexOf((mesh.material as THREE.MeshStandardMaterial).map!),uv=g.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setXY(i,(cell%4+uv.getX(i))/4,(1-Math.floor(cell/4)+uv.getY(i))/2);mesh.removeFromParent();return g;});
 const geometry=mergeGeometries(pieces)!;pieces.forEach(g=>g.dispose());const map=new THREE.CanvasTexture(atlas);map.colorSpace=THREE.SRGBColorSpace;
 const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({map,emissive:0xffffff,emissiveMap:map,emissiveIntensity:.18,roughness:.85}));mesh.name='vending-label-atlas';root.add(mesh);
}
export class OfficeLifeWorld{
 readonly root=new THREE.Group();readonly hits:THREE.Mesh[]=[];
 private calendarCanvas=document.createElement('canvas');private calendarMap:THREE.CanvasTexture;private day='';private activeWing=-1;private groups:THREE.Group[]=[];
 private toolModels=new Map<import('./types').ToolId,THREE.Group>();
 private output=new THREE.Group();private canKey='';private vendingRoot=new THREE.Group();
 constructor(){this.root.name='office-life-fixtures';for(let wing=0;wing<4;wing++){const group=new THREE.Group(),o=toWorld(wing,0,0);group.position.set(o.x,0,o.z);this.groups.push(group);this.root.add(group);}
 const w4=this.groups[3],box=new THREE.Group();box.position.set(NOOK.x+3.48,DESKTOP_Y,NOOK.z+.3);box.name='stationery-box';box.scale.setScalar(.7);w4.add(box);
 part(box,0,.025,0,.68,.05,.34,0x756547);for(const x of [-.34,-.11,.12,.34])part(box,x,.08,0,.018,.12,.34,0x8b7956);for(const z of [-.17,.17])part(box,0,.08,z,.7,.12,.018,0x8b7956);batchSolids(box);for(const [i,t]of (['pad','thread','marker'] as const).entries()){const models=new THREE.Group();models.name=`stationery-stock-${t}`;const count=t==='pad'?1:t==='thread'?3:5;for(let j=0;j<count;j++){const model=makeStationeryHeld(t);model.scale.setScalar(t==='thread'?.58:.8);model.position.set(t==='marker'?(j%3-1)*.048:t==='thread'?(j%2-.5)*.085:0,t==='marker'?.005:0,t==='marker'?(Math.floor(j/3)-.5)*.11:t==='thread'?(Math.floor(j/2)-.5)*.12:0);if(t==='marker')model.rotation.z=(j-2)*.1;models.add(model);}batchSolids(models);models.position.set(-.23+i*.23,.02,0);box.add(models);this.toolModels.set(t,models);}
 this.hit(w4,3,'stationery',NOOK.x+3.48,DESKTOP_Y+.08,NOOK.z+.3,.53,.22,.29);
 const cal=new THREE.Group();cal.name='office-desk-calendar';cal.position.set(NOOK.x+3.46,DESKTOP_Y,NOOK.z-.02);w4.add(cal);part(cal,0,.01,0,.32,.02,.23,0x495b4d);part(cal,0,.13,.025,.29,.24,.025,0xc5b690);part(cal,0,.23,.022,.3,.025,.04,0x5c6655);for(const x of [-.09,.09])part(cal,x,.25,.04,.018,.025,.035,0x718071);this.calendarCanvas.width=384;this.calendarCanvas.height=320;this.calendarMap=new THREE.CanvasTexture(this.calendarCanvas);this.calendarMap.colorSpace=THREE.SRGBColorSpace;const face=new THREE.Mesh(new THREE.PlaneGeometry(.27,.21),new THREE.MeshStandardMaterial({map:this.calendarMap,roughness:1}));face.position.set(0,.128,.041);cal.add(face);batchSolids(cal);
 const w2=this.groups[1],machine=this.vendingRoot;machine.name='staff-vending-machine';machine.position.set(0,0,-49.2);w2.add(machine);
 // A hollow cabinet: the collection bay contains real free space instead of a solid front slab.
 part(machine,0,1,-.31,1.14,2,.08,0xc6c6ac);
 for(const x of [-.53,.53])part(machine,x,1,.015,.08,2,.73,0xc6c6ac);
 part(machine,0,1.96,.015,1.06,.08,.73,0xc6c6ac);part(machine,0,.045,.015,1.06,.09,.73,0xc6c6ac);
 part(machine,0,1.25,.366,1.02,1.39,.055,0x486451);part(machine,0,.125,.366,1.02,.16,.055,0x486451);
 part(machine,0,1.4,.401,.86,.84,.026,0x233a32);
 for(const x of [-.455,.455])part(machine,x,1.4,.458,.035,.9,.11,0x798d73);
 for(const y of [.95,1.85])part(machine,0,y,.458,.94,.035,.11,0x798d73);
 part(machine,0,.39,.22,.81,.36,.025,0x1c2e28);
 part(machine,0,.215,.41,.84,.025,.37,0x9ea78d);
 for(const x of [-.415,.415])part(machine,x,.385,.41,.025,.36,.37,0x526556);
 part(machine,0,.577,.402,.79,.035,.045,0x303d34);
 part(machine,0,.562,.435,.73,.008,.05,0xa5ad96);
 for(const x of [-.49,.49])for(const y of [.14,1.91])part(machine,x,y,.407,.014,.014,.008,0x82917b);
 for(let row=0;row<3;row++){part(machine,0,1.08+row*.25,.443,.85,.015,.1,0x84907a);for(const [col,drink]of (Object.keys(DRINKS) as (keyof typeof DRINKS)[]).entries()){const can=makeCan(drink);can.position.set((col-1)*.265,1.1+row*.25,.405);can.scale.setScalar(1.4);machine.add(can);}}
 for(let i=0;i<3;i++){part(machine,(i-1)*.27,.79,.421,.22,.1,.045,0xd9d5b5);part(machine,(i-1)*.27,.79,.449,.13,.06,.015,colors[(['cola','orange','water'] as const)[i]]);}for(const [i,name]of ['COLA','ORANGE','SPARKLING'].entries()){const label=new THREE.Mesh(new THREE.PlaneGeometry(.23,.042),labelMaterial(`${i+1} · ${name}`,'#486451',512,96));label.position.set((i-1)*.27,.695,.406);machine.add(label);}for(const y of [1.2,1.6])part(machine,.552,y,.16,.025,.13,.09,0x8b947d);for(let i=0;i<7;i++)part(machine,-.39+i*.13,.08,.36,.07,.012,.01,0x536252);
 part(machine,.39,1.79,.427,.035,.035,.02,0x8ca079);
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(.93,.13),labelMaterial('COMPLIMENTARY|ACCOUNTS WOULD LIKE THIS ACKNOWLEDGED.','#526b56',768,160));sign.position.set(0,1.93,.398);machine.add(sign);batchSolids(machine);
 // Textured can labels share one merged mesh per drink instead of nine separate calls.
 for(const mat of labels.values()){const meshes:THREE.Mesh[]=[];machine.traverse(o=>{if(o instanceof THREE.Mesh&&o.material===mat)meshes.push(o);});machine.updateMatrixWorld(true);const inv=machine.matrixWorld.clone().invert();const geoms=meshes.map(m=>m.geometry.clone().applyMatrix4(inv.clone().multiply(m.matrixWorld)));const geo=mergeGeometries(geoms);geoms.forEach(g=>g.dispose());meshes.forEach(m=>m.removeFromParent());if(geo)machine.add(new THREE.Mesh(geo,mat));}
 this.output.name='vending-output';this.output.position.set(0,.23,.47);machine.add(this.output);this.hit(w2,1,'vending',0,1,-48.75,1.17,2,.35);
 const bin=new THREE.Group();bin.name='can-recycling-bin';bin.position.set(1.02,0,-49.15);w2.add(bin);part(bin,0,.27,0,.38,.54,.38,0x536c5c);part(bin,0,.55,0,.41,.035,.41,0xb2b697);part(bin,0,.574,.02,.22,.008,.12,0x253e34);batchSolids(bin);const badge=new THREE.Mesh(new THREE.PlaneGeometry(.29,.16),labelMaterial('CANS ONLY|RECYCLE','#536c5c',384,200));badge.position.set(0,.35,.193);bin.add(badge);this.hit(w2,1,'recycling',1.02,.35,-48.93,.44,.7,.3);
 batchSolids(w2);batchFixtureLabels(w2);
 }
 private hit(parent:THREE.Group,wing:number,feature:string,x:number,y:number,z:number,w:number,h:number,d:number){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({visible:false}));m.position.set(x,y,z);m.userData.lifeFeature=feature;m.userData.wing=wing;parent.add(m);this.hits.push(m);}
 setWing(wing:number){if(this.activeWing===wing)return;this.activeWing=wing;this.groups.forEach((g,i)=>g.visible=i===wing);}
 blocked(wing:number,x:number,z:number){return wing===1&&((Math.abs(x)<.82&&Math.abs(z+49.2)<.6)||(Math.abs(x-1.02)<.43&&Math.abs(z+49.15)<.43));}
 sync(s:Save){this.setWing(s.wing);for(const [id,model]of this.toolModels)model.visible=s.deskLife!.tools[id]==='box';const v=s.deskLife!.vending;const key=`${v.place}:${v.drink}:${v.empty}`;if(this.canKey!==key){this.canKey=key;this.output.clear();if(v.drink&&['tray','dispensing'].includes(v.place)){const can=makeCan(v.drink);can.scale.setScalar(1.5);this.output.add(can);}}this.output.visible=['tray','dispensing'].includes(v.place);this.output.position.y=.23;this.animateDispense(s);this.setTime(s.playSeconds);}
 animateDispense(s:Save){const v=s.deskLife!.vending;if(v.place!=='dispensing')return;const remaining=Math.max(0,v.due-s.playSeconds);this.output.visible=s.settings.reducedMotion||remaining<=.4;this.output.position.y=s.settings.reducedMotion?.23:.23+Math.min(.12,remaining*.3); }
 setTime(seconds:number){const date=officeDate(seconds),key=date.toISOString().slice(0,10);if(this.day===key)return;this.day=key;const c=this.calendarCanvas.getContext('2d')!;c.fillStyle='#f2e8cd';c.fillRect(0,0,384,320);c.fillStyle='#49634f';c.textAlign='center';c.font='27px Georgia';c.fillText(date.toLocaleDateString('en-GB',{weekday:'long',timeZone:'UTC'}).toUpperCase(),192,55);c.font='bold 115px Georgia';c.fillText(String(date.getUTCDate()),192,184);c.font='29px Georgia';c.fillText(date.toLocaleDateString('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).toUpperCase(),192,246);c.font='13px monospace';c.fillText('ONE DAY AT A TIME. MANAGEMENT INSISTS.',192,291);this.calendarMap.needsUpdate=true;}
}
