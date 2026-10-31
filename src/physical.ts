import {TOTAL, location, reference} from './archive';
import {containerFor,initialFiles,initialCount,parseContainer,isContainer,STORAGE,storageLabel,type Container} from './storage';
export type {Container} from './storage';
import type {Save, OfficeState} from './types';
export const DRAWER_CAPACITY=20;
export type Surface='counter'|'table'|'fridge'|'microwave'|'coffee'|'water'|'cupboard-0'|'cupboard-1'|'cupboard-2'|'cupboard-3';
export type Held={kind:'file';id:number}|{kind:'item';id:string}|{kind:'copy';id:string}|{kind:'tool';id:import('./desk/types').ToolId}|{kind:'sticky';id:number}|{kind:'can';id:'office-can'};
export type DocumentPlace=Container|'held'|'inventory'|'printer-input';
export interface PaperCopy {id:string;file:number;place:Container|'held'|'inventory'|'printer-output'|'legacy-binder'}
export interface SmallItem {id:string;kind:'mug'|'meal';contents:'empty'|'coffee'|'water'|'food';place:Surface|'held';warm:boolean}
export interface PhysicalState {held:Held|null;files:Record<string,DocumentPlace>;items:SmallItem[];copies?:PaperCopy[];nextCopy?:number}
export const SURFACES:Record<Surface,{name:string;capacity:number;accept:'mug'|'meal'|'both'}>={
 counter:{name:'Kitchen counter',capacity:4,accept:'both'},table:{name:'Utility table',capacity:4,accept:'both'},fridge:{name:'Fridge shelf',capacity:6,accept:'meal'},microwave:{name:'Microwave',capacity:1,accept:'meal'},coffee:{name:'Coffee tray',capacity:1,accept:'mug'},water:{name:'Water dispenser',capacity:1,accept:'mug'},
 'cupboard-0':{name:'Cupboard 1',capacity:3,accept:'mug'},'cupboard-1':{name:'Cupboard 2',capacity:3,accept:'mug'},'cupboard-2':{name:'Cupboard 3',capacity:3,accept:'mug'},'cupboard-3':{name:'Cupboard 4',capacity:3,accept:'mug'}
};
export function freshPhysical(office?:OfficeState):PhysicalState{return {held:null,files:{},copies:[],nextCopy:1,items:[
 {id:'coffee-mug',kind:'mug',contents:office?.coffee?'coffee':'empty',place:'coffee',warm:false},
 {id:'water-cup',kind:'mug',contents:'empty',place:'table',warm:false},
 {id:'spare-mug',kind:'mug',contents:'empty',place:'table',warm:false}]};}
