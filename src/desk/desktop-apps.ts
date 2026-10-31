import type { Save } from '../types';
import type { Archive } from '../content/generator';
import type { Contact, DesktopApp } from './types';
import { escapeHtml as esc } from '../ui/dom';
import { reference } from '../archive';
import { printerOriginal } from '../inventory';
import { officeFor } from '../office-state';
import { physicalFor } from '../physical';
import { createNote, deskFor } from './state';
import { CONTACTS, CASES } from './content';
import { DIGITAL_FILES, DIGITAL_FOLDERS, digitalLock, type DigitalFolder } from './digital-files';
interface DesktopOptions {
 save:()=>Save; archive:()=>Archive; show:(app:DesktopApp,title:string,html:string)=>void;
 cleanup:(fn:()=>void)=>void; write:()=>void; notify:(s:string)=>void;
 mail:(contact:Contact,caseId:string)=>void; note:(id:number)=>void;
 printing:()=>boolean; printer:()=>void;
}
export class DesktopApps {
 private folder:DigitalFolder|undefined; private query='';
 constructor(private o:DesktopOptions){}
 open(app:DesktopApp,file?:string){if(app==='files')this.files(file);if(app==='directory')this.directory();if(app==='print')this.print();if(app==='snake')void this.snake();}
 private files(id?:string){
  if(id){const file=DIGITAL_FILES.find(f=>f.id===id);if(file)this.folder=file.folder;}
  const save=this.o.save(),archive=this.o.archive(),selected=DIGITAL_FILES.find(f=>f.id===id),lock=selected?digitalLock(selected,save,archive):undefined;
  const list=DIGITAL_FILES.filter(f=>(!this.folder||f.folder===this.folder)&&(!this.query||f.name.toLowerCase().includes(this.query.toLowerCase())));
  this.o.show('files','File cabinet',`<div class="pc-files"><nav class="pc-breadcrumb" aria-label="File location"><button id="files-home">Local disk</button>${this.folder?`<span>/</span><button id="files-folder">${esc(this.folder)}</button>`:''}${selected?`<span>/ ${esc(selected.name)}</span>`:''}</nav><form id="file-search"><label>Find a filename <input id="file-query" maxlength="100" value="${esc(this.query)}"></label><button>Search</button></form><div class="pc-file-workspace"><nav class="pc-folder-tree" aria-label="Disk folders">${DIGITAL_FOLDERS.map(folder=>`<button data-digital-folder="${folder}" ${this.folder===folder?'class="selected" aria-current="page"':''}>▱ ${folder}</button>`).join('')}</nav><section class="pc-file-content">${selected?`<button id="files-back">← Back to folder</button><h3>${esc(selected.name)}</h3>${lock?`<p class="pc-file-lock">Locked · ${esc(lock)}</p>`:`<p class="digital-source">DIGITAL DRAFT · A lead, not physical evidence</p><div class="digital-body">${esc(selected.body)}</div>${selected.table?`<div class="digital-table-scroll"><table><thead><tr>${selected.table[0].map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${selected.table.slice(1).map(row=>`<tr>${row.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:''}<button id="clip-digital">Clip to notebook</button>${selected.caseId?`<button id="digital-enquire">Ask about this case ↗</button>`:''}`}`:`<p class="digital-source">${list.length} files · Local copies / retain originals</p><div class="pc-file-list">${list.map(f=>`<button data-digital-file="${f.id}"><span>▤ ${esc(f.name)}</span><small>${digitalLock(f,save,archive)?'LOCKED · open a case record':esc(f.folder)}</small></button>`).join('')||'<p>No filenames match. Try another folder or a shorter name.</p>'}</div>`}</section></div></div>`);
  document.querySelector<HTMLButtonElement>('#files-home')!.onclick=()=>{this.folder=undefined;this.query='';this.files();};
  const back=()=>this.files();document.querySelector<HTMLButtonElement>('#files-folder')?.addEventListener('click',back);document.querySelector<HTMLButtonElement>('#files-back')?.addEventListener('click',back);
  document.querySelectorAll<HTMLButtonElement>('[data-digital-folder]').forEach(b=>b.onclick=()=>{this.folder=b.dataset.digitalFolder as DigitalFolder;this.query='';this.files();});
  document.querySelectorAll<HTMLButtonElement>('[data-digital-file]').forEach(b=>b.onclick=()=>this.files(b.dataset.digitalFile));
  document.querySelector<HTMLFormElement>('#file-search')!.onsubmit=e=>{e.preventDefault();this.query=document.querySelector<HTMLInputElement>('#file-query')!.value.trim();this.files();};
  document.querySelector<HTMLButtonElement>('#clip-digital')?.addEventListener('click',()=>{if(!selected||digitalLock(selected,this.o.save(),this.o.archive()))return;const note=createNote(this.o.save());if(!note){this.o.notify('Your notebook is full. Recycle a sheet or order stationery.');return;}note.title=`Digital · ${selected.name}`.slice(0,100);note.digitalExcerpt={id:selected.id,label:`DIGITAL / ${selected.folder} / ${selected.name}`,text:[selected.body,...(selected.table??[]).map(r=>r.join(' | '))].join('\n').slice(0,6000)};this.o.write();this.o.note(note.id);});
  document.querySelector<HTMLButtonElement>('#digital-enquire')?.addEventListener('click',()=>{const c=CASES.find(c=>c.id===selected?.caseId);if(c)this.o.mail(c.contact,c.id);});
 }
 private directory(){
  const descriptions:Record<Contact,string>={tess:'Archive context, lunch incidents and the catering forecast. Knows where the second account is filed.',accounts:'Payroll, refreshments and arithmetic that somebody hoped would go unnoticed.',facilities:'Repairs, equipment and promises about availability.',martin:'Survey methodology and the revised assessment. Prefers questions with attached context.'};
  this.o.show('directory','Office directory',`<div class="pc-directory">${Object.entries(CONTACTS).map(([id,name])=>`<article><span class="pc-directory-initial">${name[0]}</span><div><h3>${esc(name)}</h3><p>${esc(descriptions[id as Contact])}</p>${CASES.filter(c=>c.contact===id).map(c=>`<button data-directory-case="${c.id}">${esc(c.title)} ↗</button>`).join('')}${id==='martin'?'<button data-directory-case="martin">The revised assessment ↗</button>':''}</div></article>`).join('')}</div>`);
  document.querySelectorAll<HTMLButtonElement>('[data-directory-case]').forEach(b=>b.onclick=()=>{const id=b.dataset.directoryCase!,c=CASES.find(c=>c.id===id);this.o.mail(c?.contact??'martin',id);});
 }
 private print(){
  this.o.show('print','Local printer queue','<div class="pc-print-queue"><h3>R&R Duplicator / Local connection</h3><p id="desktop-print-status" role="status"></p><dl><dt>Original feed</dt><dd id="desktop-print-input"></dd><dt>Output tray</dt><dd id="desktop-print-output"></dd></dl><p>One physical job at a time. Insert a retained original and collect its copy at the printer. Digital drafts cannot substitute for original evidence.</p><button id="desktop-printer">Open printer controls ↗</button></div>');
  const refresh=()=>{const save=this.o.save(),input=printerOriginal(physicalFor(save)),output=officeFor(save).printedFile;document.querySelector('#desktop-print-status')!.textContent=this.o.printing()?'Printing…':output!==null?'Copy ready for collection':'Printer ready';document.querySelector('#desktop-print-input')!.textContent=input===null?'Empty':reference(input);document.querySelector('#desktop-print-output')!.textContent=output===null?'Empty':reference(output);};refresh();const timer=setInterval(refresh,500);this.o.cleanup(()=>clearInterval(timer));document.querySelector<HTMLButtonElement>('#desktop-printer')!.onclick=this.o.printer;
 }
 private async snake(){
  this.o.show('snake','Snake / Lunch-break league','<div id="snake-host" class="pc-snake"><p role="status">Opening Snake…</p></div>');
  const host=document.querySelector<HTMLElement>('#snake-host')!;let cancelled=false,dispose=()=>{};
  this.o.cleanup(()=>{cancelled=true;dispose();});
  try{const {mountSnake}=await import('./snake');if(cancelled||!host.isConnected)return;dispose=mountSnake(host,deskFor(this.o.save()).snakeBest,score=>{deskFor(this.o.save()).snakeBest=score;this.o.write();});}
  catch{if(!cancelled)host.innerHTML='<p>Snake could not load. Reopen it from the taskbar to retry.</p>';}
 }
}
