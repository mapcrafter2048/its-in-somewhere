// Frozen version-1 archive. Do not change its generation or placement.
import { DEPARTMENTS, TOTAL, location, random, reference } from './archive';
import type { ArchiveDocument, DocumentKind, Sheet } from './types';
import { STORIES } from '../content/stories';

const AUTHORS = ['Priya Nair','Tess Morgan','Kit Ames','Owen Pike','Lena Ortiz','Theo Marsh','Bea Finch','Dana North','Imani Cole','Elise Hart','Clive Moss','Rita Bell'];
const ITEMS = ['replacement drawer runners','cream stationery','visitor passes','brass index tabs','fluorescent tubes','archive labels','tea supplies','telephone headsets','envelope seals','desk fans','document trays','carbon paper','safety notices','filing dividers','spare cabinet keys','printer rollers','equipment manuals','staff directories','packing slips','meeting schedules','supplier certificates','maintenance cards','bound registers','delivery receipts'];
const ACTIONS = ['checked against the original request','returned for a second signature','moved to the quarterly review','approved subject to stock confirmation','held until the invoice arrives','entered in the department register','sent to the responsible manager','reconciled with last month’s records','referred to Facilities for inspection','retained for the annual audit','copied to the incoming correspondence file','assigned a temporary reference'];
const DETAILS = [
 'The delivery arrived in two batches. The receiving clerk recorded the first batch immediately and attached the second packing slip on the following morning. The totals should be read together.',
 'The supplier has changed its internal product codes. The description remains the same, but the new number should be used on future orders. A comparison sheet is available from Procurement.',
 'The first copy lacked a date and was returned unsigned. The revised version includes the requested information. Please retain both versions so the sequence of amendments remains clear.',
 'A temporary arrangement will remain in place until the replacement is approved. Staff should record any additional costs against the existing reference rather than opening a duplicate request.',
 'The quarterly review found no material change in demand. The current allocation will therefore continue. Any exceptional request must include the name of the person authorised to approve it.',
 'The attached schedule replaces the copy circulated earlier in the month. No change to working hours is intended. The amendment concerns only the order in which the work will be completed.',
 'A discrepancy in the unit description was resolved by checking the original catalogue. The quantity and agreed price are unchanged. Accounts has been informed that a corrected invoice is expected.',
 'The responsible officer was absent when the request arrived. An acknowledgement was issued by reception, and the complete pack was forwarded on their return. No final approval was given by reception.',
 'Please distinguish between the working copy and the signed record. Pencil notes may be added to the working copy. The original must remain legible and should be returned to the archive after inspection.',
 'This item was included in the previous stock count under a different department heading. The transfer is administrative and does not represent a new purchase. The old entry should be cross-referenced.',
 'Two members of staff independently checked the figures. Their initials appear on the reverse of the paper form. Any later amendment requires a dated explanation and a fresh approval.',
 'The request was received after the weekly processing deadline. It has been included in the next batch. Please advise the requesting team that an acknowledgement does not guarantee immediate delivery.'
];
const CLOSINGS = [
 'No further action is required until the next scheduled review. Please quote the record number in all correspondence.',
 'The signed copy should remain with this file. Please do not remove attachments when circulating the working version.',
 'Any questions should be directed to the department administrator before a duplicate request is submitted.',
 'This record is retained for reference. A fresh approval will be required if the quantity or purpose changes.',
 'Please acknowledge receipt and return the completed checklist through internal mail. Keep a copy for your records.',
 'A copy has been sent to Accounts. Further expenditure must be approved separately and should not be added by hand.'
];
const KINDS: DocumentKind[] = ['memo','email','report','expense','calls','calendar','spreadsheet','letter'];
const LABELS = ['Internal memorandum','Re: pending approval','Quarterly reconciliation','Expense clarification','Extension usage report','Room booking amendment','Allocation workbook','Acknowledgement of receipt'];
const JOKE_START = [
 'Clive has labelled the communal milk “confidential”.','Someone submitted the office plant for a performance review.',
 'The suggestion box has been locked following a suggestion that it be removed.','The printer has been renamed “Acting Head of Delays”.',
 'Owen requested a meeting to discuss the number of meetings.','A stapler has been reported missing by the person currently using it.',
 'Reception received a complaint that the hold music was too optimistic.','The office clock was sent an invitation to improve its time management.',
 'The kitchen sponge is now listed as a long-serving employee.','A request for quiet keyboards was printed on the loudest printer.',
 'Facilities found a drawer containing only spare labels for empty drawers.','Someone has booked the quiet room for competitive typing.',
 'The fire drill feedback form asks whether the evacuation met expectations.','A spreadsheet titled FINAL has produced six children.',
 'Martin returned a blank form because the handwriting was unclear.','The “temporary” sign has celebrated its seventh anniversary.',
 'A mug reading World’s Best Manager was purchased with a staff welfare code.','The office fern has been given responsibility for morale.',
 'The committee for simpler forms has requested a larger filing cabinet.','The biscuits were moved to a secure location nobody can remember.'
];
const JOKE_END = [
 'Tess has asked for this to be recorded without further discussion.', 'The resulting complaint has been assigned its own complaint number.',
 'Kit would like everyone to remember that reception is not a court.', 'Procurement declined to classify this as an emergency.',
 'A follow-up meeting was proposed. Nobody has accepted the invitation.', 'Priya refused to authorise overtime for the investigation.',
 'The minutes say “resolved”. The handwritten version says “absolutely not”.', 'Facilities requests that future updates include useful information.',
 'The original note has been retained because the corrected version is worse.', 'Please stop forwarding this to the entire company.'
];
export const JOKES = JOKE_START.flatMap(a => JOKE_END.map(b => `${a} ${b}`));
export const TUTORIAL_ID = 7 * 32;
export interface Archive {
 seed: number; target: number; storyLocations: Map<string, number[]>; special: Map<number, ArchiveDocument>;
 get(id: number): ArchiveDocument;
}
export function createArchive(seed: number): Archive {
 const rng = random(seed), used = new Set<number>([TUTORIAL_ID]);
 const take = (suggested?: number) => { let n = suggested ?? Math.floor(rng()*TOTAL); while(used.has(n)) n=(n+1)%TOTAL; used.add(n); return n; };
 const storyLocations = new Map<string,number[]>();
 STORIES.forEach((story,si)=> {
  const ids = story.chapters.map((_,ci)=> take(ci===0 && si<8 ? si*512 + (si===0?6*32:8*32) + 1 : undefined));
  storyLocations.set(story.id,ids);
 });
 const target = take();
 const specials = new Map<number,ArchiveDocument>();
 for (const story of STORIES) {
  const ids = storyLocations.get(story.id)!;
  story.chapters.forEach((c,i)=> {
   const id=ids[i], loc=location(id);
   specials.set(id,{id,title:c.title,kind:c.kind??'email',author:story.id==='martin'?'Records Office':AUTHORS[(i+STORIES.indexOf(story)*3)%AUTHORS.length],date:loc.date,subject:story.title,
    pages:[c.text],sheets:c.sheet?[c.sheet,{name:'Cover',columns:['Field','Value'],rows:[[{value:'Retention'},{value:'Keep original'}],[{value:'Reference'},{value:reference(id)}]]}]:undefined,
    story:story.id,chapter:i,evidence:c.evidence,next:ids[i+1],annotation:`${i>0?`Previous enclosure: ${reference(ids[i-1])}. `:''}${ids[i+1]!==undefined?`Related enclosure retained at ${reference(ids[i+1])}.`:'End of retained correspondence. Originals remain on file.'}`});
  });
 }
 specials.set(TUTORIAL_ID,{id:TUTORIAL_ID,title:'A note for the new archivist',kind:'letter',author:'Tess Morgan',date:'2023-01-01',subject:'Welcome. You will need this.',pages:[
  'Martin does this to everyone. Take your time. The lunch deadline is a joke, although I am not sure he knows that.\n\nCabinet letters identify departments. Numbers identify cabinets. The reference A07 / 2.4 means cabinet A07, drawer two, file four. You can move between the eight folders in an open drawer. Mark a file searched when you are finished; merely opening it will not mark it.\n\nCollect the original phrase by selecting its words, or attach the whole file to your submission tray. Then bring it to your desk. The supplies catalogue has some useful tools. You earn credits for steady work and discoveries.\n\nIf you see something odd, keep a note. Our filing is better than our management.'
 ],annotation:`Something unusual crossed my desk. Try ${reference(storyLocations.get('thursday')![0])}. —Tess`});
 specials.set(target,{id:target,title:'Original assessment — equipment disposal',kind:'report',author:'Elise Hart',date:location(target).date,subject:'Retained original / approval discrepancy',pages:[
  'The equipment was released under an authority signed by Martin Voss. I was absent on the release date and did not approve the sale. My subsequent reconciliation was limited to the physical stock count.\n\nThe replacement summary states that the discrepancy was considered an acceptable loss. That wording does not represent my assessment. The valuation, release authority and receiving company records should be read together before any conclusion is drawn.\n\nI request that this original assessment remain attached to the signed release form. Please retain the complete correspondence, including the messages omitted from the revised summary. A change to the cover sheet does not change who authorised the transaction.\n\nElise Hart\nStock reconciliation officer'
 ],annotation:'Original received and retained. Do not substitute the revised summary. —Priya'});
 const jokeIds=new Map<number,number>();
 for(let i=0;i<200;i++) jokeIds.set(take(),i);
 const fragmentIds=new Set<number>();
 for(let i=0;i<48;i++) fragmentIds.add(take());
 return {seed,target,storyLocations,special:specials,get(id:number) {
  if(!Number.isInteger(id)||id<0||id>=TOTAL) throw new Error('Invalid archive document');
  const special=specials.get(id); if(special) return special;
  const r=random(seed ^ Math.imul(id+1,2654435761)), pick=<T>(arr:T[])=>arr[Math.floor(r()*arr.length)];
  const loc=location(id), kindIndex=Math.floor(r()*KINDS.length), item=pick(ITEMS), action=pick(ACTIONS), author=pick(AUTHORS);
  const ref=`AR-${String(id+1001)}`, quantity=1+Math.floor(r()*32);
  const intro=kindIndex===1?`From: ${author}\nTo: ${DEPARTMENTS[loc.department]} administration\nSubject: ${item}\n\nPlease find the latest position on record ${ref}. The request concerns ${quantity} units of ${item}, ${action}.`:
   `Record ${ref} concerns ${quantity} units of ${item} for ${DEPARTMENTS[loc.department]}. Following the routine review, the request was ${action}. Position recorded below.`;
  const pages=[`${intro}\n\n${pick(DETAILS)}\n\n${pick(CLOSINGS)}`];
  if(id%19===0) pages.push(`Supporting note / ${ref}\n\n${pick(DETAILS)}\n\n${pick(DETAILS)}\n\n${pick(CLOSINGS)}`);
  let sheets:Sheet[]|undefined;
  if(['spreadsheet','expense','calls','calendar'].includes(KINDS[kindIndex])) {
   const isCalls=KINDS[kindIndex]==='calls',isCal=KINDS[kindIndex]==='calendar';
   sheets=[{name:isCalls?'Extension log':isCal?'Bookings':'Register',columns:isCalls?['Extension','Destination','Minutes']:isCal?['Room','Time','Reserved by']:['Item','Quantity','Status'],rows:Array.from({length:5},(_,i)=>[
    {value:isCalls?String(200+Math.floor(r()*200)):isCal?`Room ${i+1}`:pick(ITEMS)},
    {value:isCal?`${9+i}:00`:String(Math.floor(r()*40)+1)},
    {value:isCalls?String(1+Math.floor(r()*50)):isCal?pick(AUTHORS):pick(['Pending','Checked','Approved','On hold']),comment:i===2?'Checked against the signed original. No amendment required.':undefined}
   ])},{name:'Notes',columns:['Record','Instruction'],rows:[[{value:ref},{value:'Retain with original request.'}],[{value:'Next review'},{value:'Quarterly'}]]}];
  }
  return {id,title:`${LABELS[kindIndex]} — ${item}`,kind:KINDS[kindIndex],author,date:loc.date,subject:`${DEPARTMENTS[loc.department]} / ${ref}`,pages,sheets,
   annotation:jokeIds.has(id)?JOKES[jokeIds.get(id)!]:fragmentIds.has(id)?`Index fragment: original assessment records use the ${DEPARTMENTS[location(target).department]} retention code. Keep this slip for the archive index.`:undefined,
   fragment:fragmentIds.has(id)};
 }};
}
export function searchableText(doc: ArchiveDocument) {
 return [...doc.pages,...(doc.sheets??[]).flatMap(s=>s.rows.flatMap(row=>row.flatMap(c=>[c.value,c.comment??'']))),doc.annotation??''].join('\n');
}
export function getHint(archive: Archive, level: number): string {
 const l=location(archive.target);
 if(level<=0) return 'Martin supplied no filing reference. Department signs, index fragments, and retained correspondence may help. Every file is accessible from the start.';
 if(level===1) return `The original assessment belongs to ${DEPARTMENTS[l.department]} (aisle ${String.fromCharCode(65+l.department)}). Search those cabinets.`;
 if(level===2) return `Search ${DEPARTMENTS[l.department]}, ${new Date(l.date+'T12:00:00').toLocaleDateString('en-GB',{month:'long',year:'numeric'})}. Cabinet labels show their month. Dates refer to archive retention batches.`;
 const start=Math.floor(l.column/4)*4+1;
 return `The original is in ${DEPARTMENTS[l.department]}, cabinet group ${String.fromCharCode(65+l.department)}${String(start).padStart(2,'0')}–${String.fromCharCode(65+l.department)}${String(start+3).padStart(2,'0')}. It is a report. The final file is yours to find.`;
}