export function retireKitchen(p:PhysicalState):PhysicalState{
 p.items=p.items.filter(i=>i.kind==='mug');if(p.held?.kind==='item'&&!p.items.some(i=>i.id===p.held!.id))p.held=null;
 let coffeeTaken=false;for(const item of p.items){item.warm=false;if(item.place==='held')continue;if(item.place==='coffee'&&!coffeeTaken){coffeeTaken=true;continue;}item.place='table';}
 return p;
}
export function physicalFor(save:Save){return save.physical??=freshPhysical(save.office);}
export function homeContainer(id:number):Container {const l=location(id);return containerFor(l.cabinet,l.drawer);}
export function currentContainer(p:PhysicalState,id:number){return p.files[id]??homeContainer(id);}
export const containerLabel=storageLabel;
const filingIndexes=new WeakMap<PhysicalState,{incoming:Map<Container,number[]>;outgoing:Map<Container,number[]>}>();
function filingIndex(p:PhysicalState){let index=filingIndexes.get(p);if(index)return index;index={incoming:new Map(),outgoing:new Map()};for(const [key,place]of Object.entries(p.files)){const id=Number(key),home=homeContainer(id);if(place===home)continue;const outgoing=index.outgoing.get(home)??[];outgoing.push(id);index.outgoing.set(home,outgoing);if(isContainer(place)){const incoming=index.incoming.get(place)??[];incoming.push(id);index.incoming.set(place,incoming);}}filingIndexes.set(p,index);return index;}
export function containerFiles(p:PhysicalState,c:Container):number[]{
 const ids:number[]=[];
 for(const id of initialFiles(c))if(currentContainer(p,id)===c)ids.push(id);
 ids.push(...(filingIndex(p).incoming.get(c)??[]));return ids;
}
export function capacity(c:Container){const p=parseContainer(c);return p?STORAGE[p.unit].capacity:c==='desk-tray'?4:DRAWER_CAPACITY;}
export function setOriginalPlace(p:PhysicalState,id:number,to:DocumentPlace){if(to===homeContainer(id))delete p.files[id];else p.files[id]=to;filingIndexes.delete(p);}
/** Count originals without materialising a list; filingIndex is invalidated on moves. */
export function containerOriginalCount(p:PhysicalState,c:Container){const index=filingIndex(p);return initialCount(c)-(index.outgoing.get(c)?.length??0)+(index.incoming.get(c)?.length??0);}
export function containerLoad(p:PhysicalState,c:Container){return containerOriginalCount(p,c)+(p.copies??[]).filter(copy=>copy.place===c).length;}
export function takeFile(p:PhysicalState,id:number,from:Container,limit=2){if(p.held)return 'Your hands are full. Place the held object first.';if(currentContainer(p,id)!==from)return 'That original has moved.';if(Object.values(p.files).filter(v=>v==='inventory'||v==='held').length+(p.copies??[]).filter(c=>c.place==='inventory'||c.place==='held').length>=limit)return 'Your file inventory is full. Store a file before taking another.';p.files[id]='held';filingIndexes.delete(p);p.held={kind:'file',id};return null;}
export function placeFile(p:PhysicalState,to:Container){if(p.held?.kind!=='file'&&p.held?.kind!=='copy')return 'Only files belong in filing storage.';if(containerLoad(p,to)>=capacity(to))return 'This storage is full.';if(p.held.kind==='copy'){const c=p.copies?.find(c=>c.id===p.held!.id);if(!c)return 'That copy is unavailable.';c.place=to;}else setOriginalPlace(p,p.held.id,to);p.held=null;return null;}

