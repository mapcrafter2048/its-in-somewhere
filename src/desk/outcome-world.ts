import * as THREE from 'three';
import type { Save } from '../types';
import { THREADS } from '../content/packs/records';

/** Three fixed sheets, uploaded only when a correspondence outcome changes. */
export class OutcomeWorld{
 readonly root=new THREE.Group();
 private sheets:{mesh:THREE.Mesh;canvas:HTMLCanvasElement;texture:THREE.CanvasTexture}[]=[];
 private key='';
 constructor(){
  this.root.name='correspondence-outcomes';
  THREADS.forEach((t,i)=>{
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=640;
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
   const mesh=new THREE.Mesh(new THREE.PlaneGeometry(.48,.6),new THREE.MeshStandardMaterial({map:texture,roughness:1}));
   mesh.name=`outcome-${t.id}`;mesh.position.set(-4.8+i*.65,2.8,-1.34);mesh.rotation.z=(i-1)*.025;mesh.visible=false;
   this.root.add(mesh);this.sheets.push({mesh,canvas,texture});
  });
 }
 sync(save:Save){
  const key=JSON.stringify([save.recordPack,save.deskLife?.resolved]);if(key===this.key)return;this.key=key;
  THREADS.forEach((t,i)=>{
   const sheet=this.sheets[i];sheet.mesh.visible=save.recordPack===1&&!!save.deskLife?.resolved.includes(t.id);
   if(!sheet.mesh.visible)return;
   const c=sheet.canvas.getContext('2d')!;c.fillStyle=['#e3dfc5','#cddbc7','#ead9cb'][i];c.fillRect(0,0,512,640);
   c.fillStyle='#354634';c.font='bold 28px monospace';c.fillText(['RECORDS CORRECTED','DIRECTORY UPDATED','FOR MARA'][i],24,50);
   c.font='25px Georgia';const lines=t.notice.match(/.{1,31}(?:\s|$)|.{1,31}/g)??[];lines.forEach((line,n)=>c.fillText(line.trim(),24,110+n*36));
   c.font='18px monospace';c.fillText('Retained correspondence',24,600);sheet.texture.needsUpdate=true;
  });
 }
}
