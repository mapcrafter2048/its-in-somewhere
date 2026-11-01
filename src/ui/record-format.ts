import type { ArchiveDocument } from '../types';
import { escapeHtml as esc } from './dom';

/** Shared by originals, comparison and paper copies. Text remains selectable. */
export function recordFormat(doc:ArchiveDocument){
 const p=doc.presentation;if(!p)return '';
 const diagram=p.diagram;
 let graphic='';
 if(diagram?.kind==='chart'){
  const values=diagram.values??[],max=Math.max(1,...values);
  graphic=`<figure class="record-figure"><svg viewBox="0 0 480 180" role="img" aria-label="${esc(doc.title)} — values in the adjacent table"><path d="M30 10V150H470" fill="none" stroke="currentColor"/>${values.map((v,i)=>`<rect x="${55+i*102}" y="${150-v/max*120}" width="54" height="${v/max*120}" fill="currentColor" opacity=".65"/><text x="${82+i*102}" y="170" text-anchor="middle">${esc(diagram.labels[i]??String(i+1))}</text><text x="${82+i*102}" y="${142-v/max*120}" text-anchor="middle">${v}</text>`).join('')}</svg><figcaption>Recorded counts · text and table retained below</figcaption></figure>`;
 }else if(diagram?.kind==='plan'){
  graphic=`<figure class="record-figure record-plan-diagram"><svg viewBox="0 0 600 140" role="img" aria-label="${esc(diagram.labels.join(' → '))}">${diagram.labels.map((label,i)=>`<rect x="${i*200+5}" y="20" width="180" height="70" fill="none" stroke="currentColor" stroke-width="2"/><text x="${i*200+95}" y="61" text-anchor="middle">${esc(label)}</text>${i<2?`<path d="M${i*200+185} 55h20l-6 -5m6 5l-6 5" fill="none" stroke="currentColor"/>`:''}`).join('')}</svg><figcaption>Historical diagram · boxes indicate rooms or teams; arrows indicate recorded flow.</figcaption><p class="record-diagram-text">${esc(diagram.labels.join(' → '))}</p></figure>`;
 }
 const table=p.table?`<div class="record-table-scroll"><table class="record-table"><caption>${esc(p.register)} · retained data</caption><thead><tr>${p.table.columns.map(c=>`<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${p.table.rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'';
 return `<section class="record-format record-${p.family}" aria-label="${esc(p.family)} record"><div class="record-register">${esc(p.family.toUpperCase())} / ${esc(p.register)}</div><dl class="record-fields">${p.fields.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>${p.revision?`<div class="record-revision-stamp"><strong>${esc(p.revision.series)}</strong><span>${esc(p.revision.version)}</span><small>Earlier issues remain retained.</small></div>`:''}${graphic}${table}${p.annotation?`<aside class="record-handwriting"><span>Handwritten annotation · readable transcription</span><p>${esc(p.annotation)}</p></aside>`:''}${p.family==='damaged'?'<p class="record-transcript-label">READABLE TRANSCRIPTION · The full retained wording follows. No reconstruction required.</p>':''}</section>`;
}

/** Canonical page text is unchanged; contract clauses get their own readable lines. */
export function recordParagraphs(doc:ArchiveDocument,text:string,paint:(escaped:string)=>string=value=>value){
 const blocks=text.split('\n\n').flatMap(block=>doc.presentation?.family==='contract'?block.split(/(?=\b[1-9]\.\s)/):[block]);
 return blocks.filter(Boolean).map(block=>`<p${doc.presentation?.family==='contract'?' class="record-clause"':''}>${paint(esc(block))}</p>`).join('');
}
