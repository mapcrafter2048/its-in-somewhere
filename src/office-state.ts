import {TOTAL} from './archive';
import type {OfficeState,PropId,Save} from './types';
export const LATCHES=['fridge','microwave','cupboard-0','cupboard-1','cupboard-2','cupboard-3'] as const;
export function freshOffice():OfficeState{return {fanOn:false,open:[],coffee:0,water:0,printedFile:null};}
export function validateOffice(value:unknown):OfficeState{
 if(value===undefined)return freshOffice();const s=value as OfficeState;
 if(!s||(s.fanOn!==undefined&&typeof s.fanOn!=='boolean')||!Array.isArray(s.open)||s.open.length>LATCHES.length||s.open.some(p=>!(LATCHES as readonly string[]).includes(p))||new Set(s.open).size!==s.open.length||![0,1].includes(s.coffee)||![0,1].includes(s.water)||(s.printedFile!==null&&(!Number.isInteger(s.printedFile)||s.printedFile<0||s.printedFile>=TOTAL)))throw new Error('Invalid office appliance state. Restore a valid backup.');
 return {fanOn:s.fanOn??false,open:[...s.open],coffee:s.coffee,water:s.water,printedFile:s.printedFile};
}
export function officeFor(save:Save){return save.office??=freshOffice();}
export function toggleLatch(state:OfficeState,id:PropId){const i=state.open.indexOf(id);if(i<0)state.open.push(id);else state.open.splice(i,1);}
