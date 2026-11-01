import {escapeHtml as esc} from './dom';
import '../styles/folder.css';
export interface FolderView { reference:string; location:string; paper:string; navigation?:string; tools?:string; extra?:string; phase?:'ready'|'loading'|'error' }
/** One continuous jacket carries the paper and its working tools on the right flap. */
export function folderFrame(view:FolderView){
 return `<section class="reader physical-folder" role="dialog" aria-modal="true" aria-label="Original file folder" data-phase="${view.phase??'ready'}"><div class="reader-main"><div class="folder-jacket-label"><span>ORIGINAL FILE / ${esc(view.reference)}</span><small>${esc(view.location)}</small></div><div class="folder-paper-stack"><div class="paper-scroll" tabindex="0" ${view.phase==='loading'?'aria-busy="true"':''}>${view.paper}</div></div><footer class="reader-footer">${view.navigation??''}</footer></div><aside class="folder-workspace" aria-label="Folder tools"><div class="drawer-context"><button data-drawer-back aria-label="Return folder to drawer">← Return to drawer</button><span>${esc(view.reference)}</span></div>${view.tools?`<div class="reader-actions">${view.tools}</div>`:''}${view.extra??''}</aside></section>`;
}
