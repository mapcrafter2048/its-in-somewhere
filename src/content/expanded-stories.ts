import { STORIES } from './stories';
import { SCENARIOS } from './scenarios';
import type { Story, StoryChapter, Sheet } from '../types';
const artifacts=['Initial correspondence','Retained supporting record','Response to the enquiry','Private follow-up','Original evidence','Resolution on file'];
const voices=['Reception retained the original rather than the corrected copy. The timestamps below describe the events, not the archive batch date.',
 'The supporting record was filed separately from the first message. Its author asked that the original wording remain attached to the enquiry.',
 'This response was supplied after the discrepancy was raised. A clean copy was requested, but Records retained the earlier version as well.',
 'The private follow-up reached the archive as an enclosure. It changes the meaning of the first account; it does not replace that account.',
 'The original was checked against the response. Records retained both so that a later reader could distinguish an explanation from a correction.',
 'The final correspondence closes the enquiry. Earlier records remain attached because the conclusion makes little sense without them.'];
function sheet(claim:string,record:string):Sheet{return {name:'Retained comparison',columns:['Version','Account'],rows:[[{value:'Submitted account'},{value:claim}],[{value:'Retained original'},{value:record,comment:'Original comment retained with the unedited record. Compare the two accounts.',clue:true}]],hiddenRows:[1]};}
export const SHORT_STORIES:Story[]=SCENARIOS.slice(0,32).map(s=>({
 id:`short-${s.id}`,title:s.title,description:s.fragments[0],ending:s.fragments[5],reward:8,
 chapters:Array.from({length:3},(_,i):StoryChapter=>({title:`${s.title} — ${['the first account','the awkward reply','what actually happened'][i]}`,kind:i===1?'spreadsheet':i===2?'report':'email',
 text:`${s.fragments[i*2]}\n\n${s.fragments[i*2+1]}\n\n${voices[i*2]}`,evidence:s.fragments[i*2+1],sheet:i===1?sheet(s.fragments[2],s.fragments[3]):undefined}))
}));
const longIndices=[32,34,40,47,57,64,69,73,76,82,88,95];
export const LONG_STORIES:Story[]=longIndices.map(n=>{const s=SCENARIOS[n];return {id:`long-${s.id}`,title:s.title,description:s.fragments[0],ending:s.fragments[5],reward:24,
 chapters:s.fragments.map((text,i):StoryChapter=>({title:`${s.title} — ${artifacts[i].toLowerCase()}`,kind:(['email','report','letter','calendar','spreadsheet','memo'] as const)[i],
 text:`${text}\n\n${voices[i]}\n\n${i<5?'The enclosure reference on this copy identifies the next retained record. Please keep this page with the complete thread.':'The case is closed. The original documents remain available for inspection; no additional declaration is required.'}`,evidence:text,sheet:i===4?sheet(s.fragments[2],s.fragments[4]):undefined}))};});
export const ALL_STORIES:Story[]=[...STORIES,...SHORT_STORIES,...LONG_STORIES];
