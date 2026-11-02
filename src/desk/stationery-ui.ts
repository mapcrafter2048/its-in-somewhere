import type {Save} from '../types';
import type {BoardPin,BoardString,Ink} from './types';
import {panel,escapeHtml as esc} from '../ui/dom';
import {PAPERS,INKS} from './paper';
import {pinCapacity} from './state';
import {STICKY_COLORS,DRINKS,stickyCapacity,noteKey,boardNote,stowStationery,recycleSticky,connectPins,vend,takeCan,recycleCan} from './stationery';
interface Options{save:()=>Save;show:(mode:string,html:string)=>void;commit:()=>void;notify:(text:string)=>void;resume:()=>void;atDesk:()=>boolean;note:(id:number)=>void;sound:()=>void}
const q=<T extends HTMLElement=HTMLElement>(s:string)=>document.querySelector<T>(s)!;
export class StationeryScreens{
 private firstEndpoint?:string;
 private history:{pins:BoardPin[];strings:BoardString[];places:{id:number;place:import('./types').StickyNote['place']}[];held:import('../physical').Held|null}[]=[];
 constructor(private o:Options){}
 private get s(){return this.o.save();}private get d(){return this.s.deskLife!;}private get p(){return this.s.physical!;}
 private result(error:string|null,success:string,then:()=>void){if(error){this.o.notify(error);return;}this.o.commit();this.o.sound();this.o.notify(success);then();}
 private show(mode:string,title:string,body:string){this.o.show(mode,panel(title,'PERSONAL STATIONERY / RECORDS & RETENTION',body,true));}
 box(){this.board();}
 draft(){if(!this.o.atDesk()){this.o.notify('Write notes at your pinboard.');return;}const held=this.p.held;this.board();this.composeSticky(held?.kind==='sticky'?held.id:undefined);}
 private stickyCard(id:number){const n=this.d.stickies.find(n=>n.id===id)!;return `<article class="inventory-sticky" style="--sticky-stock:${STICKY_COLORS[n.color]}"><p>${esc(n.text)}</p><small>STICKY ${String(id).padStart(2,'0')} / ${n.place.toUpperCase()}</small><div class="stationery-actions">${n.place!=='board'?`<button data-sticky-equip="${id}">Pin ↗</button>`:''}<button class="danger" data-sticky-recycle="${id}">Recycle</button></div><div data-recycle-confirm="${id}" hidden>Recycle this written note and its connections?<div class="stationery-actions"><button data-sticky-confirm="${id}" class="danger">Recycle written note</button><button data-sticky-keep="${id}">Keep note</button></div></div></article>`;}
 inventoryMarkup(){return `<section class="stationery-inventory"><h3>Sticky stack</h3><div class="stationery-pocket-tools"><div class="stationery-actions pocket-instruments">${this.o.atDesk()?'<button id="inventory-open-board">Pinboard ↗</button>':''}${this.p.held&&['tool','sticky','can'].includes(this.p.held.kind)?'<button id="stow-stationery">Stow</button>':''}</div></div><div class="sticky-pocket-grid">${this.d.stickies.filter(n=>n.place!=='board').map(n=>this.stickyCard(n.id)).join('')}</div>${this.d.vending.place==='held'||this.d.vending.place==='inventory'?`<article class="carried-can"><p>${esc(DRINKS[this.d.vending.drink!])}</p><button id="inventory-equip-can">Equip can</button></article>`:''}</section>`;}
 inventory(){this.show('stationery-inventory','Stationery and loose notes',this.inventoryMarkup());this.bindInventory(()=>this.inventory());}
 bindInventory(refresh:()=>void){this.bindNotes(refresh);q('#stow-stationery')?.addEventListener('click',()=>this.result(stowStationery(this.s),'Stored.',refresh));q('#inventory-open-board')?.addEventListener('click',()=>this.board());q('#inventory-equip-can')?.addEventListener('click',()=>this.result(takeCan(this.s),'Can equipped.',this.o.resume));}
 private bindNotes(refresh:()=>void){document.querySelectorAll<HTMLButtonElement>('[data-sticky-equip]').forEach(b=>b.onclick=()=>{this.board();if(document.querySelector('.pinboard-workspace'))this.pinSaved('sticky',Number(b.dataset.stickyEquip));});document.querySelectorAll<HTMLButtonElement>('[data-sticky-recycle]').forEach(b=>b.onclick=()=>{q(`[data-recycle-confirm="${b.dataset.stickyRecycle}"]`).hidden=false;});document.querySelectorAll<HTMLButtonElement>('[data-sticky-keep]').forEach(b=>b.onclick=()=>q(`[data-recycle-confirm="${b.dataset.stickyKeep}"]`).hidden=true);document.querySelectorAll<HTMLButtonElement>('[data-sticky-confirm]').forEach(b=>b.onclick=()=>{recycleSticky(this.s,Number(b.dataset.stickyConfirm));this.o.commit();refresh();});}
 cancelThread(){const editor=document.querySelector('.board-editor-backdrop');if(editor){editor.remove();q('#new-board-note').focus();return true;}if(!this.firstEndpoint&&!this.threadMode)return false;this.firstEndpoint=undefined;this.threadMode=false;this.board();return true;}
 private threadMode=false;
 private boardResize?:ResizeObserver;
 private freePosition(){
  const surface=document.querySelector<HTMLElement>('#pinboard-surface'),w=surface?.clientWidth||900,h=surface?.clientHeight||650;
  const noteW=Math.min(145,Math.max(80,w*.19)),noteH=Math.min(110,Math.max(55,h*.13));
  for(let top=h*.03+8;top<=Math.min(h*.76,h-noteH-8);top+=noteH+12){
   for(let left=w*.02+8;left<=Math.min(w*.84,w-noteW-8);left+=noteW+12){
    if(dontOverlap(left,top,this.d.pins))return{x:(left/w-.02)/.82,y:(top/h-.03)/.73};
   }
  }
  // A densely arranged board still retains its existing capacity and movable notes.
  return{x:.03,y:.03};
  function dontOverlap(left:number,top:number,pins:BoardPin[]){return pins.every(p=>{const x=(.02+p.x*.82)*w,y=(.03+p.y*.73)*h;return left+noteW+8<=x||x+noteW+8<=left||top+noteH+8<=y||y+noteH+8<=top;});}
 }
 private returnToStack(kind:'sticky'|'notebook',id:number){
  this.history=[];
  const key=noteKey(kind,id);this.d.pins=this.d.pins.filter(p=>noteKey(p.kind,p.note)!==key);
  this.d.strings=this.d.strings.filter(s=>noteKey(s.fromKind,s.from)!==key&&noteKey(s.toKind,s.to)!==key);
  if(kind==='sticky'){const n=this.d.stickies.find(n=>n.id===id)!;n.place='box';if(this.p.held?.kind==='sticky'&&this.p.held.id===id)this.p.held=null;}
  this.firstEndpoint=undefined;this.o.commit();this.board();
 }
 private pinSaved(kind:'sticky'|'notebook',id:number){
  if(this.d.pins.length>=pinCapacity(this.s)){this.o.notify('Board full.');return;}
  if(kind==='sticky'){this.d.stickies.find(n=>n.id===id)!.place='board';if(this.p.held?.kind==='sticky'&&this.p.held.id===id)this.p.held=null;}
  this.history=[];this.d.pins.push({kind,note:id,...this.freePosition()});this.o.commit();this.board();
 }
 private composeSticky(id?:number){
  const existing=id===undefined?undefined:this.d.stickies.find(n=>n.id===id);
  const draft={...(existing??this.d.stickyDraft)},original=draft.text;
  const rail=q('.panel[data-screen="pinboard"]');rail.querySelector('.board-editor-backdrop')?.remove();
  rail.insertAdjacentHTML('beforeend',`<div class="board-editor-backdrop"><form role="dialog" aria-modal="true" aria-label="Write sticky note" class="board-inline-editor" id="board-sticky-form"><textarea id="board-sticky-text" maxlength="280" rows="6" aria-label="Sticky note" placeholder="Write a note…" style="--sticky-stock:${STICKY_COLORS[draft.color]}">${esc(draft.text)}</textarea><div class="inline-note-actions"><button type="button" id="board-sticky-undo" aria-label="Undo writing" title="Undo">↶</button><button type="submit" id="board-sticky-done" aria-label="Done" title="Done">✓</button></div>${this.s.upgrades.includes('sticky-colours')?`<label class="board-sticky-palette">Colour <select id="board-sticky-colour">${Object.keys(STICKY_COLORS).map(c=>`<option ${c===draft.color?'selected':''}>${c}</option>`).join('')}</select></label>`:''}</form></div>`);
  q<HTMLTextAreaElement>('#board-sticky-text').oninput=e=>{draft.text=(e.target as HTMLTextAreaElement).value;};
  q('#board-sticky-undo').onclick=()=>{draft.text=original;q<HTMLTextAreaElement>('#board-sticky-text').value=original;};
  q<HTMLSelectElement>('#board-sticky-colour')?.addEventListener('change',e=>{draft.color=(e.target as HTMLSelectElement).value as typeof draft.color;q('#board-sticky-text').style.setProperty('--sticky-stock',STICKY_COLORS[draft.color]);q('#board-sticky-form').style.setProperty('--sticky-stock',STICKY_COLORS[draft.color]);});
  q<HTMLFormElement>('#board-sticky-form').onsubmit=e=>{e.preventDefault();if(!draft.text.trim())return;
   if(!existing&&this.d.stickies.length>=stickyCapacity(this.s)){this.o.notify('Sticky stack full. Recycle a saved note.');return;}
   if(!existing||existing.place!=='board'){if(this.d.pins.length>=pinCapacity(this.s)){this.o.notify('Board full.');return;}}
   if(existing){existing.text=draft.text;existing.color=draft.color;if(existing.place!=='board'){this.history=[];existing.place='board';this.d.pins.push({kind:'sticky',note:existing.id,...this.freePosition()});}if(this.p.held?.kind==='sticky'&&this.p.held.id===existing.id)this.p.held=null;}
   else{this.history=[];const note={id:this.d.nextSticky++,text:draft.text,color:draft.color,place:'board' as const};this.d.stickies.push(note);this.d.pins.push({kind:'sticky',note:note.id,...this.freePosition()});this.d.stickyDraft={text:'',color:draft.color};}
   this.o.commit();this.o.sound();this.board();
  };
  q('#board-sticky-form').style.setProperty('--sticky-stock',STICKY_COLORS[draft.color]);
  q('#board-sticky-form').onkeydown=e=>{if(e.key!=='Tab')return;const items=Array.from(q('#board-sticky-form').querySelectorAll<HTMLElement>('textarea,button,select'));const first=items[0],last=items.at(-1)!;if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}};
  q('#board-sticky-text').focus();
 }
 board(){
  if(!this.o.atDesk()){this.o.notify('Visit your pinboard at the W4 desk.');return;}
  if(!document.querySelector('.panel[data-screen="pinboard"]')){this.history=[];this.firstEndpoint=undefined;this.threadMode=false;}
  this.boardResize?.disconnect();
  const d=this.d,threaded=this.threadMode;
  const snapshot=()=>{this.history.push({pins:structuredClone(d.pins),strings:structuredClone(d.strings),places:d.stickies.map(n=>({id:n.id,place:n.place})),held:structuredClone(this.p.held)});if(this.history.length>20)this.history.shift();};
  const title=(p:BoardPin)=>boardNote(d,p)?.title??'Note';
  this.show('pinboard','Pinboard',`<div class="board-register"><span>${d.pins.length} / ${pinCapacity(this.s)}</span><span id="thread-status" role="status">${threaded?(this.firstEndpoint?'Select another note':'Select two notes'):''}</span></div><div id="pinboard-surface" class="personal-board" tabindex="0" aria-label="Pinboard"><canvas id="pinboard-art" width="1200" height="650" aria-hidden="true"></canvas>${d.pins.map(p=>`<div class="board-note-hit" style="left:${2+p.x*82}%;top:${3+p.y*73}%;--note-stock:${p.kind==='sticky'?STICKY_COLORS[d.stickies.find(n=>n.id===p.note)!.color]:PAPERS[d.notes.find(n=>n.id===p.note)!.paper]}"><button data-pin="${p.note}" data-pin-kind="${p.kind??'notebook'}" class="${this.firstEndpoint===noteKey(p.kind,p.note)?'thread-endpoint':''}" aria-label="${esc(title(p))}"><span class="pin-note-copy">${esc(boardNote(d,p)?.text||title(p))}</span></button><button class="unpin-note" data-unpin="${p.note}" data-kind="${p.kind??'notebook'}" aria-label="Return ${esc(title(p))} to stack" title="Return to stack">×</button></div>`).join('')}</div><div id="pin-actions" class="board-tools" hidden></div><div class="board-tools board-toolbar"><section class="board-stack"><header><span>Sticky pad</span><button id="new-board-note" aria-label="Add sticky note" title="Add sticky note">+</button></header><div class="saved-sticky-stack">${d.stickies.filter(n=>n.place!=='board').map(n=>`<div><button data-repin-sticky="${n.id}">${esc(n.text.slice(0,48))}</button><button data-discard-sticky="${n.id}" aria-label="Recycle sticky note" title="Recycle">×</button></div>`).join('')}</div></section><details class="board-sheet-pocket board-stack"><summary>Notebook sheets <span aria-hidden="true">+</span></summary><div class="board-sheet-picker">${d.notes.filter(n=>!d.pins.some(p=>p.kind!=='sticky'&&p.note===n.id)).map(n=>`<button data-pin-sheet="${n.id}">${esc(n.title||'Untitled')}</button>`).join('')||'<span class="empty-stack">No saved sheets</span>'}</div></details><div class="board-frame-actions"><button id="board-thread" aria-pressed="${threaded}">Thread</button><button id="undo-board" aria-label="Undo arrangement" ${!this.history.length?'disabled':''}>↶</button></div></div><div class="board-connection-tools" ${threaded?'':'hidden'}><label>Colour <select id="string-color">${Object.keys(INKS).map(c=>`<option ${c==='red'?'selected':''}>${c}</option>`).join('')}</select></label><input id="string-label" maxlength="80" aria-label="Thread label" placeholder="Label"></div><div class="board-connections" ${d.strings.length?'':'hidden'}>${d.strings.map((s,i)=>`<p><span>${esc(title({note:s.from,kind:s.fromKind,x:0,y:0}))} → ${esc(title({note:s.to,kind:s.toKind,x:0,y:0}))}${s.label?` · ${esc(s.label)}`:''}</span><button data-remove-string="${i}" aria-label="Remove connection" title="Remove connection">×</button></p>`).join('')}</div>`);
  const surface=q('#pinboard-surface'),canvas=q<HTMLCanvasElement>('#pinboard-art');
  const paint=()=>{const w=surface.clientWidth,h=surface.clientHeight;if(!w||!h)return;const scale=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);const ctx=canvas.getContext('2d')!;ctx.scale(scale,scale);ctx.fillStyle='#766b4c';ctx.fillRect(0,0,w,h);ctx.fillStyle='#9a8962';for(let x=0;x<w;x+=13)for(let y=0;y<h;y+=13)ctx.fillRect(x+(y%7),y,1,1);
   const point=(kind:BoardPin['kind'],id:number)=>{const pin=d.pins.find(p=>noteKey(p.kind,p.note)===noteKey(kind,id))!;return{x:(.02+pin.x*.82)*w+Math.min(145,Math.max(80,w*.19))/2,y:(.03+pin.y*.73)*h+10};};
   for(const string of d.strings){const a=point(string.fromKind,string.from),b=point(string.toKind,string.to);ctx.strokeStyle=INKS[string.color];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
  };paint();this.boardResize=new ResizeObserver(()=>{if(!surface.isConnected){this.boardResize?.disconnect();return;}paint();});this.boardResize.observe(surface);
  q('#new-board-note').onclick=()=>this.composeSticky();
  document.querySelectorAll<HTMLButtonElement>('[data-repin-sticky]').forEach(b=>b.onclick=()=>this.pinSaved('sticky',Number(b.dataset.repinSticky)));
  document.querySelectorAll<HTMLButtonElement>('[data-discard-sticky]').forEach(b=>b.onclick=()=>{if(b.parentElement!.querySelector('.stack-recycle-confirm'))return;const confirm=document.createElement('span');confirm.className='stack-recycle-confirm';confirm.innerHTML='<button aria-label="Confirm recycling" title="Recycle">✓</button><button aria-label="Keep sticky note" title="Keep">↶</button>';b.parentElement!.append(confirm);const buttons=confirm.querySelectorAll('button');buttons[0].onclick=()=>{this.history=[];recycleSticky(this.s,Number(b.dataset.discardSticky));this.o.commit();this.board();};buttons[1].onclick=()=>{confirm.remove();b.focus();};buttons[1].focus();});
  document.querySelectorAll<HTMLButtonElement>('[data-pin-sheet]').forEach(b=>b.onclick=()=>this.pinSaved('notebook',Number(b.dataset.pinSheet)));
  document.querySelectorAll<HTMLButtonElement>('[data-unpin]').forEach(b=>b.onclick=()=>this.returnToStack(b.dataset.kind as 'sticky'|'notebook',Number(b.dataset.unpin)));
  q('#board-thread').onclick=()=>{this.threadMode=!this.threadMode;this.firstEndpoint=undefined;this.board();};
  q('#undo-board').onclick=()=>{const prev=this.history.pop();if(!prev)return;d.pins=prev.pins;d.strings=prev.strings;prev.places.forEach(p=>{const n=d.stickies.find(n=>n.id===p.id);if(n)n.place=p.place as typeof n.place;});this.p.held=prev.held;this.o.commit();this.board();};
  document.querySelectorAll<HTMLButtonElement>('[data-pin]').forEach(b=>{
   const p=d.pins.find(p=>p.note===Number(b.dataset.pin)&&(p.kind??'notebook')===b.dataset.pinKind)!;let moving=false,dragged=false;
   b.onclick=()=>{if(dragged){dragged=false;return;}if(threaded){const key=noteKey(p.kind,p.note);if(!this.firstEndpoint){this.firstEndpoint=key;b.classList.add('thread-endpoint');q('#thread-status').textContent='Select another note';}else{const error=connectPins(this.s,this.firstEndpoint,key,q<HTMLSelectElement>('#string-color').value as Ink,q<HTMLInputElement>('#string-label').value);this.firstEndpoint=undefined;if(error)this.o.notify(error);else this.o.commit();this.board();}return;}if(p.kind==='sticky')this.composeSticky(p.note);else this.o.note(p.note);};
   const move=()=>{const hit=b.parentElement!;hit.style.left=`${2+p.x*82}%`;hit.style.top=`${3+p.y*73}%`;paint();};
   b.onpointerdown=e=>{if(threaded||e.button!==0)return;snapshot();moving=true;dragged=false;b.setPointerCapture(e.pointerId);};
   b.onpointermove=e=>{if(!moving)return;if(Math.abs(e.movementX)+Math.abs(e.movementY)>1)dragged=true;if(!dragged)return;const r=q('#pinboard-surface').getBoundingClientRect();p.x=Math.max(0,Math.min(1,((e.clientX-r.left)/r.width-.08)/.82));p.y=Math.max(0,Math.min(1,((e.clientY-r.top)/r.height-.06)/.73));move();};
   const finish=()=>{if(moving){moving=false;this.o.commit();q<HTMLButtonElement>('#undo-board').disabled=false;}};b.onpointerup=finish;b.onpointercancel=finish;b.onlostpointercapture=finish;
   b.onkeydown=e=>{const dx=e.key==='ArrowRight'?.025:e.key==='ArrowLeft'?-.025:0,dy=e.key==='ArrowDown'?.025:e.key==='ArrowUp'?-.025:0;if(!dx&&!dy)return;e.preventDefault();snapshot();p.x=Math.max(0,Math.min(1,p.x+dx));p.y=Math.max(0,Math.min(1,p.y+dy));move();this.o.commit();q<HTMLButtonElement>('#undo-board').disabled=false;};
  });
  document.querySelectorAll<HTMLButtonElement>('[data-remove-string]').forEach(b=>b.onclick=()=>{d.strings.splice(Number(b.dataset.removeString),1);this.o.commit();this.board();});
 }
 vending(){const v=this.d.vending;this.o.show('vending',panel('Staff refreshments','W2 / COMPLIMENTARY',`<div class="vending-console"><div class="vending-window">${(Object.keys(DRINKS) as (keyof typeof DRINKS)[]).map((drink,i)=>`<article><div class="can-illustration drink-${drink}" aria-hidden="true">${i===0?'R&R':i===1?'O+':'≈'}</div><h3>${DRINKS[drink]}</h3><button data-vend="${drink}" ${v.place!=='none'?'disabled':''}>${String.fromCharCode(65+i)}1 · Select / FREE</button></article>`).join('')}</div><p class="vending-plate">COMPLIMENTARY. ACCOUNTS WOULD LIKE THIS ACKNOWLEDGED.</p><div class="vending-output" role="status">${v.place==='dispensing'?'Dispensing… two seconds of entirely unnecessary suspense.':v.place==='tray'?`${DRINKS[v.drink!]} is in the collection tray.`:v.place==='none'?'Choose a drink. Your investigation can wait a moment.':'Finish or recycle your previous can before choosing another.'}</div><div class="stationery-actions"><button id="collect-vending" ${v.place!=='tray'?'disabled':''}>Pick up can</button><button id="recycle-vending" ${!['held','inventory','tray'].includes(v.place)?'disabled':''}>Recycle previous can</button></div></div>`,true));document.querySelectorAll<HTMLButtonElement>('[data-vend]').forEach(b=>b.onclick=()=>this.result(vend(this.s,b.dataset.vend as keyof typeof DRINKS),'Dispensing. The tray will retain your drink.',()=>this.vending()));q('#collect-vending').onclick=()=>this.result(takeCan(this.s),'Can collected. Click to drink; I to stow.',this.o.resume);q('#recycle-vending').onclick=()=>this.result(recycleCan(this.s),'Recycled. An unusually complete administrative process.',()=>this.vending());}
 refreshVending(){if(document.querySelector('.panel[data-screen="vending"]'))this.vending();}
}
