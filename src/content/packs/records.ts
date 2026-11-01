import { DEPARTMENTS, fileId, location, random, reference } from '../../archive';
import type { ArchiveDocument, RecordFamily, RecordPresentation } from '../../types';
import type { Archive } from '../generator';
import type { Contact } from '../../desk/types';

export const THREADS = [
 {id:'duplicate',title:'The Duplicate Original',contacts:['accounts','martin'] as Contact[],pair:[0,3],notice:'Records handling corrected: retain both versions of DO-41. The fax authorised six units; the later cover sheet did not authorise twelve.',intro:'Two DO-41 approvals disagree. Please compare the signed instruction with the incoming fax before asking for a correction.',password:'fax-1842',passwordFile:'duplicate-amendment'},
 {id:'department',title:'The Missing Department',contacts:['facilities','accounts'] as Contact[],pair:[0,4],notice:'Directory corrected: Department R7 became the Technical Services records annex. The old room number describes a former use, not a missing team.',intro:'The R7 department survives in invoices but not on the current plan. Compare the old plan with its relocation agreement.',password:'r7',passwordFile:'department-relocation'},
 {id:'friday',title:'The Last Working Friday',contacts:['tess','facilities'] as Contact[],pair:[1,5],notice:'For Mara Bell, with thanks: your farewell message was kept with the handover, not forgotten. A copy is now pinned beside the desk.',intro:'Mara Bell left on Friday without receiving the message written for her. Her annotated letter and the final handover may explain where it went.',password:'friday-17',passwordFile:'friday-farewell'}
] as const;
export type Thread = typeof THREADS[number];
export function threadById(id:string){return THREADS.find(t=>t.id===id);}

