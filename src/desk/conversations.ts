import { threadById } from '../content/packs/records';
import { threadNode } from './thread-mail';
import type { Save } from '../types';
import type { Archive } from '../content/generator';
import { CASES } from './content';
import type { MailDraft, MailTopic } from './types';
export type ResponseIntent = 'clarify' | 'evidence' | 'levity';
export interface ConversationOption { id: string; intent: ResponseIntent; label: string; reply: string; topic: MailTopic; locked?: string }
export interface ConversationNode { id: string; stage: 'enquiry' | 'discussion' | 'resolved'; options: ConversationOption[] }
const voices: Record<string, [string, string, string]> = {
 fridge: ['Was the sandwich actually logged before it disappeared?', 'These two accounts disagree about the refrigerator.', 'Should I interview the yoghurt separately?'],
 betting: ['Who authorised the catering forecast?', 'The workbook and the betting terms tell different stories.', 'Am I entitled to bet on my own lunch break?'],
 ghost: ['Which desk was assigned to Ellis Ward?', 'Payroll and Facilities disagree about this employee.', 'Does the cupboard qualify for annual leave?'],
 'long-47': ['What exactly did the tea allocation purchase?', 'The order and the club account do not reconcile.', 'Is ceremonial tea exempt from arithmetic?'],
 'long-57': ['When was the copier actually available?', 'The repair record contradicts the priority-pass sales.', 'Can I buy priority access to the complaints queue?'],
 'short-27': ['Who was included in the survey denominator?', 'The survey and the workbook give different totals.', 'Was dissatisfaction removed for typographical reasons?'],
 martin: ['Which version of the assessment should I trust?', 'I have retained the records connecting you to the revision.', 'Would you prefer the inconvenient dates in a smaller font?']
};
const jokes: Record<string,string> = {
 fridge:'The yoghurt is declining interviews. Start with the human witness; their account is filed in the archive.',
 betting:'Accounts cannot endorse wagering on an investigation into wagering. The original terms are still worth reading.',
 ghost:'The cupboard has requested a window before discussing leave. Please compare the facilities ticket with payroll.',
 'long-47':'Ceremony does not change the total. It does apparently require a silver spoon. Retain the original orders.',
 'long-57':'Complaints are first come, first ignored. The repair record has a more reliable date than the passes.',
 'short-27':'Typography has been blamed for worse. Check who actually responded before accepting the percentage.',
 martin:'The font is entirely adequate. I would prefer fewer interpretations of the dates.'
};
export function conversationNode(save: Save, archive: Archive, draft: MailDraft): ConversationNode {
 const thread=threadById(draft.caseId);if(thread&&save.recordPack===1)return threadNode(save,archive,draft,thread);
 const key=draft.caseId, records=archive.storyLocations.get(key)??[];
 const seen=records.filter(id=>save.inspected.includes(id)), evidence=records.filter(id=>save.clues.includes(id)&&save.inspected.includes(id));
 const resolved=key==='martin'?save.messages.includes('3'):!!save.deskLife?.resolved.includes(key);
 const discussed=seen.length>0||!!save.deskLife?.mail.some(m=>m.caseId===key&&m.direction==='in'&&m.read);
 const stage=resolved?'resolved':discussed?'discussion':'enquiry';
 const topic=['lead','location'].includes(draft.topic)?draft.topic:'inquiry';
 const nodeId=`${key}:${stage}:${topic}`;
 const labels=voices[key]??voices.fridge;
 const joked=!!save.deskLife?.responses.some(r=>r.choice.startsWith(`${key}:`)&&r.choice.endsWith(':levity'));
 const clarification=joked&&stage==='discussion'?`Back to the paperwork: ${labels[0]}`:labels[0];
 const c=CASES.find(c=>c.id===key);
 const make=(intent:ResponseIntent,label:string,reply:string,t:MailTopic,locked?:string):ConversationOption=>({id:`${nodeId}:${intent}`,intent,label,reply,topic:t,locked});
 if(topic==='lead'||topic==='location') return {id:nodeId,stage,options:[
  make('clarify','Could you narrow down where this object was filed?','I have checked the retained location below.',topic),
  make('evidence','I have started the case. Is this keepsake connected?','Yes. Its location is retained below; the object itself is not assignment evidence.',topic,discussed?undefined:'Open a record or read a reply from this case first.'),
  make('levity','Where do administratively insignificant objects retire?','Under the records, naturally. Retirement does not exempt an object from filing.',topic)
 ]};
 const threshold=key==='martin'?1:2;
 return {id:nodeId,stage,options:[
  make('clarify',resolved?'What should I retain now that this is settled?':clarification,resolved?`Keep the original records together. ${c?.resolution??'The revised assessment remains on file.'}`:stage==='discussion'?'Compare the dates and authors, not just the titles. The physical records remain the authoritative accounts.':key==='martin'?'Retain an original assessment record connecting me to the revision before asking for a specific filing hint.':'I have included the first filing reference. Please read the original before drawing conclusions.',key==='martin'?'martin':'inquiry'),
  make('evidence',resolved?'Please confirm the conclusion against these records.':labels[1],key==='martin'?'You have retained the context. My response to that evidence follows.':'Your comparison has been received. The conclusion follows.',key==='martin'?'martin':'evidence',evidence.length>=threshold?undefined:`Uncover ${threshold} ${key==='martin'?'assessment record':'different evidence records'} in the physical archive first.`),
  make('levity',labels[2],jokes[key]??jokes.fridge,key==='martin'?'martin':'inquiry')
 ]};
}
