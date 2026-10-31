import {BASE_TOTAL,TOTAL,DRAWER_BANKS,FILES,PHRASE,DEPARTMENTS,location,reference,random,fileId} from '../archive';
import {createArchive as createV2,voucherFor,makeLegacyBindings,TUTORIAL_ID,getHint as oldHint,searchableText,TARGET_PHRASE,JOKES} from './generator-v2';
import {sourceReference,sourceText} from './sources';
import {ordinaryDocument,TOPICS,OFFICE_BODIES} from './ordinary';
import {SCENARIOS} from './scenarios';
import type {ArchiveDocument,LegacyBindings} from '../types';
import type {Archive as V2Archive} from './generator-v2';
export {voucherFor,makeLegacyBindings,TUTORIAL_ID,searchableText,TARGET_PHRASE,JOKES};
export {ALL_STORIES} from './expanded-stories';
export interface Archive extends V2Archive {placementVersion:2|3}
function expandedOrdinary(id:number,ordinal:number,seed:number):ArchiveDocument{
 const doc=ordinaryDocument(id,ordinal,seed),variant=(ordinal*37+(seed%OFFICE_BODIES.length))%OFFICE_BODIES.length,topic=TOPICS[Math.floor(variant/12)];
 const record=reference(id);
 const sections=[doc.pages[0],
 `SUPPORTING RECORD / ${record}\n\nThe reviewer compared the retained original with the working copy for ${topic[0]}. The first check was whether the recorded action matched the approved instruction: ${topic[1]} The comparison must use the dated source entry, rather than a later summary. Where a signature, measurement or acknowledgement is missing, the gap remains visible in the record; it is not filled by assuming that the usual process happened.`,
 `ACTION AND HANDOVER\n\nThe responsible colleague must verify the next requirement before closing this batch: ${topic[2]} Keep the original observation with any correction, record who made the change, and identify the evidence that justified it. The receiving colleague then checks the related safeguard: ${topic[3]} If the two records disagree, leave the item pending and ask for a written decision instead of silently choosing the more convenient account.`,
 `FOLLOW-UP\n\n${topic[4]} Retain the outcome beside this file so the next review can distinguish an agreed exception from an unresolved omission. The handover should state what was checked, what remains uncertain, and who will obtain the missing information. A closed request without that explanation is returned for clarification; it does not establish that the underlying work was complete.`];
 return {...doc,pages:[sections.join('\n\n')],bodyKey:`expanded-${doc.bodyKey}`};
}
export function createArchive(seed:number,legacy?:LegacyBindings,earlyOverride?:number[],placementVersion:2|3=3):Archive{
 const base=createV2(seed,legacy,earlyOverride),special=new Map(base.special),rng=random(seed^0x714bc529);
 let target=base.target;
 if(placementVersion===3&&!legacy){do{target=Math.floor(rng()*TOTAL);}while((special.has(target)&&target!==base.target)||base.earlyVouchers.includes(target));}
 if(target!==base.target){const original=base.get(base.target);base.special.delete(base.target);special.delete(base.target);special.set(target,{...original,id:target,date:location(target).date});}
 // Live instructions may change for a new content version; inspected v2 text stays frozen.
 if(placementVersion===3&&!legacy){const welcome=special.get(TUTORIAL_ID)!;special.set(TUTORIAL_ID,{...welcome,pages:[`Martin wants one sentence before lunch. There is no deadline. The archive occupies four connected rooms. Your work nook is in W4. Every floor row has independent front and rear drawers; wall cabinets and file boxes hold originals too. A rear reference ends in R, WC means wall cabinet and BX means box.\n\nStart with this drawer, keep useful originals, and mark what you have searched. Collect supply vouchers and redeem them at your W4 desk. Merely opening a file does not earn money. Inspect spreadsheet comments and hidden rows for evidence.\n\nReading the page containing Martin’s phrase completes the task immediately. There is no deadline and no requirement to carry it back. The original remains wherever you leave it. —Tess`],annotation:`Try ${reference(base.storyLocations.get('thursday')![0])}. Shared doors connect W1–W2–W3–W4–W1.`});}
 function get(id:number):ArchiveDocument{
  if(!Number.isInteger(id)||id<0||id>=TOTAL)throw new Error('Invalid archive document');
  const kept=special.get(id);if(kept)return kept;
  if(id<BASE_TOTAL){const doc=base.get(id);if(doc.fragment&&target!==base.target)return {...doc,annotation:doc.annotation?.replace(/Retained index fragment:[\s\S]*$/,'Retained index fragment: '+hintArea(target)+'.')};return doc;}
  const l=location(id),size=l.kind==='box'?8:FILES,baseId=fileId(l.cabinet,l.drawer),slot=id-baseId,group=l.kind==='box'?DRAWER_BANKS*8+Math.floor((baseId-DRAWER_BANKS*128)/8):Math.floor(baseId/16);
  const rank=(slot+(Math.imul(group+1,13)+(seed&15)))%size,refSlots=size/2,officeEnd=size===8?7:13;
  // A separate ordinal domain keeps corpus repeats at a distance from version-2 records.
  const ordinal=group*8+rank+900001;let doc:ArchiveDocument;
  if(rank<refSlots){const source=sourceReference(ordinal,seed);doc={id,title:`${source.title} — ${source.section}`,kind:'reference',author:'Reference collection',date:l.date,subject:`${DEPARTMENTS[l.department]} / retained attachment`,pages:[sourceText(source)??'This locally bundled reference pack is loading.'],source,category:'reference',bodyKey:`extra-${source.id}:${source.excerpt}`};}
  else if(rank<officeEnd)doc=expandedOrdinary(id,(size===8?DRAWER_BANKS*8*5+(group-DRAWER_BANKS*8)*3:group*5)+rank-refSlots,seed);
  else{const socialOrdinal=(size===8?DRAWER_BANKS*8*3+group-DRAWER_BANKS*8:group*3)+rank-officeEnd,n=(socialOrdinal+(seed%SCENARIOS.length))%SCENARIOS.length,stage=Math.floor(socialOrdinal/SCENARIOS.length)%6,s=SCENARIOS[n];doc={id,title:s.title,kind:'memo',author:'Records correspondence',date:l.date,subject:'Retained account / '+l.label,pages:[s.fragments[stage]],category:'social',scenario:n,bodyKey:`extra-social-${n}-${stage}`,annotation:s.fragments[(stage+1)%6]};}
  if((id+seed)%257===0){doc.fragment=true;doc.annotation=(doc.annotation?doc.annotation+'\n\n':'')+'Retained index fragment: '+hintArea(target)+'.';}
  const voucher=voucherFor(id,seed,base.earlyVouchers);if(voucher)doc.voucher=voucher;return doc;
 }
 return {...base,placementVersion,target,special,get};
}
function hintArea(id:number){const l=location(id);return `assessment records use wing ${l.wing+1}, ${DEPARTMENTS[l.department]}, ${l.kind==='front'?'front drawers':l.kind==='rear'?'rear drawers':l.kind==='wall'?'wall cabinets':'file boxes'}`;}
export function getHint(archive:Archive,level:number){
 const l=location(archive.target);if(l.kind==='front')return oldHint(archive,level);
 if(level<=0)return 'The original may be in a front or rear drawer, a wall cabinet, or a file box. Index fragments and retained evidence narrow the search.';
 const area=`Search wing ${l.wing+1}, ${DEPARTMENTS[l.department]}, ${l.kind==='rear'?'rear drawers':l.kind==='wall'?'wall cabinets':'file boxes'}`;
 if(level===1)return area+'.';const month=new Date(l.date+'T12:00:00').toLocaleDateString('en-GB',{month:'long',year:'numeric'});if(level===2)return `${area}, ${month}. Dates identify retention batches.`;
 const start=Math.floor(l.column/4)*4+1;return `${area}, references ${String(start).padStart(2,'0')}–${String(start+3).padStart(2,'0')}. The original is a report. Look for the ${l.kind==='box'?'BX':l.kind==='wall'?'WC':'R'} reference.`;
}
// Keep phrase imports visible to the content audit without changing the frozen corpus.
export const expandedTargetPhrase=PHRASE;
