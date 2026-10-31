import {STORAGE,containerFor,initialFiles} from '../src/storage';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createArchive, searchableText, getHint } from '../src/content/generator';
import { SCENARIOS, GOSSIP_FRAGMENTS } from '../src/content/scenarios';
import { OFFICE_BODIES } from '../src/content/ordinary';
import { SHORT_STORIES, LONG_STORIES, ALL_STORIES } from '../src/content/expanded-stories';
import { SOURCE_MANIFEST, installSource } from '../src/content/sources';
import { TOTAL, WINGS, FILES, DRAWERS, CABINETS, CABINETS_PER_WING, FILES_PER_CABINET, fileId, fromLegacyId, toLegacyId, location, PHRASE } from '../src/archive';
import { freshSave, inspect, migrateLegacy, validateSave, loadSave, persist, SAVE_KEY, LEGACY_BACKUP_KEY, collectVoucher, redeemVouchers, pendingVoucherValue, setMarker, ProgressIndex } from '../src/state';
import { createArchive as createOldArchive } from '../src/legacy/generator';
import { freshSave as oldSave } from '../src/legacy/state';
import type { Save as LegacySave } from '../src/legacy/types';
for(const s of SOURCE_MANIFEST)installSource(JSON.parse(readFileSync('public/'+s.file,'utf8')));
test('layout helpers cover every file, cabinet, drawer, and wing without overlap',()=>{
 assert.equal(TOTAL,152616);assert.equal(CABINETS,512);assert.equal(DRAWERS,8);assert.equal(FILES,16);
 for(let id=0;id<TOTAL;id++){const l=location(id);assert.equal(fileId(l.cabinet,l.drawer,l.file),id);assert.ok(l.wing<WINGS.length);assert.ok(l.localCabinet<(l.kind==='box'?389:l.kind==='wall'?18:CABINETS_PER_WING));}
 for(let id=0;id<4096;id++)assert.equal(toLegacyId(fromLegacyId(id)),id);
});
test('source packs match hashes, attribution manifest, and valid paragraphs',()=>{
 assert.ok(SOURCE_MANIFEST.length>=6);let words=0;
 for(const s of SOURCE_MANIFEST){const bytes=readFileSync('public/'+s.file);assert.equal(createHash('sha256').update(bytes).digest('hex'),s.sha256);const pack=JSON.parse(bytes.toString());assert.equal(pack.id,s.id);assert.equal(pack.excerpts.length,s.excerpts);assert.ok(s.license&&s.licenseUrl&&s.url&&s.author&&s.edition&&s.notice);for(const e of pack.excerpts){assert.ok(e.section.length&&e.text.split(/\s+/).length>=35);assert.ok(!e.text.includes('START OF THE PROJECT GUTENBERG'));}words+=s.words;}
 assert.ok(words>500000);assert.match(readFileSync('public/content/python-license.txt','utf8'),/PSF.*LICENSE|PSF hereby/);
});
test('content counts and short chain locality meet the expansion contract',()=>{
 assert.ok(SCENARIOS.length>=96);assert.ok(GOSSIP_FRAGMENTS.length>=480);assert.equal(new Set(GOSSIP_FRAGMENTS).size,GOSSIP_FRAGMENTS.length);assert.equal(SHORT_STORIES.length,32);assert.equal(LONG_STORIES.length,12);assert.equal(ALL_STORIES.length,53);for(const kind of ['ticket','proposal','training','transcript','visitor','maintenance','resignation','survey','complaint','research'])assert.ok(OFFICE_BODIES.some(b=>b.kind===kind));
 const a=createArchive(7391);for(const story of SHORT_STORIES){const ids=a.storyLocations.get(story.id)!;assert.equal(Math.floor(ids[0]/FILES),Math.floor(ids.at(-1)!/FILES));assert.ok(ids.length>=2&&ids.length<=4);}
});
test('category balance, per-drawer discovery spacing, and local repetition for several seeds',()=>{
 for(const seed of [1,7391,9041]){const a=createArchive(seed);const counts={reference:0,office:0,social:0,evidence:0};const last=new Map<string,number>();let vouchers=0;
  for(const u of STORAGE)for(let drawer=0;drawer<u.drawers;drawer++){const ids=initialFiles(containerFor(u.id,drawer));let social=0;
   for(const id of ids){const d=a.get(id);counts[d.category??'office']++;if(d.category==='social'||d.story||d.annotation||d.category==='evidence')social++;if(d.voucher)vouchers++;
    if(d.bodyKey){const prev=last.get(d.bodyKey);if(prev!==undefined)assert.ok(id-prev>=128,`${d.bodyKey} repeated within 128 files`);last.set(d.bodyKey,id);}
   }
   assert.ok(social>0,`Dry storage ${u.label}/${drawer}`);
  }
  assert.ok(counts.reference/TOTAL>0.48&&counts.reference/TOTAL<0.51);assert.ok(counts.social/TOTAL>0.17&&counts.social/TOTAL<0.2);assert.ok(vouchers/TOTAL>.037&&vouchers/TOTAL<.046);
 }
});
test('inspection pays no ordinary-file income; vouchers require explicit one-time collection and desk redemption',()=>{
 const s=freshSave(),a=createArchive(s.seed,undefined,s.earlyVouchers);let id=0;while(a.get(id).fragment||a.get(id).story||a.get(id).source)id++;
 const initial=s.credits;for(let i=0;i<20;i++){let n=id+i;while(a.get(n).fragment||a.get(n).story)n++;inspect(s,a,n);}assert.equal(s.credits,initial);
 for(const early of s.earlyVouchers){assert.ok(a.get(early).voucher);assert.match(collectVoucher(s,a,early),/Open the file/);inspect(s,a,early);const before=s.credits;collectVoucher(s,a,early);assert.equal(s.credits,before);assert.match(collectVoucher(s,a,early),/already collected/);}
 const value=pendingVoucherValue(s,a),before=s.credits;assert.ok(value>=2);assert.equal(redeemVouchers(s,a),value);assert.equal(s.credits,before+value);assert.equal(redeemVouchers(s,a),0);assert.deepEqual(validateSave(s),s);
});
test('old active and completed shifts preserve target, evidence, money, equipment, text, and original placement',()=>{
 for(const name of ['active','completed']){
  const input=JSON.parse(readFileSync(`tests/fixtures/legacy-${name}.json`,'utf8'))as LegacySave,old=createOldArchive(input.seed),s=migrateLegacy(input),a=createArchive(s.seed,s.legacy,s.earlyVouchers);
  assert.equal(s.version,3);assert.equal(s.credits,input.credits);assert.equal(s.completed,input.completed);assert.deepEqual(s.upgrades,input.upgrades);assert.deepEqual(s.position,input.position);assert.equal(s.target,fromLegacyId(input.target));assert.equal(s.selectedFile,fromLegacyId(input.selectedFile!));
  assert.deepEqual(s.searched,input.searched.map(fromLegacyId));assert.deepEqual(s.bookmarks,input.bookmarks.map(fromLegacyId));assert.deepEqual(s.clues,input.clues.map(fromLegacyId));
  for(const id of input.inspected){const d=old.get(id),converted=a.get(fromLegacyId(id));assert.equal(converted.title,d.title);assert.deepEqual(converted.pages,d.pages.map(p=>p.replace(/\b([A-H])(\d{2}) \/ ([1-4])\.([1-8])\b/g,'W1–$1$2 / $3.$4')));}
  for(const [key,ids]of old.storyLocations)assert.deepEqual(a.storyLocations.get(key),ids.map(fromLegacyId));
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),s);for(const id of s.earlyVouchers){assert.ok(!s.inspected.includes(id));assert.ok(a.get(id).voucher);}
  let matches=0;for(let id=0;id<TOTAL;id++)matches+=(searchableText(a.get(id)).match(new RegExp(PHRASE,'gi'))??[]).length;assert.equal(matches,1);assert.ok(getHint(a,1).includes('wing 1'));
 }
});
test('v1 raw backup stays untouched and migration runs once; failures retain recoverable data',()=>{
 const raw=readFileSync('tests/fixtures/legacy-active.json','utf8'),values=new Map<string,string>([['archive-office-save-v1',raw]]),storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);}};
 const first=loadSave(storage);assert.ok(first.notice);assert.equal(values.get(LEGACY_BACKUP_KEY),raw);assert.equal(values.get('archive-office-save-v1'),raw);assert.ok(values.has(SAVE_KEY));const second=loadSave(storage);assert.equal(second.notice,undefined);assert.deepEqual(second.save,first.save);
 const broken={getItem:storage.getItem,setItem(){throw new Error('quota');}};values.delete(SAVE_KEY);const failed=loadSave(broken);assert.ok(failed.error);assert.equal(failed.save.credits,173);assert.equal(values.get('archive-office-save-v1'),raw);
 assert.equal(persist(first.save,{setItem(){throw new Error('quota');}})?.includes('Export'),true);
});
test('migration works when every old file was already inspected',()=>{
 const old=oldSave(11);old.started=true;old.inspected=Array.from({length:4096},(_,id)=>id);old.searched=[...old.inspected];const s=migrateLegacy(old),a=createArchive(s.seed,s.legacy,s.earlyVouchers);assert.ok(s.earlyVouchers.every(id=>!s.inspected.includes(id)&&!!a.get(id).voucher));assert.equal(s.inspected.length,4096);assert.deepEqual(validateSave(s),s);
});
test('markers and incremental progress remain bounded and reject invalid records',()=>{
 const s=freshSave();assert.throws(()=>setMarker(s,{cabinet:0,color:'gold',label:'Here'}));s.upgrades.push('tabs');for(let i=0;i<64;i++)setMarker(s,{cabinet:i,color:'gold',label:'Read next'});assert.throws(()=>setMarker(s,{cabinet:64,color:'blue',label:'Too many'}));setMarker(s,{cabinet:0,color:'rose',label:'Updated'});assert.equal(s.markers.length,64);assert.equal(s.markers[0].label,'Updated');assert.throws(()=>setMarker(s,{cabinet:9999,color:'gold',label:'No'}));
 const idx=new ProgressIndex();idx.rebuild(s);s.inspected.push(40000);s.searched.push(40000);idx.sync(s);assert.equal(idx.counts[Math.floor(40000/FILES_PER_CABINET)],1);idx.sync(s);assert.equal(idx.counts[Math.floor(40000/FILES_PER_CABINET)],1);assert.equal(idx.inspected.has(40000),true);assert.deepEqual(validateSave(s),s);
 for(const patch of [{wing:4},{contentVersion:4},{collectedVouchers:[1]},{redeemedVouchers:[2]},{earlyVouchers:[1]},{markers:[{cabinet:9999,color:'gold',label:'x'}]}])assert.throws(()=>validateSave({...s,...patch}));
});
