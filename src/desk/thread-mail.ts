import type { Save } from '../types';
import type { Archive } from '../content/generator';
import { reference } from '../archive';
import { THREADS, threadById, threadEvidence, type Thread } from '../content/packs/records';
import type { Contact, MailDraft, DeskMail } from './types';
import type { ConversationNode, ConversationOption } from './conversations';
import { CASES } from './content';

export function availableThreads(save:Save){return save.recordPack===1?THREADS:[];}
export function mailCases(save:Save,recipient:Contact){return [...CASES.filter(c=>c.contact===recipient),...availableThreads(save).filter(t=>t.contacts.includes(recipient)).map(t=>({id:t.id,title:t.title,contact:recipient,intro:t.intro,resolution:t.notice,items:[]}))];}
export function discoveredThreads(save:Save,archive:Archive){return availableThreads(save).filter(t=>(archive.threadLocations?.get(t.id)??[]).some(id=>save.inspected.includes(id))||save.deskLife?.mail.some(m=>m.caseId===t.id));}
export function threadNode(save:Save,archive:Archive,_draft:MailDraft,t:Thread):ConversationNode{
 const resolved=!!save.deskLife?.resolved.includes(t.id),seen=(archive.threadLocations?.get(t.id)??[]).some(id=>save.inspected.includes(id));
 const stage=resolved?'resolved':seen?'discussion':'enquiry',prefix=`${t.id}:${stage}:inquiry`;
 const options:ConversationOption[]=[
  {id:`${prefix}:clarify`,intent:'clarify',label:resolved?'What was corrected?':'Which retained accounts should I compare?',reply:t.intro,topic:'inquiry'},
  {id:`${prefix}:evidence`,intent:'evidence',label:resolved?'Please confirm the retained correction.':'Please review these two original accounts.',reply:'Your evidence has been received.',topic:'evidence',locked:threadEvidence(archive,t.id).every(id=>save.inspected.includes(id)&&save.clues.includes(id))?undefined:'Read the two supporting originals, or ask for clarification.'},
  {id:`${prefix}:levity`,intent:'levity',label:t.id==='duplicate'?'Does a duplicate double the authorised quantity?':t.id==='department'?'Can a department be filed under its old room?':'Does a farewell message have a retention period?',reply:t.id==='friday'?'Longer than we intended. Thank you for looking.':'The filing system has considered this and requested a clearer question.',topic:'inquiry'}
 ];
 return {id:prefix,stage,options};
}
export function sendThreadMail(save:Save,archive:Archive,draft:MailDraft,t:Thread){
 const d=save.deskLife!;
 if(save.recordPack!==1||!archive.threadLocations?.has(t.id)||!t.contacts.includes(draft.recipient))throw new Error('Choose a colleague connected with this correspondence.');
 if(typeof draft.body!=='string'||draft.body.length>4000||!Array.isArray(draft.attachments)||draft.attachments.length>2||new Set(draft.attachments).size!==draft.attachments.length||draft.attachments.some(id=>!save.inspected.includes(id)))throw new Error('Attach up to two previously opened originals.');
 const option=threadNode(save,archive,draft,t).options.find(o=>o.id===draft.choice);
 if(!option)throw new Error('Choose a current response before sending.');
 if(option.locked)throw new Error(option.locked);
 const evidence=threadEvidence(archive,t.id),ids=archive.threadLocations!.get(t.id)!;
 const enough=evidence.length===2&&evidence.every(id=>draft.attachments.includes(id)&&save.clues.includes(id));
 const resolves=option.intent==='evidence'&&enough?t.id:undefined;
 const voice=replyVoice(t.id,draft.recipient,!!resolves);
 const text=resolves?`${voice}\n\n${t.notice}\n\nThe originals remain filed. No further action is required; you may return to Martin’s sentence.`:option.intent==='evidence'?`${voice}\n\nPlease attach ${evidence.map(reference).join(' and ')}. Those two accounts establish the correction. You can resend after checking them.`:`${option.reply}\n\n${voice}\n\nFirst retained account: ${reference(ids[0])}. For the correction compare ${evidence.map(reference).join(' and ')}. Enclosures on the originals lead through the remaining records.`;
 const signature=JSON.stringify(['record-pack',t.id,draft.recipient,option.intent,[...draft.attachments].sort((a,b)=>a-b)]);
 if(d.mail.some(m=>m.signature===signature))return {duplicate:true};
 if(d.mail.length>1000)throw new Error('The correspondence binder is full. Existing messages remain available.');
 const outgoing:DeskMail={...structuredClone(draft),topic:option.topic,id:d.nextMail++,direction:'out',subject:`${t.title} / retained enquiry`,text:option.label+(draft.body?'\n\nPersonal note:\n'+draft.body:''),sentAt:save.playSeconds,due:save.playSeconds,read:true,signature};
 let hash=0;for(const c of signature)hash=(Math.imul(hash,31)+c.charCodeAt(0))>>>0;
 d.mail.push(outgoing,{...outgoing,id:d.nextMail++,direction:'in',subject:`Re: ${t.title}`,text,attachments:[],due:save.playSeconds,read:false,resolves});
 // Same active-shift delivery window as ordinary mail; no wall-clock deadline.
 d.mail[d.mail.length-1].due=save.playSeconds+30+((hash^save.seed)>>>0)%61;
 d.responses.push({choice:option.id,mail:outgoing.id,at:save.playSeconds});d.counters.mailSent++;d.drafts=[];
 return {duplicate:false};
}
function replyVoice(id:string,recipient:Contact,confirmed:boolean){
 if(!confirmed)return recipient==='martin'?'Martin: Please retain the dated source before interpreting the replacement cover.':recipient==='accounts'?'Accounts: I can review a correction once the two supporting originals are attached.':recipient==='facilities'?'Facilities: Historical room names and handovers need their retained source records.':'Tess: Thank you for looking. Keep the second account with the first; there is no rush.';
 if(id==='duplicate')return recipient==='martin'?'Martin: I used the replacement cover. It appears that packaging was allowed to exercise purchasing authority. Accounts has my written correction.':'Accounts: The signed instruction and fax agree. The unsigned amendment cannot enlarge that approval.';
 if(id==='department')return recipient==='accounts'?'Accounts: R7 remains a valid historic alias. I have corrected the departmental description without rewriting the old invoices.':'Facilities: We moved the team, not its existence. The plan and signed agreement are the records I needed.';
 return recipient==='tess'?'Tess: I thought the blue envelope would keep the message safe. Thank you for finding where safe turned out to be.':'Facilities: The blue envelope is accounted for. I have returned the message and pinned a desk copy with Tess’s agreement.';
}
export function threadNotices(save:Save){return availableThreads(save).filter(t=>save.deskLife?.resolved.includes(t.id));}
export function isThreadCase(id:string){return !!threadById(id);}