interface Variant {family:RecordFamily;title:string;text:string;annotation?:string}
const sets: [RecordFamily, [string,string,string?][]][] = [
 ['fax',[
  ['A proof received twice','FROM: Print Room / TO: Records. Transmission F-108, 09:14, two pages received. The first attempt stopped after the cover sheet; retain the complete second transmission. The proof is for forty invitations, not forty meetings.'],
  ['Supplier acknowledgement','FROM: North Quay Paper / TO: Procurement. Transmission F-219, 11:06, one page. Order P-62 remains for eight cartons. The supplier confirms cream stock; the word white on the cover describes the envelope.'],
  ['Out-of-hours maintenance fax','FROM: Service Depot / TO: Facilities. Transmission F-307, 17:42, three pages. Engineer will attend Tuesday at 08:30. Page two lists the isolation points; page three is the diagram. Keep them together.'],
  ['Correction to a correction','FROM: Accounts / TO: Records. Transmission F-416, 14:25, one page. The earlier correction changed the room number correctly. Please disregard its instruction to disregard the correction. The room remains 14.']]],
 ['carbon',[
  ['Blue duplicate: key receipt','The blue carbon retains receipt K-18: one key issued to Noor Ali at 08:10 and returned at 16:55. The original went to Security. A faint second impression belongs to the previous sheet, not to a second key.'],
  ['Pink duplicate: stationery issue','Issue S-23 records twelve pencils, two erasers and one ruler. The pink copy stays in the cupboard register. Priya counted the twelve pencils before anyone could describe a box as a unit.'],
  ['Yellow duplicate: room booking','Booking B-31 is for Thursday, 10:00–10:30. The cancellation was made Wednesday at 15:20 and remains visible on this duplicate. Do not invoice the chair for attending an empty room.'],
  ['Carbon retained after collection','Collection C-44 confirms that Theo Marsh received the repaired stapler. One staple was used for the acknowledgement. Facilities regards this as a successful acceptance test.']]],
 ['access',[
  ['Temporary badge return log','08:42 · V-12 · service entrance · entry. 10:16 · V-12 · service entrance · exit. 10:20 · reception · badge returned. Host: Imani Cole. The return time records desk handling, not another building exit.'],
  ['Door override review','07:55 · D-04 · override by Facilities. 08:02 · D-04 · normal service restored. The door was held for a trolley delivery. No staff access rights changed; the override is retained separately.'],
  ['Evening cleaning access','18:04 · C-09 · entry. 18:46 · C-09 · exit. The contractor badge expires tonight. The cleaner reported a desk fan left running and did not submit it as an employee.'],
  ['Replacement badge audit','09:12 · badge B-73 disabled. 09:18 · replacement B-91 issued. Both entries refer to Kit Ames. Count people rather than cards when preparing attendance totals.']]],
 ['delivery',[
  ['Receiving note: desk lamps','Delivery DN-52: three desk lamps, serials L-201, L-202 and L-203. Received by Dana North. L-202 has a damaged shade and is held for replacement; the other two passed inspection.'],
  ['Returned measurement tool','Return DN-68: gauge G-814, quantity one. Received by Imani Cole. Calibration certificate CAL-814 travels with the instrument. A replacement carrying case is not a replacement gauge.'],
  ['Paper delivery short count','Delivery DN-79: ten cartons ordered, nine received, one back-ordered. Noor Ali signed for nine. The delivery driver initialled the amendment before leaving. Accounts should reconcile against nine.'],
  ['Trolley transfer receipt','Transfer DN-83: trolley TR-06 moved from Procurement to Records, with four empty crates. Signed by Theo Marsh and Tess Morgan. The crates are packaging, not a new shelving system.']]],
 ['receipt',[
  ['Receipt: meeting supplies','Receipt RC-14: tea £4.20, biscuits £3.80, total £8.00. Approved by Priya Nair. The biscuits were shared across two meetings; this does not make two reimbursable receipts.'],
  ['Expense: emergency taxi','Claim EX-28: taxi £12.40, toll £1.60, total £14.00. Theo Marsh returned the keys after the last bus. Facilities verified the call-out; the taxi driver is not a temporary employee.'],
  ['Receipt: replacement labels','Receipt RC-35: four label rolls at £2.50, total £10.00. Received by Noor Ali. One roll corrects the spelling of labels on the label cupboard.'],
  ['Expense returned for explanation','Claim EX-49: flowers £9.00, ribbon £1.00, total £10.00. Approval pending. The request calls the purchase morale infrastructure. Accounts asks whose retirement it celebrates.']]],
 ['chart',[
  ['Paper use by quarter','Recorded reams: Q1 18; Q2 22; Q3 16; Q4 20. Total 76. The peak coincides with the paper-reduction survey. These are issues from stock, not estimates of useful pages.'],
  ['Repair queue: weekly closures','Jobs closed: week 1 12; week 2 9; week 3 15; week 4 11. Total 47. Reopened jobs are recorded in a separate register; closure is not proof that the machine remained repaired.'],
  ['Returned keys by month','Keys returned: January 8; February 6; March 10; April 7. Total 31. Spare keys remain in the register. A declining line would not mean the doors became more welcoming.'],
  ['Training attendance counts','Attendance: session A 14; B 11; C 16; D 13. Total attendances 54. Some staff attended twice. Do not present this as 54 distinct employees.']]],
 ['plan',[
  ['Archive service route','Plan P-11: entrance → reception → Records. Service access branches from reception to the loading room. Solid lines are corridors; outlined boxes are rooms. This plan records room use before the current warehouse arrangement.'],
  ['Former equipment annex','Plan P-24: stores → calibration room → tool issue. The side room marked waiting was later converted to storage. The arrow indicates document flow, not an emergency exit.'],
  ['Meeting suite revision','Plan P-36: reception → meeting room → records cupboard. Revision B removes the extra chair symbol from the doorway. The room capacity remains six; a cupboard cannot supply overflow seating.'],
  ['Mail handling layout','Plan P-48: receiving desk → sorting table → dispatch shelf. Returned post goes to the side tray. Dashed boundaries indicate work areas, not walls to be installed by Facilities.']]],
 ['contract',[
  ['Service agreement: annual inspection','1. Supplier inspects twelve units annually. 2. Facilities supplies safe access. 3. Replacement parts require separate approval. Amendment A changes the visit month to May. Signed: Dana North / Service Depot.'],
  ['Paper supply amendment','1. Original order P-62 covers eight cartons. 2. Amendment B changes stock colour to cream. 3. Quantity and price remain unchanged. Signed by Procurement and acknowledged by North Quay Paper.'],
  ['Loan agreement: calibration gauge','1. Gauge G-814 remains company property. 2. Borrower retains certificate CAL-814. 3. Return is due after the workshop test. Signed by Imani Cole and the receiving technician.'],
  ['Room use agreement','1. Training receives room 14 on Tuesdays. 2. Furniture must leave the doorway clear. 3. Cancellations reach reception by the previous afternoon. Signed by Training and Facilities. The chair has not countersigned.']]],
 ['annotated',[
  ['Marked proof: induction booklet','Approved text: new staff collect a badge from reception and return temporary passes before leaving. The proof was circulated for checking before the next induction.','Please say reception desk. Last time somebody waited beside the reception plant. —Tess'],
  ['Reviewed maintenance instruction','Original instruction: isolate the fan before opening the guard. Record the asset number and report any damaged cable. The reviewer retained this copy with the equipment file.','Switching it to the slower setting is not isolation. —Dana'],
  ['Annotated stock count','Count sheet records six sealed cartons and one open carton containing twenty-four folders. All were checked at close of business. The open carton is shown separately.','Please stop rounding the open carton up to a sealed one. —Priya'],
  ['Reading-room handover','The reference shelves were checked and the borrowed volume returned. The register still needs the borrower signature. No losses were observed.','The book was on my desk under the reminder to return it. A persuasive arrangement. —Kit']]],
 ['damaged',[
  ['Water-marked delivery acknowledgement','TRANSCRIPTION: Receiving note W-12. Two crates accepted at 10:40 by Noor Ali. The lower blank margin is water-stained; the quantity and signature remain legible. No missing words have been reconstructed.'],
  ['Torn meeting cancellation','TRANSCRIPTION: Meeting M-28, Friday 14:00, cancelled by the organiser Thursday 16:10. The tear removes the blank distribution panel. Reception retained the cancellation time in its register.'],
  ['Faded equipment tag record','TRANSCRIPTION: Asset TR-06, trolley, inspected 12 May. Wheels checked; one label renewed. The ink faded beneath the filing clip. The transcription was checked against the retained tag.'],
  ['Scorched circular edge','TRANSCRIPTION: Circular C-39. Keep paper away from portable heaters. Issued by Facilities. The scorched outer edge does not remove any instruction. Facilities declines to call this a demonstration copy.']]],
 ['newsletter',[
  ['Records Roundup: spring','Tess welcomes the new starters. Imani requests the return of gauge G-814. Kit announces a meeting about shorter meetings. The editor asks for contributions that fit on one page. Nobody has complied.'],
  ['Office Circular: repairs','Dana reports that the service trolley is back. The copier remains awaiting a part. Accounts reminds staff that priority passes do not accelerate shipping. A reader asks whether patience can be requisitioned.'],
  ['The monthly pin: people','Priya thanks the stock-count volunteers. Noor found the lost ruler in the ruler drawer, beneath a note reporting it missing. Retirement messages should go in the labelled envelope, not into general post.'],
  ['Department Notes: autumn','Training has booked room 14. Reception requests cancellation notices before visitors arrive. Facilities announces a new label for the old labels. Next issue: whether the archive can retain a sense of proportion.']]],
 ['revision',[
  ['Stock review: original issue','Series SR-12, ORIGINAL, revision A. Six sealed cartons and one open carton were counted. Prepared by Priya Nair. The next issue corrects a carton description without changing the counted quantity.'],
  ['Stock review: corrected description','Series SR-12, REVISED, revision B. Six sealed cartons and one open carton were counted. The description now specifies manila folders. Quantity unchanged. Priya Nair approved the descriptive correction.'],
  ['Service note: original schedule','Series SN-24, ORIGINAL, revision A. Annual inspection was booked for April. Dana North retained this issue with the booking acknowledgement. The equipment list contains twelve units.'],
  ['Service note: rescheduled visit','Series SN-24, REVISED, revision B. Annual inspection is now booked for May. The equipment list still contains twelve units. Dana North approved the date change and retained the superseded issue.']]]
];
export const RECORD_VARIANTS:readonly Variant[]=sets.flatMap(([family,items])=>items.map(([title,text,annotation])=>({family,title,text,annotation})));

