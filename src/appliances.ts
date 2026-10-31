import {printerOriginal,createPrintedCopy} from './inventory';
import * as THREE from 'three';
import {freshPhysical,itemName,type PhysicalState,type Surface} from './physical';
import {makeMug,MUG_LIQUID_Y,MUG_LIQUID_RADIUS} from './models';
import {DESKTOP_Y,DESK_CHAIR} from './hub-layout';
import {makeModel,makeFolder,part,animateDeskFan} from './prop-models';
import type {OfficeState,PropId,PropTarget} from './types';
export interface Seat {x:number;z:number;yaw:number}
export const EQUIPMENT={fan:{x:.30,y:DESKTOP_Y,z:-.37},coffee:{x:4.15,y:DESKTOP_Y,z:0},printer:{x:5.6,y:DESKTOP_Y,z:0},water:{x:7.2,y:0,z:0},shredder:{x:2.3,y:0,z:.2}};
export const FAN_YAW=Math.atan2(DESK_CHAIR.x-EQUIPMENT.fan.x,DESK_CHAIR.z-EQUIPMENT.fan.z);
export class OfficeProps {
 readonly root=new THREE.Group();readonly hits:THREE.Mesh[]=[];readonly itemHits:THREE.Mesh[]=[];readonly surfaceHits:THREE.Mesh[]=[];readonly seats=new Map<PropId,Seat>();
 private fan=makeModel('desk-fan');private itemRoot=new THREE.Group();private physical:PhysicalState;private coffeeStart=-1;private printStart=-1;private printJob:number|null=null;private waterStart=-1;private shredStart=-1;private input=new THREE.Group();private shredPaper!:THREE.Mesh;
 private waterLiquid?:THREE.Mesh;private waterBase=.643;private waterFull=.153;
 private pour:THREE.Mesh;private waterPour:THREE.Mesh;private output:THREE.Group;private emerging:THREE.Mesh;
 onChange?:()=>void;onComplete?:(message:string)=>void;
 constructor(_wing:number,_unit:THREE.BufferGeometry,private state:OfficeState,physical?:PhysicalState){
  this.physical=physical??freshPhysical(state);
  this.fan.position.set(EQUIPMENT.fan.x,EQUIPMENT.fan.y,EQUIPMENT.fan.z);this.fan.rotation.y=FAN_YAW;this.root.add(this.fan);const fanBounds=new THREE.Box3().setFromObject(this.fan),fanCentre=fanBounds.getCenter(new THREE.Vector3()),fanSize=fanBounds.getSize(new THREE.Vector3());this.hit('fan',fanCentre.x,fanCentre.y,fanCentre.z,fanSize.x+.02,fanSize.y+.02,fanSize.z+.02);
  for(const name of ['coffee','printer'] as const){const model=makeModel(name),p=EQUIPMENT[name];model.position.set(p.x,p.y,p.z);this.root.add(model);this.hit(name,p.x,p.y+(name==='coffee'?.65:.5),p.z+.35,name==='coffee'?.7:1.3,name==='coffee'?.24:.65,.22);}
  for(const name of ['water','shredder'] as const){const model=makeModel(name==='water'?'water-dispenser':'shredder'),p=EQUIPMENT[name];model.position.set(p.x,p.y,p.z);this.root.add(model);if(name==='water')this.hit(name,p.x,.968,p.z+.205,.38,.12,.12);else this.hit(name,p.x,.75,p.z+.23,.62,.3,.30);}
  const original=makeFolder();original.rotation.x=-Math.PI/2;original.position.set(EQUIPMENT.printer.x,EQUIPMENT.printer.y+.618,-.06);this.input.add(original);this.root.add(this.input);this.hit('printer-input',5.6,EQUIPMENT.printer.y+.615,-.06,.6,.12,.44);
  this.shredPaper=part(this.root,2.3,.95,.11,.28,.35,.002,0xd8ceb0);
  this.waterPour=new THREE.Mesh(new THREE.CylinderGeometry(.006,.007,.08,10),new THREE.MeshStandardMaterial({color:0x8eb8b7,transparent:true,opacity:.65}));this.waterPour.position.set(7.085,.835,.295);this.root.add(this.waterPour);
  this.pour=new THREE.Mesh(new THREE.CylinderGeometry(.009,.011,.087,10),new THREE.MeshStandardMaterial({color:0x65442a}));this.pour.position.set(4.15,EQUIPMENT.coffee.y+.3535,.24);this.root.add(this.pour);
  this.output=new THREE.Group();part(this.output,5.6,EQUIPMENT.printer.y+.055,.55,.67,.015,.55,0xd8ceb0);for(let i=0;i<9;i++)part(this.output,5.56,EQUIPMENT.printer.y+.064,.35+i*.045,.38-(i%3)*.06,.002,.004,0x696652);this.root.add(this.output);
  this.emerging=part(this.root,5.6,EQUIPMENT.printer.y+.28,.45,.67,.009,.08,0xd8ceb0);this.hit('printer-output',5.6,EQUIPMENT.printer.y+.09,.57,1.1,.16,.45);
  this.root.add(this.itemRoot);
  for(const surface of ['coffee','table','water'] as const){const p=this.surfacePoint(surface);const h=new THREE.Mesh(new THREE.BoxGeometry(surface==='table'?1.05:.55,.12,.6),new THREE.MeshBasicMaterial({visible:false}));h.position.set(...p);if(surface==='table')h.position.x+=.27;h.userData.surface=surface;this.root.add(h);this.surfaceHits.push(h);}
  this.restore(state,this.physical);
 }
 get tapRunning(){return false;}get brewing(){return this.coffeeStart>=0;}get printing(){return this.printStart>=0;}get heating(){return false;}get dispensing(){return this.waterStart>=0;}get shredding(){return this.shredStart>=0;}
 private hit(id:PropId,x:number,y:number,z:number,w:number,h:number,d:number){const hit=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({visible:false}));hit.position.set(x,y,z);hit.userData.propId=id;this.root.add(hit);this.hits.push(hit);return hit;}
 registerSeat(id:PropId,x:number,z:number,yaw:number){this.seats.set(id,{x,z,yaw});}
 target(id:PropId):PropTarget{return {kind:'prop',id,label:id==='fan'?(this.state.fanOn?'Switch desk fan off':'Switch desk fan on'):id==='water'?(this.dispensing?'Filling water…':'Dispense water'):id==='shredder'?(this.shredding?'Shredder running…':'Shred a printed copy'):id==='printer-input'?'Collect printer original':id.startsWith('chair')?'Sit down':id==='coffee'?(this.brewing?'Coffee brewing…':'Brew coffee'):id==='printer'?(this.printing?'Printer running…':'Print a retained file'):(this.state.printedFile===null?'Empty output tray':'Read printed copy')};}
 restore(state:OfficeState,physical?:PhysicalState){this.state=state;if(physical)this.physical=physical;this.coffeeStart=this.printStart=this.waterStart=this.shredStart=-1;this.printJob=null;this.syncItems();}
 private refresh(){this.waterPour.visible=this.dispensing;this.input.visible=printerOriginal(this.physical)!==null;this.shredPaper.visible=this.shredding;this.pour.visible=this.brewing;this.output.visible=this.state.printedFile!==null;this.emerging.visible=this.printing;}
 action(id:PropId):{message?:string;sound?:'door'|'paper'|'message'|'brew'|'machine'|'water'|'pour'|'switch'}{
  if(id==='fan'){this.state.fanOn=!this.state.fanOn;this.onChange?.();return {sound:'switch'};}
  if(id==='water'){if(this.dispensing)return {message:'The dispenser is still filling the mug.'};const cup=this.physical.items.find(i=>i.place==='water');if(!cup||cup.contents!=='empty')return {message:'Place an empty mug on the dispenser tray with G.'};this.waterStart=performance.now();this.refresh();return {sound:'pour'};}
  if(id!=='coffee')return {};
  if(this.brewing)return {message:'The coffee is still brewing.'};const cup=this.physical.items.find(i=>i.place==='coffee');if(!cup)return {message:'Place an empty mug on the coffee tray with G.'};if(cup.contents!=='empty')return {message:'Pick up the cup and drink before brewing another.'};this.coffeeStart=performance.now();this.refresh();return {sound:'brew'};
 }
 startShred(){if(this.shredding)return false;this.shredStart=performance.now();this.refresh();return true;}
 startPrint(id:number){if(this.printing||printerOriginal(this.physical)!==id||this.state.printedFile!==null||(this.physical.copies??[]).some(c=>c.place==='printer-output')||(this.physical.copies?.length??0)>=4096)return false;this.printJob=id;this.printStart=performance.now();this.refresh();return true;}
 update(_dt:number,_reduced:boolean){animateDeskFan(this.fan,!!this.state.fanOn,_dt);const now=performance.now();if(this.dispensing&&this.waterLiquid){const t=Math.min((now-this.waterStart)/2000,1),level=.025+(this.waterFull-.025)*t;this.waterLiquid.visible=true;this.waterLiquid.position.y=level;const bottom=this.waterBase+level,length=.875-bottom;this.waterPour.scale.y=length/.08;this.waterPour.position.y=.875-length/2;}if(this.dispensing&&now-this.waterStart>=2000){this.waterStart=-1;const cup=this.physical.items.find(i=>i.place==='water');if(cup)cup.contents='water';this.syncItems();this.onChange?.();this.onComplete?.('Water is ready.');}if(this.shredding){const t=(now-this.shredStart)/2200;this.shredPaper.position.y=.95-t*.40;if(t>=1){this.shredStart=-1;this.refresh();this.onComplete?.('Printed copy shredded.');}}if(this.brewing&&now-this.coffeeStart>=5000){this.coffeeStart=-1;const cup=this.physical.items.find(i=>i.place==='coffee');if(cup)cup.contents='coffee';this.syncItems();this.onChange?.();this.onComplete?.('Coffee is ready.');}if(this.printing){const t=Math.min((now-this.printStart)/4000,1);this.emerging.scale.z=.08+t*.5;this.emerging.position.z=.42+t*.12;if(t===1){const copy=createPrintedCopy(this.physical,this.printJob!);this.state.printedFile=copy?.file??null;this.printJob=null;this.printStart=-1;this.refresh();this.onChange?.();this.onComplete?.('Printed copy ready in the output tray.');}}}
 blocked(_x:number,_z:number){return false;}
 private surfacePoint(surface:Surface,index=0,glass=false):[number,number,number]{return surface==='water'?[7.085,glass?.643:.65,.295]:surface==='coffee'?[4.15,EQUIPMENT.coffee.y+(glass?.1225:.13),.24]:[3.38+index*.27,DESKTOP_Y-(glass?.005:0),-.46];}
 waterPickup(){const cup=this.physical.items.find(i=>i.place==='water'&&i.contents!=='empty');return cup&&this.canTake(cup.id)?cup.id:null;}
 canPlace(surface:Surface){return surface==='table'||surface==='water'&&!this.dispensing||surface==='coffee'&&!this.brewing;}
 canTake(id:string){const item=this.physical.items.find(i=>i.id===id);return !!item&&item.place!=='held'&&this.canPlace(item.place);}
 hitAvailable(object:THREE.Object3D){const {itemId,surface}=object.userData;if(itemId)return this.canTake(itemId);if(surface)return this.canPlace(surface);return true;}
 syncItems(){
  this.state.water=this.physical.items.some(i=>i.place==='water'&&i.contents==='water')?1:0;
  this.state.coffee=this.physical.items.some(i=>i.place==='coffee'&&i.contents==='coffee')?1:0;
  this.itemRoot.traverse(o=>{if(o instanceof THREE.Mesh&&o.userData.disposable){o.geometry.dispose();(o.material as THREE.Material).dispose();}});this.itemRoot.clear();this.itemHits.length=0;this.waterLiquid=undefined;
  const counts=new Map<Surface,number>();for(const item of this.physical.items){if(item.place==='held')continue;const n=counts.get(item.place)??0;counts.set(item.place,n+1);const glass=item.id==='water-cup',group=glass?makeModel('water-glass'):makeMug();group.position.set(...this.surfacePoint(item.place,n,glass));group.name=itemName(item);this.itemRoot.add(group);
   const fluid=new THREE.Mesh(new THREE.CircleGeometry(glass?.064:MUG_LIQUID_RADIUS,48),new THREE.MeshStandardMaterial({color:(item.contents==='water'||item.place==='water')?0xa2c3c4:0x38271b,roughness:.15,transparent:item.contents==='water'||item.place==='water',opacity:(item.contents==='water'||item.place==='water')?.72:1,depthWrite:item.contents!=='water'&&item.place!=='water'}));fluid.userData.disposable=true;fluid.rotation.x=-Math.PI/2;fluid.position.y=glass?.153:MUG_LIQUID_Y;fluid.visible=item.contents!=='empty';group.add(fluid);if(item.place==='water'){this.waterLiquid=fluid;this.waterBase=group.position.y;this.waterFull=glass?.153:MUG_LIQUID_Y;}
   const hit=new THREE.Mesh(new THREE.BoxGeometry(glass?.17:.25,.23,glass?.17:.27),new THREE.MeshBasicMaterial({visible:false}));hit.userData.itemId=item.id;hit.userData.disposable=true;hit.position.copy(group.position);hit.position.y+=.115;this.itemRoot.add(hit);this.itemHits.push(hit);
  }this.refresh();
 }
}
