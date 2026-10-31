import type { ArchiveDocument, DocumentKind } from '../types';
import { DEPARTMENTS, location } from '../archive';
export const TOPICS=[
 ['the visitor badge system','A badge can be disabled without removing its visit record.','Temporary badges expire at the end of the booked day.','Visitors must return their badges to reception.','A replacement requires the host to verify the visitor.'],
 ['the cooling-water inspection','The return pipe has a separate temperature sensor.','The pump is isolated before its cover is removed.','Inspection results are compared with the previous service.','Any leak requires a work order before restarting.'],
 ['the document retention schedule','Signed originals and working copies use different retention periods.','A legal hold overrides ordinary disposal dates.','The archive records who approved each disposal.','Personal notes must not obscure an original signature.'],
 ['the translation workflow','A second reader checks names and numerical units.','A glossary records agreed technical terms.','The customer receives both the source and translated text.','Changes after approval require a dated revision.'],
 ['the software release checklist','The deployment account cannot approve its own release.','A rollback package is tested before the change window.','The change log identifies user-visible differences.','Credentials are excluded from support attachments.'],
 ['the stock measurement procedure','Opened cartons are counted separately from sealed stock.','Damaged items remain in the ledger until disposal is approved.','A second counter checks high-value components.','Transfers between departments are recorded on both sides.'],
 ['the workshop tool register','Calibration dates are marked on measuring instruments.','A missing tool is reported before the end of a shift.','Loaned equipment retains its original asset number.','Returned tools are checked before becoming available.'],
 ['the accessible meeting room','The doorway must remain clear during furniture changes.','A booking must specify any required hearing equipment.','The table arrangement includes a wheelchair turning space.','Temporary cables must not cross the accessible route.'],
 ['the backup restoration drill','A successful backup does not prove that restoration works.','The test uses an isolated copy of the system.','The restored record count is checked against the source.','The final report records elapsed restoration time.'],
 ['the print-room job queue','Proof copies are marked before the full run begins.','Duplex jobs use the approved paper grain direction.','A colour reference is retained with the signed proof.','Interrupted runs are counted before printing resumes.'],
 ['the research specimen cabinet','Each container has a stable specimen number.','The collection location is recorded separately from the storage location.','Light-sensitive samples remain in opaque sleeves.','Loans require a named receiving institution.'],
 ['the internal telephone directory','Extensions belong to roles as well as named employees.','Departed employees are removed from the public directory promptly.','Call forwarding is reviewed after a desk move.','Emergency numbers are checked by Facilities.'],
 ['the supplier qualification file','Financial details are verified through an independent contact.','A supplier cannot approve changes to its own payment instructions.','The purchasing team records relevant conflicts of interest.','Expired certificates are retained with their replacements.'],
 ['the room air-quality survey','Measurements are taken at occupied desk height.','Outdoor conditions are recorded with indoor readings.','The sensor is checked against a reference instrument.','Ventilation changes are tested before declaring improvement.'],
 ['the incoming mail register','The envelope and its contents share one receipt reference.','Misaddressed post is returned without changing the original address.','Registered items require a receiving signature.','Personal mail is separated before routine distribution.'],
 ['the training attendance record','Attendance alone does not establish practical competence.','The trainer records which exercise each attendee completed.','Missed sessions can be rescheduled without a fresh application.','Assessment records remain separate from general feedback.'],
 ['the purchase order amendment','A quantity increase requires fresh budget approval.','The old order remains visible after amendment.','The supplier acknowledges the revised delivery date.','The receiving team gets the final approved version.'],
 ['the door access review','Access rights are matched to current duties.','A lost key is not resolved by issuing an unrecorded spare.','Contractor access expires at the contract end date.','Override events are reviewed by someone outside the shift.'],
 ['the archive shelving inspection','Shelf loads are checked against the rated capacity.','Heavy volumes belong below shoulder height.','A damaged runner is labelled before the drawer is used again.','New labels must not cover the cabinet reference.'],
 ['the laboratory notebook procedure','Observations are recorded before conclusions.','A correction leaves the original entry readable.','Units accompany every measured value.','A second signature confirms review rather than authorship.']
] as const;
const PHASES=[
 ['ticket','Service desk ticket','Observed condition','Requested action','Acceptance check'],
 ['proposal','Project proposal','Current arrangement','Proposed change','Decision required'],
 ['training','Training handout','Learning objective','Practical exercise','Evidence of completion'],
 ['transcript','Meeting transcript','Administrator','Technician','Chair’s decision'],
 ['maintenance','Maintenance instruction','Before starting','During inspection','Before returning to service'],
 ['survey','Survey summary','Question raised','Responses received','Follow-up agreed'],
 ['report','Review report','Finding','Supporting record','Recommendation'],
 ['memo','Operating memorandum','Scope','Responsibility','Retention instruction'],
 ['visitor','Visitor register','Purpose of visit','Host verification','Departure check'],
 ['resignation','Unsent resignation draft','Reason for writing','Unresolved responsibility','Requested handover'],
 ['complaint','Formal complaint','Published requirement','Observed practice','Requested remedy'],
 ['research','Annotated research note','Working observation','Question for review','Next comparison']
] as const;
const STAFF=['Priya Nair','Tess Morgan','Kit Ames','Imani Cole','Elise Hart','Dana North','Noor Ali','Theo Marsh'];
export const OFFICE_BODIES=TOPICS.flatMap((topic,t)=>PHASES.map((phase,p)=>({
 key:`procedure-${t}-${p}`,title:`${phase[1]}: ${topic[0]}`,kind:phase[0] as DocumentKind,
 text:phase[0]==='visitor'?`VISITOR REGISTER / ${topic[0]}\nArrival: 09:30. Departure: 10:45. Visitor: approved service representative. Purpose: review ${topic[0]}.\nHost verification: ${topic[1]}\nFollow-up left with the host: ${topic[2]}`:phase[0]==='resignation'?`DRAFT / NOT SENT\nI am considering leaving responsibility for ${topic[0]}. The written requirement is clear: ${topic[1]} Yet the authority and time to meet it have not been provided.\nBefore this becomes a resignation, I would like a written decision on the following: ${topic[2]}\nPlease treat this as a request for a workable handover rather than another opportunity to thank me for my flexibility.`:phase[0]==='complaint'?`Published requirement: ${topic[1]}\nI was instructed to bypass this check so the monthly report could be closed on time. The instruction was verbal; my request for written confirmation has not been answered.\nThe associated responsibility is also explicit: ${topic[3]} I am requesting an independent review and a correction to the workload plan.`:phase[0]==='research'?`Working note on ${topic[0]}.\nOur starting observation is recorded as follows: ${topic[1]} This describes the intended procedure. It does not establish that the procedure was followed.\nFor the next review, compare the original log with the corrected copy. In particular: ${topic[4]} Mark observed facts separately from assumptions.`:[`${phase[2]}: ${topic[1+(p%4)]}`,`${phase[3]}: ${topic[1+((p+1)%4)]}`,`${phase[4]}: ${topic[1+((p+2)%4)]}`].join('\n')
})));
export function ordinaryDocument(id:number,ordinal:number,seed:number):ArchiveDocument{
 const loc=location(id),body=OFFICE_BODIES[(ordinal*37+(seed%OFFICE_BODIES.length))%OFFICE_BODIES.length];
 const cycle=Math.floor(ordinal/OFFICE_BODIES.length),author=STAFF[(ordinal+cycle)%STAFF.length];
 // A paragraph is a whole structured record; the 240 body variants rotate without a local repeat.
 const text=body.text;
 const doc:ArchiveDocument={id,title:body.title,kind:body.kind,author,date:loc.date,subject:`${DEPARTMENTS[loc.department]} / operational record ${id+1001}`,pages:[text],category:'office',bodyKey:body.key};
 if(body.kind==='visitor')doc.sheets=[{name:'Visitor register',columns:['Arrival','Visitor','Host','Departure'],rows:[[{value:'09:30'},{value:'Service representative'},{value:author},{value:'10:45',comment:'Badge returned to Reception; follow-up record sent to the host.'}]]}];
 else if(ordinal%7===0)doc.sheets=[{name:'Action register',columns:['Action','Owner','State'],rows:[[{value:body.title},{value:author},{value:'Awaiting review',comment:'The review confirms this batch only. Retain any previous approval separately.'}],[{value:'Close work order'},{value:'Department administrator'},{value:'Pending verification'}]]}];
 return doc;
}
