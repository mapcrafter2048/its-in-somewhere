import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshSave,validateSave,loadSave,SAVE_KEY,buy,inspect} from '../src/state';
import {createArchive} from '../src/content/generator';
import {artifactPlacements,collectArtifact,identifyArtifact,createNote,deleteNote,deskFor,defaultDraft,sendMail,deliveredMail,openMail,DESK_BACKUP_KEY} from '../src/desk/state';
import {ARTIFACTS,CASES} from '../src/desk/content';
import {parseContainer,STORAGE} from '../src/storage';
import {containerFiles,physicalFor,placeFile,takeFile} from '../src/physical';
import {ShiftSession} from '../src/runtime/shift-session';

test('24 stable artifacts occupy distinct drawers, six per wing, without changing original placement',()=>{
 for(const seed of [0,1,7391,9041,4294967295]){
  const p=artifactPlacements(seed);assert.equal(p.size,24);assert.equal(new Set(p.values()).size,24);assert.deepEqual(artifactPlacements(seed),p);
  const counts=[0,0,0,0];for(const c of p.keys()){const u=STORAGE[parseContainer(c)!.unit];assert.notEqual(u.kind,'box');counts[u.wing]++;}assert.deepEqual(counts,[6,6,6,6]);
 }
 assert.notDeepEqual(artifactPlacements(1),artifactPlacements(2));
 const s=freshSave(),a=createArchive(s.seed),before=JSON.stringify(a.get(s.target));const p=artifactPlacements(s.seed),first=p.keys().next().value!;
 const physical=physicalFor(s),ids=containerFiles(physical,first);
 assert.equal(takeFile(physical,ids[0],first),null);assert.equal(placeFile(physical,'personal:0'),null);
 assert.ok(collectArtifact(s,first));assert.equal(collectArtifact(s,first),null);assert.equal(JSON.stringify(a.get(s.target)),before);assert.equal(containerFiles(physical,first).length,15);
});
test('collection identification is optional and milestones and stamps cannot mint progression',()=>{
 const s=freshSave();s.credits=100;const p=artifactPlacements(s.seed),before={clues:[...s.clues],searched:[...s.searched],completed:s.completed};
 assert.equal(identifyArtifact(s,ARTIFACTS[0].id),true);assert.equal(s.credits,96);assert.equal(identifyArtifact(s,ARTIFACTS[0].id),false);
 for(const c of p.keys())collectArtifact(s,c,p);assert.equal(deskFor(s).collected.length,24);assert.deepEqual(deskFor(s).rewards,[4,8,12,16,20,24]);assert.deepEqual({clues:s.clues,searched:s.searched,completed:s.completed},before);assert.deepEqual(validateSave(s),s);
});
test('notebook capacities, sketches, links and upgrades survive import and recycled sheets free space',()=>{
 const s=freshSave(),d=deskFor(s);for(let i=0;i<12;i++)assert.ok(createNote(s));assert.equal(createNote(s),null);s.credits=100;buy(s,'stationery');buy(s,'pinboard');
 const n=createNote(s)!;n.text='<script>personal theory</script>';n.paper='rose';n.strokes=[{tool:'marker',color:'green',width:.004,points:[[0,0],[1,1]]}];n.excerpt={file:4,label:'Visible page',text:'Already read'};d.pins=[{note:n.id,x:.3,y:.6},{note:1,x:1,y:0}];d.strings=[{from:n.id,to:1,color:'red',label:'Suspicious?'}];d.drafts=[{...defaultDraft(),body:'A retained draft'}];assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),s);
 deleteNote(s,n.id);assert.equal(d.pins.length,1);assert.equal(d.strings.length,0);assert.ok(createNote(s));
 for(const mutate of [(x:typeof s)=>x.deskLife!.notes[0].strokes=[{tool:'marker',color:'black',width:.004,points:[[2,0]]}],(x:typeof s)=>x.deskLife!.pins.push({note:9999,x:0,y:0}),(x:typeof s)=>x.deskLife!.strings.push({from:1,to:1,color:'red',label:'bad'}),(x:typeof s)=>x.deskLife!.nextNote=1]){const copy=structuredClone(s);mutate(copy);assert.throws(()=>validateSave(copy),/desk data/);}
});
test('email cases use only uncovered evidence, delays are shift time, and repeated mail is idempotent',()=>{
 const s=freshSave(),a=createArchive(s.seed),d=deskFor(s);const draft=defaultDraft();sendMail(s,a,draft);assert.equal(deliveredMail(s).length,0);assert.equal(sendMail(s,a,draft).duplicate,true);assert.equal(d.counters.mailSent,1);
 const pending=d.mail.find(m=>m.direction==='in')!;assert.ok(pending.due>=30&&pending.due<=90);
 const clock=new ShiftSession(0);s.playSeconds+=clock.advance(100000,'pause',true,true,false);assert.equal(deliveredMail(s).length,0);s.playSeconds+=clock.advance(200000,'computer',true,true,false);assert.equal(deliveredMail(s).length,1);
 assert.deepEqual(validateSave(s),s);openMail(s,pending.id);assert.equal(pending.read,true);
 const ids=a.storyLocations.get('fridge')!;for(const id of ids.slice(0,2))inspect(s,a,id);
 const evidence={...draft,topic:'evidence' as const,attachments:ids.slice(0,2)};sendMail(s,a,evidence);s.playSeconds+=100;const rejected=deliveredMail(s).at(-1)!;assert.equal(rejected.resolves,undefined);
 inspect(s,a,ids[1],true);sendMail(s,a,evidence);s.playSeconds+=100;const accepted=deliveredMail(s).at(-1)!;assert.equal(accepted.resolves,'fridge');openMail(s,accepted.id);openMail(s,accepted.id);assert.deepEqual(d.resolved,['fridge']);assert.equal(sendMail(s,a,evidence).duplicate,true);
 assert.throws(()=>sendMail(s,a,{...draft,attachments:[10000]}),/previously opened/);
});
test('all six cases resolve from existing discoveries and every lead is free and exact on request',()=>{
 const s=freshSave(),a=createArchive(s.seed);s.credits=0;
 for(const c of CASES){const ids=a.storyLocations.get(c.id)!;ids.slice(0,2).forEach(id=>inspect(s,a,id,true));sendMail(s,a,{...defaultDraft(),recipient:c.contact,caseId:c.id,topic:'evidence',attachments:ids.slice(0,2)});}
 const balance=s.credits;
 for(const artifact of ARTIFACTS){const c=CASES.find(c=>c.id===artifact.caseId)!;for(const topic of ['lead','location'] as const)sendMail(s,a,{...defaultDraft(),recipient:c.contact,caseId:c.id,topic,artifact:artifact.id});}
 assert.equal(s.credits,balance);s.playSeconds+=100;for(const m of deliveredMail(s))openMail(s,m.id);assert.equal(deskFor(s).resolved.length,6);assert.equal(deskFor(s).identified.length,0);assert.equal(deliveredMail(s).filter(m=>m.topic==='location'&&/drawer \d/.test(m.text)).length,24);
 assert.deepEqual(validateSave(s),s);
});
test('Martin hints are granted on opening mail and migrated exchanges remain already read',()=>{
 const s=freshSave(),a=createArchive(s.seed),ids=a.storyLocations.get('martin')!;inspect(s,a,ids[0]);sendMail(s,a,{...defaultDraft(),recipient:'martin',caseId:'martin',topic:'martin'});assert.equal(s.hintLevel,0);s.playSeconds=100;const reply=deliveredMail(s)[0];assert.equal(s.hintLevel,0);openMail(s,reply.id);assert.equal(s.hintLevel,1);assert.deepEqual(s.messages,['1']);
 const old=structuredClone(s);delete old.deskLife;old.messages=['1','2'];old.hintLevel=2;const migrated=validateSave(old);assert.equal(migrated.hintLevel,2);assert.equal(deliveredMail(migrated).length,2);assert.ok(deliveredMail(migrated).every(m=>m.read));assert.deepEqual(validateSave(migrated),migrated);
});
test('desk migration backs up raw saves once and refuses to overwrite after backup failure',()=>{
 const old=freshSave();delete old.deskLife;old.playSeconds=1234;const raw=JSON.stringify(old),values=new Map([[SAVE_KEY,raw]]),storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);}};
 const loaded=loadSave(storage);assert.equal(values.get(DESK_BACKUP_KEY),raw);assert.equal(loaded.save.deskLife!.counters.issuedAt,1234);assert.ok(loaded.notice);assert.equal(loadSave(storage).notice,undefined);
 const failed=loadSave({getItem:k=>k===SAVE_KEY?raw:null,setItem:()=>{throw Error('quota');}});assert.match(failed.error!,/backup/);assert.equal(failed.save.playSeconds,1234);
});
