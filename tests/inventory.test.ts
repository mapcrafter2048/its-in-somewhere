import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {freshSave,validateSave,loadSave,SAVE_KEY,INVENTORY_BACKUP_KEY,buy} from '../src/state';
import {homeContainer,currentContainer,containerLoad,containerFiles,validatePhysical} from '../src/physical';
import {inventoryCapacity,retainOriginal,carriedDocuments,equipDocument,storeDocument,printerOriginal,insertOriginal,createPrintedCopy,collectPrinter,takeCopy,shredCopy} from '../src/inventory';
import {OfficeProps} from '../src/appliances';
import {freshOffice} from '../src/office-state';
test('two carried originals share inventory capacity with copies; manual storage and the satchel free and expand slots',()=>{
 const s=freshSave(),p=s.physical!;assert.equal(inventoryCapacity(s),2);for(const id of [0,1])assert.equal(retainOriginal(p,id,homeContainer(id),2),null);assert.match(retainOriginal(p,2,homeContainer(2),2)!,/full/);assert.equal(containerFiles(p,'archive:0:0').length,14);assert.equal(storeDocument(p,'original:0','personal:0'),null);assert.equal(containerLoad(p,'personal:0'),1);assert.equal(retainOriginal(p,2,homeContainer(2),2),null);
 s.credits=100;buy(s,'bookmarks');assert.equal(inventoryCapacity(s),5);for(const id of [3,4,5])assert.equal(retainOriginal(p,id,homeContainer(id),5),null);assert.match(retainOriginal(p,6,homeContainer(6),5)!,/full/);assert.equal(carriedDocuments(p).length,5);assert.equal(equipDocument(p,'original:1'),null);assert.equal(p.held?.id,1);assert.deepEqual(validateSave(s),s);
});
test('printer input removes the original from the bag and returns original plus copy atomically without duplicate originals',()=>{
 const s=freshSave(),p=s.physical!;retainOriginal(p,0,homeContainer(0),2);assert.equal(insertOriginal(p,0),null);assert.equal(printerOriginal(p),0);assert.equal(carriedDocuments(p).length,0);const copy=createPrintedCopy(p,0)!;s.office!.printedFile=0;assert.equal(copy.place,'printer-output');retainOriginal(p,1,homeContainer(1),2);assert.match(collectPrinter(p,2)!,/room/);assert.equal(printerOriginal(p),0);storeDocument(p,'original:1','personal:0');assert.equal(collectPrinter(p,2),null);s.office!.printedFile=null;assert.equal(carriedDocuments(p).length,2);assert.equal(currentContainer(p,0),'inventory');assert.equal(storeDocument(p,'copy:'+copy.id,'personal:1'),null);assert.equal(containerLoad(p,'personal:1'),1);assert.equal(containerFiles(p,'personal:1').length,0);assert.deepEqual(validateSave(s),s);assert.match(shredCopy(p,copy.id)!,/Carry/);takeCopy(p,copy.id,2);assert.equal(shredCopy(p,copy.id),null);assert.equal(currentContainer(p,0),'inventory');assert.equal(p.copies!.length,0);
});
test('physical copies share filing capacity, cannot duplicate held state, and cannot bypass inventory limits',()=>{
 const s=freshSave(),p=s.physical!;for(let n=0;n<5;n++)p.copies!.push({id:`print-${n+1}`,file:0,place:'archive:0:0'});assert.throws(()=>validatePhysical(p));p.copies=[];
 for(let n=0;n<3;n++)p.copies.push({id:`print-${n+1}`,file:0,place:'inventory'});assert.throws(()=>validateSave(s),/capacity/);p.copies[0].place='held';assert.throws(()=>validatePhysical(p));p.held={kind:'copy',id:'print-1'};s.upgrades.push('bookmarks');assert.deepEqual(validateSave(s),s);p.copies.push({...p.copies[0]});assert.throws(()=>validateSave(s));
});
test('older retained copies and output migrate into a desk binder and collectable tray once, with a raw backup',()=>{
 const old=freshSave();delete old.inventoryVersion;old.bookmarks=[0,1,2];old.office!.printedFile=3;old.physical!.held={kind:'file',id:4};old.physical!.files[4]='held';const raw=JSON.stringify(old),values=new Map([[SAVE_KEY,raw]]),storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);}};
 const a=loadSave(storage);assert.equal(a.error,undefined);assert.equal(values.get(INVENTORY_BACKUP_KEY),raw);assert.equal(a.save.physical!.copies!.filter(c=>c.place==='legacy-binder').length,3);assert.equal(a.save.physical!.copies!.find(c=>c.place==='printer-output')!.file,3);assert.deepEqual(a.save.physical!.held,old.physical!.held);assert.deepEqual(loadSave(storage).save,a.save);assert.equal(values.get(INVENTORY_BACKUP_KEY),raw);
 const blocked=loadSave({getItem:k=>k===SAVE_KEY?raw:null,setItem:()=>{throw Error('quota');}});assert.match(blocked.error!,/automatic writes are paused/);
});
test('water dispenser fills once, blocks pickup during its cycle, and restores stopped',t=>{
 let now=100;t.mock.method(performance,'now',()=>now);const s=freshSave(),p=s.physical!,state=freshOffice(),props=new OfficeProps(3,new THREE.BoxGeometry(),state,p);assert.match(props.action('water').message!,/empty mug/);p.items[1].place='water';props.syncItems();assert.equal(props.action('water').sound,'pour');assert.equal(props.canTake('water-cup'),false);now+=2100;props.update(.05,false);assert.equal(p.items[1].contents,'water');assert.equal(props.canTake('water-cup'),true);props.update(.05,false);assert.equal(p.items[1].contents,'water');props.startShred();assert.equal(props.shredding,true);props.restore(state,p);assert.equal(props.dispensing,false);assert.equal(props.shredding,false);
});
