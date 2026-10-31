import type {Save} from './types';
import {physicalFor,currentContainer,setOriginalPlace,containerLoad,capacity,type PhysicalState,type PaperCopy,type DocumentPlace,type Container} from './physical';
export interface CarriedDocument {key:string;kind:'original'|'copy';file:number;copy?:string}
export const inventoryCapacity=(save:Pick<Save,'upgrades'>)=>save.upgrades.includes('bookmarks')?5:2;
export function carriedDocuments(p:PhysicalState):CarriedDocument[]{return [
 ...Object.entries(p.files).filter(([,place])=>place==='held'||place==='inventory').map(([file])=>({key:`original:${file}`,kind:'original' as const,file:Number(file)})),
 ...(p.copies??[]).filter(c=>c.place==='held'||c.place==='inventory').map(c=>({key:`copy:${c.id}`,kind:'copy' as const,file:c.file,copy:c.id}))
 ];}
export function documentFor(p:PhysicalState,key:string):CarriedDocument|undefined {if(key.startsWith('original:')){const id=Number(key.slice(9));if(carriedDocuments(p).some(d=>d.key===key))return {key,kind:'original',file:id};}else if(key.startsWith('copy:')){const c=p.copies?.find(c=>c.id===key.slice(5));if(c)return {key,kind:'copy',file:c.file,copy:c.id};}return undefined;}
export function retainOriginal(p:PhysicalState,id:number,from:DocumentPlace,limit:number){
 if(currentContainer(p,id)!==from)return 'That original has moved.';
 if(from==='held'||from==='inventory')return null;
 if(carriedDocuments(p).length>=limit)return 'Your file inventory is full. Store a file before taking another.';
 setOriginalPlace(p,id,'inventory');return null;
}
export function stowHeld(p:PhysicalState){if(p.held&&!['file','copy'].includes(p.held.kind))return 'Stow or place the held object before equipping a file.';if(p.held?.kind==='file')setOriginalPlace(p,p.held.id,'inventory');if(p.held?.kind==='copy'){const copy=p.copies?.find(c=>c.id===p.held!.id);if(copy)copy.place='inventory';}p.held=null;return null;}
export function equipDocument(p:PhysicalState,key:string){const doc=carriedDocuments(p).find(d=>d.key===key);if(!doc)return 'That document is not in your inventory.';const error=stowHeld(p);if(error)return error;if(doc.kind==='original'){setOriginalPlace(p,doc.file,'held');p.held={kind:'file',id:doc.file};}else{p.copies!.find(c=>c.id===doc.copy)!.place='held';p.held={kind:'copy',id:doc.copy!};}return null;}
export function takeCopy(p:PhysicalState,id:string,limit:number){const copy=p.copies?.find(c=>c.id===id);if(!copy)return 'That copy is unavailable.';if(copy.place==='inventory'||copy.place==='held')return null;if(carriedDocuments(p).length>=limit)return 'Your file inventory is full. Store a file before taking another.';copy.place='inventory';return null;}
export function storeDocument(p:PhysicalState,key:string,to:Container){
 const doc=carriedDocuments(p).find(d=>d.key===key);if(!doc)return 'Carry the document before storing it.';
 if(containerLoad(p,to)>=capacity(to))return 'This storage is full.';
 if(doc.kind==='original')setOriginalPlace(p,doc.file,to);else p.copies!.find(c=>c.id===doc.copy)!.place=to;
 if((p.held?.kind==='file'&&doc.kind==='original'&&p.held.id===doc.file)||(p.held?.kind==='copy'&&p.held.id===doc.copy))p.held=null;return null;
}
export function printerOriginal(p:PhysicalState){const key=Object.keys(p.files).find(id=>p.files[id]==='printer-input');return key===undefined?null:Number(key);}
export function insertOriginal(p:PhysicalState,id:number){if(printerOriginal(p)!==null)return 'Collect the original already in the input tray.';if(!carriedDocuments(p).some(d=>d.kind==='original'&&d.file===id))return 'Carry the original to the printer first.';setOriginalPlace(p,id,'printer-input');if(p.held?.kind==='file'&&p.held.id===id)p.held=null;return null;}
export function createPrintedCopy(p:PhysicalState,file:number):PaperCopy|null{
 p.copies??=[];if(p.copies.length>=4096||p.copies.some(c=>c.place==='printer-output'))return null;
 let id:string;do{id=`print-${p.nextCopy??1}`;p.nextCopy=(p.nextCopy??1)+1;}while(p.copies.some(c=>c.id===id));
 const copy:PaperCopy={id,file,place:'printer-output'};p.copies.push(copy);return copy;
}
export function collectPrinter(p:PhysicalState,limit:number){
 const original=printerOriginal(p),copy=p.copies?.find(c=>c.place==='printer-output'),needed=Number(original!==null)+Number(!!copy);
 if(!needed)return 'Both printer trays are empty.';if(carriedDocuments(p).length+needed>limit)return 'Make room in your inventory for both printer trays.';
 if(original!==null)setOriginalPlace(p,original,'inventory');if(copy)copy.place='inventory';return null;
}
export function shredCopy(p:PhysicalState,id:string){const copy=p.copies?.find(c=>c.id===id);if(!copy||!['held','inventory'].includes(copy.place))return 'Carry a printed copy to shred. Originals are protected.';p.copies=p.copies!.filter(c=>c.id!==id);if(p.held?.kind==='copy'&&p.held.id===id)p.held=null;return null;}
export function availableAtDesk(p:PhysicalState){return [...new Set([
 ...carriedDocuments(p).map(d=>d.file),...Object.entries(p.files).filter(([,place])=>place==='personal:0'||place==='personal:1'||place==='desk-tray').map(([id])=>Number(id)),
 ...(p.copies??[]).filter(c=>['personal:0','personal:1','desk-tray','legacy-binder'].includes(c.place)).map(c=>c.file)
 ])];}
export function migrateInventory(save:Save){if(save.inventoryVersion===1)return save;const p=physicalFor(save);p.copies??=[];p.nextCopy??=1;
 for(const [n,file]of save.bookmarks.entries())p.copies.push({id:`legacy-${n}`,file,place:'legacy-binder'});
 if(save.office?.printedFile!==null&&save.office?.printedFile!==undefined&&!p.copies.some(c=>c.place==='printer-output'))p.copies.push({id:'legacy-output',file:save.office.printedFile,place:'printer-output'});
 save.inventoryVersion=1;return save;
}
