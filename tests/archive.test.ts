import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createArchive, searchableText, getHint, JOKES } from '../src/content/generator';
import { ALL_STORIES as STORIES } from '../src/content/expanded-stories';
import { SOURCE_MANIFEST, installSource } from '../src/content/sources';
import { readFileSync } from 'node:fs';
for(const source of SOURCE_MANIFEST)installSource(JSON.parse(readFileSync('public/'+source.file,'utf8')));
import { PHRASE, TOTAL, DEPARTMENTS, location, cabinetPosition } from '../src/archive';
import { freshSave, inspect, buy, confront, canSubmit, validateSave, loadSave, persist, SAVE_KEY } from '../src/state';

test('all 152616 documents are deterministic and the target phrase appears exactly once',()=>{
 for(const seed of [7391,1,987654]){
  const a=createArchive(seed),b=createArchive(seed);assert.equal(a.target,b.target);let matches=0;
  for(let id=0;id<TOTAL;id++){const d=a.get(id);assert.deepEqual(d,b.get(id));assert.equal(d.id,id);assert.ok(d.pages.length);const text=searchableText(d);matches+=(text.match(new RegExp(PHRASE,'gi'))??[]).length;if(d.category!=='reference')assert.ok(!text.includes('undefined'));}
  assert.equal(matches,1);assert.ok(searchableText(a.get(a.target)).includes(PHRASE));
 }
});
test('stories have unique placements, valid references, spreadsheet clues, and endings',()=>{
 const a=createArchive(7391),used=new Set<number>();
 for(const story of STORIES){const ids=a.storyLocations.get(story.id)!;assert.equal(ids.length,story.chapters.length);assert.ok(ids.length>=2&&ids.length<=9);assert.ok(story.ending.length>20);
  ids.forEach((id,i)=>{assert.ok(!used.has(id));used.add(id);const d=a.get(id);assert.equal(d.story,story.id);assert.equal(d.chapter,i);assert.equal(d.next,ids[i+1]);if(d.sheets)assert.ok(d.sheets.some(s=>s.rows.some(r=>r.some(c=>c.clue))));});
 }
 assert.ok(!used.has(a.target));assert.ok(JOKES.length>=480);assert.equal(new Set(JOKES).size,JOKES.length);
});
test('index hints always describe the actual target',()=>{
 for(let seed=0;seed<50;seed++){const a=createArchive(seed),loc=location(a.target);assert.ok(getHint(a,1).includes(DEPARTMENTS[loc.department]));assert.ok(getHint(a,2).includes(new Date(loc.date+'T12:00:00').toLocaleDateString('en-GB',{month:'long',year:'numeric'})));const groupStart=Math.floor(loc.column/4)*4;assert.ok(loc.column>=groupStart&&loc.column<groupStart+4);assert.ok(getHint(a,3).includes(String(groupStart+1).padStart(2,'0')));}
});
test('every cabinet has an accessible front and stays inside the room',()=>{
 for(let c=0;c<512;c++){const p=cabinetPosition(c);assert.ok(Math.abs(p.x)<21);assert.ok(p.z>-49);assert.ok(p.z+2<15);if(c%16<15)assert.ok(cabinetPosition(c+1).x-p.x>1.84);}
});
test('inspection and discovery rewards are one-time; workbook evidence requires inspecting its cell',()=>{
 const a=createArchive(7391),s=freshSave();const ids=a.storyLocations.get('ghost')!,workbook=ids[2];
 inspect(s,a,workbook);assert.ok(s.inspected.includes(workbook));assert.ok(!s.clues.includes(workbook));
 inspect(s,a,workbook,true);assert.ok(s.clues.includes(workbook));const credits=s.credits;inspect(s,a,workbook,true);assert.equal(s.credits,credits);
 ids.forEach(id=>inspect(s,a,id,true));assert.ok(s.claimedStories.includes('ghost'));const total=s.credits;ids.forEach(id=>inspect(s,a,id,true));assert.equal(s.credits,total);
 const t=freshSave();for(let i=0;i<8;i++)inspect(t,a,100+i);const after=t.credits;for(let i=0;i<8;i++)inspect(t,a,100+i);assert.equal(t.credits,after);assert.deepEqual(t.claimedMilestones,[]);
});
test('purchases enforce credit and progress requirements and cannot be repeated',()=>{
 const s=freshSave();assert.match(buy(s,'drawers'),/Insufficient/);s.credits=200;assert.match(buy(s,'index'),/80/);assert.ok(!s.upgrades.includes('index'));
 assert.match(buy(s,'drawers'),/installed/);assert.equal(s.credits,182);buy(s,'drawers');assert.equal(s.credits,182);
 s.inspected=Array.from({length:80},(_,i)=>i);buy(s,'index');assert.equal(s.hintLevel,2);assert.ok(s.upgrades.includes('index'));
});
test('Martin gives progressive hints only for discovered original evidence',()=>{
 const a=createArchive(7391),s=freshSave();assert.match(confront(s,a),/need an original/);
 const ids=a.storyLocations.get('martin')!;for(let i=0;i<6;i++){inspect(s,a,ids[i],true);confront(s,a);}
 assert.equal(s.hintLevel,3);assert.deepEqual(s.messages,['1','2','3']);
});
test('submission is available without side quests or upgrades and checks selected text',()=>{
 const a=createArchive(7391),s=freshSave();assert.equal(canSubmit(s,a),false);s.selectedFile=a.target;assert.equal(canSubmit(s,a),true);s.selectedPhrase='incorrect';assert.equal(canSubmit(s,a),false);s.selectedPhrase=PHRASE;assert.equal(canSubmit(s,a),true);s.selectedFile=(a.target+1)%TOTAL;assert.equal(canSubmit(s,a),false);
});
test('save round trip preserves progress and rejects malformed input',()=>{
 const s=freshSave(123);s.started=true;s.inspected=[1,2,3];s.bookmarks=[2];s.settings.textSize=22;
 assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),s);
 for(const data of [null,{}, {...s,version:4},{...s,target:(s.target+1)%TOTAL},{...s,inspected:[-1]},{...s,inspected:[1,1]},{...s,credits:-1},{...s,position:[100,1.7,0]},{...s,settings:{...s.settings,quality:'ultra'}},{...s,rotation:[NaN,0]}])assert.throws(()=>validateSave(data));
});
test('storage errors return actionable feedback without crashing',()=>{
 const bad={getItem(){throw new Error('blocked');},setItem(){throw new Error('quota');}};
 assert.ok(loadSave(bad).error);assert.match(persist(freshSave(),bad)!,/Export a backup/);
 const map=new Map<string,string>();const storage={getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v);}};
 const s=freshSave();assert.equal(persist(s,storage),undefined);assert.deepEqual(loadSave(storage).save,s);map.set(SAVE_KEY,'broken');assert.ok(loadSave(storage).error);assert.equal(map.get(SAVE_KEY),'broken');
});
