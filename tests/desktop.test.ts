import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { freshSave, validateSave, loadSave, SAVE_KEY } from '../src/state';
import { createArchive } from '../src/content/generator';
import { CASES } from '../src/desk/content';
import { conversationNode } from '../src/desk/conversations';
import { defaultDraft, deskFor, sendMail, openMail, updateCorrespondence, DESKTOP_BACKUP_KEY } from '../src/desk/state';
import { DIGITAL_FILES, digitalLock } from '../src/desk/digital-files';
import { SnakeGame } from '../src/desk/snake';
import { FAN_YAW, EQUIPMENT } from '../src/appliances';
import { DESK_CHAIR } from '../src/hub-layout';

test('every case supports three distinct replies, evidence gates, resolution and retained history',()=>{
 for(const c of CASES){
  const s=freshSave(),a=createArchive(s.seed),draft={...defaultDraft(),recipient:c.contact,caseId:c.id};
  let node=conversationNode(s,a,draft);assert.equal(node.options.length,3);assert.ok(node.options[1].locked);
  assert.throws(()=>sendMail(s,a,{...draft,choice:node.options[1].id}),/Uncover/);
  const replies=[];
  for(const option of [node.options[0],node.options[2]]){const copy=structuredClone(s);sendMail(copy,a,{...draft,choice:option.id});replies.push(deskFor(copy).mail[1].text);assert.equal(deskFor(copy).responses.length,1);assert.equal(sendMail(copy,a,{...draft,choice:option.id}).duplicate,true);}
  assert.notEqual(replies[0],replies[1]);
  const ids=a.storyLocations.get(c.id)!.slice(0,2);s.inspected.push(...ids);s.clues.push(...ids);node=conversationNode(s,a,draft);assert.equal(node.stage,'discussion');assert.equal(node.options[1].locked,undefined);
  assert.throws(()=>sendMail(s,a,{...draft,choice:node.options[1].id,attachments:[ids[0]]}),/Attach two/);
  sendMail(s,a,{...draft,choice:node.options[1].id,attachments:ids});assert.equal(deskFor(s).resolved.length,0);s.playSeconds+=100;openMail(s,2);assert.ok(deskFor(s).resolved.includes(c.id));assert.equal(conversationNode(s,a,draft).stage,'resolved');assert.deepEqual(validateSave(s),s);
 }
});
test('Martin only grants earned hints for evidence responses; follow-ups use active time and deduplicate',()=>{
 const s=freshSave(),a=createArchive(s.seed),draft={...defaultDraft(),recipient:'martin' as const,caseId:'martin',topic:'martin' as const};
 const initial=freshSave(),clarification=conversationNode(initial,a,draft).options[0];sendMail(initial,a,{...draft,choice:clarification.id});assert.match(deskFor(initial).mail[1].text,/Retain an original assessment/);assert.doesNotMatch(deskFor(initial).mail[1].text,/included the first filing reference/);
 const id=a.storyLocations.get('martin')![0];s.inspected.push(id);s.clues.push(id);
 let options=conversationNode(s,a,draft).options;sendMail(s,a,{...draft,choice:options[2].id});s.playSeconds+=100;openMail(s,2);assert.equal(s.hintLevel,0);
 options=conversationNode(s,a,draft).options;sendMail(s,a,{...draft,choice:options[1].id});s.playSeconds+=100;openMail(s,4);assert.equal(s.hintLevel,1);
 const t=freshSave();sendMail(t,a,defaultDraft());t.playSeconds=100;openMail(t,2);assert.equal(updateCorrespondence(t),false);t.playSeconds=400;assert.equal(updateCorrespondence(t),true);assert.equal(updateCorrespondence(t),false);assert.equal(deskFor(t).mail.length,3);
});
test('desktop migration backs up old data and rejects corrupt new fields',()=>{
 const old:any=freshSave();old.deskLife.version=1;delete old.deskLife.responses;delete old.deskLife.snakeBest;old.deskLife.drafts=[{...defaultDraft(),body:'Old personal draft',attachments:[4]}];
 const raw=JSON.stringify(old),store=new Map([[SAVE_KEY,raw]]);const loaded=loadSave({getItem:k=>store.get(k)??null,setItem:(k,v)=>{store.set(k,v);}});
 assert.equal(loaded.error,undefined);assert.equal(store.get(DESKTOP_BACKUP_KEY),raw);assert.equal(loaded.save.deskLife!.version,3);assert.equal(loaded.save.deskLife!.drafts[0].body,'Old personal draft');assert.equal(loaded.save.deskLife!.drafts[0].choice,undefined);
 const blocked=loadSave({getItem:k=>k===SAVE_KEY?raw:null,setItem:()=>{throw Error('full');}});assert.match(blocked.error!,/backup/);
 for(const bad of [-1,1,Infinity,3980]){const s=freshSave();s.deskLife!.snakeBest=bad;assert.throws(()=>validateSave(s));}
});
test('24 digital files cross-reference six cases without granting evidence',()=>{
 const s=freshSave(),a=createArchive(s.seed);assert.equal(DIGITAL_FILES.length,24);assert.equal(new Set(DIGITAL_FILES.map(f=>f.id)).size,24);
 for(const c of CASES){const files=DIGITAL_FILES.filter(f=>f.caseId===c.id);assert.equal(files.length,2);const restricted=files.find(f=>f.restricted)!;assert.ok(digitalLock(restricted,s,a));s.inspected.push(a.storyLocations.get(c.id)![0]);assert.equal(digitalLock(restricted,s,a),undefined);}
 assert.equal(s.clues.length,0);assert.equal(s.completed,false);
});
test('Snake rejects reversal and double turns, grows and ends on collisions',()=>{
 const g=new SnakeGame();g.turn(-1,0);g.step();assert.deepEqual(g.body[0],[6,10]);g.food=[7,10];g.step(()=>0);assert.equal(g.score,10);assert.equal(g.body.length,4);g.turn(0,-1);g.turn(-1,0);g.step();assert.deepEqual(g.body[0],[7,9]);for(let i=0;i<15;i++)g.step();assert.equal(g.ended,true);
});
test('fan grille faces the shared desk chair position',()=>{
 const forward=new THREE.Vector3(0,0,1).applyAxisAngle(new THREE.Vector3(0,1,0),FAN_YAW),toward=new THREE.Vector3(DESK_CHAIR.x-EQUIPMENT.fan.x,0,DESK_CHAIR.z-EQUIPMENT.fan.z).normalize();assert.ok(forward.dot(toward)>.9999);
});
