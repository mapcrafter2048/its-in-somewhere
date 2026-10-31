import {STORAGE,containerFor} from '../src/storage';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshPhysical,containerFiles,containerOriginalCount,containerLoad,takeFile,placeFile,homeContainer,currentContainer,validatePhysical,takeItem,placeItem,consumeHeld,movedNotes} from '../src/physical';
import {freshSave,validateSave,readPage} from '../src/state';
import {PHRASE,TOTAL} from '../src/archive';
import {toWorld,toRoom,zoneAt} from '../src/hub-layout';
test('originals move through 20-slot drawers and personal storage without duplication, text changes or rewards',()=>{
 const save=freshSave(),p=save.physical!,original=save.credits;assert.equal(containerFiles(p,'archive:0:0').length,16);
 assert.equal(takeFile(p,0,'archive:0:0'),null);assert.equal(containerFiles(p,'archive:0:0').length,15);assert.match(takeFile(p,1,'archive:0:0')!,/full/);assert.equal(placeFile(p,'personal:0'),null);assert.equal(currentContainer(p,0),'personal:0');assert.equal(movedNotes(p,'archive:0:0').length,1);
 for(const id of [16,17,18,19]){assert.equal(takeFile(p,id,homeContainer(id)),null);assert.equal(placeFile(p,'archive:0:2'),null);}assert.equal(containerFiles(p,'archive:0:2').length,20);takeFile(p,20,homeContainer(20));assert.match(placeFile(p,'archive:0:2')!,/full/);assert.equal(p.held?.id,20);placeFile(p,'desk-tray');
 let sum=0;for(const u of STORAGE)for(let d=0;d<u.drawers;d++)sum+=containerFiles(p,containerFor(u.id,d)).length;sum+=containerFiles(p,'personal:0').length+containerFiles(p,'personal:1').length+containerFiles(p,'desk-tray').length;assert.equal(sum,TOTAL);assert.equal(save.credits,original);assert.deepEqual(validateSave(JSON.parse(JSON.stringify(save))),save);
 takeFile(p,0,'personal:0');placeFile(p,homeContainer(0));assert.equal(p.files['0'],undefined);
});
test('mugs retain contents, enforce one held object, and only use retained surfaces',()=>{
 const p=freshPhysical();assert.equal(p.items.length,3);assert.equal(takeItem(p,'coffee-mug'),null);assert.match(placeFile(p,'personal:0')!,/Only files/);assert.match(takeItem(p,'spare-mug')!,/full/);p.items[0].contents='coffee';consumeHeld(p);assert.equal(p.held?.id,'coffee-mug');assert.equal(p.items[0].contents,'empty');assert.equal(placeItem(p,'table'),null);assert.deepEqual(validatePhysical(JSON.parse(JSON.stringify(p))),p);const old=structuredClone(p);old.items[0].place='fridge';assert.throws(()=>validatePhysical(old));
});
test('malformed physical saves cannot duplicate held originals, overfill drawers, or invent food',()=>{
 const p=freshPhysical();assert.throws(()=>validatePhysical({...p,held:{kind:'file',id:0}}));assert.throws(()=>validatePhysical({...p,files:{0:'held',1:'held'},held:{kind:'file',id:0}}));assert.throws(()=>validatePhysical({...p,items:[...p.items,p.items[0]]}));assert.throws(()=>validatePhysical({...p,files:{152616:'personal:0'}}));assert.throws(()=>validatePhysical({...p,files:{0:'archive:999:0'}}));assert.throws(()=>validatePhysical({...p,files:{'00':'personal:0'}}));assert.throws(()=>validatePhysical({...p,files:{0:'archive:00:0'}}));
 const full=freshPhysical();for(let id=16;id<21;id++)full.files[id]='archive:0:0';assert.throws(()=>validatePhysical(full));
});
test('opening the matching page wins immediately once, ordinary pages and assignment UI do not trigger it',()=>{
 const s=freshSave();assert.equal(readPage(s,'An ordinary memo.'),false);assert.equal(s.completed,false);assert.equal(readPage(s,'The retained assessment says '+PHRASE+'.'),true);assert.equal(s.completed,true);assert.equal(readPage(s,PHRASE),false);assert.equal(s.credits,12);assert.equal(s.selectedFile,null);
});
test('warehouse transforms round-trip every wing without overlapping rooms',()=>{
 for(let wing=0;wing<4;wing++)for(const [x,z]of [[0,3],[-17.8,-45],[17.8,-3]]){const w=toWorld(wing,x,z),l=toRoom(wing,w.x,w.z);assert.ok(Math.abs(l.x-x)<1e-10);assert.ok(Math.abs(l.z-z)<1e-10);assert.equal(zoneAt(w.x,w.z).wing,wing);assert.equal(zoneAt(w.x,w.z).zone,'archive');}assert.equal(zoneAt(0,0).zone,'archive');
});

test('fast filing counts match actual originals and copies through moves and returns',()=>{
 const p=freshPhysical();const locations=['archive:0:0','archive:0:1','personal:0','desk-tray',containerFor(1096)] as const;
 assert.equal(takeFile(p,0,'archive:0:0'),null);assert.equal(placeFile(p,'personal:0'),null);
 assert.equal(takeFile(p,16,'archive:0:1'),null);assert.equal(placeFile(p,'archive:0:0'),null);
 p.copies=[{id:'a',file:0,place:'archive:0:0'},{id:'b',file:16,place:'personal:0'},{id:'c',file:0,place:'inventory'}];
 for(const c of locations){assert.equal(containerOriginalCount(p,c),containerFiles(p,c).length);assert.equal(containerLoad(p,c),containerFiles(p,c).length+p.copies.filter(x=>x.place===c).length);}
 assert.equal(takeFile(p,0,'personal:0'),null);assert.equal(placeFile(p,homeContainer(0)),null);
 for(const c of locations)assert.equal(containerOriginalCount(p,c),containerFiles(p,c).length);
});
