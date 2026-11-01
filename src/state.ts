import { STATIONERY_BACKUP_KEY } from './desk/stationery';
import {freshDesk, migrateDesk, validateDesk, DESK_BACKUP_KEY, DESKTOP_BACKUP_KEY} from './desk/state';
import {migrateInventory,carriedDocuments,inventoryCapacity} from './inventory';
import {ENVIRONMENT_VERSION,NOOK,NOOK_SPAWN} from './hub-layout';
import {freshPhysical,validatePhysical} from './physical';
import {freshOffice,validateOffice} from './office-state';
import {validateBoards} from './whiteboard';
import type { Save, UpgradeId, Settings, CabinetMarker } from './types';
import { createArchive, makeLegacyBindings, type Archive } from './content/generator';
import { ALL_STORIES } from './content/expanded-stories';
import { PHRASE, validId, fromLegacyId, toLegacyId, STORAGE_UNITS, BASE_TOTAL, TOTAL, FILES, unitForFile } from './archive';
import { validateSave as validateLegacy, SAVE_KEY as LEGACY_KEY } from './legacy/state';
import type { Save as OldSave } from './legacy/types';
export const SAVE_KEY='archive-office-save-v3';
export const PREVIOUS_SAVE_KEY='archive-office-save-v2';
export const INVENTORY_BACKUP_KEY='archive-office-before-inventory';
export const EXPANSION_BACKUP_KEY='archive-office-before-expanded-storage';
export const ENVIRONMENT_BACKUP_KEY='archive-office-before-warehouse';
export const LEGACY_BACKUP_KEY='archive-office-v1-backup';
export const UPGRADES:{id:UpgradeId;name:string;cost:number;description:string}[]=[
 {id:'drawers',name:'Runner oil',cost:18,description:'Open drawers 20% faster. Facilities calls this a capital improvement.'},
 {id:'browsing',name:'Rubber finger caps',cost:24,description:'Move between folders 20% faster. We shortened the animation. Facilities will claim they lubricated something.'},
 {id:'summaries',name:'Drawer ledger',cost:30,description:'See searched-file totals on your map and drawer contents slip. Counting has been delegated.'},
 {id:'bookmarks',name:'Five-file satchel',cost:22,description:'Carry 5 documents instead of 2. Your shoulders were not consulted.'},
 {id:'highlighter',name:'Keyword lens',cost:36,description:'Highlight one word on the current page. It will not become relevant merely because you highlighted it.'},
 {id:'index',name:'Retained records index',cost:48,description:'Narrow the original to its wing, department and retention month after 80 inspections. The index believes in character building.'},
 {id:'comparison',name:'Comparison stand',cost:40,description:'Read two retained documents side by side, including workbooks. Your short-term memory has requested assistance.'},
 {id:'stationery',name:'Personal stationery',cost:24,description:'Expand your notebook from 12 to 36 sheets. We noticed you writing smaller. This seemed kinder.'},
 {id:'pinboard',name:'Larger personal pinboard',cost:40,description:'Expand the board from 8 pinned notes to 24. The conspiracy has exceeded its original layout.'},
 {id:'sticky-capacity',name:'Additional sticky-note pads',cost:24,description:'Keep 24 reusable sticky notes instead of 8. Your theory has requested additional wall space.'},
 {id:'sticky-colours',name:'Coloured sticky notes',cost:16,description:'Unlock rose, blue and sage sticky paper. Yellow can only carry so much narrative responsibility.'},
 {id:'tabs',name:'Coloured cabinet tabs',cost:28,description:'Mark up to 64 cabinets with a colour and a short note, visible in the room and map. Future you may send a thank-you memo.'}
];
export const DEFAULT_SETTINGS:Settings={sensitivity:1,volume:0.3,textSize:18,quality:'medium',reducedMotion:false};
export function freshSave(seed=7391):Save{const a=createArchive(seed,undefined,undefined,3,1);return {recordPack:1,deskLife:freshDesk(),inventoryVersion:1,environmentVersion:ENVIRONMENT_VERSION,zone:'archive',physical:freshPhysical(),office:freshOffice(),whiteboards:[[],[],[],[]],version:3,contentVersion:3,placementVersion:3,seed,target:a.target,wing:NOOK.wing,started:false,completed:false,position:[...NOOK_SPAWN],rotation:[0,0],inspected:[],searched:[],bookmarks:[],clues:[],claimedStories:[],claimedMilestones:[],credits:12,upgrades:[],hintLevel:0,selectedFile:null,selectedPhrase:'',messages:[],settings:{...DEFAULT_SETTINGS},playSeconds:0,collectedVouchers:[],redeemedVouchers:[],markers:[],earlyVouchers:[...a.earlyVouchers]};}
export function migrateLegacy(input:unknown):Save{
 const old:OldSave=validateLegacy(input),legacy=makeLegacyBindings(old.seed,old.inspected);
 const early:number[]=[];const occupied=new Set([legacy.target,...Object.values(legacy.storyLocations).flat(),...legacy.inspected]);
 const base=fromLegacyId(7*32);for(let id=base;id<base+FILES*4&&early.length<2;id++)if(!occupied.has(id))early.push(id);
 if(early.length<2)for(let id=0;id<TOTAL&&early.length<2;id++)if(!occupied.has(id)&&!early.includes(id))early.push(id);
 return migrateDesk(migrateInventory({...old,position:[old.position[0],1.7,Math.min(3.5,old.position[2])],environmentVersion:ENVIRONMENT_VERSION,zone:'archive',physical:freshPhysical(),office:freshOffice(),whiteboards:[[],[],[],[]],version:3,contentVersion:3,placementVersion:2,wing:0,target:legacy.target,inspected:old.inspected.map(fromLegacyId),searched:old.searched.map(fromLegacyId),bookmarks:old.bookmarks.map(fromLegacyId),clues:old.clues.map(fromLegacyId),
  selectedFile:old.selectedFile===null?null:fromLegacyId(old.selectedFile),upgrades:[...old.upgrades],legacy,collectedVouchers:[],redeemedVouchers:[],markers:[],earlyVouchers:early}));
}
export function inspect(save:Save,archive:Archive,id:number,revealCell=false){
 const notes:string[]=[];if(!save.inspected.includes(id))save.inspected.push(id);
 const d=archive.get(id);if(d.thread&&!save.clues.includes(id)){save.clues.push(id);notes.push('Optional correspondence retained in your notebook.');}
 if((d.fragment||(d.story&&(!d.sheets||revealCell)))&&!save.clues.includes(id)){
  save.clues.push(id);save.credits+=d.fragment?3:2;notes.push(d.fragment?'Index fragment retained · +3 credits':'Evidence retained · +2 credits');
  if(d.fragment)save.hintLevel=Math.max(save.hintLevel,1);if(d.story==='martin')notes.push('Evidence retained for your next email to Martin. Visit the desk computer.');
 }
 // Only inspect the affected chain; opening ordinary folders does not scan every story.
 if(d.story){const story=ALL_STORIES.find(s=>s.id===d.story)!;if(!save.claimedStories.includes(story.id)&&archive.storyLocations.get(story.id)!.every(n=>save.clues.includes(n))){save.claimedStories.push(story.id);save.credits+=story.reward;notes.push(`${story.title} resolved · +${story.reward} credits`);}}
 return notes;
}
export function collectVoucher(save:Save,archive:Archive,id:number){
 if(!save.inspected.includes(id))return 'Open the file before collecting its voucher.';
 const voucher=archive.get(id).voucher;if(!voucher)return 'No supply voucher in this file.';
 if(save.collectedVouchers.includes(id))return 'Voucher already collected.';save.collectedVouchers.push(id);return `Collected ${voucher.value}-credit voucher. Redeem it at your W4 work nook desk.`;
}
export function pendingVoucherValue(save:Save,archive:Archive){const redeemed=new Set(save.redeemedVouchers);return save.collectedVouchers.reduce((n,id)=>n+(redeemed.has(id)?0:archive.get(id).voucher?.value??0),0);}
export function redeemVouchers(save:Save,archive:Archive){const redeemed=new Set(save.redeemedVouchers);let value=0;for(const id of save.collectedVouchers)if(!redeemed.has(id)){const voucher=archive.get(id).voucher;if(voucher){value+=voucher.value;save.redeemedVouchers.push(id);}}save.credits+=value;return value;}
export function buy(save:Save,id:UpgradeId){const u=UPGRADES.find(u=>u.id===id);if(!u)return 'Unknown equipment.';if(save.upgrades.includes(id))return 'Already installed.';if(id==='index'&&save.inspected.length<80)return 'Inspect 80 files before ordering the retained records index.';if(save.credits<u.cost)return 'Insufficient supply credits.';save.credits-=u.cost;save.upgrades.push(id);if(id==='index')save.hintLevel=Math.max(save.hintLevel,2);return `${u.name} installed.`;}
export function confront(save:Save,archive:Archive){const count=archive.storyLocations.get('martin')!.filter(id=>save.clues.includes(id)).length,stage=count>=6?3:count>=3?2:count>=1?1:0;if(!stage)return 'You need an original record connecting Martin to the write-off before you can challenge him.';if(save.messages.includes(String(stage)))return 'Martin has stopped replying. More original evidence may change his mind.';save.messages.push(String(stage));save.hintLevel=Math.max(save.hintLevel,stage);return stage===1?'YOU: Why did you replace the summary?\nMARTIN: Routine administration. I have sent the wing and department. Please keep this between us.':stage===2?'YOU: The original approval is yours. Elise was away.\nMARTIN: You are misreading the dates. I have sent the retention month. No need to circulate this.':'YOU: I have the uncut thread and release authority.\nMARTIN: …I have sent the cabinet group. Bring the whole original. Please.';}
export function setMarker(save:Save,marker:CabinetMarker){if(!save.upgrades.includes('tabs'))throw new Error('Order coloured cabinet tabs first.');if(!Number.isInteger(marker.cabinet)||marker.cabinet<0||marker.cabinet>=STORAGE_UNITS||!['gold','blue','rose','green'].includes(marker.color)||typeof marker.label!=='string'||!marker.label.trim()||marker.label.length>32)throw new Error('Choose a valid cabinet, colour, and label (up to 32 characters).');const existing=save.markers.findIndex(m=>m.cabinet===marker.cabinet);if(existing>=0)save.markers[existing]={...marker,label:marker.label.trim()};else {if(save.markers.length>=64)throw new Error('All 64 tabs are in use. Remove one first.');save.markers.push({...marker,label:marker.label.trim()});}}
export function readPage(save:Save,text:string){if(save.completed||!text.toLowerCase().includes(PHRASE))return false;save.completed=true;return true;}
export function canSubmit(save:Save,archive:Archive){return save.selectedFile!==null&&save.selectedFile===archive.target&&(!save.selectedPhrase||save.selectedPhrase.toLowerCase().includes(PHRASE));}
function idList(v:unknown,name:string):asserts v is number[]{if(!Array.isArray(v)||v.length>TOTAL||!v.every(validId)||new Set(v).size!==v.length)throw new Error(`Invalid ${name} list.`);}
export function validateSave(input:unknown):Save{
 if(!input||typeof input!=='object')throw new Error('This is not an archive save.');
 if((input as {version?:number}).version===1)return validateSave(migrateLegacy(input));
 const s=input as Save;if(s.recordPack!==undefined&&s.recordPack!==1)throw new Error('Unsupported record pack.');if(s.recordPack&& (s.version!==3||s.placementVersion!==3||s.legacy))throw new Error('Record pack requires a new shift.');if(s.inventoryVersion!==undefined&&s.inventoryVersion!==1)throw new Error('Unsupported inventory version.');if(s.environmentVersion!==undefined&&s.environmentVersion!==1&&s.environmentVersion!==ENVIRONMENT_VERSION)throw new Error('Unsupported environment version.');if(s.zone!==undefined&&!['hub','archive'].includes(s.zone))throw new Error('Invalid room.');if(!((s.version===2&&s.contentVersion===2)||(s.version===3&&s.contentVersion===3)))throw new Error('Unsupported archive or content version.');
 if(!Number.isInteger(s.seed)||s.seed<0||s.seed>4294967295)throw new Error('Invalid seed.');
 if(!Number.isInteger(s.wing)||s.wing<0||s.wing>3)throw new Error('Invalid wing.');
 for(const k of ['inspected','searched','bookmarks','clues','collectedVouchers','redeemedVouchers','earlyVouchers']as const){idList(s[k],k);if(s.version===2&&s[k].some(id=>id>=BASE_TOTAL))throw new Error('Invalid version-2 file reference.');}
 if(s.earlyVouchers.length!==2)throw new Error('Invalid early voucher placements.');
 if(s.bookmarks.length>32)throw new Error('Too many retained files.');
 if(s.legacy){
  const l=s.legacy;idList(l.inspected,'legacy inspected');idList(l.fragments,'legacy fragments');
  const expected=makeLegacyBindings(s.seed,l.inspected.map(id=>{const oldId=toLegacyId(id);if(oldId===null)throw new Error('Invalid legacy binding.');return oldId;}));
  if(l.target!==expected.target||JSON.stringify(l.storyLocations)!==JSON.stringify(expected.storyLocations)||JSON.stringify(l.fragments)!==JSON.stringify(expected.fragments))throw new Error('Legacy placement history is invalid.');
 }
 const placement=s.version===2?2:s.placementVersion;if(placement!==2&&placement!==3)throw new Error('Invalid placement version.');
 const a=createArchive(s.seed,s.legacy,s.earlyVouchers,placement,s.recordPack);if(s.target!==a.target)throw new Error('Archive target does not match its seed.');
 for(const flag of ['started','completed']as const)if(typeof s[flag]!=='boolean')throw new Error('Invalid game state.');
 if(!Array.isArray(s.position)||s.position.length!==3||!s.position.every(Number.isFinite)||Math.abs(s.position[0])>22||s.position[1]!==1.7||s.position[2]<(s.environmentVersion===undefined?-49:-49.6)||s.position[2]>(s.environmentVersion===undefined?(s.zone==='hub'?22:14):4.8))throw new Error('Invalid player position.');
 if(!Array.isArray(s.rotation)||s.rotation.length!==2||!s.rotation.every(Number.isFinite)||Math.abs(s.rotation[0])>Math.PI/2||Math.abs(s.rotation[1])>Math.PI*2)throw new Error('Invalid camera rotation.');
 if(!Number.isInteger(s.credits)||s.credits<0||s.credits>1000000||!Number.isFinite(s.playSeconds)||s.playSeconds<0)throw new Error('Invalid progress totals.');
 if(!Array.isArray(s.upgrades)||!s.upgrades.every(id=>UPGRADES.some(u=>u.id===id))||new Set(s.upgrades).size!==s.upgrades.length)throw new Error('Invalid equipment.');
 if(!Array.isArray(s.claimedStories)||!s.claimedStories.every(id=>ALL_STORIES.some(st=>st.id===id))||!Array.isArray(s.claimedMilestones)||!s.claimedMilestones.every(n=>Number.isInteger(n)&&n>0&&n<=4096&&n%8===0))throw new Error('Invalid reward history.');
 if(!Array.isArray(s.messages)||!s.messages.every(m=>['1','2','3'].includes(m))||!Number.isInteger(s.hintLevel)||s.hintLevel<0||s.hintLevel>3)throw new Error('Invalid correspondence.');
 if(s.selectedFile!==null&&!validId(s.selectedFile))throw new Error('Invalid submission.');if(typeof s.selectedPhrase!=='string'||s.selectedPhrase.length>2000)throw new Error('Invalid selected text.');
 if(s.redeemedVouchers.some(id=>!s.collectedVouchers.includes(id))||s.collectedVouchers.some(id=>!a.get(id).voucher||!s.inspected.includes(id)))throw new Error('Invalid voucher history.');
 if(!Array.isArray(s.markers)||s.markers.length>64||new Set(s.markers.map(m=>m.cabinet)).size!==s.markers.length)throw new Error('Invalid cabinet tabs.');
 for(const m of s.markers)if(!Number.isInteger(m.cabinet)||m.cabinet<0||m.cabinet>=STORAGE_UNITS||!['gold','blue','rose','green'].includes(m.color)||typeof m.label!=='string'||!m.label.trim()||m.label.length>32)throw new Error('Invalid cabinet tab.');
 const c=s.settings;if(!c||!Number.isFinite(c.sensitivity)||c.sensitivity<0.2||c.sensitivity>3||!Number.isFinite(c.volume)||c.volume<0||c.volume>1||!Number.isFinite(c.textSize)||c.textSize<14||c.textSize>26||!['low','medium','high'].includes(c.quality)||typeof c.reducedMotion!=='boolean')throw new Error('Invalid settings.');
 const office=validateOffice(s.office),physical=validatePhysical(s.physical,s.office,s.environmentVersion===undefined);
 if(s.environmentVersion===undefined){office.open=[];office.water=0;}
 const movedFromHub=s.environmentVersion===undefined&&s.zone==='hub';
 const migrated=migrateInventory({...structuredClone(s),inventoryVersion:s.version===2?undefined:s.inventoryVersion,version:3,contentVersion:3,placementVersion:placement,environmentVersion:ENVIRONMENT_VERSION,whiteboards:validateBoards(s.whiteboards),office,physical,zone:'archive',wing:movedFromHub?NOOK.wing:s.wing,position:movedFromHub?[...NOOK_SPAWN]:[s.position[0],1.7,s.environmentVersion===undefined?Math.min(3.5,s.position[2]):s.position[2]]});
 if(s.inventoryVersion!==1||s.version===2)validatePhysical(physical,office);
 const output=physical.copies?.find(c=>c.place==='printer-output');if((output?.file??null)!==office.printedFile)throw new Error('Printer output does not match its physical copy.');
 if(carriedDocuments(physical).length>inventoryCapacity(migrated))throw new Error('Carried document capacity exceeded.');
 migrated.deskLife=validateDesk(s.deskLife,migrated);
 return migrated;
}
export function backupInventory(storage:Pick<Storage,'getItem'|'setItem'>,raw:string){if(!storage.getItem(INVENTORY_BACKUP_KEY))storage.setItem(INVENTORY_BACKUP_KEY,raw);}
export function backupEnvironment(storage:Pick<Storage,'getItem'|'setItem'>,raw:string){if(!storage.getItem(ENVIRONMENT_BACKUP_KEY))storage.setItem(ENVIRONMENT_BACKUP_KEY,raw);}
export function backupLegacy(storage:Pick<Storage,'getItem'|'setItem'>,raw:string){if(!storage.getItem(LEGACY_BACKUP_KEY))storage.setItem(LEGACY_BACKUP_KEY,raw);}
export function backupExpansion(storage:Pick<Storage,'getItem'|'setItem'>,raw:string){if(!storage.getItem(EXPANSION_BACKUP_KEY))storage.setItem(EXPANSION_BACKUP_KEY,raw);}
export function loadSave(storage:Pick<Storage,'getItem'|'setItem'>):{save:Save;error?:string;notice?:string}{try{
 const current=storage.getItem(SAVE_KEY),previous=current?null:storage.getItem(PREVIOUS_SAVE_KEY),legacy=current||previous?null:storage.getItem(LEGACY_KEY),raw=current??previous??legacy;
 if(!raw)return {save:freshSave()};const parsed=JSON.parse(raw),save=validateSave(parsed);
 if(!current||parsed.version!==3||parsed.environmentVersion!==ENVIRONMENT_VERSION||parsed.inventoryVersion!==1||parsed.deskLife?.version!==3){try{
  if(parsed.deskLife?.version!==3&&!storage.getItem(STATIONERY_BACKUP_KEY))storage.setItem(STATIONERY_BACKUP_KEY,raw);
  if(parsed.deskLife?.version===1&&!storage.getItem(DESKTOP_BACKUP_KEY))storage.setItem(DESKTOP_BACKUP_KEY,raw);
  if(!parsed.deskLife&&!storage.getItem(DESK_BACKUP_KEY))storage.setItem(DESK_BACKUP_KEY,raw);
  if(parsed.inventoryVersion!==1)backupInventory(storage,raw);if(parsed.version===1)backupLegacy(storage,raw);if(parsed.environmentVersion===undefined)backupEnvironment(storage,raw);backupExpansion(storage,raw);storage.setItem(SAVE_KEY,JSON.stringify(save));
  return {save,notice:'Personal stationery issued. Your notebook, collection catalogue, pinboard and desk computer are ready. Existing progress and an untouched backup are retained.'};
 }catch{return {save,error:'The original shift is preserved, but storage prevented a migration backup. Export a backup before continuing; automatic writes are paused.'};}}
 return {save};
 }catch(e){return {save:freshSave(),error:`Saved progress could not be read: ${e instanceof Error?e.message:'storage unavailable'}. A fresh archive is ready; the old save has not been overwritten.`};}}
export function persist(save:Save,storage:Pick<Storage,'setItem'>){try{storage.setItem(SAVE_KEY,JSON.stringify(save));}catch{return 'Browser storage is unavailable or full. Export a backup from the pause menu to keep your progress.';}}
export class ProgressIndex {
 inspected=new Set<number>();searched=new Set<number>();clues=new Set<number>();counts=new Uint16Array(STORAGE_UNITS);visited=new Uint8Array(STORAGE_UNITS);private source:Save|null=null;
 rebuild(s:Save){this.source=s;this.inspected.clear();this.searched.clear();this.clues.clear();this.counts.fill(0);this.visited.fill(0);this.sync(s);}
 sync(s:Save){if(this.source!==s||this.inspected.size>s.inspected.length||this.searched.size>s.searched.length){this.rebuild(s);return;}for(let i=this.inspected.size;i<s.inspected.length;i++){const id=s.inspected[i];this.inspected.add(id);this.visited[unitForFile(id)]=1;}for(let i=this.searched.size;i<s.searched.length;i++){const id=s.searched[i];this.searched.add(id);this.counts[unitForFile(id)]++;}for(let i=this.clues.size;i<s.clues.length;i++)this.clues.add(s.clues[i]);}
}
