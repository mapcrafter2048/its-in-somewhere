import type { Save } from '../types';
import type { BoardPin, BoardString, DeskLife, NoteKind, StickyColor, ToolId } from './types';
export const STATIONERY_BACKUP_KEY='archive-office-before-stationery-v3';
export const STICKY_COLORS:Record<StickyColor,string>={yellow:'#eee4a2',rose:'#e8c3b5',blue:'#c8dcdf',sage:'#d3ddbb'};
export const TOOL_NAMES:Record<ToolId,string>={pad:'Sticky-note pad',thread:'Thread spool',marker:'Whiteboard markers'};
export const DRINKS={cola:'Archive Cola',orange:'Orange Overtime',water:'Still Employed · sparkling water'};
export const stickyCapacity=(s:Save)=>s.upgrades.includes('sticky-capacity')?24:8;
export const noteKey=(kind:NoteKind|undefined,id:number)=>`${kind??'notebook'}:${id}`;
export function boardNote(d:DeskLife,p:Pick<BoardPin,'kind'|'note'>){
 if(p.kind==='sticky'){const n=d.stickies.find(n=>n.id===p.note);return n?{title:n.text.slice(0,38)||'Untitled sticky note',text:n.text,paper:n.color==='yellow'?'cream' as const:n.color,strokes:[],id:n.id}:undefined;}
 return d.notes.find(n=>n.id===p.note);
}
export function initialStationery(){return {sheetPapers:{},stickies:[],nextSticky:1,stickyDraft:{text:'',color:'yellow' as StickyColor},tools:{pad:'box' as const,thread:'box' as const,marker:'box' as const},vending:{drink:null,place:'none' as const,due:0,empty:false}};}
export function equipTool(s:Save,id:ToolId){const d=s.deskLife!,p=s.physical!;if(p.held)return 'Your hands are full. Stow the held object first.';d.tools[id]='held';p.held={kind:'tool',id};return null;}
export function stowStationery(s:Save,box=false){const d=s.deskLife!,p=s.physical!,h=p.held;if(!h)return 'Your hands are empty.';
 if(h.kind==='tool')d.tools[h.id]=box?'box':'inventory';else if(h.kind==='sticky'){const n=d.stickies.find(n=>n.id===h.id);if(!n)return 'That note is unavailable.';n.place=box?'box':'inventory';}else if(h.kind==='can')d.vending.place='inventory';else return 'Use the file or cup controls for that object.';p.held=null;return null;
}
export function detachSticky(s:Save){const d=s.deskLife!,p=s.physical!;if(p.held&&!(p.held.kind==='tool'&&p.held.id==='pad'))return 'Your hands are full. Stow the held object first.';if(!d.stickyDraft.text.trim())return 'Write something before detaching this note.';if(d.stickies.length>=stickyCapacity(s))return 'The sticky pad register is full. Recycle a note or order more capacity.';
 if(p.held?.kind==='tool')d.tools.pad='inventory';const n={id:d.nextSticky++,text:d.stickyDraft.text,color:d.stickyDraft.color,place:'held' as const};d.stickies.push(n);d.stickyDraft={text:'',color:d.stickyDraft.color};p.held={kind:'sticky',id:n.id};return null;
}
export function equipSticky(s:Save,id:number){if(s.physical!.held)return 'Your hands are full.';const n=s.deskLife!.stickies.find(n=>n.id===id);if(!n||n.place==='board')return 'Remove that note from the board first.';n.place='held';s.physical!.held={kind:'sticky',id};return null;}
export function pinSticky(s:Save,x=.4,y=.4){const d=s.deskLife!,p=s.physical!;if(p.held?.kind!=='sticky')return 'Hold a sticky note to place it.';if(d.pins.length>=(s.upgrades.includes('pinboard')?24:8))return 'The board is full. Return a sheet or order a larger board.';const n=d.stickies.find(n=>n.id===p.held!.id)!;d.pins.push({kind:'sticky',note:n.id,x,y});n.place='board';p.held=null;return null;}
export function removePin(s:Save,kind:NoteKind,id:number){const d=s.deskLife!,p=s.physical!;if(kind==='sticky'&&p.held)return 'Stow the held object before removing this note.';
 d.pins=d.pins.filter(n=>noteKey(n.kind,n.note)!==noteKey(kind,id));d.strings=d.strings.filter(n=>noteKey(n.fromKind,n.from)!==noteKey(kind,id)&&noteKey(n.toKind,n.to)!==noteKey(kind,id));if(kind==='sticky'){const n=d.stickies.find(n=>n.id===id)!;n.place='held';p.held={kind:'sticky',id};}return null;
}
export function recycleSticky(s:Save,id:number){const d=s.deskLife!;d.pins=d.pins.filter(p=>!(p.kind==='sticky'&&p.note===id));d.strings=d.strings.filter(p=>!(p.fromKind==='sticky'&&p.from===id)&&!(p.toKind==='sticky'&&p.to===id));d.stickies=d.stickies.filter(n=>n.id!==id);if(s.physical!.held?.kind==='sticky'&&s.physical!.held.id===id)s.physical!.held=null;}
export function connectPins(s:Save,from:string,to:string,color:BoardString['color'],label=''){const d=s.deskLife!;if(from===to)return 'Choose two different notes.';if(d.strings.length>=96)return 'The board has reached its 96-connection limit.';const a=d.pins.find(p=>noteKey(p.kind,p.note)===from),b=d.pins.find(p=>noteKey(p.kind,p.note)===to);if(!a||!b)return 'Both endpoints must still be pinned.';if(d.strings.some(p=>noteKey(p.fromKind,p.from)===from&&noteKey(p.toKind,p.to)===to||noteKey(p.fromKind,p.from)===to&&noteKey(p.toKind,p.to)===from))return 'These notes are already connected.';d.strings.push({from:a.note,fromKind:a.kind??'notebook',to:b.note,toKind:b.kind??'notebook',color,label});return null;}
export function vend(s:Save,drink:keyof typeof DRINKS){const v=s.deskLife!.vending;if(v.place!=='none')return 'Finish or recycle your previous can before choosing another.';Object.assign(v,{drink,place:'dispensing',due:s.playSeconds+2,empty:false});return null;}
export function finishVending(s:Save){const v=s.deskLife!.vending;if(v.place==='dispensing'&&s.playSeconds>=v.due){v.place='tray';return true;}return false;}
export function takeCan(s:Save){const p=s.physical!,v=s.deskLife!.vending;if(p.held)return 'Your hands are full.';if(!['tray','inventory'].includes(v.place))return 'There is no can ready to collect.';v.place='held';p.held={kind:'can',id:'office-can'};return null;}
export function drinkCan(s:Save){if(s.physical!.held?.kind!=='can')return 'Hold a can first.';const v=s.deskLife!.vending;if(v.empty)return 'The can is empty. The recycling bin awaits.';v.empty=true;return 'A quiet drink. The empty can stays in your hand.';}
export function recycleCan(s:Save){const v=s.deskLife!.vending;if(v.place==='none'||v.place==='dispensing')return 'There is no can to recycle.';if(s.physical!.held?.kind==='can')s.physical!.held=null;Object.assign(v,{drink:null,place:'none',due:0,empty:false});return null;}
export function validateStationery(d:DeskLife,s:Save){const fail=()=>{throw new Error('Invalid personal desk data: stationery or drinks state. Restore a valid backup.');};
 if(!Array.isArray(d.stickies)||d.stickies.length>stickyCapacity(s)||new Set(d.stickies.map(n=>n.id)).size!==d.stickies.length||!Number.isSafeInteger(d.nextSticky)||d.nextSticky<1)fail();
 const validColor=(c:string)=>Object.hasOwn(STICKY_COLORS,c)&&(c==='yellow'||s.upgrades.includes('sticky-colours'));
 for(const n of d.stickies)if(!Number.isSafeInteger(n.id)||n.id<1||n.id>=d.nextSticky||typeof n.text!=='string'||n.text.length>280||!validColor(n.color)||!['box','inventory','held','board'].includes(n.place))fail();
 if(!d.stickyDraft||typeof d.stickyDraft.text!=='string'||d.stickyDraft.text.length>280||!validColor(d.stickyDraft.color)||!d.tools||Object.keys(d.tools).length!==3||!(['pad','thread','marker'] as const).every(t=>['box','inventory','held'].includes(d.tools[t])))fail();
 const paperEntries=Object.entries(d.sheetPapers??{});if(paperEntries.length>36||paperEntries.some(([slot,paper])=>!/^\d+$/.test(slot)||Number(slot)>=(s.upgrades.includes('stationery')?36:12)||!['cream','rose','blue','sage'].includes(paper)))fail();
 const sheets=d.notes.map(n=>n.sheet);if(sheets.some(n=>!Number.isInteger(n)||n!<0||n!>=(s.upgrades.includes('stationery')?36:12))||new Set(sheets).size!==sheets.length)fail();
 const keys=d.pins.map(p=>noteKey(p.kind,p.note));if(new Set(keys).size!==keys.length||d.pins.some(p=>!['notebook','sticky'].includes(p.kind??'notebook')||!boardNote(d,p)))fail();
 for(const n of d.stickies)if((n.place==='board')!==d.pins.some(p=>p.kind==='sticky'&&p.note===n.id))fail();
 for(const c of d.strings)if(!keys.includes(noteKey(c.fromKind,c.from))||!keys.includes(noteKey(c.toKind,c.to))||noteKey(c.fromKind,c.from)===noteKey(c.toKind,c.to))fail();
 const v=d.vending;if(!v||!['none','dispensing','tray','held','inventory'].includes(v.place)||typeof v.empty!=='boolean'||!Number.isFinite(v.due)||v.due<0||(v.place==='none'?v.drink!==null:!v.drink||!Object.hasOwn(DRINKS,v.drink)))fail();
 const held=[...Object.entries(d.tools).filter(([,v])=>v==='held').map(([id])=>`tool:${id}`),...d.stickies.filter(n=>n.place==='held').map(n=>`sticky:${n.id}`),...(v.place==='held'?['can:office-can']:[])];const p=s.physical?.held;
 if(held.length>1||held.length===1&&(!p||held[0]!==`${p.kind}:${p.id}`)||p&&['tool','sticky','can'].includes(p.kind)&&held[0]!==`${p.kind}:${p.id}`)fail();
}
