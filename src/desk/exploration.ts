import { DEPARTMENTS, fileId, location, random, reference } from '../archive';
import type { Archive } from '../content/generator';
import type { Save } from '../types';
import { THREADS } from '../content/packs/records';
import type { DigitalDocument } from './digital-files';

export interface CatalogueEntry {id:string;title:string;department:string;people:string;events:string;retention:string;keywords:string;range:string;description:string}
export function catalogueEntries(archive:Archive):CatalogueEntry[]{
 const entries:CatalogueEntry[]=[],rng=random(archive.seed^0x4816eab1),used=new Set<number>();
 const topics=['Incoming correspondence','Supplier acknowledgements','Room allocation history','Equipment receiving batches','Staff circulars','Inspection handovers','Training administration','Archived amendments'];
 while(entries.length<58){
  const cabinet=Math.floor(rng()*512);if(used.has(cabinet)||location(archive.target).cabinet===cabinet)continue;used.add(cabinet);
  const first=fileId(cabinet),l=location(first),n=entries.length;
  entries.push({id:`batch-${cabinet}`,title:`${topics[n%topics.length]} / batch ${String(n+1).padStart(2,'0')}`,department:DEPARTMENTS[l.department],people:['Tess Morgan','Priya Nair','Dana North','Noor Ali','Imani Cole','Kit Ames'][n%6],events:`${2002+n%4}–${2003+n%4}`,retention:`2023-${String(l.column%12+1).padStart(2,'0')}`,keywords:['mail letters','purchase orders invoices','rooms relocation plans','serial assets deliveries','people retirement newsletter','repairs service','attendance training','contracts revisions'][n%8],range:`${reference(first)} — ${reference(first+127)}`,description:'Legacy batch description entered before transfer. Includes mixed retained accounts; titles and contents must be checked in the physical folders.'});
 }
 if(archive.recordPack===1)for(const t of THREADS){const ids=archive.threadLocations!.get(t.id)!;const preferred=[0,3,1,2,4,5].filter(n=>location(ids[n]).cabinet!==location(archive.target).cabinet).slice(0,2);for(const [batch,n] of preferred.entries()){const l=location(ids[n]);entries.push({id:`${t.id}-${n}`,title:`${t.title} / retained batch ${batch===0?'A':'B'}`,department:DEPARTMENTS[l.department],people:t.id==='friday'?'Mara Bell · Tess Morgan · Dana North':t.id==='department'?'Dana North · Noor Ali':'Imogen Reed · Noor Ali · Martin Voss',events:t.id==='department'?'2004–2005':t.id==='friday'?'December 2006':'June 2006',retention:l.date.slice(0,7),keywords:t.id==='department'?'R7 room annex relocation':t.id==='friday'?'retirement farewell circular Friday':'DO-41 cabinet runners approval fax',range:`${reference(fileId(l.cabinet,l.drawer))} — ${reference(fileId(l.cabinet,l.drawer,15))}`,description:'Related correspondence was retained in this batch. Enclosure references on the originals identify other holdings.'});}}
 return entries;
}
export function searchCatalogue(entries:CatalogueEntry[],query:string){const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);return entries.filter(e=>terms.every(term=>[e.title,e.department,e.people,e.events,e.retention,e.keywords,e.range].join(' ').toLowerCase().includes(term)));}

export const EXPLORATION_FILES:readonly DigitalDocument[]=[
 ...THREADS.flatMap(t=>[
  {id:`${t.id}-routing`,folder:'Shared' as const,name:`${t.title} routing.txt`,caseId:t.id,pack:1 as const,body:t.intro+' The partial Catalogue lists retained batches. Their physical enclosures provide further references.'},
  {id:t.passwordFile,folder:'Old Backups' as const,name:t.id==='duplicate'?'DO-41 amendment draft.txt':t.id==='department'?'R7 relocation file.txt':'Mara farewell unsent.txt',caseId:t.id,pack:1 as const,password:t.password,body:t.id==='duplicate'?'Abandoned draft, 14 June 2006: increase DO-41 from six runners to twelve. Approval requested, never supplied. This electronic draft was not sent and is not an additional purchase authority.':t.id==='department'?'Relocation working copy: R7 retained its historical invoice code when the team joined Technical Services. Directory alias entry remained pending. Consult the signed relocation agreement before requesting a correction.':'Unsent working draft for Mara: You remembered the small things everyone else forgot. Your quiet fixes made our days easier. We hope the next chapter gives you time for yourself. The paper handover records where the message was kept.'},
  {id:`${t.id}-index`,folder:'Facilities' as const,name:`${t.id} reference notes.txt`,caseId:t.id,pack:1 as const,body:t.id==='duplicate'?'DO-41 refers to cabinet runners. A pack size and a received quantity are different fields. The fax reference is printed on the retained transmission.':t.id==='department'?'Historical room numbers and present filing coordinates describe different spaces. R7 is a former department code, not a current cabinet reference.':'Friday circular references include a word and a number separated by a hyphen. The retained circular explains how its draft was protected.'},
  {id:`${t.id}-review`,folder:'Accounts' as const,name:`${t.id} review checklist.txt`,caseId:t.id,pack:1 as const,body:'For a written correction, attach the two relevant original accounts. A digital working copy provides context but does not establish that an instruction was approved. You may ask the relevant colleague for clarification first.'}
 ]),
 ...[
 ['Shared','Circular naming.txt','A circular has no obligation to be round. Please retain the reference number anyway.'],
 ['Shared','Meeting room etiquette.txt','The booking ends when the clock says it ends, rather than when the chair reaches Any other business.'],
 ['Shared','Newsletter submissions.txt','Send one short item to Tess. An attachment named brief report may still require shortening.'],
 ['Accounts','Receipt corners.txt','Do not staple over the total. Accounts can imagine a number but cannot reimburse an imagination.'],
 ['Accounts','Pack size guidance.txt','The number printed on packaging is not necessarily the number received. Record the count before signing.'],
 ['Accounts','Historic aliases.txt','Retain old department codes as aliases after a move. Renaming a room does not cancel its invoices.'],
 ['Facilities','Door labels.txt','Use a room label and a readable symbol. Colour alone does not tell everyone where they are.'],
 ['Facilities','Carbon handling.txt','Retain readable carbon copies with their issue reference. Do not rub the impression to improve it.'],
 ['Facilities','Plans cupboard.txt','Historical plans are labelled with their effective date. Do not build a wall because it appears on an old sheet.'],
 ['Personal','A quiet Friday.txt','Things left unsaid sometimes survive in a folder. This is one benefit of retaining too much paper.'],
 ['Personal','Tess on filing.txt','An odd record is an invitation, not an instruction. You still have one sentence to find.'],
 ['Old Backups','Catalogue coverage.txt','The catalogue describes selected transferred batches. Missing search results do not establish missing records. The paper archive remains the authoritative collection.']
 ].map(([folder,name,body],i)=>({id:`office-extra-${i}`,folder:folder as DigitalDocument['folder'],name,body,pack:1 as const}))
];
export function unlockDigital(save:Save,file:DigitalDocument,password:string):boolean{
 if(!file.password||file.pack===1&&save.recordPack!==1)return false;
 if(password.trim().toLowerCase()!==file.password.toLowerCase())return false;
 const ids=save.deskLife!.unlockedFiles??=[];if(!ids.includes(file.id))ids.push(file.id);return true;
}
