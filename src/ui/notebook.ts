import { escapeHtml as esc } from './dom';
import '../styles/notebook.css';
export type NotebookSection = 'notes' | 'discoveries' | 'collection' | 'log';
export interface NotebookEntry { id: string; title?: string; contentsLabel?: string; text?: string; html?: string; className?: string }
export interface NotebookPart { entry: NotebookEntry; text?: string; offset: number; continued: boolean; last: boolean }
export interface NotebookPage { parts: NotebookPart[] }
export interface NotebookSpread { left: NotebookPage; right?: NotebookPage }
export interface NotebookViewState { section: NotebookSection; page: number; anchor?: { id: string; offset: number } }
const sections: NotebookSection[] = ['notes','discoveries','collection','log'];
const names: Record<NotebookSection,string> = {notes:'Notes',discoveries:'Discoveries',collection:'Collection',log:'Shift log'};
interface Options { show:(html:string)=>void; cleanup:(fn:()=>void)=>void; sound:()=>void; select:(section:NotebookSection)=>void; write:()=>void; canWrite:()=>boolean }
export function notebookPart(part:NotebookPart) {
 const {entry}=part;
 return `<section class="book-entry ${entry.className??''}" data-book-entry="${esc(entry.id)}" data-offset="${part.offset}">${entry.title?`<h3>${esc(entry.title)}${part.continued?' <small>continued</small>':''}</h3>`:''}${part.text!==undefined?`<div class="book-entry-text" data-entry-text="${esc(entry.id)}">${esc(part.text)}</div>`:''}${part.last?entry.html??'':''}</section>`;
}
/** Split only presentation strings; all whitespace and Unicode code points survive. */
export function notebookCut(text:string,limit:number) {
 let cut=Math.max(1,Math.min(text.length,limit));
 if(cut<text.length && /[\uDC00-\uDFFF]/.test(text[cut]))cut--;
 while(cut>1 && cut<text.length && /\p{Mark}/u.test(text[cut]))cut--;
 const prefix=text.slice(0,cut),matches=[...prefix.matchAll(/\s+/g)],boundary=matches.at(-1);
 if(boundary && boundary.index!+boundary[0].length>cut*.5)cut=boundary.index!+boundary[0].length;
 if(cut < 1) cut = (text.codePointAt(0) ?? 0) > 0xffff ? 2 : 1;
 while(cut < text.length && /\p{Mark}/u.test(text[cut]))cut++;
 return cut;
}
export function paginateNotebook(entries:NotebookEntry[],probe:HTMLElement,height:number):NotebookPage[] {
 const pages:NotebookPage[]=[];let parts:NotebookPart[]=[];
 const fits=(part:NotebookPart)=>{probe.innerHTML=[...parts,part].map(notebookPart).join('');return probe.scrollHeight<=height+1;};
 const finish=()=>{if(parts.length){pages.push({parts});parts=[];}};
 for(const entry of entries){
  if(entry.text===undefined){const part={entry,offset:0,continued:false,last:true};if(!fits(part))finish();parts.push(part);continue;}
  let offset=0;
  do {
   const remaining=entry.text.slice(offset),part={entry,text:remaining,offset,continued:offset>0,last:true};
   if(fits(part)){parts.push(part);offset=entry.text.length;break;}
   let lo=0,hi=remaining.length;
   while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(fits({...part,text:remaining.slice(0,mid),last:mid===remaining.length}))lo=mid;else hi=mid-1;}
   if(!lo&&parts.length){finish();continue;}
   const length=notebookCut(remaining,Math.max(1,lo));
   parts.push({...part,text:remaining.slice(0,length),last:length===remaining.length});offset+=length;finish();
  }while(offset<entry.text.length);
 }
 finish();return pages.length?pages:[{parts:[]}];
}
/** One mounted cover owns all four sections, pagination and view-scoped cleanup. */
export class NotebookController {
 private root?:HTMLElement; private pages:NotebookPage[]=[]; private entries:NotebookEntry[]=[];
 private view:NotebookViewState={section:'notes',page:0}; private memory=new Map<NotebookSection,NotebookViewState>();
 private resize?:ResizeObserver; private mutation?:MutationObserver; private frame=0; private leave?:()=>void;
 private sheetNavigation?:{index:number;total:number;turn:(direction:number)=>void};
 private rendered=()=>{}; private customContents?: {label:string;select:()=>void}[]|(()=>{label:string;select:()=>void}[]); private editing=false; private narrow=false;
 constructor(private o:Options){}
 get section(){return this.view.section;}
 get active(){return !!this.root?.isConnected;}
 reset(){this.dispose();this.memory.clear();this.view={section:'notes',page:0};}
 private mount(){
  if(this.active)return;
  this.o.show(`<section class="panel notebook-book" data-surface="notebook" role="dialog" aria-modal="true" aria-label="Your notebook"><button id="new-note" class="book-write" aria-label="Write a new notebook sheet">✎ Write</button><div class="book-cover-label" aria-hidden="true">PERSONAL FIELD BOOK / RECORDS & RETENTION</div><button id="book-contents" class="book-bookmark" aria-expanded="false" aria-controls="book-index">Contents</button><button class="close book-close" data-action="resume" aria-label="Close notebook">×</button><nav class="book-tabs" aria-label="Notebook sections">${sections.map(s=>`<button data-desk-tab="${s}">${names[s]}</button>`).join('')}</nav><div class="book-spread">${['left','right'].map(side=>`<article class="book-leaf" data-side="${side}"><header class="book-running-head"></header><div class="book-content"></div><footer class="book-folio"></footer></article>`).join('')}<div class="book-binding" aria-hidden="true">${'<i></i>'.repeat(6)}</div></div><div class="book-navigation"><button id="book-prev" aria-label="Previous notebook pages">← Previous</button><span id="book-position" role="status"></span><button id="book-next" aria-label="Next notebook pages">Next →</button></div><aside id="book-index" aria-label="Notebook contents" hidden></aside><div class="book-content book-probe" aria-hidden="true" inert></div></section>`);
  this.root=document.querySelector<HTMLElement>('.notebook-book')!;
  this.root.querySelector<HTMLButtonElement>('#new-note')!.onclick=this.o.write;
  this.root.querySelectorAll<HTMLButtonElement>('[data-desk-tab]').forEach(b=>b.onclick=()=>this.o.select(b.dataset.deskTab as NotebookSection));
  this.root.querySelector<HTMLButtonElement>('#book-prev')!.onclick=()=>this.turn(-1);
  this.root.querySelector<HTMLButtonElement>('#book-next')!.onclick=()=>this.turn(1);
  this.root.querySelector<HTMLButtonElement>('#book-contents')!.onclick=()=>{
   this.leave?.();this.renderContents();
   const index=this.root!.querySelector<HTMLElement>('#book-index')!;index.hidden=!index.hidden;
   this.root!.querySelector('#book-contents')!.setAttribute('aria-expanded',String(!index.hidden));
   if(!index.hidden)index.querySelector<HTMLButtonElement>('button')?.focus();
  };
  this.root.addEventListener('keydown',e=>{if((e.target as HTMLElement).closest('input,textarea,select,canvas'))return;if(e.key==='PageDown'||e.key==='PageUp'){e.preventDefault();this.turn(e.key==='PageDown'?1:-1);}});
  const schedule=()=>{cancelAnimationFrame(this.frame);this.frame=requestAnimationFrame(()=>{if(!this.active)return;if(this.editing)this.paintEditor();else this.layout();});};
  this.resize=new ResizeObserver(schedule);this.resize.observe(this.root.querySelector('.book-spread')!);
  this.mutation=new MutationObserver(schedule);this.mutation.observe(document.documentElement,{attributes:true,attributeFilter:['style']});
  this.o.cleanup(()=>this.dispose());
 }
 flushPending(){this.flush();}
 onLeave(fn:()=>void){this.leave=fn;}
 private flush(){const fn=this.leave;this.leave=undefined;fn?.();}
 show(section:NotebookSection,entries:NotebookEntry[],rendered=()=>{},anchor?:string){
  this.sheetNavigation=undefined;
  const sectionChanged=this.active && this.view.section!==section;
  this.flush();this.remember();this.mount();this.editing=false;this.root!.classList.remove('book-editing');
  this.view={...(this.memory.get(section)??{section,page:0})};if(anchor)this.view.anchor={id:anchor,offset:0};
  this.customContents=undefined;this.entries=entries;this.rendered=rendered;
  this.root!.querySelector<HTMLElement>('#book-index')!.hidden=true;
  this.root!.querySelector('#book-contents')!.setAttribute('aria-expanded','false');
  this.layout();if(sectionChanged){this.o.sound();this.animate(1);}
 }
 editor(left:string,right:string,rendered:()=>void,navigation?:{index:number;total:number;turn:(direction:number)=>void}){
  this.sheetNavigation=navigation;
  this.flush();this.remember();this.mount();this.editing=true;this.view={section:'notes',page:0};this.root!.classList.add('book-editing');
  const contents=this.root!.querySelectorAll<HTMLElement>('.book-leaf>.book-content');contents[0].innerHTML=left;contents[1].innerHTML=right;
  this.root!.querySelector<HTMLElement>('#book-index')!.hidden=true;
  this.paintEditor();rendered();
  this.root!.querySelector('#book-contents')!.setAttribute('aria-expanded','false');
  if(!this.root!.contains(document.activeElement)) (this.root!.querySelector<HTMLElement>('#note-title:not([disabled])')??this.root!.querySelector<HTMLElement>('#book-contents'))?.focus({preventScroll:true});
 }
 private remember(){if(!this.editing)this.memory.set(this.view.section,{...this.view});}
 private layout(){
  if(!this.active||this.editing)return;
  const active=document.activeElement as HTMLElement;
  const focusedEntry=active.closest<HTMLElement>('[data-book-entry]');
  const focusedId=focusedEntry?.dataset.bookEntry;
  const focusIndex=focusedEntry ? [...focusedEntry.querySelectorAll('button,a,input,textarea,select,[tabindex]')].indexOf(active) : -1;
  const jump=active.dataset.bookJump;
  this.narrow=matchMedia('(max-width:899px)').matches;
  this.root!.querySelectorAll<HTMLElement>('.book-leaf').forEach((leaf,i)=>leaf.hidden=this.narrow&&i===1);
  const content=this.root!.querySelector<HTMLElement>('.book-leaf>.book-content')!,probe=this.root!.querySelector<HTMLElement>('.book-probe')!;
  this.narrow=matchMedia('(max-width:899px)').matches;
  probe.style.width=`${content.clientWidth}px`;
  this.pages=paginateNotebook(this.entries,probe,content.clientHeight-parseFloat(getComputedStyle(content).paddingTop));
  // A short section still uses both leaves, without reserving a permanent index leaf.
  if(!this.narrow && this.pages.length===1 && this.pages[0].parts.length>1){
   const parts=this.pages[0].parts; let split=1,best=Infinity;
   for(let i=1;i<parts.length;i++){
    probe.innerHTML=parts.slice(0,i).map(notebookPart).join('');const left=probe.scrollHeight;
    probe.innerHTML=parts.slice(i).map(notebookPart).join('');const distance=Math.abs(left-probe.scrollHeight);
    if(distance<best){best=distance;split=i;}
   }
   this.pages=[{parts:parts.slice(0,split)},{parts:parts.slice(split)}];
  }
  probe.replaceChildren();
  const anchor=this.view.anchor;
  if(anchor){const index=this.pages.findIndex(p=>p.parts.some(part=>part.entry.id===anchor.id && (part.text===undefined||anchor.offset>=part.offset&&anchor.offset<part.offset+Math.max(1,part.text.length))));if(index>=0)this.view.page=index;else this.view.page=0;}
  this.view.page=Math.min(this.view.page,this.pages.length-1);if(!this.narrow)this.view.page-=this.view.page%2;
  this.paint();
  if(!active.isConnected){
   const entry=[...this.root!.querySelectorAll<HTMLElement>('[data-book-entry]')].find(e=>e.dataset.bookEntry===focusedId);
   const replacement=jump!==undefined ? this.root!.querySelector<HTMLElement>(`[data-book-jump="${jump}"]`) : entry?.querySelectorAll<HTMLElement>('button,a,input,textarea,select,[tabindex]')[focusIndex];
   (replacement??this.root!.querySelector<HTMLElement>('#book-contents'))?.focus({preventScroll:true});
  }
 }
 private chrome(total:number){
  this.root!.dataset.section=this.view.section;
  this.root!.querySelector<HTMLButtonElement>('#new-note')!.disabled=!this.o.canWrite();
  this.root!.querySelectorAll<HTMLButtonElement>('[data-desk-tab]').forEach(b=>{const active=b.dataset.deskTab===this.view.section;b.classList.toggle('selected',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  this.root!.querySelector<HTMLButtonElement>('#book-prev')!.disabled=this.view.page===0;
  this.root!.querySelector<HTMLButtonElement>('#book-next')!.disabled=this.view.page+(this.narrow?1:2)>=total;
  this.root!.querySelector('#book-position')!.textContent=this.editing?(this.narrow?(this.view.page?'Sketch & clippings':'Writing'):'Writing / sketch & clippings'):`${names[this.view.section]} · ${this.view.page+1}${!this.narrow?`–${this.view.page+2}`:''} / ${this.narrow?total:Math.ceil(total/2)*2}`;
 }
 private paint(){
  const leaves=this.root!.querySelectorAll<HTMLElement>('.book-leaf');
  leaves.forEach((leaf,i)=>{
   leaf.hidden=this.narrow&&i===1;const page=this.pages[this.view.page+i];
   leaf.querySelector('.book-running-head')!.textContent=names[this.view.section]+(i?' / continued':' / personal copy');
   const content=leaf.querySelector<HTMLElement>('.book-content')!;content.innerHTML=page?.parts.map(notebookPart).join('')??'';
   content.querySelectorAll<HTMLElement>('.book-entry').forEach(entry=>{if(entry.scrollHeight>content.clientHeight)entry.classList.add('book-entry-overflow');});
   leaf.querySelector('.book-folio')!.textContent=String(this.view.page+i+1).padStart(2,'0');
  });
  const first=this.pages[this.view.page]?.parts[0];this.view.anchor=first?{id:first.entry.id,offset:first.offset}:undefined;this.remember();
  this.renderContents();
  this.chrome(this.pages.length);this.rendered();
 }
 setContents(items:{label:string;select:()=>void}[]|(()=>{label:string;select:()=>void}[])){this.customContents=items;this.renderContents();}
 private renderContents(){
  const index=this.root!.querySelector<HTMLElement>('#book-index')!;
  const items=(typeof this.customContents==='function'?this.customContents():this.customContents)??this.entries.map(entry=>({label:entry.contentsLabel||entry.title||entry.id,select:()=>{this.view.anchor={id:entry.id,offset:0};this.layout();}}));
  index.innerHTML=`<h3>${names[this.view.section]} / contents</h3>${items.map((item,i)=>`<button data-book-jump="${i}">${esc(item.label)}</button>`).join('')}`;
  index.querySelectorAll<HTMLButtonElement>('[data-book-jump]').forEach(b=>b.onclick=()=>{index.hidden=true;this.root!.querySelector('#book-contents')!.setAttribute('aria-expanded','false');items[Number(b.dataset.bookJump)].select();});
 }
 private paintEditor(){
  this.narrow=matchMedia('(max-width:899px)').matches;
  const leaves=this.root!.querySelectorAll<HTMLElement>('.book-leaf');
  leaves.forEach((leaf,i)=>{leaf.hidden=this.narrow&&i!==this.view.page;leaf.querySelector('.book-running-head')!.textContent=i?'Notes / sketch & clippings':'Notes / writing';leaf.querySelector('.book-folio')!.textContent=i?'02':'01';});
  this.chrome(2);
  if(this.sheetNavigation){const n=this.sheetNavigation;
   this.root!.querySelector<HTMLButtonElement>('#book-prev')!.disabled=n.index===0&&(!this.narrow||this.view.page===0);
   this.root!.querySelector<HTMLButtonElement>('#book-next')!.disabled=n.index===n.total-1&&(!this.narrow||this.view.page===1);
   this.root!.querySelector('#book-position')!.textContent=`Sheet ${n.index+1} / ${n.total}${this.narrow?(this.view.page?' · sketch & clippings':' · writing'):''}`;
   leaves.forEach((leaf,i)=>leaf.querySelector('.book-folio')!.textContent=String(n.index*2+i+1).padStart(2,'0'));
  }
 }
 private turn(direction:number){
  if(this.editing&&this.sheetNavigation){
   if(this.narrow&&((direction>0&&this.view.page===0)||(direction<0&&this.view.page===1))){this.view.page+=direction;this.paintEditor();}
   else if(this.sheetNavigation.index+direction>=0&&this.sheetNavigation.index+direction<this.sheetNavigation.total)this.sheetNavigation.turn(direction);
   this.o.sound();this.animate(direction);return;
  }
  const step=this.narrow?1:2,total=this.editing?2:this.pages.length,next=this.view.page+direction*step;
  if(next<0||next>=total)return;
  this.view.page=next;this.view.anchor=undefined;this.o.sound();
  if(this.editing)this.paintEditor();else this.paint();
  this.animate(direction);
 }
 private animate(direction:number){
  this.root!.querySelectorAll<HTMLElement>('.book-leaf').forEach(leaf=>leaf.getAnimations().forEach(a=>a.cancel()));
  if(!document.body.classList.contains('reduced-motion')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){this.root!.querySelectorAll<HTMLElement>('.book-leaf:not([hidden])').forEach(leaf=>{leaf.getAnimations().forEach(a=>a.cancel());leaf.animate([{opacity:.65,transform:`translateX(${direction*7}px)`},{opacity:1,transform:'none'}],{duration:140,easing:'ease-out'});});}
 }
 dispose(){this.flush();this.remember();cancelAnimationFrame(this.frame);this.resize?.disconnect();this.mutation?.disconnect();this.root=undefined;this.editing=false;}
}
