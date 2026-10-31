// Frozen version-2 placement schedule. Keep its ID range and authored text stable.
import { DEPARTMENTS, BASE_TOTAL as TOTAL, PHRASE, FILES, FILES_PER_WING, location, random, reference, fileId, fromLegacyId, toLegacyId } from '../archive';
import type { ArchiveDocument, LegacyBindings } from '../types';
import { createArchive as legacyArchive } from '../legacy/generator';
import { ALL_STORIES, SHORT_STORIES } from './expanded-stories';
import { SCENARIOS, GOSSIP_FRAGMENTS } from './scenarios';
import { ordinaryDocument } from './ordinary';
import { sourceReference, sourceText } from './sources';
export { ALL_STORIES } from './expanded-stories';
export const JOKES=GOSSIP_FRAGMENTS;
export const TUTORIAL_ID=fileId(7);
export interface Archive {
 seed:number;target:number;storyLocations:Map<string,number[]>;special:Map<number,ArchiveDocument>;legacy?:LegacyBindings;
 earlyVouchers:number[];get(id:number):ArchiveDocument;
}
export function makeLegacyBindings(seed:number,inspected:number[]):LegacyBindings{
 const old=legacyArchive(seed);const fragments:number[]=[];for(let id=0;id<4096;id++)if(old.get(id).fragment)fragments.push(fromLegacyId(id));
 return {target:fromLegacyId(old.target),inspected:inspected.map(fromLegacyId),storyLocations:Object.fromEntries([...old.storyLocations].map(([key,ids])=>[key,ids.map(fromLegacyId)])),fragments};
}
function patchReferences(s:string){return s.replace(/\b([A-H])(\d{2}) \/ ([1-4])\.([1-8])\b/g,'W1–$1$2 / $3.$4');}
export function createArchive(seed:number,legacy?:LegacyBindings,earlyOverride?:number[]):Archive {
 const rng=random(seed^0xA43B2891),used=new Set<number>([TUTORIAL_ID]),special=new Map<number,ArchiveDocument>(),storyLocations=new Map<string,number[]>();
 if(legacy){used.add(legacy.target);for(const ids of Object.values(legacy.storyLocations))for(const id of ids)used.add(id);for(const id of legacy.inspected)used.add(id);for(const id of legacy.fragments)used.add(id);}
 const take=(suggested?:number)=>{let id=suggested??Math.floor(rng()*TOTAL);while(used.has(id))id=(id+1)%TOTAL;used.add(id);return id;};
 for(const story of ALL_STORIES){
  const retained=legacy?.storyLocations[story.id];
  const isShort=SHORT_STORIES.some(s=>s.id===story.id);
  const start=isShort?take(Math.floor(rng()*(TOTAL/FILES))*FILES+2):undefined;
  const ids=retained??story.chapters.map((_,i)=>isShort&&i===0?start!:take(isShort?start!+i:undefined));
  storyLocations.set(story.id,ids);
 }
 const target=legacy?.target??take();
 for(const story of ALL_STORIES){
  const ids=storyLocations.get(story.id)!;
  story.chapters.forEach((c,i)=>{
   const id=ids[i],loc=location(id);
   special.set(id,{id,title:c.title,kind:c.kind??'email',author:story.id==='martin'?'Records Office':'Retained correspondence',date:loc.date,subject:story.title,pages:[c.text],
    sheets:c.sheet?[c.sheet,{name:'Cover',columns:['Field','Value'],rows:[[{value:'Retention'},{value:'Keep original'}],[{value:'Reference'},{value:reference(id)}]]}]:undefined,
    story:story.id,chapter:i,evidence:c.evidence,next:ids[i+1],previous:ids[i-1],category:'evidence',
    annotation:`${i>0?`Previous enclosure: ${reference(ids[i-1])}. `:''}${ids[i+1]!==undefined?`Related enclosure retained at ${reference(ids[i+1])}.`:'End of retained correspondence. Originals remain on file.'}`});
  });
 }
 special.set(TUTORIAL_ID,{id:TUTORIAL_ID,title:'A note for the new archivist',kind:'letter',author:'Tess Morgan',date:'2023-01-01',subject:'Welcome. You will need this.',category:'office',pages:[
  'Martin does this to everyone. Take your time. The lunch deadline is a joke, although I am not sure he knows that.\n\nFour wings, eight drawers in each cabinet, sixteen folders in each drawer. The labels are broadly useful. The contents were filed by people, which explains a great deal. A reference includes its wing: W1–A08 / 1.1 means wing one, cabinet A08, drawer one, folder one.\n\nMark what you have searched. Collect any supply vouchers you find and redeem them at the Administration desk. Merely opening a file does not earn money. Retain useful copies and inspect spreadsheet comments.\n\nAttach the original phrase or its containing file, then bring it back to your desk. If you find anything strange, keep the original. Our managers prefer edited versions.'
 ],annotation:`Try ${reference(storyLocations.get('thursday')![0])}. The passages beside reception connect the wings. —Tess`});
 const originalTarget=legacyArchive(seed).get(legacy?toLegacyId(legacy.target)!:legacyArchive(seed).target);
 special.set(target,{...originalTarget,id:target,date:location(target).date,annotation:originalTarget.annotation,category:'evidence'});
 if(legacy){
  const old=legacyArchive(seed),frozen=new Set([...legacy.inspected,...Object.values(legacy.storyLocations).flat(),legacy.target]);
  for(const id of frozen){
   // Legacy IDs occupy the first four drawers / first eight folders of their original cabinets.
   const oldId=toLegacyId(id)!,doc=old.get(oldId),oldSpecial=special.get(id);
   special.set(id,{...doc,id,pages:doc.pages.map(patchReferences),annotation:doc.annotation?patchReferences(doc.annotation):undefined,
    sheets:doc.sheets?.map(s=>({...s,rows:s.rows.map(row=>row.map(c=>({...c,value:patchReferences(c.value),comment:c.comment?patchReferences(c.comment):undefined})))})),
    next:doc.next!==undefined?fromLegacyId(doc.next):undefined,previous:oldSpecial?.previous,category:doc.story?'evidence':'office'});
  }
 }
 const earlyVouchers=earlyOverride??[];
 if(!earlyOverride){const candidates=Array.from({length:FILES*2},(_,i)=>TUTORIAL_ID+i).filter(id=>!used.has(id));earlyVouchers.push(...candidates.slice(0,2));}
 const fragmentIds=new Set<number>(legacy?.fragments??[]);
 for(let wing=0;wing<4;wing++)for(let i=0;i<64;i++)fragmentIds.add(take(wing*FILES_PER_WING+Math.floor(rng()*FILES_PER_WING)));
 function get(id:number):ArchiveDocument {
  if(!Number.isInteger(id)||id<0||id>=TOTAL)throw new Error('Invalid archive document');
  const kept=special.get(id);if(kept)return kept;
  const loc=location(id),drawer=Math.floor(id/FILES),slot=id%FILES;
  // A rotated 16-slot schedule guarantees 8 reference, 5 office, 3 social folders per drawer.
  const rotation=(Math.imul(drawer+1,13)+(seed&15))&15,rank=(slot+rotation)&15;
  let doc:ArchiveDocument;
  if(rank<8){
   const ordinal=drawer*8+rank,source=sourceReference(ordinal,seed),text=sourceText(source);
   doc={id,title:`${source.title} — ${source.section}`,kind:'reference',author:'Reference collection',date:loc.date,subject:`Research attachment / ${DEPARTMENTS[(loc.department+(id%11===0?3:0))%8]}`,pages:[text??'This locally bundled reference pack is loading.'],source,category:'reference',bodyKey:`${source.id}:${source.excerpt}`,
    annotation:id%9===0?'Filed with the wrong department. Again. The extract is genuine; this annotation is office correspondence.':undefined};
  }else if(rank<13){doc=ordinaryDocument(id,drawer*5+rank-8,seed);}
  else{
   const ordinal=drawer*3+rank-13,n=(ordinal+(seed%SCENARIOS.length))%SCENARIOS.length,s=SCENARIOS[n],stage=Math.floor(ordinal/SCENARIOS.length)%6;
   const kind=(['email','calls','letter','calendar','spreadsheet','memo']as const)[stage];
   doc={id,title:`${s.title} — ${['incoming message','supporting record','reply retained','private note','comparison sheet','outcome'][stage]}`,kind,author:['Kit Ames','Tess Morgan','Priya Nair','Noor Ali','Dana North','Imani Cole'][stage],date:loc.date,subject:'Internal correspondence / keep with original',pages:[s.fragments[stage]],category:'social',scenario:n,bodyKey:`social-${n}-${stage}`};
   if(stage===1||stage===4)doc.sheets=[{name:'Retained details',columns:['Entry','Observation'],rows:[[{value:'First account'},{value:s.fragments[(stage+5)%6]}],[{value:'Follow-up'},{value:s.fragments[stage],comment:s.fragments[(stage+1)%6]}]],hiddenRows:stage===4?[1]:undefined}];
   else if(ordinal%3===0)doc.annotation=s.fragments[(stage+1)%6];
  }
  if(fragmentIds.has(id)){doc.fragment=true;doc.annotation=`${doc.annotation?doc.annotation+'\n\n':''}Retained index fragment: assessment records use the W${location(target).wing+1} / ${DEPARTMENTS[location(target).department]} retention series.`;}
  const v=voucherFor(id,seed,earlyVouchers);
  if(v)doc.voucher=v;
  return doc;
 }
 return {seed,target,storyLocations,special,legacy,earlyVouchers,get};
}
export function voucherFor(id:number,seed:number,early:number[]=[]){
 const r=random(seed^Math.imul(id+17,0x45d9f3b));if(!early.includes(id)&&r()>1/24)return undefined;
 const v=r(),value=v>0.99?8:v>0.95?5:1+Math.floor(r()*4);
 const notes=['I was saving this for a better chair. You need it more. —Tess','Found behind a requisition tray. Still valid; the Finance stamp says so.','Please use this before Martin invents an approval process. —Kit','An unused supply allowance. Nobody claimed the stapler.','For whoever finally fixes the drawer runners.','A small thank-you for keeping the originals. —Priya'];
 return {value,note:notes[Math.floor(r()*notes.length)]};
}
export function searchableText(doc:ArchiveDocument){return [...doc.pages,...(doc.sheets??[]).flatMap(s=>s.rows.flatMap(row=>row.flatMap(c=>[c.value,c.comment??'']))),doc.annotation??''].join('\n');}
export function getHint(archive:Archive,level:number){const l=location(archive.target);if(level<=0)return 'Martin supplied no filing reference. Department labels are broadly useful; the contents are less obedient. Index fragments and original evidence give reliable leads.';if(level===1)return `Search wing ${l.wing+1}, ${DEPARTMENTS[l.department]}. The original belongs to this retention series despite the surrounding misfiling.`;if(level===2)return `Search wing ${l.wing+1}, ${DEPARTMENTS[l.department]}, ${new Date(l.date+'T12:00:00').toLocaleDateString('en-GB',{month:'long',year:'numeric'})}. Dates identify retention batches.`;const start=Math.floor(l.column/4)*4+1;return `Wing ${l.wing+1}, ${DEPARTMENTS[l.department]}, cabinets ${String.fromCharCode(65+l.department)}${String(start).padStart(2,'0')}–${String.fromCharCode(65+l.department)}${String(start+3).padStart(2,'0')}. The original is a report. The final file is yours to find.`;}
// The assignment itself repeats the phrase; searchable archive documents must contain it exactly once.
export const TARGET_PHRASE=PHRASE;
