// Frozen version-1 save validation and rules.
import type { Save, UpgradeId, Settings } from './types';
import { createArchive, type Archive } from './generator';
import { STORIES } from '../content/stories';
import { PHRASE, validId } from './archive';
export const SAVE_KEY='archive-office-save-v1';
export const UPGRADES: {id:UpgradeId;name:string;cost:number;description:string}[]=[
 {id:'drawers',name:'Runner oil',cost:18,description:'A little dignity for the drawers. Open them 20% faster.'},
 {id:'browsing',name:'Rubber finger caps',cost:24,description:'Turn folders 20% faster. Your hands have been promoted.'},
 {id:'summaries',name:'Drawer ledger',cost:30,description:'See searched-file totals on your archive map and drawer list.'},
 {id:'bookmarks',name:'Brass index tabs',cost:22,description:'Expand your retained-file bookmarks from 8 to 32.'},
 {id:'highlighter',name:'Keyword lens',cost:36,description:'Highlight one word on the page in front of you. No remote searching.'},
 {id:'index',name:'Retained records index',cost:48,description:'Narrow the original assessment to its retention month. Requires 80 inspected files.'}
];
export const DEFAULT_SETTINGS:Settings={sensitivity:1,volume:0.3,textSize:18,quality:'medium',reducedMotion:false};
export function freshSave(seed=7391):Save {return {version:1,seed,target:createArchive(seed).target,started:false,completed:false,position:[0,1.7,10],rotation:[0,0],inspected:[],searched:[],bookmarks:[],clues:[],claimedStories:[],claimedMilestones:[],credits:12,upgrades:[],hintLevel:0,selectedFile:null,selectedPhrase:'',messages:[],settings:{...DEFAULT_SETTINGS},playSeconds:0};}
const unique=(arr:number[])=>[...new Set(arr)];
export function inspect(save:Save,archive:Archive,id:number,revealCell=false) {
 const notifications:string[]=[];
 if(!save.inspected.includes(id)) {
  save.inspected.push(id);
  const n=save.inspected.length;
  if(n%8===0&&!save.claimedMilestones.includes(n)) {save.claimedMilestones.push(n);save.credits+=4;notifications.push('+4 supply credits · eight new files inspected');}
 }
 const d=archive.get(id);
 if((d.fragment||(d.story&&(!d.sheets||revealCell)))&&!save.clues.includes(id)) {
  save.clues.push(id);save.credits+=d.fragment?3:2;
  if(d.fragment) {save.hintLevel=Math.max(save.hintLevel,1);notifications.push('Index fragment retained · +3 credits');}
  else notifications.push('Evidence retained · +2 credits');
  if(d.story==='martin') notifications.push('New correspondence from Martin. Check your notebook.');
 }
 for(const story of STORIES) {
  if(archive.storyLocations.get(story.id)!.every(n=>save.clues.includes(n))&&!save.claimedStories.includes(story.id)) {
   save.claimedStories.push(story.id);save.credits+=story.reward;notifications.push(`${story.title} resolved · +${story.reward} credits`);
  }
 }
 return notifications;
}
export function buy(save:Save,id:UpgradeId):string {
 const u=UPGRADES.find(u=>u.id===id);if(!u)return 'Unknown equipment.';
 if(save.upgrades.includes(id))return 'Already installed.';
 if(id==='index'&&save.inspected.length<80)return 'Inspect 80 files before ordering the retained records index.';
 if(save.credits<u.cost)return 'Insufficient supply credits.';
 save.credits-=u.cost;save.upgrades.push(id);if(id==='index')save.hintLevel=Math.max(save.hintLevel,2);
 return `${u.name} installed.`;
}
export function confront(save:Save,archive:Archive):string {
 const count=archive.storyLocations.get('martin')!.filter(id=>save.clues.includes(id)).length;
 const stage=count>=6?3:count>=3?2:count>=1?1:0;
 if(!stage)return 'You need an original record connecting Martin to the write-off before you can challenge him.';
 if(save.messages.includes(String(stage)))return 'Martin has stopped replying. More original evidence may change his mind.';
 save.messages.push(String(stage));save.hintLevel=Math.max(save.hintLevel,stage);
 return stage===1?'YOU: Why did you replace the summary?\nMARTIN: Routine administration. If you must know, try the department on the retained index. Please keep this between us.':stage===2?'YOU: The original approval is yours. Elise was away.\nMARTIN: You are misreading the dates. I have sent the retention month. There is no need to circulate this.':'YOU: I have the uncut thread and the release authority.\nMARTIN: …I have sent the cabinet group. Bring me the original. The whole original. Please.';
}
export function canSubmit(save:Save,archive:Archive) {return save.selectedFile!==null&&save.selectedFile===archive.target&&(!save.selectedPhrase||save.selectedPhrase.toLowerCase().includes(PHRASE));}
export function validateSave(input:unknown):Save {
 if(!input||typeof input!=='object')throw new Error('This is not an archive save.');
 const s=input as Save;
 if(s.version!==1)throw new Error('Unsupported save version.');
 if(!Number.isInteger(s.seed)||s.seed<0||s.seed>4294967295||!validId(s.target)||s.target!==createArchive(s.seed).target)throw new Error('Archive seed or target is invalid.');
 for(const key of ['started','completed'] as const)if(typeof s[key]!=='boolean')throw new Error(`Invalid ${key} flag.`);
 for(const key of ['inspected','searched','bookmarks','clues'] as const)if(!Array.isArray(s[key])||s[key].length>4096||!s[key].every(validId)||unique(s[key]).length!==s[key].length)throw new Error(`Invalid ${key} list.`);
 if(!Array.isArray(s.position)||s.position.length!==3||!s.position.every(Number.isFinite)||Math.abs(s.position[0])>22||s.position[1]!==1.7||s.position[2]<-49||s.position[2]>14)throw new Error('Invalid player position.');
 if(!Array.isArray(s.rotation)||s.rotation.length!==2||!s.rotation.every(Number.isFinite)||Math.abs(s.rotation[0])>Math.PI/2||Math.abs(s.rotation[1])>Math.PI*2)throw new Error('Invalid camera rotation.');
 if(!Number.isInteger(s.credits)||s.credits<0||s.credits>100000||!Number.isFinite(s.playSeconds)||s.playSeconds<0)throw new Error('Invalid progress totals.');
 if(!Array.isArray(s.upgrades)||!s.upgrades.every(id=>UPGRADES.some(u=>u.id===id))||new Set(s.upgrades).size!==s.upgrades.length)throw new Error('Invalid equipment list.');
 if(!Array.isArray(s.claimedStories)||!s.claimedStories.every(id=>STORIES.some(st=>st.id===id))||!Array.isArray(s.claimedMilestones)||!s.claimedMilestones.every(n=>Number.isInteger(n)&&n>0&&n<=4096&&n%8===0))throw new Error('Invalid reward history.');
 if(!Array.isArray(s.messages)||!s.messages.every(m=>['1','2','3'].includes(m))||!Number.isInteger(s.hintLevel)||s.hintLevel<0||s.hintLevel>3)throw new Error('Invalid correspondence.');
 if(s.selectedFile!==null&&!validId(s.selectedFile))throw new Error('Invalid submission file.');
 if(typeof s.selectedPhrase!=='string'||s.selectedPhrase.length>2000)throw new Error('Invalid selected text.');
 const cfg=s.settings;
 if(!cfg||!Number.isFinite(cfg.sensitivity)||cfg.sensitivity<0.2||cfg.sensitivity>3||!Number.isFinite(cfg.volume)||cfg.volume<0||cfg.volume>1||!Number.isFinite(cfg.textSize)||cfg.textSize<14||cfg.textSize>26||!['low','medium','high'].includes(cfg.quality)||typeof cfg.reducedMotion!=='boolean')throw new Error('Invalid settings.');
 // Return a clean object: imported data cannot install unexpected properties.
 return {version:1,seed:s.seed,target:s.target,started:s.started,completed:s.completed,position:[...s.position],rotation:[...s.rotation],inspected:[...s.inspected],searched:[...s.searched],bookmarks:[...s.bookmarks],clues:[...s.clues],claimedStories:[...new Set(s.claimedStories)],claimedMilestones:unique(s.claimedMilestones),credits:s.credits,upgrades:[...s.upgrades],hintLevel:s.hintLevel,selectedFile:s.selectedFile,selectedPhrase:s.selectedPhrase,messages:[...new Set(s.messages)],settings:{sensitivity:cfg.sensitivity,volume:cfg.volume,textSize:cfg.textSize,quality:cfg.quality,reducedMotion:cfg.reducedMotion},playSeconds:s.playSeconds};
}
export function loadSave(storage:Pick<Storage,'getItem'>):{save:Save;error?:string} {
 try {const raw=storage.getItem(SAVE_KEY);return {save:raw?validateSave(JSON.parse(raw)):freshSave()};}catch(e){return {save:freshSave(),error:`Saved progress could not be read: ${e instanceof Error?e.message:'storage unavailable'}. A fresh archive is ready; the old save has not been overwritten.`};}
}
export function persist(save:Save,storage:Pick<Storage,'setItem'>):string|undefined {try{storage.setItem(SAVE_KEY,JSON.stringify(save));}catch{return 'Browser storage is unavailable or full. Export a backup from the pause menu to keep your progress.';}}
