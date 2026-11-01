import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createArchive, searchableText } from '../src/content/generator';
import { RECORD_VARIANTS, THREADS, threadEvidence } from '../src/content/packs/records';
import { TOTAL, PHRASE, location } from '../src/archive';
import { freshSave, inspect, validateSave, loadSave, SAVE_KEY, readPage } from '../src/state';
import { catalogueEntries, searchCatalogue, unlockDigital, EXPLORATION_FILES } from '../src/desk/exploration';
import { digitalFiles, digitalLock } from '../src/desk/digital-files';
import { deskFor, defaultDraft, sendMail, openMail } from '../src/desk/state';
import { conversationNode } from '../src/desk/conversations';
import { recordFormat } from '../src/ui/record-format';
import { readableDocument } from '../src/pagination';

const expanded=(seed=7391)=>createArchive(seed,undefined,undefined,3,1);
test('record pack preserves every protected record and has one target across validation seeds',()=>{
 assert.equal(RECORD_VARIANTS.length,48);assert.equal(new Set(RECORD_VARIANTS.map(v=>v.family)).size,12);
 for(const seed of [7391,1,9041]){
  const base=createArchive(seed),a=expanded(seed),b=expanded(seed),formats=new Set<string>();let targets=0;
  assert.equal(a.target,base.target);assert.equal(a.threadLocations!.size,3);
  const ids=[...a.threadLocations!.values()].flat();assert.equal(new Set(ids).size,18);
  for(const t of THREADS){const records=a.threadLocations!.get(t.id)!;assert.equal(records.length,6);assert.equal(location(records[0]).kind,'front');assert.equal(location(records[0]).department,0);for(const id of records){const d=a.get(id);assert.equal(d.thread,t.id);assert.ok(records.includes(d.next!));assert.ok(records.includes(d.previous!));assert.deepEqual(d,b.get(id));}}
  for(let id=0;id<TOTAL;id++){
   const before=base.get(id),after=a.get(id);targets+=(searchableText(after).match(new RegExp(PHRASE,'gi'))??[]).length;
   if(before.story||before.voucher||before.source||before.fragment||base.special.has(id)||before.category!=='office')assert.deepEqual(after,before);
   if(after.presentation)formats.add(after.presentation.family);
  }
  assert.equal(targets,1);assert.equal(formats.size,12);
 }
});
test('old and expanded backups retain their content pack, file history and password state',()=>{
 const old=freshSave();delete old.recordPack;old.inspected=[0,6];old.searched=[6];old.credits=82;const raw=JSON.stringify(old);
 const store=new Map([[SAVE_KEY,raw]]);const loaded=loadSave({getItem:k=>store.get(k)??null,setItem:(k,v)=>{store.set(k,v);}});
 assert.equal(loaded.error,undefined);assert.deepEqual(loaded.save,old);assert.equal(store.get(SAVE_KEY),raw);assert.equal(loaded.save.recordPack,undefined);
 const a=expanded(),s=freshSave();const file=EXPLORATION_FILES.find(f=>f.password)!;assert.ok(unlockDigital(s,file,file.password!));
 for(const id of a.threadLocations!.get('duplicate')!)inspect(s,a,id);
 const restored=validateSave(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored,s);assert.deepEqual(expanded(restored.seed).get(restored.clues[0]),a.get(s.clues[0]));
 assert.throws(()=>validateSave({...s,recordPack:2}));assert.throws(()=>validateSave({...s,recordPack:1,placementVersion:2}));
 assert.throws(()=>validateSave({...s,deskLife:{...s.deskLife,unlockedFiles:['invented']}}));
 assert.throws(()=>validateSave({...old,deskLife:{...old.deskLife,unlockedFiles:[file.id]}}));
});
test('catalogue contains only pre-existing batch metadata and excludes the target batch',()=>{
 for(const seed of [7391,1,9041]){
  const a=expanded(seed),entries=catalogueEntries(a);assert.equal(entries.length,64);assert.equal(catalogueEntries(createArchive(seed)).length,58);
  assert.equal(new Set(entries.map(e=>e.id)).size,64);assert.deepEqual(entries,catalogueEntries(a));
  assert.equal(searchCatalogue(entries,'Mara retirement').length,2);assert.equal(searchCatalogue(entries,PHRASE).length,0);assert.equal(searchCatalogue(entries,'unfindableword').length,0);
  assert.ok(entries.every(e=>!e.range.startsWith(location(a.target).label+' /')&&!('body'in e)&&!('inspected'in e)&&!e.range.includes(a.get(a.target).title)));
 }
});
test('passwords are normalized, retryable and independent of reading flags; locks expose no evidence',()=>{
 const s=freshSave(),a=expanded();assert.equal(digitalFiles(s).length,48);const old=structuredClone(s);delete old.recordPack;assert.equal(digitalFiles(old).length,24);
 for(const t of THREADS){const file=digitalFiles(s).find(f=>f.id===t.passwordFile)!;assert.ok(digitalLock(file,s,a));assert.equal(unlockDigital(s,file,'incorrect'),false);assert.ok(digitalLock(file,s,a));assert.equal(unlockDigital(s,file,`  ${t.password.toUpperCase()}  `),true);assert.equal(digitalLock(file,s,a),undefined);assert.equal(unlockDigital(s,file,t.password),true);}
 assert.equal(deskFor(s).unlockedFiles!.length,3);assert.equal(s.inspected.length,0);assert.equal(s.clues.length,0);assert.equal(s.completed,false);assert.deepEqual(validateSave(s),s);
});
test('thread conclusions require the correct pair and mail; both recipients remain recoverable and idempotent',()=>{
 for(const t of THREADS)for(const recipient of t.contacts){
  const s=freshSave(),a=expanded(),ids=a.threadLocations!.get(t.id)!,credits=s.credits;
  for(const id of ids)inspect(s,a,id);assert.equal(s.credits,credits);assert.equal(deskFor(s).resolved.length,0);assert.equal(s.claimedStories.length,0);
  const draft={...defaultDraft(),recipient,caseId:t.id};let node=conversationNode(s,a,draft);
  const wrong={...draft,choice:node.options[1].id,attachments:[ids[2],ids[3]]};sendMail(s,a,wrong);s.playSeconds+=100;openMail(s,2);assert.equal(deskFor(s).resolved.length,0);assert.match(deskFor(s).mail[1].text,/Please attach/);
  node=conversationNode(s,a,draft);const correct={...draft,choice:node.options[1].id,attachments:threadEvidence(a,t.id)};
  sendMail(s,a,correct);assert.equal(sendMail(s,a,correct).duplicate,true);assert.equal(deskFor(s).resolved.length,0);
  assert.equal(openMail(s,4),null);s.playSeconds+=100;openMail(s,4);openMail(s,4);assert.deepEqual(deskFor(s).resolved,[t.id]);assert.equal(s.credits,credits);assert.equal(s.hintLevel,0);assert.deepEqual(validateSave(s),s);
 }
});
test('formats keep original text selectable, diagrams accessible and main completion independent',()=>{
 const a=expanded(),s=freshSave();let checked=0;
 for(let id=0;id<4000;id++){const d=a.get(id);if(!d.presentation)continue;const text=JSON.stringify(d);const html=recordFormat(d);assert.match(html,/record-format/);if(d.presentation.diagram)assert.match(html,/role="img"/);if(d.presentation.family==='chart')assert.match(html,/<table/);assert.equal(readableDocument(d).pages.join(''),d.pages.join(''));assert.equal(JSON.stringify(d),text);checked++;}
 assert.ok(checked>100);const malicious={...a.get(a.threadLocations!.get('friday')![1]),presentation:{family:'annotated' as const,register:'<img>',fields:[['<key>','<script>']] as [string,string][],annotation:'<script>alert(1)</script>'}};assert.doesNotMatch(recordFormat(malicious),/<script>|<img>/);
 assert.equal(readPage(s,a.get(a.target).pages[0]),true);assert.equal(s.clues.length,0);assert.equal(deskFor(s).resolved.length,0);
});
