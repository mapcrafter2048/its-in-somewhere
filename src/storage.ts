import {DRAWER_BANKS,STORAGE_UNITS,FILES,fileId,location,cabinetPosition,type StorageKind} from './archive';
import {STORAGE_RUNS,NOOK,NOOK_BOX_STACKS} from './hub-layout';
export type FilingContainer=`archive:${number}:${number}`|`rear:${number}:${number}`|`wall:${number}:${number}:${number}`|`box:${number}:${number}`;
export type Container=FilingContainer|'personal:0'|'personal:1'|'desk-tray';
export interface StorageUnit {id:number;kind:StorageKind;wing:number;index:number;x:number;y:number;z:number;yaw:number;drawers:number;initial:number;capacity:number;label:string}
export function containerFor(unit:number,drawer=0):FilingContainer {const l=location(fileId(unit));if(l.kind==='front')return `archive:${unit}:${drawer}`;if(l.kind==='rear')return `rear:${unit-512}:${drawer}`;if(l.kind==='wall')return `wall:${l.wing}:${l.localCabinet}:${drawer}`;return `box:${l.wing}:${l.localCabinet}`;}
export function parseContainer(c:unknown):{unit:number;drawer:number}|null{
 if(typeof c!=='string')return null;let m:RegExpExecArray|null,unit:number,drawer:number;
 if((m=/^(archive|rear):(\d+):(\d+)$/.exec(c))){unit=Number(m[2])+(m[1]==='rear'?512:0);drawer=Number(m[3]);if(Number(m[2])>=512)return null;}
 else if((m=/^wall:(\d+):(\d+):(\d+)$/.exec(c))){if(Number(m[1])>=4||Number(m[2])>=18)return null;unit=1024+Number(m[1])*18+Number(m[2]);drawer=Number(m[3]);}
 else if((m=/^box:(\d+):(\d+)$/.exec(c))){if(Number(m[1])>=4||Number(m[2])>=(Number(m[1])===3?389:384))return null;unit=DRAWER_BANKS+Number(m[1])*384+Number(m[2]);drawer=0;}
 else return null;
 if(drawer>=8||unit>=STORAGE_UNITS||containerFor(unit,drawer)!==c)return null;return {unit,drawer};
}
export const isContainer=(c:unknown):c is Container=>c==='personal:0'||c==='personal:1'||c==='desk-tray'||parseContainer(c)!==null;
export function initialCount(c:Container){const p=parseContainer(c);return p?(p.unit<DRAWER_BANKS?FILES:8):0;}
export function initialFiles(c:Container){const p=parseContainer(c);return p?Array.from({length:initialCount(c)},(_,i)=>fileId(p.unit,p.drawer,i)):[];}
export const STORAGE:StorageUnit[]=Array.from({length:STORAGE_UNITS},(_,id)=>{
 const l=location(fileId(id));let x=0,y=0,z=0,yaw=0;
 if(l.kind==='front'||l.kind==='rear'){const p=cabinetPosition(id%512);x=p.x;z=p.z+(l.kind==='rear'?-.54:.54);yaw=l.kind==='rear'?Math.PI:0;}
 else if(l.kind==='wall'){const left=l.localCabinet%2===0;x=left?-21.2:21.2;z=-8-Math.floor(l.localCabinet/2)*4.2;yaw=left?Math.PI/2:-Math.PI/2;}
 else if(l.localCabinet<384){const run=STORAGE_RUNS[Math.floor(l.localCabinet/12)],n=l.localCabinet%12;x=run.x-1.25+(n%4)*.8;y=.15+Math.floor(n/4)*.68;z=run.z;}
 else{const p=NOOK_BOX_STACKS[l.localCabinet-384];x=NOOK.x+p.x;y=p.y;z=NOOK.z+p.z;}
 return {id,kind:l.kind,wing:l.wing,index:l.localCabinet,x,y,z,yaw,drawers:l.kind==='box'?1:8,initial:l.kind==='box'?8:16,capacity:l.kind==='box'?10:20,label:l.label};
});
export const UNITS_BY_WING=[0,1,2,3].map(w=>STORAGE.filter(s=>s.wing===w));
export function storageLabel(c:Container|'held'|'inventory'|'printer-input'){if(c==='held')return 'In your hand';if(c==='inventory')return 'Your carried inventory';if(c==='printer-input')return 'W4 · printer input tray';if(c==='desk-tray')return 'W4 · desk file tray';if(c.startsWith('personal:'))return `W4 · personal drawer ${Number(c.slice(-1))+1}`;const p=parseContainer(c)!;return STORAGE[p.unit].label+(STORAGE[p.unit].kind==='box'?'':` / drawer ${p.drawer+1}`);}
