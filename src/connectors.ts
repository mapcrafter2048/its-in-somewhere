import * as THREE from 'three';
export const HALL_SHIFT=7.4;
export function inConnector(x:number,z:number,side:number){const u=x*side;return (u>=21.9&&u<=27.1&&z>=10.35&&z<=13.05)||(u>=25&&u<=27.1&&(side>0?z>=5.95&&z<=13.05:z>=10.35&&z<=17.45));}
export function connectorDestination(x:number,z:number,wing:number){if(x>25&&z<7.9&&wing<3)return wing+1;if(x<-25&&z>15.6&&wing>0)return wing-1;return null;}
export function connectorArrival(x:number,z:number,direction:number):[number,number]{return [x-direction*52,z+direction*HALL_SHIFT];}
export function addConnector(scene:THREE.Scene,unit:THREE.BufferGeometry,side:number,destination:string){
 const wall=new THREE.MeshLambertMaterial({color:0x818976}),trim=new THREE.MeshLambertMaterial({color:0x485c4c}),floor=new THREE.MeshLambertMaterial({color:0x727767}),light=new THREE.MeshBasicMaterial({color:0xe5e3c5});
 const box=(mat:THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number)=>{const m=new THREE.Mesh(unit,mat);m.position.set(side*x,y,z);m.scale.set(w,h,d);scene.add(m);return m;};
 const end=side>0?5.7:17.7,lower=side>0?5.7:13.35,upper=side>0?10.05:17.7;
 box(floor,25.05,-.08,11.7,5.1,.16,3.3);box(floor,26.05,-.08,(lower+upper)/2,2.7,.16,upper-lower);
 box(wall,24.8,3.7,11.7,5.6,.12,3.3);box(wall,26.05,3.7,(lower+upper)/2,2.7,.12,upper-lower);
 // A return wall hides the connecting leg from the room. Both connectors have a genuine walkable bend.
 box(wall,24.8,1.8,side>0?13.4:10,5.6,3.6,.12);box(wall,23.35,1.8,side>0?10:13.4,2.7,3.6,.12);
 box(wall,27.45,1.8,(Math.min(end,10.05)+Math.max(end,13.35))/2,.12,3.6,Math.abs(end-11.7)+3.3);
 box(wall,24.65,1.8,(lower+upper)/2,.12,3.6,upper-lower);box(wall,26.05,1.8,end,2.8,3.6,.12);
 for(const z of [side>0?13.32:10.08])box(trim,24.8,.15,z,5.6,.2,.06);
 box(light,24.1,3.59,11.7,1.25,.025,.35);box(light,26.05,3.59,side>0?8.5:15.1,.4,.025,1.1);
 // Locally generated direction signage faces the entry, making the bend legible.
 const cv=document.createElement('canvas');cv.width=512;cv.height=128;const ctx=cv.getContext('2d')!;ctx.fillStyle='#d5d7be';ctx.fillRect(0,0,512,128);ctx.fillStyle='#2d4534';ctx.font='bold 26px monospace';ctx.textAlign='center';ctx.fillText(destination.toUpperCase(),256,52,490);ctx.font='24px monospace';ctx.fillText(side>0?'TURN LEFT ←':'TURN RIGHT →',256,96);
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.45),new THREE.MeshBasicMaterial({map:tex}));sign.position.set(side*27.37,2.2,11.7);sign.rotation.y=side>0?-Math.PI/2:Math.PI/2;scene.add(sign);
}