export function recordPresentation(family:RecordFamily,register:string,text:string,annotation?:string):RecordPresentation{
 const p:RecordPresentation={family,register,fields:[['Register',register],['Status','Retained as received']]};
 if(family==='fax'){const header=text.match(/FROM: (.*?) \/ TO: ([^.]+)\./);if(header)p.fields.push(['From',header[1]],['To',header[2]]);const time=text.match(/\b\d{2}:\d{2}\b/);if(time)p.fields.push(['Received',time[0]]);p.fields.push(['Pages',text.match(/(?:one|two|three) page(?:s)?(?: received)?/i)?.[0]??'Received count retained in text']);}
 if(family==='carbon')p.fields.push(['Copy','Office carbon / original filed separately']);
 if(family==='access')p.table={columns:['Event','Recorded account'],rows:text.split('. ').slice(0,3).map((line,i)=>[String(i+1).padStart(2,'0'),line])};
 if(family==='delivery')p.fields.push(['Check','Quantity · serial · receiver']);
 if(family==='receipt'){p.fields.push(['Review','Itemized cost / approval below']);const amounts=[...text.matchAll(/([A-Za-z][A-Za-z ]*?) £(\d+\.\d{2})/g)];if(amounts.length)p.table={columns:['Item / account','Amount'],rows:amounts.map(m=>[m[1].trim(),'£'+m[2]])};}
 if(family==='contract')p.fields.push(['Execution','Clauses and signatories retained below']);
 if(family==='annotated')p.annotation=annotation??'Retain the earlier account with this correction. —Records';
 if(family==='damaged')p.fields.push(['Reading copy','Checked transcription follows; damage is not a puzzle']);
 if(family==='newsletter')p.fields.push(['Circulation','All departments / reading optional']);
 if(family==='revision'){
  const series=text.match(/(?:Series |DO-)([A-Z]{2}-\d+|41)/)?.[0]??register;
  p.revision={series,version:/REVISED|revision B|replacement/i.test(text)?'REVISED / B':'ORIGINAL / A'};
 }
 if(family==='chart'){
  const matches=[...text.matchAll(/(?:Q[1-4]|week \d|January|February|March|April|session A|B|C|D)\s+(\d+)/g)];
  const values=matches.slice(0,4).map(m=>Number(m[1]));
  p.diagram={kind:'chart',labels:matches.length===4?matches.slice(0,4).map(m=>m[0].replace(/\s+\d+$/,'')):['1','2','3','4'],values:values.length===4?values:[18,22,16,20]};
  p.table={columns:['Period (in text order)','Count'],rows:p.diagram.values!.map((v,i)=>[p.diagram!.labels[i],String(v)])};
 }
 if(family==='plan'){const route=text.match(/: ([^.]+→[^.]+)\./)?.[1];p.diagram={kind:'plan',labels:register==='R7-PLAN'?['R7 / beside 14','Move / 2005','Technical annex']:route?route.split('→').map(s=>s.trim()).slice(0,3):['Receiving','Work area','Retained records']};}
 return p;
}

