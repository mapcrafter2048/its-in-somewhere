import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {STORAGE,containerFor,parseContainer,initialFiles} from '../src/storage';
import {TOTAL,BASE_TOTAL,fileId,location,reference,PHRASE,STORAGE_UNITS} from '../src/archive';
import {createArchive,getHint} from '../src/content/generator';
import {createArchive as createV2} from '../src/content/generator-v2';
import {freshSave,loadSave,validateSave,SAVE_KEY,PREVIOUS_SAVE_KEY,EXPANSION_BACKUP_KEY,ProgressIndex,setMarker} from '../src/state';
import {freshPhysical,containerFiles,validatePhysical,takeFile,placeFile,homeContainer,capacity} from '../src/physical';
import {paginatePages,readableDocument} from '../src/pagination';
import {SOURCE_MANIFEST,installSource} from '../src/content/sources';
for(const source of SOURCE_MANIFEST)installSource(JSON.parse(readFileSync('public/'+source.file,'utf8')));
test('every added original has one stable storage address and the initial inventory totals 152616',()=>{
 assert.equal(STORAGE_UNITS,2637);assert.equal(STORAGE.filter(u=>u.kind==='rear').length,512);assert.equal(STORAGE.filter(u=>u.kind==='wall').length,72);assert.equal(STORAGE.filter(u=>u.kind==='box').length,1541);
 const seen=new Uint8Array(TOTAL);for(const u of STORAGE)for(let d=0;d<u.drawers;d++){const c=containerFor(u.id,d);assert.deepEqual(parseContainer(c),{unit:u.id,drawer:d});for(const id of initialFiles(c)){assert.equal(seen[id]++,0);assert.equal(homeContainer(id),c);assert.equal(fileId(location(id).cabinet,location(id).drawer,location(id).file),id);}}
 assert.ok(seen.every(n=>n===1));assert.equal(reference(0),'W1–A01 / 1.1');assert.equal(reference(BASE_TOTAL),'W1–A01R / 1.1');assert.equal(reference(131072),'W1–WC01 / 1.1');assert.equal(reference(140288),'W1–BX001 / 1');
 for(const bad of ['rear:512:0','wall:4:0:0','wall:0:18:0','box:0:384','box:3:389','box:00:1','rear:0:8'])assert.equal(parseContainer(bad),null);
});
test('new drawer banks and boxes move originals without duplication and enforce their different capacities',()=>{
 const p=freshPhysical();const source='rear:0:0',box='box:0:0';assert.equal(containerFiles(p,source).length,16);assert.equal(capacity(box),10);
 for(let i=0;i<2;i++){assert.equal(takeFile(p,BASE_TOTAL+i,source),null);assert.equal(placeFile(p,box),null);}takeFile(p,BASE_TOTAL+2,source);assert.match(placeFile(p,box)!,/full/);assert.equal(p.held?.id,BASE_TOTAL+2);assert.equal(placeFile(p,'wall:0:0:0'),null);assert.deepEqual(validatePhysical(p),p);assert.equal(containerFiles(p,box).length,10);
});
test('version-2 saves retain original generation, target, text, and moved originals while new shifts can target every storage kind',()=>{
 const oldArchive=createV2(7391),old=freshSave(7391);delete old.recordPack;old.version=2;old.contentVersion=2;old.environmentVersion=1;delete old.placementVersion;old.target=oldArchive.target;old.earlyVouchers=oldArchive.earlyVouchers;old.started=true;old.inspected=[0,1,old.target];old.searched=[0];old.credits=173;old.physical!.files['0']='personal:0';old.physical!.files['1']='held';old.physical!.held={kind:'file',id:1};old.office!.printedFile=old.target;
 const raw=JSON.stringify(old),entries=new Map([[PREVIOUS_SAVE_KEY,raw]]),storage={getItem:(k:string)=>entries.get(k)??null,setItem:(k:string,v:string)=>{entries.set(k,v);}};
 const result=loadSave(storage);assert.equal(result.error,undefined);const save=result.save;assert.equal(save.version,3);assert.equal(save.placementVersion,2);assert.equal(save.target,old.target);assert.equal(save.credits,173);assert.deepEqual(save.inspected,old.inspected);assert.deepEqual({...save.physical,copies:[]},old.physical);assert.deepEqual(save.physical!.copies,[{id:'legacy-output',file:old.target,place:'printer-output'}]);assert.equal(save.office!.printedFile,old.target);assert.equal(entries.get(PREVIOUS_SAVE_KEY),raw);assert.equal(entries.get(EXPANSION_BACKUP_KEY),raw);assert.ok(entries.has(SAVE_KEY));
 const migrated=createArchive(save.seed,save.legacy,save.earlyVouchers,save.placementVersion);for(let id=0;id<BASE_TOTAL;id++)assert.deepEqual(migrated.get(id),oldArchive.get(id));assert.deepEqual(validateSave(save),save);assert.deepEqual(loadSave(storage).save,save);
 const kinds=new Set<string>();for(let seed=0;seed<500;seed++){const a=createArchive(seed),l=location(a.target);kinds.add(l.kind);const hint=getHint(a,3);assert.match(hint,new RegExp(`wing ${l.wing+1}`,'i'));if(l.kind!=='front'){assert.ok(hint.includes(l.kind==='box'?'file boxes':l.kind==='wall'?'wall cabinets':'rear drawers'));const start=Math.floor(l.column/4)*4+1;assert.ok(l.column+1>=start&&l.column+1<=start+3);assert.ok(hint.includes(`${String(start).padStart(2,'0')}–${String(start+3).padStart(2,'0')}`));}}assert.deepEqual([...kinds].sort(),['box','front','rear','wall']);
});
test('pagination preserves wording, authored boundaries, spreadsheets, and an intact target phrase at every boundary',()=>{
 for(let offset=85;offset<125;offset++){const text='Start. '+('word '.repeat(offset))+PHRASE+'. '+('continued '.repeat(170));const pages=paginatePages([text]);assert.equal(pages.join(''),text);assert.equal(pages.filter(p=>p.includes(PHRASE)).length,1);assert.ok(pages.every(p=>p.trim().split(/\s+/).length<=120));}
 assert.deepEqual(paginatePages(['A short note.','Second enclosure.']),['A short note.','Second enclosure.']);const doc=createArchive(7391).get(65550),view=readableDocument(doc);assert.equal(view.pages.join(''),doc.pages.join(''));assert.equal(view.sheets,doc.sheets);
 const a=createArchive(7391);let checked=0;for(let id=BASE_TOTAL;id<BASE_TOTAL+500;id++){const d=a.get(id);if(d.category==='office'){const p=readableDocument(d);assert.ok(p.pages.length>=2&&p.pages.length<=4);assert.equal(p.pages.join(''),d.pages.join(''));checked++;}}assert.ok(checked>100);
});
test('searched counts and coloured tabs address rear banks, walls and boxes independently',()=>{
 const s=freshSave();s.upgrades.push('tabs');const ids=[0,65536,131072,140288,152615];s.inspected=[...ids];s.searched=[...ids];const p=new ProgressIndex();p.rebuild(s);for(const id of ids){const unit=location(id).cabinet;assert.equal(p.counts[unit],1);setMarker(s,{cabinet:unit,color:'rose',label:reference(id)});}assert.equal(s.markers.length,5);assert.deepEqual(validateSave(s),s);
});
test('open drawer geometry leaves at least 0.6 units beside rack edges and wall cabinets',async()=>{
 const THREE=await import('three'),{makeModel}=await import('../src/prop-models');const double=new THREE.Box3().setFromObject(makeModel('double-cabinet',true)),wall=new THREE.Box3().setFromObject(makeModel('wall-cabinet',true)),closed=new THREE.Box3().setFromObject(makeModel('cabinet'));
 assert.ok(3-.325-double.max.z>=.6);assert.ok(21.2-wall.max.z-(17.8+closed.max.x)>=.6);
});