export function itemName(i:SmallItem){return i.kind==='mug'?(i.id==='water-cup'?(i.contents==='empty'?'Empty glass':i.contents==='coffee'?'Coffee glass':'Water glass'):(i.contents==='empty'?'Empty mug':i.contents==='coffee'?'Coffee mug':'Water cup')):(i.contents==='empty'?'Empty meal container':i.warm?'Warm lunch':'Packed lunch');}
export function takeItem(p:PhysicalState,id:string){if(p.held)return 'Your hands are full. Place the held object first.';const item=p.items.find(i=>i.id===id);if(!item||item.place==='held')return 'That object is unavailable.';item.place='held';p.held={kind:'item',id};return null;}
export function placeItem(p:PhysicalState,to:Surface){if(p.held?.kind!=='item')return 'Place files in a file drawer or your desk tray.';const item=p.items.find(i=>i.id===p.held!.id)!;if(!['coffee','table','water'].includes(to))return 'That storage is no longer available.';const surface=SURFACES[to];if(surface.accept!=='both'&&surface.accept!==item.kind)return surface.accept==='mug'?'This space is for cups.':'This space is for meals.';if(p.items.filter(i=>i.place===to).length>=surface.capacity)return `${surface.name} is full.`;item.place=to;p.held=null;return null;}
export function consumeHeld(p:PhysicalState){if(p.held?.kind!=='item')return 'Hold a cup or meal first.';const item=p.items.find(i=>i.id===p.held!.id)!;if(item.contents==='empty')return 'It is empty. You are still holding it.';const message=item.kind==='mug'?'A quiet sip. The empty mug stays in your hand.':'Lunch finished. The empty container stays in your hand.';item.contents='empty';item.warm=false;return message;}
export function validatePhysical(input:unknown,office?:OfficeState,allowLegacy=false):PhysicalState{
 if(input===undefined)return freshPhysical(office);
 const p=structuredClone(input) as PhysicalState;const fail=()=>{throw new Error('Invalid held objects or file storage. Restore a valid backup.');};
 if(!p||typeof p.files!=='object'||!p.files||Array.isArray(p.files)||Object.keys(p.files).length>TOTAL||!Array.isArray(p.items)||!(p.items.length===3||(allowLegacy&&p.items.length===9)))fail();
 if(p.held!==null&&(!p.held||!['file','item','copy','tool','sticky','can'].includes(p.held.kind)))fail();
 const heldFiles:number[]=[];const counts=new Map<Container,number>();
 for(const [key,c]of Object.entries(p.files)){const id=Number(key);if(String(id)!==key||!/^\d+$/.test(key)||!Number.isInteger(id)||id<0||id>=TOTAL)fail();const home=homeContainer(id);counts.set(home,(counts.get(home)??initialCount(home))-1);if(c==='held')heldFiles.push(id);else if(isContainer(c)){counts.set(c,(counts.get(c)??initialCount(c))+1);}else if(c!=='inventory'&&c!=='printer-input')fail();}
 p.copies??=[];p.nextCopy??=1;if(!Array.isArray(p.copies)||p.copies.length>4096||new Set(p.copies.map(c=>c.id)).size!==p.copies.length||!Number.isSafeInteger(p.nextCopy)||p.nextCopy<1||p.nextCopy>1e9)fail();
 for(const copy of p.copies){if(!copy||typeof copy.id!=='string'||! /^(print-[1-9]\d*|legacy-\d+|legacy-output)$/.test(copy.id)||!Number.isInteger(copy.file)||copy.file<0||copy.file>=TOTAL)fail();if(isContainer(copy.place))counts.set(copy.place,(counts.get(copy.place)??initialCount(copy.place))+1);else if(!['held','inventory','printer-output','legacy-binder'].includes(copy.place))fail();}
 if(p.copies.filter(c=>c.place==='printer-output').length>1||p.copies.filter(c=>c.place==='legacy-binder').length>32||Object.values(p.files).filter(v=>v==='printer-input').length>1)fail();
 const heldCopies=p.copies.filter(c=>c.place==='held');if(p.held?.kind==='copy'){if(heldCopies.length!==1||heldCopies[0].id!==p.held.id)fail();}else if(heldCopies.length)fail();
 if([...counts].some(([c,n])=>n<0||n>capacity(c)))fail();
 if(p.held?.kind==='file'){if(heldFiles.length!==1||heldFiles[0]!==p.held.id)fail();}else if(heldFiles.length)fail();
 const originals=allowLegacy&&p.items.length===9?[...freshPhysical().items,...Array.from({length:6},(_,i)=>({id:`meal-${i+1}`,kind:'meal'}))]:freshPhysical().items;const heldItems:SmallItem[]=[];const spots=new Map<Surface,number>();
 if(new Set(p.items.map(i=>i.id)).size!==p.items.length)fail();
 for(const i of p.items){const original=originals.find(o=>o.id===i.id);if(!original||original.kind!==i.kind||typeof i.warm!=='boolean'||!(i.kind==='mug'?['empty','coffee','water']:['empty','food']).includes(i.contents))fail();if(i.place==='held')heldItems.push(i);else{if(!Object.hasOwn(SURFACES,i.place)||(!allowLegacy&&!['table','coffee','water'].includes(i.place)))fail();const s=SURFACES[i.place];if(s.accept!=='both'&&s.accept!==i.kind)fail();spots.set(i.place,(spots.get(i.place)??0)+1);if(spots.get(i.place)!>s.capacity)fail();}}
 if(p.held?.kind==='item'){if(heldItems.length!==1||heldItems[0].id!==p.held.id)fail();}else if(heldItems.length)fail();
 return allowLegacy?retireKitchen(p):p;
}
export function movedNotes(p:PhysicalState,c:Container){return (filingIndex(p).outgoing.get(c)??[]).map(id=>({id,text:`${reference(id)} → ${containerLabel(currentContainer(p,id))}`}));}