const physical: {family:RecordFamily;title:string;text:string;register:string;annotation?:string}[][]=[
 [
  {family:'revision',register:'DO-41',title:'DO-41 — signed original',text:'DO-41 ORIGINAL / revision A, 12 June 2006. Imogen Reed approved delivery of six cabinet runners, serials CR-4101–CR-4106. A later cover sheet says twelve. This signed instruction authorises six. Compare the incoming fax, not the cover alone.'},
  {family:'revision',register:'DO-41',title:'DO-41 — replacement cover',text:'DO-41 REVISED / revision B, 13 June 2006. Cover quantity: twelve cabinet runners. Approval copied from Imogen Reed. The replacement has no fresh signature. A clerk transcribed the pack size into the quantity field; the previous issue remains retained.'},
  {family:'carbon',register:'DO-41-C',title:'DO-41 — blue carbon receipt',text:'Blue carbon, 12 June 2006. Six runners received: CR-4101, CR-4102, CR-4103, CR-4104, CR-4105, CR-4106. Signed Noor Ali. Original receiving note accompanied the shipment. The carbon predates the replacement cover.'},
  {family:'fax',register:'FAX-1842',title:'DO-41 — incoming fax',text:'FROM: Imogen Reed / TO: Procurement. FAX-1842, 12 June 2006, 09:18, one page received. Approved quantity SIX, serials CR-4101–CR-4106. No additional six units authorised. The saved amendment draft uses this transmission reference as its password: FAX-1842, including the hyphen.'},
  {family:'delivery',register:'DN-DO41',title:'DO-41 — delivery tally',text:'12 June 2006. Six units dispatched, six received. Serials CR-4101–CR-4106. Receiver Noor Ali counted each runner. The twelve printed on the packaging denotes the standard pack size; the supplier split the pack.'},
  {family:'contract',register:'DO-41-A',title:'DO-41 — unsigned amendment',text:'Amendment A, 14 June 2006. Proposed increase from six to twelve cabinet runners. Approval field blank. Procurement held the amendment; no second delivery followed. Keep the signed original and FAX-1842 for Accounts review.'}
 ],
 [
  {family:'plan',register:'R7-PLAN',title:'R7 — former department plan',text:'Plan R7-PLAN, 2004. R7 occupied the office beside room 14. Revision of 2005 labels its retained records space Technical annex. This is a historical plan, not the present warehouse floor plan. Department code R7 persisted on invoices after the move. Legend: outlined boxes are rooms; arrows show relocation.'},
  {family:'chart',register:'R7-ORG',title:'R7 — reporting chart',text:'Organization chart, 2005. Technical Services → R7 records team → annex staff. The team joined Technical Services; no posts were abolished in this change. The old department code is R7. Enter R7, letter then digit, to open the relocation file on Records Desktop.'},
  {family:'access',register:'R7-ACCESS',title:'R7 — badge change log',text:'03 October 2005, 08:00: room 14 office access removed from R7 group. 08:05: Technical annex access added to the same group. 08:14: first annex entry by Noor Ali. The access change moved a team; it did not remove its employees.'},
  {family:'delivery',register:'R7-MOVE',title:'R7 — records transfer',text:'03 October 2005. Six labelled crates transferred from room 14 to Technical annex. Trolley TR-06. Received by Dana North and Noor Ali. The labels retained R7 so the incoming invoices could still be matched.'},
  {family:'contract',register:'R7-AGREEMENT',title:'R7 — relocation agreement',text:'Signed 28 September 2005 by Facilities and Accounts. 1. R7 becomes the Technical Services records annex. 2. Staff and invoice references remain valid. 3. The directory must retain R7 as an alias. Compare the old plan with this agreement before correcting the directory.'},
  {family:'newsletter',register:'R7-CIRCULAR',title:'R7 — department notice',text:'October 2005: welcome to the newly relocated records annex. The room is new to us; the people are not. Please send Technical Services post to the annex and keep R7 on historic invoices. The directory correction was requested but never printed.'}
 ],
 [
  {family:'newsletter',register:'FRIDAY-17',title:'Mara Bell — retirement circular',text:'Circular FRIDAY-17, Monday 11 December 2006. Mara Bell leaves this Friday after seventeen years. Send farewell messages to Tess. The local farewell draft is protected with the circular reference FRIDAY-17, including the hyphen. There is no collection deadline for the archivist.'},
  {family:'annotated',register:'MB-LETTER',title:'Mara — annotated thank-you letter',text:'Mara wrote: thank you for the flowers and the years of patient help. I never saw the message everyone mentioned. If it turns up, I would still like to read it. Tess retained the letter after Mara left.',annotation:'I put the message in the blue handover envelope for safekeeping. Apparently I made it safe from its recipient. —Tess'},
  {family:'receipt',register:'MB-RC',title:'Mara — flower receipt',text:'15 December 2006. Flowers £9.00, ribbon £1.00, total £10.00. Paid by Tess Morgan. The delivery acknowledgement confirms Mara received the flowers. No card text appears on this receipt.'},
  {family:'receipt',register:'MB-EX',title:'Mara — approved expense',text:'Claim MB-EX. Flowers and ribbon, £10.00, reimbursed once. Priya approved the farewell expense. The approved claim refers to a separate message envelope, not to another purchase. Accounts retained the reference with the handover.'},
  {family:'damaged',register:'MB-NOTE',title:'Mara — creased message slip',text:'CHECKED TRANSCRIPTION: For Mara, from everyone in Records. Your quiet fixes made our days easier. Thank you. The fold has worn the blank margin; the words are complete. A note on the reverse says: blue handover envelope, desk copy requested.'},
  {family:'carbon',register:'MB-HANDOVER',title:'Mara — final handover carbon',text:'15 December 2006, 16:30. Blue envelope received by Facilities with Mara Bell’s farewell message inside. Dana North signed for safekeeping. Tess may request its return. Retain this carbon with Mara’s annotated letter so the message can be recovered and a desk copy pinned.'}
 ]
];

