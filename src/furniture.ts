import * as THREE from 'three';
export type Shape='box'|'cylinder'|'pot'|'leaf'|'sphere'|'handle';
export interface Part {x:number;y:number;z:number;w:number;h:number;d:number;color:number;rx?:number;ry?:number;rz?:number;shape?:Shape}
export type AddPart=(p:Part)=>void;
function leafGeometry(){
 const p:number[]=[],indices:number[]=[];
 for(let i=0;i<=10;i++){const t=i/10,width=Math.sin(Math.PI*t)*.5;for(const side of [-1,0,1])p.push(side*width,t,Math.sin(t*Math.PI)*.12-Math.pow(t,3)*.3+(side===0?.035:0));}
 for(let i=0;i<10;i++)for(let j=0;j<2;j++){const a=i*3+j;indices.push(a,a+1,a+3,a+1,a+4,a+3);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function batchFurniture(root:THREE.Group,box:THREE.BufferGeometry,parts:Part[]){
 const groups=new Map<Shape,Part[]>();for(const p of parts){const key=p.shape??'box';if(!groups.has(key))groups.set(key,[]);groups.get(key)!.push(p);}
 const material=new THREE.MeshLambertMaterial({color:0xffffff}),o=new THREE.Object3D();
 for(const [shape,items]of groups){const g=shape==='box'?box:shape==='cylinder'?new THREE.CylinderGeometry(1,1,1,12):shape==='pot'?new THREE.CylinderGeometry(1,.7,1,16):shape==='leaf'?leafGeometry():shape==='handle'?new THREE.TorusGeometry(1,.18,6,16,Math.PI*1.65):new THREE.SphereGeometry(1,12,8);
  const mesh=new THREE.InstancedMesh(g,shape==='leaf'?new THREE.MeshLambertMaterial({color:0xffffff,side:THREE.DoubleSide}):material,items.length);mesh.name='furniture-'+shape;
  items.forEach((p,i)=>{o.position.set(p.x,p.y,p.z);o.rotation.set(p.rx??0,p.ry??0,p.rz??0);o.scale.set(p.w,p.h,p.d);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);mesh.setColorAt(i,new THREE.Color(p.color));});mesh.computeBoundingSphere();root.add(mesh);
 }
}
export function rod(add:AddPart,a:THREE.Vector3,b:THREE.Vector3,r:number,color:number){const d=b.clone().sub(a),e=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize())),mid=a.clone().add(b).multiplyScalar(.5);add({x:mid.x,y:mid.y,z:mid.z,w:r,h:d.length(),d:r,color,shape:'cylinder',rx:e.x,ry:e.y,rz:e.z});}
export function buildPlant(add:AddPart,x:number,z:number,scale:number){
 const put=(p:Part)=>add({...p,x:x+p.x*scale,y:p.y*scale,z:z+p.z*scale,w:p.w*scale,h:p.h*scale,d:p.d*scale});
 put({x:0,y:.25,z:0,w:.28,h:.5,d:.28,color:0x997754,shape:'pot'});put({x:0,y:.495,z:0,w:.25,h:.025,d:.25,color:0x352e21,shape:'cylinder'});
 for(let stem=0;stem<3;stem++){const a=stem*2.4,tip=new THREE.Vector3(Math.cos(a)*.12,1.25+stem*.15,Math.sin(a)*.12);rod(put,new THREE.Vector3(0,.49,0),tip,.014,0x586b3b);
  for(let i=0;i<5;i++){const angle=i*2.4+stem,level=.68+i*.14;const origin=new THREE.Vector3(tip.x*level/1.6,level,tip.z*level/1.6),end=origin.clone().add(new THREE.Vector3(Math.cos(angle)*.14,.06,Math.sin(angle)*.14));rod(put,origin,end,.008,0x697746);put({x:end.x,y:end.y,z:end.z,w:.19+(i%2)*.025,h:.38+(i%3)*.07,d:.4,color:[0x547849,0x6f9256,0x789d60][(i+stem)%3],shape:'leaf',ry:angle,rz:(i%2?1:-1)*.8,rx:.2});}
 }
}
export function buildChair(add:AddPart,x:number,z:number,color:number,office=true,yaw=0){
 const p=(a:Part)=>{const e=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(a.rx??0,a.ry??0,a.rz??0))));add({...a,x:x+a.x*Math.cos(yaw)+a.z*Math.sin(yaw),z:z-a.x*Math.sin(yaw)+a.z*Math.cos(yaw),rx:e.x,ry:e.y,rz:e.z});};
 // Overlapping flattened spheres soften the cushion edges without extra draw calls.
 p({x:0,y:.56,z:0,w:.38,h:.09,d:.36,color,shape:'sphere'});p({x:0,y:1.04,z:-.29,w:.36,h:.42,d:.085,color,shape:'sphere'});
 p({x:0,y:.78,z:-.3,w:.08,h:.4,d:.055,color:0x414b43});
 if(office){p({x:0,y:.3,z:0,w:.045,h:.43,d:.045,color:0x77817a,shape:'cylinder'});
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5,tx=Math.cos(a)*.37,tz=Math.sin(a)*.37;rod(p,new THREE.Vector3(0,.17,0),new THREE.Vector3(tx,.1,tz),.026,0x465149);p({x:tx,y:.06,z:tz,w:.055,h:.06,d:.055,color:0x252f2a,shape:'sphere'});}
  for(const dx of [-.38,.38]){p({x:dx,y:.68,z:.04,w:.035,h:.28,d:.035,color:0x67766b});p({x:dx,y:.83,z:.02,w:.09,h:.055,d:.42,color:0x34443b});}
 }else{for(const dx of [-.26,.26])for(const dz of [-.24,.24])p({x:dx,y:.25,z:dz,w:.05,h:.5,d:.05,color:0x675342});}
}