/** Overlay only ordinary slots; never alter released generators or their placement schedules. */
export function expandRecords(base:Archive):Archive{
 const rng=random(base.seed^0x6e7a401b),overrides=new Map<number,ArchiveDocument>(),threadLocations=new Map<string,number[]>();
 const ordinary=(d:ArchiveDocument)=>d.category==='office'&&!d.story&&!d.source&&!d.fragment&&!d.voucher&&!base.special.has(d.id)&&d.id!==base.target&&!overrides.has(d.id);
 const eligible=(id:number)=>ordinary(base.get(id));
 THREADS.forEach((thread,t)=>{
  const ids:number[]=[];
  // All starts are in front drawers near the central aisle, then branch to other wings.
  for(let n=0;n<6;n++){
   const wing=n===0?[3,2,0][t]:(t+n)%4, cabinet=wing*128+(n===0?7:(n*16+7));
   const start=fileId(cabinet),end=start+128;
   let id=start+Math.floor(rng()*16);
   for(let tries=0;!eligible(id);tries++){if(tries>=128)throw new Error('No ordinary slot available for optional thread.');id=start+(id-start+1)%128;}
   if(id>=end)throw new Error('Invalid thread placement');
   ids.push(id);overrides.set(id,{...base.get(id),thread:thread.id});
  }
  threadLocations.set(thread.id,ids);
  ids.forEach((id,n)=>{
   const r=physical[t][n],next=ids[(n+1)%6],p=recordPresentation(r.family,r.register,r.text,r.annotation);
   if(t===1&&n===1){p.diagram={kind:'plan',labels:['Technical Services','R7 team','Annex staff']};delete p.table;}
   const doc:ArchiveDocument={id,title:r.title,kind:r.family==='contract'?'report':'memo',author:t===2?'Tess Morgan / retained correspondence':'Records / retained original',date:location(id).date,subject:thread.title,pages:[r.text+`\n\nRetained enclosure: ${reference(next)}.`],thread:thread.id,chapter:n,evidence:r.text,category:'evidence',bodyKey:`records-thread-${thread.id}-${n}`,presentation:p,next,previous:ids[(n+5)%6]};
   overrides.set(id,doc);
  });
 });
 const get=(id:number):ArchiveDocument=>{
  const kept=overrides.get(id);if(kept)return kept;
  const d=base.get(id);if((id&3)!==(base.seed&3)||!ordinary(d))return d;
  const v=RECORD_VARIANTS[(Math.imul(Math.floor(id/4),37)+(base.seed%48))%48];
  return {...d,title:v.title,kind:v.family==='contract'?'report':'memo',pages:[v.text],sheets:undefined,annotation:undefined,bodyKey:`records-${v.family}-${RECORD_VARIANTS.indexOf(v)}`,presentation:recordPresentation(v.family,`${v.family.toUpperCase()}-${id+1001}`,v.text,v.annotation)};
 };
 return {...base,recordPack:1,threadLocations,get};
}
export function threadReferences(archive:Archive,id:string){return (archive.threadLocations?.get(id)??[]).map(reference);}
export function threadEvidence(archive:Archive,id:string){const t=threadById(id),ids=archive.threadLocations?.get(id);return t&&ids?t.pair.map(n=>ids[n]):[];}
export function threadAvailable(archive:Archive,id:string){return !!archive.threadLocations?.has(id);}
export function packDepartment(id:number){return DEPARTMENTS[location(id).department];}
